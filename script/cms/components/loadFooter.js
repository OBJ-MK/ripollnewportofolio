import { fetchJSON, CONFIG } from '../config/config.js';
import { mediaUrl } from '../utils/media.js';

const SERVICES_BATCH_SIZE = 6;

export async function loadFooterServices() {
    try {
        const { data } = await fetchJSON('/api/services?fields[0]=Titre');
        if (!data?.length) return;
        const footerServicesList = document.getElementById('footer-services-list');
        footerServicesList.innerHTML = data.map(s => {
            const f = CONFIG.FIELDS.service;
            const titre = s[f.Titre] || '';
            const lien = titre.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
            return `<li><a href="${'#'}${lien || '#'}">${titre}</a></li>`;
        }).join('');
        if (!footerServicesList) return;

    } catch (e) {
        console.error('[CMS] services:', e.message);
    }
}

export async function loadFooterApropo() {
    try {
        const { data } = await fetchJSON('/api/apropo?fields[0]=Paragraphe2&populate[Photo]=true');
        // Strapi v5 : champs plats directement sur data
        const attrs = data || {};
        const f = CONFIG.FIELDS.apropo;

        const footerBio = document.getElementById('footer-bio');
        if (footerBio) footerBio.textContent = attrs[f.Paragraphe2] || '';


        // Photo : Strapi v5 media plat { url, ... }
        const photoUrl = mediaUrl(attrs[f.Photo]);
        if (photoUrl) {
            const avatar = document.querySelector('.avatar-placeholder');
            if (avatar) {
                const img = document.createElement('img');
                const footerPhoto = document.getElementById('footer-photo');
                if (footerPhoto) footerPhoto.src = photoUrl;
                img.src = photoUrl;
                img.alt = 'Photo de profil';
                img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:inherit;';
                avatar.replaceWith(img);
            }
        }
    } catch (e) {
        console.error('[CMS] apropo:', e.message);
    }
}