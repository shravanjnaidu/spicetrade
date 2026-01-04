//
//  WishlistViewModel.swift
//  SpiceTrade
//

import Foundation

@MainActor
class WishlistViewModel: ObservableObject {
    @Published var items: [WishlistItem] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    func loadWishlist(userId: Int) async {
        isLoading = true
        do {
            items = try await APIService.shared.getWishlist(userId: userId)
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
    
    func removeItem(wishlistId: Int) async {
        do {
            try await APIService.shared.removeFromWishlist(wishlistId: wishlistId)
            items.removeAll { $0.wishlistId == wishlistId }
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
