import React, { useState, useEffect } from 'react';
import { Team, Member } from '../../types';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Users, Check, Search, X } from 'lucide-react';

interface AddTeamBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  onSaveTeam: (team: Omit<Team, 'id'> & { id?: string }) => void;
  teamToEdit?: Team | null;
}

const ROLE_CATEGORIES = [
  'Todos',
  'Vocais',
  'Cordas',
  'Teclas',
  'Bateria',
  'Mídia & Som'
];

export const AddTeamBottomSheet: React.FC<AddTeamBottomSheetProps> = ({
  isOpen,
  onClose,
  members,
  onSaveTeam,
  teamToEdit
}) => {
  const [name, setName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  useEffect(() => {
    if (teamToEdit) {
      setName(teamToEdit.name || '');
      setSelectedMembers(teamToEdit.members || []);
    } else {
      setName('');
      setSelectedMembers([]);
    }
    setSearchTerm('');
    setSelectedCategory('Todos');
  }, [teamToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSaveTeam({
      ...(teamToEdit?.id ? { id: teamToEdit.id } : {}),
      name: name.trim(),
      members: selectedMembers
    });

    onClose();
  };

  const toggleMember = (memberName: string) => {
    setSelectedMembers(prev =>
      prev.includes(memberName)
        ? prev.filter(n => n !== memberName)
        : [...prev, memberName]
    );
  };

  const isInCategory = (role: string, category: string): boolean => {
    if (category === 'Todos') return true;
    const r = role.toLowerCase();
    if (category === 'Vocais') return r.includes('vocal') || r.includes('ministro') || r.includes('voz');
    if (category === 'Cordas') return r.includes('violão') || r.includes('guitarra') || r.includes('baixo') || r.includes('cordas');
    if (category === 'Teclas') return r.includes('teclado') || r.includes('piano') || r.includes('synth');
    if (category === 'Bateria') return r.includes('bateria') || r.includes('percussão') || r.includes('cajon') || r.includes('metais') || r.includes('sax');
    if (category === 'Mídia & Som') return r.includes('som') || r.includes('sonoplastia') || r.includes('mídia') || r.includes('projeção') || r.includes('iluminação');
    return true;
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCat = isInCategory(member.role, selectedCategory);

    return matchesSearch && matchesCat;
  });

  const handleSelectAllFiltered = () => {
    const filteredNames = filteredMembers.map(m => m.name);
    const allSelected = filteredNames.every(n => selectedMembers.includes(n));

    if (allSelected) {
      setSelectedMembers(prev => prev.filter(n => !filteredNames.includes(n)));
    } else {
      setSelectedMembers(prev => Array.from(new Set([...prev, ...filteredNames])));
    }
  };

  const isEditing = Boolean(teamToEdit);

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Editar Equipe de Louvor" : "Criar Equipe / Time de Louvor"}
      subtitle={isEditing ? "Adicione ou remova integrantes desta equipe" : "Agrupe os músicos em times fixos (ex: Time Alfa, Jovens)"}
      maxHeight="max-h-[92vh]"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <Input
          label="Nome da Equipe"
          placeholder="Ex: Time Alfa (Domingo Noite)"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          icon={<Users size={15} />}
        />

        {/* Seção de Integrantes */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Integrantes da Equipe
              </label>
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                {selectedMembers.length} {selectedMembers.length === 1 ? 'membro' : 'membros'}
              </span>
            </div>

            {filteredMembers.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:text-blue-300"
              >
                {filteredMembers.every(m => selectedMembers.includes(m.name))
                  ? 'Desmarcar Todos'
                  : 'Selecionar Todos'}
              </button>
            )}
          </div>

          {/* Barra de Busca de Integrantes */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nome ou instrumento..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-0.5"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filtro de Categorias de Instrumento */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {ROLE_CATEGORIES.map(cat => {
              const count = members.filter(m => isInCategory(m.role, cat)).length;
              if (count === 0 && cat !== 'Todos') return null;

              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {/* Lista Espaçosa e Confortável de Integrantes */}
          <div className="max-h-56 sm:max-h-64 overflow-y-auto space-y-1.5 bg-slate-950/80 border border-slate-800 p-2 rounded-2xl overscroll-contain">
            {filteredMembers.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 text-center">Nenhum membro encontrado.</p>
            ) : (
              filteredMembers.map(m => {
                const isSelected = selectedMembers.includes(m.name);
                const initials = m.name
                  .split(' ')
                  .slice(0, 2)
                  .map(n => n[0])
                  .join('')
                  .toUpperCase();

                return (
                  <div
                    key={m.id}
                    onClick={() => toggleMember(m.name)}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-blue-950/40 border-blue-500/40 text-slate-100 shadow-sm'
                        : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 border transition-all ${
                          isSelected
                            ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                            : 'bg-slate-800 border-slate-700 text-transparent'
                        }`}
                      >
                        {isSelected && <Check size={14} className="stroke-[3]" />}
                      </div>

                      <div className="w-8 h-8 rounded-lg bg-slate-800 text-blue-400 font-bold text-xs flex items-center justify-center flex-shrink-0 border border-slate-700">
                        {initials}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-100 truncate">{m.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{m.role}</p>
                      </div>
                    </div>

                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 flex-shrink-0">
                      {m.role}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t border-slate-800">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" fullWidth>
            {isEditing ? "Salvar Alterações" : "Criar Equipe"}
          </Button>
        </div>
      </form>
    </BottomSheet>
  );
};
