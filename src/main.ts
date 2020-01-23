import * as TicTacToe from "../src/games/TicTacToe"
import * as MCTS from "../src/mcts"

const calcNodeValue = (state: TicTacToe.GameState) =>
  TicTacToe.playerWins(state.board, "X") ? 1 : TicTacToe.playerWins(state.board, "O") ? -1 : undefined

const strategy: MCTS.Strategy<TicTacToe.GameState, TicTacToe.Move> = {
  availableMoves: TicTacToe.availableMoves,
  calcValue: calcNodeValue,
  isFinal: TicTacToe.isFinal,
  nextMove: TicTacToe.nextMove,
  nextState: TicTacToe.move,
}

// const calcUcb = (_: MCTS.Tree) => (node: MCTS.Node) => 100 - node.visits

const config: MCTS.Config<TicTacToe.GameState, TicTacToe.Move> = {
  calcUcb: MCTS.defaultUcbFormula(),
  strategy,
}

const run = () => {

  const game = TicTacToe.create()

  const { tree, node } = MCTS.findBestNode(MCTS.createTree(config)(game), 60)

  const rootNodes = MCTS.getChildren(tree)(MCTS.getRoot(tree))

  // console.log("FINAL TREE=====>\n", JSON.stringify(tree, null, 2))
  // console.log("ROOT NODES=====>\n", JSON.stringify(rootNodes, null, 2))

  console.log("BEST NODE=====>\n", node)

}

run()

// console.log("=====>\n", Math.log(2))
