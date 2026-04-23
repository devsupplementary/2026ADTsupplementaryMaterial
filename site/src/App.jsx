import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Music, Info, Maximize2, X, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { config } from './data';
import PianoRoll from './components/PianoRoll';
import './index.css';

const App = () => {
  const [selectedTau, setSelectedTau] = useState(config.taus[2]); // For confusion matrices
  const [selectedDataset, setSelectedDataset] = useState(config.datasets[0]); // For audio gallery
  const [modalOpen, setModalOpen] = useState(false);
  const [modalView, setModalView] = useState('confusion'); // 'confusion' or 'f1'
  const [visibleRows, setVisibleRows] = useState({}); // { sampleIdx: boolean }

  const formatSampleName = (name) => {
    return name.split('_').slice(1).join('_').replace('.wav', '');
  };

  const toggleRowMidi = (sampleIdx) => {
    setVisibleRows(prev => ({
      ...prev,
      [sampleIdx]: !prev[sampleIdx]
    }));
  };

  return (
    <div className="container">
      <header className="section" style={{ borderBottom: 'none', marginBottom: '0', paddingBottom: '0.5rem' }}>
        <h1>{config.title}</h1>
        <p className="subtitle">{config.subtitle}</p>
      </header>

      {/* Instrument F1 Scores Section */}
      <section className="section">
        <h2><BarChart3 size={24} /> 26 Instrument F1 Scores</h2>
        <p>
          These scores represent the performance of the model trained with the Lakh MIDI Dataset (LMD) partition + CROSS for various confidence thresholds (τ). 
          Results are shown for the full model vocabulary (26 instrument classes) on the ENST and MDB datasets, with F1 metrics reported ONLY for classes present in the test set (support &gt; 0).
        </p>
        <div style={{ maxWidth: '750px', margin: '1.5rem auto 0 auto' }}>
          <div className="matrix-card">
            <div className="matrix-img-container" onClick={() => {
              setModalView('f1');
              setModalOpen(true);
            }}>
              <img
                src="/plots/f1_scores_bars.png"
                alt="Instrument-wise F1 Scores"
                className="matrix-img"
              />
              <div style={{ padding: '0.5rem', fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '0.5rem' }}>
                <Maximize2 size={14} /> Click to enlarge
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Confusion Matrices Section */}
      <section className="section">
        <h2><FileText size={24} /> Classification Reports</h2>
        <p>
          Confusion matrices for the model trained with different confidence thresholds (τ).
          Click on any image to view it in full screen.
        </p>

        <div className="tabs" style={{ justifyContent: 'center' }}>
          {config.taus.map(tau => (
            <button
              key={tau}
              className={`tab ${selectedTau === tau ? 'active' : ''}`}
              onClick={() => setSelectedTau(tau)}
            >
              τ = {tau}
            </button>
          ))}
        </div>

        <div className="matrix-grid">
          {config.datasets.map(ds => {
            const imgPath = `/plots/confusion_matrix_${ds}_tau_${selectedTau}.png`;
            return (
              <div key={ds} className="matrix-card">
                <h3 style={{ marginBottom: '1rem', fontSize: '0.8rem' }}>{ds} Dataset (τ={selectedTau})</h3>
                <div className="matrix-img-container" onClick={() => {
                  setModalView('confusion');
                  setSelectedDataset(ds);
                  setModalOpen(true);
                }}>
                  <img
                    src={imgPath}
                    alt={`Confusion Matrix ${ds} τ=${selectedTau}`}
                    className="matrix-img"
                  />
                  <div style={{ padding: '0.5rem', fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '0.5rem' }}>
                    <Maximize2 size={14} /> Click to enlarge
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Audio Showcase Section */}
      <section className="section" style={{ borderBottom: 'none' }}>
        <h2><Music size={24} /> Audio Gallery</h2>
        <p>
          Comparison of transcriptions across different τ values.
          The "Original Input" column remains the same for a given sample, while the subsequent columns
          show the audio synthesized from the model's transcription at each confidence threshold.
          Use the "Show Piano Rolls" button to visualize all transcriptions for a sample.
        </p>

        <div className="tabs" style={{ justifyContent: 'center' }}>
          {config.datasets.map(ds => (
            <button
              key={ds}
              className={`tab ${selectedDataset === ds ? 'active' : ''}`}
              onClick={() => setSelectedDataset(ds)}
            >
              {ds} Dataset
            </button>
          ))}
        </div>

        <div className="audio-table-container">
          <table className="audio-table">
            <thead>
              <tr>
                <th>Sample Description</th>
                <th>Original Input</th>
                <th>Synth (τ=0.4)</th>
                <th>Synth (τ=0.6)</th>
                <th>Synth (τ=0.8)</th>
              </tr>
            </thead>
            <tbody>
              {config.samples[selectedDataset].map((sample, idx) => (
                <tr key={sample}>
                  <td className="audio-name-cell">
                    <span className="label-mini">Sample {idx + 1}</span>
                    <div style={{ marginBottom: '0.75rem', fontWeight: '500' }}>{formatSampleName(sample)}</div>
                    <button 
                      className="toggle-midi-btn" 
                      onClick={() => toggleRowMidi(idx)}
                      style={{ marginTop: '0', width: 'fit-content' }}
                    >
                      {visibleRows[idx] ? <ChevronUp size={14} /> : <BarChart3 size={14} />}
                      {visibleRows[idx] ? 'Hide Piano Rolls' : 'Show Piano Rolls'}
                    </button>
                  </td>
                  <td className="audio-player-cell">
                    <div className="midi-cell-content">
                      <audio controls src={`/upload_audios/tau_0.8/${selectedDataset}/${sample}/original.wav`} />
                    </div>
                  </td>
                  {config.taus.map(tau => (
                    <td key={tau} className="audio-player-cell">
                      <div className="midi-cell-content">
                        <audio controls src={`/upload_audios/tau_${tau}/${selectedDataset}/${sample}/synthesized.wav`} />
                        <AnimatePresence>
                          {visibleRows[idx] && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              style={{ overflow: 'hidden' }}
                            >
                              <PianoRoll midiUrl={`/upload_audios/tau_${tau}/${selectedDataset}/${sample}/predicted_drums.mid`} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Image Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="modal-close"
                onClick={() => setModalOpen(false)}
              >
                <X size={24} />
              </button>

              <div className="modal-main-view">
                {modalView === 'confusion' && (
                  <div className="modal-side-controls">
                    <span className="label-mini" style={{ color: 'white', marginBottom: '1rem' }}>Threshold (τ)</span>
                    <div className="tabs tabs-vertical">
                      {config.taus.map(tau => (
                        <button
                          key={tau}
                          className={`tab ${selectedTau === tau ? 'active' : ''}`}
                          onClick={() => setSelectedTau(tau)}
                        >
                          τ = {tau}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="modal-image-container">
                  <div style={{ textAlign: 'left', marginBottom: '1rem', color: 'white', fontWeight: '600' }}>
                    {modalView === 'confusion' ? `${selectedDataset} Dataset (τ=${selectedTau})` : '26 Instrument F1 Scores'}
                  </div>
                  <img
                    src={modalView === 'confusion' 
                      ? `/plots/confusion_matrix_${selectedDataset}_tau_${selectedTau}.png`
                      : '/plots/f1_scores_bars.png'}
                    alt="Full size plot"
                  />
                </div>

                {modalView === 'confusion' && (
                  <div className="modal-side-controls">
                    <span className="label-mini" style={{ color: 'white', marginBottom: '1rem' }}>Dataset</span>
                    <div className="tabs tabs-vertical">
                      {config.datasets.map(ds => (
                        <button
                          key={ds}
                          className={`tab ${selectedDataset === ds ? 'active' : ''}`}
                          onClick={() => setSelectedDataset(ds)}
                        >
                          {ds}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
