/**
 * Reciters catalogue for Hafs + Warsh riwayat.
 *
 * CDN types:
 *   - 'islamic'   → cdn.islamic.network/quran/audio/128/{cdn}/{globalAyahNum}.mp3
 *   - 'everyayah' → everyayah.com/data/{cdn}/{SSSAAA}.mp3  (SSS=surah, AAA=ayahInSurah)
 */

const SUPPLEMENTAL_HAFS_RECITERS = [
  {
    id: "abu_bakr_ash_shaatree",
    name: "أبو بكر الشاطري",
    nameEn: "Abu Bakr Ash-Shaatree",
    nameFr: "Abou Bakr Ach-Chaatri",
    style: "murattal",
    cdn: "Abu_Bakr_Ash-Shaatree_128kbps",
    cdnType: "everyayah",
    audioMode: "ayah",
    country: "KSA",
    source: "everyayah",
    bio: {
      fr: "Abu Bakr Ash-Shaatree, né en 1970 à Taïf en Arabie saoudite, est un imam et récitateur qui a officié au Masjid al-Haram à La Mecque et dans plusieurs autres grandes mosquées. Il mémorisa le Coran dans son enfance et étudia le tajweed auprès de maîtres saoudiens reconnus. Sa voix distinctive, d'une douceur veloutée et d'une musicalité naturelle, lui a valu une popularité considérable dans le monde islamique. Son style murattal se distingue par des intonations subtilement mélodiques qui confèrent à ses récitations une beauté accessible à tous. Ses enregistrements sont parmi les plus téléchargés sur les plateformes islamiques et sont très utilisés pour la mémorisation du Coran.",
      en: "Abu Bakr Ash-Shaatree, born in 1970 in Taif, Saudi Arabia, is an imam and reciter who has served at Masjid al-Haram in Mecca and several other major mosques. He memorized the Quran in his childhood and studied tajweed under recognized Saudi masters. His distinctive voice, of velvety softness and natural musicality, has earned him considerable popularity in the Islamic world. His murattal style is marked by subtly melodic intonations that lend his recitations a beauty accessible to all. His recordings are among the most downloaded on Islamic platforms and are widely used for Quran memorization.",
      ar: "أبو بكر الشاطري، وُلد عام 1970 بالطائف في المملكة العربية السعودية، إمام وقارئ خدم في المسجد الحرام بمكة المكرمة وعدد من المساجد الكبرى. حفظ القرآن في طفولته وتلقّى التجويد على يد مشايخ سعوديين معروفين. صوته المتميز الناعم كالمخمل بموسيقية طبيعية أكسبه شعبية واسعة في العالم الإسلامي. يتميز أسلوبه في الترتيل بتنغيمات لحنية رقيقة تضفي على تلاوته جمالاً في متناول الجميع. تسجيلاته من أكثر المحمّلات على المنصات الإسلامية وتُستخدم على نطاق واسع في حفظ القرآن الكريم.",
    },
  },
  {
    id: "ahmed_neana",
    name: "أحمد نعناع",
    nameEn: "Ahmed Neana",
    nameFr: "Ahmed Neana",
    style: "murattal",
    cdn: "Ahmed_Neana_128kbps",
    cdnType: "everyayah",
    audioMode: "ayah",
    country: "Egypt",
    source: "everyayah",
    bio: {
      fr: "Ahmed Neana est un récitateur égyptien au style murattal posé et précis. Il est apprécié pour sa maîtrise des règles du tajweed et la clarté de sa diction.",
      en: "Ahmed Neana is an Egyptian reciter with a calm and precise murattal style. He is appreciated for his mastery of tajweed rules and the clarity of his diction.",
      ar: "أحمد نعناع قارئ مصري يتميز بأسلوب ترتيل هادئ ودقيق. يُقدَّر لإتقانه أحكام التجويد ووضوح نطقه.",
    },
  },
  {
    id: "akram_alalaqimy",
    name: "أكرم العلاقمي",
    nameEn: "Akram Al-Alaqimy",
    nameFr: "Akram Al-Alaqimi",
    style: "murattal",
    cdn: "Akram_AlAlaqimy_128kbps",
    cdnType: "everyayah",
    audioMode: "ayah",
    source: "everyayah",
    bio: {
      fr: "Akram Al-Alaqimy est un récitateur irakien connu pour sa récitation fluide et sa voix expressive. Son style murattal se caractérise par une grande fidélité aux règles traditionnelles de récitation.",
      en: "Akram Al-Alaqimy is an Iraqi reciter known for his fluid recitation and expressive voice. His murattal style is characterized by strong adherence to traditional recitation rules.",
      ar: "أكرم العلاقمي قارئ عراقي يُعرف بتلاوته السلسة وصوته المعبّر. يتميز أسلوبه في الترتيل بالالتزام الدقيق بقواعد التلاوة التقليدية.",
    },
  },
  {
    id: "ghamadi_40",
    name: "سعد الغامدي",
    nameEn: "Saad Al-Ghamdi",
    nameFr: "Saad Al-Ghamdi",
    style: "murattal",
    cdn: "Ghamadi_40kbps",
    cdnType: "everyayah",
    audioMode: "ayah",
    country: "KSA",
    source: "everyayah",
    bio: {
      fr: "Saad Al-Ghamdi, né le 19 mai 1967 à Dammam en Arabie saoudite, est un imam et récitateur de renommée internationale. Il mémorisa le Coran à l'âge de vingt-deux ans et se forma en tajweed auprès de cheikhs saoudiens reconnus. Imam dans plusieurs mosquées saoudiennes, il est connu pour sa voix puissante aux résonances profondes et son style murattal d'une clarté lumineuse. Ses enregistrements, diffusés dans le monde entier, comptent parmi les plus appréciés des auditeurs arabophones et non arabophones, et sont couramment utilisés dans l'enseignement coranique. Ses récitations des dernières sourates du Coran sont particulièrement populaires pour la prière quotidienne.",
      en: "Saad Al-Ghamdi, born May 19, 1967, in Dammam, Saudi Arabia, is an internationally renowned imam and reciter. He memorized the Quran at the age of twenty-two and trained in tajweed under recognized Saudi sheikhs. Imam in several Saudi mosques, he is known for his powerful voice with deep resonance and his murattal style of luminous clarity. His recordings, broadcast worldwide, are among the most appreciated by Arabic and non-Arabic speaking listeners, and are commonly used in Quranic education. His recitations of the last surahs of the Quran are particularly popular for daily prayer.",
      ar: "سعد الغامدي، وُلد في 19 مايو 1967 بالدمام في المملكة العربية السعودية، إمام وقارئ ذو شهرة عالمية. حفظ القرآن في الثانية والعشرين من عمره وتتلمذ في التجويد على يد مشايخ سعوديين معروفين. إمام في مساجد سعودية عدة، يُعرف بصوته القوي العميق الرنين وأسلوبه في الترتيل ذي الصفاء المضيء. تسجيلاته المنتشرة في أرجاء العالم من أكثر ما يُقدَّر لدى المستمعين الناطقين بالعربية وغيرهم وتُستخدم شائعاً في التعليم القرآني. تلاوته لسور الجزء الأخير من القرآن شائعة بشكل خاص في الصلاة اليومية.",
    },
  },
  {
    id: "husary_muallim",
    name: "الحصري المعلم",
    nameEn: "Al-Husary Muallim",
    nameFr: "Al-Housri Muallim",
    style: "murattal",
    cdn: "Husary_Muallim_128kbps",
    cdnType: "everyayah",
    audioMode: "ayah",
    country: "Egypt",
    source: "everyayah",
    bio: {
      fr: "Version pédagogique de la récitation de Mahmoud Khalil Al-Husary (1917-1980), conçue pour l'apprentissage du Coran. Chaque verset est récité puis répété avec une pause pour permettre à l'élève de s'exercer.",
      en: "Teaching version of Mahmoud Khalil Al-Husary's (1917-1980) recitation, designed for Quran learning. Each verse is recited then repeated with a pause to allow the student to practice.",
      ar: "نسخة تعليمية من تلاوة محمود خليل الحصري (1917-1980)، مصممة لتعلم القرآن. يُتلى كل آية ثم تُعاد مع توقف ليتمكن الطالب من التدرب.",
    },
  },
  {
    id: "husary_mujawwad_hafs",
    name: "الحصري مجود",
    nameEn: "Al-Husary Mujawwad",
    nameFr: "Al-Housri Mujawwad",
    style: "mujawwad",
    cdn: "Husary_Mujawwad_64kbps",
    cdnType: "everyayah",
    audioMode: "ayah",
    country: "Egypt",
    source: "everyayah",
    bio: {
      fr: "Version mujawwad (embellie) de la récitation de Mahmoud Khalil Al-Husary (1917-1980), pionnier de l'enregistrement coranique en Égypte. Ce style orné met en valeur l'étendue de sa maîtrise vocale et mélodique.",
      en: "Mujawwad (embellished) version of Mahmoud Khalil Al-Husary's (1917-1980) recitation, a pioneer of Quran recording in Egypt. This ornate style showcases the full extent of his vocal and melodic mastery.",
      ar: "نسخة مجوّدة من تلاوة محمود خليل الحصري (1917-1980)، رائد التسجيل القرآني في مصر. هذا الأسلوب المزخرف يُبرز مدى إتقانه الصوتي والنغمي.",
    },
  },
  {
    id: "khalid_abdullaah_qahtani_hafs",
    name: "خالد عبد الله القحطاني",
    nameEn: "Khalid Abdullah Al-Qahtani",
    nameFr: "Khaled Abdullah Al-Qahtani",
    style: "murattal",
    cdn: "Khaalid_Abdullaah_al-Qahtaanee_192kbps",
    cdnType: "everyayah",
    audioMode: "ayah",
    country: "KSA",
    source: "everyayah",
    bio: {
      fr: "Khalid Abdullah Al-Qahtani est un récitateur saoudien au style murattal clair et mesuré. Il est reconnu pour la qualité de ses enregistrements et sa récitation accessible à tous les niveaux d'auditeurs.",
      en: "Khalid Abdullah Al-Qahtani is a Saudi reciter with a clear and measured murattal style. He is recognized for the quality of his recordings and his recitation accessible to all levels of listeners.",
      ar: "خالد عبد الله القحطاني قارئ سعودي يتميز بأسلوب ترتيل واضح ومتزن. يُعرف بجودة تسجيلاته وتلاوته المناسبة لجميع مستويات المستمعين.",
    },
  },
  {
    id: "mustafa_ismail",
    name: "مصطفى إسماعيل",
    nameEn: "Mustafa Ismail",
    nameFr: "Mustafa Ismail",
    style: "mujawwad",
    cdn: "Mustafa_Ismail_48kbps",
    cdnType: "everyayah",
    audioMode: "ayah",
    country: "Egypt",
    source: "everyayah",
    bio: {
      fr: "Mustafa Ismail (1905-1978), originaire de Mit Ghazal en Égypte, est considéré comme l'un des plus grands maîtres du style mujawwad dans l'histoire de la récitation coranique. Doté d'une tessiture vocale extraordinaire couvrant plus de deux octaves, il pouvait naviguer entre les maqamat arabes avec une virtuosité inégalée. Récitateur officiel de la présidence égyptienne, il a accompagné le président Nasser dans ses voyages officiels. Son influence sur l'école égyptienne de récitation mélodique est immense et perdure aujourd'hui.",
      en: "Mustafa Ismail (1905-1978), from Mit Ghazal in Egypt, is considered one of the greatest masters of the mujawwad style in the history of Quranic recitation. Blessed with an extraordinary vocal range spanning over two octaves, he could navigate between Arabic maqamat with unmatched virtuosity. Official reciter of the Egyptian presidency, he accompanied President Nasser on official trips. His influence on the Egyptian school of melodic recitation is immense and endures to this day.",
      ar: "مصطفى إسماعيل (1905-1978)، من ميت غزال بمصر، يُعتبر من أعظم أساتذة التلاوة المجوّدة في تاريخ القراءة القرآنية. تمتع بمساحة صوتية استثنائية تتجاوز أوكتافين مكّنته من التنقل بين المقامات العربية ببراعة لا مثيل لها. كان قارئ الرئاسة المصرية ورافق الرئيس عبد الناصر في رحلاته الرسمية. تأثيره على مدرسة التلاوة المصرية المقامية عظيم ولا يزال مستمراً.",
    },
  },
  {
    id: "nabil_rifai",
    name: "نبيل الرفاعي",
    nameEn: "Nabil Ar-Rifai",
    nameFr: "Nabil Ar-Rifaï",
    style: "murattal",
    cdn: "Nabil_Rifa3i_48kbps",
    cdnType: "everyayah",
    audioMode: "ayah",
    source: "everyayah",
    bio: {
      fr: "Nabil Ar-Rifai est un récitateur syrien reconnu pour son style murattal serein et spirituel. Sa voix douce et méditative est particulièrement appréciée pour l'écoute quotidienne.",
      en: "Nabil Ar-Rifai is a Syrian reciter recognized for his serene and spiritual murattal style. His soft and meditative voice is particularly appreciated for daily listening.",
      ar: "نبيل الرفاعي قارئ سوري يُعرف بأسلوبه الهادئ والروحاني في الترتيل. صوته اللطيف والتأملي محبوب بشكل خاص للاستماع اليومي.",
    },
  },
  {
    id: "salah_al_budair",
    name: "صلاح البدير",
    nameEn: "Salah Al-Budair",
    nameFr: "Salah Al-Budaïr",
    style: "murattal",
    cdn: "Salah_Al_Budair_128kbps",
    cdnType: "everyayah",
    audioMode: "ayah",
    country: "KSA",
    source: "everyayah",
    bio: {
      fr: "Salah Al-Budair, né en 1963 en Arabie saoudite, est l'un des imams du Masjid an-Nabawi à Médine, où il officie depuis plusieurs décennies. Diplômé de l'Université islamique de Médine en jurisprudence islamique, il fut nommé imam du Prophète's Mosque dans les années 1980. Sa voix empreinte d'une tendresse et d'une ferveur particulières, ses intonations qui font vibrer les cœurs lors des prières de nuit du Ramadan, et ses invocations du qounout chargées d'émotion font de lui l'un des imams les plus appréciés de la mosquée du Prophète. Ses enregistrements sont diffusés dans le monde entier et touchent des millions de fidèles.",
      en: "Salah Al-Budair, born in 1963 in Saudi Arabia, is one of the imams of Masjid an-Nabawi in Medina, where he has served for several decades. A graduate of the Islamic University of Medina in Islamic jurisprudence, he was appointed imam of the Prophet's Mosque in the 1980s. His voice of particular tenderness and fervor, his intonations that move hearts during Ramadan night prayers, and his emotionally charged qounout supplications make him one of the most appreciated imams of the Prophet's Mosque. His recordings are broadcast worldwide and touch millions of worshippers.",
      ar: "صلاح البدير، وُلد عام 1963 في المملكة العربية السعودية، أحد أئمة المسجد النبوي بالمدينة المنورة حيث يخدم منذ عقود. خريج الجامعة الإسلامية بالمدينة في الفقه الإسلامي، عُيّن إماماً في مسجد النبي صلى الله عليه وسلم في الثمانينات. صوته الذي يتسم برقة وخشوع خاصين وتنغيماته التي تحرك القلوب في صلوات الليل رمضان ودعاء قنوته المشبع بالعاطفة يجعلانه من أحب أئمة المسجد النبوي. تسجيلاته تُذاع في أنحاء العالم وتلمس ملايين المصلين.",
    },
  },
  {
    id: "mahmoud_ali_al_banna",
    name: "محمود علي البنا",
    nameEn: "Mahmoud Ali Al-Banna",
    nameFr: "Mahmoud Ali Al-Banna",
    style: "mujawwad",
    cdn: "mahmoud_ali_al_banna_32kbps",
    cdnType: "everyayah",
    audioMode: "ayah",
    country: "Egypt",
    source: "everyayah",
    bio: {
      fr: "Mahmoud Ali Al-Banna (1926 – 1985), né dans le gouvernorat de Daqahlia en Égypte, fut l'un des maîtres incontournables de l'école égyptienne de récitation mujawwad. Après avoir mémorisé le Coran dans son enfance et obtenu l'ijazah dans plusieurs lectures canoniques, il fut nommé récitateur officiel de la radio égyptienne où ses récitations enchantaient des millions d'auditeurs. Sa voix chaude et généreuse, dotée d'une tessiture large et d'une maîtrise exemplaire des maqamat, en a fait un des représentants les plus aimés du style orné de la récitation coranique égyptienne. Ses enregistrements, diffusés régulièrement sur les radios arabes, demeurent des classiques du genre mujawwad.",
      en: "Mahmoud Ali Al-Banna (1926–1985), born in Daqahlia Governorate, Egypt, was one of the indispensable masters of the Egyptian mujawwad recitation school. After memorizing the Quran in his childhood and obtaining ijazah in several canonical readings, he was appointed official reciter for Egyptian radio where his recitations enchanted millions of listeners. His warm and generous voice, endowed with a wide range and exemplary mastery of maqamat, made him one of the most beloved representatives of the ornate style of Egyptian Quranic recitation. His recordings, regularly broadcast on Arab radios, remain classics of the mujawwad genre.",
      ar: "محمود علي البنا (1926–1985)، من محافظة الدقهلية بمصر، كان من أبرز أعلام مدرسة التلاوة المجوّدة المصرية. بعد أن حفظ القرآن في طفولته وحصل على الإجازة في قراءات عدة، عُيّن قارئاً رسمياً للإذاعة المصرية حيث كانت تلاواته تسحر ملايين المستمعين. صوته الدافئ الغني بمساحته الصوتية الواسعة وإتقانه المثالي للمقامات جعل منه أحد أحب ممثلي الأسلوب المزخرف في التلاوة المصرية. تسجيلاته التي تُذاع بانتظام على الإذاعات العربية تبقى من كلاسيكيات فن التجويد.",
    },
  },
  {
    id: "karim_mansoori",
    name: "كريم منصوري",
    nameEn: "Karim Mansoori",
    nameFr: "Karim Mansouri",
    style: "murattal",
    cdn: "Karim_Mansoori_40kbps",
    cdnType: "everyayah",
    audioMode: "ayah",
    source: "everyayah",
    bio: {
      fr: "Karim Mansoori est un récitateur iranien distingué par son style murattal élégant et posé. Il a remporté plusieurs prix dans des concours internationaux de récitation coranique.",
      en: "Karim Mansoori is an Iranian reciter distinguished by his elegant and composed murattal style. He has won several prizes in international Quran recitation competitions.",
      ar: "كريم منصوري قارئ إيراني يتميز بأسلوب ترتيل أنيق ورصين. حاز على عدة جوائز في مسابقات التلاوة القرآنية الدولية.",
    },
  },
  {
    id: "muhsin_al_qasim",
    name: "محسن القاسم",
    nameEn: "Muhsin Al-Qasim",
    nameFr: "Mohcine Al-Qasim",
    style: "murattal",
    cdn: "Muhsin_Al_Qasim_192kbps",
    cdnType: "everyayah",
    audioMode: "ayah",
    country: "KSA",
    source: "everyayah",
    bio: {
      fr: "Muhsin Al-Qasim, né en 1961 en Arabie saoudite, est un imam et récitateur du Masjid an-Nabawi à Médine, où il officie depuis plusieurs années. Diplômé en études islamiques, il a consacré sa vie à l'enseignement du Coran et à la direction des prières dans la mosquée du Prophète. Sa récitation se distingue par une tranquillité et une sérénité apaisantes, une diction impeccable et une application rigoureuse des règles du tajweed qui en font une référence pour les étudiants. Ses enregistrements des trente juzʼ du Coran sont très utilisés dans les cours de mémorisation.",
      en: "Muhsin Al-Qasim, born in 1961 in Saudi Arabia, is an imam and reciter at Masjid an-Nabawi in Medina, where he has served for many years. Holding a degree in Islamic studies, he has devoted his life to teaching the Quran and leading prayers at the Prophet's Mosque. His recitation is distinguished by a soothing tranquility and serenity, impeccable diction, and rigorous application of tajweed rules that make him a reference for students. His recordings of all thirty juzʼ of the Quran are widely used in memorization courses.",
      ar: "محسن القاسم، وُلد عام 1961 في المملكة العربية السعودية، إمام وقارئ في المسجد النبوي بالمدينة المنورة حيث يخدم منذ سنوات عديدة. حامل شهادة في الدراسات الإسلامية، كرّس حياته لتعليم القرآن وإمامة الصلاة في مسجد النبي صلى الله عليه وسلم. تتميز تلاوته بسكينة وهدوء مريحين ونطق دقيق وتطبيق صارم لأحكام التجويد يجعلانه مرجعاً للطلاب. تسجيلاته للأجزاء الثلاثين من القرآن تُستخدم على نطاق واسع في دروس الحفظ.",
    },
  },
  {
    id: "salaah_bukhatir",
    name: "صلاح بوخاطر",
    nameEn: "Salah Abdul Rahman Bukhatir",
    nameFr: "Salah Boukhatir",
    style: "murattal",
    cdn: "Salaah_AbdulRahman_Bukhatir_128kbps",
    cdnType: "everyayah",
    audioMode: "ayah",
    source: "everyayah",
    bio: {
      fr: "Salah Bukhatir est un récitateur émirati originaire de Sharjah, aux Émirats arabes unis. Il est connu pour sa voix chaleureuse et son style murattal accessible qui attire un large public.",
      en: "Salah Bukhatir is an Emirati reciter from Sharjah, United Arab Emirates. He is known for his warm voice and accessible murattal style that attracts a wide audience.",
      ar: "صلاح بوخاطر قارئ إماراتي من الشارقة بالإمارات العربية المتحدة. يُعرف بصوته الدافئ وأسلوبه في الترتيل الذي يجذب شريحة واسعة من المستمعين.",
    },
  },
  {
    id: "yaser_salamah",
    name: "ياسر سلامة",
    nameEn: "Yaser Salamah",
    nameFr: "Yasser Salamah",
    style: "murattal",
    cdn: "Yaser_Salamah_128kbps",
    cdnType: "everyayah",
    audioMode: "ayah",
    source: "everyayah",
    bio: {
      fr: "Yaser Salamah est un récitateur égyptien au style murattal expressif et captivant. Il est apprécié pour ses variations mélodiques subtiles et la profondeur émotionnelle de sa récitation.",
      en: "Yaser Salamah is an Egyptian reciter with an expressive and captivating murattal style. He is appreciated for his subtle melodic variations and the emotional depth of his recitation.",
      ar: "ياسر سلامة قارئ مصري يتميز بأسلوب ترتيل معبّر وآسر. يُقدَّر لتنويعاته اللحنية الدقيقة وعمق تلاوته العاطفي.",
    },
  },
  {
    id: "aziz_alili",
    name: "عزيز عليلي",
    nameEn: "Aziz Alili",
    nameFr: "Aziz Alili",
    style: "murattal",
    cdn: "aziz_alili_128kbps",
    cdnType: "everyayah",
    audioMode: "ayah",
    source: "everyayah",
    bio: {
      fr: "Aziz Alili est un récitateur originaire de Macédoine du Nord, d'origine albanaise. Il représente la tradition de récitation coranique des Balkans et se distingue par son style murattal soigné et respectueux des traditions.",
      en: "Aziz Alili is a reciter from North Macedonia of Albanian origin. He represents the Balkan tradition of Quranic recitation and is distinguished by his careful murattal style respectful of traditions.",
      ar: "عزيز عليلي قارئ من مقدونيا الشمالية من أصل ألباني. يمثل تقاليد التلاوة القرآنية في البلقان ويتميز بأسلوب ترتيل متقن ومحافظ على التقاليد.",
    },
  },
  {
    id: "khalefa_al_tunaiji",
    name: "خليفة الطنيجي",
    nameEn: "Khalefa Al-Tunaiji",
    nameFr: "Khalifa Al-Tunaiji",
    style: "murattal",
    cdn: "khalefa_al_tunaiji_64kbps",
    cdnType: "everyayah",
    audioMode: "ayah",
    source: "everyayah",
    bio: {
      fr: "Khalefa Al-Tunaiji est un récitateur émirati originaire d'Abou Dabi, considéré comme l'une des plus belles voix des Émirats arabes unis. Il mémorisa le Coran dans son enfance et se forma en tajweed sous la direction de maîtres reconnus. Imam dans plusieurs mosquées des Émirats, il est apprécié pour sa voix distinctive, profonde et mélodieuse, et son style murattal d'une grande sérénité. Il représente la tradition de récitation du Golfe arabe et est l'un des récitateurs émiratis les plus diffusés sur les plateformes islamiques. Ses enregistrements sont particulièrement appréciés pour l'écoute nocturne et la méditation.",
      en: "Khalefa Al-Tunaiji is an Emirati reciter from Abu Dhabi, considered one of the most beautiful voices in the United Arab Emirates. He memorized the Quran in his childhood and trained in tajweed under recognized masters. Imam in several Emirati mosques, he is appreciated for his distinctive, deep and melodious voice and his murattal style of great serenity. He represents the recitation tradition of the Arabian Gulf and is one of the most-streamed Emirati reciters on Islamic platforms. His recordings are particularly valued for nocturnal listening and meditation.",
      ar: "خليفة الطنيجي قارئ إماراتي من أبوظبي، يُعدّ من أجمل الأصوات في الإمارات العربية المتحدة. حفظ القرآن في طفولته وتدرّب على التجويد تحت إشراف مشايخ معروفين. إمام في مساجد إماراتية عدة، يُقدَّر لصوته المتميز العميق الرنين وأسلوبه في الترتيل المتسم بسكينة عميقة. يمثل تقليد التلاوة في الخليج العربي وهو من أكثر القراء الإماراتيين بثاً على المنصات الإسلامية. تسجيلاته محبوبة بشكل خاص للاستماع الليلي والتأمل.",
    },
  },
  {
    id: "ahmed_ibn_ali_al_ajamy_64",
    name: "أحمد بن علي العجمي",
    nameEn: "Ahmed ibn Ali al-Ajmy",
    nameFr: "Ahmed ibn Ali al-Ajmi",
    style: "murattal",
    cdn: "Ahmed_ibn_Ali_al-Ajamy_64kbps_QuranExplorer.Com",
    cdnType: "everyayah",
    audioMode: "ayah",
    country: "KSA",
    source: "everyayah",
    bio: {
      fr: "Ahmed ibn Ali Al-Ajmy, né en 1968 à Al-Ahsa en Arabie saoudite, est un récitateur et imam d'une grande popularité dans le monde musulman. Il mémorisa le Coran dans son enfance et fut formé en tajweed sous la direction de maîtres reconnus de la péninsule arabique. Imam dans plusieurs mosquées saoudiennes, il se distingue par une voix d'une puissance et d'une expressivité saisissantes, dotée d'un timbre grave et chaleureux qui touche immédiatement les cœurs. Son tajweed d'une précision remarquable et son rythme expressif font de ses enregistrements une référence très appréciée pour la prière et la mémorisation. Il figure parmi les récitateurs saoudiens les plus diffusés sur les plateformes islamiques mondiales.",
      en: "Ahmed ibn Ali Al-Ajmy, born in 1968 in Al-Ahsa, Saudi Arabia, is a reciter and imam of great popularity in the Muslim world. He memorized the Quran in his childhood and was trained in tajweed under recognized masters of the Arabian Peninsula. Imam in several Saudi mosques, he is distinguished by a voice of striking power and expressiveness, endowed with a deep and warm timbre that immediately touches hearts. His remarkably precise tajweed and expressive rhythm make his recordings a highly appreciated reference for prayer and memorization. He ranks among the most-streamed Saudi reciters on global Islamic platforms.",
      ar: "أحمد بن علي العجمي، وُلد عام 1968 بالأحساء في المملكة العربية السعودية، قارئ وإمام يحظى بشعبية كبيرة في العالم الإسلامي. حفظ القرآن في طفولته وتتلمذ في التجويد على يد مشايخ معروفين من شبه الجزيرة العربية. إمام في مساجد سعودية عدة، يتميز بصوت ذي قوة وتعبير لافتَين وجرس عميق دافئ يلمس القلوب فوراً. تجويده الدقيق بشكل ملحوظ وإيقاعه التعبيري يجعلان تسجيلاته مرجعاً محبوباً للصلاة والحفظ. يحتل مكانة بارزة بين أكثر القراء السعوديين بثاً على المنصات الإسلامية العالمية.",
    },
  },
  {
    id: "abdullah_awwad_al_juhaynee",
    name: "عبد الله عواد الجهني",
    nameEn: "Abdullah Awwad Al-Juhaynee",
    nameFr: "Abdullah Awwad Al-Juhaynee",
    style: "murattal",
    cdn: "Abdullaah_3awwaad_Al-Juhaynee_128kbps",
    cdnType: "everyayah",
    audioMode: "ayah",
    country: "KSA",
    source: "everyayah",
    bio: {
      fr: "Abdullah Awwad Al-Juhaynee, né en 1976 en Arabie saoudite, est un imam et récitateur au Masjid al-Haram à La Mecque, où il fut nommé en 2013. Il mémorisa le Coran dans son enfance et obtint une licence en études coraniques avant d'être sélectionné pour rejoindre l'élite des imams du Haram. Sa voix d'une majesté et d'une profondeur remarquables, alliée à une maîtrise impeccable du tajweed, lui a valu une reconnaissance internationale rapide. Son style murattal, caractérisé par une sérénité communicative et un débit mesuré, touche particulièrement les fidèles lors des prières du Ramadan et du Hajj. Il représente la nouvelle génération des imams du Haram qui combinent excellence académique et talent vocal.",
      en: "Abdullah Awwad Al-Juhaynee, born in 1976 in Saudi Arabia, is an imam and reciter at Masjid al-Haram in Mecca, where he was appointed in 2013. He memorized the Quran in his childhood and obtained a degree in Quranic studies before being selected to join the elite of Haram imams. His voice of remarkable majesty and depth, combined with impeccable mastery of tajweed, earned him rapid international recognition. His murattal style, characterized by communicative serenity and measured pacing, particularly moves worshippers during Ramadan and Hajj prayers. He represents the new generation of Haram imams who combine academic excellence with vocal talent.",
      ar: "عبد الله عواد الجهني، وُلد عام 1976 في المملكة العربية السعودية، إمام وقارئ في المسجد الحرام بمكة المكرمة حيث عُيّن عام 2013. حفظ القرآن في طفولته وحصل على الليسانس في الدراسات القرآنية قبل أن يُختار ليلتحق بنخبة أئمة الحرم. صوته الهيبي العميق المتسم بعظمة ملحوظة مع إتقان التجويد أكسبه شهرة دولية سريعة. أسلوبه في الترتيل الذي يتميز بسكينة تسري في النفوس وإيقاع متأنٍّ يلمس المصلين بشكل خاص في صلوات رمضان والحج. يمثّل الجيل الجديد من أئمة الحرم الذين يجمعون بين التميز الأكاديمي والموهبة الصوتية.",
    },
  },
  {
    id: "idris_abkar",
    name: "إدريس أبكر",
    nameEn: "Idris Abkar",
    nameFr: "Idris Abkar",
    style: "murattal",
    cdn: "https://server6.mp3quran.net/abkr/",
    cdnType: "mp3quran-surah",
    audioMode: "surah",
    country: "KSA",
    source: "mp3quran",
    bio: {
      fr: "Idris Abkar, né en 1970 en Arabie saoudite, est un imam et récitateur originaire d'Afrique de l'Est (origines érythréennes), l'une des plus belles et des plus reconnaissables voix du monde islamique. Imam à Djeddah pendant de nombreuses années, il est célèbre pour son style murattal profondément émouvant qui allie une expressivité africaine à la précision classique du tajweed saoudien. Sa voix d'une richesse et d'une chaleur incomparables, et ses récitations des sourates longues et courtes du Coran, touchent les cœurs des fidèles avec une intensité particulière, surtout lors des prières de nuit du Ramadan. Ses enregistrements sont parmi les plus téléchargés sur les plateformes islamiques.",
      en: "Idris Abkar, born in 1970 in Saudi Arabia, is an imam and reciter of East African origin (Eritrean heritage), one of the most beautiful and recognizable voices in the Islamic world. Imam in Jeddah for many years, he is famous for his deeply moving murattal style that combines an African expressiveness with the classical precision of Saudi tajweed. His voice of incomparable richness and warmth, and his recitations of both long and short Quranic surahs, touch worshippers' hearts with particular intensity, especially during Ramadan night prayers. His recordings are among the most downloaded on Islamic platforms.",
      ar: "إدريس أبكر، وُلد عام 1970 في المملكة العربية السعودية، إمام وقارئ من أصول أفريقية شرقية (ذو جذور إريترية)، وأحد أجمل الأصوات وأكثرها تميزاً في العالم الإسلامي. إمام في جدة لسنوات طويلة، اشتُهر بأسلوبه في الترتيل العميق التأثير الذي يجمع بين تعبيرية أفريقية ودقة التجويد السعودي الكلاسيكي. صوته الغني الدافئ الذي لا نظير له وتلاوته لسور القرآن الطويلة والقصيرة تلمسان قلوب المصلين بشدة خاصة في صلوات الليل رمضان. تسجيلاته من أكثر المحمّلات على المنصات الإسلامية.",
    },
  },
  {
    id: "bandar_baleela",
    name: "بندر بليلة",
    nameEn: "Bandar Baleela",
    nameFr: "Bandar Baleela",
    style: "murattal",
    cdn: "https://server6.mp3quran.net/balilah/",
    cdnType: "mp3quran-surah",
    audioMode: "surah",
    country: "KSA",
    source: "mp3quran",
    bio: {
      fr: "Bandar Baleela, né en 1975 à La Mecque en Arabie saoudite, est un imam et récitateur du Masjid al-Haram depuis 2013. Docteur en études coraniques de l'Université Umm al-Qura de La Mecque, il a mémorisé le Coran dans son enfance et obtenu l'ijazah dans plusieurs lectures canoniques. Sa voix d'une clarté et d'une pureté cristallines, alliée à un style murattal d'une expressivité subtile et d'une musicalité naturelle, lui a valu une immense popularité auprès des jeunes générations de croyants. Très actif sur les réseaux sociaux islamiques, il est considéré comme l'un des imams du Haram les plus populaires de sa génération. Ses récitations, notamment celles des dernières sourates, sont parmi les plus partagées sur internet.",
      en: "Bandar Baleela, born in 1975 in Mecca, Saudi Arabia, is an imam and reciter at Masjid al-Haram since 2013. Holding a PhD in Quranic studies from Umm al-Qura University in Mecca, he memorized the Quran in his childhood and obtained ijazah in several canonical readings. His voice of crystalline clarity and purity, combined with a murattal style of subtle expressiveness and natural musicality, has earned him immense popularity among younger generations of believers. Very active on Islamic social networks, he is considered one of the most popular Haram imams of his generation. His recitations, especially of the final surahs, are among the most shared on the internet.",
      ar: "بندر بليلة، وُلد عام 1975 بمكة المكرمة في المملكة العربية السعودية، إمام وقارئ في المسجد الحرام منذ عام 2013. حاصل على الدكتوراه في الدراسات القرآنية من جامعة أم القرى بمكة، حفظ القرآن في طفولته وحصل على الإجازة في قراءات عدة. صوته الصافي النقي كالبلّور مع أسلوبه في الترتيل ذي التعبيرية الدقيقة والموسيقية الطبيعية أكسباه شعبية جارفة لدى الأجيال الشابة من المؤمنين. نشط جداً على الشبكات الاجتماعية الإسلامية، يُعدّ من أكثر أئمة الحرم شعبية في جيله. تلاواته، لا سيما تلك الخاصة بالسور الأخيرة، من أكثر ما يُشارَك على الإنترنت.",
    },
  },
  {
    id: "ahmad_al_hawashi",
    name: "أحمد الحواشي",
    nameEn: "Ahmad Al-Hawashi",
    nameFr: "Ahmad Al-Hawashi",
    style: "murattal",
    cdn: "https://server11.mp3quran.net/hawashi/",
    cdnType: "mp3quran-surah",
    audioMode: "surah",
    country: "KSA",
    source: "mp3quran",
    bio: {
      fr: "Ahmad Al-Hawashi est un récitateur saoudien reconnu pour sa voix douce et apaisante. Sa récitation est caractérisée par un rythme posé et une articulation claire qui facilite la méditation et la mémorisation du Coran.",
      en: "Ahmad Al-Hawashi is a Saudi reciter recognized for his soft and soothing voice. His recitation is characterized by a calm pace and clear articulation that facilitates meditation and Quran memorization.",
      ar: "أحمد الحواشي قارئ سعودي يُعرف بصوته الهادئ المريح. تتميز تلاوته بإيقاع متأنٍّ ونطق واضح يُسهّل التدبر وحفظ القرآن الكريم.",
    },
  },
];

