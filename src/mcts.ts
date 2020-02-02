import * as R from "ramda"
import { maxNumber } from "./utils/collections"

export const NO_PARENT = -1

type State = any
type Move = any

export interface Tree<S = State, M = Move> {
  config: Config<S, M>
  nodes: ReadonlyArray<Node>
  rootPlayerIndex: number
}

export interface Node {
  children: ReadonlyArray<number>
  index: number
  move?: Move
  parentIndex: number
  state: State
  scores: number[]
  visits: number
}

export interface Config<S = State, M = Move> {
  calcUcb: (tree: Tree) => (node: Node, playerIndex: number) => number
  nextMove?: (state: S) => M | undefined
  gameLogic: GameLogic<S, M>
}

export interface GameLogic<S = State, M = Move> {
  availableMoves: (state: S) => ReadonlyArray<M>
  calcScores: (state: S) => number[]
  currentPlayerIndex: (state: S) => number
  isFinal: (state: S) => boolean
  nextState: (state: S, move: M) => S
  playersCount: (state: S) => number
}

interface TreeResult {
  tree: Tree
  scores: number[]
}

const createNode = (
  state: State,
  index: number,
  playersCount: number,
  parentIndex: number = NO_PARENT,
  move: Move | undefined = undefined,
) => ({
  children: [],
  index,
  move,
  parentIndex,
  scores: R.range(0, playersCount).map(_ => 0),
  state,
  visits: 0,
})

const parentVisits = (tree: Tree) => (node: Node) => {
  const parent = getParent(tree)(node)
  return Math.max(parent ? parent.visits : 1, 1)
}

const sqrt2 = Math.sqrt(2)
export const defaultUcbFormula = (c: number = sqrt2) => (tree: Tree) => (node: Node, playerIndex: number) =>
  node.visits === 0
    ? Infinity
    : node.scores[playerIndex] / node.visits + c * Math.sqrt(Math.log(parentVisits(tree)(node)) / node.visits)

const addChildNodes = (tree: Tree, node: Node) => {
  const {
    nodes,
    config: { gameLogic: strategy },
  } = tree
  const nodeIndex = nodes.length
  const childrenMoves = strategy.availableMoves(node.state)
  const children = childrenMoves.map((move, i) =>
    createNode(
      strategy.nextState(node.state, move),
      nodeIndex + i,
      strategy.playersCount(node.state),
      node.index,
      move,
    ),
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

export const createTree = (config: Config) => (initialState: State, rootPlayerIndex: number): Tree => ({
  config,
  nodes: [createNode(initialState, 0, config.gameLogic.playersCount(initialState))],
  rootPlayerIndex,
})

const nextRandomMove = ({ config: { gameLogic: strategy } }: Tree) => (state: State) => {
  const moves = strategy.availableMoves(state)
  return moves[Math.floor(Math.random() * moves.length)]
}

const selectBestNode = (tree: Tree) => (node: Node): Node => {
  const { config } = tree

  const childNodes = getChildren(tree)(node)

  const firstNode = childNodes[0]

  const playerIndex = config.gameLogic.currentPlayerIndex(node.state)
  const bestUcbNode = childNodes.reduce(
    (acc, childNode) => {
      const ucb = config.calcUcb(tree)(childNode, playerIndex)
      return ucb > acc.bestUcb ? { bestNode: childNode, bestUcb: ucb } : acc
    },
    { bestNode: firstNode, bestUcb: config.calcUcb(tree)(firstNode, playerIndex) },
  )

  return bestUcbNode.bestNode
}

const expand = (tree: Tree) => (node: Node) => {
  const result = isLeaf(node) ? addChildNodes(tree, node) : { tree, node }
  return visit(result.tree)(result.node)
}

const rolloutValue = (tree: Tree) => (state: State): number[] => {
  const {
    config: { gameLogic: strategy },
  } = tree

  const nextMove = tree.config.nextMove ? tree.config.nextMove(state) : nextRandomMove(tree)(state)
  return nextMove ? rolloutValue(tree)(strategy.nextState(state, nextMove)) : strategy.calcScores(state)
}

const rollout = (tree: Tree) => (node: Node): TreeResult => ({
  scores: rolloutValue(tree)(node.state),
  tree,
})

const getStateScores = (tree: Tree) => (node: Node) => ({
  scores: tree.config.gameLogic.calcScores(node.state),
  tree,
})

const updateNodeStats = (scores: number[]) => (node: Node) => ({
  ...node,
  scores: node.scores.map((s, i) => s + scores[i]),
  visits: node.visits + 1,
})

const updateTreeNode = (tree: Tree) => (node: Node, scores: number[]) => ({
  scores,
  tree: replaceNode(tree)(node.index, updateNodeStats(scores)),
})

const visit = (tree: Tree) => (node: Node): TreeResult => {
  const {
    config: { gameLogic: strategy },
  } = tree

  const bestNode = selectBestNode(tree)(node)

  const { tree: updatedTree, scores } = strategy.isFinal(bestNode.state)
    ? getStateScores(tree)(bestNode)
    : bestNode.visits === 0
    ? rollout(tree)(bestNode)
    : expand(tree)(bestNode)

  return updateTreeNode(updatedTree)(bestNode, scores)
}

const findBestNodeForRoot = (tree: Tree) => visit(tree)(tree.nodes[0])

const traverseTree = (tree: Tree, iterations: number) =>
  R.range(1, iterations + 1).reduce(
    acc => {
      const { tree: updatedTree, scores } = findBestNodeForRoot(acc.tree)
      return updateTreeNode(updatedTree)(getRoot(updatedTree), scores)
    },
    { tree, scores: [] as number[] },
  )

const addRootChildNodes = (tree: Tree) => addChildNodes(tree, getRoot(tree)).tree

export const findBestNode = (tree: Tree, iterations: number = 100) => {
  const result = traverseTree(addRootChildNodes(tree), iterations)

  const children = getChildren(result.tree)(getRoot(result.tree))
  const maxValue = maxNumber(children.map(c => c.scores[tree.rootPlayerIndex]))

  return { tree: result.tree, node: children.find(c => c.scores[tree.rootPlayerIndex] === maxValue)! }
}
