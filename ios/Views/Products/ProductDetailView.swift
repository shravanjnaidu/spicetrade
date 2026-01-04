//
//  ProductDetailView.swift
//  SpiceTrade
//

import SwiftUI

struct ProductDetailView: View {
    let product: Product
    @EnvironmentObject var authViewModel: AuthViewModel
    @StateObject private var reviewViewModel = ReviewViewModel()
    @State private var isInWishlist = false
    @State private var wishlistId: Int?
    @State private var showContactSeller = false
    @State private var showReviewSheet = false
    @State private var selectedImageIndex = 0
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Image carousel
                if !product.imageURLs.isEmpty {
                    TabView(selection: $selectedImageIndex) {
                        ForEach(Array(product.imageURLs.enumerated()), id: \.offset) { index, imageUrl in
                            AsyncImage(url: URL(string: "http://localhost:3000\(imageUrl)")) { phase in
                                switch phase {
                                case .empty:
                                    Rectangle()
                                        .fill(Color.gray.opacity(0.2))
                                        .overlay(ProgressView())
                                case .success(let image):
                                    image
                                        .resizable()
                                        .scaledToFit()
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
                            .tag(index)
                        }
                    }
                    .frame(height: 300)
                    .tabViewStyle(PageTabViewStyle(indexDisplayMode: .automatic))
                } else {
                    Rectangle()
                        .fill(Color.gray.opacity(0.2))
                        .frame(height: 300)
                        .overlay(
                            Image(systemName: "photo")
                                .font(.system(size: 60))
                                .foregroundColor(.gray)
                        )
                }
                
                VStack(alignment: .leading, spacing: 16) {
                    // Title and price
                    VStack(alignment: .leading, spacing: 8) {
                        Text(product.title)
                            .font(.title)
                            .fontWeight(.bold)
                        
                        Text(product.priceText)
                            .font(.title2)
                            .foregroundColor(.orange)
                        
                        if let minOrder = product.minOrder, minOrder > 1 {
                            Text("Min. order: \(minOrder) units")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        
                        if let stock = product.stock {
                            Text("Stock: \(stock) available")
                                .font(.caption)
                                .foregroundColor(stock > 0 ? .green : .red)
                        }
                    }
                    
                    // Category and tags
                    HStack {
                        if let category = product.category {
                            Text(category)
                                .font(.caption)
                                .padding(.horizontal, 10)
                                .padding(.vertical, 6)
                                .background(Color.orange.opacity(0.2))
                                .foregroundColor(.orange)
                                .cornerRadius(8)
                        }
                        
                        if let tags = product.tags, !tags.isEmpty {
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 6) {
                                    ForEach(tags, id: \.self) { tag in
                                        Text(tag)
                                            .font(.caption)
                                            .padding(.horizontal, 8)
                                            .padding(.vertical, 4)
                                            .background(Color.gray.opacity(0.2))
                                            .cornerRadius(6)
                                    }
                                }
                            }
                        }
                    }
                    
                    Divider()
                    
                    // Seller info
                    if let storeName = product.storeName {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Seller Information")
                                .font(.headline)
                            
                            HStack {
                                if let profilePicture = product.profilePicture {
                                    AsyncImage(url: URL(string: "http://localhost:3000\(profilePicture)")) { phase in
                                        switch phase {
                                        case .success(let image):
                                            image.resizable()
                                        default:
                                            Image(systemName: "person.circle.fill")
                                                .resizable()
                                        }
                                    }
                                    .frame(width: 50, height: 50)
                                    .clipShape(Circle())
                                } else {
                                    Image(systemName: "storefront.circle.fill")
                                        .resizable()
                                        .frame(width: 50, height: 50)
                                        .foregroundColor(.orange)
                                }
                                
                                VStack(alignment: .leading) {
                                    Text(storeName)
                                        .font(.subheadline)
                                        .fontWeight(.semibold)
                                    
                                    if let author = product.author {
                                        Text(author)
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                    }
                                }
                                
                                Spacer()
                            }
                        }
                        
                        Divider()
                    }
                    
                    // Description
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Description")
                            .font(.headline)
                        
                        Text(product.description)
                            .font(.body)
                            .foregroundColor(.secondary)
                    }
                    
                    Divider()
                    
                    // Reviews section
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("Reviews")
                                .font(.headline)
                            
                            Spacer()
                            
