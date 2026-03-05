import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalTeachers: 0,
    totalStudents: 0,
    totalClasses: 0,
    activeClasses: 0,
    teachersWithClasses: 0,
    avgClassSize: 0
  });

  const [topTeachers, setTopTeachers] = useState([]);
  const [classDistribution, setClassDistribution] = useState({ small: 0, medium: 0, large: 0 });
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserName(user.name || 'Administrator');
    updateTime();
    const timer = setInterval(updateTime, 60000);
    fetchDashboardData();
    return () => clearInterval(timer);
  }, []);

  const updateTime = () => {
    const now = new Date();
    setCurrentTime(now.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    }));
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const [teachersRes, studentsRes, classesRes] = await Promise.all([
        fetch('http://localhost:8888/api/users/role/TEACHER', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('http://localhost:8888/api/students', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('http://localhost:8888/api/classes', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      const teachersData = await teachersRes.json();
      const studentsData = await studentsRes.json();
      const classesData = await classesRes.json();

      const teachers = teachersData.data || [];
      const students = studentsData.data || [];
      const classes = classesData.data || [];

      const activeClasses = classes.filter(c => c.studentCount > 0).length;
      const avgClassSize = classes.length > 0 ? Math.round(students.length / classes.length) : 0;
      const teacherIdsWithClasses = [...new Set(classes.map(c => c.teacherId))];

      setStats({
        totalTeachers: teachers.length,
        totalStudents: students.length,
        totalClasses: classes.length,
        activeClasses,
        teachersWithClasses: teacherIdsWithClasses.length,
        avgClassSize
      });

      const teacherClassCount = {};
      classes.forEach(cls => {
        teacherClassCount[cls.teacherId] = (teacherClassCount[cls.teacherId] || 0) + 1;
      });

      setTopTeachers(
        Object.entries(teacherClassCount)
          .map(([teacherId, count]) => {
            const teacher = teachers.find(t => t.userId === parseInt(teacherId));
            return { teacherId, teacherName: teacher?.fullName || 'Unknown', classCount: count };
          })
          .sort((a, b) => b.classCount - a.classCount)
          .slice(0, 5)
      );

      setClassDistribution({
        small: classes.filter(c => c.studentCount < 15).length,
        medium: classes.filter(c => c.studentCount >= 15 && c.studentCount < 30).length,
        large: classes.filter(c => c.studentCount >= 30).length
      });

    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getInitials = (name) =>
    name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??';

  const totalDist = stats.totalClasses || 1;

  if (loading) {
    return (
      <div className="ad-loading">
        <div className="ad-spinner" />
        <p>Loading dashboard…</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">

      {/* ── Welcome Banner ─────────────────────────────── */}
      <div className="ad-welcome">
        <div className="ad-welcome-orb ad-orb1" />
        <div className="ad-welcome-orb ad-orb2" />
        <div className="ad-welcome-orb ad-orb3" />
        <div className="ad-welcome-left">
          <p className="ad-greeting-label">{getGreeting()}</p>
          <h1 className="ad-greeting-name">{userName} 👋</h1>
          <p className="ad-greeting-sub">Here's what's happening with your school today.</p>
        </div>
        <div className="ad-welcome-right">
          <div className="ad-date-pill">
            <span className="ad-date-icon">📅</span>
            <span>{currentTime}</span>
          </div>
          <div className="ad-mini-stats">
            <div className="ad-mini-stat">
              <span className="ad-mini-val">{stats.totalStudents}</span>
              <span className="ad-mini-lbl">Students</span>
            </div>
            <div className="ad-mini-divider" />
            <div className="ad-mini-stat">
              <span className="ad-mini-val">{stats.totalClasses}</span>
              <span className="ad-mini-lbl">Classes</span>
            </div>
            <div className="ad-mini-divider" />
            <div className="ad-mini-stat">
              <span className="ad-mini-val">{stats.totalTeachers}</span>
              <span className="ad-mini-lbl">Teachers</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Grid ─────────────────────────────────── */}
      <div className="ad-stats-grid">
        <div className="ad-stat-card" style={{ '--card-accent': '#3b82f6', '--card-glow': 'rgba(59,130,246,0.18)' }}>
          <div className="ad-stat-icon-wrap" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>👥</div>
          <div className="ad-stat-body">
            <span className="ad-stat-label">Total Students</span>
            <span className="ad-stat-value">{stats.totalStudents}</span>
            <span className="ad-stat-sub ad-positive">↑ 12% this month</span>
          </div>
        </div>

        <div className="ad-stat-card" style={{ '--card-accent': '#ec4899', '--card-glow': 'rgba(236,72,153,0.15)' }}>
          <div className="ad-stat-icon-wrap" style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}>👨‍🏫</div>
          <div className="ad-stat-body">
            <span className="ad-stat-label">Total Teachers</span>
            <span className="ad-stat-value">{stats.totalTeachers}</span>
            <span className="ad-stat-sub">{stats.teachersWithClasses} with classes</span>
          </div>
        </div>

        <div className="ad-stat-card" style={{ '--card-accent': '#06b6d4', '--card-glow': 'rgba(6,182,212,0.15)' }}>
          <div className="ad-stat-icon-wrap" style={{ background: 'linear-gradient(135deg, #4facfe, #00f2fe)' }}>📚</div>
          <div className="ad-stat-body">
            <span className="ad-stat-label">Total Classes</span>
            <span className="ad-stat-value">{stats.totalClasses}</span>
            <span className="ad-stat-sub">{stats.activeClasses} active</span>
          </div>
        </div>

        <div className="ad-stat-card" style={{ '--card-accent': '#10b981', '--card-glow': 'rgba(16,185,129,0.15)' }}>
          <div className="ad-stat-icon-wrap" style={{ background: 'linear-gradient(135deg, #43e97b, #38f9d7)' }}>📊</div>
          <div className="ad-stat-body">
            <span className="ad-stat-label">Avg Class Size</span>
            <span className="ad-stat-value">{stats.avgClassSize}</span>
            <span className="ad-stat-sub">students per class</span>
          </div>
        </div>
      </div>

      {/* ── Analytics Row ──────────────────────────────── */}
      <div className="ad-analytics-row">

        {/* Class Distribution */}
        <div className="ad-card">
          <div className="ad-card-header">
            <div>
              <h3 className="ad-card-title">Class Size Distribution</h3>
              <p className="ad-card-sub">Breakdown by enrollment size</p>
            </div>
            <span className="ad-badge">Overview</span>
          </div>

          <div className="ad-dist-list">
            {[
              { label: 'Small Classes', key: 'small', desc: '< 15 students', color: '#3b82f6', gradient: 'linear-gradient(90deg, #667eea, #3b82f6)' },
              { label: 'Medium Classes', key: 'medium', desc: '15–30 students', color: '#06b6d4', gradient: 'linear-gradient(90deg, #4facfe, #06b6d4)' },
              { label: 'Large Classes', key: 'large', desc: '30+ students', color: '#10b981', gradient: 'linear-gradient(90deg, #43e97b, #10b981)' },
            ].map(({ label, key, desc, gradient }) => (
              <div key={key} className="ad-dist-item">
                <div className="ad-dist-top">
                  <span className="ad-dist-label">{label}</span>
                  <div className="ad-dist-right">
                    <span className="ad-dist-desc">{desc}</span>
                    <span className="ad-dist-count">{classDistribution[key]}</span>
                  </div>
                </div>
                <div className="ad-progress-track">
                  <div
                    className="ad-progress-fill"
                    style={{ width: `${(classDistribution[key] / totalDist) * 100}%`, background: gradient }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Teachers */}
        <div className="ad-card">
          <div className="ad-card-header">
            <div>
              <h3 className="ad-card-title">🏆 Top Teachers</h3>
              <p className="ad-card-sub">Ranked by class assignments</p>
            </div>
            <button className="ad-view-all" onClick={() => navigate('/admin/users')}>View All →</button>
          </div>

          <div className="ad-teachers-list">
            {topTeachers.length === 0 ? (
              <div className="ad-empty">No teachers assigned yet</div>
            ) : topTeachers.map((t, i) => (
              <div key={t.teacherId} className="ad-teacher-row">
                <div className={`ad-rank ad-rank-${i + 1}`}>#{i + 1}</div>
                <div className="ad-teacher-avatar">{getInitials(t.teacherName)}</div>
                <div className="ad-teacher-info">
                  <span className="ad-teacher-name">{t.teacherName}</span>
                  <span className="ad-teacher-meta">{t.classCount} class{t.classCount !== 1 ? 'es' : ''} assigned</span>
                </div>
                <div className="ad-teacher-chip">{t.classCount}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── School Summary ─────────────────────────────── */}
      <div className="ad-card ad-summary-card">
        <div className="ad-card-header">
          <div>
            <h3 className="ad-card-title">📋 School Summary</h3>
            <p className="ad-card-sub">Key metrics at a glance</p>
          </div>
        </div>
        <div className="ad-summary-grid">
          <div className="ad-summary-item">
            <span className="ad-summary-icon" style={{ background: '#eff6ff' }}>🏫</span>
            <div>
              <span className="ad-summary-val">{stats.totalClasses}</span>
              <span className="ad-summary-lbl">Total Classes</span>
            </div>
          </div>
          <div className="ad-summary-item">
            <span className="ad-summary-icon" style={{ background: '#f0fdf4' }}>✅</span>
            <div>
              <span className="ad-summary-val">{stats.activeClasses}</span>
              <span className="ad-summary-lbl">Active Classes</span>
            </div>
          </div>
          <div className="ad-summary-item">
            <span className="ad-summary-icon" style={{ background: '#faf5ff' }}>👨‍🏫</span>
            <div>
              <span className="ad-summary-val">{stats.teachersWithClasses}</span>
              <span className="ad-summary-lbl">Teachers w/ Classes</span>
            </div>
          </div>
          <div className="ad-summary-item">
            <span className="ad-summary-icon" style={{ background: '#fff7ed' }}>📊</span>
            <div>
              <span className="ad-summary-val">{stats.avgClassSize}</span>
              <span className="ad-summary-lbl">Avg Class Size</span>
            </div>
          </div>
          <div className="ad-summary-item">
            <span className="ad-summary-icon" style={{ background: '#fef2f2' }}>🎓</span>
            <div>
              <span className="ad-summary-val">{stats.totalStudents}</span>
              <span className="ad-summary-lbl">Total Students</span>
            </div>
          </div>
          <div className="ad-summary-item">
            <span className="ad-summary-icon" style={{ background: '#f0f9ff' }}>👥</span>
            <div>
              <span className="ad-summary-val">{stats.totalTeachers}</span>
              <span className="ad-summary-lbl">Total Teachers</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ──────────────────────────────── */}
      <div className="ad-quick-section">
        <h3 className="ad-quick-title">Quick Actions</h3>
        <div className="ad-quick-grid">
          {[
            { icon: '👥', label: 'Manage Users', desc: 'Add or edit accounts', path: '/admin/users', grad: 'linear-gradient(135deg, #667eea, #764ba2)' },
            { icon: '📚', label: 'Manage Classes', desc: 'Create or modify classes', path: '/admin/classes', grad: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
            { icon: '📊', label: 'View Reports', desc: 'Analytics and insights', path: '/admin/reports', grad: 'linear-gradient(135deg, #43e97b, #38f9d7)' },
          ].map(({ icon, label, desc, path, grad }) => (
            <button key={path} className="ad-quick-card" onClick={() => navigate(path)}>
              <div className="ad-quick-icon" style={{ background: grad }}>{icon}</div>
              <div className="ad-quick-info">
                <span className="ad-quick-label">{label}</span>
                <span className="ad-quick-desc">{desc}</span>
              </div>
              <span className="ad-quick-arrow">→</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;