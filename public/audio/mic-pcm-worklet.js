// Microphone → 16 kHz mono 16-bit PCM in 100 ms chunks, plus the level for the on-screen indicator.
// The context normally runs at 16 kHz already; otherwise each output sample averages its share of input samples,
// a simple low-pass that keeps speech clear for recognition.
class NaviMicPCM extends AudioWorkletProcessor {
  constructor() {
    super(); this.ratio = sampleRate / 16000; this.due = 0; this.sum = 0; this.count = 0;
    this.chunk = new Int16Array(1600); this.at = 0; this.energy = 0;
  }
  process(inputs) {
    const input = inputs[0]?.[0]; if (!input) return true;
    for (let i = 0; i < input.length; i++) {
      this.sum += input[i]; this.count++; this.due += 1;
      if (this.due < this.ratio) continue;
      this.due -= this.ratio;
      const value = Math.max(-1, Math.min(1, this.sum / this.count)); this.sum = 0; this.count = 0;
      this.energy += value * value;
      this.chunk[this.at++] = Math.round(value * (value < 0 ? 32768 : 32767));
      if (this.at === this.chunk.length) {
        const buffer = this.chunk.buffer;
        this.port.postMessage({ type: 'audio', buffer, level: Math.sqrt(this.energy / this.chunk.length) }, [buffer]);
        this.chunk = new Int16Array(1600); this.at = 0; this.energy = 0;
      }
    }
    return true;
  }
}
registerProcessor('navi-mic-pcm', NaviMicPCM);
