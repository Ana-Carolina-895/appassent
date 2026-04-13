/* ═══════════════════════════════════════════════════
   ASSENT v1.2 — pages/vendas.js
   CORRIGIDO: showItemDropdown usa índice real (reduce)
   em vez de indexOf — evita bug com nomes duplicados
   ═══════════════════════════════════════════════════ */

function setItemTipo(tipo) {
  _itemTipo = tipo
  document.getElementById('toggleProduto').classList.toggle('active', tipo === 'produto')
  document.getElementById('toggleServico').classList.toggle('active', tipo === 'servico')
  document.getElementById('vendaItemLabel').textContent = 'Produto / Serviço'
  const inp = document.getElementById('vendaItemSearch')
  if (inp) {
    inp.value = ''
    inp.placeholder = tipo === 'servico' ? 'Buscar serviço…' : 'Buscar produto ou serviço…'
  }
  document.getElementById('vendaItemIdx').value = ''
  document.getElementById('vendaItemTipoHidden').value = ''
  document.getElementById('vendaQtd').placeholder = tipo === 'servico' ? '1 (horas, sessões…)' : '1'
}

/* ══ BUSCA DE ITEM NA VENDA ══ */
let _itemBlurTimer = null

function onItemSearch(q) {
  document.getElementById('vendaItemIdx').value = ''
  document.getElementById('vendaItemTipoHidden').value = ''
  showItemDropdown(q)
}

/* FIX: usa reduce com índice real — sem indexOf */
function showItemDropdown(q) {
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
        '<div class="cliente-search-item" onmousedown="selecionarItem(\'servico\',' + i + ')">'
        + '<div class="cliente-search-item-nome">' + escHtml(s.nome) + '</div>'
        + '<div class="cliente-search-item-sub">' + (s.categoria ? escHtml(s.categoria) + ' · ' : '') + brl(s.preco) + '</div>'
        + '</div>'
      ).join('')
    }
  }

  if (!html) html = '<div class="cliente-search-empty">Nenhum ' + (tipo === 'produto' ? 'produto' : tipo === 'servico' ? 'serviço' : 'item') + ' encontrado</div>'
  dd.innerHTML = html
  dd.style.display = 'block'
}

function hideItemDropdown() {
  _itemBlurTimer = setTimeout(() => {
    const dd = document.getElementById('itemSearchDropdown')
    if (dd) dd.style.display = 'none'
  }, 150)
}

function selecionarItem(tipo, idx) {
  clearTimeout(_itemBlurTimer)
  let nome, preco
  if (tipo === 'produto') { nome = produtos[idx].nome; preco = brl(produtos[idx].preco) }
  else                    { nome = servicos[idx].nome; preco = brl(servicos[idx].preco) }
  document.getElementById('vendaItemSearch').value = nome + ' — ' + preco
  document.getElementById('vendaItemIdx').value = idx
  document.getElementById('vendaItemTipoHidden').value = tipo
  document.getElementById('itemSearchDropdown').style.display = 'none'
  document.getElementById('vendaQtd').focus()
  _itemTipo = tipo
}

/* ══ ITENS VENDA ══ */
function addItemVenda() {
  const qtd  = parseInt2(document.getElementById('vendaQtd').value, 0, 1)
  const desc = clamp(document.getElementById('vendaItemDesconto').value)
  if (qtd < 1) { toast('Informe uma quantidade válida.', 'warning'); return }
  const tipo = document.getElementById('vendaItemTipoHidden').value
  const idx  = parseInt(document.getElementById('vendaItemIdx').value)
  if (!tipo || isNaN(idx)) { toast('Selecione um produto ou serviço na busca.', 'warning'); return }

  if (tipo === 'servico') {
    if (idx < 0 || idx >= servicos.length) { toast('Serviço não encontrado.', 'warning'); return }
    const s = servicos[idx]
    itensVenda.push({ tipo: 'servico', produto: s.nome, preco: s.preco, custo: s.custo || 0, qtd, desconto: desc, servicoIndex: idx })
  } else {
    if (idx < 0 || idx >= produtos.length) { toast('Produto não encontrado.', 'warning'); return }
    const p = produtos[idx]
    const jaReservado = itensVenda.filter(it => it.tipo !== 'servico' && it.produtoIndex === idx).reduce((t, it) => t + it.qtd, 0)
    if (qtd > p.estoque - jaReservado) { toast('Estoque insuficiente para "' + p.nome + '". Disponível: ' + (p.estoque - jaReservado), 'error'); return }
    itensVenda.push({ tipo: 'produto', produto: p.nome, preco: p.preco, custo: p.custo || 0, qtd, desconto: desc, produtoIndex: idx })
  }

  document.getElementById('vendaItemSearch').value = ''
  document.getElementById('vendaItemIdx').value = ''
  document.getElementById('vendaItemTipoHidden').value = ''
  document.getElementById('vendaQtd').value = ''
  document.getElementById('vendaItemDesconto').value = ''
  const ra = document.getElementById('reciboActions'); if (ra) ra.style.display = 'none'
  renderItens(); atualizarResumo()
}

