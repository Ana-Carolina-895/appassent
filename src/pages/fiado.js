function renderFiado(){
  const hj=hoje()
  const fiadoVendas=vendas.map((v,_i)=>({...v,_realIdx:_i})).filter(v=>v.fiado)
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
    const i=v._realIdx
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
