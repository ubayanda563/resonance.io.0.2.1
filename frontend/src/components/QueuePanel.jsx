import React, { useState, useRef, memo } from 'react';
import { Trash2, GripVertical, Play } from 'lucide-react';
import { Button } from './ui/button';
import { usePlayer } from '../contexts/PlayerContext';

/**
 * QueuePanel — extracted queue with native HTML5 drag-to-reorder (#11).
 */
const QueuePanel = memo(() => {
  const { queue, currentIndex, playTrackFromQueue, removeFromQueue, reorderQueue, clearQueue } = usePlayer();
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  const dragNode = useRef(null);

  const handleDragStart = (e, i) => {
    setDragIndex(i);
    dragNode.current = e.currentTarget;
    e.dataTransfer.effectAllowed = 'move';
    // Slight delay so the ghost image renders first
    setTimeout(() => { if (dragNode.current) dragNode.current.style.opacity = '0.4'; }, 0);
  };

  const handleDragOver = (e, i) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverIndex(i);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== dropIndex) {
      reorderQueue(dragIndex, dropIndex);
    }
    setDragIndex(null);
    setOverIndex(null);
    if (dragNode.current) dragNode.current.style.opacity = '1';
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setOverIndex(null);
    if (dragNode.current) dragNode.current.style.opacity = '1';
  };

  if (!queue.length) {
    return (
      <div className="text-center py-8">
        <p className="text-[#3D3D45] text-sm">Queue is empty</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs uppercase tracking-[0.4em] text-[#888890]">
          Up Next · {queue.length} tracks
        </span>
        <button
          onClick={clearQueue}
          className="text-xs text-[#3D3D45] hover:text-[#CC2020] transition-colors"
        >
          Clear all
        </button>
      </div>

      <div className="space-y-1 max-h-64 overflow-y-auto scroll-chrome pr-1">
        {queue.map((track, i) => {
          const isActive = i === currentIndex;
          const isDragging = i === dragIndex;
          const isOver = i === overIndex && dragIndex !== null && i !== dragIndex;

          return (
            <div
              key={track.id || track._id || i}
              draggable
              onDragStart={(e) => handleDragStart(e, i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={(e) => handleDrop(e, i)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 p-2.5 rounded-xl transition-all cursor-grab active:cursor-grabbing
                ${isActive ? 'glass-surface border border-[rgba(196,154,40,0.25)]' : 'glass-dark-sm hover:glass-dark'}
                ${isDragging ? 'opacity-40' : ''}
                ${isOver ? 'border-t-2 border-[#C49A28]' : ''}
              `}
            >
              <GripVertical size={14} className="text-[#3D3D45] flex-shrink-0" />

              <img
                src={track.artwork_url}
                alt={track.title}
                className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
              />

              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium truncate ${isActive ? 'text-[#C49A28]' : 'text-[#EBEBED]'}`}>
                  {track.title}
                </p>
                <p className="text-[10px] text-[#3D3D45] truncate">{track.artist}</p>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {!isActive && (
                  <button
                    onClick={() => playTrackFromQueue(i)}
                    className="p-1 text-[#55555E] hover:text-[#EBEBED] transition-colors"
                  >
                    <Play size={11} />
                  </button>
                )}
                <button
                  onClick={() => removeFromQueue(i)}
                  className="p-1 text-[#55555E] hover:text-[#CC2020] transition-colors"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

QueuePanel.displayName = 'QueuePanel';
export default QueuePanel;
