const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const src=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
test('Business cannot save enabled Table Reservations with no tables',()=>{
 const s=src('js/dashboard.js');
 assert.match(s,/bizPortalBooking'\)\.checked && !reservationTables\.length/);
 assert.match(s,/Table Reservations is ON, but no tables are listed/);
 assert.match(s,/bizReservationTables'\)\?\.scrollIntoView/);
});
test('Booking form displays missing table configuration directly and requires choice',()=>{
 const s=src('js/map.js');
 assert.match(s,/booking-table-warning/);
 assert.match(s,/Table Reservations is enabled, but the business has not saved any tables yet/);
 assert.match(s,/Select a table from the business list before reviewing/);
 assert.match(s,/field\?\.scrollIntoView\?/);
});
test('Owner setup guidance matches backend table requirement',()=>{
 assert.match(src('index.html'),/Required when Table Reservations is ON/);
 assert.match(src('netlify/functions/lib/booking-create.js'),/No reservation tables are configured yet/);
});
