(() => {
  'use strict';

  const body = document.body;
  const menuToggle = document.getElementById('menuToggle');
  const mainNav = document.getElementById('mainNav');
  const quoteModal = document.getElementById('quoteModal');
  const contactModal = document.getElementById('contactModal');
  const projectLightbox = document.getElementById('projectLightbox');
  const lightboxImage = document.getElementById('lightboxImage');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const floatingControls = document.querySelector('.floating-controls');
  const heroSection = document.querySelector('.hero');
  const modalQuoteForm = quoteModal.querySelector('form');
  const modalService = document.getElementById('modalService');
  let activeModal = null;
  let previousFocus = null;
  let filteredProjectCards = [];
  let lightboxIndex = 0;
  let lightboxLoadToken = 0;

  const phone = '+61414623661';
  const email = 'tophatpainting@hatmail.com';
  const modalSelector = '.modal-panel button, .modal-panel a, .modal-panel input, .modal-panel select, .modal-panel textarea, .lightbox-panel button, .lightbox-panel a, .lightbox-panel input, .lightbox-panel select, .lightbox-panel textarea';

  document.getElementById('currentYear').textContent = String(new Date().getFullYear());
  body.classList.add('js-enabled');

  // If a WebP request fails, drop that source and retry the companion JPEG asset.
  document.querySelectorAll('picture.responsive-picture > img, picture.hero-picture > img').forEach((image) => {
    image.addEventListener('error', () => {
      if (image.dataset.fallbackAttempted === 'true') return;
      image.dataset.fallbackAttempted = 'true';
      const picture = image.closest('picture');
      if (picture) picture.querySelectorAll('source').forEach((source) => source.remove());
      const fallback = image.getAttribute('src');
      if (fallback) image.src = fallback;
    }, { once: true });
  });


  const revealItems = document.querySelectorAll('.section-heading, .service-card, .experience-media, .experience-text, .project-card, .reviews-intro, .review-lookup-card');
  revealItems.forEach((item) => item.classList.add('reveal'));
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' });
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-revealed'));
  }
  if (floatingControls && heroSection && 'IntersectionObserver' in window) {
    const heroVisibilityObserver = new IntersectionObserver(([entry]) => {
      floatingControls.classList.toggle('is-visible', !entry.isIntersecting);
    }, { threshold: 0 });
    heroVisibilityObserver.observe(heroSection);
  } else if (floatingControls) {
    floatingControls.classList.add('is-visible');
  }

  function closeNavigation() {
    mainNav.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation');
    body.classList.remove('nav-open');
  }

  menuToggle.addEventListener('click', () => {
    const willOpen = !mainNav.classList.contains('is-open');
    mainNav.classList.toggle('is-open', willOpen);
    menuToggle.setAttribute('aria-expanded', String(willOpen));
    menuToggle.setAttribute('aria-label', willOpen ? 'Close navigation' : 'Open navigation');
    body.classList.toggle('nav-open', willOpen);
  });

  mainNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeNavigation));

  function openModal(modal, service) {
    if (!modal) return;
    if (activeModal && activeModal !== modal) activeModal.hidden = true;
    previousFocus = document.activeElement;
    activeModal = modal;
    modal.hidden = false;
    body.classList.add('modal-open');
    closeNavigation();
    if (modal === quoteModal) modalService.value = service || '';
    window.requestAnimationFrame(() => {
      const firstField = modal === quoteModal
        ? modal.querySelector('input:not([type="hidden"])')
        : modal.querySelector('.contact-method');
      if (firstField) firstField.focus();
    });
  }

  function closeModal(modal = activeModal) {
    if (!modal) return;
    modal.hidden = true;
    if (activeModal === modal) activeModal = null;
    if (!activeModal) body.classList.remove('modal-open');
    if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
  }

  document.querySelectorAll('[data-quote-open]').forEach((button) => {
    button.addEventListener('click', () => openModal(quoteModal));
  });

  document.querySelectorAll('[data-contact-open]').forEach((button) => {
    button.addEventListener('click', () => openModal(contactModal));
  });

  document.querySelectorAll('[data-service]').forEach((button) => {
    button.addEventListener('click', () => openModal(quoteModal, button.dataset.service));
  });

  document.querySelectorAll('[data-modal-close]').forEach((button) => {
    button.addEventListener('click', () => closeModal(button.closest('.modal-backdrop')));
  });

  [quoteModal, contactModal, projectLightbox].forEach((modal) => {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) closeModal(modal);
    });
  });

  document.getElementById('contactPanelQuote').addEventListener('click', () => {
    closeModal(contactModal);
    openModal(quoteModal);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (activeModal) closeModal(activeModal);
      if (mainNav.classList.contains('is-open')) {
        closeNavigation();
        menuToggle.focus();
      }
    }

    if (activeModal === projectLightbox && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      event.preventDefault();
      showLightboxPhoto(lightboxIndex + (event.key === 'ArrowRight' ? 1 : -1));
    }

    if (event.key === 'Tab' && activeModal) {
      const focusable = Array.from(activeModal.querySelectorAll(modalSelector)).filter((element) => {
        return !element.disabled && element.getAttribute('tabindex') !== '-1' && element.offsetParent !== null;
      });
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
  const projectCards = Array.from(document.querySelectorAll('.project-card[data-category]'));
  const projectFilterButtons = Array.from(document.querySelectorAll('[data-project-filter]'));
  const projectMoreButton = document.getElementById('projectMore');
  const projectCount = document.getElementById('projectCount');
  const projectBatchSize = 6;
  let activeProjectFilter = 'all';
  let projectsExpanded = false;

  function updateProjects() {
    filteredProjectCards = projectCards.filter((card) => activeProjectFilter === 'all' || card.dataset.category === activeProjectFilter);
    projectCards.forEach((card) => { card.hidden = true; });
    const visibleCards = projectsExpanded ? filteredProjectCards : filteredProjectCards.slice(0, projectBatchSize);
    visibleCards.forEach((card) => { card.hidden = false; });
    if (projectMoreButton) {
      const remaining = Math.max(0, filteredProjectCards.length - visibleCards.length);
      projectMoreButton.hidden = remaining === 0;
      projectMoreButton.setAttribute('aria-expanded', String(projectsExpanded));
      projectMoreButton.innerHTML = projectsExpanded
        ? 'Show fewer photos <span aria-hidden="true">↑</span>'
        : `View ${remaining} more ${remaining === 1 ? 'photo' : 'photos'} <span aria-hidden="true">↓</span>`;
    }
    if (projectCount) {
      projectCount.textContent = `${filteredProjectCards.length} ${filteredProjectCards.length === 1 ? 'photo' : 'photos'} in this collection`;
    }
    visibleCards.forEach((card) => {
      if (card.getBoundingClientRect().top < window.innerHeight * 0.9) card.classList.add('is-revealed');
    });
  }

  projectFilterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      activeProjectFilter = button.dataset.projectFilter || 'all';
      projectsExpanded = false;
      projectFilterButtons.forEach((item) => {
        const selected = item === button;
        item.classList.toggle('is-active', selected);
        item.setAttribute('aria-pressed', String(selected));
      });
      updateProjects();
    });
  });

  if (projectMoreButton) {
    projectMoreButton.addEventListener('click', () => {
      projectsExpanded = !projectsExpanded;
      updateProjects();
      if (!projectsExpanded) document.getElementById('projectsTitle').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
  updateProjects();
  function showLightboxPhoto(index) {
    if (!filteredProjectCards.length) return;

    lightboxIndex = (index + filteredProjectCards.length) % filteredProjectCards.length;
    const card = filteredProjectCards[lightboxIndex];
    const image = card.querySelector('.project-media picture img, .project-media img');
    if (!image) return;

    const picture = image.closest('picture');
    const source = picture && picture.querySelector('source[srcset]');
    // Use the asset the browser actually displays (usually WebP), not just the
    // img[src] JPEG fallback. Hosts often deploy the optimized files first; using
    // img.src here can make captions change while the full-size image request 404s.
    const sourceFromPicture = source ? source.srcset.split(',')[0].trim().split(/\s+/)[0] : '';
    const candidates = Array.from(new Set([
      image.currentSrc,
      sourceFromPicture,
      image.src
    ].filter(Boolean)));
    const category = card.querySelector('figcaption span');
    const title = card.querySelector('figcaption strong');
    const token = ++lightboxLoadToken;

    lightboxImage.alt = image.alt || '';
    lightboxImage.width = image.naturalWidth || Number(image.getAttribute('width')) || 1200;
    lightboxImage.height = image.naturalHeight || Number(image.getAttribute('height')) || 900;
    lightboxCaption.textContent = `${category ? category.textContent : 'PROJECT'} · ${title ? title.textContent : 'Project photo'}`;

    // Preload before swapping, so rapid taps can't leave the previous bitmap
    // visible while the caption already describes the next photo.
    const tryCandidate = (candidateIndex) => {
      if (token !== lightboxLoadToken) return;
      if (candidateIndex >= candidates.length) {
        lightboxImage.removeAttribute('src');
        lightboxImage.alt = 'This project photo could not be loaded. Please close the viewer and try again.';
        lightboxCaption.textContent += ' · Photo unavailable';
        return;
      }
      const preload = new Image();
      preload.decoding = 'async';
      preload.onload = () => {
        if (token !== lightboxLoadToken) return;
        lightboxImage.src = candidates[candidateIndex];
        lightboxImage.alt = image.alt || '';
        lightboxImage.width = preload.naturalWidth || lightboxImage.width;
        lightboxImage.height = preload.naturalHeight || lightboxImage.height;
        lightboxImage.style.animation = 'none';
        void lightboxImage.offsetWidth;
        lightboxImage.style.animation = '';
      };
      preload.onerror = () => tryCandidate(candidateIndex + 1);
      preload.src = candidates[candidateIndex];
    };
    tryCandidate(0);
  }

  document.querySelectorAll('[data-lightbox-open]').forEach((button) => {
    button.addEventListener('click', () => {
      const card = button.closest('.project-card');
      const index = filteredProjectCards.indexOf(card);
      showLightboxPhoto(index < 0 ? 0 : index);
      openModal(projectLightbox);
    });
  });
  document.querySelector('[data-lightbox-prev]').addEventListener('click', () => showLightboxPhoto(lightboxIndex - 1));
  document.querySelector('[data-lightbox-next]').addEventListener('click', () => showLightboxPhoto(lightboxIndex + 1));

  function prepareEmail(form) {
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const customerPhone = String(data.get('phone') || '').trim();
    const service = String(data.get('service') || '').trim();
    const suburb = String(data.get('suburb') || '').trim();
    const details = String(data.get('details') || '').trim();
    const subject = `Website enquiry — ${service}`;
    const lines = [
      'Website enquiry for Top Hat Home Maintenance Services',
      '',
      `Name: ${name}`,
      `Phone: ${customerPhone}`,
      `Service: ${service}`,
      `Suburb: ${suburb || 'Not provided'}`,
      '',
      'Project details:',
      details || 'Not provided',
      '',
      'Please contact me about this enquiry.'
    ];
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
    const status = form.querySelector('[data-form-status]');
    if (status) status.textContent = 'Opening your email app… Review the message there and press Send to submit your enquiry.';
    window.location.href = url;
  }

  document.querySelectorAll('[data-enquiry-form]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      prepareEmail(form);
    });
  });
  document.querySelectorAll('a[href^="tel:"]').forEach((link) => link.setAttribute('href', `tel:${phone}`));
  document.querySelectorAll('a[href^="mailto:"]').forEach((link) => link.setAttribute('href', `mailto:${email}`));
})();
