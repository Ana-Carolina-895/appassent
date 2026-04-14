/* ═══════════════════════════════════════════════════
   ASSENT v1.2 — missing.js
   Funcoes extraidas do HTML original
   ═══════════════════════════════════════════════════ */

/* === VARIAVEIS DE ESTADO === */
let servicoCategorias = []
let _vendedorEditando = null
let _fiadoFiltro = 'todas'
let _despesaFiltro = 'todas'
let _eventoEditIdx = null
let _chClienteNome = ''
let _chPeriod = 'todos'
let _capturingId = null
let _iaMensagens = []
let _agendaView = 'lista'
let _agendaFiltro = 'proximos'
let _agendaCalMes = new Date().getMonth()
let _agendaCalAno = new Date().getFullYear()

/* === ATALHOS === */
const ATALHOS_DEF = [
  {id:'nova-venda',   label:'Nova venda',        padrao:'N', fixo:false},
  {id:'novo-produto', label:'Novo produto',       padrao:'P', fixo:false},
  {id:'novo-cliente', label:'Novo cliente',       padrao:'C', fixo:false},
  {id:'novo-servico', label:'Novo serviço',       padrao:'S', fixo:false},
  {id:'dashboard',    label:'Dashboard',          padrao:'D', fixo:false},
  {id:'relatorios',   label:'Ir para Relatórios', padrao:'G', fixo:false},
  {id:'backup',       label:'Baixar backup',      padrao:'B', fixo:false},
  {id:'fechar',       label:'Fechar modal',       padrao:'Esc',fixo:true},
]

let _atalhos = (function(){
  try{
    const saved = JSON.parse(localStorage.getItem('assent_atalhos')||'{}')
    return ATALHOS_DEF.map(a=>({...a, tecla: saved[a.id]||a.padrao}))
  }catch(e){return ATALHOS_DEF.map(a=>({...a,tecla:a.padrao}))}
})();

function _calcDRE(){
  const pv=vendasRelPeriodo()
  const hj=hoje()
  const mesAtual=hj.slice(0,7)
  // Receita bruta
  const receitaBruta=pv.reduce((t,v)=>t+(v.total||0),0)
  // Descontos
  const descontos=pv.reduce((t,v)=>(v.itens||[]).reduce((s,it)=>s+it.preco*it.qtd*(clamp(it.desconto||0)/100),t),0)
  // Receita líquida
  const receitaLiq=receitaBruta-descontos
  // CMV — custo de mercadoria vendida
  const cmv=pv.reduce((t,v)=>(v.itens||[]).reduce((s,it)=>s+(it.custo||0)*it.qtd,t),0)
  // Lucro bruto
  const lucroBruto=receitaLiq-cmv
  // Despesas operacionais (do período filtrado)
  const despPeriodo=_filtrarDespesasPorPeriodo([...despesas])
  const despTotal=despPeriodo.reduce((t,d)=>t+d.valor,0)
  const despPagas=despPeriodo.filter(d=>d.paga).reduce((t,d)=>t+d.valor,0)
  // Resultado
  const resultado=lucroBruto-despTotal
  // Comparativo mês anterior
  const mesAnt=new Date();mesAnt.setMonth(mesAnt.getMonth()-1)
  const mesAntStr=mesAnt.getFullYear()+'-'+(String(mesAnt.getMonth()+1).padStart(2,'0'))
  const pvAnt=vendas.filter(v=>v.data&&v.data.slice(0,7)===mesAntStr)
  const recAnt=pvAnt.reduce((t,v)=>t+(v.total||0),0)
  const despAnt=despesas.filter(d=>d.venc&&d.venc.slice(0,7)===mesAntStr).reduce((t,d)=>t+d.valor,0)
  const resultAnt=recAnt-despesas.filter(d=>d.venc&&d.venc.slice(0,7)===mesAntStr).reduce((t,d)=>t+d.valor,0)
  const linhas=[
    {label:'Receita bruta',valor:receitaBruta},
    {label:'(–) Descontos concedidos',valor:-descontos},
    {label:'Receita líquida',valor:receitaLiq},
    {label:'(–) Custo das mercadorias/serviços (CMV)',valor:-cmv},
    {label:'= Lucro bruto',valor:lucroBruto},
    {label:'(–) Despesas operacionais (total)',valor:-despTotal},
    {label:'= Resultado do período',valor:resultado},
  ]
  return{receitaBruta,descontos,receitaLiq,cmv,lucroBruto,despTotal,despPagas,resultado,recAnt,resultAnt,linhas}
}


function _filtrarDespesasPorPeriodo(lista){
  if(_relPeriod==='todos')return lista
  const hj=hoje(),agora=new Date()
  return lista.filter(d=>{
    if(!d.venc)return false
    if(_relPeriod==='hoje')return d.venc===hj
    const dv=new Date(d.venc+'T00:00:00')
    if(_relPeriod==='7'){const l=new Date(agora);l.setDate(l.getDate()-6);return dv>=l&&dv<=agora}
    if(_relPeriod==='30'){const l=new Date(agora);l.setDate(l.getDate()-29);return dv>=l&&dv<=agora}
    if(_relPeriod==='mes')return d.venc.slice(0,7)===hj.slice(0,7)
    if(_relPeriod==='custom'){
      const de=document.getElementById('relDateDe')?.value
      const ate=document.getElementById('relDateAte')?.value
      if(de&&dv<new Date(de+'T00:00:00'))return false
      if(ate&&dv>new Date(ate+'T23:59:59'))return false
      return true
    }
    return true
  })
}


function _getComprasFornData(){
  // Filtra entradas pelo período selecionado
  const agora=new Date(),hj=hoje()
  const entradasFiltradas=entradas.filter(e=>{
    if(!e.data)return false
    if(_relPeriod==='todos')return true
    if(_relPeriod==='hoje')return e.data===hj
    const de=new Date(e.data+'T00:00:00')
    if(_relPeriod==='7'){const l=new Date(agora);l.setDate(l.getDate()-6);return de>=l&&de<=agora}
    if(_relPeriod==='30'){const l=new Date(agora);l.setDate(l.getDate()-29);return de>=l&&de<=agora}
    if(_relPeriod==='mes')return e.data.slice(0,7)===hj.slice(0,7)
    if(_relPeriod==='custom'){
      const df=document.getElementById('relDateDe')?.value
      const at=document.getElementById('relDateAte')?.value
      if(df&&de<new Date(df+'T00:00:00'))return false
      if(at&&de>new Date(at+'T23:59:59'))return false
      return true
    }
    return true
  })
  // Agrupa por fornecedor
  const map={}
  entradasFiltradas.forEach(e=>{
    const k=e.fornecedor||'Sem fornecedor'
    if(!map[k])map[k]={nome:k,qtd:0,qtdTotal:0,produtos:[],custoTotal:0}
    map[k].qtd++
    map[k].qtdTotal+=e.qtd||0
    if(e.produto&&!map[k].produtos.includes(e.produto))map[k].produtos.push(e.produto)
    // custo: se a entrada registrou custo novo usa ele, senão busca custo atual do produto
    if(e.custoNovo!==undefined) map[k].custoTotal+=(e.custoNovo||0)*(e.qtd||0)
    else{
      const p=typeof e.produtoIndex==='number'?produtos[e.produtoIndex]:undefined
      if(p) map[k].custoTotal+=(p.custo||0)*(e.qtd||0)
    }
  })
  const lista=Object.values(map).sort((a,b)=>b.qtdTotal-a.qtdTotal)
  return{lista,entradasFiltradas}
}


function abrirCatDropdown(){
  clearTimeout(_catBlurTimer)
  renderCatDropdown(document.getElementById('servicoCategoriaSearch')?.value||'')
}


function abrirClienteHist(i){
  const c=clientes[i]
  _chClienteNome=c.nome
  _chPeriod='todos'
  // reset period buttons
  document.querySelectorAll('#chFiltroBar .filter-btn').forEach(b=>b.classList.remove('active'))
  document.querySelector('#chFiltroBar .filter-btn').classList.add('active')
  document.getElementById('chNome').textContent=c.nome
  document.getElementById('chSub').textContent=[c.telefone,c.cpf?fmtCPF(c.cpf):null,c.insta].filter(Boolean).join(' · ')||'Sem dados de contato'
  renderChHistorico()
  document.getElementById('modalClienteHist').classList.add('open')
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


function abrirModalRecibo(v){
  _vendaRecibo=v
  document.getElementById('reciboPreviewContent').innerHTML=buildReciboHTML(v)
  document.getElementById('modalRecibo').classList.add('open')
}


function addServico(){
  const nome=document.getElementById('servicoNome').value.trim()
  if(!nome){setErr('fg-sNome',true);toast('Informe o nome do serviço.','warning');return}
  setErr('fg-sNome',false)
  if(servicos.some(s=>s.nome.toLowerCase()===nome.toLowerCase())){toast('Serviço já cadastrado.','error');return}
  servicos.push({
    nome,
    preco:parseNum(document.getElementById('servicoPreco').value,0,0),
    custo:parseNum(document.getElementById('servicoCusto').value,0,0),
    categoria:document.getElementById('servicoCategoria').value.trim(),
    descricao:document.getElementById('servicoDescricao').value.trim()
  })
  ;['servicoNome','servicoPreco','servicoCusto','servicoDescricao'].forEach(id=>document.getElementById(id).value='')
  document.getElementById('servicoCategoria').value=''
  const cs=document.getElementById('servicoCategoriaSearch');if(cs)cs.value=''
  toast('✅ Serviço "'+nome+'" cadastrado com sucesso!');save()
}


function addVendedor(){
  const nome=document.getElementById('vendedorNome').value.trim()
  if(!nome){setErr('fg-vNome',true);toast('Informe o nome.','warning');return}
  setErr('fg-vNome',false)
  if(vendedores.some(v=>v.nome.toLowerCase()===nome.toLowerCase())){toast('⚠️ Vendedor já cadastrado.','error');return}
  vendedores.push({
    nome,
    tel:document.getElementById('vendedorTel').value.trim(),
    email:document.getElementById('vendedorEmail').value.trim(),
    comissao:parseNum(document.getElementById('vendedorComissao').value,0,0),
    obs:document.getElementById('vendedorObs').value.trim()
  })
  ;['vendedorNome','vendedorTel','vendedorEmail','vendedorComissao','vendedorObs'].forEach(id=>document.getElementById(id).value='')
  toast('✅ Vendedor "'+nome+'" cadastrado!')
  save()
}


function adicionarCategoria(){
  // Chamado pelo botão ＋ — pré-preenche com o que está no campo
  const q=(document.getElementById('servicoCategoriaSearch')?.value||'').trim()
  abrirModalCategoria(q)
}


function atualizarEpMargem(){
  const preco=parseNum(document.getElementById('epPreco').value,0,0)
  const custo=parseNum(document.getElementById('epCusto').value,0,0)
  const m=preco>0?((preco-custo)/preco*100):0
  const mc=m>=40?'var(--green)':m>=20?'var(--yellow)':'var(--red)'
  const lucro=preco-custo
  document.getElementById('epMargemPreview').innerHTML=
    '<div><span style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em">Margem</span>'+
    '<div style="font-family:\'JetBrains Mono\',monospace;font-size:16px;font-weight:700;color:'+mc+'">'+m.toFixed(1)+'%</div></div>'+
    '<div><span style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em">Lucro por unidade</span>'+
    '<div style="font-family:\'JetBrains Mono\',monospace;font-size:16px;font-weight:700;color:var(--indigo)">'+brl(lucro)+'</div></div>'
}


function atualizarRestanteSinal(){
  const sb=itensVenda.reduce((t,it)=>t+it.preco*it.qtd,0)
  const sd=itensVenda.reduce((t,it)=>t+it.preco*it.qtd*(clamp(it.desconto)/100),0)
  const total=sb-sd
  const sinal=parseFloat(document.getElementById('vendaSinalValor')?.value||0)||0
  const restante=Math.max(0,total-sinal)
  const el=document.getElementById('vendaSinalRestante')
  if(el) el.textContent=brl(restante)
}


function buildReciboHTML(v){
  if(!v)return''
  let sb=0,sd=0,sc=0
  const linhasItens=(v.itens||[]).map(it=>{
    const bruto=it.preco*it.qtd,d=clamp(it.desconto||0),dv=bruto*(d/100),tot=bruto-dv
    sb+=bruto;sd+=dv;sc+=(it.custo||0)*it.qtd
    return'<div class="recibo-item">'+
      '<span>'+escHtml(it.produto||'—')+(it.qtd>1?' x'+it.qtd:'')+(d>0?' (-'+d+'%)':'')+'</span>'+
      '<span>'+brl(tot)+'</span>'+
    '</div>'
  }).join('')
  const total=sb-sd
  const empresaNome=config.empresaNome||'ASSENT Sistema'
  const empresaTel=config.empresaTel?'Tel: '+config.empresaTel:''
  const logoTag=config.logo?'<img src="'+config.logo+'" style="max-height:48px;max-width:120px;object-fit:contain;margin-bottom:6px"><br>':''
  return(
    '<div class="recibo-empresa">'+
      logoTag+
      '<div class="recibo-empresa-nome">'+escHtml(empresaNome)+'</div>'+
      (empresaTel?'<div class="recibo-empresa-sub">'+escHtml(empresaTel)+'</div>':'')+
    '</div>'+
    '<div class="recibo-linha"><span>🧾 Venda</span><span>'+escHtml(v.id||'—')+'</span></div>'+
    '<div class="recibo-linha"><span>👤 Cliente</span><span>'+escHtml(v.cliente||'Não informado')+'</span></div>'+
    '<div class="recibo-linha"><span>📅 Data</span><span>'+fmtData(v.data)+'</span></div>'+
    (v.formaPagamento?'<div class="recibo-linha"><span>💳 Pagamento</span><span>'+escHtml(v.formaPagamento)+'</span></div>':'')+
    '<hr class="recibo-sep">'+
    linhasItens+
    '<hr class="recibo-sep">'+
    (sd>0?'<div class="recibo-linha"><span>Subtotal</span><span>'+brl(sb)+'</span></div><div class="recibo-linha"><span>Desconto</span><span>-'+brl(sd)+'</span></div>':'')+
    '<div class="recibo-linha bold"><span>TOTAL</span><span>'+brl(total)+'</span></div>'+
    (v.obs?'<hr class="recibo-sep"><div style="font-size:11px;color:#555">📝 '+escHtml(v.obs)+'</div>':'')+
    '<div class="recibo-footer">'+new Date().toLocaleDateString('pt-BR')+' às '+new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})+'<br>'+escHtml(empresaNome)+'</div>'
  )
}


