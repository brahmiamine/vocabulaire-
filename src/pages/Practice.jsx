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
export function Practice({words,onTab}) {
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
