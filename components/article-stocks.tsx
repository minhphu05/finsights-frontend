'use client';

import Link from 'next/link';
import { ArrowUpRight } from '@/components/icons';
import { number, signed } from '@/lib/data';
import { WatchButton, useAppData } from '@/components/shell';

/** Stocks named by an article, with live prices from the app data. */
export default function ArticleStocks({ tickers }: { tickers: string[] }) {
  const { stocks } = useAppData();
  const relatedStocks = stocks.filter((stock) => tickers.includes(stock.symbol));
  return (
    <>
      {relatedStocks.map((stock) => <div className="article-company" key={stock.symbol}><Link href={`/?ma=${stock.symbol}`}><strong>{stock.symbol}</strong><span className="ml-3 text-xs text-foreground/65">{number(stock.price)} · {signed(stock.change)}%</span><ArrowUpRight size={16} /></Link><WatchButton symbol={stock.symbol} /></div>)}
      {tickers.map((symbol) => !relatedStocks.some((stock) => stock.symbol === symbol) && <div className="article-company" key={symbol}><Link href={`/?ma=${symbol}`}><strong>{symbol}</strong><ArrowUpRight size={16} /></Link><WatchButton symbol={symbol} /></div>)}
    </>
  );
}
