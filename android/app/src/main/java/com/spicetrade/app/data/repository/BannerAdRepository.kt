package com.spicetrade.app.data.repository

import com.spicetrade.app.data.models.BannerAd
import com.spicetrade.app.data.models.GenericResponse
import okhttp3.MultipartBody
import okhttp3.RequestBody

interface BannerAdRepository {
    suspend fun getMyBannerAds(userId: Int): List<BannerAd>
    suspend fun createBannerAd(
        userId: RequestBody,
        title: RequestBody,
        description: RequestBody,
        targetUrl: RequestBody,
        expiresAt: RequestBody,
        contactName: RequestBody,
        contactNumber: RequestBody,
        industry: RequestBody,
        image: MultipartBody.Part
    ): GenericResponse
}
