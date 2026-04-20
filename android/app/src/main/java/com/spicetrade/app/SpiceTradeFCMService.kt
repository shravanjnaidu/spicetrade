package com.spicetrade.app

/**
 * Placeholder - Firebase Cloud Messaging is not yet configured.
 *
 * To enable push notifications:
 * 1. Create a free Firebase project at https://console.firebase.google.com
 * 2. Add Android app (package: com.spicetrade.app) and download google-services.json
 * 3. Place google-services.json in android/app/
 * 4. Uncomment the google-services plugin in android/app/build.gradle.kts
 * 5. Uncomment the Firebase dependencies in android/app/build.gradle.kts
 * 6. Replace this file with the full FCMService implementation from git history
 */
object SpiceTradeFCMService {
    const val CHANNEL_ID = "spicetrade_main"
    const val PREFS = "spicetrade_fcm"
    const val KEY_TOKEN = "pending_fcm_token"
}
