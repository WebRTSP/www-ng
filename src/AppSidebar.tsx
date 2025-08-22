import { useContext, useState  } from "react";
import {
  VideoIcon,
  FilmIcon,
  LoaderCircleIcon,
  ChevronRightIcon,
  ChevronDownIcon
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";

import { AppContext } from "./AppContext";
import { Method } from "webrtsp.ts/Types";
import type { StreamerInfo } from "./StreamerInfo";

export function StreamerSubItem(props: { subItem: StreamerInfo }) {
  const context = useContext(AppContext);
  const subItem =  props.subItem;
  let name = subItem.uri;

  const timeFormat =
    Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "medium" });

  try {
    name = timeFormat.format(new Date(subItem.description));
  } catch { /* empty */ }

  return (
    <SidebarMenuSubItem key = { subItem.uri } className = "mr-auto">
      <SidebarMenuButton
        isActive = { context.activeStreamer(0) == subItem.uri }
        onClick = { () => { context.setActiveStreamer(0, subItem.uri); } }
      >
        <FilmIcon />
        <span>{ name }</span>
      </SidebarMenuButton>
    </SidebarMenuSubItem>
  );
}

export function StreamerItem(props: { item: StreamerInfo }) {
  const context = useContext(AppContext);
  const item = props.item;
  const [isOpen, setIsOpen] = useState(false);

  const uriInfo = context.webRTSP.urisInfos.get(item.uri);
  const isLoading = uriInfo?.fetching ?? true;
  const hasSubStreams = uriInfo?.options?.has(Method.LIST) ?? false;

  const onOpenChange = (open: boolean) => {
    setIsOpen(open);

    if(!open || isLoading)
      return;

    context.webRTSP.fetchList(item.uri).catch();
  };

  if(hasSubStreams) {
    if(isLoading) {
      return (
        <Collapsible onOpenChange = { onOpenChange }>
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton
                isActive = { context.activeStreamer(0) == item.uri }
              >
                <VideoIcon />
                <span>{ item.uri }</span>
                <LoaderCircleIcon className = "ml-auto animate-spin"/>
              </SidebarMenuButton>
            </CollapsibleTrigger>
          </SidebarMenuItem>
        </Collapsible>
      );
    } else {
      const list = [...(uriInfo?.list || [])]
        .map((item): StreamerInfo => {
          return { uri: item[0], description: item[1] };
        });
      return (
        <Collapsible onOpenChange = { onOpenChange }>
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton
                isActive = { context.activeStreamer(0) == item.uri }
              >
                <VideoIcon />
                <span>{ item.uri }</span>
                {
                  isOpen ?
                  <ChevronDownIcon className = "ml-auto" /> :
                  <ChevronRightIcon className = "ml-auto" />
                }
              </SidebarMenuButton>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <SidebarMenuSub>
                { list.map((subItem) => (
                  <StreamerSubItem
                    key = { subItem.uri }
                    subItem = { subItem } />
                )) }
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      );
    }
  } else {
    if(isLoading) {
      return (
        <SidebarMenuItem>
          <SidebarMenuButton
            isActive = { context.activeStreamer(0) == item.uri }
          >
            <VideoIcon /> <span>{ item.uri }</span>
          </SidebarMenuButton>
          <SidebarMenuAction>
            <LoaderCircleIcon className = "animate-spin"/>
          </SidebarMenuAction>
        </SidebarMenuItem>
      );
    } else {
      return (
        <SidebarMenuItem>
          <SidebarMenuButton
            isActive = { context.activeStreamer(0) == item.uri }
            onClick = { () => { context.setActiveStreamer(0, item.uri); } }
          >
            <VideoIcon />
            <span>{ item.uri }</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    }
  }
}

export function AppSidebar() {
  const context = useContext(AppContext);
  const rootList = [...context.webRTSP.rootList]
    .map((item): StreamerInfo => {
      return { uri: item[0], description: item[1] };
    });

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {rootList.map((item) => (
                <StreamerItem
                  key = { item.uri }
                  item = { item } />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
