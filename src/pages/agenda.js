function _agendaGetTipos(){return agendaTipos.length?agendaTipos:AGENDA_TIPOS_DEFAULT}
function _agendaTipoPorId(id){return _agendaGetTipos().find(t=>t.id===id)||{nome:'Outro',cor:'#7A6E60',icone:'📌'}}

function _agendaFiltrarEventos(){
  const hj=hoje()
  const sorted=[...agenda].sort((a,b)=>a.data>b.data?1:a.data<b.data?-1:(a.hora||'')>(b.hora||'')?1:-1)
  if(_agendaFiltro==='hoje')return sorted.filter(e=>e.data===hj)
  if(_agendaFiltro==='semana'){const d=new Date();d.setHours(0,0,0,0);const fim=new Date(d);fim.setDate(fim.getDate()+7);return sorted.filter(e=>e.data>=hj&&e.data<=fim.toISOString().slice(0,10))}
  if(_agendaFiltro==='proximos')return sorted.filter(e=>e.data>=hj||!e.concluido)
  return sorted
}

function renderAgenda(){
  if(_agendaView==='calendario')renderCalendarioAgenda()
  else renderListaAgenda()
  _renderAgendaResumo()
}

function _renderAgendaResumo(){
  const hj=hoje()
  document.getElementById('agResHoje').textContent=agenda.filter(e=>e.data===hj).length
  const d=new Date();d.setHours(0,0,0,0);const fim=new Date(d);fim.setDate(fim.getDate()+7);const fimStr=fim.toISOString().slice(0,10)
  document.getElementById('agResSemana').textContent=agenda.filter(e=>e.data>=hj&&e.data<=fimStr).length
  document.getElementById('agResPendentes').textContent=agenda.filter(e=>!e.concluido&&e.data>=hj).length
}

function renderListaAgenda(){
  const eventos=_agendaFiltrarEventos()
  const el=document.getElementById('agendaListaBody')
  if(!el)return
  if(!eventos.length){el.innerHTML='<div class="empty-state"><span class="empty-icon">📅</span>Nenhum evento encontrado</div>';return}
  const grupos={},hj=hoje()
  eventos.forEach(e=>{if(!grupos[e.data])grupos[e.data]=[];grupos[e.data].push(e)})
  el.innerHTML=Object.entries(grupos).sort((a,b)=>a[0]>b[0]?1:-1).map(([data,evs])=>{
    const isHoje=data===hj
    return'<div class="ag-grupo"><div class="ag-grupo-label'+(isHoje?' ag-hoje-lbl':'')+'">'+(isHoje?'Hoje — ':'')+fmtData(data)+'</div>'+evs.map(e=>_renderEventoCard(e)).join('')+'</div>'
  }).join('')
}

function _renderEventoCard(e){
  const tipo=_agendaTipoPorId(e.tipo)
  return'<div class="ag-card'+(e.concluido?' ag-card-concluido':'')+'">'+
    '<div class="ag-card-left">'+
      '<span class="ag-tipo-badge" style="background:'+tipo.cor+'22;color:'+tipo.cor+';border:1px solid '+tipo.cor+'44">'+tipo.icone+' '+escHtml(tipo.nome)+'</span>'+
      (e.hora?'<span class="ag-hora">🕐 '+e.hora+'</span>':'')+
    '</div>'+
    '<div class="ag-card-body">'+
      '<div class="ag-card-titulo">'+escHtml(e.titulo)+'</div>'+
      '<div class="ag-card-meta">'+
        (e.clienteNome?'<span>👤 '+escHtml(e.clienteNome)+'</span>':'')+
        (e.vendedorNome?'<span>💼 '+escHtml(e.vendedorNome)+'</span>':'')+
        (e.vendaId?'<span>🧾 '+escHtml(e.vendaId)+'</span>':'')+
        (e.obs?'<span class="ag-obs">📝 '+escHtml(e.obs)+'</span>':'')+
      '</div>'+
    '</div>'+
    '<div class="ag-card-actions">'+
      '<button class="btn btn-ghost btn-sm" onclick="openModalDetEvento(\'' + e.id + '\')" title="Ver detalhes">👁️</button>'+
      '<button class="btn btn-ghost btn-sm" onclick="toggleEventoConcluido(\'' + e.id + '\')" title="'+(e.concluido?'Reabrir':'Concluir')+'">'+(e.concluido?'↩️':'✅')+'</button>'+
      '<button class="btn btn-ghost btn-sm" onclick="openModalEditarEvento(\'' + e.id + '\')" title="Editar">✏️</button>'+
      '<button class="btn btn-ghost btn-sm" onclick="excluirEvento(\'' + e.id + '\')" title="Excluir">🗑️</button>'+
    '</div>'+
  '</div>'
}

