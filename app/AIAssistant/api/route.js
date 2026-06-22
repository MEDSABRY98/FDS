import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wsygeerxfdaavdtvogvy.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_Y2kr-reraWveea23ykKViw_8Z3AbtOk';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Global in-memory caches
let playersCache = {};
let teamsCache = {};
let managersCache = {};
let refereesCache = {};
let stadiumsCache = {};
let catalogsLoaded = false;
let globalStatsContext = "";

async function loadCatalogs() {
    if (catalogsLoaded) {
        return {
            players: playersCache,
            teams: teamsCache,
            managers: managersCache,
            referees: refereesCache,
            stadiums: stadiumsCache
        };
    }

    try {
        console.log("Loading database catalogs into memory cache...");
        
        // 1. Players
        let playersList = [];
        let from = 0;
        const step = 1000;
        let finished = false;
        while (!finished) {
            const { data } = await supabase.from('db_PLAYERS').select('*').range(from, from + step - 1);
            if (data && data.length > 0) {
                playersList = [...playersList, ...data];
                from += step;
                if (data.length < step) finished = true;
            } else {
                finished = true;
            }
        }
        playersList.forEach(p => {
            playersCache[p.PLAYER_ID] = p.PLAYER_NAME || p.PLAYER_NAME_EN || p.PLAYER_ID;
        });

        // 2. Teams
        const { data: teamsList } = await supabase.from('db_TEAMS').select('*');
        if (teamsList) {
            teamsList.forEach(t => {
                teamsCache[t.TEAM_ID] = t.TEAM_NAME || t.TEAM_NAME_EN || t.TEAM_ID;
            });
        }

        // 3. Managers
        const { data: managersList } = await supabase.from('db_MANAGERS').select('*');
        if (managersList) {
            managersList.forEach(m => {
                managersCache[m.MANAGER_ID] = m.MANAGER_NAME || m.MANAGER_NAME_EN || m.MANAGER_ID;
            });
        }

        // 4. Referees
        const { data: refereesList } = await supabase.from('db_REFEREES').select('*');
        if (refereesList) {
            refereesList.forEach(r => {
                refereesCache[r.REFEREE_ID] = r.REFEREE_NAME || r.REFEREE_NAME_EN || r.REFEREE_ID;
            });
        }

        // 5. Stadiums
        const { data: stadiumsList } = await supabase.from('db_STADIUMS').select('*');
        if (stadiumsList) {
            stadiumsList.forEach(s => {
                stadiumsCache[s.STADIUM_ID] = s.STADIUM_NAME || s.STADIUM_NAME_EN || s.STADIUM_ID;
            });
        }

        catalogsLoaded = true;
        console.log("Database catalogs loaded successfully.");
    } catch (e) {
        console.error("Error pre-loading catalogs in AI Route:", e);
    }

    return {
        players: playersCache,
        teams: teamsCache,
        managers: managersCache,
        referees: refereesCache,
        stadiums: stadiumsCache
    };
}

