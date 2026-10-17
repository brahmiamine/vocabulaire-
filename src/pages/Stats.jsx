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
export function Stats({words,reviews,onTab}) {
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
