import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

export default pb

// Guarda: manter sempre o DUPLO EXPORT (default + nomeado) — o build quebra
// com ~20 erros de import se o export nomeado `pb` sumir (regressão recorrente).
export { pb }
