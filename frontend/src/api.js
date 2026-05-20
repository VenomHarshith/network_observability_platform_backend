export const getMetrics = async () => {
  const res = await fetch("https://network-observability-api.onrender.com/api/metrics/latest");
  return { data: await res.json() };
};

export const getAlerts = async () => {
  const res = await fetch("https://network-observability-api.onrender.com/api/alerts");
  return { data: await res.json() };
};

export const getProtocols = async () => {
  const res = await fetch("https://network-observability-api.onrender.com/api/protocols");
  return res.ok ? await res.json() : [];
};

export const getTopTalkers = async () => {
  const res = await fetch("https://network-observability-api.onrender.com/api/top-talkers");
  return res.ok ? await res.json() : { src: [], dst: [] };
};

export const getTopology = async () => {
  const res = await fetch("https://network-observability-api.onrender.com/api/topology");
  return res.ok ? await res.json() : [];
};

export const getAlertDetails = async () => {
  const res = await fetch("https://network-observability-api.onrender.com/api/alerts/details");
  return res.ok ? await res.json() : {};
};