function renderCalendarioAgenda(){
  const el=document.getElementById('agendaCalBody');if(!el)return
  const ano=_agendaCalAno,mes=_agendaCalMes
  const primeiroDia=new Date(ano,mes,1).getDay()
  const diasNoMes=new Date(ano,mes+1,0).getDate()
  const nomes=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
  const hj=hoje()
  const nomeMes=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][mes]
  const tit=document.getElementById('agCalTitulo');if(tit)tit.textContent=nomeMes+' '+ano
  const mesStr=String(ano)+'-'+String(mes+1).padStart(2,'0')
  const evMes=agenda.filter(e=>e.data&&e.data.startsWith(mesStr))
  let html=''
  for(let i=0;i<primeiroDia;i++)html+='<div class="ag-cal-cell ag-cal-empty"></div>'
  for(let d=1;d<=diasNoMes;d++){
    const ds=String(ano)+'-'+String(mes+1).padStart(2,'0')+'-'+String(d).padStart(2,'0')
    const evDia=evMes.filter(e=>e.data===ds)
    const isHoje=ds===hj
    html+='<div class="ag-cal-cell'+(isHoje?' ag-cal-hoje':'')+'" onclick="openModalNovoEvento(\'' + ds + '\')">' +
      '<span class="ag-cal-num">'+d+'</span>'+
      evDia.slice(0,3).map(e=>{const t=_agendaTipoPorId(e.tipo);return'<div class="ag-cal-ev'+(e.concluido?' ag-cal-ev-done':'')+'" style="background:'+t.cor+'33;color:'+t.cor+'" title="'+escHtml(e.titulo)+'">'+t.icone+' '+escHtml(e.titulo.length>12?e.titulo.slice(0,12)+'…':e.titulo)+'</div>'}).join('')+
      (evDia.length>3?'<div class="ag-cal-mais">+'+(evDia.length-3)+' mais</div>':'')+
    '</div>'
  }
  el.innerHTML=html
}

function agCalNav(dir){
  _agendaCalMes+=dir
  if(_agendaCalMes>11){_agendaCalMes=0;_agendaCalAno++}
  if(_agendaCalMes<0){_agendaCalMes=11;_agendaCalAno--}
  renderCalendarioAgenda()
}

function setAgendaView(v,btn){
  _agendaView=v
  document.querySelectorAll('.ag-view-btn').forEach(b=>b.classList.remove('active'))
  if(btn)btn.classList.add('active')
  const lista=document.getElementById('agendaListaBody')
  const cal=document.getElementById('agendaCalWrap')
  if(lista)lista.style.display=v==='lista'?'block':'none'
  if(cal)cal.style.display=v==='calendario'?'block':'none'
  renderAgenda()
}

function setAgendaFiltro(f,btn){
  _agendaFiltro=f
  document.querySelectorAll('#agendaFiltros .filter-btn').forEach(b=>b.classList.remove('active'))
  if(btn)btn.classList.add('active')
  renderListaAgenda()
}

