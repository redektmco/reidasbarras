/* LP Empresas · Rei das Barras de Apoio */
(function () {
  'use strict';

  var WHATSAPP = '5511997749088'; // mesmo número oficial usado na loja
  var MAX_FILES = 5;
  var MAX_BYTES = 10 * 1024 * 1024;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  window.__lpReady = true;

  /* ---------- Analytics ----------
     Nenhum script de analytics é carregado aqui. Os eventos vão para o dataLayer (GTM, se for instalado)
     e para gtag/fbq apenas se já existirem na página. Nomes de evento padrão do GA4 e da Meta. */
  function track(event, params, metaEvent) {
    params = params || {};
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: event }, params));
    if (typeof window.gtag === 'function') window.gtag('event', event, params);
    if (metaEvent && typeof window.fbq === 'function') window.fbq('track', metaEvent);
  }

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-track]');
    if (!el) return;
    var isWhats = el.getAttribute('data-channel') === 'whatsapp';
    track('select_content', {
      content_type: isWhats ? 'whatsapp' : 'cta',
      content_id: el.getAttribute('data-track'),
      link_url: el.href || ''
    }, isWhats ? 'Contact' : null);
  });

  /* ---------- Entradas ao rolar ---------- */
  var reveals = document.querySelectorAll('.reveal');
  document.querySelectorAll('main > section, .site-footer').forEach(function (section) {
    section.querySelectorAll('.reveal').forEach(function (el, i) {
      el.style.setProperty('--d', Math.min(i * 80, 480) + 'ms');
    });
  });
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Foto do hero: troca suave ---------- */
  var slides = document.querySelectorAll('[data-crossfade] img');
  if (slides.length > 1 && !reduceMotion) {
    var current = 0;
    var timer = null;
    var next = function () {
      slides[current].classList.remove('is-active');
      current = (current + 1) % slides.length;
      slides[current].classList.add('is-active');
    };
    var start = function () { if (!timer) timer = setInterval(next, 5600); };
    var stop = function () { clearInterval(timer); timer = null; };
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    start();
  }

  /* ---------- Montar cotação: botões ligados às caixas do formulário ---------- */
  var form = document.getElementById('form-cotacao');
  var productBoxes = form.querySelectorAll('input[name="produtos"]');
  var toggles = document.querySelectorAll('[data-quote-toggle]');
  var countBadge = document.querySelector('[data-quote-count]');

  function boxFor(value) {
    for (var i = 0; i < productBoxes.length; i++) if (productBoxes[i].value === value) return productBoxes[i];
    return null;
  }
  function syncToggles() {
    var n = 0;
    productBoxes.forEach(function (b) { if (b.checked) n++; });
    toggles.forEach(function (t) {
      var box = boxFor(t.getAttribute('data-quote-toggle'));
      t.setAttribute('aria-pressed', box && box.checked ? 'true' : 'false');
    });
    countBadge.hidden = n === 0;
    countBadge.textContent = n;
    countBadge.setAttribute('aria-label', n === 1 ? '1 item selecionado' : n + ' itens selecionados');
  }
  toggles.forEach(function (t) {
    t.addEventListener('click', function () {
      var box = boxFor(t.getAttribute('data-quote-toggle'));
      if (!box) return;
      box.checked = !box.checked;
      syncToggles();
      clearError(document.getElementById('f-produtos'));
      track('select_content', { content_type: 'quote_item', content_id: box.value });
    });
  });
  productBoxes.forEach(function (b) {
    b.addEventListener('change', function () { syncToggles(); clearError(document.getElementById('f-produtos')); });
  });
  syncToggles();

  /* Links que levam a um campo específico do formulário */
  document.querySelectorAll('[data-focus]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var field = document.getElementById(a.getAttribute('data-focus'));
      if (!field) return;
      e.preventDefault();
      field.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      field.focus({ preventScroll: true });
    });
  });

  /* ---------- Barra fixa no celular ---------- */
  var bar = document.querySelector('[data-mobile-bar]');
  if (bar && 'IntersectionObserver' in window) {
    var heroVisible = true, quoteVisible = false;
    var updateBar = function () { bar.classList.toggle('is-visible', !heroVisible && !quoteVisible); };
    bar.hidden = false;
    new IntersectionObserver(function (en) { heroVisible = en[0].isIntersecting; updateBar(); })
      .observe(document.querySelector('.hero-actions'));
    new IntersectionObserver(function (en) { quoteVisible = en[0].isIntersecting; updateBar(); })
      .observe(document.getElementById('cotacao'));
  }

  /* ---------- Formulário ---------- */
  var errorsBox = document.getElementById('form-errors');
  var statusEl = form.querySelector('.form-status');
  var submitBtn = form.querySelector('.btn-submit');
  var doneBox = document.getElementById('form-done');
  var fallbackBox = document.getElementById('form-fallback');
  var phone = document.getElementById('f-whatsapp');
  var cep = document.getElementById('f-cep');
  var files = document.getElementById('f-anexos');

  // Dados de origem para o n8n
  var params = new URLSearchParams(location.search);
  form.elements.pagina.value = location.href;
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(function (k) {
    form.elements[k].value = params.get(k) || '';
  });

  function digits(v) { return (v || '').replace(/\D/g, ''); }
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
  cep.addEventListener('input', function () {
    var d = digits(cep.value).slice(0, 8);
    cep.value = d.length > 5 ? d.slice(0, 5) + '-' + d.slice(5) : d;
  });

  function setError(el, msg) {
    var err = document.getElementById(el.id + '-err');
    el.setAttribute('aria-invalid', 'true');
    if (err) err.textContent = msg;
  }
  function clearError(el) {
    var err = document.getElementById(el.id + '-err');
    el.removeAttribute('aria-invalid');
    if (err) err.textContent = '';
  }
  form.addEventListener('input', function (e) {
    if (e.target.getAttribute('aria-invalid') === 'true') clearError(e.target);
  });

  function validate() {
    var problems = [];
    var check = function (el, ok, msg) {
      if (ok) { clearError(el); return; }
      setError(el, msg);
      problems.push({ el: el, msg: msg });
    };
    var f = form.elements;
    check(f.nome, f.nome.value.trim().length >= 2, 'Informe seu nome.');
    check(f.empresa, f.empresa.value.trim().length >= 2, 'Informe o nome da empresa.');
    var pd = phoneDigits().length;
    check(phone, pd === 10 || pd === 11, 'Informe o WhatsApp com DDD, por exemplo (11) 99999-9999.');
    check(f.cidade, f.cidade.value.trim().length >= 2, 'Informe a cidade de entrega.');
    check(cep, digits(cep.value).length === 8, 'Informe o CEP com 8 números.');
    var anyProduct = Array.prototype.some.call(productBoxes, function (b) { return b.checked; });
    check(document.getElementById('f-produtos'), anyProduct, 'Marque ao menos um produto ou "Ainda não sei".');
    var list = Array.prototype.slice.call(files.files || []);
    var total = list.reduce(function (s, x) { return s + x.size; }, 0);
    check(files, list.length <= MAX_FILES && total <= MAX_BYTES,
      'Envie até ' + MAX_FILES + ' arquivos, com 10 MB no total. Se precisar, mande o restante pelo WhatsApp.');
    return problems;
  }

  function showErrors(problems) {
    var ul = errorsBox.querySelector('ul');
    ul.innerHTML = '';
    problems.forEach(function (p) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      var target = p.el.tagName === 'FIELDSET' ? p.el.querySelector('input') : p.el;
      a.href = '#' + target.id;
      a.textContent = p.msg;
      a.addEventListener('click', function (e) { e.preventDefault(); target.focus(); });
      li.appendChild(a);
      ul.appendChild(li);
    });
    errorsBox.hidden = false;
    errorsBox.focus();
  }

  function chosenProducts() {
    return Array.prototype.filter.call(productBoxes, function (b) { return b.checked; })
      .map(function (b) { return b.value; });
  }

  function whatsappMessage() {
    var f = form.elements;
    var chosen = chosenProducts();
    var lines = [
      'Olá! Quero solicitar uma cotação para minha empresa.',
      'Nome: ' + f.nome.value.trim(),
      'Empresa: ' + f.empresa.value.trim(),
      'WhatsApp: ' + phone.value.trim(),
      'Cidade/CEP: ' + f.cidade.value.trim() + ' / ' + cep.value.trim(),
      'Produtos: ' + chosen.join(', ')
    ];
    if (f.produtos_detalhes.value.trim()) lines.push('Observações: ' + f.produtos_detalhes.value.trim());
    if (f.quantidade.value.trim()) lines.push('Quantidade aproximada: ' + f.quantidade.value.trim());
    if (f.prazo.value) lines.push('Prazo desejado: ' + f.prazo.value);
    if (f.medidas.value.trim()) lines.push('Medidas/especificações: ' + f.medidas.value.trim());
    if (files.files && files.files.length) lines.push('Vou enviar as fotos/arquivos nesta conversa.');
    return 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(lines.join('\n'));
  }

  // No modo WhatsApp, o clique em "Enviar cotação pelo WhatsApp" é a conversão do formulário.
  fallbackBox.querySelector('[data-fallback-link]').addEventListener('click', function () {
    track('generate_lead', { form_id: 'cotacao-empresas', method: 'whatsapp' }, 'Lead');
  });

  function showFallback(title, text) {
    fallbackBox.querySelector('[data-fallback-title]').textContent = title;
    fallbackBox.querySelector('[data-fallback-text]').textContent = text;
    fallbackBox.querySelector('[data-fallback-link]').href = whatsappMessage();
    fallbackBox.hidden = false;
    fallbackBox.focus();
  }

  function showDone() {
    doneBox.querySelector('[data-done-name]').textContent = form.elements.nome.value.trim().split(' ')[0];
    doneBox.querySelector('[data-done-phone]').textContent = phone.value.trim();
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

    // Robôs preenchem o campo invisível: finge sucesso e não envia.
    if (form.elements.site.value) { showDone(); return; }

    var endpoint = form.getAttribute('action');
    if (!endpoint) {
      showFallback('Finalize pelo WhatsApp',
        'O envio automático ainda não está ativo. Sua mensagem já está preenchida com os dados do formulário: é só enviar e anexar as fotos ou a lista na conversa.');
      return;
    }

    submitBtn.setAttribute('aria-busy', 'true');
    submitBtn.textContent = 'Enviando…';
    var ctrl = 'AbortController' in window ? new AbortController() : null;
    var timeout = setTimeout(function () { if (ctrl) ctrl.abort(); }, 25000);

    var data = new FormData(form);
    data.append('produtos_lista', chosenProducts().join(', ')); // campo único, mais fácil de usar no n8n
    fetch(endpoint, { method: 'POST', body: data, signal: ctrl ? ctrl.signal : undefined })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        track('generate_lead', { form_id: 'cotacao-empresas', method: 'formulario' }, 'Lead');
        showDone();
      })
      .catch(function () {
        showFallback('Não conseguimos enviar agora',
          'Seus dados continuam aqui. Envie a cotação pelo WhatsApp com a mensagem já preenchida ou tente novamente em alguns minutos.');
      })
      .then(function () {
        clearTimeout(timeout);
        submitBtn.removeAttribute('aria-busy');
        submitBtn.textContent = 'Solicitar minha cotação';
      });
  });

  /* ---------- Autoteste rápido (abra a página com ?selftest) ---------- */
  if (params.has('selftest')) {
    phone.value = '+55 (11) 98765-4321';
    console.assert(phoneDigits() === '11987654321', 'telefone com +55');
    phone.value = '(11) 2774-3422';
    console.assert(phoneDigits().length === 10, 'telefone fixo');
    phone.value = '';
    console.assert(validate().length === 6, 'formulário vazio aponta 6 campos');
    form.querySelectorAll('[aria-invalid]').forEach(clearError);
    console.info('selftest ok');
  }
})();
