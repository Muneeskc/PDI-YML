function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    var inwardSheet = ss.getSheetByName("Master Inward");
    var stockSheet = ss.getSheetByName("Physical Stock");
    var pdiSheet = ss.getSheetByName("PDI Reports");
    var outwardSheet = ss.getSheetByName("Outward List");

    // 1. INWARD ENTRY
    if (data.action === "INWARD") {
      inwardSheet.appendRow([data.inwardTime, data.chassis, data.model, data.color, data.engine || "", data.location, data.isReturned ? "Re-Inward" : "New Inward"]);
      upsertPhysicalStock(stockSheet, data.chassis, data.model, data.color, data.location, data.status, data.remarks || "", data.inwardTime);
    }

    // 2. PDI UPDATE
    else if (data.action === "PDI_UPDATE") {
      pdiSheet.appendRow([data.pdiTime, data.chassis, data.model, data.color, data.status, data.speed, data.video, data.location, data.remarks || "", "Sent via Telegram"]);
      upsertPhysicalStock(stockSheet, data.chassis, data.model, data.color, data.location, data.status, data.remarks || "", data.pdiTime);
    }

    // 3. LOCATION CHANGE OR HOLD STATUS
    else if (data.action === "LOCATION_HOLD_UPDATE") {
      upsertPhysicalStock(stockSheet, data.chassis, data.model, data.color, data.location, data.status, data.remarks || "", new Date().toLocaleString());
    }

    // 4. OUTWARD DISPATCH
    else if (data.action === "OUTWARD") {
      outwardSheet.appendRow([data.outwardTime, data.chassis, data.model, data.color, data.outwardDest, data.outwardDriver || ""]);
      removeFromPhysicalStock(stockSheet, data.chassis);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function upsertPhysicalStock(sheet, chassis, model, color, location, status, remarks, updatedTime) {
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).toUpperCase() === String(chassis).toUpperCase()) {
      sheet.getRange(i + 1, 1, 1, 7).setValues([[chassis, model, color, location, status, remarks, updatedTime]]);
      return;
    }
  }
  sheet.appendRow([chassis, model, color, location, status, remarks, updatedTime]);
}

function removeFromPhysicalStock(sheet, chassis) {
  var rows = sheet.getDataRange().getValues();
  for (var i = rows.length - 1; i >= 1; i--) {
    if (String(rows[i][0].toUpperCase()) === String(chassis).toUpperCase()) {
      sheet.deleteRow(i + 1);
    }
  }
}
