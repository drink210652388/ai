
import React, { useState } from 'react';
import { AISettings, Language, SavedWord } from '../types';
import { translateText, defineWord } from '../services/geminiService';
import { Loader2, ArrowRightLeft, BookOpen, X, Globe, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  settings: AISettings;
  onSaveWord: (word: SavedWord) => void;
  savedWords: SavedWord[];
}

const GlobalTranslator: React.FC<Props> = ({ isOpen, onClose, lang, settings, onSaveWord, savedWords }) => {
  const [inputText, setInputText] = useState('');
  const [translation, setTranslation] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  
  // Selection State
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [definition, setDefinition] = useState<SavedWord | null>(null);
  const [isDefining, setIsDefining] = useState(false);

  if (!isOpen) return null;

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    setIsTranslating(true);
    try {
      const res = await translateText(inputText, settings);
      setTranslation(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleWordClick = async (word: string) => {
    // Basic cleanup
    const cleanWord = word.replace(/[^\w\s]|_/g, "").trim();
    if (!cleanWord || cleanWord.length < 2) return;

    setSelectedWord(cleanWord);
    setIsDefining(true);
    setDefinition(null);

    // Check if already exists locally first
    const existing = savedWords.find(w => w.word.toLowerCase() === cleanWord.toLowerCase());
    if (existing) {
        setDefinition(existing);
        setIsDefining(false);
        return;
    }

    try {
      const def = await defineWord(cleanWord, inputText.substring(0, 100) + "...", settings);
      setDefinition({
        ...def,
        id: Date.now().toString(),
        dateLearned: Date.now(),
        reviewCount: 0
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsDefining(false);
    }
  };

  const handleSaveCurrent = () => {
    if (definition) {
      onSaveWord(definition);
    }
  };

  // Helper to split text into clickable spans
  const renderInteractiveText = (text: string) => {
    return text.split(/(\s+)/).map((part, i) => {
      if (part.trim().length === 0) return <span key={i}>{part}</span>;
      return (
        <span 
          key={i} 
          onClick={() => handleWordClick(part)}
          className="cursor-pointer hover:bg-indigo-100 hover:text-indigo-700 rounded px-0.5 transition-colors"
        >
          {part}
        </span>
      );
    });
  };

  const isAlreadySaved = definition && savedWords.some(w => w.word.toLowerCase() === definition.word.toLowerCase());

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2 font-bold">
            <Globe size={20} />
            {lang === 'zh' ? "全局翻译 & 查词" : "Global Translate & Analyze"}
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Left: Input & Interaction */}
          <div className="flex-1 flex flex-col border-r border-slate-200">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-500">ENGLISH (Input)</span>
              <button 
                onClick={handleTranslate}
                disabled={isTranslating || !inputText}
                className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isTranslating ? <Loader2 className="animate-spin" size={16} /> : <ArrowRightLeft size={16} />}
                {lang === 'zh' ? "翻译" : "Translate"}
              </button>
            </div>
            
            {translation ? (
               <div className="flex-1 p-6 overflow-y-auto font-serif text-lg leading-relaxed text-slate-700 whitespace-pre-wrap">
                 {renderInteractiveText(inputText)}
               </div>
            ) : (
                <textarea 
                className="flex-1 p-6 resize-none focus:outline-none text-lg text-slate-700 font-serif"
                placeholder="Paste English text here to translate and analyze..."
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                />
            )}
            
            {translation && (
                <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
                    <button onClick={() => setTranslation('')} className="text-sm text-indigo-600 hover:underline">
                        Edit Input
                    </button>
                </div>
            )}
          </div>

          {/* Right: Translation & Definition */}
          <div className="flex-1 flex flex-col bg-slate-50/50">
             <div className="p-4 border-b border-slate-100 bg-slate-50">
               <span className="text-sm font-semibold text-slate-500">CHINESE (Translation)</span>
             </div>
             
             <div className="flex-1 p-6 overflow-y-auto">
                {isTranslating ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <Loader2 className="animate-spin mb-2" size={32} />
                    <p>AI is translating...</p>
                  </div>
                ) : translation ? (
                  <div className="text-slate-800 leading-loose text-lg whitespace-pre-wrap">
                    {translation}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 italic">
                    Translation will appear here.
                  </div>
                )}
             </div>

             {/* Selected Word Card */}
             {selectedWord && (
               <div className="border-t border-slate-200 bg-white p-4 animate-in slide-in-from-bottom-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                 <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-slate-800 capitalize">{selectedWord}</h3>
                    <button onClick={() => setSelectedWord(null)} className="text-slate-400 hover:text-slate-600">
                        <X size={16} />
                    </button>
                 </div>
                 
                 {isDefining ? (
                    <div className="flex items-center gap-2 text-indigo-600 text-sm py-2">
                        <Loader2 className="animate-spin" size={16} /> Finding definition...
                    </div>
                 ) : definition ? (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span>/{definition.phonetic}/</span>
                            <span className="bg-slate-100 px-2 rounded">{definition.partOfSpeech}</span>
                            {isAlreadySaved && (
                                <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 rounded font-medium">
                                    <Check size={12} /> Saved
                                </span>
                            )}
                        </div>
                        <p className="font-medium text-slate-800">{definition.chineseMeaning}</p>
                        <p className="text-sm text-slate-500">{definition.englishDefinition}</p>
                        {!isAlreadySaved ? (
                            <button 
                                onClick={handleSaveCurrent}
                                className="w-full mt-2 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <BookOpen size={16} /> Add to Vocabulary
                            </button>
                        ) : (
                             <div className="w-full mt-2 bg-green-50 text-green-700 py-2 rounded-lg font-medium text-center border border-green-100">
                                 Already in Vocabulary
                             </div>
                        )}
                    </div>
                 ) : (
                    <p className="text-red-400 text-sm">Failed to define.</p>
                 )}
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalTranslator;
