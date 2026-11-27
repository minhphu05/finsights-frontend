'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { KeyRound, LogOut, PanelLeftClose, PanelLeftOpen, ScrollText, SearchCheck, ShieldCheck } from 'lucide-react';
import { useAdminSession } from '@/components/admin-auth';
import AdminManagementDialog from '@/components/admin-management-dialog';
import { Brand } from '@/components/shell';
import AgentBenchmark from '@/components/admin/agent-benchmark';
import ApiKeys from '@/components/admin/api-keys';
import RetrievalBenchmark from '@/components/admin/retrieval-benchmark';
import TraceLogs from '@/components/admin/trace-logs';

// The fox head drawn as a mask, so it takes the tab's text colour like the other icons.
function FoxIcon({ size = 16 }: { size?: number; strokeWidth?: number }) {
  return <span aria-hidden="true" className="inline-block shrink-0 bg-current [mask:url(/finsights-fox-head.svg)_center/contain_no-repeat]" style={{ width: size, height: size }} />;
}

const TABS = [
  { id: 'trace', label: 'Trace log', icon: ScrollText, view: TraceLogs },
  { id: 'retrieval', label: 'Benchmark truy xuất', icon: SearchCheck, view: RetrievalBenchmark },
  { id: 'agent', label: 'Benchmark agent', icon: FoxIcon, view: AgentBenchmark },
  { id: 'keys', label: 'API key', icon: KeyRound, view: ApiKeys },
] as const;
type TabId = (typeof TABS)[number]['id'];

