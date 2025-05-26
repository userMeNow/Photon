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

export async function sleep(ms: number, msMax?: number): Promise<void> {
    let duration: number;
    if (typeof msMax === 'number') {
        duration = Math.floor(Math.random() * (msMax - ms + 1)) + ms;
    } else {
        duration = ms;
    }
    await new Promise(resolve => setTimeout(resolve, duration));
}