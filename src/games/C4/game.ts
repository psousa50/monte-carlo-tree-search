type Player = "X" | "O"
type Piece = "X" | "O" | "."

export interface Move {
  position: number
  piece: Piece
}

export type Board = Piece[]

export interface GameState {
  board: Board
  player: Player
}

export const otherPlayer = (player: Player): Player => (player === "X" ? "O" : "X")

export const create = (): GameState => ({
  board: Array<Piece>(7 * 6).fill("."),
  player: "X",
})

export const availableMoves = (state: GameState): Move[] =>
  state.board
    .map((p, i) => (p === "." ? i : -1))
    .filter((i) => i > 0)
    .map((i) => ({
      piece: state.player as Piece,
      position: i,
    }))

export const move = (state: GameState, { piece, position }: Move) => {
  const board = state.board.map((h, i) => (i === position ? piece : h))
  const newState = {
    ...state,
    board,
  }
  return {
    ...newState,
    player: isFinal(newState) ? newState.player : otherPlayer(newState.player),
  }
}

export const nextMove = (state: GameState) => {
  const moves = availableMoves(state)
  return moves.length > 0 ? moves[0] : undefined
}

const winningPositions = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]

export const playerWins = (board: Board, piece: Piece) =>
  winningPositions.some((wp) => wp.every((p) => board[p] === piece))

export const isFinal = (state: GameState) => playerWins(state.board, "X") || playerWins(state.board, "O")
