"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Bot, BrainCircuit, AlertTriangle, BarChart3, Sparkles, Cpu, Info, CheckCircle, ShieldAlert } from 'lucide-react';

export default function Home() {
  const [question, setQuestion] = useState('');
  const [selectedModels, setSelectedModels] = useState({ gpt4: true, gemini: true, claude: true });
  const [isAsking, setIsAsking] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [modelResponses, setModelResponses] = useState({});
  const [modelLatencies, setModelLatencies] = useState({});
  // tags: { modelId: { tags: string[], reasoning: string, source: string } }
  const [analysisResults, setAnalysisResults] = useState({});
  const [validationMethod, setValidationMethod] = useState('Cross-Model Comparison');
  const [observation, setObservation] = useState('');

  const TAG_OPTIONS = ["Fabricated Facts", "Contradictions", "Overconfidence", "Unsupported Claims"];
  const VALIDATION_OPTIONS = ["Cross-Model Comparison", "Logical Reasoning", "External Reference Check", "No Validation Needed"];

  const models = [
    { id: 'gpt4',   name: 'GPT-4o',     icon: <Bot className="w-4 h-4" />,          color: '#4f46e5' },
    { id: 'gemini', name: 'Gemini 1.5', icon: <BrainCircuit className="w-4 h-4" />,  color: '#0ea5e9' },
    { id: 'claude', name: 'Claude 3.5', icon: <Sparkles className="w-4 h-4" />,      color: '#f97316' },
  ];

  const [showWalkthrough, setShowWalkthrough] = useState(false);

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
    setModelLatencies({});
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
        setModelLatencies(data.latencies || {});
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
          latencies: modelLatencies,
          hallucinationTags,
          validation: validationMethod,
          observation,
          analysisResults,
        }),
      });
      if (res.ok) {
        alert("Session saved! (src/data/db.json)");
        setQuestion(''); setModelResponses({}); setModelLatencies({}); setAnalysisResults({});
        setValidationMethod('Cross-Model Comparison'); setObservation('');
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
        <button onClick={() => setShowWalkthrough(true)} className="nav-link" style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}>
          <Info style={{ width: 16, height: 16 }} /> Walkthrough
        </button>
        <div style={{ flexGrow: 1 }} />
        <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', paddingLeft: '8px' }}>JSON Storage</p>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', paddingLeft: '8px', marginTop: 2 }}>v1.2.0 Active</p>
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
                const latency = modelLatencies[m.id];
                
                // Determine if this is the fastest model
                const isFastest = latency && latency === Math.min(...Object.values(modelLatencies));

                return (
                  <div key={m.id} className="glass-card" style={{
                    padding: '20px', borderTop: `3px solid ${m.color}`,
                    display: 'flex', flexDirection: 'column',
                    position: 'relative',
                  }}>
                    {/* Card Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                        <span style={{ color: m.color }}>{m.icon}</span> {m.name}
                      </h3>
                      {latency && (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {latency}ms
                        </span>
                      )}
                    </div>

                    {isFastest && (
                      <div style={{
                        position: 'absolute', top: '-10px', right: '10px',
                        background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                        color: '#000', fontSize: '10px', fontWeight: 800,
                        padding: '2px 8px', borderRadius: '4px',
                        boxShadow: '0 2px 8px rgba(245,158,11,0.3)',
                        textTransform: 'uppercase', letterSpacing: '0.05em'
                      }}>
                        Fastest
                      </div>
                    )}

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
                                Hallucination Tags
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
                                  {analysisSource === 'gemini' ? 'AI Suggestion' : 'Heuristic'}
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
                                {/* Tags Selection */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                                  {TAG_OPTIONS.map(tag => {
                                    const isSelected = detectedTags.includes(tag);
                                    return (
                                      <button
                                        key={tag}
                                        onClick={() => {
                                          const newTags = isSelected 
                                            ? detectedTags.filter(t => t !== tag)
                                            : [...detectedTags, tag];
                                          setAnalysisResults(prev => ({
                                            ...prev,
                                            [m.id]: { ...prev[m.id], tags: newTags }
                                          }));
                                        }}
                                        className={`tag-chip ${isSelected ? 'selected' : ''}`}
                                        style={{ border: 'none', outline: 'none' }}
                                      >
                                        {isSelected && '✓ '} {tag}
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Reasoning */}
                                {reasoning && (
                                  <div style={{ position: 'relative' }}>
                                    <p style={{
                                      fontSize: '11px', color: 'var(--text-muted)',
                                      lineHeight: 1.6, fontStyle: 'italic',
                                      background: 'rgba(255,255,255,0.03)',
                                      padding: '10px 12px', borderRadius: '8px',
                                      border: '1px solid var(--border-subtle)',
                                    }}>
                                      <span style={{ fontWeight: 700, color: 'var(--text-secondary)', marginRight: '4px' }}>Analysis:</span>
                                      {reasoning}
                                    </p>
                                  </div>
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

      {/* WALKTHROUGH MODAL */}
      {showWalkthrough && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', zIndex: 1000,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div className="glass-card" style={{
            width: '100%', maxWidth: '800px', maxHeight: '85vh', overflow: 'hidden',
            display: 'flex', flexDirection: 'column', border: '1px solid var(--accent-indigo)'
          }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Platform Walkthrough</h2>
              <button onClick={() => setShowWalkthrough(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Close</button>
            </div>
            <div style={{ padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <WalkthroughStep 
                  icon={<Search style={{ color: '#818cf8' }} />} 
                  title="1. Ask a Question" 
                  desc="Enter any prompt and select the models you want to compare. TruthLens will fetch responses from GPT-4o, Gemini, and Claude."
                />
                <WalkthroughStep 
                  icon={<AlertTriangle style={{ color: '#fbbf24' }} />} 
                  title="2. AI Detection" 
                  desc="Our AI automatically scans each response for hallucinations: fabricated facts, contradictions, or unsupported claims."
                />
                <WalkthroughStep 
                  icon={<CheckCircle style={{ color: '#10b981' }} />} 
                  title="3. Manual Validation" 
                  desc="Refine the AI's detection by manually adding or removing tags based on your own verification."
                />
                <WalkthroughStep 
                  icon={<ShieldAlert style={{ color: '#ef4444' }} />} 
                  title="4. Save & Analyze" 
                  desc="Save your session to build a history of model performance. View long-term reliability scores in the Dashboard."
                />
              </div>
              
              <div style={{ background: 'rgba(79,70,229,0.1)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(79,70,229,0.3)' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px', color: '#818cf8' }}>Project Methodology</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Built for AI validation, TruthLens combines N-model consensus with logical reasoning to identify uncertainty. 
                  It connects directly to <strong>Ethics, Bias & Explainability</strong> (Lecture 23) by providing clear, 
                  explainable reasons for every flagged error.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .tag-chip {
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border-subtle);
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s;
        }
        .tag-chip:hover {
          border-color: var(--accent-indigo);
          color: var(--text-primary);
        }
        .tag-chip.selected {
          background: rgba(239, 68, 68, 0.12);
          border-color: rgba(239, 68, 68, 0.35);
          color: #fca5a5;
        }
      `}</style>
    </div>
  );
}

function WalkthroughStep({ icon, title, desc }) {
  return (
    <div style={{ display: 'flex', gap: '16px' }}>
      <div style={{ 
        width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        border: '1px solid var(--border-subtle)'
      }}>
        {icon}
      </div>
      <div>
        <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>{title}</h4>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</p>
      </div>
    </div>
  );
}
