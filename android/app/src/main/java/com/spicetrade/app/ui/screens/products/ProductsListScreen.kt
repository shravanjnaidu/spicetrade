package com.spicetrade.app.ui.screens.products

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.spicetrade.app.R
import com.spicetrade.app.data.api.ApiConfig
import com.spicetrade.app.data.models.Product
import com.spicetrade.app.data.models.Store
import com.spicetrade.app.ui.components.HomeScreenShimmer
import com.spicetrade.app.ui.theme.*
import com.spicetrade.app.viewmodel.AuthViewModel
import com.spicetrade.app.viewmodel.CartViewModel
import com.spicetrade.app.viewmodel.ProductViewModel
import com.spicetrade.app.viewmodel.SortOption
import com.spicetrade.app.viewmodel.StoreViewModel

// ── Category data ─────────────────────────────────────────────────────────────
private data class Category(val name: String, val icon: ImageVector, val color: Color)

private val TOP_CATEGORIES = listOf(
    Category("Electronics",  Icons.Default.Devices,          Color(0xFF1565C0)),
    Category("Textiles",     Icons.Default.Checkroom,        Color(0xFF7B1FA2)),
    Category("Agriculture",  Icons.Default.Park,             Color(0xFF2E7D32)),
    Category("Machinery",    Icons.Default.Handyman,         Color(0xFFE65100)),
    Category("Chemicals",    Icons.Default.Science,          Color(0xFF00838F)),
    Category("Food & Spices",Icons.Default.RestaurantMenu,   Color(0xFFC62828)),
    Category("Furniture",    Icons.Default.Chair,            Color(0xFF4E342E)),
    Category("Automobiles",  Icons.Default.DirectionsCar,    Color(0xFF283593)),
    Category("Healthcare",   Icons.Default.LocalHospital,    Color(0xFFAD1457)),
    Category("Construction", Icons.Default.Apartment,        Color(0xFF558B2F)),
    Category("Services",     Icons.Default.MiscellaneousServices, Color(0xFF00695C)),
    Category("View All",     Icons.Default.GridView,         Color(0xFF546E7A)),
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProductsListScreen(
    authViewModel: AuthViewModel,
    productViewModel: ProductViewModel = hiltViewModel(),
    storeViewModel: StoreViewModel = hiltViewModel(),
    cartViewModel: CartViewModel = hiltViewModel(),
    onPostRequirement: (() -> Unit)? = null,
    onMenuOpen: (() -> Unit)? = null,
    onViewAllStores: (() -> Unit)? = null,
    onCartClick: (() -> Unit)? = null,
    onContactSeller: ((Int, Int) -> Unit)? = null
) {
    val products by productViewModel.products.collectAsState()
    val isLoading by productViewModel.isLoading.collectAsState()
    val errorMessage by productViewModel.errorMessage.collectAsState()
    val searchText by productViewModel.searchText.collectAsState()
    val selectedCategory by productViewModel.selectedCategory.collectAsState()

    val stores by storeViewModel.stores.collectAsState()
    var selectedProduct by remember { mutableStateOf<Product?>(null) }
    var showAllProducts by remember { mutableStateOf(false) }

    if (selectedProduct != null) {
        ProductDetailScreen(
            product = selectedProduct!!,
            authViewModel = authViewModel,
            cartViewModel = cartViewModel,
            onBack = { selectedProduct = null },
            onCartClick = onCartClick,
            onContactSeller = onContactSeller
        )
        return
    }

    // Partition products vs requirements
    val regularProducts = remember(products) { products.filter { !it.isRequirement } }
    val requirements    = remember(products) { products.filter { it.isRequirement } }

    val filteredProducts = if (showAllProducts || searchText.isNotEmpty() || selectedCategory != null) {
        productViewModel.filteredProducts.filter { !it.isRequirement }
    } else null   // null = show home sections

    Column(modifier = Modifier.fillMaxSize().background(Color.White)) {

        // ── Top header ─────────────────────────────────────────────────────────
        Column(
            modifier = Modifier.fillMaxWidth().background(Color.White)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 10.dp)
            ) {
            // Logo + notification row
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(bottom = 10.dp)
            ) {
                if (onMenuOpen != null) {
                    IconButton(onClick = onMenuOpen, modifier = Modifier.size(36.dp)) {
                        Icon(Icons.Default.Menu, null, tint = Color(0xFF222222), modifier = Modifier.size(24.dp))
                    }
                    Spacer(Modifier.width(2.dp))
                }
                Image(
                    painter = painterResource(R.drawable.bigspicelogo),
                    contentDescription = "BigSpice",
                    modifier = Modifier.size(36.dp).clip(RoundedCornerShape(8.dp))
                )
                Spacer(Modifier.width(8.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        "BigSpice",
                        fontSize = 19.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFF222222),
                        letterSpacing = (-0.3).sp
                    )
                    Text(
                        "India's #1 B2B Marketplace",
                        fontSize = 10.sp, color = Color(0xFF888888)
                    )
                }
                // Cart icon with badge
                val cartCount by cartViewModel.cartCount.collectAsState()
                BadgedBox(
                    badge = { if (cartCount > 0) Badge { Text("$cartCount") } },
                    modifier = Modifier.padding(end = 2.dp)
                ) {
                    IconButton(onClick = { onCartClick?.invoke() }, modifier = Modifier.size(36.dp)) {
                        Icon(Icons.Default.ShoppingCart, "Cart", tint = BrandOrange, modifier = Modifier.size(22.dp))
                    }
                }
                IconButton(onClick = { /* notifications */ }, modifier = Modifier.size(36.dp)) {
                    Icon(Icons.Default.Notifications, null, tint = BrandOrange, modifier = Modifier.size(22.dp))
                }
            }
            // Search bar
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(24.dp))
                    .background(Color(0xFFF5F5F5))
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)
                ) {
                    Icon(Icons.Default.Search, null, tint = BrandOrange, modifier = Modifier.size(20.dp))
                    Spacer(Modifier.width(8.dp))
                    BasicTextField(
                        value = searchText,
                        onValueChange = { productViewModel.searchText.value = it; showAllProducts = it.isNotEmpty() },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                        decorationBox = { inner ->
                            if (searchText.isEmpty()) {
                                Text("Search products, suppliers, services…", color = Color.Gray, fontSize = 14.sp)
                            }
                            inner()
                        }
                    )
                    if (searchText.isNotEmpty()) {
                        IconButton(
                            onClick = { productViewModel.searchText.value = ""; showAllProducts = false },
                            modifier = Modifier.size(24.dp)
                        ) {
                            Icon(Icons.Default.Close, null, tint = Color.Gray, modifier = Modifier.size(16.dp))
                        }
                    }
                }
            }
        }
        HorizontalDivider(color = Color(0xFFE9E9E9), thickness = 1.dp)
    }

        // ── Body ───────────────────────────────────────────────────────────────
        if (filteredProducts != null) {
            // ── Search / filtered results view ─────────────────────────────
            SearchResultsView(
                filteredProducts = filteredProducts,
                isLoading = isLoading && products.isEmpty(),
                errorMessage = errorMessage,
                productViewModel = productViewModel,
                onSelect = { selectedProduct = it },
                onBack = { productViewModel.searchText.value = ""; productViewModel.clearFilters(); showAllProducts = false }
            )
        } else {
            // ── Indiamart-style home ────────────────────────────────────────
            LazyColumn(modifier = Modifier.fillMaxSize()) {

                // Banner / promotions strip
                item { PromotionBanner() }

                // Category grid
                item {
                    SectionHeader("Browse by Category")
                    CategoryGrid(
                        categories = TOP_CATEGORIES,
                        onSelect = { cat ->
                            if (cat.name != "View All") {
                                productViewModel.selectedCategory.value = cat.name
                                showAllProducts = true
                            } else {
                                showAllProducts = true
                            }
                        }
                    )
                }

                // Quick actions row
                item { QuickActionsRow(onPostRequirement = onPostRequirement) }

                // Popular Products
                if (isLoading && products.isEmpty()) {
                    item { HomeScreenShimmer() }
                } else if (regularProducts.isNotEmpty()) {
                    item {
                        SectionHeader(
                            title = "Popular Products",
                            actionLabel = "View All",
                            onAction = { showAllProducts = true }
                        )
                    }
                    item {
                        LazyRow(
                            contentPadding = PaddingValues(horizontal = 14.dp),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(regularProducts.take(12)) { product ->
                                PopularProductCard(product = product, onClick = { selectedProduct = product })
                            }
                        }
                        Spacer(Modifier.height(4.dp))
                    }
                }

                // Buyer Requirements
                if (requirements.isNotEmpty()) {
                    item {
                        SectionHeader(
                            title = "Buyer Requirements",
                            actionLabel = "Post Requirement",
                            onAction = onPostRequirement
                        )
                    }
                    items(requirements.take(5)) { req ->
                        RequirementCard(req, onClick = { selectedProduct = req })
                    }
                    item { Spacer(Modifier.height(4.dp)) }
                }

                // Featured Stores
                if (stores.isNotEmpty()) {
                    item {
                        SectionHeader(
                            title = "Featured Stores",
                            actionLabel = "View All",
                            onAction = onViewAllStores
                        )
                    }
                    item {
                        LazyRow(
                            contentPadding = PaddingValues(horizontal = 14.dp),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(stores.take(8)) { store ->
                                FeaturedStoreCard(store = store)
                            }
                        }
                        Spacer(Modifier.height(4.dp))
                    }
                }

                item { Spacer(Modifier.height(80.dp)) }
            }
        }
    }
}

