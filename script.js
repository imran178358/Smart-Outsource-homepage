const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const prefersReducedMotion = motionPreference.matches;
const isDesignCapture = window.location.hash.includes('figmacapture=');

const buttonArrow = '<svg class="button-arrow" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M7.5 4L13.5 10L7.5 16"/><path class="button-arrow-line" d="M13.5 10H0"/></svg>';
document.querySelectorAll('.button, .link-arrow').forEach((button) => button.insertAdjacentHTML('beforeend', buttonArrow));

const heroTitle = document.querySelector('#hero-title');
let heroWordIndex = 0;

heroTitle?.querySelectorAll(':scope > span, :scope > em').forEach((line) => {
  const words = line.textContent.trim().split(/\s+/);
  line.textContent = '';
  words.forEach((word, index) => {
    const wordElement = document.createElement('span');
    wordElement.className = 'hero-word';
    wordElement.textContent = word;
    wordElement.style.setProperty('--word-index', heroWordIndex++);
    line.append(wordElement);
    if (index < words.length - 1) line.append(' ');
  });
});

if (document.documentElement.classList.contains('hero-motion')) {
  const heroImage = document.querySelector('.hero-visual img');
  const startHeroReveal = () => requestAnimationFrame(() => requestAnimationFrame(() => {
    document.documentElement.classList.add('hero-revealed');
  }));
  // Wait for the photo so the clip-path reveal never uncovers an empty frame.
  Promise.race([
    heroImage?.decode?.() ?? Promise.resolve(),
    new Promise((resolve) => setTimeout(resolve, 1200))
  ]).catch(() => {}).finally(startHeroReveal);
}

const leadForm = document.querySelector('#lead-form');
const fieldMessages = {
  name: 'Please enter your name.',
  email: 'Please enter a valid business email.',
  phone: 'Please enter a phone number we can reach you on.',
  support: 'Please choose the support you need.'
};

function validateField(field) {
  const label = field.closest('label');
  if (!label) return true;
  const valid = field.checkValidity();
  let error = label.querySelector('.field-error');
  label.classList.toggle('is-invalid', !valid);
  field.setAttribute('aria-invalid', String(!valid));

  if (valid) {
    error?.remove();
    field.removeAttribute('aria-describedby');
    return true;
  }

  if (!error) {
    error = document.createElement('span');
    error.className = 'field-error';
    error.id = `${field.name}-error`;
    error.setAttribute('role', 'alert');
    label.append(error);
  }
  error.textContent = fieldMessages[field.name] || field.validationMessage;
  field.setAttribute('aria-describedby', error.id);
  return false;
}

const formSuccess = document.querySelector('.form-success');
const formHeading = document.querySelector('.form-heading');
const submitLabel = leadForm?.querySelector('button[type="submit"]')?.textContent;

function showFormSuccess(name) {
  if (!formSuccess) return;
  const firstName = name.trim().split(/\s+/)[0];
  formSuccess.querySelector('.success-title').textContent = firstName
    ? `Thanks, ${firstName}! Your request is in.`
    : 'Thanks! Your request is in.';
  leadForm.hidden = true;
  if (formHeading) formHeading.hidden = true;
  formSuccess.hidden = false;
  formSuccess.focus();
}

function resetLeadForm() {
  if (!leadForm || !formSuccess || formSuccess.hidden) return;
  leadForm.reset();
  leadForm.querySelectorAll('.field-error').forEach((error) => error.remove());
  leadForm.querySelectorAll('.is-invalid').forEach((label) => label.classList.remove('is-invalid'));
  leadForm.querySelectorAll('[aria-invalid]').forEach((field) => field.removeAttribute('aria-invalid'));
  const button = leadForm.querySelector('button[type="submit"]');
  button.textContent = submitLabel;
  button.insertAdjacentHTML('beforeend', buttonArrow);
  leadForm.hidden = false;
  if (formHeading) formHeading.hidden = false;
  formSuccess.hidden = true;
}

if (leadForm) {
  leadForm.noValidate = true;
  const fields = [...leadForm.querySelectorAll('input, select')];

  fields.forEach((field) => {
    field.addEventListener('blur', () => { if (field.value) validateField(field); });
    field.addEventListener('input', () => {
      if (field.closest('label')?.classList.contains('is-invalid')) validateField(field);
    });
    field.addEventListener('change', () => validateField(field));
  });

  leadForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const invalid = fields.filter((field) => !validateField(field));
    if (invalid.length) {
      invalid[0].focus();
      return;
    }

    const button = leadForm.querySelector('button[type="submit"]');
    button.classList.add('is-loading');
    button.setAttribute('aria-busy', 'true');
    button.textContent = 'Sending';
    window.setTimeout(() => {
      button.classList.remove('is-loading');
      button.removeAttribute('aria-busy');
      showFormSuccess(leadForm.elements.name.value);
    }, 900);
  });
}

