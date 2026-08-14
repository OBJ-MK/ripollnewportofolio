import { apiUrl } from '../config/config.js';

export async function loadComments(articleId, container) {
  const res = await fetch(
    apiUrl(`/api/comments?filters[blog_article][documentId][$eq]=${articleId}&sort=createdAt:desc`)
  );
  const { data } = await res.json();

  container.innerHTML = data.length
    ? data.map(c => `
        <div class="comment">
          <strong>${escapeHtml(c.author_name)}</strong>
          <p>${escapeHtml(c.content)}</p>
        </div>
      `).join('')
    : '<p class="no-comments">Aucun commentaire pour l\'instant.</p>';
}

export function initCommentForm(form, articleId, onSuccess) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);

    const payload = {
      author_name: formData.get('author_name'),
      author_email: formData.get('author_email'),
      content: formData.get('content'),
      blog_article: articleId,
      website: formData.get('website') // honeypot, doit rester vide
    };

    try {
      const res = await fetch(apiUrl('/api/comments'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: payload })
      });
      if (!res.ok) throw new Error('Erreur envoi');

      form.reset();
      onSuccess?.();
    } catch (err) {
      console.error('Erreur commentaire:', err);
      alert('Une erreur est survenue, réessaie.');
    }
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}