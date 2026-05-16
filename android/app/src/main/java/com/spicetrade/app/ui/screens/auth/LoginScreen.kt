package com.spicetrade.app.ui.screens.auth

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginScreen(
    authViewModel: AuthViewModel,
    onSuccess: () -> Unit,
    onBack: () -> Unit,
    onForgotPassword: () -> Unit = {}
) {
    var email by remember { mutableStateOf("") }
    var showPassword by remember { mutableStateOf(false) }
    var passwordValue by remember { mutableStateOf("") }

    val isLoading by authViewModel.isLoading.collectAsState()
    val errorMessage by authViewModel.errorMessage.collectAsState()
    val isAuthenticated by authViewModel.isAuthenticated.collectAsState()

    LaunchedEffect(isAuthenticated) { if (isAuthenticated) onSuccess() }

    Box(modifier = Modifier.fillMaxSize().background(Color.White)) {
        // Solid orange header band
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(220.dp)
                .background(BrandOrange)
        )

        Column(modifier = Modifier.fillMaxSize()) {
            // Top nav row
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onBack) {
                    Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
                }
            }

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState()),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Logo
                Image(
                    painter = painterResource(R.drawable.bigspicelogo),
                    contentDescription = "BigSpice",
                    modifier = Modifier.size(72.dp).clip(RoundedCornerShape(18.dp))
                )
                Spacer(Modifier.height(10.dp))
                Text(
                    "Welcome Back",
                    fontSize = 26.sp, fontWeight = FontWeight.ExtraBold, color = Color.White
                )
                Text(
                    "Sign in to BigSpice",
                    fontSize = 13.sp, color = Color.White.copy(alpha = 0.82f)
                )
                Spacer(Modifier.height(28.dp))

                // Login card
                Card(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp),
                    shape = RoundedCornerShape(20.dp),
                    elevation = CardDefaults.cardElevation(6.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White)
                ) {
                    Column(
                        modifier = Modifier.padding(horizontal = 24.dp, vertical = 28.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Text(
                            "Sign In",
                            fontSize = 20.sp, fontWeight = FontWeight.Bold,
                            color = Color(0xFF1A1A1A)
                        )

                        AuthTextField(
                            value = email,
                            onValueChange = { email = it },
                            label = "Email address",
                            leadingIcon = { Icon(Icons.Default.Email, null, tint = BrandOrange) },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email)
                        )

                        AuthTextField(
                            value = passwordValue,
                            onValueChange = { passwordValue = it },
                            label = "Password",
                            leadingIcon = { Icon(Icons.Default.Lock, null, tint = BrandOrange) },
                            visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
                            trailingIcon = {
                                IconButton(onClick = { showPassword = !showPassword }) {
                                    Icon(
                                        if (showPassword) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                                        contentDescription = null,
                                        tint = Color.Gray
                                    )
                                }
                            }
                        )

                        errorMessage?.let {
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = Color(0xFFFFEBEB)
                            ) {
                                Text(
                                    it,
                                    color = Color(0xFFD32F2F),
                                    fontSize = 13.sp,
                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)
                                )
                            }
                        }

                        Button(
                            onClick = {
                                authViewModel.clearError()
                                authViewModel.login(email, passwordValue)
                            },
                            enabled = !isLoading && email.isNotBlank() && passwordValue.isNotBlank(),
                            modifier = Modifier.fillMaxWidth().height(52.dp),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = BrandOrange),
                            elevation = ButtonDefaults.buttonElevation(defaultElevation = 3.dp)
                        ) {
                            if (isLoading) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(20.dp),
                                    color = Color.White,
                                    strokeWidth = 2.5.dp
                                )
                            } else {
                                Text("Sign In", fontWeight = FontWeight.ExtraBold, fontSize = 16.sp)
                            }
                        }

                        TextButton(
                            onClick = onForgotPassword,
                            modifier = Modifier.align(Alignment.CenterHorizontally)
                        ) {
                            Text(
                                "Forgot password?",
                                color = BrandOrange,
                                fontWeight = FontWeight.Medium,
                                fontSize = 14.sp
                            )
                        }
                    }
                }
                Spacer(Modifier.height(40.dp))
            }
        }
    }
}

@Composable
fun AuthTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    leadingIcon: @Composable (() -> Unit)? = null,
    trailingIcon: @Composable (() -> Unit)? = null,
    visualTransformation: VisualTransformation = VisualTransformation.None,
    keyboardOptions: KeyboardOptions = KeyboardOptions.Default
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        leadingIcon = leadingIcon,
        trailingIcon = trailingIcon,
        visualTransformation = visualTransformation,
        keyboardOptions = keyboardOptions,
        singleLine = true,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(10.dp),
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = BrandOrange,
            focusedLabelColor = BrandOrange,
            cursorColor = BrandOrange
        )
    )
}


