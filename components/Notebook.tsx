
import React, { useState } from 'react';
import { Note, SavedWord, ExamResult, Language } from '../types';
import { Search, Plus, Tag, Trash2, Edit2, Book, History, StickyNote, X } from 'lucide-react';

interface Props {
  notes: Note[];
  words: SavedWord[];
  results: ExamResult[];
  lang: Language;
  onAddNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
  onDeleteWord: (id: string) => void;
}

// Helper to highlight saved words in text
const ContentHighlighter: React.FC<{ content: string, savedWords: SavedWord[] }> = ({ content, savedWords }) => {
  // Create a map for fast lookup O(1)
  const wordMap = new Map(savedWords.map(w => [w.word.toLowerCase(), w]));

  const parts = content.split(/(\s+|[.,!?;])/); // Split by whitespace and punctuation

  return (
    <span className="whitespace-pre-wrap">
      {parts.map((part, i) => {
        const clean = part.toLowerCase().replace(/[^a-z]/g, ''); // Simple normalization
        const match = wordMap.get(clean);
        
        if (match && clean.length > 1) { // Avoid highlighting single letters like 'a', 'I' unless strictly needed
          return (
            <span key={i} className="relative group cursor-help text-indigo-700 bg-indigo-50 font-medium px-0.5 rounded border-b border-indigo-200">
              {part}
              {/* Tooltip */}
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block w-48 bg-slate-800 text-white text-xs p-2 rounded shadow-lg z-10">
                 <strong className="block text-indigo-300">{match.word}</strong>
                 {match.chineseMeaning}
                 <div className="mt-1 opacity-70 italic text-[10px]">{match.phonetic}</div>
              </span>
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
};

const Notebook: React.FC<Props> = ({ notes, words, results, lang, onAddNote, onDeleteNote, onDeleteWord }) => {
  const [activeTab, setActiveTab] = useState<'notes' | 'words' | 'results'>('notes');
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteTags, setNewNoteTags] = useState('');

  const t = {
    notes: lang === 'zh' ? "笔记" : "Notes",
    words: lang === 'zh' ? "单词本" : "Vocabulary",
    results: lang === 'zh' ? "考试记录" : "Exam History",
    search: lang === 'zh' ? "搜索..." : "Search...",
    create: lang === 'zh' ? "新建笔记" : "New Note",
    noNotes: lang === 'zh' ? "暂无笔记" : "No notes yet",
    save: lang === 'zh' ? "保存" : "Save",
    cancel: lang === 'zh' ? "取消" : "Cancel",
    tagsPlaceholder: lang === 'zh' ? "标签 (用逗号分隔)" : "Tags (comma separated)",
  };

  const handleSaveNote = () => {
    if (!newNoteTitle.trim()) return;
    const note: Note = {
      id: Date.now().toString(),
      title: newNoteTitle,
      content: newNoteContent,
      tags: newNoteTags.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    onAddNote(note);
    setIsCreating(false);
    setNewNoteTitle('');
    setNewNoteContent('');
    setNewNoteTags('');
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) || 
    n.content.toLowerCase().includes(search.toLowerCase()) ||
    n.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredWords = words.filter(w => 
    w.word.toLowerCase().includes(search.toLowerCase()) || 
    w.chineseMeaning.includes(search)
  );

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-100px)] flex gap-6">
      {/* Sidebar / Tabs */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-2">
        <button 
          onClick={() => setActiveTab('notes')}
          className={`text-left px-4 py-3 rounded-xl font-medium flex items-center gap-3 transition-colors ${activeTab === 'notes' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <StickyNote size={18} /> {t.notes}
        </button>
        <button 
          onClick={() => setActiveTab('words')}
          className={`text-left px-4 py-3 rounded-xl font-medium flex items-center gap-3 transition-colors ${activeTab === 'words' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <Book size={18} /> {t.words} <span className="ml-auto text-xs opacity-70 bg-white/20 px-2 rounded-full">{words.length}</span>
        </button>
        <button 
          onClick={() => setActiveTab('results')}
          className={`text-left px-4 py-3 rounded-xl font-medium flex items-center gap-3 transition-colors ${activeTab === 'results' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <History size={18} /> {t.results}
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex gap-4 items-center bg-slate-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder={t.search} 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
          {activeTab === 'notes' && (
            <button 
              onClick={() => setIsCreating(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 font-medium text-sm shadow-sm"
            >
              <Plus size={16} /> {t.create}
            </button>
          )}
        </div>

        {/* Main List */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          
          {/* Notes View */}
          {activeTab === 'notes' && (
            <>
              {isCreating && (
                <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-indigo-100 animate-in slide-in-from-top-4">
                  <input 
                    className="w-full text-lg font-bold mb-2 outline-none placeholder:text-slate-300" 
                    placeholder="Title" 
                    value={newNoteTitle}
                    onChange={e => setNewNoteTitle(e.target.value)}
                  />
                  <textarea 
                    className="w-full h-32 resize-none outline-none text-slate-600 placeholder:text-slate-300 mb-2" 
                    placeholder="Write something... (Words from your vocabulary will be highlighted)"
                    value={newNoteContent}
                    onChange={e => setNewNoteContent(e.target.value)}
                  />
                  <div className="flex items-center gap-2 mb-4">
                    <Tag size={16} className="text-slate-400" />
                    <input 
                      className="flex-1 text-sm outline-none bg-transparent" 
                      placeholder={t.tagsPlaceholder}
                      value={newNoteTags}
                      onChange={e => setNewNoteTags(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setIsCreating(false)} className="px-3 py-1 text-slate-500 hover:bg-slate-100 rounded">{t.cancel}</button>
                    <button onClick={handleSaveNote} className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700">{t.save}</button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredNotes.map(note => (
                  <div key={note.id} className="bg-white p-5 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors group relative">
                    <h3 className="font-bold text-slate-800 mb-2">{note.title}</h3>
                    <div className="text-sm text-slate-500 line-clamp-3 mb-3">
                      <ContentHighlighter content={note.content} savedWords={words} />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {note.tags.map(tag => (
                        <span key={tag} className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">#{tag}</span>
                      ))}
                    </div>
                    <button 
                      onClick={() => onDeleteNote(note.id)}
                      className="absolute top-4 right-4 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                    <span className="absolute bottom-4 right-4 text-xs text-slate-300">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
              {filteredNotes.length === 0 && !isCreating && (
                <div className="text-center py-10 text-slate-400">{t.noNotes}</div>
              )}
            </>
          )}

          {/* Vocabulary View */}
          {activeTab === 'words' && (
            <div className="space-y-2">
              {filteredWords.map(word => (
                <div key={word.id} className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center group">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <h3 className="font-bold text-lg text-slate-800">{word.word}</h3>
                      <span className="text-slate-400 text-sm font-mono">/{word.phonetic}/</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${word.level.startsWith('A') ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{word.level}</span>
                    </div>
                    <p className="text-slate-600">{word.chineseMeaning}</p>
                    
                    {(word.relatedWords?.length || 0) > 0 && (
                      <div className="mt-1 text-xs text-slate-400">
                        Related: {word.relatedWords?.join(', ')}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <span className="block text-xs text-slate-400">Reviews</span>
                      <span className="font-bold text-indigo-600">{word.reviewCount}</span>
                    </div>
                    <button 
                      onClick={() => onDeleteWord(word.id)}
                      className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Results View */}
          {activeTab === 'results' && (
            <div className="space-y-4">
              {results.map(res => (
                <div key={res.id} className="bg-white p-5 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-slate-800">{res.type}</h3>
                    <span className="text-sm text-slate-400">{new Date(res.date).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-2xl font-bold text-indigo-600">{Math.round(res.score)}%</div>
                    <div className="text-sm text-slate-500">
                      {Math.round(res.score) >= 80 ? 'Excellent!' : 'Keep practicing.'}
                    </div>
                  </div>
                  {res.mistakes.length > 0 && (
                    <div className="bg-red-50 p-3 rounded-lg text-sm">
                      <p className="font-semibold text-red-800 mb-2">Mistakes Review:</p>
                      <ul className="space-y-2">
                        {res.mistakes.map((m, i) => (
                          <li key={i} className="text-red-700">
                            <span className="block opacity-70 text-xs">{m.question}</span>
                            <span className="font-medium">Correct: {m.correctAns}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
              {results.length === 0 && <div className="text-center py-10 text-slate-400">No exam history yet.</div>}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Notebook;
