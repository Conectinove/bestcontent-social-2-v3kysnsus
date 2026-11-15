import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

// GUARDA: duplo export é obrigatório — já regrediu 23× (não remover `export { pb }`).
export { pb }
export default pb
