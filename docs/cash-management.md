# Cash Management System - Dokumentacija

## 📋 Pregled

Cash Management sistem je profesionalna komponenta za upravljanje gotovinom u POS sistemu. Omogućava otvaranje i zatvaranje cash sesija, brojanje novca, usklađivanje, izveštavanje i analitiku.

## 🏗️ Arhitektura

### Frontend Komponente

#### 1. Cash Session Dashboard (`cash-session-dashboard`)
- **Lokacija**: `src/app/modules/pos/components/cash-session-dashboard/`
- **Funkcionalnost**: Glavni dashboard za upravljanje cash sesijama
- **Ključne karakteristike**:
  - Prikaz aktivne sesije
  - Statistike današnjih sesija
  - Lista poslednjih sesija
  - Akcije za otvaranje/zatvaranje sesija

#### 2. Open Session Dialog (`open-session-dialog`)
- **Lokacija**: `src/app/modules/pos/components/open-session-dialog/`
- **Funkcionalnost**: Dialog za otvaranje nove cash sesije
- **Ključne karakteristike**:
  - Izbor lokacije
  - Unos početnog float-a
  - Opciona napomena
  - Preview sesije pre kreiranja

#### 3. Close Session Dialog (`close-session-dialog`)
- **Lokacija**: `src/app/modules/pos/components/close-session-dialog/`
- **Funkcionalnost**: Dialog za zatvaranje cash sesije
- **Ključne karakteristike**:
  - Unos brojanog cash-a
  - Real-time kalkulacija variance
  - Detaljni pregled nakon zatvaranja
  - Opciona napomena

#### 4. Cash Counting Dialog (`cash-counting-dialog`)
- **Lokacija**: `src/app/modules/pos/components/cash-counting-dialog/`
- **Funkcionalnost**: Dialog za brojanje cash-a
- **Ključne karakteristike**:
  - Unos brojanog iznosa
  - Prikaz rezultata brojanja
  - Status variance (prihvatljivo/upozorenje/kritično)
  - Preporuke na osnovu variance
  - Verifikacija brojanja

#### 5. Cash Reconciliation Dialog (`cash-reconciliation-dialog`)
- **Lokacija**: `src/app/modules/pos/components/cash-reconciliation-dialog/`
- **Funkcionalnost**: Dialog za usklađivanje cash-a
- **Ključne karakteristike**:
  - Detaljni pregled sesije
  - Prikaz po metodama plaćanja
  - Cash flow analiza
  - Variance analiza

#### 6. Cash Reports (`cash-reports`)
- **Lokacija**: `src/app/modules/pos/components/cash-reports/`
- **Funkcionalnost**: Komponenta za generisanje izveštaja
- **Ključne karakteristike**:
  - Filteri po lokaciji i datumu
  - Tabela dnevnih izveštaja
  - Ukupne statistike
  - Eksport funkcionalnost

#### 7. Cash Analytics (`cash-analytics`)
- **Lokacija**: `src/app/modules/pos/components/cash-analytics/`
- **Funkcionalnost**: Komponenta za analitiku
- **Ključne karakteristike**:
  - Key metrics dashboard
  - Performance insights
  - Distribucija plaćanja
  - Preporuke za poboljšanje

### Backend Integracija

#### PosService Metode
```typescript
// Session Management
openSession(data: { facility: string; openingFloat: number; note?: string })
closeSession(id: string, data: { closingCount: number; note?: string })
getSessions(params: { status?: string; facility?: string; employee?: string })
getSession(id: string)
getCurrentSession()
getRecentSessions(limit: number)

// Cash Counting & Verification
countCash(sessionId: string, countedCash: number)
verifyCashCount(sessionId: string, actualCash: number, note?: string)
handleCashVariance(sessionId: string, actualCash: number, action: string, reason: string)

// Reconciliation
reconcileSession(sessionId: string)

// Reports
getDailyCashReport(facility: string, date: string)
getWeeklyCashReport(facility: string, week: string)
getMonthlyCashReport(facility: string, month: string)
getTodayCashStats()
```

## 🎨 Dizajn Sistemi

### Boje
- **Primarna**: `#8c0055` (Flowzen brand)
- **Sekundarna**: `#b3006e`
- **Tekst**: `#e0e0e0` (glavni), `#cccccc` (sekundarni)
- **Pozadina**: Linear gradijent `#1a1a1a` → `#2d2d2d`
- **Kartice**: Linear gradijent `#2d2d2d` → `#3a3a3a`

