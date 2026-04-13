function setDashPeriod(p,btn){
  _dashPeriod=p
  document.querySelectorAll('#dashboard .filter-btn').forEach(b=>b.classList.remove('active'))
  if(btn)btn.classList.add('active')
  document.getElementById('dateRangeWrap').classList.toggle('show',p==='custom')
  renderDashboard()
}
function vendasNoPeriodo(){
  const agora=new Date()
  return vendas.filter(v=>{
    if(!v.data)return _dashPeriod==='todos'
    const d=new Date(v.data+'T00:00:00')
    if(_dashPeriod==='todos')return true
    if(_dashPeriod==='hoje')return v.data===hoje()
    if(_dashPeriod==='7'){const l=new Date(agora);l.setDate(l.getDate()-6);return d>=l}
    if(_dashPeriod==='30'){const l=new Date(agora);l.setDate(l.getDate()-29);return d>=l}
    if(_dashPeriod==='mes')return d.getFullYear()===agora.getFullYear()&&d.getMonth()===agora.getMonth()
    if(_dashPeriod==='custom'){
      const de=document.getElementById('dashDateDe').value,ate=document.getElementById('dashDateAte').value
      if(de&&d<new Date(de+'T00:00:00'))return false
      if(ate&&d>new Date(ate+'T23:59:59'))return false
      return true
    }
    return true
  })
}
function calcLucroVenda(v){if(!v.itens)return 0;return v.itens.reduce((s,it)=>{const d=clamp(it.desconto||0);return s+(it.preco*(1-d/100)-(it.custo||0))*it.qtd},0)}

function vendasPeriodoAnterior(){
  // retorna as vendas do período imediatamente anterior ao atual
  const agora=new Date()
  return vendas.filter(v=>{
    if(!v.data)return false
    const d=new Date(v.data+'T00:00:00')
    if(_dashPeriod==='7'){const fim=new Date(agora);fim.setDate(fim.getDate()-7);const ini=new Date(agora);ini.setDate(ini.getDate()-13);return d>=ini&&d<fim}
    if(_dashPeriod==='30'){const fim=new Date(agora);fim.setDate(fim.getDate()-30);const ini=new Date(agora);ini.setDate(ini.getDate()-59);return d>=ini&&d<fim}
    if(_dashPeriod==='mes'){
      const mesAnt=new Date(agora.getFullYear(),agora.getMonth()-1,1)
      const fimAnt=new Date(agora.getFullYear(),agora.getMonth(),0)
      return d>=mesAnt&&d<=fimAnt
    }
    return false
  })
}
function renderComparativo(elId,atual,anterior,lbl){
  const el=document.getElementById(elId);if(!el)return
  if(anterior===0||_dashPeriod==='todos'||_dashPeriod==='custom'){el.innerHTML='';return}
  const diff=atual-anterior
  const pct=anterior>0?(Math.abs(diff)/anterior*100).toFixed(1):null
  if(pct===null){el.innerHTML='';return}
  const up=diff>=0
  const seta=up?'↑':'↓'
  const cls=up?'up':'down'
  const periodoLabel={7:'vs 7 dias anteriores',30:'vs 30 dias anteriores',mes:'vs mês anterior'}[_dashPeriod]||''
  el.innerHTML='<span class="fin-comp '+cls+'">'+seta+' '+pct+'%</span><span style="font-size:11px;color:var(--text-muted);margin-left:4px">'+periodoLabel+'</span>'
}

