"""Crop a four-view reference sheet, upload it to Lux3D, and save a GLB."""

import hashlib
import os
import sys
import time
from pathlib import Path

import requests
from PIL import Image

SKILL_DIR = Path(r"C:\Users\di\Desktop\Miao\.agents\skills\lux3d")
sys.path.insert(0, str(SKILL_DIR))
from lux3d_client import create_image_to_3d_task, complete_task

BASE_URL = "https://api.aholo3d.com/global"
SOURCE = Path(
    r"C:\Users\di\.codex\generated_images\01a04b72-3b72-7910-b215-c7d52858ff9b"
    r"\exec-c27da77a-3eaf-429d-b9b0-ce97972caaf3.png"
)
OUTPUT = Path(r"C:\Users\di\Desktop\Miao\output\lux3d")


def upload_file(path: Path, api_key: str) -> str:
    token_response = requests.get(
        f"{BASE_URL}/asset/v1/token",
        headers={"Authorization": api_key},
        timeout=30,
    )
    token_response.raise_for_status()
    token_body = token_response.json()
    if token_body.get("c") not in (None, 0, "0"):
        raise RuntimeError(f"Could not obtain upload token: {token_body}")
    # Global responses may expose the credential directly instead of under d.
    token = token_body.get("d") or token_body
    if not all(field in token for field in ("ousToken", "globalDomain")):
        safe = {key: token_body.get(key) for key in ("c", "m", "message", "code", "status")}
        raise RuntimeError(f"Unexpected upload-token response: {safe}")
    raw = path.read_bytes()
    digest = hashlib.md5(raw).hexdigest()
    upload_response = requests.post(
        f"{token['globalDomain'].rstrip('/')}/ous/api/v2/single/upload",
        headers={"ous-token-v2": token["ousToken"]},
        data={"md5": digest},
        files={"file": (path.name, raw, "image/png")},
        timeout=60,
    )
    upload_response.raise_for_status()
    upload_body = upload_response.json()
    if upload_body.get("c") not in (None, 0, "0"):
        raise RuntimeError(f"Upload rejected: {upload_body}")

    for _ in range(30):
        status_response = requests.get(
            f"{token['globalDomain'].rstrip('/')}/ous/api/v2/upload/status",
            headers={"ous-token-v2": token["ousToken"]},
            timeout=30,
        )
        status_response.raise_for_status()
        status_body = status_response.json()
        data = status_body.get("d") or {}
        if data.get("status") == 5 and data.get("url"):
            return data["url"]
        if data.get("status") in (6, 8):
            raise RuntimeError(f"Upload failed: {status_body}")
        time.sleep(0.5)
    raise RuntimeError("Timed out waiting for image upload")


def main() -> None:
    api_key = os.environ.get("LUX3D_API_KEY")
    if not api_key:
        raise RuntimeError("Set LUX3D_API_KEY before running this script.")
    OUTPUT.mkdir(parents=True, exist_ok=True)
    views_dir = OUTPUT / "lusheng_views"
    views_dir.mkdir(exist_ok=True)
    sheet = Image.open(SOURCE)
    width, height = sheet.size
    boxes = {
        "front": (0, 0, width // 2, height // 2),
        "right": (width // 2, 0, width, height // 2),
        "left": (0, height // 2, width // 2, height),
        "back": (width // 2, height // 2, width, height),
    }
    paths = []
    for name, box in boxes.items():
        path = views_dir / f"lusheng_{name}.png"
        sheet.crop(box).save(path)
        paths.append(path)

    urls = [upload_file(path, api_key) for path in paths]
    task_id = create_image_to_3d_task(
        imgs=urls,
        version="G1-Turbo",
        outputFormat=["glb"],
        enablePbr=True,
    )
    print(f"Lux3D task: {task_id}")
    downloads = complete_task(
        task_id,
        output_path=str(OUTPUT / "lusheng.glb"),
        expected_formats=["glb"],
        max_attempts=40,
        interval=12,
    )
    print(downloads)


if __name__ == "__main__":
    main()
