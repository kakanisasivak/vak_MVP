// src/pages/InstitutionDashboard.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const STATUS_COLOR = { active: '#10B981', completed: '#3B82F6', setup: '#F59E0B', on_hold: '#6B7280' };
const STATUS_BG    = { active: '#052e16', completed: '#1e3a5f', setup: '#451a03', on_hold: '#1c1917' };

export default function InstitutionDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [engagements, setEngagements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/institution/engagements')
      .then(r => { setEngagements(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const totalLearners  = engagements.reduce((s, e) => s + (e.learner_count || 0), 0);
  const totalCompleted = engagements.reduce((s, e) => s + (e.completed_count || 0), 0);
  const activeCount    = engagements.filter(e => e.status === 'active').length;
  const completionPct  = totalLearners > 0 ? Math.round((totalCompleted / totalLearners) * 100) : 0;

  const chartData = engagements.map(e => ({
    name: e.title.length > 18 ? e.title.slice(0, 18) + '…' : e.title,
    Enrolled: e.learner_count || 0,
    Completed: e.completed_count || 0,
  }));

  return (
    <div style={S.page}>
      <nav style={S.nav}>
        <div style={S.navLeft}>
          <div style={S.logo}>VAK</div>
          <div style={S.navDivider} />
          <span style={S.navTitle}>Institution Portal</span>
        </div>
        <div style={S.navRight}>
          <div style={S.navUser}>
            <div style={S.userAvatar}>{(user?.name || 'I')[0].toUpperCase()}</div>
            <span style={S.navName}>{user?.name}</span>
          </div>
          <button style={S.btnPrimary} onClick={() => navigate('/institution/upload-target')}>+ New Engagement</button>
          <button style={S.btnGhost} onClick={logout}>Logout</button>
        </div>
      </nav>

      <div style={S.content}>
        <div style={S.pageHeader}>
          <div>
            <h1 style={S.h1}>Dashboard</h1>
            <p style={S.sub}>Track capability builds across your learner cohorts</p>
          </div>
          <button style={S.btnSecondary} onClick={() => navigate('/institution/upload-target')}>
            📋 Upload Capability Target
          </button>
        </div>

        {/* KPI cards */}
        <div style={S.kpiRow}>
          <KpiCard icon="🎯" label="Active Engagements" value={activeCount} color="#3B82F6" />
          <KpiCard icon="👥" label="Total Learners" value={totalLearners} color="#10B981" />
          <KpiCard icon="✅" label="Learners Completed" value={totalCompleted} color="#8B5CF6" />
          <KpiCard icon="📈" label="Overall Completion" value={`${completionPct}%`} color="#F59E0B" />
        </div>

        {/* Bar chart */}
        {engagements.length > 0 && (
          <div style={S.chartCard}>
            <div style={S.chartTitle}>Engagement Completion Overview</div>
            <div style={S.chartSub}>Learners enrolled vs completed per engagement</div>
            <div style={{ marginTop: 20 }}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barGap={4} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0F172A', border: '1px solid #334155', borderRadius: 8, color: '#F1F5F9', fontSize: 13 }} cursor={{ fill: '#1E293B' }} />
                  <Bar dataKey="Enrolled" fill="#3B82F6" radius={[4,4,0,0]} maxBarSize={36} />
                  <Bar dataKey="Completed" fill="#10B981" radius={[4,4,0,0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Engagement list */}
        <div style={S.sectionHeader}>
          <h2 style={S.h2}>Engagements</h2>
          <span style={S.engCount}>{engagements.length} total</span>
        </div>

        {loading ? (
          <div style={{ color: '#475569', padding: '24px 0' }}>Loading…</div>
        ) : engagements.length === 0 ? (
          <EmptyState onStart={() => navigate('/institution/upload-target')} />
        ) : (
          <div style={S.engGrid}>
            {engagements.map(e => (
              <EngagementCard key={e.id} e={e} onClick={() => navigate(`/institution/engagement/${e.id}`)} />
            ))}
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

function EngagementCard({ e, onClick }) {
  const pct = e.learner_count > 0 ? Math.round((e.completed_count / e.learner_count) * 100) : 0;
  const col = STATUS_COLOR[e.status] || '#64748B';
  return (
    <div style={S.engCard} onClick={onClick}>
      <div style={S.engCardTop}>
        <div style={{ flex: 1 }}>
          <div style={S.engTitle}>{e.title}</div>
          <div style={S.engMeta}>{e.ct_title} · {e.language === 'hindi' ? 'हिंदी' : 'తెలుగు'}</div>
        </div>
        <div style={{ ...S.badge, background: STATUS_BG[e.status], color: col, border: `1px solid ${col}44` }}>
          {e.status}
        </div>
      </div>
      <div style={S.engProgressRow}>
        <div style={S.engProgressBar}>
          <div style={{ ...S.engProgressFill, width: `${pct}%`, background: col }} />
        </div>
        <span style={{ ...S.engProgressPct, color: col }}>{pct}%</span>
      </div>
      <div style={S.engStats}>
        <EngStat v={e.learner_count || 0} l="Learners" />
        <div style={S.engDivider} />
        <EngStat v={e.completed_count || 0} l="Completed" />
        <div style={S.engDivider} />
        <EngStat v={new Date(e.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} l="Started" />
        <div style={{ marginLeft: 'auto', color: '#3B82F6', fontSize: 14, fontWeight: 600 }}>View →</div>
      </div>
    </div>
  );
}

function EngStat({ v, l }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ color: '#CBD5E1', fontSize: 15, fontWeight: 700 }}>{v}</span>
      <span style={{ color: '#475569', fontSize: 11 }}>{l}</span>
    </div>
  );
}

function EmptyState({ onStart }) {
  return (
    <div style={S.empty}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
      <div style={{ color: '#F1F5F9', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No engagements yet</div>
      <p style={{ color: '#475569', fontSize: 14, maxWidth: 340, margin: '0 auto 24px' }}>
        Upload a capability target to create your first learning engagement.
      </p>
      <button style={S.btnPrimary} onClick={onStart}>Start First Engagement</button>
    </div>
  );
}

const S = {
  page: { minHeight: '100vh', background: '#0A0F1E', fontFamily: 'Arial, sans-serif' },
  nav: { background: '#0F172A', borderBottom: '1px solid #1E293B', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, position: 'sticky', top: 0, zIndex: 100 },
  navLeft: { display: 'flex', alignItems: 'center', gap: 16 },
  logo: { color: '#3B82F6', fontSize: 22, fontWeight: 900, letterSpacing: 4 },
  navDivider: { width: 1, height: 24, background: '#1E293B' },
  navTitle: { color: '#475569', fontSize: 14 },
  navRight: { display: 'flex', gap: 12, alignItems: 'center' },
  navUser: { display: 'flex', alignItems: 'center', gap: 8 },
  userAvatar: { width: 32, height: 32, borderRadius: '50%', background: '#1D4ED8', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 },
  navName: { color: '#94A3B8', fontSize: 14 },
  btnPrimary: { background: '#2563EB', color: 'white', border: 'none', padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  btnSecondary: { background: '#1E293B', color: '#CBD5E1', border: '1px solid #334155', padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer' },
  btnGhost: { background: 'transparent', color: '#475569', border: '1px solid #1E293B', padding: '8px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer' },
  content: { maxWidth: 1200, margin: '0 auto', padding: '40px 32px' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 },
  h1: { color: '#F1F5F9', fontSize: 30, fontWeight: 800, margin: '0 0 6px', letterSpacing: -0.5 },
  h2: { color: '#F1F5F9', fontSize: 20, fontWeight: 700, margin: 0 },
  sub: { color: '#475569', fontSize: 15, margin: 0 },
  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 },
  kpiCard: { background: '#0F172A', border: '1px solid #1E293B', borderTopWidth: 3, borderRadius: 12, padding: '20px 22px' },
  kpiIcon: { fontSize: 22, marginBottom: 12 },
  kpiValue: { fontSize: 32, fontWeight: 800, lineHeight: 1, marginBottom: 6 },
  kpiLabel: { color: '#475569', fontSize: 13 },
  chartCard: { background: '#0F172A', border: '1px solid #1E293B', borderRadius: 16, padding: '24px 28px', marginBottom: 28 },
  chartTitle: { color: '#F1F5F9', fontSize: 16, fontWeight: 700, marginBottom: 4 },
  chartSub: { color: '#475569', fontSize: 13 },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  engCount: { background: '#1E293B', color: '#64748B', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  engGrid: { display: 'flex', flexDirection: 'column', gap: 12 },
  engCard: { background: '#0F172A', border: '1px solid #1E293B', borderRadius: 14, padding: '20px 24px', cursor: 'pointer' },
  engCardTop: { display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  engTitle: { color: '#F1F5F9', fontSize: 16, fontWeight: 700, marginBottom: 4 },
  engMeta: { color: '#475569', fontSize: 13 },
  badge: { padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'capitalize', whiteSpace: 'nowrap' },
  engProgressRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 },
  engProgressBar: { flex: 1, height: 6, background: '#1E293B', borderRadius: 3, overflow: 'hidden' },
  engProgressFill: { height: '100%', borderRadius: 3, transition: 'width 0.4s' },
  engProgressPct: { fontSize: 13, fontWeight: 700, minWidth: 36, textAlign: 'right' },
  engStats: { display: 'flex', alignItems: 'center', gap: 20 },
  engDivider: { width: 1, height: 28, background: '#1E293B' },
  empty: { background: '#0F172A', border: '1px dashed #1E293B', borderRadius: 16, padding: '64px 40px', textAlign: 'center' },
};
