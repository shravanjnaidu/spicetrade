package com.spicetrade.app.ui.screens.products

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import coil.compose.AsyncImage
import com.spicetrade.app.data.api.ApiConfig
import com.spicetrade.app.data.models.Product
import com.spicetrade.app.ui.theme.BrandRed
import com.spicetrade.app.ui.theme.StarYellow
import com.spicetrade.app.viewmodel.AuthViewModel
import com.spicetrade.app.viewmodel.ReviewViewModel
import com.spicetrade.app.viewmodel.WishlistViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProductDetailScreen(
    product: Product,
    authViewModel: AuthViewModel,
    reviewViewModel: ReviewViewModel = viewModel(),
    wishlistViewModel: WishlistViewModel = viewModel(),
    onBack: () -> Unit
) {
    val currentUser by authViewModel.currentUser.collectAsState()
    val reviews by reviewViewModel.reviews.collectAsState()
    val stats by reviewViewModel.stats.collectAsState()
    val canReview by reviewViewModel.canReview.collectAsState()
    val wishlistItems by wishlistViewModel.items.collectAsState()

    val inWishlist = remember(wishlistItems) { wishlistItems.any { it.id == product.id } }
    val wishlistId = remember(wishlistItems) { wishlistItems.find { it.id == product.id }?.wishlistId }

    var showReviewDialog by remember { mutableStateOf(false) }
    var reviewRating by remember { mutableIntStateOf(5) }
    var reviewText by remember { mutableStateOf("") }

    LaunchedEffect(product.id) {
        reviewViewModel.loadReviews(product.id)
        currentUser?.id?.let { uid ->
            reviewViewModel.checkCanReview(product.id, uid)
            wishlistViewModel.loadWishlist(uid)
        }
    }

    val imageUrls = product.imageURLs.map { product.fullImageURL(it, ApiConfig.BASE_URL) }
    val pagerState = rememberPagerState(pageCount = { imageUrls.size.coerceAtLeast(1) })

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(product.title, maxLines = 1, overflow = TextOverflow.Ellipsis) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, "Back")
                    }
                },
                actions = {
                    currentUser?.isBuyer?.let { isBuyer ->
                        if (isBuyer) {
                            IconButton(onClick = {
                                currentUser?.id?.let { uid ->
                                    if (inWishlist && wishlistId != null) {
                                        wishlistViewModel.removeFromWishlist(wishlistId, uid)
                                    } else {
                                        wishlistViewModel.addToWishlist(uid, product.id)
                                    }
                                }
                            }) {
                                Icon(
                                    if (inWishlist) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                                    "Wishlist",
                                    tint = if (inWishlist) Color.Red else Color.Gray
                                )
                            }
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = BrandRed, titleContentColor = Color.White, navigationIconContentColor = Color.White, actionIconContentColor = Color.White)
            )
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(innerPadding),
            verticalArrangement = Arrangement.spacedBy(0.dp)
        ) {
            // Image pager
            item {
                Box(modifier = Modifier.fillMaxWidth().height(280.dp).background(Color(0xFFF0F0F0))) {
                    if (imageUrls.isNotEmpty()) {
                        HorizontalPager(state = pagerState, modifier = Modifier.fillMaxSize()) { page ->
                            AsyncImage(
                                model = imageUrls[page],
                                contentDescription = null,
                                modifier = Modifier.fillMaxSize(),
                                contentScale = ContentScale.Crop
                            )
                        }
                        if (imageUrls.size > 1) {
                            Row(
                                modifier = Modifier.align(Alignment.BottomCenter).padding(8.dp),
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                repeat(imageUrls.size) { i ->
                                    Box(
                                        modifier = Modifier.size(if (pagerState.currentPage == i) 8.dp else 6.dp)
                                            .clip(CircleShape)
                                            .background(if (pagerState.currentPage == i) Color.White else Color.White.copy(0.5f))
                                    )
                                }
                            }
                        }
                    } else {
                        Text("🫙", fontSize = 80.sp, modifier = Modifier.align(Alignment.Center))
                    }
                }
            }

            // Product info
            item {
                Column(modifier = Modifier.background(Color.White).padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            product.title,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.weight(1f)
                        )
                        if (product.verified == 1) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color(0xFF22C55E))
                                    .padding(horizontal = 8.dp, vertical = 4.dp)
                            ) { Text("Verified", color = Color.White, fontSize = 11.sp) }
                        }
                    }
                    Spacer(Modifier.height(4.dp))
                    Text(product.priceText, fontSize = 22.sp, fontWeight = FontWeight.Black, color = BrandRed)

                    stats?.let { s ->
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("★", fontSize = 16.sp, color = StarYellow)
                            Text(
                                " ${"%.1f".format(s.averageRating)} (${s.totalReviews} reviews)",
                                fontSize = 13.sp, color = Color.Gray
                            )
                        }
                    }

                    Spacer(Modifier.height(12.dp))

                    // Details grid
                    product.category?.let { DetailChip("Category", it) }
                    product.minOrder?.let { DetailChip("Min Order", "$it ${product.unit ?: "units"}") }
                    product.stock?.let { DetailChip("Stock", "$it available") }

                    Spacer(Modifier.height(12.dp))
                    HorizontalDivider()
                    Spacer(Modifier.height(12.dp))

                    Text("Description", fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
                    Spacer(Modifier.height(4.dp))
                    Text(product.description, fontSize = 14.sp, color = Color.DarkGray, lineHeight = 22.sp)

                    product.tags?.takeIf { it.isNotEmpty() }?.let { tags ->
                        Spacer(Modifier.height(12.dp))
                        Text("Tags", fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
                        Spacer(Modifier.height(6.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            tags.forEach { tag ->
                                AssistChip(onClick = {}, label = { Text(tag, fontSize = 12.sp) })
                            }
                        }
                    }

                    // Store info
                    product.storeName?.let { store ->
                        Spacer(Modifier.height(12.dp))
                        HorizontalDivider()
                        Spacer(Modifier.height(12.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Store, null, tint = BrandRed, modifier = Modifier.size(20.dp))
                            Spacer(Modifier.width(8.dp))
                            Text(store, fontWeight = FontWeight.SemiBold)
                        }
                    }
                }
            }

            // Reviews section
            item {
                Spacer(Modifier.height(8.dp))
                Column(modifier = Modifier.background(Color.White).padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("Reviews", fontWeight = FontWeight.Bold, fontSize = 17.sp, modifier = Modifier.weight(1f))
                        if (canReview) {
                            TextButton(onClick = { showReviewDialog = true }) {
                                Text("Write a Review", color = BrandRed)
                            }
                        }
                    }
                    Spacer(Modifier.height(8.dp))
                }
            }

            items(reviews) { review ->
                Card(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row {
                            Text(review.userName ?: "User", fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                            Text("★".repeat(review.rating), color = StarYellow, fontSize = 13.sp)
                        }
                        review.reviewText?.let {
                            Spacer(Modifier.height(4.dp))
                            Text(it, fontSize = 13.sp, color = Color.DarkGray)
                        }
                    }
                }
            }

            item { Spacer(Modifier.height(16.dp)) }
        }

        if (showReviewDialog) {
            AlertDialog(
                onDismissRequest = { showReviewDialog = false },
                title = { Text("Write a Review") },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text("Rating")
                        Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            (1..5).forEach { star ->
                                IconButton(onClick = { reviewRating = star }) {
                                    Text(if (star <= reviewRating) "★" else "☆", fontSize = 24.sp, color = StarYellow)
                                }
                            }
                        }
                        OutlinedTextField(
                            value = reviewText,
                            onValueChange = { reviewText = it },
                            label = { Text("Your review (optional)") },
                            modifier = Modifier.fillMaxWidth(),
                            minLines = 3
                        )
                    }
                },
                confirmButton = {
                    TextButton(onClick = {
                        currentUser?.id?.let { uid ->
                            reviewViewModel.addReview(product.id, uid, reviewRating, reviewText.ifBlank { null })
                        }
                        showReviewDialog = false
                    }) { Text("Submit") }
                },
                dismissButton = {
                    TextButton(onClick = { showReviewDialog = false }) { Text("Cancel") }
                }
            )
        }
    }
}

@Composable
private fun DetailChip(label: String, value: String) {
    Row(modifier = Modifier.padding(vertical = 2.dp)) {
        Text("$label: ", fontWeight = FontWeight.SemiBold, fontSize = 13.sp, color = Color.Gray)
        Text(value, fontSize = 13.sp)
    }
}
