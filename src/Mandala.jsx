import { useState, useRef, useEffect } from 'react';

const MandalaDrawing = () => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [symmetryLines, setSymmetryLines] = useState(8);
  const [brushSize, setBrushSize] = useState(3);
  const [brushColor, setBrushColor] = useState('#000000');
  const [isRadialSymmetryEnabled, setIsRadialSymmetryEnabled] = useState(true);
  const [isMirrorEnabled, setIsMirrorEnabled] = useState(false);

  const canvasRef = useRef(null);
  const contextRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = 600;
    canvas.height = 600;
    
    const context = canvas.getContext('2d');
    context.strokeStyle = brushColor;
    context.lineWidth = brushSize;
    context.lineCap = 'round';
    contextRef.current = context;

    // Fill canvas with white background
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = (e) => {
    const { offsetX, offsetY } = getCoordinates(e);
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const { offsetX, offsetY } = getCoordinates(e);
    const ctx = contextRef.current;
    const centerX = canvasRef.current.width / 2;
    const centerY = canvasRef.current.height / 2;

    // Draw at the original position
    drawPoint(ctx, offsetX, offsetY);

    // Vertical mirroring
    if (isMirrorEnabled) {
      const mirroredX = canvasRef.current.width - offsetX;
      drawPoint(ctx, mirroredX, offsetY);
    }

    // Radial symmetry
    if (isRadialSymmetryEnabled) {
      const angle = Math.atan2(offsetY - centerY, offsetX - centerX);
      const distance = Math.sqrt(
        Math.pow(offsetX - centerX, 2) + Math.pow(offsetY - centerY, 2)
      );

      for (let i = 0; i < symmetryLines; i++) {
        const rotationAngle = (Math.PI * 2 * i) / symmetryLines;
        const newX = centerX + distance * Math.cos(angle + rotationAngle);
        const newY = centerY + distance * Math.sin(angle + rotationAngle);
        drawPoint(ctx, newX, newY);

        // Apply mirroring to radial points if enabled
        if (isMirrorEnabled) {
          drawPoint(ctx, canvasRef.current.width - newX, newY);
        }
      }
    }
  };

  const drawPoint = (ctx, x, y) => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.1, y + 0.1); // Small line to create a point
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const getCoordinates = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top
    };
  };

  const clearCanvas = () => {
    const ctx = contextRef.current;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const handleColorChange = (e) => {
    setBrushColor(e.target.value);
    contextRef.current.strokeStyle = e.target.value;
  };

  const handleBrushSizeChange = (e) => {
    setBrushSize(e.target.value);
    contextRef.current.lineWidth = e.target.value;
  };

  const handleSymmetryChange = (e) => {
    setSymmetryLines(parseInt(e.target.value));
  };

  return (
    <div className="flex flex-col items-center p-4 bg-gray-100 min-h-screen">
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <h1 className="text-2xl font-bold mb-4 text-center">Mandala Drawing App</h1>
        
        <div className="mb-4 space-y-4">
          <div className="flex gap-4 justify-center">
            <div className="flex items-center gap-2">
              <label htmlFor="symmetry">Symmetry Lines:</label>
              <input
                type="range"
                id="symmetry"
                min="4"
                max="16"
                value={symmetryLines}
                onChange={handleSymmetryChange}
                className="w-32"
                disabled={!isRadialSymmetryEnabled}
              />
              <span>{symmetryLines}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <label htmlFor="brushSize">Brush Size:</label>
              <input
                type="range"
                id="brushSize"
                min="1"
                max="10"
                value={brushSize}
                onChange={handleBrushSizeChange}
                className="w-32"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <label htmlFor="color">Color:</label>
              <input
                type="color"
                id="color"
                value={brushColor}
                onChange={handleColorChange}
                className="w-8 h-8"
              />
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isRadialSymmetryEnabled}
                onChange={(e) => setIsRadialSymmetryEnabled(e.target.checked)}
              />
              Radial Symmetry
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isMirrorEnabled}
                onChange={(e) => setIsMirrorEnabled(e.target.checked)}
              />
              Mirror
            </label>

            <button
              onClick={clearCanvas}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear
            </button>
          </div>
        </div>

        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="border border-gray-300 rounded cursor-crosshair"
        />
      </div>
    </div>
  );
};

export default MandalaDrawing;