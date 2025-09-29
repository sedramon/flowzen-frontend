# POS (Point of Sale) — Key Flows and Architecture

Below are high-level visual diagrams to quickly understand how POS is designed to work in the salon app. These render in editors that support Mermaid (Cursor, VSCode with Mermaid, GitHub, etc.).

## 1) Appointment-based Sale (from calendar)
```mermaid
sequenceDiagram
    autonumber
    actor U as User (Cashier)
    participant FE as Frontend (POS Checkout)
    participant BE as Backend (POS API)
    participant INV as Inventory
    participant FIS as Fiscal Provider (Adapter)
    participant PRN as Printer

    U->>FE: Open POS from Appointment (Naplati)
    FE->>BE: GET /appointments/:id (details)
    BE-->>FE: Appointment, Client, Services
    FE->>U: Show cart pre-filled, allow add/remove items
    U->>FE: Apply discount, add tip, choose payment method(s)

    note over FE,BE: Validate: open CashSession for facility
    FE->>BE: POST /pos/sales (items, payments, appointment)
    BE->>INV: Decrement stock for products
    BE-->>FE: Sale created (id, totals), fiscal status=pending

    BE->>FIS: async fiscalize(sale)
    FIS-->>BE: fiscal number, time (or error)
    BE-->>FE: Webhook/long-poll/refresh → update fiscal status
    FE->>PRN: Print receipt (fiscal number, QR)
    FE-->>U: Sale complete, appointment marked paid
```

## 2) Direct Sale (without appointment)
```mermaid
flowchart LR
    A[Open POS Checkout] --> B[Search/Add Services & Products]
    B --> C[Apply Discount / Tip]
    C --> D{Open CashSession?}
    D -- No --> E[Prompt to open session]
    E --> D
    D -- Yes --> F[Choose Payment(s)]
    F --> G[POST /pos/sales]
    G --> H[Update Inventory]
    H --> I[Queue Fiscalization]
    I --> J[Receipt Printed]
    J --> K[Done]
```

## 3) Refund (full or partial)
```mermaid
sequenceDiagram
    autonumber
    actor U as User (Manager/Cashier)
    participant FE as Frontend (Sales History)
    participant BE as Backend (POS API)
    participant INV as Inventory
    participant FIS as Fiscal Provider

    U->>FE: Open Sale details → Refund
    FE->>BE: GET /pos/sales/:id
    BE-->>FE: Sale details
    U->>FE: Select items/amount to refund
    FE->>BE: POST /pos/sales/:id/refund (partial/full)
    BE->>INV: Increment stock for returned items
    BE-->>FE: Refund sale created, status pending fiscal
    BE->>FIS: fiscalize(refund)
    FIS-->>BE: fiscal number or error
    BE-->>FE: Update status; FE shows success and prints refund receipt
```

## 4) Cash Session — Open / Close
```mermaid
flowchart TB
    A[Open Sessions Page] --> B{Session open for facility?}
    B -- No --> C[Open Session: openingFloat]
    C --> D[Session OPEN]
    B -- Yes --> D
    D --> E[Sales proceed]
    E --> F[Close Session: counted cash]
    F --> G[System computes expected vs counted]
    G --> H{Variance 0?}
    H -- No --> I[Show variance; require note]
    H -- Yes --> J[OK]
    I --> K[Close]
    J --> K[Close]
    K --> L[Z Report Generated]
```

## 5) Fiscalization Architecture (Adapter + Queue)
```mermaid
flowchart LR
    subgraph BE[Backend]
      API[POS API]
      Q[Job Queue]
      ADP[(FiscalProvider Interface)]
      NONE[NoneProvider]
      DEV[DeviceProvider]
      CLD[CloudProvider]
    end

    API -->|Create Sale| Q
    Q --> ADP
    ADP --> NONE
    ADP --> DEV
    ADP --> CLD

    DEV -->|Local Driver/SDK| PRN[Fiscal Printer]
    CLD -->|HTTPS| EXT[External Fiscal Service]
    NONE -->|No-op| LOG[Audit Log]

    EXT --> API
    PRN --> API

    API --> DB[(MongoDB)]
    API --> INV[Inventory]
```

## 6) Scenarios covered now (MVP)
- Appointment-based sale
- Direct sale (bez termina)
- Refund (full/partial)
- Cash session open/close, variance, Z-report
- Fiscalization pipeline with replaceable providers

## 7) Notes
- Tenant/Facility enforced from JWT + validation
- Multiple payment methods per sale; cash change handled
- Inventory sync on sale/refund
- Idempotent fiscalization via correlationId; retries on failure
- Printable receipt with tenant logo and fiscal number/QR
