'use client';

import { useState, useRef, useEffect } from 'react';

export default function GhibliGeneratorPage() {
    // State variables
    const [selectedFile, setSelectedFile] = useState(null);
    const [originalImageUrl, setOriginalImageUrl] = useState(null);
    const [stylizedImageUrl, setStylizedImageUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState(null);
    const [imageDescription, setImageDescription] = useState(null);
    const [generationPrompt, setGenerationPrompt] = useState(null);
    const [selectedModel, setSelectedModel] = useState('grok'); // Default to grok

    // Refs for DOM elements that need direct interaction
    const fileInputRef = useRef(null);
    const dropZoneRef = useRef(null);

    // Handle file selection from the file input
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            displayImage(file);
        }
    };

    // Display the selected image
    const displayImage = (file) => {
        if (file.type.match('image.*')) {
            setSelectedFile(file);
            setOriginalImageUrl(URL.createObjectURL(file));
            setError(null);
        } else {
            setError('Please select a valid image file (JPEG, PNG, etc.)');
        }
    };

    // Handle click on the upload button
    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    // Handle click on the clear button
    const handleClear = () => {
        setSelectedFile(null);
        if (originalImageUrl) URL.revokeObjectURL(originalImageUrl);
        setOriginalImageUrl(null);
        if (stylizedImageUrl?.startsWith('blob:')) URL.revokeObjectURL(stylizedImageUrl);
        setStylizedImageUrl(null);
        setError(null);
        setImageDescription(null);
        setGenerationPrompt(null);
    };

    // Handle the convert/generate button click
    const handleGenerateClick = async () => {
        if (!selectedFile) {
            setError("Please select an image first.");
            return;
        }

        setIsLoading(true);
        setStylizedImageUrl(null); // Clear previous stylized image
        setError(null);
        setImageDescription(null);
        setGenerationPrompt(null);

        const formData = new FormData();
        formData.append('image', selectedFile);
        formData.append('model', selectedModel); // Add selected model to form data

        try {
            const response = await fetch('/api/stylize', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                let errorMsg = `Error: ${response.status}`;
                try {
                    const errData = await response.json();
                    errorMsg = errData.error || errorMsg;
                } catch (e) { /* Ignore if response is not JSON */ }
                throw new Error(errorMsg);
            }

            // Get the JSON response containing the image URL
            const result = await response.json();
            
            if (!result.url) {
                throw new Error("API did not return a valid image URL.");
            }

            // Set the URL from the response
            setStylizedImageUrl(result.url);
            
            // Set the description and prompt if available
            if (result.description) setImageDescription(result.description);
            if (result.prompt) setGenerationPrompt(result.prompt);

        } catch (err) {
            console.error("Generation Error:", err);
            setError(err.message || "Failed to generate image. Please try again.");
            setStylizedImageUrl(null);
        } finally {
            setIsLoading(false);
        }
    };

    // Drag and drop handlers
    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragging) setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            displayImage(e.dataTransfer.files[0]);
        }
        setError(null);
    };

    // Cleanup effect
    useEffect(() => {
        const preventDefaults = (e) => {
            e.preventDefault();
            e.stopPropagation();
        };
        
        // Add global event listeners
        document.addEventListener('dragover', preventDefaults);
        document.addEventListener('drop', preventDefaults);
        
        // Cleanup function
        return () => {
            if (originalImageUrl) URL.revokeObjectURL(originalImageUrl);
            // Check if the URL is an object URL before revoking
            if (stylizedImageUrl?.startsWith('blob:')) URL.revokeObjectURL(stylizedImageUrl);
            document.removeEventListener('dragover', preventDefaults);
            document.removeEventListener('drop', preventDefaults);
        };
    }, [originalImageUrl, stylizedImageUrl]);

    return (
        <div className="container">
            <header className="header">
                <div className="ghibli-cloud"></div>
                <h1>Ghibli Image Generator</h1>
                <p>Generate beautiful Studio Ghibli style images with the power of AI!</p>
            </header>

            <div className="converter-wrapper">
                {/* Input Section */}
                <div 
                    ref={dropZoneRef} 
                    className={`image-section input-section ${isDragging ? 'dragging' : ''}`}
                >
                    <h2>Upload Reference Image</h2>
                    <div 
                        className="upload-area"
                        onDragEnter={handleDragEnter}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <input
                            type="file"
                            accept="image/png, image/jpeg, image/webp"
                            className="file-input"
                            onChange={handleFileChange}
                            ref={fileInputRef}
                        />

                        {selectedFile ? (
                            <img src={originalImageUrl} alt="Original" className="preview-image" />
                        ) : (
                            <>
                                <div className="icon-upload-cloud"></div>
                                <p className="mt-4 mb-2">Drag & Drop your image here</p>
                                <p className="text-sm text-gray-500 mb-4">or</p>
                                <button type="button" onClick={handleUploadClick} className="upload-button">
                                    <span>Browse Files</span>
                                </button>
                                <p className="text-xs text-gray-400 mt-4">
                                    Supports: JPG, PNG, WebP
                                </p>
                            </>
                        )}
                    </div>

                    {selectedFile && (
                        <div className="button-group">
                            <div className="model-selection mb-4">
                                <label htmlFor="model-select" className="block text-sm font-medium text-primary-dark mb-2">
                                    Select AI Model:
                                </label>
                                <div className="relative">
                                    <select
                                        id="model-select"
                                        value={selectedModel}
                                        onChange={(e) => setSelectedModel(e.target.value)}
                                        className="block w-full bg-white border border-gray-200 text-gray-700 py-2 px-3 pr-8 rounded leading-tight focus:outline-none focus:border-primary-light"
                                        disabled={isLoading}
                                    >
                                        <option value="grok">Grok (xAI)</option>
                                        <option value="openai">DALL-E (OpenAI)</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                                        </svg>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {selectedModel === 'grok' 
                                        ? 'Grok uses xAI\'s image generation capabilities.' 
                                        : 'DALL-E uses OpenAI\'s image editing capabilities.'}
                                </p>
                            </div>
                            <button 
                                onClick={handleGenerateClick} 
                                className="convert-button" 
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <div className="spinner"></div>
                                        <span>Generating...</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="icon-sparkles"></div>
                                        <span>Generate Ghibli Image</span>
                                    </>
                                )}
                            </button>
                            <button onClick={handleClear} className="clear-button" disabled={isLoading}>
                                <div className="icon-trash"></div>
                                <span>Clear</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Output Section */}
                <div className="image-section output-section">
                    <h2>Generated Ghibli Image</h2>
                    <div className="upload-area result-area">
                        {isLoading && (
                            <div className="loading-indicator">
                                <div className="spinner"></div>
                                <p>Creating Ghibli magic...</p>
                                <p className="text-xs text-gray-500 mt-2">This may take a moment</p>
                            </div>
                        )}

                        {error && !isLoading && (
                            <div className="error-message">
                                <div className="icon-alert-triangle"></div>
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="result-image-container">
                            {stylizedImageUrl ? (
                                <>
                                    <img src={stylizedImageUrl} alt="Generated Ghibli Image" className="preview-image" />
                                    
                                    {imageDescription && (
                                        <div className="image-info mt-4">
                                            <h3 className="text-sm font-semibold text-primary-dark mb-2">Image Description:</h3>
                                            <p className="text-xs text-gray-700 bg-gray-50 p-3 rounded-md border border-gray-100">
                                                {imageDescription}
                                            </p>
                                        </div>
                                    )}
                                    
                                    {generationPrompt && (
                                        <div className="image-info mt-3">
                                            <details className="text-xs">
                                                <summary className="text-sm font-semibold text-primary-dark cursor-pointer">
                                                    View Generation Prompt
                                                </summary>
                                                <p className="text-xs text-gray-700 bg-gray-50 p-3 mt-2 rounded-md border border-gray-100">
                                                    {generationPrompt}
                                                </p>
                                            </details>
                                        </div>
                                    )}
                                </>
                            ) : !isLoading && !error && (
                                <>
                                    <div className="icon-wand"></div>
                                    <span className="mt-4">Your Ghibli image will appear here</span>
                                    <p className="text-xs text-gray-400 mt-2">
                                        Upload an image and click "Generate" to begin
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <footer className="footer">
                <p>
                    Created with <span className="text-red-500">♥</span> using Next.js and xAI's Grok API
                </p>
                <p className="text-xs mt-2">
                    <span className="tooltip">
                        How it works
                        <span className="tooltip-text">
                            This app uses AI to generate Ghibli-style images based on a text prompt. 
                            The uploaded image is used as a reference but not directly transformed.
                        </span>
                    </span>
                </p>
            </footer>
        </div>
    );
}
