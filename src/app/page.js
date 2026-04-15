"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Bot, BrainCircuit, AlertTriangle, BarChart3 } from 'lucide-react';

export default function Home() {
  const [question, setQuestion] = useState('');
  const [selectedModels, setSelectedModels] = useState({
    gpt4: true,
    gemini: false,
    claude: false,
  });

  const [isAsking, setIsAsking] = useState(false);
  const [modelResponses, setModelResponses] = useState({});
  
  // State for tracking hallucination tags per model
  const [tags, setTags] = useState({});
  
  // State for final validation method
  const [validationMethod, setValidationMethod] = useState('');

  const TAG_OPTIONS = [
    "Fabricated Facts",
    "Contradictions",
    "Overconfidence",
    "Unsupported Claims"
  ];

  const VALIDATION_OPTIONS = [
    "Cross-Model Comparison",
    "Logical Reasoning",
    "External Reference Check",
    "No Validation Needed"
  ];

  const models = [
    { id: 'gpt4', name: 'GPT-4o', icon: <Bot className="w-5 h-5" /> },
    { id: 'gemini', name: 'Gemini 1.5 Pro', icon: <BrainCircuit className="w-5 h-5" /> },
  ];

  const handleModelToggle = (modelId) => {
    setSelectedModels((prev) => ({
      ...prev,
      [modelId]: !prev[modelId],
    }));
  };

  // Toggle function for hallucination tags
  const toggleTag = (modelId, tag) => {
    setTags((prev) => {
      const modelTags = prev[modelId] || [];
      if (modelTags.includes(tag)) {
         return { ...prev, [modelId]: modelTags.filter(t => t !== tag) };
      }
      return { ...prev, [modelId]: [...modelTags, tag] };
    });
  };

  const handleAsk = async () => {
    if (!question.trim()) return;
    
    const selectedList = Object.keys(selectedModels).filter(key => selectedModels[key]);
    if (selectedList.length === 0) {
      alert("Please select at least one AI model.");
      return;
    }

    setIsAsking(true);
    setModelResponses({}); // clear previous
    setTags({}); // clear previous tags
    setValidationMethod(''); // clear previous validation

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          models: selectedList
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        setModelResponses(data.responses);
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
    try {
      const dataToSave = {
        question,
        modelsQueried: Object.keys(selectedModels).filter(k => selectedModels[k]),
        responses: modelResponses,
        hallucinationTags: tags,
        validation: validationMethod
      };
      
      const res = await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
      });
      
      if(res.ok) {
        alert("Session correctly saved to your JSON file! (Check src/data/db.json)");
        // Reset the UI 
        setQuestion('');
        setModelResponses({});
        setTags({});
        setValidationMethod('');
      } else {
         alert("Failed to save session.");
      }
    } catch(err) {
      alert("Error saving data");
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50 text-gray-900 font-sans pb-24">
      <div className="max-w-5xl mx-auto flex flex-col gap-8">
        {/* HEADER */}
        <header className="flex flex-col sm:flex-row items-center justify-between py-6 border-b border-gray-200 gap-4 mb-2">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-indigo-700">AI TruthLens</h1>
            <p className="text-lg text-gray-600 mt-2">
              Hallucination Detection & Validation Playground
            </p>
          </div>
          <Link href="/dashboard" className="bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-colors">
            <BarChart3 className="w-5 h-5"/>
            View Dashboard
          </Link>
        </header>

        {/* INPUT SECTION */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-4">1. Ask a Question</h2>
          
          <div className="flex gap-4">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., What are the health benefits of drinking green tea?"
              className="flex-1 p-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
            />
            <button 
              onClick={handleAsk}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-semibold flex items-center gap-2 transition-colors"
            >
              <Search className="w-5 h-5" />
              Ask AI
            </button>
          </div>

          {/* MODEL SELECTION */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Select Models to Compare
            </h3>
            <div className="flex gap-4">
              {models.map((m) => (
                <label 
                  key={m.id} 
                  className={`flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedModels[m.id] ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={selectedModels[m.id]}
                    onChange={() => handleModelToggle(m.id)}
                  />
                  <div className={`mb-2 ${selectedModels[m.id] ? 'text-indigo-600' : 'text-gray-400'}`}>
                    {m.icon}
                  </div>
                  <span className={`font-semibold ${selectedModels[m.id] ? 'text-indigo-900' : 'text-gray-600'}`}>
                    {m.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* SIDE-BY-SIDE DISPLAY */}
        {(isAsking || Object.keys(modelResponses).length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            
            {/* Display GPT-4 Response Box */}
            {selectedModels.gpt4 && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
                <h3 className="font-bold flex items-center gap-2 mb-4 text-gray-700 border-b pb-2">
                  <Bot className="w-5 h-5" /> GPT-4o Response
                </h3>
                {isAsking ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap flex-grow mb-4">
                      {modelResponses.gpt4 || "No response received."}
                    </p>
                    {/* HALUCINATION TAGGING UI */}
                    {modelResponses.gpt4 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Flag Hallucinations
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {TAG_OPTIONS.map(tag => {
                            const isSelected = (tags.gpt4 || []).includes(tag);
                            return (
                              <button
                                key={tag}
                                onClick={() => toggleTag('gpt4', tag)}
                                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                                  isSelected 
                                    ? 'bg-red-100 border-red-300 text-red-700 font-semibold' 
                                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {tag}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Display Gemini Response Box */}
            {selectedModels.gemini && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
                <h3 className="font-bold flex items-center gap-2 mb-4 text-gray-700 border-b pb-2">
                  <BrainCircuit className="w-5 h-5" /> Gemini 1.5 Pro Response
                </h3>
                {isAsking ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap flex-grow mb-4">
                      {modelResponses.gemini || "No response received."}
                    </p>
                    {/* HALUCINATION TAGGING UI */}
                    {modelResponses.gemini && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Flag Hallucinations
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {TAG_OPTIONS.map(tag => {
                            const isSelected = (tags.gemini || []).includes(tag);
                            return (
                              <button
                                key={tag}
                                onClick={() => toggleTag('gemini', tag)}
                                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                                  isSelected 
                                    ? 'bg-red-100 border-red-300 text-red-700 font-semibold' 
                                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {tag}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* VALIDATION & SAVE PANEL */}
        {Object.keys(modelResponses).length > 0 && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-bold mb-4">2. Validation Method</h2>
              <p className="text-gray-500 mb-4">How did you verify the truth of these AI outputs?</p>
              <div className="flex flex-wrap gap-4">
                {VALIDATION_OPTIONS.map(method => (
                  <label key={method} className="flex items-center gap-2 cursor-pointer bg-gray-50 px-4 py-3 rounded-lg border hover:bg-indigo-50 hover:border-indigo-200 transition-colors">
                    <input 
                      type="radio" 
                      name="validation" 
                      value={method} 
                      checked={validationMethod === method}
                      onChange={(e) => setValidationMethod(e.target.value)}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-gray-800 font-medium">{method}</span>
                  </label>
                ))}
              </div>
            </div>

            <button 
              onClick={handleSaveSession}
              disabled={!validationMethod}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-bold transition-colors w-full sm:w-auto self-start"
            >
              Save Results to Dashboard
            </button>
          </div>
        )}

      </div>
    </main>
  );
}
