import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, BookOpen, Check, ChevronLeft, CircleCheck, Headphones, Lightbulb, Mic, MicOff, RotateCcw, Sparkles, Volume2 } from 'lucide-react'
import { Button, Empty, WordSpeaker, ratings } from '../components/Common.jsx'
import { planSession, containsExpression, situationFor } from '../fluency.js'
import { normalize, speak } from '../learning.js'
import { useVoiceInput } from '../hooks/useVoiceInput.js'

const steps=['Retrouver','Écouter','Utiliser','Valider']
const videos=[
  {label:'Easy French : interviews',url:'https://www.youtube.com/watch?v=cxl-necIvrA'},
  {label:'innerFrench : français parlé',url:'https://www.youtube.com/watch?v=66fHIl4VYR8'},
  {label:'Parler sans bloquer : 5 min',url:'https://www.youtube.com/watch?v=qnOYnbu1SnA'}
]
export function Boost({ words, onTab, onRate, onPersonalExample }) {
  const active=useMemo(()=>words.filter(w=>!w.archived),[words])
  const [ids,setIds]=useState(()=>planSession(words))
  const [index,setIndex]=useState(0)
  const [step,setStep]=useState(0)
  const [guess,setGuess]=useState('')
  const [sentence,setSentence]=useState('')
  const [saved,setSaved]=useState('')
  const voice=useVoiceInput()
  const word=active.find(w=>w.id===ids[index])
  useEffect(()=>{if(active.length && !ids.length)setIds(planSession(active))},[active,ids.length])
  useEffect(()=>{
    setStep(0);setGuess('');setSentence('');setSaved('');voice.clear()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[word?.id])
  const candidate=sentence.trim() || voice.transcript.trim()
  const save=async()=>{
    if(candidate){
      const value=candidate.slice(0,500)
      setSaved(value)
      await onPersonalExample(word,value)
    }
    setStep(3)
  }
  const rate=async rating=>{
    await onRate({...word,personal_example:saved||word.personal_example},rating,'practice')
    setIndex(i=>i+1)
  }
  const restart=()=>{setIds(planSession(active));setIndex(0);setStep(0)}
  return <div className="page boost-page fade">
    <header className="boost-heading"><span className="eyebrow">ROUTINE ORALE · B1 → B2</span>
      <div className="boost-headline"><h1>Parle naturellement<span className="accent-dot">.</span></h1>{word&&<strong>{index+1} / {ids.length}</strong>}</div>
      {word&&<><div className="boost-track" role="progressbar" aria-valuemin={0} aria-valuemax={ids.length*4} aria-valuenow={index*4+step+1} aria-label="Progression de la séance"><div style={{width:((index*4+step+1)/(ids.length*4)*100)+'%'}}/></div>
      <div className="boost-steps">{steps.map((s,i)=><span key={s} className={i===step?'active':''}>{i+1}. {s}</span>)}</div></>}
    </header>
    {!active.length?<Empty icon={BookOpen} title="Ton carnet est vide" description="Ajoute quelques expressions avant de commencer." action={<Button onClick={()=>onTab('library')}>Ouvrir mon carnet</Button>}/>:
    !word?<div className="boost-finish"><CircleCheck size={48}/><h2>Séance terminée !</h2><p>Tu as utilisé {ids.length} expressions. Continue à les employer dans de vraies conversations.</p><Button onClick={restart}><RotateCcw size={18}/> Nouvelle séance</Button></div>:
    <section className="boost-card">
      {step===0&&<><span className="boost-kicker"><Sparkles size={18}/> Retrouve de mémoire</span><h2>Quelle expression correspond à ce sens ?</h2><p className="boost-cue">{word.meaning}</p><label htmlFor="guess">Ta réponse, sans regarder</label><input id="guess" className="boost-field" value={guess} onChange={e=>setGuess(e.target.value)} onKeyDown={e=>e.key==='Enter'&&setStep(1)} placeholder="Dis-la d'abord à voix haute…"/><small className="boost-hint">Essaie même si tu hésites : le rappel actif entraîne ta mémoire.</small><Button className="full" onClick={()=>setStep(1)}>Découvrir la réponse <ArrowRight size={18}/></Button></>}
      {step===1&&<><span className="boost-kicker"><Headphones size={18}/> Écoute, puis imite</span><h2>{word.term}</h2>{word.translation_ar&&<p lang="ar" dir="rtl" className="boost-ar">{word.translation_ar}</p>}{guess&&<p className="boost-hint">{normalize(guess)===normalize(word.term)?'Bonne réponse !':'Compare avec ton essai, puis répète la bonne expression.'}</p>}<div className="boost-example"><small>EN CONTEXTE</small><p>{word.example||word.term}</p></div><button className="boost-listen" onClick={()=>speak(word.example||word.term)}><Volume2 size={20}/> Écouter la phrase</button><p className="boost-hint">Répète trois fois en imitant le rythme et l’intonation.</p><Button className="full" onClick={()=>setStep(2)}>Je l’ai répétée <ArrowRight size={18}/></Button></>}
      {step===2&&<><span className="boost-kicker"><Mic size={18}/> Parle de ta vraie vie</span><h2>À toi de parler !</h2><div className="boost-term"><strong>{word.term}</strong><WordSpeaker compact text={word.term}/></div><p className="boost-context">{situationFor(word.category)}</p><div className="boost-voice"><button disabled={!voice.supported} onClick={voice.listening?voice.stop:voice.start} aria-label={voice.listening?'Arrêter le micro':'Dicter ta phrase'} className={voice.listening?'recording':''}>{voice.supported?<Mic size={23}/>:<MicOff size={23}/>}</button><span>{voice.listening?'Je t’écoute…':voice.supported?'Dicter ma phrase':'Micro non pris en charge'}<small>Ou écris ci-dessous</small></span></div>{voice.error&&<p role="alert" className="boost-error">{voice.error}</p>}{voice.transcript&&<p className="boost-capture">Transcription : « {voice.transcript} »</p>}<label htmlFor="personal">Ta phrase personnelle</label><textarea id="personal" className="boost-field" rows={2} maxLength={500} value={sentence} onChange={e=>setSentence(e.target.value)} placeholder="Par exemple : au travail, j’ai tiqué quand…"/>{candidate&&<p className="boost-hint">{containsExpression(candidate,word.term)?'Expression détectée.':'Expression exacte non détectée.'} Ce contrôle ne corrige pas la grammaire.</p>}<Button className="full" disabled={!candidate} onClick={save}>Enregistrer ma phrase <Check size={18}/></Button><button className="boost-skip" onClick={()=>setStep(3)}>Passer cette étape</button></>}
      {step===3&&<><span className="boost-kicker"><CircleCheck size={18}/> Autoévaluation</span><h2>Est-ce que l’expression te vient facilement ?</h2><div className="boost-term"><strong>{word.term}</strong><WordSpeaker compact text={word.term}/></div>{(saved||word.personal_example)&&<p className="boost-personal"><small>TA PHRASE PERSONNELLE</small>« {saved||word.personal_example} »</p>}<p className="boost-hint">Si tu reconnais le mot mais n’arrives pas à l’utiliser seul, choisis « Difficile ».</p><div className="boost-grades">{ratings.map(r=><button key={r.id} className={'grade '+r.tone} onClick={()=>rate(r.id)}><strong>{r.label}</strong><small>{r.hint}</small></button>)}</div></>}
      {step>0&&step<3&&<button className="boost-back" onClick={()=>setStep(i=>i-1)}><ChevronLeft size={15}/> Étape précédente</button>}
    </section>}
    <details className="boost-resources"><summary><Lightbulb size={17}/> Français naturel : vidéos YouTube</summary><p>Écoute un court passage, puis répète-le sans lire les sous-titres.</p>{videos.map(v=><a key={v.url} href={v.url} target="_blank" rel="noopener noreferrer">{v.label} ↗</a>)}</details>
  </div>
}
