"use client";

export default function Manager_Overview_Module({ stats }) {
    const winRate = stats.matches > 0 ? ((stats.wins / stats.matches) * 100).toFixed(1) : "0.0";
    const lossRate = stats.matches > 0 ? ((stats.losses / stats.matches) * 100).toFixed(1) : "0.0";
    const gfAverage = stats.matches > 0 ? (stats.gs / stats.matches).toFixed(2) : "0.00";
    const gaAverage = stats.matches > 0 ? (stats.ga / stats.matches).toFixed(2) : "0.00";

    return (
        <div className="mgr-overview-wrap fade-in">
            <div className="stats-grid-premium">
                <div className="stat-card-premium">
                    <span className="stat-label-modern">Matches Managed</span>
                    <div className="stat-value-modern" style={{ color: "var(--gold)" }}>{stats.matches}</div>
                </div>
                <div className="stat-card-premium">
                    <span className="stat-label-modern">Wins</span>
                    <div className="stat-value-modern" style={{ color: "#27ae60" }}>{stats.wins}</div>
                </div>
                <div className="stat-card-premium">
                    <span className="stat-label-modern">Win %</span>
                    <div className="stat-value-modern" style={{ color: "#2ecc71" }}>{winRate}%</div>
                </div>
                <div className="stat-card-premium">
                    <span className="stat-label-modern">Draws</span>
                    <div className="stat-value-modern" style={{ color: "#f39c12" }}>{stats.draws}</div>
                </div>
                <div className="stat-card-premium">
                    <span className="stat-label-modern">Losses</span>
                    <div className="stat-value-modern" style={{ color: "#e74c3c" }}>{stats.losses}</div>
                </div>
                <div className="stat-card-premium">
                    <span className="stat-label-modern">Loss %</span>
                    <div className="stat-value-modern" style={{ color: "#ff6b6b" }}>{lossRate}%</div>
                </div>
                <div className="stat-card-premium">
                    <span className="stat-label-modern">Goals For</span>
                    <div className="stat-value-modern" style={{ color: "#2ecc71" }}>{stats.gs}</div>
                </div>
                <div className="stat-card-premium">
                    <span className="stat-label-modern">GF Average</span>
                    <div className="stat-value-modern" style={{ color: "var(--gold)" }}>{gfAverage}</div>
                </div>
                <div className="stat-card-premium">
                    <span className="stat-label-modern">Goals Against</span>
                    <div className="stat-value-modern" style={{ color: "#e74c3c" }}>{stats.ga}</div>
                </div>
                <div className="stat-card-premium">
                    <span className="stat-label-modern">GA Average</span>
                    <div className="stat-value-modern" style={{ color: "#ff6b6b" }}>{gaAverage}</div>
                </div>
                <div className="stat-card-premium">
                    <span className="stat-label-modern">Clean Sheets For</span>
                    <div className="stat-value-modern" style={{ color: "#2ecc71" }}>{stats.csFor}</div>
                </div>
                <div className="stat-card-premium">
                    <span className="stat-label-modern">Clean Sheets Against</span>
                    <div className="stat-value-modern" style={{ color: "#e74c3c" }}>{stats.csAgainst}</div>
                </div>
            </div>

            <div className="mgr-overview-section-title">When Ahead (Goal Events)</div>
            <div className="stats-grid-premium mgr-overview-score-grid">
                <div className="stat-card-premium">
                    <span className="stat-label-modern">Ahead & Won</span>
                    <div className="stat-value-modern" style={{ color: "#27ae60" }}>{stats.aheadWin}</div>
                </div>
                <div className="stat-card-premium">
                    <span className="stat-label-modern">Ahead & Drew</span>
                    <div className="stat-value-modern" style={{ color: "#f39c12" }}>{stats.aheadDraw}</div>
                </div>
                <div className="stat-card-premium">
                    <span className="stat-label-modern">Ahead & Lost</span>
                    <div className="stat-value-modern" style={{ color: "#e74c3c" }}>{stats.aheadLoss}</div>
                </div>
            </div>

            <div className="mgr-overview-section-title">When Behind (Goal Events)</div>
            <div className="stats-grid-premium mgr-overview-score-grid">
                <div className="stat-card-premium">
                    <span className="stat-label-modern">Behind & Won</span>
                    <div className="stat-value-modern" style={{ color: "#27ae60" }}>{stats.behindWin}</div>
                </div>
                <div className="stat-card-premium">
                    <span className="stat-label-modern">Behind & Drew</span>
                    <div className="stat-value-modern" style={{ color: "#f39c12" }}>{stats.behindDraw}</div>
                </div>
                <div className="stat-card-premium">
                    <span className="stat-label-modern">Behind & Lost</span>
                    <div className="stat-value-modern" style={{ color: "#e74c3c" }}>{stats.behindLoss}</div>
                </div>
            </div>
        </div>
    );
}
