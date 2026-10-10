import re, json, pathlib, subprocess, concurrent.futures
root = pathlib.Path(__file__).resolve().parents[1]
out = root / 'public/assets'
out.mkdir(parents=True, exist_ok=True)
manifest = {}
jobs = []
for page in ['landing', 'contact']:
    code = (root / f'design-reference/{page}.tsx').read_text(encoding='utf-8')
    manifest[page] = {}
    for name, url in re.findall(r'const (\w+) = "(https:[^"]+)";', code):
        filename = page + '-' + name[3:] + '.' + url.rsplit('.',1)[-1]
        manifest[page][name] = '/assets/' + filename
        jobs.append((url, out / filename))
def download(job):
    url, path = job
    if not path.exists() or path.stat().st_size == 0:
        subprocess.run(['curl.exe', '-fLsS', '--retry', '3', url, '-o', str(path)], check=True)
    if path.stat().st_size == 0:
        raise RuntimeError(f'Empty asset: {url}')
    return path.name
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
    results = list(pool.map(download, jobs))
(root / 'src').mkdir(exist_ok=True)
(root / 'src/assets.json').write_text(json.dumps(manifest, indent=2))
code = (root / 'design-reference/landing.tsx').read_text(encoding='utf-8')
texts = dict(re.findall(r'<p[^>]*data-node-id="([^"]+)"[^>]*>\s*([^<{}]+?)\s*</p>', code))
(root / 'src/copy.json').write_text(json.dumps(texts,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'Downloaded {len(results)} original Figma assets.')
