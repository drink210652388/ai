
import React, { useState, useEffect } from 'react';
import { Article, SavedWord, UserStats, ViewState, Language, Note, ExamResult, AISettings } from './types';
import Importer from './components/Importer';
import ArticleReader from './components/ArticleReader';
import TutorChat from './components/TutorChat';
import QuickTranslator from './components/QuickTranslator';
import QuizPopup from './components/QuizPopup';
import Notebook from './components/Notebook';
import ExamMode from './components/ExamMode';
import Settings from './components/Settings';
import GlobalTranslator from './components/GlobalTranslator';
import { assessLevel } from './services/geminiService';
import { Book, LayoutDashboard, Sparkles, MessageCircle, BarChart3, Trash2, Globe, PenTool, GraduationCap, Settings as SettingsIcon } from 'lucide-react';

// Main App Component
const App: React.FC = () => {
  // State
  const [view, setView] = useState<ViewState>('dashboard');
  const [articles, setArticles] = useState<Article[]>([]);
  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({
    estimatedLevel: 'Assessing...',
    wordsLearned: 0,
    articlesRead: 0,
  });
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isGlobalTranslatorOpen, setIsGlobalTranslatorOpen] = useState(false);
  const [lang, setLang] = useState<Language>('zh');

  // AI Settings State
  const [aiSettings, setAiSettings] = useState<AISettings>({
    provider: 'gemini',
    modelName: 'gemini-2.5-flash',
    temperature: 0.7,
    tutorPersona: 'You are a helpful, encouraging English Learning Tutor. Provide advice in a mix of English and Chinese.'
  });

  // Load from local storage (mock persistence)
  useEffect(() => {
    const storedArticles = localStorage.getItem('lf_articles');
    const storedWords = localStorage.getItem('lf_words');
    const storedLang = localStorage.getItem('lf_lang');
    const storedNotes = localStorage.getItem('lf_notes');
    const storedResults = localStorage.getItem('lf_exam_results');
    const storedSettings = localStorage.getItem('lf_ai_settings');

    if (storedArticles) setArticles(JSON.parse(storedArticles));
    if (storedWords) setSavedWords(JSON.parse(storedWords));
    if (storedLang) setLang(storedLang as Language);
    if (storedNotes) setNotes(JSON.parse(storedNotes));
    if (storedResults) setExamResults(JSON.parse(storedResults));
    if (storedSettings) setAiSettings(JSON.parse(storedSettings));
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('lf_articles', JSON.stringify(articles));
    localStorage.setItem('lf_words', JSON.stringify(savedWords));
    localStorage.setItem('lf_lang', lang);
    localStorage.setItem('lf_notes', JSON.stringify(notes));
    localStorage.setItem('lf_exam_results', JSON.stringify(examResults));
    localStorage.setItem('lf_ai_settings', JSON.stringify(aiSettings));
    
    // Update stats
    const updateLevel = async () => {
      if (savedWords.length > 0 && savedWords.length % 5 === 0) {
        // Re-assess level every 5 words
        const words = savedWords.map(w => w.word);
        const level = await assessLevel(words.slice(-20), aiSettings); 
        setUserStats(prev => ({ ...prev, estimatedLevel: level }));
      }
    };
    
    updateLevel();
    setUserStats(prev => ({
      ...prev,
      wordsLearned: savedWords.length,
      articlesRead: articles.length
    }));

  }, [articles, savedWords, lang, notes, examResults, aiSettings]);

  // Handlers
  const handleImport = (article: Article) => {
    setArticles(prev => [article, ...prev]);
    setCurrentArticle(article);
    setView('reader');
  };

  const handleSaveWord = (word: SavedWord) => {
    setSavedWords(prev => {
      // Avoid duplicates
      if (prev.find(w => w.word.toLowerCase() === word.word.toLowerCase())) return prev;
      return [word, ...prev];
    });
  };

  const handleQuizResult = (wordId: string, success: boolean) => {
    setSavedWords(prev => prev.map(w => {
      if (w.id === wordId) {
        return {
          ...w,
          reviewCount: success ? w.reviewCount + 1 : Math.max(0, w.reviewCount - 1)
        };
      }
      return w;
    }));
  };

  const handleAddNote = (note: Note) => {
    setNotes(prev => [note, ...prev]);
  };

  const handleDeleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const handleDeleteWord = (id: string) => {
    setSavedWords(prev => prev.filter(w => w.id !== id));
  };

  const handleExamFinish = (result: ExamResult) => {
    setExamResults(prev => [result, ...prev]);
  };

  const toggleLanguage = () => {
    setLang(prev => prev === 'zh' ? 'en' : 'zh');
  };

  const deleteArticle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setArticles(prev => prev.filter(a => a.id !== id));
  };

  const handleJumpToNotebook = () => {
     setView('notebook');
  };

  // Translation helpers
  const t = {
    dashboard: lang === 'zh' ? "仪表盘" : "Dashboard",
    level: lang === 'zh' ? "评估等级" : "Estimated Level",
    vocab: lang === 'zh' ? "词汇量" : "Vocabulary",
    read: lang === 'zh' ? "已读文章" : "Articles Read",
    start: lang === 'zh' ? "今日学习" : "Start Learning Today",
    startDesc: lang === 'zh' ? "上传文本，扫描图片，或让 AI 为您寻找文章。" : "Upload text, scan images, or let AI find articles for you.",
    addContent: lang === 'zh' ? "+ 添加内容" : "+ Add Content",
    library: lang === 'zh' ? "我的图书馆" : "Your Library",
    noArticles: lang === 'zh' ? "暂无文章。添加一些内容开始吧！" : "No articles yet. Add some content to get started!",
    recentWords: lang === 'zh' ? "最近生词" : "Recently Learned Words",
    more: lang === 'zh' ? "更多" : "more",
    assessing: lang === 'zh' ? "评估中..." : "Assessing...",
    notebook: lang === 'zh' ? "笔记本" : "Notebook",
    exam: lang === 'zh' ? "考试中心" : "Exam Center",
    settings: lang === 'zh' ? "设置" : "Settings",
    globalTranslate: lang === 'zh' ? "全局翻译" : "Global Translator"
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 font-bold text-xl text-indigo-600 cursor-pointer"
            onClick={() => setView('dashboard')}
          >
            <Sparkles className="fill-indigo-600" size={24} />
            LinguaFlow
          </div>
          
          <div className="flex items-center gap-3">
             <QuickTranslator 
                onSaveWord={handleSaveWord} 
                lang={lang} 
                settings={aiSettings} 
                savedWords={savedWords}
                onJumpToNotebook={handleJumpToNotebook}
             />
             
             <button 
                onClick={() => setIsGlobalTranslatorOpen(true)}
                className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors"
                title={t.globalTranslate}
             >
                <Globe size={20} />
             </button>
            
            <div className="h-6 w-px bg-slate-200 mx-1"></div>

            <button 
              onClick={() => setView('notebook')}
              className={`p-2 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium ${view === 'notebook' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
              title={t.notebook}
            >
              <PenTool size={18} />
              <span className="hidden md:inline">{t.notebook}</span>
            </button>

             <button 
              onClick={() => setView('exam')}
              className={`p-2 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium ${view === 'exam' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
              title={t.exam}
            >
              <GraduationCap size={18} />
              <span className="hidden md:inline">{t.exam}</span>
            </button>

            <button 
              onClick={() => setView('settings')}
              className={`p-2 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium ${view === 'settings' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
              title={t.settings}
            >
              <SettingsIcon size={18} />
            </button>

            <button 
              onClick={toggleLanguage}
              className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1 text-sm font-medium"
              title="Switch Language"
            >
              {lang === 'zh' ? 'EN' : '中'}
            </button>

            <button 
              onClick={() => setView('dashboard')}
              className={`p-2 rounded-lg transition-colors ${view === 'dashboard' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
              title={t.dashboard}
            >
              <LayoutDashboard size={20} />
            </button>
            <button 
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`p-2 rounded-lg transition-colors ${isChatOpen ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <MessageCircle size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {view === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                    <BarChart3 size={24} />
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm">{t.level}</p>
                    <p className="text-2xl font-bold">{userStats.estimatedLevel === 'Assessing...' ? t.assessing : userStats.estimatedLevel}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 p-3 rounded-full text-green-600">
                    <Book size={24} />
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm">{t.vocab}</p>
                    <p className="text-2xl font-bold">{userStats.wordsLearned}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-100 p-3 rounded-full text-purple-600">
                    <LayoutDashboard size={24} />
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm">{t.read}</p>
                    <p className="text-2xl font-bold">{userStats.articlesRead}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-8 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">{t.start}</h2>
                <p className="text-indigo-100">{t.startDesc}</p>
              </div>
              <button 
                onClick={() => setView('importer')}
                className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors shadow-md whitespace-nowrap"
              >
                {t.addContent}
              </button>
            </div>

            {/* Library */}
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-4">{t.library}</h2>
              {articles.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
                  <p className="text-slate-400">{t.noArticles}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {articles.map(article => (
                    <div 
                      key={article.id}
                      onClick={() => { setCurrentArticle(article); setView('reader'); }}
                      className="bg-white p-5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group relative"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg text-slate-800 mb-1 line-clamp-1">{article.title}</h3>
                          <p className="text-sm text-slate-500 line-clamp-2">{article.content}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-between items-center text-xs text-slate-400">
                        <span className="uppercase tracking-wider">{article.type}</span>
                        <span>{new Date(article.dateAdded).toLocaleDateString()}</span>
                      </div>
                      <button 
                        onClick={(e) => deleteArticle(article.id, e)}
                        className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Vocabulary List Preview */}
             {savedWords.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-slate-800">{t.recentWords}</h2>
                  <button onClick={() => setView('notebook')} className="text-indigo-600 text-sm font-medium hover:underline">{t.more}</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {savedWords.slice(0, 10).map(word => (
                    <div key={word.id} className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 text-sm flex items-center gap-2">
                      <span className="font-semibold text-indigo-700">{word.word}</span>
                      <span className="text-slate-400">|</span>
                      <span className="text-slate-600">{word.chineseMeaning}</span>
                      {word.reviewCount > 0 && (
                        <span className="ml-1 text-xs text-green-600 bg-green-100 px-1.5 rounded-md">+{word.reviewCount}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'importer' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button 
              onClick={() => setView('dashboard')}
              className="mb-4 text-slate-500 hover:text-indigo-600 transition-colors"
            >
              &larr; {t.dashboard}
            </button>
            <Importer onImport={handleImport} lang={lang} />
          </div>
        )}

        {view === 'reader' && currentArticle && (
          <div className="animate-in fade-in duration-500">
            <ArticleReader 
              article={currentArticle} 
              onBack={() => setView('dashboard')}
              onSaveWord={handleSaveWord}
              lang={lang}
              settings={aiSettings}
              savedWords={savedWords}
              onJumpToNotebook={handleJumpToNotebook}
            />
          </div>
        )}

        {view === 'notebook' && (
          <div className="animate-in fade-in duration-500">
             <Notebook 
               notes={notes} 
               words={savedWords} 
               results={examResults}
               lang={lang}
               onAddNote={handleAddNote}
               onDeleteNote={handleDeleteNote}
               onDeleteWord={handleDeleteWord}
             />
          </div>
        )}

        {view === 'exam' && (
          <div className="animate-in fade-in duration-500">
            <ExamMode 
              level={userStats.estimatedLevel} 
              knownWords={savedWords.map(w => w.word)} 
              lang={lang}
              onFinishExam={handleExamFinish}
              onBack={() => setView('dashboard')}
            />
          </div>
        )}

        {view === 'settings' && (
          <div className="animate-in fade-in duration-500">
            <Settings 
               settings={aiSettings}
               onSave={(s) => { setAiSettings(s); setView('dashboard'); }}
               lang={lang}
               onBack={() => setView('dashboard')}
            />
          </div>
        )}
      </main>

      {/* Floating AI Tutor */}
      <TutorChat 
        userStats={userStats} 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />

      {/* Global Translator Modal */}
      <GlobalTranslator 
        isOpen={isGlobalTranslatorOpen}
        onClose={() => setIsGlobalTranslatorOpen(false)}
        lang={lang}
        settings={aiSettings}
        onSaveWord={handleSaveWord}
        savedWords={savedWords}
      />

      {/* Occasional Quiz Popup */}
      <QuizPopup words={savedWords} onResult={handleQuizResult} lang={lang} />

    </div>
  );
};

export default App;
