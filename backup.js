/* ═══════════════════════════════════════════════════
   ASSENT v1.2 — backup.js
   Exportação, importação e restauração de dados.
   REMOVIDA daqui: toggleMobileSidebar() → main.js
   ═══════════════════════════════════════════════════ */

function isElectron() {
  return typeof window !== 'undefined' && !!window.electronAPI
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

async function exportarDados() {
  const json = JSON.stringify({ clientes, produtos, vendas, entradas, caixas, servicos, despesas, fornecedores, vendedores, config }, null, 2)
  if (isElectron()) {
    const r = await window.electronAPI.saveBackup(json)
    if (r.ok)                           toast('💾 Backup salvo em: ' + r.path)
    else if (r.ok === false && !r.path) toast('Backup cancelado.', 'info')
  } else {
    try {
      downloadBlob(new Blob([json], { type: 'application/json' }), 'assent_dados.json')
      toast('⬇️ Dados exportados com sucesso!')
    } catch (e) {
      toast('Erro ao exportar: ' + e.message, 'error')
    }
  }
}

async function restaurarBackup() {
  if (isElectron()) {
    const r = await window.electronAPI.openBackup()
    if (!r.ok) return
    _processarBackupJson(r.content)
  } else {
    document.getElementById('inputBackup').click()
  }
}

function _processarBackupJson(texto) {
  try {
    const d = JSON.parse(texto)
    if (!d.clientes || !d.produtos || !d.vendas) throw new Error('Arquivo inválido')
    showConfirm('Restaurar o backup? Os dados atuais serão substituídos.', () => {
      clientes     = d.clientes
      produtos     = d.produtos
      vendas       = d.vendas
      entradas     = d.entradas     || []
      caixas       = d.caixas       || []
      servicos     = d.servicos     || []
      despesas     = d.despesas     || []
      fornecedores = d.fornecedores || []
      vendedores   = d.vendedores   || []
      agenda       = d.agenda       || []
      agendaTipos  = d.agendaTipos  || []
      if (d.config) config = d.config

      lsSet('clientes',     clientes)
      lsSet('produtos',     produtos)
      lsSet('vendas',       vendas)
      lsSet('entradas',     entradas)
      lsSet('caixas',       caixas)
      lsSet('servicos',     servicos)
      lsSet('despesas',     despesas)
      lsSet('fornecedores', fornecedores)
      lsSet('vendedores',   vendedores)
      lsSet('agenda',       agenda)
      lsSet('agendaTipos',  agendaTipos)
      lsSet('config',       config)

      // Atualiza contador de ID de vendas com o maior número existente
      const maxId = vendas.reduce((max, v) => {
        if (!v.id || typeof v.id !== 'string') return max
        const n = parseInt(v.id.replace(/^V/i, '')) || 0
        return Math.max(max, n)
      }, 0)
      try { localStorage.setItem('saleIdCnt', String(maxId)) } catch (e) {}

      _syncFirestore() // sobe backup restaurado para Firestore imediatamente
      toast('✅ Backup restaurado com sucesso!')
      render()
    }, 'Restaurar backup', 'Restaurar', 'btn-warning')
  } catch (e) {
    toast('Arquivo inválido ou corrompido.', 'error')
  }
}

// Chamada pelo <input type="file" id="inputBackup">
function onBackupFileSelected(input) {
  const file = input.files[0]; if (!file) return
  const reader = new FileReader()
  reader.onload = e => _processarBackupJson(e.target.result)
  reader.readAsText(file)
  input.value = ''
}

function exportarDadosSilencioso() {
  // Backup automático silencioso — só na versão web (sem dialog)
  try {
    const json = JSON.stringify({ clientes, produtos, vendas, entradas, caixas, servicos, despesas, fornecedores, vendedores, config }, null, 2)
    downloadBlob(new Blob([json], { type: 'application/json' }), 'assent_autobackup_' + hoje() + '.json')
  } catch (e) {
    console.warn('Auto-backup falhou:', e.message)
  }
}

/* ══ EXPÕE GLOBAIS ══ */
window.exportarDados        = exportarDados
window.restaurarBackup      = restaurarBackup
window.onBackupFileSelected = onBackupFileSelected
window.exportarDadosSilencioso = exportarDadosSilencioso