function _popularTiposSelect(){
  const sel=document.getElementById('agEvTipo');if(!sel)return
  sel.innerHTML=_agendaGetTipos().map(t=>'<option value="'+t.id+'">'+t.icone+' '+escHtml(t.nome)+'</option>').join('')
}

function _popularClientesDatalist(){
  const dl=document.getElementById('agEvClienteList');if(!dl)return
  dl.innerHTML=clientes.map(c=>'<option value="'+escHtml(c.nome)+'">').join('')
}

function _popularVendedoresSelect(){
  const sel=document.getElementById('agEvVendedor');if(!sel)return
  sel.innerHTML='<option value="">— Nenhum —</option>'+vendedores.map(v=>'<option value="'+escHtml(v.nome)+'">'+escHtml(v.nome)+'</option>').join('')
}

function openModalNovoEvento(dataPresel){
  _eventoEditIdx=null
  _popularTiposSelect();_popularClientesDatalist();_popularVendedoresSelect()
  document.getElementById('agEvTitulo').value=''
  document.getElementById('agEvData').value=dataPresel||hoje()
  document.getElementById('agEvHora').value=''
  document.getElementById('agEvCliente').value=''
  document.getElementById('agEvVendedor').value=''
  document.getElementById('agEvVendaId').value=''
  document.getElementById('agEvObs').value=''
  document.getElementById('modalAgEvTitulo').textContent='Novo evento'
  openModal('modalAgendaEvento')
}

function openModalEditarEvento(id){
  const idx=agenda.findIndex(e=>e.id===id);if(idx<0)return
  const e=agenda[idx];_eventoEditIdx=idx
  _popularTiposSelect();_popularClientesDatalist();_popularVendedoresSelect()
  document.getElementById('agEvTitulo').value=e.titulo||''
  document.getElementById('agEvTipo').value=e.tipo||''
  document.getElementById('agEvData').value=e.data||''
  document.getElementById('agEvHora').value=e.hora||''
  document.getElementById('agEvCliente').value=e.clienteNome||''
  document.getElementById('agEvVendedor').value=e.vendedorNome||''
  document.getElementById('agEvVendaId').value=e.vendaId||''
  document.getElementById('agEvObs').value=e.obs||''
  document.getElementById('modalAgEvTitulo').textContent='Editar evento'
  openModal('modalAgendaEvento')
}

function salvarEvento(){
  const titulo=document.getElementById('agEvTitulo').value.trim()
  const data=document.getElementById('agEvData').value
  const fgTitulo=document.getElementById('fg-agEvTitulo')
  const fgData=document.getElementById('fg-agEvData')
  if(fgTitulo)fgTitulo.classList.toggle('error',!titulo)
  if(!titulo)return
  if(fgData)fgData.classList.toggle('error',!data)
  if(!data)return
  if(fgTitulo)fgTitulo.classList.remove('error')
  if(fgData)fgData.classList.remove('error')
  const ev={
    id:_eventoEditIdx!==null?agenda[_eventoEditIdx].id:('ev'+Date.now()),
    titulo,tipo:document.getElementById('agEvTipo').value,data,
    hora:document.getElementById('agEvHora').value||'',
    clienteNome:document.getElementById('agEvCliente').value.trim(),
    vendedorNome:document.getElementById('agEvVendedor').value,
    vendaId:document.getElementById('agEvVendaId').value.trim(),
    obs:document.getElementById('agEvObs').value.trim(),
    concluido:_eventoEditIdx!==null?agenda[_eventoEditIdx].concluido:false,
    criadoEm:_eventoEditIdx!==null?(agenda[_eventoEditIdx].criadoEm||new Date().toISOString()):new Date().toISOString()
  }
  if(_eventoEditIdx!==null)agenda[_eventoEditIdx]=ev;else agenda.push(ev)
  closeModal('modalAgendaEvento')
  save()
  openModalDetEvento(ev.id)
}