async function buildGlobalStatsContext(catalogs) {
    if (globalStatsContext) return globalStatsContext;

    try {
        console.log("Pre-computing global stats context...");
        
        // Fetch all goal/assist events
        const { data: egyEvents } = await supabase.from('egy_NT_PLAYERDETAILS').select('"PLAYER NAME", TYPE, TYPE_SUB');
        const { data: ahlyEvents } = await supabase.from('alahly_PLAYERDETAILS').select('"PLAYER NAME", TYPE, TYPE_SUB');
        
        // Fetch matches to aggregate manager wins
        const { data: egyMatches } = await supabase.from('egy_NT_MATCHDETAILS').select('"EGYPT MANAGER", GF, GA');
        const { data: ahlyMatches } = await supabase.from('alahly_MATCHDETAILS').select('"AHLY MANAGER", GF, GA');

        // Fetch last 5 matches to show recent history
        const { data: recentEgyptMatches } = await supabase.from('egy_NT_MATCHDETAILS').select('*').order('DATE', { ascending: false }).limit(5);
        const { data: recentAhlyMatches } = await supabase.from('alahly_MATCHDETAILS').select('*').order('DATE', { ascending: false }).limit(5);

        // Fetch scorer events for recent matches
        const recentEgyptMatchIds = (recentEgyptMatches || []).map(m => m.MATCH_ID);
        const { data: recentEgyptEvents } = await supabase.from('egy_NT_PLAYERDETAILS').select('*').in('MATCH_ID', recentEgyptMatchIds);

        const recentAhlyMatchIds = (recentAhlyMatches || []).map(m => m.MATCH_ID);
        const { data: recentAhlyEvents } = await supabase.from('alahly_PLAYERDETAILS').select('*').in('MATCH_ID', recentAhlyMatchIds);

        // Helper to check valid names
        const isValidName = (name) => {
            if (!name) return false;
            const clean = name.trim();
            return clean && clean !== '؟' && clean !== '-' && clean !== 'unknown' && clean !== 'U.N.P?' && !clean.startsWith('P-') && !clean.startsWith('M-');
        };

        // 1. Aggregate Egypt Scorers & Assists
        const egyScorers = {};
        const egyAssists = {};
        (egyEvents || []).forEach(e => {
            const pId = e['PLAYER NAME'];
            const type = e.TYPE;
            const sub = e.TYPE_SUB;
            const isGoal = type === "GOAL" || type === "هدف" || sub === "PENGOAL" || sub === "هدف جزاء";
            const isAssist = type === "ASSIST" || type === "اسيست" || type === "صنع";
            if (pId) {
                if (isGoal) egyScorers[pId] = (egyScorers[pId] || 0) + 1;
                if (isAssist) egyAssists[pId] = (egyAssists[pId] || 0) + 1;
            }
        });

        // 2. Aggregate Ahly Scorers & Assists
        const ahlyScorers = {};
        const ahlyAssists = {};
        (ahlyEvents || []).forEach(e => {
            const pId = e['PLAYER NAME'];
            const type = e.TYPE;
            const sub = e.TYPE_SUB;
            const isGoal = type === "GOAL" || type === "هدف" || sub === "PENGOAL" || sub === "هدف جزاء";
            const isAssist = type === "ASSIST" || type === "اسيست" || type === "صنع";
            if (pId) {
                if (isGoal) ahlyScorers[pId] = (ahlyScorers[pId] || 0) + 1;
                if (isAssist) ahlyAssists[pId] = (ahlyAssists[pId] || 0) + 1;
            }
        });

        // 3. Aggregate Egypt managers
        const egyMgrs = {};
        (egyMatches || []).forEach(m => {
            const mgrId = m['EGYPT MANAGER'];
            if (!mgrId) return;
            const gf = parseInt(m.GF);
            const ga = parseInt(m.GA);
            if (isNaN(gf) || isNaN(ga)) return;

            if (!egyMgrs[mgrId]) egyMgrs[mgrId] = { matches: 0, wins: 0, draws: 0, losses: 0 };
            egyMgrs[mgrId].matches++;
            if (gf > ga) egyMgrs[mgrId].wins++;
            else if (gf < ga) egyMgrs[mgrId].losses++;
            else egyMgrs[mgrId].draws++;
        });

        // 4. Aggregate Ahly managers
        const ahlyMgrs = {};
        (ahlyMatches || []).forEach(m => {
            const mgrId = m['AHLY MANAGER'];
            if (!mgrId) return;
            const gf = parseInt(m.GF);
            const ga = parseInt(m.GA);
            if (isNaN(gf) || isNaN(ga)) return;

            if (!ahlyMgrs[mgrId]) ahlyMgrs[mgrId] = { matches: 0, wins: 0, draws: 0, losses: 0 };
            ahlyMgrs[mgrId].matches++;
            if (gf > ga) ahlyMgrs[mgrId].wins++;
            else if (gf < ga) ahlyMgrs[mgrId].losses++;
            else ahlyMgrs[mgrId].draws++;
        });

        // Format helpers
        const getTopPlayersMarkdown = (statsObj, title) => {
            let text = `\n#### ${title}:\n`;
            const list = Object.keys(statsObj)
                .map(id => ({ name: catalogs.players[id] || id, count: statsObj[id] }))
                .filter(p => isValidName(p.name))
                .sort((a, b) => b.count - a.count)
                .slice(0, 15);
            
            list.forEach((p, idx) => {
                text += `${idx + 1}. ${p.name}: ${p.count}\n`;
            });
            return text;
        };

        const getTopManagersMarkdown = (mgrsObj, title) => {
            let text = `\n#### ${title}:\n`;
            const list = Object.keys(mgrsObj)
                .map(id => ({ name: catalogs.managers[id] || id, ...mgrsObj[id] }))
                .filter(m => isValidName(m.name))
                .sort((a, b) => b.wins - a.wins)
                .slice(0, 10);

            list.forEach((m, idx) => {
                text += `${idx + 1}. ${m.name}: ${m.wins} فوز من ${m.matches} مباراة (${m.draws} تعادل، ${m.losses} هزيمة)\n`;
            });
            return text;
        };

        // Format recent matches and their scorers
        const getRecentMatchesMarkdown = () => {
            let text = `\n### آخر مباريات مسجلة بقاعدة البيانات وهدافيها (أحدث 5 مباريات):\n`;
            
            text += `\n#### آخر مباريات منتخب مصر:\n`;
            (recentEgyptMatches || []).forEach(m => {
                const oppName = catalogs.teams[m['OPPONENT TEAM']] || m['OPPONENT TEAM'];
                text += `- التاريخ: ${m.DATE} | الخصم: ${oppName} | النتيجة: مصر ${m.GF} - ${m.GA} ${oppName}\n`;
                
                const matchEvents = (recentEgyptEvents || []).filter(e => e.MATCH_ID === m.MATCH_ID);
                const goals = matchEvents.filter(e => e.TYPE === 'GOAL' || e.TYPE_SUB === 'PENGOAL');
                if (goals.length > 0) {
                    text += `  * مسجلو الأهداف: `;
                    const scorers = goals.map(g => {
                        const name = catalogs.players[g['PLAYER NAME']] || g['PLAYER NAME'];
                        return `${name} (${g.MINUTE || 'N/A'}'${g.TYPE_SUB === 'PENGOAL' ? ' ركلة جزاء' : ''})`;
                    });
                    text += scorers.join("، ") + "\n";
                }
            });

            text += `\n#### آخر مباريات النادي الأهلي:\n`;
            (recentAhlyMatches || []).forEach(m => {
                const oppName = catalogs.teams[m['OPPONENT TEAM']] || m['OPPONENT TEAM'];
                text += `- التاريخ: ${m.DATE} | الخصم: ${oppName} | النتيجة: الأهلي ${m.GF} - ${m.GA} ${oppName}\n`;
                
                const matchEvents = (recentAhlyEvents || []).filter(e => e.MATCH_ID === m.MATCH_ID);
                const goals = matchEvents.filter(e => e.TYPE === 'GOAL' || e.TYPE_SUB === 'PENGOAL');
                if (goals.length > 0) {
                    text += `  * مسجلو الأهداف: `;
                    const scorers = goals.map(g => {
                        const name = catalogs.players[g['PLAYER NAME']] || g['PLAYER NAME'];
                        return `${name} (${g.MINUTE || 'N/A'}'${g.TYPE_SUB === 'PENGOAL' ? ' ركلة جزاء' : ''})`;
                    });
                    text += scorers.join("، ") + "\n";
                }
            });

            return text;
        };

        globalStatsContext = "\n### إحصائيات تاريخية عامة من قاعدة البيانات (تستخدم للإجابة عن الأسئلة العامة حول ترتيب الهدافين وصناع اللعب والمدربين الأكثر فوزاً):\n" +
                             getTopPlayersMarkdown(egyScorers, "أفضل هدافي منتخب مصر في التاريخ") +
                             getTopPlayersMarkdown(egyAssists, "أكثر اللاعبين صناعة للأهداف (Assists) مع منتخب مصر") +
                             getTopPlayersMarkdown(ahlyScorers, "أفضل هدافي النادي الأهلي في التاريخ") +
                             getTopPlayersMarkdown(ahlyAssists, "أكثر اللاعبين صناعة للأهداف (Assists) مع النادي الأهلي") +
                             getTopManagersMarkdown(egyMgrs, "أكثر مدربي منتخب مصر تحقيقاً للفوز") +
                             getTopManagersMarkdown(ahlyMgrs, "أكثر مدربي النادي الأهلي تحقيقاً للفوز") +
                             getRecentMatchesMarkdown();

        console.log("Global statistics context successfully pre-computed.");
    } catch (e) {
        console.error("Failed to build global stats context:", e);
    }

    return globalStatsContext;
}

