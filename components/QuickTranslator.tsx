
import React, { useState } from 'react';
import { Search, Loader2, Check, Link2, ExternalLink } from 'lucide-react';
import { defineWord } from '../services/geminiService';
import { SavedWord, Language, AISettings } from '../types';

interface Props {
  onSaveWord: (word: SavedWord) => void;
  lang: Language;
  settings: AISettings;
  savedWords: SavedWord[];
  onJumpToNotebook: () => void;
}

const QuickTranslator: React.FC<Props> = ({ onSaveWord, lang, settings, savedWords, onJumpToNotebook }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SavedWord | null>(null);

  const handleTranslate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Check if word exists in savedWords first
    const existing = savedWords.find(w => w.word.toLowerCase() === query.trim().toLowerCase());
    
    if (existing) {
        setResult(existing);
        setLoading(false);
        return;
    }

    setLoading(true);
    setResult(null);
    try {
      const def = await defineWord(query.trim(), undefined, settings);
      const newWord: SavedWord = {
        ...def,
        id: Date.now().toString(),
        dateLearned: Date.now(),
        reviewCount: 0
      };
      setResult(newWord);
      onSaveWord(newWord); // Auto-save
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const isPreExisting = result && savedWords.some(w => w.id !== result.id && w.word.toLowerCase() === result.word.toLowerCase());

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${isOpen ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:text-slate-800'}`}
        title={lang === 'zh' ? "快速查词" : "Quick Translate"}
      >
        <Search size={20} />
        <span className="hidden md:inline font-medium text-sm">{lang === 'zh' ? "查词" : "Translate"}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-100 p-4 z-50 animate-in fade-in slide-in-from-top-2">
          <form onSubmit={handleTranslate} className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={lang === 'zh' ? "输入单词..." : "Enter word..."}
              className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
            <button 
              type="submit" 
              disabled={loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            </button>
          </form>

          {result && (
            <div className="mt-4 animate-in fade-in">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-lg text-slate-800">{result.word}</h4>
                  <p className="text-xs text-slate-500">/{result.phonetic}/ • {result.partOfSpeech}</p>
                </div>
                {isPreExisting ? (
                    <button onClick={onJumpToNotebook} className="flex items-center text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full hover:bg-indigo-100">
                        <Link2 size={12} className="mr-1" /> Notebook
                    </button>
                ) : (
                    <span className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        <Check size={12} className="mr-1" /> {lang === 'zh' ? "已保存" : "Saved"}
                    </span>
                )}
              </div>
              <p className="mt-2 text-indigo-700 font-medium">{result.chineseMeaning}</p>
              <p className="text-xs text-slate-500 italic mt-1">{result.exampleSentence}</p>
              
               {(result.synonyms?.length || result.relatedWords?.length) && (
                  <div className="mt-3 pt-2 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                      <Link2 size={10} /> {lang === 'zh' ? "关联推荐" : "Suggestions"}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {result.synonyms?.slice(0, 3).map(w => (
                        <span key={w} className="text-xs bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded border border-orange-100">{w}</span>
                      ))}
                      {result.relatedWords?.slice(0, 3).map(w => (
                        <span key={w} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">{w}</span>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuickTranslator;
