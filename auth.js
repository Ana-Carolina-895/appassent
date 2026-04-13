function render(){
  loadCategorias()
  applyConfig()
  try{
    const t=localStorage.getItem('assent_theme')||'dark'
    document.documentElement.setAttribute('data-theme',t)
    const btn=document.getElementById('themeToggleBtn')
    if(btn)btn.textContent=t==='light'?'🌙':'☀️'
  }catch(e){}
  renderDashboard();renderClientes();renderProdutos();renderServicos();renderVendas()
  renderEntradas();renderCaixa();renderDespesas();renderFornecedores();renderVendedores();renderFiado();renderAgenda();atualizarResumo();populateSelects()
  const min=config.estoqueMin!==undefined?config.estoqueMin:3
  const z=produtos.filter(p=>p.estoque<=0).length
  const b2=produtos.filter(p=>p.estoque>0&&p.estoque<=min).length
  if(z)toast('⚠️ '+z+' produto(s) com estoque zerado — verifique o dashboard.','warning')
  else if(b2)toast('ℹ️ '+b2+' produto(s) abaixo do estoque mínimo ('+min+').','info')
  // Onboarding para novos usuários
  setTimeout(initOnboarding, 800)
}
/* ══ FIREBASE AUTH LOGIC ══ */
function loginComEmail(){
  const email=document.getElementById('loginEmail').value.trim()
  const senha=document.getElementById('loginSenha').value
  const msg=document.getElementById('loginMsg')
  if(!email||!senha){msg.className='login-msg error';msg.textContent='Preencha e-mail e senha.';return}
  msg.className='login-msg';msg.textContent='Entrando…'
  window._fbSignInEmail(email,senha).catch(e=>{
    msg.className='login-msg error'
    if(e.code==='auth/invalid-credential'||e.code==='auth/wrong-password'||e.code==='auth/user-not-found')
      msg.textContent='E-mail ou senha incorretos.'
    else if(e.code==='auth/too-many-requests')
      msg.textContent='Muitas tentativas. Aguarde alguns minutos.'
    else
      msg.textContent='Erro: '+e.message
  })
}

function loginComGoogle(){
  const msg=document.getElementById('loginMsg')
  msg.className='login-msg';msg.textContent='Abrindo Google…'
  window._fbSignInGoogle().catch(e=>{
    msg.className='login-msg error'
    if(e.code==='auth/popup-closed-by-user')msg.textContent='Login cancelado.'
    else msg.textContent='Erro: '+e.message
  })
}

function fazerLogout(){
  window._fbSignOut().then(()=>{
    document.getElementById('loginScreen').style.display='flex'
    document.getElementById('loginFormArea').style.display='block'
    document.getElementById('loginBloqueadoArea').style.display='none'
    document.getElementById('loginMsg').textContent=''
  })
}

function _mostrarErroLicenca(user, mensagem){
  const msg=mensagem||'Sua licença não está ativa. Entre em contato com o suporte para reativar seu acesso.'
  document.getElementById('loginLoading').style.display='none'
  document.getElementById('loginScreen').style.display='flex'
  document.getElementById('loginFormArea').style.display='none'
  document.getElementById('loginBloqueadoArea').style.display='block'
  document.getElementById('loginBloqueadoMsg').textContent=msg
}

async function _iniciarApp(){
  document.getElementById('loginLoading').style.display='none'
  document.getElementById('loginScreen').style.display='none'

  // ── Carrega dados do Firestore (banco online) ──
  if(window._fbUsuarioAtual){
    try{
      const uid=window._fbUsuarioAtual.uid
      const snap=await window._fbGetDoc('dados',uid)
      if(snap.exists()){
        const d=snap.data()
        // Usa dados do Firestore; localStorage é só fallback local
        clientes=d.clientes||[]
        produtos=d.produtos||[]
        vendas=d.vendas||[]
        entradas=d.entradas||[]
        caixas=d.caixas||[]
        servicos=d.servicos||[]
        despesas=d.despesas||[]
        fornecedores=d.fornecedores||[]
        vendedores=d.vendedores||[]
        agenda=d.agenda||[]
        agendaTipos=d.agendaTipos||[]
        if(d.config){
          // Restaura logo do localStorage (não é salvo no Firestore por limite de tamanho)
          const logoLocal=lsGetObj('config',{}).logo||''
          config={...d.config,logo:d.config.logo==='__has_logo__'?logoLocal:d.config.logo||''}
        }
        if(d.saleIdCnt)localStorage.setItem('saleIdCnt',String(d.saleIdCnt))
        console.log('\u2705 Dados carregados do Firestore')
      } else {
        // Primeira vez: dados vêm do localStorage (migração automática)
        console.log('\u2139\ufe0f Sem dados no Firestore — usando localStorage como base')
        _syncFirestore() // sobe dados locais para o Firestore imediatamente
      }
    }catch(e){
      console.warn('\u26a0\ufe0f Falha ao carregar do Firestore, usando localStorage:',e.message)
    }
  }

  // tabWarning gerenciado via classe
  // app sempre visível — loginLoading será ocultado abaixo
  render()
}

// Esconde o app até auth confirmar
// .app começa display:none via CSS — sem necessidade de inline style
// tabWarning começa oculto via CSS
