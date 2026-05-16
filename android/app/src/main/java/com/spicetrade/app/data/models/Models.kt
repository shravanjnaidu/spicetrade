package com.spicetrade.app.data.models

import com.google.gson.annotations.SerializedName

// ── User ─────────────────────────────────────────────────────────────────────
data class User(
    val id: Int,
    val name: String? = null,
    val email: String,
    val phone: String? = null,
    val role: String? = null,
    val storeName: String? = null,
    val businessType: String? = null,
    val categories: String? = null,
    val address: String? = null,
    val website: String? = null,
    val logo: String? = null,
    val uniqueId: String? = null,
    val location: String? = null,
    val profilePicture: String? = null,
    val createdAt: String? = null,
    val tagline: String? = null,
    val storeDescription: String? = null,
    val ownerMessage: String? = null,
    val yearEstablished: String? = null,
    val employeeCount: String? = null,
    val annualTurnover: String? = null,
    val paymentModes: String? = null,
    val exportMarkets: String? = null,
    val certifications: String? = null,
    val whyUs: String? = null
) {
    val isSeller: Boolean get() = role == "seller"
    val isBuyer: Boolean get() = role == "buyer"
    val isAdvertiser: Boolean get() = role == "advertiser"
}

// ── Auth Response ─────────────────────────────────────────────────────────────
data class AuthResponse(
    val success: Boolean,
    val userId: Int? = null,
    val id: Int? = null,
    val name: String? = null,
    val email: String? = null,
    val phone: String? = null,
    val role: String? = null,
    val storeName: String? = null,
    val businessType: String? = null,
    val categories: String? = null,
    val address: String? = null,
    val website: String? = null,
    val logo: String? = null,
    val uniqueId: String? = null,
    val location: String? = null,
    val profilePicture: String? = null,
    val error: String? = null,
    val tagline: String? = null,
    val storeDescription: String? = null,
    val ownerMessage: String? = null,
    val yearEstablished: String? = null,
    val employeeCount: String? = null,
    val token: String? = null,
    val annualTurnover: String? = null,
    val paymentModes: String? = null,
    val exportMarkets: String? = null,
    val certifications: String? = null,
    val whyUs: String? = null
)

// ── Product / Ad ──────────────────────────────────────────────────────────────
data class Product(
    val id: Int,
    val title: String,
    val description: String,
    val userId: Int? = null,
    val createdAt: String? = null,
    val author: String? = null,
    val storeName: String? = null,
    val role: String? = null,
    val profilePicture: String? = null,
    val category: String? = null,
    val tags: List<String>? = null,
    val price: Double? = null,
    val unit: String? = null,
    val minOrder: Int? = null,
    val stock: Int? = null,
    val imageUrl: String? = null,
    val images: String? = null,
    val verified: Int? = null,
    val views: Int? = null,
    val reviewCount: Int? = null,
    val averageRating: Double? = null,
    val listingType: String? = null
) {
    val isRequirement: Boolean get() = listingType == "requirement"

    val imageURLs: List<String>
        get() {
            if (!images.isNullOrBlank()) {
                return images.split(",").filter { it.isNotBlank() }
            }
            if (!imageUrl.isNullOrBlank()) return listOf(imageUrl)
            return emptyList()
        }

    fun fullImageURL(imagePath: String, baseUrl: String): String {
        if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) return imagePath
        if (imagePath.startsWith("/uploads/")) return "$baseUrl$imagePath"
        if (!imagePath.startsWith("/")) return "$baseUrl/uploads/$imagePath"
        return "$baseUrl$imagePath"
    }

    val priceText: String
        get() = if (price != null && price > 0) {
            "₹${"%.2f".format(price)}${if (unit != null) "/$unit" else ""}"
        } else "Price on request"
}

// ── Product Response ──────────────────────────────────────────────────────────
data class ProductResponse(
    val success: Boolean,
    val id: Int? = null,
    val title: String? = null,
    val description: String? = null,
    val userId: Int? = null,
    val createdAt: String? = null,
    val author: String? = null,
    val category: String? = null,
    val tags: List<String>? = null,
    val price: Double? = null,
    val unit: String? = null,
    val minOrder: Int? = null,
    val stock: Int? = null,
    val imageUrl: String? = null,
    val verified: Int? = null,
    val error: String? = null
)

// ── Conversation ──────────────────────────────────────────────────────────────
data class Conversation(
    val id: Int,
    val buyerId: Int,
    val sellerId: Int,
    val listingId: Int? = null,
    val createdAt: String? = null,
    val buyerName: String? = null,
    val buyerEmail: String? = null,
    val buyerPicture: String? = null,
    val sellerName: String? = null,
    val sellerEmail: String? = null,
    val sellerPicture: String? = null,
    val storeName: String? = null,
    val lastMessage: String? = null,
    val lastMessageTime: String? = null,
    val unreadCount: Int? = null
)

// ── Message ───────────────────────────────────────────────────────────────────
data class Message(
    val id: Int,
    val conversationId: Int,
    val senderId: Int,
    val message: String,
    val createdAt: String? = null,
    val senderName: String? = null,
    val senderEmail: String? = null,
    val senderPicture: String? = null
)

