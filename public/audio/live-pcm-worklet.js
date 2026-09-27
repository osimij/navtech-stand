// 24 kHz mono PCM. Start each chunk immediately; interrupt at the actual played position.
class NaviPCM extends AudioWorkletProcessor {
  constructor() {
    super(); this.input = new Int16Array(480); this.inputAt = 0;
    this.queue = []; this.outputAt = 0; this.queued = 0; this.frameCount = 0;
    this.played = new Map(); this.playback = false;
    this.port.onmessage = ({ data }) => {
      if (data.type === 'clear' || data.type === 'interrupt') {
        this.queue = []; this.outputAt = 0; this.queued = 0;
        if (data.type === 'interrupt' && data.item_id) this.port.postMessage({ type: 'truncated', item_id: data.item_id, content_index: data.content_index || 0, audio_end_ms: Math.floor((this.played.get(data.item_id) || 0) / 24) });
        if (this.playback) { this.playback = false; this.port.postMessage({ type: 'playback', busy: false }); }
        return;
      }
      if (data.type === 'audio') {
        const pcm = new Int16Array(data.buffer);
        // Realtime can generate faster than playback. Never discard words to shorten a queue.
        // This is a memory bound, not a prebuffer: playback begins with the first sample.
        if (this.queued + pcm.length > 720000) { this.port.postMessage({ type: 'overflow' }); return; }
        this.queue.push({ pcm, id: data.item_id || '' }); this.queued += pcm.length;
        if (!this.playback) { this.playback = true; this.port.postMessage({ type: 'playback', busy: true }); }
      }
    };
  }
  process(inputs, outputs) {
    const input = inputs[0]?.[0], output = outputs[0]?.[0]; if (!output) return true;
    let energy = 0, inputEnergy = 0;
    for (let i = 0; i < output.length; i++) {
      const captured = Math.max(-1, Math.min(1, input?.[i] || 0)); inputEnergy += captured * captured;
      this.input[this.inputAt++] = Math.round(captured * (captured < 0 ? 32768 : 32767));
      if (this.inputAt === this.input.length) {
        this.port.postMessage({ type: 'input', buffer: this.input.buffer }, [this.input.buffer]);
        this.input = new Int16Array(480); this.inputAt = 0;
      }
      let value = 0;
      if (this.queue.length) {
        const chunk = this.queue[0]; value = chunk.pcm[this.outputAt++] / 32768; this.queued--;
        if (chunk.id) this.played.set(chunk.id, (this.played.get(chunk.id) || 0) + 1);
        if (this.outputAt === chunk.pcm.length) { this.queue.shift(); this.outputAt = 0; }
      }
      output[i] = value; energy += value * value;
    }
    if (!this.queued && this.playback) { this.playback = false; this.port.postMessage({ type: 'playback', busy: false }); }
    if (this.played.size > 24) this.played.delete(this.played.keys().next().value);
    this.frameCount += output.length;
    if (this.frameCount >= 1200) {
      this.frameCount = 0;
      this.port.postMessage({ type: 'level', level: Math.sqrt(energy / output.length), inputLevel: Math.sqrt(inputEnergy / output.length) });
    }
    return true;
  }
}
registerProcessor('navi-pcm', NaviPCM);
