package com.avishu.superapp.ui.screens

import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.avishu.superapp.data.dto.OrderDto
import com.avishu.superapp.data.dto.ProductionTaskDto
import com.avishu.superapp.ui.MainViewModel

private fun nextTask(o: OrderDto): ProductionTaskDto? =
  o.productionTasks.orEmpty().sortedBy { it.stepIndex }.firstOrNull { it.completedAt == null }

@Composable
fun ProductionScreen(vm: MainViewModel) {
  val orders by vm.orders.collectAsState()
  val active =
    remember(orders) {
      for (o in orders) {
        val t = nextTask(o) ?: continue
        return@remember o to t
      }
      null
    }

  Column(modifier = Modifier.fillMaxSize()) {
    Row(
      modifier =
        Modifier.fillMaxWidth()
          .border(1.dp, Color(0xFF333333))
          .padding(16.dp),
      horizontalArrangement = Arrangement.SpaceBetween,
    ) {
      Column {
        Text("WORKSHOP", style = MaterialTheme.typography.labelMedium, color = Color(0xFF6B7280))
        Text("QUEUE", style = MaterialTheme.typography.headlineLarge)
      }
      Button(
        onClick = { vm.signOut() },
        colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = Color.Black),
      ) {
        Text("EXIT")
      }
    }

    active?.let { (order, task) ->
      Column(
        modifier =
          Modifier.padding(16.dp)
            .border(2.dp, Color.White)
            .padding(18.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
      ) {
        Text("ACTIVE TASK", style = MaterialTheme.typography.labelMedium, color = Color(0xFF6B7280))
        Text(
          order.products?.title?.uppercase() ?: "PRODUCT",
          style = MaterialTheme.typography.headlineLarge,
        )
        Text(task.label, fontSize = 44.sp, fontWeight = FontWeight.Bold, color = Color.White)
        Text("STAGE ${task.stepIndex} · COMPLETE CURRENT OPERATION", color = Color(0xFF9CA3AF))
        Button(
          onClick = { vm.complete(order.id) },
          modifier = Modifier.fillMaxWidth(),
          colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = Color.Black),
        ) {
          Text("COMPLETE STAGE", style = MaterialTheme.typography.titleMedium)
        }
      }
    }

    Text(
      "SEWING QUEUE",
      style = MaterialTheme.typography.titleMedium,
      modifier =
        Modifier.fillMaxWidth()
          .border(1.dp, Color(0xFF333333))
          .padding(16.dp),
    )

    val queue = orders.filter { nextTask(it) != null }
    LazyColumn(
      contentPadding = PaddingValues(16.dp),
      verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
      items(queue, key = { it.id }) { o ->
        val t = nextTask(o)
        Column(
          modifier =
            Modifier.fillMaxWidth()
              .border(1.dp, Color(0xFF333333))
              .padding(14.dp),
        ) {
          Text(o.products?.title?.uppercase() ?: "PRODUCT", style = MaterialTheme.typography.titleMedium)
          Text(t?.let { "NEXT · ${it.label}" } ?: "—", color = Color(0xFF9CA3AF))
        }
      }
      if (queue.isEmpty()) {
        item { Text("NO ACTIVE JOBS", color = Color(0xFF6B7280), modifier = Modifier.padding(top = 16.dp)) }
      }
    }
  }
}
