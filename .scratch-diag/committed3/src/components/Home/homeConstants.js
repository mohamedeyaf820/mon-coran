import SURAHS from "../../data/surahs";

/* ─── Pagination / layout ─────────────────────────────────────────────────── */
export const HOME_INITIAL_SURAHS     = 48;
export const HOME_INITIAL_SURAHS_LOW = 24;
export const HOME_SURAHS_BATCH       = 36;

export const HOME_DEFERRED_SECTION_STYLE = {
  contentVisibility: "auto",
  containIntrinsicSize: "1px 360px",
};
export const HOME_FOOTER_SECTION_STYLE = {
  contentVisibility: "auto",
  containIntrinsicSize: "1px 280px",
};

/* ─── Accès rapide ────────────────────────────────────────────────────────── */
export const QUICK_ACCESS = [
  { n: 1,   icon: "fa-mosque",         label_fr: "Al-Fatiha",  label_en: "The Opening"  },
  { n: 18,  icon: "fa-mountain-sun",   label_fr: "Al-Kahf",    label_en: "The Cave"     },
  { n: 36,  icon: "fa-star-and-crescent", label_fr: "Ya-Sin",  label_en: "Ya-Sin"       },
  { n: 55,  icon: "fa-leaf",           label_fr: "Ar-Rahman",  label_en: "The Merciful" },
  { n: 67,  icon: "fa-moon",           label_fr: "Al-Mulk",    label_en: "Sovereignty"  },
  { n: 112, icon: "fa-infinity",       label_fr: "Al-Ikhlas",  label_en: "Sincerity"    },
  { n: 113, icon: "fa-sun",            label_fr: "Al-Falaq",   label_en: "The Dawn"     },
  { n: 114, icon: "fa-shield-halved",  label_fr: "An-Nas",     label_en: "Mankind"      },
];

/* ─── Significations anglaises des sourates ──────────────────────────────── */
export const SURAH_EN_MEANINGS = {
  1:   "The Opening",
  2:   "The Cow",
  3:   "Family of Imran",
  4:   "The Women",
  5:   "The Table Spread",
  6:   "The Cattle",
  7:   "The Heights",
  8:   "The Spoils of War",
  9:   "The Repentance",
  10:  "Jonah",
  11:  "Hud",
  12:  "Joseph",
  13:  "The Thunder",
  14:  "Abraham",
  15:  "The Rocky Tract",
  16:  "The Bee",
  17:  "The Night Journey",
  18:  "The Cave",
  19:  "Mary",
  20:  "Ta Ha",
  21:  "The Prophets",
  22:  "The Pilgrimage",
  23:  "The Believers",
  24:  "The Light",
  25:  "The Criterion",
  26:  "The Poets",
  27:  "The Ant",
  28:  "The Stories",
  29:  "The Spider",
  30:  "The Romans",
  31:  "Luqman",
  32:  "The Prostration",
  33:  "The Confederates",
  34:  "Sheba",
  35:  "Originator",
  36:  "Ya Sin",
  37:  "Those Who Set the Ranks",
  38:  "Sad",
  39:  "The Groups",
  40:  "The Forgiver",
  41:  "Explained in Detail",
  42:  "Consultation",
  43:  "Gold Adornments",
  44:  "The Smoke",
  45:  "The Kneeling",
  46:  "The Dunes",
  47:  "Muhammad",
  48:  "The Victory",
  49:  "The Rooms",
  50:  "Qaf",
  51:  "The Winnowing Winds",
  52:  "The Mount",
  53:  "The Star",
  54:  "The Moon",
  55:  "The Most Merciful",
  56:  "The Inevitable",
  57:  "The Iron",
  58:  "The Pleading Woman",
  59:  "The Exile",
  60:  "She That Is To Be Examined",
  61:  "The Ranks",
  62:  "The Congregation",
  63:  "The Hypocrites",
  64:  "Mutual Disillusion",
  65:  "Divorce",
  66:  "The Prohibition",
  67:  "The Sovereignty",
  68:  "The Pen",
  69:  "The Reality",
  70:  "The Ascending Stairways",
  71:  "Noah",
  72:  "The Jinn",
  73:  "The Enshrouded One",
  74:  "The Cloaked One",
  75:  "The Resurrection",
  76:  "Man",
  77:  "Those Sent Forth",
  78:  "The Great News",
  79:  "Those Who Drag Forth",
  80:  "He Frowned",
  81:  "The Overthrowing",
  82:  "The Cleaving",
  83:  "Defrauding",
  84:  "The Splitting Open",
  85:  "The Mansions of the Stars",
  86:  "The Morning Star",
  87:  "The Most High",
  88:  "The Overwhelming",
  89:  "The Dawn",
  90:  "The City",
  91:  "The Sun",
  92:  "The Night",
  93:  "The Morning Hours",
  94:  "The Relief",
  95:  "The Fig",
  96:  "The Clot",
  97:  "The Power",
  98:  "The Clear Proof",
  99:  "The Earthquake",
  100: "The Courser",
  101: "The Calamity",
  102: "Rivalry in World Increase",
  103: "The Declining Day",
  104: "The Traducer",
  105: "The Elephant",
  106: "Quraysh",
  107: "Small Kindnesses",
  108: "Abundance",
  109: "The Disbelievers",
  110: "Divine Support",
  111: "The Palm Fiber",
  112: "Sincerity",
  113: "The Daybreak",
  114: "Mankind",
};

