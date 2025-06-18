# Building an Android APK with EAS Build

This guide will walk you through the process of building an Android APK (Android Package Kit) for your AI Assistant application using EAS Build. APKs are typically used for direct installation on Android devices, internal testing, or distribution outside of the Google Play Store.

## Prerequisites

Before you begin, ensure you have the following set up:

1.  **EAS CLI Installed and Logged In**:
    *   You should have already installed EAS CLI (`npm install -g eas-cli`).
    *   You should be logged into your Expo account via EAS CLI (`eas login`).
2.  **Project Configured for EAS**:
    *   Your project should be configured for EAS builds (`eas build:configure` should have been run, which creates/updates `eas.json`).
3.  **Android Configuration**:
    *   Your `app.config.js` file should have the necessary Android-specific configurations, such as `package` name, `versionCode`, `adaptiveIcon`, and `permissions`.
    ```javascript
    // Example from app.config.js
    // ...
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff'
      },
      package: 'com.sigmamobi.aihelpers', // Your unique package name
      versionCode: 1, // Increment for each new build submitted to the store
      permissions: [
        "android.permission.INTERNET",
        "android.permission.ACCESS_NETWORK_STATE"
      ],
    },
    // ...
    ```
4.  **Environment Variables & Secrets (if applicable for the build)**:
    *   If your build process requires environment variables (e.g., API keys for a staging environment), ensure they are set up as EAS Secrets for the relevant build profile. You can manage secrets with `eas secrets:create MY_VARIABLE` and `eas secrets:list`.

## Understanding Build Profiles in `eas.json`

EAS Build uses profiles defined in your `eas.json` file to configure different types of builds. For our project, we have three main profiles: `development`, `preview`, and `production`.

```json
// eas.json (relevant parts)
{
  "build": {
    "development": {
      "channel": "development",
      "distribution": "internal",
      "developmentClient": true, // Builds a development client
      "android": {
        "buildType": "apk",     // Outputs an APK
        "image": "latest",
        "gradleCommand": ":app:assembleDebug" // Builds a debug version
      },
      "env": {
        "EXPO_PUBLIC_APP_ENV": "development"
      }
    },
    "preview": {
      "channel": "preview",
      "distribution": "internal",
      "android": {
        "buildType": "apk",     // Outputs an APK
        "image": "latest",
        "gradleCommand": ":app:assembleRelease" // Builds a release version
      },
      "env": {
        "EXPO_PUBLIC_APP_ENV": "staging"
      }
    },
    "production": {
      "channel": "production",
      "distribution": "store",
      "android": {
        "buildType": "bundle",  // Outputs an AAB (Android App Bundle) for the Play Store
        "image": "latest",
        "gradleCommand": ":app:bundleRelease"
      },
      "env": {
        "EXPO_PUBLIC_APP_ENV": "production"
      }
    }
  }
  // ...
}
```

*   **`development` Profile**:
    *   **Purpose**: For local development and debugging.
    *   **`developmentClient: true`**: Builds a custom development client that includes Expo's development tools, allowing you to load your JavaScript bundle from your local machine.
    *   **`distribution: "internal"`**: The build artifact is intended for internal distribution (e.g., to your team).
    *   **`android.buildType: "apk"`**: Specifies that an APK file should be generated.
    *   **`android.gradleCommand: ":app:assembleDebug"`**: Instructs Gradle to build the debug variant of your app.
    *   **`env.EXPO_PUBLIC_APP_ENV: "development"`**: Sets an environment variable for this specific build.

*   **`preview` Profile**:
    *   **Purpose**: For internal testing, QA, and sharing with stakeholders. This build is closer to a production build.
    *   **`distribution: "internal"`**: Similar to development, for internal sharing.
    *   **`android.buildType: "apk"`**: Generates an APK.
    *   **`android.gradleCommand: ":app:assembleRelease"`**: Instructs Gradle to build the release (unsigned or signed by EAS) variant of your app.
    *   **`env.EXPO_PUBLIC_APP_ENV: "staging"`**: Sets a staging environment variable.

*   **`production` Profile**:
    *   **Purpose**: For submitting your app to the Google Play Store.
    *   **`distribution: "store"`**: The build artifact is intended for store submission.
    *   **`android.buildType: "bundle"`**: Generates an AAB (Android App Bundle), which is the required format for new apps on the Google Play Store.
    *   **Note**: This guide focuses on building APKs. If you need an APK for production (e.g., for direct distribution), you would need to adjust this profile or create a new one with `buildType: "apk"`.

