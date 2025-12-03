
import { GoogleGenAI, Type } from "@google/genai";
import { Article, WordDefinition, QuizQuestion, AISettings } from "../types";

// Initialize Gemini Client (Default env key)
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const DEFAULT_MODEL = 'gemini-2.5-flash';

// Helper: Clean JSON string
const cleanJsonText = (text: string) => {
  if (!text) return "{}";
  let clean = text.trim();
  if (clean.startsWith('```json')) {
    clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (clean.startsWith('```')) {
    clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return clean;
};

/**
 * Universal AI Caller
 * Handles routing between Google SDK and Custom Fetch (DeepSeek/OpenAI)
 */
const callAI = async (
  prompt: string | { parts: any[] }, 
  settings: AISettings | undefined, 
  schema?: any,
  tools?: any[]
): Promise<string> => {
  const provider = settings?.provider || 'gemini';
  const model = settings?.modelName || DEFAULT_MODEL;
  const temp = settings?.temperature ?? 0.7;

  // --- GOOGLE GEMINI PROVIDER ---
  if (provider === 'gemini') {
    const config: any = {
      temperature: temp,
    };
    
    // Only add tools/json if provided
    if (tools) config.tools = tools;
    if (schema) {
      config.responseMimeType = "application/json";
      config.responseSchema = schema;
    }

    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: prompt as any,
        config: config
      });
      return response.text || "";
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  } 
  
  // --- CUSTOM PROVIDER (DeepSeek, OpenAI, etc.) ---
  else {
    if (!settings?.baseUrl || !settings?.customApiKey) {
      throw new Error("Missing Base URL or API Key for custom provider");
    }

    // Adapt contents to messages
    let messages = [];
    if (typeof prompt === 'string') {
      messages.push({ role: 'user', content: prompt });
    } else {
      // Handle simple text parts, ignore binary/images for custom provider for now (simplicity)
      const textPart = prompt.parts.find((p: any) => p.text);
      if (textPart) messages.push({ role: 'user', content: textPart.text });
      else messages.push({ role: 'user', content: "Content not supported for custom provider yet" });
    }

    // Append Schema instructions to system prompt if JSON is required
    // (Not all custom models support 'json_object' response_format, so we prompt textually)
    if (schema) {
      messages.push({ 
        role: 'system', 
        content: `You must respond with valid JSON strictly matching this schema structure: ${JSON.stringify(schema)}` 
      });
    }

    try {
      const endpoint = settings.baseUrl.endsWith('/') ? `${settings.baseUrl}chat/completions` : `${settings.baseUrl}/chat/completions`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.customApiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: temp,
          // stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Custom API Error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || "";
    } catch (error) {
      console.error("Custom API Error:", error);
      throw error;
    }
  }
};

/**
 * Searches articles.
 * Gemini: Uses Search Grounding.
 * Custom: Generates articles based on topic (hallucinated/creative writing).
 */
export const searchArticles = async (topic: string, settings?: AISettings): Promise<Article[]> => {
  const provider = settings?.provider || 'gemini';

  try {
    let rawText = "";
    let sourceLabel = "";

    if (provider === 'gemini') {
      // Use Google Search Tool
      rawText = await callAI(
        `Find 3 interesting, distinct, and educational short articles or news snippets suitable for an English learner about: "${topic}". 
        Format the output strictly as a JSON array where each object has a 'title' and a 'content' (at least 3 paragraphs).
        Return ONLY the raw JSON string.`,
        settings,
        undefined, // Schema not supported with googleSearch tool currently
        [{ googleSearch: {} }]
      );
      sourceLabel = "Google Search";
    } else {
      // Custom Provider: Generate content
      rawText = await callAI(
        `Write 3 interesting, distinct, and educational short articles suitable for an English learner about: "${topic}".
        Format the output strictly as a JSON array where each object has a 'title' and a 'content' (at least 3 paragraphs).
        Return ONLY the raw JSON string.`,
        settings
      );
      sourceLabel = "AI Generated";
    }
    
    const text = cleanJsonText(rawText);
    let rawArticles = [];
    try {
      rawArticles = JSON.parse(text);
    } catch (e) {
      console.warn("Failed to parse search results", text);
      return [];
    }

    if (!Array.isArray(rawArticles)) return [];

    return rawArticles.map((a: any, index: number) => ({
      id: Date.now().toString() + index,
      title: a.title,
      content: a.content,
      source: sourceLabel,
      dateAdded: Date.now(),
      type: 'web'
    }));
  } catch (error) {
    console.error("Search error:", error);
    throw new Error("Failed to fetch articles. Please check your AI settings.");
  }
};

