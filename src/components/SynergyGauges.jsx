import { useState } from 'react';
import { TEAMS_DB } from '../constants/teams';
import { teamColor, leagueColor } from '../constants/teamColors';

const MAX = 5;
const NEUTRAL = '#768196';
const teamLogo = (tag) => TEAMS_DB.find(t => t.tag === tag)?.logo;
const leagueLogo = (league) => `/leagues/${league.toLowerCase()}.webp`;

function Logo({ src, label, size = 18 }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return <span className="text-[9px] font-bold leading-none text-[#8b9bb4]">{label}</span>;
  }
  return (
    <img
      src={src}
      alt={label}
      onError={() => setFailed(true)}
      style={{ width: size, height: size }}
      className="shrink-0 object-contain"
    />
  );
}

function Bar({ count, color, lit }) {
  return (
    <div className="flex flex-1 gap-[3px]">
      {Array.from({ length: MAX }, (_, i) => (
        <div
          key={i}
          className="h-1.5 flex-1 rounded-full bg-[color:var(--sk-track,rgba(255,255,255,0.1))] transition-all duration-500"
          style={i < count
            ? { backgroundColor: color, opacity: lit ? 1 : 0.45, boxShadow: lit ? `0 0 8px ${color}` : 'none' }
            : undefined}
        />
      ))}
    </div>
  );
}

/* ---------- Variante compacte (ArenaView) : étiquettes biseautées ---------- */
const CHIP_CLIP = 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)';

function Chip({ logo, group, color, title }) {
  const lit = group.bonus > 0;
  return (
    <div
      title={title}
      className={`relative flex h-8 items-center gap-2 bg-[color:var(--sk-plate,rgba(255,255,255,0.07))] pl-3.5 pr-4 ${group.key ? '' : 'opacity-40'}`}
      style={{ clipPath: CHIP_CLIP }}
    >
      <div className="flex h-5 w-5 shrink-0 items-center justify-center">{logo}</div>

      <div className="flex gap-[3px]">
        {Array.from({ length: MAX }, (_, i) => (
          <span
            key={i}
            className="h-3 w-[6px] -skew-x-12"
            style={{ backgroundColor: i < group.count ? color : 'var(--sk-pip, rgba(255,255,255,0.18))' }}
          />
        ))}
      </div>

      <span
        className="min-w-[30px] text-right text-[12px] font-bold normal-case tracking-normal"
        style={{ color: lit ? `var(--sk-chip-lit, ${color})` : 'var(--sk-dim, #7d8699)' }}
      >
        {!group.key ? '–' : lit ? `+${group.bonus}` : `${group.count}/${MAX}`}
      </span>

      {lit && <span className="absolute inset-x-0 bottom-0 h-[2px]" style={{ backgroundColor: color }} />}
    </div>
  );
}

/* ---------- Variante complète (RosterTab) ---------- */
function Row({ title, logo, group, color }) {
  const lit = group.bonus > 0;
  return (
    <div className="flex items-center gap-3 text-left">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#222838] bg-[#0C0E14]">
        {logo}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className={`truncate text-[13px] font-semibold ${group.key ? 'text-white' : 'text-[#768196]'}`}>
            {group.key ?? title}
          </span>
          <span className="text-[11px] text-[#768196]">{group.count}/{MAX}</span>
        </div>
        <Bar count={group.count} color={color} lit={lit} />
        <div className="mt-1 text-[10px] text-[#768196]">
          {group.next ? `Palier suivant : ${group.next.at} joueurs (+${group.next.bonus})` : 'Palier maximal'}
        </div>
      </div>
      <div className="w-12 text-right text-sm font-bold" style={{ color: lit ? color : '#4a5266' }}>
        +{group.bonus}
      </div>
    </div>
  );
}

export default function SynergyGauges({ synergy, compact = false }) {
  const { team, league } = synergy;
  const tColor = team.key ? teamColor(team.key) : NEUTRAL;
  const lColor = league.key ? leagueColor(league.key) : NEUTRAL;

  const tLogo = team.key ? <Logo src={teamLogo(team.key)} label={team.key} size={compact ? 18 : 26} /> : <Logo label="–" />;
  const lLogo = league.key ? <Logo src={leagueLogo(league.key)} label={league.key} size={compact ? 18 : 26} /> : <Logo label="–" />;

  if (compact) {
    return (
      <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
        <Chip logo={tLogo} group={team} color={tColor} title={`Synergie équipe${team.key ? ` : ${team.key}` : ''}`} />
        <Chip logo={lLogo} group={league} color={lColor} title={`Synergie ligue${league.key ? ` : ${league.key}` : ''}`} />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#222838] bg-[#131621] p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="m-0 font-['Oswald'] text-[18px] font-medium tracking-[0.5px] text-white">SYNERGIES</h3>
        <span className={`text-sm font-bold ${synergy.bonus > 0 ? 'text-[#00e676]' : 'text-[#4a5266]'}`}>
          +{synergy.bonus}
        </span>
      </div>
      <div className="flex flex-col gap-5">
        <Row title="Équipe" logo={tLogo} group={team} color={tColor} />
        <Row title="Ligue" logo={lLogo} group={league} color={lColor} />
      </div>
    </div>
  );
}