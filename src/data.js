import { createClient } from '@supabase/supabase-js'
import { makeWord, normalize, newId } from './learning.js'
import { starter } from './starter.js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
export const supabase = url && key ? createClient(url, key, {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}) : null
const WORDS_KEY = 'motamot:words:v1'
const LOGS_KEY = 'motamot:reviews:v1'

const read = (key) => {
  try { const data=JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(data)?data:[] } catch { return [] }
}
export const localWords = () => read(WORDS_KEY).map(makeWord)
export const localReviews = () => read(LOGS_KEY)
export const storeLocal = (words, reviews) => {
  localStorage.setItem(WORDS_KEY,JSON.stringify(words))
  localStorage.setItem(LOGS_KEY,JSON.stringify(reviews))
}
export async function getCloudData() {
  if (!supabase) return {words:[],reviews:[]}
  const [{data:words,error:e1},{data:reviews,error:e2}] = await Promise.all([
    supabase.from('vocab_words').select('*').order('created_at',{ascending:false}),
    supabase.from('vocab_reviews').select('*').order('reviewed_at',{ascending:false}).limit(3000)
  ])
  if (e1 || e2) throw (e1 || e2)
  return {words:(words||[]).map(makeWord), reviews:reviews||[]}
}
export async function putWord(word, user) {
  if (!user || !supabase) return
  const {error} = await supabase.from('vocab_words').upsert({...word,user_id:user.id})
  if (error) throw error
}
export async function putReview(review, user) {
  if (!user || !supabase) return
  const {error} = await supabase.from('vocab_reviews').insert({...review,user_id:user.id})
  if (error) throw error
}
export function addStarter(existing) {
  const seen=new Set(existing.map(w=>normalize(w.term)))
  const added=starter.filter(w=>!seen.has(normalize(w.term))).map(makeWord)
  return {words:[...added,...existing], count:added.length, added}
}
export function download(filename,content,type='application/json') {
  const blob=new Blob([content],{type})
  const link=document.createElement('a')
  link.href=URL.createObjectURL(blob)
  link.download=filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(()=>URL.revokeObjectURL(link.href),1000)
}
function splitCsv(data) {
  const records=[]; let row=[],field='',quoted=false
  for(let i=0;i<data.length;i++) {
    const c=data[i]
    if(c==='"' && quoted && data[i+1]==='"') {field+='"';i++}
    else if(c==='"') quoted=!quoted
    else if(c===',' && !quoted) {row.push(field);field=''}
    else if((c==='\n'||c==='\r') && !quoted) {
      if(c==='\r' && data[i+1]==='\n') i++
      row.push(field);if(row.some(Boolean)) records.push(row)
      row=[];field=''
    } else field+=c
  }
  row.push(field);if(row.some(Boolean)) records.push(row)
  return records
}
export function parseImport(text, filename='') {
  let values
  if(filename.toLowerCase().endsWith('.json') || text.trim().startsWith('[')) {
    const json=JSON.parse(text)
    if(!Array.isArray(json)) throw Error('Le JSON doit contenir une liste de mots.')
    values=json
  } else {
    const rows=splitCsv(text.replace(/^\uFEFF/,''))
    const headers=(rows.shift()||[]).map(v=>v.trim().toLowerCase())
    if(!headers.includes('term')) throw Error('La colonne « term » est nécessaire.')
    values=rows.map(row=>Object.fromEntries(headers.map((k,i)=>[k,row[i]||''])))
  }
  return values.filter(v=>v && typeof v.term==='string' && v.term.trim()).map(v=>makeWord({...v,id:newId(), created_at:new Date().toISOString(), due_at:new Date().toISOString(), interval_days:0,reps:0,lapses:0,ease:2.5}))
}
export function mergeWords(existing,incoming){
  const seen=new Set(existing.map(w=>normalize(w.term)))
  const added=incoming.filter(w=>!seen.has(normalize(w.term)))
  return {added,words:[...added,...existing]}
}
export function toCsv(words) {
  const headers=['term','meaning','translation_ar','example','category','source','learned_on']
  const esc=v=>'"'+String(v??'').replaceAll('"','""')+'"'
  return [headers.join(','),...words.map(w=>headers.map(h=>esc(w[h])).join(','))].join('\r\n')
}
