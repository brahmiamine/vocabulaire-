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
import { Button, WordSpeaker, Empty, ratings, categories, fmt, dayKey, countToday } from '../components/Common.jsx'
export function Review({due,all,reviews,onRate,onTab}) {
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
             {word.personal_example&&<div className="example-sentence"><MessageCircle size={17}/><em>Ma phrase : « {word.personal_example} »</em><WordSpeaker compact text={word.personal_example}/></div>}{result!==null&&<p className={'answer-feedback '+(result?'correct':'incorrect')}>{result?'Bonne réponse !':'Pas tout à fait. Regarde la réponse et évalue-toi.'}</p>}
            </div>}
          </div>
          <div className="flash-footer">{!show?<><span><Eye size={16}/> Essaie d'abord de répondre dans ta tête.</span><Button onClick={reveal}>Voir la réponse <ArrowRight size={18}/></Button></>:<div className="grade-block"><span>Tu t'en souvenais à quel point ?</span><div className="grade-buttons">{ratings.map(r=><button key={r.id} className={'grade '+r.tone} onClick={()=>grade(r.id)}><strong>{r.label}</strong><small>{r.hint}</small></button>)}</div></div>}</div>
        </div>
        <div className="learning-note"><Lightbulb size={19}/><p><strong>Une astuce :</strong> si tu reconnais un mot mais n'arrives pas à le retrouver seul, choisis « Difficile ». Le but est de pouvoir le dire spontanément.</p></div>
      </div>
    }
  </div>
}
