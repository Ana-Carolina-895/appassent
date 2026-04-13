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
  if(!_evItens.length)b.innerHTML='<tr><td colspan="6" style="text-align:center;padding:14px;color:var(--text-muted)">Nenhum item</td></tr>'
  else b.innerHTML=_evItens.map((it,i)=>{
    const bruto=it.preco*it.qtd,total=bruto-bruto*(clamp(it.desconto)/100)
    const ehServico=it.tipo==='servico'
    const selectOpts=ehServico
      ?servicos.map((s,si)=>'<option value="s'+si+'"'+(s.nome===it.produto?' selected':'')+'>🎯 '+escHtml(s.nome)+'</option>').join('')
      :produtos.map((p,pi)=>'<option value="p'+pi+'"'+(p.nome===it.produto?' selected':'')+'>📦 '+escHtml(p.nome)+'</option>').join('')
    return'<tr><td style="min-width:160px"><select onchange="evChangeItem('+i+',\'item\',this.value)" style="font-size:12px">'+selectOpts+'</select></td>'+
      '<td><input type="number" inputmode="numeric" value="'+it.qtd+'" min="1" step="1" style="width:60px" onchange="evChangeItem('+i+',\'qtd\',this.value)"></td>'+
      '<td class="td-mono">'+brl(it.preco)+'</td>'+
      '<td><input type="number" inputmode="decimal" value="'+clamp(it.desconto)+'" min="0" max="100" step="0.01" style="width:60px" onchange="evChangeItem('+i+',\'desconto\',this.value)"></td>'+
      '<td class="td-mono">'+brl(total)+'</td>'+
      '<td><button class="btn btn-danger btn-sm" onclick="evRemoveItem('+i+')">✕</button></td></tr>'
  }).join('')
  renderEvResumo()
}
function evChangeItem(i,campo,val){
  if(campo==='item'){
    if(val.startsWith('s')){
      const s=servicos[parseInt(val.slice(1))]
      if(s){_evItens[i].tipo='servico';_evItens[i].produto=s.nome;_evItens[i].preco=s.preco;_evItens[i].custo=s.custo||0;_evItens[i].servicoIndex=parseInt(val.slice(1));delete _evItens[i].produtoIndex}
    } else {
      const p=produtos[parseInt(val.slice(1))]
      if(p){_evItens[i].tipo='produto';_evItens[i].produto=p.nome;_evItens[i].preco=p.preco;_evItens[i].custo=p.custo||0;_evItens[i].produtoIndex=parseInt(val.slice(1));delete _evItens[i].servicoIndex}
    }
  }
  else if(campo==='qtd'){_evItens[i].qtd=parseInt2(val,1,1)}
  else if(campo==='desconto'){_evItens[i].desconto=clamp(val)}
  renderEvItens()
}
function evRemoveItem(i){_evItens.splice(i,1);renderEvItens()}
function evAddItem(){
  const tipo=document.getElementById('evAddTipo').value
  const qtd=parseInt2(document.getElementById('evAddQtd').value,1,1)
  const desc=clamp(document.getElementById('evAddDesc').value)
  if(tipo==='servico'){
    const pidx=parseInt(document.getElementById('evAddServico').value)
    if(isNaN(pidx)||pidx<0||pidx>=servicos.length){toast('Selecione um serviço.','warning');return}
    const s=servicos[pidx]
    _evItens.push({tipo:'servico',produto:s.nome,preco:s.preco,custo:s.custo||0,qtd,desconto:desc,servicoIndex:pidx})
  } else {
    const pidx=parseInt(document.getElementById('evAddProduto').value)
    if(isNaN(pidx)||pidx<0||pidx>=produtos.length){toast('Selecione um produto.','warning');return}
    const p=produtos[pidx]
    _evItens.push({tipo:'produto',produto:p.nome,preco:p.preco,custo:p.custo||0,qtd,desconto:desc,produtoIndex:pidx})
  }
  document.getElementById('evAddQtd').value='';document.getElementById('evAddDesc').value=''
  renderEvItens();toast('✅ Item adicionado à venda.','info')
}
function renderEvResumo(){
  const sb=_evItens.reduce((t,it)=>t+it.preco*it.qtd,0)
  const sd=_evItens.reduce((t,it)=>t+it.preco*it.qtd*(clamp(it.desconto)/100),0)
  const sc=_evItens.reduce((t,it)=>t+(it.custo||0)*it.qtd,0),total=sb-sd
  document.getElementById('evResumo').innerHTML=
    '<div class="resumo-item"><span class="resumo-label">Subtotal</span><span class="resumo-value">'+brl(sb)+'</span></div>'+
    '<div class="resumo-item"><span class="resumo-label">Descontos</span><span class="resumo-value v-yellow">'+brl(sd)+'</span></div>'+
    '<div class="resumo-item"><span class="resumo-label">Custo</span><span class="resumo-value v-red">'+brl(sc)+'</span></div>'+
    '<div class="resumo-item"><span class="resumo-label">Total</span><span class="resumo-value v-green">'+brl(total)+'</span></div>'+
    '<div class="resumo-item"><span class="resumo-label">Lucro</span><span class="resumo-value v-indigo">'+brl(total-sc)+'</span></div>'
}
function salvarVendaEdit(){
  if(!_evItens.length){toast('A venda precisa ter ao menos um item.','warning');return}
  const v=vendas[_evIdx]
  ;(v.itens||[]).forEach(it=>{if(it.tipo==='servico')return;const p=typeof it.produtoIndex==='number'?produtos[it.produtoIndex]:undefined;if(p)p.estoque+=it.qtd})
  let erroEstoque=null
  _evItens.forEach(it=>{if(it.tipo==='servico')return;const p=typeof it.produtoIndex==='number'?produtos[it.produtoIndex]:undefined;if(p&&it.qtd>p.estoque)erroEstoque='Estoque insuficiente para "'+p.nome+'". Disponível: '+p.estoque})
  if(erroEstoque){
    ;(v.itens||[]).forEach(it=>{if(it.tipo==='servico')return;const p=typeof it.produtoIndex==='number'?produtos[it.produtoIndex]:undefined;if(p)p.estoque-=it.qtd})
    toast(erroEstoque,'error');return
  }
  _evItens.forEach(it=>{if(it.tipo==='servico')return;const p=typeof it.produtoIndex==='number'?produtos[it.produtoIndex]:undefined;if(p)p.estoque-=it.qtd})
  const sb=_evItens.reduce((t,it)=>t+it.preco*it.qtd,0)
  const sd=_evItens.reduce((t,it)=>t+it.preco*it.qtd*(clamp(it.desconto)/100),0)
  vendas[_evIdx]={...v,cliente:document.getElementById('evCliente').value||v.cliente,data:document.getElementById('evData').value||v.data,obs:document.getElementById('evObs').value.trim(),formaPagamento:document.getElementById('evFormaPgto').value,vendedor:document.getElementById('evVendedor').value,itens:JSON.parse(JSON.stringify(_evItens)),total:sb-sd}
  closeEditVenda();toast('✅ Venda atualizada com sucesso!');save()
}

/* ══ LOCALSTORAGE ══ */
