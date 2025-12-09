import { GoogleGenAI, Type } from "@google/genai";
import { Avatar, ProjectStyle, SocialStrategy, VideoReference } from "../types";

// Helper to get a fresh instance, ensuring we use the latest API key if it changed
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const GeminiService = {
  // 1. Analyze Avatar (Vision)
  callGeminiVision: async (base64: string, mime: string, promptText: string): Promise<string> => {
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mime,
                data: base64,
              },
            },
            {
              text: promptText,
            },
          ],
        },
      });
      return response.text || "A character";
    } catch (error) {
      console.error("Gemini Vision Error:", error);
      return "A character with distinct features";
    }
  },

  // 2. Generate SCENES (Storyboarding)
  generateScript: async (
    idea: string,
    mode: 'standard' | 'reel',
    language: string,
    guidance: string,
    audience: string,
    goal: string,
    videoReference?: VideoReference, // Parámetro existente
    characterRole?: string // Nuevo parámetro
  ): Promise<string[]> => {
    try {
      const ai = getAI();
      let systemInstruction = `You are "Don", an expert AI Art Director. 
      Your goal is to write 4 distinct SCENE DESCRIPTIONS that form a continuous visual story.
      
      User Idea: ${idea.trim() || 'Generate a compelling story concept for a short video.'}
      Goal: ${goal}
      Format: ${mode === 'reel' ? 'Vertical Portrait (9:16)' : 'Cinematic Landscape (16:9)'}.
      
      Output exactly 4 scene descriptions.
      SCENE 1 MUST BE THE ESTABLISHING SHOT (The "Mother Scene").
      Scenes 2, 3, and 4 must flow logically from Scene 1.
      
      Each scene description should be concise and designed to represent roughly 8 seconds of video content.
      Focus ONLY on the action, environment, and lighting. 
      DO NOT describe the character's physical traits (hair, face) here.
      Refer to the character simply as "The Protagonist".
      If a character speaks, indicate it like this: (Nombre del personaje: "Diálogo aquí."). The dialogue MUST be in Latin American Spanish (español latino). This format is for clarity in the script, not for the image generation model.
      `;

      if (characterRole) {
        systemInstruction += `\n\nROL DEL PERSONAJE: El protagonista es un "${characterRole}". Integra este rol en la forma en que el personaje interactúa y actúa en las escenas.`;
      }
      if (videoReference) {
        systemInstruction += `\n\nCRÍTICO: El usuario ha proporcionado un video de referencia. ADAPTA el estilo visual, el ritmo, el color y el ambiente general de estas escenas para que coincidan lo más fielmente posible con el VIDEO DE REFERENCIA.`;
      }

      const prompt = `Idea: ${idea}. Guidance: ${guidance}. Return exactly 4 scene descriptions as a JSON array of strings.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("No script generated");
      return JSON.parse(text);
    } catch (error) {
      console.error("Generate Script Error:", error);
      return [
        "The Protagonist standing confidently in the center of the frame, dramatic lighting. (Don: \"¡Empecemos la historia!\")",
        "The Protagonist performing the main action with intense focus.",
        "A wide shot of The Protagonist interacting with the environment.",
        "Close up of The Protagonist showing emotion, blurred background. (Don: \"¡Fin de la escena!\")"
      ];
    }
  },

  // 3. Create Multi-Character Prompt
  createMultiCharacterPrompt: async (
    avatars: Avatar[],
    sceneDescription: string,
    isReelMode: boolean,
    avatarModifications: string,
    projectStyle: ProjectStyle
  ): Promise<string> => {
    
    // const mainAvatar = avatars[0]; // Not explicitly used here anymore for physical description
    
    const styleKeywords = projectStyle === 'animation_3d' 
      ? "3D Pixar style render, Disney animation style, cute, expressive, high fidelity, octane render" 
      : projectStyle === 'realistic_cgi' 
      ? "Photorealistic, 8k, cinematic, unreal engine 5, hyperrealistic" 
      : "2D vector illustration, flat design, vibrant colors, clean lines";

    // Remove dialogue parts from the sceneDescription before passing to image generation
    const cleanSceneDescription = sceneDescription.replace(/\(.*\:\s*".*?"\)/g, '').trim();

    const characterEnforcement = `
    INSTRUCCIÓN: INSERTA EL PERSONAJE DE LA IMAGEN DE REFERENCIA EN LA SIGUIENTE ESCENA.
    
    REGLAS DE IMAGEN DE REFERENCIA:
    1. MANTENER LA MISMA CARA, PELO E IDENTIDAD EXACTOS.
    2. MANTENER EL MISMO TRAJE (a menos que se especifique lo contrario).
    
    Acción Principal: ${cleanSceneDescription.replace(/The Protagonist/gi, "El personaje")}.
    Atmósfera/Modificaciones: ${avatarModifications}.
    
    Relación de Aspecto: ${isReelMode ? "9:16 (Vertical)" : "16:9 (Cinemática)"}.
    Estilo: ${styleKeywords}.
    `;

    return characterEnforcement;
  },

  // 4. Generate Image (Consistency + Mother Scene Logic)
  generateImage: async (
    prompt: string, 
    referenceBase64?: string, 
    referenceMime?: string,
    motherSceneBase64?: string
  ): Promise<string> => {
    try {
        const ai = getAI();
        const parts: any[] = [];
        
        let finalPrompt = prompt;

        // 1. Add Identity Reference (The Avatar)
        if (referenceBase64 && referenceMime) {
            parts.push({
                inlineData: {
                    mimeType: referenceMime,
                    data: referenceBase64
                }
            });
            finalPrompt = "IMAGEN 1 ES LA REFERENCIA DEL PERSONAJE (CARA/IDENTIDAD).\n" + finalPrompt;
        }

        // 2. Add Mother Scene Reference (Style/Consistency)
        if (motherSceneBase64) {
            parts.push({
                inlineData: {
                    mimeType: "image/png", // Assuming generated images are PNG
                    data: motherSceneBase64
                }
            });
            finalPrompt = "IMAGEN 2 ES LA 'ESCENA MADRE' (REFERENCIA DE ESTILO).\n" + 
                          "CRÍTICO: DEBE coincidir con la iluminación, la paleta de colores, el estilo de renderizado y la atmósfera de la IMAGEN 2 exactamente.\n" +
                          "Sin embargo, el personaje debe realizar la NUEVA acción descrita a continuación.\n" + 
                          finalPrompt;
        }
        
        // 3. Add Text Prompt
        parts.push({ text: finalPrompt });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image', 
            contents: { parts },
        });

        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
        }
        
        throw new Error("No image data returned.");
    } catch (error) {
        console.error("Generate Image Error:", error);
        throw error;
    }
  },

  // 5. Generate Social Strategy
  generateSocialStrategy: async (
    scriptIdea: string, 
    scenes: string[], 
    language: string, 
    audience: string, 
    goal: string,
    endingDialogue?: string // Nuevo parámetro
  ): Promise<SocialStrategy> => {
    const fallbackStrategy: SocialStrategy = {
        viralHooks: ["Espera un momento!", "Increíble, tienes que ver esto", "No te lo pierdas"],
        caption: `Nueva publicación sobre ${scriptIdea}`,
        hashtags: ["#viral", "#ia", "#contenido", "#shorts"],
        platformTips: { tiktok: "Usa audios en tendencia y transiciones rápidas.", instagram: "Comparte como Reel y en tus historias.", facebook: "Publica en grupos relevantes y fomenta la interacción." },
        bestTime: "20:00 - 22:00 (hora local)"
    };

    try {
      const ai = getAI();
      let systemInstruction = `You are "Don", a social media strategist. Your task is to craft a compelling and engaging narrative for a social media post.

      The "caption" MUST be a narrative retelling of the entire video script provided in the 'Script Scenes', incorporating all actions and dialogues from each scene.
      All character dialogue within this narrative MUST be in Latin American Spanish (español latino) and integrated naturally into the prose (e.g., El protagonista exclama: "¡Qué sorpresa!").
      
      CRITICAL: When narrating, DO NOT include any physical descriptions of the character (e.g., color de pelo, color de ojos, complexión física). Focus exclusively on what the character DOES, FEELS, and SAYS, driving the story forward.
      `;

      if (endingDialogue) {
        systemInstruction += `\n\nAL FINAL DE LA NARRATIVA: Adapta la siguiente frase o llamado a la acción al final del caption de forma natural y persuasiva: "${endingDialogue}".`;
      }
      
      const prompt = `Generate a social media strategy for a short video.
      Video Idea: ${scriptIdea}. 
      Script Scenes: ${scenes.map((s, i) => `Escena ${i+1}: ${s}`).join('\n')}. 
      Target Audience: ${audience}. 
      Content Goal: ${goal}.
      Language: ${language}.
      
      Return JSON with the following structure:
      { 
        "viralHooks": ["string", "string"], 
        "caption": "string", // This will be the full narrative of the story, including dialogue.
        "hashtags": ["string", "string"], 
        "platformTips": { 
          "tiktok": "string", 
          "instagram": "string", 
          "facebook": "string" 
        }, 
        "bestTime": "string" 
      }`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              viralHooks: { type: Type.ARRAY, items: { type: Type.STRING } },
              caption: { type: Type.STRING },
              hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
              platformTips: {
                type: Type.OBJECT,
                properties: {
                  tiktok: { type: Type.STRING },
                  instagram: { type: Type.STRING },
                  facebook: { type: Type.STRING }
                }
              },
              bestTime: { type: Type.STRING }
            }
          }
        }
      });

      const text = response.text;
      if (!text) return fallbackStrategy;
      
      const parsed = JSON.parse(text);
      return {
          viralHooks: parsed.viralHooks || fallbackStrategy.viralHooks,
          caption: parsed.caption || fallbackStrategy.caption,
          hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : fallbackStrategy.hashtags,
          platformTips: parsed.platformTips || fallbackStrategy.platformTips,
          bestTime: parsed.bestTime || fallbackStrategy.bestTime
      };

    } catch (error) {
      console.error("Strategy generation error:", error);
      return fallbackStrategy;
    }
  }
};