// Transparent SM-2-inspired scheduler. Product heuristic, not a validated FSRS implementation.
export const DAY = 86400000
export const today = () => new Date().toLocaleDateString('en-CA')
export const newId = () => globalThis.crypto?.randomUUID?.() || 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2)
export const normalize = text => String(text ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’']/g, "'").replace(/[^a-z0-9' ]/gi, '').replace(/\s+/g, ' ').trim().toLowerCase()
export const isDue = (word, at = Date.now()) => !word.archived && new Date(word.due_at || 0).getTime() <= at
export const makeWord = (fields = {}) => ({
  id: fields.id || newId(),
  term: (fields.term || '').trim(),
  meaning: (fields.meaning || '').trim(),
  translation_ar: (fields.translation_ar || '').trim(),
  example: (fields.example || '').trim(),
  personal_example: (fields.personal_example || '').trim(),
  category: fields.category || 'Quotidien',
  source: fields.source || 'Personnel',
  learned_on: fields.learned_on || today(),
  created_at: fields.created_at || new Date().toISOString(),
  due_at: fields.due_at || new Date().toISOString(),
  interval_days: Number(fields.interval_days ?? 0),
  ease: Number(fields.ease ?? 2.5),
  reps: Number(fields.reps ?? 0),
  lapses: Number(fields.lapses ?? 0),
  archived: !!fields.archived,
})
export function schedule(word, rating, at = new Date()) {
  if (!['again','hard','good','easy'].includes(rating)) throw Error('Note inconnue')
  const ease = Math.max(1.3, (word.ease || 2.5) + ({ again: -0.2, hard: -0.15, good: 0, easy: 0.15 })[rating])
  const reps = rating === 'again' ? 0 : (word.reps || 0) + 1
  let interval
  if (rating === 'again') interval = 10 / 1440 // retest after ~10 minutes
  else if (rating === 'hard') interval = Math.max(1, Math.round((word.interval_days || 0) * 1.2))
  else if (rating === 'good') interval = !word.reps ? 1 : word.reps === 1 ? 3 : Math.max(3, Math.round((word.interval_days || 1) * ease))
  else interval = !word.reps ? 4 : Math.max(4, Math.round((word.interval_days || 1) * ease * 1.3))
  return {
    ...word, ease, reps, interval_days: interval,
    lapses: (word.lapses || 0) + (rating === 'again' ? 1 : 0),
    due_at: new Date(at.getTime() + interval * DAY).toISOString()
  }
}
export function streak(reviews, current = today()) {
  const days = new Set(reviews.map(r => new Date(r.reviewed_at).toLocaleDateString('en-CA')))
  let day = new Date(current + 'T12:00:00')
  if (!days.has(day.toLocaleDateString('en-CA'))) day.setDate(day.getDate() - 1)
  let count = 0
  while (days.has(day.toLocaleDateString('en-CA'))) {
    count++
    day.setDate(day.getDate() - 1)
  }
  return count
}
export const speak = text => {
  if (!('speechSynthesis' in window)) return false
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'fr-FR'
  utterance.rate = 0.85
  window.speechSynthesis.speak(utterance)
  return true
}
