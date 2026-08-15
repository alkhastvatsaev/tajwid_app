// Visuel SEO = extrait mushaf Tilmidh.
// COLR KFGQPC + phonétique sous le mot + points madd + check de validation.
// Pas de sceau, pas de chrome « Live practice ».

const DEMOS = {
  ghunnah: {
    words: [
      { ar: 'صِرَٰطَ', phon: 'ṣirāṭa', pips: 2 },
      { ar: 'ٱلَّذِينَ', phon: 'alladhīna', pips: 2 },
      { ar: 'أَنۡعَمۡتَ', phon: 'anʿamta', pips: 0 },
      { ar: 'عَلَيۡهِمۡ', phon: 'ʿalayhim', pips: 0 },
    ],
    validatedIndex: 1,
    hint: {
      fr: 'Ghunnah · deux harakāt',
      en: 'Ghunnah · two counts',
      id: 'Ghunnah · dua harakat',
      ar: 'الغنّة · حركتان',
      ru: 'Гунна · две харакаты',
      tr: 'Gunne · iki hareke',
      ur: 'غنہ · دو حرکات',
      bn: 'গুননাহ · দুই হরকত',
      ms: 'Ghunnah · dua harakat',
      de: 'Ghunnah · zwei Harakat',
      es: 'Ghunnah · dos harakat',
    },
  },
  idgham: {
    words: [
      { ar: 'مِن', phon: 'min', pips: 0 },
      { ar: 'رَّبِّهِمۡ', phon: 'rabbīhim', pips: 0 },
      { ar: 'وَ', phon: 'wa', pips: 0 },
      { ar: 'مَن', phon: 'man', pips: 0 },
    ],
    validatedIndex: 0,
    hint: {
      fr: 'Idgham · يرملون',
      en: 'Idgham · يرملون',
      id: 'Idgham · يرملون',
      ar: 'الإدغام · يرملون',
      ru: 'Идгам · يرملون',
      tr: 'İdgam · يرملون',
      ur: 'ادغام · يرملون',
      bn: 'ইদগাম · يرملون',
      ms: 'Idgham · يرملون',
      de: 'Idgham · يرملون',
      es: 'Idgham · يرملون',
    },
  },
  ikhfa: {
    words: [
      { ar: 'مِن', phon: 'min', pips: 0 },
      { ar: 'شَرِّ', phon: 'sharri', pips: 0 },
      { ar: 'مَا', phon: 'mā', pips: 2 },
      { ar: 'خَلَقَ', phon: 'khalaq', pips: 0 },
    ],
    validatedIndex: 0,
    hint: {
      fr: 'Ikhfa · nūn dissimulé',
      en: 'Ikhfa · hidden nūn',
      id: 'Ikhfa · nun disamarkan',
      ar: 'الإخفاء · النون المخفاة',
      ru: 'Ихфа · скрытый нун',
      tr: 'İhfa · gizlenen nun',
      ur: 'اخفا · نون چھپی',
      bn: 'ইখফা · গোপন নুন',
      ms: 'Ikhfa · nun tersembunyi',
      de: 'Ikhfa · verborgenes Nun',
      es: 'Ikhfa · nūn oculta',
    },
  },
  madd: {
    words: [{ ar: 'ٱلضَّآلِّينَ', phon: 'aḍ-ḍāllīn', pips: 6 }],
    validatedIndex: -1,
    hint: {
      fr: 'Madd lāzim · six harakāt',
      en: 'Madd lāzim · six counts',
      id: 'Madd lazim · enam harakat',
      ar: 'المدّ اللازم · ستّ حركات',
      ru: 'Мадд лязим · шесть харакат',
      tr: 'Med lazım · altı hareke',
      ur: 'مد لازم · چھ حرکات',
      bn: 'মাদ্দ লাযিম · ছয় হরকত',
      ms: 'Madd lazim · enam harakat',
      de: 'Madd lazim · sechs Harakat',
      es: 'Madd lazim · seis harakat',
    },
  },
  qalqalah: {
    words: [
      { ar: 'قُلۡ', phon: 'qul', pips: 0 },
      { ar: 'هُوَ', phon: 'huwa', pips: 0 },
      { ar: 'ٱللَّهُ', phon: 'allāhu', pips: 0 },
      { ar: 'أَحَدٌ', phon: 'aḥad', pips: 0 },
    ],
    validatedIndex: 0,
    hint: {
      fr: 'Qalqalah · قطب جد',
      en: 'Qalqalah · قطب جد',
      id: 'Qalqalah · قطب جد',
      ar: 'القلقلة · قطب جد',
      ru: 'Калькаля · قطب جد',
      tr: 'Kalḳale · قطب جد',
      ur: 'قلقلہ · قطب جد',
      bn: 'কলকলাহ · قطب جد',
      ms: 'Qalqalah · قطب جد',
      de: 'Qalqalah · قطب جد',
      es: 'Qalqalah · قطب جد',
    },
  },
  fatihah: {
    words: [
      { ar: 'بِسۡمِ', phon: "bis'mi", pips: 1, tone: 'mute' },
      { ar: 'ٱللَّهِ', phon: 'l-lāhi', pips: 0 },
      { ar: 'ٱلرَّحۡمَٰنِ', phon: 'l-raḥmāni', pips: 2 },
      { ar: 'ٱلرَّحِيمِ', phon: 'l-raḥīmi', pips: 4 },
    ],
    validatedIndex: 0,
    hint: {
      fr: 'Al-Fātiḥah · mot à mot',
      en: 'Al-Fātiḥah · word by word',
      id: 'Al-Fatihah · kata demi kata',
      ar: 'الفاتحة · كلمةً بكلمة',
      ru: 'Аль-Фатиха · слово за словом',
      tr: 'Fatiha · kelime kelime',
      ur: 'الفاتحہ · لفظ بہ لفظ',
      bn: 'আল-ফাতিহা · শব্দে শব্দে',
      ms: 'Al-Fatihah · perkataan demi perkataan',
      de: 'Al-Fatiha · Wort für Wort',
      es: 'Al-Fatiha · palabra por palabra',
    },
  },
  ikhlas: {
    words: [
      { ar: 'قُلۡ', phon: 'qul', pips: 0 },
      { ar: 'هُوَ', phon: 'huwa', pips: 0 },
      { ar: 'ٱللَّهُ', phon: 'allāhu', pips: 0 },
      { ar: 'أَحَدٌ', phon: 'aḥad', pips: 0 },
    ],
    validatedIndex: 0,
    hint: {
      fr: 'Al-Ikhlāṣ',
      en: 'Al-Ikhlāṣ',
      id: 'Al-Ikhlas',
      ar: 'الإخلاص',
      ru: 'Аль-Ихлас',
      tr: 'İhlas',
      ur: 'الاخلاص',
      bn: 'আল-ইখলাস',
      ms: 'Al-Ikhlas',
      de: 'Al-Ikhlas',
      es: 'Al-Ikhlas',
    },
  },
  falaq: {
    words: [
      { ar: 'قُلۡ', phon: 'qul', pips: 0 },
      { ar: 'أَعُوذُ', phon: 'aʿūdhu', pips: 2 },
      { ar: 'بِرَبِّ', phon: 'birabbi', pips: 0 },
      { ar: 'ٱلۡفَلَقِ', phon: 'l-falaq', pips: 0 },
    ],
    validatedIndex: 0,
    hint: {
      fr: 'Al-Falaq',
      en: 'Al-Falaq',
      id: 'Al-Falaq',
      ar: 'الفلق',
      ru: 'Аль-Фаляк',
      tr: 'Felak',
      ur: 'الفلق',
      bn: 'আল-ফালাক',
      ms: 'Al-Falaq',
      de: 'Al-Falaq',
      es: 'Al-Falaq',
    },
  },
  nas: {
    words: [
      { ar: 'قُلۡ', phon: 'qul', pips: 0 },
      { ar: 'أَعُوذُ', phon: 'aʿūdhu', pips: 2 },
      { ar: 'بِرَبِّ', phon: 'birabbi', pips: 0 },
      { ar: 'ٱلنَّاسِ', phon: 'n-nās', pips: 2 },
    ],
    validatedIndex: 3,
    hint: {
      fr: 'An-Nās',
      en: 'An-Nās',
      id: 'An-Nas',
      ar: 'الناس',
      ru: 'Ан-Нас',
      tr: 'Nas',
      ur: 'الناس',
      bn: 'আন-নাস',
      ms: 'An-Nas',
      de: 'An-Nas',
      es: 'An-Nas',
    },
  },
  mulk: {
    words: [
      { ar: 'تَبَٰرَكَ', phon: 'tabāraka', pips: 2 },
      { ar: 'ٱلَّذِى', phon: 'alladhī', pips: 2 },
      { ar: 'بِيَدِهِ', phon: 'biyadihi', pips: 0 },
      { ar: 'ٱلۡمُلۡكُ', phon: 'l-mulk', pips: 0 },
    ],
    validatedIndex: 0,
    hint: {
      fr: 'Al-Mulk',
      en: 'Al-Mulk',
      id: 'Al-Mulk',
      ar: 'الملك',
      ru: 'Аль-Мульк',
      tr: 'Mülk',
      ur: 'الملک',
      bn: 'আল-মুলক',
      ms: 'Al-Mulk',
      de: 'Al-Mulk',
      es: 'Al-Mulk',
    },
  },
  kursi: {
    words: [
      { ar: 'ٱللَّهُ', phon: 'allāhu', pips: 0 },
      { ar: 'لَآ', phon: 'lā', pips: 4 },
      { ar: 'إِلَٰهَ', phon: 'ilāha', pips: 2 },
      { ar: 'إِلَّا', phon: 'illā', pips: 2 },
      { ar: 'هُوَ', phon: 'huwa', pips: 0 },
    ],
    validatedIndex: 0,
    hint: {
      fr: 'Ayat al-Kursī',
      en: 'Ayat al-Kursī',
      id: 'Ayat Kursi',
      ar: 'آية الكرسي',
      ru: 'Аят аль-Курси',
      tr: 'Ayetel Kürsi',
      ur: 'آیۃ الکرسی',
      bn: 'আয়াতুল কুরসি',
      ms: 'Ayat Kursi',
      de: 'Ayat al-Kursi',
      es: 'Ayat al-Kursi',
    },
  },
  mark: {
    words: [
      { ar: 'بِسۡمِ', phon: "bis'mi", pips: 1, tone: 'mute' },
      { ar: 'ٱللَّهِ', phon: 'l-lāhi', pips: 0 },
      { ar: 'ٱلرَّحۡمَٰنِ', phon: 'l-raḥmāni', pips: 2 },
      { ar: 'ٱلرَّحِيمِ', phon: 'l-raḥīmi', pips: 4 },
    ],
    validatedIndex: 0,
    hint: {
      fr: 'Mot à mot, comme dans l’app',
      en: 'Word by word, as in the app',
      id: 'Kata demi kata, seperti di aplikasi',
      ar: 'كلمةً بكلمة كما في التطبيق',
      ru: 'Слово за словом, как в приложении',
      tr: 'Kelime kelime, uygulamadaki gibi',
      ur: 'لفظ بہ لفظ، ایپ کی طرح',
      bn: 'শব্দে শব্দে, অ্যাপের মতো',
      ms: 'Perkataan demi perkataan, seperti dalam app',
      de: 'Wort für Wort, wie in der App',
      es: 'Palabra por palabra, como en la app',
    },
  },
};