const RECITERS = {
  hafs: [
    {
      id: "ar.alafasy",
      name: "مشاري العفاسي",
      nameEn: "Mishary Rashid Alafasy",
      nameFr: "Mishary Rashid Alafasy",
      style: "murattal",
      cdn: "ar.alafasy",
      cdnType: "islamic",
      bio: {
        fr: "Mishary Rashid Alafasy, né le 5 septembre 1976 à Koweït City, est diplômé de la Faculté du Coran de l'Université islamique de Médine où il a maîtrisé les dix lectures canoniques (qira'at) et le tafsir. Imam de la Grande Mosquée du Koweït depuis la fin des années 1990, il est l'un des récitateurs les plus diffusés au monde, avec plus de 11,6 millions d'abonnés YouTube et la récompense Diamond Creator Award de la plateforme en 2024. En 2008, il a reçu le premier Oscar de la créativité arabe décerné par l'Union de la créativité arabe sous l'égide de la Ligue arabe. Son style murattal se distingue par un débit fluide, des intonations expressives et une maîtrise parfaite des maqamat arabes, accessibles à un large public international. Il a également produit de nombreux nasheeds islamiques en arabe, turc, anglais et français, faisant de lui un artiste à la croisée de la tradition coranique et de la culture populaire musulmane contemporaine.",
        en: "Mishary Rashid Alafasy, born September 5, 1976, in Kuwait City, graduated from the Faculty of the Quran at the Islamic University of Madinah, where he mastered the ten canonical readings (qira'at) and Quranic exegesis. Serving as imam at the Grand Mosque of Kuwait since the late 1990s, he is one of the most-streamed reciters globally, with over 11.6 million YouTube subscribers and the platform's Diamond Creator Award in 2024. In 2008, he received the inaugural Arab Creativity Oscar from the Arab Creativity Union, sponsored by the Arab League. His murattal style is noted for fluid pacing, expressive intonation, and precise command of Arabic maqamat, making it accessible to a wide international audience. He has also produced numerous Islamic nasheeds in Arabic, Turkish, English, and French, positioning him at the intersection of classical Quranic tradition and contemporary Muslim popular culture.",
        ar: "مشاري راشد العفاسي، ولد في 5 سبتمبر 1976 بمدينة الكويت، تخرّج من كلية القرآن الكريم بالجامعة الإسلامية بالمدينة المنورة حيث أتقن القراءات العشر وعلم التفسير. يشغل منصب إمام المسجد الكبير بالكويت منذ أواخر التسعينات، وهو أحد أكثر القراء استماعاً على مستوى العالم بأكثر من 11.6 مليون مشترك في يوتيوب وجائزة Diamond Creator Award عام 2024. حاز عام 2008 على أوسكار الإبداع العربي الأول من الاتحاد العربي للإبداع برعاية جامعة الدول العربية. يتميز أسلوبه في الترتيل بالسلاسة والتعبير ودقة أداء المقامات الموسيقية العربية مما يجعله في متناول جمهور دولي واسع. أنتج أيضاً عدداً كبيراً من الأناشيد الإسلامية بالعربية والتركية والإنجليزية والفرنسية، مما يجعله نقطة التقاء بين التراث القرآني الكلاسيكي وثقافة الإسلام الشعبية المعاصرة.",
      },
    },
    {
      id: "ar.abdulbasitmurattal",
      name: "عبد الباسط عبد الصمد (مرتل)",
      nameEn: "Abdul Basit (Murattal)",
      nameFr: "Abdul Basit (Murattal)",
      style: "murattal",
      cdn: "Abdul_Basit_Murattal_192kbps",
      cdnType: "everyayah",
      bio: {
        fr: "Abdul Basit Abdul Samad (1927 – 30 novembre 1988), originaire d'Armant dans le gouvernorat de Qéna en Haute-Égypte, est universellement considéré comme l'un des plus grands récitateurs du Coran de l'histoire islamique. Il mémorisa le Coran à l'âge de dix ans et obtint l'ijazah dans les sept puis les dix lectures canoniques. Nommé récitateur officiel de la mosquée Al-Imam Al-Shafi'i au Caire puis représentant de l'Égypte aux conférences internationales, il fut le premier récitateur à enregistrer le Coran complet en styles murattal et mujawwad et remporta trois Prix mondiaux de la récitation coranique. Sa tessiture vocale exceptionnelle, couvrant plusieurs octaves avec une maîtrise parfaite des maqamat, lui vaut d'être surnommé « la voix du siècle ». Ses enregistrements, écoutés quotidiennement par des millions de personnes sur tous les continents, demeurent la référence absolue plus de trente ans après sa disparition.",
        en: "Abdul Basit Abdul Samad (1927 – November 30, 1988), from Armant in Qena Governorate, Upper Egypt, is universally regarded as one of the greatest Quran reciters in Islamic history. He memorized the Quran by age ten and obtained ijazah in the seven and then ten canonical readings. Appointed official reciter at Al-Imam Al-Shafi'i Mosque in Cairo and Egypt's representative at international conferences, he was the first reciter to record the complete Quran in both murattal and mujawwad styles and won three World Prizes in Quranic Recitation. His exceptional vocal range spanning several octaves with perfect command of maqamat earned him the title 'voice of the century.' His recordings, listened to daily by millions on every continent, remain the absolute benchmark more than thirty years after his passing.",
        ar: "عبد الباسط عبد الصمد (1927 – 30 نوفمبر 1988)، من أرمنت بمحافظة قنا بصعيد مصر، يُعدّ عالمياً من أعظم قراء القرآن في التاريخ الإسلامي. حفظ القرآن في العاشرة من عمره وحصل على الإجازة في القراءات السبع ثم العشر. عُيّن قارئاً رسمياً لمسجد الإمام الشافعي بالقاهرة ومثّل مصر في المؤتمرات الدولية، وكان أول من سجّل القرآن كاملاً بأسلوبي الترتيل والتجويد وحصل على ثلاث جوائز عالمية في التلاوة. مساحته الصوتية الاستثنائية التي تمتد عبر أوكتافات متعددة مع إتقان كامل للمقامات أكسبته لقب «صوت القرن». تسجيلاته التي يستمع إليها ملايين الأشخاص يومياً في جميع أنحاء العالم لا تزال المرجع المطلق بعد أكثر من ثلاثين عاماً على رحيله.",
      },
    },
    {
      id: "ar.abdulbasitmujawwad",
      name: "عبد الباسط عبد الصمد (مجود)",
      nameEn: "Abdul Basit (Mujawwad)",
      nameFr: "Abdul Basit (Mujawwad)",
      style: "mujawwad",
      cdn: "Abdul_Basit_Mujawwad_128kbps",
      cdnType: "everyayah",
      bio: {
        fr: "Version mujawwad (embellie) de la récitation d'Abdul Basit Abdul Samad (1927-1988). Ce style orné révèle toute l'étendue de son génie vocal avec des maqamat élaborés et une expressivité inégalée.",
        en: "Mujawwad (embellished) version of Abdul Basit Abdul Samad's (1927-1988) recitation. This ornate style reveals the full extent of his vocal genius with elaborate maqamat and unmatched expressiveness.",
        ar: "النسخة المجوّدة من تلاوة عبد الباسط عبد الصمد (1927-1988). هذا الأسلوب المزخرف يكشف عن كامل عبقريته الصوتية بمقامات متقنة وتعبير لا مثيل له.",
      },
    },
    {
      id: "ar.husary",
      name: "محمود خليل الحصري",
      nameEn: "Mahmoud Khalil Al-Husary",
      nameFr: "Mahmoud Khalil Al-Husary",
      style: "murattal",
      cdn: "ar.husary",
      cdnType: "islamic",
      bio: {
        fr: "Mahmoud Khalil Al-Husary (17 septembre 1917 – 24 novembre 1980), né à Shobra al-Namla dans le gouvernorat de Gharbia en Égypte, est le pionnier incontesté de l'enregistrement coranique et la référence mondiale en matière de tajweed. Il mémorisa le Coran à huit ans et obtint l'ijazah dans les dix lectures canoniques. Nommé récitateur principal de la mosquée Al-Azhar puis de la mosquée Al-Hussein au Caire, il fut le premier à enregistrer le Coran pour la radio égyptienne en 1944 et produisit les premières éditions complètes enregistrées avec tajweed explicatif destinées à l'enseignement. L'UNESCO le récompensa en 1967 pour sa contribution à la diffusion de la culture islamique. Sa récitation murattal, d'une précision millimétrée, est utilisée comme étalon dans les instituts coraniques du monde entier et demeure la référence absolue pour l'enseignement du tajweed.",
        en: "Mahmoud Khalil Al-Husary (September 17, 1917 – November 24, 1980), born in Shobra al-Namla in Gharbia Governorate, Egypt, is the undisputed pioneer of Quran recording and the global benchmark for tajweed. He memorized the Quran at age eight and obtained ijazah in all ten canonical readings. Appointed chief reciter at Al-Azhar Mosque then Al-Hussein Mosque in Cairo, he was the first to record the Quran for Egyptian radio in 1944 and produced the first complete recorded editions with explanatory tajweed for educational use. UNESCO honored him in 1967 for his contribution to Islamic culture. His murattal recitation, of unparalleled precision, is used as the standard in Quranic institutes worldwide and remains the absolute reference for tajweed instruction.",
        ar: "محمود خليل الحصري (17 سبتمبر 1917 – 24 نوفمبر 1980)، ولد في شبرا النملة بمحافظة الغربية بمصر، هو المرجع العالمي الأبرز للتجويد ورائد تسجيل القرآن الكريم بلا منازع. حفظ القرآن في الثامنة من عمره وحصل على الإجازة في القراءات العشر. عُيّن قارئاً رئيسياً لمسجد الأزهر ثم مسجد الحسين بالقاهرة، وكان أول من سجّل القرآن للإذاعة المصرية عام 1944 وأنتج أولى الطبعات المسجلة الكاملة بالتجويد التعليمي. كرّمته اليونسكو عام 1967 لإسهامه في نشر الثقافة الإسلامية. تلاوته بالترتيل، التي تتسم بدقة لا مثيل لها، تُستخدم معياراً في المعاهد القرآنية حول العالم وتبقى مرجعاً مطلقاً لتعليم أحكام التجويد.",
      },
    },
    {
      id: "ar.minshawi",
      name: "محمد صديق المنشاوي (مرتل)",
      nameEn: "Muhammad Siddiq al-Minshawi",
      nameFr: "Muhammad Siddiq al-Minshawi",
      style: "murattal",
      cdn: "ar.minshawi",
      cdnType: "islamic",
      bio: {
        fr: "Muhammad Siddiq al-Minshawi (20 janvier 1920 – 20 juin 1969), né à El-Mansha dans le gouvernorat de Sohag en Haute-Égypte, est surnommé « la voix d'or du Coran » et demeure l'un des récitateurs les plus aimés de l'histoire islamique. Issu d'une famille de récitateurs, il mémorisa le Coran à onze ans et maîtrisa les dix lectures canoniques en obtenant l'ijazah de maîtres reconnus. Nommé récitateur officiel des mosquées d'État égyptiennes, il représenta l'Égypte dans de nombreux pays et récita devant des foules immenses. Sa voix d'une pureté et d'une expressivité inégalées, capable de passer d'une profonde sobriété murattal à l'ornementation complexe du style mujawwad, en a fait une figure tutélaire de l'école égyptienne. Disparu prématurément à quarante-neuf ans, ses enregistrements continuent d'émouvoir des générations d'auditeurs à travers le monde.",
        en: "Muhammad Siddiq al-Minshawi (January 20, 1920 – June 20, 1969), born in El-Mansha in Sohag Governorate, Upper Egypt, is nicknamed 'the golden voice of the Quran' and remains one of the most beloved reciters in Islamic history. From a family of reciters, he memorized the Quran at eleven and mastered the ten canonical readings, obtaining ijazah from recognized masters. Appointed official reciter of Egyptian state mosques, he represented Egypt in many countries and recited before enormous audiences. His voice—of unmatched purity and expressiveness, moving seamlessly from deep murattal sobriety to the complex ornamentation of mujawwad—has made him a patron figure of the Egyptian school. Gone prematurely at forty-nine, his recordings continue to move generations of listeners worldwide.",
        ar: "محمد صديق المنشاوي (20 يناير 1920 – 20 يونيو 1969)، ولد في المنشاة بمحافظة سوهاج بصعيد مصر، لُقّب بـ«الصوت الذهبي للقرآن» ويبقى من أحب القراء إلى قلوب المسلمين في التاريخ الإسلامي. نشأ في أسرة من القراء وحفظ القرآن في الحادية عشرة وأتقن القراءات العشر حاصلاً على الإجازة من مشايخ معروفين. عُيّن قارئاً رسمياً لمساجد الدولة المصرية ومثّل مصر في بلدان عديدة وتلا أمام جماهير غفيرة. صوته الذي يتسم بنقاء وتعبير لا مثيل لهما وقدرة على الانتقال من الترتيل الرصين إلى زخارف التجويد المعقدة جعل منه رمزاً للمدرسة المصرية. رحل مبكراً عن تسعة وأربعين عاماً وتسجيلاته لا تزال تُؤثّر في أجيال من المستمعين حول العالم.",
      },
    },
    {
      id: "ar.minshawimujawwad",
      name: "المنشاوي (مجود)",
      nameEn: "Al-Minshawi (Mujawwad)",
      nameFr: "Al-Minshawi (Mujawwad)",
      style: "mujawwad",
      cdn: "Minshawy_Mujawwad_192kbps",
      cdnType: "everyayah",
      bio: {
        fr: "Version mujawwad de Muhammad Siddiq al-Minshawi (1920-1969), où sa voix dorée atteint des sommets d'expressivité. Ces enregistrements en public sont considérés parmi les plus beaux de l'histoire de la récitation coranique.",
        en: "Mujawwad version of Muhammad Siddiq al-Minshawi (1920-1969), where his golden voice reaches heights of expressiveness. These live recordings are considered among the most beautiful in the history of Quranic recitation.",
        ar: "النسخة المجوّدة لمحمد صديق المنشاوي (1920-1969)، حيث يبلغ صوته الذهبي ذروة التعبير. تُعتبر هذه التسجيلات الحية من أجمل ما في تاريخ التلاوة القرآنية.",
      },
    },
    {
      id: "ar.saoodshuraym",
      name: "سعود الشريم",
      nameEn: "Saud ash-Shuraym",
      nameFr: "Saud ash-Shuraym",
      style: "murattal",
      cdn: "Saood_ash-Shuraym_128kbps",
      cdnType: "everyayah",
      bio: {
        fr: "Saud ash-Shuraym, né le 19 janvier 1966 à Riyad, est l'un des imams les plus emblématiques du Masjid al-Haram à La Mecque, poste qu'il occupe depuis 1991. Docteur en jurisprudence islamique de l'Université Umm al-Qura où il enseigne également, il a mémorisé le Coran dans son jeune âge et étudié sous des érudits de renom dont le Sheikh Ibn Baz. Sa voix grave, puissante et inimitable est l'une des plus reconnues dans le monde islamique, conférant une solennité particulière aux prières de la Maison Sacrée. Pendant des décennies, il a partagé la direction des prières du Ramadan et du Hajj avec son partenaire As-Sudais, formant ainsi l'un des duos de récitateurs les plus célèbres de l'histoire du Haram. Son érudition en fiqh et son autorité morale en font autant un savant qu'un récitateur.",
        en: "Saud ash-Shuraym, born January 19, 1966, in Riyadh, is one of the most iconic imams of Masjid al-Haram in Mecca, a post he has held since 1991. Holding a PhD in Islamic jurisprudence from Umm al-Qura University where he also teaches, he memorized the Quran in his youth and studied under renowned scholars including Sheikh Ibn Baz. His deep, powerful, and inimitable voice is one of the most recognized in the Islamic world, lending particular solemnity to prayers at the Sacred House. For decades he has shared the leadership of Ramadan and Hajj prayers with his partner As-Sudais, forming one of the most celebrated reciter duos in the history of the Haram. His expertise in fiqh and moral authority make him as much a scholar as a reciter.",
        ar: "سعود الشريم، وُلد في 19 يناير 1966 بالرياض، إمام المسجد الحرام بمكة المكرمة منذ عام 1991 وأحد أشهر أئمته على مر العصور. يحمل الدكتوراه في الفقه الإسلامي من جامعة أم القرى ويعمل أستاذاً فيها، وحفظ القرآن في صغره وتتلمذ على يد علماء أجلاء منهم الشيخ ابن باز. صوته العميق القوي الفريد من أكثر الأصوات تميزاً في العالم الإسلامي ويضفي هيبة خاصة على صلوات البيت الحرام. لعقود متواصلة شاطر شريكه السديس إمامة صلوات رمضان والحج مشكّلَين أشهر ثنائي من القراء في تاريخ الحرم المكي. جمعه بين العلم الشرعي في الفقه والسلطة المعنوية يجعل منه عالماً وقارئاً في آن معاً.",
      },
    },
    {
      id: "abdullaah_matrood",
      name: "عبدالله المطرود",
      nameEn: "Abdullah Al-Matrood",
      nameFr: "Abdullah Al-Matrood",
      style: "murattal",
      cdn: "Abdullah_Matroud_128kbps",
      cdnType: "everyayah",
      bio: {
        fr: "Abdullah Al-Matrood est un récitateur saoudien imam à Riyad. Il est apprécié pour son style murattal clair et sa voix agréable qui facilite l'écoute prolongée du Coran.",
        en: "Abdullah Al-Matrood is a Saudi reciter and imam in Riyadh. He is appreciated for his clear murattal style and pleasant voice that facilitates extended Quran listening.",
        ar: "عبدالله المطرود قارئ سعودي وإمام في الرياض. يُقدَّر لأسلوبه الواضح في الترتيل وصوته المريح الذي يسهّل الاستماع المطوّل للقرآن.",
      },
    },
    {
      id: "abdullaah_basfar",
      name: "عبدالله بصفر",
      nameEn: "Abdullah Basfar",
      nameFr: "Abdullah Basfar",
      style: "murattal",
      cdn: "Abdullah_Basfar_192kbps",
      cdnType: "everyayah",
      bio: {
        fr: "Abdullah Basfar est un récitateur saoudien né dans les années 1960, doyen de la faculté du Coran à l'Université Umm al-Qura. Il est connu pour sa récitation posée et académique.",
        en: "Abdullah Basfar is a Saudi reciter born in the 1960s, dean of the Quran faculty at Umm al-Qura University. He is known for his composed and academic recitation style.",
        ar: "عبدالله بصفر قارئ سعودي ولد في الستينات، عميد كلية القرآن بجامعة أم القرى. يُعرف بتلاوته الرصينة والأكاديمية.",
      },
    },
    {
      id: "abdulsamad",
      name: "عبدالصمد",
      nameEn: "Abdul Samad",
      nameFr: "Abdul Samad",
      style: "murattal",
      cdn: "AbdulSamad_64kbps_QuranExplorer.Com",
      cdnType: "everyayah",
      bio: {
        fr: "Abdul Basit Abdul Samad (1927-1988), enregistrement alternatif du maître égyptien de la récitation coranique. Cette version offre une qualité audio différente de ses autres enregistrements célèbres.",
        en: "Abdul Basit Abdul Samad (1927-1988), alternative recording of the Egyptian master of Quranic recitation. This version offers a different audio quality from his other famous recordings.",
        ar: "عبد الباسط عبد الصمد (1927-1988)، تسجيل بديل للمعلم المصري في التلاوة القرآنية. توفر هذه النسخة جودة صوتية مختلفة عن تسجيلاته الشهيرة الأخرى.",
      },
    },
    {
      id: "ar.abdurrahmaansudais",
      name: "عبد الرحمن السديس",
      nameEn: "Abdur-Rahman as-Sudais",
      nameFr: "Abdur-Rahman as-Sudais",
      style: "murattal",
      cdn: "Abdurrahmaan_As-Sudais_192kbps",
      cdnType: "everyayah",
      bio: {
        fr: "Abdur-Rahman as-Sudais, né le 23 novembre 1963 à Al-Bukayriyah dans la région de Qassim, est le président de la Présidence générale des affaires des Deux Saintes Mosquées et l'imam principal du Masjid al-Haram à La Mecque. Il mémorisa le Coran à l'âge de douze ans et obtint un doctorat en jurisprudence islamique de l'Université Umm al-Qura à La Mecque. Nommé imam du Haram en 1984, il dirige depuis lors les prières devant des millions de fidèles, en particulier pendant le Ramadan et le Hajj. Sa voix d'une profondeur et d'une émotion sans égales, ses invocations ferventes du qounout qui arrachent des larmes aux croyants, et son autorité de savant respecté en ont fait l'une des personnalités les plus influentes du monde islamique contemporain. Il a reçu de nombreuses distinctions internationales pour sa contribution à la diffusion des valeurs islamiques.",
        en: "Abdur-Rahman as-Sudais, born November 23, 1963 in Al-Bukayriyah in the Qassim region, is the president of the General Presidency for the Affairs of the Two Holy Mosques and chief imam of Masjid al-Haram in Mecca. He memorized the Quran at age twelve and earned a PhD in Islamic jurisprudence from Umm al-Qura University in Mecca. Appointed imam of the Haram in 1984, he has since led prayers before millions of worshippers, especially during Ramadan and Hajj. His voice of unparalleled depth and emotion, his fervent qounout supplications that move believers to tears, and his authority as a respected scholar have made him one of the most influential personalities in the contemporary Islamic world. He has received numerous international distinctions for his contribution to spreading Islamic values.",
        ar: "عبد الرحمن السديس، وُلد في 23 نوفمبر 1963 في البكيرية بمنطقة القصيم، رئيس الرئاسة العامة لشؤون المسجد الحرام والمسجد النبوي والإمام الرئيسي للمسجد الحرام بمكة المكرمة. حفظ القرآن في الثانية عشرة من عمره وحصل على الدكتوراه في الفقه الإسلامي من جامعة أم القرى بمكة. عُيّن إماماً للحرم عام 1984 وما زال يؤمّ ملايين المصلين منذ ذلك الحين، لا سيما في رمضان والحج. صوته الذي يتميز بالعمق والتأثير العميق، ودعاؤه الخاشع في القنوت الذي تذرف معه الدموع، وسلطته العلمية جعلته من أبرز الشخصيات الإسلامية المؤثرة في العالم المعاصر. حاز على تكريمات دولية عديدة لإسهامه في نشر القيم الإسلامية.",
      },
    },
    {
      id: "ahmed_ajmy",
      name: "أحمد العجمي",
      nameEn: "Ahmed Al-Ajmy",
      nameFr: "Ahmed Al-Ajmy",
      style: "murattal",
      cdn: "Ahmed_ibn_Ali_al-Ajamy_128kbps_ketaballah.net",
      cdnType: "everyayah",
      bio: {
        fr: "Ahmed Al-Ajmy, né en 1968 à Al-Ahsa en Arabie saoudite, est l'un des récitateurs saoudiens les plus populaires dans le monde arabe. Il mémorisa le Coran dans son enfance et fut formé en tajweed sous la direction de maîtres de la péninsule arabique. Sa voix puissante, expressive et chaleureuse, dotée d'un timbre grave et d'une musicalité naturelle, lui vaut une grande popularité dans les milieux islamiques. Son tajweed précis et son rythme expressif font de ses enregistrements une référence appréciée pour la prière quotidienne et la mémorisation, particulièrement dans les pays du Golfe et en Afrique du Nord.",
        en: "Ahmed Al-Ajmy, born in 1968 in Al-Ahsa, Saudi Arabia, is one of the most popular Saudi reciters in the Arab world. He memorized the Quran in his childhood and was trained in tajweed under masters of the Arabian Peninsula. His powerful, expressive and warm voice, endowed with a deep timbre and natural musicality, earns him great popularity in Islamic circles. His precise tajweed and expressive rhythm make his recordings a cherished reference for daily prayer and memorization, particularly in Gulf countries and North Africa.",
        ar: "أحمد العجمي، وُلد عام 1968 بالأحساء في المملكة العربية السعودية، أحد أشهر القراء السعوديين في العالم العربي. حفظ القرآن في طفولته وتتلمذ في التجويد على يد مشايخ شبه الجزيرة العربية. صوته القوي المعبّر الدافئ ذو الجرس العميق والموسيقية الطبيعية يجعله يحظى بشعبية كبيرة في الأوساط الإسلامية. تجويده الدقيق وإيقاعه التعبيري يجعلان تسجيلاته مرجعاً محبوباً للصلاة اليومية والحفظ، لا سيما في دول الخليج وشمال أفريقيا.",
      },
    },
    {
      id: "maher_almuaiqly",
      name: "ماهر المعيقلي",
      nameEn: "Maher Al-Muaiqly",
      nameFr: "Maher Al-Muaiqly",
      style: "murattal",
      cdn: "MaherAlMuaiqly128kbps",
      cdnType: "everyayah",
      bio: {
        fr: "Maher Al-Muaiqly, né le 7 janvier 1969 à Médine, est imam au Masjid al-Haram à La Mecque depuis le 9 août 2007 et professeur de mathématiques à l'Université Umm al-Qura. Après avoir mémorisé le Coran dans son enfance, il a poursuivi des études supérieures en sciences exactes tout en approfondissant sa maîtrise du tajweed. Sa nomination comme imam du Haram le propulsa rapidement au rang des récitateurs les plus diffusés au monde, accumulant des milliards d'écoutes sur les plateformes numériques. Sa voix d'une clarté cristalline, son rythme fluide et son style murattal d'une accessibilité exceptionnelle séduisent autant les jeunes auditeurs que les anciens. Il représente aujourd'hui l'un des visages les plus reconnus de la récitation coranique contemporaine.",
        en: "Maher Al-Muaiqly, born January 7, 1969, in Medina, has been imam at Masjid al-Haram in Mecca since August 9, 2007, and is a mathematics professor at Umm al-Qura University. After memorizing the Quran in his childhood, he pursued higher studies in exact sciences while deepening his mastery of tajweed. His appointment as imam of the Haram quickly elevated him to the rank of the world's most-streamed reciters, accumulating billions of plays on digital platforms. His crystal-clear voice, fluid rhythm, and exceptionally accessible murattal style attract both young and older listeners alike. He is today one of the most recognized faces of contemporary Quranic recitation.",
        ar: "ماهر المعيقلي، وُلد في 7 يناير 1969 بالمدينة المنورة، إمام المسجد الحرام بمكة المكرمة منذ 9 أغسطس 2007 وأستاذ الرياضيات بجامعة أم القرى. بعد أن حفظ القرآن في طفولته واصل دراسته العليا في العلوم الدقيقة مع تعميق إتقانه لأحكام التجويد. أحدثت تسميته إماماً للحرم طفرة في شهرته ليصبح سريعاً من أكثر القراء استماعاً في العالم بمليارات الاستماعات على المنصات الرقمية. صوته الصافي كالبلور وإيقاعه السلس وأسلوبه في الترتيل الذي يتسم بسهولة استثنائية يستهويان الشباب وكبار السن على حد سواء. هو اليوم من أبرز وجوه التلاوة القرآنية المعاصرة.",
      },
    },
    {
      id: "ali_jabir",
      name: "علي جابر",
      nameEn: "Ali Jabir",
      nameFr: "Ali Jabir",
      style: "murattal",
      cdn: "Ali_Jaber_64kbps",
      cdnType: "everyayah",
      bio: {
        fr: "Ali Jabir (1944 – 2005), né à Médine de parents yéménites, fut l'un des imams les plus aimés du Masjid al-Haram de La Mecque, où il officia dans les années 1980 et 1990. Après avoir mémorisé le Coran dans son enfance au Yémen puis à Médine, il obtint une licence en shariah de l'Université islamique de Médine. Nommé imam du Haram, il se distingua par une voix d'une douceur et d'une profondeur spirituelle uniques, notamment dans les invocations du Ramadan qui touchaient les fidèles au plus profond de leur cœur. Après avoir quitté ses fonctions d'imam du Haram, il continua à enseigner et à diriger des prières dans d'autres mosquées jusqu'à son décès. Sa voix reste l'une des plus reconnaissables parmi les anciens imams du Haram.",
        en: "Ali Jabir (1944–2005), born in Medina to Yemeni parents, was one of the most beloved imams of Masjid al-Haram in Mecca, where he served in the 1980s and 1990s. After memorizing the Quran in his childhood in Yemen and then in Medina, he earned a degree in shariah from the Islamic University of Medina. Appointed imam of the Haram, he was distinguished by a voice of unique gentleness and spiritual depth, especially in Ramadan supplications that touched worshippers to the core of their hearts. After leaving his duties as imam of the Haram, he continued to teach and lead prayers in other mosques until his passing. His voice remains one of the most recognizable among former Haram imams.",
        ar: "علي جابر (1944–2005)، وُلد في المدينة المنورة لأبوين يمنيَّين، كان من أحب أئمة المسجد الحرام بمكة المكرمة وخدم في صفوف أئمته في الثمانينات والتسعينات. بعد أن حفظ القرآن في طفولته باليمن ثم بالمدينة، حصل على الليسانس في الشريعة من الجامعة الإسلامية بالمدينة. عُيّن إماماً للحرم وتميّز بصوت يتسم بلطف ورقة روحانية فريدة، لا سيما في دعاء القنوت رمضان الذي يلمس أعماق قلوب المصلين. بعد تركه مهام الإمامة في الحرم واصل التدريس وإمامة الصلاة في مساجد أخرى حتى وفاته. يبقى صوته من أكثر الأصوات تميزاً بين أئمة الحرم السابقين.",
      },
    },
    {
      id: "hudhaify",
      name: "علي الحذيفي",
      nameEn: "Ali Al-Hudhaify",
      nameFr: "Ali Al-Hudhaify",
      style: "murattal",
      cdn: "Hudhaify_128kbps",
      cdnType: "everyayah",
      bio: {
        fr: "Ali ibn Abdur-Rahman Al-Hudhaify, né en 1947 dans la région de Qassim en Arabie saoudite, est l'un des imams les plus respectés du Masjid an-Nabawi à Médine, où il officie depuis 1402 H (1982). Diplômé de la Faculté de shariah de l'Université islamique de Médine, il a étudié sous des érudits de premier plan. Sa voix profonde, empreinte de recueillement et d'une sérénité spirituelle rare, fait des prières qu'il dirige dans la mosquée du Prophète une expérience inoubliable pour les millions de pèlerins qui s'y rendent chaque année. Sa récitation murattal, d'une rigueur exemplaire dans l'application du tajweed, est également très utilisée dans l'enseignement coranique. Il est titulaire de plusieurs grades d'érudition islamique et auteur de travaux religieux reconnus.",
        en: "Ali ibn Abdur-Rahman Al-Hudhaify, born in 1947 in the Qassim region of Saudi Arabia, is one of the most respected imams of Masjid an-Nabawi in Medina, where he has served since 1402 H (1982). A graduate of the Shariah Faculty at the Islamic University of Medina, he studied under leading scholars. His deep voice, imbued with an uncommon spiritual serenity, makes the prayers he leads at the Prophet's Mosque an unforgettable experience for the millions of pilgrims who visit each year. His murattal recitation, exemplary in its rigorous application of tajweed, is also widely used in Quranic education. He holds several degrees in Islamic scholarship and has authored recognized religious works.",
        ar: "علي بن عبد الرحمن الحذيفي، وُلد عام 1947 في منطقة القصيم بالمملكة العربية السعودية، أحد أكثر أئمة المسجد النبوي بالمدينة المنورة احتراماً، ويخدم في صفوف أئمته منذ عام 1402هـ (1982م). خريج كلية الشريعة بالجامعة الإسلامية بالمدينة، تتلمذ على يد كبار العلماء. صوته العميق المشبع بسكينة روحانية نادرة يجعل الصلاة التي يؤمّها في مسجد النبي صلى الله عليه وسلم تجربة لا تُنسى لملايين الحجاج القادمين كل عام. تلاوته بالترتيل الدقيق في تطبيق التجويد تُستخدم على نطاق واسع في التعليم القرآني. يحمل شهادات عدة في العلوم الإسلامية وله مؤلفات دينية معتمدة.",
      },
    },
    {
      id: "ar.muhammadjibreel",
      name: "محمد جبريل",
      nameEn: "Muhammad Jibreel",
      nameFr: "Muhammad Jibreel",
      style: "murattal",
      cdn: "Muhammad_Jibreel_128kbps",
      cdnType: "everyayah",
      bio: {
        fr: "Muhammad Jibreel, né en 1953 à Alexandrie en Égypte, est l'un des récitateurs contemporains les plus aimés du monde arabe, célèbre en particulier pour ses prières de tarawih pendant le Ramadan à la mosquée Ibn Tulun et dans d'autres grandes mosquées du Caire. Diplômé de l'Université Al-Azhar, il a maîtrisé les sciences du Coran et du tajweed et fut longtemps imam et prédicateur dans plusieurs mosquées d'Égypte. Sa voix d'une expressivité bouleversante et ses invocations du qounout nocturne, chargées d'une ferveur qui fond les cœurs les plus endurcis, attirent chaque Ramadan des milliers de fidèles qui se déplacent spécialement pour l'écouter. Ses enregistrements sont diffusés dans le monde entier et comptent parmi les plus appréciés des auditeurs arabophones.",
        en: "Muhammad Jibreel, born in 1953 in Alexandria, Egypt, is one of the most beloved contemporary reciters in the Arab world, famous in particular for his tarawih prayers during Ramadan at Ibn Tulun Mosque and other major mosques in Cairo. A graduate of Al-Azhar University, he mastered the sciences of the Quran and tajweed and served for many years as imam and preacher in several Egyptian mosques. His voice of overwhelming expressiveness and his nocturnal qounout supplications, charged with a fervor that melts even the hardest hearts, draw thousands of worshippers each Ramadan who travel specifically to hear him. His recordings are broadcast worldwide and rank among the most cherished by Arabic-speaking listeners.",
        ar: "محمد جبريل، وُلد عام 1953 بالإسكندرية في مصر، أحد أحب القراء المعاصرين إلى قلوب العرب، ويشتهر بصلاة التراويح في شهر رمضان بجامع ابن طولون وغيره من كبريات مساجد القاهرة. خريج جامعة الأزهر، أتقن علوم القرآن والتجويد وعمل إماماً وخطيباً في مساجد مصرية عديدة لسنوات طويلة. صوته الآسر ودعاء القنوت الليلي المشبع بخشوع يذيب أقسى القلوب يجذبان آلاف المصلين في كل رمضان يأتون من بعيد خصيصاً لسماعه. تسجيلاته تُذاع في أرجاء العالم وتُعدّ من أعز ما يسمعه محبو التلاوة الناطقون بالعربية.",
      },
    },
    {
      id: "muhammad_ayyoub",
      name: "محمد أيوب",
      nameEn: "Muhammad Ayyoub",
      nameFr: "Muhammad Ayyoub",
      style: "murattal",
      cdn: "Muhammad_Ayyoub_128kbps",
      cdnType: "everyayah",
      bio: {
        fr: "Muhammad Ayyoub (octobre 1952 – 16 avril 2016), né à La Mecque d'une famille d'origine rohingya (Birmanie), fut imam et récitateur au Masjid an-Nabawi à Médine pendant de longues années. Il mémorisa le Coran dans son enfance et étudia à l'Université islamique de Médine où il obtint une licence en études coraniques. Sa voix singulière, empreinte d'une sérénité et d'une tendresse profondes, reflète une spiritualité mûrie par des décennies de dévotion dans la mosquée du Prophète. Son style murattal d'une clarté et d'une précision remarquables en a fait une référence pour les étudiants en tajweed. Décédé à La Mecque, il laisse une discographie précieuse et une forte empreinte dans le cœur des millions de fidèles qui ont prié derrière lui.",
        en: "Muhammad Ayyoub (October 1952 – April 16, 2016), born in Mecca to a family of Rohingya (Burmese) origin, served as imam and reciter at Masjid an-Nabawi in Medina for many years. He memorized the Quran in his childhood and studied at the Islamic University of Medina where he obtained a degree in Quranic studies. His singular voice, imbued with profound serenity and tenderness, reflects a spirituality ripened by decades of devotion in the Prophet's mosque. His murattal style of remarkable clarity and precision has made him a reference for tajweed students. Deceased in Mecca, he leaves a precious discography and a deep impression in the hearts of the millions of worshippers who prayed behind him.",
        ar: "محمد أيوب (أكتوبر 1952 – 16 أبريل 2016)، وُلد بمكة المكرمة لأسرة من أصول روهينغية (بورمية)، خدم إماماً وقارئاً في المسجد النبوي بالمدينة المنورة لسنوات طويلة. حفظ القرآن في صغره ودرس بالجامعة الإسلامية بالمدينة حيث نال شهادة في الدراسات القرآنية. صوته المتميز المشبع بسكينة ورقة عميقتين يعكس روحانية مكتسبة بعقود من التفاني في مسجد النبي صلى الله عليه وسلم. أسلوبه في الترتيل الذي يتسم بوضوح ودقة ملحوظين جعله مرجعاً لطلاب التجويد. توفي بمكة المكرمة تاركاً تراثاً صوتياً ثميناً وأثراً بالغاً في قلوب ملايين المصلين الذين صلّوا خلفه.",
      },
    },
    {
      id: "muhammad_tablawi",
      name: "محمد الطبلاوي",
      nameEn: "Muhammad Al-Tablawi",
      nameFr: "Muhammad Al-Tablawi",
      style: "murattal",
      cdn: "Mohammad_al_Tablaway_128kbps",
      cdnType: "everyayah",
      bio: {
        fr: "Muhammad Al-Tablawi (1934 – 11 octobre 2020), né à Mit Salamah dans le gouvernorat de Kafr el-Cheikh en Égypte, fut l'un des doyens de l'école égyptienne de récitation coranique et président longtemps de l'Union des récitateurs en Égypte. Il mémorisa le Coran dans son enfance et obtint l'ijazah dans les dix lectures canoniques, étudiant notamment sous la direction de grands maîtres azhariens. Récitateur officiel de la radio et de la télévision égyptiennes, il se distingua par une voix d'une puissance et d'une plénitude sonore hors normes, maîtrisant les maqamat arabes avec une virtuosité comparable aux plus grands. Ses concerts de récitation mujawwad dans les grandes mosquées d'Égypte et à l'étranger attiraient des foules considérables. À sa mort, il était le dernier grand représentant de la génération d'or de la récitation mujawwad égyptienne.",
        en: "Muhammad Al-Tablawi (1934 – October 11, 2020), born in Mit Salamah in Kafr el-Sheikh Governorate, Egypt, was one of the deans of the Egyptian school of Quranic recitation and long-time president of the Egyptian Reciters' Union. He memorized the Quran in his childhood and obtained ijazah in the ten canonical readings, studying under great Azhari masters. Official reciter for Egyptian radio and television, he distinguished himself with a voice of exceptional power and tonal fullness, mastering Arabic maqamat with virtuosity comparable to the greatest. His mujawwad recitation concerts in major mosques across Egypt and abroad drew considerable crowds. At his death, he was the last great representative of the golden generation of Egyptian mujawwad recitation.",
        ar: "محمد الطبلاوي (1934 – 11 أكتوبر 2020)، وُلد في ميت سلامة بمحافظة كفر الشيخ في مصر، كان من عمداء المدرسة المصرية في التلاوة القرآنية ورئيساً طويل الأمد لاتحاد القراء في مصر. حفظ القرآن في صغره وحصل على الإجازة في القراءات العشر متتلمذاً على يد كبار مشايخ الأزهر. كان قارئ الإذاعة والتلفزيون المصريين الرسمي وتميّز بصوت استثنائي القوة والجهارة مع إتقان للمقامات العربية يضاهي أفذاذ القراء. حفلاته في التلاوة المجوّدة في كبريات المساجد بمصر وخارجها استقطبت حشوداً كبيرة. عند وفاته كان آخر الممثلين الكبار للجيل الذهبي في التلاوة المجوّدة المصرية.",
      },
    },
    {
      id: "hani_rifai",
      name: "هاني الرفاعي",
      nameEn: "Hani Ar-Rifai",
      nameFr: "Hani Ar-Rifai",
      style: "murattal",
      cdn: "Hani_Rifai_192kbps",
      cdnType: "everyayah",
      bio: {
        fr: "Hani Ar-Rifai, né en 1974 en Arabie saoudite, est un récitateur et imam saoudien dont la voix douce et mélodieuse a conquis des millions d'auditeurs dans le monde entier. Diplômé en études coraniques, il a mémorisé le Coran dans son enfance et maîtrisé les règles du tajweed sous la direction de maîtres reconnus. Son style murattal, caractérisé par un rythme régulier, une diction impeccable et une sérénité communicative, en fait un choix particulièrement apprécié pour la lecture quotidienne, la mémorisation et la méditation. Ses enregistrements sont disponibles sur de nombreuses plateformes islamiques et constituent une référence pour les étudiants en tajweed dans les pays arabes et au-delà.",
        en: "Hani Ar-Rifai, born in 1974 in Saudi Arabia, is a Saudi reciter and imam whose soft and melodious voice has won millions of listeners worldwide. A graduate in Quranic studies, he memorized the Quran in his childhood and mastered the rules of tajweed under recognized masters. His murattal style, characterized by a steady rhythm, impeccable diction, and communicative serenity, makes him a particularly appreciated choice for daily reading, memorization, and meditation. His recordings are available on many Islamic platforms and serve as a reference for tajweed students across Arab countries and beyond.",
        ar: "هاني الرفاعي، وُلد عام 1974 في المملكة العربية السعودية، قارئ وإمام سعودي فتن بصوته الرقيق العذب ملايين المستمعين في أرجاء العالم. خريج الدراسات القرآنية، حفظ القرآن في طفولته وأتقن أحكام التجويد تحت إشراف مشايخ معروفين. أسلوبه في الترتيل الذي يتسم بإيقاع منتظم ونطق دقيق وهدوء يسري في النفوس يجعله خياراً محبوباً بشكل خاص للقراءة اليومية والحفظ والتدبر. تسجيلاته متاحة على منصات إسلامية عديدة وتُعد مرجعاً لطلاب التجويد في البلاد العربية وما وراءها.",
      },
    },
    {
      id: "fares_abbad",
      name: "فارس عباد",
      nameEn: "Fares Abbad",
      nameFr: "Fares Abbad",
      style: "murattal",
      cdn: "Fares_Abbad_64kbps",
      cdnType: "everyayah",
      bio: {
        fr: "Fares Abbad est un récitateur saoudien connu pour sa voix chaleureuse et son style murattal émouvant. Ses enregistrements sont très appréciés pour leur qualité spirituelle et leur accessibilité.",
        en: "Fares Abbad is a Saudi reciter known for his warm voice and moving murattal style. His recordings are highly valued for their spiritual quality and accessibility.",
        ar: "فارس عباد قارئ سعودي يُعرف بصوته الدافئ وأسلوبه المؤثر في الترتيل. تُقدَّر تسجيلاته لجودتها الروحانية وسهولة الاستماع إليها.",
      },
    },
    {
      id: "yasser_dossari_hafs",
      name: "ياسر الدوسري",
      nameEn: "Yasser Ad-Dossari",
      nameFr: "Yasser Ad-Dossari",
      style: "murattal",
      cdn: "Yasser_Ad-Dussary_128kbps",
      cdnType: "everyayah",
      bio: {
        fr: "Yasser Ad-Dossari, né en 1981 en Arabie saoudite, est l'un des récitateurs les plus populaires de sa génération et imam au Masjid al-Haram de La Mecque depuis 2012. Il mémorisa le Coran dès l'enfance et se forma auprès de maîtres réputés avant d'intégrer la prestigieuse académie des imams du Haram. Sa voix puissante et profondément expressive, capable de passer d'une douceur méditative à une intensité dramatique saisissante, lui a valu une popularité foudroyante sur YouTube et les réseaux sociaux islamiques, avec des dizaines de millions d'écoutes. En particulier, ses récitations des sourates Al-Mulk et Al-Insan sont considérées par des millions d'auditeurs comme parmi les plus belles jamais enregistrées. Il représente une nouvelle génération de récitateurs qui allient rigueur classique et portée émotionnelle universelle.",
        en: "Yasser Ad-Dossari, born in 1981 in Saudi Arabia, is one of the most popular reciters of his generation and imam at Masjid al-Haram in Mecca since 2012. He memorized the Quran in childhood and trained under renowned masters before joining the prestigious academy of Haram imams. His powerful and deeply expressive voice, capable of moving from meditative softness to striking dramatic intensity, earned him instant popularity on YouTube and Islamic social networks, with tens of millions of plays. In particular, his recitations of Surah Al-Mulk and Surah Al-Insan are considered by millions of listeners to be among the most beautiful ever recorded. He represents a new generation of reciters who combine classical rigor with universal emotional reach.",
        ar: "ياسر الدوسري، وُلد عام 1981 في المملكة العربية السعودية، من أشهر قراء جيله وإمام المسجد الحرام بمكة المكرمة منذ عام 2012. حفظ القرآن في طفولته وتتلمذ على أئمة موثوقين قبل أن ينضم إلى صفوف أئمة الحرم المرموقة. صوته القوي والمعبّر في أعمق مستوياته والقادر على الانتقال من رقة تأملية إلى حدة درامية آسرة أكسبه شعبية جارفة على يوتيوب والمنصات الإسلامية بعشرات الملايين من الاستماعات. بوجه خاص، تلاوته لسورتي الملك والإنسان يعدّها ملايين المستمعين من أجمل ما سُجّل على الإطلاق. يمثّل جيلاً جديداً من القراء يجمعون بين الصرامة الكلاسيكية والتأثير العاطفي العالمي.",
      },
    },
    {
      id: "nasser_alqatami",
      name: "ناصر القطامي",
      nameEn: "Nasser Al-Qatami",
      nameFr: "Nasser Al-Qatami",
      style: "murattal",
      cdn: "Nasser_Alqatami_128kbps",
      cdnType: "everyayah",
      bio: {
        fr: "Nasser Al-Qatami, né en 1980 en Arabie saoudite, est l'un des récitateurs saoudiens les plus populaires de sa génération, reconnu pour sa voix d'une beauté et d'une douceur envoûtantes. Il mémorisa le Coran dans son enfance et fut formé en tajweed par des maîtres saoudiens avant de commencer à enregistrer et à diriger des prières. Son style murattal se distingue par un équilibre remarquable entre fluidité et précision, une expressivité naturelle et un sens aigu de la musicalité coranique. Ses récitations des sourates de la deuxième moitié du Coran sont particulièrement populaires et comptabilisent des centaines de millions d'écoutes sur les plateformes numériques. Il est considéré comme une voix incontournable de la récitation coranique saoudienne contemporaine.",
        en: "Nasser Al-Qatami, born in 1980 in Saudi Arabia, is one of the most popular Saudi reciters of his generation, recognized for his enchantingly beautiful and soft voice. He memorized the Quran in his childhood and was trained in tajweed by Saudi masters before beginning to record and lead prayers. His murattal style is marked by a remarkable balance of fluency and precision, natural expressiveness, and a keen sense of Quranic musicality. His recitations of surahs from the second half of the Quran are particularly popular, accumulating hundreds of millions of plays on digital platforms. He is considered an essential voice of contemporary Saudi Quranic recitation.",
        ar: "ناصر القطامي، وُلد عام 1980 في المملكة العربية السعودية، أحد أكثر القراء السعوديين شعبية في جيله ويُعرف بصوته الآسر الجميل الناعم. حفظ القرآن في طفولته وتتلمذ في التجويد على يد مشايخ سعوديين قبل أن يبدأ بالتسجيل وإمامة الصلاة. يتميز أسلوبه في الترتيل بتوازن رائع بين السلاسة والدقة وتعبيرية طبيعية وحس موسيقي قرآني مرهف. تلاواته لسور النصف الثاني من القرآن شائعة بشكل خاص وتُحصي مئات الملايين من الاستماعات على المنصات الرقمية. يُعدّ صوتاً لا غنى عنه في التلاوة القرآنية السعودية المعاصرة.",
      },
    },
    {
      id: "sahl_yassin",
      name: "سهل ياسين",
      nameEn: "Sahl Yassin",
      nameFr: "Sahl Yassin",
      style: "murattal",
      cdn: "Sahl_Yassin_128kbps",
      cdnType: "everyayah",
      bio: {
        fr: "Sahl Yassin est un récitateur égyptien au style murattal classique. Il est reconnu pour sa voix chaleureuse et sa récitation fidèle à la tradition de l'école égyptienne de tajweed.",
        en: "Sahl Yassin is an Egyptian reciter with a classic murattal style. He is recognized for his warm voice and recitation faithful to the Egyptian tajweed school tradition.",
        ar: "سهل ياسين قارئ مصري بأسلوب ترتيل كلاسيكي. يُعرف بصوته الدافئ وتلاوته الأمينة لتقاليد المدرسة المصرية في التجويد.",
      },
    },
    ...SUPPLEMENTAL_HAFS_RECITERS,
  ],
  warsh: [
    {
      id: "warsh_abdulbasit",
      name: "عبد الباسط (ورش)",
      nameEn: "Abdul Basit (Warsh)",
      nameFr: "Abdul Basit (Warsh)",
      style: "murattal",
      cdn: "warsh/warsh_Abdul_Basit_128kbps",
      cdnType: "everyayah",
      audioMode: "ayah",
      verifiedWarsh: true,
      bio: {
        fr: "Enregistrement en riwaya Warsh du légendaire Abdul Basit Abdul Samad (1927-1988). Cette version démontre sa maîtrise exceptionnelle des différentes voies de lecture du Coran.",
        en: "Warsh narration recording by the legendary Abdul Basit Abdul Samad (1927-1988). This version demonstrates his exceptional mastery of the different Quran reading traditions.",
        ar: "تسجيل برواية ورش عن نافع للقارئ الأسطوري عبد الباسط عبد الصمد (1927-1988). تُظهر هذه النسخة إتقانه الاستثنائي لمختلف طرق قراءة القرآن.",
      },
    },
    {
      id: "warsh_ibrahim_aldosari",
      name: "إبراهيم الدوسري (ورش)",
      nameEn: "Ibrahim Al-Dosari (Warsh)",
      nameFr: "Ibrahim Al-Dosari (Warsh)",
      style: "murattal",
      cdn: "warsh/warsh_ibrahim_aldosary_128kbps",
      cdnType: "everyayah",
      audioMode: "ayah",
      verifiedWarsh: true,
      bio: {
        fr: "Ibrahim Al-Dosari est un récitateur spécialisé dans la riwaya Warsh. Sa récitation claire et méthodique en fait une excellente ressource pour l'apprentissage de cette voie de lecture.",
        en: "Ibrahim Al-Dosari is a reciter specializing in the Warsh narration. His clear and methodical recitation makes him an excellent resource for learning this reading tradition.",
        ar: "إبراهيم الدوسري قارئ متخصص في رواية ورش عن نافع. تلاوته الواضحة والمنهجية تجعله مرجعاً ممتازاً لتعلم هذه الرواية.",
      },
    },
    {
      id: "warsh_yassin",
      name: "ياسين الجزائري (ورش)",
      nameEn: "Yassin Al-Jazaery (Warsh)",
      nameFr: "Yassin Al-Jazaery (Warsh)",
      style: "murattal",
      cdn: "warsh/warsh_yassin_al_jazaery_64kbps",
      cdnType: "everyayah",
      audioMode: "ayah",
      verifiedWarsh: true,
      bio: {
        fr: "Yassin Al-Jazaery est un récitateur algérien spécialisé dans la riwaya Warsh, tradition dominante au Maghreb. Sa récitation reflète l'authenticité de la tradition nord-africaine de lecture coranique.",
        en: "Yassin Al-Jazaery is an Algerian reciter specializing in the Warsh narration, the dominant tradition in North Africa. His recitation reflects the authenticity of the North African Quranic reading tradition.",
        ar: "ياسين الجزائري قارئ جزائري متخصص في رواية ورش عن نافع، الرواية السائدة في المغرب العربي. تعكس تلاوته أصالة التقاليد المغاربية في القراءة القرآنية.",
      },
    },
    {
      id: "warsh_hussary",
      name: "محمود خليل الحصري (ورش)",
      nameEn: "Mahmoud Khalil Al-Husary (Warsh)",
      nameFr: "Mahmoud Khalil Al-Husary (Warsh)",
      style: "murattal",
      cdn: "https://server13.mp3quran.net/husr/Rewayat-Warsh-A-n-Nafi/",
      cdnType: "mp3quran-surah",
      audioMode: "surah",
      verifiedWarsh: true,
      bio: {
        fr: "Enregistrement en riwaya Warsh de Mahmoud Khalil Al-Husary (1917-1980), pionnier de l'enregistrement coranique. Sa précision légendaire dans le tajweed s'applique ici à la voie de lecture Warsh.",
        en: "Warsh narration recording by Mahmoud Khalil Al-Husary (1917-1980), pioneer of Quran recording. His legendary precision in tajweed is applied here to the Warsh reading tradition.",
        ar: "تسجيل برواية ورش عن نافع لمحمود خليل الحصري (1917-1980)، رائد التسجيل القرآني. دقته الأسطورية في التجويد تُطبَّق هنا على رواية ورش.",
      },
    },
    {
      id: "warsh_omar_al_qazabri",
      name: "عمر القزابري (ورش)",
      nameEn: "Omar Al-Qazabri (Warsh)",
      nameFr: "Omar Al-Qazabri (Warsh)",
      style: "murattal",
      cdn: "https://server9.mp3quran.net/omar_warsh/",
      cdnType: "mp3quran-surah",
      audioMode: "surah",
      verifiedWarsh: true,
      bio: {
        fr: "Omar Al-Qazabri est un récitateur marocain renommé, spécialiste de la riwaya Warsh. Il est imam à Casablanca et représente la tradition vivante de récitation Warsh au Maroc avec un style mélodieux distinctif.",
        en: "Omar Al-Qazabri is a renowned Moroccan reciter specializing in the Warsh narration. He is an imam in Casablanca and represents the living Warsh recitation tradition in Morocco with a distinctive melodious style.",
        ar: "عمر القزابري قارئ مغربي مشهور ومتخصص في رواية ورش. إمام في الدار البيضاء ويمثل التقليد الحي لرواية ورش في المغرب بأسلوب لحني مميز.",
      },
    },
    {
      id: "warsh_mohammad_saayed",
      name: "محمد السايد (ورش)",
      nameEn: "Mohammad Saayed (Warsh)",
      nameFr: "Mohammad Saayed (Warsh)",
      style: "murattal",
      cdn: "https://server16.mp3quran.net/m_sayed/Rewayat-Warsh-A-n-Nafi/",
      cdnType: "mp3quran-surah",
      audioMode: "surah",
      verifiedWarsh: true,
      bio: {
        fr: "Mohammad Saayed est un récitateur spécialisé dans la riwaya Warsh. Son style murattal clair et appliqué offre une récitation accessible pour l'apprentissage de cette voie de lecture.",
        en: "Mohammad Saayed is a reciter specializing in the Warsh narration. His clear and applied murattal style offers an accessible recitation for learning this reading tradition.",
        ar: "محمد السايد قارئ متخصص في رواية ورش عن نافع. أسلوبه الواضح والمتقن في الترتيل يوفر تلاوة سهلة الوصول لتعلم هذه الرواية.",
      },
    },
    {
      id: "warsh_al_qaria_yassen",
      name: "القارئ ياسين (ورش)",
      nameEn: "Al-Qaria Yassen (Warsh)",
      nameFr: "Al-Qaria Yassen (Warsh)",
      style: "murattal",
      cdn: "https://server11.mp3quran.net/qari/",
      cdnType: "mp3quran-surah",
      audioMode: "surah",
      verifiedWarsh: true,
      bio: {
        fr: "Al-Qaria Yassen est un récitateur spécialisé dans la riwaya Warsh. Sa récitation se caractérise par un rythme régulier et une application soignée des règles spécifiques à cette voie de lecture.",
        en: "Al-Qaria Yassen is a reciter specializing in the Warsh narration. His recitation is characterized by a steady rhythm and careful application of the rules specific to this reading tradition.",
        ar: "القارئ ياسين قارئ متخصص في رواية ورش عن نافع. تتميز تلاوته بإيقاع منتظم وتطبيق دقيق للأحكام الخاصة بهذه الرواية.",
      },
    },
    {
      id: "warsh_aloyoon_al_koshi",
      name: "العيون الكوشي (ورش)",
      nameEn: "Aloyoon Al-Koshi (Warsh)",
      nameFr: "Aloyoon Al-Koshi (Warsh)",
      style: "murattal",
      cdn: "https://server11.mp3quran.net/koshi/",
      cdnType: "mp3quran-surah",
      audioMode: "surah",
      verifiedWarsh: true,
      bio: {
        fr: "Aloyoon Al-Koshi est un récitateur spécialisé dans la riwaya Warsh. Il est apprécié pour sa voix posée et sa récitation fidèle aux traditions de cette voie de lecture.",
        en: "Aloyoon Al-Koshi is a reciter specializing in the Warsh narration. He is appreciated for his composed voice and recitation faithful to the traditions of this reading.",
        ar: "العيون الكوشي قارئ متخصص في رواية ورش عن نافع. يُقدَّر لصوته الهادئ وتلاوته الأمينة لتقاليد هذه الرواية.",
      },
    },
    {
      id: "warsh_rachid_belalya",
      name: "رشيد بلعالية (ورش)",
      nameEn: "Rachid Belalya (Warsh)",
      nameFr: "Rachid Belalya (Warsh)",
      style: "murattal",
      cdn: "https://server6.mp3quran.net/bl3/Rewayat-Warsh-A-n-Nafi/",
      cdnType: "mp3quran-surah",
      audioMode: "surah",
      verifiedWarsh: true,
      bio: {
        fr: "Rachid Belalya est un récitateur algérien spécialisé dans la riwaya Warsh. Il représente la tradition algérienne de récitation et se distingue par son style fidèle aux usages maghrébins.",
        en: "Rachid Belalya is an Algerian reciter specializing in the Warsh narration. He represents the Algerian recitation tradition and is distinguished by his style faithful to North African practices.",
        ar: "رشيد بلعالية قارئ جزائري متخصص في رواية ورش عن نافع. يمثل التقليد الجزائري في التلاوة ويتميز بأسلوبه المحافظ على الأعراف المغاربية.",
      },
    },
  ],
};

