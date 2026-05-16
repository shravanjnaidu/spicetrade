package com.spicetrade.app.ui.screens.products

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.spicetrade.app.data.api.ApiConfig
import com.spicetrade.app.data.models.Product
import com.spicetrade.app.ui.theme.BrandAmber
import com.spicetrade.app.ui.theme.BrandOrange
import com.spicetrade.app.ui.theme.StarYellow
import com.spicetrade.app.ui.theme.SuccessGreen
import com.spicetrade.app.viewmodel.AuthViewModel
import com.spicetrade.app.viewmodel.CartViewModel
import com.spicetrade.app.viewmodel.ProductViewModel
import com.spicetrade.app.viewmodel.ReviewViewModel
import com.spicetrade.app.viewmodel.WishlistViewModel

@OptIn(ExperimentalMaterial3Api::class, ExperimentalFoundationApi::class)
@Composable
fun ProductDetailScreen(
    product: Product,
    authViewModel: AuthViewModel,
    reviewViewModel: ReviewViewModel = hiltViewModel(),
    wishlistViewModel: WishlistViewModel = hiltViewModel(),
    cartViewModel: CartViewModel = hiltViewModel(),
    productViewModel: ProductViewModel = hiltViewModel(),
    onBack: () -> Unit,
    onCartClick: (() -> Unit)? = null,
    onContactSeller: ((sellerId: Int, adId: Int) -> Unit)? = null
) {
    val currentUser by authViewModel.currentUser.collectAsState()
    val reviews by reviewViewModel.reviews.collectAsState()
    val stats by reviewViewModel.stats.collectAsState()
    val canReview by reviewViewModel.canReview.collectAsState()
    val wishlistItems by wishlistViewModel.items.collectAsState()
    val cartItems by cartViewModel.items.collectAsState()

    val inWishlist = remember(wishlistItems) { wishlistItems.any { it.id == product.id } }
    val wishlistId = remember(wishlistItems) { wishlistItems.find { it.id == product.id }?.wishlistId }
    val inCart = cartItems.any { it.product.id == product.id }
    val cartQty = cartItems.find { it.product.id == product.id }?.quantity ?: 0

    var showReviewDialog by remember { mutableStateOf(false) }
    var reviewRating by remember { mutableIntStateOf(5) }
    var reviewText by remember { mutableStateOf("") }
    var showRfqDialog by remember { mutableStateOf(false) }
    var rfqQuantity by remember { mutableStateOf(product.minOrder?.toString() ?: "1") }
    var rfqMessage by remember { mutableStateOf("") }
    var rfqSubmitting by remember { mutableStateOf(false) }
    var rfqSuccess by remember { mutableStateOf(false) }
    var showContactDialog by remember { mutableStateOf(false) }

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
                    currentUser?.let {
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
                                tint = if (inWishlist) Color.Red else Color.White
                            )
                        }
                    }
                    val cartCnt by cartViewModel.cartCount.collectAsState()
                    BadgedBox(
                        badge = { if (cartCnt > 0) Badge { Text("$cartCnt") } },
                        modifier = Modifier.padding(end = 4.dp)
                    ) {
                        IconButton(onClick = { onCartClick?.invoke() }) {
                            Icon(Icons.Default.ShoppingCart, "Cart", tint = Color.White)
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = BrandOrange,
                    titleContentColor = Color.White,
                    navigationIconContentColor = Color.White,
                    actionIconContentColor = Color.White
                )
            )
        },
        bottomBar = {
            ProductDetailBottomBar(
                product = product,
                inCart = inCart,
                cartQty = cartQty,
                onAddToCart = { cartViewModel.addToCart(product) },
                onIncreaseQty = { cartViewModel.updateQuantity(product.id, 1) },
                onDecreaseQty = { cartViewModel.updateQuantity(product.id, -1) },
                onViewCart = { onCartClick?.invoke() },
                onRequestQuote = { showRfqDialog = true },
                onContactSeller = {
                    if (product.userId != null && currentUser != null) showContactDialog = true
                },
                isSeller = currentUser?.isSeller == true,
                hasSeller = product.userId != null && product.userId != currentUser?.id
            )
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(innerPadding),
            verticalArrangement = Arrangement.spacedBy(0.dp)
        ) {
            // ── Image carousel ─────────────────────────────────────────────
            item {
                Box(modifier = Modifier.fillMaxWidth().height(300.dp).background(Color(0xFFF0F0F0))) {
                    if (imageUrls.isNotEmpty()) {
                        HorizontalPager(state = pagerState, modifier = Modifier.fillMaxSize()) { page ->
                            AsyncImage(
                                model = imageUrls[page],
                                contentDescription = null,
                                modifier = Modifier.fillMaxSize(),
                                contentScale = ContentScale.Fit
                            )
                        }
                        if (imageUrls.size > 1) {
                            Surface(
                                modifier = Modifier.align(Alignment.TopEnd).padding(10.dp),
                                shape = RoundedCornerShape(20.dp),
                                color = Color.Black.copy(0.55f)
                            ) {
                                Text(
                                    "${pagerState.currentPage + 1}/${imageUrls.size}",
                                    color = Color.White, fontSize = 12.sp,
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                                )
                            }
                            Row(
                                modifier = Modifier.align(Alignment.BottomCenter).padding(10.dp),
                                horizontalArrangement = Arrangement.spacedBy(5.dp)
                            ) {
                                repeat(imageUrls.size) { i ->
                                    Box(
                                        modifier = Modifier
                                            .size(if (pagerState.currentPage == i) 9.dp else 6.dp)
                                            .clip(CircleShape)
                                            .background(
                                                if (pagerState.currentPage == i) Color.White
                                                else Color.White.copy(0.45f)
                                            )
                                    )
                                }
                            }
                        }
                    } else {
                        Box(
                            modifier = Modifier.fillMaxSize().background(Color(0xFFF5F0E8)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.ShoppingBag, null,
                                modifier = Modifier.size(80.dp), tint = Color(0xFFCCCCCC))
                        }
                    }
                }
            }

            // ── Price & title ──────────────────────────────────────────────
            item {
                Column(modifier = Modifier.background(Color.White).padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            product.title,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.weight(1f),
                            lineHeight = 28.sp
                        )
                        if (product.verified == 1) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(SuccessGreen)
                                    .padding(horizontal = 8.dp, vertical = 4.dp)
                            ) { Text("Verified", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold) }
                        }
                    }
                    Spacer(Modifier.height(8.dp))
                    Text(product.priceText, fontSize = 26.sp, fontWeight = FontWeight.Black, color = BrandOrange)
                    stats?.let { s ->
                        Spacer(Modifier.height(6.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            repeat(5) { i ->
                                Text(if (i < s.averageRating.toInt()) "★" else "☆", fontSize = 16.sp, color = StarYellow)
                            }
                            Spacer(Modifier.width(6.dp))
                            Text(
                                "${"%.1f".format(s.averageRating)} (${s.totalReviews} review${if (s.totalReviews != 1) "s" else ""})",
                                fontSize = 13.sp, color = Color.Gray
                            )
                        }
                    }
                }
            }

            // ── Product details + bulk pricing ─────────────────────────────
            item {
                Spacer(Modifier.height(6.dp))
                Column(modifier = Modifier.background(Color.White).padding(horizontal = 16.dp, vertical = 12.dp)) {
                    Text("Product Details", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    Spacer(Modifier.height(10.dp))
                    product.category?.let { DetailRow(Icons.Default.Category, "Category", it, BrandOrange) }
                    product.minOrder?.let {
                        DetailRow(Icons.Default.LocalShipping, "Min. Order Qty", "$it ${product.unit ?: "units"}", Color(0xFF1565C0))
                    }
                    product.stock?.let {
                        DetailRow(Icons.Default.Inventory, "In Stock", "$it ${product.unit ?: "units"}", SuccessGreen)
                    }
                    product.unit?.let { DetailRow(Icons.Default.Scale, "Unit", it, Color(0xFF6A1B9A)) }
                    if (product.price != null && product.price > 0 && product.minOrder != null) {
                        Spacer(Modifier.height(12.dp))
                        HorizontalDivider(color = Color(0xFFEEEEEE))
                        Spacer(Modifier.height(12.dp))
                        Text("Bulk Pricing (estimated)", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Spacer(Modifier.height(6.dp))
                        BulkPricingTable(basePrice = product.price, minOrder = product.minOrder, unit = product.unit)
                    }
                }
            }

            // ── Description ────────────────────────────────────────────────
            item {
                Spacer(Modifier.height(6.dp))
                Column(modifier = Modifier.background(Color.White).padding(horizontal = 16.dp, vertical = 12.dp)) {
                    Text("Description", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    Spacer(Modifier.height(8.dp))
                    Text(product.description, fontSize = 14.sp, color = Color.DarkGray, lineHeight = 22.sp)
                    product.tags?.takeIf { it.isNotEmpty() }?.let { tags ->
                        Spacer(Modifier.height(12.dp))
                        Text("Tags", fontWeight = FontWeight.SemiBold, fontSize = 13.sp, color = Color.Gray)
                        Spacer(Modifier.height(6.dp))
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            items(tags) { tag ->
                                SuggestionChip(
                                    onClick = {},
                                    label = { Text(tag, fontSize = 12.sp) },
                                    colors = SuggestionChipDefaults.suggestionChipColors(
                                        containerColor = BrandOrange.copy(0.08f),
                                        labelColor = BrandOrange
                                    )
                                )
                            }
                        }
                    }
                }
            }

            // ── Seller info ────────────────────────────────────────────────
            product.storeName?.let { store ->
                item {
                    Spacer(Modifier.height(6.dp))
                    Column(modifier = Modifier.background(Color.White).padding(horizontal = 16.dp, vertical = 12.dp)) {
                        Text("Seller Information", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                        Spacer(Modifier.height(10.dp))
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Box(
                                modifier = Modifier.size(48.dp).clip(CircleShape)
                                    .background(BrandOrange.copy(0.12f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    store.take(1).uppercase(),
                                    fontSize = 20.sp, fontWeight = FontWeight.Bold, color = BrandOrange
                                )
                            }
                            Spacer(Modifier.width(12.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(store, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                                product.author?.let { Text(it, fontSize = 12.sp, color = Color.Gray) }
                            }
                            if (product.verified == 1) {
                                Surface(shape = RoundedCornerShape(6.dp), color = SuccessGreen.copy(0.12f)) {
                                    Row(
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Icon(Icons.Default.Verified, null, tint = SuccessGreen, modifier = Modifier.size(14.dp))
                                        Spacer(Modifier.width(3.dp))
                                        Text("Verified", fontSize = 11.sp, color = SuccessGreen, fontWeight = FontWeight.SemiBold)
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // ── Reviews ────────────────────────────────────────────────────
            item {
                Spacer(Modifier.height(6.dp))
                Column(modifier = Modifier.background(Color.White).padding(horizontal = 16.dp, vertical = 12.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("Reviews", fontWeight = FontWeight.Bold, fontSize = 17.sp, modifier = Modifier.weight(1f))
                        if (canReview) {
                            TextButton(onClick = { showReviewDialog = true }) {
                                Text("Write a Review", color = BrandOrange)
                            }
                        }
                    }
                    stats?.let { s ->
                        Spacer(Modifier.height(8.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("${"%.1f".format(s.averageRating)}", fontSize = 44.sp, fontWeight = FontWeight.Black, color = BrandOrange)
                            Spacer(Modifier.width(12.dp))
                            Column {
                                Row { repeat(5) { i -> Text(if (i < s.averageRating.toInt()) "★" else "☆", fontSize = 14.sp, color = StarYellow) } }
                                Text("${s.totalReviews} review${if (s.totalReviews != 1) "s" else ""}", fontSize = 12.sp, color = Color.Gray)
                            }
                        }
                    }
                }
            }

            items(reviews) { review ->
                Card(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(1.dp)
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier.size(36.dp).clip(CircleShape).background(BrandOrange.copy(0.1f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text((review.userName ?: "U").take(1).uppercase(),
                                    fontSize = 15.sp, fontWeight = FontWeight.Bold, color = BrandOrange)
                            }
                            Spacer(Modifier.width(10.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(review.userName ?: "User", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                                Text(review.createdAt?.take(10) ?: "", fontSize = 11.sp, color = Color.Gray)
                            }
                            Row { repeat(5) { i -> Text(if (i < review.rating) "★" else "☆", fontSize = 13.sp, color = StarYellow) } }
                        }
                        review.reviewText?.let {
                            Spacer(Modifier.height(8.dp))
                            Text(it, fontSize = 13.sp, color = Color.DarkGray, lineHeight = 20.sp)
                        }
                    }
                }
            }

            item { Spacer(Modifier.height(24.dp)) }
        }

        // ── Review dialog ──────────────────────────────────────────────────
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
                                    Text(if (star <= reviewRating) "★" else "☆", fontSize = 26.sp, color = StarYellow)
                                }
                            }
                        }
                        OutlinedTextField(
                            value = reviewText,
                            onValueChange = { reviewText = it },
                            label = { Text("Your review (optional)") },
                            modifier = Modifier.fillMaxWidth(),
                            minLines = 3,
                            colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = BrandOrange)
                        )
                    }
                },
                confirmButton = {
                    TextButton(onClick = {
                        currentUser?.id?.let { uid ->
                            reviewViewModel.addReview(product.id, uid, reviewRating, reviewText.ifBlank { null })
                        }
                        showReviewDialog = false
                    }) { Text("Submit", color = BrandOrange) }
                },
                dismissButton = {
                    TextButton(onClick = { showReviewDialog = false }) { Text("Cancel") }
                }
            )
        }

        // ── RFQ dialog ─────────────────────────────────────────────────────
        if (showRfqDialog) {
            AlertDialog(
                onDismissRequest = { if (!rfqSubmitting) showRfqDialog = false },
                title = { Text("Request Quotation") },
                text = {
                    if (rfqSuccess) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(Icons.Default.CheckCircle, null, tint = SuccessGreen, modifier = Modifier.size(48.dp))
                            Spacer(Modifier.height(8.dp))
                            Text("Requirement posted! Sellers will contact you.",
                                textAlign = TextAlign.Center)
                        }
                    } else {
                        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            Surface(shape = RoundedCornerShape(8.dp), color = BrandOrange.copy(0.08f)) {
                                Text(product.title, fontWeight = FontWeight.SemiBold, fontSize = 13.sp,
                                    modifier = Modifier.padding(10.dp))
                            }
                            OutlinedTextField(
                                value = rfqQuantity,
                                onValueChange = { rfqQuantity = it },
                                label = { Text("Quantity required *") },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true,
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                trailingIcon = {
                                    product.unit?.let {
                                        Text(it, color = Color.Gray, fontSize = 13.sp,
                                            modifier = Modifier.padding(end = 10.dp))
                                    }
                                },
                                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = BrandOrange)
                            )
                            OutlinedTextField(
                                value = rfqMessage,
                                onValueChange = { rfqMessage = it },
                                label = { Text("Additional details / specs (optional)") },
                                modifier = Modifier.fillMaxWidth(),
                                minLines = 3,
                                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = BrandOrange)
                            )
                        }
                    }
                },
                confirmButton = {
                    if (rfqSuccess) {
                        TextButton(onClick = { showRfqDialog = false; rfqSuccess = false }) { Text("Done") }
                    } else {
                        TextButton(
                            onClick = {
                                if (rfqQuantity.isNotBlank() && currentUser != null) {
                                    rfqSubmitting = true
                                    val body: Map<String, Any?> = mapOf(
                                        "title" to "Requirement: ${product.title}",
                                        "description" to buildString {
                                            append("Quantity: $rfqQuantity ${product.unit ?: "units"}")
                                            if (rfqMessage.isNotBlank()) append(". $rfqMessage")
                                        },
                                        "category" to (product.category ?: "Other"),
                                        "min_order" to rfqQuantity.toIntOrNull(),
                                        "unit" to product.unit,
                                        "listing_type" to "requirement"
                                    )
                                    productViewModel.createListing(body)
                                    rfqSubmitting = false
                                    rfqSuccess = true
                                }
                            },
                            enabled = rfqQuantity.isNotBlank() && !rfqSubmitting
                        ) {
                            if (rfqSubmitting) {
                                CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp, color = BrandOrange)
                            } else {
                                Text("Submit", color = BrandOrange)
                            }
                        }
                    }
                },
                dismissButton = {
                    if (!rfqSuccess) TextButton(onClick = { showRfqDialog = false }) { Text("Cancel") }
                }
            )
        }

        // ── Contact seller dialog ──────────────────────────────────────────
        if (showContactDialog) {
            AlertDialog(
                onDismissRequest = { showContactDialog = false },
                title = { Text("Chat with Seller") },
                text = { Text("Start a conversation with ${product.storeName ?: "the seller"} about ${product.title}?") },
                confirmButton = {
                    TextButton(onClick = {
                        showContactDialog = false
                        product.userId?.let { sellerId ->
                            onContactSeller?.invoke(sellerId, product.id)
                        }
                    }) { Text("Start Chat", color = BrandOrange) }
                },
                dismissButton = {
                    TextButton(onClick = { showContactDialog = false }) { Text("Cancel") }
                }
            )
        }
    }
}

