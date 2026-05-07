<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js'
import { useColorScheme } from '@/composables/useColorScheme'
import type { StoryArc, NovelSummary } from '@/types/timeline'
import novelData from '@/assets/wiki/novel_summary.json'

const summary = novelData as NovelSummary

const ARC_COLORS = [0xc87d4a, 0x6b9e8f, 0x9a6b9e, 0xc4a030, 0x5a8ab8, 0xb85a5a]

const SPACING = 3.5
const CIRCLE_RADIUS = 0.7
const X_PAD = 1.5
const TOTAL_SPAN = (summary.arcs.length - 1) * SPACING
const CENTER_X = TOTAL_SPAN / 2

function computeFrustum(containerW: number, containerH: number) {
  const aspect = containerW / containerH
  const fw = TOTAL_SPAN + X_PAD * 2
  const fh = fw / aspect
  return { fw, fh }
}

function nodeX(i: number): number {
  return i * SPACING
}

function readCSSVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function getThemeColors() {
  return {
    bg: new THREE.Color(readCSSVar('--bg') || '#faf7f2'),
    border: new THREE.Color(readCSSVar('--border') || '#e0d8cc'),
  }
}

const { scheme } = useColorScheme()

const containerRef = ref<HTMLDivElement | null>(null)
const selectedArc = ref<(StoryArc & { colorHex: string }) | null>(null)

interface NodeEntry {
  mesh: THREE.Mesh
  arcIndex: number
  baseColor: THREE.Color
  material: THREE.MeshStandardMaterial
}

let renderer: THREE.WebGLRenderer
let css2dRenderer: CSS2DRenderer
let scene: THREE.Scene
let camera: THREE.OrthographicCamera
let animFrameId: number
const nodes: NodeEntry[] = []
let hoveredNode: NodeEntry | null = null
const disposables: Array<{ dispose(): void }> = []
let lineMaterial: THREE.LineBasicMaterial
let ro: ResizeObserver

let isDragging = false
let dragStartX = 0
let dragLastX = 0

const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

function getMouseNDC(event: MouseEvent | PointerEvent) {
  const rect = renderer.domElement.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
}

function findIntersectedNode(): NodeEntry | null {
  raycaster.setFromCamera(mouse, camera)
  const hits = raycaster.intersectObjects(nodes.map(n => n.mesh), false)
  if (!hits.length) return null
  const idx = hits[0].object.userData.arcIndex as number
  return nodes[idx] ?? null
}

function onMouseMove(e: MouseEvent) {
  getMouseNDC(e)
  const hit = findIntersectedNode()

  if (hoveredNode && hoveredNode !== hit) {
    hoveredNode.material.emissiveIntensity = 0
    hoveredNode.mesh.scale.set(1, 1, 1)
    containerRef.value!.style.cursor = 'default'
  }
  if (hit && hit !== hoveredNode) {
    hit.material.emissiveIntensity = 0.3
    hit.material.emissive.copy(hit.baseColor)
    hit.mesh.scale.set(1.2, 1.2, 1.2)
    containerRef.value!.style.cursor = 'pointer'
  }
  hoveredNode = hit
}

function onClick(e: MouseEvent) {
  if (Math.abs(e.clientX - dragStartX) > 4) return
  getMouseNDC(e)
  const hit = findIntersectedNode()
  if (hit) {
    const arc = summary.arcs[hit.arcIndex]
    selectedArc.value = {
      ...arc,
      colorHex: '#' + new THREE.Color(ARC_COLORS[hit.arcIndex]).getHexString(),
    }
  } else {
    selectedArc.value = null
  }
}

function onPointerDown(e: PointerEvent) {
  isDragging = true
  dragStartX = dragLastX = e.clientX
  renderer.domElement.setPointerCapture(e.pointerId)
}

