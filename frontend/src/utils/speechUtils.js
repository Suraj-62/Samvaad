// Helper to get browser's built-in voice
const getBrowserVoice = () => {
  const voices = window.speechSynthesis.getVoices();
  const indianFemale = voices.find(v => v.lang.includes('en-IN') && (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('google')));
  if (indianFemale) return indianFemale;
  const anyIndian = voices.find(v => v.lang.includes('en-IN'));
  if (anyIndian) return anyIndian;
  const anyFemale = voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('female'));
  return anyFemale || voices[0];
};

const fallbackSpeech = (text, onStart, onEnd) => {
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = getBrowserVoice();
  
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  }

  utterance.onstart = () => { if (onStart) onStart(); };
  utterance.onend = () => { if (onEnd) onEnd(); };
  utterance.onerror = () => { if (onEnd) onEnd(); };

  window.speechSynthesis.speak(utterance);
};

export const speakWithIndianAccent = (text, onStart, onEnd) => {
  cancelSpeech();
  fallbackSpeech(text, onStart, onEnd);
};

export const cancelSpeech = () => {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};
