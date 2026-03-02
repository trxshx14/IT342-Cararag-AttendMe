package com.attendme.service;

import com.attendme.dto.requestdto.StudentRequest;
import com.attendme.dto.response.AttendanceSummaryResponse;
import com.attendme.dto.response.StudentResponse;

import java.util.List;

public interface StudentService {
    
    
    StudentResponse createStudent(StudentRequest request);
    
    
    StudentResponse getStudentById(Long id);
    
    StudentResponse getStudentByRollNumber(String rollNumber);
    
    
    List<StudentResponse> getAllStudents();
    
    
    List<StudentResponse> getStudentsByClass(Long classId);
    
    
    List<StudentResponse> searchStudents(String name);
    
    
    StudentResponse updateStudent(Long id, StudentRequest request);
    
    
    void deleteStudent(Long id);
    
    
    StudentResponse assignToClass(Long studentId, Long classId);
    
    StudentResponse removeFromClass(Long studentId);
    
    
    AttendanceSummaryResponse getStudentAttendanceSummary(Long studentId, String startDate, String endDate);
}
