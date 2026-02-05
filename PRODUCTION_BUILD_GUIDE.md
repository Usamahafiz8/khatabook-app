# Production Build Guide

## Current Status
❌ **NOT ready for production** - Currently using debug build

## Steps to Build Production APK

### 1. Generate Release Keystore (One-time setup)

```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias release-key -keyalg RSA -keysize 2048 -validity 10000
```

**Important:** 
- Store the keystore file and passwords securely
- You'll need this keystore for all future updates
- If lost, you cannot update the app on Google Play Store

### 2. Configure Gradle Properties

Create/edit `android/gradle.properties` and add:

```properties
MYAPP_RELEASE_STORE_FILE=release.keystore
MYAPP_RELEASE_KEY_ALIAS=release-key
MYAPP_RELEASE_STORE_PASSWORD=your-store-password
MYAPP_RELEASE_KEY_PASSWORD=your-key-password
```

### 3. Update build.gradle

Update `android/app/build.gradle` to use release keystore in release builds.

### 4. Build Release APK

```bash
cd android
./gradlew assembleRelease
```

The production APK will be at:
`android/app/build/outputs/apk/release/app-release.apk`

## Quick Production Build (Using Debug Keystore - NOT recommended for Play Store)

If you just need a release build for testing (not for Play Store):

```bash
cd android
./gradlew assembleRelease
```

This will create a release APK but signed with debug keystore, which Google Play Store will reject.
