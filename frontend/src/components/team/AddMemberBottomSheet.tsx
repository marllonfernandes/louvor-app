import React, { useState, useEffect } from 'react';
import { Member, MemberRole } from '../../types';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { User, Phone, Check, Crown, Sparkles, Mail, Shield, Eye, Edit2, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.systemRole === 'Admin';
  const isLeader = ['Admin', 'Editor'].includes(userProfile?.systemRole || '');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['Vocal']);
  const [phone, setPhone] = useState('');
  const [systemRole, setSystemRole] = useState<'Admin' | 'Editor' | 'Viewer'>('Viewer');

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
    } else {
      setName('');
      setEmail('');
      setSelectedRoles(['Vocal']);
      setPhone('');
      setSystemRole('Viewer');
    }
  }, [memberToEdit, isOpen]);

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
      active: memberToEdit?.active ?? true
    });

    onClose();
  };

  const isEditing = Boolean(memberToEdit);

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Editar Integrante" : "Cadastrar Novo Integrante"}
      subtitle={isEditing ? "Atualize as funções, contatos e instrumentos" : "Adicione líderes, músicos, vocais e equipe técnica"}
      maxHeight="max-h-[92vh]"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
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
