/**
 * DOM event collector: captures typing events as InputEvent objects.
 * Attaches to a textarea and emits events for the TypingSession.
 */

export interface InputEvent {
  timestamp: number;
  type: "keydown" | "keyup" | "paste" | "character_removed";
  charCountDelta: number;
}

export type EventCallback = (event: InputEvent) => void;

/**
 * Attach event listeners to a textarea and call onEvent for each typing action.
 * Returns a cleanup function.
 */
export function attachCollector(
  textarea: HTMLTextAreaElement,
  onEvent: EventCallback
): () => void {
  let prevLength = textarea.value.length;

  function handleKeydown(e: KeyboardEvent) {
    const now = Date.now();
    const currentLength = textarea.value.length;

    // We'll check length change after the keystroke in a microtask
    // For now, record the pre-keystroke length
    requestAnimationFrame(() => {
      const newLength = textarea.value.length;
      const delta = newLength - prevLength;
      prevLength = newLength;

      if (delta > 0) {
        onEvent({ timestamp: now, type: "keydown", charCountDelta: delta });
      } else if (delta < 0) {
        onEvent({ timestamp: now, type: "character_removed", charCountDelta: delta });
      }
      // delta === 0: navigation key, modifier, etc. — ignore
    });
  }

  function handlePaste(e: ClipboardEvent) {
    const now = Date.now();
    requestAnimationFrame(() => {
      const newLength = textarea.value.length;
      const delta = newLength - prevLength;
      prevLength = newLength;
      if (delta > 0) {
        onEvent({ timestamp: now, type: "paste", charCountDelta: delta });
      }
    });
  }

  // Sync prevLength on focus in case value changed externally
  function handleFocus() {
    prevLength = textarea.value.length;
  }

  textarea.addEventListener("keydown", handleKeydown);
  textarea.addEventListener("paste", handlePaste);
  textarea.addEventListener("focus", handleFocus);

  return () => {
    textarea.removeEventListener("keydown", handleKeydown);
    textarea.removeEventListener("paste", handlePaste);
    textarea.removeEventListener("focus", handleFocus);
  };
}
