const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Environment-specific configurations
const ENV = process.env.EXPO_PUBLIC_APP_ENV || 'development';
const envPath = path.resolve(__dirname, `.env${ENV === 'development' ? '' : `.${ENV}`}`);

// Load environment-specific variables
dotenv.config({ path: envPath });

// Default app version and build number
const version = process.env.VERSION || '0.1.0';
const buildNumber = process.env.BUILD_NUMBER || '1';

module.exports = {
  name: 'AI Assistant',
  slug: 'ai-assistant-app',
  owner: process.env.EXPO_OWNER || 'ai-assistant-team',
  version,
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  assetBundlePatterns: [
    '**/*'
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: process.env.BUNDLE_ID || 'com.yourcompany.aiassistant',
    buildNumber,
    config: {
      usesNonExemptEncryption: false
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff'
    },
    package: process.env.PACKAGE_NAME || 'com.yourcompany.aiassistant',
    versionCode: parseInt(buildNumber),
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro'
  },
  plugins: [
    'expo-localization'
  ],
  extra: {
    // Make environment variables available in the app
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    appEnv: ENV,
    eas: {
      projectId: process.env.EAS_PROJECT_ID || 'ai-assistant-app'
    }
  },
  updates: {
    fallbackToCacheTimeout: 0,
    url: process.env.EXPO_UPDATE_URL
  },
  runtimeVersion: {
    policy: 'sdkVersion'
  }
};
