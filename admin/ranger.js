// « Ranger par catégorie » : un tableau avec une colonne par catégorie de vidéos.
// On glisse une vidéo d'une colonne à l'autre (ou on la touche pour choisir sa catégorie),
// puis « Enregistrer » change le champ « categorie » des vidéos déplacées, en un seul enregistrement.
// L'admin (Sveltia CMS) ne sait pas déplacer une carte d'un groupe à l'autre, d'où ce tableau à part.
(() => {
  const DEPOT = 'cortotmanon2171-web/Manon-Cortot-Portfolio';
  const BRANCHE = 'main';
  const MARQUEUR = 'session-mot-de-passe'; // voir index.html : l'admin par mot de passe passe par api.php
  const SANS = ''; // colonne « Sans catégorie »

  // le style du tableau est ici plutôt que dans habillage.css : Safari peut garder une ancienne copie de habillage.css,
  // et le tableau s'ouvrait alors sans mise en page, caché sous l'admin
  const style = document.createElement('style');
  style.textContent = `
.ranger-court { display: none; }
@media (width < 768px) { .ranger-long { display: none; } .ranger-court { display: inline; } }
html.ranger-ouvert { overflow: hidden; }
.ranger {
  position: fixed; inset: 0; z-index: 2147483000; display: flex; flex-direction: column;
  font-family: var(--sui-font-family-default); color: hsl(var(--sui-foreground-color-1-hsl));
  background:
    radial-gradient(42vw 42vw at -6vw -8vw, rgb(246 218 122 / 45%), transparent 70%),
    radial-gradient(48vw 48vw at 104vw 30vh, rgb(183 185 242 / 45%), transparent 70%),
    hsl(var(--sui-background-color-2-hsl));
}
:root[data-theme="dark"] .ranger {
  background:
    radial-gradient(42vw 42vw at -6vw -8vw, rgb(246 218 122 / 12%), transparent 70%),
    radial-gradient(48vw 48vw at 104vw 30vh, rgb(183 185 242 / 16%), transparent 70%),
    hsl(var(--sui-background-color-2-hsl));
}
.ranger-haut { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px 24px 10px; flex-wrap: wrap; }
.ranger-haut h2 { font-family: var(--display); font-weight: 800; font-size: 30px; line-height: 1; margin: 0; text-transform: uppercase; letter-spacing: .01em; }
.ranger-haut p { margin: 6px 0 0; color: hsl(var(--sui-foreground-color-3-hsl)); font-size: 14px; }
.ranger-boutons { display: flex; gap: 10px; }
.ranger-boutons button {
  font: inherit; font-weight: 600; font-size: 15px; padding: 10px 18px; border-radius: 999px; cursor: pointer;
  border: 1px solid hsl(var(--sui-border-color-1-hsl)); background: transparent; color: inherit;
}
.ranger-boutons .ranger-ok { background: var(--sui-primary-accent-color); color: var(--sui-primary-accent-color-inverted); border-color: transparent; }
.ranger-boutons .ranger-ok.ranger-rien { opacity: .5; }
.ranger-boutons .ranger-ok:disabled { opacity: .6; cursor: wait; }
.ranger-haut p.ranger-alerte { color: #a3243b; font-weight: 600; animation: ranger-secoue .4s; }
:root[data-theme="dark"] .ranger-haut p.ranger-alerte { color: #ff9aae; }
@keyframes ranger-secoue { 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
.ranger-boutons button:focus-visible { outline: 3px solid #F6DA7A; outline-offset: 2px; }
.ranger-colonnes {
  flex: 1; min-height: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px;
  padding: 10px 24px 24px; overflow: auto; align-items: start; align-content: start;
}
.ranger-info { margin: 40px auto; color: hsl(var(--sui-foreground-color-3-hsl)); text-align: center; max-width: 420px; }
.ranger-colonne {
  scroll-snap-align: start; border-radius: 22px; padding: 12px; box-sizing: border-box;
  background: rgb(255 255 255 / 55%); border: 1px solid rgb(255 255 255 / 75%); box-shadow: var(--ombre-carte);
  -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px); transition: border-color .2s, box-shadow .2s, transform .2s;
}
:root[data-theme="dark"] .ranger-colonne { background: rgb(255 255 255 / 6%); border-color: rgb(255 255 255 / 12%); }
.ranger-colonne.ranger-cible { border-color: #F6DA7A; box-shadow: 0 0 0 3px rgb(246 218 122 / 70%), var(--ombre-carte); transform: translateY(-3px); }
.ranger-colonne h3 { margin: 2px 4px 10px; font-size: 15px; font-weight: 700; display: flex; justify-content: space-between; align-items: center; }
.ranger-colonne h3 span { font-size: 12px; font-weight: 600; min-width: 22px; text-align: center; padding: 2px 7px; border-radius: 999px; background: rgb(246 218 122 / 60%); color: #12224A; }
.ranger-cartes { display: grid; gap: 8px; min-height: 60px; }
.ranger-carte {
  all: unset; box-sizing: border-box; display: grid; grid-template-columns: 56px 1fr; align-items: center; gap: 10px; padding: 6px 10px 6px 6px;
  border-radius: 14px; cursor: grab; background: hsl(var(--sui-background-color-1-hsl)); border: 1px solid hsl(var(--sui-border-color-3-hsl));
  touch-action: manipulation; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; transition: transform .15s, opacity .15s;
}
.ranger-carte:hover { border-color: #F6DA7A; }
.ranger-carte:focus-visible { outline: 3px solid #F6DA7A; outline-offset: 2px; }
.ranger-carte img, .ranger-carte .ranger-vide { width: 56px; height: 56px; border-radius: 10px; object-fit: cover; background: rgb(183 185 242 / 45%); display: block; }
.ranger-carte b { font-size: 14px; font-weight: 600; line-height: 1.25; overflow-wrap: anywhere; }
.ranger-carte.bougee { border-color: #F6DA7A; box-shadow: 0 0 0 2px rgb(246 218 122 / 55%); }
.ranger-carte.ranger-souleve { opacity: .35; }
.ranger-fantome { position: fixed; left: 0; top: 0; z-index: 2147483002; pointer-events: none; cursor: grabbing; box-shadow: 0 20px 40px -12px rgb(18 34 74 / 45%); }
.ranger-depose { margin: 0; padding: 18px 8px; border: 2px dashed hsl(var(--sui-border-color-2-hsl)); border-radius: 14px; text-align: center; font-size: 13px; color: hsl(var(--sui-foreground-color-4-hsl)); }
.ranger-menu { position: fixed; inset: 0; z-index: 2147483001; display: grid; place-items: center; padding: 16px; background: rgb(18 34 74 / 35%); }
.ranger-menu-boite {
  width: 100%; max-width: 340px; max-height: 80vh; overflow: auto; box-sizing: border-box; padding: 16px; border-radius: 22px; display: grid; gap: 6px;
  background: hsl(var(--sui-background-color-1-hsl)); box-shadow: var(--ombre-carte);
}
.ranger-menu-boite p { margin: 0 4px 6px; font-size: 14px; }
.ranger-menu-boite button {
  font: inherit; font-size: 15px; text-align: left; padding: 11px 14px; border-radius: 12px; cursor: pointer; color: inherit;
  border: 1px solid hsl(var(--sui-border-color-3-hsl)); background: transparent;
}
.ranger-menu-boite button[aria-checked="true"] { background: rgb(246 218 122 / 55%); border-color: #F6DA7A; font-weight: 600; }
.ranger-menu-boite button:hover, .ranger-menu-boite button:focus-visible { border-color: #F6DA7A; outline: none; }
/* téléphone : une colonne et demie à l'écran, on glisse de gauche à droite */
@media (width < 768px) {
  .ranger-haut { padding: 14px 16px 8px; }
  .ranger-haut h2 { font-size: 26px; }
  .ranger-boutons { width: 100%; }
  .ranger-boutons button { flex: 1; }
  .ranger-colonnes { display: flex; align-items: flex-start; padding: 8px 16px 20px; scroll-snap-type: x proximity; scroll-padding-inline: 16px; }
  .ranger-colonne { flex: 0 0 72vw; }
}
`;
  document.head.append(style);

  const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const ytId = (u) => (String(u || '').match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/) || [])[1];
  const image = (v) => {
    const src = v.affiche || v.miniature || (ytId(v.lien) ? `https://i.ytimg.com/vi/${ytId(v.lien)}/mqdefault.jpg` : '');
    return src.startsWith('/') ? '..' + src : src;
  };

  // --- GitHub : par le relais api.php (connexion par mot de passe) ou directement (connexion GitHub) ---
  function acces() {
    let jeton;
    try { jeton = JSON.parse(localStorage.getItem('sveltia-cms.user'))?.token; } catch {}
    if (!jeton) return null;
    const racine = jeton === MARQUEUR ? new URL('api.php/api/v3', location.href).href : 'https://api.github.com';
    return { racine, jeton };
  }
  async function github(chemin, options = {}) {
    const a = acces();
    const reponse = await fetch(`${a.racine}/repos/${DEPOT}${chemin}`, {
      ...options,
      cache: 'no-store',
      headers: { Authorization: `token ${a.jeton}`, Accept: 'application/vnd.github+json', ...(options.body ? { 'Content-Type': 'application/json' } : {}) },
    });
    if (!reponse.ok) throw new Error(`GitHub ${reponse.status} ${chemin}`);
    return reponse.json();
  }
  const decoder = (b64) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, '')), (c) => c.charCodeAt(0)));
  const lireBlob = async (sha) => JSON.parse(decoder((await github(`/git/blobs/${sha}`)).content));

  // fiches d'un dossier à un commit donné : { chemin: sha du fichier }
  async function fiches(commit) {
    const arbre = await github(`/git/trees/${commit}?recursive=1`);
    const r = {};
    for (const f of arbre.tree) if (f.type === 'blob' && /^content\/(videos|categories-videos)\/[^/]+\.json$/.test(f.path)) r[f.path] = f.sha;
    return r;
  }

  async function charger() {
    const ref = await github(`/git/ref/heads/${BRANCHE}`);
    const shas = await fiches(ref.object.sha);
    const lus = await Promise.all(Object.entries(shas).map(async ([chemin, sha]) => ({ chemin, sha, d: await lireBlob(sha) })));
    const rang = (d) => (Number.isFinite(d.order) ? d.order : Infinity);
    const tri = (a, b) => rang(a.d) - rang(b.d) || a.chemin.localeCompare(b.chemin);
    const categories = lus.filter((f) => f.chemin.startsWith('content/categories-videos/')).sort(tri)
      .map((f) => ({ code: f.chemin.split('/').pop().slice(0, -5), nom: f.d.nom || f.chemin }));
    const videos = lus.filter((f) => f.chemin.startsWith('content/videos/')).sort(tri)
      .map((f) => ({ chemin: f.chemin, sha: f.sha, d: f.d, categorie: f.d.categorie || SANS }));
    return { categories, videos };
  }

  // un seul commit pour toutes les vidéos déplacées ; on relit chaque fiche au dernier état de main
  async function enregistrer(deplacees) {
    const ref = await github(`/git/ref/heads/${BRANCHE}`);
    const tete = ref.object.sha;
    const shas = await fiches(tete);
    const changements = await Promise.all(deplacees.map(async (v) => {
      const d = shas[v.chemin] === v.sha ? v.d : await lireBlob(shas[v.chemin]);
      return { path: v.chemin, mode: '100644', type: 'blob', content: JSON.stringify({ ...d, categorie: v.categorie }, null, 2) + '\n' };
    }));
    const commit = await github(`/git/commits/${tete}`);
    const arbre = await github('/git/trees', { method: 'POST', body: JSON.stringify({ base_tree: commit.tree.sha, tree: changements }) });
    const titres = deplacees.map((v) => v.d.titre).join(', ');
    const nouveau = await github('/git/commits', { method: 'POST', body: JSON.stringify({ message: `Vidéos rangées par catégorie : ${titres}`, tree: arbre.sha, parents: [tete] }) });
    await github(`/git/refs/heads/${BRANCHE}`, { method: 'PATCH', body: JSON.stringify({ sha: nouveau.sha }) });
  }

  // --- le tableau ---
  let fenetre;
  async function ouvrir() {
    if (fenetre) return;
    fenetre = document.createElement('div');
    fenetre.className = 'ranger';
    fenetre.setAttribute('role', 'dialog');
    fenetre.setAttribute('aria-modal', 'true');
    fenetre.setAttribute('aria-label', 'Ranger les vidéos par catégorie');
    fenetre.innerHTML = `
      <header class="ranger-haut">
        <div><h2>Ranger mes vidéos</h2><p>Glisse une vidéo dans une autre catégorie, ou touche-la pour choisir.</p></div>
        <div class="ranger-boutons"><button type="button" class="ranger-annuler">Annuler</button><button type="button" class="ranger-ok ranger-rien">Enregistrer</button></div>
      </header>
      <div class="ranger-colonnes"><p class="ranger-info">Chargement…</p></div>`;
    document.body.append(fenetre);
    document.documentElement.classList.add('ranger-ouvert');
    const colonnes = fenetre.querySelector('.ranger-colonnes');
    const ok = fenetre.querySelector('.ranger-ok');
    const fermer = () => { fenetre.remove(); fenetre = null; document.documentElement.classList.remove('ranger-ouvert'); removeEventListener('keydown', echap); };
    const echap = (e) => { if (e.key === 'Escape' && !fenetre.querySelector('.ranger-menu')) annuler(); };
    addEventListener('keydown', echap);

    if (!acces()) {
      colonnes.innerHTML = '<p class="ranger-info">Ce tableau marche quand tu es connectée à l\'admin sur manoncortot.fr.</p>';
      fenetre.querySelector('.ranger-annuler').onclick = fermer;
      return;
    }
    let donnees;
    try { donnees = await charger(); } catch (e) {
      console.error(e);
      colonnes.innerHTML = '<p class="ranger-info">Impossible de lire tes vidéos. Vérifie ta connexion et réessaie.</p>';
      fenetre.querySelector('.ranger-annuler').onclick = fermer;
      return;
    }
    const { categories, videos } = donnees;
    const depart = new Map(videos.map((v) => [v, v.categorie]));
    const deplacees = () => videos.filter((v) => v.categorie !== depart.get(v));
    const annuler = () => { if (!deplacees().length || confirm('Tu as déplacé des vidéos sans enregistrer. Les oublier ?')) fermer(); };
    fenetre.querySelector('.ranger-annuler').onclick = annuler;

    const listes = [...categories, ...(videos.some((v) => !categories.some((c) => c.code === v.categorie)) ? [{ code: SANS, nom: 'Sans catégorie' }] : [])];
    const nomDe = (code) => listes.find((c) => c.code === code)?.nom || 'Sans catégorie';
    // une vidéo dont la catégorie n'existe plus va dans « Sans catégorie »
    const colonneDe = (v) => (categories.some((c) => c.code === v.categorie) ? v.categorie : SANS);

    function afficher() {
      colonnes.innerHTML = listes.map((c) => {
        const dedans = videos.filter((v) => colonneDe(v) === c.code);
        return `<section class="ranger-colonne" data-code="${esc(c.code)}">
          <h3>${esc(c.nom)} <span>${dedans.length}</span></h3>
          <div class="ranger-cartes">${dedans.map((v) => `
            <button type="button" class="ranger-carte${v.categorie !== depart.get(v) ? ' bougee' : ''}" data-i="${videos.indexOf(v)}">
              ${image(v.d) ? `<img src="${esc(image(v.d))}" alt="" loading="lazy" draggable="false">` : '<span class="ranger-vide"></span>'}
              <b>${esc(v.d.titre)}</b>
            </button>`).join('') || '<p class="ranger-depose">Dépose une vidéo ici</p>'}</div>
        </section>`;
      }).join('');
      const n = deplacees().length;
      ok.classList.toggle('ranger-rien', !n);
      ok.textContent = n ? `Enregistrer (${n})` : 'Enregistrer';
    }
    function deplacer(v, code) {
      if (colonneDe(v) === code) return;
      v.categorie = code;
      afficher();
      colonnes.querySelector(`.ranger-carte[data-i="${videos.indexOf(v)}"]`)?.focus({ preventScroll: true });
    }

    // toucher (ou Entrée) : petit menu « Mettre dans… »
    function menu(v, carte) {
      const m = document.createElement('div');
      m.className = 'ranger-menu';
      m.innerHTML = `<div class="ranger-menu-boite" role="menu" aria-label="Mettre « ${esc(v.d.titre)} » dans"><p>Mettre <b>${esc(v.d.titre)}</b> dans :</p>
        ${listes.map((c) => `<button type="button" role="menuitemradio" aria-checked="${colonneDe(v) === c.code}" data-code="${esc(c.code)}">${esc(c.nom)}</button>`).join('')}</div>`;
      fenetre.append(m);
      const fin = () => { m.remove(); carte.isConnected ? carte.focus() : null; };
      m.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { m.remove(); deplacer(v, b.dataset.code); } else if (e.target === m) fin(); });
      m.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); fin(); } });
      m.querySelector('[aria-checked="true"]')?.focus();
    }

    // glisser : à la souris tout de suite ; au doigt après un appui long (un glissé rapide fait défiler).
    // Le doigt passe par les événements tactiles : Safari sur iPhone annule les « pointer events » dès qu'il défile.
    let glisse = null, enCours = null;
    function saisir(carte, x, y) {
      const r = carte.getBoundingClientRect();
      const fantome = carte.cloneNode(true);
      fantome.className = 'ranger-carte ranger-fantome';
      fantome.style.width = r.width + 'px';
      fenetre.append(fantome);
      carte.classList.add('ranger-souleve');
      if (navigator.vibrate) navigator.vibrate(15);
      enCours = { carte, v: videos[carte.dataset.i], fantome, dx: x - r.left, dy: y - r.top, survol: null };
      suivre(x, y);
    }
    function suivre(x, y) {
      const g = enCours;
      g.fantome.style.transform = `translate(${x - g.dx}px, ${y - g.dy}px) rotate(-2deg)`;
      const col = document.elementsFromPoint(x, y).find((el) => el.classList?.contains('ranger-colonne'));
      if (col !== g.survol) { g.survol?.classList.remove('ranger-cible'); g.survol = col; g.survol?.classList.add('ranger-cible'); }
      // faire défiler les colonnes près des bords
      const r = colonnes.getBoundingClientRect();
      if (x < r.left + 50) colonnes.scrollLeft -= 14; else if (x > r.right - 50) colonnes.scrollLeft += 14;
      if (y < r.top + 50) colonnes.scrollTop -= 14; else if (y > r.bottom - 50) colonnes.scrollTop += 14;
    }
    function poser(deposer) {
      const g = enCours;
      if (!g) return;
      enCours = null;
      g.fantome.remove(); g.survol?.classList.remove('ranger-cible'); g.carte.classList.remove('ranger-souleve');
      glisse = Date.now();
      if (deposer && g.survol) deplacer(g.v, g.survol.dataset.code);
    }

    // souris (et stylet)
    colonnes.addEventListener('pointerdown', (e) => {
      const carte = e.target.closest('.ranger-carte');
      if (!carte || e.pointerType === 'touch' || e.button > 0) return;
      const debut = { x: e.clientX, y: e.clientY };
      const bouger = (ev) => {
        if (!enCours) { if (Math.hypot(ev.clientX - debut.x, ev.clientY - debut.y) < 6) return; saisir(carte, debut.x, debut.y); }
        ev.preventDefault();
        suivre(ev.clientX, ev.clientY);
      };
      const fin = (ev) => {
        removeEventListener('pointermove', bouger); removeEventListener('pointerup', fin); removeEventListener('pointercancel', fin);
        poser(ev.type === 'pointerup');
      };
      addEventListener('pointermove', bouger);
      addEventListener('pointerup', fin);
      addEventListener('pointercancel', fin);
    });

    // doigt
    colonnes.addEventListener('touchstart', (e) => {
      const carte = e.target.closest('.ranger-carte');
      if (!carte || e.touches.length > 1) return;
      const t0 = e.touches[0], debut = { x: t0.clientX, y: t0.clientY };
      let dernier = debut;
      const attente = setTimeout(() => saisir(carte, dernier.x, dernier.y), 300);
      const bouger = (ev) => {
        const t = ev.touches[0]; dernier = { x: t.clientX, y: t.clientY };
        if (enCours) { ev.preventDefault(); suivre(t.clientX, t.clientY); return; }
        if (Math.hypot(t.clientX - debut.x, t.clientY - debut.y) > 8) fin(); // le doigt fait défiler
      };
      const fin = (ev) => {
        clearTimeout(attente);
        carte.removeEventListener('touchmove', bouger); carte.removeEventListener('touchend', fin); carte.removeEventListener('touchcancel', fin);
        if (enCours) { if (ev?.cancelable) ev.preventDefault(); poser(ev?.type === 'touchend'); }
      };
      // écouté sur la carte elle-même : sur iPhone, les événements suivent le doigt même si la carte bouge
      carte.addEventListener('touchmove', bouger, { passive: false });
      carte.addEventListener('touchend', fin);
      carte.addEventListener('touchcancel', fin);
    }, { passive: true });
    colonnes.addEventListener('contextmenu', (e) => { if (e.target.closest('.ranger-carte')) e.preventDefault(); });
    colonnes.addEventListener('click', (e) => {
      const carte = e.target.closest('.ranger-carte');
      if (!carte || (glisse && Date.now() - glisse < 300)) return;
      menu(videos[carte.dataset.i], carte);
    });

    ok.onclick = async () => {
      const liste = deplacees();
      if (!liste.length) {
        const p = fenetre.querySelector('.ranger-haut p');
        p.textContent = 'Déplace d\'abord une vidéo dans une autre colonne : le bouton « Enregistrer » s\'allume alors.';
        p.classList.remove('ranger-alerte'); void p.offsetWidth; p.classList.add('ranger-alerte');
        return;
      }
      ok.disabled = true; ok.textContent = 'Enregistrement…';
      try {
        await enregistrer(liste);
        fenetre.querySelector('.ranger-haut p').textContent = 'C\'est enregistré ! Le site se met à jour d\'ici une à deux minutes.';
        ok.textContent = 'Enregistré ✓';
        setTimeout(() => location.reload(), 1600); // l'admin relit les vidéos avec leur nouvelle catégorie
      } catch (e) {
        console.error(e);
        alert('L\'enregistrement n\'a pas marché. Vérifie ta connexion et réessaie.');
        ok.disabled = false; ok.textContent = `Enregistrer (${liste.length})`;
      }
    };
    afficher();
  }

  // bouton « Ranger par catégorie » à côté de « Réorganiser », dans la liste des vidéos
  new MutationObserver(() => {
    const ici = /^#\/collections\/videos\/?(\?.*)?$/.test(location.hash);
    const present = document.querySelector('.ranger-bouton');
    if (!ici) { present?.remove(); return; }
    const reorganiser = [...document.querySelectorAll('button')].find((b) => /^\s*(Réorganiser|Reorder)\s*$/.test(b.textContent));
    if (!reorganiser) { present?.remove(); return; }
    if (present && present.parentElement === reorganiser.parentElement) return;
    present?.remove();
    const b = document.createElement('button');
    b.type = 'button';
    b.className = reorganiser.className + ' ranger-bouton';
    b.innerHTML = '<span class="ranger-long">Ranger par catégorie</span><span class="ranger-court">Ranger</span>';
    b.title = 'Glisser les vidéos d\'une catégorie à l\'autre';
    reorganiser.before(b);
  }).observe(document.documentElement, { childList: true, subtree: true });
  // écouté sur toute la page (et avant l'admin) : le clic marche même si l'admin redessine sa barre entre-temps
  document.addEventListener('click', (e) => {
    if (!e.target.closest?.('.ranger-bouton')) return;
    e.preventDefault(); e.stopPropagation();
    ouvrir();
  }, true);
})();
