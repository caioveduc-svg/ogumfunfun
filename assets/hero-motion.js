/* Sem scroll hijacking: o movimento acompanha o navegador e pode ser pausado. */
(() => {
  const hero = document.querySelector('[data-hero]');
  if (!hero) return;
  const visual = hero.querySelector('.hero-visual');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover:hover) and (pointer:fine)');
  let paused = false, frame = 0, x = 0, y = 0, visible = true;
  const reset = () => {
    visual.style.setProperty('--hero-x','0px');
    visual.style.setProperty('--hero-y','0px');
    visual.style.setProperty('--hero-r','0deg');
    visual.style.setProperty('--orbit-r','0deg');
  };
  const draw = () => {
    frame = 0;
    if (paused || reduced.matches || !visible || document.hidden) return;
    const offset = Math.min(1, Math.max(0, -hero.getBoundingClientRect().top / hero.offsetHeight));
    visual.style.setProperty('--hero-x',`${x * 7}px`);
    visual.style.setProperty('--hero-y',`${y * 5 + offset * 24}px`);
    visual.style.setProperty('--hero-r',`${x * 1.5}deg`);
    visual.style.setProperty('--orbit-r',`${offset * -8 + x * 2}deg`);
  };
  const schedule = () => { if (!frame && !paused && !reduced.matches && visible) frame = requestAnimationFrame(draw); };
  visual.addEventListener('pointermove', event => {
    if (!finePointer.matches) return;
    const box = visual.getBoundingClientRect();
    x = Math.max(-1, Math.min(1, ((event.clientX - box.left) / box.width - .5) * 2));
    y = Math.max(-1, Math.min(1, ((event.clientY - box.top) / box.height - .5) * 2));
    schedule();
  });
  visual.addEventListener('pointerleave', () => { x = y = 0; schedule(); });
  addEventListener('scroll', schedule, {passive:true});
  addEventListener('resize', schedule, {passive:true});
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting; if (visible) schedule();
  }).observe(hero);
  const sync = () => {
    hero.classList.toggle('motion-on', !paused && !reduced.matches);
    hero.classList.toggle('motion-paused', paused || reduced.matches);
    if (paused || reduced.matches) { cancelAnimationFrame(frame); frame = 0; reset(); }
    else schedule();
  };
  reduced.addEventListener('change', sync);
  document.addEventListener('visibilitychange', schedule);
  sync();
})();
