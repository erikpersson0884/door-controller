export {}; // Ensures the file is treated as a module and avoids conflicts.

declare global {
    interface Door {
        id: string;
        name: string;
    }
}