function openModalDetEvento(id){
  const e=agenda.find(ev=>ev.id===id);if(!e)return
  const tipo=_agendaTipoPorId(e.tipo)
  const diasSemana=['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado']
  const dtObj=e.data?new Date(e.data+'T12:00:00'):null
  const diaSemana=dtObj?diasSemana[dtObj.getDay()]:''
  const el=document.getElementById('agDetConteudo')
  if(!el)return
  el.innerHTML=
    '<div style="display:flex;align-items:center;gap:10px;margin-bottom:18px">'+
      '<span style="font-size:28px">'+tipo.icone+'</span>'+
      '<div>'+
        '<div style="font-size:19px;font-weight:700;line-height:1.2">'+escHtml(e.titulo)+'</div>'+
        '<div style="margin-top:4px"><span style="background:'+tipo.cor+'22;color:'+tipo.cor+';border:1px solid '+tipo.cor+'44;font-size:11px;font-weight:600;padding:2px 10px;border-radius:99px">'+escHtml(tipo.nome)+'</span>'+(e.concluido?' <span style="background:var(--green-dim);color:var(--green);font-size:11px;font-weight:600;padding:2px 10px;border-radius:99px;margin-left:4px">✅ Concluído</span>':'')+'</div>'+
      '</div>'+
    '</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">'+
      _agDetRow('📅','Data',diaSemana+', '+fmtData(e.data))+
      (e.hora?_agDetRow('🕐','Horário',e.hora):'')+
      (e.clienteNome?_agDetRow('👤','Cliente',e.clienteNome):'')+
      (e.vendedorNome?_agDetRow('💼','Vendedor/Resp.',e.vendedorNome):'')+
      (e.vendaId?_agDetRow('🧾','Venda vinculada',e.vendaId):'')+
    '</div>'+
    (e.obs?'<div style="background:var(--surface3);border-radius:var(--radius);padding:12px 14px;margin-bottom:14px"><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--text-muted);margin-bottom:5px">📝 Observações</div><div style="font-size:13px;color:var(--text-dim);line-height:1.6">'+escHtml(e.obs)+'</div></div>':'')+
    '<div style="font-size:11px;color:var(--text-muted);margin-top:4px">Criado em: '+new Date(e.criadoEm||Date.now()).toLocaleString('pt-BR')+'</div>'
  document.getElementById('agDetEditBtn').onclick=()=>{closeModal('modalAgDetEvento');openModalEditarEvento(id)}
  document.getElementById('agDetConcluirBtn').textContent=e.concluido?'↩️ Reabrir':'✅ Concluir'
  document.getElementById('agDetConcluirBtn').onclick=()=>{toggleEventoConcluido(id);closeModal('modalAgDetEvento')}
  openModal('modalAgDetEvento')
}
function _agDetRow(icone,label,valor){
  return '<div style="background:var(--surface3);border-radius:var(--radius);padding:10px 12px">'+
    '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--text-muted);margin-bottom:3px">'+icone+' '+label+'</div>'+
    '<div style="font-size:13px;font-weight:500">'+escHtml(String(valor))+'</div>'+
  '</div>'
}
function imprimirEvento(){
  const conteudo=document.getElementById('agDetConteudo')
  if(!conteudo)return
  const win=window.open('','_blank','width=600,height=700')
  win.document.write('<html><head><title>Evento — ASSENT</title><style>'+
    'body{font-family:Arial,sans-serif;padding:32px;color:#1a1a1a;max-width:520px;margin:0 auto}'+
    'h2{margin:0 0 4px}'+
    '.badge{display:inline-block;padding:2px 10px;border-radius:99px;font-size:11px;font-weight:600;margin:4px 2px}'+
    '.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:16px 0}'+
    '.row{background:#f5f5f5;border-radius:8px;padding:10px 12px}'+
    '.row-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#666;margin-bottom:3px}'+
    '.row-val{font-size:13px;font-weight:500}'+
    '.obs{background:#f5f5f5;border-radius:8px;padding:12px 14px;margin:12px 0}'+
    '.obs-label{font-size:10px;font-weight:700;text-transform:uppercase;color:#666;margin-bottom:5px}'+
    '.footer{font-size:11px;color:#999;margin-top:16px;border-top:1px solid #eee;padding-top:12px}'+
    '@media print{body{padding:16px}}'+
  '</style></head><body>'+conteudo.innerHTML+'</body></html>')
  win.document.close()
  win.focus()
  setTimeout(()=>win.print(),400)
}
window.openModalDetEvento=openModalDetEvento
window.imprimirEvento=imprimirEvento

