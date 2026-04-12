package com.spicetrade.app.ui.screens.products

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
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
import com.spicetrade.app.ui.theme.BrandOrange
import com.spicetrade.app.ui.theme.BrandRed
import com.spicetrade.app.viewmodel.AuthViewModel
import com.spicetrade.app.viewmodel.ProductViewModel
import com.spicetrade.app.viewmodel.SortOption

private val CATEGORIES = listOf(
    "Spices & Herbs", "Pulses & Legumes", "Tea & Coffee",
    "Nuts & Dry Fruits", "Grains & Cereals", "Oils & Fats",
    "Sugar & Sweeteners", "Organic Products"
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProductsListScreen(
    authViewModel: AuthViewModel,
    productViewModel: ProductViewModel = viewModel()
) {
    val products by productViewModel.products.collectAsState()
    val isLoading by productViewModel.isLoading.collectAsState()
    val errorMessage by productViewModel.errorMessage.collectAsState()
    val searchText by productViewModel.searchText.collectAsState()
    val selectedCategory by productViewModel.selectedCategory.collectAsState()

    var selectedProduct by remember { mutableStateOf<Product?>(null) }

    if (selectedProduct != null) {
        ProductDetailScreen(
            product = selectedProduct!!,
            authViewModel = authViewModel,
            onBack = { selectedProduct = null }
        )
        return
    }

    val filtered = productViewModel.filteredProducts

    Column(modifier = Modifier.fillMaxSize().background(Color(0xFFF5F5F5))) {
        // Top app bar
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Brush.horizontalGradient(listOf(BrandRed, BrandOrange)))
                .padding(horizontal = 16.dp, vertical = 12.dp)
        ) {
            Column {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("🌶️", fontSize = 28.sp)
                    Spacer(Modifier.width(8.dp))
                    Text("SpiceTrade", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color.White)
                }
                Spacer(Modifier.height(10.dp))
                OutlinedTextField(
                    value = searchText,
                    onValueChange = { productViewModel.searchText.value = it },
                    placeholder = { Text("Search spices, grains, pulses…", color = Color.White.copy(alpha = 0.7f)) },
                    leadingIcon = { Icon(Icons.Default.Search, null, tint = Color.White) },
                    trailingIcon = {
                        if (searchText.isNotEmpty()) {
                            IconButton(onClick = { productViewModel.searchText.value = "" }) {
                                Icon(Icons.Default.Close, null, tint = Color.White)
                            }
                        }
                    },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Color.White.copy(alpha = 0.7f),
                        unfocusedBorderColor = Color.White.copy(alpha = 0.4f),
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        cursorColor = Color.White
                    ),
                    shape = RoundedCornerShape(12.dp)
                )
            }
        }

        LazyColumn(modifier = Modifier.fillMaxSize()) {
            // Category chips
            if (searchText.isEmpty() && !productViewModel.hasActiveFilters) {
                item {
                    Text(
                        "Shop by Category",
                        fontWeight = FontWeight.Bold, fontSize = 16.sp,
                        modifier = Modifier.padding(start = 16.dp, top = 16.dp, bottom = 8.dp)
                    )
                    Row(
                        modifier = Modifier
                            .horizontalScroll(rememberScrollState())
                            .padding(horizontal = 12.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        CATEGORIES.forEach { cat ->
                            FilterChip(
                                selected = selectedCategory == cat,
                                onClick = {
                                    productViewModel.selectedCategory.value =
                                        if (selectedCategory == cat) null else cat
                                },
                                label = { Text(cat, fontSize = 12.sp) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = BrandRed,
                                    selectedLabelColor = Color.White
                                )
                            )
                        }
                    }
                    Spacer(Modifier.height(8.dp))
                }
            }

            // Sort row
            item {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        if (searchText.isNotEmpty() || productViewModel.hasActiveFilters)
                            "${filtered.size} result${if (filtered.size != 1) "s" else ""}"
                        else "All Products",
                        fontWeight = FontWeight.Bold, fontSize = 16.sp
                    )
                    SortMenu(productViewModel)
                }
            }

            // Grid of products
            if (isLoading && products.isEmpty()) {
                item {
                    Box(modifier = Modifier.fillMaxWidth().height(300.dp), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = BrandRed)
                    }
                }
            } else if (errorMessage != null) {
                item {
                    Column(
                        modifier = Modifier.fillMaxWidth().padding(32.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("⚠️", fontSize = 48.sp)
                        Text("Error Loading Products", fontWeight = FontWeight.Bold)
                        Text(errorMessage ?: "", color = Color.Gray, fontSize = 13.sp)
                        Spacer(Modifier.height(12.dp))
                        Button(onClick = { productViewModel.loadProducts() }, colors = ButtonDefaults.buttonColors(containerColor = BrandRed)) {
                            Text("Try Again")
                        }
                    }
                }
            } else if (filtered.isEmpty()) {
                item {
                    Column(
                        modifier = Modifier.fillMaxWidth().padding(32.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("🔍", fontSize = 48.sp)
                        Text("No Products Found", fontWeight = FontWeight.Bold)
                        if (productViewModel.hasActiveFilters || searchText.isNotEmpty()) {
                            TextButton(onClick = { productViewModel.clearFilters(); productViewModel.searchText.value = "" }) {
                                Text("Clear Filters")
                            }
                        }
                    }
                }
            } else {
                // Chunked 2-column grid in a LazyColumn
                val rows = filtered.chunked(2)
                items(rows.size) { rowIdx ->
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        rows[rowIdx].forEach { product ->
                            ProductCard(
                                product = product,
                                modifier = Modifier.weight(1f),
                                onClick = { selectedProduct = product }
                            )
                        }
                        if (rows[rowIdx].size == 1) Spacer(Modifier.weight(1f))
                    }
                    Spacer(Modifier.height(12.dp))
                }
                item { Spacer(Modifier.height(8.dp)) }
            }
        }
    }
}

