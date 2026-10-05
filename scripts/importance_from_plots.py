"""Reads the feature importances back from the two bar charts in notebook-rf-v1.ipynb.

The notebook only kept the plots (cells 52 and 53), not the numbers, so this measures each bar in pixels
and converts it with the axis ticks. One pixel is about 0.00005 on the impurity plot and 0.00003 on the
permutation plot. Labels are typed in from the plots, top to bottom.

Usage: python scripts/importance_from_plots.py path/to/notebook-rf-v1.ipynb  (needs numpy and Pillow)
"""
import base64
import io
import json
import sys

import numpy as np
from PIL import Image

IMPURITY_ORDER = """start_hk_2 start_hk_4 start_hk_1 start_hk_3 early_hk_3 start_hk_created start_hk_5 early_hk_2
early_hk_5 start_other early_hk_used early_hk_4 early_hk_1 start_hk_used mid_hk_5 mid_hk_4 early_other start_hk_0
mid_hk_3 mid_hk_6 mid_hk_9 early_hk_6 mid_hk_0 mid_hk_used early_hk_created mid_hk_8 start_hk_6 start_base mid_hk_1
early_hk_0 start_hk_7 mid_hk_2 mid_hk_7 mid_hk_created mid_base start_hk_9 early_mineral early_hk_9 mid_other
early_base start_hk_8 early_hk_8 early_hk_7 played_race_Protoss played_race_Zerg start_mineral played_race_Terran
mid_mineral""".split()
PERMUTATION_ORDER = """start_hk_3 start_hk_4 start_hk_5 played_race_Protoss mid_hk_9 early_hk_6 start_hk_2 early_hk_3
start_other start_hk_used start_base start_hk_1 mid_hk_2 mid_hk_6 early_hk_1 mid_hk_5 early_hk_created start_hk_9
early_hk_4 mid_hk_8 early_mineral played_race_Terran early_hk_0 mid_hk_3 start_hk_created played_race_Zerg mid_hk_1
early_hk_used start_hk_7 mid_hk_created start_mineral mid_hk_used mid_hk_0 early_hk_5 mid_other start_hk_6 mid_base
start_hk_0 early_other start_hk_8 early_hk_2 early_hk_9 early_hk_8 mid_mineral early_base mid_hk_7 mid_hk_4
early_hk_7""".split()


def cell_image(cells, index):
    for out in cells[index].get("outputs", []):
        if "image/png" in out.get("data", {}):
            png = base64.b64decode(out["data"]["image/png"])
            return np.array(Image.open(io.BytesIO(png)).convert("RGB")).astype(int)
    sys.exit(f"No image in cell {index}")


def masks(im):
    bar = (abs(im[:, :, 0] - 31) < 14) & (abs(im[:, :, 1] - 119) < 14) & (abs(im[:, :, 2] - 180) < 14)
    dark = im.sum(axis=2) < 200
    return bar, dark


def runs(values):
    groups = []
    for v in values:
        if groups and v - groups[-1][-1] <= 1:
            groups[-1].append(v)
        else:
            groups.append([v])
    return groups


def x_ticks(dark):
    widths = dark.sum(axis=1)
    bottom_spine = max(y for y in range(len(widths)) if widths[y] > 800)
    xs = np.where(dark[bottom_spine + 2:bottom_spine + 5].all(axis=0))[0]
    return [float(np.mean(g)) for g in runs(xs)]


def bar_rows(bar):
    # Taken from the impurity plot, which has no error bars cutting through the bars.
    return [(g[0], g[-1]) for g in runs(np.where(bar[:, 170:].any(axis=1))[0])]


def main():
    cells = json.load(open(sys.argv[1], encoding="utf-8"))["cells"]
    im = cell_image(cells, 52)
    bar, dark = masks(im)
    rows = bar_rows(bar)
    assert len(rows) == 48, len(rows)
    ticks = x_ticks(dark)
    zero, per_unit = ticks[0], (ticks[-1] - ticks[0]) / (0.01 * (len(ticks) - 1))
    impurity = {}
    for name, (a, b) in zip(IMPURITY_ORDER, rows):
        right = np.where(bar[a:b + 1].any(axis=0))[0].max() + 1
        impurity[name] = round((right - zero - 0.5) / per_unit, 5)

    im = cell_image(cells, 53)
    bar, dark = masks(im)
    ticks = x_ticks(dark)
    zero, per_unit = ticks[0], (ticks[-1] - ticks[0]) / (0.005 * (len(ticks) - 1))
    permutation = {}
    for name, (a, b) in zip(PERMUTATION_ORDER, rows):
        cols = np.where(bar[a:b + 1].any(axis=0))[0]
        left, right = cols.min(), cols.max() + 1
        mean = (right - zero - 0.5) / per_unit if right > zero + 3 else (left - zero + 0.5) / per_unit
        line_y = int(np.argmax(dark[a:b + 1, 170:1085].sum(axis=1))) + a
        line = np.where(dark[line_y, 170:1085])[0] + 170
        std = (line.max() + 1 - line.min()) / per_unit / 2
        permutation[name] = {"mean": round(mean, 5), "std": round(std, 5)}

    print(json.dumps({"impurity": impurity, "permutation": permutation}, indent=1))


if __name__ == "__main__":
    main()
