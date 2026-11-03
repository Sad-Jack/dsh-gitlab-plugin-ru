window.__ModuleLoader__.load({ id: "dsh-gitlab-plugin", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.ts
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);

// ../integration-ui/src/card/definition.ts
var resultCallId = (match) => {
  if (match.event.type !== "tool/result") return void 0;
  const source = match.event.data.message.source;
  return typeof source.callId === "string" ? source.callId : void 0;
};
var createPresentationType = (spec) => {
  const select = (owner) => {
    const data = owner.turn.data.get(spec.turnDataKey);
    if (data === void 0) return null;
    const bound = owner.turn.end?.seq ?? owner.seq;
    const presentations2 = data.presentations.filter(
      (presentation3) => presentation3.seq <= bound
    );
    return presentations2.length === 0 ? null : { presentations: presentations2 };
  };
  const definition = {
    kind: spec.turnDataKey,
    match: (event) => {
      if (event.type === "turn/start")
        return { id: String(event.data.turn), role: "start" };
      if (event.type === "tool/call" || event.type === "tool/result")
        return { id: String(event.data.turn), role: "update" };
      return null;
    },
    start: (_context, match) => {
      if (match.event.type !== "turn/start")
        throw new Error(`${spec.turnDataKey} start requires turn/start`);
      return {
        turn: match.event.data.turn,
        calls: /* @__PURE__ */ new Map(),
        presentations: []
      };
    },
    update: (context, match) => {
      if (match.event.type === "tool/call") {
        const calls = new Map(context.state.calls);
        calls.set(String(match.event.data.callId), {
          name: match.event.data.name
        });
        return { ...context.state, calls };
      }
      if (match.event.type !== "tool/result") return context.state;
      if (match.event.data.message.isError === true) return context.state;
      const callId = resultCallId(match);
      if (callId === void 0) return context.state;
      if (context.state.calls.get(callId)?.name !== spec.toolName)
        return context.state;
      const card2 = spec.parse(match.event.data.meta);
      if (card2 === void 0) return context.state;
      const present = { card: card2, seq: match.event.seq };
      return {
        ...context.state,
        presentations: spec.keep === "last" ? [present] : [...context.state.presentations, present]
      };
    },
    buildLocationData: (context, scope, previous) => {
      if (scope !== "turn" || context.state === void 0) return null;
      const prior = previous;
      if (prior?.kind === "turn" && prior.turn === context.state.turn && prior.key === spec.turnDataKey && prior.value.presentations === context.state.presentations)
        return previous;
      return {
        kind: "turn",
        turn: context.state.turn,
        key: spec.turnDataKey,
        value: { presentations: context.state.presentations }
      };
    }
  };
  return { definition, select, card: spec.card };
};

// ../integration-ui/src/card/tail.tsx
var import_react = require("react");

// ../integration-ui/src/styles/styles.css.ts
var actions = "kvottg8";
var caption = "kvottg7";
var card = "kvottg1";
var code = "kvottgo";
var error = "kvottgp";
var factInline = "kvottgf";
var factInlineLabel = "kvottgg";
var factLabel = "kvottgc";
var factValue = "kvottgd";
var facts = "kvottgb";
var factsInline = "kvottge";
var fieldRow = "kvottg1d";
var flash = "kvottg1c";
var head = "kvottg2";
var link = "kvottgn";
var list = "kvottgh";
var panel = "kvottg11";
var panelLoading = "kvottg13";
var panelScroll = "kvottg12";
var presentation = "kvottgr";
var presentationCount = "kvottgu";
var presentationHead = "kvottgs";
var presentationTitle = "kvottgt";
var presentations = "kvottgq";
var row = "kvottg9";
var section = "kvottg0";
var showAll = "kvottg1e";
var state = "kvottg4";
var stateWord = "kvottg5";
var title = "kvottg3";
var toolDetails = "kvottgz";
var toolLabel = "kvottgy";
var toolRow = "kvottgx";
var toolSummary = "kvottg10";

// ../integration-ui/src/card/tail.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var SCROLL_AFTER = 4;
var createPresentationTail = (type) => {
  const Tail = (props) => {
    const matched = type.select(props);
    const [expanded, setExpanded] = (0, import_react.useState)(
      () => /* @__PURE__ */ new Set()
    );
    if (matched === null) return null;
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: presentations, children: matched.presentations.map((presentation3) => {
      const card2 = presentation3.card;
      const callId = type.card.callId(card2);
      const title2 = type.card.title(card2);
      const count = type.card.length(card2);
      const open = expanded.has(callId);
      const meta = type.card.meta?.(card2, props);
      const footer = type.card.footer?.(card2, props);
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "section",
        {
          className: presentation,
          "data-integration-card": callId,
          "aria-labelledby": title2 === void 0 ? void 0 : `${callId}-title`,
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: presentationHead, children: [
              title2 === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "h3",
                {
                  className: presentationTitle,
                  id: `${callId}-title`,
                  children: title2
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: presentationCount, children: type.card.count(card2) })
            ] }),
            meta,
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "ul",
              {
                className: list,
                "data-layout": type.card.layout(card2),
                "data-scrollable": !open && count > SCROLL_AFTER ? "true" : void 0,
                children: type.card.items(card2, props)
              }
            ),
            count <= SCROLL_AFTER ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "button",
              {
                type: "button",
                className: showAll,
                "aria-expanded": open,
                onClick: () => {
                  setExpanded((current) => {
                    const next = new Set(current);
                    if (next.has(callId)) next.delete(callId);
                    else next.add(callId);
                    return next;
                  });
                },
                children: open ? "Show less" : `Show all ${count} ${count === 1 ? "row" : "rows"}`
              }
            ),
            footer
          ]
        },
        callId
      );
    }) });
  };
  return Tail;
};

// ../integration-ui/src/fact.tsx
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
var import_react2 = require("react");
var import_jsx_runtime2 = require("react/jsx-runtime");
var hasValue = (item3) => item3.value !== void 0 && item3.value !== null && item3.value !== "" && // React collapses a fragment of nulls to nothing; an empty array is the same
// answer from a provider that built its rows conditionally.
!(Array.isArray(item3.value) && item3.value.length === 0);
var Facts = ({
  items,
  layout: layout2 = "rows"
}) => {
  const shown = items.filter(hasValue);
  if (shown.length === 0) return null;
  if (layout2 === "inline") {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ul", { className: factsInline, children: shown.map((item3) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("li", { className: factInline, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: factInlineLabel, children: item3.label }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: factValue, children: item3.value })
    ] }, item3.label)) });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("dl", { className: facts, children: shown.map((item3) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_react2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("dt", { className: factLabel, children: item3.label }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("dd", { className: factValue, children: item3.value })
  ] }, item3.label)) });
};
var Chip = ({ label, value, tone = "outline" }) => {
  if (value === void 0 || value === "") return null;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives.Tag, { tone, children: label === void 0 ? value : `${label}: ${value}` });
};

// ../integration-host/src/status.ts
var CLIENT_REQUEST_HEADER = "x-dsh-client";
var CLIENT_REQUEST_VALUE = "1";

// ../integration-ui/src/host-api.ts
var createHostRequest = (basePath) => {
  const failureOf = async (response) => {
    try {
      const body = await response.json();
      if (body !== null && typeof body === "object" && typeof body.error === "string")
        return body.error;
    } catch {
    }
    return `host answered ${response.status} ${response.statusText}`;
  };
  return async (path, method, body, signal) => {
    const response = await fetch(`${basePath}${path}`, {
      method,
      headers: {
        accept: "application/json",
        [CLIENT_REQUEST_HEADER]: CLIENT_REQUEST_VALUE,
        ...method === "POST" ? { "content-type": "application/json" } : {}
      },
      ...method === "POST" ? { body: JSON.stringify(body ?? {}) } : {},
      ...signal === void 0 ? {} : { signal }
    });
    if (!response.ok) throw new Error(await failureOf(response));
    return await response.json();
  };
};

// ../integration-ui/src/panel/body.tsx
var import_dsh_client_ui_primitives2 = require("@deepseek-ai/dsh-client-ui-primitives");
var import_react3 = require("react");
var import_jsx_runtime3 = require("react/jsx-runtime");
var messageOf = (error3) => error3 instanceof Error ? error3.message : String(error3);
var createPanelBody = (provider2) => {
  const Panel = (props) => {
    const { tab: tab2 } = props.useTabInfo();
    const params = provider2.parseParams(tab2.navigation.params);
    const revision = tab2.navigation.revision;
    const identity = params === void 0 ? "" : provider2.identity(params);
    const [load, setLoad] = (0, import_react3.useState)({
      status: "loading"
    });
    const [failure, setFailure] = (0, import_react3.useState)(void 0);
    const [busy, setBusy] = (0, import_react3.useState)(false);
    const [flash2, setFlash] = (0, import_react3.useState)(void 0);
    const errorRef = (0, import_react3.useRef)(null);
    const current = (0, import_react3.useRef)(params);
    current.current = params;
    const fetchPanel = (0, import_react3.useCallback)(
      async (signal) => {
        const wanted = current.current;
        if (wanted === void 0) {
          setLoad({ status: "error", message: provider2.emptyMessage });
          return;
        }
        setLoad({ status: "loading" });
        try {
          const data = provider2.parse(await provider2.fetch(wanted, signal));
          if (data === void 0)
            throw new Error(
              "the host answered with a document this version cannot draw"
            );
          if (signal?.aborted !== true)
            setLoad({ status: "ready", data, params: wanted });
        } catch (error3) {
          if (signal?.aborted !== true)
            setLoad({ status: "error", message: messageOf(error3) });
        }
      },
      []
    );
    (0, import_react3.useEffect)(() => {
      const controller = new AbortController();
      setFailure(void 0);
      void fetchPanel(controller.signal);
      return () => {
        controller.abort();
      };
    }, [identity, revision, fetchPanel]);
    (0, import_react3.useEffect)(() => {
      if (failure !== void 0) errorRef.current?.focus();
    }, [failure]);
    (0, import_react3.useEffect)(() => {
      if (flash2 === void 0) return;
      const timer = setTimeout(() => setFlash(void 0), 4e3);
      return () => clearTimeout(timer);
    }, [flash2]);
    const run = (0, import_react3.useCallback)(
      (write) => {
        const wanted = current.current;
        if (wanted === void 0) return;
        const stillWanted = () => {
          const now = current.current;
          return now !== void 0 && provider2.identity(now) === provider2.identity(wanted);
        };
        setBusy(true);
        setFailure(void 0);
        write(wanted).then((answer) => {
          const data = provider2.parse(answer);
          if (data === void 0)
            throw new Error(
              "the host answered with a document this version cannot draw"
            );
          if (stillWanted()) {
            setLoad({ status: "ready", data, params: wanted });
            setFlash("Updated.");
          }
        }).catch((error3) => {
          if (stillWanted()) {
            setFailure(messageOf(error3));
            setFlash(void 0);
          }
          void fetchPanel();
        }).finally(() => {
          setBusy(false);
        });
      },
      [fetchPanel]
    );
    const actions3 = { busy, run };
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: panel, "aria-busy": busy, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: panelScroll, children: [
      load.status === "loading" ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
        "div",
        {
          className: panelLoading,
          role: "status",
          "aria-live": "polite",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_dsh_client_ui_primitives2.StateDot, { state: "ongoing", size: 20 }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_dsh_client_ui_primitives2.TextShimmer, { active: true, children: "Загрузка…" })
          ]
        }
      ) : null,
      busy ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: caption, role: "status", "aria-live": "polite", children: "Выполняется…" }) : null,
      load.status === "error" ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: error, role: "alert", children: load.message }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: actions, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_dsh_client_ui_primitives2.Button, { size: "sm", onClick: () => void fetchPanel(), children: "Повторить" }) })
      ] }) : null,
      failure === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        "p",
        {
          className: error,
          role: "alert",
          tabIndex: -1,
          ref: errorRef,
          children: failure
        }
      ),
      flash2 === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: caption, role: "status", "aria-live": "polite", children: flash2 }),
      load.status === "ready" ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        import_dsh_client_ui_primitives2.MarkdownDelegateProvider,
        {
          openExternalLink: (href) => {
            window.open(href, "_blank", "noopener,noreferrer");
          },
          children: provider2.view({
            data: load.data,
            params: load.params,
            actions: actions3
          })
        }
      ) : null
    ] }) });
  };
  return Panel;
};

// ../integration-ui/src/panel/definition.ts
var createPanelDefinition = (spec) => {
  return {
    id: spec.id,
    kind: spec.kind,
    // A type from outside the product outranks the shipped ones, which is the
    // band the Sidebar's own documentation reserves for exactly this.
    priority: "extension",
    title: () => spec.title
  };
};

