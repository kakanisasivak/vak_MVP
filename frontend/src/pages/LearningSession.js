// src/pages/LearningSession.js
// ─────────────────────────────────────────────────────────────────────────────
// THE LEARNING SESSION — The learner's direct experience of Vak
// This is where Three Laws play out: RECEIVE (context loaded) → BUILD
// (instruction cycle) → RETURN (mastery confirmed, advance)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import api from '../utils/api';

const APPROACH_NAMES = {
  native_concept: 'Native Concept',
  analogy: 'Analogy',
  worked_example: 'Worked Example',
  decomposition: 'Building Blocks',
  simplified: 'Simplified'
};

export default function LearningSession() {
  const { user } = useAuth();
  const { lang, toggleLang, t } = useLang();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const [sessionId, setSessionId] = useState(null);
  const [nodeLabel, setNodeLabel] = useState('');
  const [clusterLabel, setClusterLabel] = useState('');
  const [approach, setApproach] = useState('native_concept');
  const [loopCount, setLoopCount] = useState(0);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState('instruction'); // instruction | mastery_check | result
  const [masteryQuestion, setMasteryQuestion] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Start session on mount
  useEffect(() => {
    startSession();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startSession = async () => {
    setLoading(true);
    try {
      const res = await api.post('/learner/session/start', { language: lang });
      setSessionId(res.data.session_id);
      setNodeLabel(res.data.node_label || '');
      setClusterLabel(res.data.cluster_label || '');
      setApproach(res.data.approach || 'native_concept');
      setLoopCount(res.data.loop_count || 0);

      const history = res.data.history || [];
      if (res.data.message) {
        setMessages([{ role: 'ai', content: res.data.message, type: 'instruction' }]);
      } else {
        setMessages(history.map(m => ({ role: m.role, content: m.content, type: m.message_type })));
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start session');
    }
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'learner', content: userMsg, type: 'response' }]);
    setLoading(true);

    try {
      const res = await api.post(`/learner/session/${sessionId}/message`, {
        content: userMsg,
        request_mastery_check: false,
        language: lang
      });
      setMessages(prev => [...prev, { role: 'ai', content: res.data.message, type: res.data.message_type }]);

      if (res.data.message_type === 'mastery_check' && res.data.mastery_check_question) {
        setMasteryQuestion(res.data.mastery_check_question);
        setPhase('mastery_check');
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Technical error. Please try again.', type: 'error' }]);
    }
    setLoading(false);
  };

  const requestMasteryCheck = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/learner/session/${sessionId}/message`, {
        content: t.masteryRequest,
        request_mastery_check: true,
        language: lang
      });
      setMessages(prev => [...prev, { role: 'ai', content: res.data.message, type: 'mastery_check' }]);
      setMasteryQuestion(res.data.mastery_check_question || res.data.message);
      setPhase('mastery_check');
    } catch (err) {
      setError('Failed to generate mastery check');
    }
    setLoading(false);
  };

  const submitMasteryAnswer = async () => {
    if (!input.trim() || loading) return;
    const answer = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'learner', content: answer, type: 'mastery_answer' }]);
    setLoading(true);

    try {
      const res = await api.post(`/learner/session/${sessionId}/mastery-check`, {
        question: masteryQuestion,
        learner_response: answer,
        language: lang
      });

      if (res.data.result === 'advance') {
        setMessages(prev => [...prev, {
          role: 'ai',
          content: res.data.feedback + (res.data.programme_complete
            ? `\n\n🎓 ${t.completedAll ? '' : ''}${lang === 'hindi' ? 'आपने सभी कौशल पूरे कर लिए हैं!' : 'మీరు అన్ని నైపుణ్యాలు పూర్తి చేశారు!'}`
            : `\n\n${t.completedAll(res.data.next_node?.label || '')}`),
          type: 'advance_trigger'
        }]);
        setResult({ ...res.data, type: 'advance' });
        setPhase('result');
      } else {
        setMessages(prev => [...prev, {
          role: 'ai',
          content: res.data.feedback + '\n\n' + t.loopMsg(APPROACH_NAMES[res.data.next_approach] || res.data.next_approach),
          type: 'loop_trigger'
        }]);
        setPhase('instruction');
        setLoopCount(res.data.loop_count);
        setApproach(res.data.next_approach);

        setTimeout(async () => {
          if (res.data.new_session_id) {
            setSessionId(res.data.new_session_id);
            const nextRes = await api.post(`/learner/session/${res.data.new_session_id}/message`, {
              content: t.resumeLearning,
              request_mastery_check: false,
              language: lang
            });
            setMessages(prev => [...prev, { role: 'ai', content: nextRes.data.message, type: 'instruction' }]);
          }
        }, 800);
      }
    } catch (err) {
      setError('Evaluation failed: ' + (err.response?.data?.error || err.message));
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (phase === 'mastery_check') submitMasteryAnswer();
      else sendMessage();
    }
  };

  const msgColor = { ai: '#1E293B', learner: '#0F2A1E', advance_trigger: '#0F3A10', loop_trigger: '#2A1A0A', mastery_check: '#1A1A3A' };
  const msgTextColor = { ai: '#F1F5F9', learner: '#D1FAE5', advance_trigger: '#10B981', loop_trigger: '#FBBF24', mastery_check: '#C4B5FD' };

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.headerLeft}>
          <button style={S.backBtn} onClick={() => navigate('/learn/dashboard')}>←</button>
          <div>
            <div style={S.nodeTitle}>{nodeLabel}</div>
            <div style={S.clusterTitle}>{clusterLabel}</div>
          </div>
        </div>
        <div style={S.headerRight}>
          <div style={S.approachBadge}>{APPROACH_NAMES[approach]}</div>
          <button style={S.langToggle} onClick={toggleLang}>{t.switchLang}</button>
          {loopCount > 0 && <div style={S.loopBadge}>Loop {loopCount}</div>}
        </div>
      </div>

      {/* Phase indicator */}
      {phase === 'mastery_check' && (
        <div style={S.checkBanner}>{t.masteryCheckBanner}</div>
      )}

      {/* Messages */}
      <div style={S.chatArea}>
        {error && <div style={S.errorMsg}>{error}</div>}
        {messages.map((msg, i) => (
          <div key={i} style={{ ...S.msgWrap, justifyContent: msg.role === 'learner' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              ...S.bubble,
              background: msgColor[msg.type] || (msg.role === 'learner' ? '#0F2A1E' : '#1E293B'),
              color: msgTextColor[msg.type] || (msg.role === 'learner' ? '#D1FAE5' : '#F1F5F9'),
              borderRadius: msg.role === 'learner' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              border: msg.type === 'mastery_check' ? '1px solid #6D28D9' :
                      msg.type === 'advance_trigger' ? '1px solid #10B981' :
                      msg.type === 'loop_trigger' ? '1px solid #F59E0B' : '1px solid #334155'
            }}>
              {msg.role === 'ai' && <div style={S.aiLabel}>VAK</div>}
              <div style={S.msgText}>{msg.content}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div style={S.msgWrap}>
            <div style={{ ...S.bubble, background: '#1E293B' }}>
              <div style={S.aiLabel}>VAK</div>
              <div className="typing"><span /><span /><span /></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      {phase !== 'result' ? (
        <div style={S.inputArea}>
          {phase === 'instruction' && (
            <button style={S.readyBtn} onClick={requestMasteryCheck} disabled={loading || messages.length < 2}>
              {t.readyBtn}
            </button>
          )}
          <div style={S.inputRow}>
            <textarea
              style={S.input}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={phase === 'mastery_check' ? t.answerPlaceholder : t.inputPlaceholder}
              rows={3}
              disabled={loading}
            />
            <button style={S.sendBtn} onClick={phase === 'mastery_check' ? submitMasteryAnswer : sendMessage} disabled={loading || !input.trim()}>
              {t.sendBtn}
            </button>
          </div>
        </div>
      ) : (
        <div style={S.resultArea}>
          {result?.programme_complete ? (
            <div style={S.completeResult}>
              {t.programComplete}
              <button style={S.dashBtn} onClick={() => navigate('/learn/dashboard')}>
                {t.goToDashboard}
              </button>
            </div>
          ) : (
            <div style={S.advanceResult}>
              <div style={{ color: '#10B981', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{t.advanceLabel}</div>
              <div style={{ color: '#94A3B8', fontSize: 14, marginBottom: 16 }}>
                {t.nextSkillLabel} <strong style={{ color: '#60A5FA' }}>{result?.next_node?.label}</strong>
              </div>
              <button style={S.nextBtn} onClick={() => { setPhase('instruction'); startSession(); }}>
                {t.nextSkillBtn}
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes bounce { 0%,80%,100% { transform: scale(0); } 40% { transform: scale(1); } }
        .typing span { display: inline-block; width: 8px; height: 8px; margin: 0 2px; background: #60A5FA; border-radius: 50%; animation: bounce 1.4s infinite ease-in-out both; }
        .typing span:nth-child(1) { animation-delay: -0.32s; }
        .typing span:nth-child(2) { animation-delay: -0.16s; }
      `}</style>
    </div>
  );
}