// ── Section header ─────────────────────────────────────────────────────────────
@Composable
private fun SectionHeader(title: String, actionLabel: String? = null, onAction: (() -> Unit)? = null) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 10.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(modifier = Modifier.width(3.dp).height(18.dp).background(BrandOrange, RoundedCornerShape(2.dp)))
            Spacer(Modifier.width(8.dp))
            Text(title, fontWeight = FontWeight.Bold, fontSize = 16.sp)
        }
        if (actionLabel != null && onAction != null) {
            TextButton(onClick = onAction, contentPadding = PaddingValues(0.dp)) {
                Text(actionLabel, fontSize = 12.sp, color = BrandOrange)
                Icon(Icons.Default.ChevronRight, null, tint = BrandOrange, modifier = Modifier.size(16.dp))
            }
        }
    }
}

// ── Promotion banner (Indiamart-style) ─────────────────────────────────────────
@Composable
private fun PromotionBanner() {
    val banners = listOf(
        Triple("Grow Your Business", "Post buy requirements & connect with top suppliers", BrandOrange),
        Triple("Verified Suppliers", "500+ verified businesses on BigSpice", Color(0xFF1565C0)),
        Triple("Secure Payments", "Safe & easy trade payments", Color(0xFF2E7D32)),
    )
    var current by remember { mutableIntStateOf(0) }
    val banner = banners[current]

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(14.dp)
            .clip(RoundedCornerShape(12.dp))
            .clickable { current = (current + 1) % banners.size },
        shape = RoundedCornerShape(12.dp),
        color = banner.third.copy(0.12f)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                Icons.Default.Campaign,
                contentDescription = null,
                tint = banner.third,
                modifier = Modifier.size(40.dp).padding(end = 2.dp)
            )
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(banner.first, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = banner.third)
                Text(banner.second, fontSize = 12.sp, color = Color.DarkGray)
            }
            // Page dots
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                banners.forEachIndexed { i, _ ->
                    Box(
                        modifier = Modifier
                            .padding(vertical = 2.dp)
                            .size(if (i == current) 8.dp else 6.dp)
                            .background(if (i == current) banner.third else Color.LightGray, CircleShape)
                    )
                }
            }
        }
    }
}

