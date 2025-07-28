import { useContext, useState  } from "react";
import { Video, Film, LoaderCircle, ChevronRight, ChevronDown } from "lucide-react";
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

import { AppContext } from "./AppContext";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./components/ui/collapsible";
import { Method } from "webrtsp.ts/Types";

export function StreamerSubItem(props: { subItem: [string, string] }) {
  const context = useContext(AppContext);
  const subItem =  props.subItem;
  let name = subItem[0];

  const timeFormat =
      Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "medium"});

  try {
    name = timeFormat.format(new Date(subItem[1]));
  } catch { /* empty */ }

  return (
    <SidebarMenuSubItem key = { subItem[0] } className = "mr-auto">
      <SidebarMenuButton
        isActive = { context.activeStreamer === subItem[0] }
        onClick = { () => { context.activeStreamer = subItem[0]; } }
      >
        <Film />
        <span>{ name }</span>
      </SidebarMenuButton>
    </SidebarMenuSubItem>
  );
}

export function StreamerItem(props: { item: [string, string] }) {
  const context = useContext(AppContext);
  const item = props.item;
  const [isOpen, setIsOpen] = useState(false);

  const uriInfo = context.webRTSP.urisInfos.get(item[0]);
  const isLoading = uriInfo?.fetching ?? true;
  const hasSubStreams = uriInfo?.options?.has(Method.LIST) ?? false;

  const onOpenChange = (open: boolean) => {
    setIsOpen(open);

    if(!open || isLoading)
      return;

    context.webRTSP.fetchList(item[0]).catch();
  };

  if(hasSubStreams) {
    if(isLoading) {
      return (
        <Collapsible onOpenChange = { onOpenChange }>
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton
                isActive = { context.activeStreamer === item[0] }
              >
                <Video />
                <span>{ item[0] }</span>
                <LoaderCircle className="ml-auto animate-spin"/>
              </SidebarMenuButton>
            </CollapsibleTrigger>
          </SidebarMenuItem>
        </Collapsible>
      );
    } else {
      const list = [...(uriInfo?.list || [])];
      return (
        <Collapsible onOpenChange = { onOpenChange }>
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton
                isActive = { context.activeStreamer === item[0] }
              >
                <Video />
                <span>{ item[0] }</span>
                {
                  isOpen ?
                  <ChevronDown className="ml-auto" /> :
                  <ChevronRight className="ml-auto" />
                }
              </SidebarMenuButton>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <SidebarMenuSub>
                { list.map((subItem) => (
                  <StreamerSubItem
                    key = { subItem[0] }
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
            isActive = { context.activeStreamer === item[0] }
          >
            <Video /> <span>{ item[0] }</span>
          </SidebarMenuButton>
          <SidebarMenuAction>
            <LoaderCircle className="animate-spin"/>
          </SidebarMenuAction>
        </SidebarMenuItem>
      );
    } else {
      return (
        <SidebarMenuItem>
          <SidebarMenuButton
            isActive = { context.activeStreamer === item[0] }
            onClick = { () => { context.activeStreamer = item[0]; } }
          >
            <Video />
            <span>{ item[0] }</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    }
  }
}

export function AppSidebar() {
  const context = useContext(AppContext);
  const rootList = [...context.webRTSP.rootList];

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {rootList.map((item) => (
                <StreamerItem
                  key = { item[0] }
                  item = { item } />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
