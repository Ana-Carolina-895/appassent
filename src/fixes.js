/* ═══════════════════════════════════════════════════
   ASSENT — fixes.js
   Correções sobre o código original:
   1. Bug: produto/serviço com mesmo nome de categoria sumia no dropdown de vendas
   2. Bug: indexOf frágil quando há nomes duplicados (usa índice direto agora)
   ═══════════════════════════════════════════════════ */

// ── SUBSTITUIR showItemDropdown no main.js / pages/vendas.js ──
function showItemDropdown(q) {
  const rawQ = q !== undefined ? q : document.getElementById('vendaItemSearch').value
  const dd   = document.getElementById('itemSearchDropdown')
  const ql   = rawQ.toLowerCase().trim()
  const isSearch = ql.length > 0
  let html = ''

  // ── Produtos: filtra APENAS por nome (não por categoria)
  const rprod = isSearch
    ? produtos.reduce((acc, p, i) => { if (p.nome.toLowerCase().includes(ql)) acc.push({ p, i }); return acc }, []).slice(0, 8)
    : produtos.map((p, i) => ({ p, i })).slice(0, 12)

  if (rprod.length) {
    html += '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--text-muted);padding:8px 12px 2px">📦 Produtos</div>'
    html += rprod.map(({ p, i }) => {
      const min = config.estoqueMin || 3
      const estoqBadge = p.estoque <= 0
        ? '<span style="color:var(--red);font-size:11px"> · Sem estoque</span>'
        : p.estoque <= min ? '<span style="color:var(--yellow);font-size:11px"> · Baixo (' + p.estoque + ')</span>' : ''
      return '<div class="cliente-search-item" onmousedown="selecionarItem(\'produto\',' + i + ')">'
        + '<div class="cliente-search-item-nome">'
        + (p.foto ? '<img src="' + p.foto + '" style="width:18px;height:18px;border-radius:3px;object-fit:cover;vertical-align:middle;margin-right:4px">' : '')
        + escHtml(p.nome) + estoqBadge + '</div>'
        + '<div class="cliente-search-item-sub">' + brl(p.preco) + ' · Estoque: ' + p.estoque + '</div>'
        + '</div>'
    }).join('')
    if (!isSearch && produtos.length > 12)
      html += '<div style="padding:6px 14px;font-size:11px;color:var(--text-muted)">…e mais ' + (produtos.length - 12) + ' produto(s). Digite para filtrar.</div>'
  }

  // ── Serviços: filtra por nome E categoria — mas o índice é sempre o real
  // FIX: usar reduce com índice real em vez de indexOf (evita bug com nomes duplicados)
  const rsvc = isSearch
    ? servicos.reduce((acc, s, i) => {
        // FIX: filtra por nome OU categoria, mas só mostra se o NOME bate com a busca OU
        // se a categoria bate MAS o nome também é relevante (evita falso positivo)
        const nomeMatch = s.nome.toLowerCase().includes(ql)
        const catMatch  = (s.categoria || '').toLowerCase().includes(ql)
        // Só inclui por categoria se o nome NÃO bate com nenhum produto existente
        const evitarConflito = catMatch && !nomeMatch
          ? !produtos.some(p => p.nome.toLowerCase() === ql)
          : true
        if ((nomeMatch || catMatch) && evitarConflito) acc.push({ s, i })
        return acc
      }, []).slice(0, 4)
    : servicos.map((s, i) => ({ s, i })).slice(0, 6)

  if (rsvc.length) {
    html += '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--text-muted);padding:8px 12px 2px">🎯 Serviços</div>'
    html += rsvc.map(({ s, i }) => {
      return '<div class="cliente-search-item" onmousedown="selecionarItem(\'servico\',' + i + ')">'
        + '<div class="cliente-search-item-nome">' + escHtml(s.nome) + '</div>'
        + '<div class="cliente-search-item-sub">' + (s.categoria ? escHtml(s.categoria) + ' · ' : '') + brl(s.preco) + '</div>'
        + '</div>'
    }).join('')
  }

  if (!html) html = '<div class="cliente-search-empty">Nenhum produto ou serviço encontrado</div>'
  dd.innerHTML = html
  dd.style.display = 'block'
}

