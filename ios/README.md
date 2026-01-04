# SpiceTrade iOS App

A fully-featured iOS marketplace app built with SwiftUI that connects to the SpiceTrade Flask backend.

## Features

### Authentication
- ✅ User signup with buyer/seller role selection
- ✅ Login/logout functionality
- ✅ Persistent login with UserDefaults
- ✅ Profile picture upload for buyers
- ✅ Store logo upload for sellers

### Product Management (Sellers)
- ✅ Create new product listings
- ✅ Upload multiple product images (up to 5)
- ✅ Edit existing products
- ✅ Delete products
- ✅ Set price, unit, minimum order, and stock
- ✅ Add categories and tags
- ✅ View all seller's products in dashboard

### Product Discovery (All Users)
- ✅ Browse all product listings
- ✅ Search products by title, description, or tags
- ✅ Filter by category
- ✅ Filter by multiple tags
- ✅ Pull-to-refresh functionality
- ✅ Product detail view with image carousel
- ✅ View seller information

### Wishlist (Buyers)
- ✅ Add/remove products from wishlist
- ✅ View all wishlist items
- ✅ Quick access to product details
- ✅ Swipe to delete from wishlist

### Messaging
- ✅ Start conversations with sellers
- ✅ Real-time chat interface
- ✅ Message history
- ✅ Unread message badges
- ✅ Mark messages as read
- ✅ View all conversations
- ✅ Contact seller from product detail page

### Reviews & Ratings
- ✅ Submit product reviews with 1-5 star ratings
- ✅ Write review text
- ✅ View all product reviews
- ✅ See review statistics (average rating, distribution)
- ✅ Display reviewer profile pictures

### User Profile
- ✅ View profile information
- ✅ Edit profile details
- ✅ Update profile picture
- ✅ Update store information (sellers)
- ✅ View unique user ID

## Architecture

### Project Structure
```
ios/
├── SpiceTradeApp.swift          # App entry point
├── ContentView.swift             # Root view with auth check
├── Info.plist                    # App configuration
├── Models/
│   └── Models.swift              # All data models
├── Services/
│   └── APIService.swift          # Network layer
├── ViewModels/
│   ├── AuthViewModel.swift       # Authentication logic
│   ├── ProductViewModel.swift    # Product management
│   ├── MessageViewModel.swift    # Messaging logic
│   ├── WishlistViewModel.swift   # Wishlist management
│   └── ReviewViewModel.swift     # Reviews logic
├── Views/
│   ├── MainTabView.swift         # Main tab navigation
│   ├── Auth/
│   │   ├── WelcomeView.swift
│   │   ├── LoginView.swift
│   │   └── SignupView.swift
│   ├── Products/
│   │   ├── ProductsListView.swift
│   │   └── ProductDetailView.swift
│   ├── Seller/
│   │   ├── SellerDashboardView.swift
│   │   ├── AddProductView.swift
│   │   └── EditProductView.swift
│   ├── Messages/
│   │   ├── MessagesListView.swift
│   │   ├── ChatView.swift
│   │   └── ContactSellerView.swift
│   ├── Wishlist/
│   │   └── WishlistView.swift
│   ├── Reviews/
│   │   └── AddReviewView.swift
│   └── Profile/
│       └── ProfileView.swift
└── README.md                     # This file
```

### Technology Stack
- **SwiftUI** - Modern declarative UI framework
- **Swift Concurrency** - async/await for network calls
- **Combine** - Reactive programming with @Published properties
- **PhotosUI** - Native image picker integration
- **URLSession** - Network requests
- **UserDefaults** - Local data persistence

## Setup Instructions

### Prerequisites
- Xcode 15.0 or later
- iOS 17.0 or later
- macOS Sonoma or later

### Backend Setup
1. Make sure the Flask backend is running:
   ```bash
   cd /Users/amruthavarshini/git/spicetrade
   python app.py
   ```
   The server should be running on `http://localhost:3000`

### iOS App Setup

#### Option 1: Create Xcode Project Manually
1. Open Xcode
2. Create a new iOS App project
3. Name it "SpiceTrade"
4. Select SwiftUI for Interface and Swift for Language
5. Choose a bundle identifier (e.g., com.yourname.SpiceTrade)
6. Copy all the Swift files from the `ios/` folder into your Xcode project
7. Add the Info.plist file to your project
8. Build and run!

#### Option 2: Use Xcode Command Line
```bash
cd /Users/amruthavarshini/git/spicetrade/ios

# If you have xcode-select configured:
# Create a new Xcode project using the template, then copy files
```

### Configuration

#### API Endpoint Configuration
The app is configured to connect to `http://localhost:3000` by default.

**For iOS Simulator:**
- No changes needed - localhost works fine

**For Physical Device:**
1. Find your Mac's local IP address:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```
2. Update `APIService.swift`:
   ```swift
   private let baseURL = "http://YOUR_IP_ADDRESS:3000"
   ```
   For example: `http://192.168.1.100:3000`

3. Make sure your iPhone and Mac are on the same WiFi network

## Usage Guide

### First Launch
1. Launch the app
2. You'll see the Welcome screen
3. Choose "Sign Up" to create a new account
4. Select whether you want to be a Buyer or Seller
5. Fill in your information
6. Tap "Create Account"

