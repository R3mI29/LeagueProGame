import React, { useState, useEffect, useRef } from 'react';
import { CARD_POOL } from '../constants/cardPlayers'; 
import CardIllustration from './CardIllustration';
import { TEAMS_DB } from '../constants/teams'; 

function ScreenShatterReveal({ children, onStartVideo, onShatterComplete }) {
  // crackStep: 0: Calme (logo) | 1: Fissure NW | 2: Fissure E | 3: Fissure SE | 4: Fissure SW | 5: Tension | 6: BAM & Chute | 7: Terminé
  const [crackStep, setCrackStep] = React.useState(0);

  React.useEffect(() => {
    const timers = [
      setTimeout(() => setCrackStep(1), 800),   // 0.8s : Branche 1 (Nord-Ouest & Ouest)
      setTimeout(() => setCrackStep(2), 2000),  // 2.0s : Branche 2 (Est & Nord)
      setTimeout(() => setCrackStep(3), 3200),  // 3.2s : Branche 3 (Sud-Est & Est)
      setTimeout(() => setCrackStep(4), 4400),  // 4.4s : Branche 4 (Sud-Ouest & Ouest)
      setTimeout(() => setCrackStep(5), 5400),  // 5.4s : Suspension sous tension critique (le verre vibre)
      setTimeout(() => {
        setCrackStep(6);
        onStartVideo?.();
      }, 6400),                                 // 6.4s : BAM ! Rupture instantanée, flash et chute des morceaux
      setTimeout(() => {
        setCrackStep(7);
        onShatterComplete?.();
      }, 7300),                                 // 7.3s : Fin de la transition et bascule vidéo plein écran
    ];

    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  // 9 Fragments polygonaux qui composent l'écran entier
  const SHARDS = [
    { id: 1, clip: 'polygon(0% 0%, 28% 0%, 42% 40%, 34% 46%, 0% 36%)',              dx: '-4vw', dy: '125vh', rot: -14, delay: 0.04 },
    { id: 2, clip: 'polygon(28% 0%, 52% 0%, 58% 38%, 42% 40%)',                      dx: '-1vw', dy: '130vh', rot: 6,   delay: 0.01 },
    { id: 3, clip: 'polygon(52% 0%, 100% 0%, 100% 35%, 58% 38%)',                   dx: '4vw',  dy: '128vh', rot: 12,  delay: 0.06 },
    { id: 4, clip: 'polygon(58% 38%, 100% 35%, 100% 70%, 64% 52%)',                  dx: '6vw',  dy: '135vh', rot: 16,  delay: 0.03 },
    { id: 5, clip: 'polygon(42% 40%, 58% 38%, 64% 52%, 54% 62%, 38% 58%, 34% 46%)', dx: '0vw',  dy: '140vh', rot: -8,  delay: 0.00 },
    { id: 6, clip: 'polygon(64% 52%, 100% 70%, 100% 100%, 78% 100%, 54% 62%)',      dx: '5vw',  dy: '132vh', rot: 10,  delay: 0.08 },
    { id: 7, clip: 'polygon(54% 62%, 78% 100%, 24% 100%, 38% 58%)',                  dx: '-2vw', dy: '136vh', rot: -6,  delay: 0.05 },
    { id: 8, clip: 'polygon(38% 58%, 24% 100%, 0% 100%, 0% 72%)',                    dx: '-6vw', dy: '130vh', rot: -16, delay: 0.07 },
    { id: 9, clip: 'polygon(0% 36%, 34% 46%, 38% 58%, 0% 72%)',                      dx: '-5vw', dy: '126vh', rot: 8,   delay: 0.02 },
  ];

  if (crackStep === 7) return null;

  const isFalling = crackStep >= 6;
  const isTense = crackStep === 5;

  return (
    <div className={`fixed inset-0 z-[9995] pointer-events-none overflow-hidden ${
      isTense ? 'animate-[glassTensionHum_0.9s_ease-in-out_infinite]' : ''
    }`}>
      {/* Flash d'éclatement instantané BAM à 7.2s */}
      {isFalling && (
        <div 
          className="absolute inset-0 bg-white pointer-events-none z-50 animate-[shatterBamFlash_0.45s_ease-out_forwards]"
          style={{ mixBlendMode: 'screen' }}
        />
      )}

      {/* SVG de traçage progressif et réaliste des fissures branche par branche */}
      <svg
        className="absolute inset-0 w-full h-full z-30 pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="crackSpecularGlow">
            <feDropShadow dx="0" dy="0" stdDeviation="0.4" floodColor="#ffffff" floodOpacity="0.95" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.2" floodColor="rgba(210,235,255,0.7)" />
          </filter>
        </defs>

        <g
          stroke="#ffffff"
          strokeWidth="0.35"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          filter="url(#crackSpecularGlow)"
          style={{
            opacity: isFalling ? 0 : 1,
            transition: 'opacity 0.25s ease-out'
          }}
        >
          {/* ÉTAPE 1 : BRANCHE NORD-OUEST (dès 0.8s) */}
          {crackStep >= 1 && (
            <g>
              <path d="M50,48 L46,44 L42,40 L28,0" pathLength="1" style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: 'drawBranchSlow 0.75s cubic-bezier(0.2,0.8,0.2,1) forwards' }} />
              <path d="M42,40 L34,46 L0,36" pathLength="1" style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: 'drawBranchSlow 0.65s 0.25s cubic-bezier(0.2,0.8,0.2,1) forwards' }} />
            </g>
          )}

          {/* ÉTAPE 2 : BRANCHE EST (dès 2.0s) */}
          {crackStep >= 2 && (
            <g>
              <path d="M50,48 L54,46 L58,38 L82,37 L100,35" pathLength="1" style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: 'drawBranchSlow 0.75s cubic-bezier(0.2,0.8,0.2,1) forwards' }} />
              <path d="M58,38 L55,20 L52,0" pathLength="1" style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: 'drawBranchSlow 0.6s 0.25s cubic-bezier(0.2,0.8,0.2,1) forwards' }} />
            </g>
          )}

          {/* ÉTAPE 3 : BRANCHE SUD-EST (dès 3.2s) */}
          {crackStep >= 3 && (
            <g>
              <path d="M50,48 L52,55 L54,62 L78,100" pathLength="1" style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: 'drawBranchSlow 0.75s cubic-bezier(0.2,0.8,0.2,1) forwards' }} />
              <path d="M54,62 L64,52 L80,70 L100,70" pathLength="1" style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: 'drawBranchSlow 0.65s 0.25s cubic-bezier(0.2,0.8,0.2,1) forwards' }} />
            </g>
          )}

          {/* ÉTAPE 4 : BRANCHE SUD-OUEST (dès 4.4s) */}
          {crackStep >= 4 && (
            <g>
              <path d="M50,48 L44,48 L38,58 L24,100" pathLength="1" style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: 'drawBranchSlow 0.75s cubic-bezier(0.2,0.8,0.2,1) forwards' }} />
              <path d="M38,58 L14,68 L0,72" pathLength="1" style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: 'drawBranchSlow 0.65s 0.25s cubic-bezier(0.2,0.8,0.2,1) forwards' }} />
            </g>
          )}


        </g>
      </svg>

      {/* Les 9 Fragments découpés qui composent l'écran et tombent vers le bas dès l'étape 6 (BAM à 6.4s) */}
      {SHARDS.map(s => (
        <div
          key={s.id}
          className="absolute inset-0 bg-[#050508]"
          style={{
            clipPath: s.clip,
            transform: isFalling
              ? `translate(${s.dx}, ${s.dy}) rotate(${s.rot}deg)`
              : 'translate(0, 0) rotate(0deg)',
            transition: isFalling
              ? `transform 0.95s cubic-bezier(0.5, 0, 0.85, 0.3) ${s.delay}s, opacity 0.4s ease-in ${s.delay + 0.45}s`
              : 'none',
            opacity: isFalling ? 0 : 1,
            boxShadow: isFalling ? '0 15px 30px rgba(0,0,0,0.8)' : 'none',
          }}
        >
          {children}
        </div>
      ))}
    </div>
  );
}


