(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const safeGet = key => { try { return JSON.parse(sessionStorage.getItem(key)); } catch { return null; } };
  const safeSet = (key, value) => { try { sessionStorage.setItem(key, JSON.stringify(value)); } catch {} };
  const track = event => {
    // Somente nomes genéricos; o adaptador externo exige consentimento.
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event });
    document.dispatchEvent(new CustomEvent('of:analytics', { detail: event }));
  };
  const params = new URLSearchParams(location.search);
  const attribution = window.OgumAttribution;
  const origin = attribution?.remember(safeGet('of-origin-v2'), attribution.identify({ href: location.href, referrer: document.referrer }), location.pathname);
  if (origin) safeSet('of-origin-v2', origin);

  const menu = $('[data-menu]');
  const toggle = $('[data-menu-toggle]');
  const updateMenuTop = () => {
    const header = $('.site-header');
    if (header && menu) menu.style.setProperty('--menu-top', `${Math.max(0, header.getBoundingClientRect().bottom)}px`);
  };
  const closeMenu = () => { menu?.classList.remove('open'); document.body.classList.remove('menu-open'); toggle?.setAttribute('aria-expanded', 'false'); };
  menu?.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open)); menu.classList.toggle('open', open); document.body.classList.toggle('menu-open', open);
    if (open) { updateMenuTop(); $('a', menu)?.focus({ preventScroll: true }); }
  });
  window.addEventListener('resize', () => { if (menu?.classList.contains('open')) updateMenuTop(); }, { passive: true });
  window.visualViewport?.addEventListener('resize', () => { if (menu?.classList.contains('open')) updateMenuTop(); }, { passive: true });
  document.addEventListener('keydown', e => {
    if (!menu?.classList.contains('open')) return;
    if (e.key === 'Escape') { closeMenu(); toggle.focus(); }
    if (e.key === 'Tab') {
      const focusable = [toggle, ...$$('a', menu)]; const first = focusable[0], last = focusable.at(-1);
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  window.matchMedia('(min-width: 801px)').addEventListener('change', e => { if (e.matches) closeMenu(); });

  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    try {
      const observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.remove('waiting'); observer.unobserve(entry.target); }
      }), { threshold: .07 });
      document.body.classList.add('motion-ready');
      $$('.reveal').forEach(el => { el.classList.add('waiting'); observer.observe(el); });
      // Uma falha de observação não pode esconder o conteúdo.
      setTimeout(() => $$('.waiting').forEach(el => el.classList.remove('waiting')), 4500);
    } catch { $$('.waiting').forEach(el => el.classList.remove('waiting')); }
  }

  $$('[data-filter-root]').forEach(root => {
    let group = 'all';
    const cards = $$('[data-filter-card]', root), search = $('[data-search]', root), status = $('[data-filter-status]', root);
    const normalize = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const update = () => {
      const term = normalize(search?.value || ''); let total = 0;
      cards.forEach(card => { const visible = (group === 'all' || (card.dataset.group || '').split('|').includes(group)) && normalize(card.textContent).includes(term); card.hidden = !visible; if (visible) total++; });
      if (status) status.textContent = total ? `${total} ${total === 1 ? 'resultado encontrado' : 'resultados encontrados'}.` : 'Nenhum resultado. Tente outro nome ou remova o filtro.';
    };
    $$('[data-filter]', root).forEach(button => button.addEventListener('click', () => {
      group = button.dataset.filter;
      $$('[data-filter]', root).forEach(b => b.setAttribute('aria-pressed', String(b === button)));
      update();
    }));
    search?.addEventListener('input', update);
    update();
  });

  $$('[data-reference-search]').forEach(root => {
    const input = $('[data-reference-input]', root), status = $('[data-reference-status]', root);
    const items = $$('[data-reference-item]', root);
    const clear = $('[data-reference-clear]', root), empty = $('[data-reference-empty]', root);
    const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const update = () => {
      const term = normalize(input.value); let count = 0;
      items.forEach(item => {
        const visible = term ? (' ' + normalize(item.dataset.referenceName)).includes(' ' + term) : item.dataset.popular === 'true';
        item.hidden = !visible; if (visible) count++;
      });
      if (clear) clear.hidden = !input.value;
      if (empty) empty.hidden = count !== 0;
      status.textContent = !term ? 'Referências para começar' : count ? `${count} ${count === 1 ? 'coleção encontrada. Abra a página abaixo.' : 'coleções encontradas. Escolha uma abaixo.'}` : 'Nenhuma coleção encontrada.';
    };
    input.addEventListener('input', update);
    clear?.addEventListener('click', () => { input.value = ''; update(); input.focus(); });
    input.addEventListener('keydown', event => {
      if (event.key === 'Escape' && input.value) { event.preventDefault(); input.value = ''; update(); return; }
      if (event.key !== 'Enter') return;
      event.preventDefault();
      const visible = items.filter(item => !item.hidden);
      if (visible.length === 1) $('a', visible[0]).click();
      else if (visible.length) $('a', visible[0]).focus();
    });
    update();
  });

  $$('a[href^="https://wa.me/"]').forEach(a => {
    if (attribution) a.href = attribution.decorate(a.href, origin, location.pathname);
  });
  document.addEventListener('click', event => {
    if (event.target.closest('a[href^="https://wa.me/"]')) track('whatsapp_click');
  });
  $$('[data-privacy-open]').forEach(button => button.addEventListener('click', () => {
    const panel = $('#privacy-panel'); panel.hidden = false; $('[data-analytics-reject]', panel)?.focus();
  }));
  $('[data-privacy-close]')?.addEventListener('click', () => { $('#privacy-panel').hidden = true; $('[data-privacy-open]')?.focus(); });

  const form = $('#piece-form');
  if (!form) return;
  const config = JSON.parse($('#config-data').textContent);
  const cache = safeGet('of-piece-v1');
  const defaults = { model: '', kind: 'confirmar', threads: 'confirmar', entity: '', quality: '', colors: [], customColors: '', length: 'unknown', customLength: '', finish: 'confirmar', delivery: 'confirmar', beads: 'confirmar', firm: 'confirmar', extras: [], notes: '', name: '', cep: '', quantity: '1', step: 0, requestId: `OF-${Date.now().toString(36).toUpperCase()}` };
  let state = cache && Date.now() - cache.savedAt < 86400000 ? { ...defaults, ...cache.state } : { ...defaults };
  state.colors = Array.isArray(state.colors) ? state.colors.slice(0, 4) : [];
  state.extras = Array.isArray(state.extras) ? state.extras : [];
  state.step = [0, 1, 2].includes(state.step) ? state.step : 0;
  const entity = config.collections.find(c => c.slug === params.get('colecao'));
  const preset = config.models.find(m => m.id === params.get('modelo'));
  const entry = `${entity?.slug || ''}|${preset?.id || ''}`;
  if (state.entry !== entry) {
    if (entity) state.entity = entity.name;
    if (preset) Object.assign(state, { model: preset.id, kind: preset.kind, threads: String(preset.threads) });
    state.entry = entry;
  }
  const fields = ['entity', 'quality', 'customColors', 'kind', 'threads', 'length', 'customLength', 'finish', 'delivery', 'beads', 'firm', 'notes', 'name', 'cep', 'quantity'];
  const error = $('#config-error');
  let current = state.step;
  if (!state.model) current = state.step = 0;
  let furthest = state.model ? Math.max(current, Number(state.maxStep) || 0) : 0;
  const labels = {
    kind: { guia: 'Guia / fio de contas', braja: 'Brajá', chicote: 'Chicote', confirmar: 'A confirmar' },
    finish: { confirmar: 'A confirmar', trancada: 'Trançada', soltos: 'Fios soltos' },
    delivery: { confirmar: 'A confirmar com minha casa', fechada: 'Fechada', aberta: 'Aberta' },
    beads: { confirmar: 'A confirmar', vidro: 'Miçangas de vidro — confirmar referência', jablonex: 'Referência Jablonex — verificar disponibilidade' },
    firm: { confirmar: 'A confirmar', sem: 'Sem firma', vidro: 'Firma de vidro', murano: 'Referência de firma em murano — confirmar' }
  };
  const persist = () => safeSet('of-piece-v1', { savedAt: Date.now(), state: { ...state, step: current } });
  const read = () => {
    $$('[data-choice-for]:checked', form).forEach(input => { $('#' + input.dataset.choiceFor).value = input.value; });
    fields.forEach(key => state[key] = $('#' + key).value.trim());
    if (state.model) { const model = config.models.find(m => m.kind === state.kind && String(m.threads) === state.threads); state.model = model?.id || 'help'; }
    state.extras = $$('[name=extras]:checked').map(input => input.value);
    state.step = current;
  };
  const fill = () => {
    fields.forEach(key => $('#' + key).value = state[key]);
    $$('[data-choice-for]', form).forEach(input => input.checked = input.value === String(state[input.dataset.choiceFor]));
    $$('[name=extras]').forEach(input => input.checked = state.extras.includes(input.value));
    $$('[data-model]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.model === state.model)));
    $$('[data-color]').forEach(b => b.setAttribute('aria-pressed', String(state.colors.includes(b.dataset.color))));
  };
  const modelLabel = () => state.kind === 'confirmar' ? 'Estrutura a definir' : state.threads === 'confirmar' ? labels.kind[state.kind] : `${labels.kind[state.kind]} · ${state.threads} ${state.threads === '1' ? 'fio' : 'fios'}`;
  const lengthLabel = () => state.length === 'unknown' ? 'A confirmar' : `${state.length === 'custom' ? state.customLength : state.length} cm — peça estendida`;
  const priceText = () => {
    const q = window.OgumPricing?.quote(state);
    return q ? `Estimativa: ${q.total.toLocaleString('pt-BR', {style:'currency',currency:'BRL'})}${Number(state.quantity)>1 ? ' no total' : ' por peça'} · sem frete · padrão: 100 cm, vidro comum e firma simples quando não definidos` : 'Composição especial: valor a confirmar';
  };
  const rows = () => [
    ['Estimativa', priceText().replace(/^Estimativa: /, '')],
    ['Tipo de peça', labels.kind[state.kind] || 'A confirmar'],
    ['Fios', state.threads === 'confirmar' ? 'A confirmar' : state.threads],
    ['Referência', state.entity || 'A confirmar'],
    ...(state.quality ? [['Qualidade / referência da casa', state.quality]] : []),
    ['Cores', [...state.colors, state.customColors].filter(Boolean).join(', ') || 'A confirmar'],
    ['Comprimento', lengthLabel()], ['Montagem', labels.finish[state.finish]], ['Como receber', labels.delivery[state.delivery]],
    ['Miçangas', labels.beads[state.beads]], ['Firma', labels.firm[state.firm]], ['Detalhes', state.extras.join(', ') || 'Nenhum detalhe extra definido'],
    ['Observações', state.notes || 'Sem observações'], ['Quantidade', state.quantity], ['Nome', state.name || 'Não informado'], ['CEP', state.cep || 'A confirmar']
  ];
  const renderSummary = () => {
    const list = $('#summary-list'); list.replaceChildren();
    rows().forEach(([label, value]) => {
      const div = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = label; dd.textContent = value; div.append(dt, dd); list.append(div);
    });
    $('#request-id').textContent = state.requestId;
  };
  const message = () => {
    read();
    const text = window.OgumWhatsApp.request(state, window.OgumPricing);
    return attribution ? attribution.append(text, origin, location.pathname) : text;
  };
  const setNextAction = (label, direction) => {
    const button = $('#config-next');
    button.replaceChildren(document.createTextNode(label));
    if (!direction) return;
    const ns = 'http://www.w3.org/2000/svg';
    const icon = document.createElementNS(ns, 'svg'), path = document.createElementNS(ns, 'path');
    for (const [key,value] of Object.entries({class:'link-arrow-icon',width:'16',height:'16',viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':'1.6','stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true',focusable:'false'})) icon.setAttribute(key,value);
    path.setAttribute('d', direction === 'up-right' ? 'M7 17 17 7M7 7h10v10' : 'M5 12h14m-6-6 6 6-6 6');
    icon.append(path);button.append(icon);
  };
  const update = () => {
    $$('[data-choice-for]', form).forEach(input => input.checked = input.value === String(state[input.dataset.choiceFor]));
    $$('[data-model]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.model === state.model)));
    const quote = window.OgumPricing?.quote(state);
    const amount = $('[data-estimate-amount]');
    const amountText = quote ? quote.total.toLocaleString('pt-BR', {style:'currency',currency:'BRL'}) : state.model ? 'A confirmar' : 'A definir';
    if (amount && amount.textContent !== amountText) amount.textContent = amountText;
    const mobileAmount = $('[data-mobile-estimate]'); if (mobileAmount && mobileAmount.textContent !== amountText) mobileAmount.textContent = amountText;
    const mobilePrice = $('[data-mobile-price-wrap]'); if (mobilePrice) mobilePrice.hidden = current !== 1;
    const caption = $('[data-estimate-caption]');
    const captionText = quote ? (Number(state.quantity)>1 ? `${state.quantity} peças · sem frete` : 'por peça · sem frete') : state.model ? 'Valor definido no atendimento' : 'Selecione um modelo ou peça ajuda';
    if (caption && caption.textContent !== captionText) caption.textContent = captionText;
    const colors = $('[data-recap-colors]'); if (colors) colors.textContent = [...state.colors,state.customColors].filter(Boolean).join(', ') || 'A confirmar';
    const length = $('[data-recap-length]'); if (length) length.textContent = lengthLabel();
    const chosen = $('[data-chosen-model]'); if (chosen) chosen.textContent = modelLabel();
    $('#config-next').disabled = current === 0 && !state.model;
    if (current === 0) setNextAction(state.model ? 'Escolher os detalhes' : 'Escolha um modelo', state.model ? 'right' : null);
    $$('[data-live-price]').forEach(el => el.textContent = priceText());
    $('#custom-length-wrap').hidden = state.length !== 'custom';
    $('#selected-colors').textContent = state.colors.length ? `Selecionadas: ${state.colors.join(', ')}. Até quatro cores.` : 'Você pode definir as cores depois.';
    $('#preview-title').textContent = state.model ? modelLabel() : 'Escolha um modelo';
    $('#preview-detail').textContent = state.entity ? `Referência informada: ${state.entity}. Materiais e montagem a confirmar.` : 'Sua referência pode ser definida durante o atendimento.';
    const preview = $('#preview-image');
    const previewSrc = `/assets/placeholders/${state.kind === 'guia' ? 'guia' : state.threads === '7' ? 'braja-sete' : 'braja'}-conceito.webp`;
    const previewModel = config.models.find(m => m.kind === state.kind && String(m.threads) === state.threads);
    const thumbnail = previewModel ? $(`[data-model="${previewModel.id}"] img`) : null;
    if (thumbnail?.srcset) { preview.sizes = '(max-width:800px) 1px, 304px'; if (preview.srcset !== thumbnail.srcset) preview.srcset = thumbnail.srcset; }
    else preview.removeAttribute('srcset');
    if (state.model && state.model !== 'help' && preview.getAttribute('src') !== previewSrc) preview.src = previewSrc;
    preview.closest('.image-frame').hidden = !state.model || state.model === 'help';
    const helpLink = $('.config-help');
    if (helpLink && window.OgumWhatsApp) { const text = window.OgumWhatsApp.request(state, window.OgumPricing, {help:true}); const base = attribution ? attribution.append(text, origin, location.pathname) : text; helpLink.href = `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(base)}`; }
    if (current === 2) renderSummary();
    persist();
  };
  const showError = (text, target) => { error.textContent = text; error.hidden = false; const details = target?.closest('details'); if (details) details.open = true; target?.setAttribute('aria-invalid', 'true'); target?.focus(); };
  const validate = () => {
    error.hidden = true; $$('[aria-invalid]', form).forEach(el => el.removeAttribute('aria-invalid'));
    if (current >= 1 && state.length === 'custom' && (!/^\d+(\.\d+)?$/.test(state.customLength) || Number(state.customLength) < 30 || Number(state.customLength) > 200)) {
      showError('Informe uma medida de 30 a 200 cm ou deixe para confirmar no atendimento.', $('#customLength')); return false;
    }
    if (current === 2 && (!/^\d+$/.test(state.quantity) || Number(state.quantity) < 1 || Number(state.quantity) > 10)) { showError('Informe uma quantidade entre 1 e 10 peças.', $('#quantity')); return false; }
    if (current === 2 && state.cep && !/^\d{5}-?\d{3}$/.test(state.cep)) { showError('Confira o CEP: use oito números ou deixe o campo em branco.', $('#cep')); return false; }
    return true;
  };
  const show = (index, focus = true) => {
    current = index; state.step = index; furthest = Math.max(furthest,index); state.maxStep = furthest;
    $$('[data-config-panel]').forEach((panel, i) => panel.hidden = i !== index);
    $$('[data-step]').forEach((button, i) => { button.disabled = i > furthest; if (i === index) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current'); });
    $('#config-back').hidden = index === 0;
    setNextAction(index === 0 ? 'Escolher os detalhes' : index === 1 ? 'Conferir resumo' : 'Revisar no WhatsApp', index === 2 ? 'up-right' : 'right');
    if (index === 2 && !state.completed) { track('configurator_complete'); state.completed = true; }
    update();
    if (focus) { const heading = $('h2', $(`[data-config-panel="${index}"]`)); heading.focus({ preventScroll: true }); heading.scrollIntoView({ block: 'start', behavior: 'instant' }); }
  };
  $$('[data-model]').forEach(button => button.addEventListener('click', () => {
    const model = config.models.find(m => m.id === button.dataset.model);
    Object.assign(state, model ? { model: model.id, kind: model.kind, threads: String(model.threads) } : { model: 'help', kind: 'confirmar', threads: 'confirmar' });
    fill(); update();
  }));
  $('[data-edit-model]')?.addEventListener('click', () => { read(); show(0); });
  $$('[data-color]').forEach(button => button.addEventListener('click', () => {
    const color = button.dataset.color;
    if (state.colors.includes(color)) state.colors = state.colors.filter(c => c !== color);
    else if (state.colors.length < 4) state.colors.push(color);
    else { $('#selected-colors').textContent = 'Você já escolheu quatro cores. Remova uma para selecionar outra.'; return; }
    fill(); update();
  }));
  $$('[data-entity]').forEach(button => button.addEventListener('click', () => { state.entity = button.dataset.entity; fill(); update(); }));
  form.addEventListener('input', event => { read(); if (event.target.hasAttribute('aria-invalid')) { event.target.removeAttribute('aria-invalid'); error.hidden = true; } update(); });
  form.addEventListener('change', () => { read(); update(); });
  form.addEventListener('submit', e => {
    e.preventDefault(); read(); if (!validate()) return;
    if (current < 2) { if (current === 0 && !state.started) { track('configurator_start'); state.started = true; } show(current + 1); }
    else { const url = `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(message())}`; track('whatsapp_click'); window.open(url, '_blank', 'noopener,noreferrer'); }
  });
  $('#config-back').addEventListener('click', () => { read(); error.hidden = true; show(Math.max(0, current - 1)); });
  $$('[data-step]').forEach(button => button.addEventListener('click', () => { read(); const target = Number(button.dataset.step); if (target <= furthest && (target < current || validate())) { read(); error.hidden = true; show(target); } }));
  $('#copy-summary').addEventListener('click', async () => {
    read(); if (!validate()) return;
    try { await navigator.clipboard.writeText(message()); $('#copy-status').textContent = 'Resumo copiado. Você pode colar no atendimento.'; }
    catch { $('#copy-status').textContent = 'Não foi possível copiar automaticamente. Selecione e copie os dados do resumo ou use o botão do WhatsApp.'; }
  });
  $('#reset-config').addEventListener('click', () => {
    state = { ...defaults, colors: [], extras: [], requestId: `OF-${Date.now().toString(36).toUpperCase()}` };
    furthest = 0; $$('details', form).forEach(details => details.open = false);
    fill(); error.hidden = true; $('#copy-status').textContent = ''; show(0); track('configurator_reset');
  });
  fill(); show(current, false);
})();
