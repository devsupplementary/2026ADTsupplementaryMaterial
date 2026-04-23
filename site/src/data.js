export const config = {
  title: "Learning Drum Transcription from Synthetic Data via CLAP-based One-Shot Curation",
  subtitle: "Semi-Supervised One-Shot Sample Curation - Supplementary Material",
  abstract: "This page presents supplementary materials for our paper, including classification reports (confusion matrices) for various confidence thresholds (τ) and audio samples comparing original inputs with transcriptions synthesized using our model.",
  taus: ["0.4", "0.6", "0.8"],
  datasets: ["ENST", "MDB"],
  samples: {
    ENST: [
      "00125_drummer_1_111_minus-one_funky_rods.wav",
      "00129_drummer_1_111_minus-one_funky_rods.wav",
      "00137_drummer_1_111_minus-one_funky_rods.wav",
      "00293_drummer_1_123_MIDI-minus-one_blues-102_sticks.wav",
      "00629_drummer_2_120_minus-one_funk_sticks.wav",
      "00637_drummer_2_120_minus-one_funk_sticks.wav",
      "00949_drummer_2_150_MIDI-minus-one_soul-98_sticks.wav",
      "01015_drummer_3_127_minus-one_rock-60s_sticks.wav",
      "01122_drummer_3_130_minus-one_funky_sticks.wav",
      "01248_drummer_3_134_minus-one_bossa_sticks.wav"
    ],
    MDB: [
      "00000_MusicDelta_80sRock_Drum.wav",
      "00015_MusicDelta_Beatles_Drum.wav",
      "00030_MusicDelta_BebopJazz_Drum.wav",
      "00071_MusicDelta_Britpop_Drum.wav",
      "00086_MusicDelta_CoolJazz_Drum.wav",
      "00126_MusicDelta_Country1_Drum.wav",
      "00140_MusicDelta_Disco_Drum.wav",
      "00189_MusicDelta_FreeJazz_Drum.wav",
      "00230_MusicDelta_FunkJazz_Drum.wav",
      "00250_MusicDelta_FusionJazz_Drum.wav"
    ]
  }
};
