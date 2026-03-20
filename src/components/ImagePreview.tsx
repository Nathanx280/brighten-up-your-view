import { useEffect, useRef } from "react";

interface ImagePreviewProps {
  imageData: ImageData | null;
  width: number;
  height: number;
  label: string;
}

const ImagePreview = ({ imageData, width, height, label }: ImagePreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !imageData) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    canvasRef.current.width = width;
    canvasRef.current.height = height;
    ctx.putImageData(imageData, 0, 0);
  }, [imageData, width, height]);

  return (
    <div className="glass rounded-lg p-4 space-y-2">
      <h3 className="text-foreground text-sm font-medium">{label}</h3>
      {imageData ? (
        <canvas
          ref={canvasRef}
          className="w-full max-h-[400px] object-contain mx-auto rounded"
          style={{ imageRendering: "pixelated" }}
        />
      ) : (
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          No preview available
        </div>
      )}
      {imageData && (
        <p className="text-muted-foreground text-xs text-center">
          {width} × {height} px
        </p>
      )}
    </div>
  );
};

export default ImagePreview;
