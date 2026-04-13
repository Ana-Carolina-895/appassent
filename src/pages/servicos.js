function salvarServico(i){
  const nome=document.getElementById('es_n'+i).value.trim()
  if(!nome){toast('Informe o nome do serviço.','warning');return}
  if(servicos.some((s,idx)=>idx!==i&&s.nome.toLowerCase()===nome.toLowerCase())){toast('Serviço já cadastrado.','error');return}
  servicos[i]={
    nome,
    preco:parseNum(document.getElementById('es_p'+i).value,0,0),
    custo:parseNum(document.getElementById('es_c'+i).value,0,0),
    categoria:document.getElementById('es_cat'+i).value.trim(),
    descricao:document.getElementById('es_d'+i).value.trim()
  }
  servicoEditando=null;toast('✅ Serviço atualizado com sucesso!');save()
}

function excluirServico(i){
  const ns=servicos[i].nome
  const vv=vendas.filter(v=>(v.itens||[]).some(it=>it.tipo==='servico'&&it.produto===ns))
  showConfirm('Excluir o serviço "'+ns+'"?'+(vv.length?' Aparece em '+vv.length+' venda(s) — histórico mantido.':''),()=>{
    servicos.splice(i,1);toast('🗑️ Serviço removido.','info');save()
  })
}

function renderServicos(){
  const q=(document.getElementById('buscaServico').value||'').toLowerCase()
  const f=servicos.map((s,_i)=>({...s,_i})).filter(s=>s.nome.toLowerCase().includes(q)||(s.categoria||'').toLowerCase().includes(q))
  document.getElementById('cntServicos').textContent=f.length
  const b=document.getElementById('servicosBody')
  if(!f.length){b.innerHTML='<tr><td colspan="7"><div class="empty-state"><span class="empty-icon">🎯</span>Nenhum serviço encontrado</div></td></tr>';return}
  b.innerHTML=f.map(s=>{
    const i=s._i
    const m=s.preco>0?((s.preco-s.custo)/s.preco*100).toFixed(1):0
    const mc=Number(m)>=40?'badge-green':Number(m)>=20?'badge-yellow':'badge-red'
    if(servicoEditando===i) return'<tr>'+
      '<td><input id="es_n'+i+'" value="'+escHtml(s.nome)+'"></td>'+
      '<td><select id="es_cat'+i+'" style="min-width:120px">'+getCatOptions(s.categoria||'')+'</select></td>'+
      '<td><input id="es_p'+i+'" type="number" inputmode="decimal" value="'+s.preco+'" min="0" step="0.01" style="width:90px"></td>'+
      '<td><input id="es_c'+i+'" type="number" inputmode="decimal" value="'+s.custo+'" min="0" step="0.01" style="width:90px"></td>'+
      '<td>—</td>'+
      '<td><input id="es_d'+i+'" value="'+escHtml(s.descricao||'')+'" placeholder="Descrição"></td>'+
      '<td><div class="td-actions">'+
        '<button class="btn btn-primary btn-sm" onclick="salvarServico('+i+')">Salvar</button>'+
        '<button class="btn btn-ghost btn-sm" onclick="cancelarServico()">✕</button>'+
      '</div></td></tr>'
    return'<tr>'+
      '<td>'+escHtml(s.nome)+'</td>'+
      '<td>'+(s.categoria?'<span class="badge badge-purple">'+escHtml(s.categoria)+'</span>':'<span class="td-muted">—</span>')+'</td>'+
      '<td class="td-mono">'+brl(s.preco)+'</td>'+
      '<td class="td-mono td-muted">'+brl(s.custo)+'</td>'+
      '<td><span class="badge '+mc+'">'+m+'%</span></td>'+
      '<td class="td-muted">'+(s.descricao?escHtml(s.descricao):'—')+'</td>'+
      '<td><div class="td-actions">'+
        '<button class="btn btn-warning btn-sm" onclick="editarServico('+i+')">Editar</button>'+
        '<button class="btn btn-danger btn-sm" onclick="excluirServico('+i+')">Excluir</button>'+
      '</div></td></tr>'
  }).join('')
}

