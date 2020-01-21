import * as R from "ramda"

export const NO_PARENT = -1

type State = {
  id: string
}
type Move = {
  id: string
}

export interface Tree {
  nodes: ReadonlyArray<Node>
}

interface Node {
  children: ReadonlyArray<number>
  index: number
  move?: Move
  parentIndex: number
  state: State
  value: number
  visits: number
}

export interface Strategy {
  availableMoves: (state: State) => Move[]
  calcUcb: (node: Node) => number
  calcValue: (state: State) => number
  nextMove?: (state: State) => Move | undefined
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

const addChildNodes = (strategy: Strategy) => (tree: Tree, node: Node) => {
  const nodeIndex = tree.nodes.length
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

const getNode = (tree: Tree) => (index: number) => tree.nodes[index]

const getParent = (tree: Tree) => (node: Node) =>
  node.parentIndex === NO_PARENT ? undefined : getNode(tree)(node.parentIndex)

export const getRoot = (tree: Tree) => getNode(tree)(0)

const getChildren = (tree: Tree) => (node: Node) => node.children.map(getNode(tree))

const replaceNode = (tree: Tree) => (node: Node) => ({
  ...tree,
  nodes: tree.nodes.map(n => (n.index === node.index ? node : n)),
})

export const createTree = (strategy: Strategy) => (initialState: State) => {
  const root = createNode(initialState, 0)
  const initialTree = {
    nodes: [root],
  }
  const { tree } = addChildNodes(strategy)(initialTree, root)

  return tree
}

const nextRandomMove = (strategy: Strategy) => (state: State) => {
  const moves = strategy.availableMoves(state)
  return moves[Math.floor(Math.random() * moves.length)]
}

const selectBestUcbNode = (strategy: Strategy) => (tree: Tree, node: Node): Node => {
  const ucbs = node.children.map(index => strategy.calcUcb(getNode(tree)(index)))
  console.log("UCBS=====>\n", ucbs)
  const bestUcb = R.reduce(R.max, -Infinity, ucbs)
  const bestNodeIndex = ucbs.findIndex(v => v === bestUcb)
  const bestNode = getNode(tree)(node.children[bestNodeIndex])
  return bestNode.children.length === 0 ? bestNode : selectBestUcbNode(strategy)(tree, bestNode)
}

const expand = (strategy: Strategy) => (tree2: Tree, node2: Node) => {
  const { tree, node } = addChildNodes(strategy)(tree2, node2)

  return visit(strategy)(tree, node)
}

const rollout = (strategy: Strategy) => (state: State): number => {
  const nextMove = strategy.nextMove ? strategy.nextMove(state) : nextRandomMove(strategy)(state)
  return nextMove ? rollout(strategy)(strategy.nextState(state, nextMove)) : strategy.calcValue(state)
}

const backPropagate = (tree: Tree) => (value: number, node?: Node): Tree =>
  node
    ? backPropagate(replaceNode(tree)({ ...node, value: node.value + value, visits: node.visits + 1 }))(
        value,
        getParent(tree)(node),
      )
    : tree

const visit = (strategy: Strategy) => (tree: Tree, node: Node): Tree => {
  const bestUcbNode = selectBestUcbNode(strategy)(tree, node)

  console.log("NODE=====>\n", node)
  console.log("BEST=====>\n", bestUcbNode, strategy.calcValue(bestUcbNode.state), strategy.isFinal(bestUcbNode.state))

  const newTree = strategy.isFinal(bestUcbNode.state)
    ? bestUcbNode.visits === 0
      ? backPropagate(tree)(strategy.calcValue(bestUcbNode.state), bestUcbNode)
      : tree
    : bestUcbNode.visits === 0
    ? expand(strategy)(tree, bestUcbNode)
    : backPropagate(tree)(rollout(strategy)(bestUcbNode.state), bestUcbNode)

  console.log("NEWTREE=====>\n", newTree)
  return newTree
}

export const findBestNodeIteration = (strategy: Strategy) => (tree2: Tree) => visit(strategy)(tree2, tree2.nodes[0])

export const findBestNode = (strategy: Strategy) => (tree2: Tree) => {
  const findBest = findBestNodeIteration(strategy)

  const tree = R.range(1, 4).reduce(acc => findBest(acc), tree2)

  const children = getChildren(tree)(getRoot(tree))
  const maxValue = R.reduce(
    R.max,
    -Infinity,
    children.map(c => c.value),
  )
  return { tree, node: children.find(c => c.value === maxValue)! }
}
