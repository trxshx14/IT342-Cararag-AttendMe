import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    todayPresent: 0,
    todayAbsent: 0,
    todayLate: 0,
    todayExcused: 0,
    averageAttendance: 0
  });
  
  const [myClasses, setMyClasses] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Get user name from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserName(user.name || 'Teacher');
    
    // Update time every minute
    updateTime();
    const timer = setInterval(updateTime, 60000);
    
    fetchTeacherData();
    
    return () => clearInterval(timer);
  }, []);

  const updateTime = () => {
    const now = new Date();
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    setCurrentTime(now.toLocaleDateString('en-US', options));
  };

  const fetchTeacherData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Fetch classes for this teacher
      const classesRes = await fetch(`http://localhost:8888/api/classes/teacher/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const classesData = await classesRes.json();
      
      const classes = classesData.data || [];
      
      // Get today's date
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch today's attendance for each class
      let totalStudents = 0;
      let totalPresent = 0;
      let totalAbsent = 0;
      let totalLate = 0;
      let totalExcused = 0;
      
      const classPromises = classes.map(async (cls) => {
        const response = await fetch(`http://localhost:8888/api/attendance/class/${cls.classId}/date/${today}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        const attendance = data.data || [];
        const present = attendance.filter(a => a.status === 'present').length;
        const absent = attendance.filter(a => a.status === 'absent').length;
        const late = attendance.filter(a => a.status === 'late').length;
        const excused = attendance.filter(a => a.status === 'excused').length;
        
        totalStudents += cls.studentCount || 0;
        totalPresent += present;
        totalAbsent += absent;
        totalLate += late;
        totalExcused += excused;
        
        return {
          ...cls,
          attendance,
          presentCount: present,
          absentCount: absent,
          lateCount: late,
          excusedCount: excused,
          attendanceRate: cls.studentCount ? Math.round(((present + late) / cls.studentCount) * 100) : 0
        };
      });

      const classData = await Promise.all(classPromises);
      
      setStats({
        totalClasses: classes.length,
        totalStudents: totalStudents,
        todayPresent: totalPresent,
        todayAbsent: totalAbsent,
        todayLate: totalLate,
        todayExcused: totalExcused,
        averageAttendance: totalStudents ? Math.round(((totalPresent + totalLate) / totalStudents) * 100) : 0
      });

      setMyClasses(classData);

      // Mock recent activity (replace with real API)
      setRecentActivity([
        { id: 1, class: "Mathematics 101", action: "Marked attendance", time: "10 minutes ago" },
        { id: 2, class: "Science 8", action: "Updated student records", time: "2 hours ago" },
        { id: 3, class: "English Literature", action: "Added new student", time: "Yesterday" }
      ]);

      // Mock upcoming classes
      setUpcomingClasses([
        { id: 1, name: "Mathematics 101", time: "09:00 AM", students: 25 },
        { id: 2, name: "Science 8", time: "11:00 AM", students: 30 },
        { id: 3, name: "English Literature", time: "02:00 PM", students: 22 }
      ]);

    } catch (error) {
      console.error('Error fetching teacher data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  const totalMarked = stats.todayPresent + stats.todayAbsent + stats.todayLate + stats.todayExcused;

  return (
    <div className="teacher-dashboard">
      {/* Welcome Section */}
      <div className="welcome-section">
        <div className="welcome-content">
          <h1>{getGreeting()}, {userName}!</h1>
          <p className="welcome-subtitle">Ready to take attendance for your classes today?</p>
        </div>
        <div className="date-time">
          <span className="date-badge-large">📅 {currentTime}</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-bar">
        <button className="quick-action-btn primary" onClick={() => navigate('/teacher/take-attendance')}>
          <span className="btn-icon">📝</span>
          Take Attendance
        </button>
        <button className="quick-action-btn secondary" onClick={() => navigate('/teacher/history')}>
          <span className="btn-icon">📋</span>
          View History
        </button>
        <button className="quick-action-btn secondary" onClick={() => navigate('/teacher/reports')}>
          <span className="btn-icon">📊</span>
          Reports
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #3b82f6, #1e40af)' }}>
            <span className="stat-icon">📚</span>
          </div>
          <div className="stat-content">
            <span className="stat-label">My Classes</span>
            <span className="stat-value">{stats.totalClasses}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #10b981, #047857)' }}>
            <span className="stat-icon">👥</span>
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Students</span>
            <span className="stat-value">{stats.totalStudents}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #f59e0b, #b45309)' }}>
            <span className="stat-icon">✅</span>
          </div>
          <div className="stat-content">
            <span className="stat-label">Present Today</span>
            <span className="stat-value">{stats.todayPresent}</span>
            <span className="stat-trend">{Math.round((stats.todayPresent / (totalMarked || 1)) * 100)}% of marked</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}>
            <span className="stat-icon">❌</span>
          </div>
          <div className="stat-content">
            <span className="stat-label">Absent/Late</span>
            <span className="stat-value">{stats.todayAbsent + stats.todayLate}</span>
            <span className="stat-trend">{stats.todayLate} late, {stats.todayAbsent} absent</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* My Classes Section */}
        <div className="dashboard-card classes-card">
          <div className="card-header">
            <h3>📋 My Classes</h3>
            <button className="view-all-btn" onClick={() => navigate('/teacher/take-attendance')}>
              Take Attendance
            </button>
          </div>
          <div className="classes-list">
            {myClasses.length === 0 ? (
              <div className="empty-state">
                <p>No classes assigned yet.</p>
              </div>
            ) : (
              myClasses.map(cls => (
                <div key={cls.classId} className="class-item">
                  <div className="class-info">
                    <h4>{cls.className}</h4>
                    <p>{cls.subject} • {cls.studentCount || 0} students</p>
                  </div>
                  <div className="class-stats">
                    <div className="attendance-badge">
                      <span className="present-dot"></span>
                      <span>{cls.presentCount || 0} present</span>
                    </div>
                    <div className="progress-ring">
                      <svg width="50" height="50">
                        <circle
                          cx="25"
                          cy="25"
                          r="20"
                          fill="none"
                          stroke="#e2e8f0"
                          strokeWidth="4"
                        />
                        <circle
                          cx="25"
                          cy="25"
                          r="20"
                          fill="none"
                          stroke={cls.attendanceRate > 80 ? '#10b981' : cls.attendanceRate > 60 ? '#f59e0b' : '#ef4444'}
                          strokeWidth="4"
                          strokeDasharray={`${(cls.attendanceRate / 100) * 125.6} 125.6`}
                          strokeLinecap="round"
                          transform="rotate(-90 25 25)"
                        />
                      </svg>
                      <span className="progress-text">{cls.attendanceRate}%</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="dashboard-card schedule-card">
          <div className="card-header">
            <h3>⏰ Today's Schedule</h3>
            <span className="date-badge">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
          <div className="schedule-list">
            {upcomingClasses.map(cls => (
              <div key={cls.id} className="schedule-item">
                <div className="schedule-time">{cls.time}</div>
                <div className="schedule-info">
                  <h4>{cls.name}</h4>
                  <p>{cls.students} students</p>
                </div>
                <button 
                  className="schedule-action"
                  onClick={() => navigate('/teacher/take-attendance')}
                >
                  Take
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="dashboard-card activity-card">
          <div className="card-header">
            <h3>🕒 Recent Activity</h3>
            <button className="view-all-btn" onClick={() => navigate('/teacher/history')}>
              View All
            </button>
          </div>
          <div className="activity-list">
            {recentActivity.map(activity => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">
                  {activity.action.includes('Marked') ? '✅' : '📝'}
                </div>
                <div className="activity-details">
                  <p className="activity-title">{activity.class}</p>
                  <p className="activity-desc">{activity.action}</p>
                  <span className="activity-time">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;