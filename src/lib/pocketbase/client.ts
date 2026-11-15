import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

export default pb

// GUARDA: manter SEMPRE o export nomeado também — várias rodadas já perderam
// este export (regressão silenciosa quebra imports `import { pb } from ...`).
export { pb as pb }
