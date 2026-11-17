import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

// GUARDA: manter SEMPRE o duplo export (default + nomeado). Este export nomeado
// já foi perdido 25 vezes por reescritas do arquivo e quebra toda a app
// (v0.0.211, v0.0.298 etc.) — não remover `export { pb }`.
export { pb }
export default pb
