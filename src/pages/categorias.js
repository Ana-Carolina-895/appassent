/* ══ CATEGORIAS DE SERVIÇO ══ */
let servicoCategorias=[]

function loadCategorias(){
  try{
    const salvas=JSON.parse(localStorage.getItem('assent_serv_cats')||'[]')
    servicoCategorias=Array.isArray(salvas)?salvas:[]
  }catch(e){servicoCategorias=[]}
  // Importa categorias já usadas nos serviços (migração)
  servicos.forEach(s=>{
    if(s.categoria&&!servicoCategorias.includes(s.categoria))
      servicoCategorias.push(s.categoria)
  })
  servicoCategorias.sort((a,b)=>a.localeCompare(b,'pt-BR'))
}

function saveCategorias(){
  try{localStorage.setItem('assent_serv_cats',JSON.stringify(servicoCategorias))}catch(e){}
}

function getCatOptions(selected){
  return'<option value="">— Sem categoria —</option>'+
    servicoCategorias.map(c=>'<option value="'+escHtml(c)+'"'+(c===selected?' selected':'')+'>'+escHtml(c)+'</option>').join('')
}

// ── Dropdown de categorias ──
let _catBlurTimer=null

function abrirCatDropdown(){
  clearTimeout(_catBlurTimer)
  renderCatDropdown(document.getElementById('servicoCategoriaSearch')?.value||'')
}

function renderCatDropdown(q){
  const dd=document.getElementById('catDropdown')
  if(!dd)return
  const ql=q.trim().toLowerCase()
  const filtradas=ql
    ? servicoCategorias.filter(c=>c.toLowerCase().includes(ql))
    : [...servicoCategorias]

  let html=''
  if(filtradas.length){
    html=filtradas.map(c=>
      '<div class="cliente-search-item" onmousedown="selecionarCategoria(\''+
      c.replace(/\\/g,'\\\\').replace(/'/g,'\\\'')+'\')">'+escHtml(c)+'</div>'
    ).join('')
  }
  // Opção de criar sempre aparece se houver texto que não existe ainda
  if(ql&&!servicoCategorias.some(c=>c.toLowerCase()===ql)){
    html+='<div class="cliente-search-item" onmousedown="abrirModalCategoria(\''+escHtml(q.trim()).replace(/'/g,'&#39;')+'\')" style="color:var(--accent);font-weight:500;border-top:1px solid var(--border)">＋ Criar "'+escHtml(q.trim())+'"</div>'
  }
  if(!html){
    html='<div class="cliente-search-empty">Nenhuma categoria cadastrada.<br><span style="font-size:11px">Clique em ＋ para criar a primeira.</span></div>'
  }
  dd.innerHTML=html
  dd.style.display='block'
}

function onCatSearch(q){
  // Limpa seleção anterior ao digitar
  document.getElementById('servicoCategoria').value=''
  renderCatDropdown(q)
}

function fecharCatDropdown(){
  _catBlurTimer=setTimeout(()=>{
    const dd=document.getElementById('catDropdown')
    if(dd)dd.style.display='none'
  },150)
}

function selecionarCategoria(cat){
  clearTimeout(_catBlurTimer)
  document.getElementById('servicoCategoria').value=cat
  document.getElementById('servicoCategoriaSearch').value=cat
  const dd=document.getElementById('catDropdown')
  if(dd)dd.style.display='none'
}

// Fecha ao clicar fora
document.addEventListener('click',e=>{
  if(!e.target.closest('#servicoCatWrap')){
    const dd=document.getElementById('catDropdown')
    if(dd)dd.style.display='none'
  }
})

// ── Modal nova categoria ──
function adicionarCategoria(){
  // Chamado pelo botão ＋ — pré-preenche com o que está no campo
  const q=(document.getElementById('servicoCategoriaSearch')?.value||'').trim()
  abrirModalCategoria(q)
}

function abrirModalCategoria(preenchido){
  clearTimeout(_catBlurTimer)
  const ni=document.getElementById('novaCatInput')
  if(ni)ni.value=preenchido||''
  setErr('fg-novacat',false)
  const ov=document.getElementById('modalNovaCategoria')
  if(ov)ov.classList.add('open')
  setTimeout(()=>document.getElementById('novaCatInput')?.focus(),80)
}

function openModalGerenciarCategorias(){
  renderGerenciarCategorias()
  openModal('modalGerenciarCategorias')
}

function renderGerenciarCategorias(){
  const el=document.getElementById('gerenciarCatsLista')
  if(!el)return
  if(!servicoCategorias.length){
    el.innerHTML='<div style="color:var(--text-muted);font-size:13px;padding:12px 0;text-align:center">Nenhuma categoria cadastrada</div>'
    return
  }
  el.innerHTML=servicoCategorias.map((c,i)=>
    '<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border)">'+
      '<span style="flex:1;font-size:14px">'+escHtml(c)+'</span>'+
      '<button class="btn btn-ghost btn-sm" onclick="editarCategoria('+i+')" title="Renomear">✏️</button>'+
      '<button class="btn btn-ghost btn-sm" onclick="excluirCategoria('+i+')" title="Excluir">🗑️</button>'+
    '</div>'
  ).join('')
}

function editarCategoria(i){
  const nome=prompt('Renomear categoria:',servicoCategorias[i])
  if(!nome||!nome.trim())return
  const novo=nome.trim()
  if(servicoCategorias.some((c,j)=>j!==i&&c.toLowerCase()===novo.toLowerCase())){
    toast('Já existe uma categoria com esse nome.','error');return
  }
  const antigo=servicoCategorias[i]
  servicoCategorias[i]=novo
  servicoCategorias.sort((a,b)=>a.localeCompare(b,'pt-BR'))
  // Atualiza serviços que usavam a categoria antiga
  servicos.forEach(s=>{if(s.categoria===antigo)s.categoria=novo})
  saveCategorias();save()
  renderGerenciarCategorias()
  toast('✅ Categoria renomeada!')
}

function excluirCategoria(i){
  const nome=servicoCategorias[i]
  const emUso=servicos.filter(s=>s.categoria===nome).length
  const msg=emUso
    ?'Excluir "'+nome+'"? '+emUso+' serviço(s) ficarão sem categoria.'
    :'Excluir a categoria "'+nome+'"?'
  showConfirm(msg,()=>{
    servicoCategorias.splice(i,1)
    saveCategorias()
    renderGerenciarCategorias()
    toast('🗑️ Categoria removida.','info')
  })
}

window.openModalGerenciarCategorias=openModalGerenciarCategorias
window.editarCategoria=editarCategoria
window.excluirCategoria=excluirCategoria

function confirmarNovaCategoria(){
  const n=(document.getElementById('novaCatInput')?.value||'').trim()
  if(!n){setErr('fg-novacat',true);return}
  setErr('fg-novacat',false)
  closeModal('modalNovaCategoria')
  if(servicoCategorias.some(c=>c.toLowerCase()===n.toLowerCase())){
    // Já existe — encontra o nome exato e seleciona
    const existe=servicoCategorias.find(c=>c.toLowerCase()===n.toLowerCase())
    selecionarCategoria(existe)
    toast('ℹ️ Categoria já existe — selecionada.','info')
    return
  }
  servicoCategorias.push(n)
  servicoCategorias.sort((a,b)=>a.localeCompare(b,'pt-BR'))
  saveCategorias()
  selecionarCategoria(n)
  toast('✅ Categoria "'+n+'" criada!')
}

document.getElementById('modalNovaCategoria')?.addEventListener('click',e=>{
  if(e.target===document.getElementById('modalNovaCategoria'))closeModal('modalNovaCategoria')
})

