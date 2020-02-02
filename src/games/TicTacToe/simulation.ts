import * as MCTS from "../../mcts"
import * as TicTacToe from "./game"

const playerPiece = (playerIndex: number) => playerIndex === 0 ? "X" : "O"

const calcScore = (state: TicTacToe.GameState, playerIndex: number) =>
  state.board[4] === playerPiece(playerIndex) ? 1 : state.board[4] === playerPiece(1 - playerIndex) ? -1 : 0

const calcScores = (state: TicTacToe.GameState) => [calcScore(state, 0), calcScore(state, 1)]

const currentPlayerIndex = (state: TicTacToe.GameState) => state.player === "X" ? 0 : 1

const gameLogic: MCTS.GameLogic<TicTacToe.GameState, TicTacToe.Move> = {
  availableMoves: TicTacToe.availableMoves,
  calcScores,
  currentPlayerIndex,
  isFinal: TicTacToe.isFinal,
  nextState: TicTacToe.move,
  playerCount: () => 2,
}

const config: MCTS.Config<TicTacToe.GameState, TicTacToe.Move> = {
  calcUcb: MCTS.defaultUcbFormula(),
  gameLogic,
  nextMove: TicTacToe.nextMove,
}

const run = () => {
  const game = TicTacToe.create()

  const { tree } = MCTS.findBestNode(MCTS.createTree(config)(game, 0), 60)

  const rootNodes = MCTS.getChildren(tree)(MCTS.getRoot(tree))

  console.log("=====>\n", rootNodes)
}

run()
