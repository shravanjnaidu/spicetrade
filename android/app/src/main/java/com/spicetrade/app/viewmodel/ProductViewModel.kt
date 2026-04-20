package com.spicetrade.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.spicetrade.app.data.models.Product
import com.spicetrade.app.data.repository.ProductRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import timber.log.Timber
import javax.inject.Inject

enum class SortOption { FEATURED, PRICE_LOW_HIGH, PRICE_HIGH_LOW, NEWEST }

@HiltViewModel
class ProductViewModel @Inject constructor(
    private val repository: ProductRepository
) : ViewModel() {

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
    val minPrice = MutableStateFlow<Double?>(null)
    val maxPrice = MutableStateFlow<Double?>(null)
    val minRating = MutableStateFlow<Double?>(null)

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
                result = result.filter { p -> p.tags?.any { it in tags } == true }
            }
            minPrice.value?.let { min -> result = result.filter { (it.price ?: 0.0) >= min } }
            maxPrice.value?.let { max -> result = result.filter { (it.price ?: Double.MAX_VALUE) <= max } }
            minRating.value?.let { minR -> result = result.filter { (it.averageRating ?: 0.0) >= minR } }
            result = when (sortOption.value) {
                SortOption.PRICE_LOW_HIGH -> result.sortedBy { it.price ?: 0.0 }
                SortOption.PRICE_HIGH_LOW -> result.sortedByDescending { it.price ?: 0.0 }
                SortOption.NEWEST -> result.sortedByDescending { it.createdAt ?: "" }
                SortOption.FEATURED -> result
            }
            return result
        }

    val hasActiveFilters: Boolean
        get() = selectedCategory.value != null || selectedTags.value.isNotEmpty() ||
                minPrice.value != null || maxPrice.value != null || minRating.value != null

    val activeFilterCount: Int
        get() = listOfNotNull(
            selectedCategory.value,
            if (selectedTags.value.isNotEmpty()) "tags" else null,
            minPrice.value,
            maxPrice.value,
            minRating.value
        ).size

    val availableCategories: List<String>
        get() = _products.value.mapNotNull { it.category }.distinct().sorted()

    init { loadProducts() }

    fun loadProducts() {
        viewModelScope.launch {
            _isLoading.value = true
            _errorMessage.value = null
            try {
                _products.value = repository.getProducts()
                Timber.d("Loaded %d products", _products.value.size)
            } catch (e: Exception) {
                Timber.e(e, "Failed to load products")
                _errorMessage.value = e.message ?: "Failed to load products"
            }
            _isLoading.value = false
        }
    }

    fun deleteProduct(product: Product) {
        viewModelScope.launch {
            try {
                repository.deleteProduct(product.id)
                _products.value = _products.value.filter { it.id != product.id }
                Timber.d("Deleted product id=%d", product.id)
            } catch (e: Exception) {
                Timber.e(e, "Failed to delete product")
                _errorMessage.value = e.message
            }
        }
    }

    fun createListing(body: Map<String, Any?>) {
        viewModelScope.launch {
            try {
                repository.createProduct(body)
                loadProducts()
            } catch (e: Exception) {
                Timber.e(e, "Failed to create listing")
                _errorMessage.value = e.message
            }
        }
    }

    fun clearFilters() {
        selectedCategory.value = null
        selectedTags.value = emptySet()
        minPrice.value = null
        maxPrice.value = null
        minRating.value = null
    }
}
