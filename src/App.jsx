import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import {
  Home, BookOpen, Layers3, Mic2, ChartNoAxesColumnIncreasing, Plus, Search, Volume2,
  ChevronRight, ArrowLeft, Sparkles, Flame, CalendarDays, Target, Check, X, Cloud,
  CloudOff, Download, Upload, LogIn, LogOut, Settings2, ArrowRight, Pencil, Archive,
  MessageCircle, Lightbulb, BookMarked, Menu, Eye, Keyboard, Mic, MicOff, RotateCcw,
  CircleCheckBig, CircleHelp, Play, Wifi, ShieldCheck, Info
} from 'lucide-react'
import { makeWord, schedule, today, normalize, isDue, newId, speak, streak } from './learning.js'
import {
  supabase, localWords, localReviews, storeLocal, getCloudData, putWord, putReview,
  addStarter, download, parseImport, mergeWords, toCsv
} from './data.js'
import { Navigation, FormModal, LoginModal } from './components/Common.jsx'
import { Dashboard } from './pages/Dashboard.jsx'
import { Review } from './pages/Review.jsx'
import { Library } from './pages/Library.jsx'
import { Boost } from './pages/Boost.jsx'
import { Stats } from './pages/Stats.jsx'

export default function App(){
  const [tab,setTab]=useState('home')
  const [words,setWords]=useState(localWords)
  const [reviews,setReviews]=useState(localReviews)
  const [user,setUser]=useState(null)
  const [authReady,setAuthReady]=useState(!supabase)
  const [editing,setEditing]=useState(false)
  const [showAuth,setShowAuth]=useState(false)
  const [toast,setToast]=useState('')
  const [installEvent,setInstallEvent]=useState(null)
  const [showCloudTransfer,setShowCloudTransfer]=useState(true)
  const importRef=useRef(null)
  const toastTimer=useRef(null)
  const notify=msg=>{setToast(msg);clearTimeout(toastTimer.current);toastTimer.current=setTimeout(()=>setToast(''),4500)}
  const due=useMemo(()=>words.filter(w=>isDue(w)).sort((a,b)=>new Date(a.due_at)-new Date(b.due_at)),[words])
  const activeWords=useMemo(()=>words.filter(w=>!w.archived),[words])
  useEffect(()=>{
    const before=e=>{e.preventDefault();setInstallEvent(e)}
    window.addEventListener('beforeinstallprompt',before)
    return()=>window.removeEventListener('beforeinstallprompt',before)
  },[])
  useEffect(()=>{
    if(!supabase)return
    let alive=true
    const hydrate=async session=>{
      if(!alive)return
      const current=session?.user||null
      setUser(current)
      if(current){
        try{const data=await getCloudData();if(alive){setWords(data.words);setReviews(data.reviews)}}
        catch(e){if(alive)notify('Connexion possible, mais données cloud indisponibles : '+e.message)}
      }else{setWords(localWords());setReviews(localReviews())}
      if(alive)setAuthReady(true)
    }
    supabase.auth.getSession().then(({data})=>hydrate(data.session)).catch(e=>{notify(e.message);setAuthReady(true)})
    const {data:{subscription}}=supabase.auth.onAuthStateChange((event,session)=>{
      if(event==='SIGNED_IN'||event==='SIGNED_OUT')setTimeout(()=>hydrate(session),0)
    })
    return()=>{alive=false;subscription.unsubscribe()}
  },[])
  useEffect(()=>{if(authReady&&!user)storeLocal(words,reviews)},[words,reviews,authReady,user])
  const saveWord=async fields=>{
    const w=makeWord(fields)
    if(!w.term||!w.meaning){notify('Ajoute le mot et sa signification.');return}
    const duplicate=words.find(x=>normalize(x.term)===normalize(w.term)&&x.id!==w.id&&!x.archived)
    if(duplicate){notify('Ce mot existe déjà dans ton carnet.');return}
    setWords(current=>[w,...current.filter(x=>x.id!==w.id)])
    setEditing(false)
    try{await putWord(w,user);notify('Mot enregistré !')}
    catch(e){notify('Sauvegarde cloud échouée : '+e.message)}
  }
  const savePersonalExample=async(w,phrase)=>{
    const changed={...w,personal_example:phrase.trim().slice(0,500)}
    setWords(current=>current.map(x=>x.id===w.id?changed:x))
    try{await putWord(changed,user)}catch(e){notify('Synchronisation de la phrase impossible : '+e.message)}
  }
  const archiveWord=async w=>{
    const changed={...w,archived:!w.archived}
    setWords(current=>current.map(x=>x.id===w.id?changed:x))
    try{await putWord(changed,user);notify(changed.archived?'Mot archivé.':'Mot réactivé.')}
    catch(e){notify('Erreur de synchronisation : '+e.message)}
  }
  const rate=async(w,rating,mode)=>{
    const updated=schedule(w,rating)
    const entry={id:newId(),word_id:w.id,rating,mode,reviewed_at:new Date().toISOString()}
    setWords(current=>current.map(x=>x.id===w.id?updated:x))
    setReviews(current=>[entry,...current])
    try{await Promise.all([putWord(updated,user),putReview(entry,user)])}
    catch(e){notify('Révision enregistrée sur cet écran, mais erreur cloud : '+e.message)}
  }
  const starterImport=async()=>{
    const {words:merged,added,count}=addStarter(words)
    if(!count){notify('Tous les mots du pack sont déjà présents.');return}
    setWords(merged)
    try{if(user)await Promise.all(added.map(w=>putWord(w,user)));notify(count+' mots ajoutés à ton carnet.')}
    catch(e){notify('Import non synchronisé : '+e.message)}
  }
  const doImport=async e=>{
    const f=e.target.files?.[0];if(!f)return
    try{
      const incoming=parseImport(await f.text(),f.name)
      const {words:merged,added}=mergeWords(words,incoming)
      setWords(merged)
      if(user)await Promise.all(added.map(w=>putWord(w,user)))
      notify(added.length+' mots importés. Doublons ignorés.')
    }catch(err){notify('Import impossible : '+err.message)}
    finally{e.target.value=''}
  }
  const exportAll=()=>{
    download('mon-vocabulaire-'+today()+'.json',JSON.stringify(words,null,2))
    notify('Sauvegarde JSON téléchargée.')
  }
  const cloudLocalImport=async()=>{
    if(!user)return
    const local=localWords()
    const {words:merged,added}=mergeWords(words,local)
    try{
      await Promise.all(added.map(w=>putWord(w,user)))
      setWords(merged)
      setShowCloudTransfer(false)
      notify(added.length+' mots locaux ajoutés à Supabase.')
    }catch(e){notify('Transfert interrompu : '+e.message)}
  }
  const logOut=async()=>{
    await supabase?.auth.signOut()
    notify('Tu es maintenant en mode local.')
  }
  const install=async()=>{if(!installEvent)return;await installEvent.prompt();setInstallEvent(null)}
  return <div className="app-shell">
    <Navigation tab={tab} onTab={setTab} due={due.length}/>
    <div className="main-wrap">
      <header className="topbar"><div className="mobile-brand"><span className="brand-mark">m<span>.</span></span><b>motàmot</b></div><div className="topbar-message"><span className="status-dot"/> TON ESPACE D'APPRENTISSAGE</div><div className="header-actions">
      {installEvent&&<button className="install-chip" onClick={install}><Download size={15}/> Installer</button>}
      <button className="cloud-chip" onClick={()=>supabase?(user?logOut():setShowAuth(true)):notify('Supabase n’est pas encore configuré. Tes mots sont sauvegardés sur cet appareil.')} title={user?'Se déconnecter':supabase?'Synchroniser mes mots':'Mode local, Supabase non configuré'}>{user?<Cloud size={16}/>:<CloudOff size={16}/>}<span>{user?'Connecté':'Sur cet appareil'}</span></button>
      <button className="add-top" title="Ajouter un mot" aria-label="Ajouter un mot" onClick={()=>setEditing({})}><Plus size={20}/></button>
      </div></header>
      <main>
      {tab==='home'&&<Dashboard words={words} reviews={reviews} onTab={setTab} onAdd={()=>setEditing({})} onStarter={starterImport} due={due.length}/>}
      {tab==='review'&&<Review due={due} all={activeWords} reviews={reviews} onRate={rate} onTab={setTab}/>}
      {tab==='library'&&<Library words={words} onAdd={()=>setEditing({})} onEdit={setEditing} onArchive={archiveWord} onImport={doImport} onExport={exportAll} cloudImport={!!user} importRef={importRef} onStarter={starterImport}/>}
      {tab==='practice'&&<Boost words={words} onTab={setTab} onRate={rate} onPersonalExample={savePersonalExample}/>}
      {tab==='stats'&&<Stats words={words} reviews={reviews} onTab={setTab}/>}
      </main>
      <footer className="footer"><span>Mot à Mot · Construis ton français à ton rythme.</span><span>{user?'Sauvegarde Supabase':'Sauvegarde locale'} · PWA</span></footer>
    </div>
    <input type="file" ref={importRef} accept=".json,.csv,text/csv,application/json" onChange={doImport} hidden/>
    {editing!==false&&<FormModal initial={editing} onClose={()=>setEditing(false)} onSave={saveWord}/>}
    {showAuth&&supabase&&<LoginModal onClose={()=>setShowAuth(false)} onToast={notify}/>}
    {user&&tab==='home'&&showCloudTransfer&&localWords().length>0&&<div className="cloud-transfer"><Cloud size={18}/><span>Tu as aussi des mots enregistrés localement.</span><button onClick={cloudLocalImport}>Les importer dans Supabase <ArrowRight size={15}/></button><button aria-label="Masquer" onClick={()=>setShowCloudTransfer(false)}><X size={15}/></button></div>}
    {toast&&<div className="toast" role="status"><Info size={18}/>{toast}<button onClick={()=>setToast('')} aria-label="Fermer"><X size={16}/></button></div>}
  </div>
}
