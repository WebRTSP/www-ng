import { useRef, useState } from "react";
import { useWebRTSP } from "./WebRTSP.react/useWebRTSP";
import { AppContext } from "./AppContext";
import WebRTSPPlayer from "./WebRTSP.react/WebRTSPPlayer";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";


declare const WebRTSPPort: number;
const protocol = window.location.protocol === 'http:' ? "ws" : "wss";
const url = `${protocol}://${window.location.hostname}:${WebRTSPPort}/`;

function App() {
  const webRTSP = useWebRTSP(url);
  const activeStreamerRef = useRef<string | undefined>(undefined);
  const [activeStreamerRev, setActiveStreamerRev] = useState(0);

  const incActiveStreamerRev = () => {
    setActiveStreamerRev((rev: number) => {
      return rev >= Number.MAX_SAFE_INTEGER ? 0 : rev + 1;
    });
  };

  return (
    <AppContext value = {
      {
        webRTSP,
        get activeStreamerRev(): number { return activeStreamerRev; },
        incActiveStreamerRev: incActiveStreamerRev,
        get activeStreamer(): string | undefined { return activeStreamerRef.current; },
        set activeStreamer(streamer: string) {
            activeStreamerRef.current = streamer;
            this.incActiveStreamerRev();
        },
      }
    } >
      <SidebarProvider>
        <AppSidebar />
        <main className = "relative flex-1">
          <SidebarTrigger />
          <WebRTSPPlayer
            webRTSP = { webRTSP }
            activeStreamer = { activeStreamerRef.current }
            activeStreamerRev = { activeStreamerRev }
            incActiveStreamerRev = { incActiveStreamerRev } />
        </main>
      </SidebarProvider>
    </AppContext>
  );
}

export default App;