function findMatchedEntities(query, catalogs) {
    const skipValues = new Set(["-", "unknown", "?", "؟", "n/a", "na", "none", ""]);
    
    const matchedPlayers = [];
    const matchedTeams = [];
    const matchedManagers = [];

    // Match Players
    Object.keys(catalogs.players).forEach(id => {
        const name = catalogs.players[id];
        if (name && name.length >= 3 && !skipValues.has(name.trim())) {
            if (query.includes(name)) {
                matchedPlayers.push({ id, name });
            }
        }
    });

    // Match Teams
    Object.keys(catalogs.teams).forEach(id => {
        const name = catalogs.teams[id];
        if (name && name.length >= 3 && !skipValues.has(name.trim())) {
            if (query.includes(name)) {
                matchedTeams.push({ id, name });
            }
        }
    });

    // Match Managers
    Object.keys(catalogs.managers).forEach(id => {
        const name = catalogs.managers[id];
        if (name && name.length >= 3 && !skipValues.has(name.trim())) {
            if (query.includes(name)) {
                matchedManagers.push({ id, name });
            }
        }
    });

    return {
        players: matchedPlayers.slice(0, 5),
        teams: matchedTeams.slice(0, 3),
        managers: matchedManagers.slice(0, 3)
    };
}

function mapRow(row, catalogs) {
    if (!row) return row;
    const mapped = { ...row };
    
    // Stadiums/Place
    const stadiumCols = ['STAD', 'PLACE'];
    stadiumCols.forEach(col => {
        if (mapped[col] && catalogs.stadiums[mapped[col]]) {
            mapped[col] = catalogs.stadiums[mapped[col]];
        }
    });

    // Managers
    const managerCols = ['EGYPT MANAGER', 'OPPONENT MANAGER', 'ZAMALEK MANAGER', 'AHLY MANAGER'];
    managerCols.forEach(col => {
        if (mapped[col] && catalogs.managers[mapped[col]]) {
            mapped[col] = catalogs.managers[mapped[col]];
        }
    });

    // Referees
    const refereeCols = ['REFREE', 'REFEREE'];
    refereeCols.forEach(col => {
        if (mapped[col] && catalogs.referees[mapped[col]]) {
            mapped[col] = catalogs.referees[mapped[col]];
        }
    });

    // Players
    const playerCols = ['PLAYER NAME', 'PLAYERNAME', 'PLAYER NAME OUT', 'Egypt PLAYER', 'AHLY PLAYER', 'EGYPT GK', 'AHLY GK', 'OPPONENT GK', 'OPPONENT PLAYER', 'MOTM'];
    playerCols.forEach(col => {
        if (mapped[col] && catalogs.players[mapped[col]]) {
            mapped[col] = catalogs.players[mapped[col]];
        }
    });

    // Teams
    const teamCols = ['TEAM', 'Egypt TEAM', 'OPPONENT TEAM', 'EGYPT TEAM', 'CLUB', 'AHLY TEAM'];
    teamCols.forEach(col => {
        if (mapped[col] && catalogs.teams[mapped[col]]) {
            mapped[col] = catalogs.teams[mapped[col]];
        }
    });

    return mapped;
}

