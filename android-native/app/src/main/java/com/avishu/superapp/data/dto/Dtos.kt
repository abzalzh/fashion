package com.avishu.superapp.data.dto

import com.google.gson.annotations.SerializedName

data class SignInRequest(
  @SerializedName("email") val email: String,
  @SerializedName("password") val password: String,
)

data class SignUpRequest(
  @SerializedName("email") val email: String,
  @SerializedName("password") val password: String,
  @SerializedName("data") val data: Map<String, String>,
)

data class AuthResponse(
  @SerializedName("access_token") val accessToken: String?,
  @SerializedName("user") val user: AuthUserDto?,
)

data class AuthUserDto(@SerializedName("id") val id: String)

data class ProfileDto(
  @SerializedName("id") val id: String,
  @SerializedName("email") val email: String,
  @SerializedName("role") val role: String,
  @SerializedName("display_name") val displayName: String?,
)

data class ProductDto(
  @SerializedName("id") val id: String,
  @SerializedName("slug") val slug: String,
  @SerializedName("title") val title: String,
  @SerializedName("description") val description: String?,
  @SerializedName("price_cents") val priceCents: Int,
  @SerializedName("in_stock") val inStock: Boolean,
  @SerializedName("image_url") val imageUrl: String?,
)

data class ProductEmbedDto(
  @SerializedName("title") val title: String?,
  @SerializedName("price_cents") val priceCents: Int?,
)

data class ProfileEmbedDto(@SerializedName("email") val email: String?)

data class ProductionTaskDto(
  @SerializedName("id") val id: String,
  @SerializedName("step_index") val stepIndex: Int,
  @SerializedName("label") val label: String,
  @SerializedName("completed_at") val completedAt: String?,
)

data class OrderDto(
  @SerializedName("id") val id: String,
  @SerializedName("status") val status: String,
  @SerializedName("created_at") val createdAt: String,
  @SerializedName("is_preorder") val isPreorder: Boolean,
  @SerializedName("preorder_ready_date") val preorderReadyDate: String?,
  @SerializedName("customer_id") val customerId: String,
  @SerializedName("products") val products: ProductEmbedDto?,
  @SerializedName("production_tasks") val productionTasks: List<ProductionTaskDto>?,
  @SerializedName("profiles") val profiles: ProfileEmbedDto?,
)

data class InsertOrderBody(
  @SerializedName("customer_id") val customerId: String,
  @SerializedName("product_id") val productId: String,
  @SerializedName("status") val status: String = "PLACED",
  @SerializedName("is_preorder") val isPreorder: Boolean,
  @SerializedName("preorder_ready_date") val preorderReadyDate: String?,
)

data class AcceptOrderRpc(@SerializedName("p_order_id") val pOrderId: String)

data class CompleteRpc(@SerializedName("p_order_id") val orderId: String)
