const store = {
  metrics: [],
  timestamps: new Set(),
};

export function getStoredMetrics() {
  return store.metrics;
}

export function pushMetricsBatch(batch = []) {
  let added = false;
  for (const item of batch) {
    if (!item || !item.timestamp) continue;
    if (!store.timestamps.has(item.timestamp)) {
      store.metrics.push(item);
      store.timestamps.add(item.timestamp);
      added = true;
    }
  }
  // Keep metrics reasonably bounded
  if (store.metrics.length > 5000) {
    const drop = store.metrics.length - 5000;
    for (let i = 0; i < drop; i++) {
      const it = store.metrics.shift();
      store.timestamps.delete(it.timestamp);
    }
  }
  if (added) {
    try {
      window.dispatchEvent(new CustomEvent("metricsUpdated"));
    } catch (e) {
      // ignore
    }
  }
  return store.metrics;
}

export function subscribe(cb) {
  const handler = () => cb(getStoredMetrics());
  window.addEventListener("metricsUpdated", handler);
  return () => window.removeEventListener("metricsUpdated", handler);
}

export default {
  getStoredMetrics,
  pushMetricsBatch,
  subscribe,
};
