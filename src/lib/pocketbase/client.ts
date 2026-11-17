import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

// GUARDA DE ESTABILIDADE: mantenha o DUPLO EXPORT (default + nomeado `pb`).
// Remover qualquer um dos dois já quebrou o build 27 vezes (regressão recorrente).
export { pb }
export default pb
