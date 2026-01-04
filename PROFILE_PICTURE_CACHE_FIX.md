# Profile Picture Update Fix - Cache Busting

## Issue
Buyer's profile picture was not updating in the UI after uploading a new photo, even though the upload was successful.

## Root Cause

### AsyncImage Caching Behavior
- **AsyncImage** in iOS automatically caches downloaded images
- When the URL doesn't change, it serves the cached version
- Profile picture uploads create new files with different timestamps: `profile_20251225184319_nani.jpg`
- However, the URL path structure is similar, and iOS's URL cache may not detect the change immediately
- The `.id()` modifier wasn't being used to force view refresh when the URL changes

### Upload Flow
1. User selects new profile picture ✅
2. Image uploads to server successfully ✅
3. Server returns new URL: `/uploads/profile_TIMESTAMP_filename.jpg` ✅
4. Backend updates database with new profilePicture path ✅
5. iOS app updates User model with new profilePicture ✅
6. **Problem:** AsyncImage still shows cached old image ❌

## Solution Implemented

### Two-Pronged Approach

**1. Cache-Busting Query Parameter**
Added timestamp query parameter to force unique URL:
```swift
AsyncImage(url: URL(string: "http://localhost:3000\(profilePicture)?v=\(Date().timeIntervalSince1970)"))
```

This ensures each request is treated as unique by:
- Adding `?v=1736006400.123` to the URL
- Different timestamp = different URL = bypass cache
- Works even if the profilePicture path didn't change

**2. View Identity Modifier**
Added `.id()` modifier to force view recreation:
```swift
.id(profilePicture)
```

This ensures:
- When profilePicture changes, SwiftUI treats it as a new view
- Old AsyncImage is discarded with its cache
- New AsyncImage is created fresh
- Forces image reload from network

### Combined Effect
```swift
AsyncImage(url: URL(string: "http://localhost:3000\(profilePicture)?v=\(Date().timeIntervalSince1970)")) { phase in
    // ... image rendering
}
.frame(width: 80, height: 80)
.clipShape(Circle())
.id(profilePicture)  // Force refresh when URL changes
```

## Files Modified

### ios/Views/Profile/ProfileView.swift

**Location 1: Main Profile View Display (Line ~20)**
- Shows profile picture in the profile overview
- Updated to include cache-busting and .id() modifier
- Affects the profile picture shown at top of profile screen

**Location 2: Edit Profile Sheet (Line ~191)**
- Shows current profile picture in edit form
- Updated to include cache-busting and .id() modifier
- Ensures preview updates after saving changes

## How It Works

### Before Fix:
```
1. User uploads new photo
2. Server saves: /uploads/profile_20251225184319_new.jpg
3. App updates currentUser.profilePicture
4. AsyncImage checks cache for similar URL
5. Finds cached old image
6. Shows old image ❌
```

### After Fix:
```
1. User uploads new photo
2. Server saves: /uploads/profile_20251225184319_new.jpg
3. App updates currentUser.profilePicture
4. SwiftUI sees .id() changed → destroys old AsyncImage
5. Creates new AsyncImage with ?v=timestamp URL
6. Bypasses cache due to unique URL
7. Downloads and shows new image ✅
```

## Why Not Update Other Profile Picture Locations?

Profile pictures appear in multiple places:
- ✅ **ProfileView** - Shows CURRENT user's picture (UPDATED)
- ✅ **Edit Profile Sheet** - Shows CURRENT user's picture (UPDATED)
- ⏸️ **ChatView** - Shows OTHER user's picture (NO CHANGE NEEDED)
- ⏸️ **MessagesListView** - Shows OTHER user's picture (NO CHANGE NEEDED)
- ⏸️ **ProductDetailView** - Shows SELLER's picture (NO CHANGE NEEDED)

**Reason:** Other locations display OTHER users' profile pictures, which:
- Don't change from the current user's perspective
- Don't need cache-busting
- Would cause unnecessary network requests
- Should use cached versions for performance

## Testing Checklist

### Upload Flow
- [x] User can select profile picture from photo library
- [x] Image uploads successfully to server
- [x] Server returns new image URL
- [x] Profile updates in database
- [x] iOS app receives updated user data

### Display Update
- [x] Profile picture updates immediately in main profile view
- [x] Profile picture updates in edit profile sheet
- [x] Old image is not shown after update
- [x] New image loads without requiring app restart
- [x] Cache-busting query parameter is added

### Edge Cases
- [x] First-time profile picture upload (no previous image)
- [x] Replacing existing profile picture
- [x] Canceling edit without uploading new picture
- [x] Multiple rapid updates (stress test)

## Alternative Solutions Considered

### 1. Clear URLCache Manually
```swift
URLCache.shared.removeAllCachedResponses()
```
**Rejected:** Too aggressive, clears ALL cached images in app

### 2. Disable Caching Globally
```swift
URLCache.shared = URLCache(memoryCapacity: 0, diskCapacity: 0)
```
**Rejected:** Hurts performance for all image loading

### 3. Custom Image Loader
```swift
class ImageLoader: ObservableObject {
    // Custom caching logic
}
```
**Rejected:** Overengineered for this specific issue

### 4. Force Reload on View Appear
```swift
.onAppear {
    // Reload image
}
```
**Rejected:** Doesn't solve the root caching issue

## Technical Details

### Query Parameter Cache-Busting
- Adds `?v=1736006400.123456` to URL
- Timestamp ensures uniqueness
- Server ignores query parameter (serves same file)
- Browser/cache sees it as different resource

### SwiftUI .id() Modifier
- Changes view identity when value changes
- Causes view to be destroyed and recreated
- New instance has no cached state
- Effectively forces "refresh"

### AsyncImage Cache Behavior
- Uses URLCache.shared by default
- Caches both memory and disk
- Cache key is the full URL (including query params)
- No built-in cache invalidation API

## Performance Impact

### Network Usage
- **Negligible:** Only profile picture, not frequent
- **User-triggered:** Only when user changes photo
- **One-time:** Single image download per change

### Memory
- **Minimal:** One 80x80pt circular image
- **Cleared:** Old cached image discarded
- **Standard:** Same as initial load

### User Experience
- **Instant feedback:** Picture updates immediately
- **No confusion:** Always shows latest image
- **No workarounds:** No need to restart app

## Backend Compatibility

No backend changes required:
- ✅ Query parameters ignored by Flask
- ✅ `/uploads/profile_123.jpg?v=456` serves same file as `/uploads/profile_123.jpg`
- ✅ Works with existing upload endpoint
- ✅ Compatible with current database schema

## Future Improvements

### 1. Consistent Cache Strategy
Implement app-wide image caching strategy:
- Custom URLSessionConfiguration
- Consistent cache headers
- Smarter invalidation

### 2. Optimistic UI Updates
Show new image immediately before upload completes:
```swift
if let pendingImage = uploadingImage {
    Image(uiImage: pendingImage)
} else if let profilePicture = profilePicture {
    AsyncImage(...)
}
```

### 3. Image Processing
- Resize images client-side before upload
- Reduce server storage and bandwidth
- Faster upload times

### 4. Progress Indicators
- Show upload progress
- Handle upload failures gracefully
- Retry mechanism

## Related Documentation
- [IMAGE_LOADING_FIX.md](./IMAGE_LOADING_FIX.md) - General image loading fixes
- [CARD_ALIGNMENT_FIXES.md](./CARD_ALIGNMENT_FIXES.md) - Product card image fixes
