// Synthesized arcade effects: no audio downloads or autoplay on page load.
export class RouletteAudio {
  private context: AudioContext | null = null;
  private voices = new Set<OscillatorNode>();
  enabled = true;

  unlock() {
    if (!this.enabled) return;
    try {
      this.context ??= new AudioContext();
      if (this.context.state === "suspended") void this.context.resume().catch(() => {});
    } catch {
      // Audio support/permissions must never prevent spinning.
    }
  }

  tone(frequency: number, endFrequency: number, duration: number, type: OscillatorType = "square", volume = 0.025, delay = 0) {
    const context = this.context;
    if (!this.enabled || !context || context.state !== "running") return;
    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    this.voices.add(oscillator);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
      this.voices.delete(oscillator);
    };
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  squeak() {
    const pitch = 550 + Math.random() * 250;
    this.tone(pitch, 180, 0.22, "sawtooth", 0.018);
    this.tone(190, pitch * 0.85, 0.16, "triangle", 0.028, 0.14);
  }

  win() {
    [523, 659, 784, 1047].forEach((pitch, index) => {
      this.tone(pitch, pitch, 0.18, "square", 0.025, index * 0.11);
    });
  }

  stop() {
    for (const voice of this.voices) {
      try { voice.stop(); } catch { /* Already ended. */ }
    }
    this.voices.clear();
  }

  dispose() {
    this.stop();
    if (this.context) void this.context.close().catch(() => {});
    this.context = null;
  }
}
