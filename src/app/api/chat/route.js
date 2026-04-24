import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { question, models } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    const responses = {};
    const latencies = {};

    const modelSpeeds = {
      gpt4: { min: 1200, max: 2500 },
      gemini: { min: 800, max: 1800 },
      claude: { min: 1000, max: 2000 }
    };

    await Promise.all(models.map(async (modelId) => {
      const startTime = Date.now();
      
      if (modelId === 'gemini' && apiKey) {
        // Fetch real response from Gemini
        try {
          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: `Answer the following question: "${question}"` }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 500 },
              }),
            }
          );
          
          if (geminiRes.ok) {
            const geminiData = await geminiRes.json();
            responses.gemini = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
          } else {
            responses.gemini = `Error: Failed to fetch from Gemini API.`;
          }
        } catch (e) {
          responses.gemini = `Error: ${e.message}`;
        }
      } else {
        // Simulate delay for other models or if no API key
        const speed = modelSpeeds[modelId] || { min: 1000, max: 2000 };
        const delay = Math.floor(Math.random() * (speed.max - speed.min + 1) + speed.min);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        if (modelId === 'gpt4') {
          responses.gpt4 = `This is a mock response from GPT-4o regarding: "${question}". It focuses on structured reasoning and factual delivery. The health benefits of green tea include improved brain function and fat loss.`;
        } else if (modelId === 'gemini') {
          responses.gemini = `This is a mock response from Gemini 1.5 Pro regarding: "${question}". It tends to be conversational and detailed. Yes, drinking green tea is great! It contains antioxidants called catechins which are good for your body.`;
        } else if (modelId === 'claude') {
          responses.claude = `This is a mock response from Claude 3.5 Sonnet regarding: "${question}". It balances conciseness with depth. Green tea is known for its high concentration of polyphenols, which may reduce inflammation and help fight cancer.`;
        }
      }
      
      latencies[modelId] = Date.now() - startTime;
    }));

    return NextResponse.json({ success: true, responses, latencies });
    
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch AI responses" }, { status: 500 });
  }
}
