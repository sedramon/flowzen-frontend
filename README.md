# Flowzen Frontend

Angular aplikacija za upravljanje salonima i klinikama sa POS funkcionalnostima.

## 🚀 Funkcionalnosti

- **Responsive dizajn** - Material Design sa Angular Material
- **Autentifikacija** - Login/Register sa JWT tokenima
- **POS sistem** - Kompletna kasa sa artiklima i uslugama
- **Upravljanje terminima** - Kalendar i zakazivanje
- **CRM** - Upravljanje klijentima
- **HR** - Upravljanje zaposlenima
- **Raspored rada** - Upravljanje smenama
- **Multi-tenant** - Podrška za više lokacija

## 🛠️ Tehnologije

- **Frontend**: Angular 20, TypeScript
- **UI Framework**: Angular Material
- **State Management**: RxJS
- **HTTP Client**: Angular HttpClient
- **Routing**: Angular Router
- **Forms**: Reactive Forms

## 📋 Preduslovi

- Node.js (v18 ili noviji)
- Angular CLI
- Yarn ili npm

## 🚀 Pokretanje aplikacije

### 1. Instalacija dependencija

```bash
yarn install
# ili
npm install
```

### 2. Pokretanje development servera

```bash
yarn start
# ili
ng serve
```

Aplikacija će biti dostupna na `http://localhost:4200/`

### 3. Build za produkciju

```bash
yarn build
# ili
ng build
```

Build artifacts će biti u `dist/` folderu.

## 🧪 Testiranje

```bash
# Unit testovi
yarn test
# ili
ng test

# E2E testovi
yarn e2e
# ili
ng e2e
```

## 📁 Struktura projekta

```
src/app/
├── core/              # Core servisi i guards
│   ├── guards/        # Auth i scope guards
│   ├── interceptors/  # HTTP interceptors
│   └── services/      # Core servisi
├── modules/           # Feature moduli
│   ├── login/         # Login komponenta
│   ├── pos/           # POS sistem
│   ├── appointments/  # Termini
│   ├── clients/       # Klijenti
│   ├── employees/     # Zaposleni
│   └── ...
├── models/            # TypeScript interfejsi
├── dialogs/           # Dialog komponente
└── layout/            # Layout komponenta
```

## 🔧 Development

### Code generation

```bash
# Generisanje komponente
ng generate component component-name

# Generisanje servisa
ng generate service service-name

# Generisanje guard-a
ng generate guard guard-name
```

### Linting i formatting

```bash
# Linting
ng lint

# Formatting
ng format
```

## 🌐 Environment konfiguracija

Kreiranje environment fajlova:

```bash
# Development
cp src/environments/environment.ts src/environments/environment.dev.ts

# Production
cp src/environments/environment.prod.ts src/environments/environment.prod.ts
```

## 📱 Responsive dizajn

Aplikacija je potpuno responsive i optimizovana za:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (320px - 767px)

## 🎨 Tematizacija

Aplikacija koristi Angular Material theming sa custom Flowzen temom:
- `src/app/themes/flowzentheme.css` - Glavna tema
- `src/app/themes/themestheme.css` - Dodatne teme

## 🔐 Autentifikacija

Aplikacija koristi JWT-based autentifikaciju sa:
- Login/Register forme
- Auth guard za zaštićene rute
- HTTP interceptor za automatsko dodavanje tokena
- Scope-based autorizacija

## 📊 POS funkcionalnosti

- Kreiranje prodaje
- Upravljanje artiklima
- Upravljanje uslugama
- Generisanje računa
- Upravljanje gotovinom

## 🤝 Doprinos

1. Fork repozitorijum
2. Kreirajte feature branch
3. Commit promene
4. Push na branch
5. Otvorite Pull Request

## 📄 Licenca

Ovaj projekat je licenciran pod MIT licencom.
