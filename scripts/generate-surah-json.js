const fs = require('fs');
const path = require('path');

// Read the source files
const arabicData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../assets/quran/ara-quranbazzi.json'), 'utf8')
);
const malayalamData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../assets/quran/mal-abdulhameedmada.json'), 'utf8')
);

// Surah metadata from quran-audio-malayalam.ts
const surahMetadata = [
  { index: 1, name: 'سورَة ٱلْفَاتِحَة', nameTrans: 'Surah Al-Fatihah', nameMl: 'അല്‍ ഫാത്തിഹ' },
  { index: 2, name: 'سورَة ٱلْبَقَرَة', nameTrans: 'Surah Al-Baqarah', nameMl: 'അല്‍ ബഖറ' },
  { index: 3, name: 'سورَة آلِ عِمْرَان', nameTrans: "Surah Ali 'Imran", nameMl: 'ആലു ഇംറാന്‍' },
  { index: 4, name: 'سورَة ٱلنِّسَاء', nameTrans: 'Surah An-Nisa', nameMl: 'അന്നിസാഅ്' },
  { index: 5, name: 'سورَة ٱلْمَائِدَة', nameTrans: "Surah Al-Ma'idah", nameMl: 'അല്‍ മാഇദഃ' },
  { index: 6, name: 'سورَة ٱلْأَنْعَام', nameTrans: "Surah Al-An'am", nameMl: 'അല്‍ അന്‍ആം' },
  { index: 7, name: 'سورَة ٱلْأَعْرَاف', nameTrans: "Surah Al-A'raf", nameMl: 'അല്‍ അഅ്റാഫ്' },
  { index: 8, name: 'سورَة ٱلْأَنْفَال', nameTrans: 'Surah Al-Anfal', nameMl: 'അല്‍ അന്‍ഫാല്‍' },
  { index: 9, name: 'سورَة ٱلتَّوْبَة', nameTrans: 'Surah At-Tawbah', nameMl: 'അത്തൌബ' },
  { index: 10, name: 'سورَة يُونُس', nameTrans: 'Surah Yunus', nameMl: 'യൂനുസ്' },
  { index: 11, name: 'سورَة هُود', nameTrans: 'Surah Hud', nameMl: 'ഹൂദ്' },
  { index: 12, name: 'سورَة يُوسُف', nameTrans: 'Surah Yusuf', nameMl: 'യൂസുഫ്' },
  { index: 13, name: 'سورَة ٱلرَّعْد', nameTrans: "Surah Ar-Ra'd", nameMl: 'അര്‍റഅ്ദ്' },
  { index: 14, name: 'سورَة إِبْرَاهِيم', nameTrans: 'Surah Ibrahim', nameMl: 'ഇബ്രാഹീം' },
  { index: 15, name: 'سورَة ٱلْحِجْر', nameTrans: 'Surah Al-Hijr', nameMl: 'അല്‍ ഹിജ്ര്‍' },
  { index: 16, name: 'سورَة ٱلنَّحْل', nameTrans: 'Surah An-Nahl', nameMl: 'അന്നഹ്ല്‍' },
  { index: 17, name: 'سورَة ٱلْإِسْرَاء', nameTrans: 'Surah Al-Isra', nameMl: 'അല്‍ ഇസ്റാഅ്' },
  { index: 18, name: 'سورَة ٱلْكَهْف', nameTrans: 'Surah Al-Kahf', nameMl: 'അല്‍ കഹ്ഫ്' },
  { index: 19, name: 'سورَة مَرْيَم', nameTrans: 'Surah Maryam', nameMl: 'മര്‍യം' },
  { index: 20, name: 'سورَة طه', nameTrans: 'Surah Ta-Ha', nameMl: 'ത്വാഹാ' },
  { index: 21, name: 'سورَة ٱلْأَنْبِيَاء', nameTrans: 'Surah Al-Anbiya', nameMl: 'അല്‍ അന്‍ബിയാഅ്' },
  { index: 22, name: 'سورَة ٱلْحَجّ', nameTrans: 'Surah Al-Hajj', nameMl: 'അല്‍ ഹജ്ജ്' },
  { index: 23, name: 'سورَة ٱلْمُؤْمِنُون', nameTrans: "Surah Al-Mu'minun", nameMl: 'അല്‍ മുഅ്മിനൂന്‍' },
  { index: 24, name: 'سورَة ٱلنُّور', nameTrans: 'Surah An-Nur', nameMl: 'അന്നൂര്‍' },
  { index: 25, name: 'سورَة ٱلْفُرْقَان', nameTrans: 'Surah Al-Furqan', nameMl: 'അല്‍ ഫുര്‍ഖാന്‍' },
  { index: 26, name: 'سورَة ٱلشُّعَرَاء', nameTrans: "Surah Ash-Shu'ara", nameMl: 'അശ്ശുഅറാഅ്' },
  { index: 27, name: 'سورَة ٱلنَّمْل', nameTrans: 'Surah An-Naml', nameMl: 'അന്നംല്‍' },
  { index: 28, name: 'سورَة ٱلْقَصَص', nameTrans: 'Surah Al-Qasas', nameMl: 'അല്‍ ഖസസ്' },
  { index: 29, name: 'سورَة ٱلْعَنْكَبُوت', nameTrans: 'Surah Al-Ankabut', nameMl: 'അല്‍ അന്‍കബൂത്' },
  { index: 30, name: 'سورَة ٱلرُّوم', nameTrans: 'Surah Ar-Rum', nameMl: 'അര്‍റൂം' },
  { index: 31, name: 'سورَة لُقْمَان', nameTrans: 'Surah Luqmaan', nameMl: 'ലുഖ്മാന്‍' },
  { index: 32, name: 'سورَة ٱلسَّجْدَة', nameTrans: 'As-Sajdah', nameMl: 'അസ്സജദഃ' },
  { index: 33, name: 'سورَة ٱلْأَحْزَاب', nameTrans: 'Al-Ahzaab', nameMl: 'അല്‍ അഹ്സാബ്' },
  { index: 34, name: 'سورَة سَبَأ', nameTrans: 'Surah Saba (surah)', nameMl: 'സബഅ്' },
  { index: 35, name: 'سورَة فَاطِر', nameTrans: 'Surah Faatir', nameMl: 'ഫാത്വിര്‍' },
  { index: 36, name: 'سورَة يس', nameTrans: 'Surah Ya-Sin', nameMl: 'യാസീന്‍' },
  { index: 37, name: 'سورَة ٱلصَّافَّات', nameTrans: 'Surah As-Saaffaat', nameMl: 'അസ്സ്വാഫ്ഫാത്ത്' },
  { index: 38, name: 'سورَة ص', nameTrans: 'Surah Saad', nameMl: 'സ്വാദ്' },
  { index: 39, name: 'سورَة ٱلزُّمَر', nameTrans: 'Surah Az-Zumar', nameMl: 'അസ്സുമര്‍' },
  { index: 40, name: 'سورَة غَافِ', nameTrans: 'Surah Ghafir', nameMl: 'അല്‍ മുഅ്മിന്‍' },
  { index: 41, name: 'سورَة فُصِّلَت', nameTrans: 'Surah Fussilat', nameMl: 'ഫുസ്സിലത്ത്' },
  { index: 42, name: 'سورَة ٱلشُّورىٰ', nameTrans: 'Surah Ash-Shura', nameMl: 'അശ്ശൂറാ' },
  { index: 43, name: 'سورَة ٱلْزُّخْرُف', nameTrans: 'Surah Az-Zukhruf', nameMl: 'അസ്സുഖ്റുഫ്' },
  { index: 44, name: 'سورَة ٱلدُّخَان', nameTrans: 'Surah Ad-Dukhaan', nameMl: 'അദ്ദുഖാന്‍' },
  { index: 45, name: 'سورَة ٱلْجَاثِيَة', nameTrans: 'Surah Al-Jaathiyah', nameMl: 'അല്‍ ജാഥിയഃ' },
  { index: 46, name: 'سورَة ٱلْأَحْقَاف', nameTrans: 'Surah Al-Ahqaaf', nameMl: 'അല്‍ അഹ്ഖാഫ്' },
  { index: 47, name: 'سورَة مُحَمَّد', nameTrans: 'Surah Muhammad', nameMl: 'മുഹമ്മദ്' },
  { index: 48, name: 'سورَة ٱلْفَتْح', nameTrans: 'Surah Al-Fath', nameMl: 'അല്‍ ഫത്ഹ്' },
  { index: 49, name: 'سورَة ٱلْحُجُرَات', nameTrans: 'Surah Al-Hujuraat', nameMl: 'അല്‍ ഹുജുറാത്' },
  { index: 50, name: 'سورَة ق', nameTrans: 'Surah Qaaf', nameMl: 'ഖാഫ്' },
  { index: 51, name: 'سورَة ٱلذَّارِيَات', nameTrans: 'Surah Adh-Dhaariyaat', nameMl: 'അദ്ദാരിയാത്' },
  { index: 52, name: 'سورَة ٱلطُّور', nameTrans: 'Surah At-Toor', nameMl: 'അത്ത്വൂര്‍' },
  { index: 53, name: 'سورَة ٱلنَّجْم', nameTrans: 'Surah An-Najm', nameMl: 'അന്നജ്മ്' },
  { index: 54, name: 'سورَة ٱلْقَمَر', nameTrans: 'Surah Al-Qamar', nameMl: 'അല്‍ ഖമര്‍' },
  { index: 55, name: 'سورَة ٱلرَّحْمَٰن', nameTrans: 'Surah Ar-Rahman', nameMl: 'അര്‍റഹ് മാന്‍‍' },
  { index: 56, name: 'سورَة ٱلْوَاقِعَة', nameTrans: "Surah Al-Waqi'a", nameMl: 'അല്‍ വാഖിഅ' },
  { index: 57, name: 'سورَة ٱلْحَدِيد', nameTrans: 'Surah Al-Hadeed', nameMl: 'അല്‍ ഹദീദ്' },
  { index: 58, name: 'سورَة ٱلْمُجَادِلَة', nameTrans: 'Surah Al-Mujadila', nameMl: 'അല്‍ മുജാദിലഃ' },
  { index: 59, name: 'سورَة ٱلْحَشْر', nameTrans: 'Surah Al-Hashr', nameMl: 'അല്‍ ഹശ്ര്‍' },
  { index: 60, name: 'سورَة ٱلْمُمْتَحَنَة', nameTrans: 'Surah Al-Mumtahanah', nameMl: 'അല്‍ മുംതഹിനഃ' },
  { index: 61, name: 'سورَة ٱلصَّفّ', nameTrans: 'Surah As-Saff', nameMl: 'അസ്സ്വഫ്ഫ്' },
  { index: 62, name: 'سورَة ٱلْجُمُعَة', nameTrans: "Surah Al-Jumu'ah", nameMl: 'അല്‍ ജുമുഅഃ' },
  { index: 63, name: 'سورَة ٱلْمُنَافِقُون', nameTrans: 'Surah Al-Munafiqoon', nameMl: 'അല്‍ മുനാഫിഖൂന്‍' },
  { index: 64, name: 'سورَة ٱلتَّغَابُن', nameTrans: 'Surah At-Taghabun', nameMl: 'അല്‍ തഗാബൂന്‍' },
  { index: 65, name: 'سورَة ٱلطَّلَاق', nameTrans: 'Surah At-Talaq', nameMl: 'അത്ത്വലാഖ്' },
  { index: 66, name: 'سورَة ٱلتَّحْرِيم', nameTrans: 'Surah At-Tahreem', nameMl: 'അത്തഹ് രീം' },
  { index: 67, name: 'سورَة ٱلْمُلْك', nameTrans: 'Surah Al-Mulk', nameMl: 'അല്‍ മുല്‍ക്ക്' },
  { index: 68, name: 'سورَة ٱلْقَلَم', nameTrans: 'Surah Al-Qalam', nameMl: 'അല്‍ ഖലം' },
  { index: 69, name: 'سورَة ٱلْحَاقَّة', nameTrans: 'Surah Al-Haaqqa', nameMl: 'അല്‍ ഹാക്ക്വഃ' },
  { index: 70, name: 'سورَة ٱلْمَعَارِج', nameTrans: "Surah Al-Ma'aarij", nameMl: 'അല്‍ മആരിജ്' },
  { index: 71, name: 'سورَة نُوح', nameTrans: 'Surah Nuh', nameMl: 'നൂഹ്' },
  { index: 72, name: 'سورَة ٱلْجِنّ', nameTrans: 'Surah Al-Jinn', nameMl: 'അല്‍ ജിന്ന്' },
  { index: 73, name: 'سورَة ٱلْمُزَّمِّل', nameTrans: 'Surah Al-Muzzammil', nameMl: 'അല്‍ മുസമ്മില്‍' },
  { index: 74, name: 'سورَة ٱلْمُدَّثِّر', nameTrans: 'Surah Al-Muddaththir', nameMl: 'അല്‍ മുദ്ദഥിര്‍' },
  { index: 75, name: 'سورَة ٱلْقِيَامَة', nameTrans: 'Surah Al-Qiyamah', nameMl: 'അല്‍ ഖിയാമഃ' },
  { index: 76, name: 'سورَة ٱلْإِنْسَان', nameTrans: 'Surah Al-Insaan', nameMl: 'അല്‍ ഇന്‍സാന്‍' },
  { index: 77, name: 'سورَة ٱلْمُرْسَلَات', nameTrans: 'Surah Al-Mursalaat', nameMl: 'അല്‍ മുര്‍സലാത്ത്' },
  { index: 78, name: 'سورَة ٱلنَّبَأ', nameTrans: "Surah An-Naba'", nameMl: 'അന്നബഉ്' },
  { index: 79, name: 'سورَة ٱلنَّازِعَات', nameTrans: "Surah An-Naazi'aat", nameMl: 'അന്നാസിആത്ത്' },
  { index: 80, name: 'سورَة عَبَسَ', nameTrans: 'Surah Abasa', nameMl: 'അബസ' },
  { index: 81, name: 'سورَة ٱلتَّكْوِير', nameTrans: 'Surah At-Takweer', nameMl: 'അത്തക് വീര്‍' },
  { index: 82, name: 'سورَة ٱلْإِنْفِطَار', nameTrans: 'Surah Al-Infitar', nameMl: 'അല്‍ ഇന്‍ഫിത്വാര്‍' },
  { index: 83, name: 'سورَة ٱلْمُطَفِّفِين', nameTrans: 'Surah Al-Mutaffifeen', nameMl: 'അല്‍ മുതഫ്ഫിഫീന്‍' },
  { index: 84, name: 'سورَة ٱلْإِنْشِقَاق', nameTrans: 'Surah Al-Inshiqaaq', nameMl: 'അല്‍ ഇന്‍ശിഖാഖ്' },
  { index: 85, name: 'سورَة ٱلْبُرُوج', nameTrans: 'Surah Al-Burooj', nameMl: 'അല്‍ ബുറൂജ്' },
  { index: 86, name: 'سورَة ٱلطَّارِق', nameTrans: 'Surah At-Taariq', nameMl: 'അത്ത്വാരിഖ്' },
  { index: 87, name: 'سورَة ٱلْأَعْلَىٰ', nameTrans: "Surah Al-A'la", nameMl: 'അല്‍ അഅ് ലാ' },
  { index: 88, name: 'سورَة ٱلْغَاشِيَة', nameTrans: 'Surah Al-Ghaashiyah', nameMl: 'അല്‍ ഗാശിയഃ' },
  { index: 89, name: 'سورَة ٱلْفَجْر', nameTrans: 'Surah Al-Fajr', nameMl: 'അല്‍ ഫജ്ര്‍' },
  { index: 90, name: 'سورَة ٱلْبَلَد', nameTrans: 'Surah Al-Balad', nameMl: 'അല്‍ ബലദ്' },
  { index: 91, name: 'سورَة ٱلشَّمْس', nameTrans: 'Surah Ash-Shams', nameMl: 'അശ്ശംസ്' },
  { index: 92, name: 'سورَة ٱللَّيْل', nameTrans: 'Surah Al-Layl', nameMl: 'അല്‍ലൈല്‍' },
  { index: 93, name: 'سورَة ٱلضُّحَىٰ', nameTrans: 'Surah Ad-Dhuha', nameMl: 'അള്ള്വുഹാ' },
  { index: 94, name: 'سورَة ٱلشَّرْح', nameTrans: 'Surah Ash-Sharh', nameMl: 'അശ്ശര്‍ഹ്' },
  { index: 95, name: 'سورَة ٱلتِّين', nameTrans: 'Surah At-Tin', nameMl: 'അത്തീന്‍' },
  { index: 96, name: 'سورَة ٱلْعَلَق', nameTrans: 'Surah Al-Alaq', nameMl: 'അല്‍ അലഖ്' },
  { index: 97, name: 'سورَة ٱلْقَدْر', nameTrans: 'Surah Al-Qadr', nameMl: 'അല്‍ ഖദ്ര്‍' },
  { index: 98, name: 'سورَة ٱلْبَيِّنَة', nameTrans: 'Surah Al-Bayyinahh', nameMl: 'അല്‍ ബയ്യിനഃ' },
  { index: 99, name: 'سورَة ٱلزَّلْزَلَة', nameTrans: 'Surah Az-Zalzalah', nameMl: 'അല്‍ സല്‍സലഃ' },
  { index: 100, name: 'سورَة ٱلْعَادِيَات', nameTrans: "Surah Al-'Adiyat", nameMl: 'അല്‍ ആദിയാത്' },
  { index: 101, name: 'سورَة ٱلْقَارِعَة', nameTrans: "Surah Al-Qaari'ah", nameMl: 'അല്‍ ഖാരിഅ' },
  { index: 102, name: 'سورَة ٱلتَّكَاثُر', nameTrans: 'Surah At-Takathur', nameMl: 'അത്തകാഥുര്‍' },
  { index: 103, name: 'سورَة ٱلْعَصْر', nameTrans: "Surah Al-'Asr", nameMl: 'അല്‍ അസ്വര്‍' },
  { index: 104, name: 'سورَة ٱلْهُمَزَة', nameTrans: 'Surah Al-Humazah', nameMl: 'അല്‍ ഹുമസഃ' },
  { index: 105, name: 'سورَة ٱلْفِيل', nameTrans: 'Surah Al-Fil', nameMl: 'അല്‍ ഫീല്‍' },
  { index: 106, name: 'سورَة قُرَيْش', nameTrans: 'Surah Quraysh', nameMl: 'ഖുറൈഷ്' },
  { index: 107, name: 'سورَة ٱلْمَاعُون', nameTrans: "Surah Al-Maa'oon", nameMl: 'അല്‍ മാഊന്‍' },
  { index: 108, name: 'سورَة ٱلْكَوْثَر', nameTrans: 'Surah Al-Kawthar', nameMl: 'അല്‍ കൌഥര്‍‍' },
  { index: 109, name: 'سورَة ٱلْكَافِرُون', nameTrans: 'Surah Al-Kaafiroon', nameMl: 'അല്‍ കാഫിറൂന്‍' },
  { index: 110, name: 'سورَة ٱلنَّصْر', nameTrans: 'Surah An-Nasr', nameMl: 'അന്നസ്ര്‍' },
  { index: 111, name: 'سورَة ٱلْمَسَد', nameTrans: 'Surah Al-Masad', nameMl: 'അല്‍ മസദ്' },
  { index: 112, name: 'سورَة ٱلْإِخْلَاص', nameTrans: 'Surah Al-Ikhlaas', nameMl: 'അല്‍ ഇഖ് ലാസ്' },
  { index: 113, name: 'سورَة ٱلْفَلَق', nameTrans: 'Surah Al-Falaq', nameMl: 'അല്‍ ഫലഖ്' },
  { index: 114, name: 'سورَة ٱلنَّاس', nameTrans: 'Surah An-Naas', nameMl: 'അന്നാസ്' },
];

