import React, { memo } from 'react';
import { RotateCcw } from 'lucide-react';
import { usePlayer } from '../contexts/PlayerContext';

/**
 * Equalizer — 5-band EQ using Web Audio BiquadFilterNodes (#9).
 * Bands: 60Hz | 250Hz | 1kHz | 4kHz | 14kHz
 */
const Equalizer = memo(() => {
  const { eqBands, EQ_BANDS, setEqBand, resetEq } = usePlayer();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.4em] text-[#888890]">Equalizer</span>
        <button
          onClick={resetEq}
          className="flex items-center gap-1 text-xs text-[#55555E] hover:text-[#EBEBED] transition-colors"
        >
          <RotateCcw size={11} />
          Reset
        </button>
      </div>

      <div className="flex items-end justify-between gap-3 h-28">
        {EQ_BANDS.map((band, i) => {
          const val = eqBands[i] ?? 0;
          // Map -12..+12 dB to 0..100% range for the slider
          const pct = ((val + 12) / 24) * 100;

          return (
            <div key={band.label} className="flex flex-col items-center gap-2 flex-1">
              {/* Vertical slider */}
              <div className="relative h-20 flex items-center justify-center">
                <input
                  type="range"
                  min={-12}
                  max={12}
                  step={0.5}
                  value={val}
                  onChange={(e) => setEqBand(i, parseFloat(e.target.value))}
                  className="eq-slider"
                  style={{
                    writingMode: 'vertical-lr',
                    direction: 'rtl',
                    width: '100%',
                    height: '80px',
                    cursor: 'pointer',
                    accentColor: val > 0 ? '#C49A28' : val < 0 ? '#CC2020' : '#888890',
                  }}
                />
              </div>
              {/* dB label */}
              <span className="text-[10px] tabular-nums text-[#888890]" style={{ minWidth: 28, textAlign: 'center' }}>
                {val > 0 ? `+${val}` : val}
              </span>
              {/* Freq label */}
              <span className="text-[9px] text-[#3D3D45]">{band.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

Equalizer.displayName = 'Equalizer';
export default Equalizer;
