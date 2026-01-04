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
    @State private var showSuccess = false
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Header
                    VStack(spacing: 16) {
                        ZStack {
                            Circle()
                                .fill(Color.orange.opacity(0.1))
                                .frame(width: 100, height: 100)
                            
                            Image(systemName: "message.circle.fill")
                                .font(.system(size: 50))
                                .foregroundColor(.orange)
                        }
                        
                        VStack(spacing: 8) {
                            Text("Contact Seller")
                                .font(.title2)
                                .fontWeight(.bold)
                            
                            Text(sellerName)
                                .font(.headline)
                                .foregroundColor(.orange)
                            
                            Text("Start a conversation about this product")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                                .multilineTextAlignment(.center)
                        }
                    }
                    .padding(.top, 20)
                    
                    // Message input
                    VStack(alignment: .leading, spacing: 12) {
                        Label("Your Message", systemImage: "text.bubble")
                            .font(.headline)
                            .foregroundColor(.primary)
                        
                        ZStack(alignment: .topLeading) {
                            if message.isEmpty {
                                Text("Hi, I'm interested in this product. Can you provide more details?")
                                    .foregroundColor(.secondary)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 16)
                            }
                            
                            TextEditor(text: $message)
                                .frame(minHeight: 120)
                                .padding(8)
                                .scrollContentBackground(.hidden)
                                .background(Color(.systemGray6))
                                .cornerRadius(12)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(message.isEmpty ? Color.gray.opacity(0.2) : Color.orange.opacity(0.3), lineWidth: 1.5)
                                )
                        }
                        
                        Text("\(message.count)/500 characters")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .padding(.horizontal, 20)
                    
                    // Quick suggestions
                    if message.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Quick Suggestions")
                                .font(.subheadline)
                                .fontWeight(.semibold)
                                .foregroundColor(.secondary)
                            
                            VStack(spacing: 8) {
                                QuickMessageButton(text: "Is this product available?", action: { message = "Is this product available?" })
                                QuickMessageButton(text: "What's the minimum order quantity?", action: { message = "What's the minimum order quantity?" })
                                QuickMessageButton(text: "Can you share more details?", action: { message = "Can you share more details about this product?" })
                            }
                        }
                        .padding(.horizontal, 20)
                    }
                    
                    // Error message
                    if let errorMessage = errorMessage {
                        HStack(spacing: 12) {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundColor(.red)
                            Text(errorMessage)
                                .font(.subheadline)
                                .foregroundColor(.red)
                        }
                        .padding()
                        .background(Color.red.opacity(0.1))
                        .cornerRadius(10)
                        .padding(.horizontal, 20)
                    }
                    
                    // Send button
                    Button(action: startConversation) {
                        HStack(spacing: 12) {
                            if isCreatingConversation {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            } else {
                                Image(systemName: "paperplane.fill")
                                    .font(.headline)
                                Text("Send Message")
                                    .font(.headline)
                            }
                        }
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(
                            message.trimmingCharacters(in: .whitespaces).isEmpty ? 
                            Color.gray : Color.orange
                        )
                        .cornerRadius(12)
                        .shadow(color: Color.orange.opacity(0.3), radius: 5, x: 0, y: 3)
                    }
                    .padding(.horizontal, 20)
                    .disabled(message.trimmingCharacters(in: .whitespaces).isEmpty || isCreatingConversation)
                    
                    Spacer(minLength: 20)
                }
            }
            .background(Color(.systemGroupedBackground))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(action: { dismiss() }) {
                        Image(systemName: "xmark.circle.fill")
                            .font(.title3)
                            .foregroundColor(.secondary)
                    }
                }
            }
            .alert("Message Sent!", isPresented: $showSuccess) {
                Button("OK") {
                    dismiss()
                }
            } message: {
                Text("Your message has been sent to \(sellerName). They'll respond soon!")
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
                
                showSuccess = true
            } catch {
                errorMessage = error.localizedDescription
                isCreatingConversation = false
            }
        }
    }
}

struct QuickMessageButton: View {
    let text: String
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack {
                Image(systemName: "text.bubble")
                    .foregroundColor(.orange)
                Text(text)
                    .font(.subheadline)
                    .foregroundColor(.primary)
                Spacer()
                Image(systemName: "arrow.right.circle")
                    .foregroundColor(.orange)
            }
            .padding()
            .background(Color.white)
            .cornerRadius(10)
            .shadow(color: .black.opacity(0.05), radius: 2, x: 0, y: 1)
        }
    }
}

#Preview {
    ContactSellerView(buyerId: 1, sellerId: 2, listingId: 1, sellerName: "Spice Store")
}
