import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

// GUARDA: duplo export obrigatório (default + nomeado). O export nomeado `pb`
// já regrediu 25× (última: v0.0.298 derrubou o build com 35 erros) — NÃO remover.
export { pb }
export default pb
