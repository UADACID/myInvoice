# MyInvoice — Technical Documentation

This document describes the current behavior of the MyInvoice application. It is the source of truth for refactoring, onboarding, and system evolution. No code changes are implied; the codebase is treated as authoritative.

---

## 1. Feature Inventory

Features are grouped by domain.

### 1.1 Invoice Domain

| Feature | Purpose | Entry Point | Dependencies |
|--------|---------|-------------|---------------|
| Recurring invoice generation | Create 12 monthly invoices per contract for a given year | InvoicesPage → "Generate for Year" button | Contracts, `generateInvoicesForYear`, `invoiceService` |
| Custom invoice creation | Create a single invoice with multiple line items | InvoicesPage → "+ Create Custom Invoice" or nav; CreateInvoicePage form | Clients, `invoiceService`, `generateInvoiceNumber` |
| Invoice list | View recurring and custom invoices with search, filter, sort | InvoicesPage (default page) | `useInvoices`, `useClients` |
| Invoice preview | Open PDF in modal iframe | InvoicesPage → "Preview" per row | Settings, client data, `generateInvoicePdf` |
| Invoice PDF download | Download invoice as PDF file | InvoicesPage → "PDF" per row | Settings, client data, `generateInvoicePdf`, `formatFilename` |
| Invoice deletion | Remove an invoice from storage | InvoicesPage → "Delete" per row | `invoiceService.delete` |

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
| Clients CRUD | Create, read, update, delete clients | ClientsPage | `useClients`, `clientService` |
| Contracts CRUD | Create, read, update, delete contracts (description template, unit price, currency, quantity, due date method) | ContractsPage | `useContracts`, `useClients`, `contractService` |
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

**Entry point:** InvoicesPage, button "Generate for Year" (and `data-coachmark="generate-invoices-btn"`).

**Flow:**

1. User clicks "Generate for Year".
2. `confirm()` asks: "Generate invoices for {current year}? Existing invoices will be updated if contract data has changed."
3. On confirm: `generateInvoicesForYear(year)` is called (`src/services/invoiceService.ts`).
4. **generateInvoicesForYear:**
   - Load all contracts via `contractService.getAll()`. If none, throw: "No contracts found. Please create a contract first."
   - For each contract, for each month index `0..11`:
     - **Issue date:** `new Date(year, month, 0)` → last day of the *previous* month (e.g. month 1 → Jan 31). Formatted as `YYYY-MM-DD` in local timezone.
     - **Due date:** If `dueDateMethod === 'endOfNextMonth'`: last day of current month (`new Date(year, month + 1, 0)`). Else: issue date + `dueDays` (default 30). Formatted same way.
     - **Total:** `contract.unitPrice * contract.quantity`.
     - **Match existing:** `invoiceService.getByClientId(contract.clientId)` then `.find(inv => inv.issueDate === issueDateStr)`.
     - If found: if `total` or `dueDate` changed, `invoiceService.update(id, { dueDate, total })`; count updated/skipped.
     - If not found: create with `generateInvoiceNumber(issueDate)`, `clientId`, `issueDate`, `dueDate`, `total`, `createdAt`; no `items` (recurring).
5. Alert summarizes created / updated / skipped; `refreshInvoices()` runs.
6. **Side effects:** IndexedDB `invoices` table: new or updated records.

**Note:** Matching is by `clientId` + `issueDate` only. If a client has multiple contracts, each contract produces one invoice per month for that client; the last contract processed for that client+month overwrites the previous one. (See Non-Obvious Behavior.)

### 2.2 Custom Invoice Creation

**Entry point:** InvoicesPage → "+ Create Custom Invoice" (navigates to create-invoice) or nav "Create Invoice"; CreateInvoicePage form.

**Flow:**

1. User selects client, issue date, due date, currency; adds one or more items (description, quantity, unit price).
2. "Create Invoice" submit → `validateForm()`:
   - Required: client, issue date, due date, at least one item; each item: non-empty description, quantity > 0, unit price > 0.
   - Errors stored in local state and shown inline.
3. If valid:
   - `total = sum(item.quantity * item.unitPrice)`.
   - `invoiceNumber = generateInvoiceNumber(new Date(issueDate))` → `INV-YYYY-MM-{timestamp}`.
   - `invoiceService.create({ invoiceNumber, clientId, issueDate, dueDate, total, createdAt, items, currency })`.
   - Form reset; alert "Invoice {invoiceNumber} created successfully!"; `window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'invoices' } }))`.
4. **Side effects:** IndexedDB `invoices` table: one new record with `items` and optional `currency`.

### 2.3 Invoice Preview and PDF Download

**Entry point:** InvoicesPage, per-row "Preview" and "PDF".

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
- **Invoice:** `id`, `invoiceNumber`, `clientId`, `issueDate`, `dueDate`, `total`, `createdAt`; optional `items?`, `currency?`.
- **Settings:** `freelancerName`, `address`, `email`, `bankName`, `accountHolder`, `accountNumber`, `swift`, `bankCountry`, `bankCurrency`, `filenameTemplate`, optional `invoiceTemplate?` (`InvoiceTemplateId`).
- **InvoiceTemplateId:** `'modern_clean' | 'colorful_minimal' | 'professional'`.

**Helper:** `generateInvoiceNumber(issueDate: Date)` → `INV-YYYY-MM-{Date.now()}`.

