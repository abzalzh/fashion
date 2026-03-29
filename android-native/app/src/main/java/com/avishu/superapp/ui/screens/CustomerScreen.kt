package com.avishu.superapp.ui.screens

import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
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
import androidx.compose.ui.unit.dp
import com.avishu.superapp.data.dto.OrderDto
import com.avishu.superapp.data.dto.ProductDto
import com.avishu.superapp.ui.MainViewModel
import com.avishu.superapp.ui.formatMoney
import java.time.LocalDate

@Composable
fun CustomerScreen(vm: MainViewModel) {
  val orders by vm.orders.collectAsState()
  val products by vm.products.collectAsState()
  var tab by remember { mutableIntStateOf(0) } // 0 store 1 orders
  var active by remember { mutableStateOf<ProductDto?>(null) }
  var preorderDays by remember { mutableIntStateOf(14) }

  Column(modifier = Modifier.fillMaxSize()) {
    Row(
      modifier =
        Modifier.fillMaxWidth()
          .border(1.dp, Color(0xFF333333))
          .padding(horizontal = 16.dp, vertical = 12.dp),
      horizontalArrangement = Arrangement.SpaceBetween,
    ) {
      Column {
        Text("CUSTOMER · STOREFRONT", style = MaterialTheme.typography.labelMedium, color = Color(0xFF6B7280))
        Text("AVISHU", style = MaterialTheme.typography.headlineLarge)
      }
      Button(
        onClick = { vm.signOut() },
        colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = Color.Black),
      ) {
        Text("SIGN OUT", style = MaterialTheme.typography.labelMedium)
      }
    }

    Row(modifier = Modifier.fillMaxWidth()) {
      TabBtn("CATALOG", tab == 0) { tab = 0 }
      TabBtn("PROFILE · ORDERS", tab == 1) { tab = 1 }
    }

    val scroll = rememberScrollState()
    Column(
      modifier =
        Modifier.fillMaxSize()
          .verticalScroll(scroll)
          .padding(16.dp),
      verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
      if (tab == 0) {
        Text("COLLECTION 01", style = MaterialTheme.typography.labelMedium, color = Color(0xFF6B7280))
        Text("MONOLITH LINE", style = MaterialTheme.typography.headlineLarge)
        Text(
          "Editorial spacing. Replace catalog imagery via Supabase `products.image_url`.",
          style = MaterialTheme.typography.bodyMedium,
          color = Color(0xFF9CA3AF),
        )

        Text("PRODUCTS", style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(top = 10.dp))

        products.chunked(2).forEach { row ->
          Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
            for (p in row) {
              ProductTile(p, modifier = Modifier.weight(1f)) { active = p }
            }
          }
        }
      } else {
        val done = orders.count { it.status == "READY" }
        val loyalty = minOf(100, done * 25)
        Text("LOYALTY (UI ONLY)", style = MaterialTheme.typography.titleMedium)
        LinearProgressIndicator(
          progress = { loyalty / 100f },
          modifier = Modifier.fillMaxWidth(),
          color = Color.White,
          trackColor = Color(0xFF333333),
        )
        Text("$loyalty% TOWARD NEXT TIER", style = MaterialTheme.typography.labelMedium, color = Color(0xFF9CA3AF))

        Text("ACTIVE ORDERS", style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(top = 12.dp))
        if (orders.isEmpty()) {
          Text("NO ORDERS YET", color = Color(0xFF9CA3AF))
        }
        orders.forEach { OrderRow(it) }
      }
    }
  }

  active?.let { p ->
    val date = remember(preorderDays) { LocalDate.now().plusDays(preorderDays.toLong()) }
    AlertDialog(
      onDismissRequest = { active = null },
      confirmButton = {
        Button(
          onClick = {
            vm.placeOrder(
              productId = p.id,
              isPreorder = !p.inStock,
              preorderReadyDate =
                if (p.inStock) {
                  null
                } else {
                  date.toString()
                },
            )
            active = null
          },
          colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = Color.Black),
        ) {
          Text(if (p.inStock) "BUY NOW" else "PLACE PRE-ORDER")
        }
      },
      dismissButton = {
        Button(
          onClick = { active = null },
          colors = ButtonDefaults.buttonColors(containerColor = Color.Black, contentColor = Color.White),
        ) {
          Text("CLOSE")
        }
      },
      title = { Text(p.title.uppercase(), style = MaterialTheme.typography.headlineLarge) },
      text = {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
          Text(if (p.inStock) "IN STOCK" else "PRE-ORDER", style = MaterialTheme.typography.labelMedium)
          Text(formatMoney(p.priceCents) + " MRP", style = MaterialTheme.typography.bodyMedium)
          Text(p.description ?: "—", style = MaterialTheme.typography.bodyMedium, color = Color(0xFF9CA3AF))
          if (!p.inStock) {
            Text("READY DATE OFFSET (DAYS)", style = MaterialTheme.typography.labelMedium)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
              Button(onClick = { preorderDays = (preorderDays - 1).coerceAtLeast(7) }) { Text("−") }
              Text(date.toString(), style = MaterialTheme.typography.bodyMedium)
              Button(onClick = { preorderDays = (preorderDays + 1).coerceAtMost(120) }) { Text("+") }
            }
          }
        }
      },
    )
  }
}

