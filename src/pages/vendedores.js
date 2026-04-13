/* ══ VENDEDORES ══ */
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

function excluirVendedor(i){
  const n=vendedores[i].nome
  showConfirm('Excluir o vendedor "'+escHtml(n)+'"? As vendas vinculadas mantêm o nome registrado.',()=>{
    vendedores.splice(i,1)
    toast('🗑️ Vendedor removido.','info')
    save()
  })
}

function editarVendedorModal(i){
  const v=vendedores[i]
  // Inline edit — exibe campos na tabela
  _vendedorEditando=i
  renderVendedores()
}
let _vendedorEditando=null

function salvarVendedor(i){
  const nome=document.getElementById('ev_n'+i).value.trim()
  if(!nome){toast('⚠️ Informe o nome.','warning');return}
  if(vendedores.some((v,idx)=>idx!==i&&v.nome.toLowerCase()===nome.toLowerCase())){toast('⚠️ Já existe um vendedor com esse nome.','error');return}
  vendedores[i]={
    nome,
    tel:document.getElementById('ev_t'+i).value.trim(),
    email:document.getElementById('ev_e'+i).value.trim(),
    comissao:parseNum(document.getElementById('ev_c'+i).value,0,0),
    obs:document.getElementById('ev_o'+i).value.trim()
  }
  _vendedorEditando=null
  toast('✅ Vendedor "'+nome+'" atualizado!')
  save()
}

function renderVendedores(){
  const q=(document.getElementById('buscaVendedor')?.value||'').toLowerCase()
  const f=vendedores.map((v,i)=>({...v,_i:i})).filter(v=>v.nome.toLowerCase().includes(q)||(v.email||'').toLowerCase().includes(q))
  const cnt=document.getElementById('cntVendedores');if(cnt)cnt.textContent=f.length
  const b=document.getElementById('vendedoresBody');if(!b)return
  if(!f.length){b.innerHTML='<tr><td colspan="6"><div class="empty-state"><span class="empty-icon">🧑‍💼</span>Nenhum vendedor cadastrado</div></td></tr>';return}
  b.innerHTML=f.map(v=>{
    const i=v._i
    const totalVendas=vendas.filter(vv=>vv.vendedor===v.nome).length
    const fatVendas=vendas.filter(vv=>vv.vendedor===v.nome).reduce((t,vv)=>t+(vv.total||0),0)
    if(_vendedorEditando===i) return'<tr>'+
      '<td><input id="ev_n'+i+'" value="'+escHtml(v.nome)+'" style="min-width:120px"></td>'+
      '<td><input id="ev_t'+i+'" value="'+escHtml(v.tel||'')+'" placeholder="Telefone" style="min-width:120px"></td>'+
      '<td><input id="ev_e'+i+'" value="'+escHtml(v.email||'')+'" placeholder="Email" style="min-width:140px"></td>'+
      '<td><input id="ev_c'+i+'" type="number" value="'+(v.comissao||0)+'" placeholder="%" min="0" max="100" step="0.1" style="width:70px"></td>'+
      '<td><input id="ev_o'+i+'" value="'+escHtml(v.obs||'')+'" placeholder="Obs"></td>'+
      '<td><div class="td-actions"><button class="btn btn-primary btn-sm" onclick="salvarVendedor('+i+')">Salvar</button><button class="btn btn-ghost btn-sm" onclick="_vendedorEditando=null;renderVendedores()">✕</button></div></td>'+
    '</tr>'
    return'<tr>'+
      '<td><strong>'+escHtml(v.nome)+'</strong>'+
        (totalVendas?'<div style="font-size:11px;color:var(--text-muted)">'+totalVendas+' venda(s) · '+brl(fatVendas)+'</div>':'')+
      '</td>'+
      '<td class="td-muted">'+(v.tel||'—')+'</td>'+
      '<td class="td-muted">'+(v.email||'—')+'</td>'+
      '<td class="td-mono">'+(v.comissao?v.comissao+'%':'—')+'</td>'+
      '<td class="td-muted">'+(v.obs||'—')+'</td>'+
      '<td><div class="td-actions">'+
        '<button class="btn btn-warning btn-sm" onclick="editarVendedorModal('+i+')">Editar</button>'+
        '<button class="btn btn-danger btn-sm" onclick="excluirVendedor('+i+')">Excluir</button>'+
      '</div></td>'+
    '</tr>'
  }).join('')
  // Atualiza botões do sub-filtro de vendedores no relatório
  _atualizarVendedorFiltroButtons()
}

