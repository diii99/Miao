"""Create timestamped contact sheets from the supplied wax-resist dyeing tutorial.

Run from the project root:
    python scripts/analyze_wax_dye_video.py

The output is intended for visual review before writing the game-design guide.
"""

from __future__ import annotations

from math import ceil
from pathlib import Path

import cv2
import numpy as np


VIDEO = Path("public/蜡染/蜡染教程.mp4")
OUT = Path("public/蜡染/analysis_frames")
SAMPLE_EVERY_SECONDS = 2
THUMB_WIDTH = 384
GRID_COLUMNS = 4


def draw_label(image: np.ndarray, label: str) -> np.ndarray:
    result = image.copy()
    cv2.rectangle(result, (0, 0), (150, 36), (0, 0, 0), -1)
    cv2.putText(
        result,
        label,
        (10, 25),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (255, 255, 255),
        2,
        cv2.LINE_AA,
    )
    return result


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    cap = cv2.VideoCapture(str(VIDEO))
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open {VIDEO}")
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = frame_count / fps
    times = list(np.arange(0, duration, SAMPLE_EVERY_SECONDS))
    thumbs: list[tuple[float, np.ndarray]] = []
    for seconds in times:
        cap.set(cv2.CAP_PROP_POS_MSEC, seconds * 1000)
        ok, frame = cap.read()
        if not ok:
            continue
        height = round(frame.shape[0] * THUMB_WIDTH / frame.shape[1])
        thumb = cv2.resize(frame, (THUMB_WIDTH, height), interpolation=cv2.INTER_AREA)
        thumbs.append((seconds, draw_label(thumb, f"{seconds:05.1f}s")))
    cap.release()

    rows = 3
    per_sheet = GRID_COLUMNS * rows
    for page in range(ceil(len(thumbs) / per_sheet)):
        batch = thumbs[page * per_sheet : (page + 1) * per_sheet]
        thumb_height = batch[0][1].shape[0]
        sheet = np.full((rows * thumb_height, GRID_COLUMNS * THUMB_WIDTH, 3), 245, dtype=np.uint8)
        for index, (_, thumb) in enumerate(batch):
            y = (index // GRID_COLUMNS) * thumb_height
            x = (index % GRID_COLUMNS) * THUMB_WIDTH
            sheet[y : y + thumb_height, x : x + THUMB_WIDTH] = thumb
        output = OUT / f"contact-sheet-{page + 1:02d}.jpg"
        cv2.imwrite(str(output), sheet, [cv2.IMWRITE_JPEG_QUALITY, 92])
        print(output)

    print(f"duration_seconds={duration:.2f}")
    print(f"sample_count={len(thumbs)}")


if __name__ == "__main__":
    main()
