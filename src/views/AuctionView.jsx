import { useEffect, useState } from 'react';
import { socket } from '../api/socket';
import { ORDERED_ROLES } from '../constants/roles';

function useCountdown(deadline) {
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    if (!deadline) { setRemaining(null); return; }
    const tick = () => setRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [deadline]);

  return remaining;
}

export default function AuctionView({ state, placeBid, toggleSkipVote, acquireForced, withdrawFromAuction, claimPlayer }) {
  const { auction, participants } = state;
  const budgets = state.budgets || {};
  const myId = socket.id;
  const myBudget = budgets[myId] ?? 0;
  const remainingSeconds = useCountdown(auction?.deadline);
  const [bidInput, setBidInput] = useState('');

  const minNextBid = auction ? (auction.highestBid === 0 ? auction.minBid : auction.highestBid + auction.increment) : 0;

  useEffect(() => {
    if (auction) setBidInput(String(minNextBid));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auction?.player?.id, auction?.highestBid]);

  if (!auction) {
    return (
      <div className="container" style={{ justifyContent: 'center' }}>
        <h2 className="title-font text-muted">EN ATTENTE DU PROCHAIN LOT...</h2>
      </div>
    );
  }

  const isBroke = (id) => (budgets[id] ?? 0) < auction.minBid;

  const isActive = auction.activeIds.includes(myId);
  const iAmBroke = isBroke(myId);
  const solventActiveIds = auction.activeIds.filter(id => !isBroke(id));
  const soleChoice = !auction.forced && auction.activeIds.length === 1;
  const rescuePhase = !auction.forced && !soleChoice && solventActiveIds.length === 0;

  const highestBidder = participants.find(p => p.id === auction.highestBidderId);
  const hasVotedSkip = auction.skipVotes.includes(myId);

  const parsedBid = parseInt(bidInput, 10);
  const bidInvalid = !Number.isFinite(parsedBid) || parsedBid < minNextBid || parsedBid > myBudget;

  const handleBid = () => {
    if (!bidInvalid) placeBid(parsedBid);
  };

  return (
    <div className="container">
      <h1 className="title-font text-cyan" style={{ fontSize: '32px' }}>PHASE D'ENCHÈRES</h1>
      <p className="title-font text-muted" style={{ letterSpacing: '4px', marginBottom: '30px' }}>
        POSTE RECHERCHÉ : {auction.role.toUpperCase()}
      </p>

      <div className="panel" style={{ width: '100%', maxWidth: '520px', textAlign: 'center', marginBottom: '30px' }}>
        <div className="title-font text-muted" style={{ fontSize: '13px', letterSpacing: '2px', marginBottom: '8px' }}>
          {auction.player.role}
        </div>
        <h2 className="title-font" style={{ fontSize: '30px', margin: '0 0 20px 0' }}>{auction.player.name}</h2>

        {auction.forced ? (
          <div>
            <p className="text-muted" style={{ marginBottom: '20px' }}>
              Vous êtes le dernier commandant encore en lice pour ce poste.
              Acquisition obligatoire, fauché ou non.
            </p>
            {isActive ? (
              <button className="btn btn-pink" onClick={acquireForced}>
                ACQUÉRIR {iAmBroke ? `POUR TOUT VOTRE SOLDE (max ${auction.minBid}⚡)` : `POUR ${auction.highestBid > 0 ? auction.highestBid : auction.minBid}⚡`}
              </button>
            ) : (
              <div className="title-font text-muted pulse-text">EN ATTENTE DE L'ACQUISITION...</div>
            )}
          </div>
        ) : soleChoice ? (
          <div>
            <p className="text-muted" style={{ marginBottom: '20px' }}>
              Vous êtes le dernier commandant encore en lice pour ce lot.
              Vous pouvez le récupérer ou y renoncer.
            </p>
            {isActive ? (
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button className="btn btn-pink" onClick={claimPlayer}>
                  RÉCUPÉRER {iAmBroke ? `(max ${auction.minBid}⚡)` : `POUR ${auction.highestBid > 0 ? auction.highestBid : auction.minBid}⚡`}
                </button>
                <button className="btn btn-outline" onClick={withdrawFromAuction}>
                  PASSER
                </button>
              </div>
            ) : (
              <div className="text-muted" style={{ fontStyle: 'italic' }}>Vous n'êtes plus dans la course pour ce lot.</div>
            )}
          </div>
        ) : rescuePhase ? (
          <div>
            <p className="text-pink title-font" style={{ letterSpacing: '1px', marginBottom: '20px' }}>
              LES COMMANDANTS SOLVABLES ONT RENONCÉ
            </p>
            <p className="text-muted" style={{ marginBottom: '20px' }}>
              Ce lot est maintenant proposé aux commandants fauchés. Premier arrivé, premier servi —
              ou passez tous d'un commun accord.
            </p>
            {isActive && iAmBroke ? (
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-pink" onClick={claimPlayer}>
                  RÉCUPÉRER (max {auction.minBid}⚡)
                </button>
                <button
                  className={`btn ${hasVotedSkip ? 'btn-green' : 'btn-outline'}`}
                  onClick={toggleSkipVote}
                >
                  {hasVotedSkip ? 'VOTE ENREGISTRÉ' : 'VOTER POUR PASSER'} ({auction.skipVotes.length}/{auction.activeIds.length})
                </button>
              </div>
            ) : isActive ? (
              <div className="title-font text-muted pulse-text">EN ATTENTE DES COMMANDANTS FAUCHÉS...</div>
            ) : (
              <div className="text-muted" style={{ fontStyle: 'italic' }}>Vous n'êtes plus dans la course pour ce lot.</div>
            )}
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <div className="text-muted" style={{ fontSize: '13px', marginBottom: '4px' }}>MEILLEURE OFFRE</div>
              <div className="title-font text-cyan" style={{ fontSize: '26px' }}>
                {auction.highestBid > 0 ? `${auction.highestBid}⚡` : 'Aucune offre'}
              </div>
              {highestBidder && (
                <div className="text-muted" style={{ fontSize: '14px' }}>par {highestBidder.name}</div>
              )}
              {remainingSeconds !== null && (
                <div className="title-font text-pink pulse-text" style={{ marginTop: '10px', fontSize: '14px' }}>
                  ADJUGÉ DANS {remainingSeconds}S...
                </div>
              )}
            </div>

            {isActive && !iAmBroke ? (
              <>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '16px' }}>
                  <input
                    type="number"
                    min={minNextBid}
                    max={myBudget}
                    value={bidInput}
                    onChange={(e) => setBidInput(e.target.value)}
                    style={{
                      width: '120px', padding: '10px', background: 'var(--bg-card)',
                      border: '1px solid var(--border)', color: 'white', borderRadius: '4px', fontSize: '16px'
                    }}
                  />
                  <button className="btn btn-cyan" onClick={handleBid} disabled={bidInvalid}>
                    ENCHÉRIR
                  </button>
                </div>
                <div className="text-muted" style={{ fontSize: '13px', marginBottom: '20px' }}>
                  Votre budget : {myBudget}⚡ · Mise minimale : {minNextBid}⚡
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button className="btn btn-outline" onClick={withdrawFromAuction}>
                    SE RETIRER
                  </button>
                  {auction.skipEligible && (
                    <button
                      className={`btn ${hasVotedSkip ? 'btn-green' : 'btn-outline'}`}
                      onClick={toggleSkipVote}
                    >
                      {hasVotedSkip ? 'VOTE ENREGISTRÉ' : 'VOTER POUR PASSER'} ({auction.skipVotes.length}/{solventActiveIds.length})
                    </button>
                  )}
                </div>
              </>
            ) : isActive && iAmBroke ? (
              <div className="title-font text-muted pulse-text">
                VOUS N'AVEZ PAS ASSEZ POUR ENCHÉRIR · EN ATTENTE DES SOLVABLES...
              </div>
            ) : (
              <div className="text-muted" style={{ fontStyle: 'italic' }}>Vous n'êtes plus dans la course pour ce lot.</div>
            )}
          </div>
        )}
      </div>

      <div className="draft-grid">
        {participants.map(p => (
          <div key={p.id} className={`roster-card ${auction.activeIds.includes(p.id) ? 'active' : ''}`}>
            <h3
              className="title-font"
              style={{ fontSize: '18px', marginBottom: '6px', borderBottom: '1px solid var(--border)', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between' }}
            >
              <span>{p.name}</span>
              <span className="text-cyan">{budgets[p.id] ?? 0}⚡</span>
            </h3>
            <div>
              {ORDERED_ROLES.map(role => {
                const player = p.roster.find(pro => pro.role === role);
                return player ? (
                  <div key={role} className="player-slot">
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>{player.name}</span>
                    <span className="title-font text-muted" style={{ fontSize: '12px' }}>{player.role}</span>
                  </div>
                ) : (
                  <div key={role} className="player-slot empty">
                    <span className="text-muted" style={{ fontSize: '13px', fontStyle: 'italic' }}>Recherche...</span>
                    <span className="title-font text-muted" style={{ fontSize: '12px' }}>{role}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}