/* ══ DUPLICAR VENDA ══ */
function duplicarVenda(i,e){
  e&&e.stopPropagation()
  const orig=vendas[i]
  // valida estoque antes de duplicar (só itens produto)
  for(const it of (orig.itens||[])){
    if(it.tipo==='servico') continue
    const p=typeof it.produtoIndex==='number'?produtos[it.produtoIndex]:undefined
    if(!p){toast('Produto "'+it.produto+'" não encontrado no cadastro. Edite a venda antes de duplicar.','error');return}
    if(it.qtd>p.estoque){toast('Estoque insuficiente para "'+p.nome+'" ao duplicar. Disponível: '+p.estoque,'error');return}
  }
  showConfirm(
    'Duplicar a venda '+escHtml(orig.id||'#'+i)+'? Será criada uma nova venda com a data de hoje e os mesmos itens.',
    ()=>{
      const novosItens=JSON.parse(JSON.stringify(orig.itens||[]))
      // desconta estoque
      novosItens.forEach(it=>{
        if(it.tipo==='servico') return
        if(typeof it.produtoIndex==='number') produtos[it.produtoIndex].estoque-=it.qtd
      })
      const sb=novosItens.reduce((t,it)=>t+it.preco*it.qtd,0)
      const sd=novosItens.reduce((t,it)=>t+it.preco*it.qtd*(clamp(it.desconto||0)/100),0)
      vendas.push({
        id:nextSaleId(),
        cliente:orig.cliente,
        itens:novosItens,
        total:sb-sd,
        data:hoje(),
        obs:orig.obs?'[Duplicada de '+orig.id+'] '+orig.obs:'[Duplicada de '+orig.id+']',
        formaPagamento:orig.formaPagamento||''
      })
      toast('⧉ Venda duplicada com sucesso para hoje!')
      save()
    },
    'Duplicar venda','Sim, duplicar','btn-primary'
  )
}

