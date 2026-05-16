package com.spicetrade.app.ui.screens.advertiser

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
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
import androidx.compose.ui.window.Dialog
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.spicetrade.app.data.api.ApiConfig
import com.spicetrade.app.data.models.BannerAd
import com.spicetrade.app.ui.theme.BrandOrange
import com.spicetrade.app.viewmodel.AdvertiserViewModel
import com.spicetrade.app.viewmodel.AuthViewModel

@Composable
fun AdvertiserDashboardScreen(
    authViewModel: AuthViewModel,
    advertiserViewModel: AdvertiserViewModel = hiltViewModel()
) {
    val currentUser by authViewModel.currentUser.collectAsState()
    val ads by advertiserViewModel.ads.collectAsState()
    val isLoading by advertiserViewModel.isLoading.collectAsState()
    val errorMessage by advertiserViewModel.errorMessage.collectAsState()
    val successMessage by advertiserViewModel.successMessage.collectAsState()
    var showPostAdDialog by remember { mutableStateOf(false) }

    LaunchedEffect(currentUser?.id) {
        currentUser?.id?.let { advertiserViewModel.loadMyAds(it) }
    }

    if (showPostAdDialog) {
        PostBannerAdDialog(
            userId = currentUser?.id ?: 0,
            advertiserViewModel = advertiserViewModel,
            onDismiss = { showPostAdDialog = false }
        )
    }

    Column(modifier = Modifier.fillMaxSize().background(Color(0xFFF7F7F7))) {
        // Header
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(BrandOrange)
                .padding(horizontal = 16.dp, vertical = 14.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Campaign, null, tint = Color.White, modifier = Modifier.size(28.dp))
                Spacer(Modifier.width(10.dp))
                Column {
                    Text("My Banner Ads", fontSize = 18.sp, fontWeight = FontWeight.Black, color = Color.White)
                    currentUser?.name?.let { Text(it, fontSize = 12.sp, color = Color.White.copy(0.82f)) }
                }
            }
        }

        // Success/error banners
        successMessage?.let { msg ->
            Surface(
                modifier = Modifier.fillMaxWidth().padding(12.dp),
                shape = RoundedCornerShape(10.dp),
                color = Color(0xFFE8F5E9)
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.CheckCircle, null, tint = Color(0xFF388E3C), modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text(msg, color = Color(0xFF2E7D32), fontSize = 13.sp)
                }
            }
        }

        errorMessage?.let { msg ->
            Surface(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp),
                shape = RoundedCornerShape(10.dp),
                color = Color(0xFFFFEBEB)
            ) {
                Text(
                    msg,
                    color = Color(0xFFD32F2F),
                    fontSize = 13.sp,
                    modifier = Modifier.padding(12.dp)
                )
            }
        }

        // Stats row
        if (ads.isNotEmpty()) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                val active = ads.count { it.status == "active" }
                val pending = ads.count { it.status == "pending" || it.status == null }
                AdStatChip("${ads.size}", "Total", Color(0xFF1565C0), Modifier.weight(1f))
                AdStatChip("$active", "Active", Color(0xFF2E7D32), Modifier.weight(1f))
                AdStatChip("$pending", "Pending", Color(0xFFF57F17), Modifier.weight(1f))
            }
        }

        Box(modifier = Modifier.fillMaxSize()) {
            when {
                isLoading -> {
                    CircularProgressIndicator(
                        modifier = Modifier.align(Alignment.Center),
                        color = BrandOrange
                    )
                }
                ads.isEmpty() -> {
                    Column(
                        modifier = Modifier.align(Alignment.Center),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            Icons.Default.Campaign,
                            null,
                            tint = Color(0xFFCCCCCC),
                            modifier = Modifier.size(72.dp)
                        )
                        Spacer(Modifier.height(12.dp))
                        Text("No banner ads yet", fontSize = 16.sp, color = Color(0xFF999999))
                        Spacer(Modifier.height(6.dp))
                        Text(
                            "Tap + to post your first banner ad",
                            fontSize = 13.sp,
                            color = Color(0xFFBBBBBB)
                        )
                    }
                }
                else -> {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(12.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        items(ads) { ad ->
                            BannerAdCard(ad)
                        }
                    }
                }
            }

            FloatingActionButton(
                onClick = {
                    advertiserViewModel.clearMessages()
                    showPostAdDialog = true
                },
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(16.dp),
                containerColor = BrandOrange,
                contentColor = Color.White
            ) {
                Icon(Icons.Default.Add, contentDescription = "Post Banner Ad")
            }
        }
    }
}

