interface MockAudioLayer {
  frequency: number
  gain: number
  wobbleHz?: number
  wobbleDepth?: number
  phase?: number
}

interface MockAudioOptions {
  durationSeconds: number
  sampleRate?: number
  masterGain?: number
  noiseGain?: number
  noisePulseHz?: number
  layers: MockAudioLayer[]
}

function writeAscii(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index))
  }
}

function encodeWavBase64(bytes: Uint8Array) {
  let binary = ''
  const chunkSize = 0x8000

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, offset + chunkSize)
    binary += String.fromCharCode(...chunk)
  }

  return btoa(binary)
}

function buildNoiseSample(index: number) {
  const raw = Math.sin((index + 1) * 12.9898) * 43758.5453

  return (raw - Math.floor(raw)) * 2 - 1
}

export function createMockAudioDataUri(options: MockAudioOptions) {
  const sampleRate = options.sampleRate ?? 12000
  const sampleCount = Math.floor(options.durationSeconds * sampleRate)
  const dataSize = sampleCount * 2
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)
  const bytes = new Uint8Array(buffer)

  writeAscii(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeAscii(view, 8, 'WAVE')
  writeAscii(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeAscii(view, 36, 'data')
  view.setUint32(40, dataSize, true)

  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / sampleRate
    const fade = Math.min(
      1,
      time / 0.08,
      (options.durationSeconds - time) / 0.08,
    )
    const layeredSample = options.layers.reduce((total, layer) => {
      const wobble =
        layer.wobbleHz && layer.wobbleDepth
          ? 1 +
            Math.sin(time * Math.PI * 2 * layer.wobbleHz + (layer.phase ?? 0)) *
              layer.wobbleDepth
          : 1

      return (
        total +
        Math.sin(time * Math.PI * 2 * layer.frequency * wobble + (layer.phase ?? 0)) *
          layer.gain
      )
    }, 0)
    const pulse =
      options.noisePulseHz && options.noisePulseHz > 0
        ? 0.45 + 0.55 * ((Math.sin(time * Math.PI * 2 * options.noisePulseHz) + 1) / 2)
        : 1
    const noiseSample = buildNoiseSample(index) * (options.noiseGain ?? 0) * pulse
    const mixedSample = (layeredSample + noiseSample) * (options.masterGain ?? 0.72) * fade
    const pcmValue = Math.max(-1, Math.min(1, mixedSample))

    view.setInt16(44 + index * 2, pcmValue * 0x7fff, true)
  }

  return `data:audio/wav;base64,${encodeWavBase64(bytes)}`
}