### Animacije
- **Gradient Pan**: 15s infinite animacija za header-e
- **Hover efekti**: `translateY(-2px)`, `box-shadow`
- **Shimmer efekat**: `::before` pseudo-element
- **Scale animacije**: `scale(1.1)` za ikone

### Responsive Design
- **Desktop**: Grid layout sa `auto-fit`
- **Tablet**: Prilagođeni grid
- **Mobile**: Single column layout

## 🔧 Tehnologije

### Frontend
- **Angular 17+** (Standalone komponente)
- **Angular Material** (UI komponente)
- **RxJS** (Reactive programming)
- **TypeScript** (Type safety)
- **SCSS** (Styling)

### Backend
- **NestJS** (Node.js framework)
- **MongoDB** (Baza podataka)
- **Mongoose** (ODM)
- **class-validator** (DTO validacija)

## 📊 Modeli Podataka

### CashSession
```typescript
interface CashSession {
  id: string;
  tenant: string;
  facility: { id: string; name: string; };
  openedBy: { id: string; firstName: string; lastName: string; };
  openedAt: Date | string;
  openingFloat: number;
  closedBy?: { id: string; firstName: string; lastName: string; };
  closedAt?: Date | string;
  closingCount?: number;
  totalsByMethod: {
    cash: number;
    card: number;
    voucher: number;
    gift: number;
    bank: number;
    other: number;
  };
  expectedCash: number;
  variance: number;
  status: 'open' | 'closed';
  note?: string;
}
```

### CashCountingResult
```typescript
interface CashCountingResult {
  sessionId: string;
  expectedCash: number;
  countedCash: number;
  variance: number;
  variancePercentage: number;
  status: 'acceptable' | 'warning' | 'critical' | 'severe';
  recommendations: string[];
}
```

## 🚀 Rute

### POS Cash Management Rute
```
/pos/cash-management     - Cash Session Dashboard
/pos/cash-reports       - Cash Reports
/pos/cash-analytics     - Cash Analytics
```

### Scope Permissions
- `scope_pos:cash_management` - Cash Management pristup
- `scope_pos:cash_reports` - Cash Reports pristup
- `scope_pos:cash_analytics` - Cash Analytics pristup

## 🔒 Sigurnost

### Validacija
- **Frontend**: Angular reactive forms sa validacijom
- **Backend**: class-validator DTO validacija
- **MongoDB**: ObjectId validacija

### Autentifikacija
- **JWT token** za sve API pozive
- **Scope-based** autorizacija
- **Tenant isolation** za multi-tenant podršku

## 📈 Performance

### Optimizacije
- **OnPush** change detection strategija
- **Lazy loading** komponenti
- **RxJS operators** za optimizaciju streamova
- **CSS animations** umesto JavaScript

### Caching
- **HTTP interceptors** za caching
- **Local storage** za user preferences
- **Service workers** za offline podršku

## 🧪 Testiranje

### Unit Testovi
- **Jest** framework
- **Angular Testing Utilities**
- **Mock services** za API pozive

### E2E Testovi
- **Cypress** framework
- **User journey** testovi
- **API integration** testovi

## 📝 TODO

### Kratkoročni
- [ ] Implementirati eksport funkcionalnost
- [ ] Dodati real-time notifikacije
- [ ] Implementirati offline podršku
- [ ] Dodati bulk operacije

### Dugoročni
- [ ] Machine learning za variance predikciju
- [ ] Advanced analytics dashboard
- [ ] Mobile app integracija
- [ ] Multi-currency podrška

## 🤝 Kontribucija

### Development Workflow
1. **Feature branch** kreiranje
2. **Code review** proces
3. **Automated testing** pokretanje
4. **Production deployment**

### Code Standards
- **TypeScript strict mode**
- **ESLint** konfiguracija
- **Prettier** formatiranje
- **Conventional commits**

## 📞 Podrška

### Dokumentacija
- **API dokumentacija**: Swagger/OpenAPI
- **Component dokumentacija**: Storybook
- **User guide**: In-app help system

### Kontakt
- **Development team**: dev@flowzen.com
- **Support**: support@flowzen.com
- **Documentation**: docs@flowzen.com

---

**Napomena**: Ovaj dokument je deo Flowzen POS sistema i predstavlja profesionalnu implementaciju cash management funkcionalnosti po najvišim industrijskim standardima.
