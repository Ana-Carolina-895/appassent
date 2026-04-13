/* ═══════════════════════════════════════════════════
   ASSENT v1.2 — main.js
   Ponto de entrada: carregado após firebase.js autenticar
   ═══════════════════════════════════════════════════ */

/* ══ MÚLTIPLAS ABAS: detecta se já tem outra aba aberta ══ */
(function () {
  const ID = Date.now() + '_' + Math.random()
  if (typeof BroadcastChannel !== 'undefined') {
    const bc = new BroadcastChannel('assent_tabs')
    bc.postMessage({ type: 'open', id: ID })
    bc.onmessage = e => {
      if (e.data.id !== ID) {
        document.getElementById('tabWarning').classList.add('show')
        if (e.data.type === 'open') bc.postMessage({ type: 'here', id: ID })
      }
    }
  }
})()

/* ══ UTILS ══ */
const brl     = v => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtCPF  = v => (!v || v.length !== 11) ? v || '—' : v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
const fmtData = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '—'
const hoje    = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') }
const escHtml = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const parseNum  = (v, fb = 0, mn = null, mx = null) => { const n = parseFloat(String(v).replace(',', '.')); if (isNaN(n) || !isFinite(n)) return fb; if (mn !== null && n < mn) return mn; if (mx !== null && n > mx) return mx; return n }
const parseInt2 = (v, fb = 0, mn = null) => { const n = parseInt(String(v), 10); if (isNaN(n)) return fb; if (mn !== null && n < mn) return mn; return n }
const clamp     = v => Math.min(100, Math.max(0, parseNum(v, 0, 0, 100)))

/* ══ TOAST ══ */
function toast(msg, type = 'success') {
  const c = document.getElementById('toastContainer')
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' }
  const t = document.createElement('div')
  t.className = 'toast ' + type
  t.innerHTML = '<span>' + icons[type] + '</span><span>' + escHtml(msg) + '</span>'
  c.appendChild(t)
  setTimeout(() => { t.style.animation = 'toast-out .25s ease forwards'; setTimeout(() => t.remove(), 260) }, 3200)
}

/* ══ CONFIRM MODAL ══ */
let _cb = null
function showConfirm(msg, cb, title, okLabel, okClass) {
  title = title || 'Confirmar'; okLabel = okLabel || 'Confirmar'; okClass = okClass || 'btn-danger'; _cb = cb
  document.getElementById('modalConfirmTitle').textContent = title
  document.getElementById('modalConfirmMsg').textContent = msg
  const ok = document.getElementById('modalConfirmOk'); ok.textContent = okLabel; ok.className = 'btn ' + okClass
  document.getElementById('modalConfirm').classList.add('open')
}
function closeConfirm(ok) {
  document.getElementById('modalConfirm').classList.remove('open')
  if (ok && _cb) _cb()
  _cb = null
}

/* ══ MODAL GENÉRICO ══ */
function openModal(id)  { document.getElementById(id)?.classList.add('open') }
function closeModal(id) { document.getElementById(id)?.classList.remove('open') }

/* ══ LOCALSTORAGE HELPERS ══ */
function lsGet(k)       { try { const v = localStorage.getItem(k); return v === null ? [] : JSON.parse(v) || [] } catch(e) { return [] } }
function lsGetObj(k, def = {}) { try { const v = localStorage.getItem(k); return v === null ? def : JSON.parse(v) || def } catch(e) { return def } }
function lsSet(k, v)    {
  try {
    localStorage.setItem(k, JSON.stringify(v))
    return true
  } catch(e) {
    if (e.name === 'QuotaExceededError') toast('Armazenamento cheio! Faça um backup.', 'error')
    else toast('Erro ao salvar: ' + e.message, 'error')
    return false
  }
}

/* ══ STATE GLOBAL ══ */
let clientes     = lsGet('clientes')
let produtos     = lsGet('produtos')
let vendas       = lsGet('vendas')
let entradas     = lsGet('entradas')
let caixas       = lsGet('caixas')
let servicos     = lsGet('servicos')
let despesas     = lsGet('despesas')
let fornecedores = lsGet('fornecedores')
let vendedores   = lsGet('vendedores')
let agenda       = lsGet('agenda') || []
let agendaTipos  = lsGet('agendaTipos') || []
let config       = lsGetObj('config', { empresaNome: '', empresaTel: '', logo: '', moeda: 'R$', estoqueMin: 3 })

const AGENDA_TIPOS_DEFAULT = [
  { id: 'td1', nome: 'Ensaio',  cor: '#C9A84C', icone: '📷' },
  { id: 'td2', nome: 'Entrega', cor: '#4ade80', icone: '📦' },
  { id: 'td3', nome: 'Reunião', cor: '#a5b4fc', icone: '🤝' },
  { id: 'td4', nome: 'Evento',  cor: '#f87171', icone: '🎉' },
]

