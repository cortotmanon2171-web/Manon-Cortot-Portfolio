<?php
// =====================================================================
//  Admin par mot de passe (admin/) : le petit serveur de manoncortot.fr
//
//  - /etat, /installation, /connexion, /deconnexion : la porte d'entrée par mot de passe.
//  - /api/v3/… et /graphql : relais vers GitHub. L'admin (Sveltia CMS) lui parle comme à GitHub,
//    et c'est ce fichier qui ajoute le vrai jeton GitHub, gardé sur le serveur.
//    Les enregistrements restent donc des commits sur main : Hostinger et GitHub Pages
//    se mettent à jour comme avec l'admin habituel.
//
//  Le mot de passe (chiffré) et le jeton sont rangés dans un fichier AU-DESSUS de public_html,
//  que le site ne sert jamais et que les déploiements n'écrasent pas.
//  Pour tout remettre à zéro (mot de passe oublié, nouveau jeton) : supprimer ce fichier
//  dans le gestionnaire de fichiers Hostinger, puis rouvrir manoncortot.fr/admin/.
// =====================================================================
declare(strict_types=1);

const DEPOT = 'cortotmanon2171-web/Manon-Cortot-Portfolio';
const PROPRIETAIRE = 'cortotmanon2171-web';
const MARQUEUR = 'session-mot-de-passe';       // faux jeton donné à l'admin, remplacé ici par le vrai
const COOKIE = 'admin_session';
const DUREE_SESSION = 365 * 24 * 3600;     // « se souvenir de moi » : un an, prolongé à chaque visite
const DUREE_COURTE = 12 * 3600;            // sinon
const ESSAIS_MAX = 5;                       // puis 15 minutes d'attente
const ATTENTE = 15 * 60;

$dossierSecret = getenv('GESTION_DOSSIER_SECRET') ?: dirname(__DIR__, 2);
$fichierSecret = $dossierSecret . '/admin-portfolio-secret.php';
$fichierEssais = $dossierSecret . '/admin-portfolio-essais.json';
$apiGithub = getenv('GESTION_API_GITHUB') ?: 'https://api.github.com';

header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function repondre(int $code, array $donnees): never {
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode($donnees, JSON_UNESCAPED_UNICODE);
  exit;
}

function lireSecret(string $fichier): ?array {
  if (!is_file($fichier)) return null;
  $secret = include $fichier;
  return is_array($secret) ? $secret : null;
}

function corpsJson(): array {
  $donnees = json_decode((string) file_get_contents('php://input'), true);
  return is_array($donnees) ? $donnees : [];
}

function exigerPost(): void {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') repondre(405, ['erreur' => 'Méthode non autorisée.']);
  // un formulaire d'un autre site ne peut pas envoyer de JSON : ça bloque les requêtes forgées
  if (!str_starts_with($_SERVER['CONTENT_TYPE'] ?? '', 'application/json')) repondre(415, ['erreur' => 'Format attendu : JSON.']);
}

function signature(string $cle, int $expiration, string $souvenir): string {
  return hash_hmac('sha256', 'admin|' . $expiration . '|' . $souvenir, $cle);
}

// « Se souvenir de moi » coché : un an, prolongé à chaque visite. Sinon : jusqu'à la fermeture du navigateur (12 h au plus).
function ouvrirSession(array $secret, bool $souvenir): void {
  $expiration = time() + ($souvenir ? DUREE_SESSION : DUREE_COURTE);
  $s = $souvenir ? '1' : '0';
  setcookie(COOKIE, $expiration . '.' . $s . '.' . signature($secret['cle'], $expiration, $s), [
    'expires' => $souvenir ? $expiration : 0, 'path' => '/admin/', 'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    'httponly' => true, 'samesite' => 'Strict',
  ]);
}

// renvoie null si pas de session valide, sinon si « se souvenir de moi » était coché
function session(?array $secret): ?bool {
  if (!$secret) return null;
  [$expiration, $s, $sig] = array_pad(explode('.', $_COOKIE[COOKIE] ?? '', 3), 3, '');
  $valide = ctype_digit($expiration) && (int) $expiration > time() && in_array($s, ['0', '1'], true)
    && hash_equals(signature($secret['cle'], (int) $expiration, $s), $sig);
  return $valide ? $s === '1' : null;
}
function sessionValide(?array $secret): bool {
  return session($secret) !== null;
}

