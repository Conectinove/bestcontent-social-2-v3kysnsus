import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

// GUARDA DE REGRESSÃO: manter SEMPRE o duplo export (default + nomeado) —
// rodadas anteriores já perderam o export nomeado 11 vezes e quebraram o build.
export default pb
export { pb }
