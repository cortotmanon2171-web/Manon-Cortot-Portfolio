# Mon portfolio : mise en ligne gratuite et administration

Ce dossier contient ton site complet :

- `index.html` : la page du site (design, animations).
- `content/` : tout le contenu (vidéos, photos, projets, profil), en fichiers `.json`.
- `images/` : toutes les images. Celles que tu ajoutes depuis l'admin vont dans `images/uploads/`.
- `admin/` : ton espace d'administration.
- `.nojekyll` : un petit fichier vide utile à GitHub Pages, à garder.

Tout est gratuit : GitHub héberge ton site et ton contenu, et l'admin enregistre tes modifications directement dans ton dépôt. Le site se met à jour tout seul en une minute environ.

---

## Étape 1 : créer ton dépôt GitHub (10 min, une seule fois)

1. Crée un compte gratuit sur [github.com](https://github.com). Choisis bien ton nom d'utilisateur : il apparaîtra dans l'adresse de ton site.
2. Clique sur **New repository** (bouton vert).
3. Nomme-le `portfolio`, laisse-le en **Public**, puis **Create repository**.
4. Sur la page du dépôt vide, clique sur **uploading an existing file**.
5. Ouvre ce dossier sur ton ordinateur, sélectionne **tout son contenu** (pas le dossier lui-même) et glisse-le dans la page.
   - Le fichier `.nojekyll` est invisible par défaut. Sur Mac, appuie sur `Cmd + Maj + .` pour l'afficher, sur Windows coche « Éléments masqués » dans l'onglet Affichage.
6. Clique sur **Commit changes** et attends la fin de l'envoi.

## Étape 2 : mettre le site en ligne avec GitHub Pages (2 min)

1. Dans ton dépôt, va dans **Settings** puis **Pages** (menu de gauche).
2. Dans **Source**, choisis **Deploy from a branch**.
3. Dans **Branch**, choisis `main` et `/ (root)`, puis **Save**.
4. Attends une à deux minutes et recharge la page : ton adresse s'affiche, du type `https://ton-pseudo.github.io/portfolio/`.

## Étape 3 : relier l'admin à ton dépôt (1 min)

1. Dans ton dépôt, ouvre `admin/config.yml` puis clique sur le crayon ✏️.
2. À la ligne `repo:`, remplace `TON-PSEUDO-GITHUB` par ton nom d'utilisateur GitHub.
3. Clique sur **Commit changes**.

## Étape 4 : créer ta clé d'accès à l'admin (3 min)

L'admin se connecte à GitHub avec un **jeton d'accès**, une sorte de mot de passe réservé à ton site.

1. Sur GitHub : ta photo de profil › **Settings** › **Developer settings** › **Personal access tokens** › **Fine-grained tokens** › **Generate new token**.
2. Nom : « Admin portfolio ». Durée : par exemple 1 an.
3. **Repository access** : *Only select repositories* › `portfolio`.
4. **Permissions** › **Repository permissions** › **Contents** : *Read and write*.
5. **Generate token**, puis copie le jeton. Il ne s'affiche qu'une fois : garde-le dans tes notes ou ton gestionnaire de mots de passe.
6. Va sur `https://ton-pseudo.github.io/portfolio/admin/`, choisis la connexion **avec un jeton (token)** et colle-le.

Ne partage jamais ce jeton : il permet de modifier ton site. S'il fuit, supprime-le sur GitHub et crée-en un nouveau.

---

## Utiliser l'admin

Dans le menu de gauche :

- **🎬 Vidéos** : titre, catégorie, emplacement, affiche, lien, rôles, description.
  - **Grille des films** : pour les vidéos avec une affiche au format portrait.
  - **Vlogs & formats courts** : format 16/9. Sans miniature, celle de YouTube est récupérée automatiquement grâce au lien.
  - Le lien peut être une vidéo YouTube ou un réel Instagram.
  - La catégorie « Présentation » est utilisée par le bouton « Voir mon CV vidéo ».
- **📷 Photos** : crée une série ou ajoute des photos à une série existante. La première série de la liste s'affiche en premier.
- **🎨 Com & graphisme** : tes projets de communication, avec jusqu'à 3 images.
- **📱 Maquettes Figma** : lien du fichier, lien du prototype et quelques captures d'écran de secours.
- **👤 Profil** : textes, photos, parcours, distinctions, outils, contacts et options.

Pour réordonner, fais glisser les éléments dans les listes. Clique sur **Enregistrer**, puis recharge ton site au bout d'une minute environ.

### Les maquettes Figma interactives

Sur ton site en ligne, c'est ta vraie maquette Figma qui s'affiche, et on peut cliquer sur ses boutons. Pour que ça marche :

1. **Partage** : dans Figma, bouton **Partager** › « Tous ceux qui ont le lien » › **peuvent voir**.
2. **Prototype** : dans l'onglet **Prototype** de Figma, relie tes boutons aux écrans qu'ils doivent ouvrir. Sans liens de prototype, les boutons ne font rien.
3. **Lien du prototype** : clique sur ▶ **Présenter**, puis **Partager** › **Copier le lien**, et colle-le dans le champ « Lien du prototype » de l'admin.

Les captures d'écran servent seulement de secours si Figma ne peut pas s'afficher (connexion lente, fichier privé…).

### Conseils pour les images

- Photos : exporte-les en JPEG, 2000 px maximum sur le grand côté, qualité 80. Ça garde le site rapide.
- Écrans Figma : sélectionne le cadre, puis **Export › PNG › 2x**.
- Photo détourée de l'accueil : PNG ou WebP avec fond transparent.

---

## Ton propre nom de domaine (facultatif, environ 10 €/an)

Achète un nom comme `manoncortot.fr` chez un registraire (OVH, Gandi…), puis dans **Settings › Pages › Custom domain** de ton dépôt, saisis-le et suis les indications de GitHub pour configurer le domaine.

## En cas de souci

- **La page de l'admin reste blanche** : vérifie la ligne `repo:` dans `admin/config.yml`.
- **Accès refusé à la connexion** : le jeton doit avoir *Contents : Read and write* sur le dépôt `portfolio`, et ne pas être expiré.
- **« Le contenu n'a pas pu être chargé »** : normal si tu ouvres `index.html` en double-cliquant dessus. Le site se consulte en ligne.
- **Une modification n'apparaît pas** : attends une ou deux minutes, puis recharge avec `Cmd + Maj + R` (Mac) ou `Ctrl + F5` (Windows). L'onglet **Actions** de ton dépôt montre la mise en ligne en cours.
- **Un fichier `.json` cassé** après une modification à la main : sur GitHub, ouvre le fichier puis **History** pour revenir à la version précédente.

L'admin utilise [Sveltia CMS](https://github.com/sveltia/sveltia-cms), un outil gratuit compatible avec Decap CMS. Si son écran de connexion évolue, leur documentation explique la méthode actuelle.
