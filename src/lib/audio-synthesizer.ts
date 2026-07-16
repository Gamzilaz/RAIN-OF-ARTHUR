// Immersive Web Audio API Real-Time Weather Synthesizer
// Synthesizes realistic rain patter, howling wind, and deep thunder rumbles in real-time.

export default class WeatherAudioSynthesizer {
  private ctx: AudioContext | null = null;
  
  // Gain Nodes
  private masterGain: GainNode | null = null;
  private rainGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private thunderGain: GainNode | null = null;
  
  // Audio Nodes
  private rainNode: AudioWorkletNode | ScriptProcessorNode | null = null;
  private windNode: AudioWorkletNode | ScriptProcessorNode | null = null;
  
  // Filter Nodes
  private rainFilter: BiquadFilterNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  
  private isPlaying: boolean = false;
  private windLfoInterval: number | null = null;
  private bufferCache: { [key: string]: AudioBuffer | null } = {};
  private thunderVolumeLevel: number = 0.8;

  constructor() {
    // Initialized lazily to comply with browser user interaction policies
  }

  public init(): boolean {
    if (this.ctx) return true;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      console.warn("Web Audio API is not supported in this browser.");
      return false;
    }

    try {
      this.ctx = new AudioContextClass();
      
      // Master output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Dedicated Thunder gain node (independent of masterGain)
      this.thunderGain = this.ctx.createGain();
      this.thunderGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.thunderGain.connect(this.ctx.destination);

      // Rain line
      this.rainGain = this.ctx.createGain();
      this.rainGain.gain.setValueAtTime(0.0, this.ctx.currentTime); // start silent
      this.rainGain.connect(this.masterGain);

      this.rainFilter = this.ctx.createBiquadFilter();
      this.rainFilter.type = "bandpass";
      this.rainFilter.frequency.setValueAtTime(800, this.ctx.currentTime);
      this.rainFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);
      this.rainFilter.connect(this.rainGain);

      // Create white noise for rain patters
      this.createRainNoise();

      // Wind line
      this.windGain = this.ctx.createGain();
      this.windGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
      this.windGain.connect(this.masterGain);

      this.windFilter = this.ctx.createBiquadFilter();
      this.windFilter.type = "lowpass";
      this.windFilter.frequency.setValueAtTime(300, this.ctx.currentTime);
      this.windFilter.Q.setValueAtTime(2.0, this.ctx.currentTime);
      this.windFilter.connect(this.windGain);

      // Create pink/low-frequency noise for wind howling
      this.createWindNoise();
      this.startWindModulation();

      // Preload local high-quality thunder sounds into Web Audio buffers
      this.getAudioBuffer("/audio/groza1.mp3");
      this.getAudioBuffer("/audio/groza2.mp3");

