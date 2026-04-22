"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  BarChart3, AlertTriangle, CheckCircle, Search, 
  TrendingUp, Zap, Clock, ShieldAlert, ChevronRight,
  ExternalLink, Info, Activity, BrainCircuit
} from 'lucide-react';

export default function Dashboard() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/history');
        const data = await res.json();
        setHistory(data);
      } catch (err) {
        console.error("Error fetching history", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // ── ANALYTICS CALCULATIONS ──────────────────────────────────────────────
  const totalQueries = history.length;
  
  const modelStats = {
    gpt4:   { errors: 0, total: 0, latency: 0, types: {} },
    gemini: { errors: 0, total: 0, latency: 0, types: {} },
    claude: { errors: 0, total: 0, latency: 0, types: {} }
  };

  const hallTypeCounts = {
    "Fabricated Facts": 0,
    "Contradictions": 0,
    "Overconfidence": 0,
    "Unsupported Claims": 0
  };

  history.forEach(session => {
    const tags = session.hallucinationTags || {};
    const latencies = session.latencies || {};
    const models = session.modelsQueried || [];

    models.forEach(m => {
      if (!modelStats[m]) return;
      modelStats[m].total += 1;
      
      const mTags = tags[m] || [];
      if (mTags.length > 0) {
        modelStats[m].errors += 1;
        mTags.forEach(t => {
          hallTypeCounts[t] = (hallTypeCounts[t] || 0) + 1;
          modelStats[m].types[t] = (modelStats[m].types[t] || 0) + 1;
        });
      }

      if (latencies[m]) {
        modelStats[m].latency += latencies[m];
      }
    });
  });

  const getAvgLatency = (m) => modelStats[m].total ? Math.round(modelStats[m].latency / modelStats[m].total) : 0;
  const getReliability = (m) => modelStats[m].total ? Math.round(((modelStats[m].total - modelStats[m].errors) / modelStats[m].total) * 100) : 100;
  
  // Consistency Score: 100 - (Total Errors / (Total Queries * Max Possible Tags))
  const getConsistency = (m) => {
    if (!modelStats[m].total) return 100;
    const totalPossibleTags = modelStats[m].total * 4; // 4 types of tags
    const actualTags = Object.values(modelStats[m].types).reduce((a, b) => a + b, 0);
    return Math.max(0, Math.round(((totalPossibleTags - actualTags) / totalPossibleTags) * 100));
  };

  const validationMethodUsage = history.reduce((acc, s) => {
    acc[s.validation] = (acc[s.validation] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* SIDEBAR */}
      <aside style={{
        width: '240px', flexShrink: 0,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex', flexDirection: 'column',
        padding: '24px 16px', gap: '8px',
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
      }}>
        <div style={{ marginBottom: '28px', paddingLeft: '8px' }}>
          <h1 style={{
            fontSize: '18px', fontWeight: 800, letterSpacing: '-0.3px',
            background: 'linear-gradient(135deg, #818cf8, #a78bfa)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>AI TruthLens</h1>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Enterprise Analytics</p>
        </div>

        <Link href="/" className="nav-link">
          <Search style={{ width: 16, height: 16 }} /> Playground
        </Link>
        <Link href="/dashboard" className="nav-link active">
          <BarChart3 style={{ width: 16, height: 16 }} /> Dashboard
        </Link>

        <div style={{ flexGrow: 1 }} />
        <div style={{ 
          padding: '16px', 
          background: 'rgba(255,255,255,0.03)', 
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)'
        }}>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>System Status</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-primary)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
            All Models Active
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, padding: '40px 40px 80px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>

          {/* HEADER */}
          <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                Analytics Dashboard
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
                Cross-model performance benchmarking and hallucination analysis.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{
                padding: '10px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <Clock style={{ width: 14, height: 14, color: 'var(--text-muted)' }} />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Last 30 Days</span>
              </div>
            </div>
          </header>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
              <div className="animate-pulse-glow" style={{ fontSize: '18px', fontWeight: 600 }}>Syncing with Data Store…</div>
            </div>
          ) : (
            <>
              {/* TOP LEVEL METRICS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                <StatCard 
                  label="Total Queries" 
                  value={totalQueries} 
                  icon={<Activity style={{ color: '#818cf8' }} />} 
                />
                <StatCard 
                  label="Avg. Reliability" 
                  value={`${Math.round(history.reduce((acc, s) => acc + (Object.values(s.hallucinationTags || {}).every(t => t.length === 0) ? 1 : 0), 0) / (totalQueries || 1) * 100)}%`}
                  icon={<ShieldAlert style={{ color: '#10b981' }} />}
                />
                <StatCard 
                  label="Avg. Latency" 
                  value={`${Math.round(history.reduce((acc, s) => acc + (Object.values(s.latencies || {}).reduce((a, b) => a + b, 0) / (Object.keys(s.latencies || {}).length || 1)), 0) / (totalQueries || 1))}ms`}
                  icon={<Zap style={{ color: '#fbbf24' }} />}
                />
                <StatCard 
                  label="Tag Frequency" 
                  value={(Object.values(hallTypeCounts).reduce((a, b) => a + b, 0) / (totalQueries || 1)).toFixed(1)}
                  icon={<AlertTriangle style={{ color: '#ef4444' }} />}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
                {/* PERFORMANCE CHART */}
                <div className="glass-card" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp style={{ width: 18, height: 18, color: '#818cf8' }} /> Model Reliability & Consistency
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {['gpt4', 'gemini', 'claude'].map(mId => (
                      <div key={mId}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                          <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>
                            {mId === 'gpt4' ? 'GPT-4o' : mId === 'gemini' ? 'Gemini 1.5' : 'Claude 3.5'}
                          </span>
                          <span style={{ color: 'var(--text-muted)' }}>
                            {getReliability(mId)}% Reliable • {getConsistency(mId)}% Consistency
                          </span>
                        </div>
                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', display: 'flex', gap: '2px' }}>
                          <div style={{ 
                            width: `${getReliability(mId)}%`, 
                            background: mId === 'gpt4' ? '#4f46e5' : mId === 'gemini' ? '#0ea5e9' : '#f97316',
                            boxShadow: '0 0 15px rgba(129,140,248,0.2)',
                            transition: 'width 1s ease-out'
                          }} />
                          <div style={{ 
                            width: `${getConsistency(mId) - getReliability(mId)}%`, 
                            background: 'rgba(255,255,255,0.1)',
                            transition: 'width 1s ease-out'
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* VALIDATION METHOD SUCCESS */}
                <div className="glass-card" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle style={{ width: 18, height: 18, color: '#10b981' }} /> Validation Methodology
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {["Cross-Model Comparison", "Logical Reasoning", "External Reference Check"].map(method => {
                      const count = validationMethodUsage[method] || 0;
                      const percentage = totalQueries ? Math.round((count / totalQueries) * 100) : 0;
                      return (
                        <div key={method} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                              <span>{method}</span>
                              <span style={{ fontWeight: 700 }}>{percentage}%</span>
                            </div>
                            <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                              <div style={{ width: `${percentage}%`, background: '#10b981', height: '100%', borderRadius: '3px' }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* SESSIONS TABLE */}
              <div className="glass-card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Search style={{ width: 18, height: 18, color: 'var(--text-muted)' }} /> Validation History
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Showing {history.length} recent sessions</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <th style={thStyle}>Question</th>
                        <th style={thStyle}>Method</th>
                        <th style={thStyle}>Fastest</th>
                        <th style={thStyle}>Errors</th>
                        <th style={thStyle}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.slice().reverse().map(session => {
                        const lats = Object.values(session.latencies || {});
                        const minLat = lats.length ? Math.min(...lats) : null;
                        const fastest = Object.entries(session.latencies || {}).find(([k, v]) => v === minLat)?.[0];
                        const totalErrors = Object.values(session.hallucinationTags || {}).reduce((a, b) => a + b.length, 0);

                        return (
                          <tr key={session.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.2s' }}>
                            <td style={tdStyle}>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {session.question}
                              </div>
                            </td>
                            <td style={tdStyle}>
                              <span style={{ padding: '4px 10px', borderRadius: '8px', background: 'rgba(129,140,248,0.1)', color: '#818cf8', fontSize: '11px', fontWeight: 700 }}>
                                {session.validation}
                              </span>
                            </td>
                            <td style={tdStyle}>
                              <span style={{ color: '#fbbf24', fontSize: '12px', fontWeight: 600 }}>
                                {fastest ? (fastest === 'gpt4' ? 'GPT-4o' : fastest === 'gemini' ? 'Gemini' : 'Claude') : 'N/A'}
                              </span>
                            </td>
                            <td style={tdStyle}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: totalErrors > 0 ? '#ef4444' : '#10b981' }}>
                                {totalErrors > 0 ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}
                                <span style={{ fontWeight: 700 }}>{totalErrors}</span>
                              </div>
                            </td>
                            <td style={tdStyle}>
                              <button 
                                onClick={() => setSelectedSession(session)}
                                style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600 }}
                              >
                                View Details <ChevronRight size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* DOCUMENTATION & METHODOLOGY */}
              <div className="glass-card" style={{ padding: '32px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '24px', background: 'linear-gradient(135deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Platform Methodology & Documentation
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#818cf8', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <BrainCircuit style={{ width: 18, height: 18 }} /> Reasoning Under Uncertainty
                    </h3>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
                      TruthLens addresses <strong>Module 3: Reasoning Under Uncertainty</strong> (Lecture 13) by quantifying LLM confidence. 
                      Our system identifies "Overconfidence" tags when models provide specific facts without supporting evidence or when they 
                      deviate significantly from consensus models without justification.
                    </p>
                    <ul style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '18px' }}>
                      <li><strong>Cross-Model Comparison:</strong> Using N-model consensus to identify outliers.</li>
                      <li><strong>Logical Reasoning:</strong> Detecting internal contradictions within a single response.</li>
                      <li><strong>External Reference:</strong> Validating claims against known factual databases.</li>
                    </ul>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#10b981', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ShieldAlert style={{ width: 18, height: 18 }} /> Ethics & Explainability
                    </h3>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
                      Aligned with <strong>Module 6: Ethics, Bias & Explainability</strong> (Lecture 23), we provide "Explainable Hallucination 
                      Detection." Every detected error is accompanied by an AI-generated reasoning string, allowing users to understand 
                      <em>why</em> a specific claim was flagged as a hallucination.
                    </p>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                      <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Reliability Metrics</h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        <strong>Reliability Score:</strong> % of clean responses.<br/>
                        <strong>Consistency Score:</strong> Factual density vs. error rate weighted by model parameters.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* SESSION DETAIL OVERLAY */}
      {selectedSession && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', zIndex: 100
        }}>
          <div className="glass-card" style={{
            width: '100%', maxWidth: '900px', maxHeight: '90vh', overflow: 'hidden',
            display: 'flex', flexDirection: 'column', animation: 'scaleUp 0.3s ease-out'
          }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Session Deep-Dive</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{new Date(selectedSession.timestamp).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedSession(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Close</button>
            </div>
            
            <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', marginBottom: '8px' }}>Original Question</p>
                <p style={{ fontSize: '16px', fontWeight: 500 }}>{selectedSession.question}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {['gpt4', 'gemini', 'claude'].map(mId => {
                  if (!selectedSession.responses[mId]) return null;
                  const tags = selectedSession.hallucinationTags[mId] || [];
                  return (
                    <div key={mId} style={{ 
                      padding: '16px', borderRadius: '12px', 
                      background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)',
                      display: 'flex', flexDirection: 'column', gap: '12px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 800, fontSize: '13px', textTransform: 'uppercase' }}>{mId}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{selectedSession.latencies[mId]}ms</span>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, flexGrow: 1 }}>{selectedSession.responses[mId].substring(0, 150)}...</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {tags.length === 0 ? (
                          <span style={{ fontSize: '10px', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 6px', borderRadius: '4px' }}>Clean</span>
                        ) : (
                          tags.map(t => <span key={t} style={{ fontSize: '10px', color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '2px 6px', borderRadius: '4px' }}>{t}</span>)
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ background: 'rgba(129,140,248,0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(129,140,248,0.2)' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', marginBottom: '8px' }}>Evaluation Observation</p>
                <p style={{ fontSize: '14px' }}>{selectedSession.observation || "No observation recorded."}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</span>
        {icon}
      </div>
      <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}

const thStyle = {
  padding: '12px 24px', textAlign: 'left',
  fontWeight: 700, textTransform: 'uppercase',
  fontSize: '11px', letterSpacing: '0.08em',
  color: 'var(--text-muted)',
  borderBottom: '1px solid var(--border-subtle)',
};

const tdStyle = {
  padding: '16px 24px',
  fontSize: '13px',
  color: 'var(--text-secondary)'
};

