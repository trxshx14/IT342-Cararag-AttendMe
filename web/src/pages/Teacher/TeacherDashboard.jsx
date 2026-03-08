import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Users, CheckCircle2, XCircle, Clock,
  BarChart2, ClipboardList, ArrowRight, Activity,
  CalendarDays, TrendingUp, GraduationCap
} from 'lucide-react';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
  const [stats, setStats] = useState({
    totalClasses: 0, totalStudents: 0,
    todayPresent: 0, todayAbsent: 0,
    todayLate: 0, todayExcused: 0,
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
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserName(user.name || 'Teacher');
    updateTime();
    const timer = setInterval(updateTime, 60000);
    fetchTeacherData();
    return () => clearInterval(timer);
  }, []);

  const updateTime = () => {
    const now = new Date();
    setCurrentTime(now.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    }));
  };

  const fetchTeacherData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const classesRes = await fetch(`http://localhost:8888/api/classes/teacher/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const classesData = await classesRes.json();
      const classes = classesData.data || [];
      const today = new Date().toISOString().split('T')[0];
      let totalStudents = 0, totalPresent = 0, totalAbsent = 0, totalLate = 0, totalExcused = 0;

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
        totalPresent += present; totalAbsent += absent; totalLate += late; totalExcused += excused;
        return {
          ...cls, attendance, presentCount: present, absentCount: absent,
          lateCount: late, excusedCount: excused,
          attendanceRate: cls.studentCount ? Math.round(((present + late) / cls.studentCount) * 100) : 0
        };
      });

      const classData = await Promise.all(classPromises);
      setStats({
        totalClasses: classes.length, totalStudents,
        todayPresent: totalPresent, todayAbsent: totalAbsent,
        todayLate: totalLate, todayExcused: totalExcused,
        averageAttendance: totalStudents ? Math.round(((totalPresent + totalLate) / totalStudents) * 100) : 0
      });
      setMyClasses(classData);
      setRecentActivity([
        { id: 1, class: 'Mathematics 101', action: 'Marked attendance', time: '10 minutes ago', type: 'attendance' },
        { id: 2, class: 'Science 8', action: 'Updated student records', time: '2 hours ago', type: 'update' },
        { id: 3, class: 'English Literature', action: 'Added new student', time: 'Yesterday', type: 'student' }
      ]);
      setUpcomingClasses([
        { id: 1, name: 'Mathematics 101', time: '09:00 AM', students: 25, subject: 'Math' },
        { id: 2, name: 'Science 8', time: '11:00 AM', students: 30, subject: 'Science' },
        { id: 3, name: 'English Literature', time: '02:00 PM', students: 22, subject: 'English' }
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

  const getFirstName = () => userName.split(' ')[0];

  if (loading) {
    return (
      <div className="td-loading">
        <div className="td-spinner" />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  const totalMarked = stats.todayPresent + stats.todayAbsent + stats.todayLate + stats.todayExcused;

  const statCards = [
    {
      label: 'My Classes', value: stats.totalClasses,
      icon: <BookOpen size={22} />, accent: '#3B6FD4'
    },
    {
      label: 'Total Students', value: stats.totalStudents,
      icon: <GraduationCap size={22} />, accent: '#2DB87B'
    },
    {
      label: 'Present Today', value: stats.todayPresent,
      sub: `${Math.round((stats.todayPresent / (totalMarked || 1)) * 100)}% of marked`,
      icon: <CheckCircle2 size={22} />, accent: '#10B981'
    },
    {
      label: 'Absent / Late', value: stats.todayAbsent + stats.todayLate,
      sub: `${stats.todayLate} late · ${stats.todayAbsent} absent`,
      icon: <XCircle size={22} />, accent: '#EF4444'
    }
  ];

  return (
    <div className="td-root">

      {/* ── Hero Banner ─────────────────────────────── */}
      <div className="td-hero">
        <div className="td-hero-bg" />
        <div className="td-hero-content">
          <div>
            <p className="td-greeting-label">{getGreeting()}</p>
            <h1 className="td-hero-name">{getFirstName()} <span className="td-wave">👋</span></h1>
            <p className="td-hero-sub">Ready to take attendance for your classes today?</p>
          </div>
          <div className="td-date-pill">
            <CalendarDays size={15} />
            {currentTime}
          </div>
        </div>
      </div>

      {/* ── Quick Actions ────────────────────────────── */}
      <div className="td-actions-row">
        <button className="td-action-btn td-action-primary" onClick={() => navigate('/teacher/take-attendance')}>
          <ClipboardList size={18} />
          Take Attendance
          <ArrowRight size={15} className="td-arrow" />
        </button>
        <button className="td-action-btn td-action-ghost" onClick={() => navigate('/teacher/history')}>
          <Activity size={18} />
          View History
        </button>
        <button className="td-action-btn td-action-ghost" onClick={() => navigate('/teacher/reports')}>
          <BarChart2 size={18} />
          Reports
        </button>
      </div>

      {/* ── Stats Row ────────────────────────────────── */}
      <div className="td-stats-row">
        {statCards.map((s, i) => (
          <div key={i} className="td-stat-card" style={{ '--accent': s.accent }}>
            <div className="td-stat-icon-wrap">
              {s.icon}
            </div>
            <div className="td-stat-body">
              <span className="td-stat-label">{s.label}</span>
              <span className="td-stat-value">{s.value}</span>
              {s.sub && <span className="td-stat-sub">{s.sub}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Grid ────────────────────────────────── */}
      <div className="td-main-grid">

        {/* My Classes */}
        <div className="td-card td-classes-card">
          <div className="td-card-header">
            <div className="td-card-title">
              <BookOpen size={17} />
              My Classes
            </div>
            <button className="td-header-btn" onClick={() => navigate('/teacher/take-attendance')}>
              Take Attendance <ArrowRight size={13} />
            </button>
          </div>
          <div className="td-classes-list">
            {myClasses.length === 0 ? (
              <div className="td-empty"><p>No classes assigned yet.</p></div>
            ) : myClasses.map(cls => (
              <div key={cls.classId} className="td-class-row">
                <div className="td-class-dot" />
                <div className="td-class-info">
                  <span className="td-class-name">{cls.className}</span>
                  <span className="td-class-meta">{cls.subject} · {cls.studentCount || 0} students</span>
                </div>
                <div className="td-class-right">
                  <span className="td-present-chip">
                    <span className="td-green-dot" />
                    {cls.presentCount || 0} present
                  </span>
                  <div className="td-ring-wrap">
                    <svg width="48" height="48" viewBox="0 0 48 48">
                      <circle cx="24" cy="24" r="19" fill="none" stroke="#E8EFF8" strokeWidth="4" />
                      <circle
                        cx="24" cy="24" r="19" fill="none"
                        stroke={cls.attendanceRate > 80 ? '#10B981' : cls.attendanceRate > 60 ? '#F59E0B' : '#EF4444'}
                        strokeWidth="4"
                        strokeDasharray={`${(cls.attendanceRate / 100) * 119.4} 119.4`}
                        strokeLinecap="round"
                        transform="rotate(-90 24 24)"
                      />
                    </svg>
                    <span className="td-ring-text">{cls.attendanceRate}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: schedule + activity */}
        <div className="td-right-col">

          {/* Today's Schedule */}
          <div className="td-card">
            <div className="td-card-header">
              <div className="td-card-title">
                <Clock size={17} />
                Today's Schedule
              </div>
              <span className="td-date-chip">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
            <div className="td-schedule-list">
              {upcomingClasses.map(cls => (
                <div key={cls.id} className="td-schedule-row">
                  <span className="td-sched-time">{cls.time}</span>
                  <div className="td-sched-info">
                    <span className="td-sched-name">{cls.name}</span>
                    <span className="td-sched-meta">{cls.students} students</span>
                  </div>
                  <button className="td-take-btn" onClick={() => navigate('/teacher/take-attendance')}>
                    Take
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="td-card">
            <div className="td-card-header">
              <div className="td-card-title">
                <TrendingUp size={17} />
                Recent Activity
              </div>
              <button className="td-header-btn" onClick={() => navigate('/teacher/history')}>
                View All <ArrowRight size={13} />
              </button>
            </div>
            <div className="td-activity-list">
              {recentActivity.map(a => (
                <div key={a.id} className="td-activity-row">
                  <div className="td-activity-dot-wrap">
                    <div className="td-activity-dot" />
                    <div className="td-activity-line" />
                  </div>
                  <div className="td-activity-body">
                    <span className="td-activity-class">{a.class}</span>
                    <span className="td-activity-action">{a.action}</span>
                    <span className="td-activity-time">{a.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;