// ── Category grid ──────────────────────────────────────────────────────────────
@Composable
private fun CategoryGrid(categories: List<Category>, onSelect: (Category) -> Unit) {
    Column(modifier = Modifier.padding(horizontal = 10.dp)) {
        categories.chunked(4).forEach { row ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                row.forEach { cat ->
                    CategoryItem(cat = cat, modifier = Modifier.weight(1f), onClick = { onSelect(cat) })
                }
                repeat(4 - row.size) { Spacer(Modifier.weight(1f)) }
            }
        }
    }
    Spacer(Modifier.height(4.dp))
}

@Composable
private fun CategoryItem(cat: Category, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Column(
        modifier = modifier
            .padding(4.dp)
            .clip(RoundedCornerShape(10.dp))
            .clickable(onClick = onClick)
            .padding(vertical = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(
            modifier = Modifier
                .size(44.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(cat.color.copy(0.12f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(cat.icon, contentDescription = cat.name, tint = cat.color, modifier = Modifier.size(22.dp))
        }
        Spacer(Modifier.height(4.dp))
        Text(
            cat.name,
            fontSize = 10.sp,
            fontWeight = FontWeight.Medium,
            textAlign = TextAlign.Center,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis,
            color = Color(0xFF333333)
        )
    }
}

// ── Quick actions ─────────────────────────────────────────────────────────────
@Composable
private fun QuickActionsRow(onPostRequirement: (() -> Unit)?) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 14.dp, vertical = 6.dp),
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        QuickActionCard(
            icon = Icons.Default.PostAdd,
            label = "Post Buy\nRequirement",
            color = BrandOrange,
            modifier = Modifier.weight(1f),
            onClick = onPostRequirement ?: {}
        )
        QuickActionCard(
            icon = Icons.Default.Store,
            label = "Find\nSuppliers",
            color = Color(0xFF1565C0),
            modifier = Modifier.weight(1f),
            onClick = {}
        )
        QuickActionCard(
            icon = Icons.Default.Verified,
            label = "Verified\nSellers",
            color = Color(0xFF2E7D32),
            modifier = Modifier.weight(1f),
            onClick = {}
        )
    }
}

@Composable
private fun QuickActionCard(
    icon: ImageVector, label: String, color: Color,
    modifier: Modifier = Modifier, onClick: () -> Unit
) {
    Surface(
        modifier = modifier.clickable(onClick = onClick),
        shape = RoundedCornerShape(10.dp),
        color = color.copy(0.08f),
        border = androidx.compose.foundation.BorderStroke(1.dp, color.copy(0.2f))
    ) {
        Column(
            modifier = Modifier.padding(vertical = 12.dp, horizontal = 8.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(icon, contentDescription = null, tint = color, modifier = Modifier.size(24.dp))
            Spacer(Modifier.height(4.dp))
            Text(label, fontSize = 11.sp, color = color, fontWeight = FontWeight.SemiBold,
                textAlign = TextAlign.Center, lineHeight = 14.sp)
        }
    }
}

// ── Popular product card (horizontal scroll) ──────────────────────────────────
@Composable
private fun PopularProductCard(product: Product, onClick: () -> Unit) {
    Card(
        modifier = Modifier.width(150.dp).clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(2.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Column {
            Box(
                modifier = Modifier.fillMaxWidth().height(120.dp).background(Color(0xFFF0F0F0)),
                contentAlignment = Alignment.Center
            ) {
                val imageUrl = product.imageURLs.firstOrNull()
                    ?.let { product.fullImageURL(it, ApiConfig.BASE_URL) }
                if (imageUrl != null) {
                    AsyncImage(
                        model = imageUrl,
                        contentDescription = product.title,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                } else {
                    Icon(Icons.Default.ShoppingBag, null,
                        modifier = Modifier.size(36.dp), tint = Color(0xFFBBBBBB))
                }
                if (product.verified == 1) {
                    Box(
                        modifier = Modifier.align(Alignment.TopEnd).padding(4.dp)
                            .clip(RoundedCornerShape(6.dp)).background(SuccessGreen)
                            .padding(horizontal = 4.dp, vertical = 2.dp)
                    ) { Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(10.dp), tint = Color.White) }
                }
            }
            Column(modifier = Modifier.padding(8.dp)) {
                Text(product.title, fontWeight = FontWeight.SemiBold, fontSize = 12.sp,
                    maxLines = 2, overflow = TextOverflow.Ellipsis, lineHeight = 16.sp)
                Spacer(Modifier.height(2.dp))
                Text(product.priceText, fontWeight = FontWeight.Bold, fontSize = 12.sp, color = BrandOrange)
                product.storeName?.let {
                    Text(it, fontSize = 10.sp, color = Color.Gray, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
            }
        }
    }
}

// ── Requirement card ──────────────────────────────────────────────────────────
@Composable
private fun RequirementCard(product: Product, onClick: () -> Unit) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 14.dp, vertical = 4.dp)
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(10.dp),
        color = Color.White,
        shadowElevation = 1.dp,
        border = androidx.compose.foundation.BorderStroke(1.dp, BrandAmber.copy(0.4f))
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.Top
        ) {
            Box(
                modifier = Modifier.size(42.dp).clip(RoundedCornerShape(8.dp))
                    .background(BrandAmber.copy(0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.ShoppingCart, null, tint = BrandAmber, modifier = Modifier.size(22.dp))
            }
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(product.title, fontWeight = FontWeight.SemiBold, fontSize = 13.sp,
                        modifier = Modifier.weight(1f), maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Surface(
                        shape = RoundedCornerShape(4.dp),
                        color = BrandAmber.copy(0.15f)
                    ) {
                        Text("Requirement", fontSize = 9.sp, color = BrandAmber,
                            modifier = Modifier.padding(horizontal = 5.dp, vertical = 2.dp),
                            fontWeight = FontWeight.SemiBold)
                    }
                }
                if (product.description.isNotBlank()) {
                    Text(product.description, fontSize = 12.sp, color = Color.Gray,
                        maxLines = 2, overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.padding(top = 2.dp))
                }
                Row(
                    modifier = Modifier.padding(top = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.Business, null, tint = Color.Gray, modifier = Modifier.size(12.dp))
                    Spacer(Modifier.width(3.dp))
                    Text(product.storeName ?: "Buyer", fontSize = 11.sp, color = Color.Gray)
                    Spacer(Modifier.weight(1f))
                    Text(product.priceText.takeIf { it.isNotBlank() } ?: "", fontSize = 11.sp, color = BrandOrange, fontWeight = FontWeight.SemiBold)
                }
            }
        }
    }
}

// ── Search results view ───────────────────────────────────────────────────────
@Composable
private fun SearchResultsView(
    filteredProducts: List<Product>,
    isLoading: Boolean,
    errorMessage: String?,
    productViewModel: ProductViewModel,
    onSelect: (Product) -> Unit,
    onBack: () -> Unit
) {
    val selectedCategory by productViewModel.selectedCategory.collectAsState()

    LazyColumn(modifier = Modifier.fillMaxSize()) {
        // Category filter chips
        item {
            Row(
                modifier = Modifier
                    .horizontalScroll(rememberScrollState())
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                TOP_CATEGORIES.dropLast(1).forEach { cat ->
                    FilterChip(
                        selected = selectedCategory == cat.name,
                        onClick = {
                            productViewModel.selectedCategory.value =
                                if (selectedCategory == cat.name) null else cat.name
                        },
                        label = { Text(cat.name, fontSize = 12.sp) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = BrandOrange,
                            selectedLabelColor = Color.White
                        )
                    )
                }
            }
        }

        // Result count + sort + filter
        item {
            var showFilterSheet by remember { mutableStateOf(false) }
            val activeFilterCount = productViewModel.activeFilterCount

            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    "${filteredProducts.size} result${if (filteredProducts.size != 1) "s" else ""}",
                    fontWeight = FontWeight.Bold, fontSize = 14.sp
                )
                Row(horizontalArrangement = Arrangement.spacedBy(0.dp)) {
                    // Filter button
                    BadgedBox(
                        badge = { if (activeFilterCount > 0) Badge { Text("$activeFilterCount") } }
                    ) {
                        TextButton(
                            onClick = { showFilterSheet = true },
                            colors = ButtonDefaults.textButtonColors(contentColor = BrandOrange)
                        ) {
                            Icon(Icons.Default.FilterList, null, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("Filter", fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }
                    SortMenu(productViewModel)
                }
            }

            if (showFilterSheet) {
                FilterBottomSheet(
                    productViewModel = productViewModel,
                    onDismiss = { showFilterSheet = false }
                )
            }
        }

        if (isLoading) {
            item {
                Box(modifier = Modifier.fillMaxWidth().height(200.dp),
                    contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = BrandOrange)
                }
            }
        } else if (errorMessage != null) {
            item {
                Column(modifier = Modifier.fillMaxWidth().padding(32.dp),
                    horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.Warning, contentDescription = null, modifier = Modifier.size(56.dp), tint = Color(0xFFD0D0D0))
                    Spacer(Modifier.height(8.dp))
                    Text("Error Loading Products", fontWeight = FontWeight.Bold)
                    Text(errorMessage, color = Color.Gray, fontSize = 13.sp)
                    Spacer(Modifier.height(12.dp))
                    Button(onClick = { productViewModel.loadProducts() },
                        colors = ButtonDefaults.buttonColors(containerColor = BrandOrange)) {
                        Text("Try Again")
                    }
                }
            }
        } else if (filteredProducts.isEmpty()) {
            item {
                Column(modifier = Modifier.fillMaxWidth().padding(32.dp),
                    horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.Search, contentDescription = null, modifier = Modifier.size(56.dp), tint = Color(0xFFD0D0D0))
                    Spacer(Modifier.height(8.dp))
                    Text("No Products Found", fontWeight = FontWeight.Bold)
                    TextButton(onClick = onBack) { Text("Clear Filters", color = BrandOrange) }
                }
            }
        } else {
            val rows = filteredProducts.chunked(2)
            items(rows.size) { rowIdx ->
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    rows[rowIdx].forEach { product ->
                        ProductCard(product = product, modifier = Modifier.weight(1f),
                            onClick = { onSelect(product) })
                    }
                    if (rows[rowIdx].size == 1) Spacer(Modifier.weight(1f))
                }
                Spacer(Modifier.height(12.dp))
            }
            item { Spacer(Modifier.height(8.dp)) }
        }
    }
}

