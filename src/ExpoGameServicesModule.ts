import { NativeModule, requireNativeModule } from 'expo';

import { ExpoGameServicesModuleEvents } from './ExpoGameServices.types';

declare class ExpoGameServicesModule extends NativeModule<ExpoGameServicesModuleEvents> {
  setValueAsync(value: string): Promise<void>;
}

export default requireNativeModule<ExpoGameServicesModule>('ExpoGameServices');
