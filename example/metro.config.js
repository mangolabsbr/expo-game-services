// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// The module source in `../src` must resolve `expo`, `react` and `react-native`
// from this app, never from the package's own node_modules (its dev tooling),
// or two copies of expo-modules-core would be loaded at runtime.
config.resolver.blockList = [
  ...Array.from(config.resolver.blockList ?? []),
  new RegExp(`^${escapeRegExp(path.resolve(__dirname, '..', 'node_modules'))}/.*`),
];

config.resolver.nodeModulesPaths = [path.resolve(__dirname, './node_modules')];

config.resolver.extraNodeModules = {
  '@mangolabs/expo-game-services': '..',
};

config.watchFolders = [path.resolve(__dirname, '..')];

config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = config;
