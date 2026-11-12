"""Back up and move the project's images between Cloudinary accounts.

Why: the 24 crop pictures lived on a Cloudinary account that is not this project's. This tool

  backup   downloads EVERY image referenced by the database (posts, crops, diagnoses) into backups/images/,
           verifies each one is a real image and writes a manifest with checksums. Read-only.
  migrate  copies images that live on another Cloudinary account into the project's own account, checks every
           copy byte for byte, and only then updates the database row. Nothing is ever deleted anywhere.
  seed     rewrites the crop picture URLs inside Seed/reference_data.sql using the migration result.

Credentials are read from the API's user-secrets (never printed). Run from the repository root:

    python Backend/tools/cloudinary_images.py backup
    python Backend/tools/cloudinary_images.py migrate --dry-run
    python Backend/tools/cloudinary_images.py migrate
    python Backend/tools/cloudinary_images.py seed
"""
import argparse
import concurrent.futures as cf
import datetime
import hashlib
import io
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid

from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
API_PROJECT = os.path.join(ROOT, "Backend", "DoctorPlantTest.API")
SEED_FILE = os.path.join(API_PROJECT, "Seed", "reference_data.sql")
BACKUP_DIR = os.path.join(ROOT, "backups", "images")
MYSQL = os.environ.get("MYSQL_EXE", r"C:\xampp\mysql\bin\mysql.exe")
DB_NAME = os.environ.get("DB_NAME", "doctorplant")

# table, id column, url column
SOURCES = [("posts", "PostId"), ("crops", "CropId"), ("imagediagnoses", "DiagnosisId")]
URL_RE = re.compile(r"^https://res\.cloudinary\.com/([^/]+)/image/upload/(?:v\d+/)?(.+?)(?:\.([A-Za-z0-9]+))?$")


# ------------------------------------------------------------------ helpers
def secrets():
    out = subprocess.run(["dotnet", "user-secrets", "list", "--project", API_PROJECT], capture_output=True, text=True).stdout
    cfg = dict(line.split(" = ", 1) for line in out.splitlines() if " = " in line)
    for k in ("Cloudinary:CloudName", "Cloudinary:ApiKey", "Cloudinary:ApiSecret"):
        if not cfg.get(k):
            sys.exit(f"missing user-secret {k}")
    return cfg["Cloudinary:CloudName"], cfg["Cloudinary:ApiKey"], cfg["Cloudinary:ApiSecret"]


def sql(query, *, write=False):
    args = [MYSQL, "-uroot", "--default-character-set=utf8mb4", "-N", "-B", DB_NAME, "-e", query]
    r = subprocess.run(args, capture_output=True, text=True, encoding="utf-8")
    if r.returncode != 0:
        sys.exit(f"mysql error: {r.stderr.strip()}")
    return r.stdout


def db_urls():
    rows = []
    for table, pk in SOURCES:
        out = sql(f"select {pk}, ImageUrl from {table} where ImageUrl like 'http%'")
        for line in out.splitlines():
            ident, url = line.split("\t", 1)
            rows.append({"table": table, "pk": pk, "id": int(ident), "url": url})
    return rows


def parse(url):
    m = URL_RE.match(url)
    if not m:
        return None
    cloud, public_id, ext = m.groups()
    return {"cloud": cloud, "public_id": public_id, "ext": ext or "jpg"}


def fetch(url, retries=3):
    last = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "drplant-image-tool/1.0"})
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.status, r.read()
        except urllib.error.HTTPError as e:
            return e.code, b""
        except Exception as e:  # network hiccup: retry
            last = e
            time.sleep(1.5 * (attempt + 1))
    return 0, str(last).encode()


def check_image(data):
    """Returns (width, height) if the bytes are a complete, decodable image, else None."""
    try:
        with Image.open(io.BytesIO(data)) as im:
            im.load()
            return im.size
    except Exception:
        return None


def sha(data):
    return hashlib.sha256(data).hexdigest()


# ------------------------------------------------------------------ backup
def cmd_backup(_args):
    rows = db_urls()
    stamp = datetime.date.today().isoformat()
    print(f"{len(rows)} image URLs in the database")

    def work(row):
        info = parse(row["url"])
        status, data = fetch(row["url"])
        entry = {**row, "http": status, "bytes": len(data), "ok": False}
        if status != 200:
            return entry
        dims = check_image(data)
        if not dims:
            entry["problem"] = "not a decodable image"
            return entry
        rel = os.path.join(info["cloud"], *info["public_id"].split("/")) + "." + info["ext"] if info else os.path.join("other", sha(data) + ".bin")
        path = os.path.join(BACKUP_DIR, rel)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "wb") as f:
            f.write(data)
        entry.update({"ok": True, "file": os.path.relpath(path, ROOT), "sha256": sha(data), "width": dims[0], "height": dims[1]})
        return entry

    with cf.ThreadPoolExecutor(8) as pool:
        results = list(pool.map(work, rows))

    os.makedirs(BACKUP_DIR, exist_ok=True)
    manifest = os.path.join(BACKUP_DIR, f"manifest-{stamp}.json")
    json.dump(results, open(manifest, "w", encoding="utf-8"), indent=1, ensure_ascii=False)

    good = [r for r in results if r["ok"]]
    bad = [r for r in results if not r["ok"]]
    size = sum(r["bytes"] for r in good) / 1048576
    print(f"downloaded and verified: {len(good)}/{len(results)}  ({size:.1f} MB)")
    by_cloud = {}
    for r in good:
        by_cloud[parse(r['url'])['cloud']] = by_cloud.get(parse(r['url'])['cloud'], 0) + 1
    print("per cloud:", by_cloud)
    if bad:
        print(f"PROBLEMS ({len(bad)}):")
        for r in bad[:20]:
            print(f"  {r['table']}#{r['id']}  http={r['http']}  {r.get('problem', '')}  {r['url']}")
    print("manifest:", os.path.relpath(manifest, ROOT))
    return 0 if not bad else 1