function removerItem(i) { itensVenda.splice(i, 1); renderItens(); atualizarResumo() }

function renderItens() {
  document.getElementById('cntItens').textContent = itensVenda.length
  const b = document.getElementById('itensVendaBody')
  if (!itensVenda.length) {
    b.innerHTML = '<tr><td colspan="7"><div class="empty-state"><span class="empty-icon">🛒</span>Nenhum item adicionado</div></td></tr>'
    return
  }
  b.innerHTML = itensVenda.map((it, i) => {
    const bruto = it.preco * it.qtd, total = bruto - bruto * (clamp(it.desconto) / 100)
    const tipoBadge = it.tipo === 'servico'
      ? '<span class="servico-badge">🎯 Serviço</span>'
      : '<span class="badge badge-blue">📦 Produto</span>'
    return '<tr>'
      + '<td>' + escHtml(it.produto) + ' ' + tipoBadge + '</td>'
      + '<td>' + it.qtd + '</td>'
      + '<td class="td-mono">' + brl(it.preco) + '</td>'
      + '<td class="td-mono td-muted">' + brl(it.custo) + '</td>'
      + '<td>' + (it.desconto > 0 ? '<span class="badge badge-yellow">' + it.desconto + '%</span>' : '—') + '</td>'
      + '<td class="td-mono">' + brl(total) + '</td>'
      + '<td><button class="btn btn-danger btn-sm" onclick="removerItem(' + i + ')">Remover</button></td>'
      + '</tr>'
  }).join('')
}

function atualizarResumo() {
  const sb = itensVenda.reduce((t, it) => t + it.preco * it.qtd, 0)
  const sd = itensVenda.reduce((t, it) => t + it.preco * it.qtd * (clamp(it.desconto) / 100), 0)
  const sc = itensVenda.reduce((t, it) => t + (it.custo || 0) * it.qtd, 0)
  const total = sb - sd
  document.getElementById('rSubtotal').textContent = brl(sb)
  document.getElementById('rDesconto').textContent = brl(sd)
  document.getElementById('rCusto').textContent    = brl(sc)
  document.getElementById('rTotal').textContent    = brl(total)
  document.getElementById('rLucro').textContent    = brl(total - sc)
  const fp = document.getElementById('vendaFormaPgto')?.value
  if (fp === 'Sinal') atualizarRestanteSinal()
}

