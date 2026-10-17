import { supabase } from './data.js'
import { HISTORY_SLUG } from './historyUtils.js'

/** Bundled PWA resource first; Supabase read-only public catalog is the fallback. */
export async function loadHistoryCatalog() {
  try {
    const response=await fetch(import.meta.env.BASE_URL+'history-2026-10-16.json')
    if(!response.ok)throw Error('Impossible de charger le pack local.')
    const items=await response.json()
    if(!Array.isArray(items)||!items.length)throw Error('Pack de vocabulaire invalide.')
    return items
  }catch(localError){
    if(!supabase)throw localError
    const {data,error}=await supabase.from('vocab_history_catalog')
      .select('term,meaning,translation_ar,example,category,learned_on,source')
      .eq('pack_slug',HISTORY_SLUG).order('id').limit(500)
    if(error||!data?.length)throw localError
    return data
  }
}
