const appJson = require('./app.json');

const FIREBASE_ENV_CONFIG = {
  dev: {
    iosBundleIdentifier: 'com.meetstick.app.dev',
    iosGoogleServicesFile: './GoogleService-Info-Dev.plist',
    androidPackage: 'com.meetstick.app',
    androidGoogleServicesFile: './google-services-dev.json',
  },
  test: {
    iosBundleIdentifier: 'com.meetstick.app.beta',
    iosGoogleServicesFile: './GoogleService-Info-Test.plist',
    androidPackage: 'com.meetstick.app',
    androidGoogleServicesFile: './google-services-test.json',
  },
  prod: {
    iosBundleIdentifier: 'com.meetstick.app',
    iosGoogleServicesFile: './GoogleService-Info-Prod.plist',
    androidPackage: 'com.meetstick.app',
    androidGoogleServicesFile: './google-services-prod.json',
  },
};

function resolveBuildEnv() {
  const profile = (process.env.EAS_BUILD_PROFILE || process.env.APP_ENV || 'production').toLowerCase();

  if (profile === 'development' || profile === 'dev') {
    return 'dev';
  }

  if (profile === 'preview' || profile === 'test') {
    return 'test';
  }

  return 'prod';
}

function upsertPlugin(plugins, entry) {
  const name = Array.isArray(entry) ? entry[0] : entry;
  const filtered = plugins.filter((plugin) => {
    const pluginName = Array.isArray(plugin) ? plugin[0] : plugin;
    return pluginName !== name;
  });

  filtered.push(entry);
  return filtered;
}

module.exports = ({ config }) => {
  const buildEnv = resolveBuildEnv();
  const firebaseConfig = FIREBASE_ENV_CONFIG[buildEnv];
  const expoConfig = {
    ...(appJson.expo || {}),
    ...(config || {}),
  };

  let plugins = [...(expoConfig.plugins || [])];
  plugins = upsertPlugin(plugins, 'expo-build-properties');
  plugins = upsertPlugin(plugins, '@react-native-firebase/app');
  plugins = upsertPlugin(plugins, '@react-native-firebase/crashlytics');
  plugins = upsertPlugin(plugins, [
    'expo-build-properties',
    {
      ios: {
        useFrameworks: 'static',
        forceStaticLinking: ['RNFBApp', 'RNFBCrashlytics'],
      },
    },
  ]);

  return {
    ...expoConfig,
    plugins,
    ios: {
      ...(expoConfig.ios || {}),
      bundleIdentifier: firebaseConfig.iosBundleIdentifier,
      googleServicesFile: firebaseConfig.iosGoogleServicesFile,
    },
    android: {
      ...(expoConfig.android || {}),
      package: firebaseConfig.androidPackage,
      googleServicesFile: firebaseConfig.androidGoogleServicesFile,
    },
  };
};
