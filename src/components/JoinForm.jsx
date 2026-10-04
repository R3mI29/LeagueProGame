export default function JoinForm({ pseudo, setPseudo, joinLobby }) {
  return (
    <div className="w-full max-w-[450px] p-8 bg-bg-panel border border-white/15 rounded-xl shadow-2xl">
      <div className="flex flex-col gap-4">
        <input
          value={pseudo}
          onChange={(e) => setPseudo(e.target.value)}
          placeholder="Entrez votre pseudonyme"
          className="w-full p-3 bg-bg-card border border-white/15 text-white rounded outline-none focus:border-accent-cyan transition-colors text-base"
        />
        <button 
          onClick={joinLobby}
          className="font-rajdhani font-bold tracking-wider uppercase py-3 px-7 bg-accent-cyan text-black rounded hover:bg-[#00b3cc] hover:-translate-y-0.5 transition-all shadow-[0_0_15px_rgba(0,229,255,0.2)]"
        >
          Se connecter
        </button>
      </div>
    </div>
  );
}