// ../integration-ui/src/panel/open.ts
var createLazyPanelOpener = (kind) => {
  let opener;
  return {
    install: (ctx) => {
      opener = createPanelOpener(ctx, kind);
    },
    open: (params) => opener?.open(params) ?? false
  };
};
var createPanelOpener = (ctx, kind) => {
  return {
    open: (params) => {
      const sidebar = ctx.get("sidebarRight");
      if (sidebar === void 0) return false;
      try {
        sidebar.openTab(kind, { params });
        const focusOpened = () => {
          const active = sidebar.active();
          if (active !== void 0) sidebar.focus(active.id);
        };
        if (typeof requestAnimationFrame === "function")
          requestAnimationFrame(focusOpened);
        else focusOpened();
        return true;
      } catch {
        return false;
      }
    }
  };
};
var wantsBrowser = (event) => {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
};

// ../integration-ui/src/panel/title.tsx
var createPanelTitle = (provider2) => {
  const Title = (props) => {
    const { tab: tab2 } = props.useTabInfo();
    const params = provider2.parseParams(tab2.navigation.params);
    return (params === void 0 ? void 0 : provider2.title(params)) ?? tab2.title;
  };
  return Title;
};

// ../integration-ui/src/settings/section.tsx
var import_dsh_client_ui_primitives3 = require("@deepseek-ai/dsh-client-ui-primitives");
var import_react4 = require("react");
var import_jsx_runtime4 = require("react/jsx-runtime");
var POLL_MS = 1500;
var expiryText = (time) => new Date(time).toLocaleString(void 0, {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZoneName: "short"
});
var doneText = (key, credentials) => {
  if (key === "login") return "Sign-in started.";
  if (key === "logout")
    return credentials === "typed" ? "Credential forgotten." : "Signed out.";
  if (key === "save") return "Token saved.";
  if (key === "sync") return "Connection checked.";
  if (key === "cancel") return "Sign-in cancelled.";
  return "Done.";
};
var connectionState = (status) => {
  if (status?.inFlight === true) return "ongoing";
  return status?.connected === true ? "done" : "idle";
};
var stateText = (status, credentials) => {
  if (status.inFlight === true) return "Connecting";
  if (status.error != null && status.connected !== true)
    return "Connection failed";
  if (credentials === "none")
    return status.connected === true ? "Connected" : "Not connected";
  return status.signedIn === true ? "Signed in" : "Not signed in";
};
var createSettingsSection = (spec) => {
  const Section2 = () => {
    const mounted = (0, import_react4.useRef)(true);
    const [status, setStatus] = (0, import_react4.useState)(null);
    const [failure, setFailure] = (0, import_react4.useState)(null);
    const [pending, setPending] = (0, import_react4.useState)(null);
    const [typed, setTyped] = (0, import_react4.useState)("");
    const [replacing, setReplacing] = (0, import_react4.useState)(false);
    const [revealing, setRevealing] = (0, import_react4.useState)(false);
    const [confirming, setConfirming] = (0, import_react4.useState)(null);
    const [flash2, setFlash] = (0, import_react4.useState)(null);
    const refresh = (0, import_react4.useCallback)(async () => {
      try {
        const next = await spec.api.status();
        if (!mounted.current) return;
        setStatus(next);
        setFailure(null);
      } catch (error3) {
        if (!mounted.current) return;
        setStatus(null);
        setFailure(error3 instanceof Error ? error3.message : String(error3));
      }
    }, []);
    (0, import_react4.useEffect)(() => {
      mounted.current = true;
      void refresh();
      return () => {
        mounted.current = false;
      };
    }, [refresh]);
    (0, import_react4.useEffect)(() => {
      if (status?.inFlight !== true) return;
      const timer = setInterval(refresh, POLL_MS);
      return () => clearInterval(timer);
    }, [status?.inFlight, refresh]);
    (0, import_react4.useEffect)(() => {
      if (flash2 === null) return;
      const timer = setTimeout(() => setFlash(null), 4e3);
      return () => clearTimeout(timer);
    }, [flash2]);
    const act = (0, import_react4.useCallback)(
      async (key, action2, done) => {
        setPending(key);
        try {
          const next = await action2();
          if (!mounted.current) return;
          setStatus(next);
          setFailure(null);
          if (done !== void 0) setFlash(done);
        } catch (error3) {
          if (!mounted.current) return;
          setFailure(error3 instanceof Error ? error3.message : String(error3));
        } finally {
          if (mounted.current) setPending(null);
        }
      },
      []
    );
    const tokenField = spec.token;
    if (status === null) {
      return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("section", { className: section, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: card, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: head, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: title, children: spec.title }) }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: caption, children: failure === null ? spec.checking : spec.unreachable }),
        failure === null ? null : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: code, role: "alert", children: failure }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: actions, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_dsh_client_ui_primitives3.Button, { variant: "outline", onClick: refresh, children: "Повторить" }) })
      ] }) });
    }
    const signedIn = status.signedIn === true;
    const waiting = status.inFlight === true;
    const toolCount = status.tools.length;
    const expiry = signedIn && spec.credentials !== "none" ? status.expiresAt : null;
    const showField = tokenField !== void 0 && (!signedIn || replacing);
    const field = spec.token;
    const label = (key, text) => pending === key ? "Working\u2026" : text;
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("section", { className: section, children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: card, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: head, children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: title, children: spec.title }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: state, children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_dsh_client_ui_primitives3.StateDot, { state: connectionState(status) }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: stateWord, children: stateText(status, spec.credentials) }),
            status.connected !== true || toolCount === 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: `\xB7 ${toolCount} tool${toolCount === 1 ? "" : "s"}` })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: caption, children: spec.blurb }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          Facts,
          {
            items: [
              ...spec.details?.(status) ?? [],
              ...expiry === null ? [] : [
                {
                  label: "Токен",
                  value: `valid until ${expiryText(expiry)}`
                }
              ]
            ]
          }
        ),
        waiting ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: row, children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: caption, children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_dsh_client_ui_primitives3.StateDot, { state: "ongoing" }),
            " Waiting for you to approve the sign-in in your browser\u2026"
          ] }),
          spec.api.cancel === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            import_dsh_client_ui_primitives3.Button,
            {
              variant: "ghost",
              disabled: pending !== null,
              onClick: () => {
                const cancel = spec.api.cancel;
                if (cancel !== void 0)
                  void act(
                    "cancel",
                    cancel,
                    doneText("cancel", spec.credentials)
                  );
              },
              children: label("cancel", "Cancel")
            }
          )
        ] }) : null,
        status.notice === null ? null : /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: row, children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: caption, children: status.notice.message }),
          status.notice.url === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            "a",
            {
              className: link,
              href: status.notice.url,
              target: "_blank",
              rel: "noreferrer",
              children: "Открыть страницу входа"
            }
          )
        ] }),
        status.error != null ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: row, role: "alert", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: error, children: status.error }) }) : null,
        flash2 === null ? null : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: flash, role: "status", "aria-live": "polite", children: flash2 }),
        showField && field !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: fieldRow, children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
              import_dsh_client_ui_primitives3.Input,
              {
                type: revealing ? "text" : "password",
                value: typed,
                placeholder: field.placeholder,
                "aria-label": field.label,
                disabled: pending !== null,
                onChange: (event) => {
                  setTyped(event.target.value);
                }
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
              import_dsh_client_ui_primitives3.Button,
              {
                variant: "ghost",
                disabled: pending !== null || typed === "",
                onClick: () => setRevealing((shown) => !shown),
                children: revealing ? "Hide" : "Show"
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: caption, children: [
            field.hint,
            field.hintUrl === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
              " ",
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                "a",
                {
                  className: link,
                  href: field.hintUrl,
                  target: "_blank",
                  rel: "noreferrer",
                  children: field.hintLinkLabel ?? "Open the token page"
                }
              )
            ] })
          ] })
        ] }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: actions, children: [
          spec.credentials === "browser" ? signedIn ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            import_dsh_client_ui_primitives3.Button,
            {
              variant: "outline",
              disabled: pending !== null,
              onClick: () => setConfirming("logout"),
              children: label("logout", "Sign out")
            }
          ) : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            import_dsh_client_ui_primitives3.Button,
            {
              variant: "primary",
              disabled: pending !== null || waiting,
              onClick: () => void act(
                "login",
                spec.api.login,
                doneText("login", spec.credentials)
              ),
              children: label("login", waiting ? "Waiting\u2026" : spec.signInLabel)
            }
          ) : null,
          spec.credentials === "typed" && field !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
            showField ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                import_dsh_client_ui_primitives3.Button,
                {
                  variant: "primary",
                  disabled: pending !== null || typed.trim() === "",
                  onClick: () => {
                    void act("save", async () => {
                      const next = await field.save(typed);
                      setTyped("");
                      setReplacing(false);
                      return next;
                    });
                  },
                  children: label("save", field.saveLabel)
                }
              ),
              signedIn ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                import_dsh_client_ui_primitives3.Button,
                {
                  variant: "ghost",
                  disabled: pending !== null,
                  onClick: () => {
                    setTyped("");
                    setReplacing(false);
                  },
                  children: "Отмена"
                }
              ) : null
            ] }) : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
              import_dsh_client_ui_primitives3.Button,
              {
                variant: "outline",
                disabled: pending !== null,
                onClick: () => {
                  setReplacing(true);
                },
                children: field.replaceLabel
              }
            ),
            signedIn ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
              import_dsh_client_ui_primitives3.Button,
              {
                variant: "ghost",
                disabled: pending !== null,
                onClick: () => setConfirming("logout"),
                children: label("logout", field.clearLabel)
              }
            ) : null
          ] }) : null,
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            import_dsh_client_ui_primitives3.Button,
            {
              variant: "ghost",
              disabled: pending !== null || waiting,
              onClick: () => void act("sync", spec.api.sync),
              children: label("sync", spec.syncLabel)
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        import_dsh_client_ui_primitives3.Modal,
        {
          open: confirming !== null,
          onClose: () => setConfirming(null),
          closeLabel: "Закрыть",
          title: spec.credentials === "typed" ? `Forget the ${spec.title} credential?` : `Sign out of ${spec.title}?`,
          description: spec.credentials === "typed" ? "The stored token is removed and the integration\u2019s tools stop working until another one is saved." : "The stored credential is removed and the integration\u2019s tools stop working until you sign in again.",
          footer: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
              import_dsh_client_ui_primitives3.Button,
              {
                variant: "ghost",
                disabled: pending !== null,
                onClick: () => setConfirming(null),
                children: "Отмена"
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
              import_dsh_client_ui_primitives3.Button,
              {
                variant: "primary",
                disabled: pending !== null,
                onClick: () => {
                  setConfirming(null);
                  void act(
                    "logout",
                    spec.api.logout,
                    doneText("logout", spec.credentials)
                  );
                },
                children: spec.credentials === "typed" ? spec.token?.clearLabel ?? "Forget token" : "Sign out"
              }
            )
          ] })
        }
      )
    ] });
  };
  return Section2;
};

// ../integration-ui/src/settings/tab.ts
var import_react5 = require("react");
var FALLBACK_DELAY_MS = 150;
var hasIntegrationsPage = (ctx) => ctx.slots.entries("settings.section").some((entry) => entry.options.id === "integrations");
var registerIntegrationsTab = (ctx, spec, card2) => {
  ctx.slots.inject(
    "integrations.tab",
    () => ctx.slots.register(
      {
        name: "integrations.tab",
        id: spec.id,
        order: spec.order,
        label: spec.label
      },
      card2
    )
  );
  ctx.slots.inject("settings.section", () => {
    let timer;
    let unsubscribe;
    let fallback2;
    const removeFallback = () => {
      unsubscribe?.();
      unsubscribe = void 0;
      fallback2?.();
      fallback2 = void 0;
    };
    timer = setTimeout(() => {
      timer = void 0;
      if (hasIntegrationsPage(ctx)) return;
      const Standalone = () => {
        const Card = card2;
        return (0, import_react5.createElement)(Card);
      };
      fallback2 = ctx.slots.register(
        {
          name: "settings.section",
          id: `integration-${spec.id}`,
          order: spec.order,
          label: spec.label
        },
        Standalone
      );
      unsubscribe = ctx.slots.subscribe("settings.section", () => {
        if (hasIntegrationsPage(ctx)) removeFallback();
      });
    }, FALLBACK_DELAY_MS);
    return () => {
      if (timer !== void 0) clearTimeout(timer);
      removeFallback();
    };
  });
};

// ../integration-ui/src/styles/runtime.ts
var installStyles = (pluginId, css) => {
  const style = document.createElement("style");
  style.setAttribute("data-plugin", pluginId);
  style.textContent = css;
  document.head.append(style);
  return () => style.remove();
};

