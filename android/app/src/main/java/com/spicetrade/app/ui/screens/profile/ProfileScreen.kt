package com.spicetrade.app.ui.screens.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.spicetrade.app.data.api.ApiConfig
import com.spicetrade.app.ui.theme.BrandOrange
import com.spicetrade.app.ui.theme.BrandRed
import com.spicetrade.app.viewmodel.AuthViewModel

@Composable
fun ProfileScreen(
    authViewModel: AuthViewModel,
    onLogout: () -> Unit
) {
    val currentUser by authViewModel.currentUser.collectAsState()
    var showLogoutDialog by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF5F5F5))
            .verticalScroll(rememberScrollState())
    ) {
        // Header
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Brush.verticalGradient(listOf(BrandRed, BrandOrange)))
                .padding(bottom = 32.dp)
        ) {
            Column(
                modifier = Modifier.fillMaxWidth().padding(top = 24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Avatar
                Box(
                    modifier = Modifier.size(96.dp).clip(CircleShape).background(Color.White.copy(alpha = 0.2f)),
                    contentAlignment = Alignment.Center
                ) {
                    val picUrl = currentUser?.profilePicture?.let { url ->
                        if (url.startsWith("http")) url else "${ApiConfig.BASE_URL}$url"
                    }
                    if (picUrl != null) {
                        AsyncImage(
                            model = picUrl,
                            contentDescription = null,
                            modifier = Modifier.fillMaxSize().clip(CircleShape),
                            contentScale = ContentScale.Crop
                        )
                    } else {
                        Text(
                            currentUser?.name?.take(1)?.uppercase() ?: "?",
                            fontSize = 40.sp, fontWeight = FontWeight.Black, color = Color.White
                        )
                    }
                }
                Spacer(Modifier.height(12.dp))
                Text(currentUser?.name ?: "User", fontSize = 22.sp, fontWeight = FontWeight.Black, color = Color.White)
                Text(currentUser?.email ?: "", fontSize = 14.sp, color = Color.White.copy(alpha = 0.85f))
                Spacer(Modifier.height(8.dp))

                val roleLabel = if (currentUser?.isSeller == true) "Seller" else "Buyer"
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(20.dp))
                        .background(Color.White.copy(alpha = 0.2f))
                        .padding(horizontal = 16.dp, vertical = 6.dp)
                ) {
                    Text(roleLabel, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                }
            }
        }

        Spacer(Modifier.height(-20.dp))

        // Info card
        Card(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
            shape = RoundedCornerShape(16.dp),
            elevation = CardDefaults.cardElevation(2.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("Profile Details", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                HorizontalDivider()
                currentUser?.phone?.let { ProfileInfoRow(Icons.Default.Phone, "Phone", it) }
                currentUser?.location?.let { ProfileInfoRow(Icons.Default.LocationOn, "Location", it) }
                currentUser?.storeName?.let { ProfileInfoRow(Icons.Default.Store, "Store", it) }
                currentUser?.businessType?.let { ProfileInfoRow(Icons.Default.Business, "Business Type", it) }
                currentUser?.categories?.let { ProfileInfoRow(Icons.Default.Category, "Categories", it) }
                currentUser?.website?.let { ProfileInfoRow(Icons.Default.Language, "Website", it) }
                currentUser?.address?.let { ProfileInfoRow(Icons.Default.Home, "Address", it) }
            }
        }

        Spacer(Modifier.height(12.dp))

        // Seller extended info
        if (currentUser?.isSeller == true &&
            (currentUser?.tagline != null || currentUser?.storeDescription != null)
        ) {
            Card(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                shape = RoundedCornerShape(16.dp),
                elevation = CardDefaults.cardElevation(2.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Store Info", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    HorizontalDivider()
                    currentUser?.tagline?.let { ProfileInfoRow(Icons.Default.Info, "Tagline", it) }
                    currentUser?.storeDescription?.let { ProfileInfoRow(Icons.Default.Description, "About", it) }
                    currentUser?.yearEstablished?.let { ProfileInfoRow(Icons.Default.CalendarToday, "Est.", it) }
                    currentUser?.employeeCount?.let { ProfileInfoRow(Icons.Default.People, "Team Size", it) }
                    currentUser?.annualTurnover?.let { ProfileInfoRow(Icons.Default.TrendingUp, "Turnover", it) }
                    currentUser?.certifications?.let { ProfileInfoRow(Icons.Default.Verified, "Certifications", it) }
                }
            }
            Spacer(Modifier.height(12.dp))
        }

        // Logout button
        Button(
            onClick = { showLogoutDialog = true },
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp).height(52.dp),
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color.Red.copy(alpha = 0.85f))
        ) {
            Icon(Icons.Default.Logout, null, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(8.dp))
            Text("Sign Out", fontWeight = FontWeight.Bold, fontSize = 16.sp)
        }

        Spacer(Modifier.height(32.dp))
    }

    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            title = { Text("Sign Out") },
            text = { Text("Are you sure you want to sign out?") },
            confirmButton = {
                TextButton(onClick = {
                    authViewModel.logout()
                    onLogout()
                }) { Text("Sign Out", color = Color.Red) }
            },
            dismissButton = {
                TextButton(onClick = { showLogoutDialog = false }) { Text("Cancel") }
            }
        )
    }
}

@Composable
private fun ProfileInfoRow(icon: ImageVector, label: String, value: String) {
    Row(verticalAlignment = Alignment.Top) {
        Icon(icon, null, modifier = Modifier.size(18.dp).padding(top = 2.dp), tint = BrandRed)
        Spacer(Modifier.width(10.dp))
        Column {
            Text(label, fontSize = 11.sp, color = Color.Gray)
            Text(value, fontSize = 14.sp)
        }
    }
}
