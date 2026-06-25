(() => {
  'use strict';

  const deck = document.getElementById('deck');
  const slides = Array.from(document.querySelectorAll('.slide'));
  const dotsWrap = document.getElementById('dots');
  const progressBar = document.getElementById('progressBar');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined';

  if (!hasGSAP) document.body.classList.add('no-gsap');

  /* ---------- Точки-навигация ---------- */
  slides.forEach((s, i) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', (s.dataset.title || ('Слайд ' + (i + 1))));
    b.title = s.dataset.title || '';
    b.addEventListener('click', () => s.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }));
    dotsWrap.appendChild(b);
  });
  const dots = Array.from(dotsWrap.children);

  /* ---------- Активный слайд: прогресс, точки, reveal ---------- */
  const seen = new WeakSet();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const idx = slides.indexOf(e.target);
      if (e.isIntersecting && e.intersectionRatio > 0.55) {
        dots.forEach((d, i) => d.classList.toggle('active', i === idx));
        progressBar.style.width = ((idx + 1) / slides.length * 100) + '%';
        if (!seen.has(e.target)) { seen.add(e.target); revealSlide(e.target); }
      }
    });
  }, { root: deck, threshold: [0, 0.55, 1] });
  slides.forEach((s) => io.observe(s));

  /* ---------- Reveal входа ---------- */
  function revealSlide(slide) {
    const items = Array.from(slide.querySelectorAll('.reveal'));
    if (!hasGSAP || reduceMotion) {
      items.forEach((el) => { el.style.opacity = 1; el.style.transform = 'none'; });
      runCounters(slide);
      return;
    }
    items.sort((a, b) => (+a.dataset.d || 0) - (+b.dataset.d || 0));
    items.forEach((el) => {
      const delay = (+el.dataset.d || 0) * 0.08;
      gsap.to(el, { opacity: 1, y: 0, duration: 0.7, delay, ease: 'power3.out' });
    });
    runCounters(slide);
  }

  /* ---------- Hero: сборка заголовка по буквам ---------- */
  const heroTitle = document.getElementById('heroTitle');
  if (heroTitle && hasGSAP && !reduceMotion) {
    const text = heroTitle.textContent;
    heroTitle.textContent = '';
    [...text].forEach((ch) => {
      const span = document.createElement('span');
      span.textContent = ch === ' ' ? ' ' : ch;
      span.style.display = 'inline-block';
      span.style.opacity = 0;
      heroTitle.appendChild(span);
    });
    gsap.fromTo(heroTitle.children,
      { y: 34, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.045, delay: 0.25, ease: 'power3.out' });
  }

  /* ---------- Count-up цифр (кейс 02) ---------- */
  function runCounters(slide) {
    slide.querySelectorAll('.count').forEach((el) => {
      if (el.dataset.done) return;
      el.dataset.done = '1';
      const to = parseFloat(el.dataset.to);
      const dec = parseInt(el.dataset.dec || '0', 10);
      if (!hasGSAP || reduceMotion) { el.textContent = format(to, dec); return; }
      const obj = { v: 0 };
      gsap.to(obj, {
        v: to, duration: 1.6, delay: 0.4, ease: 'power2.out',
        onUpdate: () => { el.textContent = format(obj.v, dec); }
      });
    });
  }
  function format(v, dec) {
    return v.toFixed(dec).replace('.', ',');
  }

  /* ---------- Parallax фото при скролле ---------- */
  if (hasGSAP && window.ScrollTrigger && !reduceMotion) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.defaults({ scroller: deck });

    document.querySelectorAll('.parallax-photo').forEach((ph) => {
      gsap.fromTo(ph, { yPercent: -8 }, {
        yPercent: 8, ease: 'none',
        scrollTrigger: { trigger: ph.closest('.slide'), start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
    // Ken Burns на титуле
    const heroBg = document.querySelector('.slide--hero .hero__bg');
    if (heroBg) gsap.fromTo(heroBg, { scale: 1.12 }, { scale: 1.0, duration: 6, ease: 'power1.out' });

    // лёгкий параллакс фоновых фото
    document.querySelectorAll('.slide--photo .hero__bg').forEach((bg) => {
      gsap.fromTo(bg, { yPercent: -6 }, {
        yPercent: 6, ease: 'none',
        scrollTrigger: { trigger: bg.closest('.slide'), start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  }

  /* ---------- Навигация клавишами ---------- */
  let current = 0;
  function go(dir) {
    current = Math.max(0, Math.min(slides.length - 1, current + dir));
    slides[current].scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  }
  // отслеживаем текущий по центру вьюпорта
  deck.addEventListener('scroll', () => {
    const mid = deck.scrollTop + deck.clientHeight / 2;
    current = Math.round(deck.scrollTop / deck.clientHeight);
  }, { passive: true });

  document.addEventListener('keydown', (e) => {
    if (['ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); go(1); }
    else if (['ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); go(-1); }
    else if (e.key === 'Home') { e.preventDefault(); slides[0].scrollIntoView({ behavior: 'smooth' }); }
    else if (e.key === 'End') { e.preventDefault(); slides[slides.length - 1].scrollIntoView({ behavior: 'smooth' }); }
  });

  // первый слайд сразу
  if (slides[0]) { seen.add(slides[0]); revealSlide(slides[0]); dots[0].classList.add('active'); progressBar.style.width = (100 / slides.length) + '%'; }
})();