// ../integration-ui/src/tool/row.tsx
var import_dsh_client_ui_primitives4 = require("@deepseek-ai/dsh-client-ui-primitives");
var import_jsx_runtime5 = require("react/jsx-runtime");
var resultText = (block) => (block?.content ?? []).filter((item3) => item3.type === "text" && typeof item3.text === "string").map((item3) => item3.text ?? "").join("\n").trim();
var rawCall = (block) => {
  const args = block?.argsRaw ?? block?.call?.argsRaw;
  const answer = resultText(block);
  const parts = [];
  if (typeof args === "string" && args.trim() !== "")
    parts.push(`args: ${args.trim()}`);
  if (answer !== "") parts.push(answer);
  return parts.join("\n\n") || "The call carried no arguments and no text.";
};
var blockArgs = (block) => {
  for (const raw of [block?.argsRaw, block?.call?.argsRaw]) {
    if (typeof raw !== "string" || raw === "") continue;
    try {
      const parsed = JSON.parse(raw);
      if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed))
        return parsed;
    } catch {
    }
  }
  return {};
};
var createToolRow = (spec) => {
  const Row = ({ phase, block, toolName }) => {
    const name = spec.displayName(toolName);
    if (phase !== "result") {
      return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: toolRow, "data-tool": toolName, title: toolName, children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_dsh_client_ui_primitives4.StateDot, { state: "ongoing" }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: toolLabel, children: name }),
        spec.asked === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: caption, children: spec.asked(block) ?? "\u2026" })
      ] });
    }
    if (block?.isError === true) {
      return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: toolRow, "data-tool": toolName, title: toolName, children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_dsh_client_ui_primitives4.StateDot, { state: "error" }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: toolLabel, children: name }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: `${caption} ${error}`, children: resultText(block) || "failed" })
      ] });
    }
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("details", { className: toolDetails, children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
        "summary",
        {
          className: `${toolRow} ${toolSummary}`,
          "data-tool": toolName,
          title: toolName,
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_dsh_client_ui_primitives4.StateDot, { state: spec.state?.(block) ?? "done" }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: toolLabel, children: name }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: caption, children: spec.summarize(block) })
          ]
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("pre", { className: code, children: rawCall(block) })
    ] });
  };
  return Row;
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
var list2 = (read) => (value) => {
  if (!Array.isArray(value)) return [];
  const items = [];
  for (const candidate of value) {
    const item3 = read(candidate);
    if (item3 !== void 0) items.push(item3);
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
var oneOf = (...readers) => (value) => {
  for (const read of readers) {
    const parsed = read(value);
    if (parsed !== void 0) return parsed;
  }
  return void 0;
};

// src/shared/meta.ts
var reviewers = (value) => {
  const items = list2(nonEmptyString)(value) ?? [];
  return items.length === 0 ? void 0 : items;
};
var mergeRequest = object({
  project: required(nonEmptyString),
  iid: required(number),
  title: required(nonEmptyString),
  url: optional(nonEmptyString),
  state: optional(nonEmptyString),
  draft: optional((value) => typeof value === "boolean" ? value : void 0),
  author: optional(nonEmptyString),
  reviewers: optional(reviewers),
  sourceBranch: optional(nonEmptyString),
  targetBranch: optional(nonEmptyString),
  pipeline: optional(nonEmptyString),
  updatedAt: optional(nonEmptyString),
  notes: optional(number),
  unresolved: optional(number)
});
var finding = object({
  project: required(nonEmptyString),
  iid: required(number),
  discussionId: required(nonEmptyString),
  file: optional(nonEmptyString),
  line: optional(number),
  lineSide: optional(oneOf(literal("old"), literal("new"))),
  author: optional(nonEmptyString),
  resolved: required(isTrue),
  body: required(nonEmptyString),
  url: optional(nonEmptyString)
});
var job = object({
  project: required(nonEmptyString),
  iid: required(number),
  id: required(number),
  name: required(nonEmptyString),
  stage: optional(nonEmptyString),
  status: required(nonEmptyString),
  failureReason: optional(nonEmptyString),
  url: optional(nonEmptyString)
});
var item = oneOf(
  object({
    kind: required(literal("merge_request")),
    mergeRequest: required(mergeRequest)
  }),
  object({
    kind: required(literal("finding")),
    finding: required(finding)
  }),
  object({
    kind: required(literal("job")),
    job: required(job)
  })
);
var layout = oneOf(
  literal("single"),
  literal("compact"),
  literal("list")
);
var presentation2 = object({
  callId: required(nonEmptyString),
  title: optional(nonEmptyString),
  layout: fallback(layout, "list"),
  total: optional(number),
  query: optional(nonEmptyString),
  filters: optional(list2(nonEmptyString)),
  subject: optional(nonEmptyString),
  truncated: optional(trueOnly),
  items: required(list2(item))
});
function asGitLabPresentation(value) {
  if (!isRecord(value) || !Array.isArray(value.items)) return void 0;
  const parsed = presentation2(value);
  if (parsed === void 0 || parsed.items.length === 0) return void 0;
  const { total, ...rest } = parsed;
  return total === void 0 || total <= parsed.items.length ? rest : { ...rest, total };
}

// src/shared/tools.ts
var GITLAB_PRESENT_TOOL = "gitlab_present";
var GITLAB_REVIEW_TOOL = "gitlab_review";

// src/client/styles/styles.css.ts
var actions2 = "kvottg8";
var added = "_1q5dbeb8";
var badges = "kvottg6";
var branch = "_1q5dbeb3";
var branchRow = "_1q5dbeb2";
var caption2 = "kvottg7";
var cardMeta = "kvottgv";
var description = "_1q5dbeb4";
var diffHead = "_1q5dbeb6";
var diffPath = "_1q5dbeb7";
var draft = "_1q5dbebh";
var draftText = "_1q5dbebi";
var error2 = "kvottgp";
var findingBody = "_1q5dbeb0";
var item2 = "kvottgi";
var itemHead = "kvottgj";
var itemLink = "kvottgl";
var itemTitle = "kvottgk";
var job2 = "_1q5dbebj";
var jobName = "_1q5dbebk";
var link2 = "kvottgn";
var list3 = "kvottgh";
var log = "_1q5dbebl";
var mrHead = "_1q5dbeb1";
var note = "_1q5dbebd";
var noteAuthor = "_1q5dbebf";
var noteHead = "_1q5dbebe";
var notice = "_1q5dbebn";
var panelKey = "kvottg17";
var panelSection = "kvottg19";
var panelSectionTitle = "kvottg1a";
var panelSummary = "kvottg18";
var panelTitleRow = "kvottg16";
var removed = "_1q5dbeb9";
var rowButton = "kvottgm";
var tabs = "kvottg15";
var thread = "_1q5dbeba";
var threadFile = "_1q5dbebc";
var threadFocused = "_1q5dbebm";
var threadHead = "_1q5dbebb";

// src/client/sidebar/definition.ts
var PANEL_KIND = "gitlab";
var PANEL_ID = "dsh-gitlab";
var panelDefinition = () => createPanelDefinition({ id: PANEL_ID, kind: PANEL_KIND, title: "GitLab" });

// src/client/sidebar/open.ts
var panel2 = createLazyPanelOpener(PANEL_KIND);
var installPanelOpener = (ctx) => {
  panel2.install(ctx);
};
var openPanel = (target) => panel2.open(target);

// src/client/components/row-link.tsx
var import_jsx_runtime6 = require("react/jsx-runtime");
function openTarget(event, target) {
  if (wantsBrowser(event)) return;
  if (openPanel(target)) event.preventDefault();
}
var RowLink = ({ url, label, onOpen }) => url === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
  "button",
  {
    type: "button",
    className: `${link2} ${itemLink} ${rowButton}`,
    onClick: onOpen,
    children: label
  }
) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
  "a",
  {
    className: `${link2} ${itemLink}`,
    href: url,
    target: "_blank",
    rel: "noreferrer",
    onClick: onOpen,
    children: label
  }
);

// src/client/components/finding-item.tsx
var import_jsx_runtime7 = require("react/jsx-runtime");
var whereText = (finding2) => {
  if (finding2.file === void 0) return finding2.discussionId;
  if (finding2.line === void 0) return finding2.file;
  const side = finding2.lineSide === "old" ? " (removed)" : "";
  return `${finding2.file}:${finding2.line}${side}`;
};
var FindingItem = ({ finding: finding2 }) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("li", { className: item2, children: [
  /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: itemHead, children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
      RowLink,
      {
        url: finding2.url,
        label: whereText(finding2),
        onOpen: (event) => {
          openTarget(event, {
            project: finding2.project,
            iid: finding2.iid,
            tab: "discussions",
            discussionId: finding2.discussionId
          });
        }
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
      Chip,
      {
        tone: finding2.resolved ? "success" : "warning",
        value: finding2.resolved ? "resolved" : "unresolved"
      }
    )
  ] }),
  /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: findingBody, children: finding2.body }),
  /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
    Facts,
    {
      layout: "inline",
      items: [{ label: "Автор", value: finding2.author }]
    }
  )
] });

// src/client/components/job-item.tsx
var import_dsh_client_ui_primitives5 = require("@deepseek-ai/dsh-client-ui-primitives");

// src/shared/tone.ts
function mrStateTone(state2) {
  if (state2 === "opened") return "success";
  if (state2 === "merged") return "info";
  if (state2 === "locked") return "warning";
  return "neutral";
}
function mrStateLabel(state2) {
  if (state2 === "opened") return "Open";
  if (state2 === "merged") return "Merged";
  if (state2 === "closed") return "Closed";
  if (state2 === "locked") return "Locked";
  return state2 ?? "unknown";
}
function mergeStatusLabel(status) {
  if (status === "mergeable") return "Mergeable";
  if (status === "cannot_be_merged" || status === "conflict")
    return "Conflicts";
  if (status === "checking" || status === "unchecked") return "Checking";
  if (status === "broken") return "Broken";
  return status.replaceAll("_", " ");
}
function jobStatusLabel(status) {
  if (status === "success") return "Passed";
  if (status === "running") return "Running";
  if (status === "pending") return "Pending";
  if (status === "failed") return "Failed";
  if (status === "canceled") return "Canceled";
  if (status === "manual") return "Manual";
  return status.replaceAll("_", " ");
}
var FAILURE_REASON_LABELS = {
  script_failure: "the job script failed",
  runner_system_failure: "the runner failed",
  runner_unsupported: "the runner is unsupported",
  stuck_or_timeout_failure: "the job got stuck or timed out",
  job_execution_timeout: "the job timed out",
  missing_dependency_failure: "a dependency was missing",
  unmet_prerequisites: "its prerequisites were not met",
  api_failure: "GitLab's API failed",
  archived_failure: "the job is archived",
  data_integrity_failure: "the job data was corrupt",
  scheduler_failure: "the scheduler failed",
  unknown_failure: "GitLab не указал причину"
};
function jobFailureReasonLabel(reason) {
  return FAILURE_REASON_LABELS[reason] ?? reason.replaceAll("_", " ");
}
function jobTone(status) {
  if (status === "success") return "success";
  if (status === "failed") return "danger";
  if (status === "running" || status === "pending") return "info";
  if (status === "manual" || status === "canceled") return "warning";
  return "neutral";
}

// src/client/components/job-item.tsx
var import_jsx_runtime8 = require("react/jsx-runtime");
var JobItem = ({ job: job4 }) => /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("li", { className: item2, children: [
  /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: itemHead, children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
      RowLink,
      {
        url: job4.url,
        label: job4.name,
        onOpen: (event) => {
          openTarget(event, {
            project: job4.project,
            iid: job4.iid,
            tab: "pipeline",
            jobId: job4.id
          });
        }
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_dsh_client_ui_primitives5.Tag, { tone: jobTone(job4.status), children: jobStatusLabel(job4.status) }),
    job4.stage === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_dsh_client_ui_primitives5.Tag, { tone: "neutral", children: job4.stage })
  ] }),
  job4.failureReason === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: caption2, children: jobFailureReasonLabel(job4.failureReason) })
] });

// src/client/components/blocks.tsx
var import_dsh_client_ui_primitives6 = require("@deepseek-ai/dsh-client-ui-primitives");
var import_jsx_runtime9 = require("react/jsx-runtime");
var MARKDOWN_LABELS = {
  code: { copyLabel: "Копировать", copiedLabel: "Скопировано" },
  footnotes: "Примечания"
};
function whenText(value) {
  const time = Date.parse(value);
  return Number.isNaN(time) ? value : new Date(time).toLocaleString(void 0, {
    dateStyle: "medium",
    timeStyle: "short"
  });
}
function peopleText(people) {
  if (people.length === 0) return void 0;
  return people.map((person2) => person2.username).join(", ");
}
var Section = ({
  title: title2,
  children
}) => /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("section", { className: panelSection, children: [
  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: panelSectionTitle, children: title2 }),
  children
] });
var Prose = ({ text }) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: description, children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(import_dsh_client_ui_primitives6.MarkdownText, { text, labels: MARKDOWN_LABELS, variant: "compact" }) });

