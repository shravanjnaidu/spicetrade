package com.spicetrade.app.data.repository.impl

import com.spicetrade.app.data.api.ApiService
import com.spicetrade.app.data.models.AddReviewRequest
import com.spicetrade.app.data.models.CanReviewResponse
import com.spicetrade.app.data.models.GenericResponse
import com.spicetrade.app.data.models.Review
import com.spicetrade.app.data.models.ReviewAddResponse
import com.spicetrade.app.data.models.ReviewStats
import com.spicetrade.app.data.repository.ReviewRepository
import timber.log.Timber
import javax.inject.Inject

class ReviewRepositoryImpl @Inject constructor(
    private val apiService: ApiService
) : ReviewRepository {

    override suspend fun getReviews(adId: Int): List<Review> {
        Timber.d("Fetching reviews for adId=%d", adId)
        return apiService.getReviews(adId)
    }

    override suspend fun getReviewStats(adId: Int): ReviewStats {
        return apiService.getReviewStats(adId)
    }

    override suspend fun addReview(request: AddReviewRequest): ReviewAddResponse {
        Timber.d("Adding review for adId=%d rating=%d", request.adId, request.rating)
        return apiService.addReview(request)
    }

    override suspend fun deleteReview(reviewId: Int): GenericResponse {
        Timber.d("Deleting reviewId=%d", reviewId)
        return apiService.deleteReview(reviewId)
    }

    override suspend fun canReview(adId: Int, userId: Int): CanReviewResponse {
        return apiService.canReview(adId, mapOf("userId" to userId))
    }
}
