export const TEAM_COLORS = {
  T1: '#E2012D', GEN: '#C8A100', JDG: '#FF3B30', BLG: '#38BDF8', HLE: '#FF7A1A',
  G2: '#E63946', KC: '#1E90FF', TH: '#F7B500', TES: '#D7263D', GX: '#B7C0D8',
  EDG: '#C9A227', DNS: '#3B82F6', DK: '#00B9AE', 'DK.C': '#00B9AE', BRO: '#FF5A36',
  SK: '#F43F5E', NAVI: '#FFD500', KT: '#EF4444', IG: '#9AA3B2', FRX: '#8B5CF6',
  FNC: '#FF5800', VIT: '#FFE600', SEN: '#FB3B5C', RNG: '#D4AF37', RGE: '#3D7EFF',
  NS: '#E11D2E', FLY: '#00A651', DWG: '#1E73BE', DRX: '#4E7DFF', C9: '#00AEEF',
  TL: '#1E6FD9', SSG: '#2F54EB', SKT: '#E2012D', SHFT: '#9058a1', MDK: '#7A5AF8',
  MAD: '#E6B422', FPX: '#D90429',
};

export const LEAGUE_COLORS = {
  LCK: '#4DA3FF', LEC: '#35E0A1', LPL: '#FF5252', LCS: '#7C5CFF',
};

export const teamColor = (tag) => TEAM_COLORS[tag] || '#8C9AD6';
export const leagueColor = (league) => LEAGUE_COLORS[league] || '#8C9AD6';