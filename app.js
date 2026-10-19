"use strict";
// Escenario ficticio, independiente de cualquier instalación o entidad real.
const severityMeta={critical:{label:"Crítica",symbol:"◆",color:"#bd3243"},high:{label:"Alta",symbol:"▲",color:"#b86509"},medium:{label:"Media",symbol:"●",color:"#7b4fb4"},low:{label:"Baja",symbol:"■",color:"#2875b3"}};
const events=[
 {id:"Z-2041",source:"Zabbix",severity:"critical",age:28,description:"Disco de datos por encima del 95 %",service:"Flujo Aurora",host:"aurora-node-01",group:"Infraestructura",state:"En análisis",value:"96 %",unit:"Uso de disco"},
 {id:"D-1042",source:"Dynatrace",severity:"critical",age:24,description:"Tiempo de respuesta p95 elevado",service:"Flujo Aurora",host:"aurora-node-01",group:"Aplicaciones",state:"Activo",value:"3.200 ms",unit:"Latencia p95"},
 {id:"D-1040",source:"Dynatrace",severity:"high",age:22,description:"Aumento de errores HTTP 5xx",service:"Flujo Aurora",host:"aurora-node-01",group:"Aplicaciones",state:"Activo",value:"4,8 %",unit:"Tasa de errores"},
 {id:"Z-2039",source:"Zabbix",severity:"high",age:71,description:"CPU sostenida por encima del umbral",service:"Proceso Cobalto",host:"cobalto-node-03",group:"Infraestructura",state:"Activo",value:"87 %",unit:"Uso de CPU"},
 {id:"D-1038",source:"Dynatrace",severity:"high",age:130,description:"Descenso del índice de experiencia",service:"Interfaz Boreal",host:"boreal-api-02",group:"Aplicaciones",state:"En análisis",value:"0,74",unit:"Apdex"},
 {id:"Z-2037",source:"Zabbix",severity:"medium",age:11,description:"Cola de procesos pendiente",service:"Tareas Estela",host:"estela-worker-01",group:"Infraestructura",state:"Activo",value:"240",unit:"Procesos pendientes"},
 {id:"D-1036",source:"Dynatrace",severity:"medium",age:180,description:"Inicio de sesión más lento",service:"Acceso Duna",host:"duna-auth-01",group:"Aplicaciones",state:"Activo",value:"1.450 ms",unit:"Tiempo de respuesta"},
 {id:"Z-2035",source:"Zabbix",severity:"medium",age:310,description:"Presión de memoria disponible",service:"Proceso Cobalto",host:"cobalto-cache-01",group:"Infraestructura",state:"Activo",value:"84 %",unit:"Uso de memoria"},
 {id:"D-1034",source:"Dynatrace",severity:"low",age:290,description:"Cambio de versión registrado",service:"Flujo Aurora",host:"aurora-node-01",group:"Aplicaciones",state:"Activo",value:"v2.8",unit:"Versión de ejemplo"},
 {id:"Z-2033",source:"Zabbix",severity:"low",age:320,description:"Variación de latencia en enlace",service:"Interfaz Boreal",host:"boreal-net-01",group:"Redes",state:"Activo",value:"28 ms",unit:"Latencia de red"},
 {id:"D-1032",source:"Dynatrace",severity:"low",age:350,description:"Consulta de base con mayor duración",service:"Tareas Estela",host:"estela-db-01",group:"Base de datos",state:"Activo",value:"420 ms",unit:"Duración de consulta"},
 {id:"Z-2031",source:"Zabbix",severity:"medium",age:340,description:"Espacio libre de base en descenso",service:"Tareas Estela",host:"estela-db-01",group:"Base de datos",state:"En análisis",value:"18 %",unit:"Espacio libre"}
];
const resources=[{host:"aurora-node-01",service:"Flujo Aurora",cpu:72,memory:78,disk:96},{host:"cobalto-node-03",service:"Proceso Cobalto",cpu:87,memory:68,disk:51},{host:"boreal-api-02",service:"Interfaz Boreal",cpu:66,memory:84,disk:62},{host:"estela-worker-01",service:"Tareas Estela",cpu:57,memory:59,disk:43},{host:"duna-auth-01",service:"Acceso Duna",cpu:42,memory:63,disk:37},{host:"cobalto-cache-01",service:"Proceso Cobalto",cpu:39,memory:84,disk:29}];
const services=[...new Set(events.map(e=>e.service))];
const state={host:"all",hiddenSeries:[],sort:"severity",sortDirection:1,view:"events",period:360,source:"all",severity:"all",service:"all",group:"all",search:"",resource:"cpu",top:5};
const $=selector=>document.querySelector(selector);
const esc=value=>String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
const pill=s=>`<span class="sev ${s}">${severityMeta[s].symbol} ${severityMeta[s].label}</span>`;
const sourceTag=s=>`<span class="source-tag ${s.toLowerCase()}">${s}</span>`;
const periodLabel=()=>state.period===60?"Última hora":state.period===360?"Últimas 6 horas":"Últimas 24 horas";

