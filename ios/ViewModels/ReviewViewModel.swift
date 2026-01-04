//
//  ReviewViewModel.swift
//  SpiceTrade
//

import Foundation

@MainActor
class ReviewViewModel: ObservableObject {
    @Published var reviews: [Review] = []
    @Published var stats: ReviewStats?
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    func loadReviews(productId: Int) async {
        isLoading = true
        do {
            reviews = try await APIService.shared.getReviews(adId: productId)
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
    
    func loadStats(productId: Int) async {
        do {
            stats = try await APIService.shared.getReviewStats(adId: productId)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