@Composable
private fun AdStatChip(value: String, label: String, color: Color, modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(10.dp),
        color = color.copy(alpha = 0.1f)
    ) {
        Column(
            modifier = Modifier.padding(vertical = 10.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(value, fontSize = 20.sp, fontWeight = FontWeight.ExtraBold, color = color)
            Text(label, fontSize = 11.sp, color = color.copy(0.8f))
        }
    }
}

@Composable
private fun BannerAdCard(ad: BannerAd) {
    val statusColor = when (ad.status) {
        "active" -> Color(0xFF2E7D32)
        "rejected" -> Color(0xFFD32F2F)
        else -> Color(0xFFF57F17)
    }
    val statusLabel = when (ad.status) {
        "active" -> "Active"
        "rejected" -> "Rejected"
        else -> "Pending Review"
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(2.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Column {
            // Banner image
            val imageUrl = if (ad.imageUrl.startsWith("http")) ad.imageUrl
                           else "${ApiConfig.BASE_URL}${ad.imageUrl}"
            AsyncImage(
                model = imageUrl,
                contentDescription = ad.title,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(160.dp)
                    .clip(RoundedCornerShape(topStart = 12.dp, topEnd = 12.dp)),
                contentScale = ContentScale.Crop
            )

            Column(modifier = Modifier.padding(12.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        ad.title,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Color(0xFF1A1A1A),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f)
                    )
                    Spacer(Modifier.width(8.dp))
                    Surface(
                        shape = RoundedCornerShape(6.dp),
                        color = statusColor.copy(alpha = 0.1f)
                    ) {
                        Text(
                            statusLabel,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = statusColor,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                }

                ad.description?.takeIf { it.isNotBlank() }?.let {
                    Spacer(Modifier.height(4.dp))
                    Text(it, fontSize = 13.sp, color = Color(0xFF666666), maxLines = 2, overflow = TextOverflow.Ellipsis)
                }

                Spacer(Modifier.height(6.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Link, null, tint = Color(0xFF9E9E9E), modifier = Modifier.size(14.dp))
                    Spacer(Modifier.width(4.dp))
                    Text(
                        ad.targetUrl,
                        fontSize = 11.sp,
                        color = Color(0xFF1565C0),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }

                ad.expiresAt?.let {
                    Spacer(Modifier.height(4.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Schedule, null, tint = Color(0xFF9E9E9E), modifier = Modifier.size(14.dp))
                        Spacer(Modifier.width(4.dp))
                        Text("Expires: $it", fontSize = 11.sp, color = Color(0xFF9E9E9E))
                    }
                }
            }
        }
    }
}

@Composable
private fun PostBannerAdDialog(
    userId: Int,
    advertiserViewModel: AdvertiserViewModel,
    onDismiss: () -> Unit
) {
    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var targetUrl by remember { mutableStateOf("") }
    var expiresAt by remember { mutableStateOf("") }
    var contactName by remember { mutableStateOf("") }
    var contactNumber by remember { mutableStateOf("") }
    var industry by remember { mutableStateOf("") }
    var imageUri by remember { mutableStateOf<Uri?>(null) }

    val isUploading by advertiserViewModel.isUploading.collectAsState()
    val errorMessage by advertiserViewModel.errorMessage.collectAsState()

    val imagePicker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri -> imageUri = uri }

    Dialog(onDismissRequest = { if (!isUploading) onDismiss() }) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White)
        ) {
            Column(
                modifier = Modifier
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text("Post Banner Ad", fontSize = 18.sp, fontWeight = FontWeight.Bold)

                OutlinedTextField(
                    value = title, onValueChange = { title = it },
                    label = { Text("Title *") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = BrandOrange,
                        focusedLabelColor = BrandOrange
                    )
                )
                OutlinedTextField(
                    value = description, onValueChange = { description = it },
                    label = { Text("Description") },
                    maxLines = 3,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = BrandOrange,
                        focusedLabelColor = BrandOrange
                    )
                )
                OutlinedTextField(
                    value = targetUrl, onValueChange = { targetUrl = it },
                    label = { Text("Website/Target URL *") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = BrandOrange,
                        focusedLabelColor = BrandOrange
                    )
                )
                OutlinedTextField(
                    value = contactName, onValueChange = { contactName = it },
                    label = { Text("Contact Name") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = BrandOrange,
                        focusedLabelColor = BrandOrange
                    )
                )
                OutlinedTextField(
                    value = contactNumber, onValueChange = { contactNumber = it },
                    label = { Text("Contact Number") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = BrandOrange,
                        focusedLabelColor = BrandOrange
                    )
                )
                OutlinedTextField(
                    value = industry, onValueChange = { industry = it },
                    label = { Text("Industry") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = BrandOrange,
                        focusedLabelColor = BrandOrange
                    )
                )
                OutlinedTextField(
                    value = expiresAt, onValueChange = { expiresAt = it },
                    label = { Text("Expiry Date (YYYY-MM-DD)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = BrandOrange,
                        focusedLabelColor = BrandOrange
                    )
                )

                // Image picker
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(120.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .border(1.dp, if (imageUri != null) BrandOrange else Color(0xFFCCCCCC), RoundedCornerShape(10.dp))
                        .clickable { imagePicker.launch("image/*") },
                    contentAlignment = Alignment.Center
                ) {
                    if (imageUri != null) {
                        AsyncImage(
                            model = imageUri,
                            contentDescription = "Selected banner image",
                            modifier = Modifier.fillMaxSize().clip(RoundedCornerShape(10.dp)),
                            contentScale = ContentScale.Crop
                        )
                    } else {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(Icons.Default.AddPhotoAlternate, null, tint = Color(0xFFAAAAAA), modifier = Modifier.size(32.dp))
                            Spacer(Modifier.height(4.dp))
                            Text("Tap to select banner image *", fontSize = 12.sp, color = Color(0xFFAAAAAA))
                        }
                    }
                }

                errorMessage?.let {
                    Text(it, color = Color(0xFFD32F2F), fontSize = 12.sp)
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedButton(
                        onClick = onDismiss,
                        modifier = Modifier.weight(1f),
                        enabled = !isUploading,
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text("Cancel")
                    }
                    Button(
                        onClick = {
                            val uri = imageUri ?: return@Button
                            advertiserViewModel.createBannerAd(
                                userId = userId,
                                title = title,
                                description = description,
                                targetUrl = targetUrl,
                                expiresAt = expiresAt,
                                contactName = contactName,
                                contactNumber = contactNumber,
                                industry = industry,
                                imageUri = uri,
                                onSuccess = onDismiss
                            )
                        },
                        modifier = Modifier.weight(1f),
                        enabled = !isUploading && title.isNotBlank() && targetUrl.isNotBlank() && imageUri != null,
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = BrandOrange)
                    ) {
                        if (isUploading) {
                            CircularProgressIndicator(modifier = Modifier.size(18.dp), color = Color.White, strokeWidth = 2.dp)
                        } else {
                            Text("Submit Ad", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}
