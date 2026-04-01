import type { InputEvent, ScoreResult } from "./types.js";
import { extractSignals } from "./signals.js";
import { computeScore } from "./score.js";

/**
 * A typing session accumulates input events and provides a live score.
 *
 * Usage:
 *   const session = new TypingSession();
 *   session.addEvent({ timestamp: Date.now(), type: "keydown", charCountDelta: 1 });
 *   const result = session.score();
 *   if (result.band === "high") { ... badge it ... }
 */
export class TypingSession {
  private events: InputEvent[] = [];

  /** Add an input event to the session */
  addEvent(event: InputEvent): void {
    this.events.push(event);
  }

  /** Get all recorded events */
  getEvents(): ReadonlyArray<InputEvent> {
    return this.events;
  }

  /** Number of events recorded */
  get eventCount(): number {
    return this.events.length;
  }

  /** Calculate current score from accumulated events */
  score(): ScoreResult {
    const signals = extractSignals(this.events);
    return computeScore(signals);
  }

  /** Reset the session, discarding all events */
  reset(): void {
    this.events = [];
  }
}
