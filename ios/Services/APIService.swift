//
//  APIService.swift
//  SpiceTrade
//

import Foundation
import SwiftUI

class APIService {
    static let shared = APIService()
    
    // Change this to your local machine's IP address when testing on real device
    // For simulator, localhost works fine
    private let baseURL = "http://localhost:3000"
    
    private init() {}
    
    // MARK: - Helper Methods
    
    private func makeRequest<T: Decodable>(
        endpoint: String,
        method: String = "GET",
        body: Data? = nil,
        responseType: T.Type
    ) async throws -> T {
        guard let url = URL(string: baseURL + endpoint) else {
            throw URLError(.badURL)
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if let body = body {
            request.httpBody = body
        }
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw URLError(.badServerResponse)
        }
        
        guard (200...299).contains(httpResponse.statusCode) else {
            // Try to decode error
            if let errorResponse = try? JSONDecoder().decode(GenericResponse.self, from: data) {
                throw NSError(domain: "APIError", code: httpResponse.statusCode, 
                            userInfo: [NSLocalizedDescriptionKey: errorResponse.error ?? "Unknown error"])
            }
            throw URLError(.badServerResponse)
        }
        
        let decoder = JSONDecoder()
        return try decoder.decode(T.self, from: data)
    }
    
    // MARK: - Authentication
    
    func signup(
        name: String,
        email: String,
        password: String,
        phone: String?,
        role: String,
        location: String?,
        storeName: String?,
        businessType: String?,
        categories: String?,
        address: String?,
        website: String?
    ) async throws -> User {
        let body: [String: Any?] = [
            "name": name,
            "email": email,
            "password": password,
            "phone": phone,
            "role": role,
            "location": location,
            "storeName": storeName,
            "businessType": businessType,
            "categories": categories,
            "address": address,
            "website": website
        ]
        
        let jsonData = try JSONSerialization.data(withJSONObject: body.compactMapValues { $0 })
        let response = try await makeRequest(endpoint: "/api/signup", method: "POST", body: jsonData, responseType: AuthResponse.self)
        
        guard response.success, let userId = response.userId ?? response.id else {
            throw NSError(domain: "APIError", code: -1, userInfo: [NSLocalizedDescriptionKey: response.error ?? "Signup failed"])
        }
        
        return User(
            id: userId,
            name: response.name,
            email: response.email ?? email,
            phone: response.phone,
            role: response.role,
            storeName: response.storeName,
            businessType: response.businessType,
            categories: response.categories,
            address: response.address,
            website: response.website,
            logo: response.logo,
            uniqueId: response.uniqueId,
            location: response.location,
            profilePicture: response.profilePicture
        )
    }
    
    func login(email: String, password: String) async throws -> User {
        let body: [String: String] = ["email": email, "password": password]
        let jsonData = try JSONEncoder().encode(body)
        let response = try await makeRequest(endpoint: "/api/login", method: "POST", body: jsonData, responseType: AuthResponse.self)
        
        guard response.success, let userId = response.userId ?? response.id else {
            throw NSError(domain: "APIError", code: -1, userInfo: [NSLocalizedDescriptionKey: response.error ?? "Login failed"])
        }
        
        return User(
            id: userId,
            name: response.name,
            email: response.email ?? email,
            phone: response.phone,
            role: response.role,
            storeName: response.storeName,
            businessType: response.businessType,
            categories: response.categories,
            address: response.address,
            website: response.website,
            logo: response.logo,
            uniqueId: response.uniqueId,
            location: response.location,
            profilePicture: response.profilePicture
        )
    }
    
    // MARK: - Stores
    
    func getStores() async throws -> [Store] {
        return try await makeRequest(endpoint: "/api/stores", method: "GET", responseType: [Store].self)
    }
    
    func getStoreProducts(sellerId: Int) async throws -> [Product] {
        let allProducts = try await getProducts()
        return allProducts.filter { $0.userId == sellerId }
    }
    
    // MARK: - Products/Ads
    
    func getProducts() async throws -> [Product] {
        return try await makeRequest(endpoint: "/api/ads", method: "GET", responseType: [Product].self)
    }
    
