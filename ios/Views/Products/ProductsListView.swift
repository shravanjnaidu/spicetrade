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
    
    // Categories matching the web app
    let categories: [(String, String, Color)] = [
        ("leaf", "Spices & Herbs", Color(red: 0.6, green: 0.3, blue: 0.1)),
        ("circle.grid.cross.fill", "Pulses & Legumes", Color.orange),
        ("cup.and.saucer.fill", "Tea & Coffee", Color(red: 0.4, green: 0.2, blue: 0.1)),
        ("circle.dotted", "Nuts & Dry Fruits", Color(red: 0.7, green: 0.5, blue: 0.2)),
        ("allergens", "Grains & Cereals", Color.yellow),
        ("drop.fill", "Oils & Fats", Color.green),
        ("cube.fill", "Sugar & Sweeteners", Color.pink),
        ("heart.fill", "Organic Products", Color.mint)
    ]
    
    var body: some View {
        NavigationStack {
            ZStack(alignment: .top) {
                Color(.systemGroupedBackground).ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 0) {
                        // Spacer for floating search bar
                        Color.clear.frame(height: 66)

                        // Categories Section
                        if viewModel.searchText.isEmpty && !viewModel.hasActiveFilters {
                            VStack(alignment: .leading, spacing: 12) {
                                HStack {
                                    Text("Shop by Category")
                                        .font(.system(size: 17, weight: .bold))
                                    Spacer()
                                }
                                .padding(.horizontal)
                                .padding(.top, 20)
                                
                                ScrollView(.horizontal, showsIndicators: false) {
                                    HStack(spacing: 12) {
                                        ForEach(categories, id: \.1) { cat in
                                            CategoryCard(icon: cat.0, name: cat.1, color: cat.2) {
                                                viewModel.selectedCategory = cat.1
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
                                    HStack(spacing: 6) {
                                        Image(systemName: "bolt.fill")
                                            .foregroundColor(.orange)
                                        Text("Featured Listings")
                                            .font(.system(size: 17, weight: .bold))
                                    }
                                    Spacer()
                                    Text("See all →")
                                        .font(.system(size: 13, weight: .semibold))
                                        .foregroundColor(.orange)
                                }
                                .padding(.horizontal)
                                .padding(.top, 24)
                                
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
                                    .font(.system(size: 13, weight: .medium))
                                    .foregroundColor(.secondary)
                            } else {
                                Text("All Products")
                                    .font(.system(size: 17, weight: .bold))
                            }

                            Spacer()

                            Menu {
                                Button("Featured") { viewModel.sortOption = .featured }
                                Button("Price: Low to High") { viewModel.sortOption = .priceLowToHigh }
                                Button("Price: High to Low") { viewModel.sortOption = .priceHighToLow }
                                Button("Newest") { viewModel.sortOption = .newest }
                            } label: {
                                HStack(spacing: 4) {
                                    Image(systemName: "arrow.up.arrow.down")
                                        .font(.system(size: 12, weight: .semibold))
                                    Text("Sort")
                                        .font(.system(size: 13, weight: .semibold))
                                }
                                .foregroundColor(.orange)
                                .padding(.horizontal, 12).padding(.vertical, 6)
                                .background(Color.orange.opacity(0.1))
                                .cornerRadius(20)
                            }
                        }
                        .padding(.horizontal)
                        .padding(.top, 20)
                        .padding(.bottom, 10)
                        
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
                VStack(spacing: 0) {
                    VStack(spacing: 0) {
                        // Top bar with logo + search
                        HStack(spacing: 10) {
                            // Branding pill
                            HStack(spacing: 5) {
                                Image("AppLogo")
                                    .resizable()
                                    .scaledToFit()
                                    .frame(width: 22, height: 22)
                                Text("SpiceTrade")
                                    .font(.system(size: 13, weight: .black))
                                    .foregroundColor(.white)
                            }
                            .padding(.horizontal, 10).padding(.vertical, 6)
                            .background(
                                LinearGradient(
                                    colors: [Color(red:0.7,green:0.2,blue:0.0), .orange],
                                    startPoint: .leading, endPoint: .trailing
                                )
                            )
                            .cornerRadius(20)

                            // Search field
                            HStack(spacing: 8) {
                                Image(systemName: "magnifyingglass")
                                    .foregroundColor(.gray)
                                    .font(.system(size: 14))

                                TextField("Search spices, herbs, pulses...", text: $viewModel.searchText)
                                    .focused($searchFieldFocused)
                                    .textFieldStyle(PlainTextFieldStyle())
                                    .font(.system(size: 14))
                                    .onChange(of: viewModel.searchText) { _, newValue in
                                        showSuggestions = !newValue.isEmpty && searchFieldFocused
                                    }
                                    .onSubmit {
                                        showSuggestions = false
                                        searchFieldFocused = false
                                    }

                                if !viewModel.searchText.isEmpty {
                                    Button(action: {
                                        viewModel.searchText = ""
                                        showSuggestions = false
                                    }) {
                                        Image(systemName: "xmark.circle.fill")
                                            .foregroundColor(Color(.systemGray3))
                                    }
                                }
                            }
                            .padding(.horizontal, 12).padding(.vertical, 9)
                            .background(Color(.systemGray6))
                            .cornerRadius(12)

                            // Filter button
                            Button(action: { showFilters.toggle() }) {
                                ZStack(alignment: .topTrailing) {
                                    Image(systemName: "slider.horizontal.3")
                                        .font(.system(size: 17, weight: .semibold))
                                        .foregroundColor(viewModel.hasActiveFilters ? .orange : .primary)
                                        .frame(width: 36, height: 36)
                                        .background(Color(.systemGray6))
                                        .cornerRadius(10)

                                    if viewModel.hasActiveFilters {
                                        Circle()
                                            .fill(Color.orange)
                                            .frame(width: 8, height: 8)
                                            .offset(x: 2, y: -2)
                                    }
                                }
                            }
                        }
                        .padding(.horizontal, 12)
                        .padding(.top, 8)
                        .padding(.bottom, 8)
                        
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
                    AsyncImage(url: URL(string: "\(APIConfig.baseURL)\(imageUrl)")) { phase in
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

// MARK: - Amazon-Style Components

// Category Card — tile style
struct CategoryCard: View {
    let icon: String
    let name: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 10) {
                ZStack {
                    RoundedRectangle(cornerRadius: 18)
                        .fill(
                            LinearGradient(
                                colors: [color.opacity(0.85), color],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 64, height: 64)
                        .shadow(color: color.opacity(0.4), radius: 8, x: 0, y: 4)
                    Image(systemName: icon)
                        .font(.system(size: 26, weight: .semibold))
                        .foregroundColor(.white)
                }
                Text(name)
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(.primary)
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
                    .frame(width: 72)
            }
        }
        .buttonStyle(ScaleButtonStyle())
    }
}

// Featured Product Card (Horizontal scroll)
struct FeaturedProductCard: View {
    let product: Product

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ZStack(alignment: .topTrailing) {
                Group {
                    if let imageUrl = product.imageURLs.first {
                        AsyncImage(url: URL(string: product.fullImageURL(for: imageUrl))) { phase in
                            switch phase {
                            case .success(let img): img.resizable().scaledToFill()
                            default: featuredPlaceholder
                            }
                        }
                    } else {
                        featuredPlaceholder
                    }
                }
                .frame(width: 200, height: 160)
                .clipped()

                if product.isRequirement {
                    Text("WANTED")
                        .font(.system(size: 9, weight: .black))
                        .foregroundColor(.white)
                        .padding(.horizontal, 7).padding(.vertical, 3)
                        .background(Color.blue)
                        .cornerRadius(6)
                        .padding(8)
                }
            }
            .frame(width: 200, height: 160)
            .background(Color(.systemGray6))

            VStack(alignment: .leading, spacing: 6) {
                Text(product.title)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(.primary)
                    .lineLimit(2)
                    .frame(height: 34, alignment: .top)

                if let rc = product.reviewCount, rc > 0 {
                    HStack(spacing: 2) {
                        let stars = Int(round(product.averageRating ?? 0))
                        ForEach(0..<5) { i in
                            Image(systemName: i < stars ? "star.fill" : "star")
                                .font(.system(size: 9)).foregroundColor(.orange)
                        }
                        Text("(\(rc))").font(.system(size: 10)).foregroundColor(.secondary)
                    }
                }

                if let price = product.price, price > 0 {
                    Text(product.priceText)
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(Color(red: 0.7, green: 0.2, blue: 0.0))
                } else if product.isRequirement {
                    Text("Price on Request")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.secondary)
                }
            }
            .padding(12)
        }
        .frame(width: 200)
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.09), radius: 12, x: 0, y: 4)
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color(.systemGray5), lineWidth: 0.5))
    }

    private var featuredPlaceholder: some View {
        ZStack {
            Color(.systemGray5)
            Image(systemName: "photo").font(.largeTitle).foregroundColor(Color(.systemGray3))
        }
    }
}

