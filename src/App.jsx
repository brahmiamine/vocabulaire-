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

const links = [
  {id:'home', label:'Accueil', icon:Home},
  {id:'review', label:'Réviser', icon:Layers3},
  {id:'library', label:'Mes mots', icon:BookOpen},
  {id:'practice', label:"À l'oral", icon:Mic2},
  {id:'stats', label:'Progrès', icon:ChartNoAxesColumnIncreasing}
]
const ratings = [
  {id:'again',label:'À revoir',hint:'10 min',tone:'red'},
  {id:'hard',label:'Difficile',hint:'~1 jour',tone:'orange'},
  {id:'good',label:'Bien',hint:'Plus tard',tone:'green'},
  {id:'easy',label:'Facile',hint:'Encore plus tard',tone:'purple'}
]
const fmt = (date) => new Date(date).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})
const dayKey = (date) => new Date(date).toLocaleDateString('en-CA')
const countToday = events => events.filter(e=>dayKey(e.reviewed_at)===today()).length
const categories=['Quotidien','Expressions','Travail','Voyage','Grammaire','Autres']
const Button = ({children,onClick,variant='primary',className='',disabled=false,type='button'}) =>
  <button className={'btn '+variant+' '+className} onClick={onClick} disabled={disabled} type={type}>{children}</button>
