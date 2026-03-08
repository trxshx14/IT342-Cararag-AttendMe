import React, { useState, useEffect } from 'react';
import {
  BarChart2, ChevronDown, Calendar, Users, BookOpen,
  TrendingUp, TrendingDown, CheckCircle2, XCircle,
  Clock, FileText, Download, RefreshCw, X,
  AlertCircle, GraduationCap, Percent
} from 'lucide-react';
import './TeacherReports.css';

const STATUS_CONFIG = {
  present: { label: 'Present', color: '#10B981', bg: '#D1FAE5', border: '#6EE7B7', icon: CheckCircle2 },
  absent:  { label: 'Absent',  color: '#EF4444', bg: '#FEE2E2', border: '#FCA5A5', icon: XCircle },
  late:    { label: 'Late',    color: '#F59E0B', bg: '#FEF3C7', border: '#FCD34D', icon: Clock },
  excused: { label: 'Excused', color: '#6366F1', bg: '#EDE9FE', border: '#C4B5FD', icon: FileText },
};

const WEEK_OPTIONS = [
  { label: 'This Week',      value: 'this_week' },
  { label: 'Last Week',      value: 'last_week' },
  { label: 'Last 2 Weeks',   value: 'last_2_weeks' },
  { label: 'This Month',     value: 'this_month' },
  { label: 'Custom Range',   value: 'custom' },
];

function getDateRange(period) {
  const today = new Date();
  const toISO = d => d.toISOString().split('T')[0];
  const startOfWeek = (d) => {
    const day = new Date(d);
    day.setDate(d.getDate() - d.getDay() + 1);
    return day;
  };
  switch (period) {
    case 'this_week': {
      const s = startOfWeek(today);
      const e = new Date(s); e.setDate(s.getDate() + 6);
      return { from: toISO(s), to: toISO(e) };
    }
    case 'last_week': {
      const s = startOfWeek(today); s.setDate(s.getDate() - 7);
      const e = new Date(s); e.setDate(s.getDate() + 6);
      return { from: toISO(s), to: toISO(e) };
    }
    case 'last_2_weeks': {
      const s = startOfWeek(today); s.setDate(s.getDate() - 14);
      const e = new Date(startOfWeek(today)); e.setDate(e.getDate() + 6);
      return { from: toISO(s), to: toISO(e) };
    }
    case 'this_month': {
      const s = new Date(today.getFullYear(), today.getMonth(), 1);
      const e = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return { from: toISO(s), to: toISO(e) };
    }
    default: return { from: '', to: '' };
  }
}

