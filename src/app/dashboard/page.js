"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Home, BarChart3, AlertTriangle, CheckCircle } from 'lucide-react';

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

  // Compute Analytics
  const totalQueries = history.length;
  
  let gpt4Hallucinations = 0;
  let geminiHallucinations = 0;
  let totalTags = 0;

  history.forEach(session => {
    const tags = session.hallucinationTags || {};
    // Add up the length of the tag array for each model
    if (tags.gpt4) {
        gpt4Hallucinations += tags.gpt4.length;
        totalTags += tags.gpt4.length;
    }
    if (tags.gemini) {
        geminiHallucinations += tags.gemini.length;
        totalTags += tags.gemini.length;
    }
  });

  return (
    <main className="min-h-screen p-8 bg-gray-50 text-gray-900 font-sans pb-24">
      <div className="max-w-5xl mx-auto flex flex-col gap-8">
        
        {/* HEADER */}
        <header className="flex items-center justify-between py-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-indigo-700 flex items-center gap-3">
              <BarChart3 className="w-8 h-8"/> Analytics Dashboard
            </h1>
            <p className="text-gray-600 mt-2">Track AI model reliability over time.</p>
          </div>
          
          <Link href="/" className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-colors shadow-sm">
            <Home className="w-5 h-5"/>
            Back to Playground
          </Link>
        </header>

        {loading ? (
          <div className="text-center py-20 text-gray-500 font-medium animate-pulse">
            Loading Dashboard Data...
          </div>
        ) : (
          <>
            {/* STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <CheckCircle className="w-10 h-10 text-green-500 mb-3"/>
                <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Total Sessions</p>
                <h3 className="text-4xl font-extrabold text-gray-900 mt-1">{totalQueries}</h3>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center border-t-4 border-t-indigo-500">
                <Bot className="w-10 h-10 text-indigo-500 mb-3"/>
                <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">GPT-4o Errors</p>
                <h3 className="text-4xl font-extrabold text-gray-900 mt-1">{gpt4Hallucinations}</h3>
                <p className="text-xs text-gray-400 mt-2">Total flagged hallucinations</p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center border-t-4 border-t-indigo-500">
                <BrainCircuit className="w-10 h-10 text-indigo-500 mb-3"/>
                <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Gemini Errors</p>
                <h3 className="text-4xl font-extrabold text-gray-900 mt-1">{geminiHallucinations}</h3>
                <p className="text-xs text-gray-400 mt-2">Total flagged hallucinations</p>
              </div>

            </div>

            {/* ERROR LOG TABLE */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-4">
              <div className="p-6 border-b border-gray-100 bg-gray-50">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-gray-500" /> Recent Validations
                </h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-sm uppercase">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Question</th>
                      <th className="px-6 py-4 font-semibold">Validation Method</th>
                      <th className="px-6 py-4 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {history.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="px-6 py-8 text-center text-gray-400 font-medium">
                          No sessions recorded yet! Go ask a question in the Playground.
                        </td>
                      </tr>
                    ) : (
                      history.slice().reverse().map(session => (
                        <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-gray-900 font-medium">
                            {session.question}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-block bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-200">
                              {session.validation}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500 text-sm">
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
  );
}

// Small icon components to avoid having to pass props inside the page component 
function Bot(props) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>;
}
function BrainCircuit(props) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M9 13a4.5 4.5 0 0 0 3-4"/><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/><path d="M3.477 10.896a4 4 0 0 1 .585-.396"/><path d="M6 18a4 4 0 0 1-1.968-3.036"/><path d="M12 18a4 4 0 0 0 4.243-2.925 4 4 0 0 0 4.243-2.925A4 4 0 1 0 12 5Z"/><path d="M12 5a4.5 4.5 0 0 0-3 4"/><path d="M17.997 5.125A3 3 0 0 1 17.599 6.5"/><path d="M20.523 10.896a4 4 0 0 0-.585-.396"/><path d="M18 18a4 4 0 0 0 1.968-3.036"/></svg>;
}
