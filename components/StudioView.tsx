import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Loader2, Plus, CheckCircle2, Trash2, Shirt, Wand2, Copy,
  Eye, Type, Users, Target, TrendingUp, Sparkles, Image as ImageIcon,
  Facebook, Instagram, Video, ArrowLeft, Star, Clapperboard, Save, StickyNote, Download,
  AlertCircle, Link, RefreshCw
} from 'lucide-react';
import Button from './Button';
import TextArea from './TextArea';
import Input from './Input';
import { Avatar, LogEntry, ProjectStyle, SocialStrategy, Project } from '../types';
import { getMimeType } from '../utils/mediaUtils';
import { GeminiService } from '../services/geminiService';

interface StudioViewProps {
  activeProject: Project | null;
  onExitProject: () => void;
  onUpdateProject: (project: Project) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  scriptIdea: string;
  setScriptIdea: (idea: string) => void;
  scriptGuidance: string;
  setScriptGuidance: (guidance: string) => void;
  targetAudience: string;
  setTargetAudience: (val: string) => void;
  contentGoal: string;
  setContentGoal: (val: string) => void;
  scriptScenes: string[];
  setScriptScenes: (scenes: string[]) => void;
  isScripting: boolean;
  setIsScripting: (isScripting: boolean) => void;
  isReelMode: boolean;
  setIsReelMode: (isReelMode: boolean) => void;
  uploadedCast: Avatar[];
  setUploadedCast: React.Dispatch<React.SetStateAction<Avatar[]>>;
  selectedAvatarIds: number[];
  setSelectedAvatarIds: React.Dispatch<React.SetStateAction<number[]>>;
  editingAvatarId: number | null;
  setEditingAvatarId: (id: number | null) => void;
  avatarModifications: string;
  setAvatarModifications: (mods: string) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  isGeneratingImages: boolean;
  setIsGeneratingImages: (isGenerating: boolean) => void;
  generatedImages: (string | null)[];
  setGeneratedImages: (images: (string | null)[]) => void;
  finalPrompts: string[];
  setFinalPrompts: (prompts: string[]) => void;
  socialStrategy: SocialStrategy | null;
  setSocialStrategy: (strategy: SocialStrategy | null) => void;
  setPreviewImage: (img: string | null) => void;
  projectLanguage: string;
  addLog: (msg: string, type?: LogEntry['type']) => void;
  copyToClipboard: (text: string) => void;
  downloadImage: (base64: string, filename: string) => void;
  handleNewProduction: (force?: boolean) => void;
  getVideoPrompt: (index: number) => string;
  projectStyle: ProjectStyle;
  setProjectStyle: (style: ProjectStyle) => void;
}

