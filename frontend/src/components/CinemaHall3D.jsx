/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState, useMemo } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import gsap from 'gsap'
import {
  Eye,
  RotateCcw,
  Maximize2,
  Minimize2,
  Sparkles,
  Check,
  Film,
  Compass,
  Layers,
  ChevronRight,
  Info,
  Monitor,
} from 'lucide-react'

// Color Constants for Ultra-Luxury 2026 Cinema Palette
const PALETTE = {
  seatAvailable: new THREE.Color('#8b1528'),   // Deep rich velvet wine red
  seatHovered: new THREE.Color('#e11d48'),     // Luminous crimson rim
  seatSelected: new THREE.Color('#f59e0b'),    // Radiant amber/gold glow
  seatHeld: new THREE.Color('#ea580c'),        // Dim held orange
  seatBooked: new THREE.Color('#222625'),      // Dark charcoal gray
  carpet: '#0c0f0e',
  stepAisleGold: '#f59e0b',
  acousticWood: '#121514',
  ledGold: '#d97706',
  projectorBeam: '#e0f2fe',
}

// Generate dynamic 4K cinematic billboard canvas texture for screen
function createCinematicScreenTexture(movie) {
  const canvas = document.createElement('canvas')
  canvas.width = 2048
  canvas.height = 1024
  const ctx = canvas.getContext('2d')

  // Deep cinematic backdrop gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 1024)
  grad.addColorStop(0, '#040707')
  grad.addColorStop(0.5, '#0b1614')
  grad.addColorStop(1, '#020303')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 2048, 1024)

  // Subtle anamorphic cinematic flare
  const flare = ctx.createRadialGradient(1024, 512, 50, 1024, 512, 900)
  flare.addColorStop(0, 'rgba(215, 90, 54, 0.45)')
  flare.addColorStop(0.4, 'rgba(56, 189, 248, 0.18)')
  flare.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = flare
  ctx.fillRect(0, 0, 2048, 1024)

  // Top & Bottom 2.39:1 CinemaScope letterbox lines
  ctx.strokeStyle = 'rgba(215, 90, 54, 0.4)'
  ctx.lineWidth = 4
  ctx.strokeRect(60, 60, 1928, 904)

  // Cinema Brand
  ctx.fillStyle = '#f59e0b'
  ctx.font = 'bold 36px "DM Mono", monospace'
  ctx.letterSpacing = '12px'
  ctx.fillText('LUMIÈRE 2026 · AUDITORIUM 01', 120, 140)

  // Sound Spec Badge
  ctx.fillStyle = '#94a3b8'
  ctx.font = '28px "DM Mono", monospace'
  ctx.letterSpacing = '6px'
  ctx.fillText('DOLBY ATMOS 64-CHANNEL 3D SOUND · 4K LASER HDR', 120, 190)

  // Movie Title
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 110px "Newsreader", serif'
  const title = (movie?.title || 'SEATLOCK PREMIERE').toUpperCase()
  ctx.fillText(title, 120, 540)

  // Subtitle / Specs
  ctx.fillStyle = '#d75a36'
  ctx.font = 'bold 38px "DM Mono", monospace'
  ctx.fillText(
    `${movie?.genre || 'FEATURE FILM'} · ${movie?.language || 'ORIGINAL'} · ${movie?.durationMin || 150} MIN`,
    120,
    620
  )

  // Decorative subtle optical wave pattern in bottom-right
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)'
  ctx.lineWidth = 2
  for (let i = 0; i < 6; i++) {
    ctx.beginPath()
    ctx.arc(1750, 780, 80 + i * 30, 0, Math.PI * 2)
    ctx.stroke()
  }

  // Live Screen Watermark
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
  ctx.font = '24px "DM Mono", monospace'
  ctx.fillText('ULTRA-LUXURY AUDITORIUM VIEW · CHOOSE YOUR SEAT IN 3D', 120, 880)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

