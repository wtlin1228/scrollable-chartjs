import { useState, useRef, useCallback } from "react";

export default function useIsScrollMode(defaultValue) {
  const [isScrollMode, setIsScrollMode] = useState(defaultValue);
  const isScrollModeRef = useRef(defaultValue);

  const patchedSetIsScrollMode = useCallback((value) => {
    if (isScrollModeRef.current !== value) {
      setIsScrollMode(value);
      isScrollModeRef.current = value;
    }
  }, []);

  return [isScrollMode, patchedSetIsScrollMode, isScrollModeRef];
}
