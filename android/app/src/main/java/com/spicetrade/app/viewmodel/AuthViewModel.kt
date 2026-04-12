package com.spicetrade.app.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.spicetrade.app.data.api.RetrofitClient
import com.spicetrade.app.data.models.LoginRequest
import com.spicetrade.app.data.models.SignupRequest
import com.spicetrade.app.data.models.User
import com.spicetrade.app.data.preferences.UserPreferences
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

class AuthViewModel(application: Application) : AndroidViewModel(application) {

    private val prefs = UserPreferences(application)
    private val api = RetrofitClient.apiService

    private val _currentUser = MutableStateFlow<User?>(null)
    val currentUser: StateFlow<User?> = _currentUser.asStateFlow()

    private val _isAuthenticated = MutableStateFlow(false)
    val isAuthenticated: StateFlow<Boolean> = _isAuthenticated.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    init {
        viewModelScope.launch {
            val savedUser = prefs.currentUser.first()
            if (savedUser != null) {
                _currentUser.value = savedUser
                _isAuthenticated.value = true
            }
        }
    }

    fun login(email: String, password: String) {
        viewModelScope.launch {
            _isLoading.value = true
            _errorMessage.value = null
            try {
                val response = api.login(LoginRequest(email, password))
                if (response.success) {
                    val user = userFromResponse(response, email)
                    _currentUser.value = user
                    _isAuthenticated.value = true
                    prefs.saveUser(user)
                } else {
                    _errorMessage.value = response.error ?: "Login failed"
                }
            } catch (e: Exception) {
                _errorMessage.value = e.message ?: "An error occurred"
            }
            _isLoading.value = false
        }
    }

    fun signup(
        name: String,
        email: String,
        password: String,
        phone: String?,
        role: String,
        location: String? = null,
        storeName: String? = null,
        businessType: String? = null,
        categories: String? = null,
        address: String? = null,
        website: String? = null
    ) {
        viewModelScope.launch {
            _isLoading.value = true
            _errorMessage.value = null
            try {
                val response = api.signup(
                    SignupRequest(name, email, password, phone, role, location,
                        storeName, businessType, categories, address, website)
                )
                if (response.success) {
                    val user = userFromResponse(response, email)
                    _currentUser.value = user
                    _isAuthenticated.value = true
                    prefs.saveUser(user)
                } else {
                    _errorMessage.value = response.error ?: "Signup failed"
                }
            } catch (e: Exception) {
                _errorMessage.value = e.message ?: "An error occurred"
            }
            _isLoading.value = false
        }
    }

    fun logout() {
        viewModelScope.launch {
            _currentUser.value = null
            _isAuthenticated.value = false
            prefs.clearUser()
        }
    }

    fun updateUser(user: User) {
        viewModelScope.launch {
            _currentUser.value = user
            prefs.saveUser(user)
        }
    }

    fun clearError() {
        _errorMessage.value = null
    }

    private fun userFromResponse(r: com.spicetrade.app.data.models.AuthResponse, fallbackEmail: String): User {
        val id = r.userId ?: r.id ?: 0
        return User(
            id = id,
            name = r.name,
            email = r.email ?: fallbackEmail,
            phone = r.phone,
            role = r.role,
            storeName = r.storeName,
            businessType = r.businessType,
            categories = r.categories,
            address = r.address,
            website = r.website,
            logo = r.logo,
            uniqueId = r.uniqueId,
            location = r.location,
            profilePicture = r.profilePicture,
            tagline = r.tagline,
            storeDescription = r.storeDescription,
            ownerMessage = r.ownerMessage,
            yearEstablished = r.yearEstablished,
            employeeCount = r.employeeCount,
            annualTurnover = r.annualTurnover,
            paymentModes = r.paymentModes,
            exportMarkets = r.exportMarkets,
            certifications = r.certifications,
            whyUs = r.whyUs
        )
    }
}
