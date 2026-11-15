import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

// GUARDA (regressão recorrente): manter SEMPRE o duplo export —
// default + nomeado `pb` (vários serviços importam { pb as pbNamed }).
export { pb }
export default pb
