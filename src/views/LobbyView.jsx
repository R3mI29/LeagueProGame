import React, { useState } from 'react';
import { TEAMS_DB } from '../App';

export default function LobbyView({ state, socket }) {
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [selectedLogo, setSelectedLogo] = useState('');

  const usedLogos = state.participants.map(p => p.logo).filter(Boolean);
  const availableLogos = TEAMS_DB.filter(t => !usedLogos.includes(t.logo));

  const handleJoin = (e) => {
    e.preventDefault();
    if (!name.trim()) return alert("Entrez un nom d'équipe.");
    if (tag.length < 2 || tag.length > 4) return alert("L'abréviation (TAG) doit faire entre 2 et 4 caractères.");
    if (!selectedLogo) return alert("Sélectionnez une icône pour votre équipe.");
    socket.emit('join-lobby', name, tag, selectedLogo);
  };

  const amIJoined = state.participants.some(p => p.id === socket.id);

  if (amIJoined) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A0D14', color: '#FFF', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 40px', fontFamily: "'Inter', sans-serif" }}>
        <h1 style={{ fontSize: '42px', marginBottom: '40px', color: '#8C9AD6', letterSpacing: '2px', fontWeight: 800 }}>SALLE D'ATTENTE ({state.participants.length}/16)</h1>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px', width: '100%', maxWidth: '1400px' }}>
            {state.participants.map(p => (
                <div key={p.id} style={{ background: '#151923', border: '1px solid #2B3040', borderRadius: '12px', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                    {p.logo ? <img src={p.logo} alt="" style={{width: '48px', height: '48px', objectFit: 'contain'}} /> : <div style={{width:'48px', height:'48px', background:'#2B3040', borderRadius:'8px'}} />}
                    <div>
                        <div style={{ fontSize: '15px', color: '#4C60D2', fontWeight: 800, letterSpacing: '1px' }}>[{p.tag}]</div>
                        <div style={{ fontSize: '20px', fontWeight: 600, color: '#F0F0F2' }}>{p.name}</div>
                    </div>
                </div>
            ))}
        </div>

        {state.participants.length > 0 && state.participants[0].id === socket.id && (
            <div style={{ marginTop: '60px', display: 'flex', gap: '20px' }}>
                <button onClick={() => socket.emit('start-draft')} style={{ padding: '20px 40px', background: '#4C60D2', color: '#FFF', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '2px', boxShadow: '0 0 20px rgba(76, 96, 210, 0.4)' }}>
                    DÉMARRER LA SAISON
                </button>
            </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0D14', color: '#FFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif", padding: '40px' }}>
      <div style={{ background: '#151923', padding: '50px 60px', borderRadius: '16px', border: '1px solid #2B3040', maxWidth: '1200px', width: '100%', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
        <h1 style={{ color: '#8C9AD6', marginBottom: '12px', fontSize: '48px', letterSpacing: '4px', fontWeight: 900, textTransform: 'uppercase' }}>CIRCUIT ESPORT</h1>
        <p style={{ color: '#7A8190', marginBottom: '40px', fontSize: '18px' }}>Sélectionnez l'identité visuelle de votre franchise.</p>

        <h4 style={{ color: '#FFF', marginBottom: '16px', textAlign: 'left', fontSize: '16px', letterSpacing: '1px' }}>1. CHOISISSEZ VOTRE LOGO</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '12px', marginBottom: '40px', maxHeight: '320px', overflowY: 'auto', padding: '16px', background: '#0A0D14', borderRadius: '12px', border: '1px solid #2B3040' }}>
            {availableLogos.map(team => (
            <div 
                key={team.name} onClick={() => { setSelectedLogo(team.logo); setName(team.name); setTag(team.tag); }}
                style={{ 
                aspectRatio: '1/1', padding: '10px', borderRadius: '10px', 
                border: selectedLogo === team.logo ? '2px solid #4C60D2' : '1px solid #2B3040',
                background: selectedLogo === team.logo ? '#1C212E' : '#151923', cursor: 'pointer', transition: 'all 0.1s',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
            >
                <img src={team.logo} alt={team.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            </div>
            ))}
        </div>

        <h4 style={{ color: '#FFF', marginBottom: '16px', textAlign: 'left', fontSize: '16px', letterSpacing: '1px' }}>2. IDENTITÉ DE L'ÉQUIPE</h4>
        <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
            <input 
                type="text" placeholder="Nom complet de l'équipe" value={name} onChange={(e) => setName(e.target.value)}
                style={{ flex: 3, padding: '20px', borderRadius: '10px', border: '1px solid #2B3040', backgroundColor: '#0A0D14', color: '#FFF', fontSize: '18px', fontWeight: 'bold' }}
            />
            <input 
                type="text" placeholder="TAG (ex: T1)" value={tag} onChange={(e) => setTag(e.target.value.toUpperCase())} maxLength={4}
                style={{ flex: 1, padding: '20px', borderRadius: '10px', border: '1px solid #2B3040', backgroundColor: '#0A0D14', color: '#4C60D2', fontSize: '20px', fontWeight: 'bold', textAlign: 'center' }}
            />
        </div>

        <button onClick={handleJoin} style={{ width: '100%', padding: '24px', borderRadius: '10px', backgroundColor: '#4C60D2', color: '#FFF', border: 'none', fontWeight: 'bold', fontSize: '20px', cursor: 'pointer', letterSpacing: '2px', textTransform: 'uppercase', transition: 'all 0.2s', boxShadow: '0 8px 20px rgba(76, 96, 210, 0.3)' }}>
            VALIDER ET REJOINDRE LE LOBBY
        </button>
      </div>
    </div>
  );
}