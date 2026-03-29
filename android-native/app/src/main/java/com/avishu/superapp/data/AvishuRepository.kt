package com.avishu.superapp.data

import com.avishu.superapp.data.dto.AcceptOrderRpc
import com.avishu.superapp.data.dto.CompleteRpc
import com.avishu.superapp.data.dto.InsertOrderBody
import com.avishu.superapp.data.dto.OrderDto
import com.avishu.superapp.data.dto.ProductDto
import com.avishu.superapp.data.dto.ProfileDto
import com.avishu.superapp.data.dto.SignInRequest
import com.avishu.superapp.data.dto.SignUpRequest
import com.avishu.superapp.data.remote.AuthApi
import com.avishu.superapp.data.remote.PostgrestApi
import java.time.OffsetDateTime
import java.time.ZoneOffset
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.delay

@Singleton
class AvishuRepository
@Inject
constructor(
  private val authApi: AuthApi,
  private val postgrest: PostgrestApi,
  private val store: SessionStore,
) {
  fun sessionActive(): Boolean = store.accessToken != null

  fun signOut() {
    store.accessToken = null
  }

  suspend fun signIn(email: String, password: String): ProfileDto {
    val res = authApi.signInWithPassword(SignInRequest(email.trim(), password))
    val token = res.accessToken ?: error("No access token")
    store.accessToken = token
    val userId = res.user?.id ?: error("No user id")
    return loadProfileWithRetry(userId)
  }

  suspend fun signUp(email: String, password: String, role: String): ProfileDto {
    val res =
      authApi.signUp(
        SignUpRequest(email.trim(), password, mapOf("role" to role)),
      )
    val token = res.accessToken ?: error("No session (email confirmation enabled?)")
    store.accessToken = token
    val userId = res.user?.id ?: error("No user id")
    delay(350)
    return loadProfileWithRetry(userId)
  }

  private suspend fun loadProfileWithRetry(userId: String): ProfileDto {
    repeat(5) { attempt ->
      val rows =
        postgrest.profiles(
          select = "id,email,role,display_name",
          id = "eq.$userId",
        )
      val profile = rows.firstOrNull()
      if (profile != null) return profile
      delay(250L * (attempt + 1))
    }
    error("Profile row missing")
  }

  suspend fun products(): List<ProductDto> =
    postgrest.products(
      select = "id,slug,title,description,price_cents,in_stock,image_url",
      order = "sort_order.asc",
    )

  suspend fun orders(role: String, userId: String): List<OrderDto> {
    val select =
      "id,status,created_at,customer_id,is_preorder,preorder_ready_date," +
        "products(title,price_cents),production_tasks(id,step_index,label,completed_at),profiles(email)"
    return when (role) {
      "customer" ->
        postgrest.orders(
          select = select,
          order = "created_at.desc",
          customerId = "eq.$userId",
          status = null,
          createdAtGte = null,
          completedAtGte = null,
        )
      "franchisee" ->
        postgrest.orders(
          select = select,
          order = "created_at.desc",
          customerId = null,
          status = null,
          createdAtGte = null,
          completedAtGte = null,
        )
      else ->
        postgrest.orders(
          select = select,
          order = "created_at.asc",
          customerId = null,
          status = "eq.IN_PRODUCTION",
          createdAtGte = null,
          completedAtGte = null,
        )
    }
  }

  suspend fun placeOrder(
    customerId: String,
    productId: String,
    isPreorder: Boolean,
    preorderReadyDate: String?,
  ) {
    postgrest.insertOrder(
      InsertOrderBody(
        customerId = customerId,
        productId = productId,
        isPreorder = isPreorder,
        preorderReadyDate = preorderReadyDate,
      )
    )
  }

  suspend fun accept(orderId: String) {
    postgrest.acceptOrder(AcceptOrderRpc(pOrderId = orderId))
  }

  suspend fun complete(orderId: String) {
    postgrest.completeTask(CompleteRpc(orderId = orderId))
  }

  suspend fun revenueTodayCents(): Int {
    val gte = utcDayStartIso()
    val rows =
      postgrest.orders(
        select = "products(price_cents)",
        order = null,
        customerId = null,
        status = "eq.READY",
        createdAtGte = null,
        completedAtGte = "gte.$gte",
      )
    return rows.sumOf { it.products?.priceCents ?: 0 }
  }

  suspend fun placedTodayCount(): Int {
    val gte = utcDayStartIso()
    val rows =
      postgrest.orders(
        select = "id",
        order = null,
        customerId = null,
        status = null,
        createdAtGte = "gte.$gte",
        completedAtGte = null,
      )
    return rows.size
  }
}

private fun utcDayStartIso(): String =
  OffsetDateTime.now(ZoneOffset.UTC)
    .toLocalDate()
    .atStartOfDay()
    .atOffset(ZoneOffset.UTC)
    .toString()
