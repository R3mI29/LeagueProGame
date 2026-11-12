import { useState, useEffect, useMemo } from 'react';
import { socket } from '../api/socket';
import { CARD_POOL, RARITY_ORDER, registerCardInPool, unregisterCardFromPool, getCardTeamTags, getCardTeamDisplay } from '../constants/cardPlayers';
import { ORDERED_ROLES } from '../constants/roles';
import { EVENTS } from '../constants/seasonConfig';
import CardIllustration from '../components/CardIllustration';
import DevSkinPanel from '../components/DevSkinPanel';
import DevPackPanel from '../components/DevPackPanel';
import CardCreator from '../components/CardCreator';

const DEV_TABS = [
  { id: 'cards', label: 'CARTES' },
  { id: 'skins', label: 'SKINS' },
  { id: 'packs', label: 'PACKS & RÉCOMPENSES' },
  { id: 'creator', label: 'CRÉATEUR' },
];

export default function DevCardsView({ onClose, state }) {
  const [devTab, setDevTab] = useState('cards');
  const [filterRole, setFilterRole] = useState('Tous');
  const [filterRarity, setFilterRarity] = useState('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [poolVersion, setPoolVersion] = useState(0);

  useEffect(() => {
    const handleCardSaved = (card) => {
      registerCardInPool(card);
      setPoolVersion(v => v + 1);
    };
    const handleCardDeleted = (cardId) => {
      unregisterCardFromPool(cardId);
      setPoolVersion(v => v + 1);
    };

    socket.on('dev-card-saved', handleCardSaved);
    socket.on('dev-card-deleted', handleCardDeleted);

    return () => {
      socket.off('dev-card-saved', handleCardSaved);
      socket.off('dev-card-deleted', handleCardDeleted);
    };
  }, []);

  const customCardsCount = useMemo(() => {
    const list = state?.createdCardsThisGame || [];
    return list.length;
  }, [state?.createdCardsThisGame, poolVersion]);

  const rarityCounts = useMemo(() => {
    const counts = {
      Total: CARD_POOL.length,
      Commune: 0,
      Rare: 0,
      'Épique': 0,
      'Légendaire': 0,
      WANTED: 0,
      SECRET: 0,
    };
    CARD_POOL.forEach(card => {
      if (counts[card.rarity] !== undefined) {
        counts[card.rarity]++;
      }
    });
    return counts;
  }, [poolVersion, CARD_POOL.length]);

  const displayedCards = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return CARD_POOL
      .filter(c => {
        const isThisGameCard = (state?.createdCardsThisGame || []).some(x => x.id === c.id);
        const matchRole =
          filterRole === 'Tous'
            ? true
            : filterRole === 'Custom'
            ? isThisGameCard
            : c.role === filterRole;
        if (!matchRole) return false;

        if (filterRarity !== 'Tous' && c.rarity !== filterRarity) return false;

        if (!query) return true;
        return (
          c.baseName?.toLowerCase().includes(query) ||
          c.variant?.toLowerCase().includes(query) ||
          getCardTeamTags(c).some(t => t.toLowerCase().includes(query)) ||
          c.league?.toLowerCase().includes(query) ||
          c.rarity?.toLowerCase().includes(query) ||
          c.id?.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        // En mode Custom, afficher les plus récentes en premier
        if (filterRole === 'Custom') {
          return b.id.localeCompare(a.id);
        }
        return (RARITY_ORDER[a.rarity] || 0) - (RARITY_ORDER[b.rarity] || 0);
      });
  }, [filterRole, filterRarity, searchQuery, poolVersion, CARD_POOL.length, state?.createdCardsThisGame]);

  const handleGiveCard = (cardId) => socket.emit('dev-give-card', cardId);
  const handleSetEvent = (idx) => socket.emit('dev-set-event', idx);
  const handleGiveMoney = () => socket.emit('dev-give-money', 1000);
  const handleOpenWantedPack = () => {
    socket.emit('dev-open-pack', 'wanted');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#08090d]/95 backdrop-blur-md z-[10000] flex flex-col p-5 font-sans">
      <div className="max-w-[1400px] mx-auto w-full flex flex-col h-full">
        
        <div className="shrink-0 pb-5 border-b border-[#1B2333] mb-5">
          <div className="flex justify-between items-start mb-5 flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-rajdhani text-accent-pink text-[32px] m-0 uppercase tracking-wide">
                  PANEL DÉVELOPPEUR ⚙️
                </h1>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white/5 border border-white/10 text-text-muted">
                  TOTAL: {rarityCounts.Total}
                </span>
              </div>
              <p className="text-text-muted mt-1 mb-3 tracking-widest text-sm uppercase">
                TRICHE ET OUTILS DE TEST
              </p>

              {/* MINI COMPTEUR PAR RARETÉ */}
              <div className="flex items-center gap-2 flex-wrap text-xs font-rajdhani">
                <span className="text-text-muted font-bold tracking-wider text-[11px] uppercase mr-1">
                  RARETÉS :
                </span>
                <button
                  type="button"
                  onClick={() => setFilterRarity('Tous')}
                  className={`px-2.5 py-1 rounded border transition-all cursor-pointer font-bold tracking-wider flex items-center gap-1.5 ${filterRarity === 'Tous' ? 'bg-white/15 text-white border-white/40 shadow-sm' : 'bg-[#0C0E14] text-text-muted border-[#1B2333] hover:text-white'}`}
                  title="Afficher toutes les raretés"
                >
                  <span className="text-[10px] uppercase">TOUTES</span>
                  <span className="font-mono text-white text-xs">{rarityCounts.Total}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterRarity(filterRarity === 'Commune' ? 'Tous' : 'Commune')}
                  className={`px-2.5 py-1 rounded border transition-all cursor-pointer font-bold tracking-wider flex items-center gap-1.5 ${filterRarity === 'Commune' ? 'bg-[#8b9bb4]/25 text-white border-[#8b9bb4] shadow-[0_0_8px_rgba(139,155,180,0.3)]' : 'bg-[#0C0E14] text-[#8b9bb4] border-[#1B2333] hover:border-[#8b9bb4]/40'}`}
                  title="Filtrer par Commune"
                >
                  <span className="w-2 h-2 rounded-full bg-[#8b9bb4] inline-block" />
                  <span>COMMUNE</span>
                  <span className="font-mono text-white text-xs">{rarityCounts.Commune}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterRarity(filterRarity === 'Rare' ? 'Tous' : 'Rare')}
                  className={`px-2.5 py-1 rounded border transition-all cursor-pointer font-bold tracking-wider flex items-center gap-1.5 ${filterRarity === 'Rare' ? 'bg-[#00e5ff]/20 text-[#00e5ff] border-[#00e5ff] shadow-[0_0_8px_rgba(0,229,255,0.3)]' : 'bg-[#0C0E14] text-[#00e5ff]/80 border-[#1B2333] hover:border-[#00e5ff]/40'}`}
                  title="Filtrer par Rare"
                >
                  <span className="w-2 h-2 rounded-full bg-[#00e5ff] inline-block shadow-[0_0_6px_#00e5ff]" />
                  <span>RARE</span>
                  <span className="font-mono text-white text-xs">{rarityCounts.Rare}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterRarity(filterRarity === 'Épique' ? 'Tous' : 'Épique')}
                  className={`px-2.5 py-1 rounded border transition-all cursor-pointer font-bold tracking-wider flex items-center gap-1.5 ${filterRarity === 'Épique' ? 'bg-[#ff3366]/20 text-[#ff3366] border-[#ff3366] shadow-[0_0_8px_rgba(255,51,102,0.3)]' : 'bg-[#0C0E14] text-[#ff3366]/80 border-[#1B2333] hover:border-[#ff3366]/40'}`}
                  title="Filtrer par Épique"
                >
                  <span className="w-2 h-2 rounded-full bg-[#ff3366] inline-block shadow-[0_0_6px_#ff3366]" />
                  <span>ÉPIQUE</span>
                  <span className="font-mono text-white text-xs">{rarityCounts['Épique']}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterRarity(filterRarity === 'Légendaire' ? 'Tous' : 'Légendaire')}
                  className={`px-2.5 py-1 rounded border transition-all cursor-pointer font-bold tracking-wider flex items-center gap-1.5 ${filterRarity === 'Légendaire' ? 'bg-[#ffd700]/20 text-[#ffd700] border-[#ffd700] shadow-[0_0_8px_rgba(255,215,0,0.3)]' : 'bg-[#0C0E14] text-[#ffd700]/80 border-[#1B2333] hover:border-[#ffd700]/40'}`}
                  title="Filtrer par Légendaire"
                >
                  <span className="w-2 h-2 rounded-full bg-[#ffd700] inline-block shadow-[0_0_6px_#ffd700]" />
                  <span>LÉGENDAIRE</span>
                  <span className="font-mono text-white text-xs">{rarityCounts['Légendaire']}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterRarity(filterRarity === 'WANTED' ? 'Tous' : 'WANTED')}
                  className={`px-2.5 py-1 rounded border transition-all cursor-pointer font-bold tracking-wider flex items-center gap-1.5 ${filterRarity === 'WANTED' ? 'bg-white/20 text-white border-white shadow-[0_0_10px_rgba(255,255,255,0.4)]' : 'bg-[#0C0E14] text-white/80 border-[#1B2333] hover:border-white/40'}`}
                  title="Filtrer par WANTED"
                >
                  <span className="w-2 h-2 rounded-full bg-white inline-block shadow-[0_0_6px_#fff]" />
                  <span className="bg-gradient-to-r from-white via-amber-200 to-white bg-clip-text text-transparent font-black">WANTED</span>
                  <span className="font-mono text-white text-xs">{rarityCounts.WANTED}</span>
                </button>
                {rarityCounts.SECRET > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilterRarity(filterRarity === 'SECRET' ? 'Tous' : 'SECRET')}
                    className={`px-2.5 py-1 rounded border transition-all cursor-pointer font-bold tracking-wider flex items-center gap-1.5 ${filterRarity === 'SECRET' ? 'bg-purple-500/25 text-purple-300 border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.4)]' : 'bg-[#0C0E14] text-purple-400 border-[#1B2333] hover:border-purple-400/40'}`}
                    title="Filtrer par SECRET"
                  >
                    <span className="w-2 h-2 rounded-full bg-purple-400 inline-block shadow-[0_0_6px_#a855f7]" />
                    <span>SECRET</span>
                    <span className="font-mono text-white text-xs">{rarityCounts.SECRET}</span>
                  </button>
                )}
              </div>
            </div>
            <button 
              className="font-rajdhani font-bold tracking-widest uppercase py-2.5 px-6 bg-transparent border-2 border-accent-pink text-accent-pink rounded hover:bg-accent-pink hover:text-black transition-all" 
              onClick={onClose}
            >
              FERMER LE MODE DEV
            </button>
          </div>

          <div className="grid grid-cols-[2fr_1fr] gap-5 mb-5">
            
            <div className="bg-[#0C0E14] p-4 rounded-lg border border-accent-pink/25">
              <h3 className="font-rajdhani text-white m-0 mb-3 text-lg uppercase tracking-wide">
                FORCER LE PROCHAIN TOURNOI
              </h3>
              <div className="flex gap-3 flex-wrap">
                {EVENTS.map((ev, idx) => (
                  <button 
                    key={ev.id} 
                    onClick={() => handleSetEvent(idx)}
                    className={`px-4 py-2 rounded font-rajdhani font-bold tracking-wider cursor-pointer transition-all border ${state?.eventIndex === idx ? 'bg-accent-pink text-white border-accent-pink' : 'bg-transparent text-[#768196] border-[#222838] hover:border-[#768196]'}`}
                  >
                    {ev.shortName} {state?.eventIndex === idx && ' (ACTIF)'}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#0C0E14] p-4 rounded-lg border border-[#ffd700]/25">
              <h3 className="font-rajdhani text-white m-0 mb-3 text-lg uppercase tracking-wide">
                RESSOURCES & PACKS
              </h3>
              <div className="flex gap-3 flex-wrap">
                <button 
                  onClick={handleGiveMoney}
                  className="bg-[#FFD700] text-black border-none py-2.5 px-5 rounded text-sm font-bold cursor-pointer font-rajdhani tracking-wider shadow-[0_4px_15px_rgba(255,215,0,0.2)] transition-transform active:scale-95 hover:brightness-110"
                >
                  💰 +1000 CRÉDITS
                </button>
                <button 
                  onClick={() => setDevTab('packs')}
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-none py-2.5 px-4 rounded text-sm font-black cursor-pointer font-rajdhani tracking-wider shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-transform active:scale-95 hover:brightness-110"
                >
                  🎁 GIVER DES PACKS
                </button>
                <button 
                  onClick={() => {
                    socket.emit('dev-open-guaranteed-wanted');
                    onClose();
                  }}
                  className="bg-gradient-to-r from-rose-500 via-amber-300 to-rose-400 text-black border-none py-2.5 px-4 rounded text-sm font-black cursor-pointer font-rajdhani tracking-wider shadow-[0_0_20px_rgba(244,63,94,0.5)] transition-transform active:scale-95 hover:brightness-110"
                >
                  👑 OUVRIR 5 WANTED GARANTIS
                </button>
              </div>
            </div>
          </div>

          {/* Sélecteur de section + filtres */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex p-1 gap-1 bg-[#0C0E14] border border-[#222838] rounded-lg">
              {DEV_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setDevTab(tab.id)}
                  className={`font-rajdhani font-bold tracking-widest uppercase py-2 px-6 rounded text-[13px] transition-all border-none cursor-pointer ${devTab === tab.id ? 'bg-accent-pink text-black shadow-pink' : 'bg-transparent text-text-muted hover:text-white'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {devTab === 'cards' && (
              <>
                <div className="h-8 w-px bg-[#222838]" />
                <div className="flex gap-2 flex-wrap items-center">
                  <button 
                    className={`font-rajdhani font-bold tracking-widest uppercase py-2 px-4 rounded text-[13px] transition-all border-2 ${filterRole === 'Tous' ? 'bg-accent-pink text-black border-accent-pink shadow-pink' : 'bg-transparent text-white border-text-muted hover:border-accent-pink hover:text-accent-pink'}`}
                    onClick={() => setFilterRole('Tous')}
                  >
                    TOUTES
                  </button>

                  <button 
                    className={`font-rajdhani font-bold tracking-widest uppercase py-2 px-4 rounded text-[13px] transition-all border-2 ${filterRole === 'Custom' ? 'bg-emerald-400 text-black border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:border-emerald-400'}`}
                    onClick={() => setFilterRole('Custom')}
                  >
                    CRÉÉES ({customCardsCount})
                  </button>

                  {ORDERED_ROLES.map(role => (
                    <button 
                      key={role} 
                      className={`font-rajdhani font-bold tracking-widest uppercase py-2 px-3 rounded text-[13px] transition-all border-2 ${filterRole === role ? 'bg-accent-pink text-black border-accent-pink shadow-pink' : 'bg-transparent text-white border-text-muted hover:border-accent-pink hover:text-accent-pink'}`}
                      onClick={() => setFilterRole(role)}
                    >
                      {role.toUpperCase()}
                    </button>
                  ))}

                  <div className="relative ml-2">
                    <input
                      type="text"
                      placeholder="🔍 Rechercher joueur, tag..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="bg-[#0C0E14] border border-[#222838] focus:border-accent-pink text-white text-xs px-3 py-2 rounded-lg outline-none w-56 font-sans placeholder-text-muted"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-2 text-text-muted hover:text-white text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2.5">
          {devTab === 'cards' ? (
            <div className="flex flex-wrap gap-6 justify-center items-start pb-10">
              {displayedCards.map(card => {
                const myId = socket.id;
                const ownedContract = state?.cardCollections?.[myId]?.[card.id];
                const isLifetime = ownedContract === 'LIFETIME';
                const contractCount = typeof ownedContract === 'number' ? ownedContract : 0;

                return (
                  <div 
                    key={card.id} 
                    onClick={() => handleGiveCard(card.id)}
                    className="flex flex-col items-center w-[160px] bg-[#0D1219] p-[12px_10px] rounded-lg border border-[#1B2333] cursor-pointer transition-all duration-200 relative group hover:border-accent-pink hover:-translate-y-1.5"
                  >
                    {(contractCount > 0 || isLifetime) && (
                      <div 
                        className="absolute -top-2.5 -right-2.5 font-bold py-1 px-2 rounded z-10 text-xs shadow-[0_4px_8px_rgba(0,0,0,0.5)]"
                        style={{ 
                          background: isLifetime ? 'linear-gradient(135deg, #FFD700 0%, #AA8011 100%)' : '#ff3366', 
                          color: isLifetime ? '#000' : '#FFF'
                        }}
                      >
                        {isLifetime ? '♾️' : `x${contractCount}`}
                      </div>
                    )}

                    <CardIllustration card={card} width={140} />
                    
                    <div className="mt-3.5 text-center">
                      <span className="font-rajdhani text-accent-cyan text-[14px] block font-bold uppercase tracking-wide">{card.id}</span>
                      <span className="text-text-muted text-[11px] block mt-1 uppercase tracking-wider">{card.rarity}</span>
                      <span className="text-[10px] text-accent-pink block mt-2 tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">CLIQUEZ POUR OBTENIR</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : devTab === 'skins' ? (
            <div className="max-w-[900px] mx-auto pb-10">
              <DevSkinPanel state={state} />
            </div>
          ) : devTab === 'packs' ? (
            <div className="max-w-[1100px] mx-auto pb-10">
              <DevPackPanel state={state} />
            </div>
          ) : (
            <div className="max-w-[1100px] mx-auto pb-10">
              <CardCreator state={state} onNavigateToCards={(cardName) => {
                setDevTab('cards');
                setFilterRole('Tous');
                setSearchQuery(cardName || '');
              }} />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}