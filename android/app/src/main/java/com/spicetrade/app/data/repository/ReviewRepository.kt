package com.spicetrade.app.data.repository

import com.spicetrade.app.data.models.AddReviewRequest
import com.spicetrade.app.data.models.CanReviewResponse
import com.spicetrade.app.data.models.GenericResponse
import com.spicetrade.app.data.models.Review
import com.spicetrade.app.data.models.ReviewAddResponse
import com.spicetrade.app.data.models.ReviewStats

interface ReviewRepository {
    suspend fun getReviews(adId: Int): List<Review>
    suspend fun getReviewStats(adId: Int): ReviewStats
    suspend fun addReview(request: AddReviewRequest): ReviewAddResponse
    suspend fun deleteReview(reviewId: Int): GenericResponse
    suspend fun canReview(adId: Int, userId: Int): CanReviewResponse
}
