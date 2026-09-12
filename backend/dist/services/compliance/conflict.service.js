export class ConflictService {
    /**
     * Cross-evaluates extractions across multiple label images (Front, Back, Side, etc.)
     * to detect contradictions, quantitative discrepancies, or conflicting regulatory claims.
     * Universal for ANY uploaded product.
     */
    static detectConflicts(ocrResults) {
        const conflicts = [];
        if (!ocrResults || ocrResults.length === 0)
            return conflicts;
        // Helper maps for attributes per image angle
        const quantityMap = [];
        const mrpMap = [];
        const nameMap = [];
        for (const res of ocrResults) {
            // 1. Check Net Quantity
            const qtyMatch = res.rawText.match(/(?:Net\s*(?:Weight|Qty|Quantity|Content|Vol)|Weight|Qty)[:\s]*([0-9]+(?:\.[0-9]+)?\s*(?:g|kg|ml|l|gm|grams|pieces|pcs|N))\b/i);
            if (qtyMatch) {
                quantityMap.push({
                    sourceAngle: res.labelAngle,
                    sourceImageId: res.imageId,
                    value: qtyMatch[1].trim(),
                    confidence: 0.94
                });
            }
            // 2. Check MRP
            const mrpMatch = res.rawText.match(/(?:MRP|M\.R\.P\.|Rs\.|₹)[:\s]*([0-9]+(?:\.[0-9]{2})?)/i);
            if (mrpMatch) {
                mrpMap.push({
                    sourceAngle: res.labelAngle,
                    sourceImageId: res.imageId,
                    value: `₹${mrpMatch[1].trim()}`,
                    confidence: 0.95
                });
            }
            // 3. Check Title/Heading lines on each panel
            const firstSignificant = res.lines?.find(l => l.text.length > 3 && !/^(?:net|mrp|rs|₹|batch|mfg|exp|fssai)/i.test(l.text));
            if (firstSignificant) {
                nameMap.push({
                    sourceAngle: res.labelAngle,
                    sourceImageId: res.imageId,
                    value: firstSignificant.text.trim(),
                    confidence: 0.90
                });
            }
        }
        // 1. Conflict on Net Quantity (e.g. Front declares 100g vs Back declares 120g)
        if (quantityMap.length >= 2) {
            const distinctQtys = Array.from(new Set(quantityMap.map(q => q.value.toLowerCase().replace(/\s+/g, ''))));
            if (distinctQtys.length > 1) {
                conflicts.push({
                    id: 'CONF-QTY-001',
                    field: 'netQuantity',
                    fieldLabel: 'Net Quantity Declaration',
                    description: 'Net quantity differs across primary display panel and statutory declaration panel.',
                    severity: 'HIGH',
                    discrepantValues: quantityMap,
                    recommendation: 'Reconcile declared nominal quantity between principal display panel and back-of-pack statutory declarations to prevent Legal Metrology violation.'
                });
            }
        }
        // 2. Conflict on MRP (e.g. Front: ₹20 vs Back: ₹30)
        if (mrpMap.length >= 2) {
            const distinctMrp = Array.from(new Set(mrpMap.map(m => m.value.toLowerCase().replace(/\s+/g, ''))));
            if (distinctMrp.length > 1) {
                conflicts.push({
                    id: 'CONF-MRP-002',
                    field: 'mrp',
                    fieldLabel: 'Maximum Retail Price (MRP)',
                    description: 'Dual or inconsistent MRP values declared across outer packaging faces.',
                    severity: 'HIGH',
                    discrepantValues: mrpMap,
                    recommendation: 'Ensure uniform MRP declaration in compliance with Legal Metrology (Packaged Commodities) Rules.'
                });
            }
        }
        // 3. Claims vs Ingredients Contradictions
        const allRawText = ocrResults.map(r => r.rawText).join('\n').toLowerCase();
        const frontRaw = ocrResults.find(r => r.labelAngle === 'FRONT')?.rawText.toLowerCase() || '';
        const ingRaw = ocrResults.find(r => r.labelAngle === 'INGREDIENTS')?.rawText.toLowerCase() || allRawText;
        // Trans fat claim vs partially hydrogenated oil
        if ((allRawText.includes('trans fat free') || frontRaw.includes('trans fat free')) && ingRaw.includes('partially hydrogenated')) {
            conflicts.push({
                id: 'CONF-CLAIM-003',
                field: 'labelClaims',
                fieldLabel: 'Label Claim vs Ingredients Contradiction',
                description: 'Front panel claims "Trans Fat Free" but ingredient list declares partially hydrogenated vegetable oils.',
                severity: 'HIGH',
                discrepantValues: [
                    { sourceAngle: 'FRONT', sourceImageId: ocrResults[0]?.imageId || 'img-1', value: 'Trans Fat Free Claim', confidence: 0.95 },
                    { sourceAngle: 'INGREDIENTS', sourceImageId: ocrResults[1]?.imageId || 'img-2', value: 'Partially Hydrogenated Fat Ingredient', confidence: 0.90 }
                ],
                recommendation: 'Remove trans-fat free claim or reformulate oil base to conform to FSSAI Trans Fatty Acid Limits.'
            });
        }
        // Sugar free claim vs Sugar/Syrup ingredient
        if ((allRawText.includes('sugar free') || frontRaw.includes('sugar free') || allRawText.includes('no added sugar')) && (ingRaw.includes('sugar,') || ingRaw.includes('invert sugar') || ingRaw.includes('high fructose corn syrup') || ingRaw.includes('liquid glucose'))) {
            conflicts.push({
                id: 'CONF-SUGAR-004',
                field: 'labelClaims',
                fieldLabel: 'Sugar Claim vs Ingredients Contradiction',
                description: 'Packaging highlights "Sugar Free" / "No Added Sugar" but ingredients declare added sugar or caloric syrups.',
                severity: 'HIGH',
                discrepantValues: [
                    { sourceAngle: 'FRONT', sourceImageId: ocrResults[0]?.imageId || 'img-1', value: 'Sugar Free / No Added Sugar Claim', confidence: 0.95 },
                    { sourceAngle: 'INGREDIENTS', sourceImageId: ocrResults[1]?.imageId || 'img-2', value: 'Sugar / Syrups declared in ingredients', confidence: 0.90 }
                ],
                recommendation: 'Align front-of-pack claims with statutory nutrient composition.'
            });
        }
        return conflicts;
    }
}
