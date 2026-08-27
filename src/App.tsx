import { useCallback, useContext, useEffect, useState } from "react";
import { URIInfoStatus, useWebRTSP } from "webrtsp.react/useWebRTSP";
import { AppContext } from "./AppContext";
import WebRTSPPlayer from "webrtsp.react/WebRTSPPlayer";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon, LayoutGridIcon, LoaderCircle, LoaderCircleIcon, VideoOffIcon } from "lucide-react";
import { cn } from "./lib/utils";
import { type ClassValue } from "clsx";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Method, WILDCARD_URI } from "webrtsp.ts/Types";
import { type StreamerInfo } from "./StreamerInfo";
import {
  LoadActiveStreamers,
  LoadMultiViewState,
  SaveActiveStreamers,
  SaveMultiViewState
} from "./LocalStorage";


declare global {
  const STUNServer: string | undefined;
}

declare const WebRTSPPort: number;
const protocol = window.location.protocol === 'http:' ? "ws" : "wss";
const url = `${protocol}://${window.location.hostname}:${WebRTSPPort}/`;
const iceServers = typeof STUNServer !== 'undefined' ? [{ urls: [STUNServer] }] : undefined;

const MAX_GRID_WIDTH = 2;
const MAX_GRID_HEIGHT = 2;
const MAX_PREVIEW_COUNT = MAX_GRID_WIDTH * MAX_GRID_HEIGHT;