async function getDatabaseContext(query, catalogs) {
    const matches = findMatchedEntities(query, catalogs);
    const yearMatches = query.match(/\b(19\d\d|20\d\d)\b/g) || [];
    let contextText = "";

    // A. Fetch Player Goals/Events from Egypt NT and Al Ahly
    if (matches.players.length > 0) {
        const playerIds = matches.players.map(p => p.id);
        
        const { data: egyptEvents } = await supabase
            .from('egy_NT_PLAYERDETAILS')
            .select('*')
            .in('PLAYER NAME', playerIds)
            .limit(30);

        const { data: ahlyEvents } = await supabase
            .from('alahly_PLAYERDETAILS')
            .select('*')
            .in('PLAYER NAME', playerIds)
            .limit(30);

        contextText += `\n### سجل أهداف ومشاركات اللاعبين المستفسر عنهم:\n`;
        matches.players.forEach(p => {
            contextText += `- اللاعب: ${p.name}\n`;
            
            const pEgypt = (egyptEvents || []).filter(e => e['PLAYER NAME'] === p.id).map(r => mapRow(r, catalogs));
            if (pEgypt.length > 0) {
                contextText += `  * مع منتخب مصر:\n`;
                pEgypt.forEach(e => {
                    contextText += `    - المنافس: ${e.MATCH_ID} | النادي: ${e.CLUB || 'غير محدد'} | الحدث: ${e.TYPE} | دقيقة: ${e.MINUTE || 'غير محدد'}\n`;
                });
            }

            const pAhly = (ahlyEvents || []).filter(e => e['PLAYER NAME'] === p.id).map(r => mapRow(r, catalogs));
            if (pAhly.length > 0) {
                contextText += `  * مع النادي الأهلي:\n`;
                pAhly.forEach(e => {
                    contextText += `    - المنافس: ${e.MATCH_ID} | الحدث: ${e.TYPE} | دقيقة: ${e.MINUTE || 'غير محدد'}\n`;
                });
            }
        });
    }

    // B. Fetch Opponent Team Matches
    if (matches.teams.length > 0) {
        const teamIds = matches.teams.map(t => t.id);
        
        const { data: egyptMatches } = await supabase
            .from('egy_NT_MATCHDETAILS')
            .select('*')
            .in('OPPONENT TEAM', teamIds)
            .limit(10);

        const { data: ahlyMatches } = await supabase
            .from('alahly_MATCHDETAILS')
            .select('*')
            .in('OPPONENT TEAM', teamIds)
            .limit(10);

        contextText += `\n### مباريات متعلقة بالفرق المستعلم عنها:\n`;
        matches.teams.forEach(t => {
            const teamEgypt = (egyptMatches || []).filter(m => m['OPPONENT TEAM'] === t.id).map(r => mapRow(r, catalogs));
            if (teamEgypt.length > 0) {
                contextText += `  * مباريات منتخب مصر ضد ${t.name}:\n`;
                teamEgypt.forEach(m => {
                    contextText += `    - التاريخ: ${m.DATE} | البطولة: ${m.CHAMPION} | النتيجة: مصر ${m.GF} - ${m.GA} | الملعب: ${m.PLACE || 'غير محدد'}\n`;
                });
            }

            const teamAhly = (ahlyMatches || []).filter(m => m['OPPONENT TEAM'] === t.id).map(r => mapRow(r, catalogs));
            if (teamAhly.length > 0) {
                contextText += `  * مباريات الأهلي ضد ${t.name}:\n`;
                teamAhly.forEach(m => {
                    contextText += `    - التاريخ: ${m.DATE} | البطولة: ${m.CHAMPION} | النتيجة: الأهلي ${m.GF} - ${m.GA}\n`;
                });
            }
        });
    }

    // C. Fetch Year Matches
    if (yearMatches.length > 0) {
        contextText += `\n### مباريات جرت في السنوات المستعلم عنها:\n`;
        for (const yr of yearMatches) {
            const startDate = `${yr}-01-01`;
            const endDate = `${yr}-12-31`;
            
            const { data: egyptYearMatches } = await supabase
                .from('egy_NT_MATCHDETAILS')
                .select('*')
                .gte('DATE', startDate)
                .lte('DATE', endDate)
                .limit(10);

            const { data: ahlyYearMatches } = await supabase
                .from('alahly_MATCHDETAILS')
                .select('*')
                .gte('DATE', startDate)
                .lte('DATE', endDate)
                .limit(10);

            if (egyptYearMatches && egyptYearMatches.length > 0) {
                const mappedEgypt = egyptYearMatches.map(r => mapRow(r, catalogs));
                contextText += `  * منتخب مصر في عام ${yr}:\n`;
                mappedEgypt.forEach(m => {
                    contextText += `    - التاريخ: ${m.DATE} | المنافس: ${m['OPPONENT TEAM']} | النتيجة: مصر ${m.GF} - ${m.GA} | البطولة: ${m.CHAMPION}\n`;
                });
            }

            if (ahlyYearMatches && ahlyYearMatches.length > 0) {
                const mappedAhly = ahlyYearMatches.map(r => mapRow(r, catalogs));
                contextText += `  * الأهلي في عام ${yr}:\n`;
                mappedAhly.forEach(m => {
                    contextText += `    - التاريخ: ${m.DATE} | المنافس: ${m['OPPONENT TEAM']} | النتيجة: الأهلي ${m.GF} - ${m.GA} | البطولة: ${m.CHAMPION}\n`;
                });
            }
        }
    }

    // D. Fetch recent matches context dynamically if user asks about "latest" or "last" match
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes("اخر") || lowerQuery.includes("أخر") || lowerQuery.includes("أخيرة") || lowerQuery.includes("اخيرة") || lowerQuery.includes("مباراة") || lowerQuery.includes("ماتش") || lowerQuery.includes("الترجي") || lowerQuery.includes("ترجي") || lowerQuery.includes("esperance")) {
        // We already have recent matches formatted in the cached globalStatsContext, 
        // but adding this specifically helps focus Gemini's attention.
        contextText += `\n### تنبيه: يبدو أن المستخدم يسأل عن آخر مباريات مسجلة بقاعدة البيانات. الرجاء الاعتماد على قائمة آخر المباريات المسجلة أعلاه للإجابة.\n`;
    }

    return contextText;
}

