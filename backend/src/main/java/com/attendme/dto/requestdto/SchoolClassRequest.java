package com.attendme.dto.requestdto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SchoolClassRequest {
    
    @NotBlank(message = "Class name is required")
    @Size(min = 2, max = 100, message = "Class name must be between 2 and 100 characters")
    private String className;
    
    @NotBlank(message = "Subject is required")
    @Size(min = 2, max = 100, message = "Subject must be between 2 and 100 characters")
    private String subject;
    
    @Size(max = 50, message = "Section cannot exceed 50 characters")
    private String section;
    
    @NotBlank(message = "Academic year is required")
    @Size(min = 9, max = 20, message = "Academic year must be in format YYYY-YYYY (e.g., 2023-2024)")
    private String academicYear;
    
    @NotNull(message = "Teacher ID is required")
    private Long teacherId;
}
