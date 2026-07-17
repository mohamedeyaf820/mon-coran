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
      fr: "Abu Bakr Ash-Shaatree est un récitateur saoudien et imam au Masjid al-Haram à La Mecque. Il est célèbre pour sa récitation mélodieuse et son style distinctif qui allie précision et beauté vocale.",
      en: "Abu Bakr Ash-Shaatree is a Saudi reciter and imam at Masjid al-Haram in Mecca. He is famous for his melodious recitation and distinctive style that combines precision with vocal beauty.",
      ar: "أبو بكر الشاطري قارئ سعودي وإمام في المسجد الحرام بمكة المكرمة. يشتهر بتلاوته العذبة وأسلوبه المميز الذي يجمع بين الدقة وجمال الصوت.",
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
      fr: "Saad Al-Ghamdi, né en 1967 en Arabie saoudite, est un imam et récitateur de renommée internationale. Sa voix puissante et émouvante lui a valu une immense popularité dans le monde musulman.",
      en: "Saad Al-Ghamdi, born in 1967 in Saudi Arabia, is an internationally renowned imam and reciter. His powerful and moving voice has earned him immense popularity across the Muslim world.",
      ar: "سعد الغامدي، ولد عام 1967 في المملكة العربية السعودية، إمام وقارئ ذو شهرة عالمية. صوته القوي والمؤثر أكسبه شعبية واسعة في العالم الإسلامي.",
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
      fr: "Salah Al-Budair est un récitateur saoudien et imam au Masjid an-Nabawi (mosquée du Prophète) à Médine. Il est connu pour sa récitation émouvante et son style qui touche profondément les fidèles.",
      en: "Salah Al-Budair is a Saudi reciter and imam at Masjid an-Nabawi (Prophet's Mosque) in Medina. He is known for his moving recitation and style that deeply touches worshippers.",
      ar: "صلاح البدير قارئ سعودي وإمام في المسجد النبوي بالمدينة المنورة. يُعرف بتلاوته المؤثرة وأسلوبه الذي يلمس قلوب المصلين.",
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
      fr: "Mahmoud Ali Al-Banna (1926-1985) est un célèbre récitateur égyptien au style mujawwad. Il fut l'un des récitateurs officiels de la radio égyptienne et était réputé pour la richesse mélodique de ses récitations.",
      en: "Mahmoud Ali Al-Banna (1926-1985) is a famous Egyptian reciter in the mujawwad style. He was one of the official reciters of Egyptian radio and was renowned for the melodic richness of his recitations.",
      ar: "محمود علي البنا (1926-1985) قارئ مصري شهير بأسلوب التلاوة المجوّدة. كان من القراء الرسميين في الإذاعة المصرية واشتهر بثراء ألحانه في التلاوة.",
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
      fr: "Muhsin Al-Qasim est un récitateur saoudien et imam au Masjid an-Nabawi à Médine. Sa récitation se distingue par sa tranquillité et sa précision dans l'application des règles du tajweed.",
      en: "Muhsin Al-Qasim is a Saudi reciter and imam at Masjid an-Nabawi in Medina. His recitation is distinguished by its tranquility and precision in applying tajweed rules.",
      ar: "محسن القاسم قارئ سعودي وإمام في المسجد النبوي بالمدينة المنورة. تتميز تلاوته بالسكينة والدقة في تطبيق أحكام التجويد.",
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
      fr: "Khalefa Al-Tunaiji est un récitateur émirati connu pour sa voix distinctive et son style murattal apaisant. Il est l'un des récitateurs les plus écoutés des Émirats arabes unis.",
      en: "Khalefa Al-Tunaiji is an Emirati reciter known for his distinctive voice and soothing murattal style. He is one of the most listened-to reciters from the United Arab Emirates.",
      ar: "خليفة الطنيجي قارئ إماراتي يُعرف بصوته المميز وأسلوبه المريح في الترتيل. يُعد من أكثر القراء استماعاً في دولة الإمارات العربية المتحدة.",
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
      fr: "Ahmed ibn Ali al-Ajmy, né en 1968 en Arabie saoudite, est un récitateur et imam très populaire. Sa voix puissante et émotive, combinée à un tajweed impeccable, en font l'un des récitateurs les plus écoutés au monde.",
      en: "Ahmed ibn Ali al-Ajmy, born in 1968 in Saudi Arabia, is a highly popular reciter and imam. His powerful and emotive voice, combined with impeccable tajweed, makes him one of the most listened-to reciters worldwide.",
      ar: "أحمد بن علي العجمي، ولد عام 1968 في المملكة العربية السعودية، قارئ وإمام ذو شعبية كبيرة. صوته القوي والمؤثر مع إتقانه التام للتجويد جعلاه من أكثر القراء استماعاً في العالم.",
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
      fr: "Abdullah Awwad Al-Juhaynee est un récitateur saoudien et imam au Masjid al-Haram à La Mecque. Il est reconnu pour sa voix majestueuse et son style de récitation qui inspire la sérénité aux fidèles.",
      en: "Abdullah Awwad Al-Juhaynee is a Saudi reciter and imam at Masjid al-Haram in Mecca. He is recognized for his majestic voice and recitation style that inspires serenity in worshippers.",
      ar: "عبد الله عواد الجهني قارئ سعودي وإمام في المسجد الحرام بمكة المكرمة. يُعرف بصوته المهيب وأسلوبه في التلاوة الذي يبعث السكينة في نفوس المصلين.",
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
      fr: "Idris Abkar, né en 1970 en Arabie Saoudite, est l'un des récitateurs les plus écoutés au monde arabe. Imam à Djeddah, il est connu pour son style émouvant qui touche profondément les cœurs des fidèles, particulièrement lors des prières de nuit du Ramadan.",
      en: "Idris Abkar, born in 1970 in Saudi Arabia, is one of the most listened-to reciters in the Arab world. An imam in Jeddah, he is known for his emotional style that deeply touches the hearts of worshippers, particularly during Ramadan night prayers.",
      ar: "إدريس أبكر، ولد عام 1970 في السعودية، من أكثر القراء استماعاً في العالم العربي. إمام في جدة، يُعرف بأسلوبه المؤثر الذي يلامس قلوب المصلين خاصة في صلوات التراويح.",
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
      fr: "Bandar Baleela est un récitateur saoudien et imam au Masjid al-Haram à La Mecque depuis 2013. Docteur en études coraniques, il est apprécié pour sa voix claire et mélodieuse et sa maîtrise des règles de tajweed.",
      en: "Bandar Baleela is a Saudi reciter and imam at Masjid al-Haram in Mecca since 2013. A doctor of Quranic studies, he is appreciated for his clear melodious voice and mastery of tajweed rules.",
      ar: "بندر بليلة قارئ سعودي وإمام في المسجد الحرام بمكة المكرمة منذ 2013. دكتور في الدراسات القرآنية، يُقدَّر لصوته الصافي العذب وإتقانه لأحكام التجويد.",
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
        fr: "Mishary Rashid Alafasy, né en 1976 au Koweït, est l'un des récitateurs les plus populaires au monde. Diplômé de la faculté du Coran de l'Université islamique de Médine, il est imam à la Grande Mosquée du Koweït. Sa voix mélodieuse et son style murattal distinctif, caractérisé par un rythme fluide et des intonations captivantes, lui ont valu des millions d'auditeurs sur les plateformes numériques. Il a fondé la chaîne télévisée Al-Afasy et produit de nombreux nasheed islamiques.",
        en: "Mishary Rashid Alafasy, born in 1976 in Kuwait, is one of the most popular Quran reciters in the world. He graduated from the Faculty of the Quran at the Islamic University of Madinah and serves as imam at the Grand Mosque of Kuwait. His melodious voice and distinctive murattal style, characterized by fluid rhythm and captivating intonations, have earned him millions of listeners across digital platforms. He founded the Al-Afasy TV channel and has produced numerous Islamic nasheeds.",
        ar: "مشاري راشد العفاسي، ولد عام 1976 في الكويت، وهو أحد أشهر قراء القرآن في العالم. تخرّج من كلية القرآن الكريم بالجامعة الإسلامية بالمدينة المنورة وهو إمام المسجد الكبير في الكويت. صوته العذب وأسلوبه المميز في الترتيل أكسباه ملايين المستمعين عبر المنصات الرقمية. أسّس قناة العفاسي التلفزيونية وأنتج العديد من الأناشيد الإسلامية.",
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
        fr: "Abdul Basit Abdul Samad (1927-1988), originaire du village de Armant dans le sud de l'Égypte, est considéré comme l'un des plus grands récitateurs de l'histoire de l'islam. Il a mémorisé le Coran à l'âge de 10 ans et fut le premier récitateur à enregistrer le Coran complet en murattal et en mujawwad. Il a remporté trois prix mondiaux de récitation et a été nommé récitateur officiel de la mosquée Al-Imam Al-Shafi'i au Caire. Ses enregistrements sont écoutés quotidiennement par des millions de personnes à travers le monde.",
        en: "Abdul Basit Abdul Samad (1927-1988), originally from the village of Armant in southern Egypt, is considered one of the greatest Quran reciters in Islamic history. He memorized the Quran by age 10 and became the first reciter to record the complete Quran in both murattal and mujawwad styles. He won three world prizes in Quranic recitation and was appointed official reciter at Al-Imam Al-Shafi'i Mosque in Cairo. His recordings are listened to daily by millions of people around the world.",
        ar: "عبد الباسط عبد الصمد (1927-1988)، من قرية أرمنت بصعيد مصر، يُعدّ من أعظم قراء القرآن في تاريخ الإسلام. حفظ القرآن في العاشرة من عمره وكان أول من سجّل القرآن كاملاً بالترتيل والتجويد. حاز على ثلاث جوائز عالمية وعُيّن قارئاً رسمياً لمسجد الإمام الشافعي بالقاهرة. تسجيلاته تُستمع يومياً من ملايين الناس حول العالم.",
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
        fr: "Mahmoud Khalil Al-Husary (1917-1980), né à Tanta en Égypte, est un pionnier de l'enregistrement coranique et la référence mondiale du tajweed. Il a mémorisé le Coran à 8 ans et obtenu l'ijazah dans les dix lectures (qira'at). Nommé récitateur principal de la mosquée Al-Azhar puis de la mosquée Al-Hussein au Caire, il fut le premier à enregistrer le Coran pour la radio égyptienne en 1944. Sa récitation est utilisée comme étalon dans les instituts coraniques du monde entier pour sa précision et sa fidélité absolue aux règles de tajweed.",
        en: "Mahmoud Khalil Al-Husary (1917-1980), born in Tanta, Egypt, is a pioneer of Quran recording and the global reference for tajweed. He memorized the Quran by age 8 and obtained ijazah in all ten qira'at (readings). Appointed chief reciter at Al-Azhar Mosque then Al-Hussein Mosque in Cairo, he was the first to record the Quran for Egyptian radio in 1944. His recitation is used as the standard in Quranic institutes worldwide for its precision and absolute fidelity to tajweed rules.",
        ar: "محمود خليل الحصري (1917-1980)، ولد في طنطا بمصر، رائد تسجيل القرآن والمرجع العالمي للتجويد. حفظ القرآن في الثامنة من عمره وحصل على الإجازة في القراءات العشر. عُيّن قارئاً رئيسياً لمسجد الأزهر ثم مسجد الحسين بالقاهرة، وكان أول من سجّل القرآن للإذاعة المصرية عام 1944. تلاوته تُستخدم كمعيار في المعاهد القرآنية حول العالم لدقتها والتزامها المطلق بأحكام التجويد.",
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
        fr: "Muhammad Siddiq al-Minshawi (1920-1969), originaire de la province de Sohag en Haute-Égypte, est surnommé « la voix d'or du Coran ». Issu d'une famille de récitateurs, il a mémorisé le Coran à 11 ans et maîtrisé les dix lectures canoniques. Nommé récitateur officiel des mosquées d'État, il a voyagé dans de nombreux pays pour réciter devant des foules immenses. Malgré sa disparition prématurée à 49 ans, ses enregistrements murattal et mujawwad restent parmi les plus écoutés et les plus émouvants jamais produits.",
        en: "Muhammad Siddiq al-Minshawi (1920-1969), from Sohag province in Upper Egypt, is nicknamed 'the golden voice of the Quran.' Born into a family of reciters, he memorized the Quran by age 11 and mastered all ten canonical readings. Appointed official reciter of state mosques, he traveled to many countries to recite before enormous audiences. Despite his premature death at 49, his murattal and mujawwad recordings remain among the most listened-to and most emotionally powerful ever produced.",
        ar: "محمد صديق المنشاوي (1920-1969)، من محافظة سوهاج بصعيد مصر، لُقّب بـ«الصوت الذهبي للقرآن». نشأ في عائلة من القراء وحفظ القرآن في الحادية عشرة وأتقن القراءات العشر. عُيّن قارئاً رسمياً لمساجد الدولة وسافر إلى بلدان كثيرة ليتلو أمام جماهير غفيرة. رغم رحيله المبكر عن 49 عاماً، تبقى تسجيلاته بالترتيل والتجويد من أكثر التلاوات استماعاً وأشدها تأثيراً.",
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
        fr: "Saud ash-Shuraym, né en 1964 à Riyad, est imam au Masjid al-Haram à La Mecque depuis 1991 et professeur de jurisprudence islamique à l'Université Umm al-Qura. Titulaire d'un doctorat en fiqh, il combine érudition religieuse et talent de récitation. Sa voix grave et imposante, l'une des plus reconnaissables dans le monde islamique, confère une solennité particulière aux prières du Haram, notamment celles du Ramadan qu'il partage avec son partenaire As-Sudais.",
        en: "Saud ash-Shuraym, born in 1964 in Riyadh, has been imam at Masjid al-Haram in Mecca since 1991 and professor of Islamic jurisprudence at Umm al-Qura University. Holding a PhD in fiqh, he combines religious scholarship with recitation talent. His deep and imposing voice, one of the most recognizable in the Islamic world, brings a particular solemnity to Haram prayers, especially Ramadan prayers shared with his partner As-Sudais.",
        ar: "سعود الشريم، ولد عام 1964 في الرياض، إمام في المسجد الحرام بمكة منذ 1991 وأستاذ الفقه الإسلامي بجامعة أم القرى. يحمل الدكتوراه في الفقه ويجمع بين العلم الشرعي وموهبة التلاوة. صوته العميق والمهيب من أكثر الأصوات تميزاً في العالم الإسلامي ويضفي هيبة خاصة على صلوات الحرم خاصة في رمضان مع شريكه السديس.",
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
        fr: "Abdur-Rahman as-Sudais, né en 1960 à Riyad, est le président de la présidence des Deux Saintes Mosquées et imam principal au Masjid al-Haram à La Mecque. Il a mémorisé le Coran à 12 ans et obtenu un doctorat en charia islamique de l'Université Umm al-Qura. Nommé imam du Haram en 1984, il dirige les prières devant des millions de fidèles chaque année, notamment pendant le Ramadan et le Hajj. Sa voix émouvante et ses invocations passionnées qui font pleurer les fidèles en ont fait l'un des récitateurs les plus reconnus au monde.",
        en: "Abdur-Rahman as-Sudais, born in 1960 in Riyadh, is the president of the Presidency of the Two Holy Mosques and chief imam at Masjid al-Haram in Mecca. He memorized the Quran by age 12 and earned a PhD in Islamic Sharia from Umm al-Qura University. Appointed imam of the Haram in 1984, he leads prayers before millions of worshippers annually, especially during Ramadan and Hajj. His moving voice and passionate supplications that bring worshippers to tears have made him one of the most recognized reciters worldwide.",
        ar: "عبد الرحمن السديس، ولد عام 1960 في الرياض، رئيس الرئاسة العامة لشؤون المسجد الحرام والمسجد النبوي والإمام الرئيسي للمسجد الحرام بمكة. حفظ القرآن في الثانية عشرة وحصل على الدكتوراه في الشريعة من جامعة أم القرى. عُيّن إماماً للحرم عام 1984 ويؤمّ ملايين المصلين سنوياً خاصة في رمضان والحج. صوته المؤثر ودعاؤه الخاشع الذي يُبكي المصلين جعلاه من أشهر القراء في العالم.",
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
        fr: "Ahmed Al-Ajmy, né en 1968 en Arabie saoudite, est un récitateur et imam très apprécié. Sa voix puissante et émotive, combinée à un tajweed impeccable, en font l'un des récitateurs les plus écoutés au monde.",
        en: "Ahmed Al-Ajmy, born in 1968 in Saudi Arabia, is a highly appreciated reciter and imam. His powerful and emotive voice, combined with impeccable tajweed, makes him one of the most listened-to reciters worldwide.",
        ar: "أحمد العجمي، ولد عام 1968 في المملكة العربية السعودية، قارئ وإمام محبوب. صوته القوي والعاطفي مع إتقانه للتجويد جعلاه من أكثر القراء استماعاً في العالم.",
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
        fr: "Maher Al-Muaiqly, né en 1969 à Médine, est imam au Masjid al-Haram à La Mecque et professeur de mathématiques à l'Université Umm al-Qura. Il a été nommé imam du Haram en 2007 et est rapidement devenu l'un des récitateurs les plus écoutés sur YouTube avec des milliards de vues. Sa voix claire et puissante, son rythme parfaitement maîtrisé et son style murattal fluide et accessible séduisent un large public, des plus jeunes aux plus âgés.",
        en: "Maher Al-Muaiqly, born in 1969 in Medina, is an imam at Masjid al-Haram in Mecca and a mathematics professor at Umm al-Qura University. Appointed imam of the Haram in 2007, he quickly became one of the most listened-to reciters on YouTube with billions of views. His clear and powerful voice, perfectly controlled rhythm, and fluid, accessible murattal style appeal to a broad audience from the youngest to the eldest.",
        ar: "ماهر المعيقلي، ولد عام 1969 في المدينة المنورة، إمام في المسجد الحرام بمكة وأستاذ رياضيات بجامعة أم القرى. عُيّن إماماً للحرم عام 2007 وأصبح سريعاً من أكثر القراء استماعاً على يوتيوب بمليارات المشاهدات. صوته الواضح والقوي وإيقاعه المتقن وأسلوبه السلس في الترتيل يجذبان جمهوراً واسعاً من مختلف الأعمار.",
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
        fr: "Ali Jabir (1938-2005) était un récitateur saoudien et ancien imam au Masjid al-Haram. Sa voix unique et son style profondément spirituel ont marqué des générations de fidèles à travers le monde.",
        en: "Ali Jabir (1938-2005) was a Saudi reciter and former imam at Masjid al-Haram. His unique voice and deeply spiritual style left a lasting impression on generations of worshippers worldwide.",
        ar: "علي جابر (1938-2005) كان قارئاً سعودياً وإماماً سابقاً في المسجد الحرام. صوته الفريد وأسلوبه الروحاني العميق تركا أثراً بالغاً في أجيال من المصلين حول العالم.",
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
        fr: "Ali Al-Hudhaify, né en 1947 en Arabie saoudite, est imam au Masjid an-Nabawi à Médine. Il est reconnu pour sa récitation précise et sa voix posée qui reflète des décennies de dévotion.",
        en: "Ali Al-Hudhaify, born in 1947 in Saudi Arabia, is an imam at Masjid an-Nabawi in Medina. He is recognized for his precise recitation and composed voice reflecting decades of devotion.",
        ar: "علي الحذيفي، ولد عام 1947 في المملكة العربية السعودية، إمام في المسجد النبوي بالمدينة. يُعرف بدقة تلاوته وصوته الهادئ الذي يعكس عقوداً من التفاني.",
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
        fr: "Muhammad Jibreel, né en 1953 en Égypte, est un récitateur célèbre pour ses prières nocturnes émouvantes au Caire. Sa récitation chargée d'émotion et ses invocations passionnées attirent des foules immenses.",
        en: "Muhammad Jibreel, born in 1953 in Egypt, is a reciter famous for his moving night prayers in Cairo. His emotionally charged recitation and passionate supplications attract enormous crowds.",
        ar: "محمد جبريل، ولد عام 1953 في مصر، قارئ مشهور بصلاة التراويح المؤثرة في القاهرة. تلاوته العاطفية ودعاؤه الخاشع يجذبان حشوداً كبيرة.",
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
        fr: "Muhammad Ayyoub (1952-2016) était un récitateur et imam au Masjid an-Nabawi à Médine. Né à La Mecque, il était reconnu pour son style murattal serein et sa maîtrise parfaite du tajweed.",
        en: "Muhammad Ayyoub (1952-2016) was a reciter and imam at Masjid an-Nabawi in Medina. Born in Mecca, he was recognized for his serene murattal style and perfect mastery of tajweed.",
        ar: "محمد أيوب (1952-2016) كان قارئاً وإماماً في المسجد النبوي بالمدينة. ولد في مكة المكرمة، وعُرف بأسلوبه الهادئ في الترتيل وإتقانه التام لأحكام التجويد.",
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
        fr: "Muhammad Al-Tablawi (1934-2020) était un récitateur égyptien et ancien président du syndicat des récitateurs en Égypte. Il était célèbre pour sa voix puissante et ses performances mujawwad captivantes.",
        en: "Muhammad Al-Tablawi (1934-2020) was an Egyptian reciter and former head of the reciters' syndicate in Egypt. He was famous for his powerful voice and captivating mujawwad performances.",
        ar: "محمد الطبلاوي (1934-2020) كان قارئاً مصرياً ورئيساً سابقاً لنقابة القراء في مصر. اشتهر بصوته القوي وأدائه الآسر في التلاوة المجوّدة.",
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
        fr: "Hani Ar-Rifai, né en 1974 en Arabie saoudite, est un récitateur reconnu pour sa voix douce et mélodieuse. Son style murattal apaisant en fait un choix populaire pour l'écoute méditative du Coran.",
        en: "Hani Ar-Rifai, born in 1974 in Saudi Arabia, is a reciter known for his soft and melodious voice. His soothing murattal style makes him a popular choice for meditative Quran listening.",
        ar: "هاني الرفاعي، ولد عام 1974 في المملكة العربية السعودية، قارئ يُعرف بصوته الرقيق والعذب. أسلوبه المريح في الترتيل يجعله خياراً محبوباً للاستماع التأملي للقرآن.",
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
        fr: "Yasser Ad-Dossari, né en 1981 en Arabie saoudite, est un jeune récitateur au talent exceptionnel. Sa voix puissante et expressive et son style dynamique lui ont valu une popularité croissante sur les plateformes numériques.",
        en: "Yasser Ad-Dossari, born in 1981 in Saudi Arabia, is a young reciter of exceptional talent. His powerful and expressive voice and dynamic style have earned him growing popularity on digital platforms.",
        ar: "ياسر الدوسري، ولد عام 1981 في المملكة العربية السعودية، قارئ شاب ذو موهبة استثنائية. صوته القوي والمعبّر وأسلوبه الحيوي أكسباه شعبية متزايدة على المنصات الرقمية.",
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
        fr: "Nasser Al-Qatami, né en 1980 en Arabie saoudite, est un récitateur au style murattal distinctif et émouvant. Sa voix caractéristique et sa récitation passionnée lui ont acquis un large public.",
        en: "Nasser Al-Qatami, born in 1980 in Saudi Arabia, is a reciter with a distinctive and moving murattal style. His characteristic voice and passionate recitation have won him a wide audience.",
        ar: "ناصر القطامي، ولد عام 1980 في المملكة العربية السعودية، قارئ بأسلوب ترتيل مميز ومؤثر. صوته المعروف وتلاوته العاطفية أكسباه جمهوراً واسعاً.",
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
  "ar.abdulbasitmurattal": quranPhoto("1/abdelbasset-profile.jpeg"),
  "ar.abdulbasitmujawwad": quranPhoto("1/abdelbasset-profile.jpeg"),
  "ar.husary": quranPhoto("5/mahmoud-khalil-al-hussary-profile.png"),
  husary_muallim: quranPhoto("5/mahmoud-khalil-al-hussary-profile.png"),
  husary_mujawwad_hafs: quranPhoto("5/mahmoud-khalil-al-hussary-profile.png"),
  abu_bakr_ash_shaatree: quranPhoto("3/abu-bakr-al-shatri-pofile.jpeg?v=1"),
  ahmed_ajmy: quranPhoto("22/Ahmed-ibn-Ali-al-Ajmy-profile.png"),
  ahmed_ibn_ali_al_ajamy_64: quranPhoto("22/Ahmed-ibn-Ali-al-Ajmy-profile.png"),
  yasser_dossari_hafs: quranPhoto("20/yasser-profile.png"),
  ali_jabir: quranPhoto("23/Abdullah-Ali-Jabir-profile.png?v=1"),
  "ar.abdurrahmaansudais": quranPhoto("2/abdul-rahman-al-sudais-profile.jpeg"),
  ghamadi_40: quranPhoto("16/saad-al-ghamdi-profile.png?v=1"),
  "ar.muhammadjibreel": quranPhoto("10/muhammad-jebril-profile.jpeg"),
  hani_rifai: quranPhoto("4/hani-ar-rifai-profile.jpeg?v=1"),
  khalefa_al_tunaiji: quranPhoto("11/khalifa-al-tunaiji-profile.jpeg?v=1"),
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
