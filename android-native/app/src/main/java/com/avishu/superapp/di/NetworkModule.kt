package com.avishu.superapp.di

import com.avishu.superapp.BuildConfig
import com.avishu.superapp.data.SessionStore
import com.avishu.superapp.data.remote.AuthApi
import com.avishu.superapp.data.remote.PostgrestApi
import com.google.gson.Gson
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Named
import javax.inject.Singleton
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
  @Provides @Singleton fun gson(): Gson = Gson()

  @Provides @Singleton @Named("auth")
  fun authClient(): OkHttpClient {
    val log = HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BASIC }
    return OkHttpClient.Builder()
      .addInterceptor(log)
      .addInterceptor { chain ->
        val req =
          chain.request().newBuilder().addHeader("apikey", BuildConfig.SUPABASE_ANON_KEY).build()
        chain.proceed(req)
      }
      .build()
  }

  @Provides @Singleton @Named("data")
  fun dataClient(store: SessionStore): OkHttpClient {
    val log = HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BASIC }
    return OkHttpClient.Builder()
      .addInterceptor(log)
      .addInterceptor { chain ->
        val b = chain.request().newBuilder().addHeader("apikey", BuildConfig.SUPABASE_ANON_KEY)
        store.accessToken?.let { b.addHeader("Authorization", "Bearer $it") }
        chain.proceed(b.build())
      }
      .build()
  }

  @Provides @Singleton
  fun authApi(@Named("auth") client: OkHttpClient, gson: Gson): AuthApi =
    Retrofit.Builder()
      .baseUrl(baseUrl())
      .client(client)
      .addConverterFactory(GsonConverterFactory.create(gson))
      .build()
      .create(AuthApi::class.java)

  @Provides @Singleton
  fun postgrestApi(@Named("data") client: OkHttpClient, gson: Gson): PostgrestApi =
    Retrofit.Builder()
      .baseUrl(baseUrl())
      .client(client)
      .addConverterFactory(GsonConverterFactory.create(gson))
      .build()
      .create(PostgrestApi::class.java)

  private fun baseUrl(): String {
    val u = BuildConfig.SUPABASE_URL.trim()
    return if (u.endsWith("/")) u else "$u/"
  }
}
