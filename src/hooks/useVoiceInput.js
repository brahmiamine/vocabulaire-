import { useEffect, useRef, useState } from 'react'

export function useVoiceInput() {
  const [transcript,setTranscript] = useState('')
  const [listening,setListening] = useState(false)
  const [error,setError] = useState('')
  const recognition = useRef(null)
  const supported = typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  const stop = () => { recognition.current?.stop(); setListening(false) }
  const clear = () => { recognition.current?.abort(); setTranscript(''); setError(''); setListening(false) }
  const start = () => {
    if (!supported) { setError('Micro indisponible. Tu peux écrire la phrase.'); return }
    recognition.current?.abort()
    const Engine = window.SpeechRecognition || window.webkitSpeechRecognition
    const r = new Engine()
    r.lang='fr-FR';r.interimResults=false;r.maxAlternatives=1
    r.onresult=e=>{setTranscript(e.results[0][0].transcript);setListening(false)}
    r.onerror=()=>{setError('Transcription impossible. Écris ta phrase à la place.');setListening(false)}
    r.onend=()=>setListening(false)
    recognition.current=r
    setError('')
    try{r.start();setListening(true)}catch{setError('Activation du micro impossible.');setListening(false)}
  }
  useEffect(()=>()=>recognition.current?.abort(),[])
  return {transcript,listening,error,supported,start,stop,clear}
}
