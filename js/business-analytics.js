// Vicinify Business Analytics Phase 8. Never query private bookings directly
// for reports: owner validation and financial aggregation happen on the server.
window.BusinessAnalytics = (() => {
  const $=id=>document.getElementById(id);
  const money=cents=>new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP'}).format((Number(cents)||0)/100);
  const integer=value=>new Intl.NumberFormat('en-PH').format(Number(value)||0);
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeText=value=>String(value??'').slice(0,100);
  let report=null,places=[],view='monthly',generation=0,initialized=false;

  function setPlaces(owned){
    places=Array.isArray(owned)?owned.filter(p=>p&&p.owner_uid===window.auth?.currentUser?.uid):[];
    const section=$('businessAnalyticsSection'),select=$('businessAnalyticsPlace');
    if(!section||!select)return;
    section.classList.toggle('hidden',!places.length);
    const old=select.value;
    select.replaceChildren();
    places.forEach(place=>{
      const opt=document.createElement('option');opt.value=place.id;opt.textContent=place.name||'Establishment';select.appendChild(opt);
    });
    if(places.some(place=>place.id===old))select.value=old;
    if(!places.some(place=>place.id===report?.placeId)){
      report=null;
      $('businessAnalyticsContent').replaceChildren();
      $('businessAnalyticsContent').textContent='Choose an establishment and select Load report.';
      $('businessAnalyticsExport').disabled=true;
    }
    if(!initialized)init();
  }
  function init(){
    initialized=true;
    $('businessAnalyticsLoad')?.addEventListener('click',load);
    $('businessAnalyticsPlace')?.addEventListener('change',()=>{
      generation++;report=null;
      $('businessAnalyticsContent').textContent='Choose Load report to view this establishment’s verified transactions.';
      $('businessAnalyticsExport').disabled=true;
    });
    document.querySelectorAll('[data-analytics-view]').forEach(button=>button.addEventListener('click',()=>{
      view=button.dataset.analyticsView;
      render();
    }));
    $('businessAnalyticsExport')?.addEventListener('click',downloadCsv);
  }
  async function load(){
    const placeId=$('businessAnalyticsPlace')?.value;
    if(!placeId||!places.some(p=>p.id===placeId))return;
    const user=window.auth?.currentUser;if(!user)return;
    const ticket=++generation;
    const button=$('businessAnalyticsLoad');
    button.disabled=true;
    $('businessAnalyticsContent').textContent='Loading verified transactions and preparing the report…';
    $('businessAnalyticsExport').disabled=true;
    try{
      const result=await window.ViciData.command('businessAnalytics',{placeId});
      if(ticket!==generation||window.auth?.currentUser?.uid!==user.uid||$('businessAnalyticsPlace').value!==placeId)return;
      report=result;render();
    }catch(error){
      if(ticket!==generation)return;
      report=null;
      $('businessAnalyticsContent').textContent=error.message||'Could not load the analytics report.';
      window.showToast?.('Analytics could not load. Please retry.','error');
    }finally{if(ticket===generation)button.disabled=false;}
  }
  function friendlyKey(key){
    if(view==='annual')return key;
    const stamp=view==='monthly'?key+'-01':key;
    const date=new Date(stamp+'T12:00:00Z');
    return Number.isFinite(date.getTime())?date.toLocaleDateString('en-PH',view==='monthly'?{month:'short',year:'2-digit'}:{month:'short',day:'numeric'}):key;
  }
  function render(){
    document.querySelectorAll('[data-analytics-view]').forEach(btn=>{
      const selected=btn.dataset.analyticsView===view;
      btn.classList.toggle('active',selected);btn.setAttribute('aria-pressed',String(selected));
    });
    const content=$('businessAnalyticsContent');
    if(!content||!report)return;
    const data=report.views?.[view];if(!data)return;
    const series=data.series||[];
    const current=series[series.length-1]||{},previous=series[series.length-2]||{};
    const growth=data.changePercent===null?'No previous-period sales for comparison':
      `${data.changePercent>0?'+':''}${data.changePercent}% compared with previous period`;
    const peak=Math.max(1,...series.map(item=>Number(item.verifiedSalesCents)||0));
    const datePeriod=view==='annual'?'Year to date':view==='monthly'?'Month to date':'Week to date';
    const kpis=[
      ['Recorded verified payments',money(current.verifiedSalesCents)],
      ['Completed paid transactions',integer(current.paidOrders)],
      ['Unique completed customers',integer(current.uniqueCustomers)],
      ['Confirmed reservations',integer(current.reservationCount)],
      ['Menu items ordered',integer(current.itemsSold)],
      ['Completed, missing verified amount',integer(current.unpricedOrders)]
    ];
    const bars=series.map(item=>{
      const value=Number(item.verifiedSalesCents)||0;
      return `<div class="ba-chart-entry" title="${escape(item.period)}: ${escape(money(value))}">
        <span class="ba-value">${escape(value?money(value):'₱0')}</span>
        <div class="ba-track"><div class="ba-bar" style="height:${Math.max(value?3:0,Math.round(value/peak*100))}%"></div></div>
        <span class="ba-axis">${escape(friendlyKey(item.period))}</span>
      </div>`;
    }).join('');
    const top=(report.topItems||[]).map((item,index)=>`<tr><td>${index+1}. ${escape(safeText(item.name))}</td><td>${integer(item.quantity)}</td><td>${integer(item.orders)}</td></tr>`).join('');
    content.innerHTML=`
      <div class="ba-report-title"><div><strong>${escape(datePeriod)} · ${escape(current.period||'')}</strong>
      <small>${escape(report.placeName)} · Updated ${escape(report.asOfDay)} (Philippine time)</small></div>
      <span class="ba-growth" role="status">${escape(growth)}${data.periodIsPartial?' · Current period is incomplete':''}</span></div>
      <div class="ba-kpi-grid">${kpis.map(([label,value])=>`<div class="ba-kpi"><span>${escape(label)}</span><strong>${escape(value)}</strong></div>`).join('')}</div>
      <div class="ba-panel"><h4>Verified payment trend <small>Philippine pesos · ${escape(view)}</small></h4>
       <div class="ba-chart-scroll"><div class="ba-chart" role="img" aria-label="Verified payment totals by ${escape(view)} period">${bars}</div></div></div>
      <div class="ba-panel"><h4>Best-selling menu items <small>Verified completed orders · recent 13 months</small></h4>
       <div class="ba-table-scroll"><table class="ba-top-table"><thead><tr><th>Menu item</th><th>Units</th><th>Order lines</th></tr></thead><tbody>${top||'<tr><td colspan="3">No confirmed menu items in the reporting window.</td></tr>'}</tbody></table></div></div>
      <p class="ba-disclaimer">${escape(report.disclaimer)} ${report.legacyDateCount?` ${integer(report.legacyDateCount)} older transactions were dated using their creation date because receipt timestamps were unavailable.`:''}
      ${report.partial?'<strong>Dataset limit reached: figures are incomplete. Narrow the reporting period or request a full export.</strong>':''}</p>`;
    $('businessAnalyticsExport').disabled=false;
  }
  function downloadCsv(){
    if(!report)return;
    const rows=[['Period','Verified Payments (PHP)','Completed Paid Transactions','Completed Customers','Reservations','Menu Items','Missing Verified Amount']];
    for(const item of report.views?.[view]?.series||[])rows.push([item.period,(item.verifiedSalesCents/100).toFixed(2),item.paidOrders,item.uniqueCustomers,item.reservationCount,item.itemsSold,item.unpricedOrders]);
    // Protect spreadsheet viewers against formula injection if fields later expand.
    const csv=rows.map(row=>row.map(value=>{const s=String(value??'');return '"'+(/^[=+@\-\t\r]/.test(s)?"'"+s:s).replaceAll('"','""')+'"';}).join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download=`vicinify-analytics-${view}-${report.asOfDay}.csv`;
    document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function reset(){generation++;report=null;places=[];const section=$('businessAnalyticsSection');if(section)section.classList.add('hidden');const content=$('businessAnalyticsContent');if(content)content.textContent='Choose an establishment and select Load report.';const exportBtn=$('businessAnalyticsExport');if(exportBtn)exportBtn.disabled=true;}
  return {setPlaces,load,reset};
})();
