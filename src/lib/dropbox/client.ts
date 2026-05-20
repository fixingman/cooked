const API     = "https://api.dropboxapi.com/2";
const CONTENT = "https://content.dropboxapi.com/2";

export async function downloadFile(token: string, path: string): Promise<string | null> {
  const res = await fetch(`${CONTENT}/files/download`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Dropbox-API-Arg": JSON.stringify({ path }),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 409 && text.includes("path/not_found")) return null;
    throw new Error(`Dropbox download ${res.status}`);
  }
  return res.text();
}

export async function uploadFile(token: string, path: string, content: string): Promise<void> {
  const res = await fetch(`${CONTENT}/files/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/octet-stream",
      "Dropbox-API-Arg": JSON.stringify({ path, mode: { ".tag": "overwrite" }, autorename: false, mute: true }),
    },
    body: content,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Dropbox upload ${res.status}: ${body}`);
  }
}

export async function uploadBinary(token: string, path: string, dataUrl: string): Promise<void> {
  const base64 = dataUrl.replace(/^data:[^;]+;base64,/, "");
  const binary = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const res = await fetch(`${CONTENT}/files/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/octet-stream",
      "Dropbox-API-Arg": JSON.stringify({ path, mode: { ".tag": "overwrite" }, autorename: false, mute: true }),
    },
    body: binary,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Dropbox upload binary ${res.status}: ${body}`);
  }
}

export async function getTemporaryLink(token: string, path: string): Promise<string> {
  const res = await fetch(`${API}/files/get_temporary_link`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path }),
  });
  if (!res.ok) throw new Error(`Dropbox temporary link ${res.status}`);
  const data = await res.json();
  return data.link as string;
}

export async function getAccountInfo(token: string): Promise<{ accountId: string; displayName: string }> {
  const res = await fetch(`${API}/users/get_current_account`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Dropbox account info ${res.status}`);
  const data = await res.json();
  return { accountId: data.account_id, displayName: data.name.display_name };
}
