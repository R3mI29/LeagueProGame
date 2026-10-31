import React, { useState } from 'react';
import { socket } from '../api/socket';
import { ORDERED_ROLES } from '../constants/roles';
import { CARD_POOL } from '../constants/cardPlayers';
import CardIllustration from '../components/CardIllustration';
import SynergyGauges from '../components/SynergyGauges';
import TeamSkinFrame from '../components/TeamSkinFrame';
import { getSynergy } from '../constants/synergy';
import { getEquippedSkinId } from '../constants/teamSkins';
import { EVENTS } from '../constants/seasonConfig';

// ============================================================================
// 1. COMPOSANTS D'ARRIÈRE-PLAN DÉDIÉS PAR TOURNOI (100% Procédural & GPU-Safe)
// ============================================================================

function FirstStandBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#F0F2F6]">
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% -10%, rgba(255, 92, 0, 0.22) 0%, transparent 65%),
            radial-gradient(ellipse at 50% 115%, rgba(37, 9, 44, 0.1) 0%, transparent 60%)
          `
        }}
      />
      <div 
        className="absolute -top-[140px] -right-[120px] w-[650px] h-[520px] opacity-30"
        style={{
          background: 'linear-gradient(135deg, #FF5C00 0%, #25092C 100%)',
          clipPath: 'polygon(30% 0%, 100% 0%, 70% 100%, 0% 100%)',
          transform: 'rotate(-16deg)'
        }}
      />
      <div 
        className="absolute -bottom-[140px] -left-[120px] w-[650px] h-[480px] opacity-25"
        style={{
          background: 'linear-gradient(135deg, #25092C 0%, #FF5C00 100%)',
          clipPath: 'polygon(25% 0%, 100% 0%, 75% 100%, 0% 100%)',
          transform: 'rotate(-14deg)'
        }}
      />
      <div 
        className="absolute top-0 right-1/3 w-[8px] h-[160%] opacity-40 shadow-[0_0_15px_#FF5C00]"
        style={{
          background: 'linear-gradient(180deg, transparent, #FF5C00 25%, #FF5C00 75%, transparent)',
          transform: 'rotate(24deg)'
        }}
      />
      <div 
        className="absolute top-0 right-[35%] w-[2px] h-[160%] opacity-30"
        style={{
          background: 'linear-gradient(180deg, transparent, #25092C 30%, #25092C 70%, transparent)',
          transform: 'rotate(24deg)'
        }}
      />
      <div 
        className="absolute top-0 left-1/4 w-[5px] h-[160%] opacity-30 shadow-[0_0_10px_#FF5C00]"
        style={{
          background: 'linear-gradient(180deg, transparent, #FF5C00 40%, #25092C 80%, transparent)',
          transform: 'rotate(24deg)'
        }}
      />
      <div 
        className="absolute inset-0 opacity-65"
        style={{
          backgroundImage: `
            repeating-linear-gradient(115deg, transparent, transparent 38px, rgba(255, 92, 0, 0.05) 38px, rgba(255, 92, 0, 0.05) 41px),
            repeating-linear-gradient(-65deg, transparent, transparent 58px, rgba(37, 9, 44, 0.035) 58px, rgba(37, 9, 44, 0.035) 60px),
            linear-gradient(rgba(0, 0, 0, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 0, 0, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: 'auto, auto, 40px 40px, 40px 40px'
        }}
      />
      <div className="absolute top-6 left-8 text-[11px] font-mono tracking-[4px] text-[#25092C]/40 uppercase select-none font-bold">
        // FIRST STAND • GLOBAL OPEN // ARENA PROTOCOL
      </div>
      <div className="absolute bottom-6 right-8 text-[11px] font-mono tracking-[4px] text-[#FF5C00]/50 uppercase select-none font-bold">
        STAGE 01 // RIOT ESPORTS
      </div>
    </div>
  );
}

function MsiBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#07090E]">
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 0%, rgba(230, 25, 43, 0.35) 0%, transparent 60%),
            radial-gradient(circle at 10% 90%, rgba(255, 234, 0, 0.12) 0%, transparent 50%),
            radial-gradient(circle at 90% 90%, rgba(230, 25, 43, 0.2) 0%, transparent 50%)
          `
        }}
      />
      <div 
        className="absolute -top-[120px] left-1/2 -translate-x-1/2 w-[900px] h-[350px] opacity-40 blur-3xl"
        style={{
          background: 'radial-gradient(ellipse, #E6192B 0%, #FFEA00 45%, transparent 75%)'
        }}
      />
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[750px] rounded-full border border-[#E6192B]/15 opacity-50"
      />
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full border-2 border-dashed border-[#FFEA00]/20 opacity-40 animate-[spin_60s_linear_infinite]"
      />
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full border border-[#E6192B]/30 opacity-60"
      />
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 234, 0, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(230, 25, 43, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}
      />
      <div className="absolute top-6 left-8 text-[11px] font-mono tracking-[4px] text-[#FFEA00]/50 uppercase select-none font-bold">
        // MID-SEASON INVITATIONAL // INTERNATIONAL PROTOCOL
      </div>
      <div className="absolute bottom-6 right-8 text-[11px] font-mono tracking-[4px] text-[#E6192B]/70 uppercase select-none font-bold">
        DEFY // RIOT ESPORTS
      </div>
    </div>
  );
}

function EwcBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#0A0907]">
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 25%, rgba(212, 175, 55, 0.25) 0%, transparent 60%),
            radial-gradient(circle at 50% 120%, rgba(254, 240, 138, 0.12) 0%, transparent 55%)
          `
        }}
      />
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[320px] opacity-40 blur-3xl"
        style={{
          background: 'radial-gradient(ellipse, rgba(212, 175, 55, 0.6) 0%, rgba(254, 240, 138, 0.2) 40%, transparent 70%)'
        }}
      />
      <div 
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage: `
            radial-gradient(circle, #D4AF37 1px, transparent 1px)
          `,
          backgroundSize: '36px 36px'
        }}
      />
      <div 
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: `
            linear-gradient(135deg, transparent 40%, rgba(212, 175, 55, 0.15) 50%, transparent 60%)
          `,
          backgroundSize: '200% 200%',
          animation: 'su-sweep 8s ease-in-out infinite alternate'
        }}
      />
      <div className="absolute top-6 left-8 text-[11px] font-mono tracking-[4px] text-[#D4AF37]/60 uppercase select-none font-bold">
        // ESPORTS WORLD CUP // ELITE PROTOCOL
      </div>
      <div className="absolute bottom-6 right-8 text-[11px] font-mono tracking-[4px] text-[#FEF08A]/60 uppercase select-none font-bold">
        RIYADH 2026 // CLUB CHAMPIONSHIP
      </div>
    </div>
  );
}

function WorldsBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#040814]">
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 0%, rgba(56, 189, 248, 0.3) 0%, transparent 60%),
            radial-gradient(circle at 20% 100%, rgba(29, 99, 255, 0.25) 0%, transparent 55%),
            radial-gradient(circle at 80% 100%, rgba(14, 165, 233, 0.2) 0%, transparent 55%)
          `
        }}
      />
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[380px] opacity-45 blur-3xl"
        style={{
          background: 'radial-gradient(ellipse, rgba(56, 189, 248, 0.6) 0%, rgba(29, 99, 255, 0.3) 45%, transparent 75%)'
        }}
      />
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-[#38BDF8]/15 opacity-40"
      />
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-[#1D63FF]/25 opacity-50"
      />
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-dashed border-[#7DD3FC]/25 opacity-60 animate-[spin_80s_linear_infinite]"
      />
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            radial-gradient(circle, #38BDF8 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />
      <div className="absolute top-6 left-8 text-[11px] font-mono tracking-[4px] text-[#38BDF8]/60 uppercase select-none font-bold">
        // LEAGUE OF LEGENDS WORLD CHAMPIONSHIP // SUMMONER'S CALL
      </div>
      <div className="absolute bottom-6 right-8 text-[11px] font-mono tracking-[4px] text-[#7DD3FC]/70 uppercase select-none font-bold">
        THE ONE AND ONLY // WORLD FINALS
      </div>
    </div>
  );
}

// ============================================================================
// 2. CONFIGURATION DE STYLE PAR TOURNOI
// ============================================================================
function getTournamentArenaConfig(event) {
  const eventId = event?.id?.toLowerCase() || '';
  const eventName = event?.name?.toLowerCase() || '';

  if (eventId === 'worlds' || eventName.includes('world championship') || eventName.includes('worlds')) {
    return {
      type: 'worlds',
      name: event?.name || 'World Championship',
      shortName: 'WORLDS',
      logo: event?.logo || '/logo/world-championship.webp',
      badgeClass: 'border border-[#38BDF8]/60 bg-[#07132B]/90 text-[#BAE6FD] shadow-[0_0_20px_rgba(56,189,248,0.35)]',
      titleColor: 'text-transparent bg-clip-text bg-gradient-to-b from-[#FFFFFF] via-[#BAE6FD] to-[#38BDF8] drop-shadow-[0_0_25px_rgba(56,189,248,0.5)]',
      accentText: 'text-[#38BDF8] drop-shadow-[0_0_12px_rgba(56,189,248,0.6)]',
      scoreColor: '#FFFFFF',
      scoreGlow: '0 0 25px rgba(56, 189, 248, 0.85), 0 0 60px rgba(29, 99, 255, 0.7)',
      btnPrimaryClass: 'bg-gradient-to-r from-[#1D63FF] via-[#2563EB] to-[#0EA5E9] text-white border border-[#7DD3FC]/50 shadow-[0_0_30px_rgba(29,99,255,0.65)] hover:shadow-[0_0_40px_rgba(56,189,248,0.9)] hover:brightness-110',
      btnWinnerClass: 'bg-gradient-to-r from-[#0EA5E9] via-[#38BDF8] to-[#1D63FF] text-white border border-white/40 shadow-[0_0_35px_rgba(56,189,248,0.75)] hover:brightness-110',
      skipBtnClass: 'border-[#38BDF8] text-[#E0F2FE] hover:bg-[#38BDF8]/15 hover:shadow-[0_0_15px_rgba(56,189,248,0.4)]',
      eventCardClass: 'bg-[#071024]/90 border border-[#38BDF8]/25 shadow-[0_0_20px_rgba(29,99,255,0.2)]',
      isLight: false,
    };
  }

  if (eventId === 'msi' || eventName.includes('msi') || eventName.includes('mid-season')) {
    return {
      type: 'msi',
      name: event?.name || 'Mid-Season Invitational',
      shortName: 'MSI',
      logo: event?.logo || '/logo/msi.webp',
      badgeClass: 'border border-[#E6192B]/60 bg-[#E6192B]/15 text-[#FFEA00] italic shadow-[3px_3px_0px_#E6192B]',
      titleColor: 'text-white italic tracking-wider',
      accentText: 'text-[#FFEA00]',
      scoreColor: '#FFEA00',
      scoreGlow: '0 0 25px rgba(230, 25, 43, 0.8), 0 0 40px rgba(255, 234, 0, 0.5)',
      btnPrimaryClass: 'bg-[#FFEA00] text-black italic shadow-[4px_4px_0px_#E6192B] hover:bg-[#fff033]',
      btnWinnerClass: 'bg-[#E6192B] text-white italic shadow-[4px_4px_0px_#FFEA00] hover:bg-[#ff1f33]',
      skipBtnClass: 'border-[#E6192B] text-white hover:bg-[#E6192B]/20',
      eventCardClass: 'bg-[#0A0D14]/90 border border-[#E6192B]/30',
      isLight: false,
    };
  }

  if (eventId === 'ewc' || eventName.includes('ewc') || eventName.includes('esports world cup')) {
    return {
      type: 'ewc',
      name: event?.name || 'Esports World Cup',
      shortName: 'EWC',
      logo: event?.logo || '/logo/ewc-2026-main-event.webp',
      badgeClass: 'border border-[#FDE047]/50 bg-[#0A0907]/95 text-[#FEF08A] shadow-[0_0_25px_rgba(234,179,8,0.3)]',
      titleColor: 'text-transparent bg-clip-text bg-gradient-to-b from-[#FFFFFF] via-[#FEF08A] to-[#D4AF37] drop-shadow-[0_0_20px_rgba(212,175,55,0.4)]',
      accentText: 'text-[#FDE047] drop-shadow-[0_0_10px_rgba(234,179,8,0.4)]',
      scoreColor: '#FEF08A',
      scoreGlow: '0 0 25px rgba(234, 179, 8, 0.7), 0 0 50px rgba(212, 175, 55, 0.35)',
      btnPrimaryClass: 'bg-gradient-to-r from-[#CA8A04] via-[#FDE047] to-[#CA8A04] text-black border border-[#FEF08A] shadow-[0_0_30px_rgba(234,179,8,0.5)] hover:brightness-110',
      btnWinnerClass: 'bg-gradient-to-r from-[#D4AF37] via-[#FEF08A] to-[#D4AF37] text-black border border-white shadow-[0_0_35px_rgba(253,224,71,0.7)] hover:brightness-110',
      skipBtnClass: 'border-[#D4AF37] text-[#FEF08A] hover:bg-[#D4AF37]/15',
      eventCardClass: 'bg-[#0C0B08]/90 border border-[#D4AF37]/35 shadow-[0_0_20px_rgba(212,175,55,0.15)]',
      isLight: false,
    };
  }

  return {
    type: 'first_stand',
    name: event?.name || 'First Stand',
    shortName: 'FS',
    logo: event?.logo || '/logo/first-stand.webp',
    badgeClass: 'border-2 border-[#FF5C00] bg-[#25092C] text-white shadow-[0_4px_18px_rgba(255,92,0,0.35)]',
    titleColor: 'text-[#25092C]',
    accentText: 'text-[#FF5C00] font-black',
    scoreColor: '#25092C',
    scoreGlow: '0 0 20px rgba(255, 92, 0, 0.45)',
    btnPrimaryClass: 'bg-[#FF5C00] text-white shadow-[0_6px_20px_rgba(255,92,0,0.45)] hover:bg-[#ff6d1a]',
    btnWinnerClass: 'bg-[#25092C] text-white shadow-[0_6px_20px_rgba(37,9,44,0.4)] hover:bg-[#380e42]',
    skipBtnClass: 'border-[#FF5C00] text-[#25092C] hover:bg-[#FF5C00] hover:text-white',
    eventCardClass: 'bg-white/90 shadow-md border border-[#FF5C00]/30',
    isLight: true,
  };
}

// ============================================================================
// 3. COMPOSANT PRINCIPAL DE L'ARÈNE
// ============================================================================
export default function ArenaView({ match, matchReady, dismissMatch, state, event, isSpectator = false }) {
  const currentEvent = event || (state?.eventIndex !== undefined ? EVENTS[state.eventIndex] : null) || EVENTS[0];
  const theme = getTournamentArenaConfig(currentEvent);

  const isReady = match.ready.includes(socket.id);
  const isFinished = match.status === 'finished';
  const isSimulating = match.status === 'simulating_events' || match.status === 'simulating_result';
  
  const getCardById = (id) => CARD_POOL.find(c => c.id === id);
  const handleSkip = () => socket.emit('skip-match', match.id);

  const handleReady = () => {
    matchReady(match.id);
  };

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

  /**
   * Affichage des 5 cartes du roster verrouillé en format 3/2 (3 cartes en haut, 2 cartes en bas)
   */
  const renderRoster = (team, teamSide) => {
    const renderCardItem = (role) => {
      const p = team.roster.find(pro => pro.role === role);
      if (!p) return null;
      const baseCard = getCardById(p.id);
      const dynamicCard = baseCard ? { ...baseCard, rating: p.rating, overall: p.rating } : null;
      const buff = getPlayerBuff(teamSide, role);

      return (
        <div 
          key={role} 
          className="text-center relative inline-block z-[1] flex flex-col items-center"
        >
          <div className="relative">
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
        </div>
      );
    };

    const topRowRoles = ORDERED_ROLES.slice(0, 3);
    const bottomRowRoles = ORDERED_ROLES.slice(3, 5);

    return (
      <div className="flex flex-col items-center gap-3.5 w-full">
        {/* Ligne 1 : 3 cartes (TOP, JUNGLE, MID) */}
        <div className="flex justify-center gap-3.5">
          {topRowRoles.map(role => renderCardItem(role))}
        </div>
        {/* Ligne 2 : 2 cartes (ADC, SUPPORT) */}
        <div className="flex justify-center gap-3.5">
          {bottomRowRoles.map(role => renderCardItem(role))}
        </div>
      </div>
    );
  };

  /**
   * Panneau d'équipe calibré pour afficher les cartes en 3/2 (3 en haut, 2 en bas)
   */
  const renderTeamPanel = (team, side) => {
    const synergy = getSynergy(team.roster);
    const rawAvg = team.roster.reduce((a, b) => a + (b.rating || b.overall || 0), 0) / 5;
    const avg = getTeamAvg(team, side);

    return (
      <TeamSkinFrame
        skinId={getEquippedSkinId(state, team.id)}
        className="w-[310px] sm:w-[380px] lg:w-[420px] shrink-0 p-4 sm:p-6 lg:p-7 flex flex-col justify-between rounded-xl"
      >
        <h2 className="font-rajdhani mb-5 text-center flex flex-col items-center gap-2.5 uppercase">
          <div className="flex flex-col items-center gap-1.5">
            {team.logo ? (
              <img
                src={team.logo}
                className="w-[54px] h-[54px] object-contain"
                style={{ filter: 'var(--sk-logo-filter, none)' }}
                alt={`logo ${side}`}
              />
            ) : (
              <div className="w-[54px] h-[54px] bg-border rounded-xl" />
            )}
            <span className="text-[24px] leading-tight">{team.name}</span>
          </div>

          <div className="text-sm text-[color:var(--sk-muted,#8b9bb4)]">
            MOYENNE : <span className={avg > rawAvg ? 'text-[color:var(--sk-good,#00e676)]' : ''}>{avg}</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <SynergyGauges synergy={synergy} compact />
          </div>
        </h2>
        {renderRoster(team, side)}
      </TeamSkinFrame>
    );
  };

  const getMatchTitle = (id) => {
    if (id.includes('gf')) return 'GRANDE FINALE';
    if (id.includes('sw')) return 'SWISS STAGE';
    if (id.includes('qf')) return 'QUART DE FINALE';
    if (id.includes('sf')) return 'DEMI-FINALE';
    if (id.includes('f-')) return 'GRANDE FINALE';
    if (id.match(/m1|m2/)) return "MATCH D'OUVERTURE";
    if (id.includes('winner')) return 'MATCH DES GAGNANTS';
    if (id.includes('loser')) return 'MATCH ÉLIMINATOIRE';
    if (id.includes('decider')) return 'MATCH DÉCISIF';
    return 'AFFRONTEMENT OFFICIEL';
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center font-sans overflow-x-auto p-2 sm:p-4 lg:p-6 transition-colors duration-700">
      {theme.type === 'first_stand' && <FirstStandBackground />}
      {theme.type === 'msi' && <MsiBackground />}
      {theme.type === 'ewc' && <EwcBackground />}
      {theme.type === 'worlds' && <WorldsBackground />}

      <div className="relative z-10 w-full flex flex-col items-center">
        
        <div className="flex flex-col items-center gap-2.5 mb-5 animate-[fadeIn_0.4s]">
          <div className={`flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs font-rajdhani font-bold tracking-[2px] uppercase backdrop-blur-md ${theme.badgeClass}`}>
            {theme.logo && (
              <img src={theme.logo} alt="" className="w-5 h-5 object-contain" />
            )}
            <span>{theme.name}</span>
            <span className="opacity-50">•</span>
            <span>SAISON {state?.year || 1}</span>
          </div>

          <h1 className={`font-rajdhani text-[24px] sm:text-[38px] uppercase font-black m-0 leading-tight text-center ${theme.titleColor}`}>
            CONFRONTATION PROTOCOLE
          </h1>
          
          <div className="flex items-center gap-3">
            <span className="w-8 h-[1px] bg-current opacity-40" />
            <p className={`font-rajdhani text-[17px] tracking-[4px] uppercase m-0 font-bold ${theme.accentText}`}>
              {getMatchTitle(match.id)} {isSpectator && <span className="text-accent-pink ml-2">• MODE SPECTATEUR</span>}
            </p>
            <span className="w-8 h-[1px] bg-current opacity-40" />
          </div>
        </div>
        
        {/* SCÈNE PRINCIPALE : ÉQUIPE A (3/2) - CONSOLE CENTRALE - ÉQUIPE B (3/2) */}
        <div className="w-full max-w-full overflow-x-auto pb-4">
          <div className="flex w-max max-w-[1280px] gap-4 sm:gap-6 items-stretch mt-3 justify-start lg:justify-center mx-auto px-2">
            
            {renderTeamPanel(match.teamA, 'A')}

            <div className="text-center w-[220px] sm:w-[260px] lg:w-[300px] shrink-0 flex flex-col justify-center px-2 relative">
            
            {isSimulating && !isSpectator && (
              <div className="mb-5">
                <button 
                  className={`bg-transparent border-2 text-xs font-rajdhani font-bold uppercase tracking-wider py-2 px-4 rounded whitespace-nowrap transition-all hover:scale-105 ${theme.skipBtnClass}`}
                  onClick={handleSkip}
                >
                  PASSER L'ANIMATION ⏭
                </button>
              </div>
            )}

            <div 
              className={`font-rajdhani text-[78px] transition-all duration-300 uppercase font-black tracking-wider ${isSimulating ? 'animate-pulse-fast' : ''}`}
              style={{
                color: theme.scoreColor,
                textShadow: theme.scoreGlow,
              }}
            >
              {match.scoreA} - {match.scoreB}
            </div>
            
            <div className="mt-[28px] min-h-[140px] flex flex-col justify-center items-center">
              {match.status === 'pending' && !isSpectator && (
                <button 
                  className={`w-full font-rajdhani font-black text-base uppercase tracking-wider py-3.5 px-7 rounded transition-all ${
                    isReady 
                      ? 'bg-transparent border-2 border-slate-400/40 opacity-50 cursor-not-allowed ' + (theme.isLight ? 'text-[#25092C]' : 'text-slate-100')
                      : `${theme.btnPrimaryClass} hover:-translate-y-0.5 active:scale-95`
                  }`}
                  onClick={handleReady} 
                  disabled={isReady}
                >
                  {isReady ? 'SYSTÈME ARMÉ...' : 'ARMER LA SÉQUENCE'}
                </button>
              )}
              
              {match.status === 'pending' && isSpectator && (
                <div className={`font-rajdhani text-[18px] tracking-[2px] uppercase animate-pulse-fast font-bold ${theme.accentText}`}>
                  EN ATTENTE DES JOUEURS...
                </div>
              )}

              {match.status === 'simulating_events' && (
                <div className="w-full">
                  {match.currentEvents?.filter(ev => ev.label).length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {match.currentEvents.filter(ev => ev.label).map((ev, index) => {
                        const eventColor = ev.side === 'A' ? '#38BDF8' : ev.side === 'B' ? '#F43F5E' : (theme.isLight ? '#25092C' : '#94A3B8');
                        return (
                          <div 
                            key={`${match.currentEvents.length}-${index}`} 
                            className={`w-full flex flex-col gap-2 p-3.5 rounded-lg backdrop-blur-md animate-[skillPopIn_0.4s_forwards] ${theme.eventCardClass}`}
                          >
                            <div 
                              className="font-sans text-sm font-bold text-center leading-relaxed"
                              style={{ color: eventColor }}
                            >
                              {ev.label}
                            </div>
                            {ev.image && (
                              <div className="w-full rounded bg-black/40 overflow-hidden flex justify-center">
                                <img src={ev.image} alt="Illustration" className="w-full h-auto max-h-[160px] object-cover" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className={`font-rajdhani text-[16px] tracking-[2px] uppercase animate-pulse-fast font-bold ${theme.accentText}`}>
                        LANCEMENT DE LA PARTIE...
                      </div>
                      <div className={`text-xs italic ${theme.isLight ? 'text-[#25092C]/70' : 'text-text-muted'}`}>
                        Les équipes entrent dans la Faille
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {match.status === 'simulating_result' && (
                <div className={`font-rajdhani text-[20px] tracking-[2px] uppercase animate-pulse-fast font-bold ${theme.accentText}`}>
                  CALCUL DE L'ISSUE...
                </div>
              )}

              {isFinished && (
                <div className="w-full animate-[fadeIn_0.5s]">
                  <div className={`font-rajdhani text-[24px] mb-4 uppercase font-bold ${theme.accentText}`}>
                    VICTOIRE DE<br/>
                    <span className={`text-[32px] font-black ${theme.isLight ? 'text-[#25092C]' : 'text-white'}`}>
                      {match.winner.name}
                    </span>
                  </div>
                  <button 
                    className={`w-full font-rajdhani font-black text-base uppercase tracking-wider py-3.5 px-7 rounded hover:-translate-y-0.5 transition-all ${theme.btnWinnerClass}`}
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
      </div>
    </div>
  );
}
