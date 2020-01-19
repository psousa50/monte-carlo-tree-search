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
  index: number
  move?: Move
  value: number
  visits: number
}

export interface Strategy {
  availableMoves: (state: State) => Move[]
  calcUcb: (node: Node) => number
  calcValue: (state: State) => number
  getNextMove: (state: State) => Move
  isFinal: (state: State) => boolean
  nextState: (state: State, move: Move) => State
}

const createNode = (
  state: State,
  index: number,
  parentIndex: number = NO_PARENT,
  move: Move | undefined = undefined,
) => ({
  children: [],
  index,
  move,
  parentIndex,
  state,
  value: 0,
  visits: 0,
})

export const createTree = (strategy: Strategy) => (initialState: State) => {
  const node = createNode(initialState, 0)
  const childrenMoves = strategy.availableMoves(initialState)
  const children = childrenMoves.map((move, i) => createNode(strategy.nextState(initialState, move), i + 1, 0, move))
  const root = {
    ...node,
    children,
  }
  return { nodes: [root] }
}

const rollOut = (strategy: Strategy) => (state: State): number => {
  return strategy.isFinal(state)
    ? strategy.calcValue(state)
    : rollOut(strategy)(strategy.nextState(state, strategy.getNextMove(state)))
}

export const findBestMove = (strategy: Strategy) => (node: Node) => {
  const ucbs = node.children.map(c => strategy.calcUcb(c))
  const bestUcb = R.reduce(R.max, -Infinity, ucbs)
  const bestNodeIndex = ucbs.findIndex(v => v === bestUcb)
  const bestNode = node.children[bestNodeIndex]

  if (strategy.isFinal(bestNode.state)) {
    return bestNode.move
  }

  rollOut(strategy)(bestNode.state)
  return bestNode.move
}
