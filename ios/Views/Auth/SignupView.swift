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
    @State private var showPassword = false
    @State private var phone = ""
    @State private var role = "buyer"
    @State private var location = ""

    // Seller fields
    @State private var storeName = ""
    @State private var businessType = ""
    @State private var categories = ""
    @State private var address = ""
    @State private var website = ""

    private let brandRed    = Color(red: 0.65, green: 0.15, blue: 0.02)
    private let brandOrange = Color(red: 0.95, green: 0.50, blue: 0.08)

    var body: some View {
        NavigationStack {
            ZStack(alignment: .top) {
                Color(.systemGroupedBackground).ignoresSafeArea()

                // Gradient header band
                LinearGradient(
                    colors: [brandRed, brandOrange],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .frame(height: 220)
                .ignoresSafeArea(edges: .top)

                ScrollView {
                    VStack(spacing: 0) {
                        // Header
                        VStack(spacing: 10) {
                            // Logo
                            ZStack {
                                Circle()
                                    .fill(Color.white.opacity(0.2))
                                    .frame(width: 86, height: 86)
                                Image("AppLogo")
                                    .resizable()
                                    .scaledToFit()
                                    .frame(width: 66, height: 66)
                            }
                            .shadow(color: .black.opacity(0.2), radius: 12, x: 0, y: 6)
                            .padding(.top, 50)

                            Text("Join SpiceTrade")
                                .font(.system(size: 26, weight: .black, design: .rounded))
                                .foregroundColor(.white)

                            Text("India's B2B Spice Marketplace")
                                .font(.system(size: 13, weight: .medium))
                                .foregroundColor(.white.opacity(0.85))
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.bottom, 36)

                        // Main card
                        VStack(spacing: 20) {

                            // Role toggle
                            VStack(alignment: .leading, spacing: 10) {
                                Text("I want to")
                                    .font(.system(size: 13, weight: .semibold))
                                    .foregroundColor(.secondary)

                                HStack(spacing: 10) {
                                    PremiumRoleButton(
                                        title: "Buy",
                                        subtitle: "Source products",
                                        icon: "bag.fill",
                                        isSelected: role == "buyer"
                                    ) { role = "buyer" }

                                    PremiumRoleButton(
                                        title: "Sell",
                                        subtitle: "List products",
                                        icon: "storefront.fill",
                                        isSelected: role == "seller"
                                    ) { role = "seller" }
                                }
                            }

                            Divider()

                            // Personal info
                            VStack(spacing: 14) {
                                AuthInputField(icon: "person.fill",     placeholder: "Full name",         text: $name)
                                AuthInputField(icon: "envelope.fill",   placeholder: "Email address",     text: $email,  keyboardType: .emailAddress)
                                AuthSecureField(icon: "lock.fill",      placeholder: "Create password",   text: $password, showText: $showPassword)
                                AuthInputField(icon: "phone.fill",      placeholder: "Phone (optional)",  text: $phone,  keyboardType: .phonePad)
                                AuthInputField(icon: "mappin.circle.fill", placeholder: "City / Region",  text: $location)
                            }

                            // Seller section
                            if role == "seller" {
                                VStack(spacing: 0) {
                                    HStack {
                                        Image(systemName: "briefcase.fill")
                                            .font(.caption)
                                            .foregroundColor(brandOrange)
                                        Text("Store Information")
                                            .font(.system(size: 13, weight: .bold))
                                            .foregroundColor(brandRed)
                                        Spacer()
                                    }
                                    .padding(.vertical, 10)

                                    Divider()
                                        .padding(.bottom, 14)

                                    VStack(spacing: 14) {
                                        AuthInputField(icon: "storefront.fill",   placeholder: "Store name *",             text: $storeName)
                                        AuthInputField(icon: "building.2.fill",   placeholder: "Business type (Wholesale/Retail)", text: $businessType)
                                        AuthInputField(icon: "tag.fill",          placeholder: "Categories (Spices, Pulses…)", text: $categories)
                                        AuthInputField(icon: "location.fill",     placeholder: "Business address",         text: $address)
                                        AuthInputField(icon: "globe",             placeholder: "Website URL",              text: $website, keyboardType: .URL)
                                    }
                                }
                                .padding(16)
                                .background(Color(red: 1.0, green: 0.97, blue: 0.94))
                                .cornerRadius(14)
                                .overlay(RoundedRectangle(cornerRadius: 14).stroke(brandOrange.opacity(0.3), lineWidth: 1))
                            }

                            // Error
                            if let errorMessage = authViewModel.errorMessage {
                                HStack(spacing: 6) {
                                    Image(systemName: "exclamationmark.circle.fill")
                                        .foregroundColor(.red)
                                        .font(.caption)
                                    Text(errorMessage)
                                        .font(.caption)
                                        .foregroundColor(.red)
                                }
                                .frame(maxWidth: .infinity, alignment: .leading)
                            }

                            // Create account button
                            Button(action: signup) {
                                ZStack {
                                    LinearGradient(
                                        colors: [brandRed, brandOrange],
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    )
                                    .cornerRadius(14)

                                    if authViewModel.isLoading {
                                        ProgressView()
                                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                    } else {
                                        Text("Create Account")
                                            .font(.system(size: 16, weight: .bold))
                                            .foregroundColor(.white)
                                    }
                                }
                                .frame(height: 52)
                            }
                            .disabled(authViewModel.isLoading || !isFormValid)
                            .opacity(authViewModel.isLoading || !isFormValid ? 0.6 : 1)
                            .shadow(color: brandOrange.opacity(0.5), radius: 10, x: 0, y: 5)
                        }
                        .padding(24)
                        .background(Color(.systemBackground))
                        .cornerRadius(24)
                        .shadow(color: .black.opacity(0.1), radius: 20, x: 0, y: 8)
                        .padding(.horizontal, 20)
                        .padding(.bottom, 50)
                    }
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(action: { dismiss() }) {
                        Image(systemName: "xmark")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(.white)
                            .padding(7)
                            .background(Color.white.opacity(0.25))
                            .clipShape(Circle())
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
                name: name, email: email, password: password,
                phone: phone.isEmpty ? nil : phone,
                role: role,
                location: location.isEmpty ? nil : location,
                storeName: role == "seller" ? storeName : nil,
                businessType: role == "seller" && !businessType.isEmpty ? businessType : nil,
                categories: role == "seller" && !categories.isEmpty ? categories : nil,
                address: role == "seller" && !address.isEmpty ? address : nil,
                website: role == "seller" && !website.isEmpty ? website : nil
            )
            if authViewModel.isAuthenticated { dismiss() }
        }
    }
}

// MARK: - Premium Role Button

struct PremiumRoleButton: View {
    let title: String
    let subtitle: String
    let icon: String
    let isSelected: Bool
    let action: () -> Void

    private let brandRed    = Color(red: 0.65, green: 0.15, blue: 0.02)
    private let brandOrange = Color(red: 0.95, green: 0.50, blue: 0.08)

    var body: some View {
        Button(action: action) {
            HStack(spacing: 10) {
                ZStack {
                    RoundedRectangle(cornerRadius: 10)
                        .fill(isSelected
                            ? LinearGradient(colors: [brandRed, brandOrange], startPoint: .topLeading, endPoint: .bottomTrailing)
                            : LinearGradient(colors: [Color(.systemGray5), Color(.systemGray5)], startPoint: .topLeading, endPoint: .bottomTrailing)
                        )
                        .frame(width: 40, height: 40)
                    Image(systemName: icon)
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundColor(isSelected ? .white : .secondary)
                }

                VStack(alignment: .leading, spacing: 1) {
                    Text(title)
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(isSelected ? brandRed : .primary)
                    Text(subtitle)
                        .font(.system(size: 11))
                        .foregroundColor(.secondary)
                }
                Spacer()
            }
            .padding(.horizontal, 12).padding(.vertical, 10)
            .background(isSelected ? Color(red: 1.0, green: 0.97, blue: 0.94) : Color(.systemGray6))
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(isSelected ? brandOrange.opacity(0.5) : Color.clear, lineWidth: 1.5)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Legacy stubs kept for backwards compatibility
struct RoleButton: View {
    let title: String
    let icon: String
    let isSelected: Bool
    let action: () -> Void
    var body: some View {
        PremiumRoleButton(title: title, subtitle: "", icon: icon, isSelected: isSelected, action: action)
    }
}

struct InputField: View {
    let title: String
    @Binding var text: String
    let placeholder: String
    var keyboardType: UIKeyboardType = .default
    var isSecure: Bool = false
    @State private var showSecure = false

    var body: some View {
        if isSecure {
            AuthSecureField(icon: "lock.fill", placeholder: placeholder, text: $text, showText: $showSecure)
        } else {
            AuthInputField(icon: "pencil", placeholder: placeholder, text: $text, keyboardType: keyboardType)
        }
    }
}

#Preview {
    SignupView()
        .environmentObject(AuthViewModel())
}
