package com.spicetrade.app.ui.screens.stores

import androidx.compose.foundation.background
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
import androidx.lifecycle.viewmodel.compose.viewModel
import coil.compose.AsyncImage
import com.spicetrade.app.data.api.ApiConfig
import com.spicetrade.app.data.models.Store
import com.spicetrade.app.ui.theme.BrandOrange
import com.spicetrade.app.ui.theme.BrandRed
import com.spicetrade.app.viewmodel.AuthViewModel
import com.spicetrade.app.viewmodel.StoreViewModel

@Composable
fun StoresListScreen(
    authViewModel: AuthViewModel,
    storeViewModel: StoreViewModel = viewModel()
) {
    val isLoading by storeViewModel.isLoading.collectAsState()
    val errorMessage by storeViewModel.errorMessage.collectAsState()
    val searchText by storeViewModel.searchText.collectAsState()

    var selectedStore by remember { mutableStateOf<Store?>(null) }

    if (selectedStore != null) {
        StoreDetailScreen(
            store = selectedStore!!,
            storeViewModel = storeViewModel,
            onBack = { selectedStore = null }
        )
        return
    }

    val filtered = storeViewModel.filteredStores

    Column(modifier = Modifier.fillMaxSize().background(Color(0xFFF5F5F5))) {
        // Header
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Brush.horizontalGradient(listOf(BrandRed, BrandOrange)))
                .padding(16.dp)
        ) {
            Column {
                Text("Stores", fontSize = 22.sp, fontWeight = FontWeight.Black, color = Color.White)
                Spacer(Modifier.height(10.dp))
                OutlinedTextField(
                    value = searchText,
                    onValueChange = { storeViewModel.searchText.value = it },
                    placeholder = { Text("Search stores…", color = Color.White.copy(alpha = 0.7f)) },
                    leadingIcon = { Icon(Icons.Default.Search, null, tint = Color.White) },
                    trailingIcon = {
                        if (searchText.isNotEmpty()) {
                            IconButton(onClick = { storeViewModel.searchText.value = "" }) {
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

        if (isLoading && filtered.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = BrandRed)
            }
        } else if (errorMessage != null) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("⚠️", fontSize = 48.sp)
                    Text(errorMessage ?: "Error loading stores")
                    Button(
                        onClick = { storeViewModel.loadStores() },
                        colors = ButtonDefaults.buttonColors(containerColor = BrandRed)
                    ) { Text("Try Again") }
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(filtered) { store ->
                    StoreCard(store = store, onClick = { selectedStore = store })
                }
            }
        }
    }
}

@Composable
fun StoreCard(store: Store, onClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(2.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            // Logo
            Box(
                modifier = Modifier.size(64.dp).clip(CircleShape).background(Color(0xFFF0F0F0)),
                contentAlignment = Alignment.Center
            ) {
                val logoUrl = store.logo?.let { url ->
                    if (url.startsWith("http")) url else "${ApiConfig.BASE_URL}$url"
                }
                if (logoUrl != null) {
                    AsyncImage(
                        model = logoUrl,
                        contentDescription = null,
                        modifier = Modifier.fillMaxSize().clip(CircleShape),
                        contentScale = ContentScale.Crop
                    )
                } else {
                    Text("🏪", fontSize = 28.sp)
                }
            }

            Spacer(Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    store.storeName ?: store.name ?: "Unknown Store",
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                store.businessType?.let {
                    Text(it, fontSize = 12.sp, color = Color.Gray, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
                store.location?.let {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.LocationOn, null, modifier = Modifier.size(12.dp), tint = Color.Gray)
                        Text(it, fontSize = 12.sp, color = Color.Gray)
                    }
                }
                store.categories?.let {
                    Text(it, fontSize = 11.sp, color = BrandRed, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
            }

            Icon(Icons.Default.ChevronRight, null, tint = Color.Gray)
        }
    }
}
