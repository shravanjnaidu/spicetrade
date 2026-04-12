package com.spicetrade.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.spicetrade.app.data.api.RetrofitClient
import com.spicetrade.app.data.models.Product
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

enum class SortOption { FEATURED, PRICE_LOW_HIGH, PRICE_HIGH_LOW, NEWEST }

class ProductViewModel : ViewModel() {

    private val api = RetrofitClient.apiService

    private val _products = MutableStateFlow<List<Product>>(emptyList())
    val products: StateFlow<List<Product>> = _products.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    val searchText = MutableStateFlow("")
    val selectedCategory = MutableStateFlow<String?>(null)
    val selectedTags = MutableStateFlow<Set<String>>(emptySet())
    val sortOption = MutableStateFlow(SortOption.FEATURED)

    val filteredProducts: List<Product>
        get() {
            var result = _products.value
            val query = searchText.value.trim().lowercase()
            if (query.isNotEmpty()) {
                result = result.filter { p ->
                    p.title.lowercase().contains(query) ||
                    p.description.lowercase().contains(query) ||
                    (p.category?.lowercase()?.contains(query) == true) ||
                    (p.storeName?.lowercase()?.contains(query) == true) ||
                    (p.tags?.any { it.lowercase().contains(query) } == true)
                }
            }
            selectedCategory.value?.let { cat ->
                if (cat.isNotEmpty()) result = result.filter { it.category == cat }
            }
            val tags = selectedTags.value
            if (tags.isNotEmpty()) {
                result = result.filter { p ->
                    p.tags?.any { it in tags } == true
                }
            }
            result = when (sortOption.value) {
                SortOption.PRICE_LOW_HIGH -> result.sortedBy { it.price ?: 0.0 }
                SortOption.PRICE_HIGH_LOW -> result.sortedByDescending { it.price ?: 0.0 }
                SortOption.NEWEST -> result.sortedByDescending { it.createdAt ?: "" }
                SortOption.FEATURED -> result
            }
            return result
        }

    val hasActiveFilters: Boolean
        get() = selectedCategory.value != null || selectedTags.value.isNotEmpty()

    val availableCategories: List<String>
        get() = _products.value.mapNotNull { it.category }.distinct().sorted()

    init { loadProducts() }

    fun loadProducts() {
        viewModelScope.launch {
            _isLoading.value = true
            _errorMessage.value = null
            try {
                _products.value = api.getProducts()
            } catch (e: Exception) {
                _errorMessage.value = e.message ?: "Failed to load products"
            }
            _isLoading.value = false
        }
    }

    fun deleteProduct(product: Product) {
        viewModelScope.launch {
            try {
                api.deleteProduct(product.id)
                _products.value = _products.value.filter { it.id != product.id }
            } catch (e: Exception) {
                _errorMessage.value = e.message
            }
        }
    }

    fun createListing(body: Map<String, Any?>) {
        viewModelScope.launch {
            try {
                api.createProduct(body.filterValues { it != null })
                loadProducts()
            } catch (e: Exception) {
                _errorMessage.value = e.message
            }
        }
    }

    fun clearFilters() {
        selectedCategory.value = null
        selectedTags.value = emptySet()
    }
}