/* ══ RELATÓRIO: VENDEDORES ══ */
let _vendedorFiltroAtivo=''
function _atualizarVendedorFiltroButtons(){
  const container=document.getElementById('vendedorFiltroButtons');if(!container)return
  container.innerHTML=vendedores.map(v=>
    '<button class="filter-btn'+(v.nome===_vendedorFiltroAtivo?' active':'')+
    '" onclick="setVendedorFiltro(\''+v.nome.replace(/\\/g,'\\\\').replace(/'/g,'\\\'')+'\''+',this)">'+escHtml(v.nome)+'</button>'
  ).join('')
}
function setVendedorFiltro(nome,btn){
  _vendedorFiltroAtivo=nome
  document.querySelectorAll('#vendedorSubFiltro .filter-btn').forEach(b=>b.classList.remove('active'))
  if(btn)btn.classList.add('active')
  else{
    // Re-apply active state via re-render
    _atualizarVendedorFiltroButtons()
    if(!nome)document.getElementById('vendedorFiltroTodos')?.classList.add('active')
  }
  renderRelatorio()
}

function renderRelVendedores(pv,sumEl,titleEl,countEl,contentEl){
  const vCadFn=nome=>vendedores.find(v=>v.nome===nome)

  // === MODO DETALHE: vendedor específico selecionado ===
  if(_vendedorFiltroAtivo){
    const vNome=_vendedorFiltroAtivo
    const vendaVend=pv.filter(v=>v.vendedor===vNome)
    const fat=vendaVend.reduce((t,v)=>t+(v.total||0),0)
    const lucro=vendaVend.reduce((t,v)=>t+calcLucroVenda(v),0)
    const ticket=vendaVend.length?fat/vendaVend.length:0
    const vCad=vCadFn(vNome)
    const comissao=vCad&&vCad.comissao?fat*(vCad.comissao/100):0
    sumEl.innerHTML=
      '<div class="rel-sum-card"><div class="rel-sum-label">Vendas no período</div><div class="rel-sum-value" style="color:var(--accent)">'+vendaVend.length+'</div></div>'+
      '<div class="rel-sum-card"><div class="rel-sum-label">Faturamento</div><div class="rel-sum-value" style="color:var(--green)">'+brl(fat)+'</div></div>'+
      '<div class="rel-sum-card"><div class="rel-sum-label">Lucro estimado</div><div class="rel-sum-value" style="color:var(--indigo)">'+brl(lucro)+'</div></div>'+
      '<div class="rel-sum-card"><div class="rel-sum-label">Ticket médio</div><div class="rel-sum-value" style="color:var(--yellow)">'+brl(ticket)+'</div></div>'+
      (comissao>0?'<div class="rel-sum-card"><div class="rel-sum-label">Comissão ('+vCad.comissao+'%)</div><div class="rel-sum-value" style="color:var(--orange)">'+brl(comissao)+'</div></div>':'')
    titleEl.textContent='Vendas de '+escHtml(vNome)
    countEl.textContent=vendaVend.length+' venda'+(vendaVend.length!==1?'s':'')
    if(!vendaVend.length){contentEl.innerHTML='<div class="empty-state"><span class="empty-icon">💼</span>Nenhuma venda no período para este vendedor</div>';return}
    const sorted=[...vendaVend].sort((a,b)=>b.data>a.data?1:-1)
    contentEl.innerHTML='<table><thead><tr><th>ID</th><th>Data</th><th>Cliente</th><th>Pagamento</th><th>Itens</th><th>Total</th><th>Lucro est.</th></tr></thead><tbody>'+
      sorted.map(v=>{
        const idx=vendas.indexOf(v)
        return'<tr class="tr-click" onclick="openModalVenda(vendas['+idx+'])" title="Ver detalhes">'+
          '<td><span class="badge badge-blue">'+escHtml(v.id||'—')+'</span></td>'+
          '<td class="td-muted">'+fmtData(v.data)+'</td>'+
          '<td>'+escHtml(v.cliente||'—')+'</td>'+
          '<td class="td-muted">'+(v.formaPagamento||'—')+'</td>'+
          '<td class="td-muted">'+(v.itens||[]).length+' item(s)</td>'+
          '<td class="td-mono" style="font-weight:600">'+brl(v.total)+'</td>'+
          '<td class="td-mono" style="color:var(--indigo)">'+brl(calcLucroVenda(v))+'</td>'+
        '</tr>'
      }).join('')+
    '</tbody></table>'+
    '<div style="margin-top:12px;display:flex;gap:16px;padding:12px 16px;background:var(--surface3);border-radius:var(--radius);font-size:13px">'+
      '<span>Total: <strong style="color:var(--green)">'+brl(fat)+'</strong></span>'+
      '<span>Lucro: <strong style="color:var(--indigo)">'+brl(lucro)+'</strong></span>'+
      (comissao>0?'<span>Comissão: <strong style="color:var(--orange)">'+brl(comissao)+'</strong></span>':'')+
    '</div>'
    return
  }

  // === MODO RANKING: todos os vendedores ===
  const map={}
  pv.forEach(v=>{
    const k=v.vendedor||'Não informado'
    if(!map[k])map[k]={nome:k,qtd:0,total:0,lucro:0,comissaoTotal:0}
    map[k].qtd++;map[k].total+=(v.total||0);map[k].lucro+=calcLucroVenda(v)
    const vc=vCadFn(k);if(vc&&vc.comissao)map[k].comissaoTotal+=(v.total||0)*(vc.comissao/100)
  })
  const lista=Object.values(map).sort((a,b)=>b.total-a.total)
  const totalGeral=lista.reduce((t,x)=>t+x.total,0)
  const lucroGeral=lista.reduce((t,x)=>t+x.lucro,0)
  const comissaoGeral=lista.reduce((t,x)=>t+x.comissaoTotal,0)
  sumEl.innerHTML=
    '<div class="rel-sum-card"><div class="rel-sum-label">Vendedores</div><div class="rel-sum-value" style="color:var(--purple)">'+lista.length+'</div></div>'+
    '<div class="rel-sum-card"><div class="rel-sum-label">Total faturado</div><div class="rel-sum-value" style="color:var(--green)">'+brl(totalGeral)+'</div></div>'+
    '<div class="rel-sum-card"><div class="rel-sum-label">Lucro estimado</div><div class="rel-sum-value" style="color:var(--indigo)">'+brl(lucroGeral)+'</div></div>'+
    (comissaoGeral>0?'<div class="rel-sum-card"><div class="rel-sum-label">Comissões</div><div class="rel-sum-value" style="color:var(--yellow)">'+brl(comissaoGeral)+'</div></div>':'')
  titleEl.textContent='Desempenho por vendedor'
  countEl.textContent=lista.reduce((t,x)=>t+x.qtd,0)+' venda(s)'
  if(!lista.length){contentEl.innerHTML='<div class="empty-state"><span class="empty-icon">🧑‍💼</span>Nenhuma venda no período</div>';return}
  const maxTotal=lista[0].total||1
  contentEl.innerHTML='<table><thead><tr><th>#</th><th>Vendedor</th><th>Nº Vendas</th><th>Faturamento</th><th>Participação</th><th>Lucro est.</th><th>Comissão</th><th>Ticket médio</th></tr></thead><tbody>'+
    lista.map((x,pos)=>{
      const pct=totalGeral>0?(x.total/totalGeral*100).toFixed(1):0
      const barW=(x.total/maxTotal*100).toFixed(0)
      const medal=pos===0?'🥇':pos===1?'🥈':pos===2?'🥉':'<span style="font-size:11px;color:var(--text-muted)">'+(pos+1)+'</span>'
      const ticket=x.qtd>0?x.total/x.qtd:0
      const vc=vCadFn(x.nome)
      const comissaoInfo=vc&&vc.comissao?brl(x.comissaoTotal)+' ('+vc.comissao+'%)':'—'
      return'<tr style="cursor:pointer" onclick="setVendedorFiltro(\''+x.nome.replace(/\\/g,'\\\\').replace(/'/g,'\\\'')+'\''+',null);_atualizarVendedorFiltroButtons()" title="Clique para ver detalhes">'+
        '<td style="text-align:center;font-size:18px">'+medal+'</td>'+
        '<td><strong>'+escHtml(x.nome)+'</strong>'+(vc&&vc.tel?'<div style="font-size:11px;color:var(--text-muted)">'+escHtml(vc.tel)+'</div>':'')+'</td>'+
        '<td class="td-muted" style="font-weight:600">'+x.qtd+'</td>'+
        '<td class="td-mono" style="font-weight:700">'+brl(x.total)+'</td>'+
        '<td style="min-width:120px"><div style="display:flex;align-items:center;gap:8px"><div style="flex:1;background:var(--surface3);border-radius:99px;height:6px;overflow:hidden"><div style="background:var(--accent);height:100%;width:'+barW+'%"></div></div><span style="font-size:12px;color:var(--text-muted);width:36px;text-align:right">'+pct+'%</span></div></td>'+
        '<td class="td-mono" style="color:var(--indigo)">'+brl(x.lucro)+'</td>'+
        '<td class="td-mono" style="color:var(--yellow)">'+comissaoInfo+'</td>'+
        '<td class="td-mono td-muted">'+brl(ticket)+'</td>'+
      '</tr>'
    }).join('')+
  '</tbody></table>'+
  '<div style="font-size:12px;color:var(--text-muted);margin-top:8px;padding:4px">💡 Clique em um vendedor para ver as vendas detalhadas</div>'
}

