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
                            AsyncImage(url: URL(string: "http://localhost:3000\(profilePicture)")) { phase in
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
                        } else if let logo = authViewModel.currentUser?.logo {
                            AsyncImage(url: URL(string: "http://localhost:3000\(logo)")) { phase in
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
    
    @State private var name: String
    @State private var phone: String
    @State private var location: String
    @State private var storeName: String
    @State private var businessType: String
    @State private var address: String
    
    @State private var selectedImage: PhotosPickerItem?
    @State private var profileImage: UIImage?
    @State private var isSubmitting = false
    @State private var errorMessage: String?
    
    init() {
        let user = AuthViewModel().currentUser // Temporary workaround
        _name = State(initialValue: user?.name ?? "")
        _phone = State(initialValue: user?.phone ?? "")
        _location = State(initialValue: user?.location ?? "")
        _storeName = State(initialValue: user?.storeName ?? "")
        _businessType = State(initialValue: user?.businessType ?? "")
        _address = State(initialValue: user?.address ?? "")
    }
    
    var body: some View {
        NavigationStack {
            Form {
                Section("Profile Picture") {
                    HStack {
                        if let profileImage = profileImage {
                            Image(uiImage: profileImage)
                                .resizable()
                                .scaledToFill()
                                .frame(width: 80, height: 80)
                                .clipShape(Circle())
                        } else if let profilePicture = authViewModel.currentUser?.profilePicture {
                            AsyncImage(url: URL(string: "http://localhost:3000\(profilePicture)")) { phase in
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
                        .onChange(of: selectedImage) { _, newItem in
                            loadImage(from: newItem)
                        }
                    }
                }
                
                Section("Personal Information") {
                    TextField("Name", text: $name)
                    TextField("Phone", text: $phone)
                        .keyboardType(.phonePad)
                    TextField("Location", text: $location)
                }
                
                if authViewModel.currentUser?.isSeller == true {
                    Section("Store Information") {
                        TextField("Store Name", text: $storeName)
                        TextField("Business Type", text: $businessType)
                        TextField("Address", text: $address)
                    }
                }
                
                if let errorMessage = errorMessage {
                    Section {
                        Text(errorMessage)
                            .foregroundColor(.red)
                            .font(.caption)
                    }
                }
            }
            .navigationTitle("Edit Profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        updateProfile()
                    }
                    .disabled(isSubmitting)
                }
            }
        }
        .onAppear {
            // Update state with current user data
            if let user = authViewModel.currentUser {
                name = user.name ?? ""
                phone = user.phone ?? ""
                location = user.location ?? ""
                storeName = user.storeName ?? ""
                businessType = user.businessType ?? ""
                address = user.address ?? ""
            }
        }
    }
    
    private func loadImage(from item: PhotosPickerItem?) {
        guard let item = item else { return }
        
        Task {
            if let data = try? await item.loadTransferable(type: Data.self),
               let image = UIImage(data: data) {
                await MainActor.run {
                    profileImage = image
                }
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
                
                if !name.isEmpty {
                    updates["name"] = name
                }
                if !phone.isEmpty {
                    updates["phone"] = phone
                }
                if !location.isEmpty {
                    updates["location"] = location
                }
                
                if authViewModel.currentUser?.isSeller == true {
                    if !storeName.isEmpty {
                        updates["storeName"] = storeName
                    }
                    if !businessType.isEmpty {
                        updates["businessType"] = businessType
                    }
                    if !address.isEmpty {
                        updates["address"] = address
                    }
                }
                
                // Upload profile picture if changed
                if let profileImage = profileImage {
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
