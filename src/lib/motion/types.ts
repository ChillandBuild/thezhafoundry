export type Gsap = (typeof import('gsap'))['default'];
export type ScrollTriggerT = (typeof import('gsap/ScrollTrigger'))['ScrollTrigger'];

export interface MotionContext {
  gsap: Gsap;
  ScrollTrigger: ScrollTriggerT;
}

/** An effect wires up motion and returns extra cleanup for anything gsap.context can't revert. */
export type Effect = (ctx: MotionContext) => (() => void) | void;
