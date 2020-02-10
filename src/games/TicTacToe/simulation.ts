import * as MCTS from "../../mcts"
import * as TicTacToe from "./game"

const playerPiece = (playerIndex: number) => playerIndex === 0 ? "X" : "O"

const calcScore = (state: TicTacToe.GameState, playerIndex: number) =>
  state.board[4] === playerPiece(playerIndex) ? 1 : state.board[4] === playerPiece(1 - playerIndex) ? -1 : 0

const calcScores = (state: TicTacToe.GameState) => [calcScore(state, 0), calcScore(state, 1)]

const currentPlayerIndex = (state: TicTacToe.GameState) => state.player === "X" ? 0 : 1

const gameLogic: MCTS.GameRules<TicTacToe.GameState, TicTacToe.Move> = {
  availableMoves: TicTacToe.availableMoves,
  currentPlayerIndex,
  isFinal: TicTacToe.isFinal,
  nextMove: TicTacToe.nextMove,
  nextState: TicTacToe.move,
  playersCount: () => 2,
}

const config: MCTS.Config<TicTacToe.GameState, TicTacToe.Move> = {
  calcScores,
  calcUcb: MCTS.defaultUcbFormula(),
  gameRules: gameLogic,
}

const run = () => {
  const game = TicTacToe.create()

  const { tree } = MCTS.findBestNode(MCTS.createTree(config)(game, 0), { timeLimitMs: 5000 })

  const rootNodes = MCTS.getChildren(tree)(MCTS.getRoot(tree))

  console.log("=====>\n", rootNodes)
}

run()
