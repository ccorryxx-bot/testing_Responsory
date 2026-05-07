/* ============================================
   NEXUS DIGITAL AGENCY — script.js
   Production-grade JavaScript
   Senior Dev Patterns: Module pattern, Intersection
   Observer, RequestAnimationFrame, Event Delegation
   ============================================ */

'use strict';

/* ============================================
   1. UTILITY FUNCTIONS
   ============================================ */
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const debounce = (fn, delay = 150) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

const throttle = (fn, limit = 50) => {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      fn(...args);
    }
  };
};

const lerp = (a, b, t) => a + (b - a) * t;

const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

const mapRange = (val, inMin, inMax, outMin, outMax) =>
  ((val - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;

/* ============================================
   2. LOADER MODULE
   ============================================ */
const LoaderModule = (() => {
  const loader    = $('#loader');
  const bar       = $('#loaderBar');
  const percent   = $('#loaderPercent');
  let progress    = 0;
  let rafId       = null;

  const setProgress = (value) => {
    progress = clamp(value, 0, 100);
    if (bar)     bar.style.width = progress + '%';
    if (percent) percent.textContent = Math.round(progress) + '%';
  };

  const simulateLoad = () => {
    const steps = [
      { target: 20,  delay: 80  },
      { target: 55,  delay: 120 },
      { target: 80,  delay: 90  },
      { target: 95,  delay: 200 },
      { target: 100, delay: 300 },
    ];

    let stepIndex = 0;
    let current   = 0;

    const tick = () => {
      if (stepIndex >= steps.length) {
        finishLoad();
        return;
      }
      const step = steps[stepIndex];
      current = lerp(current, step.target, 0.08);
      setProgress(current);

      if (Math.abs(current - step.target) < 0.5) {
        current = step.target;
        stepIndex++;
        setTimeout(() => { rafId = requestAnimationFrame(tick); }, step.delay);
      } else {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
  };

  const finishLoad = () => {
    cancelAnimationFrame(rafId);
    setProgress(100);

    setTimeout(() => {
      if (loader) loader.classList.add('hidden');
      document.body.classList.remove('loading');
      document.dispatchEvent(new CustomEvent('nexus:loaded'));
    }, 400);
  };

  const init = () => {
    if (!loader) return;
    document.body.classList.add('loading');
    simulateLoad();
  };

  return { init };
})();

/* ============================================
   3. CUSTOM CURSOR MODULE
   ============================================ */
const CursorModule = (() => {
  const cursor      = $('#cursor');
  const trail       = $('#cursorTrail');
  const isTouchDev  = window.matchMedia('(pointer: coarse)').matches;

  let mouseX = 0, mouseY = 0;
  let trailX = 0, trailY = 0;
  let cursorX = 0, cursorY = 0;
  let rafId   = null;

  const animate = () => {
    trailX  = lerp(trailX,  mouseX, 0.15);
    trailY  = lerp(trailY,  mouseY, 0.15);
    cursorX = lerp(cursorX, mouseX, 0.12);
    cursorY = lerp(cursorY, mouseY, 0.12);

    if (trail) {
      trail.style.transform = `translate(${trailX}px, ${trailY}px) translate(-50%, -50%)`;
    }
    if (cursor) {
      cursor.style.transform = `translate(${cursorX}px, ${cursorY}px) translate(-50%, -50%)`;
    }

    rafId = requestAnimationFrame(animate);
  };

  const onMove = (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  };

  const onHoverStart = () => cursor?.classList.add('cursor--hover');
  const onHoverEnd   = () => cursor?.classList.remove('cursor--hover');
  const onMouseDown  = () => cursor?.classList.add('cursor--click');
  const onMouseUp    = () => cursor?.classList.remove('cursor--click');

  const bindHoverTargets = () => {
    const targets = $$('a, button, .service-card, .work-card, .team-card, .blog-card, .pricing-card, .work__filter, .testimonials__btn, [role="button"]');
    targets.forEach(el => {
      el.addEventListener('mouseenter', onHoverStart, { passive: true });
      el.addEventListener('mouseleave', onHoverEnd,  { passive: true });
    });
  };

  const init = () => {
    if (isTouchDev || !cursor) return;

    document.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mousedown', onMouseDown, { passive: true });
    document.addEventListener('mouseup',   onMouseUp,   { passive: true });

    document.addEventListener('nexus:loaded', bindHoverTargets);
    document.addEventListener('nexus:dom-updated', bindHoverTargets);

    animate();
  };

  return { init };
})();

/* ============================================
   4. NOTIFICATION BAR MODULE
   ============================================ */
const NotifBarModule = (() => {
  const bar         = $('#notifBar');
  const closeBtn    = $('#notifClose');
  const header      = $('#header');
  const STORAGE_KEY = 'nexus_notif_dismissed_v1';

  const hide = () => {
    bar?.classList.add('hidden');
    header?.classList.remove('notif-visible');
    sessionStorage.setItem(STORAGE_KEY, '1');
  };

  const init = () => {
    if (!bar) return;
    if (sessionStorage.getItem(STORAGE_KEY)) {
      hide();
      return;
    }
    header?.classList.add('notif-visible');
    closeBtn?.addEventListener('click', hide);
  };

  return { init };
})();

/* ============================================
   5. NAVIGATION MODULE
   ============================================ */
const NavModule = (() => {
  const header    = $('#header');
  const burger    = $('#navBurger');
  const mobileMenu = $('#mobileMenu');
  const navLinks  = $$('.mobile-menu__link, .nav__link');
  let isOpen      = false;
  let lastScroll  = 0;

  const updateScrollState = () => {
    const scrollY = window.scrollY;

    if (scrollY > 80) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }

    lastScroll = scrollY;
  };

  const setActiveLink = () => {
    const sections = $$('section[id]');
    const scrollY  = window.scrollY + 120;

    sections.forEach(section => {
      const sectionTop    = section.offsetTop;
      const sectionBottom = sectionTop + section.offsetHeight;
      const id            = section.getAttribute('id');
      const link          = $(`.nav__link[href="#${id}"]`);

      if (scrollY >= sectionTop && scrollY < sectionBottom) {
        $$('.nav__link').forEach(l => l.classList.remove('active'));
        link?.classList.add('active');
      }
    });
  };

  const openMenu = () => {
    isOpen = true;
    mobileMenu?.classList.add('active');
    burger?.classList.add('active');
    document.body.classList.add('menu-open');
    burger?.setAttribute('aria-expanded', 'true');
  };

  const closeMenu = () => {
    isOpen = false;
    mobileMenu?.classList.remove('active');
    burger?.classList.remove('active');
    document.body.classList.remove('menu-open');
    burger?.setAttribute('aria-expanded', 'false');
  };

  const toggleMenu = () => isOpen ? closeMenu() : openMenu();

  const smoothScrollTo = (target) => {
    const el = $(target);
    if (!el) return;
    closeMenu();
    const headerH = header?.offsetHeight || 72;
    const top = el.getBoundingClientRect().top + window.scrollY - headerH;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  const init = () => {
    burger?.addEventListener('click', toggleMenu);

    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href?.startsWith('#')) {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          smoothScrollTo(href);
        });
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) closeMenu();
    });

    window.addEventListener('scroll', throttle(() => {
      updateScrollState();
      setActiveLink();
    }, 50), { passive: true });

    updateScrollState();
    setActiveLink();
  };

  return { init };
})();

