# Luxon YMS — Complete Premium Rebuild

## Files
- `index.html` — new responsive Yard Management web app UI and client-side workflows.
- `Code.gs` — Google Apps Script API for stock, inward, PDI, outward and full sync.
- `manifest.webmanifest` — install metadata for supported browsers.
- `icon.svg` — app icon.
- `README.md` — setup notes.

## What's included
- New enterprise-style responsive navigation and dashboard.
- Stock KPI cards and charts, location distribution, recent activity.
- Vehicle inventory search and filters, vehicle detail view.
- Inward entry with VIN field, location, date, remarks and photo preview.
- PDI queue, checklist, inspector, odometer, decision and photo preview.
- Yard operations: location change, transfer, hold/unhold and outward.
- Reports, CSV export, activity log, dark mode, local JSON backup/restore.
- Optional Apps Script connection and QR/barcode camera scanning.

## Deploy
1. Make a backup of the current app and spreadsheet before changing anything.
2. In the Google Sheet, keep the existing tabs if they exist. The script uses:
   - `Master Inward`
   - `Physical Stock`
   - `PDI Reports`
   - `Outward List`
   It creates missing tabs and a `YMS Activity` tab when needed.
3. Open Apps Script attached to that spreadsheet. Replace the project code with `Code.gs`, save, then Deploy → New deployment → Web app. Select the appropriate execute-as and access settings for your organization.
4. Copy the Web App URL ending in `/exec`.
5. Host `index.html` (and optionally the manifest/icon alongside it) on GitHub Pages or another HTTPS static host.
6. Open the app → System Settings → paste the Apps Script URL → Save connection → Test / Sync.
7. Test inward, PDI, movement and outward using a test spreadsheet before production.

## Data and integration notes
- This is a fresh application architecture, not a cosmetic stylesheet update.
- The app stores working records in the browser's local storage and provides a manual full sync to Apps Script.
- Camera scanning requires HTTPS and browser camera permission.
- Chart.js and the QR scanner are loaded from CDNs, so those features need internet access.
- Browser photo previews are for the current form only; photos are not yet uploaded to Google Drive or persisted as image files.
- Telegram PDF delivery is not wired into this rebuild. It should be integrated with a secure server-side Telegram token flow before production use; do not expose bot tokens in frontend HTML.
- `SYNC_ALL` replaces rows in the stock/PDI/outward tabs with the browser dataset. Always test against a spreadsheet copy first. Existing columns beyond the defined headers may be cleared by a full sync.
- The old sheet schema had only limited fields. Review the column layout and back up existing data before first full sync.
