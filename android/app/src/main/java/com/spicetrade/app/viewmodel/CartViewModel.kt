package com.spicetrade.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.spicetrade.app.data.models.CartItem
import com.spicetrade.app.data.models.Product
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import timber.log.Timber
import javax.inject.Inject

@HiltViewModel
class CartViewModel @Inject constructor() : ViewModel() {

    private val _items = MutableStateFlow<List<CartItem>>(emptyList())
    val items: StateFlow<List<CartItem>> = _items.asStateFlow()

    val cartCount: StateFlow<Int> = _items
        .map { list -> list.sumOf { it.quantity } }
        .stateIn(viewModelScope, SharingStarted.Eagerly, 0)

    val cartTotal: StateFlow<Double> = _items
        .map { list -> list.sumOf { (it.product.price ?: 0.0) * it.quantity } }
        .stateIn(viewModelScope, SharingStarted.Eagerly, 0.0)

    fun addToCart(product: Product, quantity: Int = 1) {
        val current = _items.value.toMutableList()
        val idx = current.indexOfFirst { it.product.id == product.id }
        if (idx >= 0) {
            current[idx] = current[idx].copy(quantity = current[idx].quantity + quantity)
        } else {
            current.add(CartItem(product = product, quantity = quantity))
        }
        _items.value = current
        Timber.d("Cart: added productId=%d qty=%d total=%d items", product.id, quantity, current.size)
    }

    fun removeFromCart(productId: Int) {
        _items.value = _items.value.filter { it.product.id != productId }
        Timber.d("Cart: removed productId=%d", productId)
    }

    fun updateQuantity(productId: Int, delta: Int) {
        val current = _items.value.toMutableList()
        val idx = current.indexOfFirst { it.product.id == productId }
        if (idx < 0) return
        val newQty = current[idx].quantity + delta
        if (newQty <= 0) {
            current.removeAt(idx)
        } else {
            current[idx] = current[idx].copy(quantity = newQty)
        }
        _items.value = current
    }

    fun getQuantity(productId: Int): Int =
        _items.value.find { it.product.id == productId }?.quantity ?: 0

    fun isInCart(productId: Int): Boolean =
        _items.value.any { it.product.id == productId }

    fun clearCart() {
        _items.value = emptyList()
        Timber.d("Cart cleared")
    }
}
