// ../mcp-oauth/src/config.ts
var REQUEST_TIMEOUT_MS = 3e4;
var SIGN_IN_TIMEOUT_MS = 5 * 6e4;

// ../mcp-oauth/src/log.ts
function loggerOf(ctx) {
  const logger = ctx.logger;
  if (typeof logger?.info === "function" && typeof logger.warn === "function") {
    return {
      info: (message, ...args) => logger.info?.(message, ...args),
      warn: (message, ...args) => logger.warn?.(message, ...args)
    };
  }
  return {
    info: (message, ...args) => console.info(message, ...args),
    warn: (message, ...args) => console.warn(message, ...args)
  };
}
function errorText(error) {
  return error instanceof Error ? error.message : String(error);
}

// ../mcp-oauth/src/net.ts
var Network = class {
  /** A JSON GET, or undefined when the document is absent or unreadable. */
  getJSON = async (url) => {
    try {
      const response = await fetch(url, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
      });
      if (!response.ok) return void 0;
      const body = await response.json();
      return body !== null && typeof body === "object" ? body : void 0;
    } catch {
      return void 0;
    }
  };
  /** A JSON POST that must succeed; the response body is returned as JSON. */
  postJSON = async (url, body, what) => {
    let response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json"
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
      });
    } catch (error) {
      throw new Error(`${what} failed: ${errorText(error)}`);
    }
    const text = await response.text();
    if (!response.ok)
      throw new Error(`${what} failed (${response.status}): ${text}`);
    const parsed = JSON.parse(text);
    if (parsed === null || typeof parsed !== "object")
      throw new Error(`${what} returned a non-object`);
    return parsed;
  };
  /** A form POST to a token endpoint, with the same deadline discipline. */
  postForm = async (url, fields, what, authorization) => {
    let response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          accept: "application/json",
          ...authorization === void 0 ? {} : { authorization }
        },
        body: new URLSearchParams(fields),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
      });
    } catch (error) {
      throw new Error(`${what} failed: ${errorText(error)}`);
    }
    const text = await response.text();
    if (!response.ok)
      throw new Error(`${what} failed (${response.status}): ${text}`);
    const parsed = JSON.parse(text);
    if (parsed === null || typeof parsed !== "object")
      throw new Error(`${what} returned a non-object`);
    return parsed;
  };
};
var network = new Network();

