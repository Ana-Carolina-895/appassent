function iaContexto(){
  const hj = hoje()
  const anoMes = hj.slice(0,7)
  const vendasMes = vendas.filter(v => v.data && v.data.slice(0,7) === anoMes)
  const faturMes = vendasMes.reduce((t,v) => t+(v.total||0), 0)
  const mesAnt = new Date(); mesAnt.setMonth(mesAnt.getMonth()-1)
  const anoMesAnt = mesAnt.toISOString().slice(0,7)
  const vendasMesAnt = vendas.filter(v => v.data && v.data.slice(0,7) === anoMesAnt)
  const faturMesAnt = vendasMesAnt.reduce((t,v) => t+(v.total||0), 0)
  const despPend = despesas.filter(d => !d.paga)
  const despVenc = despesas.filter(d => !d.paga && d.venc < hj)
  const fiadoPend = vendas.filter(v => v.fiado && !v.fiadoRecebido)
  const estoqueMin = config.estoqueMin || 3
  const semEstoque = produtos.filter(p => p.estoque <= 0)
  const baixoEstoque = produtos.filter(p => p.estoque > 0 && p.estoque <= estoqueMin)

  // Top 5 produtos mais vendidos
  const mapProd = {}
  vendas.forEach(v => (v.itens||[]).forEach(it => {
    if(it.tipo==='servico') return
    const k = it.produto||'?'
    if(!mapProd[k]) mapProd[k] = {qtd:0,fat:0}
    mapProd[k].qtd += it.qtd
    mapProd[k].fat += it.preco*it.qtd*(1-(it.desconto||0)/100)
  }))
  const topProd = Object.entries(mapProd).sort((a,b)=>b[1].qtd-a[1].qtd).slice(0,5)
    .map(([n,d])=>'  • '+n+': '+d.qtd+' un. / '+brl(d.fat)).join('\n')

  // Top 5 clientes
  const mapCli = {}
  vendas.forEach(v => {
    const k = v.cliente||'Sem nome'
    if(!mapCli[k]) mapCli[k] = {qtd:0,fat:0}
    mapCli[k].qtd++; mapCli[k].fat += v.total||0
  })
  const topCli = Object.entries(mapCli).sort((a,b)=>b[1].fat-a[1].fat).slice(0,5)
    .map(([n,d])=>'  • '+n+': '+d.qtd+' compras / '+brl(d.fat)).join('\n')

  // Formas de pagamento
  const mapPgto = {}
  vendas.forEach(v => { const k=v.formaPagamento||'Não informado'; mapPgto[k]=(mapPgto[k]||0)+1 })
  const topPgto = Object.entries(mapPgto).sort((a,b)=>b[1]-a[1]).slice(0,4)
    .map(([k,v])=>k+' ('+v+')').join(', ')

  // Próximos eventos
  const proxEvs = agenda.filter(e=>e.data>=hj&&!e.concluido)
    .sort((a,b)=>a.data>b.data?1:-1).slice(0,5)
    .map(e=>'  • '+fmtData(e.data)+(e.hora?' '+e.hora:'')+' — '+e.titulo+(e.clienteNome?' ('+e.clienteNome+')':'')).join('\n')

  // Despesas vencendo em 7 dias
  const emBreve = new Date(); emBreve.setDate(emBreve.getDate()+7)
  const emBreveStr = emBreve.toISOString().slice(0,10)
  const despBreve = despesas.filter(d=>!d.paga&&d.venc>=hj&&d.venc<=emBreveStr)
    .map(d=>'  • '+fmtData(d.venc)+' — '+d.nome+': '+brl(d.valor)).join('\n')

  const variacao = faturMesAnt>0?((faturMes-faturMesAnt)/faturMesAnt*100).toFixed(1)+'%':'—'
  const semEstNomes = semEstoque.map(p=>p.nome).slice(0,3).join(', ')+(semEstoque.length>3?' e mais...':'')

  return 'Você é o assistente integrado do ASSENT, sistema de gestão empresarial. Responda sempre em português, com objetividade e precisão.\n\n'+
'SOBRE O SISTEMA ASSENT:\n'+
'Módulos disponíveis: Clientes, Produtos, Serviços, Vendas, Entrada de Estoque, Caixa Diário, Despesas, Fornecedores, Vendedores, Fiado/A Receber, Agenda, Relatórios (DRE, faturamento, lucro, estoque, ranking, clientes, vendedores, formas de pagamento) e este Assistente IA.\n\n'+
'COMO AGIR:\n'+
'- Use os dados reais abaixo para responder perguntas sobre o negócio\n'+
'- Compare com o mês anterior quando fizer análise de faturamento\n'+
'- Sugira ações concretas com base nos dados (estoque zerado = repor, despesa vencida = pagar)\n'+
'- Para dúvidas sobre onde encontrar algo no sistema, explique o caminho exato\n'+
'- Você pode discutir estratégia, precificação, gestão financeira, atendimento\n'+
'- Seja direto e prático, sem enrolação\n\n'+
'=== DADOS DO NEGÓCIO ('+hj+') ===\n'+
'Empresa: '+(config.empresaNome||'Não configurada')+' | Moeda: '+(config.moeda||'R$')+'\n\n'+
'FATURAMENTO:\n'+
'  Este mês ('+anoMes+'): '+brl(faturMes)+' em '+vendasMes.length+' vendas\n'+
'  Mês anterior ('+anoMesAnt+'): '+brl(faturMesAnt)+' em '+vendasMesAnt.length+' vendas\n'+
'  Variação: '+variacao+'\n'+
'  Total histórico: '+vendas.length+' vendas\n\n'+
'CADASTROS: Clientes: '+clientes.length+' | Produtos: '+produtos.length+' | Serviços: '+servicos.length+' | Vendedores: '+vendedores.length+' | Fornecedores: '+fornecedores.length+'\n\n'+
'ESTOQUE:\n'+
'  Sem estoque: '+semEstoque.length+(semEstoque.length?' ('+semEstNomes+')':'')+'\n'+
'  Estoque baixo (≤'+estoqueMin+'): '+baixoEstoque.length+'\n\n'+
'FINANCEIRO:\n'+
'  Despesas pendentes: '+despPend.length+' → '+brl(despPend.reduce((t,d)=>t+d.valor,0))+'\n'+
'  Despesas vencidas: '+despVenc.length+' → '+brl(despVenc.reduce((t,d)=>t+d.valor,0))+'\n'+
'  Fiado em aberto: '+fiadoPend.length+' → '+brl(fiadoPend.reduce((t,v)=>t+(v.total||0),0))+'\n'+
(despBreve?'  Vencendo em 7 dias:\n'+despBreve+'\n':'')+
'\nAGENDA (próximos):\n'+(proxEvs||'  Nenhum evento')+'\n\n'+
'TOP PRODUTOS:\n'+(topProd||'  Sem dados')+'\n\n'+
'TOP CLIENTES:\n'+(topCli||'  Sem dados')+'\n\n'+
'FORMAS DE PAGAMENTO: '+(topPgto||'—')
}

