
import React, { useState } from 'react';
import { Article, Language } from '../types';
import { searchArticles, extractTextFromImage, processImportedText } from '../services/geminiService';
import { Search, Image as ImageIcon, FileText, Loader2, Upload, FileUp } from 'lucide-react';

interface Props {
  onImport: (article: Article) => void;
  lang: Language;
}

const Importer: React.FC<Props> = ({ onImport, lang }) => {
  const [activeTab, setActiveTab] = useState<'search' | 'text' | 'upload'>('search');
  const [isLoading, setIsLoading] = useState(false);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  
  // Text State
  const [manualTitle, setManualTitle] = useState('');
  const [manualContent, setManualContent] = useState('');

  // Upload State
  const [dragActive, setDragActive] = useState(false);

  const t = {
    searchTab: lang === 'zh' ? "AI 搜索" : "AI Search",
    textTab: lang === 'zh' ? "手动输入" : "Manual Input",
    uploadTab: lang === 'zh' ? "文件上传" : "File Upload",
    processing: lang === 'zh' ? "Gemini 正在处理中..." : "Processing with Gemini AI...",
    searchTitle: lang === 'zh' ? "发现新内容" : "Discover New Content",
    searchDesc: lang === 'zh' ? "输入话题，AI 为您寻找文章。" : "Enter a topic and AI will find an article for you.",
    searchPlaceholder: lang === 'zh' ? "例如：科技趋势，健康饮食，太空旅行" : "e.g., Technology trends, Healthy cooking, Space travel",
    searchBtn: lang === 'zh' ? "搜索" : "Search",
    textTitlePlaceholder: lang === 'zh' ? "文章标题" : "Article Title",
    textContentPlaceholder: lang === 'zh' ? "在此粘贴英文文本..." : "Paste your English text here...",
    startReading: lang === 'zh' ? "开始阅读" : "Start Reading",
    dragTitle: lang === 'zh' ? "拖放文件" : "Drag & Drop File",
    dragDesc: lang === 'zh' ? "支持图片, Word (.docx), Excel (.xlsx), 文本 (.txt)" : "Supports Images, Word (.docx), Excel (.xlsx), Text (.txt)",
    selectFile: lang === 'zh' ? "选择文件" : "Select File"
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    try {
      const articles = await searchArticles(searchQuery);
      if (articles.length > 0) {
        onImport(articles[0]);
      } else {
        alert(lang === 'zh' ? "未找到文章，请更换关键词。" : "No articles found. Try a different keyword.");
      }
    } catch (err) {
      alert(lang === 'zh' ? "获取文章失败。" : "Error fetching articles.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle || !manualContent) return;
    
    onImport({
      id: Date.now().toString(),
      title: manualTitle,
      content: manualContent,
      source: 'User Input',
      dateAdded: Date.now(),
      type: 'text'
    });
  };

  const processFile = async (file: File) => {
    setIsLoading(true);
    try {
      // 1. Image Handling
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
          const base64data = reader.result as string;
          const base64Content = base64data.split(',')[1];
          
          const text = await extractTextFromImage(base64Content, file.type);
          
          onImport({
            id: Date.now().toString(),
            title: `Scan: ${file.name}`,
            content: text,
            source: 'Image Scan',
            dateAdded: Date.now(),
            type: 'image'
          });
        };
        return;
      }

      // 2. Document Handling
      let rawText = "";

      if (file.name.endsWith('.txt')) {
        rawText = await file.text();
      } 
      else if (file.name.endsWith('.docx')) {
        // Use Mammoth from CDN
        if ((window as any).mammoth) {
          const arrayBuffer = await file.arrayBuffer();
          const result = await (window as any).mammoth.extractRawText({ arrayBuffer: arrayBuffer });
          rawText = result.value;
        } else {
          throw new Error("Mammoth library not loaded");
        }
      }
      else if (file.name.endsWith('.xlsx')) {
        // Use SheetJS from CDN
        if ((window as any).XLSX) {
          const arrayBuffer = await file.arrayBuffer();
          const workbook = (window as any).XLSX.read(arrayBuffer, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          // Convert sheet to text (tab separated)
          rawText = (window as any).XLSX.utils.sheet_to_txt(worksheet);
        } else {
          throw new Error("XLSX library not loaded");
        }
      } else {
        alert(lang === 'zh' ? "不支持的文件格式。" : "Unsupported file format.");
        setIsLoading(false);
        return;
      }

      // Process extracted text with Gemini to make it an article
      const processed = await processImportedText(rawText, file.name);

      onImport({
        id: Date.now().toString(),
        title: processed.title,
        content: processed.content,
        source: 'File Import',
        dateAdded: Date.now(),
        type: 'text'
      });

    } catch (err) {
      console.error(err);
      alert(lang === 'zh' ? "文件处理失败。" : "Failed to process file.");
    } finally {
      // Small delay to ensure state updates if reader was quick
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="flex border-b border-slate-100">
        <button 
          onClick={() => setActiveTab('search')}
          className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'search' ? 'text-indigo-600 bg-indigo-50 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Search size={18} /> {t.searchTab}
        </button>
        <button 
          onClick={() => setActiveTab('text')}
          className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'text' ? 'text-indigo-600 bg-indigo-50 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <FileText size={18} /> {t.textTab}
        </button>
        <button 
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'upload' ? 'text-indigo-600 bg-indigo-50 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <FileUp size={18} /> {t.uploadTab}
        </button>
      </div>

      <div className="p-6 min-h-[300px] flex flex-col justify-center">
        {isLoading ? (
          <div className="flex flex-col items-center text-indigo-600">
            <Loader2 className="animate-spin mb-4" size={32} />
            <p>{t.processing}</p>
          </div>
        ) : (
          <>
            {activeTab === 'search' && (
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-slate-800">{t.searchTitle}</h3>
                  <p className="text-slate-500">{t.searchDesc}</p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="flex-1 p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button type="submit" className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors">
                    {t.searchBtn}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'text' && (
              <form onSubmit={handleManualSubmit} className="space-y-4 w-full">
                <input
                  type="text"
                  placeholder={t.textTitlePlaceholder}
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <textarea
                  placeholder={t.textContentPlaceholder}
                  value={manualContent}
                  onChange={(e) => setManualContent(e.target.value)}
                  className="w-full h-48 p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
                <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 transition-colors">
                  {t.startReading}
                </button>
              </form>
            )}

            {activeTab === 'upload' && (
              <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400'}`}
                onDragEnter={() => setDragActive(true)}
                onDragLeave={() => setDragActive(false)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="bg-indigo-100 p-4 rounded-full text-indigo-600">
                    <Upload size={24} />
                  </div>
                  <h3 className="text-lg font-medium text-slate-700">{t.dragTitle}</h3>
                  <p className="text-slate-400 text-sm">{t.dragDesc}</p>
                  <input 
                    type="file" 
                    accept="image/*, .txt, .docx, .xlsx"
                    className="hidden" 
                    id="file-upload"
                    onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                  />
                  <label 
                    htmlFor="file-upload"
                    className="mt-4 px-6 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    {t.selectFile}
                  </label>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Importer;