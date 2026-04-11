//
//  WelcomeView.swift
//  SpiceTrade
//

import SwiftUI

struct WelcomeView: View {
    @State private var showLogin = false
    @State private var showSignup = false
    @State private var currentSlide = 0

    private let slides: [(icon: String, title: String, subtitle: String)] = [
        ("spigot.fill",      "Source Directly",    "Connect with verified spice traders & manufacturers across India"),
        ("shippingbox.fill", "Bulk Made Easy",      "Post requirements, compare quotes, close deals — all in one place"),
        ("rosette",          "Quality Assured",     "Verified sellers, genuine reviews, trusted trade relationships"),
    ]

    var body: some View {
        ZStack {
            // Rich warm background
            LinearGradient(
                colors: [
                    Color(red: 0.55, green: 0.13, blue: 0.02),
                    Color(red: 0.80, green: 0.30, blue: 0.02),
                    Color(red: 0.95, green: 0.55, blue: 0.10),
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            // Subtle pattern overlay
            GeometryReader { geo in
                ForEach(0..<8) { i in
                    Circle()
                        .stroke(Color.white.opacity(0.05), lineWidth: 1.5)
                        .frame(width: CGFloat(80 + i * 50))
                        .position(
                            x: i % 2 == 0 ? geo.size.width * 0.15 : geo.size.width * 0.85,
                            y: CGFloat(100 + i * 90)
                        )
                }
            }
            .ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer()

                // Logo
                VStack(spacing: 16) {
                    Image("AppLogo")
                        .resizable()
                        .scaledToFit()
                        .frame(width: 120, height: 120)
                        .shadow(color: .black.opacity(0.25), radius: 20, x: 0, y: 10)

                    Text("SpiceTrade")
                        .font(.system(size: 42, weight: .black, design: .rounded))
                        .foregroundColor(.white)
                        .shadow(color: .black.opacity(0.15), radius: 4, x: 0, y: 2)

                    Text("India's B2B Spice Marketplace")
                        .font(.system(size: 15, weight: .medium))
                        .foregroundColor(.white.opacity(0.85))
                        .kerning(0.5)
                }

                Spacer().frame(height: 50)

                // Feature slides
                TabView(selection: $currentSlide) {
                    ForEach(Array(slides.enumerated()), id: \.offset) { idx, slide in
                        FeatureSlide(icon: slide.icon, title: slide.title, subtitle: slide.subtitle)
                            .tag(idx)
                    }
                }
                .tabViewStyle(PageTabViewStyle(indexDisplayMode: .always))
                .frame(height: 180)
                .onAppear { startAutoScroll() }

                Spacer().frame(height: 50)

                // Value proposition badges
                HStack(spacing: 0) {
                    StatBadge(value: "🌿", label: "Farm Fresh")
                    Divider().frame(height: 30).background(Color.white.opacity(0.3))
                    StatBadge(value: "✅", label: "Verified Sellers")
                    Divider().frame(height: 30).background(Color.white.opacity(0.3))
                    StatBadge(value: "🤝", label: "Direct Trade")
                }
                .padding(.horizontal, 32)
                .padding(.vertical, 16)
                .background(Color.white.opacity(0.12))
                .cornerRadius(16)
                .padding(.horizontal, 24)

                Spacer().frame(height: 44)

                // CTA buttons
                VStack(spacing: 14) {
                    Button(action: { showSignup = true }) {
                        HStack {
                            Text("Get Started — It's Free")
                                .font(.system(size: 17, weight: .bold))
                            Image(systemName: "arrow.right")
                                .font(.system(size: 14, weight: .bold))
                        }
                        .foregroundColor(Color(red: 0.70, green: 0.20, blue: 0.02))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 18)
                        .background(Color.white)
                        .cornerRadius(16)
                        .shadow(color: .black.opacity(0.15), radius: 12, x: 0, y: 6)
                    }

                    Button(action: { showLogin = true }) {
                        Text("Already have an account? Sign In")
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundColor(.white.opacity(0.9))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(Color.white.opacity(0.15))
                            .cornerRadius(16)
                            .overlay(
                                RoundedRectangle(cornerRadius: 16)
                                    .stroke(Color.white.opacity(0.4), lineWidth: 1.5)
                            )
                    }
                }
                .padding(.horizontal, 24)

                Spacer().frame(height: 40)

                Text("Source spices directly from verified Indian traders")
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.6))
                    .padding(.bottom, 24)
            }
        }
        .sheet(isPresented: $showLogin) { LoginView() }
        .sheet(isPresented: $showSignup) { SignupView() }
    }

    private func startAutoScroll() {
        Timer.scheduledTimer(withTimeInterval: 3.5, repeats: true) { _ in
            withAnimation(.easeInOut(duration: 0.5)) {
                currentSlide = (currentSlide + 1) % slides.count
            }
        }
    }
}

private struct FeatureSlide: View {
    let icon: String
    let title: String
    let subtitle: String

    var body: some View {
        VStack(spacing: 14) {
            Image(systemName: icon)
                .font(.system(size: 36))
                .foregroundColor(.white)
                .frame(width: 70, height: 70)
                .background(Color.white.opacity(0.15))
                .clipShape(RoundedRectangle(cornerRadius: 20))

            Text(title)
                .font(.system(size: 20, weight: .bold, design: .rounded))
                .foregroundColor(.white)

            Text(subtitle)
                .font(.system(size: 14))
                .foregroundColor(.white.opacity(0.8))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
        }
        .frame(maxWidth: .infinity)
    }
}

private struct StatBadge: View {
    let value: String
    let label: String

    var body: some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.system(size: 18, weight: .black, design: .rounded))
                .foregroundColor(.white)
            Text(label)
                .font(.system(size: 11, weight: .medium))
                .foregroundColor(.white.opacity(0.75))
        }
        .frame(maxWidth: .infinity)
    }
}

#Preview {
    WelcomeView()
}
