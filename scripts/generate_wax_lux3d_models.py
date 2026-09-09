"""Upload the wax-dyeing 2D props and generate textured Lux3D GLB assets.

This script deliberately requires an explicit --version to make the generated
model family visible in the recorded manifest. It reads LUX3D_API_KEY,
LUX3D_BASE_URL, and LUX3D_REGION from the project .env file when not already
present in the environment.

Examples:
    python scripts/generate_wax_lux3d_models.py --version G1-Turbo --submit
    python scripts/generate_wax_lux3d_models.py --version G1-Turbo --poll
"""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import os
import time
from pathlib import Path
from typing import Any

import requests


ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "public" / "蜡染" / "game-assets" / "2d"
OUTPUT_DIR = ROOT / "public" / "蜡染" / "game-assets" / "3d"
MANIFEST_PATH = ROOT / "public" / "蜡染" / "game-assets" / "lux3d-manifest.json"
LUX_CLIENT_PATH = ROOT / ".agents" / "skills" / "lux3d" / "lux3d_client.py"
ASSET_FILES = (
    "01-wax-knife-v2.png",
    "02-wax-heater.png",
    "03-guided-cloth.png",
    "04-wax-sealed-cloth.png",
    "05-indigo-vat.png",
    "06-oxidizing-textile.png",
    "07-finished-textile.png",
)
MODEL_FILENAMES = {"01-wax-knife-v2.png": "01-wax-knife.glb"}

# The default Windows proxy in this workspace resets multipart uploads to the
# OUS domain. Lux3D's Global endpoints are reachable directly, so deliberately
# avoid inheriting proxy environment variables for this narrowly scoped client.
HTTP = requests.Session()
HTTP.trust_env = False


def load_dotenv() -> None:
    """Read project-local Lux3D settings without printing secret values."""
    env_path = ROOT / ".env"
    if not env_path.exists():
        return
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def service_data(response: requests.Response) -> Any:
    response.raise_for_status()
    data = response.json()
    if isinstance(data, dict) and data.get("c") not in (None, "", 0, "0"):
        raise RuntimeError(f"Asset API error: {data.get('m') or data}")
    if isinstance(data, dict) and isinstance(data.get("d"), (dict, list, str)):
        return data["d"]
    if isinstance(data, dict) and isinstance(data.get("data"), (dict, list, str)):
        return data["data"]
    return data


def md5_of(path: Path) -> str:
    digest = hashlib.md5()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def upload_one(path: Path) -> str:
    """Upload a local reference image using the public Asset endpoints."""
    api_key = os.environ["LUX3D_API_KEY"]
    base_url = os.environ.get("LUX3D_BASE_URL", "https://api.aholo3d.com/global").rstrip("/")
    token_response = HTTP.get(
        f"{base_url}/asset/v1/token", headers={"Authorization": api_key}, timeout=30
    )
    token_data = service_data(token_response)
    token = token_data["ousToken"]
    domain = token_data["globalDomain"].rstrip("/")
    block_size = int(token_data["blockSize"])
    headers = {"ous-token-v2": token}
    file_md5 = md5_of(path)
    size = path.stat().st_size

    if size <= block_size:
        with path.open("rb") as handle:
            upload_response = HTTP.post(
                f"{domain}/ous/api/v2/single/upload",
                headers=headers,
                data={"md5": file_md5},
                files={"file": (path.name, handle, "image/png")},
                timeout=120,
            )
        task_data = service_data(upload_response)
    else:
        blocks = (size + block_size - 1) // block_size
        init_response = HTTP.post(
            f"{domain}/ous/api/v2/block/upload/init",
            headers=headers,
            params={"md5": file_md5, "blocks": blocks, "size": size, "name": path.name},
            timeout=30,
        )
        task_data = service_data(init_response)
        if not task_data.get("deduplicated"):
            with path.open("rb") as handle:
                for index in range(1, blocks + 1):
                    payload = handle.read(block_size)
                    part_response = HTTP.post(
                        f"{domain}/ous/api/v2/block/upload/part",
                        headers=headers,
                        data={"block": index},
                        files={"file": (path.name, payload, "application/octet-stream")},
                        timeout=120,
                    )
                    service_data(part_response)

    if isinstance(task_data, str):
        upload_task_id = task_data
    elif isinstance(task_data, dict) and task_data.get("taskId"):
        upload_task_id = str(task_data["taskId"])
    elif isinstance(task_data, dict) and task_data.get("obsTaskId"):
        # The Global endpoint currently names the same opaque upload handle
        # obsTaskId, while the reference schema calls it taskId.
        upload_task_id = str(task_data["obsTaskId"])
    else:
        summary = sorted(task_data.keys()) if isinstance(task_data, dict) else type(task_data).__name__
        raise RuntimeError(
            f"Asset upload did not return a taskId for {path.name}; response shape: {summary}"
        )
    if not upload_task_id:
        raise RuntimeError(f"Asset upload returned an empty taskId for {path.name}")
    for _ in range(30):
        status_response = HTTP.get(
            f"{domain}/ous/api/v2/upload/status", headers=headers, timeout=30
        )
        status_data = service_data(status_response)
        if isinstance(status_data, dict) and int(status_data.get("status", -1)) == 5:
            url = status_data.get("url")
            if isinstance(url, str) and url.startswith(("http://", "https://")):
                return url
            raise RuntimeError(f"Asset upload succeeded without an accessible URL: {status_data}")
        if isinstance(status_data, dict) and int(status_data.get("status", -1)) in {6, 8}:
            raise RuntimeError(f"Asset upload failed for {path.name}: {status_data}")
        time.sleep(1)
    raise RuntimeError(f"Asset upload timed out for {path.name}")


