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
    
    // Categories from web app
    let categories = [
        ("wrench.and.screwdriver", "Plumbing", Color.blue),
        ("printer", "Office Automation", Color.gray),
        ("cpu", "Process Controllers", Color.purple),
        ("sun.max", "Solar Energy", Color.yellow),
        ("lightbulb", "Commercial Lights", Color.orange),
        ("cross.case", "Medical Instruments", Color.red),
        ("leaf", "Agricultural Equipment", Color.green)
    ]
    
    var body: some View {
        NavigationStack {
            ZStack {
                ScrollView {
                    VStack(spacing: 0) {
                        // Spacer for floating search bar
                        Color.clear
                            .frame(height: 60)
                        
                        // Categories Section
                        if viewModel.searchText.isEmpty && !viewModel.hasActiveFilters {
                            VStack(alignment: .leading, spacing: 12) {
                                HStack {
                                    Text("Shop by Category")
                                        .font(.title3)
                                        .fontWeight(.bold)
                                    Spacer()
                                }
                                .padding(.horizontal)
                                .padding(.top, 16)
                                
                                ScrollView(.horizontal, showsIndicators: false) {
                                    HStack(spacing: 12) {
                                        ForEach(categories, id: \.1) { icon, name, color in
                                            CategoryCard(icon: icon, name: name, color: color) {
                                                viewModel.selectedCategory = name
                                            }
                                        }
                                    }
                                    .padding(.horizontal)
                                }
                            }
                        }
                        
                        // Featured Products Section
                        if viewModel.searchText.isEmpty && !viewModel.hasActiveFilters && !viewModel.products.isEmpty {
                            VStack(alignment: .leading, spacing: 12) {
                                HStack {
                                    Image(systemName: "star.fill")
                                        .foregroundColor(.yellow)
                                    Text("Featured Products")
                                        .font(.title3)
                                        .fontWeight(.bold)
                                    Spacer()
                                }
                                .padding(.horizontal)
                                .padding(.top, 16)
                                
                                ScrollView(.horizontal, showsIndicators: false) {
                                    HStack(spacing: 16) {
                                        ForEach(viewModel.products.prefix(5)) { product in
                                            NavigationLink(destination: ProductDetailView(product: product)) {
                                                FeaturedProductCard(product: product)
                                            }
                                            .buttonStyle(PlainButtonStyle())
                                        }
                                    }
                                    .padding(.horizontal)
                                }
                            }
                        }
                        
                        // Results section header
                        HStack {
                            if !viewModel.searchText.isEmpty || viewModel.hasActiveFilters {
                                Text("\(viewModel.filteredProducts.count) result\(viewModel.filteredProducts.count != 1 ? "s" : "")")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            } else {
                                Text("All Products")
                                    .font(.title3)
                                    .fontWeight(.bold)
                            }
                            
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
                        .padding(.vertical, 12)
                        
                        // Products Grid
                        if viewModel.isLoading && viewModel.products.isEmpty {
                            VStack {
                                ProgressView("Loading products...")
                                    .padding(.top, 60)
                            }
                            .frame(minHeight: 300)
                        } else if let errorMessage = viewModel.errorMessage {
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
                            .frame(minHeight: 300)
                        } else if viewModel.filteredProducts.isEmpty {
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
                            .padding()
                            .frame(minHeight: 300)
                        } else {
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
                            .padding(.horizontal)
                            .padding(.bottom, 20)
                        }
                    }
                }
                .refreshable {
                    await viewModel.loadProducts()
                }
                
                // Floating Search Bar
                VStack {
                    VStack(spacing: 0) {
                        HStack(spacing: 12) {
                            // Search icon
                            Image(systemName: "magnifyingglass")
                                .foregroundColor(.gray)
                            
                            // Search text field
                            TextField("Search products, categories...", text: $viewModel.searchText)
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
                                ZStack {
                                    Image(systemName: "line.3.horizontal.decrease.circle.fill")
                                        .foregroundColor(.orange)
                                        .font(.title3)
                                    
                                    if viewModel.hasActiveFilters {
                                        Circle()
                                            .fill(Color.red)
                                            .frame(width: 8, height: 8)
                                            .offset(x: 8, y: -8)
                                    }
                                }
                            }
                        }
                        .padding(12)
                        .background(Color(.systemBackground))
                        .cornerRadius(12)
                        .shadow(color: .black.opacity(0.1), radius: 5, x: 0, y: 2)
                        .padding(.horizontal)
                        .padding(.vertical, 8)
                        
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
                                    
                                    Button("Clear all") {
                                        viewModel.clearFilters()
                                    }
                                    .font(.caption)
                                    .foregroundColor(.red)
                                }
                                .padding(.horizontal)
                            }
                            .padding(.bottom, 8)
                            .background(Color(.systemBackground))
                        }
                        
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
                        }
                    }
                    .background(Color(.systemBackground))
                    
                    Spacer()
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
                let fullURL = product.fullImageURL(for: imageUrl)
                let _ = print("Loading image from: \(fullURL) (original: \(imageUrl))")
                AsyncImage(url: URL(string: fullURL)) { phase in
                    switch phase {
                    case .empty:
                        Rectangle()
                            .fill(Color.white)
                            .overlay(ProgressView())
                    case .success(let image):
                        image
                            .resizable()
                            .scaledToFill()
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
                .clipped()
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
                
                // Star rating (use real review data)
                HStack(spacing: 2) {
                    if let reviewCount = product.reviewCount, reviewCount > 0 {
                        let stars = Int(round(product.averageRating ?? 0))
                        ForEach(0..<5) { index in
                            Image(systemName: index < stars ? "star.fill" : "star")
                                .font(.caption2)
                                .foregroundColor(.orange)
                        }
                        Text("(\(reviewCount))")
                            .font(.caption2)
                            .foregroundColor(.blue)
                    }
                }
                .frame(height: 16)
                
                // Price
                HStack(alignment: .firstTextBaseline, spacing: 2) {
                    if let price = product.price, price > 0 {
                        Text("$")
                            .font(.caption)
                            .foregroundColor(.primary)
                        Text(String(format: "%.2f", price))
                            .font(.title3)
                            .fontWeight(.bold)
                            .foregroundColor(.primary)
                    }
                }
                .frame(height: 24)
                
                Spacer(minLength: 0)
            }
            .padding(10)
            .frame(height: 90)
        }
        .frame(height: 238)
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