## Building the APK using EAS Build

To build an APK, you will use the `eas build` command, specifying the platform (`android`) and the desired profile.

1.  **For a `development` APK (with dev tools)**:
    ```bash
    eas build -p android --profile development
    ```

2.  **For a `preview` APK (release-like build for testing)**:
    ```bash
    eas build -p android --profile preview
    ```

**What happens after running the command?**

*   The EAS CLI will ask you a few questions (like whether you want to set up push notifications, which you can skip for now if not needed).
*   It will then upload your project code to EAS Build servers.
*   Your build will be placed in a queue.
*   The CLI will provide a link to the build progress page on the EAS website (e.g., `https://expo.dev/accounts/your-account/projects/your-project/builds/build-id`). You can monitor the build status here.
*   The build process can take several minutes, depending on the queue and the complexity of your app.

## Accessing Your APK

Once the build is complete:

1.  **EAS Dashboard**: You can download the APK directly from the build details page on the EAS website (the link provided in your terminal).
2.  **QR Code/Link**: For internal distribution builds, EAS often provides a QR code or a direct link that you can use to download the APK onto a device.

## Installing the APK on an Android Device

To install an APK file on an Android device:

1.  **Enable "Install from unknown sources"**:
    *   On the Android device, go to **Settings**.
    *   Navigate to **Apps** > **Special app access** (or search for "unknown sources").
    *   Find your browser or file manager app and allow it to install apps from unknown sources. The exact path may vary depending on the Android version and manufacturer.
2.  **Transfer the APK to the Device**:
    *   **USB**: Connect the device to your computer and copy the APK file to the device's storage.
    *   **Download**: If you have a download link from EAS, open it in the device's browser.
    *   **Email/Cloud Storage**: Email the APK to yourself or upload it to a cloud storage service and download it on the device.
3.  **Install the APK**:
    *   Open a file manager app on the Android device.
    *   Navigate to the location where you saved/downloaded the APK file.
    *   Tap on the APK file.
    *   Follow the on-screen prompts to install the application.

## Troubleshooting Common Build Issues

Building mobile apps can sometimes be tricky. Here are some common issues and tips:

*   **Build Fails on EAS Servers**:
    *   **Always check the build logs on the EAS website first.** The logs provide detailed error messages that are crucial for diagnosing the problem. Look for `ERROR` or `FAILURE` messages, especially in the Gradle output section for Android.
*   **Environment Variables Not Set**:
    *   If your app relies on environment variables (like API keys), ensure they are correctly set as EAS Secrets for the build profile you are using. Use `eas secrets:list` to check and `eas secrets:create MY_VARIABLE` to add new ones.
    *   Verify the `env` section in your `eas.json` for the specific profile.
*   **Dependency Conflicts / Gradle Errors**:
    *   These are common in Android builds. The EAS build logs will usually point to the problematic library or configuration.
    *   Ensure all native dependencies are compatible with your Expo SDK version.
    *   Sometimes, cleaning the Gradle cache can help (EAS does this, but if you were building locally, `cd android && ./gradlew clean`).
*   **Plugin Configuration Errors**:
    *   If you're using Expo plugins, ensure they are correctly configured in your `app.config.js` file.
    *   Check the plugin's documentation for any Android-specific setup.
*   **"Unable to resolve module" errors**:
    *   This usually means a JavaScript module couldn't be found. Ensure the module is listed in your `package.json` and installed.
    *   If you use custom path aliases, check your `metro.config.js` and `babel.config.js`.
*   **Signing Issues**:
    *   For `development` and `preview` (internal distribution) builds, EAS can automatically handle app signing.
    *   For `production` builds intended for the store, you'll need to manage your Android Keystore (EAS can help generate or use an existing one). This is more relevant for AABs.
*   **Resource Not Found (e.g., images, fonts)**:
    *   Ensure all assets are correctly linked and included in the bundle. Check paths in your code and `assetBundlePatterns` in `app.config.js`.

## Next Steps

*   **Thoroughly test** the APK on various Android devices and OS versions.
*   If you built a `preview` APK, share it with your testers.
*   For submitting to the Google Play Store, you'll typically build an AAB (Android App Bundle) using the `production` profile:
    ```bash
    eas build -p android --profile production
    ```
    Then, you can use `eas submit -p android --latest` to upload it to the Play Store (requires additional setup like the Google Service Account JSON file specified in `eas.json`).

Building APKs is a crucial step in the development lifecycle for testing and distribution. EAS Build simplifies this process significantly for Expo projects.