// ── Wishlist Item ─────────────────────────────────────────────────────────────
data class WishlistItem(
    val wishlistId: Int,
    val addedAt: String,
    val id: Int,
    val title: String,
    val description: String,
    val userId: Int? = null,
    val createdAt: String? = null,
    val author: String? = null,
    val storeName: String? = null,
    val role: String? = null,
    val profilePicture: String? = null,
    val category: String? = null,
    val tags: List<String>? = null,
    val price: Double? = null,
    val unit: String? = null,
    val minOrder: Int? = null,
    val stock: Int? = null,
    val imageUrl: String? = null
)

// ── Review ────────────────────────────────────────────────────────────────────
data class Review(
    val id: Int,
    val adId: Int,
    val userId: Int,
    val rating: Int,
    val reviewText: String? = null,
    val createdAt: String? = null,
    val userName: String? = null,
    val profilePicture: String? = null
)

// ── Review Stats ──────────────────────────────────────────────────────────────
data class ReviewStats(
    val totalReviews: Int,
    val averageRating: Double,
    val fiveStars: Int,
    val fourStars: Int,
    val threeStars: Int,
    val twoStars: Int,
    val oneStar: Int
)

// ── Store (Public Profile) ────────────────────────────────────────────────────
data class Store(
    val id: Int,
    val name: String? = null,
    val email: String? = null,
    val phone: String? = null,
    val storeName: String? = null,
    val businessType: String? = null,
    val categories: String? = null,
    val address: String? = null,
    val website: String? = null,
    val logo: String? = null,
    val uniqueId: String? = null,
    val location: String? = null,
    val profilePicture: String? = null,
    val tagline: String? = null,
    val storeDescription: String? = null,
    val ownerMessage: String? = null,
    val yearEstablished: String? = null,
    val employeeCount: String? = null,
    val annualTurnover: String? = null,
    val paymentModes: String? = null,
    val exportMarkets: String? = null,
    val certifications: String? = null,
    val whyUs: String? = null,
    val storeViews: Int? = null,
    val products: List<Product>? = null
)

// ── Generic Responses ──────────────────────────────────────────────────────────
data class GenericResponse(
    val success: Boolean,
    val error: String? = null,
    val message: String? = null
)

data class WishlistCheckResponse(
    @SerializedName("inWishlist") val inWishlist: Boolean,
    @SerializedName("wishlistId") val wishlistId: Int? = null
)

data class UnreadCountResponse(
    @SerializedName("unreadCount") val unreadCount: Int
)

data class ConversationResponse(
    val success: Boolean,
    @SerializedName("conversationId") val conversationId: Int? = null,
    val error: String? = null
)

data class UploadResponse(
    val success: Boolean,
    val url: String? = null,
    val urls: List<String>? = null,
    val error: String? = null
)

data class CanReviewResponse(
    val canReview: Boolean
)

data class ReviewAddResponse(
    val success: Boolean,
    @SerializedName("reviewId") val reviewId: Int? = null,
    val message: String? = null
)

// ── Request Bodies ─────────────────────────────────────────────────────────────
data class LoginRequest(val email: String, val password: String)

data class SignupRequest(
    val name: String,
    val email: String,
    val password: String,
    val phone: String? = null,
    val role: String,
    val location: String? = null,
    val storeName: String? = null,
    val businessType: String? = null,
    val categories: String? = null,
    val address: String? = null,
    val website: String? = null
)

data class SendMessageRequest(
    @SerializedName("conversationId") val conversationId: Int,
    @SerializedName("senderId") val senderId: Int,
    val message: String
)

data class CreateConversationRequest(
    @SerializedName("buyerId") val buyerId: Int,
    @SerializedName("sellerId") val sellerId: Int,
    @SerializedName("listingId") val listingId: Int? = null
)

data class AddReviewRequest(
    val adId: Int,
    val userId: Int,
    val rating: Int,
    val reviewText: String? = null
)

data class WishlistRequest(
    val userId: Int,
    val adId: Int
)

// ── Password Reset ────────────────────────────────────────────────────────────
data class ForgotPasswordRequest(val email: String)

data class ForgotPasswordResponse(
    val success: Boolean,
    val message: String? = null,
    val error: String? = null
)

data class ResetPasswordRequest(val token: String, val password: String)

// ── Banner Ad ─────────────────────────────────────────────────────────────────
data class BannerAd(
    val id: Int,
    val userId: Int? = null,
    val title: String,
    val description: String? = null,
    val imageUrl: String,
    val targetUrl: String,
    val status: String? = null,
    val contactName: String? = null,
    val contactNumber: String? = null,
    val industry: String? = null,
    val adAddress: String? = null,
    val notes: String? = null,
    val createdAt: String? = null,
    val expiresAt: String? = null
)

// ── Cart ──────────────────────────────────────────────────────────────────────
data class CartItem(
    val product: Product,
    val quantity: Int = 1,
    val addedAt: Long = System.currentTimeMillis()
)
