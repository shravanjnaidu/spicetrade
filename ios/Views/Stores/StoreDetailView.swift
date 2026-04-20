//
//  StoreDetailView.swift
//  SpiceTrade
//

import SwiftUI

struct StoreDetailView: View {
    let store: Store
    @EnvironmentObject var authViewModel: AuthViewModel
    @StateObject private var viewModel = StoreDetailViewModel()
    @State private var showContactStore = false

    var profile: PublicProfile? { viewModel.profile }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                bannerSection
                if viewModel.isLoading {
                    ProgressView().frame(maxWidth: .infinity).padding(.top, 40)
                } else {
                    storeContentSection
                }
                Spacer(minLength: 100)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .safeAreaInset(edge: .bottom) {
            if shouldShowContactButton {
                Button(action: { showContactStore = true }) {
                    Text("Contact Store").font(.headline).foregroundColor(.white)
                        .frame(maxWidth: .infinity).padding()
                        .background(Color.orange).cornerRadius(12)
                }
                .padding()
                .background(Color(.systemBackground))
                .shadow(radius: 3)
            }
        }
        .sheet(isPresented: $showContactStore) {
            if let currentUser = authViewModel.currentUser {
                ContactSellerView(
                    buyerId: currentUser.id,
                    sellerId: store.id,
                    listingId: 0,
                    sellerName: profile?.displayName ?? store.displayName
                )
            }
        }
        .task {
            await viewModel.load(storeId: store.id)
            await APIService.shared.incrementStoreView(storeId: store.id)
        }
    }

    // MARK: – Banner

    private var bannerSection: some View {
        ZStack(alignment: .bottomLeading) {
            LinearGradient(
                gradient: Gradient(colors: [Color(red: 0.6, green: 0.2, blue: 0.0), .orange]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .frame(height: 220)

            HStack(spacing: 20) {
                let logoPath = profile?.logo ?? store.logo
                if let logoPath {
                    AsyncImage(url: APIConfig.imageURL(logoPath).flatMap { URL(string: $0) }) { phase in
                        switch phase {
                        case .success(let image): image.resizable().scaledToFill()
                        default: storePlaceholder
                        }
                    }
                    .frame(width: 100, height: 100)
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.white.opacity(0.4), lineWidth: 3))
                } else {
                    storePlaceholder
                }

                VStack(alignment: .leading, spacing: 6) {
                    Text(profile?.displayName ?? store.displayName)
                        .font(.title2).fontWeight(.bold).foregroundColor(.white)

                    if let tagline = profile?.tagline, !tagline.isEmpty {
                        Text(tagline).font(.subheadline).foregroundColor(.white.opacity(0.85)).lineLimit(2)
                    } else if let bt = profile?.businessType ?? store.businessType {
                        Text(bt).font(.subheadline).foregroundColor(.white.opacity(0.85))
                    }

                    HStack(spacing: 6) {
                        if let views = store.storeViews, views > 0 {
                            Label("\(views) views", systemImage: "eye.fill")
                                .font(.caption).foregroundColor(.white.opacity(0.8))
                        }
                        if let uid = profile?.uniqueId {
                            Text("ID: \(uid)").font(.caption2).foregroundColor(.white.opacity(0.7))
                        }
                    }
                }
                Spacer()
            }
            .padding(24)
        }
    }

    // MARK: – Main Content

    private var storeContentSection: some View {
        VStack(alignment: .leading, spacing: 0) {
            ownerMessageSection
            descriptionSection
            businessDetailsSection
            contactSection
            productsSection
        }
    }

    private var ownerMessageSection: some View {
        Group {
            if let msg = profile?.ownerMessage, !msg.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Label("A Message from the Owner", systemImage: "quote.bubble.fill")
                        .font(.headline).padding(.horizontal).padding(.top, 20)
                    Text(msg)
                        .font(.body).foregroundColor(.secondary)
                        .padding()
                        .background(Color.orange.opacity(0.08))
                        .cornerRadius(12)
                        .padding(.horizontal)
                }
            }
        }
    }

    private var descriptionSection: some View {
        Group {
            if let desc = profile?.storeDescription, !desc.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("About This Store").font(.headline).padding(.horizontal).padding(.top, 20)
                    Text(desc).font(.body).foregroundColor(.secondary).padding(.horizontal)
                }
            }
        }
    }

    private var businessDetailsSection: some View {
        let rows = businessDetailRows()
        return Group {
            if !rows.isEmpty {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Business Details")
                        .font(.headline).padding(.horizontal).padding(.top, 20)
                    VStack(spacing: 0) {
                        ForEach(Array(rows.enumerated()), id: \.offset) { idx, pair in
                            InfoRowView(label: pair.0, value: pair.1)
                            if idx < rows.count - 1 {
                                Divider().padding(.leading, 16)
                            }
                        }
                    }
                    .background(Color(.systemBackground))
                    .cornerRadius(12)
                    .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
                    .padding(.horizontal)
                }
            }
        }
    }

    private func businessDetailRows() -> [(String, String)] {
        let raw: [(String, String?)] = [
            ("Business Type",    profile?.businessType ?? store.businessType),
            ("Category",         profile?.categories   ?? store.categories),
            ("Year Established", profile?.yearEstablished),
            ("Employees",        profile?.employeeCount),
            ("Annual Turnover",  profile?.annualTurnover),
            ("Payment Modes",    profile?.paymentModes),
            ("Export Markets",   profile?.exportMarkets),
            ("Certifications",   profile?.certifications),
            ("Why Us",           profile?.whyUs),
            ("Member Since",     (profile?.createdAt ?? store.createdAt).map { formatDate($0) }),
        ]
        return raw.compactMap { (k, v) in
            guard let v = v, !v.isEmpty else { return nil }
            return (k, v)
        }
    }

    private var contactSection: some View {
        let email   = profile?.email   ?? store.email
        let address = profile?.address ?? store.address
        let website = profile?.website ?? store.website
        let phone   = profile?.phone
        let hasAny  = email != nil || address != nil || website != nil || phone != nil
        return Group {
            if hasAny {
                contactInfoCard(email: email, phone: phone, address: address, website: website)
            }
        }
    }

    private func contactInfoCard(email: String?, phone: String?, address: String?, website: String?) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Contact Information")
                .font(.headline).padding(.horizontal).padding(.top, 20)
            VStack(spacing: 0) {
                if let email = email {
                    InfoRowView(label: "Email", value: email)
                    Divider().padding(.leading, 16)
                }
                if let phone = phone {
                    InfoRowView(label: "Phone", value: phone)
                    Divider().padding(.leading, 16)
                }
                if let address = address {
                    InfoRowView(label: "Address", value: address)
                    if website != nil { Divider().padding(.leading, 16) }
                }
                if let website = website {
                    HStack {
                        Text("Website").font(.subheadline).foregroundColor(.secondary)
                        Spacer()
                        Link(destination: URL(string: website) ?? URL(string: "https://spicetrade.in")!) {
                            Text("Visit →").font(.subheadline).foregroundColor(.orange)
                        }
                    }
                    .padding()
                }
            }
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
            .padding(.horizontal)
        }
    }

    private var productsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Products & Services").font(.headline).padding(.horizontal).padding(.top, 20)
            if viewModel.products.isEmpty {
                Text("This store hasn't listed any products yet.")
                    .font(.subheadline).foregroundColor(.secondary)
                    .padding().frame(maxWidth: .infinity)
                    .background(Color(.systemGray6)).cornerRadius(12)
                    .padding(.horizontal)
            } else {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 16) {
                        ForEach(viewModel.products) { product in
                            NavigationLink(destination: ProductDetailView(product: product)) {
                                StoreProductCard(product: product)
                            }
                        }
                    }
                    .padding(.horizontal)
                }
            }
        }
    }

    private var storePlaceholder: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 16).fill(Color.white.opacity(0.2)).frame(width: 100, height: 100)
            Text((profile?.displayName ?? store.displayName).prefix(1).uppercased())
                .font(.system(size: 40, weight: .bold)).foregroundColor(.white)
        }
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.white.opacity(0.3), lineWidth: 3))
    }

    private var shouldShowContactButton: Bool {
        guard let user = authViewModel.currentUser else { return false }
        return user.id != store.id
    }

    private func formatDate(_ s: String) -> String {
        let fmts = ["yyyy-MM-dd HH:mm:ss", "yyyy-MM-dd'T'HH:mm:ss", "yyyy-MM-dd"]
        let out = DateFormatter(); out.dateStyle = .long; out.timeStyle = .none
        for fmt in fmts {
            let df = DateFormatter(); df.dateFormat = fmt
            if let d = df.date(from: s) { return out.string(from: d) }
        }
        return s
    }
}

