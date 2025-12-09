import React, { useState, useCallback, useEffect } from 'react';
import { RefreshCw, Bot } from 'lucide-react';
import StudioView from './components/StudioView';
import ProjectDashboard from './components/ProjectDashboard'; // Renamed to ProfileDashboard conceptually
import { Avatar, LogEntry, ProjectStyle, SocialStrategy, Project, VideoReference } from './types';

const App: React.FC = () => {
  const [productionKey, setProductionKey] = useState(0); // Force component remount

  // Project (Profile) Management State
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('don_projects');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const activeProject = projects.find(p => p.id === activeProjectId) || null;

  const [currentStep, setCurrentStep] = useState(1);
  const [scriptIdea, setScriptIdea] = useState('');
  const [scriptGuidance, setScriptGuidance] = useState('');
  // Marketing State
  const [targetAudience, setTargetAudience] = useState('');
  const [contentGoal, setContentGoal] = useState('');
  
  const [scriptScenes, setScriptScenes] = useState<string[]>([]);
  const [isScripting, setIsScripting] = useState(false);
  const [isReelMode, setIsReelMode] = useState(false);
  const [uploadedCast, setUploadedCast] = useState<Avatar[]>([]);
  const [selectedAvatarIds, setSelectedAvatarIds] = useState<number[]>([]);
  const [editingAvatarId, setEditingAvatarId] = useState<number | null>(null);
  const [avatarModifications, setAvatarModifications] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Image Generation State
  const [generatedImages, setGeneratedImages] = useState<(string | null)[]>([]);
  const [finalPrompts, setFinalPrompts] = useState<string[]>([]);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  
  // Strategy State
  const [socialStrategy, setSocialStrategy] = useState<SocialStrategy | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [projectStyle, setProjectStyle] = useState<ProjectStyle>('animation_3d');

  const projectLanguage = 'Spanish';

  // Persistence
  useEffect(() => {
    localStorage.setItem('don_projects', JSON.stringify(projects));
  }, [projects]);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    const newLog: LogEntry = { message, type, timestamp: Date.now() };
    setLogs((prev) => [newLog, ...prev]);
    console.log(`[${type.toUpperCase()}] ${message}`);
  }, []);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    addLog('Copiado al portapapeles', 'success');
  }, [addLog]);

  const downloadImage = useCallback((base64: string, filename: string) => {
    const link = document.createElement('a');
    link.href = base64;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const handleCreateProject = useCallback((projectData: Omit<Project, 'id' | 'createdAt'> & { videoReference?: VideoReference; characterRole?: string; endingDialogue?: string }) => {
    const newProject: Project = {
      ...projectData,
      id: crypto.randomUUID(),
      createdAt: Date.now()
    };
    setProjects(prev => [...prev, newProject]);
    addLog(`Perfil "${newProject.name}" creado.`, 'success');
  }, [addLog]);

  const handleDeleteProject = useCallback((id: string) => {
    if (window.confirm("¿Estás seguro de eliminar este perfil y sus instrucciones?")) {
      setProjects(prev => prev.filter(p => p.id !== id));
      if (activeProjectId === id) setActiveProjectId(null);
    }
  }, [activeProjectId]);

  const handleUpdateProject = useCallback((updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
  }, []);

  const handleSelectProject = useCallback((project: Project) => {
    setActiveProjectId(project.id);
    handleNewProduction(true, false); // Reset studio state but keep project context
    addLog(`Entrando a perfil: ${project.name}`, 'info');
  }, [addLog]);

  const handleNewProduction = useCallback((force = false, confirm = true) => {
    const skipConfirm = typeof force === 'boolean' && force === true;

    if (!confirm || skipConfirm || window.confirm('¿Iniciar nueva producción? Se perderá el progreso actual.')) {
      setProductionKey(prev => prev + 1);
      
      setCurrentStep(1);
      setScriptIdea('');
      setScriptGuidance('');
      setTargetAudience('');
      setContentGoal('');
      setScriptScenes([]);
      setIsReelMode(false);
      
      setSelectedAvatarIds([]);
      setEditingAvatarId(null);
      setFinalPrompts([]);
      setGeneratedImages([]); // Reset images
      setSocialStrategy(null);
      setAvatarModifications('');
      
      setIsScripting(false);
      setIsGeneratingImages(false);
      
      if (confirm) addLog('Nueva producción iniciada por Don.', 'info');
    }
  }, [addLog]);

  const getVideoPrompt = useCallback((index: number) => {
    return `Animate: ${scriptScenes[index] || "Motion"}`;
  }, [scriptScenes]);

  return (
    <div className="h-full flex flex-col bg-[#0f172a] text-slate-200">
      <header className="border-b border-slate-800 bg-[#0f172a]/95 sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveProjectId(null)}>
            <div className="bg-indigo-600 rounded-lg p-1.5 shadow-lg shadow-indigo-500/30">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                Don
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Director de Arte AI</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeProjectId && (
              <button 
                onClick={() => handleNewProduction(false)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Iniciar nueva producción"
                type="button"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Nueva Producción</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 flex-grow overflow-y-auto">
        {!activeProjectId ? (
          <ProjectDashboard 
            projects={projects}
            onCreateProject={handleCreateProject}
            onSelectProject={handleSelectProject}
            onDeleteProject={handleDeleteProject}
          />
        ) : (
          <StudioView
            key={productionKey}
            activeProject={activeProject} // Pass the entire activeProject object
            onExitProject={() => setActiveProjectId(null)}
            onUpdateProject={handleUpdateProject}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            scriptIdea={scriptIdea}
            setScriptIdea={setScriptIdea}
            scriptGuidance={scriptGuidance}
            setScriptGuidance={setScriptGuidance}
            targetAudience={targetAudience}
            setTargetAudience={setTargetAudience}
            contentGoal={contentGoal}
            setContentGoal={setContentGoal}
            scriptScenes={scriptScenes}
            setScriptScenes={setScriptScenes}
            isScripting={isScripting}
            setIsScripting={setIsScripting}
            isReelMode={isReelMode}
            setIsReelMode={setIsReelMode}
            uploadedCast={uploadedCast}
            setUploadedCast={setUploadedCast}
            selectedAvatarIds={selectedAvatarIds}
            setSelectedAvatarIds={setSelectedAvatarIds}
            editingAvatarId={editingAvatarId}
            setEditingAvatarId={setEditingAvatarId}
            avatarModifications={avatarModifications}
            setAvatarModifications={setAvatarModifications}
            isAnalyzing={isAnalyzing}
            setIsAnalyzing={setIsAnalyzing}
            isGeneratingImages={isGeneratingImages}
            setIsGeneratingImages={setIsGeneratingImages}
            generatedImages={generatedImages}
            setGeneratedImages={setGeneratedImages}
            finalPrompts={finalPrompts}
            setFinalPrompts={setFinalPrompts}
            socialStrategy={socialStrategy}
            setSocialStrategy={setSocialStrategy}
            setPreviewImage={setPreviewImage}
            projectLanguage={projectLanguage}
            addLog={addLog}
            copyToClipboard={copyToClipboard}
            downloadImage={downloadImage}
            handleNewProduction={handleNewProduction}
            getVideoPrompt={getVideoPrompt}
            projectStyle={projectStyle}
            setProjectStyle={setProjectStyle}
          />
        )}
      </main>

      {previewImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-5xl w-full max-h-[90vh]">
            <img src={previewImage} alt="Preview" className="w-full h-full object-contain rounded-lg" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2"
              type="button"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;