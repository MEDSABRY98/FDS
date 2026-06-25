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
        map[id] = { nameAr, nameEn };
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

async function getGoalkeepers() {
    let allData = [];
    let from = 0;
    const step = 1000;
    let finished = false;

    while (!finished) {
        const { data, error } = await supabase
            .from('egy_NT_GKSDETAILS')
            .select('"PLAYER NAME"')
            .range(from, from + step - 1);

        if (error) {
            console.error('Error fetching GK details:', error);
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

    const set = new Set();
    allData.forEach(row => {
        const name = String(row['PLAYER NAME'] || '').trim();
        if (name) set.add(name);
    });
    return set;
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
        const { data, error } = await supabase.from('db_PLAYERS').select('*').limit(1);
        if (error) throw error;
        console.log('--- db_PLAYERS keys ---');
        console.log(data && data[0] ? Object.keys(data[0]) : 'No data');
        if (data && data[0]) console.log('Sample row:', data[0]);
    } catch (err) {
        console.error('Run failed:', err);
    }
}
run();

