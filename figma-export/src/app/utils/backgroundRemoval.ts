// Simple client-side background removal using Canvas API
// This uses basic image processing techniques without external dependencies

// Create a singleton canvas for processing
let processingCanvas: HTMLCanvasElement | null = null;
let processingCtx: CanvasRenderingContext2D | null = null;

// Initialize processing canvas
const getProcessingCanvas = () => {
  if (!processingCanvas) {
    processingCanvas = document.createElement('canvas');
    processingCtx = processingCanvas.getContext('2d');
  }
  return { canvas: processingCanvas, ctx: processingCtx };
};

// Check if an image URL supports CORS
const testImageCORS = async (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    const timeout = setTimeout(() => {
      console.warn('🔍 CORS test timeout for:', url);
      resolve(false);
    }, 5000); // 5 second timeout
    
    img.onload = () => {
      clearTimeout(timeout);
      console.log('✅ CORS test passed for:', url.substring(0, 50) + '...');
      resolve(true);
    };
    
    img.onerror = (error) => {
      clearTimeout(timeout);
      console.warn('❌ CORS test failed for:', url.substring(0, 50) + '...', error);
      resolve(false);
    };
    
    img.src = url;
  });
};

// Validate image URL
const isValidImageUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    
    console.log('🔍 Validating URL:', url);
    console.log('📋 Parsed URL details:', {
      hostname: parsedUrl.hostname,
      pathname: parsedUrl.pathname,
      searchParams: Object.fromEntries(parsedUrl.searchParams.entries())
    });
    
    // Check for common image extensions in the pathname
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg'];
    const hasImageExtension = imageExtensions.some(ext => 
      parsedUrl.pathname.toLowerCase().includes(ext)
    );
    
    // Check for known image hosting domains
    const knownImageHosts = [
      'unsplash.com', 
      'images.unsplash.com',
      'imgur.com', 
      'i.imgur.com',
      'cloudinary.com', 
      'res.cloudinary.com',
      'githubusercontent.com',
      'raw.githubusercontent.com',
      'picsum.photos',
      'via.placeholder.com',
      'placehold.co',
      'dummyimage.com',
      'loremflickr.com'
    ];
    const isKnownHost = knownImageHosts.some(host => 
      parsedUrl.hostname === host || parsedUrl.hostname.endsWith('.' + host)
    );
    
    // Check for image-related query parameters
    const imageParams = ['w', 'h', 'width', 'height', 'fit', 'crop', 'format', 'auto', 'q', 'quality'];
    const hasImageParams = imageParams.some(param => 
      parsedUrl.searchParams.has(param)
    );
    
    // Check if the pathname suggests it's an image (common patterns)
    const imagePatterns = [
      /\/photo-/i,        // Unsplash photos
      /\/image/i,         // Generic image paths
      /\/img/i,           // Generic img paths
      /\/pictures?/i,     // Picture/pictures paths
      /\/media/i,         // Media paths
      /\/assets/i,        // Assets paths
      /\/uploads/i        // Upload paths
    ];
    const hasImagePattern = imagePatterns.some(pattern => 
      pattern.test(parsedUrl.pathname)
    );
    
    // Accept if any of these conditions are met
    const isValid = hasImageExtension || isKnownHost || hasImageParams || hasImagePattern;
    
    console.log('🔍 URL validation results:', {
      hasImageExtension,
      isKnownHost: isKnownHost,
      matchingHost: knownImageHosts.find(host => parsedUrl.hostname === host || parsedUrl.hostname.endsWith('.' + host)),
      hasImageParams,
      matchingParams: imageParams.filter(param => parsedUrl.searchParams.has(param)),
      hasImagePattern,
      matchingPattern: imagePatterns.find(pattern => pattern.test(parsedUrl.pathname)),
      isValid
    });
    
    return isValid;
    
  } catch (error) {
    console.warn('❌ URL parsing failed:', error);
    return false;
  }
};

