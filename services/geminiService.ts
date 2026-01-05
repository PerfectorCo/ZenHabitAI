
import { GoogleGenAI, Type } from "@google/genai";
import { Habit, Recommendation, UserProfile } from "../types";

// Always use the correct initialization pattern with named parameter and direct process.env.API_KEY access
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAIRecommendations = async (habits: Habit[], profile: UserProfile): Promise<Recommendation[]> => {
  const habitsSummary = habits.map(h => ({
    title: h.title,
    streak: h.streak,
    totalTimeSpent: h.timeSpentMinutes,
    completionRate: h.completedDates.length
  }));

  const prompt = `User Profile:
  Name: ${profile.name}
  Main Goal: ${profile.mainGoal}
  Bio: ${profile.bio}

  Current Habit Data: ${JSON.stringify(habitsSummary)}
  
  Based on this, provide 3 personalized recommendations. At least one should be a "New Habit Suggestion" that the user can immediately add to their tracker. 
  For suggestions that are specifically new habits, include a 'suggestedHabit' object with a short 'title' and 'category' (Health, Mindset, Work, or Skills).`;

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

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("AI Error:", error);
    return [
      { 
        title: "Stay Hydrated", 
        reason: "Drinking water boosts concentration for your goal: " + profile.mainGoal, 
        priority: "high",
        suggestedHabit: { title: "Drink 2L Water", category: "Health" }
      },
      { title: "Review Your Goals", reason: "Reflect on why you started these habits to boost motivation.", priority: "low" }
    ];
  }
};
