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
import { Button, WordSpeaker, Empty, ratings, categories, fmt, dayKey, countToday } from '../components/Common.jsx'
export function Library({words,onAdd,onEdit,onArchive,onImport,onExport,cloudImport,importRef,onStarter}) {
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
      <div className="word-row-main"><div className="word-row-title"><h3>{w.term}</h3><span className="category-chip">{w.category}</span>{w.archived&&<span className="archive-label">Archivé</span>}</div><p>{w.meaning}</p>{w.example&&<em>« {w.example} »</em>}{w.personal_example&&<em>Ma phrase : « {w.personal_example} »</em>}</div>
      <div className="word-row-actions"><WordSpeaker compact text={w.term}/><button title="Modifier" aria-label={'Modifier '+w.term} className="icon-button" onClick={()=>onEdit(w)}><Pencil size={17}/></button><button title={w.archived?'Réactiver':'Archiver'} aria-label={'Archiver ou réactiver '+w.term} className="icon-button" onClick={()=>onArchive(w)}><Archive size={17}/></button></div>
    </article></Fragment>)}</div>:<Empty title={search?'Aucun mot trouvé':'Ton carnet est encore vide'} description={search?'Essaie avec une autre recherche ou catégorie.':'Tu peux ajouter des mots, importer un CSV/JSON ou charger un pack de 30 expressions.'} action={!search&&<div className="empty-actions"><Button onClick={onAdd}><Plus size={18}/> Ajouter</Button><Button variant="outline" onClick={onStarter}>Pack de démarrage</Button></div>}/>}
    <div className="import-help"><Info size={16}/><span>Fichiers acceptés : JSON ou CSV avec une colonne <code>term</code>. Les doublons sont ignorés. {cloudImport?'En étant connecté, les imports vont dans Supabase.':'Sans connexion, tes mots restent enregistrés localement.'}</span></div>
  </div>
}
