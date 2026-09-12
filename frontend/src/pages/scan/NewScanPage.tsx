import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Eye,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Sparkles,
  ShieldCheck,
  Scale,
  FileText,
  Building,
  Phone,
  HelpCircle,
  Check,
  Sliders,
  Target,
  ShieldAlert,
  MinusCircle
} from 'lucide-react';
import { scanApi } from '../../services/api';
import { LabelAngle, StructuredProductData, Core3DState } from '../../types';
import { AuroraCore } from '../../components/3d/AuroraCore';

const CATEGORIES = [
  { id: 'Food & Beverages', label: 'Food & Beverages', sub: 'FSSAI (Labelling 2020) & Legal Metrology' },
  { id: 'Cosmetics', label: 'Cosmetics & Personal Care', sub: 'Cosmetics Rules 2020 & Metrology' },
  { id: 'Pharmaceuticals', label: 'Pharmaceuticals & Health', sub: 'Drugs & Cosmetics Act' },
  { id: 'Household Products', label: 'Household & Cleaning', sub: 'Hazard, Safety & Metrology Standards' },
  { id: 'Electronics', label: 'Electronics & Consumer Goods', sub: 'E-Waste, Technical & Metrology' },
  { id: 'Other', label: 'Other Packaged Commodities', sub: 'General Legal Metrology' }
];

const ANGLES: LabelAngle[] = ['FRONT', 'BACK', 'SIDE', 'INGREDIENTS', 'NUTRITION', 'TOP', 'BOTTOM', 'OTHER'];

