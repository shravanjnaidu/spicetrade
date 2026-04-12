package com.spicetrade.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.spicetrade.app.data.api.RetrofitClient
import com.spicetrade.app.data.models.WishlistItem
import com.spicetrade.app.data.models.WishlistRequest
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class WishlistViewModel : ViewModel() {

    private val api = RetrofitClient.apiService

    private val _items = MutableStateFlow<List<WishlistItem>>(emptyList())
    val items: StateFlow<List<WishlistItem>> = _items.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    fun loadWishlist(userId: Int) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                _items.value = api.getWishlist(userId)
            } catch (e: Exception) {
                _errorMessage.value = e.message
            }
            _isLoading.value = false
        }
    }

    fun addToWishlist(userId: Int, adId: Int) {
        viewModelScope.launch {
            try {
                api.addToWishlist(WishlistRequest(userId, adId))
                loadWishlist(userId)
            } catch (e: Exception) {
                _errorMessage.value = e.message
            }
        }
    }

    fun removeFromWishlist(wishlistId: Int, userId: Int) {
        viewModelScope.launch {
            try {
                api.removeFromWishlist(wishlistId)
                _items.value = _items.value.filter { it.wishlistId != wishlistId }
            } catch (e: Exception) {
                _errorMessage.value = e.message
            }
        }
    }
}