const TeacherReports = () => {
  const [classes, setClasses]               = useState([]);
  const [classLoading, setClassLoading]     = useState(true);
  const [selectedClass, setSelectedClass]   = useState('all');
  const [showClassDrop, setShowClassDrop]   = useState(false);
  const [period, setPeriod]                 = useState('this_week');
  const [showPeriodDrop, setShowPeriodDrop] = useState(false);
  const [customFrom, setCustomFrom]         = useState('');
  const [customTo, setCustomTo]             = useState('');

  const [summary, setSummary]               = useState(null);
  const [studentRows, setStudentRows]       = useState([]);
  const [weeklyTrend, setWeeklyTrend]       = useState([]);
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState('');
  const [generated, setGenerated]           = useState(false);

  const token = localStorage.getItem('accessToken');
  const user  = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => { fetchClasses(); }, []);

  const fetchClasses = async () => {
    setClassLoading(true);
    try {
      const res  = await fetch(`http://localhost:8888/api/classes/teacher/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setClasses(data.data || []);
    } catch { setError('Failed to load classes.'); }
    finally { setClassLoading(false); }
  };

  const getRange = () => {
    if (period === 'custom') return { from: customFrom, to: customTo };
    return getDateRange(period);
  };

  const fetchReport = async () => {
    const { from, to } = getRange();
    if (!from || !to) { setError('Please select a valid date range.'); return; }
    setLoading(true);
    setError('');
    setGenerated(false);
    try {
      const params = new URLSearchParams({ from, to });
      if (selectedClass !== 'all') params.set('classId', selectedClass);

      const [summaryRes, studentRes, weeklyRes] = await Promise.all([
        fetch(`http://localhost:8888/api/reports/summary?${params}`,       { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`http://localhost:8888/api/reports/students?${params}`,      { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`http://localhost:8888/api/reports/weekly-trend?${params}`,  { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const [sData, stData, wData] = await Promise.all([
        summaryRes.json(), studentRes.json(), weeklyRes.json()
      ]);

      if (sData.success)  setSummary(sData.data);
      if (stData.success) setStudentRows(stData.data || []);
      if (wData.success)  setWeeklyTrend(wData.data || []);
      setGenerated(true);
    } catch { setError('Failed to generate report. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleExport = () => {
    if (!studentRows.length) return;
    const headers = ['Student Name', 'Roll No.', 'Class', 'Present', 'Absent', 'Late', 'Excused', 'Attendance %'];
    const rows = studentRows.map(s => [
      `${s.firstName} ${s.lastName}`,
      s.rollNumber,
      s.className,
      s.present, s.absent, s.late, s.excused,
      `${s.attendanceRate}%`
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url;
    a.download = `attendance-report-${getRange().from}-to-${getRange().to}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const selectedClassName  = classes.find(c => String(c.classId) === String(selectedClass))?.className;
  const selectedPeriodLabel = WEEK_OPTIONS.find(o => o.value === period)?.label;
  const { from, to }        = getRange();

  const formatDate = d =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  /* bar chart max */
  const barMax = weeklyTrend.length
    ? Math.max(...weeklyTrend.map(w => w.present + w.absent + w.late + w.excused), 1)
    : 1;

  return (
    <div className="tr-root">

      {/* ── Page Header ─────────────────────────────── */}
      <div className="tr-page-header">
        <div>
          <h1 className="tr-page-title">Attendance Reports</h1>
          <p className="tr-page-desc">Generate weekly summaries and per-student breakdowns</p>
        </div>
      </div>

      {error && (
        <div className="tr-error">
          <AlertCircle size={15} /> {error}
          <button className="tr-error-close" onClick={() => setError('')}><X size={13} /></button>
        </div>
      )}

      {/* ── Controls Card ───────────────────────────── */}
      <div className="tr-controls-card">
        <div className="tr-controls-row">

          {/* Class */}
          <div className="tr-ctrl-group">
            <label className="tr-ctrl-label"><BookOpen size={13} /> Class</label>
            <div className="tr-dropdown-root">
              <button
                className={`tr-dropdown-trigger ${showClassDrop ? 'tr-open' : ''}`}
                onClick={() => { setShowClassDrop(v => !v); setShowPeriodDrop(false); }}
                disabled={classLoading}
              >
                <span>{classLoading ? 'Loading…' : (selectedClassName || 'All Classes')}</span>
                <ChevronDown size={14} className="tr-chevron" />
              </button>
              {showClassDrop && (
                <div className="tr-dropdown-menu">
                  <button
                    className={`tr-dropdown-item ${selectedClass === 'all' ? 'tr-active' : ''}`}
                    onClick={() => { setSelectedClass('all'); setShowClassDrop(false); }}
                  >All Classes</button>
                  {classes.map(cls => (
                    <button
                      key={cls.classId}
                      className={`tr-dropdown-item ${String(selectedClass) === String(cls.classId) ? 'tr-active' : ''}`}
                      onClick={() => { setSelectedClass(cls.classId); setShowClassDrop(false); }}
                    >
                      <span className="tr-item-name">{cls.className}</span>
                      <span className="tr-item-meta">{cls.subject}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Period */}
          <div className="tr-ctrl-group">
            <label className="tr-ctrl-label"><Calendar size={13} /> Period</label>
            <div className="tr-dropdown-root">
              <button
                className={`tr-dropdown-trigger ${showPeriodDrop ? 'tr-open' : ''}`}
                onClick={() => { setShowPeriodDrop(v => !v); setShowClassDrop(false); }}
              >
                <span>{selectedPeriodLabel}</span>
                <ChevronDown size={14} className="tr-chevron" />
              </button>
              {showPeriodDrop && (
                <div className="tr-dropdown-menu">
                  {WEEK_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      className={`tr-dropdown-item tr-period-item ${period === opt.value ? 'tr-active' : ''}`}
                      onClick={() => { setPeriod(opt.value); setShowPeriodDrop(false); }}
                    >{opt.label}</button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Custom dates */}
          {period === 'custom' && (
            <>
              <div className="tr-ctrl-group">
                <label className="tr-ctrl-label"><Calendar size={13} /> From</label>
                <input type="date" className="tr-date-input" value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
              </div>
              <div className="tr-ctrl-group">
                <label className="tr-ctrl-label"><Calendar size={13} /> To</label>
                <input type="date" className="tr-date-input" value={customTo} onChange={e => setCustomTo(e.target.value)} />
              </div>
            </>
          )}

          {/* Generate */}
          <div className="tr-ctrl-group tr-generate-wrap">
            <label className="tr-ctrl-label">&nbsp;</label>
            <button className="tr-generate-btn" onClick={fetchReport} disabled={loading}>
              {loading
                ? <><span className="tr-btn-spinner" /> Generating…</>
                : <><BarChart2 size={16} /> Generate Report</>
              }
            </button>
          </div>
        </div>

        {/* Date range preview */}
        {from && to && (
          <div className="tr-range-preview">
            <Calendar size={13} />
            {formatDate(from)} — {formatDate(to)}
          </div>
        )}
      </div>

      {/* ── Report Output ───────────────────────────── */}
      {loading && (
        <div className="tr-loading">
          <div className="tr-spinner" />
          <p>Generating report…</p>
        </div>
      )}

      {!loading && !generated && (
        <div className="tr-placeholder">
          <div className="tr-placeholder-icon"><BarChart2 size={40} /></div>
          <h3>No Report Generated Yet</h3>
          <p>Select a class and period above, then click <strong>Generate Report</strong> to see results.</p>
        </div>
      )}

      {!loading && generated && (
        <>
          {/* ── Summary Cards ───────────────────────── */}
          {summary && (
            <div className="tr-summary-grid">
              <div className="tr-sum-card tr-sum-total">
                <div className="tr-sum-icon"><GraduationCap size={22} /></div>
                <div className="tr-sum-body">
                  <span className="tr-sum-label">Total Records</span>
                  <span className="tr-sum-value">{summary.totalRecords ?? 0}</span>
                </div>
              </div>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <div key={key} className="tr-sum-card" style={{ '--sc-color': cfg.color, '--sc-bg': cfg.bg, '--sc-border': cfg.border }}>
                    <div className="tr-sum-icon tr-sum-status-icon"><Icon size={20} /></div>
                    <div className="tr-sum-body">
                      <span className="tr-sum-label">{cfg.label}</span>
                      <span className="tr-sum-value">{summary[key] ?? 0}</span>
                      <span className="tr-sum-pct">
                        {summary.totalRecords
                          ? Math.round(((summary[key] ?? 0) / summary.totalRecords) * 100)
                          : 0}%
                      </span>
                    </div>
                  </div>
                );
              })}
              <div className="tr-sum-card tr-sum-rate">
                <div className="tr-sum-icon"><Percent size={22} /></div>
                <div className="tr-sum-body">
                  <span className="tr-sum-label">Avg. Attendance</span>
                  <span className="tr-sum-value">{summary.averageAttendance ?? 0}%</span>
                  <div className="tr-rate-bar-wrap">
                    <div
                      className="tr-rate-bar"
                      style={{ width: `${summary.averageAttendance ?? 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Weekly Trend Chart ───────────────────── */}
          {weeklyTrend.length > 0 && (
            <div className="tr-chart-card">
              <div className="tr-card-header">
                <div className="tr-card-title"><TrendingUp size={17} /> Weekly Trend</div>
              </div>
              <div className="tr-chart-body">
                <div className="tr-bar-chart">
                  {weeklyTrend.map((w, i) => {
                    const total = w.present + w.absent + w.late + w.excused;
                    return (
                      <div key={i} className="tr-bar-col">
                        <div className="tr-bar-stack-wrap">
                          <div className="tr-bar-stack" style={{ height: `${(total / barMax) * 100}%` }}>
                            {(['present','late','excused','absent']).map(s => {
                              const pct = total ? (w[s] / total) * 100 : 0;
                              if (!pct) return null;
                              return (
                                <div
                                  key={s}
                                  className="tr-bar-segment"
                                  style={{ height: `${pct}%`, background: STATUS_CONFIG[s].color }}
                                  title={`${STATUS_CONFIG[s].label}: ${w[s]}`}
                                />
                              );
                            })}
                          </div>
                          <span className="tr-bar-count">{total}</span>
                        </div>
                        <span className="tr-bar-label">{w.label || `W${i + 1}`}</span>
                      </div>
                    );
                  })}
                </div>
                {/* Legend */}
                <div className="tr-chart-legend">
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <div key={key} className="tr-legend-item">
                      <span className="tr-legend-dot" style={{ background: cfg.color }} />
                      {cfg.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Student Breakdown ────────────────────── */}
          <div className="tr-table-card">
            <div className="tr-card-header">
              <div className="tr-card-title"><Users size={17} /> Student Breakdown</div>
              <button
                className="tr-export-btn"
                onClick={handleExport}
                disabled={!studentRows.length}
              >
                <Download size={14} /> Export CSV
              </button>
            </div>

            {studentRows.length === 0 ? (
              <div className="tr-empty">
                <p>No student data for the selected period.</p>
              </div>
            ) : (
              <div className="tr-table-wrap">
                <table className="tr-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Class</th>
                      <th className="tr-center">Present</th>
                      <th className="tr-center">Absent</th>
                      <th className="tr-center">Late</th>
                      <th className="tr-center">Excused</th>
                      <th className="tr-center">Attendance %</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentRows.map((s, idx) => {
                      const rate = s.attendanceRate ?? 0;
                      const rateColor = rate >= 80 ? '#10B981' : rate >= 60 ? '#F59E0B' : '#EF4444';
                      return (
                        <tr key={s.studentId} style={{ animationDelay: `${idx * 20}ms` }}>
                          <td>
                            <div className="tr-student-cell">
                              <div className="tr-avatar">
                                {((s.firstName?.[0] || '') + (s.lastName?.[0] || '')).toUpperCase()}
                              </div>
                              <div className="tr-student-info">
                                <span className="tr-student-name">{s.firstName} {s.lastName}</span>
                                <span className="tr-student-roll">{s.rollNumber}</span>
                              </div>
                            </div>
                          </td>
                          <td className="tr-class-cell">{s.className}</td>
                          <td className="tr-center">
                            <span className="tr-count-badge tr-present">{s.present ?? 0}</span>
                          </td>
                          <td className="tr-center">
                            <span className="tr-count-badge tr-absent">{s.absent ?? 0}</span>
                          </td>
                          <td className="tr-center">
                            <span className="tr-count-badge tr-late">{s.late ?? 0}</span>
                          </td>
                          <td className="tr-center">
                            <span className="tr-count-badge tr-excused">{s.excused ?? 0}</span>
                          </td>
                          <td className="tr-center">
                            <div className="tr-rate-cell">
                              <span className="tr-rate-num" style={{ color: rateColor }}>{rate}%</span>
                              <div className="tr-mini-bar-bg">
                                <div
                                  className="tr-mini-bar-fill"
                                  style={{ width: `${rate}%`, background: rateColor }}
                                />
                              </div>
                            </div>
                          </td>
                          <td>
                            <span
                              className="tr-standing-badge"
                              style={{
                                '--st-color': rateColor,
                                '--st-bg': rate >= 80 ? '#D1FAE5' : rate >= 60 ? '#FEF3C7' : '#FEE2E2',
                                '--st-border': rate >= 80 ? '#6EE7B7' : rate >= 60 ? '#FCD34D' : '#FCA5A5',
                              }}
                            >
                              {rate >= 80 ? 'Good' : rate >= 60 ? 'At Risk' : 'Critical'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Refresh footer */}
          <div className="tr-report-footer">
            <span className="tr-footer-note">
              Report for {formatDate(from)} — {formatDate(to)}
              {selectedClassName ? ` · ${selectedClassName}` : ' · All Classes'}
            </span>
            <button className="tr-refresh-btn" onClick={fetchReport}>
              <RefreshCw size={14} /> Regenerate
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default TeacherReports;