    func createProduct(
        title: String,
        description: String,
        userId: Int,
        category: String?,
        tags: [String],
        price: Double?,
        unit: String?,
        minOrder: Int?,
        stock: Int?,
        imageUrl: String?,
        images: String?
    ) async throws -> Product {
        let body: [String: Any?] = [
            "title": title,
            "description": description,
            "userId": userId,
            "category": category,
            "tags": tags,
            "price": price,
            "unit": unit,
            "minOrder": minOrder,
            "stock": stock,
            "imageUrl": imageUrl,
            "images": images
        ]
        
        let jsonData = try JSONSerialization.data(withJSONObject: body.compactMapValues { $0 })
        let response = try await makeRequest(endpoint: "/api/ads", method: "POST", body: jsonData, responseType: ProductResponse.self)
        
        guard response.success, let productId = response.id else {
            throw NSError(domain: "APIError", code: -1, userInfo: [NSLocalizedDescriptionKey: response.error ?? "Failed to create product"])
        }
        
        return Product(
            id: productId,
            title: response.title ?? title,
            description: response.description ?? description,
            userId: response.userId,
            createdAt: response.createdAt,
            author: response.author,
            storeName: nil,
            role: nil,
            profilePicture: nil,
            category: response.category,
            tags: response.tags,
            price: response.price,
            unit: response.unit,
            minOrder: response.minOrder,
            stock: response.stock,
            imageUrl: response.imageUrl,
            images: nil,
            verified: response.verified,
            views: nil
        )
    }
    
    func updateProduct(productId: Int, updates: [String: Any]) async throws {
        let jsonData = try JSONSerialization.data(withJSONObject: updates)
        let _ = try await makeRequest(endpoint: "/api/ads/\(productId)", method: "PUT", body: jsonData, responseType: GenericResponse.self)
    }
    
    func deleteProduct(productId: Int) async throws {
        let _ = try await makeRequest(endpoint: "/api/ads/\(productId)", method: "DELETE", body: nil, responseType: GenericResponse.self)
    }
    
    // MARK: - Wishlist
    
    func getWishlist(userId: Int) async throws -> [WishlistItem] {
        return try await makeRequest(endpoint: "/api/wishlist/\(userId)", method: "GET", responseType: [WishlistItem].self)
    }
    
    func addToWishlist(userId: Int, adId: Int) async throws {
        let body = ["userId": userId, "adId": adId]
        let jsonData = try JSONEncoder().encode(body)
        let _ = try await makeRequest(endpoint: "/api/wishlist", method: "POST", body: jsonData, responseType: GenericResponse.self)
    }
    
    func removeFromWishlist(wishlistId: Int) async throws {
        let _ = try await makeRequest(endpoint: "/api/wishlist/\(wishlistId)", method: "DELETE", body: nil, responseType: GenericResponse.self)
    }
    
    func checkWishlist(userId: Int, adId: Int) async throws -> WishlistCheckResponse {
        let body = ["userId": userId, "adId": adId]
        let jsonData = try JSONEncoder().encode(body)
        return try await makeRequest(endpoint: "/api/wishlist/check", method: "POST", body: jsonData, responseType: WishlistCheckResponse.self)
    }
    
    // MARK: - Conversations & Messages
    
    func getConversations(userId: Int) async throws -> [Conversation] {
        return try await makeRequest(endpoint: "/api/conversations/\(userId)", method: "GET", responseType: [Conversation].self)
    }
    
    func startConversation(buyerId: Int, sellerId: Int, listingId: Int?) async throws -> Int {
        let body: [String: Any?] = [
            "buyerId": buyerId,
            "sellerId": sellerId,
            "listingId": listingId
        ]
        let jsonData = try JSONSerialization.data(withJSONObject: body.compactMapValues { $0 })
        let response = try await makeRequest(endpoint: "/api/conversations", method: "POST", body: jsonData, responseType: ConversationResponse.self)
        
        guard response.success, let conversationId = response.conversationId else {
            throw NSError(domain: "APIError", code: -1, userInfo: [NSLocalizedDescriptionKey: "Failed to start conversation"])
        }
        
        return conversationId
    }
    
    func getMessages(conversationId: Int) async throws -> [Message] {
        return try await makeRequest(endpoint: "/api/messages/\(conversationId)", method: "GET", responseType: [Message].self)
    }
    
    func sendMessage(conversationId: Int, senderId: Int, message: String) async throws {
        let body = [
            "conversationId": conversationId,
            "senderId": senderId,
            "message": message
        ] as [String : Any]
        let jsonData = try JSONSerialization.data(withJSONObject: body)
        let _ = try await makeRequest(endpoint: "/api/messages", method: "POST", body: jsonData, responseType: GenericResponse.self)
    }
    
