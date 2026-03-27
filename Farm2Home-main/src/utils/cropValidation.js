import { CROP_DICTIONARY } from '../data/cropData'
import { translateToEnglish } from './translationDict'

const normalizeCropText = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')

const CANONICAL_CROP_LOOKUP = new Map(
  CROP_DICTIONARY.map((crop) => [normalizeCropText(crop.name), crop.name])
)

export const resolveCanonicalCropName = (input) => {
  if (!input) return ''

  const translatedName = translateToEnglish(input)
  const normalizedName = normalizeCropText(translatedName)

  return CANONICAL_CROP_LOOKUP.get(normalizedName) || ''
}

export const isValidCropName = (input) => Boolean(resolveCanonicalCropName(input))

export const getCanonicalCropNames = () =>
  CROP_DICTIONARY.map((crop) => crop.name)