let itensVenda       = []
let produtoEditando  = null
let clienteEditando  = null
let servicoEditando  = null
let _itemTipo        = 'produto'
let _novoProdFoto    = ''
let _vendaSort       = 'data'
let _vendaPeriod     = 'todos'
let _dashPeriod      = 'mes'
let _chartFat        = null
let _chartProd       = null
let _stockDetailOpen = false
let _vendasSemBackup = 0
const BACKUP_AUTO    = 10
const CHART_COLORS   = ['#38bdf8','#22c55e','#a78bfa','#f59e0b','#818cf8','#fb923c','#34d399','#f472b6','#60a5fa','#facc15']

/* ══ IDs DE VENDA ══ */
function nextSaleId() {
  try {
    let n = parseInt(localStorage.getItem('saleIdCnt') || '0') + 1
    localStorage.setItem('saleIdCnt', String(n))
    return 'V' + String(n).padStart(4, '0')
  } catch(e) { return 'V' + Date.now() }
}

/* ══ SYNC FIRESTORE ══ */
let _syncTimer = null
function _syncFirestoreDebounced() { clearTimeout(_syncTimer); _syncTimer = setTimeout(_syncFirestore, 1500) }
function _syncFirestore() {
  if (!window._fbUsuarioAtual) return
  const uid = window._fbUsuarioAtual.uid
  const saleIdCnt = parseInt(localStorage.getItem('saleIdCnt') || '0')
  const cfgSemLogo = { ...config, logo: config.logo ? '__has_logo__' : '' }
  const payload = {
    clientes, produtos, vendas, entradas, caixas,
    servicos, despesas, fornecedores, vendedores,
    agenda, agendaTipos,
    config: cfgSemLogo, saleIdCnt,
    updatedAt: new Date().toISOString()
  }
  window._fbSetDoc('dados', uid, payload, false)
    .catch(e => console.warn('⚠️ Firestore sync error:', e.message))
}

/* ══ SAVE: persiste tudo e re-renderiza a página ativa ══ */
function save() {
  lsSet('clientes', clientes); lsSet('produtos', produtos); lsSet('vendas', vendas)
  lsSet('entradas', entradas); lsSet('caixas', caixas);     lsSet('servicos', servicos)
  lsSet('despesas', despesas); lsSet('fornecedores', fornecedores); lsSet('vendedores', vendedores)
  lsSet('agenda', agenda);     lsSet('agendaTipos', agendaTipos)
  _syncFirestoreDebounced()

  const pagAtiva = document.querySelector('.page.active')?.id || ''
  const renderMap = {
    'page-dashboard':    renderDashboard,
    'page-clientes':     renderClientes,
    'page-produtos':     renderProdutos,
    'page-servicos':     renderServicos,
    'page-vendas':       renderVendas,
    'page-caixa':        renderCaixa,
    'page-despesas':     renderDespesas,
    'page-fornecedores': renderFornecedores,
    'page-vendedores':   renderVendedores,
    'page-fiado':        renderFiado,
    'page-agenda':       renderAgenda,
    'page-relatorios':   renderRelatorio,
  }
  if (renderMap[pagAtiva]) renderMap[pagAtiva]()
  if (pagAtiva !== 'page-dashboard') renderDashboard()
  if (['page-vendas'].includes(pagAtiva)) populateSelects()
}

/* ══ NAVEGAÇÃO ENTRE PÁGINAS ══ */
function showPage(p, btn) {
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'))
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'))
  const pageEl = document.getElementById('page-' + p)
  if (pageEl) pageEl.classList.add('active')
  if (btn) btn.classList.add('active')
  closeMobileSidebar()

  // Renderiza a página ao navegar
  const onNav = {
    dashboard:    renderDashboard,
    clientes:     renderClientes,
    produtos:     renderProdutos,
    servicos:     renderServicos,
    vendas:       () => { populateSelects(); renderVendas() },
    caixa:        renderCaixa,
    despesas:     renderDespesas,
    fornecedores: renderFornecedores,
    vendedores:   renderVendedores,
    fiado:        renderFiado,
    agenda:       renderAgenda,
    relatorios:   renderRelatorio,
    ia:           () => {},
    atalhos:      renderAtalhosPage,
    config:       loadConfigUI,
  }
  if (onNav[p]) onNav[p]()
}

/* ══ MOBILE SIDEBAR ══ */
function toggleMobileSidebar() {
  document.getElementById('sidebar').classList.toggle('open')
  document.querySelector('.mobile-overlay').classList.toggle('show')
}
function closeMobileSidebar() {
  document.getElementById('sidebar').classList.remove('open')
  document.querySelector('.mobile-overlay').classList.remove('show')
}

