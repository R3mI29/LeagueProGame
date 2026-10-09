import React from 'react';
import { EVENTS } from '../../../constants/seasonConfig';

export default function HallOfFameTab({ sortedLeaderboard, seasonScores, history }) {
  return (
    <div className="animate-[fadeIn_0.3s]">
      <div className="text-center mb-[50px]">
        <h2 className="font-['Oswald'] text-[32px] m-0 mb-2.5 text-white">
          CLASSEMENT GLOBAL
        </h2>
        <p className="text-[#768196] text-[15px] max-w-[600px] mx-auto">
          Le classement mondial officiel basé sur les performances accumulées lors des compétitions du Circuit Pro. Seuls les plus grands laissent leur empreinte.
        </p>
      </div>

      <div className="flex justify-center items-end gap-5 mb-[60px] h-[200px]">
        {/* TOP 2 */}
        {sortedLeaderboard[1] && (
          <div className="w-[220px] bg-[linear-gradient(180deg,rgba(192,192,192,0.1)_0%,#11141E_100%)] border-t-[4px] border-[#C0C0C0] rounded-t-xl p-5 text-center relative h-[140px] flex flex-col justify-start">
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#C0C0C0] text-black w-[30px] h-[30px] rounded-full flex items-center justify-center font-bold text-[14px] border-[4px] border-[#080A10]">2</div>
            <h3 className="text-white mt-[15px] mb-[5px] text-[18px] whitespace-nowrap overflow-hidden text-ellipsis">{sortedLeaderboard[1].name}</h3>
            <span className="text-[#C0C0C0] font-bold">{seasonScores?.[sortedLeaderboard[1].id]?.points || 0} PTS</span>
          </div>
        )}

        {/* TOP 1 */}
        {sortedLeaderboard[0] && (
          <div className="w-[260px] bg-[linear-gradient(180deg,rgba(212,175,55,0.15)_0%,#11141E_100%)] border-t-[6px] border-[#D4AF37] rounded-t-xl p-[30px_20px] text-center relative h-[180px] flex flex-col justify-start shadow-[0_-10px_40px_rgba(212,175,55,0.15)]">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-[40px] drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]">👑</div>
            <h3 className="text-[#D4AF37] mt-[5px] mb-[5px] text-[24px] font-['Oswald'] tracking-[1px] whitespace-nowrap overflow-hidden text-ellipsis">{sortedLeaderboard[0].name}</h3>
            <span className="text-white font-bold text-[18px]">{seasonScores?.[sortedLeaderboard[0].id]?.points || 0} PTS</span>
            {(seasonScores?.[sortedLeaderboard[0].id]?.titles || 0) > 0 && <span className="text-[12px] text-[#768196] mt-2.5">{seasonScores[sortedLeaderboard[0].id].titles} Trophée(s)</span>}
          </div>
        )}

        {/* TOP 3 */}
        {sortedLeaderboard[2] && (
          <div className="w-[220px] bg-[linear-gradient(180deg,rgba(205,127,50,0.1)_0%,#11141E_100%)] border-t-[4px] border-[#CD7F32] rounded-t-xl p-5 text-center relative h-[120px] flex flex-col justify-start">
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#CD7F32] text-black w-[30px] h-[30px] rounded-full flex items-center justify-center font-bold text-[14px] border-[4px] border-[#080A10]">3</div>
            <h3 className="text-white mt-[15px] mb-[5px] text-[18px] whitespace-nowrap overflow-hidden text-ellipsis">{sortedLeaderboard[2].name}</h3>
            <span className="text-[#CD7F32] font-bold">{seasonScores?.[sortedLeaderboard[2].id]?.points || 0} PTS</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-10">
        <div className="bg-[#11141E] rounded-lg p-8 border border-[#222838]">
          <h3 className="font-['Oswald'] text-white m-0 mb-5 text-[20px] border-b border-[#222838] pb-4">CHALLENGERS (TOP 4 - 16)</h3>
          <div className="flex flex-col gap-2">
            {sortedLeaderboard.slice(3, 16).map((p, i) => (
              <div key={p.id} className="flex justify-between p-[12px_16px] bg-[#0C0E14] rounded-md">
                <span className="text-[#EAEAEA]">
                  <span className="text-[#768196] mr-4 inline-block w-5">#{i + 4}</span> 
                  {p.name}
                </span>
                <span className="text-white font-semibold">{seasonScores?.[p.id]?.points || 0} PTS</span>
              </div>
            ))}
            {sortedLeaderboard.length <= 3 && <div className="text-[#768196] italic text-center p-5">En attente de plus d'équipes.</div>}
          </div>
        </div>

        <div className="bg-[#11141E] rounded-lg p-8 border border-[#222838]">
          <h3 className="font-['Oswald'] text-white m-0 mb-5 text-[20px] border-b border-[#222838] pb-4">LIVRE DES ARCHIVES</h3>
          <div className="flex flex-col gap-4">
            {history && history.length > 0 ? (
              history.map((h, i) => {
                const eventDetails = EVENTS.find(e => e.id === h.eventId);
                return (
                  <div key={i} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                    <img src={eventDetails?.logo} alt="Logo" className="w-10 h-10 object-contain" />
                    <div className="flex-1">
                      <div className="text-[12px] text-[#768196] tracking-[1px] uppercase">Année {h.year} - {eventDetails?.name || h.eventId}</div>
                      <div className="text-[#D4AF37] font-bold text-[16px]">{h.winnerName}</div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-[#768196] italic py-10 text-center">
                L'histoire reste à écrire. Remportez le prochain tournoi pour marquer votre nom ici.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}