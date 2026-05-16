package com.spicetrade.app.data.repository.impl

import com.spicetrade.app.data.api.ApiService
import com.spicetrade.app.data.models.AuthResponse
import com.spicetrade.app.data.models.ForgotPasswordRequest
import com.spicetrade.app.data.models.ForgotPasswordResponse
import com.spicetrade.app.data.models.GenericResponse
import com.spicetrade.app.data.models.LoginRequest
import com.spicetrade.app.data.models.ResetPasswordRequest
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

    override suspend fun forgotPassword(email: String): ForgotPasswordResponse {
        Timber.d("Forgot password for %s", email)
        return apiService.forgotPassword(ForgotPasswordRequest(email))
    }

    override suspend fun resetPassword(token: String, password: String): GenericResponse {
        Timber.d("Reset password with token")
        return apiService.resetPassword(ResetPasswordRequest(token, password))
    }
}
