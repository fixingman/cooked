let id = null;
self.onmessage = ({ data }) => {
  if (data === "start") {
    clearInterval(id);
    id = setInterval(() => self.postMessage("tick"), 500);
  } else if (data === "stop") {
    clearInterval(id);
    id = null;
  }
};
