"""Create and poll the seven GLB props for the silver-forging learning workshop.

Run with LUX3D_API_KEY set only in the current process. This script never writes
credentials. It records public task IDs and downloaded output paths in the
project-local manifest so a later --poll invocation can resume safely.
"""
from __future__ import annotations

import argparse
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CLIENT_PATH = ROOT / ".agents" / "skills" / "lux3d" / "lux3d_client.py"
OUT = ROOT / "public" / "银饰" / "game-assets" / "3d"
MANIFEST = ROOT / "public" / "银饰" / "game-assets" / "lux3d-manifest.json"
ASSETS = {
    "01-silver-ingot": "A single hand-cast sterling silver ingot for a traditional silversmith workshop, compact rectangular shape, lightly uneven cast surface, isolated object, no background",
    "02-charcoal-forge": "A compact traditional charcoal brazier forge with a clay crucible and dark iron supports, isolated workshop object, no people, no background",
    "03-anvil": "A compact blacksmith anvil set on a short hardwood stump, traditional silversmith workshop tool, isolated object, no background",
    "04-forging-hammer": "A traditional silver forging hammer, dark forged steel head and worn hardwood handle, isolated object, no background",
    "05-chasing-chisel": "A fine chasing chisel with a small pitch bowl, traditional silversmith engraving tools grouped as one isolated object, no background",
    "06-motif-plate": "A circular sterling silver practice plate engraved with abstract butterfly swirl and leaf motifs, no written characters, isolated object, no background",
    "07-finished-crown": "A learning-demo Miao-inspired silver crown component with three raised floral elements on a curved silver band, isolated object, no people, no background",
}


def client():
    spec = importlib.util.spec_from_file_location("lux3d_client", CLIENT_PATH)
    if not spec or not spec.loader:
        raise RuntimeError(f"Cannot load Lux3D client: {CLIENT_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def load_manifest() -> dict:
    if MANIFEST.exists():
        return json.loads(MANIFEST.read_text(encoding="utf-8"))
    return {"version": "G1-Turbo", "assets": {}}


def save(data: dict) -> None:
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--submit", action="store_true")
    parser.add_argument("--poll", action="store_true")
    parser.add_argument("--limit", type=int, default=2, help="maximum new tasks to submit")
    args = parser.parse_args()
    if not (args.submit or args.poll):
        parser.error("choose --submit and/or --poll")
    api = client(); manifest = load_manifest(); OUT.mkdir(parents=True, exist_ok=True)
    if args.submit:
        submitted = 0
        for name, prompt in ASSETS.items():
            if submitted >= args.limit:
                break
            entry = manifest["assets"].setdefault(name, {"source": f"public/银饰/game-assets/2d/{name}.png"})
            if entry.get("taskId"):
                continue
            entry["taskId"] = api.create_text_to_3d_task(prompt, version="G1-Turbo", style="photorealistic", faceCount=50000, outputFormat=["glb"], enablePbr=True, aiPredictSize=True)
            entry["generationStatus"] = "created"; entry["modelPath"] = f"public/银饰/game-assets/3d/{name}.glb"
            print(f"submitted {name}: {entry['taskId']}"); save(manifest); submitted += 1
    if args.poll:
        for name, entry in manifest["assets"].items():
            if entry.get("generationStatus") == "succeeded" or not entry.get("taskId"):
                continue
            task = api.get_task(entry["taskId"]); status = task.get("status")
            if status == 3:
                outputs = api.parse_task_outputs(task); target = ROOT / entry["modelPath"]
                entry["glbBytes"] = api.download_model(outputs["glb"], target); entry["generationStatus"] = "succeeded"
                print(f"downloaded {name}: {entry['glbBytes']} bytes")
            elif status in {4, 6}:
                entry["generationStatus"] = "failed" if status == 4 else "cancelled"; print(f"terminal {name}: {status}")
            else:
                entry["generationStatus"] = "running"; print(f"running {name}: {entry['taskId']}")
            save(manifest)


if __name__ == "__main__":
    main()
