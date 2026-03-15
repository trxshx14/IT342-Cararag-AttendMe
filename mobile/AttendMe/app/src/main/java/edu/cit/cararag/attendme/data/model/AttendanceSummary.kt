package edu.cit.cararag.attendme.data.model

data class AttendanceSummary(
    val present: Long,
    val absent: Long,
    val late: Long,
    val excused: Long
)