package com.spicetrade.app.viewmodel

import android.content.Context
import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.spicetrade.app.data.models.BannerAd
import com.spicetrade.app.data.repository.BannerAdRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody
import timber.log.Timber
import javax.inject.Inject

@HiltViewModel
class AdvertiserViewModel @Inject constructor(
    private val repository: BannerAdRepository,
    @ApplicationContext private val context: Context
) : ViewModel() {

    private val _ads = MutableStateFlow<List<BannerAd>>(emptyList())
    val ads: StateFlow<List<BannerAd>> = _ads.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _isUploading = MutableStateFlow(false)
    val isUploading: StateFlow<Boolean> = _isUploading.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    private val _successMessage = MutableStateFlow<String?>(null)
    val successMessage: StateFlow<String?> = _successMessage.asStateFlow()

    fun loadMyAds(userId: Int) {
        viewModelScope.launch {
            _isLoading.value = true
            _errorMessage.value = null
            try {
                _ads.value = repository.getMyBannerAds(userId)
            } catch (e: Exception) {
                Timber.e(e, "Failed to load banner ads")
                _errorMessage.value = e.message ?: "Failed to load ads"
            }
            _isLoading.value = false
        }
    }

    fun createBannerAd(
        userId: Int,
        title: String,
        description: String,
        targetUrl: String,
        expiresAt: String,
        contactName: String,
        contactNumber: String,
        industry: String,
        imageUri: Uri,
        onSuccess: () -> Unit
    ) {
        viewModelScope.launch {
            _isUploading.value = true
            _errorMessage.value = null
            try {
                val bytes = context.contentResolver.openInputStream(imageUri)?.readBytes()
                    ?: throw IllegalStateException("Cannot read image")

                val mimeType = context.contentResolver.getType(imageUri) ?: "image/jpeg"
                val imageBody = bytes.toRequestBody(mimeType.toMediaTypeOrNull())
                val imagePart = MultipartBody.Part.createFormData("image", "banner.jpg", imageBody)

                fun String.asBody() = toRequestBody("text/plain".toMediaTypeOrNull())

                val response = repository.createBannerAd(
                    userId = userId.toString().asBody(),
                    title = title.asBody(),
                    description = description.asBody(),
                    targetUrl = targetUrl.asBody(),
                    expiresAt = expiresAt.asBody(),
                    contactName = contactName.asBody(),
                    contactNumber = contactNumber.asBody(),
                    industry = industry.asBody(),
                    image = imagePart
                )

                if (response.success) {
                    _successMessage.value = "Banner ad submitted for review"
                    loadMyAds(userId)
                    onSuccess()
                } else {
                    _errorMessage.value = response.error ?: "Failed to create ad"
                }
            } catch (e: Exception) {
                Timber.e(e, "Failed to create banner ad")
                _errorMessage.value = e.message ?: "An error occurred"
            }
            _isUploading.value = false
        }
    }

    fun clearMessages() {
        _errorMessage.value = null
        _successMessage.value = null
    }
}
