// src/pages/EngagementDetail.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const STATUS_COLOR = { active: '#10B981', completed: '#3B82F6', in_progress: '#F59E0B', not_started: '#6B7280' };

export default function EngagementDetail() {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [producing, setProducing] = useState(false);
  const [logs, setLogs] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get(`/institution/engagements/${id}`).then(r => { setData(r.data); setLoading(false); });
    api.get(`/institution/engagements/${id}/mastery-logs`).then(r => setLogs(r.data)).catch(() => {});
  }, [id]);

  const produceLogs = async () => {
    setProducing(true);
    await api.post(`/institution/engagements/${id}/produce-mastery-logs`);
    const res = await api.get(`/institution/engagements/${id}/mastery-logs`);
    setLogs(res.data);
    setProducing(false);
  };

  const copyId = () => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div style={{ color: '#94A3B8', padding: 40, fontFamily: 'Arial' }}>Loading…</div>;

  const completedCount = (data.learners || []).filter(l => l.overall_status === 'completed').length;
  const totalLearners = (data.learners || []).length;
  const completionRate = totalLearners > 0 ? Math.round((completedCount / totalLearners) * 100) : 0;

  const chartData = (data.learners || []).map(l => ({
    name: l.name.split(' ')[0],
    Mastered: l.nodes_mastered || 0,
    status: l.overall_status
  }));

  return (
    <div style={S.page}>
      <nav style={S.nav}>
        <div style={S.navLeft}>
          <div style={S.logo}>VAK</div>
          <div style={S.navDivider} />
          <button style={S.backBtn} onClick={() => navigate('/institution/dashboard')}>← Dashboard</button>
        </div>
        <div style={S.navRight}>
          <div style={S.navUser}>
            <div style={S.userAvatar}>{(user?.name || 'I')[0].toUpperCase()}</div>
            <span style={S.navName}>{user?.name}</span>
          </div>
          <button style={S.btnGhost} onClick={logout}>Logout</button>
        </div>
      </nav>

      <div style={S.content}>
        {/* Page header */}
        <div style={S.pageHeader}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <h1 style={S.h1}>{data.title}</h1>
              <div style={{
                ...S.statusBadge,
                background: (STATUS_COLOR[data.status] || '#6B7280') + '22',
                color: STATUS_COLOR[data.status] || '#6B7280',
                border: `1px solid ${(STATUS_COLOR[data.status] || '#6B7280')}44`
              }}>
                {data.status}
              </div>
            </div>
            <p style={S.sub}>{data.ct_title}</p>
          </div>
          <button style={S.produceBtn} onClick={produceLogs} disabled={producing}>
            {producing ? 'Producing…' : '📋 Produce Mastery Logs'}
          </button>
        </div>

        {/* KPI row */}
        <div style={S.kpiRow}>
          <KpiCard icon="👥" label="Total Learners" value={totalLearners} color="#3B82F6" />
          <KpiCard icon="✅" label="Completed" value={completedCount} color="#10B981" />
          <KpiCard icon="📈" label="Completion Rate" value={`${completionRate}%`} color="#F59E0B" />
          <KpiCard icon="📄" label="Mastery Logs" value={logs.length} color="#8B5CF6" />
        </div>

        {/* Engagement ID */}
        <div style={S.engIdBox}>
          <div style={{ color: '#94A3B8', fontSize: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            Engagement ID — share with learners for login
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <code style={S.engIdCode}>{id}</code>
            <button
              style={{ ...S.copyBtn, background: copied ? '#064E3B' : '#1E293B', color: copied ? '#10B981' : '#60A5FA' }}
              onClick={copyId}
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <div style={S.chartCard}>
            <div style={S.chartTitle}>Learner Progress — Nodes Mastered</div>
            <div style={S.chartSub}>Skill nodes mastered per learner (coloured by status)</div>
            <div style={{ marginTop: 20 }}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} barGap={4} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#0F172A', border: '1px solid #334155', borderRadius: 8, color: '#F1F5F9', fontSize: 13 }} cursor={{ fill: '#1E293B' }} />
                  <Bar dataKey="Mastered" radius={[4, 4, 0, 0]} maxBarSize={48}>
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={STATUS_COLOR[entry.status] || '#64748B'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
              {Object.entries(STATUS_COLOR).map(([s, c]) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
                  <span style={{ color: '#64748B', fontSize: 11, textTransform: 'capitalize' }}>{s.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Learner table */}
        <div style={S.sectionHeader}>
          <h2 style={S.h2}>Learner Progress</h2>
          <span style={S.countBadge}>{totalLearners} learners</span>
        </div>
        <div style={S.table}>
          <div style={S.tableHead}>
            <div style={S.th}>Learner</div>
            <div style={S.th}>Ref</div>
            <div style={S.th}>Current Node</div>
            <div style={S.th}>Progress</div>
            <div style={S.th}>Status</div>
          </div>
          {(data.learners || []).map((l, i) => {
            const pct = data.total_nodes > 0 ? Math.round(((l.nodes_mastered || 0) / data.total_nodes) * 100) : 0;
            const col = STATUS_COLOR[l.overall_status] || '#64748B';
            return (
              <div key={i} style={S.tableRow}>
                <div style={S.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={S.learnerAvatar}>{l.name[0]}</div>
                    <span>{l.name}</span>
                  </div>
                </div>
                <div style={{ ...S.td, color: '#475569', fontFamily: 'monospace', fontSize: 12 }}>{l.learner_ref}</div>
                <div style={{ ...S.td, color: '#60A5FA', fontSize: 13 }}>{l.current_node_label || '—'}</div>
                <div style={S.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 5, background: '#1E293B', borderRadius: 3, overflow: 'hidden', minWidth: 60 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: col, borderRadius: 3 }} />
                    </div>
                    <span style={{ color: col, fontSize: 12, fontWeight: 700, minWidth: 32 }}>{pct}%</span>
                  </div>
                </div>
                <div style={S.td}>
                  <span style={{ color: col, fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>
                    {l.overall_status?.replace('_', ' ')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mastery Logs */}
        <div style={S.sectionHeader}>
          <h2 style={S.h2}>Mastery Logs</h2>
          <span style={S.countBadge}>{logs.length} produced</span>
        </div>
        {logs.length === 0 ? (
          <div style={S.noLogs}>
            No Mastery Logs produced yet. Complete the instruction cycle, then click "Produce Mastery Logs" above.
          </div>
        ) : (
          <div style={S.logGrid}>
            {logs.map(log => {
              const pct = log.log_data?.overall_completion || 0;
              return (
                <div key={log.id} style={S.logCard} onClick={() => navigate(`/institution/mastery-log/${log.id}`)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ color: '#F1F5F9', fontWeight: 700, fontSize: 15, marginBottom: 3 }}>{log.learner_name}</div>
                      <div style={{ color: '#475569', fontSize: 12, fontFamily: 'monospace' }}>{log.learner_ref}</div>
                    </div>
                    <div style={{ color: '#10B981', fontSize: 20, fontWeight: 800 }}>{pct}%</div>
                  </div>
                  <div style={{ height: 5, background: '#1E293B', borderRadius: 3, overflow: 'hidden', marginBottom: 12 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: '#10B981', borderRadius: 3 }} />
                  </div>
                  <div style={{ color: '#3B82F6', fontSize: 13, fontWeight: 600 }}>View Full Log →</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, color }) {
  return (
    <div style={{ ...S.kpiCard, borderTopColor: color }}>
      <div style={S.kpiIcon}>{icon}</div>
      <div style={{ ...S.kpiValue, color }}>{value}</div>
      <div style={S.kpiLabel}>{label}</div>
    </div>
  );
}

const S = {
  page: { minHeight: '100vh', background: '#0A0F1E', fontFamily: 'Arial, sans-serif' },
  nav: { background: '#0F172A', borderBottom: '1px solid #1E293B', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, position: 'sticky', top: 0, zIndex: 100 },
  navLeft: { display: 'flex', alignItems: 'center', gap: 16 },
  logo: { color: '#3B82F6', fontSize: 22, fontWeight: 900, letterSpacing: 4 },
  navDivider: { width: 1, height: 24, background: '#1E293B' },
  backBtn: { background: 'transparent', color: '#3B82F6', border: 'none', fontSize: 14, cursor: 'pointer', fontWeight: 600, padding: 0 },
  navRight: { display: 'flex', gap: 12, alignItems: 'center' },
  navUser: { display: 'flex', alignItems: 'center', gap: 8 },
  userAvatar: { width: 32, height: 32, borderRadius: '50%', background: '#1D4ED8', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 },
  navName: { color: '#94A3B8', fontSize: 14 },
  btnGhost: { background: 'transparent', color: '#475569', border: '1px solid #1E293B', padding: '8px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer' },
  content: { maxWidth: 1100, margin: '0 auto', padding: '40px 32px' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  h1: { color: '#F1F5F9', fontSize: 26, fontWeight: 800, margin: 0 },
  h2: { color: '#F1F5F9', fontSize: 18, fontWeight: 700, margin: 0 },
  sub: { color: '#475569', fontSize: 14, margin: '4px 0 0' },
  statusBadge: { padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'capitalize', whiteSpace: 'nowrap' },
  produceBtn: { background: '#7C3AED', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' },
  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 },
  kpiCard: { background: '#0F172A', border: '1px solid #1E293B', borderTopWidth: 3, borderRadius: 12, padding: '20px 22px' },
  kpiIcon: { fontSize: 22, marginBottom: 12 },
  kpiValue: { fontSize: 30, fontWeight: 800, lineHeight: 1, marginBottom: 6 },
  kpiLabel: { color: '#475569', fontSize: 13 },
  engIdBox: { background: '#0D1B35', border: '1px solid #1D4ED8', borderRadius: 12, padding: '16px 20px', marginBottom: 28 },
  engIdCode: { color: '#60A5FA', fontFamily: 'monospace', fontSize: 14, fontWeight: 700 },
  copyBtn: { border: '1px solid #334155', padding: '5px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  chartCard: { background: '#0F172A', border: '1px solid #1E293B', borderRadius: 16, padding: '24px 28px', marginBottom: 32 },
  chartTitle: { color: '#F1F5F9', fontSize: 16, fontWeight: 700, marginBottom: 4 },
  chartSub: { color: '#475569', fontSize: 13 },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  countBadge: { background: '#1E293B', color: '#64748B', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  table: { background: '#0F172A', border: '1px solid #1E293B', borderRadius: 14, overflow: 'hidden', marginBottom: 40 },
  tableHead: { display: 'grid', gridTemplateColumns: '2fr 1fr 2fr 2fr 1fr', background: '#060D1F', padding: '10px 20px', borderBottom: '1px solid #1E293B' },
  tableRow: { display: 'grid', gridTemplateColumns: '2fr 1fr 2fr 2fr 1fr', padding: '14px 20px', borderBottom: '1px solid #0A0F1E', alignItems: 'center' },
  th: { color: '#475569', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 },
  td: { color: '#CBD5E1', fontSize: 14 },
  learnerAvatar: { width: 28, height: 28, borderRadius: '50%', background: '#1D4ED8', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 },
  noLogs: { background: '#0F172A', border: '1px dashed #1E293B', borderRadius: 12, padding: '32px', color: '#475569', fontSize: 14, textAlign: 'center', marginBottom: 40 },
  logGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginBottom: 40 },
  logCard: { background: '#0F172A', border: '1px solid #1E293B', borderRadius: 12, padding: '20px', cursor: 'pointer' },
};