export const RECITER_SOURCE_INFO = Object.freeze({
  islamic: Object.freeze({
    id: "islamic",
    label: "Islamic Network",
    audioMode: "ayah",
    directDownload: false,
  }),
  everyayah: Object.freeze({
    id: "everyayah",
    label: "EveryAyah",
    audioMode: "ayah",
    directDownload: false,
  }),
  "mp3quran-surah": Object.freeze({
    id: "mp3quran",
    label: "MP3Quran",
    audioMode: "surah",
    directDownload: true,
  }),
});

const TRUSTED_MP3QURAN_HOST = /^server\d+\.mp3quran\.net$/i;
const SAFE_CDN_PATH = /^[a-z0-9._/-]+$/i;

function normalizeReciterProfile(reciter, riwaya) {
  const cdnType = reciter.cdnType || "islamic";
  const sourceInfo = RECITER_SOURCE_INFO[cdnType] || RECITER_SOURCE_INFO.islamic;

  return {
    ...reciter,
    cdnType,
    audioMode: reciter.audioMode || sourceInfo.audioMode,
    source: reciter.source || sourceInfo.id,
    country: reciter.country || null,
    riwaya,
    verifiedWarsh: riwaya === "warsh" && reciter.verifiedWarsh === true,
  };
}

const AVAILABLE_RECITERS = {
  hafs: RECITERS.hafs.map((reciter) => normalizeReciterProfile(reciter, "hafs")),
  warsh: RECITERS.warsh.map((reciter) => normalizeReciterProfile(reciter, "warsh")),
};