function onPointerMove(e: PointerEvent) {
  if (!isDragging) return
  const dx = e.clientX - dragLastX
  dragLastX = e.clientX

  const rect = renderer.domElement.getBoundingClientRect()
  const worldWidth = camera.right - camera.left
  const unitsPerPixel = worldWidth / rect.width

  camera.left -= dx * unitsPerPixel
  camera.right -= dx * unitsPerPixel

  const halfFrustum = (camera.right - camera.left) / 2
  const cx = (camera.left + camera.right) / 2
  const clamped = Math.max(-X_PAD + halfFrustum, Math.min(TOTAL_SPAN + X_PAD - halfFrustum, cx))
  const delta = clamped - cx
  camera.left += delta
  camera.right += delta

  camera.updateProjectionMatrix()
}

function onPointerUp(e: PointerEvent) {
  isDragging = false
  renderer.domElement.releasePointerCapture(e.pointerId)
}

function animate() {
  animFrameId = requestAnimationFrame(animate)
  renderer.render(scene, camera)
  css2dRenderer.render(scene, camera)
}

function applyTheme() {
  const colors = getThemeColors()
  renderer.setClearColor(colors.bg)
  if (lineMaterial) lineMaterial.color.copy(colors.border)
}

watch(scheme, applyTheme)

onMounted(() => {
  const el = containerRef.value!
  const w = el.clientWidth
  const h = el.clientHeight

  scene = new THREE.Scene()

  const { fw, fh } = computeFrustum(w, h)
  camera = new THREE.OrthographicCamera(
    CENTER_X - fw / 2,
    CENTER_X + fw / 2,
    fh / 2,
    -fh / 2,
    0.1,
    100,
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

  scene.add(new THREE.AmbientLight(0xffffff, 1.5))
  const dir = new THREE.DirectionalLight(0xffffff, 0.5)
  dir.position.set(0, 5, 8)
  scene.add(dir)

  // Connecting line
  const lineGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(TOTAL_SPAN, 0, 0),
  ])
  lineMaterial = new THREE.LineBasicMaterial({ color: getThemeColors().border })
  scene.add(new THREE.Line(lineGeo, lineMaterial))
  disposables.push(lineGeo, lineMaterial)

  // Arc nodes
  summary.arcs.forEach((arc, i) => {
    const geo = new THREE.SphereGeometry(CIRCLE_RADIUS, 32, 16)
    const color = new THREE.Color(ARC_COLORS[i])
    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: new THREE.Color(0x000000),
      emissiveIntensity: 0,
      roughness: 0.5,
      metalness: 0.1,
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(nodeX(i), 0, 0)
    mesh.userData = { arcIndex: i }
    scene.add(mesh)
    nodes.push({ mesh, arcIndex: i, baseColor: color.clone(), material: mat })
    disposables.push(geo, mat)

    // Arc number inside circle
    const numDiv = document.createElement('div')
    numDiv.className = 'timeline-node-number'
    numDiv.textContent = String(i + 1)
    const numLabel = new CSS2DObject(numDiv)
    numLabel.position.set(nodeX(i), 0, CIRCLE_RADIUS + 0.01)
    scene.add(numLabel)

    // Title label above
    const titleDiv = document.createElement('div')
    titleDiv.className = 'timeline-node-label'
    titleDiv.textContent = arc.title
    const titleLabel = new CSS2DObject(titleDiv)
    titleLabel.position.set(nodeX(i), CIRCLE_RADIUS + 0.55, 0)
    scene.add(titleLabel)

    // Chapter range label below
    const chapDiv = document.createElement('div')
    chapDiv.className = 'timeline-node-chapters'
    chapDiv.textContent = `Ch. ${arc.chapter_start}–${arc.chapter_end}`
    const chapLabel = new CSS2DObject(chapDiv)
    chapLabel.position.set(nodeX(i), -(CIRCLE_RADIUS + 0.55), 0)
    scene.add(chapLabel)
  })

  renderer.domElement.addEventListener('mousemove', onMouseMove)
  renderer.domElement.addEventListener('click', onClick)
  renderer.domElement.addEventListener('pointerdown', onPointerDown)
  renderer.domElement.addEventListener('pointermove', onPointerMove)
  renderer.domElement.addEventListener('pointerup', onPointerUp)

  ro = new ResizeObserver(() => {
    const nw = el.clientWidth
    const nh = el.clientHeight
    renderer.setSize(nw, nh)
    css2dRenderer.setSize(nw, nh)
    const { fw: nfw, fh: nfh } = computeFrustum(nw, nh)
    const cx = (camera.left + camera.right) / 2
    camera.left = cx - nfw / 2
    camera.right = cx + nfw / 2
    camera.top = nfh / 2
    camera.bottom = -nfh / 2
    camera.updateProjectionMatrix()
  })
  ro.observe(el)

  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animFrameId)
  ro?.disconnect()

  if (renderer) {
    renderer.domElement.removeEventListener('mousemove', onMouseMove)
    renderer.domElement.removeEventListener('click', onClick)
    renderer.domElement.removeEventListener('pointerdown', onPointerDown)
    renderer.domElement.removeEventListener('pointermove', onPointerMove)
    renderer.domElement.removeEventListener('pointerup', onPointerUp)
  }

  disposables.forEach(d => d.dispose())
  renderer?.dispose()

  if (containerRef.value) containerRef.value.innerHTML = ''
  nodes.length = 0
})
</script>