@Composable
private fun TabBtn(label: String, active: Boolean, onClick: () -> Unit) {
  Button(
    onClick = onClick,
    modifier = Modifier.weight(1f).border(1.dp, Color(0xFF333333)),
    colors =
      ButtonDefaults.buttonColors(
        containerColor = if (active) Color.White else Color.Black,
        contentColor = if (active) Color.Black else Color.White,
      ),
  ) {
    Text(label, style = MaterialTheme.typography.labelMedium)
  }
}

@Composable
private fun ProductTile(p: ProductDto, modifier: Modifier = Modifier, onOpen: () -> Unit) {
  Column(
    modifier =
      modifier
        .border(1.dp, Color(0xFF333333))
        .padding(10.dp),
    verticalArrangement = Arrangement.spacedBy(6.dp),
  ) {
    Text(
      text =
        if (p.imageUrl.isNullOrBlank()) {
          "IMAGE PLACEHOLDER\n(SET URL IN DB)"
        } else {
          "IMAGE: SEE URL"
        },
      style = MaterialTheme.typography.labelMedium,
      color = Color(0xFF6B7280),
    )
    Text(p.title.uppercase(), style = MaterialTheme.typography.titleMedium)
    Text(if (p.inStock) "IN STOCK" else "PRE-ORDER", style = MaterialTheme.typography.labelMedium, color = Color(0xFF9CA3AF))
    Text(formatMoney(p.priceCents) + " MRP", style = MaterialTheme.typography.bodyMedium)
    Button(
      onClick = onOpen,
      colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = Color.Black),
      modifier = Modifier.fillMaxWidth(),
    ) {
      Text("OPEN")
    }
  }
}

@Composable
private fun OrderRow(o: OrderDto) {
  Column(
    modifier =
      Modifier.fillMaxWidth()
        .border(1.dp, Color(0xFF333333))
        .padding(14.dp),
    verticalArrangement = Arrangement.spacedBy(8.dp),
  ) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
      Text(o.products?.title?.uppercase() ?: "PRODUCT", style = MaterialTheme.typography.titleMedium)
      Text(o.id.take(8).uppercase(), style = MaterialTheme.typography.labelMedium, color = Color(0xFF6B7280))
    }
    val idx =
      when (o.status) {
        "PLACED" -> 0
        "IN_PRODUCTION" -> 1
        else -> 2
      }
    Row(
      modifier = Modifier.fillMaxWidth(),
      horizontalArrangement = Arrangement.SpaceBetween,
    ) {
      listOf("Placed", "In Production", "Ready").forEachIndexed { i, label ->
        val lit = i <= idx
        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
          Text(
            "■",
            color = if (lit) Color.White else Color(0xFF333333),
            style = MaterialTheme.typography.headlineLarge,
          )
          Text(
            label.uppercase(),
            style = MaterialTheme.typography.labelMedium,
            color = if (lit) Color.White else Color(0xFF6B7280),
          )
        }
      }
    }
    if (o.isPreorder) {
      Text("PRE-ORDER · READY DATE ${o.preorderReadyDate ?: "TBD"}", style = MaterialTheme.typography.labelMedium, color = Color(0xFF9CA3AF))
    }
  }
}
