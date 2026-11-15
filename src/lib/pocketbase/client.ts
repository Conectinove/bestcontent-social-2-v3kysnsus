import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

export default pb
// Guarda contra regressão (já perdeu 16x): manter o export NOMEADO também.
export { pb }
