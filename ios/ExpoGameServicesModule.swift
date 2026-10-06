import ExpoModulesCore
import GameKit

public class ExpoGameServicesModule: Module {
  private var authObserver: NSObjectProtocol?
  private let presenter = GameCenterPresenter()

  public func definition() -> ModuleDefinition {
    Name("ExpoGameServices")

    Events("onAuthStateChange")

    OnCreate {
      self.authObserver = NotificationCenter.default.addObserver(
        forName: .GKPlayerAuthenticationDidChangeNotificationName,
        object: nil,
        queue: .main
      ) { [weak self] _ in
        self?.sendEvent("onAuthStateChange", Self.authState())
      }
    }

    OnDestroy {
      if let observer = self.authObserver {
        NotificationCenter.default.removeObserver(observer)
      }
    }

    Function("isAvailable") {
      return true
    }

    AsyncFunction("isAuthenticated") {
      return GKLocalPlayer.local.isAuthenticated
    }

    AsyncFunction("signIn") { (promise: Promise) in
      let player = GKLocalPlayer.local
      if player.isAuthenticated {
        promise.resolve(Self.authState())
        return
      }

      // GameKit may call the handler several times: once with a view
      // controller to present, then again with the outcome. Settle the
      // promise on the first call that carries an outcome.
      var settled = false
      player.authenticateHandler = { [weak self] viewController, error in
        if let viewController {
          guard let current = self?.appContext?.utilities?.currentViewController() else {
            if !settled {
              settled = true
              promise.reject(NoViewControllerException())
            }
            return
          }
          current.present(viewController, animated: true)
          return
        }
        if settled { return }
        settled = true
        promise.resolve(Self.authState(error: error))
      }
    }.runOnQueue(.main)

    AsyncFunction("getPlayer") { () -> [String: Any?]? in
      return Self.playerInfo()
    }

    AsyncFunction("submitScore") { (leaderboardId: String, score: Int, promise: Promise) in
      guard GKLocalPlayer.local.isAuthenticated else {
        promise.reject(NotAuthenticatedException())
        return
      }
      GKLeaderboard.submitScore(
        score,
        context: 0,
        player: GKLocalPlayer.local,
        leaderboardIDs: [leaderboardId]
      ) { error in
        if let error {
          promise.reject(GameServicesException(error))
        } else {
          promise.resolve()
        }
      }
    }

    AsyncFunction("showLeaderboard") { (leaderboardId: String?, promise: Promise) in
      let viewController: GKGameCenterViewController
      if let leaderboardId {
        viewController = GKGameCenterViewController(
          leaderboardID: leaderboardId,
          playerScope: .global,
          timeScope: .allTime
        )
      } else {
        viewController = GKGameCenterViewController(state: .leaderboards)
      }
      self.present(viewController, promise: promise)
    }.runOnQueue(.main)

    AsyncFunction("unlockAchievement") { (achievementId: String, promise: Promise) in
      self.report(achievementId, percentComplete: 100, promise: promise)
    }

    AsyncFunction("setAchievementProgress") {
      (achievementId: String, steps: Int, totalSteps: Int, promise: Promise) in
      let fraction = Double(steps) / Double(max(totalSteps, 1))
      let percent = min(100, max(0, fraction * 100))
      self.report(achievementId, percentComplete: percent, promise: promise)
    }

    AsyncFunction("showAchievements") { (promise: Promise) in
      self.present(GKGameCenterViewController(state: .achievements), promise: promise)
    }.runOnQueue(.main)
  }

  private func present(_ viewController: GKGameCenterViewController, promise: Promise) {
    guard GKLocalPlayer.local.isAuthenticated else {
      promise.reject(NotAuthenticatedException())
      return
    }
    guard let current = appContext?.utilities?.currentViewController() else {
      promise.reject(NoViewControllerException())
      return
    }
    presenter.present(viewController, from: current) {
      promise.resolve()
    }
  }

  private func report(_ achievementId: String, percentComplete: Double, promise: Promise) {
    guard GKLocalPlayer.local.isAuthenticated else {
      promise.reject(NotAuthenticatedException())
      return
    }
    let achievement = GKAchievement(identifier: achievementId)
    achievement.percentComplete = percentComplete
    achievement.showsCompletionBanner = true
    GKAchievement.report([achievement]) { error in
      if let error {
        promise.reject(GameServicesException(error))
      } else {
        promise.resolve()
      }
    }
  }

  private static func playerInfo() -> [String: Any?]? {
    let player = GKLocalPlayer.local
    guard player.isAuthenticated else { return nil }
    return [
      "id": player.gamePlayerID,
      "displayName": player.displayName,
      "alias": player.alias,
    ]
  }

  private static func authState(error: Error? = nil) -> [String: Any?] {
    var state: [String: Any?] = [
      "isAuthenticated": GKLocalPlayer.local.isAuthenticated,
      "player": playerInfo(),
    ]
    if let error {
      state["error"] = error.localizedDescription
    }
    return state
  }
}

/// Owns the delegate callback that dismisses `GKGameCenterViewController`.
private final class GameCenterPresenter: NSObject, GKGameCenterControllerDelegate {
  private var onFinish: (() -> Void)?

  func present(
    _ viewController: GKGameCenterViewController,
    from presenting: UIViewController,
    onFinish: @escaping () -> Void
  ) {
    self.onFinish = onFinish
    viewController.gameCenterDelegate = self
    presenting.present(viewController, animated: true)
  }

  func gameCenterViewControllerDidFinish(_ viewController: GKGameCenterViewController) {
    viewController.dismiss(animated: true) { [weak self] in
      let finish = self?.onFinish
      self?.onFinish = nil
      finish?()
    }
  }
}

private final class NotAuthenticatedException: Exception, @unchecked Sendable {
  override var reason: String {
    "The local player is not signed in to Game Center"
  }
}

private final class NoViewControllerException: Exception, @unchecked Sendable {
  override var reason: String {
    "There is no view controller to present Game Center UI from"
  }
}

private final class GameServicesException: GenericException<Error>, @unchecked Sendable {
  override var reason: String {
    param.localizedDescription
  }
}
