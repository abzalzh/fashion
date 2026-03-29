package com.avishu.superapp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.avishu.superapp.ui.AppRoot
import com.avishu.superapp.ui.theme.AvishuTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContent {
      AvishuTheme {
        Surface(modifier = Modifier.fillMaxSize()) {
          AppRoot()
        }
      }
    }
  }
}
