import { v4 as uuidv4 } from 'uuid';
import { StoreService } from '../services/storage/store.service.js';
import { QualityService } from '../services/quality/quality.service.js';
import { OcrService } from '../services/ocr/ocr.service.js';
import { ExtractionService } from '../services/ai/extraction.service.js';
import { ConflictService } from '../services/compliance/conflict.service.js';
import { RuleEngineService } from '../services/compliance/rule-engine.service.js';
export class ScanController {
    static async createScan(req, res) {
        const { category, productName } = req.body;
        const userId = req.user?.id || 'usr_anonymous';
        const scanId = `SCAN-${Date.now().toString(36).toUpperCase()}-${uuidv4().slice(0, 4).toUpperCase()}`;
        const newScan = {
            id: scanId,
            userId,
            productName: productName || 'Packaged Product Scan',
            category: category || 'Food & Beverages',
            status: 'NEEDS_VERIFICATION',
            overallScore: 0,
            images: [],
            conflicts: [],
            ruleResults: [],
            passedCount: 0,
            needsVerificationCount: 0,
            potentialIssueCount: 0,
            humanVerification: {
                isVerified: false,
                editedFields: []
            },
            executiveSummary: 'Scan initialized. Uploaded label panels will be processed through OCR and AI product intelligence.',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        StoreService.saveScan(newScan);
        res.status(201).json({ success: true, scan: newScan });
    }
    static async uploadImages(req, res) {
        const id = req.params.id;
        const scan = StoreService.getScan(id);
        if (!scan) {
            res.status(404).json({ error: 'ScanNotFound', message: `Scan with ID ${id} not found.` });
            return;
        }
        const files = req.files;
        const angles = (req.body.angles ? (Array.isArray(req.body.angles) ? req.body.angles : [req.body.angles]) : []);
        if (!files || files.length === 0) {
            res.status(400).json({ error: 'NoFilesUploaded', message: 'Please provide at least one product label image.' });
            return;
        }
        const newImages = [];
        files.forEach((file, index) => {
            const imageId = `img-${uuidv4().slice(0, 8)}`;
            const angle = angles[index] || (index === 0 ? 'FRONT' : index === 1 ? 'BACK' : 'SIDE');
            // Convert buffer to data URL so frontend and OCR engine can view & process immediately
            const base64Data = file.buffer.toString('base64');
            const dataUrl = `data:${file.mimetype};base64,${base64Data}`;
            const quality = QualityService.assessQuality(imageId, file.originalname, angle, file.size, file.mimetype);
            const record = {
                id: imageId,
                url: dataUrl,
                filename: file.originalname,
                labelAngle: angle,
                mimetype: file.mimetype,
                size: file.size,
                uploadedAt: new Date().toISOString(),
                quality
            };
            newImages.push(record);
            scan.images.push(record);
        });
        StoreService.saveScan(scan);
        res.json({ success: true, uploadedCount: newImages.length, images: scan.images });
    }
    static async runOcr(req, res) {
        const id = req.params.id;
        const scan = StoreService.getScan(id);
        if (!scan) {
            res.status(404).json({ error: 'ScanNotFound', message: `Scan with ID ${id} not found.` });
            return;
        }
        if (scan.images.length === 0) {
            res.status(400).json({ error: 'NoImages', message: 'Cannot perform OCR without uploaded images.' });
            return;
        }
        const ocrOutputs = [];
        for (const img of scan.images) {
            const ocrRes = await OcrService.processImage(img.id, img.labelAngle, img.url);
            img.ocrText = ocrRes.rawText;
            ocrOutputs.push(ocrRes);
        }
        StoreService.saveScan(scan);
        res.json({ success: true, ocrResults: ocrOutputs });
    }
    static async analyzeScan(req, res) {
        const id = req.params.id;
        const scan = StoreService.getScan(id);
        if (!scan) {
            res.status(404).json({ error: 'ScanNotFound', message: `Scan with ID ${id} not found.` });
            return;
        }
        // Build OCR results from images or run OCR on the fly on actual images
        const ocrResults = [];
        for (const img of scan.images) {
            if (!img.ocrText) {
                const ocr = await OcrService.processImage(img.id, img.labelAngle, img.url);
                img.ocrText = ocr.rawText;
                ocrResults.push(ocr);
            }
            else {
                ocrResults.push({
                    imageId: img.id,
                    labelAngle: img.labelAngle,
                    rawText: img.ocrText,
                    lines: img.ocrText.split('\n').filter(Boolean).map(l => ({ text: l, confidence: 0.94 })),
                    processedAt: new Date().toISOString()
                });
            }
        }
        // Multi-Image Product Understanding & AI Extraction
        const imageDataUrls = scan.images.map(img => ({
            imageId: img.id,
            labelAngle: img.labelAngle,
            dataUrl: img.url
        }));
        const extractedData = await ExtractionService.extractStructuredData(ocrResults, scan.category, imageDataUrls);
        if (extractedData.productName?.value && !extractedData.productName.value.includes('Not detected')) {
            scan.productName = extractedData.productName.value;
        }
        if (extractedData.category?.value) {
            scan.category = extractedData.category.value;
        }
        // Multi-Image Cross-Label Conflict Detection
        const conflicts = ConflictService.detectConflicts(ocrResults);
        scan.extractedData = extractedData;
        scan.verifiedData = JSON.parse(JSON.stringify(extractedData));
        scan.conflicts = conflicts;
        // Run dynamic category-aware compliance rules
        const evaluation = RuleEngineService.evaluateCompliance(scan.verifiedData, conflicts);
        scan.status = evaluation.status;
        scan.overallScore = evaluation.overallScore;
        scan.ruleResults = evaluation.ruleResults;
        scan.passedCount = evaluation.passedCount;
        scan.needsVerificationCount = evaluation.needsVerificationCount;
        scan.potentialIssueCount = evaluation.potentialIssueCount;
        scan.executiveSummary = evaluation.executiveSummary;
        StoreService.saveScan(scan);
        res.json({
            success: true,
            extractedData: scan.extractedData,
            conflicts: scan.conflicts,
            ruleResults: scan.ruleResults,
            status: scan.status,
            overallScore: scan.overallScore
        });
    }
    static async verifyScan(req, res) {
        const id = req.params.id;
        const { verifiedData, notes, editedFields } = req.body;
        const scan = StoreService.getScan(id);
        if (!scan) {
            res.status(404).json({ error: 'ScanNotFound', message: `Scan with ID ${id} not found.` });
            return;
        }
        if (verifiedData) {
            scan.verifiedData = verifiedData;
            if (verifiedData.productName?.value && !verifiedData.productName.value.includes('Not detected')) {
                scan.productName = verifiedData.productName.value;
            }
            if (verifiedData.category?.value) {
                scan.category = verifiedData.category.value;
            }
        }
        scan.humanVerification = {
            isVerified: true,
            verifiedAt: new Date().toISOString(),
            verifiedBy: req.user?.email || 'Compliance Operator',
            editedFields: editedFields || [],
            notes: notes || 'Verified by human compliance operator'
        };
        // Re-evaluate deterministic rules with human verified data
        const evaluation = RuleEngineService.evaluateCompliance(scan.verifiedData || scan.extractedData, scan.conflicts);
        scan.status = evaluation.status;
        scan.overallScore = evaluation.overallScore;
        scan.ruleResults = evaluation.ruleResults;
        scan.passedCount = evaluation.passedCount;
        scan.needsVerificationCount = evaluation.needsVerificationCount;
        scan.potentialIssueCount = evaluation.potentialIssueCount;
        scan.executiveSummary = evaluation.executiveSummary;
        StoreService.saveScan(scan);
        res.json({
            success: true,
            message: 'Human verification changes recorded and regulatory compliance re-computed.',
            scan
        });
    }
    static async getCompliance(req, res) {
        const id = req.params.id;
        const scan = StoreService.getScan(id);
        if (!scan) {
            res.status(404).json({ error: 'ScanNotFound', message: `Scan with ID ${id} not found.` });
            return;
        }
        res.json({
            success: true,
            status: scan.status,
            overallScore: scan.overallScore,
            ruleResults: scan.ruleResults,
            conflicts: scan.conflicts,
            passedCount: scan.passedCount,
            needsVerificationCount: scan.needsVerificationCount,
            potentialIssueCount: scan.potentialIssueCount,
            executiveSummary: scan.executiveSummary
        });
    }
    static async getScan(req, res) {
        const id = req.params.id;
        const scan = StoreService.getScan(id);
        if (!scan) {
            res.status(404).json({ error: 'ScanNotFound', message: `Scan with ID ${id} not found.` });
            return;
        }
        res.json({ success: true, scan });
    }
    static async listScans(req, res) {
        const userId = req.user?.id;
        const scans = StoreService.listScans(userId);
        res.json({ success: true, scans, total: scans.length });
    }
    static async deleteScan(req, res) {
        const id = req.params.id;
        const deleted = StoreService.deleteScan(id);
        if (!deleted) {
            res.status(404).json({ error: 'CannotDelete', message: `Scan with ID ${id} cannot be deleted or does not exist.` });
            return;
        }
        res.json({ success: true, message: 'Scan deleted successfully.' });
    }
}
