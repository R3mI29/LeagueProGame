import { useState, useEffect } from 'react';
import CardIllustration from './CardIllustration';
import { CARD_POOL } from '../constants/cardPlayers';
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

export default function CardCreator() {
  const [form, setForm] = useState({
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

  // Dossier et nom du fichier de destination de l'image
  const [imageFolder, setImageFolder] = useState('cardsImg/custom');
  const [manualFolder, setManualFolder] = useState('');
  const [imageFileName, setImageFileName] = useState('');

  const [savedCards, setSavedCards] = useState(() => {
    const fromPool = CARD_POOL.filter(c => c.isCustom || c.id?.startsWith('custom-'));
    try {
      const fromLocal = JSON.parse(localStorage.getItem('custom_cards') || '[]');
      const map = new Map();
      [...fromPool, ...fromLocal].forEach(c => map.set(c.id, c));
      return Array.from(map.values());
    } catch {
      return fromPool;
    }
  });

  const [dragOver, setDragOver] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [justSavedId, setJustSavedId] = useState(null);

  useEffect(() => {
    const onSaved = (newCard) => {
      setSavedCards(prev => {
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
      setSavedCards(prev => prev.filter(c => c.id !== delId));
    };

    socket.on('dev-card-saved', onSaved);
    socket.on('dev-card-deleted', onDeleted);

    return () => {
      socket.off('dev-card-saved', onSaved);
      socket.off('dev-card-deleted', onDeleted);
    };
  }, []);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

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

  const handleSave = () => {
    if (!form.baseName.trim()) {
      alert('⚠️ Le nom du joueur est requis.');
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);

    const isBase64 = typeof form.image === 'string' && form.image.startsWith('data:');
    const id = `custom-${form.baseName.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '-')}-${Date.now()}`;

    const cardPayload = {
      ...form,
      id,
      rating: Number(form.rating),
      video: form.video?.trim() ? form.video.trim() : undefined,
      themeColor: form.themeColor || undefined,
      variant: form.variant?.trim() || undefined,
      isCustom: true,
    };

    socket.emit('dev-save-custom-card', {
      card: cardPayload,
      imageData: isBase64 ? form.image : null,
      imageFolder: effectiveFolder,
      imageFileName: effectiveFileName,
    }, (response) => {
      setIsSaving(false);
      if (response?.ok && response?.card) {
        setJustSavedId(response.card.id);
        setSaveStatus({
          type: 'success',
          message: `Carte "${response.card.baseName}" enregistrée définitivement dans src/constants/cardPlayers.js !`,
        });

        if (response.card.image) {
          set('image', response.card.image);
        }

        setSavedCards(prev => {
          const idx = prev.findIndex(x => x.id === response.card.id);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = response.card;
            return next;
          }
          return [response.card, ...prev];
        });

        // Mise à jour de sauvegarde locale
        try {
          const updated = [...savedCards.filter(c => c.id !== response.card.id), response.card];
          localStorage.setItem('custom_cards', JSON.stringify(updated));
        } catch (_) {}

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
    if (!confirm(`Supprimer définitivement la carte "${cardName}" du code source (cardPlayers.js) ?`)) return;

    socket.emit('dev-delete-custom-card', cardId, (response) => {
      if (response?.ok) {
        setSavedCards(prev => prev.filter(c => c.id !== cardId));
        const idx = CARD_POOL.findIndex(c => c.id === cardId);
        if (idx !== -1) CARD_POOL.splice(idx, 1);
        try {
          const local = JSON.parse(localStorage.getItem('custom_cards') || '[]');
          localStorage.setItem('custom_cards', JSON.stringify(local.filter(c => c.id !== cardId)));
        } catch (_) {}
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
              disabled={isSaving}
              className={`w-full font-rajdhani font-bold tracking-widest uppercase py-4 px-8 rounded-lg text-base shadow-[0_4px_25px_rgba(76,96,210,0.5)] transition-all cursor-pointer ${
                isSaving 
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#4C60D2] via-[#6A7DE8] to-[#4C60D2] text-white hover:brightness-110 active:scale-98'
              }`}
            >
              {isSaving ? '⏳ Enregistrement dans le code...' : '💾 Sauvegarder dans le code (cardPlayers.js)'}
            </button>

            {saveStatus && (
              <div className={`p-3 rounded-lg text-xs font-bold ${
                saveStatus.type === 'success' 
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300' 
                  : 'bg-red-500/20 border border-red-500/40 text-red-300'
              }`}>
                {saveStatus.message}
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
                id: 'preview',
                rating: Number(form.rating),
              }}
              width={220}
            />
          </div>

          <div className="text-center w-full border-t border-[#1B2333] pt-3">
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

      {/* ── Cartes sauvegardées ── */}
      {savedCards.length > 0 && (
        <div className="mt-10 pt-8 border-t border-[#1B2333]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-rajdhani uppercase tracking-wider text-xl font-bold flex items-center gap-2">
              <span>📚 Mes cartes créées</span>
              <span className="text-xs bg-accent-pink/20 text-accent-pink px-2 py-0.5 rounded-full font-mono">
                {savedCards.length}
              </span>
            </h3>
            <span className="text-xs text-text-muted">
              Ces cartes sont écrites de manière permanente dans le code source du jeu.
            </span>
          </div>

          <div className="flex gap-6 flex-wrap">
            {savedCards.map(c => (
              <div 
                key={c.id} 
                className="flex flex-col items-center bg-[#090C13] p-3 rounded-xl border border-[#1B2333] hover:border-accent-pink/50 transition-all group"
                style={{ width: '150px' }}
              >
                <CardIllustration card={c} width={130} />
                
                <div className="text-center mt-2 w-full">
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
        </div>
      )}
    </div>
  );
}
