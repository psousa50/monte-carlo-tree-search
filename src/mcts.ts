import * as R from "ramda"
import { maxNumber } from "./utils/collections"

export const NO_PARENT = -1

type State = any
type Move = any

export interface Tree<S = State, M = Move> {
  config: Config<S, M>
  nodes: ReadonlyArray<Node>
}

export interface Node {
  children: ReadonlyArray<number>
  index: number
  move?: Move
  parentIndex: number
  state: State
  value: number
  visits: number
}

export interface Config<S = State, M = Move> {
  calcUcb: (tree: Tree) => (node: Node) => number
  strategy: Strategy<S, M>
}

export interface Strategy<S = State, M = Move> {
  availableMoves: (state: S) => ReadonlyArray<M>
  calcValue: (state: S) => number | undefined
  isFinal: (state: S) => boolean
  nextMove?: (state: S) => M | undefined
  nextState: (state: S, move: M) => S
}

interface TreeResult {
  tree: Tree
  value: number
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

const parentVisits = (tree: Tree) => (node: Node) => {
  const parent = getParent(tree)(node)
  return Math.max(parent ? parent.visits : 1, 1)
}

const sqrt2 = Math.sqrt(2)
export const defaultUcbFormula = (c: number = sqrt2) => (tree: Tree) => (node: Node) =>
  node.visits === 0
    ? Infinity
    : node.value / node.visits + c * Math.sqrt(Math.log(parentVisits(tree)(node)) / node.visits)

const addChildNodes = (tree: Tree, node: Node) => {
  const {
    nodes,
    config: { strategy },
  } = tree
  const nodeIndex = nodes.length
  const childrenMoves = strategy.availableMoves(node.state)
  const children = childrenMoves.map((move, i) =>
    createNode(strategy.nextState(node.state, move), nodeIndex + i, node.index, move),
  )

  const nodeWithChildren = {
    ...node,
    children: children.map(c => c.index),
  }
  return {
    node: nodeWithChildren,
    tree: {
      ...tree,
      nodes: [...tree.nodes.map(n => (n.index === node.index ? nodeWithChildren : n)), ...children],
    },
  }
}

const isLeaf = (node: Node) => node.children.length === 0

const getNode = (tree: Tree) => (index: number) => tree.nodes[index]

export const getParent = (tree: Tree) => (node: Node) =>
  node.parentIndex === NO_PARENT ? undefined : getNode(tree)(node.parentIndex)

export const getRoot = (tree: Tree) => getNode(tree)(0)

export const getChildren = (tree: Tree) => (node: Node) => node.children.map(getNode(tree))

const replaceNode = (tree: Tree) => (nodeIndex: number, update: (node: Node) => Node) => ({
  ...tree,
  nodes: tree.nodes.map(n => (n.index === nodeIndex ? update(n) : n)),
})

export const createTree = (config: Config) => (initialState: State): Tree => ({
  config,
  nodes: [createNode(initialState, 0)],
})

const nextRandomMove = ({ config: { strategy } }: Tree) => (state: State) => {
  const moves = strategy.availableMoves(state)
  return moves[Math.floor(Math.random() * moves.length)]
}

const selectBestNode = (tree: Tree) => (node: Node): Node => {
  const { config } = tree

  const childNodes = getChildren(tree)(node)

  const firstNode = childNodes[0]
  const bestUcbNode = childNodes.reduce(
    (acc, cur) => {
      const ucb = config.calcUcb(tree)(cur)
      return ucb > acc.bestUcb ? { bestNode: cur, bestUcb: ucb } : acc
    },
    { bestNode: firstNode, bestUcb: config.calcUcb(tree)(firstNode) },
  )

  return bestUcbNode.bestNode
}

const expand = (tree: Tree) => (node: Node) => {
  const r = isLeaf(node) ? addChildNodes(tree, node) : { tree, node }
  return visit(r.tree, r.node)
}

const rolloutValue = (tree: Tree) => (state: State): number => {
  const {
    config: { strategy },
  } = tree

  const nextMove = strategy.nextMove ? strategy.nextMove(state) : nextRandomMove(tree)(state)
  return nextMove ? rolloutValue(tree)(strategy.nextState(state, nextMove)) : strategy.calcValue(state) || 0
}

const rollout = (tree: Tree) => (node: Node): TreeResult => ({
  tree,
  value: rolloutValue(tree)(node.state),
})

const getStateValue = (tree: Tree) => (node: Node) => ({
  tree,
  value: tree.config.strategy.calcValue(node.state) || 0,
})

const updateNodeStats = (value: number) => (node: Node) => ({
  ...node,
  value: node.value + value,
  visits: node.visits + 1,
})

const updateTreeNode = (tree: Tree) => (node: Node, value: number) => ({
  tree: replaceNode(tree)(node.index, updateNodeStats(value)),
  value,
})

const visit = (tree: Tree, node: Node): TreeResult => {
  const {
    config: { strategy },
  } = tree

  const bestNode = selectBestNode(tree)(node)

  const { tree: updatedTree, value } = strategy.isFinal(bestNode.state)
    ? getStateValue(tree)(bestNode)
    : bestNode.visits === 0
    ? rollout(tree)(bestNode)
    : expand(tree)(bestNode)

  return updateTreeNode(updatedTree)(bestNode, value)
}

const findBestNodeForRoot = (tree: Tree) => visit(tree, tree.nodes[0])

const traverseTree = (tree: Tree, iterations: number) =>
  R.range(1, iterations + 1).reduce(
    acc => {
      const { tree: updatedTree, value } = findBestNodeForRoot(acc.tree)
      return updateTreeNode(updatedTree)(getRoot(updatedTree), value)
    },
    { tree, value: 0 },
  )

const addRootChildNodes = (tree: Tree) => addChildNodes(tree, getRoot(tree)).tree

export const findBestNode = (tree: Tree, iterations: number = 100) => {
  const result = traverseTree(addRootChildNodes(tree), iterations)

  const children = getChildren(result.tree)(getRoot(result.tree))
  const maxValue = maxNumber(children.map(c => c.value))

  return { tree: result.tree, node: children.find(c => c.value === maxValue)! }
}
