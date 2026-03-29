package com.avishu.superapp.ui.screens

import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.avishu.superapp.ui.MainViewModel

@Composable
fun LoginScreen(vm: MainViewModel) {
  var mode by remember { mutableIntStateOf(0) } // 0 sign in, 1 register
  var email by remember { mutableStateOf("") }
  var password by remember { mutableStateOf("") }
  var roleIdx by remember { mutableIntStateOf(0) }
  val roles = remember { listOf("customer", "franchisee", "production") }

  val busy by vm.busy.collectAsState()
  val err by vm.error.collectAsState()

  Column(
    modifier =
      Modifier.fillMaxSize()
        .padding(16.dp)
        .verticalScroll(rememberScrollState()),
    verticalArrangement = Arrangement.spacedBy(12.dp),
  ) {
    Text(text = "AVISHU", style = MaterialTheme.typography.labelMedium, color = Color(0xFF6B7280))
    Text(text = "UNIFIED ACCESS", style = MaterialTheme.typography.headlineLarge)

    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
      ModeChip("SIGN IN", mode == 0) { mode = 0 }
      ModeChip("REGISTER", mode == 1) { mode = 1 }
    }

    OutlinedTextField(
      value = email,
      onValueChange = { email = it },
      modifier = Modifier.fillMaxWidth(),
      label = { Text("EMAIL") },
      keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
      singleLine = true,
    )
    OutlinedTextField(
      value = password,
      onValueChange = { password = it },
      modifier = Modifier.fillMaxWidth(),
      label = { Text("PASSWORD") },
      visualTransformation = PasswordVisualTransformation(),
      singleLine = true,
    )

    if (mode == 1) {
      Text(text = "ROLE (METADATA)", style = MaterialTheme.typography.labelMedium)
      Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
        roles.forEachIndexed { idx, r ->
          ModeChip(r.uppercase(), idx == roleIdx) { roleIdx = idx }
        }
      }
    }

    err?.let {
      Text(text = it, style = MaterialTheme.typography.bodyMedium, color = Color.White)
    }

    Button(
      onClick = {
        vm.clearError()
        if (mode == 0) vm.signIn(email, password) else vm.signUp(email, password, roles[roleIdx])
      },
      enabled = !busy && email.contains('@') && password.length >= 6,
      modifier = Modifier.fillMaxWidth(),
      colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = Color.Black),
    ) {
      Text(text = if (busy) "PLEASE WAIT" else "CONTINUE")
    }
  }
}

@Composable
private fun ModeChip(label: String, active: Boolean, onClick: () -> Unit) {
  Button(
    onClick = onClick,
    modifier = Modifier.border(1.dp, Color(0xFF333333)),
    colors =
      ButtonDefaults.buttonColors(
        containerColor = if (active) Color.White else Color.Black,
        contentColor = if (active) Color.Black else Color.White,
      ),
  ) {
    Text(text = label, style = MaterialTheme.typography.labelMedium)
  }
}