// ── Bottom action bar ──────────────────────────────────────────────────────────
@Composable
private fun ProductDetailBottomBar(
    product: Product,
    inCart: Boolean,
    cartQty: Int,
    onAddToCart: () -> Unit,
    onIncreaseQty: () -> Unit,
    onDecreaseQty: () -> Unit,
    onViewCart: () -> Unit,
    onRequestQuote: () -> Unit,
    onContactSeller: () -> Unit,
    isSeller: Boolean,
    hasSeller: Boolean
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = Color.White,
        shadowElevation = 12.dp
    ) {
        Column(
            modifier = Modifier
                .navigationBarsPadding()
                .padding(horizontal = 14.dp, vertical = 10.dp)
        ) {
            if (isSeller) {
                Button(
                    onClick = {},
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = BrandOrange)
                ) {
                    Icon(Icons.Default.Share, null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("Share Listing")
                }
            } else {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    if (inCart) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .border(1.dp, BrandOrange.copy(0.4f), RoundedCornerShape(10.dp))
                                .padding(horizontal = 6.dp, vertical = 4.dp)
                        ) {
                            IconButton(onClick = onDecreaseQty, modifier = Modifier.size(28.dp)) {
                                Icon(
                                    if (cartQty <= 1) Icons.Default.Delete else Icons.Default.Remove,
                                    null,
                                    tint = if (cartQty <= 1) Color.Red else BrandOrange,
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                            Text("$cartQty", fontWeight = FontWeight.Bold, fontSize = 15.sp,
                                modifier = Modifier.padding(horizontal = 8.dp))
                            IconButton(onClick = onIncreaseQty, modifier = Modifier.size(28.dp)) {
                                Icon(Icons.Default.Add, null, tint = BrandOrange, modifier = Modifier.size(16.dp))
                            }
                        }
                        Button(
                            onClick = onViewCart,
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = BrandOrange)
                        ) {
                            Icon(Icons.Default.ShoppingCart, null, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("View Cart", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        }
                    } else {
                        OutlinedButton(
                            onClick = onRequestQuote,
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = BrandOrange),
                            border = androidx.compose.foundation.BorderStroke(1.5.dp, BrandOrange)
                        ) {
                            Icon(Icons.Default.RequestQuote, null, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("Request Quote", fontSize = 12.sp)
                        }
                        Button(
                            onClick = onAddToCart,
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = BrandOrange)
                        ) {
                            Icon(Icons.Default.AddShoppingCart, null, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("Add to Cart", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                    if (hasSeller) {
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(Color(0xFF1565C0).copy(0.1f))
                                .clickable(onClick = onContactSeller),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.Chat, "Chat", tint = Color(0xFF1565C0))
                        }
                    }
                }
            }
        }
    }
}

