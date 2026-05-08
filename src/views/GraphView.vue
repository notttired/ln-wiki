<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js'
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js'
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js'
import { LineMaterial } from 'three/addons/lines/LineMaterial.js'
import { useColorScheme } from '@/composables/useColorScheme'
import type { GraphEntity, GraphRelation } from '@/types/graph'
import entitiesRaw from '@/assets/wiki/entities.json'
import relationsRaw from '@/assets/wiki/relationships.json'

const entities = entitiesRaw as GraphEntity[]
const relations = relationsRaw as GraphRelation[]

// ── Simulation constants ──────────────────────────────────────────────────────

const K_R = 0.16
const K_A = 0.02
const REST = 1.5

const K_G = 0.0005
const SIGMA = 1.1
const DAMPING = 0.94
const ALPHA_DECAY = 0.025
const ALPHA_MIN = 0.15

const INIT_RADIUS = 8

// ── Visual helpers ────────────────────────────────────────────────────────────

const HOSTILE_TYPES = new Set([
  'enemies', 'betrayer', 'antagonistic', 'sworn_enemies', 'combat_adversaries',
  'killer', 'predator', 'hunter_prey', 'opponents', 'distrust',
])
const ALLIED_TYPES = new Set([
  'ally', 'allies', 'party_members', 'trusted_teammate', 'teammates',
  'close_companions', 'mentor_student',
])

function nodeRadius(importance: number): number {
  return 0.5 * (0.35 + importance * 0.65)
}

function nodeDegreeColor(degree: number): number {
  if (degree >= 7) return 0xc87d4a
  if (degree >= 4) return 0xc4a030
  if (degree >= 2) return 0x6b9e8f
  return 0x8a9bb5
}

// ── Simulation state ──────────────────────────────────────────────────────────

interface SimNode {
  x: number; y: number
  vx: number; vy: number
  entity: GraphEntity
  degree: number
  radius: number
  pinned: boolean
}

interface SimEdge {
  a: number; b: number
  relation: GraphRelation | null
  kind: 'hostile' | 'allied' | 'neutral' | 'cooccur'
}

const simNodes: SimNode[] = []
const simEdges: SimEdge[] = []

function buildSimulation() {
  alpha = 1.0
  simNodes.length = 0
  simEdges.length = 0
  const nameIdx = new Map<string, number>()
  entities.forEach((e, i) => {
    const angle = (i / entities.length) * Math.PI * 2
    const r = INIT_RADIUS * (0.5 + Math.random() * 0.5)
    simNodes.push({
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r,
      vx: 0, vy: 0,
      entity: e,
      degree: 0,
      radius: nodeRadius(e.importance),
      pinned: false,
    })
    nameIdx.set(e.name, i)
  })
  relations.forEach(rel => {
    const ai = nameIdx.get(rel.entity_id_a)
    const bi = nameIdx.get(rel.entity_id_b)
    if (ai === undefined || bi === undefined) return
    simNodes[ai].degree++
    simNodes[bi].degree++
    const kind = HOSTILE_TYPES.has(rel.relation_type) ? 'hostile'
      : ALLIED_TYPES.has(rel.relation_type) ? 'allied'
      : 'neutral'
    simEdges.push({ a: ai, b: bi, relation: rel, kind })
  })

  // Co-occurrence edges: entities sharing ≥2 chapters
  const chapterMap = new Map<number, number[]>()
  simNodes.forEach((sn, i) => {
    sn.entity.chapter_mentions.forEach(cm => {
      if (!chapterMap.has(cm.chapter)) chapterMap.set(cm.chapter, [])
      chapterMap.get(cm.chapter)!.push(i)
    })
  })
  const existingPairs = new Set(simEdges.map(e => `${Math.min(e.a, e.b)}_${Math.max(e.a, e.b)}`))
  const cooccurCount = new Map<string, number>()
  chapterMap.forEach(indices => {
    for (let i = 0; i < indices.length; i++) {
      for (let j = i + 1; j < indices.length; j++) {
        const key = `${Math.min(indices[i], indices[j])}_${Math.max(indices[i], indices[j])}`
        cooccurCount.set(key, (cooccurCount.get(key) ?? 0) + 1)
      }
    }
  })
  cooccurCount.forEach((count, key) => {
    if (count < 2) return
    if (existingPairs.has(key)) return
    const [ai, bi] = key.split('_').map(Number)
    simNodes[ai].degree++
    simNodes[bi].degree++
    simEdges.push({ a: ai, b: bi, relation: null, kind: 'cooccur' })
  })
}

