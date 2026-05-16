package com.spicetrade.app.ui.screens.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Email
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.spicetrade.app.ui.theme.BrandOrange
import com.spicetrade.app.viewmodel.AuthViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ForgotPasswordScreen(
    authViewModel: AuthViewModel,
    onBack: () -> Unit
) {
    var email by remember { mutableStateOf("") }

    val isLoading by authViewModel.isLoading.collectAsState()
    val errorMessage by authViewModel.errorMessage.collectAsState()
    val successMessage by authViewModel.forgotPasswordSuccess.collectAsState()

    // Clear state on enter
    LaunchedEffect(Unit) {
        authViewModel.clearError()
        authViewModel.clearForgotPasswordSuccess()
    }

    Box(modifier = Modifier.fillMaxSize().background(Color.White)) {
        // Orange header band
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(200.dp)
                .background(BrandOrange)
        )

        Column(modifier = Modifier.fillMaxSize()) {
            // Back arrow
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
                Spacer(Modifier.height(8.dp))
                Text(
                    "Forgot Password",
                    fontSize = 26.sp, fontWeight = FontWeight.ExtraBold, color = Color.White
                )
                Text(
                    "We'll send a reset link to your email",
                    fontSize = 13.sp, color = Color.White.copy(alpha = 0.82f)
                )
                Spacer(Modifier.height(28.dp))

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
                            "Reset Password",
                            fontSize = 20.sp, fontWeight = FontWeight.Bold,
                            color = Color(0xFF1A1A1A)
                        )
                        Text(
                            "Enter the email address associated with your account and we will send you a link to reset your password.",
                            fontSize = 13.sp,
                            color = Color(0xFF666666),
                            lineHeight = 19.sp
                        )

                        if (successMessage != null) {
                            Surface(
                                shape = RoundedCornerShape(10.dp),
                                color = Color(0xFFE8F5E9)
                            ) {
                                Row(
                                    modifier = Modifier.padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        successMessage!!,
                                        color = Color(0xFF2E7D32),
                                        fontSize = 13.sp,
                                        lineHeight = 18.sp
                                    )
                                }
                            }
                        } else {
                            AuthTextField(
                                value = email,
                                onValueChange = { email = it },
                                label = "Email address",
                                leadingIcon = { Icon(Icons.Default.Email, null, tint = BrandOrange) },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email)
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
                                    authViewModel.forgotPassword(email.trim())
                                },
                                enabled = !isLoading && email.isNotBlank(),
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
                                    Text("Send Reset Link", fontWeight = FontWeight.ExtraBold, fontSize = 16.sp)
                                }
                            }
                        }

                        TextButton(
                            onClick = onBack,
                            modifier = Modifier.align(Alignment.CenterHorizontally)
                        ) {
                            Text(
                                "Back to Sign In",
                                color = BrandOrange,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                }
                Spacer(Modifier.height(40.dp))
            }
        }
    }
}
