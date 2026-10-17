import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import {
  Home, BookOpen, Layers3, Mic2, ChartNoAxesColumnIncreasing, Plus, Search, Volume2,
  ChevronRight, ArrowLeft, Sparkles, Flame, CalendarDays, Target, Check, X, Cloud,
  CloudOff, Download, Upload, LogIn, LogOut, Settings2, ArrowRight, Pencil, Archive,
  MessageCircle, Lightbulb, BookMarked, Menu, Eye, Keyboard, Mic, MicOff, RotateCcw,
  CircleCheckBig, CircleHelp, Play, Wifi, ShieldCheck, Info
} from 'lucide-react'
import { makeWord, schedule, today, normalize, isDue, newId, speak, streak } from '../learning.js'
import {
  supabase, localWords, localReviews, storeLocal, getCloudData, putWord, putReview,
  addStarter, download, parseImport, mergeWords, toCsv
} from '../data.js'
export const links = [
  {id:'home', label:'Accueil', icon:Home},
  {id:'review', label:'Réviser', icon:Layers3},
  {id:'library', label:'Mes mots', icon:BookOpen},
  {id:'practice', label:"À l'oral", icon:Mic2},
  {id:'stats', label:'Progrès', icon:ChartNoAxesColumnIncreasing}
]
export const ratings = [
  {id:'again',label:'À revoir',hint:'10 min',tone:'red'},
  {id:'hard',label:'Difficile',hint:'~1 jour',tone:'orange'},
  {id:'good',label:'Bien',hint:'Plus tard',tone:'green'},
  {id:'easy',label:'Facile',hint:'Encore plus tard',tone:'purple'}
]
export const fmt = (date) => new Date(date).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})
export const dayKey = (date) => new Date(date).toLocaleDateString('en-CA')
export const countToday = events => events.filter(e=>dayKey(e.reviewed_at)===today()).length
export const categories=['Quotidien','Expressions','Travail','Voyage','Grammaire','Autres']
export const Button = ({children,onClick,variant='primary',className='',disabled=false,type='button'}) =>
  <button className={'btn '+variant+' '+className} onClick={onClick} disabled={disabled} type={type}>{children}</button>
export function WordSpeaker({text,compact=false}) {
  return <button type="button" className={'sound '+(compact?'small':'')} aria-label={'Écouter : '+text} title="Écouter en français" onClick={(e)=>{e.stopPropagation();speak(text)}}><Volume2 size={compact?16:20}/></button>
}
export function Empty({icon:Icon=BookOpen,title,description,action}) {
  return <div className="empty"><span className="empty-icon"><Icon size={26}/></span><h3>{title}</h3><p>{description}</p>{action}</div>
}
export function Navigation({tab,onTab,due}) {
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
export function FormModal({initial,onClose,onSave}) {
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
export function LoginModal({onClose,onToast}) {
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
