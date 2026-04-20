package com.spicetrade.app.data.api

import okhttp3.Interceptor
import okhttp3.Response
import java.io.IOException

/**
 * OkHttp interceptor that retries a failed request against the local dev server
 * when the primary (production) server is unreachable.
 *
 * Android emulator routes 10.0.2.2 → host machine 127.0.0.1, so a Flask/Gunicorn
 * server running on the developer's machine at port 5000 is reachable from the
 * emulator as http://10.0.2.2:5000.
 */
class LocalFallbackInterceptor : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        return try {
            chain.proceed(request)
        } catch (e: IOException) {
            // Production server unreachable — retry against the local dev server
            val localUrl = request.url.newBuilder()
                .scheme("http")
                .host("10.0.2.2")
                .port(5000)
                .build()
            chain.proceed(request.newBuilder().url(localUrl).build())
        }
    }
}