document.querySelectorAll('[data-support]').forEach((link) => {
  link.addEventListener('click', () => {
    const select = document.querySelector('select[name="support"]');
    if (select) select.value = link.dataset.support;
  });
});

const modal = document.querySelector('#staffing-plan');
const closeButton = modal?.querySelector('.modal-close');
const pageSurfaces = [
  document.querySelector('.site-header'),
  document.querySelector('main'),
  document.querySelector('footer'),
  document.querySelector('.mobile-cta')
].filter(Boolean);
let lastFocusedElement;
let modalCloseTimer;

function openStaffingPlan() {
  if (!modal) return;
  lastFocusedElement = document.activeElement;
  modal.hidden = false;
  window.clearTimeout(modalCloseTimer);
  modal.classList.remove('is-leaving');
  if (!prefersReducedMotion) {
    modal.classList.add('is-entering');
    modal.addEventListener('animationend', () => modal.classList.remove('is-entering'), { once: true });
  }
  pageSurfaces.forEach((surface) => { surface.inert = true; });
  document.body.classList.add('modal-open');
  requestAnimationFrame(() => modal.querySelector('input[name="name"]')?.focus());
}

function closeStaffingPlan() {
  if (!modal || modal.hidden) return;
  if (prefersReducedMotion) {
    modal.hidden = true;
    resetLeadForm();
  } else {
    modal.classList.remove('is-entering');
    modal.classList.add('is-leaving');
    modalCloseTimer = window.setTimeout(() => {
      modal.hidden = true;
      modal.classList.remove('is-leaving');
      resetLeadForm();
    }, 200);
  }
  pageSurfaces.forEach((surface) => { surface.inert = false; });
  document.body.classList.remove('modal-open');
  if (window.location.hash === '#staffing-plan') history.replaceState(null, '', window.location.pathname);
  lastFocusedElement?.focus();
}

document.querySelectorAll('a[href="#staffing-plan"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    openStaffingPlan();
  });
});

closeButton?.addEventListener('click', closeStaffingPlan);
formSuccess?.querySelector('.success-done')?.addEventListener('click', closeStaffingPlan);
modal?.addEventListener('click', (event) => {
  if (event.target === modal) closeStaffingPlan();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && modal && !modal.hidden) closeStaffingPlan();
  if (event.key !== 'Tab' || !modal || modal.hidden) return;
  const focusable = [...modal.querySelectorAll('button, input, select, textarea, a[href]')]
    .filter((element) => !element.disabled && element.offsetParent !== null);
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
});
if (window.location.hash === '#staffing-plan') openStaffingPlan();

const menuToggle = document.querySelector('.menu-toggle');
const mainNavigation = document.querySelector('#main-nav');

function setMenuOpen(open) {
  if (!menuToggle || !mainNavigation) return;
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  mainNavigation.classList.toggle('is-open', open);
}

menuToggle?.addEventListener('click', () => {
  setMenuOpen(menuToggle.getAttribute('aria-expanded') !== 'true');
});
mainNavigation?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenuOpen(false)));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') setMenuOpen(false);
});
window.addEventListener('resize', () => {
  if (window.innerWidth > 760) setMenuOpen(false);
});

const trustTabs = [...document.querySelectorAll('.trust-tabs [role="tab"]')];
const trustImages = [...document.querySelectorAll('[data-trust-image]')];
const trustNotes = [...document.querySelectorAll('[data-trust-note]')];

let activeTrustIndex = trustTabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true');

function positionTrustImages() {
  trustImages.forEach((image, index) => image.style.setProperty('--slide', index - activeTrustIndex));
  // Each note rides on the same strip as its photo.
  trustNotes.forEach((note) => {
    const imageIndex = trustImages.findIndex((image) => image.dataset.trustImage === note.dataset.trustNote);
    note.style.setProperty('--slide', imageIndex - activeTrustIndex);
  });
}