// ── SUBSTITUIR showGlobalDropdown: mesma correção de índice real ──
function showGlobalDropdown(q) {
  q = q || document.getElementById('globalSearch').value
  const dd = document.getElementById('globalDropdown')
  if (!q || q.length < 2) { dd.style.display = 'none'; return }
  const ql = q.toLowerCase()
  let html = ''

  // Clientes — índice real via reduce
  const rcl = clientes.reduce((acc, c, i) => {
    if (c.nome.toLowerCase().includes(ql) || (c.cpf || '').includes(ql) || (c.telefone || '').includes(ql))
      acc.push({ c, i })
    return acc
  }, []).slice(0, 4)
  if (rcl.length) {
    html += '<div class="gs-group-label">👥 Clientes</div>'
    html += rcl.map(({ c, i }) =>
      '<div class="gs-item" onclick="goToCliente(' + i + ')">'
      + '<span class="gs-item-icon">👤</span>'
      + '<div class="gs-item-main"><div class="gs-item-name">' + escHtml(c.nome) + '</div>'
      + '<div class="gs-item-sub">' + (c.telefone || '') + (c.cpf ? ' · ' + fmtCPF(c.cpf) : '') + '</div></div>'
      + '</div>'
    ).join('')
  }

  // Produtos — índice real, filtra SÓ por nome
  const rprod = produtos.reduce((acc, p, i) => {
    if (p.nome.toLowerCase().includes(ql)) acc.push({ p, i })
    return acc
  }, []).slice(0, 4)
  if (rprod.length) {
    html += '<div class="gs-group-label">📦 Produtos</div>'
    html += rprod.map(({ p, i }) => {
      const min = config.estoqueMin !== undefined ? config.estoqueMin : 3
      const estoqBadge = p.estoque <= 0
        ? '<span style="color:var(--red);font-size:11px">⚠ Zerado</span>'
        : p.estoque <= min ? '<span style="color:var(--yellow);font-size:11px">⚠ Baixo</span>' : ''
      return '<div class="gs-item" onclick="goToProduto(' + i + ')">'
        + '<span class="gs-item-icon">' + (p.foto ? '<img src="' + p.foto + '" style="width:20px;height:20px;border-radius:4px;object-fit:cover">' : '📦') + '</span>'
        + '<div class="gs-item-main"><div class="gs-item-name">' + escHtml(p.nome) + ' ' + estoqBadge + '</div>'
        + '<div class="gs-item-sub">' + brl(p.preco) + ' · Estoque: ' + p.estoque + '</div></div>'
        + '</div>'
    }).join('')
  }

  // Serviços — índice real, filtro seguro
  const rsvc = servicos.reduce((acc, s, i) => {
    if (s.nome.toLowerCase().includes(ql) || (s.categoria || '').toLowerCase().includes(ql))
      acc.push({ s, i })
    return acc
  }, []).slice(0, 3)
  if (rsvc.length) {
    html += '<div class="gs-group-label">🎯 Serviços</div>'
    html += rsvc.map(({ s, i }) =>
      '<div class="gs-item" onclick="goToServicos()">'
      + '<span class="gs-item-icon">🎯</span>'
      + '<div class="gs-item-main"><div class="gs-item-name">' + escHtml(s.nome) + '</div>'
      + '<div class="gs-item-sub">' + (s.categoria ? escHtml(s.categoria) + ' · ' : '') + brl(s.preco) + '</div></div>'
      + '</div>'
    ).join('')
  }

  // Vendas — índice real
  const rvnd = vendas.reduce((acc, v, i) => {
    if ((v.id || '').toLowerCase().includes(ql) || (v.cliente || '').toLowerCase().includes(ql))
      acc.push({ v, i })
    return acc
  }, []).slice(0, 4)
  if (rvnd.length) {
    html += '<div class="gs-group-label">💰 Vendas</div>'
    html += rvnd.map(({ v, i }) =>
      '<div class="gs-item" onclick="goToVenda(' + i + ')">'
      + '<span class="gs-item-icon">🛒</span>'
      + '<div class="gs-item-main"><div class="gs-item-name">' + escHtml(v.id || '—') + ' — ' + escHtml(v.cliente || '') + '</div>'
      + '<div class="gs-item-sub">' + fmtData(v.data) + ' · ' + brl(v.total) + '</div></div>'
      + '</div>'
    ).join('')
  }

  if (!html) html = '<div class="gs-empty">Nenhum resultado para "' + escHtml(q) + '"</div>'
  dd.innerHTML = html
  dd.style.display = 'block'
}

/* ═══════════════════════════════════════════════════
   FIX 2 — Alerta de despesas com contagem exata de dias
   Substitui: "X vence(m) em até 3 dias"
   Por: lista detalhada por dia (vence hoje, amanhã, em 2 dias, em 3 dias)
   ═══════════════════════════════════════════════════ */

