
import React, { useState, useEffect } from 'react';
import { SavedWord, QuizQuestion, Language } from '../types';
import { generateQuizForWord } from '../services/geminiService';
import { BrainCircuit, CheckCircle, XCircle, X, Loader2 } from 'lucide-react';

interface Props {
  words: SavedWord[];
  onResult: (wordId: string, success: boolean) => void;
  lang: Language;
}

const QuizPopup: React.FC<Props> = ({ words, onResult, lang }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [targetWordId, setTargetWordId] = useState<string | null>(null);

  // Random timer logic: Trigger every ~2-5 minutes if words exist
  useEffect(() => {
    if (words.length < 3) return; // Need a few words to quiz

    const scheduleNextQuiz = () => {
      // Random interval between 60s and 180s (1-3 mins) for demo purposes
      // In prod, might be longer.
      const delay = Math.random() * (180000 - 60000) + 60000;
      return setTimeout(() => {
        triggerQuiz();
      }, delay);
    };

    const timer = scheduleNextQuiz();
    return () => clearTimeout(timer);
  }, [words, isVisible]); // Re-schedule when visibility closes

  const triggerQuiz = async () => {
    if (isVisible) return;
    
    // Pick a random word that hasn't been reviewed much
    const randomWord = words[Math.floor(Math.random() * words.length)];
    setTargetWordId(randomWord.id);
    setLoading(true);
    setIsVisible(true);
    
    try {
      const q = await generateQuizForWord(randomWord.word);
      setQuestion(q);
    } catch (e) {
      console.error("Failed to gen quiz", e);
      setIsVisible(false);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionClick = (index: number) => {
    if (selectedOption !== null || !question || !targetWordId) return;
    
    setSelectedOption(index);
    const isCorrect = index === question.correctOptionIndex;
    
    // Wait a moment so user sees the result color, then close/callback
    setTimeout(() => {
      onResult(targetWordId, isCorrect);
      setTimeout(() => {
        handleClose();
      }, 1500);
    }, 500);
  };

  const handleClose = () => {
    setIsVisible(false);
    setQuestion(null);
    setSelectedOption(null);
    setTargetWordId(null);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 right-4 w-80 bg-white rounded-2xl shadow-2xl border border-indigo-100 z-40 overflow-hidden animate-in slide-in-from-right duration-500">
      <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-3 flex justify-between items-center text-white">
        <div className="flex items-center gap-2 font-bold text-sm">
          <BrainCircuit size={18} />
          {lang === 'zh' ? "快速小测" : "Quick Quiz"}
        </div>
        <button onClick={handleClose} className="hover:bg-white/20 rounded p-1">
          <X size={16} />
        </button>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-6 text-slate-400">
            <Loader2 className="animate-spin mb-2" />
            <span className="text-xs">{lang === 'zh' ? "生成题目中..." : "Generating question..."}</span>
          </div>
        ) : question ? (
          <div className="space-y-4">
            <p className="text-slate-700 font-medium text-sm leading-relaxed">
              {question.question}
            </p>
            <div className="space-y-2">
              {question.options.map((opt, idx) => {
                let btnClass = "w-full text-left px-3 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors";
                
                if (selectedOption !== null) {
                  if (idx === question.correctOptionIndex) {
                    btnClass = "w-full text-left px-3 py-2 text-sm rounded-lg border border-green-500 bg-green-50 text-green-700 font-medium";
                  } else if (idx === selectedOption) {
                    btnClass = "w-full text-left px-3 py-2 text-sm rounded-lg border border-red-500 bg-red-50 text-red-700";
                  } else {
                    btnClass = "w-full text-left px-3 py-2 text-sm rounded-lg border border-slate-100 text-slate-300";
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleOptionClick(idx)}
                    disabled={selectedOption !== null}
                    className={btnClass}
                  >
                    <div className="flex justify-between items-center">
                      {opt}
                      {selectedOption !== null && idx === question.correctOptionIndex && <CheckCircle size={14} />}
                      {selectedOption !== null && idx === selectedOption && idx !== question.correctOptionIndex && <XCircle size={14} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-red-400 text-sm">Error loading quiz.</p>
        )}
      </div>
    </div>
  );
};

export default QuizPopup;
