package com.spicetrade.app.ui.screens.cart

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.spicetrade.app.data.api.ApiConfig
import com.spicetrade.app.data.models.CartItem
import com.spicetrade.app.ui.theme.BrandAmber
import com.spicetrade.app.ui.theme.BrandDark
import com.spicetrade.app.ui.theme.BrandOrange
import com.spicetrade.app.ui.theme.SuccessGreen
import com.spicetrade.app.viewmodel.CartViewModel

@Composable
fun CartScreen(
    cartViewModel: CartViewModel,
    onBack: () -> Unit,
    onCheckout: () -> Unit = {}
) {
    val items by cartViewModel.items.collectAsState()
    val total by cartViewModel.cartTotal.collectAsState()
    var showClearDialog by remember { mutableStateOf(false) }

    Column(modifier = Modifier.fillMaxSize().background(Color.White)) {

        // ── Header ─────────────────────────────────────────────────────────────
        Column(modifier = Modifier.fillMaxWidth().background(Color.White).statusBarsPadding()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 4.dp, vertical = 4.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, "Back", tint = BrandOrange)
                    }
                    Text(
                        "My Cart",
                        fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color(0xFF222222),
                        modifier = Modifier.weight(1f)
                    )
                    if (items.isNotEmpty()) {
                        Text(
                            "${items.sumOf { it.quantity }} item${if (items.sumOf { it.quantity } != 1) "s" else ""}",
                            fontSize = 12.sp, color = Color(0xFF666666),
                            modifier = Modifier.padding(end = 8.dp)
                        )
                        IconButton(onClick = { showClearDialog = true }) {
                            Icon(Icons.Default.DeleteOutline, "Clear cart", tint = BrandOrange)
                        }
                    }
                }
            }
            HorizontalDivider(color = Color(0xFFE9E9E9), thickness = 1.dp)
        }

        if (items.isEmpty()) {
            // ── Empty state ────────────────────────────────────────────────────
            Column(
                modifier = Modifier.fillMaxSize(),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Box(
                    modifier = Modifier
                        .size(120.dp)
                        .clip(CircleShape)
                        .background(Color(0xFFF0EBE3)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        Icons.Default.ShoppingCart,
                        contentDescription = null,
                        modifier = Modifier.size(56.dp),
                        tint = BrandOrange.copy(0.5f)
                    )
                }
                Spacer(Modifier.height(20.dp))
                Text("Your cart is empty", fontWeight = FontWeight.Bold, fontSize = 20.sp)
                Spacer(Modifier.height(8.dp))
                Text(
                    "Browse products and add them to your cart",
                    fontSize = 14.sp, color = Color.Gray
                )
                Spacer(Modifier.height(28.dp))
                Button(
                    onClick = onBack,
                    colors = ButtonDefaults.buttonColors(containerColor = BrandOrange),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.padding(horizontal = 32.dp).fillMaxWidth()
                ) {
                    Icon(Icons.Default.ShoppingBag, null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("Browse Products", fontSize = 15.sp)
                }
            }
        } else {
            // ── Cart items ─────────────────────────────────────────────────────
            LazyColumn(
                modifier = Modifier.weight(1f),
                contentPadding = PaddingValues(12.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(items, key = { it.product.id }) { item ->
                    CartItemRow(
                        item = item,
                        onIncrement = { cartViewModel.updateQuantity(item.product.id, 1) },
                        onDecrement = { cartViewModel.updateQuantity(item.product.id, -1) },
                        onRemove = { cartViewModel.removeFromCart(item.product.id) }
                    )
                }
                item { Spacer(Modifier.height(4.dp)) }
            }

            // ── Order summary + CTA ────────────────────────────────────────────
            Surface(
                modifier = Modifier.fillMaxWidth(),
                color = Color.White,
                shadowElevation = 12.dp,
                shape = RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp)
            ) {
                Column(
                    modifier = Modifier
                        .navigationBarsPadding()
                        .padding(horizontal = 16.dp, vertical = 16.dp)
                ) {
                    Text("Order Summary", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    Spacer(Modifier.height(10.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            "${items.sumOf { it.quantity }} item${if (items.sumOf { it.quantity } != 1) "s" else ""}",
                            fontSize = 14.sp, color = Color.Gray
                        )
                        Text(
                            if (total > 0) "₹${"%.2f".format(total)}" else "Price on request",
                            fontSize = 14.sp, fontWeight = FontWeight.SemiBold
                        )
                    }
                    if (total > 0) {
                        Spacer(Modifier.height(4.dp))
                        HorizontalDivider(color = Color(0xFFEEEEEE))
                        Spacer(Modifier.height(8.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Total (estimated)", fontSize = 15.sp, fontWeight = FontWeight.Bold)
                            Text(
                                "₹${"%.2f".format(total)}",
                                fontSize = 17.sp, fontWeight = FontWeight.ExtraBold, color = BrandOrange
                            )
                        }
                        Spacer(Modifier.height(4.dp))
                        Text(
                            "* Final price subject to seller confirmation",
                            fontSize = 11.sp, color = Color.Gray
                        )
                    }
                    Spacer(Modifier.height(14.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        OutlinedButton(
                            onClick = { /* post requirement for all items */ },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = BrandOrange),
                            border = androidx.compose.foundation.BorderStroke(1.5.dp, BrandOrange)
                        ) {
                            Icon(Icons.Default.RequestQuote, null, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("Request Quotes", fontSize = 13.sp)
                        }
                        Button(
                            onClick = onCheckout,
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = BrandOrange)
                        ) {
                            Text("Proceed", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }

    if (showClearDialog) {
        AlertDialog(
            onDismissRequest = { showClearDialog = false },
            title = { Text("Clear Cart?") },
            text = { Text("Remove all ${items.size} item${if (items.size != 1) "s" else ""} from your cart?") },
            confirmButton = {
                TextButton(onClick = {
                    cartViewModel.clearCart()
                    showClearDialog = false
                }) { Text("Clear All", color = Color.Red) }
            },
            dismissButton = {
                TextButton(onClick = { showClearDialog = false }) { Text("Cancel") }
            }
        )
    }
}

// ── Cart item row ──────────────────────────────────────────────────────────────
@Composable
private fun CartItemRow(
    item: CartItem,
    onIncrement: () -> Unit,
    onDecrement: () -> Unit,
    onRemove: () -> Unit
) {
    val product = item.product
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        elevation = CardDefaults.cardElevation(2.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.Top
        ) {
            // Product image
            Box(
                modifier = Modifier
                    .size(88.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(Color(0xFFF0F0F0)),
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
                    Icon(
                        Icons.Default.ShoppingBag, null,
                        modifier = Modifier.size(32.dp), tint = Color(0xFFBBBBBB)
                    )
                }
                if (product.verified == 1) {
                    Box(
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .padding(3.dp)
                            .clip(CircleShape)
                            .background(SuccessGreen)
                            .size(16.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(10.dp), tint = Color.White)
                    }
                }
            }

            Spacer(Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Row(modifier = Modifier.fillMaxWidth()) {
                    Text(
                        product.title,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 14.sp,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f)
                    )
                    IconButton(
                        onClick = onRemove,
                        modifier = Modifier.size(28.dp).padding(0.dp)
                    ) {
                        Icon(
                            Icons.Default.Close,
                            contentDescription = "Remove",
                            tint = Color.Gray,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }

                product.storeName?.let {
                    Text(it, fontSize = 11.sp, color = Color.Gray, maxLines = 1,
                        overflow = TextOverflow.Ellipsis)
                }

                Spacer(Modifier.height(6.dp))

                Text(
                    product.priceText,
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp,
                    color = BrandOrange
                )

                product.minOrder?.let {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(top = 2.dp)
                    ) {
                        Surface(
                            shape = RoundedCornerShape(4.dp),
                            color = BrandAmber.copy(0.12f)
                        ) {
                            Text(
                                "MOQ: $it ${product.unit ?: "units"}",
                                fontSize = 10.sp,
                                color = BrandAmber,
                                fontWeight = FontWeight.SemiBold,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }
                }

                Spacer(Modifier.height(8.dp))

                // Quantity controls
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    // Decrement / Remove button
                    Box(
                        modifier = Modifier
                            .size(30.dp)
                            .clip(CircleShape)
                            .background(if (item.quantity <= 1) Color(0xFFFFEEEE) else Color(0xFFF5F0E8))
                            .border(1.dp, if (item.quantity <= 1) Color.Red.copy(0.3f) else Color.LightGray, CircleShape)
                            .clickable(onClick = onDecrement),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            if (item.quantity <= 1) Icons.Default.Delete else Icons.Default.Remove,
                            contentDescription = "Decrease",
                            modifier = Modifier.size(14.dp),
                            tint = if (item.quantity <= 1) Color.Red else Color.DarkGray
                        )
                    }

                    Text(
                        "${item.quantity}",
                        modifier = Modifier.padding(horizontal = 16.dp),
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    )

                    Box(
                        modifier = Modifier
                            .size(30.dp)
                            .clip(CircleShape)
                            .background(BrandOrange.copy(0.08f))
                            .border(1.dp, BrandOrange.copy(0.5f), CircleShape)
                            .clickable(onClick = onIncrement),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.Default.Add,
                            contentDescription = "Increase",
                            modifier = Modifier.size(14.dp),
                            tint = BrandOrange
                        )
                    }

                    // Line total
                    Spacer(Modifier.weight(1f))
                    if (product.price != null && product.price > 0) {
                        Text(
                            "₹${"%.0f".format(product.price * item.quantity)}",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.DarkGray
                        )
                    }
                }
            }
        }
    }
}