# ------------------------------------------------------------------ migrate
def sign(params, secret):
    to_sign = "&".join(f"{k}={v}" for k, v in sorted(params.items())) + secret
    return hashlib.sha1(to_sign.encode()).hexdigest()


def upload(cloud, key, secret, public_id, data, filename):
    ts = str(int(time.time()))
    params = {"overwrite": "true", "public_id": public_id, "timestamp": ts}
    fields = {**params, "api_key": key, "signature": sign(params, secret)}
    boundary = uuid.uuid4().hex
    body = b""
    for k, v in fields.items():
        body += f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode()
    body += f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="{filename}"\r\nContent-Type: application/octet-stream\r\n\r\n'.encode() + data + b"\r\n"
    body += f"--{boundary}--\r\n".encode()
    req = urllib.request.Request(f"https://api.cloudinary.com/v1_1/{cloud}/image/upload", data=body,
                                 headers={"Content-Type": f"multipart/form-data; boundary={boundary}"})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"upload failed HTTP {e.code}: {e.read().decode()[:200]}")


def cmd_migrate(args):
    cloud, key, secret = secrets()
    rows = [r for r in db_urls() if (parse(r["url"]) or {}).get("cloud") not in (None, cloud)]
    print(f"own account: {cloud}")
    print(f"{len(rows)} images live on another account")
    if not rows:
        return 0

    mapping, failures = {}, []
    for row in rows:
        info = parse(row["url"])
        # keep the original name so it stays recognisable: crops/Potatoes_kls7ka
        folder = "crops" if row["table"] == "crops" else row["table"]
        new_public_id = f"{folder}/{info['public_id'].split('/')[-1]}"
        label = f"{row['table']}#{row['id']} {new_public_id}"

        status, data = fetch(row["url"])
        dims = check_image(data) if status == 200 else None
        if not dims:
            print(f"  SKIP {label}: cannot read the original (http {status})")
            failures.append(row)
            continue
        if args.dry_run:
            print(f"  would copy {label}  ({len(data)//1024} KB, {dims[0]}x{dims[1]})")
            continue

        try:
            res = upload(cloud, key, secret, new_public_id, data, os.path.basename(new_public_id))
            new_url = res["secure_url"]
            status2, data2 = fetch(new_url)
            if status2 != 200:
                raise RuntimeError(f"new copy not reachable (http {status2})")
            if sha(data2) == sha(data):
                verdict = "identical bytes"
            elif check_image(data2) == dims:
                verdict = "same pixels size (re-encoded)"
            else:
                raise RuntimeError("the copy differs from the original")
        except Exception as e:
            print(f"  FAILED {label}: {e}")
            failures.append(row)
            continue

        # the database row is updated only after the copy has been verified
        safe_url = new_url.replace("'", "''")
        sql(f"update {row['table']} set ImageUrl='{safe_url}' where {row['pk']}={row['id']} and ImageUrl='{row['url'].replace(chr(39), chr(39)*2)}'")
        mapping[row["url"]] = new_url
        print(f"  ok   {label}: {verdict}")

    if not args.dry_run:
        out = os.path.join(BACKUP_DIR, "migration-mapping.json")
        os.makedirs(BACKUP_DIR, exist_ok=True)
        json.dump(mapping, open(out, "w", encoding="utf-8"), indent=1)
        print(f"\nmoved {len(mapping)}/{len(rows)}; mapping saved to {os.path.relpath(out, ROOT)}")
    if failures:
        print(f"NOT MOVED: {len(failures)} (their old URLs were left untouched and still work)")
    return 0 if not failures else 1


# ------------------------------------------------------------------ seed
def cmd_seed(_args):
    path = os.path.join(BACKUP_DIR, "migration-mapping.json")
    if not os.path.exists(path):
        sys.exit("run `migrate` first (no migration-mapping.json)")
    mapping = json.load(open(path, encoding="utf-8"))
    raw = open(SEED_FILE, encoding="utf-8", newline="").read()
    n = 0
    for old, new in mapping.items():
        n += raw.count(old)
        raw = raw.replace(old, new)
    open(SEED_FILE, "w", encoding="utf-8", newline="").write(raw)
    print(f"rewrote {n} URL(s) in {os.path.relpath(SEED_FILE, ROOT)}")
    return 0


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("backup")
    m = sub.add_parser("migrate")
    m.add_argument("--dry-run", action="store_true")
    sub.add_parser("seed")
    a = ap.parse_args()
    sys.exit({"backup": cmd_backup, "migrate": cmd_migrate, "seed": cmd_seed}[a.cmd](a))