const ALL_AVAILABLE_RECITERS = [
  ...AVAILABLE_RECITERS.hafs,
  ...AVAILABLE_RECITERS.warsh,
];

const QURAN_RECITER_IMAGE_BASE = "https://static.qurancdn.com/images/reciters/";
const quranPhoto = (path) => `${QURAN_RECITER_IMAGE_BASE}${path}`;

// Keep only URLs that respond successfully. Missing portraits intentionally
// use the deterministic gradient avatar instead of generating browser 404s.
export const RECITER_PHOTOS_MAP = {
  "ar.alafasy": quranPhoto("6/mishary-rashid-alafasy-profile.jpeg"),
  "ar.abdulbasitmurattal": quranPhoto("1/abdelbasset-profile.jpeg"),
  "ar.abdulbasitmujawwad": quranPhoto("1/abdelbasset-profile.jpeg"),
  abdulsamad: quranPhoto("1/abdelbasset-profile.jpeg"),
  "ar.husary": quranPhoto("5/mahmoud-khalil-al-hussary-profile.png"),
  husary_muallim: quranPhoto("5/mahmoud-khalil-al-hussary-profile.png"),
  husary_mujawwad_hafs: quranPhoto("5/mahmoud-khalil-al-hussary-profile.png"),
  "ar.minshawi": quranPhoto("7/mohamed-siddiq-el-minshawi-profile.jpeg"),
  ar_minshawimujawwad: quranPhoto("7/mohamed-siddiq-el-minshawi-profile.jpeg"),
  "ar.saoodshuraym": quranPhoto("8/saoud-shuraim-profile.jpeg"),
  abu_bakr_ash_shaatree: quranPhoto("3/abu-bakr-al-shatri-pofile.jpeg"),
  hani_rifai: quranPhoto("4/hani-ar-rifai-profile.jpeg"),
  "ar.abdurrahmaansudais": quranPhoto("2/abdul-rahman-al-sudais-profile.jpeg"),
  ghamadi_40: quranPhoto("16/saad-al-ghamdi-profile.png"),
  "ar.muhammadjibreel": quranPhoto("10/muhammad-jebril-profile.jpeg"),
  khalefa_al_tunaiji: quranPhoto("11/khalifa-al-tunaiji-profile.jpeg"),
  ali_jabir: quranPhoto("23/Abdullah-Ali-Jabir-profile.png"),
  bandar_baleela: quranPhoto("24/Bandar-Baleela-profile.png"),
  maher_almuaiqly: quranPhoto("25/Maher-al-Muaiqly-profile.png"),
  ahmed_ajmy: quranPhoto("22/Ahmed-ibn-Ali-al-Ajmy-profile.png"),
  ahmed_ibn_ali_al_ajamy_64: quranPhoto("22/Ahmed-ibn-Ali-al-Ajmy-profile.png"),
  yasser_dossari_hafs: quranPhoto("20/yasser-profile.png"),
  warsh_abdulbasit: quranPhoto("1/abdelbasset-profile.jpeg"),
  warsh_hussary: quranPhoto("5/mahmoud-khalil-al-hussary-profile.png"),
};

