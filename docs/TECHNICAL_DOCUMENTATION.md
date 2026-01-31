# MyInvoice — Technical Documentation

This document describes the current behavior of the MyInvoice application. It is the source of truth for refactoring, onboarding, and system evolution. No code changes are implied; the codebase is treated as authoritative.

**Architecture (client- and contract-centric):** Default home is **Clients**. From Clients → View → **Client Detail** (client info + contracts list, contract CRUD). From a contract → View → **Contract Detail** (contract info + invoices list, "Generate for Year", "Create Custom Invoice", Preview/PDF/Delete per invoice). **Invoices** (nav) is read-only: all invoices with search/filter/sort, Preview and PDF only; no generation or deletion there.

---

## 1. Feature Inventory

Features are grouped by domain.

### 1.1 Invoice Domain

| Feature | Purpose | Entry Point | Dependencies |
|--------|---------|-------------|---------------|
| Recurring invoice generation | Create 12 monthly invoices for one contract for a given year | Contract Detail → "Generate for Year" button | `generateInvoicesForYear(contractId, year)`, `invoiceService` |
| Custom invoice creation | Create a single invoice with multiple line items (optionally linked to contract) | Contract Detail → "Create Custom Invoice"; CreateInvoicePage form | Clients, contracts, `invoiceService`, `generateInvoiceNumber` |
| Invoice list (read-only) | View all recurring and custom invoices with search, filter, sort; grouped/tabbed by client or type | InvoicesPage (nav "Invoices") | `useInvoices`, `useClients`, `getInvoiceType` |
| Invoice preview | Open PDF in modal iframe | InvoicesPage or Contract Detail → "Preview" per row | Settings, client data, `generateInvoicePdf` |
| Invoice PDF download | Download invoice as PDF file | InvoicesPage or Contract Detail → "PDF" per row | Settings, client data, `generateInvoicePdf`, `formatFilename` |
| Invoice deletion | Remove an invoice from storage | Contract Detail → "Delete" per row (for that contract's invoices only) | `invoiceService.delete` |

### 1.2 Settings Domain

| Feature | Purpose | Entry Point | Dependencies |
|--------|---------|-------------|---------------|
| Freelancer information | Name, address, email used on PDFs | SettingsPage → Freelancer Information card | `useSettings`, `settingsService` |
| Bank details | Bank name, account holder, number, SWIFT, country, currency for remittance | SettingsPage → Bank Details card | `useSettings`, `settingsService` |
| PDF filename template | Token-based template for downloaded PDF filenames | SettingsPage → PDF Filename Template input | `useSettings`, `formatFilename` tokens |
| Invoice template selection | Choose PDF visual style (Modern Clean, Colorful Minimal, Professional) | SettingsPage → Invoice Template cards | `useSettings`, PDF template registry |

### 1.3 User Data Domain

| Feature | Purpose | Entry Point | Dependencies |
|--------|---------|-------------|---------------|
| Clients list (home) | Grid of client cards with search and sort; View → Client Detail | ClientsPage (default page) | `useClients`, `useContracts`, `clientService` |
| Client Detail | Show client info; list contracts for client; add/edit/delete contract; View → Contract Detail | ClientDetailPage (route `client-detail`) | `useClient`, `contractService` |
| Contracts list | Table of all contracts; View → Contract Detail | ContractsPage | `useContracts`, `useClients`, `contractService` |
| Contract Detail | Show contract info; list invoices for contract; Generate for Year; Create Custom Invoice; Preview/PDF/Delete per invoice | ContractDetailPage (route `contract-detail`) | `useContract`, `useInvoices`, `useClients`, `useSettings`, `generateInvoicesForYear`, `generateInvoicePdf`, `invoiceService` |
| Settings singleton | Single settings record; create/update | SettingsPage, app init | `useSettings`, `settingsService`, `initializeDefaultSettings` |

### 1.4 PDF / Output Domain

| Feature | Purpose | Entry Point | Dependencies |
|--------|---------|-------------|---------------|
| Template-based PDF generation | Render invoice PDF using selected template | `generateInvoicePdf()` (from InvoicesPage, InvoiceTemplateCard) | Template registry, `buildContext`, `contractService` |
| Filename formatting | Produce safe filename from template and invoice/client/settings | `formatFilename()` inside `generateInvoicePdf` | Tokens: `{freelancer}`, `{client}`, `{month}`, `{monthPad}`, `{year}`, `{yyyymm}` |

### 1.5 Backup Domain

| Feature | Purpose | Entry Point | Dependencies |
|--------|---------|-------------|---------------|
| Export data | Download clients, contracts, invoices, settings as JSON | BackupPage → "Export Data" | `exportData`, all storage services |
| Import data | Replace all DB data from JSON; reload page | BackupPage → file input (accept .json) | `importData`, DB transaction clear + bulk add |

### 1.6 Onboarding Domain

| Feature | Purpose | Entry Point | Dependencies |
|--------|---------|-------------|---------------|
| Tutorial | Modal walkthrough (6 steps); auto-shows on first visit | Nav bar (?) icon; `useTutorial` auto-show if not completed | `Tutorial`, `localStorage` key `tutorial_completed` |
| Coachmark | Guided tour with spotlight; 17 steps; navigates to target page per step | Nav bar (target) icon → "Start Guided Tour" | `CoachmarkProvider`, `coachmarkSteps`, `data-coachmark` targets |
| Privacy modal | Informational content (local-only data, no server) | Nav → "Privacy" | `PrivacyContent` in `Modal` |

---

## 2. Feature Flow Documentation

### 2.1 Recurring Invoice Generation

**Entry point:** Contract Detail page, button "Generate for Year" (and `data-coachmark="generate-invoices-btn"`).

**Flow:**

1. User opens a contract (Clients → View client → View contract) and clicks "Generate for Year".
2. `confirm()` asks: "Generate recurring invoices for {current year}? Existing invoices for this contract will be updated if data changed."
3. On confirm: `generateInvoicesForYear(contractId, year)` is called (`src/services/invoiceService.ts`).
4. **generateInvoicesForYear(contractId, year):**
   - Load contract via `contractService.getById(contractId)`. If missing, throw "Contract not found."
   - Load existing invoices for this contract: `invoiceService.getByContractId(contractId)`.
   - For each month index `0..11`:
     - **Issue date:** `new Date(year, month, 0)` → last day of the *previous* month. Formatted as `YYYY-MM-DD` in local timezone.
     - **Due date:** If `dueDateMethod === 'endOfNextMonth'`: last day of current month. Else: issue date + `dueDays` (default 30). Formatted same way.
     - **Total:** `contract.unitPrice * contract.quantity`.
     - **Match existing:** `existingInvoices.find(inv => inv.issueDate === issueDateStr)` (match by `contractId` + `issueDate`).
     - If found: if `total` or `dueDate` changed, `invoiceService.update(id, { dueDate, total, invoiceType: 'recurring', contractId })`; count updated/skipped.
     - If not found: create with `generateInvoiceNumber(issueDate)`, `clientId` from contract, `issueDate`, `dueDate`, `total`, `createdAt`, `invoiceType: 'recurring'`, `contractId`.
5. Alert summarizes created / updated / skipped; invoice list refreshes.
6. **Side effects:** IndexedDB `invoices` table: new or updated records.

**Note:** Matching is by `contractId` + `issueDate`. Multiple contracts per client each get their own 12 invoices per year.

### 2.2 Custom Invoice Creation

**Entry point:** Contract Detail → "Create Custom Invoice" (navigates to create-invoice with `clientId` and `contractId` in context); CreateInvoicePage form. Client and currency can be pre-filled from the contract.

**Flow:**

1. User may arrive with optional `initialClientId` and `initialContractId` (from navigation context). Form pre-fills client and currency from contract when present.
2. User selects/confirms client, issue date, due date, currency; adds one or more items (description, quantity, unit price).
3. "Create Invoice" submit → `validateForm()`:
   - Required: client, issue date, due date, at least one item; each item: non-empty description, quantity > 0, unit price > 0.
   - Errors stored in local state and shown inline.
4. If valid:
   - `total = sum(item.quantity * item.unitPrice)`.
   - `invoiceNumber = generateInvoiceNumber(new Date(issueDate))` → `INV-YYYY-MM-{timestamp}`.
   - `invoiceService.create({ invoiceNumber, clientId, issueDate, dueDate, total, createdAt, items, currency, invoiceType: 'custom', contractId: linkedContractId ?? null })`.
   - Form reset; alert "Invoice {invoiceNumber} created successfully!"; navigate back to contract-detail if came from contract, else to invoices.
5. **Side effects:** IndexedDB `invoices` table: one new record with `items`, `currency`, `invoiceType: 'custom'`, and optional `contractId`.

### 2.3 Invoice Preview and PDF Download

**Entry point:** InvoicesPage or Contract Detail, per-row "Preview" and "PDF".

**Flow (shared until PDF bytes):**

1. If no `settings`: alert "Please configure settings first"; return.
2. `invoiceService.getById(invoiceId)`; if missing, alert "Invoice not found".
3. Resolve client: `clients.find(c => c.id === invoice.clientId)`; if missing, alert "Client data not found".
4. `generateInvoicePdf(invoice, clientData, settings)` → `{ pdfBytes, filename }`.

**Preview:** Create blob from `pdfBytes`, `URL.createObjectURL`, set in state; modal shows iframe with that URL. On close, `URL.revokeObjectURL(previewUrl)`.

**Download:** Create blob, temporary `<a href=url download=filename>`, programmatic click, remove node, revoke URL.

**Side effects:** No persistence; optional browser download.

### 2.4 PDF Generation (generateInvoicePdf)

**Entry:** `generateInvoicePdf(invoice, client, settings, templateIdOverride?)` in `src/pdf/invoicePdf.ts`.

**Flow:**

1. **Template resolution:** `templateId = templateIdOverride ?? resolveTemplateId(settings.invoiceTemplate)`. Default template: `modern_clean`. Invalid/undefined → `DEFAULT_TEMPLATE`.
2. **Context build:** `buildContext(doc, page, invoice, client, settings)`:
   - `contractService.getByClientId(invoice.clientId)` → first contract or null.
   - `hasCustomItems = !!(invoice.items && invoice.items.length > 0)`.
   - `currency = invoice.currency || contract?.currency || 'JPY'`.
   - `itemsToRender = hasCustomItems ? invoice.items : []`.
   - Payment terms text from contract (`dueDateMethod` / `dueDays`) or default "30 days".
   - `invoiceNumText`: from `invoice.invoiceNumber` → `[MM-YYYY-{last 4 of timestamp}]`.
   - Embed Helvetica + HelveticaBold; return `PdfRenderContext`.
3. **Render:** `INVOICE_TEMPLATES[templateId].render(ctx)` draws the PDF (sender, dates, bill-to, table, amount due, remittance, payment terms, footer).
4. **Filename:** `formatFilename(settings.filenameTemplate, invoice, client, settings)` (see Settings & Configuration).
5. Return `{ pdfBytes: await doc.save(), filename }`.

**Side effects:** None to DB; returns bytes and filename for caller to use.

### 2.5 Settings Load and Save

**Entry point:** SettingsPage (nav "Settings").

**Load:**

- `useSettings()` → `liveQuery(() => settingsService.get())`. `settingsService.get()` returns first record from `db.settings` or null.
- When settings load, `useEffect` sets local `formData` from `settings` (including `invoiceTemplate`).

**Save:**

- Submit → if existing settings: `settingsService.update(formData)`; else `settingsService.set(formData)`.
- `update`: get first record; if exists update by id; else add with defaults (`bankCurrency: 'JPY'`, `filenameTemplate: 'invoice-{yyyymm}.pdf'`, etc.) merged with `formData`.
- `set`: same get-first; update by id or add.
- Success: set "Settings saved!"; clear after 3s.

**Side effects:** IndexedDB `settings` table (singleton semantics).

### 2.6 Backup Export and Import

**Export:**

- BackupPage → "Export Data". `exportData()` reads all clients, contracts, invoices, settings via respective services; builds `{ clients, contracts, invoices, settings }`; `JSON.stringify(data, null, 2)`.
- Blob download: `invoice-backup-{YYYY-MM-DD}.json`.

**Import:**

- User selects .json file. `importData(text)`:
  - `JSON.parse(text)`; on failure throw "Invalid JSON format".
  - Require `data.clients`, `data.contracts`, `data.invoices` to be arrays; else "Invalid backup data structure".
  - Dexie transaction (readwrite): `db.clients.clear()`, `db.contracts.clear()`, `db.invoices.clear()`, `db.settings.clear()`.
  - Then `bulkAdd` for each non-empty array; if `data.settings` present, `db.settings.add(data.settings)`.
  - On success: set message "Data imported successfully! Please refresh the page."; after 2s `window.location.reload()`.

**Side effects:** Export none; import replaces all stored data and reloads the app.

### 2.7 Clients and Contracts CRUD

**Clients:** ClientsPage. Add (form) → `clientService.create(formData)` (uuid for id). Edit row → load into form → `clientService.update(id, formData)`. Delete → confirm → `clientService.delete(id)`. All via Dexie.

**Contracts:** ContractsPage. Same pattern with `contractService`. Form includes client select, description template (`{{month}}`/`{{year}}`), unit price, currency, quantity, due date method (days vs endOfNextMonth), and if days then due days. Defaults: `dueDateMethod: 'days'`, `dueDays: 30`.

---

## 3. Data Model and State Flow

### 3.1 Domain Types (src/domain/types.ts)

- **UUID:** string (used as id for client, contract, invoice).
- **Client:** `id`, `companyName`, `address`, `email`.
- **Contract:** `id`, `clientId`, `descriptionTemplate`, `unitPrice`, `currency`, `quantity`, `dueDays`, `dueDateMethod` (`'days' | 'endOfNextMonth'`).
- **InvoiceItem:** `description`, `quantity`, `unitPrice`.
- **Invoice:** `id`, `invoiceNumber`, `clientId`, `issueDate`, `dueDate`, `total`, `createdAt`; optional `items?`, `currency?`, `invoiceType?` (`'recurring' | 'custom'`), `contractId?` (string | null). Recurring invoices MUST have `contractId`; custom MAY have it.
- **Settings:** `freelancerName`, `address`, `email`, `bankName`, `accountHolder`, `accountNumber`, `swift`, `bankCountry`, `bankCurrency`, `filenameTemplate`, optional `invoiceTemplate?` (`InvoiceTemplateId`).
- **InvoiceTemplateId:** `'modern_clean' | 'colorful_minimal' | 'professional'`.

**Helper:** `generateInvoiceNumber(issueDate: Date)` → `INV-YYYY-MM-{Date.now()}`.

**Compatibility:** `getInvoiceType(inv)` in `src/utils/invoiceCompat.ts`: returns `inv.invoiceType` when present, else infers from `inv.items` (custom if has items, else recurring). Legacy invoices without `contractId`/`invoiceType` still display and generate PDFs; contract for PDF is resolved via `invoice.contractId` when set, else `contractService.getByClientId(invoice.clientId)[0]`.

### 3.2 Persistence (src/storage/database.ts)

- **Database name:** `InvoiceDB` (Dexie). Schema version 2.
- **Tables:**
  - `clients`: stores `Client`; keyPath `id`; index `companyName`.
  - `contracts`: stores `Contract`; keyPath `id`; index `clientId`.
  - `invoices`: stores `Invoice`; keyPath `id`; indexes `invoiceNumber`, `clientId`, `issueDate`, `contractId`. List query: `orderBy('issueDate').reverse()`. `invoiceService.getByContractId(contractId)` uses `contractId` index.
  - `settings`: singleton-style; keyPath `++id` (auto-increment). Only first record is used.

### 3.3 Where Data Originates and Is Persisted

| Data | Origin | Persisted |
|------|--------|-----------|
| Clients | User input (ClientsPage) | `db.clients` |
| Contracts | User input (ContractsPage) | `db.contracts` |
| Recurring invoices | `generateInvoicesForYear` | `db.invoices` |
| Custom invoices | CreateInvoicePage form | `db.invoices` |
| Settings | SettingsPage + `initializeDefaultSettings` on first load | `db.settings` |

### 3.4 Required vs Optional Fields

- **Client:** All fields required for create (id generated).
- **Contract:** All required; `dueDateMethod` defaulted to `'days'`, `dueDays` to 30 in UI and generation.
- **Invoice (recurring):** No `items`; `currency` optional (resolved from contract or JPY in PDF).
- **Invoice (custom):** `items` and `currency` set; rest required.
- **Settings:** All main fields present; `invoiceTemplate` optional (default `modern_clean`). Empty strings allowed for many fields; PDF omits empty bank/sender lines as applicable.

### 3.5 State Flow (UI)

- No global app store. Each feature uses hooks that call storage services.
- **Reactivity:** `useClients`, `useContracts`, `useInvoices`, `useSettings` use Dexie `liveQuery()` so list/settings updates propagate to UI. Detail pages use `useClient(clientId)` and `useContract(contractId)` for single-entity loading.
- **Navigation:** Single source of truth in App: `currentPage` (default `'clients'`), `contextClientId`, `contextContractId`. Navigation uses `handleNavigate(page, clientId?, contractId?)`; the `navigate` event supports `detail: { page, clientId?, contractId? }`. Routes: `clients`, `client-detail`, `contracts`, `contract-detail`, `invoices`, `create-invoice`, `settings`, `backup`. Client Detail and Contract Detail receive context so the correct client/contract is shown.

---

## 4. PDF / Output Generation Flow

### 4.1 Template Logic

- **Registry:** `src/pdf/templates/registry.ts` exports `INVOICE_TEMPLATES` (id → `{ id, label, render }`) and `resolveTemplateId(value)`. Default: `modern_clean`.
- **Context:** `buildContext()` in `src/pdf/invoicePdf.ts` produces `PdfRenderContext`: doc, page, invoice, client, settings, fonts, dimensions, contract (or null), currency, itemsToRender, hasCustomItems, paymentTerms, invoiceNumText.
- **Render:** Each template's `render(ctx)` draws one A4 page (sender, invoice title/dates, bill-to, table, amount due, remittance, payment terms, footer). Layout and colors differ (e.g. colorful_minimal uses pastel palette).

### 4.2 Styling Logic

- Templates use `pdf-lib` (Helvetica/HelveticaBold, rgb colors). Fixed layout constants (e.g. `MARGIN = 50`, table row count `numDataRows = 7`, column widths). Long descriptions truncated with `...` when exceeding available width.

### 4.3 File Naming Logic (src/pdf/filenameFormatter.ts)

- **Input:** `template` string, `invoice`, `client`, `settings`.
- **Tokens replaced:** `{freelancer}`, `{client}`, `{month}`, `{monthPad}`, `{year}`, `{yyyymm}` (year + zero-padded month). If template empty/whitespace, fallback: `invoice-{year}{month}.pdf`.
- **Sanitization:** `[\\/:*?"<>|]` → `-`.
- **Extension:** If result does not end with `.pdf`, append `.pdf`.

### 4.4 Export Process

- PDF export is in-memory only: `doc.save()` → `Uint8Array`. Caller (InvoicesPage or InvoiceTemplateCard) creates a Blob and either sets a preview URL or triggers a download with the formatted filename.

---

## 5. Settings & Configuration Flow

### 5.1 Storage and Read

- Settings stored in Dexie table `settings` (auto-increment id). Only the first record is used: `settingsService.get()` returns `db.settings.toCollection().first()`.
- **Initialization:** On app load, `main.tsx` runs `db.open().then(() => initializeDefaultSettings())`. `initializeDefaultSettings()` calls `settingsService.get()`; if null, adds one record with defaults (including `invoiceTemplate: 'modern_clean'`).

### 5.2 How Settings Influence Behavior

- **PDF content:** Freelancer name, address, email; bank details; bank currency; payment terms and contact sentence.
- **PDF template:** `settings.invoiceTemplate` (or override in template picker preview).
- **Filename:** `settings.filenameTemplate` passed to `formatFilename`.
- **InvoicesPage:** Preview and PDF buttons are disabled when `!settings`; alert "Please configure settings first" if user triggers without settings.

---

## 6. Error Handling and Fallbacks

### 6.1 Known Failure Points

- **Recurring generation:** No contracts → throw; alert shows message.
- **Preview/Download:** No settings → alert. Missing invoice or client → alert.
- **Create invoice:** Validation errors shown inline; submit blocked until valid.
- **Backup import:** Invalid JSON or missing arrays → throw with message. Success → reload.
- **Template preview (Settings):** `InvoiceTemplateCard` calls `generateInvoicePdf` with sample data; on error sets "Preview unavailable".

### 6.2 Defaults and Fallbacks

- **Template id:** `resolveTemplateId(undefined)` → `DEFAULT_TEMPLATE` (`modern_clean`).
- **Filename template:** Empty/blank → `invoice-{year}{month}.pdf` (with `.pdf` and sanitization).
- **Currency:** Invoice → contract → `'JPY'`.
- **Contract:** `dueDateMethod` default `'days'`, `dueDays` default 30 in generation and UI.
- **Settings singleton:** First-time create uses defaults in `initializeDefaultSettings` and in `settingsService.update` when no record exists.

### 6.3 Missing or Invalid Data

- **Client missing for invoice:** Alert "Client data not found"; no PDF.
- **Contract missing for recurring-style PDF:** Table row still rendered using contract from first match; if no contract, payment terms use default 30 days; currency from invoice or JPY.
- **Empty optional settings fields:** Omitted or not drawn in PDF (e.g. bank lines only if value present).

---

## 7. Technical Boundaries

### 7.1 Tightly Coupled Areas

- **invoicePdf** (`buildContext`) resolves contract via `invoice.contractId` when set (else `contractService.getByClientId(invoice.clientId)[0]`); uses `invoiceType` or items for `hasCustomItems`. Any change to contract shape or lookup affects PDF.
- **generateInvoicesForYear(contractId, year)** depends on `contractService.getById`, `invoiceService.getByContractId`, and `invoiceService` create/update; matching is by `contractId` + `issueDate`.
- **ContractDetailPage** depends on `useContract`, `useInvoices`, `useClients`, `useSettings`, `generateInvoicesForYear`, `generateInvoicePdf`, `invoiceService`; it is the main place for invoice generation and deletion. **InvoicesPage** is read-only and depends on `useInvoices`, `useClients`, `useSettings`, `generateInvoicePdf`, `getInvoiceType`.

### 7.2 Safe to Refactor Independently

- **ClientsPage / ContractsPage / SettingsPage:** Each uses its own hook and service; no PDF or invoice generation.
- **PDF templates:** Depend only on `PdfRenderContext`; can be added or restyled without touching invoice/contract logic.
- **Backup service:** Uses all services but as a clear import/export layer; format is documented (clients, contracts, invoices, settings arrays and optional settings object).
- **Tutorial and Privacy:** Presentational and localStorage only; no DB or PDF.

### 7.3 Implicit Assumptions

- Recurring invoices are matched by `contractId` + `issueDate`; each contract has at most one invoice per month. Multiple contracts per client each have their own invoices.
- Invoice type is explicit (`invoiceType`) when set; legacy data uses `getInvoiceType(inv)` (inference from `items`).
- Invoice numbers are unique by construction (`timestamp`); no explicit uniqueness check in DB.
- Settings are effectively a singleton; multi-user or multi-tenant not considered.
- All dates in generation use local timezone formatting for consistency with display.

---

## 8. Non-Obvious Behavior

### 8.1 Coachmark vs App State

Navigation state lives in App (`currentPage`, `contextClientId`, `contextContractId`). CoachmarkProvider receives `currentPage` and `onNavigate` from App; AppContent receives the same state and `onNavigate`. When the coachmark calls `onNavigate(targetPage)`, App updates state and AppContent re-renders with the new page, so the visible page and coachmark stay in sync.

### 8.2 Coachmark Target invoice-table

The coachmark step with id `invoice-table` uses `targetSelector: 'invoice-table'`. InvoicesPage tables pass `data-coachmark="invoice-table"` to the Table component, so the step can highlight the invoice table when on the Invoices page.

### 8.3 Recurring Invoice Matching

Recurring invoices are matched by `contractId` + `issueDate`. Each contract gets up to 12 invoices per year (one per month). Multiple contracts per client each have their own set of invoices; no overwriting.

### 8.4 Custom vs Recurring Classification

- **Explicit:** When `inv.invoiceType` is set, use it (`'recurring' | 'custom'`).
- **Legacy inference:** `getInvoiceType(inv)` returns `inv.invoiceType` if present; else custom if `inv.items && inv.items.length > 0`, else recurring.

Recurring list on InvoicesPage is grouped by client (tabs); custom list is a single table. Filters and sort apply separately to the selected recurring list and to the custom list.

### 8.5 Navigation Mechanism

The app does not use React Router. Navigation is state-based in App: `currentPage`, `contextClientId`, `contextContractId`. `window.dispatchEvent(new CustomEvent('navigate', { detail: { page, clientId?, contractId? } }))` with a listener that calls `handleNavigate(page, clientId, contractId)`. CreateInvoicePage navigates back to contract-detail (with contractId) when created from a contract, else to invoices.

### 8.6 Magic Values

- **PDF:** `A4_WIDTH = 595.28`, `A4_HEIGHT = 841.89`, `MARGIN = 50`. Table: `numDataRows = 7`, fixed column widths and row heights.
- **Invoice number display:** Last 4 digits of the timestamp part of `INV-YYYY-MM-{timestamp}` used in PDF as `[MM-YYYY-xxxx]`.

### 8.7 Description Truncation

In PDF templates, long item descriptions are truncated: when rendered width exceeds `maxDescWidth`, the string is shortened character-by-character and `...` is appended. No wrapping to multiple lines.

---

*This document reflects the codebase as of the last review. For refactors, use it to identify dependencies and risk areas before making changes.*
