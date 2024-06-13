import { Dropbox } from 'dropbox';
import fs from 'fs';
const fetch = require('node-fetch-commonjs')

const ACCESS_TOKEN = '_______';
const TEAM_MEMBER_ID = 'dbmid:AADyIj_L0tOpGXHpFgDXJ8C8fJwvvJiajMU';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Custom fetch function to include the Dropbox-API-Select-User header
const customFetch = async (url: string, init: RequestInit) => {
    const headers = init.headers || {};
    //@ts-ignore
    headers['Dropbox-API-Select-User'] = TEAM_MEMBER_ID;
    return fetch(url, { ...init, headers });
};

const dbx = new Dropbox({ accessToken: ACCESS_TOKEN, fetch: customFetch });
let counter = 0;

async function listEmptyFolders(path: string = '', emptyFolders: string[] = []): Promise<string[]> {
    try {
        console.log('calling API...')

        const response = await dbx.filesListFolder({ path });
        console.log('got response')

        for (const entry of response.result.entries) {
            if (entry['.tag'] === 'folder') {
                const folderPath = entry.path_lower ?? '';
                const isEmpty = await checkIfFolderIsEmpty(folderPath);
                if (isEmpty) {
                    emptyFolders.push(entry.path_display ?? '');
                    console.log('Empty folder:', entry.path_display);
                    console.log('Total:', emptyFolders.length);
                    // write to file the empty folder
                    fs.writeFileSync(`../emptyFolders_${counter}.json`, JSON.stringify(emptyFolders, null, 2));
                    counter++;
                } else {
                    await listEmptyFolders(folderPath, emptyFolders);
                }
            }
        }

        if (response.result.has_more) {
            await listEmptyFoldersContinue(response.result.cursor, emptyFolders);
        }

        return emptyFolders;
    } catch (error: any) {
        if (error.status === 429) {
            const retryAfter = parseInt(error.headers['retry-after'], 10) * 1000;
            console.log(`Rate limit exceeded. Retrying after ${retryAfter} ms`);
            await delay(retryAfter);
            return listEmptyFolders(path, emptyFolders);
        } else {
            console.error('Error listing folders:', error);
            throw error;
        }
    }
}

async function listEmptyFoldersContinue(cursor: string, emptyFolders: string[]): Promise<string[]> {
    try {
        const response = await dbx.filesListFolderContinue({ cursor });
        for (const entry of response.result.entries) {
            if (entry['.tag'] === 'folder') {
                const folderPath = entry.path_lower;
                const isEmpty = await checkIfFolderIsEmpty(folderPath ?? '');
                if (isEmpty) {
                    emptyFolders.push(entry.path_display ?? '');
                    console.log('Empty folder:', entry.path_display);
                    // write to file the empty folder
                    fs.writeFileSync(`../emptyFolders_continue_${counter}.json`, JSON.stringify(emptyFolders, null, 2));
                    counter++;
                } else {
                    await listEmptyFolders(folderPath, emptyFolders);
                }
            }
        }

        if (response.result.has_more) {
            await listEmptyFoldersContinue(response.result.cursor, emptyFolders);
        }

        return emptyFolders;
    } catch (error: any) {
        if (error.status === 429) {
            const retryAfter = parseInt(error.headers['retry-after'], 10) * 1000;
            console.log(`Rate limit exceeded. Retrying after ${retryAfter} ms`);
            await delay(retryAfter);
            return listEmptyFoldersContinue(cursor, emptyFolders);
        } else {
            console.error('Error continuing folder list:', error);
            throw error;
        }
    }
}

async function checkIfFolderIsEmpty(path: string): Promise<boolean> {
    try {
        const response = await dbx.filesListFolder({ path });
        return response.result.entries.length === 0;
    } catch (error: any) {
        if (error.status === 429) {
            const retryAfter = parseInt(error.headers['retry-after'], 10) * 1000;
            console.log(`Rate limit exceeded. Retrying after ${retryAfter} ms`);
            await delay(retryAfter);
            return checkIfFolderIsEmpty(path);
        } else {
            console.error(`Error checking if folder is empty for path ${path}:`, error);
            throw error;
        }
    }
}

(async () => {
    try {
        console.log('calling Empty folder...')

        const emptyFolders = await listEmptyFolders();
        console.log('Empty folders:', emptyFolders);

        fs.writeFileSync('emptyFolders.json', JSON.stringify(emptyFolders, null, 2));
        console.log('Empty folders have been written to emptyFolders.json');
    } catch (error) {
        console.error('Error:', error);
    }
})();
