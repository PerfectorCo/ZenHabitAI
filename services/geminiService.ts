
import { GoogleGenAI, Type } from "@google/genai";
import { Habit, Task, Recommendation, UserProfile, FocusSession } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAIRecommendations = async (habits: Habit[], profile: UserProfile, lang: 'en' | 'vi' = 'en'): Promise<Recommendation[]> => {
  const habitsSummary = habits.map(h => ({
    title: h.title,
    streak: h.streak,
    totalTimeSpent: h.timeSpentMinutes,
    completionRate: h.completedDates.length
  }));

  // Logic to determine user state for recommendations
  const totalHistoricalCompletions = habits.reduce((acc, h) => acc + h.completedDates.length, 0);
  const joinedDate = new Date(profile.joinedDate);
  const daysSinceJoined = Math.floor((new Date().getTime() - joinedDate.getTime()) / (1000 * 3600 * 24));
  
  const isNewUser = daysSinceJoined < 3 && totalHistoricalCompletions === 0;

  const prompt = `User Profile:
  Name: ${profile.name}
  Main Habit Focus (Goal): ${profile.mainGoal}
  Bio: ${profile.bio}
  User State: ${isNewUser ? 'BRAND NEW USER (just started)' : 'EXISTING USER'}

  Current Habit Data: ${JSON.stringify(habitsSummary)}
  
  Language: ${lang === 'vi' ? 'Vietnamese' : 'English'}

  Your Task:
  Provide 3 highly personalized habit recommendations. 
  
  Personalization Rules:
  1. If BRAND NEW USER: Suggest foundational habits that align perfectly with their "Main Habit Focus" (${profile.mainGoal}). Keep them easy to start (Atomic Habits style).
  2. If EXISTING USER: Suggest habits that complement their existing routine or address gaps in their "Main Habit Focus".
  3. Tone: Supportive, wise, and encouraging.
  4. Language: Use natural, conversational ${lang === 'vi' ? 'Vietnamese' : 'English'}. Avoid unusual characters like semicolons (;).
  
  JSON Structure:
  - title: A catchy title for the recommendation.
  - reason: Why this fits their current focus (${profile.mainGoal}) and state.
  - priority: 'low', 'medium', or 'high'.
  - suggestedHabit: An object with 'title' and 'category' (Health, Mindset, Work, or Skills) that the user can add.

  IMPORTANT: Return valid JSON in ${lang === 'vi' ? 'Vietnamese' : 'English'}.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              reason: { type: Type.STRING },
              priority: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
              suggestedHabit: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  category: { type: Type.STRING }
                },
                required: ['title', 'category']
              }
            },
            required: ['title', 'reason', 'priority']
          }
        }
      }
    });

    let cleanedText = response.text || "[]";
    // Sanitize any semicolons that might have slipped into the JSON strings
    cleanedText = cleanedText.replace(/;/g, ',');
    
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("AI Error:", error);
    return [];
  }
};

export const getAIInsights = async (habits: Habit[], tasks: Task[], sessions: FocusSession[], profile: UserProfile, period: string, lang: 'en' | 'vi' = 'en'): Promise<string> => {
  const habitsSummary = habits.map(h => ({ title: h.title, completions: h.completedDates.length, currentStreak: h.streak }));
  const tasksSummary = tasks.map(t => ({ title: t.title, completed: t.completed }));
  const totalFocus = sessions.filter(s => s.type === 'focus').reduce((acc, s) => acc + s.durationMinutes, 0);
  
  // Logic to determine user state
  const totalHistoricalCompletions = habits.reduce((acc, h) => acc + h.completedDates.length, 0) + tasks.filter(t => t.completed).length;
  const joinedDate = new Date(profile.joinedDate);
  const daysSinceJoined = Math.floor((new Date().getTime() - joinedDate.getTime()) / (1000 * 3600 * 24));
  
  const isNewUser = daysSinceJoined < 3 && totalHistoricalCompletions === 0;
  const isInactiveUser = daysSinceJoined >= 7 && habitsSummary.every(h => h.completions === 0) && tasksSummary.every(t => !t.completed) && totalFocus === 0;

  const prompt = `Contextual Analysis for User: ${profile.name}
  Joined Date: ${profile.joinedDate} (${daysSinceJoined} days ago)
  Total History Completions: ${totalHistoricalCompletions}
  Main Goal: ${profile.mainGoal}
  
  Recent Data (${period}):
  - Habits: ${JSON.stringify(habitsSummary)}
  - Tasks: ${JSON.stringify(tasksSummary)}
  - Deep Work: ${totalFocus} minutes.
  
  User State: ${isNewUser ? 'BRAND NEW USER (just started today/yesterday)' : isInactiveUser ? 'INACTIVE USER (no progress for at least a week)' : 'ACTIVE USER'}
  Preferred Language: ${lang === 'vi' ? 'Vietnamese' : 'English'}

  Your Task:
  As a 'Zen Sensei' life coach, provide a brief, warm, and natural conversational insight (max 3 sentences).
  - If they are a BRAND NEW USER: Welcome them warmly. Focus on their chosen goal: ${profile.mainGoal}.
  - If they are an INACTIVE USER: Offer gentle encouragement to return to ${profile.mainGoal}. Remind them that every day is a fresh beginning.
  - If they are an ACTIVE USER: Praise their progress toward ${profile.mainGoal}.
  
  Rules:
  - Use smooth, natural, human language.
  - NEVER use semicolons (;), special symbols like # or *, or bullet points.
  - Tone: Calm, supportive, wise, and motivating.
  - Response must be strictly in ${lang === 'vi' ? 'Vietnamese' : 'English'}.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.8,
        topP: 0.9,
      }
    });
    
    let result = response.text || "";
    // Robust cleaning of characters that might clutter the UI
    result = result.replace(/;/g, ',').replace(/[*_#\-•]/g, '').trim();
    
    return result;
  } catch (e) {
    if (lang === 'vi') {
      return isNewUser 
        ? "Chào mừng bạn đến với hành trình mới. Hãy bắt đầu từ những việc nhỏ nhất ngày hôm nay nhé."
        : "Đã lâu không thấy bạn, nhưng không sao cả. Mỗi ngày đều là một cơ hội mới để chúng ta bắt đầu lại.";
    }
    return isNewUser
      ? "Welcome to your new journey. The first step is always the most meaningful one."
      : "It has been a while, but that is perfectly okay. Every sunset is followed by a fresh sunrise and a new chance to begin.";
  }
};