// Convert URL image to data URL to avoid CORS issues
const urlToDataUrl = async (url: string): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    console.log('🔄 Converting URL to data URL:', url.substring(0, 50) + '...');
    
    try {
      // Create a temporary canvas to convert the image
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      
      if (!tempCtx) {
        throw new Error('Could not get canvas context for URL conversion');
      }
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      const timeout = setTimeout(() => {
        reject(new Error('URL to data URL conversion timeout'));
      }, 15000); // 15 second timeout
      
      img.onload = () => {
        clearTimeout(timeout);
        try {
          console.log('📐 Image loaded for conversion. Dimensions:', img.width, 'x', img.height);
          
          // Set canvas dimensions to match image
          tempCanvas.width = img.width;
          tempCanvas.height = img.height;
          
          // Draw image to canvas
          tempCtx.drawImage(img, 0, 0);
          
          // Convert to data URL
          const dataUrl = tempCanvas.toDataURL('image/png');
          console.log('✅ URL converted to data URL successfully');
          resolve(dataUrl);
          
        } catch (canvasError) {
          console.error('❌ Canvas error during URL conversion:', canvasError);
          reject(new Error('Failed to convert image to data URL - likely due to CORS restrictions'));
        }
      };
      
      img.onerror = (error) => {
        clearTimeout(timeout);
        console.error('❌ Image load error during URL conversion:', error);
        reject(new Error('Failed to load image from URL'));
      };
      
      img.src = url;
      
    } catch (error) {
      console.error('❌ Error in URL to data URL conversion:', error);
      reject(error);
    }
  });
};

// Enhanced background removal using edge detection and color thresholding
export const removeBackground = async (imageSource: string | HTMLImageElement | HTMLCanvasElement): Promise<string> => {
  try {
    console.log('🔄 Starting background removal process...');
    
    const { canvas, ctx } = getProcessingCanvas();
    
    if (!ctx) {
      throw new Error('Canvas context not available - your browser may not support this feature');
    }

    // Load the image if it's a string (data URL or URL)
    let image: HTMLImageElement;
    let actualImageSource = imageSource;
    
    if (typeof imageSource === 'string') {
      console.log('📥 Processing image source:', imageSource.substring(0, 50) + '...');
      
      // Check if it's a URL that needs validation and conversion
      if (imageSource.startsWith('http')) {
        console.log('🌐 Detected HTTP URL, validating...');
        
        // Validate the URL first
        if (!isValidImageUrl(imageSource)) {
          throw new Error('Invalid image URL - please use a direct link to an image file');
        }
        
        // Test CORS support
        console.log('🔍 Testing CORS support...');
        const supportsCORS = await testImageCORS(imageSource);
        if (!supportsCORS) {
          throw new Error('This image cannot be processed due to cross-origin restrictions. Try using images from Unsplash or upload a file instead');
        }
        
        // Convert URL to data URL to avoid CORS issues in processing
        console.log('🔄 Converting URL to data URL to ensure processing compatibility...');
        try {
          actualImageSource = await urlToDataUrl(imageSource);
          console.log('✅ URL converted to data URL for safe processing');
        } catch (conversionError) {
          console.error('❌ URL conversion failed:', conversionError);
          throw new Error('Unable to process this image due to security restrictions. Try uploading the image file instead.');
        }
      } else if (imageSource.startsWith('data:')) {
        console.log('📄 Detected data URL, proceeding directly');
      } else {
        console.warn('⚠️ Unknown image source format:', imageSource.substring(0, 20) + '...');
      }
      
      // Now load the image (either original data URL or converted data URL)
      image = new Image();
      
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Image loading timeout - please try again'));
        }, 10000); // 10 second timeout
        
        image.onload = () => {
          clearTimeout(timeout);
          console.log('✅ Image loaded successfully for processing');
          resolve();
        };
        
        image.onerror = (error) => {
          clearTimeout(timeout);
          console.error('❌ Image loading error:', error);
          reject(new Error('Failed to load image for processing'));
        };
        
        image.src = actualImageSource as string;
      });
      
    } else if (imageSource instanceof HTMLImageElement) {
      console.log('🖼️ Using provided HTMLImageElement');
      image = imageSource;
    } else {
      console.log('🎨 Converting canvas to image');
      // It's a canvas, convert to image
      image = new Image();
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Canvas conversion timeout'));
        }, 5000);
        
        image.onload = () => {
          clearTimeout(timeout);
          resolve();
        };
        
        image.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('Failed to convert canvas to image'));
        };
        
        image.src = imageSource.toDataURL();
      });
    }

    // Validate image dimensions
    const imgWidth = image.naturalWidth || image.width;
    const imgHeight = image.naturalHeight || image.height;
    
    console.log(`📐 Processing image dimensions: ${imgWidth}x${imgHeight}`);
    
    if (imgWidth === 0 || imgHeight === 0) {
      throw new Error('Invalid image dimensions - the image may be corrupted');
    }
    
    if (imgWidth > 4000 || imgHeight > 4000) {
      throw new Error('Image is too large - please use an image smaller than 4000x4000 pixels');
    }

    // Set canvas dimensions
    canvas.width = imgWidth;
    canvas.height = imgHeight;

    // Draw image to canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);

    // Get image data for processing
    let imageData;
    try {
      imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      console.log('✅ Image data extracted for processing');
    } catch (securityError) {
      console.error('❌ Security error getting image data:', securityError);
      throw new Error('Security error - the image cannot be processed due to cross-origin restrictions');
    }
    
    const data = imageData.data;

    // Enhanced background removal algorithm
    console.log('🎨 Processing image with enhanced algorithm...');
    const processedData = enhancedBackgroundRemoval(data, canvas.width, canvas.height);

    // Create new image data and put it back
    const processedImageData = new ImageData(processedData, canvas.width, canvas.height);
    ctx.putImageData(processedImageData, 0, 0);

    // Convert to data URL
    const result = canvas.toDataURL('image/png');
    console.log('✅ Background removal completed successfully');
    return result;

  } catch (error) {
    console.error('❌ Background removal error:', error);
    
    // Provide user-friendly error messages
    if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error('An unexpected error occurred during background removal');
    }
  }
};

