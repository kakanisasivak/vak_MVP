// src/context/LangContext.js
// UI language context — toggle between Hindi and Telugu for the learner interface.
// Language change affects both UI strings AND the AI instruction language.

import React, { createContext, useContext, useState } from 'react';

const STRINGS = {
  hindi: {
    // Nav
    dashboard: 'डैशबोर्ड',
    logout: 'लॉगआउट',
    langLabel: 'हिंदी',
    switchLang: 'Switch to తెలుగు',
    // Dashboard
    greeting: 'नमस्ते',
    overallProgress: 'कुल प्रगति',
    nodesMastered: (n, t) => `${n} में से ${t} कौशल पूरे हुए`,
    currentSkill: 'वर्तमान कौशल',
    cluster: 'क्लस्टर',
    startLearning: 'पढ़ाई शुरू करें →',
    congratulations: 'बधाई हो!',
    completedMsg: 'आपने सभी कौशल पूरे कर लिए हैं। आपका मास्टरी लॉग तैयार है।',
    skillsMastered: 'मेरे सीखे गए कौशल',
    mastery: 'मास्टरी',
    attempts: 'प्रयास',
    mastered: 'पूरा हुआ',
    // Learning session
    readyBtn: 'मैं तैयार हूँ — परीक्षा लो',
    sendBtn: 'भेजें',
    inputPlaceholder: 'अपना प्रश्न या उत्तर लिखें…',
    answerPlaceholder: 'अपना उत्तर यहाँ लिखें…',
    masteryCheckBanner: '📝 मास्टरी चेक — अपना उत्तर लिखें',
    programComplete: '🎓 कार्यक्रम पूरा!',
    goToDashboard: 'डैशबोर्ड पर जाएं',
    advanceLabel: '✅ आगे बढ़ें',
    nextSkillLabel: 'अगला कौशल:',
    nextSkillBtn: 'अगला कौशल शुरू करें →',
    completedAll: (label) => `✅ आगे बढ़ते हैं: ${label}`,
    loopMsg: (approach) => `चलिए एक अलग तरीके से समझते हैं। नया तरीका: ${approach}`,
    masteryRequest: 'मैं समझ गया हूँ, परीक्षा लो',
    resumeLearning: 'फिर से शुरू करें',
  },
  telugu: {
    // Nav
    dashboard: 'డాష్‌బోర్డ్',
    logout: 'లాగ్అవుట్',
    langLabel: 'తెలుగు',
    switchLang: 'Switch to हिंदी',
    // Dashboard
    greeting: 'నమస్కారం',
    overallProgress: 'మొత్తం పురోగతి',
    nodesMastered: (n, t) => `${t} లో ${n} నైపుణ్యాలు పూర్తయ్యాయి`,
    currentSkill: 'ప్రస్తుత నైపుణ్యం',
    cluster: 'క్లస్టర్',
    startLearning: 'చదువు మొదలుపెట్టండి →',
    congratulations: 'అభినందనలు!',
    completedMsg: 'మీరు అన్ని నైపుణ్యాలు పూర్తి చేశారు. మీ మాస్టరీ లాగ్ సిద్ధంగా ఉంది.',
    skillsMastered: 'నేను నేర్చుకున్న నైపుణ్యాలు',
    mastery: 'మాస్టరీ',
    attempts: 'ప్రయత్నాలు',
    mastered: 'పూర్తయింది',
    // Learning session
    readyBtn: 'నేను సిద్ధంగా ఉన్నాను — పరీక్షించు',
    sendBtn: 'పంపు',
    inputPlaceholder: 'మీ ప్రశ్న లేదా సమాధానం రాయండి…',
    answerPlaceholder: 'మీ సమాధానం ఇక్కడ రాయండి…',
    masteryCheckBanner: '📝 మాస్టరీ చెక్ — మీ సమాధానం రాయండి',
    programComplete: '🎓 కార్యక్రమం పూర్తయింది!',
    goToDashboard: 'డాష్‌బోర్డ్‌కి వెళ్ళండి',
    advanceLabel: '✅ ముందుకు వెళ్ళండి',
    nextSkillLabel: 'తదుపరి నైపుణ్యం:',
    nextSkillBtn: 'తదుపరి నైపుణ్యం మొదలుపెట్టండి →',
    completedAll: (label) => `✅ ముందుకు వెళ్దాం: ${label}`,
    loopMsg: (approach) => `వేరే విధంగా అర్థం చేసుకుందాం. కొత్త పద్ధతి: ${approach}`,
    masteryRequest: 'నేను అర్థం చేసుకున్నాను, పరీక్షించు',
    resumeLearning: 'మళ్ళీ మొదలుపెట్టు',
  }
};

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem('vak_lang');
    if (saved && STRINGS[saved]) return saved;
    try {
      const u = JSON.parse(localStorage.getItem('vak_user') || '{}');
      return u.language && STRINGS[u.language] ? u.language : 'telugu';
    } catch { return 'telugu'; }
  });

  const toggleLang = () => {
    const next = lang === 'hindi' ? 'telugu' : 'hindi';
    setLang(next);
    localStorage.setItem('vak_lang', next);
  };

  const setLangDirect = (l) => {
    if (STRINGS[l]) { setLang(l); localStorage.setItem('vak_lang', l); }
  };

  return (
    <LangContext.Provider value={{ lang, toggleLang, setLangDirect, t: STRINGS[lang] }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
