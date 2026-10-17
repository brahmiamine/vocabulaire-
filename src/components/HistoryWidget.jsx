import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, BookOpen, CheckCircle2, Search, Volume2 } from 'lucide-react'
import { supabase } from '../data.js'
import { normalize, speak } from '../learning.js'
import { HISTORY_SLUG, prepareHistoryImport } from '../historyUtils.js'

const PER_PAGE=8
async function loadCatalog() {
  if(supabase) {
    try {
      const {data,error}=await supabase.from('vocab_history_catalog')
        .select('term,meaning,translation_ar,example,category,learned_on,source')
        .eq('pack_slug',HISTORY_SLUG).order('id').limit(500)
      if(!error && data?.length)return data
    }catch { /* fall back to offline catalogue */ }
  }
  const response=await fetch(import.meta.env.BASE_URL+'history-2026-10-16.json')
  if(!response.ok)throw Error('Le pack est indisponible.')
  const rows=await response.json()
  if(!Array.isArray(rows))throw Error('Pack non valide.')
  return rows
}
export function HistoryWidget({existing,onImport,onClose}) {
  const [rows,setRows]=useState([])
  const [busy,setBusy]=useState(false)
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const [search,setSearch]=useState('')
  const [category,setCategory]=useState('Toutes')
  const [page,setPage]=useState(0)
  useEffect(()=>{
    let alive=true
    loadCatalog().then(result=>{if(alive)setRows(result)})
      .catch(e=>{if(alive)setError(e.message)})
      .finally(()=>{if(alive)setLoading(false)})
    return()=>{alive=false}
  },[])
  const categories=useMemo(()=>['Toutes',...new Set(rows.map(x=>x.category))],[rows])
  const missing=useMemo(()=>prepareHistoryImport(existing,rows),[existing,rows])
  const current=useMemo(()=>{
    const q=search.trim(),key=normalize(q)
    return rows.filter(w=>(category==='Toutes'||w.category===category) &&
      (!q || (key ? normalize(w.term+' '+w.meaning+' '+w.example).includes(key) : w.translation_ar?.includes(q))))
  },[rows,search,category])
  const pages=Math.max(1,Math.ceil(current.length/PER_PAGE))
  const shown=current.slice(page*PER_PAGE,(page+1)*PER_PAGE)
  const known=new Set(existing.map(w=>normalize(w.term)))
  const importAll=async()=>{
    if(busy||!missing.length)return
    setBusy(true)
    try{await onImport(rows)}finally{setBusy(false)}
  }
  return <section className="history-widget" aria-label="Vocabulaire du 16 octobre">
    <div className="history-widget-top"><button onClick={onClose}><ArrowLeft size={16}/> Retour au carnet</button><span>Vendredi 16 octobre 2026</span></div>
    <div className="history-widget-head"><div><h2>Mes mots du 16 octobre<span className="accent-dot">.</span></h2><p>Expressions retrouvées dans les discussions, avec définitions et arabe littéraire.</p></div><strong>{rows.length}<small>mots</small></strong></div>
    {loading?<p role="status">Chargement du pack…</p>:error?<p role="alert">{error}</p>:<>
    <div className="history-widget-cta"><div><strong>{missing.length} à ajouter</strong><small>{rows.length-missing.length} déjà dans ton carnet</small></div><button disabled={busy||missing.length===0} onClick={importAll}><BookOpen size={16}/>{busy?'Importation…':missing.length?'Tout importer':'Déjà importé'}</button></div>
    <div className="history-widget-filters"><label><Search size={17}/><input aria-label="Chercher dans le pack" placeholder="Rechercher…" value={search} onChange={e=>{setSearch(e.target.value);setPage(0)}}/></label><select aria-label="Catégorie" value={category} onChange={e=>{setCategory(e.target.value);setPage(0)}}>{categories.map(c=><option key={c}>{c}</option>)}</select></div>
    <div className="history-widget-results">{current.length} résultat{current.length>1?'s':''} · page {page+1}/{pages}</div>
    {shown.map(word=><details className="history-widget-item" key={word.term}><summary><div><strong>{word.term}</strong><small>{word.category}</small></div>{known.has(normalize(word.term))&&<CheckCircle2 size={16}/>}<span>⌄</span></summary><div className="history-widget-detail"><p>{word.meaning}</p><p lang="ar" dir="rtl">{word.translation_ar}</p><blockquote>« {word.example} »</blockquote><button onClick={()=>speak(word.example||word.term)}><Volume2 size={15}/> Écouter</button></div></details>)}
    {!current.length&&<p>Aucun mot trouvé.</p>}
    {pages>1&&<div className="history-widget-pager"><button disabled={page===0} onClick={()=>setPage(x=>x-1)}>Précédent</button><span>{page+1} / {pages}</span><button disabled={page===pages-1} onClick={()=>setPage(x=>x+1)}>Suivant</button></div>}
    <p className="history-widget-note">Sélection des échanges accessibles du 16 octobre. L’historique complet de Work et de tous les projets n’est pas garanti ; les exemples sont reformulés.</p>
    </>}
  </section>
}
