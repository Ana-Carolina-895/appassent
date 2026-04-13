/* ══ CAIXA DIÁRIO ══ */
function getCaixaHojeAberto(){return caixas.find(c=>c.data===hoje()&&c.status==='aberto')||null}
function getCaixaHojeAbertoIdx(){return caixas.findIndex(c=>c.data===hoje()&&c.status==='aberto')}

function openModalAbrirCaixa(){
  if(getCaixaHojeAberto()){toast('Caixa já está aberto hoje.','warning');return}
  if(caixas.find(c=>c.data===hoje()&&c.status==='fechado')){toast('Já existe um caixa fechado para hoje.','warning');return}
  document.getElementById('aberturaFundo').value=''
  document.getElementById('modalAbrirCaixa').classList.add('open')
}
function closeModalAbrirCaixa(){document.getElementById('modalAbrirCaixa').classList.remove('open')}
document.getElementById('modalAbrirCaixa').addEventListener('click',e=>{if(e.target===document.getElementById('modalAbrirCaixa'))closeModalAbrirCaixa()})
function confirmarAberturaCaixa(){
  const fundo=parseNum(document.getElementById('aberturaFundo').value,0,0)
  caixas.push({data:hoje(),status:'aberto',abertura:new Date().toISOString(),saldoAbertura:fundo,fechamento:null,movimentacoes:[],valorContado:null,diferencaCaixa:null,obsFechamento:''})
  closeModalAbrirCaixa();toast('Caixa aberto! Fundo: '+brl(fundo));save()
}

// Apenas Dinheiro é considerado físico para conferência de caixa.
// Pix, cartão etc. ficam fora do saldo esperado no gaveto.
const PGTO_FISICO=['Dinheiro']

function calcCaixa(c){
  const vendasDia=vendas.filter(v=>v.data===c.data)
  const totalVendas=vendasDia.reduce((t,v)=>t+(v.total||0),0)
  // vendas por forma de pagamento
  const porPgto={}
  vendasDia.forEach(v=>{const fp=v.formaPagamento||'Não informado';porPgto[fp]=(porPgto[fp]||0)+(v.total||0)})
  // apenas dinheiro físico
  const vendasFisico=vendasDia.filter(v=>PGTO_FISICO.includes(v.formaPagamento)).reduce((t,v)=>t+(v.total||0),0)
  const aportes=(c.movimentacoes||[]).filter(m=>m.tipo==='aporte').reduce((t,m)=>t+m.valor,0)
  const sangrias=(c.movimentacoes||[]).filter(m=>m.tipo==='sangria').reduce((t,m)=>t+Math.abs(m.valor),0)
  // saldo esperado no caixa físico = fundo + vendas em dinheiro/pix + aportes − sangrias
  const saldoEsperado=(c.saldoAbertura||0)+vendasFisico+aportes-sangrias
  return{totalVendas,porPgto,vendasFisico,aportes,sangrias,saldoEsperado,qtdVendas:vendasDia.length}
}

function atualizarDiferenca(){
  const idx=getCaixaHojeAbertoIdx();if(idx<0)return
  const r=calcCaixa(caixas[idx])
  const contado=parseNum(document.getElementById('fechaContado').value,null)
  const difEl=document.getElementById('caixaDiferenca')
  if(contado===null){difEl.textContent='—';difEl.style.color='';return}
  const dif=contado-r.saldoEsperado
  const cls=dif>0.005?'diferenca-pos':dif<-0.005?'diferenca-neg':'diferenca-zero'
  difEl.textContent=(dif>=0?'+':'')+brl(dif)
  difEl.className=cls
}

function fecharCaixa(){
  const idx=getCaixaHojeAbertoIdx();if(idx<0){toast('Nenhum caixa aberto.','warning');return}
  const r=calcCaixa(caixas[idx])
  const contado=parseNum(document.getElementById('fechaContado').value,0,0)
  const obs=document.getElementById('fechaObs').value.trim()
  const dif=contado-r.saldoEsperado
  showConfirm('Fechar o caixa de hoje? Diferença: '+(dif>=0?'+':'')+brl(dif)+'. Esta ação não pode ser desfeita.',()=>{
    caixas[idx]={...caixas[idx],status:'fechado',fechamento:new Date().toISOString(),valorContado:contado,diferencaCaixa:dif,obsFechamento:obs}
    document.getElementById('fechaContado').value='';document.getElementById('fechaObs').value=''
    toast('🔒 Caixa fechado com sucesso!');save()
  },'Fechar caixa','Sim, fechar','btn-danger')
}

