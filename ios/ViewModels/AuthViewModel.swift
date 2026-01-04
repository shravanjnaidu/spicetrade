//
//  AuthViewModel.swift
//  SpiceTrade
//

import Foundation
import SwiftUI

@MainActor
class AuthViewModel: ObservableObject {
    @Published var currentUser: User?
    @Published var isAuthenticated = false
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let userDefaultsKey = "spicetrade_user"
    
    init() {
        loadUserFromStorage()
    }
    
    private func loadUserFromStorage() {
        if let userData = UserDefaults.standard.data(forKey: userDefaultsKey),
           let user = try? JSONDecoder().decode(User.self, from: userData) {
            self.currentUser = user
            self.isAuthenticated = true
        }
    }
    
    private func saveUserToStorage(_ user: User) {
        if let encoded = try? JSONEncoder().encode(user) {
            UserDefaults.standard.set(encoded, forKey: userDefaultsKey)
        }
    }
    
    func login(email: String, password: String) async {
        isLoading = true
        errorMessage = nil
        
        do {
            let user = try await APIService.shared.login(email: email, password: password)
            self.currentUser = user
            self.isAuthenticated = true
            saveUserToStorage(user)
        } catch {
            errorMessage = error.localizedDescription
        }
        
        isLoading = false
    }
    
    func signup(
        name: String,
        email: String,
        password: String,
        phone: String?,
        role: String,
        location: String? = nil,
        storeName: String? = nil,
        businessType: String? = nil,
        categories: String? = nil,
        address: String? = nil,
        website: String? = nil
    ) async {
        isLoading = true
        errorMessage = nil
        
        do {
            let user = try await APIService.shared.signup(
                name: name,
                email: email,
                password: password,
                phone: phone,
                role: role,
                location: location,
                storeName: storeName,
                businessType: businessType,
                categories: categories,
                address: address,
                website: website
            )
            self.currentUser = user
            self.isAuthenticated = true
            saveUserToStorage(user)
        } catch {
            errorMessage = error.localizedDescription
        }
        
        isLoading = false
    }
    
    func logout() {
        currentUser = nil
        isAuthenticated = false
        UserDefaults.standard.removeObject(forKey: userDefaultsKey)
    }
    
    func updateUser(_ user: User) {
        self.currentUser = user
        saveUserToStorage(user)
    }
}
