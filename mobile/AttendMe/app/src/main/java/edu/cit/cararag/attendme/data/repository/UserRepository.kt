package edu.cit.cararag.attendme.data.repository

import edu.cit.cararag.attendme.data.model.User
import edu.cit.cararag.attendme.data.remote.RetrofitClient

class UserRepository {

    private val api = RetrofitClient.instance

    suspend fun getAllUsers(): Result<List<User>> {
        return try {
            val response = api.getAllUsers()
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()?.data ?: emptyList())
            } else {
                Result.failure(Exception("Failed to load users"))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Cannot connect to server"))
        }
    }

    suspend fun getUsersByRole(role: String): Result<List<User>> {
        return try {
            val response = api.getUsersByRole(role)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()?.data ?: emptyList())
            } else {
                Result.failure(Exception("Failed to load users"))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Cannot connect to server"))
        }
    }
}