/* ══ DESPESAS ══ */
let _despesaFiltro='todas'

function addDespesa(){
  const nome=document.getElementById('despesaNome').value.trim()
  const valor=parseNum(document.getElementById('despesaValor').value,0,0)
  const venc=document.getElementById('despesaVenc').value
  if(!nome){setErr('fg-dNome',true);toast('Informe a descrição.','warning');return}
  setErr('fg-dNome',false)
  if(!valor){setErr('fg-dValor',true);toast('Informe o valor.','warning');return}
  setErr('fg-dValor',false)
  if(!venc){toast('Informe o vencimento.','warning');return}
  despesas.push({
    nome,valor,venc,
    categoria:document.getElementById('despesaCategoria').value,
    fornecedor:document.getElementById('despesaFornecedor').value,
    recorrente:document.getElementById('despesaRecorrente').value,
    obs:document.getElementById('despesaObs').value.trim(),
    paga:false,dataPagamento:null
  })
  ;['despesaNome','despesaValor','despesaVenc','despesaObs'].forEach(id=>document.getElementById(id).value='')
  toast('✅ Despesa "'+nome+'" cadastrada!')
  save()
}

function pagarDespesa(i){
  despesas[i].paga=true
  despesas[i].dataPagamento=hoje()
  toast('✅ Despesa marcada como paga!')
  save()
}

function despagarDespesa(i){
  despesas[i].paga=false
  despesas[i].dataPagamento=null
  toast('↺ Despesa marcada como pendente.','info')
  save()
}

function excluirDespesa(i){
  const n=despesas[i].nome
  showConfirm('Excluir a despesa "'+escHtml(n)+'"?',()=>{
    despesas.splice(i,1)
    toast('🗑️ Despesa removida.','info')
    save()
  })
}

function setDespesaFiltro(f,btn){
  _despesaFiltro=f
  document.querySelectorAll('#despesas .filter-btn').forEach(b=>b.classList.remove('active'))
  if(btn)btn.classList.add('active')
  renderDespesas()
}

function renderDespesas(){
  const hj=hoje()
  const em3=new Date();em3.setDate(em3.getDate()+3)
  const em3str=em3.toISOString().split('T')[0]

  // Stats
  const vencidas=despesas.filter(d=>!d.paga&&d.venc<hj)
  const aVencer=despesas.filter(d=>!d.paga&&d.venc>=hj&&d.venc<=em3str)
  const pendentes=despesas.filter(d=>!d.paga)
  const pagasMes=despesas.filter(d=>d.paga&&d.dataPagamento&&d.dataPagamento.slice(0,7)===hj.slice(0,7))
  const el=id=>document.getElementById(id)
  if(el('dStatVencidas'))el('dStatVencidas').textContent=vencidas.length
  if(el('dStatAVencer'))el('dStatAVencer').textContent=aVencer.length
  if(el('dStatTotal'))el('dStatTotal').textContent=brl(pendentes.reduce((t,d)=>t+d.valor,0))
  if(el('dStatPagas'))el('dStatPagas').textContent=brl(pagasMes.reduce((t,d)=>t+d.valor,0))

  // Filtro
  let lista=[...despesas].map((d,i)=>({...d,_i:i}))
  if(_despesaFiltro==='pendentes')lista=lista.filter(d=>!d.paga)
  else if(_despesaFiltro==='vencidas')lista=lista.filter(d=>!d.paga&&d.venc<hj)
  else if(_despesaFiltro==='pagas')lista=lista.filter(d=>d.paga)
  else if(_despesaFiltro==='mes')lista=lista.filter(d=>d.venc.slice(0,7)===hj.slice(0,7))
  lista.sort((a,b)=>a.venc>b.venc?1:a.venc<b.venc?-1:0)

  const cnt=el('cntDespesas');if(cnt)cnt.textContent=lista.length
  const b=el('despesasBody');if(!b)return
  if(!lista.length){b.innerHTML='<tr><td colspan="7"><div class="empty-state"><span class="empty-icon">📋</span>Nenhuma despesa</div></td></tr>';return}

  b.innerHTML=lista.map(d=>{
    const i=d._i
    const vencida=!d.paga&&d.venc<hj
    const urgente=!d.paga&&d.venc>=hj&&d.venc<=em3str
    let statusBadge,rowStyle=''
    if(d.paga)statusBadge='<span class="badge badge-green">✅ Paga</span>'
    else if(vencida){statusBadge='<span class="badge badge-red">🔴 Vencida</span>';rowStyle='background:var(--red-dim)'}
    else if(urgente){statusBadge='<span class="badge badge-yellow">⚠️ Vence em breve</span>';rowStyle='background:var(--yellow-dim)'}
    else statusBadge='<span class="badge badge-blue">⏳ Pendente</span>'
    const acoes=d.paga
      ?'<button class="btn btn-ghost btn-sm" onclick="despagarDespesa('+i+');event.stopPropagation()">↺</button><button class="btn btn-warning btn-sm" onclick="editarDespesa('+i+');event.stopPropagation()">Editar</button><button class="btn btn-danger btn-sm" onclick="excluirDespesa('+i+');event.stopPropagation()">Excluir</button>'
      :'<button class="btn btn-success btn-sm" onclick="pagarDespesa('+i+');event.stopPropagation()" title="Marcar como paga">✔ Pagar</button><button class="btn btn-warning btn-sm" onclick="editarDespesa('+i+');event.stopPropagation()">Editar</button><button class="btn btn-danger btn-sm" onclick="excluirDespesa('+i+');event.stopPropagation()">Excluir</button>'
    return'<tr class="tr-click" onclick="abrirDetalheDespesa('+i+')" style="'+rowStyle+'">'+
      '<td>'+escHtml(d.nome)+(d.obs?'<div style="font-size:11px;color:var(--text-muted)">'+escHtml(d.obs)+'</div>':'')+'</td>'+
      '<td><span class="badge badge-purple">'+escHtml(d.categoria||'Outro')+'</span></td>'+
      '<td class="td-mono">'+brl(d.valor)+'</td>'+
      '<td class="td-mono td-muted">'+fmtData(d.venc)+(d.recorrente?'<div style="font-size:10px;color:var(--text-muted)">'+escHtml(d.recorrente)+'</div>':'')+'</td>'+
      '<td>'+statusBadge+'</td>'+
      '<td class="td-muted">'+(d.fornecedor?escHtml(d.fornecedor):'—')+'</td>'+
      '<td><div class="td-actions" onclick="event.stopPropagation()">'+acoes+'</div></td>'+
    '</tr>'
  }).join('')
}