let alpha = 1.0

function tickSimulation() {
  const n = simNodes.length
  for (let i = 0; i < n; i++) {
    const ni = simNodes[i]
    if (ni.pinned) continue
    for (let j = i + 1; j < n; j++) {
      const nj = simNodes[j]
      const dx = nj.x - ni.x
      const dy = nj.y - ni.y
      const d2 = dx * dx + dy * dy
      if (d2 < 0.0001) continue
      const d = Math.sqrt(d2)
      const f = K_R * Math.exp(-d / SIGMA)
      const fx = (dx / d) * f
      const fy = (dy / d) * f
      ni.vx -= fx; ni.vy -= fy
      if (!nj.pinned) { nj.vx += fx; nj.vy += fy }
    }
  }
  for (const e of simEdges) {
    if (selectedNodeIdx < 0 || (e.a !== selectedNodeIdx && e.b !== selectedNodeIdx)) continue
    const ni = simNodes[e.a]
    const nj = simNodes[e.b]
    const dx = nj.x - ni.x
    const dy = nj.y - ni.y
    const d = Math.sqrt(dx * dx + dy * dy) || 0.001
    const f = K_A * (d - REST) * alpha
    const fx = (dx / d) * f
    const fy = (dy / d) * f
    if (!ni.pinned) { ni.vx += fx; ni.vy += fy }
    if (!nj.pinned) { nj.vx -= fx; nj.vy -= fy }
  }
  for (let ni = 0; ni < simNodes.length; ni++) {
    const n = simNodes[ni]
    if (ni === selectedNodeIdx) {
      n.x = 0; n.y = 0; n.vx = 0; n.vy = 0
      continue
    }
    if (n.pinned) continue
    n.vx -= n.x * K_G
    n.vy -= n.y * K_G
    n.vx *= DAMPING; n.vy *= DAMPING
    n.x += n.vx; n.y += n.vy
  }
  alpha = Math.max(ALPHA_MIN, alpha * (1 - ALPHA_DECAY))
}

// ── Vue state ─────────────────────────────────────────────────────────────────

interface SelectedEntity {
  entity: GraphEntity
  colorHex: string
  edges: SimEdge[]
}

const { scheme } = useColorScheme()
const containerRef = ref<HTMLDivElement | null>(null)
const selectedEntity = ref<SelectedEntity | null>(null)

// ── Three.js objects ──────────────────────────────────────────────────────────

interface NodeEntry {
  mesh: THREE.Mesh
  label: CSS2DObject | null
  simNode: SimNode
  baseColor: THREE.Color
  material: THREE.MeshStandardMaterial
}

let renderer: THREE.WebGLRenderer
let css2dRenderer: CSS2DRenderer
let scene: THREE.Scene
let camera: THREE.OrthographicCamera
let animFrameId: number
const nodeEntries: NodeEntry[] = []
const disposables: Array<{ dispose(): void }> = []
let neutralEdgeMat: LineMaterial
let cooccurEdgeMat: LineMaterial
const edgeLineMats: LineMaterial[] = []
let selectedNodeIdx = -1
let rebuildSelectedEdges: () => void = () => {}
let ro: ResizeObserver
let hoveredEntry: NodeEntry | null = null

// Interaction
type DragMode = 'none' | 'pan' | 'node'
let dragMode: DragMode = 'none'
let pointerDownX = 0
let pointerDownY = 0
let panLastX = 0
let panLastY = 0
let dragNodeEntry: NodeEntry | null = null
let dragNodeOffX = 0
let dragNodeOffY = 0

const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

function readCSSVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function getThemeColors() {
  return {
    bg: new THREE.Color(readCSSVar('--bg') || '#faf7f2'),
    neutral: new THREE.Color(readCSSVar('--border') || '#e0d8cc'),
  }
}

function applyTheme() {
  const c = getThemeColors()
  renderer.setClearColor(c.bg)
  if (neutralEdgeMat) neutralEdgeMat.color.copy(c.neutral)
  if (cooccurEdgeMat) cooccurEdgeMat.color.copy(c.neutral)
}

watch(scheme, applyTheme)

