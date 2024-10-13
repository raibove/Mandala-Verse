import { useState, useRef, useEffect } from 'react';

const MandalaDrawing = () => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [symmetryLines, setSymmetryLines] = useState(8);
  const [brushSize, setBrushSize] = useState(3);
  const [brushColor, setBrushColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [isRadialSymmetryEnabled, setIsRadialSymmetryEnabled] = useState(true);
  const [isMirrorEnabled, setIsMirrorEnabled] = useState(false);
  const [drawingActions, setDrawingActions] = useState([]);
  const [lastPoint, setLastPoint] = useState(null);

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

    // Fill canvas with initial background color
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = (e) => {
    const { offsetX, offsetY } = getCoordinates(e);
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
    setLastPoint({ x: offsetX, y: offsetY });
    setDrawingActions(prev => [...prev, { type: 'start', x: offsetX, y: offsetY }]);
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const { offsetX, offsetY } = getCoordinates(e);
    const ctx = contextRef.current;
    const centerX = canvasRef.current.width / 2;
    const centerY = canvasRef.current.height / 2;

    // Draw at the original position
    drawLine(ctx, lastPoint.x, lastPoint.y, offsetX, offsetY);
    setDrawingActions(prev => [...prev, { type: 'draw', x1: lastPoint.x, y1: lastPoint.y, x2: offsetX, y2: offsetY }]);

    // Vertical mirroring
    if (isMirrorEnabled) {
      const mirroredX1 = canvasRef.current.width - lastPoint.x;
      const mirroredX2 = canvasRef.current.width - offsetX;
      drawLine(ctx, mirroredX1, lastPoint.y, mirroredX2, offsetY);
      setDrawingActions(prev => [...prev, { type: 'draw', x1: mirroredX1, y1: lastPoint.y, x2: mirroredX2, y2: offsetY }]);
    }

    // Radial symmetry
    if (isRadialSymmetryEnabled) {
      const angle1 = Math.atan2(lastPoint.y - centerY, lastPoint.x - centerX);
      const angle2 = Math.atan2(offsetY - centerY, offsetX - centerX);
      const distance1 = Math.sqrt(Math.pow(lastPoint.x - centerX, 2) + Math.pow(lastPoint.y - centerY, 2));
      const distance2 = Math.sqrt(Math.pow(offsetX - centerX, 2) + Math.pow(offsetY - centerY, 2));

      for (let i = 0; i < symmetryLines; i++) {
        const rotationAngle = (Math.PI * 2 * i) / symmetryLines;
        const newX1 = centerX + distance1 * Math.cos(angle1 + rotationAngle);
        const newY1 = centerY + distance1 * Math.sin(angle1 + rotationAngle);
        const newX2 = centerX + distance2 * Math.cos(angle2 + rotationAngle);
        const newY2 = centerY + distance2 * Math.sin(angle2 + rotationAngle);
        drawLine(ctx, newX1, newY1, newX2, newY2);
        setDrawingActions(prev => [...prev, { type: 'draw', x1: newX1, y1: newY1, x2: newX2, y2: newY2 }]);

        // Apply mirroring to radial points if enabled
        if (isMirrorEnabled) {
          drawLine(ctx, canvasRef.current.width - newX1, newY1, canvasRef.current.width - newX2, newY2);
          setDrawingActions(prev => [...prev, { type: 'draw', x1: canvasRef.current.width - newX1, y1: newY1, x2: canvasRef.current.width - newX2, y2: newY2 }]);
        }
      }
    }

    setLastPoint({ x: offsetX, y: offsetY });
  };

  const drawLine = (ctx, x1, y1, x2, y2) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setDrawingActions(prev => [...prev, { type: 'stop' }]);
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
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setDrawingActions([]);
  };

  const handleColorChange = (e) => {
    setBrushColor(e.target.value);
    contextRef.current.strokeStyle = e.target.value;
  };

  const handleBgColorChange = (e) => {
    const newColor = e.target.value;
    setBackgroundColor(newColor);
    redrawCanvas(newColor);
  };

  const redrawCanvas = (newBgColor) => {
    const ctx = contextRef.current;
    const canvas = canvasRef.current;

    // Clear canvas with new background color
    ctx.fillStyle = newBgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Redraw all previous actions
    drawingActions.forEach(action => {
      if (action.type === 'start') {
        ctx.beginPath();
        ctx.moveTo(action.x, action.y);
      } else if (action.type === 'draw') {
        drawLine(ctx, action.x1, action.y1, action.x2, action.y2);
      }
    });
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

            <div className="flex items-center gap-2">
              <label htmlFor="bgColor">Background Color:</label>
              <input
                type="color"
                id="bgColor"
                value={backgroundColor}
                onChange={handleBgColorChange}
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