/* ══ ASSISTENTE IA FLUTUANTE ══ */
let _iaAberto = false

function _atualizarStatusIaKey(){
  const dot = document.getElementById('iaKeyStatusDot')
  const txt = document.getElementById('iaKeyStatusTxt')
  if(!dot || !txt) return
  if(window._anthropicKey){
    dot.style.background = 'var(--green)'
    txt.textContent = '✅ Chave do Gemini configurada — Assistente IA ativo para todos os usuários'
  } else {
    dot.style.background = 'var(--red)'
    txt.textContent = '❌ Chave não configurada — Assistente IA desativado'
  }
}

async function salvarIaKey(){
  const input = document.getElementById('cfgAnthropicKeyInput')
  const key = (input?.value || '').trim()
  if(!key){ toast('Digite a chave antes de salvar.','error'); return }
  if(!key.startsWith('AIza')){ toast('Chave inválida. A chave do Gemini começa com AIza','error'); return }
  try {
    await window._fbSetDoc('config', 'sistema', { anthropicKey: key }, true)
    window._anthropicKey = key
    input.value = ''
    _atualizarStatusIaKey()
    toast('✅ Chave do Gemini salva para todos os usuários!','success')
  } catch(e) {
    toast('Erro ao salvar chave: ' + e.message, 'error')
  }
}

function iaToggleFloat(){
  const win = document.getElementById('iaFloatWin')
  _iaAberto = !_iaAberto
  win.classList.toggle('open', _iaAberto)
  if(_iaAberto){
    const msgs = document.getElementById('iaMensagensFloat')
    if(msgs && !msgs.children.length) iaLimparChat()
    setTimeout(()=>{ const t=document.getElementById('iaInputFloat'); if(t) t.focus() }, 150)
  }
}

