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
const version = '0.1.0'; // Set version to 0.1.0
const buildNumber = '1'; // Set buildNumber to 1, which will be used for versionCode

module.exports = {
  name: 'AI Assistant',
  slug: 'ai-assistant-app',
  owner: process.env.EXPO_OWNER || 'ai-assistant-team', // Keep owner or use a default
  version,
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic', // Can be 'light', 'dark', or 'automatic'
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
    bundleIdentifier: process.env.BUNDLE_ID || 'com.sigmamobi.aihelpers', // Consistent bundle ID
    buildNumber, // iOS build number
    config: {
      usesNonExemptEncryption: false // Default, adjust if needed
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff'
    },
    package: 'com.sigmamobi.aihelpers', // Set package name for Android
    versionCode: parseInt(buildNumber), // Android versionCode
    permissions: [ // Common permissions, adjust as needed
      "android.permission.INTERNET",
      "android.permission.ACCESS_NETWORK_STATE"
    ],
    // Configuration for local APK build (optional, as EAS is preferred)
    // buildType: "apk", // or "bundle" for AAB
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro'
  },
  plugins: [
    'expo-localization' // Keep existing plugins
  ],
  extra: {
    // Make environment variables available in the app
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    appEnv: ENV,
    eas: {
      projectId: process.env.EAS_PROJECT_ID || 'ai-assistant-app', // Your EAS Project ID
      // Configuration for EAS Build can be extensive and is often in eas.json
      // However, some build-related flags or environment variables can be set here
      // if needed by the build process.
      build: {
        // Example: Define a build profile for APK
        development: {
          distribution: 'internal', // For internal testing APK
          android: {
            buildType: 'apk',
            // gradleCommand: ':app:assembleRelease', // Or assembleDebug
            // You can add more specific Android build configurations here
          },
          // env: { // Environment variables specific to this build profile
          //   MY_BUILD_VARIABLE: "some_value"
          // }
        },
        preview: {
          distribution: 'internal',
          android: {
            buildType: 'apk',
          },
        },
        production: {
          distribution: 'store', // For Play Store AAB
          android: {
            buildType: 'app-bundle', // AAB for Play Store
          },
        }
      }
    }
  },
  updates: {
    fallbackToCacheTimeout: 0, // How long to wait for new update before falling back to cached version
    url: process.env.EXPO_UPDATE_URL // URL for Expo Updates, if used
  },
  runtimeVersion: {
    policy: 'sdkVersion' // Or 'nativeVersion' if you manage native code changes
  }
};
