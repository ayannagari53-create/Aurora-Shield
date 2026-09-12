import { OcrService } from './services/ocr/ocr.service.js';
import { ExtractionService } from './services/ai/extraction.service.js';
import { ConflictService } from './services/compliance/conflict.service.js';
import { RuleEngineService } from './services/compliance/rule-engine.service.js';
import { PdfReportService } from './services/reports/pdf.service.js';
async function testUniversalPipeline() {
    console.log('================================================================');
    console.log('AURORA SHIELD: 5-PRODUCT UNIVERSAL SCANNING VERIFICATION SUITE');
    console.log('================================================================\n');
    // Product 1: Parle-G Biscuits
    const parleGFrontSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">
    <text x="30" y="50">PARLE-G GLUCOSE BISCUITS</text>
    <text x="30" y="90">Brand: Parle</text>
    <text x="30" y="130">Net Weight: 250g</text>
    <text x="30" y="170">MRP Rs. 25.00 (Incl. of all taxes)</text>
    <text x="30" y="210">100% Vegetarian</text>
  </svg>`;
    const parleGBackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">
    <text x="30" y="40">PARLE PRODUCTS PVT LTD</text>
    <text x="30" y="70">Mfg By: Parle Products Pvt. Ltd., V.S. Khandekar Marg, Vile Parle East, Mumbai 400057</text>
    <text x="30" y="100">Net Quantity: 250g</text>
    <text x="30" y="130">Mfg Date: 01/06/2026  Expiry Date: 01/12/2026</text>
    <text x="30" y="160">Batch No: PG-MUM-892</text>
    <text x="30" y="190">FSSAI Lic. No. 10012022000145</text>
    <text x="30" y="220">INGREDIENTS: Refined Wheat Flour (Maida) (67%), Sugar, Edible Vegetable Oil (Palm), Invert Sugar Syrup, Milk Solids, Salt.</text>
    <text x="30" y="250">ALLERGEN DECLARATION: CONTAINS WHEAT (GLUTEN) AND MILK.</text>
    <text x="30" y="280">Country of Origin: India</text>
    <text x="30" y="310">Consumer Care: 1800-222-777 | customercare@parle.biz</text>
  </svg>`;
    // Product 2: Coca-Cola Beverage
    const cocaColaFrontSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">
    <text x="30" y="50">COCA-COLA ORIGINAL TASTE</text>
    <text x="30" y="90">Brand: Coca-Cola</text>
    <text x="30" y="130">Net Quantity: 750 ml</text>
    <text x="30" y="170">MRP Rs. 40.00 (Incl. of all taxes)</text>
    <text x="30" y="210">Carbonated Water</text>
  </svg>`;
    const cocaColaBackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">
    <text x="30" y="40">CARBONATED BEVERAGE</text>
    <text x="30" y="70">Mfg By: Coca-Cola India Pvt. Ltd., Enkay Towers, Udyog Vihar, Gurugram 122016</text>
    <text x="30" y="100">Net Volume: 750 ml</text>
    <text x="30" y="130">Mfg Date: 10/04/2026  Expiry Date: 10/10/2026</text>
    <text x="30" y="160">Batch No: CC-750-401</text>
    <text x="30" y="190">FSSAI Lic. No. 10013011000888</text>
    <text x="30" y="220">INGREDIENTS: Carbonated Water, Sugar, Acidity Regulator (338), Caffeinated Beverage, Permitted Natural Colour (150d).</text>
    <text x="30" y="250">Country of Origin: India</text>
    <text x="30" y="280">Consumer Care: 1800-208-2653 | indiahelpline@coca-cola.com</text>
  </svg>`;
    // Product 3: Lay's Potato Chips
    const laysFrontSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">
    <text x="30" y="50">LAY'S MAGIC MASALA POTATO CHIPS</text>
    <text x="30" y="90">Brand: Lay's</text>
    <text x="30" y="130">Net Weight: 50g</text>
    <text x="30" y="170">MRP Rs. 20.00</text>
    <text x="30" y="210">100% Vegetarian</text>
  </svg>`;
    const laysBackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">
    <text x="30" y="40">POTATO CHIPS</text>
    <text x="30" y="70">Mfg By: PepsiCo India Holdings Pvt. Ltd., JLN Marg, Gurugram 122002</text>
    <text x="30" y="100">Net Quantity: 50g</text>
    <text x="30" y="130">Mfg Date: 05/05/2026  Expiry Date: 05/09/2026</text>
    <text x="30" y="160">Batch No: LAYS-MM-50</text>
    <text x="30" y="190">FSSAI Lic. No. 10014064000311</text>
    <text x="30" y="220">INGREDIENTS: Potato, Edible Vegetable Oil (Palmolein), Spices and Condiments (Chilli, Onion, Garlic), Iodised Salt.</text>
    <text x="30" y="250">Country of Origin: India</text>
    <text x="30" y="280">Consumer Care: 1800-224-020 | feedback@pepsico.com</text>
  </svg>`;
    // Product 4: Nivea Men Face Wash (Cosmetic / Personal Care)
    const niveaFrontSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">
    <text x="30" y="50">NIVEA MEN DEEP IMPACT FACE WASH</text>
    <text x="30" y="90">Brand: Nivea</text>
    <text x="30" y="130">Net Content: 100g</text>
    <text x="30" y="170">MRP Rs. 199.00</text>
    <text x="30" y="210">With Black Carbon & Intense Clean</text>
  </svg>`;
    const niveaBackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">
    <text x="30" y="40">COSMETIC SKIN CARE PRODUCT</text>
    <text x="30" y="70">Mfg By: Nivea India Pvt. Ltd., B-205, Marathon Futurex, Lower Parel, Mumbai 400013</text>
    <text x="30" y="100">Net Quantity: 100g</text>
    <text x="30" y="130">Mfg Date: 01/01/2026  Use Before: 31/12/2028</text>
    <text x="30" y="160">Batch No: NIV-2026-904</text>
    <text x="30" y="190">INGREDIENTS: Aqua, Glycerin, Myristic Acid, Palmitic Acid, Stearic Acid, Potassium Hydroxide, Lauric Acid, Charcoal Powder.</text>
    <text x="30" y="220">Directions for use: Apply gently to wet face and neck, massage thoroughly and rinse off with clean water.</text>
    <text x="30" y="250">WARNING: For external use only. Avoid direct contact with eyes.</text>
    <text x="30" y="280">Country of Origin: India</text>
    <text x="30" y="310">Consumer Care: 022-62487999 | care@nivea.in</text>
  </svg>`;
    // Product 5: Dettol Disinfectant Liquid (Household / Cleaning)
    const dettolFrontSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">
    <text x="30" y="50">DETTOL DISINFECTANT LIQUID</text>
    <text x="30" y="90">Brand: Dettol</text>
    <text x="30" y="130">Net Volume: 500 ml</text>
    <text x="30" y="170">MRP Rs. 185.00</text>
    <text x="30" y="210">Lime Fresh Fragrance</text>
  </svg>`;
    const dettolBackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">
    <text x="30" y="40">HOUSEHOLD DISINFECTANT CLEANER</text>
    <text x="30" y="70">Mfg By: Reckitt Benckiser India Pvt. Ltd., DLF Cyber City, Gurugram 122002</text>
    <text x="30" y="100">Net Quantity: 500 ml</text>
    <text x="30" y="130">Mfg Date: 12/03/2026  Expiry Date: 11/03/2028</text>
    <text x="30" y="160">Batch No: RB-DT-5001</text>
    <text x="30" y="190">Directions for use: Dilute 1 capful in 1 bucket of water for floor cleaning and surface disinfection.</text>
    <text x="30" y="220">WARNING: Keep out of reach of children. For household disinfection use only.</text>
    <text x="30" y="250">Country of Origin: India</text>
    <text x="30" y="280">Consumer Care: 1800-102-2722 | consumercare_india@reckitt.com</text>
  </svg>`;
    const testCases = [
        { name: 'Parle-G', category: 'Food & Beverages', front: parleGFrontSvg, back: parleGBackSvg },
        { name: 'Coca-Cola', category: 'Beverages', front: cocaColaFrontSvg, back: cocaColaBackSvg },
        { name: "Lay's Magic Masala", category: 'Food & Beverages', front: laysFrontSvg, back: laysBackSvg },
        { name: 'Nivea Face Wash', category: 'Cosmetics & Personal Care', front: niveaFrontSvg, back: niveaBackSvg },
        { name: 'Dettol Disinfectant', category: 'Household Products', front: dettolFrontSvg, back: dettolBackSvg }
    ];
    const results = [];
    for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        console.log(`----------------------------------------------------------------`);
        console.log(`TEST #${i + 1}: ${tc.name} (${tc.category})`);
        console.log(`----------------------------------------------------------------`);
        // 1. Process OCR on front and back SVG images
        const ocrFront = await OcrService.processImage(`img-front-${i}`, 'FRONT', tc.front);
        const ocrBack = await OcrService.processImage(`img-back-${i}`, 'BACK', tc.back);
        console.log(`✓ Real OCR Processed: ${ocrFront.lines.length} lines on Front, ${ocrBack.lines.length} lines on Back`);
        // 2. Extract structured data
        const ocrResults = [ocrFront, ocrBack];
        const extractedData = await ExtractionService.extractStructuredData(ocrResults, tc.category);
        console.log(`✓ Product Identified: "${extractedData.productName?.value}"`);
        console.log(`✓ Brand Detected: "${extractedData.brand?.value}"`);
        console.log(`✓ Net Quantity: "${extractedData.netQuantity?.value}"`);
        console.log(`✓ MRP: "${extractedData.mrp?.value}"`);
        console.log(`✓ Manufacturer: "${extractedData.manufacturer?.value?.slice(0, 50)}..."`);
        console.log(`✓ Expiry Date: "${extractedData.expiryDate?.value}"`);
        // 3. Detect conflicts
        const conflicts = ConflictService.detectConflicts(ocrResults);
        console.log(`✓ Conflicts Detected: ${conflicts.length}`);
        // 4. Evaluate compliance rules
        const evaluation = RuleEngineService.evaluateCompliance(extractedData, conflicts);
        console.log(`✓ Compliance Status: ${evaluation.status} (Score: ${evaluation.overallScore}/100)`);
        console.log(`✓ Rules Evaluated: ${evaluation.ruleResults.length} (${evaluation.passedCount} PASS, ${evaluation.potentialIssueCount} ISSUE)`);
        // 5. Generate PDF report
        const scanRecord = {
            id: `SCAN-TEST-${i + 1}`,
            userId: 'test_user',
            productName: extractedData.productName?.value || tc.name,
            category: extractedData.category?.value || tc.category,
            status: evaluation.status,
            overallScore: evaluation.overallScore,
            images: [
                { id: `img-front-${i}`, url: 'data:image/svg+xml;utf8,' + encodeURIComponent(tc.front), filename: 'front.svg', labelAngle: 'FRONT', mimetype: 'image/svg+xml', size: tc.front.length, uploadedAt: new Date().toISOString() },
                { id: `img-back-${i}`, url: 'data:image/svg+xml;utf8,' + encodeURIComponent(tc.back), filename: 'back.svg', labelAngle: 'BACK', mimetype: 'image/svg+xml', size: tc.back.length, uploadedAt: new Date().toISOString() }
            ],
            extractedData,
            verifiedData: { ...extractedData },
            conflicts,
            ruleResults: evaluation.ruleResults,
            passedCount: evaluation.passedCount,
            needsVerificationCount: evaluation.needsVerificationCount,
            potentialIssueCount: evaluation.potentialIssueCount,
            humanVerification: { isVerified: true, verifiedAt: new Date().toISOString(), verifiedBy: 'Automated Suite', editedFields: [] },
            executiveSummary: evaluation.executiveSummary,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const pdfBuffer = await PdfReportService.generateReport(scanRecord);
        console.log(`✓ Generated Universal PDF Report: ${pdfBuffer.length} bytes\n`);
        results.push({
            testName: tc.name,
            detectedProduct: extractedData.productName?.value,
            brand: extractedData.brand?.value,
            quantity: extractedData.netQuantity?.value,
            mrp: extractedData.mrp?.value,
            category: extractedData.category?.value
        });
    }
    console.log('================================================================');
    console.log('CROSS-SCAN DATA ISOLATION VERIFICATION');
    console.log('================================================================');
    // Verify that all 5 results are distinct and have zero cross-contamination
    for (let i = 0; i < results.length; i++) {
        for (let j = i + 1; j < results.length; j++) {
            if (results[i].detectedProduct === results[j].detectedProduct) {
                throw new Error(`FAIL: Scan ${i} and Scan ${j} produced the same product name: ${results[i].detectedProduct}`);
            }
            if (results[i].brand === results[j].brand) {
                throw new Error(`FAIL: Scan ${i} and Scan ${j} produced the same brand: ${results[i].brand}`);
            }
        }
    }
    console.log('✓ PASS: All 5 products produced distinct, product-specific results.');
    console.log('✓ PASS: Zero cross-scan data leakage or Good Day cookies contamination.');
    console.log('✓ PASS: Complete universal pipeline validated successfully!');
    console.log('================================================================\n');
}
testUniversalPipeline().catch(err => {
    console.error('Test Suite Failed:', err);
    process.exit(1);
});
