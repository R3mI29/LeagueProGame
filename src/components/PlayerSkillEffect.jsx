import React, { useState } from 'react';

export default function PlayerSkillEffect() {
  // L'état qui gère l'affichage de la compétence. S'il est null, rien ne s'affiche.
  const [activeSkill, setActiveSkill] = useState(null);

  // C'est CETTE fonction que ton vrai moteur de match appellera
  // quand la carte de Faker proc son effet.
  const triggerFakerEffect = () => {
    setActiveSkill({
      playerName: "FAKER",
      traitName: "UNKILLABLE DEMON KING",
      description: "Esquive les dégâts létaux et restaure 30% des HP de l'équipe !",
      rarityColor: "#ffffff", // Couleur WANTED
      portrait: "/cardsImg/others/faker_UDK2.jpg" // L'image de la carte
    });

    // Fait disparaître l'alerte après 3 secondes
    setTimeout(() => {
      setActiveSkill(null);
    }, 3000);
  };

  return (
    <div className="match-window">
      <style>{`
        .match-window {
          position: relative;
          width: 100%;
          max-width: 800px;
          height: 500px;
          background: #111; /* Simule ton terrain de match */
          border-radius: 12px;
          overflow: hidden;
          font-family: 'Rajdhani', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* BOUTON DE TEST (À remplacer par la logique de ton jeu) */
        .test-btn {
          padding: 10px 20px;
          background: #333;
          color: white;
          border: 1px solid #555;
          cursor: pointer;
          font-family: inherit;
          font-size: 16px;
        }

        /* =========================================
           L'OVERLAY DE COMPÉTENCE (LA BULLE)
           ========================================= */
        .skill-overlay {
          position: absolute;
          bottom: 20%; /* S'affiche dans le tiers bas de l'écran */
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 15px;
          background: linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(10,14,20,0.95) 20%, rgba(10,14,20,0.95) 80%, rgba(0,0,0,0) 100%);
          padding: 10px 60px;
          width: 80%;
          z-index: 50;
          /* Animation d'entrée violente et sortie fondue */
          animation: 
            skillPopIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards,
            skillFadeOut 0.4s ease forwards 2.6s;
        }

        .skill-portrait {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid;
          box-shadow: 0 0 15px rgba(255,255,255,0.3);
        }

        .skill-infos {
          display: flex;
          flex-direction: column;
          color: white;
        }

        .skill-player {
          font-size: 24px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: -5px;
          text-shadow: 0 0 10px currentColor;
        }

        .skill-desc {
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          color: #ccc;
        }

        @keyframes skillPopIn {
          0% { opacity: 0; transform: translate(-50%, 50px) scale(0.8); }
          100% { opacity: 1; transform: translate(-50%, 0) scale(1); }
        }
        @keyframes skillFadeOut {
          0% { opacity: 1; transform: translate(-50%, 0); }
          100% { opacity: 0; transform: translate(-50%, -20px); }
        }
      `}</style>

      {/* BOUTON POUR TESTER LE DÉCLENCHEMENT */}
      <button className="test-btn" onClick={triggerFakerEffect}>
        Simulation : Faker proc son passif
      </button>

      {/* LA BULLE D'EFFET QUI APPARAÎT CONDITIONNELLEMENT */}
      {activeSkill && (
        <div className="skill-overlay">
          <img 
            src={activeSkill.portrait} 
            alt={activeSkill.playerName} 
            className="skill-portrait"
            style={{ borderColor: activeSkill.rarityColor }}
          />
          <div className="skill-infos">
            <div className="skill-player" style={{ color: activeSkill.rarityColor }}>
              {activeSkill.playerName} - {activeSkill.traitName}
            </div>
            <div className="skill-desc">
              {activeSkill.description}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}