import * as R from "ramda"
import * as MCTS from "../src/mcts"
import { DeepPartial } from "../src/utils/types"

type ProblemMove = {
  id: string
  nextState: string
}

type ProblemMoves = { [k: string]: ProblemMove }
type ProblemNode = {
  final?: boolean | undefined
  id: string
  moves: ProblemMoves
  rolloutMove?: string
  value: number
}

type ProblemTree = { [k: string]: ProblemNode }

const defaultStrategy: MCTS.Strategy = {
  availableMoves: () => [],
  calcUcb: () => 0,
  calcValue: () => 0,
  isFinal: () => true,
  nextMove: () => undefined,
  nextState: state => state,
}

const getStrategy = (overrides: DeepPartial<MCTS.Strategy> = {}) => R.mergeDeepRight(defaultStrategy, overrides)

const buildStrategy = (problemTree: ProblemTree): MCTS.Strategy =>
  getStrategy({
    availableMoves: state => R.values(problemTree[state.id].moves).map(m => ({ id: m.id })),
    calcUcb: node => (node.visits === 0 ? Infinity : node.value),
    calcValue: state => problemTree[state.id].value,
    isFinal: state => !!problemTree[state.id].final,
    nextMove: state => {
      const r = problemTree[state.id].rolloutMove
      return r ? { id: r } : undefined
    },
    nextState: (state, move) => ({ id: problemTree[state.id].moves[move.id].nextState }),
  })

describe("mcts", () => {
  describe("on first level", () => {
    const problemTree: ProblemTree = {
      s1: {
        id: "s1",
        moves: {
          m2: {
            id: "m2",
            nextState: "s2",
          },
          m3: {
            id: "m3",
            nextState: "s3",
          },
        },
        value: 0,
      },
      s2: {
        final: true,
        id: "s2",
        moves: {},
        value: 10,
      },
      s3: {
        final: true,
        id: "s3",
        moves: {},
        value: 15,
      },
    }

    it("creates a tree from an initial state", () => {
      const strategy = buildStrategy(problemTree)

      const tree = MCTS.createTree(strategy)({ id: problemTree.s1.id })

      const expectedTree = {
        nodes: [
          {
            children: [1, 2],
            index: 0,
            move: undefined,
            parentIndex: MCTS.NO_PARENT,
            state: { id: "s1" },
            value: 0,
            visits: 0,
          },
          {
            children: [],
            index: 1,
            move: { id: "m2" },
            parentIndex: 0,
            state: { id: "s2" },
            value: 0,
            visits: 0,
          },
          {
            children: [],
            index: 2,
            move: { id: "m3" },
            parentIndex: 0,
            state: { id: "s3" },
            value: 0,
            visits: 0,
          },
        ],
      }

      expect(tree).toEqual(expectedTree)
    })

    it("finds the best node with no rollouts", () => {
      const strategy = buildStrategy(problemTree)

      const tree = MCTS.createTree(strategy)({ id: problemTree.s1.id })

      const { tree: newTree, node: bestNode } = MCTS.findBestNode(strategy)(tree)

      expect(bestNode.move?.id).toBe("m3")
      expect(bestNode.visits).toBe(1)
      expect(bestNode.value).toBe(15)

      const root = MCTS.getRoot(newTree)
      expect(root.value).toBe(10 + 15)
    })
  })

  it("find the best node after a rollout", () => {
    const problemTree: ProblemTree = {
      s0: {
        id: "s0",
        moves: {
          m1: {
            id: "m1",
            nextState: "s1",
          },
          m2: {
            id: "m2",
            nextState: "s2",
          },
        },
        value: 0,
      },
      s1: {
        id: "s1",
        moves: {
          m12: {
            id: "m12",
            nextState: "s12",
          },
          m5: {
            id: "m5",
            nextState: "s5",
          },
          mr4: {
            id: "mr4",
            nextState: "sr4",
          },
        },
        rolloutMove: "mr4",
        value: 0,
      },
      s3: {
        final: true,
        id: "s3",
        moves: {
          m4: {
            id: "m4",
            nextState: "s4",
          },
          m5: {
            id: "m5",
            nextState: "s5",
          },
          mr5: {
            id: "mr5",
            nextState: "sr5",
          },
        },
        rolloutMove: "mr5",
        value: 7,
      },
      s4: {
        id: "s4",
        moves: {
          m6: {
            id: "m6",
            nextState: "s6",
          },
        },
        value: 0,
      },
      s5: {
        id: "s2",
        moves: {
          m7: {
            id: "m7",
            nextState: "s7",
          },
        },
        value: 50,
      },
      s6: {
        final: true,
        id: "s6",
        moves: {},
        value: 20,
      },
      s7: {
        final: true,
        id: "s7",
        moves: {},
        value: 30,
      },
      sr4: {
        id: "sr4",
        moves: {},
        value: 55,
      },
      sr5: {
        id: "sr5",
        moves: {},
        value: 35,
      },
    }

    const strategy = buildStrategy(problemTree)

    const tree = MCTS.createTree(strategy)({ id: problemTree.s1.id })

    const { tree: newTree, node: bestNode } = MCTS.findBestNode(strategy)(tree)

    expect(bestNode.move?.id).toBe("m3")
    expect(bestNode.visits).toBe(1)
    expect(bestNode.value).toBe(15)

    const root = MCTS.getRoot(newTree)
    expect(root.value).toBe(10 + 15)
  })
})