// ../mcp-oauth/src/payload.ts
function asRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value : void 0;
}
function pickString(source, ...names) {
  const record = asRecord(source);
  if (record === void 0) return void 0;
  for (const name2 of names) {
    const value = record[name2];
    if (typeof value === "string" && value.trim() !== "") return value.trim();
    if (typeof value === "number") return String(value);
  }
  return void 0;
}
function pickNumber(source, ...names) {
  const record = asRecord(source);
  if (record === void 0) return void 0;
  for (const name2 of names) {
    const value = record[name2];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return void 0;
}

// ../integration-host/src/command.ts
var expiryText = (time) => new Date(time).toLocaleString(void 0, {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZoneName: "short"
});
var ACTIONS = ["status", "login", "logout", "sync"];
var createIntegrationCommand = (spec, auth) => {
  const parseAction = (rawInput) => {
    const first = String(rawInput ?? "").trim().split(/\s+/u)[0] ?? "";
    if (first === "") return "status";
    return ACTIONS.includes(first) ? first : void 0;
  };
  return async ({ rawInput }) => {
    const action2 = parseAction(rawInput);
    if (action2 === void 0) {
      const first = String(rawInput ?? "").trim().split(/\s+/u)[0] ?? "";
      return {
        kind: "error",
        text: `Unknown action "${first}". Use /${spec.name} ${ACTIONS.join("|")}.`
      };
    }
    try {
      if (action2 === "login") {
        void auth.signIn();
        await auth.settleNotice();
        const status2 = await auth.getStatus();
        if (status2.error !== null) return { kind: "error", text: status2.error };
        const text = auth.loginMessage(status2);
        return {
          kind: "success",
          text: status2.inFlight ? `${text}
Run /${spec.name} status when you have approved it.` : text
        };
      }
      if (action2 === "logout") {
        await auth.signOut();
        return { kind: "success", text: `Signed out of ${spec.label}.` };
      }
      if (action2 === "sync") {
        const ok = await auth.connect();
        const status2 = await auth.getStatus();
        return ok ? {
          kind: "success",
          text: `${spec.label} tools ready (${status2.tools.length}).`
        } : {
          kind: "error",
          text: status2.error ?? `Not signed in to ${spec.label}. Run /${spec.name} login.`
        };
      }
      const status = await auth.getStatus();
      if (status.error !== null) return { kind: "error", text: status.error };
      if (!status.signedIn)
        return {
          kind: "success",
          text: `Not connected to ${spec.label}. Run /${spec.name} login to connect.`
        };
      if (!status.connected)
        return {
          kind: "success",
          text: `${spec.label} is connected with a stored credential but not answering. Run /${spec.name} sync.`
        };
      const until = status.expiresAt === null ? "" : ` Token valid until ${expiryText(status.expiresAt)}.`;
      const extra = spec.describe?.(status) ?? "";
      const tail = extra === "" ? "" : ` ${extra}`;
      return {
        kind: "success",
        text: `Connected to ${spec.label}.${until}${tail} ${status.tools.length} tools loaded.`
      };
    } catch (error) {
      return { kind: "error", text: `${spec.label}: ${errorText(error)}` };
    }
  };
};

// ../integration-host/src/markdown.ts
var FENCE = /^\s{0,3}(?:```|~~~)/u;
var OPEN = "<!--";
var CLOSE = "-->";
var uncomment = (lines) => {
  const kept = [];
  let inFence = false;
  let inComment = false;
  for (const line of lines) {
    if (!inComment && FENCE.test(line)) {
      inFence = !inFence;
      kept.push({ text: line, touched: false });
      continue;
    }
    if (inFence) {
      kept.push({ text: line, touched: false });
      continue;
    }
    let rest = line;
    let text = "";
    let touched = false;
    while (rest !== "") {
      if (inComment) {
        const end = rest.indexOf(CLOSE);
        if (end === -1) {
          rest = "";
          break;
        }
        inComment = false;
        rest = rest.slice(end + CLOSE.length);
        continue;
      }
      const start = rest.indexOf(OPEN);
      if (start === -1) {
        text += rest;
        rest = "";
        break;
      }
      text += rest.slice(0, start);
      touched = true;
      inComment = true;
      rest = rest.slice(start + OPEN.length);
    }
    kept.push({ text, touched });
  }
  return kept;
};
var stripHtmlComments = (markdown) => {
  if (!markdown.includes(OPEN)) return markdown;
  const kept = [];
  let inFence = false;
  let blank = false;
  for (const line of uncomment(markdown.split("\n"))) {
    if (FENCE.test(line.text)) {
      inFence = !inFence;
      blank = false;
      kept.push(line.text);
      continue;
    }
    if (inFence) {
      kept.push(line.text);
      continue;
    }
    if (line.text.trim() === "") {
      if (kept.length === 0 || blank) continue;
      blank = true;
      kept.push(line.text);
      continue;
    }
    blank = false;
    kept.push(
      line.touched ? line.text.replace(/[ \t]{2,}(?=\S)/gu, " ") : line.text
    );
  }
  while (kept.length > 0 && kept[kept.length - 1]?.trim() === "") kept.pop();
  return kept.join("\n");
};

// ../integration-host/src/status.ts
var CLIENT_REQUEST_HEADER = "x-dsh-client";
var CLIENT_REQUEST_VALUE = "1";

// ../integration-host/src/route.ts
var MAX_BODY_BYTES = 8 * 1024;
function mountIntegrationRoute(ctx, spec) {
  ctx.inject(["webServer"], (scoped) => {
    const webServer = scoped.get(
      "webServer"
    );
    scoped.effect(
      () => webServer.register({
        kind: "prefix",
        path: spec.prefix,
        handler: spec.handler
      }),
      `${spec.prefix}: route`
    );
  });
}
var BadRequest = class extends Error {
};
function bodyOf(value) {
  return {
    fields: value,
    required: (name2) => {
      const field = value?.[name2];
      if (typeof field !== "string" || field === "")
        throw new BadRequest(`the request needs a "${name2}"`);
      return field;
    }
  };
}
async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = chunk;
    size += buffer.length;
    if (size > MAX_BODY_BYTES)
      throw new BadRequest("request body is larger than this route accepts");
    chunks.push(buffer);
  }
  if (chunks.length === 0) return void 0;
  try {
    const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : void 0;
  } catch {
    return void 0;
  }
}
var READ_METHODS = /* @__PURE__ */ new Set(["GET", "HEAD"]);
function webOrigin(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url : void 0;
  } catch {
    return void 0;
  }
}
function clientRequestRefusal(request) {
  const method = request.method ?? "GET";
  if (READ_METHODS.has(method)) return void 0;
  const headers = request.headers ?? {};
  if (headers[CLIENT_REQUEST_HEADER] !== CLIENT_REQUEST_VALUE)
    return "the request did not come from the harness page";
  const contentType = headers["content-type"];
  if (typeof contentType !== "string" || !contentType.toLowerCase().startsWith("application/json"))
    return "an integration write must carry a JSON body";
  const origin = headers.origin;
  const host = headers.host;
  const originUrl = typeof origin === "string" ? webOrigin(origin) : void 0;
  if (originUrl !== void 0 && typeof host === "string" && originUrl.host !== host)
    return "the request came from another origin";
  const site = headers["sec-fetch-site"];
  if (originUrl !== void 0 && typeof site === "string" && site.toLowerCase() === "cross-site")
    return "cross-site requests are refused";
  return void 0;
}
function createIntegrationRoute(spec) {
  const { prefix, auth } = spec;
  return async (request, response) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    const method = request.method ?? "GET";
    const send = (status, body2) => {
      response.writeHead(status, {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store"
      });
      response.end(JSON.stringify(body2));
    };
    const sendBytes = (status, contentType, body2) => {
      response.writeHead(status, {
        "content-type": contentType,
        "content-length": body2.byteLength,
        "cache-control": "no-store"
      });
      response.end(body2);
    };
    const sendData = async (load) => {
      try {
        send(200, await load());
      } catch (error) {
        send(502, { error: errorText(error) });
      }
    };
    const refusal = clientRequestRefusal(request);
    if (refusal !== void 0) {
      send(403, { error: refusal });
      return;
    }
    let body;
    const context = {
      url,
      method,
      read: () => body ??= readJson(request).then(bodyOf),
      send,
      sendBytes,
      sendData
    };
    try {
      if (url.pathname === `${prefix}/status` && method === "GET") {
        send(200, await auth.getStatus());
        return;
      }
      if (url.pathname === `${prefix}/login` && method === "POST") {
        void auth.signIn();
        await auth.settleNotice(300);
        send(202, await auth.getStatus());
        return;
      }
      if (url.pathname === `${prefix}/cancel` && method === "POST") {
        await auth.cancel?.();
        send(200, await auth.getStatus());
        return;
      }
      if (url.pathname === `${prefix}/logout` && method === "POST") {
        await auth.signOut();
        send(200, await auth.getStatus());
        return;
      }
      if (url.pathname === `${prefix}/sync` && method === "POST") {
        await auth.connect();
        send(200, await auth.getStatus());
        return;
      }
      for (const handler of spec.routes ?? []) {
        if (await handler(context)) return;
      }
      send(404, { error: "not-found", path: url.pathname });
    } catch (error) {
      send(error instanceof BadRequest ? 400 : 500, {
        error: errorText(error)
      });
    }
  };
}

// ../integration-host/src/state.ts
var RuntimeState = class {
  /** The last notice a running attempt published, so a card can show the URL. */
  notice;
  /** The last failure, cleared when a new attempt starts. */
  error;
  /** Settles when the in-flight attempt finishes. */
  running;
  /** Cancels the attempt behind {@link running}, when there is one. */
  controller;
  /** The account facts this connection works with, once known. */
  facts;
  constructor() {
    this.notice = void 0;
    this.error = void 0;
    this.running = void 0;
    this.controller = void 0;
    this.facts = void 0;
  }
};

// src/host/config.ts
var DEFAULT_ENDPOINT = "https://gitlab.com";
var PLUGIN_NAME = "dsh-gitlab";
var API_PATH = "/api/v4";
var resolveConfig = (input) => {
  const endpoint = typeof input?.endpoint === "string" && input.endpoint.trim() !== "" ? input.endpoint.trim().replace(/\/+$/u, "") : DEFAULT_ENDPOINT;
  return { endpoint, debug: input?.debug === true };
};
var apiRootOf = (config) => `${config.endpoint}${API_PATH}`;

// src/host/api.ts
var REQUEST_TIMEOUT_MS2 = 3e4;
var BINARY_TYPE = /^(?:image|audio|video)\/|application\/(?:octet-stream|zip|pdf|gzip)/iu;
var reasonOf = (error) => error instanceof Error ? error.message : String(error);
function positiveHeader(response, name2) {
  const raw = response.headers.get(name2);
  if (raw === null || raw.trim() === "") return void 0;
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : void 0;
}
var GitLabApi = class {
  constructor(deps) {
    this.deps = deps;
  }
  /**
   * Read one document.
   * @param path - the API path, such as `/user`.
   * @param params - query parameters; undefined values are left out.
   */
  async get(path, params) {
    return (await this.getAnswer(path, params)).value;
  }
  /**
   * Read one document and the count GitLab reports beside it.
   *
   * A list endpoint answers with a page and puts the number of matches in
   * `x-total`; a card that says "25 of 137" needs both.
   */
  async getAnswer(path, params) {
    const response = await this.request("GET", path, params);
    const raw = response.headers.get("x-total");
    const total = raw === null || raw.trim() === "" ? void 0 : Number(raw);
    return {
      value: await response.json(),
      ...total !== void 0 && Number.isFinite(total) ? { total } : {}
    };
  }
  /**
   * Read one endpoint without assuming its body is JSON.
   *
   * The generic read tool promises any GET, and not every GET answers JSON: a
   * repository file's raw contents and a job's trace are text, an artifact is
   * bytes. Decoding all of them through `response.json()` was what turned a
   * perfectly good text answer into a parser failure.
   * @param path - the API path.
   * @param params - query parameters; undefined values are left out.
   * @returns the decoded body, the content type, and the paging headers.
   */
  async read(path, params) {
    const response = await this.request("GET", path, params);
    const contentType = response.headers.get("content-type") ?? "";
    const binary = BINARY_TYPE.test(contentType);
    if (binary) {
      await response.body?.cancel().catch(() => void 0);
      return {
        value: "",
        isJson: false,
        contentType,
        text: "",
        isBinary: true,
        ...positiveHeader(response, "x-total") === void 0 ? {} : { total: positiveHeader(response, "x-total") }
      };
    }
    const text = await response.text();
    const page = positiveHeader(response, "x-page");
    const nextPage = positiveHeader(response, "x-next-page");
    const total = positiveHeader(response, "x-total");
    const json = /json/iu.test(contentType) || /^\s*[[{]/u.test(text);
    let value = text;
    let isJson = false;
    if (json) {
      try {
        value = JSON.parse(text);
        isJson = true;
      } catch {
      }
    }
    return {
      value,
      isJson,
      contentType,
      text,
      isBinary: false,
      ...total === void 0 ? {} : { total },
      ...page === void 0 ? {} : { page },
      ...nextPage === void 0 ? {} : { nextPage }
    };
  }
  /**
   * Read every page of one list endpoint.
   *
   * GitLab slices discussions, diffs and jobs at 100 per page and reports the
   * next page in `x-next-page`. Reading only the first page silently loses
   * unresolved threads on a large merge request.
   * @param path - the list's API path.
   * @param params - the filters, without `page` or `per_page`.
   * @param maxPages - the safety cap; a hundred pages is ten thousand rows.
   * @returns the rows from every page that answered.
   */
  async getAll(path, params, maxPages = 100) {
    const items = [];
    let page = 1;
    let truncated = false;
    for (let index = 0; index < maxPages; index += 1) {
      const response = await this.request("GET", path, {
        ...params,
        page,
        per_page: 100
      });
      const body = await response.json();
      if (!Array.isArray(body)) break;
      items.push(...body);
      const next = Number(response.headers.get("x-next-page"));
      if (!Number.isInteger(next) || next <= page) break;
      if (index === maxPages - 1) {
        truncated = true;
        break;
      }
      page = next;
    }
    return { items, truncated };
  }
  /**
   * Write one document.
   * @param path - the API path.
   * @param body - the JSON body, when the endpoint takes one.
   */
  async post(path, body) {
    const response = await this.request("POST", path, void 0, body);
    return await response.json();
  }
  /** Replace part of one document. */
  async put(path, body) {
    const response = await this.request("PUT", path, void 0, body);
    return await response.json();
  }
  /**
   * Read one document that is not JSON.
   * @param path - the API path, such as a job's trace.
   */
  async text(path) {
    const response = await this.request("GET", path);
    return await response.text();
  }
  /** One authenticated call, with the token read at the moment it is made. */
  async request(method, path, params, body) {
    const token = await this.deps.token.read();
    if (token === void 0)
      throw new Error(
        "Персональный токен доступа GitLab не сохранён; вставь его в карточку настроек GitLab. Токен хранится в Harness и недоступен командам оболочки."
      );
    const url = new URL(`${apiRootOf(this.deps.config)}${path}`);
    for (const [name2, value] of Object.entries(params ?? {})) {
      if (value !== void 0) url.searchParams.set(name2, String(value));
    }
    const response = await this.requestOnce(url, method, token, body);
    if (!response.ok) throw await this.failureOf(response);
    return response;
  }
  /** One fetch, with a network failure said as one. */
  async requestOnce(url, method, token, body) {
    try {
      return await fetch(url, {
        method,
        headers: {
          accept: "application/json",
          "private-token": token,
          ...body === void 0 ? {} : { "content-type": "application/json" }
        },
        ...body === void 0 ? {} : { body: JSON.stringify(body) },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS2)
      });
    } catch (error) {
      const seconds = REQUEST_TIMEOUT_MS2 / 1e3;
      const timeout = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError") || /timed? ?out|abort/iu.test(reasonOf(error));
      throw new Error(
        timeout ? `GitLab did not answer ${method} ${url.pathname} within ${seconds} s; the request timed out. The same call can be retried.` : `Could not reach GitLab at ${url.origin} (${method} ${url.pathname}): ${reasonOf(error)}. Check the network or VPN, then retry \u2014 the same call can be retried.`
      );
    }
  }
  /** GitLab's own words about a refusal, as one sentence. */
  async failureOf(response) {
    const text = await response.text().catch(() => "");
    let message = text.trim();
    try {
      const parsed = JSON.parse(text);
      if (parsed !== null && typeof parsed === "object" && typeof parsed.message === "string")
        message = parsed.message;
      else if (parsed !== null && typeof parsed === "object" && typeof parsed.error === "string")
        message = parsed.error;
    } catch {
    }
    if (response.status === 401)
      return new Error(
        `GitLab refused the token (401): ${message === "" ? "it may have expired, or lack the api scope" : message}`
      );
    if (response.status === 403)
      return new Error(
        `GitLab refused the request (403): ${message === "" ? "the token's owner may not be allowed to do this" : message}`
      );
    return new Error(
      `GitLab answered ${response.status} for ${response.url}: ${message}`
    );
  }
};

// src/shared/tools.ts
var GITLAB_LIST_MERGE_REQUESTS_TOOL = "gitlab_list_merge_requests";
var GITLAB_GET_MERGE_REQUEST_TOOL = "gitlab_get_merge_request";
var GITLAB_GET_JOB_LOG_TOOL = "gitlab_get_job_log";
var GITLAB_READ_TOOL = "gitlab_read";
var GITLAB_PRESENT_TOOL = "gitlab_present";
var GITLAB_REVIEW_TOOL = "gitlab_review";

// src/host/account.ts
var GitLabAccount = class _GitLabAccount {
  username;
  name;
  webUrl;
  constructor(params) {
    this.username = params.username;
    this.name = params.name;
    this.webUrl = params.webUrl;
  }
  /**
   * Read the account out of `GET /user`.
   * @param value - the document GitLab answered with.
   * @returns the account it names, or an empty one.
   */
  static parse(value) {
    const record = asRecord(value);
    if (record === void 0) return new _GitLabAccount({});
    const username = pickString(record, "username", "login");
    const name2 = pickString(record, "name");
    const webUrl = pickString(record, "web_url", "webUrl", "url");
    return new _GitLabAccount({
      ...username === void 0 ? {} : { username },
      ...name2 === void 0 ? {} : { name: name2 },
      ...webUrl === void 0 ? {} : { webUrl: webUrl.replace(/\/+$/u, "") }
    });
  }
  /** Whether nothing at all is known yet. */
  get isEmpty() {
    return this.username === void 0 && this.webUrl === void 0;
  }
  /** Whether the username is known, so scoped lists need nothing more. */
  get isComplete() {
    return this.username !== void 0;
  }
};
var readAccount = async (api) => {
  const account = GitLabAccount.parse(await api.get("/user"));
  if (account.isEmpty)
    throw new Error("GitLab не вернул учётную запись для сохранённого токена");
  return account;
};

// src/host/auth.ts
var NO_TOKEN = "GitLab signs in with a personal access token. Create one with the api scope in GitLab \u2192 Preferences \u2192 Access tokens, and paste it in the GitLab settings card.";
var PUBLISHED_TOOLS = [
  GITLAB_LIST_MERGE_REQUESTS_TOOL,
  GITLAB_GET_MERGE_REQUEST_TOOL,
  GITLAB_GET_JOB_LOG_TOOL,
  GITLAB_READ_TOOL,
  GITLAB_PRESENT_TOOL,
  GITLAB_REVIEW_TOOL
];
var GitLabAuth = class {
  constructor(deps) {
    this.deps = deps;
  }
  /**
   * There is no browser flow to start: the credential is typed by the user.
   *
   * The settings card and `/gitlab login` both land here, and both answer with
   * where the token goes rather than pretending to open a page.
   */
  async signIn() {
    this.deps.state.notice = { message: NO_TOKEN };
    return { status: "unavailable" };
  }
  /**
   * Store one pasted token, then find out whether GitLab accepts it.
   *
   * The status is answered either way: a token GitLab refuses is a fact the
   * card must show, not an error the request failed with.
   */
  async saveToken(token) {
    const { token: store, state } = this.deps;
    await store.save(token);
    state.notice = void 0;
    state.error = void 0;
    await this.connect();
    return await this.getStatus();
  }
  /** Forget the token and everything learned with it. */
  async signOut() {
    const { state, token } = this.deps;
    await token.clear();
    state.notice = void 0;
    state.error = void 0;
    state.facts = void 0;
  }
  /**
   * Verify the stored token and learn the account it belongs to.
   * @returns whether GitLab accepted the token.
   */
  async connect() {
    const { state, api, ctx, token } = this.deps;
    state.error = void 0;
    if (await token.read() === void 0) {
      state.facts = void 0;
      return false;
    }
    try {
      const account = await readAccount(api);
      state.facts = account;
      state.notice = void 0;
      return true;
    } catch (error) {
      state.facts = void 0;
      state.error = errorText(error);
      loggerOf(ctx).warn("[gitlab] %s", state.error);
      return false;
    }
  }
  /** Build the status document for one caller. */
  async getStatus() {
    const { state, config, token } = this.deps;
    const stored = await token.read();
    const account = state.facts;
    return {
      signedIn: stored !== void 0,
      inFlight: false,
      expiresAt: null,
      scope: null,
      notice: state.notice ?? null,
      error: state.error ?? null,
      connected: account !== void 0 && !account.isEmpty,
      tools: [...PUBLISHED_TOOLS],
      endpoint: config.endpoint,
      username: account?.username ?? null,
      userName: account?.name ?? null,
      userUrl: account?.webUrl ?? null
    };
  }
  /** The line a sign-in request answers with. */
  loginMessage(status) {
    return status.notice?.message ?? NO_TOKEN;
  }
  /** Nothing is in flight without a browser flow, so nothing is waited for. */
  async settleNotice() {
  }
};

// src/host/presentation/parse.ts
var markdownOf = (value) => value === void 0 ? void 0 : stripHtmlComments(value);
var WRAPPERS = [
  "data",
  "result",
  "payload",
  "merge_request",
  "mergeRequest",
  "project",
  "node"
];
var PROJECT_FIELDS = [
  "project_full_path",
  "projectFullPath",
  "project_path",
  "projectPath",
  "path_with_namespace",
  "pathWithNamespace",
  "full_path",
  "fullPath",
  "project"
];
var IID_FIELDS = [
  "iid",
  "merge_request_iid",
  "mergeRequestIid",
  "number"
];
var REFERENCE = /^(?<project>[^!]+)!(?<iid>\d+)$/u;
var WEB_URL = /^https?:\/\/[^/]+\/(?<project>.+?)\/-\/merge_requests\/(?<iid>\d+)/u;
function rootsOf(value) {
  return value === null || typeof value !== "object" ? [] : [value];
}
function arrayIn(roots, ...names) {
  for (const root of roots) {
    if (Array.isArray(root)) return root;
    const record = asRecord(root);
    if (record === void 0) continue;
    for (const name2 of names) {
      const found = record[name2];
      if (Array.isArray(found)) return found;
    }
    for (const wrapper of WRAPPERS) {
      const nested = asRecord(record[wrapper]);
      if (nested === void 0) continue;
      for (const name2 of names) {
        const found = nested[name2];
        if (Array.isArray(found)) return found;
      }
    }
  }
  return [];
}
function recordIn(roots, ...names) {
  for (const root of roots) {
    const record = asRecord(root);
    if (record === void 0) continue;
    for (const name2 of names) {
      const nested = asRecord(record[name2]);
      if (nested !== void 0) return nested;
    }
    return record;
  }
  return void 0;
}
function subjectOf(record) {
  const project = pickString(record, ...PROJECT_FIELDS);
  const iid = pickNumber(record, ...IID_FIELDS);
  if (project !== void 0 && iid !== void 0) return { project, iid };
  const reference = pickString(record, "reference", "reference_full", "full");
  const parsed = reference === void 0 ? void 0 : REFERENCE.exec(reference);
  if (parsed?.groups !== void 0)
    return {
      project: parsed.groups.project ?? "",
      iid: Number(parsed.groups.iid)
    };
  const url = pickString(record, "web_url", "webUrl", "url");
  const fromUrl = url === void 0 ? void 0 : WEB_URL.exec(url);
  if (fromUrl?.groups !== void 0)
    return {
      project: fromUrl.groups.project ?? "",
      iid: Number(fromUrl.groups.iid)
    };
  const references = asRecord(record.references);
  const full = references === void 0 ? void 0 : pickString(references, "full");
  const nested = full === void 0 ? void 0 : REFERENCE.exec(full);
  if (nested?.groups !== void 0)
    return {
      project: nested.groups.project ?? "",
      iid: Number(nested.groups.iid)
    };
  return void 0;
}
function personOf(value) {
  if (typeof value === "string" && value !== "") return { username: value };
  const record = asRecord(value);
  if (record === void 0) return void 0;
  const username = pickString(record, "username", "login", "name");
  if (username === void 0) return void 0;
  const name2 = pickString(record, "name");
  return {
    username,
    ...name2 === void 0 ? {} : { name: name2 },
    ...record.bot === true ? { bot: true } : {}
  };
}
function peopleOf(value) {
  if (!Array.isArray(value)) return [];
  const people = [];
  for (const candidate of value) {
    const person2 = personOf(candidate);
    if (person2 !== void 0) people.push(person2);
  }
  return people;
}
function labelsOf(record) {
  const raw = record.labels ?? record.label_names ?? record.labelNames;
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => typeof item === "string" ? item : pickString(item, "name")).filter((item) => item !== void 0 && item !== "");
}
function pipelineStatusOf(record) {
  const direct = pickString(record, "pipeline_status", "pipelineStatus");
  if (direct !== void 0) return direct;
  const head = asRecord(record.head_pipeline) ?? asRecord(record.headPipeline) ?? asRecord(record.pipeline);
  return head === void 0 ? void 0 : pickString(head, "status");
}
function mergeRequestCardOf(record) {
  const subject = subjectOf(record);
  const title = pickString(record, "title");
  if (subject === void 0 || title === void 0) return void 0;
  const url = pickString(record, "web_url", "webUrl", "url");
  const state = pickString(record, "state");
  const author = personOf(record.author)?.username;
  const sourceBranch = pickString(record, "source_branch", "sourceBranch");
  const targetBranch = pickString(record, "target_branch", "targetBranch");
  const updatedAt = pickString(record, "updated_at", "updatedAt");
  const notes = pickNumber(record, "user_notes_count", "userNotesCount");
  const unresolved = pickNumber(
    record,
    "unresolved_discussions_count",
    "unresolvedDiscussionsCount"
  );
  const pipeline2 = pipelineStatusOf(record);
  const reviewers = peopleOf(record.reviewers).map((person2) => person2.username);
  const draft = record.draft === true || record.work_in_progress === true || title.startsWith("Draft:") || title.startsWith("WIP:");
  return {
    project: subject.project,
    iid: subject.iid,
    title,
    draft,
    ...url === void 0 ? {} : { url },
    ...state === void 0 ? {} : { state },
    ...author === void 0 ? {} : { author },
    ...reviewers.length === 0 ? {} : { reviewers },
    ...sourceBranch === void 0 ? {} : { sourceBranch },
    ...targetBranch === void 0 ? {} : { targetBranch },
    ...pipeline2 === void 0 ? {} : { pipeline: pipeline2 },
    ...updatedAt === void 0 ? {} : { updatedAt },
    ...notes === void 0 ? {} : { notes },
    ...unresolved === void 0 ? {} : { unresolved }
  };
}
function parseMergeRequestList(value) {
  const roots = rootsOf(value);
  const records = arrayIn(
    roots,
    "merge_requests",
    "mergeRequests",
    "items",
    "nodes"
  );
  const items = [];
  for (const candidate of records) {
    const record = asRecord(candidate);
    if (record === void 0) continue;
    const card = mergeRequestCardOf(record);
    if (card !== void 0) items.push(card);
  }
  const page = recordIn(
    roots,
    "page_info",
    "pageInfo",
    "metadata",
    "pagination"
  );
  const total = page === void 0 ? void 0 : pickNumber(page, "total", "total_count");
  return { items, ...total === void 0 ? {} : { total } };
}
function parseMergeRequestCard(value) {
  const roots = rootsOf(value);
  const record = recordIn(roots, "merge_request", "mergeRequest", "node");
  return record === void 0 ? void 0 : mergeRequestCardOf(record);
}
function parseMergeRequestDetail(value, fallback2) {
  const roots = rootsOf(value);
  const record = recordIn(roots, "merge_request", "mergeRequest", "node");
  if (record === void 0) return void 0;
  const title = pickString(record, "title");
  if (title === void 0) return void 0;
  const subject = subjectOf(record) ?? fallback2;
  const url = pickString(record, "web_url", "webUrl", "url");
  const state = pickString(record, "state");
  const author = personOf(record.author);
  const sourceBranch = pickString(record, "source_branch", "sourceBranch");
  const targetBranch = pickString(record, "target_branch", "targetBranch");
  const createdAt = pickString(record, "created_at", "createdAt");
  const updatedAt = pickString(record, "updated_at", "updatedAt");
  const mergeStatus = pickString(
    record,
    "detailed_merge_status",
    "detailedMergeStatus",
    "merge_status",
    "mergeStatus"
  );
  const userNotesCount = pickNumber(
    record,
    "user_notes_count",
    "userNotesCount"
  );
  const diffHeadSha = pickString(record, "diff_head_sha", "diffHeadSha", "sha");
  const description = markdownOf(pickString(record, "description"));
  return {
    project: subject.project,
    iid: subject.iid,
    title,
    draft: record.draft === true || record.work_in_progress === true,
    hasConflicts: record.has_conflicts === true || record.hasConflicts === true,
    assignees: peopleOf(record.assignees),
    reviewers: peopleOf(record.reviewers),
    labels: labelsOf(record),
    ...url === void 0 ? {} : { url },
    ...state === void 0 ? {} : { state },
    ...author === void 0 ? {} : { author },
    ...sourceBranch === void 0 ? {} : { sourceBranch },
    ...targetBranch === void 0 ? {} : { targetBranch },
    ...createdAt === void 0 ? {} : { createdAt },
    ...updatedAt === void 0 ? {} : { updatedAt },
    ...mergeStatus === void 0 ? {} : { mergeStatus },
    ...userNotesCount === void 0 ? {} : { userNotesCount },
    ...diffHeadSha === void 0 ? {} : { diffHeadSha },
    ...description === void 0 ? {} : { description }
  };
}
function countLines(patch) {
  let added = 0;
  let removed = 0;
  let started = false;
  for (const line of patch.split(/\r?\n/u)) {
    if (line.startsWith("@@")) {
      started = true;
      continue;
    }
    if (!started && (line.startsWith("--- ") || line.startsWith("+++ ") || line.startsWith("diff --git") || line.startsWith("index ")))
      continue;
    if (line.startsWith("+")) added += 1;
    else if (line.startsWith("-")) removed += 1;
  }
  return { added, removed };
}
function diffFileOf(record) {
  const path = pickString(record, "new_path", "newPath", "path", "file_path") ?? pickString(record, "old_path", "oldPath");
  if (path === void 0) return void 0;
  const oldPath = pickString(record, "old_path", "oldPath");
  const patch = pickString(record, "diff", "patch", "full_patch", "fullPatch");
  const counted = patch === void 0 ? void 0 : countLines(patch);
  return {
    path,
    newFile: record.new_file === true || record.newFile === true,
    deletedFile: record.deleted_file === true || record.deletedFile === true,
    renamedFile: record.renamed_file === true || record.renamedFile === true,
    added: pickNumber(record, "additions", "added", "added_lines") ?? counted?.added ?? 0,
    removed: pickNumber(record, "deletions", "removed", "removed_lines") ?? counted?.removed ?? 0,
    ...oldPath === void 0 ? {} : { oldPath },
    ...patch === void 0 ? {} : { patch }
  };
}
function parseDiffFiles(value) {
  const records = arrayIn(
    rootsOf(value),
    "diffs",
    "files",
    "changes",
    "diff_files"
  );
  const files = [];
  for (const candidate of records) {
    const record = asRecord(candidate);
    if (record === void 0) continue;
    const file = diffFileOf(record);
    if (file !== void 0) files.push(file);
  }
  return files;
}
function positionOf(record) {
  const position2 = asRecord(record.position) ?? asRecord(record.diff_position) ?? asRecord(record.diffPosition);
  if (position2 === void 0) return void 0;
  const file = pickString(position2, "new_path", "newPath", "path", "file_path");
  const oldLine = pickNumber(position2, "old_line", "oldLine");
  const newLine = pickNumber(position2, "new_line", "newLine");
  if (file === void 0 && oldLine === void 0 && newLine === void 0)
    return void 0;
  return {
    ...file === void 0 ? {} : { file },
    ...oldLine === void 0 ? {} : { oldLine },
    ...newLine === void 0 ? {} : { newLine }
  };
}
function threadOf(record) {
  const discussion2 = asRecord(record.discussion) ?? asRecord(record.discussion_thread);
  const id = pickString(record, "discussion_id", "discussionId") ?? (discussion2 === void 0 ? void 0 : pickString(discussion2, "id", "discussion_id"));
  if (id === void 0) return void 0;
  return {
    id,
    resolved: record.resolved === true || discussion2?.resolved === true,
    resolvable: discussion2?.resolvable !== false && record.resolvable !== false
  };
}
function noteOf(record) {
  const body = markdownOf(pickString(record, "body", "note", "text"));
  if (body === void 0) return void 0;
  const id = pickString(record, "id", "note_id");
  const author = personOf(record.author);
  const createdAt = pickString(record, "created_at", "createdAt");
  const position2 = positionOf(record);
  return {
    body,
    system: record.system === true,
    internal: record.internal === true || record.confidential === true,
    ...id === void 0 ? {} : { id },
    ...author === void 0 ? {} : { author },
    ...createdAt === void 0 ? {} : { createdAt },
    ...position2 === void 0 ? {} : { position: position2 }
  };
}
function parseDiscussions(value) {
  const roots = rootsOf(value);
  const threads = arrayIn(roots, "discussions", "discussion_threads");
  const threadsById = /* @__PURE__ */ new Map();
  const order = [];
  const upsert = (id, patch) => {
    const existing = threadsById.get(id);
    if (existing === void 0) {
      order.push(id);
      threadsById.set(id, {
        id,
        resolved: patch.resolved === true,
        resolvable: patch.resolvable !== false,
        notes: patch.note === void 0 ? [] : [patch.note]
      });
      return;
    }
    threadsById.set(id, {
      ...existing,
      resolved: existing.resolved || patch.resolved === true,
      resolvable: existing.resolvable && patch.resolvable !== false,
      notes: patch.note === void 0 ? existing.notes : [...existing.notes, patch.note]
    });
  };
  if (threads.length > 0) {
    for (const candidate of threads) {
      const record = asRecord(candidate);
      if (record === void 0) continue;
      const id = pickString(record, "id", "discussion_id");
      if (id === void 0) continue;
      const notes2 = Array.isArray(record.notes) ? record.notes : [];
      const parsed = [];
      let resolvable = 0;
      let unresolved = 0;
      for (const note2 of notes2) {
        const record2 = asRecord(note2);
        if (record2 === void 0) continue;
        if (record2.resolvable === true) {
          resolvable += 1;
          if (record2.resolved !== true) unresolved += 1;
        }
        const read = noteOf(record2);
        if (read !== void 0) parsed.push(read);
      }
      const resolved = resolvable > 0 ? unresolved === 0 : record.resolved === true;
      upsert(id, {
        resolved,
        resolvable: resolvable > 0 || record.resolvable === true
      });
      for (const note2 of parsed) upsert(id, { resolved, note: note2 });
    }
    return order.map((id) => threadsById.get(id));
  }
  const notes = arrayIn(roots, "notes", "items");
  for (const candidate of notes) {
    const record = asRecord(candidate);
    if (record === void 0) continue;
    const thread = threadOf(record);
    const note2 = noteOf(record);
    if (thread === void 0 || note2 === void 0) continue;
    upsert(thread.id, {
      resolved: thread.resolved,
      resolvable: thread.resolvable,
      note: note2
    });
  }
  return order.map((id) => threadsById.get(id));
}
function pipelineOf(record) {
  const id = pickNumber(record, "id", "pipeline_id");
  const status = pickString(record, "status", "state");
  if (id === void 0 || status === void 0) return void 0;
  const url = pickString(record, "web_url", "webUrl", "url");
  const source = pickString(record, "source");
  const ref = pickString(record, "ref");
  return {
    id,
    status,
    jobs: parseJobs(record.jobs),
    ...url === void 0 ? {} : { url },
    ...source === void 0 ? {} : { source },
    ...ref === void 0 ? {} : { ref }
  };
}
function jobOf(record) {
  const id = pickNumber(record, "id", "job_id");
  const name2 = pickString(record, "name", "job_name");
  const status = pickString(record, "status", "state");
  if (id === void 0 || name2 === void 0 || status === void 0)
    return void 0;
  const stage = pickString(record, "stage");
  const failureReason = pickString(
    record,
    "failure_reason",
    "failureReason",
    "failure_message"
  );
  const url = pickString(record, "web_url", "webUrl", "url");
  return {
    id,
    name: name2,
    status,
    allowFailure: record.allow_failure === true || record.allowFailure === true,
    ...stage === void 0 ? {} : { stage },
    ...failureReason === void 0 ? {} : { failureReason },
    ...url === void 0 ? {} : { url }
  };
}
function parseJob(value) {
  const record = recordIn(rootsOf(value), "job", "node");
  return record === void 0 ? void 0 : jobOf(record);
}
function parseJobs(value) {
  const records = Array.isArray(value) ? value : arrayIn(rootsOf(value), "jobs", "items");
  const jobs = [];
  for (const candidate of records) {
    const record = asRecord(candidate);
    if (record === void 0) continue;
    const job2 = jobOf(record);
    if (job2 !== void 0) jobs.push(job2);
  }
  return jobs;
}
function parsePipeline(value) {
  const roots = rootsOf(value);
  const records = arrayIn(roots, "pipelines", "items");
  for (const candidate of records) {
    const record = asRecord(candidate);
    if (record === void 0) continue;
    const pipeline2 = pipelineOf(record);
    if (pipeline2 !== void 0) return pipeline2;
  }
  const single = recordIn(roots, "pipeline", "head_pipeline", "headPipeline");
  return single === void 0 ? null : pipelineOf(single) ?? null;
}
function parseReference(value) {
  const trimmed = value.trim();
  const reference = REFERENCE.exec(trimmed);
  if (reference?.groups !== void 0)
    return {
      project: reference.groups.project ?? "",
      iid: Number(reference.groups.iid)
    };
  const url = WEB_URL.exec(trimmed);
  if (url?.groups !== void 0)
    return { project: url.groups.project ?? "", iid: Number(url.groups.iid) };
  return void 0;
}
function findingOf(discussion2, subject) {
  const note2 = discussion2.notes.find((candidate) => !candidate.system);
  if (note2 === void 0) return void 0;
  const position2 = note2.position;
  const line = position2?.newLine ?? position2?.oldLine;
  const lineSide = position2?.newLine !== void 0 ? "new" : position2?.oldLine !== void 0 ? "old" : void 0;
  return {
    kind: "finding",
    finding: {
      project: subject.project,
      iid: subject.iid,
      discussionId: discussion2.id,
      resolved: discussion2.resolved,
      body: note2.body,
      ...note2.author === void 0 ? {} : { author: note2.author.username },
      ...position2?.file === void 0 ? {} : { file: position2.file },
      ...line === void 0 ? {} : { line },
      ...lineSide === void 0 ? {} : { lineSide }
    }
  };
}
function approverOf(value) {
  const record = asRecord(value);
  if (record === void 0) return personOf(value);
  return personOf(record.user) ?? personOf(record);
}
function parseApprovals(value, viewer) {
  const record = asRecord(value);
  if (record === void 0) return void 0;
  const approvedBy = [];
  const listed = Array.isArray(record.approved_by) ? record.approved_by : Array.isArray(record.approvedBy) ? record.approvedBy : [];
  for (const candidate of listed) {
    const person2 = approverOf(candidate);
    if (person2 !== void 0) approvedBy.push(person2);
  }
  const required2 = pickNumber(
    record,
    "approvals_required",
    "approvalsRequired"
  );
  const left = pickNumber(record, "approvals_left", "approvalsLeft");
  return {
    approvedByViewer: viewer !== void 0 && approvedBy.some((person2) => person2.username === viewer),
    approved: record.approved === true,
    approvedBy,
    ...required2 === void 0 ? {} : { required: required2 },
    ...left === void 0 ? {} : { left }
  };
}

// src/host/panels/panel.ts
var MAX_TRACE_CHARS = 64 * 1024;
var mrPath = (project, iid) => `/projects/${encodeURIComponent(project)}/merge_requests/${iid}`;
var PanelApi = class {
  constructor(deps) {
    this.deps = deps;
  }
  /**
   * Load one merge request with the two facets the panel opens on.
   * @param project - full path of the project.
   * @param iid - the merge request's project-local id.
   */
  async mergeRequest(project, iid) {
    const base = await this.deps.api.get(mrPath(project, iid));
    const mr = parseMergeRequestDetail(base, { project, iid });
    if (mr === void 0)
      throw new Error(`GitLab returned no merge request for ${project}!${iid}`);
    const diffPage = await this.deps.api.getAll(
      `${mrPath(project, iid)}/diffs`
    );
    const discussionPage = await this.deps.api.getAll(
      `${mrPath(project, iid)}/discussions`
    );
    const diffs = parseDiffFiles({ diffs: diffPage.items });
    const discussions = parseDiscussions({
      discussions: discussionPage.items
    });
    const approvals2 = await this.approvals(project, iid);
    return {
      kind: "merge_request",
      mr,
      diffs,
      discussions,
      ...approvals2.value === void 0 ? {} : { approvals: approvals2.value },
      ...approvals2.error === void 0 ? {} : { approvalsError: approvals2.error },
      ...diffPage.truncated || discussionPage.truncated ? { truncated: true } : {}
    };
  }
  /**
   * Who has approved the merge request, or why GitLab would not say.
   *
   * Which of the two approval actions is applicable depends on whether the
   * reader's own approval is on the merge request, so the panel reads it rather
   * than offering both. A refused read (a token without `read_api`, a project
   * with approvals disabled) is reported as such instead of as "nobody".
   */
  async approvals(project, iid) {
    try {
      const value = parseApprovals(
        await this.deps.api.get(`${mrPath(project, iid)}/approvals`),
        this.deps.state.facts?.username
      );
      if (value === void 0)
        throw new Error("GitLab не вернул документ с одобрениями");
      return { value };
    } catch (error) {
      loggerOf(this.deps.ctx).warn(
        "[gitlab] не удалось прочитать одобрения для %s!%d: %s",
        project,
        iid,
        errorText(error)
      );
      return { error: errorText(error) };
    }
  }
  /**
   * Load the merge request's newest pipeline and its jobs.	 * @param project - full path of the project.
   * @param iid - the merge request's project-local id.
   */
  async pipeline(project, iid) {
    const listed = parsePipeline(
      await this.deps.api.get(`${mrPath(project, iid)}/pipelines`, {
        per_page: 20
      })
    );
    if (listed === null)
      return { kind: "pipeline", project, iid, pipeline: null };
    const jobs = await this.jobs(project, listed.id);
    return { kind: "pipeline", project, iid, pipeline: { ...listed, jobs } };
  }
  /**
   * Load one job and the end of its trace.
   * @param project - full path of the project.
   * @param jobId - the job's own id, as the pipeline listed it.
   */
  async jobLog(project, jobId) {
    const path = `/projects/${encodeURIComponent(project)}/jobs/${jobId}`;
    const job2 = parseJob(await this.deps.api.get(path));
    if (job2 === void 0)
      throw new Error(`GitLab returned no job ${jobId} in ${project}`);
    const trace = await this.deps.api.text(`${path}/trace`);
    const log = trace.length > MAX_TRACE_CHARS ? trace.slice(trace.length - MAX_TRACE_CHARS) : trace;
    return {
      kind: "job_log",
      project,
      job: job2,
      log,
      truncated: log.length < trace.length
    };
  }
  /** The jobs of one pipeline, by its own id. */
  async jobs(project, pipelineId) {
    const answer = await this.deps.api.getAll(
      `/projects/${encodeURIComponent(project)}/pipelines/${pipelineId}/jobs`
    );
    return [...parseJobs(answer.items)];
  }
};

// src/host/review.ts
var SUMMARY = {
  comment: "Comment on the merge request",
  reply: "Reply in the discussion thread",
  resolve: "Resolve the discussion thread",
  unresolve: "Reopen the discussion thread",
  approve: "Approve the merge request",
  unapprove: "Remove your approval"
};
var ReviewRefusal = class extends Error {
};
function idText(answer) {
  const id = pickNumber(asRecord(answer), "id");
  return id === void 0 ? "" : ` (id ${id})`;
}
var QUICK_ACTION = /^\s*\//mu;
var REPEAT_WINDOW_MS = 6e4;
var AMBIGUOUS_FAILURE = /timed? ?out|abort|fetch failed|network|econnreset|socket|terminated/iu;
var reasonOf2 = (error) => error instanceof Error ? error.message : String(error);
var subjectOf2 = (project, iid) => `${project}!${iid}`;
var ReviewService = class {
  constructor(api) {
    this.api = api;
  }
  /** The last action this process sent, so the same confirm twice is caught. */
  performed;
  /**
   * Perform one social action, or describe it when it was not confirmed.
   * @param request - what to do, and to which merge request.
   * @param confirm - whether the user has seen and approved this exact draft.
   * @returns the draft, and what GitLab answered when the action was performed.
   * @throws when the action was already sent moments ago, or when GitLab's
   *   answer was ambiguous enough that repeating could duplicate it.
   */
  async submit(request, confirm) {
    const draft = this.draft(request);
    if (!confirm) return { performed: false, draft };
    const key = this.keyOf(request, draft);
    const last = this.performed;
    if (last !== void 0 && last.key === key && Date.now() - last.at < REPEAT_WINDOW_MS)
      throw new ReviewRefusal(
        `this exact ${request.action} was already sent to ${draft.subject} seconds ago; GitLab would receive it twice. Re-read the merge request before repeating it.`
      );
    try {
      const result = await this.perform(request, draft);
      this.performed = { key, at: Date.now() };
      return { performed: true, draft, result };
    } catch (error) {
      if (AMBIGUOUS_FAILURE.test(reasonOf2(error)))
        throw new Error(
          `GitLab did not confirm the ${request.action} on ${draft.subject}: ${reasonOf2(error)} The action may already have been performed \u2014 re-read the merge request before calling again, or it will be posted twice.`
        );
      throw error;
    }
  }
  /** What makes one action identical to another: the thread and the exact text. */
  keyOf(request, draft) {
    return [
      request.action,
      draft.subject,
      draft.discussionId ?? "",
      draft.body ?? ""
    ].join("\0");
  }
  /**
   * Describe one action in the words the user reads before it is sent.
   * @param request - what to do, and to which merge request.
   * @throws when the action is missing a field GitLab requires.
   */
  draft(request) {
    const subject = subjectOf2(request.project, request.iid);
    const body = request.body?.trim();
    const discussionId = request.discussionId?.trim();
    if (request.action === "comment" || request.action === "reply") {
      if (body === void 0 || body === "")
        throw new ReviewRefusal(`a ${request.action} needs its text`);
      if (QUICK_ACTION.test(body))
        throw new ReviewRefusal(
          "GitLab refuses a note whose line starts with a slash, because it would run a quick action"
        );
    }
    if (request.action === "reply" && (discussionId === void 0 || discussionId === ""))
      throw new ReviewRefusal("a reply needs the discussion it answers");
    if ((request.action === "resolve" || request.action === "unresolve") && (discussionId === void 0 || discussionId === ""))
      throw new ReviewRefusal(
        `a ${request.action} needs the discussion it names`
      );
    return {
      action: request.action,
      summary: SUMMARY[request.action],
      subject,
      ...body === void 0 || body === "" ? {} : { body },
      ...discussionId === void 0 || discussionId === "" ? {} : { discussionId }
    };
  }
  /** Send one validated action, and say what GitLab answered. */
  async perform(request, draft) {
    const base = `/projects/${encodeURIComponent(request.project)}/merge_requests/${request.iid}`;
    if (request.action === "approve") {
      await this.api.post(`${base}/approve`);
      return "Approved.";
    }
    if (request.action === "unapprove") {
      await this.api.post(`${base}/unapprove`);
      return "Approval removed.";
    }
    if (request.action === "comment") {
      const note3 = await this.api.post(`${base}/notes`, { body: draft.body });
      return `Note posted${idText(note3)}.`;
    }
    const discussionId = draft.discussionId;
    if (discussionId === void 0)
      throw new ReviewRefusal(
        `a ${request.action} needs the discussion it names`
      );
    const thread = `${base}/discussions/${encodeURIComponent(discussionId)}`;
    if (request.action === "resolve" || request.action === "unresolve") {
      await this.api.put(thread, { resolved: request.action === "resolve" });
      return request.action === "resolve" ? "Discussion resolved." : "Discussion reopened.";
    }
    const note2 = await this.api.post(`${thread}/notes`, { body: draft.body });
    return `Reply posted${idText(note2)}.`;
  }
};

// src/host/surface/command.ts
var COMMAND_NAME = "gitlab";
var describe = (status) => status.username === null ? "" : `Account: ${status.username}.`;
var createCommandHandler = (auth) => {
  return createIntegrationCommand(
    { name: COMMAND_NAME, label: "GitLab", describe },
    auth
  );
};

// ../integration-host/src/shape.ts
var required = (read) => ({
  read,
  isRequired: true
});
var optional = (read) => ({
  read,
  isRequired: false
});
var fallback = (read, value) => ({
  read: (input) => read(input) ?? value,
  isRequired: true
});
var isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
var string = (value) => typeof value === "string" ? value : void 0;
var nonEmptyString = (value) => typeof value === "string" && value !== "" ? value : void 0;
var number = (value) => typeof value === "number" && Number.isFinite(value) ? value : void 0;
var notFalse = (value) => value !== false;
var isTrue = (value) => value === true;
var trueOnly = (value) => value === true ? true : void 0;
var literal = (value) => (input) => input === value ? value : void 0;
var list = (read) => (value) => {
  if (!Array.isArray(value)) return [];
  const items = [];
  for (const candidate of value) {
    const item = read(candidate);
    if (item !== void 0) items.push(item);
  }
  return items;
};
var object = (fields) => (value) => {
  if (!isRecord(value)) return void 0;
  const result = {};
  for (const key of Object.keys(fields)) {
    const field = fields[key];
    const parsed = field.read(value[key]);
    if (parsed === void 0) {
      if (field.isRequired) return void 0;
      continue;
    }
    result[key] = parsed;
  }
  return result;
};

// src/shared/panel.ts
var PANEL_TABS = [
  "overview",
  "diff",
  "discussions",
  "pipeline"
];
function isPanelTab(value) {
  return typeof value === "string" && PANEL_TABS.includes(value);
}
var REVIEW_ACTIONS = [
  "comment",
  "reply",
  "resolve",
  "unresolve",
  "approve",
  "unapprove"
];
function isFinding(discussion2) {
  return discussion2.notes.some(
    (note2) => !note2.system && note2.position !== void 0
  );
}
function isReviewAction(value) {
  return typeof value === "string" && REVIEW_ACTIONS.includes(value);
}
var person = object({
  username: required(nonEmptyString),
  name: optional(nonEmptyString),
  bot: optional(trueOnly)
});
var position = object({
  file: optional(nonEmptyString),
  oldLine: optional(number),
  newLine: optional(number)
});
var readPosition = (value) => {
  const parsed = position(value);
  return parsed !== void 0 && Object.keys(parsed).length > 0 ? parsed : void 0;
};
var note = object({
  id: optional(nonEmptyString),
  author: optional(person),
  body: required(nonEmptyString),
  createdAt: optional(nonEmptyString),
  system: required(isTrue),
  internal: required(isTrue),
  position: optional(readPosition)
});
var discussion = object({
  id: required(nonEmptyString),
  resolved: required(isTrue),
  resolvable: required(notFalse),
  notes: required(list(note))
});
var diffFile = object({
  path: required(nonEmptyString),
  oldPath: optional(nonEmptyString),
  newFile: required(isTrue),
  deletedFile: required(isTrue),
  renamedFile: required(isTrue),
  added: fallback(number, 0),
  removed: fallback(number, 0),
  patch: optional(nonEmptyString)
});
var job = object({
  id: required(number),
  name: required(nonEmptyString),
  stage: optional(nonEmptyString),
  status: required(nonEmptyString),
  failureReason: optional(nonEmptyString),
  url: optional(nonEmptyString),
  allowFailure: required(isTrue)
});
var pipeline = object({
  id: required(number),
  status: required(nonEmptyString),
  url: optional(nonEmptyString),
  source: optional(nonEmptyString),
  ref: optional(nonEmptyString),
  jobs: required(list(job))
});
var readPipeline = (value) => pipeline(value) ?? null;
var mergeRequest = object({
  project: required(nonEmptyString),
  iid: required(number),
  title: required(nonEmptyString),
  url: optional(nonEmptyString),
  state: optional(nonEmptyString),
  draft: required(isTrue),
  author: optional(person),
  assignees: required(list(person)),
  reviewers: required(list(person)),
  labels: required(list(string)),
  sourceBranch: optional(nonEmptyString),
  targetBranch: optional(nonEmptyString),
  createdAt: optional(nonEmptyString),
  updatedAt: optional(nonEmptyString),
  mergeStatus: optional(nonEmptyString),
  hasConflicts: required(isTrue),
  userNotesCount: optional(number),
  diffHeadSha: optional(nonEmptyString),
  description: optional(nonEmptyString)
});
var tab = (value) => isPanelTab(value) ? value : void 0;
var approvals = object({
  approvedByViewer: required(isTrue),
  approved: required(isTrue),
  approvedBy: required(list(person)),
  required: optional(number),
  left: optional(number)
});
var action = (value) => isReviewAction(value) ? value : void 0;
var asPanelTarget = object({
  project: required(nonEmptyString),
  iid: required(number),
  tab: optional(tab),
  discussionId: optional(nonEmptyString),
  jobId: optional(number)
});
var asMergeRequestPanel = object({
  kind: required(literal("merge_request")),
  mr: required(mergeRequest),
  diffs: required(list(diffFile)),
  discussions: required(list(discussion)),
  approvals: optional(approvals),
  approvalsError: optional(nonEmptyString),
  truncated: optional(trueOnly)
});
var asPipelinePanel = object({
  kind: required(literal("pipeline")),
  project: required(nonEmptyString),
  iid: required(number),
  pipeline: required(readPipeline)
});
var asJobLogPanel = object({
  kind: required(literal("job_log")),
  project: required(nonEmptyString),
  job: required(job),
  log: fallback(string, ""),
  truncated: required(isTrue)
});
var asReviewDraft = object({
  action: required(action),
  summary: required(nonEmptyString),
  subject: required(nonEmptyString),
  body: optional(nonEmptyString),
  discussionId: optional(nonEmptyString)
});

// src/host/surface/http.ts
var ROUTE_PREFIX = "/dsh-gitlab";
function numberParam(route, name2) {
  const raw = route.url.searchParams.get(name2) ?? "";
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0)
    throw new BadRequest(`the request needs a numeric "${name2}"`);
  return value;
}
function textParam(route, name2) {
  const value = route.url.searchParams.get(name2) ?? "";
  if (value === "") throw new BadRequest(`the request needs a "${name2}"`);
  return value;
}
var panelRoutes = (deps) => [
  async (route) => {
    if (route.url.pathname !== `${ROUTE_PREFIX}/token` || route.method !== "POST")
      return false;
    const body = await route.read();
    const token = body.required("token");
    route.send(200, await deps.auth.saveToken(token));
    return true;
  },
  async (route) => {
    if (route.url.pathname !== `${ROUTE_PREFIX}/mr` || route.method !== "GET")
      return false;
    const project = textParam(route, "project");
    const iid = numberParam(route, "iid");
    await route.sendData(() => deps.panel.mergeRequest(project, iid));
    return true;
  },
  async (route) => {
    if (route.url.pathname !== `${ROUTE_PREFIX}/mr/pipeline` || route.method !== "GET")
      return false;
    const project = textParam(route, "project");
    const iid = numberParam(route, "iid");
    await route.sendData(() => deps.panel.pipeline(project, iid));
    return true;
  },
  async (route) => {
    if (route.url.pathname !== `${ROUTE_PREFIX}/mr/job` || route.method !== "GET")
      return false;
    const project = textParam(route, "project");
    const id = numberParam(route, "id");
    await route.sendData(() => deps.panel.jobLog(project, id));
    return true;
  },
  async (route) => {
    if (route.url.pathname !== `${ROUTE_PREFIX}/mr/review` || route.method !== "POST")
      return false;
    const body = await route.read();
    const action2 = body.required("action");
    const project = body.required("project");
    const iid = Number(body.fields?.iid);
    const confirm = body.fields?.confirm === true;
    if (!isReviewAction(action2))
      throw new BadRequest(`"${action2}" is not a review action`);
    if (!Number.isInteger(iid) || iid <= 0)
      throw new BadRequest('"iid" must be a positive integer');
    const request = {
      project,
      iid,
      action: action2,
      ...typeof body.fields?.body === "string" ? { body: body.fields.body } : {},
      ...typeof body.fields?.discussionId === "string" ? { discussionId: body.fields.discussionId } : {}
    };
    try {
      const outcome = await deps.review.submit(request, confirm);
      if (!outcome.performed) {
        route.send(200, { draft: outcome.draft });
        return true;
      }
      route.send(200, await deps.panel.mergeRequest(project, iid));
    } catch (error) {
      if (error instanceof ReviewRefusal) {
        route.send(400, { error: error.message });
        return true;
      }
      throw error;
    }
    return true;
  }
];
var createApiHandler = (deps) => {
  return createIntegrationRoute({
    prefix: ROUTE_PREFIX,
    auth: deps.auth,
    routes: panelRoutes(deps)
  });
};

// src/host/token.ts
import {
  credentialKey
} from "@deepseek-ai/dsh-credentials";
var PLUGIN_SCOPE = "dsh-gitlab";
var TOKEN_KEY = credentialKey(PLUGIN_SCOPE, "token");
var TokenStore = class {
  /**
   * @param ctx - host context carrying the credential store.
   */
  constructor(ctx) {
    this.ctx = ctx;
  }
  /** The one record this plugin owns. */
  key = TOKEN_KEY;
  /** Read the stored token, or undefined when the user has not pasted one. */
  async read() {
    const record = await this.ctx.credentials.readRecord(this.key);
    if (record === void 0 || record.kind !== "api-key") return void 0;
    const key = record.key;
    return typeof key === "string" && key !== "" ? key : void 0;
  }
  /**
   * Store one token, replacing whatever was there.
   * @param token - the personal access token, as the user pasted it.
   */
  async save(token) {
    const trimmed = token.trim();
    if (trimmed === "") throw new Error("Требуется персональный токен доступа");
    await this.ctx.credentials.modifyRecord(this.key, async () => ({
      kind: "api-key",
      key: trimmed
    }));
  }
  /** Forget the token entirely. */
  async clear() {
    await this.ctx.credentials.deleteRecord(this.key);
  }
};

// src/shared/ansi.ts
var ESCAPE = "\x1B";
var isFinal = (char) => char >= "@" && char <= "~";
function skipEscape(text, start) {
  const kind = text[start + 1];
  if (kind === "[") {
    let index = start + 2;
    while (index < text.length && !isFinal(text[index] ?? "")) index += 1;
    return index + 1;
  }
  if (kind === "]") {
    let index = start + 2;
    while (index < text.length) {
      if (text[index] === "\x07") return index + 1;
      if (text[index] === ESCAPE && text[index + 1] === "\\") return index + 2;
      index += 1;
    }
    return index;
  }
  return start + 2;
}
function readJobLog(text) {
  const lines = [];
  let line = "";
  let index = 0;
  while (index < text.length) {
    const char = text[index] ?? "";
    if (char === ESCAPE) {
      index = skipEscape(text, index);
      continue;
    }
    if (char === "\n") {
      lines.push(line);
      line = "";
      index += 1;
      continue;
    }
    if (char === "\r") {
      if (text[index + 1] === "\n") {
        lines.push(line);
        line = "";
        index += 2;
        continue;
      }
      line = "";
      index += 1;
      continue;
    }
    line += char;
    index += 1;
  }
  lines.push(line);
  return lines.join("\n");
}

// src/host/tools/text.ts
var bounded = (text, maxChars) => text.length <= maxChars ? { text, truncated: false } : { text: text.slice(0, maxChars), truncated: true };
var tailBounded = (text, maxChars) => text.length <= maxChars ? { text, truncated: false } : { text: text.slice(text.length - maxChars), truncated: true };
var mrLine = (mr) => {
  const parts = [
    `${mr.project}!${mr.iid}`,
    mr.title,
    mr.state,
    mr.draft === true ? "draft" : void 0,
    mr.author === void 0 ? void 0 : `by ${mr.author}`,
    mr.reviewers === void 0 || mr.reviewers.length === 0 ? void 0 : `reviewers: ${mr.reviewers.join(", ")}`,
    mr.pipeline === void 0 ? void 0 : `pipeline: ${mr.pipeline}`,
    mr.unresolved === void 0 ? void 0 : `${mr.unresolved} unresolved`,
    mr.url
  ].filter((part) => part !== void 0 && part !== "");
  return parts.join(" \xB7 ");
};
var findingLine = (finding) => {
  const parts = [
    finding.file === void 0 ? finding.discussionId : `${finding.file}${finding.line === void 0 ? "" : `:${finding.line}`}`,
    finding.resolved ? "resolved" : "unresolved",
    finding.author,
    finding.body.split("\n")[0]
  ].filter((part) => part !== void 0 && part !== "");
  return parts.join(" \xB7 ");
};

// src/host/tools/get-job-log.ts
var MAX_TRACE_CHARS2 = 32e3;
var GetJobLogTool = class {
  /** The wire name the agent calls. */
  TOOL_NAME = GITLAB_GET_JOB_LOG_TOOL;
  /**
   * Build the tool definition for one plugin instance.
   * @param deps - the channel to GitLab.
   */
  create = (deps) => ({
    name: this.TOOL_NAME,
    description: "Прочитать задание CI проекта GitLab и конец его журнала, включая фактический вывод упавшей сборки. Идентификатор задания возьмите из gitlab_get_merge_request с pipeline: true. Возвращаются последние 32 000 символов журнала с отметкой об усечении. Начало длинного журнала откройте по ссылке на задание в GitLab. Ответ 404 у архивного или недоступного журнала означает невозможность чтения журнала, а не отсутствие задания. Используйте этот инструмент вместо `glab` или чтения журнала через оболочку.",
    parameters: {
      type: "object",
      additionalProperties: false,
      required: ["project", "jobId"],
      properties: {
        project: {
          type: "string",
          description: "Полный путь проекта, например group/project."
        },
        jobId: {
          type: "integer",
          minimum: 1,
          description: "Идентификатор задания из сборки или ответа gitlab_get_merge_request."
        }
      }
    },
    output: {
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          summary: { type: "string" },
          job: { type: "object", additionalProperties: true },
          log: { type: "string" },
          truncated: { type: "boolean" }
        },
        required: ["summary", "job", "log", "truncated"]
      },
      render: (_args, value) => [
        { type: "text", text: value.summary }
      ]
    },
    execute: async (rawArgs) => {
      const args = this.parseArgs(rawArgs);
      const base = `/projects/${encodeURIComponent(args.project)}/jobs/${args.jobId}`;
      const job2 = parseJob(await deps.api.get(base));
      if (job2 === void 0)
        throw new Error(
          `GitLab returned no job ${args.jobId} in ${args.project}`
        );
      const trace = readJobLog(await deps.api.text(`${base}/trace`)).trimEnd();
      const cut = tailBounded(trace, MAX_TRACE_CHARS2);
      return {
        summary: this.textOf(args.project, job2, cut, trace.length),
        job: job2,
        log: cut.text,
        truncated: cut.truncated
      };
    }
  });
  /** Validate the model's arguments; unknown keys are ignored. */
  parseArgs(rawArgs) {
    const args = rawArgs !== null && typeof rawArgs === "object" ? rawArgs : {};
    const project = nonEmptyString(args.project);
    const jobId = Number(args.jobId);
    if (project === void 0)
      throw new Error(
        "Чтобы прочитать задание, укажи путь проекта, например \"group/project\""
      );
    if (!Number.isInteger(jobId) || jobId <= 0)
      throw new Error(
        `"${String(args.jobId)}" is not a job id; pass the positive integer a pipeline lists`
      );
    return { project, jobId };
  }
  /** The model's text: which job, what it printed, and how much of it. */
  textOf(project, job2, cut, total) {
    const lines = [
      `Job ${job2.name}${job2.stage === void 0 ? "" : ` (${job2.stage})`} in ${project}: ${job2.status}${job2.failureReason === void 0 ? "" : ` \xB7 ${job2.failureReason}`}`
    ];
    if (job2.url !== void 0) lines.push(`URL: ${job2.url}`);
    lines.push(
      cut.truncated ? `Trace (last ${MAX_TRACE_CHARS2} of ${total} characters):` : "Trace:"
    );
    if (cut.text !== "") lines.push(cut.text);
    return lines.join("\n");
  }
};
var getJobLogTool = new GetJobLogTool();

// src/host/tools/get-merge-request.ts
var MAX_DESCRIPTION_CHARS = 4e3;
var MAX_DIFF_PATCH_CHARS = 48e3;
var MAX_THREADS = 50;
var MAX_DISCUSSION_CHARS = 4e4;
var MAX_NOTES_PER_THREAD = 20;
var MAX_NOTE_CHARS = 1e3;
var GetMergeRequestTool = class {
  /** The wire name the agent calls. */
  TOOL_NAME = GITLAB_GET_MERGE_REQUEST_TOOL;
  /**
   * Build the tool definition for one plugin instance.
   * @param deps - the channel to GitLab.
   */
  create = (deps) => ({
    name: this.TOOL_NAME,
    description: "Прочитать запрос на слияние GitLab: описание, состояние, автора, проверяющих, метки, ветки, статус слияния и ссылку; по запросу — изменения, обсуждения и последнюю сборку с заданиями. Укажите `group/project!12` или ссылку. Используйте инструмент вместо `glab` или `curl`, чтобы токен оставался в Harness. Длинные изменения, описание и список обсуждений обрезаются с указанием пропущенной части. Для обсуждений указывается следующая ветка, которую можно прочитать отдельно через gitlab_read по `/projects/<project>/merge_requests/<iid>/discussions/<discussionId>`.",
    parameters: {
      type: "object",
      additionalProperties: false,
      required: ["mergeRequest"],
      properties: {
        mergeRequest: {
          type: "string",
          description: "Запрос на слияние: ссылка либо запись вида group/project!12."
        },
        diff: {
          type: "boolean",
          description: "Включить изменённые файлы и их изменения."
        },
        discussions: {
          type: "boolean",
          description: "Включить обсуждения проверки."
        },
        pipeline: {
          type: "boolean",
          description: "Включить последнюю сборку и её задания."
        },
        unresolvedOnly: {
          type: "boolean",
          description: "При чтении обсуждений исключить закрытые ветки."
        }
      }
    },
    output: {
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          summary: { type: "string" },
          mr: { type: "object", additionalProperties: true },
          diffs: {
            type: "array",
            items: { type: "object", additionalProperties: true }
          },
          discussions: {
            type: "array",
            items: { type: "object", additionalProperties: true }
          },
          pipeline: { type: "object", additionalProperties: true },
          truncated: { type: "boolean" }
        },
        required: ["summary", "mr"]
      },
      render: (_args, value) => [
        { type: "text", text: value.summary }
      ]
    },
    execute: async (rawArgs) => {
      const args = this.parseArgs(rawArgs);
      const reference = parseReference(args.mergeRequest);
      if (reference === void 0)
        throw new Error(
          `"${args.mergeRequest}" is not a merge request reference; use group/project!12`
        );
      const base = `/projects/${encodeURIComponent(reference.project)}/merge_requests/${reference.iid}`;
      const mr = parseMergeRequestDetail(await deps.api.get(base), reference);
      if (mr === void 0)
        throw new Error(
          `GitLab returned no merge request for ${reference.project}!${reference.iid}`
        );
      const facets = await this.readFacets(deps, base, reference.project, args);
      const report = this.describe(mr, facets);
      return {
        summary: report.text,
        mr,
        ...facets.diffs === void 0 ? {} : { diffs: facets.diffs },
        ...facets.discussions === void 0 ? {} : { discussions: facets.discussions },
        ...facets.pipeline === void 0 || facets.pipeline === null ? {} : { pipeline: facets.pipeline },
        ...report.truncated ? { truncated: true } : {}
      };
    }
  });
  /** Read every facet the caller asked for, and nothing else. */
  async readFacets(deps, base, project, args) {
    const facets = {};
    if (args.diff) {
      const page = await deps.api.getAll(`${base}/diffs`);
      facets.diffs = parseDiffFiles({ diffs: page.items });
    }
    if (args.discussions) {
      const page = await deps.api.getAll(`${base}/discussions`);
      const threads = parseDiscussions({ discussions: page.items });
      facets.unresolved = threads.filter(
        (thread) => thread.resolvable && !thread.resolved
      ).length;
      facets.discussions = args.unresolvedOnly ? threads.filter((thread) => thread.resolvable && !thread.resolved) : threads;
    }
    if (args.pipeline) {
      const listed = parsePipeline(
        await deps.api.get(`${base}/pipelines`, { per_page: 20 })
      );
      if (listed === null) {
        facets.pipeline = null;
      } else {
        const jobs = await deps.api.getAll(
          `/projects/${encodeURIComponent(project)}/pipelines/${listed.id}/jobs`
        );
        facets.pipeline = { ...listed, jobs: parseJobs(jobs.items) };
      }
    }
    return facets;
  }
  /** Validate the model's arguments; unknown keys are ignored. */
  parseArgs(rawArgs) {
    const args = rawArgs !== null && typeof rawArgs === "object" ? rawArgs : {};
    return {
      mergeRequest: nonEmptyString(args.mergeRequest) ?? "",
      diff: args.diff === true,
      discussions: args.discussions === true,
      pipeline: args.pipeline === true,
      unresolvedOnly: args.unresolvedOnly === true
    };
  }
  /** The text the model reads, and whether any of it was cut. */
  describe(mr, facets) {
    let truncated = false;
    const header = [
      `${mr.project}!${mr.iid} \xB7 ${mr.title}`,
      this.stateLine(mr),
      this.branchLine(mr),
      this.mergeLine(mr, facets.unresolved),
      mr.url === void 0 ? void 0 : `URL: ${mr.url}`
    ].filter((line) => line !== void 0 && line !== "");
    const sections = [header.join("\n")];
    if (mr.description !== void 0 && mr.description !== "") {
      const cut = bounded(mr.description, MAX_DESCRIPTION_CHARS);
      if (cut.truncated) truncated = true;
      sections.push(
        [
          "Description:",
          cut.text,
          ...cut.truncated ? [
            `\u2026 (the description was cut at ${MAX_DESCRIPTION_CHARS} characters)`
          ] : []
        ].join("\n")
      );
    }
    if (facets.diffs !== void 0) {
      const block = this.diffBlock(facets.diffs);
      if (block.truncated) truncated = true;
      sections.push(block.text);
    }
    if (facets.discussions !== void 0) {
      const block = this.discussionBlock(
        facets.discussions,
        facets.unresolved ?? 0,
        mr
      );
      if (block.truncated) truncated = true;
      sections.push(block.text);
    }
    if (facets.pipeline !== void 0)
      sections.push(
        facets.pipeline === null ? "Pipeline: none" : this.pipelineBlock(facets.pipeline)
      );
    return {
      text: sections.map((section) => section.replace(/\n+$/u, "")).join("\n\n"),
      truncated
    };
  }
  /** The state, author, reviewers and labels, one line. */
  stateLine(mr) {
    const parts = [];
    if (mr.state !== void 0)
      parts.push(
        mr.draft ? `State: ${mr.state} (draft)` : `State: ${mr.state}`
      );
    else if (mr.draft) parts.push("Draft");
    if (mr.author !== void 0) parts.push(`Author: ${mr.author.username}`);
    if (mr.reviewers.length > 0)
      parts.push(
        `Reviewers: ${mr.reviewers.map((person2) => person2.username).join(", ")}`
      );
    if (mr.labels.length > 0) parts.push(`Labels: ${mr.labels.join(", ")}`);
    return parts.length === 0 ? void 0 : parts.join(" \xB7 ");
  }
  /** Where the change goes, when the answer names both ends. */
  branchLine(mr) {
    const branches = [mr.sourceBranch, mr.targetBranch].filter(
      (branch) => branch !== void 0 && branch !== ""
    );
    return branches.length === 0 ? void 0 : `Branches: ${branches.join(" \u2192 ")}`;
  }
  /** The mergeability facts GitLab reports beside the merge request. */
  mergeLine(mr, unresolved) {
    const parts = [];
    if (mr.mergeStatus !== void 0)
      parts.push(`Merge status: ${mr.mergeStatus}`);
    if (mr.userNotesCount !== void 0)
      parts.push(`Notes: ${mr.userNotesCount}`);
    if (unresolved !== void 0) parts.push(`Unresolved: ${unresolved}`);
    return parts.length === 0 ? void 0 : parts.join(" \xB7 ");
  }
  /** The changed files, then whole patches until the budget cuts the rest. */
  diffBlock(files) {
    if (files.length === 0) return { text: "Изменений нет", truncated: false };
    const added = files.reduce((sum, file) => sum + file.added, 0);
    const removed = files.reduce((sum, file) => sum + file.removed, 0);
    const lines = [
      `Diff: ${files.length} file${files.length === 1 ? "" : "s"} (+${added} \u2212${removed})`
    ];
    for (const file of files)
      lines.push(`- ${file.path} (+${file.added} \u2212${file.removed})`);
    let used = 0;
    let truncated = false;
    for (const file of files) {
      if (file.patch === void 0) continue;
      const block = `--- ${file.path}
${file.patch}`;
      if (used + block.length <= MAX_DIFF_PATCH_CHARS) {
        lines.push(block);
        used += block.length;
        continue;
      }
      if (used === 0) lines.push(block.slice(0, MAX_DIFF_PATCH_CHARS));
      truncated = true;
      break;
    }
    if (truncated)
      lines.push(`\u2026 (the diff was cut at ${MAX_DIFF_PATCH_CHARS} characters)`);
    return { text: lines.join("\n"), truncated };
  }
  /**
   * The review threads, opening note first and replies under it.
   *
   * A large merge request can hold hundreds of threads and thousands of notes,
   * so the section has a budget of its own: filling the model's context with
   * one review leaves no room to reason about the diff. What is not shown is
   * named, with the id of the first thread left out, so the model can read it
   * one at a time instead of concluding the list ended.
   */
  discussionBlock(threads, unresolved, mr) {
    if (threads.length === 0)
      return { text: "Обсуждений нет", truncated: false };
    const lines = [
      `Discussions: ${threads.length} thread${threads.length === 1 ? "" : "s"}, ${unresolved} unresolved`
    ];
    let truncated = false;
    let used = lines[0]?.length ?? 0;
    let shown = 0;
    for (const thread of threads.slice(0, MAX_THREADS)) {
      const rendered = this.threadLines(thread);
      const size = rendered.lines.reduce(
        (sum, line) => sum + line.length + 1,
        0
      );
      if (shown > 0 && used + size > MAX_DISCUSSION_CHARS) {
        truncated = true;
        break;
      }
      if (rendered.truncated) truncated = true;
      lines.push(...rendered.lines);
      used += size;
      shown += 1;
    }
    if (shown < threads.length) {
      truncated = true;
      const rest = threads.length - shown;
      const next = threads[shown];
      lines.push(
        `\u2026 (${rest} more thread${rest === 1 ? "" : "s"} and their notes are not shown: the answer budget is ${MAX_DISCUSSION_CHARS} characters. Read one thread at a time with gitlab_read on /projects/${encodeURIComponent(mr.project)}/merge_requests/${mr.iid}/discussions/${next === void 0 ? "<discussionId>" : encodeURIComponent(next.id)}.)`
      );
    }
    return { text: lines.join("\n"), truncated };
  }
  /** One thread: its opening note with paragraph breaks, then the replies. */
  threadLines(thread) {
    const shown = thread.notes.slice(0, MAX_NOTES_PER_THREAD);
    const [opening, ...replies] = shown;
    const parts = [];
    const lines = [];
    let truncated = false;
    if (opening?.position !== void 0) {
      const where = this.whereOf(opening.position);
      if (where !== void 0) parts.push(where);
    }
    if (opening !== void 0) {
      if (opening.author !== void 0) parts.push(opening.author.username);
      const body = this.openingBody(opening);
      if (body.truncated) truncated = true;
      if (body.first !== "") parts.push(body.first);
      lines.push(...body.rest);
    }
    const label = `[${this.statusOf(thread)}]`;
    const head = parts.length === 0 ? label : `${label} ${parts.join(" \xB7 ")}`;
    lines.unshift(`- ${head} (id ${thread.id})`);
    for (const note2 of replies) {
      const reply = this.replyLine(note2);
      if (reply.truncated) truncated = true;
      lines.push(reply.line);
    }
    if (shown.length < thread.notes.length)
      lines.push(`  \u2026 (${thread.notes.length - shown.length} more notes)`);
    return { lines, truncated };
  }
  /** How one thread reads: a review thread is open or closed, activity is neither. */
  statusOf(thread) {
    if (!thread.resolvable) return "not resolvable";
    return thread.resolved ? "resolved" : "unresolved";
  }
  /** The opening note, keeping its paragraph breaks. */
  openingBody(note2) {
    const cut = bounded(note2.body, MAX_NOTE_CHARS);
    const bodyLines = cut.text.split("\n");
    const first = bodyLines[0] ?? "";
    const rest = bodyLines.slice(1).map((line) => line === "" ? "" : `  ${line}`);
    if (cut.truncated) rest.push("  \u2026");
    return { first, rest, truncated: cut.truncated };
  }
  /** One reply, on its own indented line with its author. */
  replyLine(note2) {
    const cut = bounded(note2.body, MAX_NOTE_CHARS);
    const first = cut.text.split("\n").find((line) => line.trim() !== "") ?? "";
    const author = note2.author === void 0 ? "" : `${note2.author.username}: `;
    return {
      line: `  > ${author}${first}${cut.truncated ? " \u2026" : ""}`,
      truncated: cut.truncated
    };
  }
  /** Where in the diff one note was written. */
  whereOf(position2) {
    if (position2.file === void 0) return void 0;
    const line = position2.newLine ?? position2.oldLine;
    return line === void 0 ? position2.file : `${position2.file}:${line}`;
  }
  /** The newest pipeline and every job it ran. */
  pipelineBlock(pipeline2) {
    const context = [pipeline2.source, pipeline2.ref].filter(
      (part) => part !== void 0 && part !== ""
    );
    const lines = [
      `Pipeline: #${pipeline2.id} ${pipeline2.status}${context.length === 0 ? "" : ` (${context.join(", ")})`}`
    ];
    for (const job2 of pipeline2.jobs) lines.push(`- ${this.jobLine(job2)}`);
    return lines.join("\n");
  }
  /** One job of the pipeline, with GitLab's own failure reason. */
  jobLine(job2) {
    const parts = [
      `${job2.name}${job2.stage === void 0 ? "" : ` (${job2.stage})`} ${job2.status}`,
      job2.failureReason,
      `id ${job2.id}`,
      job2.url
    ].filter((part) => part !== void 0 && part !== "");
    return parts.join(" \xB7 ");
  }
};
var getMergeRequestTool = new GetMergeRequestTool();

