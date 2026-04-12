package com.spicetrade.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.spicetrade.app.data.api.RetrofitClient
import com.spicetrade.app.data.models.Conversation
import com.spicetrade.app.data.models.Message
import com.spicetrade.app.data.models.SendMessageRequest
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class MessageViewModel : ViewModel() {

    private val api = RetrofitClient.apiService

    private val _conversations = MutableStateFlow<List<Conversation>>(emptyList())
    val conversations: StateFlow<List<Conversation>> = _conversations.asStateFlow()

    private val _messages = MutableStateFlow<List<Message>>(emptyList())
    val messages: StateFlow<List<Message>> = _messages.asStateFlow()

    private val _unreadCount = MutableStateFlow(0)
    val unreadCount: StateFlow<Int> = _unreadCount.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    fun loadConversations(userId: Int) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                _conversations.value = api.getConversations(userId)
            } catch (e: Exception) {
                _errorMessage.value = e.message
            }
            _isLoading.value = false
        }
    }

    fun loadMessages(conversationId: Int) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                _messages.value = api.getMessages(conversationId)
            } catch (e: Exception) {
                _errorMessage.value = e.message
            }
            _isLoading.value = false
        }
    }

    fun sendMessage(conversationId: Int, senderId: Int, message: String) {
        viewModelScope.launch {
            try {
                api.sendMessage(conversationId, SendMessageRequest(senderId, message))
                loadMessages(conversationId)
            } catch (e: Exception) {
                _errorMessage.value = e.message
            }
        }
    }

    fun loadUnreadCount(userId: Int) {
        viewModelScope.launch {
            try {
                _unreadCount.value = api.getUnreadCount(userId).unreadCount
            } catch (e: Exception) {
                // non-critical
            }
        }
    }

    fun markAsRead(conversationId: Int, userId: Int) {
        viewModelScope.launch {
            try {
                api.markMessagesAsRead(conversationId, mapOf("user_id" to userId))
                loadUnreadCount(userId)
            } catch (e: Exception) {
                // non-critical
            }
        }
    }
}
