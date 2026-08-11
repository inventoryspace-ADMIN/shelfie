import React, { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Shuffle, RefreshCw, Sparkles, Palette } from 'lucide-react';
import { InventoryItem } from './InventoryGrid';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface OutfitRemixProps {
  items: InventoryItem[];
}

interface ItemCombination {
  primary?: InventoryItem;
  secondary?: InventoryItem;
  accent?: InventoryItem;
  complement?: InventoryItem;
  extra?: InventoryItem;
}

interface ColorData {
  itemId: string;
  dominantColor: { r: number; g: number; b: number };
  secondaryColor: { r: number; g: number; b: number };
  brightness: number;
  saturation: number;
}

// Clear item categories - exactly one item per slot
const COMBINATION_CATEGORIES = {
  PRIMARY: ['Tops', 'Knitwear'],
  SECONDARY: ['Bottoms', 'Denim'],
  ACCENT: ['Footwear'], // Includes shoes, socks, etc.
  COMPLEMENT: ['Outerwear'],
  EXTRA: ['Accessories', 'Jewelry', 'Bags']
} as const;

export function OutfitRemix({ items }: OutfitRemixProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentOutfit, setCurrentOutfit] = useState<ItemCombination | null>(null);
  const [previousOutfit, setPreviousOutfit] = useState<ItemCombination | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [colorAnalysisComplete, setColorAnalysisComplete] = useState(false);
  const [itemColors, setItemColors] = useState<Map<string, ColorData>>(new Map());

  // Color extraction utility functions
  const extractColorsFromImage = async (imageUrl: string): Promise<{ dominant: { r: number; g: number; b: number }; secondary: { r: number; g: number; b: number }; brightness: number; saturation: number } | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            resolve(null);
            return;
          }

          // Resize for performance while maintaining aspect ratio
          const maxSize = 100;
          const scale = Math.min(maxSize / img.width, maxSize / img.height);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          // Color frequency map with higher precision for better color differentiation
          const colorCounts = new Map<string, { count: number; r: number; g: number; b: number; saturation: number; brightness: number }>();
          let totalBrightness = 0;
          let totalSaturation = 0;
          let pixelCount = 0;

          // Helper function to calculate color distance
          const getColorDistance = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number => {
            // Use weighted Euclidean distance that accounts for human perception
            const deltaR = r1 - r2;
            const deltaG = g1 - g2;
            const deltaB = b1 - b2;
            return Math.sqrt(2 * deltaR * deltaR + 4 * deltaG * deltaG + 3 * deltaB * deltaB);
          };

          // Helper function to convert RGB to HSV for better color analysis
          const rgbToHsv = (r: number, g: number, b: number): { h: number; s: number; v: number } => {
            r /= 255;
            g /= 255;
            b /= 255;

            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const delta = max - min;

            let h = 0;
            let s = 0;
            const v = max;

            if (delta !== 0) {
              s = delta / max;
              switch (max) {
                case r: h = ((g - b) / delta) % 6; break;
                case g: h = (b - r) / delta + 2; break;
                case b: h = (r - g) / delta + 4; break;
              }
              h *= 60;
              if (h < 0) h += 360;
            }

            return { h, s: s * 100, v: v * 100 };
          };

          // Sample every 4th pixel for performance, but with better color analysis
          for (let i = 0; i < data.length; i += 16) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            // Skip transparent pixels
            if (a < 128) continue;

            // Calculate brightness and saturation for this pixel
            const brightness = (r + g + b) / 3;
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const saturation = max === 0 ? 0 : (max - min) / max * 100;

            totalBrightness += brightness;
            totalSaturation += saturation;
            pixelCount++;

            // Use slightly higher precision for grouping to catch more color variation
            const groupedR = Math.floor(r / 12) * 12;
            const groupedG = Math.floor(g / 12) * 12;
            const groupedB = Math.floor(b / 12) * 12;
            const colorKey = `${groupedR}-${groupedG}-${groupedB}`;

            if (colorCounts.has(colorKey)) {
              colorCounts.get(colorKey)!.count++;
            } else {
              colorCounts.set(colorKey, { 
                count: 1, 
                r: groupedR, 
                g: groupedG, 
                b: groupedB,
                saturation,
                brightness
              });
            }
          }

          if (pixelCount === 0) {
            resolve(null);
            return;
          }

          // Sort colors by frequency first
          const sortedColors = Array.from(colorCounts.values())
            .sort((a, b) => b.count - a.count);

          if (sortedColors.length === 0) {
            resolve(null);
            return;
          }

          const dominant = sortedColors[0] || { r: 128, g: 128, b: 128 };

          // Find the best contrasting secondary color
          let bestSecondary = dominant; // fallback
          let bestSecondaryScore = 0;

          // Look through colors for the best contrasting secondary color
          for (let i = 1; i < Math.min(sortedColors.length, 10); i++) {
            const candidate = sortedColors[i];
            
            // Calculate color distance from dominant color
            const colorDistance = getColorDistance(
              dominant.r, dominant.g, dominant.b,
              candidate.r, candidate.g, candidate.b
            );

            // Skip if colors are too similar (distance threshold)
            if (colorDistance < 80) continue;

            // Convert to HSV for better color analysis
            const dominantHsv = rgbToHsv(dominant.r, dominant.g, dominant.b);
            const candidateHsv = rgbToHsv(candidate.r, candidate.g, candidate.b);

            // Calculate hue difference
            let hueDifference = Math.abs(dominantHsv.h - candidateHsv.h);
            if (hueDifference > 180) hueDifference = 360 - hueDifference;

            // Score this candidate based on:
            // 1. Color distance (more different = better)
            // 2. Hue difference (different hues = better)  
            // 3. Saturation (more saturated = more noticeable)
            // 4. Frequency (still needs to be reasonably common)
            
            let candidateScore = 0;
            
            // Color distance score (0-100)
            candidateScore += Math.min(colorDistance / 2, 100);
            
            // Hue difference score (0-50) - reward different hues
            candidateScore += Math.min(hueDifference, 50);
            
            // Saturation bonus (0-30) - prefer more saturated colors for contrast
            candidateScore += Math.min(candidate.saturation * 0.6, 30);
            
            // Frequency score (0-20) - still needs to be somewhat common
            const frequencyRatio = candidate.count / dominant.count;
            candidateScore += Math.min(frequencyRatio * 100, 20);

            // Brightness contrast bonus (0-20)
            const brightnessContrast = Math.abs(dominant.brightness - candidate.brightness);
            candidateScore += Math.min(brightnessContrast / 5, 20);

            // Additional bonus for highly saturated colors (like red stripes)
            if (candidate.saturation > 60) {
              candidateScore += 25;
            }

            // Additional bonus for complementary colors
            if (hueDifference > 150 && hueDifference < 210) {
              candidateScore += 30;
            }

            console.log(`Color candidate ${i}: RGB(${candidate.r},${candidate.g},${candidate.b}) - Score: ${candidateScore.toFixed(1)}, Distance: ${colorDistance.toFixed(1)}, Hue diff: ${hueDifference.toFixed(1)}, Sat: ${candidate.saturation.toFixed(1)}`);

            if (candidateScore > bestSecondaryScore) {
              bestSecondaryScore = candidateScore;
              bestSecondary = candidate;
            }
          }

          // If we still don't have a good secondary color, try to find any reasonably different color
          if (bestSecondaryScore < 50 && sortedColors.length > 1) {
            console.log('No high-scoring secondary color found, looking for any contrasting color...');
            
            for (let i = 1; i < sortedColors.length; i++) {
              const candidate = sortedColors[i];
              const colorDistance = getColorDistance(
                dominant.r, dominant.g, dominant.b,
                candidate.r, candidate.g, candidate.b
              );
              
              // Lower threshold for fallback
              if (colorDistance > 50) {
                bestSecondary = candidate;
                console.log(`Fallback secondary color: RGB(${candidate.r},${candidate.g},${candidate.b}) - Distance: ${colorDistance.toFixed(1)}`);
                break;
              }
            }
          }

          console.log(`Final colors - Dominant: RGB(${dominant.r},${dominant.g},${dominant.b}), Secondary: RGB(${bestSecondary.r},${bestSecondary.g},${bestSecondary.b}), Score: ${bestSecondaryScore.toFixed(1)}`);

          resolve({
            dominant: { r: dominant.r, g: dominant.g, b: dominant.b },
            secondary: { r: bestSecondary.r, g: bestSecondary.g, b: bestSecondary.b },
            brightness: totalBrightness / pixelCount,
            saturation: totalSaturation / pixelCount
          });
        } catch (error) {
          console.warn('Color extraction failed for image:', imageUrl, error);
          resolve(null);
        }
      };

      img.onerror = () => {
        console.warn('Failed to load image for color analysis:', imageUrl);
        resolve(null);
      };

      img.src = imageUrl;
    });
  };

  // Color theory functions
  const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  };

  const getColorHarmonyScore = (color1: { r: number; g: number; b: number }, color2: { r: number; g: number; b: number }): number => {
    const hsl1 = rgbToHsl(color1.r, color1.g, color1.b);
    const hsl2 = rgbToHsl(color2.r, color2.g, color2.b);

    // Calculate hue difference
    let hueDiff = Math.abs(hsl1.h - hsl2.h);
    if (hueDiff > 180) hueDiff = 360 - hueDiff;

    // Complementary colors (opposite on color wheel) score highest
    const complementaryScore = hueDiff > 150 && hueDiff < 210 ? 100 : 0;
    
    // Analogous colors (adjacent on color wheel) score well
    const analogousScore = hueDiff < 30 ? 80 : 0;
    
    // Triadic colors (120 degrees apart) score moderately
    const triadicScore = (hueDiff > 110 && hueDiff < 130) ? 70 : 0;
    
    // Split-complementary (150 degrees) score moderately
    const splitComplScore = (hueDiff > 140 && hueDiff < 160) || (hueDiff > 200 && hueDiff < 220) ? 65 : 0;

    // Monochromatic (same hue, different saturation/lightness) scores well for basics
    const monochromaticScore = hueDiff < 15 && Math.abs(hsl1.s - hsl2.s) > 20 ? 60 : 0;

    // Neutral colors (low saturation) work with everything
    const neutralScore = (hsl1.s < 20 || hsl2.s < 20) ? 50 : 0;

    return Math.max(complementaryScore, analogousScore, triadicScore, splitComplScore, monochromaticScore, neutralScore);
  };

  // Enhanced multi-color harmony analysis
  const getMultiColorHarmonyScore = (item1Colors: ColorData, item2Colors: ColorData): number => {
    // Calculate all possible color combinations between the two items
    const scores = [
      // Primary color relationships
      getColorHarmonyScore(item1Colors.dominantColor, item2Colors.dominantColor),
      getColorHarmonyScore(item1Colors.secondaryColor, item2Colors.secondaryColor),
      
      // Cross-color relationships (these often create interesting accent combinations)
      getColorHarmonyScore(item1Colors.dominantColor, item2Colors.secondaryColor),
      getColorHarmonyScore(item1Colors.secondaryColor, item2Colors.dominantColor)
    ];

    // Weight the scores: dominant-dominant gets highest weight, then secondary-secondary, then cross combinations
    const weightedScore = (
      scores[0] * 0.4 +  // dominant-dominant (most important)
      scores[1] * 0.3 +  // secondary-secondary 
      scores[2] * 0.2 +  // dominant-secondary cross
      scores[3] * 0.1    // secondary-dominant cross
    );

    // Bonus for complementary brightness levels (light + dark works well)
    const brightnessContrast = Math.abs(item1Colors.brightness - item2Colors.brightness);
    const brightnessBonus = brightnessContrast > 60 ? 15 : 0;

    // Bonus for balanced saturation (one saturated, one muted can work well)
    const saturationDiff = Math.abs(item1Colors.saturation - item2Colors.saturation);
    const saturationBonus = saturationDiff > 30 && saturationDiff < 70 ? 10 : 0;

    // Penalty for clashing bright saturated colors
    const clashPenalty = (
      item1Colors.saturation > 60 && 
      item2Colors.saturation > 60 && 
      item1Colors.brightness > 120 && 
      item2Colors.brightness > 120 &&
      Math.max(...scores) < 50
    ) ? -20 : 0;

    return Math.max(0, weightedScore + brightnessBonus + saturationBonus + clashPenalty);
  };

  // Enhanced color compatibility analysis for more nuanced matching
  const analyzeColorCompatibility = (baseItem: ColorData, candidateItems: InventoryItem[]): Array<{item: InventoryItem, score: number, reasoning: string}> => {
    const scoredItems = candidateItems
      .filter(item => itemColors.has(item.id))
      .map(item => {
        const candidateColors = itemColors.get(item.id)!;
        const harmonyScore = getMultiColorHarmonyScore(baseItem, candidateColors);
        
        // Additional contextual scoring
        let contextScore = 0;
        let reasoning = '';

        // Neutral items get a base compatibility score
        if (candidateColors.saturation < 25) {
          contextScore += 20;
          reasoning += 'neutral base; ';
        }

        // Earth tones work well together
        const baseHsl = rgbToHsl(baseItem.dominantColor.r, baseItem.dominantColor.g, baseItem.dominantColor.b);
        const candidateHsl = rgbToHsl(candidateColors.dominantColor.r, candidateColors.dominantColor.g, candidateColors.dominantColor.b);
        
        const isEarthTone = (hsl: {h: number, s: number, l: number}) => {
          return (hsl.h >= 15 && hsl.h <= 45) || (hsl.h >= 0 && hsl.h <= 15) || (hsl.h >= 345 && hsl.h <= 360);
        };

        if (isEarthTone(baseHsl) && isEarthTone(candidateHsl)) {
          contextScore += 15;
          reasoning += 'earth tones; ';
        }

        // Cool colors work well together
        const isCoolTone = (hsl: {h: number, s: number, l: number}) => {
          return hsl.h >= 180 && hsl.h <= 270;
        };

        if (isCoolTone(baseHsl) && isCoolTone(candidateHsl)) {
          contextScore += 12;
          reasoning += 'cool harmony; ';
        }

        // Warm colors work well together
        const isWarmTone = (hsl: {h: number, s: number, l: number}) => {
          return (hsl.h >= 0 && hsl.h <= 60) || (hsl.h >= 300 && hsl.h <= 360);
        };

        if (isWarmTone(baseHsl) && isWarmTone(candidateHsl)) {
          contextScore += 12;
          reasoning += 'warm harmony; ';
        }

        // Monochromatic but different intensities
        const hueDiff = Math.abs(baseHsl.h - candidateHsl.h);
        const normalizedHueDiff = hueDiff > 180 ? 360 - hueDiff : hueDiff;
        if (normalizedHueDiff < 20 && Math.abs(baseHsl.s - candidateHsl.s) > 20) {
          contextScore += 25;
          reasoning += 'monochromatic variation; ';
        }

        const totalScore = harmonyScore + contextScore;
        
        return {
          item,
          score: totalScore,
          reasoning: reasoning.trim()
        };
      });

    return scoredItems.sort((a, b) => b.score - a.score);
  };

  // Function to compare if two outfits are the same
  const outfitsAreEqual = (outfit1: ItemCombination | null, outfit2: ItemCombination | null): boolean => {
    if (!outfit1 || !outfit2) return false;
    
    return (
      outfit1.primary?.id === outfit2.primary?.id &&
      outfit1.secondary?.id === outfit2.secondary?.id &&
      outfit1.accent?.id === outfit2.accent?.id &&
      outfit1.complement?.id === outfit2.complement?.id &&
      outfit1.extra?.id === outfit2.extra?.id
    );
  };

  // Intuitive outfit generation - exactly one item per category
  const generateUniqueOutfit = async (): Promise<ItemCombination> => {
    console.log('🎨 Generating new outfit...');
    
    // Categorize items clearly - exactly one from each category
    const primary = items.filter(item => 
      COMBINATION_CATEGORIES.PRIMARY.includes(item.category)
    );
    const secondary = items.filter(item => 
      COMBINATION_CATEGORIES.SECONDARY.includes(item.category)
    );
    const accent = items.filter(item => 
      COMBINATION_CATEGORIES.ACCENT.includes(item.category)
    );
    const complement = items.filter(item => 
      COMBINATION_CATEGORIES.COMPLEMENT.includes(item.category)
    );
    const extra = items.filter(item => 
      COMBINATION_CATEGORIES.EXTRA.includes(item.category)
    );

    console.log(`📊 Available items: ${primary.length} primary, ${secondary.length} secondary, ${accent.length} accent, ${complement.length} complement, ${extra.length} extra`);

    let attempts = 0;
    const maxAttempts = 20;

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`🔄 Outfit generation attempt ${attempts}/${maxAttempts}`);

      // Initialize outfit with exactly one slot per category
      const outfit: ItemCombination = {};

      // STEP 1: Select ONE primary (required for outfit)
      if (primary.length > 0) {
        let availablePrimary = primary;
        // Avoid previous primary if possible
        if (previousOutfit?.primary && primary.length > 1) {
          availablePrimary = primary.filter(p => p.id !== previousOutfit.primary!.id);
          if (availablePrimary.length === 0) availablePrimary = primary;
        }
        outfit.primary = availablePrimary[Math.floor(Math.random() * availablePrimary.length)];
        console.log(`👕 Selected primary: ${outfit.primary.title}`);
      }

      // STEP 2: Select ONE secondary (required for outfit)
      if (secondary.length > 0) {
        let availableSecondary = secondary;
        // Avoid previous secondary if possible
        if (previousOutfit?.secondary && secondary.length > 1) {
          availableSecondary = secondary.filter(s => s.id !== previousOutfit.secondary!.id);
          if (availableSecondary.length === 0) availableSecondary = secondary;
        }

        // Use color coordination if primary has color data
        if (outfit.primary && itemColors.has(outfit.primary.id)) {
          const primaryColor = itemColors.get(outfit.primary.id)!;
          const secondaryMatches = analyzeColorCompatibility(primaryColor, availableSecondary);
          if (secondaryMatches.length > 0) {
            const randomIndex = Math.floor(Math.random() * Math.min(3, secondaryMatches.length));
            outfit.secondary = secondaryMatches[randomIndex].item;
            console.log(`👖 Selected secondary: ${outfit.secondary.title} (color score: ${secondaryMatches[randomIndex].score.toFixed(1)})`);
          } else {
            outfit.secondary = availableSecondary[0];
            console.log(`👖 Selected secondary: ${outfit.secondary.title} (fallback)`);
          }
        } else {
          outfit.secondary = availableSecondary[Math.floor(Math.random() * availableSecondary.length)];
          console.log(`👖 Selected secondary: ${outfit.secondary.title} (random)`);
        }
      }

      // STEP 3: Select ONE accent item (shoes, socks, etc.)
      if (accent.length > 0) {
        let availableAccent = accent;
        // Avoid previous accent if possible
        if (previousOutfit?.accent && accent.length > 1) {
          availableAccent = accent.filter(a => a.id !== previousOutfit.accent!.id);
          if (availableAccent.length === 0) availableAccent = accent;
        }

        // Use color coordination if we have other pieces with color data
        if (outfit.primary && itemColors.has(outfit.primary.id)) {
          const primaryColor = itemColors.get(outfit.primary.id)!;
          const accentScores = availableAccent
            .filter(a => itemColors.has(a.id))
            .map(a => {
              const accentColors = itemColors.get(a.id)!;
              const primaryScore = getMultiColorHarmonyScore(primaryColor, accentColors);
              
              let secondaryScore = 0;
              if (outfit.secondary && itemColors.has(outfit.secondary.id)) {
                const secondaryColors = itemColors.get(outfit.secondary.id)!;
                secondaryScore = getMultiColorHarmonyScore(secondaryColors, accentColors);
              }
              
              return { 
                a, 
                score: outfit.secondary ? (primaryScore * 0.6 + secondaryScore * 0.4) : primaryScore 
              };
            })
            .sort((a, b) => b.score - a.score);

          if (accentScores.length > 0) {
            const randomIndex = Math.floor(Math.random() * Math.min(2, accentScores.length));
            outfit.accent = accentScores[randomIndex].a;
            console.log(`👟 Selected accent: ${outfit.accent.title} (color score: ${accentScores[randomIndex].score.toFixed(1)})`);
          } else {
            outfit.accent = availableAccent[0];
            console.log(`👟 Selected accent: ${outfit.accent.title} (fallback)`);
          }
        } else {
          outfit.accent = availableAccent[Math.floor(Math.random() * availableAccent.length)];
          console.log(`👟 Selected accent: ${outfit.accent.title} (random)`);
        }
      }

      // STEP 4: Optionally select ONE complement (not always needed)
      const includeComplement = complement.length > 0 && Math.random() > 0.6; // 40% chance
      if (includeComplement) {
        let availableComplement = complement;
        // Avoid previous complement if possible
        if (previousOutfit?.complement && complement.length > 1) {
          availableComplement = complement.filter(c => c.id !== previousOutfit.complement!.id);
          if (availableComplement.length === 0) availableComplement = complement;
        }

        // Complement should complement the outfit
        if (outfit.primary && itemColors.has(outfit.primary.id)) {
          const primaryColor = itemColors.get(outfit.primary.id)!;
          const complementScores = availableComplement
            .filter(c => itemColors.has(c.id))
            .map(c => {
              const complementColors = itemColors.get(c.id)!;
              const primaryScore = getMultiColorHarmonyScore(primaryColor, complementColors);
              
              let secondaryScore = 0;
              if (outfit.secondary && itemColors.has(outfit.secondary.id)) {
                const secondaryColors = itemColors.get(outfit.secondary.id)!;
                secondaryScore = getMultiColorHarmonyScore(secondaryColors, complementColors);
              }
              
              // Bonus for neutral complement
              const neutralBonus = complementColors.saturation < 25 ? 40 : 0;
              const sophisticatedBonus = (complementColors.brightness < 80 && complementColors.saturation < 40) ? 25 : 0;
              
              const totalScore = outfit.secondary 
                ? (primaryScore * 0.4 + secondaryScore * 0.3) + neutralBonus + sophisticatedBonus
                : primaryScore + neutralBonus + sophisticatedBonus;
              
              return { c, score: totalScore };
            })
            .sort((a, b) => b.score - a.score);

          if (complementScores.length > 0) {
            outfit.complement = complementScores[0].c;
            console.log(`🧥 Selected complement: ${outfit.complement.title} (color score: ${complementScores[0].score.toFixed(1)})`);
          } else {
            outfit.complement = availableComplement[0];
            console.log(`🧥 Selected complement: ${outfit.complement.title} (fallback)`);
          }
        } else {
          outfit.complement = availableComplement[Math.floor(Math.random() * availableComplement.length)];
          console.log(`🧥 Selected complement: ${outfit.complement.title} (random)`);
        }
      }

      // STEP 5: Optionally select ONE extra (not always needed)
      const includeExtra = extra.length > 0 && Math.random() > 0.5; // 50% chance
      if (includeExtra) {
        let availableExtra = extra;
        // Avoid previous extra if possible
        if (previousOutfit?.extra && extra.length > 1) {
          availableExtra = extra.filter(e => e.id !== previousOutfit.extra!.id);
          if (availableExtra.length === 0) availableExtra = extra;
        }

        // Extras can be statement pieces or neutral
        if (outfit.primary && itemColors.has(outfit.primary.id)) {
          const primaryColor = itemColors.get(outfit.primary.id)!;
          const extraScores = availableExtra
            .filter(e => itemColors.has(e.id))
            .map(e => {
              const extraColors = itemColors.get(e.id)!;
              const primaryScore = getMultiColorHarmonyScore(primaryColor, extraColors);
              
              // Bonus for accent pieces
              const accentBonus = (
                extraColors.saturation > 50 && 
                Math.abs(primaryColor.brightness - extraColors.brightness) > 50
              ) ? 20 : 0;
              
              // Bonus for neutral extras
              const neutralBonus = extraColors.saturation < 30 ? 15 : 0;
              
              let outfitHarmonyScore = primaryScore;
              if (outfit.secondary && itemColors.has(outfit.secondary.id)) {
                const secondaryColors = itemColors.get(outfit.secondary.id)!;
                outfitHarmonyScore = (primaryScore + getMultiColorHarmonyScore(secondaryColors, extraColors)) / 2;
              }
              
              return { 
                e, 
                score: outfitHarmonyScore + accentBonus + neutralBonus 
              };
            })
            .sort((a, b) => b.score - a.score);

          if (extraScores.length > 0) {
            const randomIndex = Math.floor(Math.random() * Math.min(3, extraScores.length));
            outfit.extra = extraScores[randomIndex].e;
            console.log(`💍 Selected extra: ${outfit.extra.title} (color score: ${extraScores[randomIndex].score.toFixed(1)})`);
          } else {
            outfit.extra = availableExtra[0];
            console.log(`💍 Selected extra: ${outfit.extra.title} (fallback)`);
          }
        } else {
          outfit.extra = availableExtra[Math.floor(Math.random() * availableExtra.length)];
          console.log(`💍 Selected extra: ${outfit.extra.title} (random)`);
        }
      }

      // Validate outfit has at least primary + secondary (minimum viable outfit)
      if (!outfit.primary || !outfit.secondary) {
        console.log('⚠️ Incomplete outfit (missing primary or secondary), retrying...');
        continue;
      }

      // Check if this outfit is different from the previous one
      if (!outfitsAreEqual(outfit, previousOutfit)) {
        console.log('✅ Generated unique outfit successfully!');
        const pieceCount = Object.values(outfit).filter(Boolean).length;
        console.log(`👔 Final outfit has ${pieceCount} pieces: ${Object.keys(outfit).filter(key => outfit[key as keyof ItemCombination]).join(', ')}`);
        return outfit;
      }

      console.log('🔁 Generated outfit is same as previous, retrying...');

      // On later attempts, accept partial differences
      if (attempts >= maxAttempts - 5) {
        const hasKeyDifference = 
          outfit.primary?.id !== previousOutfit?.primary?.id ||
          outfit.secondary?.id !== previousOutfit?.secondary?.id ||
          outfit.accent?.id !== previousOutfit?.accent?.id ||
          outfit.complement?.id !== previousOutfit?.complement?.id ||
          outfit.extra?.id !== previousOutfit?.extra?.id;
        
        if (hasKeyDifference) {
          console.log('✅ Generated partially unique outfit (acceptable)');
          return outfit;
        }
      }
    }

    // Fallback: Basic outfit with available items
    console.log('⚠️ Max attempts reached, generating basic outfit');
    const basicOutfit: ItemCombination = {};
    
    if (primary.length > 0) {
      basicOutfit.primary = primary[Math.floor(Math.random() * primary.length)];
      console.log(`👕 Fallback primary: ${basicOutfit.primary.title}`);
    }
    if (secondary.length > 0) {
      basicOutfit.secondary = secondary[Math.floor(Math.random() * secondary.length)];
      console.log(`👖 Fallback secondary: ${basicOutfit.secondary.title}`);
    }
    if (accent.length > 0) {
      basicOutfit.accent = accent[Math.floor(Math.random() * accent.length)];
      console.log(`👟 Fallback accent: ${basicOutfit.accent.title}`);
    }
    if (complement.length > 0) {
      basicOutfit.complement = complement[Math.floor(Math.random() * complement.length)];
      console.log(`🧥 Fallback complement: ${basicOutfit.complement.title}`);
    }
    if (extra.length > 0) {
      basicOutfit.extra = extra[Math.floor(Math.random() * extra.length)];
      console.log(`💍 Fallback extra: ${basicOutfit.extra.title}`);
    }

    return basicOutfit;
  };

  const analyzeItemColors = async () => {
    const colorData = new Map<string, ColorData>();
    
    for (const item of items) {
      const colors = await extractColorsFromImage(item.image);
      if (colors) {
        colorData.set(item.id, {
          itemId: item.id,
          dominantColor: colors.dominant,
          secondaryColor: colors.secondary,
          brightness: colors.brightness,
          saturation: colors.saturation
        });
      }
    }
    
    setItemColors(colorData);
    setColorAnalysisComplete(true);
  };

  const generateColorCoordinatedOutfit = async () => {
    setIsGenerating(true);
    
    // Analyze colors if not done yet
    if (!colorAnalysisComplete) {
      await analyzeItemColors();
    }
    
    // Add a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Generate a unique outfit
    const newOutfit = await generateUniqueOutfit();
    
    // Store previous outfit before setting new one
    setPreviousOutfit(currentOutfit);
    setCurrentOutfit(newOutfit);
    setIsGenerating(false);
  };

  const handleOpenRemix = () => {
    setIsOpen(true);
    generateColorCoordinatedOutfit();
  };

  const outfitItems = currentOutfit ? Object.values(currentOutfit).filter(Boolean) : [];

  return (
    <>
      <Button
        onClick={handleOpenRemix}
        variant="outline"
        style={{ 
          borderColor: 'var(--theme-fg)',
          color: 'var(--theme-fg)',
          backgroundColor: 'transparent'
        }}
        className="transition-all duration-300"
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.borderColor = 'transparent';
          e.currentTarget.style.color = 'var(--theme-fg)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.borderColor = 'var(--theme-fg)';
          e.currentTarget.style.color = 'var(--theme-fg)';
        }}
        disabled={items.length < 2}
      >
        <Palette className="h-4 w-4 mr-2" />
        Smart Mix
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent 
          aria-describedby={undefined}
          style={{
            backgroundColor: 'var(--theme-bg)',
            borderColor: 'var(--theme-border)',
            color: 'var(--theme-fg)'
          }}
          className="sm:max-w-[700px] border transition-colors duration-300"
        >
          <DialogHeader>
            <DialogTitle 
              className="text-xl tracking-wide text-center transition-colors duration-300"
              style={{ color: 'var(--theme-fg)' }}
            >
              Color-Coordinated Selection
            </DialogTitle>
          </DialogHeader>
          
          {isGenerating ? (
            <div className="text-center py-12">
              <div className="flex items-center justify-center mb-4">
                <Palette 
                  className="h-6 w-6 mr-2 animate-pulse"
                  style={{ color: 'var(--theme-muted)' }}
                />
                <Sparkles 
                  className="h-8 w-8 animate-pulse"
                  style={{ color: 'var(--theme-muted)' }}
                />
              </div>
              <p style={{ color: 'var(--theme-muted)' }}>
                {colorAnalysisComplete ? 'Creating color harmony...' : 'Analyzing colors & curating your selection...'}
              </p>
            </div>
          ) : currentOutfit && outfitItems.length > 0 ? (
            <div className="space-y-8">
              {/* Selection Display */}
              <div className="text-center">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  {outfitItems.map((item) => {
                    const colorData = itemColors.get(item.id);
                    return (
                      <div key={item.id} className="text-center">
                        <div 
                          className="aspect-square mb-3 relative overflow-hidden rounded transition-colors duration-300"
                          style={{ backgroundColor: 'var(--theme-accent)' }}
                        >
                          <ImageWithFallback
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                          {/* Show both dominant and secondary color indicators if available */}
                          {colorData && (
                            <div className="absolute bottom-1 right-1 flex gap-1">
                              <div 
                                className="w-3 h-3 rounded-full border border-white shadow-sm"
                                style={{
                                  backgroundColor: `rgb(${colorData.dominantColor.r}, ${colorData.dominantColor.g}, ${colorData.dominantColor.b})`
                                }}
                                title="Dominant color"
                              />
                              <div 
                                className="w-3 h-3 rounded-full border border-white shadow-sm"
                                style={{
                                  backgroundColor: `rgb(${colorData.secondaryColor.r}, ${colorData.secondaryColor.g}, ${colorData.secondaryColor.b})`
                                }}
                                title="Secondary color"
                              />
                            </div>
                          )}
                        </div>
                        <h4 
                          className="text-xs font-medium tracking-wide mb-1 transition-colors duration-300"
                          style={{ color: 'var(--theme-fg)' }}
                        >
                          {item.title}
                        </h4>
                        <p 
                          className="text-xs uppercase tracking-wide transition-colors duration-300"
                          style={{ color: 'var(--theme-muted)' }}
                        >
                          {item.category}
                        </p>
                      </div>
                    );
                  })}
                </div>
                
                {colorAnalysisComplete && (
                  <p 
                    className="text-xs mt-4 opacity-75"
                    style={{ color: 'var(--theme-muted)' }}
                  >
                    ✨ This selection was curated using color harmony principles
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div 
                className="flex justify-center gap-3 pt-4 border-t transition-colors duration-300"
                style={{ borderColor: 'var(--theme-border)' }}
              >
                <Button
                  variant="outline"
                  onClick={generateColorCoordinatedOutfit}
                  style={{
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-fg)',
                    backgroundColor: 'transparent'
                  }}
                  className="hover:opacity-80 transition-opacity"
                  disabled={isGenerating}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                  New Mix
                </Button>
                <Button
                  onClick={() => setIsOpen(false)}
                  style={{
                    backgroundColor: 'var(--theme-fg)',
                    color: 'var(--theme-bg)'
                  }}
                  className="hover:opacity-90 transition-opacity"
                >
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Shuffle 
                className="h-12 w-12 mx-auto mb-4"
                style={{ color: 'var(--theme-muted)' }}
              />
              <p style={{ color: 'var(--theme-muted)' }}>Not enough items to create a combination.</p>
              <p 
                className="text-xs mt-2"
                style={{ color: 'var(--theme-muted)' }}
              >
                Add more items to your collection to get suggestions.
              </p>
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                style={{
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-fg)',
                  backgroundColor: 'transparent'
                }}
                className="mt-4 hover:opacity-80 transition-opacity"
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}