function activateTrustTab(nextTab, moveFocus = false) {
  if (!nextTab) return;
  const nextIndex = trustTabs.indexOf(nextTab);
  const direction = Math.sign(nextIndex - activeTrustIndex);
  activeTrustIndex = nextIndex;

  trustTabs.forEach((tab) => {
    const isActive = tab === nextTab;
    const panel = document.querySelector(`#${tab.getAttribute('aria-controls')}`);
    tab.setAttribute('aria-selected', String(isActive));
    tab.tabIndex = isActive ? 0 : -1;
    if (panel) panel.hidden = !isActive;

    if (panel && isActive && direction && !prefersReducedMotion) {
      // Rivian-style: content travels with the strip, fast out of the gate and easing to rest.
      panel.animate([
        { opacity: 0, transform: `translateX(${direction * 72}px)` },
        { opacity: 1, transform: 'translateX(0)' }
      ], { duration: 900, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' });
    }
  });

  const imageKey = nextTab.id.replace('trust-tab-', '');
  trustImages.forEach((image) => {
    const isActive = image.dataset.trustImage === imageKey;
    image.classList.toggle('is-active', isActive);
    image.setAttribute('aria-hidden', String(!isActive));
  });
  positionTrustImages();

  trustNotes.forEach((note) => {
    const isActive = note.dataset.trustNote === imageKey;
    note.classList.toggle('is-active', isActive);
    note.setAttribute('aria-hidden', String(!isActive));
  });

  if (moveFocus) nextTab.focus();
}

positionTrustImages();
requestAnimationFrame(() => requestAnimationFrame(() => {
  document.querySelector('.trust-visual')?.classList.add('is-ready');
}));

trustTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateTrustTab(tab));
  tab.addEventListener('keydown', (event) => {
    let nextIndex;

    if (event.key === 'ArrowRight') nextIndex = (index + 1) % trustTabs.length;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + trustTabs.length) % trustTabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = trustTabs.length - 1;

    if (nextIndex === undefined) return;
    event.preventDefault();
    activateTrustTab(trustTabs[nextIndex], true);
  });
});

const whyTrack = document.querySelector('#why-track');
const whyPrevious = document.querySelector('.why-prev');
const whyNext = document.querySelector('.why-next');
let whyScrollFrame;

function updateWhyControls() {
  if (!whyTrack || !whyPrevious || !whyNext) return;
  const maxScroll = Math.max(0, whyTrack.scrollWidth - whyTrack.clientWidth);
  whyPrevious.disabled = whyTrack.scrollLeft <= 2;
  whyNext.disabled = whyTrack.scrollLeft >= maxScroll - 2;
}

function moveWhyTrack(direction) {
  if (!whyTrack) return;
  const card = whyTrack.querySelector('.why-card');
  const gap = Number.parseFloat(getComputedStyle(whyTrack).columnGap) || 0;
  const distance = (card?.getBoundingClientRect().width || whyTrack.clientWidth) + gap;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  whyTrack.scrollBy({ left: direction * distance, behavior: reducedMotion ? 'auto' : 'smooth' });
}

whyPrevious?.addEventListener('click', () => moveWhyTrack(-1));
whyNext?.addEventListener('click', () => moveWhyTrack(1));
whyTrack?.addEventListener('keydown', (event) => {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  event.preventDefault();
  moveWhyTrack(event.key === 'ArrowRight' ? 1 : -1);
});
whyTrack?.addEventListener('scroll', () => {
  cancelAnimationFrame(whyScrollFrame);
  whyScrollFrame = requestAnimationFrame(updateWhyControls);
}, { passive: true });
window.addEventListener('resize', updateWhyControls);
updateWhyControls();

const processSteps = [...document.querySelectorAll('.process-step')];
const reduceProcessMotion = prefersReducedMotion || isDesignCapture;

if (processSteps.length && 'IntersectionObserver' in window && !reduceProcessMotion) {
  processSteps.forEach((step) => step.classList.add('is-reveal-ready'));

  const processObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: .18, rootMargin: '0px 0px -10% 0px' });

  requestAnimationFrame(() => processSteps.forEach((step) => processObserver.observe(step)));
}

function animateFaqAnswer(answer, expand) {
  if (!answer) return;
  answer.getAnimations().forEach((animation) => animation.cancel());

  if (prefersReducedMotion || !answer.animate) {
    answer.hidden = !expand;
    return;
  }

  if (expand) answer.hidden = false;
  const height = answer.scrollHeight;
  const animation = answer.animate([
    { height: expand ? '0px' : `${height}px`, opacity: expand ? 0 : 1 },
    { height: expand ? `${height}px` : '0px', opacity: expand ? 1 : 0 }
  ], {
    duration: expand ? 320 : 220,
    easing: 'cubic-bezier(.2,.8,.2,1)'
  });

  animation.onfinish = () => {
    if (!expand) answer.hidden = true;
  };
}

