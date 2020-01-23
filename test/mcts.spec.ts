import * as R from "ramda"
import * as ThreeHoleGame from "../src/games/ThreeHoleGame"
import * as MCTS from "../src/mcts"
import { DeepPartial } from "../src/utils/types"

const calcNodeValue = (state: ThreeHoleGame.GameState) =>
  state.holes[1] === "X" ? 1 : state.holes[1] === "O" ? -1 : undefined

const strategy: MCTS.Strategy<ThreeHoleGame.GameState, ThreeHoleGame.Move> = {
  availableMoves: ThreeHoleGame.availableMoves,
  calcValue: calcNodeValue,
  isFinal: ThreeHoleGame.isFinal,
  nextMove: ThreeHoleGame.nextMove,
  nextState: ThreeHoleGame.move,
}

const calcUcb = (_: MCTS.Tree) => (node: MCTS.Node) => 100 - node.visits

const config: MCTS.Config<ThreeHoleGame.GameState, ThreeHoleGame.Move> = {
  calcUcb,
  strategy,
}

describe("mcts", () => {
  it("creates an mcts tree", () => {
    const game = ThreeHoleGame.create()

    const tree = MCTS.createTree(game)

    // const expectedStates = [
    //   {
    //     holes: ["X", ".", "."],
    //     player: "O",
    //   },
    //   {
    //     holes: [".", "X", "."],
    //     player: "X",
    //   },
    //   {
    //     holes: [".", ".", "X"],
    //     player: "O",
    //   },
    // ]

    const root = ({
      children: [],
      index: 0,
      parentIndex: MCTS.NO_PARENT,
      state: game,
      value: 0,
      visits: 0,
    })
    const expectedTree = ({
      nodes: [root],
    })

    expect(tree).toEqual(expectedTree)
  })

  it("runs first level rollout", () => {
    const game = ThreeHoleGame.create()
    const { tree } = MCTS.findBestNode(config)(MCTS.createTree(game), 3)
    const rootNodes = MCTS.getChildren(tree)(MCTS.getRoot(tree))

    expect(rootNodes.map(n => n.value)).toEqual([-1, 1, 1])
  })

  it("runs second level rollout", () => {
    const game = ThreeHoleGame.create()
    const { tree } = MCTS.findBestNode(config)(MCTS.createTree(game), 4)
    const rootNodes = MCTS.getChildren(tree)(MCTS.getRoot(tree))

    expect(rootNodes.map(n => n.value)).toEqual([-2, 1, 1])
  })

  it("long simulation return best move which is play at the middle hole", () => {
    const game = ThreeHoleGame.create()
    const { node } = MCTS.findBestNode(config)(MCTS.createTree(game), 50)

    expect(node.index).toEqual(2)
  })
})
