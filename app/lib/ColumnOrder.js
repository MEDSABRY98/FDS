"use client";

import { useState, useEffect } from "react";
import { supabase } from "./supabase";

export async function FetchColumnOrder(TableName) {
    if (!TableName) return null;
    try {
        const { data: Data } = await supabase
            .from("db_COLUMN_ORDERS")
            .select("COLUMN_ORDER")
            .eq("TABLE_NAME", TableName)
            .maybeSingle();
        return Data?.COLUMN_ORDER || null;
    } catch (Err) {
        console.error("Failed to fetch column order:", Err);
        return null;
    }
}

export function SortByColumnOrder(Items, ColumnOrder, GetColumnName) {
    if (!ColumnOrder?.length || !Items?.length) return Items;

    const NormalizedOrder = ColumnOrder.map((Col) => Col.toUpperCase());
    const Indexed = Items.map((Item, Index) => ({ Item, DefaultIndex: Index }));

    Indexed.sort((A, B) => {
        const ColA = GetColumnName(A.Item);
        const ColB = GetColumnName(B.Item);
        const NormA = ColA ? String(ColA).toUpperCase() : null;
        const NormB = ColB ? String(ColB).toUpperCase() : null;

        if (!NormA && !NormB) return A.DefaultIndex - B.DefaultIndex;
        if (!NormA) return 1;
        if (!NormB) return -1;

        const IdxA = NormalizedOrder.indexOf(NormA);
        const IdxB = NormalizedOrder.indexOf(NormB);

        if (IdxA === -1 && IdxB === -1) return A.DefaultIndex - B.DefaultIndex;
        if (IdxA === -1) return 1;
        if (IdxB === -1) return -1;
        if (IdxA !== IdxB) return IdxA - IdxB;
        return A.DefaultIndex - B.DefaultIndex;
    });

    return Indexed.map(({ Item }) => Item);
}

export function SortColumnNames(Columns, ColumnOrder) {
    return SortByColumnOrder(Columns, ColumnOrder, (Col) => Col);
}

export function SortFilterFields(Fields, ColumnOrder) {
    return SortByColumnOrder(Fields, ColumnOrder, (Field) => Field.dbColumn);
}

export function UseColumnOrder(TableName) {
    const [ColumnOrder, SetColumnOrder] = useState(null);

    useEffect(() => {
        let Cancelled = false;
        FetchColumnOrder(TableName).then((Order) => {
            if (!Cancelled) SetColumnOrder(Order);
        });
        return () => { Cancelled = true; };
    }, [TableName]);

    return ColumnOrder;
}
