"use strict";
// Ayudas y vistas previas propias del HTML; la equivalencia nativa se explica en cada recorrido.
const viewNames={events:"Radar",charts:"Indicadores",details:"Registro de señales",service:"Dashboard de servicio"};
let preview=null, previewOrigin=null, leavingPreview=false, tipTimer=null;
const shownTips=new Set();
function currentPlace(){return state.view==="service"?"Servicio · "+state.service:viewNames[state.view];}
function explanation(key,title,text){
  if(!$("#show-action-help").checked||shownTips.has(key))return;
  shownTips.add(key);$("#tip-title").textContent=title;$("#tip-text").textContent=text;
  $("#tip-more").dataset.helpKey=key;$("#action-tip").hidden=false;
  clearTimeout(tipTimer);tipTimer=setTimeout(()=>$("#action-tip").hidden=true,14000);
}
function updateLocation(){
  const bar=$("#location-bar");if(!bar)return;
  const back=history.state?.returnPoint;
  $("#location-path").textContent=state.view==="service"?"Operación › Servicio › "+state.service:"Operación › "+viewNames[state.view];
  $("#location-context").textContent=periodLabel()+(state.service==="all"?" · Todos los servicios":" · "+state.service)+(state.host==="all"?"":" · "+state.host);
  const atRoot=state.view==="events"&&state.service==="all"&&state.source==="all"&&state.severity==="all"&&!state.search;
  $("#route-back").hidden=atRoot||(!back&&state.view!=="service");
  $("#route-back").textContent=back?"← Volver a "+back.label:"← Volver al Radar";
  $("#location-purpose").textContent=state.view==="service"?"Dashboard completo · abriste esta vista de forma explícita":state.view==="events"?"Pulsa una prioridad o una señal para abrir su detalle sin salir del Radar.":state.view==="charts"?"Explora los indicadores; View e Inspect conservan esta selección.":"Pulsa una evidencia para verla sobre esta misma pantalla.";
}
function routeTo(href){
  const from={href:location.search||"?",label:currentPlace(),scrollY:window.scrollY,state:JSON.parse(JSON.stringify(state))};
  if($("#detail-dialog").open){leavingPreview=true;$("#detail-dialog").close();}
  $("#action-tip").hidden=true;
  history.replaceState({...history.state,scrollY:window.scrollY},"",location.href);
  history.pushState({returnPoint:from,scrollY:0},"",href);
  readURL();syncControls();render();setView(state.view,false);updateLocation();
  window.scrollTo({top:0,behavior:"instant"});$("#location-path").focus({preventScroll:true});
  explanation("datalink","Cambio de vista con contexto","Pasaste de "+from.label+" a "+currentPlace()+". En Grafana se puede implementar con un data link y variables de servicio, host y periodo. Este aviso es una ayuda del HTML.");
}
function returnRoute(){
  const point=history.state?.returnPoint;
  if(!point){routeTo(hrefFor({view:"events",service:"all",host:"all"}));return;}
  history.back();
}
function preservePreviewOrigin(){
  if($("#detail-dialog").open)return;
  previewOrigin={element:document.activeElement,scrollY:window.scrollY,label:currentPlace()};
}
function showPreview(){
  $("#action-tip").hidden=true;
  document.body.classList.add("preview-open");
  if(!$("#detail-dialog").open)$("#detail-dialog").showModal();
  $("#detail-dialog").scrollTop=0;
}
function previewNotice(equivalent){
  return '<div class="preview-explanation"><span>AYUDA PROPIA DEL HTML</span><p>Este modal es una vista previa de este prototipo; no se presenta como una función nativa de Grafana. '+equivalent+'</p></div>';
}
function relatedPreviewRows(data){
  return data.map(e=>'<tr class="'+(preview?.event===e.id?"selected-signal":"")+'"><td>'+sourceTag(e.source)+'<small class="subtext">'+e.id+'</small></td><td>'+pill(e.severity)+'</td><td><button type="button" class="evidence-link" data-preview-event="'+e.id+'">'+esc(e.description)+' ↗</button><small class="subtext">'+esc(e.host)+' · hace '+e.age+' min</small></td><td>'+esc(e.value)+'</td></tr>').join("");
}
function evidenceTable(data){return '<div class="table-scroll"><table><thead><tr><th>Fuente / señal</th><th>Prioridad</th><th>Evidencia y activo</th><th>Valor</th></tr></thead><tbody>'+relatedPreviewRows(data)+'</tbody></table></div>';}
function openPriority(severity){
  preservePreviewOrigin();preview={kind:"priority",severity};
  const m=severityMeta[severity],data=visibleEvents(true).filter(e=>e.severity===severity);
  $("#detail-trail").textContent=previewOrigin.label+" › Prioridad "+m.label.toLowerCase();
  $("#detail-title").textContent=m.symbol+" Prioridad "+m.label.toLowerCase()+" · "+data.length+" señales";
  $("#detail-content").innerHTML=previewNotice("En Grafana, un Stat con data link permite filtrar un dashboard o abrir otro con la severidad seleccionada.")+
    '<p class="preview-context">'+periodLabel()+' · Se conservan los filtros de origen. Elige una señal para comparar el servicio y sus evidencias.</p>'+evidenceTable(data)+
    (data.length?'':'<p class="no-data">No hay señales de esta prioridad con los filtros actuales.</p>');
  $("#detail-back").textContent="← Cerrar y volver a "+previewOrigin.label;
  $("#detail-actions").innerHTML='<button type="button" class="button primary" data-apply-priority="'+severity+'">Aplicar esta prioridad al Radar</button>';
  showPreview();
}
function openServicePreview(service,host="all",event="",tab="summary"){
  preservePreviewOrigin();
  const priority=preview?.kind==="priority"?preview.severity:preview?.priority;
  preview={kind:"service",service,host,event,tab,priority};
  drawServicePreview();showPreview();
}
function drawServicePreview(){
  const p=preview,data=sameService(p.service).filter(e=>p.host==="all"||e.host===p.host);
  const chosen=data.find(e=>e.id===p.event),scenario=p.service==="Flujo Aurora";
  const trail=[previewOrigin.label,p.priority?"Prioridad "+severityMeta[p.priority].label.toLowerCase():null,p.service,chosen?.id].filter(Boolean);
  $("#detail-trail").textContent=trail.join(" › ");
  $("#detail-title").textContent=p.service;
  const series=[{name:p.service,color:"#3274d9",values:p95.map(v=>Math.round(v*(p.service==="Flujo Aurora"?1:p.service==="Interfaz Boreal"?.62:.37)))}];
  const chart='<section class="preview-chart"><div><h3>Respuesta de aplicación · p95</h3><span>Dynatrace · ms</span></div>'+lineChart(series)+'<div class="preview-panel-actions"><button class="button subtle" data-preview-metric="latency">View</button><button class="button subtle" data-preview-inspect="latency">Inspect → Data</button></div></section>';
  const disk=scenario?'<section class="preview-chart"><div><h3>Ocupación del disco del host</h3><span>Zabbix · %</span></div>'+lineChart([{values:diskLine,color:"#bd7a26"}],{max:100,suffix:"%",threshold:90})+'<div class="preview-panel-actions"><button class="button subtle" data-preview-metric="disk">View</button><button class="button subtle" data-preview-inspect="disk">Inspect → Data</button></div></section>':'';
  const tabs='<nav class="preview-tabs" aria-label="Detalle del servicio">'+[["summary","Lectura del servicio"],["charts","Gráficas"],["evidence","Evidencias"]].map(([k,label])=>'<button type="button" data-preview-tab="'+k+'" class="'+(p.tab===k?"active":"")+'" aria-pressed="'+(p.tab===k)+'">'+label+'</button>').join("")+'</nav>';
  let content="";
  if(p.tab==="summary"){
    content='<div class="preview-facts"><article><small>SEÑAL SELECCIONADA</small><strong>'+esc(chosen?.description||"Contexto del servicio")+'</strong><span>'+esc(chosen?.value||data.length+" señales disponibles")+'</span></article><article><small>RELACIÓN A CONTRASTAR</small><strong>'+ (scenario?"Infraestructura + aplicación":"Etiquetas y periodo compartidos")+'</strong><span>'+ (scenario?"Disco, latencia y errores en el mismo host":"La relación no acredita causa raíz")+'</span></article></div><div class="preview-reading"><h3>Qué observar y cómo continuar</h3><p>'+(scenario?"La ocupación del disco coincide con desviaciones de latencia y errores. Es una hipótesis para contrastar con la secuencia y el diagnóstico en origen.":"Revisa el activo y las señales disponibles antes de atribuir la afectación a un componente.")+'</p><div><span><b>Validar:</b> recurso con Infraestructura y diagnóstico de aplicación en la fuente.</span><span><b>Falta:</b> telemetría del intermediario y resultado funcional.</span><span><b>Recuperación:</b> comprobar el recorrido del servicio, además del recurso.</span></div></div><div class="preview-chart-grid">'+chart+disk+'</div>';
  }else if(p.tab==="charts"){content='<p class="preview-context">Mismo servicio y periodo. Puedes ampliar o inspeccionar cada panel.</p><div class="preview-chart-grid">'+chart+disk+'</div>';}
  else{content=evidenceTable(data)+'<p class="preview-context">Elige otra señal para cambiar la evidencia seleccionada dentro de este mismo detalle.</p><button type="button" class="button subtle" data-help="source">Cómo continuar en la herramienta de origen</button>';}
  $("#detail-content").innerHTML=previewNotice("El equivalente nativo de este recorrido es Table/Stat + Data links hacia un dashboard de servicio, con variables y periodo. View e Inspect son funciones nativas; su apariencia aquí se simula.")+
    '<div class="preview-context">'+periodLabel()+' · '+esc(p.host==="all"?"Todos los hosts del servicio":p.host)+' · '+data.length+' señales relacionadas'+(chosen?' · '+esc(chosen.group)+' · '+esc(chosen.state):'')+'</div>'+tabs+content;
  $("#detail-back").textContent=p.priority?"← Volver a prioridad "+severityMeta[p.priority].label.toLowerCase():"← Cerrar y volver a "+previewOrigin.label;
  $("#detail-actions").innerHTML='<button type="button" class="button" data-full-charts>Ir a Indicadores con este servicio →</button><button type="button" class="button primary" data-full-service>Abrir dashboard de servicio →</button>';
}
function scopedMetric(metric,mode){
  const saved={service:state.service,host:state.host};
  if(preview?.kind==="service"){state.service=preview.service;state.host=preview.host;}
  try{metricContext(metric,mode);}finally{Object.assign(state,saved);}
}
const originalRender=render;
render=function(){originalRender();updateLocation();};
document.addEventListener("DOMContentLoaded",()=>{
  const topbar=document.createElement("section");topbar.id="location-bar";topbar.className="location-bar";
  topbar.innerHTML='<div><strong id="location-path" tabindex="-1"></strong><span id="location-context"></span><p id="location-purpose"></p></div><button id="route-back" type="button" class="button subtle" hidden></button>';
  $(".tabs").before(topbar);
  const assist=document.createElement("label");assist.className="assistance-toggle";assist.innerHTML='<input type="checkbox" id="show-action-help" checked> Ayudas al interactuar';
  $(".header-actions").prepend(assist);
  $(".event-panel .panel-title p").textContent="Pulsa una prioridad o una señal: el detalle se abre aquí, conservando filtros y posición.";
  document.querySelectorAll(".chart-surface").forEach((surface,i)=>{
    const metrics=["latency","resources","apdex","errors","availability","heatmap"];
    const b=document.createElement("button");b.type="button";b.className="open-chart-preview";b.dataset.panelview=metrics[i];b.textContent="Ampliar panel · View";surface.after(b);
  });
  $("#route-back").addEventListener("click",returnRoute);
  $("#dismiss-tip").addEventListener("click",()=>$("#action-tip").hidden=true);
  $("#tip-more").addEventListener("click",()=>{showHelp($("#tip-more").dataset.helpKey);$("#action-tip").hidden=true;});
  $("#show-action-help").addEventListener("change",e=>{if(!e.target.checked)$("#action-tip").hidden=true;});
  $("#detail-back").addEventListener("click",()=>{if(preview?.kind==="service"&&preview.priority)openPriority(preview.priority);else $("#detail-dialog").close();});
  $("#detail-dialog").addEventListener("close",()=>{
    document.body.classList.remove("preview-open");
    const origin=previewOrigin;preview=null;previewOrigin=null;
    if(!leavingPreview&&origin){origin.element?.focus({preventScroll:true});window.scrollTo({top:origin.scrollY,behavior:"instant"});}
    leavingPreview=false;
  });
  $("#panel-inspector").addEventListener("cancel",()=>$("#panel-inspector").hidden=true);
  // Intercept only local UI routes. Documentation links retain normal browser behavior.
  document.addEventListener("click",e=>{
    const b=e.target.closest("button"),a=e.target.closest("a");
    const ownAction=b?.matches("[data-view],[data-preview-event],[data-preview-tab],[data-preview-metric],[data-preview-inspect],[data-apply-priority],[data-full-service],[data-full-charts]");
    if(ownAction){
      e.preventDefault();e.stopImmediatePropagation();
      if(b.dataset.view){routeTo(hrefFor({view:b.dataset.view,host:"all"}));return;}
      if(b.dataset.previewEvent){const ev=events.find(x=>x.id===b.dataset.previewEvent);openServicePreview(ev.service,ev.host,ev.id);return;}
      if(b.dataset.previewTab){preview.tab=b.dataset.previewTab;drawServicePreview();return;}
      if(b.dataset.previewMetric){scopedMetric(b.dataset.previewMetric,"view");return;}
      if(b.dataset.previewInspect){scopedMetric(b.dataset.previewInspect,"data");return;}
      if(b.dataset.applyPriority){state.severity=b.dataset.applyPriority;$("#detail-dialog").close();syncControls();render();syncURL();explanation("events","Filtro por prioridad","Aplicaste una severidad al Radar. En Grafana puede hacerse con una variable y un data link. La vista previa anterior es propia del HTML.");return;}
      if(b.hasAttribute("data-full-service")){routeTo(serviceHref(preview.service,preview.host,preview.event));return;}
      if(b.hasAttribute("data-full-charts")){routeTo(hrefFor({view:"charts",service:preview.service,host:"all",source:"all",severity:"all",group:"all",search:""}));return;}
    }
    if(!a||e.ctrlKey||e.metaKey||e.shiftKey||e.button!==0)return;
    const href=a.getAttribute("href");
    if(!href?.startsWith("?"))return;
    const p=new URLSearchParams(href.slice(1)),view=p.get("view");
    if(!view)return;
    e.preventDefault();e.stopImmediatePropagation();
    if(view==="service"){openServicePreview(p.get("var-service"),p.get("var-host")||"all",p.get("var-event")||"");return;}
    if(view==="events"&&p.get("var-severity")!=="all"){openPriority(p.get("var-severity"));return;}
    routeTo(href);
  },true);
  document.addEventListener("change",e=>{
    if(["source","severity","service","group","period","resource","top"].includes(e.target.id)){
      updateLocation();explanation("charts","Variables de dashboard","Cambiaste una selección. En Grafana las variables modifican las consultas de los paneles; esta ayuda emergente pertenece al HTML.");
    }
  });
  window.addEventListener("popstate",()=>{
    if($("#detail-dialog").open){leavingPreview=true;$("#detail-dialog").close();}
    readURL();syncControls();render();setView(state.view,false);updateLocation();
    window.scrollTo({top:history.state?.scrollY||0,behavior:"instant"});
  });
  updateLocation();
});

