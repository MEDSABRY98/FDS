/** Ensure "All" appears once at the start; dedupe option values. */
export function NormalizeFilterDropdownOptions(options) {
    const unique = [...new Set((options || []).filter(Boolean).map(String))];
    return ["All", ...unique.filter(value => value !== "All")];
}