export async function POST(req) {
    try {
        const { messages } = await req.json();

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Gemini API key is not configured in .env.local" }, { status: 500 });
        }

        // 1. Ensure catalogs are loaded
        const catalogs = await loadCatalogs();

        // 2. Pre-compute and build global statistics context (caches inside)
        const globalStats = await buildGlobalStatsContext(catalogs);

        // 3. Get the latest user query to fetch context dynamically
        const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user');
        const userQuery = lastUserMessage ? lastUserMessage.content : "";

        // 4. Query database to build contextual information for specific entities in the query
        let dbSpecificContext = "";
        try {
            dbSpecificContext = await getDatabaseContext(userQuery, catalogs);
        } catch (dbErr) {
            console.error("Specific context retrieval failed:", dbErr);
        }

        // Format messages for Gemini API
        const formattedContents = messages.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));

        const systemInstruction = {
            parts: [{
                text: "أنت مساعد ذكي متخصص في قاعدة بيانات كرة القدم المصرية والعالمية (Football Database). " +
                      "تجيب باللغة العربية بأسلوب رياضي شيق ومحترف ومختصر ومقنع. " +
                      "لديك معرفة واسعة بالنادي الأهلي، منتخب مصر، الزمالك، البطولات الأفريقية والعالمية. " +
                      "عند عرض جداول أو مقارنات، استخدم تنسيق Markdown (مثل الجداول أو النقاط) لتظهر بشكل جميل وواضح. " +
                      "شجع المستخدم دائماً على استكشاف قاعدة البيانات والتحليلات الموجودة في البرنامج.\n\n" +
                      "هام جداً:\n" +
                      "1. تاريخ اليوم الحالي هو 22 يونيو 2026 (June 22, 2026). جميع مباريات عام 2026 وما قبله هي مباريات حقيقية وواقعية جرت بالفعل ومسجلة في قاعدة البيانات بكامل تفاصيلها ونتائجها وهدافيها، وليست مجرد جداول مستقبلية أو محاكاة. لا تذكر للمستخدم أبداً أنها مباريات مستقبلية أو مجرد محاكاة.\n" +
                      "2. اعتمد كلياً على البيانات المرفقة أدناه للإجابة عن أسئلة المستخدم حول الهدافين ونتائج المباريات وتشكيلات الفرق.\n\n" +
                      "إليك الإحصائيات التاريخية العامة وآخر 5 مباريات مسجلة بقاعدة البيانات وهدافيها:\n" +
                      globalStats + "\n\n" +
                      "إليك أيضاً سياق محدد تم استرجاعه من قاعدة البيانات بناءً على سؤال المستخدم الحالي:\n" +
                      dbSpecificContext
            }]
        };

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: formattedContents,
                systemInstruction: systemInstruction
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("Gemini API Error:", errText);
            return NextResponse.json({ error: `Gemini API responded with status ${response.status}` }, { status: response.status });
        }

        const data = await response.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "عذراً، لم أتمكن من توليد إجابة.";

        return NextResponse.json({ content: aiText });

    } catch (error) {
        console.error("API Route Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export const dynamic = 'force-dynamic';