document.querySelectorAll('.faq-item button').forEach((button) => {
  button.addEventListener('click', () => {
    const item = button.closest('.faq-item');
    const answer = item.querySelector('.faq-answer');
    const expanded = button.getAttribute('aria-expanded') === 'true';

    document.querySelectorAll('.faq-item button').forEach((otherButton) => {
      if (otherButton === button) return;
      otherButton.setAttribute('aria-expanded', 'false');
      otherButton.querySelector('i').textContent = '+';
      const otherAnswer = otherButton.closest('.faq-item').querySelector('.faq-answer');
      if (!otherAnswer.hidden) animateFaqAnswer(otherAnswer, false);
    });

    button.setAttribute('aria-expanded', String(!expanded));
    button.querySelector('i').textContent = expanded ? '+' : '−';
    animateFaqAnswer(answer, !expanded);
  });
});

const siteHeader = document.querySelector('.site-header');
let pageChromeFrame;

function updatePageChrome() {
  pageChromeFrame = undefined;
  const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const progress = Math.min(1, Math.max(0, window.scrollY / scrollable));
  siteHeader?.style.setProperty('--scroll-progress', progress);
  siteHeader?.classList.toggle('is-scrolled', window.scrollY > 18);
}

function requestPageChromeUpdate() {
  if (pageChromeFrame) return;
  pageChromeFrame = requestAnimationFrame(updatePageChrome);
}

window.addEventListener('scroll', requestPageChromeUpdate, { passive: true });
window.addEventListener('resize', requestPageChromeUpdate);
updatePageChrome();

const navigationLinks = [...document.querySelectorAll('.site-header nav a[href^="#"]')];
const navigationSections = navigationLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

if ('IntersectionObserver' in window && navigationSections.length) {
  const navigationObserver = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;

    navigationLinks.forEach((link) => {
      const active = link.getAttribute('href') === `#${visible.target.id}`;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-28% 0px -58% 0px', threshold: [0, .15, .45] });

  navigationSections.forEach((section) => navigationObserver.observe(section));
}

// Two-row testimonial marquee: top row drifts left, bottom row drifts right.
const testimonialCloud = document.querySelector('.testimonial-cloud');
const marqueeSpeed = 35.8; // px per second, matched to the client logo strip
const testimonialSets = [];

if (testimonialCloud) {
  const quotes = [...testimonialCloud.querySelectorAll('blockquote')];
  const rowOrders = [quotes, [...quotes.slice(2), ...quotes.slice(0, 2)]];
  testimonialCloud.textContent = '';
  testimonialCloud.classList.add('is-marquee');

  rowOrders.forEach((order, rowIndex) => {
    const row = document.createElement('div');
    row.className = 'testimonial-row';
    // The second row repeats the same quotes, so screen readers only hear the first.
    if (rowIndex > 0) row.setAttribute('aria-hidden', 'true');
    const track = document.createElement('div');
    track.className = `testimonial-track${rowIndex > 0 ? ' is-reverse' : ''}`;
    const set = document.createElement('div');
    set.className = 'testimonial-set';
    order.forEach((quote) => set.append(rowIndex === 0 ? quote : quote.cloneNode(true)));
    const loopCopy = set.cloneNode(true);
    loopCopy.setAttribute('aria-hidden', 'true');
    track.append(set, loopCopy);
    row.append(track);
    testimonialCloud.append(row);
    testimonialSets.push(set);
  });

  const setTestimonialSpeed = () => testimonialSets.forEach((set) => {
    set.parentElement.style.setProperty('--marquee-duration', `${set.getBoundingClientRect().width / marqueeSpeed}s`);
  });
  setTestimonialSpeed();
  window.addEventListener('resize', setTestimonialSpeed);
}

const revealElements = [...document.querySelectorAll([
  '.client-strip',
  '.trust .section-lead',
  '.trust-feature',
  '.problem-section .section-lead',
  '.challenge-list article',
  '.solution-copy',
  '.solution-media',
  '.proof-strip',
  '.services-lead',
  '.service-list article',
  '.why-header',
  '.why-card',
  '.comparison-intro',
  '.comparison-card',
  '.industries-lead',
  '.industry-grid article',
  '.process-intro',
  '.testimonials h2',
  '.testimonial-cloud',
  '.faq-intro',
  '.accordion',
  '.final-cta > *'
].join(','))];

if (revealElements.length && 'IntersectionObserver' in window && !prefersReducedMotion && !isDesignCapture) {
  document.documentElement.classList.add('motion-enabled');

  const siblingCounts = new Map();
  revealElements.forEach((element) => {
    element.dataset.reveal = '';
    const parent = element.parentElement;
    const siblingIndex = siblingCounts.get(parent) || 0;
    element.style.setProperty('--reveal-delay', `${Math.min(siblingIndex * 70, 210)}ms`);
    siblingCounts.set(parent, siblingIndex + 1);
  });

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-revealed');
      observer.unobserve(entry.target);
    });
  }, { threshold: .12, rootMargin: '0px 0px -8% 0px' });

  requestAnimationFrame(() => revealElements.forEach((element) => revealObserver.observe(element)));
}

