package com.spicetrade.app.data.api

import com.spicetrade.app.data.preferences.UserPreferences
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import okhttp3.Interceptor
import okhttp3.Response

/**
 * OkHttp interceptor that attaches the JWT Bearer token (stored in
 * [UserPreferences]) to every outgoing request.
 *
 * The token is collected from [UserPreferences] via a coroutine that runs for
 * the lifetime of the app — no [kotlinx.coroutines.runBlocking] on the OkHttp
 * thread, so network requests never stall waiting for DataStore disk I/O.
 *
 * If no token is available yet the request is forwarded as-is, so
 * unauthenticated calls (login, signup, public listings) continue to work.
 */
class AuthInterceptor(
    private val prefs: UserPreferences,
    appScope: CoroutineScope
) : Interceptor {

    @Volatile private var cachedToken: String? = null

    init {
        // Collect the DataStore flow on a background coroutine so the
        // interceptor always has the latest token without ever blocking.
        appScope.launch {
            prefs.authToken.collect { token ->
                cachedToken = token
            }
        }
    }

    override fun intercept(chain: Interceptor.Chain): Response {
        val token = cachedToken
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