function getMouseNDC(e: MouseEvent | PointerEvent) {
  const rect = renderer.domElement.getBoundingClientRect()
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
}

function findHitNode(): NodeEntry | null {
  raycaster.setFromCamera(mouse, camera)
  const hits = raycaster.intersectObjects(nodeEntries.map(n => n.mesh), false)
  if (!hits.length) return null
  const idx = hits[0].object.userData.nodeIdx as number
  return nodeEntries[idx] ?? null
}

function worldFromPointer(e: PointerEvent): { wx: number; wy: number } {
  const rect = renderer.domElement.getBoundingClientRect()
  const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1
  const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1
  const wx = camera.left + (nx + 1) / 2 * (camera.right - camera.left)
  const wy = camera.bottom + (ny + 1) / 2 * (camera.top - camera.bottom)
  return { wx, wy }
}

function onPointerDown(e: PointerEvent) {
  pointerDownX = e.clientX
  pointerDownY = e.clientY
  getMouseNDC(e)
  const hit = findHitNode()
  renderer.domElement.setPointerCapture(e.pointerId)
  if (hit) {
    dragMode = 'node'
    dragNodeEntry = hit
    const { wx, wy } = worldFromPointer(e)
    dragNodeOffX = wx - hit.simNode.x
    dragNodeOffY = wy - hit.simNode.y
    hit.simNode.pinned = true
    alpha = Math.max(alpha, 0.2)
  } else {
    dragMode = 'pan'
    panLastX = e.clientX
    panLastY = e.clientY
  }
}

function onPointerMove(e: PointerEvent) {
  if (dragMode === 'pan') {
    const dx = e.clientX - panLastX
    const dy = e.clientY - panLastY
    panLastX = e.clientX
    panLastY = e.clientY
    const rect = renderer.domElement.getBoundingClientRect()
    const ux = (camera.right - camera.left) / rect.width
    const uy = (camera.top - camera.bottom) / rect.height
    camera.left -= dx * ux; camera.right -= dx * ux
    camera.top += dy * uy; camera.bottom += dy * uy
    camera.updateProjectionMatrix()
    return
  }
  if (dragMode === 'node' && dragNodeEntry) {
    const { wx, wy } = worldFromPointer(e)
    dragNodeEntry.simNode.x = wx - dragNodeOffX
    dragNodeEntry.simNode.y = wy - dragNodeOffY
    dragNodeEntry.simNode.vx = 0
    dragNodeEntry.simNode.vy = 0
    return
  }
  // Hover
  getMouseNDC(e)
  const hit = findHitNode()
  if (hoveredEntry && hoveredEntry !== hit) {
    hoveredEntry.material.emissiveIntensity = 0
    hoveredEntry.mesh.scale.set(1, 1, 1)
    containerRef.value!.style.cursor = 'default'
  }
  if (hit && hit !== hoveredEntry) {
    hit.material.emissiveIntensity = 0.3
    hit.material.emissive.copy(hit.baseColor)
    hit.mesh.scale.set(1.2, 1.2, 1.2)
    containerRef.value!.style.cursor = 'pointer'
  }
  hoveredEntry = hit
}

function onPointerUp(e: PointerEvent) {
  if (dragNodeEntry) {
    dragNodeEntry.simNode.pinned = false
    dragNodeEntry = null
  }
  renderer.domElement.releasePointerCapture(e.pointerId)
  dragMode = 'none'
}

function onClick(e: MouseEvent) {
  if (Math.abs(e.clientX - pointerDownX) > 4 || Math.abs(e.clientY - pointerDownY) > 4) return
  getMouseNDC(e)
  const hit = findHitNode()
  if (hit) {
    selectedNodeIdx = hit.mesh.userData.nodeIdx as number
    simNodes[selectedNodeIdx].x = 0
    simNodes[selectedNodeIdx].y = 0
    simNodes[selectedNodeIdx].vx = 0
    simNodes[selectedNodeIdx].vy = 0
    alpha = 1.0
    const color = '#' + new THREE.Color(nodeDegreeColor(hit.simNode.degree)).getHexString()
    selectedEntity.value = {
      entity: hit.simNode.entity,
      colorHex: color,
      edges: simEdges.filter(se =>
        simNodes[se.a].entity.name === hit.simNode.entity.name ||
        simNodes[se.b].entity.name === hit.simNode.entity.name
      ),
    }
    rebuildSelectedEdges()
  } else {
    selectedNodeIdx = -1
    alpha = Math.max(alpha, 0.08)
    selectedEntity.value = null
    rebuildSelectedEdges()
  }
}

