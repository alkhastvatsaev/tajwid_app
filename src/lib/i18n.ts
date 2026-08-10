import type { Lang } from "./storage";

export type Translation = {
  start: string;
  statusListen: string;
  statusMic: string;
  restart: string;
  nextVerse: string;
  dailyLabel: string;
  dailySub: string;
  browserTitle: string;
  browserSearch: string;
  browserClose: string;
  statsTitle: string;
  statsVerses: string;
  statsFavs: string;
  statsGoal: string;
  statsContinue: string;
  importTitle: string;
  importDesc: string;
  importPlaceholder: string;
  importCancel: string;
  importBtn: string;
  assistantTitle: string;
  assistantTarget: string;
  assistantHeard: string;
  hintRepeat: string;
  hintAlmost: string;
  summaryTitle: string;
  duoTitle: string;
  duoDesc: string;
  duoCreate: string;
  duoJoin: string;
  duoRoom: string;
  duoWaiting: string;
  duoConnected: string;
  duoCode: string;
  cancel: string;
  listen: string;
  stop: string;
  legendTitle: string;
};

export const translations: Record<Lang, Translation> = {
  fr: {
    start: "Touchez pour commencer",
    statusListen: "L'IA vous écoute",
    statusMic: "Veuillez autoriser le micro",
    restart: "Recommencer",
    nextVerse: "Verset suivant",
    dailyLabel: "Verset du Jour",
    dailySub: "Appuyez pour découvrir",
    browserTitle: "Choisir une Sourate",
    browserSearch: "Chercher une sourate...",
    browserClose: "Fermer",
    statsTitle: "Tableau de Bord",
    statsVerses: "Versets",
    statsFavs: "Favoris",
    statsGoal: "Objectif Coran",
    statsContinue: "Continuer l'apprentissage",
    importTitle: "Nouveau Verset",
    importDesc: "Tapez la référence (ex: 2:255)",
    importPlaceholder: "Surah:Ayah (ex: 18:10)",
    importCancel: "Annuler",
    importBtn: "Importer",
    assistantTitle: "Analyse en direct",
    assistantTarget: "Cible",
    assistantHeard: "Vous dites",
    hintRepeat: "Réessayez : la prononciation est différente.",
    hintAlmost: "Presque ! Articulez un peu plus.",
    summaryTitle: "Bilan de Récitation",
    duoTitle: "Mode Duo",
    duoDesc: "Créez une salle ou rejoignez avec un code.",
    duoCreate: "Créer une salle",
    duoJoin: "Rejoindre",
    duoRoom: "Code de salle",
    duoWaiting: "En attente du partenaire…",
    duoConnected: "Connecté",
    duoCode: "Votre code",
    cancel: "Annuler",
    listen: "Écouter",
    stop: "Stop",
    legendTitle: "Légende Tajwid",
  },
  en: {
    start: "Tap to Start",
    statusListen: "AI is listening",
    statusMic: "Please allow microphone",
    restart: "Restart",
    nextVerse: "Next verse",
    dailyLabel: "Verse of the Day",
    dailySub: "Tap to discover",
    browserTitle: "Choose a Surah",
    browserSearch: "Search surah...",
    browserClose: "Close",
    statsTitle: "Dashboard",
    statsVerses: "Verses",
    statsFavs: "Favorites",
    statsGoal: "Quran Goal",
    statsContinue: "Continue Learning",
    importTitle: "New Verse",
    importDesc: "Type reference (ex: 2:255)",
    importPlaceholder: "Surah:Ayah (ex: 18:10)",
    importCancel: "Cancel",
    importBtn: "Import",
    assistantTitle: "Live Analysis",
    assistantTarget: "Target",
    assistantHeard: "You say",
    hintRepeat: "Try again: pronunciation is different.",
    hintAlmost: "Almost! Articulate a bit more.",
    summaryTitle: "Recitation Summary",
    duoTitle: "Duo Mode",
    duoDesc: "Create a room or join with a code.",
    duoCreate: "Create room",
    duoJoin: "Join",
    duoRoom: "Room code",
    duoWaiting: "Waiting for partner…",
    duoConnected: "Connected",
    duoCode: "Your code",
    cancel: "Cancel",
    listen: "Listen",
    stop: "Stop",
    legendTitle: "Tajwid Legend",
  },
  ru: {
    start: "Нажмите, чтобы начать",
    statusListen: "ИИ слушает",
    statusMic: "Разрешите микрофон",
    restart: "Начать сначала",
    nextVerse: "Следующий аят",
    dailyLabel: "Аят дня",
    dailySub: "Нажмите, чтобы узнать",
    browserTitle: "Выберите суру",
    browserSearch: "Поиск суры...",
    browserClose: "Закрыть",
    statsTitle: "Панель приборов",
    statsVerses: "Аяты",
    statsFavs: "Избранное",
    statsGoal: "Цель Коран",
    statsContinue: "Продолжить обучение",
    importTitle: "Новый аят",
    importDesc: "Введите ссылку (напр: 2:255)",
    importPlaceholder: "Сура:Аят (напр: 18:10)",
    importCancel: "Отмена",
    importBtn: "Импорт",
    assistantTitle: "Анализ в реальном времени",
    assistantTarget: "Цель",
    assistantHeard: "Вы говорите",
    hintRepeat: "Попробуйте еще раз: произношение отличается.",
    hintAlmost: "Почти! Артикулируйте немного четче.",
    summaryTitle: "Итоги чтения",
    duoTitle: "Режим Дуо",
    duoDesc: "Создайте комнату или войдите по коду.",
    duoCreate: "Создать комнату",
    duoJoin: "Войти",
    duoRoom: "Код комнаты",
    duoWaiting: "Ожидание партнера…",
    duoConnected: "Подключено",
    duoCode: "Ваш код",
    cancel: "Отмена",
    listen: "Слушать",
    stop: "Стоп",
    legendTitle: "Легенда Таджвида",
  },
};

export function t(lang: Lang): Translation {
  return translations[lang];
}
