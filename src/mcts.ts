import * as R from "ramda"
import { maxNumberBy } from "./utils/collections"

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

export enum NotificationType {
  started = "Started",
  finished = "Finished",
  iteration = "Iteration",
  nodeSelected = "Node Selected",
  nodeExpanded = "Node Expanded",
  nodeRollout = "Node Rollout",
  calculatedScore = "Calculated Score",
}

export interface Notification {
  type: NotificationType
  timestamp: number
  node: Node
  iterationCount: number
  elapsedTime: number
}

export interface Config<S = State, M = Move> {
  calcUct: (tree: Tree) => (node: Node, playerIndex: number) => number
  calcScores: (state: S) => number[]
  notifier?: (notification: Notification) => void
  gameRules: GameRules<S, M>
}

export interface GameRules<S = State, M = Move> {
  availableMoves: (state: S) => ReadonlyArray<M>
  currentPlayerIndex: (state: S) => number
  isFinal: (state: S) => boolean
  nextMove?: (state: S) => M | undefined
  nextState: (state: S, move: M) => S
  playersCount: (state: S) => number
}

export interface Options {
  maxIterations?: number | undefined
  timeLimitMs?: number | undefined
}

interface TreeNode {
  tree: Tree
  node: Node
}

interface TreeResult {
  tree: Tree
  node: Node
  scores: number[]
}

const createNotification = (
  type: NotificationType,
  node: Node,
  elapsedTime: number = 0,
  iterationCount: number = 0,
): Notification => ({
  elapsedTime,
  iterationCount,
  node,
  timestamp: Date.now(),
  type,
})

const notify = (tree: Tree) => (
  type: NotificationType,
  node: Node,
  elapsedTime: number = 0,
  iterationCount: number = 0,
) => tree.config.notifier && tree.config.notifier(createNotification(type, node, elapsedTime, iterationCount))

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
export const defaultUctFormula = (c: number = sqrt2) => (tree: Tree) => (node: Node, playerIndex: number) =>
  node.visits === 0
    ? Infinity
    : node.scores[playerIndex] / node.visits + c * Math.sqrt(Math.log(parentVisits(tree)(node)) / node.visits)

const addChildNodes = ({ tree, node }: TreeNode) => {
  const {
    nodes,
    config: { gameRules },
  } = tree
  const nodeIndex = nodes.length
  const childrenMoves = gameRules.availableMoves(node.state)
  const children = childrenMoves.map((move, i) =>
    createNode(
      gameRules.nextState(node.state, move),
      nodeIndex + i,
      gameRules.playersCount(node.state),
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
  nodes: [createNode(initialState, 0, config.gameRules.playersCount(initialState))],
  rootPlayerIndex,
})

const nextRandomMove = ({ config: { gameRules } }: Tree) => (state: State) => {
  const moves = gameRules.availableMoves(state)
  return moves[Math.floor(Math.random() * moves.length)]
}

const selectBestNode = ({ tree, node }: TreeNode) => {
  const { config } = tree

  const childNodes = getChildren(tree)(node)

  const firstNode = childNodes[0]

  const playerIndex = config.gameRules.currentPlayerIndex(node.state)
  const bestUcbNode = childNodes.reduce(
    (acc, childNode) => {
      const uctValue = config.calcUct(tree)(childNode, playerIndex)
      return uctValue > acc.bestUcb ? { bestNode: childNode, bestUcb: uctValue } : acc
    },
    { bestNode: firstNode, bestUcb: config.calcUct(tree)(firstNode, playerIndex) },
  )

  notify(tree)(NotificationType.nodeSelected, bestUcbNode.bestNode)

  return {
    node: bestUcbNode.bestNode,
    tree,
  }
}

const expandIfLeaf = (treeNode: TreeNode) => {
  if (isLeaf(treeNode.node)) {
    const expanded = addChildNodes(treeNode)
    notify(expanded.tree)(NotificationType.nodeExpanded, expanded.node)
    return expanded
  } else {
    return treeNode
  }
}

const rolloutValue = (tree: Tree) => (state: State): number[] => {
  const gameRules = tree.config.gameRules

  const nextMove = gameRules.nextMove ? gameRules.nextMove(state) : nextRandomMove(tree)(state)
  return nextMove ? rolloutValue(tree)(gameRules.nextState(state, nextMove)) : tree.config.calcScores(state)
}

const rollout = ({ tree, node }: TreeNode): TreeResult => {
  notify(tree)(NotificationType.nodeRollout, node)

  return {
    node,
    scores: rolloutValue(tree)(node.state),
    tree,
  }
}

const getStateScores = ({ tree, node }: TreeNode) => ({
  node,
  scores: tree.config.calcScores(node.state),
  tree,
})

const updateNodeStats = (scores: number[]) => (node: Node) => ({
  ...node,
  scores: node.scores.map((s, i) => s + scores[i]),
  visits: node.visits + 1,
})

const updateTreeNodeStats = (tree: Tree, node: Node, scores: number[]) => ({
  node,
  scores,
  tree: replaceNode(tree)(node.index, updateNodeStats(scores)),
})

const processTree = (initialNode: TreeNode): TreeResult => {
  const gameRules = initialNode.tree.config.gameRules
  const bestNode = selectBestNode(expandIfLeaf(initialNode))

  const treeResult = gameRules.isFinal(bestNode.node.state)
    ? getStateScores(bestNode)
    : bestNode.node.visits === 0
    ? rollout(bestNode)
    : processTree(bestNode)

  notify(treeResult.tree)(NotificationType.calculatedScore, { ...treeResult.node, scores: treeResult.scores })

  return updateTreeNodeStats(treeResult.tree, bestNode.node, treeResult.scores)
}

const findBestNodeForRoot = (tree: Tree) => processTree({ tree, node: tree.nodes[0] })

const simulationDone = (options: Options, startTime: number, iterationCount: number) =>
  (options.maxIterations !== undefined && iterationCount >= options.maxIterations) ||
  (options.timeLimitMs !== undefined && Date.now() - startTime >= options.timeLimitMs)

const performIterations = (tree: Tree, options: Options) => {
  const startTime = Date.now()
  let iterationCount = 0
  while (!simulationDone(options, startTime, iterationCount)) {
    notify(tree)(NotificationType.iteration, getRoot(tree), Date.now() - startTime, iterationCount)
    iterationCount++
    const bestTreeResult = findBestNodeForRoot(tree)
    const updatedTreeResult = updateTreeNodeStats(
      bestTreeResult.tree,
      getRoot(bestTreeResult.tree),
      bestTreeResult.scores,
    )
    tree = updatedTreeResult.tree
  }

  return {
    elapsedTimeMs: Date.now() - startTime,
    iterationCount,
    tree,
  }
}

const calcBestNode = (tree: Tree) => {
  const rootChildren = getChildren(tree)(getRoot(tree))
  return maxNumberBy(rootChildren, node => node.scores[tree.rootPlayerIndex])!
}

export const findBestNode = (tree: Tree, options: Options) => {
  notify(tree)(NotificationType.started, getRoot(tree))
  const result = performIterations(tree, options)

  const bestNode = calcBestNode(result.tree)
  notify(result.tree)(NotificationType.finished, bestNode, result.iterationCount, result.elapsedTimeMs)

  return {
    bestNode,
    ...result,
  }
}
