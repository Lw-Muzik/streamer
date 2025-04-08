export interface SongItem {
    name: string;
    path: string;
    type: 'file' | 'directory';
    size?: number;
    extension?: string;
    lastModified?: string;
    local?: boolean;
    // Metadata fields
    title?: string;
    artist?: string;
    album?: string;
    year?: number;
    duration?: number;
    artwork?: string;
}

export interface FolderItem {
    name: string;
    path: string;
    type: 'directory';
}