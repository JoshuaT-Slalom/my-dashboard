# FastForward Logistics — Carrier Performance Dashboard
## Product & Functional Build Brief for GitHub Copilot

---

## 1. Business Context

FastForward Logistics is a mid-size freight and supply chain company. Their operations team currently manages performance tracking through disconnected spreadsheets, making it difficult for leadership to assess business health quickly.

The VP of Operations needs a **single internal dashboard** she can open during leadership meetings to get an immediate, accurate picture of how the carrier network is performing. The dashboard must be clear, scannable, and authoritative — it is a decision-support tool, not a data entry tool.

This is a **working prototype** with realistic mock data. It should look and function like a real internal product.

---

## 2. Users & Goals

| User | Primary Goal |
|---|---|
| **VP of Operations** | See the overall carrier network health at a glance; identify underperformers quickly |
| **Ops Team / Dispatchers** | Drill into open exceptions and carrier-level detail to take action |
| **Regional Managers** | Understand performance within their geographic area |
| **Leadership / Board** | Confirm high-level KPIs without needing to interpret raw data |

**The dashboard is read-only.** No data entry, no form submission. All interactions are filters and drilldowns.

---

## 3. Dashboard Layout & Architecture

The dashboard is a **single-page application** with a persistent top navigation/header and a main content area. There is no multi-page routing needed for the prototype.

### Layout Structure

```
┌──────────────────────────────────────────────────────────┐
│  HEADER: FastForward Logistics | Ops Dashboard | Filters  │
├──────────────────────────────────────────────────────────┤
│  SUMMARY BAR: 4 top-level KPI stat cards                 │
├──────────────────────────────────────────────────────────┤
│  PRIMARY: Carrier Scorecard Table     │  PRIMARY:         │
│  (ranked by composite score)          │  Exception Trend  │
│                                       │  Chart            │
├───────────────────────────────────────┴───────────────────┤
│  SECONDARY: Shipment Volume Chart    │  SECONDARY:        │
│  (over time)                         │  Regional Map/Grid │
├──────────────────────────────────────┴────────────────────┤
│  SECONDARY: Open Exceptions Table (filterable list)       │
└──────────────────────────────────────────────────────────┘
```

---

## 4. Global Filters (Persistent Header)

All modules on the dashboard respond to these global filters simultaneously:

- **Date Range:** Last 7 days / Last 30 days / Last 90 days (default: Last 30 days)
- **Region:** All Regions / Northeast / Southeast / Midwest / West / Southwest
- **Carrier:** All Carriers / [individual carrier names from mock data]
- **Shipment Status:** All / In Transit / Delivered / Delayed

Filters should be rendered as dropdowns or a segmented control in the header bar. A subtle visual indicator (e.g. active filter pill) should show when a non-default filter is applied.

---

## 5. Summary Bar — Top KPI Cards

Four stat cards displayed in a row below the header. These are the first thing the VP sees.

| Card | Metric | Format |
|---|---|---|
| Total Shipments | Count of shipments in the selected date range | e.g. `1,284` |
| Network On-Time Rate | % of shipments delivered on or before estimated delivery | e.g. `87.4%` with color coding (green ≥ 90%, yellow 80–89%, red < 80%) |
| Open Exceptions | Count of unresolved exceptions (late delivery + missing docs + invoice discrepancy) | e.g. `47` with red badge if > 30 |
| Avg Cost vs. Contract | Average % variance between actual cost and contracted rate across all carriers | e.g. `+4.2%` (red if positive/over, green if negative/under) |

Each card should show a small trend indicator (up/down arrow + % change) comparing to the previous equivalent period.

---

## 6. PRIMARY MODULE — Carrier Performance Scorecard

### Purpose
This is the most important section of the dashboard. It gives the VP a ranked, at-a-glance view of every carrier's health across three weighted dimensions.

### Carrier Performance Score
Each carrier receives a **composite performance score (0–100)** calculated from:

| Metric | Weight | Description |
|---|---|---|
| On-Time Delivery Rate | 50% | % of that carrier's shipments delivered on time |
| Exception / Incident Rate | 30% | % of that carrier's shipments that triggered an exception (lower = better) |
| Cost vs. Contracted Rate | 20% | Avg % over/under contract (lower overage = better) |

### Scorecard Table Columns

| Column | Detail |
|---|---|
| Rank | 1, 2, 3... sorted by composite score descending |
| Carrier Name | Company name |
| Shipments (period) | Total shipments in selected date range |
| On-Time Rate | % with color coding (green/yellow/red) |
| Exception Rate | % with color coding (green/yellow/red, inverted scale) |
| Cost vs. Contract | % variance, color coded |
| Composite Score | 0–100, displayed as a score badge with color |
| Trend | Arrow indicating if this carrier's composite score improved or declined vs. prior period |

- Table should be **sortable by any column**
- Rows with a composite score below 70 should be subtly highlighted (e.g. light red row background)
- Clicking a row could expand an inline detail panel (optional for prototype) showing that carrier's exception breakdown

