/* modal/poste-modal.js
 * Role: modal détail d'un poste + génération PDF/Word à la volée (100% client, aucune charge serveur)
 */

import { CONFIG } from '../config/config.js';
import { getFocusables } from '../utils/dom-helpers.js';

let _modalTrigger = null;
let _modalKeyHandler = null;
let _currentPoste = null;

export function openPosteModal(poste) {
  const f = CONFIG.FIELDS.poste;
  const modal = document.getElementById('poste-modal');
  if (!modal) return;

  _currentPoste = poste;

  const titre = poste[f.Titre] || '';
  const entreprise = poste[f.Entreprise] || '';
  const localisation = poste[f.Localisation] || '';
  const temps = poste[f.Temps] || '';
  const salaire = poste[f.Salaire] || '';
  const statut = poste[f.Statut] || 'Disponible';
  const desc = poste[f.Description] || '';

  modal.querySelector('#poste-modal-titre').textContent = titre;
  modal.querySelector('#poste-modal-entreprise').textContent = entreprise;

  const statutEl = modal.querySelector('#poste-modal-statut');
  statutEl.textContent = statut;
  statutEl.className = 'poste-badge ' + (statut === 'Disponible' ? 'badge-open' : 'badge-closed');

  const metaEl = modal.querySelector('#poste-modal-meta');
  const metaItems = [
    localisation && `📍 ${localisation}`,
    temps && `⏱ ${temps}`,
    salaire && `💶 ${salaire}`,
  ].filter(Boolean);
  metaEl.innerHTML = metaItems.map(m => `<span class="modal-badge">${m}</span>`).join('');

  modal.querySelector('#poste-modal-desc').innerHTML = desc ? `<p>${desc}</p>` : '';

  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  _modalTrigger = document.activeElement;
  modal.querySelector('.modal-close').focus();

  _modalKeyHandler = e => {
    if (e.key === 'Escape') { closePosteModal(); return; }
    if (e.key !== 'Tab') return;
    const focusables = getFocusables(modal.querySelector('.modal-panel'));
    if (!focusables.length) { e.preventDefault(); return; }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };
  document.addEventListener('keydown', _modalKeyHandler);
}

export function closePosteModal() {
  const modal = document.getElementById('poste-modal');
  if (!modal) return;
  modal.hidden = true;
  document.body.style.overflow = '';
  if (_modalKeyHandler) { document.removeEventListener('keydown', _modalKeyHandler); _modalKeyHandler = null; }
  if (_modalTrigger) { _modalTrigger.focus(); _modalTrigger = null; }
  _currentPoste = null;
}

/* ── PDF (html2pdf.js) ───────────────────────────────── */

function buildFicheHTML(poste) {
  const f = CONFIG.FIELDS.poste;
  const titre = poste[f.Titre] || '';
  const entreprise = poste[f.Entreprise] || '';
  const localisation = poste[f.Localisation] || '';
  const temps = poste[f.Temps] || '';
  const salaire = poste[f.Salaire] || '';
  const statut = poste[f.Statut] || 'Disponible';
  const desc = poste[f.Description] || '';

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'width:700px;padding:48px;font-family:Lexend,Arial,sans-serif;background:#0b0d14;color:#eef0f8;';
  wrapper.innerHTML = `
    <div style="border-bottom:2px solid #f5c518;padding-bottom:20px;margin-bottom:28px;">
      <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#f5c518;font-weight:600;margin-bottom:10px;">Fiche de poste</div>
      <h1 style="font-size:26px;font-weight:800;margin:0 0 6px;letter-spacing:-0.02em;">${titre}</h1>
      <div style="font-size:14px;color:#f5c518;font-weight:500;">${entreprise}</div>
    </div>
    <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:24px;">
      ${localisation ? `<div style="font-size:12px;padding:6px 14px;border-radius:20px;background:rgba(245,197,24,0.08);border:0.5px solid rgba(245,197,24,0.2);">📍 ${localisation}</div>` : ''}
      ${temps ? `<div style="font-size:12px;padding:6px 14px;border-radius:20px;background:rgba(245,197,24,0.08);border:0.5px solid rgba(245,197,24,0.2);">⏱ ${temps}</div>` : ''}
      ${salaire ? `<div style="font-size:12px;padding:6px 14px;border-radius:20px;background:rgba(245,197,24,0.08);border:0.5px solid rgba(245,197,24,0.2);">💶 ${salaire}</div>` : ''}
      <div style="font-size:12px;padding:6px 14px;border-radius:20px;background:${statut === 'Disponible' ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.05)'};border:0.5px solid ${statut === 'Disponible' ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.1)'};color:${statut === 'Disponible' ? '#4ade80' : '#eef0f8'};">${statut}</div>
    </div>
    <div style="font-size:14px;line-height:1.8;color:rgba(238,240,248,0.85);white-space:pre-wrap;">${desc}</div>
    <div style="margin-top:40px;padding-top:16px;border-top:0.5px solid rgba(255,255,255,0.1);font-size:11px;color:rgba(238,240,248,0.4);">
      Généré depuis ripolldarcia.com
    </div>
  `;
  return wrapper;
}

