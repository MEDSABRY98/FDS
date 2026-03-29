"use client";

export default function Manager_Overview_Module({ stats }) {
    const calculateRate = (val) => stats.matches > 0 ? ((val / stats.matches) * 100).toFixed(1) : 0;
    const calculateAve = (val) => stats.matches > 0 ? (val / stats.matches).toFixed(2) : 0;

    return (
        <div className="stats-grid-premium fade-in" style={{ padding: '20px' }}>
            <div className="stat-card-premium">
                <span className="stat-label-modern">MATCHES</span>
                <div className="stat-value-modern" style={{ color: 'var(--player-gold)' }}>{stats.matches}</div>
            </div>

            <div className="stat-card-premium">
                <span className="stat-label-modern">WINS</span>
                <div className="stat-value-modern" style={{ color: '#27ae60' }}>{stats.wins}</div>
            </div>

            <div className="stat-card-premium">
                <span className="stat-label-modern">WIN %</span>
                <div className="stat-value-modern" style={{ color: '#2ecc71' }}>{calculateRate(stats.wins)}%</div>
            </div>

            <div className="stat-card-premium">
                <span className="stat-label-modern">NEGATIVE DRAW</span>
                <div className="stat-value-modern" style={{ color: '#e67e22' }}>{stats.drawsNeg}</div>
            </div>

            <div className="stat-card-premium">
                <span className="stat-label-modern">POSITIVE DRAW</span>
                <div className="stat-value-modern" style={{ color: '#f39c12' }}>{stats.drawsPos}</div>
            </div>

            <div className="stat-card-premium">
                <span className="stat-label-modern">LOSSES</span>
                <div className="stat-value-modern" style={{ color: '#e74c3c' }}>{stats.losses}</div>
            </div>

            <div className="stat-card-premium">
                <span className="stat-label-modern">LOSS %</span>
                <div className="stat-value-modern" style={{ color: '#ff6b6b' }}>{calculateRate(stats.losses)}%</div>
            </div>

            <div className="stat-card-premium">
                <span className="stat-label-modern">GOALS TOTAL</span>
                <div className="stat-value-modern" style={{ color: 'var(--player-gold)' }}>{stats.gs}</div>
            </div>

            <div className="stat-card-premium">
                <span className="stat-label-modern">GF AVERAGE</span>
                <div className="stat-value-modern" style={{ color: 'var(--player-gold)' }}>{calculateAve(stats.gs)}</div>
            </div>

            <div className="stat-card-premium">
                <span className="stat-label-modern">GOALS AGAINST</span>
                <div className="stat-value-modern" style={{ color: 'var(--player-dark)' }}>{stats.ga}</div>
            </div>

            <div className="stat-card-premium">
                <span className="stat-label-modern">CS FOR</span>
                <div className="stat-value-modern" style={{ color: '#2ecc71' }}>{stats.csFor}</div>
            </div>

            <div className="stat-card-premium">
                <span className="stat-label-modern">CS FOR %</span>
                <div className="stat-value-modern" style={{ color: '#5ef193' }}>{calculateRate(stats.csFor)}%</div>
            </div>

            <div className="stat-card-premium">
                <span className="stat-label-modern">CS AGAINST</span>
                <div className="stat-value-modern" style={{ color: '#ff6b6b' }}>{stats.csAgainst}</div>
            </div>
        </div>
    );
}
