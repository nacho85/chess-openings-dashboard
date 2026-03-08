"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import ReactFlow, { Background, Controls } from "reactflow";
import ELK from "elkjs/lib/elk.bundled.js";
import "reactflow/dist/style.css";

import CircleNode from "@/components/CircleNode";

const elk = new ELK();

function buildGraph(root, selectedId) {
  const nodes = [];
  const edges = [];
  const parentById = new Map();

  function walk(node, parentId) {
    parentById.set(node.id, parentId ?? null);

    const isSelected = selectedId === node.id;

    nodes.push({
      id: node.id,
      type: "circle",
      data: {
        label: node.san,
        side: node.side,
        mistake: node.mistake,
        selected: isSelected,
        note: node.note || "",
        tags: node.tags || [],
      },
      position: { x: 0, y: 0 },
      width: 44,
      height: 44,
    });

    if (parentId) {
      const edgeLabel =
        Array.isArray(node.tags) && node.tags.length > 0
          ? node.tags.join(" · ")
          : "";

      edges.push({
        id: `${parentId}-${node.id}`,
        source: parentId,
        target: node.id,
        type: "default",
        label: edgeLabel,
        labelBgPadding: [6, 3],
        labelBgBorderRadius: 8,
        labelBgStyle: { fill: "rgba(0,0,0,0.7)" },
        labelStyle: {
          fill: "white",
          fontSize: 11,
          fontWeight: 700,
        },
        style: {
          stroke: "rgba(255,255,255,0.35)",
          strokeWidth: Math.max(1, (node.popularity ?? 10) / 20),
          opacity: 0.85,
          strokeLinecap: "round",
        },
      });
    }

    node.children?.forEach((c) => walk(c, node.id));
  }

  walk(root, null);

  return { nodes, edges, parentById };
}

async function layoutGraph(nodes, edges) {
  const elkGraph = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "DOWN",
      "elk.layered.spacing.nodeNodeBetweenLayers": "90",
      "elk.spacing.nodeNode": "34",
      "elk.layered.crossingMinimization.semiInteractive": "true",
      "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
    },
    children: nodes.map((n) => ({ id: n.id, width: 44, height: 44 })),
    edges: edges.map((e) => ({
      id: e.id,
      sources: [e.source],
      targets: [e.target],
    })),
  };

  const layouted = await elk.layout(elkGraph);

  const nodesWithPositions = nodes.map((node) => {
    const elkNode = layouted.children.find((n) => n.id === node.id);
    return {
      ...node,
      position: { x: elkNode?.x ?? 0, y: elkNode?.y ?? 0 },
    };
  });

  return { nodes: nodesWithPositions, edges };
}

function buildPath(clickedId, parentById, idToMove) {
  const ids = [];
  let cur = clickedId;
  while (cur) {
    ids.push(cur);
    cur = parentById.get(cur);
  }
  ids.reverse();

  const moves = ids.map((id) => idToMove.get(id)).filter(Boolean);

  return {
    uci: moves.map((m) => m.uci).filter(Boolean),
    san: moves.map((m) => m.san).filter(Boolean),
  };
}

export default function OpeningTree({
  root,
  onSelectMoves,
  onHoverMoves,
  onSelectNodeId,
  selectedNodeId = null,
  interactive = true,
  showControls = true,
}) {
  const [elements, setElements] = useState({ nodes: [], edges: [] });
  const [internalSelectedId, setInternalSelectedId] = useState(null);

  const selectedId = selectedNodeId ?? internalSelectedId;
  const reactFlowRef = useRef(null);

  const parentByIdRef = useRef(new Map());
  const idToMoveSanRef = useRef(new Map());

  const nodeTypes = useMemo(() => ({ circle: CircleNode }), []);
  const defaultEdgeOptions = useMemo(() => ({ type: "step", animated: false }), []);
  const fitViewOptions = useMemo(() => ({ padding: 0.2 }), []);

  const idToMove = useMemo(() => {
    const map = new Map();
    (function walk(n) {
      map.set(n.id, { san: n.san, uci: n.uci });
      n.children?.forEach(walk);
    })(root);
    return map;
  }, [root]);

  useEffect(() => {
    let cancelled = false;

    async function build() {
      idToMoveSanRef.current = idToMove;

      const base = buildGraph(root, selectedId);
      parentByIdRef.current = base.parentById;

      const layouted = await layoutGraph(base.nodes, base.edges);

      if (!cancelled) setElements(layouted);
    }

    build();

    return () => {
      cancelled = true;
    };
  }, [root, selectedId, idToMove]);

  const handleNodeClick = useCallback(
    (_, node) => {
      if (!interactive) return;

      const id = node.id;
      setInternalSelectedId(id);
      onSelectNodeId?.(id);

      const path = buildPath(id, parentByIdRef.current, idToMoveSanRef.current);
      onSelectMoves?.(path);
    },
    [interactive, onSelectMoves, onSelectNodeId]
  );

  const handleNodeMouseEnter = useCallback(
    (_, node) => {
      if (!interactive || !onHoverMoves) return;
      const id = node.id;
      const path = buildPath(id, parentByIdRef.current, idToMoveSanRef.current);
      onHoverMoves(path);
    },
    [interactive, onHoverMoves]
  );

  const handleNodeMouseLeave = useCallback(() => {
    if (!interactive) return;
    onHoverMoves?.(null);
  }, [interactive, onHoverMoves]);

  useEffect(() => {
    const rf = reactFlowRef.current;
    if (!rf || !selectedId) return;

    const node = elements.nodes.find((n) => n.id === selectedId);
    if (!node) return;

    rf.fitView({
      nodes: [node],
      padding: 0.45,
      duration: 350,
      maxZoom: 1.25,
    });
  }, [selectedId, elements.nodes]);

  return (
    <div className="w-full h-full min-h-0">
      <ReactFlow
        nodes={elements.nodes}
        edges={elements.edges}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={fitViewOptions}
        nodesDraggable={false}
        nodesConnectable={false}
        zoomOnScroll={interactive}
        panOnDrag={interactive}
        zoomOnPinch={interactive}
        zoomOnDoubleClick={interactive}
        onInit={(instance) => {
          reactFlowRef.current = instance;
        }}
        onNodeClick={handleNodeClick}
        onNodeMouseEnter={handleNodeMouseEnter}
        onNodeMouseLeave={handleNodeMouseLeave}
      >
        <Background gap={18} />
        {showControls ? <Controls /> : null}
      </ReactFlow>
    </div>
  );
}