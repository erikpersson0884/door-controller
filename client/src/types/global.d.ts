export {}; // Ensures the file is treated as a module and avoids conflicts.

declare global {
    export interface Door {
        id: string | number;
        name: string;
    }

    export interface TriggerResponse {
        ok: boolean;
        [key: string]: unknown;
    }

    export interface LoginResponse {
        ok: boolean;
    }
}
