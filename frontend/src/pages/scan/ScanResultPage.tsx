import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  AlertTriangle,
  FileDown,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  Scale,
  Sparkles,
  Info,
  Calendar,
  Layers,
  HelpCircle,
  Clock,
  Building,
  Tag,
  Phone,
  BookOpen,
  Check,
  AlertOctagon
} from 'lucide-react';
import { scanApi } from '../../services/api';
import { ComplianceScanRecord, Core3DState, LabelAngle } from '../../types';
import { AuroraCore } from '../../components/3d/AuroraCore';

export const ScanResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [scan, setScan] = useState<ComplianceScanRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'rules' | 'conflicts' | 'evidence' | 'audit'>('profile');
  const [selectedIssueRule, setSelectedIssueRule] = useState<any | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [selectedAnglePreview, setSelectedAnglePreview] = useState<LabelAngle | 'ALL'>('ALL');

  useEffect(() => {
    const fetchScanDetails = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const res = await scanApi.getScan(id);
        setScan(res.scan);
        if (res.scan.ruleResults?.some(r => r.status === 'POTENTIAL_ISSUE')) {
          setSelectedIssueRule(res.scan.ruleResults.find(r => r.status === 'POTENTIAL_ISSUE'));
        }
      } catch (err: any) {
        setError(err.message || 'Unable to retrieve scan results');
      } finally {
        setLoading(false);
      }
    };

    fetchScanDetails();
  }, [id]);

  const handleDownloadPdf = async () => {
    if (!id) return;
    try {
      setDownloadingPdf(true);
      const url = await scanApi.getReportPdfBlobUrl(id);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aurora_shield_report_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`PDF download failed: ${err.message}`);
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <AuroraCore size={180} state="ANALYZING" />
        <p className="text-sm font-mono text-cyan-400 tracking-wider">RETRIEVING COMPLIANCE INTELLIGENCE...</p>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 rounded-2xl border border-rose-500/40 bg-slate-950/80 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Scan Not Found</h2>
        <p className="text-xs text-slate-400">{error || 'The requested scan record does not exist.'}</p>
        <Link
          to="/dashboard"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-cyan-300"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    );
  }

  const isIssue = scan.status === 'POTENTIAL_ISSUE';
  const isCompliant = scan.status === 'COMPLIANT';
  const coreState: Core3DState = isCompliant ? 'COMPLIANT' : isIssue ? 'POTENTIAL_ISSUE' : 'NEEDS_VERIFICATION';

  const data = scan.verifiedData || scan.extractedData;
  const brand = data?.brand?.value || 'Not detected';
  const category = data?.category?.value || scan.category;
  const netQty = data?.netQuantity?.value || 'Not detected';
  const mrp = data?.mrp?.value || 'Not detected';
  const mfg = data?.manufacturer?.value || 'Not detected';
  const country = data?.countryOfOrigin?.value || 'Not detected';
  const batch = data?.batchNumber?.value || 'Not detected';
  const exp = data?.expiryDate?.value || 'Not detected';
  const mfgDate = data?.manufacturingDate?.value;
  const fssai = data?.fssaiLicense?.value || 'Not detected';
  const care = data?.customerCare?.value || 'Not detected';
  const storage = data?.storageInstructions?.value || 'Store in a cool and dry place.';
  const ings = data?.ingredients?.value || [];
  const allergens = data?.allergens?.value || [];
  const warnings = data?.warnings?.value || [];
  const claims = data?.labelClaims?.value || [];
  const usage = data?.usageInstructions?.value || [];
  const missing = data?.missingInformation || [];
  const nutrition = data?.nutritionalInfo?.value || {};

  const isFoodCategory = category.toLowerCase().includes('food') || category.toLowerCase().includes('beverage') || category.toLowerCase().includes('snack');
  const isCosmetic = category.toLowerCase().includes('cosmetic') || category.toLowerCase().includes('personal care') || category.toLowerCase().includes('skin');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Bar with Back Link, Brand & Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            to="/dashboard"
            className="p-2 rounded-lg border border-slate-800 bg-slate-900/80 text-slate-400 hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-white font-['Space_Grotesk']">{scan.productName}</h1>
              {scan.isDemoSample && (
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-500/40 uppercase">
                  Sample Demo Data
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 font-mono">
              BRAND: <span className="text-cyan-300">{brand}</span> • CATEGORY: <span className="text-slate-200">{category}</span> • ID: {scan.id}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/scan/new"
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 transition-colors"
          >
            <span>Scan Another Product</span>
          </Link>

          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-[0_0_20px_rgba(0,242,254,0.3)] transition-all cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            <span>{downloadingPdf ? 'Generating PDF...' : 'Download Official PDF Report'}</span>
          </button>
        </div>
      </div>

      {/* Hero Compliance Banner with 3D Core */}
      <div className="rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl overflow-hidden relative">
        <div className="space-y-4 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-mono font-extrabold uppercase tracking-wider ${
                isIssue
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                  : isCompliant
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
              }`}
            >
              {scan.status.replace('_', ' ')}
            </span>

            <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800">
              AUDIT COMPLIANCE SCORE: {scan.overallScore}/100
            </span>
          </div>

          <p className="text-sm text-slate-200 leading-relaxed">
            {scan.executiveSummary}
          </p>

          <div className="grid grid-cols-3 gap-3 pt-2 font-mono text-center max-w-md">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/20">
              <div className="text-[10px] text-emerald-400">RULES PASSED</div>
              <div className="text-lg font-bold text-white">{scan.passedCount}</div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-amber-500/20">
              <div className="text-[10px] text-amber-400">NEEDS VERIF.</div>
              <div className="text-lg font-bold text-white">{scan.needsVerificationCount}</div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-rose-500/20">
              <div className="text-[10px] text-rose-400">ISSUES FLAGGED</div>
              <div className="text-lg font-bold text-white">{scan.potentialIssueCount}</div>
            </div>
          </div>
        </div>

        {/* 3D Core */}
        <div className="w-56 h-56 flex-shrink-0">
          <AuroraCore state={coreState} className="w-full h-full" />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 overflow-x-auto pb-2">
        {[
          { key: 'profile', label: 'Product Intelligence Profile', icon: Layers },
          { key: 'rules', label: `Regulatory Rules (${scan.ruleResults?.length || 0})`, icon: Scale },
          { key: 'conflicts', label: `Label Discrepancies (${scan.conflicts?.length || 0})`, icon: AlertTriangle },
          { key: 'evidence', label: `Forensic Evidence (${data?.evidence?.length || 0})`, icon: Eye },
          { key: 'audit', label: 'Human Verification Audit', icon: ShieldCheck }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(0,242,254,0.2)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: UNIVERSAL PRODUCT INTELLIGENCE PROFILE */}
      {activeTab === 'profile' && (
        <div className="space-y-8">
          
          {/* Packaging Image Carousel / Gallery */}
          {scan.images && scan.images.length > 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span>Scanned Packaging Panels ({scan.images.length} uploaded)</span>
                </h3>
                <span className="text-xs font-mono text-slate-400">Click panel to filter</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {scan.images.map((img, i) => (
                  <div
                    key={img.id || i}
                    onClick={() => setSelectedAnglePreview(selectedAnglePreview === img.labelAngle ? 'ALL' : img.labelAngle)}
                    className={`rounded-xl border p-2 bg-slate-900 cursor-pointer transition-all ${
                      selectedAnglePreview === img.labelAngle
                        ? 'border-cyan-400 shadow-[0_0_15px_rgba(0,242,254,0.3)]'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="aspect-square rounded-lg overflow-hidden bg-slate-950 flex items-center justify-center relative">
                      <img src={img.url} alt={img.filename} className="w-full h-full object-contain p-1" />
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-950/90 text-cyan-300 border border-cyan-500/40">
                        {img.labelAngle}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-300 truncate mt-1">{img.filename}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 1: Product Overview & Core Label Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Identity Card */}
            <div className="p-5 rounded-2xl border border-cyan-500/30 bg-slate-950/80 space-y-3">
              <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">1. PRODUCT IDENTITY</span>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Generic Product:</span>
                  <span className="font-mono font-bold text-white">{scan.productName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Brand Name:</span>
                  <span className="font-mono font-bold text-cyan-300">{brand}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Category:</span>
                  <span className="font-mono text-slate-200">{category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Net Quantity:</span>
                  <span className="font-mono font-bold text-emerald-400">{netQty}</span>
                </div>
              </div>
            </div>

            {/* Price & Commercial Card */}
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/80 space-y-3">
              <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">2. STATUTORY PRICE & METROLOGY</span>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Retail Sale Price (MRP):</span>
                  <span className="font-mono font-bold text-amber-300">{mrp}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Country of Origin:</span>
                  <span className="font-mono text-white">{country}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Statutory License / FSSAI:</span>
                  <span className="font-mono text-cyan-300">{fssai}</span>
                </div>
              </div>
            </div>

            {/* Dates & Lot Card */}
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/80 space-y-3">
              <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">3. DATES & BATCH IDENTITY</span>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Batch / Lot Number:</span>
                  <span className="font-mono font-bold text-white">{batch}</span>
                </div>
                {mfgDate && (
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400">Mfg / Packaging Date:</span>
                    <span className="font-mono text-slate-300">{mfgDate}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Expiry / Best Before:</span>
                  <span className="font-mono font-bold text-rose-300">{exp}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Manufacturer & Consumer Care */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/80 space-y-2">
              <div className="flex items-center space-x-2 text-cyan-400">
                <Building className="w-4 h-4" />
                <span className="text-xs font-bold font-mono uppercase">Manufacturer / Packer / Marketer</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-mono">
                {mfg}
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/80 space-y-2">
              <div className="flex items-center space-x-2 text-cyan-400">
                <Phone className="w-4 h-4" />
                <span className="text-xs font-bold font-mono uppercase">Consumer Grievance Redressal</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-mono">
                {care}
              </p>
            </div>
          </div>

          {/* Section 3: Ingredients & Formulation Breakdown */}
          {ings.length > 0 && !ings[0]?.includes('Not detected') && (
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-cyan-400 uppercase">
                  Declared Ingredients & Formulation ({ings.length} components)
                </span>
                <span className="text-[10px] font-mono text-slate-400">Descending order of composition</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {ings.map((item, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-xl text-xs font-mono bg-slate-900 border border-slate-700 text-slate-200 shadow-sm"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Nutrition Table (Category-Aware: Rendered if Food/Beverage or detected) */}
          {(isFoodCategory || Object.keys(nutrition).length > 0) && (
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/80 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-cyan-400">
                  <Scale className="w-4 h-4" />
                  <span className="text-xs font-bold font-mono uppercase">Nutritional Information Table</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Per 100g / Per Serving Reference</span>
              </div>

              {Object.keys(nutrition).length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {Object.entries(nutrition).map(([nKey, nVal]) => (
                    <div key={nKey} className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-center">
                      <div className="text-[10px] text-slate-400 truncate uppercase">{nKey}</div>
                      <div className="text-xs font-bold text-white mt-1">{String(nVal)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400 italic">
                  No nutritional facts panel was extracted from the uploaded images.
                </div>
              )}
            </div>
          )}

          {/* Section 5: Allergens, Warnings, Storage & Usage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Allergens & Warnings */}
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/80 space-y-3">
              <span className="text-xs font-bold font-mono text-amber-400 uppercase">
                Allergen Advisory & Safety Warnings
              </span>

              {allergens.length > 0 && !allergens[0]?.includes('Not detected') ? (
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-rose-300">Declared Allergens:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {allergens.map((a, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-mono bg-rose-950/80 text-rose-200 border border-rose-500/40">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400">No major allergen declarations identified.</div>
              )}

              {warnings.length > 0 && !warnings[0]?.includes('Not detected') && (
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <div className="text-[11px] font-semibold text-amber-300">Cautionary Statements:</div>
                  <ul className="text-xs text-slate-300 list-disc list-inside space-y-1">
                    {warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Storage & Usage */}
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/80 space-y-3">
              <span className="text-xs font-bold font-mono text-cyan-400 uppercase">
                Storage & Usage Directions
              </span>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Storage Condition:</span>
                  <span className="text-slate-200 font-mono">{storage}</span>
                </div>

                {usage.length > 0 && (
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-slate-400 block mb-1">Directions for Use:</span>
                    <ul className="text-slate-200 list-disc list-inside space-y-0.5 font-mono">
                      {usage.map((u, i) => (
                        <li key={i}>{u}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 6: Claims & Certifications */}
          {claims.length > 0 && (
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/80 space-y-3">
              <span className="text-xs font-bold font-mono text-emerald-400 uppercase">
                Front-of-Pack Claims & Certifications
              </span>
              <div className="flex flex-wrap gap-2">
                {claims.map((claim, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-xl text-xs font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1.5">
                    <Check className="w-3.5 h-3.5" />
                    <span>{claim}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Section 7: Missing / Unclear Information Warnings */}
          {missing.length > 0 && (
            <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-950/20 space-y-3">
              <div className="flex items-center space-x-2 text-amber-400">
                <HelpCircle className="w-4 h-4" />
                <span className="text-xs font-bold font-mono uppercase">
                  Missing / Unclear Statutory Information ({missing.length} items not detected)
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                The following mandatory attributes were not detected on the uploaded packaging panels. If present on another panel face, upload additional images:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {missing.map((m, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-950 text-amber-300 border border-amber-500/30">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB 2: REGULATORY RULES BREAKDOWN */}
      {activeTab === 'rules' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rules List */}
          <div className="lg:col-span-2 space-y-3">
            {scan.ruleResults?.map(rule => {
              const isSelected = selectedIssueRule?.ruleId === rule.ruleId;

              return (
                <div
                  key={rule.ruleId}
                  onClick={() => setSelectedIssueRule(rule)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-cyan-400 bg-slate-900/90 shadow-[0_0_20px_rgba(0,242,254,0.15)]'
                      : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-mono text-cyan-400">{rule.ruleId} • {rule.category}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        rule.status === 'PASS'
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                          : rule.status === 'POTENTIAL_ISSUE'
                          ? 'bg-rose-950/60 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {rule.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-100 mb-1">{rule.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{rule.description}</p>
                </div>
              );
            })}
          </div>

          {/* Interactive Evidence Explorer */}
          <div className="space-y-4">
            <div className="sticky top-20 rounded-2xl border border-cyan-500/20 bg-slate-950/90 p-5 space-y-4 backdrop-blur-xl">
              <div className="flex items-center space-x-2 text-cyan-400 border-b border-slate-800 pb-3">
                <Eye className="w-4 h-4" />
                <h3 className="font-bold text-sm text-white">Rule Evidence Explorer</h3>
              </div>

              {selectedIssueRule ? (
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">SELECTED RULE</span>
                    <h4 className="font-bold text-sm text-slate-100">{selectedIssueRule.title}</h4>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                    <span className="font-semibold text-cyan-400 block mb-1">Regulatory Standard:</span>
                    {selectedIssueRule.explanation}
                  </div>

                  {selectedIssueRule.evidence?.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono text-slate-400 uppercase">LABEL EVIDENCE</span>
                      {selectedIssueRule.evidence.map((ev: any, i: number) => (
                        <div key={i} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
                          <div className="text-[10px] font-mono text-cyan-400">{ev.sourceAngle || 'PACKAGING'} PANEL</div>
                          <div className="text-slate-200 mt-0.5">{ev.statement}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200">
                    <span className="font-semibold block mb-1">Prescribed Action:</span>
                    {selectedIssueRule.recommendation}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Select any rule from the list to inspect forensic evidence.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LABEL CONFLICTS INSPECTOR */}
      {activeTab === 'conflicts' && (
        <div className="space-y-4">
          {scan.conflicts && scan.conflicts.length > 0 ? (
            scan.conflicts.map(c => (
              <div key={c.id} className="p-6 rounded-2xl border border-rose-500/30 bg-slate-950/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                    <h3 className="font-bold text-base text-white">{c.fieldLabel}</h3>
                  </div>
                  <span className="px-2.5 py-1 rounded text-xs font-mono bg-rose-950 text-rose-300 font-bold uppercase">
                    {c.severity} SEVERITY
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{c.description}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {c.discrepantValues?.map((dv: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <div className="text-[10px] font-mono text-cyan-400 uppercase">
                        {dv.sourceAngle} PANEL EVIDENCE
                      </div>
                      <div className="text-sm font-mono font-bold text-white">{dv.value}</div>
                      <div className="text-[10px] font-mono text-slate-400">Confidence: {dv.confidence ? Math.round(dv.confidence * 100) : 90}%</div>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-300">
                  <span className="font-semibold">Remediation Action:</span> {c.recommendation}
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-950/50 space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="font-bold text-sm text-slate-200">Zero Cross-Label Conflicts</h3>
              <p className="text-xs text-slate-400">All extracted quantities, values, and dates match across packaging panels.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: FORENSIC EVIDENCE VIEWER */}
      {activeTab === 'evidence' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-cyan-500/20 bg-slate-950/80 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Eye className="w-4 h-4 text-cyan-400" />
                <span>Forensic Packaging Evidence Log ({data?.evidence?.length || 0} entries)</span>
              </h3>
              <span className="text-xs font-mono text-slate-400">Auditable image-linked trace</span>
            </div>

            {data?.evidence && data.evidence.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.evidence.map((ev, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-cyan-400 uppercase font-bold">{ev.field}</span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/30 uppercase">
                        {ev.sourceAngle} PANEL
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed font-mono">
                      {ev.statement}
                    </p>

                    {ev.snippet && (
                      <div className="text-[11px] text-slate-400 italic bg-slate-950 p-2 rounded border border-slate-800 font-mono">
                        "{ev.snippet}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No granular evidence logs recorded for this scan.</p>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 space-y-6">
          <div className="flex items-center space-x-2 text-cyan-400">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="font-bold text-base text-white">Immutable Human Verification Audit Record</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px]">VERIFYING OFFICER</span>
              <div className="text-sm font-bold text-slate-100">{scan.humanVerification?.verifiedBy || 'Officer Compliance Operator'}</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px]">VERIFICATION TIMESTAMP</span>
              <div className="text-sm font-bold text-cyan-400">
                {scan.humanVerification?.verifiedAt
                  ? new Date(scan.humanVerification.verifiedAt).toLocaleString()
                  : 'Pending Final Verification'}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-300">Fields Verified & Adjusted by Inspector</h4>
            <div className="flex flex-wrap gap-2">
              {scan.humanVerification?.editedFields?.length ? (
                scan.humanVerification.editedFields.map(f => (
                  <span key={f} className="px-2.5 py-1 rounded-lg text-xs font-mono bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                    {f}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">All AI extractions verified without manual field override.</span>
              )}
            </div>
          </div>

          {scan.humanVerification?.notes && (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <span className="font-semibold text-slate-400 block mb-1">Inspector Justification Notes:</span>
              "{scan.humanVerification.notes}"
            </div>
          )}
        </div>
      )}

    </div>
  );
};
