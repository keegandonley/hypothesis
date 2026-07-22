import { useState } from "react";

interface FileDropHandlers {
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
}

/**
 * Shared drag-and-drop file intake: tracks the "dragging" highlight state
 * and hands dropped files to the callback. Spread `dropHandlers` onto the
 * drop-zone element. Single-file pages read `files[0]`.
 */
export function useFileDrop(onFiles: (files: File[]) => void): {
  dragging: boolean;
  dropHandlers: FileDropHandlers;
} {
  const [dragging, setDragging] = useState(false);

  return {
    dragging,
    dropHandlers: {
      onDrop: (e) => {
        e.preventDefault();
        setDragging(false);
        const files = Array.from(e.dataTransfer.files);

        if (files.length > 0) onFiles(files);
      },
      onDragOver: (e) => {
        e.preventDefault();
        setDragging(true);
      },
      onDragLeave: () => {
        setDragging(false);
      },
    },
  };
}
