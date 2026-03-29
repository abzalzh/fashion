package com.avishu.superapp.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.avishu.superapp.BuildConfig
import com.avishu.superapp.ui.screens.CustomerScreen
import com.avishu.superapp.ui.screens.FranchiseeScreen
import com.avishu.superapp.ui.screens.LoginScreen
import com.avishu.superapp.ui.screens.ProductionScreen
import kotlinx.coroutines.delay

@Composable
fun AppRoot(vm: MainViewModel = hiltViewModel()) {
  if (BuildConfig.SUPABASE_URL.isBlank() || BuildConfig.SUPABASE_ANON_KEY.isBlank()) {
    Column(
      modifier = Modifier.fillMaxSize().padding(24.dp),
      verticalArrangement = Arrangement.Center,
    ) {
      Text(
        text = "SUPABASE_URL / SUPABASE_ANON_KEY are missing.\n\nAdd them to android-native/local.properties (see TempGuide.txt).",
        style = androidx.compose.material3.MaterialTheme.typography.bodyMedium,
        textAlign = TextAlign.Start,
      )
    }
    return
  }

  val profile by vm.profile.collectAsState()

  LaunchedEffect(profile?.id) {
    if (profile == null) return@LaunchedEffect
    while (true) {
      vm.pollTick()
      delay(2000)
    }
  }

  when (profile?.role) {
    null -> LoginScreen(vm)
    "customer" -> CustomerScreen(vm)
    "franchisee" -> FranchiseeScreen(vm)
    "production" -> ProductionScreen(vm)
    else -> LoginScreen(vm)
  }
}
