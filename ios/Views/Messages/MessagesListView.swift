//
//  MessagesListView.swift
//  SpiceTrade
//

import SwiftUI

struct MessagesListView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @EnvironmentObject var messageViewModel: MessageViewModel
    
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
                    }
                    .listStyle(.plain)
                    .refreshable {
                        if let userId = authViewModel.currentUser?.id {
                            await messageViewModel.loadConversations(userId: userId)
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
    
    var body: some View {
        HStack(spacing: 12) {
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
                    }
                }
                .frame(width: 50, height: 50)
                .clipShape(Circle())
            } else {
                Image(systemName: currentUserId == conversation.buyerId ? "storefront.circle.fill" : "person.circle.fill")
                    .resizable()
                    .frame(width: 50, height: 50)
                    .foregroundColor(.orange)
            }
            
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(otherPersonName)
                        .font(.headline)
                    
                    Spacer()
                    
                    if let unreadCount = conversation.unreadCount, unreadCount > 0 {
                        Text("\(unreadCount)")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color.orange)
                            .clipShape(Capsule())
                    }
                }
                
                if let lastMessage = conversation.lastMessage {
                    Text(lastMessage)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .lineLimit(2)
                }
                
                if let lastMessageTime = conversation.lastMessageTime {
                    Text(formatDate(lastMessageTime))
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(.vertical, 4)
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
