# 🚀 POS SISTEM - BRZO POKRETANJE

## 📋 **BRZI START**

### **1. Pokrenuti Backend**
```bash
cd flowzen-backend
npm run start:dev
```

Backend će biti dostupan na: `http://localhost:3000`

### **2. Pokrenuti Frontend**
```bash
cd flowzen-frontend
npm start
```

Frontend će biti dostupan na: `http://localhost:4200`

---

## 🔐 **TEST KORISNICI**

### **Admin korisnik:**
- **Email:** `admin@flowzen.com`
- **Password:** `admin123`
- **Scopes:** Svi scope-ovi (admin, pos, appointments, clients, etc.)

### **POS korisnik:**
- **Email:** `cashier@flowzen.com`
- **Password:** `cashier123`
- **Scopes:** POS scope-ovi (pos:read, pos:write, pos:session)

---

## 🎯 **POS FUNKCIONALNOSTI**

### **1. POS Prodaja (Sales)**
- **URL:** `http://localhost:4200/pos/sales`
- **Funkcionalnosti:**
  - Kreiranje nove prodaje
  - Pregled svih prodaja
  - Detaljan pregled transakcije
  - Štampanje računa
  - Povraćaj (refund)
  - Fiskalizacija

### **2. POS Sesije (Sessions)**
- **URL:** `http://localhost:4200/pos/sessions`
- **Funkcionalnosti:**
  - Otvaranje nove sesije
  - Zatvaranje sesije
  - Pregled svih sesija
  - Cash counting
  - Cash verification
  - Cash variance handling

### **3. POS Izveštaji (Reports)**
- **URL:** `http://localhost:4200/pos/reports`
- **Funkcionalnosti:**
  - Dnevni izveštaji
  - Nedeljni izveštaji
  - Mesečni izveštaji
  - Z izveštaji (EOD)
  - Export u PDF/Excel

### **4. POS Podešavanja (Settings)** ✅ **NOVO**
- **URL:** `http://localhost:4200/pos/settings`
- **Funkcionalnosti:**
  - **Načini plaćanja** - konfiguracija payment methods
  - **Porez i popusti** - tax & discount settings
  - **Račun** - receipt template configuration
  - **Fiskalizacija** - fiscalization settings

---

## 💰 **CASH MANAGEMENT**

### **1. Cash Session Dashboard**
- **URL:** `http://localhost:4200/pos/cash-session-dashboard`
- **Funkcionalnosti:**
  - Pregled aktivnih sesija
  - Statistike gotovine
  - Quick actions

### **2. Cash Reports**
- **URL:** `http://localhost:4200/pos/cash-reports`
- **Funkcionalnosti:**
  - Dnevni cash izveštaji
  - Analitika gotovine
  - Trendovi

### **3. Cash Analytics**
- **URL:** `http://localhost:4200/pos/cash-analytics`
- **Funkcionalnosti:**
  - Grafički prikazi
  - Trendovi i statistike
  - Predviđanja

---

## 🎨 **NAVIGACIJA**

### **Sidebar meni:**
```
POS
├── Prodaja (Sales)
├── Sesije (Sessions)
├── Izveštaji (Reports)
└── Podešavanja (Settings) ✅ NOVO
```

### **Cash Management:**
```
Cash Management
├── Dashboard
├── Izveštaji (Reports)
└── Analitika (Analytics)
```

---

## 🔧 **TESTIRANJE POS SETTINGS**

### **Korak 1: Prijaviti se**
```
Email: admin@flowzen.com
Password: admin123
```

### **Korak 2: Navigirati do POS Settings**
1. Kliknuti na "POS" u sidebar meniju
2. Izabrati "Podešavanja"

### **Korak 3: Testirati funkcionalnosti**

#### **Tab 1: Načini plaćanja**
- ✅ Uključiti/isključiti payment methods
- ✅ Promeniti nazive payment methods
- ✅ Testirati cash, card, voucher, gift, bank, other

#### **Tab 2: Porez i popusti**
- ✅ Uneti defaultTaxRate (npr. 20%)
- ✅ Uneti maxDiscountPercent (npr. 50%)
- ✅ Testirati checkbox za negativne cene

#### **Tab 3: Račun**
- ✅ Uneti format broja računa (npr. FAC-YYYYMMDD-####)
- ✅ Uneti header tekst
- ✅ Uneti footer tekst
- ✅ Testirati QR kod checkbox
- ✅ Testirati fiskalni broj checkbox

#### **Tab 4: Fiskalizacija**
- ✅ Uključiti/isključiti fiskalizaciju
- ✅ Izabrati provider (none, device, cloud)
- ✅ Uneti timeout (ms)
- ✅ Uneti broj pokušaja

### **Korak 4: Sačuvati podešavanja**
- Kliknuti na "Sačuvaj podešavanja" dugme
- Videti success poruku
- Proveriti da su podešavanja sačuvana

### **Korak 5: Reset na default**
- Kliknuti na "Vrati na podrazumevano" dugme
- Videti da su sva polja resetovana na default vrednosti

---

## 🐛 **TROUBLESHOOTING**

### **Problem 1: POS Settings se ne otvara**
**Rešenje:** ✅ **REŠENO** - Komponenta je refaktorisana

### **Problem 2: Backend ne radi**
**Rešenje:**
```bash
cd flowzen-backend
npm install
npm run start:dev
```

### **Problem 3: Frontend ne radi**
**Rešenje:**
```bash
cd flowzen-frontend
npm install
npm start
```

### **Problem 4: Nema podataka**
**Rešenje:** Proveriti da li je backend pokrenut i dostupan na `http://localhost:3000`

### **Problem 5: TypeScript greške**
**Rešenje:**
```bash
cd flowzen-frontend
npm run build
```

---

## 📊 **API ENDPOINT-OVI**

### **POS Sales:**
- `POST /pos/sales` - Kreiranje prodaje
- `GET /pos/sales` - Lista prodaja
- `GET /pos/sales/:id` - Detaljan pregled prodaje
- `POST /pos/sales/:id/refund` - Povraćaj
- `POST /pos/sales/:id/fiscalize` - Fiskalizacija

### **POS Sessions:**
- `POST /pos/sessions/open` - Otvaranje sesije
- `POST /pos/sessions/:id/close` - Zatvaranje sesije
- `GET /pos/sessions` - Lista sesija
- `GET /pos/sessions/:id` - Detaljan pregled sesije
- `POST /pos/sessions/:id/count-cash` - Brojanje gotovine

### **POS Reports:**
- `GET /pos/reports/daily` - Dnevni izveštaj
- `GET /pos/reports/session/:id/z` - Z izveštaj

### **POS Settings:**
- `GET /pos/settings` - Dohvatanje podešavanja
- `PUT /pos/settings` - Ažuriranje podešavanja

---

## 🎉 **USPEŠNO POKRETANJE**

Nakon pokretanja backend-a i frontend-a, prijavite se i testirajte sve POS funkcionalnosti:

1. ✅ **POS Sales** - kreiranje prodaje
2. ✅ **POS Sessions** - otvaranje sesije
3. ✅ **POS Reports** - pregled izveštaja
4. ✅ **POS Settings** - podešavanja sistema
5. ✅ **Cash Management** - upravljanje gotovinom

**Imate potpuno funkcionalnu profesionalnu blagajnu!** 🚀

---

## 📞 **POMOĆ**

Za dodatnu pomoć ili pitanja:
- Proverite dokumentaciju u `docs/` folderu
- Kontaktirajte developera

**Datum:** 30. septembar 2025
**Verzija:** 1.0.0
**Status:** ✅ READY FOR PRODUCTION
