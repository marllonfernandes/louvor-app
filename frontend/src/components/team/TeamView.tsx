import React, { useState } from 'react';
import { Plus, Users, UserPlus, Search } from 'lucide-react';
import { Member, Team } from '../../types';
import { MemberCard } from './MemberCard';
import { TeamCard } from './TeamCard';
import { MemberDetailModal } from './MemberDetailModal';
import { TeamDetailModal } from './TeamDetailModal';
import { AddMemberBottomSheet } from './AddMemberBottomSheet';
import { AddTeamBottomSheet } from './AddTeamBottomSheet';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

interface TeamViewProps {
  members: Member[];
  teams: Team[];
  onSaveMember: (member: Omit<Member, 'id'> & { id?: string }) => void;
  onDeleteMember: (id: string) => void;
  onSaveTeam: (team: Omit<Team, 'id'> & { id?: string }) => void;
  onDeleteTeam: (id: string) => void;
}

export const TeamView: React.FC<TeamViewProps> = ({
  members,
  teams,
  onSaveMember,
  onDeleteMember,
  onSaveTeam,
  onDeleteTeam
}) => {
  const [subTab, setSubTab] = useState<'teams' | 'members'>('teams');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
  
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const [teamToEdit, setTeamToEdit] = useState<Team | null>(null);
  const [memberToEdit, setMemberToEdit] = useState<Member | null>(null);

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTeams = teams.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.members.some(m => m.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const { userProfile } = useAuth();
  const isLeader = ['Admin', 'Editor'].includes(userProfile?.systemRole || '');

  const handleOpenCreateTeam = () => {
    setTeamToEdit(null);
    setIsAddTeamOpen(true);
  };

  const handleOpenEditTeam = (team: Team) => {
    setTeamToEdit(team);
    setIsAddTeamOpen(true);
  };

  const handleOpenCreateMember = () => {
    setMemberToEdit(null);
    setIsAddMemberOpen(true);
  };

  const handleOpenEditMember = (member: Member) => {
    setMemberToEdit(member);
    setIsAddMemberOpen(true);
  };

  return (
    <div className="space-y-4 text-left">
      {/* Topo com proporção elegante para mobile */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg sm:text-xl font-black text-slate-100 tracking-tight truncate">Equipe</h2>
          <p className="text-xs text-slate-400 truncate">Músicos, vocais e times</p>
        </div>

        <div className="flex-shrink-0">
          {subTab === 'teams' ? (
            isLeader && (
              <Button
                onClick={handleOpenCreateTeam}
                size="sm"
                className="flex-shrink-0 whitespace-nowrap px-3.5 py-2.5 text-xs sm:text-sm"
                icon={<Plus size={16} />}
              >
                Novo Time
              </Button>
            )
          ) : (
            isLeader && (
              <Button
                onClick={handleOpenCreateMember}
                size="sm"
                className="flex-shrink-0 whitespace-nowrap px-3.5 py-2.5 text-xs sm:text-sm"
                icon={<UserPlus size={16} />}
              >
                Novo Membro
              </Button>
            )
          )}
        </div>
      </div>

      {/* Segmented Control (Times vs Membros) */}
      <div className="grid grid-cols-2 p-1 bg-slate-950/90 rounded-2xl border border-slate-800 shadow-inner">
        <button
          onClick={() => setSubTab('teams')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            subTab === 'teams'
              ? 'bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users size={15} />
          <span>Equipes ({teams.length})</span>
        </button>
        <button
          onClick={() => setSubTab('members')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            subTab === 'members'
              ? 'bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserPlus size={15} />
          <span>Membros ({members.length})</span>
        </button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder={subTab === 'teams' ? "Buscar por time ou membro..." : "Buscar por nome ou instrumento..."}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-slate-950/90 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-inner"
        />
      </div>

      {/* Conteúdo da Subaba */}
      {subTab === 'teams' ? (
        <div className="space-y-3">
          {filteredTeams.length === 0 ? (
            <div className="bg-slate-800/40 border border-dashed border-slate-700/80 rounded-3xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                <Users size={24} />
              </div>
              <p className="text-sm font-bold text-slate-200">Nenhum time de louvor criado</p>
              <p className="text-xs text-slate-400">Crie times para facilitar a escala automática dos cultos.</p>
              {isLeader && (
                <Button size="sm" onClick={handleOpenCreateTeam} icon={<Plus size={16} />}>
                  Criar Primeiro Time
                </Button>
              )}
            </div>
          ) : (
            filteredTeams.map(team => (
              <TeamCard
                key={team.id}
                team={team}
                allMembers={members}
                onSelectTeam={setSelectedTeam}
                onEditTeam={handleOpenEditTeam}
                onDeleteTeam={onDeleteTeam}
              />
            ))
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredMembers.length === 0 ? (
            <div className="bg-slate-800/40 border border-dashed border-slate-700/80 rounded-3xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                <UserPlus size={24} />
              </div>
              <p className="text-sm font-bold text-slate-200">Nenhum membro encontrado</p>
              {isLeader && (
                <Button size="sm" onClick={handleOpenCreateMember} icon={<UserPlus size={16} />}>
                  Adicionar Membro
                </Button>
              )}
            </div>
          ) : (
            filteredMembers.map(member => (
              <MemberCard
                key={member.id}
                member={member}
                onSelectMember={setSelectedMember}
                onEditMember={handleOpenEditMember}
                onDeleteMember={onDeleteMember}
              />
            ))
          )}
        </div>
      )}

      {/* Modais de Detalhes em Tela Inteira ao Toque */}
      <MemberDetailModal
        isOpen={Boolean(selectedMember)}
        onClose={() => setSelectedMember(null)}
        member={selectedMember}
        teams={teams}
        onEditMember={handleOpenEditMember}
        onDeleteMember={onDeleteMember}
      />

      <TeamDetailModal
        isOpen={Boolean(selectedTeam)}
        onClose={() => setSelectedTeam(null)}
        team={selectedTeam}
        allMembers={members}
        onEditTeam={handleOpenEditTeam}
        onDeleteTeam={onDeleteTeam}
      />

      {/* Modais de Cadastro / Edição */}
      <AddMemberBottomSheet
        isOpen={isAddMemberOpen}
        onClose={() => {
          setIsAddMemberOpen(false);
          setMemberToEdit(null);
        }}
        onSaveMember={onSaveMember}
        memberToEdit={memberToEdit}
      />

      <AddTeamBottomSheet
        isOpen={isAddTeamOpen}
        onClose={() => {
          setIsAddTeamOpen(false);
          setTeamToEdit(null);
        }}
        members={members}
        onSaveTeam={onSaveTeam}
        teamToEdit={teamToEdit}
      />
    </div>
  );
};
