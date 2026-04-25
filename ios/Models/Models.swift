//
//  Models.swift
//  SpiceTrade
//

import Foundation

// MARK: - User Model
struct User: Codable, Identifiable {
    let id: Int
    var name: String?
    var email: String
    var phone: String?
    var role: String? // "buyer" or "seller"
    var storeName: String?
    var businessType: String?
    var categories: String?
    var address: String?
    var website: String?
    var logo: String?
    var uniqueId: String?
    var location: String?
    var profilePicture: String?
    var createdAt: String?
    // Extended store-profile fields
    var tagline: String?
    var storeDescription: String?
    var ownerMessage: String?
    var yearEstablished: String?
    var employeeCount: String?
    var annualTurnover: String?
    var paymentModes: String?
    var exportMarkets: String?
    var certifications: String?
    var whyUs: String?

    var isSeller: Bool {
        role == "seller"
    }

    var isBuyer: Bool {
        role == "buyer"
    }
}

// MARK: - Auth Response
struct AuthResponse: Codable {
    let success: Bool
    let userId: Int?
    let id: Int?
    let name: String?
    let email: String?
    let phone: String?
    let role: String?
    let storeName: String?
    let businessType: String?
    let categories: String?
    let address: String?
    let website: String?
    let logo: String?
    let uniqueId: String?
    let location: String?
    let profilePicture: String?
    let error: String?
    /// JWT issued by the backend — store and attach as `Authorization: Bearer <token>`
    let token: String?
    // Extended store-profile fields
    let tagline: String?
    let storeDescription: String?
    let ownerMessage: String?
    let yearEstablished: String?
    let employeeCount: String?
    let annualTurnover: String?
    let paymentModes: String?
    let exportMarkets: String?
    let certifications: String?
    let whyUs: String?
}

// MARK: - Product/Ad Model
struct Product: Codable, Identifiable {
    let id: Int
    var title: String
    var description: String
    var userId: Int?
    var createdAt: String?
    var author: String?
    var storeName: String?
    var role: String?
    var profilePicture: String?
    var category: String?
    var tags: [String]?
    var price: Double?
    var unit: String?
    var minOrder: Int?
    var stock: Int?
    var imageUrl: String?
    var images: String?
    var verified: Int?
    var views: Int?
    var reviewCount: Int?
    var averageRating: Double?
    /// "product" or "requirement" — mirrors the web app's listingType field
    var listingType: String?

    var isRequirement: Bool {
        listingType == "requirement"
    }

    var imageURLs: [String] {
        if let images = images, !images.isEmpty {
            return images.components(separatedBy: ",").filter { !$0.isEmpty }
        } else if let imageUrl = imageUrl {
            return [imageUrl]
        }
        return []
    }

    /// Returns full URLs for images, ensuring they have the correct format
    func fullImageURL(for imagePath: String) -> String {
        if imagePath.hasPrefix("http://") || imagePath.hasPrefix("https://") {
            return imagePath
        }
        if imagePath.hasPrefix("/uploads/") {
            return "\(APIConfig.baseURL)\(imagePath)"
        }
        if !imagePath.hasPrefix("/") {
            return "\(APIConfig.baseURL)/uploads/\(imagePath)"
        }
        return "\(APIConfig.baseURL)\(imagePath)"
    }

    var priceText: String {
        if let price = price, price > 0 {
            return "₹\(String(format: "%.2f", price))\(unit != nil ? "/\(unit!)" : "")"
        }
        return "Price on request"
    }
}

// MARK: - Product Response
struct ProductResponse: Codable {
    let success: Bool
    let id: Int?
    let title: String?
    let description: String?
    let userId: Int?
    let createdAt: String?
    let author: String?
    let category: String?
    let tags: [String]?
    let price: Double?
    let unit: String?
    let minOrder: Int?
    let stock: Int?
    let imageUrl: String?
    let verified: Int?
    let error: String?
}

// MARK: - Conversation Model
struct Conversation: Codable, Identifiable {
    let id: Int
    let buyerId: Int
    let sellerId: Int
    let listingId: Int?
    let createdAt: String
    let buyerName: String?
    let buyerEmail: String?
    let buyerPicture: String?
    let sellerName: String?
    let sellerEmail: String?
    let sellerPicture: String?
    let storeName: String?
    let lastMessage: String?
    let lastMessageTime: String?
    let unreadCount: Int?
}

