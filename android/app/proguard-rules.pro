# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# Keep native methods
-keepclassmembers class * {
    native <methods>;
}

# Hermes
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }

# SQLite
-keep class org.pgsqlite.** { *; }
-keep class net.sqlcipher.** { *; }
-dontwarn net.sqlcipher.**

# react-native-fs
-keep class com.rnfs.** { *; }

# react-native-webview
-keep class com.reactnativecommunity.webview.** { *; }

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }

# react-native-gesture-handler
-keep class com.swmansion.gesturehandler.** { *; }

# react-native-screens
-keep class com.swmansion.rnscreens.** { *; }

# react-native-svg
-keep class com.horcrux.svg.** { *; }

# react-native-document-picker
-keep class com.reactnativedocumentpicker.** { *; }

# AsyncStorage
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# JSZip - keep reflection
-keepattributes *Annotation*
-keepattributes Signature

# Keep okhttp (used by some RN modules)
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }
-keep class okio.** { *; }

# Suppress warnings for missing classes
-dontwarn javax.annotation.**
-dontwarn sun.misc.Unsafe
