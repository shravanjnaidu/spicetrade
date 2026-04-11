//
//  LoginView.swift
//  SpiceTrade
//

import SwiftUI

struct LoginView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var authViewModel: AuthViewModel

    @State private var email = ""
    @State private var password = ""
    @State private var showPassword = false

    private let brandRed   = Color(red: 0.65, green: 0.15, blue: 0.02)
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
                .frame(height: 240)
                .ignoresSafeArea(edges: .top)

                ScrollView {
                    VStack(spacing: 0) {
                        // Header content
                        VStack(spacing: 10) {
                        // Logo
                        ZStack {
                            Circle()
                                .fill(Color.white.opacity(0.2))
                                .frame(width: 90, height: 90)
                            Image("AppLogo")
                                .resizable()
                                .scaledToFit()
                                .frame(width: 70, height: 70)
                        }
                        .shadow(color: .black.opacity(0.2), radius: 12, x: 0, y: 6)
                        .padding(.top, 56)

                            Text("Welcome Back")
                                .font(.system(size: 28, weight: .black, design: .rounded))
                                .foregroundColor(.white)

                            Text("Sign in to SpiceTrade")
                                .font(.system(size: 14, weight: .medium))
                                .foregroundColor(.white.opacity(0.85))
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.bottom, 40)

                        // Card
                        VStack(spacing: 20) {
                            // Email field
                            AuthInputField(
                                icon: "envelope.fill",
                                placeholder: "Email address",
                                text: $email,
                                keyboardType: .emailAddress
                            )

                            // Password field
                            AuthSecureField(
                                icon: "lock.fill",
                                placeholder: "Password",
                                text: $password,
                                showText: $showPassword
                            )

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

                            // Login button
                            Button(action: login) {
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
                                        Text("Sign In")
                                            .font(.system(size: 16, weight: .bold))
                                            .foregroundColor(.white)
                                    }
                                }
                                .frame(height: 52)
                            }
                            .disabled(authViewModel.isLoading || email.isEmpty || password.isEmpty)
                            .opacity(authViewModel.isLoading || email.isEmpty || password.isEmpty ? 0.6 : 1)
                            .shadow(color: brandOrange.opacity(0.5), radius: 10, x: 0, y: 5)
                        }
                        .padding(24)
                        .background(Color(.systemBackground))
                        .cornerRadius(24)
                        .shadow(color: .black.opacity(0.1), radius: 20, x: 0, y: 8)
                        .padding(.horizontal, 20)
                        .padding(.bottom, 40)
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

    private func login() {
        Task {
            await authViewModel.login(email: email, password: password)
            if authViewModel.isAuthenticated { dismiss() }
        }
    }
}

// MARK: - Shared Auth Input Components

struct AuthInputField: View {
    let icon: String
    let placeholder: String
    @Binding var text: String
    var keyboardType: UIKeyboardType = .default

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 15, weight: .semibold))
                .foregroundColor(Color(red: 0.65, green: 0.15, blue: 0.02))
                .frame(width: 20)

            TextField(placeholder, text: $text)
                .textInputAutocapitalization(keyboardType == .emailAddress ? .never : .words)
                .keyboardType(keyboardType)
                .autocorrectionDisabled(keyboardType == .emailAddress || keyboardType == .URL)
                .font(.system(size: 15))
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 13)
        .background(Color(.systemGray6))
        .cornerRadius(12)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color(.systemGray4), lineWidth: 0.5))
    }
}

struct AuthSecureField: View {
    let icon: String
    let placeholder: String
    @Binding var text: String
    @Binding var showText: Bool

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 15, weight: .semibold))
                .foregroundColor(Color(red: 0.65, green: 0.15, blue: 0.02))
                .frame(width: 20)

            Group {
                if showText {
                    TextField(placeholder, text: $text)
                } else {
                    SecureField(placeholder, text: $text)
                }
            }
            .font(.system(size: 15))

            Button(action: { showText.toggle() }) {
                Image(systemName: showText ? "eye.slash" : "eye")
                    .font(.system(size: 14))
                    .foregroundColor(.secondary)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 13)
        .background(Color(.systemGray6))
        .cornerRadius(12)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color(.systemGray4), lineWidth: 0.5))
    }
}

#Preview {
    LoginView()
        .environmentObject(AuthViewModel())
}
