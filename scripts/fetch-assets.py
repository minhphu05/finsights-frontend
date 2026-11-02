from pathlib import Path
import concurrent.futures
import re
import urllib.request

root = Path(__file__).resolve().parents[1] / 'public'
(root / 'fonts').mkdir(parents=True, exist_ok=True)
(root / 'images').mkdir(parents=True, exist_ok=True)
agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

def fetch(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': agent}), timeout=60).read()

css = fetch('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Lora:wght@400;500;600&display=swap').decode()
font_urls = list(dict.fromkeys(re.findall(r'url\((https://[^)]+)\)', css)))
for i, url in enumerate(font_urls):
    ext = '.woff2' if '.woff2' in url else '.woff'
    filename = f'font-{i}{ext}'
    (root / 'fonts' / filename).write_bytes(fetch(url))
    css = css.replace(url, '/fonts/' + filename)
(root / 'fonts' / 'fonts.css').write_text(css, encoding='utf-8')

images = {
    'city.jpg': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1300&q=85',
    'office.jpg': 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1000&q=85',
    'building.jpg': 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1000&q=85',
    'desk.jpg': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1000&q=85',
}
def save_image(item):
    filename, url = item
    content = fetch(url)
    (root / 'images' / filename).write_bytes(content)
    return filename, len(content)
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    for name, size in pool.map(save_image, images.items()):
        print(f'{name}: {size} bytes')
print(f'Fonts: {len(font_urls)} local files')
