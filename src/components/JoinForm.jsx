export default function JoinForm({ pseudo, setPseudo, joinLobby }) {
  return (
    <div className="panel" style={{ width: '100%', maxWidth: '450px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <input
          value={pseudo}
          onChange={(e) => setPseudo(e.target.value)}
          placeholder="Entrez votre pseudonyme"
          style={{
            width: '100%', padding: '14px', background: 'var(--bg-card)',
            border: '1px solid var(--border)', color: 'white', borderRadius: '4px',
            outline: 'none', fontSize: '16px'
          }}
        />
        <button className="btn btn-cyan" onClick={joinLobby}>Se connecter</button>
      </div>
    </div>
  );
}