// src/host/tools/query.ts
var MR_LIST_PAGE_SIZE = 25;
var listPathOf = (query) => {
  if (query.project !== void 0)
    return `/projects/${encodeURIComponent(query.project)}/merge_requests`;
  if (query.group !== void 0)
    return `/groups/${encodeURIComponent(query.group)}/merge_requests`;
  return "/merge_requests";
};
var listParamsOf = (state, query) => {
  const params = {
    per_page: query.limit ?? 10,
    // The schema says "omit to include any state", so an omitted state asks for
    // every state rather than quietly narrowing to open requests.
    state: query.state ?? "all"
  };
  if (query.search !== void 0) params.search = query.search;
  if (query.labels !== void 0) params.labels = query.labels;
  if (query.author !== void 0) params.author_username = query.author;
  if (query.page !== void 0) params.page = query.page;
  if (query.scope === "review_requested") {
    const username = query.reviewer ?? state.facts?.username;
    if (username === void 0)
      throw new Error("Учётная запись GitLab ещё неизвестна; выполни /gitlab sync");
    params.reviewer_username = username;
    return params;
  }
  if (query.reviewer !== void 0) params.reviewer_username = query.reviewer;
  else if (query.scope !== void 0) params.scope = query.scope;
  return params;
};

// src/host/tools/list-merge-requests.ts
var SCOPES = ["review_requested", "assigned_to_me", "created_by_me"];
var STATES = ["opened", "closed", "merged", "locked", "all"];
var SCOPE_LABELS = {
  review_requested: "waiting for your review",
  assigned_to_me: "assigned to you",
  created_by_me: "created by you"
};
var ListMergeRequestsTool = class {
  /** The wire name the agent calls. */
  TOOL_NAME = GITLAB_LIST_MERGE_REQUESTS_TOOL;
  /**
   * Build the tool definition for one plugin instance.
   * @param deps - the channel to GitLab and the plugin's runtime state.
   */
  create = (deps) => ({
    name: this.TOOL_NAME,
    description: "Получить список запросов на слияние GitLab: ожидающих проверки пользователя, назначенных ему, созданных им либо относящихся к проекту или группе. Возвращаются состояние, признак черновика, автор, проверяющие, ветки, метки и число комментариев. Используйте вместо glab или curl: плагин обращается к GitLab с токеном из Harness; токен не передаётся в оболочку. В списке нет статуса сборки и числа незакрытых обсуждений, поскольку GitLab не возвращает их этим запросом. Для них прочитайте конкретный запрос на слияние. Ответ содержит одну страницу и номер следующей, если она есть. Продолжайте чтение параметром page; не представляйте первую страницу как весь список.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        scope: {
          type: "string",
          enum: [...SCOPES],
          description: "Какие запросы на слияние показать для текущего пользователя: review_requested — ожидают его проверки; assigned_to_me — назначены ему; created_by_me — созданы им."
        },
        project: {
          type: "string",
          description: "Путь проекта для ограничения поиска, например group/project."
        },
        group: {
          type: "string",
          description: "Путь группы. Поиск включает её подгруппы."
        },
        state: {
          type: "string",
          enum: [...STATES],
          description: "Состояние запросов на слияние. Если не задано, запрашивается all: список не ограничивается только открытыми запросами."
        },
        search: {
          type: "string",
          description: "Текст для поиска в названиях и описаниях запросов на слияние."
        },
        labels: {
          type: "string",
          description: "Метки через запятую. Каждая запись должна содержать все указанные метки."
        },
        author: {
          type: "string",
          description: "Имя пользователя GitLab — автора запросов на слияние."
        },
        reviewer: {
          type: "string",
          description: "Имя пользователя GitLab, который должен быть проверяющим."
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: MR_LIST_PAGE_SIZE,
          description: "Размер страницы. По умолчанию 10; GitLab запрашивается не более 25 записей за раз."
        },
        page: {
          type: "integer",
          minimum: 1,
          description: "Номер страницы, начиная с 1. Если есть продолжение, предыдущий ответ указывает следующую страницу."
        }
      }
    },
    output: {
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          summary: { type: "string" },
          count: { type: "integer" },
          total: { type: "integer" },
          page: { type: "integer" },
          nextPage: { type: "integer" },
          truncated: { type: "boolean" },
          items: {
            type: "array",
            items: { type: "object", additionalProperties: true }
          }
        },
        required: ["summary", "count", "items"]
      },
      render: (_args, value) => [
        { type: "text", text: value.summary }
      ]
    },
    execute: async (rawArgs) => {
      const query = this.parseArgs(rawArgs);
      const answer = await deps.api.getAnswer(
        listPathOf(query),
        listParamsOf(deps.state, query)
      );
      const listed = parseMergeRequestList(answer.value);
      const items = listed.items.slice(0, MR_LIST_PAGE_SIZE);
      const total = answer.total ?? listed.total;
      const page = query.page ?? 1;
      const nextPage = this.nextPageOf(page, items.length, query, total);
      const label = this.labelOf(query);
      const summary = this.textOf(items, {
        total,
        page,
        nextPage,
        label
      });
      return {
        summary,
        count: items.length,
        ...total === void 0 ? {} : { total },
        page,
        ...nextPage === void 0 ? {} : { nextPage },
        ...nextPage === void 0 ? {} : { truncated: true },
        items
      };
    }
  });
  /** Validate the model's arguments; unknown keys are ignored. */
  parseArgs(rawArgs) {
    const args = rawArgs !== null && typeof rawArgs === "object" ? rawArgs : {};
    const scope = nonEmptyString(args.scope);
    const state = nonEmptyString(args.state);
    const limit = args.limit === void 0 ? void 0 : Number(args.limit);
    const page = args.page === void 0 ? void 0 : Number(args.page);
    if (scope !== void 0 && !SCOPES.includes(scope))
      throw new Error(
        `"${scope}" is not a merge request scope; use ${SCOPES.join(", ")}`
      );
    if (state !== void 0 && !STATES.includes(state))
      throw new Error(
        `"${state}" is not a merge request state; use ${STATES.join(", ")}`
      );
    if (limit !== void 0 && (!Number.isInteger(limit) || limit < 1 || limit > MR_LIST_PAGE_SIZE))
      throw new Error(
        `"${String(args.limit)}" is not a page size; pass a whole number from 1 to ${MR_LIST_PAGE_SIZE}, or omit it for 10`
      );
    if (page !== void 0 && (!Number.isInteger(page) || page < 1))
      throw new Error(
        `"${String(args.page)}" is not a page number; pass a whole number starting at 1, or omit it for the first page`
      );
    return {
      scope,
      project: nonEmptyString(args.project),
      group: nonEmptyString(args.group),
      state,
      search: nonEmptyString(args.search),
      labels: nonEmptyString(args.labels),
      author: nonEmptyString(args.author),
      reviewer: nonEmptyString(args.reviewer),
      limit,
      page
    };
  }
  /**
   * The next page's number when this page cannot be the whole list.
   *
   * `x-total` answers the question outright; without it, a full page is the
   * only sign that more may exist, and the model is told to ask rather than
   * assume the answer ended there.
   */
  nextPageOf(page, shown, query, total) {
    if (total !== void 0)
      return page * (query.limit ?? 10) < total ? page + 1 : void 0;
    return shown >= (query.limit ?? 10) ? page + 1 : void 0;
  }
  /** The one filter the heading names, so the rows are known to be a subset. */
  labelOf(query) {
    if (query.scope !== void 0)
      return SCOPE_LABELS[query.scope] ?? query.scope;
    if (query.search !== void 0) return `search "${query.search}"`;
    return query.project ?? query.group;
  }
  /** The model's text: the count, the page, the query, then one row each. */
  textOf(items, context) {
    const label = context.label;
    if (items.length === 0)
      return label === void 0 ? "No merge requests matched." : `No merge requests matched.
Query: ${label}`;
    const shown = items.length;
    const counted = context.total !== void 0 && context.total > shown ? ` of ${context.total}` : "";
    const heading = `Merge requests: ${shown} shown on page ${context.page}${counted}${label === void 0 ? "" : ` \xB7 ${label}`}`;
    const lines = [heading, ...items.map((item) => `- ${mrLine(item)}`)];
    if (context.nextPage !== void 0)
      lines.push(
        `\u2026more may exist: call ${GITLAB_LIST_MERGE_REQUESTS_TOOL} again with page: ${context.nextPage} (limit: ${MR_LIST_PAGE_SIZE} widens each page).`
      );
    return lines.join("\n");
  }
};
var listMergeRequestsTool = new ListMergeRequestsTool();