function cancelarServico(){servicoEditando=null;renderServicos()}


function closeEditProduto(){
  document.getElementById('modalEditProduto').classList.remove('open')
  _epIdx=null;_epFotoData=null
}
document.getElementById('modalEditProduto')?.addEventListener('click',e=>{
  if(e.target===document.getElementById('modalEditProduto'))closeEditProduto()
})

/* ══ TEMA CLARO / ESCURO ══ */


function closeGlobalSearch(){
  const inp=document.getElementById('globalSearchInput')
  const dd=document.getElementById('globalSearchDropdown')
  if(inp)inp.value=''
  if(dd)dd.style.display='none'
}
// Fecha dropdown ao clicar fora
document.addEventListener('click',e=>{
  if(!e.target.closest('#globalSearchWrap')){
    const dd=document.getElementById('globalSearchDropdown')
    if(dd)dd.style.display='none'
  }
})
// Atalho ⌘K / Ctrl+K
document.addEventListener('keydown',e=>{
  if((e.metaKey||e.ctrlKey)&&e.key==='k'){
    e.preventDefault()
    const inp=document.getElementById('globalSearchInput')
    if(inp){inp.focus();inp.select()}
  }
  if(e.key==='Escape'){
    closeGlobalSearch()
    document.getElementById('globalSearchInput')?.blur()
  }
})

/* ══ RECIBO PÓS-VENDA ══ */
let _vendaRecibo=null


function closeModalRecibo(){document.getElementById('modalRecibo').classList.remove('open')}
document.getElementById('modalRecibo')?.addEventListener('click',e=>{if(e.target===document.getElementById('modalRecibo'))closeModalRecibo()})


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

/* ═══ ELECTRON BRIDGE ═══ */
// Quando rodando no Electron, usa diálogos nativos e IPC para atualização
const isElectron=()=>!!(window.electronAPI?.isElectron)


function downloadBlob(blob,filename){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}

/* ══ IMPRIMIR VENDA ══ */


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


function editarProduto(i){
  _epIdx=i
  _epFotoData=null
  const p=produtos[i]
  document.getElementById('epNome').value=p.nome
  document.getElementById('epPreco').value=p.preco
  document.getElementById('epCusto').value=p.custo
  document.getElementById('epEstoque').value=p.estoque
  document.getElementById('epFotoNome').textContent=p.nome
  // foto preview
  const prev=document.getElementById('epFotoPreview')
  const remBtn=document.getElementById('epFotoRemoverBtn')
  if(p.foto){
    prev.innerHTML='<img src="'+p.foto+'" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius)">'
    remBtn.style.display='inline-flex'
  } else {
    prev.innerHTML='📦'
    prev.style.background=''
    remBtn.style.display='none'
  }
  atualizarEpMargem()
  // ouvintes de margem ao vivo
  document.getElementById('epPreco').oninput=atualizarEpMargem
  document.getElementById('epCusto').oninput=atualizarEpMargem
  document.getElementById('modalEditProduto').classList.add('open')
}


function editarServico(i){servicoEditando=i;renderServicos()}


function editarVendedorModal(i){
  const v=vendedores[i]
  // Inline edit — exibe campos na tabela
  _vendedorEditando=i
  renderVendedores()
}


function epHandleFoto(input){
  const file=input.files[0];if(!file)return
  if(file.size>512000){toast('⚠️ Imagem muito grande. Máx. 500kb.','warning');return}
  const r=new FileReader()
  r.onload=function(){
    _epFotoData=r.result
    const prev=document.getElementById('epFotoPreview')
    prev.innerHTML='<img src="'+r.result+'" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius)">'
    document.getElementById('epFotoRemoverBtn').style.display='inline-flex'
  }
  r.readAsDataURL(file)
  input.value=''
}


function epRemoverFoto(){
  _epFotoData=''
  const prev=document.getElementById('epFotoPreview')
  prev.innerHTML='📦';prev.style.background=''
  document.getElementById('epFotoRemoverBtn').style.display='none'
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


function excluirVendedor(i){
  const n=vendedores[i].nome
  showConfirm('Excluir o vendedor "'+escHtml(n)+'"? As vendas vinculadas mantêm o nome registrado.',()=>{
    vendedores.splice(i,1)
    toast('🗑️ Vendedor removido.','info')
    save()
  })
}


function exportarReciboPDF(){
  const v=_vendaRecibo;if(!v)return
  if(typeof jspdf==='undefined'&&typeof window.jspdf==='undefined'){
    // fallback para impressão se jsPDF não carregou
    toast('ℹ️ Abrindo para impressão como PDF…','info')
    imprimirReciboAtual();return
  }
  const {jsPDF}=window.jspdf
  const doc=new jsPDF({unit:'mm',format:[80,200],orientation:'portrait'})
  let y=10
  doc.setFontSize(13);doc.setFont('helvetica','bold')
  doc.text(config.empresaNome||'ASSENT Sistema',40,y,{align:'center'});y+=6
  if(config.empresaTel){doc.setFontSize(9);doc.setFont('helvetica','normal');doc.text('Tel: '+config.empresaTel,40,y,{align:'center'});y+=5}
  doc.setDrawColor(150);doc.line(5,y,75,y);y+=4
  doc.setFontSize(9);doc.setFont('helvetica','normal')
  doc.text('Venda: '+escHtml(v.id||'—'),5,y);y+=4
  doc.text('Cliente: '+(v.cliente||'—'),5,y);y+=4
  doc.text('Data: '+fmtData(v.data),5,y);y+=4
  if(v.formaPagamento){doc.text('Pagamento: '+v.formaPagamento,5,y);y+=4}
  doc.line(5,y,75,y);y+=4
  ;(v.itens||[]).forEach(it=>{
    const bruto=it.preco*it.qtd,d=clamp(it.desconto||0),tot=bruto-bruto*(d/100)
    const label=(it.produto||'—')+(it.qtd>1?' x'+it.qtd:'')+(d>0?' -'+d+'%':'')
    doc.text(label,5,y)
    doc.text(brl(tot),75,y,{align:'right'});y+=4
  })
  doc.line(5,y,75,y);y+=4
  doc.setFont('helvetica','bold');doc.setFontSize(11)
  doc.text('TOTAL',5,y);doc.text(brl(v.total||0),75,y,{align:'right'});y+=5
  if(v.obs){doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text('Obs: '+v.obs,5,y,{maxWidth:70});y+=6}
  doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(150)
  doc.text(new Date().toLocaleDateString('pt-BR')+' '+new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),40,y,{align:'center'})
  doc.save('recibo_'+(v.id||'venda')+'.pdf')
  toast('📄 Recibo salvo em PDF!')
}

/* ══ MELHORAR TOASTS ══ */
// Patch das mensagens restantes via wrappers explícitos — as funções individuais
// já foram atualizadas. As demais usamos override direto aqui.

/* ══ ATALHOS DE TECLADO — CONFIGURÁVEL ══ */

// Definição dos atalhos: id, descrição, tecla padrão, ação, editável
const ATALHOS_DEF = [
  {id:'nova-venda',   label:'Nova venda',        padrao:'N', fixo:false},
  {id:'novo-produto', label:'Novo produto',       padrao:'P', fixo:false},
  {id:'novo-cliente', label:'Novo cliente',       padrao:'C', fixo:false},
  {id:'novo-servico', label:'Novo serviço',       padrao:'S', fixo:false},
  {id:'dashboard',    label:'Dashboard',          padrao:'D', fixo:false},
  {id:'relatorios',   label:'Ir para Relatórios', padrao:'G', fixo:false},
  {id:'backup',       label:'Baixar backup',      padrao:'B', fixo:false},
  {id:'fechar',       label:'Fechar modal',       padrao:'Esc',fixo:true},
]

// Carrega customizações salvas; mantém padrão para o que não foi alterado
let _atalhos = (function(){
  try{
    const saved = JSON.parse(localStorage.getItem('assent_atalhos')||'{}')
    return ATALHOS_DEF.map(a=>({...a, tecla: saved[a.id]||a.padrao}))
  }catch(e){return ATALHOS_DEF.map(a=>({...a,tecla:a.padrao}))}
})()


function exportarRelCSV(){
  const {headers,rows}=getRelTableData();if(!rows.length){toast('Sem dados.','warning');return}
  const csv=[headers,...rows].map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\r\n')
  downloadBlob(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}),'relatorio_'+_relTipo+'_assent.csv');toast('⬇️ CSV exportado!')
}


function exportarRelExcel(){
  if(typeof XLSX==='undefined'){toast('Biblioteca Excel não carregada.','error');return}
  const {headers,rows}=getRelTableData();if(!rows.length){toast('Sem dados.','warning');return}
  const wb=XLSX.utils.book_new(),ws=XLSX.utils.aoa_to_sheet([headers,...rows])
  XLSX.utils.book_append_sheet(wb,ws,_relTipo.charAt(0).toUpperCase()+_relTipo.slice(1))
  XLSX.writeFile(wb,'relatorio_'+_relTipo+'_assent.xlsx');toast('📊 Excel exportado!')
}


function fecharCatDropdown(){
  _catBlurTimer=setTimeout(()=>{
    const dd=document.getElementById('catDropdown')
    if(dd)dd.style.display='none'
  },150)
}


function getCatOptions(selected){
  return'<option value="">— Sem categoria —</option>'+
    servicoCategorias.map(c=>'<option value="'+escHtml(c)+'"'+(c===selected?' selected':'')+'>'+escHtml(c)+'</option>').join('')
}

// ── Dropdown de categorias ──
let _catBlurTimer=null


