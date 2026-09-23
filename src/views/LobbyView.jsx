import JoinForm from '../components/JoinForm';
import ModeSelect from '../components/ModeSelect';
import WaitingRoom from '../components/WaitingRoom';

export default function LobbyView({ state, hasJoined, pseudo, setPseudo, joinLobby, selectMode, startDraft }) {
  return (
    <div className="container" style={{ justifyContent: 'center' }}>
      <h1 className="title-font" style={{ fontSize: '42px', marginBottom: '40px', color: 'var(--accent-cyan)' }}>
        NEXUS ESPORT DRAFT
      </h1>

      {!hasJoined ? (
        <JoinForm pseudo={pseudo} setPseudo={setPseudo} joinLobby={joinLobby} />
      ) : state.gameMode === null ? (
        <ModeSelect selectMode={selectMode} />
      ) : (
        <WaitingRoom state={state} startDraft={startDraft} />
      )}
    </div>
  );
}