function WordSpeaker({text,compact=false}) {
  return <button type="button" className={'sound '+(compact?'small':'')} aria-label={'Écouter : '+text} title="Écouter en français" onClick={(e)=>{e.stopPropagation();speak(text)}}><Volume2 size={compact?16:20}/></button>
}
function Empty({icon:Icon=BookOpen,title,description,action}) {
  return <div className="empty"><span className="empty-icon"><Icon size={26}/></span><h3>{title}</h3><p>{description}</p>{action}</div>
}
function Navigation({tab,onTab,due}) {
  return <>
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">m<span>.</span></span><span>mot<span className="light">à</span>mot<small>Ton français, chaque jour.</small></span></div>
      <div className="nav-label">TON ESPACE</div>
      <nav className="nav-list">{links.map(({id,label,icon:Icon})=>
        <button key={id} onClick={()=>onTab(id)} className={'nav-link '+(id===tab?'active':'')}><Icon size={19}/><span>{label}</span>{id==='review'&&due>0&&<b className="nav-count">{due}</b>}</button>
      )}</nav>
      <div className="side-note"><div className="side-note-icon"><Lightbulb size={19}/></div><strong>Un peu chaque jour.</strong><p>Le vrai progrès commence quand un mot te vient tout seul à l'oral.</p></div>
      <div className="side-footer">APPRENDRE • PRATIQUER • RETENIR</div>
    </aside>
    <nav className="bottom-nav" aria-label="Navigation principale">{links.map(({id,label,icon:Icon})=><button key={id} onClick={()=>onTab(id)} className={id===tab?'active':''}><span className="bottom-icon"><Icon size={22}/>{id==='review'&&due>0&&<i/>}</span><span>{label}</span></button>)}</nav>
  </>
}
function FormModal({initial,onClose,onSave}) {
  const [value,setValue]=useState(()=>initial?.id?{...initial}:{term:'',meaning:'',translation_ar:'',example:'',category:'Quotidien',source:'Personnel',learned_on:today()})
  const change=(k,v)=>setValue(x=>({...x,[k]:v}))
  const submit=e=>{e.preventDefault();if(!value.term.trim()||!value.meaning.trim())return;onSave(value)}
  return <div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><section className="modal" role="dialog" aria-modal="true" aria-label="Ajouter ou modifier un mot">
    <div className="modal-head"><div><span className="eyebrow">MON CARNET</span><h2>{initial?.id?'Modifier le mot':'Nouveau mot'}</h2></div><button onClick={onClose} className="icon-button" aria-label="Fermer"><X size={20}/></button></div>
    <form onSubmit={submit} className="word-form">
      <label>Mot ou expression <em>*</em><input autoFocus required maxLength={150} placeholder="Ex. Ça me trotte dans la tête" value={value.term} onChange={e=>change('term',e.target.value)}/></label>
      <label>Signification simple <em>*</em><textarea required rows="2" maxLength={500} placeholder="Ce que ça veut dire, en français facile…" value={value.meaning} onChange={e=>change('meaning',e.target.value)}/></label>
      <label>Traduction en arabe littéraire<input dir="rtl" lang="ar" maxLength={300} placeholder="الترجمة بالعربية الفصحى" value={value.translation_ar} onChange={e=>change('translation_ar',e.target.value)}/></label>
      <label>Une phrase dans la vraie vie<textarea rows="2" maxLength={500} placeholder="Ex. J’ai tiqué quand j’ai vu le prix." value={value.example} onChange={e=>change('example',e.target.value)}/></label>
      <div className="form-grid"><label>Catégorie<select value={value.category} onChange={e=>change('category',e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select></label><label>Date d'apprentissage<input type="date" value={value.learned_on} onChange={e=>change('learned_on',e.target.value)}/></label></div>
      <label>Source du mot<input maxLength={120} placeholder="Ex. Conversation avec ChatGPT" value={value.source} onChange={e=>change('source',e.target.value)}/></label>
      <Button className="full" type="submit"><Check size={18}/> Enregistrer ce mot</Button>
    </form>
  </section></div>
}
function LoginModal({onClose,onToast}) {
  const [email,setEmail]=useState('')
  const [pending,setPending]=useState(false)
  const [sent,setSent]=useState(false)
  const send=async e=>{
    e.preventDefault();setPending(true)
    try{
      const {error}=await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:window.location.origin+import.meta.env.BASE_URL}})
      if(error)throw error
      setSent(true);onToast('Vérifie ta boîte e-mail pour te connecter.')
    }catch(err){onToast(err.message)}
    finally{setPending(false)}
  }
  return <div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><section className="modal auth-modal" role="dialog" aria-modal="true" aria-label="Connexion">
    <div className="modal-head"><div><span className="eyebrow">SYNCHRONISATION</span><h2>Garder tes mots partout</h2></div><button className="icon-button" onClick={onClose} aria-label="Fermer"><X size={20}/></button></div>
    <p>Connecte-toi par e-mail pour sauvegarder tes mots dans ta base Supabase et les retrouver sur plusieurs appareils.</p>
    {sent?<div className="success-panel"><CircleCheckBig size={28}/><h3>E-mail envoyé</h3><p>Ouvre le lien reçu sur ce même appareil. Vérifie aussi les spams.</p></div>:<form onSubmit={send} className="word-form"><label>Adresse e-mail<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="toi@exemple.fr"/></label><Button type="submit" className="full" disabled={pending}>{pending?'Envoi…':'Recevoir mon lien de connexion'} <ArrowRight size={17}/></Button></form>}
    <p className="muted small-print">Tes données locales restent sur cet appareil. L'importation vers le cloud est volontaire.</p>
  </section></div>
}
function DailyBars({reviews}) {
  const days=Array.from({length:7},(_,i)=>{
    const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-6+i)
    const count=reviews.filter(e=>dayKey(e.reviewed_at)===dayKey(d)).length
    return {count, label:d.toLocaleDateString('fr-FR',{weekday:'short'}).slice(0,3)}
  })
  const max=Math.max(5,...days.map(d=>d.count))
  return <div className="weekly-bars">{days.map((d,i)=><div className="bar-day" key={i} title={d.count+' révisions'}><div className="bar-track"><div className={'bar-fill '+(i===6?'today':'')} style={{height:Math.max(d.count?12:3,d.count/max*100)+'%'}}/></div><span>{d.label}</span></div>)}</div>
}
function Dashboard({words,reviews,onTab,onAdd,onStarter,due}) {
  const learned=words.filter(w=>!w.archived)
  const recent=[...learned].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,4)
  const done=countToday(reviews)
  const pct=Math.min(100,Math.round(done/10*100))
  const strength=learned.filter(w=>w.reps>=3&&w.interval_days>=7).length
  return <div className="page fade">
    <div className="eyebrow top-eyebrow"><span className="eyebrow-dot"/> TON RENDEZ-VOUS FRANÇAIS</div>
    <div className="hero"><div className="hero-copy"><div className="hero-kicker"><Sparkles size={15}/> PETIT À PETIT, TU PROGRESSES</div><h1>Chaque mot compte<span>.</span></h1><p>10 minutes aujourd’hui, plus de fluidité demain. Retrouve tes mots et fais-les vivre à l’oral.</p><Button variant="lime" onClick={()=>onTab('review')}>{due>0?'Commencer mes révisions':'Voir mes révisions'} <ArrowRight size={19}/></Button></div><div className="hero-visual" aria-hidden="true"><div className="hero-orbit"><span className="float-tag one">tiens !</span><span className="float-tag two">ça marche</span><span className="hero-glyph">Aa<span>✳</span></span></div></div></div>
    <div className="section-head"><div><span className="eyebrow">AUJOURD’HUI</span><h2>Ton tableau de bord</h2></div><span className="date-label"><CalendarDays size={16}/> {new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}</span></div>
    <div className="stats-grid">
      <div className="stat-card"><span className="stat-icon peach"><Layers3 size={20}/></span><span className="stat-number">{due}</span><strong>À réviser</strong><small>Les mots qui t'attendent</small></div>
      <div className="stat-card"><span className="stat-icon lilac"><BookOpen size={20}/></span><span className="stat-number">{learned.length}</span><strong>Mots enregistrés</strong><small>Ton carnet personnel</small></div>
      <div className="stat-card"><span className="stat-icon yellow"><Flame size={20}/></span><span className="stat-number">{streak(reviews)}<span className="unit"> j</span></span><strong>Régularité</strong><small>Jours de révision consécutifs</small></div>
      <div className="stat-card"><span className="stat-icon mint"><Target size={20}/></span><span className="stat-number">{strength}</span><strong>Bien consolidés</strong><small>Selon tes dernières révisions</small></div>
    </div>
    <div className="dashboard-grid">
      <div className="panel daily-panel"><div className="panel-heading"><div><span className="eyebrow">OBJECTIF DU JOUR</span><h3>10 rappels actifs</h3><p>Retrouve un mot de mémoire, puis évalue-toi.</p></div><div className="goal-ring" style={{'--progress':pct+'%'}}><div><b>{done}</b><small>/ 10</small></div></div></div><div className="panel-line"/><div className="quick-actions"><button onClick={()=>onTab('review')}><span className="quick-icon mint"><Layers3 size={19}/></span><span><strong>Révision intelligente</strong><small>Cartes et réponses à saisir</small></span><ChevronRight size={18}/></button><button onClick={()=>onTab('practice')}><span className="quick-icon peach"><Mic2 size={19}/></span><span><strong>Parler avec tes mots</strong><small>Exercice oral sans pression</small></span><ChevronRight size={18}/></button></div></div>
      <div className="panel week-panel"><div className="panel-heading"><div><span className="eyebrow">TA RÉGULARITÉ</span><h3>Cette semaine</h3><p>{reviews.filter(r=>Date.now()-new Date(r.reviewed_at).getTime()<7*86400000).length} rappels ces 7 derniers jours</p></div><span className="pill"><ChartNoAxesColumnIncreasing size={15}/> Activité</span></div><DailyBars reviews={reviews}/></div>
    </div>
    <div className="section-head secondary-section"><div><span className="eyebrow">TON CARNET</span><h2>Ajoutés récemment</h2></div><button className="text-link" onClick={()=>onTab('library')}>Tous les mots <ArrowRight size={17}/></button></div>
    {recent.length?<div className="recent-grid">{recent.map(w=><div className="recent-card" key={w.id}><div className="recent-top"><span className="category-chip">{w.category}</span><WordSpeaker compact text={w.term}/></div><h3>{w.term}</h3><p>{w.meaning}</p><small>{fmt(w.learned_on)}</small></div>)}</div>:<Empty title="Ton histoire commence ici" description="Ajoute un premier mot, ou importe un pack d'expressions pour commencer à apprendre." action={<div className="empty-actions"><Button onClick={onAdd}><Plus size={18}/> Ajouter un mot</Button><Button variant="outline" onClick={onStarter}>Importer 30 mots</Button></div>}/>}
  </div>
}
function Review({due,all,reviews,onRate,onTab}) {
  const [show,setShow]=useState(false)
  const [direction,setDirection]=useState('meaning')
  const [typed,setTyped]=useState('')
  const [result,setResult]=useState(null)
  const word=due[0]
  useEffect(()=>{setShow(false);setTyped('');setResult(null)},[word?.id])
  const reveal=()=>{setShow(true);if(typed.trim() && direction==='meaning')setResult(normalize(typed)===normalize(word.term))}
  const grade=rating=>{onRate(word,rating,'review');setShow(false);setTyped('');setResult(null)}
  return <div className="page narrow-page fade">
    <div className="page-intro"><div><span className="eyebrow">MÉMOIRE À LONG TERME</span><h1>Mes révisions<span className="accent-dot">.</span></h1><p>Essaye de te souvenir avant de regarder. Même une erreur aide à apprendre.</p></div><span className="top-icon"><Layers3 size={26}/></span></div>
    {!word?<Empty icon={CircleCheckBig} title="Tu es à jour !" description={all.length?'Tous les mots prévus ont été révisés. Reviens quand les prochaines cartes seront disponibles.':'Commence par ajouter quelques mots à ton carnet.'} action={<Button onClick={()=>onTab('library')}>Ouvrir mon carnet <ArrowRight size={18}/></Button>}/>:
      <div className="review-stack">
        <div className="review-meta"><span><span className="green-dot"/> {due.length} carte{due.length>1?'s':''} à revoir</span><span>Rappel actif • répétition espacée</span></div>
        <div className="direction-row"><span>Je veux retrouver</span><div className="segmented"><button className={direction==='meaning'?'selected':''} onClick={()=>{setDirection('meaning');setShow(false);setTyped('')}}>Le mot</button><button className={direction==='term'?'selected':''} onClick={()=>{setDirection('term');setShow(false);setTyped('')}}>Le sens</button></div></div>
        <div className="flashcard">
          <div className="flashcard-top"><span className="eyebrow">{word.category} · {word.source}</span><span className="card-mini-index">CARTE DU JOUR</span></div>
          <div className="flash-main">
            <div className="flash-prompt">{direction==='meaning'?'Quel mot correspond à cette définition ?':'Explique cette expression :'}</div>
            <h2>{direction==='meaning'?word.meaning:word.term}</h2>
            {direction==='term'&&<WordSpeaker text={word.term}/>}
            {!show&&<div className="quiz-entry"><label htmlFor="typed-answer">Ta réponse (facultatif)</label><input id="typed-answer" value={typed} placeholder={direction==='meaning'?'Écris le mot sans regarder…':'Essaie de définir avec tes mots…'} onChange={e=>setTyped(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')reveal()}}/></div>}
            {show&&<div className="answer-box"><span className="answer-label">{direction==='meaning'?'LA BONNE RÉPONSE':'CE QUE ÇA VEUT DIRE'}</span><div className="answer-term"><strong>{direction==='meaning'?word.term:word.meaning}</strong><WordSpeaker text={word.term}/></div>{word.translation_ar&&<p lang="ar" dir="rtl" className="arabic">{word.translation_ar}</p>}{word.example&&<div className="example-sentence"><MessageCircle size={17}/><em>« {word.example} »</em><WordSpeaker compact text={word.example}/></div>}
             {result!==null&&<p className={'answer-feedback '+(result?'correct':'incorrect')}>{result?'Bonne réponse !':'Pas tout à fait. Regarde la réponse et évalue-toi.'}</p>}
            </div>}
          </div>
          <div className="flash-footer">{!show?<><span><Eye size={16}/> Essaie d'abord de répondre dans ta tête.</span><Button onClick={reveal}>Voir la réponse <ArrowRight size={18}/></Button></>:<div className="grade-block"><span>Tu t'en souvenais à quel point ?</span><div className="grade-buttons">{ratings.map(r=><button key={r.id} className={'grade '+r.tone} onClick={()=>grade(r.id)}><strong>{r.label}</strong><small>{r.hint}</small></button>)}</div></div>}</div>
        </div>
        <div className="learning-note"><Lightbulb size={19}/><p><strong>Une astuce :</strong> si tu reconnais un mot mais n'arrives pas à le retrouver seul, choisis « Difficile ». Le but est de pouvoir le dire spontanément.</p></div>
      </div>
    }
  </div>
}
function Library({words,onAdd,onEdit,onArchive,onImport,onExport,cloudImport,importRef,onStarter}) {
  const [search,setSearch]=useState('')
  const [category,setCategory]=useState('Tous')
  const [period,setPeriod]=useState('Tous les jours')
  const [includeArchived,setIncludeArchived]=useState(false)
  const active=words.filter(w=>includeArchived||!w.archived)
  const filtered=active.filter(w=>{
    const date=w.learned_on || dayKey(w.created_at)
    const now=new Date(today()+'T12:00:00')
    const diff=Math.floor((now-new Date(date+'T12:00:00'))/86400000)
    const matchesPeriod=period==='Tous les jours'||(period==="Aujourd'hui"&&diff===0)||(period==='Hier'&&diff===1)||(period==='7 derniers jours'&&diff>=0&&diff<7)
    return matchesPeriod&&(category==='Tous'||w.category===category)&&normalize(w.term+' '+w.meaning+' '+w.example).includes(normalize(search))
  }).sort((a,b)=>String(b.learned_on).localeCompare(String(a.learned_on))||new Date(b.created_at)-new Date(a.created_at))
  return <div className="page fade">
    <div className="page-intro"><div><span className="eyebrow">TOUT TON VOCABULAIRE</span><h1>Mon carnet<span className="accent-dot">.</span></h1><p>Les mots que tu rencontres, gardés pour de bon.</p></div><Button onClick={onAdd}><Plus size={18}/> Ajouter un mot</Button></div>
    <div className="library-toolbar"><div className="searchbox"><Search size={19}/><input aria-label="Rechercher un mot" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un mot, un sens, un exemple…"/></div><select aria-label="Filtrer par catégorie" value={category} onChange={e=>setCategory(e.target.value)}><option>Tous</option>{categories.map(c=><option key={c}>{c}</option>)}</select><select aria-label="Filtrer par jour" value={period} onChange={e=>setPeriod(e.target.value)}>{["Tous les jours","Aujourd'hui","Hier","7 derniers jours"].map(p=><option key={p}>{p}</option>)}</select><button className="tool-btn" onClick={()=>importRef.current?.click()}><Upload size={17}/> Importer</button><button className="tool-btn" onClick={onExport}><Download size={17}/> Exporter</button></div>
    <div className="list-summary"><span><strong>{filtered.length}</strong> mot{filtered.length>1?'s':''} affiché{filtered.length>1?'s':''}</span><label className="toggle-archived"><input type="checkbox" checked={includeArchived} onChange={e=>setIncludeArchived(e.target.checked)}/> Voir les archivés</label></div>
    {filtered.length?<div className="word-list">{filtered.map((w,i)=><Fragment key={w.id}>{(i===0||filtered[i-1].learned_on!==w.learned_on)&&<div className="date-divider"><CalendarDays size={15}/>{new Date(w.learned_on+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>}<article className={'word-row '+(w.archived?'archived':'')}>
      <div className="word-symbol">{w.term?.charAt(0).toUpperCase()}</div>
      <div className="word-row-main"><div className="word-row-title"><h3>{w.term}</h3><span className="category-chip">{w.category}</span>{w.archived&&<span className="archive-label">Archivé</span>}</div><p>{w.meaning}</p>{w.example&&<em>« {w.example} »</em>}</div>
      <div className="word-row-actions"><WordSpeaker compact text={w.term}/><button title="Modifier" aria-label={'Modifier '+w.term} className="icon-button" onClick={()=>onEdit(w)}><Pencil size={17}/></button><button title={w.archived?'Réactiver':'Archiver'} aria-label={'Archiver ou réactiver '+w.term} className="icon-button" onClick={()=>onArchive(w)}><Archive size={17}/></button></div>
    </article></Fragment>)}</div>:<Empty title={search?'Aucun mot trouvé':'Ton carnet est encore vide'} description={search?'Essaie avec une autre recherche ou catégorie.':'Tu peux ajouter des mots, importer un CSV/JSON ou charger un pack de 30 expressions.'} action={!search&&<div className="empty-actions"><Button onClick={onAdd}><Plus size={18}/> Ajouter</Button><Button variant="outline" onClick={onStarter}>Pack de démarrage</Button></div>}/>}
    <div className="import-help"><Info size={16}/><span>Fichiers acceptés : JSON ou CSV avec une colonne <code>term</code>. Les doublons sont ignorés. {cloudImport?'En étant connecté, les imports vont dans Supabase.':'Sans connexion, tes mots restent enregistrés localement.'}</span></div>
  </div>
}
function Practice({words,onTab}) {
  const active=words.filter(w=>!w.archived)
  const [idx,setIdx]=useState(0)
  const [transcript,setTranscript]=useState('')
  const [typed,setTyped]=useState('')
  const [listening,setListening]=useState(false)
  const [showMeaning,setShowMeaning]=useState(false)
  const recognition=useRef(null)
  const word=active[idx%Math.max(1,active.length)]
  const matched=word && normalize(transcript||typed).includes(normalize(word.term))
  const next=()=>{setIdx(n=>n+1);setTranscript('');setTyped('');setShowMeaning(false);recognition.current?.stop();setListening(false)}
  const begin=()=>{
    const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition
    if(!SpeechRecognition)return
    recognition.current?.stop()
    const r=new SpeechRecognition()
    r.lang='fr-FR';r.interimResults=false;r.maxAlternatives=1
    r.onresult=e=>{setTranscript(e.results[0][0].transcript);setListening(false)}
    r.onerror=()=>setListening(false)
    r.onend=()=>setListening(false)
    recognition.current=r;r.start();setListening(true)
  }
  useEffect(()=>()=>recognition.current?.stop(),[])
  return <div className="page narrow-page fade">
    <div className="page-intro"><div><span className="eyebrow">PRENDRE CONFIANCE À L'ORAL</span><h1>À toi de parler<span className="accent-dot">.</span></h1><p>Utilise un mot dans une phrase qui parle de ta vraie vie.</p></div><span className="top-icon peach-bg"><Mic2 size={27}/></span></div>
    {!word?<Empty title="Il te faut quelques mots" description="Ajoute des expressions avant de commencer à pratiquer à l'oral." action={<Button onClick={()=>onTab('library')}>Ouvrir mon carnet</Button>}/>:
      <div className="speaking-card">
        <div className="speaking-card-header"><span className="eyebrow">TON DÉFI ORAL</span><span className="pill">Sans chrono • sans pression</span></div>
        <div className="speaking-instruction">Fais une phrase naturelle avec…</div>
        <div className="speaking-term"><h2>{word.term}</h2><WordSpeaker text={word.term}/></div>
        <p className="speaking-hint">{word.meaning}</p>
        <div className="prompt-suggestion"><Sparkles size={19}/><div><strong>Imagine une situation réelle</strong><span>Au travail, entre amis, en couple ou au quotidien. Parle 20 à 30 secondes.</span></div></div>
        {word.example&&<div className="sample"><button onClick={()=>setShowMeaning(!showMeaning)}><Eye size={16}/> {showMeaning?'Masquer':'Voir'} un exemple</button>{showMeaning&&<p>« {word.example} »</p>}</div>}
        <div className="mic-area">
          {(window.SpeechRecognition||window.webkitSpeechRecognition)?<button className={'mic-button '+(listening?'listening':'')} onClick={listening?()=>{recognition.current?.stop();setListening(false)}:begin} aria-label={listening?"Arrêter l'écoute":"Parler"}>{listening?<MicOff size={30}/>:<Mic size={30}/>}</button>:<span className="mic-unsupported"><MicOff size={24}/></span>}
          <strong>{listening?'Je t’écoute…':(window.SpeechRecognition||window.webkitSpeechRecognition)?'Appuie et parle à voix haute':'Micro non pris en charge ici'}</strong>
          <small>Reconnaissance vocale disponible selon le navigateur et ses permissions.</small>
        </div>
        {transcript&&<div className="transcript"><span>TRANSCRIPTION AUTOMATIQUE</span><p>« {transcript} »</p></div>}
        <label className="practice-fallback">Ou écris ta phrase ici<textarea rows="2" placeholder="Ex. J’ai tiqué en voyant cette facture…" value={typed} onChange={e=>setTyped(e.target.value)}/></label>
        {(transcript||typed)&&<div className={'practice-feedback '+(matched?'found':'missing')}><CircleHelp size={18}/>{matched?'Le mot est détecté dans ta phrase. Vérifie aussi si la formulation est naturelle : la détection ne corrige pas la grammaire.':'Le mot exact n’a pas été détecté. Réessaie ou reformule ta phrase.'}</div>}
        <Button className="full" onClick={next}>Un autre mot <ArrowRight size={18}/></Button>
      </div>}
  </div>
}
function Stats({words,reviews,onTab}) {
  const active=words.filter(w=>!w.archived)
  const mastered=active.filter(w=>w.reps>=3&&w.interval_days>=7).length
  const eventsByRating=ratings.map(r=>({label:r.label,count:reviews.filter(x=>x.rating===r.id).length,tone:r.tone}))
  const dates=Array.from({length:28},(_,i)=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-27+i);const day=dayKey(d);return {day,count:reviews.filter(x=>dayKey(x.reviewed_at)===day).length}})
  const max=Math.max(1,...eventsByRating.map(x=>x.count))
  return <div className="page fade"><div className="page-intro"><div><span className="eyebrow">CHAQUE PETIT PAS COMPTE</span><h1>Mes progrès<span className="accent-dot">.</span></h1><p>Pas besoin d’être parfait. La régularité fait la différence.</p></div><span className="top-icon"><ChartNoAxesColumnIncreasing size={27}/></span></div>
    <div className="stats-grid"><div className="stat-card"><span className="stat-icon lilac"><BookOpen size={20}/></span><span className="stat-number">{active.length}</span><strong>Mots actifs</strong></div><div className="stat-card"><span className="stat-icon peach"><Layers3 size={20}/></span><span className="stat-number">{reviews.length}</span><strong>Révisions effectuées</strong></div><div className="stat-card"><span className="stat-icon yellow"><Flame size={20}/></span><span className="stat-number">{streak(reviews)} j</span><strong>Série actuelle</strong></div><div className="stat-card"><span className="stat-icon mint"><Target size={20}/></span><span className="stat-number">{mastered}</span><strong>Bien consolidés</strong></div></div>
    <div className="dashboard-grid"><div className="panel"><div className="panel-heading"><div><span className="eyebrow">28 DERNIERS JOURS</span><h3>Ta constance</h3><p>Chaque carré correspond à une journée.</p></div></div><div className="heatmap">{dates.map(d=><div key={d.day} className={'heat-cell '+(d.count===0?'':d.count<3?'heat1':d.count<7?'heat2':'heat3')} title={d.day+' : '+d.count+' rappels'}/>)}</div><div className="heat-legend"><span>Moins</span><i/><i className="heat1"/><i className="heat2"/><i className="heat3"/><span>Plus</span></div></div><div className="panel"><div className="panel-heading"><div><span className="eyebrow">QUALITÉ DU RAPPEL</span><h3>Comment tu te souviens</h3><p>Les réponses que tu as attribuées.</p></div></div><div className="rating-bars">{eventsByRating.map(r=><div key={r.label} className="rating-bar-row"><span>{r.label}</span><div className="rating-track"><div className={'rating-fill '+r.tone} style={{width:(r.count/max*100)+'%'}}/></div><b>{r.count}</b></div>)}</div></div></div>
    <div className="learning-note stats-note"><Lightbulb size={20}/><p>« Bien consolidé » signifie ici au moins 3 rappels réussis et un intervalle de 7 jours ou plus. Ce n’est pas une certification de maîtrise à l’oral.</p></div>
    <div className="end-action"><Button onClick={()=>onTab('review')}>Réviser maintenant <ArrowRight size={18}/></Button></div>
  </div>
}
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
      {tab==='practice'&&<Practice words={words} onTab={setTab}/>}
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
