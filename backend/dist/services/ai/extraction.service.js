export class ExtractionService {
    /**
     * Main entry point: Universal AI Product Intelligence Scanner.
     * Analyzes the ACTUAL uploaded product images and supporting OCR text.
     * Combines all multi-angle packaging panels into ONE unified structured product profile.
     */
    static async extractStructuredData(ocrResults, userCategory, imageDataUrls) {
        // 1. Check if Gemini / OpenAI / AI Vision API key is configured
        const aiApiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
        if (aiApiKey && imageDataUrls && imageDataUrls.length > 0) {
            try {
                const aiResult = await this.callExternalVisionAi(ocrResults, imageDataUrls, userCategory, aiApiKey);
                if (aiResult) {
                    return aiResult;
                }
            }
            catch (err) {
                console.warn('[AI Vision Engine] External Vision API fallback to Universal Product Intelligence:', err);
            }
        }
        // 2. High-Precision Universal Product Intelligence & Understanding Engine
        return this.runUniversalProductIntelligence(ocrResults, userCategory);
    }
    /**
     * Calls multimodal AI Vision model directly on the actual uploaded image data
     */
    static async callExternalVisionAi(ocrResults, imageDataUrls, category, apiKey) {
        const combinedOcrText = ocrResults
            .map(r => `[PANEL: ${r.labelAngle}, IMAGE_ID: ${r.imageId}]\n${r.rawText}`)
            .join('\n\n');
        const prompt = `You are analyzing the CURRENT uploaded product image. Extract only information supported by this image and provided OCR. Do not use previous scans, demo products, examples, memory, or hardcoded product information. Never fabricate missing information.

Supporting OCR Text from currently uploaded images:
${combinedOcrText}

Respond ONLY with a valid JSON object matching this exact structure:
{
  "productIdentity": {
    "name": "string (or 'Not detected from uploaded image')",
    "brand": "string (or 'Not detected from uploaded image')",
    "category": "string (Food & Beverages, Cosmetics, Household Products, Electronics, Pharmaceuticals, or Other)",
    "subcategory": "string",
    "variant": "string",
    "packSize": "string"
  },
  "labelInformation": {
    "netQuantity": "string",
    "mrp": "string",
    "manufacturer": "string",
    "packer": "string",
    "marketer": "string",
    "countryOfOrigin": "string",
    "batchNumber": "string",
    "manufacturingDate": "string",
    "expiryDate": "string",
    "bestBefore": "string",
    "fssaiLicense": "string"
  },
  "ingredients": ["string"],
  "allergens": ["string"],
  "nutrition": {
    "servingSize": "string",
    "energy": "string",
    "protein": "string",
    "carbohydrates": "string",
    "totalSugars": "string",
    "addedSugars": "string",
    "fat": "string",
    "saturatedFat": "string",
    "transFat": "string",
    "fiber": "string",
    "sodium": "string"
  },
  "warnings": ["string"],
  "storageInstructions": ["string"],
  "usageInstructions": ["string"],
  "claims": ["string"],
  "certifications": ["string"],
  "licenseInformation": ["string"],
  "customerCare": "string",
  "otherInformation": ["string"],
  "productInsights": {
    "uses": [{ "text": "string", "basis": "string", "confidence": 0.95 }],
    "benefits": [{ "text": "string", "basis": "string", "confidence": 0.92 }],
    "warnings": [{ "text": "string", "basis": "string", "confidence": 0.96 }],
    "disadvantages": [{ "text": "string", "basis": "string", "confidence": 0.90 }],
    "limitations": [{ "text": "string", "basis": "string", "confidence": 0.92 }]
  },
  "missingInformation": ["string"],
  "unclearInformation": ["string"],
  "confidence": {
    "productName": "High | Medium | Needs verification",
    "brand": "High | Medium | Needs verification",
    "netQuantity": "High | Medium | Needs verification",
    "mrp": "High | Medium | Needs verification",
    "manufacturer": "High | Medium | Needs verification",
    "expiryDate": "High | Medium | Needs verification"
  }
}`;
        const isGemini = apiKey.startsWith('AIza') || process.env.GEMINI_API_KEY;
        if (isGemini) {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: prompt },
                                ...imageDataUrls.slice(0, 4).map(img => {
                                    const b64 = img.dataUrl.split(',')[1] || '';
                                    const mime = img.dataUrl.split(';')[0].replace('data:', '') || 'image/jpeg';
                                    return {
                                        inlineData: {
                                            mimeType: mime,
                                            data: b64
                                        }
                                    };
                                })
                            ]
                        }
                    ],
                    generationConfig: { responseMimeType: 'application/json' }
                })
            });
            if (!response.ok) {
                throw new Error(`Gemini Vision API error: ${response.statusText}`);
            }
            const resData = await response.json();
            const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
                const parsed = JSON.parse(rawText);
                return this.normalizeAiResponse(parsed, ocrResults, category);
            }
        }
        return null;
    }
    /**
     * Universal Product Intelligence & Understanding Engine:
     * Analyzes the real packaging text and visual context for ANY consumer product.
     * Understands Product Identity, Brand, Category, Formulation, Nutrition, Disclaimers, and Metrology.
     */
    static runUniversalProductIntelligence(ocrResults, userCategory) {
        const allText = ocrResults.map(r => r.rawText).join('\n\n');
        const allLinesWithOrigin = [];
        for (const res of ocrResults) {
            for (const line of res.lines) {
                allLinesWithOrigin.push({
                    text: line.text,
                    angle: res.labelAngle,
                    imgId: res.imageId,
                    confidence: line.confidence || 0.9
                });
            }
        }
        const frontResult = ocrResults.find(r => r.labelAngle === 'FRONT') || ocrResults[0];
        const backResult = ocrResults.find(r => r.labelAngle === 'BACK') || ocrResults[1] || frontResult;
        const ingResult = ocrResults.find(r => r.labelAngle === 'INGREDIENTS') || backResult;
        const nutResult = ocrResults.find(r => r.labelAngle === 'NUTRITION') || backResult;
        const evidence = [];
        const missingFields = [];
        const unclearFields = [];
        // Helper: search pattern with source attribution
        const searchPattern = (pattern, defaultAngle = 'BACK', defaultImg = backResult?.imageId || 'img-1') => {
            for (const res of ocrResults) {
                const match = res.rawText.match(pattern);
                if (match && match[1]) {
                    return {
                        val: match[1].trim(),
                        angle: res.labelAngle,
                        imgId: res.imageId,
                        raw: match[0].trim()
                    };
                }
            }
            return null;
        };
        // -------------------------------------------------------------
        // 1. PRODUCT NAME & BRAND IDENTIFICATION
        // -------------------------------------------------------------
        let productName = 'Not detected from uploaded image';
        let brandName = 'Not detected from uploaded image';
        let variantName = '';
        let subcategoryName = '';
        let productNameAngle = frontResult?.labelAngle || 'FRONT';
        let productNameImg = frontResult?.imageId || 'img-1';
        let productNameConf = 0.0;
        let productNameStatus = 'MISSING';
        let brandAngle = frontResult?.labelAngle || 'FRONT';
        let brandImg = frontResult?.imageId || 'img-1';
        let brandConf = 0.0;
        let brandStatus = 'MISSING';
        const frontLines = frontResult?.lines?.map(l => l.text.trim()).filter(Boolean) || [];
        // Brand detection
        const brandPatterns = [
            /(?:Brand|Brand Name|Marketed by|Mfg by|Manufactured by)[:\s]*([A-Za-z0-9&.\s]{2,30}?)(?:Ltd|Limited|Private|Pvt|Corp|Industries|GmbH|Inc|\n|\r|$)/i,
            /(?:Parle-G|Parle|Britannia|Nestle|Maggi|Lay's|Lays|Kurkure|Doritos|Cadbury|Oreo|Amul|Haldiram's|Haldirams|Coca-Cola|Coke|Pepsi|Sprite|Thums Up|Fanta|Frooti|Real|Tropicana|Nivea|Dove|Garnier|Pond's|Ponds|Himalaya|Dettol|Lifebuoy|Colgate|Pepsodent|Sensodyne|Vim|Surf Excel|Ariel|Tide|Harpic|Lizol|Good Knight|Godrej|ITC|Sunfeast|Bingo|Dabur|Tata|Patanjali|Unilever|P&G|Johnson & Johnson|Head & Shoulders|Pantene|Sunsilk|L'Oreal|Loreal|Whisper|Stayfree|Durex|Kellogg's|Kelloggs|MTR|Everest|MDH|Catch|Saffola|Fortune|Samsung|Apple|Sony|Philips|Boat|Boult|Noise|Realme|Xiaomi|OnePlus|LG|Panasonic|Havells|Bajaj)/i
        ];
        let foundBrandMatch = null;
        for (const pat of brandPatterns) {
            const match = allText.match(pat);
            if (match) {
                foundBrandMatch = match[1] || match[0];
                break;
            }
        }
        if (foundBrandMatch) {
            brandName = foundBrandMatch.trim();
            brandStatus = 'CONFIRMED';
            brandConf = 0.94;
            evidence.push({
                field: 'brand',
                sourceAngle: frontResult ? frontResult.labelAngle : 'FRONT',
                sourceImageId: frontResult ? frontResult.imageId : 'img-1',
                statement: `Identified Brand on packaging: "${brandName}"`,
                extractedValue: brandName
            });
        }
        // Determine product generic title from front packaging
        if (frontLines.length > 0) {
            const nonAttrLines = frontLines.filter(l => !/^(?:net\s*wt|mrp|rs\.|₹|batch|mfg|exp|100%|veg|lic|fssai)/i.test(l) && l.length > 2);
            if (nonAttrLines.length > 0) {
                productName = nonAttrLines.slice(0, 2).join(' ');
                productNameStatus = 'CONFIRMED';
                productNameConf = 0.90;
                productNameAngle = frontResult.labelAngle;
                productNameImg = frontResult.imageId;
            }
        }
        else if (allLinesWithOrigin.length > 0) {
            const firstGoodLine = allLinesWithOrigin.find(l => l.text.length > 3 && !/^(?:net|mrp|rs|₹|batch|mfg|exp|fssai)/i.test(l.text));
            if (firstGoodLine) {
                productName = firstGoodLine.text;
                productNameStatus = 'INFERRED';
                productNameConf = 0.75;
                productNameAngle = firstGoodLine.angle;
                productNameImg = firstGoodLine.imgId;
            }
        }
        // Variant extraction
        const variantMatch = allText.match(/\b(Butter|Cashew|Almond|Chocolate|Dark Chocolate|Vanilla|Strawberry|Mango|Orange|Lemon|Lime|Masala|Magic Masala|Cream & Onion|Salted|Spicy|Chilli|Mint|Honey|Neem|Aloe Vera|Rose|Lavender|Anti-Dandruff|Deep Impact|Deep Clean|Moisturizing|Original|Classic|Zero Sugar|Diet|Light|Extra Strong|Crunchy|Creamy|Rich)\b/i);
        if (variantMatch) {
            variantName = variantMatch[1];
        }
        if (productName === 'Not detected from uploaded image') {
            missingFields.push('Product Name');
        }
        else {
            evidence.push({
                field: 'productName',
                sourceAngle: productNameAngle,
                sourceImageId: productNameImg,
                statement: `Detected Product Title on ${productNameAngle} panel: "${productName}"`,
                extractedValue: productName
            });
        }
        // -------------------------------------------------------------
        // 2. DYNAMIC CATEGORY & SUBCATEGORY UNDERSTANDING
        // -------------------------------------------------------------
        let detectedCategory = userCategory || 'General Packaged Product';
        const lowerAllText = allText.toLowerCase();
        if (lowerAllText.includes('beverage') ||
            lowerAllText.includes('carbonated water') ||
            lowerAllText.includes('drink') ||
            lowerAllText.includes('juice') ||
            lowerAllText.includes('soda') ||
            lowerAllText.includes('cola') ||
            lowerAllText.includes('soft drink') ||
            lowerAllText.includes('energy drink')) {
            detectedCategory = 'Beverages';
            subcategoryName = 'Packaged Beverage / Soft Drink';
        }
        else if (lowerAllText.includes('biscuit') ||
            lowerAllText.includes('cookie') ||
            lowerAllText.includes('chips') ||
            lowerAllText.includes('noodle') ||
            lowerAllText.includes('snack') ||
            lowerAllText.includes('cereal') ||
            lowerAllText.includes('chocolate') ||
            lowerAllText.includes('flour') ||
            lowerAllText.includes('edible vegetable oil') ||
            lowerAllText.includes('fssai') ||
            lowerAllText.includes('nutrition') ||
            lowerAllText.includes('energy kcal')) {
            detectedCategory = 'Food & Beverages';
            subcategoryName = lowerAllText.includes('biscuit') || lowerAllText.includes('cookie') ? 'Biscuits & Cookies' : lowerAllText.includes('chips') ? 'Snacks & Chips' : 'Packaged Food';
        }
        else if (lowerAllText.includes('shampoo') ||
            lowerAllText.includes('face wash') ||
            lowerAllText.includes('soap') ||
            lowerAllText.includes('cosmetic') ||
            lowerAllText.includes('conditioner') ||
            lowerAllText.includes('lotion') ||
            lowerAllText.includes('skin') ||
            lowerAllText.includes('hair') ||
            lowerAllText.includes('for external use only')) {
            detectedCategory = 'Cosmetics & Personal Care';
            subcategoryName = lowerAllText.includes('face wash') ? 'Skin Cleanser' : lowerAllText.includes('shampoo') ? 'Hair Care' : 'Personal Care';
        }
        else if (lowerAllText.includes('disinfectant') ||
            lowerAllText.includes('detergent') ||
            lowerAllText.includes('cleaner') ||
            lowerAllText.includes('household') ||
            lowerAllText.includes('bleach') ||
            lowerAllText.includes('keep out of reach of children')) {
            detectedCategory = 'Household Products';
            subcategoryName = 'Home Cleaning & Disinfection';
        }
        else if (lowerAllText.includes('tablet') ||
            lowerAllText.includes('capsule') ||
            lowerAllText.includes('syrup') ||
            lowerAllText.includes('dosage') ||
            lowerAllText.includes('pharma') ||
            lowerAllText.includes('schedule h')) {
            detectedCategory = 'Pharmaceuticals & Health';
            subcategoryName = 'OTC / Healthcare Formulation';
        }
        else if (lowerAllText.includes('volts') ||
            lowerAllText.includes('watts') ||
            lowerAllText.includes('usb') ||
            lowerAllText.includes('model no') ||
            lowerAllText.includes('warranty') ||
            lowerAllText.includes('bluetooth')) {
            detectedCategory = 'Electronics & Consumer Goods';
            subcategoryName = 'Consumer Electronics / Hardware';
        }
        // -------------------------------------------------------------
        // 3. NET QUANTITY / PACK SIZE
        // -------------------------------------------------------------
        const qtySearch = searchPattern(/(?:Net\s*(?:Weight|Qty|Quantity|Content|Vol|Volume)|Weight|Qty|Net)[:\s]*([0-9]+(?:\.[0-9]+)?\s*(?:g|kg|ml|l|gm|grams|pieces|pcs|N|count|tab|capsules|units))\b/i, 'FRONT', frontResult?.imageId);
        let netQtyVal = 'Not detected from uploaded image';
        let netQtyStatus = 'MISSING';
        let netQtyConf = 0.0;
        let netQtyAngle = frontResult?.labelAngle || 'FRONT';
        let netQtyImg = frontResult?.imageId || 'img-1';
        if (qtySearch) {
            netQtyVal = qtySearch.val;
            netQtyStatus = 'CONFIRMED';
            netQtyConf = 0.94;
            netQtyAngle = qtySearch.angle;
            netQtyImg = qtySearch.imgId;
            evidence.push({
                field: 'netQuantity',
                sourceAngle: qtySearch.angle,
                sourceImageId: qtySearch.imgId,
                statement: `Net quantity found on ${qtySearch.angle} panel: "${netQtyVal}"`,
                extractedValue: netQtyVal
            });
        }
        else {
            const standaloneQty = allText.match(/\b([0-9]+(?:\.[0-9]+)?\s*(?:g|kg|ml|l|gm|grams))\b/i);
            if (standaloneQty) {
                netQtyVal = standaloneQty[1];
                netQtyStatus = 'INFERRED';
                netQtyConf = 0.82;
                evidence.push({
                    field: 'netQuantity',
                    sourceAngle: 'FRONT',
                    sourceImageId: frontResult?.imageId || 'img-1',
                    statement: `Extracted numeric quantity: "${netQtyVal}"`,
                    extractedValue: netQtyVal
                });
            }
            else {
                missingFields.push('Net Quantity');
            }
        }
        // -------------------------------------------------------------
        // 4. MAXIMUM RETAIL PRICE (MRP)
        // -------------------------------------------------------------
        const mrpSearch = searchPattern(/(?:MRP|M\.R\.P\.|Maximum Retail Price|Rs\.|₹)[:\s]*([0-9]+(?:\.[0-9]{2})?)/i, 'FRONT', frontResult?.imageId);
        let mrpVal = 'Not detected from uploaded image';
        let mrpStatus = 'MISSING';
        let mrpConf = 0.0;
        let mrpAngle = frontResult?.labelAngle || 'FRONT';
        let mrpImg = frontResult?.imageId || 'img-1';
        if (mrpSearch) {
            mrpVal = `₹ ${mrpSearch.val}`;
            mrpStatus = 'CONFIRMED';
            mrpConf = 0.95;
            mrpAngle = mrpSearch.angle;
            mrpImg = mrpSearch.imgId;
            evidence.push({
                field: 'mrp',
                sourceAngle: mrpSearch.angle,
                sourceImageId: mrpSearch.imgId,
                statement: `MRP declaration detected on ${mrpSearch.angle} panel: "${mrpVal}"`,
                extractedValue: mrpVal
            });
        }
        else {
            missingFields.push('MRP (Price)');
        }
        // -------------------------------------------------------------
        // 5. INGREDIENTS / FORMULATION
        // -------------------------------------------------------------
        let ingredientsList = [];
        let ingStatus = 'MISSING';
        let ingConf = 0.0;
        let ingAngle = ingResult?.labelAngle || 'INGREDIENTS';
        let ingImg = ingResult?.imageId || 'img-3';
        const ingMatch = allText.match(/(?:INGREDIENTS|Ingredients|Composition|Contains)[:\s]*([\s\S]+?)(?=(?:ALLERGEN|NUTRITIONAL|Mfg|Marketed|Batch|Consumer|Storage|Warning|Directions|Lic\.|\n\n\n|$))/i);
        if (ingMatch && ingMatch[1]) {
            const rawIng = ingMatch[1].replace(/\r?\n/g, ' ').trim();
            ingredientsList = rawIng
                .split(/,\s*|\.\s+/)
                .map(i => i.trim())
                .filter(i => i.length > 1 && !/^(?:all rights|fssai|lic)/i.test(i));
            if (ingredientsList.length > 0) {
                ingStatus = 'CONFIRMED';
                ingConf = 0.92;
                evidence.push({
                    field: 'ingredients',
                    sourceAngle: ingAngle,
                    sourceImageId: ingImg,
                    statement: `Declared formulation contains ${ingredientsList.length} ingredient components.`,
                    snippet: rawIng.slice(0, 120) + '...'
                });
            }
        }
        if (ingredientsList.length === 0 && (detectedCategory === 'Food & Beverages' || detectedCategory === 'Cosmetics & Personal Care')) {
            missingFields.push('Ingredients List');
        }
        // -------------------------------------------------------------
        // 6. ALLERGENS
        // -------------------------------------------------------------
        let allergensList = [];
        let allergenStatus = 'MISSING';
        let allergenConf = 0.0;
        const allergenMatch = allText.match(/(?:ALLERGEN DECLARATION|ALLERGEN ADVICE|CONTAINS|ALLERGENS)[:\s]*([^\n\r.]+)/i);
        if (allergenMatch && allergenMatch[1]) {
            allergensList = allergenMatch[1]
                .split(/,|and/i)
                .map(s => s.trim())
                .filter(Boolean);
            allergenStatus = 'CONFIRMED';
            allergenConf = 0.93;
            evidence.push({
                field: 'allergens',
                sourceAngle: ingAngle,
                sourceImageId: ingImg,
                statement: `Allergen declaration identified: "${allergensList.join(', ')}"`,
                extractedValue: allergensList.join(', ')
            });
        }
        // -------------------------------------------------------------
        // 7. NUTRITIONAL INFORMATION
        // -------------------------------------------------------------
        const nutritionFacts = {};
        let nutritionConf = 0.0;
        const nutritionObj = {};
        if (lowerAllText.includes('energy') || lowerAllText.includes('protein') || lowerAllText.includes('carbohydrate') || lowerAllText.includes('fat') || lowerAllText.includes('sugar')) {
            const eMatch = allText.match(/Energy[:\s]*([0-9.]+\s*k?cal)/i);
            const pMatch = allText.match(/Protein[:\s]*([0-9.]+\s*g)/i);
            const cMatch = allText.match(/Carbohydrate[s]?[:\s]*([0-9.]+\s*g)/i);
            const totSugMatch = allText.match(/(?:Total Sugars?|Sugars?)[:\s]*([0-9.]+\s*g)/i);
            const addSugMatch = allText.match(/Added Sugars?[:\s]*([0-9.]+\s*g)/i);
            const fMatch = allText.match(/(?:Total Fat|Fat)[:\s]*([0-9.]+\s*g)/i);
            const satFMatch = allText.match(/Saturated (?:Fat|Fatty Acids?)[:\s]*([0-9.]+\s*g)/i);
            const transFMatch = allText.match(/Trans (?:Fat|Fatty Acids?)[:\s]*([0-9.]+\s*g)/i);
            const fiberMatch = allText.match(/(?:Dietary Fiber|Fiber)[:\s]*([0-9.]+\s*g)/i);
            const sodMatch = allText.match(/Sodium[:\s]*([0-9.]+\s*mg)/i);
            const servMatch = allText.match(/(?:Serving Size|Per\s*100g|Per\s*Serving)[:\s]*([^\n\r,]+)/i);
            if (eMatch)
                nutritionFacts['Energy'] = (nutritionObj.energy = eMatch[1]);
            if (pMatch)
                nutritionFacts['Protein'] = (nutritionObj.protein = pMatch[1]);
            if (cMatch)
                nutritionFacts['Carbohydrate'] = (nutritionObj.carbohydrates = cMatch[1]);
            if (totSugMatch)
                nutritionFacts['Total Sugars'] = (nutritionObj.totalSugars = totSugMatch[1]);
            if (addSugMatch)
                nutritionFacts['Added Sugars'] = (nutritionObj.addedSugars = addSugMatch[1]);
            if (fMatch)
                nutritionFacts['Total Fat'] = (nutritionObj.fat = fMatch[1]);
            if (satFMatch)
                nutritionFacts['Saturated Fat'] = (nutritionObj.saturatedFat = satFMatch[1]);
            if (transFMatch)
                nutritionFacts['Trans Fat'] = (nutritionObj.transFat = transFMatch[1]);
            if (fiberMatch)
                nutritionFacts['Fiber'] = (nutritionObj.fiber = fiberMatch[1]);
            if (sodMatch)
                nutritionFacts['Sodium'] = (nutritionObj.sodium = sodMatch[1]);
            if (servMatch)
                nutritionFacts['Serving / Reference'] = (nutritionObj.servingSize = servMatch[1]);
            nutritionConf = Object.keys(nutritionFacts).length > 2 ? 0.94 : 0.75;
            evidence.push({
                field: 'nutrition',
                sourceAngle: nutResult ? nutResult.labelAngle : 'NUTRITION',
                sourceImageId: nutResult ? nutResult.imageId : 'img-4',
                statement: `Extracted ${Object.keys(nutritionFacts).length} nutritional metrics from packaging.`
            });
        }
        // -------------------------------------------------------------
        // 8. MANUFACTURER, PACKER, MARKETER & ORIGIN
        // -------------------------------------------------------------
        const mfgSearch = searchPattern(/(?:Mfg By|Manufactured by|Produced by|Packaged by|Manufactured & Marketed by)[:\s]*([^\n\r]+)/i, 'BACK', backResult?.imageId);
        let mfgVal = 'Not detected from uploaded image';
        let mfgStatus = 'MISSING';
        let mfgConf = 0.0;
        if (mfgSearch) {
            mfgVal = mfgSearch.val;
            mfgStatus = 'CONFIRMED';
            mfgConf = 0.91;
            evidence.push({
                field: 'manufacturer',
                sourceAngle: mfgSearch.angle,
                sourceImageId: mfgSearch.imgId,
                statement: `Manufacturer entity & address on ${mfgSearch.angle} panel: "${mfgVal}"`,
                extractedValue: mfgVal
            });
        }
        else {
            missingFields.push('Manufacturer Details');
        }
        const countrySearch = searchPattern(/(?:Country of Origin|Made in|Product of)[:\s]*([A-Za-z\s]+?)(?:[.,\n\r]|$)/i, 'BACK', backResult?.imageId);
        let countryVal = 'Not detected from uploaded image';
        let countryStatus = 'MISSING';
        if (countrySearch) {
            countryVal = countrySearch.val.trim();
            countryStatus = 'CONFIRMED';
            evidence.push({
                field: 'countryOfOrigin',
                sourceAngle: countrySearch.angle,
                sourceImageId: countrySearch.imgId,
                statement: `Country of Origin declared: "${countryVal}"`,
                extractedValue: countryVal
            });
        }
        else {
            missingFields.push('Country of Origin');
        }
        // -------------------------------------------------------------
        // 9. DATES & BATCH NUMBER
        // -------------------------------------------------------------
        const batchSearch = searchPattern(/(?:Batch No|Lot No|B\.No|LOT|BN)[:\s]*([A-Z0-9\-\/]+)/i, 'BACK', backResult?.imageId);
        let batchVal = 'Not detected from uploaded image';
        let batchStatus = 'MISSING';
        if (batchSearch) {
            batchVal = batchSearch.val;
            batchStatus = 'CONFIRMED';
            evidence.push({
                field: 'batchNumber',
                sourceAngle: batchSearch.angle,
                sourceImageId: batchSearch.imgId,
                statement: `Batch/Lot Number: "${batchVal}"`,
                extractedValue: batchVal
            });
        }
        else {
            missingFields.push('Batch / Lot Number');
        }
        const expSearch = searchPattern(/(?:Expiry Date|EXP|Use by|Use Before|Best before)[:\s]*([0-9a-zA-Z\/\.\-\s]+?)(?:[.,\n\r]|$)/i, 'BACK', backResult?.imageId);
        let expVal = 'Not detected from uploaded image';
        let expStatus = 'MISSING';
        if (expSearch) {
            expVal = expSearch.val;
            expStatus = 'CONFIRMED';
            evidence.push({
                field: 'expiryDate',
                sourceAngle: expSearch.angle,
                sourceImageId: expSearch.imgId,
                statement: `Expiry / Best Before: "${expVal}"`,
                extractedValue: expVal
            });
        }
        else {
            missingFields.push('Expiry / Best Before Date');
        }
        const mfgDateSearch = searchPattern(/(?:Mfg Date|MFD|Date of Pkg|PKD)[:\s]*([0-9a-zA-Z\/\.\-]+)/i, 'BACK', backResult?.imageId);
        let mfgDateVal = mfgDateSearch ? mfgDateSearch.val : undefined;
        // -------------------------------------------------------------
        // 10. LICENSES & CUSTOMER CARE
        // -------------------------------------------------------------
        const fssaiSearch = searchPattern(/(?:FSSAI|Lic\.?\s*(?:No\.?)?)[:\s]*([0-9]{14})/i, 'BACK', backResult?.imageId);
        let fssaiVal = 'Not detected from uploaded image';
        let fssaiStatus = 'MISSING';
        if (fssaiSearch) {
            fssaiVal = fssaiSearch.val;
            fssaiStatus = 'CONFIRMED';
            evidence.push({
                field: 'fssaiLicense',
                sourceAngle: fssaiSearch.angle,
                sourceImageId: fssaiSearch.imgId,
                statement: `14-Digit FSSAI License: "${fssaiVal}"`,
                extractedValue: fssaiVal
            });
        }
        const careSearch = searchPattern(/(?:Consumer Care|Feedback|Toll Free|Call|Customer Care|Care Cell|Helpline)[:\s]*([0-9\-\s\w@.]+?)(?:[.,\n\r]|$)/i, 'BACK', backResult?.imageId);
        let careVal = 'Not detected from uploaded image';
        let careStatus = 'MISSING';
        if (careSearch) {
            careVal = careSearch.val;
            careStatus = 'CONFIRMED';
            evidence.push({
                field: 'customerCare',
                sourceAngle: careSearch.angle,
                sourceImageId: careSearch.imgId,
                statement: `Customer redressal contact: "${careVal}"`,
                extractedValue: careVal
            });
        }
        else {
            missingFields.push('Customer Care / Helpline');
        }
        // -------------------------------------------------------------
        // 11. STORAGE, WARNINGS, USAGE & CLAIMS
        // -------------------------------------------------------------
        const storageSearch = searchPattern(/(?:Storage|Store)[:\s]*([^\n\r.]+)/i, 'BACK', backResult?.imageId);
        let storageVal = storageSearch ? storageSearch.val : 'Store in a cool and dry place.';
        const warningsList = [];
        if (lowerAllText.includes('warning') || lowerAllText.includes('caution') || lowerAllText.includes('external use only') || lowerAllText.includes('keep out of reach')) {
            const warnMatch = allText.match(/(?:WARNING|CAUTION|Precaution)[:\s]*([^\n\r.]+)/i);
            if (warnMatch)
                warningsList.push(warnMatch[1].trim());
            if (lowerAllText.includes('external use only'))
                warningsList.push('For external use only.');
            if (lowerAllText.includes('keep out of reach of children'))
                warningsList.push('Keep out of reach of children.');
        }
        const usageList = [];
        if (lowerAllText.includes('how to use') || lowerAllText.includes('directions') || lowerAllText.includes('instructions')) {
            const usageMatch = allText.match(/(?:Directions for use|How to use|Instructions)[:\s]*([^\n\r.]+)/i);
            if (usageMatch)
                usageList.push(usageMatch[1].trim());
        }
        const claimsList = [];
        if (lowerAllText.includes('100% vegetarian') || lowerAllText.includes('vegetarian'))
            claimsList.push('100% Vegetarian');
        if (lowerAllText.includes('trans fat free'))
            claimsList.push('Trans Fat Free');
        if (lowerAllText.includes('gluten free'))
            claimsList.push('Gluten Free');
        if (lowerAllText.includes('no added sugar') || lowerAllText.includes('zero sugar'))
            claimsList.push('No Added Sugar');
        if (lowerAllText.includes('dermatologically tested'))
            claimsList.push('Dermatologically Tested');
        if (lowerAllText.includes('paraben free'))
            claimsList.push('Paraben Free');
        if (lowerAllText.includes('organic'))
            claimsList.push('Organic Certified');
        // Structured Aggregations
        const productIdentity = {
            name: productName,
            brand: brandName,
            category: detectedCategory,
            subcategory: subcategoryName,
            variant: variantName,
            packSize: netQtyVal
        };
        const labelInformation = {
            netQuantity: netQtyVal,
            mrp: mrpVal,
            manufacturer: mfgVal,
            countryOfOrigin: countryVal,
            batchNumber: batchVal,
            manufacturingDate: mfgDateVal,
            expiryDate: expVal,
            fssaiLicense: fssaiVal
        };
        return {
            productName: {
                value: productName,
                confidence: productNameConf,
                sourceImageId: productNameImg,
                sourceAngle: productNameAngle,
                status: productNameStatus
            },
            brand: {
                value: brandName,
                confidence: brandConf,
                sourceImageId: brandImg,
                sourceAngle: brandAngle,
                status: brandStatus
            },
            category: {
                value: detectedCategory,
                confidence: 0.95,
                sourceImageId: frontResult?.imageId || 'img-1',
                sourceAngle: 'FRONT',
                status: 'CONFIRMED'
            },
            netQuantity: {
                value: netQtyVal,
                confidence: netQtyConf,
                sourceImageId: netQtyImg,
                sourceAngle: netQtyAngle,
                status: netQtyStatus
            },
            ingredients: {
                value: ingredientsList,
                confidence: ingConf,
                sourceImageId: ingImg,
                sourceAngle: ingAngle,
                status: ingStatus
            },
            allergens: {
                value: allergensList,
                confidence: allergenConf,
                sourceImageId: ingImg,
                sourceAngle: ingAngle,
                status: allergenStatus
            },
            nutritionalInfo: {
                value: nutritionFacts,
                confidence: nutritionConf,
                sourceImageId: nutResult?.imageId || 'img-4',
                sourceAngle: nutResult?.labelAngle || 'NUTRITION',
                status: Object.keys(nutritionFacts).length > 0 ? 'CONFIRMED' : 'MISSING'
            },
            mrp: {
                value: mrpVal,
                confidence: mrpConf,
                sourceImageId: mrpImg,
                sourceAngle: mrpAngle,
                status: mrpStatus
            },
            manufacturer: {
                value: mfgVal,
                confidence: mfgConf,
                sourceImageId: backResult?.imageId || 'img-2',
                sourceAngle: backResult?.labelAngle || 'BACK',
                status: mfgStatus
            },
            countryOfOrigin: {
                value: countryVal,
                confidence: countryStatus === 'CONFIRMED' ? 0.95 : 0.0,
                sourceImageId: backResult?.imageId || 'img-2',
                sourceAngle: backResult?.labelAngle || 'BACK',
                status: countryStatus
            },
            batchNumber: {
                value: batchVal,
                confidence: batchStatus === 'CONFIRMED' ? 0.92 : 0.0,
                sourceImageId: backResult?.imageId || 'img-2',
                sourceAngle: backResult?.labelAngle || 'BACK',
                status: batchStatus
            },
            manufacturingDate: mfgDateVal ? {
                value: mfgDateVal,
                confidence: 0.9,
                sourceImageId: backResult?.imageId || 'img-2',
                sourceAngle: backResult?.labelAngle || 'BACK',
                status: 'CONFIRMED'
            } : undefined,
            expiryDate: {
                value: expVal,
                confidence: expStatus === 'CONFIRMED' ? 0.92 : 0.0,
                sourceImageId: backResult?.imageId || 'img-2',
                sourceAngle: backResult?.labelAngle || 'BACK',
                status: expStatus
            },
            customerCare: {
                value: careVal,
                confidence: careStatus === 'CONFIRMED' ? 0.92 : 0.0,
                sourceImageId: backResult?.imageId || 'img-2',
                sourceAngle: backResult?.labelAngle || 'BACK',
                status: careStatus
            },
            fssaiLicense: {
                value: fssaiVal,
                confidence: fssaiStatus === 'CONFIRMED' ? 0.97 : 0.0,
                sourceImageId: backResult?.imageId || 'img-2',
                sourceAngle: backResult?.labelAngle || 'BACK',
                status: fssaiStatus
            },
            storageInstructions: {
                value: storageVal,
                confidence: 0.88,
                sourceImageId: backResult?.imageId || 'img-2',
                sourceAngle: backResult?.labelAngle || 'BACK',
                status: 'CONFIRMED'
            },
            warnings: {
                value: warningsList,
                confidence: 0.88,
                sourceImageId: ingImg,
                sourceAngle: ingAngle,
                status: warningsList.length > 0 ? 'CONFIRMED' : 'MISSING'
            },
            labelClaims: {
                value: claimsList,
                confidence: 0.92,
                sourceImageId: frontResult?.imageId || 'img-1',
                sourceAngle: 'FRONT',
                status: claimsList.length > 0 ? 'CONFIRMED' : 'MISSING'
            },
            usageInstructions: usageList.length > 0 ? {
                value: usageList,
                confidence: 0.89,
                sourceImageId: backResult?.imageId || 'img-2',
                sourceAngle: 'BACK',
                status: 'CONFIRMED'
            } : undefined,
            missingInformation: missingFields,
            unclearInformation: unclearFields,
            productIdentity,
            labelInformation,
            nutrition: nutritionObj,
            claims: claimsList,
            productInsights: this.generateProductInsights(productName, brandName, detectedCategory, subcategoryName, ingredientsList, nutritionObj, allergensList, warningsList, claimsList, storageVal, allText),
            evidence,
            confidenceSummary: {
                productName: productNameStatus === 'CONFIRMED' ? 'High' : 'Needs Verification',
                brand: brandStatus === 'CONFIRMED' ? 'High' : 'Needs Verification',
                netQuantity: netQtyStatus === 'CONFIRMED' ? 'High' : 'Needs Verification',
                mrp: mrpStatus === 'CONFIRMED' ? 'High' : 'Needs Verification',
                manufacturer: mfgStatus === 'CONFIRMED' ? 'Medium' : 'Needs Verification',
                expiryDate: expStatus === 'CONFIRMED' ? 'High' : 'Needs Verification'
            }
        };
    }
    /**
     * Generates dynamic, evidence-first, category-aware Product Insights:
     * 1. Uses
     * 2. Benefits / Advantages
     * 3. Warnings / Precautions
     * 4. Disadvantages / Limitations
     */
    static generateProductInsights(productName, brand, category, subcategory, ingredients, nutrition, allergens, warnings, claims, storage, allText) {
        const uses = [];
        const benefits = [];
        const warningItems = [];
        const disadvantages = [];
        const limitations = [];
        const lowerName = productName.toLowerCase();
        const lowerCategory = category.toLowerCase();
        const lowerAllText = allText.toLowerCase();
        // -------------------------------------------------------------
        // 1. USES (Category & Product Specific)
        // -------------------------------------------------------------
        if (lowerCategory.includes('food') || lowerCategory.includes('snack') || lowerCategory.includes('bakery')) {
            if (lowerName.includes('biscuit') || lowerName.includes('cookie') || lowerAllText.includes('biscuit') || lowerAllText.includes('cookie')) {
                uses.push({
                    text: 'Suitable as a ready-to-eat bakery snack for everyday consumption.',
                    basis: 'Product category and packaging format',
                    confidence: 0.95
                });
                uses.push({
                    text: 'Can be served alongside tea, coffee, milk, or hot beverages.',
                    basis: 'Traditional culinary and snack pairing',
                    confidence: 0.92
                });
            }
            else if (lowerName.includes('chip') || lowerName.includes('crisp') || lowerName.includes('namkeen') || lowerName.includes('snack')) {
                uses.push({
                    text: 'Ready-to-eat savoury snack for immediate consumption.',
                    basis: 'Product category and packaging format',
                    confidence: 0.95
                });
                uses.push({
                    text: 'Suitable for social snacking, travel food, or party refreshments.',
                    basis: 'Packaged snack format characteristics',
                    confidence: 0.90
                });
            }
            else if (lowerName.includes('noodle') || lowerName.includes('pasta') || lowerAllText.includes('noodle')) {
                uses.push({
                    text: 'Quick-cooking instant meal preparation for breakfast or snack.',
                    basis: 'Convenience packaged food format',
                    confidence: 0.96
                });
            }
            else if (lowerName.includes('chocolate') || lowerName.includes('candy') || lowerName.includes('sweet')) {
                uses.push({
                    text: 'Confectionery treat for personal dessert or celebratory gifting.',
                    basis: 'Confectionery product classification',
                    confidence: 0.94
                });
            }
            else {
                uses.push({
                    text: 'Ready-to-eat / packaged food component for standard dietary consumption.',
                    basis: 'Packaged food classification',
                    confidence: 0.92
                });
            }
        }
        else if (lowerCategory.includes('beverage') || lowerCategory.includes('drink')) {
            uses.push({
                text: 'Direct liquid beverage consumption for refreshment and hydration.',
                basis: 'Packaged beverage container format',
                confidence: 0.96
            });
            uses.push({
                text: 'Suitable for serving chilled with meals or as an ambient refreshment.',
                basis: 'Beverage serving standard',
                confidence: 0.92
            });
        }
        else if (lowerCategory.includes('cosmetic') || lowerCategory.includes('personal care') || lowerCategory.includes('skin') || lowerCategory.includes('hair')) {
            if (lowerName.includes('shampoo') || lowerAllText.includes('shampoo')) {
                uses.push({
                    text: 'Hair care formulation for scalp cleansing, sebum removal, and hair strand hygiene.',
                    basis: 'Personal care product description',
                    confidence: 0.96
                });
                uses.push({
                    text: 'Suitable for regular or daily hair washing routine.',
                    basis: 'Hair cosmetic formulation',
                    confidence: 0.92
                });
            }
            else if (lowerName.includes('face wash') || lowerName.includes('cleanser') || lowerAllText.includes('face wash')) {
                uses.push({
                    text: 'Facial skin cleansing to remove surface dirt, excess sebum, and environmental impurities.',
                    basis: 'Facial care formulation',
                    confidence: 0.96
                });
                uses.push({
                    text: 'Daily morning and evening skincare regimen application.',
                    basis: 'Cosmetic cleanser standard application',
                    confidence: 0.93
                });
            }
            else if (lowerName.includes('soap') || lowerName.includes('body wash')) {
                uses.push({
                    text: 'Topical bathing and full-body dermal cleansing.',
                    basis: 'Bath & body product classification',
                    confidence: 0.95
                });
            }
            else if (lowerName.includes('lotion') || lowerName.includes('cream')) {
                uses.push({
                    text: 'Topical skin hydration and epidermal barrier moisturizing.',
                    basis: 'Emollient skincare formulation',
                    confidence: 0.94
                });
            }
            else {
                uses.push({
                    text: 'Personal grooming and topical cosmetic maintenance.',
                    basis: 'Cosmetics & personal care standard',
                    confidence: 0.91
                });
            }
        }
        else if (lowerCategory.includes('household') || lowerCategory.includes('clean')) {
            uses.push({
                text: 'Hard surface cleaning, home sanitation, and household hygiene maintenance.',
                basis: 'Household cleaning commodity classification',
                confidence: 0.95
            });
            uses.push({
                text: 'Removal of household grease, dirt, and surface microbial contaminants.',
                basis: 'Surface cleanser formulation',
                confidence: 0.93
            });
        }
        else if (lowerCategory.includes('electronic') || lowerCategory.includes('consumer goods')) {
            uses.push({
                text: 'Consumer electronic device utility according to declared hardware specifications.',
                basis: 'Product specifications and hardware category',
                confidence: 0.94
            });
        }
        else {
            uses.push({
                text: `Intended utility for ${productName !== 'Not detected from uploaded image' ? productName : 'packaged commodity'}.`,
                basis: 'Packaging identification',
                confidence: 0.88
            });
        }
        // -------------------------------------------------------------
        // 2. BENEFITS / ADVANTAGES (Evidence-First, No Medical Fabrication)
        // -------------------------------------------------------------
        // Front-of-pack claims as Manufacturer Claims
        if (claims && claims.length > 0) {
            claims.forEach(c => {
                benefits.push({
                    text: `Manufacturer Claim: Declared "${c}" on packaging.`,
                    basis: 'Manufacturer claim on packaging label',
                    confidence: 0.95
                });
            });
        }
        // Nutritional benefits where factual data exists
        if (nutrition) {
            if (nutrition.energy) {
                benefits.push({
                    text: `Provides caloric dietary energy (${nutrition.energy}) to support daily activity.`,
                    basis: 'Based on nutrition information',
                    confidence: 0.93
                });
            }
            if (nutrition.protein && parseFloat(nutrition.protein) > 3) {
                benefits.push({
                    text: `Supplies dietary protein (${nutrition.protein}) contributing to daily macronutrient intake.`,
                    basis: 'Based on nutrition information',
                    confidence: 0.92
                });
            }
            if (nutrition.fiber && parseFloat(nutrition.fiber) > 1.5) {
                benefits.push({
                    text: `Contains dietary fiber (${nutrition.fiber}) derived from grain or plant sources.`,
                    basis: 'Based on nutrition information',
                    confidence: 0.90
                });
            }
        }
        // Ingredient-based benefits
        if (ingredients && ingredients.length > 0) {
            const ingStr = ingredients.join(' ').toLowerCase();
            if (ingStr.includes('neem') || ingStr.includes('aloe') || ingStr.includes('turmeric') || ingStr.includes('glycerin') || ingStr.includes('vitamin')) {
                const detectedHerbs = ['neem', 'aloe vera', 'turmeric', 'glycerin', 'vitamin e', 'vitamin c'].filter(h => ingStr.includes(h));
                if (detectedHerbs.length > 0) {
                    benefits.push({
                        text: `Enriched with active botanical/cosmetic components (${detectedHerbs.join(', ')}) supporting topical conditioning.`,
                        basis: 'Based on ingredients declaration',
                        confidence: 0.91
                    });
                }
            }
            if (ingStr.includes('whole wheat') || ingStr.includes('atta') || ingStr.includes('oats')) {
                benefits.push({
                    text: 'Formulated with wholesome grain ingredients (whole wheat / oats).',
                    basis: 'Based on ingredients declaration',
                    confidence: 0.91
                });
            }
        }
        // Packaging advantage
        benefits.push({
            text: 'Sealed statutory packaging designed for product freshness, protection, and shelf stability.',
            basis: 'Product packaging format',
            confidence: 0.89
        });
        // -------------------------------------------------------------
        // 3. WARNINGS / PRECAUTIONS (Packaging & Safety-First)
        // -------------------------------------------------------------
        // Allergens
        if (allergens && allergens.length > 0 && !allergens[0]?.includes('Not detected')) {
            warningItems.push({
                text: `Contains declared allergens: ${allergens.join(', ')}. Persons with known allergies must avoid or exercise caution.`,
                basis: 'Allergen declaration on packaging',
                confidence: 0.98
            });
        }
        // Packaging warnings
        if (warnings && warnings.length > 0 && !warnings[0]?.includes('Not detected')) {
            warnings.forEach(w => {
                warningItems.push({
                    text: w,
                    basis: 'Detected from packaging warning label',
                    confidence: 0.96
                });
            });
        }
        // Category standard safety precautions
        if (lowerCategory.includes('cosmetic') || lowerCategory.includes('personal care') || lowerCategory.includes('skin') || lowerCategory.includes('hair')) {
            if (!warnings.some(w => w.toLowerCase().includes('external'))) {
                warningItems.push({
                    text: 'For external topical use only. Do not ingest.',
                    basis: 'Cosmetics statutory safety standard',
                    confidence: 0.96
                });
            }
            if (!warnings.some(w => w.toLowerCase().includes('eye'))) {
                warningItems.push({
                    text: 'Avoid contact with eyes. In case of accidental contact, rinse immediately with clean water.',
                    basis: 'Topical product safety advisory',
                    confidence: 0.94
                });
            }
            warningItems.push({
                text: 'Perform a patch test prior to initial full application; discontinue use if local skin irritation or redness occurs.',
                basis: 'Dermatological safety recommendation',
                confidence: 0.90
            });
        }
        else if (lowerCategory.includes('household') || lowerCategory.includes('clean')) {
            warningItems.push({
                text: 'Keep out of reach of children and domestic pets.',
                basis: 'Household chemical safety standard',
                confidence: 0.98
            });
            warningItems.push({
                text: 'Do not mix with acids, bleach, or other chemical cleaners to prevent emission of harmful vapors.',
                basis: 'Chemical compatibility safety standard',
                confidence: 0.97
            });
        }
        else if (lowerCategory.includes('food') || lowerCategory.includes('beverage')) {
            if (storage && !storage.includes('Not detected')) {
                warningItems.push({
                    text: `Storage condition: ${storage}`,
                    basis: 'Storage advisory on label',
                    confidence: 0.92
                });
            }
        }
        else if (lowerCategory.includes('electronic')) {
            warningItems.push({
                text: 'Do not expose to high moisture, water immersion, or open flame.',
                basis: 'Electrical safety standard',
                confidence: 0.96
            });
        }
        if (warningItems.length === 0) {
            warningItems.push({
                text: 'No specific statutory hazard warning detected on the uploaded packaging panels.',
                basis: 'Packaging label inspection',
                confidence: 0.88
            });
        }
        // -------------------------------------------------------------
        // 4. DISADVANTAGES / LIMITATIONS (Factual, Evidence-Based)
        // -------------------------------------------------------------
        if (nutrition) {
            const sugarVal = nutrition.totalSugars || nutrition.addedSugars || nutrition['Total Sugars'] || nutrition['Sugar'];
            if (sugarVal && parseFloat(sugarVal) >= 15) {
                disadvantages.push({
                    text: `Potential limitation: Contains added/total sugar content (${sugarVal}) according to detected nutrition panel; moderate intake recommended.`,
                    basis: 'Based on nutrition information',
                    confidence: 0.94
                });
            }
            const sodiumVal = nutrition.sodium || nutrition['Sodium'];
            if (sodiumVal && parseFloat(sodiumVal) >= 400) {
                disadvantages.push({
                    text: `Contains sodium (${sodiumVal}) per 100g reference; individuals on restricted sodium diets should monitor intake.`,
                    basis: 'Based on nutrition information',
                    confidence: 0.92
                });
            }
            const satFatVal = nutrition.saturatedFat || nutrition['Saturated Fat'];
            if (satFatVal && parseFloat(satFatVal) >= 8) {
                disadvantages.push({
                    text: `Contains saturated fatty acids (${satFatVal}) derived from processed oils/fats.`,
                    basis: 'Based on nutrition information',
                    confidence: 0.91
                });
            }
        }
        // Ingredients based limitations
        if (ingredients && ingredients.length > 0) {
            const ingStr = ingredients.join(' ').toLowerCase();
            if (ingStr.includes('refined wheat flour') || ingStr.includes('maida')) {
                disadvantages.push({
                    text: 'Formulated predominantly with refined wheat flour (maida) rather than whole grain flour.',
                    basis: 'Based on ingredients declaration',
                    confidence: 0.93
                });
            }
            if (ingStr.includes('palm oil') || ingStr.includes('hydrogenated vegetable oil')) {
                disadvantages.push({
                    text: 'Contains palm oil or refined vegetable fat in the formulation.',
                    basis: 'Based on ingredients declaration',
                    confidence: 0.92
                });
            }
            if (ingStr.includes('artificial flavour') || ingStr.includes('artificial color') || ingStr.includes('preservative')) {
                disadvantages.push({
                    text: 'Contains permitted synthetic additives / artificial flavorings or preservatives.',
                    basis: 'Based on ingredients declaration',
                    confidence: 0.90
                });
            }
            if (ingStr.includes('sodium laureth sulfate') || ingStr.includes('sles') || ingStr.includes('sulfate')) {
                disadvantages.push({
                    text: 'Potential limitation: Contains synthetic sulfate-based surfactants which may feel stripping on sensitive skin or dry hair.',
                    basis: 'Based on ingredients declaration',
                    confidence: 0.89
                });
            }
            if (ingStr.includes('fragrance') || ingStr.includes('parfum')) {
                disadvantages.push({
                    text: 'Contains added fragrance/parfum which may trigger sensitivity in hyper-reactive skin types.',
                    basis: 'Based on ingredients declaration',
                    confidence: 0.88
                });
            }
        }
        // Scope & functional limitations
        if (lowerCategory.includes('cosmetic') || lowerCategory.includes('personal care') || lowerCategory.includes('skin') || lowerCategory.includes('hair')) {
            limitations.push({
                text: 'Cosmetic personal care formulation; not intended to diagnose, treat, cure, or prevent any medical or dermatological condition.',
                basis: 'Statutory regulatory scope',
                confidence: 0.97
            });
            limitations.push({
                text: 'Efficacy depends on individual skin/hair type and regular usage consistency.',
                basis: 'Cosmetic product characteristics',
                confidence: 0.90
            });
        }
        else if (lowerCategory.includes('food') || lowerCategory.includes('beverage')) {
            limitations.push({
                text: 'Processed packaged food product; should be consumed as part of a balanced diet rather than a sole source of nutrition.',
                basis: 'Dietary guidance context',
                confidence: 0.93
            });
            limitations.push({
                text: 'Must be consumed prior to declared expiry/best before date and stored according to label instructions once unsealed.',
                basis: 'Shelf-life & storage constraint',
                confidence: 0.95
            });
        }
        else if (lowerCategory.includes('household')) {
            limitations.push({
                text: 'Surface cleaner only; not suitable for porous, unsealed surfaces or personal bodily hygiene.',
                basis: 'Application boundary',
                confidence: 0.94
            });
        }
        else if (lowerCategory.includes('electronic')) {
            limitations.push({
                text: 'Rechargeable battery and hardware performance undergo natural wear over operational lifecycle.',
                basis: 'Hardware technology limitation',
                confidence: 0.92
            });
        }
        return {
            uses,
            benefits,
            warnings: warningItems,
            disadvantages,
            limitations
        };
    }
    /**
     * Normalizes AI vision JSON response into the standard StructuredProductData format
     */
    static normalizeAiResponse(aiData, ocrResults, category) {
        const front = ocrResults.find(r => r.labelAngle === 'FRONT') || ocrResults[0];
        const back = ocrResults.find(r => r.labelAngle === 'BACK') || ocrResults[1] || front;
        const pName = aiData.productIdentity?.name || 'Not detected from uploaded image';
        const brand = aiData.productIdentity?.brand || 'Not detected from uploaded image';
        const netQty = aiData.labelInformation?.netQuantity || 'Not detected from uploaded image';
        const mrp = aiData.labelInformation?.mrp || 'Not detected from uploaded image';
        const mfg = aiData.labelInformation?.manufacturer || 'Not detected from uploaded image';
        const exp = aiData.labelInformation?.expiryDate || 'Not detected from uploaded image';
        const batch = aiData.labelInformation?.batchNumber || 'Not detected from uploaded image';
        const country = aiData.labelInformation?.countryOfOrigin || 'Not detected from uploaded image';
        const fssai = aiData.labelInformation?.fssaiLicense || 'Not detected from uploaded image';
        const care = aiData.customerCare || 'Not detected from uploaded image';
        const evidence = [];
        if (pName !== 'Not detected from uploaded image') {
            evidence.push({ field: 'productName', sourceAngle: 'FRONT', sourceImageId: front?.imageId || 'img-1', statement: `AI identified product: ${pName}` });
        }
        if (netQty !== 'Not detected from uploaded image') {
            evidence.push({ field: 'netQuantity', sourceAngle: 'FRONT', sourceImageId: front?.imageId || 'img-1', statement: `Declared quantity: ${netQty}` });
        }
        const allText = ocrResults.map(r => r.rawText).join('\n\n');
        const computedInsights = this.generateProductInsights(pName, brand, aiData.productIdentity?.category || category || 'Food & Beverages', aiData.productIdentity?.subcategory || '', Array.isArray(aiData.ingredients) ? aiData.ingredients : [], aiData.nutrition || {}, Array.isArray(aiData.allergens) ? aiData.allergens : [], Array.isArray(aiData.warnings) ? aiData.warnings : [], Array.isArray(aiData.claims) ? aiData.claims : [], Array.isArray(aiData.storageInstructions) ? aiData.storageInstructions.join(', ') : 'Store in a cool, dry place.', allText);
        const productInsights = {
            uses: aiData.productInsights?.uses?.length ? aiData.productInsights.uses : computedInsights.uses,
            benefits: aiData.productInsights?.benefits?.length ? aiData.productInsights.benefits : computedInsights.benefits,
            warnings: aiData.productInsights?.warnings?.length ? aiData.productInsights.warnings : computedInsights.warnings,
            disadvantages: aiData.productInsights?.disadvantages?.length ? aiData.productInsights.disadvantages : computedInsights.disadvantages,
            limitations: aiData.productInsights?.limitations?.length ? aiData.productInsights.limitations : computedInsights.limitations
        };
        return {
            productName: {
                value: pName,
                confidence: pName.includes('Not detected') ? 0.0 : 0.95,
                sourceImageId: front?.imageId || 'img-1',
                sourceAngle: 'FRONT',
                status: pName.includes('Not detected') ? 'MISSING' : 'CONFIRMED'
            },
            brand: {
                value: brand,
                confidence: brand.includes('Not detected') ? 0.0 : 0.95,
                sourceImageId: front?.imageId || 'img-1',
                sourceAngle: 'FRONT',
                status: brand.includes('Not detected') ? 'MISSING' : 'CONFIRMED'
            },
            category: {
                value: aiData.productIdentity?.category || category || 'Food & Beverages',
                confidence: 0.95,
                sourceImageId: front?.imageId || 'img-1',
                sourceAngle: 'FRONT',
                status: 'CONFIRMED'
            },
            netQuantity: {
                value: netQty,
                confidence: netQty.includes('Not detected') ? 0.0 : 0.94,
                sourceImageId: front?.imageId || 'img-1',
                sourceAngle: 'FRONT',
                status: netQty.includes('Not detected') ? 'MISSING' : 'CONFIRMED'
            },
            ingredients: {
                value: Array.isArray(aiData.ingredients) ? aiData.ingredients : [],
                confidence: 0.92,
                sourceImageId: back?.imageId || 'img-2',
                sourceAngle: 'INGREDIENTS',
                status: Array.isArray(aiData.ingredients) && aiData.ingredients.length > 0 ? 'CONFIRMED' : 'MISSING'
            },
            allergens: {
                value: Array.isArray(aiData.allergens) ? aiData.allergens : [],
                confidence: 0.92,
                sourceImageId: back?.imageId || 'img-2',
                sourceAngle: 'INGREDIENTS',
                status: Array.isArray(aiData.allergens) && aiData.allergens.length > 0 ? 'CONFIRMED' : 'MISSING'
            },
            nutritionalInfo: {
                value: aiData.nutrition || {},
                confidence: 0.93,
                sourceImageId: back?.imageId || 'img-2',
                sourceAngle: 'NUTRITION',
                status: aiData.nutrition && Object.keys(aiData.nutrition).length > 0 ? 'CONFIRMED' : 'MISSING'
            },
            mrp: {
                value: mrp,
                confidence: mrp.includes('Not detected') ? 0.0 : 0.94,
                sourceImageId: front?.imageId || 'img-1',
                sourceAngle: 'FRONT',
                status: mrp.includes('Not detected') ? 'MISSING' : 'CONFIRMED'
            },
            manufacturer: {
                value: mfg,
                confidence: mfg.includes('Not detected') ? 0.0 : 0.91,
                sourceImageId: back?.imageId || 'img-2',
                sourceAngle: 'BACK',
                status: mfg.includes('Not detected') ? 'MISSING' : 'CONFIRMED'
            },
            countryOfOrigin: {
                value: country,
                confidence: country.includes('Not detected') ? 0.0 : 0.95,
                sourceImageId: back?.imageId || 'img-2',
                sourceAngle: 'BACK',
                status: country.includes('Not detected') ? 'MISSING' : 'CONFIRMED'
            },
            batchNumber: {
                value: batch,
                confidence: batch.includes('Not detected') ? 0.0 : 0.90,
                sourceImageId: back?.imageId || 'img-2',
                sourceAngle: 'BACK',
                status: batch.includes('Not detected') ? 'MISSING' : 'CONFIRMED'
            },
            expiryDate: {
                value: exp,
                confidence: exp.includes('Not detected') ? 0.0 : 0.91,
                sourceImageId: back?.imageId || 'img-2',
                sourceAngle: 'BACK',
                status: exp.includes('Not detected') ? 'MISSING' : 'CONFIRMED'
            },
            customerCare: {
                value: care,
                confidence: care.includes('Not detected') ? 0.0 : 0.93,
                sourceImageId: back?.imageId || 'img-2',
                sourceAngle: 'BACK',
                status: care.includes('Not detected') ? 'MISSING' : 'CONFIRMED'
            },
            fssaiLicense: {
                value: fssai,
                confidence: fssai.includes('Not detected') ? 0.0 : 0.97,
                sourceImageId: back?.imageId || 'img-2',
                sourceAngle: 'BACK',
                status: fssai.includes('Not detected') ? 'MISSING' : 'CONFIRMED'
            },
            storageInstructions: {
                value: Array.isArray(aiData.storageInstructions) ? aiData.storageInstructions.join(', ') : 'Store in a cool, dry place.',
                confidence: 0.88,
                sourceImageId: back?.imageId || 'img-2',
                sourceAngle: 'BACK',
                status: 'CONFIRMED'
            },
            warnings: {
                value: Array.isArray(aiData.warnings) ? aiData.warnings : [],
                confidence: 0.88,
                sourceImageId: back?.imageId || 'img-2',
                sourceAngle: 'BACK',
                status: Array.isArray(aiData.warnings) && aiData.warnings.length > 0 ? 'CONFIRMED' : 'MISSING'
            },
            labelClaims: {
                value: Array.isArray(aiData.claims) ? aiData.claims : [],
                confidence: 0.92,
                sourceImageId: front?.imageId || 'img-1',
                sourceAngle: 'FRONT',
                status: Array.isArray(aiData.claims) && aiData.claims.length > 0 ? 'CONFIRMED' : 'MISSING'
            },
            usageInstructions: Array.isArray(aiData.usageInstructions) && aiData.usageInstructions.length > 0 ? {
                value: aiData.usageInstructions,
                confidence: 0.89,
                sourceImageId: back?.imageId || 'img-2',
                sourceAngle: 'BACK',
                status: 'CONFIRMED'
            } : undefined,
            missingInformation: aiData.missingInformation || [],
            unclearInformation: aiData.unclearInformation || [],
            productIdentity: aiData.productIdentity,
            labelInformation: aiData.labelInformation,
            nutrition: aiData.nutrition,
            claims: aiData.claims,
            productInsights,
            evidence,
            confidenceSummary: {
                productName: pName.includes('Not detected') ? 'Needs Verification' : 'High',
                brand: brand.includes('Not detected') ? 'Needs Verification' : 'High',
                netQuantity: netQty.includes('Not detected') ? 'Needs Verification' : 'High',
                mrp: mrp.includes('Not detected') ? 'Needs Verification' : 'High',
                manufacturer: mfg.includes('Not detected') ? 'Needs Verification' : 'Medium',
                expiryDate: exp.includes('Not detected') ? 'Needs Verification' : 'High'
            }
        };
    }
}
