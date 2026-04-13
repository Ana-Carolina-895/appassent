/* ═══════════════════════════════════════════════════
   ASSENT v1.2 — firebase.js
   Módulo ES puro — sem tags <script>, compatível com
   GitHub Pages via type="module" no index.html
   ═══════════════════════════════════════════════════ */

import { initializeApp }                              from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"
import { getAuth, signInWithEmailAndPassword,
         signInWithPopup, GoogleAuthProvider,
         signOut, onAuthStateChanged }                from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"
import { getFirestore, doc, getDoc, setDoc }          from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"

const firebaseConfig = {
  apiKey:            "AIzaSyB9HEWiHFc8YEuj_Ab-7TxGKqdQkSRQAio",
  authDomain:        "assent-2b945.firebaseapp.com",
  projectId:         "assent-2b945",
  storageBucket:     "assent-2b945.firebasestorage.app",
  messagingSenderId: "851051401705",
  appId:             "1:851051401705:web:fa6ebb1cc6ee5d3a737b78",
  measurementId:     "G-K7F0F7PZ8M"
}

const app            = initializeApp(firebaseConfig)
const auth           = getAuth(app)
const db             = getFirestore(app)
const googleProvider = new GoogleAuthProvider()

/* ══ Expõe para o resto da app (scripts não-módulo) ══ */
window._fbAuth          = auth
window._fbDb            = db
window._fbGoogleProvider= googleProvider
window._fbSignInEmail   = (email, pass) => signInWithEmailAndPassword(auth, email, pass)
window._fbSignInGoogle  = ()            => signInWithPopup(auth, googleProvider)
window._fbSignOut       = ()            => signOut(auth)
window._fbGetDoc        = (path, id)    => getDoc(doc(db, path, id))
window._fbSetDoc        = (path, id, data, merge) => setDoc(doc(db, path, id), data, merge ? { merge: true } : {})
window._fbOnAuth        = (cb)          => onAuthStateChanged(auth, cb)

/* ══ Guard: _iniciarApp só pode ser chamado uma vez ══ */
window._appJaIniciado = false

onAuthStateChanged(auth, async (user) => {
  if (user) {
    /* Se o app já foi iniciado, ignora re-disparos do onAuthStateChanged */
    if (window._appJaIniciado) return

    try {
      const snap = await getDoc(doc(db, 'licencas', user.uid))
      if (snap.exists() && snap.data().ativo === true) {
        window._fbUsuarioAtual = user

        /* Tenta buscar chave Anthropic (opcional — sem quebrar se falhar) */
        try {
          const cfgSnap = await getDoc(doc(db, 'config', 'sistema'))
          window._anthropicKey = cfgSnap.exists() ? (cfgSnap.data().anthropicKey || '') : ''
        } catch (_) {
          window._anthropicKey = ''
        }

        document.getElementById('loginScreen').style.display = 'none'

        /* Aguarda DOM estar pronto de forma confiável */
        const doInit = () => {
          if (!window._appJaIniciado) {
            window._appJaIniciado = true
            /* _iniciarApp é definida em main.js — garantida pelo defer */
            window._iniciarApp()
          }
        }

        if (document.readyState === 'complete' || document.readyState === 'interactive') {
          doInit()
        } else {
          window.addEventListener('DOMContentLoaded', doInit, { once: true })
          window.addEventListener('load',             doInit, { once: true })
        }

      } else {
        window._mostrarErroLicenca(user)
      }
    } catch (e) {
      console.error('❌ ERRO firebase.js:', e.message, e)
      window._mostrarErroLicenca(user, 'Erro: ' + e.message)
    }

  } else {
    /* Não logado — mostra login */
    window._appJaIniciado = false
    const loginScreen   = document.getElementById('loginScreen')
    const loadingInicial = document.getElementById('loadingInicial')
    if (loginScreen)    loginScreen.style.display   = 'flex'
    if (loadingInicial) loadingInicial.style.display = 'none'
  }
})
