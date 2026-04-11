//
//  AddProductView.swift
//  SpiceTrade
//

import SwiftUI
import PhotosUI

struct AddProductView: View {
    let userId: Int
    let onProductAdded: () -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var title = ""
    @State private var description = ""
    @State private var category = ""
    @State private var tagInput = ""
    @State private var tags: [String] = []
    @State private var price = ""
    @State private var unit = ""
    @State private var minOrder = ""
    @State private var stock = ""
    @State private var listingType = "product"
    @State private var selectedImages: [PhotosPickerItem] = []
    @State private var productImages: [UIImage] = []
    @State private var isSubmitting = false
    @State private var errorMessage: String?

    let categories = [
        "Spices & Herbs",
        "Pulses & Legumes",
        "Tea & Coffee",
        "Nuts & Dry Fruits",
        "Grains & Cereals",
        "Oils & Fats",
        "Sugar & Sweeteners",
        "Dairy Products",
        "Organic Products",
        "Others"
    ]

    var body: some View {
        NavigationStack {
            Form {
                Section("Listing Type") {
                    Picker("Type", selection: $listingType) {
                        Text("Product / Service").tag("product")
                        Text("Buying Requirement").tag("requirement")
                    }
                    .pickerStyle(.segmented)
                    if listingType == "requirement" {
                        Text("Use this when you are looking to buy something.")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }

                Section("Images") {
                    PhotosPicker(selection: $selectedImages, maxSelectionCount: 5, matching: .images) {
                        Label("Select Photos", systemImage: "photo.on.rectangle")
                    }
                    .onChange(of: selectedImages) { _, newItems in
                        loadImages(from: newItems)
                    }

                    if !productImages.isEmpty {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 12) {
                                ForEach(Array(productImages.enumerated()), id: \.offset) { index, image in
                                    ZStack(alignment: .topTrailing) {
                                        Image(uiImage: image)
                                            .resizable()
                                            .scaledToFill()
                                            .frame(width: 100, height: 100)
                                            .clipShape(RoundedRectangle(cornerRadius: 8))
                                        Button(action: { productImages.remove(at: index) }) {
                                            Image(systemName: "xmark.circle.fill")
                                                .foregroundColor(.red)
                                                .background(Circle().fill(Color.white))
                                        }
                                        .offset(x: 8, y: -8)
                                    }
                                }
                            }
                            .padding(.vertical, 4)
                        }
                    }
                }

                Section("Basic Information") {
                    TextField("Title", text: $title)
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
                    HStack {
                        TextField("Add tag", text: $tagInput)
                            .textInputAutocapitalization(.never)
                        Button("Add") {
                            let trimmed = tagInput.trimmingCharacters(in: .whitespaces)
                            if !trimmed.isEmpty { tags.append(trimmed); tagInput = "" }
                        }
                        .disabled(tagInput.trimmingCharacters(in: .whitespaces).isEmpty)
                    }
                    if !tags.isEmpty {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(tags, id: \.self) { tag in
                                    HStack(spacing: 4) {
                                        Text(tag).font(.caption)
                                        Button(action: { tags.removeAll { $0 == tag } }) {
                                            Image(systemName: "xmark.circle.fill").font(.caption)
                                        }
                                    }
                                    .padding(.horizontal, 8).padding(.vertical, 4)
                                    .background(Color.orange.opacity(0.2))
                                    .cornerRadius(8)
                                }
                            }
                        }
                    }
                }

                if listingType == "product" {
                    Section("Pricing & Inventory") {
                        TextField("Price (₹)", text: $price).keyboardType(.decimalPad)
                        TextField("Unit (e.g., kg, lb, piece)", text: $unit)
                        TextField("Minimum Order (optional)", text: $minOrder).keyboardType(.numberPad)
                        TextField("Stock Quantity", text: $stock).keyboardType(.numberPad)
                    }
                }

                if let errorMessage = errorMessage {
                    Section {
                        Text(errorMessage).foregroundColor(.red).font(.caption)
                    }
                }
            }
            .navigationTitle(listingType == "requirement" ? "Post Requirement" : "Add Product")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    if isSubmitting {
                        ProgressView()
                    } else {
                        Button("Create") { createProduct() }
                            .disabled(!isFormValid)
                    }
                }
            }
        }
    }

    private var isFormValid: Bool {
        !title.isEmpty && !description.isEmpty &&
        (listingType == "requirement" || !price.isEmpty)
    }

    private func loadImages(from items: [PhotosPickerItem]) {
        productImages = []
        for item in items {
            Task {
                if let data = try? await item.loadTransferable(type: Data.self),
                   let image = UIImage(data: data) {
                    await MainActor.run { productImages.append(image) }
                }
            }
        }
    }

    private func createProduct() {
        isSubmitting = true
        errorMessage = nil
        Task {
            do {
                var imageUrls: [String] = []
                if !productImages.isEmpty {
                    imageUrls = try await APIService.shared.uploadImages(productImages)
                }
                let priceValue = listingType == "requirement" ? nil : Double(price)
                let minOrderValue = Int(minOrder) ?? 1
                let stockValue = Int(stock)
                let _ = try await APIService.shared.createProduct(
                    title: title,
                    description: description,
                    userId: userId,
                    category: category.isEmpty ? nil : category,
                    tags: tags,
                    price: priceValue,
                    unit: unit.isEmpty ? nil : unit,
                    minOrder: minOrderValue,
                    stock: stockValue,
                    imageUrl: imageUrls.first,
                    images: imageUrls.isEmpty ? nil : imageUrls.joined(separator: ","),
                    listingType: listingType
                )
                onProductAdded()
                dismiss()
            } catch {
                errorMessage = error.localizedDescription
            }
            isSubmitting = false
        }
    }
}

#Preview {
    AddProductView(userId: 1) {}
}