// Group verses by chapter
const arabicByChapter = {};
const malayalamByChapter = {};

arabicData.quran.forEach((verse) => {
  if (!arabicByChapter[verse.chapter]) {
    arabicByChapter[verse.chapter] = [];
  }
  arabicByChapter[verse.chapter].push(verse);
});

malayalamData.quran.forEach((verse) => {
  if (!malayalamByChapter[verse.chapter]) {
    malayalamByChapter[verse.chapter] = [];
  }
  malayalamByChapter[verse.chapter].push(verse);
});

// Output directory
const outputDir = path.join(__dirname, '../assets/quran-json');

// Generate 114 JSON files
for (let i = 1; i <= 114; i++) {
  const metadata = surahMetadata.find((s) => s.index === i);
  const arabicVerses = arabicByChapter[i] || [];
  const malayalamVerses = malayalamByChapter[i] || [];

  const verses = arabicVerses.map((arabicVerse, idx) => {
    const malayalamVerse = malayalamVerses[idx];
    return {
      number: arabicVerse.verse,
      arabic: arabicVerse.text,
      malayalam: malayalamVerse ? malayalamVerse.text : '',
    };
  });

  const surahData = {
    number: i,
    name: metadata ? metadata.name.trim() : '',
    nameTrans: metadata ? metadata.nameTrans : '',
    nameMl: metadata ? metadata.nameMl : '',
    totalVerses: verses.length,
    verses: verses,
  };

  const outputPath = path.join(outputDir, `${i}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(surahData, null, 2), 'utf8');
  console.log(`Generated: ${i}.json (${verses.length} verses)`);
}

console.log('\nDone! Generated 114 surah JSON files.');
