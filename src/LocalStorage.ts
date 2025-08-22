const ACTIVE_STREAMERS_KEY = "$ActiveStreamers";
const MULTIVIEW_STATE_KEY = "$MultiView";

export function LoadActiveStreamers(): (string | undefined)[] {
  const lsValue = localStorage.getItem(ACTIVE_STREAMERS_KEY);
  if(!lsValue)
    return [];

  const value = JSON.parse(lsValue);
  if(!Array.isArray(value) || !value.every(item => typeof item === 'string'))
    return [];

  return value;
}

export function SaveActiveStreamers(streamers: (string | undefined)[])  {
  localStorage.setItem(ACTIVE_STREAMERS_KEY, JSON.stringify(streamers));
}

export function LoadMultiViewState(): boolean {
  const lsValue = localStorage.getItem(MULTIVIEW_STATE_KEY);
  return lsValue ? true : false;
}

export function SaveMultiViewState(enabled: boolean) {
  if(enabled)
    localStorage.setItem(MULTIVIEW_STATE_KEY, "enabled");
  else
    localStorage.removeItem(MULTIVIEW_STATE_KEY);
}
