import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Search, Play, Plus, Loader2 } from 'lucide-react';
import { youtubeAPI, handleApiError } from '../services/api';
import { useToast } from '../hooks/use-toast';

const YouTubeSearch = ({ isOpen, onClose, onTrackSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingTracks, setAddingTracks] = useState(new Set());
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await youtubeAPI.search(searchQuery, 15);
      setSearchResults(results);
    } catch (error) {
      const errorInfo = handleApiError(error);
      toast({
        title: "Search failed",
        description: errorInfo.message,
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddTrack = async (result) => {
    setAddingTracks(prev => new Set([...prev, result.id]));
    
    try {
      const track = await youtubeAPI.addTrack(result.id);
      toast({
        title: "Track added",
        description: `${track.title} by ${track.artist} added to library`
      });
      
      if (onTrackSelect) {
        onTrackSelect(track);
      }
    } catch (error) {
      const errorInfo = handleApiError(error);
      toast({
        title: "Failed to add track",
        description: errorInfo.message,
        variant: "destructive"
      });
    } finally {
      setAddingTracks(prev => {
        const newSet = new Set(prev);
        newSet.delete(result.id);
        return newSet;
      });
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-gray-900 border-gray-700 max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Search className="text-red-500" size={20} />
            Search YouTube Music
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Search for songs, artists, or albums..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
            />
            <Button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSearching ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Search size={16} />
              )}
            </Button>
          </div>

          {/* Search Results */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {searchResults.map((result) => (
              <div
                key={result.id}
                className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
              >
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                  <img
                    src={result.thumbnail}
                    alt={result.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Track Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium text-sm truncate">
                    {result.title}
                  </h4>
                  <p className="text-gray-400 text-xs truncate">
                    {result.artist}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {formatDuration(result.duration)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(result.url, '_blank')}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <Play size={14} />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAddTrack(result)}
                    disabled={addingTracks.has(result.id)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {addingTracks.has(result.id) ? (
                      <Loader2 className="animate-spin" size={14} />
                    ) : (
                      <Plus size={14} />
                    )}
                  </Button>
                </div>
              </div>
            ))}

            {searchResults.length === 0 && searchQuery && !isSearching && (
              <div className="text-center py-8 text-gray-400">
                <Search size={48} className="mx-auto mb-2 opacity-50" />
                <p>No results found for "{searchQuery}"</p>
                <p className="text-sm">Try different keywords</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end pt-4 border-t border-gray-700">
            <Button
              variant="outline"
              onClick={handleClose}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default YouTubeSearch;