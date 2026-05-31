import React, { useEffect, useRef, useState, memo } from 'react';
import { ListMusic } from 'lucide-react';

/**
 * PlaylistMosaic — generates a 2x2 canvas mosaic from the first 4 track
 * artworks in a playlist, just like Spotify (#10).
 */
const PlaylistMosaic = memo(({ artworkUrls = [], size = 128, className = '' }) => {
  const canvasRef = useRef(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    const urls = artworkUrls.filter(Boolean).slice(0, 4);
    if (!urls.length || !canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width  = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const half = size / 2;

    // Fill with dark background first
    ctx.fillStyle = '#1C1D26';
    ctx.fillRect(0, 0, size, size);

    let loaded = 0;
    urls.forEach((url, i) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const x = (i % 2) * half;
        const y = Math.floor(i / 2) * half;
        // If only 1 image, fill entire canvas
        if (urls.length === 1) {
          ctx.drawImage(img, 0, 0, size, size);
        } else {
          ctx.drawImage(img, x, y, half, half);
        }
        loaded++;
        if (loaded === urls.length) setRendered(true);
      };
      img.onerror = () => { loaded++; if (loaded === urls.length) setRendered(true); };
      img.src = url;
    });
  }, [artworkUrls, size]);

  if (!artworkUrls.filter(Boolean).length) {
    return (
      <div
        className={`flex items-center justify-center bg-[#1C1D26] ${className}`}
        style={{ width: size, height: size }}
      >
        <ListMusic size={size * 0.35} className="text-[#3D3D45]" />
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={className}
      style={{ opacity: rendered ? 1 : 0, transition: 'opacity 300ms' }}
    />
  );
});

PlaylistMosaic.displayName = 'PlaylistMosaic';
export default PlaylistMosaic;
