// @ts-nocheck
'use client'
import React, { useState, useEffect } from 'react';
import { createFarm, predict } from '@/lib/api';
import { PredictionResponse, AlertLevel } from '@/lib/types';
import RiskMeter from '@/components/RiskMeter';
import AlertBadge from '@/components/AlertBadge';
import ModalityGates from '@/components/ModalityGates';
import { UploadCloud, CheckCircle, AlertTriangle } from 'lucide-react';

export default function FarmerDashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);

  const [farmData, setFarmData] = useState({
    name: 'Nashik Farm A',
    crop_type: 'tomato',
    growth_stage: 'vegetative',
    latitude: 20.0,
    longitude: 74.0
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleAnalyze = async () => {
    if (!file) return alert('Upload an image first');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('farm_id', 'demo_farm_1'); // Demo
      
      const res = await predict(formData);
      setResult(res);
    } catch (error) {
      console.error(error);
      alert('Analysis failed. Check if API is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Panel - Farm Config */}
        <div className="lg:col-span-3 glass-card p-6 h-fit">
          <h2 className="text-xl font-bold mb-4">Farm Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Farm Name</label>
              <input type="text" value={farmData.name} onChange={e=>setFarmData({...farmData, name: e.target.value})} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Crop Type</label>
              <select value={farmData.crop_type} onChange={e=>setFarmData({...farmData, crop_type: e.target.value})} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm">
                <option value="tomato">Tomato</option>
                <option value="wheat">Wheat</option>
                <option value="rice">Rice</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Growth Stage</label>
              <select value={farmData.growth_stage} onChange={e=>setFarmData({...farmData, growth_stage: e.target.value})} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm">
                <option value="seedling">Seedling</option>
                <option value="vegetative">Vegetative</option>
                <option value="flowering">Flowering</option>
                <option value="fruit_development">Fruit Development</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Lat</label>
                <input type="number" value={farmData.latitude} onChange={e=>setFarmData({...farmData, latitude: parseFloat(e.target.value)})} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Lon</label>
                <input type="number" value={farmData.longitude} onChange={e=>setFarmData({...farmData, longitude: parseFloat(e.target.value)})} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm" />
              </div>
            </div>
            <button className="w-full bg-slate-700 hover:bg-slate-600 py-2 rounded text-sm transition mt-4">Save Profile</button>
          </div>
        </div>

        {/* Center Panel - Upload */}
        <div className="lg:col-span-5 glass-card p-6 flex flex-col">
          <h2 className="text-xl font-bold mb-4">New Observation</h2>
          <div className="flex-1 border-2 border-dashed border-slate-600 rounded-xl bg-slate-800/50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {preview ? (
              <img src={preview} alt="Crop" className="absolute inset-0 w-full h-full object-cover opacity-80" />
            ) : (
              <div className="text-center">
                <UploadCloud className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-300">Drag & drop crop image here</p>
                <p className="text-slate-500 text-sm mt-1">or click to browse</p>
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
          <button 
            onClick={handleAnalyze}
            disabled={!file || loading}
            className={`w-full py-3 rounded-md font-semibold mt-4 transition-colors ${loading || !file ? 'bg-slate-700 text-slate-400' : 'bg-green-600 hover:bg-green-500 text-white'}`}
          >
            {loading ? 'Analyzing with Multi-Modal AI...' : 'Run Analysis'}
          </button>
        </div>

        {/* Right Panel - Results */}
        <div className="lg:col-span-4 glass-card p-6 h-fit min-h-[500px]">
          <h2 className="text-xl font-bold mb-4">Analysis Results</h2>
          
          {!result && !loading && (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <Activity className="w-12 h-12 mb-2 opacity-20" />
              <p>Upload an image to see predictions</p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full mb-4"></div>
              <p className="text-slate-400 animate-pulse">Running GNN inference...</p>
            </div>
          )}

          {result && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-white capitalize">{result.disease.replace(/_/g, ' ')}</h3>
                  <p className="text-sm text-slate-400">Confidence: {(result.probability * 100).toFixed(1)}%</p>
                </div>
                <AlertBadge level={result.alert_level} />
              </div>

              <RiskMeter risk={result.risk_score} future={result.future_risk} />

              <div className="bg-slate-800 p-3 rounded-md border border-slate-700">
                <p className="text-sm text-slate-300 italic">"{result.explanation}"</p>
              </div>

              <ModalityGates gates={result.modality_gates} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
