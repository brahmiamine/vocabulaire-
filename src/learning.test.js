import test from 'node:test'
import assert from 'node:assert/strict'
import { makeWord, schedule, normalize, isDue, streak } from './learning.js'

test('normalisation des réponses', () => {
  assert.equal(normalize('  À   FROID !'), 'a froid')
  assert.equal(normalize("J’ai tiqué"), "j'ai tique")
})
test('premier rappel bon après un jour', () => {
  const w = makeWord({term:'tiquer'})
  const at = new Date('2026-10-17T12:00:00Z')
  const result = schedule(w, 'good', at)
  assert.equal(result.reps,1)
  assert.equal(result.due_at,'2026-10-18T12:00:00.000Z')
  assert.equal(isDue(result,at.getTime()),false)
})
test('oubli remet à 10 min et augmente les échecs',()=>{
  const w=makeWord({term:'stagner',reps:3,interval_days:8})
  const result=schedule(w,'again',new Date('2026-10-17T12:00:00Z'))
  assert.equal(result.reps,0)
  assert.equal(result.lapses,1)
  assert.equal(result.due_at,'2026-10-17T12:10:00.000Z')
})
test('révision facile augmente la durée',()=>{
  const w=makeWord({term:'malin',reps:3,interval_days:6})
  assert.ok(schedule(w,'easy').interval_days > schedule(w,'hard').interval_days)
})
test('streak sur jours consécutifs',()=>{
  const rs=['2026-10-16','2026-10-15'].map(d=>({reviewed_at:d+'T12:00:00Z'}))
  assert.equal(streak(rs,'2026-10-17'),2)
})
