// Reexport the native module. On web, it will be resolved to ExpoGameServicesModule.web.ts
// and on native platforms to ExpoGameServicesModule.ts
export { default } from './ExpoGameServicesModule';
export * from './ExpoGameServices.types';