<template>
  <div class="timeline-view" ref="containerRef">
    <transition name="panel-slide">
      <aside v-if="selectedArc" class="detail-panel" key="panel">
        <button class="panel-close" @click="selectedArc = null">✕</button>
        <div class="panel-arc-color-bar" :style="{ background: selectedArc.colorHex }"></div>
        <h2 class="panel-title">{{ selectedArc.title }}</h2>
        <p class="panel-chapters">Chapters {{ selectedArc.chapter_start }}–{{ selectedArc.chapter_end }}</p>
        <p class="panel-desc">{{ selectedArc.description }}</p>
        <section class="panel-section">
          <h3>Main Characters</h3>
          <ul>
            <li v-for="c in selectedArc.main_characters" :key="c">{{ c }}</li>
          </ul>
        </section>
        <section class="panel-section">
          <h3>Key Events</h3>
          <ol>
            <li v-for="e in selectedArc.key_events" :key="e">{{ e }}</li>
          </ol>
        </section>
      </aside>
    </transition>
    <div class="timeline-hint">Drag to pan · Click a circle for details</div>
  </div>
</template>

<style scoped>
.timeline-view {
  position: relative;
  width: 100%;
  height: calc(100svh - var(--header-height));
  overflow: hidden;
  background: var(--bg);
}

.timeline-view :deep(canvas) {
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

.panel-arc-color-bar {
  height: 4px;
  border-radius: 2px;
  margin-bottom: 1rem;
}

.panel-title {
  font-family: var(--heading);
  font-size: 1.1rem;
  color: var(--text-h);
  margin: 0 0 0.25rem;
}

.panel-chapters {
  font-size: 0.8rem;
  color: var(--accent);
  margin: 0 0 0.75rem;
  font-family: var(--mono);
}

.panel-desc {
  font-size: 0.85rem;
  color: var(--text);
  line-height: 1.6;
  margin-bottom: 1rem;
}

.panel-section h3 {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text);
  margin: 0 0 0.4rem;
}

.panel-section ul,
.panel-section ol {
  margin: 0 0 1rem;
  padding-left: 1.2rem;
}

.panel-section li {
  font-size: 0.82rem;
  color: var(--text-h);
  line-height: 1.5;
  margin-bottom: 0.2rem;
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

.timeline-hint {
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

<!-- Non-scoped: CSS2DObject elements are injected outside Vue scoped attribute scope -->
<style>
.timeline-node-label {
  font-family: var(--sans);
  font-size: 0.75rem;
  color: var(--text-h);
  white-space: nowrap;
  transform: translateX(-50%);
  pointer-events: none;
  text-align: center;
  text-shadow: 0 1px 3px var(--bg), 0 -1px 3px var(--bg);
}

.timeline-node-chapters {
  font-family: var(--mono);
  font-size: 0.62rem;
  color: var(--accent);
  transform: translateX(-50%);
  pointer-events: none;
  text-align: center;
  opacity: 0.85;
}

.timeline-node-number {
  font-family: var(--mono);
  font-size: 0.8rem;
  font-weight: 700;
  color: #fff;
  transform: translate(-50%, -50%);
  pointer-events: none;
  line-height: 1;
  text-shadow: 0 1px 2px rgba(0,0,0,0.4);
}
</style>
