import fs from 'fs';
import path from 'path';

export function saveArray(
    filePath: string,
    arr: unknown[] | Record<string, unknown>,
    append = false
  ): void {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  
    const json = JSON.stringify(arr, null, 2);
  
    append
      ? fs.appendFileSync(filePath, json + '\n')
      : fs.writeFileSync(filePath, json);
  
    console.log(
      `💾  saved ${Array.isArray(arr) ? arr.length + ' items' : ''} -> ${filePath}`
    );
  }