function renderDespesasAlert() {
  const hj    = hoje()
  const em3   = new Date(); em3.setDate(em3.getDate() + 3)
  const em3str = em3.toISOString().split('T')[0]

  const vencidas = despesas.filter(d => !d.paga && d.venc < hj)
  const urgentes = despesas.filter(d => !d.paga && d.venc >= hj && d.venc <= em3str)

  const al  = document.getElementById('despesasAlert')
  const txt = document.getElementById('despesasAlertText')
  if (!al || !txt) return

  if (!vencidas.length && !urgentes.length) { al.style.display = 'none'; return }
  al.style.display = 'block'

  const partes = []

  // Vencidas
  if (vencidas.length)
    partes.push(vencidas.length + ' despesa(s) vencida(s) — ' + brl(vencidas.reduce((t, d) => t + d.valor, 0)))

  // Urgentes: agrupa por número exato de dias
  if (urgentes.length) {
    // Calcula dias até vencimento para cada despesa
    const porDia = { 0: [], 1: [], 2: [], 3: [] }
    urgentes.forEach(d => {
      const diff = Math.round((new Date(d.venc + 'T00:00:00') - new Date(hj + 'T00:00:00')) / 86400000)
      if (porDia[diff]) porDia[diff].push(d)
    })

    const labelDia = { 0: 'vence hoje', 1: 'vence amanhã', 2: 'vence em 2 dias', 3: 'vence em 3 dias' }

    // Monta a mensagem ordenada do mais urgente ao menos urgente
    ;[0, 1, 2, 3].forEach(d => {
      if (porDia[d].length) {
        const total = brl(porDia[d].reduce((t, x) => t + x.valor, 0))
        partes.push(porDia[d].length + ' ' + labelDia[d] + ' (' + total + ')')
      }
    })
  }

  txt.textContent = partes.join(' · ')
}

// Mesma correção para o alerta de fiado
function renderFiadoAlert() {
  const hj    = hoje()
  const em3   = new Date(); em3.setDate(em3.getDate() + 3)
  const em3str = em3.toISOString().split('T')[0]

  const vencidas = vendas.filter(v => v.fiado && !v.fiadoRecebido && v.fiadoVenc && v.fiadoVenc < hj)
  const urgentes = vendas.filter(v => v.fiado && !v.fiadoRecebido && v.fiadoVenc && v.fiadoVenc >= hj && v.fiadoVenc <= em3str)

  const al  = document.getElementById('fiadoAlert')
  const txt = document.getElementById('fiadoAlertText')
  if (!al || !txt) return

  if (!vencidas.length && !urgentes.length) { al.style.display = 'none'; return }
  al.style.display = 'block'

  const partes = []

  if (vencidas.length)
    partes.push(vencidas.length + ' fiado(s) vencido(s) — ' + brl(vencidas.reduce((t, v) => t + (v.total || 0), 0)))

  if (urgentes.length) {
    const porDia = { 0: [], 1: [], 2: [], 3: [] }
    urgentes.forEach(v => {
      const diff = Math.round((new Date(v.fiadoVenc + 'T00:00:00') - new Date(hj + 'T00:00:00')) / 86400000)
      if (porDia[diff]) porDia[diff].push(v)
    })

    const labelDia = { 0: 'vence hoje', 1: 'vence amanhã', 2: 'vence em 2 dias', 3: 'vence em 3 dias' }

    ;[0, 1, 2, 3].forEach(d => {
      if (porDia[d].length) {
        const total = brl(porDia[d].reduce((t, x) => t + (x.total || 0), 0))
        partes.push(porDia[d].length + ' ' + labelDia[d] + ' (' + total + ')')
      }
    })
  }

  txt.textContent = '📒 ' + partes.join(' · ')
}

/* ═══════════════════════════════════════════════════
   FIX 3 — Agenda: clicar no card abre o modal (remove olhinho)
   ═══════════════════════════════════════════════════ */

