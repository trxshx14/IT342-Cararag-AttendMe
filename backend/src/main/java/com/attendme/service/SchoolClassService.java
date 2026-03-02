package com.attendme.service;

import com.attendme.dto.requestdto.SchoolClassRequest;
import com.attendme.dto.response.SchoolClassResponse;
import com.attendme.dto.response.StudentResponse;

import java.util.List;

public interface SchoolClassService {
    
    
    SchoolClassResponse createClass(SchoolClassRequest request);
    
    
    SchoolClassResponse getClassById(Long id);
    
    
    List<SchoolClassResponse> getAllClasses();
    
    
    List<SchoolClassResponse> getClassesByTeacher(Long teacherId);
    
    
    List<SchoolClassResponse> getClassesByAcademicYear(String academicYear);
    
    
    SchoolClassResponse updateClass(Long id, SchoolClassRequest request);
    
    
    void deleteClass(Long id);
    
    
    SchoolClassResponse addStudentToClass(Long classId, Long studentId);
    
    SchoolClassResponse removeStudentFromClass(Long classId, Long studentId);
    
    List<StudentResponse> getStudentsInClass(Long classId);
    
    Long getStudentCountInClass(Long classId);
}