// src/host/tools/present.ts
var MAX_ITEMS = 25;
var SCOPE_LABELS2 = {
  review_requested: "waiting for your review",
  assigned_to_me: "assigned to you",
  created_by_me: "created by you"
};
var SCOPES2 = ["review_requested", "assigned_to_me", "created_by_me"];
var reasonOf3 = (error) => error instanceof Error ? error.message : String(error);
function stringList(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item) => typeof item === "string" && item !== ""
  );
}
var PresentTool = class {
  /** The wire name the agent calls. */
  TOOL_NAME = GITLAB_PRESENT_TOOL;
  /**
   * Build the tool definition for one plugin instance.
   * @param deps - the channel to GitLab and the plugin's runtime state.
   */
  create = (deps) => ({
    name: this.TOOL_NAME,
    description: "Показать пользователю карточку с запросами на слияние GitLab, замечаниями проверки или упавшими заданиями CI. Используйте, когда пользователь просит показать работу: запросы, ожидающие его проверки, собственные запросы, замечания проверяющего или причину сбоя сборки. Найдите данные по ссылкам на запросы, области поиска, строке поиска, замечаниям или заданиям запроса. Каждая строка содержит ссылку, состояние, автора, проверяющих и сборку. Вызывайте один раз на карточку, затем напишите ответ; не дублируйте карточку списком в тексте. Карточка показывает не более 25 строк. Текстовый ответ сообщает общее число совпадений и наличие продолжения; не представляйте ограниченную выборку как полную. Для чтения данных используйте gitlab_list_merge_requests или gitlab_get_merge_request; gitlab_present предназначен для показа карточки.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        title: {
          type: "string",
          description: "Необязательный заголовок карточки, например «Ожидают моей проверки». Если не задан, карточка выводится без заголовка."
        },
        layout: {
          type: "string",
          enum: ["auto", "single", "compact", "list"],
          description: "auto — по умолчанию: одна запись показывается полной карточкой, две–четыре — компактными строками, больше — плотным списком."
        },
        mergeRequests: {
          type: "array",
          items: { type: "string" },
          description: "Запросы на слияние для показа: ссылки либо записи вида [\"group/project!12\"]."
        },
        scope: {
          type: "string",
          enum: [...SCOPES2],
          description: "Какие запросы на слияние показать для текущего пользователя: review_requested — ожидают его проверки; assigned_to_me — назначены ему; created_by_me — созданы им."
        },
        project: {
          type: "string",
          description: "Путь проекта для ограничения поиска, например group/project."
        },
        group: {
          type: "string",
          description: "Путь группы. Поиск включает её подгруппы."
        },
        state: {
          type: "string",
          enum: ["opened", "closed", "merged", "locked", "all"],
          description: "Состояние запросов на слияние. Если не задано, запрашивается all: список не ограничивается только открытыми запросами."
        },
        search: {
          type: "string",
          description: "Текст для поиска в названиях и описаниях запросов на слияние."
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: MAX_ITEMS,
          description: "Сколько запросов показать. По умолчанию 10, не более 25 в одной карточке."
        },
        findings: {
          type: "array",
          items: { type: "string" },
          description: "Запросы на слияние, обсуждения которых нужно показать списком задач, например [\"group/project!12\"]. Каждая строка содержит файл, комментарий и состояние обсуждения."
        },
        jobs: {
          type: "array",
          items: { type: "string" },
          description: "Запросы на слияние, для которых нужно показать упавшие задания CI, например [\"group/project!12\"]."
        }
      }
    },
    output: {
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          shown: { type: "integer" },
          total: { type: "integer" },
          truncated: { type: "boolean" },
          summary: { type: "string" },
          failed: { type: "array", items: { type: "string" } },
          presentation: { type: "object", additionalProperties: true }
        },
        required: ["shown", "summary", "failed", "presentation"]
      },
      render: (_args, value) => [
        { type: "text", text: value.summary }
      ],
      // The browser half reads this back as `result.meta` and renders the card.
      // It never reaches the model: the text above is what the model reads.
      presentationMeta: (_args, value) => value.presentation
    },
    execute: async (rawArgs, exec) => {
      const args = this.parseArgs(rawArgs);
      const found = await this.resolve(deps, args);
      const presentation = {
        callId: String(exec.callId),
        ...args.title === void 0 ? {} : { title: args.title },
        layout: this.resolveLayout(args.layout, found.items.length),
        ...found.total === void 0 ? {} : { total: found.total },
        ...found.query === void 0 ? {} : { query: found.query },
        ...found.filters.length === 0 ? {} : { filters: found.filters },
        ...found.subject === void 0 ? {} : { subject: found.subject },
        ...found.truncated ? { truncated: true } : {},
        items: found.items
      };
      const viewed = this.describe(presentation);
      const summary = found.failed.length === 0 ? viewed : `${viewed}
Could not resolve:
- ${found.failed.join("\n- ")}`;
      return {
        shown: found.items.length,
        ...found.total === void 0 ? {} : { total: found.total },
        ...found.truncated ? { truncated: true } : {},
        summary,
        failed: [...found.failed],
        presentation
      };
    }
  });
  /** Validate the model's arguments; unknown keys are ignored. */
  parseArgs(rawArgs) {
    const args = rawArgs !== null && typeof rawArgs === "object" ? rawArgs : {};
    const layout = nonEmptyString(args.layout);
    const limit = args.limit === void 0 ? void 0 : Number(args.limit);
    if (limit !== void 0 && (!Number.isInteger(limit) || limit < 1 || limit > MAX_ITEMS))
      throw new Error(
        `"${String(args.limit)}" is not a row count; pass a whole number from 1 to ${MAX_ITEMS}, or omit it for 10`
      );
    return {
      title: nonEmptyString(args.title),
      layout: layout === "auto" || layout === "single" || layout === "compact" || layout === "list" ? layout : void 0,
      mergeRequests: stringList(args.mergeRequests),
      findings: stringList(args.findings),
      jobs: stringList(args.jobs),
      scope: nonEmptyString(args.scope),
      project: nonEmptyString(args.project),
      group: nonEmptyString(args.group),
      state: nonEmptyString(args.state),
      search: nonEmptyString(args.search),
      limit
    };
  }
  /** Resolve every requested source into card rows. */
  async resolve(deps, args) {
    const requested = args.mergeRequests.length > 0 || args.findings.length > 0 || args.jobs.length > 0 || args.scope !== void 0 || args.project !== void 0 || args.group !== void 0 || args.search !== void 0;
    if (!requested)
      throw new Error(
        "Нет данных для показа: передай ссылки на merge request, область поиска, поисковый запрос, находки или задания"
      );
    const failed = [];
    const items = [];
    const subjects = [];
    let total;
    let query;
    let filters = [];
    let matched = 0;
    let truncated = false;
    if (args.mergeRequests.length > 0) {
      const wanted = args.mergeRequests.slice(0, MAX_ITEMS);
      total = args.mergeRequests.length;
      truncated = args.mergeRequests.length > MAX_ITEMS;
      for (const reference of wanted) {
        const ref = parseReference(reference);
        if (ref === void 0) {
          failed.push(`${reference} (not a merge request reference)`);
          continue;
        }
        try {
          const card = parseMergeRequestCard(
            await deps.api.get(this.mrPath(ref.project, ref.iid))
          );
          if (card === void 0) throw new Error("Нет merge request");
          items.push({ kind: "merge_request", mergeRequest: card });
          matched += 1;
        } catch (error) {
          failed.push(`${reference} (${reasonOf3(error)})`);
        }
      }
      total = failed.length === 0 ? args.mergeRequests.length : matched;
    } else if (args.scope !== void 0 || args.project !== void 0 || args.group !== void 0 || args.search !== void 0) {
      const answer = await deps.api.getAnswer(
        listPathOf(args),
        listParamsOf(deps.state, args)
      );
      const listed = parseMergeRequestList(answer.value);
      for (const card of listed.items.slice(0, MAX_ITEMS))
        items.push({ kind: "merge_request", mergeRequest: card });
      matched = listed.items.length;
      total = answer.total ?? listed.total;
      truncated = listed.items.length > MAX_ITEMS;
      query = this.queryOf(args);
      filters = this.filtersOf(args);
    }
    for (const reference of args.findings) {
      const ref = parseReference(reference);
      if (ref === void 0) {
        failed.push(`${reference} (not a merge request reference)`);
        continue;
      }
      try {
        const discussionsPage = await deps.api.getAll(
          `${this.mrPath(ref.project, ref.iid)}/discussions`
        );
        const discussions = parseDiscussions(discussionsPage.items);
        const findings = this.findingsOf(discussions, ref);
        matched += findings.length;
        subjects.push(`${ref.project}!${ref.iid}`);
        if (discussionsPage.truncated) truncated = true;
        if (findings.length > MAX_ITEMS - items.length) truncated = true;
        items.push(...findings.slice(0, Math.max(0, MAX_ITEMS - items.length)));
      } catch (error) {
        failed.push(`${reference} (${reasonOf3(error)})`);
      }
    }
    for (const reference of args.jobs) {
      const ref = parseReference(reference);
      if (ref === void 0) {
        failed.push(`${reference} (not a merge request reference)`);
        continue;
      }
      try {
        const jobs = await this.failedJobs(deps, ref);
        matched += jobs.length;
        subjects.push(`${ref.project}!${ref.iid}`);
        if (jobs.length > MAX_ITEMS - items.length) truncated = true;
        items.push(
          ...jobs.slice(0, Math.max(0, MAX_ITEMS - items.length)).map((job2) => ({ kind: "job", job: job2 }))
        );
      } catch (error) {
        failed.push(`${reference} (${reasonOf3(error)})`);
      }
    }
    const subject = subjects.length === 0 ? void 0 : [...new Set(subjects)].join(", ");
    const resolvedTotal = total ?? (matched > items.length ? matched : void 0);
    return {
      items,
      total: resolvedTotal,
      query,
      filters,
      subject,
      truncated,
      failed
    };
  }
  /** The API path of one merge request. */
  mrPath(project, iid) {
    return `/projects/${encodeURIComponent(project)}/merge_requests/${iid}`;
  }
  /** The review threads of one merge request, unresolved ones first. */
  findingsOf(discussions, ref) {
    const findings = discussions.filter((discussion2) => isFinding(discussion2)).sort((left, right) => Number(left.resolved) - Number(right.resolved));
    const items = [];
    for (const discussion2 of findings) {
      const item = findingOf(discussion2, ref);
      if (item !== void 0) items.push(item);
    }
    return items;
  }
  /** The failed jobs of one merge request's newest pipeline. */
  async failedJobs(deps, ref) {
    const listed = parsePipeline(
      await deps.api.get(`${this.mrPath(ref.project, ref.iid)}/pipelines`, {
        per_page: 20
      })
    );
    if (listed === null) return [];
    const jobs = parseJobs(
      await deps.api.getAll(
        `/projects/${encodeURIComponent(ref.project)}/pipelines/${listed.id}/jobs`,
        { scope: "failed" }
      )
    );
    return jobs.filter((job2) => job2.status === "failed").map((job2) => ({
      project: ref.project,
      iid: ref.iid,
      id: job2.id,
      name: job2.name,
      status: job2.status,
      ...job2.stage === void 0 ? {} : { stage: job2.stage },
      ...job2.failureReason === void 0 ? {} : { failureReason: job2.failureReason },
      ...job2.url === void 0 ? {} : { url: job2.url }
    }));
  }
  /** The scope or search one list ran, as a human label for the card. */
  queryOf(args) {
    if (args.search !== void 0) return `search "${args.search}"`;
    if (args.scope !== void 0) return SCOPE_LABELS2[args.scope] ?? args.scope;
    return args.project ?? args.group;
  }
  /** Every filter the list applied, so the card names them all. */
  filtersOf(args) {
    const filters = [];
    if (args.scope !== void 0)
      filters.push(`scope: ${SCOPE_LABELS2[args.scope] ?? args.scope}`);
    if (args.project !== void 0) filters.push(`project: ${args.project}`);
    if (args.group !== void 0) filters.push(`group: ${args.group}`);
    if (args.state !== void 0) filters.push(`state: ${args.state}`);
    if (args.search !== void 0) filters.push(`search: ${args.search}`);
    if (args.limit !== void 0) filters.push(`limit: ${args.limit}`);
    return filters;
  }
  /** Pick the layout the caller asked for, or infer one from the row count. */
  resolveLayout(input, count) {
    if (input === "single" || input === "compact" || input === "list")
      return input;
    if (count <= 1) return "single";
    if (count <= 4) return "compact";
    return "list";
  }
  /** The text the model reads: what the card shows, in order. */
  describe(presentation) {
    const count = presentation.items.length;
    const total = presentation.total !== void 0 && presentation.total > count ? presentation.total : void 0;
    if (count === 0) {
      const lines2 = ["No merge requests, findings or jobs matched."];
      if (presentation.query !== void 0)
        lines2.push(`Query: ${presentation.query}`);
      if (presentation.filters !== void 0)
        lines2.push(`Filters: ${presentation.filters.join(" \xB7 ")}`);
      if (presentation.subject !== void 0)
        lines2.push(`Merge request: ${presentation.subject}`);
      if (presentation.truncated === true)
        lines2.push("GitLab had more rows than this answer read.");
      return lines2.join("\n");
    }
    const heading = presentation.title === void 0 ? "Shown as a card" : `Shown as a card titled "${presentation.title}"`;
    const lines = [
      `${heading}: ${total === void 0 ? count : `${count} of ${total}`} item${(total ?? count) === 1 ? "" : "s"}.`
    ];
    for (const item of presentation.items) {
      if (item.kind === "merge_request") {
        lines.push(`- ${mrLine(item.mergeRequest)}`);
      } else if (item.kind === "finding") {
        lines.push(`- ${findingLine(item.finding)}`);
      } else {
        const job2 = item.job;
        lines.push(
          `- job ${job2.name}${job2.stage === void 0 ? "" : ` (${job2.stage})`} \xB7 ${job2.status}${job2.failureReason === void 0 ? "" : ` \xB7 ${job2.failureReason}`}${job2.url === void 0 ? "" : ` \xB7 ${job2.url}`}`
        );
      }
    }
    if (total !== void 0)
      lines.push(
        `\u2026${total - count} more matched than the card shows; narrow the query or read the list with gitlab_list_merge_requests.`
      );
    if (presentation.query !== void 0)
      lines.push(`Query: ${presentation.query}`);
    if (presentation.filters !== void 0)
      lines.push(`Filters: ${presentation.filters.join(" \xB7 ")}`);
    if (presentation.subject !== void 0)
      lines.push(`Merge request: ${presentation.subject}`);
    if (presentation.truncated === true && total === void 0)
      lines.push("GitLab had more rows than this answer read.");
    return lines.join("\n");
  }
};
var presentTool = new PresentTool();

