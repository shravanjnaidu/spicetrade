//
//  ProductsListView.swift
//  SpiceTrade
//

import SwiftUI

struct ProductsListView: View {
    @StateObject private var viewModel = ProductViewModel()
    @State private var showFilters = false
    @State private var showSuggestions = false
    @FocusState private var searchFieldFocused: Bool
    
    var body: some View {
        NavigationStack {
            ZStack {
                VStack(spacing: 0) {
                    // Custom Search Bar with Autocomplete
                    VStack(spacing: 0) {
                        HStack(spacing: 12) {
                            // Search icon
                            Image(systemName: "magnifyingglass")
                                .foregroundColor(.gray)
                            
                            // Search text field
                            TextField("Search products, categories, stores...", text: $viewModel.searchText)
                                .focused($searchFieldFocused)
                                .textFieldStyle(PlainTextFieldStyle())
                                .onChange(of: viewModel.searchText) { _, newValue in
                                    showSuggestions = !newValue.isEmpty && searchFieldFocused
                                }
                                .onSubmit {
                                    showSuggestions = false
                                    searchFieldFocused = false
                                }
                            
                            // Clear button
                            if !viewModel.searchText.isEmpty {
                                Button(action: {
                                    viewModel.searchText = ""
                                    showSuggestions = false
                                }) {
                                    Image(systemName: "xmark.circle.fill")
                                        .foregroundColor(.gray)
                                }
                            }
                            
                            // Filter button
                            Button(action: { showFilters.toggle() }) {
                                Image(systemName: "line.3.horizontal.decrease.circle")
                                    .foregroundColor(.orange)
                            }
                        }
                        .padding(12)
                        .background(Color(.systemGray6))
                        .cornerRadius(10)
                        .padding(.horizontal)
                        .padding(.vertical, 8)
                        
                        // Autocomplete Suggestions
                        if showSuggestions && !viewModel.searchSuggestions.isEmpty {
                            ScrollView {
                                VStack(spacing: 0) {
                                    ForEach(viewModel.searchSuggestions.prefix(8)) { product in
                                        SuggestionRow(product: product) {
                                            viewModel.searchText = product.title
                                            showSuggestions = false
                                            searchFieldFocused = false
                                        }
                                        
                                        if product.id != viewModel.searchSuggestions.prefix(8).last?.id {
                                            Divider()
                                        }
                                    }
                                }
                            }
                            .frame(maxHeight: 300)
                            .background(Color(.systemBackground))
                            .cornerRadius(10)
                            .shadow(color: .black.opacity(0.15), radius: 8, x: 0, y: 4)
                            .padding(.horizontal)
                            .transition(.opacity.combined(with: .move(edge: .top)))
                        }
                    }
                    
                    // Active filters chips
                    if viewModel.hasActiveFilters {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                if let category = viewModel.selectedCategory {
                                    FilterChip(text: category, color: .orange) {
                                        viewModel.selectedCategory = nil
                                    }
                                }
                                
                                ForEach(Array(viewModel.selectedTags), id: \.self) { tag in
                                    FilterChip(text: tag, color: .blue) {
                                        viewModel.selectedTags.remove(tag)
                                    }
                                }
                                
                                if viewModel.hasActiveFilters {
                                    Button("Clear all") {
                                        viewModel.clearFilters()
                                    }
                                    .font(.caption)
                                    .foregroundColor(.red)
                                }
                            }
                            .padding(.horizontal)
                        }
                        .padding(.vertical, 8)
                    }
                    
                    // Results count
                    if !viewModel.searchText.isEmpty || viewModel.hasActiveFilters {
                        HStack {
                            Text("\(viewModel.filteredProducts.count) result\(viewModel.filteredProducts.count != 1 ? "s" : "")")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                            
                            Spacer()
                            
                            Menu {
                                Button("Featured") { viewModel.sortOption = .featured }
                                Button("Price: Low to High") { viewModel.sortOption = .priceLowToHigh }
                                Button("Price: High to Low") { viewModel.sortOption = .priceHighToLow }
                                Button("Newest") { viewModel.sortOption = .newest }
                            } label: {
                                HStack(spacing: 4) {
                                    Text("Sort")
                                    Image(systemName: "chevron.down")
                                }
                                .font(.subheadline)
                                .foregroundColor(.orange)
                            }
                        }
                        .padding(.horizontal)
                        .padding(.vertical, 8)
                    }
                    
                    // Content
                    if viewModel.isLoading && viewModel.products.isEmpty {
                        Spacer()
                        ProgressView("Loading products...")
                        Spacer()
                    } else if let errorMessage = viewModel.errorMessage {
                        Spacer()
                        VStack(spacing: 16) {
                            Image(systemName: "exclamationmark.triangle")
                                .font(.system(size: 50))
                                .foregroundColor(.orange)
                            
                            Text("Error Loading Products")
                                .font(.headline)
                            
                            Text(errorMessage)
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .multilineTextAlignment(.center)
                            
                            Button("Try Again") {
                                Task { await viewModel.loadProducts() }
                            }
                            .buttonStyle(.borderedProminent)
                            .tint(.orange)
                        }
                        .padding()
                        Spacer()
                    } else if viewModel.filteredProducts.isEmpty {
                        Spacer()
                        VStack(spacing: 16) {
                            Image(systemName: "magnifyingglass")
                                .font(.system(size: 50))
                                .foregroundColor(.gray)
                            
                            Text("No Products Found")
                                .font(.headline)
                            
                            if !viewModel.searchText.isEmpty || viewModel.hasActiveFilters {
                                Button("Clear Filters") {
                                    viewModel.clearFilters()
                                    viewModel.searchText = ""
                                }
                                .buttonStyle(.bordered)
                            }
                        }
                        Spacer()
                    } else {
                        ScrollView {
                            LazyVGrid(columns: [
                                GridItem(.flexible(), spacing: 12),
                                GridItem(.flexible(), spacing: 12)
                            ], spacing: 16) {
                                ForEach(viewModel.filteredProducts) { product in
                                    NavigationLink(destination: ProductDetailView(product: product)) {
                                        AmazonStyleProductCard(product: product)
                                    }
                                    .buttonStyle(PlainButtonStyle())
                                }
                            }
                            .padding()
                        }
                        .refreshable {
                            await viewModel.loadProducts()
                        }
                    }
                }
            }
            .navigationTitle("SpiceTrade")
            .navigationBarTitleDisplayMode(.inline)
            .sheet(isPresented: $showFilters) {
                FilterView(viewModel: viewModel)
            }
            .task {
                await viewModel.loadProducts()
            }
            .onTapGesture {
                showSuggestions = false
                searchFieldFocused = false
            }
        }
    }
}