### As a Buyer
1. **Browse Products**: View all available products on the Home tab
2. **Search**: Use the search bar to find specific products
3. **Filter**: Tap the filter icon to filter by category or tags
4. **View Details**: Tap any product to see full details
5. **Add to Wishlist**: Tap the heart icon on product details
6. **Contact Seller**: Tap "Contact Seller" to start a conversation
7. **Write Review**: Tap "Write Review" on product detail page
8. **Check Messages**: View and respond to messages in Messages tab
9. **View Wishlist**: Access saved products in Wishlist tab

### As a Seller
1. **Add Products**: Go to Dashboard tab and tap the + button
2. **Upload Images**: Select up to 5 images for your product
3. **Fill Details**: Add title, description, price, stock, etc.
4. **Add Tags**: Help buyers find your products with relevant tags
5. **Manage Products**: View all your products in the Dashboard
6. **Edit Products**: Tap any product to edit its details
7. **Delete Products**: Swipe left on a product to delete
8. **Respond to Messages**: Chat with potential buyers in Messages tab

### Profile Management
1. Go to Profile tab
2. Tap "Edit Profile"
3. Update your information
4. Change profile picture (buyers) or logo (sellers)
5. Tap "Save"

## API Integration

The app connects to the following Flask API endpoints:

### Authentication
- `POST /api/signup` - Create new user account
- `POST /api/login` - Authenticate user

### Products
- `GET /api/ads` - Get all products
- `POST /api/ads` - Create new product
- `PUT /api/ads/:id` - Update product
- `DELETE /api/ads/:id` - Delete product

### Wishlist
- `GET /api/wishlist/:userId` - Get user's wishlist
- `POST /api/wishlist` - Add to wishlist
- `DELETE /api/wishlist/:id` - Remove from wishlist
- `POST /api/wishlist/check` - Check if item is in wishlist

### Messaging
- `GET /api/conversations/:userId` - Get user's conversations
- `POST /api/conversations` - Start new conversation
- `GET /api/messages/:conversationId` - Get messages
- `POST /api/messages` - Send message
- `POST /api/messages/mark-read/:conversationId` - Mark as read
- `GET /api/messages/unread/:userId` - Get unread count

### Reviews
- `GET /api/reviews/:adId` - Get product reviews
- `POST /api/reviews` - Add review
- `DELETE /api/reviews/:id` - Delete review
- `GET /api/reviews/stats/:adId` - Get review statistics

### Profile
- `PUT /api/user/profile` - Update user profile

### Media
- `POST /api/upload` - Upload images

## Testing Checklist

### Authentication ✅
- [ ] Signup as buyer with profile picture
- [ ] Signup as seller with store information
- [ ] Login with existing account
- [ ] Logout and verify session cleared
- [ ] App remembers logged-in user on restart

### Product Management (Seller) ✅
- [ ] Create product with single image
- [ ] Create product with multiple images
- [ ] Create product with tags and category
- [ ] Edit product details
- [ ] Delete product
- [ ] View all own products in dashboard

### Product Discovery ✅
- [ ] Browse all products
- [ ] Search by product name
- [ ] Filter by category
- [ ] Filter by multiple tags
- [ ] View product detail page
- [ ] Navigate image carousel
- [ ] Pull to refresh product list

### Wishlist (Buyer) ✅
- [ ] Add product to wishlist
- [ ] Remove product from wishlist
- [ ] View wishlist page
- [ ] Navigate to product from wishlist
- [ ] Swipe to delete from wishlist

### Messaging ✅
- [ ] Contact seller from product page
- [ ] Send first message
- [ ] View conversation list
- [ ] Send and receive messages
- [ ] See unread message badge
- [ ] Messages marked as read when opened

### Reviews ✅
- [ ] Write review with rating
- [ ] Submit review with text
- [ ] View reviews on product page
- [ ] See review statistics
- [ ] See star rating distribution

### Profile ✅
- [ ] View profile information
- [ ] Edit profile details
- [ ] Upload new profile picture
- [ ] Save profile changes
- [ ] Changes persist after logout/login

## Troubleshooting

### Cannot Connect to Server
- Verify Flask server is running on port 3000
- Check `baseURL` in `APIService.swift`
- For physical device, use Mac's IP address instead of localhost
- Ensure firewall allows connections on port 3000

### Images Not Loading
- Check that image URLs start with `/uploads/`
- Verify images exist in `public/uploads/` folder
- Check console for URL errors

### App Crashes on Launch
- Clean build folder (Cmd+Shift+K)
- Delete derived data
- Restart Xcode
- Check for any compilation errors

### Photo Picker Not Working
- Check Info.plist has photo library permission
- Verify app has photo access in Settings
- Try selecting different images

## Performance Optimizations

- **AsyncImage**: Automatic image caching and lazy loading
- **LazyVStack**: Efficient list rendering
- **@MainActor**: UI updates on main thread
- **Task Management**: Proper async/await usage
- **Pull-to-Refresh**: Manual data refresh capability

## Future Enhancements

- [ ] Push notifications for new messages
- [ ] Real-time message updates with WebSocket
- [ ] Order management system
- [ ] Payment integration
- [ ] Advanced search with filters
- [ ] Seller analytics dashboard
- [ ] Product recommendations
- [ ] Social sharing
- [ ] Dark mode support
- [ ] Localization

## License

This is a demo application for educational purposes.

## Credits

Built with ❤️ using SwiftUI and the SpiceTrade Flask API.
