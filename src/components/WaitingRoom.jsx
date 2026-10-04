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
    <div className="w-full max-w-[450px] p-8 bg-bg-panel border border-white/15 rounded-xl shadow-2xl">
      <div>
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-rajdhani text-text-muted m-0 uppercase tracking-widest text-lg">
            Commandants connectés ({humanParticipants.length}/8)
          </h3>
          <span className="font-rajdhani text-accent-cyan text-xs border border-accent-cyan px-2 py-0.5 rounded">
            {MODE_LABELS[state.gameMode] || state.gameMode}
          </span>
        </div>
        <ul className="list-none p-0 m-0 mb-7">
          {humanParticipants.map(p => (
            <li
              key={p.id}
              className="px-4 py-3 bg-bg-card mb-2 rounded flex justify-between items-center"
            >
              <span className={p.id === socket.id ? "font-semibold" : "font-normal"}>
                {p.name}
              </span>
              {p.id === socket.id && (
                <span className="text-accent-cyan font-rajdhani text-sm uppercase tracking-wider">
                  Vous
                </span>
              )}
            </li>
          ))}
        </ul>
        {humanParticipants.length >= 1 && (
          <button 
            className="w-full font-rajdhani font-bold tracking-wider uppercase py-3 px-7 bg-accent-green text-black rounded hover:bg-[#00b25c] hover:-translate-y-0.5 transition-all shadow-green hover:shadow-green-hover" 
            onClick={startDraft}
          >
            Lancer la séquence
          </button>
        )}
      </div>
    </div>
  );
}