function getRelTableData(){
  const pv=vendasRelPeriodo()
  if(_relTipo==='vendas')return{headers:['ID','Data','Cliente','Pagamento','Itens','Total (R$)','Lucro est. (R$)'],rows:pv.map(v=>[v.id||'',v.data||'',v.cliente||'',v.formaPagamento||'',(v.itens||[]).length,(v.total||0).toFixed(2),calcLucroVenda(v).toFixed(2)])}
  if(_relTipo==='faturamento'){const porDia={},fat=pv.reduce((t,v)=>t+(v.total||0),0);pv.forEach(v=>{const d=v.data||'?';porDia[d]=(porDia[d]||0)+(v.total||0)});return{headers:['Data','Nº Vendas','Faturamento (R$)','% do Total'],rows:Object.entries(porDia).sort((a,b)=>b[0]>a[0]?1:-1).map(([d,val])=>[d,pv.filter(v=>v.data===d).length,val.toFixed(2),(fat>0?(val/fat*100).toFixed(1):'0')+'%'])}}
  if(_relTipo==='lucro'){const porProd={};pv.forEach(v=>(v.itens||[]).forEach(it=>{const desc=clamp(it.desconto||0),l=(it.preco*(1-desc/100)-(it.custo||0))*it.qtd,np=it.produto||'—';if(!porProd[np])porProd[np]={fat:0,lucro:0,qtd:0};porProd[np].fat+=it.preco*it.qtd*(1-desc/100);porProd[np].lucro+=l;porProd[np].qtd+=it.qtd}));return{headers:['Produto','Qtd','Faturamento (R$)','Lucro (R$)','Margem (%)'],rows:Object.entries(porProd).sort((a,b)=>b[1].lucro-a[1].lucro).map(([nome,d])=>[nome,d.qtd,d.fat.toFixed(2),d.lucro.toFixed(2),(d.fat>0?(d.lucro/d.fat*100).toFixed(1):'0')+'%'])}}
  if(_relTipo==='estoque')return{headers:['Produto','Preço (R$)','Custo (R$)','Margem (%)','Estoque','Valor (R$)'],rows:produtos.map(p=>[p.nome,p.preco.toFixed(2),p.custo.toFixed(2),(p.preco>0?((p.preco-p.custo)/p.preco*100).toFixed(1):'0')+'%',p.estoque,(p.custo*p.estoque).toFixed(2)])}
  if(_relTipo==='ranking'){
    const map={};pv.forEach(v=>(v.itens||[]).forEach(it=>{const k=it.produto||'—';if(!map[k])map[k]={nome:k,qtd:0,fat:0,lucro:0};const desc=clamp(it.desconto||0),tot=it.preco*it.qtd*(1-desc/100),luc=(it.preco*(1-desc/100)-(it.custo||0))*it.qtd;map[k].qtd+=it.qtd;map[k].fat+=tot;map[k].lucro+=luc}))
    const lista=Object.values(map).sort((a,b)=>b.qtd-a.qtd)
    return{headers:['Produto','Qtd vendida','Faturamento (R$)','Lucro est. (R$)'],rows:lista.map(x=>[x.nome,x.qtd,x.fat.toFixed(2),x.lucro.toFixed(2)])}
  }
  if(_relTipo==='clientes'){
    const map={};pv.forEach(v=>{const k=v.cliente||'Não informado';if(!map[k])map[k]={nome:k,qtd:0,fat:0,lucro:0};map[k].qtd++;map[k].fat+=(v.total||0);map[k].lucro+=calcLucroVenda(v)})
    return{headers:['Cliente','Nº Compras','Total gasto (R$)','Lucro est. (R$)'],rows:Object.values(map).sort((a,b)=>b.fat-a.fat).map(x=>[x.nome,x.qtd,x.fat.toFixed(2),x.lucro.toFixed(2)])}
  }
  if(_relTipo.startsWith('despesas')){
    const hj=hoje()
    let lista=_filtrarDespesasPorPeriodo([...despesas])
    if(_despesasSubTipo==='vencidas')lista=lista.filter(d=>!d.paga&&d.venc<hj)
    else if(_despesasSubTipo==='abertas')lista=lista.filter(d=>!d.paga)
    else if(_despesasSubTipo==='pagas')lista=lista.filter(d=>d.paga)
    return{headers:['Descrição','Categoria','Fornecedor','Valor (R$)','Vencimento','Status'],rows:lista.map(d=>[d.nome,d.categoria||'',d.fornecedor||'',d.valor.toFixed(2),d.venc,d.paga?'Paga':d.venc<hj?'Vencida':'Pendente'])}
  }
  if(_relTipo==='fornecedores_rel'){
    const map={}
    despesas.forEach(d=>{if(!d.fornecedor)return;const k=d.fornecedor;if(!map[k])map[k]={nome:k,qtd:0,total:0,pago:0};map[k].qtd++;map[k].total+=d.valor;if(d.paga)map[k].pago+=d.valor})
    return{headers:['Fornecedor','Nº Despesas','Total (R$)','Pago (R$)','Pendente (R$)'],rows:Object.values(map).sort((a,b)=>b.total-a.total).map(x=>[x.nome,x.qtd,x.total.toFixed(2),x.pago.toFixed(2),(x.total-x.pago).toFixed(2)])}
  }
  if(_relTipo==='pagamentos'){
    const map={}
    pv.forEach(v=>{const k=v.formaPagamento||'Não informado';if(!map[k])map[k]={metodo:k,qtd:0,total:0};map[k].qtd++;map[k].total+=(v.total||0)})
    const lista=Object.values(map).sort((a,b)=>b.total-a.total)
    const totalGeral=lista.reduce((t,x)=>t+x.total,0)
    return{headers:['Método','Nº Vendas','Total (R$)','Participação (%)'],rows:lista.map(x=>[x.metodo,x.qtd,x.total.toFixed(2),(totalGeral>0?(x.total/totalGeral*100).toFixed(1):'0')+'%'])}
  }
  if(_relTipo==='compras_forn'){
    const {lista}=_getComprasFornData()
    return{headers:['Fornecedor','Nº Entradas','Produtos','Qtd total'],rows:lista.map(x=>[x.nome,x.qtd,x.produtos.join(', '),x.qtdTotal])}
  }
  if(_relTipo==='vendedores_rel'){
    const pv=vendasRelPeriodo()
    const map={}
    pv.forEach(v=>{const k=v.vendedor||'Não informado';if(!map[k])map[k]={nome:k,qtd:0,total:0,lucro:0};map[k].qtd++;map[k].total+=(v.total||0);map[k].lucro+=calcLucroVenda(v)})
    let lista=Object.values(map).sort((a,b)=>b.total-a.total)
    if(_vendedorFiltroAtivo)lista=lista.filter(x=>x.nome===_vendedorFiltroAtivo)
    return{headers:['Vendedor','Nº Vendas','Faturamento (R$)','Lucro est. (R$)','Ticket médio (R$)'],rows:lista.map(x=>[x.nome,x.qtd,x.total.toFixed(2),x.lucro.toFixed(2),(x.qtd?x.total/x.qtd:0).toFixed(2)])}
  }
  if(_relTipo==='dre'){
    const {linhas}=_calcDRE()
    return{headers:['Conta','Valor (R$)'],rows:linhas.map(l=>[l.label,l.valor.toFixed(2)])}
  }
  if(_relTipo==='fiado_rel'){
    const hj=hoje()
    const lista=vendas.filter(v=>v.fiado)
    return{headers:['Venda','Cliente','Data','Vencimento','Valor (R$)','Status','Recebido em'],
      rows:lista.map(v=>[v.id||'',v.cliente||'',v.data||'',v.fiadoVenc||'',
        (v.total||0).toFixed(2),
        v.fiadoRecebido?'Recebido':v.fiadoVenc&&v.fiadoVenc<hj?'Vencido':'Pendente',
        v.fiadoDataRecebimento||''])}
  }
  return{headers:[],rows:[]}
}


function getTecla(id){return(_atalhos.find(a=>a.id===id)||{}).tecla||''}

// Render da página de atalhos


function goToCliente(i){
  clearTimeout(_gsBlurTimer)
  closeGlobalSearch()
  showPage('clientes',document.querySelector('.nav-btn:nth-child(3)'))
  setTimeout(()=>{
    const b=document.getElementById('buscaCliente')
    if(b){b.value=clientes[i].nome;renderClientes()}
  },50)
}


function goToProduto(i){
  clearTimeout(_gsBlurTimer)
  closeGlobalSearch()
  showPage('produtos',document.querySelector('.nav-btn:nth-child(4)'))
  setTimeout(()=>{
    const b=document.getElementById('buscaProduto')
    if(b){b.value=produtos[i].nome;renderProdutos()}
  },50)
}


function goToServicos(){
  clearTimeout(_gsBlurTimer)
  closeGlobalSearch()
  const btn=Array.from(document.querySelectorAll('.nav-btn')).find(b=>b.textContent.includes('Serviços'))
  showPage('servicos',btn)
}


function goToVenda(i){
  clearTimeout(_gsBlurTimer)
  closeGlobalSearch()
  const btn=Array.from(document.querySelectorAll('.nav-btn')).find(b=>b.textContent.includes('Vendas'))
  showPage('vendas',btn)
  setTimeout(()=>{
    const b=document.getElementById('buscaVenda')
    if(b){b.value=vendas[i].id||vendas[i].cliente;renderVendas()}
    // abre modal de detalhe
    openModalVenda(vendas[i])
  },80)
}


function hideGlobalDropdown(){
  _gsBlurTimer=setTimeout(()=>{
    const dd=document.getElementById('globalSearchDropdown')
    if(dd)dd.style.display='none'
  },200)
}


function imprimirReciboAtual(){
  const v=_vendaRecibo;if(!v)return
  const html='<!DOCTYPE html><html lang="pt-br"><head><meta charset="UTF-8"><title>Recibo '+escHtml(v.id||'')+'</title>'+
    '<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:\'Courier New\',monospace;max-width:320px;margin:0 auto;padding:12px;font-size:12px;color:#111}.empresa{text-align:center;margin-bottom:10px;padding-bottom:10px;border-bottom:1px dashed #999}.empresa-nome{font-size:15px;font-weight:700}.linha{display:flex;justify-content:space-between;padding:2px 0}.linha.bold{font-weight:700;font-size:13px;border-top:1px dashed #999;margin-top:4px;padding-top:5px}.item{display:flex;justify-content:space-between;padding:1px 0}.sep{border:none;border-top:1px dashed #999;margin:7px 0}.footer{text-align:center;font-size:10px;color:#888;margin-top:10px}img{max-height:48px;max-width:120px;display:block;margin:0 auto 6px}@media print{@page{margin:4mm;size:80mm auto}}</style></head><body>'+
    '<div class="empresa">'+
      (config.logo?'<img src="'+config.logo+'">':'')+
      '<div class="empresa-nome">'+(config.empresaNome||'ASSENT Sistema')+'</div>'+
      (config.empresaTel?'<div>Tel: '+escHtml(config.empresaTel)+'</div>':'')+
    '</div>'+
    '<div class="linha"><span>Venda</span><span>'+escHtml(v.id||'—')+'</span></div>'+
    '<div class="linha"><span>Cliente</span><span>'+escHtml(v.cliente||'—')+'</span></div>'+
    '<div class="linha"><span>Data</span><span>'+fmtData(v.data)+'</span></div>'+
    (v.formaPagamento?'<div class="linha"><span>Pagamento</span><span>'+escHtml(v.formaPagamento)+'</span></div>':'')+
    '<hr class="sep">'+
    (v.itens||[]).map(it=>{
      const bruto=it.preco*it.qtd,d=clamp(it.desconto||0),tot=bruto-bruto*(d/100)
      return'<div class="item"><span>'+escHtml(it.produto||'—')+(it.qtd>1?' x'+it.qtd:'')+(d>0?' -'+d+'%':'')+'</span><span>'+brl(tot)+'</span></div>'
    }).join('')+
    '<hr class="sep">'+
    '<div class="linha bold"><span>TOTAL</span><span>'+brl(v.total||0)+'</span></div>'+
    (v.obs?'<hr class="sep"><div style="font-size:10px;color:#555">'+escHtml(v.obs)+'</div>':'')+
    '<div class="footer">'+new Date().toLocaleDateString('pt-BR')+' '+new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})+'</div>'+
    '<script>window.onload=function(){window.print();window.onafterprint=function(){window.close()}}<\/script>'+
    '</body></html>'
  const w=window.open('','_blank','width=400,height=600')
  if(!w){toast('⚠️ Pop-up bloqueado.','warning');return}
  w.document.write(html);w.document.close()
}