export function downloadPostePDF() {
  if (!_currentPoste || typeof html2pdf === 'undefined') {
    console.error('[poste-modal] html2pdf indisponible ou aucun poste sélectionné');
    return;
  }
  const el = buildFicheHTML(_currentPoste);
  document.body.appendChild(el); // html2pdf doit mesurer un élément réellement dans le DOM

  const f = CONFIG.FIELDS.poste;
  const filename = `fiche-poste-${(_currentPoste[f.Titre] || 'poste').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`;

  html2pdf()
    .set({
      margin: 0,
      filename,
      html2canvas: { backgroundColor: '#0b0d14', scale: 2 },
      jsPDF: { unit: 'px', format: [796, Math.max(el.scrollHeight, 600)], orientation: 'portrait' },
    })
    .from(el)
    .save()
    .then(() => el.remove())
    .catch(err => { console.error('[poste-modal] erreur PDF:', err); el.remove(); });
}

/* ── Word (docx.js) ──────────────────────────────────── */

export async function downloadPosteWord() {
  if (!_currentPoste || typeof docx === 'undefined') {
    console.error('[poste-modal] docx.js indisponible ou aucun poste sélectionné');
    return;
  }
  const f = CONFIG.FIELDS.poste;
  const titre = _currentPoste[f.Titre] || '';
  const entreprise = _currentPoste[f.Entreprise] || '';
  const localisation = _currentPoste[f.Localisation] || '';
  const temps = _currentPoste[f.Temps] || '';
  const salaire = _currentPoste[f.Salaire] || '';
  const statut = _currentPoste[f.Statut] || 'Disponible';
  const desc = _currentPoste[f.Description] || '';

  const { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle } = docx;

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          spacing: { after: 100 },
          border: { bottom: { color: 'F5C518', space: 4, style: BorderStyle.SINGLE, size: 12 } },
          children: [new TextRun({ text: 'FICHE DE POSTE', bold: true, size: 18 })],
        }),
        new Paragraph({
          heading: HeadingLevel.TITLE,
          spacing: { before: 200, after: 80 },
          children: [new TextRun({ text: titre, bold: true, size: 44 })],
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: entreprise, color: 'B8960E', bold: true, size: 26 })],
        }),
        new Paragraph({
          spacing: { after: 300 },
          children: [
            localisation && new TextRun({ text: `📍 ${localisation}    `, size: 22 }),
            temps && new TextRun({ text: `⏱ ${temps}    `, size: 22 }),
            salaire && new TextRun({ text: `💶 ${salaire}    `, size: 22 }),
            new TextRun({ text: statut, bold: true, size: 22 }),
          ].filter(Boolean),
        }),
        ...desc.split('\n').filter(Boolean).map(line =>
          new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: line, size: 22 })] })
        ),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const filename = `fiche-poste-${titre.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.docx`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function initPosteModalListeners() {
  const modal = document.getElementById('poste-modal');
  if (!modal) return;
  modal.querySelector('.modal-overlay').addEventListener('click', closePosteModal);
  modal.querySelector('.modal-close').addEventListener('click', closePosteModal);
  modal.querySelector('#poste-download-pdf').addEventListener('click', downloadPostePDF);
  modal.querySelector('#poste-download-word').addEventListener('click', downloadPosteWord);
}