function renderDashboard(){
  renderStockAlert()
  renderDespesasAlert()
  renderAgendaAlert()
  renderDashDespesas()
  renderFiadoAlert()
  renderDashCalendario()
  const pv=vendasNoPeriodo()
  const fat=pv.reduce((t,v)=>t+(v.total||0),0)
  const custoTotal=pv.reduce((t,v)=>{
    if(!v.itens)return t
    return t+v.itens.reduce((s,it)=>(s+(it.custo||0)*it.qtd),0)
  },0)
  const lucro=pv.reduce((t,v)=>t+calcLucroVenda(v),0)
  const margem=fat>0?(lucro/fat*100):0

  document.getElementById('statClientes').textContent=clientes.length
  document.getElementById('statProdutos').textContent=produtos.length
  document.getElementById('statServicos').textContent=servicos.length
  document.getElementById('statVendas').textContent=pv.length
  const sl={7:'últimos 7 dias',30:'últimos 30 dias',mes:'este mês',todos:'total histórico',custom:'período selecionado'}
  const lbl=sl[_dashPeriod]||''
  const svSub=document.getElementById('statVendasSub');if(svSub)svSub.textContent=lbl

  // Cards financeiros
  document.getElementById('finReceita').textContent=brl(fat)
  document.getElementById('finReceitaSub').textContent=pv.length+' venda(s) · '+lbl
  document.getElementById('finCusto').textContent=brl(custoTotal)
  document.getElementById('finCustoSub').textContent='Custo de mercadoria/serviço'
  document.getElementById('finLucro').textContent=brl(lucro)
  const margemCls=margem>=40?'ok':margem>=20?'med':'low'
  document.getElementById('finMargemBadge').innerHTML='<span class="fin-margem '+margemCls+'">Margem: '+margem.toFixed(1)+'%</span>'

  // Comparativo (período anterior do mesmo tamanho)
  const pvAnterior=vendasPeriodoAnterior()
  const fatAnt=pvAnterior.reduce((t,v)=>t+(v.total||0),0)
  const custoAnt=pvAnterior.reduce((t,v)=>v.itens?t+v.itens.reduce((s,it)=>s+(it.custo||0)*it.qtd,0):t,0)
  const lucroAnt=pvAnterior.reduce((t,v)=>t+calcLucroVenda(v),0)
  renderComparativo('finReceitaComp',fat,fatAnt,lbl)
  renderComparativo('finCustoComp',custoTotal,custoAnt,lbl)
  renderComparativo('finLucroComp',lucro,lucroAnt,lbl)
  // gráfico linha
  const porDia={}
  pv.forEach(v=>{const d=v.data||'?';porDia[d]=(porDia[d]||0)+(v.total||0)})
  const dias=Object.keys(porDia).sort()
  // Métricas secundárias (dias já declarado acima)
  const ticket=pv.length>0?fat/pv.length:0
  document.getElementById('metTicket').textContent=brl(ticket)
  document.getElementById('metTicketSub').textContent=pv.length>0?pv.length+' venda(s) no período':'Sem vendas no período'
  const margemPct=fat>0?(lucro/fat*100):0
  const margemBarCor=margemPct>=40?'var(--green)':margemPct>=20?'var(--yellow)':'var(--red)'
  document.getElementById('metMargem').textContent=margemPct.toFixed(1)+'%'
  document.getElementById('metMargem').style.color=margemBarCor
  document.getElementById('metMargemBar').style.width=Math.min(margemPct,100)+'%'
  document.getElementById('metMargemBar').style.background=margemBarCor
  const diasComVenda=dias.length||1
  const projecao=Math.round((fat/diasComVenda)*30)
  document.getElementById('metProjecao').textContent=brl(projecao)
  document.getElementById('metProjecaoSub').textContent=fat>0?'Baseado em '+diasComVenda+' dia(s) de venda':'Sem dados suficientes'
  if(_chartFat){_chartFat.destroy();_chartFat=null}
  const ctxFat=document.getElementById('chartFaturamento').getContext('2d')
  if(dias.length){
    _chartFat=new Chart(ctxFat,{type:'line',data:{labels:dias.map(d=>fmtData(d)),datasets:[{label:'Faturamento',data:dias.map(d=>porDia[d]),borderColor:'#38bdf8',backgroundColor:'rgba(56,189,248,.08)',borderWidth:2,pointBackgroundColor:'#38bdf8',pointRadius:4,tension:.35,fill:true}]},options:{responsive:true,maintainAspectRatio:true,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>' '+brl(ctx.parsed.y)}}},scales:{x:{grid:{color:'rgba(255,255,255,.04)'},ticks:{color:'#5a6a85',font:{size:11}}},y:{grid:{color:'rgba(255,255,255,.04)'},ticks:{color:'#5a6a85',font:{size:11},callback:v=>'R$'+Number(v).toLocaleString('pt-BR',{maximumFractionDigits:0})}}}}})
  } else {ctxFat.clearRect(0,0,ctxFat.canvas.width,ctxFat.canvas.height);ctxFat.fillStyle='#5a6a85';ctxFat.font='13px Sora,sans-serif';ctxFat.textAlign='center';ctxFat.fillText('Nenhuma venda no período',ctxFat.canvas.width/2,80)}
  // gráfico rosca
  const qmProd={}
  pv.forEach(v=>(v.itens||[]).forEach(it=>{qmProd[it.produto]=(qmProd[it.produto]||0)+it.qtd}))
  const topProd=Object.entries(qmProd).sort((a,b)=>b[1]-a[1]).slice(0,6)
  if(_chartProd){_chartProd.destroy();_chartProd=null}
  const ctxProd=document.getElementById('chartProdutos').getContext('2d')
  if(topProd.length){
    _chartProd=new Chart(ctxProd,{type:'doughnut',data:{labels:topProd.map(([n])=>n),datasets:[{data:topProd.map(([,q])=>q),backgroundColor:CHART_COLORS.slice(0,topProd.length),borderWidth:0,hoverOffset:4}]},options:{responsive:true,maintainAspectRatio:true,plugins:{legend:{position:'bottom',labels:{color:'#8896ad',font:{size:11},boxWidth:12,padding:10}},tooltip:{callbacks:{label:ctx=>ctx.label+': '+ctx.parsed+' un.'}}}}})
  } else {ctxProd.clearRect(0,0,ctxProd.canvas.width,ctxProd.canvas.height);ctxProd.fillStyle='#5a6a85';ctxProd.font='13px Sora,sans-serif';ctxProd.textAlign='center';ctxProd.fillText('Sem dados',ctxProd.canvas.width/2,60)}
  // ranking produtos
  const rankProdEl=document.getElementById('rankProdutos')
  if(!topProd.length)rankProdEl.innerHTML='<div class="empty-state"><span class="empty-icon">📦</span>Sem dados</div>'
  else{
    const totalQtd=topProd.reduce((t,[,q])=>t+q,0)
    rankProdEl.innerHTML=Object.entries(qmProd).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([nome,qtd],idx)=>{
      const pct=totalQtd>0?Math.round(qtd/totalQtd*100):0,posClass=idx===0?'gold':idx===1?'silver':idx===2?'bronze':'',cor=CHART_COLORS[idx%CHART_COLORS.length]
      return'<div class="rank-item"><span class="rank-pos '+posClass+'">'+(idx+1)+'º</span><div class="rank-bar-wrap"><div class="rank-name">'+escHtml(nome)+'</div><div class="rank-bar-bg"><div class="rank-bar-fill" style="width:'+pct+'%;background:'+cor+'"></div></div></div><span class="rank-val">'+qtd+' un.</span></div>'
    }).join('')
  }
  // ranking clientes
  const rankClEl=document.getElementById('rankClientes')
  const porCl={}
  pv.forEach(v=>{const c=v.cliente||'Não informado';if(!porCl[c])porCl[c]={total:0,qtd:0};porCl[c].total+=(v.total||0);porCl[c].qtd++})
  const rankCl=Object.entries(porCl).sort((a,b)=>b[1].total-a[1].total)
  if(!rankCl.length)rankClEl.innerHTML='<div class="empty-state"><span class="empty-icon">👥</span>Sem dados</div>'
  else{
    const maxT=rankCl[0][1].total
    rankClEl.innerHTML=rankCl.slice(0,8).map(([nome,d],idx)=>{
      const pct=maxT>0?Math.round(d.total/maxT*100):0,posClass=idx===0?'gold':idx===1?'silver':idx===2?'bronze':'',cor=CHART_COLORS[idx%CHART_COLORS.length]
      return'<div class="rank-item"><span class="rank-pos '+posClass+'">'+(idx+1)+'º</span><div class="rank-bar-wrap"><div class="rank-name">'+escHtml(nome)+'</div><div class="rank-bar-bg"><div class="rank-bar-fill" style="width:'+pct+'%;background:'+cor+'"></div></div></div><span class="rank-val">'+brl(d.total)+'</span></div>'
    }).join('')
  }
  // últimas vendas
  const ult=[...vendas].sort((a,b)=>b.data>a.data?1:b.data<a.data?-1:0).slice(0,6)
  document.getElementById('dashVendasBody').innerHTML=ult.length?ult.map(v=>'<tr><td><span class="badge badge-blue">'+escHtml(v.id||'—')+'</span></td><td>'+escHtml(v.cliente||'—')+'</td><td class="td-muted">'+fmtData(v.data)+'</td><td class="td-mono">'+brl(v.total)+'</td></tr>').join(''):'<tr><td colspan="4"><div class="empty-state"><span class="empty-icon">💰</span>Nenhuma venda ainda</div></td></tr>'
}