function visibleEvents(ignoreSeverity=false) {
  const q=state.search.trim().toLocaleLowerCase("es");
  return events.filter(e=>e.age<=state.period&&(state.source==="all"||e.source===state.source)&&(ignoreSeverity||state.severity==="all"||e.severity===state.severity)&&(state.service==="all"||e.service===state.service)&&(state.group==="all"||e.group===state.group)&&(!q||`${e.id} ${e.description} ${e.service} ${e.host}`.toLocaleLowerCase("es").includes(q)))
    .sort((a,b)=>state.sortDirection*(state.sort==="age"?a.age-b.age:Object.keys(severityMeta).indexOf(a.severity)-Object.keys(severityMeta).indexOf(b.severity)));
}
function hrefFor(overrides={}) {
  const s={...state,...overrides};
  const p=new URLSearchParams({view:s.view,"var-service":s.service,"var-host":s.host,"var-severity":s.severity,"var-source":s.source,"var-group":s.group,"var-resource":s.resource,"var-top":String(s.top),"var-query":s.search,from:`now-${s.period}m`,to:"now"});
  return `?${p.toString()}`;
}
function serviceHref(service,host="all",event="") {
  return hrefFor({view:"service",service,host,severity:"all",source:"all",group:"all",search:""})+(event?`&var-event=${encodeURIComponent(event)}`:"");
}
function readURL() {
  const p=new URLSearchParams(location.search);
  const valid=(value,list,fallback="all")=>list.includes(value)?value:fallback;
  state.view=valid(p.get("view"),["events","charts","details","service"],"events");
  state.service=valid(p.get("var-service"),services);
  state.host=valid(p.get("var-host"),events.map(e=>e.host));
  state.severity=valid(p.get("var-severity"),Object.keys(severityMeta));
  state.source=valid(p.get("var-source"),["Zabbix","Dynatrace"]);
  state.group=valid(p.get("var-group"),["Aplicaciones","Infraestructura","Base de datos","Redes"]);
  state.resource=valid(p.get("var-resource"),["cpu","memory","disk"],"cpu");
  state.top=p.get("var-top")==="3"?3:5;
  state.search=p.get("var-query")||"";
  const minutes=Number((p.get("from")||"").match(/^now-(\d+)m$/)?.[1]);
  state.period=[60,360,1440].includes(minutes)?minutes:360;
}
function syncURL(){history.replaceState(history.state,"",hrefFor());}