const CAPTIONS = {
  ghunnah: {
    fr: 'Nun mushaddad — ghunnah de deux harakāt.',
    en: 'Nun mushaddad — ghunnah of two counts.',
    id: 'Nun musyaddad — ghunnah dua harakat.',
    ar: 'النون المشدّدة — غنّة حركتين.',
    ru: 'Нун мушаддад — гунна в две харакаты.',
    tr: 'Şeddeli nun — iki hareke gunne.',
    ur: 'نون مشدد — دو حرکات کا غنہ۔',
    bn: 'নুন মুশাদ্দাদ — দুই হরকতের গুননাহ।',
    ms: 'Nun musyaddad — ghunnah dua harakat.',
    de: 'Nun muschaddad — Ghunnah von zwei Harakat.',
    es: 'Nun musaddad — ghunnah de dos harakat.',
  },
  idgham: {
    fr: 'Idgham — fusion audible, mot validé.',
    en: 'Idgham — audible merge, word validated.',
    id: 'Idgham — melebur, kata disahkan.',
    ar: 'الإدغام — إدغام مسموع، كلمة صحيحة.',
    ru: 'Идгам — слияние, слово подтверждено.',
    tr: 'İdgam — birleşme, kelime doğrulandı.',
    ur: 'ادغام — لفظ درست۔',
    bn: 'ইদগাম — শব্দ সঠিক।',
    ms: 'Idgham — perkataan disahkan.',
    de: 'Idgham — Wort bestätigt.',
    es: 'Idgham — palabra validada.',
  },
  ikhfa: {
    fr: 'Ikhfa — nūn dissimulé, mot validé.',
    en: 'Ikhfa — hidden nūn, word validated.',
    id: 'Ikhfa — nun disamarkan, kata disahkan.',
    ar: 'الإخفاء — كلمة صحيحة.',
    ru: 'Ихфа — слово подтверждено.',
    tr: 'İhfa — kelime doğrulandı.',
    ur: 'اخفا — لفظ درست۔',
    bn: 'ইখফা — শব্দ সঠিক।',
    ms: 'Ikhfa — perkataan disahkan.',
    de: 'Ikhfa — Wort bestätigt.',
    es: 'Ikhfa — palabra validada.',
  },
  madd: {
    fr: 'Madd — les points comptent les harakāt.',
    en: 'Madd — the dots count the harakāt.',
    id: 'Madd — titik menghitung harakat.',
    ar: 'المدّ — النقاط تعدّ الحركات.',
    ru: 'Мадд — точки считают харакаты.',
    tr: 'Med — noktalar harekeleri sayar.',
    ur: 'مد — نقطے حرکات گنتے ہیں۔',
    bn: 'মাদ্দ — বিন্দু হরকত গণনা করে।',
    ms: 'Madd — titik mengira harakat.',
    de: 'Madd — die Punkte zählen die Harakat.',
    es: 'Madd — los puntos cuentan las harakat.',
  },
  qalqalah: {
    fr: 'Qalqalah — قُلْ validé, rebond articulaire.',
    en: 'Qalqalah — قُلْ validated, articulatory bounce.',
    id: 'Qalqalah — قُلْ disahkan.',
    ar: 'القلقلة — قُلْ صحيحة.',
    ru: 'Калькаля — قُلْ подтверждено.',
    tr: 'Kalḳale — قُلْ doğrulandı.',
    ur: 'قلقلہ — قُلْ درست۔',
    bn: 'কলকলাহ — قُلْ সঠিক।',
    ms: 'Qalqalah — قُلْ disahkan.',
    de: 'Qalqalah — قُلْ bestätigt.',
    es: 'Qalqalah — قُلْ validada.',
  },
  fatihah: {
    fr: 'Al-Fātiḥah — arabe, phonétique, tajwid.',
    en: 'Al-Fātiḥah — Arabic, phonetics, tajweed.',
    id: 'Al-Fatihah — Arab, fonetik, tajwid.',
    ar: 'الفاتحة — عربي، صوتي، تجويد.',
    ru: 'Аль-Фатиха — арабский, фонетика, таджвид.',
    tr: 'Fatiha — Arapça, fonetik, tecvid.',
    ur: 'الفاتحہ — عربی، صوتی، تجوید۔',
    bn: 'আল-ফাতিহা — আরবি, ধ্বনি, তাজউইদ।',
    ms: 'Al-Fatihah — Arab, fonetik, tajwid.',
    de: 'Al-Fatiha — Arabisch, Phonetik, Tadschwid.',
    es: 'Al-Fatiha — árabe, fonética, tayyid.',
  },
  ikhlas: {
    fr: 'Al-Ikhlāṣ dans Tilmidh.',
    en: 'Al-Ikhlāṣ in Tilmidh.',
    id: 'Al-Ikhlas di Tilmidh.',
    ar: 'الإخلاص في تلميذ.',
    ru: 'Аль-Ихлас в Tilmidh.',
    tr: 'Tilmidh’te İhlas.',
    ur: 'تلميذ میں الاخلاص۔',
    bn: 'Tilmidh-এ আল-ইখলাস।',
    ms: 'Al-Ikhlas dalam Tilmidh.',
    de: 'Al-Ikhlas in Tilmidh.',
    es: 'Al-Ikhlas en Tilmidh.',
  },
  falaq: {
    fr: 'Al-Falaq dans Tilmidh.',
    en: 'Al-Falaq in Tilmidh.',
    id: 'Al-Falaq di Tilmidh.',
    ar: 'الفلق في تلميذ.',
    ru: 'Аль-Фаляк в Tilmidh.',
    tr: 'Tilmidh’te Felak.',
    ur: 'تلميذ میں الفلق۔',
    bn: 'Tilmidh-এ আল-ফালাক।',
    ms: 'Al-Falaq dalam Tilmidh.',
    de: 'Al-Falaq in Tilmidh.',
    es: 'Al-Falaq en Tilmidh.',
  },
  nas: {
    fr: 'An-Nās dans Tilmidh.',
    en: 'An-Nās in Tilmidh.',
    id: 'An-Nas di Tilmidh.',
    ar: 'الناس في تلميذ.',
    ru: 'Ан-Нас в Tilmidh.',
    tr: 'Tilmidh’te Nas.',
    ur: 'تلميذ میں الناس۔',
    bn: 'Tilmidh-এ আন-নাস।',
    ms: 'An-Nas dalam Tilmidh.',
    de: 'An-Nas in Tilmidh.',
    es: 'An-Nas en Tilmidh.',
  },
  mulk: {
    fr: 'Al-Mulk dans Tilmidh.',
    en: 'Al-Mulk in Tilmidh.',
    id: 'Al-Mulk di Tilmidh.',
    ar: 'الملك في تلميذ.',
    ru: 'Аль-Мульк в Tilmidh.',
    tr: 'Tilmidh’te Mülk.',
    ur: 'تلميذ میں الملک۔',
    bn: 'Tilmidh-এ আল-মুলক।',
    ms: 'Al-Mulk dalam Tilmidh.',
    de: 'Al-Mulk in Tilmidh.',
    es: 'Al-Mulk en Tilmidh.',
  },
  kursi: {
    fr: 'Ayat al-Kursī dans Tilmidh.',
    en: 'Ayat al-Kursī in Tilmidh.',
    id: 'Ayat Kursi di Tilmidh.',
    ar: 'آية الكرسي في تلميذ.',
    ru: 'Аят аль-Курси в Tilmidh.',
    tr: 'Tilmidh’te Ayetel Kürsi.',
    ur: 'تلميذ میں آیۃ الکرسی۔',
    bn: 'Tilmidh-এ আয়াতুল কুরসি।',
    ms: 'Ayat Kursi dalam Tilmidh.',
    de: 'Ayat al-Kursi in Tilmidh.',
    es: 'Ayat al-Kursi en Tilmidh.',
  },
  mark: {
    fr: 'Arabe, phonétique, tajwid — mot à mot.',
    en: 'Arabic, phonetics, tajweed — word by word.',
    id: 'Arab, fonetik, tajwid — kata demi kata.',
    ar: 'عربي وصوتي وتجويد — كلمةً بكلمة.',
    ru: 'Арабский, фонетика, таджвид — слово за словом.',
    tr: 'Arapça, fonetik, tecvid — kelime kelime.',
    ur: 'عربی، صوتی، تجوید — لفظ بہ لفظ۔',
    bn: 'আরবি, ধ্বনি, তাজউইদ — শব্দে শব্দে।',
    ms: 'Arab, fonetik, tajwid — perkataan demi perkataan.',
    de: 'Arabisch, Phonetik, Tadschwid — Wort für Wort.',
    es: 'Árabe, fonética, tayyid — palabra por palabra.',
  },
};