### 3.2 Persistence (src/storage/database.ts)

- **Database name:** `InvoiceDB` (Dexie).
- **Tables:**
  - `clients`: stores `Client`; keyPath `id`; index `companyName`.
  - `contracts`: stores `Contract`; keyPath `id`; index `clientId`.
  - `invoices`: stores `Invoice`; keyPath `id`; indexes `invoiceNumber`, `clientId`, `issueDate`. List query: `orderBy('issueDate').reverse()`.
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
- **Reactivity:** `useClients`, `useContracts`, `useInvoices`, `useSettings` use Dexie `liveQuery()` so list/settings updates propagate to UI.
- **Navigation:** In-app navigation is React state (`currentPage`) in App/AppContent; cross-component navigation uses `window.dispatchEvent(new CustomEvent('navigate', { detail: { page } }))` and a listener in AppContent that sets its page state.

---

## 4. PDF / Output Generation Flow

### 4.1 Template Logic

- **Registry:** `src/pdf/templates/registry.ts` exports `INVOICE_TEMPLATES` (id → `{ id, label, render }`) and `resolveTemplateId(value)`. Default: `modern_clean`.
- **Context:** `buildContext()` in `src/pdf/invoicePdf.ts` produces `PdfRenderContext`: doc, page, invoice, client, settings, fonts, dimensions, contract (or null), currency, itemsToRender, hasCustomItems, paymentTerms, invoiceNumText.
- **Render:** Each template’s `render(ctx)` draws one A4 page (sender, invoice title/dates, bill-to, table, amount due, remittance, payment terms, footer). Layout and colors differ (e.g. colorful_minimal uses pastel palette).

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

- **invoicePdf** depends on `contractService.getByClientId` for currency and description (and payment terms). Any change to contract shape or lookup affects PDF.
- **generateInvoicesForYear** depends on both `contractService` and `invoiceService`; matching and update logic is in one place.
- **InvoicesPage** depends on `useInvoices`, `useClients`, `useSettings`, `invoiceService`, `generateInvoicesForYear`, `generateInvoicePdf`; it is the most coupled screen.

### 7.2 Safe to Refactor Independently

- **ClientsPage / ContractsPage / SettingsPage:** Each uses its own hook and service; no PDF or invoice generation.
- **PDF templates:** Depend only on `PdfRenderContext`; can be added or restyled without touching invoice/contract logic.
- **Backup service:** Uses all services but as a clear import/export layer; format is documented (clients, contracts, invoices, settings arrays and optional settings object).
- **Tutorial and Privacy:** Presentational and localStorage only; no DB or PDF.

### 7.3 Implicit Assumptions

- Recurring invoices assume at most one invoice per client per issue date when matching; multiple contracts per client can overwrite (see Non-Obvious Behavior).
- Invoice numbers are unique by construction (`timestamp`); no explicit uniqueness check in DB.
- Settings are effectively a singleton; multi-user or multi-tenant not considered.
- All dates in generation use local timezone formatting for consistency with display.

---

## 8. Non-Obvious Behavior

### 8.1 Coachmark vs AppContent State

CoachmarkProvider receives `currentPage` and `onNavigate` from the outer App component. AppContent maintains its own `currentPage` state for rendering. When the coachmark tour calls `onNavigate(targetPage)`, only the outer App’s state updates; AppContent’s state is not updated by that call. **Unclear / Needs Verification:** Whether the visible page actually changes during the guided tour when a step has a different `targetPage`.

### 8.2 Missing Coachmark Target

The coachmark step with id `invoice-table` uses `targetSelector: 'invoice-table'`. No element in InvoicesPage has `data-coachmark="invoice-table"`. The Table component can accept `data-coachmark` but it is not set for the invoice tables. This step will not highlight any element.

### 8.3 Recurring Invoice Matching

Recurring invoices are matched by `clientId` + `issueDate` only. If a client has multiple contracts, the loop creates/updates one invoice per contract per month for that client. The last contract processed for that client+month overwrites the existing invoice (same client, same issue date). So only one recurring invoice per client per month is effectively kept; the second contract’s data wins.

### 8.4 Custom vs Recurring Classification

- **Custom:** `inv.items && inv.items.length > 0`.
- **Recurring:** `!inv.items || inv.items.length === 0`.

Recurring list is grouped by client (tabs); custom list is a single table. Filters and sort apply separately to the selected recurring project list and to the custom list.

### 8.5 Navigation Mechanism

The app does not use React Router. Navigation is state-based: `currentPage` in AppContent, and `window.dispatchEvent(new CustomEvent('navigate', { detail: { page } }))` with a listener that calls `setCurrentPage(page)`. CreateInvoicePage uses this event to return to the invoices list.

### 8.6 Magic Values

- **PDF:** `A4_WIDTH = 595.28`, `A4_HEIGHT = 841.89`, `MARGIN = 50`. Table: `numDataRows = 7`, fixed column widths and row heights.
- **Invoice number display:** Last 4 digits of the timestamp part of `INV-YYYY-MM-{timestamp}` used in PDF as `[MM-YYYY-xxxx]`.

### 8.7 Description Truncation

In PDF templates, long item descriptions are truncated: when rendered width exceeds `maxDescWidth`, the string is shortened character-by-character and `...` is appended. No wrapping to multiple lines.

---

*This document reflects the codebase as of the last review. For refactors, use it to identify dependencies and risk areas before making changes.*
