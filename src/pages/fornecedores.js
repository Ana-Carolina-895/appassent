/* ══ FORNECEDORES ══ */
let _fornEditando=null

function addFornecedor(){
  const nome=document.getElementById('fornNome').value.trim()
  if(!nome){setErr('fg-fNome',true);toast('Informe o nome.','warning');return}
  setErr('fg-fNome',false)
  if(fornecedores.some(f=>f.nome.toLowerCase()===nome.toLowerCase())){toast('⚠️ Fornecedor já cadastrado.','error');return}
  fornecedores.push({
    nome,
    tel:document.getElementById('fornTel').value.trim(),
    email:document.getElementById('fornEmail').value.trim(),
    doc:document.getElementById('fornDoc').value.trim(),
    obs:document.getElementById('fornObs').value.trim(),
    formaPgto:document.getElementById('fornFormaPgto').value,
    prazo:document.getElementById('fornPrazo').value.trim()
  })
  ;['fornNome','fornTel','fornEmail','fornDoc','fornObs','fornPrazo'].forEach(id=>document.getElementById(id).value='')
  document.getElementById('fornFormaPgto').value=''
  toast('✅ Fornecedor "'+nome+'" cadastrado!')
  save()
}

function excluirFornecedor(i){
  const n=fornecedores[i].nome
  showConfirm('Excluir o fornecedor "'+escHtml(n)+'"?',()=>{
    fornecedores.splice(i,1)
    toast('🗑️ Fornecedor removido.','info')
    save()
  })
}

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
document.getElementById('modalEditForn').addEventListener('click',e=>{if(e.target===document.getElementById('modalEditForn'))closeEditForn()})