function iaFecharFloat(){
  _iaAberto = false
  document.getElementById('iaFloatWin').classList.remove('open')
}

function iaAdicionarMensagem(papel, texto, tipo){
  const el = document.getElementById('iaMensagensFloat')
  if(!el) return
  const isUser = papel === 'user'
  const div = document.createElement('div')
  div.className = 'ia-msg ' + papel
  div.innerHTML =
    '<div class="ia-avatar">' + (isUser ? '👤' : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 100 100"><polygon points="50,6 94,76 6,76" fill="none" stroke="#C9A84C" stroke-width="9" stroke-linejoin="round"/><line x1="50" y1="6" x2="50" y2="76" stroke="#C9A84C" stroke-width="4" opacity=".45"/></svg>') + '</div>' +
    '<div class="ia-bubble ' + (tipo || papel) + '">' + escHtml(texto).replace(/\n/g,'<br>') + '</div>'
  el.appendChild(div)
  el.scrollTop = el.scrollHeight
  return div
}

function iaAdicionarLoading(){
  const el = document.getElementById('iaMensagensFloat')
  if(!el) return null
  const div = document.createElement('div')
  div.className = 'ia-msg assistant'
  div.id = 'iaLoadingMsg'
  div.innerHTML = '<div class="ia-avatar"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 100 100"><polygon points="50,6 94,76 6,76" fill="none" stroke="#C9A84C" stroke-width="9" stroke-linejoin="round"/><line x1="50" y1="6" x2="50" y2="76" stroke="#C9A84C" stroke-width="4" opacity=".45"/></svg></div><div class="ia-bubble loading">Pensando…</div>'
  el.appendChild(div)
  el.scrollTop = el.scrollHeight
  return div
}

async function iaEnviar(){
  const input = document.getElementById('iaInputFloat')
  const btn = document.getElementById('iaBtnEnviarFloat')
  const texto = (input?.value || '').trim()
  if(!texto) return

  const apiKey = window._anthropicKey || ''
  if(!apiKey){
    iaAdicionarMensagem('assistant', '⚠️ A chave de API da IA não está configurada. Acesse Configurações → Assistente IA para cadastrá-la (válido para todos os usuários).', 'error')
    return
  }

  // Adiciona mensagem do usuário
  iaAdicionarMensagem('user', texto)
  _iaMensagens.push({ role: 'user', parts: [{ text: texto }] })
  input.value = ''
  input.style.height = 'auto'
  btn.disabled = true
  btn.textContent = '...'

  const loading = iaAdicionarLoading()

  try{
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: iaContexto() }] },
          contents: _iaMensagens,
          generationConfig: { maxOutputTokens: 1500, temperature: 0.7 }
        })
      }
    )

    const data = await response.json()
    if(loading) loading.remove()

    if(!response.ok){
      const errMsg = data?.error?.message || 'Erro desconhecido'
      iaAdicionarMensagem('assistant', '⚠️ ' + errMsg, 'error')
      _iaMensagens.pop()
    } else {
      const resposta = data.candidates?.[0]?.content?.parts?.[0]?.text || '(sem resposta)'
      iaAdicionarMensagem('assistant', resposta)
      _iaMensagens.push({ role: 'model', parts: [{ text: resposta }] })
    }
  } catch(err){
    if(loading) loading.remove()
    iaAdicionarMensagem('assistant', '⚠️ Não foi possível conectar. Verifique sua internet.\n' + err.message, 'error')
    _iaMensagens.pop()
  }

  btn.disabled = false
  btn.textContent = 'Enviar'
  document.getElementById('iaMensagensFloat').scrollTop = 99999
}

function iaLimparChat(){
  _iaMensagens = []
  const el = document.getElementById('iaMensagensFloat')
  if(el) el.innerHTML = ''
  iaAdicionarMensagem('assistant',
    'Olá! Sou o assistente do ASSENT. Posso te ajudar com análises do seu negócio, dúvidas sobre o sistema ou interpretação dos seus dados.\n\nExemplos do que você pode me perguntar:\n• "Quais são meus produtos mais vendidos?"\n• "Tenho despesas vencidas?"\n• "Como funciona o relatório de DRE?"\n• "Quanto faturei esse mês?"'
  )
}

/* ══ INIT ══ */

/* ══ AGENDA ══ */
// _agendaView/_agendaFiltro/_agendaCalMes/_agendaCalAno declarados em missing.js
