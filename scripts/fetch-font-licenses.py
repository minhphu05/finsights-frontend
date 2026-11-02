from pathlib import Path
from urllib.request import urlopen
out=Path('public/fonts')
for family in ['bevietnampro','lora']:
    text=urlopen(f'https://raw.githubusercontent.com/google/fonts/main/ofl/{family}/OFL.txt',timeout=30).read()
    (out/f'{family}-OFL.txt').write_bytes(text)
    print(f'{family}: license saved')
