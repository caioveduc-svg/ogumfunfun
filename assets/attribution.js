/* Origem por aba, sem cookies, requisições externas ou identificadores pessoais. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.OgumAttribution = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const TTL = 24 * 60 * 60 * 1000;
  const MARKER = '\n\nOrigem:';
  const clean = (value, max = 80) => String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
  const path = value => clean(String(value || '/').split(/[?#]/)[0], 250);
  const hostIs = (host, domain) => host === domain || host.endsWith('.' + domain);
  const ai = host => ['chatgpt.com', 'chat.openai.com', 'perplexity.ai', 'claude.ai', 'copilot.microsoft.com'].find(domain => hostIs(host, domain));
  const aiLabel = domain => ({ 'chatgpt.com': 'ChatGPT', 'chat.openai.com': 'ChatGPT', 'perplexity.ai': 'Perplexity', 'claude.ai': 'Claude', 'copilot.microsoft.com': 'Copilot' })[domain];
  const isMeta = source => ['meta', 'facebook', 'fb', 'instagram', 'ig', 'facebook.com', 'instagram.com'].includes(source);
  const paid = medium => /^(cpc|ppc|paid|paid_social|social_paid|paid-social|paidsocial|cpm|display)$/.test(medium);
  const unknown = () => ({ channel: 'direto-ou-desconhecido', source: 'nao-identificada', label: 'Direto / origem não identificada' });

  function identify({ href, referrer = '' }) {
    let url;
    try { url = new URL(href); } catch { return unknown(); }
    const p = url.searchParams;
    const source = clean(p.get('utm_source'), 60).toLowerCase();
    const medium = clean(p.get('utm_medium'), 40).toLowerCase();
    if (source) {
      const domain = ai(source);
      const label = domain ? aiLabel(domain) : isMeta(source) && paid(medium) ? 'Meta Ads' : source;
      return {
        channel: paid(medium) ? 'midia-paga' : domain ? 'ia-referenciada' : 'utm', source, medium,
        label: `${label} (UTM${medium ? ': ' + medium : ''})`,
        campaign: clean(p.get('utm_campaign')), campaignId: clean(p.get('utm_id')),
        content: clean(p.get('utm_content'))
      };
    }
    // fbclid também pode existir em links orgânicos; não prova anúncio pago.
    if (p.has('fbclid') || p.has('gclid')) return {
      channel: 'clique-identificado', source: p.has('gclid') ? 'google' : 'meta',
      label: `${p.has('gclid') ? 'Google' : 'Meta'} (clique identificado; campanha não identificada)`
    };
    let ref;
    try { ref = new URL(referrer); } catch { return unknown(); }
    if (!/^https?:$/.test(ref.protocol) || ref.hostname === url.hostname) return unknown();
    const host = ref.hostname.toLowerCase();
    const domain = ai(host);
    if (domain) return { channel: 'ia-referenciada', source: domain, label: `${aiLabel(domain)} (referência do navegador)` };
    const search = ['google.com', 'google.com.br', 'google.pt', 'bing.com', 'duckduckgo.com'].find(d => hostIs(host, d));
    if (search) return { channel: 'busca-organica', source: search, label: `${search} (busca; sem campanha identificada)` };
    return { channel: 'referencia', source: clean(host), label: `${clean(host)} (site de referência)` };
  }

  function remember(previous, observed, landing, now = Date.now()) {
    const touch = { ...observed, landing: path(landing) };
    const valid = previous?.version === 1 && previous.first?.label && previous.last?.label &&
      Number.isFinite(previous.startedAt) && now >= previous.startedAt && now - previous.startedAt < TTL;
    if (!valid) return { version: 1, startedAt: now, first: touch, last: touch };
    return { ...previous, last: observed.channel === 'direto-ou-desconhecido' ? previous.last : touch };
  }

  function describe(origin, currentPath) {
    if (!origin?.last) return '';
    const last = origin.last;
    let label = last.channel === 'direto-ou-desconhecido' ? 'não identificada' : clean(last.label,160).replace(/ \(UTM[^)]*\)| \(referência do navegador\)/g,'');
    if (last.channel === 'busca-organica') label = `${last.source?.startsWith('google.') ? 'Google' : last.source === 'bing.com' ? 'Bing' : 'Busca'} (orgânico)`;
    if (last.channel === 'clique-identificado') label = `${last.source === 'meta' ? 'Meta' : 'Google'} (link identificado)`;
    const parts = [`Origem: ${label}`];
    if (last.campaign || last.campaignId) parts.push(`Campanha: ${clean(last.campaign || last.campaignId)}`);
    if (last.content) parts.push(`Criativo: ${clean(last.content)}`);
    return parts.join(' · ');
  }

  function append(message, origin, currentPath) {
    const details = describe(origin, currentPath);
    const base = String(message || '').split(MARKER)[0].split('\n\nOrigem da visita:')[0];
    return details ? `${base}\n\n${details}` : base;
  }

  function decorate(href, origin, currentPath) {
    let url;
    try { url = new URL(href); } catch { return href; }
    if (url.protocol !== 'https:' || url.hostname !== 'wa.me') return href;
    url.searchParams.set('text', append(url.searchParams.get('text'), origin, currentPath));
    return url.href;
  }
  return { identify, remember, describe, append, decorate };
});