const S = {
  page: { height: '100vh', background: '#0F172A', fontFamily: 'Arial, sans-serif', display: 'flex', flexDirection: 'column' },
  header: { background: '#1E293B', borderBottom: '1px solid #334155', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  backBtn: { background: 'none', border: 'none', color: '#3B82F6', fontSize: 20, cursor: 'pointer' },
  nodeTitle: { color: '#F1F5F9', fontWeight: 700, fontSize: 15 },
  clusterTitle: { color: '#64748B', fontSize: 12 },
  headerRight: { display: 'flex', gap: 8, alignItems: 'center' },
  approachBadge: { background: '#1E3A5F', color: '#60A5FA', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 },
  langToggle: { background: '#0F3A2A', color: '#10B981', border: '1px solid #10B98144', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  loopBadge: { background: '#2A1A0A', color: '#FBBF24', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 },
  checkBanner: { background: '#1A1A3A', borderBottom: '1px solid #6D28D9', padding: '10px 20px', color: '#C4B5FD', fontSize: 14, fontWeight: 600, flexShrink: 0 },
  chatArea: { flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 },
  errorMsg: { background: '#450A0A', border: '1px solid #7F1D1D', color: '#FCA5A5', padding: '10px 14px', borderRadius: 8, fontSize: 14 },
  msgWrap: { display: 'flex' },
  bubble: { maxWidth: '80%', padding: '14px 18px', lineHeight: 1 },
  aiLabel: { color: '#3B82F6', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 6 },
  msgText: { fontSize: 15, lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
  inputArea: { background: '#1E293B', borderTop: '1px solid #334155', padding: '12px 16px', flexShrink: 0 },
  readyBtn: { width: '100%', background: '#1A1A3A', border: '1px solid #6D28D9', color: '#C4B5FD', padding: '10px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 8 },
  inputRow: { display: 'flex', gap: 8, alignItems: 'flex-end' },
  input: { flex: 1, background: '#0F172A', border: '1px solid #334155', color: '#F1F5F9', padding: '10px 14px', borderRadius: 10, fontSize: 15, lineHeight: 1.5, resize: 'none', fontFamily: 'Arial, sans-serif', outline: 'none' },
  sendBtn: { background: '#3B82F6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', height: 44, flexShrink: 0 },
  resultArea: { background: '#1E293B', borderTop: '1px solid #334155', padding: '20px 24px', flexShrink: 0 },
  completeResult: { color: '#10B981', fontSize: 20, fontWeight: 700, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },
  advanceResult: { background: '#0F2A1E', border: '1px solid #10B981', borderRadius: 12, padding: '20px 24px', textAlign: 'center' },
  dashBtn: { background: '#10B981', color: 'white', border: 'none', padding: '11px 24px', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 8 },
  nextBtn: { background: '#10B981', color: 'white', border: 'none', padding: '12px 28px', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer' }
};
