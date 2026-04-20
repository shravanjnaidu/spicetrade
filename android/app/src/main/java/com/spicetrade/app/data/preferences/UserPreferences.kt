package com.spicetrade.app.data.preferences

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.google.gson.Gson
import com.spicetrade.app.data.models.User
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "spicetrade_prefs")

class UserPreferences(private val context: Context) {

    private val gson = Gson()

    companion object {
        private val USER_KEY  = stringPreferencesKey("current_user")
        private val TOKEN_KEY = stringPreferencesKey("auth_token")
    }

    val currentUser: Flow<User?> = context.dataStore.data.map { prefs ->
        prefs[USER_KEY]?.let { json ->
            try { gson.fromJson(json, User::class.java) } catch (e: Exception) { null }
        }
    }

    val authToken: Flow<String?> = context.dataStore.data.map { prefs ->
        prefs[TOKEN_KEY]
    }

    suspend fun saveUser(user: User) {
        context.dataStore.edit { prefs ->
            prefs[USER_KEY] = gson.toJson(user)
        }
    }

    suspend fun saveToken(token: String) {
        context.dataStore.edit { prefs ->
            prefs[TOKEN_KEY] = token
        }
    }

    suspend fun clearUser() {
        context.dataStore.edit { prefs ->
            prefs.remove(USER_KEY)
            prefs.remove(TOKEN_KEY)
        }
    }
}
