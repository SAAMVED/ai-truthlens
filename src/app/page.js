"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Bot, BrainCircuit, AlertTriangle, BarChart3, Sparkles, Cpu } from 'lucide-react';

export default function Home() {
  const [question, setQuestion] = useState('');
  const [selectedModels, setSelectedModels] = useState({ gpt4: true, gemini: true, claude: true });
  const [isAsking, setIsAsking] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [modelResponses, setModelResponses] = useState({});
  // tags: { modelId: { tags: string[], reasoning: string, source: string } }
  const [analysisResults, setAnalysisResults] = useState({});
  const [validationMethod, setValidationMethod] = useState('');
  const [observation, setObservation] = useState('');

  const TAG_OPTIONS = ["Fabricated Facts", "Contradictions", "Overconfidence", "Unsupported Claims"];
  const VALIDATION_OPTIONS = ["Cross-Model Comparison", "Logical Reasoning", "External Reference Check", "No Validation Needed"];

  const models = [
    { id: 'gpt4',   name: 'GPT-4o',     icon: <Bot className="w-4 h-4" />,          color: '#4f46e5' },
    { id: 'gemini', name: 'Gemini 1.5', icon: <BrainCircuit className="w-4 h-4" />,  color: '#0ea5e9' },
    { id: 'claude', name: 'Claude 3.5', icon: <Sparkles className="w-4 h-4" />,      color: '#f97316' },
  ];

  const handleModelToggle = (id) =>
    setSelectedModels(prev => ({ ...prev, [id]: !prev[id] }));

  // ── AUTO-ANALYZE all responses using the AI ──────────────────────────────
  const analyzeAllResponses = async (responses, currentQuestion) => {
    setIsAnalyzing(true);
    const results = {};
    await Promise.all(
      Object.entries(responses).map(async ([modelId, responseText]) => {
        try {
          const modelName = models.find(m => m.id === modelId)?.name || modelId;
          const res = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: currentQuestion, modelName, response: responseText }),
          });
          const data = await res.json();
          results[modelId] = data;
        } catch {
          results[modelId] = { tags: [], reasoning: 'Analysis failed.', source: 'error' };
        }
      })
    );
    setAnalysisResults(results);
    setIsAnalyzing(false);
  };

  const handleAsk = async () => {
    if (!question.trim()) return;
    const selectedList = Object.keys(selectedModels).filter(k => selectedModels[k]);
    if (!selectedList.length) { alert("Select at least one model."); return; }

    setIsAsking(true);
    setModelResponses({});
    setAnalysisResults({});
    setValidationMethod('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, models: selectedList }),
      });
      const data = await res.json();
      if (data.success) {
        setModelResponses(data.responses);
        // Immediately kick off AI hallucination analysis
        await analyzeAllResponses(data.responses, question);
      } else {
        alert("Error fetching AI responses.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to connect to the API.");
    } finally {
      setIsAsking(false);
    }
  };

  const handleSaveSession = async () => {
    // Build hallucinationTags from AI analysis results
    const hallucinationTags = {};
    Object.entries(analysisResults).forEach(([modelId, result]) => {
      hallucinationTags[modelId] = result.tags || [];
    });

    try {
      const res = await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          modelsQueried: Object.keys(selectedModels).filter(k => selectedModels[k]),
          responses: modelResponses,
          hallucinationTags,
          validation: validationMethod,
          observation,
          analysisResults,
        }),
      });
      if (res.ok) {
        alert("Session saved! (src/data/db.json)");
        setQuestion(''); setModelResponses({}); setAnalysisResults({});
        setValidationMethod(''); setObservation('');
      } else {
        alert("Failed to save.");
      }
    } catch { alert("Error saving data"); }
  };

  const activeModels = models.filter(m => selectedModels[m.id]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: '220px', flexShrink: 0,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex', flexDirection: 'column',
        padding: '24px 16px', gap: '8px',
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
      }}>
        <div style={{ marginBottom: '28px', paddingLeft: '8px' }}>
          <h1 style={{
            fontSize: '18px', fontWeight: 800,
            background: 'linear-gradient(135deg, #818cf8, #a78bfa)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>AI TruthLens</h1>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Hallucination Detector</p>
        </div>
        <Link href="/" className="nav-link active">
          <Search style={{ width: 16, height: 16 }} /> Playground
        </Link>
        <Link href="/dashboard" className="nav-link">
          <BarChart3 style={{ width: 16, height: 16 }} /> Dashboard
        </Link>
        <div style={{ flexGrow: 1 }} />
        <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', paddingLeft: '8px' }}>JSON Storage</p>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', paddingLeft: '8px', marginTop: 2 }}>Raw Data</p>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main style={{ flex: 1, padding: '40px 40px 80px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>

          {/* HEADER */}
          <header>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
              LLM Comparison Playground
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Ask a question, compare model outputs, and let AI automatically detect hallucinations.
            </p>
          </header>

          {/* INPUT CARD */}
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '10px' }}>
                Enter your prompt or question:
              </label>
              <textarea
                className="dark-input"
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAsk(); } }}
                placeholder="e.g., What are the health benefits of drinking green tea?"
                rows={3}
                style={{ resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Select Models to Compare:
                </span>
                {models.map(m => (
                  <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                    <span style={{
                      width: '18px', height: '18px', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: selectedModels[m.id] ? m.color : 'transparent',
                      border: `2px solid ${selectedModels[m.id] ? m.color : 'var(--border-subtle)'}`,
                      transition: 'all 0.2s', flexShrink: 0,
                    }}>
                      {selectedModels[m.id] && <span style={{ color: '#fff', fontSize: '11px', fontWeight: 800 }}>✓</span>}
                    </span>
                    <input type="checkbox" style={{ display: 'none' }} checked={selectedModels[m.id]} onChange={() => handleModelToggle(m.id)} />
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--text-primary)' }}>
                      {m.icon} {m.name}
                    </span>
                  </label>
                ))}
              </div>

              <button onClick={handleAsk} disabled={isAsking || isAnalyzing} className="btn-glow"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', whiteSpace: 'nowrap' }}>
                <Sparkles style={{ width: 16, height: 16 }} />
                {isAsking ? 'Fetching responses…' : isAnalyzing ? 'AI analyzing…' : 'Generate Answers'}
              </button>
            </div>
          </div>

          {/* RESPONSE + AI ANALYSIS CARDS */}
          {(isAsking || Object.keys(modelResponses).length > 0) && (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${activeModels.length}, 1fr)`, gap: '16px' }}>
              {activeModels.map(m => {
                const analysis = analysisResults[m.id];
                const detectedTags = analysis?.tags || [];
                const reasoning = analysis?.reasoning || '';
                const analysisSource = analysis?.source;

                return (
                  <div key={m.id} className="glass-card" style={{
                    padding: '20px', borderTop: `3px solid ${m.color}`,
                    display: 'flex', flexDirection: 'column',
                  }}>
                    {/* Card Header */}
                    <h3 style={{ fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: 'var(--text-primary)' }}>
                      <span style={{ color: m.color }}>{m.icon}</span> {m.name}
                    </h3>

                    {/* Response text or skeleton */}
                    {isAsking ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {[0.75, 1, 0.85].map((w, i) => (
                          <div key={i} className="animate-pulse-glow" style={{
                            height: '12px', borderRadius: '6px',
                            background: 'rgba(99,102,241,0.15)', width: `${w * 100}%`,
                          }} />
                        ))}
                      </div>
                    ) : (
                      <>
                        <p style={{ fontSize: '13px', lineHeight: 1.7, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', flexGrow: 1, marginBottom: '16px' }}>
                          {modelResponses[m.id] || 'No response received.'}
                        </p>

                        {/* AI HALLUCINATION ANALYSIS PANEL */}
                        {modelResponses[m.id] && (
                          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>

                            {/* Section header with AI badge */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                              <AlertTriangle style={{ width: 12, height: 12, color: '#f59e0b' }} />
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                AI-Detected Hallucinations
                              </span>
                              {/* Source badge */}
                              {analysisSource && (
                                <span style={{
                                  marginLeft: 'auto',
                                  fontSize: '10px', fontWeight: 700,
                                  padding: '2px 8px', borderRadius: '999px',
                                  background: analysisSource === 'gemini' ? 'rgba(14,165,233,0.15)' : 'rgba(245,158,11,0.15)',
                                  color: analysisSource === 'gemini' ? '#38bdf8' : '#fbbf24',
                                  border: `1px solid ${analysisSource === 'gemini' ? 'rgba(14,165,233,0.3)' : 'rgba(245,158,11,0.3)'}`,
                                  display: 'flex', alignItems: 'center', gap: '4px',
                                }}>
                                  <Cpu style={{ width: 9, height: 9 }} />
                                  {analysisSource === 'gemini' ? 'Gemini AI' : 'Heuristic'}
                                </span>
                              )}
                            </div>

                            {/* Analyzing spinner */}
                            {isAnalyzing && !analysis ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px' }}>
                                <div style={{
                                  width: '14px', height: '14px', borderRadius: '50%',
                                  border: '2px solid rgba(139,92,246,0.3)',
                                  borderTopColor: '#8b5cf6',
                                  animation: 'spin 0.8s linear infinite',
                                }} />
                                Analyzing for hallucinations…
                              </div>
                            ) : (
                              <>
                                {/* Tags */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                                  {detectedTags.length === 0 ? (
                                    <span style={{
                                      fontSize: '12px', padding: '4px 12px', borderRadius: '999px',
                                      background: 'rgba(16,185,129,0.12)',
                                      border: '1px solid rgba(16,185,129,0.3)',
                                      color: '#34d399', fontWeight: 600,
                                    }}>
                                      ✓ No hallucinations detected
                                    </span>
                                  ) : (
                                    detectedTags.map(tag => (
                                      <span key={tag} style={{
                                        fontSize: '12px', padding: '4px 12px', borderRadius: '999px',
                                        background: 'rgba(239,68,68,0.12)',
                                        border: '1px solid rgba(239,68,68,0.35)',
                                        color: '#fca5a5', fontWeight: 600,
                                      }}>
                                        ⚠ {tag}
                                      </span>
                                    ))
                                  )}
                                </div>

                                {/* Reasoning */}
                                {reasoning && (
                                  <p style={{
                                    fontSize: '11px', color: 'var(--text-muted)',
                                    lineHeight: 1.6, fontStyle: 'italic',
                                    background: 'rgba(255,255,255,0.03)',
                                    padding: '8px 10px', borderRadius: '8px',
                                    border: '1px solid var(--border-subtle)',
                                  }}>
                                    💬 {reasoning}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* FINALIZE & SAVE */}
          {Object.keys(modelResponses).length > 0 && !isAnalyzing && (
            <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Finalize & Save</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>Overall Observation</p>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  className="dark-input"
                  style={{ flex: 1, minWidth: '260px' }}
                  value={observation}
                  onChange={e => setObservation(e.target.value)}
                  placeholder="E.g., Model A fabricated dates, while Model B generalized…"
                />
                <button onClick={handleSaveSession} disabled={!validationMethod}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '12px 22px', borderRadius: '12px', fontWeight: 600, fontSize: '14px',
                    cursor: validationMethod ? 'pointer' : 'not-allowed', border: 'none',
                    background: validationMethod ? 'linear-gradient(135deg, #059669, #10b981)' : 'rgba(255,255,255,0.06)',
                    color: validationMethod ? '#fff' : 'var(--text-muted)',
                    boxShadow: validationMethod ? '0 0 20px rgba(16,185,129,0.3)' : 'none',
                    transition: 'all 0.2s', whiteSpace: 'nowrap',
                  }}>
                  💾 Save Evaluation to JSON
                </button>
              </div>

              {/* Validation options */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '4px' }}>
                {VALIDATION_OPTIONS.map(method => (
                  <label key={method} style={{
                    display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                    padding: '8px 14px', borderRadius: '10px', fontSize: '13px',
                    border: `1px solid ${validationMethod === method ? 'var(--accent-indigo)' : 'var(--border-subtle)'}`,
                    background: validationMethod === method ? 'rgba(79,70,229,0.12)' : 'rgba(255,255,255,0.03)',
                    color: validationMethod === method ? '#818cf8' : 'var(--text-secondary)',
                    transition: 'all 0.2s',
                  }}>
                    <input type="radio" name="validation" value={method}
                      checked={validationMethod === method}
                      onChange={e => setValidationMethod(e.target.value)}
                      style={{ display: 'none' }} />
                    {method}
                  </label>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
