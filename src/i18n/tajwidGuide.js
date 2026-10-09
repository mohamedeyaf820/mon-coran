// The guide explains what each colour means and where the colours come from.
// Colours are Quran.com's palette for both riwayas (see data/tajwidPalette.js);
// `warshArchive` / `warsh` say where the Warsh rules are read from, depending on
// whether the Warsh annotations are loaded.
export const TAJWID_GUIDE_COPY = {
  fr: {
    title: "Guide Tajwid", close: "Fermer",
    helper: "Chaque couleur regroupe des règles de tajwid voisines. La liste ci-dessous explique ce que chacune signale.",
    warshArchive: "Warsh utilise les mêmes couleurs que Hafs pour les mêmes règles. Les règles sont repérées dans les annotations Warsh de l’application et sur les signes imprimés dans cette édition.",
    warsh: "Warsh utilise les mêmes couleurs que Hafs pour les mêmes règles. Les règles sont repérées sur les signes imprimés dans cette édition.",
    sourcePrefix: "Couleurs : palette de tajwid de", sourceName: "Quran.com", sourceSuffix: ".",
    groups: [
      ["Lettres non prononcées et assimilation", "Le gris marque ce qui ne se prononce pas ou se fond dans la lettre suivante : hamzat al-waṣl, lām solaire (lām shamsiyya) et idghām sans ghunna ou entre lettres identiques ou proches."],
      ["Madd naturel (2 temps)", "Prolongation d’une lettre de madd (ا و ي) qui n’est suivie ni d’une hamza ni d’un sukūn, tenue deux temps. Elle comprend la ṣila du pronom « hu / hi »."],
      ["Madd permis (2, 4 ou 6 temps)", "Prolongation dont la durée est permise entre deux limites : madd munfaṣil (hamza au début du mot suivant), madd ʿāriḍ li-s-sukūn (à l’arrêt), madd līn et madd badal."],
      ["Madd obligatoire (4 à 5 temps)", "Madd muttaṣil : la lettre de madd est suivie d’une hamza dans le même mot. La prolongation est obligatoire ; sa durée dépend de la lecture suivie."],
      ["Madd nécessaire (6 temps)", "Madd lāzim : la lettre de madd est suivie d’un sukūn permanent ou d’une shadda. Six temps."],
      ["Nasalisation (ghunna)", "Résonance nasale de deux temps : ghunna (nūn et mīm avec shadda), ikhfāʾ, ikhfāʾ shafawī, iqlāb et idghām avec ghunna."],
      ["Qalqala", "Léger rebond des lettres ق ط ب ج د lorsqu’elles portent un sukūn ou à l’arrêt."],
      ["Tafkhīm", "Prononciation emphatique (épaisse) : rāʾ épaissi, lām du mot « Allāh » après fatḥa ou ḍamma, lettres d’emphase."],
    ],
  },
  en: {
    title: "Tajweed guide", close: "Close",
    helper: "Each colour groups neighbouring tajweed rules. The list below explains what each one marks.",
    warshArchive: "Warsh uses the same colours as Hafs for the same rules. The rules are read from the app’s Warsh annotations and from the signs printed in this edition.",
    warsh: "Warsh uses the same colours as Hafs for the same rules. The rules are read from the signs printed in this edition.",
    sourcePrefix: "Colours: tajweed palette of", sourceName: "Quran.com", sourceSuffix: ".",
    groups: [
      ["Silent letters and assimilation", "Grey marks what is not pronounced or merges into the next letter: hamzat al-waṣl, the sun-letter lām (lām shamsiyya) and idghām without ghunna or between identical or close letters."],
      ["Natural madd (2 beats)", "Lengthening of a madd letter (ا و ي) followed by neither a hamza nor a sukūn, held for two beats. It includes the ṣila of the pronoun “hu / hi”."],
      ["Permissible madd (2, 4 or 6 beats)", "Lengthening whose duration is allowed between two limits: madd munfaṣil (hamza at the start of the next word), madd ʿāriḍ li-s-sukūn (when stopping), madd līn and madd badal."],
      ["Obligatory madd (4 to 5 beats)", "Madd muttaṣil: the madd letter is followed by a hamza in the same word. The lengthening is obligatory; its duration depends on the reading followed."],
      ["Necessary madd (6 beats)", "Madd lāzim: the madd letter is followed by a permanent sukūn or a shadda. Six beats."],
      ["Nasalisation (ghunna)", "Nasal resonance of two beats: ghunna (nūn and mīm with shadda), ikhfāʾ, ikhfāʾ shafawī, iqlāb and idghām with ghunna."],
      ["Qalqalah", "A light rebound of the letters ق ط ب ج د when they carry a sukūn or at a stop."],
      ["Tafkhīm", "Emphatic (heavy) pronunciation: thickened rāʾ, the lām of “Allāh” after fatḥa or ḍamma, emphatic letters."],
    ],
  },
  ar: {
    title: "دليل التجويد", close: "إغلاق",
    helper: "يجمع كل لون أحكام تجويد متقاربة. توضح القائمة أدناه ما يشير إليه كل لون.",
    warshArchive: "يستخدم ورش ألوان حفص نفسها للأحكام نفسها. تُعرف الأحكام من تعليقات ورش في التطبيق ومن العلامات المطبوعة في هذه النسخة.",
    warsh: "يستخدم ورش ألوان حفص نفسها للأحكام نفسها. تُعرف الأحكام من العلامات المطبوعة في هذه النسخة.",
    sourcePrefix: "الألوان: لوحة ألوان التجويد في", sourceName: "Quran.com", sourceSuffix: ".",
    groups: [
      ["الحروف غير المنطوقة والإدغام", "يشير الرمادي إلى ما لا يُنطق أو يندمج في الحرف التالي: همزة الوصل، واللام الشمسية، والإدغام بغير غنة أو بين حرفين متماثلين أو متقاربين."],
      ["المد الطبيعي (حركتان)", "مد حرف المد (ا و ي) الذي لا يليه همز ولا سكون بمقدار حركتين، ويشمل صلة هاء الضمير."],
      ["المد الجائز (٢ أو ٤ أو ٦ حركات)", "مد يجوز فيه التفاوت في المقدار بين حدّين: المد المنفصل (همز في أول الكلمة التالية)، والمد العارض للسكون (عند الوقف)، ومد اللين، والمد البدل."],
      ["المد الواجب (٤ إلى ٥ حركات)", "المد المتصل: يقع بعد حرف المد همز في الكلمة نفسها. مده واجب، ويتبع مقداره القراءة المتّبعة."],
      ["المد اللازم (٦ حركات)", "يقع بعد حرف المد سكون أصلي أو حرف مشدد، ومقداره ست حركات."],
      ["الغنة", "رنين أنفي بمقدار حركتين: الغنة في النون والميم المشددتين، والإخفاء، والإخفاء الشفوي، والإقلاب، والإدغام بغنة."],
      ["القلقلة", "اهتزاز خفيف في حروف ق ط ب ج د إذا سكنت أو عند الوقف."],
      ["التفخيم", "نطق الحرف مفخمًا: تفخيم الراء، ولام لفظ الجلالة بعد فتح أو ضم، وحروف الاستعلاء."],
    ],
  },
};
