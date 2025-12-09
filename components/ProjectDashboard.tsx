import React, { useState, useRef } from 'react';
import { Plus, ArrowRight, FolderOpen, Target, Users, Trash2, User, Image as ImageIcon, Upload, Film, Sparkles, UserCheck } from 'lucide-react';
import Button from './Button';
import Input from './Input';
import TextArea from './TextArea';
import { Project, Avatar, VideoReference } from '../types';
import { getMimeType } from '../utils/mediaUtils';

interface ProjectDashboardProps {
  projects: Project[];
  onCreateProject: (project: Omit<Project, 'id' | 'createdAt'> & { videoReference?: VideoReference; characterRole?: string; endingDialogue?: string }) => void;
  onSelectProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
}

const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
  projects,
  onCreateProject,
  onSelectProject,
  onDeleteProject
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);


  // Form State
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState(''); // De qué trata
  const [newAudience, setNewAudience] = useState('');
  const [newGoal, setNewGoal] = useState(''); // Lo que quiero que se haga
  
  // Avatar State
  const [avatarName, setAvatarName] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // New Project Configuration States
  const [newCharacterRole, setNewCharacterRole] = useState('');
  const [newEndingDialogue, setNewEndingDialogue] = useState('');

  // Video Reference State
  const [videoReference, setVideoReference] = useState<VideoReference | undefined>(undefined);
  const [videoFileName, setVideoFileName] = useState<string | null>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const r = new FileReader();
      r.onloadend = () => {
        if (typeof r.result === 'string') {
          setAvatarPreview(r.result);
        }
      };
      r.readAsDataURL(e.target.files[0]);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setVideoFileName(file.name);
      const r = new FileReader();
      r.onloadend = () => {
        if (typeof r.result === 'string') {
          setVideoReference({
            src: r.result,
            mimeType: file.type || 'video/mp4' // Fallback for mimeType
          });
        }
      };
      r.readAsDataURL(file);
    }
  };


  const handleCreate = () => {
    if (!newName.trim()) return;

    let mainAvatar: Avatar | undefined = undefined;
    if (avatarPreview && avatarName) {
      mainAvatar = {
        id: Date.now(),
        src: avatarPreview,
        name: avatarName,
        customPrompt: '',
        profile: '' // Will be analyzed in Studio
      };
    }

    onCreateProject({
      name: newName,
      description: newDesc,
      defaultAudience: newAudience,
      defaultGoal: newGoal,
      themeColor: ['from-blue-500 to-cyan-500', 'from-purple-500 to-pink-500', 'from-orange-500 to-red-500', 'from-green-500 to-emerald-500'][Math.floor(Math.random() * 4)],
      mainAvatar: mainAvatar,
      ideas: [], // Initialize empty idea bank
      videoReference: videoReference, // Include video reference
      characterRole: newCharacterRole.trim() || undefined, // Include character role
      endingDialogue: newEndingDialogue.trim() || undefined // Include ending dialogue
    });

    // Reset
    setIsCreating(false);
    setNewName('');
    setNewDesc('');
    setNewAudience('');
    setNewGoal('');
    setAvatarName('');
    setAvatarPreview(null);
    setVideoReference(undefined);
    setVideoFileName(null);
    setNewCharacterRole('');
    setNewEndingDialogue('');
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in py-8">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Mis Perfiles</h2>
          <p className="text-slate-400">Administra tus canales y define a tus protagonistas.</p>
        </div>
        <Button onClick={() => setIsCreating(true)} variant="primary" size="lg">
          <Plus className="w-5 h-5 mr-2" /> Nuevo Perfil
        </Button>
      </div>

      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-4xl w-full shadow-2xl animate-fade-in my-8">
            <h3 className="text-2xl font-bold text-white mb-6">Crear Nuevo Perfil</h3>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left Column: Project Details */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-indigo-400 uppercase border-b border-indigo-500/30 pb-2 mb-4">
                  1. Detalles del Perfil
                </h4>
                
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Nombre del Perfil</label>
                  <Input 
                    placeholder="Ej: Cocina Vegana con Ana" 
                    value={newName} 
                    onChange={e => setNewName(e.target.value)} 
                    autoFocus 
                  />
                </div>
                
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">¿De qué se va a tratar?</label>
                  <TextArea 
                    placeholder="Describe el tema central. Ej: Recetas fáciles y económicas para estudiantes, con un tono divertido y rápido." 
                    value={newDesc} 
                    onChange={e => setNewDesc(e.target.value)}
                    className="h-24"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Audiencia</label>
                     <Input placeholder="Ej: Estudiantes" value={newAudience} onChange={e => setNewAudience(e.target.value)} />
                  </div>
                  <div>
                     <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Meta Principal</label>
                     <Input placeholder="Ej: Ganar seguidores" value={newGoal} onChange={e => setNewGoal(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Right Column: Avatar and Video Creation */}
              <div className="space-y-6">
                <div className="space-y-4 bg-slate-800/30 p-4 rounded-xl border border-slate-700">
                  <h4 className="text-sm font-bold text-indigo-400 uppercase border-b border-indigo-500/30 pb-2 mb-4 flex items-center gap-2">
                    <User className="w-4 h-4" /> 2. Crear Protagonista
                  </h4>

                  <div className="flex flex-col items-center justify-center mb-4">
                    <div 
                      onClick={() => avatarFileInputRef.current?.click()}
                      className={`relative w-40 h-40 rounded-full overflow-hidden border-2 border-dashed cursor-pointer transition-all ${avatarPreview ? 'border-indigo-500' : 'border-slate-600 hover:border-slate-400 bg-slate-800'}`}
                    >
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500">
                          <ImageIcon className="w-8 h-8 mb-2" />
                          <span className="text-xs uppercase font-bold">Subir Foto</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Upload className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <input type="file" ref={avatarFileInputRef} hidden accept="image/*" onChange={handleAvatarUpload} />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Nombre del Personaje</label>
                    <Input 
                      placeholder="Ej: Chef Ana" 
                      value={avatarName} 
                      onChange={e => setAvatarName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Rol del Personaje</label>
                    <Input 
                      placeholder="Ej: Chef, Creador de Contenido, Profesor..." 
                      value={newCharacterRole} 
                      onChange={e => setNewCharacterRole(e.target.value)}
                    />
                  </div>
                  
                  <div className="bg-indigo-900/20 p-3 rounded-lg border border-indigo-500/20">
                    <p className="text-xs text-indigo-200">
                      <strong>Nota:</strong> Este personaje se guardará automáticamente en el estudio de este perfil. Don analizará su apariencia cuando empieces a crear.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 bg-slate-800/30 p-4 rounded-xl border border-slate-700">
                  <h4 className="text-sm font-bold text-indigo-400 uppercase border-b border-indigo-500/30 pb-2 mb-4 flex items-center gap-2">
                    <Film className="w-4 h-4" /> 3. Video de Referencia (Opcional)
                  </h4>
                  <div className="flex flex-col items-center justify-center">
                    <div 
                      onClick={() => videoFileInputRef.current?.click()}
                      className={`relative w-full h-24 rounded-lg border-2 border-dashed cursor-pointer transition-all flex items-center justify-center ${videoReference ? 'border-green-500' : 'border-slate-600 hover:border-slate-400 bg-slate-800'}`}
                    >
                      {videoFileName ? (
                        <p className="text-sm text-white px-2 truncate">
                           <Film className="w-4 h-4 inline-block mr-2" />
                           {videoFileName}
                        </p>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500">
                          <Upload className="w-6 h-6 mb-2" />
                          <span className="text-xs uppercase font-bold">Subir Video</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Upload className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <input type="file" ref={videoFileInputRef} hidden accept="video/*" onChange={handleVideoUpload} />
                  </div>
                  <div className="bg-indigo-900/20 p-3 rounded-lg border border-indigo-500/20">
                    <p className="text-xs text-indigo-200">
                      <strong>Nota:</strong> Don usará este video para guiar el estilo y el ritmo de las escenas, no para analizar su contenido directamente.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 bg-slate-800/30 p-4 rounded-xl border border-slate-700">
                  <h4 className="text-sm font-bold text-indigo-400 uppercase border-b border-indigo-500/30 pb-2 mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> 4. Frase Final / CTA (Opcional)
                  </h4>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Frase para el final de la historia</label>
                    <Input 
                      placeholder="Ej: ¡Síguenos para más contenido!" 
                      value={newEndingDialogue} 
                      onChange={e => setNewEndingDialogue(e.target.value)}
                    />
                  </div>
                  <div className="bg-indigo-900/20 p-3 rounded-lg border border-indigo-500/20">
                    <p className="text-xs text-indigo-200">
                      <strong>Nota:</strong> Don adaptará esta frase al final de la descripción de tu publicación.
                    </p>
                  </div>
                </div>

              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-800">
              <Button onClick={() => setIsCreating(false)} variant="ghost">Cancelar</Button>
              <Button onClick={handleCreate} variant="primary" disabled={!newName.trim()}>Crear Perfil</Button>
            </div>
          </div>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-dashed border-slate-800">
          <FolderOpen className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-300">No hay perfiles aún</h3>
          <p className="text-slate-500 mb-6">Crea tu primer perfil para definir a tu protagonista y tus metas.</p>
          <Button onClick={() => setIsCreating(true)} variant="primary">Crear Primer Perfil</Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <div 
              key={project.id} 
              className="bg-slate-900 border border-slate-800 rounded-xl p-0 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all group relative overflow-hidden cursor-pointer flex flex-col"
              onClick={() => onSelectProject(project)}
            >
              <div className={`h-2 w-full bg-gradient-to-r ${project.themeColor}`}></div>
              
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                   <div className="flex items-center gap-3">
                     {project.mainAvatar ? (
                       <img src={project.mainAvatar.src} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-slate-600" />
                     ) : (
                       <div className="bg-slate-800 p-2.5 rounded-full">
                          <FolderOpen className="w-5 h-5 text-slate-400" />
                       </div>
                     )}
                     <div>
                       <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">{project.name}</h3>
                       {project.mainAvatar && <p className="text-[10px] text-slate-500 uppercase font-bold">{project.mainAvatar.name}</p>}
                     </div>
                   </div>
                   <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }}
                      className="text-slate-600 hover:text-red-500 p-1.5 rounded hover:bg-slate-800 transition-colors"
                    >
                     <Trash2 className="w-4 h-4" />
                   </button>
                </div>
                
                {project.description && (
                  <div className="mb-4 bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                    <p className="text-xs text-slate-400 line-clamp-3 italic">"{project.description}"</p>
                  </div>
                )}

                <div className="space-y-2 mt-auto">
                   {project.defaultGoal && (
                     <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Target className="w-3 h-3 text-green-500" />
                        <span className="truncate">{project.defaultGoal}</span>
                     </div>
                   )}
                   {project.videoReference && (
                     <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Film className="w-3 h-3 text-purple-500" />
                        <span className="truncate">Video de Referencia Adjunto</span>
                     </div>
                   )}
                   {project.characterRole && (
                     <div className="flex items-center gap-2 text-xs text-slate-400">
                        <UserCheck className="w-3 h-3 text-blue-400" />
                        <span className="truncate">Rol: {project.characterRole}</span>
                     </div>
                   )}
                   {project.endingDialogue && (
                     <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Sparkles className="w-3 h-3 text-pink-400" />
                        <span className="truncate">CTA: {project.endingDialogue}</span>
                     </div>
                   )}
                </div>
              </div>
              
              <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
                 <span className="text-xs text-slate-500">
                    {project.mainAvatar ? 'Protagonista Listo' : 'Sin Avatar'}
                 </span>
                 <div className="flex items-center text-xs font-bold text-indigo-400 group-hover:translate-x-1 transition-transform">
                   Abrir Perfil <ArrowRight className="w-3 h-3 ml-1" />
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectDashboard;