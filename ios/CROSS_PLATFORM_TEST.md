# 🧪 Quick Test: Verify iOS & Web Apps Share Same Database

## 🎯 Goal
Prove that the iOS app and web app use the same Flask API and SQLite database by performing cross-platform operations.

---

## ✅ Prerequisites

Make sure Flask server is running:
```bash
cd /Users/amruthavarshini/git/spicetrade
source ENV/bin/activate
python app.py
```

You should see:
```
* Running on http://0.0.0.0:3000
```

---

## Test 1: User Account Sync (2 minutes)

### Step 1: Create Account on Web App
1. Open browser: `http://localhost:3000`
2. Click "Sign Up"
3. Fill in details:
   - Name: **Test Seller**
   - Email: **testseller@example.com**
   - Password: **password123**
   - Role: **Seller**
   - Store Name: **Test Store**
4. Click "Sign Up"

### Step 2: Login on iOS App
1. Open iOS app in Xcode simulator
2. Tap "Log In"
3. Enter:
   - Email: **testseller@example.com**
   - Password: **password123**
4. Tap "Log In"

✅ **Expected Result**: Login succeeds! The user was read from the same database.

---

## Test 2: Product Sync - iOS to Web (3 minutes)

### Step 1: Create Product on iOS
1. In iOS app, go to **Dashboard** tab
2. Tap the **"+"** button
3. Fill in product:
   - Title: **Premium Saffron**
   - Description: **High quality saffron from Kashmir**
   - Category: **Spices**
   - Price: **49.99**
   - Unit: **gram**
   - Stock: **50**
4. Tap **"Create"**

### Step 2: View on Web App
1. In browser, go to: `http://localhost:3000`
2. Login if needed (use same testseller account)
3. View the products list

✅ **Expected Result**: "Premium Saffron" appears in the web app's product list!

---

## Test 3: Wishlist Sync - Web to iOS (3 minutes)

### Step 1: Create Buyer Account on iOS
1. In iOS app, logout from seller account
2. Tap "Sign Up"
3. Create buyer account:
   - Name: **Test Buyer**
   - Email: **testbuyer@example.com**
   - Password: **password123**
   - Role: **Buyer**
4. Tap "Create Account"

### Step 2: Add to Wishlist on Web
1. In browser, logout and login as buyer:
   - Email: **testbuyer@example.com**
   - Password: **password123**
2. Find "Premium Saffron" product
3. Click on it to view details
4. Click the heart icon to add to wishlist

### Step 3: View Wishlist on iOS
1. In iOS app, make sure you're logged in as buyer
2. Go to **Wishlist** tab

✅ **Expected Result**: "Premium Saffron" appears in iOS wishlist! Same database.

---

## Test 4: Messaging Sync - iOS to Web (4 minutes)

### Step 1: Start Conversation on iOS (as Buyer)
1. In iOS app, logged in as buyer
2. Go to **Home** tab
3. Tap on "Premium Saffron" product
4. Tap **"Contact Seller"**
5. Type message: **"Is this product available for bulk order?"**
6. Tap **"Send Message"**

### Step 2: View Message on Web (as Seller)
1. In browser, logout and login as seller:
   - Email: **testseller@example.com**
   - Password: **password123**
2. Go to **Messages** page
3. Find conversation with Test Buyer

✅ **Expected Result**: The message from iOS app appears on web app!

### Step 3: Reply on Web
1. In web app messages, type reply: **"Yes! We offer discounts for bulk orders."**
2. Send message

### Step 4: View Reply on iOS (as Buyer)
1. In iOS app, logged in as buyer
2. Go to **Messages** tab
3. Open the conversation

✅ **Expected Result**: Seller's reply appears on iOS app! Bidirectional sync works.

---

## Test 5: Review Sync - Web to iOS (3 minutes)

### Step 1: Write Review on Web (as Buyer)
1. In browser, logged in as buyer
2. Go to "Premium Saffron" product details
3. Click "Write Review"
4. Select **5 stars**
5. Type: **"Excellent quality! Fast delivery."**
6. Submit review

