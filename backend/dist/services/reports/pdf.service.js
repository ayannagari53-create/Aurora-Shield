import PDFDocument from 'pdfkit';
export class PdfReportService {
    /**
     * Generates an enterprise-grade universal compliance analysis report PDF for the CURRENT scan.
     */
    static async generateReport(scan) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: 'A4',
                    margins: { top: 40, bottom: 40, left: 45, right: 45 },
                    bufferPages: true,
                    info: {
                        Title: `Aurora Shield Compliance Report - ${scan.productName}`,
                        Author: 'Aurora Shield Universal Product Intelligence',
                        Subject: 'Packaging Compliance Analysis'
                    }
                });
                const buffers = [];
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => resolve(Buffer.concat(buffers)));
                // Palettes
                const primaryColor = '#0B132B';
                const accentCyan = '#00B4D8';
                const darkGray = '#2B2D42';
                const lightBg = '#F8F9FA';
                const issueRed = '#D90429';
                const passGreen = '#06D6A0';
                const warnAmber = '#FFB703';
                // --- HEADER BANNER ---
                doc.rect(45, 40, 505, 60).fill('#080F1E');
                doc.fontSize(18).fillColor('#00F2FE').text('AURORA SHIELD', 60, 52, { characterSpacing: 1 });
                doc.fontSize(9).fillColor('#94A3B8').text('AI-POWERED UNIVERSAL PACKAGED PRODUCT COMPLIANCE SCANNER', 60, 75);
                doc.fontSize(8).fillColor('#64748B').text(`OFFICIAL AUDIT REPORT #${scan.id.slice(0, 12).toUpperCase()}`, 340, 56, { align: 'right' });
                doc.text(`DATE: ${new Date(scan.createdAt).toLocaleDateString()}`, 340, 72, { align: 'right' });
                doc.moveDown(2);
                let y = 120;
                // --- COMPLIANCE STATUS CALLOUT ---
                const statusColor = scan.status === 'COMPLIANT' ? passGreen : scan.status === 'POTENTIAL_ISSUE' ? issueRed : warnAmber;
                const statusText = scan.status === 'COMPLIANT' ? 'COMPLIANT' : scan.status === 'POTENTIAL_ISSUE' ? 'POTENTIAL NON-COMPLIANCE DETECTED' : 'NEEDS MANUAL VERIFICATION';
                doc.rect(45, y, 505, 55).fill(lightBg);
                doc.rect(45, y, 6, 55).fill(statusColor);
                doc.fontSize(10).fillColor(darkGray).text('OVERALL COMPLIANCE STATUS', 65, y + 10);
                doc.fontSize(14).fillColor(statusColor).text(statusText, 65, y + 25);
                doc.fontSize(11).fillColor(darkGray).text(`Score: ${scan.overallScore}/100`, 430, y + 25);
                y += 70;
                // --- PRODUCT METADATA ---
                doc.fontSize(12).fillColor(primaryColor).text('Product & Scan Profile', 45, y);
                y += 18;
                doc.rect(45, y, 505, 55).stroke('#CBD5E1');
                const data = scan.verifiedData || scan.extractedData;
                const brand = data?.brand?.value || 'Not detected';
                const netQty = data?.netQuantity?.value || 'Not detected';
                doc.fontSize(9).fillColor('#64748B')
                    .text('Product Name:', 55, y + 8)
                    .text('Brand:', 55, y + 24)
                    .text('Category:', 55, y + 40)
                    .text('Net Quantity:', 300, y + 8)
                    .text('Scan ID:', 300, y + 24)
                    .text('Evaluated Images:', 300, y + 40);
                doc.fillColor(darkGray)
                    .text(scan.productName, 135, y + 8, { width: 155 })
                    .text(brand, 135, y + 24, { width: 155 })
                    .text(scan.category, 135, y + 40, { width: 155 })
                    .text(netQty, 390, y + 8, { width: 150 })
                    .text(scan.id, 390, y + 24, { width: 150 })
                    .text(`${scan.images.length} panels analyzed`, 390, y + 40);
                y += 70;
                // --- EXECUTIVE SUMMARY ---
                doc.fontSize(12).fillColor(primaryColor).text('Executive Summary', 45, y);
                y += 16;
                doc.fontSize(9).fillColor(darkGray).text(scan.executiveSummary, 45, y, { width: 505, lineGap: 3 });
                y += 45;
                // --- EXTRACTED LABEL DETAILS ---
                if (data) {
                    doc.fontSize(12).fillColor(primaryColor).text('Extracted Label Information', 45, y);
                    y += 16;
                    const mrpVal = data.mrp?.value || 'Not detected';
                    const mfgVal = data.manufacturer?.value || 'Not detected';
                    const expVal = data.expiryDate?.value || 'Not detected';
                    const batchVal = data.batchNumber?.value || 'Not detected';
                    const fssaiVal = data.fssaiLicense?.value || 'Not detected';
                    const countryVal = data.countryOfOrigin?.value || 'Not detected';
                    doc.rect(45, y, 505, 65).fill('#F8FAFC').stroke('#E2E8F0');
                    doc.fontSize(8).fillColor('#64748B')
                        .text('MRP:', 55, y + 8)
                        .text('Manufacturer:', 55, y + 24)
                        .text('Country of Origin:', 55, y + 48)
                        .text('Expiry / Best Before:', 300, y + 8)
                        .text('Batch Number:', 300, y + 24)
                        .text('Statutory Lic / FSSAI:', 300, y + 40);
                    doc.fillColor(darkGray)
                        .text(mrpVal, 135, y + 8, { width: 155 })
                        .text(mfgVal, 135, y + 24, { width: 155, height: 22 })
                        .text(countryVal, 135, y + 48, { width: 155 })
                        .text(expVal, 400, y + 8, { width: 140 })
                        .text(batchVal, 400, y + 24, { width: 140 })
                        .text(fssaiVal, 400, y + 40, { width: 140 });
                    y += 80;
                }
                // --- PRODUCT INSIGHTS (USES, BENEFITS, WARNINGS, DISADVANTAGES) ---
                if (data?.productInsights) {
                    if (y > 580) {
                        doc.addPage();
                        y = 45;
                    }
                    doc.fontSize(12).fillColor(primaryColor).text('Product Intelligence Insights', 45, y);
                    y += 16;
                    const insights = data.productInsights;
                    const uText = insights.uses?.map(u => `• ${u.text}`).join('\n') || '• Standard packaged commodity usage.';
                    const bText = insights.benefits?.map(b => `• ${b.text}`).join('\n') || '• Sealed statutory packaging.';
                    const wText = insights.warnings?.map(w => `• ${w.text}`).join('\n') || '• No specific hazard warnings detected.';
                    const dText = [...(insights.disadvantages || []), ...(insights.limitations || [])].map(d => `• ${d.text}`).join('\n') || '• Standard dietary/application boundaries apply.';
                    // 4 Grid blocks or stacked cards
                    doc.rect(45, y, 245, 60).fill('#F0FDF4').stroke('#BBF7D0');
                    doc.fontSize(8).fillColor('#166534').text('🎯 USES & APPLICATIONS', 52, y + 6);
                    doc.fontSize(7.5).fillColor(darkGray).text(uText, 52, y + 18, { width: 230, height: 38, lineGap: 1 });
                    doc.rect(305, y, 245, 60).fill('#EFF6FF').stroke('#BFDBFE');
                    doc.fontSize(8).fillColor('#1E40AF').text('✅ BENEFITS & ADVANTAGES', 312, y + 6);
                    doc.fontSize(7.5).fillColor(darkGray).text(bText, 312, y + 18, { width: 230, height: 38, lineGap: 1 });
                    y += 66;
                    doc.rect(45, y, 245, 60).fill('#FEF2F2').stroke('#FECDD3');
                    doc.fontSize(8).fillColor('#991B1B').text('⚠️ WARNINGS & PRECAUTIONS', 52, y + 6);
                    doc.fontSize(7.5).fillColor(darkGray).text(wText, 52, y + 18, { width: 230, height: 38, lineGap: 1 });
                    doc.rect(305, y, 245, 60).fill('#FFFBEB').stroke('#FDE68A');
                    doc.fontSize(8).fillColor('#92400E').text('➖ DISADVANTAGES & LIMITATIONS', 312, y + 6);
                    doc.fontSize(7.5).fillColor(darkGray).text(dText, 312, y + 18, { width: 230, height: 38, lineGap: 1 });
                    y += 72;
                }
                // --- HUMAN VERIFICATION AUDIT ---
                doc.fontSize(12).fillColor(primaryColor).text('Human Verification Audit Trail', 45, y);
                y += 16;
                const vStatus = scan.humanVerification?.isVerified ? 'VERIFIED BY OPERATOR' : 'PENDING FINAL SIGN-OFF';
                const vColor = scan.humanVerification?.isVerified ? passGreen : warnAmber;
                doc.fontSize(9).fillColor(vColor).text(`Status: ${vStatus}`, 45, y);
                if (scan.humanVerification?.isVerified) {
                    doc.fillColor('#64748B').text(`Audit Timestamp: ${scan.humanVerification.verifiedAt || new Date().toISOString()} | Changes: ${scan.humanVerification.editedFields?.length || 0} fields`, 180, y);
                }
                y += 24;
                // --- DETECTED CONFLICTS / ISSUES TABLE ---
                if (scan.conflicts && scan.conflicts.length > 0) {
                    doc.fontSize(12).fillColor(issueRed).text(`Cross-Label Discrepancies & Conflicts (${scan.conflicts.length})`, 45, y);
                    y += 18;
                    for (const conf of scan.conflicts) {
                        if (y > 680) {
                            doc.addPage();
                            y = 45;
                        }
                        doc.rect(45, y, 505, 50).fill('#FFF1F2').stroke('#FECDD3');
                        doc.fontSize(9).fillColor(issueRed).text(`[${conf.id}] ${conf.fieldLabel}: ${conf.description}`, 55, y + 8, { width: 485 });
                        const evidenceStr = conf.discrepantValues.map(v => `${v.sourceAngle} Label: "${v.value}"`).join(' vs ');
                        doc.fontSize(8).fillColor('#9F1239').text(`Evidence: ${evidenceStr}`, 55, y + 24);
                        doc.fontSize(8).fillColor('#64748B').text(`Prescribed Fix: ${conf.recommendation}`, 55, y + 36);
                        y += 58;
                    }
                }
                // --- RULE RESULTS TABLE ---
                if (y > 600) {
                    doc.addPage();
                    y = 45;
                }
                doc.fontSize(12).fillColor(primaryColor).text('Deterministic Regulatory Checks', 45, y);
                y += 18;
                for (const rule of scan.ruleResults) {
                    if (y > 700) {
                        doc.addPage();
                        y = 45;
                    }
                    const rColor = rule.status === 'PASS' ? passGreen : rule.status === 'POTENTIAL_ISSUE' ? issueRed : warnAmber;
                    doc.rect(45, y, 505, 42).stroke('#E2E8F0');
                    doc.rect(45, y, 4, 42).fill(rColor);
                    doc.fontSize(9).fillColor(darkGray).text(`${rule.ruleId} (v${rule.ruleVersion}) - ${rule.title}`, 55, y + 6);
                    doc.fontSize(8).fillColor(rColor).text(rule.status, 470, y + 6);
                    doc.fontSize(8).fillColor('#64748B').text(`Evaluation: ${rule.explanation}`, 55, y + 18, { width: 475 });
                    doc.text(`Recommendation: ${rule.recommendation}`, 55, y + 29, { width: 475 });
                    y += 48;
                }
                // --- FOOTER ON ALL PAGES ---
                const pageCount = doc.bufferedPageRange().count;
                for (let i = 0; i < pageCount; i++) {
                    doc.switchToPage(i);
                    doc.rect(45, 785, 505, 20).fill('#F1F5F9');
                    doc.fontSize(8).fillColor('#64748B')
                        .text('Generated by Aurora Shield Universal Product Intelligence • Confidential Audit Artifact', 55, 791)
                        .text(`Page ${i + 1} of ${pageCount}`, 480, 791);
                }
                doc.end();
            }
            catch (err) {
                reject(err);
            }
        });
    }
}
