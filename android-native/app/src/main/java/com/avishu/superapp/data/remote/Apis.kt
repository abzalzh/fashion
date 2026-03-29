package com.avishu.superapp.data.remote

import com.avishu.superapp.data.dto.AcceptOrderRpc
import com.avishu.superapp.data.dto.AuthResponse
import com.avishu.superapp.data.dto.CompleteRpc
import com.avishu.superapp.data.dto.InsertOrderBody
import com.avishu.superapp.data.dto.OrderDto
import com.avishu.superapp.data.dto.ProductDto
import com.avishu.superapp.data.dto.ProfileDto
import com.avishu.superapp.data.dto.SignInRequest
import com.avishu.superapp.data.dto.SignUpRequest
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Query

interface AuthApi {
  @POST("auth/v1/token?grant_type=password")
  suspend fun signInWithPassword(@Body body: SignInRequest): AuthResponse

  @POST("auth/v1/signup")
  suspend fun signUp(@Body body: SignUpRequest): AuthResponse
}

interface PostgrestApi {
  @GET("rest/v1/profiles")
  suspend fun profiles(
    @Query("select") select: String,
    @Query("id") id: String,
  ): List<ProfileDto>

  @GET("rest/v1/products")
  suspend fun products(
    @Query("select") select: String,
    @Query("order") order: String,
  ): List<ProductDto>

  @GET("rest/v1/orders")
  suspend fun orders(
    @Query("select") select: String,
    @Query("order") order: String?,
    @Query("customer_id") customerId: String?,
    @Query("status") status: String?,
    @Query("created_at") createdAtGte: String?,
    @Query("completed_at") completedAtGte: String?,
  ): List<OrderDto>

  @POST("rest/v1/orders")
  suspend fun insertOrder(
    @Body body: InsertOrderBody,
    @Header("Prefer") prefer: String = "return=representation",
  ): List<OrderDto>

  @POST("rest/v1/rpc/accept_order")
  suspend fun acceptOrder(@Body body: AcceptOrderRpc)

  @POST("rest/v1/rpc/complete_current_production_task")
  suspend fun completeTask(@Body body: CompleteRpc)
}
