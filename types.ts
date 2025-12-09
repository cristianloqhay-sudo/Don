export interface Avatar {
  id: number;
  src: string; // Base64 Data URL
  name: string;
  customPrompt: string;
  profile: string; // Description from vision analysis
}

export type GenerationStatus = 'idle' | 'loading' | 'success' | 'error' | 'pending';

export interface LogEntry {
  message: string;
  type: 'info' | 'success' | 'error';
  timestamp: number;
}

export type ScriptScene = string; // In the code it's treated as an array of strings

export type ProjectStyle = 'animation_3d' | 'realistic_cgi' | 'stylized_illustration';

export interface VideoGenerationReferenceImage {
    base64: string;
    mime: string;
}

export interface SocialStrategy {
  viralHooks: string[];
  caption: string;
  hashtags: string[];
  platformTips: {
    tiktok: string;
    instagram: string;
    facebook: string;
  };
  bestTime: string;
}

export interface VideoReference {
  src: string; // Base64 Data URL
  mimeType: string;
}

export interface Project {
  id: string;
  name: string;
  description: string; // Instrucciones maestras (De qué trata)
  defaultAudience: string;
  defaultGoal: string; // Lo que quiero que se haga
  createdAt: number;
  themeColor: string;
  mainAvatar?: Avatar; // El protagonista creado al inicio
  ideas?: string[]; // Banco de ideas guardadas
  videoReference?: VideoReference; // Nuevo campo para video de referencia
  characterRole?: string; // Nuevo campo: Rol del personaje
  endingDialogue?: string; // Nuevo campo: Frase final adaptable
}