def load_lux_client():
    spec = importlib.util.spec_from_file_location("lux3d_client", LUX_CLIENT_PATH)
    if not spec or not spec.loader:
        raise RuntimeError(f"Cannot load Lux3D client at {LUX_CLIENT_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def load_manifest() -> dict[str, Any]:
    if MANIFEST_PATH.exists():
        return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    return {"assets": {}, "version": None, "createdBy": "generate_wax_lux3d_models.py"}


def save_manifest(manifest: dict[str, Any]) -> None:
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


def submit_next(manifest: dict[str, Any], version: str, limit: int) -> int:
    client = load_lux_client()
    submitted = 0
    active = sum(
        1
        for entry in manifest["assets"].values()
        if entry.get("generationStatus") in {"created", "running"}
    )
    for filename in ASSET_FILES:
        if active >= limit:
            break
        entry = manifest["assets"][filename]
        if entry.get("taskId"):
            continue
        kwargs: dict[str, Any] = {
            "img": entry["uploadedUrl"],
            "version": version,
            "faceCount": 50000,
            "outputFormat": ["glb"],
            "aiPredictSize": True,
        }
        if version == "G1-Turbo":
            kwargs["enablePbr"] = True
        task_id = client.create_image_to_3d_task(**kwargs)
        entry["taskId"] = task_id
        entry["generationStatus"] = "created"
        model_filename = MODEL_FILENAMES.get(filename, filename.replace(".png", ".glb"))
        entry["modelPath"] = str((OUTPUT_DIR / model_filename).relative_to(ROOT))
        print(f"submitted {filename}: task {task_id}")
        submitted += 1
        active += 1
        save_manifest(manifest)
    return submitted


def poll_and_download(manifest: dict[str, Any]) -> int:
    client = load_lux_client()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    terminal = 0
    for filename, entry in manifest["assets"].items():
        task_id = entry.get("taskId")
        if not task_id or entry.get("generationStatus") in {"succeeded", "superseded"}:
            continue
        task = client.get_task(task_id)
        status = task.get("status")
        if status in {0, 1}:
            entry["generationStatus"] = "running"
            print(f"running {filename}: task {task_id}")
        elif status == 3:
            outputs = client.parse_task_outputs(task)
            if not isinstance(outputs, dict) or not outputs.get("glb"):
                raise RuntimeError(f"Task {task_id} succeeded without GLB: {outputs}")
            target = ROOT / entry["modelPath"]
            bytes_written = client.download_model(outputs["glb"], target)
            entry["generationStatus"] = "succeeded"
            entry["glbUrl"] = outputs["glb"]
            entry["glbBytes"] = bytes_written
            print(f"downloaded {filename}: {target.name} ({bytes_written} bytes)")
            terminal += 1
        elif status in {4, 6}:
            entry["generationStatus"] = "failed" if status == 4 else "cancelled"
            entry["taskDetail"] = task
            print(f"terminal {filename}: status {status}")
            terminal += 1
        else:
            raise RuntimeError(f"Unexpected Lux3D status {status} for {filename}")
        save_manifest(manifest)
    return terminal


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--version", choices=("G1", "G1-Turbo"), required=True)
    parser.add_argument("--submit", action="store_true", help="Upload sources and submit tasks")
    parser.add_argument("--poll", action="store_true", help="Check tasks and download completed GLBs")
    parser.add_argument("--concurrency", type=int, default=2)
    args = parser.parse_args()
    if not args.submit and not args.poll:
        parser.error("pass --submit, --poll, or both")
    if not 1 <= args.concurrency <= 5:
        parser.error("--concurrency must be between 1 and 5")
    load_dotenv()
    if not os.environ.get("LUX3D_API_KEY"):
        raise RuntimeError("LUX3D_API_KEY is not configured")
    os.environ.setdefault("LUX3D_REGION", "international")
    manifest = load_manifest()
    manifest["version"] = args.version
    manifest["faceCount"] = 50000
    manifest["outputFormat"] = ["glb"]

    if args.submit:
        for filename in ASSET_FILES:
            entry = manifest["assets"].setdefault(filename, {"source": f"public/蜡染/game-assets/2d/{filename}"})
            if not entry.get("uploadedUrl"):
                print(f"uploading {filename}")
                entry["uploadedUrl"] = upload_one(ASSET_DIR / filename)
                save_manifest(manifest)
        submit_next(manifest, args.version, args.concurrency)

    if args.poll:
        poll_and_download(manifest)
        submit_next(manifest, args.version, args.concurrency)
    save_manifest(manifest)


if __name__ == "__main__":
    main()
