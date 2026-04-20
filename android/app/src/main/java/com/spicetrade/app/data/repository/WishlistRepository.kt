package com.spicetrade.app.data.repository

import com.spicetrade.app.data.models.GenericResponse
import com.spicetrade.app.data.models.WishlistCheckResponse
import com.spicetrade.app.data.models.WishlistItem
import com.spicetrade.app.data.models.WishlistRequest

interface WishlistRepository {
    suspend fun getWishlist(userId: Int): List<WishlistItem>
    suspend fun addToWishlist(request: WishlistRequest): GenericResponse
    suspend fun removeFromWishlist(wishlistId: Int): GenericResponse
    suspend fun checkWishlist(userId: Int, adId: Int): WishlistCheckResponse
}
