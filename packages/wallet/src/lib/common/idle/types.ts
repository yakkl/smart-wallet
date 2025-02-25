export type IdleState = 'active' | 'idle' | 'locked';
export type IdleWidth = 'system-wide' | 'app-wide';
export type IdleConfig = {
  width: IdleWidth;
  threshold: number;           // Time until idle state (milliseconds)
  lockDelay: number;           // Additional time before lockdown (milliseconds)
  checkInterval?: number;      // For app-wide mode only (milliseconds)
};
