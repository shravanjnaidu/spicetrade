package com.spicetrade.app

import android.app.Application
import coil.Coil
import coil.ImageLoader
import dagger.hilt.android.HiltAndroidApp
import okhttp3.OkHttpClient
import timber.log.Timber
import java.util.concurrent.TimeUnit

@HiltAndroidApp
class SpiceTradeApp : Application() {
    override fun onCreate() {
        super.onCreate()

        // Timber — debug tree in debug builds, no-op in release
        if (BuildConfig.DEBUG) {
            Timber.plant(Timber.DebugTree())
        }

        // Global Coil ImageLoader: uses OkHttp with extended timeouts so that
        // S3 / CDN images load reliably on slower connections.
        val okHttp = OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build()
        Coil.setImageLoader(
            ImageLoader.Builder(this)
                .okHttpClient(okHttp)
                .crossfade(true)
                .build()
        )

        Timber.d("SpiceTradeApp initialised")
    }
}
