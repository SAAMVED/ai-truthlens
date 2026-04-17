"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, AlertTriangle, CheckCircle, Search, TrendingUp, Zap } from 'lucide-react';

export default function Dashboard() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const totalQueries = history.length;
  let gpt4Hallucinations = 0;
  let geminiHallucinations = 0;
  let totalTags = 0;

  history.forEach(session => {
    const t = session.hallucinationTags || {};
    if (t.gpt4)   { gpt4Hallucinations += t.gpt4.length;   totalTags += t.gpt4.length; }
    if (t.gemini) { geminiHallucinations += t.gemini.length; totalTags += t.gemini.length; }
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* SIDEBAR */}
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
            fontSize: '18px', fontWeight: 800, letterSpacing: '-0.3px',
            background: 'linear-gradient(135deg, #818cf8, #a78bfa)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>AI TruthLens</h1>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Hallucination Detector</p>
        </div>

        <Link href="/" className="nav-link">
          <Search style={{ width: 16, height: 16 }} /> Playground
        </Link>
        <Link href="/dashboard" className="nav-link active">
          <BarChart3 style={{ width: 16, height: 16 }} /> Dashboard
        </Link>

        <div style={{ flexGrow: 1 }} />
        <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', paddingLeft: '8px' }}>JSON Storage</p>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', paddingLeft: '8px', marginTop: 2 }}>Raw Data</p>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, padding: '40px 40px 80px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>

          {/* HEADER */}
          <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <BarChart3 style={{ width: 28, height: 28, color: '#818cf8' }} /> Analytics Dashboard
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Track AI model reliability over time.</p>
            </div>
            <Link href="/" style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 18px', borderRadius: '12px', fontWeight: 600, fontSize: '14px',
              background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
              color: '#818cf8', textDecoration: 'none', transition: 'all 0.2s',
            }}>
              <Search style={{ width: 16, height: 16 }} /> Back to Playground
            </Link>
          </header>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }} className="animate-pulse-glow">
              Loading Dashboard Data…
            </div>
          ) : (
            <>
              {/* STAT CARDS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <StatCard
                  icon={<CheckCircle style={{ width: 28, height: 28, color: '#10b981' }} />}
                  label="Total Sessions"
                  value={totalQueries}
                  color="#10b981"
                />
                <StatCard
                  icon={<Zap style={{ width: 28, height: 28, color: '#4f46e5' }} />}
                  label="GPT-4o Errors"
                  value={gpt4Hallucinations}
                  sub="Total flagged hallucinations"
                  color="#4f46e5"
                />
                <StatCard
                  icon={<TrendingUp style={{ width: 28, height: 28, color: '#8b5cf6' }} />}
                  label="Gemini Errors"
                  value={geminiHallucinations}
                  sub="Total flagged hallucinations"
                  color="#8b5cf6"
                />
              </div>

              {/* HISTORY TABLE */}
              <div className="glass-card" style={{ overflow: 'hidden' }}>
                <div style={{
                  padding: '18px 24px',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  <AlertTriangle style={{ width: 17, height: 17, color: 'var(--text-muted)' }} />
                  <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Recent Validations
                  </h2>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                        {['Question', 'Validation Method', 'Date'].map(h => (
                          <th key={h} style={{
                            padding: '12px 24px', textAlign: 'left',
                            fontWeight: 700, textTransform: 'uppercase',
                            fontSize: '11px', letterSpacing: '0.08em',
                            color: 'var(--text-muted)',
                            borderBottom: '1px solid var(--border-subtle)',
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {history.length === 0 ? (
                        <tr>
                          <td colSpan={3} style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No sessions recorded yet! Go ask a question in the Playground.
                          </td>
                        </tr>
                      ) : (
                        history.slice().reverse().map(session => (
                          <tr key={session.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.06)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <td style={{ padding: '14px 24px', color: 'var(--text-primary)', fontWeight: 500 }}>
                              {session.question}
                            </td>
                            <td style={{ padding: '14px 24px' }}>
                              <span style={{
                                display: 'inline-block',
                                background: 'rgba(79,70,229,0.15)',
                                color: '#818cf8',
                                border: '1px solid rgba(99,102,241,0.3)',
                                padding: '3px 12px', borderRadius: '999px',
                                fontSize: '12px', fontWeight: 700,
                              }}>
                                {session.validation}
                              </span>
                            </td>
                            <td style={{ padding: '14px 24px', color: 'var(--text-muted)' }}>
                              {new Date(session.timestamp).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="glass-card" style={{
      padding: '24px',
      borderTop: `3px solid ${color}`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px',
    }}>
      {icon}
      <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
        {label}
      </p>
      <h3 style={{ fontSize: '40px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</h3>
      {sub && <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  );
}