@Composable
private fun SortMenu(vm: ProductViewModel) {
    val sortOption by vm.sortOption.collectAsState()
    var expanded by remember { mutableStateOf(false) }

    Box {
        TextButton(
            onClick = { expanded = true },
            colors = ButtonDefaults.textButtonColors(contentColor = BrandOrange)
        ) {
            Icon(Icons.Default.SwapVert, null, modifier = Modifier.size(16.dp))
            Spacer(Modifier.width(4.dp))
            Text("Sort", fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
        }
        DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            DropdownMenuItem(text = { Text("Featured") }, onClick = { vm.sortOption.value = SortOption.FEATURED; expanded = false })
            DropdownMenuItem(text = { Text("Price: Low to High") }, onClick = { vm.sortOption.value = SortOption.PRICE_LOW_HIGH; expanded = false })
            DropdownMenuItem(text = { Text("Price: High to Low") }, onClick = { vm.sortOption.value = SortOption.PRICE_HIGH_LOW; expanded = false })
            DropdownMenuItem(text = { Text("Newest") }, onClick = { vm.sortOption.value = SortOption.NEWEST; expanded = false })
        }
    }
}

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
                val imageUrl = product.imageURLs.firstOrNull()?.let { product.fullImageURL(it, ApiConfig.BASE_URL) }
                if (imageUrl != null) {
                    AsyncImage(
                        model = imageUrl,
                        contentDescription = product.title,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                } else {
                    Text("🫙", fontSize = 40.sp)
                }
                if (product.verified == 1) {
                    Box(
                        modifier = Modifier.align(Alignment.TopEnd).padding(6.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(Color(0xFF22C55E))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text("✓", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
            Column(modifier = Modifier.padding(10.dp)) {
                Text(
                    product.title,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 13.sp,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
                product.storeName?.let {
                    Text(it, fontSize = 11.sp, color = Color.Gray, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
                Spacer(Modifier.height(4.dp))
                Text(product.priceText, fontWeight = FontWeight.Bold, fontSize = 13.sp, color = BrandRed)
                product.averageRating?.let { rating ->
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("★", fontSize = 12.sp, color = Color(0xFFFBBC05))
                        Text(" ${"%.1f".format(rating)}", fontSize = 11.sp, color = Color.Gray)
                    }
                }
            }
        }
    }
}
