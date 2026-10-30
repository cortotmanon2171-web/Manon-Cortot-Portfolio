// Les projets s'affichent en cartes la première fois qu'on ouvre chaque collection
// (ensuite l'admin retient le choix fait avec les boutons liste / grille).
new MutationObserver(() => {
  const liste = document.querySelector('#entry-list');
  const collection = (location.hash.match(/collections\/([^/?]+)/) || [])[1];
  if (!liste || !collection || liste.closest('.grid-view')) return;
  const bouton = document.querySelector('[aria-label="Vue grille"], [aria-label="Grid View"], [aria-label="Passer à la vue grille"], [aria-label="Switch to Grid View"]');
  if (!bouton) return;
  try {
    const cle = 'portfolio-admin-cartes-' + collection;
    if (localStorage.getItem(cle)) return;
    localStorage.setItem(cle, '1');
  } catch { return; }
  bouton.click();
}).observe(document.documentElement, { childList: true, subtree: true });
