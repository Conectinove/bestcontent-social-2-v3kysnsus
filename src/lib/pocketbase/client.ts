import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

// GUARDA: manter SEMPRE o duplo export (default + nomeado). Já houve 16 regressões
// que removeram `export { pb }` e quebraram o build com [MISSING_EXPORT] "pb".
export default pb
export { pb }
