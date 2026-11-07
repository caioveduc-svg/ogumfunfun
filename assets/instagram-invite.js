/* Gentle, nonmodal invitation. No navigation interception or remote embeds. */
(() => {
  'use strict';
  const card = document.getElementById('instagram-invite');
  if (!card) return;
  const key = 'of-instagram-invite-v1', sessionKey = key + '-session';
  const week = 7 * 24 * 60 * 60 * 1000;
  let shown = false, maxY = scrollY, lastY = scrollY;
  const started = performance.now();
  const read = (storage, name) => { try { return storage.getItem(name); } catch { return null; } };
  const remember = () => {
    try { localStorage.setItem(key, String(Date.now())); } catch { /* In-memory flag still applies. */ }
    try { sessionStorage.setItem(sessionKey, '1'); } catch { /* No storage required to navigate. */ }
  };
  const eligible = () => {
    const stamp = Number(read(localStorage, key));
    const cookie = document.getElementById('privacy-panel');
    const active = document.activeElement;
    return !shown && !read(sessionStorage, sessionKey) && !(stamp > 0 && Date.now() - stamp < week)
      && document.visibilityState === 'visible' && (!cookie || cookie.hidden)
      && !document.querySelector('[data-menu-toggle][aria-expanded="true"]')
      && !active?.matches('input, select, textarea, [contenteditable="true"]')
      && !/^\/(configurador|privacidade|termos)(\/|$)/.test(location.pathname);
  };
  const show = () => {
    if (!eligible()) return;
    shown = true; remember(); card.hidden = false;
    // Do not steal keyboard focus or trap the visitor in the invitation.
  };
  const dismiss = () => {
    const hadFocus = card.contains(document.activeElement);
    card.hidden = true; remember();
    if (hadFocus) document.querySelector('.instagram-footer')?.focus({ preventScroll: true });
  };
  card.querySelector('[data-instagram-dismiss]')?.addEventListener('click', dismiss);
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !card.hidden) dismiss(); });
  document.querySelectorAll('[data-instagram-link]').forEach(link => link.addEventListener('click', dismiss));
  document.addEventListener('mouseleave', event => {
    if (matchMedia('(hover: hover) and (pointer: fine)').matches && event.clientY <= 0
      && !event.relatedTarget && performance.now() - started >= 30000) show();
  });
  addEventListener('scroll', () => {
    const y = scrollY;
    maxY = Math.max(maxY, y);
    const range = document.documentElement.scrollHeight - innerHeight;
    if (matchMedia('(hover: none), (pointer: coarse)').matches && range > 200
      && performance.now() - started >= 60000 && maxY / range >= .65 && maxY - y >= 120 && y < lastY) show();
    lastY = y;
  }, { passive: true });
})();