// Autocomplete Suggestion Row
struct SuggestionRow: View {
    let product: Product
    let onSelect: () -> Void
    
    var body: some View {
        Button(action: onSelect) {
            HStack(spacing: 12) {
                // Product image
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
                                .overlay(Image(systemName: "photo").foregroundColor(.gray))
                        }
                    }
                    .frame(width: 50, height: 50)
                    .cornerRadius(8)
                } else {
                    Rectangle()
                        .fill(Color.gray.opacity(0.2))
                        .frame(width: 50, height: 50)
                        .overlay(Image(systemName: "photo").foregroundColor(.gray))
                        .cornerRadius(8)
                }
                
                // Product info
                VStack(alignment: .leading, spacing: 4) {
                    Text(product.title)
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.primary)
                        .lineLimit(1)
                    
                    HStack(spacing: 8) {
                        if let price = product.price, price > 0 {
                            Text(product.priceText)
                                .font(.caption)
                                .fontWeight(.semibold)
                                .foregroundColor(.primary)
                        }
                        
                        if let category = product.category {
                            Text(category)
                                .font(.caption)
                                .foregroundColor(.blue)
                        }
                    }
                }
                
                Spacer()
                
                Image(systemName: "magnifyingglass")
                    .font(.caption)
                    .foregroundColor(.gray)
            }
            .padding(12)
            .contentShape(Rectangle())
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// Filter Chip
struct FilterChip: View {
    let text: String
    let color: Color
    let onRemove: () -> Void
    
