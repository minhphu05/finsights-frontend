'use client';

import { useState } from 'react';
import { Segmented, panel } from './ui';

// Drawn from finsights-ai-service: api/routes/sessions.py, graph/workflow.py,
// graph/nodes/agent.py and graph/nodes/verifier.py.
type Node = { id: string; x: number; y: number; title: string; sub: string; detail: string; file: string; end?: boolean };
type Edge = { d: string; label?: string; lx?: number; ly?: number; dashed?: boolean };
type Flow = { width: number; height: number; summary: string; nodes: Node[]; edges: Edge[] };
const W = 176;
const H = 58;

const FLOWS: Record<'turn' | 'graph' | 'loop' | 'verifier', Flow> = {
  turn: {
    width: 860, height: 330,
    summary: 'Toàn bộ một lượt chat, từ lúc request đến AI service tới khi lưu kết quả.',
    nodes: [
      { id: 'api', x: 20, y: 40, title: 'Nhận câu hỏi', sub: 'POST /sessions/…/messages', detail: 'Hai biến thể: trả JSON một lần, hoặc /stream phát sự kiện tiến độ. Câu trả lời không được stream từng phần vì verifier vẫn có thể loại nó.', file: 'app/api/routes/sessions.py' },
      { id: 'quota', x: 232, y: 40, title: 'Kiểm tra quota', sub: '5 giờ và theo tuần', detail: 'Hết một trong hai cửa sổ token thì trả 429. Mặc định 150.000 token / 5 giờ và 1.500.000 token / tuần.', file: 'app/storage/mysql/usage_store.py' },
      { id: 'compact', x: 444, y: 40, title: 'Nén lịch sử', sub: 'chỉ khi cần', detail: 'Gộp các lượt cũ thành bản tóm tắt trước khi chạy, phát sự kiện compacting. Nén lỗi thì ghi cảnh báo và chạy tiếp.', file: 'app/graph/compaction.py' },
      { id: 'run', x: 656, y: 40, title: 'Chạy workflow', sub: 'timeout 60 s', detail: 'Gọi run_agent: vòng lặp agent rồi verifier. Xem tab Workflow để biết chi tiết.', file: 'app/graph/workflow.py' },
      { id: 'save', x: 656, y: 230, title: 'Lưu lượt hỏi', sub: 'complete hoặc failed', detail: 'Lưu câu hỏi, câu trả lời, model, token và ai_trace (tool_calls, verified, unsupported, latency_ms, cache_read_tokens). Lượt lỗi cũng được lưu kèm error_code.', file: 'app/storage/mysql/chat_store.py' },
      { id: 'charge', x: 444, y: 230, title: 'Trừ quota', sub: 'kể cả khi lỗi', detail: 'Token tính phí = input mới + output + 1/10 token đọc từ cache. Lượt lỗi hoặc bị hủy vẫn bị tính.', file: 'app/api/routes/sessions.py' },
      { id: 'reply', x: 232, y: 230, title: 'Trả kết quả', sub: 'answer + verified', detail: 'Trả answer, tool_calls, verified, unsupported. Lỗi: 504 timeout, 502 no_answer hoặc provider_error.', file: 'app/api/routes/sessions.py', end: true },
    ],
    edges: [
      { d: 'M196 69H230' }, { d: 'M408 69H442' }, { d: 'M620 69H654' }, { d: 'M744 98V228' }, { d: 'M656 259H622' }, { d: 'M444 259H410' },
      { d: 'M320 98V228', label: '429', lx: 330, ly: 168, dashed: true },
    ],
  },
  graph: {
    width: 860, height: 270,
    summary: 'Đồ thị LangGraph: agent trả lời, verifier kiểm tra, sai thì gửi phản hồi để agent sửa.',
    nodes: [
      { id: 'start', x: 20, y: 80, title: 'START', sub: 'câu hỏi + lịch sử', detail: 'Câu hỏi được bọc trong thẻ untrusted_input kèm ngày hôm nay, để model coi đó là dữ liệu chứ không phải chỉ thị.', file: 'app/graph/nodes/agent.py', end: true },
      { id: 'agent', x: 242, y: 80, title: 'agent', sub: 'model + tools', detail: 'Một vòng lặp LangChain create_agent với prompt news_agent. Chạy đến khi model trả lời mà không gọi thêm tool.', file: 'app/graph/nodes/agent.py' },
      { id: 'verifier', x: 464, y: 80, title: 'verifier', sub: 'kiểm số và ngày', detail: 'Kiểm tra tất định, không dùng LLM: mọi con số và ngày tháng phải truy được về kết quả tool, câu hỏi hoặc lịch sử đã xác minh.', file: 'app/graph/nodes/verifier.py' },
      { id: 'end', x: 664, y: 80, title: 'END', sub: 'đạt hoặc hết lượt sửa', detail: 'Kết thúc khi đạt, hoặc khi đã dùng hết lượt sửa; trường hợp sau trả verified = false cùng danh sách unsupported.', file: 'app/graph/workflow.py', end: true },
    ],
    edges: [
      { d: 'M196 109H240' }, { d: 'M418 109H462' }, { d: 'M640 109H662' },
      { d: 'M552 138V206H330V140', label: 'không đạt: gửi verifier_feedback, tối đa 1 lần', lx: 441, ly: 226, dashed: true },
    ],
  },
  loop: {
    width: 860, height: 350,
    summary: 'Bên trong node agent: model chọn tool, nhận kết quả, lặp tới khi đủ dữ liệu.',
    nodes: [
      { id: 'model', x: 242, y: 60, title: 'Model', sub: 'tối đa 8 lần gọi', detail: 'ModelCallLimitMiddleware dừng cứng sau agent_max_steps (8) và báo lỗi, tránh vòng lặp vô hạn và tốn chi phí.', file: 'app/core/settings.py' },
      { id: 'answer', x: 594, y: 60, title: 'Câu trả lời', sub: 'không còn tool call', detail: 'Tin nhắn cuối phải là câu trả lời thuần của AI; nếu không sẽ ném AgentRunError.', file: 'app/graph/nodes/agent.py', end: true },
      { id: 'tools', x: 242, y: 210, title: 'Tool calls', sub: 'tối đa 6 lời gọi', detail: 'Vượt ngân sách (agent_max_tool_calls = 6) thì lời gọi nhận ToolMessage lỗi, model vẫn viết câu trả lời từ dữ liệu đã có.', file: 'app/graph/nodes/agent.py' },
      { id: 'search_news', x: 20, y: 150, title: 'search_news', sub: 'SQL LIKE', detail: 'Tìm tin đã xuất bản theo mã, từ khóa, khoảng ngày, nhà xuất bản; mới nhất trước.', file: 'app/tools/sql/search_news.py' },
      { id: 'get_news_article', x: 20, y: 240, title: 'get_news_article', sub: 'chi tiết một bài', detail: 'Lấy một bài viết cụ thể, ví dụ theo URL người dùng gửi.', file: 'app/tools/sql/get_news_article.py' },
      { id: 'count_news', x: 480, y: 180, title: 'count_news', sub: 'đếm, xếp hạng', detail: 'Đếm số bài theo bộ lọc, có thể nhóm theo mã hoặc nhà xuất bản.', file: 'app/tools/sql/count_news.py' },
      { id: 'resolve_security', x: 480, y: 270, title: 'resolve_security', sub: 'tên → mã', detail: 'Đổi tên doanh nghiệp thành mã chứng khoán trước khi tìm tin.', file: 'app/tools/sql/resolve_security.py' },
      { id: 'calculate', x: 670, y: 225, title: 'calculate', sub: 'phép tính tất định', detail: 'Tính tỷ lệ, chênh lệch. Verifier chỉ chấp nhận kết quả nếu mọi đầu vào đều có nguồn.', file: 'app/tools/calculator/calculate.py' },
    ],
    edges: [
      { d: 'M300 118V208', label: 'gọi tool', lx: 266, ly: 166 }, { d: 'M360 210V120', label: 'ToolMessage', lx: 404, ly: 166 }, { d: 'M418 89H592', label: 'đủ dữ liệu', lx: 505, ly: 78 },
      { d: 'M242 226L198 190', dashed: true }, { d: 'M242 250L198 265', dashed: true }, { d: 'M418 228L478 212', dashed: true }, { d: 'M418 252L478 292', dashed: true }, { d: 'M418 240H460V254H668', dashed: true },
    ],
  },
  verifier: {
    width: 860, height: 330,
    summary: 'Verifier dựng tập giá trị được phép từ nguồn, rồi đối chiếu với câu trả lời.',
    nodes: [
      { id: 'sources', x: 20, y: 40, title: 'Nguồn dữ liệu', sub: 'tool, câu hỏi, lịch sử', detail: 'Kết quả tool không lỗi (trừ calculate), câu hỏi của người dùng và các fact từ lượt trước đã được xác minh.', file: 'app/graph/nodes/verifier.py' },
      { id: 'calc', x: 20, y: 190, title: 'Phép tính', sub: 'đầu vào phải có nguồn', detail: 'Kết quả calculate chỉ được thêm vào tập hợp lệ khi biến và hằng số đều truy được nguồn, ngoài các hằng an toàn như 100 hay 12.', file: 'app/graph/nodes/verifier.py' },
      { id: 'allowed', x: 242, y: 115, title: 'Tập được phép', sub: 'số, ngày, ngày/tháng', detail: 'Gồm cả ngày hôm nay, năm của các ngày hợp lệ và số lượng bài viết trả về.', file: 'app/graph/nodes/verifier.py' },
      { id: 'match', x: 464, y: 115, title: 'Đối chiếu', sub: 'trích từ câu trả lời', detail: 'Chuẩn hóa số kiểu Việt và Anh. Giới hạn đã biết: không đổi đơn vị, không kiểm số có gắn đúng đối tượng, không kiểm mệnh đề bằng chữ.', file: 'app/graph/nodes/verifier.py' },
      { id: 'pass', x: 664, y: 40, title: 'Đạt', sub: 'verified = true', detail: 'Không còn giá trị thiếu nguồn và không có lỗi phép tính.', file: 'app/graph/nodes/verifier.py', end: true },
      { id: 'fail', x: 664, y: 190, title: 'Không đạt', sub: 'phản hồi để sửa', detail: 'Liệt kê số hoặc ngày thiếu nguồn và yêu cầu bỏ, lấy bằng tool, hoặc tính bằng calculate.', file: 'app/graph/nodes/verifier.py', end: true },
    ],
    edges: [
      { d: 'M196 69H219V132H240' }, { d: 'M196 219H219V156H240' }, { d: 'M418 144H462' }, { d: 'M640 132H652V69H662' }, { d: 'M640 156H652V219H662', dashed: true },
    ],
  },
};

