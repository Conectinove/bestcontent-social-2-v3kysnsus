import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

export default pb

// GUARDA DE REGRESSÃO (v0.0.225): manter SEMPRE o duplo export.
// Rodadas anteriores já quebraram o build 9 vezes por perder o export nomeado.
export { pb }
