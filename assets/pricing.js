/* Fórmula do configurador OF-MOBILE-20260916 fornecido pelo ateliê. */
(function (root) {
  'use strict';
  function quote(s) {
    const b = {1:[22,1,15,25],3:[48,1.75,35,50],7:[90,3,70,50]}[s.threads];
    if (!b || !['guia','braja'].includes(s.kind) || (s.kind === 'guia') !== (Number(s.threads) === 1)) return null;
    // Escolhas em aberto usam explicitamente a referência padrão.
    const bead = {confirmar:0.2,vidro:0.2,jablonex:0.5}[s.beads];
    const firm = {confirmar:0,vidro:0,murano:4}[s.firm];
    const cm = s.length === 'unknown' ? 100 : Number(s.length === 'custom' ? s.customLength : s.length);
    const qty = Number(s.quantity);
    if (bead === undefined || firm === undefined || !Number.isFinite(cm) || cm < 30 || cm > 200 || !Number.isInteger(qty) || qty < 1 || qty > 10) return null;
    let extras = 0;
    for (const x of s.extras || []) {
      if (x === 'Búzios') extras += 12 + 20/60*25;
      else if (x === 'Pingente') extras += 10 + 10/60*25;
      else if (x !== 'Preferência sem metal') return null;
    }
    const factor = cm/100;
    const unit = Math.ceil(((b[0]+b[2]*(bead-0.2)+b[1]*25+(s.finish==='soltos' && Number(s.threads)>1 ? -10 : 0))*factor+firm+extras+12+10.26+b[3])/0.8-1e-9);
    return {unit,total:unit*qty};
  }
  const api = {quote};
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.OgumPricing = api;
})(typeof globalThis === 'object' ? globalThis : this);
