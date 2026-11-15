import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

export default pb
// GUARDA: manter SEMPRE o export nomeado também — a 19ª regressão de "pb is not exported"
// aconteceu porque um edit removeu esta linha; qualquer rodada que toque imports de pb
// deve conferir este duplo export (default + nomeado) antes de commitar.
export { pb }
