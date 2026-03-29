package com.avishu.superapp.data

import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SessionStore @Inject constructor() {
  @Volatile
  var accessToken: String? = null
}
