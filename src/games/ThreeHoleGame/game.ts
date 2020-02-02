export type Player = "X" | "O"
export type Piece = "X" | "O" | "."

export interface Move {
  position: number
  piece: Piece
}

export interface GameState {
  holes: Piece[]
  player: Player
}

export const otherPlayer = (player: Player): Player => (player === "X" ? "O" : "X")

export const create = (): GameState => ({
  holes: [".", ".", "."],
  player: "X",
})

export const availableMoves = (state: GameState): Move[] =>
  state.holes
    .map((h, i) => (h === "." ? i : undefined))
    .filter(i => i != undefined)
    .map(i => ({
      piece: state.player as Piece,
      position: i!,
    }))

export const move = (state: GameState, { piece, position }: Move) => {
  const holes = state.holes.map((h, i) => (i === position ? piece : h))
  const newState = {
    ...state,
    holes,
  }
  return {
    ...newState,
    player: isFinal(newState) ?  newState.player : otherPlayer(newState.player),
  }
}

export const isFinal = (state: GameState) => state.holes[1] !== "."
