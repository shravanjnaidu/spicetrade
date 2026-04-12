package com.spicetrade.app.ui.screens.wishlist

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import coil.compose.AsyncImage
import com.spicetrade.app.data.api.ApiConfig
import com.spicetrade.app.data.models.WishlistItem
import com.spicetrade.app.ui.theme.BrandRed
import com.spicetrade.app.viewmodel.AuthViewModel
import com.spicetrade.app.viewmodel.WishlistViewModel

@Composable
fun WishlistScreen(
    authViewModel: AuthViewModel,
    wishlistViewModel: WishlistViewModel = viewModel()
) {
    val currentUser by authViewModel.currentUser.collectAsState()
    val items by wishlistViewModel.items.collectAsState()
    val isLoading by wishlistViewModel.isLoading.collectAsState()

    LaunchedEffect(currentUser) {
        currentUser?.id?.let { wishlistViewModel.loadWishlist(it) }
    }

    Column(modifier = Modifier.fillMaxSize().background(Color(0xFFF5F5F5))) {
        Box(
            modifier = Modifier.fillMaxWidth().background(BrandRed).padding(16.dp)
        ) {
            Text(
                "Wishlist (${items.size})",
                fontSize = 22.sp, fontWeight = FontWeight.Black, color = Color.White
            )
        }

        if (isLoading && items.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = BrandRed)
            }
        } else if (items.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("❤️", fontSize = 48.sp)
                    Text("No Saved Items", fontWeight = FontWeight.Bold)
                    Text("Tap the heart icon on any product to save it here", color = Color.Gray, fontSize = 13.sp)
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(items, key = { it.wishlistId }) { item ->
                    WishlistItemCard(
                        item = item,
                        onRemove = {
                            currentUser?.id?.let { uid ->
                                wishlistViewModel.removeFromWishlist(item.wishlistId, uid)
                            }
                        }
                    )
                }
            }
        }
    }
}

@Composable
private fun WishlistItemCard(item: WishlistItem, onRemove: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(2.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            // Image
            Box(
                modifier = Modifier.size(80.dp).background(Color(0xFFF0F0F0), RoundedCornerShape(12.dp)),
                contentAlignment = Alignment.Center
            ) {
                val imageUrl = item.imageUrl?.let { url ->
                    if (url.startsWith("http")) url else "${ApiConfig.BASE_URL}/uploads/$url"
                }
                if (imageUrl != null) {
                    AsyncImage(
                        model = imageUrl,
                        contentDescription = null,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                } else {
                    Text("🫙", fontSize = 32.sp)
                }
            }

            Spacer(Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    item.title,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 14.sp,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
                item.storeName?.let {
                    Text(it, fontSize = 12.sp, color = Color.Gray)
                }
                val priceText = if (item.price != null && item.price > 0) {
                    "₹${"%.2f".format(item.price)}${item.unit?.let { "/$it" } ?: ""}"
                } else "Price on request"
                Text(priceText, fontWeight = FontWeight.Bold, fontSize = 13.sp, color = BrandRed)
            }

            IconButton(onClick = onRemove) {
                Icon(Icons.Default.Delete, "Remove", tint = Color.Red.copy(alpha = 0.7f))
            }
        }
    }
}