function excluirEvento(id){
  showConfirm('Excluir este evento?',()=>{
    const idx=agenda.findIndex(e=>e.id===id);if(idx>=0)agenda.splice(idx,1)
    toast('🗑️ Evento excluído.','info');save()
  })
}

function toggleEventoConcluido(id){
  const ev=agenda.find(e=>e.id===id);if(!ev)return
  ev.concluido=!ev.concluido
  toast(ev.concluido?'✅ Evento concluído!':'↩️ Evento reaberto.','info');save()
}

function openModalTiposAgenda(){renderTiposAgenda();openModal('modalAgendaTipos')}
window.openModalNovoEvento=openModalNovoEvento
window.openModalEditarEvento=openModalEditarEvento
window.openModalTiposAgenda=openModalTiposAgenda
window.salvarEvento=salvarEvento
window.excluirEvento=excluirEvento
window.toggleEventoConcluido=toggleEventoConcluido
window.setAgendaView=setAgendaView
window.setAgendaFiltro=setAgendaFiltro
window.agCalNav=agCalNav
window.renderTiposAgenda=renderTiposAgenda
window.salvarTipoAgenda=salvarTipoAgenda
window.excluirTipoAgenda=excluirTipoAgenda

function renderTiposAgenda(){
  const el=document.getElementById('agTiposLista');if(!el)return
  const tipos=_agendaGetTipos()
  if(!tipos.length){el.innerHTML='<div style="color:var(--text-muted);font-size:13px;padding:8px 0">Nenhum tipo cadastrado</div>';return}
  el.innerHTML=tipos.map(t=>'<div class="ag-tipo-row">'+
    '<span style="font-size:18px">'+t.icone+'</span>'+
    '<span class="badge" style="background:'+t.cor+'22;color:'+t.cor+';border:1px solid '+t.cor+'44;flex:1">'+escHtml(t.nome)+'</span>'+
    '<button class="btn btn-ghost btn-sm" onclick="excluirTipoAgenda(\'' + t.id + '\')" >🗑️</button>'+
  '</div>').join('')
}

function salvarTipoAgenda(){
  const nome=document.getElementById('agTipoNome').value.trim()
  const cor=document.getElementById('agTipoCor').value
  const icone=document.getElementById('agTipoIcone').value.trim()||'📌'
  if(!nome){toast('Informe o nome do tipo.','error');return}
  if(!agendaTipos.length)agendaTipos=[...AGENDA_TIPOS_DEFAULT]
  agendaTipos.push({id:'t'+Date.now(),nome,cor,icone})
  document.getElementById('agTipoNome').value=''
  document.getElementById('agTipoIcone').value=''
  renderTiposAgenda();_popularTiposSelect();save();toast('✅ Tipo criado!')
}

function excluirTipoAgenda(id){
  const tipos=_agendaGetTipos()
  if(tipos.length<=1){toast('Mantenha ao menos 1 tipo.','error');return}
  showConfirm('Excluir este tipo?',()=>{
    if(!agendaTipos.length)agendaTipos=[...AGENDA_TIPOS_DEFAULT]
    agendaTipos=agendaTipos.filter(t=>t.id!==id)
    renderTiposAgenda();save();toast('🗑️ Tipo removido.','info')
  })
}

