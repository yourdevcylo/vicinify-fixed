/* Shared, allowlisted establishment features; missing data never means available. */
(function(root){
 const groups=[
  {key:'accessibility',title:'Accessibility',icon:'accessibility',items:[['wheelchair_entrance','Wheelchair-accessible entrance'],['wheelchair_parking','Wheelchair-accessible parking'],['wheelchair_restroom','Wheelchair-accessible restroom'],['wheelchair_seating','Wheelchair-accessible seating']]},
  {key:'services',title:'Service options',icon:'store',items:[['dine_in','Dine-in'],['takeout','Takeout'],['outdoor_seating','Outdoor seating']]},
  {key:'amenities',title:'Amenities',icon:'wifi',items:[['wifi','Wi-Fi'],['parking','Parking'],['restroom','Restroom'],['air_conditioning','Air conditioning']]},
  {key:'highlights',title:'Highlights',icon:'sparkles',items:[['coffee_specialty','Coffee specialty'],['fresh_pastries','Fresh pastries'],['live_music','Live music'],['sports','Live sports']]},
  {key:'popular_for',title:'Dining options',icon:'utensils',items:[['breakfast','Breakfast'],['lunch','Lunch'],['dinner','Dinner'],['groups','Groups'],['solo_dining','Solo dining']]},
  {key:'offerings',title:'Offerings',icon:'coffee',items:[['coffee','Coffee'],['tea','Tea'],['desserts','Desserts'],['vegetarian','Vegetarian options'],['vegan','Vegan options'],['late_night','Late-night food']]}
 ];
 function normalize(value){const result={};for(const group of groups){const allowed=new Set(group.items.map(i=>i[0]));result[group.key]=Array.isArray(value?.[group.key])?[...new Set(value[group.key].filter(v=>allowed.has(v)))]:[];}return result;}
 function renderForm(container,value={}){if(!container)return;const selected=normalize(value);container.innerHTML=groups.map(group=>`<fieldset class="place-feature-group"><legend>${group.title}</legend><div>${group.items.map(([key,label])=>`<label><input type="checkbox" data-feature-group="${group.key}" value="${key}" ${selected[group.key].includes(key)?'checked':''}><span>${label}</span></label>`).join('')}</div></fieldset>`).join('');}
 function readForm(container){const values={};for(const input of container?.querySelectorAll('input[data-feature-group]:checked')||[]){(values[input.dataset.featureGroup]||=[]).push(input.value);}return normalize(values);}
 root.PlaceFeatures={groups,normalize,renderForm,readForm};
 document.addEventListener('DOMContentLoaded',()=>document.querySelectorAll('[data-place-feature-form]').forEach(el=>renderForm(el)));
})(window);