// ── Sort menu ─────────────────────────────────────────────────────────────────
@Composable
private fun SortMenu(vm: ProductViewModel) {
    val sortOption by vm.sortOption.collectAsState()
    var expanded by remember { mutableStateOf(false) }
    Box {
        TextButton(onClick = { expanded = true },
            colors = ButtonDefaults.textButtonColors(contentColor = BrandOrange)) {
            Icon(Icons.Default.SwapVert, null, modifier = Modifier.size(16.dp))
            Spacer(Modifier.width(4.dp))
            Text("Sort", fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
        }
        DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            DropdownMenuItem(text = { Text("Featured") },
                onClick = { vm.sortOption.value = SortOption.FEATURED; expanded = false })
            DropdownMenuItem(text = { Text("Price: Low to High") },
                onClick = { vm.sortOption.value = SortOption.PRICE_LOW_HIGH; expanded = false })
            DropdownMenuItem(text = { Text("Price: High to Low") },
                onClick = { vm.sortOption.value = SortOption.PRICE_HIGH_LOW; expanded = false })
            DropdownMenuItem(text = { Text("Newest") },
                onClick = { vm.sortOption.value = SortOption.NEWEST; expanded = false })
        }
    }
}

// ── Full product card (grid view) ─────────────────────────────────────────────
@Composable
fun ProductCard(
    product: Product,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Card(
        modifier = modifier.clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(2.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Column {
            Box(
                modifier = Modifier.fillMaxWidth().aspectRatio(1f).background(Color(0xFFF0F0F0)),
                contentAlignment = Alignment.Center
            ) {
                val imageUrl = product.imageURLs.firstOrNull()
                    ?.let { product.fullImageURL(it, ApiConfig.BASE_URL) }
                if (imageUrl != null) {
                    AsyncImage(
                        model = imageUrl,
                        contentDescription = product.title,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                } else {
                    Icon(Icons.Default.ShoppingBag, null,
                        modifier = Modifier.size(40.dp), tint = Color(0xFFBBBBBB))
                }
                if (product.verified == 1) {
                    Box(
                        modifier = Modifier.align(Alignment.TopEnd).padding(6.dp)
                            .clip(RoundedCornerShape(8.dp)).background(SuccessGreen)
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) { Text("Verified", color = Color.White, fontSize = 9.sp, fontWeight = FontWeight.Bold) }
                }
            }
            Column(modifier = Modifier.padding(10.dp)) {
                Text(product.title, fontWeight = FontWeight.SemiBold, fontSize = 13.sp,
                    maxLines = 2, overflow = TextOverflow.Ellipsis)
                product.storeName?.let {
                    Text(it, fontSize = 11.sp, color = Color.Gray, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
                Spacer(Modifier.height(4.dp))
                Text(product.priceText, fontWeight = FontWeight.Bold, fontSize = 13.sp, color = BrandOrange)
                product.averageRating?.let { rating ->
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("★", fontSize = 12.sp, color = StarYellow)
                        Text(" ${"%.1f".format(rating)}", fontSize = 11.sp, color = Color.Gray)
                    }
                }
            }
        }
    }
}

// ── Featured store card ────────────────────────────────────────────────────────
@Composable
private fun FeaturedStoreCard(store: Store) {
    Card(
        modifier = Modifier.width(155.dp),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(2.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Column {
            Box(
                modifier = Modifier.fillMaxWidth().height(72.dp)
                    .background(BrandOrange.copy(0.07f)),
                contentAlignment = Alignment.Center
            ) {
                val logoUrl = store.logo?.let {
                    if (it.startsWith("http")) it else "${ApiConfig.BASE_URL}/uploads/$it"
                } ?: store.profilePicture?.let {
                    if (it.startsWith("http")) it else "${ApiConfig.BASE_URL}/uploads/$it"
                }
                if (logoUrl != null) {
                    AsyncImage(
                        model = logoUrl,
                        contentDescription = store.storeName,
                        modifier = Modifier.size(54.dp).clip(CircleShape),
                        contentScale = ContentScale.Crop
                    )
                } else {
                    Box(
                        modifier = Modifier.size(54.dp).clip(CircleShape)
                            .background(BrandOrange.copy(0.15f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            (store.storeName ?: store.name ?: "?").take(1).uppercase(),
                            fontSize = 22.sp, fontWeight = FontWeight.Bold, color = BrandOrange
                        )
                    }
                }
            }
            Column(modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp)) {
                Text(
                    store.storeName ?: store.name ?: "Store",
                    fontWeight = FontWeight.Bold, fontSize = 12.sp,
                    maxLines = 1, overflow = TextOverflow.Ellipsis
                )
                store.businessType?.let {
                    Text(it, fontSize = 10.sp, color = Color.Gray, maxLines = 1,
                        overflow = TextOverflow.Ellipsis)
                }
                store.location?.let {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(top = 3.dp)
                    ) {
                        Icon(Icons.Default.LocationOn, null, tint = BrandOrange,
                            modifier = Modifier.size(11.dp))
                        Spacer(Modifier.width(2.dp))
                        Text(it, fontSize = 10.sp, color = Color.Gray, maxLines = 1,
                            overflow = TextOverflow.Ellipsis)
                    }
                }
            }
        }
    }
}

// ── Filter bottom sheet ────────────────────────────────────────────────────────
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun FilterBottomSheet(
    productViewModel: ProductViewModel,
    onDismiss: () -> Unit
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    var minPriceText by remember { mutableStateOf(productViewModel.minPrice.value?.toLong()?.toString() ?: "") }
    var maxPriceText by remember { mutableStateOf(productViewModel.maxPrice.value?.toLong()?.toString() ?: "") }
    var selectedRating by remember { mutableStateOf(productViewModel.minRating.value) }
    var localSort by remember { mutableStateOf(productViewModel.sortOption.value) }
    val selectedCategory by productViewModel.selectedCategory.collectAsState()

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = Color.White,
        dragHandle = {
            Box(
                modifier = Modifier
                    .padding(top = 10.dp, bottom = 6.dp)
                    .width(40.dp)
                    .height(4.dp)
                    .clip(RoundedCornerShape(2.dp))
                    .background(Color.LightGray)
            )
        }
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
                .navigationBarsPadding()
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Filters & Sort", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                TextButton(onClick = {
                    minPriceText = ""; maxPriceText = ""; selectedRating = null
                    localSort = SortOption.FEATURED
                    productViewModel.clearFilters()
                    productViewModel.sortOption.value = SortOption.FEATURED
                }) {
                    Text("Clear All", color = BrandOrange)
                }
            }

            HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))

            // Price range
            Text("Price Range (₹)", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = minPriceText,
                    onValueChange = { minPriceText = it },
                    label = { Text("Min") },
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = BrandOrange),
                    shape = RoundedCornerShape(8.dp)
                )
                OutlinedTextField(
                    value = maxPriceText,
                    onValueChange = { maxPriceText = it },
                    label = { Text("Max") },
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = BrandOrange),
                    shape = RoundedCornerShape(8.dp)
                )
            }

            Spacer(Modifier.height(16.dp))

            // Minimum rating
            Text("Minimum Rating", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf(null, 3.0, 3.5, 4.0, 4.5).forEach { rating ->
                    val label = if (rating == null) "Any" else "${"%.1f".format(rating)}★"
                    FilterChip(
                        selected = selectedRating == rating,
                        onClick = { selectedRating = rating },
                        label = { Text(label, fontSize = 12.sp) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = BrandOrange,
                            selectedLabelColor = Color.White
                        )
                    )
                }
            }

            Spacer(Modifier.height(16.dp))

            // Sort
            Text("Sort By", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
            Spacer(Modifier.height(6.dp))
            Column {
                listOf(
                    SortOption.FEATURED to "Featured",
                    SortOption.PRICE_LOW_HIGH to "Price: Low to High",
                    SortOption.PRICE_HIGH_LOW to "Price: High to Low",
                    SortOption.NEWEST to "Newest First"
                ).forEach { (option, label) ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .clickable { localSort = option }
                            .padding(vertical = 4.dp, horizontal = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        RadioButton(
                            selected = localSort == option,
                            onClick = { localSort = option },
                            colors = RadioButtonDefaults.colors(selectedColor = BrandOrange)
                        )
                        Spacer(Modifier.width(8.dp))
                        Text(label, fontSize = 14.sp)
                    }
                }
            }

            Spacer(Modifier.height(20.dp))

            // Apply button
            Button(
                onClick = {
                    productViewModel.minPrice.value = minPriceText.toDoubleOrNull()
                    productViewModel.maxPrice.value = maxPriceText.toDoubleOrNull()
                    productViewModel.minRating.value = selectedRating
                    productViewModel.sortOption.value = localSort
                    onDismiss()
                },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(10.dp),
                colors = ButtonDefaults.buttonColors(containerColor = BrandOrange)
            ) {
                Text("Apply Filters", fontWeight = FontWeight.Bold, fontSize = 15.sp)
            }
            Spacer(Modifier.height(8.dp))
        }
    }
}
