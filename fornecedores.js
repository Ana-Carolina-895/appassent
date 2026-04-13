function renderFornecedores(){
  const q=(document.getElementById('buscaForn')?.value||'').toLowerCase()
  const f=fornecedores.map((x,i)=>({...x,_i:i})).filter(x=>x.nome.toLowerCase().includes(q)||(x.email||'').toLowerCase().includes(q))
  const cnt=document.getElementById('cntForn');if(cnt)cnt.textContent=f.length
  const b=document.getElementById('fornBody');if(!b)return
  if(!f.length){b.innerHTML='<tr><td colspan="8"><div class="empty-state"><span class="empty-icon">🏭</span>Nenhum fornecedor</div></td></tr>';return}
  b.innerHTML=f.map(x=>{
    const i=x._i
    return'<tr>'+
      '<td>'+escHtml(x.nome)+'</td>'+
      '<td class="td-muted">'+(x.tel||'—')+'</td>'+
      '<td class="td-muted">'+(x.email||'—')+'</td>'+
      '<td class="td-mono td-muted">'+(x.doc||'—')+'</td>'+
      '<td class="td-muted">'+(x.formaPgto||'—')+'</td>'+
      '<td class="td-muted">'+(x.prazo||'—')+'</td>'+
      '<td class="td-muted">'+(x.obs||'—')+'</td>'+
      '<td><div class="td-actions"><button class="btn btn-warning btn-sm" onclick="editarForn('+i+')">Editar</button><button class="btn btn-danger btn-sm" onclick="excluirFornecedor('+i+')">Excluir</button></div></td>'+
    '</tr>'
  }).join('')
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

/* ══ EDITAR FORNECEDOR ══ */
let _editFornIdx=null
function editarForn(i){
  _editFornIdx=i
  const f=fornecedores[i]
  document.getElementById('efNome').value=f.nome
  document.getElementById('efTel').value=f.tel||''
  document.getElementById('efEmail').value=f.email||''
  document.getElementById('efDoc').value=f.doc||''
  document.getElementById('efObs').value=f.obs||''
  document.getElementById('efFormaPgto').value=f.formaPgto||''
  document.getElementById('efPrazo').value=f.prazo||''
  document.getElementById('modalEditForn').classList.add('open')
}
function salvarEditForn(){
  if(_editFornIdx===null)return
  const nome=document.getElementById('efNome').value.trim()
  if(!nome){toast('⚠️ Informe o nome.','warning');return}
  if(fornecedores.some((f,idx)=>idx!==_editFornIdx&&f.nome.toLowerCase()===nome.toLowerCase())){toast('⚠️ Já existe um fornecedor com esse nome.','error');return}
  fornecedores[_editFornIdx]={
    ...fornecedores[_editFornIdx],
    nome,
    tel:document.getElementById('efTel').value.trim(),
    email:document.getElementById('efEmail').value.trim(),
    doc:document.getElementById('efDoc').value.trim(),
    obs:document.getElementById('efObs').value.trim(),
    formaPgto:document.getElementById('efFormaPgto').value,
    prazo:document.getElementById('efPrazo').value.trim()
  }
  closeEditForn()
  toast('✅ Fornecedor "'+nome+'" atualizado!')
  save()
}
function closeEditForn(){document.getElementById('modalEditForn').classList.remove('open');_editFornIdx=null}
document.getElementById('modalEditForn')?.addEventListener('click',e=>{if(e.target===document.getElementById('modalEditForn'))closeEditForn()})

/* ══ RELATÓRIO: RANKING MAIS VENDIDOS ══ */
function renderRelRanking(pv,sumEl,titleEl,countEl,contentEl){
  // Consolida por produto/serviço
  const map={}
  pv.forEach(v=>(v.itens||[]).forEach(it=>{
    const k=it.produto||'—'
    if(!map[k])map[k]={nome:k,tipo:it.tipo||'produto',qtd:0,fat:0,lucro:0,vendas:new Set()}
    const desc=clamp(it.desconto||0)