// src/client/components/mr-item.tsx
var import_jsx_runtime10 = require("react/jsx-runtime");
var MergeRequestItem = ({ mergeRequest: mergeRequest3 }) => /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("li", { className: item2, children: [
  /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: itemHead, children: [
    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
      RowLink,
      {
        url: mergeRequest3.url,
        label: `${mergeRequest3.project}!${mergeRequest3.iid}`,
        onOpen: (event) => {
          openTarget(event, {
            project: mergeRequest3.project,
            iid: mergeRequest3.iid
          });
        }
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: itemTitle, children: mergeRequest3.title }),
    mergeRequest3.draft ? /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Chip, { tone: "warning", value: "draft" }) : null
  ] }),
  /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
    Facts,
    {
      layout: "inline",
      items: [
        { label: "Состояние", value: mrStateLabel(mergeRequest3.state) },
        { label: "Автор", value: mergeRequest3.author },
        {
          label: "Обновлено",
          value: mergeRequest3.updatedAt === void 0 ? void 0 : whenText(mergeRequest3.updatedAt)
        },
        {
          label: "Проверяющие",
          value: mergeRequest3.reviewers === void 0 || mergeRequest3.reviewers.length === 0 ? void 0 : mergeRequest3.reviewers.join(", ")
        },
        { label: "Сборка", value: mergeRequest3.pipeline },
        { label: "Незакрытые обсуждения", value: mergeRequest3.unresolved },
        { label: "Комментарии", value: mergeRequest3.notes },
        {
          label: "Ветки",
          value: mergeRequest3.sourceBranch === void 0 || mergeRequest3.targetBranch === void 0 ? void 0 : `${mergeRequest3.sourceBranch} \u2192 ${mergeRequest3.targetBranch}`
        }
      ]
    }
  )
] });

// src/client/components/presentation-card.tsx
var import_jsx_runtime11 = require("react/jsx-runtime");
var countLabel = (presentation3) => {
  let mergeRequests = 0;
  let findings = 0;
  let jobs = 0;
  for (const item3 of presentation3.items) {
    if (item3.kind === "merge_request") mergeRequests += 1;
    else if (item3.kind === "finding") findings += 1;
    else jobs += 1;
  }
  const parts = [];
  if (mergeRequests > 0)
    parts.push(
      `${mergeRequests} merge request${mergeRequests === 1 ? "" : "s"}`
    );
  if (findings > 0)
    parts.push(`${findings} finding${findings === 1 ? "" : "s"}`);
  if (jobs > 0) parts.push(`${jobs} failed job${jobs === 1 ? "" : "s"}`);
  const label = parts.join(" \xB7 ");
  const total = presentation3.total;
  return total === void 0 || total <= presentation3.items.length ? label : `${label} of ${total}`;
};
var gitlabCard = {
  callId: (presentation3) => presentation3.callId,
  title: (presentation3) => presentation3.title,
  count: countLabel,
  length: (presentation3) => presentation3.items.length,
  layout: (presentation3) => presentation3.layout,
  items: (presentation3) => presentation3.items.map((item3) => {
    if (item3.kind === "merge_request")
      return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
        MergeRequestItem,
        {
          mergeRequest: item3.mergeRequest
        },
        `mr-${item3.mergeRequest.project}!${item3.mergeRequest.iid}`
      );
    if (item3.kind === "finding")
      return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
        FindingItem,
        {
          finding: item3.finding
        },
        `finding-${item3.finding.discussionId}`
      );
    return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(JobItem, { job: item3.job }, `job-${item3.job.id}`);
  }),
  meta: (presentation3) => {
    const hasMeta = presentation3.query !== void 0 || presentation3.filters !== void 0 || presentation3.subject !== void 0;
    if (!hasMeta) return null;
    return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: cardMeta, children: [
      presentation3.query === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
        "span",
        {
          className: caption2,
          children: `Showing: ${presentation3.query}`
        }
      ),
      presentation3.filters === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: caption2, children: `Filters: ${presentation3.filters.join(" \xB7 ")}` }),
      presentation3.subject === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: caption2, children: presentation3.subject })
    ] });
  }
};

// src/client/conversation/card-definition.ts
var GITLAB_TURN_DATA_KEY = "gitlab-presented";
var gitlabPresentation = createPresentationType({
  turnDataKey: GITLAB_TURN_DATA_KEY,
  toolName: GITLAB_PRESENT_TOOL,
  parse: asGitLabPresentation,
  card: gitlabCard
});

// src/client/components/presentation-tail.tsx
var GitLabTail = createPresentationTail(gitlabPresentation);

// src/client/host-api.ts
var request = createHostRequest("/dsh-gitlab");
var query = (project, iid) => `project=${encodeURIComponent(project)}&iid=${iid}`;
var hostApi = {
  /** Read the current sign-in and connection state. */
  status: async () => {
    return await request("/status", "GET");
  },
  /**
   * Store one personal access token and find out whether GitLab accepts it.
   * @returns the status as it now stands, error and all.
   */
  saveToken: async (token) => {
    return await request("/token", "POST", { token });
  },
  /** Forget the stored token. */
  logout: async () => {
    return await request("/logout", "POST");
  },
  /** Verify the stored token and re-read the account it belongs to. */
  sync: async () => {
    return await request("/sync", "POST");
  },
  /** Everything the panel shows for one merge request. */
  mergeRequest: async (project, iid, signal) => {
    return await request(
      `/mr?${query(project, iid)}`,
      "GET",
      void 0,
      signal
    );
  },
  /** The merge request's head pipeline and its jobs, read on demand. */
  pipeline: async (project, iid, signal) => {
    return await request(
      `/mr/pipeline?${query(project, iid)}`,
      "GET",
      void 0,
      signal
    );
  },
  /** One job and its trace, read when the user opens it. */
  jobLog: async (project, id, signal) => {
    return await request(
      `/mr/job?project=${encodeURIComponent(project)}&id=${id}`,
      "GET",
      void 0,
      signal
    );
  },
  /**
   * What one social action would send, without sending it.
   * @returns the wording the user must approve first.
   */
  reviewDraft: async (review) => {
    return await request("/mr/review", "POST", { ...review, confirm: false });
  },
  /**
   * Send one social action the user has already approved.
   * @returns the merge request as GitLab now stores it.
   */
  review: async (review) => {
    return await request("/mr/review", "POST", { ...review, confirm: true });
  }
};

// src/client/components/settings-section.tsx
var import_jsx_runtime12 = require("react/jsx-runtime");
var details = (status) => [
  {
    label: "Учётная запись",
    value: status.username === null ? void 0 : /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(import_jsx_runtime12.Fragment, { children: [
      status.username,
      status.userUrl === null ? null : /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(import_jsx_runtime12.Fragment, { children: [
        " \xB7 ",
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
          "a",
          {
            className: link2,
            href: status.userUrl,
            target: "_blank",
            rel: "noreferrer",
            children: "Открыть в GitLab"
          }
        )
      ] })
    ] })
  }
];
var GitLabSection = createSettingsSection({
  title: "GitLab",
  blurb: "Merge requests, review threads and pipelines, through GitLab\u2019s REST API.",
  checking: "Checking the GitLab token\u2026",
  unreachable: "Подключение к GitLab пока недоступно. Повторите немного позже.",
  credentials: "typed",
  syncLabel: "Проверить токен",
  api: hostApi,
  token: {
    label: "Персональный токен доступа",
    placeholder: "glpat-\u2026",
    hint: "Create one with the api scope in GitLab \u2192 Preferences \u2192 Access tokens, and paste it here. It is kept in the harness credential store.",
    hintUrl: "https://gitlab.com/-/user_settings/personal_access_tokens",
    hintLinkLabel: "Создать токен",
    saveLabel: "Сохранить токен",
    replaceLabel: "Заменить токен",
    clearLabel: "Удалить сохранённый токен",
    save: hostApi.saveToken
  },
  details
});

// src/client/plural.ts
var countText = (count, one, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

// src/client/components/tool-row.tsx
var textOf = (block) => (block?.content ?? []).filter((item3) => item3.type === "text" && typeof item3.text === "string").map((item3) => item3.text ?? "").join("\n").trim();
var firstReference = (value) => {
  if (!Array.isArray(value)) return void 0;
  return value.find(
    (item3) => typeof item3 === "string" && item3 !== ""
  );
};
var SCOPES = {
  review_requested: "waiting for your review",
  assigned_to_me: "assigned to you",
  created_by_me: "created by you"
};
var askedFor = (block) => {
  const args = blockArgs(block);
  if (typeof args.search === "string" && args.search !== "") return args.search;
  if (typeof args.scope === "string" && args.scope !== "")
    return SCOPES[args.scope] ?? args.scope;
  return firstReference(args.mergeRequests) ?? firstReference(args.findings) ?? firstReference(args.jobs);
};
var summarize = (block) => {
  const card2 = asGitLabPresentation(block?.meta);
  if (card2 === void 0) return "done";
  let mergeRequests = 0;
  let findings = 0;
  let jobs = 0;
  for (const item3 of card2.items) {
    if (item3.kind === "merge_request") mergeRequests += 1;
    else if (item3.kind === "finding") findings += 1;
    else jobs += 1;
  }
  const parts = [];
  if (mergeRequests > 0) parts.push(countText(mergeRequests, "merge request"));
  if (findings > 0) parts.push(countText(findings, "finding"));
  if (jobs > 0) parts.push(countText(jobs, "failed job"));
  if (card2.total !== void 0 && card2.total > card2.items.length)
    parts.push(`of ${card2.total}`);
  return parts.join(" \xB7 ");
};
var GitLabPresentRow = createToolRow({
  displayName: () => "Merge requests",
  asked: askedFor,
  summarize
});
var askedReview = (block) => {
  const args = blockArgs(block);
  const action2 = typeof args.action === "string" ? args.action : void 0;
  const reference = typeof args.mergeRequest === "string" ? args.mergeRequest : void 0;
  if (action2 === void 0) return reference;
  return reference === void 0 ? action2 : `${action2} \xB7 ${reference}`;
};
var summarizeReview = (block) => {
  const first = textOf(block).split("\n")[0]?.trim() ?? "";
  return first === "" ? "done" : first;
};
var GitLabReviewRow = createToolRow({
  displayName: () => "Merge request review",
  asked: askedReview,
  summarize: summarizeReview
});

// src/client/plugin-id.ts
var PLUGIN_ID = "dsh-gitlab";

// src/client/sidebar/panel.tsx
var import_dsh_client_ui_primitives12 = require("@deepseek-ai/dsh-client-ui-primitives");
var import_react10 = require("react");

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
    (note3) => !note3.system && note3.position !== void 0
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
var note2 = object({
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
  notes: required(list2(note2))
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
var job3 = object({
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
  jobs: required(list2(job3))
});
var readPipeline = (value) => pipeline(value) ?? null;
var mergeRequest2 = object({
  project: required(nonEmptyString),
  iid: required(number),
  title: required(nonEmptyString),
  url: optional(nonEmptyString),
  state: optional(nonEmptyString),
  draft: required(isTrue),
  author: optional(person),
  assignees: required(list2(person)),
  reviewers: required(list2(person)),
  labels: required(list2(string)),
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
  approvedBy: required(list2(person)),
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
  mr: required(mergeRequest2),
  diffs: required(list2(diffFile)),
  discussions: required(list2(discussion)),
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
  job: required(job3),
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

// src/client/components/mr-diff.tsx
var import_dsh_client_ui_primitives7 = require("@deepseek-ai/dsh-client-ui-primitives");

// src/client/diff.ts
var HUNK_HEADER = /^@@/u;
var FILE_HEADER = /^(?:---|\+\+\+)(?:\s|$)|^(?:diff --git|index |new file mode|deleted file mode|similarity index|rename from|rename to)/u;
var NO_NEWLINE = /^\\/u;
function patchToHunks(file) {
  const patch = file.patch;
  if (patch === void 0 || patch.trim() === "") return [];
  const hunks = [];
  let current;
  let inHeader = true;
  for (const line of patch.split(/\r?\n/u)) {
    if (HUNK_HEADER.test(line)) {
      current = { before: [], after: [] };
      hunks.push(current);
      inHeader = false;
      continue;
    }
    if (line === "" || NO_NEWLINE.test(line)) continue;
    if (inHeader && FILE_HEADER.test(line)) continue;
    if (current === void 0) {
      current = { before: [], after: [] };
      hunks.push(current);
      inHeader = false;
    }
    const marker = line.slice(0, 1);
    const text = line.slice(1);
    if (marker === "+") {
      current.after.push(text);
      continue;
    }
    if (marker === "-") {
      current.before.push(text);
      continue;
    }
    if (marker === " ") {
      current.before.push(text);
      current.after.push(text);
      continue;
    }
    current.before.push(line);
    current.after.push(line);
  }
  return hunks.filter((hunk) => hunk.before.length > 0 || hunk.after.length > 0).map((hunk) => ({
    path: file.path,
    oldText: file.newFile ? null : hunk.before.join("\n"),
    newText: hunk.after.join("\n")
  }));
}

// src/client/components/mr-diff.tsx
var import_jsx_runtime13 = require("react/jsx-runtime");
var DIFF_LABELS = {
  codeLabel: "Изменения",
  wrapLabel: "Переносить строки",
  unwrapLabel: "Сохранять столбцы",
  copy: "Копировать",
  copied: "Скопировано",
  collapseAria: "Свернуть изменения",
  expandAria: (hidden) => `Show ${hidden} more lines`,
  collapse: "Свернуть",
  expand: (hidden) => `Show ${hidden} more lines`
};
var FileDiff = ({ file }) => {
  const hunks = patchToHunks(file);
  return /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("li", { className: item2, children: [
    /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: diffHead, children: [
      /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { className: diffPath, children: file.path }),
      file.newFile ? /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(import_dsh_client_ui_primitives7.Tag, { tone: "success", children: "Новый файл" }) : null,
      file.deletedFile ? /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(import_dsh_client_ui_primitives7.Tag, { tone: "danger", children: "Удалён" }) : null,
      file.renamedFile ? /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(import_dsh_client_ui_primitives7.Tag, { tone: "neutral", children: "Переименован" }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { className: added, children: `+${file.added}` }),
      /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { className: removed, children: `\u2212${file.removed}` })
    ] }),
    hunks.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { className: caption2, children: "GitLab не вернул изменения для этого файла." }) : /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(import_dsh_client_ui_primitives7.DiffBlock, { diffs: hunks, labels: DIFF_LABELS })
  ] });
};
var MrDiff = ({
  diffs
}) => {
  if (diffs.length === 0)
    return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Section, { title: "Изменения", children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { className: caption2, children: "В запросе на слияние нет изменённых файлов либо GitLab не вернул их изменения." }) });
  return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Section, { title: `Files (${diffs.length})`, children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("ul", { className: list3, "data-layout": "list", children: diffs.map((file) => /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(FileDiff, { file }, `${file.oldPath ?? ""}->${file.path}`)) }) });
};