    var body: some View {
        HStack(spacing: 4) {
            Text(text)
                .font(.caption)
            
            Button(action: onRemove) {
                Image(systemName: "xmark.circle.fill")
                    .font(.caption)
            }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(color.opacity(0.2))
        .foregroundColor(color)
        .cornerRadius(16)
    }
}

// Amazon-Style Product Card (Grid)
struct AmazonStyleProductCard: View {
    let product: Product
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Product image
            if let imageUrl = product.imageURLs.first {
                AsyncImage(url: URL(string: "http://localhost:3000\(imageUrl)")) { phase in
                    switch phase {
                    case .empty:
                        Rectangle()
                            .fill(Color.white)
                            .overlay(ProgressView())
                    case .success(let image):
                        image
                            .resizable()
                            .scaledToFit()
                    case .failure:
                        Rectangle()
                            .fill(Color.gray.opacity(0.1))
                            .overlay(Image(systemName: "photo").foregroundColor(.gray))
                    @unknown default:
                        EmptyView()
                    }
                }
                .frame(height: 140)
                .frame(maxWidth: .infinity)
                .background(Color.white)
            } else {
                Rectangle()
                    .fill(Color.gray.opacity(0.1))
                    .frame(height: 140)
                    .overlay(Image(systemName: "photo").font(.largeTitle).foregroundColor(.gray))
            }
            
            // Product info
            VStack(alignment: .leading, spacing: 6) {
                Text(product.title)
                    .font(.subheadline)
                    .foregroundColor(.primary)
                    .lineLimit(2)
                    .frame(height: 36, alignment: .top)
                
                // Star rating (placeholder)
                HStack(spacing: 2) {
                    ForEach(0..<5) { index in
                        Image(systemName: index < 4 ? "star.fill" : "star")
                            .font(.caption2)
                            .foregroundColor(.orange)
                    }
                    Text("(42)")
                        .font(.caption2)
                        .foregroundColor(.blue)
                }
                
                // Price
                if let price = product.price, price > 0 {
                    HStack(alignment: .firstTextBaseline, spacing: 2) {
                        Text("$")
                            .font(.caption)
                            .foregroundColor(.primary)
                        Text(String(format: "%.2f", price))
                            .font(.title3)
                            .fontWeight(.bold)
                            .foregroundColor(.primary)
                    }
                }
                
                // Tags
                if let tags = product.tags, !tags.isEmpty {
                    HStack(spacing: 4) {
                        ForEach(tags.prefix(2), id: \.self) { tag in
                            Text(tag)
                                .font(.caption2)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 3)
                                .background(Color.gray.opacity(0.15))
                                .cornerRadius(4)
                        }
                    }
                }
                
                // Store name
                if let storeName = product.storeName {
                    Text("by \(storeName)")
                        .font(.caption)
                        .foregroundColor(.blue)
                        .lineLimit(1)
                }
            }
            .padding(10)
        }
        .background(Color(.systemBackground))
        .cornerRadius(8)
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(Color.gray.opacity(0.2), lineWidth: 1)
        )
    }
}

struct FilterView: View {
    @ObservedObject var viewModel: ProductViewModel
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationStack {
            List {
                Section("Category") {
                    Button("All Categories") {
                        viewModel.selectedCategory = nil
                    }
                    .foregroundColor(viewModel.selectedCategory == nil ? .orange : .primary)
                    
                    ForEach(viewModel.availableCategories, id: \.self) { category in
                        Button(category) {
                            viewModel.selectedCategory = category
                        }
                        .foregroundColor(viewModel.selectedCategory == category ? .orange : .primary)
                    }
                }
                
                Section("Tags") {
                    ForEach(viewModel.availableTags, id: \.self) { tag in
                        Toggle(tag, isOn: Binding(
                            get: { viewModel.selectedTags.contains(tag) },
                            set: { isOn in
                                if isOn {
                                    viewModel.selectedTags.insert(tag)
                                } else {
                                    viewModel.selectedTags.remove(tag)
                                }
                            }
                        ))
                    }
                }
            }
            .navigationTitle("Filters")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Clear All") {
                        viewModel.clearFilters()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

#Preview {
    ProductsListView()
}