function finalizarVenda() {
  if (!itensVenda.length) { toast('Adicione ao menos um item.', 'warning'); return }
  for (const it of itensVenda) {
    if (it.tipo === 'servico') continue
    const p = produtos[it.produtoIndex]
    if (!p) { toast('Produto "' + it.produto + '" não encontrado.', 'error'); return }
    if (it.qtd > p.estoque) { toast('Estoque insuficiente para "' + p.nome + '". Disponível: ' + p.estoque, 'error'); return }
  }
  const sb = itensVenda.reduce((t, it) => t + it.preco * it.qtd, 0)
  const sd = itensVenda.reduce((t, it) => t + it.preco * it.qtd * (clamp(it.desconto) / 100), 0)
  const total = sb - sd
  itensVenda.forEach(it => { if (it.tipo !== 'servico' && typeof it.produtoIndex === 'number') produtos[it.produtoIndex].estoque -= it.qtd })
  const fp        = document.getElementById('vendaFormaPgto').value || ''
  const fiadoVenc = document.getElementById('vendaFiadoVenc')?.value || ''
  const obsNova   = document.getElementById('vendaNovaObs').value.trim()
  const vendedor  = document.getElementById('vendaVendedor')?.value || ''
  const isFiado   = fp === 'Fiado' || fp === 'Parcelado'
  const isSinal   = fp === 'Sinal'
  const sinalValor    = isSinal ? (parseFloat(document.getElementById('vendaSinalValor')?.value || 0) || 0) : 0
  const sinalForma    = isSinal ? (document.getElementById('vendaSinalForma')?.value || '') : ''
  const sinalVenc     = isSinal ? (document.getElementById('vendaSinalVenc')?.value || '') : ''
  const sinalRestante = isSinal ? Math.max(0, total - sinalValor) : 0
  if (isSinal && !sinalVenc)            { toast('Informe o vencimento do restante.', 'error'); return }
  if (isSinal && sinalValor <= 0)       { toast('Informe o valor do sinal.', 'error'); return }
  if (isSinal && sinalValor >= total)   { toast('O sinal não pode ser igual ou maior que o total.', 'error'); return }

  vendas.push({
    id: nextSaleId(),
    cliente: getVendaClienteNome(),
    itens: [...itensVenda],
    total,
    data: document.getElementById('vendaData').value || hoje(),
    obs: obsNova,
    formaPagamento: isSinal ? 'Sinal (' + brl(sinalValor) + ' via ' + sinalForma + ')' : fp,
    vendedor,
    fiado: isFiado || isSinal,
    fiadoVenc: isFiado ? fiadoVenc : isSinal ? sinalVenc : '',
    fiadoRecebido: false,
    fiadoDataRecebimento: null,
    sinal: isSinal ? { valor: sinalValor, forma: sinalForma, restante: sinalRestante, venc: sinalVenc } : null
  })

  /* Limpa formulário */
  itensVenda = []
  document.getElementById('vendaData').value = ''
  document.getElementById('vendaFormaPgto').value = ''
  document.getElementById('vendaNovaObs').value = ''
  const vvEl = document.getElementById('vendaVendedor');  if (vvEl) vvEl.value = ''
  const fvEl = document.getElementById('vendaFiadoVenc'); if (fvEl) fvEl.value = ''
  const fg   = document.getElementById('fgFiadoVenc');    if (fg)   fg.style.display = 'none'
  const svEl = document.getElementById('vendaSinalValor');if (svEl) svEl.value = ''
  const sfEl = document.getElementById('vendaSinalVenc'); if (sfEl) sfEl.value = ''
  const fsEl = document.getElementById('fgSinal');        if (fsEl) fsEl.style.display = 'none'
  resetVendaCliente()
  renderItens(); atualizarResumo()
  toast('✅ Venda de ' + brl(total) + ' finalizada com sucesso!')
  _vendasSemBackup++
  if (_vendasSemBackup >= BACKUP_AUTO) { _vendasSemBackup = 0; exportarDadosSilencioso() }
  const novaVenda = vendas[vendas.length - 1]
  save()
  _vendaAtual = novaVenda
  const ra = document.getElementById('reciboActions')
  if (ra) ra.style.display = 'flex'
}

/* ══ FILTRO / SORT VENDAS ══ */
function setVendaPeriod(p, btn) {
  _vendaPeriod = p
  document.querySelectorAll('#vendas .filter-btn').forEach(b => b.classList.remove('active'))
  if (btn) btn.classList.add('active')
  document.getElementById('vendaDateRangeWrap').classList.toggle('show', p === 'custom')
  renderVendas()
}

function vendasFiltradas() {
  const agora = new Date()
  return vendas.map((v, _i) => ({ ...v, _realIdx: _i })).filter(v => {
    if (_vendaPeriod === 'todos') return true
    if (!v.data) return false
    const d = new Date(v.data + 'T00:00:00')
    if (_vendaPeriod === 'hoje')   return v.data === hoje()
    if (_vendaPeriod === '7')      { const l = new Date(agora); l.setDate(l.getDate() - 6);  return d >= l }
    if (_vendaPeriod === '30')     { const l = new Date(agora); l.setDate(l.getDate() - 29); return d >= l }
    if (_vendaPeriod === 'mes')    return d.getFullYear() === agora.getFullYear() && d.getMonth() === agora.getMonth()
    if (_vendaPeriod === 'custom') {
      const de  = document.getElementById('vendaFiltDe').value
      const ate = document.getElementById('vendaFiltAte').value
      if (de  && d < new Date(de  + 'T00:00:00')) return false
      if (ate && d > new Date(ate + 'T23:59:59')) return false
      return true
    }
    return true
  })
}