// Enhanced background removal algorithm with better edge detection
const enhancedBackgroundRemoval = (data: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray => {
  const processedData = new Uint8ClampedArray(data);
  
  console.log('🔍 Analyzing image for background detection...');
  
  // Sample more points around the edges to determine background color
  const edgeSamples = [];
  const sampleCount = 20; // Number of samples per edge
  
  // Top edge
  for (let i = 0; i < sampleCount; i++) {
    const x = Math.floor((i / sampleCount) * width);
    const idx = x * 4;
    edgeSamples.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
  }
  
  // Bottom edge
  for (let i = 0; i < sampleCount; i++) {
    const x = Math.floor((i / sampleCount) * width);
    const idx = ((height - 1) * width + x) * 4;
    edgeSamples.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
  }
  
  // Left edge
  for (let i = 0; i < sampleCount; i++) {
    const y = Math.floor((i / sampleCount) * height);
    const idx = y * width * 4;
    edgeSamples.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
  }
  
  // Right edge
  for (let i = 0; i < sampleCount; i++) {
    const y = Math.floor((i / sampleCount) * height);
    const idx = (y * width + width - 1) * 4;
    edgeSamples.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
  }

  // Calculate median background color (more robust than average)
  const sortedR = edgeSamples.map(s => s.r).sort((a, b) => a - b);
  const sortedG = edgeSamples.map(s => s.g).sort((a, b) => a - b);
  const sortedB = edgeSamples.map(s => s.b).sort((a, b) => a - b);
  
  const medianIndex = Math.floor(edgeSamples.length / 2);
  const bgColor = {
    r: sortedR[medianIndex],
    g: sortedG[medianIndex],
    b: sortedB[medianIndex]
  };
  
  console.log(`🎨 Detected background color: RGB(${bgColor.r}, ${bgColor.g}, ${bgColor.b})`);

  // Multi-pass processing for better results
  let transparentPixels = 0;
  
  // Pass 1: Initial background removal
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Calculate color difference from background
    const colorDistance = Math.sqrt(
      Math.pow(r - bgColor.r, 2) +
      Math.pow(g - bgColor.g, 2) +
      Math.pow(b - bgColor.b, 2)
    );
    
    // Adaptive threshold based on image characteristics
    const baseThreshold = 40;
    const adaptiveThreshold = baseThreshold + (Math.max(bgColor.r, bgColor.g, bgColor.b) > 200 ? 20 : 0);
    
    if (colorDistance < adaptiveThreshold) {
      // This pixel is likely background - make it transparent
      processedData[i + 3] = 0;
      transparentPixels++;
    } else {
      // This pixel is likely foreground - apply smooth edge transition
      const edgeDistance = Math.min(colorDistance / adaptiveThreshold, 1);
      const alpha = Math.round(data[i + 3] * Math.pow(edgeDistance, 0.7)); // Smoother falloff
      processedData[i + 3] = Math.max(alpha, 0);
    }
  }
  
  // Pass 2: Edge refinement to reduce noise
  const refinedData = new Uint8ClampedArray(processedData);
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      
      // Skip if already transparent
      if (processedData[idx + 3] === 0) continue;
      
      // Check surrounding pixels
      let transparentNeighbors = 0;
      let totalNeighbors = 0;
      
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          
          const neighborIdx = ((y + dy) * width + (x + dx)) * 4;
          totalNeighbors++;
          
          if (processedData[neighborIdx + 3] === 0) {
            transparentNeighbors++;
          }
        }
      }
      
      // If mostly surrounded by transparent pixels, reduce opacity
      const transparentRatio = transparentNeighbors / totalNeighbors;
      if (transparentRatio > 0.6) {
        const currentAlpha = processedData[idx + 3];
        refinedData[idx + 3] = Math.round(currentAlpha * (1 - transparentRatio * 0.5));
      }
    }
  }
  
  const transparentPercentage = ((transparentPixels / (data.length / 4)) * 100).toFixed(1);
  console.log(`✨ Processed ${transparentPixels} pixels (${transparentPercentage}% of image made transparent)`);
  
  return refinedData;
};

