export class StoreService {
    static scans = new Map();
    static getScan(id) {
        return this.scans.get(id);
    }
    static listScans(userId) {
        const list = Array.from(this.scans.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (!userId)
            return list;
        return list.filter(s => s.userId === userId || s.userId === 'usr_anonymous');
    }
    static saveScan(scan) {
        scan.updatedAt = new Date().toISOString();
        this.scans.set(scan.id, scan);
        return scan;
    }
    static deleteScan(id) {
        return this.scans.delete(id);
    }
    static clearAll() {
        this.scans.clear();
    }
}
