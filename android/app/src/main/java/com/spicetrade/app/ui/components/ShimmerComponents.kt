package com.spicetrade.app.ui.components

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.unit.dp

// ── Shimmer brush ─────────────────────────────────────────────────────────────
@Composable
fun shimmerBrush(widthPx: Float = 1000f): Brush {
    val shimmerColors = listOf(
        Color(0xFFE0E0E0), Color(0xFFF5F5F5), Color(0xFFE0E0E0),
    )
    val transition = rememberInfiniteTransition(label = "shimmer")
    val translateAnim by transition.animateFloat(
        initialValue = 0f,
        targetValue = widthPx * 2,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "shimmer_translate"
    )
    return Brush.linearGradient(
        colors = shimmerColors,
        start = Offset(translateAnim - widthPx, 0f),
        end = Offset(translateAnim, 0f)
    )
}

// ── Base shimmer box ──────────────────────────────────────────────────────────
@Composable
fun ShimmerBox(
    modifier: Modifier = Modifier,
    shape: Shape = RoundedCornerShape(8.dp)
) {
    Box(modifier = modifier.clip(shape).background(shimmerBrush()))
}

// ── Popular product card (horizontal scroll row) ──────────────────────────────
@Composable
fun ProductCardShimmer(modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .width(150.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(Color.White)
    ) {
        ShimmerBox(modifier = Modifier.fillMaxWidth().height(120.dp), shape = RoundedCornerShape(0.dp))
        Column(modifier = Modifier.padding(8.dp)) {
            ShimmerBox(modifier = Modifier.fillMaxWidth(0.9f).height(12.dp))
            Spacer(Modifier.height(6.dp))
            ShimmerBox(modifier = Modifier.fillMaxWidth(0.6f).height(10.dp))
            Spacer(Modifier.height(4.dp))
            ShimmerBox(modifier = Modifier.fillMaxWidth(0.45f).height(10.dp))
        }
    }
}

// ── Grid card shimmer (search results 2-col) ──────────────────────────────────
@Composable
fun ProductGridShimmer(modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .background(Color.White)
    ) {
        ShimmerBox(modifier = Modifier.fillMaxWidth().aspectRatio(1f), shape = RoundedCornerShape(0.dp))
        Column(modifier = Modifier.padding(10.dp)) {
            ShimmerBox(modifier = Modifier.fillMaxWidth(0.9f).height(13.dp))
            Spacer(Modifier.height(6.dp))
            ShimmerBox(modifier = Modifier.fillMaxWidth(0.6f).height(11.dp))
            Spacer(Modifier.height(4.dp))
            ShimmerBox(modifier = Modifier.fillMaxWidth(0.4f).height(11.dp))
        }
    }
}

// ── Requirement card shimmer ──────────────────────────────────────────────────
@Composable
fun RequirementCardShimmer() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 14.dp, vertical = 4.dp)
            .clip(RoundedCornerShape(10.dp))
            .background(Color.White)
            .padding(12.dp)
    ) {
        ShimmerBox(modifier = Modifier.size(42.dp), shape = RoundedCornerShape(8.dp))
        Spacer(Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            ShimmerBox(modifier = Modifier.fillMaxWidth(0.85f).height(13.dp))
            Spacer(Modifier.height(6.dp))
            ShimmerBox(modifier = Modifier.fillMaxWidth().height(10.dp))
            Spacer(Modifier.height(4.dp))
            ShimmerBox(modifier = Modifier.fillMaxWidth(0.7f).height(10.dp))
        }
    }
}

// ── Featured store card shimmer ───────────────────────────────────────────────
@Composable
fun StoreCardShimmer() {
    Column(
        modifier = Modifier
            .width(155.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(Color.White)
    ) {
        ShimmerBox(modifier = Modifier.fillMaxWidth().height(72.dp), shape = RoundedCornerShape(0.dp))
        Column(modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp)) {
            ShimmerBox(modifier = Modifier.fillMaxWidth(0.9f).height(12.dp))
            Spacer(Modifier.height(5.dp))
            ShimmerBox(modifier = Modifier.fillMaxWidth(0.65f).height(10.dp))
            Spacer(Modifier.height(4.dp))
            ShimmerBox(modifier = Modifier.fillMaxWidth(0.5f).height(10.dp))
        }
    }
}

// ── Full home screen shimmer placeholder ─────────────────────────────────────
@Composable
fun HomeScreenShimmer() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 14.dp)
    ) {
        Spacer(Modifier.height(12.dp))
        ShimmerBox(
            modifier = Modifier.fillMaxWidth().height(80.dp),
            shape = RoundedCornerShape(12.dp)
        )
        Spacer(Modifier.height(16.dp))
        ShimmerBox(modifier = Modifier.width(160.dp).height(16.dp))
        Spacer(Modifier.height(12.dp))
        Row(
            modifier = Modifier.horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            repeat(4) { ProductCardShimmer() }
        }
        Spacer(Modifier.height(20.dp))
        ShimmerBox(modifier = Modifier.width(180.dp).height(16.dp))
        Spacer(Modifier.height(10.dp))
        repeat(3) {
            RequirementCardShimmer()
            Spacer(Modifier.height(4.dp))
        }
        Spacer(Modifier.height(20.dp))
        ShimmerBox(modifier = Modifier.width(160.dp).height(16.dp))
        Spacer(Modifier.height(12.dp))
        Row(
            modifier = Modifier.horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            repeat(4) { StoreCardShimmer() }
        }
    }
}

// ── Conversation shimmer ──────────────────────────────────────────────────────
@Composable
fun ConversationShimmer() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 10.dp)
    ) {
        ShimmerBox(modifier = Modifier.size(50.dp), shape = CircleShape)
        Spacer(Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            ShimmerBox(modifier = Modifier.fillMaxWidth(0.55f).height(14.dp))
            Spacer(Modifier.height(6.dp))
            ShimmerBox(modifier = Modifier.fillMaxWidth(0.9f).height(11.dp))
        }
    }
}

