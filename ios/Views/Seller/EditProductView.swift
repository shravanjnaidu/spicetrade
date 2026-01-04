//
//  EditProductView.swift
//  SpiceTrade
//

import SwiftUI
import PhotosUI

struct EditProductView: View {
    let product: Product
    let onUpdate: () -> Void
    
    @Environment(\.dismiss) private var dismiss
    @State private var title: String
    @State private var description: String
    @State private var category: String
    @State private var tags: [String]
    @State private var price: String
    @State private var unit: String
    @State private var minOrder: String
    @State private var stock: String
    @State private var isSubmitting = false
    @State private var errorMessage: String?
    
    let categories = ["Spices", "Foods", "Beverages", "Grains", "Oils", "Others"]
    
    init(product: Product, onUpdate: @escaping () -> Void) {
        self.product = product
        self.onUpdate = onUpdate
        
        _title = State(initialValue: product.title)
        _description = State(initialValue: product.description)
        _category = State(initialValue: product.category ?? "")
        _tags = State(initialValue: product.tags ?? [])
        _price = State(initialValue: product.price != nil ? String(format: "%.2f", product.price!) : "")
        _unit = State(initialValue: product.unit ?? "")
        _minOrder = State(initialValue: product.minOrder != nil ? "\(product.minOrder!)" : "")
        _stock = State(initialValue: product.stock != nil ? "\(product.stock!)" : "")
    }
    
    var body: some View {
        Form {
            Section("Basic Information") {
                TextField("Product Title", text: $title)
                
                TextEditor(text: $description)
                    .frame(minHeight: 80)
                Text("Description")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Picker("Category", selection: $category) {
                    Text("Select Category").tag("")
                    ForEach(categories, id: \.self) { cat in
                        Text(cat).tag(cat)
                    }
                }
            }
            
            Section("Tags") {
                ForEach(tags, id: \.self) { tag in
                    HStack {
                        Text(tag)
                        Spacer()
                        Button(action: { tags.removeAll { $0 == tag } }) {
                            Image(systemName: "trash")
                                .foregroundColor(.red)
                        }
                    }
                }
            }
            
            Section("Pricing & Inventory") {
                TextField("Price", text: $price)
                    .keyboardType(.decimalPad)
                
                TextField("Unit (e.g., kg, lb, piece)", text: $unit)
                
                TextField("Minimum Order", text: $minOrder)
                    .keyboardType(.numberPad)
                
                TextField("Stock Quantity", text: $stock)
                    .keyboardType(.numberPad)
            }
            
            if let errorMessage = errorMessage {
                Section {
                    Text(errorMessage)
                        .foregroundColor(.red)
                        .font(.caption)
                }
            }
        }
        .navigationTitle("Edit Product")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Save") {
                    updateProduct()
                }
                .disabled(isSubmitting || !isFormValid)
            }
        }
    }
    
    private var isFormValid: Bool {
        !title.isEmpty && !description.isEmpty
    }
    
    private func updateProduct() {
        isSubmitting = true
        errorMessage = nil
        
        Task {
            do {
                var updates: [String: Any] = [
                    "title": title,
                    "description": description
                ]
                
                if !category.isEmpty {
                    updates["category"] = category
                }
                
                if !tags.isEmpty {
                    updates["tags"] = tags
                }
                
                if let priceValue = Double(price) {
                    updates["price"] = priceValue
                }
                
                if !unit.isEmpty {
                    updates["unit"] = unit
                }
                
                if let minOrderValue = Int(minOrder) {
                    updates["minOrder"] = minOrderValue
                }
                
                if let stockValue = Int(stock) {
                    updates["stock"] = stockValue
                }
                
                try await APIService.shared.updateProduct(productId: product.id, updates: updates)
                
                onUpdate()
                dismiss()
            } catch {
                errorMessage = error.localizedDescription
            }
            
            isSubmitting = false
        }
    }
}

#Preview {
    NavigationStack {
        EditProductView(product: Product(
            id: 1,
            title: "Test Product",
            description: "Test description",
            userId: 1,
            createdAt: nil,
            author: nil,
            storeName: nil,
            role: nil,
            profilePicture: nil,
            category: "Spices",
            tags: ["test"],
            price: 10.0,
            unit: "kg",
            minOrder: 1,
            stock: 100,
            imageUrl: nil,
            images: nil,
            verified: nil,
            views: nil
        )) {}
    }
}
