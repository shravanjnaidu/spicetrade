package com.spicetrade.app.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val LightColorScheme = lightColorScheme(
    primary          = BrandOrange,
    onPrimary        = OnBrand,
    primaryContainer = BrandAmber,
    secondary        = BrandAmber,
    onSecondary      = OnBrand,
    background       = Surface,
    surface          = CardBackground,
    onBackground     = TextPrimary,
    onSurface        = TextPrimary,
    error            = Color(0xFFB00020),
    onError          = Color.White,
)

private val DarkColorScheme = darkColorScheme(
    primary          = BrandOrange,
    onPrimary        = OnBrand,
    primaryContainer = BrandDark,
    secondary        = BrandAmber,
    onSecondary      = OnBrand,
    background       = Color(0xFF121212),
    surface          = Color(0xFF1E1E1E),
    onBackground     = Color(0xFFECECEC),
    onSurface        = Color(0xFFECECEC),
    error            = Color(0xFFCF6679),
    onError          = Color.Black,
)

@Composable
fun SpiceTradeTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }
    MaterialTheme(
        colorScheme = colorScheme,
        typography = SpiceTradeTypography,
        content = content
    )
}
