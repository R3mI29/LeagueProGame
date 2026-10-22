import React, { useState, useEffect } from 'react';
import { socket } from '../api/socket';
import { ORDERED_ROLES } from '../constants/roles';
import { CARD_POOL } from '../constants/cardPlayers';
import CardIllustration from '../components/CardIllustration';
import SynergyGauges from '../components/SynergyGauges';
import TeamSkinFrame from '../components/TeamSkinFrame';
import CardDetailModal from '../components/CardDetailModal';
import ChampionPickerModal from '../components/ChampionPickerModal';
import ChampionDraftSplash from '../components/ChampionDraftSplash';
import { getSynergy } from '../constants/synergy';
import { getEquippedSkinId, getSkin } from '../constants/teamSkins';
import { EVENTS } from '../constants/seasonConfig';
import {
  evaluateTeamMetaSynergy,
  evaluateTeamChampionPicks,
  isMetaChampion,
  selectBotTeamChampions,
  calculateKnownMetaBonus,
  isChampionDecrypted,
  getChampionMetaTier,
} from '../constants/metaConfig';
import { getChampionById } from '../constants/championsData';
import { getPlayerChampionPool } from '../constants/playerChampionPools';

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

function EwcBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#050507]">
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
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(125deg, transparent 30%, rgba(234, 179, 8, 0.07) 45%, rgba(254, 240, 138, 0.12) 50%, rgba(234, 179, 8, 0.07) 55%, transparent 70%),
            linear-gradient(55deg, transparent 30%, rgba(212, 175, 55, 0.06) 48%, rgba(212, 175, 55, 0.06) 52%, transparent 70%)
          `
        }}
      />
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
        <polygon points="400,40 720,400 400,760 80,400" stroke="url(#ewcGoldGrad)" strokeWidth="1.5" />
        <polygon points="400,90 670,400 400,710 130,400" stroke="url(#ewcGoldReverse)" strokeWidth="1" strokeDasharray="8 6" />
        <polygon points="270,110 530,110 690,270 690,530 530,690 270,690 110,530 110,270" stroke="url(#ewcGoldGrad)" strokeWidth="0.75" opacity="0.6" />
        <circle cx="400" cy="400" r="210" stroke="url(#ewcGoldGrad)" strokeWidth="1.5" opacity="0.7" />
        <circle cx="400" cy="400" r="175" stroke="#FDE047" strokeWidth="0.5" strokeDasharray="3 9" opacity="0.5" />
        <line x1="400" y1="0" x2="400" y2="180" stroke="url(#ewcGoldGrad)" strokeWidth="2" />
        <line x1="400" y1="620" x2="400" y2="800" stroke="url(#ewcGoldGrad)" strokeWidth="2" />
        <line x1="0" y1="400" x2="180" y2="400" stroke="url(#ewcGoldGrad)" strokeWidth="1" opacity="0.5" />
        <line x1="620" y1="400" x2="800" y2="400" stroke="url(#ewcGoldGrad)" strokeWidth="1" opacity="0.5" />
      </svg>
      <div className="absolute inset-5 border border-[#D4AF37]/20 rounded-sm">
        <div className="absolute -top-[1px] -left-[1px] w-8 h-8 border-t-2 border-l-2 border-[#FDE047]" />
        <div className="absolute -top-[1px] -right-[1px] w-8 h-8 border-t-2 border-r-2 border-[#FDE047]" />
        <div className="absolute -bottom-[1px] -left-[1px] w-8 h-8 border-b-2 border-l-2 border-[#FDE047]" />
        <div className="absolute -bottom-[1px] -right-[1px] w-8 h-8 border-b-2 border-r-2 border-[#FDE047]" />
        <div 
          className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-1/2 h-[2px]"
          style={{
            background: 'linear-gradient(90deg, transparent, #FDE047 50%, transparent)',
            boxShadow: '0 0 20px #EAB308'
          }}
        />
      </div>
      <div className="absolute bottom-8 left-10 text-[10px] font-mono tracking-[5px] text-[#D4AF37]/40 uppercase select-none">
        RIYADH // CHAMPIONSHIP PROTOCOL
      </div>
      <div className="absolute bottom-8 right-10 text-[10px] font-mono tracking-[5px] text-[#D4AF37]/40 uppercase select-none">
        CROWN PRESTIGE SERIES
      </div>
    </div>
  );
}

function WorldsBackground({ logo }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#030711]">
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
      <div 
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage: `
            linear-gradient(118deg, transparent 32%, rgba(29, 99, 255, 0.12) 44%, rgba(56, 189, 248, 0.22) 50%, rgba(29, 99, 255, 0.12) 56%, transparent 68%),
            linear-gradient(62deg, transparent 32%, rgba(29, 99, 255, 0.12) 44%, rgba(56, 189, 248, 0.22) 50%, rgba(29, 99, 255, 0.12) 56%, transparent 68%)
          `
        }}
      />
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
        <circle cx="480" cy="480" r="390" stroke="url(#worldsBlueGrad)" strokeWidth="1" />
        <circle cx="480" cy="480" r="310" stroke="#38BDF8" strokeWidth="0.75" strokeDasharray="6 14" opacity="0.45" />
        <circle cx="480" cy="480" r="220" stroke="url(#worldsBlueGrad)" strokeWidth="1.5" opacity="0.75" />
        <path d="M 90 340 L 180 340 L 230 480 L 180 620 L 90 620" stroke="#38BDF8" strokeWidth="1" opacity="0.3" />
        <path d="M 870 340 L 780 340 L 730 480 L 780 620 L 870 620" stroke="#38BDF8" strokeWidth="1" opacity="0.3" />
      </svg>
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
      {logo && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <img 
            src={logo} 
            alt="" 
            className="max-w-[440px] max-h-[440px] object-contain select-none opacity-[0.06] drop-shadow-[0_0_50px_rgba(56,189,248,0.8)]"
          />
        </div>
      )}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[85%] h-[2px] opacity-90"
        style={{
          background: 'linear-gradient(90deg, transparent, #1D63FF 20%, #38BDF8 45%, #FFFFFF 50%, #38BDF8 55%, #1D63FF 80%, transparent)',
          boxShadow: '0 0 25px #38BDF8, 0 0 50px #1D63FF'
        }}
      />
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 text-[11px] font-sans font-bold tracking-[6px] text-[#38BDF8]/40 uppercase select-none">
        <span className="w-12 h-[1px] bg-[#38BDF8]/30" />
        MAKE THEM BELIEVE
        <span className="w-12 h-[1px] bg-[#38BDF8]/30" />
      </div>
    </div>
  );
}

// ============================================================================
// 2. CONFIGURATION CENTRALISÉE DES THÈMES D'ARÈNE
// ============================================================================
function getTournamentArenaConfig(event) {
  const eventId = event?.id || '';
  const eventName = (event?.name || '').toLowerCase();

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
// 3. ADAPTATION DE LA COLONNE DE DRAFT AU SKIN ÉQUIPÉ DU JOUEUR (teamSkins.js)
// ============================================================================
function getDraftSkinStyle(skinId) {
  const skin = getSkin(skinId);

  const presets = {
    'worlds-sovereign': {
      borderColor: 'rgba(226, 232, 240, 0.65)',
      boxShadow: '0 12px 35px rgba(0,0,0,0.9), 0 0 20px rgba(255,255,255,0.12)',
      background: 'linear-gradient(180deg, #0b0e17 0%, #05060a 100%)',
      accentColor: '#FFFFFF',
      secondaryColor: '#94A3B8',
      slotBg: 'linear-gradient(135deg, #111522 0%, #070910 100%)',
      dividerColor: 'rgba(226, 232, 240, 0.18)',
    },
    'msi-clash': {
      borderColor: '#ff0037',
      boxShadow: '0 14px 35px rgba(0, 0, 0, 0.85), -4px 0 20px rgba(255, 0, 55, 0.35), 4px 0 20px rgba(168, 85, 247, 0.3)',
      background: 'linear-gradient(180deg, #160512 0%, #07020c 100%)',
      accentColor: '#d4ff00',
      secondaryColor: '#ff0037',
      slotBg: 'linear-gradient(135deg, #1d0618 0%, #09030f 100%)',
      dividerColor: 'rgba(255, 0, 55, 0.28)',
    },
    'gold-circuit': {
      borderColor: 'rgba(212, 175, 55, 0.7)',
      boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 28px rgba(212,175,55,0.18)',
      background: 'linear-gradient(160deg, #1a1608 0%, #0d0b05 65%)',
      accentColor: '#FDE047',
      secondaryColor: '#D4AF37',
      slotBg: 'linear-gradient(135deg, #1f1909 0%, #0c0a04 100%)',
      dividerColor: 'rgba(212, 175, 55, 0.25)',
    },
    'neon-protocol': {
      borderColor: 'rgba(255, 51, 102, 0.7)',
      boxShadow: '0 0 30px rgba(255,51,102,0.25), 0 0 60px rgba(0,229,255,0.1)',
      background: 'linear-gradient(160deg, #1a0a1f 0%, #0a0612 65%)',
      accentColor: '#00e5ff',
      secondaryColor: '#ff3366',
      slotBg: 'linear-gradient(135deg, #210c28 0%, #0b0614 100%)',
      dividerColor: 'rgba(255, 51, 102, 0.25)',
    },
    'glacier': {
      borderColor: 'rgba(120, 200, 255, 0.55)',
      boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 24px rgba(120,200,255,0.14)',
      background: 'linear-gradient(160deg, #0b1a2b 0%, #08111c 65%)',
      accentColor: '#78c8ff',
      secondaryColor: '#38bdf8',
      slotBg: 'linear-gradient(135deg, #0f2238 0%, #07101a 100%)',
      dividerColor: 'rgba(120, 200, 255, 0.22)',
    },
    'demon-curse': {
      borderColor: 'rgba(229, 20, 46, 0.8)',
      boxShadow: '0 0 40px rgba(229,20,46,0.3), 0 10px 30px rgba(0,0,0,0.6)',
      background: 'linear-gradient(160deg, #1a060b 0%, #0a0408 65%)',
      accentColor: '#ff4d6d',
      secondaryColor: '#e5142e',
      slotBg: 'linear-gradient(135deg, #21070d 0%, #0a0306 100%)',
      dividerColor: 'rgba(229, 20, 46, 0.26)',
    },
    default: {
      borderColor: '#2B3040',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
      background: 'linear-gradient(180deg, #0d1323 0%, #090d18 100%)',
      accentColor: '#8C9AD6',
      secondaryColor: '#4C60D2',
      slotBg: 'linear-gradient(135deg, #151d33 0%, #0b101e 100%)',
      dividerColor: 'rgba(255, 255, 255, 0.08)',
    },
  };

  const chosen = presets[skin?.id] || presets.default;

  return {
    ...chosen,
    effect: skin?.effect || null,
    borderWidth: skin?.frame?.borderWidth || '1.5px',
  };
}

// ============================================================================
// 4. UTILITAIRES : EXTRACTION DU VRAI PSEUDO ET LABELS E-SPORT
// ============================================================================

const ROLE_SHORT = {
  Top: 'TOP',
  Jungle: 'JGL',
  Mid: 'MID',
  ADC: 'BOT',
  Support: 'SUP',
};

// Dictionnaire des titres spéciaux -> Pseudo du joueur
const SPECIAL_TITLE_TO_PSEUDO = {
  'legend': 'TheShy',
  'worlds mvp': 'Canyon',
  'unkillable demon king': 'Faker',
  'adc god': 'Uzi',
  '3peat worlds': 'Keria',
  '3x world champion': 'Keria',
  'lpl legend': 'Knight',
};

// Mots-clés d'équipes, de ligues et de titres à ignorer lors de l'extraction du pseudo
const NON_PSEUDO_TOKENS = new Set([
  't1', 'gen', 'geng', 'hle', 'dk', 'dwg', 'kt', 'drx', 'kdf', 'ns', 'bro', 'fearx', 'bfx',
  'blg', 'tes', 'jdg', 'wbg', 'lng', 'ig', 'edg', 'fpx', 'rng', 'we', 'al', 'nip', 'omg', 'lgd',
  'g2', 'fnc', 'mkoi', 'koi', 'mad', 'kc', 'bds', 'vit', 'sk', 'gx', 'heretics', 'th', 'rge',
  'tl', 'c9', 'fly', '100t', 'nrg', 'dig', 'sr', 'psg', 'cfo', 'gam', 'dfm', 'loud', 'pain',
  'lec', 'lck', 'lpl', 'lcs', 'msi', 'worlds', 'world', 'ewc', 'fs',
  'champion', 'champions', 'mvp', 'legend', 'legends', 'god', 'king', 'demon', 'unkillable',
  'adc', 'top', 'jungle', 'jg', 'mid', 'bot', 'sup', 'support',
  '3peat', '3x', '2x', '4x', '5x', 'ssr', 'ur', 'rare', 'epic', 'legendary', 'secret', 'wanted',
  'card', 'pro', 'icon', 'prime', 'goat', 'edition', 'series',
]);

function formatPseudoCase(raw) {
  if (!raw) return '';
  const lower = raw.toLowerCase();
  if (lower === 'theshy') return 'TheShy';
  if (lower === 'showmaker') return 'ShowMaker';
  if (lower === 'gumayusi') return 'Gumayusi';
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/**
 * Extrait systématiquement le vrai pseudo du joueur (ex: "Faker", "TheShy", "Myrwn", "Larssen")
 */
function getPlayerPseudo(player, baseCard) {
  // 1. Champs directs explicites s'ils existent sur la carte
  const directFields = [
    player?.pseudo, player?.playerName, player?.player, player?.proName, player?.shortName,
    player?.displayName, player?.nickname, player?.ign, player?.joueur, player?.nomJoueur,
    baseCard?.pseudo, baseCard?.playerName, baseCard?.player, baseCard?.proName, baseCard?.shortName,
    baseCard?.displayName, baseCard?.nickname, baseCard?.ign, baseCard?.joueur, baseCard?.nomJoueur,
  ];
  for (const val of directFields) {
    if (typeof val === 'string' && val.trim().length > 0) {
      return val.trim();
    }
  }

  // 2. Correspondance directe sur les titres de cartes spéciaux ("Unkillable Demon King" -> "Faker", etc.)
  const rawName = (baseCard?.name || player?.name || '').trim();
  if (rawName && SPECIAL_TITLE_TO_PSEUDO[rawName.toLowerCase()]) {
    return SPECIAL_TITLE_TO_PSEUDO[rawName.toLowerCase()];
  }

  // 3. Extraction depuis l'ID de la carte (ex: "theshy-legend", "mkoi-myrwn", "faker_udk", "keria-3peat")
  const rawId = String(player?.id || baseCard?.id || '').trim();
  if (rawId) {
    const idTokens = rawId
      .split(/[-_./\s]+/)
      .map(t => t.replace(/[0-9]+$/g, '').trim())
      .filter(t => t.length >= 2 && !NON_PSEUDO_TOKENS.has(t.toLowerCase()));
    if (idTokens.length > 0) {
      return formatPseudoCase(idTokens[0]);
    }
  }

  // 4. Extraction depuis le chemin de l'image de la carte si présent (ex: "/cards/theshy.webp")
  const imgPath = baseCard?.image || baseCard?.img || baseCard?.photo || baseCard?.illustration || player?.image || '';
  if (typeof imgPath === 'string' && imgPath.includes('/')) {
    const fileName = imgPath.split('/').pop().replace(/\.[a-z0-9]+$/i, '');
    const fileTokens = fileName
      .split(/[-_.\s]+/)
      .filter(t => t.length >= 2 && !NON_PSEUDO_TOKENS.has(t.toLowerCase()));
    if (fileTokens.length > 0) {
      return formatPseudoCase(fileTokens[0]);
    }
  }

  // 5. Nettoyage du nom de la carte (ex: "MKOI Myrwn" -> "Myrwn", "LEC Champion Larssen" -> "Larssen", "Gen.G Duro" -> "Duro")
  if (rawName) {
    const nameTokens = rawName
      .replace(/gen\.g/gi, 'geng')
      .split(/\s+/)
      .filter(t => t.length >= 2 && !NON_PSEUDO_TOKENS.has(t.toLowerCase()));
    if (nameTokens.length > 0) {
      return nameTokens[nameTokens.length - 1];
    }
    return rawName;
  }

  return player?.role || 'Player';
}

// ============================================================================
// 5. COMPOSANT PRINCIPAL DE L'ARÈNE
// ============================================================================
export default function ArenaView({ match, matchReady, dismissMatch, state, event, isSpectator = false }) {
  const currentEvent = event || (state?.eventIndex !== undefined ? EVENTS[state.eventIndex] : null) || EVENTS[0];
  const theme = getTournamentArenaConfig(currentEvent);

  const [inspectCard, setInspectCard] = useState(null);

  const mySide = match.teamA?.id === socket.id ? 'A' : match.teamB?.id === socket.id ? 'B' : null;

  const [selectedChampions, setSelectedChampions] = useState(() => {
    const existing = mySide ? match.teamPicks?.[mySide] : null;
    if (existing && Object.keys(existing).length > 0) return { ...existing };
    const prelocked = state?.prelockedChampions?.[socket.id];
    if (prelocked && Object.keys(prelocked).length > 0) return { ...prelocked };
    return {};
  });

  const [championModalRole, setChampionModalRole] = useState(null);

  const isReady = match.ready.includes(socket.id);
  const isFinished = match.status === 'finished';
  const isSimulating = match.status === 'simulating_events' || match.status === 'simulating_result';
  
  const getCardById = (id) => CARD_POOL.find(c => c.id === id);
  const handleSkip = () => socket.emit('skip-match', match.id);

  const getEffectiveChampion = (team, teamSide, role) => {
    if (teamSide === mySide) {
      if (selectedChampions[role]) return selectedChampions[role];
      if (state?.prelockedChampions?.[socket.id]?.[role]) return state.prelockedChampions[socket.id][role];
      if (match.teamPicks?.[teamSide]?.[role]) return match.teamPicks[teamSide][role];
      const p = team?.roster?.find(pro => pro.role === role);
      return p ? getPlayerChampionPool(p, state?.championMastery)?.[0]?.champId : null;
    }
    if (match.teamPicks?.[teamSide]?.[role]) return match.teamPicks[teamSide][role];
    const botPicks = selectBotTeamChampions(team?.roster || [], state?.yearlyMeta, state?.championMastery);
    return botPicks?.[role] || null;
  };

  const handleReady = () => {
    const myTeam = mySide === 'A' ? match.teamA : match.teamB;
    const finalPicks = { ...selectedChampions };
    if (myTeam?.roster) {
      myTeam.roster.forEach(p => {
        if (!finalPicks[p.role]) {
          const prelocked = state?.prelockedChampions?.[socket.id]?.[p.role];
          const defaultChamp = prelocked || getPlayerChampionPool(p, state?.championMastery)?.[0]?.champId;
          if (defaultChamp) finalPicks[p.role] = defaultChamp;
        }
      });
    }
    matchReady(match.id, finalPicks);
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
    const metaSynergy = evaluateTeamMetaSynergy(team.roster, state?.yearlyMeta);

    const teamPicksObj = {};
    ORDERED_ROLES.forEach(r => {
      teamPicksObj[r] = getEffectiveChampion(team, teamSide, r);
    });
    const champSynergy = evaluateTeamChampionPicks(team.roster, teamPicksObj, state?.yearlyMeta, state?.championMastery);

    return Math.round(baseAvg + (totalBuffsForTeam / 5) + getSynergy(team.roster).bonus + (metaSynergy?.bonus || 0) + ((champSynergy?.totalBonus || 0) / 5));
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
          className="text-center relative inline-block z-[1] transition-transform flex flex-col items-center"
        >
          <div 
            onClick={() => setInspectCard(dynamicCard || p)}
            className="cursor-pointer hover:scale-105 transition-transform relative"
            title={`Inspecter ${p.name} (${role}) — Traits & Profil`}
          >
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
   * Colonne de Draft adaptée au Skin du joueur, même hauteur que le panneau d'équipe,
   * 5 rectangles continus de style Broadcast E-Sport avec Splash Art HD, Role Tag, Nom du Champion et Pseudo.
   */
  const renderDraftColumn = (team, teamSide) => {
    const isSideA = teamSide === 'A';
    const isUserTeam = teamSide === mySide;
    const canEditPicks = isUserTeam && !isReady && match.status === 'pending' && !isSpectator;
    const hideOpponentPicks = !isUserTeam && !isSpectator && match.status === 'pending' && !isSimulating && !isFinished;

    const equippedSkinId = getEquippedSkinId(state, team.id);
    const skinTheme = getDraftSkinStyle(equippedSkinId);

    return (
      <div
        className={`w-[220px] lg:w-[250px] shrink-0 self-stretch overflow-hidden relative flex flex-col select-none transition-all duration-300 shadow-2xl ${isSideA ? 'rounded-l-xl rounded-r-none' : 'rounded-r-xl rounded-l-none'}`}
        style={{
          background: skinTheme.background,
          borderStyle: 'solid',
          borderWidth: skinTheme.borderWidth,
          borderColor: skinTheme.borderColor,
          boxShadow: skinTheme.boxShadow,
        }}
      >
        {/* Effet lumineux du skin (sweep / pulse) synchronisé avec TeamSkinFrame */}
        {skinTheme.effect?.type === 'sweep' && (
          <div
            className="pointer-events-none absolute inset-0 z-20"
            style={{
              background: `linear-gradient(110deg, transparent 35%, ${skinTheme.effect.color} 50%, transparent 65%)`,
              animation: 'su-sweep 5s ease-in-out infinite alternate',
            }}
          />
        )}
        {skinTheme.effect?.type === 'pulse' && (
          <div
            className="pointer-events-none absolute inset-0 z-20"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${skinTheme.effect.color}, transparent 70%)`,
              animation: 'su-pulse 3.2s ease-in-out infinite',
            }}
          />
        )}

        {/* 5 Rectangles de Champions continus qui occupent 100% de la hauteur */}
        <div className="relative z-10 flex flex-col flex-1 w-full h-full">
          {ORDERED_ROLES.map((role, index) => {
            const champId = getEffectiveChampion(team, teamSide, role);
            const champData = getChampionById(champId);
            const player = team.roster.find(p => p.role === role);
            const baseCard = player ? getCardById(player.id) : null;
            const playerPseudo = getPlayerPseudo(player, baseCard);

            return (
              <div
                key={role}
                onClick={() => {
                  if (!canEditPicks) return;
                  setChampionModalRole(role);
                }}
                style={{
                  borderBottom: index < ORDERED_ROLES.length - 1 ? `1px solid ${skinTheme.dividerColor}` : 'none',
                  background: hideOpponentPicks ? skinTheme.slotBg : '#070A12',
                }}
                className={`relative flex-1 min-h-[90px] lg:min-h-[96px] w-full overflow-hidden group transition-all duration-300 ${
                  canEditPicks ? 'cursor-pointer hover:brightness-105' : ''
                }`}
                title={
                  hideOpponentPicks
                    ? 'Choix adverse secret avant le lancement de la partie'
                    : canEditPicks
                    ? `Cliquer pour changer le champion de ${playerPseudo} (${champData?.name || role})`
                    : `${playerPseudo} — ${champData?.name || role}`
                }
              >
                {hideOpponentPicks ? (
                  /* État FOG OF WAR : Choix adverse secret avec motif tactique et badge de rôle */
                  <>
                    <div
                      className="absolute inset-0 opacity-20"
                      style={{
                        backgroundImage: `radial-gradient(circle, ${skinTheme.accentColor}33 1px, transparent 1px)`,
                        backgroundSize: '10px 10px',
                      }}
                    />
                    {/* Liseré vertical du skin */}
                    <div
                      className="absolute top-0 bottom-0 w-[3px] pointer-events-none z-10"
                      style={{
                        [isSideA ? 'left' : 'right']: 0,
                        backgroundColor: skinTheme.accentColor,
                        boxShadow: `0 0 10px ${skinTheme.accentColor}`,
                      }}
                    />

                    {/* Badge de rôle discret */}
                    <div className={`absolute top-2.5 z-10 ${isSideA ? 'left-3' : 'right-3'}`}>
                      <span className="px-2 py-0.5 rounded text-[10px] font-rajdhani font-black tracking-[1.5px] uppercase bg-black/60 backdrop-blur-md border border-white/10 text-slate-300">
                        {ROLE_SHORT[role] || role}
                      </span>
                    </div>

                    <div
                      className={`absolute inset-0 flex flex-col justify-end p-3 ${
                        isSideA ? 'items-end text-right' : 'items-start text-left'
                      }`}
                    >
                      <span
                        className="font-rajdhani text-[10px] font-black uppercase tracking-[2px] leading-none mb-1 opacity-90 flex items-center gap-1.5"
                        style={{ color: skinTheme.accentColor }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
                        SÉLECTION
                      </span>
                      <span
                        className="font-rajdhani text-[17px] lg:text-[18px] font-extrabold text-white tracking-wide leading-none truncate max-w-full"
                        style={{ textShadow: '0 2px 6px rgba(0,0,0,0.95)' }}
                      >
                        {playerPseudo}
                      </span>
                    </div>
                  </>
                ) : (
                  /* Rectangle avec Splash Art HD, Role Badge, Lock Indicator, Nom du Champion & Pseudo */
                  <>
                    <ChampionDraftSplash
                      key={champId || role}
                      champData={champData}
                      canEditPicks={canEditPicks}
                      skinTheme={skinTheme}
                    />

                    {/* Dégradé cinématique broadcast : contraste parfait sans assombrir le visage */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: isSideA
                          ? 'linear-gradient(to top, rgba(3,6,14,0.94) 0%, rgba(3,6,14,0.4) 48%, rgba(3,6,14,0.08) 80%, transparent 100%), linear-gradient(to left, rgba(3,6,14,0.65) 0%, transparent 60%)'
                          : 'linear-gradient(to top, rgba(3,6,14,0.94) 0%, rgba(3,6,14,0.4) 48%, rgba(3,6,14,0.08) 80%, transparent 100%), linear-gradient(to right, rgba(3,6,14,0.65) 0%, transparent 60%)',
                      }}
                    />

                    {/* Liseré lumineux latéral assorti au skin équipé */}
                    <div
                      className="absolute top-0 bottom-0 w-[3px] pointer-events-none z-10 transition-all duration-300 group-hover:w-[4px]"
                      style={{
                        [isSideA ? 'left' : 'right']: 0,
                        backgroundColor: skinTheme.accentColor,
                        boxShadow: `0 0 12px ${skinTheme.accentColor}`,
                      }}
                    />

                    {/* Badge de Rôle (Coin extérieur haut) */}
                    <div className={`absolute top-2.5 z-10 ${isSideA ? 'left-3' : 'right-3'}`}>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-rajdhani font-black tracking-[1.5px] uppercase bg-black/75 backdrop-blur-md border border-white/15 text-slate-200 shadow-sm flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: skinTheme.accentColor }} />
                        {ROLE_SHORT[role] || role}
                      </span>
                    </div>

                    {/* Badge LOCKED (Coin opposé haut) */}
                    <div className={`absolute top-2.5 z-10 ${isSideA ? 'right-3' : 'left-3'}`}>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-rajdhani font-black tracking-widest uppercase bg-black/65 backdrop-blur-md border border-emerald-500/35 text-emerald-400 flex items-center gap-1 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        LOCK
                      </span>
                    </div>

                    {/* Overlay interactif chic au survol si le pick est modifiable */}
                    {canEditPicks && (
                      <div className="absolute inset-0 z-20 bg-black/40 backdrop-blur-[1.5px] opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center pointer-events-none">
                        <span
                          className="px-3.5 py-1 rounded-full bg-black/90 border text-[11px] font-rajdhani font-black uppercase tracking-[1.5px] text-white shadow-2xl flex items-center gap-1.5 transform group-hover:scale-105 transition-transform"
                          style={{ borderColor: skinTheme.accentColor }}
                        >
                          <span>⇄</span>
                          <span>CHANGER</span>
                        </span>
                      </div>
                    )}

                    {/* Informations du Champion & Pseudo du Joueur (Coin intérieur bas) */}
                    <div
                      className={`absolute bottom-2.5 z-10 pointer-events-none max-w-[90%] flex flex-col ${
                        isSideA ? 'right-3.5 items-end text-right' : 'left-3.5 items-start text-left'
                      }`}
                    >
                      {/* Nom du Champion verrouillé */}
                      <span
                        className="font-rajdhani text-[11px] lg:text-[12px] font-black uppercase tracking-[2px] leading-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] opacity-95"
                        style={{ color: skinTheme.accentColor }}
                      >
                        {champData?.name || role}
                      </span>

                      {/* Pseudo du joueur */}
                      <span
                        className="font-rajdhani text-[18px] lg:text-[21px] font-black text-white tracking-[0.5px] leading-none truncate max-w-full"
                        style={{
                          textShadow: '0 1px 2px #000, 0 2px 8px rgba(0,0,0,0.98), 0 0 16px rgba(0,0,0,0.9)',
                        }}
                      >
                        {playerPseudo}
                      </span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /**
   * Panneau d'équipe calibré pour afficher les cartes en 3/2 (3 en haut, 2 en bas)
   */
  const renderTeamPanel = (team, side) => {
    const isSideA = side === 'A';
    const synergy = getSynergy(team.roster);
    const rawAvg = team.roster.reduce((a, b) => a + (b.rating || b.overall || 0), 0) / 5;
    const avg = getTeamAvg(team, side);
    const equippedSkinId = getEquippedSkinId(state, team.id);
    const skinTheme = getDraftSkinStyle(equippedSkinId);

    const myKnowledge = state?.metaKnowledge?.[socket.id];
    const isMetaDiscovered = (myKnowledge?.points >= 100) || myKnowledge?.discoveredClues?.some(c => c.threshold === 100);
    const metaSynergy = evaluateTeamMetaSynergy(team.roster, state?.yearlyMeta);

    const teamPicksObj = {};
    ORDERED_ROLES.forEach(r => {
      teamPicksObj[r] = getEffectiveChampion(team, side, r);
    });
    const champSynergy = evaluateTeamChampionPicks(team.roster, teamPicksObj, state?.yearlyMeta, state?.championMastery);

    const totalTeamMetaBonus = Math.round(((metaSynergy?.bonus || 0) + (champSynergy?.totalChampionMetaBonus || 0)) * 10) / 10;
    
    const isUserTeam = side === mySide;
    const hideOpponentPicks = !isUserTeam && !isSpectator && match.status === 'pending' && !isSimulating && !isFinished;
    const picksForKnownMeta = hideOpponentPicks ? {} : teamPicksObj;
    const knownMeta = calculateKnownMetaBonus(team.roster, picksForKnownMeta, state?.yearlyMeta, myKnowledge);

    return (
      <TeamSkinFrame
        skinId={getEquippedSkinId(state, team.id)}
        className={`w-[380px] lg:w-[405px] shrink-0 p-6 lg:p-7 flex flex-col justify-between ${isSideA ? '!rounded-l-none !rounded-r-xl' : '!rounded-r-none !rounded-l-xl'}`}
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
            {!isMetaDiscovered ? (
              <span 
                className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#141A28] text-text-faint border border-[#252E44] tracking-wider"
                title="Bonus de méta non entièrement identifié (+?)"
              >
                +? Méta
              </span>
            ) : (
              <span 
                className="px-2 py-0.5 rounded text-[11px] font-bold bg-accent-green/15 text-accent-green border border-accent-green/30 tracking-wider shadow-[0_0_10px_rgba(0,230,118,0.2)]"
                title={`Bonus Méta Total (Ligue + Champions méta) : ${totalTeamMetaBonus >= 0 ? '+' : ''}${totalTeamMetaBonus}`}
              >
                {totalTeamMetaBonus >= 0 ? `+${totalTeamMetaBonus}` : `${totalTeamMetaBonus}`} Méta
              </span>
            )}

            <span 
              className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#1E1B38] text-[#C4B5FD] border border-[#7C3AED]/40 tracking-wider shadow-[0_0_10px_rgba(124,58,237,0.2)]"
              title={`Bonus de Méta actuellement CONNU par votre staff pour cette équipe (${knownMeta.knownBonus >= 0 ? '+' : ''}${knownMeta.knownBonus}${knownMeta.hasUnknown ? ' avec des éléments inconnus' : ''})`}
            >
              Méta Connue: {knownMeta.knownBonus >= 0 ? `+${knownMeta.knownBonus}` : `${knownMeta.knownBonus}`}{knownMeta.hasUnknown ? ' (+?)' : ''}
            </span>

            {champSynergy?.totalMasteryBonus > 0 && (
              <span 
                className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30 tracking-wider shadow-[0_0_10px_rgba(56,189,248,0.2)]"
                title="Bonus de maîtrise des champions (appliqué individuellement aux notes des joueurs)"
              >
                +{champSynergy.totalMasteryBonus} Maîtrises (Indiv.)
              </span>
            )}
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
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center font-sans overflow-x-hidden p-4 lg:p-6 transition-colors duration-700">
      {inspectCard && (
        <CardDetailModal 
          card={inspectCard} 
          onClose={() => setInspectCard(null)} 
          yearlyMeta={state?.yearlyMeta}
          currentKnowledge={state?.metaKnowledge?.[socket.id]}
        />
      )}

      {championModalRole && (
        <ChampionPickerModal
          isOpen={true}
          onClose={() => setChampionModalRole(null)}
          card={(mySide === 'A' ? match.teamA : match.teamB)?.roster?.find(p => p.role === championModalRole)}
          role={championModalRole}
          currentChampionId={selectedChampions[championModalRole] || state?.prelockedChampions?.[socket.id]?.[championModalRole]}
          onSelectChampion={(champId) => {
            setSelectedChampions(prev => ({ ...prev, [championModalRole]: champId }));
          }}
          yearlyMeta={state?.yearlyMeta}
          championMasteryState={state?.championMastery}
          mode="arena"
        />
      )}
      
      {theme.type === 'first_stand' && <FirstStandBackground />}
      {theme.type === 'msi' && <MsiBackground logo={theme.logo} />}
      {theme.type === 'ewc' && <EwcBackground />}
      {theme.type === 'worlds' && <WorldsBackground logo={theme.logo} />}

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

          <h1 className={`font-rajdhani text-[38px] uppercase font-black m-0 leading-tight ${theme.titleColor}`}>
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
        
        {/* SCÈNE PRINCIPALE : DRAFT A - ÉQUIPE A (3/2) - CONSOLE CENTRALE - ÉQUIPE B (3/2) - DRAFT B */}
        <div className="flex w-full max-w-[1680px] gap-4 items-stretch mt-3 justify-center overflow-x-auto pb-4">
          
          {/* Bloc Équipe A (Draft + Panel fusionnés) */}
          <div className="flex items-stretch gap-0">
            {renderDraftColumn(match.teamA, 'A')}
            {renderTeamPanel(match.teamA, 'A')}
          </div>

          <div className="text-center w-[260px] lg:w-[300px] shrink-0 flex flex-col justify-center px-2 relative">
            
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

          {/* Bloc Équipe B (Panel + Draft fusionnés) */}
          <div className="flex items-stretch gap-0">
            {renderTeamPanel(match.teamB, 'B')}
            {renderDraftColumn(match.teamB, 'B')}
          </div>

        </div>
      </div>
    </div>
  );
}