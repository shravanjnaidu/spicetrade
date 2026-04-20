package com.spicetrade.app.ui.screens.stores

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
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
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.spicetrade.app.ui.components.StoreCardShimmer
import com.spicetrade.app.R
import com.spicetrade.app.data.api.ApiConfig
import com.spicetrade.app.data.models.Store
import com.spicetrade.app.ui.theme.BrandDark
import com.spicetrade.app.ui.theme.BrandOrange
import com.spicetrade.app.viewmodel.AuthViewModel
import com.spicetrade.app.viewmodel.StoreViewModel

@Composable
fun StoresListScreen(
    authViewModel: AuthViewModel,
    storeViewModel: StoreViewModel = hiltViewModel()
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

    Column(modifier = Modifier.fillMaxSize().background(Color.White)) {
        // Header
        Column(modifier = Modifier.fillMaxWidth().background(Color.White)) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 14.dp)
            ) {
                Column {
                    // Logo + brand row
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Image(
                            painter = painterResource(R.drawable.bigspicelogo),
                            contentDescription = "BigSpice",
                            modifier = Modifier.size(36.dp).clip(RoundedCornerShape(8.dp))
                        )
                        Spacer(Modifier.width(8.dp))
                        Column {
                            Text("BigSpice", fontSize = 18.sp, fontWeight = FontWeight.Black, color = Color(0xFF222222))
                            Text("Suppliers & Stores", fontSize = 11.sp, color = Color(0xFF666666))
                        }
                    }
                    Spacer(Modifier.height(12.dp))
                    // Inline search bar
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(24.dp))
                            .background(Color(0xFFF5F5F5))
                            .padding(horizontal = 12.dp, vertical = 10.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Search, null, tint = BrandOrange, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(8.dp))
                            BasicTextField(
                                value = searchText,
                                onValueChange = { storeViewModel.searchText.value = it },
                                singleLine = true,
                                modifier = Modifier.weight(1f),
                                textStyle = TextStyle(fontSize = 14.sp, color = Color(0xFF333333)),
                                decorationBox = { inner ->
                                    if (searchText.isEmpty()) Text("Search stores, categories…", fontSize = 14.sp, color = Color(0xFFAAAAAA))
                                    inner()
                                }
                            )
                            if (searchText.isNotEmpty()) {
                                IconButton(onClick = { storeViewModel.searchText.value = "" }, modifier = Modifier.size(18.dp)) {
                                    Icon(Icons.Default.Close, null, tint = Color.Gray, modifier = Modifier.size(14.dp))
                                }
                            }
                        }
                    }
                }
            }
            HorizontalDivider(color = Color(0xFFE9E9E9), thickness = 1.dp)
        }

        if (isLoading && filtered.isEmpty()) {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(6) { StoreCardShimmer() }
            }
        } else if (errorMessage != null) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.Warning, contentDescription = null, modifier = Modifier.size(48.dp), tint = Color(0xFFD0D0D0))
                    Spacer(Modifier.height(8.dp))
                    Text(errorMessage ?: "Error loading stores")
                    Button(
                        onClick = { storeViewModel.loadStores() },
                        colors = ButtonDefaults.buttonColors(containerColor = BrandOrange)
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
                    Icon(Icons.Default.Store, contentDescription = null,
                        modifier = Modifier.size(28.dp), tint = Color(0xFFBBBBBB))
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
                    Text(it, fontSize = 11.sp, color = BrandOrange, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
            }

            Icon(Icons.Default.ChevronRight, null, tint = Color.Gray)
        }
    }
}