export default function PackOpener({ cardIds, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const [revealStep, setRevealStep] = useState(0);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [isCracking, setIsCracking] = useState(false);
  const [videoWatched, setVideoWatched] = useState(false);
  const videoRef = useRef(null);

  const showSummary = currentIndex >= cardIds.length;
  const currentItem = !showSummary ? cardIds[currentIndex] : null;
  const currentCardId = currentItem?.id || currentItem;
  const currentCard = CARD_POOL.find(c => c.id === currentCardId);

  const isWalkout = currentCard && ['Épique', 'Légendaire', 'WANTED', 'SECRET'].includes(currentCard.rarity);
  const finalStep = currentCard?.rarity === 'WANTED' ? 6 : 5;
  const wantedVideo = currentCard?.video || null;

  const [hadVideoTransition, setHadVideoTransition] = useState(false);

  const finishVideo = (wasPlayed = false) => {
    setIsPlayingVideo(false);
    setIsCracking(false);
    setVideoWatched(true);
    if (wasPlayed) {
      setHadVideoTransition(true);
    }
    setRevealStep(currentCard?.videoTiming === 'start' ? 1 : 5);
  };

  // Sécurité : si la vidéo ne se charge pas ou plante, on passe directement
  useEffect(() => {
    if (!isPlayingVideo) return;
    const timeout = setTimeout(() => {
      if (videoRef.current && (videoRef.current.error || videoRef.current.readyState === 0)) {
        finishVideo(false);
      }
    }, 1200);
    return () => clearTimeout(timeout);
  }, [isPlayingVideo]);

  // Démarrage de la vidéo avec son normal (volume 1) dès qu'elle devient active
  useEffect(() => {
    if (isPlayingVideo && videoRef.current) {
      videoRef.current.volume = 1;
      videoRef.current.muted = false;
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {
          if (videoRef.current) {
            videoRef.current.muted = true;
            videoRef.current.play();
          }
        });
      }
    }
  }, [isPlayingVideo]);

  useEffect(() => {
    if (showSummary || isClosing || !currentCard || isPlayingVideo || isCracking) return;

    if (!isWalkout && revealStep < finalStep) {
      setRevealStep(finalStep);
      return;
    }

    if (revealStep >= finalStep) return;

    // Déclenchement vidéo au début (si configuré avec videoTiming === 'start')
    if (revealStep === 0 && currentCard?.rarity === 'WANTED' && wantedVideo && !videoWatched && currentCard?.videoTiming === 'start') {
      setIsPlayingVideo(true);
      return;
    }

    // Déclenchement de l'effet d'écran qui se brise avant la vidéo (directement à l'arrivée sur l'étape 4)
    if (revealStep === 4 && currentCard?.rarity === 'WANTED' && wantedVideo && !videoWatched && !isCracking && currentCard?.videoTiming !== 'start') {
      setIsCracking(true);
      return;
    }

    // Si une vidéo WANTED doit se jouer après l'étape 4, NE PAS passer à l'étape 5 automatiquement !
    if (revealStep === 4 && currentCard?.rarity === 'WANTED' && wantedVideo && !videoWatched) {
      return;
    }

    let delay = 1300; 
    
    if (revealStep === 5 && currentCard.rarity === 'WANTED') {
      delay = 20000;
    }

    const timer = setTimeout(() => {
      setRevealStep(prev => prev + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [revealStep, showSummary, isClosing, currentCard, isWalkout, finalStep, isPlayingVideo, videoWatched, wantedVideo]);

  // Passage avec ESPACE (Permet le SKIP et le NEXT)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !showSummary) {
        e.preventDefault();
        if (isCracking || isPlayingVideo) {
          setIsCracking(false);
          finishVideo(true);
          return;
        }
        if (revealStep < finalStep) {
          setRevealStep(finalStep); // Skip
        } else {
          setCurrentIndex(prev => prev + 1); // Next
          setRevealStep(0); 
          setVideoWatched(false);
          setIsPlayingVideo(false);
          setIsCracking(false);
          setHadVideoTransition(false);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSummary, revealStep, finalStep, isPlayingVideo, isCracking]);

  if (!cardIds || cardIds.length === 0 || isClosing) return null;

  // Passage au CLIC (Bloqué pendant l'animation)
  const handleNext = () => {
    if (isCracking || isPlayingVideo) {
      setIsCracking(false);
      finishVideo(true);
      return;
    }
    if (!showSummary && revealStep >= finalStep) {
      setCurrentIndex(prev => prev + 1); 
      setRevealStep(0); 
      setVideoWatched(false);
      setIsPlayingVideo(false);
      setHadVideoTransition(false);
    }
  };

  const handleClose = () => {
    setIsClosing(true); 
    onClose(); 
  };

  const natCode = currentCard?.nationality || "kr"; 
  const roleName = currentCard?.role || "Mid";
  const leagueName = currentCard?.league || "LCK";
  const teamInfo = TEAMS_DB.find(t => t.tag === currentCard?.teamTag) || { logo: '/equipes/t1.webp' };
  
  const themeColor = currentCard?.themeColor || '#D4AF37';

  const getRoleImage = (role) => {
    const roleMap = { 'Top': 'Top.webp', 'Jungle': 'Jungle.webp', 'Mid': 'Midlane.webp', 'ADC': 'Botlane.webp', 'Support': 'Support.webp' };
    return `/roles/${roleMap[role] || 'Midlane.webp'}`;
  };

  const getLeagueImage = (league) => `/leagues/${league.toLowerCase()}.webp`;

  let glowColor = 'rgba(255, 255, 255, 0.05)'; 
  if (revealStep >= finalStep) {
    if (currentCard?.rarity === 'Commune') glowColor = 'rgba(139, 155, 180, 0.3)';
    if (currentCard?.rarity === 'Rare') glowColor = 'rgba(0, 229, 255, 0.5)';
    if (currentCard?.rarity === 'Épique') glowColor = 'rgba(255, 51, 102, 0.6)';
    if (currentCard?.rarity === 'Légendaire') glowColor = 'rgba(255, 215, 0, 0.8)';
    if (currentCard?.rarity === 'WANTED') glowColor = 'rgba(255, 255, 255, 1)';
  }

  const marqueeBase = `${currentCard?.baseName} • ${currentCard?.teamTag} • `;
  const marqueeText = marqueeBase.repeat(20);

  return (
    <div
      onClick={showSummary ? undefined : handleNext}
      className={`fixed inset-0 bg-[#050508]/98 backdrop-blur-xl z-[10000] flex flex-col items-center justify-center font-sans overflow-hidden ${(showSummary || revealStep < finalStep) ? 'cursor-default' : 'cursor-pointer'}`}
      style={{ '--theme-color': themeColor }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popUpStat { 0% { opacity: 0; transform: scale(0.8) translateY(20px); filter: blur(5px); } 100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); } }
        
        @keyframes popAndFade {
          0% { transform: scale(0.5); opacity: 0; filter: blur(10px); }
          20% { transform: scale(1.1); opacity: 1; filter: blur(0px); drop-shadow: 0 0 30px rgba(255,255,255,0.2); }
          30% { transform: scale(1); }
          80% { transform: scale(1.05); opacity: 1; filter: blur(0px); }
          100% { transform: scale(1.3); opacity: 0; filter: blur(15px); }
        }

        @keyframes legendaryBoom { 
          0% { transform: scale(0.2) translateY(-200px) rotate(15deg); filter: brightness(5) blur(10px); opacity: 0; } 
          50% { transform: scale(1.1) translateY(20px) rotate(-5deg); filter: brightness(2) blur(0px); opacity: 1; drop-shadow: 0 0 50px #ffd700; } 
          75% { transform: scale(0.95) translateY(-10px) rotate(2deg); }
          100% { transform: scale(1) translateY(0) rotate(0deg); filter: brightness(1); } 
        }

        /* --- CINÉMATIQUE PREMIUM "HALL OF GODS" --- */
        
        @keyframes eclipseGrow { 
          0% { transform: scale(0); opacity: 0; } 
          40% { transform: scale(1); opacity: 1; box-shadow: 0 0 30px var(--theme-color), inset 0 0 10px var(--theme-color); }
          80% { transform: scale(1.1); opacity: 1; filter: brightness(2); }
          100% { transform: scale(5); opacity: 0; filter: brightness(5); } 
        }

        @keyframes silentFlash { 0%, 100% { opacity: 0; } 10% { opacity: 1; } }

        @keyframes divineLight {
          0% { opacity: 0; transform: translateY(-50px); }
          100% { opacity: 0.25; transform: translateY(0); } 
        }

        @keyframes marqueeLeft { 0% { transform: translateX(0%); } 100% { transform: translateX(-33.33%); } }
        @keyframes marqueeRight { 0% { transform: translateX(-33.33%); } 100% { transform: translateX(0%); } }

        @keyframes majesticRise {
          0% { opacity: 0; transform: translateY(100px) scale(0.8); filter: blur(15px) brightness(0.5); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0px) brightness(1); }
        }

        @keyframes majesticFloat {
          0%, 100% { transform: translateY(0px); filter: drop-shadow(0 20px 30px rgba(0,0,0,0.8)) drop-shadow(0 0 15px var(--theme-color)); }
          50% { transform: translateY(-10px); filter: drop-shadow(0 30px 40px rgba(0,0,0,0.6)) drop-shadow(0 0 25px var(--theme-color)); }
        }

        @keyframes dustFloat {
          0% { transform: translateY(100vh) scale(0); opacity: 0; }
          20% { opacity: 1; transform: translateY(50vh) scale(1); }
          80% { opacity: 1; }
          100% { transform: translateY(-20vh) scale(0); opacity: 0; }
        }

        @keyframes slideGlassPanel {
          0% { opacity: 0; transform: translateX(-50px) scale(0.95); backdrop-filter: blur(0px); }
          100% { opacity: 1; transform: translateX(0) scale(1); backdrop-filter: blur(20px); }
        }
        @keyframes slideGlassPanelRight {
          0% { opacity: 0; transform: translateX(50px) scale(0.95); backdrop-filter: blur(0px); }
          100% { opacity: 1; transform: translateX(0) scale(1); backdrop-filter: blur(20px); }
        }

        @keyframes metallicShine {
          0% { background-position: -200% center; opacity: 0; transform: translateY(20px); }
          20% { opacity: 1; transform: translateY(0); }
          100% { background-position: 200% center; opacity: 1; }
        }

        @keyframes cinematicFadeOutFix { 0%, 95% { opacity: 1; filter: blur(0px); transform: scale(1); } 100% { opacity: 0; filter: blur(20px); transform: scale(1.1); } }
        @keyframes wantedCardDrop { 0% { transform: scale(2) translateY(-100px); filter: brightness(10); opacity: 0; } 100% { transform: scale(1) translateY(0); filter: brightness(1); opacity: 1; } }

        /* Entrée nette du logo sans fade-out */
        @keyframes popInStay {
          0% { transform: scale(0.6); opacity: 0; filter: blur(8px); }
          65% { transform: scale(1.06); opacity: 1; filter: blur(0px); drop-shadow: 0 0 30px rgba(255,255,255,0.25); }
          100% { transform: scale(1); opacity: 1; filter: blur(0px); drop-shadow: 0 0 30px rgba(255,255,255,0.2); }
        }

        /* Animation lente et progressive des fissures branche par branche */
        @keyframes drawBranchSlow {
          0% { stroke-dashoffset: 1; opacity: 0; }
          10% { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }

        @keyframes impactDotPop {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.6); opacity: 1; filter: drop-shadow(0 0 4px #fff); }
          100% { transform: scale(1); opacity: 0.95; }
        }

        @keyframes impactWavePop {
          0% { transform: scale(0.2); opacity: 1; }
          100% { transform: scale(1.8); opacity: 0; }
        }

        @keyframes microGlassTick {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-1px, 1px); }
          50% { transform: translate(1px, -1px); }
          75% { transform: translate(-0.5px, 0.5px); }
        }

        /* Vibration de suspense sous tension extrême (5.9s à 7.0s) */
        @keyframes glassTensionHum {
          0%, 100% { transform: translate(0, 0); }
          15% { transform: translate(-1.5px, 1px); }
          30% { transform: translate(1.5px, -1.5px); }
          45% { transform: translate(-2px, 1.5px); }
          60% { transform: translate(2px, -2px); }
          75% { transform: translate(-2.5px, 2px); }
          90% { transform: translate(2.5px, -1.5px); }
        }

        /* Flash BAM lors de la rupture à 7.0s */
        @keyframes shatterBamFlash {
          0% { opacity: 0; }
          15% { opacity: 0.95; }
          100% { opacity: 0; }
        }`}</style>

      {/* LECTEUR VIDÉO AVANT ANIMATION WANTED (Actif dès isCracking en arrière-plan) */}
      {(isCracking || isPlayingVideo) && wantedVideo && (
        <div 
          className={`fixed inset-0 bg-black flex items-center justify-center select-none ${
            isPlayingVideo ? 'z-[9999] cursor-pointer pointer-events-auto' : 'z-[9990] pointer-events-none'
          }`}
          onClick={isPlayingVideo ? () => finishVideo(true) : undefined}
        >
          <video
            ref={videoRef}
            src={wantedVideo}
            playsInline
            className="w-full h-full object-contain pointer-events-none"
            onEnded={() => finishVideo(true)}
            onError={() => finishVideo(false)}
          />
          {isPlayingVideo && (
            <div className="absolute bottom-8 right-8 z-50 flex items-center gap-3 pointer-events-auto">
              <span className="text-white/70 font-rajdhani text-xs tracking-[2px] uppercase bg-black/70 px-4 py-2 rounded-full border border-white/15 backdrop-blur-md">
                Passer la vidéo (ESPACE ou CLIC) ⏭
              </span>
            </div>
          )}
        </div>
      )}

      {showSummary ? (
        <div className="flex flex-col items-center animate-[fadeIn_0.4s] w-full max-w-[1200px]">
          <div className="text-[26px] text-[#FFB020] mb-10 font-rajdhani font-bold tracking-[2px]">
            RÉCAPITULATIF DU PACK
          </div>
          <div className="flex gap-5 flex-wrap justify-center">
            {cardIds.map((item, index) => {
              const c = CARD_POOL.find(card => card.id === (item.id || item));
              return (
                <div key={index} className="flex flex-col items-center gap-2.5 animate-[fadeIn_0.4s]" style={{ animationDelay: `${index * 0.1}s` }}>
                  {c && <CardIllustration card={c} width={130} />}
                </div>
              );
            })}
          </div>
          <button 
            onClick={handleClose}
            className="mt-14 bg-[#4CE0D2] text-[#0A0E14] py-3.5 px-7 rounded text-[15px] font-bold font-rajdhani tracking-wider transition-transform active:scale-95 shadow-[0_4px_15px_rgba(76,224,210,0.3)]"
          >
            AJOUTER À LA COLLECTION
          </button>
        </div>
      ) : isCracking ? (
        <ScreenShatterReveal
          onStartVideo={() => {
            const v = videoRef.current;
            if (!v) return;
            v.currentTime = 0;
            v.volume = 1;
            v.muted = false;
            v.play().catch(() => {
              if (videoRef.current) {
                videoRef.current.muted = true;
                videoRef.current.play();
              }
            });
          }}
          onShatterComplete={() => {
            setIsCracking(false);
            setIsPlayingVideo(true);
          }}
        >
          {/* L'écran unique et continu de l'étape 4 avec le logo du club qui se fissure et se brise */}
          <div className="relative flex flex-col items-center justify-center w-full h-full select-none">
            <div className="absolute top-10 text-lg text-text-muted font-rajdhani tracking-[2px] font-bold z-50">
              CARTE {currentIndex + 1} / {cardIds.length}
            </div>

            <div 
              className="absolute w-[600px] h-[600px] rounded-full blur-[150px] -z-10 transition-colors duration-500"
              style={{ backgroundColor: glowColor }}
            />

            <div className="relative flex flex-col items-center justify-center w-full h-[500px]">
              <img 
                src={teamInfo.logo} 
                alt="Club" 
                className="w-[300px] object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] animate-[popInStay_0.4s_ease-out_both]" 
              />
            </div>

            <div className="absolute bottom-10 text-white/30 text-sm font-rajdhani tracking-widest uppercase z-50">
              Appuyez sur ESPACE pour passer l'animation
            </div>
          </div>
        </ScreenShatterReveal>
      ) : (

        <div className="relative flex flex-col items-center justify-center w-full h-full">
          
          <div className="absolute top-10 text-lg text-text-muted font-rajdhani tracking-[2px] font-bold z-50">
            CARTE {currentIndex + 1} / {cardIds.length}
          </div>

          <div 
            className="absolute w-[600px] h-[600px] rounded-full blur-[150px] -z-10 transition-colors duration-500"
            style={{ backgroundColor: glowColor }}
          />

          <div className="relative flex flex-col items-center justify-center w-full h-[500px]">
            
            {/* ETAPES 1 à 4 : Les Indices */}
            {revealStep >= 1 && revealStep < 5 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {revealStep === 1 && (
                  <img src={`https://flagcdn.com/w320/${natCode.toLowerCase()}.png`} alt="Country" className="w-[300px] object-cover rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.1)] animate-[popAndFade_1.2s_both]" />
                )}
                {revealStep === 2 && (
                  <img src={getLeagueImage(leagueName)} alt={leagueName} className="w-[280px] object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] animate-[popAndFade_1.2s_both]" onError={(e) => e.target.style.display='none'} />
                )}
                {revealStep === 3 && (
                  <img src={getRoleImage(roleName)} alt={roleName} className="h-[250px] object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] animate-[popAndFade_1.2s_both]" onError={(e) => e.target.style.display='none'}/>
                )}
                {revealStep === 4 && (
                  <img src={teamInfo.logo} alt="Club" className="w-[300px] object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] animate-[popAndFade_1.2s_both]" />
                )}
              </div>
            )}

            {/* ETAPE 5 : Le Hall of Gods (Cinématique WANTED) */}
            {revealStep === 5 && currentCard?.rarity === 'WANTED' && (
              <div className="fixed inset-0 z-40 bg-[#020308] flex items-center justify-center pointer-events-none overflow-hidden animate-[cinematicFadeOutFix_20s_both]">
                
                {!hadVideoTransition && (
                  <>
                    <div className="absolute inset-0 flex items-center justify-center z-50">
                      <div 
                        className="w-[100px] h-[100px] rounded-full bg-black border-[4px] animate-[eclipseGrow_1.5s_ease-in_forwards]"
                        style={{ borderColor: themeColor }}
                      />
                    </div>

                    <div className="absolute inset-0 z-50 bg-white animate-[silentFlash_0.8s_1.3s_both]" />
                  </>
                )}

                <div className={`absolute inset-0 z-30 ${hadVideoTransition ? 'animate-[fadeIn_0.5s_0.1s_both]' : 'animate-[fadeIn_1s_1.5s_both]'}`}>
                  
                  <div 
                    className={`absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[60vh] opacity-0 ${hadVideoTransition ? 'animate-[divineLight_1.5s_0.1s_forwards]' : 'animate-[divineLight_2s_1.5s_forwards]'}`}
                    style={{ background: `radial-gradient(ellipse at top, ${themeColor} 0%, transparent 70%)`, mixBlendMode: 'screen' }}
                  />

                  {/* BANDES DÉFILANTES BROADCAST EN ARRIÈRE-PLAN */}
                  <div className={`absolute top-[8%] left-0 w-[300vw] whitespace-nowrap z-10 opacity-0 ${hadVideoTransition ? 'animate-[fadeIn_1.5s_0.2s_forwards]' : 'animate-[fadeIn_2s_1.5s_forwards]'}`} style={{ mixBlendMode: 'screen' }}>
                    <span 
                      className="font-msi text-[100px] md:text-[130px] uppercase tracking-[15px] inline-block animate-[marqueeLeft_40s_linear_infinite]"
                      style={{ WebkitTextStroke: `2px ${themeColor}`, color: 'transparent', opacity: 0.15 }}
                    >
                      {marqueeText}
                    </span>
                  </div>
                  <div className={`absolute bottom-[8%] left-0 w-[300vw] whitespace-nowrap z-10 opacity-0 ${hadVideoTransition ? 'animate-[fadeIn_1.5s_0.2s_forwards]' : 'animate-[fadeIn_2s_1.5s_forwards]'}`} style={{ mixBlendMode: 'screen' }}>
                    <span 
                      className="font-msi text-[100px] md:text-[130px] uppercase tracking-[15px] inline-block animate-[marqueeRight_40s_linear_infinite]"
                      style={{ WebkitTextStroke: `2px ${themeColor}`, color: 'transparent', opacity: 0.15 }}
                    >
                      {marqueeText}
                    </span>
                  </div>

                  {[...Array(20)].map((_, i) => {
                    const randomLeft = Math.random() * 100;
                    const randomDelay = 1.5 + Math.random() * 5;
                    const randomDur = 4 + Math.random() * 6;
                    const randomSize = 2 + Math.random() * 3;
                    return (
                      <div 
                        key={i} 
                        className="absolute bottom-0 rounded-full bg-white blur-[1px]"
                        style={{ 
                          left: `${randomLeft}%`, width: `${randomSize}px`, height: `${randomSize}px`,
                          boxShadow: `0 0 5px ${themeColor}`,
                          animation: `dustFloat ${randomDur}s ease-in-out infinite forwards`, animationDelay: `${randomDelay}s` 
                        }} 
                      />
                    );
                  })}

                  <div className={`absolute inset-0 z-30 flex flex-col items-center justify-center ${hadVideoTransition ? 'animate-[majesticRise_1.6s_0.2s_ease-out_both]' : 'animate-[majesticRise_2s_1.5s_ease-out_both]'}`}>
                    <div className={`${hadVideoTransition ? 'animate-[majesticFloat_6s_1.8s_ease-in-out_infinite]' : 'animate-[majesticFloat_6s_3.5s_ease-in-out_infinite]'}`}>
                      <CardIllustration card={currentCard} width={380} />
                    </div>
                    
                    {currentCard.variant && (
                      <div className={`absolute -bottom-20 opacity-0 ${hadVideoTransition ? 'animate-[metallicShine_5s_1.6s_infinite_forwards]' : 'animate-[metallicShine_5s_3s_infinite_forwards]'}`}>
                        <div 
                          className="px-10 py-3 rounded-full border border-white/10 bg-[#05060A]/80 backdrop-blur-md"
                          style={{ 
                            boxShadow: `0 10px 20px rgba(0,0,0,0.8)`,
                            background: `linear-gradient(120deg, transparent 0%, ${themeColor}15 30%, ${themeColor}40 50%, transparent 70%)`,
                            backgroundSize: '200% 100%'
                          }}
                        >
                          <span className="font-rajdhani text-2xl font-bold uppercase tracking-[8px] text-white">
                            {currentCard.variant}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="absolute inset-0 z-40 p-10 lg:p-24 flex justify-between items-center pointer-events-none">
                    
                    <div className={`flex flex-col gap-6 ${hadVideoTransition ? 'animate-[slideGlassPanel_1s_1.0s_both]' : 'animate-[slideGlassPanel_1s_2.5s_both]'}`}>
                      <div 
                        className="flex items-center gap-6 p-6 rounded-2xl bg-[#000000]/40 border-l-[4px] border-white/5 shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
                        style={{ borderLeftColor: themeColor }}
                      >
                        <img src={getRoleImage(roleName)} alt="Role" className="h-[50px] object-contain drop-shadow-[0_0_5px_rgba(255,255,255,0.4)]" onError={(e) => e.target.style.display='none'} />
                        <div className="flex flex-col">
                          <span className="text-white/50 font-rajdhani text-sm uppercase tracking-[4px]">Rôle Officiel</span>
                          <span className="font-msi text-3xl text-white uppercase tracking-wider">{roleName}</span>
                        </div>
                      </div>
                      
                      <div 
                        className="flex items-center gap-6 p-6 rounded-2xl bg-[#000000]/40 border-l-[4px] border-white/5 shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
                        style={{ borderLeftColor: themeColor }}
                      >
                        <img src={teamInfo.logo} alt="Club" className="h-[50px] object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
                        <div className="flex flex-col">
                          <span className="text-white/50 font-rajdhani text-sm uppercase tracking-[4px]">Franchise</span>
                          <span className="font-msi text-3xl text-white uppercase tracking-wider">{currentCard.teamTag}</span>
                        </div>
                      </div>
                    </div>

                    <div className={`${hadVideoTransition ? 'animate-[slideGlassPanelRight_1s_1.2s_both]' : 'animate-[slideGlassPanelRight_1s_3s_both]'} flex flex-col items-center`}>
                      <span className="text-white/50 font-rajdhani text-lg uppercase tracking-[8px] mb-2">Overall</span>
                      <div 
                        className="font-msi leading-none"
                        style={{ 
                          fontSize: '180px', 
                          color: '#FFF', 
                          background: `linear-gradient(180deg, #FFFFFF 0%, ${themeColor} 100%)`, 
                          WebkitBackgroundClip: 'text', 
                          WebkitTextFillColor: 'transparent',
                          filter: `drop-shadow(0 20px 30px rgba(0,0,0,0.8))` 
                        }}
                      >
                        {currentCard.rating}
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {revealStep >= finalStep && currentCard && (
              <div 
                className={`flex flex-col items-center gap-6 z-50 ${currentCard.rarity === 'WANTED' ? 'animate-[wantedCardDrop_0.6s_ease-out_forwards]' : currentCard.rarity === 'Légendaire' ? 'animate-[legendaryBoom_0.8s_ease-out_forwards]' : 'animate-[popUpStat_0.4s_ease-out_forwards]'}`}
              >
                <CardIllustration card={currentCard} width={280} />
                
                <div className="px-6 py-2.5 rounded-full font-rajdhani font-bold text-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] tracking-widest bg-[#11141E] text-[#D4AF37] border-2 border-[#D4AF37] animate-[fadeIn_1s_ease-in] flex items-center justify-center gap-2">
                  {currentItem?.contractAdded === 'LIFETIME' ? (
                    <>
                      <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                        <path d="M18.6 6.62c-1.44 0-2.8.56-3.77 1.53L12 10.98l-2.83-2.83A5.32 5.32 0 0 0 5.4 6.62C2.42 6.62 0 9.04 0 12.02s2.42 5.4 5.4 5.4c1.44 0 2.8-.56 3.77-1.53L12 13.06l2.83 2.83c.97.97 2.33 1.53 3.77 1.53 2.98 0 5.4-2.42 5.4-5.4s-2.42-5.4-5.4-5.4zm-13.2 8.8c-1.87 0-3.4-1.53-3.4-3.4s1.53-3.4 3.4-3.4c.91 0 1.77.35 2.41.99l2.45 2.41-2.45 2.41c-.64.64-1.5.99-2.41.99zm13.2 0c-.91 0-1.77-.35-2.41-.99l-2.45-2.41 2.45-2.41c.64-.64 1.5-.99 2.41-.99 1.87 0 3.4 1.53 3.4 3.4s-1.53 3.4-3.4 3.4z"/>
                      </svg>
                      <span>CONTRAT À VIE</span>
                    </>
                  ) : `+ ${currentItem?.contractAdded || 1} TOURNOIS`}
                </div>
              </div>
            )}

          </div>

          <div className="absolute bottom-10 text-white/30 text-sm font-rajdhani tracking-widest uppercase z-50">
            {revealStep < finalStep 
              ? "Appuyez sur ESPACE pour passer l'animation" 
              : "Cliquez ou appuyez sur ESPACE pour continuer"}
          </div>
        </div>
      )}
    </div>
  );
}