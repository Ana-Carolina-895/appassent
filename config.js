/* ═══════════════════════════════════════════════════
   ASSENT v1.2 — config.js
   Funções exclusivas de configuração, UI e alertas.
   REMOVIDAS daqui (existem em main.js):
     - _syncFirestore()  → main.js (versão canônica)
     - showPage()        → main.js (usa prefix 'page-' correto)
   ═══════════════════════════════════════════════════ */

function saveConfig() {
  config.empresaNome = document.getElementById('cfgEmpresaNome').value.trim()
  config.empresaTel  = document.getElementById('cfgEmpresaTel').value.trim()
  config.moeda       = document.getElementById('cfgMoeda').value
  config.estoqueMin  = parseInt2(document.getElementById('cfgEstoqueMin').value, 3, 0)
  config.githubRepo  = undefined // campo removido — repo fixo internamente
  lsSet('config', config)
  _syncFirestoreDebounced()
  applyConfig()
  renderStockAlert()
  renderProdutos()
}

function applyConfig() {
  const tEmpresa = document.getElementById('topbarEmpresa')
  const tLogo    = document.getElementById('topbarLogo')
  const tNome    = document.getElementById('topbarNome')
  if (config.empresaNome) {
    if (tEmpresa) tEmpresa.style.display = 'flex'
    if (tNome)    tNome.textContent = config.empresaNome
    if (tLogo) {
      if (config.logo) { tLogo.src = config.logo; tLogo.style.display = 'block' }
      else tLogo.style.display = 'none'
    }
  } else {
    if (tEmpresa) tEmpresa.style.display = 'none'
  }
  // Sidebar
  const sNome = document.getElementById('sidebarNome')
  const sLogo = document.getElementById('sidebarLogo')
  if (sNome && config.empresaNome) sNome.textContent = config.empresaNome
  if (sLogo) {
    if (config.logo) sLogo.innerHTML = '<img src="' + config.logo + '" style="width:32px;height:32px;border-radius:6px;object-fit:cover">'
    else sLogo.innerHTML = ''
  }
  // Logo preview na página de config
  const preview = document.getElementById('logoPreview')
  if (preview) {
    if (config.logo) preview.innerHTML = '<img src="' + config.logo + '" alt="Logo">'
    else             preview.innerHTML = '<span class="logo-placeholder">🏢</span>'
  }
}

function loadConfigUI() {
  const el = id => document.getElementById(id)
  if (el('cfgEmpresaNome')) el('cfgEmpresaNome').value = config.empresaNome || ''
  if (el('cfgEmpresaTel'))  el('cfgEmpresaTel').value  = config.empresaTel  || ''
  if (el('cfgMoeda'))       el('cfgMoeda').value        = config.moeda       || 'R$'
  if (el('cfgEstoqueMin'))  el('cfgEstoqueMin').value   = config.estoqueMin  !== undefined ? config.estoqueMin : 3

  // Status IA (função pode não existir se IA foi removida — guard)
  if (typeof _atualizarStatusIaKey === 'function') _atualizarStatusIaKey()

  applyConfig()

  // Lista de alertas de estoque
  const min     = config.estoqueMin !== undefined ? config.estoqueMin : 3
  const alertas = produtos.filter(p => p.estoque <= min)
  const listEl  = el('cfgEstoqueAlertaList')
  if (listEl) {
    if (!alertas.length) {
      listEl.innerHTML = '<div style="font-size:13px;color:var(--green)">✅ Nenhum produto abaixo do estoque mínimo.</div>'
    } else {
      listEl.innerHTML = alertas.map(p => {
        const zero = p.estoque <= 0
        return '<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--surface3);border:1px solid ' + (zero ? 'var(--red)' : 'var(--yellow)') + ';border-radius:var(--radius)">'
          + '<span style="font-size:16px">' + (zero ? '🔴' : '⚠️') + '</span>'
          + '<span style="flex:1;font-size:13px">' + escHtml(p.nome) + '</span>'
          + '<span class="badge ' + (zero ? 'badge-red' : 'badge-yellow') + '">' + p.estoque + ' un.</span>'
          + '</div>'
      }).join('')
    }
  }
}

function handleLogoUpload(input) {
  const file = input.files[0]; if (!file) return
  if (file.size > 512000) { toast('Imagem muito grande. Máx. 500kb.', 'error'); return }
  const r = new FileReader()
  r.onload = function () {
    config.logo = r.result
    lsSet('config', config)
    applyConfig()
    loadConfigUI()
  }
  r.readAsDataURL(file)
  input.value = ''
}

