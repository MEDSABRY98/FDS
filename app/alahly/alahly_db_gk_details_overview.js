"use client";

export default function GK_Overview_Component_Unique({ stats }) {
    return (
        <div className="stats-grid-premium fade-in">
            <div className="stat-card-premium">
                <span className="stat-label-modern">Total Appearances</span>
                <div className="stat-value-modern" style={{ color: 'var(--player-gold)' }}>{stats.caps}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Clean Sheets</span>
                <div className="stat-value-modern" style={{ color: '#27ae60' }}>{stats.cleanSheets}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Goals Conceded</span>
                <div className="stat-value-modern" style={{ color: stats.goalsConceded > 0 ? '#e74c3c' : '#27ae60' }}>{stats.goalsConceded}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Conceded Per Game</span>
                <div className="stat-value-modern" style={{ color: '#f39c12' }}>{stats.caps > 0 ? (stats.goalsConceded / stats.caps).toFixed(2) : 0}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Clean Sheet Rate</span>
                <div className="stat-value-modern" style={{ color: '#2ecc71' }}>{stats.caps > 0 ? ((stats.cleanSheets / stats.caps) * 100).toFixed(1) : 0}%</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Penalties Received</span>
                <div className="stat-value-modern" style={{ color: '#9b59b6' }}>{stats.penaltiesReceived}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Penalties Saved</span>
                <div className="stat-value-modern" style={{ color: '#2980b9' }}>{stats.penaltiesSaved}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Penalty Save Rate</span>
                <div className="stat-value-modern" style={{ color: '#3498db' }}>{stats.penaltiesReceived > 0 ? ((stats.penaltiesSaved / stats.penaltiesReceived) * 100).toFixed(1) : 0}%</div>
            </div>
        </div>
    );
}
