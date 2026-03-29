package com.avishu.superapp.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.avishu.superapp.data.AvishuRepository
import com.avishu.superapp.data.dto.OrderDto
import com.avishu.superapp.data.dto.ProductDto
import com.avishu.superapp.data.dto.ProfileDto
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

@HiltViewModel
class MainViewModel
@Inject
constructor(
  private val repo: AvishuRepository,
) : ViewModel() {
  private val _profile = MutableStateFlow<ProfileDto?>(null)
  val profile: StateFlow<ProfileDto?> = _profile.asStateFlow()

  private val _orders = MutableStateFlow<List<OrderDto>>(emptyList())
  val orders: StateFlow<List<OrderDto>> = _orders.asStateFlow()

  private val _products = MutableStateFlow<List<ProductDto>>(emptyList())
  val products: StateFlow<List<ProductDto>> = _products.asStateFlow()

  private val _revenueToday = MutableStateFlow(0)
  val revenueToday: StateFlow<Int> = _revenueToday.asStateFlow()

  private val _placedToday = MutableStateFlow(0)
  val placedToday: StateFlow<Int> = _placedToday.asStateFlow()

  private val _error = MutableStateFlow<String?>(null)
  val error: StateFlow<String?> = _error.asStateFlow()

  private val _busy = MutableStateFlow(false)
  val busy: StateFlow<Boolean> = _busy.asStateFlow()

  fun clearError() {
    _error.value = null
  }

  /** Called on a timer from UI to approximate realtime updates (Expo client uses Supabase Realtime). */
  fun pollTick() {
    viewModelScope.launch {
      val p = _profile.value ?: return@launch
      try {
        refreshAll(p)
      } catch (_: Exception) {
      }
    }
  }

  suspend fun refresh() {
    val p = _profile.value ?: return
    refreshAll(p)
  }

  private suspend fun refreshAll(p: ProfileDto) {
    _orders.value = repo.orders(p.role, p.id)
    if (p.role == "customer") {
      _products.value = repo.products()
    }
    if (p.role == "franchisee") {
      _revenueToday.value = repo.revenueTodayCents()
      _placedToday.value = repo.placedTodayCount()
    }
  }

  fun signIn(email: String, password: String) {
    viewModelScope.launch {
      _busy.value = true
      try {
        _profile.value = repo.signIn(email, password)
        refreshAll(_profile.value!!)
      } catch (e: Exception) {
        _error.value = e.message ?: "sign_in_failed"
      } finally {
        _busy.value = false
      }
    }
  }

  fun signUp(email: String, password: String, role: String) {
    viewModelScope.launch {
      _busy.value = true
      try {
        _profile.value = repo.signUp(email, password, role)
        refreshAll(_profile.value!!)
      } catch (e: Exception) {
        _error.value = e.message ?: "sign_up_failed"
      } finally {
        _busy.value = false
      }
    }
  }

  fun signOut() {
    repo.signOut()
    _profile.value = null
    _orders.value = emptyList()
    _products.value = emptyList()
  }

  fun accept(orderId: String) {
    viewModelScope.launch {
      try {
        repo.accept(orderId)
        _profile.value?.let { refreshAll(it) }
      } catch (e: Exception) {
        _error.value = e.message
      }
    }
  }

  fun complete(orderId: String) {
    viewModelScope.launch {
      try {
        repo.complete(orderId)
        _profile.value?.let { refreshAll(it) }
      } catch (e: Exception) {
        _error.value = e.message
      }
    }
  }

  fun placeOrder(productId: String, isPreorder: Boolean, preorderReadyDate: String?) {
    val p = _profile.value ?: return
    viewModelScope.launch {
      try {
        repo.placeOrder(
          customerId = p.id,
          productId = productId,
          isPreorder = isPreorder,
          preorderReadyDate = preorderReadyDate,
        )
        refreshAll(p)
      } catch (e: Exception) {
        _error.value = e.message
      }
    }
  }
}