// MARK: - Amazon-Style Components

// Category Card
struct CategoryCard: View {
    let icon: String
    let name: String
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                ZStack {
                    Circle()
                        .fill(color.opacity(0.15))
                        .frame(width: 60, height: 60)
                    
                    Image(systemName: icon)
                        .font(.system(size: 28))
                        .foregroundColor(color)
                }
                
                Text(name)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(.primary)
            }
            .frame(width: 80)
        }
    }
}

// Featured Product Card (Horizontal)
struct FeaturedProductCard: View {
    let product: Product
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Image
            if let imageUrl = product.imageURLs.first {
                let fullURL = product.fullImageURL(for: imageUrl)
                let _ = print("Featured image loading from: \(fullURL) (original: \(imageUrl))")
                AsyncImage(url: URL(string: fullURL)) { phase in
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
                .frame(width: 180, height: 180)
                .clipped()
                .cornerRadius(12)
            }
            
            // Title
            Text(product.title)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(.primary)
                .lineLimit(2)
                .frame(width: 180, height: 36, alignment: .top)
            
            // Rating - fixed height even if empty
            HStack(spacing: 2) {
                if let reviewCount = product.reviewCount, reviewCount > 0 {
                    let stars = Int(round(product.averageRating ?? 0))
                    ForEach(0..<5) { index in
                        Image(systemName: index < stars ? "star.fill" : "star")
                            .font(.caption2)
                            .foregroundColor(.orange)
                    }
                    Text("(\(reviewCount))")
                        .font(.caption2)
                        .foregroundColor(.blue)
                }
            }
            .frame(height: 16)
            
            // Price with badge - fixed height
            HStack(spacing: 8) {
                if let price = product.price, price > 0 {
                    HStack(alignment: .firstTextBaseline, spacing: 2) {
                        Text("$")
                            .font(.caption)
                        Text(String(format: "%.2f", price))
                            .font(.title3)
                            .fontWeight(.bold)
                    }
                    .foregroundColor(.primary)
                    
                    Text("Featured")
                        .font(.caption2)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(Color.orange)
                        .cornerRadius(4)
                }
            }
            .frame(height: 28)
            
            Spacer(minLength: 0)
        }
        .frame(width: 180, height: 280)
        .padding(12)
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.08), radius: 8, x: 0, y: 2)
    }
}

#Preview {
    ProductsListView()
}