package com.spicetrade.app.data.api

import com.spicetrade.app.data.models.*
import retrofit2.http.*

interface ApiService {

    // ── Auth ──────────────────────────────────────────────────────────────────
    @POST("/api/login")
    suspend fun login(@Body request: LoginRequest): AuthResponse

    @POST("/api/signup")
    suspend fun signup(@Body request: SignupRequest): AuthResponse

    // ── Products / Ads ────────────────────────────────────────────────────────
    @GET("/api/ads")
    suspend fun getProducts(): List<Product>

    @POST("/api/ads/{id}/view")
    suspend fun incrementAdView(@Path("id") adId: Int): GenericResponse

    @POST("/api/ads")
    suspend fun createProduct(@Body body: Map<String, @JvmSuppressWildcards Any?>): ProductResponse

    @PUT("/api/ads/{id}")
    suspend fun updateProduct(
        @Path("id") productId: Int,
        @Body updates: Map<String, @JvmSuppressWildcards Any?>
    ): GenericResponse

    @DELETE("/api/ads/{id}")
    suspend fun deleteProduct(@Path("id") productId: Int): GenericResponse

    // ── Stores ────────────────────────────────────────────────────────────────
    @GET("/api/stores")
    suspend fun getStores(): List<Store>

    @POST("/api/stores/{id}/view")
    suspend fun incrementStoreView(@Path("id") storeId: Int): GenericResponse

    @GET("/api/user/public/{id}")
    suspend fun getPublicProfile(@Path("id") userId: Int): Store

    @PUT("/api/user/profile")
    suspend fun updateProfile(@Body updates: Map<String, @JvmSuppressWildcards Any?>): GenericResponse

    // ── Conversations ─────────────────────────────────────────────────────────
    @GET("/api/conversations/{userId}")
    suspend fun getConversations(@Path("userId") userId: Int): List<Conversation>

    @POST("/api/conversations")
    suspend fun createConversation(@Body request: CreateConversationRequest): ConversationResponse

    // ── Messages ──────────────────────────────────────────────────────────────
    @GET("/api/messages/{conversationId}")
    suspend fun getMessages(@Path("conversationId") conversationId: Int): List<Message>

    @POST("/api/messages")
    suspend fun sendMessage(@Body request: SendMessageRequest): GenericResponse

    @POST("/api/messages/mark-read/{conversationId}")
    suspend fun markMessagesAsRead(
        @Path("conversationId") conversationId: Int,
        @Body body: Map<String, @JvmSuppressWildcards Any?>
    ): GenericResponse

    @GET("/api/messages/unread/{userId}")
    suspend fun getUnreadCount(@Path("userId") userId: Int): UnreadCountResponse

    // ── Wishlist ──────────────────────────────────────────────────────────────
    @GET("/api/wishlist/{userId}")
    suspend fun getWishlist(@Path("userId") userId: Int): List<WishlistItem>

    @POST("/api/wishlist")
    suspend fun addToWishlist(@Body request: WishlistRequest): GenericResponse

    @DELETE("/api/wishlist/{wishlistId}")
    suspend fun removeFromWishlist(@Path("wishlistId") wishlistId: Int): GenericResponse

    @POST("/api/wishlist/check")
    suspend fun checkWishlist(@Body body: Map<String, @JvmSuppressWildcards Any?>): WishlistCheckResponse

    // ── Device / Push Notifications ───────────────────────────────────────────
    @POST("/api/device/register")
    suspend fun registerDeviceToken(@Body body: Map<String, @JvmSuppressWildcards Any?>): GenericResponse

    // ── Reviews ───────────────────────────────────────────────────────────────
    @GET("/api/reviews/{adId}")
    suspend fun getReviews(@Path("adId") adId: Int): List<Review>

    @GET("/api/reviews/{adId}/stats")
    suspend fun getReviewStats(@Path("adId") adId: Int): ReviewStats

    @POST("/api/reviews/{adId}")
    suspend fun addReview(
        @Path("adId") adId: Int,
        @Body request: AddReviewRequest
    ): ReviewAddResponse

    @DELETE("/api/reviews/{reviewId}")
    suspend fun deleteReview(@Path("reviewId") reviewId: Int): GenericResponse

    @GET("/api/reviews/{adId}/can-review/{userId}")
    suspend fun canReview(
        @Path("adId") adId: Int,
        @Path("userId") userId: Int
    ): CanReviewResponse
}