                            if authViewModel.currentUser?.isBuyer == true {
                                Button("Write Review") {
                                    showReviewSheet = true
                                }
                                .font(.subheadline)
                                .foregroundColor(.orange)
                            }
                        }
                        
                        if let stats = reviewViewModel.stats {
                            HStack(spacing: 20) {
                                VStack {
                                    Text(String(format: "%.1f", stats.averageRating))
                                        .font(.system(size: 40, weight: .bold))
                                    
                                    HStack(spacing: 2) {
                                        ForEach(0..<5) { index in
                                            Image(systemName: index < Int(stats.averageRating) ? "star.fill" : "star")
                                                .foregroundColor(.orange)
                                        }
                                    }
                                    
                                    Text("\(stats.totalReviews) reviews")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                                
                                VStack(alignment: .leading, spacing: 4) {
                                    ReviewBarView(stars: 5, count: stats.fiveStars, total: stats.totalReviews)
                                    ReviewBarView(stars: 4, count: stats.fourStars, total: stats.totalReviews)
                                    ReviewBarView(stars: 3, count: stats.threeStars, total: stats.totalReviews)
                                    ReviewBarView(stars: 2, count: stats.twoStars, total: stats.totalReviews)
                                    ReviewBarView(stars: 1, count: stats.oneStar, total: stats.totalReviews)
                                }
                            }
                        }
                        
                        if reviewViewModel.isLoading {
                            ProgressView()
                                .frame(maxWidth: .infinity)
                        } else if !reviewViewModel.reviews.isEmpty {
                            ForEach(reviewViewModel.reviews.prefix(5)) { review in
                                ReviewRowView(review: review)
                                    .padding(.vertical, 4)
                            }
                        } else {
                            Text("No reviews yet")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                    }
                }
                .padding()
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                if authViewModel.currentUser?.isBuyer == true {
                    Button(action: toggleWishlist) {
                        Image(systemName: isInWishlist ? "heart.fill" : "heart")
                            .foregroundColor(isInWishlist ? .red : .gray)
                    }
                }
            }
        }
        .safeAreaInset(edge: .bottom) {
            if authViewModel.currentUser?.isBuyer == true && authViewModel.currentUser?.id != product.userId {
                Button(action: { showContactSeller = true }) {
                    Text("Contact Seller")
                        .font(.headline)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.orange)
                        .cornerRadius(12)
                }
                .padding()
                .background(Color(.systemBackground))
                .shadow(radius: 3)
            }
        }
        .sheet(isPresented: $showContactSeller) {
            if let currentUser = authViewModel.currentUser,
               let sellerId = product.userId {
                ContactSellerView(
                    buyerId: currentUser.id,
                    sellerId: sellerId,
                    listingId: product.id,
                    sellerName: product.storeName ?? product.author ?? "Seller"
                )
            }
        }
        .sheet(isPresented: $showReviewSheet) {
            if let userId = authViewModel.currentUser?.id {
                AddReviewView(productId: product.id, userId: userId) {
                    Task {
                        await reviewViewModel.loadReviews(productId: product.id)
                        await reviewViewModel.loadStats(productId: product.id)
                    }
                }
            }
        }
        .task {
            await reviewViewModel.loadReviews(productId: product.id)
            await reviewViewModel.loadStats(productId: product.id)
            
            if let userId = authViewModel.currentUser?.id {
                await checkWishlistStatus(userId: userId)
            }
        }
    }
    
    private func checkWishlistStatus(userId: Int) async {
        do {
            let response = try await APIService.shared.checkWishlist(userId: userId, adId: product.id)
            isInWishlist = response.inWishlist
            wishlistId = response.wishlistId
        } catch {
            print("Error checking wishlist: \(error)")
        }
    }
    
    private func toggleWishlist() {
        guard let userId = authViewModel.currentUser?.id else { return }
        
        Task {
            do {
                if isInWishlist, let wishlistId = wishlistId {
                    try await APIService.shared.removeFromWishlist(wishlistId: wishlistId)
                    isInWishlist = false
                    self.wishlistId = nil
                } else {
                    try await APIService.shared.addToWishlist(userId: userId, adId: product.id)
                    await checkWishlistStatus(userId: userId)
                }
            } catch {
                print("Error toggling wishlist: \(error)")
            }
        }
    }
}

struct ReviewBarView: View {
    let stars: Int
    let count: Int
    let total: Int
    
    var percentage: Double {
        total > 0 ? Double(count) / Double(total) : 0
    }
    
    var body: some View {
        HStack(spacing: 8) {
            Text("\(stars)")
                .font(.caption)
                .foregroundColor(.secondary)
                .frame(width: 15)
            
            Image(systemName: "star.fill")
                .font(.caption2)
                .foregroundColor(.orange)
            
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(Color.gray.opacity(0.2))
                        .frame(height: 4)
                    
                    Rectangle()
                        .fill(Color.orange)
                        .frame(width: geometry.size.width * percentage, height: 4)
                }
            }
            .frame(height: 4)
            
            Text("\(count)")
                .font(.caption)
                .foregroundColor(.secondary)
                .frame(width: 25, alignment: .trailing)
        }
    }
}

struct ReviewRowView: View {
    let review: Review
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                if let profilePicture = review.profilePicture {
                    AsyncImage(url: URL(string: "http://localhost:3000\(profilePicture)")) { phase in
                        switch phase {
                        case .success(let image):
                            image.resizable()
                        default:
                            Image(systemName: "person.circle.fill")
                                .resizable()
                        }
                    }
                    .frame(width: 35, height: 35)
                    .clipShape(Circle())
                } else {
                    Image(systemName: "person.circle.fill")
                        .resizable()
                        .frame(width: 35, height: 35)
                        .foregroundColor(.gray)
                }
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(review.userName ?? "Anonymous")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                    
                    HStack(spacing: 2) {
                        ForEach(0..<5) { index in
                            Image(systemName: index < review.rating ? "star.fill" : "star")
                                .font(.caption2)
                                .foregroundColor(.orange)
                        }
                    }
                }
                
                Spacer()
            }
            
            if let reviewText = review.reviewText, !reviewText.isEmpty {
                Text(reviewText)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
        }
        .padding(12)
        .background(Color(.systemGray6))
        .cornerRadius(10)
    }
}

#Preview {
    NavigationStack {
        ProductDetailView(product: Product(
            id: 1,
            title: "Premium Turmeric Powder",
            description: "High quality organic turmeric powder sourced from the best farms.",
            userId: 2,
            createdAt: nil,
            author: "John's Spices",
            storeName: "Spice Emporium",
            role: "seller",
            profilePicture: nil,
            category: "Spices",
            tags: ["organic", "turmeric", "powder"],
            price: 12.99,
            unit: "kg",
            minOrder: 5,
            stock: 100,
            imageUrl: nil,
            images: nil,
            verified: 1,
            views: 150
        ))
    }
    .environmentObject(AuthViewModel())
}