export const ILLU_CSS = `
        @font-face {
            font-family: 'KFGQPC Colored';
            src: url('/fonts/KFGQPCHAFSColored-Bold.woff2?v=chromatic-2') format('woff2');
            font-display: block;
        }
        .media-illu { margin: 0.15rem 0 1.85rem; padding: 0; }
        .media-illu .demo-stage {
            border-radius: 22px;
            background: #fff;
            padding: 1.85rem 1.05rem 1.25rem;
            box-shadow: 0 18px 50px rgba(28, 22, 16, 0.045);
        }
        .media-illu .demo-verse {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            align-items: flex-start;
            gap: 1.05rem 0.45rem;
            direction: rtl;
        }
        .media-illu .word-box {
            display: flex;
            flex-direction: column;
            align-items: center;
            position: relative;
            flex: 1 1 38%;
            max-width: 11rem;
            opacity: 0;
            transform: translateY(10px);
        }
        @media (min-width: 540px) {
            .media-illu .demo-verse {
                flex-wrap: nowrap;
                gap: 0.45rem 1.65rem;
            }
            .media-illu .word-box {
                flex: 0 1 auto;
                max-width: none;
                min-width: 3.6rem;
            }
        }
        .media-illu .marks {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            gap: 6px;
            height: 18px;
            margin-bottom: 0.2rem;
            direction: ltr;
        }
        .media-illu .pips {
            display: flex;
            gap: 5px;
            pointer-events: none;
        }
        .media-illu .pips i {
            width: 6px; height: 6px; border-radius: 50%;
            background: #d97706;
            display: block;
            opacity: 0;
            transform: scale(0.35);
        }
        .media-illu .pips-mute i { background: #c5c0b8; }
        .media-illu .ok {
            position: relative;
            width: 14px; height: 14px;
            border-radius: 50%;
            background: #059669;
            box-shadow: 0 0 0 3px rgba(5,150,105,0.12);
            flex-shrink: 0;
            opacity: 0;
            transform: scale(0.4);
        }
        .media-illu .ok::after {
            content: '';
            position: absolute;
            left: 4.5px; top: 2.6px;
            width: 3.2px; height: 6.2px;
            border: solid #fff;
            border-width: 0 1.6px 1.6px 0;
            transform: rotate(45deg);
        }
        .media-illu .arabic-word {
            font-family: 'KFGQPC Colored';
            font-weight: 700;
            font-size: clamp(1.55rem, 6.6vw, 2.55rem);
            line-height: 1.65;
            direction: rtl;
            white-space: nowrap;
            font-feature-settings: "liga" 1, "rlig" 1, "calt" 1;
        }
        .media-illu .word-box.correct .arabic-word {
            font-family: 'KFGQPC Colored';
        }
        .media-illu .translit {
            margin-top: 0.28rem;
            font-size: 0.7rem;
            font-weight: 500;
            letter-spacing: 0.045em;
            color: #9a958c;
            direction: ltr;
            unicode-bidi: isolate;
            text-align: center;
        }
        .media-illu .demo-hint {
            margin: 1.15rem 0 0;
            text-align: center;
            font-size: 0.78rem;
            color: #8a857c;
            letter-spacing: 0.02em;
            opacity: 0;
        }
        .media-illu figcaption {
            margin: 0.75rem 0 0;
            font-size: 0.82rem;
            color: var(--muted);
            line-height: 1.45;
        }
        .media-illu.is-alive .word-box {
            animation: demo-in 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
            animation-delay: calc(var(--i, 0) * 95ms);
        }
        .media-illu.is-alive .pips i {
            animation: pip-in 0.38s cubic-bezier(0.2, 0.9, 0.2, 1) forwards;
            animation-delay: calc(0.42s + var(--i, 0) * 95ms + var(--p, 0) * 140ms);
        }
        .media-illu.is-alive .ok {
            opacity: 1; transform: scale(1);
            transition: opacity 0.28s ease 0.95s, transform 0.4s cubic-bezier(0.2,0.9,0.2,1) 0.95s;
        }
        .media-illu.is-alive .demo-hint {
            opacity: 1;
            transition: opacity 0.45s ease 0.7s;
        }
        @keyframes demo-in {
            to { opacity: 1; transform: none; }
        }
        @keyframes pip-in {
            to { opacity: 1; transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
            .media-illu .word-box,
            .media-illu .demo-hint,
            .media-illu .pips i,
            .media-illu .ok { opacity: 1; transform: none; animation: none; }
        }
        ol.page-root, ol.page-root > li { list-style: none; margin: 0; padding: 0; }
        .media-video { display: none; }`;

