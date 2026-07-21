import React, { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export type SignatureCanvasHandle = {
  clear: () => void;
};

// A minimal signature pad: pointer events drawn straight onto a canvas,
// backing resolution matched to devicePixelRatio so strokes stay crisp on
// an iPad's retina display. No signature-pad dependency — this is the only
// place in the app that needs one, and the whole thing is ~50 lines.
export const SignatureCanvas = forwardRef<SignatureCanvasHandle, { onChange: (hasSignature: boolean) => void; className?: string }>(
  ({ onChange, className }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawingRef = useRef(false);
    const hasSignatureRef = useRef(false);
    const lastPointRef = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const configure = () => {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.scale(dpr, dpr);
          ctx.lineWidth = 2.5;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.strokeStyle = "var(--text-primary)";
        }
      };
      configure();
      window.addEventListener("resize", configure);
      return () => window.removeEventListener("resize", configure);
    }, []);

    const pointFromEvent = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      canvasRef.current?.setPointerCapture(e.pointerId);
      drawingRef.current = true;
      lastPointRef.current = pointFromEvent(e);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!drawingRef.current) return;
      const ctx = canvasRef.current?.getContext("2d");
      const point = pointFromEvent(e);
      if (ctx && lastPointRef.current) {
        ctx.beginPath();
        ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
      }
      lastPointRef.current = point;
      if (!hasSignatureRef.current) {
        hasSignatureRef.current = true;
        onChange(true);
      }
    };

    const handlePointerUp = () => {
      drawingRef.current = false;
      lastPointRef.current = null;
    };

    useImperativeHandle(ref, () => ({
      clear: () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        hasSignatureRef.current = false;
        onChange(false);
      },
    }));

    return (
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className={className}
        style={{ touchAction: "none" }}
      />
    );
  }
);
SignatureCanvas.displayName = "SignatureCanvas";
