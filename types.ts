
export interface Article {
  id: string;
  title: string;
  content: string;
  source?: string;
  dateAdded: number;
  type: 'text' | 'image' | 'web';
}

export interface WordDefinition {
  word: string;
  phonetic: string;
  chineseMeaning: string;
  englishDefinition: string;
  exampleSentence: string;
  partOfSpeech: string;
  level: string; // e.g., A1, B2, C1
  synonyms?: string[];
  antonyms?: string[];
  relatedWords?: string[]; 
}

export interface SavedWord extends WordDefinition {
  id: string;
  dateLearned: number;
  reviewCount: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}

export interface UserStats {
  estimatedLevel: string; // A1 - C2
  wordsLearned: number;
  articlesRead: number;
}

export type ViewState = 'dashboard' | 'reader' | 'importer' | 'tutor' | 'notebook' | 'exam' | 'settings';

export type Language = 'zh' | 'en';

export interface QuizQuestion {
  id: string;
  type: 'fill-blank' | 'phonetic-match' | 'translation-en-zh' | 'translation-zh-en';
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
}

export interface ExamResult {
  id: string;
  date: number;
  score: number;
  totalQuestions: number;
  mistakes: { question: string; correctAns: string }[];
  type: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface AISettings {
  provider: 'gemini' | 'custom'; // 'custom' for DeepSeek, OpenAI, etc.
  baseUrl?: string; // e.g., https://api.deepseek.com
  customApiKey?: string;
  modelName: string;
  temperature: number;
  tutorPersona: string;
}
