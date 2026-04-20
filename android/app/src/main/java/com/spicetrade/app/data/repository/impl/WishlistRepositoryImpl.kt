package com.spicetrade.app.data.repository.impl

import com.spicetrade.app.data.api.ApiService
import com.spicetrade.app.data.models.GenericResponse
import com.spicetrade.app.data.models.WishlistCheckResponse
import com.spicetrade.app.data.models.WishlistItem
import com.spicetrade.app.data.models.WishlistRequest
import com.spicetrade.app.data.repository.WishlistRepository
import timber.log.Timber
import javax.inject.Inject

class WishlistRepositoryImpl @Inject constructor(
    private val apiService: ApiService
) : WishlistRepository {

    override suspend fun getWishlist(userId: Int): List<WishlistItem> {
        Timber.d("Fetching wishlist for userId=%d", userId)
        return apiService.getWishlist(userId)
    }

    override suspend fun addToWishlist(request: WishlistRequest): GenericResponse {
        Timber.d("Adding adId=%d to wishlist", request.adId)
        return apiService.addToWishlist(request)
    }

    override suspend fun removeFromWishlist(wishlistId: Int): GenericResponse {
        Timber.d("Removing wishlistId=%d", wishlistId)
        return apiService.removeFromWishlist(wishlistId)
    }

    override suspend fun checkWishlist(userId: Int, adId: Int): WishlistCheckResponse {
        return apiService.checkWishlist(mapOf("userId" to userId, "adId" to adId))
    }
}
