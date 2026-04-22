import { generateBasicQuestion } from './src/services/geminiService.js';

async function run() {
  try {
    const q = await generateBasicQuestion("Dev", "Easy", "React");
    console.log("Success:", q);
  } catch (err) {
    console.error("Gemini Error:", err);
  }
}
run();
