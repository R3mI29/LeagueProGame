import React, { useState, useEffect } from 'react';
import { CARD_POOL } from '../constants/cardPlayers'; 
import CardIllustration from './CardIllustration';
import { TEAMS_DB } from '../constants/teams'; 

export default function PackOpener({ cardIds, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const [revealStep, setRevealStep] = useState(0);

  const showSummary = currentIndex >= cardIds.length;
  const currentItem = !showSummary ? cardIds[currentIndex] : null;
  const currentCardId = currentItem?.id || currentItem;
  const currentCard = CARD_POOL.find(c => c.id === currentCardId);

  const isWalkout = currentCard && ['Épique', 'Légendaire', 'WANTED', 'SECRET'].includes(currentCard.rarity);
  const finalStep = currentCard?.rarity === 'WANTED' ? 6 : 5;

  useEffect(() => {
    if (showSummary || isClosing || !currentCard) return;

    if (!isWalkout && revealStep < finalStep) {
      setRevealStep(finalStep);
      return;
    }

    if (revealStep >= finalStep) return;

    let delay = 1300; 
    
    if (revealStep === 5 && currentCard.rarity === 'WANTED') {
      delay = 20000;
    }

    const timer = setTimeout(() => {
      setRevealStep(prev => prev + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [revealStep, showSummary, isClosing, currentCard, isWalkout, finalStep]);

  // Passage avec ESPACE (Permet le SKIP et le NEXT)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !showSummary) {
        e.preventDefault();
        if (revealStep < finalStep) {
          setRevealStep(finalStep); // Skip
        } else {
          setCurrentIndex(prev => prev + 1); // Next
          setRevealStep(0); 
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSummary, revealStep, finalStep]);

  if (!cardIds || cardIds.length === 0 || isClosing) return null;

  // Passage au CLIC (Bloqué pendant l'animation)
  const handleNext = () => {
    if (!showSummary && revealStep >= finalStep) {
      setCurrentIndex(prev => prev + 1); 
      setRevealStep(0); 
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
      `}</style>

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
                
                <div className="absolute inset-0 flex items-center justify-center z-50">
                  <div 
                    className="w-[100px] h-[100px] rounded-full bg-black border-[4px] animate-[eclipseGrow_1.5s_ease-in_forwards]"
                    style={{ borderColor: themeColor }}
                  />
                </div>

                <div className="absolute inset-0 z-50 bg-white animate-[silentFlash_0.8s_1.3s_both]" />

                <div className="absolute inset-0 z-30 animate-[fadeIn_1s_1.5s_both]">
                  
                  <div 
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[60vh] opacity-0 animate-[divineLight_2s_1.5s_forwards]"
                    style={{ background: `radial-gradient(ellipse at top, ${themeColor} 0%, transparent 70%)`, mixBlendMode: 'screen' }}
                  />

                  {/* BANDES DÉFILANTES BROADCAST EN ARRIÈRE-PLAN */}
                  <div className="absolute top-[8%] left-0 w-[300vw] whitespace-nowrap z-10 opacity-0 animate-[fadeIn_2s_1.5s_forwards]" style={{ mixBlendMode: 'screen' }}>
                    <span 
                      className="font-msi text-[100px] md:text-[130px] uppercase tracking-[15px] inline-block animate-[marqueeLeft_40s_linear_infinite]"
                      style={{ WebkitTextStroke: `2px ${themeColor}`, color: 'transparent', opacity: 0.15 }}
                    >
                      {marqueeText}
                    </span>
                  </div>
                  <div className="absolute bottom-[8%] left-0 w-[300vw] whitespace-nowrap z-10 opacity-0 animate-[fadeIn_2s_1.5s_forwards]" style={{ mixBlendMode: 'screen' }}>
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

                  <div className="absolute inset-0 z-30 flex flex-col items-center justify-center animate-[majesticRise_2s_1.5s_ease-out_both]">
                    <div className="animate-[majesticFloat_6s_3.5s_ease-in-out_infinite]">
                      <CardIllustration card={currentCard} width={380} />
                    </div>
                    
                    {currentCard.variant && (
                      <div className="absolute -bottom-20 opacity-0 animate-[metallicShine_5s_3s_infinite_forwards]">
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
                    
                    <div className="flex flex-col gap-6 animate-[slideGlassPanel_1s_2.5s_both]">
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

                    <div className="animate-[slideGlassPanelRight_1s_3s_both] flex flex-col items-center">
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
                
                <div className="px-6 py-2.5 rounded-full font-rajdhani font-bold text-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] tracking-widest bg-[#11141E] text-[#D4AF37] border-2 border-[#D4AF37] animate-[fadeIn_1s_ease-in]">
                  {currentItem?.contractAdded === 'LIFETIME' ? '♾️ CONTRAT À VIE' : `+ ${currentItem?.contractAdded || 1} TOURNOIS`}
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