// src/client/components/mr-discussions.tsx
var import_dsh_client_ui_primitives9 = require("@deepseek-ai/dsh-client-ui-primitives");
var import_react7 = require("react");

// src/client/components/confirm-row.tsx
var import_dsh_client_ui_primitives8 = require("@deepseek-ai/dsh-client-ui-primitives");
var import_react6 = require("react");
var import_jsx_runtime14 = require("react/jsx-runtime");
var captionOf = (draft2, threadLabel) => {
  if (draft2.body !== void 0)
    return "This is exactly what GitLab will receive.";
  const thread2 = threadLabel ?? draft2.discussionId;
  if (draft2.action === "resolve" || draft2.action === "unresolve")
    return draft2.action === "resolve" ? `Changes only one flag: ${thread2 ?? "this thread"} becomes resolved.` : `Changes only one flag: ${thread2 ?? "this thread"} becomes open again.`;
  return `GitLab records this on ${draft2.subject}; it cannot be undone from here.`;
};
var ConfirmRow = ({
  draft: draft2,
  busy,
  sending,
  failure,
  threadLabel,
  onSend,
  onCancel
}) => {
  const row2 = (0, import_react6.useRef)(null);
  (0, import_react6.useEffect)(() => {
    row2.current?.scrollIntoView({ block: "nearest" });
  }, []);
  return /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)(
    "section",
    {
      ref: row2,
      className: draft,
      "data-review-draft": draft2.action,
      "aria-label": `Confirm: ${draft2.summary}`,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { className: panelSectionTitle, children: `${draft2.summary} \xB7 ${draft2.subject}` }),
        draft2.body === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("pre", { className: draftText, children: draft2.body }),
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { className: caption2, children: captionOf(draft2, threadLabel) }),
        failure === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("p", { className: error2, role: "alert", children: failure }),
        /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: actions2, children: [
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(import_dsh_client_ui_primitives8.Button, { size: "sm", variant: "primary", disabled: busy, onClick: onSend, children: sending ? "Sending\u2026" : failure === void 0 ? "Send" : "Try again" }),
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(import_dsh_client_ui_primitives8.Button, { size: "sm", variant: "ghost", disabled: busy, onClick: onCancel, children: "Отмена" })
        ] })
      ]
    }
  );
};

// src/client/components/mr-discussions.tsx
var import_jsx_runtime15 = require("react/jsx-runtime");
var FILTERS = [
  { value: "all", label: "Все" },
  { value: "unresolved", label: "Незакрытые обсуждения" },
  { value: "findings", label: "Находки" }
];
var EMPTY_TEXT = {
  all: "В этом запросе на слияние пока нет обсуждений.",
  unresolved: "Все обсуждения закрыты; ожидающих ответа нет.",
  findings: "В этом запросе на слияние нет замечаний проверки."
};
var openingNote = (discussion2) => discussion2.notes.find((note3) => !note3.system);
function positionText(discussion2) {
  const position2 = openingNote(discussion2)?.position;
  if (position2?.file === void 0) return void 0;
  const line = position2.newLine ?? position2.oldLine;
  const side = position2.newLine === void 0 && position2.oldLine !== void 0 ? " (removed)" : "";
  return line === void 0 ? position2.file : `${position2.file}:${line}${side}`;
}
var Note = ({ note: note3, index }) => /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: note, children: [
  /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: noteHead, children: [
    /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { className: noteAuthor, children: note3.author?.username ?? "GitLab" }),
    note3.createdAt === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { className: caption2, children: whenText(note3.createdAt) }),
    note3.system ? /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(import_dsh_client_ui_primitives9.Tag, { tone: "quiet", children: "Событие" }) : null,
    note3.internal ? /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(import_dsh_client_ui_primitives9.Tag, { tone: "warning", children: "Внутренний комментарий" }) : null
  ] }),
  note3.system ? /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { className: caption2, children: note3.body }) : /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(Prose, { text: note3.body })
] }, note3.id ?? index);
var Thread = ({ discussion: discussion2, mr, review, actions: actions3, focused }) => {
  const [reply, setReply] = (0, import_react7.useState)(void 0);
  const row2 = (0, import_react7.useRef)(null);
  const where = positionText(discussion2);
  const bot = openingNote(discussion2)?.author?.bot === true;
  (0, import_react7.useEffect)(() => {
    if (focused) row2.current?.scrollIntoView({ block: "nearest" });
  }, [focused]);
  const pending = review.draft !== null && review.draft.discussionId === discussion2.id && (review.draft.action === "reply" || review.draft.action === "resolve" || review.draft.action === "unresolve") ? review.draft : null;
  const failure = review.error !== void 0 && review.error.place.discussionId === discussion2.id ? review.error.message : void 0;
  const notice2 = review.notice !== void 0 && review.notice.place.discussionId === discussion2.id ? review.notice.message : void 0;
  return /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(
    "li",
    {
      ref: row2,
      className: `${thread} ${focused ? threadFocused : ""}`,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: threadHead, children: [
          /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { className: threadFile, children: where ?? "General note" }),
          discussion2.resolvable ? /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(import_dsh_client_ui_primitives9.Tag, { tone: discussion2.resolved ? "success" : "warning", children: discussion2.resolved ? "resolved" : "unresolved" }) : /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(import_dsh_client_ui_primitives9.Tag, { tone: "quiet", children: "Комментарий" }),
          bot ? /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(import_dsh_client_ui_primitives9.Tag, { tone: "info", children: "Бот" }) : null,
          /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { className: caption2, children: `${discussion2.notes.length} note${discussion2.notes.length === 1 ? "" : "s"}` })
        ] }),
        discussion2.notes.map((note3, index) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(Note, { note: note3, index }, note3.id ?? index)),
        /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: actions2, children: [
          /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
            import_dsh_client_ui_primitives9.Button,
            {
              size: "sm",
              variant: "outline",
              disabled: review.busy || review.sending,
              onClick: () => {
                setReply("");
              },
              children: "Ответить"
            }
          ),
          discussion2.resolvable ? /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
            import_dsh_client_ui_primitives9.Button,
            {
              size: "sm",
              variant: "ghost",
              disabled: review.busy || review.sending,
              onClick: () => {
                void review.propose({
                  project: mr.project,
                  iid: mr.iid,
                  action: discussion2.resolved ? "unresolve" : "resolve",
                  discussionId: discussion2.id
                });
              },
              children: discussion2.resolved ? "Reopen" : "Resolve"
            }
          ) : null
        ] }),
        reply === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
          import_dsh_client_ui_primitives9.InlineEditor,
          {
            value: reply,
            label: "Ответить в этом обсуждении",
            onChange: setReply,
            onSave: () => {
              if (review.busy) return;
              void review.propose({
                project: mr.project,
                iid: mr.iid,
                action: "reply",
                discussionId: discussion2.id,
                body: reply
              }).then((opened) => {
                if (opened) setReply(void 0);
              });
            },
            onCancel: () => {
              setReply(void 0);
            }
          }
        ),
        pending === null && failure !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("p", { className: error2, role: "alert", children: failure }) : null,
        pending === null ? null : /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
          ConfirmRow,
          {
            draft: pending,
            busy: actions3.busy || review.busy || review.sending,
            sending: review.sending,
            failure,
            threadLabel: where,
            onSend: () => {
              review.send(actions3);
            },
            onCancel: review.cancel
          }
        ),
        notice2 === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { className: notice, role: "status", children: notice2 })
      ]
    }
  );
};
var MrDiscussions = ({
  mr,
  discussions,
  review,
  actions: actions3,
  focusDiscussionId
}) => {
  const [filter, setFilter] = (0, import_react7.useState)("all");
  const [comment, setComment] = (0, import_react7.useState)(void 0);
  const unresolved = discussions.filter(
    (discussion2) => !discussion2.resolved && discussion2.resolvable
  ).length;
  const findings = discussions.filter(
    (discussion2) => isFinding(discussion2)
  ).length;
  const shown = discussions.filter((discussion2) => {
    if (review.draft?.discussionId === discussion2.id) return true;
    if (filter === "unresolved")
      return !discussion2.resolved && discussion2.resolvable;
    if (filter === "findings") return isFinding(discussion2);
    return true;
  });
  const commentDraft = review.draft !== null && review.draft.action === "comment" ? review.draft : null;
  const commentFailure = review.error !== void 0 && review.error.place.action === "comment" ? review.error.message : void 0;
  const commentNotice = review.notice !== void 0 && review.notice.place.action === "comment" ? review.notice.message : void 0;
  return /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(Section, { title: `Discussions (${discussions.length})`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
      import_dsh_client_ui_primitives9.SegmentedControl,
      {
        id: "gitlab-discussion-filter",
        value: filter,
        options: FILTERS.map(
          (option) => option.value === "unresolved" ? { ...option, label: `Unresolved (${unresolved})` } : option.value === "findings" ? { ...option, label: `Findings (${findings})` } : option
        ),
        onChange: setFilter,
        label: "Какие обсуждения показать"
      }
    ),
    comment === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
      import_dsh_client_ui_primitives9.Button,
      {
        size: "sm",
        variant: "outline",
        disabled: review.busy || review.sending,
        onClick: () => {
          setComment("");
        },
        children: "Написать комментарий"
      }
    ) : /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
      import_dsh_client_ui_primitives9.InlineEditor,
      {
        value: comment,
        label: "Прокомментировать запрос на слияние",
        onChange: setComment,
        onSave: () => {
          if (review.busy) return;
          void review.propose({
            project: mr.project,
            iid: mr.iid,
            action: "comment",
            body: comment
          }).then((opened) => {
            if (opened) setComment(void 0);
          });
        },
        onCancel: () => {
          setComment(void 0);
        }
      }
    ),
    commentDraft === null && commentFailure !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("p", { className: error2, role: "alert", children: commentFailure }) : null,
    commentDraft === null ? null : /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
      ConfirmRow,
      {
        draft: commentDraft,
        busy: actions3.busy || review.busy || review.sending,
        sending: review.sending,
        failure: commentFailure,
        onSend: () => {
          review.send(actions3);
        },
        onCancel: review.cancel
      }
    ),
    commentNotice === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { className: notice, role: "status", children: commentNotice }),
    shown.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { className: caption2, children: EMPTY_TEXT[filter] }) : /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("ul", { className: list3, "data-layout": "list", children: shown.map((discussion2) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
      Thread,
      {
        discussion: discussion2,
        mr,
        review,
        actions: actions3,
        focused: focusDiscussionId === discussion2.id
      },
      discussion2.id
    )) })
  ] });
};

