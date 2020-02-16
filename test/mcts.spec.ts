import { not } from "ramda"
import * as ThreeHoleGame from "../src/games/ThreeHoleGame/game"
import { playerWins } from "../src/games/TicTacToe/game"
import * as MCTS from "../src/mcts"

const playerPiece = (playerIndex: number) => (playerIndex === 0 ? "X" : "O")

const calcScore = (state: ThreeHoleGame.GameState, playerIndex: number) =>
  state.holes[1] === playerPiece(playerIndex) ? 1 : state.holes[1] === playerPiece(1 - playerIndex) ? -1 : 0

const calcScores = (state: ThreeHoleGame.GameState) => [calcScore(state, 0), calcScore(state, 1)]

const currentPlayerIndex = (state: ThreeHoleGame.GameState) => (state.player === "X" ? 0 : 1)

const nextMove = (state: ThreeHoleGame.GameState) => {
  const moves = ThreeHoleGame.availableMoves(state)
  return moves.length > 0 ? moves[0] : undefined
}

export const logNotifications = (notification: MCTS.Notification) => console.log(`${notification.type}\n${JSON.stringify(notification)}`)

const gameRules: MCTS.GameRules<ThreeHoleGame.GameState, ThreeHoleGame.Move> = {
  availableMoves: ThreeHoleGame.availableMoves,
  currentPlayerIndex,
  isFinal: ThreeHoleGame.isFinal,
  nextMove,
  nextState: ThreeHoleGame.move,
  playersCount: () => 2,
}

const config: MCTS.Config<ThreeHoleGame.GameState, ThreeHoleGame.Move> = {
  calcScores,
  calcUct: MCTS.defaultUctFormula(),
  gameRules,
}

describe("mcts", () => {
  it("creates an mcts tree", () => {
    const game = ThreeHoleGame.create()

    const tree = MCTS.createTree(config)(game, 0)

    const root = {
      children: [],
      index: 0,
      parentIndex: MCTS.NO_PARENT,
      scores: [0, 0],
      state: game,
      visits: 0,
    }
    const expectedTree = {
      config,
      nodes: [root],
      rootPlayerIndex: 0,
    }

    expect(tree).toEqual(expectedTree)
  })

  it("on first rollout", () => {
    const game = ThreeHoleGame.create()
    const { tree } = MCTS.findBestNode(MCTS.createTree(config)(game, 0), { maxIterations: 3 })
    const rootNodes = MCTS.getChildren(tree)(MCTS.getRoot(tree))

    expect(rootNodes.map(n => n.scores)).toEqual([
      [-1, 1],
      [1, -1],
      [1, -1],
    ])
  })

  it("on next iteration should select 2nd child", () => {
    const game = ThreeHoleGame.create()
    const { tree } = MCTS.findBestNode(MCTS.createTree(config)(game, 0), { maxIterations: 4 })
    const rootNodes = MCTS.getChildren(tree)(MCTS.getRoot(tree))

    expect(rootNodes.map(n => n.scores)).toEqual([
      [-1, 1],
      [2, -2],
      [1, -1],
    ])
    expect(rootNodes.map(n => n.visits)).toEqual([1, 2, 1])
  })

  it("on next iteration should select and expand 3rd child", () => {
    const game = ThreeHoleGame.create()
    const { tree } = MCTS.findBestNode(MCTS.createTree(config)(game, 0), { maxIterations: 5 })
    const rootNodes = MCTS.getChildren(tree)(MCTS.getRoot(tree))

    expect(rootNodes.map(n => n.scores)).toEqual([
      [-1, 1],
      [2, -2],
      [2, -2],
    ])
    expect(rootNodes.map(n => n.visits)).toEqual([1, 2, 2])
    expect(MCTS.getChildren(tree)(rootNodes[2]).map(n => n.scores)).toEqual([
      [1, -1],
      [0, 0],
    ])
    expect(MCTS.getChildren(tree)(rootNodes[2]).map(n => n.visits)).toEqual([1, 0])
  })

  it("should select best node for current player", () => {
    const game = ThreeHoleGame.create()
    const { tree: tree1 } = MCTS.findBestNode(MCTS.createTree(config)(game, 0), {
      maxIterations: 16,
    })
    const rootNodes1 = MCTS.getChildren(tree1)(MCTS.getRoot(tree1))

    const { tree: tree2 } = MCTS.findBestNode(MCTS.createTree(config)(game, 0), { maxIterations: 17 })
    const rootNodes2 = MCTS.getChildren(tree2)(MCTS.getRoot(tree2))

    expect(MCTS.getChildren(tree1)(rootNodes1[2]).map(n => n.visits)).toEqual([1, 1])
    expect(MCTS.getChildren(tree2)(rootNodes2[2]).map(n => n.visits)).toEqual([1, 2])
  })
})
