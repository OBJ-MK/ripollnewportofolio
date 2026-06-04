function setFilter(type, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const secArticles = document.getElementById('section-articles');
  const secArticlesRow2 = document.getElementById('articles-row2');
  const secSocial = document.getElementById('section-social');
  const lblArticles = document.getElementById('lbl-articles');
  const lblSocial = document.getElementById('lbl-social');

  const showArticles = type === 'all' || type === 'article';
  const showSocial = type === 'all' || type === 'linkedin' || type === 'instagram' || type === 'twitter';

  const toggleVisibility = (el, show) => {
    if (!el) return;
    el.style.display = show ? '' : 'none';
    // Cache aussi les points de navigation du carrousel s'ils existent (voisin direct)
    const next = el.nextElementSibling;
    if (next && next.classList.contains('carousel-dots')) {
      next.style.display = show ? '' : 'none';
    }
  };

  toggleVisibility(secArticles, showArticles);
  toggleVisibility(secArticlesRow2, showArticles);
  toggleVisibility(lblArticles, showArticles);
  toggleVisibility(secSocial, showSocial);
  toggleVisibility(lblSocial, showSocial);

  if (type === 'linkedin' || type === 'instagram' || type === 'twitter') {
    document.querySelectorAll('.social-card').forEach(card => {
      card.style.display = card.classList.contains(type) ? 'block' : 'none';
    });
  } else {
    document.querySelectorAll('.social-card').forEach(card => {
      card.style.display = 'block';
    });
  }
}