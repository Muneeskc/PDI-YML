/**
 * LUXON YMS — Google Apps Script backend
 * Deploy as Web App. Spreadsheet tabs are created automatically when missing.
 * Compatible with the original sheet names where possible.
 */
const SHEETS = {
  inward: 'Master Inward',
  stock: 'Physical Stock',
  pdi: 'PDI Reports',
  outward: 'Outward List',
  activity: 'YMS Activity'
};
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'GET_ALL';
    if (action !== 'GET_ALL') return json_({status:'error', message:'Unknown GET action'});
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const data = {
      vehicles: readObjects_(ensure_(ss,SHEETS.stock,['Chassis','Model','Color','Location','Status','Remarks','Updated Time'])),
      pdi: readObjects_(ensure_(ss,SHEETS.pdi,['PDI Time','Chassis','Model','Color','Status','Odometer','Video','Location','Remarks','Source'])),
      inward: readObjects_(ensure_(ss,SHEETS.inward,['Inward Time','Chassis','Model','Color','Engine','Location','Type'])),
      outward: readObjects_(ensure_(ss,SHEETS.outward,['Outward Time','Chassis','Model','Color','Destination','Driver'])),
      activity: readObjects_(ensure_(ss,SHEETS.activity,['Time','Action','Chassis','Details']))
    };
    return json_({status:'success',data:data});
  } catch(err) { return json_({status:'error',message:String(err)}); }
}
function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (body.action === 'SYNC_ALL') {
      const d = body.data || {};
      replaceStock_(ss, d.vehicles || []);
      replacePdi_(ss, d.pdi || []);
      replaceOutward_(ss, d.outward || []);
      return json_({status:'success',message:'Full sync completed'});
    }
    const stock = ensure_(ss,SHEETS.stock,['Chassis','Model','Color','Location','Status','Remarks','Updated Time']);
    const inward = ensure_(ss,SHEETS.inward,['Inward Time','Chassis','Model','Color','Engine','Location','Type']);
    const pdi = ensure_(ss,SHEETS.pdi,['PDI Time','Chassis','Model','Color','Status','Odometer','Video','Location','Remarks','Source']);
    const outward = ensure_(ss,SHEETS.outward,['Outward Time','Chassis','Model','Color','Destination','Driver']);
    const now = new Date();
    const d = body;
    if (d.action === 'INWARD') {
      inward.appendRow([d.inwardTime||now,d.chassis,d.model,d.color||'',d.engine||'',d.location,d.type||'New Inward']);
      upsert_(stock,[d.chassis,d.model,d.color||'',d.location,d.status||'Pending PDI',d.remarks||'',now]);
    } else if (d.action === 'PDI_UPDATE') {
      pdi.appendRow([d.pdiTime||now,d.chassis,d.model,d.color||'',d.status,d.speed||'',d.video||'',d.location,d.remarks||'','YMS']);
      upsert_(stock,[d.chassis,d.model,d.color||'',d.location,d.status,d.remarks||'',now]);
    } else if (d.action === 'LOCATION_HOLD_UPDATE') {
      upsert_(stock,[d.chassis,d.model,d.color||'',d.location,d.status,d.remarks||'',now]);
    } else if (d.action === 'OUTWARD') {
      outward.appendRow([d.outwardTime||now,d.chassis,d.model,d.color||'',d.outwardDest||'',d.outwardDriver||'']);
      removeStock_(stock,d.chassis);
    } else {
      return json_({status:'error',message:'Unsupported action'});
    }
    return json_({status:'success'});
  } catch(err) { return json_({status:'error',message:String(err)}); }
}
function ensure_(ss,name,headers) {
  let sh=ss.getSheetByName(name);
  if(!sh) sh=ss.insertSheet(name);
  if(sh.getLastRow()===0) sh.appendRow(headers);
  return sh;
}
function readObjects_(sh) {
  const v=sh.getDataRange().getValues();
  if(v.length<2) return [];
  const h=v[0].map(String);
  return v.slice(1).filter(r=>r.some(x=>x!==''&&x!==null)).map(r=>{
    const o={};h.forEach((k,i)=>o[k]=r[i]);return o;
  });
}
function upsert_(sh,row) {
  const values=sh.getDataRange().getValues();
  const key=String(row[0]||'').toUpperCase();
  for(let i=1;i<values.length;i++){
    if(String(values[i][0]||'').toUpperCase()===key){
      sh.getRange(i+1,1,1,7).setValues([row]);return;
    }
  }
  sh.appendRow(row);
}
function removeStock_(sh,chassis) {
  const rows=sh.getDataRange().getValues(),key=String(chassis||'').toUpperCase();
  for(let i=rows.length-1;i>=1;i--) if(String(rows[i][0]||'').toUpperCase()===key) sh.deleteRow(i+1);
}
function replaceStock_(ss,vehicles) {
  const sh=ensure_(ss,SHEETS.stock,['Chassis','Model','Color','Location','Status','Remarks','Updated Time']);
  const rows=vehicles.filter(v=>!v.outward).map(v=>[v.chassis,v.model,v.color||'',v.location,v.status||'Pending PDI',v.remarks||'',v.updated||'']);
  rewrite_(sh,['Chassis','Model','Color','Location','Status','Remarks','Updated Time'],rows);
}
function replacePdi_(ss,pdi) {
  const sh=ensure_(ss,SHEETS.pdi,['PDI Time','Chassis','Model','Color','Status','Odometer','Video','Location','Remarks','Source']);
  const rows=pdi.map(v=>[v.time||v.date||'',v.chassis,v.model||'',v.color||'',v.status,v.speed||'',v.video||'',v.location||'',v.remarks||'','YMS']);
  rewrite_(sh,['PDI Time','Chassis','Model','Color','Status','Odometer','Video','Location','Remarks','Source'],rows);
}
function replaceOutward_(ss,outward) {
  const sh=ensure_(ss,SHEETS.outward,['Outward Time','Chassis','Model','Color','Destination','Driver']);
  const rows=outward.map(v=>[v.date||'',v.chassis,v.model||'',v.color||'',v.destination||'',v.driver||'']);
  rewrite_(sh,['Outward Time','Chassis','Model','Color','Destination','Driver'],rows);
}
function rewrite_(sh,headers,rows) {
  sh.clearContents();sh.getRange(1,1,1,headers.length).setValues([headers]);
  if(rows.length) sh.getRange(2,1,rows.length,headers.length).setValues(rows);
}
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}