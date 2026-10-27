# Rebus Bestemmie Generator

Generatore di rebus "bestemmie" italiane: un componente Angular standalone (Angular 21, zoneless, signals) con Tailwind CSS v4 e icone SVG inline.

## Avvio

```bash
npm install
npm start        # dev server su http://localhost:4200
npm run build    # build di produzione in dist/rebus-bestemmie
```

> Nota: `.npmrc` imposta `legacy-peer-deps=true` per aggirare un bug di risoluzione dei peer deps opzionali di `@angular/build` in npm 10.9.x.

## Struttura

```
src/
├── main.ts                              # bootstrap dell'app
├── index.html
├── styles.css                           # import di Tailwind v4
└── app/
    ├── app.config.ts
    └── rebus_bestemmie_generator.ts    # il gioco (componente standalone)
public/
├── favicon.ico
└── assets/fahhh.mp3                    # suono per risposta errata
```

## Come funziona il gioco

- Due dizionari: soggetti sacri (ponderati, con genere grammaticale) ed epiteti profani (divisi m/f).
- Il puzzle accoppia solo termini con lo stesso genere e mostra due carte SVG unite da `+`.
- Punteggio, streak e tempo persistono in `localStorage`; l'audio di errore usa l'asset locale `assets/fahhh.mp3`.
