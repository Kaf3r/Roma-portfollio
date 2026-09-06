const navToggle = document.getElementById('navToggle');
const nav = document.getElementById('nav');
const header = document.getElementById('header');
const navLinks = document.querySelectorAll('.nav__link');
const revealElements = document.querySelectorAll(
  '.hero__title, .hero__subtitle, .btn, .about__text, .skill-card, .project-card, .contact, .section__title'
);

function toggleMenu() {
  const isOpen = nav.classList.toggle('nav--open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
}

function closeMenu() {
  nav.classList.remove('nav--open');
  navToggle.setAttribute('aria-expanded', 'false');
}

navToggle.addEventListener('click', toggleMenu);
navLinks.forEach(link => link.addEventListener('click', closeMenu));

function getCssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function updateHeader() {
  if (window.scrollY > 20) {
    header.style.background = getCssVar('--header-bg-scrolled');
  } else {
    header.style.background = getCssVar('--header-bg');
  }
}

window.addEventListener('scroll', updateHeader, { passive: true });
window.addEventListener('themeChanged', updateHeader);

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  },
  {
    threshold: 0.15,
    rootMargin: '0px 0px -40px 0px'
  }
);

revealElements.forEach((el, index) => {
  el.classList.add('reveal');
  el.style.transitionDelay = `${index * 0.05}s`;
  observer.observe(el);
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const targetId = this.getAttribute('href');
    if (!targetId || targetId === '#') return;
    const target = document.querySelector(targetId);
    if (!target) return;
    e.preventDefault();
    const headerOffset = 64;
    const elementPosition = target.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  });
});