/* ─── Index de recherche (calculé une seule fois au chargement du module) ─── */
export const SURAH_SEARCH_INDEX = SURAHS.map((surah) => ({
  surah,
  number:  String(surah.n),
  ar:      String(surah.ar || ""),
  enLower: String(surah.en || "").toLowerCase(),
  frLower: String(surah.fr || "").toLowerCase(),
}));

/* ─── Versets du jour — cycle de 60 jours ────────────────────────────────── */
export const DAILY_VERSES = [
  {
    text:     "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
    ref:      "Al-Fatiha  1:2",
    ayah:     2,
    trans_fr: "Louange à Allah, Seigneur des mondes",
    trans_en: "All praise is due to Allah, Lord of all the worlds",
  },
  {
    text:     "وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ",
    ref:      "Al-Baqara  2:45",
    ayah:     45,
    trans_fr: "Cherchez secours dans la patience et la prière",
    trans_en: "Seek help through patience and prayer",
  },
  {
    text:     "فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي",
    ref:      "Al-Baqara  2:152",
    ayah:     152,
    trans_fr: "Rappelez-vous de Moi, Je Me souviendrai de vous",
    trans_en: "Remember Me and I will remember you — and be grateful to Me",
  },
  {
    text:     "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ",
    ref:      "Al-Baqara  2:153",
    ayah:     153,
    trans_fr: "Certes, Allah est avec ceux qui endurent",
    trans_en: "Indeed, Allah is with the patient",
  },
  {
    text:     "إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ",
    ref:      "Al-Baqara  2:156",
    ayah:     156,
    trans_fr: "Nous appartenons à Allah et c'est à Lui que nous retournerons",
    trans_en: "Indeed, we belong to Allah, and to Him we shall return",
  },
  {
    text:     "فَإِنِّي قَرِيبٌ ۖ أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ",
    ref:      "Al-Baqara  2:186",
    ayah:     186,
    trans_fr: "Je suis proche — Je réponds à l'invocation de celui qui M'invoque",
    trans_en: "I am near — I respond to the call of the one who calls Me",
  },
  {
    text:     "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ",
    ref:      "Al-Baqara  2:255",
    ayah:     255,
    trans_fr: "Allah — nulle divinité sinon Lui, le Vivant, Celui qui subsiste par Lui-même",
    trans_en: "Allah — there is no deity except Him, the Ever-Living, the Sustainer",
  },
  {
    text:     "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا",
    ref:      "Al-Baqara  2:286",
    ayah:     286,
    trans_fr: "Allah n'impose à aucune âme une charge supérieure à sa capacité",
    trans_en: "Allah does not burden a soul beyond what it can bear",
  },
  {
    text:     "رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا",
    ref:      "Al-Imran  3:8",
    ayah:     8,
    trans_fr: "Seigneur, ne laisse pas dévier nos cœurs après que Tu nous as guidés",
    trans_en: "Our Lord, do not let our hearts deviate after You have guided us",
  },
  {
    text:     "وَعَلَى اللَّهِ فَلْيَتَوَكَّلِ الْمُؤْمِنُونَ",
    ref:      "Al-Imran  3:160",
    ayah:     160,
    trans_fr: "Que les croyants s'en remettent à Allah",
    trans_en: "Let the believers put their trust in Allah",
  },
  {
    text:     "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ",
    ref:      "Al-Imran  3:173",
    ayah:     173,
    trans_fr: "Allah nous suffit, et quel excellent Protecteur",
    trans_en: "Allah is sufficient for us, and how excellent a Guardian",
  },
  {
    text:     "وَعَلَى اللَّهِ فَتَوَكَّلُوا إِن كُنتُم مُّؤْمِنِينَ",
    ref:      "Al-Maidah  5:23",
    ayah:     23,
    trans_fr: "Mettez votre confiance en Allah, si vous êtes croyants",
    trans_en: "Put your trust in Allah if you are true believers",
  },
  {
    text:     "وَإِن يَمْسَسْكَ اللَّهُ بِضُرٍّ فَلَا كَاشِفَ لَهُ إِلَّا هُوَ",
    ref:      "Al-An'am  6:17",
    ayah:     17,
    trans_fr: "Si Allah t'afflige d'un mal, nul ne peut le dissiper sinon Lui",
    trans_en: "If Allah afflicts you with harm, none can remove it except Him",
  },
  {
    text:     "إِنَّ رَحْمَتَ اللَّهِ قَرِيبٌ مِّنَ الْمُحْسِنِينَ",
    ref:      "Al-A'raf  7:56",
    ayah:     56,
    trans_fr: "La miséricorde d'Allah est proche des bienfaisants",
    trans_en: "The mercy of Allah is near to those who do good",
  },
  {
    text:     "قُل لَّن يُصِيبَنَا إِلَّا مَا كَتَبَ اللَّهُ لَنَا",
    ref:      "At-Tawba  9:51",
    ayah:     51,
    trans_fr: "Dis : rien ne nous atteint sinon ce qu'Allah a décidé pour nous",
    trans_en: "Say: Nothing will befall us except what Allah has decreed for us",
  },
  {
    text:     "أَلَا إِنَّ أَوْلِيَاءَ اللَّهِ لَا خَوْفٌ عَلَيْهِمْ وَلَا هُمْ يَحْزَنُونَ",
    ref:      "Yunus  10:62",
    ayah:     62,
    trans_fr: "Les alliés d'Allah ne craignent rien et ne seront point affligés",
    trans_en: "The allies of Allah shall have no fear, nor shall they grieve",
  },
  {
    text:     "وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ ۚ عَلَيْهِ تَوَكَّلْتُ",
    ref:      "Hud  11:88",
    ayah:     88,
    trans_fr: "Ma réussite ne dépend que d'Allah — c'est en Lui que je place ma confiance",
    trans_en: "My success is only through Allah — in Him I trust",
  },
  {
    text:     "إِنَّهُ لَا يَيْأَسُ مِن رَّوْحِ اللَّهِ إِلَّا الْقَوْمُ الْكَافِرُونَ",
    ref:      "Yusuf  12:87",
    ayah:     87,
    trans_fr: "Seuls les mécréants désespèrent de la miséricorde d'Allah",
    trans_en: "None despair of the mercy of Allah except the disbelieving people",
  },
  {
    text:     "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
    ref:      "Ar-Ra'd  13:28",
    ayah:     28,
    trans_fr: "C'est par le rappel d'Allah que les cœurs trouvent la quiétude",
    trans_en: "Verily, in the remembrance of Allah do hearts find rest",
  },
  {
    text:     "لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ",
    ref:      "Ibrahim  14:7",
    ayah:     7,
    trans_fr: "Si vous êtes reconnaissants, J'augmenterai vos bienfaits",
    trans_en: "If you are grateful, I will surely increase you in favor",
  },
  {
    text:     "إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ",
    ref:      "Al-Hijr  15:9",
    ayah:     9,
    trans_fr: "C'est Nous qui avons révélé le Rappel et c'est Nous qui en sommes gardiens",
    trans_en: "Indeed, it is We who sent down the Quran and We will be its guardian",
  },
  {
    text:     "مَنْ عَمِلَ صَالِحًا مِّن ذَكَرٍ أَوْ أُنثَىٰ وَهُوَ مُؤْمِنٌ فَلَنُحْيِيَنَّهُ حَيَاةً طَيِّبَةً",
    ref:      "An-Nahl  16:97",
    ayah:     97,
    trans_fr: "Quiconque accomplit de bonnes œuvres avec foi, Nous lui ferons vivre une vie agréable",
    trans_en: "Whoever does righteous deeds while believing, We will grant them a good life",
  },
  {
    text:     "وَقُل رَّبِّ زِدْنِي عِلْمًا",
    ref:      "Ta-Ha  20:114",
    ayah:     114,
    trans_fr: "Dis : Seigneur, augmente mon savoir",
    trans_en: "Say: My Lord, increase me in knowledge",
  },
  {
    text:     "لَا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ",
    ref:      "Al-Anbiya  21:87",
    ayah:     87,
    trans_fr: "Pas de divinité sinon Toi — gloire à Toi ! J'ai été au nombre des injustes",
    trans_en: "There is no deity except You — glory be to You — I have been among the wrongdoers",
  },
  {
    text:     "رَبَّنَا آتِنَا مِن لَّدُنكَ رَحْمَةً وَهَيِّئْ لَنَا مِنْ أَمْرِنَا رَشَدًا",
    ref:      "Al-Kahf  18:10",
    ayah:     10,
    trans_fr: "Seigneur, accorde-nous Ta miséricorde et guide-nous dans notre conduite",
    trans_en: "Our Lord, grant us mercy from Yourself and guide us in our affair",
  },
  {
    text:     "رَّبِّ أَعُوذُ بِكَ مِنْ هَمَزَاتِ الشَّيَاطِينِ",
    ref:      "Al-Mu'minun  23:97",
    ayah:     97,
    trans_fr: "Seigneur, je me réfugie auprès de Toi contre les suggestions des démons",
    trans_en: "My Lord, I seek refuge in You from the whisperings of the devils",
  },
  {
    text:     "اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ",
    ref:      "An-Nur  24:35",
    ayah:     35,
    trans_fr: "Allah est la lumière des cieux et de la terre",
    trans_en: "Allah is the light of the heavens and the earth",
  },
  {
    text:     "رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ",
    ref:      "Al-Furqan  25:74",
    ayah:     74,
    trans_fr: "Seigneur, fais de nos conjoints et de notre descendance la prunelle de nos yeux",
    trans_en: "Our Lord, grant us joy in our spouses and offspring",
  },
  {
    text:     "إِلَّا مَنْ أَتَى اللَّهَ بِقَلْبٍ سَلِيمٍ",
    ref:      "Ash-Shu'ara  26:89",
    ayah:     89,
    trans_fr: "Sauf celui qui vient à Allah avec un cœur sain",
    trans_en: "Except one who comes to Allah with a sound heart",
  },
  {
    text:     "أَمَّن يُجِيبُ الْمُضْطَرَّ إِذَا دَعَاهُ وَيَكْشِفُ السُّوءَ",
    ref:      "An-Naml  27:62",
    ayah:     62,
    trans_fr: "Qui répond à l'appel de celui qui est dans la détresse et dissipe le mal ?",
    trans_en: "Who answers the distressed when he calls and removes the harm?",
  },
  {
    text:     "إِنَّ الصَّلَاةَ تَنْهَىٰ عَنِ الْفَحْشَاءِ وَالْمُنكَرِ",
    ref:      "Al-Ankabut  29:45",
    ayah:     45,
    trans_fr: "La prière préserve de la turpitude et du blâmable",
    trans_en: "Indeed, prayer prevents immorality and wrongdoing",
  },
  {
    text:     "يَا أَيُّهَا الَّذِينَ آمَنُوا اذْكُرُوا اللَّهَ ذِكْرًا كَثِيرًا",
    ref:      "Al-Ahzab  33:41",
    ayah:     41,
    trans_fr: "Ô croyants, invoquez Allah abondamment",
    trans_en: "O you who believe, remember Allah with much remembrance",
  },
  {
    text:     "مَا يَفْتَحِ اللَّهُ لِلنَّاسِ مِن رَّحْمَةٍ فَلَا مُمْسِكَ لَهَا",
    ref:      "Fatir  35:2",
    ayah:     2,
    trans_fr: "La miséricorde qu'Allah ouvre aux hommes, rien ne peut la retenir",
    trans_en: "Whatever mercy Allah opens for people, none can withhold it",
  },
  {
    text:     "لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا",
    ref:      "Az-Zumar  39:53",
    ayah:     53,
    trans_fr: "Ne désespérez pas de la miséricorde d'Allah — Il pardonne tous les péchés",
    trans_en: "Do not despair of the mercy of Allah — He forgives all sins",
  },
  {
    text:     "ادْعُونِي أَسْتَجِبْ لَكُمْ",
    ref:      "Ghafir  40:60",
    ayah:     60,
    trans_fr: "Invoquez-Moi, Je vous répondrai",
    trans_en: "Call upon Me, I will respond to you",
  },
  {
    text:     "ادْفَعْ بِالَّتِي هِيَ أَحْسَنُ",
    ref:      "Fussilat  41:34",
    ayah:     34,
    trans_fr: "Repousse le mal par ce qui est meilleur",
    trans_en: "Repel evil with that which is better",
  },
  {
    text:     "اللَّهُ لَطِيفٌ بِعِبَادِهِ يَرْزُقُ مَن يَشَاءُ",
    ref:      "Ash-Shura  42:19",
    ayah:     19,
    trans_fr: "Allah est plein de douceur envers Ses serviteurs — Il pourvoit à qui Il veut",
    trans_en: "Allah is subtle with His servants — He provides for whom He wills",
  },
  {
    text:     "إِنَّ أَكْرَمَكُمْ عِندَ اللَّهِ أَتْقَاكُمْ",
    ref:      "Al-Hujurat  49:13",
    ayah:     13,
    trans_fr: "Le plus noble d'entre vous auprès d'Allah est le plus pieux",
    trans_en: "The most noble of you in the sight of Allah is the most righteous",
  },
  {
    text:     "وَنَحْنُ أَقْرَبُ إِلَيْهِ مِنْ حَبْلِ الْوَرِيدِ",
    ref:      "Qaf  50:16",
    ayah:     16,
    trans_fr: "Nous sommes plus proche de lui que sa veine jugulaire",
    trans_en: "We are closer to him than his jugular vein",
  },
  {
    text:     "وَمَا خَلَقْتُ الْجِنَّ وَالْإِنسَ إِلَّا لِيَعْبُدُونِ",
    ref:      "Adh-Dhariyat  51:56",
    ayah:     56,
    trans_fr: "Je n'ai créé les djinns et les hommes que pour M'adorer",
    trans_en: "I did not create jinn and mankind except to worship Me",
  },
  {
    text:     "وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ",
    ref:      "Al-Qamar  54:17",
    ayah:     17,
    trans_fr: "Nous avons facilité le Coran pour le rappel — qui veut bien réfléchir ?",
    trans_en: "We have made the Quran easy to remember — is there anyone who will reflect?",
  },
  {
    text:     "فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ",
    ref:      "Ar-Rahman  55:13",
    ayah:     13,
    trans_fr: "Lequel des bienfaits de votre Seigneur nierez-vous ?",
    trans_en: "Which of the favors of your Lord will you deny?",
  },
  {
    text:     "هُوَ الْأَوَّلُ وَالْآخِرُ وَالظَّاهِرُ وَالْبَاطِنُ",
    ref:      "Al-Hadid  57:3",
    ayah:     3,
    trans_fr: "Il est le Premier et le Dernier, l'Apparent et le Caché",
    trans_en: "He is the First and the Last, the Ascendant and the Intimate",
  },
  {
    text:     "يَرْفَعِ اللَّهُ الَّذِينَ آمَنُوا مِنكُمْ وَالَّذِينَ أُوتُوا الْعِلْمَ دَرَجَاتٍ",
    ref:      "Al-Mujadila  58:11",
    ayah:     11,
    trans_fr: "Allah élève en degrés ceux qui croient et ceux à qui le savoir a été donné",
    trans_en: "Allah raises those who believe and those given knowledge in degrees",
  },
  {
    text:     "رَبَّنَا اغْفِرْ لَنَا وَلِإِخْوَانِنَا الَّذِينَ سَبَقُونَا بِالْإِيمَانِ",
    ref:      "Al-Hashr  59:10",
    ayah:     10,
    trans_fr: "Seigneur, pardonne-nous ainsi qu'à nos frères qui nous ont précédés dans la foi",
    trans_en: "Our Lord, forgive us and our brothers who preceded us in faith",
  },
  {
    text:     "وَعَلَى اللَّهِ فَلْيَتَوَكَّلِ الْمُؤْمِنُونَ",
    ref:      "At-Taghabun  64:13",
    ayah:     13,
    trans_fr: "Que les croyants s'en remettent à Allah",
    trans_en: "Let the believers put their trust in Allah",
  },
  {
    text:     "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا",
    ref:      "At-Talaq  65:2",
    ayah:     2,
    trans_fr: "Quiconque craint Allah, Il lui ménagera une issue",
    trans_en: "Whoever fears Allah, He will make a way out for them",
  },
  {
    text:     "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ",
    ref:      "At-Talaq  65:3",
    ayah:     3,
    trans_fr: "Quiconque place sa confiance en Allah — Il lui suffit",
    trans_en: "Whoever puts his trust in Allah, He is sufficient for him",
  },
  {
    text:     "وَإِنَّكَ لَعَلَىٰ خُلُقٍ عَظِيمٍ",
    ref:      "Al-Qalam  68:4",
    ayah:     4,
    trans_fr: "Tu es certes d'une moralité sublime",
    trans_en: "And indeed, you are of a great moral character",
  },
  {
    text:     "اسْتَغْفِرُوا رَبَّكُمْ إِنَّهُ كَانَ غَفَّارًا",
    ref:      "Nuh  71:10",
    ayah:     10,
    trans_fr: "Implorez le pardon de votre Seigneur — Il est très Pardonnant",
    trans_en: "Ask forgiveness of your Lord — indeed, He is ever a Perpetual Forgiver",
  },
  {
    text:     "وَاذْكُرِ اسْمَ رَبِّكَ وَتَبَتَّلْ إِلَيْهِ تَبْتِيلًا",
    ref:      "Al-Muzzammil  73:8",
    ayah:     8,
    trans_fr: "Invoque le nom de ton Seigneur et consacre-toi à Lui entièrement",
    trans_en: "Remember the name of your Lord and devote yourself to Him completely",
  },
  {
    text:     "كَلَّا بَل لَّا تُكْرِمُونَ الْيَتِيمَ",
    ref:      "Al-Fajr  89:17",
    ayah:     17,
    trans_fr: "Non ! Mais vous n'honorez pas l'orphelin",
    trans_en: "No! But you do not honor the orphan",
  },
  {
    text:     "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
    ref:      "Al-Inshirah  94:6",
    ayah:     6,
    trans_fr: "Certes, avec la difficulté vient la facilité",
    trans_en: "Indeed, with hardship comes ease",
  },
  {
    text:     "إِنَّا أَنزَلْنَاهُ فِي لَيْلَةِ الْقَدْرِ",
    ref:      "Al-Qadr  97:1",
    ayah:     1,
    trans_fr: "Nous l'avons certes révélé lors de la Nuit du Destin",
    trans_en: "Indeed, We revealed it during the Night of Decree",
  },
  {
    text:     "قُلْ هُوَ اللَّهُ أَحَدٌ",
    ref:      "Al-Ikhlas  112:1",
    ayah:     1,
    trans_fr: "Dis : Il est Allah, Unique",
    trans_en: "Say: He is Allah, the One",
  },
  {
    text:     "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ",
    ref:      "Al-Falaq  113:1",
    ayah:     1,
    trans_fr: "Dis : je cherche protection auprès du Seigneur de l'Aube",
    trans_en: "Say: I seek refuge with the Lord of the daybreak",
  },
  {
    text:     "قُلْ أَعُوذُ بِرَبِّ النَّاسِ",
    ref:      "An-Nas  114:1",
    ayah:     1,
    trans_fr: "Dis : je cherche protection auprès du Seigneur des hommes",
    trans_en: "Say: I seek refuge with the Lord of mankind",
  },
];

