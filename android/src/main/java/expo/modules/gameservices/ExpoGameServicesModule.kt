package expo.modules.gameservices

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoGameServicesModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoGameServices")

    Events("onChange")

    AsyncFunction("setValueAsync") { value: String ->
      sendEvent("onChange", mapOf(
        "value" to value
      ))
    }
  }
}
