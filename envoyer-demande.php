<?php
// =====================================================================
//  Formulaire « Demander un devis » de la partie Contact
//
//  Le site envoie la demande ici (sur Hostinger) et ce fichier l'envoie par e-mail
//  à l'adresse « E-mail » du profil (admin › Profil, à propos & contact).
//  Rien n'est enregistré sur le serveur, à part un compteur anti-abus par adresse IP.
//  Si l'envoi échoue (ou sur GitHub Pages, qui ne lit pas le PHP), le site propose
//  d'ouvrir la messagerie du visiteur avec le message déjà rempli.
// =====================================================================
declare(strict_types=1);

const ENVOIS_MAX = 5;            // demandes par adresse IP…
const FENETRE = 3600;            // …par heure
const EXPEDITEUR = 'contact@manoncortot.fr';

header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function repondre(int $code, array $donnees): never {
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode($donnees, JSON_UNESCAPED_UNICODE);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') repondre(405, ['erreur' => 'Méthode non autorisée.']);

// champ caché que seuls les robots remplissent : on fait comme si tout allait bien
if (trim((string) ($_POST['site_web'] ?? '')) !== '') repondre(200, ['ok' => true]);

// une ligne, sans retour à la ligne (évite d'injecter des en-têtes d'e-mail)
function ligne(string $nom, int $max = 200): string {
  $v = trim(preg_replace('/[\r\n\t]+/', ' ', (string) ($_POST[$nom] ?? '')));
  return mb_substr($v, 0, $max);
}

$nom = ligne('nom', 120);
$email = ligne('email', 160);
$telephone = ligne('telephone', 40);
$projet = ligne('projet', 120);
$date = ligne('date', 80);
$budget = ligne('budget', 80);
$message = mb_substr(trim((string) ($_POST['message'] ?? '')), 0, 5000);

if ($nom === '' || $message === '') repondre(422, ['erreur' => 'Merci d’indiquer ton nom et ton message.']);
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) repondre(422, ['erreur' => 'L’adresse e-mail ne semble pas valide.']);

// --- limite anti-abus, par adresse IP (fichier hors du site si possible) ---
$dossier = is_writable(dirname(__DIR__)) ? dirname(__DIR__) : sys_get_temp_dir();
$fichier = $dossier . '/formulaire-contact-envois.json';
$tous = is_file($fichier) ? json_decode((string) file_get_contents($fichier), true) : [];
if (!is_array($tous)) $tous = [];
$maintenant = time();
$ip = hash('sha256', $_SERVER['REMOTE_ADDR'] ?? '');
$tous = array_filter(array_map(fn ($l) => array_values(array_filter((array) $l, fn ($t) => $t > $maintenant - FENETRE)), $tous));
if (count($tous[$ip] ?? []) >= ENVOIS_MAX) repondre(429, ['erreur' => 'Trop de demandes envoyées. Réessaie dans une heure ou écris-moi directement.']);

// --- destinataire : l'e-mail du profil ---
$profil = json_decode((string) @file_get_contents(__DIR__ . '/content/profil.json'), true);
$destinataire = is_array($profil) ? trim((string) ($profil['email'] ?? '')) : '';
if (!filter_var($destinataire, FILTER_VALIDATE_EMAIL)) $destinataire = EXPEDITEUR;
// l'expéditeur doit être une adresse du domaine, sinon l'e-mail part en indésirables
$expediteur = str_ends_with(strtolower($destinataire), '@manoncortot.fr') ? $destinataire : EXPEDITEUR;

$sujet = 'Demande de devis : ' . ($projet !== '' ? $projet : 'nouveau projet') . ' (' . $nom . ')';
$corps = "Nouvelle demande depuis manoncortot.fr\n\n"
  . "Nom : $nom\n"
  . "E-mail : $email\n"
  . ($telephone !== '' ? "Téléphone : $telephone\n" : '')
  . ($projet !== '' ? "Type de projet : $projet\n" : '')
  . ($date !== '' ? "Date souhaitée : $date\n" : '')
  . ($budget !== '' ? "Budget : $budget\n" : '')
  . "\nMessage :\n$message\n\n"
  . "Pour répondre, utilise simplement « Répondre » : la réponse ira à $email.\n";

$entetes = [
  'From' => 'Site Manon Cortot <' . $expediteur . '>',
  'Reply-To' => $email,
  'MIME-Version' => '1.0',
  'Content-Type' => 'text/plain; charset=UTF-8',
  'Content-Transfer-Encoding' => '8bit',
];

$envoye = mail($destinataire, '=?UTF-8?B?' . base64_encode($sujet) . '?=', $corps, $entetes, '-f' . $expediteur);
if (!$envoye) repondre(502, ['erreur' => 'L’envoi n’a pas fonctionné.']);

$tous[$ip][] = $maintenant;
@file_put_contents($fichier, json_encode($tous), LOCK_EX);
repondre(200, ['ok' => true]);