/* ─── Type de sourate ─────────────────────────────────────────────────────── */
export const TYPE_INFO = {
  Meccan:  { fr: "Mecquoise", en: "Meccan",  ar: "مكية"  },
  Medinan: { fr: "Médinoise", en: "Medinan", ar: "مدنية" },
};

/* ─── Articles de blog (données de démonstration) ────────────────────────── */
/* ─── Photos des récitateurs ─────────────────────────────────────────────── */
export const RECITER_PHOTOS = {
  "ar.alafasy":            "https://static.quran.com/images/reciters/7/mishary-rashid-alafasy.png",
  "ar.abdulbasitmurattal": "https://static.quran.com/images/reciters/1/abdul-basit.png",
  "ar.abdulbasitmujawwad": "https://static.quran.com/images/reciters/1/abdul-basit.png",
  "ar.husary":             "https://static.quran.com/images/reciters/10/mahmoud-khalil-al-husary.png",
  "ar.minshawi":           "https://static.quran.com/images/reciters/12/muhammad-siddiq-al-minshawi.png",
  "ar.minshawimujawwad":   "https://static.quran.com/images/reciters/12/muhammad-siddiq-al-minshawi.png",
  "ar.saoodshuraym":       "https://static.quran.com/images/reciters/8/saud-ash-shuraym.png",
  "ar.abdurrahmaansudais": "https://static.quran.com/images/reciters/3/abdur-rahman-as-sudais.png",
  "ahmed_ajmy":            "https://static.quran.com/images/reciters/5/ahmed-al-ajamy.png",
  "maher_almuaiqly":       "https://static.quran.com/images/reciters/11/maher-al-muaiqly.png",
  "yasser_dossari_hafs":   "https://static.quran.com/images/reciters/14/yasser-ad-dussary.png",
  "nasser_alqatami":       "https://static.quran.com/images/reciters/13/nasser-al-qatami.png",
  "ali_jabir":             "https://static.quran.com/images/reciters/2/ali-jaber.png",
  "hudhaify":              "https://static.quran.com/images/reciters/4/ali-al-hudhaify.png",
  "muhammad_ayyoub":       "https://static.quran.com/images/reciters/9/muhammad-ayyoub.png",
  "fares_abbad":           "https://static.quran.com/images/reciters/6/fares-abbad.png",
};

