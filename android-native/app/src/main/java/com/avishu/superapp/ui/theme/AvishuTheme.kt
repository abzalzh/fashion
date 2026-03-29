package com.avishu.superapp.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val Scheme =
  darkColorScheme(
    primary = Color.White,
    onPrimary = Color.Black,
    secondary = Color(0xFF9CA3AF),
    onSecondary = Color.Black,
    background = Color.Black,
    onBackground = Color.White,
    surface = Color.Black,
    onSurface = Color.White,
    outline = Color(0xFF333333),
  )

@Composable
fun AvishuTheme(content: @Composable () -> Unit) {
  MaterialTheme(colorScheme = Scheme, typography = Typography, content = content)
}
