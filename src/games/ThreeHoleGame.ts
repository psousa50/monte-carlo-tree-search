import * as R from "ramda"

type Player = "X" | "O"
type Piece = "X" | "O" | "."

interface Move {
  position: number
  piece: Piece
}

interface GameState {
  holes: Piece[]
  player: Player
}

const otherPlayer = (player: Player): Player => (player === "X" ? "O" : "X")

export const create = (): GameState => ({
  holes: [".", ".", "."],
  player: "X",
})

export const availableMoves = (state: GameState) =>
  state.holes
    .map((h, i) => (h === "." ? i : undefined))
    .filter(i => i != undefined)
    .map(i => ({
      player: state.player,
      position: i,
    }))

export const move = (state: GameState, { piece, position }: Move) => ({
  holes: state.holes.map((h, i) => (i === position ? piece : h)),
  player: otherPlayer(state.player),
})

export const nextMove = (state: GameState) => {
  const moves = availableMoves(state)
  return moves.length > 0 ? moves[0] : undefined
}

export const isFinal = (state: GameState) => state.holes[1] !== "."

export const calcValue = (state: GameState) =>
  state.holes[1] === state.player ? 1 : state.holes[1] === otherPlayer(state.player) ? -1 : undefined
