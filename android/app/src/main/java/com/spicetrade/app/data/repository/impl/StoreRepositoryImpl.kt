package com.spicetrade.app.data.repository.impl

import com.spicetrade.app.data.api.ApiService
import com.spicetrade.app.data.models.GenericResponse
import com.spicetrade.app.data.models.Store
import com.spicetrade.app.data.repository.StoreRepository
import timber.log.Timber
import javax.inject.Inject

class StoreRepositoryImpl @Inject constructor(
    private val apiService: ApiService
) : StoreRepository {

    override suspend fun getStores(): List<Store> {
        Timber.d("Fetching stores from API")
        return apiService.getStores()
    }

    override suspend fun getPublicProfile(userId: Int): Store {
        Timber.d("Fetching public profile for userId=%d", userId)
        return apiService.getPublicProfile(userId)
    }

    override suspend fun incrementView(storeId: Int) {
        try { apiService.incrementStoreView(storeId) } catch (e: Exception) {
            Timber.w(e, "Failed to increment view for store %d", storeId)
        }
    }

    override suspend fun updateProfile(updates: Map<String, Any?>): GenericResponse {
        Timber.d("Updating user profile")
        return apiService.updateProfile(updates.filterValues { it != null })
    }
}
