# Benchmark concurrentiel : MushafPlus vs Muslim Pro, Quran.com, Quran Majeed

Date : 2 octobre 2026. Document de veille produit et design, sans intervention sur le code.

## Méthode et fiabilité

Deux sources distinctes, à ne pas confondre :

- **Concurrents** : veille web (sites éditeurs, bases de connaissances Intercom, fiches Google Play / App Store, dépôts GitHub, et CSS de production des apps web pour les couleurs et polices). Les pages Google Play, Softonic et apkpure bloquent le fetch (403/412/JS) : leur contenu provient de miroirs (Aptoide) ou d'extraits de recherche, signalés comme tels.
- **MushafPlus** : lecture du dépôt à l'état de la branche de travail (`src/i18n/*`, `src/data/*`, `src/services/*`, `src/styles/*`, service worker, `docs/`).

Règles de lecture de ce document :

- **`NON CONFIRMÉ`** = l'éditeur ne le déclare nulle part de vérifiable ; la revendication ne doit pas être citée comme acquise.
- **`VÉRIFIÉ ABSENT`** = recherche dans `src/` au moment de la rédaction, aucun résultat.
- **`✓`** = présent et suffisant ; **`~`** = présent mais partiel.
- Les revues comparatives tierces (`recitid.ai`, `quranindepth.com`, `dralirajabi.com`) sont traitées comme des indices, jamais comme des preuves, et sont toujours signalées comme telles. Elles se contredisent parfois avec le marketing de l'éditeur (cas du tajwid de Muslim Pro, voir §2.1).
- Les hexes et noms de polices des concurrents sont mesurés dans leurs feuilles de style publiées, pas déduits de captures d'écran. Ils peuvent changer entre deux déploiements.

## 1. Positionnement

| | Modèle économique | Échelle déclarée | Centre de gravité | Ce qu'ils vendent vraiment |
|---|---|---|---|---|
| **Muslim Pro** (Bestumma / Bitsmedia, depuis 2011) | Freemium avec publicités, Premium 12,99 $/mois ou 34,99 $/an, achats intégrés de 0,49 $ à 214,99 $ | « 100 000 000+ » téléchargements sur Play ; 4,7/5 sur 236 k avis App Store | La prière et le quotidien ; le Coran est un module | Un guichet unique musulman + un abonnement |
| **Quran.com** (Quran Foundation, trust 501(c)(3)) | Tout gratuit, pas de compte obligatoire pour lire | Non publié | L'étude du texte et l'API ouverte | La référence de données coraniques |
| **Quran Majeed** (Pakistan Data Management Services, depuis 2010) | Freemium avec publicités + 4,99 $/mois, achats à l'acte ; paliers « Platinum »/**`NON CONFIRMÉ`** | « 100M+ Downloads », « 30M+ Daily Users » ; 4,7/5 sur 240 918 avis App Store | La fidélité au mushaf papier et l'audio | Une expérience « livre » |
| **MushafPlus** | Gratuit, sans compte, sans publicité, sans paywall | — | Intégrité du texte, deux riwayas, lecture hors ligne | Un mushaf fiable et instantané, privé par défaut |

---

## 2. Fiches détaillées par concurrent

### 2.1 Muslim Pro

