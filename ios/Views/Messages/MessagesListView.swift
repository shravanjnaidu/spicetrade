//
//  MessagesListView.swift
//  SpiceTrade
//

import SwiftUI

struct MessagesListView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @EnvironmentObject var messageViewModel: MessageViewModel
    
    // Timer for auto-refresh
    let timer = Timer.publish(every: 5, on: .main, in: .common).autoconnect()
    
    var body: some View {
        NavigationStack {
            Group {
                if messageViewModel.isLoading && messageViewModel.conversations.isEmpty {
                    ProgressView("Loading messages...")
                } else if messageViewModel.conversations.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "message")
                            .font(.system(size: 60))
                            .foregroundColor(.gray)
                        
                        Text("No conversations yet")
                            .font(.headline)
                        
                        Text("Start chatting with sellers or buyers")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding()
                } else {
                    List(messageViewModel.conversations) { conversation in
                        NavigationLink(destination: ChatView(conversation: conversation)) {
                            ConversationRow(conversation: conversation, currentUserId: authViewModel.currentUser?.id ?? 0)
                        }
                        .listRowBackground(
                            (conversation.unreadCount ?? 0) > 0 ? 
                            Color.orange.opacity(0.05) : Color.clear
                        )
                    }
                    .listStyle(.plain)
                    .refreshable {
                        if let userId = authViewModel.currentUser?.id {
                            await messageViewModel.loadConversations(userId: userId)
                            await messageViewModel.loadUnreadCount(userId: userId)
                        }
                    }
                }
            }
            .navigationTitle("Messages")
            .task {
                if let userId = authViewModel.currentUser?.id {
                    await messageViewModel.loadConversations(userId: userId)
                    await messageViewModel.loadUnreadCount(userId: userId)
                }
            }
            .onReceive(timer) { _ in
                Task {
                    if let userId = authViewModel.currentUser?.id {
                        await messageViewModel.loadConversations(userId: userId)
                        await messageViewModel.loadUnreadCount(userId: userId)
                    }
                }
            }
        }
    }
}

struct ConversationRow: View {
    let conversation: Conversation
    let currentUserId: Int
    
    var otherPersonName: String {
        if currentUserId == conversation.buyerId {
            return conversation.storeName ?? conversation.sellerName ?? "Seller"
        } else {
            return conversation.buyerName ?? "Buyer"
        }
    }
    
    var otherPersonPicture: String? {
        if currentUserId == conversation.buyerId {
            return conversation.sellerPicture
        } else {
            return conversation.buyerPicture
        }
    }
    
    var hasUnread: Bool {
        (conversation.unreadCount ?? 0) > 0
    }
    
    var body: some View {
        HStack(spacing: 12) {
            // Profile picture with unread indicator
            ZStack(alignment: .topTrailing) {
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
                        }
                    }
                    .frame(width: 56, height: 56)
                    .clipShape(Circle())
                } else {
                    Image(systemName: currentUserId == conversation.buyerId ? "storefront.circle.fill" : "person.circle.fill")
                        .resizable()
                        .frame(width: 56, height: 56)
                        .foregroundColor(.orange)
                }
                
                // Red dot for unread
                if hasUnread {
                    Circle()
                        .fill(Color.red)
                        .frame(width: 16, height: 16)
                        .overlay(
                            Circle()
                                .stroke(Color.white, lineWidth: 2)
                        )
                        .offset(x: 4, y: -4)
                }
            }
            
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text(otherPersonName)
                        .font(hasUnread ? .headline : .body)
                        .fontWeight(hasUnread ? .bold : .regular)
                    
                    Spacer()
                    
                    if let lastMessageTime = conversation.lastMessageTime {
                        Text(formatDate(lastMessageTime))
                            .font(.caption)
                            .foregroundColor(hasUnread ? .orange : .secondary)
                            .fontWeight(hasUnread ? .semibold : .regular)
                    }
                }
                
                HStack {
                    if let lastMessage = conversation.lastMessage {
                        Text(lastMessage)
                            .font(.subheadline)
                            .foregroundColor(hasUnread ? .primary : .secondary)
                            .fontWeight(hasUnread ? .semibold : .regular)
                            .lineLimit(2)
                    }
                    
                    Spacer()
                    
                    if let unreadCount = conversation.unreadCount, unreadCount > 0 {
                        Text("\(unreadCount)")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                            .frame(minWidth: 20, minHeight: 20)
                            .padding(.horizontal, 6)
                            .background(Color.red)
                            .clipShape(Circle())
                    }
                }
            }
        }
        .padding(.vertical, 8)
    }
    
    private func formatDate(_ dateString: String) -> String {
        // Simple date formatting - can be enhanced
        let formatter = ISO8601DateFormatter()
        if let date = formatter.date(from: dateString) {
            let now = Date()
            let components = Calendar.current.dateComponents([.day, .hour, .minute], from: date, to: now)
            
            if let days = components.day, days > 0 {
                return days == 1 ? "Yesterday" : "\(days)d ago"
            } else if let hours = components.hour, hours > 0 {
                return "\(hours)h ago"
            } else if let minutes = components.minute, minutes > 0 {
                return "\(minutes)m ago"
            } else {
                return "Just now"
            }
        }
        return dateString
    }
}

#Preview {
    MessagesListView()
        .environmentObject(AuthViewModel())
        .environmentObject(MessageViewModel())
}
