//
//  SpiceTradeApp.swift
//  SpiceTrade
//
//  A complete iOS marketplace app with buyer-seller functionality
//

import SwiftUI

@main
struct SpiceTradeApp: App {
    @StateObject private var authViewModel = AuthViewModel()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authViewModel)
        }
    }
}
