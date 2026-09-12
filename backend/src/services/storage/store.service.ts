import { ComplianceScanRecord } from '../../types/compliance.types.js';

export class StoreService {
  private static scans: Map<string, ComplianceScanRecord> = new Map();

  public static getScan(id: string): ComplianceScanRecord | undefined {
    return this.scans.get(id);
  }

  public static listScans(userId?: string): ComplianceScanRecord[] {
    const list = Array.from(this.scans.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    if (!userId) return list;
    return list.filter(s => s.userId === userId || s.userId === 'usr_anonymous');
  }

  public static saveScan(scan: ComplianceScanRecord): ComplianceScanRecord {
    scan.updatedAt = new Date().toISOString();
    this.scans.set(scan.id, scan);
    return scan;
  }

  public static deleteScan(id: string): boolean {
    return this.scans.delete(id);
  }

  public static clearAll(): void {
    this.scans.clear();
  }
}
