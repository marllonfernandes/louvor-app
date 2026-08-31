import React, { useState, useEffect } from 'react';
import { MobileContainer } from './components/layout/MobileContainer';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { AgendaView } from './components/agenda/AgendaView';
import { PlaylistView } from './components/playlist/PlaylistView';
import { TeamView } from './components/team/TeamView';
import { MetricsView } from './components/metrics/MetricsView';
import { SettingsModal } from './components/settings/SettingsModal';
import { ToastContainer, ToastMessage } from './components/ui/Toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginView } from './components/auth/LoginView';
import { 
  subscribeToEvents, 
  saveEvent, 
  updateEventStatus, 
  deleteEvent,
  subscribeToSongs, 
  saveSong, 
  saveBatchSongs,
  deleteSong,
  subscribeToAdoptionSongs,
  saveAdoptionSong,
  voteAdoptionSong,
  approveAdoptionSong,
  rejectAdoptionSong,
  deleteAdoptionSong,
  subscribeToMembers, 
  saveMember, 
  deleteMember, 
  subscribeToTeams, 
  saveTeam, 
  deleteTeam 
} from './services/firestoreService';
import { WorshipEvent, Song, Member, Team, TabType, ConfirmationStatus, AdoptionSong } from './types';

export function AppContent() {
  const { currentUser, userProfile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('agenda');
  const [events, setEvents] = useState<WorshipEvent[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [adoptionSongs, setAdoptionSongs] = useState<AdoptionSong[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [selectedSongFromEvent, setSelectedSongFromEvent] = useState<Song | null>(null);

  const addToast = (title: string, description?: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    setToasts(prev => [...prev, { id, title, description, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Assinatura reativa aos dados (Firestore / Local fallback)
  useEffect(() => {
    const unsubEvents = subscribeToEvents(data => setEvents(data));
    const unsubSongs = subscribeToSongs(data => setSongs(data));
    const unsubAdoptionSongs = subscribeToAdoptionSongs(data => setAdoptionSongs(data));
    const unsubMembers = subscribeToMembers(data => setMembers(data));
    const unsubTeams = subscribeToTeams(data => setTeams(data));

    return () => {
      unsubEvents();
      unsubSongs();
      unsubAdoptionSongs();
      unsubMembers();
      unsubTeams();
    };
  }, []);

  // Handlers para Agenda
  const handleSaveEvent = async (newEvent: Omit<WorshipEvent, 'id'> & { id?: string }) => {
    try {
      const isEditing = Boolean(newEvent.id);
      await saveEvent(newEvent);
      addToast(
        isEditing ? 'Evento Atualizado' : 'Evento Criado', 
        isEditing ? 'As alterações na escala foram salvas com sucesso!' : 'Novo culto/ensaio adicionado à agenda!', 
        'success'
      );
    } catch (err) {
      addToast('Erro', 'Não foi possível salvar o evento.', 'error');
    }
  };

  const handleStatusChange = async (eventId: string, memberName: string, status: ConfirmationStatus) => {
    try {
      await updateEventStatus(eventId, memberName, status);
      const statusLabels = { accepted: 'Confirmado ✅', declined: 'Recusado ❌', pending: 'Pendente ⏳' };
      addToast('Presença Atualizada', `${memberName}: ${statusLabels[status]}`, 'info');
    } catch (err) {
      addToast('Erro', 'Falha ao atualizar status.', 'error');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      addToast('Evento Removido', 'Evento excluído da escala com sucesso.', 'info');
    } catch (err) {
      addToast('Erro', 'Falha ao excluir evento.', 'error');
    }
  };

  // Handlers para Repertório Principal
  const handleSaveSong = async (newSong: Omit<Song, 'id'> & { id?: string }) => {
    try {
      const isEditing = Boolean(newSong.id);
      await saveSong(newSong);
      addToast(
        isEditing ? 'Música Atualizada' : 'Música Cadastrada', 
        `"${newSong.title}" foi salva no repertório!`, 
        'success'
      );
    } catch (err) {
      addToast('Erro', 'Não foi possível salvar a música.', 'error');
    }
  };

  const handleSaveBatchSongs = async (songsList: Omit<Song, 'id'>[]) => {
    try {
      const count = await saveBatchSongs(songsList);
      addToast(
        'Playlist Importada', 
        `${count} novas canções foram adicionadas ao repertório com sucesso!`, 
        'success'
      );
    } catch (err) {
      addToast('Erro', 'Falha ao importar playlist.', 'error');
    }
  };

  const handleDeleteSong = async (songId: string) => {
    try {
      await deleteSong(songId);
      addToast('Música Removida', 'Canção removida do repertório.', 'info');
    } catch (err) {
      addToast('Erro', 'Falha ao excluir música.', 'error');
    }
  };

  // Handlers para Músicas de Adoção & Votação
  const handleSaveAdoptionSong = async (song: Omit<AdoptionSong, 'id'>) => {
    try {
      await saveAdoptionSong(song);
      addToast(
        'Sugestão Enviada',
        `"${song.title}" foi enviada para votação da equipe!`,
        'success'
      );
    } catch (err) {
      addToast('Erro', 'Falha ao enviar sugestão.', 'error');
    }
  };

  const handleVoteAdoptionSong = async (songId: string, voterName: string) => {
    try {
      await voteAdoptionSong(songId, voterName);
      addToast('Voto Computado', `Voto de ${voterName} atualizado com sucesso!`, 'info');
    } catch (err) {
      addToast('Erro', 'Falha ao registrar voto.', 'error');
    }
  };

  const handleApproveAdoptionSong = async (
    adoptionSongId: string,
    approvedSongData: Omit<Song, 'id'>,
    leaderName: string
  ) => {
    try {
      await approveAdoptionSong(adoptionSongId, approvedSongData, leaderName);
      addToast(
        'Música Adotada! 🎉',
        `"${approvedSongData.title}" foi aprovada por ${leaderName} e adicionada ao repertório principal!`,
        'success'
      );
    } catch (err) {
      addToast('Erro', 'Falha ao aprovar música.', 'error');
    }
  };

  const handleRejectAdoptionSong = async (songId: string) => {
    try {
      await rejectAdoptionSong(songId);
      addToast('Sugestão Arquivada', 'A música foi arquivada.', 'info');
    } catch (err) {
      addToast('Erro', 'Falha ao arquivar sugestão.', 'error');
    }
  };

  const handleDeleteAdoptionSong = async (songId: string) => {
    try {
      await deleteAdoptionSong(songId);
      addToast('Sugestão Removida', 'Sugestão excluída com sucesso.', 'info');
    } catch (err) {
      addToast('Erro', 'Falha ao excluir sugestão.', 'error');
    }
  };

  // Handlers para Membros e Times
  const handleSaveMember = async (newMember: Omit<Member, 'id'> & { id?: string }) => {
    try {
      const isEditing = Boolean(newMember.id);
      await saveMember(newMember);
      addToast(
        isEditing ? 'Membro Atualizado' : 'Membro Cadastrado', 
        `${newMember.name} foi salvo na equipe!`, 
        'success'
      );
    } catch (err) {
      addToast('Erro', 'Falha ao salvar membro.', 'error');
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    try {
      await deleteMember(memberId);
      addToast('Membro Removido', 'Integrante removido da equipe.', 'info');
    } catch (err) {
      addToast('Erro', 'Falha ao remover membro.', 'error');
    }
  };

  const handleSaveTeam = async (newTeam: Omit<Team, 'id'> & { id?: string }) => {
    try {
      const isEditing = Boolean(newTeam.id);
      await saveTeam(newTeam);
      addToast(
        isEditing ? 'Time Atualizado' : 'Time Criado', 
        `Equipe "${newTeam.name}" salva com sucesso!`, 
        'success'
      );
    } catch (err) {
      addToast('Erro', 'Falha ao salvar time.', 'error');
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    try {
      await deleteTeam(teamId);
      addToast('Time Removido', 'Equipe excluída com sucesso.', 'info');
    } catch (err) {
      addToast('Erro', 'Falha ao excluir time.', 'error');
    }
  };

  const handleSelectSongFromEvent = (song: Song) => {
    setSelectedSongFromEvent(song);
    setActiveTab('playlist');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!currentUser || !userProfile) {
    return <LoginView />;
  }

  return (
    <MobileContainer>
      {/* Notificações Toast */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Top Header */}
      <Header onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* Conteúdo com Scroll Nativo Confinado e Fluido */}
      <main 
        className="flex-1 min-h-0 p-4 pb-12 overflow-y-auto overscroll-y-contain"
        style={{
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {activeTab === 'agenda' && (
          <AgendaView
            events={events}
            songs={songs}
            members={members}
            teams={teams}
            onStatusChange={handleStatusChange}
            onSaveEvent={handleSaveEvent}
            onDeleteEvent={handleDeleteEvent}
            onSelectSong={handleSelectSongFromEvent}
          />
        )}

        {activeTab === 'playlist' && (
          <PlaylistView
            songs={songs}
            adoptionSongs={adoptionSongs}
            members={members}
            onSaveSong={handleSaveSong}
            onSaveBatchSongs={handleSaveBatchSongs}
            onDeleteSong={handleDeleteSong}
            onSaveAdoptionSong={handleSaveAdoptionSong}
            onVoteAdoptionSong={handleVoteAdoptionSong}
            onApproveAdoptionSong={handleApproveAdoptionSong}
            onRejectAdoptionSong={handleRejectAdoptionSong}
            onDeleteAdoptionSong={handleDeleteAdoptionSong}
            selectedSongFromEvent={selectedSongFromEvent}
            onClearSelectedSong={() => setSelectedSongFromEvent(null)}
          />
        )}

        {activeTab === 'team' && (
          <TeamView
            members={members}
            teams={teams}
            onSaveMember={handleSaveMember}
            onDeleteMember={handleDeleteMember}
            onSaveTeam={handleSaveTeam}
            onDeleteTeam={handleDeleteTeam}
          />
        )}

        {activeTab === 'metrics' && (
          <MetricsView
            events={events}
            songs={songs}
            members={members}
            teams={teams}
            onSelectSong={handleSelectSongFromEvent}
          />
        )}
      </main>

      {/* Navegação Inferior Nativa */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        eventCount={events.length}
        songCount={songs.length}
      />

      {/* Modal de Configurações / Status Cloud Run */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onShowToast={addToast}
      />
    </MobileContainer>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