/* ══ MODAL DETALHES CAIXA ══ */
function openModalCaixaDet(i){
  const c=caixas[i],r=calcCaixa(c)
  document.getElementById('cdetData').textContent=fmtData(c.data)
  const statusTxt=c.status==='aberto'?'🔓 Caixa aberto':'🔒 Fechado às '+new Date(c.fechamento).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
  document.getElementById('cdetStatus').textContent=statusTxt+(c.obsFechamento?' · '+c.obsFechamento:'')

  // números resumo
  document.getElementById('cdetNums').innerHTML=
    '<div class="caixa-det-num"><div class="caixa-det-num-label">Fundo abertura</div><div class="caixa-det-num-val" style="color:var(--accent)">'+brl(c.saldoAbertura||0)+'</div></div>'+
    '<div class="caixa-det-num"><div class="caixa-det-num-label">Vendas ('+r.qtdVendas+')</div><div class="caixa-det-num-val" style="color:var(--green)">'+brl(r.totalVendas)+'</div></div>'+
    '<div class="caixa-det-num"><div class="caixa-det-num-label">Aportes</div><div class="caixa-det-num-val" style="color:var(--accent)">'+brl(r.aportes)+'</div></div>'+
    '<div class="caixa-det-num"><div class="caixa-det-num-label">Sangrias</div><div class="caixa-det-num-val" style="color:var(--red)">'+brl(r.sangrias)+'</div></div>'+
    '<div class="caixa-det-num"><div class="caixa-det-num-label">Saldo esperado</div><div class="caixa-det-num-val" style="color:var(--yellow)">'+brl(r.saldoEsperado)+'</div></div>'

  // breakdown por forma de pagamento
  const pgtoEl=document.getElementById('cdetPgtoGrid')
  if(Object.keys(r.porPgto).length){
    pgtoEl.innerHTML=Object.entries(r.porPgto).map(([fp,val])=>
      '<div class="caixa-det-pgto-item"><div class="caixa-pgto-label">'+escHtml(fp)+'</div><div class="caixa-pgto-val" style="color:var(--accent)">'+brl(val)+'</div></div>'
    ).join('')
  } else {
    pgtoEl.innerHTML='<div style="font-size:13px;color:var(--text-muted);padding:4px 0">Nenhuma venda no dia</div>'
  }

  // movimentações manuais (sangrias + aportes)
  const movs=(c.movimentacoes||[]).slice().sort((a,b)=>a.ts-b.ts)
  const movsEl=document.getElementById('cdetMovs')
  if(!movs.length){
    movsEl.innerHTML='<div style="font-size:13px;color:var(--text-muted);padding:8px 0">Nenhuma movimentação manual registrada.</div>'
  } else {
    movsEl.innerHTML=movs.map(m=>{
      const hora=new Date(m.ts).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
      const icone=m.tipo==='aporte'?'📥':'📤'
      const cls=m.tipo==='aporte'?'pos':'neg'
      const sinal=m.tipo==='aporte'?'+':'-'
      return'<div class="caixa-det-mov-row">'+
        '<span style="font-size:15px;width:22px;flex-shrink:0">'+icone+'</span>'+
        '<span style="flex:1;color:var(--text-dim)">'+escHtml(m.desc||m.tipo)+'</span>'+
        '<span style="font-size:11px;color:var(--text-muted);font-family:\'JetBrains Mono\',monospace;margin-right:12px">'+hora+'</span>'+
        '<span style="font-family:\'JetBrains Mono\',monospace;font-size:13px;font-weight:600;color:'+(m.tipo==='aporte'?'var(--green)':'var(--red)')+'">'+sinal+brl(Math.abs(m.valor))+'</span>'+
      '</div>'
    }).join('')
  }

  // conferência (só caixas fechados)
  const confEl=document.getElementById('cdetConferencia')
  if(c.status==='fechado'&&c.valorContado!==null&&c.valorContado!==undefined){
    confEl.style.display='block'
    const dif=c.diferencaCaixa||0
    const difCls=dif>0.005?'diferenca-pos':dif<-0.005?'diferenca-neg':'diferenca-zero'
    const difLabel=dif>0.005?'Sobrou no caixa':dif<-0.005?'Faltou no caixa':'Caixa fechou zerado ✅'
    document.getElementById('cdetConferenciaBody').innerHTML=
      '<div style="background:var(--surface3);border:1px solid var(--border2);border-radius:var(--radius);padding:14px 18px">'+
        '<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border);font-size:13px">'+
          '<span style="color:var(--text-dim)">Saldo esperado</span>'+
          '<span style="font-family:\'JetBrains Mono\',monospace;color:var(--yellow)">'+brl(r.saldoEsperado)+'</span>'+
        '</div>'+
        '<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border);font-size:13px">'+
          '<span style="color:var(--text-dim)">Valor contado</span>'+
          '<span style="font-family:\'JetBrains Mono\',monospace;color:var(--accent)">'+brl(c.valorContado)+'</span>'+
        '</div>'+
        '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;font-size:14px;font-weight:600">'+
          '<span>'+difLabel+'</span>'+
          '<span class="'+difCls+'" style="font-family:\'JetBrains Mono\',monospace">'+(dif>=0?'+':'')+brl(dif)+'</span>'+
        '</div>'+
      '</div>'
  } else {
    confEl.style.display='none'
  }

  document.getElementById('modalCaixaDet').classList.add('open')
}
function closeModalCaixaDet(){document.getElementById('modalCaixaDet').classList.remove('open')}
document.getElementById('modalCaixaDet')?.addEventListener('click',e=>{if(e.target===document.getElementById('modalCaixaDet'))closeModalCaixaDet()})

/* ══ FOTO DE PRODUTO ══ */

