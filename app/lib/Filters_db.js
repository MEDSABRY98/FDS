/** Ensure "All" appears once at the start; dedupe option values. */
export function NormalizeFilterDropdownOptions(options) {
    const unique = [...new Set((options || []).filter(Boolean).map(String))];
    return ["All", ...unique.filter((value) => value !== "All")];
}

/** Apply all active filters except one dropdown (for cascading options). */
export function applyFiltersWithExclusion(data, filterDefs, filters, excludeKey, rowMatchesFilter) {
    return (data || []).filter((row) =>
        filterDefs.every((def) => {
            if (def.key === excludeKey) return true;
            return rowMatchesFilter(row, def, filters[def.key]);
        })
    );
}

/** Build per-dropdown options from data scoped by the other active filters. */
export function buildCascadingFilterOptions(data, filterDefs, filters, getUniqueFilters, rowMatchesFilter) {
    const out = {};
    filterDefs.forEach((def) => {
        const scoped = applyFiltersWithExclusion(data, filterDefs, filters, def.key, rowMatchesFilter);
        const base = getUniqueFilters(scoped);
        out[def.optionsKey] = NormalizeFilterDropdownOptions(
            (base[def.optionsKey] || []).filter((v) => v !== "All")
        );
    });
    return out;
}

/** Drop selections that are no longer valid after another filter changes. */
export function pruneInvalidFilterSelections(data, filterDefs, filters, getUniqueFilters, rowMatchesFilter, changedKey) {
    const next = { ...filters };
    filterDefs.forEach((def) => {
        if (def.key === changedKey) return;
        const selected = next[def.key];
        if (!selected || selected === "All") return;
        const scoped = applyFiltersWithExclusion(data, filterDefs, next, def.key, rowMatchesFilter);
        const base = getUniqueFilters(scoped);
        const opts = (base[def.optionsKey] || []).filter((v) => v !== "All").map(String);
        if (!opts.includes(String(selected))) delete next[def.key];
    });
    return next;
}
