import { NextResponse } from 'next/server';

const TAG_OPTIONS = [
  "Fabricated Facts",
  "Contradictions",
  "Overconfidence",
  "Unsupported Claims"
];

/**
 * POST /api/analyze
 * Body: { question: string, modelName: string, response: string }
 * Returns: { tags: string[], reasoning: string }
 *
 * Uses Gemini (via Google Generative AI) to detect hallucinations.
 * Falls back to a rule-based heuristic if no API key is set.
 */
export async function POST(request) {
  try {
    const { question, modelName, response } = await request.json();

    if (!response || !question) {
      return NextResponse.json({ tags: [], reasoning: 'No response to analyze.' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    // ── GEMINI AI ANALYSIS ──────────────────────────────────────────────────
    if (apiKey) {
      const prompt = `You are an expert AI hallucination detector. Analyze the following AI response and identify which hallucination types are present.

USER'S QUESTION: "${question}"

AI MODEL (${modelName}) RESPONSE:
"${response}"

HALLUCINATION TYPES TO CHECK:
1. Fabricated Facts – The AI invented specific facts, statistics, names, dates, or events that are not true.
2. Contradictions – The response contradicts itself internally or contradicts the user's question.
3. Overconfidence – The AI presents speculative, uncertain, or unverified information as if it were definitively true.
4. Unsupported Claims – The AI makes broad assertions without any evidence, source, or reasoning.

Return ONLY a valid JSON object in this exact format (no markdown, no explanation outside the JSON):
{
  "tags": ["Fabricated Facts", "Overconfidence"],
  "reasoning": "Brief 1-2 sentence explanation of why these tags were selected."
}

If no hallucinations are detected, return: { "tags": [], "reasoning": "No hallucinations detected." }
Only include tags from: ["Fabricated Facts", "Contradictions", "Overconfidence", "Unsupported Claims"]`;

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 300 },
          }),
        }
      );

      if (geminiRes.ok) {
        const geminiData = await geminiRes.json();
        const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

        // Strip markdown code fences if present
        const cleaned = rawText.replace(/```json|```/g, '').trim();

        try {
          const parsed = JSON.parse(cleaned);
          const validTags = (parsed.tags || []).filter(t => TAG_OPTIONS.includes(t));
          return NextResponse.json({
            tags: validTags,
            reasoning: parsed.reasoning || '',
            source: 'gemini',
          });
        } catch {
          // fall through to heuristic
        }
      }
    }

    // ── HEURISTIC FALLBACK (no API key) ────────────────────────────────────
    const lower = response.toLowerCase();
    const detectedTags = [];

    const confidentPhrases = [
      'definitely', 'certainly', 'always', 'never', 'proven', 'guaranteed',
      'absolutely', 'without a doubt', 'it is a fact', 'studies show',
      'research proves', 'scientists confirm',
    ];
    if (confidentPhrases.some(p => lower.includes(p))) {
      detectedTags.push('Overconfidence');
    }

    const vagueClaimPhrases = [
      'is great', 'is amazing', 'is the best', 'improves everything',
      'helps with', 'can cure', 'boosts', 'increases performance',
    ];
    if (vagueClaimPhrases.some(p => lower.includes(p))) {
      detectedTags.push('Unsupported Claims');
    }

    // Check for suspiciously specific numbers or statistics in a mock response
    const hasSpecificNumbers = /\d+(\.\d+)?%|\d+ (million|billion|thousand|studies|people)/i.test(response);
    if (hasSpecificNumbers) {
      detectedTags.push('Fabricated Facts');
    }

    const reasoning = detectedTags.length > 0
      ? `Heuristic analysis detected potential issues: ${detectedTags.join(', ')}. Add a GEMINI_API_KEY to .env.local for AI-powered analysis.`
      : 'No obvious hallucination patterns detected via heuristics. Add a GEMINI_API_KEY for deeper analysis.';

    return NextResponse.json({ tags: [...new Set(detectedTags)], reasoning, source: 'heuristic' });

  } catch (error) {
    console.error('Analyze API Error:', error);
    return NextResponse.json({ tags: [], reasoning: 'Analysis failed.' }, { status: 500 });
  }
}
