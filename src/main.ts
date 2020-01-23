// import * as ThreeHoleGame from "../src/games/ThreeHoleGame"
// import * as MCTS from "../src/mcts"

// const calcNodeValue = (state: ThreeHoleGame.GameState) =>
//   state.holes[1] === "X" ? 1 : state.holes[1] === "O" ? -1 : undefined

// const strategy: MCTS.Strategy<ThreeHoleGame.GameState, ThreeHoleGame.Move> = {
//   availableMoves: ThreeHoleGame.availableMoves,
//   calcValue: calcNodeValue,
//   isFinal: ThreeHoleGame.isFinal,
//   nextMove: ThreeHoleGame.nextMove,
//   nextState: ThreeHoleGame.move,
// }

// const calcUcb = (_: MCTS.Tree) => (node: MCTS.Node) => 100 - node.visits

// const config: MCTS.Config<ThreeHoleGame.GameState, ThreeHoleGame.Move> = {
//   calcUcb,
//   strategy,
// }

// const run = () => {

//   const game = ThreeHoleGame.create()

//   const { tree } = MCTS.findBestNode(config)(MCTS.createTree(game), 10)

//   const rootNodes = MCTS.getChildren(tree)(MCTS.getRoot(tree))

//   // console.log("FINAL TREE=====>\n", JSON.stringify(tree, null, 2))
//   console.log("ROOT NODES=====>\n", JSON.stringify(rootNodes, null, 2))

// }

// run()

// // console.log("=====>\n", Math.log(2))
