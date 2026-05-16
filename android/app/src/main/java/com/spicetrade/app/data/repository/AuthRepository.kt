package com.spicetrade.app.data.repository

import com.spicetrade.app.data.models.AuthResponse
import com.spicetrade.app.data.models.ForgotPasswordResponse
import com.spicetrade.app.data.models.GenericResponse
import com.spicetrade.app.data.models.LoginRequest
import com.spicetrade.app.data.models.SignupRequest

interface AuthRepository {
    suspend fun login(request: LoginRequest): AuthResponse
    suspend fun signup(request: SignupRequest): AuthResponse
    suspend fun forgotPassword(email: String): ForgotPasswordResponse
    suspend fun resetPassword(token: String, password: String): GenericResponse
}
