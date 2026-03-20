import { Upload, Zap, Download, Settings } from "lucide-react";
import { useRef, useState, useCallback, ChangeEvent, useEffect } from "react";
import { PAINTING_TARGETS, convertImageToPNT, downloadPNT } from "@/lib/pnt-converter";
import { ARK_PALETTE } from "@/lib/ark-palette";
import ColorPalette from "@/components/ColorPalette";
import ImagePreview from "@/components/ImagePreview";

const Index = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [sourceImageData, setSourceImageData] = useState<ImageData | null>(null);
  const [fileName, setFileName] = useState<string>("MyPainting");
  const [selectedTarget, setSelectedTarget] = useState(0);
  const [dithering, setDithering] = useState(true);
  const [enabledColors, setEnabledColors] = useState<Set<number>>(
    () => new Set(ARK_PALETTE.map((c) => c.index))
  );
  const [previewImageData, setPreviewImageData] = useState<ImageData | null>(null);
  const [pntData, setPntData] = useState<ArrayBuffer | null>(null);
  const [converting, setConverting] = useState(false);

  const target = PAINTING_TARGETS[selectedTarget];

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const baseName = file.name.replace(/\.[^.]+$/, "");
    setFileName(baseName);

    const img = new Image();
    img.onload = () => {
      setSourceImage(img);

      // Get image data
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      setSourceImageData(ctx.getImageData(0, 0, img.width, img.height));
    };
    img.src = URL.createObjectURL(file);
  }, []);

  // Auto-convert when settings change
  useEffect(() => {
    if (!sourceImageData) return;

    setConverting(true);
    // Use requestAnimationFrame so UI doesn't freeze
    const timeout = setTimeout(() => {
      const result = convertImageToPNT(
        sourceImageData,
        target.width,
        target.height,
        enabledColors,
        dithering
      );
      setPreviewImageData(result.previewImageData);
      setPntData(result.pntData);
      setConverting(false);
    }, 50);

    return () => clearTimeout(timeout);
  }, [sourceImageData, selectedTarget, enabledColors, dithering, target.width, target.height]);

  const handleDownload = () => {
    if (!pntData) return;
    const suffix = target.suffix;
    downloadPNT(pntData, `${fileName}${suffix}.pnt`);
  };

  const handleToggleColor = (index: number) => {
    setEnabledColors((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleEnableAll = () => {
    setEnabledColors(new Set(ARK_PALETTE.map((c) => c.index)));
  };

  const handleDisableAll = () => {
    setEnabledColors(new Set());
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 px-4 py-4">
        <div className="container max-w-6xl mx-auto flex items-center gap-3">
          <Zap className="w-8 h-8 text-primary fill-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              ARK <span className="text-primary">PNT</span> Converter
            </h1>
            <p className="text-muted-foreground text-sm">
              Convert images to ARK: Survival Evolved painting files
            </p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Upload Zone */}
        {!sourceImage && (
          <div className="w-full">
            <div className="relative glass rounded-lg p-8 text-center cursor-pointer transition-all duration-300 hover:border-primary/50">
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.bmp,.webp"
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                onChange={handleFileChange}
              />
              <div className="space-y-4 py-8">
                <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-foreground text-xl">Drop your image here</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    PNG, JPG, JPEG, BMP, WEBP supported
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Editor */}
        {sourceImage && (
          <>
            {/* Settings Bar */}
            <div className="glass rounded-lg p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground text-sm font-medium">Settings</span>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-muted-foreground text-sm">Target:</label>
                  <select
                    value={selectedTarget}
                    onChange={(e) => setSelectedTarget(Number(e.target.value))}
                    className="bg-muted text-foreground text-sm rounded px-2 py-1 border border-border"
                  >
                    {PAINTING_TARGETS.map((t, i) => (
                      <option key={i} value={i}>
                        {t.name} ({t.width}×{t.height})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-muted-foreground text-sm">Dithering:</label>
                  <button
                    onClick={() => setDithering(!dithering)}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      dithering
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {dithering ? "ON" : "OFF"}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-muted-foreground text-sm">Name:</label>
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="bg-muted text-foreground text-sm rounded px-2 py-1 border border-border w-40"
                  />
                </div>

                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSourceImage(null);
                      setSourceImageData(null);
                      setPreviewImageData(null);
                      setPntData(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="px-3 py-1.5 rounded text-sm bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    New Image
                  </button>
                  <button
                    onClick={handleDownload}
                    disabled={!pntData || converting}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    Download .pnt
                  </button>
                </div>
              </div>
            </div>

            {/* Previews */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass rounded-lg p-4 space-y-2">
                <h3 className="text-foreground text-sm font-medium">Original</h3>
                <img
                  src={sourceImage.src}
                  alt="Original"
                  className="w-full max-h-[400px] object-contain mx-auto rounded"
                />
                <p className="text-muted-foreground text-xs text-center">
                  {sourceImage.width} × {sourceImage.height} px
                </p>
              </div>

              <ImagePreview
                imageData={previewImageData}
                width={target.width}
                height={target.height}
                label={converting ? "Converting..." : "PNT Preview"}
              />
            </div>

            {/* Color Palette */}
            <ColorPalette
              enabledColors={enabledColors}
              onToggleColor={handleToggleColor}
              onEnableAll={handleEnableAll}
              onDisableAll={handleDisableAll}
            />
          </>
        )}

        {/* Footer Info */}
        <div className="text-center text-muted-foreground text-xs space-y-1 pb-8">
          <p>Place downloaded .pnt files in your ARK MyPaintings folder:</p>
          <code className="text-accent text-xs">
            Steam/steamapps/common/ARK/ShooterGame/Saved/MyPaintings/
          </code>
        </div>
      </main>
    </div>
  );
};

export default Index;
