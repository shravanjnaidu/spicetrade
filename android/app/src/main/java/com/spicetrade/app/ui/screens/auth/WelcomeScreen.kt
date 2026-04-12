package com.spicetrade.app.ui.screens.auth

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.spicetrade.app.ui.theme.BrandDarkRed
import com.spicetrade.app.ui.theme.BrandOrange
import com.spicetrade.app.ui.theme.BrandRed
import kotlinx.coroutines.delay

private data class Slide(val emoji: String, val title: String, val subtitle: String)

@Composable
fun WelcomeScreen(
    onLoginClick: () -> Unit,
    onSignupClick: () -> Unit
) {
    val slides = remember {
        listOf(
            Slide("🌿", "Source Directly", "Connect with verified spice traders & manufacturers across India"),
            Slide("📦", "Bulk Made Easy", "Post requirements, compare quotes, close deals — all in one place"),
            Slide("✅", "Quality Assured", "Verified sellers, genuine reviews, trusted trade relationships"),
        )
    }
    var currentSlide by remember { mutableIntStateOf(0) }

    LaunchedEffect(Unit) {
        while (true) {
            delay(3500)
            currentSlide = (currentSlide + 1) % slides.size
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(listOf(BrandDarkRed, BrandRed, BrandOrange))
            )
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(Modifier.weight(1f))

            // App Icon placeholder
            Box(
                modifier = Modifier
                    .size(100.dp)
                    .clip(RoundedCornerShape(24.dp))
                    .background(Color.White.copy(alpha = 0.2f)),
                contentAlignment = Alignment.Center
            ) {
                Text("🌶️", fontSize = 52.sp)
            }

            Spacer(Modifier.height(16.dp))

            Text(
                "SpiceTrade",
                fontSize = 40.sp,
                fontWeight = FontWeight.Black,
                color = Color.White
            )
            Text(
                "India's B2B Spice Marketplace",
                fontSize = 15.sp,
                color = Color.White.copy(alpha = 0.85f)
            )

            Spacer(Modifier.weight(0.5f))

            // Feature slide
            val slide = slides[currentSlide]
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(20.dp))
                    .background(Color.White.copy(alpha = 0.12f))
                    .padding(24.dp)
            ) {
                Text(slide.emoji, fontSize = 40.sp)
                Spacer(Modifier.height(8.dp))
                Text(slide.title, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color.White)
                Spacer(Modifier.height(4.dp))
                Text(
                    slide.subtitle, fontSize = 14.sp,
                    color = Color.White.copy(alpha = 0.8f),
                    textAlign = TextAlign.Center
                )
            }

            Spacer(Modifier.height(12.dp))

            // Slide dots
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                slides.indices.forEach { i ->
                    Box(
                        modifier = Modifier
                            .size(if (i == currentSlide) 10.dp else 6.dp)
                            .clip(CircleShape)
                            .background(
                                if (i == currentSlide) Color.White else Color.White.copy(alpha = 0.4f)
                            )
                    )
                }
            }

            Spacer(Modifier.weight(0.5f))

            // Stat badges
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(Color.White.copy(alpha = 0.12f))
                    .padding(vertical = 16.dp),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                StatBadge("🌿", "Farm Fresh")
                VerticalDivider()
                StatBadge("✅", "Verified Sellers")
                VerticalDivider()
                StatBadge("🤝", "Direct Trade")
            }

            Spacer(Modifier.height(32.dp))

            // Get Started button
            Button(
                onClick = onSignupClick,
                modifier = Modifier.fillMaxWidth().height(54.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color.White,
                    contentColor = BrandRed
                ),
                shape = RoundedCornerShape(16.dp)
            ) {
                Text("Get Started — It's Free", fontWeight = FontWeight.Bold, fontSize = 16.sp)
            }

            Spacer(Modifier.height(12.dp))

            // Sign In button
            OutlinedButton(
                onClick = onLoginClick,
                modifier = Modifier.fillMaxWidth().height(50.dp),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White),
                border = androidx.compose.foundation.BorderStroke(1.5.dp, Color.White.copy(alpha = 0.5f)),
                shape = RoundedCornerShape(16.dp)
            ) {
                Text("Already have an account? Sign In", fontSize = 15.sp)
            }

            Spacer(Modifier.height(32.dp))
        }
    }
}

@Composable
private fun StatBadge(emoji: String, label: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(emoji, fontSize = 20.sp)
        Text(label, fontSize = 11.sp, color = Color.White.copy(alpha = 0.8f))
    }
}

@Composable
private fun VerticalDivider() {
    Box(
        modifier = Modifier
            .height(32.dp)
            .width(1.dp)
            .background(Color.White.copy(alpha = 0.3f))
    )
}