// ── Detail row ─────────────────────────────────────────────────────────────────
@Composable
private fun DetailRow(icon: ImageVector, label: String, value: String, tint: Color) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, null, tint = tint, modifier = Modifier.size(18.dp))
        Spacer(Modifier.width(10.dp))
        Text("$label: ", fontSize = 13.sp, color = Color.Gray, fontWeight = FontWeight.Medium)
        Text(value, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
    }
}

// ── Bulk pricing table ─────────────────────────────────────────────────────────
@Composable
private fun BulkPricingTable(basePrice: Double, minOrder: Int, unit: String?) {
    val tiers = listOf(
        Triple(minOrder, minOrder * 4, basePrice),
        Triple(minOrder * 5, minOrder * 19, basePrice * 0.95),
        Triple(minOrder * 20, null, basePrice * 0.90)
    )
    Column {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(topStart = 6.dp, topEnd = 6.dp))
                .background(BrandOrange.copy(0.08f))
                .padding(horizontal = 12.dp, vertical = 6.dp)
        ) {
            Text("Quantity", fontWeight = FontWeight.Bold, fontSize = 12.sp, modifier = Modifier.weight(1.5f))
            Text("Price/Unit", fontWeight = FontWeight.Bold, fontSize = 12.sp, modifier = Modifier.weight(1f), textAlign = TextAlign.End)
            Text("Discount", fontWeight = FontWeight.Bold, fontSize = 12.sp, modifier = Modifier.weight(1f), textAlign = TextAlign.End)
        }
        tiers.forEachIndexed { idx, (from, to, price) ->
            val discount = ((basePrice - price) / basePrice * 100).toInt()
            val u = unit ?: "units"
            val range = if (to != null) "$from–$to $u" else "$from+ $u"
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(if (idx % 2 == 0) Color.White else Color(0xFFFAFAFA))
                    .padding(horizontal = 12.dp, vertical = 8.dp)
            ) {
                Text(range, fontSize = 12.sp, modifier = Modifier.weight(1.5f))
                Text("₹${"%.2f".format(price)}", fontSize = 12.sp, modifier = Modifier.weight(1f), textAlign = TextAlign.End)
                Text(
                    if (discount > 0) "-$discount%" else "—",
                    fontSize = 12.sp,
                    color = if (discount > 0) SuccessGreen else Color.Gray,
                    fontWeight = if (discount > 0) FontWeight.Bold else FontWeight.Normal,
                    modifier = Modifier.weight(1f),
                    textAlign = TextAlign.End
                )
            }
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
