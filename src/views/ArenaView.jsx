import React, { useState} from 'react';
import { socket } from '../api/socket';
import { ORDERED_ROLES } from '../constants/roles';
import { CARD_POOL } from '../constants/cardPlayers';
import CardIllustration from '../components/CardIllustration';
import SynergyGauges from '../components/SynergyGauges';
import TeamSkinFrame from '../components/TeamSkinFrame';
import { getSynergy } from '../constants/synergy';
import { getEquippedSkinId } from '../constants/teamSkins';
export default function ArenaView({ match, matchReady, dismissMatch, state, isSpectator = false }) {

  const isReady = match.ready.includes(socket.id);
  const isFinished = match.status === 'finished';
  const isSimulating = match.status === 'simulating_events' || match.status === 'simulating_result';
  
  const getCardById = (id) => CARD_POOL.find(c => c.id === id);
  const handleSkip = () => socket.emit('skip-match', match.id);

  const getPersistentBuffs = (teamSide, role = null) => {
    let total = 0;
    if (match.games) {
      match.games.forEach(game => {
        game.events?.forEach(ev => {
          if (ev.persistentBO && ev.side === teamSide) {
            if (role && ev.targetRoles?.includes(role)) total += ev.ratingDelta;
            else if (!role) {
              const multiplier = ev.targetRoles ? ev.targetRoles.length : 5;
              total += (ev.ratingDelta * multiplier);
            }
          }
        });
      });
    }
    return total;
  };

  const getPlayerBuff = (teamSide, role) => {
    let buff = getPersistentBuffs(teamSide, role); 
    if (isSimulating && match.currentEvents) {
      buff += match.currentEvents.reduce((acc, ev) => {
        if (ev.side === teamSide && ev.targetRoles?.includes(role)) return acc + (ev.ratingDelta || 0); 
        return acc;
      }, 0);
    }
    return buff;
  };

  const getTeamAvg = (team, teamSide) => {
    const baseAvg = team.roster.reduce((a, b) => a + (b.rating || b.overall || 0), 0) / 5;
    let totalBuffsForTeam = getPersistentBuffs(teamSide); 
    if (isSimulating && match.currentEvents) {
      totalBuffsForTeam += match.currentEvents.filter(e => e.side === teamSide).reduce((acc, ev) => {
        const multiplier = ev.targetRoles ? ev.targetRoles.length : 5;
        return acc + (ev.ratingDelta * multiplier);
      }, 0);
    }
    return Math.round(baseAvg + (totalBuffsForTeam / 5) + getSynergy(team.roster).bonus);
  };

  const renderRoster = (team, teamSide) => {
    return (
      <div className="flex flex-wrap gap-3.5 justify-center">
        {ORDERED_ROLES.map(role => {
          const p = team.roster.find(pro => pro.role === role);
          if (!p) return null;
          const baseCard = getCardById(p.id);
          const dynamicCard = baseCard ? { ...baseCard, rating: p.rating, overall: p.rating } : null;
          const buff = getPlayerBuff(teamSide, role);
          
          return (
            <div key={role} className="text-center relative inline-block z-[1]">
              {dynamicCard ? (
                <CardIllustration card={dynamicCard} width={90} />
              ) : (
                <div className="flex justify-between items-center bg-bg-card p-[10px_14px] rounded-md mb-2 text-white">
                  {p.name}
                </div>
              )}
              {buff > 0 && (
                <div className="absolute -top-2.5 -right-2.5 bg-[#00e676] text-black font-extrabold px-2 py-1 rounded-xl text-sm shadow-[0_0_10px_#00e676] animate-[skillPopIn_0.3s_forwards] z-[999]">
                  +{buff}
                </div>
              )}
              {buff < 0 && (
                <div className="absolute -top-2.5 -right-2.5 bg-[#f74242] text-black font-extrabold px-2 py-1 rounded-xl text-sm shadow-[0_0_10px_#f04646] animate-[skillPopIn_0.3s_forwards] z-[999]">
                  {buff}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

    const renderTeamPanel = (team, side) => {
      const synergy = getSynergy(team.roster);
      const rawAvg = team.roster.reduce((a, b) => a + (b.rating || b.overall || 0), 0) / 5;
      const avg = getTeamAvg(team, side);

      return (
        <TeamSkinFrame
          skinId={getEquippedSkinId(state, team.id)}
          highlight={isFinished && match.winner?.id === team.id}
          className="flex-1 p-8"
        >
          <h2 className="font-rajdhani mb-6 text-center flex flex-col items-center gap-3 uppercase">
            <div className="flex flex-col items-center gap-2">
              {team.logo ? (
                <img
                  src={team.logo}
                  className="w-[60px] h-[60px] object-contain"
                  style={{ filter: 'var(--sk-logo-filter, none)' }}
                  alt={`logo ${side}`}
                />
              ) : (
                <div className="w-[60px] h-[60px] bg-[#2B3040] rounded-xl" />
              )}
              <span className="text-[26px]">{team.name}</span>
            </div>
            <div className="text-base text-[color:var(--sk-muted,#8b9bb4)]">
              MOYENNE : <span className={avg > rawAvg ? 'text-[color:var(--sk-good,#00e676)]' : ''}>{avg}</span>
            </div>
            <SynergyGauges synergy={synergy} compact />
          </h2>
          {renderRoster(team, side)}
        </TeamSkinFrame>
      );
    
  };

  const getMatchTitle = (id) => {
    if (id.includes('gf')) return 'GRANDE FINALE';
    if (id.includes('sw')) return "SWISS STAGE";
    if (id.includes('qf')) return 'QUART DE FINALE';
    if (id.includes('sf')) return 'DEMI-FINALE';
    if (id.includes('f-')) return 'GRANDE FINALE';
    if (id.match(/m1|m2/)) return "MATCH D'OUVERTURE";
    if (id.includes('winner')) return "MATCH DES GAGNANTS";
    if (id.includes('loser')) return "MATCH ÉLIMINATOIRE";
    if (id.includes('decider')) return "MATCH DÉCISIF";
    return "AFFRONTEMENT OFFICIEL";
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center font-sans">
      <style>{`
        @keyframes skillPopIn { 0% { opacity: 0; transform: scale(0.8); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
      
      <h1 className="font-rajdhani text-accent-cyan text-[32px] uppercase tracking-wide">CONFRONTATION PROTOCOLE</h1>
      <p className="font-rajdhani text-text-muted text-[18px] tracking-[4px] uppercase">
        {getMatchTitle(match.id)} {isSpectator && "- MODE SPECTATEUR"}
      </p>
      
      <div className="flex w-full max-w-[1300px] gap-10 items-center mt-10">
        
        {renderTeamPanel(match.teamA, 'A')}

        {/* SIMULATION AU CENTRE */}
        <div className="text-center w-[380px] shrink-0 flex flex-col justify-center px-5 relative">
          
          {isSimulating && !isSpectator && (
            <div className="mb-5">
                <button 
                  className="bg-transparent border-2 border-text-muted text-text-main py-2 px-4 rounded text-xs font-rajdhani font-bold uppercase tracking-wider whitespace-nowrap transition-colors hover:border-accent-cyan hover:text-accent-cyan" 
                  onClick={handleSkip}
                >
                    PASSER L'ANIMATION ⏭
                </button>
            </div>
          )}

          <div 
            className={`font-rajdhani text-[72px] text-text-muted transition-all duration-300 uppercase ${isSimulating ? 'text-accent-pink drop-shadow-[0_0_20px_rgba(255,51,102,0.6)] animate-pulse-fast' : 'drop-shadow-[0_0_20px_rgba(255,51,102,0)]'}`}
          >
            {match.scoreA} - {match.scoreB}
          </div>
          
          <div className="mt-[30px] min-h-[140px] flex flex-col justify-center items-center">
            {match.status === 'pending' && !isSpectator && (
              <button 
                className={`w-full font-rajdhani font-bold text-base uppercase tracking-wider py-3 px-7 rounded transition-all ${isReady ? 'bg-transparent border-2 border-text-muted text-text-main opacity-50 cursor-not-allowed' : 'bg-accent-pink text-black shadow-pink hover:bg-[#ff1a53] hover:-translate-y-0.5'}`} 
                onClick={() => matchReady(match.id)} 
                disabled={isReady}
              >
                {isReady ? 'SYSTÈME ARMÉ...' : 'ARMER LA SÉQUENCE'}
              </button>
            )}
            
            {match.status === 'pending' && isSpectator && (
              <div className="font-rajdhani text-accent-pink text-[18px] tracking-[2px] uppercase animate-pulse-fast">
                EN ATTENTE DES JOUEURS...
              </div>
            )}

           {match.status === 'simulating_events' && (
            <div className="w-full">
              {match.currentEvents?.filter(ev => ev.label).length > 0 ? (
               <div className="flex flex-col gap-4">
                  {match.currentEvents.filter(ev => ev.label).map((ev, index) => {
                    const eventColor = ev.side === 'A' ? '#00e5ff' : ev.side === 'B' ? '#ff3366' : '#8b9bb4';
                    return (
                      <div key={`${match.currentEvents.length}-${index}`} className="w-full flex flex-col gap-3 animate-[skillPopIn_0.4s_forwards]">
                        <div 
                          className="font-sans text-base font-semibold text-center leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                          style={{ color: eventColor }}
                        >
                          {ev.label}
                        </div>
                        {ev.image && (
                          <div className="w-full rounded bg-[#0A0A0C] border border-[#2A2C36] overflow-hidden flex justify-center">
                            <img src={ev.image} alt="Illustration" className="w-full h-auto max-h-[180px] object-cover" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="font-rajdhani text-accent-cyan text-[16px] tracking-[2px] uppercase animate-pulse-fast">
                    LANCEMENT DE LA PARTIE...
                  </div>
                  <div className="text-xs text-text-muted italic">Les équipes entrent dans la Faille</div>
                </div>
              )}
            </div>
          )}
            
            {match.status === 'simulating_result' && (
               <div className="font-rajdhani text-accent-pink text-[20px] tracking-[2px] uppercase animate-pulse-fast">
                 CALCUL DE L'ISSUE...
               </div>
            )}

            {isFinished && (
              <div className="w-full animate-[fadeIn_0.5s]">
                <div className="font-rajdhani text-accent-cyan text-[24px] mb-5 uppercase">
                  VICTOIRE DE<br/><span className="text-[32px] text-white">{match.winner.name}</span>
                </div>
                <button 
                  className="w-full font-rajdhani font-bold text-base uppercase tracking-wider py-3 px-7 bg-accent-cyan text-black rounded shadow-cyan hover:bg-[#00b3cc] hover:-translate-y-0.5 transition-all" 
                  onClick={() => dismissMatch(match.id)}
                >
                    {isSpectator ? "Quitter le mode spectateur" : "Poursuivre"}
                </button>
              </div>
            )}
          </div>
        </div>

        {renderTeamPanel(match.teamB, 'B')}

      </div>
    </div>
  );
}