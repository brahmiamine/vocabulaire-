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
function DailyBars({reviews}) {
  const days=Array.from({length:7},(_,i)=>{
    const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-6+i)
    const count=reviews.filter(e=>dayKey(e.reviewed_at)===dayKey(d)).length
    return {count, label:d.toLocaleDateString('fr-FR',{weekday:'short'}).slice(0,3)}
  })
  const max=Math.max(5,...days.map(d=>d.count))
  return <div className="weekly-bars">{days.map((d,i)=><div className="bar-day" key={i} title={d.count+' révisions'}><div className="bar-track"><div className={'bar-fill '+(i===6?'today':'')} style={{height:Math.max(d.count?12:3,d.count/max*100)+'%'}}/></div><span>{d.label}</span></div>)}</div>
}
export function Dashboard({words,reviews,onTab,onAdd,onStarter,due}) {
  const learned=words.filter(w=>!w.archived)
  const recent=[...learned].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,4)
  const done=countToday(reviews)
  const pct=Math.min(100,Math.round(done/10*100))
  const strength=learned.filter(w=>w.reps>=3&&w.interval_days>=7).length
  return <div className="page fade">
    <div className="eyebrow top-eyebrow"><span className="eyebrow-dot"/> TON RENDEZ-VOUS FRANÇAIS</div>
    <div className="hero"><div className="hero-copy"><div className="hero-kicker"><Sparkles size={15}/> PETIT À PETIT, TU PROGRESSES</div><h1>Chaque mot compte<span>.</span></h1><p>Quelques minutes aujourd’hui, des expressions qui viennent naturellement demain. Retrouve tes mots et fais-les vivre à l’oral.</p><Button variant="lime" onClick={()=>onTab('practice')}>{due>0?'Commencer mes révisions':'Voir mes révisions'} <ArrowRight size={19}/></Button></div><div className="hero-visual" aria-hidden="true"><div className="hero-orbit"><span className="float-tag one">tiens !</span><span className="float-tag two">ça marche</span><span className="hero-glyph">Aa<span>✳</span></span></div></div></div>
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
