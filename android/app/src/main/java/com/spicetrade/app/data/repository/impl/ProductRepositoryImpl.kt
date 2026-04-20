package com.spicetrade.app.data.repository.impl

import com.spicetrade.app.data.api.ApiService
import com.spicetrade.app.data.models.GenericResponse
import com.spicetrade.app.data.models.Product
import com.spicetrade.app.data.models.ProductResponse
import com.spicetrade.app.data.repository.ProductRepository
import timber.log.Timber
import javax.inject.Inject

class ProductRepositoryImpl @Inject constructor(
    private val apiService: ApiService
) : ProductRepository {

    override suspend fun getProducts(): List<Product> {
        Timber.d("Fetching products from API")
        return apiService.getProducts()
    }

    override suspend fun createProduct(body: Map<String, Any?>): ProductResponse {
        Timber.d("Creating product: %s", body["title"])
        return apiService.createProduct(body.filterValues { it != null })
    }

    override suspend fun updateProduct(id: Int, updates: Map<String, Any?>): GenericResponse {
        Timber.d("Updating product id=%d", id)
        return apiService.updateProduct(id, updates.filterValues { it != null })
    }

    override suspend fun deleteProduct(id: Int): GenericResponse {
        Timber.d("Deleting product id=%d", id)
        return apiService.deleteProduct(id)
    }

    override suspend fun incrementView(id: Int) {
        try { apiService.incrementAdView(id) } catch (e: Exception) {
            Timber.w(e, "Failed to increment view for product %d", id)
        }
    }
}
