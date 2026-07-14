/* =========================================================
   POLOVKA BUILD — interactivity & GSAP scroll animations
========================================================= */
(function () {
  'use strict';

  var header = document.getElementById('header');
  var burger = document.getElementById('burger');
  var mobileNav = document.getElementById('mobileNav');
  var yearEl = document.getElementById('year');

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- Header scrolled state ---- */
  function onScroll() {
    if (window.scrollY > 12) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---- Mobile nav toggle ---- */
  if (burger && mobileNav) {
    burger.addEventListener('click', function () {
      var isOpen = mobileNav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileNav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---- GSAP animations ---- */
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (window.gsap && !reduceMotion) {
    gsap.registerPlugin(ScrollTrigger);

    /* Hero entrance timeline */
    var heroTl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.9 } });
    heroTl
      .to('.hero__content [data-anim]', { opacity: 1, y: 0, stagger: 0.12 }, 0.1)
      .fromTo('.hero__content [data-anim]', { y: 26 }, { y: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out' }, 0.1)
      .to('.hero__visual', { opacity: 1, duration: 1.1, ease: 'power2.out' }, 0.35);

    /* Building illustration line-draw */
    var paths = gsap.utils.toArray('.draw-path');
    paths.forEach(function (path) {
      var length = path.getTotalLength();
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
    });
    gsap.to(paths, {
      strokeDashoffset: 0,
      duration: 1.6,
      stagger: 0.12,
      ease: 'power2.inOut',
      delay: 0.5
    });

    /* Hero parallax glows */
    gsap.to('.hero__glow--1', {
      y: 60,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 }
    });
    gsap.to('.hero__glow--2', {
      y: -40,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 }
    });

    /* Generic scroll-reveal for everything below the fold */
    var revealGroups = {};
    document.querySelectorAll('main .section [data-anim]').forEach(function (el) {
      var section = el.closest('.section');
      if (!revealGroups[section.id || Math.random()]) {
        revealGroups[section.id || Math.random()] = [];
      }
    });

    document.querySelectorAll('.section').forEach(function (section) {
      var items = section.querySelectorAll('[data-anim]');
      if (!items.length) return;

      gsap.fromTo(
        items,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.08,
          scrollTrigger: {
            trigger: section,
            start: 'top 78%',
            once: true
          }
        }
      );
    });

  } else {
    /* Fallback: no GSAP or reduced motion — just reveal everything */
    document.querySelectorAll('[data-anim]').forEach(function (el) {
      el.style.opacity = 1;
    });
  }

  /* =========================================================
     Room cards: in-card photo carousel (drag + arrows + dots)
  ========================================================= */
  var rooms = []; // { images: [src...] } per room, built below

  document.querySelectorAll('.room-card:not(.room-card--video)').forEach(function (card, roomIndex) {
    var scroller = card.querySelector('.room-card__scroller');
    var slides = Array.prototype.slice.call(card.querySelectorAll('.room-card__slide'));
    var dotsWrap = card.querySelector('.room-card__dots');
    var prevBtn = card.querySelector('.room-card__arrow--prev');
    var nextBtn = card.querySelector('.room-card__arrow--next');

    rooms[roomIndex] = { images: slides.map(function (s) { return s.querySelector('img').src; }) };

    /* Build position dots (skip for single-photo rooms) */
    var dots = [];
    if (dotsWrap && slides.length > 1) {
      slides.forEach(function (_, i) {
        var dot = document.createElement('span');
        dot.className = 'room-card__dot' + (i === 0 ? ' is-active' : '');
        dotsWrap.appendChild(dot);
        dots.push(dot);
      });
    }

    function setActive(i) {
      dots.forEach(function (d, di) { d.classList.toggle('is-active', di === i); });
      if (prevBtn) prevBtn.disabled = i === 0;
      if (nextBtn) nextBtn.disabled = i === slides.length - 1;
    }
    setActive(0);

    var scrollRaf = null;
    scroller.addEventListener('scroll', function () {
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(function () {
        var i = Math.round(scroller.scrollLeft / scroller.clientWidth);
        setActive(Math.max(0, Math.min(slides.length - 1, i)));
        scrollRaf = null;
      });
    }, { passive: true });

    /* Drag-to-scroll (desktop mouse) */
    var isDown = false, startX = 0, startScroll = 0, moved = false;
    scroller.addEventListener('pointerdown', function (e) {
      isDown = true;
      moved = false;
      startX = e.clientX;
      startScroll = scroller.scrollLeft;
      scroller.classList.add('is-dragging');
    });
    window.addEventListener('pointermove', function (e) {
      if (!isDown) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      scroller.scrollLeft = startScroll - dx;
    });
    function endDrag() {
      isDown = false;
      scroller.classList.remove('is-dragging');
    }
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);

    /* Arrow buttons step one slide at a time */
    if (prevBtn) prevBtn.addEventListener('click', function () {
      scroller.scrollBy({ left: -scroller.clientWidth, behavior: 'smooth' });
    });
    if (nextBtn) nextBtn.addEventListener('click', function () {
      scroller.scrollBy({ left: scroller.clientWidth, behavior: 'smooth' });
    });

    /* Click opens the lightbox, unless the click followed a drag */
    slides.forEach(function (slide, slideIndex) {
      slide.addEventListener('click', function (e) {
        if (moved) { e.preventDefault(); return; }
        openLightbox(roomIndex, slideIndex);
      });
    });
  });

  /* =========================================================
     Photo lightbox (scoped to the room that was opened)
  ========================================================= */
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  var lightboxCounter = document.getElementById('lightboxCounter');
  var currentRoom = 0;
  var lightboxIndex = 0;

  function renderLightbox() {
    var images = rooms[currentRoom].images;
    lightboxImg.src = images[lightboxIndex];
    lightboxCounter.textContent = (lightboxIndex + 1) + ' / ' + images.length;
  }
  function openLightbox(roomIndex, slideIndex) {
    currentRoom = roomIndex;
    lightboxIndex = slideIndex;
    renderLightbox();
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  function stepLightbox(delta) {
    var count = rooms[currentRoom].images.length;
    lightboxIndex = (lightboxIndex + delta + count) % count;
    renderLightbox();
  }

  var lightboxClose = document.getElementById('lightboxClose');
  var lightboxPrev = document.getElementById('lightboxPrev');
  var lightboxNext = document.getElementById('lightboxNext');
  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener('click', function () { stepLightbox(-1); });
  if (lightboxNext) lightboxNext.addEventListener('click', function () { stepLightbox(1); });
  if (lightbox) {
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') stepLightbox(-1);
    if (e.key === 'ArrowRight') stepLightbox(1);
  });

  /* =========================================================
     Video cards: each plays silently on loop only while on
     screen; the expand button opens a distraction-free modal
  ========================================================= */
  var videoModal = document.getElementById('videoModal');
  var videoModalPlayer = document.getElementById('videoModalPlayer');
  var videoModalClose = document.getElementById('videoModalClose');

  function openVideoModal(src, poster) {
    videoModalPlayer.src = src;
    videoModalPlayer.poster = poster || '';
    videoModal.classList.add('is-open');
    videoModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    videoModalPlayer.play().catch(function () {});
  }
  function closeVideoModal() {
    videoModalPlayer.pause();
    videoModalPlayer.removeAttribute('src');
    videoModalPlayer.load();
    videoModal.classList.remove('is-open');
    videoModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.room-card--video').forEach(function (card) {
    var video = card.querySelector('.room-card__video');
    var expandBtn = card.querySelector('.room-card__expand');
    if (!video) return;

    if ('IntersectionObserver' in window) {
      var videoObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            video.play().catch(function () {});
          } else {
            video.pause();
          }
        });
      }, { threshold: 0.5 });
      videoObserver.observe(video);
    } else {
      video.play().catch(function () {});
    }

    if (expandBtn) {
      expandBtn.addEventListener('click', function () {
        openVideoModal(video.currentSrc || video.src, video.poster);
      });
    }
  });

  if (videoModalClose) videoModalClose.addEventListener('click', closeVideoModal);
  if (videoModal) {
    videoModal.addEventListener('click', function (e) {
      if (e.target === videoModal) closeVideoModal();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && videoModal.classList.contains('is-open')) closeVideoModal();
  });
})();