// src/host/tools/read.ts
var MAX_JSON_CHARS = 32e3;
var MAX_TEXT_CHARS = 32e3;
var API_PATH2 = /^\/(?!\/)/u;
var ReadTool = class {
  /** The wire name the agent calls. */
  TOOL_NAME = GITLAB_READ_TOOL;
  /**
   * Build the tool definition for one plugin instance.
   * @param deps - the channel to GitLab.
   */
  create = (deps) => ({
    name: this.TOOL_NAME,
    description: "Прочитать конечную точку GitLab REST API методом GET: проекты, задачи, коммиты, ветки, файлы репозитория, пользователей, метки, этапы, релизы и поиск. Укажите путь внутри /api/v4, например `/projects/group%2Fproject/issues` или `/search?scope=blobs&search=retry`, и при необходимости параметры. Поддерживаются JSON и текст: например, исходный файл или журнал задания. Двоичные данные, включая артефакты, обозначаются как двоичные и не декодируются в текст. Списки по умолчанию возвращают одну страницу из 20 строк; ответ указывает страницу, общее число и продолжение. Для полного списка используйте page и увеличенный per_page. Для запросов на слияние, обсуждений, сборок и журналов сначала используйте специализированные инструменты. Этот инструмент только читает данные и использует токен из Harness. Не запускайте glab и не ищите токен на диске.",
    parameters: {
      type: "object",
      additionalProperties: false,
      required: ["path"],
      properties: {
        path: {
          type: "string",
          description: "Путь API внутри /api/v4, начиная с /. Например /projects или /search?scope=blobs&search=retry. Параметры можно указать в пути либо в query."
        },
        query: {
          type: "object",
          additionalProperties: true,
          description: "Необязательные параметры запроса. Они перекрывают одноимённые параметры в пути. Поддерживаются строки, числа и логические значения; остальные игнорируются. Для постраничного чтения используйте page и per_page; по умолчанию GitLab возвращает 20 строк."
        }
      }
    },
    output: {
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          summary: { type: "string" },
          path: { type: "string" },
          contentType: { type: "string" },
          total: { type: "integer" },
          page: { type: "integer" },
          nextPage: { type: "integer" },
          truncated: { type: "boolean" }
        },
        required: ["summary", "path", "truncated"]
      },
      render: (_args, value) => [
        { type: "text", text: value.summary }
      ]
    },
    execute: async (rawArgs) => {
      const args = this.parseArgs(rawArgs);
      const marker = args.path.indexOf("?");
      const path = marker === -1 ? args.path : args.path.slice(0, marker);
      const search = marker === -1 ? "" : args.path.slice(marker + 1);
      const params = this.paramsOf(search, args.query);
      const answer = await deps.api.read(path, params);
      const page = answer.page ?? this.numberParam(params.page) ?? 1;
      const shown = Array.isArray(answer.value) ? answer.value.length : void 0;
      const body = this.bodyOf(answer);
      const header = [
        `GET ${this.requestOf(path, params)}`,
        answer.contentType === "" ? void 0 : answer.contentType,
        shown === void 0 ? void 0 : `${shown} row${shown === 1 ? "" : "s"} on page ${page}`,
        answer.total === void 0 ? void 0 : `${answer.total} total`
      ].filter((part) => part !== void 0).join(" \u2014 ");
      const lines = [header, this.nextOf(answer), body.text].filter(
        (line) => line !== void 0 && line !== ""
      );
      return {
        summary: lines.join("\n"),
        path,
        contentType: answer.contentType,
        ...answer.total === void 0 ? {} : { total: answer.total },
        ...shown === void 0 ? {} : { page },
        ...answer.nextPage === void 0 ? {} : { nextPage: answer.nextPage },
        truncated: body.truncated
      };
    }
  });
  /** The body as the model reads it, or what stands in for bytes. */
  bodyOf(answer) {
    if (answer.isBinary)
      return {
        text: `GitLab answered a ${answer.contentType} body; this tool shows JSON and text, not bytes. Open the endpoint in GitLab if you need the file itself.`,
        truncated: false
      };
    if (!answer.isJson) return bounded(answer.text, MAX_TEXT_CHARS);
    const cut = bounded(
      JSON.stringify(answer.value, null, 2) ?? answer.text,
      MAX_JSON_CHARS
    );
    return {
      text: cut.truncated ? `${cut.text}
\u2026 (the answer was cut at ${MAX_JSON_CHARS} characters; ask for a narrower endpoint)` : cut.text,
      truncated: cut.truncated
    };
  }
  /** What GitLab said about the rest of a list. */
  nextOf(answer) {
    if (answer.nextPage === void 0) return void 0;
    return `\u2026more rows on page ${answer.nextPage}; pass the same path with page: ${answer.nextPage}${answer.nextPage === 2 ? " and per_page: 100 to widen each page" : ""}.`;
  }
  /** One query value as a number, when it is a positive integer. */
  numberParam(value) {
    const number2 = Number(value);
    return Number.isInteger(number2) && number2 > 0 ? number2 : void 0;
  }
  /** Validate the model's arguments; unknown keys are ignored. */
  parseArgs(rawArgs) {
    const args = rawArgs !== null && typeof rawArgs === "object" ? rawArgs : {};
    const path = nonEmptyString(args.path) ?? "";
    if (!API_PATH2.test(path))
      throw new Error(
        `"${path}" is not a GitLab API path; pass a path that begins with "/", such as "/projects"`
      );
    return { path, query: this.queryOf(args.query) };
  }
  /** The `query` object, keeping only values GitLab takes as a parameter. */
  queryOf(value) {
    const query = {};
    if (!isRecord(value)) return query;
    for (const [name2, candidate] of Object.entries(value)) {
      if (typeof candidate === "string" || typeof candidate === "number" || typeof candidate === "boolean")
        query[name2] = candidate;
    }
    return query;
  }
  /** The path's own query string, overlaid with the `query` object. */
  paramsOf(search, query) {
    const params = {};
    for (const [name2, value] of new URLSearchParams(search))
      params[name2] = value;
    return { ...params, ...query };
  }
  /** The request as one line, so the model can see what was actually read. */
  requestOf(path, params) {
    const search = new URLSearchParams();
    for (const [name2, value] of Object.entries(params))
      search.set(name2, String(value));
    const query = search.toString();
    return query === "" ? path : `${path}?${query}`;
  }
};
var readTool = new ReadTool();

