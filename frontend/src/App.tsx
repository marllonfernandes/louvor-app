import React, { useState, useEffect } from 'react';
import { MobileContainer } from './components/layout/MobileContainer';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { HomeView } from './components/home/HomeView';
import { AgendaView } from './components/agenda/AgendaView';
import { PlaylistView } from './components/playlist/PlaylistView';
import { TeamView } from './components/team/TeamView';
import { MetricsView } from './components/metrics/MetricsView';
import { LiveStageChordModal } from './components/stage/LiveStageChordModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { NotificationCenterModal } from './components/notifications/NotificationCenterModal';
import { ToastContainer, ToastMessage } from './components/ui/Toast';
import { AppLoadingSkeleton } from './components/ui/Skeleton';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginView } from './components/auth/LoginView';
import { ReloadPrompt } from './components/pwa/ReloadPrompt';
import { 
  subscribeToEvents, 
  saveEvent, 
  saveBatchEvents,
  updateEventStatus, 
  deleteEvent,
  subscribeToSongs, 
  saveSong, 
  saveBatchSongs,
  deleteSong,
  deleteRepertoireGroup,
  assignSongsToGroup,
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
import {
  subscribeToNotifications,
  syncExistingPushSubscription,
  notifyEventSaved,
  notifyPresenceChanged
} from './services/notificationService';
import { isSamePersonName } from './utils/avatar';
import { WorshipEvent, Song, Member, Team, TabType, ConfirmationStatus, AdoptionSong, AppNotification } from './types';

export function AppContent() {
  const { currentUser, userProfile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('inicio');
  const [events, setEvents] = useState<WorshipEvent[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [adoptionSongs, setAdoptionSongs] = useState<AdoptionSong[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [selectedSongFromEvent, setSelectedSongFromEvent] = useState<Song | null>(null);
  const [selectedEventFromNotification, setSelectedEventFromNotification] = useState<WorshipEvent | null>(null);
  const [selectedStageSong, setSelectedStageSong] = useState<Song | null>(null);

  const addToast = (title: string, description?: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    setToasts(prev => [...prev, { id, title, description, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Assinatura reativa aos dados (Firestore / Local fallback)
  useEffect(() => {
    if (!currentUser) return; // Só tenta buscar dados do Firestore após estar autenticado

    const unsubEvents = subscribeToEvents(data => setEvents(data));
    const unsubSongs = subscribeToSongs(data => setSongs(data));
    const unsubAdoptionSongs = subscribeToAdoptionSongs(data => setAdoptionSongs(data));
    const unsubMembers = subscribeToMembers(data => setMembers(data));
    const unsubTeams = subscribeToTeams(data => setTeams(data));
    const unsubNotifications = subscribeToNotifications(data => setNotifications(data));

    return () => {
      unsubEvents();
      unsubSongs();
      unsubAdoptionSongs();
      unsubMembers();
      unsubTeams();
      unsubNotifications();
    };
  }, [currentUser]);

  // Sincroniza silenciosamente a assinatura Push do aparelho quando o perfil e os membros carregam
  useEffect(() => {
    if (userProfile && members.length > 0) {
      syncExistingPushSubscription(userProfile, members);
    }
  }, [userProfile, members]);

  // Abre o evento diretamente caso o usuário toque em uma notificação Push (via URL ?eventId=... ou mensagem do Service Worker)
  useEffect(() => {
    if (events.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const eventIdParam = params.get('eventId');
    if (eventIdParam) {
      const target = events.find(e => e.id === eventIdParam);
      if (target) {
        setActiveTab('agenda');
        setSelectedEventFromNotification(target);
      }
      params.delete('eventId');
      const newSearch = params.toString();
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname + (newSearch ? `?${newSearch}` : '')
      );
    }

    const handleSwMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OPEN_EVENT_FROM_NOTIFICATION' && event.data?.eventId) {
        const target = events.find(e => e.id === event.data.eventId);
        if (target) {
          setActiveTab('agenda');
          setSelectedEventFromNotification(target);
        }
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
      return () => navigator.serviceWorker.removeEventListener('message', handleSwMessage);
    }
  }, [events]);

  // Handlers para Agenda
  const handleSaveEvent = async (newEvent: Omit<WorshipEvent, 'id'> & { id?: string }) => {
    try {
      const isEditing = Boolean(newEvent.id);
      const previousEvent = newEvent.id ? events.find(e => e.id === newEvent.id) : undefined;
      const savedId = await saveEvent(newEvent);
      const savedEventObj: WorshipEvent = { ...newEvent, id: savedId };

      addToast(
        isEditing ? 'Evento Atualizado' : 'Evento Criado', 
        isEditing ? 'As alterações na escala foram salvas com sucesso!' : 'Novo culto/ensaio adicionado à agenda!', 
        'success'
      );

      // Dispara notificação no celular dos membros escalados (mesmo com app fechado) + Sininho
      notifyEventSaved(previousEvent, savedEventObj, members, userProfile?.name).catch(err =>
        console.warn('[Push] Falha ao notificar mudança no evento:', err)
      );
    } catch (err) {
      addToast('Erro', 'Não foi possível salvar o evento.', 'error');
    }
  };

  const handleBatchSaveEvents = async (eventsList: Omit<WorshipEvent, 'id'>[]) => {
    try {
      const count = await saveBatchEvents(eventsList);
      addToast(
        'Mês Gerado', 
        `${count} novos eventos foram criados na agenda!`, 
        'success'
      );
    } catch (err) {
      addToast('Erro', 'Falha ao gerar eventos do mês.', 'error');
    }
  };

  const handleStatusChange = async (eventId: string, memberName: string, status: ConfirmationStatus, justification?: string) => {
    try {
      await updateEventStatus(eventId, memberName, status, justification);
      const statusLabels = { accepted: 'Confirmado ✅', declined: 'Recusado ❌', pending: 'Pendente ⏳' };
      addToast('Presença Atualizada', `${memberName}: ${statusLabels[status]}`, 'info');

      const targetEvent = events.find(e => e.id === eventId);
      if (targetEvent) {
        notifyPresenceChanged(targetEvent, memberName, status, justification, members).catch(err =>
          console.warn('[Push] Falha ao notificar mudança de presença:', err)
        );
      }
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
      const groupName = songsList.find(s => s.group?.trim())?.group?.trim();
      if (groupName) {
        addToast(
          'Playlist Importada com Grupo', 
          `${count} novas canções foram adicionadas e organizadas no grupo "${groupName}"!`, 
          'success'
        );
      } else {
        addToast(
          'Playlist Importada', 
          `${count} novas canções foram adicionadas ao repertório com sucesso!`, 
          'success'
        );
      }
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

  const handleDeleteGroup = async (groupName: string, deleteSongsToo: boolean) => {
    try {
      const { affectedCount } = await deleteRepertoireGroup(groupName, deleteSongsToo);
      if (deleteSongsToo) {
        addToast(
          'Grupo e Áudios Excluídos', 
          `O grupo "${groupName}" e ${affectedCount} música(s) foram excluídos do repertório.`, 
          'info'
        );
      } else {
        addToast(
          'Grupo Excluído', 
          `O grupo "${groupName}" foi removido. As ${affectedCount} música(s) continuam no repertório.`, 
          'success'
        );
      }
    } catch (err) {
      addToast('Erro', 'Falha ao excluir grupo de repertório.', 'error');
    }
  };

  const handleSaveGroup = async (groupName: string, selectedSongIds: string[]) => {
    try {
      // 1. Desvincula músicas que pertenciam ao grupo mas foram desmarcadas
      const songsToUnlink = songs.filter(s => s.group === groupName && !selectedSongIds.includes(s.id));
      for (const s of songsToUnlink) {
        await saveSong({ ...s, group: undefined });
      }

      // 2. Vincula músicas selecionadas ao grupo
      if (selectedSongIds.length > 0) {
        await assignSongsToGroup(selectedSongIds, groupName);
      }

      addToast(
        'Grupo Atualizado', 
        `Grupo "${groupName}" salvo com ${selectedSongIds.length} música(s)!`, 
        'success'
      );
    } catch (err) {
      addToast('Erro', 'Falha ao salvar grupo de repertório.', 'error');
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

  const handleDeleteMember = async (memberId: string, memberName?: string) => {
    try {
      await deleteMember(memberId);
      
      if (memberName) {
        // Remover o integrante de todas as sub-equipes
        const affectedTeams = teams.filter(t => t.members.includes(memberName));
        for (const team of affectedTeams) {
          await saveTeam({
            ...team,
            members: team.members.filter(m => m !== memberName)
          });
        }

        // Remover o integrante de todos os eventos/escalas
        const affectedEvents = events.filter(e => e.confirmed && e.confirmed[memberName] !== undefined);
        for (const event of affectedEvents) {
          const { [memberName]: _, ...restConfirmed } = event.confirmed || {};
          await saveEvent({
            ...event,
            confirmed: restConfirmed
          });
        }
      }

      addToast('Membro Removido', 'Integrante removido da equipe com sucesso.', 'info');
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
    return <AppLoadingSkeleton />;
  }

  if (!currentUser || !userProfile) {
    return <LoginView />;
  }

  const isLeaderOrAdmin = ['Admin', 'Editor'].includes(userProfile?.systemRole || '');
  const unreadNotificationsCount = notifications.filter(n => {
    const isForUser =
      isLeaderOrAdmin ||
      n.targetMembers.includes('*') ||
      n.targetMembers.some(t => isSamePersonName(t, userProfile.name));
    if (!isForUser) return false;
    return !n.readBy.some(r => isSamePersonName(r, userProfile.name));
  }).length;

  return (
    <MobileContainer>
      {/* Notificações Toast */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Top Header */}
      <Header
        activeTab={activeTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        unreadNotificationsCount={unreadNotificationsCount}
      />

      {/* Conteúdo com Scroll Nativo Confinado e Fluido */}
      <main 
        className="flex-1 min-h-0 p-4 pb-12 overflow-y-auto overscroll-y-contain"
        style={{
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {activeTab === 'inicio' && (
          <HomeView
            events={events}
            songs={songs}
            members={members}
            onSelectEvent={(ev) => {
              setActiveTab('agenda');
              setSelectedEventFromNotification(ev);
            }}
            onSelectSong={handleSelectSongFromEvent}
            onOpenStageSong={(s) => setSelectedStageSong(s)}
            onStatusChange={handleStatusChange}
            onChangeTab={setActiveTab}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            unreadNotificationsCount={unreadNotificationsCount}
          />
        )}

        {activeTab === 'agenda' && (
          <AgendaView
            events={events}
            songs={songs}
            members={members}
            teams={teams}
            onStatusChange={handleStatusChange}
            onSaveEvent={handleSaveEvent}
            onBatchSaveEvents={handleBatchSaveEvents}
            onDeleteEvent={handleDeleteEvent}
            onSelectSong={handleSelectSongFromEvent}
            selectedEventFromNotification={selectedEventFromNotification}
            onClearSelectedEventFromNotification={() => setSelectedEventFromNotification(null)}
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
            onDeleteGroup={handleDeleteGroup}
            onSaveGroup={handleSaveGroup}
            selectedSongFromEvent={selectedSongFromEvent}
            onClearSelectedSong={() => setSelectedSongFromEvent(null)}
            onOpenStageSong={(s) => setSelectedStageSong(s)}
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

      {/* Cifra ao Vivo no Palco (Live Stage Chord Mode) */}
      <LiveStageChordModal
        isOpen={Boolean(selectedStageSong)}
        onClose={() => setSelectedStageSong(null)}
        song={selectedStageSong}
        setlistSongs={songs}
        onSelectSong={setSelectedStageSong}
        stageMembers={members}
      />

      {/* Navegação Inferior Nativa */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        eventCount={events.length}
        songCount={songs.length}
      />

      {/* Modal de Central de Notificações & Ativação de Push no Celular */}
      <NotificationCenterModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        members={members}
        events={events}
        onSelectEvent={(ev) => {
          setActiveTab('agenda');
          setSelectedEventFromNotification(ev);
        }}
        onShowToast={addToast}
      />

      {/* Modal de Configurações / Status Cloud Run */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onShowToast={addToast}
      />

      <ReloadPrompt />
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
