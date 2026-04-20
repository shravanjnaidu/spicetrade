package com.spicetrade.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.spicetrade.app.data.models.Conversation
import com.spicetrade.app.data.models.CreateConversationRequest
import com.spicetrade.app.data.models.Message
import com.spicetrade.app.data.models.SendMessageRequest
import com.spicetrade.app.data.repository.MessageRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import timber.log.Timber
import javax.inject.Inject

@HiltViewModel
class MessageViewModel @Inject constructor(
    private val repository: MessageRepository
) : ViewModel() {

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

    // Holds the ID of a freshly-created conversation so the UI can navigate to it
    private val _newConversationId = MutableStateFlow<Int?>(null)
    val newConversationId: StateFlow<Int?> = _newConversationId.asStateFlow()

    fun loadConversations(userId: Int) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                _conversations.value = repository.getConversations(userId)
                Timber.d("Loaded %d conversations", _conversations.value.size)
            } catch (e: Exception) {
                Timber.e(e, "Failed to load conversations")
                _errorMessage.value = e.message
            }
            _isLoading.value = false
        }
    }

    fun loadMessages(conversationId: Int) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                _messages.value = repository.getMessages(conversationId)
            } catch (e: Exception) {
                Timber.e(e, "Failed to load messages")
                _errorMessage.value = e.message
            }
            _isLoading.value = false
        }
    }

    fun sendMessage(conversationId: Int, senderId: Int, message: String) {
        viewModelScope.launch {
            try {
                repository.sendMessage(SendMessageRequest(conversationId, senderId, message))
                loadMessages(conversationId)
            } catch (e: Exception) {
                Timber.e(e, "Failed to send message")
                _errorMessage.value = e.message
            }
        }
    }

    fun loadUnreadCount(userId: Int) {
        viewModelScope.launch {
            try {
                _unreadCount.value = repository.getUnreadCount(userId).unreadCount
            } catch (e: Exception) {
                Timber.w(e, "Failed to fetch unread count")
            }
        }
    }

    fun markAsRead(conversationId: Int, userId: Int) {
        viewModelScope.launch {
            try {
                repository.markMessagesAsRead(conversationId, userId)
                loadUnreadCount(userId)
            } catch (e: Exception) {
                Timber.w(e, "Failed to mark messages as read")
            }
        }
    }

    fun createConversation(buyerId: Int, sellerId: Int, listingId: Int?) {
        viewModelScope.launch {
            try {
                val response = repository.createConversation(
                    CreateConversationRequest(buyerId, sellerId, listingId)
                )
                if (response.success) {
                    _newConversationId.value = response.conversationId
                    loadConversations(buyerId)
                    Timber.d("Conversation created id=%d", response.conversationId)
                }
            } catch (e: Exception) {
                Timber.e(e, "Failed to create conversation")
            }
        }
    }

    fun clearNewConversationId() { _newConversationId.value = null }
}