// Appel à GitHub avec un jeton donné ; renvoie [code, en-têtes, corps].
function appelerGithub(string $url, string $jeton, string $methode = 'GET', ?string $corps = null, array $entetes = []): array {
  $recus = [];
  $c = curl_init($url);
  curl_setopt_array($c, [
    CURLOPT_CUSTOMREQUEST => $methode,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 120,
    CURLOPT_ENCODING => '',
    CURLOPT_HTTPHEADER => array_merge([
      'Authorization: Bearer ' . $jeton,
      'User-Agent: portfolio-manon-admin',
    ], $entetes),
    CURLOPT_HEADERFUNCTION => function ($c, $ligne) use (&$recus) {
      $morceaux = explode(':', $ligne, 2);
      if (count($morceaux) === 2) $recus[strtolower(trim($morceaux[0]))] = trim($morceaux[1]);
      return strlen($ligne);
    },
  ]);
  if ($corps !== null) curl_setopt($c, CURLOPT_POSTFIELDS, $corps);
  $reponse = curl_exec($c);
  $code = $reponse === false ? 502 : (int) curl_getinfo($c, CURLINFO_RESPONSE_CODE);
  curl_close($c);
  return [$code, $recus, $reponse === false ? '' : $reponse];
}

// --- limite des essais de mot de passe, par adresse IP ---
function essais(string $fichier): array {
  $tous = is_file($fichier) ? json_decode((string) file_get_contents($fichier), true) : [];
  return is_array($tous) ? $tous : [];
}
function noterEssais(string $fichier, array $tous): void {
  $maintenant = time();
  $tous = array_filter($tous, fn ($e) => ($e['jusqua'] ?? 0) > $maintenant || ($e['depuis'] ?? 0) > $maintenant - ATTENTE);
  file_put_contents($fichier, json_encode($tous), LOCK_EX);
}

// --- aiguillage ---
$chemin = $_SERVER['PATH_INFO'] ?? '';
if ($chemin === '') {
  $uri = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?: '';
  $position = strpos($uri, '/api.php');
  $chemin = $position === false ? '' : substr($uri, $position + strlen('/api.php'));
}
$secret = lireSecret($fichierSecret);

switch ($chemin) {
  case '/etat':
    $souvenir = session($secret);
    if ($souvenir) ouvrirSession($secret, true); // chaque visite repart pour un an
    repondre(200, ['installe' => (bool) $secret, 'connecte' => $souvenir !== null]);

  case '/installation':
    exigerPost();
    if ($secret) repondre(409, ['erreur' => 'L\'admin est déjà installé.']);
    $donnees = corpsJson();
    $motDePasse = (string) ($donnees['motDePasse'] ?? '');
    $jeton = trim((string) ($donnees['jeton'] ?? ''));
    if (mb_strlen($motDePasse) < 8) repondre(400, ['erreur' => 'Choisis un mot de passe d\'au moins 8 caractères.']);
    if ($jeton === '') repondre(400, ['erreur' => 'Colle ton jeton GitHub.']);
    // le jeton doit être celui de Manon et pouvoir écrire dans le dépôt du portfolio :
    // personne d'autre ne peut donc installer l'admin à sa place
    [$code, , $corps] = appelerGithub($apiGithub . '/user', $jeton);
    $compte = json_decode($corps, true);
    if ($code !== 200 || strcasecmp((string) ($compte['login'] ?? ''), PROPRIETAIRE) !== 0) {
      repondre(400, ['erreur' => 'Ce jeton n\'est pas accepté par GitHub, ou il n\'appartient pas au compte ' . PROPRIETAIRE . '.']);
    }
    [$code, , $corps] = appelerGithub($apiGithub . '/repos/' . DEPOT, $jeton);
    $depot = json_decode($corps, true);
    if ($code !== 200 || empty($depot['permissions']['push'])) {
      repondre(400, ['erreur' => 'Ce jeton ne donne pas accès au dépôt du portfolio. Vérifie qu\'il a bien accès à Manon-Cortot-Portfolio.']);
    }
    $nouveau = [
      'mot_de_passe' => password_hash($motDePasse, PASSWORD_DEFAULT),
      'jeton' => $jeton,
      'cle' => bin2hex(random_bytes(32)),
    ];
    $temporaire = $fichierSecret . '.' . bin2hex(random_bytes(4));
    if (@file_put_contents($temporaire, "<?php\n// Admin par mot de passe du portfolio. Supprimer ce fichier remet l'admin à zéro.\nreturn " . var_export($nouveau, true) . ";\n") === false
      || !@chmod($temporaire, 0600) || !@rename($temporaire, $fichierSecret)) {
      @unlink($temporaire);
      repondre(500, ['erreur' => 'Impossible d\'enregistrer les réglages sur le serveur.']);
    }
    ouvrirSession($nouveau, !empty($donnees['souvenir']));
    repondre(200, ['ok' => true]);

  case '/connexion':
    exigerPost();
    if (!$secret) repondre(409, ['erreur' => 'L\'admin n\'est pas encore installé.']);
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'inconnue';
    $tous = essais($fichierEssais);
    $moi = $tous[$ip] ?? ['nombre' => 0, 'depuis' => time(), 'jusqua' => 0];
    if ($moi['jusqua'] > time()) {
      repondre(429, ['erreur' => 'Trop d\'essais. Réessaie dans ' . (int) ceil(($moi['jusqua'] - time()) / 60) . ' min.']);
    }
    $donnees = corpsJson();
    if (password_verify((string) ($donnees['motDePasse'] ?? ''), $secret['mot_de_passe'])) {
      unset($tous[$ip]);
      noterEssais($fichierEssais, $tous);
      ouvrirSession($secret, !empty($donnees['souvenir']));
      repondre(200, ['ok' => true]);
    }
    $moi['nombre']++;
    $moi['depuis'] = time();
    if ($moi['nombre'] >= ESSAIS_MAX) $moi = ['nombre' => 0, 'depuis' => time(), 'jusqua' => time() + ATTENTE];
    $tous[$ip] = $moi;
    noterEssais($fichierEssais, $tous);
    sleep(1);
    repondre(401, ['erreur' => 'Mot de passe incorrect.']);

  case '/deconnexion':
    exigerPost();
    setcookie(COOKIE, '', ['expires' => 1, 'path' => '/admin/', 'httponly' => true, 'samesite' => 'Strict']);
    repondre(200, ['ok' => true]);
}