      return true;
    } catch (e) {
      console.error("Failed to initialize Web Audio context", e);
      return false;
    }
  }

  private async getAudioBuffer(filePath: string): Promise<AudioBuffer | null> {
    if (this.bufferCache[filePath]) {
      return this.bufferCache[filePath];
    }
    if (!this.ctx) return null;

    try {
      let actualPath = filePath;
      const response = await fetch(actualPath);
      if (!response.ok) {
        // Try fallback extension
        const otherExtensionPath = filePath.endsWith('.ogg')
          ? filePath.replace('.ogg', '.mp3')
          : filePath.endsWith('.mp3')
            ? filePath.replace('.mp3', '.ogg')
            : null;

        if (otherExtensionPath) {
          const fallbackRes = await fetch(otherExtensionPath);
          if (fallbackRes.ok) {
            const arrayBuffer = await fallbackRes.arrayBuffer();
            const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
            this.bufferCache[filePath] = audioBuffer;
            return audioBuffer;
          }
        }
        throw new Error(`HTTP status ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
      this.bufferCache[filePath] = audioBuffer;
      return audioBuffer;
    } catch (err) {
      console.warn(`Failed to preload/decode audio file ${filePath}:`, err);
      return null;
    }
  }

  public async playFile(filePath: string, volume: number): Promise<void> {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    // Try high-performance Web Audio buffer playback
    const buffer = await this.getAudioBuffer(filePath);
    if (buffer) {
      try {
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;

        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);

        source.connect(gainNode);

        // Connect to independent thunderGain or directly to destination to avoid being affected by masterVolume
        gainNode.connect(this.thunderGain || this.ctx.destination);

        source.start();
        return;
      } catch (err) {
        console.warn(`Web Audio buffer source failed for ${filePath}, trying HTML5 fallback`, err);
      }
    }

    // Standard HTML5 Audio fallback (plays same-origin)
    try {
      const audio = new Audio(filePath);
      audio.volume = volume;
      audio.play().catch(e => console.warn("HTML5 fallback failed:", e));
    } catch (e) {
      console.warn("HTML5 instantiation failed:", e);
    }
  }

  public setThunderVolume(level: number): void {
    this.init();
    const volume = Math.max(0.0, Math.min(1.0, level));
    this.thunderVolumeLevel = volume;
    if (!this.ctx || !this.thunderGain) return;
    const gainValue = Math.sqrt(volume);
    this.thunderGain.gain.setTargetAtTime(gainValue, this.ctx.currentTime, 0.1);
  }

  private createRainNoise(): void {
    if (!this.ctx || !this.rainFilter) return;

    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // Populate with white noise
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2.0 - 1.0;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    // Connect to rain bandpass filter
    noiseSource.connect(this.rainFilter);
    noiseSource.start();
  }

  private createWindNoise(): void {
    if (!this.ctx || !this.windFilter) return;

    // Pink-noise approximation filter
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2.0 - 1.0;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11; // scale back
      b6 = white * 0.115926;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    // Connect to filter on wind line
    noiseSource.connect(this.windFilter);
    noiseSource.start();
  }

  private startWindModulation(): void {
    // Standard modular interval to simulate rolling wind gusts
    let time = 0;
    this.windLfoInterval = window.setInterval(() => {
      if (!this.ctx || !this.windFilter || !this.windGain || !this.isPlaying) return;

      time += 0.05;
      // Synthesize rolling gust patterns
      const rawGust = Math.sin(time * 0.25) * Math.cos(time * 0.53) + Math.cos(time * 0.11);
      const intensity = (rawGust + 2) / 4; // normalized [0, 1]

      const cutoffFreq = 180 + intensity * 280; // fluctuation of wind whistle pitch
      const gustVol = 0.12 + intensity * 0.35; // volume swells

      this.windFilter.frequency.setTargetAtTime(cutoffFreq, this.ctx.currentTime, 0.4);
      this.windGain.gain.setTargetAtTime(gustVol, this.ctx.currentTime, 0.3);
    }, 50);
  }

  public setVolume(level: number): void {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const gainValue = Math.sqrt(Math.max(0.0, Math.min(1.0, level)));
    this.masterGain.gain.setTargetAtTime(gainValue, this.ctx.currentTime, 0.1);
  }

  public start(): void {
    const success = this.init();
    if (!success || !this.ctx) return;

    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    this.isPlaying = true;
    
    // Ease volumes in
    this.rainGain!.gain.setTargetAtTime(0.5, this.ctx.currentTime, 1.5);
    this.windGain!.gain.setTargetAtTime(0.2, this.ctx.currentTime, 2.0);
  }

  public stop(): void {
    this.isPlaying = false;
    if (this.ctx && this.rainGain && this.windGain) {
      this.rainGain.gain.setTargetAtTime(0.0, this.ctx.currentTime, 0.5);
      this.windGain.gain.setTargetAtTime(0.0, this.ctx.currentTime, 0.8);
    }
  }

  public setRainIntensity(level: number): void {
    this.init();
    if (!this.ctx || !this.rainFilter || !this.rainGain) return;

    const targetCutoff = 400 + level * 700; // heavier rain sounds crispier with higher frequencies
    const targetVol = level * 0.8;

    this.rainFilter.frequency.setTargetAtTime(targetCutoff, this.ctx.currentTime, 0.5);
    this.rainGain.gain.setTargetAtTime(targetVol, this.ctx.currentTime, 0.3);
  }

  public setWindIntensity(level: number): void {
    this.init();
    if (!this.ctx || !this.windGain) return;
    
    // Wind scaling coefficient
    const volumeCoefficient = level * 0.6;
    this.windGain.gain.setTargetAtTime(volumeCoefficient, this.ctx.currentTime, 0.5);
  }

  public triggerThunder(intensity: number = 1.0): void {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    // 1. Synthesize heavy secondary low-frequency echoing rumble layers (long tail up to 10 seconds!)
    const rumbleSize = 6.0 + intensity * 4.0;
    const bufferSize = this.ctx.sampleRate * rumbleSize;
    const rumbleBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = rumbleBuffer.getChannelData(0);

    // Cumulative brownian-noise filter for very deep chest-vibrating rumbling
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2.0 - 1.0;
      output[i] = (lastOut + (0.015 * white)) / 1.015;
      lastOut = output[i];
      
      // Multi-stage wave reflection echo envelopes (hills & valley swells)
      const progress = i / bufferSize;
      const waveRolls = (
        0.50 * Math.sin(progress * Math.PI * 3.5) +  // primary rolling hills
        0.35 * Math.sin(progress * Math.PI * 9.0) +  // echoing waves
        0.15
      );
      output[i] *= 4.5 * intensity * Math.max(0.0, waveRolls);
    }

    // 3. Muffled, far-away barometric crack (low-pass pressure wave, no nearby dry snaps)
    const crackSize = 0.75;
    const crackBufferSize = this.ctx.sampleRate * crackSize;
    const crackBuffer = this.ctx.createBuffer(1, crackBufferSize, this.ctx.sampleRate);
    const crackOutput = crackBuffer.getChannelData(0);

    for (let i = 0; i < crackBufferSize; i++) {
      crackOutput[i] = Math.random() * 2.0 - 1.0;
    }

    const crackSource = this.ctx.createBufferSource();
    crackSource.buffer = crackBuffer;

    const crackFilter = this.ctx.createBiquadFilter();
    crackFilter.type = "lowpass"; 
    crackFilter.frequency.setValueAtTime(240, this.ctx.currentTime); // deeply muffled low frequencies only
    crackFilter.Q.setValueAtTime(1.0, this.ctx.currentTime);

    const crackGain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    
    // soft build-up pressure wave envelope
    crackGain.gain.setValueAtTime(0.0, now);
    crackGain.gain.linearRampToValueAtTime(0.24 * intensity, now + 0.15); // soft swelling arrival
    crackGain.gain.exponentialRampToValueAtTime(0.08 * intensity, now + 0.38);
    crackGain.gain.linearRampToValueAtTime(0.0, now + crackSize);

    crackSource.connect(crackFilter);
    crackFilter.connect(crackGain);
    crackGain.connect(this.thunderGain || this.ctx.destination);
    crackSource.start();

    // 4. Sub-bass reverb rumbles delayed slightly by physical speed of sound propagation
    const delayTime = (1.0 - intensity) * 0.4 + 0.05; // 50ms - 450ms propagation delay

    const rumbleSource = this.ctx.createBufferSource();
    rumbleSource.buffer = rumbleBuffer;

    const rumbleFilter = this.ctx.createBiquadFilter();
    rumbleFilter.type = "lowpass";
    rumbleFilter.frequency.setValueAtTime(80, now + delayTime); // extreme low end Focus
    rumbleFilter.Q.setValueAtTime(1.4, now + delayTime);

    const rumbleGain = this.ctx.createGain();
    
    rumbleGain.gain.setValueAtTime(0.0, now);
    rumbleGain.gain.setValueAtTime(0.0, now + delayTime);
    rumbleGain.gain.linearRampToValueAtTime(0.85 * intensity, now + delayTime + 0.2); // gradual heavy rise
    rumbleGain.gain.exponentialRampToValueAtTime(0.28 * intensity, now + delayTime + 1.2);
    rumbleGain.gain.exponentialRampToValueAtTime(0.05, now + delayTime + 3.0);
    rumbleGain.gain.linearRampToValueAtTime(0.0, now + delayTime + rumbleSize);

    rumbleSource.connect(rumbleFilter);
    rumbleFilter.connect(rumbleGain);
    rumbleGain.connect(this.thunderGain || this.ctx.destination);

    rumbleSource.start();
  }

  public destroy(): void {
    this.stop();
    if (this.windLfoInterval) {
      clearInterval(this.windLfoInterval);
    }
    if (this.ctx) {
      this.ctx.close();
    }
  }
}