// Check if background removal is supported
export const isBackgroundRemovalSupported = (): boolean => {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      console.log('❌ Background removal not supported: Not in browser environment');
      return false;
    }

    // Check for Canvas support
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    const supported = !!(context && canvas.toDataURL);
    console.log(supported ? '✅ Background removal supported' : '❌ Canvas API not supported');
    
    // Test URL validation with a sample Unsplash URL
    if (supported) {
      const testUrl = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop&q=80&auto=format';
      const isTestValid = isValidImageUrl(testUrl);
      console.log('🧪 URL validation test result for sample Unsplash URL:', isTestValid);
      
      if (!isTestValid) {
        console.warn('⚠️ URL validation failed for known good Unsplash URL - there may be an issue with the validation logic');
      }
    }
    
    return supported;
  } catch (error) {
    console.log('❌ Background removal not supported:', error);
    return false;
  }
};

// Preload function (simplified since we don't need to load external models)
export const preloadBackgroundRemovalModel = async (): Promise<boolean> => {
  try {
    if (!isBackgroundRemovalSupported()) {
      return false;
    }
    
    // Just test canvas functionality
    const { canvas, ctx } = getProcessingCanvas();
    if (!ctx) {
      return false;
    }
    
    // Set a small test size
    canvas.width = 1;
    canvas.height = 1;
    
    console.log('✅ Background removal model preloaded');
    return true;
  } catch (error) {
    console.warn('Failed to preload background removal:', error);
    return false;
  }
};