    func markMessagesAsRead(conversationId: Int, userId: Int) async throws {
        let body = ["userId": userId]
        let jsonData = try JSONEncoder().encode(body)
        let _ = try await makeRequest(endpoint: "/api/messages/mark-read/\(conversationId)", method: "POST", body: jsonData, responseType: GenericResponse.self)
    }
    
    func getUnreadCount(userId: Int) async throws -> Int {
        let response = try await makeRequest(endpoint: "/api/messages/unread/\(userId)", method: "GET", responseType: UnreadCountResponse.self)
        return response.unreadCount
    }
    
    // MARK: - Reviews
    
    func getReviews(adId: Int) async throws -> [Review] {
        return try await makeRequest(endpoint: "/api/reviews/\(adId)", method: "GET", responseType: [Review].self)
    }
    
    func canReview(adId: Int, userId: Int) async throws -> CanReviewResponse {
        let body = ["userId": userId] as [String: Any]
        let jsonData = try JSONSerialization.data(withJSONObject: body)
        return try await makeRequest(endpoint: "/api/reviews/can-review/\(adId)", method: "POST", body: jsonData, responseType: CanReviewResponse.self)
    }
    
    func addReview(adId: Int, userId: Int, rating: Int, reviewText: String) async throws {
        let body = [
            "adId": adId,
            "userId": userId,
            "rating": rating,
            "reviewText": reviewText
        ] as [String : Any]
        let jsonData = try JSONSerialization.data(withJSONObject: body)
        let _ = try await makeRequest(endpoint: "/api/reviews", method: "POST", body: jsonData, responseType: ReviewAddResponse.self)
    }
    
    func deleteReview(reviewId: Int) async throws {
        let _ = try await makeRequest(endpoint: "/api/reviews/\(reviewId)", method: "DELETE", body: nil, responseType: GenericResponse.self)
    }
    
    func getReviewStats(adId: Int) async throws -> ReviewStats {
        return try await makeRequest(endpoint: "/api/reviews/stats/\(adId)", method: "GET", responseType: ReviewStats.self)
    }
    
    // MARK: - Profile
    
    func updateProfile(userId: Int, updates: [String: Any]) async throws -> User {
        var body = updates
        body["userId"] = userId
        let jsonData = try JSONSerialization.data(withJSONObject: body)
        let response = try await makeRequest(endpoint: "/api/user/profile", method: "PUT", body: jsonData, responseType: AuthResponse.self)
        
        guard response.success, let userId = response.id else {
            throw NSError(domain: "APIError", code: -1, userInfo: [NSLocalizedDescriptionKey: "Failed to update profile"])
        }
        
        return User(
            id: userId,
            name: response.name,
            email: response.email ?? "",
            phone: response.phone,
            role: response.role,
            storeName: response.storeName,
            businessType: response.businessType,
            categories: response.categories,
            address: response.address,
            website: response.website,
            logo: response.logo,
            uniqueId: response.uniqueId,
            location: response.location,
            profilePicture: response.profilePicture
        )
    }
    
    // MARK: - Image Upload
    
    func uploadImage(_ image: UIImage) async throws -> String {
        guard let imageData = image.jpegData(compressionQuality: 0.8) else {
            throw NSError(domain: "APIError", code: -1, userInfo: [NSLocalizedDescriptionKey: "Failed to convert image"])
        }
        
        let url = URL(string: baseURL + "/api/upload")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        
        let boundary = UUID().uuidString
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        
        var body = Data()
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"file\"; filename=\"image.jpg\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
        body.append(imageData)
        body.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)
        
        request.httpBody = body
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw URLError(.badServerResponse)
        }
        
        let uploadResponse = try JSONDecoder().decode(UploadResponse.self, from: data)
        
        guard uploadResponse.success, let imageUrl = uploadResponse.url else {
            throw NSError(domain: "APIError", code: -1, userInfo: [NSLocalizedDescriptionKey: uploadResponse.error ?? "Upload failed"])
        }
        
        return imageUrl
    }
    
    func uploadImages(_ images: [UIImage]) async throws -> [String] {
        var urls: [String] = []
        
        for image in images {
            let url = try await uploadImage(image)
            urls.append(url)
        }
        
        return urls
    }
}
