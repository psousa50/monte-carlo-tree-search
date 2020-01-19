import * as R from "ramda"
import * as MCTS from "../src/mcts"
import { DeepPartial } from "../src/utils/types"

const defaultStrategy = {
  availableMoves: () => [],
  calcUcb: () => 0,
  calcValue: () => 0,
  getNextMove: () => ({}),
  isFinal: () => true,
  nextState: (state: any) => state,
}

const getStrategy = (overrides: DeepPartial<MCTS.Strategy> = {}) => R.mergeDeepRight(defaultStrategy, overrides)

describe("mcts", () => {
  it("creates a tree with an initial state", () => {
    const initialState = { some: "state" } as any
    const move1 = { some: "move1" } as any
    const move2 = { some: "move2" } as any
    const state1 = { some: "state1" } as any
    const state2 = { some: "state2" } as any

    const strategy = getStrategy({
      availableMoves: () => [move1, move2],
      nextState: jest
        .fn()
        .mockImplementationOnce(() => state1)
        .mockImplementationOnce(() => state2),
    })

    const tree = MCTS.createTree(strategy)(initialState)

    const expectedNode = {
      children: [
        {
          children: [],
          index: 1,
          move: move1,
          parentIndex: 0,
          state: state1,
          value: 0,
          visits: 0,
        },
        {
          children: [],
          index: 2,
          move: move2,
          parentIndex: 0,
          state: state2,
          value: 0,
          visits: 0,
        },
      ],
      index: 0,
      move: undefined,
      parentIndex: MCTS.NO_PARENT,
      state: initialState,
      value: 0,
      visits: 0,
    }

    const expectedTree = {
      nodes: [expectedNode],
    }

    expect(tree).toEqual(expectedTree)
  })

  it("return the best move available if they are all final", () => {
    const bestMove = { some: "bestMove" } as any
    const otherMove = { some: "otherMove" } as any
    const initialState = { some: "state" } as any

    const strategy = getStrategy({
      availableMoves: () => [otherMove, bestMove],
      calcUcb: jest.fn(node => (node.move === bestMove ? 20 : 10)),
      isFinal: () => true,
    })

    const tree = MCTS.createTree(strategy)(initialState)

    const bestMoveFound = MCTS.findBestMove(strategy)(tree.nodes[0])

    expect(bestMoveFound).toBe(bestMove)
  })

  it("rollsOut the best move available", () => {
    type Indexed = { [k: string]: any }

    const getStateInfo = (info: any) => stateInfo[info.id]!

    const createStateInfo = (id: string, ucb: number, nextMove: string = ""): Indexed => ({
      [id]: {
        move: { id },
        nextMove,
        nextState: { id },
        ucb,
      },
    })

    const initialState = { some: "state" } as any
    const stateInfo = {
      ...createStateInfo("best", 20, "rolloutFromBest"),
      ...createStateInfo("other", 10, "rolloutFromOther"),
      ...createStateInfo("rolloutFromBest", 15),
      ...createStateInfo("rolloutFromOther", 3),
    }

    const strategy = getStrategy({
      availableMoves: () => [stateInfo.best.move, stateInfo.other.move],
      calcUcb: node => getStateInfo(node.move).ucb,
      getNextMove: jest.fn(state => stateInfo[getStateInfo(state).nextMove].move),
      isFinal: state => state === stateInfo.rolloutFromBest.nextState,
      nextState: (_, move) => getStateInfo(move).nextState,
    })

    const tree = MCTS.createTree(strategy)(initialState)

    const bestMoveFound = MCTS.findBestMove(strategy)(tree.nodes[0])

    expect(strategy.getNextMove).toHaveBeenCalledWith(stateInfo.best.nextState)

    expect(bestMoveFound).toBe(stateInfo.best.move)
  })
})
