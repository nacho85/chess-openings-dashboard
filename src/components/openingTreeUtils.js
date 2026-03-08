export function findNode(root, id) {
  if (!root) return null;
  if (root.id === id) return root;

  for (const ch of root.children || []) {
    const r = findNode(ch, id);
    if (r) return r;
  }

  return null;
}

export function getNodeChildren(node) {
  return Array.isArray(node?.children) ? node.children : [];
}

export function getPathIds(root, targetId) {
  if (!root || !targetId) return [];

  const path = [];
  let found = false;

  function dfs(node) {
    if (!node || found) return;

    path.push(node.id);

    if (node.id === targetId) {
      found = true;
      return;
    }

    for (const child of node.children || []) {
      dfs(child);
      if (found) return;
    }

    path.pop();
  }

  dfs(root);
  return found ? path : [];
}

export function findPathToNode(root, targetId) {
  const ids = getPathIds(root, targetId);
  return ids.map((id) => findNode(root, id)).filter(Boolean);
}

export function buildMovePathFromNodes(nodes = []) {
  return {
    san: nodes.map((n) => n?.san).filter(Boolean),
    uci: nodes.map((n) => n?.uci).filter(Boolean),
  };
}

export function buildMovePathToNode(root, targetId) {
  const nodes = findPathToNode(root, targetId);
  return buildMovePathFromNodes(nodes);
}

export function uciToMove(uci) {
  if (!uci || uci.length < 4) return null;

  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);
  const promotion = uci.length > 4 ? uci[4] : undefined;

  return promotion ? { from, to, promotion } : { from, to };
}

export function isSameMove(a, b) {
  if (!a || !b) return false;

  return (
    a.from === b.from &&
    a.to === b.to &&
    (a.promotion || "") === (b.promotion || "")
  );
}

export function getExpectedChildren(root, currentNodeId) {
  if (!root) return [];
  if (!currentNodeId) return [root];

  const currentNode = findNode(root, currentNodeId);
  return getNodeChildren(currentNode);
}

export function pickWeightedChild(children = []) {
  if (!children.length) return null;

  const totalWeight = children.reduce(
    (sum, child) => sum + Math.max(1, Number(child?.popularity) || 1),
    0
  );

  let roll = Math.random() * totalWeight;

  for (const child of children) {
    roll -= Math.max(1, Number(child?.popularity) || 1);
    if (roll <= 0) return child;
  }

  return children[children.length - 1] || null;
}