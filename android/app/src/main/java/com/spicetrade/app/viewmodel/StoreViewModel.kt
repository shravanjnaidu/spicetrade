package com.spicetrade.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.spicetrade.app.data.models.Store
import com.spicetrade.app.data.repository.StoreRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import timber.log.Timber
import javax.inject.Inject

@HiltViewModel
class StoreViewModel @Inject constructor(
    private val repository: StoreRepository
) : ViewModel() {

    private val _stores = MutableStateFlow<List<Store>>(emptyList())
    val stores: StateFlow<List<Store>> = _stores.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    val searchText = MutableStateFlow("")

    val filteredStores: List<Store>
        get() {
            val q = searchText.value.trim().lowercase()
            if (q.isEmpty()) return _stores.value
            return _stores.value.filter { s ->
                (s.storeName?.lowercase()?.contains(q) == true) ||
                (s.name?.lowercase()?.contains(q) == true) ||
                (s.categories?.lowercase()?.contains(q) == true) ||
                (s.location?.lowercase()?.contains(q) == true)
            }
        }

    init { loadStores() }

    fun loadStores() {
        viewModelScope.launch {
            _isLoading.value = true
            _errorMessage.value = null
            try {
                _stores.value = repository.getStores()
                Timber.d("Loaded %d stores", _stores.value.size)
            } catch (e: Exception) {
                Timber.e(e, "Failed to load stores")
                _errorMessage.value = e.message ?: "Failed to load stores"
            }
            _isLoading.value = false
        }
    }

    fun incrementView(storeId: Int) {
        viewModelScope.launch {
            repository.incrementView(storeId)
        }
    }
}
