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
    @State private var isRefreshing = false
    
    // Timer for auto-refresh
    let timer = Timer.publish(every: 2, on: .main, in: .common).autoconnect()
    
    var otherPersonName: String {
        if authViewModel.currentUser?.id == conversation.buyerId {
            return conversation.storeName ?? conversation.sellerName ?? "Seller"
        } else {
            return conversation.buyerName ?? "Buyer"
        }
    }
    
    var otherPersonPicture: String? {
        if authViewModel.currentUser?.id == conversation.buyerId {
            return conversation.sellerPicture
        } else {
            return conversation.buyerPicture
        }
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Messages list
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 16) {
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
                .background(Color(.systemGroupedBackground))
                .onAppear {
                    scrollProxy = proxy
                }
            }
            
            // Message input bar
            VStack(spacing: 0) {
                Divider()
                
                HStack(alignment: .bottom, spacing: 12) {
                    // Profile picture
                    if let profilePicture = otherPersonPicture {
                        AsyncImage(url: URL(string: "http://localhost:3000\(profilePicture)")) { phase in
                            switch phase {
                            case .success(let image):
                                image
                                    .resizable()
                                    .scaledToFill()
                            default:
                                Image(systemName: "person.circle.fill")
                                    .resizable()
                                    .foregroundColor(.gray)
                            }
                        }
                        .frame(width: 32, height: 32)
                        .clipShape(Circle())
                    }
                    
                    // Text input
                    TextField("Message \(otherPersonName)...", text: $messageText, axis: .vertical)
                        .textFieldStyle(.plain)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(Color(.systemGray6))
                        .cornerRadius(20)
                        .lineLimit(1...5)
                    
                    // Send button
                    Button(action: sendMessage) {
                        Image(systemName: "arrow.up.circle.fill")
                            .font(.system(size: 32))
                            .foregroundColor(messageText.trimmingCharacters(in: .whitespaces).isEmpty ? .gray : .orange)
                    }
                    .disabled(messageText.trimmingCharacters(in: .whitespaces).isEmpty)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .background(Color(.systemBackground))
            }
        }
        .navigationTitle(otherPersonName)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .principal) {
                VStack(spacing: 2) {
                    Text(otherPersonName)
                        .font(.headline)
                    
                    if isRefreshing {
                        HStack(spacing: 4) {
                            Image(systemName: "circle.fill")
                                .font(.system(size: 6))
                                .foregroundColor(.green)
                            Text("Online")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                    }
                }
            }
        }
        .task {
            await loadInitialMessages()
        }
        .onReceive(timer) { _ in
            Task {
                await refreshMessages()
            }
        }
        .onDisappear {
            timer.upstream.connect().cancel()
        }
        .onChange(of: messageViewModel.messages.count) { oldCount, newCount in
            if newCount > oldCount {
                scrollToBottom(animated: true)
            }
        }
    }
    
    private func loadInitialMessages() async {
        await messageViewModel.loadMessages(conversationId: conversation.id)
        scrollToBottom(animated: false)
        
        if let userId = authViewModel.currentUser?.id {
            await messageViewModel.markAsRead(conversationId: conversation.id, userId: userId)
        }
    }
    
    private func refreshMessages() async {
        let previousCount = messageViewModel.messages.count
        await messageViewModel.loadMessages(conversationId: conversation.id)
        
        // Mark as read if there are new messages
        if messageViewModel.messages.count > previousCount {
            if let userId = authViewModel.currentUser?.id {
                await messageViewModel.markAsRead(conversationId: conversation.id, userId: userId)
            }
        }
    }
    
    private func sendMessage() {
        guard let userId = authViewModel.currentUser?.id, 
              !messageText.trimmingCharacters(in: .whitespaces).isEmpty else {
            return
        }
        
        let text = messageText
        messageText = ""
        
        Task {
            await messageViewModel.sendMessage(conversationId: conversation.id, senderId: userId, message: text)
            scrollToBottom(animated: true)
        }
    }
    
    private func scrollToBottom(animated: Bool) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            if let lastMessage = messageViewModel.messages.last {
                if animated {
                    withAnimation {
                        scrollProxy?.scrollTo(lastMessage.id, anchor: .bottom)
                    }
                } else {
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
        HStack(alignment: .bottom, spacing: 8) {
            if isFromCurrentUser {
                Spacer(minLength: 60)
            }
            
            VStack(alignment: isFromCurrentUser ? .trailing : .leading, spacing: 4) {
                Text(message.message)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .background(isFromCurrentUser ? Color.orange : Color.white)
                    .foregroundColor(isFromCurrentUser ? .white : .primary)
                    .cornerRadius(20)
                    .shadow(color: Color.black.opacity(0.05), radius: 2, x: 0, y: 1)
                
                HStack(spacing: 4) {
                    Text(formatTime(message.createdAt))
                        .font(.caption2)
                        .foregroundColor(.secondary)
                    
                    if isFromCurrentUser {
                        Image(systemName: "checkmark")
                            .font(.system(size: 10))
                            .foregroundColor(.secondary)
                    }
                }
            }
            
            if !isFromCurrentUser {
                Spacer(minLength: 60)
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
