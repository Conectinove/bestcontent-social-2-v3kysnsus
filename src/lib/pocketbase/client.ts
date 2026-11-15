import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

// ⚠️ GUARDA (22 regressões): o export NOMEADO `pb` é importado por dezenas de
// módulos (services/*) — nunca removê-lo. Manter SEMPRE o duplo export abaixo.
export { pb }
export default pb
