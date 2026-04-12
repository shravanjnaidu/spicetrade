# Add project specific ProGuard rules here.
-keep class com.spicetrade.app.data.models.** { *; }
-keepattributes Signature
-keepattributes *Annotation*
-dontwarn okhttp3.**
-dontwarn retrofit2.**
