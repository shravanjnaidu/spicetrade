//
//  MessageViewModel.swift
//  SpiceTrade
//

import Foundation

@MainActor
class MessageViewModel: ObservableObject {
    @Published var conversations: [Conversation] = []
    @Published var messages: [Message] = []
    @Published var unreadCount = 0
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    func loadConversations(userId: Int) async {
        isLoading = true
        do {
            conversations = try await APIService.shared.getConversations(userId: userId)
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
    
    func loadMessages(conversationId: Int) async {
        isLoading = true
        do {
            messages = try await APIService.shared.getMessages(conversationId: conversationId)
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
    
    func sendMessage(conversationId: Int, senderId: Int, message: String) async {
        do {
            try await APIService.shared.sendMessage(conversationId: conversationId, senderId: senderId, message: message)
            await loadMessages(conversationId: conversationId)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
    
    func loadUnreadCount(userId: Int) async {
        do {
            unreadCount = try await APIService.shared.getUnreadCount(userId: userId)
        } catch {
            print("Error loading unread count: \(error)")
        }
    }
    
    func markAsRead(conversationId: Int, userId: Int) async {
        do {
            try await APIService.shared.markMessagesAsRead(conversationId: conversationId, userId: userId)
            await loadUnreadCount(userId: userId)
        } catch {
            print("Error marking as read: \(error)")
        }
    }
}
