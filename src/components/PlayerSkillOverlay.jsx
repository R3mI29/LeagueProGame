import React from 'react';

export default function PlayerSkillOverlay({ skillData }) {
  if (!skillData) return null;

  return (
    <div className="skill-overlay">
      <style>{`
        .skill-overlay {
          position: absolute;
          bottom: 20%;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 15px;
          background: linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(10,14,20,0.95) 20%, rgba(10,14,20,0.95) 80%, rgba(0,0,0,0) 100%);
          padding: 10px 60px;
          width: 80%;
          z-index: 50;
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
        .skill-infos { display: flex; flex-direction: column; color: white; text-align: left; }
        .skill-player { font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-bottom: -5px; text-shadow: 0 0 10px currentColor; font-family: 'Rajdhani', sans-serif; }
        .skill-desc { font-family: 'Inter', sans-serif; font-size: 14px; color: #ccc; }

        @keyframes skillPopIn {
          0% { opacity: 0; transform: translate(-50%, 50px) scale(0.8); }
          100% { opacity: 1; transform: translate(-50%, 0) scale(1); }
        }
        @keyframes skillFadeOut {
          0% { opacity: 1; transform: translate(-50%, 0); }
          100% { opacity: 0; transform: translate(-50%, -20px); }
        }
      `}</style>

      <img 
        src={skillData.portrait} 
        alt={skillData.playerName} 
        className="skill-portrait"
        style={{ borderColor: skillData.rarityColor }}
      />
      <div className="skill-infos">
        <div className="skill-player" style={{ color: skillData.rarityColor }}>
          {skillData.playerName} - {skillData.traitName}
        </div>
        <div className="skill-desc">
          {skillData.description}
        </div>
      </div>
    </div>
  );
}