function _renderEventoCard(e) {
  const tipo = _agendaTipoPorId(e.tipo)
  // Card inteiro é clicável — remove o botão 👁️
  return '<div class="ag-card' + (e.concluido ? ' ag-card-concluido' : '') + '" ' +
    'style="cursor:pointer" onclick="openModalDetEvento(\'' + e.id + '\')">' +
    '<div class="ag-card-left">' +
      '<span class="ag-tipo-badge" style="background:' + tipo.cor + '22;color:' + tipo.cor + ';border:1px solid ' + tipo.cor + '44">' + tipo.icone + ' ' + escHtml(tipo.nome) + '</span>' +
      (e.hora ? '<span class="ag-hora">🕐 ' + e.hora + '</span>' : '') +
    '</div>' +
    '<div class="ag-card-body">' +
      '<div class="ag-card-titulo">' + escHtml(e.titulo) + '</div>' +
      '<div class="ag-card-meta">' +
        (e.clienteNome ? '<span>👤 ' + escHtml(e.clienteNome) + '</span>' : '') +
        (e.vendedorNome ? '<span>💼 ' + escHtml(e.vendedorNome) + '</span>' : '') +
        (e.vendaId ? '<span>🧾 ' + escHtml(e.vendaId) + '</span>' : '') +
        (e.obs ? '<span class="ag-obs">📝 ' + escHtml(e.obs) + '</span>' : '') +
      '</div>' +
    '</div>' +
    // Mantém só concluir, editar e excluir — para os botões sem propagar o click do card
    '<div class="ag-card-actions" onclick="event.stopPropagation()">' +
      '<button class="btn btn-ghost btn-sm" onclick="toggleEventoConcluido(\'' + e.id + '\')" title="' + (e.concluido ? 'Reabrir' : 'Concluir') + '">' + (e.concluido ? '↩️' : '✅') + '</button>' +
      '<button class="btn btn-ghost btn-sm" onclick="openModalEditarEvento(\'' + e.id + '\')" title="Editar">✏️</button>' +
      '<button class="btn btn-ghost btn-sm" onclick="excluirEvento(\'' + e.id + '\')" title="Excluir">🗑️</button>' +
    '</div>' +
  '</div>'
}

/* ═══════════════════════════════════════════════════
   FIX 4 — Vendas: dropdown respeita o tipo selecionado (produto ou serviço)
   ═══════════════════════════════════════════════════ */

// Sobrescreve showItemDropdown para filtrar por _itemTipo
;(function() {
  const _origShow = window.showItemDropdown || showItemDropdown
  window.showItemDropdown = function showItemDropdown(q) {
    const rawQ = q !== undefined ? q : document.getElementById('vendaItemSearch').value
    const dd   = document.getElementById('itemSearchDropdown')
    const ql   = rawQ.toLowerCase().trim()
    const isSearch = ql.length > 0
    const tipo = _itemTipo || 'produto'
    let html = ''

    if (tipo === 'produto' || tipo === 'ambos') {
      const rprod = isSearch
        ? produtos.reduce((acc, p, i) => { if (p.nome.toLowerCase().includes(ql)) acc.push({ p, i }); return acc }, []).slice(0, 8)
        : produtos.map((p, i) => ({ p, i })).slice(0, 12)

      if (rprod.length) {
        html += '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--text-muted);padding:8px 12px 2px">📦 Produtos</div>'
        html += rprod.map(({ p, i }) => {
          const min = config.estoqueMin || 3
          const estoqBadge = p.estoque <= 0
            ? '<span style="color:var(--red);font-size:11px"> · Sem estoque</span>'
            : p.estoque <= min ? '<span style="color:var(--yellow);font-size:11px"> · Baixo (' + p.estoque + ')</span>' : ''
          return '<div class="cliente-search-item" onmousedown="selecionarItem(\'produto\',' + i + ')">' +
            '<div class="cliente-search-item-nome">' +
            (p.foto ? '<img src="' + p.foto + '" style="width:18px;height:18px;border-radius:3px;object-fit:cover;vertical-align:middle;margin-right:4px">' : '') +
            escHtml(p.nome) + estoqBadge + '</div>' +
            '<div class="cliente-search-item-sub">' + brl(p.preco) + ' · Estoque: ' + p.estoque + '</div>' +
            '</div>'
        }).join('')
        if (!isSearch && produtos.length > 12)
          html += '<div style="padding:6px 14px;font-size:11px;color:var(--text-muted)">…e mais ' + (produtos.length - 12) + ' produto(s). Digite para filtrar.</div>'
      }
    }

    if (tipo === 'servico' || tipo === 'ambos') {
      const rsvc = isSearch
        ? servicos.reduce((acc, s, i) => {
            if (s.nome.toLowerCase().includes(ql)) acc.push({ s, i })
            return acc
          }, []).slice(0, 4)
        : servicos.map((s, i) => ({ s, i })).slice(0, 6)

      if (rsvc.length) {
        html += '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--text-muted);padding:8px 12px 2px">🎯 Serviços</div>'
        html += rsvc.map(({ s, i }) =>
          '<div class="cliente-search-item" onmousedown="selecionarItem(\'servico\',' + i + ')">' +
          '<div class="cliente-search-item-nome">' + escHtml(s.nome) + '</div>' +
          '<div class="cliente-search-item-sub">' + (s.categoria ? escHtml(s.categoria) + ' · ' : '') + brl(s.preco) + '</div>' +
          '</div>'
        ).join('')
      }
    }

    if (!html) html = '<div class="cliente-search-empty">Nenhum ' + (tipo === 'produto' ? 'produto' : tipo === 'servico' ? 'serviço' : 'item') + ' encontrado</div>'
    dd.innerHTML = html
    dd.style.display = 'block'
  }
})()