// MARK: - Message Model
struct Message: Codable, Identifiable {
    let id: Int
    let conversationId: Int
    let senderId: Int
    let message: String
    let createdAt: String
    let senderName: String?
    let senderEmail: String?
    let senderPicture: String?
}

// MARK: - Wishlist Item
struct WishlistItem: Codable, Identifiable {
    let wishlistId: Int
    let addedAt: String
    let id: Int
    let title: String
    let description: String
    let userId: Int?
    let createdAt: String?
    let author: String?
    let storeName: String?
    let role: String?
    let profilePicture: String?
    let category: String?
    let tags: [String]?
    let price: Double?
    let unit: String?
    let minOrder: Int?
    let stock: Int?
    let imageUrl: String?
    
    var product: Product {
        Product(
            id: id,
            title: title,
            description: description,
            userId: userId,
            createdAt: createdAt,
            author: author,
            storeName: storeName,
            role: role,
            profilePicture: profilePicture,
            category: category,
            tags: tags,
            price: price,
            unit: unit,
            minOrder: minOrder,
            stock: stock,
            imageUrl: imageUrl,
            images: nil,
            verified: nil,
            views: nil
        )
    }
}

// MARK: - Review Model
struct Review: Codable, Identifiable {
    let id: Int
    let adId: Int
    let userId: Int
    let rating: Int
    let reviewText: String?
    let createdAt: String
    let userName: String?
    let profilePicture: String?
}

// MARK: - Review Stats
struct ReviewStats: Codable {
    let totalReviews: Int
    let averageRating: Double
    let fiveStars: Int
    let fourStars: Int
    let threeStars: Int
    let twoStars: Int
    let oneStar: Int
}

// MARK: - Generic Response
struct GenericResponse: Codable {
    let success: Bool
    let error: String?
    let message: String?
}

// MARK: - Upload Response
struct UploadResponse: Codable {
    let success: Bool
    let url: String?
    let urls: [String]?
    let error: String?
}

// MARK: - Wishlist Check Response
struct WishlistCheckResponse: Codable {
    let inWishlist: Bool
    let wishlistId: Int?
}

// MARK: - Unread Count Response
struct UnreadCountResponse: Codable {
    let unreadCount: Int
}

// MARK: - Conversation Response
struct ConversationResponse: Codable {
    let success: Bool
    let conversationId: Int?
    let error: String?
}

// MARK: - Review Add Response
struct ReviewAddResponse: Codable {
    let success: Bool
    let reviewId: Int?
    let message: String?
}

// MARK: - Can Review Response
struct CanReviewResponse: Codable {
    let canReview: Bool
    let reason: String?
}

// MARK: - Store Model
struct Store: Codable, Identifiable {
    let id: Int
    let name: String?
    let email: String?
    let storeName: String?
    let businessType: String?
    let categories: String?
    let address: String?
    let website: String?
    let logo: String?
    let createdAt: String?
    let storeViews: Int?

    var displayName: String {
        storeName ?? name ?? "Store"
    }
}

// MARK: - Public Profile (full seller profile from /api/user/public/:id)
struct PublicProfile: Codable {
    let id: Int
    let name: String?
    let email: String?
    let phone: String?
    let role: String?
    let storeName: String?
    let businessType: String?
    let categories: String?
    let address: String?
    let website: String?
    let logo: String?
    let uniqueId: String?
    let location: String?
    let profilePicture: String?
    let tagline: String?
    let storeDescription: String?
    let ownerMessage: String?
    let yearEstablished: String?
    let employeeCount: String?
    let annualTurnover: String?
    let paymentModes: String?
    let exportMarkets: String?
    let certifications: String?
    let whyUs: String?
    let createdAt: String?
    let products: [Product]?

    var displayName: String {
        storeName ?? name ?? "Store"
    }
}

// MARK: - Banner Ad Model
struct BannerAd: Codable, Identifiable {
    let id: Int
    let userId: Int?
    let title: String
    let description: String?
    let imageUrl: String
    let targetUrl: String
    let status: String?
    let createdAt: String?
    let expiresAt: String?
}
