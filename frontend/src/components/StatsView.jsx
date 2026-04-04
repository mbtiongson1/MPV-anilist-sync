import { animeList } from '../store';
import { genreColors } from '../utils';

export function StatsView() {
    const watchedList = animeList.value.filter(a => {
        if (a.genres && a.genres.some(g => ['Ecchi', 'Hentai', 'Adult'].includes(g))) return false;
        if (a.isAdult) return false;
        return a.listStatus === 'COMPLETED' || (a.progress || 0) > 0;
    });

    let totalAnime = watchedList.length;
    let totalEps = 0, scoreSum = 0, scoreCount = 0;
    let genres = {};
    let dailyActivity = {};

    watchedList.forEach(a => {
        totalEps += a.progress || 0;
        let s = 0;
        if (a.score && a.score > 0) s = a.score > 10 ? a.score : a.score * 10;
        if (s > 0) { scoreSum += s; scoreCount++; }
        if (a.genres) a.genres.forEach(g => { genres[g] = (genres[g] || 0) + 1; });
        if (a.updatedAt) {
            const date = new Date(a.updatedAt * 1000);
            date.setHours(0, 0, 0, 0);
            dailyActivity[date.getTime()] = (dailyActivity[date.getTime()] || 0) + 1;
        }
    });

    const weeklyActivity = [0, 0, 0, 0, 0, 0, 0];
    Object.entries(dailyActivity).forEach(([ts, count]) => {
        weeklyActivity[new Date(parseInt(ts)).getDay()] += count;
    });

    const meanScore = scoreCount > 0 ? (scoreSum / scoreCount).toFixed(1) : 0;
    const daysWatched = (totalEps * 24 / 60 / 24).toFixed(1);

    const allSortedGenres = Object.entries(genres).sort((a, b) => b[1] - a[1]);
    let sortedGenres = allSortedGenres.slice(0, 9);
    const othersSum = allSortedGenres.slice(9).reduce((sum, g) => sum + g[1], 0);
    if (othersSum > 0) sortedGenres.push(['Others', othersSum]);
    const totalGenreCount = Object.values(genres).reduce((a, b) => a + b, 0);

    const summaryCards = [
        { label: 'Total Anime', value: totalAnime },
        { label: 'Episodes', value: totalEps },
        { label: 'Days Watched', value: daysWatched },
        { label: 'Mean Score', value: meanScore },
    ];

    return (
        <div id="anime-grid" class="anime-grid stats-view">
            {/* Summary */}
            <div class="stats-card" style="grid-column: 1 / -1; background: var(--bg-card); padding: 24px; border-radius: 12px; border: 1px solid var(--border); box-shadow: var(--shadow-card);">
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;">
                    {summaryCards.map(c => (
                        <div key={c.label} style="text-align: center;">
                            <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 8px;">{c.label}</div>
                            <div style="font-size: 32px; color: var(--accent); font-weight: 800;">{c.value}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Genre Overview */}
            {sortedGenres.length > 0 && (
                <div class="genre-overview-card">
                    <h3 class="genre-overview-title">Genre Overview</h3>
                    <div class="genre-chips" style="grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); display: grid; gap: 12px;">
                        {sortedGenres.map(([genre, count]) => {
                            const color = genreColors[genre] || '#10B981';
                            return (
                                <div key={genre} class="genre-item">
                                    <div class="genre-chip" style={`background: ${color}; font-size: 14px; padding: 8px 12px;`}>{genre}</div>
                                    <div class="genre-info">
                                        <span class="genre-count" style={`color: ${color}; font-size: 14px;`}>{count}</span> Entries
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div class="genre-distribution-wrapper">
                        <div class="genre-distribution-bar">
                            {sortedGenres.map(([genre, count]) => {
                                const color = genreColors[genre] || '#9CA3AF';
                                const pct = (count / sortedGenres.reduce((s, g) => s + g[1], 0)) * 100;
                                return <div key={genre} class="genre-dist-segment" style={`width: ${pct}%; background: ${color};`} title={`${genre}: ${count}`} />;
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Pareto Chart */}
            <div class="stats-card" style="grid-column: 1 / -1; background: var(--bg-card); padding: 24px; border-radius: 12px; border: 1px solid var(--border); box-shadow: var(--shadow-card);">
                <h3 style="margin-bottom: 24px; font-size: 16px; font-weight: 700; color: var(--text-primary); border-left: 3px solid var(--accent); padding-left: 12px; line-height: 1;">Genre Distribution (Pareto)</h3>
                <div style="width: 100%;">
                    {sortedGenres.length > 0 ? <ParetoChart genres={sortedGenres} totalCount={totalGenreCount} /> : <div style="color: var(--text-muted); text-align: center; padding: 40px 0;">No genre data available</div>}
                </div>
            </div>

            {/* Heatmap */}
            <div class="stats-card" style="grid-column: 1 / -1; background: var(--bg-card); padding: 24px; border-radius: 12px; border: 1px solid var(--border); box-shadow: var(--shadow-card);">
                <h3 style="margin-bottom: 24px; font-size: 16px; font-weight: 700; color: var(--text-primary); border-left: 3px solid var(--accent); padding-left: 12px; line-height: 1;">Activity Heatmap (Updates)</h3>
                <Heatmap dailyActivity={dailyActivity} />
            </div>

            {/* Weekly */}
            <div class="stats-card" style="grid-column: 1 / -1; background: var(--bg-card); padding: 24px; border-radius: 12px; border: 1px solid var(--border); box-shadow: var(--shadow-card);">
                <h3 style="margin-bottom: 24px; font-size: 16px; font-weight: 700; color: var(--text-primary); border-left: 3px solid var(--accent); padding-left: 12px; line-height: 1;">Weekly Watch Distribution</h3>
                <WeeklyChart weeklyActivity={weeklyActivity} />
            </div>
        </div>
    );
}

function ParetoChart({ genres, totalCount }) {
    const W = 900, H = 400;
    const M = { top: 40, right: 80, bottom: 90, left: 60 };
    const cW = W - M.left - M.right, cH = H - M.top - M.bottom;
    const maxCount = Math.max(...genres.map(g => g[1]), 1);
    const barWidth = cW / genres.length;

    let cumulative = 0;
    const bars = [];
    const points = [];

    genres.forEach(([genre, count], i) => {
        const x = i * barWidth;
        const barH = (count / maxCount) * cH;
        cumulative += count;
        const pct = (cumulative / totalCount) * 100;
        const cy = cH - (pct / 100) * cH;
        points.push([x + barWidth / 2, cy]);
        const color = genreColors[genre] || '#10B981';
        bars.push({ x, barH, color, genre, count, pct: ((count / totalCount) * 100).toFixed(1) });
    });

    const gridLines = [];
    const axisTicks = [];
    for (let i = 0; i <= 5; i++) {
        const y = cH - (i / 5) * cH;
        gridLines.push(<line key={`g${i}`} x1="0" y1={y} x2={cW} y2={y} stroke="var(--border-light)" strokeWidth="1" strokeDasharray="3,3" />);
        axisTicks.push(<text key={`l${i}`} x="-10" y={y + 4} fontSize="12" fill="var(--text-muted)" textAnchor="end">{Math.round((i / 5) * maxCount)}</text>);
        axisTicks.push(<text key={`r${i}`} x={cW + 10} y={y + 4} fontSize="12" fill="#FBBF24" textAnchor="start">{i * 20}%</text>);
    }

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]},${p[1]}`).join(' ');

    return (
        <svg viewBox={`0 0 ${W} ${H}`} style="width: 100%; height: auto; overflow: visible; font-family: inherit;">
            <g transform={`translate(${M.left}, ${M.top})`}>
                {gridLines}
                <line x1="0" y1={cH} x2={cW} y2={cH} stroke="var(--border)" strokeWidth="1.5" />
                <line x1="0" y1="0" x2="0" y2={cH} stroke="var(--border)" strokeWidth="1.5" />
                <line x1={cW} y1="0" x2={cW} y2={cH} stroke="var(--border)" strokeWidth="1.5" />
                {axisTicks}
                {bars.map((b, i) => (
                    <g key={i}>
                        <rect x={b.x + 8} y={cH - b.barH} width={barWidth - 16} height={b.barH} fill={b.color} opacity="0.8" rx="4"><title>{b.genre}: {b.count} ({b.pct}%)</title></rect>
                        <text x={b.x + barWidth / 2} y={cH + 20} fontSize="13" fill="var(--text-secondary)" textAnchor="end" transform={`rotate(-35, ${b.x + barWidth / 2}, ${cH + 20})`} fontWeight="600">{b.genre}</text>
                    </g>
                ))}
                <path d={linePath} fill="none" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                {points.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="5" fill="#FBBF24" stroke="var(--bg-card)" strokeWidth="2" />)}
                <g transform="translate(0, -25)">
                    <rect width="5" height="14" fill="#84cc16" rx="1" />
                    <rect x="6" width="5" height="14" fill="#0ea5e9" rx="1" />
                    <rect x="12" width="5" height="14" fill="#a855f7" rx="1" />
                    <text x="25" y="11" fontSize="12" fill="var(--text-primary)" fontWeight="600">Genre Frequency</text>
                    <line x1="150" y1="7" x2="185" y2="7" stroke="#FBBF24" strokeWidth="3" />
                    <text x="195" y="11" fontSize="12" fill="var(--text-primary)" fontWeight="600">Cumulative Coverage (%)</text>
                </g>
            </g>
        </svg>
    );
}

function Heatmap({ dailyActivity }) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const cellSize = 12, cellGap = 3;
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (52 * 7 + today.getDay()));

    const cells = [], months = [];
    let lastMonth = -1;

    for (let w = 0; w <= 52; w++) {
        for (let d = 0; d < 7; d++) {
            const current = new Date(startDate);
            current.setDate(startDate.getDate() + (w * 7 + d));
            if (current > today) break;
            const ts = new Date(current); ts.setHours(0, 0, 0, 0);
            const count = dailyActivity[ts.getTime()] || 0;
            if (d === 0) {
                const m = current.getMonth();
                if (m !== lastMonth) {
                    months.push(<text key={`m${w}`} x={w * (cellSize + cellGap)} y="-5" fontSize="10" fill="var(--text-muted)">{current.toLocaleString('default', { month: 'short' })}</text>);
                    lastMonth = m;
                }
            }
            let color = 'rgba(255,255,255,0.05)';
            if (count > 0) color = 'rgba(16,185,129,0.2)';
            if (count > 1) color = 'rgba(16,185,129,0.5)';
            if (count > 2) color = 'rgba(16,185,129,0.8)';
            if (count > 4) color = 'var(--accent)';
            cells.push(<rect key={`${w}-${d}`} x={w * (cellSize + cellGap)} y={d * (cellSize + cellGap)} width={cellSize} height={cellSize} fill={color} rx="2"><title>{current.toDateString()}: {count} updates</title></rect>);
        }
    }

    return (
        <div style="overflow-x: auto; width: 100%; padding-bottom: 15px;">
            <svg viewBox="0 0 800 130" style="width: 100%; min-width: 750px; height: auto; overflow: visible;">
                <g transform="translate(30, 20)">
                    {cells}{months}
                    <text x="-25" y="10" fontSize="9" fill="var(--text-muted)">Mon</text>
                    <text x="-25" y="40" fontSize="9" fill="var(--text-muted)">Wed</text>
                    <text x="-25" y="70" fontSize="9" fill="var(--text-muted)">Fri</text>
                    <text x="-25" y="100" fontSize="9" fill="var(--text-muted)">Sun</text>
                </g>
            </svg>
        </div>
    );
}

function WeeklyChart({ weeklyActivity }) {
    const maxWeekly = Math.max(...weeklyActivity, 1);
    const BLOCK_ROWS = 8, BLOCK_SIZE = 18, BLOCK_GAP = 4, COL_GAP = 14;
    const colWidth = BLOCK_SIZE + COL_GAP;
    const ordered = [1, 2, 3, 4, 5, 6, 0];
    const orderedNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const svgW = ordered.length * colWidth - COL_GAP + 60;
    const svgH = BLOCK_ROWS * (BLOCK_SIZE + BLOCK_GAP) + 50;

    const legendItems = [
        { fill: 'rgba(255,255,255,0.05)', label: 'None' },
        { fill: 'rgba(16,185,129,0.25)', label: 'Low' },
        { fill: 'rgba(16,185,129,0.55)', label: 'Mid' },
        { fill: 'var(--accent)', label: 'High' },
    ];
    const legendX = ordered.length * colWidth + 8;

    return (
        <div style="overflow-x: auto; width: 100%;">
            <svg viewBox={`0 0 ${svgW} ${svgH}`} style={`overflow: visible; height: auto; min-width: ${svgW}px; max-width: 500px; display: block;`}>
                <g transform="translate(10, 24)">
                    {ordered.map((dowIdx, colI) => {
                        const count = weeklyActivity[dowIdx];
                        const ratio = count / maxWeekly;
                        const filledBlocks = Math.round(ratio * BLOCK_ROWS);
                        const x = colI * colWidth;
                        const blocks = [];
                        for (let row = 0; row < BLOCK_ROWS; row++) {
                            const blockIdx = BLOCK_ROWS - 1 - row;
                            const y = blockIdx * (BLOCK_SIZE + BLOCK_GAP);
                            const isFilled = row < filledBlocks;
                            let fill = 'rgba(255,255,255,0.05)';
                            if (isFilled) {
                                const r = (row + 1) / filledBlocks;
                                if (r <= 0.33) fill = 'rgba(16,185,129,0.25)';
                                else if (r <= 0.66) fill = 'rgba(16,185,129,0.55)';
                                else fill = 'var(--accent)';
                            }
                            blocks.push(<rect key={row} x={x} y={y} width={BLOCK_SIZE} height={BLOCK_SIZE} fill={fill} rx="3"><title>{orderedNames[colI]}: {count} update{count !== 1 ? 's' : ''}</title></rect>);
                        }
                        return (
                            <g key={colI}>
                                <text x={x + BLOCK_SIZE / 2} y="-8" fontSize="11" fill="var(--text-secondary)" textAnchor="middle" fontWeight="700">{count}</text>
                                {blocks}
                                <text x={x + BLOCK_SIZE / 2} y={BLOCK_ROWS * (BLOCK_SIZE + BLOCK_GAP) + 14} fontSize="11" fill={ratio > 0.5 ? 'var(--text-primary)' : 'var(--text-muted)'} textAnchor="middle" fontWeight={ratio > 0.5 ? '700' : '400'}>{orderedNames[colI]}</text>
                            </g>
                        );
                    })}
                    {legendItems.map((item, i) => (
                        <g key={i}>
                            <rect x={legendX} y={i * 28} width="14" height="14" fill={item.fill} rx="3" />
                            <text x={legendX + 20} y={i * 28 + 11} fontSize="10" fill="var(--text-muted)">{item.label}</text>
                        </g>
                    ))}
                </g>
            </svg>
        </div>
    );
}
