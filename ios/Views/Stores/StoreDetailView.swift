//
//  StoreDetailView.swift
//  SpiceTrade
//

import SwiftUI

struct StoreDetailView: View {
    let store: Store
    @EnvironmentObject var authViewModel: AuthViewModel
    @StateObject private var viewModel = StoreDetailViewModel()
    @State private var showContactStore = false
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                // Store Banner
                ZStack(alignment: .bottomLeading) {
                    LinearGradient(
                        gradient: Gradient(colors: [.orange, Color.orange.opacity(0.7)]),
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                    .frame(height: 200)
                    
                    HStack(spacing: 20) {
                        // Store Logo
                        if let logoPath = store.logo {
                            AsyncImage(url: URL(string: "http://localhost:3000\(logoPath)")) { phase in
                                switch phase {
                                case .success(let image):
                                    image
                                        .resizable()
                                        .scaledToFill()
                                default:
                                    storePlaceholder
                                }
                            }
                            .frame(width: 100, height: 100)
                            .clipShape(RoundedRectangle(cornerRadius: 16))
                            .overlay(
                                RoundedRectangle(cornerRadius: 16)
                                    .stroke(Color.white.opacity(0.3), lineWidth: 3)
                            )
                        } else {
                            storePlaceholder
                        }
                        
                        VStack(alignment: .leading, spacing: 8) {
                            Text(store.displayName)
                                .font(.title)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                            
                            if let businessType = store.businessType {
                                Text(businessType)
                                    .font(.subheadline)
                                    .foregroundColor(.white.opacity(0.9))
                            }
                            
                            HStack(spacing: 8) {
                                if let categories = store.categories {
                                    storeBadge(categories)
                                }
                                if let businessType = store.businessType {
                                    storeBadge(businessType)
                                }
                            }
                        }
                        
                        Spacer()
                    }
                    .padding(24)
                }
                
                // About This Store
                VStack(alignment: .leading, spacing: 16) {
                    Text("About This Store")
                        .font(.headline)
                        .padding(.horizontal)
                        .padding(.top, 20)
                    
                    VStack(spacing: 0) {
                        if let businessType = store.businessType {
                            InfoRowView(label: "Business Type", value: businessType)
                            Divider().padding(.leading, 16)
                        }
                        
                        if let categories = store.categories {
                            InfoRowView(label: "Category", value: categories)
                            Divider().padding(.leading, 16)
                        }
                        
                        if let createdAt = store.createdAt {
                            let date = formatDate(createdAt)
                            InfoRowView(label: "Member Since", value: date)
                        }
                    }
                    .background(Color(.systemBackground))
                    .cornerRadius(12)
                    .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
                    .padding(.horizontal)
                }
                
                // Contact Information
                VStack(alignment: .leading, spacing: 16) {
                    Text("Contact Information")
                        .font(.headline)
                        .padding(.horizontal)
                        .padding(.top, 20)
                    
                    VStack(spacing: 0) {
                        if let email = store.email {
                            InfoRowView(label: "Email", value: email)
                            Divider().padding(.leading, 16)
                        }
                        
                        if let address = store.address {
                            InfoRowView(label: "Address", value: address)
                            Divider().padding(.leading, 16)
                        }
                        
                        if let website = store.website {
                            HStack {
                                Text("Website")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                                Spacer()
                                Link(destination: URL(string: website) ?? URL(string: "https://example.com")!) {
                                    Text("Visit")
                                        .font(.subheadline)
                                        .foregroundColor(.orange)
                                }
                            }
                            .padding()
                        }
                    }
                    .background(Color(.systemBackground))
                    .cornerRadius(12)
                    .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
                    .padding(.horizontal)
                }
                
                // Products Section
                VStack(alignment: .leading, spacing: 16) {
                    Text("Products & Services")
                        .font(.headline)
                        .padding(.horizontal)
                        .padding(.top, 20)
                    
                    if viewModel.isLoading {
                        ProgressView()
                            .frame(maxWidth: .infinity)
                            .padding()
                    } else if viewModel.products.isEmpty {
                        Text("This store hasn't listed any products yet.")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .padding()
                            .frame(maxWidth: .infinity)
                            .background(Color(.systemGray6))
                            .cornerRadius(12)
                            .padding(.horizontal)
                    } else {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 16) {
                                ForEach(viewModel.products) { product in
                                    NavigationLink(destination: ProductDetailView(product: product)) {
                                        StoreProductCard(product: product)
                                    }
                                }
                            }
                            .padding(.horizontal)
                        }
                    }
                }
                
                Spacer(minLength: 100)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .safeAreaInset(edge: .bottom) {
            if shouldShowContactButton {
                Button(action: { showContactStore = true }) {
                    Text("Contact Store")
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
        .sheet(isPresented: $showContactStore) {
            if let currentUser = authViewModel.currentUser {
                ContactSellerView(
                    buyerId: currentUser.id,
                    sellerId: store.id,
                    listingId: 0, // No specific listing
                    sellerName: store.displayName
                )
            }
        }
        .task {
            await viewModel.loadStoreProducts(sellerId: store.id)
        }
    }
    
    private var storePlaceholder: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.white.opacity(0.2))
                .frame(width: 100, height: 100)
            
            Text(store.displayName.prefix(1).uppercased())
                .font(.system(size: 40, weight: .bold))
                .foregroundColor(.white)
        }
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.white.opacity(0.3), lineWidth: 3)
        )
    }
    
    private func storeBadge(_ text: String) -> some View {
        Text(text)
            .font(.caption)
            .fontWeight(.semibold)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(Color.white.opacity(0.2))
            .foregroundColor(.white)
            .cornerRadius(20)
    }
    
    private var shouldShowContactButton: Bool {
        guard let user = authViewModel.currentUser else { return false }
        return user.id != store.id && user.isBuyer
    }
    
    private func formatDate(_ dateString: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
        if let date = formatter.date(from: dateString) {
            formatter.dateStyle = .long
            formatter.timeStyle = .none
            return formatter.string(from: date)
        }
        return dateString
    }
}

