package com.spicetrade.app.ui.screens.auth

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
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
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.spicetrade.app.R
import com.spicetrade.app.ui.theme.BrandAmber
import com.spicetrade.app.ui.theme.BrandDark
import com.spicetrade.app.ui.theme.BrandOrange
import com.spicetrade.app.viewmodel.AuthViewModel

@Composable
fun SignupScreen(
    authViewModel: AuthViewModel,
    onSuccess: () -> Unit,
    onBack: () -> Unit
) {
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var showPassword by remember { mutableStateOf(false) }
    var phone by remember { mutableStateOf("") }
    var role by remember { mutableStateOf("buyer") }
    var location by remember { mutableStateOf("") }
    var storeName by remember { mutableStateOf("") }
    var businessType by remember { mutableStateOf("") }
    var categories by remember { mutableStateOf("") }
    var address by remember { mutableStateOf("") }
    var website by remember { mutableStateOf("") }

    val isLoading by authViewModel.isLoading.collectAsState()
    val errorMessage by authViewModel.errorMessage.collectAsState()
    val isAuthenticated by authViewModel.isAuthenticated.collectAsState()

    LaunchedEffect(isAuthenticated) { if (isAuthenticated) onSuccess() }

    Box(modifier = Modifier.fillMaxSize().background(Color.White)) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(220.dp)
                .background(BrandOrange)
        )

        Column(modifier = Modifier.fillMaxSize()) {
            Row(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
                IconButton(
                    onClick = onBack,
                    modifier = Modifier.clip(CircleShape).background(Color.White.copy(alpha = 0.25f))
                ) { Icon(Icons.Default.Close, contentDescription = "Back", tint = Color.White) }
            }

            Column(
                modifier = Modifier.verticalScroll(rememberScrollState()),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(
                    modifier = Modifier.size(72.dp).clip(RoundedCornerShape(16.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Image(
                        painter = painterResource(R.drawable.bigspicelogo),
                        contentDescription = "BigSpice",
                        modifier = Modifier.fillMaxSize()
                    )
                }

                Spacer(Modifier.height(10.dp))
                Text("Join BigSpice", fontSize = 26.sp, fontWeight = FontWeight.Black, color = Color.White)
                Text("India's B2B Spice Marketplace", fontSize = 13.sp, color = Color.White.copy(alpha = 0.85f))
                Spacer(Modifier.height(28.dp))

                Card(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp),
                    shape = RoundedCornerShape(24.dp),
                    elevation = CardDefaults.cardElevation(8.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White)
                ) {
                    Column(modifier = Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {

                        // Role selector
                        Text("I want to", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = Color.Gray)
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            RoleButton(
                                icon = "🛍️", title = "Buy", subtitle = "Source products",
                                isSelected = role == "buyer",
                                modifier = Modifier.weight(1f)
                            ) { role = "buyer" }
                            RoleButton(
                                icon = "🏪", title = "Sell", subtitle = "List products",
                                isSelected = role == "seller",
                                modifier = Modifier.weight(1f)
                            ) { role = "seller" }
                        }

                        Divider()

                        // Personal Info
                        AuthTextField(
                            value = name, onValueChange = { name = it }, label = "Full name",
                            leadingIcon = { Icon(Icons.Default.Person, null, tint = BrandOrange) }
                        )
                        AuthTextField(
                            value = email, onValueChange = { email = it }, label = "Email address",
                            leadingIcon = { Icon(Icons.Default.Email, null, tint = BrandOrange) },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email)
                        )
                        AuthTextField(
                            value = password, onValueChange = { password = it }, label = "Password",
                            leadingIcon = { Icon(Icons.Default.Lock, null, tint = BrandOrange) },
                            visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
                            trailingIcon = {
                                IconButton(onClick = { showPassword = !showPassword }) {
                                    Icon(
                                        if (showPassword) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                                        contentDescription = null
                                    )
                                }
                            }
                        )
                        AuthTextField(
                            value = phone, onValueChange = { phone = it }, label = "Phone (optional)",
                            leadingIcon = { Icon(Icons.Default.Phone, null, tint = BrandOrange) },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone)
                        )
                        AuthTextField(
                            value = location, onValueChange = { location = it }, label = "Location (optional)",
                            leadingIcon = { Icon(Icons.Default.LocationOn, null, tint = BrandOrange) }
                        )

                        // Seller-only fields
                        if (role == "seller") {
                            Divider()
                            Text("Store Details", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = Color.Gray)
                            AuthTextField(value = storeName, onValueChange = { storeName = it }, label = "Store name *")
                            AuthTextField(value = businessType, onValueChange = { businessType = it }, label = "Business type")
                            AuthTextField(value = categories, onValueChange = { categories = it }, label = "Product categories")
                            AuthTextField(value = address, onValueChange = { address = it }, label = "Business address")
                            AuthTextField(
                                value = website, onValueChange = { website = it }, label = "Website (optional)",
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri)
                            )
                        }

                        errorMessage?.let {
                            Text(it, color = MaterialTheme.colorScheme.error, fontSize = 13.sp)
                        }

                        Button(
                            onClick = {
                                authViewModel.clearError()
                                authViewModel.signup(
                                    name = name, email = email, password = password,
                                    phone = phone.ifBlank { null }, role = role,
                                    location = location.ifBlank { null },
                                    storeName = storeName.ifBlank { null },
                                    businessType = businessType.ifBlank { null },
                                    categories = categories.ifBlank { null },
                                    address = address.ifBlank { null },
                                    website = website.ifBlank { null }
                                )
                            },
                            enabled = !isLoading && name.isNotBlank() && email.isNotBlank() && password.isNotBlank(),
                            modifier = Modifier.fillMaxWidth().height(52.dp),
                            shape = RoundedCornerShape(14.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = BrandOrange)
                        ) {
                            if (isLoading) {
                                CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White, strokeWidth = 2.dp)
                            } else {
                                Text("Create Account", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                            }
                        }
                    }
                }
                Spacer(Modifier.height(40.dp))
            }
        }
    }
}

@Composable
private fun RoleButton(
    icon: String,
    title: String,
    subtitle: String,
    isSelected: Boolean,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    val borderColor = if (isSelected) BrandOrange else Color.Gray.copy(alpha = 0.3f)
    val bgColor = if (isSelected) BrandOrange.copy(alpha = 0.08f) else Color.Transparent

    Column(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(bgColor)
            .border(1.5.dp, borderColor, RoundedCornerShape(12.dp))
            .clickable(onClick = onClick)
            .padding(12.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(icon, fontSize = 22.sp)
        Text(title, fontWeight = FontWeight.Bold, fontSize = 14.sp)
        Text(subtitle, fontSize = 11.sp, color = Color.Gray)
    }
}
