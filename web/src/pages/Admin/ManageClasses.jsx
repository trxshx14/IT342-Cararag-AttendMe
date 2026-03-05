import React, { useState, useEffect } from 'react';
import { classService } from '../../services/classService';
import { userService } from '../../services/userService';
import { studentService } from '../../services/studentService';
import './ManageClasses.css';

const ManageClasses = () => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classStudents, setClassStudents] = useState([]);

  // Add Student Modal state
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [studentForm, setStudentForm] = useState({
    firstName: '',
    lastName: '',
    rollNumber: '',
    email: '',
    phone: '',
  });
  const [studentError, setStudentError] = useState('');
  const [studentLoading, setStudentLoading] = useState(false);

  const [formData, setFormData] = useState({
    className: '',
    subject: '',
    section: '',
    academicYear: '',
    teacherId: ''
  });

  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  const defaultAcademicYear = `${currentYear}-${nextYear}`;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [classesRes, teachersRes] = await Promise.all([
        classService.getAllClasses(),
        userService.getUsersByRole('TEACHER')
      ]);
      if (classesRes.success) setClasses(classesRes.data);
      if (teachersRes.success) setTeachers(teachersRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (classItem = null) => {
    if (classItem) {
      setEditingClass(classItem);
      setFormData({
        className: classItem.className,
        subject: classItem.subject,
        section: classItem.section || '',
        academicYear: classItem.academicYear || defaultAcademicYear,
        teacherId: classItem.teacherId || ''
      });
    } else {
      setEditingClass(null);
      setFormData({ className: '', subject: '', section: '', academicYear: defaultAcademicYear, teacherId: '' });
    }
    setShowModal(true);
    setError('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingClass(null);
    setFormData({ className: '', subject: '', section: '', academicYear: defaultAcademicYear, teacherId: '' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (!formData.className || !formData.subject || !formData.teacherId) {
        throw new Error('Please fill in all required fields');
      }
      const classData = {
        className: formData.className,
        subject: formData.subject,
        section: formData.section,
        academicYear: formData.academicYear,
        teacherId: parseInt(formData.teacherId)
      };
      let response;
      if (editingClass) {
        response = await classService.updateClass(editingClass.classId, classData);
      } else {
        response = await classService.createClass(classData);
      }
      if (response.success) {
        alert(editingClass ? 'Class updated successfully!' : 'Class created successfully!');
        handleCloseModal();
        fetchData();
      } else {
        setError(response.message || 'Failed to save class');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClass = async (classId, className) => {
    if (!window.confirm(`Are you sure you want to delete ${className}?`)) return;
    setLoading(true);
    try {
      const response = await classService.deleteClass(classId);
      if (response.success) {
        alert('Class deleted successfully');
        fetchData();
      } else {
        setError('Failed to delete class');
      }
    } catch (err) {
      setError('Error deleting class');
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudents = async (classItem) => {
    setSelectedClass(classItem);
    setLoading(true);
    try {
      const response = await classService.getStudentsInClass(classItem.classId);
      if (response.success) {
        setClassStudents(response.data);
        setShowStudentsModal(true);
      } else {
        setError('Failed to load students');
      }
    } catch (err) {
      setError('Error loading students');
    } finally {
      setLoading(false);
    }
  };

  // ── Add Student handlers ──────────────────────────────────────────
  const handleOpenAddStudent = () => {
    setStudentForm({ firstName: '', lastName: '', rollNumber: '', email: '', phone: '' });
    setStudentError('');
    setShowAddStudentModal(true);
  };

  const handleCloseAddStudent = () => {
    setShowAddStudentModal(false);
    setStudentError('');
  };

  const handleStudentInputChange = (e) => {
    const { name, value } = e.target;
    setStudentForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddStudentSubmit = async (e) => {
    e.preventDefault();
    setStudentError('');
    setStudentLoading(true);
    try {
      if (!studentForm.firstName || !studentForm.lastName || !studentForm.rollNumber) {
        throw new Error('First name, last name, and roll number are required.');
      }

      const payload = {
        firstName: studentForm.firstName,
        lastName: studentForm.lastName,
        rollNumber: studentForm.rollNumber,
        email: studentForm.email || null,
        phone: studentForm.phone || null,
        classId: selectedClass.classId,  // auto-assign to current class
      };

      const response = await studentService.createStudent(payload);

      if (response.success) {
        // Refresh the students list
        const updated = await classService.getStudentsInClass(selectedClass.classId);
        if (updated.success) setClassStudents(updated.data);
        // Update count on class card
        fetchData();
        handleCloseAddStudent();
      } else {
        setStudentError(response.message || 'Failed to add student');
      }
    } catch (err) {
      setStudentError(err.message || 'An error occurred');
    } finally {
      setStudentLoading(false);
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!window.confirm('Remove this student from the class?')) return;
    try {
      const response = await studentService.removeFromClass(studentId);
      if (response.success) {
        setClassStudents(prev => prev.filter(s => s.studentId !== studentId));
        fetchData();
      }
    } catch (err) {
      setError('Error removing student');
    }
  };
  // ─────────────────────────────────────────────────────────────────

  const getTeacherName = (teacherId) => {
    const teacher = teachers.find(t => t.userId === teacherId);
    return teacher ? teacher.fullName : 'Unassigned';
  };

  if (loading && classes.length === 0) {
    return <div className="loading">Loading classes...</div>;
  }

  return (
    <div className="manage-classes">
      <div className="classes-header">
        <h2>Manage Classes</h2>
        <button className="btn-primary" onClick={() => handleOpenModal()}>+ Add New Class</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="classes-grid">
        {classes.length === 0 ? (
          <div className="empty-state">
            <p>No classes found. Click "Add New Class" to create one.</p>
          </div>
        ) : (
          classes.map(cls => (
            <div key={cls.classId} className="class-card">
              <div className="class-card-header">
                <h3>{cls.className}</h3>
                <span className="class-badge">{cls.section || 'No Section'}</span>
              </div>
              <div className="class-details">
                <div className="detail-row">
                  <span className="detail-label">Subject:</span>
                  <span className="detail-value">{cls.subject}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Academic Year:</span>
                  <span className="detail-value">{cls.academicYear || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Teacher:</span>
                  <span className="detail-value teacher-name">👤 {getTeacherName(cls.teacherId)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Students:</span>
                  <span className="detail-value student-count">{cls.studentCount || 0} enrolled</span>
                </div>
              </div>
              <div className="class-actions">
                <button className="btn-icon" onClick={() => handleViewStudents(cls)} title="View Students">👥</button>
                <button className="btn-icon" onClick={() => handleOpenModal(cls)} title="Edit Class">✏️</button>
                <button className="btn-icon delete" onClick={() => handleDeleteClass(cls.classId, cls.className)} title="Delete Class">🗑️</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Class Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingClass ? 'Edit Class' : 'Add New Class'}</h3>
              <button className="modal-close" onClick={handleCloseModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Class Name *</label>
                  <input type="text" name="className" className="form-input" value={formData.className} onChange={handleInputChange} required placeholder="e.g., Grade 7 - Sampaguita" />
                </div>
                <div className="form-group">
                  <label className="form-label">Subject *</label>
                  <input type="text" name="subject" className="form-input" value={formData.subject} onChange={handleInputChange} required placeholder="e.g., Mathematics" />
                </div>
                <div className="form-group">
                  <label className="form-label">Section</label>
                  <input type="text" name="section" className="form-input" value={formData.section} onChange={handleInputChange} placeholder="e.g., A, B, C (optional)" />
                </div>
                <div className="form-group">
                  <label className="form-label">Academic Year</label>
                  <select name="academicYear" className="form-input" value={formData.academicYear} onChange={handleInputChange}>
                    <option value={`${currentYear}-${nextYear}`}>{currentYear}-{nextYear}</option>
                    <option value={`${currentYear-1}-${currentYear}`}>{currentYear-1}-{currentYear}</option>
                    <option value={`${currentYear+1}-${currentYear+2}`}>{currentYear+1}-{currentYear+2}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Assign Teacher *</label>
                  <select name="teacherId" className="form-input" value={formData.teacherId} onChange={handleInputChange} required>
                    <option value="">Select a teacher</option>
                    {teachers.map(teacher => (
                      <option key={teacher.userId} value={teacher.userId}>
                        {teacher.fullName} ({teacher.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : (editingClass ? 'Update Class' : 'Create Class')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Students Modal */}
      {showStudentsModal && selectedClass && (
        <div className="modal-overlay" onClick={() => setShowStudentsModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Students in {selectedClass.className}</h3>
              <button className="modal-close" onClick={() => setShowStudentsModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {classStudents.length === 0 ? (
                <div className="empty-state">
                  <p>No students enrolled in this class yet.</p>
                </div>
              ) : (
                <table className="students-table">
                  <thead>
                    <tr>
                      <th>Roll No.</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classStudents.map(student => (
                      <tr key={student.studentId}>
                        <td>{student.rollNumber}</td>
                        <td>{student.fullName}</td>
                        <td>{student.email || '—'}</td>
                        <td>
                          <button
                            className="btn-icon"
                            title="Remove from class"
                            onClick={() => handleRemoveStudent(student.studentId)}
                          >➖</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="modal-footer">
              {/* ✅ onClick now opens the Add Student modal */}
              <button className="btn-primary" onClick={handleOpenAddStudent}>+ Add Student</button>
              <button className="btn-outline" onClick={() => setShowStudentsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="modal-overlay" onClick={handleCloseAddStudent}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Student to {selectedClass?.className}</h3>
              <button className="modal-close" onClick={handleCloseAddStudent}>✕</button>
            </div>
            <form onSubmit={handleAddStudentSubmit}>
              <div className="modal-body">
                {studentError && <div className="error-message">{studentError}</div>}
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input type="text" name="firstName" className="form-input" value={studentForm.firstName} onChange={handleStudentInputChange} required placeholder="e.g., Juan" />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input type="text" name="lastName" className="form-input" value={studentForm.lastName} onChange={handleStudentInputChange} required placeholder="e.g., dela Cruz" />
                </div>
                <div className="form-group">
                  <label className="form-label">Roll Number *</label>
                  <input type="text" name="rollNumber" className="form-input" value={studentForm.rollNumber} onChange={handleStudentInputChange} required placeholder="e.g., 2024-0001" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" name="email" className="form-input" value={studentForm.email} onChange={handleStudentInputChange} placeholder="student@email.com (optional)" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input type="text" name="phone" className="form-input" value={studentForm.phone} onChange={handleStudentInputChange} placeholder="09XX-XXX-XXXX (optional)" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={handleCloseAddStudent}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={studentLoading}>
                  {studentLoading ? 'Adding...' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageClasses;