package com.spicetrade.app.data.repository

import com.spicetrade.app.data.models.GenericResponse
import com.spicetrade.app.data.models.Product
import com.spicetrade.app.data.models.ProductResponse

interface ProductRepository {
    suspend fun getProducts(): List<Product>
    suspend fun createProduct(body: Map<String, Any?>): ProductResponse
    suspend fun updateProduct(id: Int, updates: Map<String, Any?>): GenericResponse
    suspend fun deleteProduct(id: Int): GenericResponse
    suspend fun incrementView(id: Int)
}
