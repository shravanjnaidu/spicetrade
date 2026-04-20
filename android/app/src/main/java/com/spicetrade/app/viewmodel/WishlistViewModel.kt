package com.spicetrade.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.spicetrade.app.data.models.WishlistItem
import com.spicetrade.app.data.models.WishlistRequest
import com.spicetrade.app.data.repository.WishlistRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import timber.log.Timber
import javax.inject.Inject

@HiltViewModel
class WishlistViewModel @Inject constructor(
    private val repository: WishlistRepository
) : ViewModel() {

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
                _items.value = repository.getWishlist(userId)
                Timber.d("Loaded %d wishlist items", _items.value.size)
            } catch (e: Exception) {
                Timber.e(e, "Failed to load wishlist")
                _errorMessage.value = e.message
            }
            _isLoading.value = false
        }
    }

    fun addToWishlist(userId: Int, adId: Int) {
        viewModelScope.launch {
            try {
                repository.addToWishlist(WishlistRequest(userId, adId))
                loadWishlist(userId)
            } catch (e: Exception) {
                Timber.e(e, "Failed to add to wishlist")
                _errorMessage.value = e.message
            }
        }
    }

    fun removeFromWishlist(wishlistId: Int, userId: Int) {
        viewModelScope.launch {
            try {
                repository.removeFromWishlist(wishlistId)
                _items.value = _items.value.filter { it.wishlistId != wishlistId }
            } catch (e: Exception) {
                Timber.e(e, "Failed to remove from wishlist")
                _errorMessage.value = e.message
            }
        }
    }
}
