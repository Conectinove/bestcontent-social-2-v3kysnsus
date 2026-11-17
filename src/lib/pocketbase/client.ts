import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

export default pb

// GUARDA: o export nomeado `pb` já regrediu 25× (v0.0.179, 181, 188, 190, 221,
// 245, 246, 263, 298...). NÃO REMOVER — vários módulos importam `{ pb }`.
export { pb }