/**
 * Extracts text from an image (OCR).
 */
export const extractTextFromImage = async (base64Image: string, mimeType: string, settings?: AISettings): Promise<string> => {
  const provider = settings?.provider || 'gemini';
  
  if (provider === 'custom') {
    // Basic Custom API implementation usually expects URL or specific base64 format in messages.
    // For simplicity in this demo, we'll return a placeholder or need a multimodal compatible endpoint.
    // Many "DeepSeek" chat endpoints are text-only.
    // We will attempt a standard GPT-4-Vision style payload if possible, or fail gracefully.
    return "OCR is currently optimized for Gemini Provider. Please switch to Gemini for image scanning.";
  }

  try {
    const response = await ai.models.generateContent({
      model: settings?.modelName || DEFAULT_MODEL,
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: mimeType } },
          { text: "Transcribe the English text from this image accurately. Preserve paragraph structure. Do not add any commentary." }
        ]
      }
    });
    return response.text || "";
  } catch (error) {
    console.error("OCR error:", error);
    throw new Error("Failed to extract text from image.");
  }
};

/**
 * Clean up and format raw text imported from files.
 */
export const processImportedText = async (rawText: string, fileName: string, settings?: AISettings): Promise<{title: string, content: string}> => {
  try {
    const prompt = `I have imported text from a file named "${fileName}". 
      The raw text is:
      """
      ${rawText.slice(0, 15000)} 
      """
      
      Please format this into a clean, readable English article. 
      1. Create a suitable Title.
      2. Clean up the Content (remove weird spacing). 
      3. Return strictly JSON: { "title": "...", "content": "..." }`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        content: { type: Type.STRING }
      },
      required: ["title", "content"]
    };

    const rawTextResponse = await callAI(prompt, settings, schema);
    const data = JSON.parse(cleanJsonText(rawTextResponse));
    
    return {
      title: data.title || fileName,
      content: data.content || rawText
    };
  } catch (error) {
    console.error("Text processing error:", error);
    return { title: fileName, content: rawText };
  }
};

/**
 * Defines a word in context.
 */
export const defineWord = async (word: string, contextSentence?: string, settings?: AISettings): Promise<WordDefinition> => {
  try {
    const contextPrompt = contextSentence 
      ? `based on this context: "${contextSentence}"` 
      : `based on common usage`;

    const prompt = `Define the word "${word}" ${contextPrompt}.
      The user is a Chinese native speaker. Return the result in JSON.
      Include phonetic (IPA), Chinese meaning, English definition, part of speech, CEFR level, example sentence.
      Also include 'synonyms' (max 3), 'antonyms' (max 3), and 'relatedWords' (max 3, e.g. root words).
      
      JSON Structure:
      {
        "word": "${word}",
        "phonetic": "...",
        "chineseMeaning": "...",
        "englishDefinition": "...",
        "exampleSentence": "...",
        "partOfSpeech": "...",
        "level": "...",
        "synonyms": [],
        "antonyms": [],
        "relatedWords": []
      }`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        word: { type: Type.STRING },
        phonetic: { type: Type.STRING },
        chineseMeaning: { type: Type.STRING },
        englishDefinition: { type: Type.STRING },
        exampleSentence: { type: Type.STRING },
        partOfSpeech: { type: Type.STRING },
        level: { type: Type.STRING },
        synonyms: { type: Type.ARRAY, items: { type: Type.STRING } },
        antonyms: { type: Type.ARRAY, items: { type: Type.STRING } },
        relatedWords: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["word", "chineseMeaning", "englishDefinition", "level"]
    };

    const responseText = await callAI(prompt, settings, schema);
    const data = JSON.parse(cleanJsonText(responseText));
    return data as WordDefinition;
  } catch (error) {
    console.error("Definition error:", error);
    throw new Error("Failed to define word.");
  }
};

/**
 * Translates a block of text.
 */
export const translateText = async (text: string, settings?: AISettings): Promise<string> => {
  try {
    const prompt = `Translate the following English text into natural, fluent Chinese. 
      Text: """
      ${text}
      """`;
    
    return await callAI(prompt, settings);
  } catch (error) {
    console.error("Translation error", error);
    throw new Error("Failed to translate text.");
  }
};

/**
 * Analyzes the user's saved vocabulary.
 */
export const assessLevel = async (vocabularyList: string[], settings?: AISettings): Promise<string> => {
  if (vocabularyList.length === 0) return "Unknown";
  
  try {
    const prompt = `Here is a list of words an English learner is currently studying: ${vocabularyList.join(', ')}. 
      Based on the complexity and rarity of these words, estimate their CEFR English level (A1, A2, B1, B2, C1, C2). 
      Return ONLY the level code (e.g. "B1").`;
    
    const text = await callAI(prompt, settings);
    return text?.trim() || "Unknown";
  } catch (error) {
    return "Unknown";
  }
};

