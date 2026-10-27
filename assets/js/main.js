/* LP Empresas · Rei das Barras de Apoio */
(function () {
  'use strict';

  var WHATSAPP = '5511997749088'; // mesmo número oficial usado na loja
  var STORE = 'https://www.reidasbarrasdeapoio.com.br';
  var PRODUCT_URL = STORE + '/produtos/barra-reta-tradicional-inox/'; // produto 81819548
  var MAX_FILES = 5;
  var MAX_BYTES = 10 * 1024 * 1024;
  var STORAGE_KEY = 'rdb-cotacao-v1';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  var params = new URLSearchParams(location.search);

  window.__lpReady = true;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function digits(v) { return (v || '').replace(/\D/g, ''); }

  /* ---------- Analytics ----------
     Nenhum script de analytics é carregado aqui. Os eventos vão para o dataLayer (GTM, se for instalado)
     e para gtag/fbq apenas se já existirem na página. Nomes de evento padrão do GA4 e da Meta. */
  function track(event, data, metaEvent) {
    data = data || {};
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: event }, data));
    if (typeof window.gtag === 'function') window.gtag('event', event, data);
    if (metaEvent && typeof window.fbq === 'function') window.fbq('track', metaEvent);
  }
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-track]');
    if (!el) return;
    var isWhats = el.getAttribute('data-channel') === 'whatsapp';
    track('select_content', { content_type: isWhats ? 'whatsapp' : 'cta', content_id: el.getAttribute('data-track'), link_url: el.href || '' },
      isWhats ? 'Contact' : null);
  });

  /* ---------- Aviso rápido ---------- */
  var toastEl = $('[data-toast]');
  var toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2200);
  }

  /* ---------- Minha cotação (estado único da página) ---------- */
  var quote = { items: [] };
  try { quote.items = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]').filter(function (i) { return i && i.name; }); } catch (e) { quote.items = []; }

  function findItem(name) { for (var i = 0; i < quote.items.length; i++) if (quote.items[i].name === name) return quote.items[i]; return null; }
  function saveQuote() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(quote.items)); } catch (e) { /* modo privado: segue sem salvar */ } }

  function addItem(name, qty, sourceEl) {
    var item = findItem(name);
    if (item) item.qty += qty || 1;
    else quote.items.push({ name: name, qty: qty || 1 });
    saveQuote(); renderQuote(true);
    if (sourceEl) flyToCart(sourceEl);
    toast('Adicionado à sua cotação');
    track('select_content', { content_type: 'quote_item', content_id: name });
  }
  function removeItem(name) {
    quote.items = quote.items.filter(function (i) { return i.name !== name; });
    saveQuote(); renderQuote(false);
    toast('Removido da cotação');
  }
  function setQty(name, qty) {
    var item = findItem(name);
    if (!item) return;
    if (qty < 1) { removeItem(name); return; }
    item.qty = Math.min(qty, 9999);
    saveQuote(); renderQuote(false);
  }
  function toggleItem(name, sourceEl) { if (findItem(name)) removeItem(name); else addItem(name, 1, sourceEl); }

  function itemRow(item) {
    var li = document.createElement('li');
    li.className = 'quote-item';
    li.innerHTML =
      '<span class="quote-item-name"></span>' +
      '<span class="stepper" role="group">' +
        '<button type="button" data-qty="-1"><svg class="icon" aria-hidden="true"><use href="#i-minus"/></svg></button>' +
        '<output></output>' +
        '<button type="button" data-qty="1"><svg class="icon" aria-hidden="true"><use href="#i-plus"/></svg></button>' +
      '</span>' +
      '<button class="remove-btn" type="button" data-remove><svg class="icon" aria-hidden="true"><use href="#i-trash"/></svg></button>';
    li.querySelector('.quote-item-name').textContent = item.name;
    li.querySelector('output').textContent = item.qty;
    li.querySelector('.stepper').setAttribute('aria-label', 'Quantidade aproximada de ' + item.name);
    li.querySelector('[data-qty="-1"]').setAttribute('aria-label', 'Diminuir quantidade de ' + item.name);
    li.querySelector('[data-qty="1"]').setAttribute('aria-label', 'Aumentar quantidade de ' + item.name);
    li.querySelector('[data-remove]').setAttribute('aria-label', 'Remover ' + item.name);
    li.setAttribute('data-name', item.name);
    return li;
  }

  function renderQuote(bump) {
    var n = quote.items.length;
    $$('[data-quote-items]').forEach(function (list) {
      list.innerHTML = '';
      quote.items.forEach(function (item) { list.appendChild(itemRow(item)); });
    });
    $$('[data-quote-empty]').forEach(function (el) { el.hidden = n > 0; });
    $$('[data-quote-toggle]').forEach(function (t) { t.setAttribute('aria-pressed', findItem(t.getAttribute('data-quote-toggle')) ? 'true' : 'false'); });
    $$('[data-cart-count]').forEach(function (b) {
      b.textContent = n;
      b.setAttribute('aria-label', n === 1 ? '1 item' : n + ' itens');
      if (bump && !reduceMotion) { b.classList.remove('is-bump'); void b.offsetWidth; b.classList.add('is-bump'); }
    });
    if (n) clearError(document.getElementById('f-produtos'));
    if (typeof updateFloating === 'function') updateFloating();
  }

  // Botões de quantidade e remover (lista do formulário e da gaveta)
  document.addEventListener('click', function (e) {
    var qtyBtn = e.target.closest('[data-qty]');
    var rmBtn = e.target.closest('[data-remove]');
    var row = e.target.closest('.quote-item');
    if (!row) return;
    var name = row.getAttribute('data-name');
    var list = row.parentNode;
    var index = Array.prototype.indexOf.call(list.children, row);
    if (qtyBtn) {
      var item = findItem(name);
      setQty(name, item.qty + Number(qtyBtn.getAttribute('data-qty')));
      // mantém o foco no mesmo botão depois de redesenhar a lista
      var again = list.children[index] && list.children[index].querySelector('[data-qty="' + qtyBtn.getAttribute('data-qty') + '"]');
      if (again) again.focus();
    } else if (rmBtn) {
      removeItem(name);
      var next = list.children[index] || list.children[index - 1];
      (next ? next.querySelector('[data-remove]') : list.closest('dialog, fieldset').querySelector('button, a')).focus();
    }
  });

  // Qualquer elemento com data-quote-toggle liga/desliga o item
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-quote-toggle]');
    if (!t) return;
    toggleItem(t.getAttribute('data-quote-toggle'), t);
  });

  // Bolinha que voa até o botão da cotação
  function flyToCart(fromEl) {
    if (reduceMotion || !fromEl.getBoundingClientRect) return;
    var fabEl = $('.cart-fab');
    var target = getComputedStyle(fabEl).display !== 'none' ? fabEl : $('.dock-cart');
    if (!target) return;
    var a = fromEl.getBoundingClientRect(), b = target.getBoundingClientRect();
    var dot = document.createElement('span');
    dot.className = 'fly-dot';
    dot.style.left = a.left + a.width / 2 + 'px';
    dot.style.top = a.top + a.height / 2 + 'px';
    document.body.appendChild(dot);
    var dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    var anim = dot.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: 'translate(' + dx * 0.5 + 'px,' + (dy * 0.5 - 120) + 'px) scale(1.2)', opacity: 1, offset: 0.5 },
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(0.5)', opacity: 0.2 }
    ], { duration: 750, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
    anim.onfinish = function () { dot.remove(); };
  }

  /* ---------- Gaveta "Minha cotação" ---------- */
  var drawer = document.getElementById('cart-drawer');
  function openDrawer() {
    if (typeof drawer.showModal !== 'function') { location.hash = '#cotacao'; return; }
    drawer.showModal();
    track('select_content', { content_type: 'cta', content_id: 'abrir_minha_cotacao' });
  }
  function closeDrawer(cb) {
    if (!drawer.open) { if (cb) cb(); return; }
    if (reduceMotion) { drawer.close(); if (cb) cb(); return; }
    drawer.classList.add('is-closing');
    setTimeout(function () { drawer.classList.remove('is-closing'); drawer.close(); if (cb) cb(); }, 260);
  }
  $$('[data-cart-open]').forEach(function (b) { b.addEventListener('click', openDrawer); });
  drawer.addEventListener('click', function (e) {
    if (e.target === drawer) { closeDrawer(); return; } // clique no fundo escuro
    var c = e.target.closest('[data-cart-close]');
    if (!c) return;
    var href = c.getAttribute('href');
    e.preventDefault();
    closeDrawer(function () {
      if (href && href.charAt(0) === '#') {
        var target = document.querySelector(href);
        if (target) target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
        if (href === '#cotacao') setTimeout(focusFirstEmpty, reduceMotion ? 0 : 500);
      }
    });
  });
  drawer.addEventListener('cancel', function (e) { e.preventDefault(); closeDrawer(); });

  /* ---------- Cabeçalho, barra de progresso e botões flutuantes ---------- */
  var header = $('.site-header');
  var progress = $('.scroll-progress');
  var fab = $('.cart-fab');
  var dock = $('[data-mobile-dock]');
  var heroOut = false, quoteIn = false;
  function updateFloating() {
    var show = heroOut || quote.items.length > 0;
    fab.classList.toggle('is-visible', show);
    dock.classList.toggle('is-visible', show && !quoteIn);
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { heroOut = !en[0].isIntersecting; updateFloating(); }, { rootMargin: '-40% 0px 0px 0px' })
      .observe($('.hero'));
    new IntersectionObserver(function (en) { quoteIn = en[0].isIntersecting; updateFloating(); })
      .observe($('#form-cotacao'));
  } else { heroOut = true; updateFloating(); }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var max = document.documentElement.scrollHeight - innerHeight;
      progress.style.setProperty('--p', max > 0 ? (scrollY / max).toFixed(4) : 0);
      header.classList.toggle('is-scrolled', scrollY > 40);
      updateTimeline();
      updateSpin();
    });
  }
  addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Entradas ao rolar ---------- */
  var reveals = $$('.reveal');
  $$('main > section, main > div, .site-footer').forEach(function (section) {
    $$('.reveal', section).forEach(function (el, i) { el.style.setProperty('--d', Math.min(i * 70, 420) + 'ms'); });
  });
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Hero: troca de fotos e profundidade com o mouse ---------- */
  var slides = $$('[data-crossfade] img');
  if (slides.length > 1 && !reduceMotion) {
    var cur = 0, timer = null;
    var next = function () { slides[cur].classList.remove('is-active'); cur = (cur + 1) % slides.length; slides[cur].classList.add('is-active'); };
    var start = function () { if (!timer) timer = setInterval(next, 6000); };
    var stop = function () { clearInterval(timer); timer = null; };
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    start();
  }
  var visual = $('[data-parallax-root]');
  $$('[data-depth]').forEach(function (el) { el.style.setProperty('--depth', el.getAttribute('data-depth')); });
  if (visual && finePointer && !reduceMotion) {
    $('.hero').addEventListener('pointermove', function (e) {
      var r = visual.getBoundingClientRect();
      visual.style.setProperty('--mx', clamp((e.clientX - (r.left + r.width / 2)) / r.width, -1, 1).toFixed(3));
      visual.style.setProperty('--my', clamp((e.clientY - (r.top + r.height / 2)) / r.height, -1, 1).toFixed(3));
    });
    $('.hero').addEventListener('pointerleave', function () { visual.style.setProperty('--mx', 0); visual.style.setProperty('--my', 0); });
  }

  /* ---------- Seletor de tamanho da barra (medidas da ficha técnica: total = tamanho + 7 cm) ---------- */
  var sizer = $('[data-sizer]');
  var sizeRadios = $$('input[name="tamanho"]', sizer);
  var track_ = $('[data-track-el]', sizer);
  var tube = $('[data-tube]', sizer);
  var bar3d = $('.bar3d', sizer);
  var dim = $('[data-dim]', sizer);
  var sizeLink = $('[data-size-link]');
  var addSizeBtn = $('[data-add-size]');
  var shownSize = 40, shownTotal = 47;

  function countTo(el, from, to) {
    if (reduceMotion || from === to) { el.textContent = to; return; }
    var t0 = performance.now(), dur = 450;
    (function step(t) {
      var k = clamp((t - t0) / dur, 0, 1), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(from + (to - from) * e);
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }
  function currentSize() {
    var r = sizeRadios.filter(function (x) { return x.checked; })[0] || sizeRadios[1];
    return { size: Number(r.value), variant: r.getAttribute('data-variant') };
  }
  function layoutBar() {
    var s = currentSize();
    var total = s.size + 7;
    var W = track_.clientWidth;
    var fl = Math.round(clamp(W * 0.085, 26, 56));
    var L = total / 160 * W;
    bar3d.style.height = fl + 'px';
    $$('.flange', bar3d).forEach(function (f) { f.style.width = f.style.height = fl + 'px'; });
    tube.style.left = fl * 0.4 + 'px';
    tube.style.top = fl * 0.3 + 'px';
    tube.style.height = fl * 0.4 + 'px';
    tube.style.setProperty('--bar-k', ((L - fl * 0.8) / W).toFixed(4));
    bar3d.style.setProperty('--bar-px', (L - fl) + 'px');
    dim.style.left = '0px';
    dim.style.setProperty('--dim-px', L + 'px');
    return s;
  }
  function updateSize(fromUser) {
    var s = layoutBar();
    var total = s.size + 7;
    countTo($('[data-size-num]', sizer), shownSize, s.size);
    countTo($('[data-total-num]', sizer), shownTotal, total);
    $('[data-dim-label]', sizer).textContent = total + ' cm';
    shownSize = s.size; shownTotal = total;
    sizeLink.href = PRODUCT_URL + '?variant=' + s.variant;
    sizeLink.setAttribute('data-variant-id', s.variant);
    $('[data-add-size-label]').textContent = 'Adicionar ' + s.size + ' cm à cotação';
    if (fromUser) track('select_content', { content_type: 'tamanho_barra', content_id: s.size + 'cm' });
  }
  sizeRadios.forEach(function (r) { r.addEventListener('change', function () { updateSize(true); }); });
  addSizeBtn.addEventListener('click', function () { addItem('Barra reta inox 304 – ' + currentSize().size + ' cm', 1, addSizeBtn); });
  if ('ResizeObserver' in window) new ResizeObserver(function () { layoutBar(); }).observe(track_);
  else addEventListener('resize', layoutBar);
  updateSize(false);

  var sizerPhoto = $('.sizer-photo');
  function updateSpin() {
    if (reduceMotion || !sizerPhoto) return;
    var r = sizer.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    sizerPhoto.style.setProperty('--spin', ((innerHeight / 2 - (r.top + r.height / 2)) * 0.04).toFixed(2));
  }

  /* ---------- Carrossel de categorias ---------- */
  var cards = $('[data-carousel]');
  var prevBtn = $('[data-carousel-prev]'), nextBtn = $('[data-carousel-next]');
  function cardStep() { var c = cards.querySelector('.card'); return c ? c.getBoundingClientRect().width + 20 : 320; }
  function updateArrows() {
    prevBtn.disabled = cards.scrollLeft < 8;
    nextBtn.disabled = cards.scrollLeft + cards.clientWidth > cards.scrollWidth - 8;
  }
  prevBtn.addEventListener('click', function () { cards.scrollBy({ left: -cardStep(), behavior: reduceMotion ? 'auto' : 'smooth' }); });
  nextBtn.addEventListener('click', function () { cards.scrollBy({ left: cardStep(), behavior: reduceMotion ? 'auto' : 'smooth' }); });
  cards.addEventListener('scroll', updateArrows, { passive: true });
  addEventListener('resize', updateArrows);
  updateArrows();
  // Arrastar com o mouse (no toque, a rolagem nativa já funciona)
  (function () {
    var down = false, moved = false, startX = 0, startLeft = 0;
    cards.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = false; startX = e.clientX; startLeft = cards.scrollLeft;
    });
    addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 6) { moved = true; cards.classList.add('is-dragging'); }
      if (moved) cards.scrollLeft = startLeft - dx;
    });
    addEventListener('pointerup', function () {
      if (!down) return;
      down = false;
      if (moved) setTimeout(function () { cards.classList.remove('is-dragging'); }, 0);
    });
  })();

  /* ---------- Assistente de cotação ---------- */
  var CATS = {
    'Barras de apoio': 'Retas, em L, em U e para pé, em inox e alumínio',
    'Torneiras acessíveis': 'Modelos PCD altos, baixos, de parede e automáticos',
    'Alarmes audiovisuais': 'Acionador de emergência com sinal sonoro e luminoso',
    'Placas e sinalização': 'Identificação de banheiros e portas',
    'Piso tátil': 'Alerta e direcional para circulação'
  };
  var SUGGEST = {
    banheiro: ['Barras de apoio', 'Torneiras acessíveis', 'Alarmes audiovisuais', 'Placas e sinalização'],
    lavatorio: ['Torneiras acessíveis', 'Barras de apoio'],
    portas: ['Placas e sinalização'],
    circulacao: ['Piso tátil']
  };
  var ORIENTACAO = 'Ainda não sei, preciso de orientação';
  var quiz = $('[data-quiz]');
  var quizSteps = $$('[data-step]', quiz);
  var quizBar = $('[data-quiz-bar]');
  var quizLabel = $('[data-quiz-label]');
  var quizStep = 1;

  function showStep(n, focus) {
    quizStep = n;
    quizSteps.forEach(function (s) {
      var on = Number(s.getAttribute('data-step')) === n;
      s.hidden = !on;
      s.classList.toggle('is-current', on);
    });
    quizBar.style.setProperty('--q', Math.min(n, 3) / 3);
    quizLabel.textContent = n > 3 ? 'Sugestão pronta' : 'Passo ' + n + ' de 3';
    if (focus) {
      var cur = quizSteps[n - 1];
      var target = n > 3 ? cur : cur.querySelector('input');
      if (target) target.focus({ preventScroll: true });
    }
  }
  function quizValues(name) { return $$('input[name="' + name + '"]:checked', quiz).map(function (i) { return i.value; }); }
  function buildSuggestion() {
    var picked = [];
    quizValues('q-ambiente').forEach(function (a) { (SUGGEST[a] || []).forEach(function (c) { if (picked.indexOf(c) < 0) picked.push(c); }); });
    var box = $('[data-quiz-suggest]', quiz);
    box.innerHTML = '';
    picked.forEach(function (c) {
      var row = document.createElement('label');
      row.className = 'suggest-row';
      row.innerHTML = '<input type="checkbox" checked><span><span></span><small></small></span>';
      row.querySelector('input').value = c;
      row.querySelector('span > span').textContent = c;
      row.querySelector('small').textContent = CATS[c];
      box.appendChild(row);
    });
    if (quizValues('q-saber')[0] === 'orientacao') {
      var row = document.createElement('label');
      row.className = 'suggest-row';
      row.innerHTML = '<input type="checkbox" checked><span>Orientação da equipe<small>Envie fotos e medidas para a especificação dos itens</small></span>';
      row.querySelector('input').value = ORIENTACAO;
      box.appendChild(row);
    }
  }
  quiz.addEventListener('click', function (e) {
    if (e.target.closest('[data-quiz-next]')) {
      var stepEl = quizSteps[quizStep - 1];
      var name = quizStep === 1 ? 'q-ambiente' : quizStep === 2 ? 'q-saber' : 'q-qtd';
      var err = $('[data-quiz-error]', stepEl);
      if (!quizValues(name).length) { err.textContent = quizStep === 1 ? 'Escolha ao menos um ambiente.' : 'Escolha uma opção.'; return; }
      err.textContent = '';
      if (quizStep === 3) { buildSuggestion(); $('[data-quiz-done]', quiz).hidden = true; }
      showStep(quizStep + 1, true);
      track('select_content', { content_type: 'quiz', content_id: 'passo_' + quizStep });
    } else if (e.target.closest('[data-quiz-back]')) {
      showStep(quizStep - 1, true);
    } else if (e.target.closest('[data-quiz-restart]')) {
      $$('input', quiz).forEach(function (i) { i.checked = false; });
      showStep(1, true);
    } else if (e.target.closest('[data-quiz-apply]')) {
      var applyBtn = e.target.closest('[data-quiz-apply]');
      var chosen = $$('[data-quiz-suggest] input:checked', quiz).map(function (i) { return i.value; });
      chosen.forEach(function (c) { if (!findItem(c)) quote.items.push({ name: c, qty: 1 }); });
      saveQuote(); renderQuote(true);
      if (chosen.length) flyToCart(applyBtn);
      var qtd = quizValues('q-qtd')[0];
      var qField = document.getElementById('f-quantidade');
      if (qtd && !qField.value) qField.value = 'Ambientes: ' + qtd;
      $('[data-quiz-done]', quiz).hidden = false;
      toast(chosen.length ? 'Itens adicionados à sua cotação' : 'Nenhum item marcado');
      track('select_content', { content_type: 'quiz', content_id: 'aplicar', items: chosen.length });
    }
  });
  // Avança sozinho nas perguntas de escolha única
  quiz.addEventListener('change', function (e) {
    if (e.target.type === 'radio' && quizStep < 3) setTimeout(function () { $('[data-quiz-next]', quizSteps[quizStep - 1]).click(); }, reduceMotion ? 0 : 260);
    var err = $('[data-quiz-error]', quizSteps[quizStep - 1]);
    if (err) err.textContent = '';
  });
  showStep(1, false);

  /* ---------- Ambientes com pontos clicáveis ---------- */
  var HOTSPOTS = {
    barra: { name: 'Barra reta inox 304 – tamanho a definir', href: PRODUCT_URL },
    torneira: { name: 'Torneiras acessíveis', href: STORE + '/torneiras/' },
    placa: { name: 'Placas e sinalização', href: STORE + '/placas/' },
    piso: { name: 'Piso tátil', href: STORE + '/piso-tatil/' }
  };
  var scenes = $('[data-scenes]');
  var tabs = $$('[role="tab"]', scenes);
  var stage = $('.scene-stage', scenes);
  var card = $('[data-hotspot-card]', scenes);
  var openSpot = null;

  function selectTab(tab, focus) {
    closeCard(false);
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(t.getAttribute('aria-controls'));
      panel.hidden = !on;
      panel.classList.toggle('is-active', on);
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { selectTab(t, false); track('select_content', { content_type: 'ambiente', content_id: t.id }); });
    t.addEventListener('keydown', function (e) {
      var k = e.key, j = null;
      if (k === 'ArrowRight') j = (i + 1) % tabs.length;
      else if (k === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
      else if (k === 'Home') j = 0;
      else if (k === 'End') j = tabs.length - 1;
      if (j === null) return;
      e.preventDefault();
      selectTab(tabs[j], true);
    });
  });

  function openCard(spot) {
    if (openSpot === spot) { closeCard(true); return; }
    closeCard(false);
    openSpot = spot;
    var info = HOTSPOTS[spot.getAttribute('data-hotspot')];
    $('[data-hs-title]', card).textContent = spot.getAttribute('data-title');
    $('[data-hs-text]', card).textContent = spot.getAttribute('data-text');
    var add = $('[data-hs-add]', card);
    add.setAttribute('data-quote-toggle', info.name);
    add.setAttribute('aria-pressed', findItem(info.name) ? 'true' : 'false');
    $('[data-hs-link]', card).href = info.href;
    spot.setAttribute('aria-expanded', 'true');
    card.hidden = false;
    // posiciona o cartão perto do ponto, sem sair da foto
    var sr = stage.getBoundingClientRect(), pr = spot.getBoundingClientRect();
    var hx = pr.left + pr.width / 2 - sr.left, hy = pr.top + pr.height / 2 - sr.top;
    var cw = card.offsetWidth, ch = card.offsetHeight;
    var left = clamp(hx - cw / 2, 12, sr.width - cw - 12);
    var top = hy < sr.height * 0.55 ? hy + 34 : hy - ch - 34;
    top = clamp(top, 12, sr.height - ch - 12);
    card.style.setProperty('--cx', left + 'px');
    card.style.setProperty('--cy', top + 'px');
    card.style.setProperty('--ox', (hx - left) + 'px');
    card.style.setProperty('--oy', (hy - top) + 'px');
    card.style.animation = 'none'; void card.offsetWidth; card.style.animation = '';
    $('[data-hs-close]', card).focus({ preventScroll: true });
    track('select_content', { content_type: 'hotspot', content_id: spot.getAttribute('data-title') });
  }
  function closeCard(returnFocus) {
    if (!openSpot) return;
    var spot = openSpot;
    openSpot = null;
    card.hidden = true;
    spot.setAttribute('aria-expanded', 'false');
    if (returnFocus) spot.focus({ preventScroll: true });
  }
  $$('.hotspot', scenes).forEach(function (s) { s.addEventListener('click', function () { openCard(s); }); });
  $('[data-hotspot-close]', card).addEventListener('click', function () { closeCard(true); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && openSpot) closeCard(true); });
  document.addEventListener('click', function (e) {
    if (openSpot && !card.contains(e.target) && !e.target.closest('.hotspot')) closeCard(false);
  });
  // os pontos pulsam duas vezes quando a cena aparece na tela
  if ('IntersectionObserver' in window) {
    var stageIo = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return;
      stage.classList.add('is-seen');
      stageIo.disconnect();
    }, { threshold: 0.4 });
    stageIo.observe(stage);
  }

  /* ---------- Linha do tempo: a barra se enche ao rolar ---------- */
  var timeline = $('[data-timeline]');
  var tlSteps = $$('.timeline-steps li', timeline);
  var tlFill = $('[data-tl-fill]', timeline);
  function updateTimeline() {
    var r = timeline.getBoundingClientRect();
    if (r.bottom < -200 || r.top > innerHeight + 200) return;
    var p = reduceMotion ? 1 : clamp((innerHeight * 0.8 - r.top) / (r.height + innerHeight * 0.2), 0, 1);
    tlFill.style.setProperty('--tl', p.toFixed(3));
    tlSteps.forEach(function (li, i) { li.classList.toggle('is-lit', p >= (i + 0.5) / tlSteps.length - 0.05); });
  }
  updateTimeline();

  /* ---------- CEP (ViaCEP) ---------- */
  function cepMask(input) {
    input.addEventListener('input', function () {
      var d = digits(input.value).slice(0, 8);
      input.value = d.length > 5 ? d.slice(0, 5) + '-' + d.slice(5) : d;
    });
  }
  function lookupCep(cep) {
    return fetch('https://viacep.com.br/ws/' + cep + '/json/')
      .then(function (r) { if (!r.ok) throw new Error('http'); return r.json(); })
      .then(function (j) { if (j.erro) throw new Error('nao-encontrado'); return j; });
  }
  var cepForm = $('[data-cep-form]');
  var cepInput = document.getElementById('cep-check');
  var cepResult = $('[data-cep-result]');
  cepMask(cepInput);
  cepForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var cepDigits = digits(cepInput.value);
    cepResult.className = 'cep-result';
    if (cepDigits.length !== 8) { cepResult.classList.add('is-error'); cepResult.textContent = 'Digite um CEP com 8 números.'; cepInput.focus(); return; }
    cepResult.classList.add('is-loading');
    cepResult.textContent = 'Consultando…';
    lookupCep(cepDigits).then(function (j) {
      var capital = j.localidade === 'São Paulo' && j.uf === 'SP';
      cepResult.className = 'cep-result';
      cepResult.innerHTML = '<p class="cep-city"><svg class="icon" aria-hidden="true"><use href="#i-pin"/></svg><span></span></p><p data-msg></p><p data-msg2></p>' +
        '<button class="btn btn-primary btn-small cep-use" type="button">Usar este CEP na cotação</button>';
      $('.cep-city span', cepResult).textContent = j.localidade + ' · ' + j.uf;
      $('[data-msg]', cepResult).textContent = capital
        ? 'Em São Paulo, pode haver entrega no mesmo dia, conforme estoque e rota. A equipe confirma na cotação.'
        : 'Para ' + j.localidade + ', o prazo e o frete são confirmados na cotação, conforme o produto e o endereço.';
      var msg2 = $('[data-msg2]', cepResult);
      if (j.uf !== 'SP') msg2.textContent = 'Piso tátil de concreto: o envio para longas distâncias precisa ser validado antes da compra.';
      else msg2.remove();
      $('.cep-use', cepResult).addEventListener('click', function () {
        document.getElementById('f-cep').value = cepInput.value;
        document.getElementById('f-cidade').value = j.localidade + ' - ' + j.uf;
        clearError(document.getElementById('f-cep')); clearError(document.getElementById('f-cidade'));
        document.getElementById('cotacao').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
        toast('CEP adicionado ao formulário');
      });
      track('select_content', { content_type: 'cep', content_id: capital ? 'sp_capital' : j.uf });
    }).catch(function (err) {
      cepResult.className = 'cep-result is-error';
      cepResult.textContent = err.message === 'nao-encontrado'
        ? 'CEP não encontrado. Confira os números.'
        : 'Não foi possível consultar agora. Informe o CEP na cotação e a equipe confirma o prazo.';
    });
  });

  /* Links que levam a um campo específico do formulário */
  $$('[data-focus]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var field = document.getElementById(a.getAttribute('data-focus'));
      if (!field) return;
      e.preventDefault();
      field.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      field.focus({ preventScroll: true });
    });
  });

  /* ---------- Formulário ---------- */
  var form = document.getElementById('form-cotacao');
  var errorsBox = document.getElementById('form-errors');
  var statusEl = $('.form-status', form);
  var submitBtn = $('.btn-submit', form);
  var doneBox = document.getElementById('form-done');
  var fallbackBox = document.getElementById('form-fallback');
  var phone = document.getElementById('f-whatsapp');
  var cep = document.getElementById('f-cep');
  var cidade = document.getElementById('f-cidade');
  var files = document.getElementById('f-anexos');
  var fileList = $('[data-file-list]');
  var dropzone = $('[data-dropzone]');

  form.elements.pagina.value = location.href;
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(function (k) { form.elements[k].value = params.get(k) || ''; });

  function phoneDigits() {
    var d = digits(phone.value);
    if ((d.length === 12 || d.length === 13) && d.indexOf('55') === 0) d = d.slice(2);
    return d;
  }
  phone.addEventListener('input', function () {
    var d = digits(phone.value);
    if (d.length > 11 && d.indexOf('55') === 0) d = d.slice(2);
    d = d.slice(0, 11);
    var out = d;
    if (d.length > 2) out = '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length > 6) out = '(' + d.slice(0, 2) + ') ' + d.slice(2, d.length - 4) + '-' + d.slice(-4);
    phone.value = out;
  });
  cepMask(cep);
  cep.addEventListener('input', function () {
    var d = digits(cep.value);
    if (d.length !== 8 || cidade.value.trim()) return;
    lookupCep(d).then(function (j) {
      if (cidade.value.trim()) return;
      cidade.value = j.localidade + ' - ' + j.uf;
      clearError(cidade);
    }).catch(function () { /* o usuário digita a cidade */ });
  });

  function renderFiles() {
    var list = Array.prototype.slice.call(files.files || []);
    fileList.innerHTML = '';
    list.forEach(function (f) { var li = document.createElement('li'); li.textContent = f.name; fileList.appendChild(li); });
    clearError(files);
  }
  files.addEventListener('change', renderFiles);
  ['dragenter', 'dragover'].forEach(function (ev) { dropzone.addEventListener(ev, function () { dropzone.classList.add('is-over'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { dropzone.addEventListener(ev, function () { dropzone.classList.remove('is-over'); }); });

  function setError(el, msg) {
    var err = document.getElementById(el.id + '-err');
    el.setAttribute('aria-invalid', 'true');
    if (err) err.textContent = msg;
  }
  function clearError(el) {
    if (!el) return;
    var err = document.getElementById(el.id + '-err');
    el.removeAttribute('aria-invalid');
    if (err) err.textContent = '';
  }
  form.addEventListener('input', function (e) { if (e.target.getAttribute('aria-invalid') === 'true') clearError(e.target); });

  function validate() {
    var problems = [];
    var check = function (el, ok, msg) { if (ok) { clearError(el); return; } setError(el, msg); problems.push({ el: el, msg: msg }); };
    var f = form.elements;
    check(document.getElementById('f-produtos'), quote.items.length > 0, 'Adicione ao menos um produto ou "Ainda não sei, preciso de orientação".');
    check(f.nome, f.nome.value.trim().length >= 2, 'Informe seu nome.');
    check(f.empresa, f.empresa.value.trim().length >= 2, 'Informe o nome da empresa.');
    var pd = phoneDigits().length;
    check(phone, pd === 10 || pd === 11, 'Informe o WhatsApp com DDD, por exemplo (11) 99999-9999.');
    check(cep, digits(cep.value).length === 8, 'Informe o CEP com 8 números.');
    check(cidade, cidade.value.trim().length >= 2, 'Informe a cidade de entrega.');
    var list = Array.prototype.slice.call(files.files || []);
    var total = list.reduce(function (s, x) { return s + x.size; }, 0);
    check(files, list.length <= MAX_FILES && total <= MAX_BYTES, 'Envie até ' + MAX_FILES + ' arquivos, com 10 MB no total. Se precisar, mande o restante pelo WhatsApp.');
    return problems;
  }
  function focusFirstEmpty() {
    var order = ['f-nome', 'f-empresa', 'f-whatsapp', 'f-cep', 'f-cidade'];
    for (var i = 0; i < order.length; i++) {
      var el = document.getElementById(order[i]);
      if (!el.value.trim()) { el.focus({ preventScroll: true }); return; }
    }
  }
  function showErrors(problems) {
    var ul = $('ul', errorsBox);
    ul.innerHTML = '';
    problems.forEach(function (p) {
      var li = document.createElement('li'), a = document.createElement('a');
      var target = p.el.tagName === 'FIELDSET' ? p.el.querySelector('button, input') : p.el;
      a.href = '#' + (target.id || p.el.id);
      a.textContent = p.msg;
      a.addEventListener('click', function (e) { e.preventDefault(); target.focus(); });
      li.appendChild(a); ul.appendChild(li);
    });
    errorsBox.hidden = false;
    errorsBox.focus();
  }
  function itemsText(sep) { return quote.items.map(function (i) { return i.name + ' (' + i.qty + ')'; }).join(sep); }
  function whatsappMessage() {
    var f = form.elements;
    var lines = [
      'Olá! Quero solicitar uma cotação para minha empresa.',
      'Nome: ' + f.nome.value.trim(),
      'Empresa: ' + f.empresa.value.trim(),
      'WhatsApp: ' + phone.value.trim(),
      'Cidade/CEP: ' + cidade.value.trim() + ' / ' + cep.value.trim(),
      'Produtos (quantidade aproximada): ' + itemsText(', ')
    ];
    if (f.quantidade.value.trim()) lines.push('Quantidade aproximada: ' + f.quantidade.value.trim());
    if (f.prazo.value) lines.push('Prazo desejado: ' + f.prazo.value);
    if (f.produtos_detalhes.value.trim()) lines.push('Observações: ' + f.produtos_detalhes.value.trim());
    if (f.medidas.value.trim()) lines.push('Medidas/especificações: ' + f.medidas.value.trim());
    if (files.files && files.files.length) lines.push('Vou enviar as fotos/arquivos nesta conversa.');
    return 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(lines.join('\n'));
  }
  // No modo WhatsApp, o clique em "Enviar cotação pelo WhatsApp" é a conversão do formulário.
  $('[data-fallback-link]', fallbackBox).addEventListener('click', function () {
    track('generate_lead', { form_id: 'cotacao-empresas', method: 'whatsapp' }, 'Lead');
  });
  function showFallback(title, text) {
    $('[data-fallback-title]', fallbackBox).textContent = title;
    $('[data-fallback-text]', fallbackBox).textContent = text;
    $('[data-fallback-link]', fallbackBox).href = whatsappMessage();
    fallbackBox.hidden = false;
    fallbackBox.focus();
  }
  function showDone() {
    $('[data-done-name]', doneBox).textContent = form.elements.nome.value.trim().split(' ')[0];
    $('[data-done-phone]', doneBox).textContent = phone.value.trim();
    form.hidden = true;
    doneBox.hidden = false;
    doneBox.focus();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    statusEl.textContent = '';
    fallbackBox.hidden = true;
    var problems = validate();
    if (problems.length) { showErrors(problems); return; }
    errorsBox.hidden = true;

    if (form.elements.site.value) { showDone(); return; } // robô preencheu o campo invisível

    var endpoint = form.getAttribute('action');
    if (!endpoint) {
      showFallback('Finalize pelo WhatsApp', 'O envio automático ainda não está ativo. Sua mensagem já está preenchida com os dados do formulário: é só enviar e anexar as fotos ou a lista na conversa.');
      return;
    }

    submitBtn.setAttribute('aria-busy', 'true');
    submitBtn.textContent = 'Enviando…';
    var ctrl = 'AbortController' in window ? new AbortController() : null;
    var timeout = setTimeout(function () { if (ctrl) ctrl.abort(); }, 25000);
    var data = new FormData(form);
    quote.items.forEach(function (i) { data.append('produtos', i.name); });
    data.append('produtos_lista', itemsText('; ')); // campo único, mais fácil de usar no n8n
    data.append('itens_json', JSON.stringify(quote.items));

    fetch(endpoint, { method: 'POST', body: data, signal: ctrl ? ctrl.signal : undefined })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        track('generate_lead', { form_id: 'cotacao-empresas', method: 'formulario' }, 'Lead');
        showDone();
        quote.items = []; saveQuote(); renderQuote(false);
      })
      .catch(function () {
        showFallback('Não conseguimos enviar agora', 'Seus dados continuam aqui. Envie a cotação pelo WhatsApp com a mensagem já preenchida ou tente novamente em alguns minutos.');
      })
      .then(function () {
        clearTimeout(timeout);
        submitBtn.removeAttribute('aria-busy');
        submitBtn.textContent = 'Solicitar minha cotação';
      });
  });

  renderQuote(false);

  /* ---------- Autoteste rápido (abra a página com ?selftest) ---------- */
  if (params.has('selftest')) {
    phone.value = '+55 (11) 98765-4321';
    console.assert(phoneDigits() === '11987654321', 'telefone com +55');
    phone.value = '(11) 2774-3422';
    console.assert(phoneDigits().length === 10, 'telefone fixo');
    phone.value = '';
    console.assert(validate().length === (quote.items.length ? 5 : 6), 'formulário vazio aponta os campos obrigatórios');
    $$('[aria-invalid]', form).forEach(clearError);
    console.info('selftest ok');
  }
})();
