      '<div style="font-size:12px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+itensResume+'</div>'+
    '</div>'
  }).join('')
}

function closeClienteHist(){document.getElementById('modalClienteHist').classList.remove('open')}
document.getElementById('modalClienteHist')?.addEventListener('click',e=>{
  if(e.target===document.getElementById('modalClienteHist'))closeClienteHist()
})

/* ══ BUSCA DE CLIENTE NA VENDA ══ */
let _clienteBlurTimer=null
let _clienteSelecionado=''   // nome do cliente selecionado

function onClienteSearch(q){
  _clienteSelecionado=''
  document.getElementById('vendaClienteNome').value=''
  if(!q||q.length<1){hideClienteDropdown();return}
  showClienteDropdown(q)
}

function showClienteDropdown(q){
  q=q||document.getElementById('vendaClienteSearch').value
  const dd=document.getElementById('clienteSearchDropdown')
  const ql=q.toLowerCase()
  const matches=clientes.filter(c=>
    c.nome.toLowerCase().includes(ql)||(c.cpf||'').includes(ql)||(c.telefone||'').includes(ql)
  ).slice(0,8)
  if(!matches.length&&q.length>0){
    dd.innerHTML='<div class="cliente-search-empty">Nenhum cliente encontrado.<br><small>A venda será registrada como "'+escHtml(q)+'"</small></div>'
  } else if(!matches.length) {
    dd.style.display='none';return
  } else {
    dd.innerHTML=matches.map(c=>{
      const sub=[c.telefone,c.cpf?fmtCPF(c.cpf):null].filter(Boolean).join(' · ')
      return'<div class="cliente-search-item" onmousedown="selecionarCliente(\''+escHtml(c.nome).replace(/'/g,"\\'")+'\')">'+
        '<div class="cliente-search-item-nome">'+escHtml(c.nome)+'</div>'+
        (sub?'<div class="cliente-search-item-sub">'+escHtml(sub)+'</div>':'')+
      '</div>'
    }).join('')
  }
  dd.style.display='block'
}

function selecionarCliente(nome){
  _clienteSelecionado=nome
  document.getElementById('vendaClienteSearch').value=nome
  document.getElementById('vendaClienteNome').value=nome
  document.getElementById('clienteSearchDropdown').style.display='none'
}

function hideClienteDropdown(){
  _clienteBlurTimer=setTimeout(()=>{
    const dd=document.getElementById('clienteSearchDropdown')
    if(dd)dd.style.display='none'
  },200)
}

function getVendaClienteNome(){
  // Retorna o nome do cliente para a venda:
  // se selecionou do dropdown → usa esse; senão usa o que está digitado
  const search=document.getElementById('vendaClienteSearch').value.trim()
  return _clienteSelecionado||search||'Não informado'
}

function resetVendaCliente(){
  _clienteSelecionado=''
  document.getElementById('vendaClienteSearch').value=''
  document.getElementById('vendaClienteNome').value=''
  const dd=document.getElementById('clienteSearchDropdown')
  if(dd)dd.style.display='none'
}

/* ══ CALCULADORA DE MARGEM / PREÇO ══ */
function calcMargem(origem){
  // Quando o usuário edita Preço ou Custo nos campos principais
  // → atualiza os campos da calculadora também
  const preco=parseNum(document.getElementById('produtoPreco').value,0,0)
  const custo=parseNum(document.getElementById('produtoCusto').value,0,0)
  if(preco>0&&custo>=0){
    const m=(preco-custo)/preco*100
    document.getElementById('calcPreco').value=preco.toFixed(2)
    document.getElementById('calcCusto').value=custo.toFixed(2)
    document.getElementById('calcMargem').value=m.toFixed(1)
  }
}

function calcMargemFromCalc(origem){
  const custo=parseNum(document.getElementById('calcCusto').value,NaN)
  const margem=parseNum(document.getElementById('calcMargem').value,NaN)
  const preco=parseNum(document.getElementById('calcPreco').value,NaN)

  if(origem==='custo'||origem==='margem'){
    // custo + margem → preço
    if(!isNaN(custo)&&!isNaN(margem)&&margem<100){
      const p=custo/(1-margem/100)
      document.getElementById('calcPreco').value=p.toFixed(2)
    }
  } else if(origem==='preco'){
    // preco + custo → margem
    if(!isNaN(preco)&&!isNaN(custo)&&preco>0){
      const m=(preco-custo)/preco*100
      document.getElementById('calcMargem').value=m.toFixed(1)
    } else if(!isNaN(preco)&&!isNaN(margem)&&margem<100){
      // preco + margem → custo
      const c=preco*(1-margem/100)
      document.getElementById('calcCusto').value=c.toFixed(2)
    }
  }
}

function aplicarCalcMargem(){
  const preco=parseNum(document.getElementById('calcPreco').value,0,0)
  const custo=parseNum(document.getElementById('calcCusto').value,0,0)
  if(preco>0){
    document.getElementById('produtoPreco').value=preco.toFixed(2)
    document.getElementById('produtoCusto').value=custo.toFixed(2)
    toast('✅ Preço e custo aplicados ao produto!','info')
  } else {
    toast('⚠️ Calcule um preço válido primeiro.','warning')
  }
}

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