function onWheel(e: WheelEvent) {
  e.preventDefault()
  const cx = (camera.left + camera.right) / 2
  const cy = (camera.top + camera.bottom) / 2
  const currentW = camera.right - camera.left
  const factor = e.deltaY > 0 ? 1.1 : 0.9
  const newW = Math.max(10, Math.min(80, currentW * factor))
  const aspect = (camera.right - camera.left) / (camera.top - camera.bottom)
  const newH = newW / aspect
  camera.left = cx - newW / 2; camera.right = cx + newW / 2
  camera.top = cy + newH / 2; camera.bottom = cy - newH / 2
  camera.updateProjectionMatrix()
}

onMounted(() => {
  buildSimulation()
  selectedNodeIdx = simNodes.reduce((best, sn, i) =>
    sn.entity.chapter_mentions.length > simNodes[best].entity.chapter_mentions.length ? i : best, 0)
  simNodes[selectedNodeIdx].x = 0
  simNodes[selectedNodeIdx].y = 0
  const el = containerRef.value!
  const w = el.clientWidth
  const h = el.clientHeight
  const aspect = w / h
  const frustumHalf = 22

  scene = new THREE.Scene()
  camera = new THREE.OrthographicCamera(
    -frustumHalf, frustumHalf,
    frustumHalf / aspect, -frustumHalf / aspect,
    0.1, 100,
  )
  camera.position.set(0, 0, 10)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(w, h)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(getThemeColors().bg)
  el.appendChild(renderer.domElement)

  css2dRenderer = new CSS2DRenderer()
  css2dRenderer.setSize(w, h)
  css2dRenderer.domElement.style.position = 'absolute'
  css2dRenderer.domElement.style.top = '0'
  css2dRenderer.domElement.style.left = '0'
  css2dRenderer.domElement.style.pointerEvents = 'none'
  el.appendChild(css2dRenderer.domElement)

  scene.add(new THREE.AmbientLight(0xffffff, 1.8))
  const dir = new THREE.DirectionalLight(0xffffff, 0.4)
  dir.position.set(0, 5, 10)
  scene.add(dir)

  // Edge materials (LineMaterial supports real linewidth in screen pixels)
  const themeColors = getThemeColors()
  function makeLineMat(color: number | THREE.Color, linewidth: number): LineMaterial {
    const mat = new LineMaterial({ color: color instanceof THREE.Color ? color.getHex() : color, linewidth, worldUnits: false })
    mat.resolution.set(w, h)
    edgeLineMats.push(mat)
    disposables.push(mat)
    return mat
  }
  cooccurEdgeMat = makeLineMat(themeColors.neutral, 1.5)
  neutralEdgeMat = makeLineMat(themeColors.neutral, 2)
  const hostileEdgeMat = makeLineMat(0xb85a5a, 2)
  const alliedEdgeMat = makeLineMat(0x6b9e8f, 2)
  ;[cooccurEdgeMat, neutralEdgeMat, hostileEdgeMat, alliedEdgeMat].forEach(m => {
    m.transparent = true; m.opacity = 0.08
  })

  // Build per-kind edge groups with updatable buffers
  interface EdgeGroup {
    edges: SimEdge[]
    verts: Float32Array
    geo: LineSegmentsGeometry
  }
  function makeEdgeGroup(edges: SimEdge[], mat: LineMaterial): EdgeGroup | null {
    if (!edges.length) return null
    const verts = new Float32Array(edges.length * 6)
    const geo = new LineSegmentsGeometry()
    geo.setPositions(verts)
    scene.add(new LineSegments2(geo, mat))
    disposables.push(geo)
    return { edges, verts, geo }
  }

  const edgeGroups: EdgeGroup[] = [
    makeEdgeGroup(simEdges.filter(e => e.kind === 'cooccur'), cooccurEdgeMat),
    makeEdgeGroup(simEdges.filter(e => e.kind === 'neutral'), neutralEdgeMat),
    makeEdgeGroup(simEdges.filter(e => e.kind === 'hostile'), hostileEdgeMat),
    makeEdgeGroup(simEdges.filter(e => e.kind === 'allied'), alliedEdgeMat),
  ].filter((g): g is EdgeGroup => g !== null)

  // Selected-edge overlay (vertex-colored, rebuilt on selection change)
  const selGeo = new LineSegmentsGeometry()
  const selMat = new LineMaterial({ linewidth: 2.5, worldUnits: false, vertexColors: true })
  selMat.resolution.set(w, h)
  edgeLineMats.push(selMat)
  scene.add(new LineSegments2(selGeo, selMat))
  disposables.push(selGeo, selMat)

  const KIND_RGB: Record<SimEdge['kind'], [number, number, number]> = {
    hostile: [0.722, 0.353, 0.353],
    allied:  [0.420, 0.620, 0.561],
    neutral: [0.700, 0.650, 0.580],
    cooccur: [0.600, 0.550, 0.490],
  }

  rebuildSelectedEdges = () => {
    if (selectedNodeIdx < 0) { selGeo.setPositions(new Float32Array(6)); return }
    const adj = simEdges.filter(e => e.a === selectedNodeIdx || e.b === selectedNodeIdx)
    if (!adj.length) { selGeo.setPositions(new Float32Array(6)); return }
    const verts = new Float32Array(adj.length * 6)
    const colors = new Float32Array(adj.length * 6)
    adj.forEach((e, i) => {
      const ni = simNodes[e.a]; const nj = simNodes[e.b]
      verts[i*6+0]=ni.x; verts[i*6+1]=ni.y; verts[i*6+2]=-0.4
      verts[i*6+3]=nj.x; verts[i*6+4]=nj.y; verts[i*6+5]=-0.4
      const [r, g, b] = KIND_RGB[e.kind]
      colors[i*6+0]=r; colors[i*6+1]=g; colors[i*6+2]=b
      colors[i*6+3]=r; colors[i*6+4]=g; colors[i*6+5]=b
    })
    selGeo.setPositions(verts)
    selGeo.setColors(colors)
  }

  function updateEdges() {
    for (const grp of edgeGroups) {
      for (let i = 0; i < grp.edges.length; i++) {
        const e = grp.edges[i]
        const ni = simNodes[e.a]
        const nj = simNodes[e.b]
        grp.verts[i * 6 + 0] = ni.x; grp.verts[i * 6 + 1] = ni.y; grp.verts[i * 6 + 2] = -0.5
        grp.verts[i * 6 + 3] = nj.x; grp.verts[i * 6 + 4] = nj.y; grp.verts[i * 6 + 5] = -0.5
      }
      grp.geo.setPositions(grp.verts)
    }
    // Update selected-edge overlay positions each frame
    if (selectedNodeIdx >= 0) {
      const adj = simEdges.filter(e => e.a === selectedNodeIdx || e.b === selectedNodeIdx)
      const verts = new Float32Array(adj.length * 6)
      adj.forEach((e, i) => {
        const ni = simNodes[e.a]; const nj = simNodes[e.b]
        verts[i*6+0]=ni.x; verts[i*6+1]=ni.y; verts[i*6+2]=-0.4
        verts[i*6+3]=nj.x; verts[i*6+4]=nj.y; verts[i*6+5]=-0.4
      })
      selGeo.setPositions(verts)
    }
  }

  // Nodes
  simNodes.forEach((sn, i) => {
    const color = new THREE.Color(nodeDegreeColor(sn.degree))
    const geo = new THREE.SphereGeometry(sn.radius, 24, 12)
    const mat = new THREE.MeshStandardMaterial({
      color, emissive: new THREE.Color(0x000000), emissiveIntensity: 0,
      roughness: 0.5, metalness: 0.1,
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(sn.x, sn.y, 0)
    mesh.userData = { nodeIdx: i }
    scene.add(mesh)
    disposables.push(geo, mat)

    let label: CSS2DObject | null = null
    if (sn.entity.importance >= 0.5) {
      const div = document.createElement('div')
      div.className = 'graph-node-label'
      div.textContent = sn.entity.name
      label = new CSS2DObject(div)
      label.position.set(sn.x, sn.y + sn.radius + 0.35, 0)
      scene.add(label)
    }
    nodeEntries.push({ mesh, label, simNode: sn, baseColor: color.clone(), material: mat })
  })

  // Open detail panel for auto-selected node
  const defaultEntry = nodeEntries[selectedNodeIdx]
  if (defaultEntry) {
    selectedEntity.value = {
      entity: defaultEntry.simNode.entity,
      colorHex: '#' + new THREE.Color(nodeDegreeColor(defaultEntry.simNode.degree)).getHexString(),
      edges: simEdges.filter(se =>
        simNodes[se.a].entity.name === defaultEntry.simNode.entity.name ||
        simNodes[se.b].entity.name === defaultEntry.simNode.entity.name
      ),
    }
  }
  rebuildSelectedEdges()

  renderer.domElement.addEventListener('pointerdown', onPointerDown)
  renderer.domElement.addEventListener('pointermove', onPointerMove)
  renderer.domElement.addEventListener('pointerup', onPointerUp)
  renderer.domElement.addEventListener('click', onClick)
  renderer.domElement.addEventListener('wheel', onWheel, { passive: false })

  ro = new ResizeObserver(() => {
    const nw = el.clientWidth
    const nh = el.clientHeight
    renderer.setSize(nw, nh)
    css2dRenderer.setSize(nw, nh)
    edgeLineMats.forEach(m => m.resolution.set(nw, nh))
    const hw = (camera.right - camera.left) / 2
    const cx = (camera.left + camera.right) / 2
    const cy = (camera.top + camera.bottom) / 2
    camera.left = cx - hw; camera.right = cx + hw
    camera.top = cy + hw / (nw / nh); camera.bottom = cy - hw / (nw / nh)
    camera.updateProjectionMatrix()
  })
  ro.observe(el)

  const BASE_FRUSTUM_W = 44
  const BASE_LABEL_PX = 11
  let lastFrustumW = 0

  function loop() {
    animFrameId = requestAnimationFrame(loop)
    tickSimulation()
    for (const entry of nodeEntries) {
      entry.mesh.position.set(entry.simNode.x, entry.simNode.y, 0)
      if (entry.label) {
        entry.label.position.set(entry.simNode.x, entry.simNode.y + entry.simNode.radius + 0.35, 0)
      }
    }
    updateEdges()
    const fw = camera.right - camera.left
    if (fw !== lastFrustumW) {
      lastFrustumW = fw
      const px = Math.max(6, Math.min(32, Math.round(BASE_LABEL_PX * BASE_FRUSTUM_W / fw)))
      css2dRenderer.domElement.style.setProperty('--graph-label-size', px + 'px')
    }
    renderer.render(scene, camera)
    css2dRenderer.render(scene, camera)
  }
  loop()
})

onUnmounted(() => {
  cancelAnimationFrame(animFrameId)
  ro?.disconnect()
  if (renderer) {
    renderer.domElement.removeEventListener('pointerdown', onPointerDown)
    renderer.domElement.removeEventListener('pointermove', onPointerMove)
    renderer.domElement.removeEventListener('pointerup', onPointerUp)
    renderer.domElement.removeEventListener('click', onClick)
    renderer.domElement.removeEventListener('wheel', onWheel)
  }
  disposables.forEach(d => d.dispose())
  renderer?.dispose()
  if (containerRef.value) containerRef.value.innerHTML = ''
  nodeEntries.length = 0
  simNodes.length = 0
  simEdges.length = 0
})

function relatedEntityName(edge: SimEdge, selfName: string): string {
  const a = simNodes[edge.a].entity.name
  return a === selfName ? simNodes[edge.b].entity.name : a
}
</script>

<template>
  <div class="graph-view" ref="containerRef">
    <transition name="panel-slide">
      <aside v-if="selectedEntity" class="detail-panel" key="panel">
        <button class="panel-close" @click="selectedEntity = null">✕</button>
        <div class="panel-color-bar" :style="{ background: selectedEntity.colorHex }"></div>
        <h2 class="panel-title">{{ selectedEntity.entity.name }}</h2>
        <div class="panel-importance">
          <span class="panel-importance-label">Importance</span>
          <div class="panel-importance-track">
            <div
              class="panel-importance-fill"
              :style="{ width: (selectedEntity.entity.importance * 100) + '%', background: selectedEntity.colorHex }"
            ></div>
          </div>
        </div>
        <p class="panel-desc">{{ selectedEntity.entity.short_description }}</p>
        <section v-if="selectedEntity.entity.chapter_mentions.length" class="panel-section">
          <h3>Chapter Appearances ({{ selectedEntity.entity.chapter_mentions.length }})</h3>
          <ul>
            <li v-for="cm in selectedEntity.entity.chapter_mentions" :key="cm.chapter">
              <span class="chapter-badge">Ch. {{ cm.chapter }}</span>{{ cm.context }}
            </li>
          </ul>
        </section>
        <section v-if="selectedEntity.edges.length" class="panel-section">
          <h3>Relationships ({{ selectedEntity.edges.length }})</h3>
          <ul class="rel-list">
            <li v-for="(edge, ei) in selectedEntity.edges" :key="edge.relation?.id ?? ei" class="rel-item">
              <span class="rel-other">{{ relatedEntityName(edge, selectedEntity.entity.name) }}</span>
              <span class="rel-type" :class="'rel-' + edge.kind">{{ edge.relation ? edge.relation.relation_type.replace(/_/g, ' ') : 'co-occurrence' }}</span>
            </li>
          </ul>
        </section>
      </aside>
    </transition>
    <div class="graph-hint">Drag nodes · Pan · Scroll to zoom · Click for details</div>
  </div>
</template>

<style scoped>
.graph-view {
  position: relative;
  width: 100%;
  height: calc(100svh - var(--header-height));
  overflow: hidden;
  background: var(--bg);
}

.graph-view :deep(canvas) {
  display: block;
  width: 100% !important;
  height: 100% !important;
}

.detail-panel {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 320px;
  background: var(--bg-2);
  border-left: 1px solid var(--border);
  padding: 1.5rem;
  overflow-y: auto;
  z-index: 10;
  box-shadow: var(--shadow);
}

.panel-color-bar {
  height: 4px;
  border-radius: 2px;
  margin-bottom: 1rem;
}

.panel-title {
  font-family: var(--heading);
  font-size: 1.1rem;
  color: var(--text-h);
  margin: 0 0 0.5rem;
}

.panel-importance {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.panel-importance-label {
  font-size: 0.72rem;
  font-family: var(--mono);
  color: var(--text);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space: nowrap;
}

.panel-importance-track {
  flex: 1;
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
}

.panel-importance-fill {
  height: 100%;
  border-radius: 2px;
}

.panel-desc {
  font-size: 0.85rem;
  color: var(--text);
  line-height: 1.6;
  margin-bottom: 1rem;
}

.panel-section h3 {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text);
  margin: 0 0 0.4rem;
}

.panel-section ul {
  margin: 0 0 1rem;
  padding-left: 0;
  list-style: none;
}

.panel-section li {
  font-size: 0.82rem;
  color: var(--text-h);
  line-height: 1.5;
  margin-bottom: 0.35rem;
}

.chapter-badge {
  font-family: var(--mono);
  font-size: 0.72rem;
  color: var(--accent);
  margin-right: 0.4rem;
}

.rel-list {
  display: flex;
  flex-direction: column;
}

.rel-item {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.3rem 0;
  border-bottom: 1px solid var(--border);
}

.rel-item:last-child { border-bottom: none; }

.rel-other {
  font-size: 0.82rem;
  color: var(--text-h);
  font-weight: 500;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rel-type {
  font-size: 0.68rem;
  font-family: var(--mono);
  padding: 1px 5px;
  border-radius: 3px;
  white-space: nowrap;
  flex-shrink: 0;
  background: var(--code-bg);
  color: var(--text);
}

.rel-hostile {
  background: rgba(184, 90, 90, 0.12);
  color: #b85a5a;
}

.rel-allied {
  background: rgba(107, 158, 143, 0.12);
  color: #4a8a7a;
}

.panel-close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text);
  font-size: 0.85rem;
  padding: 4px 7px;
  border-radius: 4px;
  line-height: 1;
}

.panel-close:hover {
  background: var(--code-bg);
  color: var(--text-h);
}

.graph-hint {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  font-size: 0.72rem;
  color: var(--text);
  pointer-events: none;
  opacity: 0.55;
  font-family: var(--sans);
}

.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: transform 0.22s ease, opacity 0.22s ease;
}

.panel-slide-enter-from,
.panel-slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>

<style>
.graph-node-label {
  font-family: var(--sans);
  font-size: var(--graph-label-size, 0.7rem);
  color: var(--text-h);
  white-space: nowrap;
  transform: translateX(-50%);
  pointer-events: none;
  text-align: center;
  text-shadow: 0 1px 3px var(--bg), 0 -1px 3px var(--bg);
}
</style>
