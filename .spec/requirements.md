# MicroBiz Toolbox — Requirements

## User Stories & Acceptance Criteria (EARS Format)

---

### AUTH-1: User Registration & Login
**As a** freelancer,
**I want to** register and log in securely,
**So that** my data is private and persistent.

**AC:**
- WHEN a user submits valid email + password, THEN a Supabase account is created and they are redirected to the dashboard
- WHEN a user submits invalid credentials, THEN an error message is shown with no redirect
- WHEN a logged-in user refreshes the page, THEN their session persists
- WHILE unauthenticated, all dashboard routes redirect to /login
- Row Level Security ensures users can only access their own data

---

### DASH-1: Dashboard Control Center
**As a** freelancer,
**I want to** see my priorities and pipeline in one glance,
**So that** I know what to do next within 5 seconds of opening the app.

**AC:**
- WHEN the dashboard loads, THEN it shows: follow-ups due today, tasks due today, overdue payments
- WHEN the dashboard loads, THEN it shows a pipeline count: Leads / Active / Closed
- WHEN the dashboard loads, THEN it shows: this month's earned total and pending total
- WHEN a user clicks "Add Lead", THEN a quick-add modal opens with 4 fields (name, contact, service, value)
- WHEN a user clicks "Send Proposal" or "Create Invoice", THEN they are navigated to the relevant new form
- IF there are no items in a section, THEN a friendly empty state is shown

---

### LEAD-1: Add Lead
**As a** freelancer,
**I want to** add a new lead in under 5 seconds,
**So that** I never lose a potential client to friction.

**AC:**
- WHEN a user submits the lead form (name + contact required, service + value optional), THEN the lead is saved and appears in the leads list
- WHEN name or contact is missing, THEN the form shows validation errors and does not submit
- WHEN a lead is created, THEN a follow-up reminder is automatically created for 2 days later

---

### LEAD-2: Convert Lead to Client
**As a** freelancer,
**I want to** convert a lead to a client with one click,
**So that** the transition is seamless with no data re-entry.

**AC:**
- WHEN a user clicks "Convert to Client" on a lead, THEN the lead record is promoted to a client and the lead status changes to "Converted"
- WHEN converted, THEN all existing notes, contact info, and follow-ups are preserved on the client profile
- WHEN converted, THEN the lead no longer appears in the active leads list

---

### CLIENT-1: Client Profile Page
**As a** freelancer,
**I want to** see a complete picture of a client on one page,
**So that** I never need to search multiple places.

**AC:**
- WHEN a client profile loads, THEN it shows: contact info, active deals, proposals, invoices, payment status, notes, activity timeline
- WHEN total payments exceed a threshold, THEN a "client value" total is displayed
- WHEN last contact was >30 days ago, THEN a "cold client" flag is shown
- WHEN a new note is added, THEN it appears in the activity timeline with a timestamp

---

### FOLLOW-1: Follow-Up Queue
**As a** freelancer,
**I want to** see who I need to follow up with today,
**So that** no lead or client goes cold.

**AC:**
- WHEN the follow-ups page loads, THEN items are sorted by urgency: overdue first, then due today, then upcoming
- WHEN a follow-up is marked as "Replied", THEN it is removed from the active queue
- WHEN a follow-up is marked as "Ghosted", THEN it is flagged and moved to a separate view
- WHEN a user clicks "Follow Up", THEN they can select a snippet and send/copy the message in one action
- WHEN a proposal is sent, THEN a follow-up is automatically created for 3 days later

---

### PROP-1: Create Proposal
**As a** freelancer,
**I want to** build a structured proposal from a template,
**So that** I close deals faster with consistent messaging.

**AC:**
- WHEN creating a proposal, THEN the builder has sections: Problem, Solution, Scope, Timeline, Pricing
- WHEN a proposal is saved, THEN it is linked to a client
- WHEN a proposal is saved, THEN the user can download it as PDF or copy a share link
- WHEN a client opens the share link, THEN the proposal view event is recorded
- WHEN a client clicks "Accept", THEN the proposal status changes to "Accepted" and a deal is created

---