// src/host/tools/review.ts
var ReviewTool = class {
  /** The wire name the agent calls. */
  TOOL_NAME = GITLAB_REVIEW_TOOL;
  /**
   * Build the tool definition for one plugin instance.
   * @param deps - the one implementation of the confirmation gate.
   */
  create = (deps) => ({
    name: this.TOOL_NAME,
    description: "Написать комментарий к запросу на слияние GitLab, ответить в обсуждении, закрыть или возобновить обсуждение либо одобрить запрос. Инструмент не отправляет эти действия автоматически: сначала получите точный текст, покажите пользователю и повторите вызов с confirm: true только после его согласия. Не задавайте confirm без явного одобрения этой формулировки. Подтверждение не идемпотентно: каждый вызов повторяет действие; одинаковое подтверждение в течение минуты отклоняется. При тайм-ауте или неоднозначной ошибке GitLab уже мог выполнить действие. Перед повтором перечитайте запрос через gitlab_get_merge_request.",
    parameters: {
      type: "object",
      additionalProperties: false,
      required: ["mergeRequest", "action"],
      properties: {
        mergeRequest: {
          type: "string",
          description: "Запрос на слияние: ссылка либо запись вида group/project!12."
        },
        action: {
          type: "string",
          enum: [
            "comment",
            "reply",
            "resolve",
            "unresolve",
            "approve",
            "unapprove"
          ],
          description: "comment публикует новый комментарий; reply отвечает в существующем обсуждении; resolve и unresolve закрывают и возобновляют обсуждение; approve и unapprove устанавливают и снимают ваше одобрение. Сначала получите discussionId и текущее состояние через gitlab_get_merge_request."
        },
        body: {
          type: "string",
          description: "Текст комментария в Markdown. Обязателен для comment и reply. Строка не должна начинаться с /: GitLab может выполнить её как быструю команду."
        },
        discussionId: {
          type: "string",
          description: "Идентификатор обсуждения из карточки или панели — поле discussionId в [unresolved] path:line (id <discussionId>). Обязателен для reply, resolve и unresolve."
        },
        confirm: {
          type: "boolean",
          description: "Действительно отправить действие. Устанавливайте только после одобрения пользователем точного текста из первого вызова. Повторное подтверждение может создать второй комментарий или повторить одобрение; сначала проверьте, появился ли результат в запросе на слияние."
        }
      }
    },
    output: {
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          performed: { type: "boolean" },
          summary: { type: "string" },
          action: { type: "string" },
          subject: { type: "string" },
          body: { type: "string" },
          discussionId: { type: "string" },
          result: { type: "string" }
        },
        required: ["performed", "summary", "action", "subject"]
      },
      render: (_args, value) => [
        { type: "text", text: value.summary }
      ]
    },
    execute: async (rawArgs) => {
      const args = this.parseArgs(rawArgs);
      const reference = parseReference(args.reference);
      if (reference === void 0)
        throw new Error(
          `"${args.reference}" is not a merge request reference; use group/project!12`
        );
      if (!isReviewAction(args.action))
        throw new Error(`"${args.action}" is not a review action`);
      const request = {
        project: reference.project,
        iid: reference.iid,
        action: args.action,
        ...args.body === void 0 ? {} : { body: args.body },
        ...args.discussionId === void 0 ? {} : { discussionId: args.discussionId }
      };
      const outcome = await deps.review.submit(request, args.confirm);
      const draft = outcome.draft;
      const summary = outcome.performed ? `${draft.summary} on ${draft.subject}.${outcome.result === void 0 || outcome.result === "" ? "" : ` GitLab answered: ${outcome.result}`}` : this.pendingText(draft);
      return {
        performed: outcome.performed,
        summary,
        action: draft.action,
        subject: draft.subject,
        ...draft.body === void 0 ? {} : { body: draft.body },
        ...draft.discussionId === void 0 ? {} : { discussionId: draft.discussionId },
        ...outcome.result === void 0 ? {} : { result: outcome.result }
      };
    }
  });
  /** What the model reads before the user has agreed to anything. */
  pendingText(draft) {
    const lines = [
      `Not sent yet. ${draft.summary} on ${draft.subject}${draft.body === void 0 ? "." : ":"}`
    ];
    if (draft.discussionId !== void 0)
      lines.push(`Thread: ${draft.discussionId}.`);
    if (draft.body !== void 0) lines.push("", draft.body, "");
    lines.push(
      `Show this wording to the user and ask whether to send it. Call ${GITLAB_REVIEW_TOOL} again with confirm: true only after they agree. Confirming twice posts it twice: if that call fails or times out, re-read the merge request before retrying, because GitLab may already have performed it.`
    );
    return lines.join("\n");
  }
  /** Validate the model's arguments; unknown keys are ignored. */
  parseArgs(rawArgs) {
    const args = rawArgs !== null && typeof rawArgs === "object" ? rawArgs : {};
    return {
      reference: nonEmptyString(args.mergeRequest) ?? "",
      action: nonEmptyString(args.action) ?? "",
      body: nonEmptyString(args.body),
      discussionId: nonEmptyString(args.discussionId),
      confirm: args.confirm === true
    };
  }
};
var reviewTool = new ReviewTool();

