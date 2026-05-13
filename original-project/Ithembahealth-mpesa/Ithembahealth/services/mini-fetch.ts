// services/mini-fetch.ts
type HeadersRec = Record<string, string>;

class MiniResponse {
  constructor(
    public status: number,
    public ok: boolean,
    private _text: string,
    private _json: any,
    public headers: HeadersRec
  ) {}
  async text(){ return this._text; }
  async json(){ return this._json; }
}

function normalizeHeaders(h?: any): HeadersRec {
  const out: HeadersRec = {};
  if (!h) return out;
  Object.keys(h).forEach(k => {
    const v = (h as any)[k];
    if (v != null) out[String(k)] = String(v);
  });
  return out;
}

// narrow arbitrary strings to the allowed union for the Alipay SDK types:
type MyMethod = 'GET' | 'POST';
function toMyMethod(s?: string): MyMethod {
  const m = String(s || 'GET').toUpperCase();
  return (m === 'POST') ? 'POST' : 'GET'; // fallback to GET for anything else
}

export function miniFetch(input: string, init?: RequestInit): Promise<Response> {
  if (typeof input !== 'string' || !input) {
    return Promise.reject(new Error('fetch url must be a non-empty string'));
  }
  if (input.indexOf('https://') !== 0) {
    return Promise.reject(new Error('fetch url must be https'));
  }

  const method: MyMethod = toMyMethod(init?.method as any);   // <-- narrowed
  const timeout = (init && typeof (init as any).timeout === 'number')
    ? (init as any).timeout
    : 20000;

  // Body: object preferred; if string, try JSON parse, else send string
  let data: any = {};
  if (init && (init as any).body !== undefined) {
    const b: any = (init as any).body;
    if (typeof b === 'string') {
      try { data = JSON.parse(b); } catch { data = b; }
    } else if (typeof b === 'object') {
      data = b;
    }
  }

  const headers = normalizeHeaders(init?.headers);
  if (method !== 'GET' && !headers['Content-Type']) headers['Content-Type'] = 'application/json';

  return new Promise((resolve, reject) => {
    my.request({
      url: input,
      method,                 // <-- now typed as 'GET' | 'POST'
      data,
      headers,
      timeout,
      dataType: 'text',       // we’ll parse JSON manually for fetch-like behavior
      success: (res: any) => {
        const status = res.status || res.statusCode || 200;
        const text = typeof res.data === 'string' ? res.data : JSON.stringify(res.data ?? '');
        let parsed: any = null; try { parsed = JSON.parse(text); } catch {}
        resolve(new MiniResponse(status, status >= 200 && status < 300, text, parsed, res.headers || {}) as any);
      },
      fail: (err: any) => reject(err)
    } as any);
  });
}