### PROP-2: Proposal Templates
**As a** freelancer,
**I want to** start a proposal from a saved template,
**So that** I don't write from scratch every time.

**AC:**
- WHEN creating a proposal, THEN the user can select from saved templates filtered by service type
- WHEN a template is selected, THEN its content pre-fills the proposal builder
- WHEN a user saves a proposal as a template, THEN it appears in the template list

---

### INV-1: Create Invoice
**As a** freelancer,
**I want to** create and send an invoice quickly,
**So that** I get paid without administrative delay.

**AC:**
- WHEN creating an invoice, THEN the user can add line items with name, quantity, unit price
- WHEN line items are added, THEN subtotal, tax (configurable %), and total are calculated automatically
- WHEN an invoice is saved, THEN it is linked to a client and shows status: Pending
- WHEN an invoice is downloaded, THEN a PDF is generated with the freelancer's branding info
- WHEN an invoice becomes 7 days past due date, THEN its status changes to Overdue

---

### INV-2: Invoice Status Tracking
**As a** freelancer,
**I want to** know which invoices are paid, pending, or overdue at a glance,
**So that** I can follow up on unpaid work immediately.

**AC:**
- WHEN the invoices list loads, THEN invoices are grouped or filterable by: Paid / Pending / Overdue
- WHEN a user marks an invoice as paid, THEN the payment is recorded and the income tracker is updated
- WHEN an invoice is marked paid, THEN a "payment check" task linked to it is auto-closed

---

### TASK-1: Task Management
**As a** freelancer,
**I want to** track tasks linked to clients and projects,
**So that** nothing falls through the cracks.

**AC:**
- WHEN a task is created, THEN it can be linked to a client (optional)
- WHEN a task has a due date and it passes, THEN the task is flagged as overdue
- WHEN a proposal is sent, THEN a follow-up task is auto-created
- WHEN an invoice is sent, THEN a payment-check task is auto-created
- WHEN a task is completed, THEN it is removed from the active list and recorded in the activity timeline

---

### INCOME-1: Income Tracker
**As a** freelancer,
**I want to** see my monthly earnings and pending payments,
**So that** I understand my cash flow without running reports.

**AC:**
- WHEN the income page loads, THEN it shows: total earned this month, total pending
- WHEN the income page loads, THEN a line chart shows income over the last 6 months
- WHEN a payment is recorded on an invoice, THEN income totals update immediately

---

### SNIP-1: Snippets Library
**As a** freelancer,
**I want to** save and reuse message templates,
**So that** I respond faster and stay consistent.

**AC:**
- WHEN a snippet is created, THEN it has a title, body text, and optional category
- WHEN `{client_name}` appears in a snippet body, THEN it is replaced with the actual client name on insertion
- WHEN inserting a snippet in a follow-up, THEN a picker shows all snippets filterable by category
- WHEN a snippet is inserted, THEN the full text is copied to clipboard or inserted into the active text field

---

### ANALYTICS-1: Conversion Funnel
**As a** freelancer,
**I want to** see my proposal-to-close conversion rate,
**So that** I know where deals are dropping off.

**AC:**
- WHEN the analytics page loads, THEN it shows a funnel: Proposals Sent → Viewed → Replied → Closed
- WHEN the analytics page loads, THEN it shows total proposals sent, reply rate, close rate
- WHEN close rate for a service type is above average, THEN an insight callout highlights it

---

### SEARCH-1: Universal Search
**As a** freelancer,
**I want to** search across all records from anywhere,
**So that** I can find any client, proposal, or invoice instantly.

**AC:**
- WHEN a user types in the search bar, THEN results appear for clients, proposals, and invoices matching the query
- WHEN a result is clicked, THEN the user is navigated to that record
- WHEN no results are found, THEN a "no results" state is shown

---

### SETTINGS-1: User Settings
**As a** freelancer,
**I want to** configure my currency, timezone, and branding,
**So that** invoices and proposals reflect my business.

**AC:**
- WHEN a user saves settings, THEN currency and timezone are applied to all invoices and date displays
- WHEN branding info (name, logo) is saved, THEN it appears on generated PDFs