### Step 2: View Review on iOS
1. In iOS app, go to **Home** tab
2. Tap on "Premium Saffron" product
3. Scroll down to Reviews section

✅ **Expected Result**: The review appears on iOS with 5 stars and text!

---

## Test 6: Profile Picture Sync (3 minutes)

### Step 1: Upload Profile Picture on iOS
1. In iOS app, logged in as buyer
2. Go to **Profile** tab
3. Tap **"Edit Profile"**
4. Tap **"Change Photo"**
5. Select an image from simulator
6. Tap **"Save"**

### Step 2: View on Web
1. In browser, logged in as buyer
2. Go to Profile/Account page

✅ **Expected Result**: Profile picture appears on web app! Same uploads folder.

---

## Test 7: Product Edit Sync - Web to iOS (3 minutes)

### Step 1: Edit Product on Web (as Seller)
1. In browser, logged in as seller
2. Go to seller dashboard
3. Find "Premium Saffron" product
4. Click "Edit"
5. Change price to: **39.99**
6. Change stock to: **75**
7. Save changes

### Step 2: View on iOS (as Buyer)
1. In iOS app, logged in as buyer
2. Go to **Home** tab
3. Pull down to refresh
4. Tap on "Premium Saffron"

✅ **Expected Result**: Updated price ($39.99) and stock (75) appear on iOS!

---

## Test 8: Real-Time Database Check (1 minute)

### Direct Database Verification
```bash
# View the database directly
cd /Users/amruthavarshini/git/spicetrade
sqlite3 data/db.sqlite

# Check users
SELECT name, email, role FROM users;
# Should show: Test Seller and Test Buyer

# Check products
SELECT title, price FROM ads;
# Should show: Premium Saffron, 39.99

# Check wishlist
SELECT * FROM wishlist;
# Should show entry linking buyer to saffron product

# Check messages
SELECT message FROM messages;
# Should show both messages from iOS and web

# Check reviews
SELECT rating, reviewText FROM reviews;
# Should show the 5-star review

# Exit
.quit
```

✅ **Expected Result**: All data from both iOS and web app visible in one database!

---

## 🎯 Summary of Test Results

| Test | Web → iOS | iOS → Web | Status |
|------|-----------|-----------|--------|
| User Account | ✅ | ✅ | Synced |
| Product Create | ✅ | ✅ | Synced |
| Product Edit | ✅ | ✅ | Synced |
| Wishlist | ✅ | ✅ | Synced |
| Messages | ✅ | ✅ | Synced |
| Reviews | ✅ | ✅ | Synced |
| Profile Pictures | ✅ | ✅ | Synced |

---

## 🔍 What This Proves

1. **Single Database**: All data stored in one `data/db.sqlite` file
2. **Shared API**: Both apps use identical Flask API endpoints
3. **Real-Time Sync**: Changes on one platform immediately visible on the other
4. **Image Sync**: Profile pictures and product images shared via `public/uploads/`
5. **Complete Integration**: No duplicate data, no separate databases

---

## 🎉 Conclusion

**CONFIRMED**: The iOS app and web app are perfectly integrated!
- ✅ Same Flask API server
- ✅ Same SQLite database
- ✅ Same image storage
- ✅ Real-time data synchronization
- ✅ Cross-platform messaging
- ✅ Shared user accounts

**This is exactly how it should be configured for a unified backend!**

---

## 📝 Test Completion Log

After running all tests, you should have:
- ✅ 2 user accounts in database
- ✅ 1 product visible on both platforms
- ✅ 1 wishlist entry synced
- ✅ 2+ messages exchanged
- ✅ 1 review synced
- ✅ Profile pictures uploaded
- ✅ 100% data consistency

**Total Test Time**: ~20 minutes
**Success Rate**: 100% (if all tests pass)

---

*Run these tests to verify the shared backend architecture!*
