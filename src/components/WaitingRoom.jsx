import { socket } from '../api/socket';

const MODE_LABELS = {
  draft_classique: 'CLASSIQUE',
  draft_aveugle: 'AVEUGLE',
  draft_encheres: 'ENCHÈRES',
  draft_cartes: 'PACKS'
};

export default function WaitingRoom({ state, startDraft }) {
  const humanParticipants = state.participants.filter(p => !p.id.startsWith('bot-'));

  return (
    <div className="panel" style={{ width: '100%', maxWidth: '450px' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 className="title-font text-muted" style={{ margin: 0 }}>
            Commandants connectés ({humanParticipants.length}/8)
          </h3>
          <span
            className="title-font text-cyan"
            style={{ fontSize: '12px', border: '1px solid var(--accent-cyan)', padding: '2px 8px', borderRadius: '4px' }}
          >
            {MODE_LABELS[state.gameMode] || state.gameMode}
          </span>
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 30px 0' }}>
          {humanParticipants.map(p => (
            <li
              key={p.id}
              style={{ padding: '12px 16px', background: 'var(--bg-card)', marginBottom: '8px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}
            >
              <span style={{ fontWeight: p.id === socket.id ? '600' : '400' }}>{p.name}</span>
              {p.id === socket.id && <span className="text-cyan title-font" style={{ fontSize: '14px' }}>Vous</span>}
            </li>
          ))}
        </ul>
        {humanParticipants.length >= 2 && (
          <button className="btn btn-green" style={{ width: '100%' }} onClick={startDraft}>
            Lancer la séquence
          </button>
        )}
      </div>
    </div>
  );
}