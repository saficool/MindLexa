import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class LocalStorageManagerService {

    constructor() { }

    // Set item in localStorage
    setItem(key: string, value: any): void {
        localStorage.setItem(key, JSON.stringify(value));
    }

    // Get item from localStorage
    getItem(key: string): any {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    }

    // Remove item from localStorage
    removeItem(key: string): void {
        localStorage.removeItem(key);
    }

    // Clear all items in localStorage
    clear(): void {
        localStorage.clear();
    }
}
