//
//  SpiceTradeApp.swift
//  SpiceTrade
//
//  A complete iOS marketplace app with buyer-seller functionality
//

import SwiftUI
import UserNotifications

@main
struct SpiceTradeApp: App {
    @StateObject private var authViewModel = AuthViewModel()

    init() {
        requestNotificationPermission()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authViewModel)
                .onReceive(
                    NotificationCenter.default.publisher(for: Notification.Name("FCMTokenReceived"))
                ) { notification in
                    guard let token = notification.object as? String else { return }
                    // Persist so AuthViewModel can read it after login
                    UserDefaults.standard.set(token, forKey: "fcm_device_token")
                    guard let userId = authViewModel.currentUser?.id else { return }
                    Task {
                        try? await APIService.shared.registerDeviceToken(userId: userId, token: token)
                    }
                }
        }
    }

    private func requestNotificationPermission() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, _ in
            if granted {
                DispatchQueue.main.async {
                    UIApplication.shared.registerForRemoteNotifications()
                }
            }
        }
    }
}
