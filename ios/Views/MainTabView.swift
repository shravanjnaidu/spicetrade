//
//  MainTabView.swift
//  SpiceTrade
//

import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @StateObject private var messageViewModel = MessageViewModel()
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            // Home/Products
            ProductsListView()
                .tabItem {
                    Label("Home", systemImage: "house.fill")
                }
                .tag(0)
            
            // Wishlist (Buyers) or Dashboard (Sellers)
            if authViewModel.currentUser?.isSeller == true {
                SellerDashboardView()
                    .tabItem {
                        Label("Dashboard", systemImage: "chart.bar.fill")
                    }
                    .tag(1)
            } else {
                WishlistView()
                    .tabItem {
                        Label("Wishlist", systemImage: "heart.fill")
                    }
                    .tag(1)
            }
            
            // Messages
            MessagesListView()
                .environmentObject(messageViewModel)
                .tabItem {
                    Label("Messages", systemImage: "message.fill")
                }
                .badge(messageViewModel.unreadCount > 0 ? messageViewModel.unreadCount : 0)
                .tag(2)
            
            // Profile
            ProfileView()
                .tabItem {
                    Label("Profile", systemImage: "person.fill")
                }
                .tag(3)
        }
        .tint(.orange)
        .task {
            if let userId = authViewModel.currentUser?.id {
                await messageViewModel.loadUnreadCount(userId: userId)
            }
        }
    }
}

#Preview {
    MainTabView()
        .environmentObject(AuthViewModel())
}
