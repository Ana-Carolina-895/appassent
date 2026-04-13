  document.querySelectorAll('#chFiltroBar .filter-btn').forEach(b=>b.classList.remove('active'))
  if(btn)btn.classList.add('active')
  renderChHistorico()
}

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

function closeClienteHist(){document.getElementById('modalClienteHist').classList.remove('open')}
document.getElementById('modalClienteHist').addEventListener('click',e=>{
  if(e.target===document.getElementById('modalClienteHist'))closeClienteHist()
})
