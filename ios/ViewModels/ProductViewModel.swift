//
//  ProductViewModel.swift
//  SpiceTrade
//

import Foundation
import SwiftUI

@MainActor
class ProductViewModel: ObservableObject {
    @Published var products: [Product] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var searchText = ""
    @Published var selectedCategory: String?
    @Published var selectedTags: Set<String> = []
    
    var filteredProducts: [Product] {
        var result = products
        
        // Search filter
        if !searchText.isEmpty {
            result = result.filter { product in
                product.title.localizedCaseInsensitiveContains(searchText) ||
                product.description.localizedCaseInsensitiveContains(searchText) ||
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
        
        return result
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
        searchText = ""
        selectedCategory = nil
        selectedTags.removeAll()
    }
}
