package com.spicetrade.app.ui.screens.seller

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.spicetrade.app.R
import com.spicetrade.app.data.models.Product
import com.spicetrade.app.ui.theme.BrandDark
import com.spicetrade.app.ui.theme.BrandOrange
import com.spicetrade.app.viewmodel.AuthViewModel
import com.spicetrade.app.viewmodel.ProductViewModel

@Composable
fun SellerDashboardScreen(
    authViewModel: AuthViewModel,
    productViewModel: ProductViewModel = hiltViewModel()
) {
    val currentUser by authViewModel.currentUser.collectAsState()
    val allProducts by productViewModel.products.collectAsState()
    val isLoading by productViewModel.isLoading.collectAsState()

    val myProducts = remember(allProducts, currentUser) {
        allProducts.filter { it.userId == currentUser?.id }
    }

    var showAddDialog by remember { mutableStateOf(false) }
    var productToDelete by remember { mutableStateOf<Product?>(null) }

    Column(modifier = Modifier.fillMaxSize().background(Color.White)) {
        // Header
        Column(modifier = Modifier.fillMaxWidth().background(Color.White)) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 14.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Image(
                        painter = painterResource(R.drawable.bigspicelogo),
                        contentDescription = "BigSpice",
                        modifier = Modifier.size(36.dp)
                    )
                    Spacer(Modifier.width(8.dp))
                    Column {
                        Text("Seller Dashboard", fontSize = 18.sp, fontWeight = FontWeight.Black, color = Color(0xFF222222))
                        currentUser?.storeName?.let {
                            Text(it, fontSize = 12.sp, color = Color(0xFF666666))
                        }
                    }
                }
            }
            HorizontalDivider(color = Color(0xFFE9E9E9), thickness = 1.dp)
        }

        // Stats row
        Row(
            modifier = Modifier.fillMaxWidth().background(Color.White).padding(16.dp),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            StatCard("${myProducts.size}", "Listings")
            StatCard("${myProducts.sumOf { it.views ?: 0 }}", "Views")
            StatCard(if (myProducts.isNotEmpty()) "${"%,.1f".format(myProducts.mapNotNull { it.averageRating }.average())}" else "—", "Avg Rating")
        }

        Spacer(Modifier.height(8.dp))

        // Listings
        Row(
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("My Listings", fontWeight = FontWeight.Bold, fontSize = 17.sp, modifier = Modifier.weight(1f))
            FloatingActionButton(
                onClick = { showAddDialog = true },
                containerColor = BrandOrange,
                contentColor = Color.White,
                modifier = Modifier.size(40.dp)
            ) {
                Icon(Icons.Default.Add, "Add Listing", modifier = Modifier.size(20.dp))
            }
        }

        if (isLoading && myProducts.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = BrandOrange)
            }
        } else if (myProducts.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("📦", fontSize = 48.sp)
                    Text("No Listings Yet", fontWeight = FontWeight.Bold)
                    Text("Tap + to create your first listing", color = Color.Gray, fontSize = 13.sp)
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 4.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(myProducts) { product ->
                    SellerProductRow(
                        product = product,
                        onDelete = { productToDelete = product }
                    )
                }
                item { Spacer(Modifier.height(16.dp)) }
            }
        }
    }

    // Delete confirmation
    productToDelete?.let { p ->
        AlertDialog(
            onDismissRequest = { productToDelete = null },
            title = { Text("Delete Listing") },
            text = { Text("Are you sure you want to delete \"${p.title}\"? This cannot be undone.") },
            confirmButton = {
                TextButton(onClick = {
                    productViewModel.deleteProduct(p)
                    productToDelete = null
                }) { Text("Delete", color = Color.Red) }
            },
            dismissButton = {
                TextButton(onClick = { productToDelete = null }) { Text("Cancel") }
            }
        )
    }

    if (showAddDialog) {
        AddListingDialog(
            currentUserId = currentUser?.id ?: 0,
            productViewModel = productViewModel,
            onDismiss = { showAddDialog = false }
        )
    }
}

@Composable
private fun StatCard(value: String, label: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, fontWeight = FontWeight.Black, fontSize = 20.sp, color = BrandOrange)
        Text(label, fontSize = 11.sp, color = Color.Gray)
    }
}

@Composable
private fun SellerProductRow(product: Product, onDelete: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(1.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        product.title,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 14.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f)
                    )
                    if (product.verified == 1) {
                        Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(14.dp), tint = Color(0xFF22C55E))
                    }
                }
                Text(product.priceText, fontSize = 13.sp, color = BrandOrange, fontWeight = FontWeight.Bold)
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("👁 ${product.views ?: 0}", fontSize = 11.sp, color = Color.Gray)
                    product.reviewCount?.let { Text("⭐ $it reviews", fontSize = 11.sp, color = Color.Gray) }
                }
            }
            IconButton(onClick = onDelete) {
                Icon(Icons.Default.Delete, "Delete", tint = Color.Red.copy(alpha = 0.7f), modifier = Modifier.size(20.dp))
            }
        }
    }
}

@Composable
private fun AddListingDialog(
    currentUserId: Int,
    productViewModel: ProductViewModel,
    onDismiss: () -> Unit
) {
    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var price by remember { mutableStateOf("") }
    var unit by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("") }
    var listingType by remember { mutableStateOf("product") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add New Listing") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(value = title, onValueChange = { title = it }, label = { Text("Title *") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = description, onValueChange = { description = it }, label = { Text("Description *") }, modifier = Modifier.fillMaxWidth(), minLines = 2)
                OutlinedTextField(value = price, onValueChange = { price = it }, label = { Text("Price (₹)") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = unit, onValueChange = { unit = it }, label = { Text("Unit (kg, ton, etc.)") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = category, onValueChange = { category = it }, label = { Text("Category") }, modifier = Modifier.fillMaxWidth())
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(
                        selected = listingType == "product",
                        onClick = { listingType = "product" },
                        label = { Text("Product") }
                    )
                    FilterChip(
                        selected = listingType == "requirement",
                        onClick = { listingType = "requirement" },
                        label = { Text("Requirement") }
                    )
                }
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    if (title.isNotBlank() && description.isNotBlank()) {
                        val body = buildMap<String, Any?> {
                            put("title", title)
                            put("description", description)
                            put("userId", currentUserId)
                            price.toDoubleOrNull()?.let { put("price", it) }
                            if (unit.isNotBlank()) put("unit", unit)
                            if (category.isNotBlank()) put("category", category)
                            put("listingType", listingType)
                        }
                        productViewModel.createListing(body)
                        onDismiss()
                    }
                }
            ) { Text("Add Listing", color = BrandOrange) }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
}