/* ─── Fonctions utilitaires ──────────────────────────────────────────────── */

/** Normalise les apostrophes et espaces dans un nom de sourate latin. */
export function normalizeLatinSurahName(name = "") {
  return String(name).replace(/['`´]/g, "'").replace(/\s+/g, " ").trim();
}

/** Retourne la signification anglaise d'une sourate. */
export function getSurahEnglishMeaning(surahNumber) {
  return SURAH_EN_MEANINGS[surahNumber] || "Surah";
}

/** Retourne l'index du verset selon le jour de l'année (change à minuit). */
export function getDailyVerseIndex(date = new Date()) {
  const start     = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date - start) / 86400000);
  return dayOfYear % DAILY_VERSES.length;
}

/** Retourne la photo d'un récitateur, avec fallback avatar. */
export function getReciterPhoto(id) {
  if (RECITER_PHOTOS[id]) return RECITER_PHOTOS[id];
  return `https://ui-avatars.com/api/?name=${id}&background=105a30&color=fff&size=128&bold=true`;
}

/**
 * Suggestions contextuelles selon l'heure / le jour de la semaine.
 * @param {Date} date
 */
export function getSuggestedSurahs(date = new Date()) {
  const h   = date.getHours();
  const day = date.getDay(); // 0=Dim, 5=Ven

  if (day === 5)
    return {
      period: { fr: "Sunna du vendredi", en: "Friday Sunnah", ar: "سنة الجمعة" },
      icon:   "fa-star-and-crescent",
      surahs: [
        { n: 18,  fr: "Sunna du vendredi",  en: "Friday Sunnah",   ar: "سنة الجمعة"   },
        { n: 1,   fr: "L'Ouverture",        en: "The Opening",      ar: "الفاتحة"      },
        { n: 36,  fr: "Coeur du Coran",     en: "Heart of Quran",   ar: "قلب القرآن"   },
        { n: 55,  fr: "Ar-Rahman",          en: "The Merciful",     ar: "الرحمن"       },
        { n: 67,  fr: "Al-Mulk",            en: "Sovereignty",      ar: "الملك"        },
      ],
    };

  if (h >= 4 && h < 12)
    return {
      period: { fr: "Lecture du matin", en: "Morning Reading", ar: "ورد الصباح" },
      icon:   "fa-sun",
      surahs: [
        { n: 1,   fr: "L'Ouverture",        en: "The Opening",      ar: "الفاتحة"      },
        { n: 112, fr: "Sincérité pure",      en: "Pure Sincerity",   ar: "الإخلاص"     },
        { n: 113, fr: "Protection de l'aube", en: "Dawn Guard",      ar: "الفلق"       },
        { n: 114, fr: "Protection du mal",   en: "Against Evil",     ar: "الناس"        },
        { n: 36,  fr: "Coeur du Coran",      en: "Heart of Quran",   ar: "قلب القرآن"  },
      ],
    };

  if (h >= 12 && h < 17)
    return {
      period: { fr: "Lecture du midi", en: "Midday Reading", ar: "قراءة الظهر" },
      icon:   "fa-cloud-sun",
      surahs: [
        { n: 55, fr: "Ar-Rahman - La Grace", en: "Ar-Rahman - Grace", ar: "الرحمن"    },
        { n: 25, fr: "Le Critere",            en: "The Criterion",     ar: "الفرقان"   },
        { n: 18, fr: "Al-Kahf",              en: "The Cave",           ar: "الكهف"     },
        { n: 56, fr: "L'Evenement",          en: "The Event",          ar: "الواقعة"   },
        { n: 2,  fr: "Al-Baqara",            en: "The Cow",            ar: "البقرة"    },
      ],
    };

  if (h >= 17 && h < 21)
    return {
      period: { fr: "Lecture du soir", en: "Evening Reading", ar: "ورد المساء" },
      icon:   "fa-cloud-moon",
      surahs: [
        { n: 36,  fr: "Coeur du Coran",  en: "Heart of Quran",      ar: "قلب القرآن" },
        { n: 67,  fr: "Rappel du soir",  en: "Evening Reminder",    ar: "الملك"      },
        { n: 55,  fr: "Ar-Rahman",       en: "The Merciful",        ar: "الرحمن"     },
        { n: 59,  fr: "Al-Hashr",        en: "The Gathering",       ar: "الحشر"      },
        { n: 103, fr: "Le Temps",        en: "Time",                ar: "العصر"      },
      ],
    };

  return {
    period: { fr: "Lecture de nuit", en: "Night Reading", ar: "ورد الليل" },
    icon:   "fa-moon",
    surahs: [
      { n: 67,  fr: "Al-Mulk - Avant le sommeil", en: "Al-Mulk - Before Sleep", ar: "الملك"   },
      { n: 32,  fr: "As-Sajda",                   en: "The Prostration",         ar: "السجدة"  },
      { n: 36,  fr: "Ya-Sin du soir",             en: "Ya-Sin at Night",         ar: "يس"      },
      { n: 112, fr: "Al-Ikhlas",                  en: "Sincerity",               ar: "الإخلاص" },
      { n: 113, fr: "Al-Falaq",                   en: "The Dawn",                ar: "الفلق"   },
    ],
  };
}