function imprimirRelatorio(){
  const periodoLabel={'7':'Últimos 7 dias','30':'Últimos 30 dias','mes':'Este mês','todos':'Todo o histórico','custom':'Período personalizado'}[_relPeriod]||''
  const tipoLabel={vendas:'Vendas',faturamento:'Faturamento',lucro:'Lucro',estoque:'Estoque'}[_relTipo]
  const html='<!DOCTYPE html><html lang="pt-br"><head><meta charset="UTF-8"><title>Relatório de '+tipoLabel+'</title><style>body{font-family:\'Segoe UI\',sans-serif;margin:30px;color:#111;font-size:13px}h1{font-size:20px;font-weight:700;margin-bottom:4px}.sub{font-size:12px;color:#555;margin-bottom:20px}.summary{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:20px}.sum-card{border:1px solid #ddd;border-radius:8px;padding:12px 18px;min-width:130px}.sum-label{font-size:10px;text-transform:uppercase;color:#777;margin-bottom:4px}.sum-value{font-size:18px;font-weight:700}table{width:100%;border-collapse:collapse}th{background:#f0f0f0;font-size:11px;text-transform:uppercase;padding:8px 10px;text-align:left;border:1px solid #ddd}td{padding:8px 10px;border:1px solid #ddd;font-size:12px}.badge{display:inline-block;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:600}.badge-green{background:#dcfce7;color:#16a34a}.badge-yellow{background:#fef9c3;color:#b45309}.badge-red{background:#fee2e2;color:#dc2626}.badge-blue{background:#e0f2fe;color:#0369a1}.footer{margin-top:30px;font-size:11px;color:#aaa;border-top:1px solid #eee;padding-top:10px}@media print{@page{margin:15mm}}</style></head><body>'+
    '<h1>Relatório — '+tipoLabel+'</h1><div class="sub">Período: '+periodoLabel+' · Gerado em '+new Date().toLocaleDateString('pt-BR')+' às '+new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})+'</div>'+
    '<div class="summary">'+document.getElementById('relSummary').innerHTML.replace(/class="rel-sum-card"/g,'class="sum-card"').replace(/class="rel-sum-label"/g,'class="sum-label"').replace(/class="rel-sum-value"[^>]*>/g,_=>'class="sum-value">')+'</div>'+
    document.getElementById('relTableContent').innerHTML+
    '<div class="footer">ASSENT Sistema v1.2</div><script>window.onload=function(){window.print();window.onafterprint=function(){window.close()}}<\/script></body></html>'
  const w=window.open('','_blank','width=1000,height=750');if(!w){toast('Pop-up bloqueado.','warning');return}
  w.document.write(html);w.document.close()
}

/* ══ SERVIÇOS ══ */


function imprimirVenda(){
  const v=_vendaAtual;if(!v)return
  let sb=0,sd=0,sc=0
  const linhas=(v.itens||[]).map(it=>{const bruto=it.preco*it.qtd,d=clamp(it.desconto||0),dv=bruto*(d/100),total=bruto-dv,custo=(it.custo||0)*it.qtd;sb+=bruto;sd+=dv;sc+=custo;return'<tr><td>'+escHtml(it.produto||'—')+'</td><td style="text-align:center">'+it.qtd+'</td><td style="text-align:right">'+brl(it.preco)+'</td><td style="text-align:right">'+brl(it.custo||0)+'</td><td style="text-align:center">'+(d>0?d+'%':'—')+'</td><td style="text-align:right">'+brl(total)+'</td></tr>'}).join('')
  const total=sb-sd
  const html='<!DOCTYPE html><html lang="pt-br"><head><meta charset="UTF-8"><title>Venda '+escHtml(v.id||'—')+'</title><style>body{font-family:\'Segoe UI\',sans-serif;margin:30px;color:#111;font-size:13px}h1{font-size:20px;font-weight:700;margin-bottom:4px}.meta{font-size:12px;color:#555;margin-bottom:20px;line-height:1.7}table{width:100%;border-collapse:collapse;margin-bottom:16px}th{background:#f0f0f0;font-size:11px;text-transform:uppercase;padding:8px 10px;text-align:left;border:1px solid #ddd}td{padding:8px 10px;border:1px solid #ddd;font-size:12px}.totals{display:flex;gap:16px;flex-wrap:wrap;margin-top:8px}.tot-item{border:1px solid #ddd;border-radius:6px;padding:10px 16px}.tot-label{font-size:10px;text-transform:uppercase;color:#777;margin-bottom:3px}.tot-value{font-size:15px;font-weight:700}.footer{margin-top:30px;font-size:11px;color:#aaa;border-top:1px solid #eee;padding-top:10px}@media print{@page{margin:15mm}}</style></head><body>'+
    '<h1>Venda '+escHtml(v.id||'—')+'</h1><div class="meta"><b>Cliente:</b> '+escHtml(v.cliente||'Não informado')+'<br><b>Data:</b> '+fmtData(v.data)+(v.formaPagamento?'<br><b>Pagamento:</b> '+escHtml(v.formaPagamento):'')+
    '<br><b>Emitido em:</b> '+new Date().toLocaleDateString('pt-BR')+' às '+new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})+'</div>'+
    (v.obs?'<div style="background:#f9f9f9;border:1px solid #ddd;border-radius:6px;padding:10px;margin-bottom:14px;font-size:12px">'+escHtml(v.obs)+'</div>':'')+
    '<table><thead><tr><th>Produto</th><th style="text-align:center">Qtd</th><th style="text-align:right">Preço</th><th style="text-align:right">Custo</th><th style="text-align:center">Desc.</th><th style="text-align:right">Total</th></tr></thead><tbody>'+linhas+'</tbody></table>'+
    '<div class="totals"><div class="tot-item"><div class="tot-label">Subtotal</div><div class="tot-value">'+brl(sb)+'</div></div><div class="tot-item"><div class="tot-label">Descontos</div><div class="tot-value">'+brl(sd)+'</div></div><div class="tot-item"><div class="tot-label">Total</div><div class="tot-value" style="color:#16a34a">'+brl(total)+'</div></div><div class="tot-item"><div class="tot-label">Lucro est.</div><div class="tot-value" style="color:#4f46e5">'+brl(total-sc)+'</div></div></div>'+
    '<div class="footer">ASSENT Sistema v1.2</div><script>window.onload=function(){window.print();window.onafterprint=function(){window.close()}}<\/script></body></html>'
  const w=window.open('','_blank','width=900,height=700');if(!w){toast('Pop-up bloqueado.','warning');return}
  w.document.write(html);w.document.close()
}

/* ══ CAIXA DIÁRIO ══ */


function iniciarCaptura(id, el){
  if(_capturingId===id){
    // clicou de novo → cancela
    _capturingId=null
    renderAtalhosPage()
    return
  }
  _capturingId=id
  renderAtalhosPage()
}


function initOnboarding(){
  try{if(localStorage.getItem('assent_onboarding_done'))return}catch(e){return}
  const allDone=ONBOARDING_STEPS.every(s=>s.check())
  if(allDone){try{localStorage.setItem('assent_onboarding_done','1')}catch(e){}; return}
  renderOnboarding()
  const ov=document.getElementById('onboardingOverlay')
  if(ov)ov.style.display='flex'
}


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


function onCatSearch(q){
  // Limpa seleção anterior ao digitar
  document.getElementById('servicoCategoria').value=''
  renderCatDropdown(q)
}


function onFormaPgtoChange(){
  const v=document.getElementById('vendaFormaPgto').value
  const fg=document.getElementById('fgFiadoVenc')
  const fs=document.getElementById('fgSinal')
  if(fg) fg.style.display=(v==='Fiado'||v==='Parcelado')?'block':'none'
  if(fs) fs.style.display=v==='Sinal'?'block':'none'
  if(v==='Sinal') atualizarRestanteSinal()
}


function openModalGerenciarCategorias(){
  renderGerenciarCategorias()
  openModal('modalGerenciarCategorias')
}


