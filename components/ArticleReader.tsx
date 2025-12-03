
import React, { useState, useEffect, useRef } from 'react';
import { Article, WordDefinition, SavedWord, Language, AISettings } from '../types';
import { defineWord } from '../services/geminiService';
import { Loader2, Volume2, BookOpen, ChevronLeft, Link2, Check, ExternalLink } from 'lucide-react';

interface Props {
  article: Article;
  onBack: () => void;
  onSaveWord: (word: SavedWord) => void;
  lang: Language;
  settings: AISettings;
  savedWords: SavedWord[];
  onJumpToNotebook: () => void;
}

const ArticleReader: React.FC<Props> = ({ article, onBack, onSaveWord, lang, settings, savedWords, onJumpToNotebook }) => {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [definition, setDefinition] = useState<WordDefinition | null>(null);
  const [loading, setLoading] = useState(false);
  const [popupPosition, setPopupPosition] = useState<{ x: number, y: number } | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Handle text selection
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.toString().trim().length === 0) {
      return;
    }

    const text = selection.toString().trim();
    if (text.split(' ').length > 3) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    setPopupPosition({
      x: Math.min(window.innerWidth - 320, Math.max(10, rect.left)),
      y: rect.bottom + window.scrollY + 10
    });
    
    setSelectedWord(text);
    setDefinition(null);
    fetchDefinition(text, selection.anchorNode?.textContent || "");
  };

  const fetchDefinition = async (word: string, context: string) => {
    setLoading(true);
    try {
      // Check if word exists in savedWords first to avoid API call if desired, 
      // but here we might want fresh context-aware definition.
      // We will check match after fetch to show badge.
      const def = await defineWord(word, context, settings);
      setDefinition(def);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (definition) {
      onSaveWord({
        ...definition,
        id: Date.now().toString(),
        dateLearned: Date.now(),
        reviewCount: 0
      });
      setSelectedWord(null);
      setDefinition(null);
      setPopupPosition(null);
      window.getSelection()?.removeAllRanges();
    }
  };

  const handleClosePopup = () => {
    setSelectedWord(null);
    setDefinition(null);
    setPopupPosition(null);
    window.getSelection()?.removeAllRanges();
  };

  const isSaved = definition && savedWords.some(w => w.word.toLowerCase() === definition.word.toLowerCase());

  return (
    <div className="relative max-w-4xl mx-auto p-4 md:p-8 pb-32">
      <button 
        onClick={onBack}
        className="mb-6 flex items-center text-slate-500 hover:text-indigo-600 transition-colors"
      >
        <ChevronLeft size={20} /> {lang === 'zh' ? "返回库" : "Back to Library"}
      </button>

      <div className="prose prose-lg max-w-none">
        <h1 className="text-3xl font-serif font-bold text-slate-800 mb-4">{article.title}</h1>
        {article.source && (
          <p className="text-sm text-slate-400 mb-6 uppercase tracking-wider font-semibold">
            {lang === 'zh' ? "来源" : "Source"}: {article.source}
          </p>
        )}
        
        <div 
          ref={contentRef}
          onMouseUp={handleMouseUp}
          className="text-slate-700 leading-loose font-serif text-lg whitespace-pre-line"
        >
          {article.content}
        </div>
      </div>

      {/* Floating Definition Popup */}
      {selectedWord && popupPosition && (
        <div 
          className="absolute z-50 bg-white rounded-xl shadow-2xl border border-slate-100 w-80 overflow-hidden animate-in fade-in zoom-in duration-200"
          style={{ top: popupPosition.y, left: popupPosition.x }}
        >
          <div className="bg-indigo-600 px-4 py-3 flex justify-between items-center">
            <h3 className="text-white font-bold text-lg capitalize">{selectedWord}</h3>
            <button onClick={handleClosePopup} className="text-indigo-200 hover:text-white">&times;</button>
          </div>
          
          <div className="p-4 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="animate-spin text-indigo-500" />
              </div>
            ) : definition ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-mono">{definition.partOfSpeech}</span>
                  <span>/{definition.phonetic}/</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    definition.level.startsWith('A') ? 'bg-green-100 text-green-700' :
                    definition.level.startsWith('B') ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>{definition.level}</span>
                </div>
                
                {isSaved && (
                   <div 
                     onClick={onJumpToNotebook}
                     className="bg-green-50 border border-green-200 text-green-700 text-xs px-2 py-1.5 rounded flex items-center justify-between cursor-pointer hover:bg-green-100"
                   >
                     <span className="flex items-center gap-1"><Check size={12}/> {lang === 'zh' ? "已在单词本中" : "In Vocabulary"}</span>
                     <ExternalLink size={12} />
                   </div>
                )}

                <div>
                  <p className="text-xl font-bold text-slate-800">{definition.chineseMeaning}</p>
                  <p className="text-sm text-slate-500 italic mt-1">{definition.englishDefinition}</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600 border-l-4 border-indigo-300">
                  "{definition.exampleSentence}"
                </div>

                {/* Related Words Section */}
                {(definition.synonyms?.length || definition.relatedWords?.length) && (
                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                      <Link2 size={10} /> {lang === 'zh' ? "关联词" : "Related"}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {definition.synonyms?.slice(0, 2).map(w => (
                        <span key={w} className="text-xs bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">{w}</span>
                      ))}
                      {definition.relatedWords?.slice(0, 2).map(w => (
                        <span key={w} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{w}</span>
                      ))}
                    </div>
                  </div>
                )}

                {!isSaved ? (
                  <button 
                    onClick={handleSave}
                    className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <BookOpen size={16} /> {lang === 'zh' ? "加入生词本" : "Add to Vocabulary"}
                  </button>
                ) : (
                  <button 
                    className="w-full mt-2 bg-slate-100 text-slate-400 py-2 rounded-lg font-medium cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Check size={16} /> {lang === 'zh' ? "已保存" : "Saved"}
                  </button>
                )}
              </div>
            ) : (
              <p className="text-red-500 text-sm">{lang === 'zh' ? "未找到定义。" : "Could not find definition."}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleReader;
