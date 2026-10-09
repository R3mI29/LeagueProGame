import { useState, useEffect, useMemo, useRef } from 'react';
import { socket } from '../api/socket';

const SHOW_MS = 14000;
const FADE_MS = 1400;

export default function SecretUnlockOverlay() {
  const [secret, setSecret] = useState(null);
  const [closing, setClosing] = useState(false);
  const timers = useRef([]);

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  const close = () => {
    clearTimers();
    setClosing(true);
    timers.current.push(setTimeout(() => { setSecret(null); setClosing(false); }, FADE_MS));
  };

  useEffect(() => {
    const handler = (data) => {
      clearTimers();
      setClosing(false);
      setSecret(data);
      timers.current.push(setTimeout(close, SHOW_MS));
    };
    socket.on('secret-unlocked', handler);
    return () => { clearTimers(); socket.off('secret-unlocked', handler); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Valeurs aléatoires : seul cas où le style inline est légitime
  const embers = useMemo(() => Array.from({ length: 30 }, (_, i) => ({
    key: i,
    left: Math.random() * 100,
    size: 2 + Math.random() * 4,
    dur: 9 + Math.random() * 9,
    delay: Math.random() * 8,
    drift: (Math.random() - 0.5) * 120,
  })), []);

    if (!secret) return null;

  return (
    <div
      onClick={close}
      className={`fixed inset-0 z-[10000] overflow-hidden bg-black cursor-pointer font-rajdhani
        ${closing ? 'animate-[su-fade-out_1.4s_ease-in_forwards]' : 'animate-[su-fade-in_2s_ease-out_both]'}`}
    >
      {/* Fond : même image, floutée, pour remplir l'écran sans recadrage visible */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,#3a1230_0%,#0a0612_70%)]" />
      {secret.image && (
        <img
          src={secret.image}
          alt=""
          aria-hidden="true"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
          className="absolute inset-0 h-full w-full scale-125 object-cover blur-3xl brightness-[0.35] saturate-150"
        />
      )}

      {/* Lueurs et vignette */}
      <div className="pointer-events-none absolute inset-0 mix-blend-screen bg-[radial-gradient(circle_at_50%_45%,rgba(255,51,102,0.2),transparent_60%)] animate-[su-pulse_5s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.7)_100%)]" />

      {/* Braises */}
      {embers.map(e => (
        <span
          key={e.key}
          className="pointer-events-none absolute -bottom-2.5 rounded-full bg-pink-300/90 opacity-0 shadow-[0_0_10px_2px_rgba(255,90,140,0.8)] animate-[su-rise_linear_infinite]"
          style={{
            left: `${e.left}%`, width: e.size, height: e.size,
            animationDuration: `${e.dur}s`, animationDelay: `${e.delay}s`,
            '--drift': `${e.drift}px`,
          }}
        />
      ))}

      {/* Contenu centré */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-[3vh] px-[6vw] py-[4vh]">
        {secret.image && (
          <div className="animate-[su-float_8s_ease-in-out_2s_infinite]">
            <div className="relative overflow-hidden rounded-2xl shadow-[0_0_80px_rgba(255,51,102,0.45),0_20px_60px_rgba(0,0,0,0.8)] ring-1 ring-white/20 animate-[su-reveal_3.5s_ease-out_both]">
              <img
                src={secret.image}
                alt=""
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                className="block max-h-[70vh] max-w-[88vw] object-contain animate-[su-kenburns_16s_ease-out_both]"
              />
              {/* Balayage de lumière sur l'image */}
              <div className="pointer-events-none absolute -inset-x-1/2 inset-y-0 mix-blend-screen bg-[linear-gradient(105deg,transparent_40%,rgba(255,150,190,0.22)_50%,transparent_60%)] animate-[su-sweep_6s_ease-in-out_2s_infinite_alternate]" />
            </div>
          </div>
        )}

        <div className="text-center">
          <h1 className="m-0 text-[clamp(28px,5vw,72px)] font-extrabold uppercase text-white drop-shadow-[0_0_30px_rgba(255,51,102,0.7)] animate-[su-title_3.2s_cubic-bezier(.2,.7,.2,1)_1.6s_both]">
            {secret.title}
          </h1>
          <p className="mx-auto mt-3 max-w-[820px] text-[clamp(15px,1.6vw,22px)] tracking-wide text-white/80 animate-[su-text-up_2.4s_ease-out_3s_both]">
            {secret.description}
          </p>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-[2.5vh] z-10 text-center text-xs uppercase tracking-[4px] text-white/40 animate-[su-fade-in_2s_ease-out_6s_both]">
        Cliquer pour fermer
      </div>
    </div>
  );
}