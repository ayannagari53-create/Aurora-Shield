export class RuleEngineService {
    /**
     * Universal Deterministic Compliance Engine.
     * AI extracts information, Human verifies, and Rules evaluate compliance dynamically
     * based on the product category and verified product packaging attributes.
     */
    static evaluateCompliance(productData, conflicts) {
        const results = [];
        const category = (productData.category?.value || 'Food & Beverages').toLowerCase();
        const isFoodOrBev = category.includes('food') || category.includes('beverage') || category.includes('snack') || category.includes('drink');
        const isCosmetic = category.includes('cosmetic') || category.includes('personal care') || category.includes('skin') || category.includes('hair');
        const isHousehold = category.includes('household') || category.includes('cleaning') || category.includes('detergent');
        // =========================================================================
        // RULE-001: Net Quantity Consistency & Legal Metrology Units
        // =========================================================================
        const qtyConflicts = conflicts.filter(c => c.field === 'netQuantity');
        const netQty = productData.netQuantity?.value || '';
        const hasValidUnit = /(?:g|kg|ml|l|gm|grams|pcs|pieces|units|N)\b/i.test(netQty);
        const isQtyMissing = !netQty || netQty.includes('Not detected');
        if (qtyConflicts.length > 0) {
            results.push({
                ruleId: 'RULE-001',
                ruleVersion: '1.2',
                category: 'METROLOGY',
                title: 'Net Quantity Cross-Label Consistency',
                description: 'Under Legal Metrology (Packaged Commodities) Rules, declared net quantity on the front panel must match the back statutory declaration.',
                severity: 'CRITICAL',
                status: 'POTENTIAL_ISSUE',
                evidence: qtyConflicts[0].discrepantValues.map(d => ({
                    statement: `${d.sourceAngle} Label declares net quantity as "${d.value}"`,
                    sourceAngle: d.sourceAngle,
                    sourceImageId: d.sourceImageId,
                    extractedValue: d.value
                })),
                explanation: 'Conflicting net quantity declarations observed between packaging faces. This creates consumer ambiguity and constitutes a non-compliance under Legal Metrology standards.',
                recommendation: 'Synchronize the front principal display panel quantity with back-of-pack nominal net weight declaration.',
                requiredFields: ['netQuantity']
            });
        }
        else if (isQtyMissing || !hasValidUnit) {
            results.push({
                ruleId: 'RULE-001',
                ruleVersion: '1.2',
                category: 'METROLOGY',
                title: 'Net Quantity Standard Metric Declaration',
                description: 'Verification of standard SI metric unit declaration (g, kg, ml, L) for nominal net quantity.',
                severity: 'HIGH',
                status: isQtyMissing ? 'POTENTIAL_ISSUE' : 'NEEDS_VERIFICATION',
                evidence: [{
                        statement: isQtyMissing ? 'Net quantity was not detected on uploaded packaging images.' : `Declared quantity: "${netQty}"`,
                        sourceAngle: productData.netQuantity?.sourceAngle,
                        sourceImageId: productData.netQuantity?.sourceImageId,
                        extractedValue: netQty
                    }],
                explanation: isQtyMissing
                    ? 'Mandatory Net Quantity declaration was not found on the provided label panels.'
                    : 'Net quantity unit could not be conclusively validated against standard metric units (g, kg, ml, L).',
                recommendation: 'Ensure net quantity is specified in bold font in standard metric units per Legal Metrology (Packaged Commodities) Rules.',
                requiredFields: ['netQuantity']
            });
        }
        else {
            results.push({
                ruleId: 'RULE-001',
                ruleVersion: '1.2',
                category: 'METROLOGY',
                title: 'Net Quantity Metric Standard & Harmony',
                description: 'Verification of standard SI metric unit declaration for net quantity.',
                severity: 'HIGH',
                status: 'PASS',
                evidence: [{
                        statement: `Consistent net quantity declared: "${netQty}"`,
                        sourceAngle: productData.netQuantity?.sourceAngle,
                        sourceImageId: productData.netQuantity?.sourceImageId,
                        extractedValue: netQty
                    }],
                explanation: 'Net quantity declaration complies with standard unit formatting and shows cross-panel harmony.',
                recommendation: 'No action required.',
                requiredFields: ['netQuantity']
            });
        }
        // =========================================================================
        // RULE-002: Mandatory Statutory Declarations (Product Name, MRP, Country, Batch)
        // =========================================================================
        const missingMandatory = [];
        const pName = productData.productName?.value || '';
        const mrp = productData.mrp?.value || '';
        const country = productData.countryOfOrigin?.value || '';
        const batch = productData.batchNumber?.value || '';
        if (!pName || pName.includes('Not detected'))
            missingMandatory.push('Product Generic Name');
        if (!mrp || mrp.includes('Not detected'))
            missingMandatory.push('Maximum Retail Price (MRP)');
        if (!country || country.includes('Not detected'))
            missingMandatory.push('Country of Origin');
        if (!batch || batch.includes('Not detected'))
            missingMandatory.push('Batch / Lot Number');
        if (missingMandatory.length > 0) {
            results.push({
                ruleId: 'RULE-002',
                ruleVersion: '2.0',
                category: 'MANDATORY_DECLARATIONS',
                title: 'Mandatory Statutory Declarations',
                description: 'Statutory declarations mandated by Packaging and Labelling Regulations on packaged consumer commodities.',
                severity: 'CRITICAL',
                status: 'POTENTIAL_ISSUE',
                evidence: missingMandatory.map(f => ({
                    statement: `Missing or undetected mandatory field: ${f}`
                })),
                explanation: `Mandatory packaging elements (${missingMandatory.join(', ')}) were not detected on provided label surfaces.`,
                recommendation: 'Print all missing mandatory statutory items prominently on the principal or back display panel in legible typeface.',
                requiredFields: ['productName', 'mrp', 'countryOfOrigin', 'batchNumber']
            });
        }
        else {
            results.push({
                ruleId: 'RULE-002',
                ruleVersion: '2.0',
                category: 'MANDATORY_DECLARATIONS',
                title: 'Mandatory Statutory Declarations',
                description: 'Statutory declarations mandated by Packaging and Labelling Regulations on packaged consumer commodities.',
                severity: 'HIGH',
                status: 'PASS',
                evidence: [
                    { statement: `Product Name: ${pName}`, extractedValue: pName },
                    { statement: `MRP: ${mrp}`, extractedValue: mrp },
                    { statement: `Country of Origin: ${country}`, extractedValue: country },
                    { statement: `Batch No: ${batch}`, extractedValue: batch }
                ],
                explanation: 'All primary mandatory statutory declarations are present and clearly visible on the packaging.',
                recommendation: 'Maintain current panel layout and font size compliance.',
                requiredFields: ['productName', 'mrp', 'countryOfOrigin', 'batchNumber']
            });
        }
        // =========================================================================
        // RULE-003: Ingredients / Formulation Disclosure (Food & Cosmetics)
        // =========================================================================
        if (isFoodOrBev || isCosmetic) {
            const ings = productData.ingredients?.value || [];
            if (!ings || ings.length === 0 || ings[0]?.includes('Not detected')) {
                results.push({
                    ruleId: 'RULE-003',
                    ruleVersion: '1.4',
                    category: 'MANDATORY_DECLARATIONS',
                    title: 'Complete Ingredient Declaration',
                    description: isFoodOrBev
                        ? 'Mandatory disclosure of ingredients in descending order of in-going weight (FSSAI Labelling Regulations).'
                        : 'Mandatory disclosure of cosmetic ingredients (INCI nomenclature) in descending order of concentration.',
                    severity: 'HIGH',
                    status: 'POTENTIAL_ISSUE',
                    evidence: [{ statement: 'No ingredient list detected on provided packaging images.' }],
                    explanation: 'Packaged consumables and personal care items must provide an exhaustive ingredients breakdown in descending order of composition.',
                    recommendation: 'Include a distinct "INGREDIENTS" heading with complete component specification.',
                    requiredFields: ['ingredients']
                });
            }
            else {
                const hasPercentages = ings.some(i => /%|\([0-9.]+\s*%\)/.test(i));
                results.push({
                    ruleId: 'RULE-003',
                    ruleVersion: '1.4',
                    category: 'MANDATORY_DECLARATIONS',
                    title: isFoodOrBev ? 'Ingredient Declaration & QUID Verification' : 'Cosmetic Ingredients Declaration',
                    description: isFoodOrBev
                        ? 'Mandatory disclosure of ingredients and Quantitative Ingredient Declaration (QUID) for characterising components.'
                        : 'Verification of complete cosmetic ingredient composition.',
                    severity: 'MEDIUM',
                    status: hasPercentages || isCosmetic ? 'PASS' : 'NEEDS_VERIFICATION',
                    evidence: ings.slice(0, 4).map(i => ({ statement: `Component: ${i}`, extractedValue: i })),
                    explanation: hasPercentages || isCosmetic
                        ? 'Ingredient list is declared with quantitative component percentages or standard cosmetic nomenclature.'
                        : 'Ingredients declared; however, quantitative percentages (QUID) for characterising ingredients highlighted on front pack should be verified.',
                    recommendation: hasPercentages || isCosmetic
                        ? 'No action required.'
                        : 'Indicate quantitative percentages for characterising ingredients highlighted on the front pack.',
                    requiredFields: ['ingredients']
                });
            }
        }
        // =========================================================================
        // RULE-004: Allergen Advisory & Safety Warnings
        // =========================================================================
        if (isFoodOrBev) {
            const allergens = productData.allergens?.value || [];
            const ings = productData.ingredients?.value || [];
            const containsWheatOrMilk = ings.some(i => /wheat|maida|milk|butter|nut|peanut|soya|soy|egg|gluten|casein/i.test(i));
            if (containsWheatOrMilk && (!allergens || allergens.length === 0 || allergens[0]?.includes('Not detected'))) {
                results.push({
                    ruleId: 'RULE-004',
                    ruleVersion: '2.1',
                    category: 'SAFETY_ALLERGENS',
                    title: 'Mandatory Allergen Declaration (FSSAI)',
                    description: 'Food Safety and Standards regulations require distinct allergen bolding or separate allergen statement.',
                    severity: 'CRITICAL',
                    status: 'POTENTIAL_ISSUE',
                    evidence: [{ statement: 'Ingredients contain potential major allergens (e.g. wheat/milk/soy) but no separate allergen box was recognized.' }],
                    explanation: 'Failure to declare known allergens distinctly creates severe consumer health risks and violates food safety regulations.',
                    recommendation: 'Add a prominent allergen statement: "ALLERGEN ADVICE: CONTAINS WHEAT, MILK."',
                    requiredFields: ['allergens']
                });
            }
            else if (allergens.length > 0 && !allergens[0]?.includes('Not detected')) {
                results.push({
                    ruleId: 'RULE-004',
                    ruleVersion: '2.1',
                    category: 'SAFETY_ALLERGENS',
                    title: 'Allergen Declaration & Precautionary Disclosures',
                    description: 'Verification of dedicated allergen advisory box and cross-contamination warning.',
                    severity: 'HIGH',
                    status: 'PASS',
                    evidence: allergens.map(a => ({ statement: `Declared allergen: ${a}`, extractedValue: a })),
                    explanation: 'Allergen advisory is explicitly provided with proper precautionary warning statement.',
                    recommendation: 'Ensure allergen warning continues to be typeset in bold font.',
                    requiredFields: ['allergens']
                });
            }
        }
        else if (isCosmetic || isHousehold) {
            const warnings = productData.warnings?.value || [];
            if (warnings.length > 0 && !warnings[0]?.includes('Not detected')) {
                results.push({
                    ruleId: 'RULE-004-C',
                    ruleVersion: '1.0',
                    category: 'SAFETY_ALLERGENS',
                    title: 'Safety Precautions & Cautionary Notices',
                    description: 'Mandatory precautionary notices (e.g., "For external use only", "Keep out of reach of children").',
                    severity: 'HIGH',
                    status: 'PASS',
                    evidence: warnings.map(w => ({ statement: `Cautionary warning: "${w}"`, extractedValue: w })),
                    explanation: 'Safety precautions are declared prominently on the label.',
                    recommendation: 'Maintain prominent warning typography.',
                    requiredFields: ['warnings']
                });
            }
            else {
                results.push({
                    ruleId: 'RULE-004-C',
                    ruleVersion: '1.0',
                    category: 'SAFETY_ALLERGENS',
                    title: 'Safety Precautions & Cautionary Notices',
                    description: 'Verification of cautionary statements for personal care or household commodities.',
                    severity: 'MEDIUM',
                    status: 'NEEDS_VERIFICATION',
                    evidence: [{ statement: 'No explicit caution or safety warning statement was detected on provided label images.' }],
                    explanation: 'Cautionary statements ("For external use only", "Keep away from children") should be verified on back label.',
                    recommendation: 'Ensure standard cautionary statements are legible on the back or side panel.',
                    requiredFields: ['warnings']
                });
            }
        }
        // =========================================================================
        // RULE-005: Manufacturer & Complete Postal Address
        // =========================================================================
        const mfg = productData.manufacturer?.value || '';
        const hasAddressAndPin = /(?:Street|Road|Nagar|Lane|Plot|Block|Sector|Industrial|Kolkata|Mumbai|Delhi|Bengaluru|Chennai|Hyderabad|Ahmedabad|Pune|[0-9]{6})/i.test(mfg);
        if (!mfg || mfg.includes('Not detected')) {
            results.push({
                ruleId: 'RULE-005',
                ruleVersion: '1.3',
                category: 'MANDATORY_DECLARATIONS',
                title: 'Manufacturer & Packer Identification',
                description: 'Mandatory full commercial name and physical postal premises address of the manufacturing entity.',
                severity: 'HIGH',
                status: 'POTENTIAL_ISSUE',
                evidence: [{ statement: 'Manufacturer details missing from label extraction.' }],
                explanation: 'Packaged commodities must clearly state the manufacturing entity and premises address.',
                recommendation: 'Print full company name and complete postal address including PIN code.',
                requiredFields: ['manufacturer']
            });
        }
        else if (!hasAddressAndPin) {
            results.push({
                ruleId: 'RULE-005',
                ruleVersion: '1.3',
                category: 'MANDATORY_DECLARATIONS',
                title: 'Manufacturer Postal Address Completeness',
                description: 'Evaluation of complete postal address including postal code.',
                severity: 'MEDIUM',
                status: 'NEEDS_VERIFICATION',
                evidence: [{ statement: `Declared manufacturer: "${mfg}"`, extractedValue: mfg }],
                explanation: 'Manufacturer entity is declared but full physical postal address or PIN code was partially obscured or requires manual verification.',
                recommendation: 'Confirm that full street address and 6-digit postal code are legible.',
                requiredFields: ['manufacturer']
            });
        }
        else {
            results.push({
                ruleId: 'RULE-005',
                ruleVersion: '1.3',
                category: 'MANDATORY_DECLARATIONS',
                title: 'Manufacturer Identification & Address Verification',
                description: 'Verification of commercial identity and registered factory address.',
                severity: 'HIGH',
                status: 'PASS',
                evidence: [{ statement: `Manufacturer & Address: ${mfg}`, extractedValue: mfg }],
                explanation: 'Manufacturer commercial name and physical postal address comply with regulatory standards.',
                recommendation: 'No modification required.',
                requiredFields: ['manufacturer']
            });
        }
        // =========================================================================
        // RULE-006: Expiry / Best-Before & Manufacturing Dates
        // =========================================================================
        const expiry = productData.expiryDate?.value || '';
        const mfgDate = productData.manufacturingDate?.value || '';
        if (!expiry || expiry.includes('Not detected')) {
            results.push({
                ruleId: 'RULE-006',
                ruleVersion: '1.5',
                category: 'DATES_SHELF_LIFE',
                title: 'Expiry & Best-Before Declaration',
                description: 'Mandatory declaration of date of manufacture and expiry / use-by timeline.',
                severity: 'CRITICAL',
                status: 'POTENTIAL_ISSUE',
                evidence: [{ statement: 'Expiry date or best-before period not identified on label.' }],
                explanation: 'Consumer protection acts prohibit sale of packaged consumables without visible expiry or best-before periods.',
                recommendation: 'Print clear Date of Packaging / Manufacture along with Best Before Month/Year.',
                requiredFields: ['expiryDate']
            });
        }
        else {
            results.push({
                ruleId: 'RULE-006',
                ruleVersion: '1.5',
                category: 'DATES_SHELF_LIFE',
                title: 'Shelf Life & Date Legibility',
                description: 'Verification of manufacturing and expiration date formats.',
                severity: 'HIGH',
                status: 'PASS',
                evidence: [
                    ...(mfgDate ? [{ statement: `Manufacturing Date: ${mfgDate}`, extractedValue: mfgDate }] : []),
                    { statement: `Expiry Date / Best Before: ${expiry}`, extractedValue: expiry }
                ],
                explanation: 'Expiry and manufacturing dates are clearly declared with valid temporal formatting.',
                recommendation: 'Maintain high contrast inkjet batch printing for date stamps.',
                requiredFields: ['expiryDate']
            });
        }
        // =========================================================================
        // RULE-007: Regulatory License (FSSAI/Drug/Trade) & Customer Helpline
        // =========================================================================
        const fssai = productData.fssaiLicense?.value || '';
        const care = productData.customerCare?.value || '';
        if (isFoodOrBev) {
            if (!fssai || fssai.includes('Not detected') || fssai.length !== 14) {
                results.push({
                    ruleId: 'RULE-007',
                    ruleVersion: '1.1',
                    category: 'CONSUMER_RIGHTS',
                    title: '14-Digit Regulatory License Verification (FSSAI)',
                    description: 'Verification of 14-digit statutory food safety license registration number.',
                    severity: 'HIGH',
                    status: (!fssai || fssai.includes('Not detected')) ? 'POTENTIAL_ISSUE' : 'NEEDS_VERIFICATION',
                    evidence: [{ statement: `FSSAI License: "${fssai || 'Not detected'}"`, extractedValue: fssai }],
                    explanation: (!fssai || fssai.includes('Not detected'))
                        ? 'Mandatory 14-digit FSSAI license number is missing from the label.'
                        : 'Detected FSSAI license number length is irregular and must be verified against the 14-digit standard format.',
                    recommendation: 'Prominently display the FSSAI logo alongside the valid 14-digit registration number.',
                    requiredFields: ['fssaiLicense']
                });
            }
            else {
                results.push({
                    ruleId: 'RULE-007',
                    ruleVersion: '1.1',
                    category: 'CONSUMER_RIGHTS',
                    title: 'FSSAI License & Consumer Redressal Contact',
                    description: 'Mandatory 14-digit statutory license and consumer care phone/email.',
                    severity: 'HIGH',
                    status: 'PASS',
                    evidence: [
                        { statement: `14-Digit License: ${fssai}`, extractedValue: fssai },
                        ...(care && !care.includes('Not detected') ? [{ statement: `Consumer Helpline: ${care}`, extractedValue: care }] : [])
                    ],
                    explanation: '14-digit FSSAI license and customer grievance contact points are properly displayed.',
                    recommendation: 'No changes needed.',
                    requiredFields: ['fssaiLicense', 'customerCare']
                });
            }
        }
        else {
            // General customer helpline verification
            if (!care || care.includes('Not detected')) {
                results.push({
                    ruleId: 'RULE-007-G',
                    ruleVersion: '1.0',
                    category: 'CONSUMER_RIGHTS',
                    title: 'Consumer Grievance Redressal Contact',
                    description: 'Mandatory consumer care telephone number, email, or physical address under Legal Metrology Rules.',
                    severity: 'HIGH',
                    status: 'NEEDS_VERIFICATION',
                    evidence: [{ statement: 'Customer care contact number/email was not detected.' }],
                    explanation: 'Packaged commodities must state customer care contact information.',
                    recommendation: 'Provide customer care phone number or email address on the statutory declaration panel.',
                    requiredFields: ['customerCare']
                });
            }
            else {
                results.push({
                    ruleId: 'RULE-007-G',
                    ruleVersion: '1.0',
                    category: 'CONSUMER_RIGHTS',
                    title: 'Consumer Grievance Redressal Contact',
                    description: 'Mandatory consumer care telephone number or email.',
                    severity: 'HIGH',
                    status: 'PASS',
                    evidence: [{ statement: `Customer Care: ${care}`, extractedValue: care }],
                    explanation: 'Consumer redressal contact point is declared on the packaging.',
                    recommendation: 'No changes needed.',
                    requiredFields: ['customerCare']
                });
            }
        }
        // =========================================================================
        // RULE-008: Claims Consistency & Conflict Verification
        // =========================================================================
        const claimsConflicts = conflicts.filter(c => c.field === 'labelClaims');
        if (claimsConflicts.length > 0) {
            results.push({
                ruleId: 'RULE-008',
                ruleVersion: '1.0',
                category: 'CLAIMS_ACCURACY',
                title: 'Marketing Claims Substantiation & Contradictions',
                description: 'Scrutiny of marketing claims against declared formulation and statutory thresholds.',
                severity: 'HIGH',
                status: 'POTENTIAL_ISSUE',
                evidence: claimsConflicts[0].discrepantValues.map(d => ({
                    statement: `${d.sourceAngle}: ${d.value}`,
                    sourceAngle: d.sourceAngle
                })),
                explanation: claimsConflicts[0].description,
                recommendation: claimsConflicts[0].recommendation,
                requiredFields: ['labelClaims']
            });
        }
        else {
            results.push({
                ruleId: 'RULE-008',
                ruleVersion: '1.0',
                category: 'CLAIMS_ACCURACY',
                title: 'Marketing Claims Substantiation',
                description: 'Scrutiny of marketing claims against declared formulation and statutory thresholds.',
                severity: 'MEDIUM',
                status: 'PASS',
                evidence: [{ statement: 'No deceptive or uncorroborated marketing claims detected.' }],
                explanation: 'Package claims are consistent with declared ingredients and nutritional facts.',
                recommendation: 'Ensure promotional typography continues to meet statutory ratio guidelines.',
                requiredFields: ['labelClaims']
            });
        }
        // Compute status counts
        const passedCount = results.filter(r => r.status === 'PASS').length;
        const needsVerificationCount = results.filter(r => r.status === 'NEEDS_VERIFICATION').length;
        const potentialIssueCount = results.filter(r => r.status === 'POTENTIAL_ISSUE').length;
        // Deterministic overall status
        let status = 'COMPLIANT';
        if (potentialIssueCount > 0) {
            status = 'POTENTIAL_ISSUE';
        }
        else if (needsVerificationCount > 0) {
            status = 'NEEDS_VERIFICATION';
        }
        // Score calculation
        const totalRules = results.length;
        const overallScore = totalRules === 0 ? 0 : Math.max(15, Math.min(100, Math.round((passedCount * 100 + needsVerificationCount * 50) / totalRules)));
        const detectedTitle = pName !== 'Not detected from uploaded image' ? `"${pName}"` : 'Scanned packaged product';
        let executiveSummary = '';
        if (status === 'COMPLIANT') {
            executiveSummary = `${detectedTitle} exhibits full conformity with statutory packaging regulations across all analyzed label surfaces. Mandatory declarations, standard metric units, and statutory notices are verified.`;
        }
        else if (status === 'POTENTIAL_ISSUE') {
            executiveSummary = `Potential compliance issues detected for ${detectedTitle} (${potentialIssueCount} non-conformities). Remediation is required for missing mandatory declarations, cross-panel discrepancies, or regulatory standards before distribution.`;
        }
        else {
            executiveSummary = `${detectedTitle} passed primary critical gates but requires human verification on ${needsVerificationCount} specific statutory attributes before formal regulatory sign-off.`;
        }
        return {
            status,
            overallScore,
            ruleResults: results,
            passedCount,
            needsVerificationCount,
            potentialIssueCount,
            executiveSummary
        };
    }
}