// src/client/components/mr-overview.tsx
var import_dsh_client_ui_primitives10 = require("@deepseek-ai/dsh-client-ui-primitives");
var import_jsx_runtime16 = require("react/jsx-runtime");
function approvalText(approvals2, error3) {
  if (approvals2 === void 0)
    return error3 === void 0 ? "GitLab did not report who approved this merge request." : "GitLab did not report approvals for this merge request.";
  const people = approvals2.approvedBy.map((person2) => person2.username);
  const required2 = approvals2.required === void 0 || approvals2.required === 0 ? "" : ` ${approvals2.required} required.`;
  if (approvals2.approvedByViewer)
    return people.length <= 1 ? "Approved by you." : `Approved by you and ${people.length - 1} more.${required2}`;
  if (people.length === 0) return `No approvals yet.${required2}`;
  return `Approved by ${people.join(", ")}.${approvals2.left === void 0 || approvals2.left === 0 ? required2 : ` ${approvals2.left} more needed.`}`;
}
var Branches = ({ mr }) => {
  if (mr.sourceBranch === void 0 && mr.targetBranch === void 0)
    return null;
  return /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(Section, { title: "Ветки", children: /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: branchRow, children: [
    mr.sourceBranch === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: branch, children: mr.sourceBranch }),
    /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: caption2, children: "в" }),
    mr.targetBranch === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: branch, children: mr.targetBranch })
  ] }) });
};
var MrOverview = ({
  mr,
  review,
  actions: actions3,
  approvals: approvals2,
  approvalsError
}) => {
  const reviewers2 = peopleText(mr.reviewers);
  const assignees = peopleText(mr.assignees);
  const draft2 = review.draft !== null && (review.draft.action === "approve" || review.draft.action === "unapprove") ? review.draft : null;
  const failure = review.error !== void 0 && (review.error.place.action === "approve" || review.error.place.action === "unapprove") ? review.error.message : void 0;
  const notice2 = review.notice !== void 0 && (review.notice.place.action === "approve" || review.notice.place.action === "unapprove") ? review.notice.message : void 0;
  const busy = actions3.busy || review.busy || review.sending;
  return /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)(import_jsx_runtime16.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: badges, children: [
      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(Chip, { tone: mrStateTone(mr.state), value: mrStateLabel(mr.state) }),
      mr.draft ? /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(Chip, { tone: "warning", value: "Draft" }) : null,
      mr.hasConflicts ? /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(Chip, { tone: "danger", value: "Conflicts" }) : null,
      mr.mergeStatus === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(Chip, { tone: "neutral", value: mergeStatusLabel(mr.mergeStatus) }),
      approvals2?.approved === true ? /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(Chip, { tone: "success", value: "Approved" }) : null
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
      Facts,
      {
        items: [
          { label: "Автор", value: mr.author?.username },
          { label: "Проверяющие", value: reviewers2 ?? "none" },
          { label: "Ответственные", value: assignees },
          {
            label: "Обновлено",
            value: mr.updatedAt === void 0 ? void 0 : whenText(mr.updatedAt)
          },
          { label: "Комментарии", value: mr.userNotesCount }
        ]
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(Branches, { mr }),
    mr.labels.length === 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(Section, { title: "Метки", children: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { className: badges, children: mr.labels.map((label) => /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(Chip, { tone: "outline", value: label }, label)) }) }),
    /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(Section, { title: "Описание", children: mr.description === void 0 || mr.description.trim() === "" ? /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: caption2, children: "Описание отсутствует." }) : /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(Prose, { text: mr.description }) }),
    /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)(Section, { title: "Проверка изменений", children: [
      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { className: actions2, children: approvals2 === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)(import_jsx_runtime16.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
          import_dsh_client_ui_primitives10.Button,
          {
            size: "sm",
            variant: "outline",
            disabled: busy,
            onClick: () => {
              void review.propose({
                project: mr.project,
                iid: mr.iid,
                action: "approve"
              });
            },
            children: "Одобрить"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
          import_dsh_client_ui_primitives10.Button,
          {
            size: "sm",
            variant: "ghost",
            disabled: busy,
            onClick: () => {
              void review.propose({
                project: mr.project,
                iid: mr.iid,
                action: "unapprove"
              });
            },
            children: "Снять одобрение"
          }
        )
      ] }) : approvals2.approvedByViewer ? /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
        import_dsh_client_ui_primitives10.Button,
        {
          size: "sm",
          variant: "outline",
          disabled: busy,
          onClick: () => {
            void review.propose({
              project: mr.project,
              iid: mr.iid,
              action: "unapprove"
            });
          },
          children: "Снять одобрение"
        }
      ) : /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
        import_dsh_client_ui_primitives10.Button,
        {
          size: "sm",
          variant: "outline",
          disabled: busy,
          onClick: () => {
            void review.propose({
              project: mr.project,
              iid: mr.iid,
              action: "approve"
            });
          },
          children: "Одобрить"
        }
      ) }),
      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: caption2, children: approvalText(approvals2, approvalsError) }),
      draft2 === null && failure !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("p", { className: error2, role: "alert", children: failure }) : null,
      draft2 === null ? null : /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
        ConfirmRow,
        {
          draft: draft2,
          busy,
          sending: review.sending,
          failure,
          onSend: () => {
            review.send(actions3);
          },
          onCancel: review.cancel
        }
      ),
      notice2 === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: notice, role: "status", children: notice2 })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(Section, { title: "Открыть", children: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { className: actions2, children: mr.url === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: caption2, children: "GitLab не вернул ссылку на этот запрос на слияние." }) : /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
      "a",
      {
        className: link2,
        href: mr.url,
        target: "_blank",
        rel: "noreferrer",
        children: "Открыть в GitLab"
      }
    ) }) })
  ] });
};

// src/client/components/mr-pipeline.tsx
var import_dsh_client_ui_primitives11 = require("@deepseek-ai/dsh-client-ui-primitives");
var import_react8 = require("react");

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

// src/client/text.ts
var messageOf2 = (error3) => error3 instanceof Error ? error3.message : String(error3);

// src/client/components/mr-pipeline.tsx
var import_jsx_runtime17 = require("react/jsx-runtime");
var Log = ({ entry }) => /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)(Section, { title: `Log \xB7 ${entry.job.name}`, children: [
  /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("pre", { className: log, children: readJobLog(entry.log) }),
  entry.truncated ? /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("span", { className: caption2, children: "Показаны последние 64 КиБ журнала. Чтобы прочитать начало, откройте задание в GitLab." }) : null
] });
var Job = ({ job: job4, busy, focused, onOpen }) => /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)(
  "li",
  {
    id: `gitlab-job-${job4.id}`,
    className: `${job2} ${focused ? threadFocused : ""}`,
    children: [
      /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(
        import_dsh_client_ui_primitives11.StateDot,
        {
          state: job4.status === "failed" ? "error" : job4.status === "running" ? "ongoing" : job4.status === "success" ? "done" : "idle"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("span", { className: jobName, children: job4.name }),
      job4.stage === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(import_dsh_client_ui_primitives11.Tag, { tone: "neutral", children: job4.stage }),
      /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(import_dsh_client_ui_primitives11.Tag, { tone: jobTone(job4.status), children: jobStatusLabel(job4.status) }),
      job4.failureReason === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("span", { className: caption2, children: jobFailureReasonLabel(job4.failureReason) }),
      /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(import_dsh_client_ui_primitives11.Button, { size: "sm", variant: "ghost", disabled: busy, onClick: onOpen, children: "Журнал" }),
      job4.url === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(
        "a",
        {
          className: link2,
          href: job4.url,
          target: "_blank",
          rel: "noreferrer",
          children: "Открыть"
        }
      )
    ]
  }
);
var MrPipeline = ({ target }) => {
  const [load, setLoad] = (0, import_react8.useState)({ status: "loading" });
  const [log2, setLog] = (0, import_react8.useState)(null);
  const [busy, setBusy] = (0, import_react8.useState)(false);
  const [failure, setFailure] = (0, import_react8.useState)(void 0);
  const opened = (0, import_react8.useRef)(void 0);
  const openLog = (0, import_react8.useCallback)(
    (jobId) => {
      setBusy(true);
      setFailure(void 0);
      hostApi.jobLog(target.project, jobId).then((answer) => {
        const entry = asJobLogPanel(answer);
        if (entry === void 0)
          throw new Error(
            "the host answered with a log this version cannot draw"
          );
        setLog(entry);
      }).catch((error3) => {
        setFailure(messageOf2(error3));
      }).finally(() => {
        setBusy(false);
      });
    },
    [target.project]
  );
  (0, import_react8.useEffect)(() => {
    const controller = new AbortController();
    opened.current = void 0;
    hostApi.pipeline(target.project, target.iid, controller.signal).then((answer) => {
      const panel3 = asPipelinePanel(answer);
      if (panel3 === void 0)
        throw new Error(
          "the host answered with a pipeline this version cannot draw"
        );
      if (!controller.signal.aborted) setLoad({ status: "ready", panel: panel3 });
    }).catch((error3) => {
      if (!controller.signal.aborted)
        setLoad({ status: "error", message: messageOf2(error3) });
    });
    return () => {
      controller.abort();
    };
  }, [target.project, target.iid]);
  (0, import_react8.useEffect)(() => {
    if (load.status !== "ready") return;
    const wanted = target.jobId;
    if (wanted === void 0 || opened.current === wanted) return;
    const job4 = load.panel.pipeline?.jobs.find(
      (candidate) => candidate.id === wanted
    );
    if (job4 === void 0) return;
    opened.current = wanted;
    document.getElementById(`gitlab-job-${wanted}`)?.scrollIntoView({ block: "nearest" });
    openLog(wanted);
  }, [load, target.jobId, openLog]);
  if (load.status === "loading")
    return /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("span", { className: caption2, children: "Загружаю сборку…" });
  if (load.status === "error")
    return /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("span", { className: error2, role: "alert", children: load.message });
  const pipeline2 = load.panel.pipeline;
  if (pipeline2 === null)
    return /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(Section, { title: "Сборка", children: /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("span", { className: caption2, children: "Для этого запроса на слияние ещё нет сборок." }) });
  const failed = pipeline2.jobs.filter((job4) => job4.status === "failed");
  return /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)(import_jsx_runtime17.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)(Section, { title: "Сборка", children: [
      /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: badges, children: [
        /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(import_dsh_client_ui_primitives11.Tag, { tone: jobTone(pipeline2.status), children: jobStatusLabel(pipeline2.status) }),
        /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("span", { className: caption2, children: `#${pipeline2.id}` }),
        pipeline2.ref === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("span", { className: branch, children: pipeline2.ref }),
        pipeline2.source === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("span", { className: caption2, children: pipeline2.source }),
        pipeline2.url === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(
          "a",
          {
            className: link2,
            href: pipeline2.url,
            target: "_blank",
            rel: "noreferrer",
            children: "Открыть в GitLab"
          }
        )
      ] }),
      failed.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("span", { className: caption2, children: "Упавших заданий нет." }) : /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("span", { className: caption2, children: `${failed.length} failed job${failed.length === 1 ? "" : "s"} of ${pipeline2.jobs.length}.` })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(Section, { title: `Jobs (${pipeline2.jobs.length})`, children: /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("ul", { className: list3, "data-layout": "list", children: pipeline2.jobs.map((job4) => /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(
      Job,
      {
        job: job4,
        busy,
        focused: target.jobId === job4.id,
        onOpen: () => {
          openLog(job4.id);
        }
      },
      job4.id
    )) }) }),
    log2 === null ? null : /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(Log, { entry: log2 }),
    failure === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("p", { className: error2, role: "alert", children: failure })
  ] });
};

// src/client/sidebar/review.ts
var import_react9 = require("react");
var DONE_TEXT = {
  comment: "Комментарий опубликован.",
  reply: "Ответ опубликован.",
  resolve: "Обсуждение закрыто.",
  unresolve: "Обсуждение возобновлено.",
  approve: "Одобрено.",
  unapprove: "Одобрение снято."
};
var placeOf = (request2) => ({
  action: request2.action,
  ...request2.discussionId === void 0 ? {} : { discussionId: request2.discussionId }
});
var useReview = () => {
  const [draft2, setDraft] = (0, import_react9.useState)(null);
  const [busy, setBusy] = (0, import_react9.useState)(false);
  const [sending, setSending] = (0, import_react9.useState)(false);
  const [error3, setError] = (0, import_react9.useState)(void 0);
  const [notice2, setNotice] = (0, import_react9.useState)(void 0);
  const propose = (0, import_react9.useCallback)(
    async (request2) => {
      const place = placeOf(request2);
      setBusy(true);
      setError(void 0);
      setNotice(void 0);
      try {
        const answer = await hostApi.reviewDraft(request2);
        const parsed = asReviewDraft(answer.draft);
        if (parsed === void 0)
          throw new Error(
            "the host answered with a draft this version cannot show"
          );
        setDraft(parsed);
        return true;
      } catch (failure) {
        setError({ message: messageOf2(failure), place });
        return false;
      } finally {
        setBusy(false);
      }
    },
    []
  );
  const cancel = (0, import_react9.useCallback)(() => {
    setDraft(null);
    setError(void 0);
    setNotice(void 0);
  }, []);
  const send = (0, import_react9.useCallback)(
    (actions3) => {
      const pending = draft2;
      if (pending === null || sending) return;
      const place = placeOf(pending);
      setSending(true);
      setError(void 0);
      setNotice(void 0);
      actions3.run(async (target) => {
        try {
          const answer = await hostApi.review({
            project: target.project,
            iid: target.iid,
            action: pending.action,
            ...pending.body === void 0 ? {} : { body: pending.body },
            ...pending.discussionId === void 0 ? {} : { discussionId: pending.discussionId }
          });
          setDraft(null);
          setNotice({ message: DONE_TEXT[pending.action], place });
          return answer;
        } catch (failure) {
          setError({ message: messageOf2(failure), place });
          return await hostApi.mergeRequest(target.project, target.iid);
        } finally {
          setSending(false);
        }
      });
    },
    [draft2, sending]
  );
  return { draft: draft2, busy, sending, error: error3, notice: notice2, propose, cancel, send };
};

