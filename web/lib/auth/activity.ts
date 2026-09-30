// Last API activity, shared across tabs so one busy tab keeps the others from warning.
const CHANNEL = "bc-activity";

let lastActivity = Date.now();
const listeners = new Set<(at: number) => void>();
let channel: BroadcastChannel | null = null;

function getChannel() {
  if (channel || typeof BroadcastChannel === "undefined") return channel;
  channel = new BroadcastChannel(CHANNEL);
  channel.onmessage = (event: MessageEvent<number>) => update(event.data, false);
  return channel;
}

function update(at: number, broadcast: boolean) {
  if (at <= lastActivity) return;
  lastActivity = at;
  if (broadcast) getChannel()?.postMessage(at);
  listeners.forEach((listener) => listener(at));
}

export function markActivity() {
  update(Date.now(), true);
}

export function getLastActivity() {
  return lastActivity;
}

export function onActivity(listener: (at: number) => void) {
  getChannel();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
