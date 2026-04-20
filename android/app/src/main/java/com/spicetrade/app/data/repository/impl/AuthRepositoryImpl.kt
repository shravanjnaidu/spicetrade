package com.spicetrade.app.data.repository.impl

import com.spicetrade.app.data.api.ApiService
import com.spicetrade.app.data.models.AuthResponse
import com.spicetrade.app.data.models.LoginRequest
import com.spicetrade.app.data.models.SignupRequest
import com.spicetrade.app.data.repository.AuthRepository
import timber.log.Timber
import javax.inject.Inject

class AuthRepositoryImpl @Inject constructor(
    private val apiService: ApiService
) : AuthRepository {

    override suspend fun login(request: LoginRequest): AuthResponse {
        Timber.d("Login attempt for %s", request.email)
        return apiService.login(request)
    }

    override suspend fun signup(request: SignupRequest): AuthResponse {
        Timber.d("Signup attempt for %s", request.email)
        return apiService.signup(request)
    }
}
