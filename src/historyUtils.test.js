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
