/**
 * Procedural Web Audio synthesizer for Miao Village ambiance:
 * - River stream rushing water
 * - Mountain breeze & rustling bamboo
 * - Silver bell chiming when moving
 * - Lusheng flute melodies when dancing or near plaza
 * - Night crickets
 */

class MiaoSoundManager {
  private ctx: AudioContext | null = null
  private riverGain: GainNode | null = null
  private windGain: GainNode | null = null
  private cricketsGain: GainNode | null = null
  private isMuted = true
  private hasInteracted = false

  private initContext() {
    if (this.ctx) return
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    this.ctx = new AudioCtx()

    // 1. River Ambient Synth (Pink Noise + Lowpass Bandpass)
    const riverNoise = this.createNoiseNode(this.ctx)
    const riverFilter = this.ctx.createBiquadFilter()
    riverFilter.type = 'bandpass'
    riverFilter.frequency.value = 420
    riverFilter.Q.value = 1.2

    this.riverGain = this.ctx.createGain()
    this.riverGain.gain.value = 0.08
    riverNoise.connect(riverFilter)
    riverFilter.connect(this.riverGain)
    this.riverGain.connect(this.ctx.destination)

    // 2. Wind Synth
    const windNoise = this.createNoiseNode(this.ctx)
    const windFilter = this.ctx.createBiquadFilter()
    windFilter.type = 'lowpass'
    windFilter.frequency.value = 280

    this.windGain = this.ctx.createGain()
    this.windGain.gain.value = 0.05
    windNoise.connect(windFilter)
    windFilter.connect(this.windGain)
    this.windGain.connect(this.ctx.destination)
  }

  private createNoiseNode(ctx: AudioContext): AudioNode {
    const bufferSize = ctx.sampleRate * 2
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    noise.loop = true
    noise.start(0)
    return noise
  }

  public toggleSound(): boolean {
    this.initContext()
    if (this.ctx?.state === 'suspended') {
      void this.ctx.resume()
    }
    this.isMuted = !this.isMuted
    if (this.ctx) {
      const targetGain = this.isMuted ? 0 : 1
      if (this.riverGain) this.riverGain.gain.setTargetAtTime(targetGain * 0.08, this.ctx.currentTime, 0.2)
      if (this.windGain) this.windGain.gain.setTargetAtTime(targetGain * 0.05, this.ctx.currentTime, 0.2)
    }
    return !this.isMuted
  }

  public getMuted(): boolean {
    return this.isMuted
  }

  /**
   * Play silver bell chime when stepping
   */
  public playSilverChime() {
    if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return
    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    const freq = [2600, 3200, 3900, 4400][Math.floor(Math.random() * 4)]
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, now)

    gain.gain.setValueAtTime(0.018, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35)

    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start(now)
    osc.stop(now + 0.36)
  }

  /**
   * Play Lusheng folk musical note (pentatonic Miao scale)
   */
  public playLushengNote(noteIndex?: number) {
    if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return
    const now = this.ctx.currentTime
    const scale = [293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25] // D4, E4, G4, A4, C5, D5, E5
    const freq = scale[noteIndex !== undefined ? noteIndex % scale.length : Math.floor(Math.random() * scale.length)]

    const osc1 = this.ctx.createOscillator()
    const osc2 = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    const filter = this.ctx.createBiquadFilter()

    osc1.type = 'sawtooth'
    osc1.frequency.setValueAtTime(freq, now)

    osc2.type = 'triangle'
    osc2.frequency.setValueAtTime(freq * 2, now)

    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(freq * 1.5, now)
    filter.Q.setValueAtTime(3.0, now)

    gain.gain.setValueAtTime(0.001, now)
    gain.gain.linearRampToValueAtTime(0.045, now + 0.08)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.75)

    osc1.connect(filter)
    osc2.connect(filter)
    filter.connect(gain)
    gain.connect(this.ctx.destination)

    osc1.start(now)
    osc2.start(now)
    osc1.stop(now + 0.76)
    osc2.stop(now + 0.76)
  }
}

export const miaoSound = new MiaoSoundManager()