function renderAgendaAlert(){
  const hj=hoje()
  const al=document.getElementById('agendaAlert')
  const title=document.getElementById('agendaAlertTitle')
  const list=document.getElementById('agendaAlertList')
  if(!al||!title||!list)return
  // Eventos de hoje não concluídos
  const hoje_evs=agenda.filter(e=>e.data===hj&&!e.concluido)
    .sort((a,b)=>(a.hora||'')>(b.hora||'')?1:-1)
  if(!hoje_evs.length){al.style.display='none';return}
  al.style.display='block'
  title.textContent=hoje_evs.length+' evento'+(hoje_evs.length>1?'s':'')+' hoje'
  list.innerHTML=hoje_evs.map(e=>{
    const tipo=_agendaTipoPorId(e.tipo)
    return'<div style="font-size:12px;color:var(--text-dim);display:flex;align-items:center;gap:6px">'+
      '<span>'+tipo.icone+'</span>'+
      (e.hora?'<span style="font-family:JetBrains Mono,monospace;color:var(--accent);font-size:11px">'+e.hora+'</span>':'')+
      '<span>'+escHtml(e.titulo)+(e.clienteNome?' · <span style="color:var(--text-muted)">'+escHtml(e.clienteNome)+'</span>':'')+'</span>'+
    '</div>'
  }).join('')
}

function renderDespesasAlert(){
  const hj=hoje()
  const em3=new Date();em3.setDate(em3.getDate()+3)
  const em3str=em3.toISOString().split('T')[0]
  const vencidas=despesas.filter(d=>!d.paga&&d.venc<hj)
  const urgentes=despesas.filter(d=>!d.paga&&d.venc>=hj&&d.venc<=em3str)
  const al=document.getElementById('despesasAlert')
  const txt=document.getElementById('despesasAlertText')
  if(!al||!txt)return
  if(!vencidas.length&&!urgentes.length){al.style.display='none';return}
  al.style.display='block'
  const partes=[]
  if(vencidas.length)partes.push(vencidas.length+' despesa(s) vencida(s) — '+brl(vencidas.reduce((t,d)=>t+d.valor,0)))
  if(urgentes.length)partes.push(urgentes.length+' vence(m) em até 3 dias')
  txt.textContent=partes.join(' · ')
}

