package expo.modules.gameservices

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import com.google.android.gms.games.PlayGames
import com.google.android.gms.games.PlayGamesSdk
import com.google.android.gms.games.Player
import com.google.android.gms.tasks.Task
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoGameServicesModule : Module() {
  /** Promise of the native UI currently shown, resolved when it closes. */
  private var pendingUi: Promise? = null

  override fun definition() = ModuleDefinition {
    Name("ExpoGameServices")

    Events("onAuthStateChange")

    OnCreate {
      val context = appContext.reactContext ?: return@OnCreate
      // Without the APP_ID meta-data the SDK throws on first use, so apps
      // that did not configure Play Games are left untouched.
      if (hasAppId(context)) {
        PlayGamesSdk.initialize(context)
      }
    }

    OnActivityResult { _, payload ->
      if (payload.requestCode == REQUEST_CODE_UI) {
        pendingUi?.resolve(null)
        pendingUi = null
      }
    }

    Function("isAvailable") {
      appContext.reactContext?.let { hasAppId(it) } ?: false
    }

    AsyncFunction("isAuthenticated") { promise: Promise ->
      val activity = activityOrReject(promise) ?: return@AsyncFunction
      PlayGames.getGamesSignInClient(activity).isAuthenticated().addOnCompleteListener { task ->
        promise.resolve(task.isSuccessful && task.result.isAuthenticated)
      }
    }

    AsyncFunction("signIn") { promise: Promise ->
      val activity = activityOrReject(promise) ?: return@AsyncFunction
      PlayGames.getGamesSignInClient(activity).signIn().addOnCompleteListener { task ->
        val authenticated = task.isSuccessful && task.result.isAuthenticated
        if (!authenticated) {
          val message = task.exception?.message ?: "The user did not sign in to Play Games"
          settleAuth(authState(false, null, message), promise)
          return@addOnCompleteListener
        }
        loadPlayer(activity) { player -> settleAuth(authState(true, player, null), promise) }
      }
    }

    AsyncFunction("getPlayer") { promise: Promise ->
      val activity = activityOrReject(promise) ?: return@AsyncFunction
      loadPlayer(activity) { player -> promise.resolve(player?.let { playerInfo(it) }) }
    }

    AsyncFunction("submitScore") { leaderboardId: String, score: Long, promise: Promise ->
      val activity = activityOrReject(promise) ?: return@AsyncFunction
      requireSignedIn(activity, promise) {
        PlayGames.getLeaderboardsClient(activity)
          .submitScoreImmediate(leaderboardId, score)
          .settle(promise)
      }
    }

    AsyncFunction("showLeaderboard") { leaderboardId: String?, promise: Promise ->
      val activity = activityOrReject(promise) ?: return@AsyncFunction
      requireSignedIn(activity, promise) {
        val client = PlayGames.getLeaderboardsClient(activity)
        val intent =
          if (leaderboardId != null) client.getLeaderboardIntent(leaderboardId)
          else client.allLeaderboardsIntent
        showUi(activity, intent, promise)
      }
    }

    AsyncFunction("unlockAchievement") { achievementId: String, promise: Promise ->
      val activity = activityOrReject(promise) ?: return@AsyncFunction
      requireSignedIn(activity, promise) {
        PlayGames.getAchievementsClient(activity).unlockImmediate(achievementId).settle(promise)
      }
    }

    AsyncFunction("setAchievementProgress") {
      achievementId: String, steps: Int, _totalSteps: Int, promise: Promise ->
      val activity = activityOrReject(promise) ?: return@AsyncFunction
      requireSignedIn(activity, promise) {
        PlayGames.getAchievementsClient(activity)
          .setStepsImmediate(achievementId, steps)
          .settle(promise)
      }
    }

    AsyncFunction("showAchievements") { promise: Promise ->
      val activity = activityOrReject(promise) ?: return@AsyncFunction
      requireSignedIn(activity, promise) {
        showUi(activity, PlayGames.getAchievementsClient(activity).achievementsIntent, promise)
      }
    }
  }

  private fun activityOrReject(promise: Promise): Activity? {
    val context = appContext.reactContext
    if (context == null || !hasAppId(context)) {
      promise.reject(NotConfiguredException())
      return null
    }
    val activity = appContext.currentActivity
    if (activity == null) {
      promise.reject(NoActivityException())
    }
    return activity
  }

  private fun requireSignedIn(activity: Activity, promise: Promise, body: () -> Unit) {
    PlayGames.getGamesSignInClient(activity).isAuthenticated().addOnCompleteListener { task ->
      if (task.isSuccessful && task.result.isAuthenticated) {
        body()
      } else {
        promise.reject(NotAuthenticatedException())
      }
    }
  }

  private fun loadPlayer(activity: Activity, onLoaded: (Player?) -> Unit) {
    PlayGames.getPlayersClient(activity).currentPlayer.addOnCompleteListener { task ->
      onLoaded(if (task.isSuccessful) task.result else null)
    }
  }

  private fun showUi(activity: Activity, intentTask: Task<Intent>, promise: Promise) {
    if (pendingUi != null) {
      promise.reject(UiAlreadyShownException())
      return
    }
    intentTask.addOnCompleteListener { task ->
      if (!task.isSuccessful) {
        promise.reject(GameServicesException(task.exception))
        return@addOnCompleteListener
      }
      pendingUi = promise
      activity.startActivityForResult(task.result, REQUEST_CODE_UI)
    }
  }

  private fun settleAuth(state: Map<String, Any?>, promise: Promise) {
    sendEvent("onAuthStateChange", state)
    promise.resolve(state)
  }

  private fun <T> Task<T>.settle(promise: Promise) {
    addOnCompleteListener { task ->
      if (task.isSuccessful) {
        promise.resolve(null)
      } else {
        promise.reject(GameServicesException(task.exception))
      }
    }
  }

  private fun playerInfo(player: Player): Map<String, Any?> =
    mapOf("id" to player.playerId, "displayName" to player.displayName)

  private fun authState(isAuthenticated: Boolean, player: Player?, error: String?): Map<String, Any?> {
    val state = mutableMapOf<String, Any?>(
      "isAuthenticated" to isAuthenticated,
      "player" to player?.let { playerInfo(it) }
    )
    if (error != null) state["error"] = error
    return state
  }

  private fun hasAppId(context: Context): Boolean {
    val info = context.packageManager.getApplicationInfo(context.packageName, PackageManager.GET_META_DATA)
    return !info.metaData?.getString(APP_ID_META_DATA).isNullOrEmpty()
  }

  companion object {
    private const val APP_ID_META_DATA = "com.google.android.gms.games.APP_ID"
    private const val REQUEST_CODE_UI = 0x6753
  }
}

private class NotConfiguredException :
  CodedException("Play Games is not configured: set androidAppId in the @mangolabs/expo-game-services config plugin")

private class NoActivityException : CodedException("There is no current activity")

private class NotAuthenticatedException :
  CodedException("The local player is not signed in to Play Games")

private class UiAlreadyShownException : CodedException("A Play Games screen is already being shown")

private class GameServicesException(cause: Throwable?) :
  CodedException(cause?.message ?: "Play Games request failed", cause)
