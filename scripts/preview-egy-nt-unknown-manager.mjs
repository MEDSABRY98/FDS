import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const envText = readFileSync(".env.local", "utf8");
const env = {};
for (const line of envText.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i === -1) continue;
    env[line.slice(0, i)] = line.slice(i + 1).replace(/^["']|["']$/g, "");
}

const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const isQ = (v) => {
    const t = String(v ?? "").trim();
    return t === "?" || t === "؟";
};

const { data, error } = await supabase
    .from("egy_NT_MATCHDETAILS")
    .select('MATCH_ID, "EGYPT MANAGER", "OPPONENT MANAGER"');

if (error) {
    console.error(error);
    process.exit(1);
}

const egy = data.filter((r) => isQ(r["EGYPT MANAGER"]));
const opp = data.filter((r) => isQ(r["OPPONENT MANAGER"]));

console.log("Rows with ?/؟ in EGYPT MANAGER:", egy.length);
console.log("Rows with ?/؟ in OPPONENT MANAGER:", opp.length);

const { data: mgr } = await supabase
    .from("db_MANAGERS")
    .select("MANAGER_ID, MANAGER_NAME")
    .eq("MANAGER_ID", "M-0524")
    .maybeSingle();

console.log("M-0524 catalog:", mgr || "NOT FOUND");

if (egy.length + opp.length > 0) {
    const ids = new Set([...egy, ...opp].map((r) => r.MATCH_ID));
    console.log("Sample MATCH_IDs:", [...ids].slice(0, 10).join(", "));
}
