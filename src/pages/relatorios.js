/* ══ RELATÓRIOS ══ */
let _relPeriod='7',_relTipo='vendas'
function setRelPeriod(p,btn){_relPeriod=p;document.querySelectorAll('#relatorios .filter-btn').forEach(b=>b.classList.remove('active'));if(btn)btn.classList.add('active');document.getElementById('relDateRangeWrap').classList.toggle('show',p==='custom');renderRelatorio()}
let _despesasSubTipo='periodo'
function setDespesasSubTipo(t,btn){
  _despesasSubTipo=t
  document.querySelectorAll('#despesasSubFiltro .filter-btn').forEach(b=>b.classList.remove('active'))
  if(btn)btn.classList.add('active')
  renderRelatorio()
}
let _relMenuOpen=false
function toggleRelMenu(){
  _relMenuOpen=!_relMenuOpen
  const dd=document.getElementById('relMenuDropdown')
  const arrow=document.getElementById('relMenuArrow')
  const toggle=document.getElementById('relMenuToggle')
  if(dd)dd.classList.toggle('open',_relMenuOpen)
  if(arrow)arrow.classList.toggle('open',_relMenuOpen)
  if(toggle)toggle.style.borderRadius=_relMenuOpen?'var(--radius) var(--radius) 0 0':'var(--radius)'
}
function setRelTipo(t,btn){
  _relTipo=t
  document.querySelectorAll('.rel-tipo-btn').forEach(b=>b.classList.remove('active'))
  if(btn){
    btn.classList.add('active')
    // Update toggle label with selected report name
    const lbl=document.getElementById('relMenuLabel')
    if(lbl)lbl.textContent=btn.textContent
  }
  // Close dropdown after selection
  _relMenuOpen=false
  const dd=document.getElementById('relMenuDropdown')
  const arrow=document.getElementById('relMenuArrow')
  const toggle=document.getElementById('relMenuToggle')
  if(dd)dd.classList.remove('open')
  if(arrow)arrow.classList.remove('open')
  if(toggle)toggle.style.borderRadius='var(--radius)'
  // mostrar sub-filtros conforme tipo
  const subDesp=document.getElementById('despesasSubFiltro')
  if(subDesp)subDesp.style.display=t.startsWith('despesas')?'block':'none'
  const subVend=document.getElementById('vendedorSubFiltro')
  if(subVend){
    subVend.style.display=t==='vendedores_rel'?'block':'none'
    if(t==='vendedores_rel')_atualizarVendedorFiltroButtons()
  }
  renderRelatorio()
}
function vendasRelPeriodo(){
  const agora=new Date()
  return vendas.filter(v=>{
    if(!v.data)return _relPeriod==='todos'
    const d=new Date(v.data+'T00:00:00')
    if(_relPeriod==='todos')return true
    if(_relPeriod==='hoje')return v.data===hoje()
    if(_relPeriod==='7'){const l=new Date(agora);l.setDate(l.getDate()-6);return d>=l}
    if(_relPeriod==='30'){const l=new Date(agora);l.setDate(l.getDate()-29);return d>=l}
    if(_relPeriod==='mes')return d.getFullYear()===agora.getFullYear()&&d.getMonth()===agora.getMonth()
    if(_relPeriod==='custom'){const de=document.getElementById('relDateDe').value,ate=document.getElementById('relDateAte').value;if(de&&d<new Date(de+'T00:00:00'))return false;if(ate&&d>new Date(ate+'T23:59:59'))return false;return true}
    return true
  })
}
function renderRelatorio(){
  const pv=vendasRelPeriodo()
  const sumEl=document.getElementById('relSummary'),titleEl=document.getElementById('relTableTitle'),countEl=document.getElementById('relTableCount'),contentEl=document.getElementById('relTableContent')
  if(_relTipo==='vendas'){
    const fat=pv.reduce((t,v)=>t+(v.total||0),0),lucro=pv.reduce((t,v)=>t+calcLucroVenda(v),0)
    sumEl.innerHTML='<div class="rel-sum-card"><div class="rel-sum-label">Total de vendas</div><div class="rel-sum-value" style="color:var(--purple)">'+pv.length+'</div></div><div class="rel-sum-card"><div class="rel-sum-label">Faturamento</div><div class="rel-sum-value" style="color:var(--green)">'+brl(fat)+'</div></div><div class="rel-sum-card"><div class="rel-sum-label">Lucro estimado</div><div class="rel-sum-value" style="color:var(--indigo)">'+brl(lucro)+'</div></div><div class="rel-sum-card"><div class="rel-sum-label">Ticket médio</div><div class="rel-sum-value" style="color:var(--yellow)">'+brl(pv.length?fat/pv.length:0)+'</div></div>'
    titleEl.textContent='Lista de vendas';countEl.textContent=pv.length
    if(!pv.length){contentEl.innerHTML='<div class="empty-state"><span class="empty-icon">🛒</span>Nenhuma venda no período</div>';return}
    contentEl.innerHTML='<table><thead><tr><th>ID</th><th>Data</th><th>Cliente</th><th>Pagamento</th><th>Itens</th><th>Total</th><th>Lucro est.</th></tr></thead><tbody>'+
      [...pv].sort((a,b)=>b.data>a.data?1:b.data<a.data?-1:0).map(v=>{
        const idx=vendas.indexOf(v)
        return'<tr class="tr-click" onclick="openModalVenda(vendas['+idx+'])" title="Ver detalhes">'+
          '<td><span class="badge badge-blue">'+escHtml(v.id||'—')+'</span></td>'+
          '<td class="td-muted">'+fmtData(v.data)+'</td>'+
          '<td>'+escHtml(v.cliente||'—')+'</td>'+
          '<td class="td-muted">'+(v.formaPagamento||'—')+'</td>'+
          '<td class="td-muted">'+(v.itens||[]).length+'</td>'+
          '<td class="td-mono">'+brl(v.total)+'</td>'+
          '<td class="td-mono" style="color:var(--indigo)">'+brl(calcLucroVenda(v))+'</td>'+
        '</tr>'
      }).join('')+
    '</tbody></table>'
  } else if(_relTipo==='faturamento'){
    const fat=pv.reduce((t,v)=>t+(v.total||0),0),porDia={}
    pv.forEach(v=>{const d=v.data||'?';porDia[d]=(porDia[d]||0)+(v.total||0)})
    const dias=Object.entries(porDia).sort((a,b)=>b[0]>a[0]?1:-1)
    sumEl.innerHTML='<div class="rel-sum-card"><div class="rel-sum-label">Faturamento total</div><div class="rel-sum-value" style="color:var(--green)">'+brl(fat)+'</div></div><div class="rel-sum-card"><div class="rel-sum-label">Dias com vendas</div><div class="rel-sum-value" style="color:var(--accent)">'+dias.length+'</div></div><div class="rel-sum-card"><div class="rel-sum-label">Média por dia</div><div class="rel-sum-value" style="color:var(--yellow)">'+brl(dias.length?fat/dias.length:0)+'</div></div>'
    titleEl.textContent='Faturamento por dia';countEl.textContent=dias.length+' dias'
    if(!dias.length){contentEl.innerHTML='<div class="empty-state"><span class="empty-icon">💵</span>Sem vendas no período</div>';return}
    contentEl.innerHTML='<table><thead><tr><th>Data</th><th>Vendas</th><th>Faturamento</th><th>% do total</th></tr></thead><tbody>'+dias.map(([d,val])=>{const nv=pv.filter(v=>v.data===d).length,pct=fat>0?(val/fat*100).toFixed(1):0;return'<tr><td class="td-muted">'+fmtData(d)+'</td><td class="td-muted">'+nv+'</td><td class="td-mono">'+brl(val)+'</td><td><div style="display:flex;align-items:center;gap:8px"><div style="flex:1;background:var(--surface3);border-radius:99px;height:5px;overflow:hidden"><div style="background:var(--green);height:100%;width:'+pct+'%;border-radius:99px"></div></div><span style="font-size:12px;color:var(--text-muted);width:36px;text-align:right">'+pct+'%</span></div></td></tr>'}).join('')+'</tbody></table>'
  } else if(_relTipo==='lucro'){
    const lucroTotal=pv.reduce((t,v)=>t+calcLucroVenda(v),0),fat=pv.reduce((t,v)=>t+(v.total||0),0),margem=fat>0?(lucroTotal/fat*100).toFixed(1):0
    const porProd={}
    pv.forEach(v=>(v.itens||[]).forEach(it=>{const desc=clamp(it.desconto||0),l=(it.preco*(1-desc/100)-(it.custo||0))*it.qtd,np=it.produto||'—';if(!porProd[np])porProd[np]={fat:0,lucro:0,qtd:0};porProd[np].fat+=it.preco*it.qtd*(1-desc/100);porProd[np].lucro+=l;porProd[np].qtd+=it.qtd}))
    const lista=Object.entries(porProd).sort((a,b)=>b[1].lucro-a[1].lucro)
    sumEl.innerHTML='<div class="rel-sum-card"><div class="rel-sum-label">Lucro total</div><div class="rel-sum-value" style="color:var(--indigo)">'+brl(lucroTotal)+'</div></div><div class="rel-sum-card"><div class="rel-sum-label">Margem geral</div><div class="rel-sum-value" style="color:var(--accent)">'+margem+'%</div></div><div class="rel-sum-card"><div class="rel-sum-label">Faturamento base</div><div class="rel-sum-value" style="color:var(--green)">'+brl(fat)+'</div></div>'
    titleEl.textContent='Lucro por produto';countEl.textContent=lista.length+' produtos'
    if(!lista.length){contentEl.innerHTML='<div class="empty-state"><span class="empty-icon">📈</span>Sem dados</div>';return}
    contentEl.innerHTML='<table><thead><tr><th>Produto</th><th>Qtd</th><th>Faturamento</th><th>Lucro</th><th>Margem</th></tr></thead><tbody>'+lista.map(([nome,d])=>{const m=d.fat>0?(d.lucro/d.fat*100).toFixed(1):0,mc=Number(m)>=40?'badge-green':Number(m)>=20?'badge-yellow':'badge-red';return'<tr><td>'+escHtml(nome)+'</td><td class="td-muted">'+d.qtd+'</td><td class="td-mono">'+brl(d.fat)+'</td><td class="td-mono" style="color:var(--indigo)">'+brl(d.lucro)+'</td><td><span class="badge '+mc+'">'+m+'%</span></td></tr>'}).join('')+'</tbody></table>'
  } else if(_relTipo==='estoque'){
    const min=config.estoqueMin!==undefined?config.estoqueMin:3
    sumEl.innerHTML='<div class="rel-sum-card"><div class="rel-sum-label">Total produtos</div><div class="rel-sum-value" style="color:var(--yellow)">'+produtos.length+'</div></div><div class="rel-sum-card"><div class="rel-sum-label">Zerados</div><div class="rel-sum-value" style="color:var(--red)">'+produtos.filter(p=>p.estoque<=0).length+'</div></div><div class="rel-sum-card"><div class="rel-sum-label">Estoque baixo (≤'+min+')</div><div class="rel-sum-value" style="color:var(--yellow)">'+produtos.filter(p=>p.estoque>0&&p.estoque<=min).length+'</div></div><div class="rel-sum-card"><div class="rel-sum-label">Valor em estoque</div><div class="rel-sum-value" style="color:var(--green)">'+brl(produtos.reduce((t,p)=>t+p.custo*p.estoque,0))+'</div></div>'
    titleEl.textContent='Posição de estoque';countEl.textContent=produtos.length+' produtos'
    if(!produtos.length){contentEl.innerHTML='<div class="empty-state"><span class="empty-icon">📦</span>Nenhum produto</div>';return}
    contentEl.innerHTML='<table><thead><tr><th>Produto</th><th>Preço</th><th>Custo</th><th>Margem</th><th>Estoque</th><th>Valor em estoque</th></tr></thead><tbody>'+[...produtos].map((p,i)=>({...p,i})).sort((a,b)=>a.estoque-b.estoque).map(p=>{const m=p.preco>0?((p.preco-p.custo)/p.preco*100).toFixed(1):0,eb=p.estoque<=0?'<span class="badge badge-red">Zerado</span>':p.estoque<=min?'<span class="badge badge-yellow">Baixo ('+p.estoque+')</span>':'<span class="badge badge-green">'+p.estoque+'</span>',mc=Number(m)>=40?'badge-green':Number(m)>=20?'badge-yellow':'badge-red';return'<tr><td>'+escHtml(p.nome)+'</td><td class="td-mono">'+brl(p.preco)+'</td><td class="td-mono td-muted">'+brl(p.custo)+'</td><td><span class="badge '+mc+'">'+m+'%</span></td><td>'+eb+'</td><td class="td-mono">'+brl(p.custo*p.estoque)+'</td></tr>'}).join('')+'</tbody></table>'
  } else if(_relTipo==='ranking'){
    renderRelRanking(pv,sumEl,titleEl,countEl,contentEl)
  } else if(_relTipo==='clientes'){
    renderRelClientes(pv,sumEl,titleEl,countEl,contentEl)
  } else if(_relTipo.startsWith('despesas')){
    renderRelDespesas(pv,sumEl,titleEl,countEl,contentEl,_despesasSubTipo)
  } else if(_relTipo==='fornecedores_rel'){
    renderRelFornecedores(pv,sumEl,titleEl,countEl,contentEl)
  } else if(_relTipo==='compras_forn'){
    renderRelComprasFornecedor(pv,sumEl,titleEl,countEl,contentEl)
  } else if(_relTipo==='pagamentos'){
    renderRelPagamentos(pv,sumEl,titleEl,countEl,contentEl)
  } else if(_relTipo==='vendedores_rel'){
    renderRelVendedores(pv,sumEl,titleEl,countEl,contentEl)
  } else if(_relTipo==='dre'){
    renderRelDRE(pv,sumEl,titleEl,countEl,contentEl)
  } else if(_relTipo==='fiado_rel'){
    renderRelFiado(pv,sumEl,titleEl,countEl,contentEl)
  }
}
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

/* ══ RELATÓRIO: COMPRAS POR FORNECEDOR ══ */
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

/* ══ DRE — DEMONSTRATIVO DE RESULTADO ══ */
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

/* ══ RELATÓRIO: FIADO / A RECEBER ══ */
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

