//
//  APIConfig.swift
//  SpiceTrade
//
//  Single source of truth for the API base URL.
//
//  • Real device (simulator or phone) → always uses https://bigspice.in
//  • To override during local dev, set SPICETRADE_API_URL in the Xcode
//    scheme's Environment Variables (Product → Scheme → Edit Scheme → Run → Arguments)
//    e.g. SPICETRADE_API_URL = http://192.168.1.10:3000
//

import Foundation

enum APIConfig {
    /// Base URL used by every API call and image URL builder.
    /// Priority: environment variable → Info.plist key → hardcoded default.
    static let baseURL: String = {
        // 1. Runtime environment variable (useful for local dev / CI)
        if let env = ProcessInfo.processInfo.environment["SPICETRADE_API_URL"],
           !env.isEmpty {
            return env.hasSuffix("/") ? String(env.dropLast()) : env
        }

        // 2. Info.plist key "SpiceTradeAPIURL" (set per build configuration)
        if let plist = Bundle.main.object(forInfoDictionaryKey: "SpiceTradeAPIURL") as? String,
           !plist.isEmpty, plist != "$(SPICETRADE_API_URL)" {
            return plist.hasSuffix("/") ? String(plist.dropLast()) : plist
        }

        // 3. Default — production server
        return "https://bigspice.in"
    }()
}

