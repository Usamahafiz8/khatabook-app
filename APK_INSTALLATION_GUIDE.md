# APK Installation Troubleshooting Guide

## Common Issues and Solutions

### 1. **Enable "Install from Unknown Sources"**

**For Android 8.0 (Oreo) and above:**
- Go to **Settings** → **Apps** → **Special app access** → **Install unknown apps**
- Select the app you're using to install (Chrome, Files, etc.)
- Toggle **"Allow from this source"** ON

**For older Android versions:**
- Go to **Settings** → **Security**
- Enable **"Unknown sources"**

### 2. **Check Device Architecture**

The current APK supports:
- ✅ arm64-v8a (64-bit ARM - most modern devices)
- ✅ armeabi-v7a (32-bit ARM)
- ✅ x86 (Intel)
- ✅ x86_64 (64-bit Intel)

If your device is older and uses a different architecture, we can build a universal APK.

### 3. **Minimum Android Version**

The app requires **Android 6.0 (API 23)** or higher.

Check your Android version: **Settings** → **About phone** → **Android version**

### 4. **Installation Steps**

1. Transfer the APK to your device (via USB, email, cloud storage, etc.)
2. Open the APK file on your device
3. If prompted, allow installation from unknown sources
4. Tap **"Install"**
5. Wait for installation to complete
6. Tap **"Open"** to launch the app

### 5. **If App Crashes on Launch**

- Check device logs using: `adb logcat`
- Ensure device has enough storage space
- Try restarting the device
- Check if all required permissions are granted

### 6. **Check APK Validity**

Run this command to verify the APK:
```bash
cd android && ./gradlew validateSigningDebug
```

## Still Not Working?

If the APK still doesn't install or open:

1. **Check device logs:**
   ```bash
   adb logcat | grep -i "firstproject\|error\|exception"
   ```

2. **Try installing via ADB:**
   ```bash
   adb install app-debug.apk
   ```

3. **Build a universal APK** (supports all architectures):
   ```bash
   npm run build:android:debug
   ```

4. **Check device compatibility:**
   - Minimum Android: 6.0 (API 23)
   - Architecture: arm64-v8a, armeabi-v7a, x86, or x86_64
