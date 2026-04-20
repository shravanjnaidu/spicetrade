package com.spicetrade.app.data.repository.impl

import com.spicetrade.app.data.api.ApiService
import com.spicetrade.app.data.models.Conversation
import com.spicetrade.app.data.models.ConversationResponse
import com.spicetrade.app.data.models.CreateConversationRequest
import com.spicetrade.app.data.models.GenericResponse
import com.spicetrade.app.data.models.Message
import com.spicetrade.app.data.models.SendMessageRequest
import com.spicetrade.app.data.models.UnreadCountResponse
import com.spicetrade.app.data.repository.MessageRepository
import timber.log.Timber
import javax.inject.Inject

class MessageRepositoryImpl @Inject constructor(
    private val apiService: ApiService
) : MessageRepository {

    override suspend fun getConversations(userId: Int): List<Conversation> {
        Timber.d("Fetching conversations for userId=%d", userId)
        return apiService.getConversations(userId)
    }

    override suspend fun createConversation(request: CreateConversationRequest): ConversationResponse {
        Timber.d("Creating conversation buyer=%d seller=%d", request.buyerId, request.sellerId)
        return apiService.createConversation(request)
    }

    override suspend fun getMessages(conversationId: Int): List<Message> {
        Timber.d("Fetching messages for conversationId=%d", conversationId)
        return apiService.getMessages(conversationId)
    }

    override suspend fun sendMessage(request: SendMessageRequest): GenericResponse {
        Timber.d("Sending message in conversationId=%d", request.conversationId)
        return apiService.sendMessage(request)
    }

    override suspend fun markMessagesAsRead(conversationId: Int, userId: Int): GenericResponse {
        Timber.d("Marking messages read conversationId=%d", conversationId)
        return apiService.markMessagesAsRead(conversationId, mapOf("userId" to userId))
    }

    override suspend fun getUnreadCount(userId: Int): UnreadCountResponse {
        return apiService.getUnreadCount(userId)
    }
}
