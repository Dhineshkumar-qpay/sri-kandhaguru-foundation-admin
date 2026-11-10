type ExportValue = string | number | null | undefined;

export type ExportRow = Record<string, ExportValue>;

const escapeCsvValue = (value: ExportValue) => {
  let text = value === null || value === undefined ? "" : String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }
  return `"${text.replaceAll('"', '""')}"`;
};

export const exportToExcel = (
  filename: string,
  rows: ExportRow[],
) => {
  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) =>
      headers.map((header) => escapeCsvValue(row[header])).join(","),
    ),
  ].join("\r\n");
  const blob = new Blob(["\uFEFF", csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
