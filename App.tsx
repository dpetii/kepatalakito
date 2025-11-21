import React, { useState, useRef, useCallback } from 'react';
import { Upload, Wand2, Image as ImageIcon, AlertCircle, RefreshCw, ArrowRight, Sparkles } from 'lucide-react';
import { AppStatus, ImageFile } from './types';
import { generateEditedImage, fileToBase64 } from './services/geminiService';
import { Button } from './components/Button';
import { ImagePreview } from './components/ImagePreview';

// A default prompt suggestion
const DEFAULT_PROMPT = "Csatolt képet alakítsd át úgy mintha esős időben készült volna";

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [originalImage, setOriginalImage] = useState<ImageFile | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError("Please upload a valid image file (JPG, PNG, WEBP).");
        return;
      }

      try {
        setStatus(AppStatus.UPLOADING);
        const base64 = await fileToBase64(file);
        const previewUrl = URL.createObjectURL(file);
        
        setOriginalImage({
          file,
          previewUrl,
          base64,
          mimeType: file.type
        });
        
        // Reset generated state
        setGeneratedImage(null);
        setError(null);
        setStatus(AppStatus.IDLE);
      } catch (err) {
        setError("Failed to process image.");
        setStatus(AppStatus.ERROR);
      }
    }
  };

  const handleGenerate = async () => {
    if (!originalImage) {
      setError("Please upload an image first.");
      return;
    }

    const promptToUse = prompt.trim() || DEFAULT_PROMPT;

    try {
      setStatus(AppStatus.GENERATING);
      setError(null);

      const resultImage = await generateEditedImage(
        originalImage.base64,
        originalImage.mimeType,
        promptToUse
      );

      setGeneratedImage(resultImage);
      setStatus(AppStatus.SUCCESS);
    } catch (err: any) {
      setError(err.message || "Something went wrong during generation.");
      setStatus(AppStatus.ERROR);
    }
  };

  const handleReset = () => {
    setOriginalImage(null);
    setGeneratedImage(null);
    setPrompt('');
    setError(null);
    setStatus(AppStatus.IDLE);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleExamplePrompt = () => {
      setPrompt(DEFAULT_PROMPT);
  };

  return (
    <div className="min-h-screen bg-dark bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-dark to-black text-slate-200 p-4 md:p-8">
      
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-10 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              NanoEdit
            </h1>
            <p className="text-xs text-slate-500 font-medium tracking-wide">POWERED BY GEMINI 2.5 FLASH</p>
          </div>
        </div>
        <a 
          href="https://ai.google.dev/" 
          target="_blank" 
          rel="noreferrer"
          className="text-xs font-medium text-slate-500 hover:text-primary transition-colors"
        >
          API Documentation
        </a>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Input & Controls */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Upload Area */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400 ml-1">Source Image</label>
            {!originalImage ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-primary/50 bg-surface/50 hover:bg-surface rounded-xl p-10 text-center cursor-pointer transition-all duration-300 group h-64 flex flex-col items-center justify-center"
              >
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border border-slate-700">
                  <Upload className="w-8 h-8 text-slate-400 group-hover:text-primary transition-colors" />
                </div>
                <p className="text-slate-300 font-medium">Click to upload an image</p>
                <p className="text-xs text-slate-500 mt-2">Supports JPG, PNG, WEBP</p>
              </div>
            ) : (
              <div className="h-64 relative">
                <ImagePreview 
                  src={originalImage.previewUrl} 
                  label="Original" 
                  onClear={handleReset}
                />
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              className="hidden" 
              accept="image/*"
            />
          </div>

          {/* Prompt Area */}
          <div className="bg-surface border border-slate-700/50 rounded-xl p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-secondary" />
                Edit Instruction
              </label>
              <button 
                onClick={handleExamplePrompt}
                className="text-xs text-primary hover:text-indigo-400 underline decoration-dotted underline-offset-2"
              >
                Use example: Rainy Weather
              </button>
            </div>
            
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe how you want to change the image... (e.g., 'Make it look like a sketch', 'Add fireworks in the sky')"
              className="w-full bg-dark border border-slate-700 rounded-lg p-3 text-sm text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-primary focus:border-transparent resize-none h-28 transition-all"
              disabled={status === AppStatus.GENERATING}
            />

            <div className="pt-2 flex gap-3">
              <Button 
                onClick={handleGenerate} 
                isLoading={status === AppStatus.GENERATING}
                disabled={!originalImage}
                className="flex-1"
              >
                {status === AppStatus.GENERATING ? 'Transforming...' : 'Generate Edit'}
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

        </div>

        {/* Right Column: Output */}
        <div className="lg:col-span-7 flex flex-col h-full min-h-[500px]">
            <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-400 ml-1">Result</label>
                {status === AppStatus.SUCCESS && (
                    <span className="text-xs text-green-400 flex items-center gap-1 bg-green-400/10 px-2 py-0.5 rounded border border-green-400/20">
                        <Sparkles className="w-3 h-3" /> Completed
                    </span>
                )}
            </div>
          
            <div className="flex-1 bg-surface/30 border-2 border-dashed border-slate-800 rounded-xl overflow-hidden relative flex flex-col items-center justify-center p-4 lg:p-8 transition-all">
                
                {/* Empty State */}
                {status === AppStatus.IDLE && !generatedImage && (
                <div className="text-center max-w-sm mx-auto opacity-50">
                    <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
                        <ImageIcon className="w-8 h-8 text-slate-500" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-300 mb-2">Ready to Create</h3>
                    <p className="text-sm text-slate-500">Upload an image and provide a prompt to see the magic happen.</p>
                </div>
                )}

                {/* Loading State */}
                {status === AppStatus.GENERATING && (
                    <div className="absolute inset-0 z-20 bg-dark/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
                        <div className="relative w-24 h-24 mb-8">
                            <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-t-primary border-r-secondary border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                            <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-white animate-pulse" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Gemini is thinking...</h3>
                        <p className="text-slate-400 max-w-xs">Applying your edits using the Nano Banana model. This usually takes a few seconds.</p>
                    </div>
                )}

                {/* Success State */}
                {generatedImage && (
                    <div className="w-full h-full animate-in zoom-in-95 duration-500">
                        <ImagePreview 
                            src={generatedImage} 
                            label="Generated with Gemini 2.5" 
                            isGenerated={true}
                        />
                    </div>
                )}
            </div>
            
            {/* Helper Comparison Text */}
            {originalImage && generatedImage && (
                <div className="mt-4 flex items-center justify-center text-xs text-slate-500 gap-2">
                    <span>Original</span>
                    <ArrowRight className="w-3 h-3" />
                    <span>Edited</span>
                </div>
            )}
        </div>

      </main>
    </div>
  );
};

export default App;
