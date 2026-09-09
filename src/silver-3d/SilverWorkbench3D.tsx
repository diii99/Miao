import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export type SilverPhase = "intro" | "heat" | "forge" | "engrave" | "polish" | "finish";

export function SilverWorkbench3D({ phase, strikes, engraving }: { phase: SilverPhase; strikes: number; engraving: number }) {
  const host = useRef<HTMLDivElement>(null);
  const forged = useRef<THREE.Mesh | null>(null);
  const hammer = useRef<THREE.Group | null>(null);
  const crown = useRef<THREE.Group | null>(null);

  useEffect(() => {
    const node = host.current;
    if (!node) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#111b22");
    scene.fog = new THREE.Fog("#111b22", 4, 10);
    const camera = new THREE.PerspectiveCamera(38, node.clientWidth / node.clientHeight, 0.1, 100);
    camera.position.set(3.1, 2.4, 4.4);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(node.clientWidth, node.clientHeight);
    renderer.shadowMap.enabled = true;
    node.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.target.set(0, 0.45, 0);
    controls.minDistance = 3; controls.maxDistance = 7;
    scene.add(new THREE.HemisphereLight(0xd6e9ff, 0x1b100c, 2.2));
    const forgeLight = new THREE.PointLight(0xff9a47, 22, 5); forgeLight.position.set(-1.6, 1.2, 0.8); scene.add(forgeLight);
    const keyLight = new THREE.DirectionalLight(0xdde8f5, 3); keyLight.position.set(3, 4, 2); keyLight.castShadow = true; scene.add(keyLight);
    const wood = new THREE.MeshStandardMaterial({ color: 0x4b2d1e, roughness: 0.82 });
    const metal = new THREE.MeshStandardMaterial({ color: 0xc8d4dd, metalness: 0.92, roughness: 0.22 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x29323a, metalness: 0.82, roughness: 0.38 });
    const table = new THREE.Mesh(new THREE.BoxGeometry(5.8, .32, 3.7), wood); table.position.y = -.15; table.receiveShadow = true; scene.add(table);
    const anvil = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(.48, .62, .65, 8), dark); base.position.y = .26; anvil.add(base);
    const face = new THREE.Mesh(new THREE.BoxGeometry(1.25, .16, .62), dark); face.position.y = .65; anvil.add(face); scene.add(anvil);
    const billet = new THREE.Mesh(new THREE.CylinderGeometry(.44, .44, .075, 48), metal); billet.rotation.x = Math.PI / 2; billet.position.set(0, .78, 0); billet.castShadow = true; scene.add(billet); forged.current = billet;
    const tool = new THREE.Group();
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(.06, .08, 1.05, 12), wood); handle.rotation.z = -0.55; handle.position.set(1.48, .73, .3); tool.add(handle);
    const head = new THREE.Mesh(new THREE.BoxGeometry(.48, .25, .28), dark); head.rotation.z = -0.55; head.position.set(1.18, 1.18, .3); tool.add(head); scene.add(tool); hammer.current = tool;
    const chisel = new THREE.Mesh(new THREE.CylinderGeometry(.05, .07, .72, 10), dark); chisel.rotation.z = .24; chisel.position.set(-1.02, .32, .65); scene.add(chisel);
    const crownGroup = new THREE.Group(); crownGroup.position.set(0, .97, -.12); crownGroup.visible = false;
    const band = new THREE.Mesh(new THREE.TorusGeometry(.62, .06, 12, 48, Math.PI * 1.3), metal); band.rotation.x = Math.PI / 2; crownGroup.add(band);
    [-.38, 0, .38].forEach((x) => { const petal = new THREE.Mesh(new THREE.SphereGeometry(.16, 20, 12), metal); petal.scale.set(.75, 1.65, .34); petal.position.set(x, .3 + (x === 0 ? .1 : 0), 0); crownGroup.add(petal); }); scene.add(crownGroup); crown.current = crownGroup;
    const resize = () => { camera.aspect = node.clientWidth / node.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(node.clientWidth, node.clientHeight); };
    window.addEventListener("resize", resize); let frame = 0; const clock = new THREE.Clock();
    const animate = () => { frame = requestAnimationFrame(animate); const t = clock.getElapsedTime(); controls.update(); forgeLight.intensity = 19 + Math.sin(t * 8) * 4; renderer.render(scene, camera); };
    animate();
    return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", resize); controls.dispose(); renderer.dispose(); node.removeChild(renderer.domElement); };
  }, []);
  useEffect(() => { if (!forged.current || !hammer.current || !crown.current) return; forged.current.scale.setScalar(1 + strikes * .025); forged.current.material = new THREE.MeshStandardMaterial({ color: phase === "heat" ? 0xff9360 : 0xd8e1e6, metalness: .9, roughness: phase === "polish" || phase === "finish" ? .08 : .3 }); hammer.current.rotation.z = strikes % 2 ? -.75 : -.42; crown.current.visible = phase === "finish"; if (phase === "finish") forged.current.visible = false; }, [phase, strikes, engraving]);
  return <div className="silver-canvas" ref={host}><span>拖拽旋转 · 滚轮缩放</span></div>;
}