function setVendaSort(tipo) {
  _vendaSort = tipo
  document.getElementById('sortDataBtn').classList.toggle('active',    tipo === 'data')
  document.getElementById('sortClienteBtn').classList.toggle('active', tipo === 'cliente')
  renderVendas()
}

function renderVendas() {
  const q = (document.getElementById('buscaVenda').value || '').toLowerCase()
  /* FIX: índice real via _realIdx anotado em vendasFiltradas() */
  let lista = vendasFiltradas()
    .map(v => ({ v, i: v._realIdx }))
    .filter(({ v }) => (v.id || '').toLowerCase().includes(q) || (v.cliente || '').toLowerCase().includes(q))
  if (_vendaSort === 'data') lista.sort((a, b) => b.v.data > a.v.data ? 1 : b.v.data < a.v.data ? -1 : 0)
  else lista.sort((a, b) => (a.v.cliente || '').localeCompare(b.v.cliente || '', 'pt-BR'))
  document.getElementById('cntVendas').textContent = lista.length
  const b = document.getElementById('vendasBody')
  if (!lista.length) {
    b.innerHTML = '<tr><td colspan="8"><div class="empty-state"><span class="empty-icon">💰</span>Nenhuma venda encontrada</div></td></tr>'
    return
  }
  b.innerHTML = lista.map(({ v, i }) => {
    const pgto = v.formaPagamento ? '<span class="pgto-badge">' + escHtml(v.formaPagamento) + '</span>' : '<span class="td-muted">—</span>'
    const vend = v.vendedor ? '<span style="font-size:12px">' + escHtml(v.vendedor) + '</span>' : '<span class="td-muted">—</span>'
    return '<tr class="tr-click" onclick="openModalVenda(vendas[' + i + '])">'
      + '<td class="td-mono"><span class="badge badge-blue">' + escHtml(v.id || '—') + '</span></td>'
      + '<td>' + escHtml(v.cliente || 'Não informado') + '</td>'
      + '<td class="td-muted">' + fmtData(v.data) + '</td>'
      + '<td>' + pgto + '</td>'
      + '<td>' + vend + '</td>'
      + '<td class="td-muted">' + (v.itens || []).length + ' item(s)</td>'
      + '<td class="td-mono">' + brl(v.total) + '</td>'
      + '<td><div class="td-actions">'
        + '<button class="btn btn-ghost btn-sm" onclick="duplicarVenda(' + i + ',event)" title="Duplicar venda">⧉</button>'
        + '<button class="btn btn-warning btn-sm" onclick="editarVenda(' + i + ',event)">Editar</button>'
        + '<button class="btn btn-danger btn-sm" onclick="excluirVenda(' + i + ',event)">Excluir</button>'
      + '</div></td>'
      + '</tr>'
  }).join('')
}

function excluirVenda(i, e) {
  e && e.stopPropagation()
  showConfirm('Cancelar a venda ' + (vendas[i].id || '#' + i) + '? O estoque será restaurado.', () => {
    const v = vendas[i]
    if (v.itens) v.itens.forEach(it => {
      if (it.tipo === 'servico') return
      const p = typeof it.produtoIndex === 'number' ? produtos[it.produtoIndex] : undefined
      if (p) p.estoque += it.qtd
    })
    vendas.splice(i, 1)
    toast('🗑️ Venda cancelada e estoque restaurado.', 'info')
    save()
  })
}

/* ══ EXPORTAÇÃO CSV/EXCEL — VENDAS ══ */
function vendasParaLinhas() {
  return [
    ['ID', 'Cliente', 'Data', 'Pagamento', 'Qtd Itens', 'Total (R$)'],
    ...vendasFiltradas().map(v => [v.id || '', v.cliente || '', v.data || '', v.formaPagamento || '', (v.itens || []).length, (v.total || 0).toFixed(2)])
  ]
}
function exportarVendasCSV() {
  const csv = vendasParaLinhas().map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\r\n')
  downloadBlob(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }), 'vendas_assent.csv')
  toast('⬇️ CSV exportado!')
}
function exportarVendasExcel() {
  if (typeof XLSX === 'undefined') { toast('Biblioteca Excel não carregada.', 'error'); return }
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(vendasParaLinhas())
  ws['!cols'] = [{ wch: 10 }, { wch: 28 }, { wch: 14 }, { wch: 16 }, { wch: 12 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, ws, 'Vendas')
  XLSX.writeFile(wb, 'vendas_assent.xlsx')
  toast('📊 Excel exportado!')
}
