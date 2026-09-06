"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, Download, FileSpreadsheet, FileText } from "lucide-react";
import { formatDateTime } from "@/client/lib/format-date";

type SortValue = string | number | Date | null | undefined;
type ExportValue = string | number | Date | null | undefined;

type Column<T> = {
  header: string;
  render: (row: T, index: number) => ReactNode;
  sortValue?: (row: T) => SortValue;
  exportValue?: (row: T, index: number) => ExportValue;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  emptyMessage?: string;
  rowClassName?: (row: T) => string;
  title?: string;
  toolbarExtra?: ReactNode;
};

type SortDirection = "asc" | "desc";

function compareSortValues(a: SortValue, b: SortValue): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (a instanceof Date || b instanceof Date) {
    return new Date(a).getTime() - new Date(b).getTime();
  }
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b));
}

function toExportCell(value: ExportValue): string {
  if (value == null) return "";
  if (value instanceof Date) return formatDateTime(value);
  return String(value);
}

function sanitizeFilename(title: string): string {
  const slug = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const date = new Date().toISOString().slice(0, 10);
  return `${slug || "export"}-${date}`;
}

function ExportMenu<T>({ columns, rows, title }: { columns: Column<T>[]; rows: T[]; title: string }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const exportableColumns = columns.filter((c) => c.exportValue || c.sortValue);

  function buildRows() {
    const headers = exportableColumns.map((c) => c.header);
    const body = rows.map((row, index) =>
      exportableColumns.map((c) => toExportCell((c.exportValue ?? c.sortValue)!(row, index))),
    );
    return { headers, body };
  }

  async function handleExportExcel() {
    setOpen(false);
    const XLSX = await import("xlsx");
    const { headers, body } = buildRows();
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...body]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, `${sanitizeFilename(title)}.xlsx`);
  }

  async function handleExportPdf() {
    setOpen(false);
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const { headers, body } = buildRows();
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text(title, 14, 15);
    autoTable(doc, { head: [headers], body, startY: 20, styles: { fontSize: 8 } });
    doc.save(`${sanitizeFilename(title)}.pdf`);
  }

  if (rows.length === 0) return null;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-indigo-700"
      >
        <Download size={14} />
        Export
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg">
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
          >
            <FileSpreadsheet size={14} className="text-emerald-600" />
            Export as Excel
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
          >
            <FileText size={14} className="text-red-600" />
            Export as PDF
          </button>
        </div>
      )}
    </div>
  );
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyMessage = "No records yet.",
  rowClassName,
  title = "Export",
  toolbarExtra,
}: DataTableProps<T>) {
  const [sortIndex, setSortIndex] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const sortedRows = (() => {
    if (sortIndex === null) return rows;
    const column = columns[sortIndex];
    if (!column?.sortValue) return rows;
    return [...rows].sort((a, b) => {
      const cmp = compareSortValues(column.sortValue!(a), column.sortValue!(b));
      return sortDirection === "asc" ? cmp : -cmp;
    });
  })();

  function handleSort(columnIndex: number) {
    if (sortIndex === columnIndex) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortIndex(columnIndex);
      setSortDirection("asc");
    }
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end gap-2">
        {toolbarExtra}
        <ExportMenu columns={columns} rows={sortedRows} title={title} />
      </div>
      <div className="overflow-x-auto rounded-md border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column, columnIndex) => (
                <th key={column.header} className="whitespace-nowrap px-4 py-2 text-left font-semibold text-slate-600">
                  {column.sortValue ? (
                    <button
                      type="button"
                      onClick={() => handleSort(columnIndex)}
                      className="inline-flex items-center gap-1 hover:text-slate-900"
                    >
                      {column.header}
                      {sortIndex === columnIndex ? (
                        sortDirection === "asc" ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        )
                      ) : (
                        <ChevronsUpDown size={14} className="text-slate-400" />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {sortedRows.map((row, index) => (
              <tr key={rowKey(row)} className={`transition-colors hover:bg-slate-50 ${rowClassName?.(row) ?? ""}`}>
                {columns.map((column) => (
                  <td key={column.header} className="whitespace-nowrap px-4 py-3">
                    {column.render(row, index)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