if (whyTrack && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  let dragStartX = 0;
  let dragStartScroll = 0;
  let dragMoved = false;

  whyTrack.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    dragStartX = event.clientX;
    dragStartScroll = whyTrack.scrollLeft;
    dragMoved = false;
    whyTrack.setPointerCapture(event.pointerId);
  });

  whyTrack.addEventListener('pointermove', (event) => {
    if (!whyTrack.hasPointerCapture(event.pointerId)) return;
    const distance = event.clientX - dragStartX;
    if (!dragMoved && Math.abs(distance) < 5) return;
    dragMoved = true;
    whyTrack.classList.add('is-dragging');
    whyTrack.scrollLeft = dragStartScroll - distance;
  });

  const endDrag = (event) => {
    if (!whyTrack.hasPointerCapture(event.pointerId)) return;
    whyTrack.releasePointerCapture(event.pointerId);
    // Restoring scroll-snap lets the browser settle onto the nearest card.
    whyTrack.classList.remove('is-dragging');
  };

  whyTrack.addEventListener('pointerup', endDrag);
  whyTrack.addEventListener('pointercancel', endDrag);
}

const countTargets = [...document.querySelectorAll('.proof-strip strong, .saving-callout strong')]
  .filter((element) => /\d/.test(element.textContent));

if (countTargets.length && 'IntersectionObserver' in window && !prefersReducedMotion && !isDesignCapture) {
  const countObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      const element = entry.target;
      const original = element.textContent;
      const match = original.match(/\d+/);
      const target = Number(match[0]);
      const start = performance.now();
      const duration = 1200;
      element.setAttribute('aria-label', original);

      const tick = (now) => {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = original.replace(match[0], String(Math.round(target * eased)));
        if (progress < 1) requestAnimationFrame(tick);
        else element.textContent = original;
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: .6 });

  countTargets.forEach((element) => countObserver.observe(element));
}

const backToTop = document.createElement('button');
backToTop.type = 'button';
backToTop.className = 'back-to-top';
backToTop.setAttribute('aria-label', 'Back to top');
backToTop.innerHTML = '<span aria-hidden="true">↑</span>';
backToTop.tabIndex = -1;
document.body.append(backToTop);
pageSurfaces.push(backToTop);

backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  document.querySelector('.site-header a')?.focus({ preventScroll: true });
});

let backToTopFrame;
window.addEventListener('scroll', () => {
  if (backToTopFrame) return;
  backToTopFrame = requestAnimationFrame(() => {
    backToTopFrame = undefined;
    const visible = window.scrollY > window.innerHeight * 1.2;
    backToTop.classList.toggle('is-visible', visible);
    backToTop.tabIndex = visible ? 0 : -1;
  });
}, { passive: true });

const serviceTagLists = [...document.querySelectorAll('.service-list ul')];

if (serviceTagLists.length && 'IntersectionObserver' in window && !prefersReducedMotion && !isDesignCapture) {
  document.documentElement.classList.add('chips-ready');
  serviceTagLists.forEach((list) => {
    [...list.children].forEach((tag, index) => tag.style.setProperty('--chip-delay', `${150 + index * 50}ms`));
  });

  const tagObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('chips-in');
      observer.unobserve(entry.target);
      // Drop the stagger once revealed so hover colour changes respond instantly.
      window.setTimeout(() => {
        [...entry.target.children].forEach((tag) => tag.style.removeProperty('--chip-delay'));
      }, 150 + entry.target.children.length * 50 + 400);
    });
  }, { threshold: .6 });

  serviceTagLists.forEach((list) => tagObserver.observe(list));
}

const finalCta = document.querySelector('.final-cta');

if (finalCta && document.documentElement.classList.contains('motion-enabled')) {
  const ringObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('rings-in');
      observer.unobserve(entry.target);
    });
  }, { threshold: .35 });
  ringObserver.observe(finalCta);
}
