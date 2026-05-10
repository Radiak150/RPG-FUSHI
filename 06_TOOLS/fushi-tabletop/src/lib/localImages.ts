import { uploadPhysicalAsset } from './physicalAssets'

export interface LocalImageOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onerror = () => {
      reject(new Error('Nao foi possivel ler a imagem local.'))
    }

    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Formato de imagem local invalido.'))
        return
      }

      resolve(reader.result)
    }

    reader.readAsDataURL(file)
  })
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()

    image.onload = () => resolve(image)
    image.onerror = () => {
      reject(new Error('Nao foi possivel processar a imagem local.'))
    }

    image.src = src
  })
}

function calculateOutputSize(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number,
) {
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height }
  }

  const ratio = Math.min(maxWidth / width, maxHeight / height)

  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, type, quality)
  })
}

function replaceFileExtension(filename: string, extension: string) {
  const baseName = filename.replace(/\.[^.]+$/, '')

  return `${baseName || 'imagem'}${extension}`
}

export function isImageFile(file: File) {
  return file.type.startsWith('image/')
}

export async function readImageFileAsDataUrl(
  file: File,
  options?: LocalImageOptions,
) {
  if (!isImageFile(file)) {
    throw new Error('Selecione um arquivo de imagem valido.')
  }

  const maxWidth = options?.maxWidth ?? 1280
  const maxHeight = options?.maxHeight ?? 1280
  const quality = options?.quality ?? 0.9

  const sourceDataUrl = await readFileAsDataUrl(file)
  const image = await loadImage(sourceDataUrl)
  const outputSize = calculateOutputSize(
    image.width,
    image.height,
    maxWidth,
    maxHeight,
  )
  const canvas = document.createElement('canvas')

  canvas.width = outputSize.width
  canvas.height = outputSize.height

  const context = canvas.getContext('2d')

  if (!context) {
    const uploadedOriginal = await uploadPhysicalAsset(file, {
      category: 'images',
      contentType: file.type || 'application/octet-stream',
      filename: file.name,
    })

    return uploadedOriginal.url
  }

  context.drawImage(image, 0, 0, outputSize.width, outputSize.height)

  try {
    const compressedImage = await canvasToBlob(canvas, 'image/webp', quality)

    if (compressedImage) {
      const uploadedImage = await uploadPhysicalAsset(compressedImage, {
        category: 'images',
        contentType: 'image/webp',
        filename: replaceFileExtension(file.name, '.webp'),
      })

      return uploadedImage.url
    }
  } catch {
    const uploadedOriginal = await uploadPhysicalAsset(file, {
      category: 'images',
      contentType: file.type || 'application/octet-stream',
      filename: file.name,
    })

    return uploadedOriginal.url
  }

  const uploadedOriginal = await uploadPhysicalAsset(file, {
    category: 'images',
    contentType: file.type || 'application/octet-stream',
    filename: file.name,
  })

  return uploadedOriginal.url
}
