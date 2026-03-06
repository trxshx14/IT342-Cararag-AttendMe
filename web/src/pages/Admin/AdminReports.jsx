import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminReports.css';

const AdminReports = () => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [reportData, setReportData] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('daily'); // 'daily', 'weekly', 'monthly', 'teacher'
  const [summary, setSummary] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      // Fetch classes and teachers in parallel
      const [classesRes, teachersRes] = await Promise.all([
        fetch('http://localhost:8888/api/classes', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:8888/api/users/role/TEACHER', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const classesData = await classesRes.json();
      const teachersData = await teachersRes.json();

      if (classesData.success) {
        setClasses(classesData.data || []);
      }
      
      if (teachersData.success) {
        setTeachers(teachersData.data || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    if (!selectedClass && viewMode !== 'teacher') {
      setError('Please select a class');
      return;
    }

    setReportLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      let response;
      let data;

      if (viewMode === 'teacher') {
        // Teacher performance report
        if (selectedTeacher === 'all') {
          // Get all teachers' classes
          const teacherPromises = teachers.map(async (teacher) => {
            const classRes = await fetch(`http://localhost:8888/api/classes/teacher/${teacher.userId}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const classData = await classRes.json();
            return {
              teacherId: teacher.userId,
              teacherName: teacher.fullName,
              classes: classData.data || [],
              classCount: classData.data?.length || 0
            };
          });
          
          const teacherData = await Promise.all(teacherPromises);
          setReportData(teacherData);
          
          // Calculate summary
          const totalTeachers = teacherData.length;
          const totalClasses = teacherData.reduce((acc, t) => acc + t.classCount, 0);
          const avgClassesPerTeacher = totalTeachers > 0 ? Math.round(totalClasses / totalTeachers) : 0;
          
          setSummary({
            totalTeachers,
            totalClasses,
            avgClassesPerTeacher
          });
        } else {
          // Get specific teacher's classes
          const classRes = await fetch(`http://localhost:8888/api/classes/teacher/${selectedTeacher}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const classData = await classRes.json();
          
          const teacher = teachers.find(t => t.userId === parseInt(selectedTeacher));
          
          setReportData([{
            teacherId: selectedTeacher,
            teacherName: teacher?.fullName || 'Unknown Teacher',
            classes: classData.data || [],
            classCount: classData.data?.length || 0
          }]);
          
          setSummary({
            totalTeachers: 1,
            totalClasses: classData.data?.length || 0,
            avgClassesPerTeacher: classData.data?.length || 0
          });
        }
        setAttendanceRecords([]);
        setReportLoading(false);
        return;
      }

      // Daily/Weekly/Monthly attendance report
      if (viewMode === 'daily') {
        response = await fetch(`http://localhost:8888/api/attendance/class/${selectedClass}/report/${dateRange.startDate}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        data = await response.json();
        
        if (data.success) {
          setReportData(data.data);
          setAttendanceRecords(data.data?.attendanceList || []);
          
          // Calculate summary
          const records = data.data?.attendanceList || [];
          const present = records.filter(r => r.status === 'present').length;
          const absent = records.filter(r => r.status === 'absent').length;
          const late = records.filter(r => r.status === 'late').length;
          const excused = records.filter(r => r.status === 'excused').length;
          
          setSummary({
            total: records.length,
            present,
            absent,
            late,
            excused,
            presentRate: records.length > 0 ? Math.round((present / records.length) * 100) : 0,
            absentRate: records.length > 0 ? Math.round((absent / records.length) * 100) : 0,
            lateRate: records.length > 0 ? Math.round((late / records.length) * 100) : 0,
            excusedRate: records.length > 0 ? Math.round((excused / records.length) * 100) : 0
          });
        }
      } else {
        // For weekly/monthly, get range data
        response = await fetch(
          `http://localhost:8888/api/attendance/class/${selectedClass}/range?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`, 
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        data = await response.json();
        
        if (data.success) {
          setAttendanceRecords(data.data || []);
          
          // Calculate summary for range
          const records = data.data || [];
          const present = records.filter(r => r.status === 'present').length;
          const absent = records.filter(r => r.status === 'absent').length;
          const late = records.filter(r => r.status === 'late').length;
          const excused = records.filter(r => r.status === 'excused').length;
          
          setSummary({
            total: records.length,
            present,
            absent,
            late,
            excused,
            presentRate: records.length > 0 ? Math.round((present / records.length) * 100) : 0,
            absentRate: records.length > 0 ? Math.round((absent / records.length) * 100) : 0,
            lateRate: records.length > 0 ? Math.round((late / records.length) * 100) : 0,
            excusedRate: records.length > 0 ? Math.round((excused / records.length) * 100) : 0
          });
        }
      }

    } catch (err) {
      console.error('Error generating report:', err);
      setError('Failed to generate report');
    } finally {
      setReportLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!attendanceRecords.length && !reportData) return;

    let csvContent = "Data,Value\n";
    
    if (viewMode === 'teacher') {
      csvContent = "Teacher,Classes\n";
      reportData.forEach(teacher => {
        csvContent += `${teacher.teacherName},${teacher.classCount}\n`;
      });
    } else {
      csvContent = "Date,Student Name,Roll Number,Status,Remarks\n";
      attendanceRecords.forEach(record => {
        csvContent += `${record.date || dateRange.startDate},${record.studentName},${record.rollNumber},${record.status},${record.remarks || ''}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${viewMode}-${dateRange.startDate}.csv`;
    a.click();
  };

  const getStatusColor = (status) => {
    const colors = {
      present: '#10b981',
      absent: '#ef4444',
      late: '#f59e0b',
      excused: '#8b5cf6'
    };
    return colors[status?.toLowerCase()] || '#64748b';
  };

  const getStatusBg = (status) => {
    const colors = {
      present: '#d1fae5',
      absent: '#fee2e2',
      late: '#fef3c7',
      excused: '#ede9fe'
    };
    return colors[status?.toLowerCase()] || '#f1f5f9';
  };

  if (loading) {
    return <div className="loading">Loading reports...</div>;
  }

  return (
    <div className="admin-reports">
      <div className="reports-header">
        <h1>Reports & Analytics</h1>
        <p className="page-description">Generate and analyze attendance reports, teacher performance, and class statistics</p>
      </div>

      {/* Report Type Selector */}
      <div className="report-type-selector">
        <button
          className={`type-btn ${viewMode === 'daily' ? 'active' : ''}`}
          onClick={() => setViewMode('daily')}
        >
          📅 Daily Report
        </button>
        <button
          className={`type-btn ${viewMode === 'weekly' ? 'active' : ''}`}
          onClick={() => setViewMode('weekly')}
        >
          📊 Weekly Report
        </button>
        <button
          className={`type-btn ${viewMode === 'monthly' ? 'active' : ''}`}
          onClick={() => setViewMode('monthly')}
        >
          📈 Monthly Report
        </button>
        <button
          className={`type-btn ${viewMode === 'teacher' ? 'active' : ''}`}
          onClick={() => setViewMode('teacher')}
        >
          👥 Teacher Performance
        </button>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        {viewMode !== 'teacher' && (
          <div className="filter-group">
            <label className="filter-label">Select Class</label>
            <select
              className="filter-select"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">Choose a class</option>
              {classes.map(cls => (
                <option key={cls.classId} value={cls.classId}>
                  {cls.className} - {cls.subject}
                </option>
              ))}
            </select>
          </div>
        )}

        {viewMode === 'teacher' && (
          <div className="filter-group">
            <label className="filter-label">Select Teacher</label>
            <select
              className="filter-select"
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
            >
              <option value="all">All Teachers</option>
              {teachers.map(teacher => (
                <option key={teacher.userId} value={teacher.userId}>
                  {teacher.fullName}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="filter-group">
          <label className="filter-label">Start Date</label>
          <input
            type="date"
            className="date-input"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
          />
        </div>

        <div className="filter-group">
          <label className="filter-label">End Date</label>
          <input
            type="date"
            className="date-input"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
          />
        </div>

        <div className="filter-actions">
          <button 
            className="generate-btn"
            onClick={generateReport}
            disabled={reportLoading}
          >
            {reportLoading ? 'Generating...' : 'Generate Report'}
          </button>
          {(attendanceRecords.length > 0 || reportData) && (
            <button 
              className="export-btn"
              onClick={exportToCSV}
            >
              📥 Export CSV
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Summary Cards */}
      {summary && (
        <div className="summary-cards">
          <div className="summary-card total">
            <div className="summary-icon">📊</div>
            <div className="summary-info">
              <span className="summary-value">{summary.total || summary.totalTeachers}</span>
              <span className="summary-label">
                {viewMode === 'teacher' ? 'Total Teachers' : 'Total Records'}
              </span>
            </div>
          </div>

          {viewMode !== 'teacher' && (
            <>
              <div className="summary-card present">
                <div className="summary-icon">✅</div>
                <div className="summary-info">
                  <span className="summary-value">{summary.present || 0}</span>
                  <span className="summary-label">Present</span>
                  <span className="summary-percent">{summary.presentRate || 0}%</span>
                </div>
              </div>

              <div className="summary-card absent">
                <div className="summary-icon">❌</div>
                <div className="summary-info">
                  <span className="summary-value">{summary.absent || 0}</span>
                  <span className="summary-label">Absent</span>
                  <span className="summary-percent">{summary.absentRate || 0}%</span>
                </div>
              </div>

              <div className="summary-card late">
                <div className="summary-icon">⏰</div>
                <div className="summary-info">
                  <span className="summary-value">{summary.late || 0}</span>
                  <span className="summary-label">Late</span>
                  <span className="summary-percent">{summary.lateRate || 0}%</span>
                </div>
              </div>

              <div className="summary-card excused">
                <div className="summary-icon">📝</div>
                <div className="summary-info">
                  <span className="summary-value">{summary.excused || 0}</span>
                  <span className="summary-label">Excused</span>
                  <span className="summary-percent">{summary.excusedRate || 0}%</span>
                </div>
              </div>
            </>
          )}

          {viewMode === 'teacher' && (
            <>
              <div className="summary-card classes">
                <div className="summary-icon">📚</div>
                <div className="summary-info">
                  <span className="summary-value">{summary.totalClasses || 0}</span>
                  <span className="summary-label">Total Classes</span>
                </div>
              </div>

              <div className="summary-card average">
                <div className="summary-icon">📈</div>
                <div className="summary-info">
                  <span className="summary-value">{summary.avgClassesPerTeacher || 0}</span>
                  <span className="summary-label">Avg Classes/Teacher</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Teacher Performance Table */}
      {viewMode === 'teacher' && reportData && (
        <div className="report-table-container">
          <h3>Teacher Performance Summary</h3>
          <div className="table-responsive">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Teacher Name</th>
                  <th>Classes Assigned</th>
                  <th>Total Students</th>
                  <th>Performance</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((teacher, index) => (
                  <tr key={index}>
                    <td className="teacher-cell">
                      <div className="teacher-avatar-small">
                        {teacher.teacherName.split(' ').map(n => n[0]).join('')}
                      </div>
                      {teacher.teacherName}
                    </td>
                    <td className="text-center">{teacher.classCount}</td>
                    <td className="text-center">
                      {teacher.classes.reduce((acc, cls) => acc + (cls.studentCount || 0), 0)}
                    </td>
                    <td>
                      <div className="performance-bar">
                        <div 
                          className="performance-fill"
                          style={{ 
                            width: `${Math.min(100, (teacher.classCount / 5) * 100)}%`,
                            background: teacher.classCount > 3 ? '#10b981' : teacher.classCount > 1 ? '#f59e0b' : '#ef4444'
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attendance Records Table */}
      {viewMode !== 'teacher' && attendanceRecords.length > 0 && (
        <div className="report-table-container">
          <h3>
            {viewMode === 'daily' ? 'Daily Attendance Report' : 
             viewMode === 'weekly' ? 'Weekly Attendance Report' : 
             'Monthly Attendance Report'}
            <span className="report-date-range">
              {new Date(dateRange.startDate).toLocaleDateString()} - {new Date(dateRange.endDate).toLocaleDateString()}
            </span>
          </h3>
          <div className="table-responsive">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Student Name</th>
                  <th>Roll Number</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.map((record, index) => (
                  <tr key={index}>
                    <td>{new Date(record.date || dateRange.startDate).toLocaleDateString()}</td>
                    <td className="student-cell">
                      <div className="student-avatar-small">
                        {record.studentName?.split(' ').map(n => n[0]).join('')}
                      </div>
                      {record.studentName}
                    </td>
                    <td className="text-center">{record.rollNumber}</td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{ 
                          background: getStatusBg(record.status),
                          color: getStatusColor(record.status)
                        }}
                      >
                        <span className="status-dot" style={{ background: getStatusColor(record.status) }} />
                        {record.status}
                      </span>
                    </td>
                    <td>{record.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!reportData && !attendanceRecords.length && !loading && (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>No Report Generated</h3>
          <p>Select a report type and filters to generate a report</p>
        </div>
      )}
    </div>
  );
};

export default AdminReports;