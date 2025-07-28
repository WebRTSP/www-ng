import { createContext } from "react";
import { WebRTSP } from "./WebRTSP.react/useWebRTSP";

export interface AppContextData {
  webRTSP: WebRTSP
  get activeStreamer(): string | undefined
  set activeStreamer(streamer: string)

  get activeStreamerRev(): number
  incActiveStreamerRev(): void
}

export const AppContext = createContext<AppContextData>({
  webRTSP: new WebRTSP,
  get activeStreamer(): string | undefined { return undefined; },
  set activeStreamer(_streamer: string) {},

  get activeStreamerRev(): number { return 0; },
  incActiveStreamerRev() {},
});