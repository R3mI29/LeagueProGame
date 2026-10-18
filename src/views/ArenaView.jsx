import React from 'react';
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

/**
 * FIRST STAND : DA blanche/orange géométrique avec traits graphiques,
 * chevrons obliques, grille tech et bandes de vitesse dynamiques.
 */
function FirstStandBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#F0F2F6]">
      {/* Halos d'ambiance */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% -10%, rgba(255, 92, 0, 0.22) 0%, transparent 65%),
            radial-gradient(ellipse at 50% 115%, rgba(37, 9, 44, 0.1) 0%, transparent 60%)
          `
        }}
      />

      {/* Grand biseau angulaire supérieur droit */}
      <div 
        className="absolute -top-[140px] -right-[120px] w-[650px] h-[520px] opacity-30"
        style={{
          background: 'linear-gradient(135deg, #FF5C00 0%, #25092C 100%)',
          clipPath: 'polygon(30% 0%, 100% 0%, 70% 100%, 0% 100%)',
          transform: 'rotate(-16deg)'
        }}
      />
      {/* Grand biseau angulaire inférieur gauche */}
      <div 
        className="absolute -bottom-[140px] -left-[120px] w-[650px] h-[480px] opacity-25"
        style={{
          background: 'linear-gradient(135deg, #25092C 0%, #FF5C00 100%)',
          clipPath: 'polygon(25% 0%, 100% 0%, 75% 100%, 0% 100%)',
          transform: 'rotate(-14deg)'
        }}
      />

      {/* Slash lines dynamiques */}
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

      {/* Grille technique */}
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

      {/* Marques techniques d'arène */}
      <div className="absolute top-6 left-8 text-[11px] font-mono tracking-[4px] text-[#25092C]/40 uppercase select-none font-bold">
        // FIRST STAND • GLOBAL OPEN // ARENA PROTOCOL
      </div>
      <div className="absolute bottom-6 right-8 text-[11px] font-mono tracking-[4px] text-[#FF5C00]/50 uppercase select-none font-bold">
        STAGE 01 // RIOT ESPORTS
      </div>
    </div>
  );
}

/**
 * MSI : Style brutaliste street/asphalt rouge & jaune électrique.
 */
function MsiBackground({ logo }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#0A0C12]">
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% -10%, rgba(230, 25, 43, 0.3) 0%, transparent 60%),
            radial-gradient(ellipse at 50% 115%, rgba(255, 234, 0, 0.15) 0%, transparent 55%),
            radial-gradient(circle at 10% 50%, rgba(230, 25, 43, 0.08) 0%, transparent 45%),
            radial-gradient(circle at 90% 50%, rgba(230, 25, 43, 0.08) 0%, transparent 45%)
          `
        }}
      />
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.06) 1px, transparent 1px)',
          backgroundSize: '22px 22px'
        }}
      />
      {logo && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <img 
            src={logo} 
            alt="" 
            className="max-w-[460px] max-h-[460px] object-contain select-none opacity-[0.08] drop-shadow-[0_0_40px_rgba(230,25,43,0.55)]"
          />
        </div>
      )}
    </div>
  );
}

/**
 * EWC (NOUVELLE DA) : "Sovereign Gold & Obsidian"
 * Zéro image externe. Un rendu ultra-luxueux mêlant noir profond, rayons d'or,
 * géométrie sacrée/monolithique en SVG au centre et chevrons dorés ciselés.
 */
function EwcBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#050507]">
      {/* 1. Rayons solaires dorés & profondeur obsidienne */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 80% 50% at 50% -15%, rgba(234, 179, 8, 0.25) 0%, rgba(161, 98, 7, 0.08) 45%, transparent 75%),
            radial-gradient(ellipse 60% 45% at 50% 115%, rgba(212, 175, 55, 0.18) 0%, transparent 70%),
            radial-gradient(circle at 50% 50%, rgba(20, 18, 12, 0.85) 0%, #050507 100%)
          `
        }}
      />

      {/* 2. Faisceaux obliques "Luxury Stage" (sans filter blur coûteux) */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(125deg, transparent 30%, rgba(234, 179, 8, 0.07) 45%, rgba(254, 240, 138, 0.12) 50%, rgba(234, 179, 8, 0.07) 55%, transparent 70%),
            linear-gradient(55deg, transparent 30%, rgba(212, 175, 55, 0.06) 48%, rgba(212, 175, 55, 0.06) 52%, transparent 70%)
          `
        }}
      />

      {/* 3. Motif architectural carbone & filets d'or en arrière-plan */}
      <div 
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage: `
            linear-gradient(30deg, rgba(212, 175, 55, 0.08) 1px, transparent 1px),
            linear-gradient(150deg, rgba(212, 175, 55, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '56px 96px'
        }}
      />

      {/* 4. Grand Monolithe Géométrique Royal (SVG vectoriel net au centre) */}
      <svg
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[820px] h-[820px] opacity-30"
        viewBox="0 0 800 800"
        fill="none"
      >
        <defs>
          <linearGradient id="ewcGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#D4AF37" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#713F12" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="ewcGoldReverse" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#854D0E" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Losanges monolithiques imbriqués */}
        <polygon points="400,40 720,400 400,760 80,400" stroke="url(#ewcGoldGrad)" strokeWidth="1.5" />
        <polygon points="400,90 670,400 400,710 130,400" stroke="url(#ewcGoldReverse)" strokeWidth="1" strokeDasharray="8 6" />
        
        {/* Octogone de couronne */}
        <polygon points="270,110 530,110 690,270 690,530 530,690 270,690 110,530 110,270" stroke="url(#ewcGoldGrad)" strokeWidth="0.75" opacity="0.6" />

        {/* Cercle d'or central & axes de visée */}
        <circle cx="400" cy="400" r="210" stroke="url(#ewcGoldGrad)" strokeWidth="1.5" opacity="0.7" />
        <circle cx="400" cy="400" r="175" stroke="#FDE047" strokeWidth="0.5" strokeDasharray="3 9" opacity="0.5" />
        
        {/* Piliers verticaux façon Trophée EWC */}
        <line x1="400" y1="0" x2="400" y2="180" stroke="url(#ewcGoldGrad)" strokeWidth="2" />
        <line x1="400" y1="620" x2="400" y2="800" stroke="url(#ewcGoldGrad)" strokeWidth="2" />
        <line x1="0" y1="400" x2="180" y2="400" stroke="url(#ewcGoldGrad)" strokeWidth="1" opacity="0.5" />
        <line x1="620" y1="400" x2="800" y2="400" stroke="url(#ewcGoldGrad)" strokeWidth="1" opacity="0.5" />
      </svg>

      {/* 5. Cadre d'arène VIP ciselé en or */}
      <div className="absolute inset-5 border border-[#D4AF37]/20 rounded-sm">
        {/* Coins biseautés double-or */}
        <div className="absolute -top-[1px] -left-[1px] w-8 h-8 border-t-2 border-l-2 border-[#FDE047]" />
        <div className="absolute -top-[1px] -right-[1px] w-8 h-8 border-t-2 border-r-2 border-[#FDE047]" />
        <div className="absolute -bottom-[1px] -left-[1px] w-8 h-8 border-b-2 border-l-2 border-[#FDE047]" />
        <div className="absolute -bottom-[1px] -right-[1px] w-8 h-8 border-b-2 border-r-2 border-[#FDE047]" />
        
        {/* Filet lumineux supérieur */}
        <div 
          className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-1/2 h-[2px]"
          style={{
            background: 'linear-gradient(90deg, transparent, #FDE047 50%, transparent)',
            boxShadow: '0 0 20px #EAB308'
          }}
        />
      </div>

      {/* Signatures typographiques discrètes */}
      <div className="absolute bottom-8 left-10 text-[10px] font-mono tracking-[5px] text-[#D4AF37]/40 uppercase select-none">
        RIYADH // CHAMPIONSHIP PROTOCOL
      </div>
      <div className="absolute bottom-8 right-10 text-[10px] font-mono tracking-[5px] text-[#D4AF37]/40 uppercase select-none">
        CROWN PRESTIGE SERIES
      </div>
    </div>
  );
}

/**
 * WORLDS (NOUVELLE DA) : "Make Them Believe" (Inspiré de ton screenshot)
 * Fond bleu nuit abyssal (#030814), projecteurs bleu roi (#1D63FF) et éclats
 * bleu électrique/glace (#38BDF8) très vifs avec anneaux d'astrolabe de scène.
 */
function WorldsBackground({ logo }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#030711]">
      {/* 1. Profondeur Nuit & Halos Bleu Roi / Bleu Glace Vif */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 75% 55% at 50% -10%, rgba(29, 99, 255, 0.48) 0%, rgba(14, 165, 233, 0.18) 45%, transparent 75%),
            radial-gradient(ellipse 65% 50% at 50% 115%, rgba(37, 99, 235, 0.35) 0%, rgba(56, 189, 248, 0.1) 50%, transparent 75%),
            radial-gradient(circle at 12% 45%, rgba(56, 189, 248, 0.14) 0%, transparent 45%),
            radial-gradient(circle at 88% 45%, rgba(56, 189, 248, 0.14) 0%, transparent 45%),
            radial-gradient(circle at 50% 50%, rgba(10, 22, 54, 0.5) 0%, transparent 70%)
          `
        }}
      />

      {/* 2. Faisceaux de scène croisés (Projecteurs bleu glacier sans flou lourd) */}
      <div 
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage: `
            linear-gradient(118deg, transparent 32%, rgba(29, 99, 255, 0.12) 44%, rgba(56, 189, 248, 0.22) 50%, rgba(29, 99, 255, 0.12) 56%, transparent 68%),
            linear-gradient(62deg, transparent 32%, rgba(29, 99, 255, 0.12) 44%, rgba(56, 189, 248, 0.22) 50%, rgba(29, 99, 255, 0.12) 56%, transparent 68%)
          `
        }}
      />

      {/* 3. Anneaux d'arène orbitaux & Lignes de Bracket (SVG) */}
      <svg
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[960px] h-[960px] opacity-35"
        viewBox="0 0 960 960"
        fill="none"
      >
        <defs>
          <linearGradient id="worldsBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#1D63FF" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#030711" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Grands anneaux de scène Worlds */}
        <circle cx="480" cy="480" r="390" stroke="url(#worldsBlueGrad)" strokeWidth="1" />
        <circle cx="480" cy="480" r="310" stroke="#38BDF8" strokeWidth="0.75" strokeDasharray="6 14" opacity="0.45" />
        <circle cx="480" cy="480" r="220" stroke="url(#worldsBlueGrad)" strokeWidth="1.5" opacity="0.75" />
        
        {/* Arcs latéraux façon bracket */}
        <path d="M 90 340 L 180 340 L 230 480 L 180 620 L 90 620" stroke="#38BDF8" strokeWidth="1" opacity="0.3" />
        <path d="M 870 340 L 780 340 L 730 480 L 780 620 L 870 620" stroke="#38BDF8" strokeWidth="1" opacity="0.3" />
      </svg>

      {/* 4. Trame de fond subtile & poussière d'étoiles bleutée */}
      <div 
        className="absolute inset-0 opacity-35"
        style={{
          backgroundImage: `
            radial-gradient(circle at 25% 30%, rgba(186, 230, 253, 0.35) 1px, transparent 1px),
            radial-gradient(circle at 75% 65%, rgba(56, 189, 248, 0.35) 1.5px, transparent 1.5px),
            linear-gradient(rgba(56, 189, 248, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(56, 189, 248, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px, 110px 110px, 48px 48px, 48px 48px'
        }}
      />

      {/* 5. Filigrane géant du logo Worlds au centre en bleu glacier */}
      {logo && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <img 
            src={logo} 
            alt="" 
            className="max-w-[440px] max-h-[440px] object-contain select-none opacity-[0.06] drop-shadow-[0_0_50px_rgba(56,189,248,0.8)]"
          />
        </div>
      )}

      {/* 6. Ligne d'horizon électrique supérieure */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[85%] h-[2px] opacity-90"
        style={{
          background: 'linear-gradient(90deg, transparent, #1D63FF 20%, #38BDF8 45%, #FFFFFF 50%, #38BDF8 55%, #1D63FF 80%, transparent)',
          boxShadow: '0 0 25px #38BDF8, 0 0 50px #1D63FF'
        }}
      />

      {/* Slogan "MAKE THEM BELIEVE" en filigrane technique */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 text-[11px] font-sans font-bold tracking-[6px] text-[#38BDF8]/40 uppercase select-none">
        <span className="w-12 h-[1px] bg-[#38BDF8]/30" />
        MAKE THEM BELIEVE
        <span className="w-12 h-[1px] bg-[#38BDF8]/30" />
      </div>
    </div>
  );
}

// ============================================================================
// 2. CONFIGURATION CENTRALISÉE DES THÈMES (100% Classes Tailwind + Variables)
// ============================================================================
function getTournamentArenaConfig(event) {
  const eventId = event?.id || '';
  const eventName = (event?.name || '').toLowerCase();

  // 1. WORLDS — Thème "Make Them Believe" (Bleu Roi, Blanc Pur & Bleu Glace Vif)
  if (eventId === 'worlds' || eventName.includes('worlds') || event?.isMajor) {
    return {
      type: 'worlds',
      name: event?.name || 'World Championship',
      shortName: 'WORLDS',
      logo: event?.logo || '/logo/world-championship.webp',
      badgeClass: 'border border-[#38BDF8]/50 bg-[#071126]/90 text-white shadow-[0_0_25px_rgba(29,99,255,0.45)]',
      titleColor: 'text-white drop-shadow-[0_0_25px_rgba(56,189,248,0.45)] tracking-[5px]',
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

  // 2. MSI — Thème Brutaliste Street/Asphalt (Rouge & Jaune)
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

  // 3. EWC — Thème "Sovereign Gold & Obsidian" (Or Liquide & Noir Onyx)
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

  // 4. FIRST STAND (Default) — Thème Clair & Orange Technique
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
              <div className="w-[60px] h-[60px] bg-border rounded-xl" />
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
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center font-sans overflow-x-hidden p-6 transition-colors duration-700">
      
      {/* ARRIÈRE-PLAN SPÉCIFIQUE DU TOURNOI */}
      {theme.type === 'first_stand' && <FirstStandBackground />}
      {theme.type === 'msi' && <MsiBackground logo={theme.logo} />}
      {theme.type === 'ewc' && <EwcBackground />}
      {theme.type === 'worlds' && <WorldsBackground logo={theme.logo} />}

      {/* CONTENU DU MATCH */}
      <div className="relative z-10 w-full flex flex-col items-center">
        
        {/* HEADER OFFICIEL */}
        <div className="flex flex-col items-center gap-2.5 mb-5 animate-[fadeIn_0.4s]">
          <div className={`flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs font-rajdhani font-bold tracking-[2px] uppercase backdrop-blur-md ${theme.badgeClass}`}>
            {theme.logo && (
              <img src={theme.logo} alt="" className="w-5 h-5 object-contain" />
            )}
            <span>{theme.name}</span>
            <span className="opacity-50">•</span>
            <span>SAISON {state?.year || 1}</span>
          </div>

          <h1 className={`font-rajdhani text-[38px] uppercase font-black m-0 leading-tight ${theme.titleColor}`}>
            CONFRONTATION PROTOCOLE
          </h1>
          
          {/* Sous-titre avec encadrement fin inspiré du "MAKE THEM BELIEVE" de l'image Worlds */}
          <div className="flex items-center gap-3">
            <span className="w-8 h-[1px] bg-current opacity-40" />
            <p className={`font-rajdhani text-[17px] tracking-[4px] uppercase m-0 font-bold ${theme.accentText}`}>
              {getMatchTitle(match.id)} {isSpectator && <span className="text-accent-pink ml-2">• MODE SPECTATEUR</span>}
            </p>
            <span className="w-8 h-[1px] bg-current opacity-40" />
          </div>
        </div>
        
        {/* SCÈNE PRINCIPALE : ÉQUIPE A - CONSOLE CENTRALE - ÉQUIPE B */}
        <div className="flex w-full max-w-[1360px] gap-8 items-center mt-4">
          
          {renderTeamPanel(match.teamA, 'A')}

          {/* SIMULATION AU CENTRE */}
          <div className="text-center w-[380px] shrink-0 flex flex-col justify-center px-5 relative">
            
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

            {/* SCORE DU MATCH */}
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
                  onClick={() => matchReady(match.id)} 
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
  );
}