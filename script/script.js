// ─── SIDEBAR MOBILE ───
// (L'ancien observer ".fade-in" a été retiré : la révélation au scroll
// passe désormais par le système GSAP centralisé, voir utils/animations.js)
const sidebar = document.querySelector('.side');
const hamburgerBtn = document.querySelector('.logo > div:first-child');
const closeTrigger = document.querySelector('.sideDroite');
const sidebarClose = document.querySelector('.sidelogo-fabar');
const sideLinks = document.querySelectorAll('.sidenav-links a');

function openSidebar() {
  sidebar.classList.add('open');
  document.body.classList.add('sidebar-open');
  document.body.style.overflow = 'hidden';
}

function closeSidebar() {
  sidebar.classList.remove('open');
  document.body.classList.remove('sidebar-open');
  document.body.style.overflow = '';
}

if (hamburgerBtn) hamburgerBtn.addEventListener('click', e => { e.stopPropagation(); openSidebar(); });
if (closeTrigger) closeTrigger.addEventListener('click', closeSidebar);
if (sidebarClose) sidebarClose.addEventListener('click', e => { e.stopPropagation(); closeSidebar(); });
sideLinks.forEach(link => link.addEventListener('click', closeSidebar));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSidebar(); });