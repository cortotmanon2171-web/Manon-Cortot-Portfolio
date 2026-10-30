// « Ranger par catégorie » : un tableau avec une colonne par catégorie de vidéos.
// On glisse une vidéo d'une colonne à l'autre (ou on la touche pour choisir sa catégorie),
// puis « Enregistrer » change le champ « categorie » des vidéos déplacées, en un seul enregistrement.
// L'admin (Sveltia CMS) ne sait pas déplacer une carte d'un groupe à l'autre, d'où ce tableau à part.
(() => {
  const DEPOT = 'cortotmanon2171-web/Manon-Cortot-Portfolio';
  const BRANCHE = 'main';
  const MARQUEUR = 'session-mot-de-passe'; // voir index.html : l'admin par mot de passe passe par api.php
  const SANS = ''; // colonne « Sans catégorie »

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
        <div class="ranger-boutons"><button type="button" class="ranger-annuler">Annuler</button><button type="button" class="ranger-ok" disabled>Enregistrer</button></div>
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
      ok.disabled = !n;
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

    // glisser : souris tout de suite, doigt après un appui long (sinon on fait défiler)
    let glisse = null;
    colonnes.addEventListener('pointerdown', (e) => {
      const carte = e.target.closest('.ranger-carte');
      if (!carte || e.button > 0) return;
      const v = videos[carte.dataset.i];
      const debut = { x: e.clientX, y: e.clientY };
      let attente = null, actif = false, fantome = null, survol = null;
      const commencer = () => {
        actif = true;
        const r = carte.getBoundingClientRect();
        fantome = carte.cloneNode(true);
        fantome.className = 'ranger-carte ranger-fantome';
        fantome.style.width = r.width + 'px';
        fantome.dx = debut.x - r.left; fantome.dy = debut.y - r.top;
        fenetre.append(fantome);
        carte.classList.add('ranger-souleve');
        if (navigator.vibrate) navigator.vibrate(15);
      };
      const bouger = (ev) => {
        if (!actif) {
          if (Math.hypot(ev.clientX - debut.x, ev.clientY - debut.y) < 6) return;
          if (e.pointerType !== 'mouse') { clearTimeout(attente); return arreter(); } // le doigt défile
          commencer();
        }
        ev.preventDefault();
        fantome.style.transform = `translate(${ev.clientX - fantome.dx}px, ${ev.clientY - fantome.dy}px) rotate(-2deg)`;
        const col = document.elementsFromPoint(ev.clientX, ev.clientY).find((el) => el.classList?.contains('ranger-colonne'));
        if (col !== survol) { survol?.classList.remove('ranger-cible'); survol = col; survol?.classList.add('ranger-cible'); }
        // faire défiler les colonnes près des bords
        const r = colonnes.getBoundingClientRect();
        if (ev.clientX < r.left + 50) colonnes.scrollLeft -= 14; else if (ev.clientX > r.right - 50) colonnes.scrollLeft += 14;
        if (ev.clientY < r.top + 50) colonnes.scrollTop -= 14; else if (ev.clientY > r.bottom - 50) colonnes.scrollTop += 14;
      };
      const lacher = () => {
        const etait = actif, cible = survol;
        arreter();
        if (etait) { glisse = Date.now(); if (cible) deplacer(v, cible.dataset.code); }
      };
      const arreter = () => {
        clearTimeout(attente);
        removeEventListener('pointermove', bouger); removeEventListener('pointerup', lacher); removeEventListener('pointercancel', arreter);
        carte.removeEventListener('touchmove', bloquer);
        fantome?.remove(); survol?.classList.remove('ranger-cible'); carte.classList.remove('ranger-souleve');
        actif = false;
      };
      const bloquer = (ev) => { if (actif) ev.preventDefault(); };
      addEventListener('pointermove', bouger, { passive: false });
      addEventListener('pointerup', lacher);
      addEventListener('pointercancel', arreter);
      carte.addEventListener('touchmove', bloquer, { passive: false });
      if (e.pointerType !== 'mouse') attente = setTimeout(commencer, 280);
    });
    colonnes.addEventListener('contextmenu', (e) => { if (e.target.closest('.ranger-carte')) e.preventDefault(); });
    colonnes.addEventListener('click', (e) => {
      const carte = e.target.closest('.ranger-carte');
      if (!carte || (glisse && Date.now() - glisse < 300)) return;
      menu(videos[carte.dataset.i], carte);
    });

    ok.onclick = async () => {
      const liste = deplacees();
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
    if (present && present.nextElementSibling === reorganiser) return;
    present?.remove();
    const b = document.createElement('button');
    b.type = 'button';
    b.className = reorganiser.className + ' ranger-bouton';
    b.innerHTML = '<span class="ranger-long">Ranger par catégorie</span><span class="ranger-court">Ranger</span>';
    b.title = 'Glisser les vidéos d\'une catégorie à l\'autre';
    b.addEventListener('click', ouvrir);
    reorganiser.before(b);
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
