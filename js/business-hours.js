/* Vicinify: live opening status using Philippine local time (Asia/Manila).
 * Pure schedule calculation: never write open/closed on a timer to Firestore.
 * Owners can temporarily override with status_mode='manual'; Auto restores schedule.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ViciBusinessHours = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  const DAYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const DAY_INDEX = Object.fromEntries(DAYS.map((name, index) => [name, index]));
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone:'Asia/Manila',weekday:'long',hour:'2-digit',minute:'2-digit',hourCycle:'h23'
  });
  function philippineClock(date = new Date()) {
    const parts = Object.fromEntries(formatter.formatToParts(date).map(part => [part.type,part.value]));
    return {day:DAY_INDEX[String(parts.weekday || '').toLowerCase()],minutes:Number(parts.hour)*60+Number(parts.minute)};
  }
  function timePart(value) {
    const match = String(value||'').trim().toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
    if(!match) return null;
    let hour=Number(match[1]);
    const minute=Number(match[2]||0), meridian=match[3];
    if(minute>59 || hour>24 || (hour===24 && minute!==0))return null;
    if(meridian){
      if(hour<1 || hour>12)return null;
      hour=hour%12+(meridian==='pm'?12:0);
    }
    return hour*60+minute;
  }
  function parseHours(value){
    const text=String(value||'').trim().toLowerCase().replace(/[–—−]/g,'-').replace(/\s+to\s+/g,'-');
    if(!text)return null;
    if(/^(closed|close|sarado|not open|off)$/.test(text))return {closed:true};
    if(/^(24\s*(hours?|hrs?|hr)|24\s*\/\s*7|open\s*24\s*hours?)$/.test(text))return {start:0,end:1440};
    const pieces=text.split(/\s*-\s*/);
    if(pieces.length!==2)return null;
    let start=timePart(pieces[0]);const end=timePart(pieces[1]);
    // Support "8 - 9PM" (infer suffix from the second time) without altering "08:00 - 21:00".
    if(start==null && /\b(am|pm)\s*$/.test(pieces[1]))start=timePart(pieces[0]+pieces[1].match(/(am|pm)\s*$/)[1]);
    if(start==null || end==null || start===1440 || start===end)return null;
    return {start,end};
  }
  function hoursFor(place){
    const hours=place?.operating_hours || place?.operatingHours || place?.hours;
    return hours && typeof hours==='object' && !Array.isArray(hours) ? hours : {};
  }
  function dayValue(hours, index){
    const day=DAYS[index];
    return String(hours[day]??hours[day.slice(0,3)]??'').trim();
  }
  function manualState(place, hint=''){
    const status=String(place?.status||'closed').toLowerCase();
    const code=status==='busy'?'busy':status==='open'?'open':'closed';
    return {status:code,isOpen:code!=='closed',className:code,label:code==='busy'?'Busy':code==='open'?'Open':'Closed',hint,source:'manual'};
  }
  function getState(place, at = new Date()) {
    const hours=hoursFor(place);
    const clock=philippineClock(at);
    const today=dayValue(hours,clock.day);
    const validSchedule=DAYS.some((_,idx)=>parseHours(dayValue(hours,idx))!==null);
    const mode=String(place?.status_mode||place?.statusMode||'auto').toLowerCase();
    if(mode==='manual' || !validSchedule)return manualState(place,today);
    const parsed=parseHours(today);
    const previous=parseHours(dayValue(hours,(clock.day+6)%7));
    let open=false;
    // Current day: for overnight hours, the late-night portion starts today.
    if(parsed && !parsed.closed){
      open=parsed.end>parsed.start
        ? clock.minutes>=parsed.start && clock.minutes<parsed.end
        : clock.minutes>=parsed.start;
    }
    // Previous day: early morning belongs to the previous day's overnight shift.
    if(!open && previous && !previous.closed && previous.end<previous.start){
      open=clock.minutes<previous.end;
    }
    const status=open?'open':'closed';
    return {status,isOpen:open,className:status,label:open?'Open now':'Closed now',hint:today,source:'auto'};
  }
  return {getState,parseHours,philippineClock};
});
