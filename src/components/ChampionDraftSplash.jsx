import React, { useState, useEffect } from 'react';
import { getChampionSplashSources } from '../constants/championSplashConfig';

/**
 * Composant dédié pour l'affichage réactif et sans rupture du Splash Art de champion dans la Draft.
 * Réinitialise proprement la source lors du changement de champion pour éviter tout blocage ou zoom excessif.
 */
export default function ChampionDraftSplash({ champData, canEditPicks = false, skinTheme = {} }) {
  const sources = getChampionSplashSources(champData);
  const primarySource = sources.localUrl || sources.ddragonSplashUrl || sources.fallbackIcon;

  const [src, setSrc] = useState(primarySource);
  const [isFallbackIcon, setIsFallbackIcon] = useState(!sources.localUrl && !sources.ddragonSplashUrl && !!sources.fallbackIcon);

  // À chaque changement de champion (ID ou nom), réinitialiser la source
  useEffect(() => {
    const s = getChampionSplashSources(champData);
    const nextSrc = s.localUrl || s.ddragonSplashUrl || s.fallbackIcon;
    setSrc(nextSrc);
    setIsFallbackIcon(!s.localUrl && !s.ddragonSplashUrl && !!s.fallbackIcon);
  }, [champData?.id, champData?.name]);

  const handleError = () => {
    // Si l'URL locale échoue, basculer sur le Splash Art DDragon HD
    if (src === sources.localUrl && sources.ddragonSplashUrl) {
      setSrc(sources.ddragonSplashUrl);
      setIsFallbackIcon(false);
    } 
    // Si DDragon échoue également (ex: hors ligne), basculer sur l'icône carrée avec mise en page adaptée
    else if (src !== sources.fallbackIcon && sources.fallbackIcon) {
      setSrc(sources.fallbackIcon);
      setIsFallbackIcon(true);
    }
  };

  if (!src) {
    return <div className="absolute inset-0" style={{ background: skinTheme.slotBg || '#070A12' }} />;
  }

  // Si repli sur l'icône carrée (120x120), ne pas zoomer brutalement avec object-cover :
  // Afficher un fond flouté d'ambiance et l'icône nette au centre
  if (isFallbackIcon) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-[#070A12] overflow-hidden pointer-events-none">
        <img
          src={src}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-md opacity-25 scale-125"
        />
        <img
          key={champData?.id}
          src={src}
          alt={champData?.name || ''}
          className="relative z-10 w-12 h-12 rounded-lg object-contain border border-white/20 shadow-md"
        />
      </div>
    );
  }

  // Splash Art panoramique officiel HD
  return (
    <img
      key={champData?.id || src}
      src={src}
      alt={champData?.name || ''}
      style={{ objectPosition: sources.focus }}
      onError={handleError}
      className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out ${
        canEditPicks ? 'group-hover:scale-108 group-hover:brightness-110' : ''
      }`}
    />
  );
}