// Grid product card — premium B2B style
struct AmazonStyleProductCard: View {
    let product: Product

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ZStack(alignment: .topLeading) {
                Group {
                    if let imageUrl = product.imageURLs.first {
                        AsyncImage(url: URL(string: product.fullImageURL(for: imageUrl))) { phase in
                            switch phase {
                            case .success(let img): img.resizable().scaledToFill()
                            default: cardPlaceholder
                            }
                        }
                    } else {
                        cardPlaceholder
                    }
                }
                .frame(height: 148)
                .frame(maxWidth: .infinity)
                .clipped()

                if product.isRequirement {
                    Text("WANTED")
                        .font(.system(size: 9, weight: .black))
                        .foregroundColor(.white)
                        .padding(.horizontal, 7).padding(.vertical, 3)
                        .background(
                            LinearGradient(colors: [Color.blue, Color.indigo],
                                           startPoint: .leading, endPoint: .trailing)
                        )
                        .cornerRadius(6)
                        .padding(8)
                } else if let rc = product.reviewCount, rc >= 10 {
                    Text("POPULAR")
                        .font(.system(size: 9, weight: .black))
                        .foregroundColor(.white)
                        .padding(.horizontal, 7).padding(.vertical, 3)
                        .background(Color.orange)
                        .cornerRadius(6)
                        .padding(8)
                }
            }
            .frame(height: 148)
            .background(Color(.systemGray6))

