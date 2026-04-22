import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { question, models } = await request.json();

    // In a real app, you'd record start time, call the LLM, then record end time.
    // For this demo/learning platform, we simulate this process.
    
    const responses = {};
    const latencies = {};

    // Simulate different "speeds" for different models
    const modelSpeeds = {
      gpt4: { min: 1200, max: 2500 },
      gemini: { min: 800, max: 1800 },
      claude: { min: 1000, max: 2000 }
    };

    await Promise.all(models.map(async (modelId) => {
      const speed = modelSpeeds[modelId] || { min: 1000, max: 2000 };
      const delay = Math.floor(Math.random() * (speed.max - speed.min + 1) + speed.min);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      latencies[modelId] = delay;

      if (modelId === 'gpt4') {
        responses.gpt4 = `This is a mock response from GPT-4o regarding: "${question}". It focuses on structured reasoning and factual delivery. The health benefits of green tea include improved brain function and fat loss.`;
      } else if (modelId === 'gemini') {
        responses.gemini = `This is a mock response from Gemini 1.5 Pro regarding: "${question}". It tends to be conversational and detailed. Yes, drinking green tea is great! It contains antioxidants called catechins which are good for your body.`;
      } else if (modelId === 'claude') {
        responses.claude = `This is a mock response from Claude 3.5 Sonnet regarding: "${question}". It balances conciseness with depth. Green tea is known for its high concentration of polyphenols, which may reduce inflammation and help fight cancer.`;
      }
    }));

    return NextResponse.json({ success: true, responses, latencies });
    
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch AI responses" }, { status: 500 });
  }
}
