/* =====================================================================
   Pages légales (mentions légales, CGV, confidentialité).
   Les textes sont ici ; les informations qui changent (statut, SIRET, adresse,
   médiateur, e-mail, téléphone) viennent de l'admin :
   « ⚖️ Pages légales » (content/legal.json) et « 👤 Profil » (content/profil.json).
   ===================================================================== */
const esc=t=>String(t??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const lire=n=>fetch(`content/${n}.json`,{cache:"no-cache"}).then(r=>r.ok?r.json():{}).catch(()=>({}));

Promise.all([lire("profil"),lire("legal")]).then(([P,L])=>{
  const nom=esc(`${P.prenom||"Manon"} ${P.nom||"Cortot"}`);
  const mail=P.email?`<a href="mailto:${esc(P.email)}">${esc(P.email)}</a>`:"";
  const tel=P.telephone?esc(P.telephone):"";
  const siret=L.siret?esc(L.siret):"en cours d'immatriculation";
  const adresse=L.adresse?esc(L.adresse).replace(/\n/g,"<br>"):"communiquée sur simple demande par e-mail";

  const PAGES={
    "mentions-legales":[
      ["Éditrice du site",`<p>Le site manoncortot.fr est édité par <b>${nom}</b>${L.statut?`, ${esc(L.statut).toLowerCase()}`:""}.</p>
        <ul><li>SIRET : ${siret}</li><li>Adresse : ${adresse}</li>${mail?`<li>E-mail : ${mail}</li>`:""}${tel?`<li>Téléphone : ${tel}</li>`:""}</ul>
        <p>Directrice de la publication : ${nom}.</p>`],
      ["Hébergement",`<p>Hostinger International Ltd, 61 Lordou Vironos Street, 6023 Larnaca, Chypre. Site : <a href="https://www.hostinger.fr" rel="noopener">hostinger.fr</a>.</p>`],
      ["Propriété intellectuelle",`<p>Les vidéos, photos, visuels et textes présentés sur ce site sont la propriété de ${nom} ou de leurs ayants droit (clients, personnes photographiées, partenaires). Toute reproduction, diffusion ou réutilisation, même partielle, sans autorisation écrite est interdite.</p>`],
      ["Données personnelles",`<p>Pour savoir comment sont utilisées les informations envoyées par le formulaire de contact, consulte la <a href="confidentialite.html">politique de confidentialité</a>.</p>`]
    ],
    "cgv":[
      ["Objet",`<p>Les présentes conditions générales de vente s'appliquent à toutes les prestations réalisées par ${nom} (« la prestataire ») : tournage et montage vidéo, photographie, création de contenu pour les réseaux sociaux et graphisme. Toute commande implique l'acceptation de ces conditions.</p>`],
      ["Devis et commande",`<p>Chaque prestation fait l'objet d'un devis gratuit et détaillé, valable 30 jours. La commande est confirmée à la réception du devis signé (avec la mention « bon pour accord ») et de l'acompte.</p>`],
      ["Tarifs",`<p>Les prix sont indiqués en euros sur le devis.${L.tva?` ${esc(L.tva)}`:""} Les frais de déplacement, de location de matériel ou de lieu sont précisés sur le devis lorsqu'ils s'appliquent.</p>`],
      ["Paiement",`<p>Un acompte de 30 % est demandé à la commande. Le solde est payable à la livraison, au plus tard 30 jours après la date de la facture, par virement ou par tout autre moyen indiqué sur le devis.</p>
        <p>En cas de retard de paiement, des pénalités égales à trois fois le taux d'intérêt légal sont appliquées. Pour un client professionnel, une indemnité forfaitaire de 40 € pour frais de recouvrement est également due (article L441-10 du Code de commerce).</p>`],
      ["Réalisation et livraison",`<p>Les délais de livraison sont indiqués sur le devis. Ils supposent que le client transmette à temps les informations et éléments nécessaires (textes, logos, accès aux lieux…). Les fichiers sont livrés en version numérique, par lien de téléchargement.</p>
        <p>Sauf mention contraire sur le devis, deux séries de retouches sont incluses. Les demandes supplémentaires ou les changements importants par rapport au devis peuvent être facturés à part.</p>`],
      ["Annulation et report",`<p>Une séance ou un tournage peut être reporté gratuitement s'il est prévenu au moins 72 heures à l'avance. En cas d'annulation par le client après la commande, l'acompte reste acquis à la prestataire. En cas d'empêchement de la prestataire, une nouvelle date est proposée ou l'acompte est remboursé.</p>`],
      ["Droits d'auteur et utilisation des créations",`<p>${nom} reste l'auteure des vidéos, photos et visuels réalisés. Après paiement complet, le client peut les utiliser pour les usages prévus au devis (supports, durée, territoire). Toute autre utilisation, revente ou modification importante demande un accord écrit.</p>
        <p>Sauf refus écrit du client, la prestataire peut montrer les réalisations sur son site et ses réseaux sociaux pour présenter son travail.</p>`],
      ["Droit à l'image",`<p>Le client s'assure que les personnes filmées ou photographiées à sa demande ont donné leur accord, et que les lieux de tournage peuvent être utilisés.</p>`],
      ["Responsabilité",`<p>La prestataire s'engage à réaliser les prestations avec soin. Sa responsabilité ne peut pas être engagée en cas de force majeure (maladie, intempéries, panne imprévisible…). Dans ce cas, une nouvelle date est proposée.</p>`],
      ["Droit de rétractation",`<p>Le client particulier qui commande à distance dispose d'un délai de 14 jours pour se rétracter, sans avoir à se justifier. S'il demande que la prestation commence avant la fin de ce délai, il paie la part déjà réalisée en cas de rétractation (articles L221-18 et L221-25 du Code de la consommation).</p>`],
      ["Litiges",`<p>En cas de désaccord, une solution amiable est recherchée en priorité : écris à ${mail||nom}. Le client particulier peut aussi recourir gratuitement à un médiateur de la consommation${L.mediateur?` : ${esc(L.mediateur)}`:""}.</p>
        <p>Les présentes conditions sont soumises au droit français.</p>`]
    ],
    "confidentialite":[
      ["Qui s'occupe de tes données ?",`<p>${nom}${mail?`, joignable à ${mail}`:""}, est responsable des informations envoyées depuis ce site.</p>`],
      ["Quelles informations et pourquoi ?",`<p>Quand tu remplis le formulaire de devis, je reçois ton nom, ton e-mail, ton téléphone si tu le donnes, et ce que tu me dis de ton projet. Ces informations servent uniquement à te répondre et à préparer ton devis. Elles ne sont ni vendues, ni utilisées pour de la publicité, ni ajoutées à une newsletter.</p>`],
      ["Combien de temps ?",`<p>Les échanges sont gardés au plus 3 ans après notre dernier contact. Si nous travaillons ensemble, les factures sont conservées 10 ans, comme la loi le demande.</p>`],
      ["Qui y a accès ?",`<p>Moi seulement. Le formulaire passe par l'hébergeur du site, Hostinger, qui envoie ton message sur ma boîte mail.</p>`],
      ["Cookies et services extérieurs",`<p>Ce site n'utilise aucun cookie de mesure d'audience ni de publicité. Les vidéos YouTube et Instagram ne se chargent que lorsque tu lances une vidéo ; ces services peuvent alors déposer leurs propres cookies. Les polices d'écriture sont fournies par Google Fonts.</p>`],
      ["Tes droits",`<p>Tu peux à tout moment demander à voir, corriger ou supprimer tes informations, ou t'opposer à leur utilisation, en m'écrivant${mail?` à ${mail}`:""}. Si tu estimes que tes droits ne sont pas respectés, tu peux contacter la <a href="https://www.cnil.fr" rel="noopener">CNIL</a>.</p>`]
    ]
  };

  const page=document.getElementById("page"), sections=PAGES[page.dataset.page]||[];
  page.insertAdjacentHTML("beforeend",(L.mis_a_jour?`<p class="maj">Mise à jour : ${esc(L.mis_a_jour)}</p>`:"")
    +sections.map(([t,h])=>`<h2>${t}</h2>${h}`).join(""));
});