export default function AdminConsole() {
  const { admin, signOut } = useAdminSession();
  const [tab, setTab] = useState<TabId>('trace');
  const [visited, setVisited] = useState<TabId[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);

  // The tab lives in the URL hash so reload and shared links keep it.
  useEffect(() => {
    const sync = () => {
      const hash = window.location.hash.slice(1);
      if (TABS.some((item) => item.id === hash)) setTab(hash as TabId);
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  useEffect(() => { setVisited((list) => (list.includes(tab) ? list : [...list, tab])); }, [tab]);

  function open(id: TabId) {
    setTab(id);
    window.history.replaceState(null, '', `#${id}`);
  }

  const item = (active: boolean) => `flex items-center gap-3 rounded-xs px-3 py-2.5 text-left text-xs transition-colors ${active ? 'bg-foreground/10 font-medium text-foreground' : 'text-foreground/70 hover:bg-foreground/5 hover:text-foreground'}`;
  const iconButton = 'grid size-10 shrink-0 place-items-center rounded-xs text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground';

  return (
    <div data-home data-admin className="h-dvh overflow-hidden bg-background font-sans text-foreground selection:bg-foreground selection:text-background [&_:focus-visible]:outline-2 [&_:focus-visible]:outline-offset-1 [&_:focus-visible]:outline-foreground motion-reduce:[&_*]:transition-none">
      <div className={`grid h-full grid-cols-1 grid-rows-[auto_minmax(0,1fr)] transition-[grid-template-columns] duration-200 lg:grid-rows-1 ${sidebarOpen ? 'lg:grid-cols-[272px_minmax(0,1fr)]' : 'lg:grid-cols-[64px_minmax(0,1fr)]'}`}>
        <div className="min-w-0 border-b border-foreground/20 lg:hidden">
          <div className="flex items-center justify-between px-5 py-3">
            <Link href="/" aria-label="Finsight — Trang chủ"><Brand height={32} /></Link>
            <div className="flex">
              <button type="button" className={iconButton} onClick={() => setAdminDialogOpen(true)} aria-label="Quản trị viên"><ShieldCheck size={18} strokeWidth={1.5} /></button>
              <button type="button" className={iconButton} onClick={signOut} aria-label="Đăng xuất admin"><LogOut size={18} strokeWidth={1.5} /></button>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-2" aria-label="Mục quản trị" data-lenis-prevent>
            {TABS.map(({ id, label }) => <button key={id} type="button" className={`${item(tab === id)} shrink-0 whitespace-nowrap`} onClick={() => open(id)} aria-current={tab === id ? 'page' : undefined}>{label}</button>)}
          </nav>
        </div>

        <aside className="hidden min-h-0 overflow-hidden border-r border-foreground/20 lg:block" aria-label="Thanh bên quản trị">
          <div className={`flex h-full flex-col ${sidebarOpen ? 'w-[272px]' : 'w-16 items-center'}`}>
            {sidebarOpen ? (
              <div className="flex items-center justify-between px-5 pt-6">
                <Link href="/" aria-label="Finsight — Trang chủ"><Brand height={38} /></Link>
                <button type="button" className={iconButton} onClick={() => setSidebarOpen(false)} aria-label="Đóng thanh bên"><PanelLeftClose size={18} strokeWidth={1.5} /></button>
              </div>
            ) : (
              <button type="button" className={`${iconButton} group relative mt-6`} onClick={() => setSidebarOpen(true)} aria-label="Mở thanh bên">
                <span className="transition-opacity group-hover:opacity-0 group-focus-visible:opacity-0"><span className="logo-f" style={{ height: 34, width: 34 }} aria-hidden="true" /></span>
                <PanelLeftOpen size={20} strokeWidth={1.5} className="absolute opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
              </button>
            )}
            {sidebarOpen && <p className="mt-7 mb-2 px-5 text-[11px] text-foreground/60">Quản trị hệ thống</p>}
            <nav className={`min-h-0 flex-1 space-y-1 overflow-y-auto ${sidebarOpen ? 'px-2' : 'mt-3'}`} aria-label="Mục quản trị" data-lenis-prevent>
              {TABS.map(({ id, label, icon: Icon }) => sidebarOpen
                ? <button key={id} type="button" className={`${item(tab === id)} w-full`} onClick={() => open(id)} aria-current={tab === id ? 'page' : undefined}><Icon size={16} strokeWidth={1.5} />{label}</button>
                : <button key={id} type="button" className={`${iconButton} ${tab === id ? 'bg-foreground/10 text-foreground' : ''}`} onClick={() => open(id)} aria-current={tab === id ? 'page' : undefined} aria-label={label} title={label}><Icon size={18} strokeWidth={1.5} /></button>)}
            </nav>
            {sidebarOpen ? (
              <div className="border-t border-foreground/20 p-2">
                <button type="button" className={`${item(false)} w-full`} onClick={() => setAdminDialogOpen(true)}><ShieldCheck size={16} strokeWidth={1.5} />Quản trị viên</button>
                <div className="flex items-center gap-3 py-1 pl-3">
                  <span className="min-w-0 flex-1 truncate text-xs" title={admin.username}>{admin.username}</span>
                  <button type="button" className={iconButton} onClick={signOut} aria-label="Đăng xuất admin" title="Đăng xuất"><LogOut size={16} strokeWidth={1.5} /></button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 pb-3">
                <button type="button" className={iconButton} onClick={() => setAdminDialogOpen(true)} aria-label="Quản trị viên" title="Quản trị viên"><ShieldCheck size={18} strokeWidth={1.5} /></button>
                <button type="button" className={iconButton} onClick={signOut} aria-label="Đăng xuất admin" title="Đăng xuất"><LogOut size={18} strokeWidth={1.5} /></button>
              </div>
            )}
          </div>
        </aside>

        <main className="min-h-0 min-w-0 overflow-y-auto supports-[-moz-appearance:none]:[scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-foreground/25 [&::-webkit-scrollbar-thumb:hover]:bg-foreground/40 [&::-webkit-scrollbar-track]:bg-transparent" data-lenis-prevent>
          {/* A tab mounts on first visit (the key tab calls paid health checks) and then stays, so filters and uploads survive switching. */}
          {TABS.filter(({ id }) => visited.includes(id)).map(({ id, view: View }) => <div key={id} hidden={tab !== id} className="mx-auto w-full max-w-[1320px] px-5 py-8 sm:px-8"><View /></div>)}
        </main>
      </div>
      {adminDialogOpen && <AdminManagementDialog onClose={() => setAdminDialogOpen(false)} />}
    </div>
  );
}
