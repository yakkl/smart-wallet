import Dexie from 'dexie';

interface DomainEntry {
    domain: string;
}

class BlacklistDatabase extends Dexie {
    domains: Dexie.Table<DomainEntry, string>;

    constructor() {
        super("BlacklistDatabase");
        this.version(1).stores({
            domains: 'domain'
        });
        this.domains = this.table("domains");
    }
}

const db = new BlacklistDatabase();

export async function initializeDatabase(override = false) {
    if (override) await db.domains.clear();
    const count = await db.domains.count();
    if (count === 0) {
        const response = await fetch("/data/lists.json");
        const data = await response.json();
        await db.domains.bulkAdd(data.blacklist.map((domain: string) => ({ domain })));
    }
}

export async function isBlacklisted(domain: string): Promise<boolean> {
    const result = await db.domains.get({ domain });
    return !!result;
}
