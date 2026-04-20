package com.spicetrade.app.data.repository

import com.spicetrade.app.data.models.Conversation
import com.spicetrade.app.data.models.ConversationResponse
import com.spicetrade.app.data.models.CreateConversationRequest
import com.spicetrade.app.data.models.GenericResponse
import com.spicetrade.app.data.models.Message
import com.spicetrade.app.data.models.SendMessageRequest
import com.spicetrade.app.data.models.UnreadCountResponse

interface MessageRepository {
    suspend fun getConversations(userId: Int): List<Conversation>
    suspend fun createConversation(request: CreateConversationRequest): ConversationResponse
    suspend fun getMessages(conversationId: Int): List<Message>
    suspend fun sendMessage(request: SendMessageRequest): GenericResponse
    suspend fun markMessagesAsRead(conversationId: Int, userId: Int): GenericResponse
    suspend fun getUnreadCount(userId: Int): UnreadCountResponse
}
