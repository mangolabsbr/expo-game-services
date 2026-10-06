import ExpoModulesCore

public class ExpoGameServicesModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoGameServices")

    Events("onChange")

    AsyncFunction("setValueAsync") { (value: String) in
      self.sendEvent("onChange", [
        "value": value
      ])
    }
  }
}
