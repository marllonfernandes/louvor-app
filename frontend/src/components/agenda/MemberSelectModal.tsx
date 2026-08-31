import React, { useState, useEffect } from 'react';
import { Search, Users, Check, X, Crown } from 'lucide-react';
import { Member } from '../../types';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';

interface MemberSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  selectedMemberNames: string[];
  onConfirm: (selectedMemberNames: string[]) => void;
  title?: string;
  subtitle?: string;
}

const ROLE_CATEGORIES = [
  'Todos',
  'Líderes',
  'Vocais',
  'Cordas',
  'Teclas',
  'Bateria',
  'Mídia & Som'
];

export const MemberSelectModal: React.FC<MemberSelectModalProps> = ({
  isOpen,
  onClose,
  members,
  selectedMemberNames,
  onConfirm,
  title = "Escalar Integrantes",
  subtitle = "Selecione os músicos e vocais para a escala deste evento"
}) => {
  const [tempSelectedNames, setTempSelectedNames] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  useEffect(() => {
    if (isOpen) {
      setTempSelectedNames([...selectedMemberNames]);
      setSearchTerm('');
      setSelectedCategory('Todos');
    }
  }, [isOpen, selectedMemberNames]);

  const toggleMember = (name: string) => {
    setTempSelectedNames(prev =>
      prev.includes(name) ? prev.filter(item => item !== name) : [...prev, name]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredNames = filteredMembers.map(m => m.name);
    const allSelected = filteredNames.every(n => tempSelectedNames.includes(n));

    if (allSelected) {
      setTempSelectedNames(prev => prev.filter(n => !filteredNames.includes(n)));
    } else {
      setTempSelectedNames(prev => Array.from(new Set([...prev, ...filteredNames])));
    }
  };

  const handleClearAll = () => {
    setTempSelectedNames([]);
  };

  const handleApply = () => {
    onConfirm(tempSelectedNames);
    onClose();
  };

  const isMemberInRoleCategory = (member: Member, category: string): boolean => {
    if (category === 'Todos') return true;
    const allRolesText = [
      member.role || '',
      ...(member.roles || [])
    ].join(' ').toLowerCase();

    if (category === 'Líderes') return allRolesText.includes('líder') || allRolesText.includes('lider');
    if (category === 'Vocais') return allRolesText.includes('vocal') || allRolesText.includes('ministro') || allRolesText.includes('voz');
    if (category === 'Cordas') return allRolesText.includes('violão') || allRolesText.includes('guitarra') || allRolesText.includes('baixo') || allRolesText.includes('cordas');
    if (category === 'Teclas') return allRolesText.includes('teclado') || allRolesText.includes('piano') || allRolesText.includes('synth');
    if (category === 'Bateria') return allRolesText.includes('bateria') || allRolesText.includes('percussão') || allRolesText.includes('cajon') || allRolesText.includes('metais') || allRolesText.includes('sax');
    if (category === 'Mídia & Som') return allRolesText.includes('som') || allRolesText.includes('sonoplastia') || allRolesText.includes('mídia') || allRolesText.includes('projeção') || allRolesText.includes('iluminação');
    return true;
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.roles && member.roles.some(r => r.toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesCat = isMemberInRoleCategory(member, selectedCategory);

    return matchesSearch && matchesCat;
  });

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      maxHeight="max-h-[92vh]"
    >
      <div className="flex flex-col h-full space-y-3.5 text-left">
        {/* Barra de Busca */}
        <div className="relative">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nome ou instrumento..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/90 border border-slate-700/80 rounded-2xl pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-inner"
            autoFocus
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filtro de Categorias de Instrumento */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {ROLE_CATEGORIES.map(cat => {
            const count = members.filter(m => isMemberInRoleCategory(m, cat)).length;
            if (count === 0 && cat !== 'Todos') return null;

            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-950/30'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Resumo e Ações Rápidas */}
        <div className="flex items-center justify-between px-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-200">
              {tempSelectedNames.length} de {members.length} integrante{tempSelectedNames.length === 1 ? '' : 's'}
            </span>
            {tempSelectedNames.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 underline underline-offset-2"
              >
                Limpar
              </button>
            )}
          </div>

          {filteredMembers.length > 0 && (
            <button
              type="button"
              onClick={handleSelectAllFiltered}
              className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:text-blue-300"
            >
              {filteredMembers.every(m => tempSelectedNames.includes(m.name))
                ? 'Desmarcar filtrados'
                : 'Selecionar filtrados'}
            </button>
          )}
        </div>

        {/* Lista Espaçosa de Membros */}
        <div className="space-y-2 max-h-[50vh] sm:max-h-[55vh] overflow-y-auto pr-1 overscroll-contain">
          {filteredMembers.length === 0 ? (
            <div className="bg-slate-950/60 border border-dashed border-slate-800 rounded-2xl p-6 text-center space-y-2">
              <Users size={24} className="mx-auto text-slate-600" />
              <p className="text-sm font-semibold text-slate-300">Nenhum integrante encontrado</p>
              <p className="text-xs text-slate-500">Tente buscar por outro termo ou categoria.</p>
            </div>
          ) : (
            filteredMembers.map(member => {
              const isSelected = tempSelectedNames.includes(member.name);
              const initials = member.name
                .split(' ')
                .slice(0, 2)
                .map(n => n[0])
                .join('')
                .toUpperCase();

              const rolesList = member.roles && member.roles.length > 0
                ? member.roles
                : (member.role ? member.role.split(/[,/]/).map(r => r.trim()).filter(Boolean) : ['Vocal']);
              
              const isLeader = rolesList.includes('Líder');

              return (
                <div
                  key={member.id}
                  onClick={() => toggleMember(member.name)}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer active:scale-[0.99] gap-3 ${
                    isSelected
                      ? 'bg-blue-950/40 border-blue-500/50 shadow-md shadow-blue-950/20'
                      : 'bg-slate-950/80 hover:bg-slate-900 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Checkbox Touch */}
                    <div
                      className={`w-6 h-6 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 border transition-all ${
                        isSelected
                          ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                          : 'bg-slate-900 border-slate-700 text-transparent'
                      }`}
                    >
                      {isSelected && <Check size={15} className="stroke-[3]" />}
                    </div>

                    {/* Avatar do Membro */}
                    <div className={`w-10 h-10 rounded-xl font-black text-xs flex items-center justify-center flex-shrink-0 border ${
                      isLeader
                        ? 'bg-amber-950/50 border-amber-500/40 text-amber-300'
                        : 'bg-slate-800 border-slate-700 text-blue-400'
                    }`}>
                      {initials}
                    </div>

                    {/* Informações */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-slate-100 truncate">{member.name}</p>
                        {isLeader && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded">
                            <Crown size={9} /> Líder
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        {rolesList.map(r => (
                          <span key={r} className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20">
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border flex-shrink-0 ${
                    isSelected
                      ? 'bg-blue-600/20 border-blue-500/30 text-blue-400'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}>
                    {isSelected ? 'Escalado' : 'Disponível'}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé Fixo */}
        <div className="pt-3 border-t border-slate-800 flex gap-2.5">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            fullWidth
            onClick={handleApply}
          >
            Confirmar ({tempSelectedNames.length})
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
};
