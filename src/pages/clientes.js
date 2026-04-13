function setErr(id,on){document.getElementById(id).classList.toggle('has-error',on)}

/* ══ CLIENTES ══ */
function addCliente(){
  const nome=document.getElementById('clienteNome').value.trim(),tel=document.getElementById('clienteTelefone').value.trim(),cpf=document.getElementById('clienteCPF').value.trim()
  const insta=document.getElementById('clienteInstagram').value.trim(),end=document.getElementById('clienteEndereco').value.trim()
  let ok=true
  setErr('fg-cNome',!nome);if(!nome)ok=false
  setErr('fg-cTel',!tel);if(!tel)ok=false
  setErr('fg-cCPF',cpf.length!==11);if(cpf.length!==11)ok=false
  if(!ok){toast('Corrija os campos destacados.','warning');return}
  clientes.push({nome,telefone:tel,cpf,insta,endereco:end})
  ;['clienteNome','clienteTelefone','clienteCPF','clienteInstagram','clienteEndereco'].forEach(id=>document.getElementById(id).value='')
  setErr('fg-cNome',false);setErr('fg-cTel',false);setErr('fg-cCPF',false)
  toast('✅ Cliente "'+nome+'" cadastrado com sucesso!');save()
}
function editarCliente(i){clienteEditando=i;renderClientes()}
function cancelarCliente(){clienteEditando=null;renderClientes()}
function salvarCliente(i){
  const nome=document.getElementById('ec_n'+i).value.trim(),tel=document.getElementById('ec_t'+i).value.trim(),cpf=document.getElementById('ec_c'+i).value.trim()
  if(!nome||!tel||cpf.length!==11){toast('Preencha os campos obrigatórios.','warning');return}
  clientes[i]={nome,telefone:tel,cpf,insta:document.getElementById('ec_i'+i).value.trim(),endereco:document.getElementById('ec_e'+i).value.trim()}
  clienteEditando=null;toast('✅ Cliente atualizado com sucesso!');save()
}
function excluirCliente(i){
  const nc=clientes[i].nome,vv=vendas.filter(v=>v.cliente===nc)
  showConfirm('Excluir "'+nc+'"?'+(vv.length?' Possui '+vv.length+' venda(s) — mantidas no histórico.':''),()=>{clientes.splice(i,1);toast('🗑️ Cliente removido.','info');save()})
}
function renderClientes(){
  const q=(document.getElementById('buscaCliente').value||'').toLowerCase()
  const f=clientes.map((c,_i)=>({...c,_i})).filter(c=>c.nome.toLowerCase().includes(q)||(c.cpf||'').includes(q)||(c.telefone||'').includes(q))
  document.getElementById('cntClientes').textContent=f.length
  const b=document.getElementById('clientesBody')
  if(!f.length){b.innerHTML='<tr><td colspan="6"><div class="empty-state"><span class="empty-icon">👥</span>Nenhum cliente encontrado</div></td></tr>';return}
  b.innerHTML=f.map(c=>{
    const i=c._i
    if(clienteEditando===i)return'<tr><td><input id="ec_n'+i+'" value="'+escHtml(c.nome)+'"></td><td><input id="ec_c'+i+'" value="'+(c.cpf||'')+'" maxlength="11" oninput="this.value=this.value.replace(/\\D/g,\'\')" style="width:110px"></td><td><input id="ec_t'+i+'" value="'+escHtml(c.telefone||'')+'"></td><td><input id="ec_e'+i+'" value="'+escHtml(c.endereco||'')+'"></td><td><input id="ec_i'+i+'" value="'+escHtml(c.insta||'')+'"></td><td><div class="td-actions"><button class="btn btn-primary btn-sm" onclick="salvarCliente('+i+')">Salvar</button><button class="btn btn-ghost btn-sm" onclick="cancelarCliente()">✕</button></div></td></tr>'
    return'<tr class="tr-click" onclick="abrirClienteHist('+i+')" title="Ver histórico de compras">'+
      '<td>'+escHtml(c.nome)+'</td>'+
      '<td class="td-mono td-muted">'+fmtCPF(c.cpf)+'</td>'+
      '<td class="td-muted">'+(c.telefone||'—')+'</td>'+
      '<td class="td-muted">'+(c.endereco||'—')+'</td>'+
      '<td class="td-muted">'+(c.insta||'—')+'</td>'+
      '<td><div class="td-actions" onclick="event.stopPropagation()">'+
        '<button class="btn btn-warning btn-sm" onclick="editarCliente('+i+')">Editar</button>'+
        '<button class="btn btn-danger btn-sm" onclick="excluirCliente('+i+')">Excluir</button>'+
      '</div></td></tr>'
  }).join('')
}

/* ══ PRODUTOS ══ */
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
