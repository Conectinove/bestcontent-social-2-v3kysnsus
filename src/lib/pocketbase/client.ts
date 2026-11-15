import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

export default pb

// GUARDA: manter sempre o export nomeado também — já quebrou o build 12x
export { pb }