/* ══ DETALHE DESPESA ══ */
function abrirDetalheDespesa(i){
  const d=despesas[i]
  const hj=hoje()
  const em3=new Date();em3.setDate(em3.getDate()+3)
  const em3str=em3.toISOString().split('T')[0]
  document.getElementById('ddNome').textContent=d.nome
  let badge
  if(d.paga)badge='<span class="badge badge-green">✅ Paga</span>'
  else if(d.venc<hj)badge='<span class="badge badge-red">🔴 Vencida</span>'
  else if(d.venc<=em3str)badge='<span class="badge badge-yellow">⚠️ Vence em breve</span>'
  else badge='<span class="badge badge-blue">⏳ Pendente</span>'
  document.getElementById('ddStatusBadge').innerHTML=badge
  document.getElementById('ddCards').innerHTML=
    '<div style="background:var(--surface3);border:1px solid var(--border2);border-radius:var(--radius);padding:12px 14px"><div style="font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:var(--text-muted);margin-bottom:4px">Valor</div><div style="font-family:\'JetBrains Mono\',monospace;font-size:22px;font-weight:700;color:var(--red)">'+brl(d.valor)+'</div></div>'+
    '<div style="background:var(--surface3);border:1px solid var(--border2);border-radius:var(--radius);padding:12px 14px"><div style="font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:var(--text-muted);margin-bottom:4px">Vencimento</div><div style="font-family:\'JetBrains Mono\',monospace;font-size:22px;font-weight:700;color:var(--accent)">'+fmtData(d.venc)+'</div></div>'
  const extras=[]
  if(d.categoria)extras.push('<span style="color:var(--text-muted)">Categoria:</span> <strong>'+escHtml(d.categoria)+'</strong>')
  if(d.fornecedor)extras.push('<span style="color:var(--text-muted)">Fornecedor:</span> <strong>'+escHtml(d.fornecedor)+'</strong>')
  if(d.recorrente)extras.push('<span style="color:var(--text-muted)">Recorrência:</span> <strong>'+escHtml(d.recorrente)+'</strong>')
  if(d.obs)extras.push('<span style="color:var(--text-muted)">Observação:</span> '+escHtml(d.obs))
  if(d.paga&&d.dataPagamento)extras.push('<span style="color:var(--text-muted)">Paga em:</span> <strong>'+fmtData(d.dataPagamento)+'</strong>')
  document.getElementById('ddExtras').innerHTML=extras.join('<br>')||'<span style="color:var(--text-muted)">Sem informações adicionais.</span>'
  const acoes=document.getElementById('ddAcoes')
  acoes.innerHTML=''
  const btnFechar=document.createElement('button')
  btnFechar.className='btn btn-ghost';btnFechar.textContent='Fechar'
  btnFechar.onclick=closeModalDespesaDet
  acoes.appendChild(btnFechar)
  if(!d.paga){
    const btnPagar=document.createElement('button')
    btnPagar.className='btn btn-success';btnPagar.textContent='✔ Marcar como paga'
    btnPagar.onclick=()=>{pagarDespesa(i);closeModalDespesaDet()}
    acoes.appendChild(btnPagar)
  }
  const btnEditar=document.createElement('button')
  btnEditar.className='btn btn-warning';btnEditar.textContent='Editar'
  btnEditar.onclick=()=>{closeModalDespesaDet();editarDespesa(i)}
  acoes.appendChild(btnEditar)
  document.getElementById('modalDespesaDet').classList.add('open')
}
function closeModalDespesaDet(){document.getElementById('modalDespesaDet').classList.remove('open')}
document.getElementById('modalDespesaDet')?.addEventListener('click',e=>{if(e.target===document.getElementById('modalDespesaDet'))closeModalDespesaDet()})

/* ══ EDITAR DESPESA ══ */
let _editDespIdx=null
function editarDespesa(i){
  _editDespIdx=i
  const d=despesas[i]
  document.getElementById('edNome').value=d.nome
  document.getElementById('edValor').value=d.valor
  document.getElementById('edVenc').value=d.venc
  document.getElementById('edCategoria').value=d.categoria||'Outro'
  document.getElementById('edRecorrente').value=d.recorrente||''
  document.getElementById('edObs').value=d.obs||''
  // Populate fornecedor select
  const fs=document.getElementById('edFornecedor')
  fs.innerHTML='<option value="">— Nenhum —</option>'+fornecedores.map(f=>'<option value="'+escHtml(f.nome)+'"'+(f.nome===d.fornecedor?' selected':'')+'>'+escHtml(f.nome)+'</option>').join('')
  document.getElementById('modalEditDespesa').classList.add('open')
}
function salvarEditDespesa(){
  if(_editDespIdx===null)return
  const nome=document.getElementById('edNome').value.trim()
  const valor=parseNum(document.getElementById('edValor').value,0,0)
  const venc=document.getElementById('edVenc').value
  if(!nome){toast('⚠️ Informe a descrição.','warning');return}
  if(!valor){toast('⚠️ Informe o valor.','warning');return}
  if(!venc){toast('⚠️ Informe o vencimento.','warning');return}
  const orig=despesas[_editDespIdx]
  despesas[_editDespIdx]={
    ...orig,nome,valor,venc,
    categoria:document.getElementById('edCategoria').value,
    fornecedor:document.getElementById('edFornecedor').value,
    recorrente:document.getElementById('edRecorrente').value,
    obs:document.getElementById('edObs').value.trim()
  }
  closeEditDespesa()
  toast('✅ Despesa "'+nome+'" atualizada!')
  save()
}
function closeEditDespesa(){document.getElementById('modalEditDespesa').classList.remove('open');_editDespIdx=null}
document.getElementById('modalEditDespesa')?.addEventListener('click',e=>{if(e.target===document.getElementById('modalEditDespesa'))closeEditDespesa()})

