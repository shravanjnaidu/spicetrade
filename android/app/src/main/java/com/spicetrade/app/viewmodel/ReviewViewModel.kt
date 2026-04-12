package com.spicetrade.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.spicetrade.app.data.api.RetrofitClient
import com.spicetrade.app.data.models.AddReviewRequest
import com.spicetrade.app.data.models.Review
import com.spicetrade.app.data.models.ReviewStats
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class ReviewViewModel : ViewModel() {

    private val api = RetrofitClient.apiService

    private val _reviews = MutableStateFlow<List<Review>>(emptyList())
    val reviews: StateFlow<List<Review>> = _reviews.asStateFlow()

    private val _stats = MutableStateFlow<ReviewStats?>(null)
    val stats: StateFlow<ReviewStats?> = _stats.asStateFlow()

    private val _canReview = MutableStateFlow(false)
    val canReview: StateFlow<Boolean> = _canReview.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    fun loadReviews(adId: Int) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                _reviews.value = api.getReviews(adId)
                _stats.value = api.getReviewStats(adId)
            } catch (e: Exception) {
                _errorMessage.value = e.message
            }
            _isLoading.value = false
        }
    }

    fun checkCanReview(adId: Int, userId: Int) {
        viewModelScope.launch {
            try {
                _canReview.value = api.canReview(adId, userId).canReview
            } catch (e: Exception) {
                _canReview.value = false
            }
        }
    }

    fun addReview(adId: Int, userId: Int, rating: Int, reviewText: String?) {
        viewModelScope.launch {
            try {
                api.addReview(adId, AddReviewRequest(userId, rating, reviewText))
                loadReviews(adId)
                _canReview.value = false
            } catch (e: Exception) {
                _errorMessage.value = e.message
            }
        }
    }

    fun deleteReview(reviewId: Int, adId: Int) {
        viewModelScope.launch {
            try {
                api.deleteReview(reviewId)
                _reviews.value = _reviews.value.filter { it.id != reviewId }
            } catch (e: Exception) {
                _errorMessage.value = e.message
            }
        }
    }
}
