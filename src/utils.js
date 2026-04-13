/* ══ MÚLTIPLAS ABAS ══ */
(function(){
  const ID=Date.now()+'_'+Math.random()
  if(typeof BroadcastChannel!=='undefined'){
    const bc=new BroadcastChannel('assent_tabs')
    bc.postMessage({type:'open',id:ID})
    bc.onmessage=e=>{if(e.data.id!==ID){document.getElementById('tabWarning').classList.add('show');if(e.data.type==='open')bc.postMessage({type:'here',id:ID})}}
  }
})()

/* ══ UTILS ══ */
const brl=v=>'R$ '+Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})
const fmtCPF=v=>(!v||v.length!==11)?v||'—':v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/,'$1.$2.$3-$4')
const fmtData=d=>d?new Date(d+'T00:00:00').toLocaleDateString('pt-BR'):'—'
const hoje=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
const escHtml=s=>String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
const parseNum=(v,fb=0,mn=null,mx=null)=>{const n=parseFloat(String(v).replace(',','.'));if(isNaN(n)||!isFinite(n))return fb;if(mn!==null&&n<mn)return mn;if(mx!==null&&n>mx)return mx;return n}
const parseInt2=(v,fb=0,mn=null)=>{const n=parseInt(String(v),10);if(isNaN(n))return fb;if(mn!==null&&n<mn)return mn;return n}
const clamp=(v)=>Math.min(100,Math.max(0,parseNum(v,0,0,100)))

function toast(msg,type='success'){
  const c=document.getElementById('toastContainer'),icons={success:'✅',error:'❌',warning:'⚠️',info:'ℹ️'}
  const t=document.createElement('div');t.className='toast '+type
  t.innerHTML='<span>'+icons[type]+'</span><span>'+escHtml(msg)+'</span>'
  c.appendChild(t)
  setTimeout(()=>{t.style.animation='toast-out .25s ease forwards';setTimeout(()=>t.remove(),260)},3200)
}

/* ══ CONFIRM MODAL ══ */
let _cb=null
function showConfirm(msg,cb,title,okLabel,okClass){
  title=title||'Confirmar';okLabel=okLabel||'Confirmar';okClass=okClass||'btn-danger';_cb=cb
  document.getElementById('mConfirmTitle').textContent=title
  document.getElementById('mConfirmMsg').textContent=msg
  const ok=document.getElementById('mConfirmOk');ok.textContent=okLabel;ok.className='btn '+okClass
  document.getElementById('modalConfirm').classList.add('open')
}
function closeConfirm(ok){document.getElementById('modalConfirm').classList.remove('open');if(ok&&_cb)_cb();_cb=null}
document.getElementById('modalConfirm').addEventListener('click',e=>{if(e.target===document.getElementById('modalConfirm'))closeConfirm(false)})

