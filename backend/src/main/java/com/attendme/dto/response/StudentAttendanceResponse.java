package com.attendme.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentAttendanceResponse {
    
    private Long studentId;
    private String rollNumber;
    private String studentName;
    private String status;
    private String remarks;
}

