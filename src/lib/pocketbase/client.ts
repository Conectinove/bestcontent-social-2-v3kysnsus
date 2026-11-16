import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

// GUARDA: o export nomeado `pb` já foi perdido 8× (v0.0.179, 181, 188, 190,
// 221, 245, 246, 263 e de novo na v0.0.293) e quebrou imports em todo o app.
// NUNCA remover: o app importa tanto `pb` (default) quanto `{ pb }` (nomeado).
export { pb }
export default pb
