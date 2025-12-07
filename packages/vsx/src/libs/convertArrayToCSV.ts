/**
 * Converts an array of objects to CSV format
 * @param data Array of objects with consistent keys
 * @param separator Column separator (default: ',')
 * @returns CSV string
 */
export function convertArrayToCSV(data: any[], separator: string = ','): string {
  if (!Array.isArray(data)) {
    throw new Error('Data must be an array');
  }
  if (!/^[^\n"]$/.test(separator)) {
    throw new Error('Separator must be single-character and cannot be newline or quotes');
  }
  if (data.length === 0) {
    return '';
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Escape and format a value for CSV
  const formatValue = (val: any): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    // Escape quotes and wrap in quotes if contains separator, newline, or quote
    if (str.includes(separator) || str.includes('\n') || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Build CSV
  let csv = headers.map(formatValue).join(separator) + '\n';
  
  for (const row of data) {
    csv += headers.map(key => formatValue(row[key])).join(separator) + '\n';
  }
  
  return csv;
}