**Coran.** Le Quran est organisé en trois onglets **Read / Learn / My Progress**, avec vues par sourate et par juz, une progression suivie et une **coche de validation** par section lue ([Quran New Look](https://support.muslimpro.com/help/en/articles/quran-new-look-and-feature)). Un sélecteur « Page or List » dans Display, avec l'intention éditoriale déclarée de « recréer l'expérience de la lecture d'un exemplaire physique », plus une variante page sans traduction ([Page view](https://support.muslimpro.com/help/en/articles/how-to-read-quran-in-page-view)).

- Textes arabes : **IndoPak, Uthmani, Mushaf Al-Qur'an Standar Indonesia** (+ une option « Compatible » Android), réglés dans l'engrenage, onglet Text ([Arabic text](https://support.muslimpro.com/help/en/articles/how-to-change-arabic-text-for-quran)). **Aucune riwayat Warsh/Qaloon/Ad-Dori documentée → `NON CONFIRMÉ`, probablement absent.**
- Le texte arabe vient du **projet Tanzil**, et l'équipe déclare « We do not edit any of their content », en renvoyant les signalements d'erreurs vers Tanzil ([Text mistakes](https://support.muslimpro.com/help/en/articles/there-are-some-mistakes-in-the-original-text-and-or-the-translations-of-the-quran)).
- Traductions : « plus de 40 langues », téléchargeables une par une pour le hors ligne ([Holy Quran App](https://www.muslimpro.com/holy-quran-app/)).
- Tafsir : seule la promesse « deep-dive tafsir » apparaît sur le site ; **aucune œuvre nommée** dans la documentation → `NON CONFIRMÉ`.
- Tajwid coloré : le marketing promet « Coloured Tajweed highlights every rule directly inside the verse » et un réglage existe ([Tajweed](https://support.muslimpro.com/help/en/articles/how-to-activate-the-coloured-tajweed-for-quran)), **mais** une revue comparative externe affirme que Muslim Pro « lacks Tajweed color-coding » ([recitid](https://recitid.ai/guides/best-quran-apps)). Contradiction éditeur/tiers non résolue ; hypothèse plausible : réserve au niveau payant ou à certains scripts. À traiter comme incertain.
- Récitateurs nommés (8) : Saad al-Ghamdi, Ibrahim Walk, Abdul Rahman As-Sudais, Ali Al Hudhaify, Sheikh Bander Baleelah, Abdul Basit Abdus Samad, Mishari Rashid al-Afasy, Teuku Wisnu ([Reciters](https://support.muslimpro.com/help/en/articles/how-to-choose-a-different-reciter-for-the-quran)).
- Audio hors ligne : téléchargement **par sourate complète**, pas verset par verset, 500 Mo libres requis, **réservé Premium**, iOS exige l'app au premier plan ([Audio downloads](https://support.muslimpro.com/help/en/articles/how-to-download-and-listen-to-quran-audio-recitations)).
- Panel d'actions rapides sur appui long d'un verset : « Learn, Memorise, Playlist, Share, Play, Read, Bookmark and Note » ([Quick actions](https://support.muslimpro.com/help/en/articles/quran-quick-actions-panel)).
- Mémorisation : outil qui « boucle les versets avec l'audio » ; Learn = leçons + « knowledge check » + « aya check » audio + QCM multi-réponses + écran de résultat ([Quran Learn](https://support.muslimpro.com/help/en/articles/a-guide-through-quran-learn)).
- Recherche : texte **et vocale**, langues de recherche « English and Arabic » ([Search](https://support.muslimpro.com/help/en/articles/search-on-quran-page-by-text-and-voice)).

**Prière.** Le distinguishing feature est le badge **« Verified »** : les horaires affichés comme vérifiés sont soumis par des mosquées ou des autorités religieuses, sinon c'est du calcul ([Verified times](https://support.muslimpro.com/help/en/articles/verified-prayer-times-in-muslim-pro)). Pour la France : choix UOIF 12°, Grande Mosquée de Paris 18°, certains 15° ([angles FR](https://support.muslimpro.com/help/en/articles/does-the-muslim-pro-application-use-12-15-or-18-angles-for-prayer-times-in-france)). Le web expose `applied_convention_key: "MWL"`, `imsak`, `imsak_delay` et une FAQ autorisant le passage à Umm al-Qura / ISNA / égyptienne ou l'ajustement manuel « pour s'aligner sur votre mosquée locale » ([app.muslimpro.com](https://app.muslimpro.com/)). Asr Shafi/Hanafi, ajustement hautes latitudes, ajuste d'heure d'été, rappel pré-adhan, notification par prière, récurrence par jour ([base de connaissances](https://support.muslimpro.com/help/en/categories/knowledge-base)). Voix d'adhan licenciées (Issam Bayan, Yusuf Islam) ([acknowledgements](https://support.muslimpro.com/help/en/articles/acknowledgements-android)), guides de dépannage par fabricant (Samsung, Xiaomi, Oppo, Vivo/Meizu) et widget de notification live Android.

**Reste.** Duas et dhikr organisés par moment (réveil, voyage, repas, difficulté) + tasbih, extraits du livre **Hisn al-Muslim**. Ramadan : horaires suhoor/iftar automatiques, **Fasting Tracker** (jours choisis, barres « jours jeûnés » / « jours restants »), **Khatam / Ramadan Quran Challenge** ([Fasting Tracker](https://support.muslimpro.com/help/en/articles/how-to-use-the-fasting-tracker)). **Ummah Pro** (flux « All »/« Mine », modération, signalement = retrait automatique), **AiDeen** (Q&R IA), **Quest & Stars** (gamification), Journal, Inspiration du jour, questions religieuses encadrées, localisation mosquées/halal via Google Maps. **Academy** (cours Coran/arabe, entrée gratuite puis payante, Zoom live, évaluations certifiantes) et **Qalbox** (streaming TV, sous-titres, reprendre la lecture), réservation Omra et Badal Omra.

**Gratuit vs Premium.** Gratuit = avec publicités. Premium = suppression des pubs, téléchargement des récitations hors ligne, « voir tous les horaires dans le widget », « choisir différents thèmes de couleur », 5 appareils ([Free vs Premium](https://support.muslimpro.com/help/en/articles/what-is-the-difference-between-the-free-and-premium-versions-of-muslim-pro)).

**Design.** Un seul accent vert de marque `#00A360`, déclinaisons `#33B580`/`#00DB81`, lavage `#CCEDDF` ; surfaces très sombres verdâtres `#0F1613`, `#0A100F`, `#003232`, `#0B4A3D` ; blanc cassé `#FCFFFE` ; neutres `#3A4943`, `#6A7772`, `#CBD2CF`, `#E7E7E7` ; accents secondaires Material `#FF9800`/`#F57C00` et `#E91E63`/`#C2185B` (mesuré dans `/_next/static/css/90406edb7d7c250e.css` sur app.muslimpro.com). Typographie UI : **Rethink Sans** (`--font-rethink-sans`), display **Outfit** (poids 100–900), servies en woff2 sous-sets via `next/font`. Système Tailwind avec variantes `dark:`, skeletons `animate-pulse`, conteneur `max-w-[1040px]`, rayons 10–32 px et pilules 9999 px, `backdrop-blur(40px)`. Police du texte coranique non publiée → `NON CONFIRMÉ`.

**Critiques connues.** Publicités : « now it forces 3 ads for any action… if you skip it after 5 seconds another screen pops out », et une pub jugée inappropriée ; le support admet un filtrage « computerised process which might still… result in ad content which did not get filtered properly » ([Ad banners](https://support.muslimpro.com/help/en/articles/some-of-the-ad-banners-seem-inappropriate-for-a-muslim-application)). Abonnés voyant encore des pubs et perdant leur historique de suivi (avis Play). **Vie privée** : scandale du partage de données de localisation, réponse officielle « terminate our relationships with all data partners, including X-Mode, effective immediately » ([statement](https://support.muslimpro.com/help/en/articles/statement-from-muslim-pro)) ; « Data Linked to You: Location, Contact Info, User Content, Identifiers » (fiche App Store). Perception que le Coran est secondaire : « Its Quran features are serviceable rather than the main focus… premium is the priciest here » ([recitid](https://recitid.ai/guides/best-quran-apps)). Surcharge constatée en Ramadan (réponses officielles sur Play).

### 2.2 Quran.com

**Modèle de rendu.** Le lecteur est **typographique**, pas en images de pages : choix du script « choisissez votre script de lecture préféré », avec référence explicite au « King Fahad Glorious Quran Printing Complex (KFGQPC) – Uthmanic Hafs » ([settings/mushaf](https://quran.com/settings/mushaf)). Les anciens scans vivent dans un dépôt séparé, `quran.com-images` ([org quran](https://github.com/orgs/quran/repos)).

**Tajwid.** Option `showTajweedRules` / « Tajweed colors » avec **barre de légende dépliable** (`isTajweedBarExpanded`), rendu par classes dédiées `tajweed_v4-font-size-1..5`, données d'annotation issues du projet `quran/quran-tajweed` ([quran.com](https://quran.com/), [repos](https://github.com/orgs/quran/repos)).

**Audio.** L'API v4 expose **12 flux** — AbdulBaset (Murattal/Mujawwad/Muallim), As-Sudais, Al-Husary, Al-Minshawi, Al-Shatri, Ar-Rifai, Al-Afasy, Ash-Shuraym, Al-Tablawi — **tous en Hafs** ; le paramètre `riwaya=warsh` est ignoré ([recitations](https://api.quran.com/api/v4/resources/recitations)). La lecture verset par verset sans rupture est prouvée par `audio_bundle`, qui renvoie des **segments temporels** par verset ([exemple 78](https://api.quran.com/api/v4/verses/by_chapter/78?audio=1&audio_bundle=true)).

**Contenu.** **126 traductions dans ~69 langues** (Saheeh International, Yusuf Ali, Pickthall, Abdel Haleem, Awqaf Égypte…), avec `author_name` mais **aucun champ de licence** ([translations](https://api.quran.com/api/v4/resources/translations)). **~20 tafsirs** : Ibn Kathir (AR, EN abrégé, UR), Tabari, Qurtubi, Sa'di, Baghawi, Wasit (Tantawi), Muyassar, Ma'arif al-Qur'an, Fi Zilal, Tazkirul Quran ([tafsirs](https://api.quran.com/api/v4/resources/tafsirs)). Mot-à-mot avec bascule **in-line ou infobulle**, translittération, champs **morphologiques** / « Morphological analysis » ([settings/mushaf](https://quran.com/settings/mushaf)). Recherche sur le texte arabe + les traductions, avec surlignage ([search](https://api.quran.com/api/v4/search?q=mercy&size=3)) ; la recherche par **sujet/topic** : `NON CONFIRMÉ`.

**Étude.** Signets par **collections**, notes, surlignages, `bookmarkedVerses`. Objectifs de lecture personnalisés, « Quran in a Year », suivi de progrès, **historique de lecture**, et **Auto Scroll** pour la révision ([quran.com](https://quran.com/)). Playlist dédiée de mémorisation : `NON CONFIRMÉ` (un « Repeat » existe dans l'audio). Partage par permalien ; des variables `--background-media-share-card` suggèrent des cartes visuelles, format exact `NON CONFIRMÉ`. PWA : `manifest.json` avec icônes maskables + **shortcuts**, service worker `sw.js` ([manifest](https://quran.com/manifest.json), [sw](https://quran.com/sw.js)). Écosystème d'apps liées : Android `com.quran.labs.androidquran`, iOS id1118663303, Tasmi, Tazkiya, Quranicaudio, et « Quran Radio ».

**Données.** API `api.quran.com/api/v4`, SDK `@quranjs/api`. Le `text_uthmani` porte les signes de waqf U+06D6–06DA, l'alif khanjariya U+0670/U+0653, la wasla U+0671, les porteurs de hamza U+06E5/06E6 ; **le numéro de verset est injecté au rendu** (pas de U+06DD dans les données testées) ([verset 2:255](https://api.quran.com/api/v4/verses/by_key/2:255?fields=text_uthmani)). Trois scripts depuis les mêmes données QUL : `text_uthmani`, `text_indopak`, `text_uthmani_simple` ([1:1](https://api.quran.com/api/v4/verses/by_key/1:1?fields=text_indopak,text_uthmani_simple)). Juz, hizb, rub, ruku, manzil, sajda attachés à chaque verset.

**Design.** Marque teal `#2ca4ab` (variantes `#22a5ad`, `#258c91`), fond sombre `#1f2125`, texte clair `#272727`, bords `#ebeef0` ; palette du rebrand « QDC » : or `#e2af56`, navy `#00163d`, vert `#00b88a`, bleu de lecture `#0077d8` (mesuré dans `/_next/static/css/7f186522504479de.css`). UI en **Figtree** (+ Be Vietnam Pro, Newsreader pour l'éditorial) ; polices coraniques `UthmanicHafs`, `IndoPak`, `Kitab`, `DroidArabicNaskh`, et nastaliq (Noto/Mehr) pour l'ourdou — **un script indo-pak est donc bien livré**, mais **aucune police Warsh visible dans le CSS**. `data-theme = light|dark|sepia|auto`. Tokens d'espacement nommés (xmicro→mega) et d'échelle typographique 12→64 px, `--border-radius-default: 0.25rem`, hauteur du lecteur 48 px desktop / 56 px mobile. Variables sémantiques `--color-reading-audio-highlight`, `--color-reading-action-hover-*`, easing de page `--ayah-page-motion-easing: cubic-bezier(0.2,0,0,1)` (même fichier CSS).

**Open source et licences.** Front actuel `quran.com-frontend-next` ; la v1 React est sous MIT mais son README interdit la copie du projet, et la v2 Rails (GPLv3) est archivée ([quran.com-frontend](https://github.com/quran/quran.com-frontend), [v2](https://github.com/quran/quran.com-frontend-v2)). Positionnement waqf, « accès libre au contenu et aux fonctionnalités pour alimenter les applications islamiques et la R&D » ([about-us](https://quran.com/about-us)). Les métadonnées audio portent style et riwaya, mais l'attribution de licence des traductions est absente du schéma API — un point à ne pas reproduire bêtement si on consomme leurs données.

**Limites.** Pas de Warsh/Qaloon dans l'UI ni dans l'API v4 publique ; pas de gestionnaire de téléchargement hors ligne au-delà du service worker ; fonctions liées à un compte (goals, multi-appareils) ; `docs.quran.com` et `quran.com/developer` étaient injoignables pendant la veille.

### 2.3 Quran Majeed

**Rendu.** Écriture « Uthmanic script » complète, relue « par un savant musulman ('alim) » (fiche App Store id365557665). Plusieurs polices/rasm : « Uthmanic, Mushaf, and Indo-Pak » ([Aptoide](https://quran-majeed.en.aptoide.com/app)) et « Multiple Quran Fonts » ([pakdata](https://pakdata.com/products/quran-majeed/)). Le mode « Visual Quran feature with flip gesture » = pages réelles avec feuilleté. Le nombre exact de pages (604 médinoises ?) n'est confirmé nulle part → `NON CONFIRMÉ`.

**Riwayas.** Aucune page officielle ne liste de sélection de riwaya ; le vocabulaire employé est « polices » et « scripts », pas « transmissions ». **Hafs/Warsh/Nafis/Qaloon/Bashir Ajami : `NON CONFIRMÉ`** — ne pas citer comme acquis.

**Audio.** Récitateurs de la fiche App Store : Abdul Basit, As-Sudays & Ash-Shuraym, Mishari Rashid, Saad Al-Ghamdi, Abu Bakr Shatri, Ahmed Ajmi, Al-Huzaifi, Mahir Al-Muayqali, Minshawi, Ayub, Khalil Husari, Mahmood AlBana, Salah Bukhatir, Sheikh Basfar. Le site annonce « 30+ world-renowned reciters with offline audio » ([site](https://quranmajeed.com/)) ; Aptoide en cite 15. Surlignage du verset **et du mot** pendant la récitation.

**Traduction/tafsir.** « over 50 languages » / « forty-five language translations » + 4 traductions anglaises (Pickthal, Dr. Mohsin, Mahmood, Yusuf Ali). Tafsir : « English Tafsir Uthmani » et 3 sources arabes (Ibn Kathir, Jalalayn, Saadi).

**Mémorisation** — leur point le plus fort : répétition par verset/sourate avec **nombre de répétitions, intervalle et vitesse**, fonction Hifz permettant **d'enregistrer sa propre récitation**, boucles A-B, suivi de progression. Mot-à-mot avec audio ajouté en v10.9.

**Reste.** Signets (aya, traduction, tafsir) avec **synchronisation iCloud**. Recherche avancée : mot exact, affixes **ou racines** dans le texte arabe. Boussole Qibla, horaires mondiaux avec alarme Adhan et plusieurs méthodes de calcul, Ramadan Suhur/Iftar + rappels de jeûne, calendrier hégirien avec convertisseur, duas, partage sur réseaux, direct La Mecque/Médine. Tajwid coloré rapporté par une revue tierce seulement → **partiellement confirmé**. Kids/mode enfant, widgets, encre et stylet : `NON CONFIRMÉ`.

**Design.** Identité vert profond + or (dégradés « green and gold »), police arabe **Noto Naskh Arabic** ([site](https://quranmajeed.com/)). Thèmes : Green, Blue, Classic-Green, Night Mode, Light & Brown. Navigation décrite comme complète mais « busy » ; jugée « polished and stable » ([dralirajabi](https://dralirajabi.com/best-quran-apps-2026/)). `Quran Majeed Mac` existe ; mise en page Windows `NON CONFIRMÉ`.

**Monétisation.** Base gratuite + achats intégrés ; abonnement « 4,99 $ / mois » pour l'accès complet ; modèle « Freemium — payant + sans pub ». Paliers Platinum/Pro et prix par plateforme : `NON CONFIRMÉ`.

**Plateformes.** iOS, Android, Huawei AppGallery, macOS, plus un lecteur web `read.quranmajeed.com`.

**Critiques.** Publicités fréquentes dans le niveau gratuit (« ads whenever I switch from one place to other ») ; interface surchargée pour qui veut un lecteur minimaliste. Aucune preuve solide d'erreurs de texte ni de dérive audio trouvée.

---

## 3. Ce que MushafPlus fait aujourd'hui (état du dépôt)

**Écrans.** Routage manuel (`src/hooks/useUrlSync.js`) : `/` accueil (hero, reprise de lecture, verset du jour, suggestions, statistiques, onglets Sourates/Juz/Récitations/Radio), `/surah/:n` et `/surah/:n/:ayah` (deep-link verset), `/page/:n` (1–604), `/juz/:n` (1–30), `/duas`, `/prieres`, `/surahs`, `/about`, `/privacy`, `/legal`, `/sources`, 404. Hors routes : réglages, recherche, bibliothèque, actions du verset, partage-image, tafsir latéral, infos sourate, détail récitant, mushaf plein écran, raccourcis clavier.

**Coran.** Hafs **et** Warsh (texte local `public/data/warsh-page-source.json`, `warshStrictMode` qui bloque les récitateurs Hafs en mode strict). Modes liste et mushaf paginé (`mushafLayout`, flux vertical ou horizontal), en-têtes de sourate, cadre d'ouverture à rosettes, marqueurs de sajda. Polices (`src/data/fonts.js`) : QPC Uthmani Hafs (défaut), IndoPak Nastaleeq, Scheherazade New, Amiri Quran, Noto Naskh Arabic ; Warsh : Uthmani Warsh KFGQPC (Médine) et Scheherazade New Warsh ; polices internes de page QCF v2, QCF v4 Tajweed, QPC Madani 15 lignes — toutes auto-hébergées, rosettes gérées par la police. Tajwid par variables `--tajwid-*` : muet, hamza wasl, lam solaire, ghunna, ikhfa (+ shafawi), iqlab, idgham (5 variantes), qalqala, tafkhīm, 5 madd — **gratuit**, interruptible, avec légende et guide traduit (`src/i18n/tajwidGuide.js`), infobulle par mot, et couverture Warsh bornée à l'édition (§ `docs/TAJWID_HAFS_WARSH_AUDIT.md`). Traductions FR (Quran.com res. 136) et EN (Saheeh International 20) + éditions Warsh dédiées « Montada 2017 », cumulables. Tafsir : Muyassar, Wasit, Ibn Kathir (AR+EN), Tabari, Qurtubi, Baghawi, Saadi, **+ Al-Mukhtasar fi at-Tafsir en français embarqué hors ligne**. Mot-à-mot avec translittération par mot et audio par mot (Hafs), translittération verset complet EN hors ligne (non dispo Warsh). Recherche : texte arabe (index IndexedDB, 30 j), phonétique, traductions FR/EN, invocations, **recherche vocale AR/FR/EN**, worker dédié ; pas de recherche dans le tafsir ; hors ligne limitée à l'index arabe en cache. Signets et notes **chiffrés localement**, listes d'écoute, le tout dans la bibliothèque. Mémorisation par l'audio : répétition verset/sourate, boucle A-B, mode lent 0,75×, audio mot-à-mot, al-Kahf en boucle. Partage : cartes image 1:1 / 4:5 / 9:16 thémées avec traduction optionnelle, partage natif, WhatsApp/Telegram/X/e-mail, copie, permaliens. Taille de police arabe et de traduction réglables, zoom plein écran 0,75–2,2×, ajuster page/largeur.
**Données personnelles** : export **et import JSON** complets (`src/services/exportService.js`) + effacement local ; `VÉRIFIÉ ABSENT` pour toute synchronisation cloud automatique.

**Audio.** 54 entrées (`src/data/reciters.js`) : 46 récitants Hafs + 8 Warsh, avec styles tartil/murattal/mujawwad/muallim, favoris, biographies, portraits, recherche. Lecture verset par verset ou sourate entière, enchaînement continu, repeat, vitesse, volume + EQ (`audioEq.js`), suivi karaoké du verset et du mot (timings Quran.com), pré-roll basmala par récitant (`basmalaPreroll.js`), décalage A/V (`syncOffsetsMs`), bascule vers le récitant le plus rapide, failover avec cooldown, saut des versets indisponibles. **Téléchargement hors ligne vérifié octet par octet** par sourate/récitant/riwaya **et Coran entier**, quota géré. Media Session (contrôles d'écran verrouillé), lecteur persistant à la navigation, 4 stations thématiques.

**Prière et reste.** Horaires via aladhan, 6 méthodes (UOIF par défaut en FR, ISNA, Ligue mondiale, Umm al-Qura, Autorité égyptienne, Karachi-hanafi), géolocalisation ou ville prédéfinie, ajustement par prière ±60 min, cache chiffré d'un jour en stale-while-revalidate, date hégirienne affichée. Rappels avant-prière (0/5/10/15/20 min) et après-prière avec question « Ai-je prié ? » (0/10/15/20/30/45 min), par prière, silencieux, rattrapage à la réouverture ; adhan **joué en premier plan seulement** (limite web documentée) ; **1 seule voix** (Prophets Mosque) avec volume, aperçu et téléchargement hors ligne, clé `adhanComingSoon` pour les autres. Suivi personnel `/prieres` en vues jour/semaine/mois, tout local chiffré. Duas : Coran + Hisn al-Muslim avec recherche, copie, partage-image, ouverture du verset. Notification « verset du jour ». PWA installable iOS/Android, bannière de mise à jour, service worker `mushaf-plus-v22` (pre-cache app-shell + polices de lecture, cache-first/SWR/network-first, budgets 16/24/32 Mo). Interface FR (défaut) / EN / AR avec RTL natif et pluriels arabes.

**Vérifications d'absence** (`VÉRIFIÉ ABSENT` dans `src/`, recherche au moment de la rédaction) : qibla, morphologie/analyse grammaticale, objectifs de lecture (`readingGoal`), historique de lecture, calendrier hégirien dédié avec événements, Ramadan/suivi de jeûne, widgets, synchronisation cloud, gamification, communauté, assistant IA. Attention aux faux positifs : les occurrences de « qibla » sont dans le texte des tafsirs et traductions ; « khatam » dans notre code désigne la **rosette ornementale** (`MushafOpeningFrame.jsx`, `MushafAyahMarker.jsx`), pas un défi de lecture complète ; « cloud » désigne `CloudOff`/`cloud-sun` (icônes) et la mention légale de l'absence de sync.

---

## 4. Tableau comparatif — Coran

| Capacité | MushafPlus | Muslim Pro | Quran.com | Quran Majeed |
|---|---|---|---|---|
| Pages mushaf + mode liste | ✓ les deux, avec pleine page immersive | ✓ sélecteur Page/List | ✓ typographique, sans scan | ✓ « Visual Quran » feuilleté |
| Riwayas | ✓ **Hafs + Warsh**, strict | ✗ `NON CONFIRMÉ` | ✗ Hafs seulement (API v4) | ~ polices ≠ riwayas, `NON CONFIRMÉ` |
| Polices coraniques | ✓ 5 Hafs + 2 Warsh, auto-hébergées | ✓ IndoPak / Uthmani / Standar Indonesia | ✓ UthmanicHafs / IndoPak / Kitab / nastaliq | ✓ Uthmanic / Mushaf / Indo-Pak |
| Tajwid coloré | ✓ ~15 règles, **gratuit**, légende + guide | ~ promis, contradictoire selon les sources | ✓ `showTajweedRules` + barre de légende | ~ signalé par un tiers seulement |
| Traductions | ~ **FR + EN** (+ éditions Warsh dédiées) | ✓ 40+ langues | ✓ **126 trad / ~69 langues** | ✓ 50 langues, 4 EN |
| Tafsir | ✓ 8, dont **1 français hors ligne** | ~ aucune œuvre nommée | ✓ ~20 | ✓ 3 arabes + 1 EN |
| Mot-à-mot | ✓ + translittération + audio par mot (Hafs) | ✓ | ✓ + **morphologie** | ✓ (audio v10.9) |
| Translittération | ✓ EN, hors ligne, pas en Warsh | ~ `NON CONFIRMÉ` | ✓ | ✓ (EN) |
| Recherche | ✓ arabe + phonétique + traductions + **vocale** | ✓ texte + voix | ✓ texte + traductions | ✓ exact / affixes / **racines** |
| Signets / notes | ✓ chiffrés, **sans compte** | ✓ + playlists | ✓ collections + surlignages + notes | ✓ + sync iCloud |
| Mémorisation | ✓ répétition, boucle A-B, 0,75× | ✓ boucle audio + Learn/QCM | ✓ « Repeat » + objectifs | ✓ **la plus complète** (+ enregistrement) |
| Objectifs / historique / streak | ✗ `VÉRIFIÉ ABSENT` | ✓ My Progress + coche de section | ✓ **Reading Goals**, Quran in a Year, historique, auto-scroll | ✓ suivi de progression |
| Partage | ✓ **cartes 3 formats, thémées** + permaliens | ✓ | ✓ permaliens | ✓ réseaux sociaux |
| Audio hors ligne | ✓ **par sourate et Coran entier, gratuit** | ✓ mais **Premium** | ~ service worker seulement | ✓ 30+ récitants |
| Récitateurs | ✓ **54** (46 Hafs + 8 Warsh), bios, styles | 8 nommés | 9, tous Hafs | 14–30 |
| Export des données | ✓ **export + import JSON** | ✗ non documenté | ~ via compte | ~ via iCloud |

## 5. Tableau comparatif — hors Coran

| Capacité | MushafPlus | Muslim Pro | Quran.com | Quran Majeed |
|---|---|---|---|---|
| Horaires de prière | ✓ 6 méthodes, ajustement/prière | ✓ **+ horaires « Verified »**, angles FR, madhab, hautes latitudes, DST | ✓ | ✓ multi-méthodes |
| Adhan / rappels | ~ 1 voix, **premier plan seulement** | ✓ voix licenciées, widgets de notif, dépannage par marque | ✗ | ✓ alarmes app fermée |
| Suivi des prières | ✓ **jour/semaine/mois** | ~ journal | ✗ | ✗ |
| Duas / Athkar | ✓ Coran + Hisn al-Muslim | ✓ + tasbih | ✓ | ✓ |
| Ramadan / jeûne | ✗ `VÉRIFIÉ ABSENT` | ✓ **Fasting Tracker** + Khatam challenge | ✗ | ✓ Suhur/Iftar + rappels |
| Qibla | ✗ `VÉRIFIÉ ABSENT` | ✓ | ✗ | ✓ |
| Calendrier hégirien | ~ date affichée, pas d'événements | ✓ réglable | ✓ | ✓ + convertisseur |
| Widgets d'écran d'accueil | ✗ (impossible en PWA pure) | ✓ lockscreen/homescreen | ✗ | ✓ |
| Communauté / IA / gamification | ✗ (choix produit) | ✓ Ummah, AiDeen, Quest & Stars, Academy, Qalbox, Omra | ✗ | ✗ |
| Langues d'interface | ~ FR / EN / AR + RTL natif | ✓ ~10 | ✓ | ✓ |
| Comptes / sync multi-appareils | ✗ (volontaire : local + chiffré) | ✓ | ✓ | ✓ iCloud |
| Publicité / paywall sur le Coran | ✗ **aucun** | ✓ pubs ; offline et thèmes payants | ✗ | ✓ pubs |
| Installation / hors ligne | ✓ PWA + budgets de cache | ✓ native | ✓ PWA | ✓ native + web |

## 6. Comparaison de design

| | Accent | Fond sombre | UI typo | Coran typo | Thèmes | Système |
|---|---|---|---|---|---|---|
| **MushafPlus** | `#0b6235` (fajr), `#7c4a17` (parchemin), `#2f9f6b` (nuit) | surfaces `--bg-*`, encres 1–4 | **system-ui uniquement**, 0 octet de webfont | QPC Uthmani / IndoPak Nastaleeq / Scheherazade / Amiri / Noto Naskh | light, sepia, dark (+6 legs remappés) | CSS vanilla, tokens `--theme-*`, ~65 keyframes, `prefers-reduced-motion` |
| **Muslim Pro** | `#00A360` (+ `#33B580`, `#00DB81`, `#FF9800`, `#E91E63`) | `#0F1613`, `#0A100F`, `#003232` | **Rethink Sans** + **Outfit** | `NON CONFIRMÉ` | sombre par classe Tailwind ; **thèmes couleur = Premium** | Tailwind, `max-w-[1040px]`, rayons 10–32 px/pilules, `backdrop-blur(40px)`, skeletons pulse |
| **Quran.com** | teal `#2ca4ab` ; rebrand or `#e2af56`, navy `#00163d`, vert `#00b88a` | `#1f2125`, bords `#ebeef0` | **Figtree** (+ Be Vietnam Pro, Newsreader) | UthmanicHafs / IndoPak / Kitab / DroidArabicNaskh | light, dark, **sepia**, auto | tokens sémantiques (`--color-reading-audio-highlight`, `--color-reading-action-hover-*`), échelles nommées, radius 0,25 rem, lecteur 48/56 px |
| **Quran Majeed** | vert profond + or | Night Mode | non publiée | **Noto Naskh Arabic** | Green, Blue, Classic-Green, Night, Light & Brown | natif, « polished but busy » |

**Lecture.** Nous sommes sur la même grammaire que Quran.com — trois thèmes dont un sepia, tokens sémantiques, crans de taille de police, variables de surlignage du verset lu — avec une contrainte qu'eux n'ont pas : aucune webfont d'interface, donc la hiérarchie se fait par graisse, espacement et couleur plutôt que par la typographie. Nous sommes plus sobres que Muslim Pro (Material + Tailwind + backdrop-blur) et nettement plus épurés que Quran Majeed, dont la surcharge est précisément le reproche récurrent. Aucun de nos trois comparateurs n'a de politique `prefers-reduced-motion` documentée.

## 7. Écarts à combler, priorisés

### Fort impact / coût faible

1. **Objectifs de lecture, historique et progression.** C'est le seul vrai trou de rétention : Quran.com a « Reading Goals » + « Quran in a Year » + historique + auto-scroll, Muslim Pro a « My Progress » avec coche par section. Nous persistons déjà la position courante ; il manque la couche comptage (pages/jours/sections terminées). `VÉRIFIÉ ABSENT`.
2. **Auto-scroll / mode récitation.** Déjà chez Quran.com, faible coût en mode liste, et sert la révision et la lecture en conduisant.
3. **Écran « Ma progression » séparé de « Lire ».** Pattern Read/Learn/My Progress de Muslim Pro ; chez nous, une entrée de bibliothèque ou un onglet suffirait.
4. **Validation visuelle de juz/hizb terminés** (la coche), dans le fil de lecture.
5. **Langues de traduction.** 2 chez nous contre 40 à 126. Cinq ou six langues mineures (es, id, tr, ur, de, pt) nous sortiraient du bas du tableau, et les données Quran.com sont accessibles par `resource_id`.
6. **Calendrier hégirien avec événements** et **Ramadan (Suhr/Iftar + suivi de jeûne)** : les horaires sont déjà calculés par aladhan, il manque l'écran et le stockage.

### Fort impact / coût moyen

7. **Qibla** — seule case vide du trio. Sur web : capteur d'orientation + géolocalisation, avec repli affiché quand le capteur est indisponible ; à annoncer comme une approximation, pas comme une boussole native.
8. **Multi-voix d'adhan** — la clé `adhanComingSoon` est déjà là. La limite « premier plan seulement » restera : à expliciter dans l'UI plutôt qu'à laisser découvrir.
9. **Recherche hors ligne complète** (index des traductions pré-caché) et **recherche dans le tafsir**.
10. **Morphologie et analyse grammaticale** (données QUL via Quran.com) — différenciant sur le segment étude, où nous sommes déjà forts (8 tafsirs + mot-à-mot).
11. **Pré-cache de `warsh-page-source.json`** (2,76 Mo non precaché) : aujourd'hui la première page Warsh exige le réseau. Ce n'est pas une fonctionnalité manquante, c'est un défaut d'intégrité hors ligne sur notre riwaya signature.

### Ce que nous ne ferons pas, et pourquoi c'est défendable

Publicité et paywall sur le Coran (notre avantage n°1, et la critique n°1 des deux apps commerciales), widgets d'écran d'accueil, communauté et gamification, assistant IA, comptes et synchronisation, alarmes en arrière-plan réel, annotation manuscrite au stylet sur l'image de page. Les premiers sont impossibles ou non garantis en PWA ; les suivants sont hors de notre ligne (local, chiffré, sans compte) ou non désirés.

## 8. Nos atouts que nul de ces trois n'a

1. **Warsh complet** : texte, polices KFGQPC Médine, ḍabṭ de son édition pour le tajwid, traductions dédiées, 8 récitants Warsh. Quran.com ignore Warsh dans son API, Muslim Pro ne le documente pas, Quran Majeed parle de polices et non de transmission.
2. **Intégrité du texte comme contrainte de code** : la couleur ne peut jamais venir d'une devinette de lettres, un `QURAN_TEXT_INTEGRITY_FAILURE` est exposé (`docs/TAJWID_HAFS_WARSH_AUDIT.md`). Aucun concurrent ne documente une telle discipline.
3. **Coran hors ligne intégral gratuit** : téléchargement vérifié octet par octet, Coran entier compris — paywall chez Muslim Pro, absent du web chez Quran.com.
4. **Recherche phonétique** (translittération) et **recherche vocale**, en plus du texte arabe.
5. **Partage en cartes thémées** (1:1, 4:5, 9:16) avec traduction optionnelle.
6. **Suivi personnel des prières** en vues jour/semaine/mois, sans compte.
7. **Notes et signets chiffrés en local, avec export et import JSON** — ni compte, ni fuite, ni verrou éditeur.
8. **Discipline de performance mesurée et tenue par la CI** (budgets de bundle et de screen, `scripts/check-bundle-budget.mjs`) — aucune des trois fiches concurrentes ne publie l'équivalent.

## 9. Sources

**Muslim Pro** — [site](https://www.muslimpro.com/) · [Holy Quran App](https://www.muslimpro.com/holy-quran-app/) · [Prayer Times & Adhan](https://www.muslimpro.com/prayer-times-and-adhan-app/) · [Academy](https://www.muslimpro.com/academy-islamic-courses/) · [app web](https://app.muslimpro.com/) (et son CSS `/_next/static/css/90406edb7d7c250e.css`) · [base de connaissances](https://support.muslimpro.com/help/en/categories/knowledge-base) — articles cités : [Quran New Look](https://support.muslimpro.com/help/en/articles/quran-new-look-and-feature), [Page view](https://support.muslimpro.com/help/en/articles/how-to-read-quran-in-page-view), [Arabic text](https://support.muslimpro.com/help/en/articles/how-to-change-arabic-text-for-quran), [Tajweed](https://support.muslimpro.com/help/en/articles/how-to-activate-the-coloured-tajweed-for-quran), [Quick actions](https://support.muslimpro.com/help/en/articles/quran-quick-actions-panel), [Quran Learn](https://support.muslimpro.com/help/en/articles/a-guide-through-quran-learn), [Reciters](https://support.muslimpro.com/help/en/articles/how-to-choose-a-different-reciter-for-the-quran), [Audio downloads](https://support.muslimpro.com/help/en/articles/how-to-download-and-listen-to-quran-audio-recitations), [Search](https://support.muslimpro.com/help/en/articles/search-on-quran-page-by-text-and-voice), [Verified times](https://support.muslimpro.com/help/en/articles/verified-prayer-times-in-muslim-pro), [Angles FR](https://support.muslimpro.com/help/en/articles/does-the-muslim-pro-application-use-12-15-or-18-angles-for-prayer-times-in-france), [Fasting Tracker](https://support.muslimpro.com/help/en/articles/how-to-use-the-fasting-tracker), [Free vs Premium](https://support.muslimpro.com/help/en/articles/what-is-the-difference-between-the-free-and-premium-versions-of-muslim-pro), [Acknowledgements](https://support.muslimpro.com/help/en/articles/acknowledgements-android), [Text mistakes](https://support.muslimpro.com/help/en/articles/there-are-some-mistakes-in-the-original-text-and-or-the-translations-of-the-quran), [Ad banners](https://support.muslimpro.com/help/en/articles/some-of-the-ad-banners-seem-inappropriate-for-a-muslim-application), [Statement](https://support.muslimpro.com/help/en/articles/statement-from-muslim-pro) · [Google Play](https://play.google.com/store/apps/details?id=com.bitsmedia.android.muslimpro) · [App Store GB](https://apps.apple.com/gb/app/muslim-pro-quran-azan-dua/id388389451) · [Aptoide](https://muslim-pro.en.aptoide.com/app) · [recitid (tiers)](https://recitid.ai/guides/best-quran-apps)

**Quran.com** — [quran.com](https://quran.com/) · [settings/mushaf](https://quran.com/settings/mushaf) · [about-us](https://quran.com/about-us) · [API recitations](https://api.quran.com/api/v4/resources/recitations) · [translations](https://api.quran.com/api/v4/resources/translations) · [tafsirs](https://api.quran.com/api/v4/resources/tafsirs) · [search](https://api.quran.com/api/v4/search?q=mercy&size=3) · [verset 2:255](https://api.quran.com/api/v4/verses/by_key/2:255?fields=text_uthmani) · [audio_bundle 78](https://api.quran.com/api/v4/verses/by_chapter/78?audio=1&audio_bundle=true) · [manifest.json](https://quran.com/manifest.json) · [sw.js](https://quran.com/sw.js) · CSS `/_next/static/css/7f186522504479de.css` · [GitHub org](https://github.com/orgs/quran/repos) · [quran.com-frontend](https://github.com/quran/quran.com-frontend) · [frontend-v2](https://github.com/quran/quran.com-frontend-v2)

**Quran Majeed** — [site](https://quranmajeed.com/) · [App Store id365557665](https://apps.apple.com/us/app/quran-majeed-%D8%A7%D9%84%D9%82%D8%B1%D8%A7%D9%86-%D8%A7%D9%84%D9%83%D8%B1%D9%8A%D9%85/id365557665) · [avis App Store](https://apps.apple.com/sa/app/365557665?see-all=reviews&platform=iphone) · [Aptoide](https://quran-majeed.en.aptoide.com/app) · [pakdata](https://pakdata.com/products/quran-majeed/) · [Google Play](https://play.google.com/store/apps/details?id=com.pakdata.QuranMajeed) · [quranindepth (tiers)](https://www.quranindepth.com/blog/best-quran-apps-2025-review) · [dralirajabi (tiers)](https://dralirajabi.com/best-quran-apps-2026/)

**MushafPlus** — `src/data/{fonts,reciters,themes}.js`, `src/services/{exportService,downloadService,offlineAudioStore,prayerTimesService,adhanService,searchWorkerService,basmalaPreroll,audioEq}.js`, `src/i18n/*`, `src/styles/domains/themes4.css`, service worker `mushaf-plus-v22`, `docs/TAJWID_HAFS_WARSH_AUDIT.md`, `docs/DESIGN_SYSTEM.md`, `ARCHITECTURE.md`, `SCREEN_UX_BUDGETS.md`.

---

# Addendum du 2026-10-10 — Madjaliss Al Quran, Quran Qat, Quran d'Or, lecture en direct

Complète le benchmark ci-dessus (Muslim Pro, Quran.com, Quran Majeed). Méthode
pour Madjaliss : `sitemap.xml`, bundle applicatif et scripts de `/coran/lire`
lus directement, ce qui expose des comportements absents de la page d'accueil.

## A. Madjaliss Al Quran — lecture en direct (« Tilawa X »)

Fonctionnalité différenciante. Comportement réel, lu dans les scripts :

- L'animateur colle le lien d'un Space X et active la session.
- Un code à 6 caractères est généré ; lien public `/coran/lire?space=<CODE>&mode=tilawa`.
- Serveur : `POST /api/quran-live`, `GET /api/quran-live/:code`, `PATCH`,
  `DELETE`, plus un flux SSE `GET /api/quran-live/:code/events`.
- Position publiée : `{page, verse_key, word_index, confidence, status}` —
  la page, le verset et le **mot** récités.
- Le suivi du mot vient du **microphone** : la transcription est alignée sur le
  texte coranique de la page (`quran-constrained-speech-alignment-v2`), ce qui
  permet de suivre une récitation **sans audio synchronisé**.
- Côté suiveur la position fait autorité : barre d'outils et sélecteur de page
  masqués, classes `isReciting` / `isActiveWord` / `isWordPassed`.
- Trois modes : *Lire* (mushaf libre), *Réciter* (Coach IA), *Tilawa X*.

Point bien conçu : **l'audio du Space n'est jamais redistribué**, seule la position l'est.

Autres fonctions relevées : navigation par hizb, tafsir Ibn Kathir audio, règles
de tadjwîd Hafs détaillées (nūn sākinah, madd, qalqalah, lām shamsiyyah),
bibliothèque de PDF, cours Al-Qāʿidah en 12 chapitres, studio Hifz avec suivi de
maîtrise, prières et mosquées via Overpass, espace communautaire, programme
hebdomadaire de dars.

## B. Quran Qat — l'audio avant tout

Récitation **mot à mot** synchronisée avec le texte, traductions audio dans plus
de 30 langues (wolof, bambara, peul, swahili, comorien…), tafsir audio
multilingue, hors-ligne dès l'installation, translittération phonétique,
répétition d'un verset jusqu'à 100 fois.

## C. Quran d'Or (Golden Quran)

Lecture lishani très simple : fonds de page colorés, mode nuit noir et blanc,
tapotement sur le verset donnant le sens du mot, glossaire, tafsir Ibn Kathir en
direct à la sélection, signets de position de lecture, recherche avec mise en
évidence du verset. Ajouts récents : arrêt de l'adhan au tapotement, masbaha
automatique, mosquées proches sur la carte de la qibla.

## D. Tableau — les trois nouveaux

| Domaine | Quran Qat | Quran d'Or | Madjaliss | MushafPlus |
|---|---|---|---|---|
| Riwaya | ❌ | ❌ | ❌ | ✅ Hafs + Warsh |
| Récitations | ✅ 50+ | ✅ 40+ | via Spaces | ✅ 54 |
| Audio mot à mot | ✅ | ✅ | ❌ | ✅ |
| Traduction **audio** | ✅ 30+ langues | ❌ | ❌ | ❌ |
| Tafsir audio | ✅ | ❌ | ✅ | ❌ |
| Recherche vocale | ❌ | ❌ | ❌ | ✅ |
| Hors-ligne natif | ✅ | ✅ | ✅ | ✅ PWA |
| Lecture en direct | ❌ | ❌ | ✅ serveur | ✅ local |
| Suivi micro | ❌ | ❌ | ✅ | ❌ |
| Hizb | ✅ | ✅ | ✅ | ✅ |
| Tasbih | ✅ | ✅ | ❌ | ❌ |
| 99 noms | ✅ | ✅ | ✅ | ❌ |
| Cours / bibliothèque | ❌ | ❌ | ✅ | ❌ |

## E. Lecture en direct — état de la décision

Une session de lecture en direct a été prototypée puis **retirée**. Le
prototype utilisait `BroadcastChannel` (repli sur l'événement `storage`) avec
un code à 6 caractères ; il diffusait la position (page, sourate, juz, verset,
index de mot) sans jamais transmettre d'audio. Tous les fichiers ont été
supprimés : ce qui suit est le raisonnement, pas une fonctionnalité livrée.

Motifs du retrait :

- `BroadcastChannel` ne relie que les onglets **du même navigateur sur le même
  appareil**. Le seul usage réel était un poste avec deux fenêtres, ce qui ne
  justifie pas une entrée de menu.
- Le suivi du mot n'était **pas peint chez le suiveur** : `wordIndex` arrivait,
  servait à l'affichage textuel, et aucun surlignage n'était branché. Le
  tableau comparatif l'annonçait pourtant — c'était une inexactitude.
- Reproduire Tilawa X (multi-appareils) exige un serveur relais ; sans lui,
  la feature restait sous la promesse de son propre nom.

Pour une reprise ultérieure, deux voies honnêtes :

1. **Session locale assumée** — nommer la fonctionnalité pour ce qu'elle est
   (fenêtres du même appareil) et brancher le surlignage mot à mot.
2. **Relais serverless** — une fonction Vercel/Netlify qui ne relaie qu'une
   position de lecture, jamais d'audio, sans compte. C'est le seul moyen
   d'obtenir un vrai multi-appareils conforme au modèle de Madjaliss.

## F. Écarts restants, priorisés

| Prio | Manque | Faisabilité | Blocage |
|---|---|---|---|
| P1 | Qibla (boussole) | Relèvement + Kaaba | Besoin d'un repère de test fiable |
| P1 | Tasbih / compteur | Compteur pur, données présentes | — |
| P2 | 99 noms d'Allah | Données statiques + page | Sourçage à valider |
| P2 | Objectifs / séries | Suivi de position disponible | Persistance |
| P2 | Suivi micro de la récitation | `useVoiceSearch` existe | Risque d'annoter le texte à tort |
| P3 | Bibliothèque de cours | — | Contenu éditorial |
| P3 | Communauté | — | Modération, comptes, hébergement |

Le suivi par microphone reste le point sensible : chez Madjaliss il anime
l'affichage ; chez MushafPlus, un faux positif colorant le texte coranique
relève de l'intégrité, que ce dépôt interdit explicitement. Il ne doit pas
être repris sans incertitude affichée à l'écran.
