
import React, { useState } from 'react';
import { AISettings, Language } from '../types';
import { Settings as SettingsIcon, Save, RotateCcw, Server, Key, Globe, Cpu } from 'lucide-react';

interface Props {
  settings: AISettings;
  onSave: (settings: AISettings) => void;
  lang: Language;
  onBack: () => void;
}

const Settings: React.FC<Props> = ({ settings, onSave, lang, onBack }) => {
  const [formData, setFormData] = useState<AISettings>({
    provider: settings.provider || 'gemini',
    baseUrl: settings.baseUrl || '',
    customApiKey: settings.customApiKey || '',
    modelName: settings.modelName,
    temperature: settings.temperature,
    tutorPersona: settings.tutorPersona
  });

  const t = {
    title: lang === 'zh' ? "AI 配置" : "AI Configuration",
    desc: lang === 'zh' ? "配置 AI 提供商。支持 Gemini 或任何兼容 OpenAI 格式的 API (如 DeepSeek)。" : "Configure AI Provider. Supports Gemini or any OpenAI-compatible API (like DeepSeek).",
    provider: lang === 'zh' ? "AI 提供商" : "AI Provider",
    baseUrl: lang === 'zh' ? "API 地址 (Base URL)" : "API Base URL",
    apiKey: lang === 'zh' ? "API 密钥" : "API Key",
    model: lang === 'zh' ? "模型名称" : "Model Name",
    temp: lang === 'zh' ? "创造力 (温度)" : "Creativity (Temperature)",
    persona: lang === 'zh' ? "AI 导师人格" : "AI Tutor Persona",
    save: lang === 'zh' ? "保存配置" : "Save Configuration",
    reset: lang === 'zh' ? "恢复默认" : "Reset to Default",
    back: lang === 'zh' ? "返回" : "Back"
  };

  const handleReset = () => {
    setFormData({
      provider: 'gemini',
      baseUrl: '',
      customApiKey: '',
      modelName: 'gemini-2.5-flash',
      temperature: 0.7,
      tutorPersona: 'You are a helpful, encouraging English Learning Tutor. Provide advice in a mix of English and Chinese.'
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow-sm border border-slate-100 animate-in fade-in pb-24">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-indigo-100 p-3 rounded-full">
          <SettingsIcon className="text-indigo-600" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t.title}</h2>
          <p className="text-slate-500 text-sm">{t.desc}</p>
        </div>
      </div>

      <div className="space-y-8">
        
        {/* Provider Selection */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <Server size={16} /> {t.provider}
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setFormData({...formData, provider: 'gemini', modelName: 'gemini-2.5-flash'})}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                formData.provider === 'gemini' 
                  ? 'border-indigo-600 bg-white shadow-md' 
                  : 'border-transparent bg-slate-200/50 hover:bg-slate-200'
              }`}
            >
              <div className="font-bold text-slate-800">Google Gemini</div>
              <div className="text-xs text-slate-500 mt-1">Uses default environment key & Google Search</div>
            </button>
            <button 
              onClick={() => setFormData({...formData, provider: 'custom', baseUrl: 'https://api.deepseek.com', modelName: 'deepseek-chat'})}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                formData.provider === 'custom' 
                  ? 'border-indigo-600 bg-white shadow-md' 
                  : 'border-transparent bg-slate-200/50 hover:bg-slate-200'
              }`}
            >
              <div className="font-bold text-slate-800">Custom (OpenAI Compatible)</div>
              <div className="text-xs text-slate-500 mt-1">DeepSeek, OpenAI, LocalLLM, etc.</div>
            </button>
          </div>
        </div>

        {/* Custom API Details */}
        {formData.provider === 'custom' && (
          <div className="bg-white border border-indigo-100 rounded-xl p-6 shadow-sm space-y-4 animate-in slide-in-from-top-4">
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                  <Globe size={16} /> {t.baseUrl}
                </label>
                <input 
                  type="text" 
                  value={formData.baseUrl}
                  onChange={(e) => setFormData({...formData, baseUrl: e.target.value})}
                  placeholder="https://api.deepseek.com"
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                />
                <p className="text-xs text-slate-400 mt-1">Base URL for chat completions (e.g. https://api.deepseek.com or https://api.openai.com/v1)</p>
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                  <Key size={16} /> {t.apiKey}
                </label>
                <input 
                  type="password" 
                  value={formData.customApiKey}
                  onChange={(e) => setFormData({...formData, customApiKey: e.target.value})}
                  placeholder="sk-..."
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                />
             </div>
          </div>
        )}

        {/* Common Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Cpu size={16} /> {t.model}
            </label>
            {formData.provider === 'gemini' ? (
              <select 
                value={formData.modelName}
                onChange={(e) => setFormData({...formData, modelName: e.target.value})}
                className="w-full p-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="gemini-3-pro-preview">Gemini 3.0 Pro</option>
              </select>
            ) : (
              <input 
                type="text" 
                value={formData.modelName}
                onChange={(e) => setFormData({...formData, modelName: e.target.value})}
                placeholder="e.g. deepseek-chat"
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t.temp}: {formData.temperature}
            </label>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.1"
              value={formData.temperature}
              onChange={(e) => setFormData({...formData, temperature: parseFloat(e.target.value)})}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 mt-4"
            />
          </div>
        </div>

        {/* Persona */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">{t.persona}</label>
          <textarea 
            value={formData.tutorPersona}
            onChange={(e) => setFormData({...formData, tutorPersona: e.target.value})}
            className="w-full h-32 p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            placeholder="Define how the AI should behave..."
          />
        </div>

        <div className="flex gap-4 pt-4 border-t border-slate-100">
          <button 
            onClick={onBack}
            className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium transition-colors"
          >
            {t.back}
          </button>
          <button 
            onClick={handleReset}
            className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium transition-colors flex items-center gap-2"
          >
            <RotateCcw size={18} /> {t.reset}
          </button>
          <button 
            onClick={() => onSave(formData)}
            className="flex-1 px-6 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
          >
            <Save size={18} /> {t.save}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
