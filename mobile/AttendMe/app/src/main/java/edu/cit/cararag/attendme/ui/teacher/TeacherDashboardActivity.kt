package edu.cit.cararag.attendme.ui.teacher

import android.content.Intent
import android.os.Bundle
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import edu.cit.cararag.attendme.R
import edu.cit.cararag.attendme.ui.login.LoginActivity
import edu.cit.cararag.attendme.utils.SessionManager

class TeacherDashboardActivity : AppCompatActivity() {

    private lateinit var sessionManager: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_teacher_dashboard)

        sessionManager = SessionManager(this)

        // Show teacher name
        findViewById<TextView>(R.id.tvWelcome).text =
            "Welcome, ${sessionManager.getFullName() ?: "Teacher"}!"

        // Logout
        findViewById<TextView>(R.id.tvLogout).setOnClickListener {
            sessionManager.clearSession()
            startActivity(Intent(this, LoginActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            })
        }
    }
}