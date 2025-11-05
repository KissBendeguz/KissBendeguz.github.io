# Quiz Game – README

Interaktív, időre menő kvízjáték három témakörrel (**Filmek**, **IT**, **Történelem**), választható nehézséggel, kategória-specifikus hátterekkel és helyi toplistával.

## Funkciók

- **Kategóriaválasztás** (Filmek, IT, Történelem) és **nehézség** (könnyű/közepes/nehéz).  
- **Kategória-háttérkép**: minden témához külön háttér; ha hiányzik, akkor a `assets/images/all.jpg` az alapértelmezett.  
- **„glass” UI**: lokálisan elmosott panelek a háttérből vágva (clip + blur).  
- **Gyors interakció**: kattintás, **1–4** (A–D) gyorsbillentyűk, **szóköz** a „Következő” gombra.  
- **Lifeline-ok**: 50-50, Kihagyás, +5 mp. Felhasználásuk max 1x. 
- **Időbónuszos pontozás**: Minnék több idő van vissza a körből annál több pontot kapunk.
- **Toplista** (helyben, localStorage).  

## Mappa-struktúra

```
./
├─ index.html  
├─ public/  
│  └─ data.json          # kérdések + kategória meta (háttérképek)  
├─ assets/  
│  ├─ css/  
│  │  ├─ styles.css      # SCSS-ből buildelt CSS
│  │  └─ styles.scss
│  └─ images/  
│     ├─ all.jpg  
│     ├─ movies.jpg  
│     ├─ it.jpg  
│     └─ history.jpg  
└─ src/  
   ├─ game.js            # inicializáció
   ├─ state.js           # state machine, toplista, lifeline-ok  
   ├─ dom.js             # overlay UI (start, game over, toplista)  
   ├─ data.js            # data.json betöltés + kérdésválasztás  
   └─ canvas.js          # a játék teljes UI-ja canvas-on  
``` 

## Adatfájl (public/data.json) formátum

A játék **kategória meta** adatokat és **kérdéseket** vár:

```
{
  "categories": {
    "all": { "bg": "./assets/images/all.jpg" },
    "Filmek": { "bg": "./assets/images/filmek.jpg" },
    "IT": { "bg": "./assets/images/it.jpg" },
    "Történelem": { "bg": "./assets/images/tortenelem.jpg" }
  },
  "questions": [
    {
      "id": 1,
      "category": "IT",
      "difficulty": "easy",
      "question": "Mit jelent a HTML rövidítés?",
      "answers": {
        "A": "HyperText Markup Language",
        "B": "HighText Machine Language",
        "C": "Hyperlink and Text Markup Language",
        "D": "Home Tool Markup Language"
      },
      "correct": "A"
    }
  ]
}
```

## Hogyan kell játszani

1. Add meg a neved (opcionális, a toplistához).  
2. Válassz **nehézséget** és **kategóriát**.  
3. Kattints a **„Játék indítása”** gombra.  

**Játék közben:**  
- **Válaszadás**: kattints egy válasz gombra vagy nyomd meg az **1–4** billentyűt (A–D).  
- **Lifeline-ok**: 50-50 (két rossz eltűnik), Kihagyás (következő kérdés), +5 mp (idő hozzáadása).  
- Idő lejártakor a kérdés hibásnak számít.  
- Visszajelzés után a következő kérdésre **szóköz**-zel vagy a **„Következő kérdés”** gombra kattintva vagy rövid késleltetés után automatikusan lép a játék.  
- A végén a pontszámod **elmentődik** a böngésződbe.  

## Használt technikák

### JavaScript nyelvi elemei

### DOM programozás 

### Eseménykezelés

### Kódszervezés, adatok tárolása
- **State machine**: képernyőállapotok, kérdés-flow, lifeline-ok, pontozás  
- **Observer minta**: subscribe() + emit() az UI frissítéshez
- **localStorage**: toplista perzisztencia  
- **Fetch**: public/data.json betöltése

### Űrlapok, képek, táblázatok 

### JavaScript beépített objektumai

## Canvas, animációk

- **Canvas 2D** render loop (requestAnimationFrame)
- Háttérkép **cover** kirajzolása képarány megőrzéssel  
- **Glass** panelek:  
  - Path2D + clip() → lokális vágás  
  - háttér újrarajzolása a klipben + blur effekt
- **Szöveg stroke+fill**:  
  - drawStrokedText(...) – egysoros outline-olt szöveg  
  - drawStrokedWrappedText(...) – tördelt outline-olt szöveg
- **Időzítés**:  
  - setInterval – másodperc alapú visszaszámlálás  
  - setTimeout – automatikus „Következő” késleltetés  

## Stílusok (SCSS)

- A stílusok **SCSS**-ben készültek, buildelve az assets/css/styles.css-be.  
- Változók (színek, rádiuszok, árnyékok), konzisztens tipográfia.  
- A játék közben a teljes vizuális UI a **canvas**-on jelenik meg; az overlay csak a menükre szolgál.
