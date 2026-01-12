package com.firstproject

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import android.os.Environment
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import android.os.Build

class ManageExternalStorageModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "ManageExternalStorage"
    }

    @ReactMethod
    fun hasPermission(promise: Promise) {
        val result = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            Environment.isExternalStorageManager()
        } else {
            // For Android 10 and below, return true as they don't need this permission
            true
        }
        promise.resolve(result)
    }

    @ReactMethod
    fun requestPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            val intent = Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION)
            intent.data = Uri.parse("package:${reactApplicationContext.packageName}")
            currentActivity?.startActivity(intent)
        }
        // For Android 10 and below, no action needed
    }
}