            VStack(alignment: .leading, spacing: 5) {
                Text(product.title)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(.primary)
                    .lineLimit(2)
                    .fixedSize(horizontal: false, vertical: true)

                if let rc = product.reviewCount, rc > 0 {
                    HStack(spacing: 2) {
                        let stars = Int(round(product.averageRating ?? 0))
                        ForEach(0..<5) { i in
                            Image(systemName: i < stars ? "star.fill" : "star")
                                .font(.system(size: 9)).foregroundColor(.orange)
                        }
                        Text("(\(rc))").font(.system(size: 10)).foregroundColor(.secondary)
                    }
                }

                if let price = product.price, price > 0 {
                    Text(product.priceText)
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(Color(red: 0.7, green: 0.2, blue: 0.0))
                } else if product.isRequirement {
                    Text("Inquiry Only")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(.secondary)
                }

                if let unit = product.unit {
                    Text("per \(unit)")
                        .font(.system(size: 10))
                        .foregroundColor(.secondary)
                }
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 10)
        }
        .background(Color(.systemBackground))
        .cornerRadius(14)
        .shadow(color: .black.opacity(0.07), radius: 10, x: 0, y: 3)
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color(.systemGray5), lineWidth: 0.5))
    }

    private var cardPlaceholder: some View {
        ZStack {
            Color(.systemGray6)
            Image(systemName: "photo").font(.system(size: 28)).foregroundColor(Color(.systemGray4))
        }
    }
}

// Tap scale animation
struct ScaleButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.93 : 1.0)
            .animation(.easeInOut(duration: 0.12), value: configuration.isPressed)
    }
}

struct FilterView: View {
    @ObservedObject var viewModel: ProductViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            List {
                Section("Category") {
                    Button("All Categories") { viewModel.selectedCategory = nil }
                        .foregroundColor(viewModel.selectedCategory == nil ? .orange : .primary)
                    ForEach(viewModel.availableCategories, id: \.self) { category in
                        Button(category) { viewModel.selectedCategory = category }
                            .foregroundColor(viewModel.selectedCategory == category ? .orange : .primary)
                    }
                }
                Section("Tags") {
                    ForEach(viewModel.availableTags, id: \.self) { tag in
                        Toggle(tag, isOn: Binding(
                            get: { viewModel.selectedTags.contains(tag) },
                            set: { isOn in
                                if isOn { viewModel.selectedTags.insert(tag) }
                                else { viewModel.selectedTags.remove(tag) }
                            }
                        ))
                    }
                }
            }
            .navigationTitle("Filters")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Clear All") { viewModel.clearFilters() }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") { dismiss() }.fontWeight(.semibold)
                }
            }
        }
    }
}

#Preview {
    ProductsListView()
}
