import test from 'node:test'
import assert from 'node:assert/strict'
import { prepareHistoryImport,HISTORY_SLUG } from './historyUtils.js'
const e=(term)=>({term,meaning:'Définition',translation_ar:'معنى',example:'Un exemple',category:'Expressions'})
test('stable pack identifier',()=>assert.equal(HISTORY_SLUG,'chatgpt-2026-10-16'))
test('accent and apostrophe aware deduplication',()=>assert.equal(prepareHistoryImport([{term:"J’ai tiqué"}],[e("J'ai tiqué"),e('Tiquer')]).length,1))
test('deduplicates within incoming pack',()=>assert.equal(prepareHistoryImport([],[e('A froid'),e('À froid')]).length,1))
test('preserves imported date and Fusha',()=>{const r=prepareHistoryImport([],[e('Stagner')])[0];assert.equal(r.learned_on,'2026-10-16');assert.equal(r.translation_ar,'معنى')})
test('invalid data safely ignored',()=>assert.equal(prepareHistoryImport(null,[null,{},e('')]).length,0))
test('existing word progress is unchanged',()=>{const old=[{term:'Tiquer',reps:4}];prepareHistoryImport(old,[e('Tiquer')]);assert.equal(old[0].reps,4)})

import { stageHistoryPack } from './historyUtils.js'
import { readFileSync } from 'node:fs'

test('public vocabulary pack contains 132 complete words',()=>{
  const pack=JSON.parse(readFileSync(new URL('../public/history-2026-10-16.json',import.meta.url),'utf8'))
  assert.equal(pack.length,132)
  assert.equal(new Set(pack.map(item=>item.term.toLowerCase())).size,132)
  assert.ok(pack.every(w=>w.meaning&&w.translation_ar&&w.example))
})
test('guest review queue introduces eight due words on the first day',()=>{
  const now=new Date('2026-10-17T12:00:00Z')
  const pack=Array.from({length:18},(_,i)=>e('Expression '+i))
  const staged=stageHistoryPack([],pack,now)
  assert.equal(staged.length,18)
  assert.equal(staged.filter(w=>w.due_at===now.toISOString()).length,8)
  assert.equal(staged.filter(w=>w.due_at==='2026-10-18T12:00:00.000Z').length,8)
  assert.equal(staged.filter(w=>w.due_at==='2026-10-19T12:00:00.000Z').length,2)
})
test('guest onboarding never overwrites a prior saved review',()=>{
  const existing=[{term:'Tiquer',reps:10,lapses:2,personal_example:'J’ai tiqué'}]
  const result=stageHistoryPack(existing,[e('Tiquer'),e('Malin')],new Date('2026-10-17T12:00:00Z'))
  assert.deepEqual(result.map(w=>w.term),['Malin'])
  assert.equal(existing[0].reps,10)
  assert.equal(existing[0].personal_example,'J’ai tiqué')
})
test('malformed date never produces invalid scheduled words',()=>{
  assert.deepEqual(stageHistoryPack([],[e('Malin')],new Date(NaN)),[])
})
