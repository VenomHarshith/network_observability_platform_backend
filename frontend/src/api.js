export const getMetrics = async () => {
  const res = await fetch("http://127.0.0.1:8000/api/metrics/latest");
  return { data: await res.json() };
};

export const getAlerts = async () => {
  const res = await fetch("http://127.0.0.1:8000/api/alerts");
  return { data: await res.json() };
};

export const getProtocols = async () => {
  const res = await fetch("http://127.0.0.1:8000/api/protocols");
  return res.ok ? await res.json() : [];
};

export const getTopTalkers = async () => {
  const res = await fetch("http://127.0.0.1:8000/api/top-talkers");
  return res.ok ? await res.json() : { src: [], dst: [] };
};

export const getTopology = async () => {
  const res = await fetch("http://127.0.0.1:8000/api/topology");
  return res.ok ? await res.json() : [];
};

export const getAlertDetails = async () => {
  const res = await fetch("http://127.0.0.1:8000/api/alerts/details");
  return res.ok ? await res.json() : {};
};
