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

/* ══ RELATÓRIO: RANKING MAIS VENDIDOS ══ */
function renderRelRanking(pv,sumEl,titleEl,countEl,contentEl){
  // Consolida por produto/serviço
  const map={}
  pv.forEach(v=>(v.itens||[]).forEach(it=>{
    const k=it.produto||'—'
    if(!map[k])map[k]={nome:k,tipo:it.tipo||'produto',qtd:0,fat:0,lucro:0,vendas:new Set()}
    const desc=clamp(it.desconto||0)
    const tot=it.preco*it.qtd*(1-desc/100)
    const luc=(it.preco*(1-desc/100)-(it.custo||0))*it.qtd
    map[k].qtd+=it.qtd
    map[k].fat+=tot
    map[k].lucro+=luc
    map[k].vendas.add(v.id||v.data)
  }))
  const lista=Object.values(map).sort((a,b)=>b.qtd-a.qtd)
  const totalQtd=lista.reduce((t,x)=>t+x.qtd,0)
  const totalFat=lista.reduce((t,x)=>t+x.fat,0)
  sumEl.innerHTML=
    '<div class="rel-sum-card"><div class="rel-sum-label">Produtos/serviços</div><div class="rel-sum-value" style="color:var(--purple)">'+lista.length+'</div></div>'+
    '<div class="rel-sum-card"><div class="rel-sum-label">Itens vendidos</div><div class="rel-sum-value" style="color:var(--accent)">'+totalQtd+'</div></div>'+
    '<div class="rel-sum-card"><div class="rel-sum-label">Faturamento</div><div class="rel-sum-value" style="color:var(--green)">'+brl(totalFat)+'</div></div>'
  titleEl.textContent='Ranking — mais vendidos no período'
  countEl.textContent=lista.length+' itens'
  if(!lista.length){contentEl.innerHTML='<div class="empty-state"><span class="empty-icon">🏆</span>Sem vendas no período</div>';return}
  const maxQtd=lista[0].qtd
  contentEl.innerHTML='<table><thead><tr><th>#</th><th>Produto / Serviço</th><th>Tipo</th><th>Qtd vendida</th><th>Participação</th><th>Faturamento</th><th>Lucro est.</th><th>Nº vendas</th></tr></thead><tbody>'+
    lista.map((x,pos)=>{
      const pct=totalQtd>0?(x.qtd/totalQtd*100).toFixed(1):0
      const barW=maxQtd>0?(x.qtd/maxQtd*100).toFixed(0):0
      const medal=pos===0?'🥇':pos===1?'🥈':pos===2?'🥉':'<span style="font-size:12px;color:var(--text-muted)">'+(pos+1)+'</span>'
      const tipoBadge=x.tipo==='servico'?'<span class="servico-badge" style="font-size:10px">🎯 Serviço</span>':'<span class="badge badge-blue" style="font-size:10px">📦 Produto</span>'
      const margem=x.fat>0?(x.lucro/x.fat*100).toFixed(1):0
      const mc=Number(margem)>=40?'var(--green)':Number(margem)>=20?'var(--yellow)':'var(--red)'
      return'<tr>'+
        '<td style="font-size:18px;text-align:center">'+medal+'</td>'+
        '<td><strong>'+escHtml(x.nome)+'</strong></td>'+
        '<td>'+tipoBadge+'</td>'+
        '<td class="td-mono" style="font-weight:600">'+x.qtd+'</td>'+
        '<td style="min-width:120px"><div style="display:flex;align-items:center;gap:8px"><div style="flex:1;background:var(--surface3);border-radius:99px;height:6px;overflow:hidden"><div style="background:var(--accent);height:100%;width:'+barW+'%;border-radius:99px;transition:width .3s"></div></div><span style="font-size:12px;color:var(--text-muted);width:36px;text-align:right">'+pct+'%</span></div></td>'+
        '<td class="td-mono">'+brl(x.fat)+'</td>'+
        '<td class="td-mono" style="color:'+mc+'">'+brl(x.lucro)+'</td>'+
        '<td class="td-muted">'+x.vendas.size+'</td>'+
      '</tr>'
    }).join('')+
  '</tbody></table>'
}

/* ══ RELATÓRIO: CLIENTES ══ */
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
function renderDashDespesas(){
  const el=document.getElementById('dashDespesasResumo');if(!el)return
  const hj=hoje()
  const em3=new Date();em3.setDate(em3.getDate()+3);const em3str=em3.toISOString().split('T')[0]
  const mesAtual=hj.slice(0,7)
  const vencidas=despesas.filter(d=>!d.paga&&d.venc<hj)
