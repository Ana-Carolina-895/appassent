function openModalVenda(v){
  _vendaAtual=v
  document.getElementById('mvId').textContent=v.id||'—'
  const sinalInfo=v.sinal?'<br>💰 Sinal pago: <b>'+brl(v.sinal.valor)+'</b> via '+escHtml(v.sinal.forma)+'<br>🔖 Restante: <b>'+brl(v.sinal.restante)+'</b> — vence '+fmtData(v.sinal.venc):''
  document.getElementById('mvMeta').innerHTML='Cliente: <b>'+escHtml(v.cliente||'Não informado')+'</b><br>Data: '+fmtData(v.data)+(v.formaPagamento?'<br>Pagamento: <b>'+escHtml(v.formaPagamento)+'</b>':'')+sinalInfo
  const obsWrap=document.getElementById('mvObsWrap')
  if(v.obs){obsWrap.style.display='block';document.getElementById('mvObs').textContent=v.obs}else obsWrap.style.display='none'
  let sb=0,sd=0,sc=0
  document.getElementById('mvItensBody').innerHTML=(v.itens||[]).map(it=>{
    const bruto=it.preco*it.qtd,desc=clamp(it.desconto||0),dv=bruto*(desc/100),total=bruto-dv,custo=(it.custo||0)*it.qtd
    sb+=bruto;sd+=dv;sc+=custo
    const tipoBadge=it.tipo==='servico'?'<span class="servico-badge" style="margin-left:4px;font-size:10px">🎯</span>':'<span class="badge badge-blue" style="margin-left:4px;font-size:10px">📦</span>'
    return'<tr><td>'+escHtml(it.produto||'—')+tipoBadge+'</td><td>'+it.qtd+'</td><td class="td-mono">'+brl(it.preco)+'</td><td class="td-mono td-muted">'+brl(it.custo||0)+'</td><td>'+(desc>0?'<span class="badge badge-yellow">'+desc+'%</span>':'—')+'</td><td class="td-mono">'+brl(total)+'</td></tr>'
  }).join('')
  const total=sb-sd
  document.getElementById('mvTotals').innerHTML=
    '<div class="vd-tot-item"><span class="vd-tot-label">Subtotal</span><span class="vd-tot-value">'+brl(sb)+'</span></div>'+
    '<div class="vd-tot-item"><span class="vd-tot-label">Descontos</span><span class="vd-tot-value hi-yellow">'+brl(sd)+'</span></div>'+
    '<div class="vd-tot-item"><span class="vd-tot-label">Custo total</span><span class="vd-tot-value hi-red">'+brl(sc)+'</span></div>'+
    '<div class="vd-tot-item"><span class="vd-tot-label">Total</span><span class="vd-tot-value hi-green">'+brl(total)+'</span></div>'+
    '<div class="vd-tot-item"><span class="vd-tot-label">Lucro est.</span><span class="vd-tot-value hi-indigo">'+brl(total-sc)+'</span></div>'
  document.getElementById('modalVenda').classList.add('open')
}
function closeModalVenda(){document.getElementById('modalVenda').classList.remove('open')}
document.getElementById('modalVenda').addEventListener('click',e=>{if(e.target===document.getElementById('modalVenda'))closeModalVenda()})

/* ══ MODAL EDITAR VENDA ══ */
let _evIdx=null,_evItens=[]
function editarVenda(i,e){
  e&&e.stopPropagation();const v=vendas[i];_evIdx=i
  _evItens=JSON.parse(JSON.stringify(v.itens||[]))
  document.getElementById('evId').textContent=v.id||''
  document.getElementById('evCliente').innerHTML='<option value="">— Sem cliente —</option>'+clientes.map(c=>'<option'+(c.nome===(v.cliente||'')?' selected':'')+'>'+escHtml(c.nome)+'</option>').join('')
  document.getElementById('evData').value=v.data||''
  document.getElementById('evObs').value=v.obs||''
  document.getElementById('evFormaPgto').value=v.formaPagamento||''
  const evVend=document.getElementById('evVendedor')
  evVend.innerHTML='<option value="">— Nenhum —</option>'+vendedores.map(vv=>'<option value="'+escHtml(vv.nome)+'"'+(vv.nome===(v.vendedor||'')?' selected':'')+'>'+escHtml(vv.nome)+'</option>').join('')
  atualizarEvAddProduto();renderEvItens()
  document.getElementById('modalEditVenda').classList.add('open')
}
function closeEditVenda(){document.getElementById('modalEditVenda').classList.remove('open');_evIdx=null;_evItens=[]}
document.getElementById('modalEditVenda').addEventListener('click',e=>{if(e.target===document.getElementById('modalEditVenda'))closeEditVenda()})
function atualizarEvAddProduto(){
  document.getElementById('evAddProduto').innerHTML=produtos.map((p,i)=>'<option value="'+i+'">'+escHtml(p.nome)+' — '+brl(p.preco)+'</option>').join('')
  document.getElementById('evAddServico').innerHTML=servicos.map((s,i)=>'<option value="'+i+'">'+escHtml(s.nome)+' — '+brl(s.preco)+'</option>').join('')
  onEvAddTipoChange()
}
function onEvAddTipoChange(){
  const tipo=document.getElementById('evAddTipo').value
  document.getElementById('evAddProduto').style.display=tipo==='produto'?'':'none'
  document.getElementById('evAddServico').style.display=tipo==='servico'?'':'none'
}
function renderEvItens(){
  const b=document.getElementById('evItensBody')
