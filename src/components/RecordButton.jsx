import React, { useRef, useEffect } from "react";
import { Mic } from "lucide-react";

export default function RecordButton({
  isRecording,
  onRecordStart,
  onRecordEnd,
}) {
  const buttonRef = useRef(null);
  const isTouchDevice = useRef(false);

  useEffect(() => {
    // Detect if device supports touch
    isTouchDevice.current = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }, []);

  const handleStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isTouchDevice.current) {
      // For touch devices, prevent mouse events
      buttonRef.current?.addEventListener('touchend', handleEndTouch, { once: true });
    }
    onRecordStart(e);
  };

  const handleEnd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onRecordEnd(e);
  };

  const handleEndTouch = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onRecordEnd(e);
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    isTouchDevice.current = true;
    handleStart(e);
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleEnd(e);
  };

  return (
    <button
      ref={buttonRef}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={isRecording ? handleEnd : undefined} // Stop recording if mouse leaves button
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd} // Handle touch cancellation
      className={`w-full py-4 px-6 rounded-xl text-white font-semibold transition-all transform hover:scale-105 select-none ${
        isRecording
          ? "bg-red-500 animate-pulse cursor-not-allowed"
          : "bg-gradient-to-r from-purple-500 to-blue-500 cursor-pointer"
      }`}
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      <div className="flex items-center justify-center gap-3">
        <Mic size={24} />
        <span>
          {isRecording ? "Recording... Release to Stop" : "Hold to Record Your Answer"}
        </span>
      </div>
    </button>
  );
}
