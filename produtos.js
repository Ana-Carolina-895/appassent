function addProduto(){
  const nome=document.getElementById('produtoNome').value.trim()
  if(!nome){setErr('fg-pNome',true);toast('Informe o nome do produto.','warning');return}
  setErr('fg-pNome',false)
  if(produtos.some(p=>p.nome.toLowerCase()===nome.toLowerCase())){toast('Produto já cadastrado.','error');return}
  const preco=parseNum(document.getElementById('produtoPreco').value,0,0),custo=parseNum(document.getElementById('produtoCusto').value,0,0),estoque=parseInt2(document.getElementById('produtoEstoque').value,0,0)
  const foto=_novoProdFoto||''
  produtos.push({nome,preco,custo,estoque,foto})
  ;['produtoNome','produtoPreco','produtoCusto','produtoEstoque'].forEach(id=>document.getElementById(id).value='')
  _novoProdFoto=''
  const prev=document.getElementById('novoProdFotoPreview');if(prev){prev.innerHTML='📦';prev.style.background=''}
  toast('✅ Produto "'+nome+'" cadastrado com sucesso!');save()
}
function excluirProduto(i){
  const np=produtos[i].nome,vv=vendas.filter(v=>(v.itens||[]).some(it=>it.produto===np))
  showConfirm('Excluir "'+np+'"?'+(vv.length?' Aparece em '+vv.length+' venda(s) — histórico mantido.':''),()=>{
    vendas.forEach(v=>{if(!v.itens)return;v.itens.forEach(it=>{if(it.produtoIndex===i)it.produtoIndex=undefined;else if(typeof it.produtoIndex==='number'&&it.produtoIndex>i)it.produtoIndex--})})
    produtos.splice(i,1);toast('🗑️ Produto "'+np+'" removido.','info');save()
  })
}
function renderProdutos(){
  const q=(document.getElementById('buscaProduto').value||'').toLowerCase()
  const f=produtos.map((p,_i)=>({...p,_i})).filter(p=>p.nome.toLowerCase().includes(q))
  document.getElementById('cntProdutos').textContent=f.length
  const b=document.getElementById('produtosBody')
  if(!f.length){b.innerHTML='<tr><td colspan="6"><div class="empty-state"><span class="empty-icon">📦</span>Nenhum produto encontrado</div></td></tr>';return}
  b.innerHTML=f.map(p=>{
    const i=p._i,m=p.preco>0?((p.preco-p.custo)/p.preco*100).toFixed(1):0
    const min=config.estoqueMin!==undefined?config.estoqueMin:3
    const eb=p.estoque<=0?'<span class="badge badge-red">Zerado</span>':p.estoque<=min?'<span class="badge badge-yellow">Baixo ('+p.estoque+')</span>':'<span class="badge badge-green">'+p.estoque+'</span>'
    if(produtoEditando===i)return''  // obsoleto — mantido para segurança
    return'<tr><td>'+(p.foto?'<img src="'+p.foto+'" class="prod-foto-thumb">':'<span class="prod-foto-placeholder">📦</span>')+'</td><td>'+escHtml(p.nome)+'</td><td class="td-mono">'+brl(p.preco)+'</td><td class="td-mono td-muted">'+brl(p.custo)+'</td><td><span class="badge '+(Number(m)>=40?'badge-green':Number(m)>=20?'badge-yellow':'badge-red')+'">'+m+'%</span></td><td>'+eb+'</td><td><div class="td-actions"><button class="btn btn-warning btn-sm" onclick="editarProduto('+i+')">Editar</button><button class="btn btn-danger btn-sm" onclick="excluirProduto('+i+')">Excluir</button></div></td></tr>'
  }).join('')
}

