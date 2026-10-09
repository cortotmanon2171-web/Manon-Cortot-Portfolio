// Rassemble les fiches de l'admin (un fichier par projet, ex. content/videos/dreamboss.json)
// dans le fichier unique que lit le site (ex. content/videos.json), dans l'ordre choisi dans l'admin.
// Lancé automatiquement par .github/workflows/assembler-contenu.yml ; à la main : node .github/scripts/assembler-contenu.mjs
import { readdir, readFile, writeFile } from "node:fs/promises";

const COLLECTIONS = { videos: "videos", photos: "series", graphisme: "projets", maquettes: "maquettes" };

let change = false;
for (const [dossier, cle] of Object.entries(COLLECTIONS)) {
  const fichiers = (await readdir(`content/${dossier}`)).filter(f => f.endsWith(".json")).sort();
  const fiches = await Promise.all(fichiers.map(async f => ({ f, d: JSON.parse(await readFile(`content/${dossier}/${f}`, "utf8")) })));
  // « order » est écrit par l'admin quand on glisse les cartes ; sans numéro, la fiche va à la fin
  const rang = d => Number.isFinite(d.order) ? d.order : Infinity;
  fiches.sort((a, b) => rang(a.d) - rang(b.d) || a.f.localeCompare(b.f));
  const texte = JSON.stringify({ [cle]: fiches.map(({ d: { order, ...reste } }) => reste) }, null, 2) + "\n";
  const avant = await readFile(`content/${dossier}.json`, "utf8").catch(() => "");
  if (texte !== avant) { await writeFile(`content/${dossier}.json`, texte); change = true; console.log(`content/${dossier}.json mis à jour (${fiches.length})`); }
}
if (!change) console.log("Rien à changer");