function renderAtalhosPage(){
  const el=document.getElementById('atalhosList');if(!el)return
  el.innerHTML=_atalhos.map(a=>{
    if(a.fixo){
      return'<div class="shortcut-row">'+
        '<span class="shortcut-desc">'+escHtml(a.label)+'</span>'+
        '<span class="shortcut-badge-fixed"><kbd style="font-family:\'JetBrains Mono\',monospace;font-size:11px;background:var(--surface3);border:1px solid var(--border2);border-radius:4px;padding:2px 8px">'+escHtml(a.tecla)+'</kbd> &nbsp;fixo</span>'+
      '</div>'
    }
    const capturing=_capturingId===a.id
    return'<div class="shortcut-row">'+
      '<span class="shortcut-desc">'+escHtml(a.label)+'</span>'+
      '<div style="display:flex;align-items:center;gap:8px">'+
        (capturing
          ? '<span style="font-size:12px;color:var(--accent)">Pressione a nova tecla…</span>'
          : '')+
        '<span class="kbd-edit'+(capturing?' capturing':'')+(a.conflict?' conflict':'')+'" '+
          'onclick="iniciarCaptura(\''+a.id+'\',this)" '+
          'title="Clique para editar">'+
          escHtml(capturing?'…':a.tecla)+
        '</span>'+
        (a.tecla!==a.padrao
          ? '<button class="btn btn-ghost btn-sm" style="padding:3px 8px;font-size:11px" onclick="resetarAtalho(\''+a.id+'\')" title="Restaurar padrão ('+a.padrao+')">↺</button>'
          : '')+
      '</div>'+
    '</div>'
  }).join('')
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


function renderChHistorico(){
  const vv=vendasDoCliente(_chClienteNome,_chPeriod)
  const totalGasto=vv.reduce((t,v)=>t+(v.total||0),0)
  const totalItens=vv.reduce((t,v)=>t+(v.itens||[]).reduce((s,it)=>s+it.qtd,0),0)
  // Cards de resumo
  document.getElementById('chCards').innerHTML=
    '<div style="background:var(--surface3);border:1px solid var(--border2);border-radius:var(--radius);padding:12px 14px">'+
      '<div style="font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:var(--text-muted);margin-bottom:4px">Compras</div>'+
      '<div style="font-family:\'JetBrains Mono\',monospace;font-size:20px;font-weight:700;color:var(--purple)">'+vv.length+'</div>'+
    '</div>'+
    '<div style="background:var(--surface3);border:1px solid var(--border2);border-radius:var(--radius);padding:12px 14px">'+
      '<div style="font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:var(--text-muted);margin-bottom:4px">Total gasto</div>'+
      '<div style="font-family:\'JetBrains Mono\',monospace;font-size:20px;font-weight:700;color:var(--green)">'+brl(totalGasto)+'</div>'+
    '</div>'+
    '<div style="background:var(--surface3);border:1px solid var(--border2);border-radius:var(--radius);padding:12px 14px">'+
      '<div style="font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:var(--text-muted);margin-bottom:4px">Itens comprados</div>'+
      '<div style="font-family:\'JetBrains Mono\',monospace;font-size:20px;font-weight:700;color:var(--accent)">'+totalItens+'</div>'+
    '</div>'
  // Lista de compras
  const lista=document.getElementById('chLista')
  if(!vv.length){
    lista.innerHTML='<div style="text-align:center;padding:28px;color:var(--text-muted);font-size:13px">Nenhuma compra no período</div>'
    return
  }
  lista.innerHTML=vv.map(v=>{
    const itensResume=(v.itens||[]).map(it=>escHtml(it.produto)+(it.qtd>1?' ×'+it.qtd:'')).join(', ')
    const pgto=v.formaPagamento?'<span style="font-size:11px;background:var(--surface3);border:1px solid var(--border2);border-radius:99px;padding:1px 8px;color:var(--text-muted)">'+escHtml(v.formaPagamento)+'</span>':''
    return'<div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);padding:12px 16px;cursor:pointer;transition:border-color .12s" '+
        'onclick="openModalVenda(vendas['+vendas.indexOf(v)+'])" onmouseenter="this.style.borderColor=\'var(--accent)\'" onmouseleave="this.style.borderColor=\'var(--border)\'">'+
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">'+
        '<div style="display:flex;align-items:center;gap:8px">'+
          '<span class="badge badge-blue" style="font-size:10px">'+escHtml(v.id||'—')+'</span>'+
          '<span style="font-size:13px;color:var(--text-muted)">'+fmtData(v.data)+'</span>'+
          pgto+
        '</div>'+
        '<span style="font-family:\'JetBrains Mono\',monospace;font-size:14px;font-weight:700;color:var(--green)">'+brl(v.total)+'</span>'+
      '</div>'+
      '<div style="font-size:12px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+itensResume+'</div>'+
    '</div>'
  }).join('')
}


function renderDashDespesas(){
  const el=document.getElementById('dashDespesasResumo');if(!el)return
  const hj=hoje()
  const em3=new Date();em3.setDate(em3.getDate()+3);const em3str=em3.toISOString().split('T')[0]
  const mesAtual=hj.slice(0,7)
  const vencidas=despesas.filter(d=>!d.paga&&d.venc<hj)
  const urgentes=despesas.filter(d=>!d.paga&&d.venc>=hj&&d.venc<=em3str)
  const pendentes=despesas.filter(d=>!d.paga)
  const pagasMes=despesas.filter(d=>d.paga&&(d.dataPagamento||'').slice(0,7)===mesAtual)
  const totalMes=despesas.filter(d=>d.venc.slice(0,7)===mesAtual)
  if(!despesas.length){
    el.innerHTML='<div style="padding:12px 0;text-align:center;color:var(--text-muted);font-size:13px">Nenhuma despesa cadastrada. <button class="btn btn-ghost btn-sm" onclick="showPage(\'despesas\',document.querySelector(\'[data-tip=Despesas]\'))">Cadastrar →</button></div>'
    return
  }
  el.innerHTML=
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;padding:8px 0">'+
      '<div style="background:var(--red-dim);border:1px solid var(--red);border-radius:var(--radius);padding:10px 14px;cursor:pointer" onclick="showPage(\'despesas\',document.querySelector(\'[data-tip=Despesas]\'))">'+
        '<div style="font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:var(--red);margin-bottom:3px">🔴 Vencidas</div>'+
        '<div style="font-size:20px;font-weight:700;color:var(--red);font-family:\'JetBrains Mono\',monospace">'+vencidas.length+'</div>'+
        '<div style="font-size:11px;color:var(--red);opacity:.8">'+brl(vencidas.reduce((t,d)=>t+d.valor,0))+'</div>'+
      '</div>'+
      '<div style="background:var(--yellow-dim);border:1px solid var(--yellow);border-radius:var(--radius);padding:10px 14px;cursor:pointer" onclick="showPage(\'despesas\',document.querySelector(\'[data-tip=Despesas]\'))">'+
        '<div style="font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:var(--yellow);margin-bottom:3px">⚠️ A vencer (3d)</div>'+
        '<div style="font-size:20px;font-weight:700;color:var(--yellow);font-family:\'JetBrains Mono\',monospace">'+urgentes.length+'</div>'+
        '<div style="font-size:11px;color:var(--yellow);opacity:.8">'+brl(urgentes.reduce((t,d)=>t+d.valor,0))+'</div>'+
      '</div>'+
      '<div style="background:var(--surface3);border:1px solid var(--border2);border-radius:var(--radius);padding:10px 14px">'+
        '<div style="font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:var(--text-muted);margin-bottom:3px">⏳ Pendentes</div>'+
        '<div style="font-size:20px;font-weight:700;color:var(--text);font-family:\'JetBrains Mono\',monospace">'+pendentes.length+'</div>'+
        '<div style="font-size:11px;color:var(--text-muted)">'+brl(pendentes.reduce((t,d)=>t+d.valor,0))+'</div>'+
      '</div>'+
      '<div style="background:var(--green-dim);border:1px solid var(--green);border-radius:var(--radius);padding:10px 14px">'+
        '<div style="font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:var(--green);margin-bottom:3px">✅ Pagas este mês</div>'+
        '<div style="font-size:20px;font-weight:700;color:var(--green);font-family:\'JetBrains Mono\',monospace">'+pagasMes.length+'</div>'+
        '<div style="font-size:11px;color:var(--green);opacity:.8">'+brl(pagasMes.reduce((t,d)=>t+d.valor,0))+'</div>'+
      '</div>'+
    '</div>'+
    (totalMes.length?
      '<div style="font-size:12px;color:var(--text-muted);padding:4px 0 2px">'+
        'Total do mês: <strong style="color:var(--text)">'+brl(totalMes.reduce((t,d)=>t+d.valor,0))+'</strong>'+
        ' &nbsp;·&nbsp; Pago: <strong style="color:var(--green)">'+brl(pagasMes.reduce((t,d)=>t+d.valor,0))+'</strong>'+
        ' &nbsp;·&nbsp; Pendente: <strong style="color:var(--yellow)">'+brl(totalMes.filter(d=>!d.paga).reduce((t,d)=>t+d.valor,0))+'</strong>'+
      '</div>':''
    )
}

/* ══ RELATÓRIO: DESPESAS ══ */


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


function renderOnboarding(){
  const el=document.getElementById('onboardingSteps');if(!el)return
  el.innerHTML=ONBOARDING_STEPS.map((s,i)=>{
    const done=s.check()
    const active=i===_onbStep&&!done
    const cls=done?'done':active?'active':''
    return'<div class="onboarding-step '+cls+'" onclick="onboardingGoTo('+i+')">'+
      '<div class="onboarding-step-icon">'+(done?'✅':s.icon)+'</div>'+
      '<div class="onboarding-step-text">'+
        '<div class="onboarding-step-title">'+escHtml(s.title)+'</div>'+
        '<div class="onboarding-step-sub">'+escHtml(s.sub)+'</div>'+
      '</div>'+
      (done?'<span style="color:var(--green);font-size:18px">✓</span>':'<span style="font-size:12px;color:var(--text-muted)">→</span>')+
    '</div>'
  }).join('')
  // Atualiza botão
  const btn=document.getElementById('onboardingNextBtn')
  if(!btn)return
  const pendente=ONBOARDING_STEPS.find(s=>!s.check())
  if(!pendente){btn.textContent='Concluir ✅';return}
  btn.textContent='Ir para: '+pendente.title+' →'
  _onbStep=ONBOARDING_STEPS.indexOf(pendente)
}


function renderRelClientes(pv,sumEl,titleEl,countEl,contentEl){
  const map={}
  pv.forEach(v=>{
    const k=v.cliente||'Não informado'
    if(!map[k])map[k]={nome:k,qtd:0,fat:0,lucro:0}
    map[k].qtd++
    map[k].fat+=(v.total||0)
    map[k].lucro+=calcLucroVenda(v)
  })
  const lista=Object.values(map).sort((a,b)=>b.fat-a.fat)
  const totalFat=lista.reduce((t,x)=>t+x.fat,0)
  sumEl.innerHTML=
    '<div class="rel-sum-card"><div class="rel-sum-label">Clientes ativos</div><div class="rel-sum-value" style="color:var(--blue,var(--accent))">'+lista.length+'</div></div>'+
    '<div class="rel-sum-card"><div class="rel-sum-label">Total faturado</div><div class="rel-sum-value" style="color:var(--green)">'+brl(totalFat)+'</div></div>'+
    '<div class="rel-sum-card"><div class="rel-sum-label">Ticket médio/cliente</div><div class="rel-sum-value" style="color:var(--yellow)">'+brl(lista.length?totalFat/lista.length:0)+'</div></div>'
  titleEl.textContent='Faturamento por cliente'
  countEl.textContent=lista.length+' clientes'
  if(!lista.length){contentEl.innerHTML='<div class="empty-state"><span class="empty-icon">👥</span>Sem dados</div>';return}
  contentEl.innerHTML='<table><thead><tr><th>Cliente</th><th>Nº compras</th><th>Total gasto</th><th>Participação</th><th>Lucro est.</th></tr></thead><tbody>'+
    lista.map(x=>{
      const pct=totalFat>0?(x.fat/totalFat*100).toFixed(1):0
      return'<tr>'+
        '<td>'+escHtml(x.nome)+'</td>'+
        '<td class="td-muted">'+x.qtd+'</td>'+
        '<td class="td-mono" style="font-weight:600">'+brl(x.fat)+'</td>'+
        '<td style="min-width:110px"><div style="display:flex;align-items:center;gap:8px"><div style="flex:1;background:var(--surface3);border-radius:99px;height:6px;overflow:hidden"><div style="background:var(--green);height:100%;width:'+pct+'%"></div></div><span style="font-size:12px;color:var(--text-muted);width:36px;text-align:right">'+pct+'%</span></div></td>'+
        '<td class="td-mono" style="color:var(--indigo)">'+brl(x.lucro)+'</td>'+
      '</tr>'
    }).join('')+
  '</tbody></table>'
}

/* ══ DASHBOARD: RESUMO DESPESAS ══ */


function renderRelComprasFornecedor(pv,sumEl,titleEl,countEl,contentEl){
  const {lista,entradasFiltradas}=_getComprasFornData()
  const totalEntradas=lista.reduce((t,x)=>t+x.qtd,0)
  const totalQtd=lista.reduce((t,x)=>t+x.qtdTotal,0)
  const totalCusto=lista.reduce((t,x)=>t+x.custoTotal,0)
  sumEl.innerHTML=
    '<div class="rel-sum-card"><div class="rel-sum-label">Fornecedores</div><div class="rel-sum-value" style="color:var(--accent)">'+lista.length+'</div></div>'+
    '<div class="rel-sum-card"><div class="rel-sum-label">Entradas no período</div><div class="rel-sum-value" style="color:var(--purple)">'+totalEntradas+'</div></div>'+
    '<div class="rel-sum-card"><div class="rel-sum-label">Unidades recebidas</div><div class="rel-sum-value" style="color:var(--yellow)">'+totalQtd+'</div></div>'+
    (totalCusto>0?'<div class="rel-sum-card"><div class="rel-sum-label">Custo estimado</div><div class="rel-sum-value" style="color:var(--red)">'+brl(totalCusto)+'</div></div>':'')
  titleEl.textContent='Compras por fornecedor no período'
  countEl.textContent=lista.length+' fornecedor'+(lista.length!==1?'es':'')
  if(!lista.length){
    contentEl.innerHTML='<div class="empty-state"><span class="empty-icon">🏭</span>Nenhuma entrada com fornecedor no período<br><span style="font-size:12px;color:var(--text-muted)">Selecione um fornecedor ao registrar entradas de estoque.</span></div>'
    return
  }
  const maxQtd=lista[0].qtdTotal||1
  contentEl.innerHTML='<table><thead><tr>'+
    '<th>#</th><th>Fornecedor</th><th>Nº Entradas</th><th>Qtd recebida</th><th>Participação</th>'+
    (totalCusto>0?'<th>Custo estimado</th>':'')+
    '<th>Produtos recebidos</th></tr></thead><tbody>'+
    lista.map((x,pos)=>{
      const pct=totalQtd>0?(x.qtdTotal/totalQtd*100).toFixed(1):0
      const barW=(x.qtdTotal/maxQtd*100).toFixed(0)
      const medal=pos===0?'🥇':pos===1?'🥈':pos===2?'🥉':'<span style="font-size:11px;color:var(--text-muted)">'+(pos+1)+'</span>'
      const forn=fornecedores.find(f=>f.nome===x.nome)
      const fornInfo=forn?(forn.tel?'<div style="font-size:11px;color:var(--text-muted)">'+escHtml(forn.tel)+(forn.formaPgto?' · '+escHtml(forn.formaPgto):'')+'</div>':''):'<div style="font-size:11px;color:var(--text-muted)">Não cadastrado</div>'
      return'<tr>'+
        '<td style="text-align:center;font-size:18px">'+medal+'</td>'+
        '<td><strong>'+escHtml(x.nome)+'</strong>'+fornInfo+'</td>'+
        '<td class="td-muted" style="font-weight:600">'+x.qtd+'</td>'+
        '<td class="td-mono" style="font-weight:700;color:var(--accent)">'+x.qtdTotal+' un.</td>'+
        '<td style="min-width:120px"><div style="display:flex;align-items:center;gap:8px">'+
          '<div style="flex:1;background:var(--surface3);border-radius:99px;height:6px;overflow:hidden">'+
            '<div style="background:var(--accent);height:100%;width:'+barW+'%"></div>'+
          '</div>'+
          '<span style="font-size:12px;color:var(--text-muted);width:36px;text-align:right">'+pct+'%</span>'+
        '</div></td>'+
        (totalCusto>0?'<td class="td-mono" style="color:var(--red)">'+brl(x.custoTotal)+'</td>':'')+
        '<td class="td-muted" style="font-size:12px">'+x.produtos.map(p=>escHtml(p)).join(', ')+'</td>'+
      '</tr>'
    }).join('')+
  '</tbody></table>'
}

/* ══ FIADO / A RECEBER ══ */


function renderRelDRE(pv,sumEl,titleEl,countEl,contentEl){
  const {receitaBruta,descontos,receitaLiq,cmv,lucroBruto,despTotal,despPagas,resultado,recAnt,resultAnt}=_calcDRE()
  const margem=receitaLiq>0?(lucroBruto/receitaLiq*100):0
  const margemLiq=receitaLiq>0?(resultado/receitaLiq*100):0
  sumEl.innerHTML=
    '<div class="rel-sum-card"><div class="rel-sum-label">Receita líquida</div><div class="rel-sum-value" style="color:var(--green)">'+brl(receitaLiq)+'</div></div>'+
    '<div class="rel-sum-card"><div class="rel-sum-label">Despesas</div><div class="rel-sum-value" style="color:var(--red)">'+brl(despTotal)+'</div></div>'+
    '<div class="rel-sum-card"><div class="rel-sum-label">Resultado</div><div class="rel-sum-value" style="color:'+(resultado>=0?'var(--green)':'var(--red)')+'">'+brl(resultado)+'</div></div>'+
    '<div class="rel-sum-card"><div class="rel-sum-label">Margem líquida</div><div class="rel-sum-value" style="color:'+(margemLiq>=0?'var(--indigo)':'var(--red)')+'">'+margemLiq.toFixed(1)+'%</div></div>'
  titleEl.textContent='DRE — Demonstrativo de Resultado'
  countEl.textContent=_relPeriod==='mes'?'este mês':_relPeriod==='7'?'7 dias':_relPeriod==='30'?'30 dias':'período'
  // Comparativo mês anterior
  const varPct=recAnt>0?((receitaBruta-recAnt)/recAnt*100):null
  const varHTML=varPct!==null?'<div style="font-size:12px;margin-top:4px;color:'+(varPct>=0?'var(--green)':'var(--red)')+'">Receita: '+(varPct>=0?'↑':'↓')+Math.abs(varPct).toFixed(1)+'% vs mês anterior ('+brl(recAnt)+')</div>':''
  const rows=[
    {type:'section',label:'RECEITA'},
    {type:'normal',label:'Receita bruta de vendas',valor:receitaBruta,color:'var(--green)'},
    {type:'indent',label:'(–) Descontos e abatimentos',valor:-descontos},
    {type:'subtotal',label:'= Receita líquida',valor:receitaLiq,color:'var(--green)'},
    {type:'section',label:'CUSTOS'},
    {type:'normal',label:'(–) Custo de mercadorias/serviços (CMV)',valor:-cmv,color:'var(--red)'},
    {type:'subtotal',label:'= Lucro bruto',valor:lucroBruto,color:lucroBruto>=0?'var(--green)':'var(--red)'},
    {type:'section',label:'DESPESAS'},
    {type:'normal',label:'(–) Despesas operacionais',valor:-despTotal,color:'var(--red)'},
    {type:'indent',label:'   Pagas',valor:-despPagas},
    {type:'indent',label:'   Pendentes / a pagar',valor:-(despTotal-despPagas)},
    {type:'section',label:'RESULTADO'},
    {type:'total',label:resultado>=0?'✅ LUCRO DO PERÍODO':'🔴 PREJUÍZO DO PERÍODO',valor:resultado,color:resultado>=0?'var(--green)':'var(--red)'},
  ]
  contentEl.innerHTML='<div style="max-width:680px;margin:0 auto">'+
    varHTML+
    rows.map(r=>{
      if(r.type==='section') return'<div class="dre-section">'+escHtml(r.label)+'</div>'
      const valStr=(r.valor>=0?'+':'')+brl(Math.abs(r.valor))
      const valColor=r.color||(r.valor>=0?'var(--green)':'var(--red)')
      if(r.type==='total') return'<div class="dre-row total"><span class="dre-label" style="font-weight:700">'+escHtml(r.label)+'</span><span class="dre-val" style="color:'+valColor+';font-size:18px">'+brl(r.valor)+'</span></div>'
      if(r.type==='subtotal') return'<div class="dre-row subtotal"><span class="dre-label">'+escHtml(r.label)+'</span><span class="dre-val" style="color:'+valColor+'">'+brl(r.valor)+'</span></div>'
      if(r.type==='indent') return'<div class="dre-row indent"><span class="dre-label">'+escHtml(r.label)+'</span><span class="dre-val" style="color:var(--text-muted)">'+brl(Math.abs(r.valor))+'</span></div>'
      return'<div class="dre-row"><span class="dre-label">'+escHtml(r.label)+'</span><span class="dre-val" style="color:'+valColor+'">'+brl(r.valor)+'</span></div>'
    }).join('')+
    '<div style="margin-top:16px;padding:12px 16px;background:var(--surface3);border-radius:var(--radius);font-size:12px;color:var(--text-muted)">'+
      '📊 Margem bruta: <strong style="color:var(--accent)">'+margem.toFixed(1)+'%</strong>&nbsp;&nbsp;'+
      '📉 Margem líquida: <strong style="color:'+(margemLiq>=0?'var(--indigo)':'var(--red)')+'">'+margemLiq.toFixed(1)+'%</strong>'+
    '</div>'+
  '</div>'
}

/* ══ ONBOARDING ══ */
const ONBOARDING_STEPS=[
  {id:'empresa',icon:'🏢',title:'Configure sua empresa',sub:'Nome, logo e contato nas Configurações',action:()=>showPage('configuracoes',document.querySelector('[data-tip=Configurações]')),check:()=>!!(config.empresaNome)},
  {id:'produto',icon:'📦',title:'Cadastre seu primeiro produto',sub:'Vá em Produtos e adicione um item ao estoque',action:()=>showPage('produtos',document.querySelector('[data-tip=Produtos]')),check:()=>produtos.length>0},
  {id:'cliente',icon:'👥',title:'Cadastre seu primeiro cliente',sub:'Vá em Clientes para registrar um comprador',action:()=>showPage('clientes',document.querySelector('[data-tip=Clientes]')),check:()=>clientes.length>0},
  {id:'venda',icon:'💰',title:'Registre sua primeira venda',sub:'Vá em Vendas e finalize uma transação',action:()=>showPage('vendas',document.querySelector('[data-tip=Vendas]')),check:()=>vendas.length>0},
]
let _onbStep=0


function renderRelDespesas(pv,sumEl,titleEl,countEl,contentEl,subtipo){
  const hj=hoje()
  // Período sempre aplicado primeiro
  let lista=_filtrarDespesasPorPeriodo([...despesas])
  // Depois filtra por status
  if(subtipo==='vencidas')lista=lista.filter(d=>!d.paga&&d.venc<hj)
  else if(subtipo==='abertas')lista=lista.filter(d=>!d.paga)
  else if(subtipo==='pagas')lista=lista.filter(d=>d.paga)
  else if(subtipo==='todas'){/* só período */}
  else if(subtipo==='periodo'){/* só período, sem filtro de status */}
  lista.sort((a,b)=>a.venc>b.venc?1:-1)
  const totalValor=lista.reduce((t,d)=>t+d.valor,0)
  const totalPago=lista.filter(d=>d.paga).reduce((t,d)=>t+d.valor,0)
  const totalPendente=lista.filter(d=>!d.paga).reduce((t,d)=>t+d.valor,0)
  sumEl.innerHTML=
    '<div class="rel-sum-card"><div class="rel-sum-label">Despesas</div><div class="rel-sum-value" style="color:var(--purple)">'+lista.length+'</div></div>'+
    '<div class="rel-sum-card"><div class="rel-sum-label">Total</div><div class="rel-sum-value" style="color:var(--red)">'+brl(totalValor)+'</div></div>'+
    '<div class="rel-sum-card"><div class="rel-sum-label">Pago</div><div class="rel-sum-value" style="color:var(--green)">'+brl(totalPago)+'</div></div>'+
    '<div class="rel-sum-card"><div class="rel-sum-label">Pendente</div><div class="rel-sum-value" style="color:var(--yellow)">'+brl(totalPendente)+'</div></div>'
  const periodLabel={hoje:'hoje',7:'últimos 7 dias',30:'últimos 30 dias',mes:'este mês',todos:'todo histórico',custom:'período personalizado'}
  const titles={
    vencidas:'Despesas vencidas',
    abertas:'Despesas em aberto',
    pagas:'Despesas pagas',
    periodo:'Despesas com vencimento — '+( periodLabel[_relPeriod]||_relPeriod),
    todas:'Todas as despesas'
  }
  titleEl.textContent=titles[subtipo]||'Despesas';countEl.textContent=lista.length
  if(!lista.length){contentEl.innerHTML='<div class="empty-state"><span class="empty-icon">📋</span>Nenhuma despesa</div>';return}
  contentEl.innerHTML='<table><thead><tr><th>Descrição</th><th>Categoria</th><th>Fornecedor</th><th>Valor</th><th>Vencimento</th><th>Status</th></tr></thead><tbody>'+
    lista.map(d=>{
      let statusBadge
      if(d.paga)statusBadge='<span class="badge badge-green">✅ Paga</span>'
      else if(d.venc<hj)statusBadge='<span class="badge badge-red">🔴 Vencida</span>'
      else statusBadge='<span class="badge badge-blue">⏳ Pendente</span>'
      return'<tr>'+
        '<td>'+escHtml(d.nome)+(d.obs?'<div style="font-size:11px;color:var(--text-muted)">'+escHtml(d.obs)+'</div>':'')+'</td>'+
        '<td><span class="badge badge-purple">'+escHtml(d.categoria||'—')+'</span></td>'+
        '<td class="td-muted">'+(d.fornecedor||'—')+'</td>'+
        '<td class="td-mono">'+brl(d.valor)+'</td>'+
        '<td class="td-muted">'+fmtData(d.venc)+'</td>'+
        '<td>'+statusBadge+'</td>'+
      '</tr>'
    }).join('')+
  '</tbody></table>'
}

/* ══ RELATÓRIO: FORNECEDORES ══ */


function renderRelFiado(pv,sumEl,titleEl,countEl,contentEl){
  const hj=hoje()
  const agora=new Date()
  // Fiados gerados no período
  const fiadoPeriodo=pv.filter(v=>v.fiado)
  // Fiados recebidos no período (por data de recebimento)
  const recebidosPeriodo=vendas.filter(v=>{
    if(!v.fiado||!v.fiadoRecebido||!v.fiadoDataRecebimento)return false
    const dr=v.fiadoDataRecebimento
    if(_relPeriod==='todos')return true
    if(_relPeriod==='hoje')return dr===hj
    const d=new Date(dr+'T00:00:00')
    if(_relPeriod==='7'){const l=new Date(agora);l.setDate(l.getDate()-6);return d>=l&&d<=agora}
    if(_relPeriod==='30'){const l=new Date(agora);l.setDate(l.getDate()-29);return d>=l&&d<=agora}
    if(_relPeriod==='mes')return dr.slice(0,7)===hj.slice(0,7)
    if(_relPeriod==='custom'){
      const de=document.getElementById('relDateDe')?.value,at=document.getElementById('relDateAte')?.value
      const d2=new Date(dr+'T00:00:00')
      if(de&&d2<new Date(de+'T00:00:00'))return false
      if(at&&d2>new Date(at+'T23:59:59'))return false
      return true
    }
    return true
  })
  // Todos os fiados para stats gerais
  const pendentes=vendas.filter(v=>v.fiado&&!v.fiadoRecebido)
  const vencidos=pendentes.filter(v=>v.fiadoVenc&&v.fiadoVenc<hj)
  const totalPendente=pendentes.reduce((t,v)=>t+(v.total||0),0)
  const totalVencido=vencidos.reduce((t,v)=>t+(v.total||0),0)
  const totalGerado=fiadoPeriodo.reduce((t,v)=>t+(v.total||0),0)
  const totalRecebido=recebidosPeriodo.reduce((t,v)=>t+(v.total||0),0)

  sumEl.innerHTML=
    '<div class="rel-sum-card"><div class="rel-sum-label">Fiados no período</div><div class="rel-sum-value" style="color:var(--accent)">'+fiadoPeriodo.length+'</div></div>'+
    '<div class="rel-sum-card"><div class="rel-sum-label">Gerado no período</div><div class="rel-sum-value" style="color:var(--yellow)">'+brl(totalGerado)+'</div></div>'+
    '<div class="rel-sum-card"><div class="rel-sum-label">Recebido no período</div><div class="rel-sum-value" style="color:var(--green)">'+brl(totalRecebido)+'</div></div>'+
    '<div class="rel-sum-card"><div class="rel-sum-label">Total pendente (geral)</div><div class="rel-sum-value" style="color:var(--orange)">'+brl(totalPendente)+'</div></div>'+
    (totalVencido>0?'<div class="rel-sum-card"><div class="rel-sum-label">Vencido (geral)</div><div class="rel-sum-value" style="color:var(--red)">'+brl(totalVencido)+'</div></div>':'')

  titleEl.textContent='Fiado / Contas a Receber'

  // Tabela: fiados gerados no período + recebidos no período (sem duplicar)
  const vistos=new Set()
  const lista=[]
  ;[...fiadoPeriodo,...recebidosPeriodo].forEach(v=>{
    const idx=vendas.indexOf(v)
    if(!vistos.has(idx)){vistos.add(idx);lista.push({v,idx})}
  })
  lista.sort((a,b)=>b.v.data>a.v.data?1:-1)

  countEl.textContent=lista.length+' registro(s)'

  if(!lista.length){
    contentEl.innerHTML='<div class="empty-state"><span class="empty-icon">📒</span>Nenhum registro de fiado no período</div>'
    return
  }

  contentEl.innerHTML='<table><thead><tr><th>Venda</th><th>Cliente</th><th>Data venda</th><th>Vencimento</th><th>Valor</th><th>Status</th><th>Recebido em</th></tr></thead><tbody>'+
    lista.map(({v,idx})=>{
      const vencida=!v.fiadoRecebido&&v.fiadoVenc&&v.fiadoVenc<hj
      const rowStyle=vencida?'background:var(--red-dim)':''
      let statusBadge
      if(v.fiadoRecebido)statusBadge='<span class="badge badge-green">✅ Recebido</span>'
      else if(vencida)statusBadge='<span class="badge badge-red">🔴 Vencido</span>'
      else statusBadge='<span class="fiado-badge">📒 Pendente</span>'
      return'<tr class="tr-click" style="'+rowStyle+'" onclick="openModalVenda(vendas['+idx+'])" title="Ver venda">'+
        '<td><span class="badge badge-blue">'+escHtml(v.id||'—')+'</span></td>'+
        '<td><strong>'+escHtml(v.cliente||'—')+'</strong></td>'+
        '<td class="td-muted">'+fmtData(v.data)+'</td>'+
        '<td class="td-mono '+(vencida?'td-red':'td-muted')+'">'+(v.fiadoVenc?fmtData(v.fiadoVenc):'—')+'</td>'+
        '<td class="td-mono" style="font-weight:700">'+brl(v.total)+'</td>'+
        '<td>'+statusBadge+'</td>'+
        '<td class="td-muted">'+(v.fiadoDataRecebimento?fmtData(v.fiadoDataRecebimento):'—')+'</td>'+
      '</tr>'
    }).join('')+
  '</tbody></table>'
}

/* ══ ATUALIZAÇÃO VIA GITHUB ══ */
const VERSAO_ATUAL='1.2'
const GITHUB_REPO='michaeldsc10/assent'
const GITHUB_PAGES_URL='https://michaeldsc10.github.io/assent/'


function renderRelFornecedores(pv,sumEl,titleEl,countEl,contentEl){
  // Agrupa despesas por fornecedor
  const map={}
  despesas.forEach(d=>{
    if(!d.fornecedor)return
    const k=d.fornecedor
    if(!map[k])map[k]={nome:k,qtd:0,total:0,pago:0,pendente:0}
    map[k].qtd++
    map[k].total+=d.valor
    if(d.paga)map[k].pago+=d.valor
    else map[k].pendente+=d.valor
  })
  const lista=Object.values(map).sort((a,b)=>b.total-a.total)
  const totalGeral=lista.reduce((t,x)=>t+x.total,0)
  sumEl.innerHTML=
    '<div class="rel-sum-card"><div class="rel-sum-label">Fornecedores</div><div class="rel-sum-value" style="color:var(--accent)">'+lista.length+'</div></div>'+
    '<div class="rel-sum-card"><div class="rel-sum-label">Total gasto</div><div class="rel-sum-value" style="color:var(--red)">'+brl(totalGeral)+'</div></div>'+
    '<div class="rel-sum-card"><div class="rel-sum-label">Fornecedores cadastrados</div><div class="rel-sum-value" style="color:var(--purple)">'+fornecedores.length+'</div></div>'
  titleEl.textContent='Gastos por fornecedor';countEl.textContent=lista.length
  if(!lista.length){contentEl.innerHTML='<div class="empty-state"><span class="empty-icon">🏭</span>Nenhuma despesa com fornecedor</div>';return}
  contentEl.innerHTML='<table><thead><tr><th>#</th><th>Fornecedor</th><th>Nº despesas</th><th>Total gasto</th><th>Pago</th><th>Pendente</th><th>Participação</th></tr></thead><tbody>'+
    lista.map((x,pos)=>{
      const pct=totalGeral>0?(x.total/totalGeral*100).toFixed(1):0
      const medal=pos===0?'🥇':pos===1?'🥈':pos===2?'🥉':'<span style="font-size:12px;color:var(--text-muted)">'+(pos+1)+'</span>'
      // Busca dados do fornecedor cadastrado
      const forn=fornecedores.find(f=>f.nome===x.nome)
      const pgtoInfo=forn&&forn.formaPgto?'<div style="font-size:11px;color:var(--text-muted)">'+escHtml(forn.formaPgto)+(forn.prazo?' · '+escHtml(forn.prazo):'')+'</div>':''
      return'<tr>'+
        '<td style="text-align:center;font-size:18px">'+medal+'</td>'+
        '<td><strong>'+escHtml(x.nome)+'</strong>'+pgtoInfo+'</td>'+
        '<td class="td-muted">'+x.qtd+'</td>'+
        '<td class="td-mono" style="font-weight:700;color:var(--red)">'+brl(x.total)+'</td>'+
        '<td class="td-mono" style="color:var(--green)">'+brl(x.pago)+'</td>'+
        '<td class="td-mono" style="color:var(--yellow)">'+brl(x.pendente)+'</td>'+
        '<td style="min-width:110px"><div style="display:flex;align-items:center;gap:8px"><div style="flex:1;background:var(--surface3);border-radius:99px;height:6px;overflow:hidden"><div style="background:var(--red);height:100%;width:'+pct+'%"></div></div><span style="font-size:12px;color:var(--text-muted);width:36px;text-align:right">'+pct+'%</span></div></td>'+
      '</tr>'
    }).join('')+
  '</tbody></table>'
}

/* ══ RELATÓRIO: PAGAMENTOS ══ */


function renderRelPagamentos(pv,sumEl,titleEl,countEl,contentEl){
  // Agrupa vendas por forma de pagamento
  const map={}
  pv.forEach(v=>{
    const k=v.formaPagamento||'Não informado'
    if(!map[k])map[k]={metodo:k,qtd:0,total:0,lucro:0,vendas:[]}
    map[k].qtd++
    map[k].total+=(v.total||0)
    map[k].lucro+=calcLucroVenda(v)
    map[k].vendas.push(v)
  })
  const lista=Object.values(map).sort((a,b)=>b.total-a.total)
  const totalGeral=lista.reduce((t,x)=>t+x.total,0)
  const lucroGeral=lista.reduce((t,x)=>t+x.lucro,0)
  const qtdGeral=lista.reduce((t,x)=>t+x.qtd,0)

  // Ícones por método
  const icones={'Dinheiro':'💵','Pix':'📲','Cartão Débito':'💳','Cartão Crédito':'💳','Boleto':'📄','Outro':'🔄','Não informado':'❓'}

  sumEl.innerHTML=
    '<div class="rel-sum-card"><div class="rel-sum-label">Métodos usados</div><div class="rel-sum-value" style="color:var(--purple)">'+lista.length+'</div></div>'+
    '<div class="rel-sum-card"><div class="rel-sum-label">Total faturado</div><div class="rel-sum-value" style="color:var(--green)">'+brl(totalGeral)+'</div></div>'+
    '<div class="rel-sum-card"><div class="rel-sum-label">Total de vendas</div><div class="rel-sum-value" style="color:var(--accent)">'+qtdGeral+'</div></div>'+
    '<div class="rel-sum-card"><div class="rel-sum-label">Lucro estimado</div><div class="rel-sum-value" style="color:var(--indigo)">'+brl(lucroGeral)+'</div></div>'

  titleEl.textContent='Receita por método de pagamento'
  countEl.textContent=lista.length+' método'+(lista.length!==1?'s':'')

  if(!lista.length){contentEl.innerHTML='<div class="empty-state"><span class="empty-icon">💳</span>Nenhuma venda no período</div>';return}

  // Cards visuais de destaque + tabela detalhada
  const maxTotal=lista[0].total
  const cardsHtml=lista.map((x,pos)=>{
    const pct=totalGeral>0?(x.total/totalGeral*100).toFixed(1):0
    const barW=maxTotal>0?(x.total/maxTotal*100).toFixed(0):0
    const icone=icones[x.metodo]||'💰'
    const medal=pos===0?'🥇 ':pos===1?'🥈 ':pos===2?'🥉 ':''
    const ticketMedio=x.qtd>0?x.total/x.qtd:0
    return'<div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-lg);padding:16px 18px;margin-bottom:8px">'+
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">'+
        '<div style="display:flex;align-items:center;gap:10px">'+
          '<span style="font-size:20px">'+icone+'</span>'+
          '<div>'+
            '<div style="font-size:14px;font-weight:600">'+medal+escHtml(x.metodo)+'</div>'+
            '<div style="font-size:11px;color:var(--text-muted)">'+x.qtd+' venda'+(x.qtd!==1?'s':'')+' · Ticket médio: '+brl(ticketMedio)+'</div>'+
          '</div>'+
        '</div>'+
        '<div style="text-align:right">'+
          '<div style="font-family:\'JetBrains Mono\',monospace;font-size:20px;font-weight:700;color:var(--green)">'+brl(x.total)+'</div>'+
          '<div style="font-size:11px;color:var(--text-muted)">Lucro est.: '+brl(x.lucro)+'</div>'+
        '</div>'+
      '</div>'+
      '<div style="display:flex;align-items:center;gap:10px">'+
        '<div style="flex:1;background:var(--surface3);border-radius:99px;height:8px;overflow:hidden">'+
          '<div style="background:var(--accent);height:100%;width:'+barW+'%;border-radius:99px;transition:width .4s ease"></div>'+
        '</div>'+
        '<span style="font-size:13px;font-weight:600;color:var(--text-dim);min-width:40px;text-align:right">'+pct+'%</span>'+
      '</div>'+
    '</div>'
  }).join('')

  // Tabela resumo
  const tabelaHtml='<div style="margin-top:20px">'+
    '<div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted);margin-bottom:10px">Tabela resumo</div>'+
    '<table><thead><tr><th>Método</th><th>Nº Vendas</th><th>Total</th><th>Ticket médio</th><th>Lucro est.</th><th>Participação</th></tr></thead><tbody>'+
    lista.map(x=>{
      const pct=totalGeral>0?(x.total/totalGeral*100).toFixed(1):0
      const ticket=x.qtd>0?x.total/x.qtd:0
      const icone=icones[x.metodo]||'💰'
      return'<tr>'+
        '<td><span style="margin-right:6px">'+icone+'</span><strong>'+escHtml(x.metodo)+'</strong></td>'+
        '<td class="td-muted">'+x.qtd+'</td>'+
        '<td class="td-mono" style="font-weight:600">'+brl(x.total)+'</td>'+
        '<td class="td-mono td-muted">'+brl(ticket)+'</td>'+
        '<td class="td-mono" style="color:var(--indigo)">'+brl(x.lucro)+'</td>'+
        '<td style="min-width:100px">'+
          '<div style="display:flex;align-items:center;gap:6px">'+
            '<div style="flex:1;background:var(--surface3);border-radius:99px;height:5px;overflow:hidden">'+
              '<div style="background:var(--green);height:100%;width:'+pct+'%"></div>'+
            '</div>'+
            '<span style="font-size:11px;color:var(--text-muted);width:32px;text-align:right">'+pct+'%</span>'+
          '</div>'+
        '</td>'+
      '</tr>'
    }).join('')+
    '</tbody></table></div>'

  contentEl.innerHTML=cardsHtml+tabelaHtml
}

/* ══ VENDEDORES ══ */


function renderTutorial(){
  const p=TUTORIAL_PASSOS[_tutStep]
  if(!p)return
  // Progresso
  const pct=Math.round((_tutStep/(TUTORIAL_PASSOS.length-1))*100)
  const prog=document.getElementById('tutorialProgress')
  if(prog)prog.style.width=pct+'%'
  // Label
  const lbl=document.getElementById('tutorialStepLabel')
  if(lbl)lbl.textContent=`Passo ${_tutStep+1} de ${TUTORIAL_PASSOS.length}`
  // Corpo
  const body=document.getElementById('tutorialBody')
  if(body){
    body.innerHTML=`
      <div style="text-align:center;margin-bottom:20px">
        <div style="font-size:48px;margin-bottom:8px">${p.emoji}</div>
        <div style="font-size:18px;font-weight:700">${escHtml(p.titulo)}</div>
      </div>
      <div>${p.corpo}</div>`
  }
  // Botões
  const prev=document.getElementById('tutorialPrevBtn')
  const next=document.getElementById('tutorialNextBtn')
  if(prev)prev.style.visibility=_tutStep===0?'hidden':'visible'
  if(next)next.textContent=_tutStep===TUTORIAL_PASSOS.length-1?'✅ Concluir':'Próximo →'
}


function resetarAtalho(id){
  const a=_atalhos.find(x=>x.id===id);if(!a)return
  a.tecla=a.padrao;delete a.conflict
  salvarAtalhos();renderAtalhosPage()
  toast('↺ Atalho "'+a.label+'" restaurado para '+a.padrao+'.','info')
}

// Captura de tecla nova — listener global de captura
document.addEventListener('keydown',e=>{
  if(!_capturingId) return
  e.preventDefault();e.stopPropagation()

  const a=_atalhos.find(x=>x.id===_capturingId);if(!a)return

  // Cancela com Esc
  if(e.key==='Escape'){_capturingId=null;renderAtalhosPage();return}

  // Aceita apenas letras A-Z
  if(!/^[A-Z]$/i.test(e.key)){
    toast('⚠️ Use apenas letras (A–Z).','warning')
    return
  }

  const nova=e.key.toUpperCase()

  // Verifica conflito com outro atalho editável
  const conflito=_atalhos.find(x=>x.id!==_capturingId&&!x.fixo&&x.tecla===nova)
  if(conflito){
    toast('⚠️ A tecla "'+nova+'" já está em uso por "'+conflito.label+'".','warning')
    return
  }

  a.tecla=nova;delete a.conflict
  _capturingId=null
  salvarAtalhos();renderAtalhosPage()
  toast('✅ Atalho "'+a.label+'" → '+nova)
},true)  // captura na fase de capture para interceptar antes de tudo

// Fecha captura ao clicar fora
document.addEventListener('click',e=>{
  if(_capturingId&&!e.target.closest('#atalhosList')){
    _capturingId=null;renderAtalhosPage()
  }
})

// Engine de execução — usa _atalhos dinamicamente
;(function(){
  function isInputFocused(){
    const el=document.activeElement
    return el&&(el.tagName==='INPUT'||el.tagName==='TEXTAREA'||el.tagName==='SELECT'||el.isContentEditable)
  }
  function navBtn(label){return Array.from(document.querySelectorAll('.nav-btn')).find(b=>b.textContent.includes(label))}

  document.addEventListener('keydown',e=>{
    if(_capturingId) return          // captura em andamento — engine fica mudo
    if((e.metaKey||e.ctrlKey)||e.altKey) return
    if(isInputFocused()) return
    if(e.key==='Escape') return

    const k=e.key.toUpperCase()

    if(k===getTecla('nova-venda').toUpperCase()){
      e.preventDefault()
      showPage('vendas',navBtn('Vendas'))
      setTimeout(()=>document.getElementById('vendaClienteSearch')?.focus(),100)
    } else if(k===getTecla('novo-produto').toUpperCase()){
      e.preventDefault()
      showPage('produtos',navBtn('Produtos'))
      setTimeout(()=>document.getElementById('produtoNome')?.focus(),100)
    } else if(k===getTecla('novo-cliente').toUpperCase()){
      e.preventDefault()
      showPage('clientes',navBtn('Clientes'))
      setTimeout(()=>document.getElementById('clienteNome')?.focus(),100)
    } else if(k===getTecla('novo-servico').toUpperCase()){
      e.preventDefault()
      showPage('servicos',navBtn('Serviços'))
      setTimeout(()=>document.getElementById('servicoNome')?.focus(),100)
    } else if(k===getTecla('dashboard').toUpperCase()){
      e.preventDefault()
      showPage('dashboard',navBtn('Dashboard'))
    } else if(k===getTecla('relatorios').toUpperCase()){
      e.preventDefault()
      showPage('relatorios',navBtn('Relatórios'))
    } else if(k===getTecla('backup').toUpperCase()){
      e.preventDefault()
      exportarDados()
    }
  })
})()

/* ══ SIDEBAR COLLAPSE ══ */


function resetarAtalhos(){
  _atalhos=ATALHOS_DEF.map(a=>({...a,tecla:a.padrao}))
  try{localStorage.removeItem('assent_atalhos')}catch(e){}
  renderAtalhosPage()
  toast('↺ Atalhos restaurados para o padrão.','info')
}


function salvarAtalhos(){
  const obj={}
  _atalhos.forEach(a=>{if(a.tecla!==a.padrao)obj[a.id]=a.tecla})
  try{localStorage.setItem('assent_atalhos',JSON.stringify(obj))}catch(e){}
}


function salvarEditProduto(){
  if(_epIdx===null)return
  const nome=document.getElementById('epNome').value.trim()
  if(!nome){toast('⚠️ Informe o nome do produto.','warning');return}
  if(produtos.some((p,idx)=>idx!==_epIdx&&p.nome.toLowerCase()===nome.toLowerCase())){
    toast('⚠️ Já existe um produto com esse nome.','error');return
  }
  const foto=_epFotoData===null
    ? (produtos[_epIdx].foto||'')   // sem alteração → mantém
    : _epFotoData                   // '' = removida, base64 = nova
  produtos[_epIdx]={
    nome,
    preco:parseNum(document.getElementById('epPreco').value,0,0),
    custo:parseNum(document.getElementById('epCusto').value,0,0),
    estoque:parseInt2(document.getElementById('epEstoque').value,0,0),
    foto
  }
  closeEditProduto()
  toast('✅ Produto "'+nome+'" atualizado com sucesso!')
  save()
}


function saveCategorias(){
  try{localStorage.setItem('assent_serv_cats',JSON.stringify(servicoCategorias))}catch(e){}
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


function setChPeriod(p,btn){
  _chPeriod=p
  document.querySelectorAll('#chFiltroBar .filter-btn').forEach(b=>b.classList.remove('active'))
  if(btn)btn.classList.add('active')
  renderChHistorico()
}


function setFiadoFiltro(f,btn){
  _fiadoFiltro=f
  document.querySelectorAll('#fiado .filter-btn').forEach(b=>b.classList.remove('active'))
  if(btn)btn.classList.add('active')
  renderFiado()
}


function toggleSidebar(){
  const sb=document.getElementById('sidebar')
  const collapsed=sb.classList.toggle('collapsed')
  const btn=sb.querySelector('.sidebar-toggle')
  btn.textContent=collapsed?'▶':'◀'
  btn.title=collapsed?'Expandir menu':'Recolher menu'
  try{localStorage.setItem('assent_sidebar_collapsed',collapsed?'1':'')}catch(e){}
}
// Restaura estado do sidebar
;(function(){
  try{
    if(localStorage.getItem('assent_sidebar_collapsed')==='1'){
      const sb=document.getElementById('sidebar')
      sb.classList.add('collapsed')
      const btn=sb.querySelector('.sidebar-toggle')
      if(btn){btn.textContent='▶';btn.title='Expandir menu'}
    }

  }catch(e){}
})()

/* ══ PRODUTO — MODAL DE EDIÇÃO ══ */
let _epIdx=null   // índice do produto sendo editado
let _epFotoData=null  // base64 da nova foto (null = sem alteração, '' = remover)


function toggleStockDetail(){
  _stockDetailOpen=!_stockDetailOpen
  document.getElementById('stockAlertDetail').classList.toggle('open',_stockDetailOpen)
  document.getElementById('stockAlertChevron').textContent=_stockDetailOpen?'▲':'▼'
}

/* ══ DASHBOARD ══ */


function toggleTheme(){
  const html=document.documentElement
  const current=html.getAttribute('data-theme')||'dark'
  const next=current==='light'?'dark':'light'
  html.setAttribute('data-theme',next)
  document.getElementById('themeToggleBtn').textContent=next==='light'?'🌙':'☀️'
  try{localStorage.setItem('assent_theme',next)}catch(e){}
}
;(function(){
  try{
    const t=localStorage.getItem('assent_theme')||'dark'
    document.documentElement.setAttribute('data-theme',t)
    // btn text set after DOM ready via render()
  }catch(e){}
})()

/* ══ HISTÓRICO DO CLIENTE ══ */


function tutorialNav(dir){
  const novoStep=_tutStep+dir
  if(novoStep<0)return
  if(novoStep>=TUTORIAL_PASSOS.length){closeModal('modalTutorial');return}
  _tutStep=novoStep
  renderTutorial()
}
document.getElementById('modalTutorial')?.addEventListener('click',e=>{
  if(e.target===document.getElementById('modalTutorial'))closeModal('modalTutorial')
})

/* ══ CATEGORIAS DE SERVIÇO ══ */


function vendasDoCliente(nome,periodo){
  const agora=new Date()
  return vendas.filter(v=>{
    if(v.cliente!==nome)return false
    if(periodo==='todos')return true
    if(!v.data)return false
    const d=new Date(v.data+'T00:00:00')
    if(periodo==='hoje')return v.data===hoje()
    if(periodo==='7'){const l=new Date(agora);l.setDate(l.getDate()-6);return d>=l}
    if(periodo==='30'){const l=new Date(agora);l.setDate(l.getDate()-29);return d>=l}
    if(periodo==='mes')return d.getFullYear()===agora.getFullYear()&&d.getMonth()===agora.getMonth()
    return true
  }).sort((a,b)=>b.data>a.data?1:b.data<a.data?-1:0)
}


