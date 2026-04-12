package com.spicetrade.app.data.models

import com.google.gson.annotations.SerializedName

// ── User ─────────────────────────────────────────────────────────────────────
data class User(
    val id: Int,
    val name: String? = null,
    val email: String,
    val phone: String? = null,
    val role: String? = null,
    @SerializedName("store_name") val storeName: String? = null,
    @SerializedName("business_type") val businessType: String? = null,
    val categories: String? = null,
    val address: String? = null,
    val website: String? = null,
    val logo: String? = null,
    @SerializedName("unique_id") val uniqueId: String? = null,
    val location: String? = null,
    @SerializedName("profile_picture") val profilePicture: String? = null,
    @SerializedName("created_at") val createdAt: String? = null,
    val tagline: String? = null,
    @SerializedName("store_description") val storeDescription: String? = null,
    @SerializedName("owner_message") val ownerMessage: String? = null,
    @SerializedName("year_established") val yearEstablished: String? = null,
    @SerializedName("employee_count") val employeeCount: String? = null,
    @SerializedName("annual_turnover") val annualTurnover: String? = null,
    @SerializedName("payment_modes") val paymentModes: String? = null,
    @SerializedName("export_markets") val exportMarkets: String? = null,
    val certifications: String? = null,
    @SerializedName("why_us") val whyUs: String? = null
) {
    val isSeller: Boolean get() = role == "seller"
    val isBuyer: Boolean get() = role == "buyer"
}

// ── Auth Response ─────────────────────────────────────────────────────────────
data class AuthResponse(
    val success: Boolean,
    @SerializedName("userId") val userId: Int? = null,
    val id: Int? = null,
    val name: String? = null,
    val email: String? = null,
    val phone: String? = null,
    val role: String? = null,
    @SerializedName("store_name") val storeName: String? = null,
    @SerializedName("business_type") val businessType: String? = null,
    val categories: String? = null,
    val address: String? = null,
    val website: String? = null,
    val logo: String? = null,
    @SerializedName("unique_id") val uniqueId: String? = null,
    val location: String? = null,
    @SerializedName("profile_picture") val profilePicture: String? = null,
    val error: String? = null,
    val tagline: String? = null,
    @SerializedName("store_description") val storeDescription: String? = null,
    @SerializedName("owner_message") val ownerMessage: String? = null,
    @SerializedName("year_established") val yearEstablished: String? = null,
    @SerializedName("employee_count") val employeeCount: String? = null,
    @SerializedName("annual_turnover") val annualTurnover: String? = null,
    @SerializedName("payment_modes") val paymentModes: String? = null,
    @SerializedName("export_markets") val exportMarkets: String? = null,
    val certifications: String? = null,
    @SerializedName("why_us") val whyUs: String? = null
)

// ── Product / Ad ──────────────────────────────────────────────────────────────
data class Product(
    val id: Int,
    val title: String,
    val description: String,
    @SerializedName("user_id") val userId: Int? = null,
    @SerializedName("created_at") val createdAt: String? = null,
    val author: String? = null,
    @SerializedName("store_name") val storeName: String? = null,
    val role: String? = null,
    @SerializedName("profile_picture") val profilePicture: String? = null,
    val category: String? = null,
    val tags: List<String>? = null,
    val price: Double? = null,
    val unit: String? = null,
    @SerializedName("min_order") val minOrder: Int? = null,
    val stock: Int? = null,
    @SerializedName("image_url") val imageUrl: String? = null,
    val images: String? = null,
    val verified: Int? = null,
    val views: Int? = null,
    @SerializedName("review_count") val reviewCount: Int? = null,
    @SerializedName("average_rating") val averageRating: Double? = null,
    @SerializedName("listing_type") val listingType: String? = null
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
    @SerializedName("user_id") val userId: Int? = null,
    @SerializedName("created_at") val createdAt: String? = null,
    val author: String? = null,
    val category: String? = null,
    val tags: List<String>? = null,
    val price: Double? = null,
    val unit: String? = null,
    @SerializedName("min_order") val minOrder: Int? = null,
    val stock: Int? = null,
    @SerializedName("image_url") val imageUrl: String? = null,
    val verified: Int? = null,
    val error: String? = null
)

// ── Conversation ──────────────────────────────────────────────────────────────
data class Conversation(
    val id: Int,
    @SerializedName("buyer_id") val buyerId: Int,
    @SerializedName("seller_id") val sellerId: Int,
    @SerializedName("listing_id") val listingId: Int? = null,
    @SerializedName("created_at") val createdAt: String,
    @SerializedName("buyer_name") val buyerName: String? = null,
    @SerializedName("buyer_email") val buyerEmail: String? = null,
    @SerializedName("buyer_picture") val buyerPicture: String? = null,
    @SerializedName("seller_name") val sellerName: String? = null,
    @SerializedName("seller_email") val sellerEmail: String? = null,
    @SerializedName("seller_picture") val sellerPicture: String? = null,
    @SerializedName("store_name") val storeName: String? = null,
    @SerializedName("last_message") val lastMessage: String? = null,
    @SerializedName("last_message_time") val lastMessageTime: String? = null,
    @SerializedName("unread_count") val unreadCount: Int? = null
)

