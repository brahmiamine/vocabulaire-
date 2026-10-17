import test from 'node:test'
import assert from 'node:assert/strict'
import { planSession, containsExpression, situationFor } from './fluency.js'
import { makeWord, schedule, isDue } from './learning.js'

const now=Date.parse('2026-10-17T12:00:00Z')
const word=(id,options={})=>makeWord({id,term:id,due_at:'2026-10-18T12:00:00Z',...options})

test('overdue cards come first even when another has many lapses',()=>{
 const ids=planSession([word('later',{lapses:12}),word('due',{due_at:'2026-10-16T12:00:00Z'})],{at:now})
 assert.deepEqual(ids,['due','later'])
})
test('more forgotten words come first when both are due',()=>{
 assert.deepEqual(planSession([word('low',{due_at:'2026-10-16',lapses:0}),word('high',{due_at:'2026-10-16',lapses:4})],{at:now}),['high','low'])
})
test('new words precede familiar words of equal priority',()=>{
 assert.deepEqual(planSession([word('known',{reps:5}),word('new',{reps:0})],{at:now}),['new','known'])
})
test('session size is bounded and fractional limits are floored',()=>{
 assert.deepEqual(planSession([word('one'),word('two'),word('three')],{at:now,limit:2.7}).length,2)
 assert.deepEqual(planSession([word('one')],{at:now,limit:0}),[])
})
test('does not alter the order of source words',()=>{
 const words=[word('old',{reps:4}),word('new',{reps:0})]
 planSession(words,{at:now})
 assert.deepEqual(words.map(w=>w.id),['old','new'])
})
test('archived-only collections never produce a practice card',()=>{
 assert.deepEqual(planSession([word('archived',{archived:true})],{at:now}),[])
})
test('accent, apostrophe and case insensitive full phrase check',()=>{
 assert.equal(containsExpression("J'AI TIQUÉ quand j'ai vu le prix",'j’ai tiqué'),true)
 assert.equal(containsExpression('Ça se passe à froid.', 'À FROID'),true)
})
test('a substring is not confused with a whole word',()=>{
 assert.equal(containsExpression('un revendeur','vendeur'),false)
 assert.equal(containsExpression('malinette','malin'),false)
})
test('situations have fallback for unknown categories',()=>{
 assert.match(situationFor('Autres'),/journée/)
 assert.match(situationFor('Voyage'),/déplacement/)
})
test('schedule keeps a personal sentence at easy and again',()=>{
 const w=word('tiquer',{personal_example:"J'ai tiqué sur le prix."})
 for(const grade of ['again','hard','good','easy']){
  const next=schedule(w,grade,new Date(now))
  assert.equal(next.personal_example,w.personal_example)
  assert.equal(isDue(next,now),false)
 }
})
