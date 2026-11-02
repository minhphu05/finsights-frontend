from pathlib import Path
import re

p=Path('components/market.tsx')
s=p.read_text(encoding='utf-8')
start=s.index('function PriceChart(')
end=s.index('export default function Market(', start)
s=s[:start]+s[end:]
s=s.replace("import { useWatch, CompanyMark, WatchButton } from './shell';", "import { useWatch, CompanyMark, WatchButton } from './shell';\nimport PriceChart from './price-chart';")
s=s.replace("useState, useMemo, useEffect", "useState, useEffect")
s=s.replace('<select value={sector}', '<select aria-label="Ngành" value={sector}')
s=s.replace('<select value={exchange}', '<select aria-label="Sàn giao dịch" value={exchange}')
p.write_text(s,encoding='utf-8')

p=Path('components/news.tsx')
s=p.read_text(encoding='utf-8').replace('<select value={ticker}', '<select aria-label="Lọc tin theo cổ phiếu" value={ticker}')
p.write_text(s,encoding='utf-8')

p=Path('app/globals.css')
s=p.read_text(encoding='utf-8')
s=s.replace('--muted:#68776d','--muted:#596b5c').replace('--down:#bb5148','--down:#af473f')
s=s.replace('letter-spacing:-.06em','letter-spacing:-.04em').replace('letter-spacing:-.05em','letter-spacing:-.04em')
secondary={'#7b877c','#788478','#7f8c7c','#758273','#697961','#7a8974','#58694f','#809076','#5d7354','#68775e','#526747','#6f7c66','#657858','#65745b','#718364','#718074','#819174','#738168','#819074','#75806a','#78856b','#718267','#6d805f','#6c8059','#738168','#6c805b','#8b9a7f','#87957c','#719477'}
def contrast_color(match):
    value=match.group(2)
    return match.group(1)+('#53664f' if value.lower() in secondary else value)
s=re.sub(r'((?<![-\w])(?:color|fill):)(#[0-9a-fA-F]{6})',contrast_color,s)
p.write_text(s,encoding='utf-8')