export const ILLU_SCRIPTS = `
    <script defer src="/js/illu-motion.js"></script>`;

export function illuIdForRoute(route) {
  const r = route.replace(/\/$/, '') || '/';
  if (r.includes('ayat-kursi')) return 'kursi';
  if (r.includes('sourate/112')) return 'ikhlas';
  if (r.includes('sourate/113')) return 'falaq';
  if (r.includes('sourate/114')) return 'nas';
  if (r.includes('sourate/67')) return 'mulk';
  if (r.includes('sourate/1')) return 'fatihah';
  if (r.includes('regle/qalqalah')) return 'qalqalah';
  if (r.includes('regle/ghunnah')) return 'ghunnah';
  if (r.includes('regle/madd')) return 'madd';
  if (r.includes('regle/ikhfa')) return 'ikhfa';
  if (r.includes('regle/idgham')) return 'idgham';
  return 'mark';
}

export function getCaption(lang, illuId) {
  const row = CAPTIONS[illuId] || CAPTIONS.mark;
  return row[lang] || row.en || row.fr;
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function pipsHtml(w) {
  const n = w.pips || 0;
  if (!n) return '<span class="pips" aria-hidden="true"></span>';
  const tone = w.tone === 'mute' ? ' pips-mute' : '';
  const dots = Array.from({ length: n }, (_, p) => `<i style="--p:${p}"></i>`).join('');
  return `<span class="pips${tone}" aria-hidden="true">${dots}</span>`;
}

function renderDemo(illuId, lang) {
  const demo = DEMOS[illuId] || DEMOS.mark;
  const hint = demo.hint[lang] || demo.hint.en || demo.hint.fr;
  const boxes = demo.words
    .map((w, i) => {
      const ok = i === demo.validatedIndex;
      const cls = ['word-box', ok ? 'correct' : ''].filter(Boolean).join(' ');
      const badge = ok ? '<span class="ok" aria-hidden="true"></span>' : '';
      return `                <span class="${cls}" style="--i:${i}"><span class="marks">${pipsHtml(w)}${badge}</span><span class="arabic-word">${esc(w.ar)}</span><span class="translit">${esc(w.phon)}</span></span>`;
    })
    .join('\n');
  return `            <div class="demo-stage">
                <div class="demo-verse" dir="rtl" lang="ar">
${boxes}
                </div>
                <p class="demo-hint">${esc(hint)}</p>
            </div>`;
}

export function renderIlluBlock({ illuId, lang, caption }) {
  const id = DEMOS[illuId] ? illuId : 'mark';
  const cap = caption || getCaption(lang || 'fr', id);
  return `        <figure class="media-illu" data-illu="${id}">
${renderDemo(id, lang || 'fr')}
            <figcaption>${esc(cap)}</figcaption>
        </figure>
        <!-- .media-video reserved for later -->`;
}

export function getSvg() {
  return '';
}
