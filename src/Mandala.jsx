import { useState, useRef, useEffect } from 'react';

const MandalaDrawing = () => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [symmetryLines, setSymmetryLines] = useState(8);
  const [brushSize, setBrushSize] = useState(3);
  const [brushColor, setBrushColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [isRadialSymmetryEnabled, setIsRadialSymmetryEnabled] = useState(true);
  const [isMirrorEnabled, setIsMirrorEnabled] = useState(false);
  const [batches, setBatches] = useState([]);  // Store grouped actions
  const [batchIndex, setBatchIndex] = useState(0);  // Track current position for undo/redo
  const [currentBatch, setCurrentBatch] = useState([]);  // Store current drawing actions
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

    // Start a new batch for this drawing action
    setCurrentBatch([{ type: 'start', x: offsetX, y: offsetY }]);
  };

const draw = (e) => {
    if (!isDrawing) return;

    const { offsetX, offsetY } = getCoordinates(e);
    const ctx = contextRef.current;
    const centerX = canvasRef.current.width / 2;
    const centerY = canvasRef.current.height / 2;

    // Draw at the original position
    drawLine(ctx, lastPoint.x, lastPoint.y, offsetX, offsetY);

    const newAction = { type: 'draw', x1: lastPoint.x, y1: lastPoint.y, x2: offsetX, y2: offsetY };
    setCurrentBatch((prev) => [...prev, newAction]);
    setLastPoint({ x: offsetX, y: offsetY });

    // Vertical mirroring
    if (isMirrorEnabled) {
        // Mirror along the vertical axis (center of canvas width)
        const mirroredX1 = canvasRef.current.width - lastPoint.x;
        const mirroredX2 = canvasRef.current.width - offsetX;

        drawLine(ctx, mirroredX1, lastPoint.y, mirroredX2, offsetY);
        
        const mirrorAction = { type: 'draw', x1: mirroredX1, y1: lastPoint.y, x2: mirroredX2, y2: offsetY };
        setCurrentBatch((prev) => [...prev, mirrorAction]);
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

            const symmetryAction = { type: 'draw', x1: newX1, y1: newY1, x2: newX2, y2: newY2 };
            setCurrentBatch((prev) => [...prev, symmetryAction]);

            if (isMirrorEnabled) {
              drawLine(ctx, canvasRef.current.width - newX1, newY1, canvasRef.current.width - newX2, newY2);
              setCurrentBatch(prev => [...prev, { type: 'draw', x1: canvasRef.current.width - newX1, y1: newY1, x2: canvasRef.current.width - newX2, y2: newY2 }]);
            }
        }
    }
};


  const stopDrawing = () => {
    setIsDrawing(false);
    if (currentBatch.length > 0) {
      // Save current batch and reset for next drawing
      const newBatches = [...batches.slice(0, batchIndex), currentBatch];
      setBatches(newBatches);
      setBatchIndex(newBatches.length);
      setCurrentBatch([]);
    }
  };

  const undo = () => {
    if (batchIndex === 0) return;  // No batches to undo

    const newIndex = batchIndex - 1;
    setBatchIndex(newIndex);
    redrawCanvas(newIndex);
  };

  const redo = () => {
    if (batchIndex === batches.length) return;  // No batches to redo

    const newIndex = batchIndex + 1;
    setBatchIndex(newIndex);
    redrawCanvas(newIndex);
  };

  const redrawCanvas = (upToBatchIndex, newBgColor) => {
    // Clear the canvas
    const ctx = contextRef.current;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Fill background color
    ctx.fillStyle =newBgColor || backgroundColor;
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Re-draw all batches up to the given index
    for (let i = 0; i < upToBatchIndex; i++) {
      const batch = batches[i];
      batch.forEach((action) => {
        if (action.type === 'start') {
          ctx.beginPath();
          ctx.moveTo(action.x, action.y);
        } else if (action.type === 'draw') {
          drawLine(ctx, action.x1, action.y1, action.x2, action.y2);
        }
      });
    }
  };

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    };
  };

  const drawLine = (ctx, x1, y1, x2, y2) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };

  const handleBrushSizeChange = (e) => {
    setBrushSize(e.target.value);
    contextRef.current.lineWidth = e.target.value;
  };

  const handleSymmetryChange = (e) => {
    setSymmetryLines(parseInt(e.target.value));
  };

  const clearCanvas = () => {
    const ctx = contextRef.current;
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setBatches([]);
    setCurrentBatch([]);
    setBatchIndex(0);
  };

  const handleColorChange = (e) => {
    setBrushColor(e.target.value);
    contextRef.current.strokeStyle = e.target.value;
  };

  const handleBgColorChange = (e) => {
    const newColor = e.target.value;
    setBackgroundColor(newColor);
    redrawCanvas(batchIndex, newColor);
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

          <div className="flex gap-4 justify-center">
            <button onClick={undo} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Undo</button>
            <button onClick={redo} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">Redo</button>
          </div>
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
