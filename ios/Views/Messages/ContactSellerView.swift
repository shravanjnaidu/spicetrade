//
//  ContactSellerView.swift
//  SpiceTrade
//

import SwiftUI

struct ContactSellerView: View {
    let buyerId: Int
    let sellerId: Int
    let listingId: Int
    let sellerName: String
    
    @Environment(\.dismiss) private var dismiss
    @State private var message = ""
    @State private var isCreatingConversation = false
    @State private var errorMessage: String?
    @State private var conversationId: Int?
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                Image(systemName: "message.fill")
                    .font(.system(size: 60))
                    .foregroundColor(.orange)
                
                Text("Contact \(sellerName)")
                    .font(.title2)
                    .fontWeight(.bold)
                
                Text("Send a message to start a conversation")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                
                VStack(alignment: .leading, spacing: 8) {
                    Text("Your Message")
                        .font(.headline)
                    
                    TextEditor(text: $message)
                        .frame(height: 150)
                        .padding(8)
                        .background(Color(.systemGray6))
                        .cornerRadius(10)
                        .overlay(
                            RoundedRectangle(cornerRadius: 10)
                                .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                        )
                }
                .padding(.horizontal)
                
                if let errorMessage = errorMessage {
                    Text(errorMessage)
                        .foregroundColor(.red)
                        .font(.caption)
                        .padding(.horizontal)
                }
                
                Button(action: startConversation) {
                    if isCreatingConversation {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            .frame(maxWidth: .infinity)
                            .padding()
                    } else {
                        Text("Send Message")
                            .font(.headline)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding()
                    }
                }
                .background(message.isEmpty ? Color.gray : Color.orange)
                .cornerRadius(12)
                .padding(.horizontal)
                .disabled(message.isEmpty || isCreatingConversation)
                
                Spacer()
            }
            .padding(.top, 40)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }
    
    private func startConversation() {
        isCreatingConversation = true
        errorMessage = nil
        
        Task {
            do {
                let convId = try await APIService.shared.startConversation(
                    buyerId: buyerId,
                    sellerId: sellerId,
                    listingId: listingId
                )
                
                // Send the initial message
                try await APIService.shared.sendMessage(
                    conversationId: convId,
                    senderId: buyerId,
                    message: message
                )
                
                dismiss()
            } catch {
                errorMessage = error.localizedDescription
            }
            
            isCreatingConversation = false
        }
    }
}

#Preview {
    ContactSellerView(buyerId: 1, sellerId: 2, listingId: 1, sellerName: "Spice Store")
}
