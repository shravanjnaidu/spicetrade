package com.spicetrade.app.ui.screens.auth

import androidx.compose.foundation.Image
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
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.spicetrade.app.R
import com.spicetrade.app.ui.theme.BrandAmber
import com.spicetrade.app.ui.theme.BrandDark
import com.spicetrade.app.ui.theme.BrandOrange
import kotlinx.coroutines.delay

private data class Slide(val icon: String, val title: String, val subtitle: String)

@Composable
fun WelcomeScreen(
    onLoginClick: () -> Unit,
    onSignupClick: () -> Unit
) {
    val slides = remember {
        listOf(
            Slide("", "Source Directly", "Connect with verified spice traders & manufacturers across India"),
            Slide("", "Bulk Made Easy", "Post requirements, compare quotes, close deals — all in one place"),
            Slide("", "Quality Assured", "Verified sellers, genuine reviews, trusted trade relationships"),
        )
    }
    var currentSlide by remember { mutableIntStateOf(0) }
    LaunchedEffect(Unit) {
        while (true) { delay(3500); currentSlide = (currentSlide + 1) % slides.size }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BrandOrange)
    ) {
        Column(
            modifier = Modifier.fillMaxSize().padding(horizontal = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(Modifier.weight(0.8f))

            // ── Logo + brand name ──────────────────────────────────────────────
            Image(
                painter = painterResource(R.drawable.bigspicelogo),
                contentDescription = "BigSpice",
                modifier = Modifier.size(96.dp).clip(RoundedCornerShape(22.dp))
            )
            Spacer(Modifier.height(14.dp))
            Text(
                "BigSpice",
                fontSize = 38.sp, fontWeight = FontWeight.Black, color = Color.White,
                letterSpacing = (-0.5).sp
            )
            Text(
                "India's B2B Spice & Food Marketplace",
                fontSize = 14.sp, color = Color.White.copy(0.85f),
                letterSpacing = 0.3.sp
            )

            Spacer(Modifier.weight(0.4f))

            // ── Trust badges row ──────────────────────────────────────────────
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(14.dp))
                    .background(Color.Black.copy(alpha = 0.18f))
                    .padding(vertical = 14.dp),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                TrustBadge("10K+", "Verified Sellers")
                VDivider()
                TrustBadge("50+", "Categories")
                VDivider()
                TrustBadge("Pan India", "Delivery")
            }

            Spacer(Modifier.height(16.dp))

            // ── Feature slides ─────────────────────────────────────────────────
            val slide = slides[currentSlide]
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(18.dp),
                color = Color.White.copy(alpha = 0.13f),
                tonalElevation = 0.dp
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(slide.icon, fontSize = 36.sp)
                    Spacer(Modifier.height(6.dp))
                    Text(
                        slide.title,
                        fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        slide.subtitle,
                        fontSize = 13.sp, color = Color.White.copy(0.78f),
                        textAlign = TextAlign.Center, lineHeight = 18.sp
                    )
                }
            }

            Spacer(Modifier.height(10.dp))

            // Dots
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                slides.indices.forEach { i ->
                    Box(
                        modifier = Modifier
                            .size(if (i == currentSlide) 22.dp else 6.dp, 6.dp)
                            .clip(CircleShape)
                            .background(if (i == currentSlide) Color.White else Color.White.copy(0.35f))
                    )
                }
            }

            Spacer(Modifier.weight(0.6f))

            // ── CTA buttons ────────────────────────────────────────────────────
            Button(
                onClick = onSignupClick,
                modifier = Modifier.fillMaxWidth().height(54.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color.White,
                    contentColor = BrandOrange
                ),
                elevation = ButtonDefaults.buttonElevation(defaultElevation = 4.dp)
            ) {
                Text("Get Started — It's Free", fontWeight = FontWeight.ExtraBold, fontSize = 16.sp)
            }

            Spacer(Modifier.height(12.dp))

            OutlinedButton(
                onClick = onLoginClick,
                modifier = Modifier.fillMaxWidth().height(50.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White),
                border = androidx.compose.foundation.BorderStroke(1.5.dp, Color.White.copy(0.55f))
            ) {
                Text("Sign In to Your Account", fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
            }

            Spacer(Modifier.height(28.dp))
        }
    }
}

@Composable
private fun TrustBadge(value: String, label: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, fontSize = 15.sp, fontWeight = FontWeight.ExtraBold, color = Color.White)
        Text(label, fontSize = 10.sp, color = Color.White.copy(0.75f))
    }
}

@Composable
private fun VDivider() {
    Box(Modifier.height(30.dp).width(1.dp).background(Color.White.copy(0.25f)))
}
