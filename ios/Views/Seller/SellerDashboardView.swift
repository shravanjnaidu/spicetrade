//
//  SellerDashboardView.swift
//  SpiceTrade
//

import SwiftUI

struct SellerDashboardView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @StateObject private var viewModel = ProductViewModel()
    @State private var showAddProduct = false
    
    var myProducts: [Product] {
        viewModel.products.filter { $0.userId == authViewModel.currentUser?.id }
    }
    
    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading && myProducts.isEmpty {
                    ProgressView("Loading your products...")
                } else if myProducts.isEmpty {
                    VStack(spacing: 20) {
                        Image(systemName: "tray")
                            .font(.system(size: 60))
                            .foregroundColor(.gray)
                        
                        Text("No Products Yet")
                            .font(.title2)
                            .fontWeight(.bold)
                        
                        Text("Start selling by adding your first product")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                        
                        Button(action: { showAddProduct = true }) {
                            Label("Add Product", systemImage: "plus.circle.fill")
                                .font(.headline)
                                .foregroundColor(.white)
                                .padding()
                                .background(Color.orange)
                                .cornerRadius(12)
                        }
                    }
                    .padding()
                } else {
                    List {
                        ForEach(myProducts) { product in
                            NavigationLink(destination: EditProductView(product: product, onUpdate: {
                                Task { await viewModel.loadProducts() }
                            })) {
                                SellerProductRow(product: product)
                            }
                            .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                                Button(role: .destructive) {
                                    Task {
                                        await viewModel.deleteProduct(product)
                                    }
                                } label: {
                                    Label("Delete", systemImage: "trash")
                                }
                            }
                        }
                    }
                    .listStyle(.plain)
                    .refreshable {
                        await viewModel.loadProducts()
                    }
                }
            }
            .navigationTitle("My Products")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showAddProduct = true }) {
                        Image(systemName: "plus")
                            .foregroundColor(.orange)
                    }
                }
            }
            .sheet(isPresented: $showAddProduct) {
                if let userId = authViewModel.currentUser?.id {
                    AddProductView(userId: userId) {
                        Task { await viewModel.loadProducts() }
                    }
                }
            }
            .task {
                await viewModel.loadProducts()
            }
        }
    }
}

struct SellerProductRow: View {
    let product: Product
    
    var body: some View {
        HStack(spacing: 12) {
            // Product image
            if let imageUrl = product.imageURLs.first {
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
            } else {
                Rectangle()
                    .fill(Color.gray.opacity(0.2))
                    .frame(width: 80, height: 80)
                    .overlay(
                        Image(systemName: "photo")
                            .foregroundColor(.gray)
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 8))
            }
            
            // Product info
            VStack(alignment: .leading, spacing: 6) {
                Text(product.title)
                    .font(.headline)
                    .lineLimit(2)
                
                Text(product.priceText)
                    .font(.subheadline)
                    .foregroundColor(.orange)
                
                HStack {
                    if let stock = product.stock {
                        Label("\(stock)", systemImage: "cube.box")
                            .font(.caption)
                            .foregroundColor(stock > 0 ? .green : .red)
                    }
                    
                    if let views = product.views {
                        Label("\(views)", systemImage: "eye")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(.gray)
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    SellerDashboardView()
        .environmentObject(AuthViewModel())
}
