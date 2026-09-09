import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  type WaxPhase,
  type WaxToolId,
  WAX_TOOLS_DATA,
  type CraftMetrics,
} from "./types";
import { waxAudio } from "./WaxAudio";
import { generateDyedBatikCanvas } from "./WaxTextureGenerator";

interface WaxWorkbench3DProps {
  phase: WaxPhase;
  metrics: CraftMetrics;
  onToolClick?: (toolId: WaxToolId) => void;
  onPickKnife?: () => void;
  onHeatKnife?: () => void;
  onDipWax?: () => void;
  onScrapeWax?: () => void;
  onStartDrawing?: () => void;
  onSubmergeInVat?: () => void;
  onHangOnRack?: () => void;
  onRepeatDye?: () => void;
  onFinishMasterpiece?: () => void;
  onRestart?: () => void;
  drawingCanvas?: HTMLCanvasElement | null;
  children?: React.ReactNode;
}

export function WaxWorkbench3D({
  phase,
  metrics,
  onToolClick,
  onPickKnife,
  onHeatKnife,
  onDipWax,
  onScrapeWax,
  onStartDrawing,
  onSubmergeInVat,
  onHangOnRack,
  onRepeatDye,
  onFinishMasterpiece,
  onRestart,
  drawingCanvas,
  children,
}: WaxWorkbench3DProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selectedTool, setSelectedTool] = useState<WaxToolId | null>(null);
  const [viewPreset, setViewPreset] = useState<string>("overview");
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // References for Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // 3D Object anchors
  const modelsRef = useRef<Record<string, THREE.Object3D>>({});
  const heaterLightRef = useRef<THREE.PointLight | null>(null);
  const finishSpotlightRef = useRef<THREE.SpotLight | null>(null);
  const bubblesParticlesRef = useRef<THREE.Points | null>(null);
  const clothMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const finishedBannerMeshRef = useRef<THREE.Mesh | null>(null);
  const finishedBannerMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const rackClothMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const clothTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const finishedTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const vatLiquidRef = useRef<THREE.Mesh | null>(null);

  // Coordinates
  const knifeRestPos = useRef(new THREE.Vector3(0.32, 0.205, 0.12));
  const knifeStovePos = useRef(new THREE.Vector3(-0.28, 0.36, 0.05));
  const knifeClothPos = useRef(new THREE.Vector3(0.08, 0.32, 0.03));

  // Dynamic Camera animation target & state
  const targetCamPos = useRef(new THREE.Vector3(0, 1.25, 2.3));
  const targetCamLook = useRef(new THREE.Vector3(0, 0.14, 0));
  const isTransitioningCamera = useRef<boolean>(true);

  // Dipping animation progress
  const dippingProgress = useRef<number>(-1);

  // Update dynamic texture on 3D cloth when drawing canvas updates or when entering dyed phases
  useEffect(() => {
    if (!drawingCanvas) return;

    if (phase === "draw" || phase === "intro" || phase === "warm") {
      // 1. Raw cotton with molten amber wax on table
      if (clothMaterialRef.current) {
        if (!clothTextureRef.current) {
          clothTextureRef.current = new THREE.CanvasTexture(drawingCanvas);
          clothTextureRef.current.colorSpace = THREE.SRGBColorSpace;
        } else {
          clothTextureRef.current.image = drawingCanvas;
          clothTextureRef.current.needsUpdate = true;
        }
        clothMaterialRef.current.map = clothTextureRef.current;
        clothMaterialRef.current.color.setHex(0xffffff);
        clothMaterialRef.current.needsUpdate = true;
      }
    } else {
      // 2. Dyed / Oxidized / Finished Masterpiece: render user's custom artwork dyed in deep indigo with ice cracks!
      const dyedCanvas = generateDyedBatikCanvas(
        drawingCanvas,
        metrics.dyePasses || 1,
        phase === "oxidize" ? metrics.oxidationRatio : 100
      );

      if (!finishedTextureRef.current) {
        finishedTextureRef.current = new THREE.CanvasTexture(dyedCanvas);
        finishedTextureRef.current.colorSpace = THREE.SRGBColorSpace;
      } else {
        finishedTextureRef.current.image = dyedCanvas;
        finishedTextureRef.current.needsUpdate = true;
      }

      if (finishedBannerMaterialRef.current) {
        finishedBannerMaterialRef.current.map = finishedTextureRef.current;
        finishedBannerMaterialRef.current.color.setHex(0xffffff);
        finishedBannerMaterialRef.current.needsUpdate = true;
      }

      if (rackClothMaterialRef.current) {
        rackClothMaterialRef.current.map = finishedTextureRef.current;
        rackClothMaterialRef.current.color.setHex(0xffffff);
        rackClothMaterialRef.current.needsUpdate = true;
      }

      if (clothMaterialRef.current) {
        clothMaterialRef.current.map = finishedTextureRef.current;
        clothMaterialRef.current.color.setHex(0xffffff);
        clothMaterialRef.current.needsUpdate = true;
      }
    }
  }, [drawingCanvas, phase, metrics.dyePasses, metrics.oxidationRatio]);

  // Main Scene Initialization
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene & Atmosphere
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a1c22);
    scene.fog = new THREE.FogExp2(0x0a1c22, 0.11);

    // 2. Camera with Wide Zoom Range (0.35m to 8.5m)
    const aspect = container.clientWidth / container.clientHeight;
    const camera = new THREE.PerspectiveCamera(44, aspect, 0.05, 40);
    camera.position.set(0, 1.25, 2.3);
    cameraRef.current = camera;

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      alpha: false,
    });
    rendererRef.current = renderer;
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 4. Orbit Controls (Wide Zoom)
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 0.35; // Close-up
    controls.maxDistance = 8.5; // Wide room overview
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controls.target.set(0, 0.16, 0);

    // Stop auto-camera lerping immediately when user starts rotating, panning, or zooming
    const handleControlsStart = () => {
      isTransitioningCamera.current = false;
      setViewPreset("");
    };
    controls.addEventListener("start", handleControlsStart);

    // 5. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xdde8ea, 0.95);
    scene.add(ambientLight);

    // Warm Sun Key Light
    const sunLight = new THREE.DirectionalLight(0xffeed8, 2.4);
    sunLight.position.set(2.8, 4.2, 2.2);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 10;
    sunLight.shadow.bias = -0.0004;
    scene.add(sunLight);

    // Cool Indigo Fill Light
    const indigoFill = new THREE.DirectionalLight(0x4078a8, 1.2);
    indigoFill.position.set(3, 2, -1);
    scene.add(indigoFill);

    // Stove Ember Light
    const stoveLight = new THREE.PointLight(0xff7722, 2.6, 1.8, 1.6);
    stoveLight.position.set(-0.28, 0.42, 0.05);
    stoveLight.castShadow = true;
    stoveLight.shadow.bias = -0.002;
    scene.add(stoveLight);
    heaterLightRef.current = stoveLight;

    // Dedicated Finished Masterpiece Spotlight
    const finishSpotlight = new THREE.SpotLight(0xfffaec, 0, 8, Math.PI / 3, 0.45);
    finishSpotlight.position.set(0, 2.4, 1.4);
    finishSpotlight.target.position.set(0, 0.42, 0);
    finishSpotlight.castShadow = true;
    scene.add(finishSpotlight);
    scene.add(finishSpotlight.target);
    finishSpotlightRef.current = finishSpotlight;

    // 6. Compact Craft Workbench & Workshop Floor
    const createWorkbenchEnvironment = () => {
      const group = new THREE.Group();

      // Procedural Wood Grain
      const woodCanvas = document.createElement("canvas");
      woodCanvas.width = 512;
      woodCanvas.height = 512;
      const wCtx = woodCanvas.getContext("2d")!;
      wCtx.fillStyle = "#422b1c";
      wCtx.fillRect(0, 0, 512, 512);
      wCtx.fillStyle = "#2d1c11";
      for (let i = 0; i < 45; i++) {
        wCtx.fillRect(0, i * 11 + Math.random() * 4, 512, 2 + Math.random() * 3);
      }
      wCtx.fillStyle = "rgba(220, 160, 90, 0.08)";
      for (let i = 0; i < 350; i++) {
        wCtx.fillRect(
          Math.random() * 512,
          Math.random() * 512,
          Math.random() * 70 + 20,
          1
        );
      }
      const woodTexture = new THREE.CanvasTexture(woodCanvas);
      woodTexture.wrapS = THREE.RepeatWrapping;
      woodTexture.wrapT = THREE.RepeatWrapping;
      woodTexture.repeat.set(1.2, 1.2);

      const tableMat = new THREE.MeshStandardMaterial({
        color: 0x4d3625,
        map: woodTexture,
        roughness: 0.68,
        metalness: 0.08,
      });

      // Compact Table Top (0.95m length x 0.62m depth x 0.06m height)
      const topGeo = new THREE.BoxGeometry(0.95, 0.06, 0.62);
      const topMesh = new THREE.Mesh(topGeo, tableMat);
      topMesh.position.set(0, 0.16, 0);
      topMesh.receiveShadow = true;
      topMesh.castShadow = true;
      group.add(topMesh);

      // Table Legs
      const legGeo = new THREE.CylinderGeometry(0.032, 0.038, 0.58, 12);
      const legPositions = [
        [-0.42, -0.13, 0.25],
        [0.42, -0.13, 0.25],
        [-0.42, -0.13, -0.25],
        [0.42, -0.13, -0.25],
      ];
      legPositions.forEach(([x, y, z]) => {
        const leg = new THREE.Mesh(legGeo, tableMat);
        leg.position.set(x, y, z);
        leg.castShadow = true;
        leg.receiveShadow = true;
        group.add(leg);
      });

      // Stretchers
      const stretcherGeo = new THREE.BoxGeometry(0.86, 0.02, 0.02);
      const stretcherFront = new THREE.Mesh(stretcherGeo, tableMat);
      stretcherFront.position.set(0, -0.22, 0.25);
      group.add(stretcherFront);
      const stretcherBack = stretcherFront.clone();
      stretcherBack.position.set(0, -0.22, -0.25);
      group.add(stretcherBack);

      // Workshop Flagstone Floor
      const floorGeo = new THREE.PlaneGeometry(14, 14);
      const floorMat = new THREE.MeshStandardMaterial({
        color: 0x0f1c1f,
        roughness: 0.92,
      });
      const floor = new THREE.Mesh(floorGeo, floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -0.42;
      floor.receiveShadow = true;
      group.add(floor);

      // Workshop Wall Backdrop
      const wallGeo = new THREE.PlaneGeometry(9, 5);
      const wallMat = new THREE.MeshStandardMaterial({
        color: 0x14282e,
        roughness: 0.86,
      });
      const wall = new THREE.Mesh(wallGeo, wallMat);
      wall.position.set(0, 1.4, -2.4);
      wall.receiveShadow = true;
      group.add(wall);

      // Clean Bamboo Knife Rest on table right
      const restGeo = new THREE.BoxGeometry(0.06, 0.018, 0.022);
      const rest = new THREE.Mesh(restGeo, tableMat);
      rest.position.set(0.32, 0.198, 0.12);
      rest.castShadow = true;
      group.add(rest);

      // 7. Dedicated 3D Finished Masterpiece Banner Display Stand (Requirement 1 & 6)
      // Displays the user's custom hand-drawn batik artwork prominently in 3D center stage
      const bannerGroup = new THREE.Group();
      bannerGroup.name = "finished_showcase_group";
      bannerGroup.position.set(0, 0.42, 0);

      // Wooden Top & Bottom Scroll Rods
      const rodGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.72, 16);
      const rodMat = new THREE.MeshStandardMaterial({
        color: 0x2b1c12,
        roughness: 0.4,
        metalness: 0.2,
      });
      const topRod = new THREE.Mesh(rodGeo, rodMat);
      topRod.rotation.z = Math.PI / 2;
      topRod.position.set(0, 0.32, 0);
      bannerGroup.add(topRod);

      const bottomRod = new THREE.Mesh(rodGeo, rodMat);
      bottomRod.rotation.z = Math.PI / 2;
      bottomRod.position.set(0, -0.32, 0);
      bannerGroup.add(bottomRod);

      // Finished Batik Fabric Plane (Rendered with user's personal artwork)
      const bannerFabricGeo = new THREE.PlaneGeometry(0.64, 0.64, 8, 8);
      const bannerFabricMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.65,
        metalness: 0.05,
        side: THREE.DoubleSide,
      });
      const bannerFabric = new THREE.Mesh(bannerFabricGeo, bannerFabricMat);
      bannerFabric.castShadow = true;
      bannerFabric.receiveShadow = true;
      bannerGroup.add(bannerFabric);
      finishedBannerMeshRef.current = bannerFabric;
      finishedBannerMaterialRef.current = bannerFabricMat;

      // Hanging Rope
      const ropeGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.45);
      const ropeMat = new THREE.MeshStandardMaterial({ color: 0xc4a362 });
      const leftRope = new THREE.Mesh(ropeGeo, ropeMat);
      leftRope.position.set(-0.16, 0.44, 0);
      leftRope.rotation.z = 0.55;
      bannerGroup.add(leftRope);
      const rightRope = new THREE.Mesh(ropeGeo, ropeMat);
      rightRope.position.set(0.16, 0.44, 0);
      rightRope.rotation.z = -0.55;
      bannerGroup.add(rightRope);

      bannerGroup.visible = false; // Hidden until finish phase
      scene.add(bannerGroup);
      modelsRef.current["finished_showcase"] = bannerGroup;

      scene.add(group);
    };
    createWorkbenchEnvironment();

    // 8. Molten Wax Rising Bubbles
    const bubbleCount = 20;
    const bubbleGeo = new THREE.BufferGeometry();
    const bubblePos = new Float32Array(bubbleCount * 3);
    const bubbleVel = new Float32Array(bubbleCount);
    for (let i = 0; i < bubbleCount; i++) {
      bubblePos[i * 3 + 0] = -0.28 + (Math.random() - 0.5) * 0.1;
      bubblePos[i * 3 + 1] = 0.38 + Math.random() * 0.12;
      bubblePos[i * 3 + 2] = 0.05 + (Math.random() - 0.5) * 0.1;
      bubbleVel[i] = 0.003 + Math.random() * 0.005;
    }
    bubbleGeo.setAttribute("position", new THREE.BufferAttribute(bubblePos, 3));
    const bubbleMat = new THREE.PointsMaterial({
      color: 0xffcc44,
      size: 0.018,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const bubbleParticles = new THREE.Points(bubbleGeo, bubbleMat);
    scene.add(bubbleParticles);
    bubblesParticlesRef.current = bubbleParticles;

    // 9. Load Lux3D GLB Models with Accurate Physical Layout
    const gltfLoader = new GLTFLoader();
    const modelEntries = [
      {
        id: "heater",
        url: "/蜡染/game-assets/3d/02-wax-heater.glb",
        pos: new THREE.Vector3(-0.28, 0.19, 0.04),
        scale: 0.44,
        rotY: Math.PI / 4,
      },
      {
        id: "knife",
        url: "/蜡染/game-assets/3d/01-wax-knife.glb",
        pos: knifeRestPos.current.clone(),
        scale: 0.35,
        rotY: -Math.PI / 3,
        rotZ: 0.05,
      },
      {
        id: "cloth",
        url: "/蜡染/game-assets/3d/03-guided-cloth.glb",
        pos: new THREE.Vector3(0.08, 0.195, 0.01),
        scale: 0.42,
        rotY: 0,
      },
      {
        id: "vat",
        url: "/蜡染/game-assets/3d/05-indigo-vat.glb",
        // 靛蓝缸 standing beside table on the right, scaled and elevated higher than table (rim reaching y=0.35)!
        pos: new THREE.Vector3(0.68, -0.38, 0.08),
        scale: 0.95,
        rotY: -Math.PI / 5,
      },
      {
        id: "drying_rack",
        url: "/蜡染/game-assets/3d/06-oxidizing-textile.glb",
        // 晾布竹架 standing beside table on the left, tall and prominent!
        pos: new THREE.Vector3(-0.74, -0.42, -0.05),
        scale: 0.85,
        rotY: Math.PI / 6,
      },
      {
        id: "finished",
        url: "/蜡染/game-assets/3d/07-finished-textile.glb",
        pos: new THREE.Vector3(0, 0.42, 0),
        scale: 0.65,
        rotY: 0,
      },
    ];

    let loadedCount = 0;
    modelEntries.forEach((entry) => {
      gltfLoader.load(
        entry.url,
        (gltf) => {
          const obj = gltf.scene;
          obj.name = entry.id;
          obj.position.copy(entry.pos);
          obj.scale.setScalar(entry.scale);
          obj.rotation.y = entry.rotY;
          if (entry.rotZ) obj.rotation.z = entry.rotZ;

          obj.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              mesh.userData = { toolId: entry.id };

              if (entry.id === "cloth") {
                if (
                  mesh.material &&
                  (mesh.material as THREE.MeshStandardMaterial).isMeshStandardMaterial
                ) {
                  clothMaterialRef.current = mesh.material as THREE.MeshStandardMaterial;
                }
              }
              if (entry.id === "drying_rack") {
                if (
                  mesh.material &&
                  (mesh.material as THREE.MeshStandardMaterial).isMeshStandardMaterial
                ) {
                  rackClothMaterialRef.current = mesh.material as THREE.MeshStandardMaterial;
                }
              }
            }
          });

          // Finished GLB hidden by default (we showcase the custom user textile banner)
          if (entry.id === "finished") {
            obj.visible = false;
          }

          scene.add(obj);
          modelsRef.current[entry.id] = obj;

          loadedCount++;
          const prog = Math.round((loadedCount / modelEntries.length) * 100);
          setLoadingProgress(prog);
          if (loadedCount === modelEntries.length) {
            setIsLoaded(true);
          }
        },
        undefined,
        (err) => {
          console.warn(`Could not load GLB ${entry.url}, using procedural fallback:`, err);
          loadedCount++;
          setLoadingProgress(Math.round((loadedCount / modelEntries.length) * 100));
          if (loadedCount === modelEntries.length) {
            setIsLoaded(true);
          }
        }
      );
    });

    // 10. Indigo Liquid Plane inside the Vat (Higher position matching tall vat)
    const vatLiquidGeo = new THREE.CircleGeometry(0.24, 24);
    const vatLiquidMat = new THREE.MeshStandardMaterial({
      color: 0x08182b,
      roughness: 0.12,
      metalness: 0.35,
    });
    const vatLiquid = new THREE.Mesh(vatLiquidGeo, vatLiquidMat);
    vatLiquid.rotation.x = -Math.PI / 2;
    vatLiquid.position.set(0.68, 0.28, 0.08);
    scene.add(vatLiquid);
    vatLiquidRef.current = vatLiquid;

    // 11. Animation & Render Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth camera transition only when explicitly triggered by phase change or preset button
      if (isTransitioningCamera.current) {
        camera.position.lerp(targetCamPos.current, 0.055);
        controls.target.lerp(targetCamLook.current, 0.055);
        if (
          camera.position.distanceTo(targetCamPos.current) < 0.008 &&
          controls.target.distanceTo(targetCamLook.current) < 0.008
        ) {
          camera.position.copy(targetCamPos.current);
          controls.target.copy(targetCamLook.current);
          isTransitioningCamera.current = false;
        }
      }

      controls.update();

      // Stove charcoal flicker
      if (heaterLightRef.current) {
        heaterLightRef.current.intensity =
          2.4 + Math.sin(elapsedTime * 8) * 0.4 + Math.cos(elapsedTime * 13) * 0.2;
      }

      // Molten wax bubbles rise
      if (bubblesParticlesRef.current) {
        const positions = bubblesParticlesRef.current.geometry.attributes.position
          .array as Float32Array;
        for (let i = 0; i < bubbleCount; i++) {
          positions[i * 3 + 1] += bubbleVel[i];
          if (positions[i * 3 + 1] > 0.5) {
            positions[i * 3 + 1] = 0.38;
            positions[i * 3 + 0] = -0.28 + (Math.random() - 0.5) * 0.1;
            positions[i * 3 + 2] = 0.05 + (Math.random() - 0.5) * 0.1;
          }
        }
        bubblesParticlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      // Knife Dipping Animation in Molten Wax (Requirement 5)
      const knife = modelsRef.current["knife"];
      if (knife && dippingProgress.current >= 0) {
        dippingProgress.current += 0.035;
        const p = dippingProgress.current;

        if (p < 0.35) {
          // Phase 1: Dip down into molten wax bowl
          const t = p / 0.35;
          knife.position.set(
            -0.28,
            0.36 - Math.sin(t * Math.PI * 0.5) * 0.14,
            0.05 + Math.sin(t * Math.PI * 0.5) * 0.04
          );
          knife.rotation.set(0.2 + t * 0.45, -0.3, 0.55 + t * 0.2);
        } else if (p < 0.65) {
          // Phase 2: Stir / Swish in wax with gentle ripple
          knife.position.y = 0.22 + Math.sin(elapsedTime * 14) * 0.008;
          knife.rotation.z = 0.75 + Math.cos(elapsedTime * 14) * 0.05;
        } else if (p < 1.0) {
          // Phase 3: Lift up smoothly back to warm hovering position
          const t = (p - 0.65) / 0.35;
          knife.position.set(
            -0.28,
            0.22 + Math.sin(t * Math.PI * 0.5) * 0.14,
            0.09 - Math.sin(t * Math.PI * 0.5) * 0.04
          );
          knife.rotation.set(0.65 - t * 0.45, -0.3, 0.75 - t * 0.2);
        } else {
          // Animation finished
          dippingProgress.current = -1;
          knife.position.copy(knifeStovePos.current);
          knife.rotation.set(0.2, -0.3, 0.55);
        }
      }

      // 360° Finished Masterpiece Showcase gentle floating and rotation
      const bannerShowcase = modelsRef.current["finished_showcase"];
      if (bannerShowcase && bannerShowcase.visible) {
        bannerShowcase.position.y = 0.42 + Math.sin(elapsedTime * 1.5) * 0.02;
        bannerShowcase.rotation.y = Math.sin(elapsedTime * 0.6) * 0.15; // Gentle 3D sway
      }

      renderer.render(scene, camera);
    };
    animate();

    // 12. Resize Handler
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      controls.removeEventListener("start", handleControlsStart);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Raycaster for 3D Tool Click / Inspection & Step 1 Pick
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    const camera = cameraRef.current;
    const scene = sceneRef.current;
    if (!container || !camera || !scene) return;

    const rect = container.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(scene.children, true);
    for (const hit of intersects) {
      let curr: THREE.Object3D | null = hit.object;
      while (curr && curr !== scene) {
        const tid = curr.name as WaxToolId;
        if (tid === "knife" && phase === "intro") {
          triggerPickKnife();
          return;
        }
        if (WAX_TOOLS_DATA[tid]) {
          setSelectedTool(tid);
          onToolClick?.(tid);
          waxAudio.playBellChime(1.2);
          return;
        }
        curr = curr.parent;
      }
    }
  };

  // Step 1 Interactive Pick Knife animation
  const triggerPickKnife = useCallback(() => {
    const knife = modelsRef.current["knife"];
    if (knife) {
      knife.position.copy(knifeStovePos.current);
      knife.rotation.set(0.2, -0.3, 0.55);
    }
    onPickKnife?.();
    waxAudio.playHeatSizzle();
  }, [onPickKnife]);

  // Trigger Knife Dipping in Molten Wax Animation (Requirement 5)
  const triggerDipKnifeAnimation = useCallback(() => {
    dippingProgress.current = 0;
    onDipWax?.();
    waxAudio.playWaxDip();
  }, [onDipWax]);

  // Phase Choreography & Camera Focus
  useEffect(() => {
    const knife = modelsRef.current["knife"];
    const cloth = modelsRef.current["cloth"];
    const bannerShowcase = modelsRef.current["finished_showcase"];
    const finishSpotlight = finishSpotlightRef.current;

    isTransitioningCamera.current = true;

    switch (phase) {
      case "intro":
        // Full Workshop Overview (Table center, drying rack left, vat right all framed!)
        setViewPreset("overview");
        targetCamPos.current.set(0, 1.25, 2.3);
        targetCamLook.current.set(0, 0.14, 0);
        if (knife) {
          knife.position.copy(knifeRestPos.current);
          knife.rotation.set(0, -Math.PI / 3, 0.05);
        }
        if (cloth) cloth.visible = true;
        if (bannerShowcase) bannerShowcase.visible = false;
        if (finishSpotlight) finishSpotlight.intensity = 0;
        break;

      case "warm":
        // Close-up on the Copper Stove & Knife
        setViewPreset("heater");
        targetCamPos.current.set(-0.28, 0.65, 0.8);
        targetCamLook.current.set(-0.28, 0.28, 0.05);
        if (knife) {
          knife.position.copy(knifeStovePos.current);
          knife.rotation.set(0.2, -0.3, 0.55);
        }
        if (bannerShowcase) bannerShowcase.visible = false;
        if (finishSpotlight) finishSpotlight.intensity = 0;
        break;

      case "draw":
        // Cinematic In-3D Lens Focus over the cloth on the table (Requirement 2)
        setViewPreset("cloth");
        targetCamPos.current.set(0.08, 0.52, 0.22);
        targetCamLook.current.set(0.08, 0.195, 0.01);
        if (knife) {
          knife.position.copy(knifeClothPos.current);
          knife.rotation.set(0.1, -0.15, 0.35);
        }
        if (cloth) cloth.visible = true;
        if (bannerShowcase) bannerShowcase.visible = false;
        if (finishSpotlight) finishSpotlight.intensity = 0;
        break;

      case "dye":
        // Pan to the tall ancient indigo vat standing beside the table on the right
        setViewPreset("vat");
        targetCamPos.current.set(0.68, 0.95, 1.15);
        targetCamLook.current.set(0.68, 0.26, 0.08);
        if (cloth) {
          // Cloth dips in 3D into the tall indigo vat
          cloth.position.set(0.68, 0.3, 0.08);
          cloth.scale.setScalar(0.36);
        }
        if (bannerShowcase) bannerShowcase.visible = false;
        if (finishSpotlight) finishSpotlight.intensity = 0;
        break;

      case "oxidize":
        // Pan to the bamboo drying rack standing beside the table on the left
        setViewPreset("rack");
        targetCamPos.current.set(-0.74, 0.85, 1.35);
        targetCamLook.current.set(-0.74, 0.2, -0.05);
        if (cloth) cloth.visible = false;
        if (bannerShowcase) bannerShowcase.visible = false;
        if (finishSpotlight) finishSpotlight.intensity = 0;
        break;

      case "finish":
        // 360° Masterpiece Showcase in center stage (Requirement 1 & 6)
        setViewPreset("overview");
        targetCamPos.current.set(0, 0.52, 1.42);
        targetCamLook.current.set(0, 0.38, 0);
        if (cloth) cloth.visible = false;
        if (bannerShowcase) {
          bannerShowcase.visible = true;
          bannerShowcase.position.set(0, 0.42, 0);
        }
        if (finishSpotlight) finishSpotlight.intensity = 3.6;
        break;
    }
  }, [phase]);

  // Preset Camera Switcher
  const switchPreset = (preset: string) => {
    setViewPreset(preset);
    isTransitioningCamera.current = true;
    switch (preset) {
      case "overview":
        targetCamPos.current.set(0, 1.25, 2.3);
        targetCamLook.current.set(0, 0.14, 0);
        break;
      case "heater":
        targetCamPos.current.set(-0.28, 0.65, 0.8);
        targetCamLook.current.set(-0.28, 0.28, 0.05);
        break;
      case "cloth":
        targetCamPos.current.set(0.08, 0.52, 0.22);
        targetCamLook.current.set(0.08, 0.195, 0.01);
        break;
      case "vat":
        targetCamPos.current.set(0.68, 0.95, 1.15);
        targetCamLook.current.set(0.68, 0.26, 0.08);
        break;
      case "rack":
        targetCamPos.current.set(-0.74, 0.85, 1.35);
        targetCamLook.current.set(-0.74, 0.2, -0.05);
        break;
    }
  };

  const activeToolData = selectedTool ? WAX_TOOLS_DATA[selectedTool] : null;

  return (
    <div className={`wax-3d-scene-container full-3d-map-container is-phase-${phase}`}>
      {/* Three.js Canvas Root */}
      <div
        ref={containerRef}
        className="three-canvas-root"
        onPointerDown={handlePointerDown}
      />

      {/* Loading Progress Screen */}
      {!isLoaded && (
        <div className="scene-loader-overlay">
          <div className="loader-box">
            <span className="spinner-symbol">✦</span>
            <b>正在加载丹寨实景 3D 蜡染工坊...</b>
            <div className="progress-track">
              <i style={{ width: `${loadingProgress}%` }} />
            </div>
            <small>Lux3D 铜蜡刀、蜡炉、土布与高深染缸载入中 ({loadingProgress}%)</small>
          </div>
        </div>
      )}

      {/* Top Quick Camera Presets (Always accessible in 3D viewport) */}
      <div className="scene-hud-top in-map-camera-bar">
        <div className="hud-view-presets">
          <button
            type="button"
            className={viewPreset === "overview" ? "is-active" : ""}
            onClick={() => switchPreset("overview")}
          >
            工坊全景
          </button>
          <button
            type="button"
            className={viewPreset === "heater" ? "is-active" : ""}
            onClick={() => switchPreset("heater")}
          >
            🔥 铜蜡炉
          </button>
          <button
            type="button"
            className={viewPreset === "cloth" ? "is-active" : ""}
            onClick={() => switchPreset("cloth")}
          >
            📜 绘蜡台
          </button>
          <button
            type="button"
            className={viewPreset === "vat" ? "is-active" : ""}
            onClick={() => switchPreset("vat")}
          >
            🏺 靛蓝缸 (高)
          </button>
          <button
            type="button"
            className={viewPreset === "rack" ? "is-active" : ""}
            onClick={() => switchPreset("rack")}
          >
            🎋 晾布竹架
          </button>
        </div>
      </div>

      {/* Step 1 Interactive In-Map Knife Pickup Target Callout */}
      {phase === "intro" && (
        <div className="knife-pickup-callout">
          <div className="callout-pulse" />
          <button
            type="button"
            className="callout-btn"
            onClick={triggerPickKnife}
          >
            👉 点击取起 3D 铜蜡刀 · 移至蜡炉保温
          </button>
        </div>
      )}

      {/* Step 2 In-Map Interactive Workstation Controls (Requirement 2 & 5) */}
      {phase === "warm" && (
        <div className="in-map-workstation-panel">
          <div className="workstation-info">
            <h3>第一步 · 温蜡与控量</h3>
            <p>
              {metrics.knifeTemp < 3
                ? "让双面铜片靠近炭火受热蓄温"
                : metrics.waxLoad < 2
                  ? "点击'刀角蘸蜡'，观察 3D 蜡刀沉入熔蜡碗"
                  : "蜡量充盈，准备落笔绘图"}
            </p>
          </div>

          <div className="workstation-meters">
            <label>
              刀头温度 <b>{["冷 (需加热)", "微温", "温热", "就绪 (可蘸蜡)"][metrics.knifeTemp]}</b>
              <i><em style={{ width: `${metrics.knifeTemp * 33.33}%` }} /></i>
            </label>
            <label>
              刀尖蜡量 <b>{["未蘸蜡", "适量 (推荐勾线)", "饱满 (推荐封白)"][metrics.waxLoad]}</b>
              <i><em style={{ width: `${metrics.waxLoad * 50}%` }} /></i>
            </label>
          </div>

          <div className="workstation-buttons">
            {metrics.knifeTemp < 3 ? (
              <button
                type="button"
                className="in-map-btn primary"
                onClick={onHeatKnife}
              >
                🔥 靠近炭火加热 ({metrics.knifeTemp}/3)
              </button>
            ) : metrics.waxLoad < 2 ? (
              <button
                type="button"
                className="in-map-btn primary"
                onClick={triggerDipKnifeAnimation}
              >
                🍯 以刀角轻蘸熔化蜂蜡 (3D 蘸蜡动画)
              </button>
            ) : (
              <div className="btn-group">
                <button
                  type="button"
                  className="in-map-btn secondary"
                  onClick={onScrapeWax}
                >
                  碗沿刮拭余蜡
                </button>
                <button
                  type="button"
                  className="in-map-btn primary"
                  onClick={onStartDrawing}
                >
                  聚焦桌布 · 开始落蜡临摹 <b>→</b>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selected Tool Cultural Knowledge Card */}
      {activeToolData && (
        <div className="tool-inspector-card">
          <div className="inspector-head">
            <span className="inspector-icon">{activeToolData.icon}</span>
            <div>
              <h3>{activeToolData.name}</h3>
              <small>{activeToolData.subname}</small>
            </div>
            <button
              type="button"
              className="close-btn"
              onClick={() => setSelectedTool(null)}
            >
              ✕
            </button>
          </div>
          <p className="inspector-desc">{activeToolData.description}</p>
          <div className="inspector-tip">
            <span>传承要诀</span>
            <p>{activeToolData.heritageTip}</p>
          </div>
        </div>
      )}

      {/* Embedded Phase Interaction Overlay for Step 4 & 5 */}
      <div className="scene-phase-controls">
        {phase === "dye" && (
          <div className="phase-action-banner">
            <div>
              <p>布料已沉入杉木高深染缸，吸附天然发酵靛蓝中...</p>
              <div className="mini-progress-bar">
                <i style={{ width: `${metrics.dyeDurationSec}%` }} />
              </div>
            </div>
            {metrics.dyeDurationSec >= 100 && (
              <button
                type="button"
                className="action-btn primary"
                onClick={onHangOnRack}
              >
                出缸 · 挂上晾布竹架氧化 <b>→</b>
              </button>
            )}
          </div>
        )}

        {phase === "oxidize" && (
          <div className="phase-action-banner">
            <div>
              <p>
                {metrics.oxidationRatio < 95
                  ? `空气氧化中 · 见风转蓝 (${metrics.oxidationRatio}%)`
                  : "氧化成蓝稳定！可复染加深或直接鉴赏"}
              </p>
              <div className="mini-progress-bar">
                <i style={{ width: `${metrics.oxidationRatio}%` }} />
              </div>
            </div>
            {metrics.oxidationRatio >= 100 && (
              <div className="btn-row">
                {metrics.dyePasses < 3 && (
                  <button
                    type="button"
                    className="action-btn secondary"
                    onClick={onRepeatDye}
                  >
                    🔄 再次入染 (加深第 {metrics.dyePasses + 1} 层蓝)
                  </button>
                )}
                <button
                  type="button"
                  className="action-btn primary"
                  onClick={onFinishMasterpiece}
                >
                  ✨ 展开成品 · 鉴赏我的杰作 <b>→</b>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* In-Map Children Overlay (e.g. Drawing Canvas in Step 3 or Scorecard in Step 6) */}
      {children}
    </div>
  );
}