function sameService(service){return events.filter(e=>e.service===service&&e.age<=state.period);}
function lineChart(series,{max=4000,suffix="ms",threshold=null}={}){const w=610,h=180,l=44,r=15,t=10,b=145;const x=i=>l+i*(w-l-r)/11;const y=v=>b-v/max*(b-t);let svg="";for(let i=0;i<4;i++){const v=max*i/3;svg+=`<line x1="${l}" x2="${w-r}" y1="${y(v)}" y2="${y(v)}" stroke="#e3e8ee"/><text x="${l-7}" y="${y(v)+3}" text-anchor="end" font-size="9" fill="#91a0ad">${Math.round(v*10)/10}</text>`;}if(threshold!==null)svg+=`<line x1="${l}" x2="${w-r}" y1="${y(threshold)}" y2="${y(threshold)}" stroke="#cf8f94" stroke-dasharray="4 4"/>`;series.forEach(s=>{const points=s.values.map((v,i)=>`${x(i)},${y(v)}`).join(" ");svg+=`<polyline points="${points}" fill="none" stroke="${s.color}" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>`;});const hours=state.period/60;[0,3,6,9,11].forEach((n,i)=>{const rem=hours*(1-n/11);svg+=`<text x="${x(n)}" y="168" text-anchor="middle" font-size="9" fill="#91a0ad">${i===4?"Ahora":rem<1?`−${Math.round(rem*60)} m`:`−${Math.round(rem*10)/10} h`}</text>`;});return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Series ficticias expresadas en ${suffix}">${svg}</svg>`;}
const p95=[800,910,1050,980,1450,2300,3100,3200,2600,2400,1750,1900];
const errorLine=[.4,.6,.5,.8,1.2,2.8,4.8,4.1,3.7,2.4,2.6,1.8];
const diskLine=[66,68,70,75,82,90,96,96,95,95,94,94];
const palette=["#3274d9","#ef8a23","#33a184","#8d67bf","#d54c5c"];
const apdexValue=s=>s==="Flujo Aurora"?.74:s==="Interfaz Boreal"?.87:.94;
const availabilityValue=s=>({"Flujo Aurora":99.12,"Interfaz Boreal":99.85,"Tareas Estela":99.81,"Acceso Duna":99.77,"Proceso Cobalto":99.73})[s];
function latencySeries(){const selected=state.service==="all"?["Flujo Aurora","Interfaz Boreal","Acceso Duna"]:[state.service];return selected.map((service,i)=>({name:service,color:palette[i],values:p95.map((n,j)=>Math.round(n*(service==="Flujo Aurora"?1:service==="Interfaz Boreal"?.62:.37)))}));}

function eventRows(data,compact=false) {
  return data.map(e=>{
    const link=`<a class="event-desc" href="${serviceHref(e.service,e.host,e.id)}" title="Data link: abrir dashboard de servicio">${esc(e.description)} ↗</a>`;
    return compact?`<tr><td>${sourceTag(e.source)}<span class="subtext">${e.id}</span></td><td>${pill(e.severity)}</td><td>${link}<span class="subtext">${esc(e.host)} · hace ${e.age} min</span></td><td>${esc(e.value)}</td></tr>`:
      `<tr><td>${sourceTag(e.source)}</td><td>${pill(e.severity)}</td><td>${e.age} min</td><td>${link}<span class="subtext">${e.id} · ${esc(e.value)}</span></td><td>${esc(e.service)}<span class="subtext">${esc(e.host)}</span></td><td>${esc(e.group)}</td><td><span class="state ${e.state==="En análisis"?"investigating":""}">${e.state}</span></td><td><a class="row-link" href="${serviceHref(e.service,e.host,e.id)}" aria-label="Abrir ${e.id}">↗</a></td></tr>`;
  }).join("");
}
function renderKpis() {
  const data=visibleEvents(true);
  $("#kpis").innerHTML=Object.entries(severityMeta).map(([s,m])=>{
    const n=data.filter(e=>e.severity===s).length;
    return `<a class="kpi ${state.severity===s?"is-current":""}" style="--kpi-color:${m.color}" href="${hrefFor({view:"events",severity:s,host:"all"})}" title="Stat: un único data link filtra esta severidad"><span class="kpi-label">${m.symbol} Prioridad ${m.label.toLowerCase()}</span><strong class="kpi-value">${n}</strong><span class="kpi-sub">abrir señales con esta prioridad</span><span class="kpi-arrow">↗</span></a>`;
  }).join("");
}

function barRow(label,n,total,color){return `<div class="bar-row"><span>${label}</span><div class="bar-track"><div class="bar-fill" style="width:${total?n/total*100:0}%;background:${color}"></div></div><strong>${n}</strong></div>`;}
function renderSide(data){$("#source-bars").innerHTML=["Dynatrace","Zabbix"].map((s,i)=>barRow(s,data.filter(e=>e.source===s).length,data.length,i?"#dc913d":"#8f75c2")).join("");$("#severity-bars").innerHTML=Object.entries(severityMeta).map(([s,m])=>barRow(m.label,data.filter(e=>e.severity===s).length,data.length,m.color)).join("");const bins=Array(24).fill(0);data.forEach(e=>bins[Math.max(0,23-Math.floor(e.age/state.period*24))]++);$("#activity-chart").innerHTML=bins.map((n,i)=>`<i style="height:${n?Math.min(100,25+n*30):4}%" title="Intervalo ${i+1}: ${n} eventos"></i>`).join("");}
function renderDetails(data){const trigger=data.filter(e=>e.source==="Zabbix"),problem=data.filter(e=>e.source==="Dynatrace");$("#trigger-rows").innerHTML=trigger.map(e=>`<tr><td>${esc(e.description)}</td><td>${esc(e.service)}</td><td>${esc(e.host)}</td><td>${pill(e.severity)}</td><td><a class="row-link" href="${serviceHref(e.service,e.host,e.id)}" aria-label="Abrir ${e.id}">↗</a></td></tr>`).join("")||'<tr><td colspan="5" class="no-data">Sin triggers para estos filtros.</td></tr>';$("#problem-rows").innerHTML=problem.map(e=>`<tr><td>${esc(e.description)}</td><td>${esc(e.service)}</td><td>${pill(e.severity)}</td><td><a class="row-link" href="${serviceHref(e.service,e.host,e.id)}" aria-label="Abrir ${e.id}">↗</a></td></tr>`).join("")||'<tr><td colspan="4" class="no-data">Sin problemas para estos filtros.</td></tr>';const selectedServices=[...new Set(data.map(e=>e.service))];$("#relationship-rows").innerHTML=selectedServices.map(service=>{const related=sameService(service);return `<tr><td>${esc(service)}</td><td>${[...new Set(related.map(e=>e.host))].map(esc).join(", ")}</td><td>${related.filter(e=>e.source==="Zabbix").length}</td><td>${related.filter(e=>e.source==="Dynatrace").length}</td><td>Infraestructura + Aplicaciones</td><td><a class="button subtle" href="${serviceHref(service)}">Abrir servicio ↗</a></td></tr>`;}).join("")||'<tr><td colspan="6" class="no-data">Sin relaciones para estos filtros.</td></tr>';}
function resourceMarkup(){return resources.filter(r=>state.service==="all"||r.service===state.service).sort((a,b)=>b[state.resource]-a[state.resource]).slice(0,state.top).map(r=>`<div class="resource-row"><span>${r.host}</span><div class="bar-track"><div class="bar-fill" style="width:${r[state.resource]}%;background:${r[state.resource]>90?"#d54c5c":r[state.resource]>75?"#df962f":"#5095c6"}"></div></div><strong>${r[state.resource]} %</strong></div>`).join("");}
function renderCharts(){const series=latencySeries();$("#latency-chart").innerHTML=lineChart(series.filter(s=>!state.hiddenSeries.includes(s.name)));$("#latency-chart").closest(".chart-panel").querySelector(".chart-legend").innerHTML=series.map(s=>`<button type="button" class="legend-toggle ${state.hiddenSeries.includes(s.name)?"muted":""}" data-series="${s.name}" aria-pressed="${!state.hiddenSeries.includes(s.name)}"><i style="background:${s.color}"></i>${s.name}</button>`).join("");$("#resource-chart").innerHTML=resourceMarkup();const apdexServices=state.service==="all"?["Flujo Aurora","Interfaz Boreal"]:[state.service];$("#apdex-chart").innerHTML=apdexServices.map((s,i)=>{const v=apdexValue(s);return `<div class="gauge"><div class="gauge-ring" style="--gauge-value:${v*360}deg;--gauge-color:${v<.8?"#d35d6c":v<.9?"#dc983a":"#3d9f81"}"><strong>${v.toFixed(2)}</strong></div><small>${s}</small></div>`;}).join("");$("#errors-chart").innerHTML=lineChart([{values:errorLine.map(v=>state.service==="all"||state.service==="Flujo Aurora"?v:v*.4),color:"#d54c5c"}],{max:6,suffix:"%",threshold:2});$("#availability-chart").innerHTML=(state.service==="all"?services:[state.service]).map((s,i)=>{const v=availabilityValue(s);return `<div class="resource-row"><span>${s}</span><div class="bar-track"><div class="bar-fill" style="width:${v}%;background:${v<99.5?"#dc983a":"#38a180"}"></div></div><strong>${v.toFixed(2)} %</strong></div>`;}).join("");const colors=["#edf1fa","#c5d1ee","#9eb7e1","#edc98d","#e6a260","#d9767a"];$("#heatmap-chart").innerHTML=["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map((day,d)=>`<span>${day}</span>`+Array.from({length:16},(_,h)=>{const n=(d*7+h*3+(h>5&&h<12?4:0))%6;return `<i style="background:${colors[n]}" title="${day}, franja ${h+1}: ${n*3} eventos ficticios"></i>`;}).join("")).join("");}

function render() {
  const data=visibleEvents();
  $("#tab-count").textContent=data.length;
  renderKpis();
  $("#event-rows").innerHTML=eventRows(data);
  $("#event-empty").hidden=!!data.length;
  $("#row-count").textContent=`${data.length} señales · ${periodLabel()}`;
  renderSide(data);renderDetails(data);renderCharts();
  $("#questions").innerHTML=`<span class="question-label">EMPEZAR POR UNA PREGUNTA</span><a href="${hrefFor({view:"events",severity:"critical",service:"all",source:"all",group:"all",host:"all"})}">¿Qué requiere atención? ↗</a><a href="${serviceHref("Flujo Aurora")}">¿Dónde se concentra la afectación? ↗</a><a href="${serviceHref("Flujo Aurora")}">¿Qué falta observar? ↗</a>`;
  $("#scenario").href=serviceHref("Flujo Aurora");
  if(state.view==="service")serviceContext(state.service==="all"?"Flujo Aurora":state.service,new URLSearchParams(location.search).get("var-event"));
}
function setView(view,update=true) {
  state.view=view;
  document.querySelectorAll(".view").forEach(el=>el.hidden=el.id!==`view-${view}`);
  document.querySelectorAll(".tab").forEach(b=>{b.classList.toggle("active",b.dataset.view===view);if(b.dataset.view===view)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current");});
  $(".filters").hidden=view==="service";
  ["source","severity","group","search"].forEach(k=>$("#"+k).closest("label").hidden=view==="charts");
  $("#clear").hidden=view==="charts";
  document.querySelectorAll(".metric-variable").forEach(el=>el.hidden=view!=="charts");
  if(update)syncURL();
}
function serviceContext(service,eventId) {
  const data=sameService(service).filter(e=>state.host==="all"||e.host===state.host);
  const selected=data.find(e=>e.id===eventId), scenario=service==="Flujo Aurora";
  const hosts=[...new Set(data.map(e=>e.host))];
  const chart=lineChart(latencySeries());
  $("#service-content").innerHTML=`<div class="service-heading"><div><a class="back-link" href="${hrefFor({view:"events",service:"all",host:"all",severity:"all",source:"all",group:"all"})}">← Volver al radar</a><h2>${esc(service)}</h2><p>${selected?esc(selected.description):"Pregunta: ¿qué evidencia acota la afectación y cuál es la siguiente validación?"}</p></div><button class="button subtle" type="button" data-help="datalink">Data link: cómo funciona ?</button></div>
    <div class="context-tags"><span class="chip">${periodLabel()}</span>${hosts.map(h=>`<span class="chip">${esc(h)}</span>`).join("")}<span class="chip">${data.length} señales relacionadas por etiquetas</span></div>
    <div class="service-outcomes"><article><span>Respuesta técnica</span><strong class="negative">${data.some(e=>["critical","high"].includes(e.severity))?"Degradada en el ejemplo":"Desviación por revisar"}</strong><small>Latencia y errores disponibles</small></article><article><span>Resultado funcional</span><strong>Sin medición</strong><small>Un HTTP 200 no acredita una operación exitosa</small></article><article><span>Recuperación del servicio</span><strong class="pending">Por comprobar</strong><small>Requiere evidencia en el mismo periodo</small></article></div>
    <section class="panel coverage-panel"><div class="panel-title"><div><h2>Cadena parcialmente observada</h2><p>La brecha de captura permanece visible; no se interpreta como estado correcto.</p></div><button class="help" data-help="coverage" type="button" aria-label="Cobertura y límites de las fuentes">?</button></div><div class="coverage-stages"><div><span>Entrada digital</span><strong>RUM parcial</strong><small>Dynatrace</small></div><b>→</b><div><span>Aplicación</span><strong>Señales disponibles</strong><small>Dynatrace</small></div><b>→</b><div class="unknown"><span>Intermediario</span><strong>Sin telemetría</strong><small>Requiere instrumentación</small></div><b>→</b><div><span>Recursos del host</span><strong>Métricas disponibles</strong><small>Zabbix</small></div></div></section>
    <div class="context-layout service-layout"><div><section class="panel"><div class="panel-title"><h2>Aplicación · respuesta p95 (ms)</h2>${panelMenu("latency")}</div><div class="large-chart service-chart">${chart}</div></section>${scenario?`<section class="panel"><div class="panel-title"><h2>Host · ocupación de disco (%)</h2>${panelMenu("disk")}</div><div class="large-chart service-chart">${lineChart([{values:diskLine,color:"#c67e28"}],{max:100,suffix:"%",threshold:90})}</div></section>`:""}<section class="panel"><div class="panel-title"><h2>Evidencia relacionada · ${esc(service)}</h2><span class="tiny-badge">TABLE</span></div><div class="table-scroll"><table><thead><tr><th>Fuente</th><th>Prioridad</th><th>Señal y activo</th><th>Valor</th></tr></thead><tbody>${eventRows(data,true)||'<tr><td colspan="4">Sin señales en este periodo.</td></tr>'}</tbody></table></div></section></div>
    <aside class="investigation-notes"><div class="hypothesis"><h3>Lectura que orienta la revisión</h3><p>${scenario?"El disco y la aplicación presentan desviaciones en el mismo host. El almacenamiento es una hipótesis para contrastar; la coincidencia de etiquetas y tiempo no confirma causalidad.":"El servicio reúne las señales disponibles. El activo, el periodo y la evidencia de origen deben validarse antes de atribuir una causa."}</p></div><div class="review-steps"><h4>Hecho observable</h4><p>Identificador, fuente, valor y host acompañan cada señal. El periodo se conserva al navegar.</p></div><div class="review-steps"><h4>Siguiente validación</h4><p>Infraestructura comprueba el recurso; Aplicaciones revisa dependencias y diagnóstico en Dynatrace. La brecha del intermediario sigue pendiente.</p></div><div class="review-steps"><h4>Criterio de recuperación</h4><p>Confirmar respuesta técnica y recorrido funcional, además de la normalización del recurso. No cerrar por una gráfica aislada.</p></div><div class="source-actions"><button class="button" type="button" data-help="source">Profundizar en la fuente ↗</button><a class="button primary" href="${hrefFor({view:"charts",service,host:"all",source:"all",severity:"all",group:"all"})}">Comparar indicadores ↗</a></div></aside></div>`;
}
function panelMenu(metric) {
  return `<details class="panel-menu"><summary aria-label="Panel menu ${metric}">⋮</summary><div><button type="button" data-panelview="${metric}">View</button><button type="button" data-inspect="${metric}">Inspect → Data</button></div></details>`;
}
let inspectorMetric="latency";
function openInspector({title,graph,rows,label,description,firstColumn,secondColumn},metric,mode) {
  inspectorMetric=metric;
  $("#inspector-content").innerHTML=`<div class="inspector-heading"><div><small>PANEL · ${mode==="data"?"INSPECT":"VIEW"}</small><h2>${title}</h2></div><button type="button" class="close" data-close-inspector aria-label="Cerrar inspector">×</button></div><div class="inspector-tabs"><button type="button" data-inspector-tab="view" class="${mode!=="data"?"active":""}">View</button><button type="button" data-inspector-tab="data" class="${mode==="data"?"active":""}">Data</button><button class="help" type="button" data-help="inspect" aria-label="Función nativa Inspect">?</button></div><p class="context-subtitle">${state.service==="all"?"Todos los servicios":esc(state.service)} · ${periodLabel()} · datos ficticios</p><div id="inspector-view" ${mode==="data"?"hidden":""}><div class="context-chart">${graph}</div><p class="context-subtitle">${description}</p></div><div id="inspector-data" ${mode!=="data"?"hidden":""}><div class="inspector-toolbar"><span>Valores que sustentan el panel</span><button type="button" class="button" id="download-csv">Download CSV</button></div><div class="table-scroll"><table id="inspector-table"><thead><tr><th>${firstColumn}</th><th>${secondColumn}</th><th>${label}</th></tr></thead><tbody>${rows}</tbody></table></div></div><p class="native-caption">Simulación local de View e Inspect → Data. En Grafana la presentación exacta depende de la versión y del panel.</p>`;
  $("#panel-inspector").hidden=false;
  if(!$("#panel-inspector").open)$("#panel-inspector").showModal();
  $("#panel-inspector .close").focus();
  document.querySelectorAll(".panel-menu").forEach(el=>el.open=false);
}
function downloadCSV(){
  const rows=[...document.querySelectorAll("#inspector-table tr")].map(tr=>[...tr.querySelectorAll("th,td")].map(cell=>'"'+cell.textContent.replace(/"/g,'""')+'"').join(","));
  const url=URL.createObjectURL(new Blob(["\ufeff"+rows.join("\r\n")],{type:"text/csv;charset=utf-8"}));
  const a=document.createElement("a");a.href=url;a.download=`contexto-demo-${inspectorMetric}.csv`;a.click();URL.revokeObjectURL(url);
}

const metricMeta={latency:{title:"Tiempo de respuesta p95",value:"3.200",unit:"ms",source:"Dynatrace",description:"La latencia se revisa junto a errores y dependencias del servicio."},resources:{title:"Recursos de infraestructura",value:"",unit:"%",source:"Zabbix",description:"El recurso seleccionado permite contrastar saturación y comportamiento de la aplicación."},apdex:{title:"Apdex de experiencia digital",value:"0,74",unit:"índice",source:"Dynatrace",description:"El índice depende de sesiones y reglas capturadas en la fuente. Un tablero no completa la cobertura ausente."},errors:{title:"Tasa de errores HTTP",value:"4,8",unit:"%",source:"Dynatrace",description:"Los errores requieren revisar operaciones y dependencia afectadas en la fuente."},availability:{title:"Disponibilidad observada",value:"99,12",unit:"%",source:"Fuentes combinadas",description:"El ejemplo no acredita cumplimiento de un SLA: hay que definir método, ventana y cobertura."},heatmap:{title:"Actividad por día y hora",value:"126",unit:"eventos de ejemplo",source:"Eventos",description:"Agrupar eventos permite ubicar recurrencia. Una concentración no define por sí sola la causa."}};
function metricContext(metric,mode="view") {
  const m=metric==="disk"?{title:"Host · ocupación de disco",value:"96",unit:"%",description:"Evolución ilustrativa del mismo host y periodo."}:metricMeta[metric];
  const selected=state.service==="all"?(metric==="apdex"?["Flujo Aurora","Interfaz Boreal"]:services):[state.service];
  let graph="", rows="", value=m.value, unit=m.unit, label="Valor ilustrativo", firstColumn="Servicio", secondColumn="Fuente";
  const relativeTime=i=>i===11?"Ahora":`Hace ${Math.round(state.period*(1-i/11))} min`;
  if(metric==="latency") {
    const series=latencySeries(); graph=lineChart(series.filter(s=>!state.hiddenSeries.includes(s.name))); label="p95 (ms)";
    firstColumn="Tiempo relativo"; secondColumn="Servicio";
    rows=series.flatMap(s=>s.values.map((v,i)=>`<tr><td>${relativeTime(i)}</td><td>${s.name}</td><td>${v}</td></tr>`)).join("");
  } else if(metric==="disk") {
    graph=lineChart([{values:diskLine,color:"#c67e28"}],{max:100,suffix:"%",threshold:90});
    firstColumn="Tiempo relativo";secondColumn="Host";label="Disco (%)";
    rows=diskLine.map((v,i)=>`<tr><td>${relativeTime(i)}</td><td>aurora-node-01</td><td>${v}</td></tr>`).join("");
  } else if(metric==="errors") {
    const factor=state.service==="all"||state.service==="Flujo Aurora"?1:.4;
    const values=errorLine.map(v=>v*factor);
    graph=lineChart([{values,color:"#d54c5c"}],{max:6,suffix:"%",threshold:2}); label="Errores (%)";
    firstColumn="Tiempo relativo";secondColumn="Ámbito";
    rows=values.map((v,i)=>`<tr><td>${relativeTime(i)}</td><td>${state.service==="all"?"Conjunto de ejemplo":state.service}</td><td>${v.toFixed(2)}</td></tr>`).join("");
  } else if(metric==="resources") {
    firstColumn="Host";secondColumn="Servicio";
    graph=`<div class="resource-chart">${resourceMarkup()}</div>`;
    rows=resources.filter(r=>state.service==="all"||r.service===state.service).sort((a,b)=>b[state.resource]-a[state.resource]).slice(0,state.top).map(r=>`<tr><td>${r.host}</td><td>${r.service}</td><td>${r[state.resource]} %</td></tr>`).join("");
    label=({cpu:"CPU",memory:"Memoria",disk:"Disco"})[state.resource];
  } else if(metric==="heatmap") {
    const totals=Array.from({length:7},(_,d)=>Array.from({length:16},(_,h)=>((d*7+h*3+(h>5&&h<12?4:0))%6)*3).reduce((a,b)=>a+b,0));
    value=totals.reduce((a,b)=>a+b,0);unit="eventos en la semana de ejemplo";
    rows=["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].flatMap((day,d)=>Array.from({length:16},(_,h)=>`<tr><td>${day}</td><td>${h+1}</td><td>${((d*7+h*3+(h>5&&h<12?4:0))%6)*3}</td></tr>`)).join("");
    firstColumn="Día";secondColumn="Franja";label="Eventos";
  } else {
    const metricValue=s=>metric==="apdex"?apdexValue(s).toFixed(2):availabilityValue(s).toFixed(2)+" %";
    value=metricValue(state.service==="all"?"Flujo Aurora":state.service);unit=metric==="apdex"?"índice del servicio":"disponibilidad";
    graph=metric==="apdex"?`<div class="gauges">${$("#apdex-chart").innerHTML}</div>`:`<div class="resource-chart">${$("#availability-chart").innerHTML}</div>`;
    rows=selected.map(s=>`<tr><td>${s}</td><td>${m.source}</td><td>${metricValue(s)}</td></tr>`).join("");
  }
  if(!graph)graph=`<div class="metric-readout">${value}<small>${unit}</small></div>`;
  openInspector({title:m.title,graph,rows,label,description:m.description,firstColumn,secondColumn},metric,mode);
}

const help={
 guide:{title:"Preguntas que orientan esta demo",text:"El radar prioriza señales; el dashboard de servicio reúne evidencia y deja visibles las brechas. El objetivo es acotar la investigación y el siguiente paso.",items:["En este HTML la tarjeta abre una vista previa modal; puedes aplicar la prioridad al Radar.","En este HTML una evidencia abre el detalle sin cambiar de pantalla. El botón Abrir dashboard de servicio realiza la navegación explícita.","View amplía el panel; Inspect → Data muestra sus valores y permite descargar un CSV.","Los datos son ficticios. La demo no realiza consultas ni acciones en sistemas reales."]},
 events:{title:"Stat y Table con enlaces de datos",text:"En Grafana, Stat y Table abren un enlace con un clic cuando tienen un único data link. No necesitan un interruptor One click en estas visualizaciones.",items:["Las tarjetas enlazan al mismo dashboard con otra variable de severidad.","El campo de la tabla enlaza a un dashboard de servicio.","El tiempo y las variables se incluyen explícitamente en el enlace."],url:"https://grafana.com/docs/grafana/latest/visualizations/panels-visualizations/configure-data-links/"},
 datalink:{title:"Del evento a un dashboard de servicio",text:"En Grafana, el recorrido entre dashboards puede usar un data link con servicio, host y periodo. La vista previa modal y las ayudas emergentes de este HTML son características propias del prototipo.",items:["En Grafana la ruta sería /d/identificador/dashboard con var-service, var-host, from y to.","El enlace de servicio amplía la consulta a ambas fuentes para mostrar su contexto.","La unión necesita etiquetas o claves compatibles. No determina una causa automáticamente."],url:"https://grafana.com/docs/grafana/latest/visualizations/dashboards/build-dashboards/create-dashboard-url-variables/"},
 charts:{title:"Variables y controles nativos de panel",text:"Las variables cambian servicio, recurso y límite de filas. Las leyendas permiten ocultar series y el menú ofrece View e Inspect.",items:["Time series muestra evolución; Gauge y Bar gauge resumen valores.","Table conserva el detalle que sustenta el indicador.","La unidad, fórmula, umbral y cobertura deben definirse con la fuente."],url:"https://grafana.com/docs/grafana/latest/visualizations/panels-visualizations/panel-overview/"},
 inspect:{title:"View e Inspect son funciones de Grafana",text:"El menú del panel permite ampliar la visualización y abrir el inspector. Data muestra los datos recibidos por la consulta con las transformaciones aplicadas.",items:["Download CSV exporta esos datos.","Esta demo ofrece valores ficticios; no inventa tiempos de consulta ni solicitudes reales.","La disposición del inspector o de View depende de la versión instalada."],url:"https://grafana.com/docs/grafana/latest/visualizations/panels-visualizations/panel-inspector/"},
 integration:{title:"Qué permite reunir las fuentes",text:"Se necesita acceso de consulta, un modelo de datos y claves comunes. La visualización no sustituye la recolección ni la validación de los datos.",items:["El conector oficial admite Grafana Cloud Free, Advanced o Trial, o Enterprise con licencia activada. Deben comprobarse la versión y los permisos del plugin elegido.","La edición, el plugin, las API y los permisos reales deben verificarse.","El estado y la frescura de una consulta no equivalen a la salud de todo el servicio."],url:"https://grafana.com/docs/plugins/grafana-dynatrace-datasource/latest/"},
 relationship:{title:"Relacionar no es demostrar causalidad",text:"Servicio, host y periodo reúnen evidencia de ambas herramientas. Para un diagnóstico hay que contrastar la secuencia, los componentes y el dato de origen.",items:["El ejemplo relaciona señales por claves explícitas.","Una traza incompleta conserva un tramo sin observar.","La recuperación debe comprobarse en el servicio y en el recurso."],url:"https://grafana.com/docs/grafana/latest/visualizations/dashboards/variables/"},
 coverage:{title:"Límite de cobertura y resultado funcional",text:"Grafana sólo puede mostrar datos disponibles en sus fuentes. Si falta la captura de un intermediario o una regla funcional, el tablero debe indicarlo.",items:["Ausencia de datos no significa estado correcto.","Un código HTTP no acredita por sí solo que una operación de negocio finalizó.","RUM, trazas y diagnóstico de Dynatrace dependen de instrumentación, tecnología y licencia.","Esta vista no ejecuta transacciones de prueba en producción."],url:"https://docs.dynatrace.com/docs/observe/digital-experience/rum"},
 source:{title:"Continuar el análisis en la fuente",text:"Un data link puede llevar al evento o problema de origen si existe una URL contextual y el usuario tiene permiso. Esta demo no contiene enlaces a entornos reales.",items:["Dynatrace conserva su diagnóstico APM y experiencia disponibles.","Zabbix conserva el trigger, evento y la historia de recursos.","Explore permite analizar consultas en Grafana con el rol apropiado; no se supone habilitado para todos los usuarios."],url:"https://grafana.com/docs/grafana/latest/visualizations/explore/get-started-with-explore/"},
 severity:{title:"Prioridad documentada · ejemplo",text:"Estos criterios ilustran una clasificación y requieren validación con el dueño del servicio.",items:["◆ Crítica: posible interrupción o impacto alto que exige revisar evidencia.","▲ Alta: degradación relevante o riesgo de interrupción.","● Media: desviación que requiere análisis.","■ Baja: señal para seguimiento y contexto.","No son una política de severidades ni tiempos de atención aprobados."]}
};
function showHelp(key){const h=help[key];if(!h)return;$("#help-title").textContent=h.title;$("#help-content").innerHTML=`<p>${esc(h.text)}</p><ul>${h.items.map(i=>`<li>${esc(i)}</li>`).join("")}</ul>${h.url?`<p><a href="${h.url}" target="_blank" rel="noopener noreferrer">Documentación oficial ↗</a></p>`:""}`;$("#help-dialog").showModal();}
function syncControls(){$("#search").value=state.search;["source","severity","service","group","resource"].forEach(k=>$("#"+k).value=state[k]);$("#period").value=String(state.period);$("#top").value=String(state.top);}
function clearFilters(){Object.assign(state,{source:"all",severity:"all",service:"all",host:"all",group:"all",search:""});syncControls();$("#search").value="";render();syncURL();}
function init(){
  services.sort().forEach(s=>{const o=document.createElement("option");o.value=s;o.textContent=s;$("#service").append(o);});
  readURL();syncControls();
  ["source","severity","service","group"].forEach(k=>$("#"+k).addEventListener("change",e=>{state[k]=e.target.value;if(k==="service"){state.host="all";state.hiddenSeries=[];}render();syncURL();}));
  $("#period").addEventListener("change",e=>{state.period=Number(e.target.value);render();syncURL();});
  $("#search").addEventListener("input",e=>{state.search=e.target.value;render();syncURL();});
  $("#resource").addEventListener("change",e=>{state.resource=e.target.value;renderCharts();syncURL();});
  $("#top").addEventListener("change",e=>{state.top=Number(e.target.value);renderCharts();syncURL();});
  $("#clear").addEventListener("click",clearFilters);
  $("#refresh").addEventListener("click",()=>{state.period=360;state.resource="cpu";state.top=5;clearFilters();});
  ["latency","resources","apdex","errors","availability","heatmap"].forEach((metric,i)=>{const header=document.querySelectorAll(".chart-panel .panel-title")[i];header.insertAdjacentHTML("beforeend",panelMenu(metric));});
  document.addEventListener("click",e=>{
    const b=e.target.closest("button");if(!b||b.disabled)return;
    if(b.dataset.view){setView(b.dataset.view);render();}
    else if(b.dataset.help)showHelp(b.dataset.help);
    else if(b.dataset.close)document.getElementById(b.dataset.close).close();
    else if(b.hasAttribute("data-close-inspector")){$("#panel-inspector").close();$("#panel-inspector").hidden=true;}
    else if(b.dataset.panelview)metricContext(b.dataset.panelview,"view");
    else if(b.dataset.inspect)metricContext(b.dataset.inspect,"data");
    else if(b.dataset.inspectorTab){const tab=b.dataset.inspectorTab;$("#inspector-view").hidden=tab!=="view";$("#inspector-data").hidden=tab!=="data";document.querySelectorAll("[data-inspector-tab]").forEach(el=>el.classList.toggle("active",el===b));}
    else if(b.id==="download-csv")downloadCSV();
    else if(b.dataset.series){const s=b.dataset.series;state.hiddenSeries=state.hiddenSeries.includes(s)?state.hiddenSeries.filter(v=>v!==s):[...state.hiddenSeries,s];renderCharts();}
    else if(b.dataset.sort){state.sortDirection=state.sort===b.dataset.sort?-state.sortDirection:1;state.sort=b.dataset.sort;render();}
  });
  render();setView(state.view,false);
}
document.addEventListener("DOMContentLoaded",init);
