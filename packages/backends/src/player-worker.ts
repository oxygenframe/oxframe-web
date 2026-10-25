/// <reference lib="webworker" />
// The engine worker of <oxframe-player>: playback only, no export, so the
// embed stays small.
import { serveEngine } from './engine-host';

serveEngine();
