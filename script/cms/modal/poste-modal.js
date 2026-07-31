/* modal/poste-modal.js
 * Role: modal détail d'un poste + génération PDF/Word à la volée (100% client, aucune charge serveur)
 * — fiche de poste (déjà existant) + CV dynamique orienté selon le poste cliqué (nouveau)
 */

import { CONFIG } from '../config/config.js';
import { getFocusables } from '../utils/dom-helpers.js';
import { CV_DATA, getCvProfile, getCompetencesOrdonnees } from '../data/cv-data.js';

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

/* ── Fiche de poste — PDF (html2pdf.js) ──────────────── */

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
      html2canvas: { backgroundColor: '#0b0d14', scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    })
    .from(el)
    .save()
    .then(() => el.remove())
    .catch(err => { console.error('[poste-modal] erreur PDF:', err); el.remove(); });
}

/* ── Fiche de poste — Word (docx.js) ─────────────────── */

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

/* ── CV dynamique orienté par poste — PDF (html2pdf.js) ──────────────
 * Reprend le contenu réel du CV de Ripoll (data/cv-data.js) et adapte
 * l'entête, l'accroche et l'ordre des compétences selon l'intitulé du
 * poste cliqué (ex: "Community Manager" ≠ "Rédacteur en chef"). */

function buildCvHTML(poste) {
  const f = CONFIG.FIELDS.poste;
  const titrePoste = poste ? poste[f.Titre] || '' : '';
  const profile = getCvProfile(titrePoste);
  const competences = getCompetencesOrdonnees(profile);
  const { nom, contact, formation, experiences, outils, certifications, qualites } = CV_DATA;

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'width:760px;padding:52px;font-family:Lexend,Arial,sans-serif;background:#0b0d14;color:#eef0f8;';
  wrapper.innerHTML = `
    <div style="border-bottom:2px solid #f5c518;padding-bottom:24px;margin-bottom:28px;">
      <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#f5c518;font-weight:600;margin-bottom:10px;">
        Candidature — ${titrePoste || 'CV'}
      </div>
      <h1 style="font-size:28px;font-weight:800;margin:0 0 6px;letter-spacing:-0.02em;">${nom}</h1>
      <div style="font-size:15px;color:#f5c518;font-weight:600;margin-bottom:14px;">${profile.headline}</div>
      <div style="display:flex;gap:14px;flex-wrap:wrap;font-size:11.5px;color:rgba(238,240,248,0.55);">
        <span>📍 ${contact.localisation}</span>
        <span>📞 ${contact.telephone}</span>
        <span>✉️ ${contact.email}</span>
        <span>🔗 ${contact.linkedin}</span>
        <span>🌐 ${contact.portfolio}</span>
      </div>
    </div>

    <div style="font-size:13.5px;line-height:1.8;color:rgba(238,240,248,0.85);margin-bottom:32px;">
      ${profile.accroche}
    </div>

    <h2 style="font-size:13px;letter-spacing:0.06em;text-transform:uppercase;color:#f5c518;border-bottom:0.5px solid rgba(255,255,255,0.1);padding-bottom:8px;margin-bottom:16px;">
      Expériences professionnelles
    </h2>
    ${experiences.map(exp => `
      <div style="margin-bottom:18px;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:8px;">
          <div style="font-size:13.5px;font-weight:700;">${exp.poste}</div>
          <div style="font-size:11px;color:rgba(238,240,248,0.4);">${exp.periode}</div>
        </div>
        <div style="font-size:12px;color:#f5c518;margin-bottom:6px;">${exp.entreprise}</div>
        <ul style="margin:0;padding-left:18px;font-size:12.5px;line-height:1.7;color:rgba(238,240,248,0.75);">
          ${exp.taches.map(t => `<li>${t}</li>`).join('')}
        </ul>
      </div>
    `).join('')}

    <h2 style="font-size:13px;letter-spacing:0.06em;text-transform:uppercase;color:#f5c518;border-bottom:0.5px solid rgba(255,255,255,0.1);padding-bottom:8px;margin:28px 0 16px;">
      Formation académique
    </h2>
    ${formation.map(fo => `
      <div style="margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:8px;">
          <div style="font-size:13px;font-weight:700;">${fo.titre}</div>
          <div style="font-size:11px;color:rgba(238,240,248,0.4);">${fo.periode}</div>
        </div>
        <div style="font-size:12px;color:rgba(238,240,248,0.6);">${fo.etablissement}</div>
      </div>
    `).join('')}

    <div style="display:flex;gap:40px;margin-top:28px;flex-wrap:wrap;">
      <div style="flex:1;min-width:220px;">
        <h2 style="font-size:13px;letter-spacing:0.06em;text-transform:uppercase;color:#f5c518;border-bottom:0.5px solid rgba(255,255,255,0.1);padding-bottom:8px;margin-bottom:14px;">
          Compétences
        </h2>
        <ul style="margin:0;padding-left:18px;font-size:12.5px;line-height:1.8;color:rgba(238,240,248,0.8);">
          ${competences.map(c => `<li>${c}</li>`).join('')}
        </ul>
      </div>
      <div style="flex:1;min-width:220px;">
        <h2 style="font-size:13px;letter-spacing:0.06em;text-transform:uppercase;color:#f5c518;border-bottom:0.5px solid rgba(255,255,255,0.1);padding-bottom:8px;margin-bottom:14px;">
          Outils
        </h2>
        <ul style="margin:0;padding-left:18px;font-size:12.5px;line-height:1.8;color:rgba(238,240,248,0.8);">
          ${outils.map(o => `<li>${o}</li>`).join('')}
        </ul>
      </div>
    </div>

    <div style="display:flex;gap:40px;margin-top:28px;flex-wrap:wrap;">
      <div style="flex:1;min-width:220px;">
        <h2 style="font-size:13px;letter-spacing:0.06em;text-transform:uppercase;color:#f5c518;border-bottom:0.5px solid rgba(255,255,255,0.1);padding-bottom:8px;margin-bottom:14px;">
          Certifications &amp; Formations
        </h2>
        ${certifications.map(c => `
          <div style="font-size:12px;margin-bottom:8px;color:rgba(238,240,248,0.75);">
            <strong style="color:#eef0f8;">${c.annee} — ${c.titre}</strong><br>
            <span style="color:rgba(238,240,248,0.5);">${c.organisme}</span>
          </div>
        `).join('')}
      </div>
      <div style="flex:1;min-width:220px;">
        <h2 style="font-size:13px;letter-spacing:0.06em;text-transform:uppercase;color:#f5c518;border-bottom:0.5px solid rgba(255,255,255,0.1);padding-bottom:8px;margin-bottom:14px;">
          Qualités professionnelles
        </h2>
        <ul style="margin:0;padding-left:18px;font-size:12.5px;line-height:1.8;color:rgba(238,240,248,0.8);">
          ${qualites.map(q => `<li>${q}</li>`).join('')}
        </ul>
      </div>
    </div>

    <div style="margin-top:40px;padding-top:16px;border-top:0.5px solid rgba(255,255,255,0.1);font-size:11px;color:rgba(238,240,248,0.4);">
      CV généré automatiquement depuis ripolldarcia.com — orienté pour le poste « ${titrePoste || 'non spécifié'} »
    </div>
  `;
  return wrapper;
}

