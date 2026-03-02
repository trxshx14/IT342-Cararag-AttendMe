package com.attendme.service;

import com.attendme.dto.requestdto.AttendanceRequest;
import com.attendme.dto.requestdto.BulkAttendanceRequest;
import com.attendme.dto.response.AttendanceResponse;
import com.attendme.dto.response.DailyReportResponse;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface AttendanceService {
    
    
    AttendanceResponse markAttendance(AttendanceRequest request);
    
    
    List<AttendanceResponse> markBulkAttendance(BulkAttendanceRequest request);
    
    
    AttendanceResponse updateAttendance(Long attendanceId, AttendanceRequest request);
    
    
    void deleteAttendance(Long attendanceId);
    
    
    AttendanceResponse getAttendanceById(Long attendanceId);
    
    
    List<AttendanceResponse> getAttendanceByClassAndDate(Long classId, LocalDate date);
    
    
    List<AttendanceResponse> getAttendanceByStudentAndDateRange(Long studentId, LocalDate startDate, LocalDate endDate);
    
    
    Map<String, Long> getAttendanceSummary(Long classId, LocalDate date);
    
    
    DailyReportResponse generateDailyReport(Long classId, LocalDate date);
    
    
    boolean hasAttendanceBeenMarked(Long classId, Long studentId, LocalDate date);
}
