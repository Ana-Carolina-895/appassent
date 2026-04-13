/* ══ FIADO / A RECEBER ══ */
let _fiadoFiltro='pendentes'

function onFormaPgtoChange(){
  const v=document.getElementById('vendaFormaPgto').value
  const fg=document.getElementById('fgFiadoVenc')
  const fs=document.getElementById('fgSinal')
  if(fg) fg.style.display=(v==='Fiado'||v==='Parcelado')?'block':'none'
  if(fs) fs.style.display=v==='Sinal'?'block':'none'
  if(v==='Sinal') atualizarRestanteSinal()
}
function atualizarRestanteSinal(){
  const sb=itensVenda.reduce((t,it)=>t+it.preco*it.qtd,0)
  const sd=itensVenda.reduce((t,it)=>t+it.preco*it.qtd*(clamp(it.desconto)/100),0)
  const total=sb-sd
  const sinal=parseFloat(document.getElementById('vendaSinalValor')?.value||0)||0
  const restante=Math.max(0,total-sinal)
  const el=document.getElementById('vendaSinalRestante')
  if(el) el.textContent=brl(restante)
}

function setFiadoFiltro(f,btn){
  _fiadoFiltro=f
  document.querySelectorAll('#fiado .filter-btn').forEach(b=>b.classList.remove('active'))
  if(btn)btn.classList.add('active')
  renderFiado()
}

function renderFiado(){
  const hj=hoje()
  const fiadoVendas=vendas.filter(v=>v.fiado)
  // Stats
  const emAberto=fiadoVendas.filter(v=>!v.fiadoRecebido)
  const vencidas=fiadoVendas.filter(v=>!v.fiadoRecebido&&v.fiadoVenc&&v.fiadoVenc<hj)
  const recebMes=fiadoVendas.filter(v=>v.fiadoRecebido&&(v.fiadoDataRecebimento||'').slice(0,7)===hj.slice(0,7))
  const clientesSet=new Set(emAberto.map(v=>v.cliente))
  const el=id=>document.getElementById(id)
  if(el('fiadoStatAberto'))el('fiadoStatAberto').textContent=brl(emAberto.reduce((t,v)=>t+(v.total||0),0))
  if(el('fiadoStatVencido'))el('fiadoStatVencido').textContent=brl(vencidas.reduce((t,v)=>t+(v.total||0),0))
  if(el('fiadoStatRecebido'))el('fiadoStatRecebido').textContent=brl(recebMes.reduce((t,v)=>t+(v.total||0),0))
  if(el('fiadoStatClientes'))el('fiadoStatClientes').textContent=clientesSet.size
  // Filtro
  let lista=fiadoVendas.slice()
  if(_fiadoFiltro==='pendentes')lista=lista.filter(v=>!v.fiadoRecebido)
  else if(_fiadoFiltro==='vencidas')lista=lista.filter(v=>!v.fiadoRecebido&&v.fiadoVenc&&v.fiadoVenc<hj)
  else if(_fiadoFiltro==='recebidas')lista=lista.filter(v=>v.fiadoRecebido)
  lista.sort((a,b)=>{
    // vencidas primeiro, depois por vencimento
    if(!a.fiadoRecebido&&a.fiadoVenc&&b.fiadoVenc) return a.fiadoVenc>b.fiadoVenc?1:-1
    return 0
  })
  const cnt=el('cntFiado');if(cnt)cnt.textContent=lista.length
  const b=el('fiadoBody');if(!b)return
  if(!lista.length){b.innerHTML='<tr><td colspan="7"><div class="empty-state"><span class="empty-icon">📒</span>Nenhum registro de fiado</div></td></tr>';return}
  b.innerHTML=lista.map(v=>{
    const i=vendas.indexOf(v)
    const vencida=!v.fiadoRecebido&&v.fiadoVenc&&v.fiadoVenc<hj
    const proximaVenc=!v.fiadoRecebido&&v.fiadoVenc
    let statusBadge,rowStyle=''
    if(v.fiadoRecebido)statusBadge='<span class="badge badge-green">✅ Recebido</span>'
    else if(vencida){statusBadge='<span class="badge badge-red">🔴 Vencido</span>';rowStyle='background:var(--red-dim)'}
    else statusBadge='<span class="fiado-badge">📒 Pendente</span>'
    const vencTxt=v.fiadoVenc?fmtData(v.fiadoVenc):'Sem data'
    return'<tr style="'+rowStyle+'">'+
      '<td><span class="badge badge-blue">'+escHtml(v.id||'—')+'</span></td>'+
      '<td><strong>'+escHtml(v.cliente||'—')+'</strong></td>'+
      '<td class="td-muted">'+fmtData(v.data)+'</td>'+
      '<td class="td-mono '+(vencida?'td-red':'td-muted')+'">'+vencTxt+'</td>'+
      '<td class="td-mono" style="font-weight:700">'+brl(v.total)+'</td>'+
      '<td>'+statusBadge+'</td>'+
      '<td><div class="td-actions">'+
        (!v.fiadoRecebido?'<button class="btn btn-success btn-sm" onclick="receberFiado('+i+')">✔ Receber</button>':'<button class="btn btn-ghost btn-sm" onclick="estornarFiado('+i+')">↺</button>')+
        '<button class="btn btn-ghost btn-sm" onclick="openModalVenda(vendas['+i+'])" title="Ver venda">👁</button>'+
      '</div></td>'+
    '</tr>'
  }).join('')
}

