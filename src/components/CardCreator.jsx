import { useState, useEffect, useMemo } from 'react';
import CardIllustration from './CardIllustration';
import { CARD_POOL, registerCardInPool, unregisterCardFromPool } from '../constants/cardPlayers';
import { socket } from '../api/socket';

const ROLES = ['Top', 'Jungle', 'Mid', 'ADC', 'Support'];
const RARITIES = ['Commune', 'Rare', 'Épique', 'Légendaire', 'WANTED'];
const LEAGUES = ['LCK', 'LPL', 'LEC', 'LCS', 'CBLOL', 'PCS', 'VCS', 'LLA', 'LJL'];

const FOLDER_PRESETS = [
  { id: 'cardsImg/custom', label: '📁 public/cardsImg/custom (Recommandé pour créations)' },
  { id: 'cardsImg/2026-players', label: '📁 public/cardsImg/2026-players (Joueurs réguliers 2026)' },
  { id: 'cardsImg/others', label: '📁 public/cardsImg/others (Spécial, MVP, Hall of Fame)' },
  { id: 'cardsImg/fullart', label: '📁 public/cardsImg/fullart (Cartes Full Art)' },
  { id: 'manual', label: '✏️ Autre sous-dossier personnalisé...' },
];

const THEME_PRESETS = [
  { label: 'T1 Rouge', color: '#E5142E' },
  { label: 'KC Bleu', color: '#0045B5' },
  { label: 'G2 Doré', color: '#D4AF37' },
  { label: 'FNC Orange', color: '#FF5900' },
  { label: 'GEN Or', color: '#AA8A39' },
  { label: 'Esport Cyan', color: '#00E5FF' },
  { label: 'Bleu Standard', color: '#4C60D2' },
];

const inputClass =
  'bg-[#090C13] border border-[#2B3040] rounded-lg px-4 py-2.5 text-white focus:border-[#4C60D2] outline-none w-full text-sm';
const labelClass = 'text-text-muted text-xs uppercase tracking-wider mb-1 block';
const sectionTitleClass = 'font-rajdhani text-white uppercase tracking-wider text-sm mb-3 font-bold';

function generateSlugId(name, tag, rarity) {
  const cleanName = (name || '').toLowerCase().trim().replace(/[^a-z0-9_-]/g, '_');
  const cleanTag = (tag || '').toLowerCase().trim().replace(/[^a-z0-9_-]/g, '_');
  const cleanRarity = (rarity || '').toLowerCase().replace(/é/g, 'e').replace(/[^a-z0-9_-]/g, '_');
  if (!cleanName) return '';
  return cleanTag ? `${cleanTag}_${cleanName}_${cleanRarity}` : `${cleanName}_${cleanRarity}`;
}