// ── Message ───────────────────────────────────────────────────────────────────
data class Message(
    val id: Int,
    @SerializedName("conversation_id") val conversationId: Int,
    @SerializedName("sender_id") val senderId: Int,
    val message: String,
    @SerializedName("created_at") val createdAt: String,
    @SerializedName("sender_name") val senderName: String? = null,
    @SerializedName("sender_email") val senderEmail: String? = null,
    @SerializedName("sender_picture") val senderPicture: String? = null
)

// ── Wishlist Item ─────────────────────────────────────────────────────────────
data class WishlistItem(
    @SerializedName("wishlist_id") val wishlistId: Int,
    @SerializedName("added_at") val addedAt: String,
    val id: Int,
    val title: String,
    val description: String,
    @SerializedName("user_id") val userId: Int? = null,
    @SerializedName("created_at") val createdAt: String? = null,
    val author: String? = null,
    @SerializedName("store_name") val storeName: String? = null,
    val role: String? = null,
    @SerializedName("profile_picture") val profilePicture: String? = null,
    val category: String? = null,
    val tags: List<String>? = null,
    val price: Double? = null,
    val unit: String? = null,
    @SerializedName("min_order") val minOrder: Int? = null,
    val stock: Int? = null,
    @SerializedName("image_url") val imageUrl: String? = null
)

// ── Review ────────────────────────────────────────────────────────────────────
data class Review(
    val id: Int,
    @SerializedName("ad_id") val adId: Int,
    @SerializedName("user_id") val userId: Int,
    val rating: Int,
    @SerializedName("review_text") val reviewText: String? = null,
    @SerializedName("created_at") val createdAt: String,
    @SerializedName("user_name") val userName: String? = null,
    @SerializedName("profile_picture") val profilePicture: String? = null
)

// ── Review Stats ──────────────────────────────────────────────────────────────
data class ReviewStats(
    @SerializedName("total_reviews") val totalReviews: Int,
    @SerializedName("average_rating") val averageRating: Double,
    @SerializedName("five_stars") val fiveStars: Int,
    @SerializedName("four_stars") val fourStars: Int,
    @SerializedName("three_stars") val threeStars: Int,
    @SerializedName("two_stars") val twoStars: Int,
    @SerializedName("one_star") val oneStar: Int
)

// ── Store (Public Profile) ────────────────────────────────────────────────────
data class Store(
    val id: Int,
    val name: String? = null,
    val email: String? = null,
    val phone: String? = null,
    @SerializedName("store_name") val storeName: String? = null,
    @SerializedName("business_type") val businessType: String? = null,
    val categories: String? = null,
    val address: String? = null,
    val website: String? = null,
    val logo: String? = null,
    @SerializedName("unique_id") val uniqueId: String? = null,
    val location: String? = null,
    @SerializedName("profile_picture") val profilePicture: String? = null,
    val tagline: String? = null,
    @SerializedName("store_description") val storeDescription: String? = null,
    @SerializedName("owner_message") val ownerMessage: String? = null,
    @SerializedName("year_established") val yearEstablished: String? = null,
    @SerializedName("employee_count") val employeeCount: String? = null,
    @SerializedName("annual_turnover") val annualTurnover: String? = null,
    @SerializedName("payment_modes") val paymentModes: String? = null,
    @SerializedName("export_markets") val exportMarkets: String? = null,
    val certifications: String? = null,
    @SerializedName("why_us") val whyUs: String? = null,
    val views: Int? = null
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
    @SerializedName("store_name") val storeName: String? = null,
    @SerializedName("business_type") val businessType: String? = null,
    val categories: String? = null,
    val address: String? = null,
    val website: String? = null
)

data class SendMessageRequest(
    @SerializedName("sender_id") val senderId: Int,
    val message: String
)

data class CreateConversationRequest(
    @SerializedName("buyer_id") val buyerId: Int,
    @SerializedName("seller_id") val sellerId: Int,
    @SerializedName("listing_id") val listingId: Int? = null
)

data class AddReviewRequest(
    @SerializedName("user_id") val userId: Int,
    val rating: Int,
    @SerializedName("review_text") val reviewText: String? = null
)

data class WishlistRequest(
    @SerializedName("user_id") val userId: Int,
    @SerializedName("ad_id") val adId: Int
)
