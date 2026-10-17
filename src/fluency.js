import { isDue, normalize } from './learning.js'

export function planSession(words, { at = Date.now(), limit = 5 } = {}) {
  if (!Array.isArray(words) || !Number.isFinite(limit) || limit <= 0) return []
  return words.filter(w => w && w.id && !w.archived)
    .sort((a,b) => Number(isDue(b,at)) - Number(isDue(a,at))
      || Number(b.lapses || 0)-Number(a.lapses || 0)
      || Number(a.reps || 0)-Number(b.reps || 0)
      || new Date(a.due_at || 0) - new Date(b.due_at || 0))
    .slice(0,Math.floor(limit)).map(w=>w.id)
}
// Detecting words in a transcript does not establish naturalness, grammar, or accent.
export function containsExpression(sentence, term) {
  const phrase = normalize(sentence), target = normalize(term)
  return !!(phrase && target && (' ' + phrase + ' ').includes(' ' + target + ' '))
}
export function situationFor(category) {
  if (category === 'Travail') return 'Explique quelque chose à un collègue pendant une réunion.'
  if (category === 'Voyage') return 'Raconte un petit imprévu pendant un déplacement.'
  if (category === 'Expressions') return 'Raconte à un ami une situation qui t’est arrivée cette semaine.'
  return 'Raconte un détail de ta journée à un ami ou à ton partenaire.'
}
