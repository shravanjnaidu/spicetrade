package com.spicetrade.app.data.api

import com.spicetrade.app.data.preferences.UserPreferences
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response

/**
 * OkHttp interceptor that attaches the JWT Bearer token (stored in
 * [UserPreferences]) to every outgoing request.
 *
 * If no token is stored the request is forwarded as-is, so unauthenticated
 * calls (login, signup, public listings) continue to work normally.
 */
class AuthInterceptor(private val prefs: UserPreferences) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val token = runBlocking { prefs.authToken.firstOrNull() }
        val request = if (token.isNullOrBlank()) {
            chain.request()
        } else {
            chain.request().newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
        }
        return chain.proceed(request)
    }
}