/* ══ MODAL DETALHE VENDA ══ */
let _vendaAtual=null
function openModalVenda(v){
  _vendaAtual=v
  document.getElementById('mvId').textContent=v.id||'—'
  const sinalInfo=v.sinal?'<br>💰 Sinal pago: <b>'+brl(v.sinal.valor)+'</b> via '+escHtml(v.sinal.forma)+'<br>🔖 Restante: <b>'+brl(v.sinal.restante)+'</b> — vence '+fmtData(v.sinal.venc):''
  document.getElementById('mvMeta').innerHTML='Cliente: <b>'+escHtml(v.cliente||'Não informado')+'</b><br>Data: '+fmtData(v.data)+(v.formaPagamento?'<br>Pagamento: <b>'+escHtml(v.formaPagamento)+'</b>':'')+sinalInfo
  const obsWrap=document.getElementById('mvObsWrap')
  if(v.obs){obsWrap.style.display='block';document.getElementById('mvObs').textContent=v.obs}else obsWrap.style.display='none'
  let sb=0,sd=0,sc=0
  document.getElementById('mvItensBody').innerHTML=(v.itens||[]).map(it=>{
    const bruto=it.preco*it.qtd,desc=clamp(it.desconto||0),dv=bruto*(desc/100),total=bruto-dv,custo=(it.custo||0)*it.qtd
    sb+=bruto;sd+=dv;sc+=custo
    const tipoBadge=it.tipo==='servico'?'<span class="servico-badge" style="margin-left:4px;font-size:10px">🎯</span>':'<span class="badge badge-blue" style="margin-left:4px;font-size:10px">📦</span>'
    return'<tr><td>'+escHtml(it.produto||'—')+tipoBadge+'</td><td>'+it.qtd+'</td><td class="td-mono">'+brl(it.preco)+'</td><td class="td-mono td-muted">'+brl(it.custo||0)+'</td><td>'+(desc>0?'<span class="badge badge-yellow">'+desc+'%</span>':'—')+'</td><td class="td-mono">'+brl(total)+'</td></tr>'
  }).join('')
  const total=sb-sd
  document.getElementById('mvTotals').innerHTML=
    '<div class="vd-tot-item"><span class="vd-tot-label">Subtotal</span><span class="vd-tot-value">'+brl(sb)+'</span></div>'+
    '<div class="vd-tot-item"><span class="vd-tot-label">Descontos</span><span class="vd-tot-value hi-yellow">'+brl(sd)+'</span></div>'+
    '<div class="vd-tot-item"><span class="vd-tot-label">Custo total</span><span class="vd-tot-value hi-red">'+brl(sc)+'</span></div>'+
    '<div class="vd-tot-item"><span class="vd-tot-label">Total</span><span class="vd-tot-value hi-green">'+brl(total)+'</span></div>'+
    '<div class="vd-tot-item"><span class="vd-tot-label">Lucro est.</span><span class="vd-tot-value hi-indigo">'+brl(total-sc)+'</span></div>'
  document.getElementById('modalVenda').classList.add('open')
}
function closeModalVenda(){document.getElementById('modalVenda').classList.remove('open')}
document.getElementById('modalVenda').addEventListener('click',e=>{if(e.target===document.getElementById('modalVenda'))closeModalVenda()})

