(function () {
  "use strict";
  /**
   * @license
   * Copyright 2019 Google LLC
   * SPDX-License-Identifier: Apache-2.0
   */ const hr = Symbol("Comlink.proxy"),
    Cn = Symbol("Comlink.endpoint"),
    On = Symbol("Comlink.releaseProxy"),
    Mt = Symbol("Comlink.finalizer"),
    ut = Symbol("Comlink.thrown"),
    pr = (t) => (typeof t == "object" && t !== null) || typeof t == "function",
    An = {
      canHandle: (t) => pr(t) && t[hr],
      serialize(t) {
        const { port1: e, port2: r } = new MessageChannel();
        return jt(t, e), [r, [r]];
      },
      deserialize(t) {
        return t.start(), Dn(t);
      },
    },
    Ln = {
      canHandle: (t) => pr(t) && ut in t,
      serialize({ value: t }) {
        let e;
        return (
          t instanceof Error
            ? (e = {
                isError: !0,
                value: { message: t.message, name: t.name, stack: t.stack },
              })
            : (e = { isError: !1, value: t }),
          [e, []]
        );
      },
      deserialize(t) {
        throw t.isError
          ? Object.assign(new Error(t.value.message), t.value)
          : t.value;
      },
    },
    mr = new Map([
      ["proxy", An],
      ["throw", Ln],
    ]);
  function Mn(t, e) {
    for (const r of t)
      if (e === r || r === "*" || (r instanceof RegExp && r.test(e))) return !0;
    return !1;
  }
  function jt(t, e = globalThis, r = ["*"]) {
    e.addEventListener("message", function n(i) {
      if (!i || !i.data) return;
      if (!Mn(r, i.origin)) {
        console.warn(`Invalid origin '${i.origin}' for comlink proxy`);
        return;
      }
      const { id: s, type: a, path: o } = Object.assign({ path: [] }, i.data),
        l = (i.data.argumentList || []).map(Se);
      let u;
      try {
        const f = o.slice(0, -1).reduce((v, S) => v[S], t),
          h = o.reduce((v, S) => v[S], t);
        switch (a) {
          case "GET":
            u = h;
            break;
          case "SET":
            (f[o.slice(-1)[0]] = Se(i.data.value)), (u = !0);
            break;
          case "APPLY":
            u = h.apply(f, l);
            break;
          case "CONSTRUCT":
            {
              const v = new h(...l);
              u = Vn(v);
            }
            break;
          case "ENDPOINT":
            {
              const { port1: v, port2: S } = new MessageChannel();
              jt(t, S), (u = Pn(v, [v]));
            }
            break;
          case "RELEASE":
            u = void 0;
            break;
          default:
            return;
        }
      } catch (f) {
        u = { value: f, [ut]: 0 };
      }
      Promise.resolve(u)
        .catch((f) => ({ value: f, [ut]: 0 }))
        .then((f) => {
          const [h, v] = ht(f);
          e.postMessage(Object.assign(Object.assign({}, h), { id: s }), v),
            a === "RELEASE" &&
              (e.removeEventListener("message", n),
              gr(e),
              Mt in t && typeof t[Mt] == "function" && t[Mt]());
        })
        .catch((f) => {
          const [h, v] = ht({
            value: new TypeError("Unserializable return value"),
            [ut]: 0,
          });
          e.postMessage(Object.assign(Object.assign({}, h), { id: s }), v);
        });
    }),
      e.start && e.start();
  }
  function jn(t) {
    return t.constructor.name === "MessagePort";
  }
  function gr(t) {
    jn(t) && t.close();
  }
  function Dn(t, e) {
    const r = new Map();
    return (
      t.addEventListener("message", function (i) {
        const { data: s } = i;
        if (!s || !s.id) return;
        const a = r.get(s.id);
        if (a)
          try {
            a(s);
          } finally {
            r.delete(s.id);
          }
      }),
      Dt(t, r, [], e)
    );
  }
  function ct(t) {
    if (t) throw new Error("Proxy has been released and is not useable");
  }
  function _r(t) {
    return Le(t, new Map(), { type: "RELEASE" }).then(() => {
      gr(t);
    });
  }
  const ft = new WeakMap(),
    dt =
      "FinalizationRegistry" in globalThis &&
      new FinalizationRegistry((t) => {
        const e = (ft.get(t) || 0) - 1;
        ft.set(t, e), e === 0 && _r(t);
      });
  function Zn(t, e) {
    const r = (ft.get(e) || 0) + 1;
    ft.set(e, r), dt && dt.register(t, e, t);
  }
  function Un(t) {
    dt && dt.unregister(t);
  }
  function Dt(t, e, r = [], n = function () {}) {
    let i = !1;
    const s = new Proxy(n, {
      get(a, o) {
        if ((ct(i), o === On))
          return () => {
            Un(s), _r(t), e.clear(), (i = !0);
          };
        if (o === "then") {
          if (r.length === 0) return { then: () => s };
          const l = Le(t, e, {
            type: "GET",
            path: r.map((u) => u.toString()),
          }).then(Se);
          return l.then.bind(l);
        }
        return Dt(t, e, [...r, o]);
      },
      set(a, o, l) {
        ct(i);
        const [u, f] = ht(l);
        return Le(
          t,
          e,
          { type: "SET", path: [...r, o].map((h) => h.toString()), value: u },
          f,
        ).then(Se);
      },
      apply(a, o, l) {
        ct(i);
        const u = r[r.length - 1];
        if (u === Cn) return Le(t, e, { type: "ENDPOINT" }).then(Se);
        if (u === "bind") return Dt(t, e, r.slice(0, -1));
        const [f, h] = yr(l);
        return Le(
          t,
          e,
          { type: "APPLY", path: r.map((v) => v.toString()), argumentList: f },
          h,
        ).then(Se);
      },
      construct(a, o) {
        ct(i);
        const [l, u] = yr(o);
        return Le(
          t,
          e,
          {
            type: "CONSTRUCT",
            path: r.map((f) => f.toString()),
            argumentList: l,
          },
          u,
        ).then(Se);
      },
    });
    return Zn(s, t), s;
  }
  function Bn(t) {
    return Array.prototype.concat.apply([], t);
  }
  function yr(t) {
    const e = t.map(ht);
    return [e.map((r) => r[0]), Bn(e.map((r) => r[1]))];
  }
  const vr = new WeakMap();
  function Pn(t, e) {
    return vr.set(t, e), t;
  }
  function Vn(t) {
    return Object.assign(t, { [hr]: !0 });
  }
  function ht(t) {
    for (const [e, r] of mr)
      if (r.canHandle(t)) {
        const [n, i] = r.serialize(t);
        return [{ type: "HANDLER", name: e, value: n }, i];
      }
    return [{ type: "RAW", value: t }, vr.get(t) || []];
  }
  function Se(t) {
    switch (t.type) {
      case "HANDLER":
        return mr.get(t.name).deserialize(t.value);
      case "RAW":
        return t.value;
    }
  }
  function Le(t, e, r, n) {
    return new Promise((i) => {
      const s = Wn();
      e.set(s, i),
        t.start && t.start(),
        t.postMessage(Object.assign({ id: s }, r), n);
    });
  }
  function Wn() {
    return new Array(4)
      .fill(0)
      .map(() =>
        Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16),
      )
      .join("-");
  }
  var E;
  (function (t) {
    t.assertEqual = (i) => {};
    function e(i) {}
    t.assertIs = e;
    function r(i) {
      throw new Error();
    }
    (t.assertNever = r),
      (t.arrayToEnum = (i) => {
        const s = {};
        for (const a of i) s[a] = a;
        return s;
      }),
      (t.getValidEnumValues = (i) => {
        const s = t.objectKeys(i).filter((o) => typeof i[i[o]] != "number"),
          a = {};
        for (const o of s) a[o] = i[o];
        return t.objectValues(a);
      }),
      (t.objectValues = (i) =>
        t.objectKeys(i).map(function (s) {
          return i[s];
        })),
      (t.objectKeys =
        typeof Object.keys == "function"
          ? (i) => Object.keys(i)
          : (i) => {
              const s = [];
              for (const a in i)
                Object.prototype.hasOwnProperty.call(i, a) && s.push(a);
              return s;
            }),
      (t.find = (i, s) => {
        for (const a of i) if (s(a)) return a;
      }),
      (t.isInteger =
        typeof Number.isInteger == "function"
          ? (i) => Number.isInteger(i)
          : (i) =>
              typeof i == "number" &&
              Number.isFinite(i) &&
              Math.floor(i) === i);
    function n(i, s = " | ") {
      return i.map((a) => (typeof a == "string" ? `'${a}'` : a)).join(s);
    }
    (t.joinValues = n),
      (t.jsonStringifyReplacer = (i, s) =>
        typeof s == "bigint" ? s.toString() : s);
  })(E || (E = {}));
  var Zt;
  (function (t) {
    t.mergeShapes = (e, r) => ({ ...e, ...r });
  })(Zt || (Zt = {}));
  const m = E.arrayToEnum([
      "string",
      "nan",
      "number",
      "integer",
      "float",
      "boolean",
      "date",
      "bigint",
      "symbol",
      "function",
      "undefined",
      "null",
      "array",
      "object",
      "unknown",
      "promise",
      "void",
      "never",
      "map",
      "set",
    ]),
    ae = (t) => {
      switch (typeof t) {
        case "undefined":
          return m.undefined;
        case "string":
          return m.string;
        case "number":
          return Number.isNaN(t) ? m.nan : m.number;
        case "boolean":
          return m.boolean;
        case "function":
          return m.function;
        case "bigint":
          return m.bigint;
        case "symbol":
          return m.symbol;
        case "object":
          return Array.isArray(t)
            ? m.array
            : t === null
              ? m.null
              : t.then &&
                  typeof t.then == "function" &&
                  t.catch &&
                  typeof t.catch == "function"
                ? m.promise
                : typeof Map < "u" && t instanceof Map
                  ? m.map
                  : typeof Set < "u" && t instanceof Set
                    ? m.set
                    : typeof Date < "u" && t instanceof Date
                      ? m.date
                      : m.object;
        default:
          return m.unknown;
      }
    },
    d = E.arrayToEnum([
      "invalid_type",
      "invalid_literal",
      "custom",
      "invalid_union",
      "invalid_union_discriminator",
      "invalid_enum_value",
      "unrecognized_keys",
      "invalid_arguments",
      "invalid_return_type",
      "invalid_date",
      "invalid_string",
      "too_small",
      "too_big",
      "invalid_intersection_types",
      "not_multiple_of",
      "not_finite",
    ]),
    $n = (t) => JSON.stringify(t, null, 2).replace(/"([^"]+)":/g, "$1:");
  class Y extends Error {
    get errors() {
      return this.issues;
    }
    constructor(e) {
      super(),
        (this.issues = []),
        (this.addIssue = (n) => {
          this.issues = [...this.issues, n];
        }),
        (this.addIssues = (n = []) => {
          this.issues = [...this.issues, ...n];
        });
      const r = new.target.prototype;
      Object.setPrototypeOf
        ? Object.setPrototypeOf(this, r)
        : (this.__proto__ = r),
        (this.name = "ZodError"),
        (this.issues = e);
    }
    format(e) {
      const r =
          e ||
          function (s) {
            return s.message;
          },
        n = { _errors: [] },
        i = (s) => {
          for (const a of s.issues)
            if (a.code === "invalid_union") a.unionErrors.map(i);
            else if (a.code === "invalid_return_type") i(a.returnTypeError);
            else if (a.code === "invalid_arguments") i(a.argumentsError);
            else if (a.path.length === 0) n._errors.push(r(a));
            else {
              let o = n,
                l = 0;
              for (; l < a.path.length; ) {
                const u = a.path[l];
                l === a.path.length - 1
                  ? ((o[u] = o[u] || { _errors: [] }), o[u]._errors.push(r(a)))
                  : (o[u] = o[u] || { _errors: [] }),
                  (o = o[u]),
                  l++;
              }
            }
        };
      return i(this), n;
    }
    static assert(e) {
      if (!(e instanceof Y)) throw new Error(`Not a ZodError: ${e}`);
    }
    toString() {
      return this.message;
    }
    get message() {
      return JSON.stringify(this.issues, E.jsonStringifyReplacer, 2);
    }
    get isEmpty() {
      return this.issues.length === 0;
    }
    flatten(e = (r) => r.message) {
      const r = {},
        n = [];
      for (const i of this.issues)
        i.path.length > 0
          ? ((r[i.path[0]] = r[i.path[0]] || []), r[i.path[0]].push(e(i)))
          : n.push(e(i));
      return { formErrors: n, fieldErrors: r };
    }
    get formErrors() {
      return this.flatten();
    }
  }
  Y.create = (t) => new Y(t);
  const Me = (t, e) => {
    let r;
    switch (t.code) {
      case d.invalid_type:
        t.received === m.undefined
          ? (r = "Required")
          : (r = `Expected ${t.expected}, received ${t.received}`);
        break;
      case d.invalid_literal:
        r = `Invalid literal value, expected ${JSON.stringify(t.expected, E.jsonStringifyReplacer)}`;
        break;
      case d.unrecognized_keys:
        r = `Unrecognized key(s) in object: ${E.joinValues(t.keys, ", ")}`;
        break;
      case d.invalid_union:
        r = "Invalid input";
        break;
      case d.invalid_union_discriminator:
        r = `Invalid discriminator value. Expected ${E.joinValues(t.options)}`;
        break;
      case d.invalid_enum_value:
        r = `Invalid enum value. Expected ${E.joinValues(t.options)}, received '${t.received}'`;
        break;
      case d.invalid_arguments:
        r = "Invalid function arguments";
        break;
      case d.invalid_return_type:
        r = "Invalid function return type";
        break;
      case d.invalid_date:
        r = "Invalid date";
        break;
      case d.invalid_string:
        typeof t.validation == "object"
          ? "includes" in t.validation
            ? ((r = `Invalid input: must include "${t.validation.includes}"`),
              typeof t.validation.position == "number" &&
                (r = `${r} at one or more positions greater than or equal to ${t.validation.position}`))
            : "startsWith" in t.validation
              ? (r = `Invalid input: must start with "${t.validation.startsWith}"`)
              : "endsWith" in t.validation
                ? (r = `Invalid input: must end with "${t.validation.endsWith}"`)
                : E.assertNever(t.validation)
          : t.validation !== "regex"
            ? (r = `Invalid ${t.validation}`)
            : (r = "Invalid");
        break;
      case d.too_small:
        t.type === "array"
          ? (r = `Array must contain ${t.exact ? "exactly" : t.inclusive ? "at least" : "more than"} ${t.minimum} element(s)`)
          : t.type === "string"
            ? (r = `String must contain ${t.exact ? "exactly" : t.inclusive ? "at least" : "over"} ${t.minimum} character(s)`)
            : t.type === "number"
              ? (r = `Number must be ${t.exact ? "exactly equal to " : t.inclusive ? "greater than or equal to " : "greater than "}${t.minimum}`)
              : t.type === "date"
                ? (r = `Date must be ${t.exact ? "exactly equal to " : t.inclusive ? "greater than or equal to " : "greater than "}${new Date(Number(t.minimum))}`)
                : (r = "Invalid input");
        break;
      case d.too_big:
        t.type === "array"
          ? (r = `Array must contain ${t.exact ? "exactly" : t.inclusive ? "at most" : "less than"} ${t.maximum} element(s)`)
          : t.type === "string"
            ? (r = `String must contain ${t.exact ? "exactly" : t.inclusive ? "at most" : "under"} ${t.maximum} character(s)`)
            : t.type === "number"
              ? (r = `Number must be ${t.exact ? "exactly" : t.inclusive ? "less than or equal to" : "less than"} ${t.maximum}`)
              : t.type === "bigint"
                ? (r = `BigInt must be ${t.exact ? "exactly" : t.inclusive ? "less than or equal to" : "less than"} ${t.maximum}`)
                : t.type === "date"
                  ? (r = `Date must be ${t.exact ? "exactly" : t.inclusive ? "smaller than or equal to" : "smaller than"} ${new Date(Number(t.maximum))}`)
                  : (r = "Invalid input");
        break;
      case d.custom:
        r = "Invalid input";
        break;
      case d.invalid_intersection_types:
        r = "Intersection results could not be merged";
        break;
      case d.not_multiple_of:
        r = `Number must be a multiple of ${t.multipleOf}`;
        break;
      case d.not_finite:
        r = "Number must be finite";
        break;
      default:
        (r = e.defaultError), E.assertNever(t);
    }
    return { message: r };
  };
  let wr = Me;
  function zn(t) {
    wr = t;
  }
  function pt() {
    return wr;
  }
  const mt = (t) => {
      const { data: e, path: r, errorMaps: n, issueData: i } = t,
        s = [...r, ...(i.path || [])],
        a = { ...i, path: s };
      if (i.message !== void 0) return { ...i, path: s, message: i.message };
      let o = "";
      const l = n
        .filter((u) => !!u)
        .slice()
        .reverse();
      for (const u of l) o = u(a, { data: e, defaultError: o }).message;
      return { ...i, path: s, message: o };
    },
    Yn = [];
  function p(t, e) {
    const r = pt(),
      n = mt({
        issueData: e,
        data: t.data,
        path: t.path,
        errorMaps: [
          t.common.contextualErrorMap,
          t.schemaErrorMap,
          r,
          r === Me ? void 0 : Me,
        ].filter((i) => !!i),
      });
    t.common.issues.push(n);
  }
  class Z {
    constructor() {
      this.value = "valid";
    }
    dirty() {
      this.value === "valid" && (this.value = "dirty");
    }
    abort() {
      this.value !== "aborted" && (this.value = "aborted");
    }
    static mergeArray(e, r) {
      const n = [];
      for (const i of r) {
        if (i.status === "aborted") return _;
        i.status === "dirty" && e.dirty(), n.push(i.value);
      }
      return { status: e.value, value: n };
    }
    static async mergeObjectAsync(e, r) {
      const n = [];
      for (const i of r) {
        const s = await i.key,
          a = await i.value;
        n.push({ key: s, value: a });
      }
      return Z.mergeObjectSync(e, n);
    }
    static mergeObjectSync(e, r) {
      const n = {};
      for (const i of r) {
        const { key: s, value: a } = i;
        if (s.status === "aborted" || a.status === "aborted") return _;
        s.status === "dirty" && e.dirty(),
          a.status === "dirty" && e.dirty(),
          s.value !== "__proto__" &&
            (typeof a.value < "u" || i.alwaysSet) &&
            (n[s.value] = a.value);
      }
      return { status: e.value, value: n };
    }
  }
  const _ = Object.freeze({ status: "aborted" }),
    je = (t) => ({ status: "dirty", value: t }),
    P = (t) => ({ status: "valid", value: t }),
    Ut = (t) => t.status === "aborted",
    Bt = (t) => t.status === "dirty",
    Ee = (t) => t.status === "valid",
    ze = (t) => typeof Promise < "u" && t instanceof Promise;
  var g;
  (function (t) {
    (t.errToObj = (e) => (typeof e == "string" ? { message: e } : e || {})),
      (t.toString = (e) =>
        typeof e == "string" ? e : e == null ? void 0 : e.message);
  })(g || (g = {}));
  class te {
    constructor(e, r, n, i) {
      (this._cachedPath = []),
        (this.parent = e),
        (this.data = r),
        (this._path = n),
        (this._key = i);
    }
    get path() {
      return (
        this._cachedPath.length ||
          (Array.isArray(this._key)
            ? this._cachedPath.push(...this._path, ...this._key)
            : this._cachedPath.push(...this._path, this._key)),
        this._cachedPath
      );
    }
  }
  const br = (t, e) => {
    if (Ee(e)) return { success: !0, data: e.value };
    if (!t.common.issues.length)
      throw new Error("Validation failed but no issues detected.");
    return {
      success: !1,
      get error() {
        if (this._error) return this._error;
        const r = new Y(t.common.issues);
        return (this._error = r), this._error;
      },
    };
  };
  function w(t) {
    if (!t) return {};
    const {
      errorMap: e,
      invalid_type_error: r,
      required_error: n,
      description: i,
    } = t;
    if (e && (r || n))
      throw new Error(
        `Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`,
      );
    return e
      ? { errorMap: e, description: i }
      : {
          errorMap: (a, o) => {
            const { message: l } = t;
            return a.code === "invalid_enum_value"
              ? { message: l ?? o.defaultError }
              : typeof o.data > "u"
                ? { message: l ?? n ?? o.defaultError }
                : a.code !== "invalid_type"
                  ? { message: o.defaultError }
                  : { message: l ?? r ?? o.defaultError };
          },
          description: i,
        };
  }
  class x {
    get description() {
      return this._def.description;
    }
    _getType(e) {
      return ae(e.data);
    }
    _getOrReturnCtx(e, r) {
      return (
        r || {
          common: e.parent.common,
          data: e.data,
          parsedType: ae(e.data),
          schemaErrorMap: this._def.errorMap,
          path: e.path,
          parent: e.parent,
        }
      );
    }
    _processInputParams(e) {
      return {
        status: new Z(),
        ctx: {
          common: e.parent.common,
          data: e.data,
          parsedType: ae(e.data),
          schemaErrorMap: this._def.errorMap,
          path: e.path,
          parent: e.parent,
        },
      };
    }
    _parseSync(e) {
      const r = this._parse(e);
      if (ze(r)) throw new Error("Synchronous parse encountered promise.");
      return r;
    }
    _parseAsync(e) {
      const r = this._parse(e);
      return Promise.resolve(r);
    }
    parse(e, r) {
      const n = this.safeParse(e, r);
      if (n.success) return n.data;
      throw n.error;
    }
    safeParse(e, r) {
      const n = {
          common: {
            issues: [],
            async: (r == null ? void 0 : r.async) ?? !1,
            contextualErrorMap: r == null ? void 0 : r.errorMap,
          },
          path: (r == null ? void 0 : r.path) || [],
          schemaErrorMap: this._def.errorMap,
          parent: null,
          data: e,
          parsedType: ae(e),
        },
        i = this._parseSync({ data: e, path: n.path, parent: n });
      return br(n, i);
    }
    "~validate"(e) {
      var n, i;
      const r = {
        common: { issues: [], async: !!this["~standard"].async },
        path: [],
        schemaErrorMap: this._def.errorMap,
        parent: null,
        data: e,
        parsedType: ae(e),
      };
      if (!this["~standard"].async)
        try {
          const s = this._parseSync({ data: e, path: [], parent: r });
          return Ee(s) ? { value: s.value } : { issues: r.common.issues };
        } catch (s) {
          (i =
            (n = s == null ? void 0 : s.message) == null
              ? void 0
              : n.toLowerCase()) != null &&
            i.includes("encountered") &&
            (this["~standard"].async = !0),
            (r.common = { issues: [], async: !0 });
        }
      return this._parseAsync({ data: e, path: [], parent: r }).then((s) =>
        Ee(s) ? { value: s.value } : { issues: r.common.issues },
      );
    }
    async parseAsync(e, r) {
      const n = await this.safeParseAsync(e, r);
      if (n.success) return n.data;
      throw n.error;
    }
    async safeParseAsync(e, r) {
      const n = {
          common: {
            issues: [],
            contextualErrorMap: r == null ? void 0 : r.errorMap,
            async: !0,
          },
          path: (r == null ? void 0 : r.path) || [],
          schemaErrorMap: this._def.errorMap,
          parent: null,
          data: e,
          parsedType: ae(e),
        },
        i = this._parse({ data: e, path: n.path, parent: n }),
        s = await (ze(i) ? i : Promise.resolve(i));
      return br(n, s);
    }
    refine(e, r) {
      const n = (i) =>
        typeof r == "string" || typeof r > "u"
          ? { message: r }
          : typeof r == "function"
            ? r(i)
            : r;
      return this._refinement((i, s) => {
        const a = e(i),
          o = () => s.addIssue({ code: d.custom, ...n(i) });
        return typeof Promise < "u" && a instanceof Promise
          ? a.then((l) => (l ? !0 : (o(), !1)))
          : a
            ? !0
            : (o(), !1);
      });
    }
    refinement(e, r) {
      return this._refinement((n, i) =>
        e(n) ? !0 : (i.addIssue(typeof r == "function" ? r(n, i) : r), !1),
      );
    }
    _refinement(e) {
      return new X({
        schema: this,
        typeName: y.ZodEffects,
        effect: { type: "refinement", refinement: e },
      });
    }
    superRefine(e) {
      return this._refinement(e);
    }
    constructor(e) {
      (this.spa = this.safeParseAsync),
        (this._def = e),
        (this.parse = this.parse.bind(this)),
        (this.safeParse = this.safeParse.bind(this)),
        (this.parseAsync = this.parseAsync.bind(this)),
        (this.safeParseAsync = this.safeParseAsync.bind(this)),
        (this.spa = this.spa.bind(this)),
        (this.refine = this.refine.bind(this)),
        (this.refinement = this.refinement.bind(this)),
        (this.superRefine = this.superRefine.bind(this)),
        (this.optional = this.optional.bind(this)),
        (this.nullable = this.nullable.bind(this)),
        (this.nullish = this.nullish.bind(this)),
        (this.array = this.array.bind(this)),
        (this.promise = this.promise.bind(this)),
        (this.or = this.or.bind(this)),
        (this.and = this.and.bind(this)),
        (this.transform = this.transform.bind(this)),
        (this.brand = this.brand.bind(this)),
        (this.default = this.default.bind(this)),
        (this.catch = this.catch.bind(this)),
        (this.describe = this.describe.bind(this)),
        (this.pipe = this.pipe.bind(this)),
        (this.readonly = this.readonly.bind(this)),
        (this.isNullable = this.isNullable.bind(this)),
        (this.isOptional = this.isOptional.bind(this)),
        (this["~standard"] = {
          version: 1,
          vendor: "zod",
          validate: (r) => this["~validate"](r),
        });
    }
    optional() {
      return ne.create(this, this._def);
    }
    nullable() {
      return ge.create(this, this._def);
    }
    nullish() {
      return this.nullable().optional();
    }
    array() {
      return Q.create(this);
    }
    promise() {
      return Be.create(this, this._def);
    }
    or(e) {
      return qe.create([this, e], this._def);
    }
    and(e) {
      return Ge.create(this, e, this._def);
    }
    transform(e) {
      return new X({
        ...w(this._def),
        schema: this,
        typeName: y.ZodEffects,
        effect: { type: "transform", transform: e },
      });
    }
    default(e) {
      const r = typeof e == "function" ? e : () => e;
      return new et({
        ...w(this._def),
        innerType: this,
        defaultValue: r,
        typeName: y.ZodDefault,
      });
    }
    brand() {
      return new Wt({ typeName: y.ZodBranded, type: this, ...w(this._def) });
    }
    catch(e) {
      const r = typeof e == "function" ? e : () => e;
      return new tt({
        ...w(this._def),
        innerType: this,
        catchValue: r,
        typeName: y.ZodCatch,
      });
    }
    describe(e) {
      const r = this.constructor;
      return new r({ ...this._def, description: e });
    }
    pipe(e) {
      return rt.create(this, e);
    }
    readonly() {
      return nt.create(this);
    }
    isOptional() {
      return this.safeParse(void 0).success;
    }
    isNullable() {
      return this.safeParse(null).success;
    }
  }
  const Fn = /^c[^\s-]{8,}$/i,
    Jn = /^[0-9a-z]+$/,
    qn = /^[0-9A-HJKMNP-TV-Z]{26}$/i,
    Gn =
      /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i,
    Hn = /^[a-z0-9_-]{21}$/i,
    Qn = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/,
    Xn =
      /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/,
    Kn =
      /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i,
    ei = "^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$";
  let Pt;
  const ti =
      /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/,
    ri =
      /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/,
    ni =
      /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/,
    ii =
      /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,
    si = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/,
    ai =
      /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/,
    xr =
      "((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))",
    oi = new RegExp(`^${xr}$`);
  function Sr(t) {
    let e = "[0-5]\\d";
    t.precision
      ? (e = `${e}\\.\\d{${t.precision}}`)
      : t.precision == null && (e = `${e}(\\.\\d+)?`);
    const r = t.precision ? "+" : "?";
    return `([01]\\d|2[0-3]):[0-5]\\d(:${e})${r}`;
  }
  function li(t) {
    return new RegExp(`^${Sr(t)}$`);
  }
  function Er(t) {
    let e = `${xr}T${Sr(t)}`;
    const r = [];
    return (
      r.push(t.local ? "Z?" : "Z"),
      t.offset && r.push("([+-]\\d{2}:?\\d{2})"),
      (e = `${e}(${r.join("|")})`),
      new RegExp(`^${e}$`)
    );
  }
  function ui(t, e) {
    return !!(
      ((e === "v4" || !e) && ti.test(t)) ||
      ((e === "v6" || !e) && ni.test(t))
    );
  }
  function ci(t, e) {
    if (!Qn.test(t)) return !1;
    try {
      const [r] = t.split("."),
        n = r
          .replace(/-/g, "+")
          .replace(/_/g, "/")
          .padEnd(r.length + ((4 - (r.length % 4)) % 4), "="),
        i = JSON.parse(atob(n));
      return !(
        typeof i != "object" ||
        i === null ||
        ("typ" in i && (i == null ? void 0 : i.typ) !== "JWT") ||
        !i.alg ||
        (e && i.alg !== e)
      );
    } catch {
      return !1;
    }
  }
  function fi(t, e) {
    return !!(
      ((e === "v4" || !e) && ri.test(t)) ||
      ((e === "v6" || !e) && ii.test(t))
    );
  }
  class H extends x {
    _parse(e) {
      if (
        (this._def.coerce && (e.data = String(e.data)),
        this._getType(e) !== m.string)
      ) {
        const s = this._getOrReturnCtx(e);
        return (
          p(s, {
            code: d.invalid_type,
            expected: m.string,
            received: s.parsedType,
          }),
          _
        );
      }
      const n = new Z();
      let i;
      for (const s of this._def.checks)
        if (s.kind === "min")
          e.data.length < s.value &&
            ((i = this._getOrReturnCtx(e, i)),
            p(i, {
              code: d.too_small,
              minimum: s.value,
              type: "string",
              inclusive: !0,
              exact: !1,
              message: s.message,
            }),
            n.dirty());
        else if (s.kind === "max")
          e.data.length > s.value &&
            ((i = this._getOrReturnCtx(e, i)),
            p(i, {
              code: d.too_big,
              maximum: s.value,
              type: "string",
              inclusive: !0,
              exact: !1,
              message: s.message,
            }),
            n.dirty());
        else if (s.kind === "length") {
          const a = e.data.length > s.value,
            o = e.data.length < s.value;
          (a || o) &&
            ((i = this._getOrReturnCtx(e, i)),
            a
              ? p(i, {
                  code: d.too_big,
                  maximum: s.value,
                  type: "string",
                  inclusive: !0,
                  exact: !0,
                  message: s.message,
                })
              : o &&
                p(i, {
                  code: d.too_small,
                  minimum: s.value,
                  type: "string",
                  inclusive: !0,
                  exact: !0,
                  message: s.message,
                }),
            n.dirty());
        } else if (s.kind === "email")
          Kn.test(e.data) ||
            ((i = this._getOrReturnCtx(e, i)),
            p(i, {
              validation: "email",
              code: d.invalid_string,
              message: s.message,
            }),
            n.dirty());
        else if (s.kind === "emoji")
          Pt || (Pt = new RegExp(ei, "u")),
            Pt.test(e.data) ||
              ((i = this._getOrReturnCtx(e, i)),
              p(i, {
                validation: "emoji",
                code: d.invalid_string,
                message: s.message,
              }),
              n.dirty());
        else if (s.kind === "uuid")
          Gn.test(e.data) ||
            ((i = this._getOrReturnCtx(e, i)),
            p(i, {
              validation: "uuid",
              code: d.invalid_string,
              message: s.message,
            }),
            n.dirty());
        else if (s.kind === "nanoid")
          Hn.test(e.data) ||
            ((i = this._getOrReturnCtx(e, i)),
            p(i, {
              validation: "nanoid",
              code: d.invalid_string,
              message: s.message,
            }),
            n.dirty());
        else if (s.kind === "cuid")
          Fn.test(e.data) ||
            ((i = this._getOrReturnCtx(e, i)),
            p(i, {
              validation: "cuid",
              code: d.invalid_string,
              message: s.message,
            }),
            n.dirty());
        else if (s.kind === "cuid2")
          Jn.test(e.data) ||
            ((i = this._getOrReturnCtx(e, i)),
            p(i, {
              validation: "cuid2",
              code: d.invalid_string,
              message: s.message,
            }),
            n.dirty());
        else if (s.kind === "ulid")
          qn.test(e.data) ||
            ((i = this._getOrReturnCtx(e, i)),
            p(i, {
              validation: "ulid",
              code: d.invalid_string,
              message: s.message,
            }),
            n.dirty());
        else if (s.kind === "url")
          try {
            new URL(e.data);
          } catch {
            (i = this._getOrReturnCtx(e, i)),
              p(i, {
                validation: "url",
                code: d.invalid_string,
                message: s.message,
              }),
              n.dirty();
          }
        else
          s.kind === "regex"
            ? ((s.regex.lastIndex = 0),
              s.regex.test(e.data) ||
                ((i = this._getOrReturnCtx(e, i)),
                p(i, {
                  validation: "regex",
                  code: d.invalid_string,
                  message: s.message,
                }),
                n.dirty()))
            : s.kind === "trim"
              ? (e.data = e.data.trim())
              : s.kind === "includes"
                ? e.data.includes(s.value, s.position) ||
                  ((i = this._getOrReturnCtx(e, i)),
                  p(i, {
                    code: d.invalid_string,
                    validation: { includes: s.value, position: s.position },
                    message: s.message,
                  }),
                  n.dirty())
                : s.kind === "toLowerCase"
                  ? (e.data = e.data.toLowerCase())
                  : s.kind === "toUpperCase"
                    ? (e.data = e.data.toUpperCase())
                    : s.kind === "startsWith"
                      ? e.data.startsWith(s.value) ||
                        ((i = this._getOrReturnCtx(e, i)),
                        p(i, {
                          code: d.invalid_string,
                          validation: { startsWith: s.value },
                          message: s.message,
                        }),
                        n.dirty())
                      : s.kind === "endsWith"
                        ? e.data.endsWith(s.value) ||
                          ((i = this._getOrReturnCtx(e, i)),
                          p(i, {
                            code: d.invalid_string,
                            validation: { endsWith: s.value },
                            message: s.message,
                          }),
                          n.dirty())
                        : s.kind === "datetime"
                          ? Er(s).test(e.data) ||
                            ((i = this._getOrReturnCtx(e, i)),
                            p(i, {
                              code: d.invalid_string,
                              validation: "datetime",
                              message: s.message,
                            }),
                            n.dirty())
                          : s.kind === "date"
                            ? oi.test(e.data) ||
                              ((i = this._getOrReturnCtx(e, i)),
                              p(i, {
                                code: d.invalid_string,
                                validation: "date",
                                message: s.message,
                              }),
                              n.dirty())
                            : s.kind === "time"
                              ? li(s).test(e.data) ||
                                ((i = this._getOrReturnCtx(e, i)),
                                p(i, {
                                  code: d.invalid_string,
                                  validation: "time",
                                  message: s.message,
                                }),
                                n.dirty())
                              : s.kind === "duration"
                                ? Xn.test(e.data) ||
                                  ((i = this._getOrReturnCtx(e, i)),
                                  p(i, {
                                    validation: "duration",
                                    code: d.invalid_string,
                                    message: s.message,
                                  }),
                                  n.dirty())
                                : s.kind === "ip"
                                  ? ui(e.data, s.version) ||
                                    ((i = this._getOrReturnCtx(e, i)),
                                    p(i, {
                                      validation: "ip",
                                      code: d.invalid_string,
                                      message: s.message,
                                    }),
                                    n.dirty())
                                  : s.kind === "jwt"
                                    ? ci(e.data, s.alg) ||
                                      ((i = this._getOrReturnCtx(e, i)),
                                      p(i, {
                                        validation: "jwt",
                                        code: d.invalid_string,
                                        message: s.message,
                                      }),
                                      n.dirty())
                                    : s.kind === "cidr"
                                      ? fi(e.data, s.version) ||
                                        ((i = this._getOrReturnCtx(e, i)),
                                        p(i, {
                                          validation: "cidr",
                                          code: d.invalid_string,
                                          message: s.message,
                                        }),
                                        n.dirty())
                                      : s.kind === "base64"
                                        ? si.test(e.data) ||
                                          ((i = this._getOrReturnCtx(e, i)),
                                          p(i, {
                                            validation: "base64",
                                            code: d.invalid_string,
                                            message: s.message,
                                          }),
                                          n.dirty())
                                        : s.kind === "base64url"
                                          ? ai.test(e.data) ||
                                            ((i = this._getOrReturnCtx(e, i)),
                                            p(i, {
                                              validation: "base64url",
                                              code: d.invalid_string,
                                              message: s.message,
                                            }),
                                            n.dirty())
                                          : E.assertNever(s);
      return { status: n.value, value: e.data };
    }
    _regex(e, r, n) {
      return this.refinement((i) => e.test(i), {
        validation: r,
        code: d.invalid_string,
        ...g.errToObj(n),
      });
    }
    _addCheck(e) {
      return new H({ ...this._def, checks: [...this._def.checks, e] });
    }
    email(e) {
      return this._addCheck({ kind: "email", ...g.errToObj(e) });
    }
    url(e) {
      return this._addCheck({ kind: "url", ...g.errToObj(e) });
    }
    emoji(e) {
      return this._addCheck({ kind: "emoji", ...g.errToObj(e) });
    }
    uuid(e) {
      return this._addCheck({ kind: "uuid", ...g.errToObj(e) });
    }
    nanoid(e) {
      return this._addCheck({ kind: "nanoid", ...g.errToObj(e) });
    }
    cuid(e) {
      return this._addCheck({ kind: "cuid", ...g.errToObj(e) });
    }
    cuid2(e) {
      return this._addCheck({ kind: "cuid2", ...g.errToObj(e) });
    }
    ulid(e) {
      return this._addCheck({ kind: "ulid", ...g.errToObj(e) });
    }
    base64(e) {
      return this._addCheck({ kind: "base64", ...g.errToObj(e) });
    }
    base64url(e) {
      return this._addCheck({ kind: "base64url", ...g.errToObj(e) });
    }
    jwt(e) {
      return this._addCheck({ kind: "jwt", ...g.errToObj(e) });
    }
    ip(e) {
      return this._addCheck({ kind: "ip", ...g.errToObj(e) });
    }
    cidr(e) {
      return this._addCheck({ kind: "cidr", ...g.errToObj(e) });
    }
    datetime(e) {
      return typeof e == "string"
        ? this._addCheck({
            kind: "datetime",
            precision: null,
            offset: !1,
            local: !1,
            message: e,
          })
        : this._addCheck({
            kind: "datetime",
            precision:
              typeof (e == null ? void 0 : e.precision) > "u"
                ? null
                : e == null
                  ? void 0
                  : e.precision,
            offset: (e == null ? void 0 : e.offset) ?? !1,
            local: (e == null ? void 0 : e.local) ?? !1,
            ...g.errToObj(e == null ? void 0 : e.message),
          });
    }
    date(e) {
      return this._addCheck({ kind: "date", message: e });
    }
    time(e) {
      return typeof e == "string"
        ? this._addCheck({ kind: "time", precision: null, message: e })
        : this._addCheck({
            kind: "time",
            precision:
              typeof (e == null ? void 0 : e.precision) > "u"
                ? null
                : e == null
                  ? void 0
                  : e.precision,
            ...g.errToObj(e == null ? void 0 : e.message),
          });
    }
    duration(e) {
      return this._addCheck({ kind: "duration", ...g.errToObj(e) });
    }
    regex(e, r) {
      return this._addCheck({ kind: "regex", regex: e, ...g.errToObj(r) });
    }
    includes(e, r) {
      return this._addCheck({
        kind: "includes",
        value: e,
        position: r == null ? void 0 : r.position,
        ...g.errToObj(r == null ? void 0 : r.message),
      });
    }
    startsWith(e, r) {
      return this._addCheck({ kind: "startsWith", value: e, ...g.errToObj(r) });
    }
    endsWith(e, r) {
      return this._addCheck({ kind: "endsWith", value: e, ...g.errToObj(r) });
    }
    min(e, r) {
      return this._addCheck({ kind: "min", value: e, ...g.errToObj(r) });
    }
    max(e, r) {
      return this._addCheck({ kind: "max", value: e, ...g.errToObj(r) });
    }
    length(e, r) {
      return this._addCheck({ kind: "length", value: e, ...g.errToObj(r) });
    }
    nonempty(e) {
      return this.min(1, g.errToObj(e));
    }
    trim() {
      return new H({
        ...this._def,
        checks: [...this._def.checks, { kind: "trim" }],
      });
    }
    toLowerCase() {
      return new H({
        ...this._def,
        checks: [...this._def.checks, { kind: "toLowerCase" }],
      });
    }
    toUpperCase() {
      return new H({
        ...this._def,
        checks: [...this._def.checks, { kind: "toUpperCase" }],
      });
    }
    get isDatetime() {
      return !!this._def.checks.find((e) => e.kind === "datetime");
    }
    get isDate() {
      return !!this._def.checks.find((e) => e.kind === "date");
    }
    get isTime() {
      return !!this._def.checks.find((e) => e.kind === "time");
    }
    get isDuration() {
      return !!this._def.checks.find((e) => e.kind === "duration");
    }
    get isEmail() {
      return !!this._def.checks.find((e) => e.kind === "email");
    }
    get isURL() {
      return !!this._def.checks.find((e) => e.kind === "url");
    }
    get isEmoji() {
      return !!this._def.checks.find((e) => e.kind === "emoji");
    }
    get isUUID() {
      return !!this._def.checks.find((e) => e.kind === "uuid");
    }
    get isNANOID() {
      return !!this._def.checks.find((e) => e.kind === "nanoid");
    }
    get isCUID() {
      return !!this._def.checks.find((e) => e.kind === "cuid");
    }
    get isCUID2() {
      return !!this._def.checks.find((e) => e.kind === "cuid2");
    }
    get isULID() {
      return !!this._def.checks.find((e) => e.kind === "ulid");
    }
    get isIP() {
      return !!this._def.checks.find((e) => e.kind === "ip");
    }
    get isCIDR() {
      return !!this._def.checks.find((e) => e.kind === "cidr");
    }
    get isBase64() {
      return !!this._def.checks.find((e) => e.kind === "base64");
    }
    get isBase64url() {
      return !!this._def.checks.find((e) => e.kind === "base64url");
    }
    get minLength() {
      let e = null;
      for (const r of this._def.checks)
        r.kind === "min" && (e === null || r.value > e) && (e = r.value);
      return e;
    }
    get maxLength() {
      let e = null;
      for (const r of this._def.checks)
        r.kind === "max" && (e === null || r.value < e) && (e = r.value);
      return e;
    }
  }
  H.create = (t) =>
    new H({
      checks: [],
      typeName: y.ZodString,
      coerce: (t == null ? void 0 : t.coerce) ?? !1,
      ...w(t),
    });
  function di(t, e) {
    const r = (t.toString().split(".")[1] || "").length,
      n = (e.toString().split(".")[1] || "").length,
      i = r > n ? r : n,
      s = Number.parseInt(t.toFixed(i).replace(".", "")),
      a = Number.parseInt(e.toFixed(i).replace(".", ""));
    return (s % a) / 10 ** i;
  }
  class he extends x {
    constructor() {
      super(...arguments),
        (this.min = this.gte),
        (this.max = this.lte),
        (this.step = this.multipleOf);
    }
    _parse(e) {
      if (
        (this._def.coerce && (e.data = Number(e.data)),
        this._getType(e) !== m.number)
      ) {
        const s = this._getOrReturnCtx(e);
        return (
          p(s, {
            code: d.invalid_type,
            expected: m.number,
            received: s.parsedType,
          }),
          _
        );
      }
      let n;
      const i = new Z();
      for (const s of this._def.checks)
        s.kind === "int"
          ? E.isInteger(e.data) ||
            ((n = this._getOrReturnCtx(e, n)),
            p(n, {
              code: d.invalid_type,
              expected: "integer",
              received: "float",
              message: s.message,
            }),
            i.dirty())
          : s.kind === "min"
            ? (s.inclusive ? e.data < s.value : e.data <= s.value) &&
              ((n = this._getOrReturnCtx(e, n)),
              p(n, {
                code: d.too_small,
                minimum: s.value,
                type: "number",
                inclusive: s.inclusive,
                exact: !1,
                message: s.message,
              }),
              i.dirty())
            : s.kind === "max"
              ? (s.inclusive ? e.data > s.value : e.data >= s.value) &&
                ((n = this._getOrReturnCtx(e, n)),
                p(n, {
                  code: d.too_big,
                  maximum: s.value,
                  type: "number",
                  inclusive: s.inclusive,
                  exact: !1,
                  message: s.message,
                }),
                i.dirty())
              : s.kind === "multipleOf"
                ? di(e.data, s.value) !== 0 &&
                  ((n = this._getOrReturnCtx(e, n)),
                  p(n, {
                    code: d.not_multiple_of,
                    multipleOf: s.value,
                    message: s.message,
                  }),
                  i.dirty())
                : s.kind === "finite"
                  ? Number.isFinite(e.data) ||
                    ((n = this._getOrReturnCtx(e, n)),
                    p(n, { code: d.not_finite, message: s.message }),
                    i.dirty())
                  : E.assertNever(s);
      return { status: i.value, value: e.data };
    }
    gte(e, r) {
      return this.setLimit("min", e, !0, g.toString(r));
    }
    gt(e, r) {
      return this.setLimit("min", e, !1, g.toString(r));
    }
    lte(e, r) {
      return this.setLimit("max", e, !0, g.toString(r));
    }
    lt(e, r) {
      return this.setLimit("max", e, !1, g.toString(r));
    }
    setLimit(e, r, n, i) {
      return new he({
        ...this._def,
        checks: [
          ...this._def.checks,
          { kind: e, value: r, inclusive: n, message: g.toString(i) },
        ],
      });
    }
    _addCheck(e) {
      return new he({ ...this._def, checks: [...this._def.checks, e] });
    }
    int(e) {
      return this._addCheck({ kind: "int", message: g.toString(e) });
    }
    positive(e) {
      return this._addCheck({
        kind: "min",
        value: 0,
        inclusive: !1,
        message: g.toString(e),
      });
    }
    negative(e) {
      return this._addCheck({
        kind: "max",
        value: 0,
        inclusive: !1,
        message: g.toString(e),
      });
    }
    nonpositive(e) {
      return this._addCheck({
        kind: "max",
        value: 0,
        inclusive: !0,
        message: g.toString(e),
      });
    }
    nonnegative(e) {
      return this._addCheck({
        kind: "min",
        value: 0,
        inclusive: !0,
        message: g.toString(e),
      });
    }
    multipleOf(e, r) {
      return this._addCheck({
        kind: "multipleOf",
        value: e,
        message: g.toString(r),
      });
    }
    finite(e) {
      return this._addCheck({ kind: "finite", message: g.toString(e) });
    }
    safe(e) {
      return this._addCheck({
        kind: "min",
        inclusive: !0,
        value: Number.MIN_SAFE_INTEGER,
        message: g.toString(e),
      })._addCheck({
        kind: "max",
        inclusive: !0,
        value: Number.MAX_SAFE_INTEGER,
        message: g.toString(e),
      });
    }
    get minValue() {
      let e = null;
      for (const r of this._def.checks)
        r.kind === "min" && (e === null || r.value > e) && (e = r.value);
      return e;
    }
    get maxValue() {
      let e = null;
      for (const r of this._def.checks)
        r.kind === "max" && (e === null || r.value < e) && (e = r.value);
      return e;
    }
    get isInt() {
      return !!this._def.checks.find(
        (e) =>
          e.kind === "int" || (e.kind === "multipleOf" && E.isInteger(e.value)),
      );
    }
    get isFinite() {
      let e = null,
        r = null;
      for (const n of this._def.checks) {
        if (n.kind === "finite" || n.kind === "int" || n.kind === "multipleOf")
          return !0;
        n.kind === "min"
          ? (r === null || n.value > r) && (r = n.value)
          : n.kind === "max" && (e === null || n.value < e) && (e = n.value);
      }
      return Number.isFinite(r) && Number.isFinite(e);
    }
  }
  he.create = (t) =>
    new he({
      checks: [],
      typeName: y.ZodNumber,
      coerce: (t == null ? void 0 : t.coerce) || !1,
      ...w(t),
    });
  class pe extends x {
    constructor() {
      super(...arguments), (this.min = this.gte), (this.max = this.lte);
    }
    _parse(e) {
      if (this._def.coerce)
        try {
          e.data = BigInt(e.data);
        } catch {
          return this._getInvalidInput(e);
        }
      if (this._getType(e) !== m.bigint) return this._getInvalidInput(e);
      let n;
      const i = new Z();
      for (const s of this._def.checks)
        s.kind === "min"
          ? (s.inclusive ? e.data < s.value : e.data <= s.value) &&
            ((n = this._getOrReturnCtx(e, n)),
            p(n, {
              code: d.too_small,
              type: "bigint",
              minimum: s.value,
              inclusive: s.inclusive,
              message: s.message,
            }),
            i.dirty())
          : s.kind === "max"
            ? (s.inclusive ? e.data > s.value : e.data >= s.value) &&
              ((n = this._getOrReturnCtx(e, n)),
              p(n, {
                code: d.too_big,
                type: "bigint",
                maximum: s.value,
                inclusive: s.inclusive,
                message: s.message,
              }),
              i.dirty())
            : s.kind === "multipleOf"
              ? e.data % s.value !== BigInt(0) &&
                ((n = this._getOrReturnCtx(e, n)),
                p(n, {
                  code: d.not_multiple_of,
                  multipleOf: s.value,
                  message: s.message,
                }),
                i.dirty())
              : E.assertNever(s);
      return { status: i.value, value: e.data };
    }
    _getInvalidInput(e) {
      const r = this._getOrReturnCtx(e);
      return (
        p(r, {
          code: d.invalid_type,
          expected: m.bigint,
          received: r.parsedType,
        }),
        _
      );
    }
    gte(e, r) {
      return this.setLimit("min", e, !0, g.toString(r));
    }
    gt(e, r) {
      return this.setLimit("min", e, !1, g.toString(r));
    }
    lte(e, r) {
      return this.setLimit("max", e, !0, g.toString(r));
    }
    lt(e, r) {
      return this.setLimit("max", e, !1, g.toString(r));
    }
    setLimit(e, r, n, i) {
      return new pe({
        ...this._def,
        checks: [
          ...this._def.checks,
          { kind: e, value: r, inclusive: n, message: g.toString(i) },
        ],
      });
    }
    _addCheck(e) {
      return new pe({ ...this._def, checks: [...this._def.checks, e] });
    }
    positive(e) {
      return this._addCheck({
        kind: "min",
        value: BigInt(0),
        inclusive: !1,
        message: g.toString(e),
      });
    }
    negative(e) {
      return this._addCheck({
        kind: "max",
        value: BigInt(0),
        inclusive: !1,
        message: g.toString(e),
      });
    }
    nonpositive(e) {
      return this._addCheck({
        kind: "max",
        value: BigInt(0),
        inclusive: !0,
        message: g.toString(e),
      });
    }
    nonnegative(e) {
      return this._addCheck({
        kind: "min",
        value: BigInt(0),
        inclusive: !0,
        message: g.toString(e),
      });
    }
    multipleOf(e, r) {
      return this._addCheck({
        kind: "multipleOf",
        value: e,
        message: g.toString(r),
      });
    }
    get minValue() {
      let e = null;
      for (const r of this._def.checks)
        r.kind === "min" && (e === null || r.value > e) && (e = r.value);
      return e;
    }
    get maxValue() {
      let e = null;
      for (const r of this._def.checks)
        r.kind === "max" && (e === null || r.value < e) && (e = r.value);
      return e;
    }
  }
  pe.create = (t) =>
    new pe({
      checks: [],
      typeName: y.ZodBigInt,
      coerce: (t == null ? void 0 : t.coerce) ?? !1,
      ...w(t),
    });
  class Ye extends x {
    _parse(e) {
      if (
        (this._def.coerce && (e.data = !!e.data),
        this._getType(e) !== m.boolean)
      ) {
        const n = this._getOrReturnCtx(e);
        return (
          p(n, {
            code: d.invalid_type,
            expected: m.boolean,
            received: n.parsedType,
          }),
          _
        );
      }
      return P(e.data);
    }
  }
  Ye.create = (t) =>
    new Ye({
      typeName: y.ZodBoolean,
      coerce: (t == null ? void 0 : t.coerce) || !1,
      ...w(t),
    });
  class ke extends x {
    _parse(e) {
      if (
        (this._def.coerce && (e.data = new Date(e.data)),
        this._getType(e) !== m.date)
      ) {
        const s = this._getOrReturnCtx(e);
        return (
          p(s, {
            code: d.invalid_type,
            expected: m.date,
            received: s.parsedType,
          }),
          _
        );
      }
      if (Number.isNaN(e.data.getTime())) {
        const s = this._getOrReturnCtx(e);
        return p(s, { code: d.invalid_date }), _;
      }
      const n = new Z();
      let i;
      for (const s of this._def.checks)
        s.kind === "min"
          ? e.data.getTime() < s.value &&
            ((i = this._getOrReturnCtx(e, i)),
            p(i, {
              code: d.too_small,
              message: s.message,
              inclusive: !0,
              exact: !1,
              minimum: s.value,
              type: "date",
            }),
            n.dirty())
          : s.kind === "max"
            ? e.data.getTime() > s.value &&
              ((i = this._getOrReturnCtx(e, i)),
              p(i, {
                code: d.too_big,
                message: s.message,
                inclusive: !0,
                exact: !1,
                maximum: s.value,
                type: "date",
              }),
              n.dirty())
            : E.assertNever(s);
      return { status: n.value, value: new Date(e.data.getTime()) };
    }
    _addCheck(e) {
      return new ke({ ...this._def, checks: [...this._def.checks, e] });
    }
    min(e, r) {
      return this._addCheck({
        kind: "min",
        value: e.getTime(),
        message: g.toString(r),
      });
    }
    max(e, r) {
      return this._addCheck({
        kind: "max",
        value: e.getTime(),
        message: g.toString(r),
      });
    }
    get minDate() {
      let e = null;
      for (const r of this._def.checks)
        r.kind === "min" && (e === null || r.value > e) && (e = r.value);
      return e != null ? new Date(e) : null;
    }
    get maxDate() {
      let e = null;
      for (const r of this._def.checks)
        r.kind === "max" && (e === null || r.value < e) && (e = r.value);
      return e != null ? new Date(e) : null;
    }
  }
  ke.create = (t) =>
    new ke({
      checks: [],
      coerce: (t == null ? void 0 : t.coerce) || !1,
      typeName: y.ZodDate,
      ...w(t),
    });
  class gt extends x {
    _parse(e) {
      if (this._getType(e) !== m.symbol) {
        const n = this._getOrReturnCtx(e);
        return (
          p(n, {
            code: d.invalid_type,
            expected: m.symbol,
            received: n.parsedType,
          }),
          _
        );
      }
      return P(e.data);
    }
  }
  gt.create = (t) => new gt({ typeName: y.ZodSymbol, ...w(t) });
  class Fe extends x {
    _parse(e) {
      if (this._getType(e) !== m.undefined) {
        const n = this._getOrReturnCtx(e);
        return (
          p(n, {
            code: d.invalid_type,
            expected: m.undefined,
            received: n.parsedType,
          }),
          _
        );
      }
      return P(e.data);
    }
  }
  Fe.create = (t) => new Fe({ typeName: y.ZodUndefined, ...w(t) });
  class Je extends x {
    _parse(e) {
      if (this._getType(e) !== m.null) {
        const n = this._getOrReturnCtx(e);
        return (
          p(n, {
            code: d.invalid_type,
            expected: m.null,
            received: n.parsedType,
          }),
          _
        );
      }
      return P(e.data);
    }
  }
  Je.create = (t) => new Je({ typeName: y.ZodNull, ...w(t) });
  class De extends x {
    constructor() {
      super(...arguments), (this._any = !0);
    }
    _parse(e) {
      return P(e.data);
    }
  }
  De.create = (t) => new De({ typeName: y.ZodAny, ...w(t) });
  class Re extends x {
    constructor() {
      super(...arguments), (this._unknown = !0);
    }
    _parse(e) {
      return P(e.data);
    }
  }
  Re.create = (t) => new Re({ typeName: y.ZodUnknown, ...w(t) });
  class oe extends x {
    _parse(e) {
      const r = this._getOrReturnCtx(e);
      return (
        p(r, {
          code: d.invalid_type,
          expected: m.never,
          received: r.parsedType,
        }),
        _
      );
    }
  }
  oe.create = (t) => new oe({ typeName: y.ZodNever, ...w(t) });
  class _t extends x {
    _parse(e) {
      if (this._getType(e) !== m.undefined) {
        const n = this._getOrReturnCtx(e);
        return (
          p(n, {
            code: d.invalid_type,
            expected: m.void,
            received: n.parsedType,
          }),
          _
        );
      }
      return P(e.data);
    }
  }
  _t.create = (t) => new _t({ typeName: y.ZodVoid, ...w(t) });
  class Q extends x {
    _parse(e) {
      const { ctx: r, status: n } = this._processInputParams(e),
        i = this._def;
      if (r.parsedType !== m.array)
        return (
          p(r, {
            code: d.invalid_type,
            expected: m.array,
            received: r.parsedType,
          }),
          _
        );
      if (i.exactLength !== null) {
        const a = r.data.length > i.exactLength.value,
          o = r.data.length < i.exactLength.value;
        (a || o) &&
          (p(r, {
            code: a ? d.too_big : d.too_small,
            minimum: o ? i.exactLength.value : void 0,
            maximum: a ? i.exactLength.value : void 0,
            type: "array",
            inclusive: !0,
            exact: !0,
            message: i.exactLength.message,
          }),
          n.dirty());
      }
      if (
        (i.minLength !== null &&
          r.data.length < i.minLength.value &&
          (p(r, {
            code: d.too_small,
            minimum: i.minLength.value,
            type: "array",
            inclusive: !0,
            exact: !1,
            message: i.minLength.message,
          }),
          n.dirty()),
        i.maxLength !== null &&
          r.data.length > i.maxLength.value &&
          (p(r, {
            code: d.too_big,
            maximum: i.maxLength.value,
            type: "array",
            inclusive: !0,
            exact: !1,
            message: i.maxLength.message,
          }),
          n.dirty()),
        r.common.async)
      )
        return Promise.all(
          [...r.data].map((a, o) =>
            i.type._parseAsync(new te(r, a, r.path, o)),
          ),
        ).then((a) => Z.mergeArray(n, a));
      const s = [...r.data].map((a, o) =>
        i.type._parseSync(new te(r, a, r.path, o)),
      );
      return Z.mergeArray(n, s);
    }
    get element() {
      return this._def.type;
    }
    min(e, r) {
      return new Q({
        ...this._def,
        minLength: { value: e, message: g.toString(r) },
      });
    }
    max(e, r) {
      return new Q({
        ...this._def,
        maxLength: { value: e, message: g.toString(r) },
      });
    }
    length(e, r) {
      return new Q({
        ...this._def,
        exactLength: { value: e, message: g.toString(r) },
      });
    }
    nonempty(e) {
      return this.min(1, e);
    }
  }
  Q.create = (t, e) =>
    new Q({
      type: t,
      minLength: null,
      maxLength: null,
      exactLength: null,
      typeName: y.ZodArray,
      ...w(e),
    });
  function Ze(t) {
    if (t instanceof A) {
      const e = {};
      for (const r in t.shape) {
        const n = t.shape[r];
        e[r] = ne.create(Ze(n));
      }
      return new A({ ...t._def, shape: () => e });
    } else
      return t instanceof Q
        ? new Q({ ...t._def, type: Ze(t.element) })
        : t instanceof ne
          ? ne.create(Ze(t.unwrap()))
          : t instanceof ge
            ? ge.create(Ze(t.unwrap()))
            : t instanceof re
              ? re.create(t.items.map((e) => Ze(e)))
              : t;
  }
  class A extends x {
    constructor() {
      super(...arguments),
        (this._cached = null),
        (this.nonstrict = this.passthrough),
        (this.augment = this.extend);
    }
    _getCached() {
      if (this._cached !== null) return this._cached;
      const e = this._def.shape(),
        r = E.objectKeys(e);
      return (this._cached = { shape: e, keys: r }), this._cached;
    }
    _parse(e) {
      if (this._getType(e) !== m.object) {
        const u = this._getOrReturnCtx(e);
        return (
          p(u, {
            code: d.invalid_type,
            expected: m.object,
            received: u.parsedType,
          }),
          _
        );
      }
      const { status: n, ctx: i } = this._processInputParams(e),
        { shape: s, keys: a } = this._getCached(),
        o = [];
      if (
        !(this._def.catchall instanceof oe && this._def.unknownKeys === "strip")
      )
        for (const u in i.data) a.includes(u) || o.push(u);
      const l = [];
      for (const u of a) {
        const f = s[u],
          h = i.data[u];
        l.push({
          key: { status: "valid", value: u },
          value: f._parse(new te(i, h, i.path, u)),
          alwaysSet: u in i.data,
        });
      }
      if (this._def.catchall instanceof oe) {
        const u = this._def.unknownKeys;
        if (u === "passthrough")
          for (const f of o)
            l.push({
              key: { status: "valid", value: f },
              value: { status: "valid", value: i.data[f] },
            });
        else if (u === "strict")
          o.length > 0 &&
            (p(i, { code: d.unrecognized_keys, keys: o }), n.dirty());
        else if (u !== "strip")
          throw new Error(
            "Internal ZodObject error: invalid unknownKeys value.",
          );
      } else {
        const u = this._def.catchall;
        for (const f of o) {
          const h = i.data[f];
          l.push({
            key: { status: "valid", value: f },
            value: u._parse(new te(i, h, i.path, f)),
            alwaysSet: f in i.data,
          });
        }
      }
      return i.common.async
        ? Promise.resolve()
            .then(async () => {
              const u = [];
              for (const f of l) {
                const h = await f.key,
                  v = await f.value;
                u.push({ key: h, value: v, alwaysSet: f.alwaysSet });
              }
              return u;
            })
            .then((u) => Z.mergeObjectSync(n, u))
        : Z.mergeObjectSync(n, l);
    }
    get shape() {
      return this._def.shape();
    }
    strict(e) {
      return (
        g.errToObj,
        new A({
          ...this._def,
          unknownKeys: "strict",
          ...(e !== void 0
            ? {
                errorMap: (r, n) => {
                  var s, a;
                  const i =
                    ((a = (s = this._def).errorMap) == null
                      ? void 0
                      : a.call(s, r, n).message) ?? n.defaultError;
                  return r.code === "unrecognized_keys"
                    ? { message: g.errToObj(e).message ?? i }
                    : { message: i };
                },
              }
            : {}),
        })
      );
    }
    strip() {
      return new A({ ...this._def, unknownKeys: "strip" });
    }
    passthrough() {
      return new A({ ...this._def, unknownKeys: "passthrough" });
    }
    extend(e) {
      return new A({
        ...this._def,
        shape: () => ({ ...this._def.shape(), ...e }),
      });
    }
    merge(e) {
      return new A({
        unknownKeys: e._def.unknownKeys,
        catchall: e._def.catchall,
        shape: () => ({ ...this._def.shape(), ...e._def.shape() }),
        typeName: y.ZodObject,
      });
    }
    setKey(e, r) {
      return this.augment({ [e]: r });
    }
    catchall(e) {
      return new A({ ...this._def, catchall: e });
    }
    pick(e) {
      const r = {};
      for (const n of E.objectKeys(e))
        e[n] && this.shape[n] && (r[n] = this.shape[n]);
      return new A({ ...this._def, shape: () => r });
    }
    omit(e) {
      const r = {};
      for (const n of E.objectKeys(this.shape)) e[n] || (r[n] = this.shape[n]);
      return new A({ ...this._def, shape: () => r });
    }
    deepPartial() {
      return Ze(this);
    }
    partial(e) {
      const r = {};
      for (const n of E.objectKeys(this.shape)) {
        const i = this.shape[n];
        e && !e[n] ? (r[n] = i) : (r[n] = i.optional());
      }
      return new A({ ...this._def, shape: () => r });
    }
    required(e) {
      const r = {};
      for (const n of E.objectKeys(this.shape))
        if (e && !e[n]) r[n] = this.shape[n];
        else {
          let s = this.shape[n];
          for (; s instanceof ne; ) s = s._def.innerType;
          r[n] = s;
        }
      return new A({ ...this._def, shape: () => r });
    }
    keyof() {
      return kr(E.objectKeys(this.shape));
    }
  }
  (A.create = (t, e) =>
    new A({
      shape: () => t,
      unknownKeys: "strip",
      catchall: oe.create(),
      typeName: y.ZodObject,
      ...w(e),
    })),
    (A.strictCreate = (t, e) =>
      new A({
        shape: () => t,
        unknownKeys: "strict",
        catchall: oe.create(),
        typeName: y.ZodObject,
        ...w(e),
      })),
    (A.lazycreate = (t, e) =>
      new A({
        shape: t,
        unknownKeys: "strip",
        catchall: oe.create(),
        typeName: y.ZodObject,
        ...w(e),
      }));
  class qe extends x {
    _parse(e) {
      const { ctx: r } = this._processInputParams(e),
        n = this._def.options;
      function i(s) {
        for (const o of s) if (o.result.status === "valid") return o.result;
        for (const o of s)
          if (o.result.status === "dirty")
            return r.common.issues.push(...o.ctx.common.issues), o.result;
        const a = s.map((o) => new Y(o.ctx.common.issues));
        return p(r, { code: d.invalid_union, unionErrors: a }), _;
      }
      if (r.common.async)
        return Promise.all(
          n.map(async (s) => {
            const a = {
              ...r,
              common: { ...r.common, issues: [] },
              parent: null,
            };
            return {
              result: await s._parseAsync({
                data: r.data,
                path: r.path,
                parent: a,
              }),
              ctx: a,
            };
          }),
        ).then(i);
      {
        let s;
        const a = [];
        for (const l of n) {
          const u = { ...r, common: { ...r.common, issues: [] }, parent: null },
            f = l._parseSync({ data: r.data, path: r.path, parent: u });
          if (f.status === "valid") return f;
          f.status === "dirty" && !s && (s = { result: f, ctx: u }),
            u.common.issues.length && a.push(u.common.issues);
        }
        if (s) return r.common.issues.push(...s.ctx.common.issues), s.result;
        const o = a.map((l) => new Y(l));
        return p(r, { code: d.invalid_union, unionErrors: o }), _;
      }
    }
    get options() {
      return this._def.options;
    }
  }
  qe.create = (t, e) => new qe({ options: t, typeName: y.ZodUnion, ...w(e) });
  const le = (t) =>
    t instanceof Qe
      ? le(t.schema)
      : t instanceof X
        ? le(t.innerType())
        : t instanceof Xe
          ? [t.value]
          : t instanceof me
            ? t.options
            : t instanceof Ke
              ? E.objectValues(t.enum)
              : t instanceof et
                ? le(t._def.innerType)
                : t instanceof Fe
                  ? [void 0]
                  : t instanceof Je
                    ? [null]
                    : t instanceof ne
                      ? [void 0, ...le(t.unwrap())]
                      : t instanceof ge
                        ? [null, ...le(t.unwrap())]
                        : t instanceof Wt || t instanceof nt
                          ? le(t.unwrap())
                          : t instanceof tt
                            ? le(t._def.innerType)
                            : [];
  class yt extends x {
    _parse(e) {
      const { ctx: r } = this._processInputParams(e);
      if (r.parsedType !== m.object)
        return (
          p(r, {
            code: d.invalid_type,
            expected: m.object,
            received: r.parsedType,
          }),
          _
        );
      const n = this.discriminator,
        i = r.data[n],
        s = this.optionsMap.get(i);
      return s
        ? r.common.async
          ? s._parseAsync({ data: r.data, path: r.path, parent: r })
          : s._parseSync({ data: r.data, path: r.path, parent: r })
        : (p(r, {
            code: d.invalid_union_discriminator,
            options: Array.from(this.optionsMap.keys()),
            path: [n],
          }),
          _);
    }
    get discriminator() {
      return this._def.discriminator;
    }
    get options() {
      return this._def.options;
    }
    get optionsMap() {
      return this._def.optionsMap;
    }
    static create(e, r, n) {
      const i = new Map();
      for (const s of r) {
        const a = le(s.shape[e]);
        if (!a.length)
          throw new Error(
            `A discriminator value for key \`${e}\` could not be extracted from all schema options`,
          );
        for (const o of a) {
          if (i.has(o))
            throw new Error(
              `Discriminator property ${String(e)} has duplicate value ${String(o)}`,
            );
          i.set(o, s);
        }
      }
      return new yt({
        typeName: y.ZodDiscriminatedUnion,
        discriminator: e,
        options: r,
        optionsMap: i,
        ...w(n),
      });
    }
  }
  function Vt(t, e) {
    const r = ae(t),
      n = ae(e);
    if (t === e) return { valid: !0, data: t };
    if (r === m.object && n === m.object) {
      const i = E.objectKeys(e),
        s = E.objectKeys(t).filter((o) => i.indexOf(o) !== -1),
        a = { ...t, ...e };
      for (const o of s) {
        const l = Vt(t[o], e[o]);
        if (!l.valid) return { valid: !1 };
        a[o] = l.data;
      }
      return { valid: !0, data: a };
    } else if (r === m.array && n === m.array) {
      if (t.length !== e.length) return { valid: !1 };
      const i = [];
      for (let s = 0; s < t.length; s++) {
        const a = t[s],
          o = e[s],
          l = Vt(a, o);
        if (!l.valid) return { valid: !1 };
        i.push(l.data);
      }
      return { valid: !0, data: i };
    } else
      return r === m.date && n === m.date && +t == +e
        ? { valid: !0, data: t }
        : { valid: !1 };
  }
  class Ge extends x {
    _parse(e) {
      const { status: r, ctx: n } = this._processInputParams(e),
        i = (s, a) => {
          if (Ut(s) || Ut(a)) return _;
          const o = Vt(s.value, a.value);
          return o.valid
            ? ((Bt(s) || Bt(a)) && r.dirty(),
              { status: r.value, value: o.data })
            : (p(n, { code: d.invalid_intersection_types }), _);
        };
      return n.common.async
        ? Promise.all([
            this._def.left._parseAsync({
              data: n.data,
              path: n.path,
              parent: n,
            }),
            this._def.right._parseAsync({
              data: n.data,
              path: n.path,
              parent: n,
            }),
          ]).then(([s, a]) => i(s, a))
        : i(
            this._def.left._parseSync({
              data: n.data,
              path: n.path,
              parent: n,
            }),
            this._def.right._parseSync({
              data: n.data,
              path: n.path,
              parent: n,
            }),
          );
    }
  }
  Ge.create = (t, e, r) =>
    new Ge({ left: t, right: e, typeName: y.ZodIntersection, ...w(r) });
  class re extends x {
    _parse(e) {
      const { status: r, ctx: n } = this._processInputParams(e);
      if (n.parsedType !== m.array)
        return (
          p(n, {
            code: d.invalid_type,
            expected: m.array,
            received: n.parsedType,
          }),
          _
        );
      if (n.data.length < this._def.items.length)
        return (
          p(n, {
            code: d.too_small,
            minimum: this._def.items.length,
            inclusive: !0,
            exact: !1,
            type: "array",
          }),
          _
        );
      !this._def.rest &&
        n.data.length > this._def.items.length &&
        (p(n, {
          code: d.too_big,
          maximum: this._def.items.length,
          inclusive: !0,
          exact: !1,
          type: "array",
        }),
        r.dirty());
      const s = [...n.data]
        .map((a, o) => {
          const l = this._def.items[o] || this._def.rest;
          return l ? l._parse(new te(n, a, n.path, o)) : null;
        })
        .filter((a) => !!a);
      return n.common.async
        ? Promise.all(s).then((a) => Z.mergeArray(r, a))
        : Z.mergeArray(r, s);
    }
    get items() {
      return this._def.items;
    }
    rest(e) {
      return new re({ ...this._def, rest: e });
    }
  }
  re.create = (t, e) => {
    if (!Array.isArray(t))
      throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
    return new re({ items: t, typeName: y.ZodTuple, rest: null, ...w(e) });
  };
  class He extends x {
    get keySchema() {
      return this._def.keyType;
    }
    get valueSchema() {
      return this._def.valueType;
    }
    _parse(e) {
      const { status: r, ctx: n } = this._processInputParams(e);
      if (n.parsedType !== m.object)
        return (
          p(n, {
            code: d.invalid_type,
            expected: m.object,
            received: n.parsedType,
          }),
          _
        );
      const i = [],
        s = this._def.keyType,
        a = this._def.valueType;
      for (const o in n.data)
        i.push({
          key: s._parse(new te(n, o, n.path, o)),
          value: a._parse(new te(n, n.data[o], n.path, o)),
          alwaysSet: o in n.data,
        });
      return n.common.async
        ? Z.mergeObjectAsync(r, i)
        : Z.mergeObjectSync(r, i);
    }
    get element() {
      return this._def.valueType;
    }
    static create(e, r, n) {
      return r instanceof x
        ? new He({ keyType: e, valueType: r, typeName: y.ZodRecord, ...w(n) })
        : new He({
            keyType: H.create(),
            valueType: e,
            typeName: y.ZodRecord,
            ...w(r),
          });
    }
  }
  class vt extends x {
    get keySchema() {
      return this._def.keyType;
    }
    get valueSchema() {
      return this._def.valueType;
    }
    _parse(e) {
      const { status: r, ctx: n } = this._processInputParams(e);
      if (n.parsedType !== m.map)
        return (
          p(n, {
            code: d.invalid_type,
            expected: m.map,
            received: n.parsedType,
          }),
          _
        );
      const i = this._def.keyType,
        s = this._def.valueType,
        a = [...n.data.entries()].map(([o, l], u) => ({
          key: i._parse(new te(n, o, n.path, [u, "key"])),
          value: s._parse(new te(n, l, n.path, [u, "value"])),
        }));
      if (n.common.async) {
        const o = new Map();
        return Promise.resolve().then(async () => {
          for (const l of a) {
            const u = await l.key,
              f = await l.value;
            if (u.status === "aborted" || f.status === "aborted") return _;
            (u.status === "dirty" || f.status === "dirty") && r.dirty(),
              o.set(u.value, f.value);
          }
          return { status: r.value, value: o };
        });
      } else {
        const o = new Map();
        for (const l of a) {
          const u = l.key,
            f = l.value;
          if (u.status === "aborted" || f.status === "aborted") return _;
          (u.status === "dirty" || f.status === "dirty") && r.dirty(),
            o.set(u.value, f.value);
        }
        return { status: r.value, value: o };
      }
    }
  }
  vt.create = (t, e, r) =>
    new vt({ valueType: e, keyType: t, typeName: y.ZodMap, ...w(r) });
  class Ie extends x {
    _parse(e) {
      const { status: r, ctx: n } = this._processInputParams(e);
      if (n.parsedType !== m.set)
        return (
          p(n, {
            code: d.invalid_type,
            expected: m.set,
            received: n.parsedType,
          }),
          _
        );
      const i = this._def;
      i.minSize !== null &&
        n.data.size < i.minSize.value &&
        (p(n, {
          code: d.too_small,
          minimum: i.minSize.value,
          type: "set",
          inclusive: !0,
          exact: !1,
          message: i.minSize.message,
        }),
        r.dirty()),
        i.maxSize !== null &&
          n.data.size > i.maxSize.value &&
          (p(n, {
            code: d.too_big,
            maximum: i.maxSize.value,
            type: "set",
            inclusive: !0,
            exact: !1,
            message: i.maxSize.message,
          }),
          r.dirty());
      const s = this._def.valueType;
      function a(l) {
        const u = new Set();
        for (const f of l) {
          if (f.status === "aborted") return _;
          f.status === "dirty" && r.dirty(), u.add(f.value);
        }
        return { status: r.value, value: u };
      }
      const o = [...n.data.values()].map((l, u) =>
        s._parse(new te(n, l, n.path, u)),
      );
      return n.common.async ? Promise.all(o).then((l) => a(l)) : a(o);
    }
    min(e, r) {
      return new Ie({
        ...this._def,
        minSize: { value: e, message: g.toString(r) },
      });
    }
    max(e, r) {
      return new Ie({
        ...this._def,
        maxSize: { value: e, message: g.toString(r) },
      });
    }
    size(e, r) {
      return this.min(e, r).max(e, r);
    }
    nonempty(e) {
      return this.min(1, e);
    }
  }
  Ie.create = (t, e) =>
    new Ie({
      valueType: t,
      minSize: null,
      maxSize: null,
      typeName: y.ZodSet,
      ...w(e),
    });
  class Ue extends x {
    constructor() {
      super(...arguments), (this.validate = this.implement);
    }
    _parse(e) {
      const { ctx: r } = this._processInputParams(e);
      if (r.parsedType !== m.function)
        return (
          p(r, {
            code: d.invalid_type,
            expected: m.function,
            received: r.parsedType,
          }),
          _
        );
      function n(o, l) {
        return mt({
          data: o,
          path: r.path,
          errorMaps: [
            r.common.contextualErrorMap,
            r.schemaErrorMap,
            pt(),
            Me,
          ].filter((u) => !!u),
          issueData: { code: d.invalid_arguments, argumentsError: l },
        });
      }
      function i(o, l) {
        return mt({
          data: o,
          path: r.path,
          errorMaps: [
            r.common.contextualErrorMap,
            r.schemaErrorMap,
            pt(),
            Me,
          ].filter((u) => !!u),
          issueData: { code: d.invalid_return_type, returnTypeError: l },
        });
      }
      const s = { errorMap: r.common.contextualErrorMap },
        a = r.data;
      if (this._def.returns instanceof Be) {
        const o = this;
        return P(async function (...l) {
          const u = new Y([]),
            f = await o._def.args.parseAsync(l, s).catch((S) => {
              throw (u.addIssue(n(l, S)), u);
            }),
            h = await Reflect.apply(a, this, f);
          return await o._def.returns._def.type.parseAsync(h, s).catch((S) => {
            throw (u.addIssue(i(h, S)), u);
          });
        });
      } else {
        const o = this;
        return P(function (...l) {
          const u = o._def.args.safeParse(l, s);
          if (!u.success) throw new Y([n(l, u.error)]);
          const f = Reflect.apply(a, this, u.data),
            h = o._def.returns.safeParse(f, s);
          if (!h.success) throw new Y([i(f, h.error)]);
          return h.data;
        });
      }
    }
    parameters() {
      return this._def.args;
    }
    returnType() {
      return this._def.returns;
    }
    args(...e) {
      return new Ue({ ...this._def, args: re.create(e).rest(Re.create()) });
    }
    returns(e) {
      return new Ue({ ...this._def, returns: e });
    }
    implement(e) {
      return this.parse(e);
    }
    strictImplement(e) {
      return this.parse(e);
    }
    static create(e, r, n) {
      return new Ue({
        args: e || re.create([]).rest(Re.create()),
        returns: r || Re.create(),
        typeName: y.ZodFunction,
        ...w(n),
      });
    }
  }
  class Qe extends x {
    get schema() {
      return this._def.getter();
    }
    _parse(e) {
      const { ctx: r } = this._processInputParams(e);
      return this._def
        .getter()
        ._parse({ data: r.data, path: r.path, parent: r });
    }
  }
  Qe.create = (t, e) => new Qe({ getter: t, typeName: y.ZodLazy, ...w(e) });
  class Xe extends x {
    _parse(e) {
      if (e.data !== this._def.value) {
        const r = this._getOrReturnCtx(e);
        return (
          p(r, {
            received: r.data,
            code: d.invalid_literal,
            expected: this._def.value,
          }),
          _
        );
      }
      return { status: "valid", value: e.data };
    }
    get value() {
      return this._def.value;
    }
  }
  Xe.create = (t, e) => new Xe({ value: t, typeName: y.ZodLiteral, ...w(e) });
  function kr(t, e) {
    return new me({ values: t, typeName: y.ZodEnum, ...w(e) });
  }
  class me extends x {
    _parse(e) {
      if (typeof e.data != "string") {
        const r = this._getOrReturnCtx(e),
          n = this._def.values;
        return (
          p(r, {
            expected: E.joinValues(n),
            received: r.parsedType,
            code: d.invalid_type,
          }),
          _
        );
      }
      if (
        (this._cache || (this._cache = new Set(this._def.values)),
        !this._cache.has(e.data))
      ) {
        const r = this._getOrReturnCtx(e),
          n = this._def.values;
        return (
          p(r, { received: r.data, code: d.invalid_enum_value, options: n }), _
        );
      }
      return P(e.data);
    }
    get options() {
      return this._def.values;
    }
    get enum() {
      const e = {};
      for (const r of this._def.values) e[r] = r;
      return e;
    }
    get Values() {
      const e = {};
      for (const r of this._def.values) e[r] = r;
      return e;
    }
    get Enum() {
      const e = {};
      for (const r of this._def.values) e[r] = r;
      return e;
    }
    extract(e, r = this._def) {
      return me.create(e, { ...this._def, ...r });
    }
    exclude(e, r = this._def) {
      return me.create(
        this.options.filter((n) => !e.includes(n)),
        { ...this._def, ...r },
      );
    }
  }
  me.create = kr;
  class Ke extends x {
    _parse(e) {
      const r = E.getValidEnumValues(this._def.values),
        n = this._getOrReturnCtx(e);
      if (n.parsedType !== m.string && n.parsedType !== m.number) {
        const i = E.objectValues(r);
        return (
          p(n, {
            expected: E.joinValues(i),
            received: n.parsedType,
            code: d.invalid_type,
          }),
          _
        );
      }
      if (
        (this._cache ||
          (this._cache = new Set(E.getValidEnumValues(this._def.values))),
        !this._cache.has(e.data))
      ) {
        const i = E.objectValues(r);
        return (
          p(n, { received: n.data, code: d.invalid_enum_value, options: i }), _
        );
      }
      return P(e.data);
    }
    get enum() {
      return this._def.values;
    }
  }
  Ke.create = (t, e) =>
    new Ke({ values: t, typeName: y.ZodNativeEnum, ...w(e) });
  class Be extends x {
    unwrap() {
      return this._def.type;
    }
    _parse(e) {
      const { ctx: r } = this._processInputParams(e);
      if (r.parsedType !== m.promise && r.common.async === !1)
        return (
          p(r, {
            code: d.invalid_type,
            expected: m.promise,
            received: r.parsedType,
          }),
          _
        );
      const n = r.parsedType === m.promise ? r.data : Promise.resolve(r.data);
      return P(
        n.then((i) =>
          this._def.type.parseAsync(i, {
            path: r.path,
            errorMap: r.common.contextualErrorMap,
          }),
        ),
      );
    }
  }
  Be.create = (t, e) => new Be({ type: t, typeName: y.ZodPromise, ...w(e) });
  class X extends x {
    innerType() {
      return this._def.schema;
    }
    sourceType() {
      return this._def.schema._def.typeName === y.ZodEffects
        ? this._def.schema.sourceType()
        : this._def.schema;
    }
    _parse(e) {
      const { status: r, ctx: n } = this._processInputParams(e),
        i = this._def.effect || null,
        s = {
          addIssue: (a) => {
            p(n, a), a.fatal ? r.abort() : r.dirty();
          },
          get path() {
            return n.path;
          },
        };
      if (((s.addIssue = s.addIssue.bind(s)), i.type === "preprocess")) {
        const a = i.transform(n.data, s);
        if (n.common.async)
          return Promise.resolve(a).then(async (o) => {
            if (r.value === "aborted") return _;
            const l = await this._def.schema._parseAsync({
              data: o,
              path: n.path,
              parent: n,
            });
            return l.status === "aborted"
              ? _
              : l.status === "dirty" || r.value === "dirty"
                ? je(l.value)
                : l;
          });
        {
          if (r.value === "aborted") return _;
          const o = this._def.schema._parseSync({
            data: a,
            path: n.path,
            parent: n,
          });
          return o.status === "aborted"
            ? _
            : o.status === "dirty" || r.value === "dirty"
              ? je(o.value)
              : o;
        }
      }
      if (i.type === "refinement") {
        const a = (o) => {
          const l = i.refinement(o, s);
          if (n.common.async) return Promise.resolve(l);
          if (l instanceof Promise)
            throw new Error(
              "Async refinement encountered during synchronous parse operation. Use .parseAsync instead.",
            );
          return o;
        };
        if (n.common.async === !1) {
          const o = this._def.schema._parseSync({
            data: n.data,
            path: n.path,
            parent: n,
          });
          return o.status === "aborted"
            ? _
            : (o.status === "dirty" && r.dirty(),
              a(o.value),
              { status: r.value, value: o.value });
        } else
          return this._def.schema
            ._parseAsync({ data: n.data, path: n.path, parent: n })
            .then((o) =>
              o.status === "aborted"
                ? _
                : (o.status === "dirty" && r.dirty(),
                  a(o.value).then(() => ({ status: r.value, value: o.value }))),
            );
      }
      if (i.type === "transform")
        if (n.common.async === !1) {
          const a = this._def.schema._parseSync({
            data: n.data,
            path: n.path,
            parent: n,
          });
          if (!Ee(a)) return _;
          const o = i.transform(a.value, s);
          if (o instanceof Promise)
            throw new Error(
              "Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.",
            );
          return { status: r.value, value: o };
        } else
          return this._def.schema
            ._parseAsync({ data: n.data, path: n.path, parent: n })
            .then((a) =>
              Ee(a)
                ? Promise.resolve(i.transform(a.value, s)).then((o) => ({
                    status: r.value,
                    value: o,
                  }))
                : _,
            );
      E.assertNever(i);
    }
  }
  (X.create = (t, e, r) =>
    new X({ schema: t, typeName: y.ZodEffects, effect: e, ...w(r) })),
    (X.createWithPreprocess = (t, e, r) =>
      new X({
        schema: e,
        effect: { type: "preprocess", transform: t },
        typeName: y.ZodEffects,
        ...w(r),
      }));
  class ne extends x {
    _parse(e) {
      return this._getType(e) === m.undefined
        ? P(void 0)
        : this._def.innerType._parse(e);
    }
    unwrap() {
      return this._def.innerType;
    }
  }
  ne.create = (t, e) =>
    new ne({ innerType: t, typeName: y.ZodOptional, ...w(e) });
  class ge extends x {
    _parse(e) {
      return this._getType(e) === m.null
        ? P(null)
        : this._def.innerType._parse(e);
    }
    unwrap() {
      return this._def.innerType;
    }
  }
  ge.create = (t, e) =>
    new ge({ innerType: t, typeName: y.ZodNullable, ...w(e) });
  class et extends x {
    _parse(e) {
      const { ctx: r } = this._processInputParams(e);
      let n = r.data;
      return (
        r.parsedType === m.undefined && (n = this._def.defaultValue()),
        this._def.innerType._parse({ data: n, path: r.path, parent: r })
      );
    }
    removeDefault() {
      return this._def.innerType;
    }
  }
  et.create = (t, e) =>
    new et({
      innerType: t,
      typeName: y.ZodDefault,
      defaultValue:
        typeof e.default == "function" ? e.default : () => e.default,
      ...w(e),
    });
  class tt extends x {
    _parse(e) {
      const { ctx: r } = this._processInputParams(e),
        n = { ...r, common: { ...r.common, issues: [] } },
        i = this._def.innerType._parse({
          data: n.data,
          path: n.path,
          parent: { ...n },
        });
      return ze(i)
        ? i.then((s) => ({
            status: "valid",
            value:
              s.status === "valid"
                ? s.value
                : this._def.catchValue({
                    get error() {
                      return new Y(n.common.issues);
                    },
                    input: n.data,
                  }),
          }))
        : {
            status: "valid",
            value:
              i.status === "valid"
                ? i.value
                : this._def.catchValue({
                    get error() {
                      return new Y(n.common.issues);
                    },
                    input: n.data,
                  }),
          };
    }
    removeCatch() {
      return this._def.innerType;
    }
  }
  tt.create = (t, e) =>
    new tt({
      innerType: t,
      typeName: y.ZodCatch,
      catchValue: typeof e.catch == "function" ? e.catch : () => e.catch,
      ...w(e),
    });
  class wt extends x {
    _parse(e) {
      if (this._getType(e) !== m.nan) {
        const n = this._getOrReturnCtx(e);
        return (
          p(n, {
            code: d.invalid_type,
            expected: m.nan,
            received: n.parsedType,
          }),
          _
        );
      }
      return { status: "valid", value: e.data };
    }
  }
  wt.create = (t) => new wt({ typeName: y.ZodNaN, ...w(t) });
  const hi = Symbol("zod_brand");
  class Wt extends x {
    _parse(e) {
      const { ctx: r } = this._processInputParams(e),
        n = r.data;
      return this._def.type._parse({ data: n, path: r.path, parent: r });
    }
    unwrap() {
      return this._def.type;
    }
  }
  class rt extends x {
    _parse(e) {
      const { status: r, ctx: n } = this._processInputParams(e);
      if (n.common.async)
        return (async () => {
          const s = await this._def.in._parseAsync({
            data: n.data,
            path: n.path,
            parent: n,
          });
          return s.status === "aborted"
            ? _
            : s.status === "dirty"
              ? (r.dirty(), je(s.value))
              : this._def.out._parseAsync({
                  data: s.value,
                  path: n.path,
                  parent: n,
                });
        })();
      {
        const i = this._def.in._parseSync({
          data: n.data,
          path: n.path,
          parent: n,
        });
        return i.status === "aborted"
          ? _
          : i.status === "dirty"
            ? (r.dirty(), { status: "dirty", value: i.value })
            : this._def.out._parseSync({
                data: i.value,
                path: n.path,
                parent: n,
              });
      }
    }
    static create(e, r) {
      return new rt({ in: e, out: r, typeName: y.ZodPipeline });
    }
  }
  class nt extends x {
    _parse(e) {
      const r = this._def.innerType._parse(e),
        n = (i) => (Ee(i) && (i.value = Object.freeze(i.value)), i);
      return ze(r) ? r.then((i) => n(i)) : n(r);
    }
    unwrap() {
      return this._def.innerType;
    }
  }
  nt.create = (t, e) =>
    new nt({ innerType: t, typeName: y.ZodReadonly, ...w(e) });
  function Rr(t, e) {
    const r =
      typeof t == "function" ? t(e) : typeof t == "string" ? { message: t } : t;
    return typeof r == "string" ? { message: r } : r;
  }
  function Ir(t, e = {}, r) {
    return t
      ? De.create().superRefine((n, i) => {
          const s = t(n);
          if (s instanceof Promise)
            return s.then((a) => {
              if (!a) {
                const o = Rr(e, n),
                  l = o.fatal ?? r ?? !0;
                i.addIssue({ code: "custom", ...o, fatal: l });
              }
            });
          if (!s) {
            const a = Rr(e, n),
              o = a.fatal ?? r ?? !0;
            i.addIssue({ code: "custom", ...a, fatal: o });
          }
        })
      : De.create();
  }
  const pi = { object: A.lazycreate };
  var y;
  (function (t) {
    (t.ZodString = "ZodString"),
      (t.ZodNumber = "ZodNumber"),
      (t.ZodNaN = "ZodNaN"),
      (t.ZodBigInt = "ZodBigInt"),
      (t.ZodBoolean = "ZodBoolean"),
      (t.ZodDate = "ZodDate"),
      (t.ZodSymbol = "ZodSymbol"),
      (t.ZodUndefined = "ZodUndefined"),
      (t.ZodNull = "ZodNull"),
      (t.ZodAny = "ZodAny"),
      (t.ZodUnknown = "ZodUnknown"),
      (t.ZodNever = "ZodNever"),
      (t.ZodVoid = "ZodVoid"),
      (t.ZodArray = "ZodArray"),
      (t.ZodObject = "ZodObject"),
      (t.ZodUnion = "ZodUnion"),
      (t.ZodDiscriminatedUnion = "ZodDiscriminatedUnion"),
      (t.ZodIntersection = "ZodIntersection"),
      (t.ZodTuple = "ZodTuple"),
      (t.ZodRecord = "ZodRecord"),
      (t.ZodMap = "ZodMap"),
      (t.ZodSet = "ZodSet"),
      (t.ZodFunction = "ZodFunction"),
      (t.ZodLazy = "ZodLazy"),
      (t.ZodLiteral = "ZodLiteral"),
      (t.ZodEnum = "ZodEnum"),
      (t.ZodEffects = "ZodEffects"),
      (t.ZodNativeEnum = "ZodNativeEnum"),
      (t.ZodOptional = "ZodOptional"),
      (t.ZodNullable = "ZodNullable"),
      (t.ZodDefault = "ZodDefault"),
      (t.ZodCatch = "ZodCatch"),
      (t.ZodPromise = "ZodPromise"),
      (t.ZodBranded = "ZodBranded"),
      (t.ZodPipeline = "ZodPipeline"),
      (t.ZodReadonly = "ZodReadonly");
  })(y || (y = {}));
  const mi = (t, e = { message: `Input not instance of ${t.name}` }) =>
      Ir((r) => r instanceof t, e),
    Tr = H.create,
    Nr = he.create,
    gi = wt.create,
    _i = pe.create,
    Cr = Ye.create,
    yi = ke.create,
    vi = gt.create,
    wi = Fe.create,
    bi = Je.create,
    xi = De.create,
    Si = Re.create,
    Ei = oe.create,
    ki = _t.create,
    Ri = Q.create,
    Ii = A.create,
    Ti = A.strictCreate,
    Ni = qe.create,
    Ci = yt.create,
    Oi = Ge.create,
    Ai = re.create,
    Li = He.create,
    Mi = vt.create,
    ji = Ie.create,
    Di = Ue.create,
    Zi = Qe.create,
    Ui = Xe.create,
    Bi = me.create,
    Pi = Ke.create,
    Vi = Be.create,
    Or = X.create,
    Wi = ne.create,
    $i = ge.create,
    zi = X.createWithPreprocess,
    Yi = rt.create;
  var $t = Object.freeze({
    __proto__: null,
    BRAND: hi,
    DIRTY: je,
    EMPTY_PATH: Yn,
    INVALID: _,
    NEVER: _,
    OK: P,
    ParseStatus: Z,
    Schema: x,
    ZodAny: De,
    ZodArray: Q,
    ZodBigInt: pe,
    ZodBoolean: Ye,
    ZodBranded: Wt,
    ZodCatch: tt,
    ZodDate: ke,
    ZodDefault: et,
    ZodDiscriminatedUnion: yt,
    ZodEffects: X,
    ZodEnum: me,
    ZodError: Y,
    get ZodFirstPartyTypeKind() {
      return y;
    },
    ZodFunction: Ue,
    ZodIntersection: Ge,
    ZodIssueCode: d,
    ZodLazy: Qe,
    ZodLiteral: Xe,
    ZodMap: vt,
    ZodNaN: wt,
    ZodNativeEnum: Ke,
    ZodNever: oe,
    ZodNull: Je,
    ZodNullable: ge,
    ZodNumber: he,
    ZodObject: A,
    ZodOptional: ne,
    ZodParsedType: m,
    ZodPipeline: rt,
    ZodPromise: Be,
    ZodReadonly: nt,
    ZodRecord: He,
    ZodSchema: x,
    ZodSet: Ie,
    ZodString: H,
    ZodSymbol: gt,
    ZodTransformer: X,
    ZodTuple: re,
    ZodType: x,
    ZodUndefined: Fe,
    ZodUnion: qe,
    ZodUnknown: Re,
    ZodVoid: _t,
    addIssueToContext: p,
    any: xi,
    array: Ri,
    bigint: _i,
    boolean: Cr,
    coerce: {
      string: (t) => H.create({ ...t, coerce: !0 }),
      number: (t) => he.create({ ...t, coerce: !0 }),
      boolean: (t) => Ye.create({ ...t, coerce: !0 }),
      bigint: (t) => pe.create({ ...t, coerce: !0 }),
      date: (t) => ke.create({ ...t, coerce: !0 }),
    },
    custom: Ir,
    date: yi,
    datetimeRegex: Er,
    defaultErrorMap: Me,
    discriminatedUnion: Ci,
    effect: Or,
    enum: Bi,
    function: Di,
    getErrorMap: pt,
    getParsedType: ae,
    instanceof: mi,
    intersection: Oi,
    isAborted: Ut,
    isAsync: ze,
    isDirty: Bt,
    isValid: Ee,
    late: pi,
    lazy: Zi,
    literal: Ui,
    makeIssue: mt,
    map: Mi,
    nan: gi,
    nativeEnum: Pi,
    never: Ei,
    null: bi,
    nullable: $i,
    number: Nr,
    object: Ii,
    get objectUtil() {
      return Zt;
    },
    oboolean: () => Cr().optional(),
    onumber: () => Nr().optional(),
    optional: Wi,
    ostring: () => Tr().optional(),
    pipeline: Yi,
    preprocess: zi,
    promise: Vi,
    quotelessJson: $n,
    record: Li,
    set: ji,
    setErrorMap: zn,
    strictObject: Ti,
    string: Tr,
    symbol: vi,
    transformer: Or,
    tuple: Ai,
    undefined: wi,
    union: Ni,
    unknown: Si,
    get util() {
      return E;
    },
    void: ki,
  });
  const Fi = (t) => t.object({ index: t.coerce.number(), key: t.string() }),
    Ji = (t) =>
      t
        .object({ cluster_id: t.coerce.number(), label: t.string() })
        .transform((e) => ({ clusterId: e.cluster_id, label: e.label })),
    qi = (t, e) =>
      t
        .object({
          cluster_id: t.coerce.number(),
          x: t.coerce.number(),
          y: t.coerce.number(),
          num_recent_articles: t.coerce.number(),
          cluster_category: t.coerce.number(),
          growth_rating: t.coerce.number(),
          key_concepts: t.string(),
        })
        .transform((r) => {
          var n;
          return {
            clusterId: r.cluster_id,
            x: r.x,
            y: -r.y,
            numRecentArticles: r.num_recent_articles,
            clusterCategory: r.cluster_category,
            growthRating: r.growth_rating,
            keyConcepts: r.key_concepts.split(",").map((i) => Number(i)),
            cityLabel:
              ((n = e.get(r.cluster_id)) == null ? void 0 : n.label) ?? null,
          };
        }),
    Gi = (t) => {
      const e = new Map();
      return { add: (r) => e.set(t(r), r), getResults: () => e };
    };
  var Pe =
      typeof global < "u"
        ? global
        : typeof self < "u"
          ? self
          : typeof window < "u"
            ? window
            : {},
    ie = [],
    F = [],
    Hi = typeof Uint8Array < "u" ? Uint8Array : Array,
    zt = !1;
  function Ar() {
    zt = !0;
    for (
      var t =
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
        e = 0,
        r = t.length;
      e < r;
      ++e
    )
      (ie[e] = t[e]), (F[t.charCodeAt(e)] = e);
    (F[45] = 62), (F[95] = 63);
  }
  function Qi(t) {
    zt || Ar();
    var e,
      r,
      n,
      i,
      s,
      a,
      o = t.length;
    if (o % 4 > 0)
      throw new Error("Invalid string. Length must be a multiple of 4");
    (s = t[o - 2] === "=" ? 2 : t[o - 1] === "=" ? 1 : 0),
      (a = new Hi((o * 3) / 4 - s)),
      (n = s > 0 ? o - 4 : o);
    var l = 0;
    for (e = 0, r = 0; e < n; e += 4, r += 3)
      (i =
        (F[t.charCodeAt(e)] << 18) |
        (F[t.charCodeAt(e + 1)] << 12) |
        (F[t.charCodeAt(e + 2)] << 6) |
        F[t.charCodeAt(e + 3)]),
        (a[l++] = (i >> 16) & 255),
        (a[l++] = (i >> 8) & 255),
        (a[l++] = i & 255);
    return (
      s === 2
        ? ((i = (F[t.charCodeAt(e)] << 2) | (F[t.charCodeAt(e + 1)] >> 4)),
          (a[l++] = i & 255))
        : s === 1 &&
          ((i =
            (F[t.charCodeAt(e)] << 10) |
            (F[t.charCodeAt(e + 1)] << 4) |
            (F[t.charCodeAt(e + 2)] >> 2)),
          (a[l++] = (i >> 8) & 255),
          (a[l++] = i & 255)),
      a
    );
  }
  function Xi(t) {
    return (
      ie[(t >> 18) & 63] + ie[(t >> 12) & 63] + ie[(t >> 6) & 63] + ie[t & 63]
    );
  }
  function Ki(t, e, r) {
    for (var n, i = [], s = e; s < r; s += 3)
      (n = (t[s] << 16) + (t[s + 1] << 8) + t[s + 2]), i.push(Xi(n));
    return i.join("");
  }
  function Lr(t) {
    zt || Ar();
    for (
      var e,
        r = t.length,
        n = r % 3,
        i = "",
        s = [],
        a = 16383,
        o = 0,
        l = r - n;
      o < l;
      o += a
    )
      s.push(Ki(t, o, o + a > l ? l : o + a));
    return (
      n === 1
        ? ((e = t[r - 1]),
          (i += ie[e >> 2]),
          (i += ie[(e << 4) & 63]),
          (i += "=="))
        : n === 2 &&
          ((e = (t[r - 2] << 8) + t[r - 1]),
          (i += ie[e >> 10]),
          (i += ie[(e >> 4) & 63]),
          (i += ie[(e << 2) & 63]),
          (i += "=")),
      s.push(i),
      s.join("")
    );
  }
  function bt(t, e, r, n, i) {
    var s,
      a,
      o = i * 8 - n - 1,
      l = (1 << o) - 1,
      u = l >> 1,
      f = -7,
      h = r ? i - 1 : 0,
      v = r ? -1 : 1,
      S = t[e + h];
    for (
      h += v, s = S & ((1 << -f) - 1), S >>= -f, f += o;
      f > 0;
      s = s * 256 + t[e + h], h += v, f -= 8
    );
    for (
      a = s & ((1 << -f) - 1), s >>= -f, f += n;
      f > 0;
      a = a * 256 + t[e + h], h += v, f -= 8
    );
    if (s === 0) s = 1 - u;
    else {
      if (s === l) return a ? NaN : (S ? -1 : 1) * (1 / 0);
      (a = a + Math.pow(2, n)), (s = s - u);
    }
    return (S ? -1 : 1) * a * Math.pow(2, s - n);
  }
  function Mr(t, e, r, n, i, s) {
    var a,
      o,
      l,
      u = s * 8 - i - 1,
      f = (1 << u) - 1,
      h = f >> 1,
      v = i === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0,
      S = n ? 0 : s - 1,
      V = n ? 1 : -1,
      O = e < 0 || (e === 0 && 1 / e < 0) ? 1 : 0;
    for (
      e = Math.abs(e),
        isNaN(e) || e === 1 / 0
          ? ((o = isNaN(e) ? 1 : 0), (a = f))
          : ((a = Math.floor(Math.log(e) / Math.LN2)),
            e * (l = Math.pow(2, -a)) < 1 && (a--, (l *= 2)),
            a + h >= 1 ? (e += v / l) : (e += v * Math.pow(2, 1 - h)),
            e * l >= 2 && (a++, (l /= 2)),
            a + h >= f
              ? ((o = 0), (a = f))
              : a + h >= 1
                ? ((o = (e * l - 1) * Math.pow(2, i)), (a = a + h))
                : ((o = e * Math.pow(2, h - 1) * Math.pow(2, i)), (a = 0)));
      i >= 8;
      t[r + S] = o & 255, S += V, o /= 256, i -= 8
    );
    for (
      a = (a << i) | o, u += i;
      u > 0;
      t[r + S] = a & 255, S += V, a /= 256, u -= 8
    );
    t[r + S - V] |= O * 128;
  }
  var es = {}.toString,
    jr =
      Array.isArray ||
      function (t) {
        return es.call(t) == "[object Array]";
      },
    ts = 50;
  (c.TYPED_ARRAY_SUPPORT =
    Pe.TYPED_ARRAY_SUPPORT !== void 0 ? Pe.TYPED_ARRAY_SUPPORT : !0),
    xt();
  function xt() {
    return c.TYPED_ARRAY_SUPPORT ? 2147483647 : 1073741823;
  }
  function ue(t, e) {
    if (xt() < e) throw new RangeError("Invalid typed array length");
    return (
      c.TYPED_ARRAY_SUPPORT
        ? ((t = new Uint8Array(e)), (t.__proto__ = c.prototype))
        : (t === null && (t = new c(e)), (t.length = e)),
      t
    );
  }
  function c(t, e, r) {
    if (!c.TYPED_ARRAY_SUPPORT && !(this instanceof c)) return new c(t, e, r);
    if (typeof t == "number") {
      if (typeof e == "string")
        throw new Error(
          "If encoding is specified then the first argument must be a string",
        );
      return Yt(this, t);
    }
    return Dr(this, t, e, r);
  }
  (c.poolSize = 8192),
    (c._augment = function (t) {
      return (t.__proto__ = c.prototype), t;
    });
  function Dr(t, e, r, n) {
    if (typeof e == "number")
      throw new TypeError('"value" argument must not be a number');
    return typeof ArrayBuffer < "u" && e instanceof ArrayBuffer
      ? is(t, e, r, n)
      : typeof e == "string"
        ? ns(t, e, r)
        : ss(t, e);
  }
  (c.from = function (t, e, r) {
    return Dr(null, t, e, r);
  }),
    c.TYPED_ARRAY_SUPPORT &&
      ((c.prototype.__proto__ = Uint8Array.prototype),
      (c.__proto__ = Uint8Array),
      typeof Symbol < "u" && Symbol.species && c[Symbol.species]);
  function Zr(t) {
    if (typeof t != "number")
      throw new TypeError('"size" argument must be a number');
    if (t < 0) throw new RangeError('"size" argument must not be negative');
  }
  function rs(t, e, r, n) {
    return (
      Zr(e),
      e <= 0
        ? ue(t, e)
        : r !== void 0
          ? typeof n == "string"
            ? ue(t, e).fill(r, n)
            : ue(t, e).fill(r)
          : ue(t, e)
    );
  }
  c.alloc = function (t, e, r) {
    return rs(null, t, e, r);
  };
  function Yt(t, e) {
    if ((Zr(e), (t = ue(t, e < 0 ? 0 : Jt(e) | 0)), !c.TYPED_ARRAY_SUPPORT))
      for (var r = 0; r < e; ++r) t[r] = 0;
    return t;
  }
  (c.allocUnsafe = function (t) {
    return Yt(null, t);
  }),
    (c.allocUnsafeSlow = function (t) {
      return Yt(null, t);
    });
  function ns(t, e, r) {
    if (((typeof r != "string" || r === "") && (r = "utf8"), !c.isEncoding(r)))
      throw new TypeError('"encoding" must be a valid string encoding');
    var n = Ur(e, r) | 0;
    t = ue(t, n);
    var i = t.write(e, r);
    return i !== n && (t = t.slice(0, i)), t;
  }
  function Ft(t, e) {
    var r = e.length < 0 ? 0 : Jt(e.length) | 0;
    t = ue(t, r);
    for (var n = 0; n < r; n += 1) t[n] = e[n] & 255;
    return t;
  }
  function is(t, e, r, n) {
    if ((e.byteLength, r < 0 || e.byteLength < r))
      throw new RangeError("'offset' is out of bounds");
    if (e.byteLength < r + (n || 0))
      throw new RangeError("'length' is out of bounds");
    return (
      r === void 0 && n === void 0
        ? (e = new Uint8Array(e))
        : n === void 0
          ? (e = new Uint8Array(e, r))
          : (e = new Uint8Array(e, r, n)),
      c.TYPED_ARRAY_SUPPORT
        ? ((t = e), (t.__proto__ = c.prototype))
        : (t = Ft(t, e)),
      t
    );
  }
  function ss(t, e) {
    if (se(e)) {
      var r = Jt(e.length) | 0;
      return (t = ue(t, r)), t.length === 0 || e.copy(t, 0, 0, r), t;
    }
    if (e) {
      if (
        (typeof ArrayBuffer < "u" && e.buffer instanceof ArrayBuffer) ||
        "length" in e
      )
        return typeof e.length != "number" || Es(e.length)
          ? ue(t, 0)
          : Ft(t, e);
      if (e.type === "Buffer" && jr(e.data)) return Ft(t, e.data);
    }
    throw new TypeError(
      "First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.",
    );
  }
  function Jt(t) {
    if (t >= xt())
      throw new RangeError(
        "Attempt to allocate Buffer larger than maximum size: 0x" +
          xt().toString(16) +
          " bytes",
      );
    return t | 0;
  }
  c.isBuffer = $;
  function se(t) {
    return !!(t != null && t._isBuffer);
  }
  (c.compare = function (e, r) {
    if (!se(e) || !se(r)) throw new TypeError("Arguments must be Buffers");
    if (e === r) return 0;
    for (var n = e.length, i = r.length, s = 0, a = Math.min(n, i); s < a; ++s)
      if (e[s] !== r[s]) {
        (n = e[s]), (i = r[s]);
        break;
      }
    return n < i ? -1 : i < n ? 1 : 0;
  }),
    (c.isEncoding = function (e) {
      switch (String(e).toLowerCase()) {
        case "hex":
        case "utf8":
        case "utf-8":
        case "ascii":
        case "latin1":
        case "binary":
        case "base64":
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
          return !0;
        default:
          return !1;
      }
    }),
    (c.concat = function (e, r) {
      if (!jr(e))
        throw new TypeError('"list" argument must be an Array of Buffers');
      if (e.length === 0) return c.alloc(0);
      var n;
      if (r === void 0) for (r = 0, n = 0; n < e.length; ++n) r += e[n].length;
      var i = c.allocUnsafe(r),
        s = 0;
      for (n = 0; n < e.length; ++n) {
        var a = e[n];
        if (!se(a))
          throw new TypeError('"list" argument must be an Array of Buffers');
        a.copy(i, s), (s += a.length);
      }
      return i;
    });
  function Ur(t, e) {
    if (se(t)) return t.length;
    if (
      typeof ArrayBuffer < "u" &&
      typeof ArrayBuffer.isView == "function" &&
      (ArrayBuffer.isView(t) || t instanceof ArrayBuffer)
    )
      return t.byteLength;
    typeof t != "string" && (t = "" + t);
    var r = t.length;
    if (r === 0) return 0;
    for (var n = !1; ; )
      switch (e) {
        case "ascii":
        case "latin1":
        case "binary":
          return r;
        case "utf8":
        case "utf-8":
        case void 0:
          return kt(t).length;
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
          return r * 2;
        case "hex":
          return r >>> 1;
        case "base64":
          return Jr(t).length;
        default:
          if (n) return kt(t).length;
          (e = ("" + e).toLowerCase()), (n = !0);
      }
  }
  c.byteLength = Ur;
  function as(t, e, r) {
    var n = !1;
    if (
      ((e === void 0 || e < 0) && (e = 0),
      e > this.length ||
        ((r === void 0 || r > this.length) && (r = this.length), r <= 0) ||
        ((r >>>= 0), (e >>>= 0), r <= e))
    )
      return "";
    for (t || (t = "utf8"); ; )
      switch (t) {
        case "hex":
          return gs(this, e, r);
        case "utf8":
        case "utf-8":
          return Wr(this, e, r);
        case "ascii":
          return ps(this, e, r);
        case "latin1":
        case "binary":
          return ms(this, e, r);
        case "base64":
          return ds(this, e, r);
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
          return _s(this, e, r);
        default:
          if (n) throw new TypeError("Unknown encoding: " + t);
          (t = (t + "").toLowerCase()), (n = !0);
      }
  }
  c.prototype._isBuffer = !0;
  function Te(t, e, r) {
    var n = t[e];
    (t[e] = t[r]), (t[r] = n);
  }
  (c.prototype.swap16 = function () {
    var e = this.length;
    if (e % 2 !== 0)
      throw new RangeError("Buffer size must be a multiple of 16-bits");
    for (var r = 0; r < e; r += 2) Te(this, r, r + 1);
    return this;
  }),
    (c.prototype.swap32 = function () {
      var e = this.length;
      if (e % 4 !== 0)
        throw new RangeError("Buffer size must be a multiple of 32-bits");
      for (var r = 0; r < e; r += 4) Te(this, r, r + 3), Te(this, r + 1, r + 2);
      return this;
    }),
    (c.prototype.swap64 = function () {
      var e = this.length;
      if (e % 8 !== 0)
        throw new RangeError("Buffer size must be a multiple of 64-bits");
      for (var r = 0; r < e; r += 8)
        Te(this, r, r + 7),
          Te(this, r + 1, r + 6),
          Te(this, r + 2, r + 5),
          Te(this, r + 3, r + 4);
      return this;
    }),
    (c.prototype.toString = function () {
      var e = this.length | 0;
      return e === 0
        ? ""
        : arguments.length === 0
          ? Wr(this, 0, e)
          : as.apply(this, arguments);
    }),
    (c.prototype.equals = function (e) {
      if (!se(e)) throw new TypeError("Argument must be a Buffer");
      return this === e ? !0 : c.compare(this, e) === 0;
    }),
    (c.prototype.inspect = function () {
      var e = "",
        r = ts;
      return (
        this.length > 0 &&
          ((e = this.toString("hex", 0, r).match(/.{2}/g).join(" ")),
          this.length > r && (e += " ... ")),
        "<Buffer " + e + ">"
      );
    }),
    (c.prototype.compare = function (e, r, n, i, s) {
      if (!se(e)) throw new TypeError("Argument must be a Buffer");
      if (
        (r === void 0 && (r = 0),
        n === void 0 && (n = e ? e.length : 0),
        i === void 0 && (i = 0),
        s === void 0 && (s = this.length),
        r < 0 || n > e.length || i < 0 || s > this.length)
      )
        throw new RangeError("out of range index");
      if (i >= s && r >= n) return 0;
      if (i >= s) return -1;
      if (r >= n) return 1;
      if (((r >>>= 0), (n >>>= 0), (i >>>= 0), (s >>>= 0), this === e))
        return 0;
      for (
        var a = s - i,
          o = n - r,
          l = Math.min(a, o),
          u = this.slice(i, s),
          f = e.slice(r, n),
          h = 0;
        h < l;
        ++h
      )
        if (u[h] !== f[h]) {
          (a = u[h]), (o = f[h]);
          break;
        }
      return a < o ? -1 : o < a ? 1 : 0;
    });
  function Br(t, e, r, n, i) {
    if (t.length === 0) return -1;
    if (
      (typeof r == "string"
        ? ((n = r), (r = 0))
        : r > 2147483647
          ? (r = 2147483647)
          : r < -2147483648 && (r = -2147483648),
      (r = +r),
      isNaN(r) && (r = i ? 0 : t.length - 1),
      r < 0 && (r = t.length + r),
      r >= t.length)
    ) {
      if (i) return -1;
      r = t.length - 1;
    } else if (r < 0)
      if (i) r = 0;
      else return -1;
    if ((typeof e == "string" && (e = c.from(e, n)), se(e)))
      return e.length === 0 ? -1 : Pr(t, e, r, n, i);
    if (typeof e == "number")
      return (
        (e = e & 255),
        c.TYPED_ARRAY_SUPPORT &&
        typeof Uint8Array.prototype.indexOf == "function"
          ? i
            ? Uint8Array.prototype.indexOf.call(t, e, r)
            : Uint8Array.prototype.lastIndexOf.call(t, e, r)
          : Pr(t, [e], r, n, i)
      );
    throw new TypeError("val must be string, number or Buffer");
  }
  function Pr(t, e, r, n, i) {
    var s = 1,
      a = t.length,
      o = e.length;
    if (
      n !== void 0 &&
      ((n = String(n).toLowerCase()),
      n === "ucs2" || n === "ucs-2" || n === "utf16le" || n === "utf-16le")
    ) {
      if (t.length < 2 || e.length < 2) return -1;
      (s = 2), (a /= 2), (o /= 2), (r /= 2);
    }
    function l(S, V) {
      return s === 1 ? S[V] : S.readUInt16BE(V * s);
    }
    var u;
    if (i) {
      var f = -1;
      for (u = r; u < a; u++)
        if (l(t, u) === l(e, f === -1 ? 0 : u - f)) {
          if ((f === -1 && (f = u), u - f + 1 === o)) return f * s;
        } else f !== -1 && (u -= u - f), (f = -1);
    } else
      for (r + o > a && (r = a - o), u = r; u >= 0; u--) {
        for (var h = !0, v = 0; v < o; v++)
          if (l(t, u + v) !== l(e, v)) {
            h = !1;
            break;
          }
        if (h) return u;
      }
    return -1;
  }
  (c.prototype.includes = function (e, r, n) {
    return this.indexOf(e, r, n) !== -1;
  }),
    (c.prototype.indexOf = function (e, r, n) {
      return Br(this, e, r, n, !0);
    }),
    (c.prototype.lastIndexOf = function (e, r, n) {
      return Br(this, e, r, n, !1);
    });
  function os(t, e, r, n) {
    r = Number(r) || 0;
    var i = t.length - r;
    n ? ((n = Number(n)), n > i && (n = i)) : (n = i);
    var s = e.length;
    if (s % 2 !== 0) throw new TypeError("Invalid hex string");
    n > s / 2 && (n = s / 2);
    for (var a = 0; a < n; ++a) {
      var o = parseInt(e.substr(a * 2, 2), 16);
      if (isNaN(o)) return a;
      t[r + a] = o;
    }
    return a;
  }
  function ls(t, e, r, n) {
    return Rt(kt(e, t.length - r), t, r, n);
  }
  function Vr(t, e, r, n) {
    return Rt(xs(e), t, r, n);
  }
  function us(t, e, r, n) {
    return Vr(t, e, r, n);
  }
  function cs(t, e, r, n) {
    return Rt(Jr(e), t, r, n);
  }
  function fs(t, e, r, n) {
    return Rt(Ss(e, t.length - r), t, r, n);
  }
  (c.prototype.write = function (e, r, n, i) {
    if (r === void 0) (i = "utf8"), (n = this.length), (r = 0);
    else if (n === void 0 && typeof r == "string")
      (i = r), (n = this.length), (r = 0);
    else if (isFinite(r))
      (r = r | 0),
        isFinite(n)
          ? ((n = n | 0), i === void 0 && (i = "utf8"))
          : ((i = n), (n = void 0));
    else
      throw new Error(
        "Buffer.write(string, encoding, offset[, length]) is no longer supported",
      );
    var s = this.length - r;
    if (
      ((n === void 0 || n > s) && (n = s),
      (e.length > 0 && (n < 0 || r < 0)) || r > this.length)
    )
      throw new RangeError("Attempt to write outside buffer bounds");
    i || (i = "utf8");
    for (var a = !1; ; )
      switch (i) {
        case "hex":
          return os(this, e, r, n);
        case "utf8":
        case "utf-8":
          return ls(this, e, r, n);
        case "ascii":
          return Vr(this, e, r, n);
        case "latin1":
        case "binary":
          return us(this, e, r, n);
        case "base64":
          return cs(this, e, r, n);
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
          return fs(this, e, r, n);
        default:
          if (a) throw new TypeError("Unknown encoding: " + i);
          (i = ("" + i).toLowerCase()), (a = !0);
      }
  }),
    (c.prototype.toJSON = function () {
      return {
        type: "Buffer",
        data: Array.prototype.slice.call(this._arr || this, 0),
      };
    });
  function ds(t, e, r) {
    return e === 0 && r === t.length ? Lr(t) : Lr(t.slice(e, r));
  }
  function Wr(t, e, r) {
    r = Math.min(t.length, r);
    for (var n = [], i = e; i < r; ) {
      var s = t[i],
        a = null,
        o = s > 239 ? 4 : s > 223 ? 3 : s > 191 ? 2 : 1;
      if (i + o <= r) {
        var l, u, f, h;
        switch (o) {
          case 1:
            s < 128 && (a = s);
            break;
          case 2:
            (l = t[i + 1]),
              (l & 192) === 128 &&
                ((h = ((s & 31) << 6) | (l & 63)), h > 127 && (a = h));
            break;
          case 3:
            (l = t[i + 1]),
              (u = t[i + 2]),
              (l & 192) === 128 &&
                (u & 192) === 128 &&
                ((h = ((s & 15) << 12) | ((l & 63) << 6) | (u & 63)),
                h > 2047 && (h < 55296 || h > 57343) && (a = h));
            break;
          case 4:
            (l = t[i + 1]),
              (u = t[i + 2]),
              (f = t[i + 3]),
              (l & 192) === 128 &&
                (u & 192) === 128 &&
                (f & 192) === 128 &&
                ((h =
                  ((s & 15) << 18) |
                  ((l & 63) << 12) |
                  ((u & 63) << 6) |
                  (f & 63)),
                h > 65535 && h < 1114112 && (a = h));
        }
      }
      a === null
        ? ((a = 65533), (o = 1))
        : a > 65535 &&
          ((a -= 65536),
          n.push(((a >>> 10) & 1023) | 55296),
          (a = 56320 | (a & 1023))),
        n.push(a),
        (i += o);
    }
    return hs(n);
  }
  var $r = 4096;
  function hs(t) {
    var e = t.length;
    if (e <= $r) return String.fromCharCode.apply(String, t);
    for (var r = "", n = 0; n < e; )
      r += String.fromCharCode.apply(String, t.slice(n, (n += $r)));
    return r;
  }
  function ps(t, e, r) {
    var n = "";
    r = Math.min(t.length, r);
    for (var i = e; i < r; ++i) n += String.fromCharCode(t[i] & 127);
    return n;
  }
  function ms(t, e, r) {
    var n = "";
    r = Math.min(t.length, r);
    for (var i = e; i < r; ++i) n += String.fromCharCode(t[i]);
    return n;
  }
  function gs(t, e, r) {
    var n = t.length;
    (!e || e < 0) && (e = 0), (!r || r < 0 || r > n) && (r = n);
    for (var i = "", s = e; s < r; ++s) i += bs(t[s]);
    return i;
  }
  function _s(t, e, r) {
    for (var n = t.slice(e, r), i = "", s = 0; s < n.length; s += 2)
      i += String.fromCharCode(n[s] + n[s + 1] * 256);
    return i;
  }
  c.prototype.slice = function (e, r) {
    var n = this.length;
    (e = ~~e),
      (r = r === void 0 ? n : ~~r),
      e < 0 ? ((e += n), e < 0 && (e = 0)) : e > n && (e = n),
      r < 0 ? ((r += n), r < 0 && (r = 0)) : r > n && (r = n),
      r < e && (r = e);
    var i;
    if (c.TYPED_ARRAY_SUPPORT)
      (i = this.subarray(e, r)), (i.__proto__ = c.prototype);
    else {
      var s = r - e;
      i = new c(s, void 0);
      for (var a = 0; a < s; ++a) i[a] = this[a + e];
    }
    return i;
  };
  function D(t, e, r) {
    if (t % 1 !== 0 || t < 0) throw new RangeError("offset is not uint");
    if (t + e > r)
      throw new RangeError("Trying to access beyond buffer length");
  }
  (c.prototype.readUIntLE = function (e, r, n) {
    (e = e | 0), (r = r | 0), n || D(e, r, this.length);
    for (var i = this[e], s = 1, a = 0; ++a < r && (s *= 256); )
      i += this[e + a] * s;
    return i;
  }),
    (c.prototype.readUIntBE = function (e, r, n) {
      (e = e | 0), (r = r | 0), n || D(e, r, this.length);
      for (var i = this[e + --r], s = 1; r > 0 && (s *= 256); )
        i += this[e + --r] * s;
      return i;
    }),
    (c.prototype.readUInt8 = function (e, r) {
      return r || D(e, 1, this.length), this[e];
    }),
    (c.prototype.readUInt16LE = function (e, r) {
      return r || D(e, 2, this.length), this[e] | (this[e + 1] << 8);
    }),
    (c.prototype.readUInt16BE = function (e, r) {
      return r || D(e, 2, this.length), (this[e] << 8) | this[e + 1];
    }),
    (c.prototype.readUInt32LE = function (e, r) {
      return (
        r || D(e, 4, this.length),
        (this[e] | (this[e + 1] << 8) | (this[e + 2] << 16)) +
          this[e + 3] * 16777216
      );
    }),
    (c.prototype.readUInt32BE = function (e, r) {
      return (
        r || D(e, 4, this.length),
        this[e] * 16777216 +
          ((this[e + 1] << 16) | (this[e + 2] << 8) | this[e + 3])
      );
    }),
    (c.prototype.readIntLE = function (e, r, n) {
      (e = e | 0), (r = r | 0), n || D(e, r, this.length);
      for (var i = this[e], s = 1, a = 0; ++a < r && (s *= 256); )
        i += this[e + a] * s;
      return (s *= 128), i >= s && (i -= Math.pow(2, 8 * r)), i;
    }),
    (c.prototype.readIntBE = function (e, r, n) {
      (e = e | 0), (r = r | 0), n || D(e, r, this.length);
      for (var i = r, s = 1, a = this[e + --i]; i > 0 && (s *= 256); )
        a += this[e + --i] * s;
      return (s *= 128), a >= s && (a -= Math.pow(2, 8 * r)), a;
    }),
    (c.prototype.readInt8 = function (e, r) {
      return (
        r || D(e, 1, this.length),
        this[e] & 128 ? (255 - this[e] + 1) * -1 : this[e]
      );
    }),
    (c.prototype.readInt16LE = function (e, r) {
      r || D(e, 2, this.length);
      var n = this[e] | (this[e + 1] << 8);
      return n & 32768 ? n | 4294901760 : n;
    }),
    (c.prototype.readInt16BE = function (e, r) {
      r || D(e, 2, this.length);
      var n = this[e + 1] | (this[e] << 8);
      return n & 32768 ? n | 4294901760 : n;
    }),
    (c.prototype.readInt32LE = function (e, r) {
      return (
        r || D(e, 4, this.length),
        this[e] | (this[e + 1] << 8) | (this[e + 2] << 16) | (this[e + 3] << 24)
      );
    }),
    (c.prototype.readInt32BE = function (e, r) {
      return (
        r || D(e, 4, this.length),
        (this[e] << 24) | (this[e + 1] << 16) | (this[e + 2] << 8) | this[e + 3]
      );
    }),
    (c.prototype.readFloatLE = function (e, r) {
      return r || D(e, 4, this.length), bt(this, e, !0, 23, 4);
    }),
    (c.prototype.readFloatBE = function (e, r) {
      return r || D(e, 4, this.length), bt(this, e, !1, 23, 4);
    }),
    (c.prototype.readDoubleLE = function (e, r) {
      return r || D(e, 8, this.length), bt(this, e, !0, 52, 8);
    }),
    (c.prototype.readDoubleBE = function (e, r) {
      return r || D(e, 8, this.length), bt(this, e, !1, 52, 8);
    });
  function W(t, e, r, n, i, s) {
    if (!se(t))
      throw new TypeError('"buffer" argument must be a Buffer instance');
    if (e > i || e < s)
      throw new RangeError('"value" argument is out of bounds');
    if (r + n > t.length) throw new RangeError("Index out of range");
  }
  (c.prototype.writeUIntLE = function (e, r, n, i) {
    if (((e = +e), (r = r | 0), (n = n | 0), !i)) {
      var s = Math.pow(2, 8 * n) - 1;
      W(this, e, r, n, s, 0);
    }
    var a = 1,
      o = 0;
    for (this[r] = e & 255; ++o < n && (a *= 256); )
      this[r + o] = (e / a) & 255;
    return r + n;
  }),
    (c.prototype.writeUIntBE = function (e, r, n, i) {
      if (((e = +e), (r = r | 0), (n = n | 0), !i)) {
        var s = Math.pow(2, 8 * n) - 1;
        W(this, e, r, n, s, 0);
      }
      var a = n - 1,
        o = 1;
      for (this[r + a] = e & 255; --a >= 0 && (o *= 256); )
        this[r + a] = (e / o) & 255;
      return r + n;
    }),
    (c.prototype.writeUInt8 = function (e, r, n) {
      return (
        (e = +e),
        (r = r | 0),
        n || W(this, e, r, 1, 255, 0),
        c.TYPED_ARRAY_SUPPORT || (e = Math.floor(e)),
        (this[r] = e & 255),
        r + 1
      );
    });
  function St(t, e, r, n) {
    e < 0 && (e = 65535 + e + 1);
    for (var i = 0, s = Math.min(t.length - r, 2); i < s; ++i)
      t[r + i] = (e & (255 << (8 * (n ? i : 1 - i)))) >>> ((n ? i : 1 - i) * 8);
  }
  (c.prototype.writeUInt16LE = function (e, r, n) {
    return (
      (e = +e),
      (r = r | 0),
      n || W(this, e, r, 2, 65535, 0),
      c.TYPED_ARRAY_SUPPORT
        ? ((this[r] = e & 255), (this[r + 1] = e >>> 8))
        : St(this, e, r, !0),
      r + 2
    );
  }),
    (c.prototype.writeUInt16BE = function (e, r, n) {
      return (
        (e = +e),
        (r = r | 0),
        n || W(this, e, r, 2, 65535, 0),
        c.TYPED_ARRAY_SUPPORT
          ? ((this[r] = e >>> 8), (this[r + 1] = e & 255))
          : St(this, e, r, !1),
        r + 2
      );
    });
  function Et(t, e, r, n) {
    e < 0 && (e = 4294967295 + e + 1);
    for (var i = 0, s = Math.min(t.length - r, 4); i < s; ++i)
      t[r + i] = (e >>> ((n ? i : 3 - i) * 8)) & 255;
  }
  (c.prototype.writeUInt32LE = function (e, r, n) {
    return (
      (e = +e),
      (r = r | 0),
      n || W(this, e, r, 4, 4294967295, 0),
      c.TYPED_ARRAY_SUPPORT
        ? ((this[r + 3] = e >>> 24),
          (this[r + 2] = e >>> 16),
          (this[r + 1] = e >>> 8),
          (this[r] = e & 255))
        : Et(this, e, r, !0),
      r + 4
    );
  }),
    (c.prototype.writeUInt32BE = function (e, r, n) {
      return (
        (e = +e),
        (r = r | 0),
        n || W(this, e, r, 4, 4294967295, 0),
        c.TYPED_ARRAY_SUPPORT
          ? ((this[r] = e >>> 24),
            (this[r + 1] = e >>> 16),
            (this[r + 2] = e >>> 8),
            (this[r + 3] = e & 255))
          : Et(this, e, r, !1),
        r + 4
      );
    }),
    (c.prototype.writeIntLE = function (e, r, n, i) {
      if (((e = +e), (r = r | 0), !i)) {
        var s = Math.pow(2, 8 * n - 1);
        W(this, e, r, n, s - 1, -s);
      }
      var a = 0,
        o = 1,
        l = 0;
      for (this[r] = e & 255; ++a < n && (o *= 256); )
        e < 0 && l === 0 && this[r + a - 1] !== 0 && (l = 1),
          (this[r + a] = (((e / o) >> 0) - l) & 255);
      return r + n;
    }),
    (c.prototype.writeIntBE = function (e, r, n, i) {
      if (((e = +e), (r = r | 0), !i)) {
        var s = Math.pow(2, 8 * n - 1);
        W(this, e, r, n, s - 1, -s);
      }
      var a = n - 1,
        o = 1,
        l = 0;
      for (this[r + a] = e & 255; --a >= 0 && (o *= 256); )
        e < 0 && l === 0 && this[r + a + 1] !== 0 && (l = 1),
          (this[r + a] = (((e / o) >> 0) - l) & 255);
      return r + n;
    }),
    (c.prototype.writeInt8 = function (e, r, n) {
      return (
        (e = +e),
        (r = r | 0),
        n || W(this, e, r, 1, 127, -128),
        c.TYPED_ARRAY_SUPPORT || (e = Math.floor(e)),
        e < 0 && (e = 255 + e + 1),
        (this[r] = e & 255),
        r + 1
      );
    }),
    (c.prototype.writeInt16LE = function (e, r, n) {
      return (
        (e = +e),
        (r = r | 0),
        n || W(this, e, r, 2, 32767, -32768),
        c.TYPED_ARRAY_SUPPORT
          ? ((this[r] = e & 255), (this[r + 1] = e >>> 8))
          : St(this, e, r, !0),
        r + 2
      );
    }),
    (c.prototype.writeInt16BE = function (e, r, n) {
      return (
        (e = +e),
        (r = r | 0),
        n || W(this, e, r, 2, 32767, -32768),
        c.TYPED_ARRAY_SUPPORT
          ? ((this[r] = e >>> 8), (this[r + 1] = e & 255))
          : St(this, e, r, !1),
        r + 2
      );
    }),
    (c.prototype.writeInt32LE = function (e, r, n) {
      return (
        (e = +e),
        (r = r | 0),
        n || W(this, e, r, 4, 2147483647, -2147483648),
        c.TYPED_ARRAY_SUPPORT
          ? ((this[r] = e & 255),
            (this[r + 1] = e >>> 8),
            (this[r + 2] = e >>> 16),
            (this[r + 3] = e >>> 24))
          : Et(this, e, r, !0),
        r + 4
      );
    }),
    (c.prototype.writeInt32BE = function (e, r, n) {
      return (
        (e = +e),
        (r = r | 0),
        n || W(this, e, r, 4, 2147483647, -2147483648),
        e < 0 && (e = 4294967295 + e + 1),
        c.TYPED_ARRAY_SUPPORT
          ? ((this[r] = e >>> 24),
            (this[r + 1] = e >>> 16),
            (this[r + 2] = e >>> 8),
            (this[r + 3] = e & 255))
          : Et(this, e, r, !1),
        r + 4
      );
    });
  function zr(t, e, r, n, i, s) {
    if (r + n > t.length) throw new RangeError("Index out of range");
    if (r < 0) throw new RangeError("Index out of range");
  }
  function Yr(t, e, r, n, i) {
    return i || zr(t, e, r, 4), Mr(t, e, r, n, 23, 4), r + 4;
  }
  (c.prototype.writeFloatLE = function (e, r, n) {
    return Yr(this, e, r, !0, n);
  }),
    (c.prototype.writeFloatBE = function (e, r, n) {
      return Yr(this, e, r, !1, n);
    });
  function Fr(t, e, r, n, i) {
    return i || zr(t, e, r, 8), Mr(t, e, r, n, 52, 8), r + 8;
  }
  (c.prototype.writeDoubleLE = function (e, r, n) {
    return Fr(this, e, r, !0, n);
  }),
    (c.prototype.writeDoubleBE = function (e, r, n) {
      return Fr(this, e, r, !1, n);
    }),
    (c.prototype.copy = function (e, r, n, i) {
      if (
        (n || (n = 0),
        !i && i !== 0 && (i = this.length),
        r >= e.length && (r = e.length),
        r || (r = 0),
        i > 0 && i < n && (i = n),
        i === n || e.length === 0 || this.length === 0)
      )
        return 0;
      if (r < 0) throw new RangeError("targetStart out of bounds");
      if (n < 0 || n >= this.length)
        throw new RangeError("sourceStart out of bounds");
      if (i < 0) throw new RangeError("sourceEnd out of bounds");
      i > this.length && (i = this.length),
        e.length - r < i - n && (i = e.length - r + n);
      var s = i - n,
        a;
      if (this === e && n < r && r < i)
        for (a = s - 1; a >= 0; --a) e[a + r] = this[a + n];
      else if (s < 1e3 || !c.TYPED_ARRAY_SUPPORT)
        for (a = 0; a < s; ++a) e[a + r] = this[a + n];
      else Uint8Array.prototype.set.call(e, this.subarray(n, n + s), r);
      return s;
    }),
    (c.prototype.fill = function (e, r, n, i) {
      if (typeof e == "string") {
        if (
          (typeof r == "string"
            ? ((i = r), (r = 0), (n = this.length))
            : typeof n == "string" && ((i = n), (n = this.length)),
          e.length === 1)
        ) {
          var s = e.charCodeAt(0);
          s < 256 && (e = s);
        }
        if (i !== void 0 && typeof i != "string")
          throw new TypeError("encoding must be a string");
        if (typeof i == "string" && !c.isEncoding(i))
          throw new TypeError("Unknown encoding: " + i);
      } else typeof e == "number" && (e = e & 255);
      if (r < 0 || this.length < r || this.length < n)
        throw new RangeError("Out of range index");
      if (n <= r) return this;
      (r = r >>> 0), (n = n === void 0 ? this.length : n >>> 0), e || (e = 0);
      var a;
      if (typeof e == "number") for (a = r; a < n; ++a) this[a] = e;
      else {
        var o = se(e) ? e : kt(new c(e, i).toString()),
          l = o.length;
        for (a = 0; a < n - r; ++a) this[a + r] = o[a % l];
      }
      return this;
    });
  var ys = /[^+\/0-9A-Za-z-_]/g;
  function vs(t) {
    if (((t = ws(t).replace(ys, "")), t.length < 2)) return "";
    for (; t.length % 4 !== 0; ) t = t + "=";
    return t;
  }
  function ws(t) {
    return t.trim ? t.trim() : t.replace(/^\s+|\s+$/g, "");
  }
  function bs(t) {
    return t < 16 ? "0" + t.toString(16) : t.toString(16);
  }
  function kt(t, e) {
    e = e || 1 / 0;
    for (var r, n = t.length, i = null, s = [], a = 0; a < n; ++a) {
      if (((r = t.charCodeAt(a)), r > 55295 && r < 57344)) {
        if (!i) {
          if (r > 56319) {
            (e -= 3) > -1 && s.push(239, 191, 189);
            continue;
          } else if (a + 1 === n) {
            (e -= 3) > -1 && s.push(239, 191, 189);
            continue;
          }
          i = r;
          continue;
        }
        if (r < 56320) {
          (e -= 3) > -1 && s.push(239, 191, 189), (i = r);
          continue;
        }
        r = (((i - 55296) << 10) | (r - 56320)) + 65536;
      } else i && (e -= 3) > -1 && s.push(239, 191, 189);
      if (((i = null), r < 128)) {
        if ((e -= 1) < 0) break;
        s.push(r);
      } else if (r < 2048) {
        if ((e -= 2) < 0) break;
        s.push((r >> 6) | 192, (r & 63) | 128);
      } else if (r < 65536) {
        if ((e -= 3) < 0) break;
        s.push((r >> 12) | 224, ((r >> 6) & 63) | 128, (r & 63) | 128);
      } else if (r < 1114112) {
        if ((e -= 4) < 0) break;
        s.push(
          (r >> 18) | 240,
          ((r >> 12) & 63) | 128,
          ((r >> 6) & 63) | 128,
          (r & 63) | 128,
        );
      } else throw new Error("Invalid code point");
    }
    return s;
  }
  function xs(t) {
    for (var e = [], r = 0; r < t.length; ++r) e.push(t.charCodeAt(r) & 255);
    return e;
  }
  function Ss(t, e) {
    for (var r, n, i, s = [], a = 0; a < t.length && !((e -= 2) < 0); ++a)
      (r = t.charCodeAt(a)), (n = r >> 8), (i = r % 256), s.push(i), s.push(n);
    return s;
  }
  function Jr(t) {
    return Qi(vs(t));
  }
  function Rt(t, e, r, n) {
    for (var i = 0; i < n && !(i + r >= e.length || i >= t.length); ++i)
      e[i + r] = t[i];
    return i;
  }
  function Es(t) {
    return t !== t;
  }
  function $(t) {
    return t != null && (!!t._isBuffer || qr(t) || ks(t));
  }
  function qr(t) {
    return (
      !!t.constructor &&
      typeof t.constructor.isBuffer == "function" &&
      t.constructor.isBuffer(t)
    );
  }
  function ks(t) {
    return (
      typeof t.readFloatLE == "function" &&
      typeof t.slice == "function" &&
      qr(t.slice(0, 0))
    );
  }
  var Rs;
  function _e() {}
  _e.prototype = Object.create(null);
  function k() {
    k.init.call(this);
  }
  (k.EventEmitter = k),
    (k.usingDomains = !1),
    (k.prototype.domain = void 0),
    (k.prototype._events = void 0),
    (k.prototype._maxListeners = void 0),
    (k.defaultMaxListeners = 10),
    (k.init = function () {
      (this.domain = null),
        k.usingDomains && Rs.active,
        (!this._events ||
          this._events === Object.getPrototypeOf(this)._events) &&
          ((this._events = new _e()), (this._eventsCount = 0)),
        (this._maxListeners = this._maxListeners || void 0);
    }),
    (k.prototype.setMaxListeners = function (e) {
      if (typeof e != "number" || e < 0 || isNaN(e))
        throw new TypeError('"n" argument must be a positive number');
      return (this._maxListeners = e), this;
    });
  function Gr(t) {
    return t._maxListeners === void 0 ? k.defaultMaxListeners : t._maxListeners;
  }
  k.prototype.getMaxListeners = function () {
    return Gr(this);
  };
  function Is(t, e, r) {
    if (e) t.call(r);
    else for (var n = t.length, i = it(t, n), s = 0; s < n; ++s) i[s].call(r);
  }
  function Ts(t, e, r, n) {
    if (e) t.call(r, n);
    else
      for (var i = t.length, s = it(t, i), a = 0; a < i; ++a) s[a].call(r, n);
  }
  function Ns(t, e, r, n, i) {
    if (e) t.call(r, n, i);
    else
      for (var s = t.length, a = it(t, s), o = 0; o < s; ++o)
        a[o].call(r, n, i);
  }
  function Cs(t, e, r, n, i, s) {
    if (e) t.call(r, n, i, s);
    else
      for (var a = t.length, o = it(t, a), l = 0; l < a; ++l)
        o[l].call(r, n, i, s);
  }
  function Os(t, e, r, n) {
    if (e) t.apply(r, n);
    else
      for (var i = t.length, s = it(t, i), a = 0; a < i; ++a) s[a].apply(r, n);
  }
  k.prototype.emit = function (e) {
    var r,
      n,
      i,
      s,
      a,
      o,
      l,
      u = e === "error";
    if (((o = this._events), o)) u = u && o.error == null;
    else if (!u) return !1;
    if (((l = this.domain), u)) {
      if (((r = arguments[1]), l))
        r || (r = new Error('Uncaught, unspecified "error" event')),
          (r.domainEmitter = this),
          (r.domain = l),
          (r.domainThrown = !1),
          l.emit("error", r);
      else {
        if (r instanceof Error) throw r;
        var f = new Error('Uncaught, unspecified "error" event. (' + r + ")");
        throw ((f.context = r), f);
      }
      return !1;
    }
    if (((n = o[e]), !n)) return !1;
    var h = typeof n == "function";
    switch (((i = arguments.length), i)) {
      case 1:
        Is(n, h, this);
        break;
      case 2:
        Ts(n, h, this, arguments[1]);
        break;
      case 3:
        Ns(n, h, this, arguments[1], arguments[2]);
        break;
      case 4:
        Cs(n, h, this, arguments[1], arguments[2], arguments[3]);
        break;
      default:
        for (s = new Array(i - 1), a = 1; a < i; a++) s[a - 1] = arguments[a];
        Os(n, h, this, s);
    }
    return !0;
  };
  function Hr(t, e, r, n) {
    var i, s, a;
    if (typeof r != "function")
      throw new TypeError('"listener" argument must be a function');
    if (
      ((s = t._events),
      s
        ? (s.newListener &&
            (t.emit("newListener", e, r.listener ? r.listener : r),
            (s = t._events)),
          (a = s[e]))
        : ((s = t._events = new _e()), (t._eventsCount = 0)),
      !a)
    )
      (a = s[e] = r), ++t._eventsCount;
    else if (
      (typeof a == "function"
        ? (a = s[e] = n ? [r, a] : [a, r])
        : n
          ? a.unshift(r)
          : a.push(r),
      !a.warned && ((i = Gr(t)), i && i > 0 && a.length > i))
    ) {
      a.warned = !0;
      var o = new Error(
        "Possible EventEmitter memory leak detected. " +
          a.length +
          " " +
          e +
          " listeners added. Use emitter.setMaxListeners() to increase limit",
      );
      (o.name = "MaxListenersExceededWarning"),
        (o.emitter = t),
        (o.type = e),
        (o.count = a.length),
        As(o);
    }
    return t;
  }
  function As(t) {
    typeof console.warn == "function" ? console.warn(t) : console.log(t);
  }
  (k.prototype.addListener = function (e, r) {
    return Hr(this, e, r, !1);
  }),
    (k.prototype.on = k.prototype.addListener),
    (k.prototype.prependListener = function (e, r) {
      return Hr(this, e, r, !0);
    });
  function Qr(t, e, r) {
    var n = !1;
    function i() {
      t.removeListener(e, i), n || ((n = !0), r.apply(t, arguments));
    }
    return (i.listener = r), i;
  }
  (k.prototype.once = function (e, r) {
    if (typeof r != "function")
      throw new TypeError('"listener" argument must be a function');
    return this.on(e, Qr(this, e, r)), this;
  }),
    (k.prototype.prependOnceListener = function (e, r) {
      if (typeof r != "function")
        throw new TypeError('"listener" argument must be a function');
      return this.prependListener(e, Qr(this, e, r)), this;
    }),
    (k.prototype.removeListener = function (e, r) {
      var n, i, s, a, o;
      if (typeof r != "function")
        throw new TypeError('"listener" argument must be a function');
      if (((i = this._events), !i)) return this;
      if (((n = i[e]), !n)) return this;
      if (n === r || (n.listener && n.listener === r))
        --this._eventsCount === 0
          ? (this._events = new _e())
          : (delete i[e],
            i.removeListener &&
              this.emit("removeListener", e, n.listener || r));
      else if (typeof n != "function") {
        for (s = -1, a = n.length; a-- > 0; )
          if (n[a] === r || (n[a].listener && n[a].listener === r)) {
            (o = n[a].listener), (s = a);
            break;
          }
        if (s < 0) return this;
        if (n.length === 1) {
          if (((n[0] = void 0), --this._eventsCount === 0))
            return (this._events = new _e()), this;
          delete i[e];
        } else Ls(n, s);
        i.removeListener && this.emit("removeListener", e, o || r);
      }
      return this;
    }),
    (k.prototype.removeAllListeners = function (e) {
      var r, n;
      if (((n = this._events), !n)) return this;
      if (!n.removeListener)
        return (
          arguments.length === 0
            ? ((this._events = new _e()), (this._eventsCount = 0))
            : n[e] &&
              (--this._eventsCount === 0
                ? (this._events = new _e())
                : delete n[e]),
          this
        );
      if (arguments.length === 0) {
        for (var i = Object.keys(n), s = 0, a; s < i.length; ++s)
          (a = i[s]), a !== "removeListener" && this.removeAllListeners(a);
        return (
          this.removeAllListeners("removeListener"),
          (this._events = new _e()),
          (this._eventsCount = 0),
          this
        );
      }
      if (((r = n[e]), typeof r == "function")) this.removeListener(e, r);
      else if (r)
        do this.removeListener(e, r[r.length - 1]);
        while (r[0]);
      return this;
    }),
    (k.prototype.listeners = function (e) {
      var r,
        n,
        i = this._events;
      return (
        i
          ? ((r = i[e]),
            r
              ? typeof r == "function"
                ? (n = [r.listener || r])
                : (n = Ms(r))
              : (n = []))
          : (n = []),
        n
      );
    }),
    (k.listenerCount = function (t, e) {
      return typeof t.listenerCount == "function"
        ? t.listenerCount(e)
        : Xr.call(t, e);
    }),
    (k.prototype.listenerCount = Xr);
  function Xr(t) {
    var e = this._events;
    if (e) {
      var r = e[t];
      if (typeof r == "function") return 1;
      if (r) return r.length;
    }
    return 0;
  }
  k.prototype.eventNames = function () {
    return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
  };
  function Ls(t, e) {
    for (var r = e, n = r + 1, i = t.length; n < i; r += 1, n += 1) t[r] = t[n];
    t.pop();
  }
  function it(t, e) {
    for (var r = new Array(e); e--; ) r[e] = t[e];
    return r;
  }
  function Ms(t) {
    for (var e = new Array(t.length), r = 0; r < e.length; ++r)
      e[r] = t[r].listener || t[r];
    return e;
  }
  function Kr() {
    throw new Error("setTimeout has not been defined");
  }
  function en() {
    throw new Error("clearTimeout has not been defined");
  }
  var ye = Kr,
    ve = en;
  typeof Pe.setTimeout == "function" && (ye = setTimeout),
    typeof Pe.clearTimeout == "function" && (ve = clearTimeout);
  function tn(t) {
    if (ye === setTimeout) return setTimeout(t, 0);
    if ((ye === Kr || !ye) && setTimeout)
      return (ye = setTimeout), setTimeout(t, 0);
    try {
      return ye(t, 0);
    } catch {
      try {
        return ye.call(null, t, 0);
      } catch {
        return ye.call(this, t, 0);
      }
    }
  }
  function js(t) {
    if (ve === clearTimeout) return clearTimeout(t);
    if ((ve === en || !ve) && clearTimeout)
      return (ve = clearTimeout), clearTimeout(t);
    try {
      return ve(t);
    } catch {
      try {
        return ve.call(null, t);
      } catch {
        return ve.call(this, t);
      }
    }
  }
  var ce = [],
    Ve = !1,
    Ne,
    It = -1;
  function Ds() {
    !Ve ||
      !Ne ||
      ((Ve = !1),
      Ne.length ? (ce = Ne.concat(ce)) : (It = -1),
      ce.length && rn());
  }
  function rn() {
    if (!Ve) {
      var t = tn(Ds);
      Ve = !0;
      for (var e = ce.length; e; ) {
        for (Ne = ce, ce = []; ++It < e; ) Ne && Ne[It].run();
        (It = -1), (e = ce.length);
      }
      (Ne = null), (Ve = !1), js(t);
    }
  }
  function J(t) {
    var e = new Array(arguments.length - 1);
    if (arguments.length > 1)
      for (var r = 1; r < arguments.length; r++) e[r - 1] = arguments[r];
    ce.push(new nn(t, e)), ce.length === 1 && !Ve && tn(rn);
  }
  function nn(t, e) {
    (this.fun = t), (this.array = e);
  }
  nn.prototype.run = function () {
    this.fun.apply(null, this.array);
  };
  var Zs = {},
    st = Pe.performance || {};
  st.now || st.mozNow || st.msNow || st.oNow || st.webkitNow;
  var Tt = { env: Zs },
    qt;
  typeof Object.create == "function"
    ? (qt = function (e, r) {
        (e.super_ = r),
          (e.prototype = Object.create(r.prototype, {
            constructor: {
              value: e,
              enumerable: !1,
              writable: !0,
              configurable: !0,
            },
          }));
      })
    : (qt = function (e, r) {
        e.super_ = r;
        var n = function () {};
        (n.prototype = r.prototype),
          (e.prototype = new n()),
          (e.prototype.constructor = e);
      });
  var We = qt,
    Us = /%[sdj%]/g;
  function Bs(t) {
    if (!Kt(t)) {
      for (var e = [], r = 0; r < arguments.length; r++)
        e.push(we(arguments[r]));
      return e.join(" ");
    }
    for (
      var r = 1,
        n = arguments,
        i = n.length,
        s = String(t).replace(Us, function (o) {
          if (o === "%%") return "%";
          if (r >= i) return o;
          switch (o) {
            case "%s":
              return String(n[r++]);
            case "%d":
              return Number(n[r++]);
            case "%j":
              try {
                return JSON.stringify(n[r++]);
              } catch {
                return "[Circular]";
              }
            default:
              return o;
          }
        }),
        a = n[r];
      r < i;
      a = n[++r]
    )
      Xt(a) || !at(a) ? (s += " " + a) : (s += " " + we(a));
    return s;
  }
  function sn(t, e) {
    if (be(Pe.process))
      return function () {
        return sn(t, e).apply(this, arguments);
      };
    if (Tt.noDeprecation === !0) return t;
    var r = !1;
    function n() {
      if (!r) {
        if (Tt.throwDeprecation) throw new Error(e);
        Tt.traceDeprecation ? console.trace(e) : console.error(e), (r = !0);
      }
      return t.apply(this, arguments);
    }
    return n;
  }
  var Nt = {},
    Gt;
  function Ps(t) {
    if (
      (be(Gt) && (Gt = Tt.env.NODE_DEBUG || ""), (t = t.toUpperCase()), !Nt[t])
    )
      if (new RegExp("\\b" + t + "\\b", "i").test(Gt)) {
        var e = 0;
        Nt[t] = function () {
          var r = Bs.apply(null, arguments);
          console.error("%s %d: %s", t, e, r);
        };
      } else Nt[t] = function () {};
    return Nt[t];
  }
  function we(t, e) {
    var r = { seen: [], stylize: Ws };
    return (
      arguments.length >= 3 && (r.depth = arguments[2]),
      arguments.length >= 4 && (r.colors = arguments[3]),
      an(e) ? (r.showHidden = e) : e && Gs(r, e),
      be(r.showHidden) && (r.showHidden = !1),
      be(r.depth) && (r.depth = 2),
      be(r.colors) && (r.colors = !1),
      be(r.customInspect) && (r.customInspect = !0),
      r.colors && (r.stylize = Vs),
      Ct(r, t, r.depth)
    );
  }
  (we.colors = {
    bold: [1, 22],
    italic: [3, 23],
    underline: [4, 24],
    inverse: [7, 27],
    white: [37, 39],
    grey: [90, 39],
    black: [30, 39],
    blue: [34, 39],
    cyan: [36, 39],
    green: [32, 39],
    magenta: [35, 39],
    red: [31, 39],
    yellow: [33, 39],
  }),
    (we.styles = {
      special: "cyan",
      number: "yellow",
      boolean: "yellow",
      undefined: "grey",
      null: "bold",
      string: "green",
      date: "magenta",
      regexp: "red",
    });
  function Vs(t, e) {
    var r = we.styles[e];
    return r
      ? "\x1B[" + we.colors[r][0] + "m" + t + "\x1B[" + we.colors[r][1] + "m"
      : t;
  }
  function Ws(t, e) {
    return t;
  }
  function $s(t) {
    var e = {};
    return (
      t.forEach(function (r, n) {
        e[r] = !0;
      }),
      e
    );
  }
  function Ct(t, e, r) {
    if (
      t.customInspect &&
      e &&
      rr(e.inspect) &&
      e.inspect !== we &&
      !(e.constructor && e.constructor.prototype === e)
    ) {
      var n = e.inspect(r, t);
      return Kt(n) || (n = Ct(t, n, r)), n;
    }
    var i = zs(t, e);
    if (i) return i;
    var s = Object.keys(e),
      a = $s(s);
    if (
      (t.showHidden && (s = Object.getOwnPropertyNames(e)),
      tr(e) && (s.indexOf("message") >= 0 || s.indexOf("description") >= 0))
    )
      return Ht(e);
    if (s.length === 0) {
      if (rr(e)) {
        var o = e.name ? ": " + e.name : "";
        return t.stylize("[Function" + o + "]", "special");
      }
      if (er(e)) return t.stylize(RegExp.prototype.toString.call(e), "regexp");
      if (on(e)) return t.stylize(Date.prototype.toString.call(e), "date");
      if (tr(e)) return Ht(e);
    }
    var l = "",
      u = !1,
      f = ["{", "}"];
    if ((Js(e) && ((u = !0), (f = ["[", "]"])), rr(e))) {
      var h = e.name ? ": " + e.name : "";
      l = " [Function" + h + "]";
    }
    if (
      (er(e) && (l = " " + RegExp.prototype.toString.call(e)),
      on(e) && (l = " " + Date.prototype.toUTCString.call(e)),
      tr(e) && (l = " " + Ht(e)),
      s.length === 0 && (!u || e.length == 0))
    )
      return f[0] + l + f[1];
    if (r < 0)
      return er(e)
        ? t.stylize(RegExp.prototype.toString.call(e), "regexp")
        : t.stylize("[Object]", "special");
    t.seen.push(e);
    var v;
    return (
      u
        ? (v = Ys(t, e, r, a, s))
        : (v = s.map(function (S) {
            return Qt(t, e, r, a, S, u);
          })),
      t.seen.pop(),
      Fs(v, l, f)
    );
  }
  function zs(t, e) {
    if (be(e)) return t.stylize("undefined", "undefined");
    if (Kt(e)) {
      var r =
        "'" +
        JSON.stringify(e)
          .replace(/^"|"$/g, "")
          .replace(/'/g, "\\'")
          .replace(/\\"/g, '"') +
        "'";
      return t.stylize(r, "string");
    }
    if (qs(e)) return t.stylize("" + e, "number");
    if (an(e)) return t.stylize("" + e, "boolean");
    if (Xt(e)) return t.stylize("null", "null");
  }
  function Ht(t) {
    return "[" + Error.prototype.toString.call(t) + "]";
  }
  function Ys(t, e, r, n, i) {
    for (var s = [], a = 0, o = e.length; a < o; ++a)
      ln(e, String(a)) ? s.push(Qt(t, e, r, n, String(a), !0)) : s.push("");
    return (
      i.forEach(function (l) {
        l.match(/^\d+$/) || s.push(Qt(t, e, r, n, l, !0));
      }),
      s
    );
  }
  function Qt(t, e, r, n, i, s) {
    var a, o, l;
    if (
      ((l = Object.getOwnPropertyDescriptor(e, i) || { value: e[i] }),
      l.get
        ? l.set
          ? (o = t.stylize("[Getter/Setter]", "special"))
          : (o = t.stylize("[Getter]", "special"))
        : l.set && (o = t.stylize("[Setter]", "special")),
      ln(n, i) || (a = "[" + i + "]"),
      o ||
        (t.seen.indexOf(l.value) < 0
          ? (Xt(r) ? (o = Ct(t, l.value, null)) : (o = Ct(t, l.value, r - 1)),
            o.indexOf(`
`) > -1 &&
              (s
                ? (o = o
                    .split(
                      `
`,
                    )
                    .map(function (u) {
                      return "  " + u;
                    })
                    .join(
                      `
`,
                    )
                    .substr(2))
                : (o =
                    `
` +
                    o
                      .split(
                        `
`,
                      )
                      .map(function (u) {
                        return "   " + u;
                      }).join(`
`))))
          : (o = t.stylize("[Circular]", "special"))),
      be(a))
    ) {
      if (s && i.match(/^\d+$/)) return o;
      (a = JSON.stringify("" + i)),
        a.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)
          ? ((a = a.substr(1, a.length - 2)), (a = t.stylize(a, "name")))
          : ((a = a
              .replace(/'/g, "\\'")
              .replace(/\\"/g, '"')
              .replace(/(^"|"$)/g, "'")),
            (a = t.stylize(a, "string")));
    }
    return a + ": " + o;
  }
  function Fs(t, e, r) {
    var n = t.reduce(function (i, s) {
      return (
        s.indexOf(`
`) >= 0,
        i + s.replace(/\u001b\[\d\d?m/g, "").length + 1
      );
    }, 0);
    return n > 60
      ? r[0] +
          (e === ""
            ? ""
            : e +
              `
 `) +
          " " +
          t.join(`,
  `) +
          " " +
          r[1]
      : r[0] + e + " " + t.join(", ") + " " + r[1];
  }
  function Js(t) {
    return Array.isArray(t);
  }
  function an(t) {
    return typeof t == "boolean";
  }
  function Xt(t) {
    return t === null;
  }
  function qs(t) {
    return typeof t == "number";
  }
  function Kt(t) {
    return typeof t == "string";
  }
  function be(t) {
    return t === void 0;
  }
  function er(t) {
    return at(t) && nr(t) === "[object RegExp]";
  }
  function at(t) {
    return typeof t == "object" && t !== null;
  }
  function on(t) {
    return at(t) && nr(t) === "[object Date]";
  }
  function tr(t) {
    return at(t) && (nr(t) === "[object Error]" || t instanceof Error);
  }
  function rr(t) {
    return typeof t == "function";
  }
  function nr(t) {
    return Object.prototype.toString.call(t);
  }
  function Gs(t, e) {
    if (!e || !at(e)) return t;
    for (var r = Object.keys(e), n = r.length; n--; ) t[r[n]] = e[r[n]];
    return t;
  }
  function ln(t, e) {
    return Object.prototype.hasOwnProperty.call(t, e);
  }
  function Ce() {
    (this.head = null), (this.tail = null), (this.length = 0);
  }
  (Ce.prototype.push = function (t) {
    var e = { data: t, next: null };
    this.length > 0 ? (this.tail.next = e) : (this.head = e),
      (this.tail = e),
      ++this.length;
  }),
    (Ce.prototype.unshift = function (t) {
      var e = { data: t, next: this.head };
      this.length === 0 && (this.tail = e), (this.head = e), ++this.length;
    }),
    (Ce.prototype.shift = function () {
      if (this.length !== 0) {
        var t = this.head.data;
        return (
          this.length === 1
            ? (this.head = this.tail = null)
            : (this.head = this.head.next),
          --this.length,
          t
        );
      }
    }),
    (Ce.prototype.clear = function () {
      (this.head = this.tail = null), (this.length = 0);
    }),
    (Ce.prototype.join = function (t) {
      if (this.length === 0) return "";
      for (var e = this.head, r = "" + e.data; (e = e.next); ) r += t + e.data;
      return r;
    }),
    (Ce.prototype.concat = function (t) {
      if (this.length === 0) return c.alloc(0);
      if (this.length === 1) return this.head.data;
      for (var e = c.allocUnsafe(t >>> 0), r = this.head, n = 0; r; )
        r.data.copy(e, n), (n += r.data.length), (r = r.next);
      return e;
    });
  var Hs =
    c.isEncoding ||
    function (t) {
      switch (t && t.toLowerCase()) {
        case "hex":
        case "utf8":
        case "utf-8":
        case "ascii":
        case "binary":
        case "base64":
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
        case "raw":
          return !0;
        default:
          return !1;
      }
    };
  function Qs(t) {
    if (t && !Hs(t)) throw new Error("Unknown encoding: " + t);
  }
  function ot(t) {
    switch (
      ((this.encoding = (t || "utf8").toLowerCase().replace(/[-_]/, "")),
      Qs(t),
      this.encoding)
    ) {
      case "utf8":
        this.surrogateSize = 3;
        break;
      case "ucs2":
      case "utf16le":
        (this.surrogateSize = 2), (this.detectIncompleteChar = Ks);
        break;
      case "base64":
        (this.surrogateSize = 3), (this.detectIncompleteChar = ea);
        break;
      default:
        this.write = Xs;
        return;
    }
    (this.charBuffer = new c(6)),
      (this.charReceived = 0),
      (this.charLength = 0);
  }
  (ot.prototype.write = function (t) {
    for (var e = ""; this.charLength; ) {
      var r =
        t.length >= this.charLength - this.charReceived
          ? this.charLength - this.charReceived
          : t.length;
      if (
        (t.copy(this.charBuffer, this.charReceived, 0, r),
        (this.charReceived += r),
        this.charReceived < this.charLength)
      )
        return "";
      (t = t.slice(r, t.length)),
        (e = this.charBuffer.slice(0, this.charLength).toString(this.encoding));
      var i = e.charCodeAt(e.length - 1);
      if (i >= 55296 && i <= 56319) {
        (this.charLength += this.surrogateSize), (e = "");
        continue;
      }
      if (((this.charReceived = this.charLength = 0), t.length === 0)) return e;
      break;
    }
    this.detectIncompleteChar(t);
    var n = t.length;
    this.charLength &&
      (t.copy(this.charBuffer, 0, t.length - this.charReceived, n),
      (n -= this.charReceived)),
      (e += t.toString(this.encoding, 0, n));
    var n = e.length - 1,
      i = e.charCodeAt(n);
    if (i >= 55296 && i <= 56319) {
      var s = this.surrogateSize;
      return (
        (this.charLength += s),
        (this.charReceived += s),
        this.charBuffer.copy(this.charBuffer, s, 0, s),
        t.copy(this.charBuffer, 0, 0, s),
        e.substring(0, n)
      );
    }
    return e;
  }),
    (ot.prototype.detectIncompleteChar = function (t) {
      for (var e = t.length >= 3 ? 3 : t.length; e > 0; e--) {
        var r = t[t.length - e];
        if (e == 1 && r >> 5 == 6) {
          this.charLength = 2;
          break;
        }
        if (e <= 2 && r >> 4 == 14) {
          this.charLength = 3;
          break;
        }
        if (e <= 3 && r >> 3 == 30) {
          this.charLength = 4;
          break;
        }
      }
      this.charReceived = e;
    }),
    (ot.prototype.end = function (t) {
      var e = "";
      if ((t && t.length && (e = this.write(t)), this.charReceived)) {
        var r = this.charReceived,
          n = this.charBuffer,
          i = this.encoding;
        e += n.slice(0, r).toString(i);
      }
      return e;
    });
  function Xs(t) {
    return t.toString(this.encoding);
  }
  function Ks(t) {
    (this.charReceived = t.length % 2),
      (this.charLength = this.charReceived ? 2 : 0);
  }
  function ea(t) {
    (this.charReceived = t.length % 3),
      (this.charLength = this.charReceived ? 3 : 0);
  }
  L.ReadableState = un;
  var I = Ps("stream");
  We(L, k);
  function ta(t, e, r) {
    if (typeof t.prependListener == "function") return t.prependListener(e, r);
    !t._events || !t._events[e]
      ? t.on(e, r)
      : Array.isArray(t._events[e])
        ? t._events[e].unshift(r)
        : (t._events[e] = [r, t._events[e]]);
  }
  function ra(t, e) {
    return t.listeners(e).length;
  }
  function un(t, e) {
    (t = t || {}),
      (this.objectMode = !!t.objectMode),
      e instanceof q &&
        (this.objectMode = this.objectMode || !!t.readableObjectMode);
    var r = t.highWaterMark,
      n = this.objectMode ? 16 : 16 * 1024;
    (this.highWaterMark = r || r === 0 ? r : n),
      (this.highWaterMark = ~~this.highWaterMark),
      (this.buffer = new Ce()),
      (this.length = 0),
      (this.pipes = null),
      (this.pipesCount = 0),
      (this.flowing = null),
      (this.ended = !1),
      (this.endEmitted = !1),
      (this.reading = !1),
      (this.sync = !0),
      (this.needReadable = !1),
      (this.emittedReadable = !1),
      (this.readableListening = !1),
      (this.resumeScheduled = !1),
      (this.defaultEncoding = t.defaultEncoding || "utf8"),
      (this.ranOut = !1),
      (this.awaitDrain = 0),
      (this.readingMore = !1),
      (this.decoder = null),
      (this.encoding = null),
      t.encoding &&
        ((this.decoder = new ot(t.encoding)), (this.encoding = t.encoding));
  }
  function L(t) {
    if (!(this instanceof L)) return new L(t);
    (this._readableState = new un(t, this)),
      (this.readable = !0),
      t && typeof t.read == "function" && (this._read = t.read),
      k.call(this);
  }
  (L.prototype.push = function (t, e) {
    var r = this._readableState;
    return (
      !r.objectMode &&
        typeof t == "string" &&
        ((e = e || r.defaultEncoding),
        e !== r.encoding && ((t = c.from(t, e)), (e = ""))),
      cn(this, r, t, e, !1)
    );
  }),
    (L.prototype.unshift = function (t) {
      var e = this._readableState;
      return cn(this, e, t, "", !0);
    }),
    (L.prototype.isPaused = function () {
      return this._readableState.flowing === !1;
    });
  function cn(t, e, r, n, i) {
    var s = sa(e, r);
    if (s) t.emit("error", s);
    else if (r === null) (e.reading = !1), aa(t, e);
    else if (e.objectMode || (r && r.length > 0))
      if (e.ended && !i) {
        var a = new Error("stream.push() after EOF");
        t.emit("error", a);
      } else if (e.endEmitted && i) {
        var o = new Error("stream.unshift() after end event");
        t.emit("error", o);
      } else {
        var l;
        e.decoder &&
          !i &&
          !n &&
          ((r = e.decoder.write(r)), (l = !e.objectMode && r.length === 0)),
          i || (e.reading = !1),
          l ||
            (e.flowing && e.length === 0 && !e.sync
              ? (t.emit("data", r), t.read(0))
              : ((e.length += e.objectMode ? 1 : r.length),
                i ? e.buffer.unshift(r) : e.buffer.push(r),
                e.needReadable && Ot(t))),
          oa(t, e);
      }
    else i || (e.reading = !1);
    return na(e);
  }
  function na(t) {
    return (
      !t.ended &&
      (t.needReadable || t.length < t.highWaterMark || t.length === 0)
    );
  }
  L.prototype.setEncoding = function (t) {
    return (
      (this._readableState.decoder = new ot(t)),
      (this._readableState.encoding = t),
      this
    );
  };
  var fn = 8388608;
  function ia(t) {
    return (
      t >= fn
        ? (t = fn)
        : (t--,
          (t |= t >>> 1),
          (t |= t >>> 2),
          (t |= t >>> 4),
          (t |= t >>> 8),
          (t |= t >>> 16),
          t++),
      t
    );
  }
  function dn(t, e) {
    return t <= 0 || (e.length === 0 && e.ended)
      ? 0
      : e.objectMode
        ? 1
        : t !== t
          ? e.flowing && e.length
            ? e.buffer.head.data.length
            : e.length
          : (t > e.highWaterMark && (e.highWaterMark = ia(t)),
            t <= e.length
              ? t
              : e.ended
                ? e.length
                : ((e.needReadable = !0), 0));
  }
  L.prototype.read = function (t) {
    I("read", t), (t = parseInt(t, 10));
    var e = this._readableState,
      r = t;
    if (
      (t !== 0 && (e.emittedReadable = !1),
      t === 0 && e.needReadable && (e.length >= e.highWaterMark || e.ended))
    )
      return (
        I("read: emitReadable", e.length, e.ended),
        e.length === 0 && e.ended ? sr(this) : Ot(this),
        null
      );
    if (((t = dn(t, e)), t === 0 && e.ended))
      return e.length === 0 && sr(this), null;
    var n = e.needReadable;
    I("need readable", n),
      (e.length === 0 || e.length - t < e.highWaterMark) &&
        ((n = !0), I("length less than watermark", n)),
      e.ended || e.reading
        ? ((n = !1), I("reading or ended", n))
        : n &&
          (I("do read"),
          (e.reading = !0),
          (e.sync = !0),
          e.length === 0 && (e.needReadable = !0),
          this._read(e.highWaterMark),
          (e.sync = !1),
          e.reading || (t = dn(r, e)));
    var i;
    return (
      t > 0 ? (i = pn(t, e)) : (i = null),
      i === null ? ((e.needReadable = !0), (t = 0)) : (e.length -= t),
      e.length === 0 &&
        (e.ended || (e.needReadable = !0), r !== t && e.ended && sr(this)),
      i !== null && this.emit("data", i),
      i
    );
  };
  function sa(t, e) {
    var r = null;
    return (
      !$(e) &&
        typeof e != "string" &&
        e !== null &&
        e !== void 0 &&
        !t.objectMode &&
        (r = new TypeError("Invalid non-string/buffer chunk")),
      r
    );
  }
  function aa(t, e) {
    if (!e.ended) {
      if (e.decoder) {
        var r = e.decoder.end();
        r &&
          r.length &&
          (e.buffer.push(r), (e.length += e.objectMode ? 1 : r.length));
      }
      (e.ended = !0), Ot(t);
    }
  }
  function Ot(t) {
    var e = t._readableState;
    (e.needReadable = !1),
      e.emittedReadable ||
        (I("emitReadable", e.flowing),
        (e.emittedReadable = !0),
        e.sync ? J(hn, t) : hn(t));
  }
  function hn(t) {
    I("emit readable"), t.emit("readable"), ir(t);
  }
  function oa(t, e) {
    e.readingMore || ((e.readingMore = !0), J(la, t, e));
  }
  function la(t, e) {
    for (
      var r = e.length;
      !e.reading &&
      !e.flowing &&
      !e.ended &&
      e.length < e.highWaterMark &&
      (I("maybeReadMore read 0"), t.read(0), r !== e.length);

    )
      r = e.length;
    e.readingMore = !1;
  }
  (L.prototype._read = function (t) {
    this.emit("error", new Error("not implemented"));
  }),
    (L.prototype.pipe = function (t, e) {
      var r = this,
        n = this._readableState;
      switch (n.pipesCount) {
        case 0:
          n.pipes = t;
          break;
        case 1:
          n.pipes = [n.pipes, t];
          break;
        default:
          n.pipes.push(t);
          break;
      }
      (n.pipesCount += 1), I("pipe count=%d opts=%j", n.pipesCount, e);
      var i = !e || e.end !== !1,
        s = i ? o : f;
      n.endEmitted ? J(s) : r.once("end", s), t.on("unpipe", a);
      function a(M) {
        I("onunpipe"), M === r && f();
      }
      function o() {
        I("onend"), t.end();
      }
      var l = ua(r);
      t.on("drain", l);
      var u = !1;
      function f() {
        I("cleanup"),
          t.removeListener("close", V),
          t.removeListener("finish", O),
          t.removeListener("drain", l),
          t.removeListener("error", S),
          t.removeListener("unpipe", a),
          r.removeListener("end", o),
          r.removeListener("end", f),
          r.removeListener("data", v),
          (u = !0),
          n.awaitDrain &&
            (!t._writableState || t._writableState.needDrain) &&
            l();
      }
      var h = !1;
      r.on("data", v);
      function v(M) {
        I("ondata"), (h = !1);
        var C = t.write(M);
        C === !1 &&
          !h &&
          (((n.pipesCount === 1 && n.pipes === t) ||
            (n.pipesCount > 1 && mn(n.pipes, t) !== -1)) &&
            !u &&
            (I("false write response, pause", r._readableState.awaitDrain),
            r._readableState.awaitDrain++,
            (h = !0)),
          r.pause());
      }
      function S(M) {
        I("onerror", M),
          G(),
          t.removeListener("error", S),
          ra(t, "error") === 0 && t.emit("error", M);
      }
      ta(t, "error", S);
      function V() {
        t.removeListener("finish", O), G();
      }
      t.once("close", V);
      function O() {
        I("onfinish"), t.removeListener("close", V), G();
      }
      t.once("finish", O);
      function G() {
        I("unpipe"), r.unpipe(t);
      }
      return t.emit("pipe", r), n.flowing || (I("pipe resume"), r.resume()), t;
    });
  function ua(t) {
    return function () {
      var e = t._readableState;
      I("pipeOnDrain", e.awaitDrain),
        e.awaitDrain && e.awaitDrain--,
        e.awaitDrain === 0 &&
          t.listeners("data").length &&
          ((e.flowing = !0), ir(t));
    };
  }
  (L.prototype.unpipe = function (t) {
    var e = this._readableState;
    if (e.pipesCount === 0) return this;
    if (e.pipesCount === 1)
      return t && t !== e.pipes
        ? this
        : (t || (t = e.pipes),
          (e.pipes = null),
          (e.pipesCount = 0),
          (e.flowing = !1),
          t && t.emit("unpipe", this),
          this);
    if (!t) {
      var r = e.pipes,
        n = e.pipesCount;
      (e.pipes = null), (e.pipesCount = 0), (e.flowing = !1);
      for (var i = 0; i < n; i++) r[i].emit("unpipe", this);
      return this;
    }
    var s = mn(e.pipes, t);
    return s === -1
      ? this
      : (e.pipes.splice(s, 1),
        (e.pipesCount -= 1),
        e.pipesCount === 1 && (e.pipes = e.pipes[0]),
        t.emit("unpipe", this),
        this);
  }),
    (L.prototype.on = function (t, e) {
      var r = k.prototype.on.call(this, t, e);
      if (t === "data") this._readableState.flowing !== !1 && this.resume();
      else if (t === "readable") {
        var n = this._readableState;
        !n.endEmitted &&
          !n.readableListening &&
          ((n.readableListening = n.needReadable = !0),
          (n.emittedReadable = !1),
          n.reading ? n.length && Ot(this) : J(ca, this));
      }
      return r;
    }),
    (L.prototype.addListener = L.prototype.on);
  function ca(t) {
    I("readable nexttick read 0"), t.read(0);
  }
  L.prototype.resume = function () {
    var t = this._readableState;
    return t.flowing || (I("resume"), (t.flowing = !0), fa(this, t)), this;
  };
  function fa(t, e) {
    e.resumeScheduled || ((e.resumeScheduled = !0), J(da, t, e));
  }
  function da(t, e) {
    e.reading || (I("resume read 0"), t.read(0)),
      (e.resumeScheduled = !1),
      (e.awaitDrain = 0),
      t.emit("resume"),
      ir(t),
      e.flowing && !e.reading && t.read(0);
  }
  L.prototype.pause = function () {
    return (
      I("call pause flowing=%j", this._readableState.flowing),
      this._readableState.flowing !== !1 &&
        (I("pause"), (this._readableState.flowing = !1), this.emit("pause")),
      this
    );
  };
  function ir(t) {
    var e = t._readableState;
    for (I("flow", e.flowing); e.flowing && t.read() !== null; );
  }
  (L.prototype.wrap = function (t) {
    var e = this._readableState,
      r = !1,
      n = this;
    t.on("end", function () {
      if ((I("wrapped end"), e.decoder && !e.ended)) {
        var a = e.decoder.end();
        a && a.length && n.push(a);
      }
      n.push(null);
    }),
      t.on("data", function (a) {
        if (
          (I("wrapped data"),
          e.decoder && (a = e.decoder.write(a)),
          !(e.objectMode && a == null) && !(!e.objectMode && (!a || !a.length)))
        ) {
          var o = n.push(a);
          o || ((r = !0), t.pause());
        }
      });
    for (var i in t)
      this[i] === void 0 &&
        typeof t[i] == "function" &&
        (this[i] = (function (a) {
          return function () {
            return t[a].apply(t, arguments);
          };
        })(i));
    var s = ["error", "close", "destroy", "pause", "resume"];
    return (
      _a(s, function (a) {
        t.on(a, n.emit.bind(n, a));
      }),
      (n._read = function (a) {
        I("wrapped _read", a), r && ((r = !1), t.resume());
      }),
      n
    );
  }),
    (L._fromList = pn);
  function pn(t, e) {
    if (e.length === 0) return null;
    var r;
    return (
      e.objectMode
        ? (r = e.buffer.shift())
        : !t || t >= e.length
          ? (e.decoder
              ? (r = e.buffer.join(""))
              : e.buffer.length === 1
                ? (r = e.buffer.head.data)
                : (r = e.buffer.concat(e.length)),
            e.buffer.clear())
          : (r = ha(t, e.buffer, e.decoder)),
      r
    );
  }
  function ha(t, e, r) {
    var n;
    return (
      t < e.head.data.length
        ? ((n = e.head.data.slice(0, t)), (e.head.data = e.head.data.slice(t)))
        : t === e.head.data.length
          ? (n = e.shift())
          : (n = r ? pa(t, e) : ma(t, e)),
      n
    );
  }
  function pa(t, e) {
    var r = e.head,
      n = 1,
      i = r.data;
    for (t -= i.length; (r = r.next); ) {
      var s = r.data,
        a = t > s.length ? s.length : t;
      if (
        (a === s.length ? (i += s) : (i += s.slice(0, t)), (t -= a), t === 0)
      ) {
        a === s.length
          ? (++n, r.next ? (e.head = r.next) : (e.head = e.tail = null))
          : ((e.head = r), (r.data = s.slice(a)));
        break;
      }
      ++n;
    }
    return (e.length -= n), i;
  }
  function ma(t, e) {
    var r = c.allocUnsafe(t),
      n = e.head,
      i = 1;
    for (n.data.copy(r), t -= n.data.length; (n = n.next); ) {
      var s = n.data,
        a = t > s.length ? s.length : t;
      if ((s.copy(r, r.length - t, 0, a), (t -= a), t === 0)) {
        a === s.length
          ? (++i, n.next ? (e.head = n.next) : (e.head = e.tail = null))
          : ((e.head = n), (n.data = s.slice(a)));
        break;
      }
      ++i;
    }
    return (e.length -= i), r;
  }
  function sr(t) {
    var e = t._readableState;
    if (e.length > 0)
      throw new Error('"endReadable()" called on non-empty stream');
    e.endEmitted || ((e.ended = !0), J(ga, e, t));
  }
  function ga(t, e) {
    !t.endEmitted &&
      t.length === 0 &&
      ((t.endEmitted = !0), (e.readable = !1), e.emit("end"));
  }
  function _a(t, e) {
    for (var r = 0, n = t.length; r < n; r++) e(t[r], r);
  }
  function mn(t, e) {
    for (var r = 0, n = t.length; r < n; r++) if (t[r] === e) return r;
    return -1;
  }
  (U.WritableState = ar), We(U, k);
  function ya() {}
  function va(t, e, r) {
    (this.chunk = t),
      (this.encoding = e),
      (this.callback = r),
      (this.next = null);
  }
  function ar(t, e) {
    Object.defineProperty(this, "buffer", {
      get: sn(function () {
        return this.getBuffer();
      }, "_writableState.buffer is deprecated. Use _writableState.getBuffer instead."),
    }),
      (t = t || {}),
      (this.objectMode = !!t.objectMode),
      e instanceof q &&
        (this.objectMode = this.objectMode || !!t.writableObjectMode);
    var r = t.highWaterMark,
      n = this.objectMode ? 16 : 16 * 1024;
    (this.highWaterMark = r || r === 0 ? r : n),
      (this.highWaterMark = ~~this.highWaterMark),
      (this.needDrain = !1),
      (this.ending = !1),
      (this.ended = !1),
      (this.finished = !1);
    var i = t.decodeStrings === !1;
    (this.decodeStrings = !i),
      (this.defaultEncoding = t.defaultEncoding || "utf8"),
      (this.length = 0),
      (this.writing = !1),
      (this.corked = 0),
      (this.sync = !0),
      (this.bufferProcessing = !1),
      (this.onwrite = function (s) {
        Ra(e, s);
      }),
      (this.writecb = null),
      (this.writelen = 0),
      (this.bufferedRequest = null),
      (this.lastBufferedRequest = null),
      (this.pendingcb = 0),
      (this.prefinished = !1),
      (this.errorEmitted = !1),
      (this.bufferedRequestCount = 0),
      (this.corkedRequestsFree = new bn(this));
  }
  ar.prototype.getBuffer = function () {
    for (var e = this.bufferedRequest, r = []; e; ) r.push(e), (e = e.next);
    return r;
  };
  function U(t) {
    if (!(this instanceof U) && !(this instanceof q)) return new U(t);
    (this._writableState = new ar(t, this)),
      (this.writable = !0),
      t &&
        (typeof t.write == "function" && (this._write = t.write),
        typeof t.writev == "function" && (this._writev = t.writev)),
      k.call(this);
  }
  U.prototype.pipe = function () {
    this.emit("error", new Error("Cannot pipe, not readable"));
  };
  function wa(t, e) {
    var r = new Error("write after end");
    t.emit("error", r), J(e, r);
  }
  function ba(t, e, r, n) {
    var i = !0,
      s = !1;
    return (
      r === null
        ? (s = new TypeError("May not write null values to stream"))
        : !c.isBuffer(r) &&
          typeof r != "string" &&
          r !== void 0 &&
          !e.objectMode &&
          (s = new TypeError("Invalid non-string/buffer chunk")),
      s && (t.emit("error", s), J(n, s), (i = !1)),
      i
    );
  }
  (U.prototype.write = function (t, e, r) {
    var n = this._writableState,
      i = !1;
    return (
      typeof e == "function" && ((r = e), (e = null)),
      c.isBuffer(t) ? (e = "buffer") : e || (e = n.defaultEncoding),
      typeof r != "function" && (r = ya),
      n.ended
        ? wa(this, r)
        : ba(this, n, t, r) && (n.pendingcb++, (i = Sa(this, n, t, e, r))),
      i
    );
  }),
    (U.prototype.cork = function () {
      var t = this._writableState;
      t.corked++;
    }),
    (U.prototype.uncork = function () {
      var t = this._writableState;
      t.corked &&
        (t.corked--,
        !t.writing &&
          !t.corked &&
          !t.finished &&
          !t.bufferProcessing &&
          t.bufferedRequest &&
          _n(this, t));
    }),
    (U.prototype.setDefaultEncoding = function (e) {
      if (
        (typeof e == "string" && (e = e.toLowerCase()),
        !(
          [
            "hex",
            "utf8",
            "utf-8",
            "ascii",
            "binary",
            "base64",
            "ucs2",
            "ucs-2",
            "utf16le",
            "utf-16le",
            "raw",
          ].indexOf((e + "").toLowerCase()) > -1
        ))
      )
        throw new TypeError("Unknown encoding: " + e);
      return (this._writableState.defaultEncoding = e), this;
    });
  function xa(t, e, r) {
    return (
      !t.objectMode &&
        t.decodeStrings !== !1 &&
        typeof e == "string" &&
        (e = c.from(e, r)),
      e
    );
  }
  function Sa(t, e, r, n, i) {
    (r = xa(e, r, n)), c.isBuffer(r) && (n = "buffer");
    var s = e.objectMode ? 1 : r.length;
    e.length += s;
    var a = e.length < e.highWaterMark;
    if ((a || (e.needDrain = !0), e.writing || e.corked)) {
      var o = e.lastBufferedRequest;
      (e.lastBufferedRequest = new va(r, n, i)),
        o
          ? (o.next = e.lastBufferedRequest)
          : (e.bufferedRequest = e.lastBufferedRequest),
        (e.bufferedRequestCount += 1);
    } else or(t, e, !1, s, r, n, i);
    return a;
  }
  function or(t, e, r, n, i, s, a) {
    (e.writelen = n),
      (e.writecb = a),
      (e.writing = !0),
      (e.sync = !0),
      r ? t._writev(i, e.onwrite) : t._write(i, s, e.onwrite),
      (e.sync = !1);
  }
  function Ea(t, e, r, n, i) {
    --e.pendingcb,
      r ? J(i, n) : i(n),
      (t._writableState.errorEmitted = !0),
      t.emit("error", n);
  }
  function ka(t) {
    (t.writing = !1),
      (t.writecb = null),
      (t.length -= t.writelen),
      (t.writelen = 0);
  }
  function Ra(t, e) {
    var r = t._writableState,
      n = r.sync,
      i = r.writecb;
    if ((ka(r), e)) Ea(t, r, n, e, i);
    else {
      var s = yn(r);
      !s && !r.corked && !r.bufferProcessing && r.bufferedRequest && _n(t, r),
        n ? J(gn, t, r, s, i) : gn(t, r, s, i);
    }
  }
  function gn(t, e, r, n) {
    r || Ia(t, e), e.pendingcb--, n(), wn(t, e);
  }
  function Ia(t, e) {
    e.length === 0 && e.needDrain && ((e.needDrain = !1), t.emit("drain"));
  }
  function _n(t, e) {
    e.bufferProcessing = !0;
    var r = e.bufferedRequest;
    if (t._writev && r && r.next) {
      var n = e.bufferedRequestCount,
        i = new Array(n),
        s = e.corkedRequestsFree;
      s.entry = r;
      for (var a = 0; r; ) (i[a] = r), (r = r.next), (a += 1);
      or(t, e, !0, e.length, i, "", s.finish),
        e.pendingcb++,
        (e.lastBufferedRequest = null),
        s.next
          ? ((e.corkedRequestsFree = s.next), (s.next = null))
          : (e.corkedRequestsFree = new bn(e));
    } else {
      for (; r; ) {
        var o = r.chunk,
          l = r.encoding,
          u = r.callback,
          f = e.objectMode ? 1 : o.length;
        if ((or(t, e, !1, f, o, l, u), (r = r.next), e.writing)) break;
      }
      r === null && (e.lastBufferedRequest = null);
    }
    (e.bufferedRequestCount = 0),
      (e.bufferedRequest = r),
      (e.bufferProcessing = !1);
  }
  (U.prototype._write = function (t, e, r) {
    r(new Error("not implemented"));
  }),
    (U.prototype._writev = null),
    (U.prototype.end = function (t, e, r) {
      var n = this._writableState;
      typeof t == "function"
        ? ((r = t), (t = null), (e = null))
        : typeof e == "function" && ((r = e), (e = null)),
        t != null && this.write(t, e),
        n.corked && ((n.corked = 1), this.uncork()),
        !n.ending && !n.finished && Ta(this, n, r);
    });
  function yn(t) {
    return (
      t.ending &&
      t.length === 0 &&
      t.bufferedRequest === null &&
      !t.finished &&
      !t.writing
    );
  }
  function vn(t, e) {
    e.prefinished || ((e.prefinished = !0), t.emit("prefinish"));
  }
  function wn(t, e) {
    var r = yn(e);
    return (
      r &&
        (e.pendingcb === 0
          ? (vn(t, e), (e.finished = !0), t.emit("finish"))
          : vn(t, e)),
      r
    );
  }
  function Ta(t, e, r) {
    (e.ending = !0),
      wn(t, e),
      r && (e.finished ? J(r) : t.once("finish", r)),
      (e.ended = !0),
      (t.writable = !1);
  }
  function bn(t) {
    var e = this;
    (this.next = null),
      (this.entry = null),
      (this.finish = function (r) {
        var n = e.entry;
        for (e.entry = null; n; ) {
          var i = n.callback;
          t.pendingcb--, i(r), (n = n.next);
        }
        t.corkedRequestsFree
          ? (t.corkedRequestsFree.next = e)
          : (t.corkedRequestsFree = e);
      });
  }
  We(q, L);
  for (var xn = Object.keys(U.prototype), lr = 0; lr < xn.length; lr++) {
    var ur = xn[lr];
    q.prototype[ur] || (q.prototype[ur] = U.prototype[ur]);
  }
  function q(t) {
    if (!(this instanceof q)) return new q(t);
    L.call(this, t),
      U.call(this, t),
      t && t.readable === !1 && (this.readable = !1),
      t && t.writable === !1 && (this.writable = !1),
      (this.allowHalfOpen = !0),
      t && t.allowHalfOpen === !1 && (this.allowHalfOpen = !1),
      this.once("end", Na);
  }
  function Na() {
    this.allowHalfOpen || this._writableState.ended || J(Ca, this);
  }
  function Ca(t) {
    t.end();
  }
  We(K, q);
  function Oa(t) {
    (this.afterTransform = function (e, r) {
      return Aa(t, e, r);
    }),
      (this.needTransform = !1),
      (this.transforming = !1),
      (this.writecb = null),
      (this.writechunk = null),
      (this.writeencoding = null);
  }
  function Aa(t, e, r) {
    var n = t._transformState;
    n.transforming = !1;
    var i = n.writecb;
    if (!i) return t.emit("error", new Error("no writecb in Transform class"));
    (n.writechunk = null), (n.writecb = null), r != null && t.push(r), i(e);
    var s = t._readableState;
    (s.reading = !1),
      (s.needReadable || s.length < s.highWaterMark) &&
        t._read(s.highWaterMark);
  }
  function K(t) {
    if (!(this instanceof K)) return new K(t);
    q.call(this, t), (this._transformState = new Oa(this));
    var e = this;
    (this._readableState.needReadable = !0),
      (this._readableState.sync = !1),
      t &&
        (typeof t.transform == "function" && (this._transform = t.transform),
        typeof t.flush == "function" && (this._flush = t.flush)),
      this.once("prefinish", function () {
        typeof this._flush == "function"
          ? this._flush(function (r) {
              Sn(e, r);
            })
          : Sn(e);
      });
  }
  (K.prototype.push = function (t, e) {
    return (
      (this._transformState.needTransform = !1),
      q.prototype.push.call(this, t, e)
    );
  }),
    (K.prototype._transform = function (t, e, r) {
      throw new Error("Not implemented");
    }),
    (K.prototype._write = function (t, e, r) {
      var n = this._transformState;
      if (
        ((n.writecb = r),
        (n.writechunk = t),
        (n.writeencoding = e),
        !n.transforming)
      ) {
        var i = this._readableState;
        (n.needTransform || i.needReadable || i.length < i.highWaterMark) &&
          this._read(i.highWaterMark);
      }
    }),
    (K.prototype._read = function (t) {
      var e = this._transformState;
      e.writechunk !== null && e.writecb && !e.transforming
        ? ((e.transforming = !0),
          this._transform(e.writechunk, e.writeencoding, e.afterTransform))
        : (e.needTransform = !0);
    });
  function Sn(t, e) {
    if (e) return t.emit("error", e);
    var r = t._writableState,
      n = t._transformState;
    if (r.length) throw new Error("Calling transform done when ws.length != 0");
    if (n.transforming)
      throw new Error("Calling transform done when still transforming");
    return t.push(null);
  }
  We(lt, K);
  function lt(t) {
    if (!(this instanceof lt)) return new lt(t);
    K.call(this, t);
  }
  (lt.prototype._transform = function (t, e, r) {
    r(null, t);
  }),
    We(fe, k),
    (fe.Readable = L),
    (fe.Writable = U),
    (fe.Duplex = q),
    (fe.Transform = K),
    (fe.PassThrough = lt),
    (fe.Stream = fe);
  function fe() {
    k.call(this);
  }
  fe.prototype.pipe = function (t, e) {
    var r = this;
    function n(f) {
      t.writable && t.write(f) === !1 && r.pause && r.pause();
    }
    r.on("data", n);
    function i() {
      r.readable && r.resume && r.resume();
    }
    t.on("drain", i),
      !t._isStdio && (!e || e.end !== !1) && (r.on("end", a), r.on("close", o));
    var s = !1;
    function a() {
      s || ((s = !0), t.end());
    }
    function o() {
      s || ((s = !0), typeof t.destroy == "function" && t.destroy());
    }
    function l(f) {
      if ((u(), k.listenerCount(this, "error") === 0)) throw f;
    }
    r.on("error", l), t.on("error", l);
    function u() {
      r.removeListener("data", n),
        t.removeListener("drain", i),
        r.removeListener("end", a),
        r.removeListener("close", o),
        r.removeListener("error", l),
        t.removeListener("error", l),
        r.removeListener("end", u),
        r.removeListener("close", u),
        t.removeListener("close", u);
    }
    return (
      r.on("end", u), r.on("close", u), t.on("close", u), t.emit("pipe", r), t
    );
  };
  const En = function (t) {
    return typeof t == "object" && t !== null && !Array.isArray(t);
  };
  class R extends Error {
    constructor(e, r, n, ...i) {
      Array.isArray(r) && (r = r.join(" ").trim()),
        super(r),
        Error.captureStackTrace !== void 0 && Error.captureStackTrace(this, R),
        (this.code = e);
      for (const s of i)
        for (const a in s) {
          const o = s[a];
          this[a] = $(o)
            ? o.toString(n.encoding)
            : o == null
              ? o
              : JSON.parse(JSON.stringify(o));
        }
    }
  }
  const kn = function (t) {
    const e = [];
    for (let r = 0, n = t.length; r < n; r++) {
      const i = t[r];
      if (i == null || i === !1) e[r] = { disabled: !0 };
      else if (typeof i == "string") e[r] = { name: i };
      else if (En(i)) {
        if (typeof i.name != "string")
          throw new R("CSV_OPTION_COLUMNS_MISSING_NAME", [
            "Option columns missing name:",
            `property "name" is required at position ${r}`,
            "when column is an object literal",
          ]);
        e[r] = i;
      } else
        throw new R("CSV_INVALID_COLUMN_DEFINITION", [
          "Invalid column definition:",
          "expect a string or a literal object,",
          `got ${JSON.stringify(i)} at position ${r}`,
        ]);
    }
    return e;
  };
  class Rn {
    constructor(e = 100) {
      (this.size = e), (this.length = 0), (this.buf = c.allocUnsafe(e));
    }
    prepend(e) {
      if ($(e)) {
        const r = this.length + e.length;
        if (r >= this.size && (this.resize(), r >= this.size))
          throw Error("INVALID_BUFFER_STATE");
        const n = this.buf;
        (this.buf = c.allocUnsafe(this.size)),
          e.copy(this.buf, 0),
          n.copy(this.buf, e.length),
          (this.length += e.length);
      } else {
        const r = this.length++;
        r === this.size && this.resize();
        const n = this.clone();
        (this.buf[0] = e), n.copy(this.buf, 1, 0, r);
      }
    }
    append(e) {
      const r = this.length++;
      r === this.size && this.resize(), (this.buf[r] = e);
    }
    clone() {
      return c.from(this.buf.slice(0, this.length));
    }
    resize() {
      const e = this.length;
      this.size = this.size * 2;
      const r = c.allocUnsafe(this.size);
      this.buf.copy(r, 0, 0, e), (this.buf = r);
    }
    toString(e) {
      return e
        ? this.buf.slice(0, this.length).toString(e)
        : Uint8Array.prototype.slice.call(this.buf.slice(0, this.length));
    }
    toJSON() {
      return this.toString("utf8");
    }
    reset() {
      this.length = 0;
    }
  }
  const La = 12,
    Ma = 13,
    ja = 10,
    Da = 32,
    Za = 9,
    Ua = function (t) {
      return {
        bomSkipped: !1,
        bufBytesStart: 0,
        castField: t.cast_function,
        commenting: !1,
        error: void 0,
        enabled: t.from_line === 1,
        escaping: !1,
        escapeIsQuote:
          $(t.escape) && $(t.quote) && c.compare(t.escape, t.quote) === 0,
        expectedRecordLength: Array.isArray(t.columns)
          ? t.columns.length
          : void 0,
        field: new Rn(20),
        firstLineToHeaders: t.cast_first_line_to_header,
        needMoreDataSize: Math.max(
          t.comment !== null ? t.comment.length : 0,
          ...t.delimiter.map((e) => e.length),
          t.quote !== null ? t.quote.length : 0,
        ),
        previousBuf: void 0,
        quoting: !1,
        stop: !1,
        rawBuffer: new Rn(100),
        record: [],
        recordHasError: !1,
        record_length: 0,
        recordDelimiterMaxLength:
          t.record_delimiter.length === 0
            ? 0
            : Math.max(...t.record_delimiter.map((e) => e.length)),
        trimChars: [c.from(" ", t.encoding)[0], c.from("	", t.encoding)[0]],
        wasQuoting: !1,
        wasRowDelimiter: !1,
        timchars: [
          c.from(c.from([Ma], "utf8").toString(), t.encoding),
          c.from(c.from([ja], "utf8").toString(), t.encoding),
          c.from(c.from([La], "utf8").toString(), t.encoding),
          c.from(c.from([Da], "utf8").toString(), t.encoding),
          c.from(c.from([Za], "utf8").toString(), t.encoding),
        ],
      };
    },
    Ba = function (t) {
      return t.replace(/([A-Z])/g, function (e, r) {
        return "_" + r.toLowerCase();
      });
    },
    In = function (t) {
      const e = {};
      for (const n in t) e[Ba(n)] = t[n];
      if (e.encoding === void 0 || e.encoding === !0) e.encoding = "utf8";
      else if (e.encoding === null || e.encoding === !1) e.encoding = null;
      else if (typeof e.encoding != "string" && e.encoding !== null)
        throw new R(
          "CSV_INVALID_OPTION_ENCODING",
          [
            "Invalid option encoding:",
            "encoding must be a string or null to return a buffer,",
            `got ${JSON.stringify(e.encoding)}`,
          ],
          e,
        );
      if (e.bom === void 0 || e.bom === null || e.bom === !1) e.bom = !1;
      else if (e.bom !== !0)
        throw new R(
          "CSV_INVALID_OPTION_BOM",
          [
            "Invalid option bom:",
            "bom must be true,",
            `got ${JSON.stringify(e.bom)}`,
          ],
          e,
        );
      if (
        ((e.cast_function = null),
        e.cast === void 0 || e.cast === null || e.cast === !1 || e.cast === "")
      )
        e.cast = void 0;
      else if (typeof e.cast == "function")
        (e.cast_function = e.cast), (e.cast = !0);
      else if (e.cast !== !0)
        throw new R(
          "CSV_INVALID_OPTION_CAST",
          [
            "Invalid option cast:",
            "cast must be true or a function,",
            `got ${JSON.stringify(e.cast)}`,
          ],
          e,
        );
      if (
        e.cast_date === void 0 ||
        e.cast_date === null ||
        e.cast_date === !1 ||
        e.cast_date === ""
      )
        e.cast_date = !1;
      else if (e.cast_date === !0)
        e.cast_date = function (n) {
          const i = Date.parse(n);
          return isNaN(i) ? n : new Date(i);
        };
      else if (typeof e.cast_date != "function")
        throw new R(
          "CSV_INVALID_OPTION_CAST_DATE",
          [
            "Invalid option cast_date:",
            "cast_date must be true or a function,",
            `got ${JSON.stringify(e.cast_date)}`,
          ],
          e,
        );
      if (((e.cast_first_line_to_header = null), e.columns === !0))
        e.cast_first_line_to_header = void 0;
      else if (typeof e.columns == "function")
        (e.cast_first_line_to_header = e.columns), (e.columns = !0);
      else if (Array.isArray(e.columns)) e.columns = kn(e.columns);
      else if (e.columns === void 0 || e.columns === null || e.columns === !1)
        e.columns = !1;
      else
        throw new R(
          "CSV_INVALID_OPTION_COLUMNS",
          [
            "Invalid option columns:",
            "expect an array, a function or true,",
            `got ${JSON.stringify(e.columns)}`,
          ],
          e,
        );
      if (
        e.group_columns_by_name === void 0 ||
        e.group_columns_by_name === null ||
        e.group_columns_by_name === !1
      )
        e.group_columns_by_name = !1;
      else {
        if (e.group_columns_by_name !== !0)
          throw new R(
            "CSV_INVALID_OPTION_GROUP_COLUMNS_BY_NAME",
            [
              "Invalid option group_columns_by_name:",
              "expect an boolean,",
              `got ${JSON.stringify(e.group_columns_by_name)}`,
            ],
            e,
          );
        if (e.columns === !1)
          throw new R(
            "CSV_INVALID_OPTION_GROUP_COLUMNS_BY_NAME",
            [
              "Invalid option group_columns_by_name:",
              "the `columns` mode must be activated.",
            ],
            e,
          );
      }
      if (
        e.comment === void 0 ||
        e.comment === null ||
        e.comment === !1 ||
        e.comment === ""
      )
        e.comment = null;
      else if (
        (typeof e.comment == "string" &&
          (e.comment = c.from(e.comment, e.encoding)),
        !$(e.comment))
      )
        throw new R(
          "CSV_INVALID_OPTION_COMMENT",
          [
            "Invalid option comment:",
            "comment must be a buffer or a string,",
            `got ${JSON.stringify(e.comment)}`,
          ],
          e,
        );
      if (
        e.comment_no_infix === void 0 ||
        e.comment_no_infix === null ||
        e.comment_no_infix === !1
      )
        e.comment_no_infix = !1;
      else if (e.comment_no_infix !== !0)
        throw new R(
          "CSV_INVALID_OPTION_COMMENT",
          [
            "Invalid option comment_no_infix:",
            "value must be a boolean,",
            `got ${JSON.stringify(e.comment_no_infix)}`,
          ],
          e,
        );
      const r = JSON.stringify(e.delimiter);
      if (
        (Array.isArray(e.delimiter) || (e.delimiter = [e.delimiter]),
        e.delimiter.length === 0)
      )
        throw new R(
          "CSV_INVALID_OPTION_DELIMITER",
          [
            "Invalid option delimiter:",
            "delimiter must be a non empty string or buffer or array of string|buffer,",
            `got ${r}`,
          ],
          e,
        );
      if (
        ((e.delimiter = e.delimiter.map(function (n) {
          if (n == null || n === !1) return c.from(",", e.encoding);
          if (
            (typeof n == "string" && (n = c.from(n, e.encoding)),
            !$(n) || n.length === 0)
          )
            throw new R(
              "CSV_INVALID_OPTION_DELIMITER",
              [
                "Invalid option delimiter:",
                "delimiter must be a non empty string or buffer or array of string|buffer,",
                `got ${r}`,
              ],
              e,
            );
          return n;
        })),
        e.escape === void 0 || e.escape === !0
          ? (e.escape = c.from('"', e.encoding))
          : typeof e.escape == "string"
            ? (e.escape = c.from(e.escape, e.encoding))
            : (e.escape === null || e.escape === !1) && (e.escape = null),
        e.escape !== null && !$(e.escape))
      )
        throw new Error(
          `Invalid Option: escape must be a buffer, a string or a boolean, got ${JSON.stringify(e.escape)}`,
        );
      if (e.from === void 0 || e.from === null) e.from = 1;
      else if (
        (typeof e.from == "string" &&
          /\d+/.test(e.from) &&
          (e.from = parseInt(e.from)),
        Number.isInteger(e.from))
      ) {
        if (e.from < 0)
          throw new Error(
            `Invalid Option: from must be a positive integer, got ${JSON.stringify(t.from)}`,
          );
      } else
        throw new Error(
          `Invalid Option: from must be an integer, got ${JSON.stringify(e.from)}`,
        );
      if (e.from_line === void 0 || e.from_line === null) e.from_line = 1;
      else if (
        (typeof e.from_line == "string" &&
          /\d+/.test(e.from_line) &&
          (e.from_line = parseInt(e.from_line)),
        Number.isInteger(e.from_line))
      ) {
        if (e.from_line <= 0)
          throw new Error(
            `Invalid Option: from_line must be a positive integer greater than 0, got ${JSON.stringify(t.from_line)}`,
          );
      } else
        throw new Error(
          `Invalid Option: from_line must be an integer, got ${JSON.stringify(t.from_line)}`,
        );
      if (
        e.ignore_last_delimiters === void 0 ||
        e.ignore_last_delimiters === null
      )
        e.ignore_last_delimiters = !1;
      else if (typeof e.ignore_last_delimiters == "number")
        (e.ignore_last_delimiters = Math.floor(e.ignore_last_delimiters)),
          e.ignore_last_delimiters === 0 && (e.ignore_last_delimiters = !1);
      else if (typeof e.ignore_last_delimiters != "boolean")
        throw new R(
          "CSV_INVALID_OPTION_IGNORE_LAST_DELIMITERS",
          [
            "Invalid option `ignore_last_delimiters`:",
            "the value must be a boolean value or an integer,",
            `got ${JSON.stringify(e.ignore_last_delimiters)}`,
          ],
          e,
        );
      if (e.ignore_last_delimiters === !0 && e.columns === !1)
        throw new R(
          "CSV_IGNORE_LAST_DELIMITERS_REQUIRES_COLUMNS",
          [
            "The option `ignore_last_delimiters`",
            "requires the activation of the `columns` option",
          ],
          e,
        );
      if (e.info === void 0 || e.info === null || e.info === !1) e.info = !1;
      else if (e.info !== !0)
        throw new Error(
          `Invalid Option: info must be true, got ${JSON.stringify(e.info)}`,
        );
      if (
        e.max_record_size === void 0 ||
        e.max_record_size === null ||
        e.max_record_size === !1
      )
        e.max_record_size = 0;
      else if (!(Number.isInteger(e.max_record_size) && e.max_record_size >= 0))
        if (
          typeof e.max_record_size == "string" &&
          /\d+/.test(e.max_record_size)
        )
          e.max_record_size = parseInt(e.max_record_size);
        else
          throw new Error(
            `Invalid Option: max_record_size must be a positive integer, got ${JSON.stringify(e.max_record_size)}`,
          );
      if (e.objname === void 0 || e.objname === null || e.objname === !1)
        e.objname = void 0;
      else if ($(e.objname)) {
        if (e.objname.length === 0)
          throw new Error("Invalid Option: objname must be a non empty buffer");
        e.encoding === null || (e.objname = e.objname.toString(e.encoding));
      } else if (typeof e.objname == "string") {
        if (e.objname.length === 0)
          throw new Error("Invalid Option: objname must be a non empty string");
      } else if (typeof e.objname != "number")
        throw new Error(
          `Invalid Option: objname must be a string or a buffer, got ${e.objname}`,
        );
      if (e.objname !== void 0) {
        if (typeof e.objname == "number") {
          if (e.columns !== !1)
            throw Error(
              "Invalid Option: objname index cannot be combined with columns or be defined as a field",
            );
        } else if (e.columns === !1)
          throw Error(
            "Invalid Option: objname field must be combined with columns or be defined as an index",
          );
      }
      if (e.on_record === void 0 || e.on_record === null) e.on_record = void 0;
      else if (typeof e.on_record != "function")
        throw new R(
          "CSV_INVALID_OPTION_ON_RECORD",
          [
            "Invalid option `on_record`:",
            "expect a function,",
            `got ${JSON.stringify(e.on_record)}`,
          ],
          e,
        );
      if (
        e.on_skip !== void 0 &&
        e.on_skip !== null &&
        typeof e.on_skip != "function"
      )
        throw new Error(
          `Invalid Option: on_skip must be a function, got ${JSON.stringify(e.on_skip)}`,
        );
      if (e.quote === null || e.quote === !1 || e.quote === "") e.quote = null;
      else if (
        (e.quote === void 0 || e.quote === !0
          ? (e.quote = c.from('"', e.encoding))
          : typeof e.quote == "string" &&
            (e.quote = c.from(e.quote, e.encoding)),
        !$(e.quote))
      )
        throw new Error(
          `Invalid Option: quote must be a buffer or a string, got ${JSON.stringify(e.quote)}`,
        );
      if (e.raw === void 0 || e.raw === null || e.raw === !1) e.raw = !1;
      else if (e.raw !== !0)
        throw new Error(
          `Invalid Option: raw must be true, got ${JSON.stringify(e.raw)}`,
        );
      if (e.record_delimiter === void 0) e.record_delimiter = [];
      else if (typeof e.record_delimiter == "string" || $(e.record_delimiter)) {
        if (e.record_delimiter.length === 0)
          throw new R(
            "CSV_INVALID_OPTION_RECORD_DELIMITER",
            [
              "Invalid option `record_delimiter`:",
              "value must be a non empty string or buffer,",
              `got ${JSON.stringify(e.record_delimiter)}`,
            ],
            e,
          );
        e.record_delimiter = [e.record_delimiter];
      } else if (!Array.isArray(e.record_delimiter))
        throw new R(
          "CSV_INVALID_OPTION_RECORD_DELIMITER",
          [
            "Invalid option `record_delimiter`:",
            "value must be a string, a buffer or array of string|buffer,",
            `got ${JSON.stringify(e.record_delimiter)}`,
          ],
          e,
        );
      if (
        ((e.record_delimiter = e.record_delimiter.map(function (n, i) {
          if (typeof n != "string" && !$(n))
            throw new R(
              "CSV_INVALID_OPTION_RECORD_DELIMITER",
              [
                "Invalid option `record_delimiter`:",
                "value must be a string, a buffer or array of string|buffer",
                `at index ${i},`,
                `got ${JSON.stringify(n)}`,
              ],
              e,
            );
          if (n.length === 0)
            throw new R(
              "CSV_INVALID_OPTION_RECORD_DELIMITER",
              [
                "Invalid option `record_delimiter`:",
                "value must be a non empty string or buffer",
                `at index ${i},`,
                `got ${JSON.stringify(n)}`,
              ],
              e,
            );
          return typeof n == "string" && (n = c.from(n, e.encoding)), n;
        })),
        typeof e.relax_column_count != "boolean")
      )
        if (e.relax_column_count === void 0 || e.relax_column_count === null)
          e.relax_column_count = !1;
        else
          throw new Error(
            `Invalid Option: relax_column_count must be a boolean, got ${JSON.stringify(e.relax_column_count)}`,
          );
      if (typeof e.relax_column_count_less != "boolean")
        if (
          e.relax_column_count_less === void 0 ||
          e.relax_column_count_less === null
        )
          e.relax_column_count_less = !1;
        else
          throw new Error(
            `Invalid Option: relax_column_count_less must be a boolean, got ${JSON.stringify(e.relax_column_count_less)}`,
          );
      if (typeof e.relax_column_count_more != "boolean")
        if (
          e.relax_column_count_more === void 0 ||
          e.relax_column_count_more === null
        )
          e.relax_column_count_more = !1;
        else
          throw new Error(
            `Invalid Option: relax_column_count_more must be a boolean, got ${JSON.stringify(e.relax_column_count_more)}`,
          );
      if (typeof e.relax_quotes != "boolean")
        if (e.relax_quotes === void 0 || e.relax_quotes === null)
          e.relax_quotes = !1;
        else
          throw new Error(
            `Invalid Option: relax_quotes must be a boolean, got ${JSON.stringify(e.relax_quotes)}`,
          );
      if (typeof e.skip_empty_lines != "boolean")
        if (e.skip_empty_lines === void 0 || e.skip_empty_lines === null)
          e.skip_empty_lines = !1;
        else
          throw new Error(
            `Invalid Option: skip_empty_lines must be a boolean, got ${JSON.stringify(e.skip_empty_lines)}`,
          );
      if (typeof e.skip_records_with_empty_values != "boolean")
        if (
          e.skip_records_with_empty_values === void 0 ||
          e.skip_records_with_empty_values === null
        )
          e.skip_records_with_empty_values = !1;
        else
          throw new Error(
            `Invalid Option: skip_records_with_empty_values must be a boolean, got ${JSON.stringify(e.skip_records_with_empty_values)}`,
          );
      if (typeof e.skip_records_with_error != "boolean")
        if (
          e.skip_records_with_error === void 0 ||
          e.skip_records_with_error === null
        )
          e.skip_records_with_error = !1;
        else
          throw new Error(
            `Invalid Option: skip_records_with_error must be a boolean, got ${JSON.stringify(e.skip_records_with_error)}`,
          );
      if (e.rtrim === void 0 || e.rtrim === null || e.rtrim === !1)
        e.rtrim = !1;
      else if (e.rtrim !== !0)
        throw new Error(
          `Invalid Option: rtrim must be a boolean, got ${JSON.stringify(e.rtrim)}`,
        );
      if (e.ltrim === void 0 || e.ltrim === null || e.ltrim === !1)
        e.ltrim = !1;
      else if (e.ltrim !== !0)
        throw new Error(
          `Invalid Option: ltrim must be a boolean, got ${JSON.stringify(e.ltrim)}`,
        );
      if (e.trim === void 0 || e.trim === null || e.trim === !1) e.trim = !1;
      else if (e.trim !== !0)
        throw new Error(
          `Invalid Option: trim must be a boolean, got ${JSON.stringify(e.trim)}`,
        );
      if (
        (e.trim === !0 && t.ltrim !== !1
          ? (e.ltrim = !0)
          : e.ltrim !== !0 && (e.ltrim = !1),
        e.trim === !0 && t.rtrim !== !1
          ? (e.rtrim = !0)
          : e.rtrim !== !0 && (e.rtrim = !1),
        e.to === void 0 || e.to === null)
      )
        e.to = -1;
      else if (
        (typeof e.to == "string" && /\d+/.test(e.to) && (e.to = parseInt(e.to)),
        Number.isInteger(e.to))
      ) {
        if (e.to <= 0)
          throw new Error(
            `Invalid Option: to must be a positive integer greater than 0, got ${JSON.stringify(t.to)}`,
          );
      } else
        throw new Error(
          `Invalid Option: to must be an integer, got ${JSON.stringify(t.to)}`,
        );
      if (e.to_line === void 0 || e.to_line === null) e.to_line = -1;
      else if (
        (typeof e.to_line == "string" &&
          /\d+/.test(e.to_line) &&
          (e.to_line = parseInt(e.to_line)),
        Number.isInteger(e.to_line))
      ) {
        if (e.to_line <= 0)
          throw new Error(
            `Invalid Option: to_line must be a positive integer greater than 0, got ${JSON.stringify(t.to_line)}`,
          );
      } else
        throw new Error(
          `Invalid Option: to_line must be an integer, got ${JSON.stringify(t.to_line)}`,
        );
      return e;
    },
    Tn = function (t) {
      return t.every(
        (e) => e == null || (e.toString && e.toString().trim() === ""),
      );
    },
    Pa = 13,
    Va = 10,
    $e = { utf8: c.from([239, 187, 191]), utf16le: c.from([255, 254]) },
    Wa = function (t = {}) {
      const e = {
          bytes: 0,
          comment_lines: 0,
          empty_lines: 0,
          invalid_field_length: 0,
          lines: 1,
          records: 0,
        },
        r = In(t);
      return {
        info: e,
        original_options: t,
        options: r,
        state: Ua(r),
        __needMoreData: function (n, i, s) {
          if (s) return !1;
          const { encoding: a, escape: o, quote: l } = this.options,
            {
              quoting: u,
              needMoreDataSize: f,
              recordDelimiterMaxLength: h,
            } = this.state,
            v = i - n - 1,
            S = Math.max(
              f,
              h === 0
                ? c.from(
                    `\r
`,
                    a,
                  ).length
                : h,
              u ? (o === null ? 0 : o.length) + l.length : 0,
              u ? l.length + h : 0,
            );
          return v < S;
        },
        parse: function (n, i, s, a) {
          const {
            bom: o,
            comment_no_infix: l,
            encoding: u,
            from_line: f,
            ltrim: h,
            max_record_size: v,
            raw: S,
            relax_quotes: V,
            rtrim: O,
            skip_empty_lines: G,
            to: M,
            to_line: C,
          } = this.options;
          let {
            comment: T,
            escape: z,
            quote: ee,
            record_delimiter: fr,
          } = this.options;
          const {
            bomSkipped: Qa,
            previousBuf: At,
            rawBuffer: Xa,
            escapeIsQuote: Ka,
          } = this.state;
          let N;
          if (At === void 0)
            if (n === void 0) {
              a();
              return;
            } else N = n;
          else
            At !== void 0 && n === void 0 ? (N = At) : (N = c.concat([At, n]));
          if (Qa === !1)
            if (o === !1) this.state.bomSkipped = !0;
            else if (N.length < 3) {
              if (i === !1) {
                this.state.previousBuf = N;
                return;
              }
            } else {
              for (const j in $e)
                if ($e[j].compare(N, 0, $e[j].length) === 0) {
                  const xe = $e[j].length;
                  (this.state.bufBytesStart += xe),
                    (N = N.slice(xe)),
                    (this.options = In({
                      ...this.original_options,
                      encoding: j,
                    })),
                    ({ comment: T, escape: z, quote: ee } = this.options);
                  break;
                }
              this.state.bomSkipped = !0;
            }
          const dr = N.length;
          let b;
          for (b = 0; b < dr && !this.__needMoreData(b, dr, i); b++) {
            if (
              (this.state.wasRowDelimiter === !0 &&
                (this.info.lines++, (this.state.wasRowDelimiter = !1)),
              C !== -1 && this.info.lines > C)
            ) {
              (this.state.stop = !0), a();
              return;
            }
            this.state.quoting === !1 &&
              fr.length === 0 &&
              this.__autoDiscoverRecordDelimiter(N, b) &&
              (fr = this.options.record_delimiter);
            const j = N[b];
            if (
              (S === !0 && Xa.append(j),
              (j === Pa || j === Va) &&
                this.state.wasRowDelimiter === !1 &&
                (this.state.wasRowDelimiter = !0),
              this.state.escaping === !0)
            )
              this.state.escaping = !1;
            else {
              if (
                z !== null &&
                this.state.quoting === !0 &&
                this.__isEscape(N, b, j) &&
                b + z.length < dr
              )
                if (Ka) {
                  if (this.__isQuote(N, b + z.length)) {
                    (this.state.escaping = !0), (b += z.length - 1);
                    continue;
                  }
                } else {
                  (this.state.escaping = !0), (b += z.length - 1);
                  continue;
                }
              if (this.state.commenting === !1 && this.__isQuote(N, b))
                if (this.state.quoting === !0) {
                  const B = N[b + ee.length],
                    Oe = O && this.__isCharTrimable(N, b + ee.length),
                    de =
                      T !== null && this.__compareBytes(T, N, b + ee.length, B),
                    Ae = this.__isDelimiter(N, b + ee.length, B),
                    Lt =
                      fr.length === 0
                        ? this.__autoDiscoverRecordDelimiter(N, b + ee.length)
                        : this.__isRecordDelimiter(B, N, b + ee.length);
                  if (
                    z !== null &&
                    this.__isEscape(N, b, j) &&
                    this.__isQuote(N, b + z.length)
                  )
                    b += z.length - 1;
                  else if (!B || Ae || Lt || de || Oe) {
                    (this.state.quoting = !1),
                      (this.state.wasQuoting = !0),
                      (b += ee.length - 1);
                    continue;
                  } else if (V === !1) {
                    const Nn = this.__error(
                      new R(
                        "CSV_INVALID_CLOSING_QUOTE",
                        [
                          "Invalid Closing Quote:",
                          `got "${String.fromCharCode(B)}"`,
                          `at line ${this.info.lines}`,
                          "instead of delimiter, record delimiter, trimable character",
                          "(if activated) or comment",
                        ],
                        this.options,
                        this.__infoField(),
                      ),
                    );
                    if (Nn !== void 0) return Nn;
                  } else
                    (this.state.quoting = !1),
                      (this.state.wasQuoting = !0),
                      this.state.field.prepend(ee),
                      (b += ee.length - 1);
                } else if (this.state.field.length !== 0) {
                  if (V === !1) {
                    const B = this.__infoField(),
                      Oe = Object.keys($e)
                        .map((Ae) =>
                          $e[Ae].equals(this.state.field.toString()) ? Ae : !1,
                        )
                        .filter(Boolean)[0],
                      de = this.__error(
                        new R(
                          "INVALID_OPENING_QUOTE",
                          [
                            "Invalid Opening Quote:",
                            `a quote is found on field ${JSON.stringify(B.column)} at line ${B.lines}, value is ${JSON.stringify(this.state.field.toString(u))}`,
                            Oe ? `(${Oe} bom)` : void 0,
                          ],
                          this.options,
                          B,
                          { field: this.state.field },
                        ),
                      );
                    if (de !== void 0) return de;
                  }
                } else {
                  (this.state.quoting = !0), (b += ee.length - 1);
                  continue;
                }
              if (this.state.quoting === !1) {
                const B = this.__isRecordDelimiter(j, N, b);
                if (B !== 0) {
                  if (
                    this.state.commenting &&
                    this.state.wasQuoting === !1 &&
                    this.state.record.length === 0 &&
                    this.state.field.length === 0
                  )
                    this.info.comment_lines++;
                  else {
                    if (
                      this.state.enabled === !1 &&
                      this.info.lines +
                        (this.state.wasRowDelimiter === !0 ? 1 : 0) >=
                        f
                    ) {
                      (this.state.enabled = !0),
                        this.__resetField(),
                        this.__resetRecord(),
                        (b += B - 1);
                      continue;
                    }
                    if (
                      G === !0 &&
                      this.state.wasQuoting === !1 &&
                      this.state.record.length === 0 &&
                      this.state.field.length === 0
                    ) {
                      this.info.empty_lines++, (b += B - 1);
                      continue;
                    }
                    this.info.bytes = this.state.bufBytesStart + b;
                    const Ae = this.__onField();
                    if (Ae !== void 0) return Ae;
                    this.info.bytes = this.state.bufBytesStart + b + B;
                    const Lt = this.__onRecord(s);
                    if (Lt !== void 0) return Lt;
                    if (M !== -1 && this.info.records >= M) {
                      (this.state.stop = !0), a();
                      return;
                    }
                  }
                  (this.state.commenting = !1), (b += B - 1);
                  continue;
                }
                if (this.state.commenting) continue;
                if (
                  T !== null &&
                  (l === !1 ||
                    (this.state.record.length === 0 &&
                      this.state.field.length === 0)) &&
                  this.__compareBytes(T, N, b, j) !== 0
                ) {
                  this.state.commenting = !0;
                  continue;
                }
                const Oe = this.__isDelimiter(N, b, j);
                if (Oe !== 0) {
                  this.info.bytes = this.state.bufBytesStart + b;
                  const de = this.__onField();
                  if (de !== void 0) return de;
                  b += Oe - 1;
                  continue;
                }
              }
            }
            if (
              this.state.commenting === !1 &&
              v !== 0 &&
              this.state.record_length + this.state.field.length > v
            )
              return this.__error(
                new R(
                  "CSV_MAX_RECORD_SIZE",
                  [
                    "Max Record Size:",
                    "record exceed the maximum number of tolerated bytes",
                    `of ${v}`,
                    `at line ${this.info.lines}`,
                  ],
                  this.options,
                  this.__infoField(),
                ),
              );
            const xe =
                h === !1 ||
                this.state.quoting === !0 ||
                this.state.field.length !== 0 ||
                !this.__isCharTrimable(N, b),
              eo = O === !1 || this.state.wasQuoting === !1;
            if (xe === !0 && eo === !0) this.state.field.append(j);
            else {
              if (O === !0 && !this.__isCharTrimable(N, b))
                return this.__error(
                  new R(
                    "CSV_NON_TRIMABLE_CHAR_AFTER_CLOSING_QUOTE",
                    [
                      "Invalid Closing Quote:",
                      "found non trimable byte after quote",
                      `at line ${this.info.lines}`,
                    ],
                    this.options,
                    this.__infoField(),
                  ),
                );
              xe === !1 && (b += this.__isCharTrimable(N, b) - 1);
              continue;
            }
          }
          if (i === !0)
            if (this.state.quoting === !0) {
              const j = this.__error(
                new R(
                  "CSV_QUOTE_NOT_CLOSED",
                  [
                    "Quote Not Closed:",
                    `the parsing is finished with an opening quote at line ${this.info.lines}`,
                  ],
                  this.options,
                  this.__infoField(),
                ),
              );
              if (j !== void 0) return j;
            } else if (
              this.state.wasQuoting === !0 ||
              this.state.record.length !== 0 ||
              this.state.field.length !== 0
            ) {
              this.info.bytes = this.state.bufBytesStart + b;
              const j = this.__onField();
              if (j !== void 0) return j;
              const xe = this.__onRecord(s);
              if (xe !== void 0) return xe;
            } else
              this.state.wasRowDelimiter === !0
                ? this.info.empty_lines++
                : this.state.commenting === !0 && this.info.comment_lines++;
          else
            (this.state.bufBytesStart += b),
              (this.state.previousBuf = N.slice(b));
          this.state.wasRowDelimiter === !0 &&
            (this.info.lines++, (this.state.wasRowDelimiter = !1));
        },
        __onRecord: function (n) {
          const {
              columns: i,
              group_columns_by_name: s,
              encoding: a,
              info: o,
              from: l,
              relax_column_count: u,
              relax_column_count_less: f,
              relax_column_count_more: h,
              raw: v,
              skip_records_with_empty_values: S,
            } = this.options,
            { enabled: V, record: O } = this.state;
          if (V === !1) return this.__resetRecord();
          const G = O.length;
          if (i === !0) {
            if (S === !0 && Tn(O)) {
              this.__resetRecord();
              return;
            }
            return this.__firstLineToColumns(O);
          }
          if (
            (i === !1 &&
              this.info.records === 0 &&
              (this.state.expectedRecordLength = G),
            G !== this.state.expectedRecordLength)
          ) {
            const M =
              i === !1
                ? new R(
                    "CSV_RECORD_INCONSISTENT_FIELDS_LENGTH",
                    [
                      "Invalid Record Length:",
                      `expect ${this.state.expectedRecordLength},`,
                      `got ${G} on line ${this.info.lines}`,
                    ],
                    this.options,
                    this.__infoField(),
                    { record: O },
                  )
                : new R(
                    "CSV_RECORD_INCONSISTENT_COLUMNS",
                    [
                      "Invalid Record Length:",
                      `columns length is ${i.length},`,
                      `got ${G} on line ${this.info.lines}`,
                    ],
                    this.options,
                    this.__infoField(),
                    { record: O },
                  );
            if (
              u === !0 ||
              (f === !0 && G < this.state.expectedRecordLength) ||
              (h === !0 && G > this.state.expectedRecordLength)
            )
              this.info.invalid_field_length++, (this.state.error = M);
            else {
              const C = this.__error(M);
              if (C) return C;
            }
          }
          if (S === !0 && Tn(O)) {
            this.__resetRecord();
            return;
          }
          if (this.state.recordHasError === !0) {
            this.__resetRecord(), (this.state.recordHasError = !1);
            return;
          }
          if ((this.info.records++, l === 1 || this.info.records >= l)) {
            const { objname: M } = this.options;
            if (i !== !1) {
              const C = {};
              for (let T = 0, z = O.length; T < z; T++)
                i[T] === void 0 ||
                  i[T].disabled ||
                  (s === !0 && C[i[T].name] !== void 0
                    ? Array.isArray(C[i[T].name])
                      ? (C[i[T].name] = C[i[T].name].concat(O[T]))
                      : (C[i[T].name] = [C[i[T].name], O[T]])
                    : (C[i[T].name] = O[T]));
              if (v === !0 || o === !0) {
                const T = Object.assign(
                    { record: C },
                    v === !0 ? { raw: this.state.rawBuffer.toString(a) } : {},
                    o === !0 ? { info: this.__infoRecord() } : {},
                  ),
                  z = this.__push(M === void 0 ? T : [C[M], T], n);
                if (z) return z;
              } else {
                const T = this.__push(M === void 0 ? C : [C[M], C], n);
                if (T) return T;
              }
            } else if (v === !0 || o === !0) {
              const C = Object.assign(
                  { record: O },
                  v === !0 ? { raw: this.state.rawBuffer.toString(a) } : {},
                  o === !0 ? { info: this.__infoRecord() } : {},
                ),
                T = this.__push(M === void 0 ? C : [O[M], C], n);
              if (T) return T;
            } else {
              const C = this.__push(M === void 0 ? O : [O[M], O], n);
              if (C) return C;
            }
          }
          this.__resetRecord();
        },
        __firstLineToColumns: function (n) {
          const { firstLineToHeaders: i } = this.state;
          try {
            const s = i === void 0 ? n : i.call(null, n);
            if (!Array.isArray(s))
              return this.__error(
                new R(
                  "CSV_INVALID_COLUMN_MAPPING",
                  [
                    "Invalid Column Mapping:",
                    "expect an array from column function,",
                    `got ${JSON.stringify(s)}`,
                  ],
                  this.options,
                  this.__infoField(),
                  { headers: s },
                ),
              );
            const a = kn(s);
            (this.state.expectedRecordLength = a.length),
              (this.options.columns = a),
              this.__resetRecord();
            return;
          } catch (s) {
            return s;
          }
        },
        __resetRecord: function () {
          this.options.raw === !0 && this.state.rawBuffer.reset(),
            (this.state.error = void 0),
            (this.state.record = []),
            (this.state.record_length = 0);
        },
        __onField: function () {
          const {
              cast: n,
              encoding: i,
              rtrim: s,
              max_record_size: a,
            } = this.options,
            { enabled: o, wasQuoting: l } = this.state;
          if (o === !1) return this.__resetField();
          let u = this.state.field.toString(i);
          if ((s === !0 && l === !1 && (u = u.trimRight()), n === !0)) {
            const [f, h] = this.__cast(u);
            if (f !== void 0) return f;
            u = h;
          }
          this.state.record.push(u),
            a !== 0 &&
              typeof u == "string" &&
              (this.state.record_length += u.length),
            this.__resetField();
        },
        __resetField: function () {
          this.state.field.reset(), (this.state.wasQuoting = !1);
        },
        __push: function (n, i) {
          const { on_record: s } = this.options;
          if (s !== void 0) {
            const a = this.__infoRecord();
            try {
              n = s.call(null, n, a);
            } catch (o) {
              return o;
            }
            if (n == null) return;
          }
          i(n);
        },
        __cast: function (n) {
          const { columns: i, relax_column_count: s } = this.options;
          if (
            Array.isArray(i) === !0 &&
            s &&
            this.options.columns.length <= this.state.record.length
          )
            return [void 0, void 0];
          if (this.state.castField !== null)
            try {
              const o = this.__infoField();
              return [void 0, this.state.castField.call(null, n, o)];
            } catch (o) {
              return [o];
            }
          if (this.__isFloat(n)) return [void 0, parseFloat(n)];
          if (this.options.cast_date !== !1) {
            const o = this.__infoField();
            return [void 0, this.options.cast_date.call(null, n, o)];
          }
          return [void 0, n];
        },
        __isCharTrimable: function (n, i) {
          return ((a, o) => {
            const { timchars: l } = this.state;
            e: for (let u = 0; u < l.length; u++) {
              const f = l[u];
              for (let h = 0; h < f.length; h++)
                if (f[h] !== a[o + h]) continue e;
              return f.length;
            }
            return 0;
          })(n, i);
        },
        __isFloat: function (n) {
          return n - parseFloat(n) + 1 >= 0;
        },
        __compareBytes: function (n, i, s, a) {
          if (n[0] !== a) return 0;
          const o = n.length;
          for (let l = 1; l < o; l++) if (n[l] !== i[s + l]) return 0;
          return o;
        },
        __isDelimiter: function (n, i, s) {
          const { delimiter: a, ignore_last_delimiters: o } = this.options;
          if (
            o === !0 &&
            this.state.record.length === this.options.columns.length - 1
          )
            return 0;
          if (
            o !== !1 &&
            typeof o == "number" &&
            this.state.record.length === o - 1
          )
            return 0;
          e: for (let l = 0; l < a.length; l++) {
            const u = a[l];
            if (u[0] === s) {
              for (let f = 1; f < u.length; f++)
                if (u[f] !== n[i + f]) continue e;
              return u.length;
            }
          }
          return 0;
        },
        __isRecordDelimiter: function (n, i, s) {
          const { record_delimiter: a } = this.options,
            o = a.length;
          e: for (let l = 0; l < o; l++) {
            const u = a[l],
              f = u.length;
            if (u[0] === n) {
              for (let h = 1; h < f; h++) if (u[h] !== i[s + h]) continue e;
              return u.length;
            }
          }
          return 0;
        },
        __isEscape: function (n, i, s) {
          const { escape: a } = this.options;
          if (a === null) return !1;
          const o = a.length;
          if (a[0] === s) {
            for (let l = 0; l < o; l++) if (a[l] !== n[i + l]) return !1;
            return !0;
          }
          return !1;
        },
        __isQuote: function (n, i) {
          const { quote: s } = this.options;
          if (s === null) return !1;
          const a = s.length;
          for (let o = 0; o < a; o++) if (s[o] !== n[i + o]) return !1;
          return !0;
        },
        __autoDiscoverRecordDelimiter: function (n, i) {
          const { encoding: s } = this.options,
            a = [
              c.from(
                `\r
`,
                s,
              ),
              c.from(
                `
`,
                s,
              ),
              c.from("\r", s),
            ];
          e: for (let o = 0; o < a.length; o++) {
            const l = a[o].length;
            for (let u = 0; u < l; u++) if (a[o][u] !== n[i + u]) continue e;
            return (
              this.options.record_delimiter.push(a[o]),
              (this.state.recordDelimiterMaxLength = a[o].length),
              a[o].length
            );
          }
          return 0;
        },
        __error: function (n) {
          const {
              encoding: i,
              raw: s,
              skip_records_with_error: a,
            } = this.options,
            o = typeof n == "string" ? new Error(n) : n;
          if (a) {
            (this.state.recordHasError = !0),
              this.options.on_skip !== void 0 &&
                this.options.on_skip(
                  o,
                  s ? this.state.rawBuffer.toString(i) : void 0,
                );
            return;
          } else return o;
        },
        __infoDataSet: function () {
          return { ...this.info, columns: this.options.columns };
        },
        __infoRecord: function () {
          const { columns: n, raw: i, encoding: s } = this.options;
          return {
            ...this.__infoDataSet(),
            error: this.state.error,
            header: n === !0,
            index: this.state.record.length,
            raw: i ? this.state.rawBuffer.toString(s) : void 0,
          };
        },
        __infoField: function () {
          const { columns: n } = this.options,
            i = Array.isArray(n);
          return {
            ...this.__infoRecord(),
            column:
              i === !0
                ? n.length > this.state.record.length
                  ? n[this.state.record.length].name
                  : null
                : this.state.record.length,
            quoting: this.state.wasQuoting,
          };
        },
      };
    };
  class $a extends K {
    constructor(e = {}) {
      super({ readableObjectMode: !0, ...e, encoding: null }),
        (this.api = Wa({
          on_skip: (r, n) => {
            this.emit("skip", r, n);
          },
          ...e,
        })),
        (this.state = this.api.state),
        (this.options = this.api.options),
        (this.info = this.api.info);
    }
    _transform(e, r, n) {
      if (this.state.stop === !0) return;
      const i = this.api.parse(
        e,
        !1,
        (s) => {
          this.push(s);
        },
        () => {
          this.push(null), this.end(), this.on("end", this.destroy);
        },
      );
      i !== void 0 && (this.state.stop = !0), n(i);
    }
    _flush(e) {
      if (this.state.stop === !0) return;
      const r = this.api.parse(
        void 0,
        !0,
        (n) => {
          this.push(n);
        },
        () => {
          this.push(null), this.on("end", this.destroy);
        },
      );
      e(r);
    }
  }
  const za = function () {
      let t, e, r;
      for (const i in arguments) {
        const s = arguments[i],
          a = typeof s;
        if (t === void 0 && (typeof s == "string" || $(s))) t = s;
        else if (e === void 0 && En(s)) e = s;
        else if (r === void 0 && a === "function") r = s;
        else
          throw new R(
            "CSV_INVALID_ARGUMENT",
            ["Invalid argument:", `got ${JSON.stringify(s)} at index ${i}`],
            e || {},
          );
      }
      const n = new $a(e);
      if (r) {
        const i = e === void 0 || e.objname === void 0 ? [] : {};
        n.on("readable", function () {
          let s;
          for (; (s = this.read()) !== null; )
            e === void 0 || e.objname === void 0 ? i.push(s) : (i[s[0]] = s[1]);
        }),
          n.on("error", function (s) {
            r(s, void 0, n.api.__infoDataSet());
          }),
          n.on("end", function () {
            r(void 0, i, n.api.__infoDataSet());
          });
      }
      if (t !== void 0) {
        const i = function () {
          n.write(t), n.end();
        };
        typeof setImmediate == "function" ? setImmediate(i) : setTimeout(i, 0);
      }
      return n;
    },
    Ya = async (t, e) => {
      const r = await t();
      return new Promise((n, i) => {
        const s = za({ delimiter: "	", columns: !0, bom: !0 }),
          a = () => {
            const l = s.read();
            l !== null && (e(l), a());
          },
          o = s
            .on("error", (l) => {
              i(l);
            })
            .on("readable", a)
            .on("end", n);
        o.write(r), o.end();
      });
    },
    Fa = async (t) => {
      const e = await fetch(t);
      if (!e.ok) throw new Error(`Failed to fetch CSV from: ${t}`);
      return e.text();
    },
    Ja = async (t, e) => Ya(() => Fa(t), e),
    qa = (t) => (e) => t.parse(e),
    Ga = (t, e) => ({
      process: (r) => {
        const n = qa(t)(r);
        e.add(n);
      },
      getResults: () => e.getResults(),
    }),
    cr = async ({ url: t, schema: e, getKey: r }) => {
      const n = Gi(r),
        i = Ga(e, n);
      return await Ja(t, i.process), i.getResults();
    };
  var Ha = Object.freeze({
    __proto__: null,
    loadData: async () => {
      const t = cr({
          url: new URL("/assets/keys-RwH2P3VD.tsv", self.location.href).href,
          schema: Fi($t),
          getKey: (o) => o.index,
        }),
        r = await cr({
          url: new URL(
            "data:text/tab-separated-values;base64,Y2x1c3Rlcl9pZAlsYWJlbAozOTg4CU9zb2Jvd2/Fm8SHIGkgcsOzxbxuaWNlIG1pxJlkenlvc29ibmljemUgendpZXJ6xIV0Cjk5OTk5OQlGSVpZS0EgPj4+IEZPVE9OSUtBLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0KMzgJU3Bla3Ryb3Nrb3BpYSBMSUJTCjMxMDgxCUdlbmVyb3dhbmllIHd5xbxzenljaCBoYXJtb25pY3pueWNoCjIyMzUJUGxhem1hIG5pc2tvdGVtcGVyYXR1cm93YQoxNTM5CUxhc2Vyb3dhIHNwZWt0cm9za29waWEgYWJzb3JwY3lqbmEKNzU2CUt3YW50b3dlIHVrxYJhZHkgb3B0b21lY2hhbmljem5lCjIzNTY1CU9ibGljemVuaWEga3dhbnRvd2UgdyB1a8WCYWRhY2ggZm90b25pY3pueWNoCjY0OTAJRm90b25pa2EgdG9wb2xvZ2ljem5hCjEwNTAJU3plcm9rb3Bhc21vd2UgYWJzb3JiZXJ5IG1ldGFtYXRlcmlhxYJvd2UKOTU4CUxhc2VyeSB3xYLDs2tub3dlIHd5c29raWVqIG1vY3kKNDIzMAlDenVqbmlraSDFm3dpYXTFgm93b2Rvd2UKODIwMwlSb3pwcm9zem9uZSB3eWtyeXdhbmllIGFrdXN0eWN6bmUgKERBUykKNTAzCUt1Yml0eSBuYWRwcnpld29kbmlrb3dlCjExMjQ1CU1hZ25ldG9tZXRyeSBwb21wb3dhbmUgb3B0eWN6bmllIChPUE0pCjcyNAlNZXRhcG93aWVyemNobmllIGkgbWV0YXNvY3pld2tpCjQ0NAlPcmJpdGFsbnkgbW9tZW50IHDEmWR1IMWbd2lhdMWCYQo0NTcJTWV0YW1hdGVyaWHFgnkgdGVybWljem5lCjE2NDMyCVBvZHdvZG5hIGtvbXVuaWthY2phIGJlenByemV3b2Rvd2EKMTA5MTYJT2JyYXpvd2FuaWUgdyBvxZtyb2RrYWNoIHJvenByYXN6YWrEhWN5Y2gKMTk0NQlXecWbd2lldGxhY3plIGhvbG9ncmFmaWN6bmUKMzE3MglNYXRlcmlhIGFrdHl3bmEKOTk5OTk5CU3Dk1pHLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLQozMDI4OAlBbm9zbWlhIGkgaW5uZSB6YWJ1cnplbmlhIHfEmWNodQo5MTg4CVN1YnN0YW5jamUgcHN5Y2hvZGVsaWN6bmUKMzc2OQlLZXRhbWluYSBpIGVza2V0YW1pbmEgdyBsZWN6ZW5pdSBkZXByZXNqaQo1OTAzCU1pa3JvYmlvbSB3IGRlcHJlc2ppIGkgaW5ueWNoIHphYnVyemVuaWFjaCBwc3ljaGljem55Y2gKNTQwOAlNaWtyb2dsZWoKMTU3OTcJRXBpZ2VuZXR5Y3puZSBtYXJrZXJ5IHN0YXJ6ZW5pYQo3NDE3CUthbm5hYmlkaW9sIChDQkQpCjY3NjkJR8WCxJlib2tpZSBzaWVjaSBuZXVyb25vd2UgdyBiYWRhbmlhY2ggQWx6aGVpbWVyYQo1MzIJUHJ6ZXpjemFzemtvd2Egc3R5bXVsYWNqYSBwcsSFZGVtIHN0YcWCeW0gKHREQ1MpCjM4OAlPYnJhem93YW5pZSBtw7N6Z3UgcG9kY3phcyB3eW9icmHFvGFuaWEgcnVjaG93ZWdvCjMzNzAJUm96cG96bmF3YW5pZSBlbW9jamkgbmEgcG9kc3Rhd2llIEVFRwo3NDU2CVBvY3p1Y2llIGNpYcWCYSB3IHdpcnR1YWxuZWogcnplY3p5d2lzdG/Fm2NpCjk5OTk5OQlDSEVNSUEgPj4+IE1BVEVSSUHFgVkgTUnEmEtLSUUgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tCjI5MDYxCUh5ZHJvxbxlbGUgcHJ6ZXdvZHrEhWNlCjQ0MjU0CUh5ZHJvxbxlbGUgdyBsZWN6ZW5pdSByYW4KMjE5MAlEcnVrIDNEIG1hdGVyaWHFgsOzdyBiaW9sb2dpY3pueWNoIGkgYmlva29tcGF0eWJpbG55Y2gKOTQyMwlEcnVrIDREIGkgbWF0ZXJpYcWCeSBha3R5d25lCjMxMjEJRHluYW1pa2EgcG9saW1lcsOzdywgcG9saW1lcnkgc2Ftb2xlY3rEhWNlLCB3aXRyeW1lcnkKNTUwMAlJbsW8eW5pZXJpYSBjaGVtaWN6bmEgbGlnbmlueSB3IGJpb3JhbmlmZXJpYWNoCjQxNAlOYW5va3J5c3p0YcWCeSBjZWx1bG96eSAoQ05DKQoyNwlJbsW8eW5pZXJpYSBjaGVtaWN6bmEgYmlvbWFzeSBkcnpld25lago2NTUwCU1hdGVyaWHFgnkgaSB6d2nEhXpraSBwb2Nob2R6ZW5pYSBuYXR1cmFsbmVnbyB3IHByb2R1a2NqaSBvcGFrb3dhxYQK",
            self.location.href,
          ).href,
          schema: Ji($t),
          getKey: (o) => o.clusterId,
        }),
        [n, i] = await Promise.all([
          t,
          cr({
            url: new URL("/assets/data-NikpPyue.tsv", self.location.href).href,
            schema: qi($t, r),
            getKey: (o) => o.clusterId,
          }),
        ]),
        s = [...r.values()]
          .map(({ clusterId: o, label: l }) => {
            const u = i.get(o);
            return {
              x: (u == null ? void 0 : u.x) ?? NaN,
              y: (u == null ? void 0 : u.y) ?? NaN,
              clusterId: o,
              label: l,
            };
          })
          .filter(({ x: o, y: l }) => !Number.isNaN(o) && !Number.isNaN(l)),
        a = new Map(
          [...i.entries()].sort(
            ([, o], [, l]) => l.numRecentArticles - o.numRecentArticles,
          ),
        );
      return { concepts: n, labels: s, dataPoints: a };
    },
  });
  jt(Ha);
})();