// --- relais vers GitHub ---
if (!str_starts_with($chemin, '/api/v3/') && $chemin !== '/graphql') repondre(404, ['message' => 'Not Found']);
// l'admin envoie toujours un en-tête Authorization : une page d'un autre site ne pourrait pas le faire
$autorisation = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
  ?? (array_change_key_case(function_exists('getallheaders') ? getallheaders() : [])['authorization'] ?? '');
if (!sessionValide($secret) || !str_contains($autorisation, MARQUEUR)) {
  repondre(401, ['message' => 'Bad credentials']);
}
if ($chemin === '/graphql') {
  $cible = '/graphql';
} else {
  $cible = substr($chemin, strlen('/api/v3'));
  // seulement le compte et le dépôt du portfolio
  $autorise = $cible === '/user' || strcasecmp($cible, '/repos/' . DEPOT) === 0
    || stripos($cible, '/repos/' . DEPOT . '/') === 0;
  if (!$autorise || str_contains($cible, '..')) repondre(403, ['message' => 'Hors du portfolio.']);
}
$requete = $_SERVER['QUERY_STRING'] ?? '';
$methode = $_SERVER['REQUEST_METHOD'];
$entetes = [];
foreach (['HTTP_ACCEPT' => 'Accept', 'CONTENT_TYPE' => 'Content-Type', 'HTTP_X_GITHUB_API_VERSION' => 'X-GitHub-Api-Version', 'HTTP_IF_NONE_MATCH' => 'If-None-Match'] as $cle => $nom) {
  if (!empty($_SERVER[$cle])) $entetes[] = $nom . ': ' . $_SERVER[$cle];
}
$corps = in_array($methode, ['GET', 'HEAD'], true) ? null : (string) file_get_contents('php://input');
[$code, $recus, $reponse] = appelerGithub($apiGithub . $cible . ($requete !== '' ? '?' . $requete : ''), $secret['jeton'], $methode, $corps, $entetes);

// dans l'admin, le compte affiché est celui du site, pas le profil GitHub
if ($cible === '/user' && $code === 200) {
  $site = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'];
  $compte = json_decode($reponse, true);
  $reponse = json_encode(['id' => $compte['id'] ?? 0, 'login' => 'Manon', 'name' => 'Manon Cortot', 'email' => null,
    'avatar_url' => $site . '/images/moi/accueil.jpg', 'html_url' => $site . '/']);
}

http_response_code($code);
// les liens de pagination doivent repasser par ce relais
$ici = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'] . strtok($_SERVER['REQUEST_URI'], '?');
$racine = substr($ici, 0, strpos($ici, '/api.php') + strlen('/api.php')) . '/api/v3';
if (isset($recus['link'])) $recus['link'] = str_replace($apiGithub, $racine, $recus['link']);
foreach ($recus as $nom => $valeur) {
  if (in_array($nom, ['content-type', 'etag', 'last-modified', 'link'], true) || str_starts_with($nom, 'x-ratelimit-') || str_starts_with($nom, 'x-oauth-') || str_starts_with($nom, 'x-accepted-')) {
    header($nom . ': ' . $valeur);
  }
}
echo $reponse;
