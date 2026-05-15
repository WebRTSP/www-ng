import { useCallback, useContext, useEffect, useState } from "react";
import { useWebRTSP } from "./WebRTSP.react/useWebRTSP";
import { AppContext } from "./AppContext";
import WebRTSPPlayer from "./WebRTSP.react/WebRTSPPlayer";
import { useLazyRef } from "./WebRTSP.react/useLazyRef";
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
import { Method } from "webrtsp.ts/Types";
import { type StreamerInfo } from "./StreamerInfo";
import {
  LoadActiveStreamers,
  LoadMultiViewState,
  SaveActiveStreamers,
  SaveMultiViewState
} from "./LocalStorage";


declare const WebRTSPPort: number;
const protocol = window.location.protocol === 'http:' ? "ws" : "wss";
const url = `${protocol}://${window.location.hostname}:${WebRTSPPort}/`;

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
  const rootList = [...context.webRTSP.rootList]
    .filter((item) => {
      const uriInfo = context.webRTSP.urisInfos.get(item[0]);
      const options = uriInfo?.options;
      return (options && !options.has(Method.LIST) && options.has(Method.DESCRIBE));
    })
    .map((item): StreamerInfo => {
      return { uri: item[0], description: item[1] };
    });

  let activeStreamer = context.activeStreamer(props.streamerIndex);
  if(activeStreamer && !context.webRTSP.urisInfos.has(activeStreamer)) {
    activeStreamer = undefined;
  }

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
              <LoaderCircle className = "m-auto stroke-primary-200 animate-spin"/>
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
  const [gridSize, setGridSize] = useState<GridSize>(
    () => {
      return LoadMultiViewState() ?
        { width: MAX_GRID_WIDTH, height: MAX_GRID_HEIGHT } :
        { width: 1, height: 1 };
    }
  );

  function saveGridSize(size: GridSize) {
    setGridSize(size);
    SaveMultiViewState(size.width != 1 && size.height != 1);
  }

  const activeStreamersRef = useLazyRef<(string | undefined) []>(
    () => {
      const activeStreamers = LoadActiveStreamers();

      if(activeStreamers.length != MAX_PREVIEW_COUNT)
        activeStreamers.length = MAX_PREVIEW_COUNT;

      return activeStreamers;
    }
  );

  const [activeStreamersRevs, setActiveStreamersRevs] =
    useState<number[]>(() => Array(MAX_PREVIEW_COUNT).fill(0));

  const incActiveStreamerRev = (index: number) => {
    setActiveStreamersRevs((revs) => {
      return revs.map((
        rev, i) => {
          return i == index ? rev >= Number.MAX_SAFE_INTEGER ? 0 : rev + 1 : rev;
        });
    });
  };

  const setActiveStreamer = useCallback((index: number, streamer: string) => {
    activeStreamersRef.current[index] = streamer;
    SaveActiveStreamers(activeStreamersRef.current);
    incActiveStreamerRev(index);
  }, [activeStreamersRef]);

  const singleStreamerMode = webRTSP.rootList.size == 1;

  useEffect(() => {
    if(!webRTSP.connected)
      return;

    if(!singleStreamerMode)
      return;

    const firstStreamer = webRTSP.rootList.keys().next().value;

    console.log("first streamer: ", firstStreamer);
    if(firstStreamer)
      setActiveStreamer(0, firstStreamer);
  }, [setActiveStreamer, singleStreamerMode, webRTSP.connected, webRTSP.rootList]);

  const loadingStub = () => {
    return (
      <main className = "min-h-svh w-full flex flex-col">
        <div className = "relative flex-1">
          <LoaderCircleIcon
            className = {`
              absolute
              max-w-1/2 max-h-1/2
              w-40 h-40
              top-0 bottom-0 left-0 right-0
              m-auto
              stroke-primary-200
              animate-spin
            `}
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
            className = {`
              absolute
              max-w-1/2 max-h-1/2
              w-40 h-40
              top-0 bottom-0 left-0 right-0
              m-auto
              stroke-primary-200
            `}
          />
        </div>
      </main>
    );
  };

  const singlePreview = () => {
    const activeStreamer = activeStreamersRef.current[0];

    return (
      <SidebarProvider>
        { !singleStreamerMode && <AppSidebar /> }
        <main className = "flex-1 flex flex-col">
          {
            !singleStreamerMode &&
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
            activeStreamer = { activeStreamer }
            activeStreamerRev = { activeStreamersRevs[0] }
            incActiveStreamerRev = { () => incActiveStreamerRev(0) }
          />
        </main>
      </SidebarProvider>
    );
  };

  const multiPreview = () => {
    return (
      <main className = "min-h-svh w-full flex flex-col">
        <div className = "flex mx-2 mt-1">
          <div className = "flex-1"></div>
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
                const activeStreamer = activeStreamersRef.current[streamerIndex];

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
                      activeStreamer = { activeStreamer }
                      activeStreamerRev = { activeStreamersRevs[streamerIndex] }
                      incActiveStreamerRev = { () => incActiveStreamerRev(streamerIndex) }
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
  if(!webRTSP.connected || webRTSP.fetching) {
    main = loadingStub();
  } else if(webRTSP.rootList.size == 0) {
    main = noStreamersStub();
  } else if(
    webRTSP.rootList.size == 1 ||
    (gridSize.width == 1 && gridSize.height == 1)
  ) {
    main = singlePreview();
  } else {
    main = multiPreview();
  }

  return (
    <AppContext value = {
      {
        webRTSP,

        activeStreamer(index: number): string | undefined {
          return activeStreamersRef.current[index];
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
