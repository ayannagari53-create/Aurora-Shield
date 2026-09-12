import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { StoreService } from '../services/storage/store.service.js';
import { PdfReportService } from '../services/reports/pdf.service.js';

export class ReportController {
  public static async downloadPdfReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    const id = req.params.id as string;
    const scan = StoreService.getScan(id);

    if (!scan) {
      res.status(404).json({ error: 'ScanNotFound', message: `Scan with ID ${id} not found.` });
      return;
    }

    try {
      const pdfBuffer = await PdfReportService.generateReport(scan);
      const safeFilename = `AuroraShield_ComplianceReport_${scan.productName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${scan.id.slice(0, 8)}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (err) {
      console.error('PDF Generation Failure:', err);
      res.status(500).json({ error: 'PdfGenerationError', message: 'Failed to generate compliance report PDF.' });
    }
  }

  public static async listReports(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.id;
    const scans = StoreService.listScans(userId);

    const reports = scans.map(s => ({
      id: `rep-${s.id}`,
      scanId: s.id,
      productName: s.productName,
      category: s.category,
      status: s.status,
      overallScore: s.overallScore,
      issueCount: s.potentialIssueCount + s.needsVerificationCount,
      generatedAt: s.updatedAt,
      isDemoSample: s.isDemoSample,
      downloadUrl: `/api/reports/${s.id}`
    }));

    res.json({ success: true, reports, total: reports.length });
  }
}
