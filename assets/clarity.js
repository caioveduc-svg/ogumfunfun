/* Optional analytics: no Clarity request before explicit visitor consent. */
(() => {
  'use strict';
  const key = 'of-analytics-consent-v1';
  const panel = document.querySelector('#privacy-panel');
  if (!panel) return;
  let loaded = false;
  const production = location.hostname === 'ogumfunfun.com.br';
  const getChoice = () => { try { return localStorage.getItem(key); } catch { return null; } };
  const start = () => {
    if (loaded || !production) return;
    loaded = true;
    window.clarity = window.clarity || function () { (window.clarity.q = window.clarity.q || []).push(arguments); };
    window.clarity('consentv2', { analytics_storage: 'granted', ad_storage: 'denied' });
    const tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://www.clarity.ms/tag/z9euwl7068';
    document.head.appendChild(tag);
  };
  const choose = value => {
    try { localStorage.setItem(key, value); } catch { /* Choice applies to this page. */ }
    panel.hidden = true;
    if (value === 'accepted') start();
    else if (loaded) {
      window.clarity('consentv2', { analytics_storage: 'denied', ad_storage: 'denied' });
      // A fresh page removes the recorder entirely after withdrawal.
      location.reload();
    }
  };
  panel.querySelector('[data-analytics-accept]')?.addEventListener('click', () => choose('accepted'));
  panel.querySelector('[data-analytics-reject]')?.addEventListener('click', () => choose('rejected'));
  if (getChoice() === 'accepted') start();
  else if (!getChoice() && production) panel.hidden = false;
  document.addEventListener('click', event => {
    if (!loaded || getChoice() !== 'accepted') return;
    if (event.target.closest('[data-track-whatsapp]')) window.clarity('event', 'whatsapp_click');
    if (event.target.closest('[data-instagram-link]')) window.clarity('event', 'instagram_click');
  }, true);
})();
