//
//  ProfileView.swift
//  SpiceTrade
//

import SwiftUI
import PhotosUI

struct ProfileView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var showEditProfile = false
    
    var body: some View {
        NavigationStack {
            List {
                Section {
                    HStack(spacing: 16) {
                        // Profile picture
                        if let profilePicture = authViewModel.currentUser?.profilePicture {
                            AsyncImage(url: URL(string: "\(APIConfig.baseURL)\(profilePicture)?v=\(Date().timeIntervalSince1970)")) { phase in
                                switch phase {
                                case .success(let image):
                                    image
                                        .resizable()
                                        .scaledToFill()
                                default:
                                    Image(systemName: "person.circle.fill")
                                        .resizable()
                                }
                            }
                            .frame(width: 80, height: 80)
                            .clipShape(Circle())
                            .id(profilePicture)
                        } else if let logo = authViewModel.currentUser?.logo {
                            AsyncImage(url: URL(string: "\(APIConfig.baseURL)\(logo)")) { phase in
                                switch phase {
                                case .success(let image):
                                    image
                                        .resizable()
                                        .scaledToFill()
                                default:
                                    Image(systemName: "storefront.circle.fill")
                                        .resizable()
                                }
                            }
                            .frame(width: 80, height: 80)
                            .clipShape(Circle())
                        } else {
                            Image(systemName: authViewModel.currentUser?.isSeller == true ? "storefront.circle.fill" : "person.circle.fill")
                                .resizable()
                                .frame(width: 80, height: 80)
                                .foregroundColor(.orange)
                        }
                        
                        VStack(alignment: .leading, spacing: 6) {
                            Text(authViewModel.currentUser?.name ?? "User")
                                .font(.title2)
                                .fontWeight(.bold)
                            
                            if let email = authViewModel.currentUser?.email {
                                Text(email)
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            }
                            
                            if let role = authViewModel.currentUser?.role {
                                Text(role.capitalized)
                                    .font(.caption)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(Color.orange.opacity(0.2))
                                    .foregroundColor(.orange)
                                    .cornerRadius(6)
                            }
                        }
                    }
                    .padding(.vertical, 8)
                }
                
                if authViewModel.currentUser?.isSeller == true {
                    Section("Store Information") {
                        if let storeName = authViewModel.currentUser?.storeName {
                            InfoRow(label: "Store Name", value: storeName)
                        }
                        if let businessType = authViewModel.currentUser?.businessType {
                            InfoRow(label: "Business Type", value: businessType)
                        }
                        if let categories = authViewModel.currentUser?.categories {
                            InfoRow(label: "Categories", value: categories)
                        }
                        if let address = authViewModel.currentUser?.address {
                            InfoRow(label: "Address", value: address)
                        }
                        if let website = authViewModel.currentUser?.website {
                            InfoRow(label: "Website", value: website)
                        }
                    }

                    // Extended store profile
                    let user = authViewModel.currentUser
                    let hasExtended = [user?.tagline, user?.storeDescription, user?.ownerMessage,
                                       user?.yearEstablished, user?.employeeCount, user?.annualTurnover,
                                       user?.paymentModes, user?.exportMarkets, user?.certifications, user?.whyUs]
                        .contains { $0 != nil && !($0!.isEmpty) }
                    if hasExtended {
                        Section("Extended Store Profile") {
                            if let v = user?.tagline, !v.isEmpty            { InfoRow(label: "Tagline", value: v) }
                            if let v = user?.storeDescription, !v.isEmpty  { InfoRow(label: "Description", value: v) }
                            if let v = user?.ownerMessage, !v.isEmpty       { InfoRow(label: "Owner Message", value: v) }
                            if let v = user?.yearEstablished, !v.isEmpty    { InfoRow(label: "Est. Year", value: v) }
                            if let v = user?.employeeCount, !v.isEmpty      { InfoRow(label: "Employees", value: v) }
                            if let v = user?.annualTurnover, !v.isEmpty     { InfoRow(label: "Annual Turnover", value: v) }
                            if let v = user?.paymentModes, !v.isEmpty       { InfoRow(label: "Payment Modes", value: v) }
                            if let v = user?.exportMarkets, !v.isEmpty      { InfoRow(label: "Export Markets", value: v) }
                            if let v = user?.certifications, !v.isEmpty     { InfoRow(label: "Certifications", value: v) }
                            if let v = user?.whyUs, !v.isEmpty              { InfoRow(label: "Why Choose Us", value: v) }
                        }
                    }
                }
                
                Section("Account Information") {
                    if let phone = authViewModel.currentUser?.phone {
                        InfoRow(label: "Phone", value: phone)
                    }
                    
                    if let location = authViewModel.currentUser?.location {
                        InfoRow(label: "Location", value: location)
                    }
                    
                    if let uniqueId = authViewModel.currentUser?.uniqueId {
                        InfoRow(label: "User ID", value: uniqueId)
                    }
                }
                
                Section {
                    Button(action: { showEditProfile = true }) {
                        Label("Edit Profile", systemImage: "pencil")
                    }
                }
                
                Section {
                    Button(role: .destructive, action: { authViewModel.logout() }) {
                        Label("Log Out", systemImage: "rectangle.portrait.and.arrow.right")
                    }
                }
            }
            .navigationTitle("Profile")
            .sheet(isPresented: $showEditProfile) {
                EditProfileView()
            }
        }
    }
}