const AVATAR_COLORS = [
  "#0f766e",
  "#2563eb",
  "#7c3aed",
  "#be123c",
  "#b45309",
  "#047857",
  "#4338ca",
  "#0369a1",
];

const COUNTRY_LABELS = Object.freeze({
  KSA: Object.freeze({
    fr: "Arabie saoudite",
    en: "Saudi Arabia",
    ar: "السعودية",
  }),
  Egypt: Object.freeze({
    fr: "Égypte",
    en: "Egypt",
    ar: "مصر",
  }),
});

export function getReciterAvatar(reciter) {
  const id = String(reciter?.id || reciter?.nameEn || "reciter");
  const label = String(
    reciter?.nameEn || reciter?.nameFr || reciter?.name || id,
  );
  const initials = label
    .replace(/[^a-zA-Z0-9\s؀-ۿ]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const hash = [...id].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const color = AVATAR_COLORS[hash % AVATAR_COLORS.length];
  const colorAlt = AVATAR_COLORS[(hash + 3) % AVATAR_COLORS.length];
  return {
    initials: initials || "MP",
    color,
    colorAlt,
    gradient: `linear-gradient(135deg, ${color}, ${colorAlt})`,
  };
}

export function getReciterPhoto(reciterOrId) {
  const id =
    typeof reciterOrId === "string"
      ? reciterOrId
      : String(reciterOrId?.id || "");
  if (!id) return null;
  return RECITER_PHOTOS_MAP[id] || null;
}

export function getReciterVisual(reciter) {
  const photo = getReciterPhoto(reciter);
  return {
    type: photo ? "photo" : "avatar",
    photo,
    avatar: getReciterAvatar(reciter),
    attribution: photo
      ? { provider: "Quran.com", label: "Portrait · Quran.com" }
      : null,
  };
}

export function getReciterCountryLabel(reciterOrCountry, lang = "fr") {
  const country =
    typeof reciterOrCountry === "string"
      ? reciterOrCountry
      : reciterOrCountry?.country;
  if (!country) return "";
  return COUNTRY_LABELS[country]?.[lang] || COUNTRY_LABELS[country]?.fr || country;
}

export function getReciterSourceInfo(reciterOrId, riwaya = null) {
  const reciter =
    typeof reciterOrId === "string"
      ? getReciter(reciterOrId, riwaya) || getReciter(reciterOrId)
      : reciterOrId;
  const cdnType = reciter?.cdnType || "islamic";
  const sourceInfo = RECITER_SOURCE_INFO[cdnType] || null;
  return sourceInfo ? { ...sourceInfo, cdnType } : null;
}

export function validateReciterAudioConfig(reciter) {
  const errors = [];
  const sourceInfo = getReciterSourceInfo(reciter);
  const cdn = String(reciter?.cdn || "").trim();

  if (!sourceInfo) {
    errors.push("cdnType");
    return { valid: false, errors };
  }
  if (reciter.audioMode !== sourceInfo.audioMode) errors.push("audioMode");
  if (reciter.source !== sourceInfo.id) errors.push("source");

  if (sourceInfo.cdnType === "mp3quran-surah") {
    try {
      const url = new URL(cdn);
      if (
        url.protocol !== "https:" ||
        !TRUSTED_MP3QURAN_HOST.test(url.hostname) ||
        !url.pathname.endsWith("/") ||
        url.search ||
        url.hash
      ) {
        errors.push("cdn");
      }
    } catch {
      errors.push("cdn");
    }
  } else if (
    !cdn ||
    !SAFE_CDN_PATH.test(cdn) ||
    cdn.startsWith("/") ||
    cdn.includes("..") ||
    cdn.includes("//")
  ) {
    errors.push("cdn");
  }

  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}

export function validateReciterProfile(reciter) {
  const errors = [];
  const requiredTextFields = ["id", "name", "nameEn", "nameFr", "style", "riwaya"];

  for (const field of requiredTextFields) {
    if (!String(reciter?.[field] || "").trim()) errors.push(field);
  }
  if (!/^[a-z0-9_.-]+$/i.test(String(reciter?.id || ""))) errors.push("id");
  if (!["murattal", "mujawwad", "tartil"].includes(reciter?.style)) errors.push("style");
  if (!["hafs", "warsh"].includes(reciter?.riwaya)) errors.push("riwaya");
  if (reciter?.riwaya === "warsh" && reciter?.verifiedWarsh !== true) {
    errors.push("verifiedWarsh");
  }
  if (reciter?.country !== null && typeof reciter?.country !== "string") {
    errors.push("country");
  }
  if (getReciterBio(reciter, "fr").length < 20) errors.push("bio");
  errors.push(...validateReciterAudioConfig(reciter).errors);

  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}

export function getReciterBio(reciter, lang = "fr") {
  if (!reciter) return "";
  if (typeof reciter.bio === "string") return reciter.bio;
  if (reciter.bio && typeof reciter.bio === "object") {
    return (
      reciter.bio[lang] ||
      reciter.bio.fr ||
      reciter.bio.en ||
      reciter.bio.ar ||
      ""
    );
  }

  const name =
    lang === "ar"
      ? reciter.name
      : lang === "fr"
        ? reciter.nameFr || reciter.nameEn
        : reciter.nameEn || reciter.nameFr;
  const style =
    reciter.style === "mujawwad"
      ? lang === "fr"
        ? "mujawwad"
        : "mujawwad"
      : lang === "ar"
        ? "مرتل"
        : "murattal";
  const sourceLabel =
    reciter.source === "mp3quran"
      ? "MP3Quran"
      : reciter.source === "everyayah"
        ? "EveryAyah"
        : reciter.cdnType || "audio";

  if (lang === "ar") {
    return `${name} قارئ متاح في MushafPlus بنمط ${style}. مصدر الصوت: ${sourceLabel}.`;
  }
  if (lang === "en") {
    return `${name} is available in MushafPlus with a ${style} recitation profile. Audio source: ${sourceLabel}.`;
  }
  return `${name} est disponible dans MushafPlus avec un profil de récitation ${style}. Source audio : ${sourceLabel}.`;
}

export default AVAILABLE_RECITERS;

export function getRecitersByRiwaya(riwaya = "hafs") {
  return AVAILABLE_RECITERS[riwaya] || AVAILABLE_RECITERS.hafs;
}

export function getDefaultReciterId(riwaya = "hafs") {
  const reciterId = getRecitersByRiwaya(riwaya)?.[0]?.id;
  if (reciterId) return reciterId;
  return getRecitersByRiwaya("hafs")?.[0]?.id || "ar.alafasy";
}

export function ensureReciterForRiwaya(reciterId, riwaya = "hafs") {
  const list = getRecitersByRiwaya(riwaya);
  return list.some((r) => r.id === reciterId)
    ? reciterId
    : getDefaultReciterId(riwaya);
}

export function getReciter(id, riwaya = null) {
  if (riwaya && AVAILABLE_RECITERS[riwaya]) {
    return getRecitersByRiwaya(riwaya).find((r) => r.id === id) || null;
  }
  return ALL_AVAILABLE_RECITERS.find((r) => r.id === id) || null;
}

export function reciterName(id, lang = "ar") {
  const r = getReciter(id);
  if (!r) return "";
  if (lang === "en") return r.nameEn;
  if (lang === "fr") return r.nameFr;
  return r.name;
}

export function isWarshVerifiedReciter(reciterOrId, riwaya = "warsh") {
  const reciter =
    typeof reciterOrId === "string"
      ? getReciter(reciterOrId, riwaya) || getReciter(reciterOrId)
      : reciterOrId;
  if (!reciter) return false;
  if (reciter.verifiedWarsh) return true;
  return String(reciter.cdn || "")
    .toLowerCase()
    .includes("warsh");
}

export function isSurahOnlyReciter(reciterOrId, riwaya = null) {
  const reciter =
    typeof reciterOrId === "string"
      ? getReciter(reciterOrId, riwaya) || getReciter(reciterOrId)
      : reciterOrId;
  return reciter?.audioMode === "surah";
}
