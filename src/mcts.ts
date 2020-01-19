import * as R from "ramda"

export const NO_PARENT = -1

type State = {}
type Move = {}

export interface Tree {
  root: Node
  nodes: ReadonlyArray<Node>
}

interface Node {
  state: State
  parentIndex: number
  children: ReadonlyArray<Node>
  childrenMoves: ReadonlyArray<Move>
  index: number
  value: number
  visits: number
}

export interface Strategy {
  availableMoves: (state: State) => Move[]
  getNextMove: (state: State) => Move
  nextState: (state: State, move: Move) => State
  isFinal: (state: State) => boolean
  calcUcb: (node: Node) => number
}

const createNode = (state: State, index: number, parentIndex: number = NO_PARENT) => ({
  children: [],
  childrenMoves: [],
  index,
  parentIndex,
  state,
  value: 0,
  visits: 0,
})

export const createTree = (strategy: Strategy) => (initialState: State) => {
  const node = createNode(initialState, 0)
  const childrenMoves = strategy.availableMoves(initialState)
  const children = childrenMoves.map((move, i) => createNode(strategy.nextState(initialState, move), i + 1, 0))
  const root = {
    ...node,
    children,
    childrenMoves,
  }
  return { nodes: [root] }
}

export const findBestMove = (strategy: Strategy) => (node: Node) => {
  const ucbs = node.children.map(c => strategy.calcUcb(c))
  const bestUcb = R.reduce(R.max, -Infinity, ucbs)
  const bestNodeIndex = ucbs.findIndex(v => v === bestUcb)
  return node.childrenMoves[bestNodeIndex]
}