// MARK: - Shared sub-views

struct InfoRowView: View {
    let label: String
    let value: String
    var body: some View {
        HStack(alignment: .top) {
            Text(label).font(.subheadline).foregroundColor(.secondary).frame(width: 140, alignment: .leading)
            Spacer()
            Text(value).font(.subheadline).foregroundColor(.primary).multilineTextAlignment(.trailing)
        }
        .padding()
    }
}

struct StoreProductCard: View {
    let product: Product
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            if let imageUrl = product.imageURLs.first {
                AsyncImage(url: URL(string: product.fullImageURL(for: imageUrl))) { phase in
                    switch phase {
                    case .success(let image): image.resizable().scaledToFill()
                    default: Rectangle().fill(Color.gray.opacity(0.2)).overlay(Image(systemName: "photo").foregroundColor(.gray))
                    }
                }
                .frame(width: 150, height: 150).clipShape(RoundedRectangle(cornerRadius: 12))
            } else {
                Rectangle().fill(Color.gray.opacity(0.2))
                    .frame(width: 150, height: 150).clipShape(RoundedRectangle(cornerRadius: 12))
                    .overlay(Image(systemName: "photo").foregroundColor(.gray))
            }

            if product.isRequirement {
                Text("REQUIREMENT").font(.caption2).fontWeight(.bold).foregroundColor(.white)
                    .padding(.horizontal, 6).padding(.vertical, 2).background(Color.blue).cornerRadius(4)
            }