// Generate 360-degree Equirectangular Panoramic Auditorium Texture
function create360CinemaPanoramaTexture(movie) {
  const canvas = document.createElement('canvas')
  canvas.width = 4096
  canvas.height = 2048
  const ctx = canvas.getContext('2d')

  // 1. Deep Obsidian / Crimson background gradient for 360 sphere
  const bgGrad = ctx.createLinearGradient(0, 0, 0, 2048)
  bgGrad.addColorStop(0, '#040407')       // Zenith / Ceiling
  bgGrad.addColorStop(0.3, '#0b0204')     // Upper acoustic walls
  bgGrad.addColorStop(0.5, '#170307')     // Eye-level perimeter
  bgGrad.addColorStop(0.7, '#080102')     // Lower seating base
  bgGrad.addColorStop(1, '#020204')       // Nadir / Carpet Floor
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, 4096, 2048)

  // 2. Ceiling Spotlights & Acoustic Grid
  ctx.save()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)'
  ctx.lineWidth = 1.5
  for (let y = 80; y <= 560; y += 80) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(4096, y)
    ctx.stroke()
  }
  for (let x = 0; x < 4096; x += 160) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, 560)
    ctx.stroke()
  }

  // Warm circular recessed spotlights
  for (let x = 160; x < 4096; x += 320) {
    for (let y = 140; y < 540; y += 120) {
      const spotGrad = ctx.createRadialGradient(x, y, 3, x, y, 48)
      spotGrad.addColorStop(0, 'rgba(255, 248, 235, 0.95)')
      spotGrad.addColorStop(0.25, 'rgba(245, 158, 11, 0.5)')
      spotGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = spotGrad
      ctx.beginPath()
      ctx.arc(x, y, 48, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()

  // 3. Front Proscenium & Curved CinemaScope Screen
  const frontCenterX = 2048
  const frontCenterY = 980

  const screenGlow = ctx.createRadialGradient(frontCenterX, frontCenterY, 100, frontCenterX, frontCenterY, 1250)
  screenGlow.addColorStop(0, 'rgba(245, 158, 11, 0.28)')
  screenGlow.addColorStop(0.35, 'rgba(215, 90, 54, 0.16)')
  screenGlow.addColorStop(0.7, 'rgba(56, 189, 248, 0.06)')
  screenGlow.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = screenGlow
  ctx.fillRect(frontCenterX - 1400, frontCenterY - 600, 2800, 1200)

  // Screen Backing Frame
  const scrW = 1650
  const scrH = 750
  const scrX = frontCenterX - scrW / 2
  const scrY = frontCenterY - scrH / 2

  ctx.fillStyle = '#050708'
  ctx.fillRect(scrX - 12, scrY - 12, scrW + 24, scrH + 24)

  const scrGrad = ctx.createLinearGradient(scrX, scrY, scrX + scrW, scrY + scrH)
  scrGrad.addColorStop(0, '#0c1a17')
  scrGrad.addColorStop(0.5, '#1b0e0c')
  scrGrad.addColorStop(1, '#081216')
  ctx.fillStyle = scrGrad
  ctx.fillRect(scrX, scrY, scrW, scrH)

  // Screen Graphics
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)'
  ctx.lineWidth = 3
  ctx.strokeRect(scrX + 30, scrY + 30, scrW - 60, scrH - 60)

  ctx.fillStyle = '#f59e0b'
  ctx.font = 'bold 32px "DM Mono", monospace'
  ctx.letterSpacing = '10px'
  ctx.fillText('LUMIÈRE 2026 · AUDITORIUM 01', scrX + 60, scrY + 95)

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 88px "Newsreader", serif'
  const title = (movie?.title || 'SEATLOCK PREMIERE').toUpperCase()
  ctx.fillText(title, scrX + 60, scrY + 410)

  ctx.fillStyle = '#d75a36'
  ctx.font = 'bold 30px "DM Mono", monospace'
  ctx.letterSpacing = '4px'
  ctx.fillText(
    `${movie?.genre || 'FEATURE FILM'} · DOLBY ATMOS · 4K LASER`,
    scrX + 60,
    scrY + 480
  )

  // 4. Acoustic Timber Slats & Vertical LED Wall Strips
  const drawWallSconces = (startX, endX) => {
    for (let x = startX; x <= endX; x += 180) {
      ctx.fillStyle = 'rgba(24, 28, 26, 0.85)'
      ctx.fillRect(x - 16, 680, 32, 700)

      const ledGrad = ctx.createLinearGradient(x, 680, x, 1380)
      ledGrad.addColorStop(0, 'rgba(245, 158, 11, 0)')
      ledGrad.addColorStop(0.2, 'rgba(245, 158, 11, 0.85)')
      ledGrad.addColorStop(0.5, 'rgba(255, 248, 235, 1)')
      ledGrad.addColorStop(0.8, 'rgba(245, 158, 11, 0.85)')
      ledGrad.addColorStop(1, 'rgba(245, 158, 11, 0)')
      ctx.fillStyle = ledGrad
      ctx.fillRect(x - 2, 700, 4, 660)

      const glow = ctx.createRadialGradient(x, 1030, 5, x, 1030, 90)
      glow.addColorStop(0, 'rgba(245, 158, 11, 0.4)')
      glow.addColorStop(1, 'rgba(245, 158, 11, 0)')
      ctx.fillStyle = glow
      ctx.fillRect(x - 90, 940, 180, 180)
    }
  }

  drawWallSconces(120, 1050)
  drawWallSconces(3040, 3970)

  // 5. Rear Wall Projector Booth Aperture
  const rearCenterX = 0
  const rearCenterAltX = 4096
  const boothY = 960

  const drawProjectorBeam = (cx) => {
    ctx.fillStyle = '#060809'
    ctx.fillRect(cx - 180, boothY - 90, 360, 180)

    const glassGrad = ctx.createLinearGradient(cx - 160, boothY, cx + 160, boothY)
    glassGrad.addColorStop(0, 'rgba(224, 242, 254, 0.95)')
    glassGrad.addColorStop(0.5, 'rgba(255, 255, 255, 1)')
    glassGrad.addColorStop(1, 'rgba(224, 242, 254, 0.95)')
    ctx.fillStyle = glassGrad
    ctx.fillRect(cx - 160, boothY - 70, 320, 140)

    const beamCone = ctx.createRadialGradient(cx, boothY, 20, cx, boothY, 450)
    beamCone.addColorStop(0, 'rgba(224, 242, 254, 0.75)')
    beamCone.addColorStop(0.3, 'rgba(56, 189, 248, 0.25)')
    beamCone.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = beamCone
    ctx.beginPath()
    ctx.arc(cx, boothY, 450, 0, Math.PI * 2)
    ctx.fill()
  }

  drawProjectorBeam(rearCenterX)
  drawProjectorBeam(rearCenterAltX)

  // 6. Carpet Floor Base & Gold Step Lighting
  const floorGrad = ctx.createLinearGradient(0, 1380, 0, 2048)
  floorGrad.addColorStop(0, '#0d0f11')
  floorGrad.addColorStop(0.4, '#080a09')
  floorGrad.addColorStop(1, '#040505')
  ctx.fillStyle = floorGrad
  ctx.fillRect(0, 1380, 4096, 668)

  ctx.strokeStyle = 'rgba(245, 158, 11, 0.55)'
  ctx.lineWidth = 4
  for (let y = 1420; y <= 1960; y += 54) {
    ctx.beginPath()
    ctx.moveTo(350, y)
    ctx.lineTo(3746, y)
    ctx.stroke()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

// Generate realistic dark acoustic carpet texture
function createAuditoriumFloorTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1024
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#0c0f0e'
  ctx.fillRect(0, 0, 1024, 1024)

  ctx.fillStyle = 'rgba(255, 255, 255, 0.022)'
  for (let x = 0; x < 1024; x += 16) {
    for (let y = 0; y < 1024; y += 16) {
      if ((x + y) % 32 === 0) {
        ctx.fillRect(x + 2, y + 2, 4, 4)
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(14, 14)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

export function CinemaHall3D({
  show,
  movie,
  seats = [],
  selectedSeats = [],
  activePovSeat = null,
  onToggleSeat,
  onProceed,
  onSwitchTo2D,
  hideDock = true,
  hideHeader = false,
}) {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const controlsRef = useRef(null)
  const panoMeshRef = useRef(null)
  const seatMeshesRef = useRef([])
  const screenMeshRef = useRef(null)
  const hoveredSeatRef = useRef(null)
  const raycasterRef = useRef(new THREE.Raycaster())
  const mouseRef = useRef(new THREE.Vector2())

  const [hoveredSeat, setHoveredSeat] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isCameraAnimating, setIsCameraAnimating] = useState(false)
  const [povSeat, setPovSeat] = useState(null)
  const [activePreset, setActivePreset] = useState('overview')

  // Default Cinematic Overview Camera Coordinates
  const defaultCamPos = useMemo(() => new THREE.Vector3(0, 7.5, 17.5), [])
  const defaultCamTarget = useMemo(() => new THREE.Vector3(0, 3.2, -4), [])

  // Camera Presets
  const cameraPresets = useMemo(() => ({
    overview: { pos: new THREE.Vector3(0, 7.5, 17.5), target: new THREE.Vector3(0, 3.2, -4), fov: 46 },
    screen: { pos: new THREE.Vector3(0, 4.8, 10.5), target: new THREE.Vector3(0, 4.2, -6.5), fov: 50 },
    center: { pos: new THREE.Vector3(0, 4.6, 5.5), target: new THREE.Vector3(0, 5, -18), fov: 46 },
    rear: { pos: new THREE.Vector3(0, 7.8, 22.5), target: new THREE.Vector3(0, 4, -8), fov: 46 },
    balcony: { pos: new THREE.Vector3(0, 13.5, 18.5), target: new THREE.Vector3(0, 2, 0), fov: 46 },
  }), [])

  // Price Subtotal for dock
  const totalAmount = useMemo(() => {
    return (selectedSeats || []).reduce((acc, s) => acc + Number(s.price || 0), 0)
  }, [selectedSeats])

  // Build auditorium & Three.js scene
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const width = container.clientWidth || 1200
    const height = container.clientHeight || 750

    // 1. Scene & Engine
    const scene = new THREE.Scene()
    const panoTexture = create360CinemaPanoramaTexture(show?.movie || movie)
    scene.background = panoTexture
    scene.fog = new THREE.FogExp2('#070908', 0.005)
    sceneRef.current = scene

    // Equirectangular 360 Sky Sphere (Extended beyond 80 units radius)
    const panoGeom = new THREE.SphereGeometry(140, 64, 32)
    panoGeom.scale(-1, 1, 1)
    const panoMat = new THREE.MeshBasicMaterial({ map: panoTexture, side: THREE.BackSide })
    const panoMesh = new THREE.Mesh(panoGeom, panoMat)
    panoMeshRef.current = panoMesh
    scene.add(panoMesh)

    // 2. Camera (Near 0.1, Far 1000)
    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 1000)
    camera.position.copy(defaultCamPos)
    cameraRef.current = camera

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.25
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    container.innerHTML = ''
    container.appendChild(renderer.domElement)
    renderer.domElement.style.pointerEvents = 'auto'
    rendererRef.current = renderer

    // 4. Smooth 360° Orbital Camera Controls (Strict Clamping to Prevent Black Void)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.copy(defaultCamTarget)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.rotateSpeed = 0.8
    controls.enableZoom = true
    controls.minDistance = 5
    controls.maxDistance = 24
    controls.enablePan = false

    // Allow full 360-degree horizontal rotation and generous vertical angle
    controls.minPolarAngle = 0.05
    controls.maxPolarAngle = Math.PI * 0.49
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    }
    renderer.domElement.style.touchAction = 'none'
    controls.update()
    controlsRef.current = controls

    // 5. Lighting Architecture
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.25)
    scene.add(ambientLight)

    const ceilingSpotLeft = new THREE.SpotLight(0xf59e0b, 2.6, 55, Math.PI / 4, 0.6, 1.0)
    ceilingSpotLeft.position.set(-8, 16, 6)
    ceilingSpotLeft.target.position.set(-3, 2, 6)
    scene.add(ceilingSpotLeft)
    scene.add(ceilingSpotLeft.target)

    const ceilingSpotRight = new THREE.SpotLight(0xf59e0b, 2.6, 55, Math.PI / 4, 0.6, 1.0)
    ceilingSpotRight.position.set(8, 16, 6)
    ceilingSpotRight.target.position.set(3, 2, 6)
    scene.add(ceilingSpotRight)
    scene.add(ceilingSpotRight.target)

    const projectorSpot = new THREE.SpotLight(0xe0f2fe, 3.8, 65, Math.PI / 4, 0.7, 1.2)
    projectorSpot.position.set(0, 15, 22)
    projectorSpot.target.position.set(0, 6.5, -20)
    projectorSpot.castShadow = true
    projectorSpot.shadow.mapSize.width = 1024
    projectorSpot.shadow.mapSize.height = 1024
    scene.add(projectorSpot)
    scene.add(projectorSpot.target)

    const screenSpillLight = new THREE.PointLight('#ff1e42', 4.0, 42, 1.2)
    screenSpillLight.position.set(0, 7.2, -18)
    scene.add(screenSpillLight)

    const screenWhiteSpill = new THREE.PointLight('#ffffff', 2.8, 48, 1.2)
    screenWhiteSpill.position.set(0, 8.5, -17)
    scene.add(screenWhiteSpill)

    const screenCyanRim = new THREE.PointLight('#38bdf8', 1.8, 30, 1.4)
    screenCyanRim.position.set(0, 8, -17.5)
    scene.add(screenCyanRim)

    // 6. Curved Parabolic Cinema Screen
    const screenWidth = 28
    const screenHeight = 12.5
    const screenGeom = new THREE.PlaneGeometry(screenWidth, screenHeight, 36, 1)
    const posAttr = screenGeom.attributes.position
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i)
      const curveZ = Math.pow(x / (screenWidth / 2), 2) * 2.8
      posAttr.setZ(i, curveZ)
    }
    screenGeom.computeVertexNormals()

    const screenTexture = createCinematicScreenTexture(show?.movie)
    const screenMaterial = new THREE.MeshStandardMaterial({
      map: screenTexture,
      emissive: new THREE.Color('#ffffff'),
      emissiveMap: screenTexture,
      emissiveIntensity: 0.65,
      roughness: 0.35,
      metalness: 0.05,
      side: THREE.DoubleSide,
    })

    const screenMesh = new THREE.Mesh(screenGeom, screenMaterial)
    screenMesh.position.set(0, 7.2, -20)
    screenMeshRef.current = screenMesh
    scene.add(screenMesh)

    // Bezel Frame around Screen
    const frameGeom = new THREE.PlaneGeometry(screenWidth + 0.8, screenHeight + 0.8, 36, 1)
    const framePos = frameGeom.attributes.position
    for (let i = 0; i < framePos.count; i++) {
      const x = framePos.getX(i)
      const curveZ = Math.pow(x / ((screenWidth + 0.8) / 2), 2) * 2.8 - 0.05
      framePos.setZ(i, curveZ)
    }
    frameGeom.computeVertexNormals()
    const frameMesh = new THREE.Mesh(
      frameGeom,
      new THREE.MeshStandardMaterial({ color: '#090a09', roughness: 0.9, metalness: 0.4 })
    )
    frameMesh.position.set(0, 7.2, -20.02)
    scene.add(frameMesh)

    // 7. Auditorium Architecture (Extended Floor, Stadium Steps & Walls beyond radius of 80 units)
    const floorGeom = new THREE.PlaneGeometry(240, 240, 1, 1)
    floorGeom.rotateX(-Math.PI / 2)
    const floorMat = new THREE.MeshStandardMaterial({
      map: createAuditoriumFloorTexture(),
      color: '#0c0f0e',
      roughness: 0.88,
      metalness: 0.1,
      side: THREE.DoubleSide,
    })
    const floorMesh = new THREE.Mesh(floorGeom, floorMat)
    floorMesh.position.set(0, -0.02, 0)
    floorMesh.receiveShadow = true
    scene.add(floorMesh)

    // Gold floor LED runner aisle lines
    const ledRunnerMat = new THREE.MeshBasicMaterial({ color: PALETTE.stepAisleGold })

    const centerAisleLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 48), ledRunnerMat)
    centerAisleLeft.position.set(-0.78, 0.01, 0)
    scene.add(centerAisleLeft)

    const centerAisleRight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 48), ledRunnerMat)
    centerAisleRight.position.set(0.78, 0.01, 0)
    scene.add(centerAisleRight)

    const outerLeftRunner = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 48), ledRunnerMat)
    outerLeftRunner.position.set(-13.2, 0.01, 0)
    scene.add(outerLeftRunner)

    const outerRightRunner = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 48), ledRunnerMat)
    outerRightRunner.position.set(13.2, 0.01, 0)
    scene.add(outerRightRunner)

    const frontAisleRunner = new THREE.Mesh(new THREE.BoxGeometry(26.5, 0.02, 0.08), ledRunnerMat)
    frontAisleRunner.position.set(0, 0.01, -6.8)
    scene.add(frontAisleRunner)

    const rearAisleRunner = new THREE.Mesh(new THREE.BoxGeometry(26.5, 0.02, 0.08), ledRunnerMat)
    rearAisleRunner.position.set(0, 0.01, 21.5)
    scene.add(rearAisleRunner)

    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
    const colsCount = 14
    const zStart = -6.5
    const zStep = 2.2
    const yStep = 0.55

    // Build Stepped Floor Risers
    rows.forEach((rowLetter, rIdx) => {
      const riserY = rIdx * yStep
      const riserZ = zStart + rIdx * zStep
      const riserGeom = new THREE.BoxGeometry(26, yStep, zStep + 0.15)
      const riserMat = new THREE.MeshStandardMaterial({
        color: PALETTE.carpet,
        roughness: 0.92,
        metalness: 0.05,
      })
      const riserMesh = new THREE.Mesh(riserGeom, riserMat)
      riserMesh.position.set(0, riserY + yStep / 2, riserZ)
      riserMesh.receiveShadow = true
      scene.add(riserMesh)

      // Step Tread Edge LED Accent Strip
      const stepLedGeom = new THREE.BoxGeometry(25.8, 0.04, 0.04)
      const stepLedMat = new THREE.MeshBasicMaterial({ color: PALETTE.stepAisleGold })
      const stepLedMesh = new THREE.Mesh(stepLedGeom, stepLedMat)
      stepLedMesh.position.set(0, riserY + yStep + 0.02, riserZ - zStep / 2)
      scene.add(stepLedMesh)
    })

    // Solid Architectural Acoustic Walls
    const wallMat = new THREE.MeshStandardMaterial({
      color: '#080a09',
      roughness: 0.95,
      metalness: 0.05,
    })

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 24, 200), wallMat)
    leftWall.position.set(-14.8, 11, 2)
    leftWall.receiveShadow = true
    scene.add(leftWall)

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 24, 200), wallMat)
    rightWall.position.set(14.8, 11, 2)
    rightWall.receiveShadow = true
    scene.add(rightWall)

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(200, 24, 0.5), wallMat)
    backWall.position.set(0, 11, 28)
    backWall.receiveShadow = true
    scene.add(backWall)

    const projectorWindow = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 1.8, 0.6),
      new THREE.MeshStandardMaterial({
        color: '#e0f2fe',
        emissive: '#e0f2fe',
        emissiveIntensity: 1.5,
        roughness: 0.1,
      })
    )
    projectorWindow.position.set(0, 10, 27.8)
    scene.add(projectorWindow)

    const frontWall = new THREE.Mesh(new THREE.BoxGeometry(200, 24, 0.5), wallMat)
    frontWall.position.set(0, 11, -20.6)
    scene.add(frontWall)

    const ceiling = new THREE.Mesh(new THREE.BoxGeometry(200, 0.5, 200), wallMat)
    ceiling.position.set(0, 22.5, 2)
    scene.add(ceiling)

    // Vertical Acoustic Timber Slat Panels on side walls
    const slatMat = new THREE.MeshStandardMaterial({
      color: '#161413',
      roughness: 0.85,
      metalness: 0.08,
    })
    for (let z = -16; z <= 22; z += 2.4) {
      const leftSlat = new THREE.Mesh(new THREE.BoxGeometry(0.12, 14, 0.9), slatMat)
      leftSlat.position.set(-14.45, 7.5, z)
      scene.add(leftSlat)

      const rightSlat = new THREE.Mesh(new THREE.BoxGeometry(0.12, 14, 0.9), slatMat)
      rightSlat.position.set(14.45, 7.5, z)
      scene.add(rightSlat)
    }

    // Glowing Amber LED Accent Fins
    for (let z = -12; z <= 20; z += 4.8) {
      const ledFinGeom = new THREE.BoxGeometry(0.08, 14, 0.16)
      const ledFinMat = new THREE.MeshBasicMaterial({ color: PALETTE.ledGold })

      const leftFin = new THREE.Mesh(ledFinGeom, ledFinMat)
      leftFin.position.set(-14.36, 7.5, z)
      scene.add(leftFin)

      const rightFin = new THREE.Mesh(ledFinGeom, ledFinMat)
      rightFin.position.set(14.36, 7.5, z)
      scene.add(rightFin)
    }

    // Floating Projector Dust Particles
    const particleCount = 180
    const particleGeom = new THREE.BufferGeometry()
    const particlePositions = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 12
      particlePositions[i + 1] = 4 + Math.random() * 8
      particlePositions[i + 2] = -15 + Math.random() * 32
    }
    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
    const particleMat = new THREE.PointsMaterial({
      color: '#e0f2fe',
      size: 0.08,
      transparent: true,
      opacity: 0.45,
    })
    const dustPoints = new THREE.Points(particleGeom, particleMat)
    scene.add(dustPoints)

    // 8. Realistic Cinema Armchair Geometry (Sculpted Cushions, Contoured Backrest, Armrests & Cup Holders)
    // A: Velvet Upholstery Parts
    // Main Seat Cushion with rounded profile
    const cushionGeom = new THREE.BoxGeometry(0.62, 0.14, 0.54)
    cushionGeom.translate(0, 0.44, 0)

    // Contoured ergonomic backrest tilted back
    const backrestLower = new THREE.BoxGeometry(0.58, 0.36, 0.13)
    backrestLower.rotateX(-0.12)
    backrestLower.translate(0, 0.66, -0.21)

    const backrestUpper = new THREE.BoxGeometry(0.56, 0.38, 0.12)
    backrestUpper.rotateX(-0.12)
    backrestUpper.translate(0, 0.98, -0.25)

    // Sculpted headrest pillow
    const headrestGeom = new THREE.BoxGeometry(0.46, 0.22, 0.14)
    headrestGeom.rotateX(-0.12)
    headrestGeom.translate(0, 1.22, -0.28)

    let velvetMergedGeom
    try {
      velvetMergedGeom = BufferGeometryUtils.mergeGeometries([
        cushionGeom,
        backrestLower,
        backrestUpper,
        headrestGeom,
      ])
    } catch {
      velvetMergedGeom = cushionGeom
    }
    if (!velvetMergedGeom) velvetMergedGeom = cushionGeom

    // B: Dark Frame, Shell & Armrests Parts (Polypropylene Shell & Matte Metal)
    // Under-seat cradle pan
    const underShellGeom = new THREE.BoxGeometry(0.64, 0.05, 0.56)
    underShellGeom.translate(0, 0.36, 0)

    // Rear protective backplate
    const rearBackplate = new THREE.BoxGeometry(0.58, 0.76, 0.04)
    rearBackplate.rotateX(-0.12)
    rearBackplate.translate(0, 0.82, -0.28)

    // Left and right armrests with padded tops
    const leftArmGeom = new THREE.BoxGeometry(0.09, 0.34, 0.52)
    leftArmGeom.translate(-0.34, 0.54, 0)

    const rightArmGeom = new THREE.BoxGeometry(0.09, 0.34, 0.52)
    rightArmGeom.translate(0.34, 0.54, 0)

    // Sturdy center pedestal mounting base
    const pedestalGeom = new THREE.CylinderGeometry(0.045, 0.07, 0.36, 12)
    pedestalGeom.translate(0, 0.18, 0)

    // Integrated cup holders on front of armrests
    const leftCup = new THREE.CylinderGeometry(0.035, 0.035, 0.08, 12)
    leftCup.translate(-0.34, 0.72, 0.22)

    const rightCup = new THREE.CylinderGeometry(0.035, 0.035, 0.08, 12)
    rightCup.translate(0.34, 0.72, 0.22)

    let metalMergedGeom
    try {
      metalMergedGeom = BufferGeometryUtils.mergeGeometries([
        underShellGeom,
        rearBackplate,
        leftArmGeom,
        rightArmGeom,
        pedestalGeom,
        leftCup,
        rightCup,
      ])
    } catch {
      metalMergedGeom = pedestalGeom
    }
    if (!metalMergedGeom) metalMergedGeom = pedestalGeom

    const metalMat = new THREE.MeshStandardMaterial({
      color: '#111413',
      roughness: 0.65,
      metalness: 0.45,
    })

    // Map backend show_seats or create A-J x 1-14 stadium grid
    const seatList = []
    const seatMeshes = []

    rows.forEach((rowLetter, rIdx) => {
      const riserY = rIdx * yStep + yStep
      const riserZ = zStart + rIdx * zStep

      let category = 'REGULAR'
      let defaultPrice = 200
      if (['D', 'E', 'F', 'G'].includes(rowLetter)) {
        category = 'PREMIUM'
        defaultPrice = 350
      } else if (['H', 'I', 'J'].includes(rowLetter)) {
        category = 'RECLINER'
        defaultPrice = 500
      }

      for (let c = 1; c <= colsCount; c++) {
        // Luxury central aisle between seat 7 and 8
        const aisleOffset = c > 7 ? 0.75 : -0.75
        const seatX = (c - (colsCount + 1) / 2) * 0.95 + aisleOffset

        // Gentle curvature: outer seats angle subtly inward toward center screen
        const angleToCenter = -Math.atan2(seatX, -19.5 - riserZ) * 0.42

        const backendSeat = (seats || []).find(
          (s) =>
            (s.seat?.rowLabel === rowLetter && Number(s.seat?.seatNumber) === c) ||
            (s.rowLabel === rowLetter && Number(s.seatNumber) === c)
        )

        const seatData = {
          id: backendSeat ? backendSeat.id : `seat-${rowLetter}-${c}`,
          showSeatId: backendSeat?.id || `seat-${rowLetter}-${c}`,
          seatId: backendSeat?.seatId || backendSeat?.seat?.id || `seat-${rowLetter}-${c}`,
          seat: {
            id: backendSeat?.seatId || backendSeat?.seat?.id || `seat-${rowLetter}-${c}`,
            rowLabel: rowLetter,
            seatNumber: c,
            category: backendSeat?.seat?.category || backendSeat?.seat?.seatType || category,
          },
          price: backendSeat?.price ? Number(backendSeat.price) : defaultPrice,
          status: backendSeat?.status || 'AVAILABLE',
          position: new THREE.Vector3(seatX, riserY, riserZ),
        }

        // Armchair Upholstery Mesh
        const seatMat = new THREE.MeshStandardMaterial({
          color: PALETTE.seatAvailable,
          roughness: 0.64,
          metalness: 0.1,
        })

        const armchairMesh = new THREE.Mesh(velvetMergedGeom, seatMat)
        armchairMesh.castShadow = true
        armchairMesh.receiveShadow = true

        const metalMesh = new THREE.Mesh(metalMergedGeom, metalMat)
        metalMesh.castShadow = true

        const seatGroup = new THREE.Group()
        seatGroup.add(armchairMesh)
        seatGroup.add(metalMesh)

        seatGroup.position.set(seatX, riserY, riserZ)
        seatGroup.rotation.y = angleToCenter

        armchairMesh.userData = seatData
        armchairMesh.userData.group = seatGroup

        scene.add(seatGroup)
        seatMeshes.push(armchairMesh)
        seatList.push(seatData)
      }
    })

    seatMeshesRef.current = seatMeshes

    // 9. Pointer Drag vs Click & Hover Event Handlers
    let isPointerDown = false
    let pointerDownCoord = { x: 0, y: 0 }
    let dragDistance = 0

    const onPointerDown = (event) => {
      isPointerDown = true
      dragDistance = 0
      pointerDownCoord = { x: event.clientX, y: event.clientY }
    }

    const onPointerUp = () => {
      isPointerDown = false
    }

    const onPointerMove = (event) => {
      if (isPointerDown) {
        const dx = event.clientX - pointerDownCoord.x
        const dy = event.clientY - pointerDownCoord.y
        dragDistance = Math.hypot(dx, dy)
      }

      if (!container || !cameraRef.current) return
      const rect = renderer.domElement.getBoundingClientRect()
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      if (!isPointerDown) {
        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current)
        const intersects = raycasterRef.current.intersectObjects(seatMeshesRef.current)

        if (intersects.length > 0) {
          const hit = intersects[0].object
          const seat = hit.userData
          if (hoveredSeatRef.current !== hit) {
            hoveredSeatRef.current = hit
            setHoveredSeat(seat)
          }
          setTooltipPos({ x: event.clientX, y: event.clientY })
          setTooltipVisible(true)
          document.body.style.cursor = seat.status === 'AVAILABLE' ? 'pointer' : 'not-allowed'
        } else {
          if (hoveredSeatRef.current !== null) {
            hoveredSeatRef.current = null
            setHoveredSeat(null)
          }
          setTooltipVisible(false)
          document.body.style.cursor = 'default'
        }
      } else {
        setTooltipVisible(false)
      }
    }

    const onPointerClick = (event) => {
      if (dragDistance > 5) return // Ignore drags/pan

      if (!container || !cameraRef.current) return
      const rect = renderer.domElement.getBoundingClientRect()
      const clickX = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const clickY = -((event.clientY - rect.top) / rect.height) * 2 + 1
      const clickRaycaster = new THREE.Raycaster()
      clickRaycaster.setFromCamera(new THREE.Vector2(clickX, clickY), cameraRef.current)
      const intersects = clickRaycaster.intersectObjects(seatMeshesRef.current)

      if (intersects.length > 0) {
        const hitSeatMesh = intersects[0].object
        const seat = hitSeatMesh.userData

        if (seat.status === 'AVAILABLE') {
          if (onToggleSeat) {
            onToggleSeat(seat)
          }
          flyToSeatPOV(seat)
        }
        return
      }

      // Check click on the cinema screen to fly to widescreen POV
      if (screenMeshRef.current) {
        const screenIntersects = clickRaycaster.intersectObject(screenMeshRef.current)
        if (screenIntersects.length > 0) {
          setCameraPreset('screen')
        }
      }
    }

    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    renderer.domElement.addEventListener('pointerup', onPointerUp)
    renderer.domElement.addEventListener('pointermove', onPointerMove)
    renderer.domElement.addEventListener('click', onPointerClick)

    // 10. Responsive Window & Container Resize
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return
      const width = container.clientWidth || 1200
      const height = container.clientHeight || 750
      if (width <= 0 || height <= 0) return
      cameraRef.current.aspect = width / height
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(width, height)
    }

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(container)
    window.addEventListener('resize', handleResize)
    handleResize()
    const tResize = setTimeout(handleResize, 150)

    // 11. Main 60 FPS Render Loop
    let animId
    const clock = new THREE.Clock()
    const renderLoop = () => {
      animId = requestAnimationFrame(renderLoop)
      const delta = clock.getDelta()

      // Atmospheric dust particle subtle float
      if (dustPoints) {
        dustPoints.rotation.y += delta * 0.02
        dustPoints.rotation.x += delta * 0.01
      }

      controls.update()
      renderer.render(scene, camera)
    }
    renderLoop()

    // Cleanup
    return () => {
      clearTimeout(tResize)
      cancelAnimationFrame(animId)
      resizeObserver.disconnect()
      window.removeEventListener('resize', handleResize)
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      renderer.domElement.removeEventListener('pointerup', onPointerUp)
      renderer.domElement.removeEventListener('pointermove', onPointerMove)
      renderer.domElement.removeEventListener('click', onPointerClick)
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement)
      }
      renderer.dispose()
      document.body.style.cursor = 'default'
    }
  }, [show?.movie?.title])

  // Synchronize backend seats with 3D seat meshes
  useEffect(() => {
    if (!seatMeshesRef.current.length || !seats || !seats.length) return

    seatMeshesRef.current.forEach((mesh) => {
      const currentSeat = mesh.userData
      const rowLetter = currentSeat?.seat?.rowLabel
      const seatNum = currentSeat?.seat?.seatNumber

      const backendSeat = seats.find(
        (s) =>
          (s.seat?.rowLabel === rowLetter && Number(s.seat?.seatNumber) === Number(seatNum)) ||
          (s.rowLabel === rowLetter && Number(s.seatNumber) === Number(seatNum))
      )

      if (backendSeat) {
        mesh.userData.id = backendSeat.id
        mesh.userData.showSeatId = backendSeat.id
        mesh.userData.seatId = backendSeat.seatId || backendSeat.seat?.id
        mesh.userData.status = backendSeat.status
        mesh.userData.price = Number(backendSeat.price || mesh.userData.price)
        if (backendSeat.seat) {
          mesh.userData.seat.id = backendSeat.seatId || backendSeat.seat?.id
          mesh.userData.seat.category =
            backendSeat.seat?.category || backendSeat.seat?.seatType || mesh.userData.seat.category
        }
      }
    })
  }, [seats])

  // Synchronize dynamic seat colors with selection/hover state
  useEffect(() => {
    if (!seatMeshesRef.current.length) return

    seatMeshesRef.current.forEach((mesh) => {
      const seat = mesh.userData
      const isSelected = (selectedSeats || []).some((s) => s.id === seat.id)
      const isHovered = hoveredSeat?.id === seat.id

      if (isSelected) {
        mesh.material.color.copy(PALETTE.seatSelected)
        mesh.material.emissive.set('#f59e0b')
        mesh.material.emissiveIntensity = 0.55
      } else if (isHovered && seat.status === 'AVAILABLE') {
        mesh.material.color.copy(PALETTE.seatHovered)
        mesh.material.emissive.set('#ff2255')
        mesh.material.emissiveIntensity = 0.4
      } else if (seat.status === 'HELD') {
        mesh.material.color.copy(PALETTE.seatHeld)
        mesh.material.emissive.set('#ea580c')
        mesh.material.emissiveIntensity = 0.15
      } else if (seat.status === 'BOOKED') {
        mesh.material.color.copy(PALETTE.seatBooked)
        mesh.material.emissive.set('#000000')
        mesh.material.emissiveIntensity = 0
      } else {
        mesh.material.color.copy(PALETTE.seatAvailable)
        mesh.material.emissive.set('#000000')
        mesh.material.emissiveIntensity = 0
      }
    })
  }, [selectedSeats, hoveredSeat])

  // Dynamic screen & 360 panorama texture update when active movie changes
  useEffect(() => {
    const currentMovie = movie || show?.movie
    const newPano = create360CinemaPanoramaTexture(currentMovie)
    if (sceneRef.current) {
      sceneRef.current.background = newPano
    }
    if (panoMeshRef.current) {
      panoMeshRef.current.material.map = newPano
      panoMeshRef.current.material.needsUpdate = true
    }
    if (screenMeshRef.current) {
      const newTexture = createCinematicScreenTexture(currentMovie)
      screenMeshRef.current.material.map = newTexture
      screenMeshRef.current.material.emissiveMap = newTexture
      screenMeshRef.current.material.needsUpdate = true
    }
  }, [movie, show?.movie])

  // Fullscreen sync listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  const toggleFullscreen = () => {
    const wrapper = containerRef.current?.closest('.lumiere-3d-wrapper') || containerRef.current
    if (!document.fullscreenElement) {
      if (wrapper?.requestFullscreen) {
        wrapper.requestFullscreen().catch(() => {})
      }
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {})
      }
      setIsFullscreen(false)
    }
  }

  // Smooth Camera Transition to Angle Preset
  const setCameraPreset = (presetKey) => {
    if (!cameraRef.current || !controlsRef.current || isCameraAnimating) return
    const preset = cameraPresets[presetKey]
    if (!preset) return

    setActivePreset(presetKey)
    setIsCameraAnimating(true)
    setPovSeat(null)

    const camera = cameraRef.current
    const controls = controlsRef.current

    gsap.killTweensOf(camera.position)
    gsap.killTweensOf(controls.target)
    gsap.killTweensOf(camera)

    const targetFov = preset.fov || 46
    if (camera.fov !== targetFov) {
      gsap.to(camera, {
        fov: targetFov,
        duration: 1.2,
        ease: 'power3.out',
        onUpdate: () => camera.updateProjectionMatrix(),
      })
    }

    gsap.to(camera.position, {
      x: preset.pos.x,
      y: preset.pos.y,
      z: preset.pos.z,
      duration: 1.2,
      ease: 'power3.out',
      onComplete: () => setIsCameraAnimating(false),
    })

    gsap.to(controls.target, {
      x: preset.target.x,
      y: preset.target.y,
      z: preset.target.z,
      duration: 1.2,
      ease: 'power3.out',
      onUpdate: () => controls.update(),
    })
  }

  // Fly to POV if requested externally
  useEffect(() => {
    if (!activePovSeat) return
    const match = seatMeshesRef.current.find(
      (m) =>
        m.userData?.id === activePovSeat.id ||
        (m.userData?.seat?.rowLabel === activePovSeat.seat?.rowLabel &&
          m.userData?.seat?.seatNumber === activePovSeat.seat?.seatNumber)
    )?.userData
    if (match) {
      flyToSeatPOV(match)
    }
  }, [activePovSeat])

  // GSAP: "Your Seat, Your View" Dynamic Camera Flight to Seat Headrest coordinate
  const flyToSeatPOV = (seat) => {
    if (!cameraRef.current || !controlsRef.current) return
    setIsCameraAnimating(true)
    setPovSeat(seat)
    setActivePreset(null)

    const camera = cameraRef.current
    const controls = controlsRef.current

    gsap.killTweensOf(camera)
    if (camera.fov !== 46) {
      gsap.to(camera, {
        fov: 46,
        duration: 1.2,
        ease: 'power3.out',
        onUpdate: () => camera.updateProjectionMatrix(),
      })
    }

    const targetPos = new THREE.Vector3(
      seat.position.x,
      seat.position.y + 1.28,
      seat.position.z - 0.05
    )
    const screenCenter = new THREE.Vector3(0, 7.2, -20)

    gsap.killTweensOf(camera.position)
    gsap.killTweensOf(controls.target)

    gsap.to(camera.position, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration: 1.4,
      ease: 'power3.inOut',
      onComplete: () => setIsCameraAnimating(false),
    })

    gsap.to(controls.target, {
      x: screenCenter.x,
      y: screenCenter.y,
      z: screenCenter.z,
      duration: 1.4,
      ease: 'power3.inOut',
      onUpdate: () => controls.update(),
    })
  }

  // GSAP: Reset Camera to Center 360 Overview
  const resetCameraOverview = () => {
    setCameraPreset('overview')
  }

  return (
    <div className={`lumiere-3d-wrapper ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* 3D WebGL Canvas Viewport */}
      <div className="lumiere-viewport" ref={containerRef} />

      {/* Top Floating Glassmorphism HUD Bar */}
      {!hideHeader && (
        <div className="lumiere-top-hud">
          <div className="hud-brand-pill">
            <Sparkles className="hud-icon-gold" size={16} />
            <div>
              <span className="hud-title">LUMIÈRE 2026 AUDITORIUM</span>
              <small className="hud-sub">DOLBY ATMOS · 4K LASER 360° VIRTUAL TOUR</small>
            </div>
          </div>

          {/* View Mode Indicator & Camera Angle Presets */}
          <div className="hud-controls-group">
            <div className="hud-preset-pills">
              <button
                type="button"
                className={`hud-preset-btn ${activePreset === 'overview' ? 'active' : ''}`}
                onClick={() => setCameraPreset('overview')}
                title="Auditorium Overview"
              >
                Overview
              </button>
              <button
                type="button"
                className={`hud-preset-btn ${activePreset === 'screen' ? 'active' : ''}`}
                onClick={() => setCameraPreset('screen')}
                title="Screen Front POV"
              >
                Screen
              </button>
              <button
                type="button"
                className={`hud-preset-btn ${activePreset === 'center' ? 'active' : ''}`}
                onClick={() => setCameraPreset('center')}
                title="Center Hall Seats"
              >
                Center
              </button>
              <button
                type="button"
                className={`hud-preset-btn ${activePreset === 'rear' ? 'active' : ''}`}
                onClick={() => setCameraPreset('rear')}
                title="Rear Seating Gallery"
              >
                Rear
              </button>
              <button
                type="button"
                className={`hud-preset-btn ${activePreset === 'balcony' ? 'active' : ''}`}
                onClick={() => setCameraPreset('balcony')}
                title="Balcony High Perspective"
              >
                Balcony
              </button>
            </div>

            <div className="hud-drag-360-badge">
              <Compass size={14} className="hud-icon-anim" />
              <span>360° Orbit</span>
            </div>

            {povSeat ? (
              <div className="hud-pov-badge">
                <Eye size={14} className="hud-icon-anim" />
                <span>POV: ROW {povSeat.seat?.rowLabel} · SEAT {povSeat.seat?.seatNumber}</span>
              </div>
            ) : null}

            <button
              type="button"
              className="hud-action-btn"
              onClick={resetCameraOverview}
              disabled={isCameraAnimating}
              title="Reset to center 360 view"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>

            {onSwitchTo2D && (
              <button
                type="button"
                className="hud-action-btn"
                onClick={onSwitchTo2D}
                title="Open 2D Seating Plan"
              >
                <Layers size={14} />
                <span>2D Matrix</span>
              </button>
            )}

            <button
              type="button"
              className="hud-icon-btn"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit full screen' : 'Expand full screen'}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </div>
      )}

      {/* Floating Raycaster Seat Tooltip Card */}
      {tooltipVisible && hoveredSeat && (
        <div
          className="lumiere-seat-tooltip"
          style={{
            left: `${tooltipPos.x + 14}px`,
            top: `${tooltipPos.y - 12}px`,
          }}
        >
          <div className="tooltip-head">
            <span className="tooltip-seat-num">
              ROW {hoveredSeat.seat?.rowLabel} · SEAT {hoveredSeat.seat?.seatNumber}
            </span>
            <span className={`tooltip-status-pill status-${hoveredSeat.status.toLowerCase()}`}>
              {hoveredSeat.status}
            </span>
          </div>
          <div className="tooltip-body">
            <span className="tooltip-category">{hoveredSeat.seat?.category || 'REGULAR'}</span>
            <strong className="tooltip-price">₹{hoveredSeat.price}</strong>
          </div>
          <div className="tooltip-hint">
            {hoveredSeat.status === 'AVAILABLE' ? (
              <span>✨ Click to select & fly to exact viewing POV</span>
            ) : (
              <span>🔒 Seat reserved by another moviegoer</span>
            )}
          </div>
        </div>
      )}

      {/* Bottom Interactive Legend Bar */}
      <div className="lumiere-bottom-legend">
        <div className="legend-pills-row">
          <span className="legend-item">
            <i className="lumiere-dot dot-available" /> Available (Wine Red)
          </span>
          <span className="legend-item">
            <i className="lumiere-dot dot-selected" /> Selected (Radiant Gold)
          </span>
          <span className="legend-item">
            <i className="lumiere-dot dot-held" /> Held (Dim Orange)
          </span>
          <span className="legend-item">
            <i className="lumiere-dot dot-booked" /> Booked (Charcoal)
          </span>
        </div>
        <div className="legend-tier-info">
          <span>Rows A–C: Regular (₹200)</span>
          <span>·</span>
          <span>Rows D–G: Premium (₹350)</span>
          <span>·</span>
          <span>Rows H–J: Recliner VIP (₹500)</span>
        </div>
      </div>

      {/* Selected Seats Floating Dock */}
      {!hideDock && (selectedSeats || []).length > 0 && (
        <div className="lumiere-selection-dock">
          <div className="dock-left">
            <span className="dock-eyebrow">YOUR RESERVATION ({(selectedSeats || []).length}/10 SEATS)</span>
            <div className="dock-seat-tags">
              {(selectedSeats || []).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="dock-seat-pill"
                  onClick={() => flyToSeatPOV(s)}
                  title="Click to view exact screen sightline from this seat"
                >
                  <Eye size={12} className="tag-eye" />
                  <strong>
                    {s.seat?.rowLabel}{s.seat?.seatNumber}
                  </strong>
                  <small>₹{s.price}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="dock-right">
            <div className="dock-total-box">
              <span>TOTAL PAYABLE</span>
              <strong>₹{totalAmount}</strong>
            </div>
            {onProceed && (
              <button
                type="button"
                className="dock-proceed-btn"
                onClick={onProceed}
              >
                <span>Continue</span>
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
