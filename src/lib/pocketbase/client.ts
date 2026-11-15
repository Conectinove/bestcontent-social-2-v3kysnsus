import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

export default pb

// GUARDA: manter sempre o export nomeado também — regressão silenciosa já 12x
export { pb }
