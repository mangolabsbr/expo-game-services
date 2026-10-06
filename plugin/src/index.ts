import {
  AndroidConfig,
  type ConfigPlugin,
  createRunOncePlugin,
  WarningAggregator,
  withAndroidManifest,
  withEntitlementsPlist,
  withStringsXml,
} from 'expo/config-plugins';

const pkg: { name: string; version: string } = require('../../package.json');

export type GameServicesPluginProps = {
  /**
   * The Play Games Services project id (a numeric string) from the Play
   * Console, under "Play Games Services > Setup and management > Configuration".
   * Without it the module reports `isAvailable() === false` on Android.
   */
  androidAppId?: string;
};

const APP_ID_META_DATA = 'com.google.android.gms.games.APP_ID';
// The id is referenced through a string resource because a numeric
// `android:value` would be parsed as an integer and overflow.
const APP_ID_RESOURCE = 'game_services_project_id';

const withGameCenterEntitlement: ConfigPlugin = (config) =>
  withEntitlementsPlist(config, (config) => {
    config.modResults['com.apple.developer.game-center'] = true;
    return config;
  });

const withPlayGamesAppId: ConfigPlugin<string> = (config, appId) => {
  config = withStringsXml(config, (config) => {
    config.modResults = AndroidConfig.Strings.setStringItem(
      [{ _: appId, $: { name: APP_ID_RESOURCE, translatable: 'false' } }],
      config.modResults
    );
    return config;
  });

  return withAndroidManifest(config, (config) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(
      application,
      APP_ID_META_DATA,
      `@string/${APP_ID_RESOURCE}`
    );
    return config;
  });
};

const withGameServices: ConfigPlugin<GameServicesPluginProps | void> = (config, props) => {
  config = withGameCenterEntitlement(config);

  const androidAppId = props?.androidAppId;
  if (androidAppId) {
    if (!/^\d+$/.test(androidAppId)) {
      throw new Error(
        `[${pkg.name}] androidAppId must be the numeric Play Games project id, received ${JSON.stringify(androidAppId)}`
      );
    }
    config = withPlayGamesAppId(config, androidAppId);
  } else {
    WarningAggregator.addWarningAndroid(
      pkg.name,
      'No androidAppId was provided, so Play Games Services will be unavailable on Android.'
    );
  }

  return config;
};

export default createRunOncePlugin(withGameServices, pkg.name, pkg.version);
