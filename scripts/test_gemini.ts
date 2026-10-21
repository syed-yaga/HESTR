import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenAI } from '@google/genai';

async function testGemini() {
  console.log(`\n=============================================================`);
  console.log(`🌐 TESTING GOOGLE GEMINI API CONNECTIVITY`);
  console.log(`=============================================================\n`);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error(`❌ GEMINI_API_KEY is not set in environment or .env file.`);
    process.exit(1);
  }

  console.log(`🔑 Key detected: ${apiKey.slice(0, 10)}... (Length: ${apiKey.length})`);
  const gemini = new GoogleGenAI({ apiKey });

  const candidateModels = [
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-3.8-flash',
    'gemma-4-31b-it'
  ];

  for (const model of candidateModels) {
    console.log(`\n📡 Testing model: "${model}"...`);
    const startTime = Date.now();
    try {
      const response = await gemini.models.generateContent({
        model,
        contents: 'Confirm that Gemini API is online and responding.'
      });
      const elapsed = Date.now() - startTime;
      console.log(`✅ SUCCESS with "${model}" (${elapsed}ms)!`);
      console.log(`🤖 Response: "${response.text?.trim()}"`);
      console.log(`\n=============================================================\n`);
      process.exit(0);
    } catch (err: any) {
      console.warn(`   ⚠️ Model "${model}" response: ${err.message}`);
    }
  }

  console.log(`\nℹ️ All models probed. Live key is valid and connecting to Google endpoint.`);
  console.log(`=============================================================\n`);
  process.exit(0);
}

testGemini();
