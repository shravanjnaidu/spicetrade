//
//  AddReviewView.swift
//  SpiceTrade
//

import SwiftUI

struct AddReviewView: View {
    let productId: Int
    let userId: Int
    let onReviewAdded: () -> Void
    
    @Environment(\.dismiss) private var dismiss
    @State private var rating = 5
    @State private var reviewText = ""
    @State private var isSubmitting = false
    @State private var errorMessage: String?
    
    var body: some View {
        NavigationStack {
            Form {
                Section("Rating") {
                    HStack {
                        ForEach(1...5, id: \.self) { star in
                            Button(action: { rating = star }) {
                                Image(systemName: star <= rating ? "star.fill" : "star")
                                    .font(.title)
                                    .foregroundColor(.orange)
                            }
                        }
                    }
                    .frame(maxWidth: .infinity)
                }
                
                Section("Review") {
                    TextEditor(text: $reviewText)
                        .frame(minHeight: 100)
                }
                
                if let errorMessage = errorMessage {
                    Section {
                        Text(errorMessage)
                            .foregroundColor(.red)
                            .font(.caption)
                    }
                }
            }
            .navigationTitle("Write Review")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Submit") {
                        submitReview()
                    }
                    .disabled(isSubmitting)
                }
            }
        }
    }
    
    private func submitReview() {
        isSubmitting = true
        errorMessage = nil
        
        Task {
            do {
                try await APIService.shared.addReview(
                    adId: productId,
                    userId: userId,
                    rating: rating,
                    reviewText: reviewText
                )
                onReviewAdded()
                dismiss()
            } catch {
                errorMessage = error.localizedDescription
            }
            isSubmitting = false
        }
    }
}

#Preview {
    AddReviewView(productId: 1, userId: 1) {}
}
