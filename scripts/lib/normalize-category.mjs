export function normalizeCategoryValue(category) {
    if (category == null || category === "") return category;
    const trimmed = String(category).trim();
    if (trimmed === "?" || trimmed === "؟") return "?";
    return String(category).trim();
}
