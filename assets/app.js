const body = document.body;
const menu = document.querySelector('#mobile-nav');
const toggle = document.querySelector('.menu-toggle');
const toast = document.querySelector('.toast');
let toastTimer;

function notify(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.hidden = false;
  toastTimer = setTimeout(() => { toast.hidden = true; }, 4500);
}

function setMenu(open, restoreFocus = false) {
  menu.hidden = !open;
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? body.dataset.menuClose : body.dataset.menuOpen);
  toggle.querySelector('span').textContent = open ? '×' : '☰';
  if (restoreFocus) toggle.focus();
}
toggle.addEventListener('click', () => setMenu(menu.hidden));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !menu.hidden) setMenu(false, true);
});
menu.addEventListener('click', event => {
  if (event.target.closest('a')) setMenu(false);
});
document.addEventListener('click', event => {
  if (!menu.hidden && !event.target.closest('.site-header')) setMenu(false);
});
matchMedia('(min-width: 901px)').addEventListener('change', event => {
  if (event.matches) setMenu(false);
});

function syncLanguageLinks() {
  document.querySelectorAll('[data-language-link]').forEach(link => {
    const url = new URL(link.href);
    url.hash = location.hash;
    link.href = url.href;
  });
}
window.addEventListener('hashchange', syncLanguageLinks);
syncLanguageLinks();

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    const active = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!active) return;
    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.hash === `#${active.target.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-15% 0px -45% 0px', threshold: [0, 0.15, 0.4] });
  document.querySelectorAll('main > section').forEach(section => observer.observe(section));
}

document.querySelector('[data-copy-email]').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(body.dataset.email);
    notify(body.dataset.copied);
  } catch {
    notify(body.dataset.copyError);
  }
});

document.querySelector('[data-download]').addEventListener('click', async event => {
  const button = event.currentTarget;
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  const label = button.firstChild;
  label.textContent = body.dataset.downloading;
  try {
    // No public PDF URL: the original CV is decoded only when the visitor requests it.
    const { resumes } = await import('./resumes.js');
    const resume = resumes[body.dataset.language];
    const bytes = Uint8Array.from(atob(resume.data), character => character.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = resume.filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    notify(body.dataset.downloadDone);
  } catch {
    notify(body.dataset.downloadError);
  } finally {
    label.textContent = body.dataset.downloadLabel;
    button.disabled = false;
    button.removeAttribute('aria-busy');
  }
});
