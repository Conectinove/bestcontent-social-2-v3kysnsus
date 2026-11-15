import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

// GUARDA de regressão (v0.0.286): manter SEMPRE o duplo export — default e
// nomeado. Rodadas anteriores já perderam `export { pb }` várias vezes e o
// build quebrou em todos os arquivos que importam `{ pb }`.
export { pb }
export default pb
