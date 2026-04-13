// ═══ STATE GLOBAL — ASSENT ═══
// Todas as variáveis de dados e configuração da aplicação

// ── Dados principais (carregados do localStorage) ──
let clientes   = lsGet('clientes')
let produtos   = lsGet('produtos')
let vendas     = lsGet('vendas')
let entradas   = lsGet('entradas')
let caixas     = lsGet('caixas')
let servicos   = lsGet('servicos')
let despesas   = lsGet('despesas')
let fornecedores = lsGet('fornecedores')
let vendedores = lsGet('vendedores')
let agenda     = lsGet('agenda') || []
let agendaTipos = lsGet('agendaTipos') || []

// ── Config ──
let config = lsGetObj('config', {
  empresaNome: '',
  empresaTel: '',
  logo: '',
  moeda: 'R$',
  estoqueMin: 3
})

// ── Defaults de agenda ──
const AGENDA_TIPOS_DEFAULT = [
  { id: 'td1', nome: 'Ensaio',  cor: '#C9A84C', icone: '📷' },
  { id: 'td2', nome: 'Entrega', cor: '#4ade80', icone: '📦' },
  { id: 'td3', nome: 'Reunião', cor: '#a5b4fc', icone: '🤝' },
  { id: 'td4', nome: 'Evento',  cor: '#f87171', icone: '🎉' },
]

// ── Estado de UI ──
let itensVenda       = []
let produtoEditando  = null
let clienteEditando  = null
let servicoEditando  = null
let _itemTipo        = 'produto' // 'produto' | 'servico'
let _novoProdFoto    = ''
let _vendaSort       = 'data'
let _vendaPeriod     = 'todos'
let _dashPeriod      = 'mes'
let _chartFat        = null
let _chartProd       = null
let _stockDetailOpen = false

// ── Backup ──
let _vendasSemBackup = 0
const BACKUP_AUTO    = 10

// ── Cores de gráficos ──
const CHART_COLORS = [
  '#38bdf8','#22c55e','#a78bfa','#f59e0b',
  '#818cf8','#fb923c','#34d399','#f472b6',
  '#60a5fa','#facc15'
]