/* ============================================
   6. HERO CANVAS — PARTICLE SYSTEM
   ============================================ */
const HeroCanvas = (() => {
  const canvas = $('#heroCanvas');
  if (!canvas) return { init: () => {} };

  const ctx = canvas.getContext('2d');
  let W, H, particles, rafId;
  const PARTICLE_COUNT = 80;
  const MOUSE = { x: -9999, y: -9999 };
  const CONNECTION_DIST = 140;

  const resize = () => {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  };

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x  = Math.random() * W;
      this.y  = Math.random() * H;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = (Math.random() - 0.5) * 0.4;
      this.r  = Math.random() * 1.5 + 0.5;
      this.alpha = Math.random() * 0.5 + 0.1;
    }
    update() {
      const dx = MOUSE.x - this.x;
      const dy = MOUSE.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        const force = (120 - dist) / 120;
        this.vx -= (dx / dist) * force * 0.5;
        this.vy -= (dy / dist) * force * 0.5;
      }
      this.vx *= 0.98;
      this.vy *= 0.98;
      this.x  += this.vx;
      this.y  += this.vy;
      if (this.x < 0) this.x = W;
      if (this.x > W) this.x = 0;
      if (this.y < 0) this.y = H;
      if (this.y > H) this.y = 0;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 212, 255, ${this.alpha})`;
      ctx.fill();
    }
  }

  const drawConnections = () => {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx   = particles[i].x - particles[j].x;
        const dy   = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECTION_DIST) {
          const alpha = (1 - dist / CONNECTION_DIST) * 0.15;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0, 212, 255, ${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  };

  const loop = () => {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    drawConnections();
    rafId = requestAnimationFrame(loop);
  };

  const init = () => {
    resize();
    particles = Array.from({ length: PARTICLE_COUNT }, () => new Particle());

    window.addEventListener('resize', debounce(resize, 200), { passive: true });
    window.addEventListener('mousemove', (e) => {
      MOUSE.x = e.clientX;
      MOUSE.y = e.clientY;
    }, { passive: true });

    loop();
  };

  return { init };
})();

/* ============================================
   7. SCROLL REVEAL MODULE
   ============================================ */
const RevealModule = (() => {
  let observer;

  const init = () => {
    const targets = $$('.reveal-up, .reveal-left, .reveal-right');

    observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -40px 0px',
    });

    targets.forEach(el => observer.observe(el));
  };

  return { init };
})();

/* ============================================
   8. TYPEWRITER MODULE
   ============================================ */
const TypewriterModule = (() => {
  const el     = $('#typewriterEl');
  const words  = [
    'Digital Futures',
    'Bold Brands',
    'AI Products',
    'Web Experiences',
    'Growth Engines',
  ];
  let wordIdx  = 0;
  let charIdx  = 0;
  let deleting = false;
  let timeoutId;

  const type = () => {
    const current = words[wordIdx];

    if (!deleting) {
      el.textContent = current.substring(0, charIdx + 1);
      charIdx++;
      if (charIdx === current.length) {
        deleting = true;
        timeoutId = setTimeout(type, 2000);
        return;
      }
    } else {
      el.textContent = current.substring(0, charIdx - 1);
      charIdx--;
      if (charIdx === 0) {
        deleting = false;
        wordIdx  = (wordIdx + 1) % words.length;
        timeoutId = setTimeout(type, 300);
        return;
      }
    }

    timeoutId = setTimeout(type, deleting ? 60 : 100);
  };

  const init = () => {
    if (!el) return;
    setTimeout(type, 1200);
  };

  return { init };
})();

/* ============================================
   9. COUNTER ANIMATION MODULE
   ============================================ */
const CounterModule = (() => {
  const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

  const animateCounter = (el, target, duration = 2000) => {
    const start = Date.now();

    const tick = () => {
      const elapsed  = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = easeOutCubic(progress);
      const current  = Math.round(eased * target);

      el.textContent = current.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = target.toLocaleString();
      }
    };

    requestAnimationFrame(tick);
  };

  const init = () => {
    const counters = $$('.counter');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el     = entry.target;
          const target = parseInt(el.dataset.target, 10);
          animateCounter(el, target);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.3 });

    counters.forEach(c => observer.observe(c));
  };

  return { init };
})();

/* ============================================
   10. SCROLL PROGRESS BAR
   ============================================ */
const ScrollProgressModule = (() => {
  const bar = $('#scrollProgress');

  const update = () => {
    const docH    = document.documentElement.scrollHeight - window.innerHeight;
    const scrollY = window.scrollY;
    const pct     = docH > 0 ? (scrollY / docH) * 100 : 0;
    if (bar) bar.style.width = pct + '%';
  };

  const init = () => {
    if (!bar) return;
    window.addEventListener('scroll', throttle(update, 30), { passive: true });
    update();
  };

  return { init };
})();

/* ============================================
   11. PORTFOLIO FILTER MODULE
   ============================================ */
const PortfolioModule = (() => {
  const grid    = $('#workGrid');
  const filters = $$('.work__filter');

  const filter = (category) => {
    const cards = $$('.work-card', grid);

    filters.forEach(f => {
      f.classList.toggle('active', f.dataset.filter === category);
    });

    cards.forEach((card, i) => {
      const cat   = card.dataset.category;
      const show  = category === 'all' || cat === category;

      if (show) {
        card.classList.remove('hidden');
        card.style.animationDelay = `${i * 50}ms`;
        card.style.animation = 'fadeInUp 0.4s ease forwards';
      } else {
        card.classList.add('hidden');
      }
    });
  };

  const init = () => {
    if (!grid) return;

    // Add fadeInUp keyframe dynamically
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(20px); }
        to   { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);

    filters.forEach(btn => {
      btn.addEventListener('click', () => filter(btn.dataset.filter));
    });
  };

  return { init };
})();

/* ============================================
   12. TESTIMONIALS SLIDER MODULE
   ============================================ */
const TestimonialsModule = (() => {
  const track     = $('#testimonialsTrack');
  const prevBtn   = $('#testimonialPrev');
  const nextBtn   = $('#testimonialNext');
  const dotsWrap  = $('#testimonialDots');

  let current      = 0;
  let totalCards   = 0;
  let visibleCount = 1;
  let autoId       = null;
  const AUTO_DELAY = 5000;

  const getVisibleCount = () => {
    if (window.innerWidth >= 1024) return 3;
    if (window.innerWidth >= 768)  return 2;
    return 1;
  };

  const buildDots = () => {
    if (!dotsWrap) return;
    const maxSlides = totalCards - visibleCount + 1;
    dotsWrap.innerHTML = '';
    for (let i = 0; i < maxSlides; i++) {
      const dot = document.createElement('button');
      dot.className = 'testimonials__dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', `Slide ${i + 1}`);
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
    }
  };

  const goTo = (index) => {
    const maxSlides = totalCards - visibleCount + 1;
    current = clamp(index, 0, maxSlides - 1);

    const cards    = $$('.testimonial-card', track);
    const cardW    = cards[0]?.offsetWidth || 0;
    const gap      = 24;
    const offset   = current * (cardW + gap);

    track.style.transform = `translateX(-${offset}px)`;

    cards.forEach((c, i) => c.classList.toggle('active', i === current));

    $$('.testimonials__dot', dotsWrap).forEach((d, i) =>
      d.classList.toggle('active', i === current));
  };

  const next = () => {
    const maxSlides = totalCards - visibleCount + 1;
    goTo(current >= maxSlides - 1 ? 0 : current + 1);
  };

  const prev = () => {
    const maxSlides = totalCards - visibleCount + 1;
    goTo(current <= 0 ? maxSlides - 1 : current - 1);
  };

  const startAuto = () => {
    stopAuto();
    autoId = setInterval(next, AUTO_DELAY);
  };

  const stopAuto = () => clearInterval(autoId);

  let touchStartX = 0;

  const init = () => {
    if (!track) return;
    const cards = $$('.testimonial-card', track);
    totalCards  = cards.length;

    if (totalCards === 0) return;

    const setup = () => {
      visibleCount = getVisibleCount();
      buildDots();
      goTo(0);
    };

    setup();
    prevBtn?.addEventListener('click', () => { stopAuto(); prev(); startAuto(); });
    nextBtn?.addEventListener('click', () => { stopAuto(); next(); startAuto(); });

    // Touch support
    track.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    track.addEventListener('touchend', e => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
    }, { passive: true });

    window.addEventListener('resize', debounce(setup, 250), { passive: true });

    startAuto();
  };

  return { init };
})();

/* ============================================
   13. PRICING TOGGLE MODULE
   ============================================ */
const PricingModule = (() => {
  const toggleBtns = $$('.pricing__toggle-btn');
  let currentPeriod = 'project';

  const updatePricing = (period) => {
    currentPeriod = period;

    toggleBtns.forEach(btn =>
      btn.classList.toggle('active', btn.dataset.period === period));

    $$('.pricing-card__amount').forEach(el => {
      const value = el.dataset[period];
      if (!value) return;
      el.style.transform  = 'scale(0.8)';
      el.style.opacity    = '0';
      setTimeout(() => {
        el.textContent     = value;
        el.style.transform = 'scale(1)';
        el.style.opacity   = '1';
      }, 200);
    });

    $$('.pricing-card__period').forEach(el => {
      const text = el.dataset[period];
      if (text) el.textContent = text;
    });
  };

  const init = () => {
    toggleBtns.forEach(btn => {
      btn.addEventListener('click', () => updatePricing(btn.dataset.period));
    });

    $$('.pricing-card__amount').forEach(el => {
      el.style.transition = 'all 0.2s ease';
    });
  };

  return { init };
})();

/* ============================================
   14. CONTACT FORM MODULE
   ============================================ */
const ContactFormModule = (() => {
  const form       = $('#contactForm');
  const submitBtn  = $('#submitBtn');
  const success    = $('#formSuccess');
  const msgArea    = $('#message');
  const charCount  = $('#charCount');
  const MAX_CHARS  = 1000;

  const validators = {
    firstName: (v) => v.trim().length >= 2  ? '' : 'First name must be at least 2 characters',
    lastName:  (v) => v.trim().length >= 2  ? '' : 'Last name must be at least 2 characters',
    email:     (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Please enter a valid email address',
    service:   (v) => v ? '' : 'Please select a service',
    message:   (v) => v.trim().length >= 20
      ? ''
      : v.trim().length === 0
        ? 'Message is required'
        : 'Message must be at least 20 characters',
  };

  const showError = (field, msg) => {
    const input = $(`#${field}`);
    const error = $(`#${field}Error`);
    input?.classList.toggle('error', !!msg);
    if (error) error.textContent = msg;
  };

  const clearErrors = () => {
    Object.keys(validators).forEach(field => showError(field, ''));
  };

  const validate = (data) => {
    let valid = true;
    Object.entries(validators).forEach(([field, fn]) => {
      const error = fn(data[field] || '');
      showError(field, error);
      if (error) valid = false;
    });
    return valid;
  };

  const getFormData = () => {
    const fd  = new FormData(form);
    const obj = {};
    fd.forEach((v, k) => { obj[k] = v; });
    return obj;
  };

  const setLoading = (loading) => {
    const btnText = $('.btn__text', submitBtn);
    const btnLoad = $('.btn__loading', submitBtn);
    submitBtn.disabled = loading;
    btnText?.classList.toggle('hidden', loading);
    btnLoad?.classList.toggle('hidden', !loading);
  };

  const simulateSubmit = () => new Promise(resolve => setTimeout(resolve, 1800));

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearErrors();
    const data = getFormData();
    if (!validate(data)) return;

    setLoading(true);
    try {
      await simulateSubmit();
      form.style.display = 'none';
      success?.classList.remove('hidden');
    } catch (err) {
      console.error('Form submission failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCharCount = () => {
    const len = msgArea.value.length;
    if (charCount) {
      charCount.textContent = `${len} / ${MAX_CHARS}`;
      charCount.style.color = len > MAX_CHARS * 0.9
        ? 'var(--accent-red)'
        : 'var(--text-secondary)';
    }
    if (len > MAX_CHARS) {
      msgArea.value = msgArea.value.substring(0, MAX_CHARS);
    }
  };

  // Real-time validation on blur
  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (validators[name]) {
      showError(name, validators[name](value));
    }
  };

  const init = () => {
    if (!form) return;
    form.addEventListener('submit', handleSubmit);
    msgArea?.addEventListener('input', handleCharCount);
    form.addEventListener('blur', handleBlur, true);
  };

  return { init };
})();

