// import * as MCTS from "../../mcts"
// import * as TicTacToe from "./TicTacToe"

// const calcNodeValue = (state: TicTacToe.GameState) =>
//   TicTacToe.playerWins(state.board, "X") ? 1 : TicTacToe.playerWins(state.board, "O") ? -1 : undefined

// const strategy: MCTS.Strategy<TicTacToe.GameState, TicTacToe.Move> = {
//   availableMoves: TicTacToe.availableMoves,
//   calcValue: calcNodeValue,
//   isFinal: TicTacToe.isFinal,
//   nextMove: TicTacToe.nextMove,
//   nextState: TicTacToe.move,
// }

// const config: MCTS.Config<TicTacToe.GameState, TicTacToe.Move> = {
//   calcUcb: MCTS.defaultUcbFormula(),
//   strategy,
// }

// const run = () => {

//   const game = TicTacToe.create()

//   const { tree } = MCTS.findBestNode(MCTS.createTree(config)(game, {}), 60)

//   const rootNodes = MCTS.getChildren(tree)(MCTS.getRoot(tree))

//   console.log("=====>\n", rootNodes)

// }

// run()