function receberFiado(i){
  const v=vendas[i]
  showConfirm('Confirmar recebimento de '+brl(v.total||0)+' de '+escHtml(v.cliente||'—')+'?',()=>{
    vendas[i].fiadoRecebido=true
    vendas[i].fiadoDataRecebimento=hoje()
    toast('✅ Fiado de '+brl(v.total||0)+' recebido!')
    save()
  },'Receber fiado','Confirmar','btn-success')
}

function estornarFiado(i){
  vendas[i].fiadoRecebido=false
  vendas[i].fiadoDataRecebimento=null
  toast('↺ Marcado como pendente novamente.','info')
  save()
}

function renderFiadoAlert(){
  const hj=hoje()
  const em3=new Date();em3.setDate(em3.getDate()+3);const em3str=em3.toISOString().split('T')[0]
  const vencidas=vendas.filter(v=>v.fiado&&!v.fiadoRecebido&&v.fiadoVenc&&v.fiadoVenc<hj)
  const urgentes=vendas.filter(v=>v.fiado&&!v.fiadoRecebido&&v.fiadoVenc&&v.fiadoVenc>=hj&&v.fiadoVenc<=em3str)
  const al=document.getElementById('fiadoAlert'),txt=document.getElementById('fiadoAlertText')
  if(!al||!txt)return
  if(!vencidas.length&&!urgentes.length){al.style.display='none';return}
  al.style.display='block'
  const partes=[]
  if(vencidas.length)partes.push(vencidas.length+' fiado(s) vencido(s) — '+brl(vencidas.reduce((t,v)=>t+(v.total||0),0)))
  if(urgentes.length)partes.push(urgentes.length+' vence(m) em até 3 dias')
  txt.textContent='📒 '+partes.join(' · ')
}

/* ══ CALENDÁRIO DE VENCIMENTOS ══ */
function renderDashCalendario(){
  const el=document.getElementById('dashCalendario');if(!el)return
  const hj=hoje()
  const em30=new Date();em30.setDate(em30.getDate()+30);const em30str=em30.toISOString().split('T')[0]
  // Junta despesas pendentes e fiados pendentes nos próximos 30 dias
  const itens=[]
  despesas.filter(d=>!d.paga&&d.venc&&d.venc>=hj&&d.venc<=em30str).forEach(d=>
    itens.push({tipo:'despesa',label:d.nome,valor:d.valor,venc:d.venc,cat:d.categoria||'Despesa'})
  )
  vendas.filter(v=>v.fiado&&!v.fiadoRecebido&&v.fiadoVenc&&v.fiadoVenc>=hj&&v.fiadoVenc<=em30str).forEach(v=>
    itens.push({tipo:'fiado',label:'Fiado — '+v.cliente,valor:v.total,venc:v.fiadoVenc,cat:'A Receber'})
  )
  itens.sort((a,b)=>a.venc>b.venc?1:-1)
  if(!itens.length){
    el.innerHTML='<div style="padding:12px 0;text-align:center;color:var(--text-muted);font-size:13px">Nenhum vencimento nos próximos 30 dias ✅</div>'
    return
  }
  const em3=new Date();em3.setDate(em3.getDate()+3);const em3str=em3.toISOString().split('T')[0]
  el.innerHTML=itens.slice(0,8).map(it=>{
    const vencida=it.venc<hj
    const urgente=!vencida&&it.venc<=em3str
    const cls=vencida?'vencida':urgente?'urgente':'normal'
    const icone=it.tipo==='fiado'?'📒':'📋'
    const diasRestantes=Math.round((new Date(it.venc+'T00:00:00')-new Date(hj+'T00:00:00'))/(1000*60*60*24))
    const diasLabel=diasRestantes===0?'Hoje!':diasRestantes===1?'Amanhã':diasRestantes>0?'em '+diasRestantes+'d':'há '+Math.abs(diasRestantes)+'d'
    return'<div class="cal-item '+cls+'">'+
      '<div style="display:flex;align-items:center;gap:8px;flex:1;min-width:0">'+
        '<span>'+icone+'</span>'+
        '<div style="min-width:0">'+
          '<div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+escHtml(it.label)+'</div>'+
          '<div style="font-size:10px;color:var(--text-muted)">'+escHtml(it.cat)+'</div>'+
        '</div>'+
      '</div>'+
      '<div style="text-align:right;flex-shrink:0;margin-left:10px">'+
        '<div style="font-family:\'JetBrains Mono\',monospace;font-size:12px;font-weight:600">'+(it.tipo==='fiado'?'+':'-')+brl(it.valor)+'</div>'+
        '<div style="font-size:10px;color:var(--text-muted)">'+diasLabel+'</div>'+
      '</div>'+
    '</div>'
  }).join('')+
  (itens.length>8?'<div style="padding:6px 0;text-align:center;font-size:12px;color:var(--text-muted)">…e mais '+(itens.length-8)+' vencimento(s)</div>':'')
}

