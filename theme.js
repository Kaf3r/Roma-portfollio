const THEME_KEY = 'theme';
const html = document.documentElement;
const toggleBtn = document.getElementById('themeToggle');

function getCssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function getTheme() {
  return html.getAttribute('data-theme') || 'dark';
}

function setTheme(theme) {
  html.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
}

function updateHeaderTheme() {
  const header = document.getElementById('header');
  if (!header) return;
  const scrolled = window.scrollY > 20;
  const bgVar = scrolled ? '--header-bg-scrolled' : '--header-bg';
  header.style.background = getCssVar(bgVar);
}

function toggleTheme() {
  const current = getTheme();
  setTheme(current === 'dark' ? 'light' : 'dark');
  updateHeaderTheme();
  window.dispatchEvent(new CustomEvent('themeChanged'));
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) {
    html.setAttribute('data-theme', saved);
  }
  updateHeaderTheme();
}

if (toggleBtn) {
  toggleBtn.addEventListener('click', toggleTheme);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTheme);
} else {
  initTheme();
}