const VIEWS = [['turn', 'Một lượt chat'], ['graph', 'Workflow'], ['loop', 'Vòng lặp tool'], ['verifier', 'Verifier']] as const;

export default function AgentFlows() {
  const [view, setView] = useState<keyof typeof FLOWS>('turn');
  const [picked, setPicked] = useState('');
  const flow = FLOWS[view];
  const node = flow.nodes.find((n) => n.id === picked) ?? flow.nodes[0];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <Segmented label="Sơ đồ" value={view} options={VIEWS} onChange={setView} />
        <p className="m-0 min-w-[240px] flex-1 text-xs leading-5 text-foreground/65">{flow.summary} Chọn một khối để xem chi tiết.</p>
      </div>
      <div className={`${panel} mt-4 overflow-x-auto p-4`}>
        <svg viewBox={`0 0 ${flow.width} ${flow.height}`} className="mx-auto block w-full max-w-[1080px] min-w-[760px] text-foreground" role="group" aria-label={flow.summary}>
          <defs><marker id="flow-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0L8 4L0 8Z" fill="currentColor" opacity="0.65" /></marker></defs>
          {flow.edges.map((edge) => (
            <g key={edge.d}>
              <path d={edge.d} fill="none" stroke="currentColor" strokeOpacity={0.5} strokeWidth={1.25} strokeDasharray={edge.dashed ? '5 4' : undefined} markerEnd="url(#flow-arrow)" />
              {edge.label && <text x={edge.lx} y={edge.ly} textAnchor="middle" fontSize={11} fill="currentColor" fillOpacity={0.75} stroke="var(--color-background)" strokeWidth={4} paintOrder="stroke">{edge.label}</text>}
            </g>
          ))}
          {flow.nodes.map((n) => {
            const on = n.id === node.id;
            return (
              <g key={n.id} role="button" tabIndex={0} aria-pressed={on} aria-label={`${n.title}: ${n.sub}`} className="group cursor-pointer outline-none" onClick={() => setPicked(n.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPicked(n.id); } }}>
                <rect x={n.x} y={n.y} width={W} height={H} rx={n.end ? H / 2 : 2} fill={on ? 'currentColor' : 'var(--color-background)'} stroke="currentColor" strokeOpacity={on ? 1 : 0.45} className="group-focus-visible:[stroke:var(--color-market-accent)] group-focus-visible:[stroke-width:3] group-hover:[stroke-opacity:1]" />
                <text x={n.x + W / 2} y={n.y + 25} textAnchor="middle" fontSize={13} fontWeight={500} fill={on ? 'var(--color-background)' : 'currentColor'}>{n.title}</text>
                <text x={n.x + W / 2} y={n.y + 43} textAnchor="middle" fontSize={11} fill={on ? 'var(--color-background)' : 'currentColor'} fillOpacity={on ? 0.85 : 0.65}>{n.sub}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className={`${panel} mt-3 p-5`} aria-live="polite">
        <div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="m-0 text-sm font-medium">{node.title}</h3><code className="font-mono text-[11px] text-foreground/60">{node.file}</code></div>
        <p className="mt-2 mb-0 max-w-[75ch] text-xs leading-6 text-foreground/80">{node.detail}</p>
      </div>
    </div>
  );
}