/**
 * Generates a single quiz question.
 */
export const generateQuizForWord = async (word: string, settings?: AISettings): Promise<QuizQuestion> => {
  try {
    const prompt = `Create a multiple-choice fill-in-the-blank question to test the understanding of the English word "${word}".
      1. Create a sentence where "${word}" fits perfectly, but replace the word with "______".
      2. Provide 4 options: the correct word ("${word}"), and 3 distinct incorrect words.
      3. Return strictly JSON: { "question": "...", "options": ["..."], "correctOptionIndex": 0 }`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        question: { type: Type.STRING },
        options: { type: Type.ARRAY, items: { type: Type.STRING } },
        correctOptionIndex: { type: Type.INTEGER }
      },
      required: ["question", "options", "correctOptionIndex"]
    };

    const responseText = await callAI(prompt, settings, schema);
    const data = JSON.parse(cleanJsonText(responseText));
    
    return { 
      id: Date.now().toString(),
      type: 'fill-blank',
      question: data.question, 
      options: data.options,
      correctOptionIndex: data.correctOptionIndex,
      explanation: `The correct answer is ${word}.`
    } as QuizQuestion;
  } catch (error) {
    console.error("Quiz generation error:", error);
    throw error;
  }
};

/**
 * Generates a full exam.
 */
export const generateExam = async (level: string, knownWords: string[], requirements?: string, settings?: AISettings): Promise<QuizQuestion[]> => {
  try {
    const knownWordsSample = knownWords.slice(-30).join(', '); // Use recent words
    
    const prompt = `Create a 5-question English exam for a student at level ${level}.
      User's recent vocabulary: ${knownWordsSample}.
      User's specific requirements: ${requirements || "General practice"}.
      
      Include a mix of types: 'phonetic-match', 'translation-en-zh', 'fill-blank'.
      
      Return strictly a JSON Array of objects matching this structure:
      [{ 
        "id": "1", 
        "type": "fill-blank", 
        "question": "...", 
        "options": ["A", "B", "C", "D"], 
        "correctOptionIndex": 0, 
        "explanation": "..." 
      }]`;

    const schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          type: { type: Type.STRING, enum: ['fill-blank', 'phonetic-match', 'translation-en-zh', 'translation-zh-en'] },
          question: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          correctOptionIndex: { type: Type.INTEGER },
          explanation: { type: Type.STRING }
        },
        required: ["id", "type", "question", "options", "correctOptionIndex", "explanation"]
      }
    };

    const responseText = await callAI(prompt, settings, schema);
    const questions = JSON.parse(cleanJsonText(responseText));
    return questions;
  } catch (error) {
    console.error("Exam generation error:", error);
    throw new Error("Failed to generate exam.");
  }
};

/**
 * Chat with the AI Tutor.
 */
export const chatWithTutor = async (history: { role: string, parts: { text: string }[] }[], newMessage: string, userStatsContext: string, settings?: AISettings) => {
  const provider = settings?.provider || 'gemini';
  const persona = settings?.tutorPersona || "You are a helpful English Tutor.";

  // Custom Provider Logic for Chat
  if (provider === 'custom') {
    if (!settings?.baseUrl || !settings?.customApiKey) throw new Error("Missing credentials");

    // Convert Gemini History format to OpenAI Message format
    const messages = [
      { role: 'system', content: `${persona} User Context: ${userStatsContext}` },
      ...history.map(h => ({ role: h.role === 'model' ? 'assistant' : 'user', content: h.parts[0].text })),
      { role: 'user', content: newMessage }
    ];

    try {
      const endpoint = settings.baseUrl.endsWith('/') ? `${settings.baseUrl}chat/completions` : `${settings.baseUrl}/chat/completions`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.customApiKey}`
        },
        body: JSON.stringify({
          model: settings.modelName,
          messages: messages,
          temperature: settings.temperature ?? 0.7,
        })
      });
      const data = await response.json();
      return data.choices?.[0]?.message?.content || "Error: No response.";
    } catch (e) {
      console.error(e);
      return "I'm having trouble connecting to your custom AI provider.";
    }
  }

  // Default Gemini Logic
  const chat = ai.chats.create({
    model: settings?.modelName || DEFAULT_MODEL,
    history: history,
    config: {
      systemInstruction: `${persona} User Context: ${userStatsContext}.`,
      temperature: settings?.temperature ?? 0.7,
    }
  });

  const result = await chat.sendMessage({ message: newMessage });
  return result.text;
};
