export interface SongItem {
    name: string;
    path: string;
    type: 'file' | 'directory';
    size?: number;
    extension?: string;
    lastModified?: string;
    local?: boolean;
}

export interface FolderItem {
    name: string;
    path: string;
    type: 'directory';
}