package com.spicetrade.app.domain.util

/**
 * Generic wrapper for API / repository results.
 * Use this in ViewModels that need to track loading + error states per operation.
 */
sealed class Resource<out T> {
    data object Loading : Resource<Nothing>()
    data class Success<T>(val data: T) : Resource<T>()
    data class Error(val message: String, val throwable: Throwable? = null) : Resource<Nothing>()

    val isLoading get() = this is Loading
    val isSuccess get() = this is Success
    val isError get() = this is Error

    fun getOrNull(): T? = (this as? Success)?.data
    fun errorMessage(): String? = (this as? Error)?.message
}

/** Execute a suspend block and wrap the result in [Resource]. */
suspend fun <T> safeApiCall(block: suspend () -> T): Resource<T> = try {
    Resource.Success(block())
} catch (e: Exception) {
    Resource.Error(e.message ?: "Unknown error", e)
}
