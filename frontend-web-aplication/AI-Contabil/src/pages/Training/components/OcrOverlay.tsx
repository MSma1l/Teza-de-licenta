/**
 * OCR Overlay - Afișează imaginea documentului cu bounding boxes.
 * Fiecare cuvânt are un overlay colorat pe baza confidence-ului:
 *   - Verde (>90%) = recunoscut sigur
 *   - Galben (75-90%) = posibil eronat
 *   - Roșu (<75%) = probabil greșit, necesită revizie
 *
 * Click pe un bounding box afișează detalii.
 * Tailwind CSS only.
 */
import { useState, useRef } from 'react';
import type { OcrBlock } from '../../../api/trainingApi';

interface OcrOverlayProps {
  imagePath: string;
  blocks: OcrBlock[];
}

export default function OcrOverlay({ imagePath, blocks }: OcrOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [selectedBlock, setSelectedBlock] = useState<OcrBlock | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const [zoom, setZoom] = useState(1);

  // Construim URL-ul imaginii
  const imageUrl = imagePath.startsWith('http')
    ? imagePath
    : `${import.meta.env.VITE_API_URL?.replace('/api', '')}/${imagePath}`;

  function handleImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
    setImageLoaded(true);
  }

  function getBlockColor(confidence: number): string {
    if (confidence >= 0.9) return 'rgba(34, 197, 94, 0.25)';    // green
    if (confidence >= 0.75) return 'rgba(245, 158, 11, 0.35)';  // amber
    return 'rgba(239, 68, 68, 0.4)';                             // red
  }

  function getBorderColor(confidence: number): string {
    if (confidence >= 0.9) return '#22c55e';
    if (confidence >= 0.75) return '#f59e0b';
    return '#ef4444';
  }

  // Calculăm scala bazată pe container vs imagine reală
  const containerWidth = containerRef.current?.clientWidth || 600;
  const scale = imageLoaded ? (containerWidth * zoom) / imageSize.width : 1;

  return (
    <div className="relative">
      {/* Controls */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur px-4 py-2 border-b border-neutral-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-neutral-500 cursor-pointer">
            <input
              type="checkbox"
              checked={showOverlay}
              onChange={(e) => setShowOverlay(e.target.checked)}
              className="accent-primary"
            />
            Arată overlay
          </label>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
            className="w-7 h-7 rounded border border-neutral-300 text-sm hover:bg-neutral-50"
          >
            −
          </button>
          <span className="text-xs text-neutral-500 w-12 text-center">{(zoom * 100).toFixed(0)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
            className="w-7 h-7 rounded border border-neutral-300 text-sm hover:bg-neutral-50"
          >
            +
          </button>
        </div>
      </div>

      {/* Image Container */}
      <div
        ref={containerRef}
        className="relative overflow-auto max-h-[600px] bg-neutral-100"
      >
        <div
          className="relative inline-block"
          style={{ width: imageSize.width * scale, height: imageSize.height * scale }}
        >
          <img
            src={imageUrl}
            alt="Document scanat"
            onLoad={handleImageLoad}
            className="block"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '';
              (e.target as HTMLImageElement).alt = 'Imaginea nu poate fi încărcată';
            }}
          />

          {/* Bounding Box Overlays */}
          {imageLoaded && showOverlay && blocks.map((block, i) => {
            const x = block.bbox.x1 * scale;
            const y = block.bbox.y1 * scale;
            const w = (block.bbox.x2 - block.bbox.x1) * scale;
            const h = (block.bbox.y2 - block.bbox.y1) * scale;

            return (
              <div
                key={i}
                className="absolute cursor-pointer transition-all hover:brightness-110"
                style={{
                  left: x,
                  top: y,
                  width: w,
                  height: h,
                  backgroundColor: getBlockColor(block.confidence),
                  border: `1.5px solid ${getBorderColor(block.confidence)}`,
                  borderRadius: 2,
                }}
                onClick={() => setSelectedBlock(block)}
                title={`"${block.text}" — ${(block.confidence * 100).toFixed(1)}%`}
              />
            );
          })}
        </div>
      </div>

      {/* Selected Block Detail */}
      {selectedBlock && (
        <div className="absolute bottom-4 left-4 right-4 bg-white border border-neutral-300 rounded-lg shadow-lg p-4 z-20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-black">
                "{selectedBlock.text}"
              </p>
              <div className="flex items-center gap-3 mt-1">
                <span className={`text-xs font-medium ${
                  selectedBlock.confidence >= 0.9 ? 'text-green-600' :
                  selectedBlock.confidence >= 0.75 ? 'text-amber-600' :
                  'text-red-600'
                }`}>
                  Confidence: {(selectedBlock.confidence * 100).toFixed(1)}%
                </span>
                <span className="text-xs text-neutral-400">
                  Poziție: ({selectedBlock.bbox.x1}, {selectedBlock.bbox.y1}) →
                  ({selectedBlock.bbox.x2}, {selectedBlock.bbox.y2})
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedBlock(null)}
              className="text-neutral-400 hover:text-neutral-700 text-lg"
            >
              ✕
            </button>
          </div>

          {/* Confidence Legend */}
          <div className="flex items-center gap-4 mt-3 text-xs text-neutral-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-green-400 inline-block" /> {'>'}90% — Sigur
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" /> 75-90% — Atenție
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-red-400 inline-block" /> {'<'}75% — Revizie
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
