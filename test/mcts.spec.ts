import * as R from "ramda"
import * as MCTS from "../src/mcts"
import { DeepPartial } from "../src/utils/types"

const defaultStrategy = {
  availableMoves: () => [],
  calcUcb: () => 0,
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
          childrenMoves: [],
          index: 1,
          parentIndex: 0,
          state: state1,
          value: 0,
          visits: 0,
        },
        {
          children: [],
          childrenMoves: [],
          index: 2,
          parentIndex: 0,
          state: state2,
          value: 0,
          visits: 0,
        },
      ],
      childrenMoves: [move1, move2],
      index: 0,
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
      calcUcb: jest
        .fn()
        .mockImplementationOnce(() => 10)
        .mockImplementationOnce(() => 20),
      isFinal: () => true,
    })

    const tree = MCTS.createTree(strategy)(initialState)

    const bestMoveFound = MCTS.findBestMove(strategy)(tree.nodes[0])

    expect(bestMoveFound).toBe(bestMove)
  })

  it.skip("rollsout the best move available", () => {
    const bestMove = { some: "bestMove" } as any
    const otherMove = { some: "otherMove" } as any
    const rolloutMove = { some: "rolloutMove" } as any
    const initialState = { some: "state" } as any
    const bestMoveState = { some: "bestMoveState" } as any
    const otherMoveState = { some: "otherMoveState" } as any
    const rolloutMoveState = { some: "rolloutMoveState" } as any

    const strategy = getStrategy({
      availableMoves: jest
        .fn()
        .mockImplementationOnce(() => [otherMove, bestMove])
        .mockImplementation(() => [rolloutMove]),
      calcUcb: jest.fn(node => (node.state === bestMoveState ? 20 : 10)),
      getNextMove: jest.fn(() => rolloutMoveState),
      isFinal: jest.fn(state => state === rolloutMoveState),
      nextState: jest
        .fn((_, move) => (move === bestMove ? bestMoveState : otherMoveState))
        .mockImplementationOnce(() => otherMoveState)
        .mockImplementationOnce(() => bestMoveState),
    })

    const tree = MCTS.createTree(strategy)(initialState)

    const bestMoveFound = MCTS.findBestMove(strategy)(tree.nodes[0])

    expect(strategy.getNextMove).toHaveBeenCalledWith(bestMoveState)

    expect(bestMoveFound).toBe(bestMove)
  })
})