/* ══ RENDER INICIAL: chamada após _iniciarApp carregar os dados ══ */
function render() {
  loadCategorias()
  applyConfig()
  try {
    const t = localStorage.getItem('assent_theme') || 'dark'
    document.documentElement.setAttribute('data-theme', t)
    const btn = document.getElementById('themeToggleBtn')
    if (btn) btn.textContent = t === 'light' ? '🌙' : '☀️'
  } catch(e) {}

  // Mostra o app
  document.getElementById('app').style.display = 'flex'
  document.getElementById('loadingInicial').style.display = 'none'

  // Renderiza todas as páginas
  renderDashboard(); renderClientes(); renderProdutos(); renderServicos(); renderVendas()
  renderEntradas();  renderCaixa();    renderDespesas(); renderFornecedores()
  renderVendedores(); renderFiado();   renderAgenda();   populateSelects()

  // Alertas de estoque
  const min = config.estoqueMin !== undefined ? config.estoqueMin : 3
  const z   = produtos.filter(p => p.estoque <= 0).length
  const b2  = produtos.filter(p => p.estoque > 0 && p.estoque <= min).length
  if (z)       toast('⚠️ ' + z + ' produto(s) com estoque zerado — verifique o dashboard.', 'warning')
  else if (b2) toast('ℹ️ ' + b2 + ' produto(s) abaixo do estoque mínimo (' + min + ').', 'info')

  setTimeout(initOnboarding, 800)
}

/* ══ INICIALIZAR APP (chamada pelo firebase.js após auth) ══ */
async function _iniciarApp() {
  document.getElementById('loginLoading').style.display = 'none'
  document.getElementById('loginScreen').style.display  = 'none'

  // Carrega dados do Firestore se usuário logado
  if (window._fbUsuarioAtual) {
    try {
      const uid  = window._fbUsuarioAtual.uid
      const snap = await window._fbGetDoc('dados', uid)
      if (snap.exists()) {
        const d = snap.data()
        clientes     = d.clientes     || []
        produtos     = d.produtos     || []
        vendas       = d.vendas       || []
        entradas     = d.entradas     || []
        caixas       = d.caixas       || []
        servicos     = d.servicos     || []
        despesas     = d.despesas     || []
        fornecedores = d.fornecedores || []
        vendedores   = d.vendedores   || []
        agenda       = d.agenda       || []
        agendaTipos  = d.agendaTipos  || []
        if (d.config) {
          const logoLocal = lsGetObj('config', {}).logo || ''
          config = { ...d.config, logo: d.config.logo === '__has_logo__' ? logoLocal : d.config.logo || '' }
        }
        if (d.saleIdCnt) localStorage.setItem('saleIdCnt', String(d.saleIdCnt))
        console.log('✅ Dados carregados do Firestore')
      } else {
        console.log('ℹ️ Sem dados no Firestore — usando localStorage como base')
        _syncFirestore()
      }
    } catch(e) {
      console.warn('⚠️ Falha ao carregar do Firestore, usando localStorage:', e.message)
    }
  }

  render()
}

/* ══ AUTH ══ */
function loginComEmail() {
  const email = document.getElementById('loginEmail').value.trim()
  const senha = document.getElementById('loginSenha').value
  const msg   = document.getElementById('loginMsg')
  if (!email || !senha) { msg.className = 'login-msg error'; msg.textContent = 'Preencha e-mail e senha.'; return }
  msg.className = 'login-msg'; msg.textContent = 'Entrando…'
  window._fbSignInEmail(email, senha).catch(e => {
    msg.className = 'login-msg error'
    if (e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password' || e.code === 'auth/user-not-found')
      msg.textContent = 'E-mail ou senha incorretos.'
    else if (e.code === 'auth/too-many-requests')
      msg.textContent = 'Muitas tentativas. Aguarde alguns minutos.'
    else
      msg.textContent = 'Erro: ' + e.message
  })
}

function loginComGoogle() {
  const msg = document.getElementById('loginMsg')
  msg.className = 'login-msg'; msg.textContent = 'Abrindo Google…'
  window._fbSignInGoogle().catch(e => {
    msg.className = 'login-msg error'
    if (e.code === 'auth/popup-closed-by-user') msg.textContent = 'Login cancelado.'
    else msg.textContent = 'Erro: ' + e.message
  })
}

function fazerLogout() {
  window._fbSignOut().then(() => {
    document.getElementById('loginScreen').style.display = 'flex'
    document.getElementById('app').style.display = 'none'
    document.getElementById('loginMsg').textContent = ''
  })
}

function _mostrarErroLicenca(user, mensagem) {
  const msg = mensagem || 'Sua licença não está ativa. Entre em contato com o suporte.'
  document.getElementById('loginLoading').style.display = 'none'
  document.getElementById('loginScreen').style.display  = 'flex'
}

/* ══ EXPOSE GLOBAL (para onclick inline no HTML) ══ */
window._iniciarApp         = _iniciarApp
window.showPage            = showPage
window.showConfirm         = showConfirm
window.closeConfirm        = closeConfirm
window.openModal           = openModal
window.closeModal          = closeModal
window.toast               = toast
window.save                = save
window.toggleMobileSidebar = toggleMobileSidebar
window.closeMobileSidebar  = closeMobileSidebar
window.loginComEmail       = loginComEmail
window.loginComGoogle      = loginComGoogle
window.fazerLogout         = fazerLogout
