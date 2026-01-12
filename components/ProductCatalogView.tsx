
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Product } from '../types';
import { Language, translations } from '../translations';

interface Props {
  products: Product[];
  categories: string[];
  onUpdateStock: (productId: string, serials: string[]) => void;
  onAddProducts: (newProducts: Product[]) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onAddCategory: (name: string) => void;
  onUpdateCategory: (oldName: string, newName: string) => void;
  onDeleteCategory: (name: string) => void;
  language: Language;
}

const ProductCatalogView: React.FC<Props> = ({ 
  products, 
  categories,
  onUpdateStock, 
  onAddProducts, 
  onUpdateProduct, 
  onDeleteProduct, 
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  language 
}) => {
  const t = useMemo(() => translations[language].catalog, [language]);
  
  const [showInboundModal, setShowInboundModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showImportPreviewModal, setShowImportPreviewModal] = useState(false);
  const [showLookupModal, setShowLookupModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  const [bulkInput, setBulkInput] = useState('');
  const [scannerMode, setScannerMode] = useState<'camera' | 'manual'>('manual');
  const [scannedIMEIs, setScannedIMEIs] = useState<string[]>([]);
  const [currentScan, setCurrentScan] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingBarcode, setIsSearchingBarcode] = useState(false);
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResult, setLookupResult] = useState<Product | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [csvPreviewData, setCsvPreviewData] = useState<any[]>([]);
  const [parsedProducts, setParsedProducts] = useState<Product[]>([]);

  const [formProduct, setFormProduct] = useState({
    name: '', brand: '', category: '', customCategory: '', price: '', stock: '', barcode: '', description: '', cost: ''
  });

  const [newCatName, setNewCatName] = useState('');
  const [editingCatName, setEditingCatName] = useState<{ old: string, new: string } | null>(null);

  const filteredProducts = products.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;

    return (
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.includes(q)) ||
      (p.serialNumbers && p.serialNumbers.some(sn => sn.toLowerCase().includes(q)))
    );
  });

  const toggleCamera = async (isForSearch: boolean = false) => {
    if (scannerMode === 'camera' || isSearchingBarcode) {
      stopCamera();
    } else {
      if (isForSearch) setIsSearchingBarcode(true);
      else setScannerMode('camera');
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        alert("Unable to access camera.");
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    setScannerMode('manual');
    setIsSearchingBarcode(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const handleScanInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentScan.trim()) {
      setScannedIMEIs(prev => [...prev, currentScan.trim()]);
      setCurrentScan('');
    }
  };

  const handleSaveInbound = () => {
    if (!selectedProductId) return alert(t.chooseProduct);
    const bulkLines = bulkInput.split('\n').map(l => l.trim()).filter(l => l !== '');
    const allSerials = [...scannedIMEIs, ...bulkLines];
    if (allSerials.length === 0) return alert('No IMEI/SN detected.');
    onUpdateStock(selectedProductId, allSerials);
    setShowInboundModal(false);
    resetInboundForm();
  };

  const resetInboundForm = () => {
    setSelectedProductId('');
    setBulkInput('');
    setScannedIMEIs([]);
    setCurrentScan('');
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormProduct({ name: '', brand: '', category: '', customCategory: '', price: '', stock: '', barcode: '', description: '', cost: '' });
    setShowAddProductModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormProduct({
      name: product.name,
      brand: product.brand,
      category: product.category,
      customCategory: '',
      price: product.price.toString(),
      stock: product.stock.toString(),
      barcode: product.barcode || '',
      description: product.description || '',
      cost: product.cost?.toString() || ''
    });
    setShowAddProductModal(true);
  };

  const handleSaveProduct = () => {
    const { name, brand, category, customCategory, price, stock, barcode, description, cost } = formProduct;
    if (!name || !brand || (!category && !customCategory) || !price || !stock) {
      return alert("Please fill in all mandatory fields.");
    }

    const finalCategory = category === 'NEW' ? customCategory : category;
    
    // Auto-add category to main list if it's new
    if (category === 'NEW' && customCategory) {
      onAddCategory(customCategory);
    }

    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        name,
        brand,
        category: finalCategory,
        price: parseFloat(price),
        stock: parseInt(stock),
        cost: cost ? parseFloat(cost) : undefined,
        barcode: barcode || undefined,
        description
      });
    } else {
      const product: Product = {
        id: `p-${Date.now()}`,
        name,
        brand,
        category: finalCategory,
        price: parseFloat(price),
        stock: parseInt(stock),
        cost: cost ? parseFloat(cost) : undefined,
        barcode: barcode || undefined,
        description,
        serialNumbers: []
      };
      onAddProducts([product]);
    }

    setShowAddProductModal(false);
    setEditingProduct(null);
  };

  const handleDelete = (id: string) => {
    onDeleteProduct(id);
    setConfirmDeleteId(null);
  };

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n').filter(r => r.trim());
      if (rows.length < 2) return alert("Empty or invalid CSV.");

      const rawData = rows.slice(1).map(row => {
        const cols = row.split(',').map(c => c.trim());
        return {
          name: cols[0],
          category: cols[1],
          status: cols[2],
          identifier: cols[3],
          quantity: parseInt(cols[4]) || 1,
          cost: parseFloat(cols[5]) || 0,
          price: parseFloat(cols[6]) || 0,
          date: cols[7],
          client: cols[8],
          notes: cols[9]
        };
      });

      setCsvPreviewData(rawData);

      const grouped: Record<string, Product> = {};
      rawData.forEach((item, idx) => {
        const key = `${item.name}-${item.category}`;
        if (!grouped[key]) {
          grouped[key] = {
            id: `imp-${Date.now()}-${idx}`,
            name: item.name,
            category: item.category,
            price: item.price,
            cost: item.cost,
            brand: item.name.split(' ')[0], 
            description: item.notes || '',
            stock: 0,
            serialNumbers: [],
            status: item.status,
            client: item.client,
            lastAdded: item.date
          };
        }
        grouped[key].stock += item.quantity;
        if (item.identifier) grouped[key].serialNumbers?.push(item.identifier);
        if (item.price > 0) grouped[key].price = item.price;
        if (item.cost > 0) grouped[key].cost = item.cost;
      });

      setParsedProducts(Object.values(grouped));
      setShowImportPreviewModal(true);
    };
    reader.readAsText(file);
    e.target.value = ''; 
  };

  const confirmImport = () => {
    onAddProducts(parsedProducts);
    setShowImportPreviewModal(false);
    alert(t.importModal.success);
  };

  const handleLookup = () => {
    const found = products.find(p => 
      p.serialNumbers?.some(sn => sn.trim() === lookupQuery.trim())
    );
    setLookupResult(found || null);
  };

  const handleAddCat = () => {
    if (newCatName.trim()) {
      onAddCategory(newCatName.trim());
      setNewCatName('');
    }
  };

  const handleStartEditCat = (cat: string) => {
    setEditingCatName({ old: cat, new: cat });
  };

  const handleSaveEditCat = () => {
    if (editingCatName && editingCatName.new.trim()) {
      onUpdateCategory(editingCatName.old, editingCatName.new.trim());
      setEditingCatName(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-8">
        <div className="flex-1 w-full relative">
          <div className="relative group">
            <input 
              type="text" 
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl sm:rounded-2xl px-10 sm:px-12 py-3 sm:py-4 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium text-sm sm:text-base"
            />
            <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button 
              onClick={() => toggleCamera(true)}
              title={t.scanSearch}
              className={`absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-colors ${isSearchingBarcode ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white'}`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </button>
          </div>

          {isSearchingBarcode && (
            <div className="absolute top-full left-0 w-full mt-2 bg-slate-900 rounded-2xl overflow-hidden shadow-2xl z-20 aspect-video border-4 border-blue-500">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="w-1/2 h-1/3 border-2 border-white/50 rounded-lg relative">
                  <div className="absolute top-1/2 w-full h-0.5 bg-red-500 shadow-[0_0_10px_red] animate-bounce"></div>
                </div>
                <p className="text-white text-[10px] sm:text-xs font-bold mt-4 bg-black/50 px-3 py-1 rounded-full uppercase tracking-widest">Align Barcode</p>
              </div>
              <button 
                onClick={stopCamera}
                className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-md"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap lg:flex-nowrap gap-2 w-full xl:w-auto">
          <button 
            onClick={() => setShowCategoryModal(true)}
            className="flex-1 sm:flex-none justify-center whitespace-nowrap bg-slate-800 text-white hover:bg-slate-900 px-4 sm:px-6 py-2.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold transition-all flex items-center gap-2 border border-slate-700 text-xs sm:text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h7" strokeWidth="2.5" strokeLinecap="round"/></svg>
            <span className="truncate">{t.manageCategoriesBtn}</span>
          </button>

          <button 
            onClick={() => { setLookupQuery(''); setLookupResult(null); setShowLookupModal(true); }}
            className="flex-1 sm:flex-none justify-center whitespace-nowrap bg-blue-100 text-blue-700 hover:bg-blue-200 px-4 sm:px-6 py-2.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold transition-all flex items-center gap-2 border border-blue-200 text-xs sm:text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2"/></svg>
            <span className="truncate">{t.imeiLookupBtn}</span>
          </button>

          <label className="flex-1 sm:flex-none justify-center whitespace-nowrap bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 sm:px-6 py-2.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold transition-all flex items-center gap-2 cursor-pointer border border-slate-200 text-xs sm:text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" strokeWidth="2"/></svg>
            <span className="truncate">{t.importBtn}</span>
            <input type="file" accept=".csv" className="hidden" onChange={handleCsvImport} />
          </label>
          
          <button 
            onClick={openAddModal}
            className="flex-1 sm:flex-none justify-center whitespace-nowrap bg-blue-100 text-blue-700 hover:bg-blue-200 px-4 sm:px-6 py-2.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold transition-all flex items-center gap-2 border border-blue-200 text-xs sm:text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="2"/></svg>
            <span className="truncate">{t.addProductBtn}</span>
          </button>

          <button 
            onClick={() => setShowInboundModal(true)}
            className="flex-1 sm:flex-none justify-center whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all flex items-center gap-2 group text-xs sm:text-sm"
          >
            <svg className="w-4 h-4 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span className="truncate">{t.inboundBtn}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {filteredProducts.map((product) => {
          const matchedSN = searchQuery.trim() && product.serialNumbers 
            ? product.serialNumbers.find(sn => sn.toLowerCase().includes(searchQuery.toLowerCase().trim()))
            : null;

          return (
            <div key={product.id} className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden flex flex-col">
              <div className="absolute -right-4 -top-4 w-20 h-20 sm:w-24 sm:h-24 bg-slate-50 rounded-full group-hover:bg-blue-50 transition-colors"></div>
              
              {confirmDeleteId === product.id ? (
                <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </div>
                  <p className="text-white text-xs sm:text-sm font-bold mb-6">{t.confirmDelete}</p>
                  <div className="flex gap-3 w-full">
                    <button 
                      onClick={() => setConfirmDeleteId(null)}
                      className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all"
                    >
                      {t.cancel}
                    </button>
                    <button 
                      onClick={() => handleDelete(product.id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="relative flex-1">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 sm:py-1 rounded-lg">{product.category}</span>
                  <div className="flex items-center gap-1 sm:gap-2">
                     <button 
                      onClick={() => openEditModal(product)}
                      className="p-1.5 sm:p-2 text-slate-300 hover:text-blue-500 transition-colors bg-white rounded-lg shadow-sm border border-slate-50"
                     >
                       <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                     </button>
                     <button 
                      onClick={() => setConfirmDeleteId(product.id)}
                      className="p-1.5 sm:p-2 text-slate-300 hover:text-red-500 transition-colors bg-white rounded-lg shadow-sm border border-slate-50"
                     >
                       <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                     </button>
                  </div>
                </div>
                
                <h3 className="font-bold text-slate-800 text-sm sm:text-lg group-hover:text-blue-600 transition-colors leading-tight truncate">{product.name}</h3>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-1 mb-3">{t.brand}: {product.brand}</p>
                
                {product.barcode && (
                  <div className="flex items-center gap-2 text-slate-400 mb-3 sm:mb-4">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span className="text-[9px] sm:text-[11px] font-mono tracking-tighter truncate">{product.barcode}</span>
                  </div>
                )}
                
                {matchedSN && (
                  <div className="mt-2 mb-3 p-2 sm:p-3 bg-blue-50 border border-blue-100 rounded-xl sm:rounded-2xl animate-in fade-in slide-in-from-left-2">
                    <p className="text-[8px] sm:text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">{t.matchedImei}</p>
                    <p className="text-[10px] sm:text-xs font-mono font-bold text-blue-800 break-all">{matchedSN}</p>
                  </div>
                )}

                {product.serialNumbers && product.serialNumbers.length > 0 && (
                  <div className="mt-2 p-2 sm:p-3 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100">
                    <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 mb-1 sm:mb-2 uppercase tracking-widest">{t.recentImeis}:</p>
                    <div className="flex flex-wrap gap-1.5 sm:gap-1.5">
                      {product.serialNumbers.slice(-3).map((sn, idx) => (
                        <span key={idx} className={`text-[8px] sm:text-[10px] border px-1.5 py-0.5 rounded-md sm:rounded-lg font-mono transition-colors ${sn === matchedSN ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200 text-slate-600'}`}>
                          {sn.slice(-6)}...
                        </span>
                      ))}
                      {product.serialNumbers.length > 3 && <span className="text-[8px] sm:text-[10px] text-slate-400 self-center">+{product.serialNumbers.length - 3}</span>}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-100 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-xl sm:text-2xl font-black text-slate-900">€{product.price.toFixed(2)}</span>
                  {product.cost && <span className="text-[8px] sm:text-[10px] text-slate-400 font-bold uppercase">COST: €{product.cost.toFixed(2)}</span>}
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className={`px-2 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-bold border ${product.stock > 10 ? 'bg-green-50 text-green-700 border-green-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                    {product.stock} {t.inStock}
                  </span>
                  <button 
                    onClick={() => { setSelectedProductId(product.id); setShowInboundModal(true); }}
                    className="bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600 p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all shadow-sm"
                    title="Add Units"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
            <div className="p-6 sm:p-8 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-800">{t.categoryModalTitle}</h3>
                <p className="text-slate-400 text-xs sm:text-sm">{t.categoryModalSubtitle}</p>
              </div>
              <button onClick={() => setShowCategoryModal(false)} className="text-slate-300 hover:text-slate-900">
                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder={t.newCategoryPlaceholder}
                  className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-bold text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCat()}
                />
                <button 
                  onClick={handleAddCat}
                  disabled={!newCatName.trim()}
                  className="bg-blue-600 text-white px-6 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100 disabled:opacity-50"
                >
                  {t.addCategoryBtn}
                </button>
              </div>

              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                {categories.map((cat, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl group transition-all hover:bg-white hover:shadow-md">
                    {editingCatName?.old === cat ? (
                      <div className="flex-1 flex gap-2">
                        <input 
                          type="text"
                          value={editingCatName.new}
                          onChange={(e) => setEditingCatName({ ...editingCatName, new: e.target.value })}
                          className="flex-1 bg-white border border-blue-500 rounded-lg px-3 py-1 text-sm outline-none shadow-inner"
                          autoFocus
                          onKeyDown={(e) => {
                             if (e.key === 'Enter') handleSaveEditCat();
                             if (e.key === 'Escape') setEditingCatName(null);
                          }}
                        />
                        <button onClick={handleSaveEditCat} className="text-green-600 hover:text-green-700 font-bold text-[10px] uppercase tracking-widest">Save</button>
                        <button onClick={() => setEditingCatName(null)} className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Cancel</button>
                      </div>
                    ) : (
                      <>
                        <span className="font-bold text-slate-700 text-sm">{cat}</span>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleStartEditCat(cat)} className="p-2 text-slate-300 hover:text-blue-600 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2"/></svg>
                          </button>
                          <button 
                            onClick={() => {
                              const inUse = products.some(p => p.category === cat);
                              if (inUse) alert(t.inUseWarning);
                              else onDeleteCategory(cat);
                            }} 
                            className="p-2 text-slate-300 hover:text-red-600 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2"/></svg>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lookup Modal */}
      {showLookupModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
            <div className="p-6 sm:p-8 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-800">{t.lookupModalTitle}</h3>
                <p className="text-slate-400 text-xs sm:text-sm">{t.lookupModalSubtitle}</p>
              </div>
              <button onClick={() => setShowLookupModal(false)} className="text-slate-300 hover:text-slate-900">
                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 sm:p-8 space-y-4 sm:y-6">
              <div className="relative">
                <input 
                  type="text"
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                  placeholder={t.lookupInputPlaceholder}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-mono text-sm"
                  autoFocus
                />
                <button 
                  onClick={handleLookup}
                  className="absolute right-1.5 top-1.5 bg-blue-600 text-white p-2 rounded-lg sm:rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </button>
              </div>

              {lookupResult ? (
                <div className="bg-blue-50/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-blue-100 animate-in slide-in-from-top-4">
                  <div className="flex gap-3 sm:gap-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center border border-blue-100 shadow-sm text-xl sm:text-2xl">
                      📱
                    </div>
                    <div className="flex-1">
                      <p className="text-[8px] sm:text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">{lookupResult.brand}</p>
                      <h4 className="text-base sm:text-xl font-black text-slate-800">{lookupResult.name}</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{lookupResult.description}</p>
                      
                      <div className="mt-4 pt-4 border-t border-blue-100 flex justify-between items-end">
                        <div>
                          <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Price</p>
                          <p className="text-xl sm:text-2xl font-black text-slate-900">€{lookupResult.price.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stock</p>
                          <p className="text-base sm:text-lg font-black text-blue-600">{lookupResult.stock} Units</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setSearchQuery(lookupQuery);
                      setShowLookupModal(false);
                    }}
                    className="w-full mt-4 sm:mt-6 bg-white border border-blue-200 text-blue-600 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                  >
                    Focus in Catalog
                  </button>
                </div>
              ) : lookupQuery && (
                <div className="text-center py-6 sm:py-8">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <p className="text-slate-400 font-bold text-xs sm:text-sm">{t.lookupNotFound}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Inbound Stock Modal */}
      {showInboundModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-2 sm:p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh] border border-white/20">
            <div className="p-4 sm:p-8 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-800">{t.modalTitle}</h3>
                <p className="text-slate-400 text-xs sm:text-sm">{t.modalSubtitle}</p>
              </div>
              <button onClick={() => { stopCamera(); setShowInboundModal(false); }} className="text-slate-300 hover:text-slate-900 transition-colors">
                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 sm:space-y-8">
              <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-slate-100">
                <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2 sm:mb-3 uppercase tracking-widest">{t.targetProduct}</label>
                <select 
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-white border-slate-200 rounded-xl sm:rounded-2xl px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm"
                >
                  <option value="">{t.chooseProduct}</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.brand} {p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] sm:text-sm font-bold text-slate-700 uppercase tracking-widest">{t.scannerTitle}</label>
                    <button 
                      onClick={() => toggleCamera(false)}
                      className={`text-[8px] sm:text-[10px] px-3 sm:px-4 py-1 sm:py-1.5 rounded-full font-black uppercase tracking-tighter transition-all shadow-sm ${scannerMode === 'camera' ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-600 text-white'}`}
                    >
                      {scannerMode === 'camera' ? t.stopScanner : t.startScanner}
                    </button>
                  </div>

                  <div className="aspect-video bg-slate-900 rounded-xl sm:rounded-[2rem] overflow-hidden relative flex items-center justify-center border-2 sm:border-4 border-slate-100">
                    {scannerMode === 'camera' ? (
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-4 sm:p-8">
                        <div className="w-10 h-10 sm:w-16 sm:h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                           <svg className="w-6 h-6 sm:w-8 sm:h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                        <p className="text-[8px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-widest">{t.cameraOffline}</p>
                      </div>
                    )}
                    {scannerMode === 'camera' && (
                      <div className="absolute inset-0 border-2 border-blue-500/50 m-6 sm:m-10 pointer-events-none rounded-xl sm:rounded-2xl flex items-center justify-center">
                        <div className="w-full h-0.5 bg-red-500 shadow-[0_0_20px_red] animate-scan"></div>
                      </div>
                    )}
                  </div>

                  <input 
                    type="text"
                    value={currentScan}
                    onChange={(e) => setCurrentScan(e.target.value)}
                    onKeyDown={handleScanInput}
                    placeholder={t.manualPlaceholder}
                    className="w-full bg-slate-50 border-slate-200 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm focus:ring-4 focus:ring-blue-100 outline-none font-mono transition-all"
                  />

                  <div className="flex flex-wrap gap-1.5 sm:gap-1.5 max-h-24 sm:max-h-32 overflow-y-auto p-1">
                    {scannedIMEIs.map((imei, idx) => (
                      <div key={idx} className="bg-blue-600 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-mono flex items-center gap-1 sm:gap-2 group shadow-sm">
                        {imei}
                        <button onClick={() => setScannedIMEIs(prev => prev.filter((_, i) => i !== idx))} className="hover:text-red-200 transition-colors">×</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <label className="block text-[10px] sm:text-sm font-bold text-slate-700 uppercase tracking-widest">{t.bulkTitle}</label>
                  <textarea 
                    value={bulkInput}
                    onChange={(e) => setBulkInput(e.target.value)}
                    rows={6}
                    placeholder={t.bulkPlaceholder}
                    className="w-full bg-slate-50 border-slate-200 rounded-xl sm:rounded-[2rem] px-4 sm:px-6 py-4 sm:py-6 text-xs sm:text-sm focus:ring-4 focus:ring-blue-100 outline-none font-mono placeholder:text-slate-300 resize-none transition-all"
                  />
                  <div className="p-3 sm:p-4 bg-amber-50 rounded-xl sm:rounded-2xl border border-amber-100">
                    <p className="text-[8px] sm:text-[10px] text-amber-700 font-medium">{t.bulkTip}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-[10px] sm:text-sm text-slate-600 font-bold">
                {t.totalToAdd}: <span className="text-blue-600 text-lg sm:text-2xl font-black">{scannedIMEIs.length + bulkInput.split('\n').filter(l => l.trim()).length}</span> items
              </div>
              <div className="flex gap-2 sm:gap-4 w-full sm:w-auto">
                <button 
                  onClick={() => { resetInboundForm(); stopCamera(); setShowInboundModal(false); }}
                  className="flex-1 px-4 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest text-[10px] sm:text-xs"
                >
                  {t.cancel}
                </button>
                <button 
                  onClick={handleSaveInbound}
                  disabled={!selectedProductId || (scannedIMEIs.length === 0 && !bulkInput.trim())}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:grayscale text-white px-6 sm:px-10 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black shadow-xl shadow-blue-100 transition-all uppercase tracking-widest text-[10px] sm:text-xs"
                >
                  {t.confirm}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
            <div className="p-6 sm:p-8 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-800">{editingProduct ? t.addProductModal.editTitle : t.addProductModal.title}</h3>
              </div>
              <button onClick={() => setShowAddProductModal(false)} className="text-slate-300 hover:text-slate-900">
                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 sm:p-8 space-y-4 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.addProductModal.name}</label>
                  <input value={formProduct.name} onChange={e => setFormProduct({...formProduct, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.addProductModal.brand}</label>
                  <input value={formProduct.brand} onChange={e => setFormProduct({...formProduct, brand: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.addProductModal.category}</label>
                <select 
                  value={formProduct.category} 
                  onChange={e => setFormProduct({...formProduct, category: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500"
                >
                  <option value="">-- {t.selectCategory} --</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="NEW">+ {t.createNew}</option>
                </select>
              </div>

              {formProduct.category === 'NEW' && (
                <div className="space-y-1 animate-in slide-in-from-top-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.addProductModal.newCategory}</label>
                  <input 
                    value={formProduct.customCategory} 
                    onChange={e => setFormProduct({...formProduct, customCategory: e.target.value})} 
                    className="w-full bg-slate-50 border border-blue-500 rounded-xl px-4 py-2 text-sm outline-none" 
                    placeholder="e.g. Smartwatch" 
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.addProductModal.price}</label>
                  <input type="number" value={formProduct.price} onChange={e => setFormProduct({...formProduct, price: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.addProductModal.stock}</label>
                  <input type="number" value={formProduct.stock} onChange={e => setFormProduct({...formProduct, stock: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.addProductModal.barcode}</label>
                <input value={formProduct.barcode} onChange={e => setFormProduct({...formProduct, barcode: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.addProductModal.desc}</label>
                <textarea value={formProduct.description} onChange={e => setFormProduct({...formProduct, description: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500 h-24" />
              </div>
            </div>

            <div className="p-6 sm:p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
              <button onClick={() => setShowAddProductModal(false)} className="px-6 py-3 font-bold text-slate-400 uppercase tracking-widest text-[10px]">{t.cancel}</button>
              <button onClick={handleSaveProduct} className="bg-blue-600 text-white px-10 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-100">{editingProduct ? t.addProductModal.update : t.addProductModal.save}</button>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes scan {
          0%, 100% { transform: translateY(-30px); opacity: 0; }
          10%, 90% { opacity: 1; }
          50% { transform: translateY(30px); }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ProductCatalogView;
