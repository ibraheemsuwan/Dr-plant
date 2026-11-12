"""Evaluate a Dr. Plant model on a folder of labelled images and report what actually matters.

    python eval/evaluate.py --data Plant_d_test                       # the dataset's own test split
    python eval/evaluate.py --data real_world_test --report real.json   # photos from real fields

Folder layout: <data>/<class folder>/<images>. Folder names are matched to the model's classes
(class_names.json) ignoring case, punctuation and small naming differences; folders that cannot be
matched are listed and skipped, so check that list.

Reported, in order of importance for a farmer:
  * wrong-and-confident rate: answers shown to the user (confidence >= --show) that are wrong
  * crop accuracy and disease accuracy
  * accuracy vs coverage: if we only answer above a confidence, how many photos get answered and how often are they right
  * calibration (ECE): does "90% sure" mean right 90% of the time
  * per-crop accuracy and the most common confusions
"""
import argparse
import difflib
import glob
import json
import os
import re
import sys
from collections import Counter, defaultdict

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
os.environ.setdefault("TF_ENABLE_ONEDNN_OPTS", "0")

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
AI_DIR = os.path.dirname(HERE)

STOPWORDS = {"leaf", "leaves", "on", "disease", "diseases", "maize", "gray", "grey", "fruits"}
SYNONYMS = {"normal": "healthy", "fresh": "healthy", "eggplaant": "eggplant", "powder": "powdery", "downey": "downy",
            "leafminner": "leafminer", "mossaic": "mosaic", "syndrone": "syndrome"}


def norm(text: str) -> str:
    tokens = re.sub(r"[^a-z0-9]+", " ", text.lower()).split()
    tokens = [SYNONYMS.get(t, t) for t in tokens]
    return " ".join(t for t in tokens if t not in STOPWORDS)


def crop_of(class_name: str) -> str:
    return norm(class_name).split(" ")[0]


def map_folders(folders, class_names):
    """folder name -> class index (exact normalised match first, then the closest name within the same crop)."""
    by_norm = {norm(n): i for i, n in enumerate(class_names)}
    mapping, fuzzy, unmapped = {}, {}, []
    for f in folders:
        key = norm(f)
        if key in by_norm:
            mapping[f] = by_norm[key]
            continue
        same_crop = [n for n in by_norm if n.split(" ")[0] == key.split(" ")[0]]
        match = difflib.get_close_matches(key, same_crop, n=1, cutoff=0.7)
        if match:
            mapping[f] = by_norm[match[0]]
            fuzzy[f] = class_names[by_norm[match[0]]]
        else:
            unmapped.append(f)
    return mapping, fuzzy, unmapped


