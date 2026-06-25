import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env.local file
const envPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        env[match[1]] = value.trim();
    }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const supabase = createClient(supabaseUrl, supabaseKey);

// Define user overrides
const overrides = {
    'P-1872': 'Defender',      // أحمد فتحي
    'P-1739': 'Defender',      // أحمد المحمدي
    'P-0036': 'Goalkeeper',    // عبدالجليل حميدة
    'P-1957': 'Forward',       // علاء الحامولي
    'P-0769': 'Midfielder',    // هاني سعيد
    'P-1661': 'Forward',       // رأفت عطية
    'P-1406': 'Defender',      // سمير كمونة
    'P-0634': 'Forward',       // محمد دياب العطار الديبة
    'P-2122': 'Defender',      // هاني رمزي
    'P-1734': 'Defender'       // ياسر ريان
};

async function getPlayerMap() {
    let allData = [];
    let from = 0;
    const step = 1000;
    let finished = false;

    while (!finished) {
        const { data, error } = await supabase
            .from('db_PLAYERS')
            .select('PLAYER_ID, PLAYER_NAME, PLAYER_NAME_EN')
            .range(from, from + step - 1);

        if (error) {
            console.error('Error fetching players:', error);
            throw error;
        }

        if (data && data.length > 0) {
            allData = [...allData, ...data];
            from += step;
            if (data.length < step) finished = true;
        } else {
            finished = true;
        }
    }

    const map = {};
    allData.forEach(row => {
        const id = String(row.PLAYER_ID || '').trim();
        if (!id) return;
        const nameAr = String(row.PLAYER_NAME || '').trim();
        const nameEn = String(row.PLAYER_NAME_EN || '').trim();
        map[id] = nameAr || nameEn || id;
    });
    return map;
}

async function getAllSquad() {
    let allData = [];
    let from = 0;
    const step = 1000;
    let finished = false;

    while (!finished) {
        const { data, error } = await supabase
            .from('egy_NT_SQUAD')
            .select('ROW_ID, PLAYERNAME, POSITION, SEASON, CHAMPION')
            .order('ROW_ID', { ascending: true })
            .range(from, from + step - 1);

        if (error) {
            console.error('Error fetching squad:', error);
            throw error;
        }

        if (data && data.length > 0) {
            allData = [...allData, ...data];
            from += step;
            if (data.length < step) finished = true;
        } else {
            finished = true;
        }
    }
    return allData;
}

function cleanPosition(pos) {
    if (!pos) return '';
    const cleaned = String(pos).trim();
    if (cleaned === '' || cleaned === '—' || cleaned === 'null' || cleaned.toLowerCase() === 'undefined') {
        return '';
    }
    return cleaned;
}

async function run() {
    try {
        const playerMap = await getPlayerMap();
        const squadData = await getAllSquad();
        
        // Group rows by player ID
        const players = {};
        squadData.forEach(row => {
            const id = String(row.PLAYERNAME || '').trim();
            if (!id) return;

            if (!players[id]) {
                players[id] = {
                    id,
                    name: playerMap[id] || id,
                    rows: []
                };
            }
            players[id].rows.push(row);
        });

        const updates = [];

        Object.values(players).forEach(player => {
            const hasOverride = !!overrides[player.id];
            const overrideVal = overrides[player.id];

            const positions = player.rows.map(r => cleanPosition(r.POSITION)).filter(Boolean);
            const uniquePositions = [...new Set(positions)].filter(p => p !== '?');

            player.rows.forEach(row => {
                const cleanedPos = cleanPosition(row.POSITION);

                if (hasOverride) {
                    // Update ALL rows for overridden players to unify their position
                    if (cleanedPos !== overrideVal) {
                        updates.push({
                            rowId: row.ROW_ID,
                            playerName: player.name,
                            oldPos: row.POSITION || 'NULL',
                            newPos: overrideVal,
                            reason: 'User Override (Unified)'
                        });
                    }
                } else {
                    // Update only empty rows for other players if they have exactly one unique known position
                    if (!cleanedPos && uniquePositions.length === 1) {
                        updates.push({
                            rowId: row.ROW_ID,
                            playerName: player.name,
                            oldPos: row.POSITION || 'NULL',
                            newPos: uniquePositions[0],
                            reason: 'Auto-suggestion (Single known position)'
                        });
                    }
                }
            });
        });

        console.log(`Found ${updates.length} rows to update in database.`);

        // Perform updates in batches
        if (updates.length > 0) {
            console.log('Starting database updates...');
            for (let i = 0; i < updates.length; i++) {
                const u = updates[i];
                console.log(`[${i + 1}/${updates.length}] Updating ${u.playerName} (Row ${u.rowId}): ${u.oldPos} -> ${u.newPos} (${u.reason})`);
                
                const { error } = await supabase
                    .from('egy_NT_SQUAD')
                    .update({ POSITION: u.newPos })
                    .eq('ROW_ID', u.rowId);

                if (error) {
                    console.error(`Failed to update Row ${u.rowId}:`, error.message);
                }
            }
            console.log('Database updates completed successfully!');
        } else {
            console.log('No database updates needed.');
        }

    } catch (err) {
        console.error('Run failed:', err);
    }
}

run();
