"use client";

export default function PlayerOverview({ stats, goalFreq, gaContribution }) {
    return (
        <div className="stats-grid-premium fade-in">
            <div className="stat-card-premium">
                <span className="stat-label-modern">Total Appearances</span>
                <div className="stat-value-modern" style={{ color: 'var(--player-gold)' }}>{stats.caps}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Total Minutes</span>
                <div className="stat-value-modern">{stats.mins}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Total Goals</span>
                <div className="stat-value-modern" style={{ color: '#27ae60' }}>{stats.goals}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Mins Per Goal</span>
                <div className="stat-value-modern" style={{ color: '#f39c12' }}>{goalFreq}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">G/A Per Game</span>
                <div className="stat-value-modern" style={{ color: '#9b59b6' }}>{gaContribution}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Total Assists</span>
                <div className="stat-value-modern" style={{ color: '#2980b9' }}>{stats.assists}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Penalties Scored</span>
                <div className="stat-value-modern">{stats.penGoals}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Penalties Missed</span>
                <div className="stat-value-modern" style={{ color: '#e74c3c' }}>{stats.penMissed}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">PEN Won (Goal)</span>
                <div className="stat-value-modern" style={{ color: '#2ecc71' }}>{stats.wonGoal}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">PEN Won (Missed)</span>
                <div className="stat-value-modern" style={{ color: '#95a5a6' }}>{stats.wonMiss}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">PEN Committed (Goal)</span>
                <div className="stat-value-modern" style={{ color: '#16a085' }}>{stats.makeGoal}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">PEN Committed (Miss)</span>
                <div className="stat-value-modern" style={{ color: '#d35400' }}>{stats.makeMiss}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Brace Goals</span>
                <div className="stat-value-modern" style={{ color: '#27ae60' }}>{stats.braceG}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Brace Assists</span>
                <div className="stat-value-modern" style={{ color: '#2980b9' }}>{stats.braceA}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Hat-trick Goals</span>
                <div className="stat-value-modern" style={{ color: '#d4af37' }}>{stats.hatG}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Hat-trick Assists</span>
                <div className="stat-value-modern" style={{ color: '#7f8c8d' }}>{stats.hatA}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">4+ Goals Match</span>
                <div className="stat-value-modern" style={{ color: '#e74c3c' }}>{stats.superG}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">4+ Assists Match</span>
                <div className="stat-value-modern" style={{ color: '#8e44ad' }}>{stats.superA}</div>
            </div>
        </div>
    );
}