/* ============================================
   15. FOOTER NEWSLETTER MODULE
   ============================================ */
const NewsletterModule = (() => {
  const form = $('#footerNewsletter');

  const init = () => {
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const btn   = form.querySelector('button');
      if (!input?.value || !/\S+@\S+\.\S+/.test(input.value)) {
        input?.focus();
        return;
      }
      // Simulate subscription
      if (btn) {
        btn.textContent = '✓';
        btn.style.background = 'var(--accent-green)';
      }
      input.value = '';
      input.placeholder = 'You\'re subscribed! 🎉';
      setTimeout(() => {
        if (btn) {
          btn.textContent = '→';
          btn.style.background = '';
        }
        input.placeholder = 'your@email.com';
      }, 4000);
    });
  };

  return { init };
})();

/* ============================================
   16. MODAL SYSTEM MODULE
   ============================================ */
const ModalModule = (() => {
  const projectData = {
    1: {
      title:    'NovaPay Dashboard',
      category: 'Fintech · Web Application',
      result:   '+40% Conversion Rate',
      duration: '14 weeks',
      team:     '4 designers, 6 engineers',
      year:     '2024',
      desc:     'NovaPay approached NEXUS with a critical problem: their payment dashboard had a 61% abandonment rate. Users found the interface confusing, slow, and untrustworthy — a fatal flaw for a fintech product. We conducted 40+ user interviews, rebuilt their entire UX from scratch with a focus on progressive disclosure, micro-feedback animations, and performance-first engineering. Result: 40% jump in transaction completion, 61% reduction in support tickets, and $12M in additional annual revenue.',
      tags:     ['React', 'TypeScript', 'Node.js', 'Figma', 'Framer'],
    },
    2: {
      title:    'Aura Labs Rebrand',
      category: 'Biotech · Brand Identity',
      result:   '$24M Series B Raised',
      duration: '8 weeks',
      team:     '2 designers, 1 strategist',
      year:     '2024',
      desc:     'Aura Labs had world-class science but looked like a grad school project. With Series B fundraising on the horizon, they needed a brand that could command a boardroom. We developed a visual system that balanced scientific rigor with human warmth — clean geometry, a bespoke wordmark, and a motion system that made complex data beautiful. Investors noticed: they closed a $24M round within 3 months of the rebrand launch.',
      tags:     ['Brand Strategy', 'Logo Design', 'Motion', 'Typography', 'Figma'],
    },
    3: {
      title:    'GreenRoute App',
      category: 'CleanTech · Mobile App',
      result:   '500K+ Downloads, 4.8★',
      duration: '20 weeks',
      team:     '3 designers, 5 engineers',
      year:     '2023',
      desc:     'GreenRoute needed a sustainability tracking app that could compete with mainstream fitness apps in terms of polish and engagement. We built a React Native app with real-time CO₂ tracking, gamified challenges, and a community feed. The onboarding flow was A/B tested 12 times to achieve a 78% completion rate. The app reached 500K downloads in its first 3 months with zero paid acquisition — entirely driven by product quality and App Store optimization.',
      tags:     ['React Native', 'Node.js', 'Firebase', 'Figma', 'ASO'],
    },
    4: {
      title:    'Orion AI Suite',
      category: 'Enterprise · AI Platform',
      result:   '50+ Enterprise Clients',
      duration: '26 weeks',
      team:     '2 designers, 8 engineers, 1 AI specialist',
      year:     '2024',
      desc:     'Orion Technologies needed an enterprise AI platform that could house GPT-4 integrations, custom RAG pipelines, and real-time analytics dashboards under one roof. We architected a multi-tenant SaaS platform with role-based access, SSO, audit logging, and a no-code workflow builder. The platform launched to 50+ enterprise clients in its first quarter, with an average contract value of $80K/year.',
      tags:     ['Next.js', 'Python', 'PostgreSQL', 'AWS', 'OpenAI API'],
    },
    5: {
      title:    'Luxe Maison Store',
      category: 'Luxury · E-Commerce',
      result:   '3× Revenue in 6 Months',
      duration: '18 weeks',
      team:     '3 designers, 5 engineers',
      year:     '2024',
      desc:     'Luxe Maison\'s legacy Shopify theme was losing them $2M/year in abandoned carts. We built a custom storefront with 3D product viewers powered by Three.js, AI-powered personalized recommendations, and a checkout flow optimized for luxury buyers. Sub-1.5s load times, WCAG 2.1 AA compliant, and a 3× revenue increase in 6 months made this one of our most impactful e-commerce projects.',
      tags:     ['Next.js Commerce', 'Three.js', 'Shopify', 'AI', 'Stripe'],
    },
    6: {
      title:    'Velocity Sports',
      category: 'Sports · Brand + Web',
      result:   '5× Social Engagement',
      duration: '10 weeks',
      team:     '2 designers, 3 engineers',
      year:     '2023',
      desc:     'Velocity Sports was a strong product in a crowded market with a weak digital presence. Our rebrand combined aggressive typography, high-contrast athlete photography, and a motion-forward web experience. The launch was featured on TechCrunch, Product Hunt\'s #2 product of the day, and social engagement jumped 5× in the first week. Online sales increased 180% in the following quarter.',
      tags:     ['Framer', 'GSAP', 'Brand Identity', 'Motion Design', 'SEO'],
    },
  };

  const teamData = {
    alex: {
      name:     'Alex Chen',
      role:     'CEO & Creative Director',
      prev:     'Ex-Airbnb Design Lead',
      hue:      200,
      initials: 'AC',
      bio:      'Alex founded NEXUS in 2016 after 5 years leading design at Airbnb, where he redesigned the core booking experience used by 300M+ users. He believes design is business strategy made visible, and every pixel should earn its place.',
      skills:   ['Design Strategy', 'Creative Direction', 'Product Vision', 'Client Relations'],
      linkedin: '#',
      twitter:  '#',
    },
    maya: {
      name:     'Maya Rodriguez',
      role:     'CTO & Lead Engineer',
      prev:     'Ex-Google Senior SWE',
      hue:      280,
      initials: 'MR',
      bio:      'Maya spent 7 years at Google working on Chrome performance and web platform APIs. She brought her obsession with engineering excellence to NEXUS, where she\'s built a team that ships production-quality code on every project.',
      skills:   ['System Architecture', 'React/Next.js', 'Performance', 'DevOps'],
      linkedin: '#',
      github:   '#',
    },
    james: {
      name:     'James Kim',
      role:     'Head of Strategy',
      prev:     'Ex-McKinsey Digital',
      hue:      140,
      initials: 'JK',
      bio:      'James brings the analytical rigor of his McKinsey Digital years to every NEXUS engagement. He\'s conducted digital transformation programs for Fortune 100 companies and knows what separates digital investments that deliver ROI from those that don\'t.',
      skills:   ['Digital Strategy', 'CRO', 'Market Research', 'Growth Planning'],
      linkedin: '#',
      twitter:  '#',
    },
    sarah: {
      name:     'Sarah Park',
      role:     'Head of AI & Innovation',
      prev:     'Ex-OpenAI Research',
      hue:      40,
      initials: 'SP',
      bio:      'Sarah spent 3 years at OpenAI as a research engineer before joining NEXUS to lead the AI practice. She bridges the gap between cutting-edge AI research and practical product implementation, helping clients deploy AI that actually works.',
      skills:   ['LLM Integration', 'RAG Systems', 'ML Engineering', 'AI Product Strategy'],
      linkedin: '#',
      twitter:  '#',
    },
  };

  const openModal = (id) => {
    const modal = $(`#${id}`);
    if (!modal) return;
    modal.classList.add('active');
    document.body.classList.add('modal-open');

    modal.addEventListener('keydown', trapFocus);
    document.addEventListener('keydown', handleEsc);
  };

  const closeModal = (id) => {
    const modal = $(`#${id}`);
    if (!modal) return;
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
    document.removeEventListener('keydown', handleEsc);
  };

  const handleEsc = (e) => {
    if (e.key === 'Escape') {
      $$('.modal.active').forEach(m => m.classList.remove('active'));
      document.body.classList.remove('modal-open');
    }
  };

  const trapFocus = (e) => {
    if (e.key !== 'Tab') return;
    const focusable = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', e.currentTarget);
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
      e.preventDefault();
      (e.shiftKey ? last : first).focus();
    }
  };

  const openProjectModal = (id) => {
    const data    = projectData[id];
    const content = $('#modalProjectContent');
    if (!data || !content) return;

    content.innerHTML = `
      <div class="modal__project-header">
        <div class="modal__project-tags">
          ${data.tags.map(t => `<span>${t}</span>`).join('')}
        </div>
        <h2 class="modal__project-title">${data.title}</h2>
        <p class="modal__project-cat">${data.category}</p>
      </div>
      <div class="modal__project-img">
        <div class="modal__project-placeholder">
          <div class="modal__project-pattern"></div>
          <span>${data.title.toUpperCase()}</span>
        </div>
      </div>
      <div class="modal__project-meta">
        <div class="modal__meta-item">
          <span>Result</span>
          <strong style="color:var(--accent-green)">${data.result}</strong>
        </div>
        <div class="modal__meta-item">
          <span>Duration</span>
          <strong>${data.duration}</strong>
        </div>
        <div class="modal__meta-item">
          <span>Team Size</span>
          <strong>${data.team}</strong>
        </div>
        <div class="modal__meta-item">
          <span>Year</span>
          <strong>${data.year}</strong>
        </div>
      </div>
      <p class="modal__project-desc">${data.desc}</p>
      <a href="#contact" class="btn btn--primary btn--lg" onclick="closeModal('projectModal')">
        Start a Similar Project →
      </a>
    `;

    openModal('projectModal');
  };

  const openTeamModal = (key) => {
    const data    = teamData[key];
    const content = $('#modalTeamContent');
    if (!data || !content) return;

    content.innerHTML = `
      <div class="modal__team-avatar" style="--hue:${data.hue}">
        <span>${data.initials}</span>
      </div>
      <h2 class="modal__team-name">${data.name}</h2>
      <p class="modal__team-role">${data.role}</p>
      <p class="modal__team-prev">${data.prev}</p>
      <p class="modal__team-bio">${data.bio}</p>
      <div class="modal__team-skills">
        ${data.skills.map(s => `<span>${s}</span>`).join('')}
      </div>
      <div class="modal__team-links">
        ${data.linkedin ? `<a href="${data.linkedin}" class="btn btn--sm btn--outline" target="_blank">LinkedIn</a>` : ''}
        ${data.twitter  ? `<a href="${data.twitter}"  class="btn btn--sm btn--ghost"   target="_blank">Twitter</a>`  : ''}
        ${data.github   ? `<a href="${data.github}"   class="btn btn--sm btn--ghost"   target="_blank">GitHub</a>`   : ''}
      </div>
    `;

    openModal('teamModal');
  };

  const addModalStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
      .modal__project-header { margin-bottom: 1.5rem; }
      .modal__project-tags { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
      .modal__project-tags span {
        font-family: var(--font-mono);
        font-size: var(--fs-xs);
        color: var(--accent-cyan);
        background: var(--accent-cyan-dim);
        border: 1px solid var(--border-accent);
        padding: 2px 10px;
        border-radius: var(--radius-pill);
      }
      .modal__project-title {
        font-family: var(--font-display);
        font-size: var(--fs-2xl);
        letter-spacing: var(--ls-tight);
        margin-bottom: 0.25rem;
      }
      .modal__project-cat {
        font-size: var(--fs-sm);
        color: var(--text-secondary);
        margin-bottom: 0;
      }
      .modal__project-img {
        border-radius: var(--radius-lg);
        overflow: hidden;
        aspect-ratio: 16/6;
        margin-bottom: 1.5rem;
      }
      .modal__project-placeholder {
        width: 100%; height: 100%;
        background: hsl(200 40% 10%);
        position: relative;
        display: flex; align-items: center; justify-content: center;
      }
      .modal__project-pattern {
        position: absolute; inset: 0;
        background: repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(0,212,255,0.04) 20px, rgba(0,212,255,0.04) 40px);
      }
      .modal__project-placeholder span {
        font-family: var(--font-display);
        font-size: var(--fs-xs);
        letter-spacing: var(--ls-widest);
        color: rgba(255,255,255,0.15);
        position: relative;
      }
      .modal__project-meta {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1rem;
        background: var(--bg-secondary);
        border-radius: var(--radius-lg);
        padding: 1.5rem;
        margin-bottom: 1.5rem;
      }
      @media (max-width: 600px) { .modal__project-meta { grid-template-columns: 1fr 1fr; } }
      .modal__meta-item { display: flex; flex-direction: column; gap: 0.25rem; }
      .modal__meta-item span { font-size: var(--fs-xs); color: var(--text-secondary); }
      .modal__meta-item strong { font-size: var(--fs-sm); }
      .modal__project-desc {
        font-size: var(--fs-base);
        color: var(--text-secondary);
        line-height: var(--lh-loose);
        margin-bottom: 2rem;
      }
      /* Team Modal */
      .modal__team-avatar {
        width: 100px; height: 100px;
        border-radius: 50%;
        background: hsl(var(--hue, 200) 60% 20%);
        border: 2px solid hsl(var(--hue, 200) 60% 40% / 0.4);
        display: flex; align-items: center; justify-content: center;
        margin: 0 auto 1.5rem;
        font-family: var(--font-display);
        font-size: 2.5rem;
        color: hsl(var(--hue, 200) 80% 75%);
      }
      .modal__team-name {
        font-family: var(--font-display);
        font-size: var(--fs-2xl);
        letter-spacing: var(--ls-tight);
        margin-bottom: 0.25rem;
      }
      .modal__team-role { font-size: var(--fs-base); color: var(--accent-cyan); font-weight: 600; margin-bottom: 0.25rem; }
      .modal__team-prev { font-size: var(--fs-sm); color: var(--text-secondary); margin-bottom: 1.5rem; }
      .modal__team-bio {
        font-size: var(--fs-sm);
        color: var(--text-secondary);
        line-height: var(--lh-loose);
        margin-bottom: 1.5rem;
      }
      .modal__team-skills {
        display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center;
        margin-bottom: 1.5rem;
      }
      .modal__team-skills span {
        font-size: var(--fs-xs);
        background: var(--bg-secondary);
        border: 1px solid var(--border-subtle);
        padding: 3px 12px;
        border-radius: var(--radius-pill);
        color: var(--text-secondary);
      }
      .modal__team-links {
        display: flex; gap: 0.75rem; justify-content: center;
      }
    `;
    document.head.appendChild(style);
  };

  const init = () => {
    addModalStyles();

    // Expose globally so HTML onclick works
    window.openProjectModal = openProjectModal;
    window.openTeamModal    = openTeamModal;
    window.closeModal       = closeModal;

    // Hero video button
    $('#heroVideoBtn')?.addEventListener('click', () => openModal('videoModal'));

    // Team cards
    $$('.team-card').forEach(card => {
      card.addEventListener('click', () => {
        const key = card.getAttribute('onclick')
          ?.match(/openTeamModal\('([^']+)'\)/)?.[1];
        if (key) openTeamModal(key);
      });
      card.removeAttribute('onclick');
    });
  };

  return { init };
})();

/* ============================================
   17. THEME TOGGLE MODULE
   ============================================ */
const ThemeModule = (() => {
  const toggle   = $('#themeToggle');
  const STORAGE  = 'nexus_theme';
  let current    = localStorage.getItem(STORAGE) || 'dark';

  const apply = (theme) => {
    current = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE, theme);
  };

  const init = () => {
    // Respect system preference if no stored value
    if (!localStorage.getItem(STORAGE)) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      current = prefersDark ? 'dark' : 'light';
    }

    apply(current);

    toggle?.addEventListener('click', () => {
      apply(current === 'dark' ? 'light' : 'dark');
    });

    // Listen for system changes
    window.matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', e => {
        if (!localStorage.getItem(STORAGE)) {
          apply(e.matches ? 'dark' : 'light');
        }
      });
  };

  return { init };
})();

/* ============================================
   18. BACK TO TOP MODULE
   ============================================ */
const BackToTopModule = (() => {
  const btn = $('#backToTop');

  const init = () => {
    if (!btn) return;

    window.addEventListener('scroll', throttle(() => {
      btn.classList.toggle('visible', window.scrollY > 400);
    }, 100), { passive: true });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  return { init };
})();

/* ============================================
   19. COOKIE BANNER MODULE
   ============================================ */
const CookieModule = (() => {
  const banner     = $('#cookieBanner');
  const acceptBtn  = $('#cookieAccept');
  const declineBtn = $('#cookieDecline');
  const STORAGE    = 'nexus_cookie_consent';

  const hide = () => banner?.classList.remove('visible');

  const accept = () => {
    localStorage.setItem(STORAGE, 'accepted');
    hide();
  };

  const decline = () => {
    sessionStorage.setItem(STORAGE, 'declined');
    hide();
  };

  const init = () => {
    if (!banner) return;
    if (localStorage.getItem(STORAGE) || sessionStorage.getItem(STORAGE)) return;

    setTimeout(() => banner.classList.add('visible'), 3000);

    acceptBtn?.addEventListener('click',  accept);
    declineBtn?.addEventListener('click', decline);
  };

  return { init };
})();

/* ============================================
   20. PARALLAX MODULE
   ============================================ */
const ParallaxModule = (() => {
  const elements = [];

  const registerEl = (selector, speed = 0.3) => {
    $$(selector).forEach(el => elements.push({ el, speed, initY: 0 }));
  };

  const update = () => {
    const scrollY = window.scrollY;
    elements.forEach(({ el, speed }) => {
      const rect   = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const viewCy = window.innerHeight / 2;
      const delta  = (center - viewCy) * speed;
      el.style.transform = `translateY(${delta}px)`;
    });
  };

  const init = () => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) return;

    registerEl('.hero__bg-grid', 0.1);
    registerEl('.cta__glow--1', 0.15);
    registerEl('.cta__glow--2', -0.12);

    window.addEventListener('scroll', throttle(update, 20), { passive: true });
  };

  return { init };
})();

/* ============================================
   21. MARQUEE PAUSE ON HOVER
   ============================================ */
const MarqueeModule = (() => {
  const init = () => {
    $$('.hero__marquee-track, .logos__list').forEach(track => {
      track.addEventListener('mouseenter', () => {
        track.style.animationPlayState = 'paused';
      });
      track.addEventListener('mouseleave', () => {
        track.style.animationPlayState = 'running';
      });
    });
  };
  return { init };
})();

/* ============================================
   22. KEYBOARD NAVIGATION MODULE
   ============================================ */
const A11yModule = (() => {
  const init = () => {
    // Add visible focus ring for keyboard users only
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-nav');
      }
    });
    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-nav');
    });

    // Skip to main content
    const skip = document.createElement('a');
    skip.href = '#home';
    skip.className = 'skip-link';
    skip.textContent = 'Skip to main content';
    Object.assign(skip.style, {
      position:  'absolute',
      top:       '-40px',
      left:      '0',
      background: 'var(--accent-cyan)',
      color:     'var(--bg-primary)',
      padding:   '8px 16px',
      zIndex:    '99999',
      transition: 'top 0.2s',
    });
    skip.addEventListener('focus', () => { skip.style.top = '0'; });
    skip.addEventListener('blur',  () => { skip.style.top = '-40px'; });
    document.body.prepend(skip);
  };
  return { init };
})();

/* ============================================
   23. PERFORMANCE OBSERVER
   ============================================ */
const PerfModule = (() => {
  const init = () => {
    if (!('PerformanceObserver' in window)) return;

    // Log LCP for dev awareness
    try {
      const lcpObserver = new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
          console.info(
            `%c[NEXUS Perf] LCP: ${Math.round(entry.startTime)}ms`,
            'color: #00d4ff; font-family: monospace;'
          );
        });
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

      // CLS
      const clsObserver = new PerformanceObserver(list => {
        let cls = 0;
        list.getEntries().forEach(entry => {
          if (!entry.hadRecentInput) cls += entry.value;
        });
        if (cls > 0.1) {
          console.warn(`%c[NEXUS Perf] CLS: ${cls.toFixed(4)} (target < 0.1)`, 'color: #ffb830; font-family: monospace;');
        }
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch {}
  };
  return { init };
})();

/* ============================================
   24. CONSOLE BRANDING
   ============================================ */
const ConsoleBranding = (() => {
  const init = () => {
    const styles = [
      'background: linear-gradient(135deg, #050508, #0a0a12)',
      'color: #00d4ff',
      'font-family: monospace',
      'font-size: 14px',
      'padding: 12px 20px',
      'border-left: 3px solid #00d4ff',
    ].join(';');

    console.log('%c\n  ⬡ NEXUS Digital Agency\n  Built with craft & care.\n  hello@nexusagency.com\n', styles);
    console.log('%c  Stack: Vanilla JS · CSS Custom Properties · Canvas API', 'color:#9090b0;font-family:monospace;font-size:11px');
  };
  return { init };
})();

/* ============================================
   25. SMOOTH ANCHOR SCROLL — GLOBAL HANDLER
   ============================================ */
const SmoothScrollModule = (() => {
  const init = () => {
    document.addEventListener('click', (e) => {
      const anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (href === '#') { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }

      const target = $(href);
      if (!target) return;

      e.preventDefault();
      const headerH = $('#header')?.offsetHeight || 72;
      const top = target.getBoundingClientRect().top + window.scrollY - headerH;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  };
  return { init };
})();

/* ============================================
   26. WORK CARD — project modal hook
   ============================================ */
const WorkCardModule = (() => {
  const init = () => {
    // Bind work card "View Case Study" buttons
    $$('.work-card').forEach((card, i) => {
      // Remove inline onclick and use event delegation
      const btn = card.querySelector('[onclick]');
      if (btn) {
        const id = i + 1;
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          window.openProjectModal?.(id);
        });
        btn.removeAttribute('onclick');
      }
    });
  };
  return { init };
})();

/* ============================================
   27. MAIN BOOT SEQUENCE
   ============================================ */
const NEXUS = {
  modules: [
    ThemeModule,        // Must run first (sets theme before paint)
    A11yModule,
    ConsoleBranding,
    LoaderModule,
    CursorModule,
    NavModule,
    NotifBarModule,
    ScrollProgressModule,
    BackToTopModule,
    CookieModule,
    MarqueeModule,
    PerfModule,
    SmoothScrollModule,
  ],
  postLoadModules: [
    HeroCanvas,
    TypewriterModule,
    RevealModule,
    CounterModule,
    PortfolioModule,
    TestimonialsModule,
    PricingModule,
    ContactFormModule,
    NewsletterModule,
    ModalModule,
    WorkCardModule,
    ParallaxModule,
  ],

  boot() {
    // Run critical modules immediately
    this.modules.forEach(m => {
      try { m.init(); }
      catch (err) { console.warn('[NEXUS] Module init failed:', err); }
    });

    // Run heavier modules after loader
    document.addEventListener('nexus:loaded', () => {
      this.postLoadModules.forEach(m => {
        try { m.init(); }
        catch (err) { console.warn('[NEXUS] Post-load module init failed:', err); }
      });

      // Trigger reveal for above-fold elements
      setTimeout(() => {
        $$('.hero .reveal-up, .hero .reveal-left, .hero .reveal-right').forEach(el => {
          el.classList.add('revealed');
        });
      }, 100);

      document.dispatchEvent(new CustomEvent('nexus:dom-updated'));
    });
  },
};

/* ============================================
   28. BOOT ON DOM READY
   ============================================ */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => NEXUS.boot());
} else {
  NEXUS.boot();
}

/* ============================================
   29. SERVICE WORKER REGISTRATION
   (Production-ready offline support hint)
   ============================================ */
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => {
    // navigator.serviceWorker.register('/sw.js').catch(() => {});
    // Uncomment in production with a proper sw.js file
  });
}