struct InfoRowView: View {
    let label: String
    let value: String
    
    var body: some View {
        HStack {
            Text(label)
                .font(.subheadline)
                .foregroundColor(.secondary)
            Spacer()
            Text(value)
                .font(.subheadline)
                .foregroundColor(.primary)
                .multilineTextAlignment(.trailing)
        }
        .padding()
    }
}

struct StoreProductCard: View {
    let product: Product
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Product Image
            if let imageUrl = product.imageURLs.first {
                AsyncImage(url: URL(string: "http://localhost:3000\(imageUrl)")) { phase in
                    switch phase {
                    case .success(let image):
                        image
                            .resizable()
                            .scaledToFill()
                    default:
                        Rectangle()
                            .fill(Color.gray.opacity(0.2))
                    }
                }
                .frame(width: 150, height: 150)
                .clipShape(RoundedRectangle(cornerRadius: 12))
            } else {
                Rectangle()
                    .fill(Color.gray.opacity(0.2))
                    .frame(width: 150, height: 150)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            
            Text(product.title)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(.primary)
                .lineLimit(2)
                .frame(width: 150, alignment: .leading)
            
            if let reviewCount = product.reviewCount, reviewCount > 0 {
                HStack(spacing: 2) {
                    let stars = Int(round(product.averageRating ?? 0))
                    ForEach(0..<5) { index in
                        Image(systemName: index < stars ? "star.fill" : "star")
                            .font(.caption2)
                            .foregroundColor(.orange)
                    }
                    Text("(\(reviewCount))")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
            
            Text(product.priceText)
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(.orange)
        }
        .frame(width: 150)
    }
}

// MARK: - ViewModel
class StoreDetailViewModel: ObservableObject {
    @Published var products: [Product] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    func loadStoreProducts(sellerId: Int) async {
        isLoading = true
        do {
            products = try await APIService.shared.getStoreProducts(sellerId: sellerId)
        } catch {
            errorMessage = error.localizedDescription
            print("Error loading store products: \(error)")
        }
        isLoading = false
    }
}

#Preview {
    NavigationStack {
        StoreDetailView(store: Store(
            id: 1,
            name: "John Doe",
            email: "john@example.com",
            storeName: "Spice Emporium",
            businessType: "Retailer",
            categories: "Spices & Herbs",
            address: "123 Main St, Toronto, ON",
            website: "https://example.com",
            logo: nil,
            createdAt: "2024-01-01 00:00:00"
        ))
    }
    .environmentObject(AuthViewModel())
}
