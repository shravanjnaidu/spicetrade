package com.spicetrade.app.data.repository

import com.spicetrade.app.data.models.GenericResponse
import com.spicetrade.app.data.models.Store

interface StoreRepository {
    suspend fun getStores(): List<Store>
    suspend fun getPublicProfile(userId: Int): Store
    suspend fun incrementView(storeId: Int)
    suspend fun updateProfile(updates: Map<String, Any?>): GenericResponse
}
