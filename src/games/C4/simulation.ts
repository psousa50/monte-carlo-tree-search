import * as MCTS from "../../mcts"
import * as C4 from "./game"

const playerPiece = (playerIndex: number) => (playerIndex === 0 ? "X" : "O")

const calcScore = (state: C4.GameState, playerIndex: number) =>
  state.board[4] === playerPiece(playerIndex) ? 1 : state.board[4] === playerPiece(1 - playerIndex) ? -1 : 0

const calcScores = (state: C4.GameState) => [calcScore(state, 0), calcScore(state, 1)]

const currentPlayerIndex = (state: C4.GameState) => (state.player === "X" ? 0 : 1)

const gameLogic: MCTS.GameRules<C4.GameState, C4.Move> = {
  availableMoves: C4.availableMoves,
  currentPlayerIndex,
  isFinal: C4.isFinal,
  nextMove: C4.nextMove,
  nextState: C4.move,
  playersCount: () => 2,
}

const config: MCTS.Config<C4.GameState, C4.Move> = {
  calcScores,
  calcUct: MCTS.defaultUctFormula(),
  gameRules: gameLogic,
}

const run = () => {
  const game = C4.create()

  const { tree } = MCTS.findBestNode(MCTS.createTree(config)(game, 0), { timeLimitMs: 5000 })

  const rootNodes = MCTS.getChildren(tree)(MCTS.getRoot(tree))

  console.log("=====>\n", rootNodes)
}

run()
