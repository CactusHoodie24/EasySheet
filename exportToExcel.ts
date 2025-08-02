// exportToExcel.ts
import XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';

interface ProcessInfo {
  _id: string;
  title: string;
  description: string;
  createdAt: string;
}

interface Entry {
  _id: string;
  __v: number;
  process: ProcessInfo;
  createdAt: string;
  updatedAt: string;
  fieldData: Record<string, string>;
}

export const exportToExcel = async (entries: Entry[]): Promise<string> => {
  if (entries.length === 0) throw new Error("No entries to export");

  const processTitle = entries[0].process.title.replace(/[^a-z0-9]/gi, '_'); // sanitize filename

  if (!FileSystem.documentDirectory) {
    throw new Error("File system document directory is undefined");
  }

  const fileUri = FileSystem.documentDirectory + `${processTitle}.xlsx`;

  const formattedEntries = entries.map((entry) => ({
    ...entry.fieldData,
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedEntries);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Entries');

  const wbout = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });

  await FileSystem.writeAsStringAsync(fileUri, wbout, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return fileUri;
};
