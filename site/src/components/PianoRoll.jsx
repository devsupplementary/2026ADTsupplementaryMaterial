import React, { useEffect, useRef, useState } from 'react';
import { Midi } from '@tonejs/midi';

const GM_REDUCED_NAMES = {
  35: "Acoustic Bass Drum",
  36: "Bass Drum 1",
  37: "Side Stick",
  38: "Acoustic Snare",
  39: "Hand Clap",
  40: "Electric Snare",
  41: "Floor Tom",
  42: "Closed Hi Hat",
  43: "Pedal Hi-Hat",
  44: "Open Hi-Hat",
  45: "Mid Tom",
  46: "Crash Cymbal",
  47: "High Tom",
  48: "Ride Cymbal",
  49: "Chinese Cymbal",
  50: "Tambourine",
  51: "Splash Cymbal",
  52: "Cowbell",
  53: "Vibraslap",
  54: "Congas & Timbales",
  55: "Shaker",
  56: "Whistle",
  57: "Guiro",
  58: "Claves",
  59: "Cuica",
  60: "Triangle",
};

// Global registry to synchronize pitches across different versions (taus) of the same sample
const globalSamplePitches = {}; 
const globalListeners = {};

const PianoRoll = ({ midiUrl, height = 120 }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [canvasHeight, setCanvasHeight] = useState(height);
  const [syncedPitches, setSyncedPitches] = useState([]);
  
  // Unique key for the sample (e.g. "dataset/sample_name")
  const sampleKey = midiUrl.split('/').slice(-3, -1).join('/');

  useEffect(() => {
    let isMounted = true;

    const loadMidi = async () => {
      try {
        setLoading(true);
        const response = await fetch(midiUrl);
        if (!response.ok) throw new Error('Failed to load MIDI');
        const arrayBuffer = await response.arrayBuffer();
        const midi = new Midi(arrayBuffer);

        if (isMounted) {
          const notes = [];
          midi.tracks.forEach(track => {
            notes.push(...track.notes);
          });
          
          const myPitches = [...new Set(notes.map(n => n.midi))];
          
          // Update global registry for this sample
          if (!globalSamplePitches[sampleKey]) {
            globalSamplePitches[sampleKey] = new Set();
          }
          if (!globalListeners[sampleKey]) {
            globalListeners[sampleKey] = new Set();
          }
          
          const oldSize = globalSamplePitches[sampleKey].size;
          myPitches.forEach(p => globalSamplePitches[sampleKey].add(p));
          
          // Register this component to receive updates
          globalListeners[sampleKey].add(setSyncedPitches);

          const currentUnion = [...globalSamplePitches[sampleKey]].sort((a, b) => a - b);
          setSyncedPitches(currentUnion);

          // If we found new pitches, notify other components showing the same sample
          if (globalSamplePitches[sampleKey].size > oldSize) {
            globalListeners[sampleKey].forEach(listener => {
              if (listener !== setSyncedPitches) {
                listener(currentUnion);
              }
            });
          }

          setStats({ count: notes.length, duration: midi.duration.toFixed(2), midi, notes });
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading MIDI:', err);
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    loadMidi();

    return () => {
      isMounted = false;
      if (globalListeners[sampleKey]) {
        globalListeners[sampleKey].delete(setSyncedPitches);
      }
    };
  }, [midiUrl]);

  // Redraw when syncedPitches or container width changes
  useEffect(() => {
    if (!loading && stats && syncedPitches.length > 0) {
      const ROW_HEIGHT = 28;
      const VERTICAL_PADDING = 15;
      
      // Calculate height based on the UNION of pitches for this sample
      const calculatedHeight = Math.max(80, syncedPitches.length * ROW_HEIGHT + (VERTICAL_PADDING * 2));
      setCanvasHeight(calculatedHeight);
      
      // Small delay to ensure canvas is resized in DOM before drawing
      const timer = setTimeout(() => {
        drawPianoRoll(stats.midi, stats.notes, calculatedHeight, syncedPitches, ROW_HEIGHT, VERTICAL_PADDING);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [syncedPitches, loading, stats]);

  const drawPianoRoll = (midi, notes, currentHeight, activePitches, rowH, paddingV) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    const width = container.offsetWidth || 300;
    const dpr = window.devicePixelRatio || 1;
    const labelWidth = 100;
    
    canvas.width = width * dpr;
    canvas.height = currentHeight * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, currentHeight);

    const maxTime = Math.max(0.1, midi.duration || Math.max(...notes.map(n => n.time + n.duration)));
    
    // Use the synced union of pitches to define rows
    const sortedPitches = [...activePitches].sort((a, b) => a - b);
    const minP = sortedPitches[0];
    const maxP = sortedPitches[sortedPitches.length - 1];
    
    // Pitch to Y helper
    const getPitchY = (p) => {
        if (sortedPitches.length === 1) return currentHeight / 2;
        // Map pitch index to vertical position
        const index = sortedPitches.indexOf(p);
        return currentHeight - paddingV - (index / (sortedPitches.length - 1 || 1)) * (currentHeight - 2 * paddingV);
    };

    // Only draw grid and labels for pitches present in THIS track
    const myUniquePitches = [...new Set(notes.map(n => n.midi))];
    myUniquePitches.forEach(pitch => {
      const y = getPitchY(pitch);
      
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      const name = GM_REDUCED_NAMES[pitch];
      if (name) {
        ctx.font = '600 8px Inter';
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(name.toUpperCase(), 5, y);
      }
    });

    // Draw notes
    const usableWidth = width - labelWidth - 10;
    notes.forEach(note => {
      const x = labelWidth + (note.time / maxTime) * usableWidth;
      const w = Math.max(4, (note.duration / maxTime) * usableWidth);
      const y = getPitchY(note.midi);
      const h = Math.max(8, rowH * 0.7);

      ctx.fillStyle = '#2563eb'; 
      ctx.beginPath();
      if (ctx.roundRect) {
          ctx.roundRect(x, y - h/2, w, h, 2);
      } else {
          ctx.rect(x, y - h/2, w, h);
      }
      ctx.fill();
      
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  };

  if (error) return <div className="piano-roll-placeholder error">Error: {error}</div>;

  return (
    <div ref={containerRef} className="piano-roll-container">
      {loading && <div className="piano-roll-placeholder">Loading...</div>}
      <canvas 
        ref={canvasRef} 
        style={{ width: '100%', height: `${canvasHeight}px`, display: loading ? 'none' : 'block' }}
      />
      {!loading && stats && (
        <div style={{ padding: '4px 8px', fontSize: '10px', color: '#94a3b8', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
          <span>{stats.count} notes</span>
          <span>{stats.duration}s</span>
        </div>
      )}
    </div>
  );
};

export default PianoRoll;
