//
//  ProductViewModel.swift
//  SpiceTrade
//

import Foundation
import SwiftUI

enum SortOption {
    case featured
    case priceLowToHigh
    case priceHighToLow
    case newest
}

@MainActor
class ProductViewModel: ObservableObject {
    @Published var products: [Product] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var searchText = ""
    @Published var selectedCategory: String?
    @Published var selectedTags: Set<String> = []
    @Published var sortOption: SortOption = .featured
    
    var searchSuggestions: [Product] {
        guard !searchText.isEmpty else { return [] }
        
        let trimmed = searchText.trimmingCharacters(in: .whitespaces).lowercased()
        guard trimmed.count >= 2 else { return [] }
        
        return products.filter { product in
            product.title.localizedCaseInsensitiveContains(trimmed) ||
            product.description.localizedCaseInsensitiveContains(trimmed) ||
            (product.category?.localizedCaseInsensitiveContains(trimmed) ?? false) ||
            (product.storeName?.localizedCaseInsensitiveContains(trimmed) ?? false) ||
            (product.tags?.contains(where: { $0.localizedCaseInsensitiveContains(trimmed) }) ?? false)
        }
    }
    
    var filteredProducts: [Product] {
        var result = products
        
        // Search filter
        if !searchText.isEmpty {
            result = result.filter { product in
                product.title.localizedCaseInsensitiveContains(searchText) ||
                product.description.localizedCaseInsensitiveContains(searchText) ||
                (product.category?.localizedCaseInsensitiveContains(searchText) ?? false) ||
                (product.storeName?.localizedCaseInsensitiveContains(searchText) ?? false) ||
                (product.tags?.contains(where: { $0.localizedCaseInsensitiveContains(searchText) }) ?? false)
            }
        }
        
        // Category filter
        if let category = selectedCategory, !category.isEmpty {
            result = result.filter { $0.category == category }
        }
        
        // Tags filter
        if !selectedTags.isEmpty {
            result = result.filter { product in
                guard let productTags = product.tags else { return false }
                return !selectedTags.isDisjoint(with: productTags)
            }
        }
        
        // Apply sorting
        switch sortOption {
        case .featured:
            // Keep original order
            break
        case .priceLowToHigh:
            result = result.sorted { ($0.price ?? 0) < ($1.price ?? 0) }
        case .priceHighToLow:
            result = result.sorted { ($0.price ?? 0) > ($1.price ?? 0) }
        case .newest:
            result = result.sorted { ($0.createdAt ?? "") > ($1.createdAt ?? "") }
        }
        
        return result
    }
    
    var hasActiveFilters: Bool {
        selectedCategory != nil || !selectedTags.isEmpty
    }
    
    var availableCategories: [String] {
        Array(Set(products.compactMap { $0.category })).sorted()
    }
    
    var availableTags: [String] {
        let allTags = products.compactMap { $0.tags }.flatMap { $0 }
        return Array(Set(allTags)).sorted()
    }
    
    func loadProducts() async {
        isLoading = true
        errorMessage = nil
        
        do {
            products = try await APIService.shared.getProducts()
        } catch {
            errorMessage = error.localizedDescription
        }
        
        isLoading = false
    }
    
    func deleteProduct(_ product: Product) async {
        do {
            try await APIService.shared.deleteProduct(productId: product.id)
            products.removeAll { $0.id == product.id }
        } catch {
            errorMessage = error.localizedDescription
        }
    }
    
    func clearFilters() {
        selectedCategory = nil
        selectedTags.removeAll()
    }
}
