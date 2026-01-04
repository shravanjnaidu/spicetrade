//
//  WishlistView.swift
//  SpiceTrade
//

import SwiftUI

struct WishlistView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @StateObject private var viewModel = WishlistViewModel()
    
    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading && viewModel.items.isEmpty {
                    ProgressView("Loading wishlist...")
                } else if viewModel.items.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "heart.slash")
                            .font(.system(size: 60))
                            .foregroundColor(.gray)
                        
                        Text("Your wishlist is empty")
                            .font(.headline)
                        
                        Text("Save items you love to find them easily later")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding()
                } else {
                    List {
                        ForEach(viewModel.items) { item in
                            NavigationLink(destination: ProductDetailView(product: item.product)) {
                                WishlistItemRow(item: item)
                            }
                            .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                                Button(role: .destructive) {
                                    Task {
                                        await viewModel.removeItem(wishlistId: item.wishlistId)
                                    }
                                } label: {
                                    Label("Remove", systemImage: "trash")
                                }
                            }
                        }
                    }
                    .listStyle(.plain)
                    .refreshable {
                        if let userId = authViewModel.currentUser?.id {
                            await viewModel.loadWishlist(userId: userId)
                        }
                    }
                }
            }
            .navigationTitle("Wishlist")
            .task {
                if let userId = authViewModel.currentUser?.id {
                    await viewModel.loadWishlist(userId: userId)
                }
            }
        }
    }
}

struct WishlistItemRow: View {
    let item: WishlistItem
    
    var body: some View {
        HStack(spacing: 12) {
            // Product image
            if let imageUrl = item.imageUrl {
                AsyncImage(url: URL(string: "http://localhost:3000\(imageUrl)")) { phase in
                    switch phase {
                    case .empty:
                        Rectangle()
                            .fill(Color.gray.opacity(0.2))
                            .overlay(ProgressView())
                    case .success(let image):
                        image
                            .resizable()
                            .scaledToFill()
                    case .failure:
                        Rectangle()
                            .fill(Color.gray.opacity(0.2))
                            .overlay(
                                Image(systemName: "photo")
                                    .foregroundColor(.gray)
                            )
                    @unknown default:
                        EmptyView()
                    }
                }
                .frame(width: 80, height: 80)
                .clipShape(RoundedRectangle(cornerRadius: 8))
            }
            
            // Product info
            VStack(alignment: .leading, spacing: 6) {
                Text(item.title)
                    .font(.headline)
                    .lineLimit(2)
                
                if let storeName = item.storeName {
                    Text(storeName)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                if let price = item.price {
                    Text("$\(String(format: "%.2f", price))\(item.unit != nil ? "/\(item.unit!)" : "")")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(.orange)
                }
            }
            
            Spacer()
        }
    }
}

#Preview {
    WishlistView()
        .environmentObject(AuthViewModel())
}