function removerLogo() {
  config.logo = ''
  lsSet('config', config)
  applyConfig()
  loadConfigUI()
  toast('Logo removida.', 'info')
}

function populateSelects() {
  // Entrada de estoque: rebuild mantendo seleção atual
  const entProd = document.getElementById('entradaProduto')
  if (entProd) {
    const idxSel = entProd.value
    entProd.innerHTML = produtos.length
      ? produtos.map((p, i) => '<option value="' + i + '">' + escHtml(p.nome) + ' (estoque: ' + p.estoque + ')</option>').join('')
      : '<option value="">— Nenhum produto —</option>'
    if (idxSel !== '') entProd.value = idxSel
    atualizarPreviewEntrada()
  }

  // Vendedor select na venda
  const vs = document.getElementById('vendaVendedor')
  if (vs) {
    const prev = vs.value
    vs.innerHTML = '<option value="">— Nenhum / Não informado —</option>'
      + vendedores.map(v => '<option value="' + escHtml(v.nome) + '">' + escHtml(v.nome) + (v.comissao ? ' (' + v.comissao + '%)' : '') + '</option>').join('')
    if (prev) vs.value = prev
  }

  // Fornecedor na entrada
  const ef = document.getElementById('entradaFornecedor')
  if (ef) {
    const prev = ef.value
    ef.innerHTML = '<option value="">— Nenhum —</option>'
      + fornecedores.map(f => '<option value="' + escHtml(f.nome) + '">' + escHtml(f.nome) + '</option>').join('')
    if (prev) ef.value = prev
  }

  // Fornecedor no modal editar despesa
  const fs = document.getElementById('edFornecedor')
  if (fs) {
    const prev = fs.value
    fs.innerHTML = '<option value="">— Nenhum —</option>'
      + fornecedores.map(f => '<option value="' + escHtml(f.nome) + '">' + escHtml(f.nome) + '</option>').join('')
    if (prev) fs.value = prev
  }

  // Fornecedor no modal nova despesa
  const fd = document.getElementById('despesaFornecedor')
  if (fd) {
    const prev = fd.value
    fd.innerHTML = '<option value="">— Nenhum —</option>'
      + fornecedores.map(f => '<option value="' + escHtml(f.nome) + '">' + escHtml(f.nome) + '</option>').join('')
    if (prev) fd.value = prev
  }
}

/* ══ STOCK ALERT ══ */
function renderStockAlert() {
  const min    = config.estoqueMin !== undefined ? config.estoqueMin : 3
  const zerados = produtos.filter(p => p.estoque <= 0)
  const baixos  = produtos.filter(p => p.estoque > 0 && p.estoque <= min)
  const total   = zerados.length + baixos.length
  const el      = document.getElementById('stockAlert')
  if (!el) return
  if (!total) { el.style.display = 'none'; return }
  el.style.display = 'block'

  const txtEl = document.getElementById('stockAlertText')
  if (txtEl) {
    txtEl.textContent = zerados.length && baixos.length
      ? zerados.length + ' zerado(s) e ' + baixos.length + ' abaixo do mínimo (' + min + ')'
      : zerados.length
        ? zerados.length + ' produto(s) com estoque zerado'
        : baixos.length + ' produto(s) abaixo do mínimo (' + min + ')'
  }

  const cntEl = document.getElementById('stockAlertCount')
  if (cntEl) cntEl.textContent = total + ' produto' + (total > 1 ? 's' : '')

  const detail = document.getElementById('stockAlertDetail')
  if (detail) {
    detail.innerHTML =
      zerados.map(p => '<span class="stock-tag zero">🔴 ' + escHtml(p.nome) + '</span>').join('') +
      baixos.map(p  => '<span class="stock-tag low">⚠️ '  + escHtml(p.nome) + ' (' + p.estoque + '/' + min + ')</span>').join('')
    if (_stockDetailOpen) detail.classList.add('open')
  }
}

function toggleStockDetail() {
  _stockDetailOpen = !_stockDetailOpen
  const detail  = document.getElementById('stockAlertDetail')
  const chevron = document.getElementById('stockAlertChevron')
  if (detail)  detail.classList.toggle('open', _stockDetailOpen)
  if (chevron) chevron.textContent = _stockDetailOpen ? '▲' : '▼'
}

/* ══ EXPÕE GLOBAIS necessários para onclick inline ══ */
window.saveConfig        = saveConfig
window.applyConfig       = applyConfig
window.loadConfigUI      = loadConfigUI
window.handleLogoUpload  = handleLogoUpload
window.removerLogo       = removerLogo
window.populateSelects   = populateSelects
window.renderStockAlert  = renderStockAlert
window.toggleStockDetail = toggleStockDetail