def load_batch(paths, size):
    out = []
    for p in paths:
        try:
            out.append(np.array(Image.open(p).convert("RGB").resize(size), dtype="float32"))
        except Exception:
            out.append(np.zeros((size[1], size[0], 3), dtype="float32"))
    return np.stack(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", required=True)
    ap.add_argument("--model", default=os.path.join(AI_DIR, "best_model.keras"))
    ap.add_argument("--classes", default=os.path.join(AI_DIR, "class_names.json"))
    ap.add_argument("--max-per-class", type=int, default=0, help="cap images per folder (0 = all)")
    ap.add_argument("--show", type=float, default=85.0, help="confidence at/above which an answer is shown to users")
    ap.add_argument("--report", help="write the full result as JSON")
    ap.add_argument("--seed", type=int, default=1)
    args = ap.parse_args()

    from tensorflow.keras.applications.efficientnet import preprocess_input
    from tensorflow.keras.models import load_model

    class_names = json.load(open(args.classes, encoding="utf-8"))
    model = load_model(args.model, compile=False)
    size = (model.input_shape[2], model.input_shape[1])
    assert model.output_shape[-1] == len(class_names), "model outputs do not match class_names.json"

    folders = sorted(d for d in os.listdir(args.data) if os.path.isdir(os.path.join(args.data, d)))
    mapping, fuzzy, unmapped = map_folders(folders, class_names)
    print(f"{len(mapping)}/{len(folders)} folders matched to model classes")
    for f, c in fuzzy.items():
        print(f"   fuzzy match: {f!r} -> {c!r}  (check this)")
    if unmapped:
        print(f"   SKIPPED (no class): {unmapped}")

    rng = np.random.default_rng(args.seed)
    paths, labels = [], []
    for f, idx in mapping.items():
        files = [p for p in glob.glob(os.path.join(args.data, f, "*")) if p.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))]
        if args.max_per_class and len(files) > args.max_per_class:
            files = list(rng.choice(files, args.max_per_class, replace=False))
        paths += files
        labels += [idx] * len(files)
    if not paths:
        sys.exit("no images found")
    print(f"{len(paths)} images\n")

    probs = []
    for i in range(0, len(paths), 32):
        probs.append(model.predict(preprocess_input(load_batch(paths[i:i + 32], size)), verbose=0))
    P = np.concatenate(probs)
    y = np.array(labels)
    top = P.argmax(1)
    conf = P.max(1) * 100
    ok = top == y
    n = len(y)

    crop_ok = np.array([crop_of(class_names[a]) == crop_of(class_names[b]) for a, b in zip(top, y)])
    top3 = np.mean([y[i] in np.argsort(P[i])[::-1][:3] for i in range(n)]) * 100
    shown = conf >= args.show

    print("== Headline")
    print(f"  top-1 accuracy (disease): {ok.mean()*100:5.1f}%     top-3: {top3:.1f}%")
    print(f"  crop accuracy:            {crop_ok.mean()*100:5.1f}%")
    print(f"  answers shown (conf >= {args.show:.0f}%): {shown.mean()*100:.1f}% of photos")
    wrong_shown = (shown & ~ok).sum()
    print(f"  WRONG AND CONFIDENT: {wrong_shown}/{n} photos = {wrong_shown/n*100:.1f}% of all, "
          f"{wrong_shown/max(shown.sum(),1)*100:.1f}% of the answers users would see")
    wrong_crop_shown = (shown & ~crop_ok).sum()
    print(f"  wrong CROP and confident: {wrong_crop_shown}/{n} = {wrong_crop_shown/n*100:.1f}%")

    print("\n== If we only answer above a confidence (accuracy vs coverage)")
    print("   threshold   answered   accuracy of answers   wrong answers per 100 photos")
    for t in (0, 50, 60, 70, 80, 85, 90, 95, 99):
        s = conf >= t
        if s.sum() == 0:
            continue
        acc = ok[s].mean() * 100
        print(f"   >= {t:>3}%     {s.mean()*100:6.1f}%        {acc:6.1f}%               {(s & ~ok).sum()/n*100:5.1f}")

    print("\n== Calibration (does 90% sure mean right 90% of the time?)")
    ece = 0.0
    bins = [(0, 40), (40, 60), (60, 80), (80, 90), (90, 95), (95, 99), (99, 100.01)]
    print("   confidence    photos   claimed   actual")
    for lo, hi in bins:
        s = (conf >= lo) & (conf < hi)
        if s.sum() == 0:
            continue
        c, a = conf[s].mean(), ok[s].mean() * 100
        ece += s.sum() / n * abs(c - a)
        print(f"   {lo:>3}-{min(hi,100):<3}%     {s.sum():5d}    {c:6.1f}%   {a:6.1f}%")
    print(f"   expected calibration error: {ece:.1f} points (0 = perfectly honest)")

    print("\n== Per crop (disease accuracy; n = photos)")
    per_crop = defaultdict(list)
    for a, b, o in zip(top, y, ok):
        per_crop[crop_of(class_names[b])].append(o)
    rows = sorted(per_crop.items(), key=lambda kv: np.mean(kv[1]))
    for crop, v in rows:
        print(f"   {crop:<14} {np.mean(v)*100:5.1f}%   n={len(v)}")

    print("\n== Most common confusions (true -> predicted)")
    conf_pairs = Counter((class_names[b], class_names[a]) for a, b, o in zip(top, y, ok) if not o)
    for (t, p), c in conf_pairs.most_common(12):
        print(f"   {c:3d}x  {t}  ->  {p}")

    classes_seen = Counter(y.tolist())
    thin = sum(1 for c in classes_seen.values() if c < 10)
    print(f"\n== Reliability of this evaluation: {thin}/{len(classes_seen)} classes have fewer than 10 photos; "
          "per-class numbers for those are noise.")

    if args.report:
        result = {
            "images": int(n), "top1": float(ok.mean()), "top3": float(top3 / 100), "crop_accuracy": float(crop_ok.mean()),
            "shown_threshold": args.show, "wrong_and_confident": float(wrong_shown / n), "ece": float(ece),
            "per_crop": {c: float(np.mean(v)) for c, v in per_crop.items()},
            "confusions": [{"true": t, "pred": p, "count": c} for (t, p), c in conf_pairs.most_common(50)],
        }
        json.dump(result, open(args.report, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
        print(f"\nreport written to {args.report}")


if __name__ == "__main__":
    main()
