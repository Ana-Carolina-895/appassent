/* ═══════════════════════════════════════════════════
   ASSENT — modal-cadastros.js
   Patch: fecha os modais de cadastro após salvar com sucesso,
   e expõe os botões de abertura via window.*
   ═══════════════════════════════════════════════════ */

// ── Wraps das funções add* para fechar o modal após sucesso ──
// Estratégia: intercepta via wrapper após o original rodar,
// verificando se o campo foi limpo (sinal de sucesso)

;(function patchAddFunctions() {

  // Helper: patcha uma função add* para fechar o modal se salvar com sucesso
  function patchAdd(fnName, modalId, checkEmptyField) {
    const orig = window[fnName]
    if (!orig) return
    window[fnName] = function(...args) {
      const valorAntes = document.getElementById(checkEmptyField)?.value || ''
      orig.apply(this, args)
      // Se o campo ficou vazio, significa que o save foi bem-sucedido
      const valorDepois = document.getElementById(checkEmptyField)?.value || ''
      if (valorAntes && !valorDepois) {
        closeModal(modalId)
      }
    }
  }

  // Aguarda o DOM estar pronto para patchar
  function aplicarPatches() {
    patchAdd('addCliente',    'modalNovoCliente',    'clienteNome')
    patchAdd('addProduto',    'modalNovoProduto',    'produtoNome')
    patchAdd('addServico',    'modalNovoServico',    'servicoNome')
    patchAdd('addVendedor',   'modalNovoVendedor',   'vendedorNome')
    patchAdd('addFornecedor', 'modalNovoFornecedor', 'fornNome')
    patchAdd('addDespesa',    'modalNovaDespesa',    'despesaNome')
  }

  // Aplica após _iniciarApp (quando as funções já estão definidas)
  const origInit = window._iniciarApp
  window._iniciarApp = async function(...args) {
    await origInit?.apply(this, args)
    aplicarPatches()
  }

})()

// ── Funções de abertura dos modais (usadas nos botões das páginas) ──
function abrirModalNovoCliente()    { openModal('modalNovoCliente') }
function abrirModalNovoProduto()    { openModal('modalNovoProduto') }
function abrirModalNovoServico()    { openModal('modalNovoServico') }
function abrirModalNovoVendedor()   { openModal('modalNovoVendedor') }
function abrirModalNovoFornecedor() { openModal('modalNovoFornecedor') }
function abrirModalNovaDespesa()    {
  // Pré-popula data de vencimento com hoje
  const vencEl = document.getElementById('despesaVenc')
  if (vencEl && !vencEl.value) vencEl.value = hoje()
  openModal('modalNovaDespesa')
}

// Expõe globalmente
window.abrirModalNovoCliente    = abrirModalNovoCliente
window.abrirModalNovoProduto    = abrirModalNovoProduto
window.abrirModalNovoServico    = abrirModalNovoServico
window.abrirModalNovoVendedor   = abrirModalNovoVendedor
window.abrirModalNovoFornecedor = abrirModalNovoFornecedor
window.abrirModalNovaDespesa    = abrirModalNovaDespesa