function handleNovoProdFoto(input){
  const file=input.files[0];if(!file)return
  if(file.size>512000){toast('⚠️ Imagem muito grande. Máx. 500kb.','warning');return}
  const r=new FileReader()
  r.onload=function(){
    _novoProdFoto=r.result
    const prev=document.getElementById('novoProdFotoPreview')
    if(prev) prev.innerHTML='<img src="'+r.result+'" style="width:100%;height:100%;object-fit:cover;border-radius:8px">'
  }
  r.readAsDataURL(file)
  input.value=''
}
function limparNovoProdFoto(){
  _novoProdFoto=''
  const prev=document.getElementById('novoProdFotoPreview')
  if(prev){prev.innerHTML='📦'}
}
/* ══ BUSCA GLOBAL ══ */
let _gsBlurTimer=null
function onGlobalSearch(q){
  if(!q||q.length<2){hideGlobalDropdown();return}
  showGlobalDropdown(q)
}
function showGlobalDropdown(q){
  q=q||document.getElementById('globalSearchInput').value
  const dd=document.getElementById('globalSearchDropdown')
  if(!q||q.length<2){dd.style.display='none';return}
  const ql=q.toLowerCase()
  let html=''

  // Clientes
  const rcl=clientes.reduce((acc,c,i)=>{if(c.nome.toLowerCase().includes(ql)||(c.cpf||'').includes(ql)||(c.telefone||'').includes(ql))acc.push({c,i});return acc},[]).slice(0,4)
  if(rcl.length){
    html+='<div class="gs-group-label">👥 Clientes</div>'
    html+=rcl.map(({c,i})=>{
      return'<div class="gs-item" onclick="goToCliente('+i+')">'+
        '<span class="gs-item-icon">👤</span>'+
        '<div class="gs-item-main"><div class="gs-item-name">'+escHtml(c.nome)+'</div>'+
        '<div class="gs-item-sub">'+(c.telefone||'')+(c.cpf?' · '+fmtCPF(c.cpf):'')+'</div></div>'+
      '</div>'
    }).join('')
  }

  // Produtos
  const rprod=produtos.reduce((acc,p,i)=>{if(p.nome.toLowerCase().includes(ql))acc.push({p,i});return acc},[]).slice(0,4)
  if(rprod.length){
    html+='<div class="gs-group-label">📦 Produtos</div>'
    html+=rprod.map(({p,i})=>{
      const min=config.estoqueMin!==undefined?config.estoqueMin:3
      const estoqBadge=p.estoque<=0?'<span style="color:var(--red);font-size:11px">⚠ Zerado</span>':p.estoque<=min?'<span style="color:var(--yellow);font-size:11px">⚠ Baixo</span>':''
      return'<div class="gs-item" onclick="goToProduto('+i+')">'+
        '<span class="gs-item-icon">'+(p.foto?'<img src="'+p.foto+'" style="width:20px;height:20px;border-radius:4px;object-fit:cover">':'📦')+'</span>'+
        '<div class="gs-item-main"><div class="gs-item-name">'+escHtml(p.nome)+' '+estoqBadge+'</div>'+
        '<div class="gs-item-sub">'+brl(p.preco)+' · Estoque: '+p.estoque+'</div></div>'+
      '</div>'
    }).join('')
  }

  // Serviços
  const rsvc=servicos.filter(s=>s.nome.toLowerCase().includes(ql)||(s.categoria||'').toLowerCase().includes(ql)).slice(0,3)
  if(rsvc.length){
    html+='<div class="gs-group-label">🎯 Serviços</div>'
    html+=rsvc.map((s,_)=>{
      return'<div class="gs-item" onclick="goToServicos()">'+
        '<span class="gs-item-icon">🎯</span>'+
        '<div class="gs-item-main"><div class="gs-item-name">'+escHtml(s.nome)+'</div>'+
        '<div class="gs-item-sub">'+(s.categoria?escHtml(s.categoria)+' · ':'')+brl(s.preco)+'</div></div>'+
      '</div>'
    }).join('')
  }

  // Vendas
  const rvnd=vendas.reduce((acc,v,i)=>{if((v.id||'').toLowerCase().includes(ql)||(v.cliente||'').toLowerCase().includes(ql))acc.push({v,i});return acc},[]).slice(0,4)
  if(rvnd.length){
    html+='<div class="gs-group-label">💰 Vendas</div>'
    html+=rvnd.map(({v,i})=>{
      return'<div class="gs-item" onclick="goToVenda('+i+')">'+
        '<span class="gs-item-icon">🛒</span>'+
        '<div class="gs-item-main"><div class="gs-item-name">'+escHtml(v.id||'—')+' — '+escHtml(v.cliente||'')+'</div>'+
        '<div class="gs-item-sub">'+fmtData(v.data)+' · '+brl(v.total)+'</div></div>'+