// src/client/sidebar/panel.tsx
var import_jsx_runtime18 = require("react/jsx-runtime");
var TABS = [
  {
    value: "overview",
    label: "Обзор",
    id: "gitlab-tab-overview",
    panelId: "gitlab-panel-overview"
  },
  {
    value: "diff",
    label: "Изменения",
    id: "gitlab-tab-diff",
    panelId: "gitlab-panel-diff"
  },
  {
    value: "discussions",
    label: "Обсуждения",
    id: "gitlab-tab-discussions",
    panelId: "gitlab-panel-discussions"
  },
  {
    value: "pipeline",
    label: "Сборка",
    id: "gitlab-tab-pipeline",
    panelId: "gitlab-panel-pipeline"
  }
];
var MrView = ({
  data,
  params,
  actions: actions3
}) => {
  const wanted = params.tab ?? "overview";
  const [tab2, setTab] = (0, import_react10.useState)(wanted);
  const review = useReview();
  const mr = data.mr;
  const active = TABS.find((candidate) => candidate.value === tab2);
  (0, import_react10.useEffect)(() => {
    setTab(wanted);
  }, [params.project, params.iid, wanted]);
  return /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(import_jsx_runtime18.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("header", { className: mrHead, children: [
      /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: panelTitleRow, children: [
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { className: panelKey, children: `${mr.project}!${mr.iid}` }),
        mr.url === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
          "a",
          {
            className: link2,
            href: mr.url,
            target: "_blank",
            rel: "noreferrer",
            children: "Открыть в GitLab"
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("h2", { className: panelSummary, children: mr.title }),
      data.truncated === true ? /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { className: caption2, children: "GitLab вернул больше страниц изменений или обсуждений, чем загрузила панель. Показаны не все данные." }) : null
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { className: tabs, children: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
      import_dsh_client_ui_primitives12.SegmentedTabs,
      {
        items: TABS,
        value: tab2,
        onChange: setTab,
        label: "Разделы запроса на слияние"
      }
    ) }),
    /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { id: active?.panelId, role: "tabpanel", "aria-labelledby": active?.id, children: [
      tab2 === "overview" ? /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
        MrOverview,
        {
          mr,
          review,
          actions: actions3,
          approvals: data.approvals,
          approvalsError: data.approvalsError
        }
      ) : null,
      tab2 === "diff" ? /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(MrDiff, { diffs: data.diffs }) : null,
      tab2 === "discussions" ? /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
        MrDiscussions,
        {
          mr,
          discussions: data.discussions,
          review,
          actions: actions3,
          focusDiscussionId: params.discussionId
        }
      ) : null,
      tab2 === "pipeline" ? /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(MrPipeline, { target: params }) : null
    ] })
  ] });
};
var provider = {
  emptyMessage: "Панель открыта без запроса на слияние.",
  parseParams: (value) => asPanelTarget(value),
  identity: (target) => `${target.project}!${target.iid}#${target.tab ?? ""}#${target.discussionId ?? ""}#${target.jobId ?? ""}`,
  title: (target) => `!${target.iid}`,
  fetch: async (target, signal) => await hostApi.mergeRequest(target.project, target.iid, signal),
  parse: (value) => asMergeRequestPanel(value),
  view: (props) => /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(MrView, { ...props })
};
var GitLabPanel = createPanelBody(provider);
var GitLabPanelTitle = createPanelTitle(provider);

