//
//  StoresListView.swift
//  SpiceTrade
//

import SwiftUI

struct StoresListView: View {
    @StateObject private var viewModel = StoresViewModel()
    @State private var searchText = ""

    var filteredStores: [Store] {
        if searchText.isEmpty { return viewModel.stores }
        return viewModel.stores.filter { store in
            store.displayName.localizedCaseInsensitiveContains(searchText)
            || (store.businessType?.localizedCaseInsensitiveContains(searchText) ?? false)
            || (store.categories?.localizedCaseInsensitiveContains(searchText) ?? false)
        }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color(.systemGroupedBackground).ignoresSafeArea()

                if viewModel.isLoading && viewModel.stores.isEmpty {
                    VStack(spacing: 14) {
                        ProgressView()
                            .scaleEffect(1.3)
                        Text("Loading stores…")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                } else if filteredStores.isEmpty {
                    emptyState
                } else {
                    ScrollView {
                        LazyVStack(spacing: 14) {
                            ForEach(filteredStores) { store in
                                NavigationLink(destination: StoreDetailView(store: store)) {
                                    PremiumStoreCard(store: store)
                                }
                                .buttonStyle(PlainButtonStyle())
                            }
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                    }
                    .refreshable { await viewModel.loadStores() }
                }
            }
            .navigationTitle("Stores")
            .navigationBarTitleDisplayMode(.large)
            .searchable(text: $searchText, prompt: "Search stores, categories…")
            .task {
                if viewModel.stores.isEmpty { await viewModel.loadStores() }
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 18) {
            ZStack {
                Circle()
                    .fill(Color.orange.opacity(0.12))
                    .frame(width: 100, height: 100)
                Image(systemName: "storefront")
                    .font(.system(size: 42))
                    .foregroundColor(.orange)
            }
            Text(searchText.isEmpty ? "No Stores Yet" : "No Results")
                .font(.title3).fontWeight(.bold)
            Text(searchText.isEmpty
                 ? "Stores will appear here once sellers register."
                 : "Try a different search term.")
                .font(.subheadline).foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
        }
    }
}

// MARK: - Premium Store Card

struct PremiumStoreCard: View {
    let store: Store

    private let brandRed    = Color(red: 0.65, green: 0.15, blue: 0.02)
    private let brandOrange = Color(red: 0.95, green: 0.50, blue: 0.08)

    var body: some View {
        HStack(spacing: 0) {
            // Left logo column
            ZStack {
                RoundedRectangle(cornerRadius: 14)
                    .fill(
                        LinearGradient(
                            colors: [brandRed.opacity(0.85), brandOrange],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 80, height: 80)

                if let logoPath = store.logo {
                    AsyncImage(url: APIConfig.imageURL(logoPath).flatMap { URL(string: $0) }) { phase in
                        switch phase {
                        case .success(let img):
                            img.resizable().scaledToFill()
                                .frame(width: 80, height: 80)
                                .clipShape(RoundedRectangle(cornerRadius: 14))
                        default:
                            logoInitial
                        }
                    }
                } else {
                    logoInitial
                }
            }
            .shadow(color: brandOrange.opacity(0.35), radius: 8, x: 0, y: 4)
            .padding(.leading, 16)

            // Info
            VStack(alignment: .leading, spacing: 5) {
                Text(store.displayName)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundColor(.primary)
                    .lineLimit(1)

                if let businessType = store.businessType {
                    HStack(spacing: 5) {
                        Image(systemName: "briefcase.fill")
                            .font(.system(size: 10))
                            .foregroundColor(brandOrange)
                        Text(businessType)
                            .font(.system(size: 12))
                            .foregroundColor(.secondary)
                    }
                }

                if let cats = store.categories {
                    HStack(spacing: 5) {
                        Image(systemName: "tag.fill")
                            .font(.system(size: 10))
                            .foregroundColor(brandOrange)
                        Text(cats)
                            .font(.system(size: 12))
                            .foregroundColor(.secondary)
                            .lineLimit(1)
                    }
                }

                HStack(spacing: 10) {
                    if let createdAt = store.createdAt {
                        Label(formatYear(createdAt), systemImage: "calendar")
                            .font(.system(size: 11))
                            .foregroundColor(.secondary)
                    }

                    if let views = store.storeViews, views > 0 {
                        Label("\(views) visits", systemImage: "eye.fill")
                            .font(.system(size: 11))
                            .foregroundColor(.secondary)
                    }
                }
                .padding(.top, 2)
            }
            .padding(.leading, 14)
            .padding(.trailing, 10)

            Spacer()

            Image(systemName: "chevron.right")
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(Color(.systemGray3))
                .padding(.trailing, 14)
        }
        .padding(.vertical, 14)
        .background(Color(.systemBackground))
        .cornerRadius(18)
        .shadow(color: .black.opacity(0.07), radius: 10, x: 0, y: 4)
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(Color(.systemGray5), lineWidth: 0.5))
    }

    private var logoInitial: some View {
        Text(store.displayName.prefix(1).uppercased())
            .font(.system(size: 30, weight: .black, design: .rounded))
            .foregroundColor(.white)
    }

    private func formatYear(_ dateString: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
        if let date = formatter.date(from: dateString) {
            let yf = DateFormatter(); yf.dateFormat = "yyyy"
            return "Since \(yf.string(from: date))"
        }
        return dateString
    }
}

// MARK: - Backwards-compat alias
typealias StoreCardView = PremiumStoreCard

// MARK: - ViewModel
class StoresViewModel: ObservableObject {
    @Published var stores: [Store] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    func loadStores() async {
        await MainActor.run { isLoading = true }
        do {
            let result = try await APIService.shared.getStores()
            await MainActor.run { stores = result; isLoading = false }
        } catch {
            await MainActor.run { errorMessage = error.localizedDescription; isLoading = false }
        }
    }
}

#Preview {
    StoresListView()
        .environmentObject(AuthViewModel())
}
