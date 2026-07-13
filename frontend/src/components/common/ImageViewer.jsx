import React, { useState, useEffect, useRef } from "react";
import { 
  IoClose, 
  IoDownloadOutline, 
  IoArrowBackOutline, 
  IoArrowForwardOutline,
  IoResizeOutline
} from "react-icons/io5";

export default function ImageViewer({ src, images = [], onClose }) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const initialIndex = images.indexOf(src);
  const [currentIndex, setCurrentIndex] = useState(initialIndex !== -1 ? initialIndex : 0);

  const currentSrc = images.length > 0 ? images[currentIndex] : src;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && images.length > 1) handleNext();
      if (e.key === "ArrowLeft" && images.length > 1) handlePrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, images]);

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setScale((prev) => {
    const newScale = Math.max(prev - 0.25, 0.5);
    if (newScale === 0.5) setPosition({ x: 0, y: 0 });
    return newScale;
  });

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleNext = () => {
    if (images.length > 0 && currentIndex < images.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      handleReset();
    }
  };

  const handlePrev = () => {
    if (images.length > 0 && currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      handleReset();
    }
  };

  const handleWheel = (e) => {
    if (e.deltaY < 0) {
      setScale((prev) => Math.min(prev + 0.1, 4));
    } else {
      setScale((prev) => {
        const newScale = Math.max(prev - 0.1, 0.5);
        if (newScale === 0.5) setPosition({ x: 0, y: 0 });
        return newScale;
      });
    }
  };

  const handleMouseDown = (e) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = currentSrc;
    link.download = currentSrc.split("/").pop() || "workspace-media.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div 
      className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex flex-col justify-between select-none"
      onWheel={handleWheel}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      
      {/* 1. Header Toolbar */}
      <div className="h-16 px-6 bg-slate-950/60 border-b border-slate-900 flex justify-between items-center z-10">
        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
          {images.length > 1 ? `Media ${currentIndex + 1} of ${images.length}` : "Image Viewer"}
        </div>

        <div className="flex items-center gap-3.5">
          <button
            onClick={handleZoomIn}
            className="w-8 h-8 flex items-center justify-center bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-350 hover:text-white rounded-lg transition font-extrabold text-sm cursor-pointer"
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={handleZoomOut}
            className="w-8 h-8 flex items-center justify-center bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-350 hover:text-white rounded-lg transition font-extrabold text-sm cursor-pointer"
            title="Zoom Out"
          >
            -
          </button>
          <button
            onClick={handleReset}
            className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-350 hover:text-white rounded-lg transition"
            title="Actual Size (Reset)"
          >
            <IoResizeOutline size={16} />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-350 hover:text-white rounded-lg transition"
            title="Download Image"
          >
            <IoDownloadOutline size={16} />
          </button>

          <div className="w-px h-6 bg-slate-800 mx-1" />

          <button
            onClick={onClose}
            className="p-2 bg-slate-900 border border-slate-800 hover:bg-red-500/15 hover:border-red-500/20 text-slate-350 hover:text-red-400 rounded-lg transition"
            title="Close Viewer (ESC)"
          >
            <IoClose size={18} />
          </button>
        </div>
      </div>

      {/* 2. Middle Frame Area */}
      <div 
        className="flex-1 flex items-center justify-center relative overflow-hidden cursor-move"
        onMouseDown={handleMouseDown}
      >
        
        {/* Left Arrow */}
        {images.length > 1 && currentIndex > 0 && (
          <button
            onClick={handlePrev}
            className="absolute left-6 p-3 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/50 rounded-full text-slate-300 transition z-10"
            title="Previous Image"
          >
            <IoArrowBackOutline size={20} />
          </button>
        )}

        {/* Display Image Canvas */}
        <div 
          className="transition-transform duration-75 ease-out select-none"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default"
          }}
        >
          <img 
            src={currentSrc} 
            alt="Expanded workspace content" 
            className="max-w-[85vw] max-h-[75vh] object-contain rounded-lg border border-slate-850/40 pointer-events-none shadow-2xl"
          />
        </div>

        {/* Right Arrow */}
        {images.length > 1 && currentIndex < images.length - 1 && (
          <button
            onClick={handleNext}
            className="absolute right-6 p-3 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/50 rounded-full text-slate-300 transition z-10"
            title="Next Image"
          >
            <IoArrowForwardOutline size={20} />
          </button>
        )}

      </div>

      {/* 3. Tiny Footer Description */}
      <div className="h-10 text-center text-[10px] text-slate-500 font-medium">
        Drag image while zoomed to pan. Use mouse scroll wheel to zoom.
      </div>

    </div>
  );
}
