package com.avishu.superapp.ui.screens

import androidx.compose.foundation.border
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.avishu.superapp.data.dto.OrderDto
import com.avishu.superapp.ui.MainViewModel
import com.avishu.superapp.ui.formatMoney

@Composable
fun FranchiseeScreen(vm: MainViewModel) {
  val orders by vm.orders.collectAsState()
  val revenue by vm.revenueToday.collectAsState()
  val placed by vm.placedToday.collectAsState()
  var tab by remember { mutableIntStateOf(0) }

  Column(modifier = Modifier.fillMaxSize()) {
    Row(
      modifier =
        Modifier.fillMaxWidth()
          .border(1.dp, Color(0xFF333333))
          .padding(16.dp),
      horizontalArrangement = Arrangement.SpaceBetween,
    ) {
      Column {
        Text("FRANCHISEE · CONTROL TOWER", style = MaterialTheme.typography.labelMedium, color = Color(0xFF6B7280))
        Text("OPERATIONS", style = MaterialTheme.typography.headlineLarge)
      }
      Button(
        onClick = { vm.signOut() },
        colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = Color.Black),
      ) {
        Text("SIGN OUT")
      }
    }

    Row(Modifier.fillMaxWidth()) {
      Tab("ANALYTICS", tab == 0) { tab = 0 }
      Tab("PIPELINE", tab == 1) { tab = 1 }
    }

    if (tab == 0) {
      Column(
        modifier =
          Modifier.fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
      ) {
        Text("MANAGER · DASHBOARD", style = MaterialTheme.typography.titleMedium)
        Metric(
          title = "TODAY'S REVENUE (READY · COMPLETED TODAY)",
          value = formatMoney(revenue),
          hint = "REAL DATA FROM SUPABASE",
        )
        val target = 10
        val pct = minOf(100, (placed * 100) / target.coerceAtLeast(1))
        Metric(
          title = "PLAN FULFILMENT (ORDERS PLACED · VS TARGET)",
          value = "$pct%",
          hint = "TARGET $target · ACTUAL $placed",
        )
        Metric(
          title = "PIPELINE HEALTH (PLACEHOLDER COMPOSITE)",
          value = "STABLE",
          hint = "HOOK FOR FUTURE SLA / LEAD TIME SIGNALS",
        )
      }
    } else {
      val placedOrders = orders.filter { it.status == "PLACED" }
      val active = orders.filter { it.status == "IN_PRODUCTION" }
      val done = orders.filter { it.status == "READY" }

      Row(
        modifier =
          Modifier.fillMaxSize()
            .horizontalScroll(rememberScrollState())
            .padding(16.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
      ) {
        KanbanColumn("NEW · PLACED") {
          placedOrders.forEach { Card(it, onAccept = { vm.accept(it.id) }) }
          if (placedOrders.isEmpty()) Text("EMPTY", color = Color(0xFF6B7280))
        }
        KanbanColumn("IN PRODUCTION") {
          active.forEach { ActiveCard(it) }
          if (active.isEmpty()) Text("EMPTY", color = Color(0xFF6B7280))
        }
        KanbanColumn("READY") {
          done.forEach { ReadyCard(it) }
          if (done.isEmpty()) Text("EMPTY", color = Color(0xFF6B7280))
        }
      }
    }
  }
}

@Composable
private fun Tab(label: String, active: Boolean, onClick: () -> Unit) {
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
private fun Metric(title: String, value: String, hint: String) {
  Column(
    modifier =
      Modifier.fillMaxWidth()
        .border(1.dp, Color(0xFF333333))
        .padding(14.dp),
    verticalArrangement = Arrangement.spacedBy(6.dp),
  ) {
    Text(title, style = MaterialTheme.typography.labelMedium, color = Color(0xFF9CA3AF))
    Text(value, style = MaterialTheme.typography.headlineLarge)
    Text(hint, style = MaterialTheme.typography.labelMedium, color = Color(0xFF6B7280))
  }
}

@Composable
private fun KanbanColumn(title: String, content: @Composable Column.() -> Unit) {
  Column(
    modifier =
      Modifier.width(260.dp)
        .fillMaxHeight()
        .padding(bottom = 12.dp)
        .border(1.dp, Color(0xFF333333))
        .padding(10.dp),
    verticalArrangement = Arrangement.spacedBy(10.dp),
  ) {
    Text(title, style = MaterialTheme.typography.titleMedium)
    content()
  }
}

@Composable
private fun Card(o: OrderDto, onAccept: () -> Unit) {
  Column(
    modifier =
      Modifier.fillMaxWidth()
        .border(1.dp, Color(0xFF333333))
        .padding(12.dp),
    verticalArrangement = Arrangement.spacedBy(6.dp),
  ) {
    Text(o.products?.title?.uppercase() ?: "PRODUCT", style = MaterialTheme.typography.titleMedium)
    Text(o.profiles?.email ?: o.customerId.take(8), style = MaterialTheme.typography.bodyMedium, color = Color(0xFF9CA3AF))
    Button(
      onClick = onAccept,
        colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = Color.Black),
      modifier = Modifier.fillMaxWidth(),
    ) {
      Text("ACCEPT")
    }
  }
}

@Composable
private fun ActiveCard(o: OrderDto) {
  Column(
    modifier =
      Modifier.fillMaxWidth()
        .border(1.dp, Color(0xFF333333))
        .padding(12.dp),
    verticalArrangement = Arrangement.spacedBy(6.dp),
  ) {
    Text(o.products?.title?.uppercase() ?: "PRODUCT", style = MaterialTheme.typography.titleMedium)
    o.productionTasks.orEmpty().sortedBy { it.stepIndex }.forEach { t ->
      Text("${t.label} · ${if (t.completedAt == null) "OPEN" else "DONE"}", color = Color(0xFF9CA3AF))
    }
  }
}

@Composable
private fun ReadyCard(o: OrderDto) {
  Column(
    modifier =
      Modifier.fillMaxWidth()
        .border(1.dp, Color(0xFF333333))
        .padding(12.dp),
  ) {
    Text(o.products?.title?.uppercase() ?: "PRODUCT", style = MaterialTheme.typography.titleMedium)
    Text("READY", style = MaterialTheme.typography.labelMedium, color = Color(0xFF9CA3AF))
  }
}
