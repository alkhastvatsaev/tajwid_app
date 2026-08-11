# Distribution jour 1 — coller tel quel

Lien unique : **https://tilmidh.app/**

## WhatsApp / Telegram (carte OG déjà live)

```
Tilmidh — tu récites, le micro passe chaque mot au vert.
Fātiḥah, Ikhlāṣ. Gratuit. Outil d’entraînement, pas une ijazah.
https://tilmidh.app/
```

Envoie à : famille, groupe tajwid, 3–5 imams / profs (le Duo imam/talib).

## YouTube — titre + description (vidéo 15 s)

**Titre :** Tilmidh — récite le Coran mot à mot (tajwid microphone)

**Description :**
```
Tilmidh (تلميذ) : récite, le micro vérifie chaque mot, la case passe au vert.
https://tilmidh.app/
Outil d’entraînement — pas une ijazah. Texte Quran.com.
#tajwid #quran #fatiha #tilmidh
```

**Record (écran iPhone/Android, muet) :**
1. 0–2 s : tilmidh.app
2. 2–5 s : toucher overlay
3. 5–12 s : 3–4 mots Fātiḥah verts
4. 12–15 s : fin

## Product Hunt — draft

**Name:** Tilmidh  
**Tagline:** Word-by-word tajwid trainer — the mic turns each word green  
**Topics:** Education, Android, Islam  
**First comment:**
```
I built Tilmidh (تلميذ = student) because I wanted to practice Fātiḥah word by word, not watch a course.
You recite. The browser mic checks the word. Green box → next.
Not an ijazah. Quran text from Quran.com.
https://tilmidh.app/
```

Launch 12:01am PT. Thumbnail = `public/icons/icon-512.png`. Gallery = shot-1 + shot-2.

## Reddit — UN seul post (pas de multi-spam)

**Sub :** r/MuslimLounge **ou** r/learn_arabic (un seul).  
**Titre :** I made a word-by-word tajwid trainer (mic checks each word) — looking for reciters to break it

**Corps :**
```
Not an ijazah and not “AI certified”. Browser mic + Quran.com tajwid colors.

You recite one word. If the box turns green, you got the word. Grey = repeat that word only.

Boot: Ikhlāṣ → Falaq → Nās → Fātiḥah.
Duo mode if you teach (imam / student on the same line).

https://tilmidh.app/

If a word stays grey on your dialect / riwāya, tell me which verse.
```

## Play Console — Data safety (honnête)

- App collects user data? **No** (pas de compte, pas de serveur Tilmidh).
- Microphone : **permission** pour Web Speech on-device. Not shared. Not sold.
- Privacy policy URL : `https://tilmidh.app/privacy`
- IARC : questionnaire « Education / Reference », pas de violence, pas d’achat in-app.

## Fichiers à uploader Play

| Asset | Chemin |
|--|--|
| Icône 512 | `public/icons/icon-512.png` |
| Feature 1024×500 | `public/aso/feature-1024x500.png` |
| Screenshot 1 | `public/aso/shot-1.png` |
| Screenshot 2 | `public/aso/shot-2.png` |
| AAB | `twa/` après `bubblewrap build` (JDK requis) |
