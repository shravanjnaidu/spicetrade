//
//  StoresListView.swift
//  SpiceTrade
//

import SwiftUI

struct StoresListView: View {
    @StateObject private var viewModel = StoresViewModel()
    @State private var searchText = ""
    
    var filteredStores: [Store] {
        if searchText.isEmpty {
            return viewModel.stores
        } else {
            return viewModel.stores.filter { store in
                let name = store.displayName.localizedCaseInsensitiveContains(searchText)
                let business = store.businessType?.localizedCaseInsensitiveContains(searchText) ?? false
                let category = store.categories?.localizedCaseInsensitiveContains(searchText) ?? false
                return name || business || category
            }
        }
    }
    
    var body: some View {
        NavigationStack {
            ZStack {
                if viewModel.isLoading {
                    ProgressView("Loading stores...")
                } else if viewModel.stores.isEmpty {
                    emptyState
                } else {
                    ScrollView {
                        LazyVStack(spacing: 16) {
                            ForEach(filteredStores) { store in
                                NavigationLink(destination: StoreDetailView(store: store)) {
                                    StoreCardView(store: store)
                                }
                                .buttonStyle(PlainButtonStyle())
                            }
                        }
                        .padding()
                    }
                    .refreshable {
                        await viewModel.loadStores()
                    }
                }
            }
            .navigationTitle("Stores")
            .searchable(text: $searchText, prompt: "Search stores...")
            .task {
                if viewModel.stores.isEmpty {
                    await viewModel.loadStores()
                }
            }
        }
    }
    
    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "storefront")
                .font(.system(size: 60))
                .foregroundColor(.gray)
            
            Text("No Stores Available")
                .font(.title3)
                .fontWeight(.semibold)
            
            Text("Check back later for new stores")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
    }
}

struct StoreCardView: View {
    let store: Store
    
    var body: some View {
        HStack(spacing: 16) {
            // Store Logo
            if let logoPath = store.logo {
                AsyncImage(url: URL(string: "http://localhost:3000\(logoPath)")) { phase in
                    switch phase {
                    case .success(let image):
                        image
                            .resizable()
                            .scaledToFill()
                    default:
                        storePlaceholder
                    }
                }
                .frame(width: 80, height: 80)
                .clipShape(RoundedRectangle(cornerRadius: 12))
            } else {
                storePlaceholder
            }
            
            // Store Info
            VStack(alignment: .leading, spacing: 6) {
                Text(store.displayName)
                    .font(.headline)
                    .foregroundColor(.primary)
                
                if let businessType = store.businessType {
                    HStack(spacing: 4) {
                        Image(systemName: "briefcase.fill")
                            .font(.caption)
                            .foregroundColor(.orange)
                        Text(businessType)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                }
                
                if let categories = store.categories {
                    HStack(spacing: 4) {
                        Image(systemName: "tag.fill")
                            .font(.caption)
                            .foregroundColor(.orange)
                        Text(categories)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                }
                
                if let createdAt = store.createdAt {
                    HStack(spacing: 4) {
                        Image(systemName: "calendar")
                            .font(.caption)
                            .foregroundColor(.gray)
                        Text("Member since \(formatYear(createdAt))")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(.gray)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
    }
    
    private var storePlaceholder: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 12)
                .fill(LinearGradient(
                    gradient: Gradient(colors: [.orange.opacity(0.7), .orange]),
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                ))
                .frame(width: 80, height: 80)
            
            Text(store.displayName.prefix(1).uppercased())
                .font(.system(size: 32, weight: .bold))
                .foregroundColor(.white)
        }
    }
    
    private func formatYear(_ dateString: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
        if let date = formatter.date(from: dateString) {
            let yearFormatter = DateFormatter()
            yearFormatter.dateFormat = "yyyy"
            return yearFormatter.string(from: date)
        }
        return dateString
    }
}

// MARK: - ViewModel
class StoresViewModel: ObservableObject {
    @Published var stores: [Store] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    func loadStores() async {
        isLoading = true
        do {
            stores = try await APIService.shared.getStores()
        } catch {
            errorMessage = error.localizedDescription
            print("Error loading stores: \(error)")
        }
        isLoading = false
    }
}

#Preview {
    StoresListView()
        .environmentObject(AuthViewModel())
}
