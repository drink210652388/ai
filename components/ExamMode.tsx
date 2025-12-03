
import React, { useState } from 'react';
import { Language, QuizQuestion, ExamResult } from '../types';
import { generateExam } from '../services/geminiService';
import { CheckCircle, XCircle, ChevronLeft, Loader2, Play, Award, RotateCcw, PenTool } from 'lucide-react';

interface Props {
  level: string;
  knownWords: string[];
  lang: Language;
  onFinishExam: (result: ExamResult) => void;
  onBack: () => void;
}

const ExamMode: React.FC<Props> = ({ level, knownWords, lang, onFinishExam, onBack }) => {
  const [stage, setStage] = useState<'intro' | 'loading' | 'active' | 'result'>('intro');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]); // stores index of selected option
  const [examReq, setExamReq] = useState('');
  
  const t = {
    title: lang === 'zh' ? "AI 考试中心" : "AI Exam Center",
    desc: lang === 'zh' ? "根据您的学习进度和当前等级生成个性化测验。" : "Generate personalized quizzes based on your progress and current level.",
    reqPlaceholder: lang === 'zh' ? "例如：侧重于商务英语，多考音标..." : "e.g., Focus on business English, more phonetics...",
    start: lang === 'zh' ? "开始测验" : "Start Quiz",
    loading: lang === 'zh' ? "AI 正在出题..." : "AI is creating your exam...",
    submit: lang === 'zh' ? "提交答案" : "Submit Answer",
    next: lang === 'zh' ? "下一题" : "Next Question",
    finish: lang === 'zh' ? "完成考试" : "Finish Exam",
    score: lang === 'zh' ? "您的得分" : "Your Score",
    review: lang === 'zh' ? "回顾" : "Review",
    back: lang === 'zh' ? "返回" : "Back",
  };

  const handleStart = async () => {
    setStage('loading');
    try {
      const qs = await generateExam(level, knownWords, examReq);
      setQuestions(qs);
      setAnswers(new Array(qs.length).fill(-1));
      setStage('active');
    } catch (e) {
      alert("Failed to generate exam. Please try again.");
      setStage('intro');
    }
  };

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
    } else {
      calculateResult();
    }
  };

  const calculateResult = () => {
    let score = 0;
    const mistakes: { question: string; correctAns: string }[] = [];

    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctOptionIndex) {
        score++;
      } else {
        mistakes.push({
          question: q.question,
          correctAns: q.options[q.correctOptionIndex]
        });
      }
    });

    const result: ExamResult = {
      id: Date.now().toString(),
      date: Date.now(),
      score: (score / questions.length) * 100,
      totalQuestions: questions.length,
      mistakes: mistakes,
      type: 'General AI Quiz'
    };

    onFinishExam(result);
    setStage('result');
  };

  if (stage === 'intro') {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-sm border border-slate-100 text-center animate-in fade-in">
        <button onClick={onBack} className="absolute top-6 left-6 text-slate-400 hover:text-slate-600"><ChevronLeft /></button>
        <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600">
          <Award size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">{t.title}</h2>
        <p className="text-slate-500 mb-8">{t.desc}</p>
        
        <div className="text-left max-w-md mx-auto mb-8">
          <label className="block text-sm font-medium text-slate-700 mb-2">{lang === 'zh' ? "特别要求 (可选)" : "Special Requirements (Optional)"}</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              className="flex-1 border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder={t.reqPlaceholder}
              value={examReq}
              onChange={(e) => setExamReq(e.target.value)}
            />
          </div>
        </div>

        <button 
          onClick={handleStart}
          className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2 mx-auto"
        >
          <Play size={20} /> {t.start}
        </button>
      </div>
    );
  }

  if (stage === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
        <p className="text-slate-500">{t.loading}</p>
      </div>
    );
  }

  if (stage === 'active') {
    const q = questions[currentQIndex];
    const isAnswered = answers[currentQIndex] !== -1;

    return (
      <div className="max-w-2xl mx-auto p-6 animate-in slide-in-from-right">
        <div className="mb-6 flex justify-between items-center text-sm text-slate-400">
          <span>Question {currentQIndex + 1} / {questions.length}</span>
          <span className="uppercase font-mono text-xs bg-slate-100 px-2 py-1 rounded">{q.type}</span>
        </div>

        <h3 className="text-xl font-medium text-slate-800 mb-8 leading-relaxed">
          {q.question}
        </h3>

        <div className="space-y-3 mb-8">
          {q.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                answers[currentQIndex] === idx 
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600' 
                  : 'border-slate-200 hover:border-indigo-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                   answers[currentQIndex] === idx ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
                }`}>
                  {answers[currentQIndex] === idx && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                {opt}
              </div>
            </button>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleNext}
            disabled={!isAnswered}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {currentQIndex === questions.length - 1 ? t.finish : t.next}
          </button>
        </div>
      </div>
    );
  }

  // Result view (simplified, detailed view can be in notebook)
  return (
    <div className="max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg text-center animate-in zoom-in-95">
      <Award size={48} className="mx-auto text-yellow-500 mb-4" />
      <h2 className="text-2xl font-bold text-slate-800 mb-2">{t.finish}!</h2>
      <p className="text-slate-500 mb-6">{lang === 'zh' ? "结果已保存至笔记本" : "Result saved to Notebook"}</p>
      
      <div className="bg-slate-50 p-6 rounded-xl mb-6">
        <p className="text-sm text-slate-500 uppercase tracking-wide mb-1">{t.score}</p>
        <p className="text-4xl font-bold text-indigo-600">{Math.round((questions.filter((q,i) => q.correctOptionIndex === answers[i]).length / questions.length) * 100)}%</p>
      </div>

      <div className="flex gap-3 justify-center">
        <button onClick={onBack} className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100">
          {t.back}
        </button>
        <button onClick={() => setStage('intro')} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2">
          <RotateCcw size={16} /> {lang === 'zh' ? "再测一次" : "Try Again"}
        </button>
      </div>
    </div>
  );
};

export default ExamMode;