/* ═══════════════════════════════════════════════════
   FIX 5 — Histórico do cliente: botão imprimir
   ═══════════════════════════════════════════════════ */

function imprimirHistoricoCliente() {
  const nome    = document.getElementById('chNome').textContent
  const sub     = document.getElementById('chSub').textContent
  const cards   = document.getElementById('chCards').innerText
  const lista   = document.getElementById('chLista')

  // Monta linhas da tabela de compras
  const vv = vendasDoCliente(_chClienteNome, _chPeriod)
  const linhas = vv.map(v => {
    const itens = (v.itens || []).map(it => escHtml(it.produto) + (it.qtd > 1 ? ' ×' + it.qtd : '')).join(', ')
    return `<tr>
      <td>${escHtml(v.id || '—')}</td>
      <td>${fmtData(v.data)}</td>
      <td>${escHtml(v.formaPagamento || '—')}</td>
      <td>${escHtml(itens)}</td>
      <td style="text-align:right;font-weight:600">${brl(v.total)}</td>
    </tr>`
  }).join('')

  const totalGasto = brl(vv.reduce((t, v) => t + (v.total || 0), 0))

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>Histórico — ${escHtml(nome)}</title>
  <style>
    body{font-family:Arial,sans-serif;font-size:13px;color:#111;padding:28px;max-width:700px;margin:0 auto}
    h1{font-size:20px;margin:0 0 4px}
    .sub{color:#666;font-size:12px;margin-bottom:20px}
    table{width:100%;border-collapse:collapse;margin-top:16px}
    th{background:#f3f3f3;text-align:left;padding:8px 10px;font-size:11px;text-transform:uppercase;letter-spacing:.06em;border-bottom:2px solid #ddd}
    td{padding:8px 10px;border-bottom:1px solid #eee;vertical-align:top}
    .total{margin-top:12px;text-align:right;font-weight:700;font-size:15px}
    @media print{body{padding:0}}
  </style></head><body>
  <h1>📋 Histórico de compras</h1>
  <div class="sub">${escHtml(nome)} · ${escHtml(sub)}</div>
  <table>
    <thead><tr><th>#</th><th>Data</th><th>Pagamento</th><th>Itens</th><th>Total</th></tr></thead>
    <tbody>${linhas || '<tr><td colspan="5" style="text-align:center;color:#999">Nenhuma compra no período</td></tr>'}</tbody>
  </table>
  <div class="total">Total: ${totalGasto} em ${vv.length} compra(s)</div>
  <script>window.onload=()=>window.print()<\/script>
  </body></html>`

  const w = window.open('', '_blank')
  if (w) { w.document.write(html); w.document.close() }
}

window.imprimirHistoricoCliente = imprimirHistoricoCliente

/* ═══════════════════════════════════════════════════
   FIX 6 — Remove chat IA flutuante e item "Assistente IA" das configurações
   ═══════════════════════════════════════════════════ */

;(function removerIA() {
  function esconderIA() {
    // Chat flutuante
    const float = document.getElementById('iaFloat') || document.getElementById('iaFloatBtn') || document.querySelector('.ia-float')
    if (float) float.style.display = 'none'

    // Botão flutuante de IA
    document.querySelectorAll('[onclick*="iaToggle"], [onclick*="iaFloat"], .ia-float-btn').forEach(el => el.style.display = 'none')

    // Item "Assistente IA" nas configurações
    document.querySelectorAll('[data-section="ia"], #cfgIaSection, #iaKeySection, .cfg-ia-section').forEach(el => el.style.display = 'none')

    // Linha de configuração da API Key da IA
    document.querySelectorAll('label, div').forEach(el => {
      if (el.textContent.includes('Anthropic') && el.textContent.includes('Key') && el.closest('.form-group')) {
        el.closest('.form-group').style.display = 'none'
      }
    })
  }

  // Executa após render
  const origRender = window.render
  window.render = function(...args) {
    origRender?.apply(this, args)
    setTimeout(esconderIA, 100)
  }

  // Também executa ao navegar para config
  const origShowPage = window.showPage
  window.showPage = function(p, btn) {
    origShowPage?.apply(this, [p, btn])
    if (p === 'config' || p === 'ia') setTimeout(esconderIA, 100)
  }
})()
