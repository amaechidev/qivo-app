// QR Code generation utility using a Canvas-based approach
export function generateQRCode(
  text: string,
  size: number = 200
): Promise<string> {
  return new Promise((resolve) => {
    // For production, you would use a proper QR code library like 'qrcode'
    // This is a simplified implementation for demonstration

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    canvas.width = size;
    canvas.height = size;

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);

    // Simple pattern that resembles a QR code
    ctx.fillStyle = "#000000";

    const moduleSize = size / 25; // 25x25 grid

    // Generate a deterministic pattern based on the text
    const hash = simpleHash(text);

    for (let i = 0; i < 25; i++) {
      for (let j = 0; j < 25; j++) {
        // Create a pattern based on position and hash
        const shouldFill =
          (i * j + hash) % 3 === 0 ||
          (i < 7 && j < 7) ||
          (i < 7 && j > 17) ||
          (i > 17 && j < 7);

        if (shouldFill) {
          ctx.fillRect(i * moduleSize, j * moduleSize, moduleSize, moduleSize);
        }
      }
    }

    // Add finder patterns (corners)
    drawFinderPattern(ctx, 0, 0, moduleSize);
    drawFinderPattern(ctx, 18 * moduleSize, 0, moduleSize);
    drawFinderPattern(ctx, 0, 18 * moduleSize, moduleSize);

    resolve(canvas.toDataURL("image/png"));
  });
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

function drawFinderPattern(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  moduleSize: number
) {
  // Outer square (7x7)
  ctx.fillRect(x, y, moduleSize * 7, moduleSize * 7);

  // Inner white square (5x5)
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x + moduleSize, y + moduleSize, moduleSize * 5, moduleSize * 5);

  // Center black square (3x3)
  ctx.fillStyle = "#000000";
  ctx.fillRect(
    x + moduleSize * 2,
    y + moduleSize * 2,
    moduleSize * 3,
    moduleSize * 3
  );
}