### Mock Carriers (use these names in data)
- Apex Freight Solutions
- BlueLine Transport
- Cardinal Logistics
- DeltaHaul Inc.
- Evergreen Shipping Co.
- FrontLine Carriers

---

## 7. PRIMARY MODULE — Exception Trend Chart

### Purpose
Shows the VP how exceptions are trending over time and which exception types are growing. This sits alongside the scorecard.

### Chart Type
**Stacked bar chart** (or grouped bar chart) — X axis is time (days or weeks depending on date filter), Y axis is exception count.

### Exception Types (rendered as separate series/colors)
1. **Late Delivery** — shipment arrived after the committed delivery window
2. **Missing Documentation** — required shipping docs (BOL, POD, customs) not submitted
3. **Invoice Discrepancy** — billed amount does not match contracted or quoted rate

### Additional Controls on This Chart
- Toggle to switch between **By Exception Type** (stacked) and **By Carrier** (grouped by carrier, each exception type a segment)
- Toggle to switch between **Count** and **% of Shipments**

---

## 8. SECONDARY MODULE — Shipment Volume Over Time

- **Line chart** showing total shipments per day or week (depending on date range filter)
- A second line overlaid showing on-time shipments
- The gap between total and on-time = late/delayed, which should be a shaded area in a muted red/orange

---

## 9. SECONDARY MODULE — Regional Performance Grid

Since a geographic map may add complexity for a prototype, implement this as a **summary grid / card layout**:

- One card per region (Northeast, Southeast, Midwest, West, Southwest)
- Each card shows: Shipment count, On-Time Rate, Open Exceptions count
- Color-coded by on-time rate (same green/yellow/red thresholds as elsewhere)
- Cards should reorder so worst-performing region appears first

---

## 10. SECONDARY MODULE — Open Exceptions Table

A sortable, filterable table showing all current open (unresolved) exceptions.

| Column | Detail |
|---|---|
| Exception ID | e.g. `EXC-00423` |
| Type | Late Delivery / Missing Documentation / Invoice Discrepancy |
| Carrier | Carrier name |
| Route | Origin → Destination (e.g. `Chicago, IL → Atlanta, GA`) |
| Shipment # | e.g. `SHP-10291` |
| Date Opened | Date the exception was flagged |
| Days Open | Count of calendar days since opened (highlight in red if > 5 days) |
| Status | Open / In Review (badge styled) |

- Table should support filtering by Type and Carrier inline (not global filters)
- Default sort: Days Open descending (most urgent first)
- Target: 20–30 mock exception records

---

## 11. Mock Data Requirements

All data should be defined in static JavaScript/JSON files (no backend required). The data should feel realistic — avoid round numbers, include natural variance, and ensure the metrics tell a coherent story (e.g. one carrier is a clear underperformer, one is excellent).

### Suggested Data Files
- `carriers.json` — carrier list, metadata
- `shipments.json` — 300–500 shipment records with fields: id, carrier_id, region, origin, destination, status, estimated_delivery, actual_delivery, contracted_cost, actual_cost, date_created
- `exceptions.json` — 30–50 exception records with fields: id, type, carrier_id, shipment_id, route, date_opened, status
- A computed `carrierMetrics.js` utility that derives scorecard values from the above

---

## 12. Visual & UX Requirements

- **Color system:** Use a professional, restrained palette. Primary brand color: deep navy (`#0F2D4A`). Accent: amber/orange (`#F59E0B`) for highlights and CTAs. Status colors: green (`#10B981`), yellow (`#F59E0B`), red (`#EF4444`).
- **Typography:** Clean sans-serif. Headers bold and legible at a glance. Data values should be larger than their labels.
- **Density:** The dashboard should be **information-dense but not cluttered**. Leadership needs to read it across a conference room table on a projected screen.
- **No decorative elements** — every element on screen should carry data or aid navigation.
- **Loading states:** Each module should have a skeleton/placeholder state for when data is being computed.
- **Responsive:** Optimised for 1280px+ widescreen. Mobile responsiveness is out of scope for this prototype.

---

## 13. Out of Scope (for this prototype)

- User authentication / login
- Real API or database connections
- Data export (PDF, CSV)
- Mobile layout
- Editing or actioning exceptions
- Email / notification alerts
- Historical comparisons beyond the 90-day window

---

## 14. Definition of Done (Prototype)

The prototype is considered complete when:

- [ ] All 4 global filters work and update every module simultaneously
- [ ] Carrier Scorecard table renders, sorts, and correctly reflects composite scores
- [ ] Exception Trend chart renders with all 3 exception types and toggle controls
- [ ] All secondary modules (volume chart, regional grid, exceptions table) render with mock data
- [ ] KPI summary bar reflects correct aggregated values from mock data
- [ ] Color coding (green/yellow/red) is applied consistently across all modules
- [ ] The layout holds cleanly at 1280px and 1440px width
- [ ] No console errors in the browser

---