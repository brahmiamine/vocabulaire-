import { makeWord, normalize } from './learning.js'

export const HISTORY_SLUG='chatgpt-2026-10-16'
export function prepareHistoryImport(existing, catalog) {
  if(!Array.isArray(catalog))return []
  const known=new Set((Array.isArray(existing)?existing:[]).map(w=>normalize(w?.term)))
  const added=[]
  for(const w of catalog) {
    if(!w || typeof w.term!=='string' || typeof w.meaning!=='string')continue
    const key=normalize(w.term)
    if(!key || !w.meaning.trim() || known.has(key))continue
    known.add(key)
    added.push(makeWord({term:w.term,meaning:w.meaning,translation_ar:w.translation_ar||'',example:w.example||'',category:w.category||'Quotidien',source:'Vocabulaire du 16 octobre',learned_on:'2026-10-16'}))
  }
  return added
}