// src/host/index.ts
var name = PLUGIN_NAME;
var inject = ["tools", "credentials", "commands"];
function apply(ctx, configInput) {
  const config = resolveConfig(configInput);
  const state = new RuntimeState();
  const logger = loggerOf(ctx);
  const token = new TokenStore(ctx);
  const api = new GitLabApi({ config, token });
  const auth = new GitLabAuth({ ctx, config, api, token, state });
  const panel = new PanelApi({ api, state, ctx });
  const review = new ReviewService(api);
  ctx.commands.register({
    name: COMMAND_NAME,
    description: "GitLab: status | login | logout | sync",
    input: { hint: "status | login | logout | sync" },
    handler: createCommandHandler(auth)
  });
  ctx.tools.register(listMergeRequestsTool.create({ api, state }));
  ctx.tools.register(getMergeRequestTool.create({ api }));
  ctx.tools.register(getJobLogTool.create({ api }));
  ctx.tools.register(readTool.create({ api }));
  ctx.tools.register(presentTool.create({ api, state }));
  ctx.tools.register(reviewTool.create({ review }));
  mountIntegrationRoute(ctx, {
    prefix: ROUTE_PREFIX,
    handler: createApiHandler({ auth, panel, review })
  });
  void auth.connect().then((ready) => {
    if (!ready)
      logger.info(
        "[gitlab] действующий токен ещё не настроен — вставьте его в карточку настроек GitLab"
      );
  });
}
export {
  apply,
  inject,
  name
};
//# sourceMappingURL=index.js.map