function registrarSangria(){
  const idx=getCaixaHojeAbertoIdx();if(idx<0){toast('Abra o caixa antes.','warning');return}
  const val=parseNum(document.getElementById('sangriaValor').value,0,0);if(val<=0){toast('Informe um valor válido.','warning');return}
  caixas[idx].movimentacoes.push({tipo:'sangria',desc:document.getElementById('sangriaObs').value.trim()||'Sangria',valor:val,ts:Date.now()})
  document.getElementById('sangriaValor').value='';document.getElementById('sangriaObs').value=''
  toast('Sangria de '+brl(val)+' registrada.');save()
}

function registrarAporte(){
  const idx=getCaixaHojeAbertoIdx();if(idx<0){toast('Abra o caixa antes.','warning');return}
  const val=parseNum(document.getElementById('aporteValor').value,0,0);if(val<=0){toast('Informe um valor válido.','warning');return}
  caixas[idx].movimentacoes.push({tipo:'aporte',desc:document.getElementById('aporteObs').value.trim()||'Aporte',valor:val,ts:Date.now()})
  document.getElementById('aporteValor').value='';document.getElementById('aporteObs').value=''
  toast('Aporte de '+brl(val)+' registrado.');save()
}

function renderCaixa(){
  const statusEl=document.getElementById('caixaStatusCard'),opsEl=document.getElementById('caixaOperacoes')
  const cHoje=getCaixaHojeAberto(),idxHoje=getCaixaHojeAbertoIdx()

  if(cHoje){
    const r=calcCaixa(cHoje)
    // bloco por forma de pgto
    const pgtoHtml=Object.entries(r.porPgto).map(([fp,val])=>'<div class="caixa-pgto-item"><div class="caixa-pgto-label">'+escHtml(fp)+'</div><div class="caixa-pgto-val" style="color:var(--accent)">'+brl(val)+'</div></div>').join('')
    statusEl.innerHTML='<div class="caixa-status-card aberto">'+
      '<div class="caixa-header">'+
        '<div><h2 style="color:var(--green)">🔓 Caixa aberto</h2><p>'+fmtData(cHoje.data)+' · aberto às '+new Date(cHoje.abertura).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})+(cHoje.saldoAbertura?' · fundo: '+brl(cHoje.saldoAbertura):'')+'</p></div>'+
      '</div>'+
      '<div class="caixa-nums">'+
        '<div class="caixa-num"><span class="caixa-num-label">Vendas ('+r.qtdVendas+')</span><span class="caixa-num-val" style="color:var(--green)">'+brl(r.totalVendas)+'</span></div>'+
        '<div class="caixa-num"><span class="caixa-num-label">Aportes</span><span class="caixa-num-val" style="color:var(--accent)">'+brl(r.aportes)+'</span></div>'+
        '<div class="caixa-num"><span class="caixa-num-label">Sangrias</span><span class="caixa-num-val" style="color:var(--red)">'+brl(r.sangrias)+'</span></div>'+
        '<div class="caixa-num"><span class="caixa-num-label">Saldo físico esperado</span><span class="caixa-num-val" style="color:var(--yellow)">'+brl(r.saldoEsperado)+'</span></div>'+
      '</div>'+
      (pgtoHtml?'<div class="caixa-pgto-grid">'+pgtoHtml+'</div>':'')+
    '</div>'
    // atualiza saldo esperado no painel de fechamento
    document.getElementById('caixaSaldoEsperado').textContent=brl(r.saldoEsperado)
    atualizarDiferenca()
    opsEl.style.display='block'
    // movimentações
    const vendasDia=vendas.filter(v=>v.data===cHoje.data).sort((a,b)=>a.id>b.id?1:-1)
    const movManuais=(cHoje.movimentacoes||[]).slice().sort((a,b)=>a.ts-b.ts)
    let rows=[]
    vendasDia.forEach(v=>rows.push({icone:'🛒',desc:'Venda '+escHtml(v.id||'—')+' — '+escHtml(v.cliente||'')+(v.formaPagamento?' ('+escHtml(v.formaPagamento)+')':''),hora:'',valor:v.total,cls:'pos'}))
    movManuais.forEach(m=>rows.push({icone:m.tipo==='aporte'?'📥':'📤',desc:escHtml(m.desc),hora:new Date(m.ts).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),valor:Math.abs(m.valor),cls:m.tipo==='aporte'?'pos':'neg'}))
    document.getElementById('caixaMovBody').innerHTML=rows.length?rows.map(r=>'<div class="caixa-mov-row"><span class="caixa-mov-icon">'+r.icone+'</span><span class="caixa-mov-desc">'+r.desc+'</span><span class="caixa-mov-hora">'+r.hora+'</span><span class="caixa-mov-val '+r.cls+'">'+brl(r.valor)+'</span></div>').join(''):'<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px">Nenhuma movimentação ainda</div>'
  } else {
    const fechadoHoje=caixas.find(c=>c.data===hoje()&&c.status==='fechado')
    if(fechadoHoje){
      const r=calcCaixa(fechadoHoje)
      const dif=fechadoHoje.diferencaCaixa
      const difCls=dif>0.005?'diferenca-pos':dif<-0.005?'diferenca-neg':'diferenca-zero'
      statusEl.innerHTML='<div class="caixa-status-card fechado">'+
        '<div class="caixa-header">'+
          '<div><h2>🔒 Caixa fechado hoje</h2><p>Fechado às '+new Date(fechadoHoje.fechamento).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})+(fechadoHoje.obsFechamento?' · '+escHtml(fechadoHoje.obsFechamento):'')+'</p></div>'+
        '</div>'+
        '<div class="caixa-nums">'+
          '<div class="caixa-num"><span class="caixa-num-label">Vendas</span><span class="caixa-num-val">'+brl(r.totalVendas)+'</span></div>'+
          '<div class="caixa-num"><span class="caixa-num-label">Saldo esperado</span><span class="caixa-num-val" style="color:var(--yellow)">'+brl(r.saldoEsperado)+'</span></div>'+
          '<div class="caixa-num"><span class="caixa-num-label">Valor contado</span><span class="caixa-num-val" style="color:var(--accent)">'+brl(fechadoHoje.valorContado||0)+'</span></div>'+
          '<div class="caixa-num"><span class="caixa-num-label">Diferença</span><span class="caixa-num-val '+difCls+'">'+(dif>=0?'+':'')+brl(dif||0)+'</span></div>'+
        '</div>'+
      '</div>'
    } else {
      statusEl.innerHTML='<div class="caixa-status-card vazio" style="flex-direction:column;align-items:flex-start;gap:12px">'+
        '<div><h2>🏦 Nenhum caixa aberto</h2><p style="color:var(--text-muted)">Abra o caixa para registrar movimentações do dia.</p></div>'+
        '<button class="btn btn-success" onclick="openModalAbrirCaixa()">🔓 Abrir caixa de hoje</button>'+
      '</div>'
    }
    opsEl.style.display='none'
  }

  // histórico
  const sorted=[...caixas].map((c,i)=>({c,i})).sort((a,b)=>b.c.data>a.c.data?1:-1)
  document.getElementById('cntCaixas').textContent=sorted.length
  const b=document.getElementById('caixasBody')
  if(!sorted.length){b.innerHTML='<tr><td colspan="10"><div class="empty-state"><span class="empty-icon">🏦</span>Nenhum caixa registrado</div></td></tr>';return}
  b.innerHTML=sorted.map(({c,i})=>{
    const r=calcCaixa(c)
    const dif=c.diferencaCaixa
    const difStr=dif!==null&&dif!==undefined?(dif>=0?'+':'')+brl(dif):'—'
    const difCls=dif>0.005?'diferenca-pos':dif<-0.005?'diferenca-neg':'diferenca-zero'
    const badge=c.status==='aberto'?'<span class="badge badge-green">Aberto</span>':'<span class="badge badge-indigo">Fechado</span>'
    return'<tr class="tr-click" onclick="openModalCaixaDet('+i+')">'+
      '<td class="td-muted">'+fmtData(c.data)+'</td>'+
      '<td>'+badge+'</td>'+
      '<td class="td-mono">'+brl(c.saldoAbertura||0)+'</td>'+
      '<td class="td-mono">'+brl(r.totalVendas)+' <span class="td-muted">('+r.qtdVendas+')</span></td>'+
      '<td class="td-mono" style="color:var(--accent)">'+brl(r.aportes)+'</td>'+
      '<td class="td-mono" style="color:var(--red)">'+brl(r.sangrias)+'</td>'+
      '<td class="td-mono" style="color:var(--yellow)">'+brl(r.saldoEsperado)+'</td>'+
      '<td class="td-mono">'+(c.valorContado!==null&&c.valorContado!==undefined?brl(c.valorContado):'—')+'</td>'+
      '<td class="td-mono '+difCls+'">'+difStr+'</td>'+
      '<td><div class="td-actions" onclick="event.stopPropagation()">'+
        (c.status==='fechado'?'<button class="btn btn-ghost btn-sm" onclick="excluirCaixa('+i+')">Excluir</button>':'<button class="btn btn-danger btn-sm" onclick="fecharCaixa()">🔒 Fechar</button>')+
      '</div></td>'+
    '</tr>'
  }).join('')
}

function excluirCaixa(i){
  showConfirm('Excluir o registro do caixa de '+fmtData(caixas[i].data)+'?',()=>{caixas.splice(i,1);toast('🗑️ Registro de caixa excluído.','info');save()})
}