struct InfoRow: View {
    let label: String
    let value: String
    
    var body: some View {
        HStack {
            Text(label)
                .foregroundColor(.secondary)
            Spacer()
            Text(value)
                .multilineTextAlignment(.trailing)
        }
    }
}

struct EditProfileView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @Environment(\.dismiss) private var dismiss

    // Basic fields
    @State private var name = ""
    @State private var phone = ""
    @State private var location = ""
    @State private var storeName = ""
    @State private var businessType = ""
    @State private var address = ""

    // Extended seller fields
    @State private var tagline = ""
    @State private var storeDescription = ""
    @State private var ownerMessage = ""
    @State private var yearEstablished = ""
    @State private var employeeCount = ""
    @State private var annualTurnover = ""
    @State private var paymentModes = ""
    @State private var exportMarkets = ""
    @State private var certifications = ""
    @State private var whyUs = ""

    @State private var selectedImage: PhotosPickerItem?
    @State private var profileImage: UIImage?
    @State private var isSubmitting = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Form {
                // MARK: – Profile Picture
                Section("Profile Picture") {
                    HStack {
                        if let profileImage {
                            Image(uiImage: profileImage)
                                .resizable()
                                .scaledToFill()
                                .frame(width: 80, height: 80)
                                .clipShape(Circle())
                        } else if let pic = authViewModel.currentUser?.profilePicture {
                            AsyncImage(url: URL(string: "\(APIConfig.baseURL)\(pic)?v=\(Int(Date().timeIntervalSince1970))")) { phase in
                                switch phase {
                                case .success(let img): img.resizable().scaledToFill()
                                default: Image(systemName: "person.circle.fill").resizable()
                                }
                            }
                            .frame(width: 80, height: 80)
                            .clipShape(Circle())
                            .id(pic)
                        } else {
                            Image(systemName: "person.circle.fill")
                                .resizable()
                                .frame(width: 80, height: 80)
                                .foregroundColor(.gray)
                        }
                        Spacer()
                        PhotosPicker(selection: $selectedImage, matching: .images) {
                            Text("Change Photo")
                        }
                        .onChange(of: selectedImage) { _, newItem in loadImage(from: newItem) }
                    }
                }

                // MARK: – Personal Information
                Section("Personal Information") {
                    TextField("Name", text: $name)
                    TextField("Phone", text: $phone).keyboardType(.phonePad)
                    TextField("Location (City, State)", text: $location)
                }

                // MARK: – Store Information
                if authViewModel.currentUser?.isSeller == true {
                    Section("Store Information") {
                        TextField("Store Name", text: $storeName)
                        TextField("Business Type (e.g. Manufacturer)", text: $businessType)
                        TextField("Address", text: $address)
                    }

                    Section("Store Branding") {
                        TextField("Tagline (short description)", text: $tagline)
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Store Description").font(.caption).foregroundColor(.secondary)
                            TextEditor(text: $storeDescription)
                                .frame(minHeight: 80)
                        }
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Message from Owner").font(.caption).foregroundColor(.secondary)
                            TextEditor(text: $ownerMessage)
                                .frame(minHeight: 60)
                        }
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Why Choose Us").font(.caption).foregroundColor(.secondary)
                            TextEditor(text: $whyUs)
                                .frame(minHeight: 60)
                        }
                    }

                    Section("Business Details") {
                        TextField("Year Established (e.g. 2005)", text: $yearEstablished)
                            .keyboardType(.numberPad)
                        TextField("Employee Count (e.g. 50-100)", text: $employeeCount)
                        TextField("Annual Turnover (e.g. ₹5-10 Cr)", text: $annualTurnover)
                        TextField("Payment Modes (e.g. NEFT, UPI)", text: $paymentModes)
                        TextField("Export Markets (e.g. UAE, USA)", text: $exportMarkets)
                        TextField("Certifications (e.g. FSSAI, ISO)", text: $certifications)
                    }
                }

                if let errorMessage {
                    Section {
                        Text(errorMessage).foregroundColor(.red).font(.caption)
                    }
                }
            }
            .navigationTitle("Edit Profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(isSubmitting ? "Saving…" : "Save") { updateProfile() }
                        .disabled(isSubmitting)
                }
            }
        }
        .onAppear {
            guard let user = authViewModel.currentUser else { return }
            name             = user.name             ?? ""
            phone            = user.phone            ?? ""
            location         = user.location         ?? ""
            storeName        = user.storeName        ?? ""
            businessType     = user.businessType     ?? ""
            address          = user.address          ?? ""
            tagline          = user.tagline          ?? ""
            storeDescription = user.storeDescription ?? ""
            ownerMessage     = user.ownerMessage     ?? ""
            yearEstablished  = user.yearEstablished  ?? ""
            employeeCount    = user.employeeCount    ?? ""
            annualTurnover   = user.annualTurnover   ?? ""
            paymentModes     = user.paymentModes     ?? ""
            exportMarkets    = user.exportMarkets    ?? ""
            certifications   = user.certifications   ?? ""
            whyUs            = user.whyUs            ?? ""
        }
    }

    // MARK: – Helpers
    private func loadImage(from item: PhotosPickerItem?) {
        guard let item else { return }
        Task {
            if let data = try? await item.loadTransferable(type: Data.self),
               let img = UIImage(data: data) {
                await MainActor.run { profileImage = img }
            }
        }
    }

    private func updateProfile() {
        guard let userId = authViewModel.currentUser?.id else { return }
        isSubmitting = true
        errorMessage = nil

        Task {
            do {
                var updates: [String: Any] = [:]

                // Basic
                if !name.isEmpty             { updates["name"]         = name }
                if !phone.isEmpty            { updates["phone"]        = phone }
                if !location.isEmpty         { updates["location"]     = location }

                // Seller-only
                if authViewModel.currentUser?.isSeller == true {
                    if !storeName.isEmpty        { updates["storeName"]        = storeName }
                    if !businessType.isEmpty     { updates["businessType"]     = businessType }
                    if !address.isEmpty          { updates["address"]          = address }
                    if !tagline.isEmpty          { updates["tagline"]          = tagline }
                    if !storeDescription.isEmpty { updates["storeDescription"] = storeDescription }
                    if !ownerMessage.isEmpty     { updates["ownerMessage"]     = ownerMessage }
                    if !yearEstablished.isEmpty  { updates["yearEstablished"]  = yearEstablished }
                    if !employeeCount.isEmpty    { updates["employeeCount"]    = employeeCount }
                    if !annualTurnover.isEmpty   { updates["annualTurnover"]   = annualTurnover }
                    if !paymentModes.isEmpty     { updates["paymentModes"]     = paymentModes }
                    if !exportMarkets.isEmpty    { updates["exportMarkets"]    = exportMarkets }
                    if !certifications.isEmpty   { updates["certifications"]   = certifications }
                    if !whyUs.isEmpty            { updates["whyUs"]            = whyUs }
                }

                // Photo upload
                if let profileImage {
                    let imageUrl = try await APIService.shared.uploadImage(profileImage)
                    updates["profilePicture"] = imageUrl
                }

                let updatedUser = try await APIService.shared.updateProfile(userId: userId, updates: updates)
                authViewModel.updateUser(updatedUser)
                dismiss()
            } catch {
                errorMessage = error.localizedDescription
            }
            isSubmitting = false
        }
    }
}

#Preview {
    ProfileView()
        .environmentObject(AuthViewModel())
}
