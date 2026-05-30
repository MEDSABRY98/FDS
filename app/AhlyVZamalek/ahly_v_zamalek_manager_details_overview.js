"use client";

export default function ManagerOverview({ stats }) {
    const calculateRate = (val) => stats.matches > 0 ? ((val / stats.matches) * 100).toFixed(1) : 0;
    const calculateAve = (val) => stats.matches > 0 ? (val / stats.matches).toFixed(2) : 0;

    return (
        <div className="stats-grid-premium fade-in">
            <div className="stat-card-premium">
                <span className="stat-label-modern">Matches</span>
                <div className="stat-value-modern" style={{ color: 'var(--mgr-gold)' }}>{stats.matches}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Wins</span>
                <div className="stat-value-modern" style={{ color: '#27ae60' }}>{stats.wins}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Win %</span>
                <div className="stat-value-modern" style={{ color: '#2ecc71' }}>{calculateRate(stats.wins)}%</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Draws</span>
                <div className="stat-value-modern" style={{ color: '#f39c12' }}>{stats.draws}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Losses</span>
                <div className="stat-value-modern" style={{ color: '#e74c3c' }}>{stats.losses}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Loss %</span>
                <div className="stat-value-modern" style={{ color: '#ff6b6b' }}>{calculateRate(stats.losses)}%</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Goals Scored</span>
                <div className="stat-value-modern" style={{ color: 'var(--mgr-gold)' }}>{stats.gs}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">GF Average</span>
                <div className="stat-value-modern" style={{ color: 'var(--mgr-gold)' }}>{calculateAve(stats.gs)}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Goals Against</span>
                <div className="stat-value-modern" style={{ color: '#555' }}>{stats.ga}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">GA Average</span>
                <div className="stat-value-modern" style={{ color: '#555' }}>{calculateAve(stats.ga)}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Clean Sheets</span>
                <div className="stat-value-modern" style={{ color: '#2ecc71' }}>{stats.csFor}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">CS Rate %</span>
                <div className="stat-value-modern" style={{ color: '#5ef193' }}>{calculateRate(stats.csFor)}%</div>
            </div>
        </div>
    );
}