export function downloadCvPDF(posteOverride) {
  const poste = posteOverride || _currentPoste;
  if (typeof html2pdf === 'undefined') {
    console.error('[poste-modal] html2pdf indisponible');
    return;
  }
  const el = buildCvHTML(poste);
  document.body.appendChild(el);

  const f = CONFIG.FIELDS.poste;
  const titrePoste = poste ? poste[f.Titre] || 'poste' : 'poste';
  const filename = `cv-ripoll-darcia-${titrePoste.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`;

  html2pdf()
    .set({
      margin: 0,
      filename,
      html2canvas: { backgroundColor: '#0b0d14', scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    })
    .from(el)
    .save()
    .then(() => el.remove())
    .catch(err => { console.error('[poste-modal] erreur CV PDF:', err); el.remove(); });
}

/* ── CV dynamique orienté par poste — Word (docx.js) ─────────────── */

export async function downloadCvWord(posteOverride) {
  const poste = posteOverride || _currentPoste;
  if (typeof docx === 'undefined') {
    console.error('[poste-modal] docx.js indisponible');
    return;
  }

  const f = CONFIG.FIELDS.poste;
  const titrePoste = poste ? poste[f.Titre] || '' : '';
  const profile = getCvProfile(titrePoste);
  const competences = getCompetencesOrdonnees(profile);
  const { nom, contact, formation, experiences, outils, certifications, qualites } = CV_DATA;

  const { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle } = docx;

  const enfants = [
    new Paragraph({
      spacing: { after: 60 },
      border: { bottom: { color: 'F5C518', space: 4, style: BorderStyle.SINGLE, size: 12 } },
      children: [new TextRun({ text: `CANDIDATURE — ${titrePoste || 'CV'}`.toUpperCase(), bold: true, size: 16 })],
    }),
    new Paragraph({
      heading: HeadingLevel.TITLE,
      spacing: { before: 200, after: 40 },
      children: [new TextRun({ text: nom, bold: true, size: 44 })],
    }),
    new Paragraph({
      spacing: { after: 160 },
      children: [new TextRun({ text: profile.headline, color: 'B8960E', bold: true, size: 26 })],
    }),
    new Paragraph({
      spacing: { after: 240 },
      children: [
        new TextRun({ text: `📍 ${contact.localisation}    📞 ${contact.telephone}    ✉️ ${contact.email}`, size: 18 }),
      ],
    }),
    new Paragraph({
      spacing: { after: 280 },
      children: [new TextRun({ text: profile.accroche, size: 22 })],
    }),
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 100, after: 140 },
      children: [new TextRun({ text: 'EXPÉRIENCES PROFESSIONNELLES', bold: true, size: 22, color: 'F5C518' })],
    }),
  ];

  experiences.forEach((exp) => {
    enfants.push(
      new Paragraph({
        spacing: { after: 20 },
        children: [
          new TextRun({ text: `${exp.poste}  —  `, bold: true, size: 22 }),
          new TextRun({ text: exp.periode, size: 20, color: '888888' }),
        ],
      }),
      new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({ text: exp.entreprise, italics: true, size: 20, color: 'B8960E' })],
      })
    );
    exp.taches.forEach((tache) => {
      enfants.push(
        new Paragraph({ bullet: { level: 0 }, spacing: { after: 60 }, children: [new TextRun({ text: tache, size: 20 })] })
      );
    });
  });

  enfants.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 140 },
      children: [new TextRun({ text: 'FORMATION ACADÉMIQUE', bold: true, size: 22, color: 'F5C518' })],
    })
  );
  formation.forEach((fo) => {
    enfants.push(
      new Paragraph({
        spacing: { after: 20 },
        children: [
          new TextRun({ text: `${fo.titre}  —  `, bold: true, size: 22 }),
          new TextRun({ text: fo.periode, size: 20, color: '888888' }),
        ],
      }),
      new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: fo.etablissement, size: 20 })] })
    );
  });

  enfants.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 140 },
      children: [new TextRun({ text: 'COMPÉTENCES', bold: true, size: 22, color: 'F5C518' })],
    })
  );
  competences.forEach((c) => {
    enfants.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 60 }, children: [new TextRun({ text: c, size: 20 })] }));
  });

  enfants.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 140 },
      children: [new TextRun({ text: 'OUTILS', bold: true, size: 22, color: 'F5C518' })],
    })
  );
  outils.forEach((o) => {
    enfants.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 60 }, children: [new TextRun({ text: o, size: 20 })] }));
  });

  enfants.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 140 },
      children: [new TextRun({ text: 'CERTIFICATIONS & FORMATIONS', bold: true, size: 22, color: 'F5C518' })],
    })
  );
  certifications.forEach((c) => {
    enfants.push(
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({ text: `${c.annee} — ${c.titre}`, bold: true, size: 20 }),
          new TextRun({ text: `  (${c.organisme})`, size: 20, color: '888888' }),
        ],
      })
    );
  });

  enfants.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 140 },
      children: [new TextRun({ text: 'QUALITÉS PROFESSIONNELLES', bold: true, size: 22, color: 'F5C518' })],
    })
  );
  qualites.forEach((q) => {
    enfants.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 60 }, children: [new TextRun({ text: q, size: 20 })] }));
  });

  const doc = new Document({ sections: [{ properties: {}, children: enfants }] });

  const blob = await Packer.toBlob(doc);
  const filename = `cv-ripoll-darcia-${(titrePoste || 'poste').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.docx`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ── Écoute des clics ─────────────────────────────────
 * Les 4 boutons (fiche PDF/Word + CV PDF/Word) sont tous à l'intérieur du
 * modal poste-modal, jamais sur la carte — évite par construction le bug
 * "clic sur la carte au lieu du bouton" rencontré précédemment. */
export function initPosteModalListeners() {
  const modal = document.getElementById('poste-modal');
  if (!modal) return;
  modal.querySelector('.modal-overlay').addEventListener('click', closePosteModal);
  modal.querySelector('.modal-close').addEventListener('click', closePosteModal);
  modal.querySelector('#poste-download-pdf').addEventListener('click', downloadPostePDF);
  modal.querySelector('#poste-download-word').addEventListener('click', downloadPosteWord);
  modal.querySelector('#poste-download-cv-pdf')?.addEventListener('click', () => downloadCvPDF());
  modal.querySelector('#poste-download-cv-word')?.addEventListener('click', () => downloadCvWord());
}