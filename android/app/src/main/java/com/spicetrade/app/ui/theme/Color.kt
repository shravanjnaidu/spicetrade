package com.spicetrade.app.ui.theme

import androidx.compose.ui.graphics.Color

// Primary brand palette — matches the web app's CSS variables:
//   --accent: #d35400  (burnt orange, used for buttons, headers, active states)
//   gradient end: #f39c12 (amber)
val BrandOrange  = Color(0xFFD35400)   // primary accent — #d35400
val BrandAmber   = Color(0xFFF39C12)   // gradient end  — #f39c12
val BrandDark    = Color(0xFFA84200)   // darker shade for pressed / header top

// Kept for backward-compat references — map to the same palette
val BrandRed     = BrandOrange
val BrandDarkRed = BrandDark

val OnBrand        = Color.White
val Surface        = Color.White              // matches web: background #fff
val CardBackground = Color.White
val TextPrimary    = Color(0xFF222222)        // matches web: color #222
val TextSecondary  = Color(0xFF6B7280)
val Divider        = Color(0xFFE9E9E9)        // matches web: border #e9e9e9
val StarYellow     = Color(0xFFFBBC05)
val SuccessGreen   = Color(0xFF22C55E)
