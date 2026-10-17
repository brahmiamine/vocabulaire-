import test from 'node:test'
import assert from 'node:assert/strict'
import { planSession, containsExpression, situationFor } from './fluency.js'
import { makeWord, schedule } from './learning.js'

test('prioritizes due words and excludes archived ones', () => {
  const words=[
    makeWord({id:'later',term:'later',due_at:'2027-01-01T00:00:00Z',reps:3}),
    makeWord({id:'due',term:'due',due_at:'2026-10-16T00:00:00Z'}),
    makeWord({id:'old',term:'old',archived:true})]
  assert.deepEqual(planSession(words,{at:Date.parse('2026-10-17'),limit:3}),['due','later'])
  assert.deepEqual(planSession(words,{at:Date.parse('2026-10-17'),limit:1}),['due'])
})
test('invalid limits or missing words return empty',()=>{
  assert.deepEqual(planSession(null),[])
  assert.deepEqual(planSession([{id:'1'}],{limit:-1}),[])
})
test('expression boundaries and accents',()=>{
  assert.equal(containsExpression('J’ai tiqué hier.','tiqué'),true)
  assert.equal(containsExpression('C’est malinette','malin'),false)
  assert.equal(containsExpression('','test'),false)
})
test('gives practical context',()=>{
  assert.match(situationFor('Travail'),/collègue/)
  assert.match(situationFor('Expressions'),/ami/)
})
test('personal example survives spaced repetition',()=>{
  const w=makeWord({term:'galérer',personal_example:'Je galère au travail'})
  assert.equal(schedule(w,'good').personal_example,'Je galère au travail')
})
