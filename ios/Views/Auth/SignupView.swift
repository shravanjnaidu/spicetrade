//
//  SignupView.swift
//  SpiceTrade
//

import SwiftUI

struct SignupView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var authViewModel: AuthViewModel
    
    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var phone = ""
    @State private var role = "buyer"
    @State private var location = ""
    
    // Seller fields
    @State private var storeName = ""
    @State private var businessType = ""
    @State private var categories = ""
    @State private var address = ""
    @State private var website = ""
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Header
                    VStack(spacing: 8) {
                        Image(systemName: "person.badge.plus")
                            .resizable()
                            .scaledToFit()
                            .frame(width: 70, height: 70)
                            .foregroundColor(.orange)
                        
                        Text("Create Account")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                        
                        Text("Join our marketplace")
                            .foregroundColor(.secondary)
                    }
                    .padding(.top, 20)
                    
                    // Role selection
                    VStack(alignment: .leading, spacing: 12) {
                        Text("I want to:")
                            .font(.headline)
                        
                        HStack(spacing: 12) {
                            RoleButton(title: "Buy", icon: "bag.fill", isSelected: role == "buyer") {
                                role = "buyer"
                            }
                            
                            RoleButton(title: "Sell", icon: "storefront.fill", isSelected: role == "seller") {
                                role = "seller"
                            }
                        }
                    }
                    .padding(.horizontal)
                    
                    // Common fields
                    VStack(spacing: 16) {
                        InputField(title: "Name", text: $name, placeholder: "Your full name")
                        InputField(title: "Email", text: $email, placeholder: "your@email.com", keyboardType: .emailAddress)
                        InputField(title: "Password", text: $password, placeholder: "Create a password", isSecure: true)
                        InputField(title: "Phone", text: $phone, placeholder: "Your phone number", keyboardType: .phonePad)
                        InputField(title: "Location", text: $location, placeholder: "Your city/region")
                    }
                    .padding(.horizontal)
                    
                    // Seller-specific fields
                    if role == "seller" {
                        VStack(spacing: 16) {
                            Text("Store Information")
                                .font(.headline)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .padding(.horizontal)
                            
                            InputField(title: "Store Name", text: $storeName, placeholder: "Your store name")
                            InputField(title: "Business Type", text: $businessType, placeholder: "e.g., Retail, Wholesale")
                            InputField(title: "Categories", text: $categories, placeholder: "e.g., Spices, Foods")
                            InputField(title: "Address", text: $address, placeholder: "Business address")
                            InputField(title: "Website", text: $website, placeholder: "https://yourwebsite.com", keyboardType: .URL)
                        }
                        .padding(.horizontal)
                    }
                    
                    // Error message
                    if let errorMessage = authViewModel.errorMessage {
                        Text(errorMessage)
                            .foregroundColor(.red)
                            .font(.caption)
                            .padding(.horizontal)
                    }
                    
                    // Signup button
                    Button(action: signup) {
                        if authViewModel.isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                .frame(maxWidth: .infinity)
                                .padding()
                        } else {
                            Text("Create Account")
                                .font(.headline)
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding()
                        }
                    }
                    .background(Color.orange)
                    .cornerRadius(12)
                    .padding(.horizontal)
                    .disabled(authViewModel.isLoading || !isFormValid)
                    
                    Spacer()
                }
                .padding(.bottom, 30)
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }
    
    private var isFormValid: Bool {
        !name.isEmpty && !email.isEmpty && !password.isEmpty &&
        (role != "seller" || !storeName.isEmpty)
    }
    
    private func signup() {
        Task {
            await authViewModel.signup(
                name: name,
                email: email,
                password: password,
                phone: phone.isEmpty ? nil : phone,
                role: role,
                location: location.isEmpty ? nil : location,
                storeName: role == "seller" ? storeName : nil,
                businessType: role == "seller" && !businessType.isEmpty ? businessType : nil,
                categories: role == "seller" && !categories.isEmpty ? categories : nil,
                address: role == "seller" && !address.isEmpty ? address : nil,
                website: role == "seller" && !website.isEmpty ? website : nil
            )
            
            if authViewModel.isAuthenticated {
                dismiss()
            }
        }
    }
}

// MARK: - Supporting Views

struct RoleButton: View {
    let title: String
    let icon: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.system(size: 40))
                
                Text(title)
                    .font(.headline)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 20)
            .background(isSelected ? Color.orange : Color(.systemGray6))
            .foregroundColor(isSelected ? .white : .primary)
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(isSelected ? Color.orange : Color.clear, lineWidth: 2)
            )
        }
    }
}

struct InputField: View {
    let title: String
    @Binding var text: String
    let placeholder: String
    var keyboardType: UIKeyboardType = .default
    var isSecure: Bool = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.subheadline)
                .fontWeight(.semibold)
            
            Group {
                if isSecure {
                    SecureField(placeholder, text: $text)
                } else {
                    TextField(placeholder, text: $text)
                        .textInputAutocapitalization(keyboardType == .emailAddress || keyboardType == .URL ? .never : .words)
                        .keyboardType(keyboardType)
                        .autocorrectionDisabled(keyboardType == .emailAddress || keyboardType == .URL)
                }
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(10)
        }
    }
}

#Preview {
    SignupView()
        .environmentObject(AuthViewModel())
}