export default function CardCreator({ state, onNavigateToCards } = {}) {
  const [form, setForm] = useState({
    id: '',
    baseName: '',
    role: 'Mid',
    rating: 85,
    rarity: 'Commune',
    nationality: 'kr',
    league: 'LCK',
    teamTag: 'T1',
    image: '',
    video: '',
    themeColor: '#4C60D2',
    variant: '',
  });

  const [isManualId, setIsManualId] = useState(false);
  const [poolVersion, setPoolVersion] = useState(0);

  // Dossier et nom du fichier de destination de l'image
  const [imageFolder, setImageFolder] = useState('cardsImg/custom');
  const [manualFolder, setManualFolder] = useState('');
  const [imageFileName, setImageFileName] = useState('');

  // Cartes créées dans CETTE session / partie de jeu
  const [localCreatedCards, setLocalCreatedCards] = useState([]);
  const savedCards = useMemo(() => {
    if (Array.isArray(state?.createdCardsThisGame)) {
      return state.createdCardsThisGame;
    }
    return localCreatedCards;
  }, [state?.createdCardsThisGame, localCreatedCards]);

  const [dragOver, setDragOver] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [justSavedId, setJustSavedId] = useState(null);

  // Nettoyage de l'ancien cache localStorage obsolète
  useEffect(() => {
    try {
      localStorage.removeItem('custom_cards');
    } catch (_) {}
  }, []);

  useEffect(() => {
    const onSaved = (newCard) => {
      registerCardInPool(newCard);
      setPoolVersion(v => v + 1);
      setLocalCreatedCards(prev => {
        const idx = prev.findIndex(c => c.id === newCard.id);
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = newCard;
          return next;
        }
        return [newCard, ...prev];
      });
    };

    const onDeleted = (delId) => {
      unregisterCardFromPool(delId);
      setPoolVersion(v => v + 1);
      setLocalCreatedCards(prev => prev.filter(c => c.id !== delId));
    };

    socket.on('dev-card-saved', onSaved);
    socket.on('dev-card-deleted', onDeleted);

    return () => {
      socket.off('dev-card-saved', onSaved);
      socket.off('dev-card-deleted', onDeleted);
    };
  }, []);

  const set = (field, value) => {
    setForm(f => {
      const next = { ...f, [field]: value };
      if (!isManualId && (field === 'baseName' || field === 'teamTag' || field === 'rarity')) {
        next.id = generateSlugId(
          field === 'baseName' ? value : next.baseName,
          field === 'teamTag' ? value : next.teamTag,
          field === 'rarity' ? value : next.rarity
        );
      }
      return next;
    });
  };

  const computeDefaultFileName = (ext = 'png') => {
    const tagPrefix = form.teamTag ? `${form.teamTag.toUpperCase()}_` : '';
    const cleanName = (form.baseName || 'joueur').replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${tagPrefix}${cleanName}.${ext}`;
  };

  const handleImageFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = ev => {
      set('image', ev.target.result);
      if (!imageFileName || imageFileName.includes('joueur.')) {
        setImageFileName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const effectiveFolder = (imageFolder === 'manual' ? manualFolder : imageFolder) || 'cardsImg/custom';
  const effectiveFileName = imageFileName?.trim() || computeDefaultFileName('png');

  // Validation d'ID en temps réel
  const cleanId = form.id.trim().toLowerCase();
  const isIdCreatedThisGame = useMemo(() => {
    const thisGameList = state?.createdCardsThisGame || localCreatedCards;
    return thisGameList.some(c => c.id?.toLowerCase() === cleanId);
  }, [cleanId, state?.createdCardsThisGame, localCreatedCards]);

  const conflictingCard = useMemo(() => {
    if (!cleanId) return null;
    if (isIdCreatedThisGame) return null; // Permet de mettre à jour la carte qu'on vient de créer dans cette partie
    return CARD_POOL.find(c => c.id?.toLowerCase() === cleanId) || null;
  }, [cleanId, isIdCreatedThisGame, poolVersion, CARD_POOL.length]);

  const handleSave = () => {
    if (!form.baseName.trim()) {
      alert('⚠️ Le nom du joueur est requis.');
      return;
    }
    if (!cleanId) {
      alert("⚠️ L'identifiant de la carte (ID) est requis.");
      return;
    }
    if (conflictingCard) {
      alert(`⚠️ L'identifiant "${cleanId}" est déjà attribué à la carte "${conflictingCard.baseName}" (${conflictingCard.teamTag || ''} ${conflictingCard.rarity}). Veuillez en choisir un autre.`);
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);

    const isBase64 = typeof form.image === 'string' && form.image.startsWith('data:');

    const cardPayload = {
      ...form,
      id: cleanId,
      rating: Number(form.rating),
      video: form.video?.trim() ? form.video.trim() : undefined,
      themeColor: form.themeColor || undefined,
      variant: form.variant?.trim() || undefined,
    };

    socket.emit('dev-save-custom-card', {
      card: cardPayload,
      imageData: isBase64 ? form.image : null,
      imageFolder: effectiveFolder,
      imageFileName: effectiveFileName,
    }, (response) => {
      setIsSaving(false);
      if (response?.ok && response?.card) {
        registerCardInPool(response.card);
        setJustSavedId(response.card.id);
        setSaveStatus({
          type: 'success',
          message: `Carte "${response.card.baseName}" (ID: ${response.card.id}) enregistrée définitivement dans le code source !`,
        });

        if (response.card.image) {
          set('image', response.card.image);
        }

        setLocalCreatedCards(prev => {
          const idx = prev.findIndex(x => x.id === response.card.id);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = response.card;
            return next;
          }
          return [response.card, ...prev];
        });

        setTimeout(() => setJustSavedId(null), 4000);
      } else {
        setSaveStatus({
          type: 'error',
          message: response?.error || 'Erreur lors de la sauvegarde.',
        });
      }
    });
  };

  const handleDelete = (cardId, cardName) => {
    if (!confirm(`Supprimer définitivement la carte "${cardName}" (${cardId}) du code source (cardPlayers.js) ?`)) return;

    socket.emit('dev-delete-custom-card', cardId, (response) => {
      if (response?.ok) {
        setLocalCreatedCards(prev => prev.filter(c => c.id !== cardId));
        unregisterCardFromPool(cardId);
      } else {
        alert('Erreur lors de la suppression: ' + (response?.error || 'Erreur inconnue'));
      }
    });
  };

  const handleGive = (cardId) => {
    socket.emit('dev-give-card', cardId);
  };

  return (
    <div className="pb-10">
      <div className="flex gap-8 items-start">

        {/* ── COLONNE GAUCHE — Formulaire ── */}
        <div className="flex flex-col gap-6" style={{ width: '620px', minWidth: '620px' }}>

          {/* Section IMAGE */}
          <div className="bg-[#0C0E14] rounded-xl border border-[#1B2333] p-5">
            <div className={sectionTitleClass}>🖼️ Image du joueur & Destination</div>

            {/* Zone Drag & Drop */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => {
                e.preventDefault();
                setDragOver(false);
                handleImageFile(e.dataTransfer.files[0]);
              }}
              className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all mb-3 ${
                dragOver
                  ? 'border-accent-pink bg-accent-pink/10'
                  : 'border-[#2B3040] bg-[#090C13] hover:border-[#4C60D2]'
              }`}
              onClick={() => document.getElementById('card-img-input').click()}
            >
              {form.image ? (
                <div className="flex flex-col items-center">
                  <img src={form.image} alt="preview" className="h-28 object-contain mx-auto rounded shadow-lg mb-2" />
                  <span className="text-xs text-accent-cyan">Clique ou glisse une autre image pour remplacer</span>
                </div>
              ) : (
                <div className="text-text-muted text-sm py-4">
                  <div className="text-3xl mb-2">📁</div>
                  <div className="font-bold text-white mb-1">Glisse une image ici ou clique pour parcourir</div>
                  <div className="text-xs opacity-60">Fichiers PNG, JPG, WEBP supportés</div>
                </div>
              )}
              <input
                id="card-img-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => handleImageFile(e.target.files[0])}
              />
            </div>

            {/* URL web directe alternative */}
            <div className="flex gap-2 items-center mb-4">
              <input
                type="text"
                placeholder="Ou coller une URL d'image / chemin existant..."
                value={form.image?.startsWith('data:') ? '' : form.image}
                onChange={e => set('image', e.target.value)}
                className={inputClass}
              />
              {form.image && (
                <button
                  type="button"
                  onClick={() => set('image', '')}
                  className="px-3 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded text-xs cursor-pointer border border-red-500/30 shrink-0"
                >
                  Effacer
                </button>
              )}
            </div>

            {/* Choix du dossier d'enregistrement */}
            <div className="space-y-3 pt-3 border-t border-[#1B2333]">
              <div>
                <label className={labelClass}>Dossier de destination (dans public/)</label>
                <select
                  value={imageFolder}
                  onChange={e => setImageFolder(e.target.value)}
                  className={inputClass}
                >
                  {FOLDER_PRESETS.map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>

              {imageFolder === 'manual' && (
                <div>
                  <label className={labelClass}>Sous-dossier personnalisé (relatif à public/)</label>
                  <input
                    type="text"
                    placeholder="ex: cardsImg/mon-dossier ou images/tournois"
                    value={manualFolder}
                    onChange={e => setManualFolder(e.target.value)}
                    className={inputClass}
                  />
                </div>
              )}

              <div>
                <label className={labelClass}>Nom du fichier image (optionnel)</label>
                <input
                  type="text"
                  placeholder={computeDefaultFileName('png')}
                  value={imageFileName}
                  onChange={e => setImageFileName(e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* Aperçu du chemin complet */}
              <div className="text-[11px] text-text-muted bg-black/40 px-3 py-2 rounded border border-[#1B2333] flex items-center justify-between">
                <span>📁 Emplacement enregistré :</span>
                <span className="font-mono text-accent-cyan">
                  public/{effectiveFolder}/{effectiveFileName}
                </span>
              </div>
            </div>
          </div>

          {/* Section IDENTITÉ */}
          <div className="bg-[#0C0E14] rounded-xl border border-[#1B2333] p-5">
            <div className={sectionTitleClass}>👤 Identité & Statistiques</div>
            <div className="grid grid-cols-2 gap-4">

              {/* Champ ID Personnalisé avec détection de doublon */}
              <div className="col-span-2 bg-[#090C13] p-3.5 rounded-lg border border-[#222838]">
                <div className="flex items-center justify-between mb-1">
                  <label className={labelClass}>
                    Identifiant unique de la carte (ID) *
                  </label>
                  {isManualId ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsManualId(false);
                        const autoId = generateSlugId(form.baseName, form.teamTag, form.rarity);
                        setForm(f => ({ ...f, id: autoId }));
                      }}
                      className="text-[11px] text-accent-cyan hover:underline cursor-pointer font-bold"
                    >
                      🔄 Rétablir ID automatique
                    </button>
                  ) : (
                    <span className="text-[10px] text-text-muted">
                      Généré automatiquement (modifiable librement)
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={form.id}
                  onChange={e => {
                    setIsManualId(true);
                    const val = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
                    setForm(f => ({ ...f, id: val }));
                  }}
                  placeholder="ex: faker_t1_wanted, dk_career_rare, showmaker_dk..."
                  className={`${inputClass} font-mono ${
                    conflictingCard 
                      ? 'border-red-500 bg-red-950/30 text-red-200 focus:border-red-500' 
                      : cleanId ? 'border-emerald-500/60' : ''
                  }`}
                />

                {/* Message d'erreur doublon en direct */}
                {conflictingCard && (
                  <div className="mt-2 p-2.5 bg-red-500/20 border border-red-500/50 rounded text-red-300 text-xs flex items-center gap-2">
                    <span className="text-base">❌</span>
                    <div>
                      Cet identifiant est déjà attribué à la carte existante :{' '}
                      <strong>"{conflictingCard.baseName}"</strong> ({conflictingCard.teamTag || 'Sans équipe'} - {conflictingCard.rarity} - Note {conflictingCard.rating}).
                      <div className="font-semibold text-red-400 mt-0.5">Veuillez choisir un autre identifiant pour cette carte.</div>
                    </div>
                  </div>
                )}

                {!conflictingCard && cleanId && (
                  <div className="mt-1.5 text-[11px] text-emerald-400 font-mono flex items-center gap-1.5">
                    <span>✓</span>
                    <span>Identifiant disponible : <strong>{cleanId}</strong></span>
                  </div>
                )}
              </div>

              <div>
                <label className={labelClass}>Nom du joueur *</label>
                <input
                  type="text"
                  value={form.baseName}
                  onChange={e => set('baseName', e.target.value)}
                  placeholder="ex: Faker, Caps, Chovy..."
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Note globale : <span className="text-[#00E5FF] font-bold font-mono">{form.rating}</span>
                </label>
                <div className="flex items-center gap-3 h-[42px]">
                  <input
                    type="range"
                    min={50}
                    max={99}
                    value={form.rating}
                    onChange={e => set('rating', e.target.value)}
                    className="flex-1 accent-[#4C60D2] cursor-pointer"
                  />
                  <input
                    type="number"
                    min={50}
                    max={99}
                    value={form.rating}
                    onChange={e => set('rating', e.target.value)}
                    className="w-16 bg-[#090C13] border border-[#2B3040] rounded px-2 py-1 text-white text-center font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Rôle</label>
                <select
                  value={form.role}
                  onChange={e => set('role', e.target.value)}
                  className={inputClass}
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div>
                <label className={labelClass}>Rareté</label>
                <select
                  value={form.rarity}
                  onChange={e => set('rarity', e.target.value)}
                  className={inputClass}
                >
                  {RARITIES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div className="col-span-2">
                <label className={labelClass}>Variant / Titre honorifique (optionnel)</label>
                <input
                  type="text"
                  value={form.variant}
                  onChange={e => set('variant', e.target.value)}
                  placeholder="ex: Worlds 2023 MVP, Unkillable Demon King..."
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Section ORIGINE */}
          <div className="bg-[#0C0E14] rounded-xl border border-[#1B2333] p-5">
            <div className={sectionTitleClass}>🌍 Origine & Équipe</div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Nationalité (ISO 2)</label>
                <input
                  type="text"
                  value={form.nationality}
                  onChange={e => set('nationality', e.target.value)}
                  placeholder="ex: kr, fr, cn, us..."
                  maxLength={2}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Ligue</label>
                <select
                  value={form.league}
                  onChange={e => set('league', e.target.value)}
                  className={inputClass}
                >
                  {LEAGUES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <div>
                <label className={labelClass}>Tag Équipe</label>
                <input
                  type="text"
                  value={form.teamTag}
                  onChange={e => set('teamTag', e.target.value)}
                  placeholder="ex: T1, G2, KC, GEN..."
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Section AVANCÉ & VISUEL */}
          <div className="bg-[#0C0E14] rounded-xl border border-[#1B2333] p-5">
            <div className={sectionTitleClass}>⚙️ Options visuelles & effets</div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={labelClass}>Couleur thème (accentuation & lueurs)</label>
                <span className="text-[10px] text-accent-cyan">
                  Lueur holographique, reflets sur la carte et effets lumineux pendant l'opening
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.themeColor}
                  onChange={e => set('themeColor', e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent shrink-0"
                />
                <input
                  type="text"
                  value={form.themeColor}
                  onChange={e => set('themeColor', e.target.value)}
                  className={`${inputClass} flex-1 font-mono text-xs`}
                />
              </div>

              {/* Raccourcis couleurs d'équipes célèbres */}
              <div className="flex gap-2 mt-2 items-center flex-wrap">
                <span className="text-[10px] text-text-muted">Préréglages :</span>
                {THEME_PRESETS.map(p => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => set('themeColor', p.color)}
                    className="text-[10px] px-2 py-0.5 rounded border border-white/10 hover:border-white/40 flex items-center gap-1.5 bg-[#090C13] cursor-pointer"
                  >
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: p.color }} />
                    <span className="text-text-muted">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <label className={labelClass}>Vidéo intro WANTED (optionnel)</label>
              <input
                type="text"
                placeholder="ex: /videos/faker_unkillable.mp4 ou URL .mp4"
                value={form.video}
                onChange={e => set('video', e.target.value)}
                className={inputClass}
              />
              <span className="text-[10px] text-text-muted mt-1 block">
                Laisse vide pour les cartes sans vidéo (animation classique avec cercle d'éclipse).
              </span>
            </div>
          </div>

          {/* Bouton SAUVEGARDER */}
          <div className="flex flex-col gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving || !!conflictingCard || !cleanId || !form.baseName.trim()}
              className={`w-full font-rajdhani font-bold tracking-widest uppercase py-4 px-8 rounded-lg text-base transition-all cursor-pointer ${
                isSaving || !!conflictingCard || !cleanId || !form.baseName.trim()
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-[#4C60D2] via-[#6A7DE8] to-[#4C60D2] text-white hover:brightness-110 active:scale-98 shadow-[0_4px_25px_rgba(76,96,210,0.5)]'
              }`}
            >
              {isSaving 
                ? '⏳ Enregistrement dans le code...' 
                : conflictingCard
                ? "❌ ID déjà utilisé (changez l'ID)"
                : '💾 Sauvegarder dans le code (cardPlayers.js)'}
            </button>

            {saveStatus && (
              <div className={`p-3 rounded-lg text-xs font-bold flex items-center justify-between gap-3 ${
                saveStatus.type === 'success' 
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300' 
                  : 'bg-red-500/20 border border-red-500/40 text-red-300'
              }`}>
                <span>{saveStatus.message}</span>
                {saveStatus.type === 'success' && onNavigateToCards && (
                  <button
                    type="button"
                    onClick={() => onNavigateToCards(form.baseName)}
                    className="px-3 py-1.5 bg-emerald-400 text-black font-rajdhani font-black rounded uppercase text-xs hover:bg-white cursor-pointer transition-all shrink-0 shadow"
                  >
                    👉 Voir dans l'onglet CARTES
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── COLONNE DROITE — Prévisualisation en direct ── */}
        <div className="flex flex-col items-center gap-4 sticky top-4 bg-[#0C0E14] p-6 rounded-2xl border border-[#1B2333] shadow-2xl" style={{ width: '320px' }}>
          <div className="text-accent-cyan text-xs uppercase tracking-[3px] font-bold font-rajdhani">
            Prévisualisation en direct
          </div>
          
          <div className="py-2">
            <CardIllustration
              card={{
                ...form,
                id: cleanId || 'preview',
                rating: Number(form.rating),
              }}
              width={220}
            />
          </div>

          <div className="text-center w-full border-t border-[#1B2333] pt-3">
            <div className="text-accent-cyan font-mono text-xs mb-1">
              ID: {cleanId || '—'}
            </div>
            <div className="text-white font-rajdhani font-black text-xl tracking-wide">
              {form.baseName || 'Nom du joueur'}
            </div>
            <div className="text-text-muted text-xs font-rajdhani font-bold tracking-wider mt-1 uppercase">
              {form.rarity} • {form.role} • {form.teamTag} • {form.league}
            </div>
            {form.variant && (
              <div className="text-[11px] text-amber-300 font-semibold mt-1 italic">
                "{form.variant}"
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Cartes sauvegardées à cette partie ── */}
      <div className="mt-10 pt-8 border-t border-[#1B2333]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-rajdhani uppercase tracking-wider text-xl font-bold flex items-center gap-2">
            <span>📚 Mes cartes créées à cette partie</span>
            <span className="text-xs bg-accent-pink/20 text-accent-pink px-2.5 py-0.5 rounded-full font-mono">
              {savedCards.length}
            </span>
          </h3>
          <span className="text-xs text-text-muted">
            Seules les cartes créées durant la partie en cours sont listées ici.
          </span>
        </div>

        {savedCards.length === 0 ? (
          <div className="bg-[#090C13] border border-dashed border-[#1B2333] rounded-xl p-6 text-center text-text-muted text-sm">
            <div className="text-2xl mb-1">🃏</div>
            <div className="text-white font-rajdhani font-bold mb-1">Aucune carte créée durant cette partie</div>
            <p className="text-xs max-w-md mx-auto text-text-muted">
              Les cartes créées lors de parties précédentes sont désormais des cartes standards définitivement intégrées au jeu (visibles dans l'onglet CARTES).
            </p>
          </div>
        ) : (
          <div className="flex gap-6 flex-wrap">
            {savedCards.map(c => (
              <div 
                key={c.id} 
                className="flex flex-col items-center bg-[#090C13] p-3 rounded-xl border border-[#1B2333] hover:border-accent-pink/50 transition-all group"
                style={{ width: '150px' }}
              >
                <CardIllustration card={c} width={130} />
                
                <div className="text-center mt-2 w-full">
                  <span className="text-accent-cyan font-mono text-[10px] truncate block" title={c.id}>
                    {c.id}
                  </span>
                  <span className="text-white font-bold text-xs truncate block font-rajdhani">{c.baseName}</span>
                  <span className="text-text-muted text-[10px] block">{c.rarity} • {c.rating}</span>
                </div>

                <div className="flex gap-2 mt-3 w-full">
                  <button
                    onClick={() => handleGive(c.id)}
                    title="Ajouter 5 contrats à mon inventaire"
                    className="flex-1 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-bold hover:bg-emerald-500/30 cursor-pointer"
                  >
                    +5
                  </button>
                  <button
                    onClick={() => handleDelete(c.id, c.baseName)}
                    title="Supprimer définitivement du code source"
                    className="px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-[10px] hover:bg-red-500/30 cursor-pointer"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
