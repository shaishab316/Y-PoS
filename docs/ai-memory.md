# POS System — AI Memory Reference

## Design
- Modern, primarily Blue, Red & Yellow highlights, White & Cream background
- Bilingual: English & Bahasa Indonesia

## Account Types
- **Owner** (1 account): Full access — Reporting, User & page settings, Menu edit, Payment, Production, Collection
- **Admin** (1 account): Menu edit, Payment, Production, Collection; not all admins have same access level

## Pages Overview
| Page | Login Required |
|------|---------------|
| Touchscreen Menu | No |
| Production | No |
| Collection | No |
| Inventory | Yes (Admin) |
| Menu / Menu Edit / Menu Set-up | Yes (Owner/Admin) |
| Reporting | Yes (Owner/selected Admin) |

## Offline Mode
- Admin/Owner accounts still functional
- Printers via Bluetooth still work
- QR Ordering disabled offline
- Touchscreen kiosk still works; can print order, pay at counter, admin inputs manually

---

## Production Page
- Max 3 pages, custom names (e.g. Kitchen, Bar, Take-out)
- Order lifecycle: **Incoming (red blinking)** → **OK Pressed (blue/processing)** → **Ready (green)** → **Pick Up (cleared)**
- Alarm fires on new order → silenced on OK press
- Ready button triggers alarm + vibration on Collection page
- Order disappears when all items picked up
- Cancel item within order → sent to admin for review
- Mute alarm option available

## Collection Page
- 1 page only, no assignment needed
- Triggered when Production clicks "Ready"
- Press "Pick Up" per item; order disappears when all items picked up
- Manual alarm reminder only from Production
- Can cancel order items (same as Production)

## Payment Page
- Shows: Order #, time, details — no alarm
- Payment type via dropdown; cash → popup for amount received → shows change
- Camera icon for proof of payment (cash or transfer)
- Submit → sends to Production; assign Service Account manually or auto
- Orders editable before payment; locked after
- Receipt fields: Business name & contact, order #, items, price, promo name, order time, order type (Dine-in/Takeaway), order location (Table #/Kiosk/Admin), payment type, custom note

## Admin Account — Opening/Closing Workflow
**Opening (on "Start"):**
1. Opening Inventory confirmed (skipped if Inventory inactive)
2. Promotion confirmed
3. Opening cash amount

**Closing (on "Close"):**
1. Closing Inventory confirmed
2. Closing sales confirmed
3. Proof of storing cash (combined with Proof of Payment under Reporting)

Admin can "Skip" any step if no changes.

---

## Inventory Page
- Optional (can be active or not); shown in Admin opening popup if active
- Columns: Opening Stock, Stocks Sold, Stock In, Stock Out, Closing Stock, Remarks
- Reporting: Custom date AND period; export PDF or Excel

## Menu
### Order Input Types
1. Staff-assisted order
2. Customer Touchscreen
3. QR scan (per-table unique QR, no login required)

### Menu Ordering Rules
- Dine-in / Takeaway option: Touchscreen & Staff only
- QR scan: table-specific, customer's phone, no login
- Pay at Counter only; asks for name → generates order number
- Low inventory → admin notification; 0 stock → item auto grayed out
- Admin can set auto-print on order

## Menu Set-Up
- Categories with custom names; visibility per channel (QR Table, Touchscreen, Service, Admin)
- Layout options per section (max 50 sections/category): 1 image, 2 side-by-side, 3-row, 4-row, image list, no-image list
- Landscape/Portrait per account type

### Item Types
**Individual:**
- Name, Price, Production destination, optional: Inventory Qty, Labels, Promo Price + custom promo name
- Labels: Best Seller, Recommended, Fav, Must Try, New, Vegetarian, Kids Choice, Spicy

**Packet:**
- Same as Individual + Max items (max 100)
- Choice Sections (max 50): each section has name, max qty, and item options
- Per-item max qty within a section (e.g. max 1 cake within Dessert section of max 2)

### Additional Settings
- Tax/Service charges: max 5 additions, named, percentage or amount
- QR Code Generator: enter table count → unique QR per table
- Receipt customization: Company name, contact, logo, custom note

## Menu Edit
- Edit button turns editable fields red
- Click item to edit via popup or inline text

---

## Owner Account — Reporting
- **Sales**: Total by custom date/period
- **Top Seller**: Top 5 per category (amount + qty)
- **Order Type**: Dine-in vs Takeaway count
- **Production Performance**: avg time per item/order, top 5 slowest items, avg orders/hour
- **Proof of Payment & Storage**: image verification (selected admins only)
- **Inventory Report**: optional, disabled if inactive
- **Export**: PDF or Excel

## User Set-Up (Owner only)
- List of Owner & Admin; password change
- Set Production pages
- Business profile: name, address, contact, social media, operating hours, holidays, password recovery email
- System operates based on operating hours set