import React, { useState, useEffect, useRef } from 'react';
import { Member, MemberRole } from '../../types';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { User, Phone, Check, Crown, Sparkles, Mail, Shield, Eye, Edit2, Lock, Camera, Trash2, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  DICEBEAR_STYLES,
  compressImageToDataUrl,
  isValidAvatarUrl,
  isSamePersonName
} from '../../utils/avatar';
import { MemberAvatar } from '../ui/MemberAvatar';

interface AddMemberBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveMember: (member: Omit<Member, 'id'> & { id?: string }) => void;
  memberToEdit?: Member | null;
}

const ALL_ROLES: { role: MemberRole; isLeader?: boolean }[] = [
  { role: 'Líder', isLeader: true },
  { role: 'Ministro de Louvor' },
  { role: 'Vocal' },
  { role: 'Backing Vocal' },
  { role: 'Teclado' },
  { role: 'Violão' },
  { role: 'Guitarra' },
  { role: 'Baixo' },
  { role: 'Bateria' },
  { role: 'Saxofone / Metais' },
  { role: 'Sonoplastia' },
  { role: 'Mídia / Projeção' },
  { role: 'Outro' }
];

export const AddMemberBottomSheet: React.FC<AddMemberBottomSheetProps> = ({
  isOpen,
  onClose,
  onSaveMember,
  memberToEdit
}) => {
  const { userProfile, currentUser } = useAuth();
  const isAdmin = userProfile?.systemRole === 'Admin';
  const isLeader = ['Admin', 'Editor'].includes(userProfile?.systemRole || '');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['Vocal']);
  const [phone, setPhone] = useState('');
  const [systemRole, setSystemRole] = useState<'Admin' | 'Editor' | 'Viewer'>('Viewer');
  const [avatar, setAvatar] = useState<string>('');
  const [avatarSeedSuffix, setAvatarSeedSuffix] = useState<number>(1);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isEditingSelf = Boolean(
    memberToEdit &&
      (memberToEdit.id === userProfile?.id ||
        (memberToEdit.email && userProfile?.email && memberToEdit.email.toLowerCase() === userProfile.email.toLowerCase()) ||
        isSamePersonName(memberToEdit.name, userProfile?.name))
  );

  useEffect(() => {
    if (memberToEdit) {
      setName(memberToEdit.name || '');
      setEmail(memberToEdit.email || '');
      if (memberToEdit.roles && memberToEdit.roles.length > 0) {
        setSelectedRoles(memberToEdit.roles);
      } else if (memberToEdit.role) {
        // Separa funções caso venham separadas por vírgula ou barra
        const parsed = memberToEdit.role.split(/[,/]/).map(r => r.trim()).filter(Boolean);
        setSelectedRoles(parsed.length > 0 ? parsed : ['Vocal']);
      } else {
        setSelectedRoles(['Vocal']);
      }
      setPhone(memberToEdit.phone || '');
      setSystemRole(memberToEdit.systemRole || (memberToEdit.roles?.includes('Líder') || memberToEdit.role?.includes('Líder') ? 'Editor' : 'Viewer'));
      const initialAvatar = isValidAvatarUrl(memberToEdit.avatar)
        ? memberToEdit.avatar!
        : (isEditingSelf && currentUser?.photoURL ? currentUser.photoURL : '');
      setAvatar(initialAvatar);
    } else {
      setName('');
      setEmail('');
      setSelectedRoles(['Vocal']);
      setPhone('');
      setSystemRole('Viewer');
      setAvatar('');
    }
    setAvatarSeedSuffix(1);
  }, [memberToEdit, isOpen]);

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageToDataUrl(file, 180, 0.82);
      setAvatar(compressed);
    } catch (err) {
      console.error('Erro ao comprimir foto:', err);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleRole = (r: string) => {
    // Apenas líderes/admins podem se autodesignar Líder se já não possuíam o papel
    if (r === 'Líder' && !isLeader && !memberToEdit?.roles?.includes('Líder')) {
      return;
    }

    setSelectedRoles(prev => {
      if (prev.includes(r)) {
        if (prev.length === 1) return prev; // Mantém ao menos 1 função
        return prev.filter(item => item !== r);
      } else {
        return [...prev, r];
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (selectedRoles.length === 0) return;

    // Apenas Administradores podem definir ou alterar o systemRole
    const finalSystemRole = isAdmin 
      ? systemRole 
      : (memberToEdit?.systemRole || 'Viewer');

    onSaveMember({
      ...(memberToEdit || {}),
      name: name.trim(),
      email: email.trim(),
      role: selectedRoles.join(', '),
      roles: selectedRoles,
      systemRole: finalSystemRole,
      phone: phone.trim(),
      avatar: avatar.trim() || undefined,
      active: memberToEdit?.active ?? true
    });

    onClose();
  };

  const isEditing = Boolean(memberToEdit);
  const baseSeed = `${name.trim() || 'Louvor'}-${avatarSeedSuffix}`;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Editar Integrante" : "Cadastrar Novo Integrante"}
      subtitle={isEditing ? "Atualize foto, funções, contatos e instrumentos" : "Adicione líderes, músicos, vocais e equipe técnica"}
      maxHeight="max-h-[92vh]"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {/* Seletor Moderno de Avatar (Foto da Galeria, Google ou Avatares Ilustrados DiceBear) */}
        <div className="bg-slate-50/90 dark:bg-slate-950/80 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={13} className="text-blue-500" />
              Foto / Avatar do Perfil
            </label>
            {avatar && (
              <button
                type="button"
                onClick={() => setAvatar('')}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
              >
                <Trash2 size={11} />
                Usar Iniciais
              </button>
            )}
          </div>

          <div className="flex items-center gap-3.5">
            {/* Preview Grande do Avatar */}
            <div className="relative flex-shrink-0">
              <MemberAvatar
                name={name || 'Membro'}
                avatarUrl={avatar}
                size="lg"
                shape="rounded-2xl"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-md ring-2 ring-white dark:ring-slate-950 active:scale-90 transition-all cursor-pointer"
                title="Enviar foto do celular ou computador"
              >
                <Camera size={13} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoFileChange}
                className="hidden"
              />
            </div>

            {/* Botões Rápidos de Upload / Foto do Google */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  <Camera size={13} />
                  <span>Enviar Foto</span>
                </button>

                {isEditingSelf && currentUser?.photoURL && (
                  <button
                    type="button"
                    onClick={() => setAvatar(currentUser.photoURL!)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-300 dark:border-slate-700 active:scale-95 transition-all cursor-pointer"
                  >
                    <span>Foto do Google</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Envie uma foto da galeria ou escolha um avatar ilustrado abaixo:
              </p>
            </div>
          </div>

          {/* Galeria Rápida de Avatares Ilustrados (DiceBear) */}
          <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                Avatares Ilustrados (toque para escolher):
              </span>
              <button
                type="button"
                onClick={() => setAvatarSeedSuffix(prev => prev + 1)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline active:scale-95 transition-all cursor-pointer"
              >
                <RefreshCw size={11} />
                Gerar novas opções
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {DICEBEAR_STYLES.map((styleOpt) => {
                const presetUrl = styleOpt.buildUrl(baseSeed);
                const isSelected = avatar === presetUrl;
                return (
                  <button
                    key={styleOpt.id}
                    type="button"
                    onClick={() => setAvatar(presetUrl)}
                    className={`flex flex-col items-center gap-1 p-1.5 rounded-xl border transition-all active:scale-95 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-500/15 border-blue-500 ring-1 ring-blue-500/40'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-400/50'
                    }`}
                  >
                    <img
                      src={presetUrl}
                      alt={styleOpt.label}
                      className="w-10 h-10 rounded-xl object-cover bg-slate-100 dark:bg-slate-800"
                      loading="lazy"
                    />
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 truncate max-w-full">
                      {styleOpt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <Input
          label="Nome Completo"
          placeholder="Ex: João Silva"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          icon={<User size={15} />}
        />

        <Input
          label="E-mail (Convite de Acesso)"
          type="email"
          placeholder="joao@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          icon={<Mail size={15} />}
          helperText="Necessário para o integrante conseguir fazer login no aplicativo."
        />

        {/* Múltipla Escolha de Funções */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Funções & Instrumentos ({selectedRoles.length} selecionada{selectedRoles.length === 1 ? '' : 's'})
            </label>
            <span className="text-[10px] text-slate-400">Múltipla escolha</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-950/80 p-2.5 rounded-2xl border border-slate-800 max-h-56 overflow-y-auto overscroll-contain">
            {ALL_ROLES.map(({ role: r, isLeader }) => {
              const isSelected = selectedRoles.includes(r);
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => toggleRole(r)}
                  className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all active:scale-95 ${
                    isLeader
                      ? isSelected
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-950/30'
                        : 'bg-slate-900 border-amber-500/30 text-amber-400/80 hover:bg-slate-800'
                      : isSelected
                      ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-950/30'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    {isLeader && <Crown size={14} className={isSelected ? "text-amber-300" : "text-amber-400"} />}
                    <span className="text-xs font-bold truncate">{r}</span>
                  </div>
                  {isSelected && (
                     <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                       isLeader ? 'bg-amber-400 text-slate-950' : 'bg-white text-blue-600'
                     }`}>
                      <Check size={11} className="stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <Input
          label="Telefone / WhatsApp"
          type="tel"
          placeholder="(11) 99999-9999"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          icon={<Phone size={15} />}
          helperText="Usado para envio de escala e lembretes no WhatsApp."
        />

        {/* Seleção de Permissão / Nível de Acesso */}
        <div>
          <div className="flex items-center justify-between mb-1.5 mt-2">
            <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              {!isAdmin && <Lock size={12} className="text-amber-400" />}
              Nível de Acesso (Permissões)
            </label>
            {!isAdmin && (
              <span className="text-[10px] text-amber-400/90 font-medium">
                Apenas Administrador pode alterar
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { id: 'Admin', label: 'Administrador', desc: 'Acesso total', icon: <Shield size={14} /> },
              { id: 'Editor', label: 'Editor', desc: 'Gerencia eventos e repertório', icon: <Edit2 size={14} /> },
              { id: 'Viewer', label: 'Visualizador', desc: 'Apenas visualiza e confirma', icon: <Eye size={14} /> }
            ].map(roleOption => {
              const isCurrent = systemRole === roleOption.id;
              return (
                <button
                  key={roleOption.id}
                  type="button"
                  disabled={!isAdmin}
                  onClick={() => isAdmin && setSystemRole(roleOption.id as any)}
                  className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                    !isAdmin ? 'cursor-not-allowed opacity-70' : 'active:scale-95'
                  } ${
                    isCurrent
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-md shadow-blue-950/30'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <div className={isCurrent ? 'text-blue-400' : 'text-slate-500'}>
                      {roleOption.icon}
                    </div>
                    <span className={`text-xs font-bold ${isCurrent ? 'text-blue-300' : 'text-slate-300'}`}>
                      {roleOption.label}
                    </span>
                  </div>
                  <span className="text-[10px] leading-tight text-slate-500">
                    {roleOption.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t border-slate-800">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" fullWidth>
            {isEditing ? "Salvar Alterações" : "Salvar Integrante"}
          </Button>
        </div>
      </form>
    </BottomSheet>
  );
};
