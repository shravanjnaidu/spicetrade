//
//  MessagesListView.swift
//  SpiceTrade
//

import SwiftUI

struct MessagesListView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @EnvironmentObject var messageViewModel: MessageViewModel

    let timer = Timer.publish(every: 5, on: .main, in: .common).autoconnect()

    var body: some View {
        NavigationStack {
            ZStack {
                Color(.systemGroupedBackground).ignoresSafeArea()

                if messageViewModel.isLoading && messageViewModel.conversations.isEmpty {
                    VStack(spacing: 14) {
                        ProgressView().scaleEffect(1.3)
                        Text("Loading messages…")
                            .font(.subheadline).foregroundColor(.secondary)
                    }
                } else if messageViewModel.conversations.isEmpty {
                    emptyState
                } else {
                    ScrollView {
                        LazyVStack(spacing: 0) {
                            ForEach(messageViewModel.conversations) { conversation in
                                NavigationLink(destination: ChatView(conversation: conversation)) {
                                    PremiumConversationRow(
                                        conversation: conversation,
                                        currentUserId: authViewModel.currentUser?.id ?? 0
                                    )
                                }
                                .buttonStyle(PlainButtonStyle())

                                Divider()
                                    .padding(.leading, 82)
                            }
                        }
                        .background(Color(.systemBackground))
                        .cornerRadius(16)
                        .shadow(color: .black.opacity(0.06), radius: 10, x: 0, y: 4)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                    }
                    .refreshable {
                        if let userId = authViewModel.currentUser?.id {
                            await messageViewModel.loadConversations(userId: userId)
                            await messageViewModel.loadUnreadCount(userId: userId)
                        }
                    }
                }
            }
            .navigationTitle("Messages")
            .navigationBarTitleDisplayMode(.large)
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

    private var emptyState: some View {
        VStack(spacing: 18) {
            ZStack {
                Circle()
                    .fill(Color.orange.opacity(0.12))
                    .frame(width: 100, height: 100)
                Image(systemName: "bubble.left.and.bubble.right.fill")
                    .font(.system(size: 38))
                    .foregroundColor(.orange)
            }
            Text("No Messages Yet")
                .font(.title3).fontWeight(.bold)
            Text("Start a conversation with a seller\nor buyer to get started.")
                .font(.subheadline).foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
    }
}

// MARK: - Premium Conversation Row

struct PremiumConversationRow: View {
    let conversation: Conversation
    let currentUserId: Int

    private let brandRed    = Color(red: 0.65, green: 0.15, blue: 0.02)
    private let brandOrange = Color(red: 0.95, green: 0.50, blue: 0.08)

    var otherPersonName: String {
        currentUserId == conversation.buyerId
            ? (conversation.storeName ?? conversation.sellerName ?? "Seller")
            : (conversation.buyerName ?? "Buyer")
    }

    var otherPersonPicture: String? {
        currentUserId == conversation.buyerId
            ? conversation.sellerPicture
            : conversation.buyerPicture
    }

    var hasUnread: Bool { (conversation.unreadCount ?? 0) > 0 }
    var isBuyer: Bool { currentUserId == conversation.buyerId }

    var body: some View {
        HStack(spacing: 14) {
            // Avatar
            ZStack(alignment: .bottomTrailing) {
                avatarView
                    .frame(width: 52, height: 52)

                if hasUnread {
                    Circle()
                        .fill(Color.red)
                        .frame(width: 14, height: 14)
                        .overlay(Circle().stroke(Color(.systemBackground), lineWidth: 2))
                }
            }

            // Content
            VStack(alignment: .leading, spacing: 4) {
                HStack(alignment: .firstTextBaseline) {
                    Text(otherPersonName)
                        .font(.system(size: 15, weight: hasUnread ? .bold : .semibold))
                        .foregroundColor(.primary)
                        .lineLimit(1)

                    Spacer()

                    if let t = conversation.lastMessageTime {
                        Text(formatDate(t))
                            .font(.system(size: 12))
                            .foregroundColor(hasUnread ? brandOrange : .secondary)
                            .fontWeight(hasUnread ? .semibold : .regular)
                    }
                }

                HStack {
                    if let lastMessage = conversation.lastMessage {
                        Text(lastMessage)
                            .font(.system(size: 13))
                            .foregroundColor(hasUnread ? .primary : .secondary)
                            .fontWeight(hasUnread ? .medium : .regular)
                            .lineLimit(1)
                    }

                    Spacer()

                    if let count = conversation.unreadCount, count > 0 {
                        Text("\(count)")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 7).padding(.vertical, 3)
                            .background(Color.red)
                            .clipShape(Capsule())
                    }
                }
            }

            Image(systemName: "chevron.right")
                .font(.system(size: 11, weight: .semibold))
                .foregroundColor(Color(.systemGray3))
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(hasUnread
            ? Color(red: 1.0, green: 0.97, blue: 0.94)
            : Color(.systemBackground)
        )
    }

    @ViewBuilder
    private var avatarView: some View {
        if let pic = otherPersonPicture {
            AsyncImage(url: URL(string: "\(APIConfig.baseURL)\(pic)")) { phase in
                switch phase {
                case .success(let img):
                    img.resizable().scaledToFill().clipShape(Circle())
                default:
                    defaultAvatar
                }
            }
        } else {
            defaultAvatar
        }
    }

    private var defaultAvatar: some View {
        ZStack {
            Circle()
                .fill(
                    LinearGradient(
                        colors: [brandRed.opacity(0.8), brandOrange],
                        startPoint: .topLeading, endPoint: .bottomTrailing
                    )
                )
            Image(systemName: isBuyer ? "storefront.fill" : "person.fill")
                .font(.system(size: 22, weight: .semibold))
                .foregroundColor(.white)
        }
    }

    private func formatDate(_ dateString: String) -> String {
        let formatter = ISO8601DateFormatter()
        if let date = formatter.date(from: dateString) {
            let components = Calendar.current.dateComponents([.day, .hour, .minute], from: date, to: Date())
            if let d = components.day, d > 0 { return d == 1 ? "Yesterday" : "\(d)d" }
            if let h = components.hour, h > 0 { return "\(h)h" }
            if let m = components.minute, m > 0 { return "\(m)m" }
            return "Now"
        }
        return dateString
    }
}

// MARK: - Backwards-compat alias
typealias ConversationRow = PremiumConversationRow

#Preview {
    MessagesListView()
        .environmentObject(AuthViewModel())
        .environmentObject(MessageViewModel())
}
