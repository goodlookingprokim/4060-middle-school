const root = document.documentElement;
root.classList.add('is-enhanced');

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const revealItems = [...document.querySelectorAll('.reveal')];

if (reducedMotion.matches || !('IntersectionObserver' in window)) {
  revealItems.forEach((item) => item.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.08 });

  revealItems.forEach((item) => revealObserver.observe(item));
}

const tablist = document.querySelector('[data-step-tabs]');
const tabs = tablist ? [...tablist.querySelectorAll('button')] : [];
const diagram = document.querySelector('.diagram');

function selectStage(selectedTab, moveFocus = false) {
  tabs.forEach((tab) => {
    const selected = tab === selectedTab;
    const panel = document.getElementById(tab.dataset.panel);

    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    panel.hidden = !selected;

    if (selected && !reducedMotion.matches) {
      panel.classList.remove('is-entering');
      requestAnimationFrame(() => panel.classList.add('is-entering'));
    }
  });

  if (diagram) diagram.dataset.stage = selectedTab.dataset.stage;
  if (moveFocus) selectedTab.focus();
}

if (tablist && tabs.length) {
  tablist.setAttribute('role', 'tablist');
  tablist.setAttribute('aria-label', 'NFC 삽입 과정');

  tabs.forEach((tab) => {
    const panel = document.getElementById(tab.dataset.panel);
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panel.id);
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);

    tab.addEventListener('click', () => selectStage(tab));
    tab.addEventListener('keydown', (event) => {
      const currentIndex = tabs.indexOf(tab);
      let nextIndex;

      if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
      if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = tabs.length - 1;
      if (nextIndex === undefined) return;

      event.preventDefault();
      selectStage(tabs[nextIndex], true);
    });
  });

  selectStage(tabs[0]);
}

const photoDialog = document.getElementById('photo-dialog');
const expandedPhoto = document.getElementById('photo-expanded');
const photoCaption = document.getElementById('photo-caption');
let photoTrigger = null;
if (photoDialog && typeof photoDialog.showModal === 'function') {
  document.querySelectorAll('[data-photo]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      photoTrigger = link;
      expandedPhoto.src = link.href;
      expandedPhoto.parentElement.classList.toggle('is-rotated', link.dataset.orientation === 'left');
      expandedPhoto.alt = link.querySelector('img').alt;
      photoCaption.textContent = link.dataset.caption;
      photoDialog.showModal();
    });
  });
  photoDialog.querySelector('.dialog-close').addEventListener('click', () => photoDialog.close());
  photoDialog.addEventListener('click', (event) => {
    if (event.target !== photoDialog) return;
    const bounds = photoDialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) photoDialog.close();
  });
  photoDialog.addEventListener('close', () => {
    if (photoTrigger) photoTrigger.focus({ preventScroll: true });
  });
}
reducedMotion.addEventListener('change', (event) => {
  if (event.matches) revealItems.forEach((item) => item.classList.add('is-visible'));
});
