import { createContext } from "react";
import { WebRTSP, type URIInfo } from "webrtsp.react/useWebRTSP";

export interface AppContextData {
  webRTSP: WebRTSP;
  rootInfo: URIInfo | undefined;

  activeStreamer(index: number): string | undefined;
  setActiveStreamer(index: number, streamer: string): void;

  activeStreamerRev(index: number): number;
  incActiveStreamerRev(index: number): void;
}

export const AppContext = createContext<AppContextData>({
  webRTSP: new WebRTSP,
  rootInfo: undefined,

  activeStreamer(): string | undefined { return undefined; },
  setActiveStreamer() {},

  activeStreamerRev(): number { return 0; },
  incActiveStreamerRev() {},
});
