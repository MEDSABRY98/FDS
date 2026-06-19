import { Edit, Trash2 } from "lucide-react";
import NoData_db from "../../lib/NoData_db";

const ACTIONS_COL = {
    width: '140px',
    minWidth: '140px',
    maxWidth: '140px',
    position: 'sticky',
    zIndex: 5
};

export function DynamicTable({
    columns,
    paginatedData,
    handleEditClick,
    handleDelete
}) {
    if (!paginatedData?.length) {
        return <NoData_db message="NO DATA RECORDS FOUND" height="280px" />;
    }

    return (
        <div className="table-overflow">
            <table className="db-table" style={{
                width: columns.length > 7 ? 'max-content' : '100%',
                tableLayout: columns.length > 7 ? 'auto' : 'fixed'
            }}>
                <thead>
                    <tr style={{ height: '54px' }}>
                        <th
                            className="actions-header"
                            style={{
                                ...ACTIONS_COL,
                                left: 0,
                                top: 0,
                                zIndex: 20
                            }}
                        >
                            ACTIONS
                        </th>
                        {columns.map(col => (
                            <th key={col}>{col}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {paginatedData.map((row, idx) => (
                        <tr key={idx}>
                            <td
                                className="actions-cell"
                                style={{ ...ACTIONS_COL, left: 0 }}
                            >
                                <div className="actions-flex">
                                    <button className="edit-row-btn" onClick={() => handleEditClick(row)} title="Edit">
                                        <Edit size={16} />
                                    </button>
                                    <button className="delete-row-btn" onClick={() => handleDelete(row)} title="Delete">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </td>
                            {columns.map(col => (
                                <td key={col} style={col === 'W-D-L' || col === 'W-L Q & F' ? { minWidth: '120px', fontWeight: 'bold' } : {}}>
                                    {String(row[col])}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