// src/client/styles/styles-runtime.ts
var installGitLabStyles = () => installStyles(PLUGIN_ID, '/* vanilla-extract-css-ns:../integration-ui/src/styles/styles.css.ts.vanilla.css?source=#H4sIAAAAAAAAE81ZyW7kNhC9-ysIAwHGBxpS2-50ZMyXBDlQYknNaYpUSKqXCebfA5FaqNVqjTPIyTAlVRVrefWq-vl0lsZkAfrnASHKdMHJLUIph-v7A7J_MWUKEsOkiFAieZmL6klGigiF-8K-VhBKmcgidCiuKLAfSmGwZt8hQuGLe4kzAfgILDuaCO127jCRXKoInYn6gjHVF0w4IxpzEgPHhWI5Uben94cfD8_OztDa2eoLd8W1tSKWioKKUPD8VlyRlpzRkWANxjCRaZwQRbE2Sp7gqfsYK0JZqX2D3Am-cvcaSU6ZkqWgY6P7slPGuW_5btrDhLNMYGYg1xFKQBhQ1fG3UhuW3nAihQFhIqQLkgCOwVwAvADsegHAsTRG5s15q_vF6vZj8uq-s0eXOiZvQeB983qXvdaavSe01rObiH14WBF7A8owF3yELkdmAFsXREjIiyKFZ-mbtXRRmoZECjrIpf32G1ZlUVkRoYEtv488_RkeaMUf7jf5MGMyQjlRGRPYyGKUMH_8J8laey9novXEazBAkH2DILG8Vi60h3VxxtK3kVgbFy4R9y-RKUatLYpRbCAvODGAHaLpyFpVXwCFqarDU-YC9ypNyYs7qP93-mvkQ34BJZ590RgVf0Vl0LEJ1TUvjJrjnSbJM6iUy0udQ0TcLkdQsAXDYaHX9DO0l28x0VCZ1uaTxf5BGIJeMgXuOtpgbW7ceqj6vrUkXZHmI7WvXRZ3jmxFZiMACKe8ut8IAEcrfnylRQ-MS6AFhk7wn5QYgjm5ydJ8faw0PP5llXXAN3xZJ0pyTmIOXx-NKqH-ICfX9qIv-2CQP7cIkdLI5szJwDEcyZlVvqhqkDCLGu5ZTBTOSmOq1q5Npc3veKrmEz37mGMJUjNHWxRwYtgZ3jdwnCmK02TdGsZRYxffraIZOX2aD4pmIuOVl_vXbMnQ64gMzSvi2YKiOvrTaiqEDoN1WnTua2HRkegv5Ck6VpG3Upf4FKv6C0mqwOE4w_ajsbi4NEaKz5L5bQsizLXYtXH8NsKMtw_p2WLExgJfevVxcs85XCMUorAtyBlMW9TlZDXlHaEjo9Q1fQNXg7sHwDkrNNMfty0eRSQ1dTRbUvH4-N4rahJryUtjw8CEBhM1xKGXk0wcQTHjic-tXFIUQBQRiYehTT23_3uZZBQRuiAKhGlC4wkfQm5SKl2hWSGZY0mtdrHIVpk4PU1HvvYnhUQq4jww6GbCq4HRu6WgoJqsHTxtWgmVxgBtX2g_wTJNrX_7WSSiVCalxmemWczhl-mVPVbTEi8fCYOGFXSdaDfsRF0f6mVjoQA3_OMiFcWxAnKKkP2Dq5M2PinJGb91UcTeKU4khS6USwzr-W01YC-DW07UicqLsLpxzGVy8rGtWMo8bSo2DEpJNcXZ_t62H-ixs0mSrjYJPgyacrsHaCfb__cyQG-e4_zhaffac6VZHjheJnrK3iHLvQy-9EcvDqnpaulXjzjnz5uIW5mXPuGpcmslq7J8Z0uR_iyi3L_9uH7qKmE-K2_TXGS4Dwy27QO_929h3emvC91ec9SN72WuYTgPU30KNQ9cbQUEwW9Dn91ThcvpFWe44qc942dWj_cYP7vAGTTeFod3r8tznz27-nRxXYp0t3pZe6u1W6tBtrckwrtt2OTphLF3z_LhzIp1Te_rhLwNZl1tWHK6WTJVtVsbn--YCWrd8j6xLG465p1ZtWF9-iHyht7-dCMWdrIOy_1wasaq--HETxWd2Jnd6H1RI3NroklzoNp-2BboJoznYA95y5ftZJJKlUeoLApQCdEf7-UmEzL-ae9v-EXH35M6ingY19gGKuEYrS6TBLSe1Ew3ZnAnAWZHSSdEA0-d4MocNTEoLo2czdmaYbE3i06FZdwCP5onQ1g5UPpf3DcS_vgXLaLKhH8cAAA */\n.kvottg0 {\n  display: flex;\n  flex-direction: column;\n  gap: 16px;\n  padding: 8px 0;\n  font-size: 13px;\n  line-height: 22px;\n  color: var(--dsw-alias-label-primary);\n}\n.kvottg1 {\n  padding: 12px 16px;\n  border: 0.5px solid var(--dsw-alias-settings-card-stroke);\n  border-radius: var(--dsw-radius-xl);\n  background: var(--dsw-alias-settings-card-fill);\n}\n.kvottg2 {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 12px;\n  padding-bottom: 12px;\n}\n.kvottg3 {\n  font-size: 14px;\n  font-weight: 500;\n}\n.kvottg4 {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  font-size: 12px;\n  line-height: 18px;\n  color: var(--dsw-alias-label-tertiary);\n  white-space: nowrap;\n}\n.kvottg5 {\n  color: var(--dsw-alias-label-secondary);\n}\n.kvottg6 {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  flex-wrap: wrap;\n}\n.kvottg7 {\n  font-size: 12px;\n  line-height: 18px;\n  color: var(--dsw-alias-label-tertiary);\n}\n.kvottg8 {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  flex-wrap: wrap;\n  margin-top: 12px;\n}\n.kvottg9 {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 16px;\n  min-height: 40px;\n  padding: 6px 0;\n  box-sizing: border-box;\n}\n.kvottga {\n  margin-top: 12px;\n}\n.kvottgb {\n  display: grid;\n  grid-template-columns: min-content 1fr;\n  column-gap: 12px;\n  row-gap: 2px;\n  margin: 8px 0 0;\n}\n.kvottgc {\n  margin: 0;\n  font-size: 12px;\n  line-height: 18px;\n  color: var(--dsw-alias-label-tertiary);\n  white-space: nowrap;\n}\n.kvottgd {\n  margin: 0;\n  min-width: 0;\n  font-size: 12px;\n  line-height: 18px;\n  overflow-wrap: anywhere;\n  color: var(--dsw-alias-label-primary);\n}\n.kvottge {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: baseline;\n  gap: 2px 12px;\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n.kvottgf {\n  display: flex;\n  align-items: baseline;\n  gap: 4px;\n  min-width: 0;\n}\n.kvottgg {\n  font-size: 11px;\n  line-height: 16px;\n  color: var(--dsw-alias-label-tertiary);\n}\n.kvottgh {\n  list-style: none;\n  margin: 0;\n  padding: 0;\n  display: grid;\n  gap: 8px;\n}\n.kvottgh[data-layout=list] {\n  gap: 6px;\n}\n.kvottgh[data-scrollable=true] {\n  max-height: 360px;\n  overflow-y: auto;\n  overscroll-behavior: contain;\n  scrollbar-gutter: stable;\n  padding-right: 2px;\n}\n.kvottgi {\n  position: relative;\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n  padding: 8px 12px;\n  border: 0.5px solid var(--dsw-alias-border-l2);\n  border-radius: var(--dsw-radius-md);\n}\n.kvottgh[data-layout=single] .kvottgi {\n  padding: 14px 16px;\n  border-radius: var(--dsw-radius-lg);\n}\n.kvottgh[data-layout=list] .kvottgi {\n  padding: 6px 10px;\n  border-radius: var(--dsw-radius-sm);\n}\n.kvottgi:has(a):hover {\n  background: var(--dsw-alias-interactive-bg-hover);\n}\n.kvottgi:has(button):hover {\n  background: var(--dsw-alias-interactive-bg-hover);\n}\n.kvottgj {\n  display: flex;\n  align-items: baseline;\n  gap: 8px;\n  flex-wrap: wrap;\n}\n.kvottgh[data-layout=single] .kvottgj {\n  font-size: 15px;\n  font-weight: 500;\n}\n.kvottgh[data-layout=list] .kvottgj {\n  font-size: 13px;\n}\n.kvottgk {\n  flex: 1 1 auto;\n  min-width: 0;\n}\n.kvottgh[data-layout=list] .kvottgk {\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n.kvottgl::after {\n  content: "";\n  position: absolute;\n  inset: 0;\n  border-radius: inherit;\n}\n.kvottgm {\n  appearance: none;\n  border: none;\n  background: transparent;\n  font: inherit;\n  padding: 0;\n  cursor: pointer;\n}\n.kvottgn {\n  color: var(--dsw-alias-link);\n  font-weight: 500;\n  text-decoration: none;\n}\n.kvottgn:hover {\n  text-decoration: underline;\n  text-decoration-style: dotted;\n  text-underline-offset: 3px;\n}\n.kvottgn:focus-visible {\n  text-decoration: underline;\n  text-decoration-style: dotted;\n  text-underline-offset: 3px;\n}\n.kvottgo {\n  margin: 8px 0 0;\n  padding: 10px;\n  max-height: 260px;\n  overflow: auto;\n  white-space: pre-wrap;\n  word-break: break-word;\n  font-family: var(--ds-font-family-code);\n  font-size: 12px;\n  line-height: 1.5;\n  border-radius: var(--dsw-radius-lg);\n  background: var(--dsw-alias-markdown-code-block);\n}\n.kvottgp {\n  color: var(--dsw-alias-state-error-primary);\n}\n.kvottgq {\n  display: flex;\n  flex-direction: column;\n  gap: 12px;\n  margin-top: 12px;\n}\n.kvottgr {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n  padding: 12px 16px 14px;\n  border: 0.5px solid var(--dsw-alias-settings-card-stroke);\n  border-radius: var(--dsw-radius-xl);\n  background: var(--dsw-alias-settings-card-fill);\n}\n.kvottgs {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  min-height: 24px;\n}\n.kvottgt {\n  margin: 0;\n  font-size: 13px;\n  font-weight: 600;\n  color: var(--dsw-alias-label-primary);\n}\n.kvottgu {\n  margin-left: auto;\n  font-size: 12px;\n  line-height: 18px;\n  color: var(--dsw-alias-label-tertiary);\n  white-space: nowrap;\n}\n.kvottgv {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  flex-wrap: wrap;\n}\n.kvottgw {\n  padding: 2px 6px;\n  border-radius: var(--dsw-radius-sm);\n  background: var(--dsw-alias-markdown-code-block);\n  font-family: var(--ds-font-family-code);\n  font-size: 12px;\n  color: var(--dsw-alias-label-secondary);\n}\n.kvottgx {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  flex-wrap: wrap;\n  min-height: 24px;\n}\n.kvottgy {\n  font-size: 13px;\n  line-height: 20px;\n  color: var(--dsw-alias-label-primary);\n}\n.kvottgz {\n  display: block;\n}\n.kvottg10 {\n  cursor: pointer;\n  border-radius: var(--dsw-radius-sm);\n}\n.kvottg11 {\n  display: flex;\n  flex: 1 1 auto;\n  flex-direction: column;\n  height: 100%;\n  min-height: 0;\n  color: var(--dsw-alias-label-primary);\n  background: var(--dsw-alias-bg-base);\n}\n.kvottg12 {\n  display: flex;\n  flex: 1 1 auto;\n  flex-direction: column;\n  gap: 16px;\n  min-height: 0;\n  padding: 12px 16px 24px;\n  overflow-y: auto;\n  overflow-x: hidden;\n  font-size: 13px;\n  line-height: 20px;\n}\n.kvottg13 {\n  display: flex;\n  flex: 1 1 auto;\n  align-items: center;\n  justify-content: center;\n  gap: 10px;\n  min-height: 120px;\n  font-size: 13px;\n  color: var(--dsw-alias-label-tertiary);\n}\n.kvottg14 {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n}\n.kvottg15 {\n  position: sticky;\n  top: 0;\n  z-index: 1;\n  padding-bottom: 4px;\n  background: var(--dsw-alias-bg-base);\n}\n.kvottg16 {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  flex-wrap: wrap;\n}\n.kvottg17 {\n  font-family: var(--ds-font-family-code);\n  font-size: 12px;\n}\n.kvottg18 {\n  margin: 0;\n  font-size: 15px;\n  font-weight: 600;\n  line-height: 22px;\n}\n.kvottg19 {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n}\n.kvottg1a {\n  font-size: 11px;\n  font-weight: 600;\n  letter-spacing: 0.06em;\n  text-transform: uppercase;\n  color: var(--dsw-alias-label-tertiary);\n}\n.kvottg1b {\n  font-family: var(--ds-font-family-code);\n  font-size: 12px;\n  color: var(--dsw-alias-label-primary);\n}\n.kvottg1c {\n  margin-top: 8px;\n  font-size: 12px;\n  line-height: 18px;\n  color: var(--dsw-alias-state-success-primary);\n}\n.kvottg1d {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n}\n.kvottg1e {\n  appearance: none;\n  align-self: flex-start;\n  padding: 0;\n  border: none;\n  background: none;\n  color: var(--dsw-alias-link);\n  font: inherit;\n  font-size: 12px;\n  cursor: pointer;\n  text-decoration: none;\n}\n.kvottg1e:hover {\n  text-decoration: underline;\n}\n.kvottg1e:focus-visible {\n  text-decoration: underline;\n}\n\n/* vanilla-extract-css-ns:src/client/styles/styles.css.ts.vanilla.css?source=#H4sIAAAAAAAAE81WwZLaMAy98xU-loOZhF3o1vsxHcdWEjWOndqGhHb67504YXEKdIHCbC9kUPCTnp708OJr-n0lM8gS8nNGiETXKL5jhLaQVehpZrrXGYm_UmMRtGdkC9aj4Cp-r1ADFYrXDSNP_QuzBZsr0zJSopSg-1hutKcOfwAj6bIJ-OFcCViUnpH0ZQgKo4xlZMvtJ0qlaylXyB1VPANFHQijJbe7-evs12yxp5FOaeQKAlT_pBItCI9Gsx56U4diCt4wsu4TRijL0yhcYaEpeqgdIwK0BzuFGBO1to_0nxPUp4DacClRF4ykTbc_lRkrwVLLJW5czHiIUFfPw8-4qAprNloed6XmtpKm1VQYCTRTRlTzt2bnvEa1OxyiUTQcmJ_R5RYJngPNGOzphMjL5IIMjcX6CH91F4nX10v88r7EnwfuCjpGUpISvvGmP1Ojpi1KXzKSxGsx4nC9a0uw8GDBTrbz5SDXvbM6zz1QtxECnDud_cujs4O1xp7OzW8apHEKDmucNN1bKcMiM5IsVk1HnFEoj-oal10t55esfi2nRWcPmVvxX8_tGaORN-n3PNGPKsj9IGKkxhBcXiRhVBBcoE3GHfRGeI06-ZGjjl0LoXZ01HWS3OYAxYMNu_yYPXPgPerCUcGtpM5bU8HlK3fLv23EGQPnmtsC9bg7bYm9GzZcACONBTro_P5SPUSUb_fzkUikda9R8igvDNegiEN1pWvFl1APnaeHF6AUNg7dkVDa7En-i8FFRavjyZjMeCDAuzeJn_caH4rd83yvX6r4oGvj9Dq_WP11_FtjJc0s8IqR8KB9ZNKzOvRsP1Dp2XFSqP_YQ33OOq-9svwG6tuwOykNAAA */\n._1q5dbeb0 {\n  display: -webkit-box;\n  -webkit-box-orient: vertical;\n  -webkit-line-clamp: 3;\n  overflow: hidden;\n  font-size: 12px;\n  line-height: 18px;\n  color: var(--dsw-alias-label-secondary);\n}\n._1q5dbeb1 {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n}\n._1q5dbeb2 {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  flex-wrap: wrap;\n}\n._1q5dbeb3 {\n  padding: 1px 6px;\n  border-radius: var(--dsw-radius-sm);\n  background: var(--dsw-alias-markdown-code-block);\n  font-family: var(--ds-font-family-code);\n  font-size: 12px;\n  color: var(--dsw-alias-label-secondary);\n}\n._1q5dbeb4 {\n  font-size: 13px;\n  line-height: 20px;\n  color: var(--dsw-alias-label-primary);\n}\n._1q5dbeb5 {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n}\n._1q5dbeb6 {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  flex-wrap: wrap;\n}\n._1q5dbeb7 {\n  flex: 1 1 auto;\n  min-width: 0;\n  overflow-wrap: anywhere;\n  font-family: var(--ds-font-family-code);\n  font-size: 12px;\n  color: var(--dsw-alias-label-primary);\n}\n._1q5dbeb8 {\n  font-family: var(--ds-font-family-code);\n  font-size: 12px;\n  color: var(--dsw-alias-state-success-primary);\n}\n._1q5dbeb9 {\n  font-family: var(--ds-font-family-code);\n  font-size: 12px;\n  color: var(--dsw-alias-state-error-primary);\n}\n._1q5dbeba {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n  padding: 10px 12px;\n  border: 0.5px solid var(--dsw-alias-border-l2);\n  border-radius: var(--dsw-radius-md);\n}\n._1q5dbebb {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  flex-wrap: wrap;\n}\n._1q5dbebc {\n  flex: 1 1 auto;\n  min-width: 0;\n  overflow-wrap: anywhere;\n  font-family: var(--ds-font-family-code);\n  font-size: 12px;\n  color: var(--dsw-alias-label-secondary);\n}\n._1q5dbebd {\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n  padding-left: 10px;\n  border-left: 2px solid var(--dsw-alias-border-l2);\n}\n._1q5dbebe {\n  display: flex;\n  align-items: baseline;\n  gap: 8px;\n  flex-wrap: wrap;\n}\n._1q5dbebf {\n  font-size: 12px;\n  font-weight: 600;\n  color: var(--dsw-alias-label-primary);\n}\n._1q5dbebg {\n  font-size: 13px;\n  line-height: 20px;\n  color: var(--dsw-alias-label-primary);\n}\n._1q5dbebh {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n  padding: 10px 12px;\n  border: 0.5px solid var(--dsw-alias-settings-card-stroke);\n  border-radius: var(--dsw-radius-md);\n  background: var(--dsw-alias-markdown-code-block);\n}\n._1q5dbebi {\n  margin: 0;\n  white-space: pre-wrap;\n  overflow-wrap: anywhere;\n  font-size: 13px;\n  line-height: 20px;\n  color: var(--dsw-alias-label-primary);\n}\n._1q5dbebj {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  flex-wrap: wrap;\n  padding: 6px 10px;\n  border: 0.5px solid var(--dsw-alias-border-l2);\n  border-radius: var(--dsw-radius-sm);\n}\n._1q5dbebk {\n  flex: 1 1 auto;\n  min-width: 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  font-family: var(--ds-font-family-code);\n  font-size: 12px;\n}\n._1q5dbebl {\n  margin: 0;\n  padding: 10px;\n  max-height: 420px;\n  overflow: auto;\n  border-radius: var(--dsw-radius-lg);\n  background: var(--dsw-alias-markdown-code-block);\n  font-family: var(--ds-font-family-code);\n  font-size: 12px;\n  line-height: 1.5;\n  white-space: pre-wrap;\n  word-break: break-word;\n}\n._1q5dbebm {\n  border: 1px solid var(--dsw-alias-link);\n}\n._1q5dbebn {\n  font-size: 12px;\n  color: var(--dsw-alias-state-success-primary);\n}\n');

// src/client/index.ts
var inject = ["slots", "uiConversation"];
var apply = (ctx) => {
  ctx.effect(() => installGitLabStyles(), "gitlab: stylesheet");
  ctx.uiConversation.events.register(gitlabPresentation.definition);
  installPanelOpener(ctx);
  ctx.inject(["sidebarRightTabs"], (scoped) => {
    scoped.effect(
      () => scoped.sidebarRightTabs.register(panelDefinition()),
      "gitlab: panel type"
    );
    scoped.slots.inject(
      "sidebar.right.pane.tab",
      () => scoped.slots.register(
        { name: "sidebar.right.pane.tab", key: PANEL_ID },
        GitLabPanel
      )
    );
    scoped.slots.inject(
      "sidebar.right.pane.tab.title",
      () => scoped.slots.register(
        { name: "sidebar.right.pane.tab.title", key: PANEL_ID },
        GitLabPanelTitle
      )
    );
  });
  registerIntegrationsTab(
    ctx,
    { id: "gitlab", order: 30, label: "GitLab" },
    GitLabSection
  );
  ctx.slots.inject(
    "tool.call.toolview",
    () => ctx.slots.register(
      { name: "tool.call.toolview", key: GITLAB_PRESENT_TOOL },
      GitLabPresentRow
    )
  );
  ctx.slots.inject(
    "tool.call.toolview",
    () => ctx.slots.register(
      { name: "tool.call.toolview", key: GITLAB_REVIEW_TOOL },
      GitLabReviewRow
    )
  );
  ctx.slots.inject(
    "conversation.chat.turnTail",
    () => ctx.slots.register(
      {
        name: "conversation.chat.turnTail",
        id: PLUGIN_ID,
        order: 22
      },
      GitLabTail
    )
  );
};
return module.exports; } });
//# sourceMappingURL=client.js.map
