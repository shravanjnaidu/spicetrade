package com.spicetrade.app.ui.screens.stores

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import com.spicetrade.app.data.models.Store
import com.spicetrade.app.ui.screens.products.ProductCard
import com.spicetrade.app.ui.theme.BrandRed
import com.spicetrade.app.viewmodel.ProductViewModel
import com.spicetrade.app.viewmodel.StoreViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StoreDetailScreen(
    store: Store,
    storeViewModel: StoreViewModel,
    productViewModel: ProductViewModel = viewModel(),
    onBack: () -> Unit
) {
    LaunchedEffect(store.id) {
        storeViewModel.incrementView(store.id)
    }

    val allProducts by productViewModel.products.collectAsState()
    val storeProducts = remember(allProducts) { allProducts.filter { it.userId == store.id } }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(store.storeName ?: "Store", maxLines = 1, overflow = TextOverflow.Ellipsis) },
                navigationIcon = {
                    IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, "Back") }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = BrandRed,
                    titleContentColor = Color.White,
                    navigationIconContentColor = Color.White
                )
            )
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(innerPadding),
            contentPadding = PaddingValues(bottom = 16.dp)
        ) {
            // Store header card
            item {
                Card(
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                    shape = RoundedCornerShape(16.dp),
                    elevation = CardDefaults.cardElevation(2.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier.size(80.dp).clip(CircleShape).background(Color(0xFFF0F0F0)),
                                contentAlignment = Alignment.Center
                            ) {
                                val logoUrl = store.logo?.let { if (it.startsWith("http")) it else "${ApiConfig.BASE_URL}$it" }
                                if (logoUrl != null) {
                                    AsyncImage(
                                        model = logoUrl,
                                        contentDescription = null,
                                        modifier = Modifier.fillMaxSize().clip(CircleShape),
                                        contentScale = ContentScale.Crop
                                    )
                                } else {
                                    Text("🏪", fontSize = 36.sp)
                                }
                            }
                            Spacer(Modifier.width(12.dp))
                            Column {
                                Text(store.storeName ?: "Store", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                                store.tagline?.let { Text(it, fontSize = 13.sp, color = Color.Gray) }
                                store.businessType?.let {
                                    AssistChip(onClick = {}, label = { Text(it, fontSize = 11.sp) })
                                }
                            }
                        }

                        store.storeDescription?.let {
                            Spacer(Modifier.height(12.dp))
                            Text(it, fontSize = 14.sp, color = Color.DarkGray, lineHeight = 20.sp)
                        }

                        Spacer(Modifier.height(12.dp))
                        HorizontalDivider()
                        Spacer(Modifier.height(12.dp))

                        InfoRow(Icons.Default.LocationOn, store.location ?: store.address)
                        InfoRow(Icons.Default.Category, store.categories)
                        InfoRow(Icons.Default.Language, store.website)
                        InfoRow(Icons.Default.Phone, store.phone)
                    }
                }
            }

            // Store details card
            if (store.yearEstablished != null || store.employeeCount != null || store.annualTurnover != null) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text("Business Info", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                            Spacer(Modifier.height(8.dp))
                            store.yearEstablished?.let { InfoRow(Icons.Default.CalendarToday, "Est. $it") }
                            store.employeeCount?.let { InfoRow(Icons.Default.People, "$it employees") }
                            store.annualTurnover?.let { InfoRow(Icons.Default.TrendingUp, it) }
                        }
                    }
                    Spacer(Modifier.height(12.dp))
                }
            }

            // Products from this store
            if (storeProducts.isNotEmpty()) {
                item {
                    Text(
                        "Products (${storeProducts.size})",
                        fontWeight = FontWeight.Bold, fontSize = 16.sp,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                    )
                }
                val rows = storeProducts.chunked(2)
                items(rows) { row ->
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        row.forEach { product ->
                            ProductCard(product = product, modifier = Modifier.weight(1f), onClick = {})
                        }
                        if (row.size == 1) Spacer(Modifier.weight(1f))
                    }
                    Spacer(Modifier.height(12.dp))
                }
            }
        }
    }
}

@Composable
private fun InfoRow(icon: androidx.compose.ui.graphics.vector.ImageVector, text: String?) {
    if (text.isNullOrBlank()) return
    Row(modifier = Modifier.padding(vertical = 3.dp), verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, null, modifier = Modifier.size(16.dp), tint = BrandRed)
        Spacer(Modifier.width(8.dp))
        Text(text, fontSize = 13.sp, color = Color.DarkGray)
    }
}