            Text(product.title).font(.subheadline).fontWeight(.medium).foregroundColor(.primary)
                .lineLimit(2).frame(width: 150, alignment: .leading)

            if let rc = product.reviewCount, rc > 0 {
                HStack(spacing: 2) {
                    let stars = Int(round(product.averageRating ?? 0))
                    ForEach(0..<5) { i in
                        Image(systemName: i < stars ? "star.fill" : "star").font(.caption2).foregroundColor(.orange)
                    }
                    Text("(\(rc))").font(.caption2).foregroundColor(.secondary)
                }
            }
            Text(product.priceText).font(.subheadline).fontWeight(.semibold).foregroundColor(.orange)
        }
        .frame(width: 150)
    }
}

// MARK: - ViewModel

class StoreDetailViewModel: ObservableObject {
    @Published var profile: PublicProfile?
    @Published var products: [Product] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    func load(storeId: Int) async {
        await MainActor.run { isLoading = true }
        do {
            let p = try await APIService.shared.getPublicProfile(userId: storeId)
            await MainActor.run {
                profile = p
                products = p.products ?? []
                isLoading = false
            }
        } catch {
            do {
                let prods = try await APIService.shared.getStoreProducts(sellerId: storeId)
                await MainActor.run { products = prods }
            } catch {}
            await MainActor.run { errorMessage = error.localizedDescription; isLoading = false }
        }
    }
}

#Preview {
    NavigationStack {
        StoreDetailView(store: Store(
            id: 1, name: "Priya Spices", email: "priya@example.com",
            storeName: "Priya's Spice Emporium", businessType: "Wholesale",
            categories: "Spices & Herbs", address: "Mumbai, India",
            website: "https://example.com", logo: nil,
            createdAt: "2024-01-01 00:00:00", storeViews: 120
        ))
    }
    .environmentObject(AuthViewModel())
}