export const NewScanPage: React.FC = () => {
  const navigate = useNavigate();

  // Wizard Steps: 1: Category, 2: Upload, 3: AI Product Processing, 4: Product Profile & Human Verify, 5: Compliance Decision
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState('Food & Beverages');
  const [productNameInput, setProductNameInput] = useState('');

  // Uploaded Files State
  const [files, setFiles] = useState<File[]>([]);
  const [fileAngles, setFileAngles] = useState<LabelAngle[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Scan State (Freshly initialized per scan)
  const [scanId, setScanId] = useState<string | null>(null);
  const [coreState, setCoreState] = useState<Core3DState>('SCANNING');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Results State
  const [extractedData, setExtractedData] = useState<StructuredProductData | null>(null);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [ruleResults, setRuleResults] = useState<any[]>([]);
  const [overallScore, setOverallScore] = useState<number>(0);
  const [scanStatus, setScanStatus] = useState<string>('NEEDS_VERIFICATION');

  // Human Verification State
  const [humanFormData, setHumanFormData] = useState<Record<string, string>>({});
  const [editedFields, setEditedFields] = useState<string[]>([]);
  const [officerNotes, setOfficerNotes] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Clear previous scan state on mount
  useEffect(() => {
    setScanId(null);
    setFiles([]);
    setFileAngles([]);
    setPreviewUrls([]);
    setExtractedData(null);
    setConflicts([]);
    setRuleResults([]);
    setHumanFormData({});
    setEditedFields([]);
    setIsEditingProfile(false);
  }, []);

  // Add files from user upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    const newFiles = [...files, ...selected].slice(0, 8);
    setFiles(newFiles);

    const newAngles: LabelAngle[] = newFiles.map((_, i) => fileAngles[i] || (i === 0 ? 'FRONT' : i === 1 ? 'BACK' : i === 2 ? 'INGREDIENTS' : i === 3 ? 'NUTRITION' : 'SIDE'));
    setFileAngles(newAngles);

    const urls = newFiles.map(f => URL.createObjectURL(f));
    setPreviewUrls(urls);
  };

  const removeFile = (index: number) => {
    const updatedF = files.filter((_, i) => i !== index);
    const updatedA = fileAngles.filter((_, i) => i !== index);
    const updatedUrls = previewUrls.filter((_, i) => i !== index);
    setFiles(updatedF);
    setFileAngles(updatedA);
    setPreviewUrls(updatedUrls);
  };

  const changeAngle = (index: number, angle: LabelAngle) => {
    const updatedA = [...fileAngles];
    updatedA[index] = angle;
    setFileAngles(updatedA);
  };

  // Step 2 -> 3 -> 4: Full AI Product Intelligence & Understanding Pipeline
  const handleStartAnalysis = async () => {
    if (files.length === 0) {
      setError('Please upload at least 1 product label image');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setCurrentStep(3); // Show AI Processing stage

      // 1. Create Scan with clean new ID
      setProcessingStage('Initializing isolated product scanning environment...');
      setCoreState('SCANNING');
      const created = await scanApi.createScan(selectedCategory, productNameInput || 'Packaged Product Scan');
      const newScanId = created.scan.id;
      setScanId(newScanId);

      // 2. Upload actual images to backend
      setProcessingStage('Uploading packaging images & verifying clarity heuristics...');
      await scanApi.uploadImages(newScanId, files, fileAngles);

      // 3. AI Vision Understanding & Structured Product Extraction
      setProcessingStage('AI Vision analyzing packaging, identifying product & synthesizing label intelligence...');
      setCoreState('ANALYZING');
      const analysisRes = await scanApi.analyzeScan(newScanId);

      setExtractedData(analysisRes.extractedData);
      setConflicts(analysisRes.conflicts || []);
      setRuleResults(analysisRes.ruleResults || []);
      setOverallScore(analysisRes.overallScore || 0);
      setScanStatus(analysisRes.status || 'NEEDS_VERIFICATION');

      // Populate human verification form with AI extracted defaults
      const rawMap: Record<string, string> = {
        productName: analysisRes.extractedData.productName?.value || '',
        brand: analysisRes.extractedData.brand?.value || '',
        category: analysisRes.extractedData.category?.value || selectedCategory,
        netQuantity: analysisRes.extractedData.netQuantity?.value || '',
        mrp: analysisRes.extractedData.mrp?.value || '',
        manufacturer: analysisRes.extractedData.manufacturer?.value || '',
        countryOfOrigin: analysisRes.extractedData.countryOfOrigin?.value || '',
        expiryDate: analysisRes.extractedData.expiryDate?.value || '',
        batchNumber: analysisRes.extractedData.batchNumber?.value || '',
        fssaiLicense: analysisRes.extractedData.fssaiLicense?.value || '',
        customerCare: analysisRes.extractedData.customerCare?.value || '',
        storageInstructions: analysisRes.extractedData.storageInstructions?.value || ''
      };
      setHumanFormData(rawMap);

      // Transition to Product Profile & Verification
      setCoreState('VERIFYING');
      setCurrentStep(4);
    } catch (err: any) {
      setError(err.message || 'Product intelligence analysis failed');
      setCurrentStep(2);
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 4 -> 5: Submit Human Verification & Rules Decision
  const handleConfirmHumanVerification = async () => {
    if (!scanId || !extractedData) return;
    try {
      setIsProcessing(true);
      setError(null);

      // Deep clone extracted data with human overrides
      const verifiedPayload: StructuredProductData = JSON.parse(JSON.stringify(extractedData));
      Object.keys(humanFormData).forEach(key => {
        if ((verifiedPayload as any)[key]) {
          (verifiedPayload as any)[key].value = humanFormData[key];
          if (editedFields.includes(key)) {
            (verifiedPayload as any)[key].status = 'CONFIRMED';
            (verifiedPayload as any)[key].confidence = 100;
          }
        }
      });

      const res = await scanApi.verifyScan(scanId, verifiedPayload, editedFields, officerNotes);
      setConflicts(res.scan.conflicts || []);
      setRuleResults(res.scan.ruleResults || []);
      setOverallScore(res.scan.overallScore || 0);
      setScanStatus(res.scan.status || 'NEEDS_VERIFICATION');
      setCoreState(
        res.scan.status === 'COMPLIANT'
          ? 'COMPLIANT'
          : res.scan.status === 'POTENTIAL_ISSUE'
          ? 'POTENTIAL_ISSUE'
          : 'NEEDS_VERIFICATION'
      );

      setCurrentStep(5); // Final Decision View
    } catch (err: any) {
      setError(err.message || 'Human verification failed to submit');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFieldChange = (field: string, val: string) => {
    setHumanFormData(prev => ({ ...prev, [field]: val }));
    if (!editedFields.includes(field)) {
      setEditedFields(prev => [...prev, field]);
    }
  };

  const isFoodCategory = (extractedData?.category?.value || selectedCategory).toLowerCase().includes('food') || (extractedData?.category?.value || selectedCategory).toLowerCase().includes('beverage');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Breadcrumb Wizard Progress */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Space_Grotesk']">
            AI Product Intelligence Scanner
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            PIPELINE: VISION UNDERSTANDING • PRODUCT IDENTIFICATION • STRUCTURED PROFILE • COMPLIANCE
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center space-x-1.5 overflow-x-auto max-w-full pb-2 sm:pb-0">
          {[
            { step: 1, label: 'Category' },
            { step: 2, label: 'Upload Images' },
            { step: 3, label: 'AI Intelligence' },
            { step: 4, label: 'Product Profile' },
            { step: 5, label: 'Compliance' }
          ].map(s => {
            const isDone = currentStep > s.step;
            const isCurr = currentStep === s.step;

            return (
              <div
                key={s.step}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                  isCurr
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : isDone
                    ? 'text-emerald-400'
                    : 'text-slate-600'
                }`}
              >
                <span>{s.step}.</span>
                <span>{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-950/40 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-white font-bold ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        
        {/* STEP 1: CATEGORY SELECTION */}
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white">Select Product Category</h2>
              <p className="text-xs sm:text-sm text-slate-400">
                AI extraction and compliance rules adapt dynamically to category packaging standards.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {CATEGORIES.map(cat => (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                    selectedCategory === cat.id
                      ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_20px_rgba(0,242,254,0.2)]'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-100">{cat.label}</span>
                    <span className={`w-3 h-3 rounded-full border ${selectedCategory === cat.id ? 'bg-cyan-400 border-cyan-300' : 'border-slate-600'}`} />
                  </div>
                  <p className="text-xs text-slate-400 font-mono">{cat.sub}</p>
                </div>
              ))}
            </div>

            <div className="max-w-md mx-auto space-y-2 pt-2">
              <label className="block text-xs font-medium text-slate-300">
                Product Title / Brand Hint (Optional)
              </label>
              <input
                type="text"
                value={productNameInput}
                onChange={e => setProductNameInput(e.target.value)}
                placeholder="e.g. Parle-G, Oreo, Coca-Cola, Lay's, Nivea, Dettol"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex justify-center pt-4">
              <button
                onClick={() => setCurrentStep(2)}
                className="flex items-center space-x-2 px-8 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 shadow-[0_0_20px_rgba(0,242,254,0.3)] transition-all cursor-pointer"
              >
                <span>Proceed to Image Upload</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: MULTI-IMAGE UPLOAD */}
        {currentStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-xl font-bold text-white">Upload Product Packaging Images</h2>
              <p className="text-xs text-slate-400">
                Upload Front, Back, Nutritional, Ingredients, or Side label panels of ANY packaged product.
              </p>
            </div>

            {/* Dropzone */}
            <div className="border-2 border-dashed border-cyan-500/30 hover:border-cyan-400/60 rounded-3xl p-8 text-center bg-slate-950/40 backdrop-blur-xl transition-all relative">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <UploadCloud className="w-12 h-12 text-cyan-400 mx-auto mb-3 animate-bounce" />
              <p className="text-sm font-semibold text-slate-200">
                Drag and drop packaging images here, or <span className="text-cyan-400 underline">browse device</span>
              </p>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Supports PNG, JPG, JPEG, WEBP, SVG • Front, Back, Side, Ingredients & Nutrition panels
              </p>
            </div>

            {/* Uploaded Previews */}
            {files.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-200">
                    Staged Packaging Panels ({files.length} images)
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">Assign panel angles</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {files.map((file, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3 flex flex-col justify-between space-y-3 shadow-md"
                    >
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                        <img
                          src={previewUrls[idx]}
                          alt={file.name}
                          className="w-full h-full object-contain p-1"
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950/90 text-cyan-300 border border-cyan-500/40">
                          {fileAngles[idx]}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-slate-200 truncate" title={file.name}>
                          {file.name}
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <select
                            value={fileAngles[idx]}
                            onChange={e => changeAngle(idx, e.target.value as LabelAngle)}
                            className="w-full text-xs font-mono bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 focus:outline-none focus:border-cyan-400"
                          >
                            {ANGLES.map(a => (
                              <option key={a} value={a}>
                                {a} Panel
                              </option>
                            ))}
                          </select>

                          <button
                            onClick={() => removeFile(idx)}
                            className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/20 transition-colors"
                            title="Remove image"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4">
              <button
                onClick={() => setCurrentStep(1)}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                onClick={handleStartAnalysis}
                disabled={files.length === 0 || isProcessing}
                className="flex items-center space-x-2 px-8 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 shadow-[0_0_25px_rgba(0,242,254,0.4)] transition-all disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isProcessing ? 'Analyzing Product...' : 'Analyze Product Packaging with AI Vision'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: AI PROCESSING ANIMATION */}
        {currentStep === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-3xl border border-cyan-500/30 bg-slate-950/90 p-8 sm:p-12 text-center space-y-6 shadow-2xl backdrop-blur-2xl max-w-2xl mx-auto"
          >
            <div className="w-48 h-48 mx-auto">
              <AuroraCore size={190} state="ANALYZING" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white font-['Space_Grotesk']">
                AI Vision Product Understanding in Progress
              </h2>
              <p className="text-xs sm:text-sm text-cyan-300 font-mono">
                {processingStage}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto pt-2 text-left font-mono text-[11px] text-slate-300">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Multi-Image Context</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>OCR Supporting Text</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Universal Formulation</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Category Rules Engine</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 4: COMPREHENSIVE PRODUCT PROFILE & HUMAN VERIFICATION */}
        {currentStep === 4 && extractedData && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Header: AI Extracted Product Identity Hero Card */}
            <div className="p-6 rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold tracking-wider">
                      IDENTIFIED PRODUCT PROFILE
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/40 uppercase">
                      Confidence: {extractedData.productName?.confidence ? Math.round(extractedData.productName.confidence * 100) : 90}%
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Space_Grotesk'] mt-1">
                    {extractedData.productName?.value || 'Packaged Product'}
                  </h2>
                </div>

                <button
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isEditingProfile
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'border border-cyan-500/40 bg-cyan-950/30 text-cyan-300 hover:bg-cyan-900/40'
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                  <span>{isEditingProfile ? 'Done Editing' : 'Edit / Verify Fields'}</span>
                </button>
              </div>

              {/* Badges Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs pt-1">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">BRAND</span>
                  <span className="font-bold text-cyan-300">{extractedData.brand?.value || 'Not detected'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">CATEGORY</span>
                  <span className="font-bold text-slate-200">{extractedData.category?.value || selectedCategory}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">NET QUANTITY</span>
                  <span className="font-bold text-emerald-400">{extractedData.netQuantity?.value || 'Not detected'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">RETAIL PRICE (MRP)</span>
                  <span className="font-bold text-amber-300">{extractedData.mrp?.value || 'Not detected'}</span>
                </div>
              </div>
            </div>

            {/* Editable Mode Modal / In-line Inspector */}
            {isEditingProfile && (
              <div className="rounded-2xl border border-cyan-500/40 bg-slate-950/95 p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-cyan-400">
                    <ShieldCheck className="w-5 h-5" />
                    <h3 className="font-bold text-base text-white">Human Verification Editor</h3>
                  </div>
                  <span className="text-xs font-mono text-cyan-300 bg-cyan-950 px-2.5 py-1 rounded border border-cyan-500/40">
                    {editedFields.length} Modified Fields
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { key: 'productName', label: 'Product Generic Title' },
                    { key: 'brand', label: 'Brand Name' },
                    { key: 'category', label: 'Category' },
                    { key: 'netQuantity', label: 'Net Quantity' },
                    { key: 'mrp', label: 'MRP (Price)' },
                    { key: 'manufacturer', label: 'Manufacturer' },
                    { key: 'countryOfOrigin', label: 'Country of Origin' },
                    { key: 'batchNumber', label: 'Batch / Lot Number' },
                    { key: 'expiryDate', label: 'Expiry / Use Before Date' },
                    { key: 'fssaiLicense', label: 'Statutory License / FSSAI' },
                    { key: 'customerCare', label: 'Customer Helpline' }
                  ].map(field => (
                    <div key={field.key} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <label className="text-[11px] font-semibold text-slate-300 block">{field.label}</label>
                      <input
                        type="text"
                        value={humanFormData[field.key] || ''}
                        onChange={e => handleFieldChange(field.key, e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-1 pt-2">
                  <label className="text-xs font-semibold text-slate-300">Inspector Verification Notes</label>
                  <input
                    type="text"
                    value={officerNotes}
                    onChange={e => setOfficerNotes(e.target.value)}
                    placeholder="e.g. Verified packaging declarations across primary and back display panels."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            )}

            {/* Product Profile Sections Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Column 1 & 2: Complete Label Information, Ingredients & Nutrition */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* 1. Complete Label Information */}
                <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/80 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold font-mono text-cyan-400 uppercase">
                      Statutory Label Information
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Extracted from packaging</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="space-y-2">
                      <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span className="text-slate-400">Manufacturer:</span>
                        <span className="text-white text-right max-w-[60%] truncate font-medium">
                          {humanFormData.manufacturer || extractedData.manufacturer?.value || 'Not detected'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span className="text-slate-400">Country of Origin:</span>
                        <span className="text-white font-medium">
                          {humanFormData.countryOfOrigin || extractedData.countryOfOrigin?.value || 'Not detected'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span className="text-slate-400">Batch / Lot No:</span>
                        <span className="text-white font-medium">
                          {humanFormData.batchNumber || extractedData.batchNumber?.value || 'Not detected'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span className="text-slate-400">Expiry / Best Before:</span>
                        <span className="text-rose-300 font-bold">
                          {humanFormData.expiryDate || extractedData.expiryDate?.value || 'Not detected'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span className="text-slate-400">Statutory License:</span>
                        <span className="text-cyan-300 font-medium">
                          {humanFormData.fssaiLicense || extractedData.fssaiLicense?.value || 'Not detected'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span className="text-slate-400">Customer Helpline:</span>
                        <span className="text-slate-200 truncate max-w-[60%] font-medium">
                          {humanFormData.customerCare || extractedData.customerCare?.value || 'Not detected'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Ingredients & Formulation Breakdown */}
                {extractedData.ingredients?.value && extractedData.ingredients.value.length > 0 && (
                  <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono text-cyan-400 uppercase">
                        Declared Ingredients ({extractedData.ingredients.value.length} components)
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">Descending order</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {extractedData.ingredients.value.map((ing, i) => (
                        <span
                          key={i}
                          className="px-3 py-1.5 rounded-xl text-xs font-mono bg-slate-900 border border-slate-700 text-slate-200"
                        >
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Nutrition Table (Category Aware) */}
                {(isFoodCategory || (extractedData.nutritionalInfo?.value && Object.keys(extractedData.nutritionalInfo.value).length > 0)) && (
                  <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-cyan-400">
                        <Scale className="w-4 h-4" />
                        <span className="text-xs font-bold font-mono uppercase">Nutritional Information Panel</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">Per 100g / Serving</span>
                    </div>

                    {extractedData.nutritionalInfo?.value && Object.keys(extractedData.nutritionalInfo.value).length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 font-mono text-center">
                        {Object.entries(extractedData.nutritionalInfo.value).map(([k, v]) => (
                          <div key={k} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                            <div className="text-[10px] text-slate-400 uppercase truncate">{k}</div>
                            <div className="text-xs font-bold text-white mt-0.5">{String(v)}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-slate-900/40 text-xs text-slate-400 italic">
                        No nutritional facts table was declared on the uploaded label panels.
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* Column 3: Advisories, Warnings, Storage, Usage, Claims & Missing */}
              <div className="space-y-6">
                  {/* PRODUCT INSIGHTS */}
                  <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/80 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold font-mono text-cyan-400 uppercase">Product Insights</span>
                      <span className="text-[10px] font-mono text-slate-400">AI‑generated uses, benefits, warnings, limitations</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Uses */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-1 text-cyan-400">
                          <Target className="w-4 h-4" />
                          <span className="font-semibold">Uses</span>
                        </div>
                        {extractedData.productInsights?.uses?.length ? (
                          <ul className="list-disc list-inside text-slate-200">
                            {extractedData.productInsights.uses.map((u, i) => (
                              <li key={i}>{u.text}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-slate-400">No uses detected.</p>
                        )}
                      </div>
                      {/* Benefits */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-1 text-emerald-400">
                          <ShieldCheck className="w-4 h-4" />
                          <span className="font-semibold">Benefits / Advantages</span>
                        </div>
                        {extractedData.productInsights?.benefits?.length ? (
                          <ul className="list-disc list-inside text-slate-200">
                            {extractedData.productInsights.benefits.map((b, i) => (
                              <li key={i}>{b.text}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-slate-400">No benefits detected.</p>
                        )}
                      </div>
                      {/* Warnings */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-1 text-amber-400">
                          <ShieldAlert className="w-4 h-4" />
                          <span className="font-semibold">Warnings & Precautions</span>
                        </div>
                        {extractedData.productInsights?.warnings?.length ? (
                          <ul className="list-disc list-inside text-slate-200">
                            {extractedData.productInsights.warnings.map((w, i) => (
                              <li key={i}>{w.text}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-slate-400">No warnings detected.</p>
                        )}
                      </div>
                      {/* Disadvantages */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-1 text-rose-400">
                          <MinusCircle className="w-4 h-4" />
                          <span className="font-semibold">Disadvantages / Limitations</span>
                        </div>
                        {extractedData.productInsights?.disadvantages?.length ? (
                          <ul className="list-disc list-inside text-slate-200">
                            {extractedData.productInsights.disadvantages.map((d, i) => (
                              <li key={i}>{d.text}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-slate-400">No disadvantages detected.</p>
                        )}
                      </div>
                    </div>
                  </div>
                
                {/* Allergens & Warnings */}
                <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/80 space-y-3">
                  <span className="text-xs font-bold font-mono text-amber-400 uppercase">
                    Allergens & Safety Warnings
                  </span>

                  {extractedData.allergens?.value && extractedData.allergens.value.length > 0 ? (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold text-rose-300">Allergen Declarations:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {extractedData.allergens.value.map((a, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-mono bg-rose-950/80 text-rose-200 border border-rose-500/40">
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No major allergen declarations detected.</p>
                  )}

                  {extractedData.warnings?.value && extractedData.warnings.value.length > 0 && (
                    <div className="pt-2 border-t border-slate-800 space-y-1">
                      <span className="text-[11px] font-semibold text-amber-300">Cautionary Statements:</span>
                      <ul className="text-xs text-slate-300 list-disc list-inside space-y-0.5 font-mono">
                        {extractedData.warnings.value.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Storage & Usage */}
                <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/80 space-y-2 text-xs">
                  <span className="text-xs font-bold font-mono text-cyan-400 uppercase block mb-1">
                    Storage & Usage Instructions
                  </span>
                  <div>
                    <span className="text-slate-400 block">Storage Condition:</span>
                    <span className="text-slate-200 font-mono">
                      {humanFormData.storageInstructions || extractedData.storageInstructions?.value || 'Store in a cool and dry place.'}
                    </span>
                  </div>

                  {extractedData.usageInstructions?.value && extractedData.usageInstructions.value.length > 0 && (
                    <div className="pt-2 border-t border-slate-800">
                      <span className="text-slate-400 block mb-1">Directions for Use:</span>
                      <ul className="text-slate-200 list-disc list-inside space-y-0.5 font-mono">
                        {extractedData.usageInstructions.value.map((u, i) => (
                          <li key={i}>{u}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Claims & Certifications */}
                {extractedData.labelClaims?.value && extractedData.labelClaims.value.length > 0 && (
                  <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/80 space-y-2">
                    <span className="text-xs font-bold font-mono text-emerald-400 uppercase">
                      Front-of-Pack Claims
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {extractedData.labelClaims.value.map((c, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                          <Check className="w-3 h-3" />
                          <span>{c}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing Information Callout */}
                {extractedData.missingInformation && extractedData.missingInformation.length > 0 && (
                  <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-950/20 space-y-2">
                    <div className="flex items-center space-x-1.5 text-amber-400">
                      <HelpCircle className="w-4 h-4" />
                      <span className="text-xs font-bold font-mono uppercase">
                        Undetected Packaging Declarations ({extractedData.missingInformation.length})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {extractedData.missingInformation.map((m, i) => (
                        <span key={i} className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-950 text-amber-300 border border-amber-500/30">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Cross-Label Discrepancies Alert */}
            {conflicts.length > 0 && (
              <div className="p-5 rounded-2xl border border-rose-500/30 bg-slate-950/90 space-y-3">
                <div className="flex items-center space-x-2 text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                  <h3 className="font-bold text-sm text-rose-200">
                    Cross-Label Discrepancy Evidence Detected ({conflicts.length})
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {conflicts.map(c => (
                    <div key={c.id} className="p-4 rounded-xl bg-slate-900 border border-rose-500/20 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white">{c.fieldLabel}</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-rose-950 text-rose-300 uppercase">{c.severity} Severity</span>
                      </div>
                      <p className="text-xs text-slate-300">{c.description}</p>
                      <div className="text-[11px] text-amber-300 bg-amber-950/20 p-2 rounded border border-amber-500/20">
                        {c.recommendation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4">
              <button
                onClick={() => setCurrentStep(2)}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Upload More Panels</span>
              </button>

              <button
                onClick={handleConfirmHumanVerification}
                disabled={isProcessing}
                className="flex items-center space-x-2 px-8 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-400 to-cyan-500 hover:from-emerald-300 hover:to-cyan-400 text-slate-950 shadow-[0_0_25px_rgba(16,185,129,0.35)] transition-all cursor-pointer"
              >
                <FileCheck className="w-4 h-4" />
                <span>{isProcessing ? 'Evaluating Rules...' : 'Confirm Profile & Run Compliance Engine'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 5: FINAL COMPLIANCE DECISION & PDF REPORT */}
        {currentStep === 5 && (
          <motion.div
            key="step5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Status Header Banner */}
            <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
              <div className="space-y-2 text-center sm:text-left">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase ${
                    scanStatus === 'COMPLIANT'
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                      : scanStatus === 'POTENTIAL_ISSUE'
                      ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                      : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  STATUS: {scanStatus.replace('_', ' ')}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Regulatory Compliance Evaluation Finalized
                </h2>
                <p className="text-xs sm:text-sm text-slate-300">
                  Compliance Audit Score: <strong className="text-cyan-300">{overallScore}/100</strong> • Product: <strong className="text-white">{extractedData?.productName?.value}</strong>
                </p>
              </div>

              <button
                onClick={() => navigate(`/scan/${scanId}`)}
                className="px-6 py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 shadow-[0_0_20px_rgba(0,242,254,0.3)] transition-all flex items-center space-x-2 cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Open Full Interactive Report & Download PDF</span>
              </button>
            </div>

            {/* Rule Engine Results Preview */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-3">
              <h3 className="font-bold text-base text-slate-100 flex items-center space-x-2">
                <Scale className="w-4 h-4 text-cyan-400" />
                <span>Deterministic Rule Engine Results ({ruleResults.length} Rules)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ruleResults.map(r => (
                  <div
                    key={r.ruleId}
                    className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">{r.title}</span>
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                          r.status === 'PASS'
                            ? 'bg-emerald-950 text-emerald-300'
                            : r.status === 'POTENTIAL_ISSUE'
                            ? 'bg-rose-950 text-rose-300'
                            : 'bg-amber-950 text-amber-300'
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{r.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigate to full report */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => navigate(`/scan/${scanId}`)}
                className="flex items-center space-x-2 px-8 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-[0_0_20px_rgba(0,242,254,0.3)] transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Open Detailed Audit Report & Download PDF</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};