/* ══ MODAL EDITAR VENDA ══ */
let _evIdx=null,_evItens=[]
function editarVenda(i,e){
  e&&e.stopPropagation();const v=vendas[i];_evIdx=i
  _evItens=JSON.parse(JSON.stringify(v.itens||[]))
  document.getElementById('evId').textContent=v.id||''
  document.getElementById('evCliente').innerHTML='<option value="">— Sem cliente —</option>'+clientes.map(c=>'<option'+(c.nome===(v.cliente||'')?' selected':'')+'>'+escHtml(c.nome)+'</option>').join('')
  document.getElementById('evData').value=v.data||''
  document.getElementById('evObs').value=v.obs||''
  document.getElementById('evFormaPgto').value=v.formaPagamento||''
  const evVend=document.getElementById('evVendedor')
  evVend.innerHTML='<option value="">— Nenhum —</option>'+vendedores.map(vv=>'<option value="'+escHtml(vv.nome)+'"'+(vv.nome===(v.vendedor||'')?' selected':'')+'>'+escHtml(vv.nome)+'</option>').join('')
  atualizarEvAddProduto();renderEvItens()
  document.getElementById('modalEditVenda').classList.add('open')
}
function closeEditVenda(){document.getElementById('modalEditVenda').classList.remove('open');_evIdx=null;_evItens=[]}
document.getElementById('modalEditVenda').addEventListener('click',e=>{if(e.target===document.getElementById('modalEditVenda'))closeEditVenda()})
function atualizarEvAddProduto(){
  document.getElementById('evAddProduto').innerHTML=produtos.map((p,i)=>'<option value="'+i+'">'+escHtml(p.nome)+' — '+brl(p.preco)+'</option>').join('')
  document.getElementById('evAddServico').innerHTML=servicos.map((s,i)=>'<option value="'+i+'">'+escHtml(s.nome)+' — '+brl(s.preco)+'</option>').join('')
  onEvAddTipoChange()
}
function onEvAddTipoChange(){
  const tipo=document.getElementById('evAddTipo').value
  document.getElementById('evAddProduto').style.display=tipo==='produto'?'':'none'
  document.getElementById('evAddServico').style.display=tipo==='servico'?'':'none'
}
function renderEvItens(){
  const b=document.getElementById('evItensBody')
  if(!_evItens.length)b.innerHTML='<tr><td colspan="6" style="text-align:center;padding:14px;color:var(--text-muted)">Nenhum item</td></tr>'
  else b.innerHTML=_evItens.map((it,i)=>{
    const bruto=it.preco*it.qtd,total=bruto-bruto*(clamp(it.desconto)/100)
    const ehServico=it.tipo==='servico'
    const selectOpts=ehServico
      ?servicos.map((s,si)=>'<option value="s'+si+'"'+(s.nome===it.produto?' selected':'')+'>🎯 '+escHtml(s.nome)+'</option>').join('')
      :produtos.map((p,pi)=>'<option value="p'+pi+'"'+(p.nome===it.produto?' selected':'')+'>📦 '+escHtml(p.nome)+'</option>').join('')
    return'<tr><td style="min-width:160px"><select onchange="evChangeItem('+i+',\'item\',this.value)" style="font-size:12px">'+selectOpts+'</select></td>'+
      '<td><input type="number" inputmode="numeric" value="'+it.qtd+'" min="1" step="1" style="width:60px" onchange="evChangeItem('+i+',\'qtd\',this.value)"></td>'+
      '<td class="td-mono">'+brl(it.preco)+'</td>'+
      '<td><input type="number" inputmode="decimal" value="'+clamp(it.desconto)+'" min="0" max="100" step="0.01" style="width:60px" onchange="evChangeItem('+i+',\'desconto\',this.value)"></td>'+
      '<td class="td-mono">'+brl(total)+'</td>'+
      '<td><button class="btn btn-danger btn-sm" onclick="evRemoveItem('+i+')">✕</button></td></tr>'
  }).join('')
  renderEvResumo()
}
function evChangeItem(i,campo,val){
  if(campo==='item'){
    if(val.startsWith('s')){
      const s=servicos[parseInt(val.slice(1))]
      if(s){_evItens[i].tipo='servico';_evItens[i].produto=s.nome;_evItens[i].preco=s.preco;_evItens[i].custo=s.custo||0;_evItens[i].servicoIndex=parseInt(val.slice(1));delete _evItens[i].produtoIndex}
    } else {
      const p=produtos[parseInt(val.slice(1))]
      if(p){_evItens[i].tipo='produto';_evItens[i].produto=p.nome;_evItens[i].preco=p.preco;_evItens[i].custo=p.custo||0;_evItens[i].produtoIndex=parseInt(val.slice(1));delete _evItens[i].servicoIndex}
    }
  }
  else if(campo==='qtd'){_evItens[i].qtd=parseInt2(val,1,1)}
  else if(campo==='desconto'){_evItens[i].desconto=clamp(val)}
  renderEvItens()
}
function evRemoveItem(i){_evItens.splice(i,1);renderEvItens()}
function evAddItem(){
  const tipo=document.getElementById('evAddTipo').value
  const qtd=parseInt2(document.getElementById('evAddQtd').value,1,1)
  const desc=clamp(document.getElementById('evAddDesc').value)
  if(tipo==='servico'){
    const pidx=parseInt(document.getElementById('evAddServico').value)
    if(isNaN(pidx)||pidx<0||pidx>=servicos.length){toast('Selecione um serviço.','warning');return}
    const s=servicos[pidx]
    _evItens.push({tipo:'servico',produto:s.nome,preco:s.preco,custo:s.custo||0,qtd,desconto:desc,servicoIndex:pidx})
  } else {
    const pidx=parseInt(document.getElementById('evAddProduto').value)
    if(isNaN(pidx)||pidx<0||pidx>=produtos.length){toast('Selecione um produto.','warning');return}
    const p=produtos[pidx]
    _evItens.push({tipo:'produto',produto:p.nome,preco:p.preco,custo:p.custo||0,qtd,desconto:desc,produtoIndex:pidx})
  }
  document.getElementById('evAddQtd').value='';document.getElementById('evAddDesc').value=''
  renderEvItens();toast('✅ Item adicionado à venda.','info')
}
function renderEvResumo(){
  const sb=_evItens.reduce((t,it)=>t+it.preco*it.qtd,0)
  const sd=_evItens.reduce((t,it)=>t+it.preco*it.qtd*(clamp(it.desconto)/100),0)
  const sc=_evItens.reduce((t,it)=>t+(it.custo||0)*it.qtd,0),total=sb-sd
  document.getElementById('evResumo').innerHTML=
    '<div class="resumo-item"><span class="resumo-label">Subtotal</span><span class="resumo-value">'+brl(sb)+'</span></div>'+
    '<div class="resumo-item"><span class="resumo-label">Descontos</span><span class="resumo-value v-yellow">'+brl(sd)+'</span></div>'+
    '<div class="resumo-item"><span class="resumo-label">Custo</span><span class="resumo-value v-red">'+brl(sc)+'</span></div>'+
    '<div class="resumo-item"><span class="resumo-label">Total</span><span class="resumo-value v-green">'+brl(total)+'</span></div>'+
    '<div class="resumo-item"><span class="resumo-label">Lucro</span><span class="resumo-value v-indigo">'+brl(total-sc)+'</span></div>'
}
function salvarVendaEdit(){
  if(!_evItens.length){toast('A venda precisa ter ao menos um item.','warning');return}
  const v=vendas[_evIdx]
  ;(v.itens||[]).forEach(it=>{if(it.tipo==='servico')return;const p=typeof it.produtoIndex==='number'?produtos[it.produtoIndex]:undefined;if(p)p.estoque+=it.qtd})
  let erroEstoque=null
  _evItens.forEach(it=>{if(it.tipo==='servico')return;const p=typeof it.produtoIndex==='number'?produtos[it.produtoIndex]:undefined;if(p&&it.qtd>p.estoque)erroEstoque='Estoque insuficiente para "'+p.nome+'". Disponível: '+p.estoque})
  if(erroEstoque){
    ;(v.itens||[]).forEach(it=>{if(it.tipo==='servico')return;const p=typeof it.produtoIndex==='number'?produtos[it.produtoIndex]:undefined;if(p)p.estoque-=it.qtd})
    toast(erroEstoque,'error');return
  }
  _evItens.forEach(it=>{if(it.tipo==='servico')return;const p=typeof it.produtoIndex==='number'?produtos[it.produtoIndex]:undefined;if(p)p.estoque-=it.qtd})
  const sb=_evItens.reduce((t,it)=>t+it.preco*it.qtd,0)
  const sd=_evItens.reduce((t,it)=>t+it.preco*it.qtd*(clamp(it.desconto)/100),0)
  vendas[_evIdx]={...v,cliente:document.getElementById('evCliente').value||v.cliente,data:document.getElementById('evData').value||v.data,obs:document.getElementById('evObs').value.trim(),formaPagamento:document.getElementById('evFormaPgto').value,vendedor:document.getElementById('evVendedor').value,itens:JSON.parse(JSON.stringify(_evItens)),total:sb-sd}
  closeEditVenda();toast('✅ Venda atualizada com sucesso!');save()
}

/* ══ LOCALSTORAGE ══ */
function lsGet(k){try{const v=localStorage.getItem(k);return v===null?[]:JSON.parse(v)||[]}catch(e){return[]}}
function lsGetObj(k,def={}){try{const v=localStorage.getItem(k);return v===null?def:JSON.parse(v)||def}catch(e){return def}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){if(e.name==='QuotaExceededError')toast('Armazenamento cheio! Faça um backup.','error');else toast('Erro ao salvar: '+e.message,'error');return false}}

let clientes=lsGet('clientes'),produtos=lsGet('produtos'),vendas=lsGet('vendas')
