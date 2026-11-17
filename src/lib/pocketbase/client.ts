import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

// GUARDA: duplo export do pb — já regrediu 28× (v0.0.179/181/188/190/221/245/246/263/302).
// NÃO remover o export nomeado: vários imports usam `import { pb } from '.../client'`.
export { pb }
export default pb