const StudioView: React.FC<StudioViewProps> = ({
  activeProject,
  onExitProject,
  onUpdateProject,
  currentStep,
  setCurrentStep,
  scriptIdea,
  setScriptIdea,
  scriptGuidance,
  setScriptGuidance,
  targetAudience,
  setTargetAudience,
  contentGoal,
  setContentGoal,
  scriptScenes,
  setScriptScenes,
  isScripting,
  setIsScripting,
  isReelMode,
  setIsReelMode,
  uploadedCast,
  setUploadedCast,
  selectedAvatarIds,
  setSelectedAvatarIds,
  editingAvatarId,
  setEditingAvatarId,
  avatarModifications,
  setAvatarModifications,
  isAnalyzing,
  setIsAnalyzing,
  isGeneratingImages,
  setIsGeneratingImages,
  generatedImages,
  setGeneratedImages,
  finalPrompts,
  setFinalPrompts,
  socialStrategy,
  setSocialStrategy,
  setPreviewImage,
  projectLanguage,
  addLog,
  copyToClipboard,
  downloadImage,
  handleNewProduction,
  projectStyle,
  setProjectStyle,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [regeneratingImageIndex, setRegeneratingImageIndex] = useState<number | null>(null);

  const analyzeAvatar = useCallback(async (id: number, base64: string, mime: string) => {
    setIsAnalyzing(true);
    addLog(`Analizando rasgos físicos del personaje ${id}...`, 'info');
    try {
      const desc = await GeminiService.callGeminiVision(base64, mime, "Describe the PHYSICAL FEATURES of this person/character for an AI image generator. Focus ONLY on: Hair color/style, eye color, facial structure, skin tone, body build, and current outfit. Be concise and descriptive.");
      setUploadedCast((prev) => prev.map(c => c.id === id ? { ...c, profile: desc.trim() } : c));
      addLog(`Rasgos identificados. Referencia lista para consistencia.`, 'success');
    } catch (e: any) {
      addLog("Error analizando avatar: " + e.message, "error");
    } finally {
      setIsAnalyzing(false);
    }
  }, [setIsAnalyzing, setUploadedCast, addLog]);

  // Load project defaults and MAIN AVATAR when entering
  useEffect(() => {
    if (activeProject) {
      if (currentStep === 1 && !targetAudience && !contentGoal) {
        if (activeProject.defaultAudience) setTargetAudience(activeProject.defaultAudience);
        if (activeProject.defaultGoal) setContentGoal(activeProject.defaultGoal);
      }
      if (activeProject.mainAvatar) {
        setUploadedCast((prev) => {
          if (prev.some(a => a.id === activeProject.mainAvatar!.id)) return prev;
          const main = activeProject.mainAvatar!;
          return [main, ...prev];
        });
        setSelectedAvatarIds((prev) => {
           if (prev.length === 0) return [activeProject.mainAvatar!.id];
           return prev;
        });
        if (!activeProject.mainAvatar.profile) {
           setTimeout(() => {
              const base64 = activeProject.mainAvatar!.src.split(',')[1];
              const mime = getMimeType(activeProject.mainAvatar!.src);
              analyzeAvatar(activeProject.mainAvatar!.id, base64, mime);
           }, 1000);
        }
      }
    }
  }, [activeProject, currentStep, targetAudience, contentGoal, setTargetAudience, setContentGoal, setUploadedCast, setSelectedAvatarIds, analyzeAvatar]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const r = new FileReader();
      r.onloadend = () => {
        if (typeof r.result === 'string') {
          const id = Date.now();
          const newAvatar: Avatar = {
            id,
            src: r.result,
            name: `Cast ${uploadedCast.length + 1}`,
            customPrompt: '',
            profile: ''
          };
          setUploadedCast((prev) => [...prev, newAvatar]);
          setSelectedAvatarIds((prev) => [...prev, id]);
          setEditingAvatarId(id);
          const base64 = r.result.split(',')[1];
          const mime = getMimeType(r.result);
          analyzeAvatar(id, base64, mime);
        }
      };
      r.readAsDataURL(e.target.files[0]);
    }
  }, [uploadedCast.length, setUploadedCast, setSelectedAvatarIds, setEditingAvatarId, analyzeAvatar]);

  const toggleAvatarSelection = useCallback((id: number) => {
    setSelectedAvatarIds([id]); 
    setEditingAvatarId(id);
  }, [setSelectedAvatarIds, setEditingAvatarId]);

  const removeAvatar = useCallback((id: number, e: React.MouseEvent) => {
    e.stopPropagation(); 
    setUploadedCast((prev) => prev.filter(c => c.id !== id));
    setSelectedAvatarIds((prev) => prev.filter(sid => sid !== id));
    if (editingAvatarId === id) setEditingAvatarId(null);
  }, [setUploadedCast, setSelectedAvatarIds, editingAvatarId, setEditingAvatarId]);

  const updateAvatarOutfit = useCallback((txt: string) => {
    if (!editingAvatarId) return;
    setUploadedCast((prev) => prev.map(c => c.id === editingAvatarId ? { ...c, customPrompt: txt } : c));
  }, [editingAvatarId, setUploadedCast]);

  const saveIdeaToBank = useCallback(() => {
    if (!scriptIdea.trim() || !activeProject) return;
    const newIdeas = [scriptIdea, ...(activeProject.ideas || [])];
    onUpdateProject({ ...activeProject, ideas: newIdeas });
    addLog("Idea guardada en el banco.", "success");
  }, [scriptIdea, activeProject, onUpdateProject, addLog]);

  const deleteIdeaFromBank = useCallback((index: number) => {
    if (!activeProject || !activeProject.ideas) return;
    const newIdeas = activeProject.ideas.filter((_, i) => i !== index);
    onUpdateProject({ ...activeProject, ideas: newIdeas });
    addLog("Idea eliminada del banco.", "info");
  }, [activeProject, onUpdateProject, addLog]);

  const loadIdeaFromBank = useCallback((idea: string) => {
    setScriptIdea(idea);
  }, [setScriptIdea]);

  const generateScriptLogic = useCallback(async (mode: 'standard' | 'reel') => {
    // If scriptIdea is empty, we still let Don generate a full script based on other guidance.
    // The GeminiService will handle an empty idea by creating one.
    setIsScripting(true);
    setIsReelMode(mode === 'reel');
    addLog(`Don está creando el GUION VISUAL...`, 'info');
    try {
      const effAudience = targetAudience || activeProject?.defaultAudience || "Público general";
      const effGoal = contentGoal || activeProject?.defaultGoal || "Entretenimiento viral";
      let fullGuidance = scriptGuidance;
      if (activeProject?.description) {
        fullGuidance = `[CONTEXTO DEL PERFIL]: ${activeProject.description}\n\n[INSTRUCCIONES ESPECÍFICAS]: ${scriptGuidance}`;
      }
      const scenes = await GeminiService.generateScript(
        scriptIdea, 
        mode, 
        projectLanguage, 
        fullGuidance, 
        effAudience, 
        effGoal,
        activeProject?.videoReference, // Pasar el video de referencia
        activeProject?.characterRole // Pasar el rol del personaje
      );
      setScriptScenes(scenes);
      addLog("¡Guion visual generado!", "success");
    } catch (error: any) {
      addLog("Error en prompts: " + error.message, "error");
      setScriptScenes([scriptIdea, "Prompt 2 (Error)", "Prompt 3 (Error)", "Prompt 4 (Error)"]);
    } finally {
      setIsScripting(false);
    }
  }, [scriptIdea, scriptGuidance, targetAudience, contentGoal, projectLanguage, setIsScripting, setIsReelMode, setScriptScenes, addLog, activeProject]);

  // Function to render scene text with dialogue highlighting
  const renderSceneText = (text: string) => {
    const parts = [];
    let lastIndex = 0;
    const regex = /(\(.*\:\s*".*?"\))/g; // Matches (Character: "Dialogue")
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Add text before the dialogue
      if (match.index > lastIndex) {
        parts.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex, match.index)}</span>);
      }
      // Add the dialogue itself
      parts.push(
        <span key={`dialogue-${match.index}`} className="text-emerald-300 italic font-mono px-1 rounded-sm bg-slate-700/50">
          {match[0]}
        </span>
      );
      lastIndex = regex.lastIndex;
    }

    // Add any remaining text after the last dialogue
    if (lastIndex < text.length) {
      parts.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex)}</span>);
    }
    return parts;
  };


  // --- REFACTORED: SEQUENTIAL GENERATION WITH MOTHER SCENE ---
  const generateStoryboard = useCallback(async () => {
    if (selectedAvatarIds.length === 0) {
      alert("Selecciona al Protagonista para mantener la consistencia.");
      return;
    }
    if (scriptScenes.length === 0) {
      alert("¡No hay escenas generadas para crear el storyboard!");
      return;
    }

    setIsGeneratingImages(true);
    setCurrentStep(3); // Loading screen
    setGeneratedImages([]); // Clear previous
    setFinalPrompts([]);
    
    addLog("Iniciando producción narrativa...", "info");

    try {
      const mainAvatar = uploadedCast.find(c => c.id === selectedAvatarIds[0]);
      if (!mainAvatar) throw new Error("Referencia no encontrada");

      const refMime = getMimeType(mainAvatar.src);
      const refBase64 = mainAvatar.src.split(',')[1];
      
      const newImages: (string | null)[] = new Array(scriptScenes.length).fill(null);
      const newPrompts: string[] = [];

      // --- PHASE 1: GENERATE MOTHER SCENE (Index 0) ---
      addLog("Generando Escena Madre (1/4)...", "info");
      
      const motherPrompt = await GeminiService.createMultiCharacterPrompt(
         [mainAvatar],
         scriptScenes[0],
         isReelMode,
         avatarModifications,
         projectStyle
      );
      newPrompts.push(motherPrompt);
      setFinalPrompts([...newPrompts]);

      // Generate Scene 1 only using Identity Reference
      const motherSceneImage = await GeminiService.generateImage(motherPrompt, refBase64, refMime);
      
      // Store Scene 1
      newImages[0] = motherSceneImage;
      setGeneratedImages([...newImages]);
      addLog("Escena Madre completada. Usando como referencia de estilo...", "success");

      // Extract Base64 for Mother Scene (strip data:image prefix)
      const motherSceneBase64 = motherSceneImage.split(',')[1];

      // --- PHASE 2: GENERATE CHILD SCENES (Index 1 to End) ---
      for (let i = 1; i < scriptScenes.length; i++) {
         addLog(`Generando Escena ${i + 1}/${scriptScenes.length} basada en la Escena Madre...`, "info");
         
         const childPrompt = await GeminiService.createMultiCharacterPrompt(
            [mainAvatar],
            scriptScenes[i],
            isReelMode,
            avatarModifications,
            projectStyle
         );
         newPrompts.push(childPrompt);
         setFinalPrompts([...newPrompts]);

         // Generate Child Scene using Identity Reference + Mother Scene Reference
         const childImage = await GeminiService.generateImage(childPrompt, refBase64, refMime, motherSceneBase64);
         
         newImages[i] = childImage;
         setGeneratedImages([...newImages]);
      }
      
      addLog("¡Historia Visual completada!", "success");

      // 3. Generate Strategy
      const effAudience = targetAudience || activeProject?.defaultAudience || "General";
      const effGoal = contentGoal || activeProject?.defaultGoal || "Viralidad";
      
      try {
        const strategy = await GeminiService.generateSocialStrategy(
          scriptIdea, 
          scriptScenes, 
          projectLanguage, 
          effAudience, 
          effGoal,
          activeProject?.endingDialogue // Pasar la frase final
        );
        setSocialStrategy(strategy);
        addLog("Estrategia de lanzamiento lista.", "success");
      } catch (strategyError) {
        addLog("Imágenes listas. Estrategia omitida por error.", "info");
      }

      setTimeout(() => setCurrentStep(4), 1000); // Go to results

    } catch (e: any) {
      addLog("Error generando storyboard: " + e.message, "error");
      setIsGeneratingImages(false); 
    } finally {
      setIsGeneratingImages(false);
    }
  }, [
    selectedAvatarIds, uploadedCast, scriptScenes, isReelMode, avatarModifications,
    setIsGeneratingImages, setCurrentStep, setFinalPrompts, addLog, projectStyle,
    scriptIdea, projectLanguage, targetAudience, contentGoal, activeProject, setSocialStrategy,
    setGeneratedImages
  ]);

  const handleRegenerateImage = useCallback(async (idx: number) => {
    if (selectedAvatarIds.length === 0) {
      addLog("Por favor, selecciona al Protagonista primero.", "error");
      return;
    }
    if (!finalPrompts[idx]) {
      addLog("No se encontró el prompt para esta escena.", "error");
      return;
    }

    setRegeneratingImageIndex(idx);
    addLog(`Regenerando Escena ${idx + 1}...`, "info");

    try {
      const mainAvatar = uploadedCast.find(c => c.id === selectedAvatarIds[0]);
      if (!mainAvatar) throw new Error("Referencia de avatar no encontrada para regeneración.");

      const refMime = getMimeType(mainAvatar.src);
      const refBase64 = mainAvatar.src.split(',')[1];
      
      const prompt = finalPrompts[idx];
      let motherSceneBase64: string | undefined;

      if (idx > 0 && generatedImages[0]) {
        // For child scenes, use the mother scene (index 0) as consistency reference
        motherSceneBase64 = generatedImages[0].split(',')[1];
      }
      // If idx is 0 (mother scene), motherSceneBase64 remains undefined, which is correct.

      const newImage = await GeminiService.generateImage(prompt, refBase64, refMime, motherSceneBase64);
      
      setGeneratedImages(prev => {
        const newArr = [...prev];
        newArr[idx] = newImage;
        return newArr;
      });
      addLog(`Escena ${idx + 1} regenerada con éxito.`, "success");

    } catch (e: any) {
      addLog(`Error al regenerar escena ${idx + 1}: ${e.message}`, "error");
    } finally {
      setRegeneratingImageIndex(null);
    }
  }, [selectedAvatarIds, uploadedCast, finalPrompts, generatedImages, addLog]);


  const currentEditingAvatar = uploadedCast.find(c => c.id === editingAvatarId);

  return (
    <div className="animate-fade-in pb-20">
      
      {/* Project Header */}
      {activeProject && (
        <div className="mb-6 flex items-center justify-between bg-slate-800/50 p-3 rounded-xl border border-slate-700 backdrop-blur-sm sticky top-20 z-40">
           <div className="flex items-center gap-3">
              <div className={`w-3 h-10 rounded-full bg-gradient-to-b ${activeProject.themeColor}`}></div>
              <div>
                 <h3 className="font-bold text-white text-sm flex items-center gap-2">
                   {activeProject.name}
                   {activeProject.mainAvatar && (
                      <span className="text-[10px] bg-indigo-900/50 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                        {activeProject.mainAvatar.name}
                      </span>
                   )}
                 </h3>
                 <p className="text-xs text-slate-400 max-w-md truncate">{activeProject.description || "Sin instrucciones maestras."}</p>
              </div>
           </div>
           <Button onClick={onExitProject} variant="ghost" size="sm" className="text-slate-400 hover:text-white">
             <ArrowLeft className="w-4 h-4 mr-1" /> Salir del Perfil
           </Button>
        </div>
      )}

      <div className="flex items-center justify-center gap-4 mb-8">
        {[1, 2, 3, 4].map(s => (
          <div
            key={s}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              currentStep === s ? 'bg-indigo-600 text-white shadow-lg scale-110' : 'bg-slate-800 text-slate-500'
            }`}
          >
            {s}
          </div>
        ))}
      </div>

      {currentStep === 1 && (
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Clapperboard className="w-5 h-5 text-yellow-400" />
                Paso 1: Guion Visual
              </h2>
            </div>
            
            <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">
              ¿De qué trata la historia? (Deja vacío y Don creará una por ti)
            </label>
            <div className="relative">
              <TextArea
                value={scriptIdea}
                onChange={(e) => {
                  setScriptIdea(e.target.value);
                  if (e.target.value.toLowerCase().includes('reel') || e.target.value.toLowerCase().includes('tiktok')) setIsReelMode(true);
                }}
                className="h-24 mb-4 pr-12"
                placeholder="Ej: Un astronauta descubre un taco flotando en el espacio... o deja que Don cree algo increíble!"
              />
              <button
                onClick={saveIdeaToBank}
                disabled={!scriptIdea.trim()}
                className="absolute top-2 right-2 bg-slate-800 hover:bg-slate-700 text-slate-300 p-1.5 rounded-lg transition-colors border border-slate-700"
                title="Guardar en Banco de Ideas"
              >
                <Save className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
               <div>
                  <label className="text-xs text-slate-400 font-bold uppercase mb-1 block flex items-center gap-1">
                    <Users className="w-3 h-3" /> Público Objetivo
                  </label>
                  <Input 
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder={activeProject?.defaultAudience || "Ej: Gamers..."}
                    className={!targetAudience && activeProject?.defaultAudience ? "border-indigo-500/50" : ""}
                  />
                  {!targetAudience && activeProject?.defaultAudience && <span className="text-[10px] text-indigo-400 ml-1">Usando default del perfil</span>}
               </div>
               <div>
                  <label className="text-xs text-slate-400 font-bold uppercase mb-1 block flex items-center gap-1">
                    <Target className="w-3 h-3" /> Meta Principal
                  </label>
                  <Input 
                    value={contentGoal}
                    onChange={(e) => setContentGoal(e.target.value)}
                    placeholder={activeProject?.defaultGoal || "Ej: Ventas..."}
                    className={!contentGoal && activeProject?.defaultGoal ? "border-indigo-500/50" : ""}
                  />
                  {!contentGoal && activeProject?.defaultGoal && <span className="text-[10px] text-indigo-400 ml-1">Usando default del perfil</span>}
               </div>
            </div>

            <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">Estilo Visual</label>
            <TextArea
              value={scriptGuidance}
              onChange={(e) => setScriptGuidance(e.target.value)}
              className="h-16 mb-4 text-sm"
              placeholder="Ej: Cámara lenta, estilo cinemático, colores neón..."
            />
            {activeProject?.description && (
               <div className="bg-indigo-900/20 border border-indigo-500/20 p-2 rounded mb-4 text-xs text-indigo-200">
                  <strong>Nota:</strong> Don considerará el contexto de "{activeProject.name}" al escribir los prompts.
               </div>
            )}
            {activeProject?.videoReference && (
                <div className="bg-green-900/20 border border-green-500/20 p-2 rounded mb-4 text-xs text-green-200 flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    <strong>Video de Referencia detectado:</strong> Don adaptará el estilo y ritmo de las escenas.
                </div>
            )}
            {activeProject?.characterRole && (
                <div className="bg-blue-900/20 border border-blue-500/20 p-2 rounded mb-4 text-xs text-blue-200 flex items-center gap-2">
                    {/* Fix: Replaced `User` with `Users` */}
                    <Users className="w-4 h-4" />
                    <strong>Rol del Personaje:</strong> {activeProject.characterRole}
                </div>
            )}
            {activeProject?.endingDialogue && (
                <div className="bg-purple-900/20 border border-purple-500/20 p-2 rounded mb-4 text-xs text-purple-200 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <strong>Frase Final / CTA:</strong> {activeProject.endingDialogue}
                </div>
            )}
            
            <div className="flex gap-4 justify-end mt-2">
              <Button onClick={() => generateScriptLogic('standard')} isLoading={isScripting} variant="secondary">
                Formato Horizontal (16:9)
              </Button>
              <Button onClick={() => generateScriptLogic('reel')} isLoading={isScripting} variant="primary">
                Formato Vertical (9:16)
              </Button>
            </div>
          </div>

          <div className="md:col-span-1 space-y-4">
            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700 h-fit">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-yellow-400" />
                Banco de Ideas
              </h3>
              {activeProject?.ideas && activeProject.ideas.length > 0 ? (
                 <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                    {activeProject.ideas.map((idea, idx) => (
                      <div key={idx} className="bg-slate-900 p-2 rounded border border-slate-800 flex justify-between gap-2 group hover:border-indigo-500/50 transition-colors">
                         <div 
                           className="text-xs text-slate-300 line-clamp-3 cursor-pointer flex-1"
                           onClick={() => loadIdeaFromBank(idea)}
                           title="Clic para cargar"
                         >
                           {idea}
                         </div>
                         <button 
                           onClick={(e) => { e.stopPropagation(); deleteIdeaFromBank(idx); }}
                           className="text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                         >
                           <Trash2 className="w-3 h-3" />
                         </button>
                      </div>
                    ))}
                 </div>
              ) : (
                <p className="text-xs text-slate-500 italic text-center py-4">
                  No hay ideas guardadas. Escribe algo y pulsa <Save className="w-3 h-3 inline" />.
                </p>
              )}
            </div>
          </div>

          {scriptScenes[0] && (
            <div className="md:col-span-3 mt-4 space-y-2 animate-fade-in bg-slate-900 border border-slate-700 p-6 rounded-2xl">
              <h3 className="text-white font-bold mb-4">Escenas Generadas</h3>
              {scriptScenes.map((s, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="bg-slate-800 text-slate-400 px-2 py-1 rounded text-xs font-mono whitespace-nowrap">Escena {i+1}</div>
                  <div className="p-3 bg-slate-950/50 rounded border border-slate-800 text-sm text-slate-300 focus:border-indigo-500 outline-none h-auto font-mono flex-1">
                    {renderSceneText(s)}
                  </div>
                </div>
              ))}
              <Button onClick={() => setCurrentStep(2)} className="w-full mt-4" variant="success">
                Aprobar Escenas y Seleccionar Referencia
              </Button>
            </div>
          )}
        </div>
      )}

      {currentStep === 2 && (
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div
                className="aspect-square border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-slate-900 text-slate-500 hover:text-indigo-500"
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-bold uppercase">Subir</span>
              </div>
              {uploadedCast.map((avatar) => {
                const isSelected = selectedAvatarIds.includes(avatar.id);
                const isMain = activeProject?.mainAvatar?.id === avatar.id;
                
                return (
                  <div
                    key={avatar.id}
                    onClick={() => toggleAvatarSelection(avatar.id)}
                    className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                      isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/50' : 'border-transparent hover:border-slate-600'
                    }`}
                  >
                    <img src={avatar.src} className="w-full h-full object-cover" alt={avatar.name} />
                    {isMain && (
                      <div className="absolute top-1 left-1 bg-yellow-500 text-black rounded-full p-0.5 z-20 shadow-lg" title="Protagonista del Perfil">
                        <Star className="w-3 h-3 fill-current" />
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute top-1 right-1 bg-indigo-600 text-white rounded-full p-0.5 z-10">
                        <CheckCircle2 className="w-3 h-3" />
                      </div>
                    )}
                    {avatar.id === editingAvatarId && (
                      <div className="absolute bottom-0 left-0 right-0 bg-indigo-600/80 text-white text-[9px] text-center font-bold py-0.5">
                        Editando
                      </div>
                    )}
                    <button
                      onClick={(e) => removeAvatar(avatar.id, e)}
                      className="absolute bottom-1 right-1 bg-red-600/80 hover:bg-red-600 text-white rounded-full p-1 z-10 transition-colors"
                      title="Eliminar avatar de esta sesión"
                      type="button"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    {isAnalyzing && editingAvatarId === avatar.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-30">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <input type="file" ref={fileInputRef} hidden onChange={handleImageUpload} accept="image/*" />
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 text-center">
              <p className="text-xs text-slate-500 mb-2">
                Selecciona <strong>SOLO UN</strong> protagonista como Referencia Maestra. 
                Don usará esta imagen para mantener la identidad en todas las escenas.
              </p>
            </div>
          </div>

          <div className="bg-slate-800 rounded-2xl p-6 shadow-xl flex flex-col">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" /> Configuración de Identidad
            </h3>
            
            {currentEditingAvatar ? (
               <div className="mb-4 flex items-center gap-2 p-2 bg-slate-900 rounded-lg">
                  <div className="font-bold text-sm text-white">{currentEditingAvatar.name}</div>
                  {activeProject?.mainAvatar?.id === currentEditingAvatar.id && (
                     <span className="text-[10px] bg-yellow-500/20 text-yellow-300 px-2 rounded-full border border-yellow-500/30">Protagonista</span>
                  )}
               </div>
            ) : (
               <div className="mb-4 p-2 bg-slate-900/50 rounded-lg text-xs text-slate-500 italic">
                 Selecciona un personaje para establecer la referencia
               </div>
            )}

            {/* Project Style Selector */}
            <div className="mb-6">
              <label className="text-xs text-slate-400 font-bold uppercase mb-2 flex items-center gap-1">
                <Wand2 className="w-3 h-3" /> Estilo Visual
              </label>
              <div className="flex justify-between gap-2 bg-slate-900 p-1 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => setProjectStyle('animation_3d')}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    projectStyle === 'animation_3d' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  3D Pixar
                </button>
                <button
                  type="button"
                  onClick={() => setProjectStyle('realistic_cgi')}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    projectStyle === 'realistic_cgi' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Realista
                </button>
                <button
                  type="button"
                  onClick={() => setProjectStyle('stylized_illustration')}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    projectStyle === 'stylized_illustration' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Dibujo
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs text-slate-400 font-bold uppercase mb-1 flex items-center gap-1">
                <Shirt className="w-3 h-3" /> Vestimenta
              </label>
              <TextArea
                value={currentEditingAvatar?.customPrompt || ''}
                onChange={(e) => updateAvatarOutfit(e.target.value)}
                placeholder="Dejar vacío para usar la ropa exacta de la foto..."
                disabled={!currentEditingAvatar}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-sm focus:border-indigo-500 outline-none h-24 resize-none shadow-inner disabled:opacity-50"
              />
            </div>

            <div className="mt-auto pt-4 border-t border-slate-700">
              <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">
                Ambiente / Modificaciones
              </label>
              <Input
                type="text"
                value={avatarModifications}
                onChange={(e) => setAvatarModifications(e.target.value)}
                placeholder="Ej: Luces de neón, lluvia, fondo blanco..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none mb-4"
              />
              <div className="flex justify-end gap-3">
                <Button onClick={() => setCurrentStep(1)} variant="ghost" size="sm">
                  Atrás
                </Button>
                <Button
                  onClick={generateStoryboard}
                  disabled={selectedAvatarIds.length === 0 || isGeneratingImages}
                  isLoading={isGeneratingImages}
                  variant="primary"
                >
                  Generar Storyboard (Consistente)
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="max-w-2xl mx-auto text-center py-20">
          <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mx-auto mb-8" />
          <h2 className="text-2xl font-bold text-white mb-2">Dibujando Historia Visual...</h2>
          <p className="text-slate-400 mb-8">
            Don está generando la <strong>Escena Madre</strong> y usándola para crear el resto de la historia.
          </p>
          <div className="text-left max-w-sm mx-auto space-y-2">
             {generatedImages.map((img, i) => (
                <div key={i} className={`flex items-center gap-2 text-sm transition-opacity ${img ? 'opacity-100 text-green-400' : 'opacity-40 text-slate-500'}`}>
                   {img ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />}
                   {i === 0 ? "Escena Madre (Referencia)" : `Escena ${i+1}`}
                </div>
             ))}
          </div>
        </div>
      )}

      {currentStep === 4 && (
        <div className="max-w-6xl mx-auto animate-fade-in">
          
          <div className="text-center mb-8">
             <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
               <ImageIcon className="w-6 h-6 text-yellow-400" />
               Tu Storyboard Visual
             </h2>
             <p className="text-slate-400 text-sm">Historia coherente generada a partir de la Escena Madre.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {generatedImages.map((imgSrc, idx) => (
              <div key={idx} className={`bg-slate-900 rounded-xl overflow-hidden border shadow-xl group flex flex-col relative ${idx === 0 ? 'border-yellow-500/50 shadow-yellow-900/20' : 'border-slate-800'}`}>
                <div className="p-3 border-b border-slate-800 flex justify-between bg-slate-950 items-center">
                   <div className="flex items-center gap-2">
                     <span className="text-white font-bold text-sm">Escena {idx + 1}</span>
                     {idx === 0 && <span className="text-[10px] bg-yellow-500 text-black px-1.5 rounded font-bold">MADRE</span>}
                   </div>
                   <div className="flex gap-2">
                      {imgSrc && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => downloadImage(imgSrc, `scene-${idx+1}.png`)}
                            className="text-indigo-400 hover:text-white"
                        >
                            <Download className="w-4 h-4" />
                        </Button>
                      )}
                      <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRegenerateImage(idx)}
                          isLoading={regeneratingImageIndex === idx}
                          disabled={!imgSrc || regeneratingImageIndex !== null}
                          className="text-slate-400 hover:text-yellow-400"
                          title="Regenerar imagen"
                      >
                          <RefreshCw className="w-4 h-4" />
                      </Button>
                   </div>
                </div>
                <div className="aspect-video bg-black relative group/img cursor-pointer" onClick={() => setPreviewImage(imgSrc)}>
                   {imgSrc && regeneratingImageIndex !== idx ? (
                     <img src={imgSrc} alt={`Scene ${idx+1}`} className="w-full h-full object-cover" />
                   ) : (
                     <div className="flex items-center justify-center h-full text-slate-600">
                        <Loader2 className="w-8 h-8 animate-spin" />
                     </div>
                   )}
                   <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                      <Eye className="w-8 h-8 text-white" />
                   </div>
                </div>
                <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between"> {/* Added flex and justify-between */}
                   <p className="text-xs text-slate-400 line-clamp-2 pr-2">{finalPrompts[idx]}</p>
                   <Button
                      onClick={() => copyToClipboard(finalPrompts[idx])}
                      variant="ghost"
                      size="sm"
                      className="text-slate-500 hover:text-white flex-shrink-0"
                      title="Copiar prompt"
                   >
                      <Copy className="w-3 h-3" />
                   </Button>
                </div>
              </div>
            ))}
          </div>
          
          {/* DON'S STRATEGY DASHBOARD */}
          <div className="max-w-5xl mx-auto bg-slate-800 rounded-2xl p-0 shadow-2xl border border-slate-700 overflow-hidden mb-12">
            <div className="bg-indigo-600 p-6 flex justify-between items-center">
               <div>
                 <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-6 h-6" /> Estrategia de Lanzamiento de Don
                 </h3>
                 <p className="text-indigo-100 text-sm mt-1">Plan personalizado para maximizar visitas en redes.</p>
               </div>
            </div>
            
            {socialStrategy && (
              <div className="p-6 grid md:grid-cols-2 gap-8 animate-fade-in">
                {/* Column 1: Caption & Hooks */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-bold text-indigo-300 uppercase mb-2 flex items-center gap-2">
                       <Target className="w-4 h-4" /> Ganchos Virales
                    </h4>
                    <ul className="space-y-2">
                       {socialStrategy.viralHooks?.map((hook, i) => (
                         <li key={i} className="bg-slate-900/50 p-2 rounded border border-slate-700 text-sm text-white flex justify-between items-center group">
                           <span>"{hook}"</span>
                           <Copy 
                             className="w-3 h-3 text-slate-500 cursor-pointer hover:text-white opacity-0 group-hover:opacity-100 transition-opacity" 
                             onClick={() => copyToClipboard(hook)}
                           />
                         </li>
                       ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-indigo-300 uppercase mb-2 flex items-center gap-2">
                       <Type className="w-4 h-4" /> Descripción / Caption
                    </h4>
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 relative group">
                       <p className="text-sm text-slate-300 whitespace-pre-wrap">{socialStrategy.caption}</p>
                       <Button
                          onClick={() => copyToClipboard(socialStrategy.caption)}
                          variant="ghost" size="sm"
                          className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                    </div>
                  </div>
                  
                  <div>
                     <h4 className="text-sm font-bold text-indigo-300 uppercase mb-2">Hashtags</h4>
                     <p className="text-xs text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono">
                        {socialStrategy.hashtags?.join(' ') || '#content'}
                     </p>
                  </div>
                </div>

                {/* Column 2: Platform Specific Advice */}
                <div className="space-y-4">
                   <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                      <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                        <Video className="w-4 h-4 text-pink-500" /> TikTok Tips
                      </h4>
                      <p className="text-sm text-slate-300">{socialStrategy.platformTips?.tiktok || "Use trendy audio."}</p>
                   </div>
                   <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                      <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                        <Instagram className="w-4 h-4 text-purple-500" /> Instagram Reels
                      </h4>
                      <p className="text-sm text-slate-300">{socialStrategy.platformTips?.instagram || "Share to stories."}</p>
                   </div>
                   <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                      <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                        <Facebook className="w-4 h-4 text-blue-500" /> Facebook
                      </h4>
                      <p className="text-sm text-slate-300">{socialStrategy.platformTips?.facebook || "Engage in comments."}</p>
                   </div>
                   
                   <div className="bg-indigo-900/20 rounded-xl p-4 border border-indigo-500/30 mt-4">
                      <h4 className="font-bold text-indigo-200 mb-1 text-xs uppercase">Mejor hora para publicar</h4>
                      <p className="text-lg font-bold text-white">{socialStrategy.bestTime || "20:00"}</p>
                   </div>
                </div>
              </div>
            )}
          </div>

          <div className="text-center mt-12 pb-12">
            <Button 
              onClick={() => handleNewProduction(true)} 
              variant="primary" 
              size="lg"
              type="button"
            >
              Nueva Producción
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudioView;