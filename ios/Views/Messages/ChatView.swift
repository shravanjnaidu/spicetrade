//
//  ChatView.swift
//  SpiceTrade
//

import SwiftUI

struct ChatView: View {
    let conversation: Conversation
    @EnvironmentObject var authViewModel: AuthViewModel
    @StateObject private var messageViewModel = MessageViewModel()
    @State private var messageText = ""
    @State private var scrollProxy: ScrollViewProxy?
    
    var otherPersonName: String {
        if authViewModel.currentUser?.id == conversation.buyerId {
            return conversation.storeName ?? conversation.sellerName ?? "Seller"
        } else {
            return conversation.buyerName ?? "Buyer"
        }
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Messages list
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(messageViewModel.messages) { message in
                            MessageBubble(
                                message: message,
                                isFromCurrentUser: message.senderId == authViewModel.currentUser?.id
                            )
                            .id(message.id)
                        }
                    }
                    .padding()
                }
                .onAppear {
                    scrollProxy = proxy
                }
            }
            
            // Message input
            HStack(spacing: 12) {
                TextField("Type a message...", text: $messageText, axis: .vertical)
                    .textFieldStyle(.roundedBorder)
                    .lineLimit(1...5)
                
                Button(action: sendMessage) {
                    Image(systemName: "paperplane.fill")
                        .foregroundColor(.white)
                        .padding(10)
                        .background(messageText.isEmpty ? Color.gray : Color.orange)
                        .clipShape(Circle())
                }
                .disabled(messageText.isEmpty)
            }
            .padding()
            .background(Color(.systemBackground))
            .shadow(color: .black.opacity(0.1), radius: 3, y: -2)
        }
        .navigationTitle(otherPersonName)
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await messageViewModel.loadMessages(conversationId: conversation.id)
            scrollToBottom()
            
            if let userId = authViewModel.currentUser?.id {
                await messageViewModel.markAsRead(conversationId: conversation.id, userId: userId)
            }
        }
        .onChange(of: messageViewModel.messages.count) { _, _ in
            scrollToBottom()
        }
    }
    
    private func sendMessage() {
        guard let userId = authViewModel.currentUser?.id, !messageText.trimmingCharacters(in: .whitespaces).isEmpty else {
            return
        }
        
        let text = messageText
        messageText = ""
        
        Task {
            await messageViewModel.sendMessage(conversationId: conversation.id, senderId: userId, message: text)
        }
    }
    
    private func scrollToBottom() {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            if let lastMessage = messageViewModel.messages.last {
                withAnimation {
                    scrollProxy?.scrollTo(lastMessage.id, anchor: .bottom)
                }
            }
        }
    }
}

struct MessageBubble: View {
    let message: Message
    let isFromCurrentUser: Bool
    
    var body: some View {
        HStack {
            if isFromCurrentUser {
                Spacer()
            }
            
            VStack(alignment: isFromCurrentUser ? .trailing : .leading, spacing: 4) {
                if !isFromCurrentUser {
                    Text(message.senderName ?? "Unknown")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Text(message.message)
                    .padding(12)
                    .background(isFromCurrentUser ? Color.orange : Color(.systemGray5))
                    .foregroundColor(isFromCurrentUser ? .white : .primary)
                    .cornerRadius(16)
                
                Text(formatTime(message.createdAt))
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
            .frame(maxWidth: 250, alignment: isFromCurrentUser ? .trailing : .leading)
            
            if !isFromCurrentUser {
                Spacer()
            }
        }
    }
    
    private func formatTime(_ dateString: String) -> String {
        let formatter = ISO8601DateFormatter()
        if let date = formatter.date(from: dateString) {
            let timeFormatter = DateFormatter()
            timeFormatter.timeStyle = .short
            return timeFormatter.string(from: date)
        }
        return dateString
    }
}

#Preview {
    NavigationStack {
        ChatView(conversation: Conversation(
            id: 1,
            buyerId: 1,
            sellerId: 2,
            listingId: 1,
            createdAt: "2024-01-01",
            buyerName: "John Doe",
            buyerEmail: "john@example.com",
            buyerPicture: nil,
            sellerName: "Spice Store",
            sellerEmail: "store@example.com",
            sellerPicture: nil,
            storeName: "Spice Emporium",
            lastMessage: "Hello",
            lastMessageTime: "2024-01-01",
            unreadCount: 0
        ))
    }
    .environmentObject(AuthViewModel())
}