export function StreamerSelector(
  props: {
    className?: ClassValue
    streamerIndex: number
  }
) {
  const [open, setOpen] = useState(false);
  const context = useContext(AppContext);
  const rootInfo = context.rootInfo;
  const rootList = [...(rootInfo?.list || [])]
    .filter((item) => {
      const uriInfo = context.webRTSP.uriInfo(item[0]);
      const options = uriInfo?.options;
      return (options && options.has(Method.DESCRIBE));
    })
    .map((item): StreamerInfo => {
      return { label: item[0], uri: item[0], description: item[1] };
    });

  let activeStreamer = context.activeStreamer(props.streamerIndex);

  return (
    <Popover open = { open } onOpenChange = { setOpen }>
      <PopoverTrigger asChild>
        <Button
          variant = "outline"
          role = "combobox"
          aria-expanded = { open }
          className = { cn("w-[200px] justify-between", props.className) }
        >
          <span>{ activeStreamer }</span>
          <ChevronDownIcon className = "ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className = "w-[200px] p-0">
        <Command>
          <CommandList>
            <CommandEmpty>
              <LoaderCircle
                className = "
                  m-auto
                  stroke-primary
                  opacity-80
                  animate-spin
                "
              />
            </CommandEmpty>
            <CommandGroup>
              {
                rootList.map((item) => {
                  return <CommandItem
                    key = { item.uri}
                    value = { item.uri }
                    onSelect = {(currentValue) => {
                      context.setActiveStreamer(props.streamerIndex, currentValue);
                      setOpen(false);
                    }}
                  >
                    <span>{ item.uri }</span>
                  </CommandItem>;
                })
              }
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface GridSize {
  width: number
  height: number
}

function App() {
  const webRTSP = useWebRTSP(url);
  const { connected, uriInfo, ensureFetched } = webRTSP;

  const [gridSize, setGridSize] = useState<GridSize>(
    () => {
      return LoadMultiViewState() ?
        { width: MAX_GRID_WIDTH, height: MAX_GRID_HEIGHT } :
        { width: 1, height: 1 };
    }
  );

  const rootInfo = uriInfo(WILDCARD_URI);
  useEffect(() => {
    if(!connected)
      return;

    ensureFetched(WILDCARD_URI, true);
  }, [connected, ensureFetched]);

  function saveGridSize(size: GridSize) {
    setGridSize(size);
    SaveMultiViewState(size.width != 1 && size.height != 1);
  }

  const [activeStreamers, setActiveStreamers] = useState<(string | undefined)[]>(
    () => {
      const activeStreamers = LoadActiveStreamers();

      if(activeStreamers.length != MAX_PREVIEW_COUNT)
        activeStreamers.length = MAX_PREVIEW_COUNT;

      return activeStreamers;
    }
  );

  const [activeStreamersRevs, setActiveStreamersRevs] =
    useState<number[]>(() => Array(MAX_PREVIEW_COUNT).fill(0));

  const incActiveStreamerRev = useCallback((index: number) => {
    setActiveStreamersRevs((revs) => {
      return revs.map((rev, i) => {
          return i == index ? rev >= Number.MAX_SAFE_INTEGER ? 0 : rev + 1 : rev;
      });
    });
  }, [setActiveStreamersRevs]);

  const setActiveStreamer = useCallback((index: number, streamer: string) => {
    setActiveStreamers((activeStreamers) => {
      activeStreamers[index] = streamer;
      SaveActiveStreamers(activeStreamers);
      return activeStreamers;
    });
    incActiveStreamerRev(index);
  }, [setActiveStreamers, incActiveStreamerRev]);

  const isLoading = rootInfo?.status == URIInfoStatus.FETCHING;
  const rootOptions = !isLoading ? rootInfo?.options : undefined;
  const rootList = !isLoading ? rootInfo?.list : undefined;
  const singleStreamerMode = !isLoading ?
    ((rootOptions && !rootOptions.has(Method.LIST)) || (rootList && rootList.size == 1)) :
    undefined;
  const hasStreamers = !isLoading &&
    ((singleStreamerMode ?? false) || ((rootList && rootList.size > 0) ?? false));

  if(!isLoading && singleStreamerMode) {
    const firstStreamer = rootInfo?.list?.keys().next().value ?? WILDCARD_URI;
    if(firstStreamer && activeStreamers[0] != firstStreamer) {
      setActiveStreamer(0, firstStreamer);
    }
  }

  const loadingStub = () => {
    return (
      <main className = "min-h-svh w-full flex flex-col">
        <div className = "relative flex-1">
          <LoaderCircleIcon
            className = "
              absolute
              max-w-1/2 max-h-1/2
              w-40 h-40
              top-0 bottom-0 left-0 right-0
              m-auto
              stroke-primary
              opacity-50
              animate-spin
            "
          />
        </div>
      </main>
    );
  };

  const noStreamersStub = () => {
    return (
      <main className = "min-h-svh w-full flex flex-col">
        <div className = "relative flex-1">
          <VideoOffIcon
            className = "
              absolute
              max-w-1/2 max-h-1/2
              w-40 h-40
              top-0 bottom-0 left-0 right-0
              m-auto
              stroke-primary
              opacity-50
            "
          />
        </div>
      </main>
    );
  };

  const singlePreview = () => {
    const activeStreamer = activeStreamers[0];
    const activeStreamerRevision = activeStreamersRevs[0];

    return (
      <SidebarProvider>
        { !isLoading && !singleStreamerMode && <AppSidebar /> }
        <main className = "flex-1 flex flex-col">
          {
            !isLoading && !singleStreamerMode &&
            <div className = "flex mx-2 mt-1">
              <SidebarTrigger />
              <div className = "flex-1"></div>
              <Button
                variant = {
                  gridSize.width == 1 && gridSize.height == 1 ?
                    "ghost" :
                    "outline"
                }
                size = "icon"
                className = {"size-7"}
                onClick = {() => {
                  saveGridSize({ width: MAX_GRID_WIDTH, height: MAX_GRID_HEIGHT });
                }}
              >
                <LayoutGridIcon/>
              </Button>
            </div>
          }
          <WebRTSPPlayer
            className = "flex-1"
            webRTSP = { webRTSP }
            uri = { activeStreamer }
            revision = { activeStreamerRevision }
            incActiveStreamerRev = { () => incActiveStreamerRev(0) }
            iceServers = { iceServers }
          />
        </main>
      </SidebarProvider>
    );
  };

  const multiPreview = () => {
    return (
      <main className = "min-h-svh w-full flex flex-col">
        <div className = "flex mx-2 mt-1">
          <div className = "flex-1" />
          <Button
            variant = "outline"
            size = "icon"
            className = {"size-7"}
            onClick = {() => {
              saveGridSize({ width: 1, height: 1 });
            }}
          >
            <LayoutGridIcon/>
          </Button>
        </div>
        <div className = { cn(
          "flex-1 grid gap-1 m-2",
          // mention all possible classes in commment
          // to give Tailwind hint to embed all possible values:
          // grid-cols-1 grid-cols-2 grid-cols-3
          // grid-rows-1 grid-rows-2 grid-rows-3
          `grid-cols-${gridSize.width} grid-rows-${gridSize.height}`
        ) }>
          {
            Array(gridSize.height).fill(0).map((_, y) => {
              return Array(gridSize.width).fill(0).map((_, x) => {
                const streamerIndex = y * gridSize.width + x;
                const activeStreamer = activeStreamers[streamerIndex];

                return <div
                    key = { streamerIndex }
                    className = { cn(
                      `col-${x + 1} row-${y + 1}`,
                      "border rounded-lg overflow-hidden flex flex-col"
                    ) }
                  >
                    <StreamerSelector
                      className = "self-end m-1"
                      streamerIndex = { streamerIndex }
                    />
                    <WebRTSPPlayer
                      className = "flex-1"
                      webRTSP = { webRTSP }
                      uri = { activeStreamer }
                      revision = { activeStreamersRevs[streamerIndex] }
                      incActiveStreamerRev = { () => incActiveStreamerRev(streamerIndex) }
                      iceServers = { iceServers }
                    />
                  </div>;
              });
            })
          }
        </div>
      </main>
    );
  };

  let main;
  if(!connected || isLoading) {
    main = loadingStub();
  } else if(!hasStreamers) {
    main = noStreamersStub();
  } else if(
    singleStreamerMode || (gridSize.width == 1 && gridSize.height == 1)
  ) {
    main = singlePreview();
  } else {
    main = multiPreview();
  }

  return (
    <AppContext value = {
      {
        webRTSP,
        rootInfo,

        activeStreamer(index: number): string | undefined {
          return activeStreamers[index];
        },
        setActiveStreamer,
        activeStreamerRev(index: number): number {
          return activeStreamersRevs[index];
        },
        incActiveStreamerRev(index: number) {
          incActiveStreamerRev(index);
        },
      }
    } >
      { main }
    </AppContext>
  );
}

export default App;