/* ══ ENTRADA DE ESTOQUE ══ */
function onEntradaProdutoChange(){
  atualizarPreviewEntrada()
  const idx=parseInt(document.getElementById('entradaProduto').value)
  const el=document.getElementById('entradaCustoAtual')
  if(el&&!isNaN(idx)&&idx>=0&&idx<produtos.length){
    el.textContent='Custo atual: '+brl(produtos[idx].custo)
  } else if(el){el.textContent=''}
}
function onEntradaQtdChange(){atualizarPreviewEntrada()}
function atualizarPreviewEntrada(){
  const idx=parseInt(document.getElementById('entradaProduto').value)
  const qtd=parseInt2(document.getElementById('entradaQtd').value,0)
  const preview=document.getElementById('entradaPreview')
  if(isNaN(idx)||idx<0||idx>=produtos.length){preview.style.display='none';return}
  const p=produtos[idx]
  if(qtd>0){
    preview.style.display='flex'
    document.getElementById('epAtual').textContent=p.estoque
    document.getElementById('epQtd').textContent=qtd
    document.getElementById('epNovo').textContent=p.estoque+qtd
  } else {
    preview.style.display='flex'
    document.getElementById('epAtual').textContent=p.estoque
    document.getElementById('epQtd').textContent='—'
    document.getElementById('epNovo').textContent='—'
  }
}
function registrarEntrada(){
  const idx=parseInt(document.getElementById('entradaProduto').value)
  const qtd=parseInt2(document.getElementById('entradaQtd').value,0,1)
  let ok=true
  const fgP=document.getElementById('fg-eProduto'),fgQ=document.getElementById('fg-eQtd')
  fgP.classList.toggle('has-error',isNaN(idx)||idx<0||idx>=produtos.length)
  fgQ.classList.toggle('has-error',qtd<1)
  if(isNaN(idx)||idx<0||idx>=produtos.length||qtd<1)ok=false
  if(!ok){toast('Corrija os campos destacados.','warning');return}
  const p=produtos[idx]
  const antes=p.estoque
  p.estoque+=qtd  // ← atualização real do estoque
  const entrada={
    data:document.getElementById('entradaData').value||hoje(),
    produto:p.nome,produtoIndex:idx,qtd,
    estoqueAntes:antes,estoqueDepois:p.estoque,
    motivo:document.getElementById('entradaMotivo').value,
    fornecedor:document.getElementById('entradaFornecedor').value||'',
    obs:document.getElementById('entradaObs').value.trim(),
    ts:Date.now()
  }
  entradas.push(entrada)
  // Atualiza custo se preenchido
  const novoCusto=parseNum(document.getElementById('entradaNovoCusto').value,-1,0)
  if(novoCusto>=0){
    const custoAntigo=p.custo
    p.custo=novoCusto
    entrada.custoAntigo=custoAntigo
    entrada.custoNovo=novoCusto
  }
  document.getElementById('entradaQtd').value=''
  document.getElementById('entradaObs').value=''
  document.getElementById('entradaNovoCusto').value=''
  const efEl=document.getElementById('entradaFornecedor');if(efEl)efEl.value=''
  fgP.classList.remove('has-error');fgQ.classList.remove('has-error')
  // sem chamar save() completo para não resetar o select — faz update cirúrgico
  lsSet('produtos',produtos);lsSet('entradas',entradas)
  renderProdutos();renderEntradas();renderStockAlert();renderDashboard()
  // atualiza select mantendo a seleção
  const html=produtos.length?produtos.map((pp,i)=>'<option value="'+i+'">'+escHtml(pp.nome)+' (estoque: '+pp.estoque+')</option>').join(''):'<option value="">— Nenhum produto —</option>'
  document.getElementById('entradaProduto').innerHTML=html
  document.getElementById('entradaProduto').value=String(idx)
  atualizarPreviewEntrada()
  populateSelects()  // atualiza outros selects (vendaProduto etc.)
  toast('+'+qtd+' un. em "'+p.nome+'" · Novo estoque: '+p.estoque)
}
function excluirEntrada(i){
  const e=entradas[i]
  showConfirm('Excluir esta entrada? O estoque de "'+e.produto+'" será revertido em '+e.qtd+' unidades.',()=>{
    const p=typeof e.produtoIndex==='number'?produtos[e.produtoIndex]:undefined
    if(p&&p.nome===e.produto)p.estoque=Math.max(0,p.estoque-e.qtd)
    entradas.splice(i,1);toast('🗑️ Entrada removida e estoque revertido.','info');save()
  })
}
function renderEntradas(){
  const q=(document.getElementById('buscaEntrada').value||'').toLowerCase()
  const f=entradas.map((e,_i)=>({...e,_i})).filter(e=>e.produto.toLowerCase().includes(q)||(e.motivo||'').toLowerCase().includes(q)||(e.obs||'').toLowerCase().includes(q)).sort((a,b)=>b.ts-a.ts)
  document.getElementById('cntEntradas').textContent=f.length
  const b=document.getElementById('entradasBody')
  if(!f.length){b.innerHTML='<tr><td colspan="9"><div class="empty-state"><span class="empty-icon">📥</span>Nenhuma entrada registrada</div></td></tr>';return}
  b.innerHTML=f.map(e=>
    '<tr><td class="td-muted">'+fmtData(e.data)+'</td>'+
    '<td>'+escHtml(e.produto)+'</td>'+
    '<td class="td-mono" style="color:var(--green)">+'+e.qtd+'</td>'+
    '<td class="td-mono td-muted">'+e.estoqueAntes+'</td>'+
    '<td class="td-mono" style="color:var(--accent)">'+e.estoqueDepois+'</td>'+
    '<td><span class="badge badge-indigo">'+escHtml(e.motivo||'—')+'</span></td>'+
    '<td class="td-muted">'+(e.fornecedor?escHtml(e.fornecedor):'—')+'</td>'+
    '<td class="td-muted">'+(e.obs?escHtml(e.obs):'—')+'</td>'+
    '<td><button class="btn btn-danger btn-sm" onclick="excluirEntrada('+e._i+')">Excluir</button></td></tr>'
  ).join('')
}

/* ══ TOGGLE PRODUTO / SERVIÇO NA VENDA ══ */
/* ══ TOGGLE PRODUTO/SERVIÇO (mantido para compatibilidade) ══ */
