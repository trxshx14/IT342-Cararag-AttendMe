package edu.cit.cararag.attendme.ui.login

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.textfield.TextInputEditText
import android.widget.Button
import android.widget.ProgressBar
import android.widget.TextView
import edu.cit.cararag.attendme.R
import edu.cit.cararag.attendme.data.remote.RetrofitClient
import edu.cit.cararag.attendme.ui.admin.AdminDashboardActivity
import edu.cit.cararag.attendme.ui.teacher.TeacherDashboardActivity
import edu.cit.cararag.attendme.utils.SessionManager

class LoginActivity : AppCompatActivity() {

    private val viewModel: LoginViewModel by viewModels()
    private lateinit var sessionManager: SessionManager

    private lateinit var etEmail: TextInputEditText
    private lateinit var etPassword: TextInputEditText
    private lateinit var btnLogin: Button
    private lateinit var progressBar: ProgressBar
    private lateinit var tvError: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        sessionManager = SessionManager(this)

        // If already logged in, skip to dashboard
        if (sessionManager.isLoggedIn()) {
            navigateToDashboard(sessionManager.getRole() ?: "TEACHER")
            return
        }

        // Bind views
        etEmail     = findViewById(R.id.etEmail)
        etPassword  = findViewById(R.id.etPassword)
        btnLogin    = findViewById(R.id.btnLogin)
        progressBar = findViewById(R.id.progressBar)
        tvError     = findViewById(R.id.tvError)

        btnLogin.setOnClickListener {
            val email    = etEmail.text.toString()
            val password = etPassword.text.toString()
            viewModel.login(email, password)
        }

        // Observe login state
        viewModel.loginState.observe(this) { state ->
            when (state) {
                is LoginState.Loading -> {
                    btnLogin.isEnabled  = false
                    progressBar.visibility = View.VISIBLE
                    tvError.visibility  = View.GONE
                }
                is LoginState.Success -> {
                    progressBar.visibility = View.GONE
                    btnLogin.isEnabled  = true

                    val data = state.data

                    // Save JWT to secure storage
                    RetrofitClient.setToken(data.accessToken)
                    sessionManager.saveSession(
                        accessToken  = data.accessToken,
                        refreshToken = data.refreshToken,
                        userId       = data.userId,
                        username     = data.username,
                        fullName     = data.fullName ?: data.username,
                        email        = data.email,
                        role         = data.role,
                        profilePicUrl = data.profilePicUrl
                    )

                    navigateToDashboard(data.role)
                }
                is LoginState.Error -> {
                    progressBar.visibility = View.GONE
                    btnLogin.isEnabled  = true
                    tvError.text        = state.message
                    tvError.visibility  = View.VISIBLE
                }
            }
        }
    }

    private fun navigateToDashboard(role: String) {
        val intent = if (role.uppercase() == "ADMIN") {
            Intent(this, AdminDashboardActivity::class.java)
        } else {
            Intent(this, TeacherDashboardActivity::class.java)
        }
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }
}