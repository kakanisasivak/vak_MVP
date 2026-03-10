// src/pages/LearnerDashboard.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import api from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function LearnerDashboard() {
  const { user, logout } = useAuth();
  const { lang, toggleLang, t } = useLang();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [mastery, setMastery] = useState([]);

  useEffect(() => {
    api.get('/learner/dashboard').then(r => setData(r.data)).catch(() => {});
    api.get('/learner/mastery-record').then(r => setMastery(r.data)).catch(() => {});
  }, []);

  const chartData = mastery.map(m => ({
    name: m.node_label.length > 16 ? m.node_label.slice(0, 16) + '…' : m.node_label,
    Mastery: Math.round((m.mastery_attainment || 0) * 100),
  }));

  return (
    <div style={S.page}>
      <nav style={S.nav}>
        <div style={S.navLeft}>
          <div style={S.logo}>VAK</div>
          <div style={S.navDivider} />
          <span style={S.navTitle}>Learner Portal</span>
        </div>
        <div style={S.navRight}>
          <button style={S.langToggle} onClick={toggleLang}>
            {t.switchLang}
          </button>
          <div style={S.navUser}>
            <div style={S.userAvatar}>{(user?.name || 'L')[0].toUpperCase()}</div>
            <span style={S.navName}>{user?.name}</span>
          </div>
          <button style={S.logoutBtn} onClick={logout}>{t.logout}</button>
        </div>
      </nav>

      <div style={S.content}>
        <div style={S.pageHeader}>
          <div>
            <h1 style={S.h1}>{t.greeting}, {user?.name}</h1>
            {data && <p style={S.sub}>{data.engagement_title}</p>}
          </div>
        </div>

        {data && (
          <>
            {/* Progress card */}
            <div style={S.progressCard}>
              <div style={S.progressTop}>
                <span style={{ color: '#F1F5F9', fontWeight: 700, fontSize: 16 }}>{t.overallProgress}</span>
                <span style={{ color: '#10B981', fontWeight: 800, fontSize: 28 }}>{data.progress_pct}%</span>
              </div>
              <div style={S.progressBar}>
                <div style={{ ...S.progressFill, width: `${data.progress_pct}%` }} />
              </div>
              <div style={S.progressMeta}>
                {t.nodesMastered(data.nodes_mastered, data.total_nodes)}
              </div>
            </div>

            {/* KPI row */}
            <div style={S.kpiRow}>
              <KpiCard icon="🎯" label={t.currentSkill} value={data.current_node_label || '—'} color="#3B82F6" small />
              <KpiCard icon="📚" label={t.cluster} value={data.current_cluster_label || '—'} color="#8B5CF6" small />
              <KpiCard icon="⭐" label={t.mastery} value={`${mastery.length}`} color="#10B981" small />
            </div>

            {/* Current node action */}
            {data.current_node_label && data.overall_status !== 'completed' && (
              <div style={S.currentNode}>
                <div style={{ color: '#94A3B8', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                  {t.currentSkill}
                </div>
                <div style={{ color: '#F1F5F9', fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{data.current_node_label}</div>
                {data.current_cluster_label && (
                  <div style={{ color: '#60A5FA', fontSize: 13, marginBottom: 16 }}>{t.cluster}: {data.current_cluster_label}</div>
                )}
                <button style={S.startBtn} onClick={() => navigate('/learn/session')}>
                  {t.startLearning}
                </button>
              </div>
            )}

            {data.overall_status === 'completed' && (
              <div style={S.completedCard}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>🎓</div>
                <div style={{ color: '#10B981', fontSize: 24, fontWeight: 800 }}>{t.congratulations}</div>
                <div style={{ color: '#94A3B8', fontSize: 15, marginTop: 8, maxWidth: 360, margin: '8px auto 0' }}>
                  {t.completedMsg}
                </div>
              </div>
            )}
          </>
        )}

        {/* Mastery chart */}
        {mastery.length > 0 && (
          <div style={S.chartCard}>
            <div style={S.chartTitle}>{t.skillsMastered}</div>
            <div style={S.chartSub}>{t.mastery} % per skill node</div>
            <div style={{ marginTop: 20 }}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barGap={4} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ background: '#0F172A', border: '1px solid #334155', borderRadius: 8, color: '#F1F5F9', fontSize: 13 }}
                    cursor={{ fill: '#1E293B' }}
                    formatter={(v) => [`${v}%`, t.mastery]}
                  />
                  <Bar dataKey="Mastery" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Mastery cards */}
        {mastery.length > 0 && (
          <>
            <div style={S.sectionHeader}>
              <h2 style={S.h2}>{t.skillsMastered}</h2>
              <span style={S.countBadge}>{mastery.length}</span>
            </div>
            <div style={S.masteryGrid}>
              {mastery.map((m, i) => {
                const pct = Math.round((m.mastery_attainment || 0) * 100);
                return (
                  <div key={i} style={S.masteryCard}>
                    <div style={{ color: '#F1F5F9', fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{m.node_label}</div>
                    <div style={{ color: '#475569', fontSize: 12, marginBottom: 12 }}>{m.cluster_label}</div>
                    <div style={{ height: 5, background: '#1E293B', borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: '#10B981', borderRadius: 3 }} />
                    </div>
                    <div style={{ display: 'flex', gap: 16 }}>
                      <Stat v={`${pct}%`} l={t.mastery} c="#10B981" />
                      <Stat v={m.attempt_count} l={t.attempts} c="#60A5FA" />
                      <Stat v="✓" l={t.mastered} c="#10B981" />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, color, small }) {
  return (
    <div style={{ ...S.kpiCard, borderTopColor: color }}>
      <div style={{ fontSize: small ? 18 : 22, marginBottom: 8 }}>{icon}</div>
      <div style={{ color, fontSize: small ? 14 : 28, fontWeight: 800, lineHeight: 1.2, marginBottom: 4 }}>{value}</div>
      <div style={{ color: '#475569', fontSize: 12 }}>{label}</div>
    </div>
  );
}

function Stat({ v, l, c }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ color: c, fontSize: 14, fontWeight: 700 }}>{v}</span>
      <span style={{ color: '#475569', fontSize: 11 }}>{l}</span>
    </div>
  );
}

const S = {
  page: { minHeight: '100vh', background: '#0A0F1E', fontFamily: 'Arial, sans-serif' },
  nav: { background: '#0F172A', borderBottom: '1px solid #1E293B', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, position: 'sticky', top: 0, zIndex: 100 },
  navLeft: { display: 'flex', alignItems: 'center', gap: 16 },
  logo: { color: '#10B981', fontSize: 22, fontWeight: 900, letterSpacing: 4 },
  navDivider: { width: 1, height: 24, background: '#1E293B' },
  navTitle: { color: '#475569', fontSize: 14 },
  navRight: { display: 'flex', gap: 12, alignItems: 'center' },
  langToggle: { background: '#0F3A2A', color: '#10B981', border: '1px solid #10B98144', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  navUser: { display: 'flex', alignItems: 'center', gap: 8 },
  userAvatar: { width: 32, height: 32, borderRadius: '50%', background: '#065F46', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 },
  navName: { color: '#94A3B8', fontSize: 14 },
  logoutBtn: { background: 'transparent', color: '#475569', border: '1px solid #1E293B', padding: '8px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer' },
  content: { maxWidth: 900, margin: '0 auto', padding: '40px 32px' },
  pageHeader: { marginBottom: 28 },
  h1: { color: '#F1F5F9', fontSize: 28, fontWeight: 800, margin: '0 0 4px' },
  h2: { color: '#F1F5F9', fontSize: 18, fontWeight: 700, margin: 0 },
  sub: { color: '#475569', fontSize: 14, margin: 0 },
  progressCard: { background: '#0F172A', border: '1px solid #1E293B', borderRadius: 16, padding: '24px 28px', marginBottom: 20 },
  progressTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  progressBar: { height: 10, background: '#1E293B', borderRadius: 5, marginBottom: 10, overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #10B981, #3B82F6)', borderRadius: 5, transition: 'width 0.5s' },
  progressMeta: { color: '#475569', fontSize: 13 },
  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 },
  kpiCard: { background: '#0F172A', border: '1px solid #1E293B', borderTopWidth: 3, borderRadius: 12, padding: '18px 20px' },
  currentNode: { background: '#0A2A1E', border: '1px solid #10B98166', borderRadius: 16, padding: '24px 28px', marginBottom: 24 },
  startBtn: { background: '#10B981', color: 'white', border: 'none', padding: '12px 28px', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  completedCard: { background: '#0A2A0A', border: '1px solid #10B98166', borderRadius: 16, padding: '48px 40px', textAlign: 'center', marginBottom: 32 },
  chartCard: { background: '#0F172A', border: '1px solid #1E293B', borderRadius: 16, padding: '24px 28px', marginBottom: 28 },
  chartTitle: { color: '#F1F5F9', fontSize: 16, fontWeight: 700, marginBottom: 4 },
  chartSub: { color: '#475569', fontSize: 13 },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  countBadge: { background: '#1E293B', color: '#64748B', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  masteryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 },
  masteryCard: { background: '#0F172A', border: '1px solid #1E293B', borderRadius: 12, padding: '18px 20px' },
};
