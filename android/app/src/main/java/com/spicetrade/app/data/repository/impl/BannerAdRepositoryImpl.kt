package com.spicetrade.app.data.repository.impl

import com.spicetrade.app.data.api.ApiService
import com.spicetrade.app.data.models.BannerAd
import com.spicetrade.app.data.models.GenericResponse
import com.spicetrade.app.data.repository.BannerAdRepository
import okhttp3.MultipartBody
import okhttp3.RequestBody
import timber.log.Timber
import javax.inject.Inject

class BannerAdRepositoryImpl @Inject constructor(
    private val apiService: ApiService
) : BannerAdRepository {

    override suspend fun getMyBannerAds(userId: Int): List<BannerAd> {
        Timber.d("Loading banner ads for userId=%d", userId)
        return apiService.getMyBannerAds(userId)
    }

    override suspend fun createBannerAd(
        userId: RequestBody,
        title: RequestBody,
        description: RequestBody,
        targetUrl: RequestBody,
        expiresAt: RequestBody,
        contactName: RequestBody,
        contactNumber: RequestBody,
        industry: RequestBody,
        image: MultipartBody.Part
    ): GenericResponse {
        Timber.d("Creating banner ad")
        return apiService.createBannerAd(
            userId, title, description, targetUrl, expiresAt,
            contactName, contactNumber, industry, image
        )
    }
}
