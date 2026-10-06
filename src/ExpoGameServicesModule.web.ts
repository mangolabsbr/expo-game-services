import { registerWebModule, NativeModule } from 'expo';

import { ExpoGameServicesModuleEvents } from './ExpoGameServices.types';

// ExpoGameServicesModule is not available on the web platform.
class ExpoGameServicesModule extends NativeModule<ExpoGameServicesModuleEvents> {}

export default registerWebModule(ExpoGameServicesModule, 'ExpoGameServicesModule');
