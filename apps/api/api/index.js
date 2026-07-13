var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../../node_modules/.pnpm/dayjs@1.11.21/node_modules/dayjs/dayjs.min.js
var require_dayjs_min = __commonJS({
  "../../node_modules/.pnpm/dayjs@1.11.21/node_modules/dayjs/dayjs.min.js"(exports, module) {
    !function(t, e) {
      "object" == typeof exports && "undefined" != typeof module ? module.exports = e() : "function" == typeof define && define.amd ? define(e) : (t = "undefined" != typeof globalThis ? globalThis : t || self).dayjs = e();
    }(exports, function() {
      "use strict";
      var t = 1e3, e = 6e4, n = 36e5, r = "millisecond", i = "second", s = "minute", u = "hour", a = "day", o = "week", c = "month", f = "quarter", h = "year", d = "date", l = "Invalid Date", $ = /^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[Tt\s]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/, y = /\[([^\]]+)]|YYYY|YY|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g, M = { name: "en", weekdays: "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"), months: "January_February_March_April_May_June_July_August_September_October_November_December".split("_"), ordinal: function(t2) {
        var e2 = ["th", "st", "nd", "rd"], n2 = t2 % 100;
        return "[" + t2 + (e2[(n2 - 20) % 10] || e2[n2] || e2[0]) + "]";
      } }, m = function(t2, e2, n2) {
        var r2 = String(t2);
        return !r2 || r2.length >= e2 ? t2 : "" + Array(e2 + 1 - r2.length).join(n2) + t2;
      }, v = { s: m, z: function(t2) {
        var e2 = -t2.utcOffset(), n2 = Math.abs(e2), r2 = Math.floor(n2 / 60), i2 = n2 % 60;
        return (e2 <= 0 ? "+" : "-") + m(r2, 2, "0") + ":" + m(i2, 2, "0");
      }, m: function t2(e2, n2) {
        if (e2.date() < n2.date()) return -t2(n2, e2);
        var r2 = 12 * (n2.year() - e2.year()) + (n2.month() - e2.month()), i2 = e2.clone().add(r2, c), s2 = n2 - i2 < 0, u2 = e2.clone().add(r2 + (s2 ? -1 : 1), c);
        return +(-(r2 + (n2 - i2) / (s2 ? i2 - u2 : u2 - i2)) || 0);
      }, a: function(t2) {
        return t2 < 0 ? Math.ceil(t2) || 0 : Math.floor(t2);
      }, p: function(t2) {
        return { M: c, y: h, w: o, d: a, D: d, h: u, m: s, s: i, ms: r, Q: f }[t2] || String(t2 || "").toLowerCase().replace(/s$/, "");
      }, u: function(t2) {
        return void 0 === t2;
      } }, g = "en", D = {};
      D[g] = M;
      var p = "$isDayjsObject", S = function(t2) {
        return t2 instanceof _ || !(!t2 || !t2[p]);
      }, w = function t2(e2, n2, r2) {
        var i2;
        if (!e2) return g;
        if ("string" == typeof e2) {
          var s2 = e2.toLowerCase();
          D[s2] && (i2 = s2), n2 && (D[s2] = n2, i2 = s2);
          var u2 = e2.split("-");
          if (!i2 && u2.length > 1) return t2(u2[0]);
        } else {
          var a2 = e2.name;
          D[a2] = e2, i2 = a2;
        }
        return !r2 && i2 && (g = i2), i2 || !r2 && g;
      }, O = function(t2, e2) {
        if (S(t2)) return t2.clone();
        var n2 = "object" == typeof e2 ? e2 : {};
        return n2.date = t2, n2.args = arguments, new _(n2);
      }, b = v;
      b.l = w, b.i = S, b.w = function(t2, e2) {
        return O(t2, { locale: e2.$L, utc: e2.$u, x: e2.$x, $offset: e2.$offset });
      };
      var _ = function() {
        function M2(t2) {
          this.$L = w(t2.locale, null, true), this.parse(t2), this.$x = this.$x || t2.x || {}, this[p] = true;
        }
        var m2 = M2.prototype;
        return m2.parse = function(t2) {
          this.$d = function(t3) {
            var e2 = t3.date, n2 = t3.utc;
            if (null === e2) return /* @__PURE__ */ new Date(NaN);
            if (b.u(e2)) return /* @__PURE__ */ new Date();
            if (e2 instanceof Date) return new Date(e2);
            if ("string" == typeof e2 && !/Z$/i.test(e2)) {
              var r2 = e2.match($);
              if (r2) {
                var i2 = r2[2] - 1 || 0, s2 = (r2[7] || "0").substring(0, 3);
                return n2 ? new Date(Date.UTC(r2[1], i2, r2[3] || 1, r2[4] || 0, r2[5] || 0, r2[6] || 0, s2)) : new Date(r2[1], i2, r2[3] || 1, r2[4] || 0, r2[5] || 0, r2[6] || 0, s2);
              }
            }
            return new Date(e2);
          }(t2), this.init();
        }, m2.init = function() {
          var t2 = this.$d;
          this.$y = t2.getFullYear(), this.$M = t2.getMonth(), this.$D = t2.getDate(), this.$W = t2.getDay(), this.$H = t2.getHours(), this.$m = t2.getMinutes(), this.$s = t2.getSeconds(), this.$ms = t2.getMilliseconds();
        }, m2.$utils = function() {
          return b;
        }, m2.isValid = function() {
          return !(this.$d.toString() === l);
        }, m2.isSame = function(t2, e2) {
          var n2 = O(t2);
          return this.startOf(e2) <= n2 && n2 <= this.endOf(e2);
        }, m2.isAfter = function(t2, e2) {
          return O(t2) < this.startOf(e2);
        }, m2.isBefore = function(t2, e2) {
          return this.endOf(e2) < O(t2);
        }, m2.$g = function(t2, e2, n2) {
          return b.u(t2) ? this[e2] : this.set(n2, t2);
        }, m2.unix = function() {
          return Math.floor(this.valueOf() / 1e3);
        }, m2.valueOf = function() {
          return this.$d.getTime();
        }, m2.startOf = function(t2, e2) {
          var n2 = this, r2 = !!b.u(e2) || e2, f2 = b.p(t2), l2 = function(t3, e3) {
            var i2 = b.w(n2.$u ? Date.UTC(n2.$y, e3, t3) : new Date(n2.$y, e3, t3), n2);
            return r2 ? i2 : i2.endOf(a);
          }, $2 = function(t3, e3) {
            return b.w(n2.toDate()[t3].apply(n2.toDate("s"), (r2 ? [0, 0, 0, 0] : [23, 59, 59, 999]).slice(e3)), n2);
          }, y2 = this.$W, M3 = this.$M, m3 = this.$D, v2 = "set" + (this.$u ? "UTC" : "");
          switch (f2) {
            case h:
              return r2 ? l2(1, 0) : l2(31, 11);
            case c:
              return r2 ? l2(1, M3) : l2(0, M3 + 1);
            case o:
              var g2 = this.$locale().weekStart || 0, D2 = (y2 < g2 ? y2 + 7 : y2) - g2;
              return l2(r2 ? m3 - D2 : m3 + (6 - D2), M3);
            case a:
            case d:
              return $2(v2 + "Hours", 0);
            case u:
              return $2(v2 + "Minutes", 1);
            case s:
              return $2(v2 + "Seconds", 2);
            case i:
              return $2(v2 + "Milliseconds", 3);
            default:
              return this.clone();
          }
        }, m2.endOf = function(t2) {
          return this.startOf(t2, false);
        }, m2.$set = function(t2, e2) {
          var n2, o2 = b.p(t2), f2 = "set" + (this.$u ? "UTC" : ""), l2 = (n2 = {}, n2[a] = f2 + "Date", n2[d] = f2 + "Date", n2[c] = f2 + "Month", n2[h] = f2 + "FullYear", n2[u] = f2 + "Hours", n2[s] = f2 + "Minutes", n2[i] = f2 + "Seconds", n2[r] = f2 + "Milliseconds", n2)[o2], $2 = o2 === a ? this.$D + (e2 - this.$W) : e2;
          if (o2 === c || o2 === h) {
            var y2 = this.clone().set(d, 1);
            y2.$d[l2]($2), y2.init(), this.$d = y2.set(d, Math.min(this.$D, y2.daysInMonth())).$d;
          } else l2 && this.$d[l2]($2);
          return this.init(), this;
        }, m2.set = function(t2, e2) {
          return this.clone().$set(t2, e2);
        }, m2.get = function(t2) {
          return this[b.p(t2)]();
        }, m2.add = function(r2, f2) {
          var d2, l2 = this;
          r2 = Number(r2);
          var $2 = b.p(f2), y2 = function(t2) {
            var e2 = O(l2);
            return b.w(e2.date(e2.date() + Math.round(t2 * r2)), l2);
          };
          if ($2 === c) return this.set(c, this.$M + r2);
          if ($2 === h) return this.set(h, this.$y + r2);
          if ($2 === a) return y2(1);
          if ($2 === o) return y2(7);
          var M3 = (d2 = {}, d2[s] = e, d2[u] = n, d2[i] = t, d2)[$2] || 1, m3 = this.$d.getTime() + r2 * M3;
          return b.w(m3, this);
        }, m2.subtract = function(t2, e2) {
          return this.add(-1 * t2, e2);
        }, m2.format = function(t2) {
          var e2 = this, n2 = this.$locale();
          if (!this.isValid()) return n2.invalidDate || l;
          var r2 = t2 || "YYYY-MM-DDTHH:mm:ssZ", i2 = b.z(this), s2 = this.$H, u2 = this.$m, a2 = this.$M, o2 = n2.weekdays, c2 = n2.months, f2 = n2.meridiem, h2 = function(t3, n3, i3, s3) {
            return t3 && (t3[n3] || t3(e2, r2)) || i3[n3].slice(0, s3);
          }, d2 = function(t3) {
            return b.s(s2 % 12 || 12, t3, "0");
          }, $2 = f2 || function(t3, e3, n3) {
            var r3 = t3 < 12 ? "AM" : "PM";
            return n3 ? r3.toLowerCase() : r3;
          };
          return r2.replace(y, function(t3, r3) {
            return r3 || function(t4) {
              switch (t4) {
                case "YY":
                  return String(e2.$y).slice(-2);
                case "YYYY":
                  return b.s(e2.$y, 4, "0");
                case "M":
                  return a2 + 1;
                case "MM":
                  return b.s(a2 + 1, 2, "0");
                case "MMM":
                  return h2(n2.monthsShort, a2, c2, 3);
                case "MMMM":
                  return h2(c2, a2);
                case "D":
                  return e2.$D;
                case "DD":
                  return b.s(e2.$D, 2, "0");
                case "d":
                  return String(e2.$W);
                case "dd":
                  return h2(n2.weekdaysMin, e2.$W, o2, 2);
                case "ddd":
                  return h2(n2.weekdaysShort, e2.$W, o2, 3);
                case "dddd":
                  return o2[e2.$W];
                case "H":
                  return String(s2);
                case "HH":
                  return b.s(s2, 2, "0");
                case "h":
                  return d2(1);
                case "hh":
                  return d2(2);
                case "a":
                  return $2(s2, u2, true);
                case "A":
                  return $2(s2, u2, false);
                case "m":
                  return String(u2);
                case "mm":
                  return b.s(u2, 2, "0");
                case "s":
                  return String(e2.$s);
                case "ss":
                  return b.s(e2.$s, 2, "0");
                case "SSS":
                  return b.s(e2.$ms, 3, "0");
                case "Z":
                  return i2;
              }
              return null;
            }(t3) || i2.replace(":", "");
          });
        }, m2.utcOffset = function() {
          return 15 * -Math.round(this.$d.getTimezoneOffset() / 15);
        }, m2.diff = function(r2, d2, l2) {
          var $2, y2 = this, M3 = b.p(d2), m3 = O(r2), v2 = (m3.utcOffset() - this.utcOffset()) * e, g2 = this - m3, D2 = function() {
            return b.m(y2, m3);
          };
          switch (M3) {
            case h:
              $2 = D2() / 12;
              break;
            case c:
              $2 = D2();
              break;
            case f:
              $2 = D2() / 3;
              break;
            case o:
              $2 = (g2 - v2) / 6048e5;
              break;
            case a:
              $2 = (g2 - v2) / 864e5;
              break;
            case u:
              $2 = g2 / n;
              break;
            case s:
              $2 = g2 / e;
              break;
            case i:
              $2 = g2 / t;
              break;
            default:
              $2 = g2;
          }
          return l2 ? $2 : b.a($2);
        }, m2.daysInMonth = function() {
          return this.endOf(c).$D;
        }, m2.$locale = function() {
          return D[this.$L];
        }, m2.locale = function(t2, e2) {
          if (!t2) return this.$L;
          var n2 = this.clone(), r2 = w(t2, e2, true);
          return r2 && (n2.$L = r2), n2;
        }, m2.clone = function() {
          return b.w(this.$d, this);
        }, m2.toDate = function() {
          return new Date(this.valueOf());
        }, m2.toJSON = function() {
          return this.isValid() ? this.toISOString() : null;
        }, m2.toISOString = function() {
          return this.$d.toISOString();
        }, m2.toString = function() {
          return this.$d.toUTCString();
        }, M2;
      }(), Y = _.prototype;
      return O.prototype = Y, [["$ms", r], ["$s", i], ["$m", s], ["$H", u], ["$W", a], ["$M", c], ["$y", h], ["$D", d]].forEach(function(t2) {
        Y[t2[1]] = function(e2) {
          return this.$g(e2, t2[0], t2[1]);
        };
      }), O.extend = function(t2, e2) {
        return t2.$i || (t2(e2, _, O), t2.$i = true), O;
      }, O.locale = w, O.isDayjs = S, O.unix = function(t2) {
        return O(1e3 * t2);
      }, O.en = D[g], O.Ls = D, O.p = {}, O;
    });
  }
});

// ../../node_modules/.pnpm/dayjs@1.11.21/node_modules/dayjs/plugin/customParseFormat.js
var require_customParseFormat = __commonJS({
  "../../node_modules/.pnpm/dayjs@1.11.21/node_modules/dayjs/plugin/customParseFormat.js"(exports, module) {
    !function(e, t) {
      "object" == typeof exports && "undefined" != typeof module ? module.exports = t() : "function" == typeof define && define.amd ? define(t) : (e = "undefined" != typeof globalThis ? globalThis : e || self).dayjs_plugin_customParseFormat = t();
    }(exports, function() {
      "use strict";
      var e = { LTS: "h:mm:ss A", LT: "h:mm A", L: "MM/DD/YYYY", LL: "MMMM D, YYYY", LLL: "MMMM D, YYYY h:mm A", LLLL: "dddd, MMMM D, YYYY h:mm A" }, t = /(\[[^[]*\])|([-_:/.,()\s]+)|(A|a|Q|YYYY|YY?|ww?|MM?M?M?|Do|DD?|hh?|HH?|mm?|ss?|S{1,3}|z|ZZ?)/g, n = /\d/, r = /\d\d/, i = /\d\d?/, o = /\d*[^-_:/,()\s\d]+/, s = {}, a = function(e2) {
        return (e2 = +e2) + (e2 > 68 ? 1900 : 2e3);
      };
      var f = function(e2) {
        return function(t2) {
          this[e2] = +t2;
        };
      }, h = [/[+-]\d\d:?(\d\d)?|Z/, function(e2) {
        (this.zone || (this.zone = {})).offset = function(e3) {
          if (!e3) return 0;
          if ("Z" === e3) return 0;
          var t2 = e3.match(/([+-]|\d\d)/g), n2 = 60 * t2[1] + (+t2[2] || 0);
          return 0 === n2 ? 0 : "+" === t2[0] ? -n2 : n2;
        }(e2);
      }], u = function(e2) {
        var t2 = s[e2];
        return t2 && (t2.indexOf ? t2 : t2.s.concat(t2.f));
      }, d = function(e2, t2) {
        var n2, r2 = s.meridiem;
        if (r2) {
          for (var i2 = 1; i2 <= 24; i2 += 1) if (e2.indexOf(r2(i2, 0, t2)) > -1) {
            n2 = i2 > 12;
            break;
          }
        } else n2 = e2 === (t2 ? "pm" : "PM");
        return n2;
      }, c = { A: [o, function(e2) {
        this.afternoon = d(e2, false);
      }], a: [o, function(e2) {
        this.afternoon = d(e2, true);
      }], Q: [n, function(e2) {
        this.month = 3 * (e2 - 1) + 1;
      }], S: [n, function(e2) {
        this.milliseconds = 100 * +e2;
      }], SS: [r, function(e2) {
        this.milliseconds = 10 * +e2;
      }], SSS: [/\d{3}/, function(e2) {
        this.milliseconds = +e2;
      }], s: [i, f("seconds")], ss: [i, f("seconds")], m: [i, f("minutes")], mm: [i, f("minutes")], H: [i, f("hours")], h: [i, f("hours")], HH: [i, f("hours")], hh: [i, f("hours")], D: [i, f("day")], DD: [r, f("day")], Do: [o, function(e2) {
        var t2 = s.ordinal, n2 = e2.match(/\d+/);
        if (this.day = n2[0], t2) for (var r2 = 1; r2 <= 31; r2 += 1) t2(r2).replace(/\[|\]/g, "") === e2 && (this.day = r2);
      }], w: [i, f("week")], ww: [r, f("week")], M: [i, f("month")], MM: [r, f("month")], MMM: [o, function(e2) {
        var t2 = u("months"), n2 = (u("monthsShort") || t2.map(function(e3) {
          return e3.slice(0, 3);
        })).indexOf(e2) + 1;
        if (n2 < 1) throw new Error();
        this.month = n2 % 12 || n2;
      }], MMMM: [o, function(e2) {
        var t2 = u("months").indexOf(e2) + 1;
        if (t2 < 1) throw new Error();
        this.month = t2 % 12 || t2;
      }], Y: [/[+-]?\d+/, f("year")], YY: [r, function(e2) {
        this.year = a(e2);
      }], YYYY: [/\d{4}/, f("year")], Z: h, ZZ: h };
      function l(n2) {
        var r2, i2;
        r2 = n2, i2 = s && s.formats;
        for (var o2 = (n2 = r2.replace(/(\[[^\]]+])|(LTS?|l{1,4}|L{1,4})/g, function(t2, n3, r3) {
          var o3 = r3 && r3.toUpperCase();
          return n3 || i2[r3] || e[r3] || i2[o3].replace(/(\[[^\]]+])|(MMMM|MM|DD|dddd)/g, function(e2, t3, n4) {
            return t3 || n4.slice(1);
          });
        })).match(t), a2 = o2.length, f2 = 0; f2 < a2; f2 += 1) {
          var h2 = o2[f2], u2 = c[h2], d2 = u2 && u2[0], l2 = u2 && u2[1];
          o2[f2] = l2 ? { regex: d2, parser: l2 } : h2.replace(/^\[|\]$/g, "");
        }
        return function(e2) {
          for (var t2 = {}, n3 = 0, r3 = 0; n3 < a2; n3 += 1) {
            var i3 = o2[n3];
            if ("string" == typeof i3) r3 += i3.length;
            else {
              var s2 = i3.regex, f3 = i3.parser, h3 = e2.slice(r3), u3 = s2.exec(h3)[0];
              f3.call(t2, u3), e2 = e2.replace(u3, "");
            }
          }
          return function(e3) {
            var t3 = e3.afternoon;
            if (void 0 !== t3) {
              var n4 = e3.hours;
              t3 ? n4 < 12 && (e3.hours += 12) : 12 === n4 && (e3.hours = 0), delete e3.afternoon;
            }
          }(t2), t2;
        };
      }
      return function(e2, t2, n2) {
        n2.p.customParseFormat = true, e2 && e2.parseTwoDigitYear && (a = e2.parseTwoDigitYear);
        var r2 = t2.prototype, i2 = r2.parse;
        r2.parse = function(e3) {
          var t3 = e3.date, r3 = e3.utc, o2 = e3.args;
          this.$u = r3;
          var a2 = o2[1];
          if ("string" == typeof a2) {
            var f2 = true === o2[2], h2 = true === o2[3], u2 = f2 || h2, d2 = o2[2];
            h2 && (d2 = o2[2]), s = this.$locale(), !f2 && d2 && (s = n2.Ls[d2]), this.$d = function(e4, t4, n3, r4) {
              try {
                if (["x", "X"].indexOf(t4) > -1) return new Date(("X" === t4 ? 1e3 : 1) * e4);
                var i3 = l(t4)(e4), o3 = i3.year, s2 = i3.month, a3 = i3.day, f3 = i3.hours, h3 = i3.minutes, u3 = i3.seconds, d3 = i3.milliseconds, c3 = i3.zone, m2 = i3.week, M2 = /* @__PURE__ */ new Date(), Y = a3 || (o3 || s2 ? 1 : M2.getDate()), p = o3 || M2.getFullYear(), v = 0;
                o3 && !s2 || (v = s2 > 0 ? s2 - 1 : M2.getMonth());
                var D, w = f3 || 0, g = h3 || 0, y = u3 || 0, L = d3 || 0;
                return c3 ? new Date(Date.UTC(p, v, Y, w, g, y, L + 60 * c3.offset * 1e3)) : n3 ? new Date(Date.UTC(p, v, Y, w, g, y, L)) : (D = new Date(p, v, Y, w, g, y, L), m2 && (D = r4(D).week(m2).toDate()), D);
              } catch (e5) {
                return /* @__PURE__ */ new Date("");
              }
            }(t3, a2, r3, n2), this.init(), d2 && true !== d2 && (this.$L = this.locale(d2).$L), u2 && t3 != this.format(a2) && (this.$d = /* @__PURE__ */ new Date("")), s = {};
          } else if (a2 instanceof Array) for (var c2 = a2.length, m = 1; m <= c2; m += 1) {
            o2[1] = a2[m - 1];
            var M = n2.apply(this, o2);
            if (M.isValid()) {
              this.$d = M.$d, this.$L = M.$L, this.init();
              break;
            }
            m === c2 && (this.$d = /* @__PURE__ */ new Date(""));
          }
          else i2.call(this, e3);
        };
      };
    });
  }
});

// src/app.ts
import express from "express";
import cors from "cors";

// src/auth.ts
import crypto from "node:crypto";

// ../../packages/db/dist/client.js
import pg from "pg";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";
dotenv.config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../.env")
});
dotenv.config();
pg.types.setTypeParser(1700, (v) => parseFloat(v));
var pool = null;
function sslConfig(connectionString) {
  if (process.env.PGSSLMODE === "disable")
    return void 0;
  const managedHost = /supabase\.(co|com)|render\.com|amazonaws\.com|neon\.tech/.test(connectionString);
  if (managedHost || process.env.PGSSLMODE === "require") {
    return { rejectUnauthorized: false };
  }
  return void 0;
}
function getPool() {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url)
      throw new Error("DATABASE_URL is not set (copy .env.example to .env)");
    pool = new pg.Pool({
      connectionString: url,
      ssl: sslConfig(url),
      // Serverless functions (Vercel sets VERCEL=1) run many short-lived
      // instances concurrently — a small per-instance pool avoids
      // exhausting Supabase's pgbouncer connection slots. A persistent
      // process (local dev, a worker on Railway/Render/Fly) can hold a
      // normal-sized pool.
      max: process.env.VERCEL ? 1 : Number(process.env.PG_POOL_MAX ?? 10)
    });
  }
  return pool;
}
async function query(text, params = []) {
  const res = await getPool().query(text, params);
  return res.rows;
}
async function queryOne(text, params = []) {
  const rows = await query(text, params);
  return rows[0] ?? null;
}
async function withTransaction(fn) {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// ../../packages/db/dist/repos.js
var mapTenant = (r) => ({
  id: r.id,
  name: r.name,
  config: r.config,
  whatsappNumber: r.whatsapp_number,
  apiKey: r.api_key,
  createdAt: r.created_at
});
var mapProfile = (r) => ({
  id: r.id,
  tenantId: r.tenant_id,
  phone: r.phone,
  traits: r.traits,
  createdAt: r.created_at
});
var mapFeatures = (r) => ({
  profileId: r.profile_id,
  tenantId: r.tenant_id,
  recencyDays: r.recency_days,
  frequency90d: r.frequency_90d,
  monetaryLtv: Number(r.monetary_ltv),
  categoryAffinity: r.category_affinity,
  festivalBuyer: r.festival_buyer,
  lastFestivalBasket: r.last_festival_basket,
  reorderCadenceDays: r.reorder_cadence_days,
  favoriteItem: r.favorite_item,
  computedAt: r.computed_at
});
var mapSegment = (r) => ({
  id: r.id,
  tenantId: r.tenant_id,
  name: r.name,
  rule: r.rule,
  campaignType: r.campaign_type,
  description: r.description ?? null,
  source: r.source ?? "standard"
});
var mapCampaign = (r) => ({
  id: r.id,
  tenantId: r.tenant_id,
  segmentId: r.segment_id,
  status: r.status,
  generatedCopy: r.generated_copy,
  audienceSize: r.audience_size,
  createdAt: r.created_at,
  approvedAt: r.approved_at,
  approvedBy: r.approved_by,
  callListCsv: r.call_list_csv
});
var mapMessage = (r) => ({
  id: r.id,
  campaignId: r.campaign_id,
  profileId: r.profile_id,
  channel: r.channel,
  renderedText: r.rendered_text,
  status: r.status,
  isControl: r.is_control,
  redemptionCode: r.redemption_code,
  sentAt: r.sent_at
});
var mapUpload = (r) => ({
  id: r.id,
  tenantId: r.tenant_id,
  filename: r.filename,
  status: r.status,
  rowsProcessed: r.rows_processed,
  errorLog: r.error_log,
  uploadedAt: r.uploaded_at
});
async function getTenantBySlug(slug) {
  const row = await queryOne(`SELECT * FROM tenants WHERE slug = $1`, [slug]);
  return row ? mapTenant(row) : null;
}
async function getTenantByApiKey(apiKey) {
  const row = await queryOne(`SELECT * FROM tenants WHERE api_key = $1`, [apiKey]);
  return row ? mapTenant(row) : null;
}
async function getTenantById(id) {
  const row = await queryOne(`SELECT * FROM tenants WHERE id = $1`, [id]);
  return row ? mapTenant(row) : null;
}
async function upsertProfile(tenantId, phone, traits) {
  const row = await queryOne(`INSERT INTO profiles (tenant_id, phone, traits)
     VALUES ($1, $2, $3)
     ON CONFLICT (tenant_id, phone)
       DO UPDATE SET traits = profiles.traits || EXCLUDED.traits
     RETURNING *`, [tenantId, phone, JSON.stringify(traits)]);
  return mapProfile(row);
}
async function getProfile(tenantId, profileId) {
  const row = await queryOne(`SELECT * FROM profiles WHERE tenant_id = $1 AND id = $2`, [tenantId, profileId]);
  return row ? mapProfile(row) : null;
}
async function getProfilesByIds(tenantId, ids) {
  if (ids.length === 0)
    return [];
  const rows = await query(`SELECT * FROM profiles WHERE tenant_id = $1 AND id = ANY($2::uuid[])`, [tenantId, ids]);
  return rows.map(mapProfile);
}
async function insertEvent(tenantId, profileId, e) {
  await query(`INSERT INTO events (tenant_id, profile_id, location_id, event_type, items, amount, ts)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`, [tenantId, profileId, e.locationId ?? null, e.eventType, JSON.stringify(e.items), e.amount, e.ts]);
}
async function purchasesSince(tenantId, profileIds, since) {
  if (profileIds.length === 0)
    return /* @__PURE__ */ new Map();
  const rows = await query(`SELECT profile_id, count(*)::text AS n, coalesce(sum(amount),0)::text AS revenue
     FROM events
     WHERE tenant_id = $1 AND profile_id = ANY($2::uuid[])
       AND event_type = 'purchase' AND ts >= $3
     GROUP BY profile_id`, [tenantId, profileIds, since]);
  return new Map(rows.map((r) => [r.profile_id, { count: Number(r.n), revenue: Number(r.revenue) }]));
}
async function selectAudience(tenantId, whereSql, params) {
  const rows = await query(`SELECT * FROM features WHERE tenant_id = $1 ${whereSql ? `AND (${whereSql})` : ""}`, [tenantId, ...params]);
  return rows.map(mapFeatures);
}
async function getFeaturesForProfiles(tenantId, profileIds) {
  if (profileIds.length === 0)
    return [];
  const rows = await query(`SELECT * FROM features WHERE tenant_id = $1 AND profile_id = ANY($2::uuid[])`, [tenantId, profileIds]);
  return rows.map(mapFeatures);
}
async function featureStats(tenantId) {
  const row = await queryOne(`SELECT count(*)::int AS total,
            count(*) FILTER (WHERE recency_days <= 60)::int AS active,
            count(*) FILTER (WHERE recency_days > 60)::int AS lapsed,
            coalesce(avg(monetary_ltv), 0)::float AS avg_ltv
     FROM features WHERE tenant_id = $1`, [tenantId]);
  return {
    total: row?.total ?? 0,
    active: row?.active ?? 0,
    lapsed: row?.lapsed ?? 0,
    avgLtv: row?.avg_ltv ?? 0
  };
}
async function topProfilesByLtv(tenantId, limit) {
  const rows = await query(`SELECT f.*, p.phone, p.traits
     FROM features f JOIN profiles p ON p.id = f.profile_id AND p.tenant_id = f.tenant_id
     WHERE f.tenant_id = $1
     ORDER BY f.monetary_ltv DESC LIMIT $2`, [tenantId, limit]);
  return rows.map((r) => ({ ...mapFeatures(r), phone: r.phone, traits: r.traits }));
}
async function upsertSegment(tenantId, name, rule, campaignType, opts = {}) {
  const row = await queryOne(`INSERT INTO segments (tenant_id, name, rule, campaign_type, description, source)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (tenant_id, name)
       DO UPDATE SET rule = EXCLUDED.rule, campaign_type = EXCLUDED.campaign_type,
                     description = COALESCE(EXCLUDED.description, segments.description)
     RETURNING *`, [
    tenantId,
    name,
    JSON.stringify(rule),
    campaignType,
    opts.description ?? null,
    opts.source ?? "standard"
  ]);
  return mapSegment(row);
}
async function deleteSegment(tenantId, segmentId) {
  const used = await queryOne(`SELECT 1 FROM campaigns WHERE tenant_id = $1 AND segment_id = $2 LIMIT 1`, [tenantId, segmentId]);
  if (used)
    return false;
  await query(`DELETE FROM segments WHERE tenant_id = $1 AND id = $2`, [tenantId, segmentId]);
  return true;
}
async function listSegments(tenantId) {
  return (await query(`SELECT * FROM segments WHERE tenant_id = $1 ORDER BY name`, [tenantId])).map(mapSegment);
}
async function getSegment(tenantId, segmentId) {
  const row = await queryOne(`SELECT * FROM segments WHERE tenant_id = $1 AND id = $2`, [
    tenantId,
    segmentId
  ]);
  return row ? mapSegment(row) : null;
}
async function createCampaign(tenantId, segmentId, audienceSize, status = "pending_approval") {
  const row = await queryOne(`INSERT INTO campaigns (tenant_id, segment_id, status, audience_size)
     VALUES ($1, $2, $3, $4) RETURNING *`, [tenantId, segmentId, status, audienceSize]);
  return mapCampaign(row);
}
async function getCampaign(tenantId, campaignId) {
  const row = await queryOne(`SELECT * FROM campaigns WHERE tenant_id = $1 AND id = $2`, [
    tenantId,
    campaignId
  ]);
  return row ? mapCampaign(row) : null;
}
async function listCampaigns(tenantId, statuses) {
  const rows = statuses?.length ? await query(`SELECT * FROM campaigns WHERE tenant_id = $1 AND status = ANY($2) ORDER BY created_at DESC`, [tenantId, statuses]) : await query(`SELECT * FROM campaigns WHERE tenant_id = $1 ORDER BY created_at DESC`, [
    tenantId
  ]);
  return rows.map(mapCampaign);
}
async function hasOpenCampaignForSegment(tenantId, segmentId, withinDays) {
  const row = await queryOne(`SELECT 1 FROM campaigns
     WHERE tenant_id = $1 AND segment_id = $2
       AND status IN ('draft','pending_approval','approved','sent')
       AND created_at > now() - ($3 || ' days')::interval
     LIMIT 1`, [tenantId, segmentId, String(withinDays)]);
  return row !== null;
}
async function setCampaignCopy(tenantId, campaignId, copy) {
  await query(`UPDATE campaigns SET generated_copy = $3 WHERE tenant_id = $1 AND id = $2`, [
    tenantId,
    campaignId,
    JSON.stringify(copy)
  ]);
}
async function setCampaignCallListCsv(tenantId, campaignId, csv) {
  await query(`UPDATE campaigns SET call_list_csv = $3 WHERE tenant_id = $1 AND id = $2`, [
    tenantId,
    campaignId,
    csv
  ]);
}
async function setCampaignStatus(tenantId, campaignId, status, approvedBy) {
  const row = await queryOne(`UPDATE campaigns
     SET status = $3,
         approved_at = CASE WHEN $3 = 'approved' THEN now() ELSE approved_at END,
         approved_by = CASE WHEN $3 = 'approved' THEN $4 ELSE approved_by END
     WHERE tenant_id = $1 AND id = $2 RETURNING *`, [tenantId, campaignId, status, approvedBy ?? null]);
  return row ? mapCampaign(row) : null;
}
async function insertMessages(rows) {
  if (rows.length === 0)
    return;
  await withTransaction(async (client) => {
    for (const m of rows) {
      await client.query(`INSERT INTO messages (campaign_id, profile_id, channel, rendered_text, is_control, redemption_code)
         VALUES ($1,$2,$3,$4,$5,$6)`, [m.campaignId, m.profileId, m.channel, m.renderedText, m.isControl, m.redemptionCode]);
    }
  });
}
async function messagesForCampaign(campaignId) {
  return (await query(`SELECT * FROM messages WHERE campaign_id = $1 ORDER BY is_control, profile_id`, [
    campaignId
  ])).map(mapMessage);
}
async function updateMessageStatus(messageId, status, sentAt) {
  await query(`UPDATE messages SET status = $2, sent_at = coalesce($3, sent_at) WHERE id = $1`, [messageId, status, sentAt ?? null]);
}
async function getMessageByRedemptionCode(code) {
  const row = await queryOne(`SELECT * FROM messages WHERE redemption_code = $1`, [code]);
  return row ? mapMessage(row) : null;
}
async function countRecentMessages(tenantId, profileIds, sinceDays) {
  if (profileIds.length === 0)
    return /* @__PURE__ */ new Map();
  const rows = await query(`SELECT m.profile_id, count(*)::text AS n
     FROM messages m
     JOIN campaigns c ON c.id = m.campaign_id
     WHERE c.tenant_id = $1 AND m.profile_id = ANY($2::uuid[])
       AND m.is_control = false
       AND coalesce(m.sent_at, now()) > now() - ($3 || ' days')::interval
       AND m.status <> 'failed'
     GROUP BY m.profile_id`, [tenantId, profileIds, String(sinceDays)]);
  return new Map(rows.map((r) => [r.profile_id, Number(r.n)]));
}
async function campaignMessageStats(campaignId) {
  const row = await queryOne(`SELECT count(*)::int AS total,
            count(*) FILTER (WHERE is_control)::int AS control,
            count(*) FILTER (WHERE NOT is_control AND status IN ('sent','delivered','read','replied'))::int AS sent,
            count(*) FILTER (WHERE status IN ('delivered','read','replied'))::int AS delivered,
            count(*) FILTER (WHERE status IN ('read','replied'))::int AS read,
            count(*) FILTER (WHERE status = 'replied')::int AS replied,
            count(*) FILTER (WHERE status = 'failed')::int AS failed
     FROM messages WHERE campaign_id = $1`, [campaignId]);
  return row ?? { total: 0, control: 0, sent: 0, delivered: 0, read: 0, replied: 0, failed: 0 };
}
async function countRedemptionsForCampaign(campaignId) {
  const row = await queryOne(`SELECT count(*)::text AS n
     FROM events e
     JOIN messages m ON m.redemption_code = e.items->0->>'name'
     WHERE m.campaign_id = $1 AND e.event_type = 'redemption'
       AND e.profile_id = m.profile_id`, [campaignId]);
  return Number(row?.n ?? 0);
}
async function monthlyRepeatRate(tenantId, months) {
  const rows = await query(`SELECT to_char(date_trunc('month', ts), 'YYYY-MM') AS month,
            count(DISTINCT profile_id)::int AS buyers,
            count(DISTINCT profile_id) FILTER (
              WHERE profile_id IN (
                SELECT profile_id FROM events e2
                WHERE e2.tenant_id = $1 AND e2.event_type = 'purchase'
                  AND date_trunc('month', e2.ts) = date_trunc('month', events.ts)
                GROUP BY profile_id HAVING count(*) >= 2
              )
            )::int AS repeaters
     FROM events
     WHERE tenant_id = $1 AND event_type = 'purchase'
       AND ts > now() - ($2 || ' months')::interval
     GROUP BY 1 ORDER BY 1`, [tenantId, String(months)]);
  return rows.map((r) => ({
    month: r.month,
    buyers: r.buyers,
    repeaters: r.repeaters,
    repeatRate: r.buyers > 0 ? Math.round(r.repeaters / r.buyers * 1e3) / 1e3 : 0
  }));
}
async function upsertPreference(p) {
  await query(`INSERT INTO preferences (tenant_id, campaign_type, enabled, max_per_customer_per_week)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (tenant_id, campaign_type)
       DO UPDATE SET enabled = EXCLUDED.enabled,
                     max_per_customer_per_week = EXCLUDED.max_per_customer_per_week`, [p.tenantId, p.campaignType, p.enabled, p.maxPerCustomerPerWeek]);
}
async function getPreferences(tenantId) {
  const rows = await query(`SELECT * FROM preferences WHERE tenant_id = $1 ORDER BY campaign_type`, [tenantId]);
  return rows.map((r) => ({
    tenantId: r.tenant_id,
    campaignType: r.campaign_type,
    enabled: r.enabled,
    maxPerCustomerPerWeek: r.max_per_customer_per_week
  }));
}
async function getPreference(tenantId, campaignType) {
  const prefs = await getPreferences(tenantId);
  return prefs.find((p) => p.campaignType === campaignType) ?? null;
}
async function createUpload(tenantId, filename) {
  const row = await queryOne(`INSERT INTO uploads (tenant_id, filename) VALUES ($1, $2) RETURNING *`, [tenantId, filename]);
  return mapUpload(row);
}
async function finishUpload(tenantId, uploadId, status, rowsProcessed, errorLog) {
  await query(`UPDATE uploads SET status = $3, rows_processed = $4, error_log = $5
     WHERE tenant_id = $1 AND id = $2`, [tenantId, uploadId, status, rowsProcessed, errorLog]);
}
async function listUploads(tenantId) {
  return (await query(`SELECT * FROM uploads WHERE tenant_id = $1 ORDER BY uploaded_at DESC LIMIT 50`, [
    tenantId
  ])).map(mapUpload);
}
async function addOptOut(tenantId, phone) {
  await query(`INSERT INTO opt_outs (tenant_id, phone) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [tenantId, phone]);
}
async function getOptedOutPhones(tenantId) {
  const rows = await query(`SELECT phone FROM opt_outs WHERE tenant_id = $1`, [tenantId]);
  return new Set(rows.map((r) => r.phone));
}
async function addWhatsappOptIn(tenantId, phone, source) {
  await query(`INSERT INTO whatsapp_opt_ins (tenant_id, phone, source) VALUES ($1, $2, $3)
     ON CONFLICT DO NOTHING`, [tenantId, phone, source]);
}
async function getWhatsappOptIns(tenantId) {
  const rows = await query(`SELECT phone FROM whatsapp_opt_ins WHERE tenant_id = $1`, [tenantId]);
  return new Set(rows.map((r) => r.phone));
}
async function upsertWhatsappTemplate(t) {
  await query(`INSERT INTO whatsapp_templates (tenant_id, name, body, variables, status, campaign_type)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (tenant_id, name)
       DO UPDATE SET body = EXCLUDED.body, variables = EXCLUDED.variables,
                     status = EXCLUDED.status, campaign_type = EXCLUDED.campaign_type`, [t.tenantId, t.name, t.body, JSON.stringify(t.variables), t.status, t.campaignType]);
}
async function getApprovedTemplate(tenantId, campaignType) {
  const row = await queryOne(`SELECT * FROM whatsapp_templates
     WHERE tenant_id = $1 AND campaign_type = $2 AND status = 'approved' LIMIT 1`, [tenantId, campaignType]);
  if (!row)
    return null;
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    body: row.body,
    variables: row.variables,
    status: row.status,
    campaignType: row.campaign_type
  };
}

// ../../packages/db/dist/repos-ai.js
var mapMenuItem = (r) => ({
  id: r.id,
  tenantId: r.tenant_id,
  name: r.name,
  category: r.category,
  price: Number(r.price),
  description: r.description,
  tags: r.tags ?? [],
  available: r.available,
  createdAt: r.created_at
});
async function listMenuItems(tenantId) {
  const rows = await query(`SELECT * FROM menu_items WHERE tenant_id = $1 ORDER BY category, name`, [tenantId]);
  return rows.map(mapMenuItem);
}
async function upsertMenuItem(tenantId, item) {
  const row = await queryOne(`INSERT INTO menu_items (tenant_id, name, category, price, description, tags, available)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (tenant_id, name) DO UPDATE SET
       category = EXCLUDED.category, price = EXCLUDED.price,
       description = EXCLUDED.description, tags = EXCLUDED.tags,
       available = EXCLUDED.available
     RETURNING *`, [
    tenantId,
    item.name,
    item.category,
    item.price,
    item.description ?? null,
    JSON.stringify(item.tags ?? []),
    item.available ?? true
  ]);
  return mapMenuItem(row);
}
async function setMenuItemAvailability(tenantId, itemId, available) {
  await query(`UPDATE menu_items SET available = $3 WHERE tenant_id = $1 AND id = $2`, [
    tenantId,
    itemId,
    available
  ]);
}
async function deleteMenuItem(tenantId, itemId) {
  await query(`DELETE FROM menu_items WHERE tenant_id = $1 AND id = $2`, [tenantId, itemId]);
}
async function recentMenuItems(tenantId, days) {
  const rows = await query(`SELECT * FROM menu_items
     WHERE tenant_id = $1 AND available AND created_at > now() - ($2 || ' days')::interval
     ORDER BY created_at DESC LIMIT 5`, [tenantId, String(days)]);
  return rows.map(mapMenuItem);
}
async function menuCandidatesFromHistory(tenantId) {
  const rows = await query(`SELECT item->>'name' AS name,
            mode() WITHIN GROUP (ORDER BY item->>'category') AS category,
            percentile_cont(0.5) WITHIN GROUP (ORDER BY (item->>'unitPrice')::numeric) AS price,
            count(*)::int AS times_sold
     FROM events, jsonb_array_elements(items) AS item
     WHERE tenant_id = $1 AND event_type = 'purchase' AND item->>'name' <> ''
     GROUP BY 1 ORDER BY times_sold DESC`, [tenantId]);
  return rows.map((r) => ({
    name: r.name,
    category: r.category ?? "uncategorized",
    price: Math.round(Number(r.price ?? 0) * 100) / 100,
    timesSold: r.times_sold
  }));
}
var mapLoyalty = (r) => ({
  id: r.id,
  tenantId: r.tenant_id,
  profileId: r.profile_id,
  points: r.points,
  reason: r.reason,
  createdAt: r.created_at
});
async function addLoyaltyPoints(tenantId, profileId, points, reason) {
  if (points === 0)
    return;
  await query(`INSERT INTO loyalty_ledger (tenant_id, profile_id, points, reason) VALUES ($1, $2, $3, $4)`, [tenantId, profileId, Math.round(points), reason]);
}
async function loyaltyBalance(tenantId, profileId) {
  const row = await queryOne(`SELECT coalesce(sum(points), 0)::text AS balance
     FROM loyalty_ledger WHERE tenant_id = $1 AND profile_id = $2`, [tenantId, profileId]);
  return Number(row?.balance ?? 0);
}
async function loyaltyLedger(tenantId, profileId, limit = 20) {
  const rows = await query(`SELECT * FROM loyalty_ledger WHERE tenant_id = $1 AND profile_id = $2
     ORDER BY created_at DESC LIMIT $3`, [tenantId, profileId, limit]);
  return rows.map(mapLoyalty);
}
var mapDirectMessage = (r) => ({
  id: r.id,
  tenantId: r.tenant_id,
  profileId: r.profile_id,
  channel: r.channel,
  body: r.body,
  status: r.status,
  sentBy: r.sent_by,
  sentAt: r.sent_at
});
async function insertDirectMessage(m) {
  const row = await queryOne(`INSERT INTO direct_messages (tenant_id, profile_id, channel, body, status, sent_by)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [m.tenantId, m.profileId, m.channel, m.body, m.status, m.sentBy]);
  return mapDirectMessage(row);
}
async function directMessagesForProfile(tenantId, profileId, limit = 10) {
  const rows = await query(`SELECT * FROM direct_messages WHERE tenant_id = $1 AND profile_id = $2
     ORDER BY sent_at DESC LIMIT $3`, [tenantId, profileId, limit]);
  return rows.map(mapDirectMessage);
}
async function getCachedCounterCard(tenantId, profileId, maxAgeHours) {
  const row = await queryOne(`SELECT payload FROM counter_cards
     WHERE tenant_id = $1 AND profile_id = $2
       AND computed_at > now() - ($3 || ' hours')::interval`, [tenantId, profileId, String(maxAgeHours)]);
  return row?.payload ?? null;
}
async function cacheCounterCard(tenantId, profileId, payload) {
  await query(`INSERT INTO counter_cards (tenant_id, profile_id, payload, computed_at)
     VALUES ($1, $2, $3, now())
     ON CONFLICT (tenant_id, profile_id)
       DO UPDATE SET payload = EXCLUDED.payload, computed_at = now()`, [tenantId, profileId, JSON.stringify(payload)]);
}
async function getProfileByPhone(tenantId, phone) {
  const row = await queryOne(`SELECT id, phone, traits FROM profiles WHERE tenant_id = $1 AND phone = $2`, [tenantId, phone]);
  return row ? { id: row.id, phone: row.phone, traits: row.traits } : null;
}
async function coPurchasePairs(tenantId, minCount = 2) {
  const rows = await query(`SELECT i1.item->>'name' AS a, i2.item->>'name' AS b, count(*)::int AS count
     FROM events e,
          LATERAL jsonb_array_elements(e.items) AS i1(item),
          LATERAL jsonb_array_elements(e.items) AS i2(item)
     WHERE e.tenant_id = $1 AND e.event_type = 'purchase'
       AND i1.item->>'name' < i2.item->>'name'
     GROUP BY 1, 2
     HAVING count(*) >= $2
     ORDER BY count DESC`, [tenantId, minCount]);
  return rows;
}
async function purchasedItemsForProfile(tenantId, profileId) {
  const rows = await query(`SELECT item->>'name' AS name,
            mode() WITHIN GROUP (ORDER BY item->>'category') AS category,
            count(*)::int AS times,
            max(e.ts) AS last_ts
     FROM events e, jsonb_array_elements(e.items) AS item
     WHERE e.tenant_id = $1 AND e.profile_id = $2 AND e.event_type = 'purchase'
       AND item->>'name' <> ''
     GROUP BY 1 ORDER BY times DESC`, [tenantId, profileId]);
  return rows.map((r) => ({
    name: r.name,
    category: r.category ?? "uncategorized",
    times: r.times,
    lastTs: r.last_ts
  }));
}
async function segmentDiscoveryStats(tenantId) {
  const [buckets, cats, misc, quartiles] = await Promise.all([
    query(`SELECT CASE
                WHEN recency_days <= 30 THEN '0-30'
                WHEN recency_days <= 60 THEN '31-60'
                WHEN recency_days <= 90 THEN '61-90'
                WHEN recency_days <= 180 THEN '91-180'
                ELSE '180+' END AS bucket,
              count(*)::int AS n
       FROM features WHERE tenant_id = $1 GROUP BY 1`, [tenantId]),
    query(`SELECT item->>'category' AS category,
              round(sum((item->>'qty')::numeric * (item->>'unitPrice')::numeric))::int AS revenue,
              count(DISTINCT e.profile_id)::int AS buyers
       FROM events e, jsonb_array_elements(e.items) AS item
       WHERE e.tenant_id = $1 AND e.event_type = 'purchase'
       GROUP BY 1 ORDER BY revenue DESC LIMIT 8`, [tenantId]),
    queryOne(`SELECT count(*)::int AS total,
              count(*) FILTER (WHERE festival_buyer)::int AS festival,
              count(*) FILTER (WHERE reorder_cadence_days IS NOT NULL)::int AS cadence
       FROM features WHERE tenant_id = $1`, [tenantId]),
    query(`SELECT percentile_cont(ARRAY[0.25, 0.5, 0.75, 0.9]) WITHIN GROUP (ORDER BY monetary_ltv) AS q
       FROM features WHERE tenant_id = $1`, [tenantId])
  ]);
  return {
    totalProfiles: misc?.total ?? 0,
    recencyBuckets: Object.fromEntries(buckets.map((b) => [b.bucket, b.n])),
    categorySpend: cats.map((c) => ({
      category: c.category,
      revenue: c.revenue,
      buyers: c.buyers
    })),
    festivalBuyers: misc?.festival ?? 0,
    withCadence: misc?.cadence ?? 0,
    ltvQuartiles: (quartiles[0]?.q ?? []).map((v) => Math.round(Number(v)))
  };
}

// ../../packages/db/dist/repos-engage.js
var mapCoupon = (r) => ({
  id: r.id,
  tenantId: r.tenant_id,
  profileId: r.profile_id,
  phone: r.phone,
  code: r.code,
  discountType: r.discount_type,
  discountValue: Number(r.discount_value),
  issuedForAmount: Number(r.issued_for_amount),
  source: r.source,
  expiresAt: r.expires_at,
  redeemedAt: r.redeemed_at,
  createdAt: r.created_at
});
async function insertCoupon(c) {
  const row = await queryOne(`INSERT INTO coupons (tenant_id, profile_id, phone, code, discount_type,
                          discount_value, issued_for_amount, source, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`, [
    c.tenantId,
    c.profileId,
    c.phone,
    c.code,
    c.discountType,
    c.discountValue,
    c.issuedForAmount,
    c.source,
    c.expiresAt
  ]);
  return mapCoupon(row);
}
async function latestCouponIssuedAt(tenantId, profileId) {
  const row = await queryOne(`SELECT created_at FROM coupons WHERE tenant_id = $1 AND profile_id = $2
     ORDER BY created_at DESC LIMIT 1`, [tenantId, profileId]);
  return row?.created_at ?? null;
}
async function getCouponByCode(tenantId, code) {
  const row = await queryOne(`SELECT * FROM coupons WHERE tenant_id = $1 AND code = $2`, [
    tenantId,
    code
  ]);
  return row ? mapCoupon(row) : null;
}
async function redeemCoupon(tenantId, couponId) {
  const row = await queryOne(`UPDATE coupons SET redeemed_at = now()
     WHERE tenant_id = $1 AND id = $2 AND redeemed_at IS NULL RETURNING id`, [tenantId, couponId]);
  return row !== null;
}
var mapQrOrder = (r) => ({
  id: r.id,
  tenantId: r.tenant_id,
  token: r.token,
  orderRef: r.order_ref,
  source: r.source,
  amount: Number(r.amount),
  items: r.items ?? [],
  status: r.status,
  claimedProfileId: r.claimed_profile_id,
  claimedAt: r.claimed_at,
  createdAt: r.created_at
});
async function createQrOrder(q) {
  const row = await queryOne(`INSERT INTO qr_orders (tenant_id, token, order_ref, source, amount, items)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [q.tenantId, q.token, q.orderRef, q.source, q.amount, JSON.stringify(q.items)]);
  return mapQrOrder(row);
}
async function getQrOrderByToken(token) {
  const row = await queryOne(`SELECT * FROM qr_orders WHERE token = $1`, [token]);
  return row ? mapQrOrder(row) : null;
}
async function getQrOrderForTenant(tenantId, token) {
  const row = await queryOne(`SELECT * FROM qr_orders WHERE tenant_id = $1 AND token = $2`, [tenantId, token]);
  return row ? mapQrOrder(row) : null;
}
async function claimQrOrder(tenantId, qrOrderId, profileId) {
  const row = await queryOne(`UPDATE qr_orders SET status = 'claimed', claimed_profile_id = $3, claimed_at = now()
     WHERE tenant_id = $1 AND id = $2 AND status = 'pending' RETURNING id`, [tenantId, qrOrderId, profileId]);
  return row !== null;
}
async function listQrOrders(tenantId, limit = 50) {
  const rows = await query(`SELECT * FROM qr_orders WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2`, [tenantId, limit]);
  return rows.map(mapQrOrder);
}
async function insertTransactionalMessage(m) {
  await query(`INSERT INTO transactional_messages (tenant_id, profile_id, kind, body, status)
     VALUES ($1, $2, $3, $4, $5)`, [m.tenantId, m.profileId, m.kind, m.body, m.status]);
}
async function patchTenantConfig(tenantId, patch) {
  await query(`UPDATE tenants SET config = config || $2::jsonb WHERE id = $1`, [
    tenantId,
    JSON.stringify(patch)
  ]);
}

// ../../packages/db/dist/migrate.js
import fs from "node:fs";
import path2 from "node:path";
import { fileURLToPath as fileURLToPath2 } from "node:url";
import pg2 from "pg";
var MIGRATIONS_DIR = path2.resolve(path2.dirname(fileURLToPath2(import.meta.url)), "../migrations");
async function migrate() {
  const url = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url)
    throw new Error("DATABASE_URL (or DIRECT_DATABASE_URL) is not set");
  const pool2 = new pg2.Pool({ connectionString: url, ssl: sslConfig(url), max: 1 });
  try {
    await pool2.query(`CREATE TABLE IF NOT EXISTS _migrations (
         name TEXT PRIMARY KEY,
         applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
       )`);
    const applied = new Set((await pool2.query("SELECT name FROM _migrations")).rows.map((r) => r.name));
    const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort();
    for (const file of files) {
      if (applied.has(file))
        continue;
      const sql = fs.readFileSync(path2.join(MIGRATIONS_DIR, file), "utf8");
      const client = await pool2.connect();
      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query("INSERT INTO _migrations (name) VALUES ($1)", [file]);
        await client.query("COMMIT");
        console.log(`applied ${file}`);
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    }
  } finally {
    await pool2.end();
  }
}
if (process.argv[1] && process.argv[1].includes("migrate")) {
  migrate().then(() => console.log("migrations up to date")).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

// src/auth.ts
var SECRET = () => process.env.AUTH_SECRET ?? "dev-secret-change-me";
function sign(payload) {
  return crypto.createHmac("sha256", SECRET()).update(payload).digest("base64url");
}
function issueSessionToken(tenantSlug, ttlHours = 24 * 7) {
  const expires = Date.now() + ttlHours * 36e5;
  const payload = `${tenantSlug}.${expires}`;
  return `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`;
}
function verifySessionToken(token) {
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;
  const payload = Buffer.from(payloadB64, "base64url").toString();
  const expected = sign(payload);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)))
    return null;
  const [slug, expiresStr] = payload.split(".");
  if (Date.now() > Number(expiresStr)) return null;
  return slug;
}
async function loginHandler(req, res) {
  const { tenant: slug, password } = req.body ?? {};
  const demoPassword = process.env.DEMO_PASSWORD ?? "demo";
  if (!slug || password !== demoPassword) {
    res.status(401).json({ error: "invalid credentials" });
    return;
  }
  const tenant = await getTenantBySlug(String(slug).toLowerCase());
  if (!tenant) {
    res.status(401).json({ error: "unknown tenant" });
    return;
  }
  res.json({
    token: issueSessionToken(tenant.config.slug),
    tenant: { id: tenant.id, name: tenant.name, config: tenant.config }
  });
}
async function apiKeyAuth(req, res, next) {
  const key = req.header("x-api-key");
  if (!key) {
    res.status(401).json({ error: "missing X-API-Key" });
    return;
  }
  const tenant = await getTenantByApiKey(key);
  if (!tenant) {
    res.status(401).json({ error: "invalid API key" });
    return;
  }
  req.tenant = tenant;
  next();
}
async function sessionAuth(req, res, next) {
  const header = req.header("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const slug = token ? verifySessionToken(token) : null;
  if (!slug) {
    res.status(401).json({ error: "not authenticated" });
    return;
  }
  const tenant = await getTenantBySlug(slug);
  if (!tenant) {
    res.status(401).json({ error: "unknown tenant" });
    return;
  }
  req.tenant = tenant;
  next();
}

// src/routes/ingest.ts
import { Router } from "express";
import multer from "multer";

// ../../packages/core/dist/phone.js
function normalizePhone(raw, defaultCountryCode = "91") {
  if (!raw)
    return null;
  const hasPlus = raw.trim().startsWith("+");
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 0)
    return null;
  if (hasPlus) {
    if (digits.length < 8 || digits.length > 15)
      return null;
    return `+${digits}`;
  }
  if (digits.startsWith("0") && digits.length === 11)
    digits = digits.slice(1);
  if (defaultCountryCode === "91") {
    if (digits.length === 12 && digits.startsWith("91"))
      digits = digits.slice(2);
    if (digits.length !== 10 || !/^[6-9]/.test(digits))
      return null;
    return `+91${digits}`;
  }
  if (digits.length < 8 || digits.length > 15)
    return null;
  return `+${defaultCountryCode}${digits}`;
}

// ../../packages/core/dist/csv.js
function parseCsv(text) {
  const rows = [];
  let field = "";
  let row = [];
  let inQuotes = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n")
        i++;
      row.push(field);
      field = "";
      if (row.length > 1 || row[0] !== "")
        rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    if (row.length > 1 || row[0] !== "")
      rows.push(row);
  }
  if (rows.length < 2)
    return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const obj = {};
    headers.forEach((h, idx) => obj[h] = (r[idx] ?? "").trim());
    return obj;
  });
}

// ../../packages/core/dist/ingestion.js
var import_dayjs = __toESM(require_dayjs_min(), 1);
var import_customParseFormat = __toESM(require_customParseFormat(), 1);

// ../../packages/types/dist/index.js
var ALL_CAMPAIGN_TYPES = [
  "winback",
  "festival_preorder",
  "new_item_alert",
  "reorder_reminder"
];
function loyaltyConfig(config) {
  return config.loyalty ?? { enabled: true, pointsPerRupee: 0.1, pointValueRupees: 0.25 };
}
function receiptConfig(config) {
  return config.receipts ?? { enabled: true, showItems: true };
}
function couponConfig(config) {
  return config.coupons ?? { enabled: false, tiers: [], minDaysBetweenCoupons: 7 };
}
function qrCaptureConfig(config) {
  return config.qrCapture ?? { enabled: true };
}

// ../../packages/core/dist/loyalty.js
function pointsForPurchase(tenant, amount) {
  const cfg = loyaltyConfig(tenant.config);
  if (!cfg.enabled || amount <= 0)
    return 0;
  return Math.floor(amount * cfg.pointsPerRupee);
}
async function awardPurchasePoints(tenant, profileId, amount) {
  const points = pointsForPurchase(tenant, amount);
  if (points > 0) {
    await addLoyaltyPoints(tenant.id, profileId, points, `Purchase \u20B9${Math.round(amount)}`);
  }
}

// ../../packages/core/dist/ingestion.js
import_dayjs.default.extend(import_customParseFormat.default);
function mapCsvRows(tenantId, rows, mapping) {
  const events = [];
  const errors = [];
  rows.forEach((row, i) => {
    const rowNumber = i + 2;
    const phone = normalizePhone(row[mapping.phone] ?? "");
    if (!phone) {
      errors.push({ rowNumber, reason: `invalid phone: "${row[mapping.phone] ?? ""}"` });
      return;
    }
    const ts = (0, import_dayjs.default)(row[mapping.timestamp] ?? "", mapping.dateFormat, true);
    if (!ts.isValid()) {
      errors.push({
        rowNumber,
        reason: `invalid date "${row[mapping.timestamp] ?? ""}" (expected ${mapping.dateFormat})`
      });
      return;
    }
    const amount = parseFloat((row[mapping.amount] ?? "").replace(/[₹,\s]/g, ""));
    if (Number.isNaN(amount)) {
      errors.push({ rowNumber, reason: `invalid amount: "${row[mapping.amount] ?? ""}"` });
      return;
    }
    const items = parseItemsCell(row[mapping.items] ?? "", mapping);
    const traits = {};
    if (mapping.name && row[mapping.name])
      traits.name = row[mapping.name];
    if (mapping.email && row[mapping.email])
      traits.email = row[mapping.email];
    events.push({
      tenantId,
      phone,
      traits,
      locationId: mapping.locationId ? row[mapping.locationId] || void 0 : void 0,
      eventType: "purchase",
      items,
      amount,
      ts: ts.toDate()
    });
  });
  return { events, errors };
}
function parseItemsCell(cell, mapping) {
  if (!cell)
    return [];
  const fieldOrder = mapping.itemFormat.split("|");
  return cell.split(mapping.itemsDelimiter).map((s) => s.trim()).filter(Boolean).map((entry) => {
    const parts = entry.split(mapping.itemPartsDelimiter).map((p) => p.trim());
    const get = (f) => parts[fieldOrder.indexOf(f)] ?? "";
    return {
      name: get("name"),
      category: get("category") || "uncategorized",
      qty: parseFloat(get("qty")) || 1,
      unitPrice: parseFloat(get("unitPrice")) || 0
    };
  }).filter((it) => it.name.length > 0);
}
async function ingestNormalizedEvents(tenant, events) {
  let processed = 0;
  for (const e of events) {
    const profile = await upsertProfile(tenant.id, e.phone, e.traits ?? {});
    await insertEvent(tenant.id, profile.id, e);
    if (e.eventType === "purchase") {
      await addWhatsappOptIn(tenant.id, e.phone, "pos_import");
      await awardPurchasePoints(tenant, profile.id, e.amount);
    }
    processed++;
  }
  return { processed };
}
function normalizeTrackPayload(tenantId, body) {
  const phone = normalizePhone(body.phone ?? "");
  if (!phone)
    return { error: `invalid phone: "${body.phone ?? ""}"` };
  const ts = body.ts ? (0, import_dayjs.default)(body.ts) : (0, import_dayjs.default)();
  if (!ts.isValid())
    return { error: `invalid ts: "${body.ts}"` };
  const eventType = body.event_type ?? "purchase";
  const traits = {};
  if (body.name)
    traits.name = body.name;
  if (body.email)
    traits.email = body.email;
  return {
    event: {
      tenantId,
      phone,
      traits,
      locationId: body.location_id,
      eventType,
      items: (body.items ?? []).map((it) => ({
        name: it.name ?? "",
        category: it.category ?? "uncategorized",
        qty: it.qty ?? 1,
        unitPrice: it.unitPrice ?? 0
      })),
      amount: body.amount ?? 0,
      ts: ts.toDate()
    }
  };
}

// ../../packages/core/dist/features.js
var import_dayjs2 = __toESM(require_dayjs_min(), 1);

// ../../packages/core/dist/segments.js
var COLUMNS = /* @__PURE__ */ new Set([
  "recency_days",
  "frequency_90d",
  "monetary_ltv",
  "category_affinity",
  "festival_buyer",
  "reorder_cadence_days",
  "favorite_item"
]);
var OPERATORS = {
  ">": ">",
  ">=": ">=",
  "<": "<",
  "<=": "<=",
  "=": "=",
  "!=": "<>"
};
function compileRule(rule) {
  const clauses = [];
  const params = [];
  const next = () => `$${params.length + 1}`;
  for (const [column, condition] of Object.entries(rule)) {
    if (!COLUMNS.has(column))
      throw new Error(`rule references unknown column "${column}"`);
    if (typeof condition !== "object" || condition === null) {
      params.push(condition);
      clauses.push(`${column} = ${next()}`);
      continue;
    }
    for (const [op, value] of Object.entries(condition)) {
      if (op === "in") {
        if (!Array.isArray(value))
          throw new Error(`"in" needs an array`);
        const cast = value.every((v) => typeof v === "number") ? "numeric[]" : "text[]";
        params.push(value);
        clauses.push(`${column} = ANY(${next()}::${cast})`);
      } else if (op === "gte_col" || op === "lte_col") {
        const other = String(value);
        if (!COLUMNS.has(other))
          throw new Error(`rule references unknown column "${other}"`);
        clauses.push(`${column} ${op === "gte_col" ? ">=" : "<="} ${other}`);
      } else if (OPERATORS[op]) {
        params.push(value);
        clauses.push(`${column} ${OPERATORS[op]} ${next()}`);
      } else {
        throw new Error(`unknown operator "${op}"`);
      }
    }
  }
  return { whereSql: clauses.join(" AND "), params };
}
async function audienceForSegment(tenant, segment) {
  const { whereSql, params } = compileRule(segment.rule);
  return selectAudience(tenant.id, whereSql, params);
}

// ../../packages/core/dist/suppression.js
async function applySuppression(tenant, campaignType, audience) {
  const pref = await getPreference(tenant.id, campaignType);
  if (pref && !pref.enabled) {
    return {
      eligible: [],
      suppressed: audience.map((f) => ({
        profileId: f.profileId,
        reason: `campaign type "${campaignType}" disabled by tenant preference`
      })),
      campaignTypeDisabled: true
    };
  }
  const maxPerWeek = pref?.maxPerCustomerPerWeek ?? 1;
  const profileIds = audience.map((f) => f.profileId);
  const [profiles, optedOut, recentCounts] = await Promise.all([
    getProfilesByIds(tenant.id, profileIds),
    getOptedOutPhones(tenant.id),
    countRecentMessages(tenant.id, profileIds, 7)
  ]);
  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const eligible = [];
  const suppressed = [];
  for (const features of audience) {
    const profile = profileById.get(features.profileId);
    if (!profile) {
      suppressed.push({ profileId: features.profileId, reason: "profile not found" });
      continue;
    }
    if (optedOut.has(profile.phone)) {
      suppressed.push({ profileId: profile.id, reason: "opted out" });
      continue;
    }
    if ((recentCounts.get(profile.id) ?? 0) >= maxPerWeek) {
      suppressed.push({
        profileId: profile.id,
        reason: `frequency cap (${maxPerWeek}/week) reached`
      });
      continue;
    }
    eligible.push({ features, profile });
  }
  return { eligible, suppressed, campaignTypeDisabled: false };
}

// ../../packages/core/dist/holdout.js
var DEFAULT_HOLDOUT_RATIO = 0.17;
function assignHoldout(audience, ratio = DEFAULT_HOLDOUT_RATIO) {
  const shuffled = [...audience];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const controlCount = audience.length >= 5 ? Math.max(1, Math.round(audience.length * ratio)) : 0;
  return {
    control: shuffled.slice(0, controlCount),
    treatment: shuffled.slice(controlCount)
  };
}

// ../../packages/core/dist/triggers.js
var import_dayjs3 = __toESM(require_dayjs_min(), 1);
import crypto2 from "node:crypto";
var REDEMPTION_PREFIX = {
  winback: "WB",
  festival_preorder: "FE",
  new_item_alert: "NI",
  reorder_reminder: "RE"
};
function redemptionCode(tenant, campaignType) {
  const rand = crypto2.randomBytes(4).toString("hex").toUpperCase().slice(0, 6);
  return `${tenant.config.slug.slice(0, 4).toUpperCase()}-${REDEMPTION_PREFIX[campaignType]}-${rand}`;
}
function activeFestivalWindow(tenant, now) {
  for (const fest of tenant.config.festivals) {
    const festDate = (0, import_dayjs3.default)(fest.date);
    const start = festDate.subtract(fest.preWindowDays, "day");
    if (((0, import_dayjs3.default)(now).isAfter(start) || (0, import_dayjs3.default)(now).isSame(start, "day")) && (0, import_dayjs3.default)(now).isBefore(festDate.add(1, "day"), "day")) {
      return { name: fest.name, date: fest.date };
    }
  }
  return null;
}
async function evaluateTriggersForTenant(tenant, opts = {}) {
  const now = opts.now ?? /* @__PURE__ */ new Date();
  const dedupeDays = opts.dedupeWindowDays ?? 14;
  const results = [];
  const segments = (await listSegments(tenant.id)).filter((s) => !opts.segmentId || s.id === opts.segmentId);
  for (const segment of segments) {
    if (segment.campaignType === "festival_preorder" && !opts.ignoreFestivalWindow) {
      const window2 = activeFestivalWindow(tenant, now);
      if (!window2) {
        results.push({ segment: segment.name, outcome: "skipped", reason: "no festival window active" });
        continue;
      }
    }
    if (await hasOpenCampaignForSegment(tenant.id, segment.id, dedupeDays)) {
      results.push({
        segment: segment.name,
        outcome: "skipped",
        reason: `open campaign exists within ${dedupeDays}d`
      });
      continue;
    }
    const audience = await audienceForSegment(tenant, segment);
    if (audience.length === 0) {
      results.push({ segment: segment.name, outcome: "skipped", reason: "empty audience" });
      continue;
    }
    const { eligible, suppressed, campaignTypeDisabled } = await applySuppression(tenant, segment.campaignType, audience);
    if (campaignTypeDisabled || eligible.length === 0) {
      results.push({
        segment: segment.name,
        outcome: "skipped",
        reason: campaignTypeDisabled ? "campaign type disabled in preferences" : "all profiles suppressed",
        suppressedCount: suppressed.length
      });
      continue;
    }
    const campaign = await createCampaign(tenant.id, segment.id, eligible.length);
    const { treatment, control } = assignHoldout(eligible);
    await insertMessages([
      ...treatment.map(({ profile }) => ({
        campaignId: campaign.id,
        profileId: profile.id,
        channel: "whatsapp",
        renderedText: "",
        isControl: false,
        redemptionCode: redemptionCode(tenant, segment.campaignType)
      })),
      ...control.map(({ profile }) => ({
        campaignId: campaign.id,
        profileId: profile.id,
        channel: "whatsapp",
        renderedText: "",
        isControl: true,
        redemptionCode: null
      }))
    ]);
    if (opts.generateCopy) {
      const sample = eligible.slice(0, 5);
      const copy = await opts.generateCopy({ tenant, segment, campaign, sample });
      await setCampaignCopy(tenant.id, campaign.id, copy);
    }
    results.push({
      segment: segment.name,
      outcome: "campaign_created",
      campaignId: campaign.id,
      audienceSize: eligible.length,
      suppressedCount: suppressed.length,
      controlCount: control.length
    });
  }
  return results;
}

// ../../packages/core/dist/interpolate.js
var TEMPLATE_VARIABLES = [
  "name",
  "favorite_item",
  "category",
  "days_since_visit",
  "shop_name",
  "redemption_code",
  "festival_name"
];
function renderTemplate(template, vars) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, key) => vars[key] ?? "");
}
function variablesForProfile(profile, features, extra = {}) {
  const name = typeof profile.traits.name === "string" ? profile.traits.name.split(" ")[0] : "";
  return {
    name: name || "ji",
    // warm fallback when the POS had no name
    favorite_item: features?.favoriteItem ?? "your usual favorites",
    category: features?.categoryAffinity ?? "sweets",
    days_since_visit: features ? String(features.recencyDays) : "",
    ...extra
  };
}

// ../../packages/core/dist/attribution.js
async function computeAttribution(tenant, campaignId) {
  const campaign = await getCampaign(tenant.id, campaignId);
  if (!campaign || campaign.status !== "sent")
    return null;
  const messages = await messagesForCampaign(campaign.id);
  const since = sendTimestamp(campaign, messages);
  if (!since)
    return null;
  const treatmentIds = messages.filter((m) => !m.isControl && m.status !== "failed").map((m) => m.profileId);
  const controlIds = messages.filter((m) => m.isControl).map((m) => m.profileId);
  const [treatmentPurchases, controlPurchases, redemptions] = await Promise.all([
    purchasesSince(tenant.id, treatmentIds, since),
    purchasesSince(tenant.id, controlIds, since),
    countRedemptionsForCampaign(campaign.id)
  ]);
  const stats = (ids, purchases) => {
    if (ids.length === 0)
      return { repeatRate: 0, revenuePerCustomer: 0 };
    const repeaters = ids.filter((id) => (purchases.get(id)?.count ?? 0) > 0).length;
    const revenue = ids.reduce((sum, id) => sum + (purchases.get(id)?.revenue ?? 0), 0);
    return { repeatRate: repeaters / ids.length, revenuePerCustomer: revenue / ids.length };
  };
  const treatment = stats(treatmentIds, treatmentPurchases);
  const control = stats(controlIds, controlPurchases);
  const round = (n) => Math.round(n * 1e4) / 1e4;
  return {
    campaignId: campaign.id,
    messagedCount: treatmentIds.length,
    controlCount: controlIds.length,
    messagedRepeatRate: round(treatment.repeatRate),
    controlRepeatRate: round(control.repeatRate),
    incrementalRepeatRate: round(treatment.repeatRate - control.repeatRate),
    messagedRevenuePerCustomer: round(treatment.revenuePerCustomer),
    controlRevenuePerCustomer: round(control.revenuePerCustomer),
    incrementalRevenuePerCustomer: round(treatment.revenuePerCustomer - control.revenuePerCustomer),
    redemptions,
    computedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function sendTimestamp(campaign, messages) {
  const sentTimes = messages.map((m) => m.sentAt?.getTime()).filter((t) => typeof t === "number");
  if (sentTimes.length > 0)
    return new Date(Math.min(...sentTimes));
  return campaign.approvedAt ?? null;
}

// ../../packages/core/dist/recommendations.js
var MS_PER_DAY = 864e5;
function rankCounterRecommendations(inputs, limit = 3) {
  const now = inputs.now ?? /* @__PURE__ */ new Date();
  const menuByName = new Map(inputs.menu.map((m) => [m.name, m]));
  const menuActive = inputs.menu.filter((m) => m.available);
  const hasMenu = menuActive.length > 0;
  const boughtByName = new Map(inputs.purchased.map((p) => [p.name, p]));
  const sellable = (name) => !hasMenu || (menuByName.get(name)?.available ?? false);
  const priceOf = (name) => {
    const m = menuByName.get(name);
    return m ? m.price : null;
  };
  const candidates = /* @__PURE__ */ new Map();
  const offer = (item, category, score, signal, reason) => {
    if (!sellable(item))
      return;
    const existing = candidates.get(item);
    if (existing) {
      existing.score += score;
      return;
    }
    candidates.set(item, {
      item,
      category,
      price: priceOf(item),
      reason,
      signal,
      score
    });
  };
  const cadence = inputs.features?.reorderCadenceDays ?? null;
  for (const p of inputs.purchased) {
    if (p.times < 2 || !cadence)
      continue;
    const daysSince = Math.floor((now.getTime() - new Date(p.lastTs).getTime()) / MS_PER_DAY);
    if (daysSince >= cadence * 0.8) {
      offer(p.name, p.category, 30 + Math.min(20, p.times * 4), "due_reorder", `Their usual \u2014 bought ${p.times} times, last ${daysSince} days ago`);
    }
  }
  const ownItems = new Set(boughtByName.keys());
  for (const pair of inputs.pairs) {
    for (const [mine, other] of [
      [pair.a, pair.b],
      [pair.b, pair.a]
    ]) {
      if (!ownItems.has(mine))
        continue;
      const alreadyBuys = (boughtByName.get(other)?.times ?? 0) >= 2;
      if (alreadyBuys)
        continue;
      const anchor = boughtByName.get(mine);
      offer(other, menuByName.get(other)?.category ?? "uncategorized", 10 + Math.min(25, pair.count * 5) + Math.min(10, anchor.times * 2), "pairs_with", `Customers who buy ${mine} often take this too`);
    }
  }
  const affinity = inputs.features?.categoryAffinity;
  if (affinity && hasMenu) {
    for (const m of menuActive) {
      if (m.category !== affinity || ownItems.has(m.name))
        continue;
      offer(m.name, m.category, 12, "category_new", `New to them, in the ${affinity} they always buy`);
    }
  }
  if (inputs.festival) {
    const festCats = new Set(inputs.festival.categories);
    for (const c of candidates.values()) {
      if (festCats.has(c.category))
        c.score += 15;
    }
    if (hasMenu) {
      for (const m of menuActive) {
        if (festCats.has(m.category) && !ownItems.has(m.name)) {
          offer(m.name, m.category, 14, "festival", `${inputs.festival.name} pick \u2014 festive ${m.category}`);
        }
      }
    }
  }
  return [...candidates.values()].sort((x, y) => y.score - x.score).slice(0, limit).map(({ score: _score, ...rec }) => rec);
}
async function counterRecommendationsFor(tenant, profileId) {
  const [featuresArr, purchased, pairs, menu] = await Promise.all([
    getFeaturesForProfiles(tenant.id, [profileId]),
    purchasedItemsForProfile(tenant.id, profileId),
    coPurchasePairs(tenant.id),
    listMenuItems(tenant.id)
  ]);
  const window2 = activeFestivalWindow(tenant, /* @__PURE__ */ new Date());
  const festival = window2 ? {
    name: window2.name,
    categories: tenant.config.festivals.find((f) => f.name === window2.name && f.date === window2.date)?.categories ?? []
  } : null;
  const inputs = {
    features: featuresArr[0] ?? null,
    purchased,
    pairs,
    menu,
    festival
  };
  return { recommendations: rankCounterRecommendations(inputs), inputs };
}

// ../../packages/core/dist/coupons.js
import crypto3 from "node:crypto";
function pickCouponTier(tiers, amount) {
  let best = null;
  for (const tier of tiers) {
    if (amount >= tier.minAmount && (!best || tier.minAmount > best.minAmount))
      best = tier;
  }
  return best;
}
function generateCouponCode(prefixRaw) {
  const prefix = (prefixRaw.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 6) || "HP").padEnd(2, "X");
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (const byte of crypto3.randomBytes(6))
    suffix += alphabet[byte % alphabet.length];
  return `${prefix}-CP-${suffix}`;
}
function describeCouponValue(c) {
  return c.discountType === "percent" ? `${c.discountValue}% off` : `\u20B9${c.discountValue} off`;
}
async function maybeIssueCoupon(tenant, profileId, phone, amount, source) {
  const cfg = couponConfig(tenant.config);
  if (!cfg.enabled || cfg.tiers.length === 0)
    return null;
  const tier = pickCouponTier(cfg.tiers, amount);
  if (!tier)
    return null;
  const lastIssued = await latestCouponIssuedAt(tenant.id, profileId);
  if (lastIssued) {
    const daysSince = (Date.now() - new Date(lastIssued).getTime()) / 864e5;
    if (daysSince < cfg.minDaysBetweenCoupons)
      return null;
  }
  return insertCoupon({
    tenantId: tenant.id,
    profileId,
    phone,
    code: generateCouponCode(cfg.codePrefix ?? tenant.config.slug),
    discountType: tier.discountType,
    discountValue: tier.discountValue,
    issuedForAmount: amount,
    source,
    expiresAt: new Date(Date.now() + tier.validityDays * 864e5)
  });
}
function generateQrToken() {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let token = "";
  for (const byte of crypto3.randomBytes(10))
    token += alphabet[byte % alphabet.length];
  return `Q-${token}`;
}
var QR_TOKEN_REGEX = /\bQ-[A-Z0-9]{10}\b/;

// ../../packages/core/dist/menu.js
async function importMenuFromHistory(tenantId) {
  const [candidates, existing] = await Promise.all([
    menuCandidatesFromHistory(tenantId),
    listMenuItems(tenantId)
  ]);
  const existingNames = new Set(existing.map((m) => m.name));
  let imported = 0;
  for (const c of candidates) {
    if (existingNames.has(c.name))
      continue;
    await upsertMenuItem(tenantId, {
      name: c.name,
      category: c.category,
      price: c.price,
      description: null,
      tags: [],
      available: true
    });
    imported++;
  }
  return { imported, skipped: candidates.length - imported };
}

// ../../packages/channels/dist/receipt.js
var GRAPH_API_BASE = "https://graph.facebook.com/v20.0";
async function sendTransactionalWhatsApp(tenant, profile, kind, body) {
  const optedOut = await getOptedOutPhones(tenant.id);
  const blocked = optedOut.has(profile.phone);
  let liveSendFailed = false;
  if (!blocked && process.env.WHATSAPP_MODE === "live") {
    const res = await fetch(`${GRAPH_API_BASE}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: profile.phone.replace(/\D/g, ""),
        type: "text",
        text: { body }
      })
    });
    if (!res.ok) {
      liveSendFailed = true;
      const errBody = await res.json().catch(() => ({}));
      console.error(`[whatsapp] transactional send (${kind}) failed:`, errBody);
    }
  }
  const status = blocked || liveSendFailed ? "failed" : "sent";
  await insertTransactionalMessage({
    tenantId: tenant.id,
    profileId: profile.id,
    kind,
    body,
    status
  });
  return { status };
}
function couponLines(coupon) {
  if (!coupon)
    return [];
  const expires = new Date(coupon.expiresAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
  return [
    "",
    `\u{1F381} A little thank-you, just for you: *${describeCouponValue(coupon)}* on your next visit.`,
    `Your code: *${coupon.code}* (valid till ${expires})`,
    `Show it at the counter or reply with the code to redeem.`
  ];
}
function loyaltyLines(tenant, pointsEarned, balance) {
  const cfg = loyaltyConfig(tenant.config);
  if (!cfg.enabled)
    return [];
  const valueRupees = Math.floor(balance * cfg.pointValueRupees);
  return [
    "",
    `\u2B50 You earned *${pointsEarned} points* on this order.`,
    `Balance: *${balance} points* (worth \u20B9${valueRupees}).`
  ];
}
function buildReceiptText(tenant, event, pointsEarned, balance, coupon) {
  const cfg = receiptConfig(tenant.config);
  const lines = [
    `\u{1F9FE} *${tenant.config.branding.shopName}* \u2014 thank you for your purchase!`,
    ""
  ];
  if (cfg.showItems && event.items.length > 0) {
    for (const it of event.items) {
      lines.push(`\u2022 ${it.name} \xD7 ${it.qty} \u2014 \u20B9${Math.round(it.unitPrice * it.qty)}`);
    }
  }
  lines.push(`*Total: \u20B9${Math.round(event.amount)}*`);
  lines.push(...loyaltyLines(tenant, pointsEarned, balance));
  lines.push(...couponLines(coupon));
  if (cfg.footerNote)
    lines.push("", cfg.footerNote);
  return lines.join("\n");
}
async function sendPurchaseReceipts(tenant, events) {
  if (!receiptConfig(tenant.config).enabled)
    return { sent: 0, couponsIssued: 0 };
  let sent = 0;
  let couponsIssued = 0;
  for (const event of events) {
    if (event.eventType !== "purchase")
      continue;
    const profile = await getProfileByPhone(tenant.id, event.phone);
    if (!profile)
      continue;
    const pointsEarned = pointsForPurchase(tenant, event.amount);
    const balance = await loyaltyBalance(tenant.id, profile.id);
    const coupon = await maybeIssueCoupon(tenant, profile.id, event.phone, event.amount, "receipt");
    if (coupon)
      couponsIssued++;
    const body = buildReceiptText(tenant, event, pointsEarned, balance, coupon);
    const { status } = await sendTransactionalWhatsApp(tenant, profile, "receipt", body);
    if (status === "sent")
      sent++;
  }
  return { sent, couponsIssued };
}
async function sendQrWelcome(tenant, profile, qr, coupon) {
  const pointsEarned = pointsForPurchase(tenant, qr.amount);
  const balance = await loyaltyBalance(tenant.id, profile.id);
  const sourceName = qr.source !== "other" ? ` ${cap(qr.source)}` : "";
  const lines = [
    `\u{1F64F} Welcome to *${tenant.config.branding.shopName}*!`,
    "",
    `Your${sourceName} order (\u20B9${Math.round(qr.amount)}) is now linked to your number \u2014 from here on you earn rewards on every order, online or in store.`
  ];
  lines.push(...loyaltyLines(tenant, pointsEarned, balance));
  lines.push(...couponLines(coupon));
  lines.push("", `Reply STOP anytime to unsubscribe.`);
  return sendTransactionalWhatsApp(tenant, profile, "qr_welcome", lines.join("\n"));
}
var cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// ../../packages/channels/dist/whatsapp.js
var GRAPH_API_BASE2 = "https://graph.facebook.com/v20.0";
var NAME_FROM_MESSAGE_RE = /this is\s+([^,]{1,80}),\s*adding my order/i;
function mode() {
  return process.env.WHATSAPP_MODE === "live" ? "live" : "stub";
}
async function ensureCampaignTemplate(tenant, campaignType, templateBody, variables) {
  const status = mode() === "stub" ? "approved" : "submitted";
  await upsertWhatsappTemplate({
    tenantId: tenant.id,
    name: `${campaignType}_${hashish(templateBody)}`,
    body: templateBody,
    variables,
    status,
    campaignType
  });
  if (mode() === "live") {
  }
  return { approved: status === "approved" };
}
async function sendViaWhatsApp(tenant, profile, renderedText, meta) {
  const optIns = await getWhatsappOptIns(tenant.id);
  if (!optIns.has(profile.phone)) {
    return { ok: false, error: "no WhatsApp opt-in recorded for this number" };
  }
  const template = await getApprovedTemplate(tenant.id, meta.campaignType);
  if (!template) {
    return {
      ok: false,
      error: `no approved WhatsApp template for campaign type "${meta.campaignType}"`
    };
  }
  if (mode() === "stub") {
    return { ok: true, providerMessageId: `stub-wa-${meta.messageId}` };
  }
  const res = await fetch(`${GRAPH_API_BASE2}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: profile.phone,
      type: "template",
      template: {
        name: template.name,
        language: { code: tenant.config.brandVoice.language.replace("-", "_") },
        components: [
          {
            type: "body",
            parameters: template.variables.map(() => ({ type: "text", text: "" }))
          }
        ]
      },
      // Echoed back in status webhooks so we can correlate.
      biz_opaque_callback_data: meta.messageId
    })
  });
  const body = await res.json();
  if (!res.ok || !body.messages?.[0]) {
    return { ok: false, error: body.error?.message ?? `graph api ${res.status}` };
  }
  return { ok: true, providerMessageId: body.messages[0].id };
}
async function handleWhatsAppStatusWebhook(payload) {
  let updated = 0;
  for (const entry of payload?.entry ?? []) {
    for (const change of entry?.changes ?? []) {
      for (const status of change?.value?.statuses ?? []) {
        const messageId = status?.biz_opaque_callback_data;
        const s = status?.status;
        if (!messageId || !["sent", "delivered", "read", "failed"].includes(s))
          continue;
        await updateMessageStatus(messageId, s);
        updated++;
      }
    }
  }
  return updated;
}
async function handleWhatsAppInboundWebhook(tenantId, payload) {
  const tenant = await getTenantById(tenantId);
  if (!tenant)
    return { replies: 0, optOuts: 0, redemptions: 0, qrClaims: 0 };
  let replies = 0;
  let optOuts = 0;
  let redemptions = 0;
  let qrClaims = 0;
  for (const entry of payload?.entry ?? []) {
    for (const change of entry?.changes ?? []) {
      for (const msg of change?.value?.messages ?? []) {
        const phone = normalizePhone(String(msg?.from ?? ""));
        const text = msg?.text?.body ?? "";
        if (!phone)
          continue;
        const nameFromText = text.match(NAME_FROM_MESSAGE_RE)?.[1]?.trim();
        const contact = (change?.value?.contacts ?? []).find((c) => c?.wa_id === msg?.from);
        const name = nameFromText || contact?.profile?.name;
        const profile = await upsertProfile(tenantId, phone, name ? { name } : {});
        await insertEvent(tenantId, profile.id, {
          eventType: "message_reply",
          items: [],
          amount: 0,
          ts: /* @__PURE__ */ new Date(),
          locationId: void 0
        });
        replies++;
        await query(`UPDATE messages SET status = 'replied'
           WHERE id = (
             SELECT m.id FROM messages m
             JOIN campaigns c ON c.id = m.campaign_id
             WHERE c.tenant_id = $1 AND m.profile_id = $2 AND m.is_control = false
             ORDER BY m.sent_at DESC NULLS LAST LIMIT 1
           )`, [tenantId, profile.id]);
        if (/^\s*(stop|unsubscribe)\s*$/i.test(text)) {
          await addOptOut(tenantId, phone);
          optOuts++;
          continue;
        }
        await addWhatsappOptIn(tenantId, phone, "inbound_reply");
        const qrMatch = text.toUpperCase().match(QR_TOKEN_REGEX);
        if (qrMatch) {
          const qr = await getQrOrderForTenant(tenantId, qrMatch[0]);
          if (qr && qr.status === "pending") {
            await ingestNormalizedEvents(tenant, [
              {
                tenantId,
                phone,
                traits: {},
                locationId: void 0,
                eventType: "purchase",
                items: qr.items,
                amount: qr.amount,
                ts: new Date(qr.createdAt)
              }
            ]);
            if (await claimQrOrder(tenantId, qr.id, profile.id)) {
              const coupon = await maybeIssueCoupon(tenant, profile.id, phone, qr.amount, "qr_welcome");
              await sendQrWelcome(tenant, profile, qr, coupon);
              qrClaims++;
            }
            continue;
          }
        }
        const codeMatch = text.toUpperCase().match(/\b[A-Z]{2,6}-[A-Z]{2}-[A-Z0-9]{4,8}\b/);
        if (codeMatch) {
          const message = await getMessageByRedemptionCode(codeMatch[0]);
          if (message && message.profileId === profile.id) {
            await insertEvent(tenantId, profile.id, {
              eventType: "redemption",
              items: [{ name: codeMatch[0], category: "redemption", qty: 1, unitPrice: 0 }],
              amount: 0,
              ts: /* @__PURE__ */ new Date(),
              locationId: void 0
            });
            redemptions++;
            continue;
          }
          const coupon = await getCouponByCode(tenantId, codeMatch[0]);
          if (coupon && coupon.profileId === profile.id && new Date(coupon.expiresAt).getTime() > Date.now() && await redeemCoupon(tenantId, coupon.id)) {
            await insertEvent(tenantId, profile.id, {
              eventType: "redemption",
              items: [{ name: coupon.code, category: "coupon", qty: 1, unitPrice: 0 }],
              amount: 0,
              ts: /* @__PURE__ */ new Date(),
              locationId: void 0
            });
            redemptions++;
          }
        }
      }
    }
  }
  return { replies, optOuts, redemptions, qrClaims };
}
function hashish(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++)
    h = h * 31 + s.charCodeAt(i) | 0;
  return Math.abs(h).toString(36).slice(0, 8);
}

// ../../packages/channels/dist/email.js
async function sendViaEmail(tenant, profile, renderedText, meta) {
  const email = typeof profile.traits.email === "string" ? profile.traits.email : null;
  if (!email)
    return { ok: false, error: "profile has no email" };
  if (!tenant.config.channels.email.enabled) {
    return { ok: false, error: "email channel disabled for tenant" };
  }
  if (process.env.EMAIL_MODE !== "resend") {
    return { ok: true, providerMessageId: `stub-email-${meta.messageId}` };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: tenant.config.channels.email.fromAddress,
      to: email,
      subject: `A note from ${tenant.config.branding.shopName}`,
      text: renderedText
    })
  });
  const body = await res.json();
  if (!res.ok || !body.id)
    return { ok: false, error: body.message ?? `resend ${res.status}` };
  return { ok: true, providerMessageId: body.id };
}

// ../../packages/channels/dist/call-list.js
function buildCallListCsv(tenant, entries) {
  const esc = (v) => /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  const header = [
    "Name",
    "Phone",
    "Lifetime Value (\u20B9)",
    "Days Since Last Visit",
    "Favorite Item",
    "Redemption Code",
    "Talking Points"
  ];
  const rows = entries.map(({ profile, features, redemptionCode: redemptionCode2 }) => {
    const name = typeof profile.traits.name === "string" ? profile.traits.name : "";
    return [
      name,
      profile.phone,
      String(Math.round(features.monetaryLtv)),
      String(features.recencyDays),
      features.favoriteItem ?? "",
      redemptionCode2 ?? "",
      talkingPoints(tenant, name, features)
    ];
  });
  return [header, ...rows].map((r) => r.map(esc).join(",")).join("\n") + "\n";
}
function talkingPoints(tenant, name, f) {
  const shop = tenant.config.branding.shopName;
  const first = name.split(" ")[0] || "ji";
  const lines = [
    `Greet ${first} warmly as a valued ${shop} customer (\u20B9${Math.round(f.monetaryLtv)} lifetime).`,
    `It's been ${f.recencyDays} days since their last visit \u2014 ask how they've been, no hard sell.`,
    f.favoriteItem ? `Mention their favorite, ${f.favoriteItem}, is fresh \u2014 offer to set some aside.` : `Ask what they usually enjoy and offer to set it aside.`,
    `If interested, share their personal code for a small welcome-back treat.`
  ];
  return lines.join(" | ");
}

// ../../packages/channels/dist/campaign-sender.js
async function sendApprovedCampaign(tenant, campaignId) {
  const campaign = await getCampaign(tenant.id, campaignId);
  if (!campaign)
    throw new Error(`campaign ${campaignId} not found for tenant`);
  if (campaign.status !== "approved") {
    throw new Error(`campaign is "${campaign.status}" \u2014 only approved campaigns send`);
  }
  if (!campaign.generatedCopy)
    throw new Error("campaign has no generated copy");
  const segment = await getSegment(tenant.id, campaign.segmentId);
  if (!segment)
    throw new Error("segment not found");
  await ensureCampaignTemplate(tenant, segment.campaignType, campaign.generatedCopy.template, campaign.generatedCopy.variables);
  const messages = await messagesForCampaign(campaign.id);
  const profileIds = messages.map((m) => m.profileId);
  const [profiles, features] = await Promise.all([
    getProfilesByIds(tenant.id, profileIds),
    getFeaturesForProfiles(tenant.id, profileIds)
  ]);
  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const featuresById = new Map(features.map((f) => [f.profileId, f]));
  const festivalName = nearestFestivalName(tenant);
  const callThreshold = tenant.config.channels.callList.minLtvThreshold;
  const callListEnabled = tenant.config.channels.callList.enabled;
  const result = { sent: 0, failed: 0, callList: 0, control: 0, callListReady: false };
  const callEntries = [];
  for (const message of messages) {
    if (message.isControl) {
      result.control++;
      continue;
    }
    const profile = profileById.get(message.profileId);
    const f = featuresById.get(message.profileId);
    if (!profile) {
      await updateMessageStatus(message.id, "failed");
      result.failed++;
      continue;
    }
    const rendered = renderTemplate(campaign.generatedCopy.template, variablesForProfile(profile, f, {
      shop_name: tenant.config.branding.shopName,
      redemption_code: message.redemptionCode ?? "",
      festival_name: festivalName
    }));
    const channel = callListEnabled && segment.campaignType === "winback" && (f?.monetaryLtv ?? 0) >= callThreshold ? "call" : "whatsapp";
    const sendResult = await send(channel, tenant, profile, rendered, {
      tenantId: tenant.id,
      campaignId: campaign.id,
      messageId: message.id,
      campaignType: segment.campaignType,
      redemptionCode: message.redemptionCode
    });
    await query(`UPDATE messages SET channel = $2, rendered_text = $3, status = $4, sent_at = now()
       WHERE id = $1`, [message.id, channel, rendered, sendResult.ok ? "sent" : "failed"]);
    if (!sendResult.ok) {
      result.failed++;
      continue;
    }
    if (channel === "call") {
      result.callList++;
      if (f)
        callEntries.push({ profile, features: f, redemptionCode: message.redemptionCode });
    } else {
      result.sent++;
    }
  }
  if (callEntries.length > 0) {
    await setCampaignCallListCsv(tenant.id, campaign.id, buildCallListCsv(tenant, callEntries));
    result.callListReady = true;
  }
  await setCampaignStatus(tenant.id, campaign.id, "sent");
  return result;
}
function nearestFestivalName(tenant) {
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const future = tenant.config.festivals.filter((f) => f.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  return future[0]?.name ?? tenant.config.festivals[tenant.config.festivals.length - 1]?.name ?? "";
}

// ../../packages/channels/dist/direct.js
async function sendDirectMessage(tenant, profile, body, sentBy) {
  const optedOut = await getOptedOutPhones(tenant.id);
  const blocked = optedOut.has(profile.phone);
  if (!blocked && process.env.WHATSAPP_MODE === "live") {
  }
  return insertDirectMessage({
    tenantId: tenant.id,
    profileId: profile.id,
    channel: "whatsapp",
    body,
    status: blocked ? "failed" : "sent",
    sentBy
  });
}

// ../../packages/channels/dist/index.js
async function send(channel, tenant, profile, renderedText, meta) {
  switch (channel) {
    case "whatsapp":
      return sendViaWhatsApp(tenant, profile, renderedText, meta);
    case "email":
      return sendViaEmail(tenant, profile, renderedText, meta);
    case "call":
      return { ok: true, providerMessageId: `call-list-${meta.messageId}` };
  }
}

// src/routes/ingest.ts
var ingestRouter = Router();
ingestRouter.post("/events", async (req, res) => {
  const tenant = req.tenant;
  const bodies = Array.isArray(req.body) ? req.body : [req.body];
  if (bodies.length === 0 || bodies.length > 500) {
    res.status(400).json({ error: "expected 1-500 events" });
    return;
  }
  const events = [];
  const errors = [];
  bodies.forEach((body, index) => {
    const result = normalizeTrackPayload(tenant.id, body);
    if ("error" in result) errors.push({ index, error: result.error });
    else events.push(result.event);
  });
  const { processed } = await ingestNormalizedEvents(tenant, events);
  const receipts = await sendPurchaseReceipts(tenant, events);
  res.status(errors.length && !processed ? 400 : 200).json({ processed, errors, receipts });
});
var upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
ingestRouter.post("/uploads", upload.single("file"), async (req, res) => {
  const tenant = req.tenant;
  if (!req.file) {
    res.status(400).json({ error: 'missing multipart file field "file"' });
    return;
  }
  const uploadRow = await createUpload(tenant.id, req.file.originalname);
  try {
    const rows = parseCsv(req.file.buffer.toString("utf8"));
    const { events, errors } = mapCsvRows(tenant.id, rows, tenant.config.posColumnMapping);
    const { processed } = await ingestNormalizedEvents(tenant, events);
    const errorLog = errors.length ? errors.map((e) => `row ${e.rowNumber}: ${e.reason}`).join("\n") : null;
    const status = processed > 0 ? "success" : "error";
    await finishUpload(tenant.id, uploadRow.id, status, processed, errorLog);
    res.json({ uploadId: uploadRow.id, status, rowsProcessed: processed, rowErrors: errors });
  } catch (err) {
    await finishUpload(tenant.id, uploadRow.id, "error", 0, String(err));
    res.status(500).json({ uploadId: uploadRow.id, status: "error", error: String(err) });
  }
});
ingestRouter.get("/uploads", async (req, res) => {
  res.json({ uploads: await listUploads(req.tenant.id) });
});

// src/routes/app.ts
import { Router as Router2 } from "express";
var appRouter = Router2();
appRouter.get("/me", (req, res) => {
  const t = req.tenant;
  res.json({ tenant: { id: t.id, name: t.name, config: t.config } });
});
appRouter.get("/insights", async (req, res) => {
  const tenant = req.tenant;
  const [stats, segments, top, trend, campaigns] = await Promise.all([
    featureStats(tenant.id),
    listSegments(tenant.id),
    topProfilesByLtv(tenant.id, 10),
    monthlyRepeatRate(tenant.id, 8),
    listCampaigns(tenant.id, ["sent"])
  ]);
  const segmentSizes = await Promise.all(
    segments.map(async (s) => ({
      id: s.id,
      name: s.name,
      campaignType: s.campaignType,
      size: (await audienceForSegment(tenant, s)).length
    }))
  );
  let incrementalRevenue = 0;
  let totalRedemptions = 0;
  for (const c of campaigns) {
    const report = await computeAttribution(tenant, c.id);
    if (report) {
      incrementalRevenue += report.incrementalRevenuePerCustomer * report.messagedCount;
      totalRedemptions += report.redemptions;
    }
  }
  res.json({
    customers: stats,
    segments: segmentSizes,
    topCustomers: top.map((t) => ({
      name: typeof t.traits.name === "string" && t.traits.name ? t.traits.name : "Customer",
      phone: t.phone,
      ltv: t.monetaryLtv,
      recencyDays: t.recencyDays,
      favoriteItem: t.favoriteItem
    })),
    repeatTrend: trend,
    impact: {
      sentCampaigns: campaigns.length,
      incrementalRevenue: Math.round(incrementalRevenue),
      redemptions: totalRedemptions
    }
  });
});
appRouter.get("/campaigns", async (req, res) => {
  const tenant = req.tenant;
  const [campaigns, segments] = await Promise.all([
    listCampaigns(tenant.id),
    listSegments(tenant.id)
  ]);
  const segmentById = new Map(segments.map((s) => [s.id, s]));
  const items = await Promise.all(
    campaigns.map(async (c) => {
      const segment = segmentById.get(c.segmentId);
      const stats = await campaignMessageStats(c.id);
      const attribution = c.status === "sent" ? await computeAttribution(tenant, c.id) : null;
      return {
        id: c.id,
        status: c.status,
        createdAt: c.createdAt,
        approvedAt: c.approvedAt,
        approvedBy: c.approvedBy,
        audienceSize: c.audienceSize,
        segmentName: segment?.name ?? "",
        campaignType: segment?.campaignType ?? "",
        copy: c.generatedCopy,
        stats,
        attribution,
        hasCallList: Boolean(c.callListCsv)
      };
    })
  );
  res.json({ campaigns: items });
});
appRouter.post("/campaigns/:id/approve", async (req, res) => {
  const tenant = req.tenant;
  const campaign = await getCampaign(tenant.id, req.params.id);
  if (!campaign) {
    res.status(404).json({ error: "campaign not found" });
    return;
  }
  if (campaign.status !== "pending_approval") {
    res.status(409).json({ error: `campaign is "${campaign.status}", not pending_approval` });
    return;
  }
  await setCampaignStatus(tenant.id, campaign.id, "approved", tenant.config.slug);
  const result = await sendApprovedCampaign(tenant, campaign.id);
  res.json({ ok: true, result });
});
appRouter.get("/campaigns/:id/call-list.csv", async (req, res) => {
  const tenant = req.tenant;
  const campaign = await getCampaign(tenant.id, req.params.id);
  if (!campaign || !campaign.callListCsv) {
    res.status(404).json({ error: "no call list for this campaign" });
    return;
  }
  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="call-list-${campaign.id.slice(0, 8)}.csv"`
  );
  res.send(campaign.callListCsv);
});
appRouter.post("/campaigns/:id/reject", async (req, res) => {
  const tenant = req.tenant;
  const updated = await setCampaignStatus(tenant.id, req.params.id, "rejected");
  if (!updated) {
    res.status(404).json({ error: "campaign not found" });
    return;
  }
  res.json({ ok: true });
});
appRouter.put("/campaigns/:id/template", async (req, res) => {
  const tenant = req.tenant;
  const template = String(req.body?.template ?? "").trim();
  if (!template) {
    res.status(400).json({ error: "template is required" });
    return;
  }
  const used = [...template.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1]);
  const unknown = used.filter((v) => !TEMPLATE_VARIABLES.includes(v));
  if (unknown.length > 0) {
    res.status(400).json({
      error: `unknown variables: ${unknown.join(", ")} (allowed: ${TEMPLATE_VARIABLES.join(", ")})`
    });
    return;
  }
  const campaign = await getCampaign(tenant.id, req.params.id);
  if (!campaign || !campaign.generatedCopy) {
    res.status(404).json({ error: "campaign not found" });
    return;
  }
  if (campaign.status !== "pending_approval") {
    res.status(409).json({ error: "only pending campaigns can be edited" });
    return;
  }
  const messages = (await messagesForCampaign(campaign.id)).filter((m) => !m.isControl).slice(0, 3);
  const profileIds = messages.map((m) => m.profileId);
  const [profiles, features] = await Promise.all([
    getProfilesByIds(tenant.id, profileIds),
    getFeaturesForProfiles(tenant.id, profileIds)
  ]);
  const featuresById = new Map(features.map((f) => [f.profileId, f]));
  const copy = {
    ...campaign.generatedCopy,
    template,
    variables: [...new Set(used)],
    provider: `${campaign.generatedCopy.provider}+edited`,
    samples: profiles.map((p) => ({
      profileId: p.id,
      rendered: renderTemplate(
        template,
        variablesForProfile(p, featuresById.get(p.id), {
          shop_name: tenant.config.branding.shopName,
          redemption_code: `${tenant.config.slug.slice(0, 4).toUpperCase()}-SAMPLE`,
          festival_name: ""
        })
      )
    }))
  };
  await setCampaignCopy(tenant.id, campaign.id, copy);
  res.json({ ok: true, copy });
});
appRouter.get("/attribution/:campaignId", async (req, res) => {
  const tenant = req.tenant;
  const report = await computeAttribution(tenant, req.params.campaignId);
  if (!report) {
    res.status(404).json({ error: "no attribution available (campaign not sent?)" });
    return;
  }
  res.json(report);
});
appRouter.get("/preferences", async (req, res) => {
  const tenant = req.tenant;
  const prefs = await getPreferences(tenant.id);
  const byType = new Map(prefs.map((p) => [p.campaignType, p]));
  res.json({
    preferences: ALL_CAMPAIGN_TYPES.map(
      (t) => byType.get(t) ?? {
        tenantId: tenant.id,
        campaignType: t,
        enabled: true,
        maxPerCustomerPerWeek: 1
      }
    )
  });
});
appRouter.put("/preferences", async (req, res) => {
  const tenant = req.tenant;
  const updates = Array.isArray(req.body?.preferences) ? req.body.preferences : [];
  for (const u of updates) {
    if (!ALL_CAMPAIGN_TYPES.includes(u.campaignType)) continue;
    await upsertPreference({
      tenantId: tenant.id,
      campaignType: u.campaignType,
      enabled: Boolean(u.enabled),
      maxPerCustomerPerWeek: Math.max(1, Math.min(7, Number(u.maxPerCustomerPerWeek) || 1))
    });
  }
  res.json({ preferences: await getPreferences(tenant.id) });
});
appRouter.get("/settings/engagement", (req, res) => {
  const config = req.tenant.config;
  res.json({
    receipts: receiptConfig(config),
    coupons: couponConfig(config),
    qrCapture: qrCaptureConfig(config)
  });
});
appRouter.put("/settings/engagement", async (req, res) => {
  const tenant = req.tenant;
  const body = req.body ?? {};
  const tiers = (Array.isArray(body.coupons?.tiers) ? body.coupons.tiers : []).map((t) => ({
    minAmount: Math.max(0, Number(t.minAmount) || 0),
    discountType: t.discountType === "flat" ? "flat" : "percent",
    discountValue: Math.max(0, Number(t.discountValue) || 0),
    validityDays: Math.max(1, Math.min(365, Number(t.validityDays) || 30))
  })).filter((t) => t.discountValue > 0);
  if (body.qrCapture?.messageTemplate && !String(body.qrCapture.messageTemplate).includes("{{token}}")) {
    res.status(400).json({ error: "qrCapture.messageTemplate must include {{token}} \u2014 that's how the scan links back to the order" });
    return;
  }
  const patch = {
    receipts: {
      enabled: Boolean(body.receipts?.enabled),
      showItems: Boolean(body.receipts?.showItems ?? true),
      ...body.receipts?.footerNote ? { footerNote: String(body.receipts.footerNote).slice(0, 200) } : {}
    },
    coupons: {
      enabled: Boolean(body.coupons?.enabled) && tiers.length > 0,
      tiers,
      minDaysBetweenCoupons: Math.max(0, Math.min(90, Number(body.coupons?.minDaysBetweenCoupons) || 7)),
      ...body.coupons?.codePrefix ? { codePrefix: String(body.coupons.codePrefix).replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 6) } : {}
    },
    qrCapture: {
      enabled: Boolean(body.qrCapture?.enabled ?? true),
      ...body.qrCapture?.messageTemplate ? { messageTemplate: String(body.qrCapture.messageTemplate).slice(0, 300) } : {}
    }
  };
  await patchTenantConfig(tenant.id, patch);
  res.json(patch);
});
appRouter.get("/settings", async (req, res) => {
  const tenant = req.tenant;
  res.json({
    shopName: tenant.config.branding.shopName,
    branding: tenant.config.branding,
    whatsapp: {
      number: tenant.whatsappNumber,
      mode: process.env.WHATSAPP_MODE === "live" ? "live" : "stub",
      connected: process.env.WHATSAPP_MODE === "live"
    },
    email: tenant.config.channels.email,
    apiKey: tenant.apiKey,
    festivals: tenant.config.festivals
  });
});

// src/routes/webhooks.ts
import { Router as Router3 } from "express";
var webhooksRouter = Router3();
webhooksRouter.get("/whatsapp/:tenantSlug", (req, res) => {
  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ?? "dev-verify-token";
  if (req.query["hub.mode"] === "subscribe" && req.query["hub.verify_token"] === verifyToken) {
    res.send(req.query["hub.challenge"]);
    return;
  }
  res.sendStatus(403);
});
webhooksRouter.post("/whatsapp/:tenantSlug", async (req, res) => {
  const tenant = await getTenantBySlug(req.params.tenantSlug);
  if (!tenant) {
    res.sendStatus(404);
    return;
  }
  const statuses = await handleWhatsAppStatusWebhook(req.body);
  const inbound = await handleWhatsAppInboundWebhook(tenant.id, req.body);
  res.json({ ok: true, statuses, ...inbound });
});

// src/routes/redemptions.ts
import { Router as Router4 } from "express";
var redemptionsRouter = Router4();
redemptionsRouter.post("/redemptions", async (req, res) => {
  const tenant = req.tenant;
  const code = String(req.body?.code ?? "").trim().toUpperCase();
  const amount = Number(req.body?.amount) || 0;
  if (!code) {
    res.status(400).json({ error: "code is required" });
    return;
  }
  const message = await getMessageByRedemptionCode(code);
  if (!message) {
    const coupon = await getCouponByCode(tenant.id, code);
    if (!coupon) {
      res.status(404).json({ error: "unknown code" });
      return;
    }
    if (new Date(coupon.expiresAt).getTime() <= Date.now()) {
      res.status(409).json({ error: "coupon expired" });
      return;
    }
    if (!await redeemCoupon(tenant.id, coupon.id)) {
      res.status(409).json({ error: "coupon already redeemed" });
      return;
    }
    await insertEvent(tenant.id, coupon.profileId, {
      eventType: "redemption",
      items: [{ name: coupon.code, category: "coupon", qty: 1, unitPrice: 0 }],
      amount,
      ts: /* @__PURE__ */ new Date(),
      locationId: req.body?.location_id ? String(req.body.location_id) : void 0
    });
    res.json({ ok: true, coupon: { code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue }, profileId: coupon.profileId });
    return;
  }
  const campaign = await getCampaign(tenant.id, message.campaignId);
  if (!campaign) {
    res.status(404).json({ error: "unknown code" });
    return;
  }
  await insertEvent(tenant.id, message.profileId, {
    eventType: "redemption",
    items: [{ name: code, category: "redemption", qty: 1, unitPrice: 0 }],
    amount,
    ts: /* @__PURE__ */ new Date(),
    locationId: req.body?.location_id ? String(req.body.location_id) : void 0
  });
  res.json({ ok: true, campaignId: campaign.id, profileId: message.profileId });
});

// src/routes/segments.ts
import { Router as Router5 } from "express";

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/internal/tslib.mjs
function __classPrivateFieldSet(receiver, state, value, kind, f) {
  if (kind === "m")
    throw new TypeError("Private method is not writable");
  if (kind === "a" && !f)
    throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
    throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
}
function __classPrivateFieldGet(receiver, state, kind, f) {
  if (kind === "a" && !f)
    throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
    throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/internal/utils/uuid.mjs
var uuid4 = function() {
  const { crypto: crypto4 } = globalThis;
  if (crypto4?.randomUUID) {
    uuid4 = crypto4.randomUUID.bind(crypto4);
    return crypto4.randomUUID();
  }
  const u8 = new Uint8Array(1);
  const randomByte = crypto4 ? () => crypto4.getRandomValues(u8)[0] : () => Math.random() * 255 & 255;
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (+c ^ randomByte() & 15 >> +c / 4).toString(16));
};

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/internal/errors.mjs
function isAbortError(err) {
  return typeof err === "object" && err !== null && // Spec-compliant fetch implementations
  ("name" in err && err.name === "AbortError" || // Expo fetch
  "message" in err && String(err.message).includes("FetchRequestCanceledException"));
}
var castToError = (err) => {
  if (err instanceof Error)
    return err;
  if (typeof err === "object" && err !== null) {
    try {
      if (Object.prototype.toString.call(err) === "[object Error]") {
        const error = new Error(err.message, err.cause ? { cause: err.cause } : {});
        if (err.stack)
          error.stack = err.stack;
        if (err.cause && !error.cause)
          error.cause = err.cause;
        if (err.name)
          error.name = err.name;
        return error;
      }
    } catch {
    }
    try {
      return new Error(JSON.stringify(err));
    } catch {
    }
  }
  return new Error(err);
};

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/core/error.mjs
var AnthropicError = class extends Error {
};
var APIError = class _APIError extends AnthropicError {
  constructor(status, error, message, headers, type) {
    super(`${_APIError.makeMessage(status, error, message)}`);
    this.status = status;
    this.headers = headers;
    this.requestID = headers?.get("request-id");
    this.error = error;
    this.type = type ?? null;
  }
  static makeMessage(status, error, message) {
    const msg = error?.message ? typeof error.message === "string" ? error.message : JSON.stringify(error.message) : error ? JSON.stringify(error) : message;
    if (status && msg) {
      return `${status} ${msg}`;
    }
    if (status) {
      return `${status} status code (no body)`;
    }
    if (msg) {
      return msg;
    }
    return "(no status code or body)";
  }
  static generate(status, errorResponse, message, headers) {
    if (!status || !headers) {
      return new APIConnectionError({ message, cause: castToError(errorResponse) });
    }
    const error = errorResponse;
    const type = error?.["error"]?.["type"];
    if (status === 400) {
      return new BadRequestError(status, error, message, headers, type);
    }
    if (status === 401) {
      return new AuthenticationError(status, error, message, headers, type);
    }
    if (status === 403) {
      return new PermissionDeniedError(status, error, message, headers, type);
    }
    if (status === 404) {
      return new NotFoundError(status, error, message, headers, type);
    }
    if (status === 409) {
      return new ConflictError(status, error, message, headers, type);
    }
    if (status === 422) {
      return new UnprocessableEntityError(status, error, message, headers, type);
    }
    if (status === 429) {
      return new RateLimitError(status, error, message, headers, type);
    }
    if (status >= 500) {
      return new InternalServerError(status, error, message, headers, type);
    }
    return new _APIError(status, error, message, headers, type);
  }
};
var APIUserAbortError = class extends APIError {
  constructor({ message } = {}) {
    super(void 0, void 0, message || "Request was aborted.", void 0);
  }
};
var APIConnectionError = class extends APIError {
  constructor({ message, cause }) {
    super(void 0, void 0, message || "Connection error.", void 0);
    if (cause)
      this.cause = cause;
  }
};
var APIConnectionTimeoutError = class extends APIConnectionError {
  constructor({ message } = {}) {
    super({ message: message ?? "Request timed out." });
  }
};
var BadRequestError = class extends APIError {
};
var AuthenticationError = class extends APIError {
};
var PermissionDeniedError = class extends APIError {
};
var NotFoundError = class extends APIError {
};
var ConflictError = class extends APIError {
};
var UnprocessableEntityError = class extends APIError {
};
var RateLimitError = class extends APIError {
};
var InternalServerError = class extends APIError {
};

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/internal/utils/values.mjs
var startsWithSchemeRegexp = /^[a-z][a-z0-9+.-]*:/i;
var isAbsoluteURL = (url) => {
  return startsWithSchemeRegexp.test(url);
};
var isArray = (val) => (isArray = Array.isArray, isArray(val));
var isReadonlyArray = isArray;
function maybeObj(x) {
  if (typeof x !== "object") {
    return {};
  }
  return x ?? {};
}
function isEmptyObj(obj) {
  if (!obj)
    return true;
  for (const _k in obj)
    return false;
  return true;
}
function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}
var validatePositiveInteger = (name, n) => {
  if (typeof n !== "number" || !Number.isInteger(n)) {
    throw new AnthropicError(`${name} must be an integer`);
  }
  if (n < 0) {
    throw new AnthropicError(`${name} must be a positive integer`);
  }
  return n;
};
var safeJSON = (text) => {
  try {
    return JSON.parse(text);
  } catch (err) {
    return void 0;
  }
};

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/internal/utils/sleep.mjs
var sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/version.mjs
var VERSION = "0.90.0";

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/internal/detect-platform.mjs
var isRunningInBrowser = () => {
  return (
    // @ts-ignore
    typeof window !== "undefined" && // @ts-ignore
    typeof window.document !== "undefined" && // @ts-ignore
    typeof navigator !== "undefined"
  );
};
function getDetectedPlatform() {
  if (typeof Deno !== "undefined" && Deno.build != null) {
    return "deno";
  }
  if (typeof EdgeRuntime !== "undefined") {
    return "edge";
  }
  if (Object.prototype.toString.call(typeof globalThis.process !== "undefined" ? globalThis.process : 0) === "[object process]") {
    return "node";
  }
  return "unknown";
}
var getPlatformProperties = () => {
  const detectedPlatform = getDetectedPlatform();
  if (detectedPlatform === "deno") {
    return {
      "X-Stainless-Lang": "js",
      "X-Stainless-Package-Version": VERSION,
      "X-Stainless-OS": normalizePlatform(Deno.build.os),
      "X-Stainless-Arch": normalizeArch(Deno.build.arch),
      "X-Stainless-Runtime": "deno",
      "X-Stainless-Runtime-Version": typeof Deno.version === "string" ? Deno.version : Deno.version?.deno ?? "unknown"
    };
  }
  if (typeof EdgeRuntime !== "undefined") {
    return {
      "X-Stainless-Lang": "js",
      "X-Stainless-Package-Version": VERSION,
      "X-Stainless-OS": "Unknown",
      "X-Stainless-Arch": `other:${EdgeRuntime}`,
      "X-Stainless-Runtime": "edge",
      "X-Stainless-Runtime-Version": globalThis.process.version
    };
  }
  if (detectedPlatform === "node") {
    return {
      "X-Stainless-Lang": "js",
      "X-Stainless-Package-Version": VERSION,
      "X-Stainless-OS": normalizePlatform(globalThis.process.platform ?? "unknown"),
      "X-Stainless-Arch": normalizeArch(globalThis.process.arch ?? "unknown"),
      "X-Stainless-Runtime": "node",
      "X-Stainless-Runtime-Version": globalThis.process.version ?? "unknown"
    };
  }
  const browserInfo = getBrowserInfo();
  if (browserInfo) {
    return {
      "X-Stainless-Lang": "js",
      "X-Stainless-Package-Version": VERSION,
      "X-Stainless-OS": "Unknown",
      "X-Stainless-Arch": "unknown",
      "X-Stainless-Runtime": `browser:${browserInfo.browser}`,
      "X-Stainless-Runtime-Version": browserInfo.version
    };
  }
  return {
    "X-Stainless-Lang": "js",
    "X-Stainless-Package-Version": VERSION,
    "X-Stainless-OS": "Unknown",
    "X-Stainless-Arch": "unknown",
    "X-Stainless-Runtime": "unknown",
    "X-Stainless-Runtime-Version": "unknown"
  };
};
function getBrowserInfo() {
  if (typeof navigator === "undefined" || !navigator) {
    return null;
  }
  const browserPatterns = [
    { key: "edge", pattern: /Edge(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "ie", pattern: /MSIE(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "ie", pattern: /Trident(?:.*rv\:(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "chrome", pattern: /Chrome(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "firefox", pattern: /Firefox(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "safari", pattern: /(?:Version\W+(\d+)\.(\d+)(?:\.(\d+))?)?(?:\W+Mobile\S*)?\W+Safari/ }
  ];
  for (const { key, pattern } of browserPatterns) {
    const match = pattern.exec(navigator.userAgent);
    if (match) {
      const major = match[1] || 0;
      const minor = match[2] || 0;
      const patch = match[3] || 0;
      return { browser: key, version: `${major}.${minor}.${patch}` };
    }
  }
  return null;
}
var normalizeArch = (arch) => {
  if (arch === "x32")
    return "x32";
  if (arch === "x86_64" || arch === "x64")
    return "x64";
  if (arch === "arm")
    return "arm";
  if (arch === "aarch64" || arch === "arm64")
    return "arm64";
  if (arch)
    return `other:${arch}`;
  return "unknown";
};
var normalizePlatform = (platform) => {
  platform = platform.toLowerCase();
  if (platform.includes("ios"))
    return "iOS";
  if (platform === "android")
    return "Android";
  if (platform === "darwin")
    return "MacOS";
  if (platform === "win32")
    return "Windows";
  if (platform === "freebsd")
    return "FreeBSD";
  if (platform === "openbsd")
    return "OpenBSD";
  if (platform === "linux")
    return "Linux";
  if (platform)
    return `Other:${platform}`;
  return "Unknown";
};
var _platformHeaders;
var getPlatformHeaders = () => {
  return _platformHeaders ?? (_platformHeaders = getPlatformProperties());
};

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/internal/shims.mjs
function getDefaultFetch() {
  if (typeof fetch !== "undefined") {
    return fetch;
  }
  throw new Error("`fetch` is not defined as a global; Either pass `fetch` to the client, `new Anthropic({ fetch })` or polyfill the global, `globalThis.fetch = fetch`");
}
function makeReadableStream(...args) {
  const ReadableStream = globalThis.ReadableStream;
  if (typeof ReadableStream === "undefined") {
    throw new Error("`ReadableStream` is not defined as a global; You will need to polyfill it, `globalThis.ReadableStream = ReadableStream`");
  }
  return new ReadableStream(...args);
}
function ReadableStreamFrom(iterable) {
  let iter = Symbol.asyncIterator in iterable ? iterable[Symbol.asyncIterator]() : iterable[Symbol.iterator]();
  return makeReadableStream({
    start() {
    },
    async pull(controller) {
      const { done, value } = await iter.next();
      if (done) {
        controller.close();
      } else {
        controller.enqueue(value);
      }
    },
    async cancel() {
      await iter.return?.();
    }
  });
}
function ReadableStreamToAsyncIterable(stream) {
  if (stream[Symbol.asyncIterator])
    return stream;
  const reader = stream.getReader();
  return {
    async next() {
      try {
        const result = await reader.read();
        if (result?.done)
          reader.releaseLock();
        return result;
      } catch (e) {
        reader.releaseLock();
        throw e;
      }
    },
    async return() {
      const cancelPromise = reader.cancel();
      reader.releaseLock();
      await cancelPromise;
      return { done: true, value: void 0 };
    },
    [Symbol.asyncIterator]() {
      return this;
    }
  };
}
async function CancelReadableStream(stream) {
  if (stream === null || typeof stream !== "object")
    return;
  if (stream[Symbol.asyncIterator]) {
    await stream[Symbol.asyncIterator]().return?.();
    return;
  }
  const reader = stream.getReader();
  const cancelPromise = reader.cancel();
  reader.releaseLock();
  await cancelPromise;
}

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/internal/request-options.mjs
var FallbackEncoder = ({ headers, body }) => {
  return {
    bodyHeaders: {
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  };
};

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/internal/utils/query.mjs
function stringifyQuery(query2) {
  return Object.entries(query2).filter(([_, value]) => typeof value !== "undefined").map(([key, value]) => {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    }
    if (value === null) {
      return `${encodeURIComponent(key)}=`;
    }
    throw new AnthropicError(`Cannot stringify type ${typeof value}; Expected string, number, boolean, or null. If you need to pass nested query parameters, you can manually encode them, e.g. { query: { 'foo[key1]': value1, 'foo[key2]': value2 } }, and please open a GitHub issue requesting better support for your use case.`);
  }).join("&");
}

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/internal/utils/bytes.mjs
function concatBytes(buffers) {
  let length = 0;
  for (const buffer of buffers) {
    length += buffer.length;
  }
  const output = new Uint8Array(length);
  let index = 0;
  for (const buffer of buffers) {
    output.set(buffer, index);
    index += buffer.length;
  }
  return output;
}
var encodeUTF8_;
function encodeUTF8(str) {
  let encoder;
  return (encodeUTF8_ ?? (encoder = new globalThis.TextEncoder(), encodeUTF8_ = encoder.encode.bind(encoder)))(str);
}
var decodeUTF8_;
function decodeUTF8(bytes) {
  let decoder;
  return (decodeUTF8_ ?? (decoder = new globalThis.TextDecoder(), decodeUTF8_ = decoder.decode.bind(decoder)))(bytes);
}

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/internal/decoders/line.mjs
var _LineDecoder_buffer;
var _LineDecoder_carriageReturnIndex;
var LineDecoder = class {
  constructor() {
    _LineDecoder_buffer.set(this, void 0);
    _LineDecoder_carriageReturnIndex.set(this, void 0);
    __classPrivateFieldSet(this, _LineDecoder_buffer, new Uint8Array(), "f");
    __classPrivateFieldSet(this, _LineDecoder_carriageReturnIndex, null, "f");
  }
  decode(chunk) {
    if (chunk == null) {
      return [];
    }
    const binaryChunk = chunk instanceof ArrayBuffer ? new Uint8Array(chunk) : typeof chunk === "string" ? encodeUTF8(chunk) : chunk;
    __classPrivateFieldSet(this, _LineDecoder_buffer, concatBytes([__classPrivateFieldGet(this, _LineDecoder_buffer, "f"), binaryChunk]), "f");
    const lines = [];
    let patternIndex;
    while ((patternIndex = findNewlineIndex(__classPrivateFieldGet(this, _LineDecoder_buffer, "f"), __classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f"))) != null) {
      if (patternIndex.carriage && __classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f") == null) {
        __classPrivateFieldSet(this, _LineDecoder_carriageReturnIndex, patternIndex.index, "f");
        continue;
      }
      if (__classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f") != null && (patternIndex.index !== __classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f") + 1 || patternIndex.carriage)) {
        lines.push(decodeUTF8(__classPrivateFieldGet(this, _LineDecoder_buffer, "f").subarray(0, __classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f") - 1)));
        __classPrivateFieldSet(this, _LineDecoder_buffer, __classPrivateFieldGet(this, _LineDecoder_buffer, "f").subarray(__classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f")), "f");
        __classPrivateFieldSet(this, _LineDecoder_carriageReturnIndex, null, "f");
        continue;
      }
      const endIndex = __classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f") !== null ? patternIndex.preceding - 1 : patternIndex.preceding;
      const line = decodeUTF8(__classPrivateFieldGet(this, _LineDecoder_buffer, "f").subarray(0, endIndex));
      lines.push(line);
      __classPrivateFieldSet(this, _LineDecoder_buffer, __classPrivateFieldGet(this, _LineDecoder_buffer, "f").subarray(patternIndex.index), "f");
      __classPrivateFieldSet(this, _LineDecoder_carriageReturnIndex, null, "f");
    }
    return lines;
  }
  flush() {
    if (!__classPrivateFieldGet(this, _LineDecoder_buffer, "f").length) {
      return [];
    }
    return this.decode("\n");
  }
};
_LineDecoder_buffer = /* @__PURE__ */ new WeakMap(), _LineDecoder_carriageReturnIndex = /* @__PURE__ */ new WeakMap();
LineDecoder.NEWLINE_CHARS = /* @__PURE__ */ new Set(["\n", "\r"]);
LineDecoder.NEWLINE_REGEXP = /\r\n|[\n\r]/g;
function findNewlineIndex(buffer, startIndex) {
  const newline = 10;
  const carriage = 13;
  for (let i = startIndex ?? 0; i < buffer.length; i++) {
    if (buffer[i] === newline) {
      return { preceding: i, index: i + 1, carriage: false };
    }
    if (buffer[i] === carriage) {
      return { preceding: i, index: i + 1, carriage: true };
    }
  }
  return null;
}
function findDoubleNewlineIndex(buffer) {
  const newline = 10;
  const carriage = 13;
  for (let i = 0; i < buffer.length - 1; i++) {
    if (buffer[i] === newline && buffer[i + 1] === newline) {
      return i + 2;
    }
    if (buffer[i] === carriage && buffer[i + 1] === carriage) {
      return i + 2;
    }
    if (buffer[i] === carriage && buffer[i + 1] === newline && i + 3 < buffer.length && buffer[i + 2] === carriage && buffer[i + 3] === newline) {
      return i + 4;
    }
  }
  return -1;
}

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/internal/utils/log.mjs
var levelNumbers = {
  off: 0,
  error: 200,
  warn: 300,
  info: 400,
  debug: 500
};
var parseLogLevel = (maybeLevel, sourceName, client) => {
  if (!maybeLevel) {
    return void 0;
  }
  if (hasOwn(levelNumbers, maybeLevel)) {
    return maybeLevel;
  }
  loggerFor(client).warn(`${sourceName} was set to ${JSON.stringify(maybeLevel)}, expected one of ${JSON.stringify(Object.keys(levelNumbers))}`);
  return void 0;
};
function noop() {
}
function makeLogFn(fnLevel, logger, logLevel) {
  if (!logger || levelNumbers[fnLevel] > levelNumbers[logLevel]) {
    return noop;
  } else {
    return logger[fnLevel].bind(logger);
  }
}
var noopLogger = {
  error: noop,
  warn: noop,
  info: noop,
  debug: noop
};
var cachedLoggers = /* @__PURE__ */ new WeakMap();
function loggerFor(client) {
  const logger = client.logger;
  const logLevel = client.logLevel ?? "off";
  if (!logger) {
    return noopLogger;
  }
  const cachedLogger = cachedLoggers.get(logger);
  if (cachedLogger && cachedLogger[0] === logLevel) {
    return cachedLogger[1];
  }
  const levelLogger = {
    error: makeLogFn("error", logger, logLevel),
    warn: makeLogFn("warn", logger, logLevel),
    info: makeLogFn("info", logger, logLevel),
    debug: makeLogFn("debug", logger, logLevel)
  };
  cachedLoggers.set(logger, [logLevel, levelLogger]);
  return levelLogger;
}
var formatRequestDetails = (details) => {
  if (details.options) {
    details.options = { ...details.options };
    delete details.options["headers"];
  }
  if (details.headers) {
    details.headers = Object.fromEntries((details.headers instanceof Headers ? [...details.headers] : Object.entries(details.headers)).map(([name, value]) => [
      name,
      name.toLowerCase() === "x-api-key" || name.toLowerCase() === "authorization" || name.toLowerCase() === "cookie" || name.toLowerCase() === "set-cookie" ? "***" : value
    ]));
  }
  if ("retryOfRequestLogID" in details) {
    if (details.retryOfRequestLogID) {
      details.retryOf = details.retryOfRequestLogID;
    }
    delete details.retryOfRequestLogID;
  }
  return details;
};

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/core/streaming.mjs
var _Stream_client;
var Stream = class _Stream {
  constructor(iterator, controller, client) {
    this.iterator = iterator;
    _Stream_client.set(this, void 0);
    this.controller = controller;
    __classPrivateFieldSet(this, _Stream_client, client, "f");
  }
  static fromSSEResponse(response, controller, client) {
    let consumed = false;
    const logger = client ? loggerFor(client) : console;
    async function* iterator() {
      if (consumed) {
        throw new AnthropicError("Cannot iterate over a consumed stream, use `.tee()` to split the stream.");
      }
      consumed = true;
      let done = false;
      try {
        for await (const sse of _iterSSEMessages(response, controller)) {
          if (sse.event === "completion") {
            try {
              yield JSON.parse(sse.data);
            } catch (e) {
              logger.error(`Could not parse message into JSON:`, sse.data);
              logger.error(`From chunk:`, sse.raw);
              throw e;
            }
          }
          if (sse.event === "message_start" || sse.event === "message_delta" || sse.event === "message_stop" || sse.event === "content_block_start" || sse.event === "content_block_delta" || sse.event === "content_block_stop" || sse.event === "message" || sse.event === "user.message" || sse.event === "user.interrupt" || sse.event === "user.tool_confirmation" || sse.event === "user.custom_tool_result" || sse.event === "agent.message" || sse.event === "agent.thinking" || sse.event === "agent.tool_use" || sse.event === "agent.tool_result" || sse.event === "agent.mcp_tool_use" || sse.event === "agent.mcp_tool_result" || sse.event === "agent.custom_tool_use" || sse.event === "agent.thread_context_compacted" || sse.event === "session.status_running" || sse.event === "session.status_idle" || sse.event === "session.status_rescheduled" || sse.event === "session.status_terminated" || sse.event === "session.error" || sse.event === "session.deleted" || sse.event === "span.model_request_start" || sse.event === "span.model_request_end") {
            try {
              yield JSON.parse(sse.data);
            } catch (e) {
              logger.error(`Could not parse message into JSON:`, sse.data);
              logger.error(`From chunk:`, sse.raw);
              throw e;
            }
          }
          if (sse.event === "ping") {
            continue;
          }
          if (sse.event === "error") {
            const body = safeJSON(sse.data) ?? sse.data;
            const type = body?.error?.type;
            throw new APIError(void 0, body, void 0, response.headers, type);
          }
        }
        done = true;
      } catch (e) {
        if (isAbortError(e))
          return;
        throw e;
      } finally {
        if (!done)
          controller.abort();
      }
    }
    return new _Stream(iterator, controller, client);
  }
  /**
   * Generates a Stream from a newline-separated ReadableStream
   * where each item is a JSON value.
   */
  static fromReadableStream(readableStream, controller, client) {
    let consumed = false;
    async function* iterLines() {
      const lineDecoder = new LineDecoder();
      const iter = ReadableStreamToAsyncIterable(readableStream);
      for await (const chunk of iter) {
        for (const line of lineDecoder.decode(chunk)) {
          yield line;
        }
      }
      for (const line of lineDecoder.flush()) {
        yield line;
      }
    }
    async function* iterator() {
      if (consumed) {
        throw new AnthropicError("Cannot iterate over a consumed stream, use `.tee()` to split the stream.");
      }
      consumed = true;
      let done = false;
      try {
        for await (const line of iterLines()) {
          if (done)
            continue;
          if (line)
            yield JSON.parse(line);
        }
        done = true;
      } catch (e) {
        if (isAbortError(e))
          return;
        throw e;
      } finally {
        if (!done)
          controller.abort();
      }
    }
    return new _Stream(iterator, controller, client);
  }
  [(_Stream_client = /* @__PURE__ */ new WeakMap(), Symbol.asyncIterator)]() {
    return this.iterator();
  }
  /**
   * Splits the stream into two streams which can be
   * independently read from at different speeds.
   */
  tee() {
    const left = [];
    const right = [];
    const iterator = this.iterator();
    const teeIterator = (queue) => {
      return {
        next: () => {
          if (queue.length === 0) {
            const result = iterator.next();
            left.push(result);
            right.push(result);
          }
          return queue.shift();
        }
      };
    };
    return [
      new _Stream(() => teeIterator(left), this.controller, __classPrivateFieldGet(this, _Stream_client, "f")),
      new _Stream(() => teeIterator(right), this.controller, __classPrivateFieldGet(this, _Stream_client, "f"))
    ];
  }
  /**
   * Converts this stream to a newline-separated ReadableStream of
   * JSON stringified values in the stream
   * which can be turned back into a Stream with `Stream.fromReadableStream()`.
   */
  toReadableStream() {
    const self2 = this;
    let iter;
    return makeReadableStream({
      async start() {
        iter = self2[Symbol.asyncIterator]();
      },
      async pull(ctrl) {
        try {
          const { value, done } = await iter.next();
          if (done)
            return ctrl.close();
          const bytes = encodeUTF8(JSON.stringify(value) + "\n");
          ctrl.enqueue(bytes);
        } catch (err) {
          ctrl.error(err);
        }
      },
      async cancel() {
        await iter.return?.();
      }
    });
  }
};
async function* _iterSSEMessages(response, controller) {
  if (!response.body) {
    controller.abort();
    if (typeof globalThis.navigator !== "undefined" && globalThis.navigator.product === "ReactNative") {
      throw new AnthropicError(`The default react-native fetch implementation does not support streaming. Please use expo/fetch: https://docs.expo.dev/versions/latest/sdk/expo/#expofetch-api`);
    }
    throw new AnthropicError(`Attempted to iterate over a response with no body`);
  }
  const sseDecoder = new SSEDecoder();
  const lineDecoder = new LineDecoder();
  const iter = ReadableStreamToAsyncIterable(response.body);
  for await (const sseChunk of iterSSEChunks(iter)) {
    for (const line of lineDecoder.decode(sseChunk)) {
      const sse = sseDecoder.decode(line);
      if (sse)
        yield sse;
    }
  }
  for (const line of lineDecoder.flush()) {
    const sse = sseDecoder.decode(line);
    if (sse)
      yield sse;
  }
}
async function* iterSSEChunks(iterator) {
  let data = new Uint8Array();
  for await (const chunk of iterator) {
    if (chunk == null) {
      continue;
    }
    const binaryChunk = chunk instanceof ArrayBuffer ? new Uint8Array(chunk) : typeof chunk === "string" ? encodeUTF8(chunk) : chunk;
    let newData = new Uint8Array(data.length + binaryChunk.length);
    newData.set(data);
    newData.set(binaryChunk, data.length);
    data = newData;
    let patternIndex;
    while ((patternIndex = findDoubleNewlineIndex(data)) !== -1) {
      yield data.slice(0, patternIndex);
      data = data.slice(patternIndex);
    }
  }
  if (data.length > 0) {
    yield data;
  }
}
var SSEDecoder = class {
  constructor() {
    this.event = null;
    this.data = [];
    this.chunks = [];
  }
  decode(line) {
    if (line.endsWith("\r")) {
      line = line.substring(0, line.length - 1);
    }
    if (!line) {
      if (!this.event && !this.data.length)
        return null;
      const sse = {
        event: this.event,
        data: this.data.join("\n"),
        raw: this.chunks
      };
      this.event = null;
      this.data = [];
      this.chunks = [];
      return sse;
    }
    this.chunks.push(line);
    if (line.startsWith(":")) {
      return null;
    }
    let [fieldname, _, value] = partition(line, ":");
    if (value.startsWith(" ")) {
      value = value.substring(1);
    }
    if (fieldname === "event") {
      this.event = value;
    } else if (fieldname === "data") {
      this.data.push(value);
    }
    return null;
  }
};
function partition(str, delimiter) {
  const index = str.indexOf(delimiter);
  if (index !== -1) {
    return [str.substring(0, index), delimiter, str.substring(index + delimiter.length)];
  }
  return [str, "", ""];
}

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/internal/parse.mjs
async function defaultParseResponse(client, props) {
  const { response, requestLogID, retryOfRequestLogID, startTime } = props;
  const body = await (async () => {
    if (props.options.stream) {
      loggerFor(client).debug("response", response.status, response.url, response.headers, response.body);
      if (props.options.__streamClass) {
        return props.options.__streamClass.fromSSEResponse(response, props.controller);
      }
      return Stream.fromSSEResponse(response, props.controller);
    }
    if (response.status === 204) {
      return null;
    }
    if (props.options.__binaryResponse) {
      return response;
    }
    const contentType = response.headers.get("content-type");
    const mediaType = contentType?.split(";")[0]?.trim();
    const isJSON = mediaType?.includes("application/json") || mediaType?.endsWith("+json");
    if (isJSON) {
      const contentLength = response.headers.get("content-length");
      if (contentLength === "0") {
        return void 0;
      }
      const json = await response.json();
      return addRequestID(json, response);
    }
    const text = await response.text();
    return text;
  })();
  loggerFor(client).debug(`[${requestLogID}] response parsed`, formatRequestDetails({
    retryOfRequestLogID,
    url: response.url,
    status: response.status,
    body,
    durationMs: Date.now() - startTime
  }));
  return body;
}
function addRequestID(value, response) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }
  return Object.defineProperty(value, "_request_id", {
    value: response.headers.get("request-id"),
    enumerable: false
  });
}

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/core/api-promise.mjs
var _APIPromise_client;
var APIPromise = class _APIPromise extends Promise {
  constructor(client, responsePromise, parseResponse = defaultParseResponse) {
    super((resolve) => {
      resolve(null);
    });
    this.responsePromise = responsePromise;
    this.parseResponse = parseResponse;
    _APIPromise_client.set(this, void 0);
    __classPrivateFieldSet(this, _APIPromise_client, client, "f");
  }
  _thenUnwrap(transform) {
    return new _APIPromise(__classPrivateFieldGet(this, _APIPromise_client, "f"), this.responsePromise, async (client, props) => addRequestID(transform(await this.parseResponse(client, props), props), props.response));
  }
  /**
   * Gets the raw `Response` instance instead of parsing the response
   * data.
   *
   * If you want to parse the response body but still get the `Response`
   * instance, you can use {@link withResponse()}.
   *
   * 👋 Getting the wrong TypeScript type for `Response`?
   * Try setting `"moduleResolution": "NodeNext"` or add `"lib": ["DOM"]`
   * to your `tsconfig.json`.
   */
  asResponse() {
    return this.responsePromise.then((p) => p.response);
  }
  /**
   * Gets the parsed response data, the raw `Response` instance and the ID of the request,
   * returned via the `request-id` header which is useful for debugging requests and resporting
   * issues to Anthropic.
   *
   * If you just want to get the raw `Response` instance without parsing it,
   * you can use {@link asResponse()}.
   *
   * 👋 Getting the wrong TypeScript type for `Response`?
   * Try setting `"moduleResolution": "NodeNext"` or add `"lib": ["DOM"]`
   * to your `tsconfig.json`.
   */
  async withResponse() {
    const [data, response] = await Promise.all([this.parse(), this.asResponse()]);
    return { data, response, request_id: response.headers.get("request-id") };
  }
  parse() {
    if (!this.parsedPromise) {
      this.parsedPromise = this.responsePromise.then((data) => this.parseResponse(__classPrivateFieldGet(this, _APIPromise_client, "f"), data));
    }
    return this.parsedPromise;
  }
  then(onfulfilled, onrejected) {
    return this.parse().then(onfulfilled, onrejected);
  }
  catch(onrejected) {
    return this.parse().catch(onrejected);
  }
  finally(onfinally) {
    return this.parse().finally(onfinally);
  }
};
_APIPromise_client = /* @__PURE__ */ new WeakMap();

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/core/pagination.mjs
var _AbstractPage_client;
var AbstractPage = class {
  constructor(client, response, body, options) {
    _AbstractPage_client.set(this, void 0);
    __classPrivateFieldSet(this, _AbstractPage_client, client, "f");
    this.options = options;
    this.response = response;
    this.body = body;
  }
  hasNextPage() {
    const items = this.getPaginatedItems();
    if (!items.length)
      return false;
    return this.nextPageRequestOptions() != null;
  }
  async getNextPage() {
    const nextOptions = this.nextPageRequestOptions();
    if (!nextOptions) {
      throw new AnthropicError("No next page expected; please check `.hasNextPage()` before calling `.getNextPage()`.");
    }
    return await __classPrivateFieldGet(this, _AbstractPage_client, "f").requestAPIList(this.constructor, nextOptions);
  }
  async *iterPages() {
    let page = this;
    yield page;
    while (page.hasNextPage()) {
      page = await page.getNextPage();
      yield page;
    }
  }
  async *[(_AbstractPage_client = /* @__PURE__ */ new WeakMap(), Symbol.asyncIterator)]() {
    for await (const page of this.iterPages()) {
      for (const item of page.getPaginatedItems()) {
        yield item;
      }
    }
  }
};
var PagePromise = class extends APIPromise {
  constructor(client, request, Page2) {
    super(client, request, async (client2, props) => new Page2(client2, props.response, await defaultParseResponse(client2, props), props.options));
  }
  /**
   * Allow auto-paginating iteration on an unawaited list call, eg:
   *
   *    for await (const item of client.items.list()) {
   *      console.log(item)
   *    }
   */
  async *[Symbol.asyncIterator]() {
    const page = await this;
    for await (const item of page) {
      yield item;
    }
  }
};
var Page = class extends AbstractPage {
  constructor(client, response, body, options) {
    super(client, response, body, options);
    this.data = body.data || [];
    this.has_more = body.has_more || false;
    this.first_id = body.first_id || null;
    this.last_id = body.last_id || null;
  }
  getPaginatedItems() {
    return this.data ?? [];
  }
  hasNextPage() {
    if (this.has_more === false) {
      return false;
    }
    return super.hasNextPage();
  }
  nextPageRequestOptions() {
    if (this.options.query?.["before_id"]) {
      const first_id = this.first_id;
      if (!first_id) {
        return null;
      }
      return {
        ...this.options,
        query: {
          ...maybeObj(this.options.query),
          before_id: first_id
        }
      };
    }
    const cursor = this.last_id;
    if (!cursor) {
      return null;
    }
    return {
      ...this.options,
      query: {
        ...maybeObj(this.options.query),
        after_id: cursor
      }
    };
  }
};
var PageCursor = class extends AbstractPage {
  constructor(client, response, body, options) {
    super(client, response, body, options);
    this.data = body.data || [];
    this.next_page = body.next_page || null;
  }
  getPaginatedItems() {
    return this.data ?? [];
  }
  nextPageRequestOptions() {
    const cursor = this.next_page;
    if (!cursor) {
      return null;
    }
    return {
      ...this.options,
      query: {
        ...maybeObj(this.options.query),
        page: cursor
      }
    };
  }
};

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/internal/uploads.mjs
var checkFileSupport = () => {
  if (typeof File === "undefined") {
    const { process: process2 } = globalThis;
    const isOldNode = typeof process2?.versions?.node === "string" && parseInt(process2.versions.node.split(".")) < 20;
    throw new Error("`File` is not defined as a global, which is required for file uploads." + (isOldNode ? " Update to Node 20 LTS or newer, or set `globalThis.File` to `import('node:buffer').File`." : ""));
  }
};
function makeFile(fileBits, fileName, options) {
  checkFileSupport();
  return new File(fileBits, fileName ?? "unknown_file", options);
}
function getName(value, stripPath) {
  const val = typeof value === "object" && value !== null && ("name" in value && value.name && String(value.name) || "url" in value && value.url && String(value.url) || "filename" in value && value.filename && String(value.filename) || "path" in value && value.path && String(value.path)) || "";
  return stripPath ? val.split(/[\\/]/).pop() || void 0 : val;
}
var isAsyncIterable = (value) => value != null && typeof value === "object" && typeof value[Symbol.asyncIterator] === "function";
var multipartFormRequestOptions = async (opts, fetch2, stripFilenames = true) => {
  return { ...opts, body: await createForm(opts.body, fetch2, stripFilenames) };
};
var supportsFormDataMap = /* @__PURE__ */ new WeakMap();
function supportsFormData(fetchObject) {
  const fetch2 = typeof fetchObject === "function" ? fetchObject : fetchObject.fetch;
  const cached = supportsFormDataMap.get(fetch2);
  if (cached)
    return cached;
  const promise = (async () => {
    try {
      const FetchResponse = "Response" in fetch2 ? fetch2.Response : (await fetch2("data:,")).constructor;
      const data = new FormData();
      if (data.toString() === await new FetchResponse(data).text()) {
        return false;
      }
      return true;
    } catch {
      return true;
    }
  })();
  supportsFormDataMap.set(fetch2, promise);
  return promise;
}
var createForm = async (body, fetch2, stripFilenames = true) => {
  if (!await supportsFormData(fetch2)) {
    throw new TypeError("The provided fetch function does not support file uploads with the current global FormData class.");
  }
  const form = new FormData();
  await Promise.all(Object.entries(body || {}).map(([key, value]) => addFormValue(form, key, value, stripFilenames)));
  return form;
};
var isNamedBlob = (value) => value instanceof Blob && "name" in value;
var addFormValue = async (form, key, value, stripFilenames) => {
  if (value === void 0)
    return;
  if (value == null) {
    throw new TypeError(`Received null for "${key}"; to pass null in FormData, you must use the string 'null'`);
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    form.append(key, String(value));
  } else if (value instanceof Response) {
    let options = {};
    const contentType = value.headers.get("Content-Type");
    if (contentType) {
      options = { type: contentType };
    }
    form.append(key, makeFile([await value.blob()], getName(value, stripFilenames), options));
  } else if (isAsyncIterable(value)) {
    form.append(key, makeFile([await new Response(ReadableStreamFrom(value)).blob()], getName(value, stripFilenames)));
  } else if (isNamedBlob(value)) {
    form.append(key, makeFile([value], getName(value, stripFilenames), { type: value.type }));
  } else if (Array.isArray(value)) {
    await Promise.all(value.map((entry) => addFormValue(form, key + "[]", entry, stripFilenames)));
  } else if (typeof value === "object") {
    await Promise.all(Object.entries(value).map(([name, prop]) => addFormValue(form, `${key}[${name}]`, prop, stripFilenames)));
  } else {
    throw new TypeError(`Invalid value given to form, expected a string, number, boolean, object, Array, File or Blob but got ${value} instead`);
  }
};

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/internal/to-file.mjs
var isBlobLike = (value) => value != null && typeof value === "object" && typeof value.size === "number" && typeof value.type === "string" && typeof value.text === "function" && typeof value.slice === "function" && typeof value.arrayBuffer === "function";
var isFileLike = (value) => value != null && typeof value === "object" && typeof value.name === "string" && typeof value.lastModified === "number" && isBlobLike(value);
var isResponseLike = (value) => value != null && typeof value === "object" && typeof value.url === "string" && typeof value.blob === "function";
async function toFile(value, name, options) {
  checkFileSupport();
  value = await value;
  name || (name = getName(value, true));
  if (isFileLike(value)) {
    if (value instanceof File && name == null && options == null) {
      return value;
    }
    return makeFile([await value.arrayBuffer()], name ?? value.name, {
      type: value.type,
      lastModified: value.lastModified,
      ...options
    });
  }
  if (isResponseLike(value)) {
    const blob = await value.blob();
    name || (name = new URL(value.url).pathname.split(/[\\/]/).pop());
    return makeFile(await getBytes(blob), name, options);
  }
  const parts = await getBytes(value);
  if (!options?.type) {
    const type = parts.find((part) => typeof part === "object" && "type" in part && part.type);
    if (typeof type === "string") {
      options = { ...options, type };
    }
  }
  return makeFile(parts, name, options);
}
async function getBytes(value) {
  let parts = [];
  if (typeof value === "string" || ArrayBuffer.isView(value) || // includes Uint8Array, Buffer, etc.
  value instanceof ArrayBuffer) {
    parts.push(value);
  } else if (isBlobLike(value)) {
    parts.push(value instanceof Blob ? value : await value.arrayBuffer());
  } else if (isAsyncIterable(value)) {
    for await (const chunk of value) {
      parts.push(...await getBytes(chunk));
    }
  } else {
    const constructor = value?.constructor?.name;
    throw new Error(`Unexpected data type: ${typeof value}${constructor ? `; constructor: ${constructor}` : ""}${propsForError(value)}`);
  }
  return parts;
}
function propsForError(value) {
  if (typeof value !== "object" || value === null)
    return "";
  const props = Object.getOwnPropertyNames(value);
  return `; props: [${props.map((p) => `"${p}"`).join(", ")}]`;
}

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/core/resource.mjs
var APIResource = class {
  constructor(client) {
    this._client = client;
  }
};

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/internal/headers.mjs
var brand_privateNullableHeaders = Symbol.for("brand.privateNullableHeaders");
function* iterateHeaders(headers) {
  if (!headers)
    return;
  if (brand_privateNullableHeaders in headers) {
    const { values, nulls } = headers;
    yield* values.entries();
    for (const name of nulls) {
      yield [name, null];
    }
    return;
  }
  let shouldClear = false;
  let iter;
  if (headers instanceof Headers) {
    iter = headers.entries();
  } else if (isReadonlyArray(headers)) {
    iter = headers;
  } else {
    shouldClear = true;
    iter = Object.entries(headers ?? {});
  }
  for (let row of iter) {
    const name = row[0];
    if (typeof name !== "string")
      throw new TypeError("expected header name to be a string");
    const values = isReadonlyArray(row[1]) ? row[1] : [row[1]];
    let didClear = false;
    for (const value of values) {
      if (value === void 0)
        continue;
      if (shouldClear && !didClear) {
        didClear = true;
        yield [name, null];
      }
      yield [name, value];
    }
  }
}
var buildHeaders = (newHeaders) => {
  const targetHeaders = new Headers();
  const nullHeaders = /* @__PURE__ */ new Set();
  for (const headers of newHeaders) {
    const seenHeaders = /* @__PURE__ */ new Set();
    for (const [name, value] of iterateHeaders(headers)) {
      const lowerName = name.toLowerCase();
      if (!seenHeaders.has(lowerName)) {
        targetHeaders.delete(name);
        seenHeaders.add(lowerName);
      }
      if (value === null) {
        targetHeaders.delete(name);
        nullHeaders.add(lowerName);
      } else {
        targetHeaders.append(name, value);
        nullHeaders.delete(lowerName);
      }
    }
  }
  return { [brand_privateNullableHeaders]: true, values: targetHeaders, nulls: nullHeaders };
};

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/internal/utils/path.mjs
function encodeURIPath(str) {
  return str.replace(/[^A-Za-z0-9\-._~!$&'()*+,;=:@]+/g, encodeURIComponent);
}
var EMPTY = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.create(null));
var createPathTagFunction = (pathEncoder = encodeURIPath) => function path4(statics, ...params) {
  if (statics.length === 1)
    return statics[0];
  let postPath = false;
  const invalidSegments = [];
  const path5 = statics.reduce((previousValue, currentValue, index) => {
    if (/[?#]/.test(currentValue)) {
      postPath = true;
    }
    const value = params[index];
    let encoded = (postPath ? encodeURIComponent : pathEncoder)("" + value);
    if (index !== params.length && (value == null || typeof value === "object" && // handle values from other realms
    value.toString === Object.getPrototypeOf(Object.getPrototypeOf(value.hasOwnProperty ?? EMPTY) ?? EMPTY)?.toString)) {
      encoded = value + "";
      invalidSegments.push({
        start: previousValue.length + currentValue.length,
        length: encoded.length,
        error: `Value of type ${Object.prototype.toString.call(value).slice(8, -1)} is not a valid path parameter`
      });
    }
    return previousValue + currentValue + (index === params.length ? "" : encoded);
  }, "");
  const pathOnly = path5.split(/[?#]/, 1)[0];
  const invalidSegmentPattern = /(?<=^|\/)(?:\.|%2e){1,2}(?=\/|$)/gi;
  let match;
  while ((match = invalidSegmentPattern.exec(pathOnly)) !== null) {
    invalidSegments.push({
      start: match.index,
      length: match[0].length,
      error: `Value "${match[0]}" can't be safely passed as a path parameter`
    });
  }
  invalidSegments.sort((a, b) => a.start - b.start);
  if (invalidSegments.length > 0) {
    let lastEnd = 0;
    const underline = invalidSegments.reduce((acc, segment) => {
      const spaces = " ".repeat(segment.start - lastEnd);
      const arrows = "^".repeat(segment.length);
      lastEnd = segment.start + segment.length;
      return acc + spaces + arrows;
    }, "");
    throw new AnthropicError(`Path parameters result in path with invalid segments:
${invalidSegments.map((e) => e.error).join("\n")}
${path5}
${underline}`);
  }
  return path5;
};
var path3 = /* @__PURE__ */ createPathTagFunction(encodeURIPath);

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/resources/beta/environments.mjs
var Environments = class extends APIResource {
  /**
   * Create a new environment with the specified configuration.
   *
   * @example
   * ```ts
   * const betaEnvironment =
   *   await client.beta.environments.create({
   *     name: 'python-data-analysis',
   *   });
   * ```
   */
  create(params, options) {
    const { betas, ...body } = params;
    return this._client.post("/v1/environments?beta=true", {
      body,
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
        options?.headers
      ])
    });
  }
  /**
   * Retrieve a specific environment by ID.
   *
   * @example
   * ```ts
   * const betaEnvironment =
   *   await client.beta.environments.retrieve(
   *     'env_011CZkZ9X2dpNyB7HsEFoRfW',
   *   );
   * ```
   */
  retrieve(environmentID, params = {}, options) {
    const { betas } = params ?? {};
    return this._client.get(path3`/v1/environments/${environmentID}?beta=true`, {
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
        options?.headers
      ])
    });
  }
  /**
   * Update an existing environment's configuration.
   *
   * @example
   * ```ts
   * const betaEnvironment =
   *   await client.beta.environments.update(
   *     'env_011CZkZ9X2dpNyB7HsEFoRfW',
   *   );
   * ```
   */
  update(environmentID, params, options) {
    const { betas, ...body } = params;
    return this._client.post(path3`/v1/environments/${environmentID}?beta=true`, {
      body,
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
        options?.headers
      ])
    });
  }
  /**
   * List environments with pagination support.
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const betaEnvironment of client.beta.environments.list()) {
   *   // ...
   * }
   * ```
   */
  list(params = {}, options) {
    const { betas, ...query2 } = params ?? {};
    return this._client.getAPIList("/v1/environments?beta=true", PageCursor, {
      query: query2,
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
        options?.headers
      ])
    });
  }
  /**
   * Delete an environment by ID. Returns a confirmation of the deletion.
   *
   * @example
   * ```ts
   * const betaEnvironmentDeleteResponse =
   *   await client.beta.environments.delete(
   *     'env_011CZkZ9X2dpNyB7HsEFoRfW',
   *   );
   * ```
   */
  delete(environmentID, params = {}, options) {
    const { betas } = params ?? {};
    return this._client.delete(path3`/v1/environments/${environmentID}?beta=true`, {
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
        options?.headers
      ])
    });
  }
  /**
   * Archive an environment by ID. Archived environments cannot be used to create new
   * sessions.
   *
   * @example
   * ```ts
   * const betaEnvironment =
   *   await client.beta.environments.archive(
   *     'env_011CZkZ9X2dpNyB7HsEFoRfW',
   *   );
   * ```
   */
  archive(environmentID, params = {}, options) {
    const { betas } = params ?? {};
    return this._client.post(path3`/v1/environments/${environmentID}/archive?beta=true`, {
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
        options?.headers
      ])
    });
  }
};

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/lib/stainless-helper-header.mjs
var SDK_HELPER_SYMBOL = Symbol("anthropic.sdk.stainlessHelper");
function wasCreatedByStainlessHelper(value) {
  return typeof value === "object" && value !== null && SDK_HELPER_SYMBOL in value;
}
function collectStainlessHelpers(tools, messages) {
  const helpers = /* @__PURE__ */ new Set();
  if (tools) {
    for (const tool of tools) {
      if (wasCreatedByStainlessHelper(tool)) {
        helpers.add(tool[SDK_HELPER_SYMBOL]);
      }
    }
  }
  if (messages) {
    for (const message of messages) {
      if (wasCreatedByStainlessHelper(message)) {
        helpers.add(message[SDK_HELPER_SYMBOL]);
      }
      if (Array.isArray(message.content)) {
        for (const block of message.content) {
          if (wasCreatedByStainlessHelper(block)) {
            helpers.add(block[SDK_HELPER_SYMBOL]);
          }
        }
      }
    }
  }
  return Array.from(helpers);
}
function stainlessHelperHeader(tools, messages) {
  const helpers = collectStainlessHelpers(tools, messages);
  if (helpers.length === 0)
    return {};
  return { "x-stainless-helper": helpers.join(", ") };
}
function stainlessHelperHeaderFromFile(file) {
  if (wasCreatedByStainlessHelper(file)) {
    return { "x-stainless-helper": file[SDK_HELPER_SYMBOL] };
  }
  return {};
}

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/resources/beta/files.mjs
var Files = class extends APIResource {
  /**
   * List Files
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const fileMetadata of client.beta.files.list()) {
   *   // ...
   * }
   * ```
   */
  list(params = {}, options) {
    const { betas, ...query2 } = params ?? {};
    return this._client.getAPIList("/v1/files", Page, {
      query: query2,
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "files-api-2025-04-14"].toString() },
        options?.headers
      ])
    });
  }
  /**
   * Delete File
   *
   * @example
   * ```ts
   * const deletedFile = await client.beta.files.delete(
   *   'file_id',
   * );
   * ```
   */
  delete(fileID, params = {}, options) {
    const { betas } = params ?? {};
    return this._client.delete(path3`/v1/files/${fileID}`, {
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "files-api-2025-04-14"].toString() },
        options?.headers
      ])
    });
  }
  /**
   * Download File
   *
   * @example
   * ```ts
   * const response = await client.beta.files.download(
   *   'file_id',
   * );
   *
   * const content = await response.blob();
   * console.log(content);
   * ```
   */
  download(fileID, params = {}, options) {
    const { betas } = params ?? {};
    return this._client.get(path3`/v1/files/${fileID}/content`, {
      ...options,
      headers: buildHeaders([
        {
          "anthropic-beta": [...betas ?? [], "files-api-2025-04-14"].toString(),
          Accept: "application/binary"
        },
        options?.headers
      ]),
      __binaryResponse: true
    });
  }
  /**
   * Get File Metadata
   *
   * @example
   * ```ts
   * const fileMetadata =
   *   await client.beta.files.retrieveMetadata('file_id');
   * ```
   */
  retrieveMetadata(fileID, params = {}, options) {
    const { betas } = params ?? {};
    return this._client.get(path3`/v1/files/${fileID}`, {
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "files-api-2025-04-14"].toString() },
        options?.headers
      ])
    });
  }
  /**
   * Upload File
   *
   * @example
   * ```ts
   * const fileMetadata = await client.beta.files.upload({
   *   file: fs.createReadStream('path/to/file'),
   * });
   * ```
   */
  upload(params, options) {
    const { betas, ...body } = params;
    return this._client.post("/v1/files", multipartFormRequestOptions({
      body,
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "files-api-2025-04-14"].toString() },
        stainlessHelperHeaderFromFile(body.file),
        options?.headers
      ])
    }, this._client));
  }
};

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/resources/beta/models.mjs
var Models = class extends APIResource {
  /**
   * Get a specific model.
   *
   * The Models API response can be used to determine information about a specific
   * model or resolve a model alias to a model ID.
   *
   * @example
   * ```ts
   * const betaModelInfo = await client.beta.models.retrieve(
   *   'model_id',
   * );
   * ```
   */
  retrieve(modelID, params = {}, options) {
    const { betas } = params ?? {};
    return this._client.get(path3`/v1/models/${modelID}?beta=true`, {
      ...options,
      headers: buildHeaders([
        { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
        options?.headers
      ])
    });
  }
  /**
   * List available models.
   *
   * The Models API response can be used to determine which models are available for
   * use in the API. More recently released models are listed first.
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const betaModelInfo of client.beta.models.list()) {
   *   // ...
   * }
   * ```
   */
  list(params = {}, options) {
    const { betas, ...query2 } = params ?? {};
    return this._client.getAPIList("/v1/models?beta=true", Page, {
      query: query2,
      ...options,
      headers: buildHeaders([
        { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
        options?.headers
      ])
    });
  }
};

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/resources/beta/user-profiles.mjs
var UserProfiles = class extends APIResource {
  /**
   * Create User Profile
   *
   * @example
   * ```ts
   * const betaUserProfile =
   *   await client.beta.userProfiles.create();
   * ```
   */
  create(params, options) {
    const { betas, ...body } = params;
    return this._client.post("/v1/user_profiles?beta=true", {
      body,
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "user-profiles-2026-03-24"].toString() },
        options?.headers
      ])
    });
  }
  /**
   * Get User Profile
   *
   * @example
   * ```ts
   * const betaUserProfile =
   *   await client.beta.userProfiles.retrieve(
   *     'uprof_011CZkZCu8hGbp5mYRQgUmz9',
   *   );
   * ```
   */
  retrieve(userProfileID, params = {}, options) {
    const { betas } = params ?? {};
    return this._client.get(path3`/v1/user_profiles/${userProfileID}?beta=true`, {
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "user-profiles-2026-03-24"].toString() },
        options?.headers
      ])
    });
  }
  /**
   * Update User Profile
   *
   * @example
   * ```ts
   * const betaUserProfile =
   *   await client.beta.userProfiles.update(
   *     'uprof_011CZkZCu8hGbp5mYRQgUmz9',
   *   );
   * ```
   */
  update(userProfileID, params, options) {
    const { betas, ...body } = params;
    return this._client.post(path3`/v1/user_profiles/${userProfileID}?beta=true`, {
      body,
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "user-profiles-2026-03-24"].toString() },
        options?.headers
      ])
    });
  }
  /**
   * List User Profiles
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const betaUserProfile of client.beta.userProfiles.list()) {
   *   // ...
   * }
   * ```
   */
  list(params = {}, options) {
    const { betas, ...query2 } = params ?? {};
    return this._client.getAPIList("/v1/user_profiles?beta=true", PageCursor, {
      query: query2,
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "user-profiles-2026-03-24"].toString() },
        options?.headers
      ])
    });
  }
  /**
   * Create Enrollment URL
   *
   * @example
   * ```ts
   * const betaUserProfileEnrollmentURL =
   *   await client.beta.userProfiles.createEnrollmentURL(
   *     'uprof_011CZkZCu8hGbp5mYRQgUmz9',
   *   );
   * ```
   */
  createEnrollmentURL(userProfileID, params = {}, options) {
    const { betas } = params ?? {};
    return this._client.post(path3`/v1/user_profiles/${userProfileID}/enrollment_url?beta=true`, {
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "user-profiles-2026-03-24"].toString() },
        options?.headers
      ])
    });
  }
};

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/resources/beta/agents/versions.mjs
var Versions = class extends APIResource {
  /**
   * List Agent Versions
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const betaManagedAgentsAgent of client.beta.agents.versions.list(
   *   'agent_011CZkYpogX7uDKUyvBTophP',
   * )) {
   *   // ...
   * }
   * ```
   */
  list(agentID, params = {}, options) {
    const { betas, ...query2 } = params ?? {};
    return this._client.getAPIList(path3`/v1/agents/${agentID}/versions?beta=true`, PageCursor, {
      query: query2,
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
        options?.headers
      ])
    });
  }
};

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/resources/beta/agents/agents.mjs
var Agents = class extends APIResource {
  constructor() {
    super(...arguments);
    this.versions = new Versions(this._client);
  }
  /**
   * Create Agent
   *
   * @example
   * ```ts
   * const betaManagedAgentsAgent =
   *   await client.beta.agents.create({
   *     model: 'claude-sonnet-4-6',
   *     name: 'My First Agent',
   *   });
   * ```
   */
  create(params, options) {
    const { betas, ...body } = params;
    return this._client.post("/v1/agents?beta=true", {
      body,
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
        options?.headers
      ])
    });
  }
  /**
   * Get Agent
   *
   * @example
   * ```ts
   * const betaManagedAgentsAgent =
   *   await client.beta.agents.retrieve(
   *     'agent_011CZkYpogX7uDKUyvBTophP',
   *   );
   * ```
   */
  retrieve(agentID, params = {}, options) {
    const { betas, ...query2 } = params ?? {};
    return this._client.get(path3`/v1/agents/${agentID}?beta=true`, {
      query: query2,
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
        options?.headers
      ])
    });
  }
  /**
   * Update Agent
   *
   * @example
   * ```ts
   * const betaManagedAgentsAgent =
   *   await client.beta.agents.update(
   *     'agent_011CZkYpogX7uDKUyvBTophP',
   *     { version: 1 },
   *   );
   * ```
   */
  update(agentID, params, options) {
    const { betas, ...body } = params;
    return this._client.post(path3`/v1/agents/${agentID}?beta=true`, {
      body,
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
        options?.headers
      ])
    });
  }
  /**
   * List Agents
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const betaManagedAgentsAgent of client.beta.agents.list()) {
   *   // ...
   * }
   * ```
   */
  list(params = {}, options) {
    const { betas, ...query2 } = params ?? {};
    return this._client.getAPIList("/v1/agents?beta=true", PageCursor, {
      query: query2,
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
        options?.headers
      ])
    });
  }
  /**
   * Archive Agent
   *
   * @example
   * ```ts
   * const betaManagedAgentsAgent =
   *   await client.beta.agents.archive(
   *     'agent_011CZkYpogX7uDKUyvBTophP',
   *   );
   * ```
   */
  archive(agentID, params = {}, options) {
    const { betas } = params ?? {};
    return this._client.post(path3`/v1/agents/${agentID}/archive?beta=true`, {
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
        options?.headers
      ])
    });
  }
};
Agents.Versions = Versions;

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/internal/constants.mjs
var MODEL_NONSTREAMING_TOKENS = {
  "claude-opus-4-20250514": 8192,
  "claude-opus-4-0": 8192,
  "claude-4-opus-20250514": 8192,
  "anthropic.claude-opus-4-20250514-v1:0": 8192,
  "claude-opus-4@20250514": 8192,
  "claude-opus-4-1-20250805": 8192,
  "anthropic.claude-opus-4-1-20250805-v1:0": 8192,
  "claude-opus-4-1@20250805": 8192
};

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/lib/beta-parser.mjs
function getOutputFormat(params) {
  return params?.output_format ?? params?.output_config?.format;
}
function maybeParseBetaMessage(message, params, opts) {
  const outputFormat = getOutputFormat(params);
  if (!params || !("parse" in (outputFormat ?? {}))) {
    return {
      ...message,
      content: message.content.map((block) => {
        if (block.type === "text") {
          const parsedBlock = Object.defineProperty({ ...block }, "parsed_output", {
            value: null,
            enumerable: false
          });
          return Object.defineProperty(parsedBlock, "parsed", {
            get() {
              opts.logger.warn("The `parsed` property on `text` blocks is deprecated, please use `parsed_output` instead.");
              return null;
            },
            enumerable: false
          });
        }
        return block;
      }),
      parsed_output: null
    };
  }
  return parseBetaMessage(message, params, opts);
}
function parseBetaMessage(message, params, opts) {
  let firstParsedOutput = null;
  const content = message.content.map((block) => {
    if (block.type === "text") {
      const parsedOutput = parseBetaOutputFormat(params, block.text);
      if (firstParsedOutput === null) {
        firstParsedOutput = parsedOutput;
      }
      const parsedBlock = Object.defineProperty({ ...block }, "parsed_output", {
        value: parsedOutput,
        enumerable: false
      });
      return Object.defineProperty(parsedBlock, "parsed", {
        get() {
          opts.logger.warn("The `parsed` property on `text` blocks is deprecated, please use `parsed_output` instead.");
          return parsedOutput;
        },
        enumerable: false
      });
    }
    return block;
  });
  return {
    ...message,
    content,
    parsed_output: firstParsedOutput
  };
}
function parseBetaOutputFormat(params, content) {
  const outputFormat = getOutputFormat(params);
  if (outputFormat?.type !== "json_schema") {
    return null;
  }
  try {
    if ("parse" in outputFormat) {
      return outputFormat.parse(content);
    }
    return JSON.parse(content);
  } catch (error) {
    throw new AnthropicError(`Failed to parse structured output: ${error}`);
  }
}

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/_vendor/partial-json-parser/parser.mjs
var tokenize = (input) => {
  let current = 0;
  let tokens = [];
  while (current < input.length) {
    let char = input[current];
    if (char === "\\") {
      current++;
      continue;
    }
    if (char === "{") {
      tokens.push({
        type: "brace",
        value: "{"
      });
      current++;
      continue;
    }
    if (char === "}") {
      tokens.push({
        type: "brace",
        value: "}"
      });
      current++;
      continue;
    }
    if (char === "[") {
      tokens.push({
        type: "paren",
        value: "["
      });
      current++;
      continue;
    }
    if (char === "]") {
      tokens.push({
        type: "paren",
        value: "]"
      });
      current++;
      continue;
    }
    if (char === ":") {
      tokens.push({
        type: "separator",
        value: ":"
      });
      current++;
      continue;
    }
    if (char === ",") {
      tokens.push({
        type: "delimiter",
        value: ","
      });
      current++;
      continue;
    }
    if (char === '"') {
      let value = "";
      let danglingQuote = false;
      char = input[++current];
      while (char !== '"') {
        if (current === input.length) {
          danglingQuote = true;
          break;
        }
        if (char === "\\") {
          current++;
          if (current === input.length) {
            danglingQuote = true;
            break;
          }
          value += char + input[current];
          char = input[++current];
        } else {
          value += char;
          char = input[++current];
        }
      }
      char = input[++current];
      if (!danglingQuote) {
        tokens.push({
          type: "string",
          value
        });
      }
      continue;
    }
    let WHITESPACE = /\s/;
    if (char && WHITESPACE.test(char)) {
      current++;
      continue;
    }
    let NUMBERS = /[0-9]/;
    if (char && NUMBERS.test(char) || char === "-" || char === ".") {
      let value = "";
      if (char === "-") {
        value += char;
        char = input[++current];
      }
      while (char && NUMBERS.test(char) || char === ".") {
        value += char;
        char = input[++current];
      }
      tokens.push({
        type: "number",
        value
      });
      continue;
    }
    let LETTERS = /[a-z]/i;
    if (char && LETTERS.test(char)) {
      let value = "";
      while (char && LETTERS.test(char)) {
        if (current === input.length) {
          break;
        }
        value += char;
        char = input[++current];
      }
      if (value == "true" || value == "false" || value === "null") {
        tokens.push({
          type: "name",
          value
        });
      } else {
        current++;
        continue;
      }
      continue;
    }
    current++;
  }
  return tokens;
};
var strip = (tokens) => {
  if (tokens.length === 0) {
    return tokens;
  }
  let lastToken = tokens[tokens.length - 1];
  switch (lastToken.type) {
    case "separator":
      tokens = tokens.slice(0, tokens.length - 1);
      return strip(tokens);
      break;
    case "number":
      let lastCharacterOfLastToken = lastToken.value[lastToken.value.length - 1];
      if (lastCharacterOfLastToken === "." || lastCharacterOfLastToken === "-") {
        tokens = tokens.slice(0, tokens.length - 1);
        return strip(tokens);
      }
    case "string":
      let tokenBeforeTheLastToken = tokens[tokens.length - 2];
      if (tokenBeforeTheLastToken?.type === "delimiter") {
        tokens = tokens.slice(0, tokens.length - 1);
        return strip(tokens);
      } else if (tokenBeforeTheLastToken?.type === "brace" && tokenBeforeTheLastToken.value === "{") {
        tokens = tokens.slice(0, tokens.length - 1);
        return strip(tokens);
      }
      break;
    case "delimiter":
      tokens = tokens.slice(0, tokens.length - 1);
      return strip(tokens);
      break;
  }
  return tokens;
};
var unstrip = (tokens) => {
  let tail = [];
  tokens.map((token) => {
    if (token.type === "brace") {
      if (token.value === "{") {
        tail.push("}");
      } else {
        tail.splice(tail.lastIndexOf("}"), 1);
      }
    }
    if (token.type === "paren") {
      if (token.value === "[") {
        tail.push("]");
      } else {
        tail.splice(tail.lastIndexOf("]"), 1);
      }
    }
  });
  if (tail.length > 0) {
    tail.reverse().map((item) => {
      if (item === "}") {
        tokens.push({
          type: "brace",
          value: "}"
        });
      } else if (item === "]") {
        tokens.push({
          type: "paren",
          value: "]"
        });
      }
    });
  }
  return tokens;
};
var generate = (tokens) => {
  let output = "";
  tokens.map((token) => {
    switch (token.type) {
      case "string":
        output += '"' + token.value + '"';
        break;
      default:
        output += token.value;
        break;
    }
  });
  return output;
};
var partialParse = (input) => JSON.parse(generate(unstrip(strip(tokenize(input)))));

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/lib/BetaMessageStream.mjs
var _BetaMessageStream_instances;
var _BetaMessageStream_currentMessageSnapshot;
var _BetaMessageStream_params;
var _BetaMessageStream_connectedPromise;
var _BetaMessageStream_resolveConnectedPromise;
var _BetaMessageStream_rejectConnectedPromise;
var _BetaMessageStream_endPromise;
var _BetaMessageStream_resolveEndPromise;
var _BetaMessageStream_rejectEndPromise;
var _BetaMessageStream_listeners;
var _BetaMessageStream_ended;
var _BetaMessageStream_errored;
var _BetaMessageStream_aborted;
var _BetaMessageStream_catchingPromiseCreated;
var _BetaMessageStream_response;
var _BetaMessageStream_request_id;
var _BetaMessageStream_logger;
var _BetaMessageStream_getFinalMessage;
var _BetaMessageStream_getFinalText;
var _BetaMessageStream_handleError;
var _BetaMessageStream_beginRequest;
var _BetaMessageStream_addStreamEvent;
var _BetaMessageStream_endRequest;
var _BetaMessageStream_accumulateMessage;
var JSON_BUF_PROPERTY = "__json_buf";
function tracksToolInput(content) {
  return content.type === "tool_use" || content.type === "server_tool_use" || content.type === "mcp_tool_use";
}
var BetaMessageStream = class _BetaMessageStream {
  constructor(params, opts) {
    _BetaMessageStream_instances.add(this);
    this.messages = [];
    this.receivedMessages = [];
    _BetaMessageStream_currentMessageSnapshot.set(this, void 0);
    _BetaMessageStream_params.set(this, null);
    this.controller = new AbortController();
    _BetaMessageStream_connectedPromise.set(this, void 0);
    _BetaMessageStream_resolveConnectedPromise.set(this, () => {
    });
    _BetaMessageStream_rejectConnectedPromise.set(this, () => {
    });
    _BetaMessageStream_endPromise.set(this, void 0);
    _BetaMessageStream_resolveEndPromise.set(this, () => {
    });
    _BetaMessageStream_rejectEndPromise.set(this, () => {
    });
    _BetaMessageStream_listeners.set(this, {});
    _BetaMessageStream_ended.set(this, false);
    _BetaMessageStream_errored.set(this, false);
    _BetaMessageStream_aborted.set(this, false);
    _BetaMessageStream_catchingPromiseCreated.set(this, false);
    _BetaMessageStream_response.set(this, void 0);
    _BetaMessageStream_request_id.set(this, void 0);
    _BetaMessageStream_logger.set(this, void 0);
    _BetaMessageStream_handleError.set(this, (error) => {
      __classPrivateFieldSet(this, _BetaMessageStream_errored, true, "f");
      if (isAbortError(error)) {
        error = new APIUserAbortError();
      }
      if (error instanceof APIUserAbortError) {
        __classPrivateFieldSet(this, _BetaMessageStream_aborted, true, "f");
        return this._emit("abort", error);
      }
      if (error instanceof AnthropicError) {
        return this._emit("error", error);
      }
      if (error instanceof Error) {
        const anthropicError = new AnthropicError(error.message);
        anthropicError.cause = error;
        return this._emit("error", anthropicError);
      }
      return this._emit("error", new AnthropicError(String(error)));
    });
    __classPrivateFieldSet(this, _BetaMessageStream_connectedPromise, new Promise((resolve, reject) => {
      __classPrivateFieldSet(this, _BetaMessageStream_resolveConnectedPromise, resolve, "f");
      __classPrivateFieldSet(this, _BetaMessageStream_rejectConnectedPromise, reject, "f");
    }), "f");
    __classPrivateFieldSet(this, _BetaMessageStream_endPromise, new Promise((resolve, reject) => {
      __classPrivateFieldSet(this, _BetaMessageStream_resolveEndPromise, resolve, "f");
      __classPrivateFieldSet(this, _BetaMessageStream_rejectEndPromise, reject, "f");
    }), "f");
    __classPrivateFieldGet(this, _BetaMessageStream_connectedPromise, "f").catch(() => {
    });
    __classPrivateFieldGet(this, _BetaMessageStream_endPromise, "f").catch(() => {
    });
    __classPrivateFieldSet(this, _BetaMessageStream_params, params, "f");
    __classPrivateFieldSet(this, _BetaMessageStream_logger, opts?.logger ?? console, "f");
  }
  get response() {
    return __classPrivateFieldGet(this, _BetaMessageStream_response, "f");
  }
  get request_id() {
    return __classPrivateFieldGet(this, _BetaMessageStream_request_id, "f");
  }
  /**
   * Returns the `MessageStream` data, the raw `Response` instance and the ID of the request,
   * returned vie the `request-id` header which is useful for debugging requests and resporting
   * issues to Anthropic.
   *
   * This is the same as the `APIPromise.withResponse()` method.
   *
   * This method will raise an error if you created the stream using `MessageStream.fromReadableStream`
   * as no `Response` is available.
   */
  async withResponse() {
    __classPrivateFieldSet(this, _BetaMessageStream_catchingPromiseCreated, true, "f");
    const response = await __classPrivateFieldGet(this, _BetaMessageStream_connectedPromise, "f");
    if (!response) {
      throw new Error("Could not resolve a `Response` object");
    }
    return {
      data: this,
      response,
      request_id: response.headers.get("request-id")
    };
  }
  /**
   * Intended for use on the frontend, consuming a stream produced with
   * `.toReadableStream()` on the backend.
   *
   * Note that messages sent to the model do not appear in `.on('message')`
   * in this context.
   */
  static fromReadableStream(stream) {
    const runner = new _BetaMessageStream(null);
    runner._run(() => runner._fromReadableStream(stream));
    return runner;
  }
  static createMessage(messages, params, options, { logger } = {}) {
    const runner = new _BetaMessageStream(params, { logger });
    for (const message of params.messages) {
      runner._addMessageParam(message);
    }
    __classPrivateFieldSet(runner, _BetaMessageStream_params, { ...params, stream: true }, "f");
    runner._run(() => runner._createMessage(messages, { ...params, stream: true }, { ...options, headers: { ...options?.headers, "X-Stainless-Helper-Method": "stream" } }));
    return runner;
  }
  _run(executor) {
    executor().then(() => {
      this._emitFinal();
      this._emit("end");
    }, __classPrivateFieldGet(this, _BetaMessageStream_handleError, "f"));
  }
  _addMessageParam(message) {
    this.messages.push(message);
  }
  _addMessage(message, emit = true) {
    this.receivedMessages.push(message);
    if (emit) {
      this._emit("message", message);
    }
  }
  async _createMessage(messages, params, options) {
    const signal = options?.signal;
    let abortHandler;
    if (signal) {
      if (signal.aborted)
        this.controller.abort();
      abortHandler = this.controller.abort.bind(this.controller);
      signal.addEventListener("abort", abortHandler);
    }
    try {
      __classPrivateFieldGet(this, _BetaMessageStream_instances, "m", _BetaMessageStream_beginRequest).call(this);
      const { response, data: stream } = await messages.create({ ...params, stream: true }, { ...options, signal: this.controller.signal }).withResponse();
      this._connected(response);
      for await (const event of stream) {
        __classPrivateFieldGet(this, _BetaMessageStream_instances, "m", _BetaMessageStream_addStreamEvent).call(this, event);
      }
      if (stream.controller.signal?.aborted) {
        throw new APIUserAbortError();
      }
      __classPrivateFieldGet(this, _BetaMessageStream_instances, "m", _BetaMessageStream_endRequest).call(this);
    } finally {
      if (signal && abortHandler) {
        signal.removeEventListener("abort", abortHandler);
      }
    }
  }
  _connected(response) {
    if (this.ended)
      return;
    __classPrivateFieldSet(this, _BetaMessageStream_response, response, "f");
    __classPrivateFieldSet(this, _BetaMessageStream_request_id, response?.headers.get("request-id"), "f");
    __classPrivateFieldGet(this, _BetaMessageStream_resolveConnectedPromise, "f").call(this, response);
    this._emit("connect");
  }
  get ended() {
    return __classPrivateFieldGet(this, _BetaMessageStream_ended, "f");
  }
  get errored() {
    return __classPrivateFieldGet(this, _BetaMessageStream_errored, "f");
  }
  get aborted() {
    return __classPrivateFieldGet(this, _BetaMessageStream_aborted, "f");
  }
  abort() {
    this.controller.abort();
  }
  /**
   * Adds the listener function to the end of the listeners array for the event.
   * No checks are made to see if the listener has already been added. Multiple calls passing
   * the same combination of event and listener will result in the listener being added, and
   * called, multiple times.
   * @returns this MessageStream, so that calls can be chained
   */
  on(event, listener) {
    const listeners = __classPrivateFieldGet(this, _BetaMessageStream_listeners, "f")[event] || (__classPrivateFieldGet(this, _BetaMessageStream_listeners, "f")[event] = []);
    listeners.push({ listener });
    return this;
  }
  /**
   * Removes the specified listener from the listener array for the event.
   * off() will remove, at most, one instance of a listener from the listener array. If any single
   * listener has been added multiple times to the listener array for the specified event, then
   * off() must be called multiple times to remove each instance.
   * @returns this MessageStream, so that calls can be chained
   */
  off(event, listener) {
    const listeners = __classPrivateFieldGet(this, _BetaMessageStream_listeners, "f")[event];
    if (!listeners)
      return this;
    const index = listeners.findIndex((l) => l.listener === listener);
    if (index >= 0)
      listeners.splice(index, 1);
    return this;
  }
  /**
   * Adds a one-time listener function for the event. The next time the event is triggered,
   * this listener is removed and then invoked.
   * @returns this MessageStream, so that calls can be chained
   */
  once(event, listener) {
    const listeners = __classPrivateFieldGet(this, _BetaMessageStream_listeners, "f")[event] || (__classPrivateFieldGet(this, _BetaMessageStream_listeners, "f")[event] = []);
    listeners.push({ listener, once: true });
    return this;
  }
  /**
   * This is similar to `.once()`, but returns a Promise that resolves the next time
   * the event is triggered, instead of calling a listener callback.
   * @returns a Promise that resolves the next time given event is triggered,
   * or rejects if an error is emitted.  (If you request the 'error' event,
   * returns a promise that resolves with the error).
   *
   * Example:
   *
   *   const message = await stream.emitted('message') // rejects if the stream errors
   */
  emitted(event) {
    return new Promise((resolve, reject) => {
      __classPrivateFieldSet(this, _BetaMessageStream_catchingPromiseCreated, true, "f");
      if (event !== "error")
        this.once("error", reject);
      this.once(event, resolve);
    });
  }
  async done() {
    __classPrivateFieldSet(this, _BetaMessageStream_catchingPromiseCreated, true, "f");
    await __classPrivateFieldGet(this, _BetaMessageStream_endPromise, "f");
  }
  get currentMessage() {
    return __classPrivateFieldGet(this, _BetaMessageStream_currentMessageSnapshot, "f");
  }
  /**
   * @returns a promise that resolves with the the final assistant Message response,
   * or rejects if an error occurred or the stream ended prematurely without producing a Message.
   * If structured outputs were used, this will be a ParsedMessage with a `parsed` field.
   */
  async finalMessage() {
    await this.done();
    return __classPrivateFieldGet(this, _BetaMessageStream_instances, "m", _BetaMessageStream_getFinalMessage).call(this);
  }
  /**
   * @returns a promise that resolves with the the final assistant Message's text response, concatenated
   * together if there are more than one text blocks.
   * Rejects if an error occurred or the stream ended prematurely without producing a Message.
   */
  async finalText() {
    await this.done();
    return __classPrivateFieldGet(this, _BetaMessageStream_instances, "m", _BetaMessageStream_getFinalText).call(this);
  }
  _emit(event, ...args) {
    if (__classPrivateFieldGet(this, _BetaMessageStream_ended, "f"))
      return;
    if (event === "end") {
      __classPrivateFieldSet(this, _BetaMessageStream_ended, true, "f");
      __classPrivateFieldGet(this, _BetaMessageStream_resolveEndPromise, "f").call(this);
    }
    const listeners = __classPrivateFieldGet(this, _BetaMessageStream_listeners, "f")[event];
    if (listeners) {
      __classPrivateFieldGet(this, _BetaMessageStream_listeners, "f")[event] = listeners.filter((l) => !l.once);
      listeners.forEach(({ listener }) => listener(...args));
    }
    if (event === "abort") {
      const error = args[0];
      if (!__classPrivateFieldGet(this, _BetaMessageStream_catchingPromiseCreated, "f") && !listeners?.length) {
        Promise.reject(error);
      }
      __classPrivateFieldGet(this, _BetaMessageStream_rejectConnectedPromise, "f").call(this, error);
      __classPrivateFieldGet(this, _BetaMessageStream_rejectEndPromise, "f").call(this, error);
      this._emit("end");
      return;
    }
    if (event === "error") {
      const error = args[0];
      if (!__classPrivateFieldGet(this, _BetaMessageStream_catchingPromiseCreated, "f") && !listeners?.length) {
        Promise.reject(error);
      }
      __classPrivateFieldGet(this, _BetaMessageStream_rejectConnectedPromise, "f").call(this, error);
      __classPrivateFieldGet(this, _BetaMessageStream_rejectEndPromise, "f").call(this, error);
      this._emit("end");
    }
  }
  _emitFinal() {
    const finalMessage = this.receivedMessages.at(-1);
    if (finalMessage) {
      this._emit("finalMessage", __classPrivateFieldGet(this, _BetaMessageStream_instances, "m", _BetaMessageStream_getFinalMessage).call(this));
    }
  }
  async _fromReadableStream(readableStream, options) {
    const signal = options?.signal;
    let abortHandler;
    if (signal) {
      if (signal.aborted)
        this.controller.abort();
      abortHandler = this.controller.abort.bind(this.controller);
      signal.addEventListener("abort", abortHandler);
    }
    try {
      __classPrivateFieldGet(this, _BetaMessageStream_instances, "m", _BetaMessageStream_beginRequest).call(this);
      this._connected(null);
      const stream = Stream.fromReadableStream(readableStream, this.controller);
      for await (const event of stream) {
        __classPrivateFieldGet(this, _BetaMessageStream_instances, "m", _BetaMessageStream_addStreamEvent).call(this, event);
      }
      if (stream.controller.signal?.aborted) {
        throw new APIUserAbortError();
      }
      __classPrivateFieldGet(this, _BetaMessageStream_instances, "m", _BetaMessageStream_endRequest).call(this);
    } finally {
      if (signal && abortHandler) {
        signal.removeEventListener("abort", abortHandler);
      }
    }
  }
  [(_BetaMessageStream_currentMessageSnapshot = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_params = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_connectedPromise = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_resolveConnectedPromise = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_rejectConnectedPromise = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_endPromise = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_resolveEndPromise = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_rejectEndPromise = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_listeners = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_ended = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_errored = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_aborted = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_catchingPromiseCreated = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_response = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_request_id = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_logger = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_handleError = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_instances = /* @__PURE__ */ new WeakSet(), _BetaMessageStream_getFinalMessage = function _BetaMessageStream_getFinalMessage2() {
    if (this.receivedMessages.length === 0) {
      throw new AnthropicError("stream ended without producing a Message with role=assistant");
    }
    return this.receivedMessages.at(-1);
  }, _BetaMessageStream_getFinalText = function _BetaMessageStream_getFinalText2() {
    if (this.receivedMessages.length === 0) {
      throw new AnthropicError("stream ended without producing a Message with role=assistant");
    }
    const textBlocks = this.receivedMessages.at(-1).content.filter((block) => block.type === "text").map((block) => block.text);
    if (textBlocks.length === 0) {
      throw new AnthropicError("stream ended without producing a content block with type=text");
    }
    return textBlocks.join(" ");
  }, _BetaMessageStream_beginRequest = function _BetaMessageStream_beginRequest2() {
    if (this.ended)
      return;
    __classPrivateFieldSet(this, _BetaMessageStream_currentMessageSnapshot, void 0, "f");
  }, _BetaMessageStream_addStreamEvent = function _BetaMessageStream_addStreamEvent2(event) {
    if (this.ended)
      return;
    const messageSnapshot = __classPrivateFieldGet(this, _BetaMessageStream_instances, "m", _BetaMessageStream_accumulateMessage).call(this, event);
    this._emit("streamEvent", event, messageSnapshot);
    switch (event.type) {
      case "content_block_delta": {
        const content = messageSnapshot.content.at(-1);
        switch (event.delta.type) {
          case "text_delta": {
            if (content.type === "text") {
              this._emit("text", event.delta.text, content.text || "");
            }
            break;
          }
          case "citations_delta": {
            if (content.type === "text") {
              this._emit("citation", event.delta.citation, content.citations ?? []);
            }
            break;
          }
          case "input_json_delta": {
            if (tracksToolInput(content) && content.input) {
              this._emit("inputJson", event.delta.partial_json, content.input);
            }
            break;
          }
          case "thinking_delta": {
            if (content.type === "thinking") {
              this._emit("thinking", event.delta.thinking, content.thinking);
            }
            break;
          }
          case "signature_delta": {
            if (content.type === "thinking") {
              this._emit("signature", content.signature);
            }
            break;
          }
          case "compaction_delta": {
            if (content.type === "compaction" && content.content) {
              this._emit("compaction", content.content);
            }
            break;
          }
          default:
            checkNever(event.delta);
        }
        break;
      }
      case "message_stop": {
        this._addMessageParam(messageSnapshot);
        this._addMessage(maybeParseBetaMessage(messageSnapshot, __classPrivateFieldGet(this, _BetaMessageStream_params, "f"), { logger: __classPrivateFieldGet(this, _BetaMessageStream_logger, "f") }), true);
        break;
      }
      case "content_block_stop": {
        this._emit("contentBlock", messageSnapshot.content.at(-1));
        break;
      }
      case "message_start": {
        __classPrivateFieldSet(this, _BetaMessageStream_currentMessageSnapshot, messageSnapshot, "f");
        break;
      }
      case "content_block_start":
      case "message_delta":
        break;
    }
  }, _BetaMessageStream_endRequest = function _BetaMessageStream_endRequest2() {
    if (this.ended) {
      throw new AnthropicError(`stream has ended, this shouldn't happen`);
    }
    const snapshot = __classPrivateFieldGet(this, _BetaMessageStream_currentMessageSnapshot, "f");
    if (!snapshot) {
      throw new AnthropicError(`request ended without sending any chunks`);
    }
    __classPrivateFieldSet(this, _BetaMessageStream_currentMessageSnapshot, void 0, "f");
    return maybeParseBetaMessage(snapshot, __classPrivateFieldGet(this, _BetaMessageStream_params, "f"), { logger: __classPrivateFieldGet(this, _BetaMessageStream_logger, "f") });
  }, _BetaMessageStream_accumulateMessage = function _BetaMessageStream_accumulateMessage2(event) {
    let snapshot = __classPrivateFieldGet(this, _BetaMessageStream_currentMessageSnapshot, "f");
    if (event.type === "message_start") {
      if (snapshot) {
        throw new AnthropicError(`Unexpected event order, got ${event.type} before receiving "message_stop"`);
      }
      return event.message;
    }
    if (!snapshot) {
      throw new AnthropicError(`Unexpected event order, got ${event.type} before "message_start"`);
    }
    switch (event.type) {
      case "message_stop":
        return snapshot;
      case "message_delta":
        snapshot.container = event.delta.container;
        snapshot.stop_reason = event.delta.stop_reason;
        snapshot.stop_sequence = event.delta.stop_sequence;
        snapshot.usage.output_tokens = event.usage.output_tokens;
        snapshot.context_management = event.context_management;
        if (event.usage.input_tokens != null) {
          snapshot.usage.input_tokens = event.usage.input_tokens;
        }
        if (event.usage.cache_creation_input_tokens != null) {
          snapshot.usage.cache_creation_input_tokens = event.usage.cache_creation_input_tokens;
        }
        if (event.usage.cache_read_input_tokens != null) {
          snapshot.usage.cache_read_input_tokens = event.usage.cache_read_input_tokens;
        }
        if (event.usage.server_tool_use != null) {
          snapshot.usage.server_tool_use = event.usage.server_tool_use;
        }
        if (event.usage.iterations != null) {
          snapshot.usage.iterations = event.usage.iterations;
        }
        return snapshot;
      case "content_block_start":
        snapshot.content.push(event.content_block);
        return snapshot;
      case "content_block_delta": {
        const snapshotContent = snapshot.content.at(event.index);
        switch (event.delta.type) {
          case "text_delta": {
            if (snapshotContent?.type === "text") {
              snapshot.content[event.index] = {
                ...snapshotContent,
                text: (snapshotContent.text || "") + event.delta.text
              };
            }
            break;
          }
          case "citations_delta": {
            if (snapshotContent?.type === "text") {
              snapshot.content[event.index] = {
                ...snapshotContent,
                citations: [...snapshotContent.citations ?? [], event.delta.citation]
              };
            }
            break;
          }
          case "input_json_delta": {
            if (snapshotContent && tracksToolInput(snapshotContent)) {
              let jsonBuf = snapshotContent[JSON_BUF_PROPERTY] || "";
              jsonBuf += event.delta.partial_json;
              const newContent = { ...snapshotContent };
              Object.defineProperty(newContent, JSON_BUF_PROPERTY, {
                value: jsonBuf,
                enumerable: false,
                writable: true
              });
              if (jsonBuf) {
                try {
                  newContent.input = partialParse(jsonBuf);
                } catch (err) {
                  const error = new AnthropicError(`Unable to parse tool parameter JSON from model. Please retry your request or adjust your prompt. Error: ${err}. JSON: ${jsonBuf}`);
                  __classPrivateFieldGet(this, _BetaMessageStream_handleError, "f").call(this, error);
                }
              }
              snapshot.content[event.index] = newContent;
            }
            break;
          }
          case "thinking_delta": {
            if (snapshotContent?.type === "thinking") {
              snapshot.content[event.index] = {
                ...snapshotContent,
                thinking: snapshotContent.thinking + event.delta.thinking
              };
            }
            break;
          }
          case "signature_delta": {
            if (snapshotContent?.type === "thinking") {
              snapshot.content[event.index] = {
                ...snapshotContent,
                signature: event.delta.signature
              };
            }
            break;
          }
          case "compaction_delta": {
            if (snapshotContent?.type === "compaction") {
              snapshot.content[event.index] = {
                ...snapshotContent,
                content: (snapshotContent.content || "") + event.delta.content
              };
            }
            break;
          }
          default:
            checkNever(event.delta);
        }
        return snapshot;
      }
      case "content_block_stop":
        return snapshot;
    }
  }, Symbol.asyncIterator)]() {
    const pushQueue = [];
    const readQueue = [];
    let done = false;
    this.on("streamEvent", (event) => {
      const reader = readQueue.shift();
      if (reader) {
        reader.resolve(event);
      } else {
        pushQueue.push(event);
      }
    });
    this.on("end", () => {
      done = true;
      for (const reader of readQueue) {
        reader.resolve(void 0);
      }
      readQueue.length = 0;
    });
    this.on("abort", (err) => {
      done = true;
      for (const reader of readQueue) {
        reader.reject(err);
      }
      readQueue.length = 0;
    });
    this.on("error", (err) => {
      done = true;
      for (const reader of readQueue) {
        reader.reject(err);
      }
      readQueue.length = 0;
    });
    return {
      next: async () => {
        if (!pushQueue.length) {
          if (done) {
            return { value: void 0, done: true };
          }
          return new Promise((resolve, reject) => readQueue.push({ resolve, reject })).then((chunk2) => chunk2 ? { value: chunk2, done: false } : { value: void 0, done: true });
        }
        const chunk = pushQueue.shift();
        return { value: chunk, done: false };
      },
      return: async () => {
        this.abort();
        return { value: void 0, done: true };
      }
    };
  }
  toReadableStream() {
    const stream = new Stream(this[Symbol.asyncIterator].bind(this), this.controller);
    return stream.toReadableStream();
  }
};
function checkNever(x) {
}

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/lib/tools/ToolError.mjs
var ToolError = class extends Error {
  constructor(content) {
    const message = typeof content === "string" ? content : content.map((block) => {
      if (block.type === "text")
        return block.text;
      return `[${block.type}]`;
    }).join(" ");
    super(message);
    this.name = "ToolError";
    this.content = content;
  }
};

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/lib/tools/CompactionControl.mjs
var DEFAULT_TOKEN_THRESHOLD = 1e5;
var DEFAULT_SUMMARY_PROMPT = `You have been working on the task described above but have not yet completed it. Write a continuation summary that will allow you (or another instance of yourself) to resume work efficiently in a future context window where the conversation history will be replaced with this summary. Your summary should be structured, concise, and actionable. Include:
1. Task Overview
The user's core request and success criteria
Any clarifications or constraints they specified
2. Current State
What has been completed so far
Files created, modified, or analyzed (with paths if relevant)
Key outputs or artifacts produced
3. Important Discoveries
Technical constraints or requirements uncovered
Decisions made and their rationale
Errors encountered and how they were resolved
What approaches were tried that didn't work (and why)
4. Next Steps
Specific actions needed to complete the task
Any blockers or open questions to resolve
Priority order if multiple steps remain
5. Context to Preserve
User preferences or style requirements
Domain-specific details that aren't obvious
Any promises made to the user
Be concise but complete\u2014err on the side of including information that would prevent duplicate work or repeated mistakes. Write in a way that enables immediate resumption of the task.
Wrap your summary in <summary></summary> tags.`;

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/lib/tools/BetaToolRunner.mjs
var _BetaToolRunner_instances;
var _BetaToolRunner_consumed;
var _BetaToolRunner_mutated;
var _BetaToolRunner_state;
var _BetaToolRunner_options;
var _BetaToolRunner_message;
var _BetaToolRunner_toolResponse;
var _BetaToolRunner_completion;
var _BetaToolRunner_iterationCount;
var _BetaToolRunner_checkAndCompact;
var _BetaToolRunner_generateToolResponse;
function promiseWithResolvers() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
var BetaToolRunner = class {
  constructor(client, params, options) {
    _BetaToolRunner_instances.add(this);
    this.client = client;
    _BetaToolRunner_consumed.set(this, false);
    _BetaToolRunner_mutated.set(this, false);
    _BetaToolRunner_state.set(this, void 0);
    _BetaToolRunner_options.set(this, void 0);
    _BetaToolRunner_message.set(this, void 0);
    _BetaToolRunner_toolResponse.set(this, void 0);
    _BetaToolRunner_completion.set(this, void 0);
    _BetaToolRunner_iterationCount.set(this, 0);
    __classPrivateFieldSet(this, _BetaToolRunner_state, {
      params: {
        // You can't clone the entire params since there are functions as handlers.
        // You also don't really need to clone params.messages, but it probably will prevent a foot gun
        // somewhere.
        ...params,
        messages: structuredClone(params.messages)
      }
    }, "f");
    const helpers = collectStainlessHelpers(params.tools, params.messages);
    const helperValue = ["BetaToolRunner", ...helpers].join(", ");
    __classPrivateFieldSet(this, _BetaToolRunner_options, {
      ...options,
      headers: buildHeaders([{ "x-stainless-helper": helperValue }, options?.headers])
    }, "f");
    __classPrivateFieldSet(this, _BetaToolRunner_completion, promiseWithResolvers(), "f");
    if (params.compactionControl?.enabled) {
      console.warn('Anthropic: The `compactionControl` parameter is deprecated and will be removed in a future version. Use server-side compaction instead by passing `edits: [{ type: "compact_20260112" }]` in the params passed to `toolRunner()`. See https://platform.claude.com/docs/en/build-with-claude/compaction');
    }
  }
  async *[(_BetaToolRunner_consumed = /* @__PURE__ */ new WeakMap(), _BetaToolRunner_mutated = /* @__PURE__ */ new WeakMap(), _BetaToolRunner_state = /* @__PURE__ */ new WeakMap(), _BetaToolRunner_options = /* @__PURE__ */ new WeakMap(), _BetaToolRunner_message = /* @__PURE__ */ new WeakMap(), _BetaToolRunner_toolResponse = /* @__PURE__ */ new WeakMap(), _BetaToolRunner_completion = /* @__PURE__ */ new WeakMap(), _BetaToolRunner_iterationCount = /* @__PURE__ */ new WeakMap(), _BetaToolRunner_instances = /* @__PURE__ */ new WeakSet(), _BetaToolRunner_checkAndCompact = async function _BetaToolRunner_checkAndCompact2() {
    const compactionControl = __classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.compactionControl;
    if (!compactionControl || !compactionControl.enabled) {
      return false;
    }
    let tokensUsed = 0;
    if (__classPrivateFieldGet(this, _BetaToolRunner_message, "f") !== void 0) {
      try {
        const message = await __classPrivateFieldGet(this, _BetaToolRunner_message, "f");
        const totalInputTokens = message.usage.input_tokens + (message.usage.cache_creation_input_tokens ?? 0) + (message.usage.cache_read_input_tokens ?? 0);
        tokensUsed = totalInputTokens + message.usage.output_tokens;
      } catch {
        return false;
      }
    }
    const threshold = compactionControl.contextTokenThreshold ?? DEFAULT_TOKEN_THRESHOLD;
    if (tokensUsed < threshold) {
      return false;
    }
    const model = compactionControl.model ?? __classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.model;
    const summaryPrompt = compactionControl.summaryPrompt ?? DEFAULT_SUMMARY_PROMPT;
    const messages = __classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.messages;
    if (messages[messages.length - 1].role === "assistant") {
      const lastMessage = messages[messages.length - 1];
      if (Array.isArray(lastMessage.content)) {
        const nonToolBlocks = lastMessage.content.filter((block) => block.type !== "tool_use");
        if (nonToolBlocks.length === 0) {
          messages.pop();
        } else {
          lastMessage.content = nonToolBlocks;
        }
      }
    }
    const response = await this.client.beta.messages.create({
      model,
      messages: [
        ...messages,
        {
          role: "user",
          content: [
            {
              type: "text",
              text: summaryPrompt
            }
          ]
        }
      ],
      max_tokens: __classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.max_tokens
    }, {
      signal: __classPrivateFieldGet(this, _BetaToolRunner_options, "f").signal,
      headers: buildHeaders([__classPrivateFieldGet(this, _BetaToolRunner_options, "f").headers, { "x-stainless-helper": "compaction" }])
    });
    if (response.content[0]?.type !== "text") {
      throw new AnthropicError("Expected text response for compaction");
    }
    __classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.messages = [
      {
        role: "user",
        content: response.content
      }
    ];
    return true;
  }, Symbol.asyncIterator)]() {
    var _a2;
    if (__classPrivateFieldGet(this, _BetaToolRunner_consumed, "f")) {
      throw new AnthropicError("Cannot iterate over a consumed stream");
    }
    __classPrivateFieldSet(this, _BetaToolRunner_consumed, true, "f");
    __classPrivateFieldSet(this, _BetaToolRunner_mutated, true, "f");
    __classPrivateFieldSet(this, _BetaToolRunner_toolResponse, void 0, "f");
    try {
      while (true) {
        let stream;
        try {
          if (__classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.max_iterations && __classPrivateFieldGet(this, _BetaToolRunner_iterationCount, "f") >= __classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.max_iterations) {
            break;
          }
          __classPrivateFieldSet(this, _BetaToolRunner_mutated, false, "f");
          __classPrivateFieldSet(this, _BetaToolRunner_toolResponse, void 0, "f");
          __classPrivateFieldSet(this, _BetaToolRunner_iterationCount, (_a2 = __classPrivateFieldGet(this, _BetaToolRunner_iterationCount, "f"), _a2++, _a2), "f");
          __classPrivateFieldSet(this, _BetaToolRunner_message, void 0, "f");
          const { max_iterations, compactionControl, ...params } = __classPrivateFieldGet(this, _BetaToolRunner_state, "f").params;
          if (params.stream) {
            stream = this.client.beta.messages.stream({ ...params }, __classPrivateFieldGet(this, _BetaToolRunner_options, "f"));
            __classPrivateFieldSet(this, _BetaToolRunner_message, stream.finalMessage(), "f");
            __classPrivateFieldGet(this, _BetaToolRunner_message, "f").catch(() => {
            });
            yield stream;
          } else {
            __classPrivateFieldSet(this, _BetaToolRunner_message, this.client.beta.messages.create({ ...params, stream: false }, __classPrivateFieldGet(this, _BetaToolRunner_options, "f")), "f");
            yield __classPrivateFieldGet(this, _BetaToolRunner_message, "f");
          }
          const isCompacted = await __classPrivateFieldGet(this, _BetaToolRunner_instances, "m", _BetaToolRunner_checkAndCompact).call(this);
          if (!isCompacted) {
            if (!__classPrivateFieldGet(this, _BetaToolRunner_mutated, "f")) {
              const { role, content } = await __classPrivateFieldGet(this, _BetaToolRunner_message, "f");
              __classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.messages.push({ role, content });
            }
            const toolMessage = await __classPrivateFieldGet(this, _BetaToolRunner_instances, "m", _BetaToolRunner_generateToolResponse).call(this, __classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.messages.at(-1));
            if (toolMessage) {
              __classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.messages.push(toolMessage);
            } else if (!__classPrivateFieldGet(this, _BetaToolRunner_mutated, "f")) {
              break;
            }
          }
        } finally {
          if (stream) {
            stream.abort();
          }
        }
      }
      if (!__classPrivateFieldGet(this, _BetaToolRunner_message, "f")) {
        throw new AnthropicError("ToolRunner concluded without a message from the server");
      }
      __classPrivateFieldGet(this, _BetaToolRunner_completion, "f").resolve(await __classPrivateFieldGet(this, _BetaToolRunner_message, "f"));
    } catch (error) {
      __classPrivateFieldSet(this, _BetaToolRunner_consumed, false, "f");
      __classPrivateFieldGet(this, _BetaToolRunner_completion, "f").promise.catch(() => {
      });
      __classPrivateFieldGet(this, _BetaToolRunner_completion, "f").reject(error);
      __classPrivateFieldSet(this, _BetaToolRunner_completion, promiseWithResolvers(), "f");
      throw error;
    }
  }
  setMessagesParams(paramsOrMutator) {
    if (typeof paramsOrMutator === "function") {
      __classPrivateFieldGet(this, _BetaToolRunner_state, "f").params = paramsOrMutator(__classPrivateFieldGet(this, _BetaToolRunner_state, "f").params);
    } else {
      __classPrivateFieldGet(this, _BetaToolRunner_state, "f").params = paramsOrMutator;
    }
    __classPrivateFieldSet(this, _BetaToolRunner_mutated, true, "f");
    __classPrivateFieldSet(this, _BetaToolRunner_toolResponse, void 0, "f");
  }
  setRequestOptions(optionsOrMutator) {
    if (typeof optionsOrMutator === "function") {
      __classPrivateFieldSet(this, _BetaToolRunner_options, optionsOrMutator(__classPrivateFieldGet(this, _BetaToolRunner_options, "f")), "f");
    } else {
      __classPrivateFieldSet(this, _BetaToolRunner_options, { ...__classPrivateFieldGet(this, _BetaToolRunner_options, "f"), ...optionsOrMutator }, "f");
    }
  }
  /**
   * Get the tool response for the last message from the assistant.
   * Avoids redundant tool executions by caching results.
   *
   * @returns A promise that resolves to a BetaMessageParam containing tool results, or null if no tools need to be executed
   *
   * @example
   * const toolResponse = await runner.generateToolResponse();
   * if (toolResponse) {
   *   console.log('Tool results:', toolResponse.content);
   * }
   */
  async generateToolResponse(signal = __classPrivateFieldGet(this, _BetaToolRunner_options, "f").signal) {
    const message = await __classPrivateFieldGet(this, _BetaToolRunner_message, "f") ?? this.params.messages.at(-1);
    if (!message) {
      return null;
    }
    return __classPrivateFieldGet(this, _BetaToolRunner_instances, "m", _BetaToolRunner_generateToolResponse).call(this, message, signal);
  }
  /**
   * Wait for the async iterator to complete. This works even if the async iterator hasn't yet started, and
   * will wait for an instance to start and go to completion.
   *
   * @returns A promise that resolves to the final BetaMessage when the iterator completes
   *
   * @example
   * // Start consuming the iterator
   * for await (const message of runner) {
   *   console.log('Message:', message.content);
   * }
   *
   * // Meanwhile, wait for completion from another part of the code
   * const finalMessage = await runner.done();
   * console.log('Final response:', finalMessage.content);
   */
  done() {
    return __classPrivateFieldGet(this, _BetaToolRunner_completion, "f").promise;
  }
  /**
   * Returns a promise indicating that the stream is done. Unlike .done(), this will eagerly read the stream:
   * * If the iterator has not been consumed, consume the entire iterator and return the final message from the
   * assistant.
   * * If the iterator has been consumed, waits for it to complete and returns the final message.
   *
   * @returns A promise that resolves to the final BetaMessage from the conversation
   * @throws {AnthropicError} If no messages were processed during the conversation
   *
   * @example
   * const finalMessage = await runner.runUntilDone();
   * console.log('Final response:', finalMessage.content);
   */
  async runUntilDone() {
    if (!__classPrivateFieldGet(this, _BetaToolRunner_consumed, "f")) {
      for await (const _ of this) {
      }
    }
    return this.done();
  }
  /**
   * Get the current parameters being used by the ToolRunner.
   *
   * @returns A readonly view of the current ToolRunnerParams
   *
   * @example
   * const currentParams = runner.params;
   * console.log('Current model:', currentParams.model);
   * console.log('Message count:', currentParams.messages.length);
   */
  get params() {
    return __classPrivateFieldGet(this, _BetaToolRunner_state, "f").params;
  }
  /**
   * Add one or more messages to the conversation history.
   *
   * @param messages - One or more BetaMessageParam objects to add to the conversation
   *
   * @example
   * runner.pushMessages(
   *   { role: 'user', content: 'Also, what about the weather in NYC?' }
   * );
   *
   * @example
   * // Adding multiple messages
   * runner.pushMessages(
   *   { role: 'user', content: 'What about NYC?' },
   *   { role: 'user', content: 'And Boston?' }
   * );
   */
  pushMessages(...messages) {
    this.setMessagesParams((params) => ({
      ...params,
      messages: [...params.messages, ...messages]
    }));
  }
  /**
   * Makes the ToolRunner directly awaitable, equivalent to calling .runUntilDone()
   * This allows using `await runner` instead of `await runner.runUntilDone()`
   */
  then(onfulfilled, onrejected) {
    return this.runUntilDone().then(onfulfilled, onrejected);
  }
};
_BetaToolRunner_generateToolResponse = async function _BetaToolRunner_generateToolResponse2(lastMessage, signal = __classPrivateFieldGet(this, _BetaToolRunner_options, "f").signal) {
  if (__classPrivateFieldGet(this, _BetaToolRunner_toolResponse, "f") !== void 0) {
    return __classPrivateFieldGet(this, _BetaToolRunner_toolResponse, "f");
  }
  __classPrivateFieldSet(this, _BetaToolRunner_toolResponse, generateToolResponse(__classPrivateFieldGet(this, _BetaToolRunner_state, "f").params, lastMessage, {
    ...__classPrivateFieldGet(this, _BetaToolRunner_options, "f"),
    signal
  }), "f");
  return __classPrivateFieldGet(this, _BetaToolRunner_toolResponse, "f");
};
async function generateToolResponse(params, lastMessage = params.messages.at(-1), requestOptions) {
  if (!lastMessage || lastMessage.role !== "assistant" || !lastMessage.content || typeof lastMessage.content === "string") {
    return null;
  }
  const toolUseBlocks = lastMessage.content.filter((content) => content.type === "tool_use");
  if (toolUseBlocks.length === 0) {
    return null;
  }
  const toolResults = await Promise.all(toolUseBlocks.map(async (toolUse) => {
    const tool = params.tools.find((t) => ("name" in t ? t.name : t.mcp_server_name) === toolUse.name);
    if (!tool || !("run" in tool)) {
      return {
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: `Error: Tool '${toolUse.name}' not found`,
        is_error: true
      };
    }
    try {
      let input = toolUse.input;
      if ("parse" in tool && tool.parse) {
        input = tool.parse(input);
      }
      const result = await tool.run(input, {
        toolUseBlock: toolUse,
        signal: requestOptions?.signal
      });
      return {
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: result
      };
    } catch (error) {
      return {
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: error instanceof ToolError ? error.content : `Error: ${error instanceof Error ? error.message : String(error)}`,
        is_error: true
      };
    }
  }));
  return {
    role: "user",
    content: toolResults
  };
}

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/internal/decoders/jsonl.mjs
var JSONLDecoder = class _JSONLDecoder {
  constructor(iterator, controller) {
    this.iterator = iterator;
    this.controller = controller;
  }
  async *decoder() {
    const lineDecoder = new LineDecoder();
    for await (const chunk of this.iterator) {
      for (const line of lineDecoder.decode(chunk)) {
        yield JSON.parse(line);
      }
    }
    for (const line of lineDecoder.flush()) {
      yield JSON.parse(line);
    }
  }
  [Symbol.asyncIterator]() {
    return this.decoder();
  }
  static fromResponse(response, controller) {
    if (!response.body) {
      controller.abort();
      if (typeof globalThis.navigator !== "undefined" && globalThis.navigator.product === "ReactNative") {
        throw new AnthropicError(`The default react-native fetch implementation does not support streaming. Please use expo/fetch: https://docs.expo.dev/versions/latest/sdk/expo/#expofetch-api`);
      }
      throw new AnthropicError(`Attempted to iterate over a response with no body`);
    }
    return new _JSONLDecoder(ReadableStreamToAsyncIterable(response.body), controller);
  }
};

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/resources/beta/messages/batches.mjs
var Batches = class extends APIResource {
  /**
   * Send a batch of Message creation requests.
   *
   * The Message Batches API can be used to process multiple Messages API requests at
   * once. Once a Message Batch is created, it begins processing immediately. Batches
   * can take up to 24 hours to complete.
   *
   * Learn more about the Message Batches API in our
   * [user guide](https://docs.claude.com/en/docs/build-with-claude/batch-processing)
   *
   * @example
   * ```ts
   * const betaMessageBatch =
   *   await client.beta.messages.batches.create({
   *     requests: [
   *       {
   *         custom_id: 'my-custom-id-1',
   *         params: {
   *           max_tokens: 1024,
   *           messages: [
   *             { content: 'Hello, world', role: 'user' },
   *           ],
   *           model: 'claude-opus-4-6',
   *         },
   *       },
   *     ],
   *   });
   * ```
   */
  create(params, options) {
    const { betas, ...body } = params;
    return this._client.post("/v1/messages/batches?beta=true", {
      body,
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "message-batches-2024-09-24"].toString() },
        options?.headers
      ])
    });
  }
  /**
   * This endpoint is idempotent and can be used to poll for Message Batch
   * completion. To access the results of a Message Batch, make a request to the
   * `results_url` field in the response.
   *
   * Learn more about the Message Batches API in our
   * [user guide](https://docs.claude.com/en/docs/build-with-claude/batch-processing)
   *
   * @example
   * ```ts
   * const betaMessageBatch =
   *   await client.beta.messages.batches.retrieve(
   *     'message_batch_id',
   *   );
   * ```
   */
  retrieve(messageBatchID, params = {}, options) {
    const { betas } = params ?? {};
    return this._client.get(path3`/v1/messages/batches/${messageBatchID}?beta=true`, {
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "message-batches-2024-09-24"].toString() },
        options?.headers
      ])
    });
  }
  /**
   * List all Message Batches within a Workspace. Most recently created batches are
   * returned first.
   *
   * Learn more about the Message Batches API in our
   * [user guide](https://docs.claude.com/en/docs/build-with-claude/batch-processing)
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const betaMessageBatch of client.beta.messages.batches.list()) {
   *   // ...
   * }
   * ```
   */
  list(params = {}, options) {
    const { betas, ...query2 } = params ?? {};
    return this._client.getAPIList("/v1/messages/batches?beta=true", Page, {
      query: query2,
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "message-batches-2024-09-24"].toString() },
        options?.headers
      ])
    });
  }
  /**
   * Delete a Message Batch.
   *
   * Message Batches can only be deleted once they've finished processing. If you'd
   * like to delete an in-progress batch, you must first cancel it.
   *
   * Learn more about the Message Batches API in our
   * [user guide](https://docs.claude.com/en/docs/build-with-claude/batch-processing)
   *
   * @example
   * ```ts
   * const betaDeletedMessageBatch =
   *   await client.beta.messages.batches.delete(
   *     'message_batch_id',
   *   );
   * ```
   */
  delete(messageBatchID, params = {}, options) {
    const { betas } = params ?? {};
    return this._client.delete(path3`/v1/messages/batches/${messageBatchID}?beta=true`, {
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "message-batches-2024-09-24"].toString() },
        options?.headers
      ])
    });
  }
  /**
   * Batches may be canceled any time before processing ends. Once cancellation is
   * initiated, the batch enters a `canceling` state, at which time the system may
   * complete any in-progress, non-interruptible requests before finalizing
   * cancellation.
   *
   * The number of canceled requests is specified in `request_counts`. To determine
   * which requests were canceled, check the individual results within the batch.
   * Note that cancellation may not result in any canceled requests if they were
   * non-interruptible.
   *
   * Learn more about the Message Batches API in our
   * [user guide](https://docs.claude.com/en/docs/build-with-claude/batch-processing)
   *
   * @example
   * ```ts
   * const betaMessageBatch =
   *   await client.beta.messages.batches.cancel(
   *     'message_batch_id',
   *   );
   * ```
   */
  cancel(messageBatchID, params = {}, options) {
    const { betas } = params ?? {};
    return this._client.post(path3`/v1/messages/batches/${messageBatchID}/cancel?beta=true`, {
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "message-batches-2024-09-24"].toString() },
        options?.headers
      ])
    });
  }
  /**
   * Streams the results of a Message Batch as a `.jsonl` file.
   *
   * Each line in the file is a JSON object containing the result of a single request
   * in the Message Batch. Results are not guaranteed to be in the same order as
   * requests. Use the `custom_id` field to match results to requests.
   *
   * Learn more about the Message Batches API in our
   * [user guide](https://docs.claude.com/en/docs/build-with-claude/batch-processing)
   *
   * @example
   * ```ts
   * const betaMessageBatchIndividualResponse =
   *   await client.beta.messages.batches.results(
   *     'message_batch_id',
   *   );
   * ```
   */
  async results(messageBatchID, params = {}, options) {
    const batch = await this.retrieve(messageBatchID);
    if (!batch.results_url) {
      throw new AnthropicError(`No batch \`results_url\`; Has it finished processing? ${batch.processing_status} - ${batch.id}`);
    }
    const { betas } = params ?? {};
    return this._client.get(batch.results_url, {
      ...options,
      headers: buildHeaders([
        {
          "anthropic-beta": [...betas ?? [], "message-batches-2024-09-24"].toString(),
          Accept: "application/binary"
        },
        options?.headers
      ]),
      stream: true,
      __binaryResponse: true
    })._thenUnwrap((_, props) => JSONLDecoder.fromResponse(props.response, props.controller));
  }
};

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/resources/beta/messages/messages.mjs
var DEPRECATED_MODELS = {
  "claude-1.3": "November 6th, 2024",
  "claude-1.3-100k": "November 6th, 2024",
  "claude-instant-1.1": "November 6th, 2024",
  "claude-instant-1.1-100k": "November 6th, 2024",
  "claude-instant-1.2": "November 6th, 2024",
  "claude-3-sonnet-20240229": "July 21st, 2025",
  "claude-3-opus-20240229": "January 5th, 2026",
  "claude-2.1": "July 21st, 2025",
  "claude-2.0": "July 21st, 2025",
  "claude-3-7-sonnet-latest": "February 19th, 2026",
  "claude-3-7-sonnet-20250219": "February 19th, 2026"
};
var MODELS_TO_WARN_WITH_THINKING_ENABLED = ["claude-mythos-preview", "claude-opus-4-6"];
var Messages = class extends APIResource {
  constructor() {
    super(...arguments);
    this.batches = new Batches(this._client);
  }
  create(params, options) {
    const modifiedParams = transformOutputFormat(params);
    const { betas, ...body } = modifiedParams;
    if (body.model in DEPRECATED_MODELS) {
      console.warn(`The model '${body.model}' is deprecated and will reach end-of-life on ${DEPRECATED_MODELS[body.model]}
Please migrate to a newer model. Visit https://docs.anthropic.com/en/docs/resources/model-deprecations for more information.`);
    }
    if (MODELS_TO_WARN_WITH_THINKING_ENABLED.includes(body.model) && body.thinking && body.thinking.type === "enabled") {
      console.warn(`Using Claude with ${body.model} and 'thinking.type=enabled' is deprecated. Use 'thinking.type=adaptive' instead which results in better model performance in our testing: https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking`);
    }
    let timeout = this._client._options.timeout;
    if (!body.stream && timeout == null) {
      const maxNonstreamingTokens = MODEL_NONSTREAMING_TOKENS[body.model] ?? void 0;
      timeout = this._client.calculateNonstreamingTimeout(body.max_tokens, maxNonstreamingTokens);
    }
    const helperHeader = stainlessHelperHeader(body.tools, body.messages);
    return this._client.post("/v1/messages?beta=true", {
      body,
      timeout: timeout ?? 6e5,
      ...options,
      headers: buildHeaders([
        { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
        helperHeader,
        options?.headers
      ]),
      stream: modifiedParams.stream ?? false
    });
  }
  /**
   * Send a structured list of input messages with text and/or image content, along with an expected `output_format` and
   * the response will be automatically parsed and available in the `parsed_output` property of the message.
   *
   * @example
   * ```ts
   * const message = await client.beta.messages.parse({
   *   model: 'claude-3-5-sonnet-20241022',
   *   max_tokens: 1024,
   *   messages: [{ role: 'user', content: 'What is 2+2?' }],
   *   output_format: zodOutputFormat(z.object({ answer: z.number() }), 'math'),
   * });
   *
   * console.log(message.parsed_output?.answer); // 4
   * ```
   */
  parse(params, options) {
    options = {
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...params.betas ?? [], "structured-outputs-2025-12-15"].toString() },
        options?.headers
      ])
    };
    return this.create(params, options).then((message) => parseBetaMessage(message, params, { logger: this._client.logger ?? console }));
  }
  /**
   * Create a Message stream
   */
  stream(body, options) {
    return BetaMessageStream.createMessage(this, body, options);
  }
  /**
   * Count the number of tokens in a Message.
   *
   * The Token Count API can be used to count the number of tokens in a Message,
   * including tools, images, and documents, without creating it.
   *
   * Learn more about token counting in our
   * [user guide](https://docs.claude.com/en/docs/build-with-claude/token-counting)
   *
   * @example
   * ```ts
   * const betaMessageTokensCount =
   *   await client.beta.messages.countTokens({
   *     messages: [{ content: 'Hello, world', role: 'user' }],
   *     model: 'claude-opus-4-6',
   *   });
   * ```
   */
  countTokens(params, options) {
    const modifiedParams = transformOutputFormat(params);
    const { betas, ...body } = modifiedParams;
    return this._client.post("/v1/messages/count_tokens?beta=true", {
      body,
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "token-counting-2024-11-01"].toString() },
        options?.headers
      ])
    });
  }
  toolRunner(body, options) {
    return new BetaToolRunner(this._client, body, options);
  }
};
function transformOutputFormat(params) {
  if (!params.output_format) {
    return params;
  }
  if (params.output_config?.format) {
    throw new AnthropicError("Both output_format and output_config.format were provided. Please use only output_config.format (output_format is deprecated).");
  }
  const { output_format, ...rest } = params;
  return {
    ...rest,
    output_config: {
      ...params.output_config,
      format: output_format
    }
  };
}
Messages.Batches = Batches;
Messages.BetaToolRunner = BetaToolRunner;
Messages.ToolError = ToolError;

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/resources/beta/sessions/events.mjs
var Events = class extends APIResource {
  /**
   * List Events
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const betaManagedAgentsSessionEvent of client.beta.sessions.events.list(
   *   'sesn_011CZkZAtmR3yMPDzynEDxu7',
   * )) {
   *   // ...
   * }
   * ```
   */
  list(sessionID, params = {}, options) {
    const { betas, ...query2 } = params ?? {};
    return this._client.getAPIList(path3`/v1/sessions/${sessionID}/events?beta=true`, PageCursor, {
      query: query2,
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
        options?.headers
      ])
    });
  }
  /**
   * Send Events
   *
   * @example
   * ```ts
   * const betaManagedAgentsSendSessionEvents =
   *   await client.beta.sessions.events.send(
   *     'sesn_011CZkZAtmR3yMPDzynEDxu7',
   *     {
   *       events: [
   *         {
   *           content: [
   *             {
   *               text: 'Where is my order #1234?',
   *               type: 'text',
   *             },
   *           ],
   *           type: 'user.message',
   *         },
   *       ],
   *     },
   *   );
   * ```
   */
  send(sessionID, params, options) {
    const { betas, ...body } = params;
    return this._client.post(path3`/v1/sessions/${sessionID}/events?beta=true`, {
      body,
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
        options?.headers
      ])
    });
  }
  /**
   * Stream Events
   *
   * @example
   * ```ts
   * const betaManagedAgentsStreamSessionEvents =
   *   await client.beta.sessions.events.stream(
   *     'sesn_011CZkZAtmR3yMPDzynEDxu7',
   *   );
   * ```
   */
  stream(sessionID, params = {}, options) {
    const { betas } = params ?? {};
    return this._client.get(path3`/v1/sessions/${sessionID}/events/stream?beta=true`, {
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
        options?.headers
      ]),
      stream: true
    });
  }
};

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/resources/beta/sessions/resources.mjs
var Resources = class extends APIResource {
  /**
   * Get Session Resource
   *
   * @example
   * ```ts
   * const resource =
   *   await client.beta.sessions.resources.retrieve(
   *     'sesrsc_011CZkZBJq5dWxk9fVLNcPht',
   *     { session_id: 'sesn_011CZkZAtmR3yMPDzynEDxu7' },
   *   );
   * ```
   */
  retrieve(resourceID, params, options) {
    const { session_id, betas } = params;
    return this._client.get(path3`/v1/sessions/${session_id}/resources/${resourceID}?beta=true`, {
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
        options?.headers
      ])
    });
  }
  /**
   * Update Session Resource
   *
   * @example
   * ```ts
   * const resource =
   *   await client.beta.sessions.resources.update(
   *     'sesrsc_011CZkZBJq5dWxk9fVLNcPht',
   *     {
   *       session_id: 'sesn_011CZkZAtmR3yMPDzynEDxu7',
   *       authorization_token: 'ghp_exampletoken',
   *     },
   *   );
   * ```
   */
  update(resourceID, params, options) {
    const { session_id, betas, ...body } = params;
    return this._client.post(path3`/v1/sessions/${session_id}/resources/${resourceID}?beta=true`, {
      body,
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
        options?.headers
      ])
    });
  }
  /**
   * List Session Resources
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const betaManagedAgentsSessionResource of client.beta.sessions.resources.list(
   *   'sesn_011CZkZAtmR3yMPDzynEDxu7',
   * )) {
   *   // ...
   * }
   * ```
   */
  list(sessionID, params = {}, options) {
    const { betas, ...query2 } = params ?? {};
    return this._client.getAPIList(path3`/v1/sessions/${sessionID}/resources?beta=true`, PageCursor, {
      query: query2,
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
        options?.headers
      ])
    });
  }
  /**
   * Delete Session Resource
   *
   * @example
   * ```ts
   * const betaManagedAgentsDeleteSessionResource =
   *   await client.beta.sessions.resources.delete(
   *     'sesrsc_011CZkZBJq5dWxk9fVLNcPht',
   *     { session_id: 'sesn_011CZkZAtmR3yMPDzynEDxu7' },
   *   );
   * ```
   */
  delete(resourceID, params, options) {
    const { session_id, betas } = params;
    return this._client.delete(path3`/v1/sessions/${session_id}/resources/${resourceID}?beta=true`, {
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
        options?.headers
      ])
    });
  }
  /**
   * Add Session Resource
   *
   * @example
   * ```ts
   * const betaManagedAgentsFileResource =
   *   await client.beta.sessions.resources.add(
   *     'sesn_011CZkZAtmR3yMPDzynEDxu7',
   *     {
   *       file_id: 'file_011CNha8iCJcU1wXNR6q4V8w',
   *       type: 'file',
   *     },
   *   );
   * ```
   */
  add(sessionID, params, options) {
    const { betas, ...body } = params;
    return this._client.post(path3`/v1/sessions/${sessionID}/resources?beta=true`, {
      body,
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
        options?.headers
      ])
    });
  }
};

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/resources/beta/sessions/sessions.mjs
var Sessions = class extends APIResource {
  constructor() {
    super(...arguments);
    this.events = new Events(this._client);
    this.resources = new Resources(this._client);
  }
  /**
   * Create Session
   *
   * @example
   * ```ts
   * const betaManagedAgentsSession =
   *   await client.beta.sessions.create({
   *     agent: 'agent_011CZkYpogX7uDKUyvBTophP',
   *     environment_id: 'env_011CZkZ9X2dpNyB7HsEFoRfW',
   *   });
   * ```
   */
  create(params, options) {
    const { betas, ...body } = params;
    return this._client.post("/v1/sessions?beta=true", {
      body,
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
        options?.headers
      ])
    });
  }
  /**
   * Get Session
   *
   * @example
   * ```ts
   * const betaManagedAgentsSession =
   *   await client.beta.sessions.retrieve(
   *     'sesn_011CZkZAtmR3yMPDzynEDxu7',
   *   );
   * ```
   */
  retrieve(sessionID, params = {}, options) {
    const { betas } = params ?? {};
    return this._client.get(path3`/v1/sessions/${sessionID}?beta=true`, {
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
        options?.headers
      ])
    });
  }
  /**
   * Update Session
   *
   * @example
   * ```ts
   * const betaManagedAgentsSession =
   *   await client.beta.sessions.update(
   *     'sesn_011CZkZAtmR3yMPDzynEDxu7',
   *   );
   * ```
   */
  update(sessionID, params, options) {
    const { betas, ...body } = params;
    return this._client.post(path3`/v1/sessions/${sessionID}?beta=true`, {
      body,
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
        options?.headers
      ])
    });
  }
  /**
   * List Sessions
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const betaManagedAgentsSession of client.beta.sessions.list()) {
   *   // ...
   * }
   * ```
   */
  list(params = {}, options) {
    const { betas, ...query2 } = params ?? {};
    return this._client.getAPIList("/v1/sessions?beta=true", PageCursor, {
      query: query2,
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
        options?.headers
      ])
    });
  }
  /**
   * Delete Session
   *
   * @example
   * ```ts
   * const betaManagedAgentsDeletedSession =
   *   await client.beta.sessions.delete(
   *     'sesn_011CZkZAtmR3yMPDzynEDxu7',
   *   );
   * ```
   */
  delete(sessionID, params = {}, options) {
    const { betas } = params ?? {};
    return this._client.delete(path3`/v1/sessions/${sessionID}?beta=true`, {
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
        options?.headers
      ])
    });
  }
  /**
   * Archive Session
   *
   * @example
   * ```ts
   * const betaManagedAgentsSession =
   *   await client.beta.sessions.archive(
   *     'sesn_011CZkZAtmR3yMPDzynEDxu7',
   *   );
   * ```
   */
  archive(sessionID, params = {}, options) {
    const { betas } = params ?? {};
    return this._client.post(path3`/v1/sessions/${sessionID}/archive?beta=true`, {
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
        options?.headers
      ])
    });
  }
};
Sessions.Events = Events;
Sessions.Resources = Resources;

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/resources/beta/skills/versions.mjs
var Versions2 = class extends APIResource {
  /**
   * Create Skill Version
   *
   * @example
   * ```ts
   * const version = await client.beta.skills.versions.create(
   *   'skill_id',
   * );
   * ```
   */
  create(skillID, params = {}, options) {
    const { betas, ...body } = params ?? {};
    return this._client.post(path3`/v1/skills/${skillID}/versions?beta=true`, multipartFormRequestOptions({
      body,
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "skills-2025-10-02"].toString() },
        options?.headers
      ])
    }, this._client));
  }
  /**
   * Get Skill Version
   *
   * @example
   * ```ts
   * const version = await client.beta.skills.versions.retrieve(
   *   'version',
   *   { skill_id: 'skill_id' },
   * );
   * ```
   */
  retrieve(version, params, options) {
    const { skill_id, betas } = params;
    return this._client.get(path3`/v1/skills/${skill_id}/versions/${version}?beta=true`, {
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "skills-2025-10-02"].toString() },
        options?.headers
      ])
    });
  }
  /**
   * List Skill Versions
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const versionListResponse of client.beta.skills.versions.list(
   *   'skill_id',
   * )) {
   *   // ...
   * }
   * ```
   */
  list(skillID, params = {}, options) {
    const { betas, ...query2 } = params ?? {};
    return this._client.getAPIList(path3`/v1/skills/${skillID}/versions?beta=true`, PageCursor, {
      query: query2,
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "skills-2025-10-02"].toString() },
        options?.headers
      ])
    });
  }
  /**
   * Delete Skill Version
   *
   * @example
   * ```ts
   * const version = await client.beta.skills.versions.delete(
   *   'version',
   *   { skill_id: 'skill_id' },
   * );
   * ```
   */
  delete(version, params, options) {
    const { skill_id, betas } = params;
    return this._client.delete(path3`/v1/skills/${skill_id}/versions/${version}?beta=true`, {
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "skills-2025-10-02"].toString() },
        options?.headers
      ])
    });
  }
};

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/resources/beta/skills/skills.mjs
var Skills = class extends APIResource {
  constructor() {
    super(...arguments);
    this.versions = new Versions2(this._client);
  }
  /**
   * Create Skill
   *
   * @example
   * ```ts
   * const skill = await client.beta.skills.create();
   * ```
   */
  create(params = {}, options) {
    const { betas, ...body } = params ?? {};
    return this._client.post("/v1/skills?beta=true", multipartFormRequestOptions({
      body,
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "skills-2025-10-02"].toString() },
        options?.headers
      ])
    }, this._client, false));
  }
  /**
   * Get Skill
   *
   * @example
   * ```ts
   * const skill = await client.beta.skills.retrieve('skill_id');
   * ```
   */
  retrieve(skillID, params = {}, options) {
    const { betas } = params ?? {};
    return this._client.get(path3`/v1/skills/${skillID}?beta=true`, {
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "skills-2025-10-02"].toString() },
        options?.headers
      ])
    });
  }
  /**
   * List Skills
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const skillListResponse of client.beta.skills.list()) {
   *   // ...
   * }
   * ```
   */
  list(params = {}, options) {
    const { betas, ...query2 } = params ?? {};
    return this._client.getAPIList("/v1/skills?beta=true", PageCursor, {
      query: query2,
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "skills-2025-10-02"].toString() },
        options?.headers
      ])
    });
  }
  /**
   * Delete Skill
   *
   * @example
   * ```ts
   * const skill = await client.beta.skills.delete('skill_id');
   * ```
   */
  delete(skillID, params = {}, options) {
    const { betas } = params ?? {};
    return this._client.delete(path3`/v1/skills/${skillID}?beta=true`, {
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "skills-2025-10-02"].toString() },
        options?.headers
      ])
    });
  }
};
Skills.Versions = Versions2;

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/resources/beta/vaults/credentials.mjs
var Credentials = class extends APIResource {
  /**
   * Create Credential
   *
   * @example
   * ```ts
   * const betaManagedAgentsCredential =
   *   await client.beta.vaults.credentials.create(
   *     'vlt_011CZkZDLs7fYzm1hXNPeRjv',
   *     {
   *       auth: {
   *         token: 'bearer_exampletoken',
   *         mcp_server_url:
   *           'https://example-server.modelcontextprotocol.io/sse',
   *         type: 'static_bearer',
   *       },
   *     },
   *   );
   * ```
   */
  create(vaultID, params, options) {
    const { betas, ...body } = params;
    return this._client.post(path3`/v1/vaults/${vaultID}/credentials?beta=true`, {
      body,
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
        options?.headers
      ])
    });
  }
  /**
   * Get Credential
   *
   * @example
   * ```ts
   * const betaManagedAgentsCredential =
   *   await client.beta.vaults.credentials.retrieve(
   *     'vcrd_011CZkZEMt8gZan2iYOQfSkw',
   *     { vault_id: 'vlt_011CZkZDLs7fYzm1hXNPeRjv' },
   *   );
   * ```
   */
  retrieve(credentialID, params, options) {
    const { vault_id, betas } = params;
    return this._client.get(path3`/v1/vaults/${vault_id}/credentials/${credentialID}?beta=true`, {
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
        options?.headers
      ])
    });
  }
  /**
   * Update Credential
   *
   * @example
   * ```ts
   * const betaManagedAgentsCredential =
   *   await client.beta.vaults.credentials.update(
   *     'vcrd_011CZkZEMt8gZan2iYOQfSkw',
   *     { vault_id: 'vlt_011CZkZDLs7fYzm1hXNPeRjv' },
   *   );
   * ```
   */
  update(credentialID, params, options) {
    const { vault_id, betas, ...body } = params;
    return this._client.post(path3`/v1/vaults/${vault_id}/credentials/${credentialID}?beta=true`, {
      body,
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
        options?.headers
      ])
    });
  }
  /**
   * List Credentials
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const betaManagedAgentsCredential of client.beta.vaults.credentials.list(
   *   'vlt_011CZkZDLs7fYzm1hXNPeRjv',
   * )) {
   *   // ...
   * }
   * ```
   */
  list(vaultID, params = {}, options) {
    const { betas, ...query2 } = params ?? {};
    return this._client.getAPIList(path3`/v1/vaults/${vaultID}/credentials?beta=true`, PageCursor, {
      query: query2,
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
        options?.headers
      ])
    });
  }
  /**
   * Delete Credential
   *
   * @example
   * ```ts
   * const betaManagedAgentsDeletedCredential =
   *   await client.beta.vaults.credentials.delete(
   *     'vcrd_011CZkZEMt8gZan2iYOQfSkw',
   *     { vault_id: 'vlt_011CZkZDLs7fYzm1hXNPeRjv' },
   *   );
   * ```
   */
  delete(credentialID, params, options) {
    const { vault_id, betas } = params;
    return this._client.delete(path3`/v1/vaults/${vault_id}/credentials/${credentialID}?beta=true`, {
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
        options?.headers
      ])
    });
  }
  /**
   * Archive Credential
   *
   * @example
   * ```ts
   * const betaManagedAgentsCredential =
   *   await client.beta.vaults.credentials.archive(
   *     'vcrd_011CZkZEMt8gZan2iYOQfSkw',
   *     { vault_id: 'vlt_011CZkZDLs7fYzm1hXNPeRjv' },
   *   );
   * ```
   */
  archive(credentialID, params, options) {
    const { vault_id, betas } = params;
    return this._client.post(path3`/v1/vaults/${vault_id}/credentials/${credentialID}/archive?beta=true`, {
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
        options?.headers
      ])
    });
  }
};

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/resources/beta/vaults/vaults.mjs
var Vaults = class extends APIResource {
  constructor() {
    super(...arguments);
    this.credentials = new Credentials(this._client);
  }
  /**
   * Create Vault
   *
   * @example
   * ```ts
   * const betaManagedAgentsVault =
   *   await client.beta.vaults.create({
   *     display_name: 'Example vault',
   *   });
   * ```
   */
  create(params, options) {
    const { betas, ...body } = params;
    return this._client.post("/v1/vaults?beta=true", {
      body,
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
        options?.headers
      ])
    });
  }
  /**
   * Get Vault
   *
   * @example
   * ```ts
   * const betaManagedAgentsVault =
   *   await client.beta.vaults.retrieve(
   *     'vlt_011CZkZDLs7fYzm1hXNPeRjv',
   *   );
   * ```
   */
  retrieve(vaultID, params = {}, options) {
    const { betas } = params ?? {};
    return this._client.get(path3`/v1/vaults/${vaultID}?beta=true`, {
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
        options?.headers
      ])
    });
  }
  /**
   * Update Vault
   *
   * @example
   * ```ts
   * const betaManagedAgentsVault =
   *   await client.beta.vaults.update(
   *     'vlt_011CZkZDLs7fYzm1hXNPeRjv',
   *   );
   * ```
   */
  update(vaultID, params, options) {
    const { betas, ...body } = params;
    return this._client.post(path3`/v1/vaults/${vaultID}?beta=true`, {
      body,
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
        options?.headers
      ])
    });
  }
  /**
   * List Vaults
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const betaManagedAgentsVault of client.beta.vaults.list()) {
   *   // ...
   * }
   * ```
   */
  list(params = {}, options) {
    const { betas, ...query2 } = params ?? {};
    return this._client.getAPIList("/v1/vaults?beta=true", PageCursor, {
      query: query2,
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
        options?.headers
      ])
    });
  }
  /**
   * Delete Vault
   *
   * @example
   * ```ts
   * const betaManagedAgentsDeletedVault =
   *   await client.beta.vaults.delete(
   *     'vlt_011CZkZDLs7fYzm1hXNPeRjv',
   *   );
   * ```
   */
  delete(vaultID, params = {}, options) {
    const { betas } = params ?? {};
    return this._client.delete(path3`/v1/vaults/${vaultID}?beta=true`, {
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
        options?.headers
      ])
    });
  }
  /**
   * Archive Vault
   *
   * @example
   * ```ts
   * const betaManagedAgentsVault =
   *   await client.beta.vaults.archive(
   *     'vlt_011CZkZDLs7fYzm1hXNPeRjv',
   *   );
   * ```
   */
  archive(vaultID, params = {}, options) {
    const { betas } = params ?? {};
    return this._client.post(path3`/v1/vaults/${vaultID}/archive?beta=true`, {
      ...options,
      headers: buildHeaders([
        { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
        options?.headers
      ])
    });
  }
};
Vaults.Credentials = Credentials;

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/resources/beta/beta.mjs
var Beta = class extends APIResource {
  constructor() {
    super(...arguments);
    this.models = new Models(this._client);
    this.messages = new Messages(this._client);
    this.agents = new Agents(this._client);
    this.environments = new Environments(this._client);
    this.sessions = new Sessions(this._client);
    this.vaults = new Vaults(this._client);
    this.files = new Files(this._client);
    this.skills = new Skills(this._client);
    this.userProfiles = new UserProfiles(this._client);
  }
};
Beta.Models = Models;
Beta.Messages = Messages;
Beta.Agents = Agents;
Beta.Environments = Environments;
Beta.Sessions = Sessions;
Beta.Vaults = Vaults;
Beta.Files = Files;
Beta.Skills = Skills;
Beta.UserProfiles = UserProfiles;

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/resources/completions.mjs
var Completions = class extends APIResource {
  create(params, options) {
    const { betas, ...body } = params;
    return this._client.post("/v1/complete", {
      body,
      timeout: this._client._options.timeout ?? 6e5,
      ...options,
      headers: buildHeaders([
        { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
        options?.headers
      ]),
      stream: params.stream ?? false
    });
  }
};

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/lib/parser.mjs
function getOutputFormat2(params) {
  return params?.output_config?.format;
}
function maybeParseMessage(message, params, opts) {
  const outputFormat = getOutputFormat2(params);
  if (!params || !("parse" in (outputFormat ?? {}))) {
    return {
      ...message,
      content: message.content.map((block) => {
        if (block.type === "text") {
          const parsedBlock = Object.defineProperty({ ...block }, "parsed_output", {
            value: null,
            enumerable: false
          });
          return parsedBlock;
        }
        return block;
      }),
      parsed_output: null
    };
  }
  return parseMessage(message, params, opts);
}
function parseMessage(message, params, opts) {
  let firstParsedOutput = null;
  const content = message.content.map((block) => {
    if (block.type === "text") {
      const parsedOutput = parseOutputFormat(params, block.text);
      if (firstParsedOutput === null) {
        firstParsedOutput = parsedOutput;
      }
      const parsedBlock = Object.defineProperty({ ...block }, "parsed_output", {
        value: parsedOutput,
        enumerable: false
      });
      return parsedBlock;
    }
    return block;
  });
  return {
    ...message,
    content,
    parsed_output: firstParsedOutput
  };
}
function parseOutputFormat(params, content) {
  const outputFormat = getOutputFormat2(params);
  if (outputFormat?.type !== "json_schema") {
    return null;
  }
  try {
    if ("parse" in outputFormat) {
      return outputFormat.parse(content);
    }
    return JSON.parse(content);
  } catch (error) {
    throw new AnthropicError(`Failed to parse structured output: ${error}`);
  }
}

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/lib/MessageStream.mjs
var _MessageStream_instances;
var _MessageStream_currentMessageSnapshot;
var _MessageStream_params;
var _MessageStream_connectedPromise;
var _MessageStream_resolveConnectedPromise;
var _MessageStream_rejectConnectedPromise;
var _MessageStream_endPromise;
var _MessageStream_resolveEndPromise;
var _MessageStream_rejectEndPromise;
var _MessageStream_listeners;
var _MessageStream_ended;
var _MessageStream_errored;
var _MessageStream_aborted;
var _MessageStream_catchingPromiseCreated;
var _MessageStream_response;
var _MessageStream_request_id;
var _MessageStream_logger;
var _MessageStream_getFinalMessage;
var _MessageStream_getFinalText;
var _MessageStream_handleError;
var _MessageStream_beginRequest;
var _MessageStream_addStreamEvent;
var _MessageStream_endRequest;
var _MessageStream_accumulateMessage;
var JSON_BUF_PROPERTY2 = "__json_buf";
function tracksToolInput2(content) {
  return content.type === "tool_use" || content.type === "server_tool_use";
}
var MessageStream = class _MessageStream {
  constructor(params, opts) {
    _MessageStream_instances.add(this);
    this.messages = [];
    this.receivedMessages = [];
    _MessageStream_currentMessageSnapshot.set(this, void 0);
    _MessageStream_params.set(this, null);
    this.controller = new AbortController();
    _MessageStream_connectedPromise.set(this, void 0);
    _MessageStream_resolveConnectedPromise.set(this, () => {
    });
    _MessageStream_rejectConnectedPromise.set(this, () => {
    });
    _MessageStream_endPromise.set(this, void 0);
    _MessageStream_resolveEndPromise.set(this, () => {
    });
    _MessageStream_rejectEndPromise.set(this, () => {
    });
    _MessageStream_listeners.set(this, {});
    _MessageStream_ended.set(this, false);
    _MessageStream_errored.set(this, false);
    _MessageStream_aborted.set(this, false);
    _MessageStream_catchingPromiseCreated.set(this, false);
    _MessageStream_response.set(this, void 0);
    _MessageStream_request_id.set(this, void 0);
    _MessageStream_logger.set(this, void 0);
    _MessageStream_handleError.set(this, (error) => {
      __classPrivateFieldSet(this, _MessageStream_errored, true, "f");
      if (isAbortError(error)) {
        error = new APIUserAbortError();
      }
      if (error instanceof APIUserAbortError) {
        __classPrivateFieldSet(this, _MessageStream_aborted, true, "f");
        return this._emit("abort", error);
      }
      if (error instanceof AnthropicError) {
        return this._emit("error", error);
      }
      if (error instanceof Error) {
        const anthropicError = new AnthropicError(error.message);
        anthropicError.cause = error;
        return this._emit("error", anthropicError);
      }
      return this._emit("error", new AnthropicError(String(error)));
    });
    __classPrivateFieldSet(this, _MessageStream_connectedPromise, new Promise((resolve, reject) => {
      __classPrivateFieldSet(this, _MessageStream_resolveConnectedPromise, resolve, "f");
      __classPrivateFieldSet(this, _MessageStream_rejectConnectedPromise, reject, "f");
    }), "f");
    __classPrivateFieldSet(this, _MessageStream_endPromise, new Promise((resolve, reject) => {
      __classPrivateFieldSet(this, _MessageStream_resolveEndPromise, resolve, "f");
      __classPrivateFieldSet(this, _MessageStream_rejectEndPromise, reject, "f");
    }), "f");
    __classPrivateFieldGet(this, _MessageStream_connectedPromise, "f").catch(() => {
    });
    __classPrivateFieldGet(this, _MessageStream_endPromise, "f").catch(() => {
    });
    __classPrivateFieldSet(this, _MessageStream_params, params, "f");
    __classPrivateFieldSet(this, _MessageStream_logger, opts?.logger ?? console, "f");
  }
  get response() {
    return __classPrivateFieldGet(this, _MessageStream_response, "f");
  }
  get request_id() {
    return __classPrivateFieldGet(this, _MessageStream_request_id, "f");
  }
  /**
   * Returns the `MessageStream` data, the raw `Response` instance and the ID of the request,
   * returned vie the `request-id` header which is useful for debugging requests and resporting
   * issues to Anthropic.
   *
   * This is the same as the `APIPromise.withResponse()` method.
   *
   * This method will raise an error if you created the stream using `MessageStream.fromReadableStream`
   * as no `Response` is available.
   */
  async withResponse() {
    __classPrivateFieldSet(this, _MessageStream_catchingPromiseCreated, true, "f");
    const response = await __classPrivateFieldGet(this, _MessageStream_connectedPromise, "f");
    if (!response) {
      throw new Error("Could not resolve a `Response` object");
    }
    return {
      data: this,
      response,
      request_id: response.headers.get("request-id")
    };
  }
  /**
   * Intended for use on the frontend, consuming a stream produced with
   * `.toReadableStream()` on the backend.
   *
   * Note that messages sent to the model do not appear in `.on('message')`
   * in this context.
   */
  static fromReadableStream(stream) {
    const runner = new _MessageStream(null);
    runner._run(() => runner._fromReadableStream(stream));
    return runner;
  }
  static createMessage(messages, params, options, { logger } = {}) {
    const runner = new _MessageStream(params, { logger });
    for (const message of params.messages) {
      runner._addMessageParam(message);
    }
    __classPrivateFieldSet(runner, _MessageStream_params, { ...params, stream: true }, "f");
    runner._run(() => runner._createMessage(messages, { ...params, stream: true }, { ...options, headers: { ...options?.headers, "X-Stainless-Helper-Method": "stream" } }));
    return runner;
  }
  _run(executor) {
    executor().then(() => {
      this._emitFinal();
      this._emit("end");
    }, __classPrivateFieldGet(this, _MessageStream_handleError, "f"));
  }
  _addMessageParam(message) {
    this.messages.push(message);
  }
  _addMessage(message, emit = true) {
    this.receivedMessages.push(message);
    if (emit) {
      this._emit("message", message);
    }
  }
  async _createMessage(messages, params, options) {
    const signal = options?.signal;
    let abortHandler;
    if (signal) {
      if (signal.aborted)
        this.controller.abort();
      abortHandler = this.controller.abort.bind(this.controller);
      signal.addEventListener("abort", abortHandler);
    }
    try {
      __classPrivateFieldGet(this, _MessageStream_instances, "m", _MessageStream_beginRequest).call(this);
      const { response, data: stream } = await messages.create({ ...params, stream: true }, { ...options, signal: this.controller.signal }).withResponse();
      this._connected(response);
      for await (const event of stream) {
        __classPrivateFieldGet(this, _MessageStream_instances, "m", _MessageStream_addStreamEvent).call(this, event);
      }
      if (stream.controller.signal?.aborted) {
        throw new APIUserAbortError();
      }
      __classPrivateFieldGet(this, _MessageStream_instances, "m", _MessageStream_endRequest).call(this);
    } finally {
      if (signal && abortHandler) {
        signal.removeEventListener("abort", abortHandler);
      }
    }
  }
  _connected(response) {
    if (this.ended)
      return;
    __classPrivateFieldSet(this, _MessageStream_response, response, "f");
    __classPrivateFieldSet(this, _MessageStream_request_id, response?.headers.get("request-id"), "f");
    __classPrivateFieldGet(this, _MessageStream_resolveConnectedPromise, "f").call(this, response);
    this._emit("connect");
  }
  get ended() {
    return __classPrivateFieldGet(this, _MessageStream_ended, "f");
  }
  get errored() {
    return __classPrivateFieldGet(this, _MessageStream_errored, "f");
  }
  get aborted() {
    return __classPrivateFieldGet(this, _MessageStream_aborted, "f");
  }
  abort() {
    this.controller.abort();
  }
  /**
   * Adds the listener function to the end of the listeners array for the event.
   * No checks are made to see if the listener has already been added. Multiple calls passing
   * the same combination of event and listener will result in the listener being added, and
   * called, multiple times.
   * @returns this MessageStream, so that calls can be chained
   */
  on(event, listener) {
    const listeners = __classPrivateFieldGet(this, _MessageStream_listeners, "f")[event] || (__classPrivateFieldGet(this, _MessageStream_listeners, "f")[event] = []);
    listeners.push({ listener });
    return this;
  }
  /**
   * Removes the specified listener from the listener array for the event.
   * off() will remove, at most, one instance of a listener from the listener array. If any single
   * listener has been added multiple times to the listener array for the specified event, then
   * off() must be called multiple times to remove each instance.
   * @returns this MessageStream, so that calls can be chained
   */
  off(event, listener) {
    const listeners = __classPrivateFieldGet(this, _MessageStream_listeners, "f")[event];
    if (!listeners)
      return this;
    const index = listeners.findIndex((l) => l.listener === listener);
    if (index >= 0)
      listeners.splice(index, 1);
    return this;
  }
  /**
   * Adds a one-time listener function for the event. The next time the event is triggered,
   * this listener is removed and then invoked.
   * @returns this MessageStream, so that calls can be chained
   */
  once(event, listener) {
    const listeners = __classPrivateFieldGet(this, _MessageStream_listeners, "f")[event] || (__classPrivateFieldGet(this, _MessageStream_listeners, "f")[event] = []);
    listeners.push({ listener, once: true });
    return this;
  }
  /**
   * This is similar to `.once()`, but returns a Promise that resolves the next time
   * the event is triggered, instead of calling a listener callback.
   * @returns a Promise that resolves the next time given event is triggered,
   * or rejects if an error is emitted.  (If you request the 'error' event,
   * returns a promise that resolves with the error).
   *
   * Example:
   *
   *   const message = await stream.emitted('message') // rejects if the stream errors
   */
  emitted(event) {
    return new Promise((resolve, reject) => {
      __classPrivateFieldSet(this, _MessageStream_catchingPromiseCreated, true, "f");
      if (event !== "error")
        this.once("error", reject);
      this.once(event, resolve);
    });
  }
  async done() {
    __classPrivateFieldSet(this, _MessageStream_catchingPromiseCreated, true, "f");
    await __classPrivateFieldGet(this, _MessageStream_endPromise, "f");
  }
  get currentMessage() {
    return __classPrivateFieldGet(this, _MessageStream_currentMessageSnapshot, "f");
  }
  /**
   * @returns a promise that resolves with the the final assistant Message response,
   * or rejects if an error occurred or the stream ended prematurely without producing a Message.
   * If structured outputs were used, this will be a ParsedMessage with a `parsed_output` field.
   */
  async finalMessage() {
    await this.done();
    return __classPrivateFieldGet(this, _MessageStream_instances, "m", _MessageStream_getFinalMessage).call(this);
  }
  /**
   * @returns a promise that resolves with the the final assistant Message's text response, concatenated
   * together if there are more than one text blocks.
   * Rejects if an error occurred or the stream ended prematurely without producing a Message.
   */
  async finalText() {
    await this.done();
    return __classPrivateFieldGet(this, _MessageStream_instances, "m", _MessageStream_getFinalText).call(this);
  }
  _emit(event, ...args) {
    if (__classPrivateFieldGet(this, _MessageStream_ended, "f"))
      return;
    if (event === "end") {
      __classPrivateFieldSet(this, _MessageStream_ended, true, "f");
      __classPrivateFieldGet(this, _MessageStream_resolveEndPromise, "f").call(this);
    }
    const listeners = __classPrivateFieldGet(this, _MessageStream_listeners, "f")[event];
    if (listeners) {
      __classPrivateFieldGet(this, _MessageStream_listeners, "f")[event] = listeners.filter((l) => !l.once);
      listeners.forEach(({ listener }) => listener(...args));
    }
    if (event === "abort") {
      const error = args[0];
      if (!__classPrivateFieldGet(this, _MessageStream_catchingPromiseCreated, "f") && !listeners?.length) {
        Promise.reject(error);
      }
      __classPrivateFieldGet(this, _MessageStream_rejectConnectedPromise, "f").call(this, error);
      __classPrivateFieldGet(this, _MessageStream_rejectEndPromise, "f").call(this, error);
      this._emit("end");
      return;
    }
    if (event === "error") {
      const error = args[0];
      if (!__classPrivateFieldGet(this, _MessageStream_catchingPromiseCreated, "f") && !listeners?.length) {
        Promise.reject(error);
      }
      __classPrivateFieldGet(this, _MessageStream_rejectConnectedPromise, "f").call(this, error);
      __classPrivateFieldGet(this, _MessageStream_rejectEndPromise, "f").call(this, error);
      this._emit("end");
    }
  }
  _emitFinal() {
    const finalMessage = this.receivedMessages.at(-1);
    if (finalMessage) {
      this._emit("finalMessage", __classPrivateFieldGet(this, _MessageStream_instances, "m", _MessageStream_getFinalMessage).call(this));
    }
  }
  async _fromReadableStream(readableStream, options) {
    const signal = options?.signal;
    let abortHandler;
    if (signal) {
      if (signal.aborted)
        this.controller.abort();
      abortHandler = this.controller.abort.bind(this.controller);
      signal.addEventListener("abort", abortHandler);
    }
    try {
      __classPrivateFieldGet(this, _MessageStream_instances, "m", _MessageStream_beginRequest).call(this);
      this._connected(null);
      const stream = Stream.fromReadableStream(readableStream, this.controller);
      for await (const event of stream) {
        __classPrivateFieldGet(this, _MessageStream_instances, "m", _MessageStream_addStreamEvent).call(this, event);
      }
      if (stream.controller.signal?.aborted) {
        throw new APIUserAbortError();
      }
      __classPrivateFieldGet(this, _MessageStream_instances, "m", _MessageStream_endRequest).call(this);
    } finally {
      if (signal && abortHandler) {
        signal.removeEventListener("abort", abortHandler);
      }
    }
  }
  [(_MessageStream_currentMessageSnapshot = /* @__PURE__ */ new WeakMap(), _MessageStream_params = /* @__PURE__ */ new WeakMap(), _MessageStream_connectedPromise = /* @__PURE__ */ new WeakMap(), _MessageStream_resolveConnectedPromise = /* @__PURE__ */ new WeakMap(), _MessageStream_rejectConnectedPromise = /* @__PURE__ */ new WeakMap(), _MessageStream_endPromise = /* @__PURE__ */ new WeakMap(), _MessageStream_resolveEndPromise = /* @__PURE__ */ new WeakMap(), _MessageStream_rejectEndPromise = /* @__PURE__ */ new WeakMap(), _MessageStream_listeners = /* @__PURE__ */ new WeakMap(), _MessageStream_ended = /* @__PURE__ */ new WeakMap(), _MessageStream_errored = /* @__PURE__ */ new WeakMap(), _MessageStream_aborted = /* @__PURE__ */ new WeakMap(), _MessageStream_catchingPromiseCreated = /* @__PURE__ */ new WeakMap(), _MessageStream_response = /* @__PURE__ */ new WeakMap(), _MessageStream_request_id = /* @__PURE__ */ new WeakMap(), _MessageStream_logger = /* @__PURE__ */ new WeakMap(), _MessageStream_handleError = /* @__PURE__ */ new WeakMap(), _MessageStream_instances = /* @__PURE__ */ new WeakSet(), _MessageStream_getFinalMessage = function _MessageStream_getFinalMessage2() {
    if (this.receivedMessages.length === 0) {
      throw new AnthropicError("stream ended without producing a Message with role=assistant");
    }
    return this.receivedMessages.at(-1);
  }, _MessageStream_getFinalText = function _MessageStream_getFinalText2() {
    if (this.receivedMessages.length === 0) {
      throw new AnthropicError("stream ended without producing a Message with role=assistant");
    }
    const textBlocks = this.receivedMessages.at(-1).content.filter((block) => block.type === "text").map((block) => block.text);
    if (textBlocks.length === 0) {
      throw new AnthropicError("stream ended without producing a content block with type=text");
    }
    return textBlocks.join(" ");
  }, _MessageStream_beginRequest = function _MessageStream_beginRequest2() {
    if (this.ended)
      return;
    __classPrivateFieldSet(this, _MessageStream_currentMessageSnapshot, void 0, "f");
  }, _MessageStream_addStreamEvent = function _MessageStream_addStreamEvent2(event) {
    if (this.ended)
      return;
    const messageSnapshot = __classPrivateFieldGet(this, _MessageStream_instances, "m", _MessageStream_accumulateMessage).call(this, event);
    this._emit("streamEvent", event, messageSnapshot);
    switch (event.type) {
      case "content_block_delta": {
        const content = messageSnapshot.content.at(-1);
        switch (event.delta.type) {
          case "text_delta": {
            if (content.type === "text") {
              this._emit("text", event.delta.text, content.text || "");
            }
            break;
          }
          case "citations_delta": {
            if (content.type === "text") {
              this._emit("citation", event.delta.citation, content.citations ?? []);
            }
            break;
          }
          case "input_json_delta": {
            if (tracksToolInput2(content) && content.input) {
              this._emit("inputJson", event.delta.partial_json, content.input);
            }
            break;
          }
          case "thinking_delta": {
            if (content.type === "thinking") {
              this._emit("thinking", event.delta.thinking, content.thinking);
            }
            break;
          }
          case "signature_delta": {
            if (content.type === "thinking") {
              this._emit("signature", content.signature);
            }
            break;
          }
          default:
            checkNever2(event.delta);
        }
        break;
      }
      case "message_stop": {
        this._addMessageParam(messageSnapshot);
        this._addMessage(maybeParseMessage(messageSnapshot, __classPrivateFieldGet(this, _MessageStream_params, "f"), { logger: __classPrivateFieldGet(this, _MessageStream_logger, "f") }), true);
        break;
      }
      case "content_block_stop": {
        this._emit("contentBlock", messageSnapshot.content.at(-1));
        break;
      }
      case "message_start": {
        __classPrivateFieldSet(this, _MessageStream_currentMessageSnapshot, messageSnapshot, "f");
        break;
      }
      case "content_block_start":
      case "message_delta":
        break;
    }
  }, _MessageStream_endRequest = function _MessageStream_endRequest2() {
    if (this.ended) {
      throw new AnthropicError(`stream has ended, this shouldn't happen`);
    }
    const snapshot = __classPrivateFieldGet(this, _MessageStream_currentMessageSnapshot, "f");
    if (!snapshot) {
      throw new AnthropicError(`request ended without sending any chunks`);
    }
    __classPrivateFieldSet(this, _MessageStream_currentMessageSnapshot, void 0, "f");
    return maybeParseMessage(snapshot, __classPrivateFieldGet(this, _MessageStream_params, "f"), { logger: __classPrivateFieldGet(this, _MessageStream_logger, "f") });
  }, _MessageStream_accumulateMessage = function _MessageStream_accumulateMessage2(event) {
    let snapshot = __classPrivateFieldGet(this, _MessageStream_currentMessageSnapshot, "f");
    if (event.type === "message_start") {
      if (snapshot) {
        throw new AnthropicError(`Unexpected event order, got ${event.type} before receiving "message_stop"`);
      }
      return event.message;
    }
    if (!snapshot) {
      throw new AnthropicError(`Unexpected event order, got ${event.type} before "message_start"`);
    }
    switch (event.type) {
      case "message_stop":
        return snapshot;
      case "message_delta":
        snapshot.stop_reason = event.delta.stop_reason;
        snapshot.stop_sequence = event.delta.stop_sequence;
        snapshot.usage.output_tokens = event.usage.output_tokens;
        if (event.usage.input_tokens != null) {
          snapshot.usage.input_tokens = event.usage.input_tokens;
        }
        if (event.usage.cache_creation_input_tokens != null) {
          snapshot.usage.cache_creation_input_tokens = event.usage.cache_creation_input_tokens;
        }
        if (event.usage.cache_read_input_tokens != null) {
          snapshot.usage.cache_read_input_tokens = event.usage.cache_read_input_tokens;
        }
        if (event.usage.server_tool_use != null) {
          snapshot.usage.server_tool_use = event.usage.server_tool_use;
        }
        return snapshot;
      case "content_block_start":
        snapshot.content.push({ ...event.content_block });
        return snapshot;
      case "content_block_delta": {
        const snapshotContent = snapshot.content.at(event.index);
        switch (event.delta.type) {
          case "text_delta": {
            if (snapshotContent?.type === "text") {
              snapshot.content[event.index] = {
                ...snapshotContent,
                text: (snapshotContent.text || "") + event.delta.text
              };
            }
            break;
          }
          case "citations_delta": {
            if (snapshotContent?.type === "text") {
              snapshot.content[event.index] = {
                ...snapshotContent,
                citations: [...snapshotContent.citations ?? [], event.delta.citation]
              };
            }
            break;
          }
          case "input_json_delta": {
            if (snapshotContent && tracksToolInput2(snapshotContent)) {
              let jsonBuf = snapshotContent[JSON_BUF_PROPERTY2] || "";
              jsonBuf += event.delta.partial_json;
              const newContent = { ...snapshotContent };
              Object.defineProperty(newContent, JSON_BUF_PROPERTY2, {
                value: jsonBuf,
                enumerable: false,
                writable: true
              });
              if (jsonBuf) {
                newContent.input = partialParse(jsonBuf);
              }
              snapshot.content[event.index] = newContent;
            }
            break;
          }
          case "thinking_delta": {
            if (snapshotContent?.type === "thinking") {
              snapshot.content[event.index] = {
                ...snapshotContent,
                thinking: snapshotContent.thinking + event.delta.thinking
              };
            }
            break;
          }
          case "signature_delta": {
            if (snapshotContent?.type === "thinking") {
              snapshot.content[event.index] = {
                ...snapshotContent,
                signature: event.delta.signature
              };
            }
            break;
          }
          default:
            checkNever2(event.delta);
        }
        return snapshot;
      }
      case "content_block_stop":
        return snapshot;
    }
  }, Symbol.asyncIterator)]() {
    const pushQueue = [];
    const readQueue = [];
    let done = false;
    this.on("streamEvent", (event) => {
      const reader = readQueue.shift();
      if (reader) {
        reader.resolve(event);
      } else {
        pushQueue.push(event);
      }
    });
    this.on("end", () => {
      done = true;
      for (const reader of readQueue) {
        reader.resolve(void 0);
      }
      readQueue.length = 0;
    });
    this.on("abort", (err) => {
      done = true;
      for (const reader of readQueue) {
        reader.reject(err);
      }
      readQueue.length = 0;
    });
    this.on("error", (err) => {
      done = true;
      for (const reader of readQueue) {
        reader.reject(err);
      }
      readQueue.length = 0;
    });
    return {
      next: async () => {
        if (!pushQueue.length) {
          if (done) {
            return { value: void 0, done: true };
          }
          return new Promise((resolve, reject) => readQueue.push({ resolve, reject })).then((chunk2) => chunk2 ? { value: chunk2, done: false } : { value: void 0, done: true });
        }
        const chunk = pushQueue.shift();
        return { value: chunk, done: false };
      },
      return: async () => {
        this.abort();
        return { value: void 0, done: true };
      }
    };
  }
  toReadableStream() {
    const stream = new Stream(this[Symbol.asyncIterator].bind(this), this.controller);
    return stream.toReadableStream();
  }
};
function checkNever2(x) {
}

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/resources/messages/batches.mjs
var Batches2 = class extends APIResource {
  /**
   * Send a batch of Message creation requests.
   *
   * The Message Batches API can be used to process multiple Messages API requests at
   * once. Once a Message Batch is created, it begins processing immediately. Batches
   * can take up to 24 hours to complete.
   *
   * Learn more about the Message Batches API in our
   * [user guide](https://docs.claude.com/en/docs/build-with-claude/batch-processing)
   *
   * @example
   * ```ts
   * const messageBatch = await client.messages.batches.create({
   *   requests: [
   *     {
   *       custom_id: 'my-custom-id-1',
   *       params: {
   *         max_tokens: 1024,
   *         messages: [
   *           { content: 'Hello, world', role: 'user' },
   *         ],
   *         model: 'claude-opus-4-6',
   *       },
   *     },
   *   ],
   * });
   * ```
   */
  create(body, options) {
    return this._client.post("/v1/messages/batches", { body, ...options });
  }
  /**
   * This endpoint is idempotent and can be used to poll for Message Batch
   * completion. To access the results of a Message Batch, make a request to the
   * `results_url` field in the response.
   *
   * Learn more about the Message Batches API in our
   * [user guide](https://docs.claude.com/en/docs/build-with-claude/batch-processing)
   *
   * @example
   * ```ts
   * const messageBatch = await client.messages.batches.retrieve(
   *   'message_batch_id',
   * );
   * ```
   */
  retrieve(messageBatchID, options) {
    return this._client.get(path3`/v1/messages/batches/${messageBatchID}`, options);
  }
  /**
   * List all Message Batches within a Workspace. Most recently created batches are
   * returned first.
   *
   * Learn more about the Message Batches API in our
   * [user guide](https://docs.claude.com/en/docs/build-with-claude/batch-processing)
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const messageBatch of client.messages.batches.list()) {
   *   // ...
   * }
   * ```
   */
  list(query2 = {}, options) {
    return this._client.getAPIList("/v1/messages/batches", Page, { query: query2, ...options });
  }
  /**
   * Delete a Message Batch.
   *
   * Message Batches can only be deleted once they've finished processing. If you'd
   * like to delete an in-progress batch, you must first cancel it.
   *
   * Learn more about the Message Batches API in our
   * [user guide](https://docs.claude.com/en/docs/build-with-claude/batch-processing)
   *
   * @example
   * ```ts
   * const deletedMessageBatch =
   *   await client.messages.batches.delete('message_batch_id');
   * ```
   */
  delete(messageBatchID, options) {
    return this._client.delete(path3`/v1/messages/batches/${messageBatchID}`, options);
  }
  /**
   * Batches may be canceled any time before processing ends. Once cancellation is
   * initiated, the batch enters a `canceling` state, at which time the system may
   * complete any in-progress, non-interruptible requests before finalizing
   * cancellation.
   *
   * The number of canceled requests is specified in `request_counts`. To determine
   * which requests were canceled, check the individual results within the batch.
   * Note that cancellation may not result in any canceled requests if they were
   * non-interruptible.
   *
   * Learn more about the Message Batches API in our
   * [user guide](https://docs.claude.com/en/docs/build-with-claude/batch-processing)
   *
   * @example
   * ```ts
   * const messageBatch = await client.messages.batches.cancel(
   *   'message_batch_id',
   * );
   * ```
   */
  cancel(messageBatchID, options) {
    return this._client.post(path3`/v1/messages/batches/${messageBatchID}/cancel`, options);
  }
  /**
   * Streams the results of a Message Batch as a `.jsonl` file.
   *
   * Each line in the file is a JSON object containing the result of a single request
   * in the Message Batch. Results are not guaranteed to be in the same order as
   * requests. Use the `custom_id` field to match results to requests.
   *
   * Learn more about the Message Batches API in our
   * [user guide](https://docs.claude.com/en/docs/build-with-claude/batch-processing)
   *
   * @example
   * ```ts
   * const messageBatchIndividualResponse =
   *   await client.messages.batches.results('message_batch_id');
   * ```
   */
  async results(messageBatchID, options) {
    const batch = await this.retrieve(messageBatchID);
    if (!batch.results_url) {
      throw new AnthropicError(`No batch \`results_url\`; Has it finished processing? ${batch.processing_status} - ${batch.id}`);
    }
    return this._client.get(batch.results_url, {
      ...options,
      headers: buildHeaders([{ Accept: "application/binary" }, options?.headers]),
      stream: true,
      __binaryResponse: true
    })._thenUnwrap((_, props) => JSONLDecoder.fromResponse(props.response, props.controller));
  }
};

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/resources/messages/messages.mjs
var Messages2 = class extends APIResource {
  constructor() {
    super(...arguments);
    this.batches = new Batches2(this._client);
  }
  create(body, options) {
    if (body.model in DEPRECATED_MODELS2) {
      console.warn(`The model '${body.model}' is deprecated and will reach end-of-life on ${DEPRECATED_MODELS2[body.model]}
Please migrate to a newer model. Visit https://docs.anthropic.com/en/docs/resources/model-deprecations for more information.`);
    }
    if (MODELS_TO_WARN_WITH_THINKING_ENABLED2.includes(body.model) && body.thinking && body.thinking.type === "enabled") {
      console.warn(`Using Claude with ${body.model} and 'thinking.type=enabled' is deprecated. Use 'thinking.type=adaptive' instead which results in better model performance in our testing: https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking`);
    }
    let timeout = this._client._options.timeout;
    if (!body.stream && timeout == null) {
      const maxNonstreamingTokens = MODEL_NONSTREAMING_TOKENS[body.model] ?? void 0;
      timeout = this._client.calculateNonstreamingTimeout(body.max_tokens, maxNonstreamingTokens);
    }
    const helperHeader = stainlessHelperHeader(body.tools, body.messages);
    return this._client.post("/v1/messages", {
      body,
      timeout: timeout ?? 6e5,
      ...options,
      headers: buildHeaders([helperHeader, options?.headers]),
      stream: body.stream ?? false
    });
  }
  /**
   * Send a structured list of input messages with text and/or image content, along with an expected `output_config.format` and
   * the response will be automatically parsed and available in the `parsed_output` property of the message.
   *
   * @example
   * ```ts
   * const message = await client.messages.parse({
   *   model: 'claude-sonnet-4-5-20250929',
   *   max_tokens: 1024,
   *   messages: [{ role: 'user', content: 'What is 2+2?' }],
   *   output_config: {
   *     format: zodOutputFormat(z.object({ answer: z.number() })),
   *   },
   * });
   *
   * console.log(message.parsed_output?.answer); // 4
   * ```
   */
  parse(params, options) {
    return this.create(params, options).then((message) => parseMessage(message, params, { logger: this._client.logger ?? console }));
  }
  /**
   * Create a Message stream.
   *
   * If `output_config.format` is provided with a parseable format (like `zodOutputFormat()`),
   * the final message will include a `parsed_output` property with the parsed content.
   *
   * @example
   * ```ts
   * const stream = client.messages.stream({
   *   model: 'claude-sonnet-4-5-20250929',
   *   max_tokens: 1024,
   *   messages: [{ role: 'user', content: 'What is 2+2?' }],
   *   output_config: {
   *     format: zodOutputFormat(z.object({ answer: z.number() })),
   *   },
   * });
   *
   * const message = await stream.finalMessage();
   * console.log(message.parsed_output?.answer); // 4
   * ```
   */
  stream(body, options) {
    return MessageStream.createMessage(this, body, options, { logger: this._client.logger ?? console });
  }
  /**
   * Count the number of tokens in a Message.
   *
   * The Token Count API can be used to count the number of tokens in a Message,
   * including tools, images, and documents, without creating it.
   *
   * Learn more about token counting in our
   * [user guide](https://docs.claude.com/en/docs/build-with-claude/token-counting)
   *
   * @example
   * ```ts
   * const messageTokensCount =
   *   await client.messages.countTokens({
   *     messages: [{ content: 'Hello, world', role: 'user' }],
   *     model: 'claude-opus-4-6',
   *   });
   * ```
   */
  countTokens(body, options) {
    return this._client.post("/v1/messages/count_tokens", { body, ...options });
  }
};
var DEPRECATED_MODELS2 = {
  "claude-1.3": "November 6th, 2024",
  "claude-1.3-100k": "November 6th, 2024",
  "claude-instant-1.1": "November 6th, 2024",
  "claude-instant-1.1-100k": "November 6th, 2024",
  "claude-instant-1.2": "November 6th, 2024",
  "claude-3-sonnet-20240229": "July 21st, 2025",
  "claude-3-opus-20240229": "January 5th, 2026",
  "claude-2.1": "July 21st, 2025",
  "claude-2.0": "July 21st, 2025",
  "claude-3-7-sonnet-latest": "February 19th, 2026",
  "claude-3-7-sonnet-20250219": "February 19th, 2026",
  "claude-3-5-haiku-latest": "February 19th, 2026",
  "claude-3-5-haiku-20241022": "February 19th, 2026",
  "claude-opus-4-0": "June 15th, 2026",
  "claude-opus-4-20250514": "June 15th, 2026",
  "claude-sonnet-4-0": "June 15th, 2026",
  "claude-sonnet-4-20250514": "June 15th, 2026"
};
var MODELS_TO_WARN_WITH_THINKING_ENABLED2 = ["claude-mythos-preview", "claude-opus-4-6"];
Messages2.Batches = Batches2;

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/resources/models.mjs
var Models2 = class extends APIResource {
  /**
   * Get a specific model.
   *
   * The Models API response can be used to determine information about a specific
   * model or resolve a model alias to a model ID.
   */
  retrieve(modelID, params = {}, options) {
    const { betas } = params ?? {};
    return this._client.get(path3`/v1/models/${modelID}`, {
      ...options,
      headers: buildHeaders([
        { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
        options?.headers
      ])
    });
  }
  /**
   * List available models.
   *
   * The Models API response can be used to determine which models are available for
   * use in the API. More recently released models are listed first.
   */
  list(params = {}, options) {
    const { betas, ...query2 } = params ?? {};
    return this._client.getAPIList("/v1/models", Page, {
      query: query2,
      ...options,
      headers: buildHeaders([
        { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
        options?.headers
      ])
    });
  }
};

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/internal/utils/env.mjs
var readEnv = (env) => {
  if (typeof globalThis.process !== "undefined") {
    return globalThis.process.env?.[env]?.trim() || void 0;
  }
  if (typeof globalThis.Deno !== "undefined") {
    return globalThis.Deno.env?.get?.(env)?.trim() || void 0;
  }
  return void 0;
};

// ../../node_modules/.pnpm/@anthropic-ai+sdk@0.90.0/node_modules/@anthropic-ai/sdk/client.mjs
var _BaseAnthropic_instances;
var _a;
var _BaseAnthropic_encoder;
var _BaseAnthropic_baseURLOverridden;
var HUMAN_PROMPT = "\\n\\nHuman:";
var AI_PROMPT = "\\n\\nAssistant:";
var BaseAnthropic = class {
  /**
   * API Client for interfacing with the Anthropic API.
   *
   * @param {string | null | undefined} [opts.apiKey=process.env['ANTHROPIC_API_KEY'] ?? null]
   * @param {string | null | undefined} [opts.authToken=process.env['ANTHROPIC_AUTH_TOKEN'] ?? null]
   * @param {string} [opts.baseURL=process.env['ANTHROPIC_BASE_URL'] ?? https://api.anthropic.com] - Override the default base URL for the API.
   * @param {number} [opts.timeout=10 minutes] - The maximum amount of time (in milliseconds) the client will wait for a response before timing out.
   * @param {MergedRequestInit} [opts.fetchOptions] - Additional `RequestInit` options to be passed to `fetch` calls.
   * @param {Fetch} [opts.fetch] - Specify a custom `fetch` function implementation.
   * @param {number} [opts.maxRetries=2] - The maximum number of times the client will retry a request.
   * @param {HeadersLike} opts.defaultHeaders - Default headers to include with every request to the API.
   * @param {Record<string, string | undefined>} opts.defaultQuery - Default query parameters to include with every request to the API.
   * @param {boolean} [opts.dangerouslyAllowBrowser=false] - By default, client-side use of this library is not allowed, as it risks exposing your secret API credentials to attackers.
   */
  constructor({ baseURL = readEnv("ANTHROPIC_BASE_URL"), apiKey = readEnv("ANTHROPIC_API_KEY") ?? null, authToken = readEnv("ANTHROPIC_AUTH_TOKEN") ?? null, ...opts } = {}) {
    _BaseAnthropic_instances.add(this);
    _BaseAnthropic_encoder.set(this, void 0);
    const options = {
      apiKey,
      authToken,
      ...opts,
      baseURL: baseURL || `https://api.anthropic.com`
    };
    if (!options.dangerouslyAllowBrowser && isRunningInBrowser()) {
      throw new AnthropicError("It looks like you're running in a browser-like environment.\n\nThis is disabled by default, as it risks exposing your secret API credentials to attackers.\nIf you understand the risks and have appropriate mitigations in place,\nyou can set the `dangerouslyAllowBrowser` option to `true`, e.g.,\n\nnew Anthropic({ apiKey, dangerouslyAllowBrowser: true });\n");
    }
    this.baseURL = options.baseURL;
    this.timeout = options.timeout ?? _a.DEFAULT_TIMEOUT;
    this.logger = options.logger ?? console;
    const defaultLogLevel = "warn";
    this.logLevel = defaultLogLevel;
    this.logLevel = parseLogLevel(options.logLevel, "ClientOptions.logLevel", this) ?? parseLogLevel(readEnv("ANTHROPIC_LOG"), "process.env['ANTHROPIC_LOG']", this) ?? defaultLogLevel;
    this.fetchOptions = options.fetchOptions;
    this.maxRetries = options.maxRetries ?? 2;
    this.fetch = options.fetch ?? getDefaultFetch();
    __classPrivateFieldSet(this, _BaseAnthropic_encoder, FallbackEncoder, "f");
    this._options = options;
    this.apiKey = typeof apiKey === "string" ? apiKey : null;
    this.authToken = authToken;
  }
  /**
   * Create a new client instance re-using the same options given to the current client with optional overriding.
   */
  withOptions(options) {
    const client = new this.constructor({
      ...this._options,
      baseURL: this.baseURL,
      maxRetries: this.maxRetries,
      timeout: this.timeout,
      logger: this.logger,
      logLevel: this.logLevel,
      fetch: this.fetch,
      fetchOptions: this.fetchOptions,
      apiKey: this.apiKey,
      authToken: this.authToken,
      ...options
    });
    return client;
  }
  defaultQuery() {
    return this._options.defaultQuery;
  }
  validateHeaders({ values, nulls }) {
    if (values.get("x-api-key") || values.get("authorization")) {
      return;
    }
    if (this.apiKey && values.get("x-api-key")) {
      return;
    }
    if (nulls.has("x-api-key")) {
      return;
    }
    if (this.authToken && values.get("authorization")) {
      return;
    }
    if (nulls.has("authorization")) {
      return;
    }
    throw new Error('Could not resolve authentication method. Expected either apiKey or authToken to be set. Or for one of the "X-Api-Key" or "Authorization" headers to be explicitly omitted');
  }
  async authHeaders(opts) {
    return buildHeaders([await this.apiKeyAuth(opts), await this.bearerAuth(opts)]);
  }
  async apiKeyAuth(opts) {
    if (this.apiKey == null) {
      return void 0;
    }
    return buildHeaders([{ "X-Api-Key": this.apiKey }]);
  }
  async bearerAuth(opts) {
    if (this.authToken == null) {
      return void 0;
    }
    return buildHeaders([{ Authorization: `Bearer ${this.authToken}` }]);
  }
  /**
   * Basic re-implementation of `qs.stringify` for primitive types.
   */
  stringifyQuery(query2) {
    return stringifyQuery(query2);
  }
  getUserAgent() {
    return `${this.constructor.name}/JS ${VERSION}`;
  }
  defaultIdempotencyKey() {
    return `stainless-node-retry-${uuid4()}`;
  }
  makeStatusError(status, error, message, headers) {
    return APIError.generate(status, error, message, headers);
  }
  buildURL(path4, query2, defaultBaseURL) {
    const baseURL = !__classPrivateFieldGet(this, _BaseAnthropic_instances, "m", _BaseAnthropic_baseURLOverridden).call(this) && defaultBaseURL || this.baseURL;
    const url = isAbsoluteURL(path4) ? new URL(path4) : new URL(baseURL + (baseURL.endsWith("/") && path4.startsWith("/") ? path4.slice(1) : path4));
    const defaultQuery = this.defaultQuery();
    const pathQuery = Object.fromEntries(url.searchParams);
    if (!isEmptyObj(defaultQuery) || !isEmptyObj(pathQuery)) {
      query2 = { ...pathQuery, ...defaultQuery, ...query2 };
    }
    if (typeof query2 === "object" && query2 && !Array.isArray(query2)) {
      url.search = this.stringifyQuery(query2);
    }
    return url.toString();
  }
  _calculateNonstreamingTimeout(maxTokens) {
    const defaultTimeout = 10 * 60;
    const expectedTimeout = 60 * 60 * maxTokens / 128e3;
    if (expectedTimeout > defaultTimeout) {
      throw new AnthropicError("Streaming is required for operations that may take longer than 10 minutes. See https://github.com/anthropics/anthropic-sdk-typescript#streaming-responses for more details");
    }
    return defaultTimeout * 1e3;
  }
  /**
   * Used as a callback for mutating the given `FinalRequestOptions` object.
   */
  async prepareOptions(options) {
  }
  /**
   * Used as a callback for mutating the given `RequestInit` object.
   *
   * This is useful for cases where you want to add certain headers based off of
   * the request properties, e.g. `method` or `url`.
   */
  async prepareRequest(request, { url, options }) {
  }
  get(path4, opts) {
    return this.methodRequest("get", path4, opts);
  }
  post(path4, opts) {
    return this.methodRequest("post", path4, opts);
  }
  patch(path4, opts) {
    return this.methodRequest("patch", path4, opts);
  }
  put(path4, opts) {
    return this.methodRequest("put", path4, opts);
  }
  delete(path4, opts) {
    return this.methodRequest("delete", path4, opts);
  }
  methodRequest(method, path4, opts) {
    return this.request(Promise.resolve(opts).then((opts2) => {
      return { method, path: path4, ...opts2 };
    }));
  }
  request(options, remainingRetries = null) {
    return new APIPromise(this, this.makeRequest(options, remainingRetries, void 0));
  }
  async makeRequest(optionsInput, retriesRemaining, retryOfRequestLogID) {
    const options = await optionsInput;
    const maxRetries = options.maxRetries ?? this.maxRetries;
    if (retriesRemaining == null) {
      retriesRemaining = maxRetries;
    }
    await this.prepareOptions(options);
    const { req, url, timeout } = await this.buildRequest(options, {
      retryCount: maxRetries - retriesRemaining
    });
    await this.prepareRequest(req, { url, options });
    const requestLogID = "log_" + (Math.random() * (1 << 24) | 0).toString(16).padStart(6, "0");
    const retryLogStr = retryOfRequestLogID === void 0 ? "" : `, retryOf: ${retryOfRequestLogID}`;
    const startTime = Date.now();
    loggerFor(this).debug(`[${requestLogID}] sending request`, formatRequestDetails({
      retryOfRequestLogID,
      method: options.method,
      url,
      options,
      headers: req.headers
    }));
    if (options.signal?.aborted) {
      throw new APIUserAbortError();
    }
    const controller = new AbortController();
    const response = await this.fetchWithTimeout(url, req, timeout, controller).catch(castToError);
    const headersTime = Date.now();
    if (response instanceof globalThis.Error) {
      const retryMessage = `retrying, ${retriesRemaining} attempts remaining`;
      if (options.signal?.aborted) {
        throw new APIUserAbortError();
      }
      const isTimeout = isAbortError(response) || /timed? ?out/i.test(String(response) + ("cause" in response ? String(response.cause) : ""));
      if (retriesRemaining) {
        loggerFor(this).info(`[${requestLogID}] connection ${isTimeout ? "timed out" : "failed"} - ${retryMessage}`);
        loggerFor(this).debug(`[${requestLogID}] connection ${isTimeout ? "timed out" : "failed"} (${retryMessage})`, formatRequestDetails({
          retryOfRequestLogID,
          url,
          durationMs: headersTime - startTime,
          message: response.message
        }));
        return this.retryRequest(options, retriesRemaining, retryOfRequestLogID ?? requestLogID);
      }
      loggerFor(this).info(`[${requestLogID}] connection ${isTimeout ? "timed out" : "failed"} - error; no more retries left`);
      loggerFor(this).debug(`[${requestLogID}] connection ${isTimeout ? "timed out" : "failed"} (error; no more retries left)`, formatRequestDetails({
        retryOfRequestLogID,
        url,
        durationMs: headersTime - startTime,
        message: response.message
      }));
      if (isTimeout) {
        throw new APIConnectionTimeoutError();
      }
      throw new APIConnectionError({ cause: response });
    }
    const specialHeaders = [...response.headers.entries()].filter(([name]) => name === "request-id").map(([name, value]) => ", " + name + ": " + JSON.stringify(value)).join("");
    const responseInfo = `[${requestLogID}${retryLogStr}${specialHeaders}] ${req.method} ${url} ${response.ok ? "succeeded" : "failed"} with status ${response.status} in ${headersTime - startTime}ms`;
    if (!response.ok) {
      const shouldRetry = await this.shouldRetry(response);
      if (retriesRemaining && shouldRetry) {
        const retryMessage2 = `retrying, ${retriesRemaining} attempts remaining`;
        await CancelReadableStream(response.body);
        loggerFor(this).info(`${responseInfo} - ${retryMessage2}`);
        loggerFor(this).debug(`[${requestLogID}] response error (${retryMessage2})`, formatRequestDetails({
          retryOfRequestLogID,
          url: response.url,
          status: response.status,
          headers: response.headers,
          durationMs: headersTime - startTime
        }));
        return this.retryRequest(options, retriesRemaining, retryOfRequestLogID ?? requestLogID, response.headers);
      }
      const retryMessage = shouldRetry ? `error; no more retries left` : `error; not retryable`;
      loggerFor(this).info(`${responseInfo} - ${retryMessage}`);
      const errText = await response.text().catch((err2) => castToError(err2).message);
      const errJSON = safeJSON(errText);
      const errMessage = errJSON ? void 0 : errText;
      loggerFor(this).debug(`[${requestLogID}] response error (${retryMessage})`, formatRequestDetails({
        retryOfRequestLogID,
        url: response.url,
        status: response.status,
        headers: response.headers,
        message: errMessage,
        durationMs: Date.now() - startTime
      }));
      const err = this.makeStatusError(response.status, errJSON, errMessage, response.headers);
      throw err;
    }
    loggerFor(this).info(responseInfo);
    loggerFor(this).debug(`[${requestLogID}] response start`, formatRequestDetails({
      retryOfRequestLogID,
      url: response.url,
      status: response.status,
      headers: response.headers,
      durationMs: headersTime - startTime
    }));
    return { response, options, controller, requestLogID, retryOfRequestLogID, startTime };
  }
  getAPIList(path4, Page2, opts) {
    return this.requestAPIList(Page2, opts && "then" in opts ? opts.then((opts2) => ({ method: "get", path: path4, ...opts2 })) : { method: "get", path: path4, ...opts });
  }
  requestAPIList(Page2, options) {
    const request = this.makeRequest(options, null, void 0);
    return new PagePromise(this, request, Page2);
  }
  async fetchWithTimeout(url, init, ms, controller) {
    const { signal, method, ...options } = init || {};
    const abort = this._makeAbort(controller);
    if (signal)
      signal.addEventListener("abort", abort, { once: true });
    const timeout = setTimeout(abort, ms);
    const isReadableBody = globalThis.ReadableStream && options.body instanceof globalThis.ReadableStream || typeof options.body === "object" && options.body !== null && Symbol.asyncIterator in options.body;
    const fetchOptions = {
      signal: controller.signal,
      ...isReadableBody ? { duplex: "half" } : {},
      method: "GET",
      ...options
    };
    if (method) {
      fetchOptions.method = method.toUpperCase();
    }
    try {
      return await this.fetch.call(void 0, url, fetchOptions);
    } finally {
      clearTimeout(timeout);
    }
  }
  async shouldRetry(response) {
    const shouldRetryHeader = response.headers.get("x-should-retry");
    if (shouldRetryHeader === "true")
      return true;
    if (shouldRetryHeader === "false")
      return false;
    if (response.status === 408)
      return true;
    if (response.status === 409)
      return true;
    if (response.status === 429)
      return true;
    if (response.status >= 500)
      return true;
    return false;
  }
  async retryRequest(options, retriesRemaining, requestLogID, responseHeaders) {
    let timeoutMillis;
    const retryAfterMillisHeader = responseHeaders?.get("retry-after-ms");
    if (retryAfterMillisHeader) {
      const timeoutMs = parseFloat(retryAfterMillisHeader);
      if (!Number.isNaN(timeoutMs)) {
        timeoutMillis = timeoutMs;
      }
    }
    const retryAfterHeader = responseHeaders?.get("retry-after");
    if (retryAfterHeader && !timeoutMillis) {
      const timeoutSeconds = parseFloat(retryAfterHeader);
      if (!Number.isNaN(timeoutSeconds)) {
        timeoutMillis = timeoutSeconds * 1e3;
      } else {
        timeoutMillis = Date.parse(retryAfterHeader) - Date.now();
      }
    }
    if (timeoutMillis === void 0) {
      const maxRetries = options.maxRetries ?? this.maxRetries;
      timeoutMillis = this.calculateDefaultRetryTimeoutMillis(retriesRemaining, maxRetries);
    }
    await sleep(timeoutMillis);
    return this.makeRequest(options, retriesRemaining - 1, requestLogID);
  }
  calculateDefaultRetryTimeoutMillis(retriesRemaining, maxRetries) {
    const initialRetryDelay = 0.5;
    const maxRetryDelay = 8;
    const numRetries = maxRetries - retriesRemaining;
    const sleepSeconds = Math.min(initialRetryDelay * Math.pow(2, numRetries), maxRetryDelay);
    const jitter = 1 - Math.random() * 0.25;
    return sleepSeconds * jitter * 1e3;
  }
  calculateNonstreamingTimeout(maxTokens, maxNonstreamingTokens) {
    const maxTime = 60 * 60 * 1e3;
    const defaultTime = 60 * 10 * 1e3;
    const expectedTime = maxTime * maxTokens / 128e3;
    if (expectedTime > defaultTime || maxNonstreamingTokens != null && maxTokens > maxNonstreamingTokens) {
      throw new AnthropicError("Streaming is required for operations that may take longer than 10 minutes. See https://github.com/anthropics/anthropic-sdk-typescript#long-requests for more details");
    }
    return defaultTime;
  }
  async buildRequest(inputOptions, { retryCount = 0 } = {}) {
    const options = { ...inputOptions };
    const { method, path: path4, query: query2, defaultBaseURL } = options;
    const url = this.buildURL(path4, query2, defaultBaseURL);
    if ("timeout" in options)
      validatePositiveInteger("timeout", options.timeout);
    options.timeout = options.timeout ?? this.timeout;
    const { bodyHeaders, body } = this.buildBody({ options });
    const reqHeaders = await this.buildHeaders({ options: inputOptions, method, bodyHeaders, retryCount });
    const req = {
      method,
      headers: reqHeaders,
      ...options.signal && { signal: options.signal },
      ...globalThis.ReadableStream && body instanceof globalThis.ReadableStream && { duplex: "half" },
      ...body && { body },
      ...this.fetchOptions ?? {},
      ...options.fetchOptions ?? {}
    };
    return { req, url, timeout: options.timeout };
  }
  async buildHeaders({ options, method, bodyHeaders, retryCount }) {
    let idempotencyHeaders = {};
    if (this.idempotencyHeader && method !== "get") {
      if (!options.idempotencyKey)
        options.idempotencyKey = this.defaultIdempotencyKey();
      idempotencyHeaders[this.idempotencyHeader] = options.idempotencyKey;
    }
    const headers = buildHeaders([
      idempotencyHeaders,
      {
        Accept: "application/json",
        "User-Agent": this.getUserAgent(),
        "X-Stainless-Retry-Count": String(retryCount),
        ...options.timeout ? { "X-Stainless-Timeout": String(Math.trunc(options.timeout / 1e3)) } : {},
        ...getPlatformHeaders(),
        ...this._options.dangerouslyAllowBrowser ? { "anthropic-dangerous-direct-browser-access": "true" } : void 0,
        "anthropic-version": "2023-06-01"
      },
      await this.authHeaders(options),
      this._options.defaultHeaders,
      bodyHeaders,
      options.headers
    ]);
    this.validateHeaders(headers);
    return headers.values;
  }
  _makeAbort(controller) {
    return () => controller.abort();
  }
  buildBody({ options: { body, headers: rawHeaders } }) {
    if (!body) {
      return { bodyHeaders: void 0, body: void 0 };
    }
    const headers = buildHeaders([rawHeaders]);
    if (
      // Pass raw type verbatim
      ArrayBuffer.isView(body) || body instanceof ArrayBuffer || body instanceof DataView || typeof body === "string" && // Preserve legacy string encoding behavior for now
      headers.values.has("content-type") || // `Blob` is superset of `File`
      globalThis.Blob && body instanceof globalThis.Blob || // `FormData` -> `multipart/form-data`
      body instanceof FormData || // `URLSearchParams` -> `application/x-www-form-urlencoded`
      body instanceof URLSearchParams || // Send chunked stream (each chunk has own `length`)
      globalThis.ReadableStream && body instanceof globalThis.ReadableStream
    ) {
      return { bodyHeaders: void 0, body };
    } else if (typeof body === "object" && (Symbol.asyncIterator in body || Symbol.iterator in body && "next" in body && typeof body.next === "function")) {
      return { bodyHeaders: void 0, body: ReadableStreamFrom(body) };
    } else if (typeof body === "object" && headers.values.get("content-type") === "application/x-www-form-urlencoded") {
      return {
        bodyHeaders: { "content-type": "application/x-www-form-urlencoded" },
        body: this.stringifyQuery(body)
      };
    } else {
      return __classPrivateFieldGet(this, _BaseAnthropic_encoder, "f").call(this, { body, headers });
    }
  }
};
_a = BaseAnthropic, _BaseAnthropic_encoder = /* @__PURE__ */ new WeakMap(), _BaseAnthropic_instances = /* @__PURE__ */ new WeakSet(), _BaseAnthropic_baseURLOverridden = function _BaseAnthropic_baseURLOverridden2() {
  return this.baseURL !== "https://api.anthropic.com";
};
BaseAnthropic.Anthropic = _a;
BaseAnthropic.HUMAN_PROMPT = HUMAN_PROMPT;
BaseAnthropic.AI_PROMPT = AI_PROMPT;
BaseAnthropic.DEFAULT_TIMEOUT = 6e5;
BaseAnthropic.AnthropicError = AnthropicError;
BaseAnthropic.APIError = APIError;
BaseAnthropic.APIConnectionError = APIConnectionError;
BaseAnthropic.APIConnectionTimeoutError = APIConnectionTimeoutError;
BaseAnthropic.APIUserAbortError = APIUserAbortError;
BaseAnthropic.NotFoundError = NotFoundError;
BaseAnthropic.ConflictError = ConflictError;
BaseAnthropic.RateLimitError = RateLimitError;
BaseAnthropic.BadRequestError = BadRequestError;
BaseAnthropic.AuthenticationError = AuthenticationError;
BaseAnthropic.InternalServerError = InternalServerError;
BaseAnthropic.PermissionDeniedError = PermissionDeniedError;
BaseAnthropic.UnprocessableEntityError = UnprocessableEntityError;
BaseAnthropic.toFile = toFile;
var Anthropic = class extends BaseAnthropic {
  constructor() {
    super(...arguments);
    this.completions = new Completions(this);
    this.messages = new Messages2(this);
    this.models = new Models2(this);
    this.beta = new Beta(this);
  }
};
Anthropic.Completions = Completions;
Anthropic.Messages = Messages2;
Anthropic.Models = Models2;
Anthropic.Beta = Beta;

// ../../packages/ai/dist/anthropic-provider.js
var RULE_SCHEMA_DOC = `Rules are JSON filters over these columns of a per-customer features table:
- recency_days (int): days since last purchase
- frequency_90d (int): purchases in the last 90 days
- monetary_ltv (number): lifetime spend in rupees
- category_affinity (string): the category they spend most on
- festival_buyer (boolean): bought during a festival window before
- reorder_cadence_days (int, may be null): median days between their purchases
- favorite_item (string): their most-purchased item
Operators: ">", ">=", "<", "<=", "=", "!=", "in" (array), "gte_col"/"lte_col" (compare to another column).
A bare value means equality. Example:
{"recency_days": {">": 60, "<=": 90}, "category_affinity": {"in": ["sweets", "gift-boxes"]}}
Campaign types: winback | festival_preorder | new_item_alert | reorder_reminder.`;
var DEFAULT_MODEL = "claude-opus-4-8";
var CAMPAIGN_INTENT = {
  winback: "A gentle win-back message for customers who haven't visited in a while. Warm, no guilt-tripping.",
  festival_preorder: "A pre-festival message inviting customers to pre-order their festival favorites before the rush.",
  new_item_alert: "A short heads-up about fresh/new items in categories this customer already loves.",
  reorder_reminder: "A friendly reminder that it's about the time they usually restock their favorites."
};
var AnthropicCopyProvider = class {
  name = "anthropic";
  client;
  model;
  constructor(opts) {
    this.client = new Anthropic(opts?.apiKey ? { apiKey: opts.apiKey } : {});
    this.model = opts?.model ?? process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;
  }
  async generateTemplate(req) {
    const system = [
      `You write WhatsApp marketing messages for "${req.shopName}", a small Indian retail shop.`,
      `Brand voice: ${req.brandVoice.tone}. Language: ${req.brandVoice.language}.`,
      req.brandVoice.samplePhrases.length ? `Phrases the shop actually uses: ${req.brandVoice.samplePhrases.join(" | ")}` : "",
      req.brandVoice.avoid.length ? `Never use: ${req.brandVoice.avoid.join(", ")}.` : "",
      "",
      "Rules:",
      "- Write ONE message template, max 300 characters, suitable for WhatsApp.",
      `- Use {{variable}} placeholders from this exact list only: ${req.availableVariables.join(", ")}.`,
      "- Personalize with placeholders instead of concrete customer values.",
      "- No links, no ALL-CAPS, at most one emoji.",
      "- Reply with the template text ONLY \u2014 no quotes, no explanation."
    ].filter(Boolean).join("\n");
    const userMessage = [
      `Campaign type: ${req.campaignType} \u2014 ${CAMPAIGN_INTENT[req.campaignType] ?? ""}`,
      `Audience segment: "${req.segmentName}" (rule: ${JSON.stringify(req.segmentRule)})`,
      req.festival ? `Festival: ${req.festival.name} on ${req.festival.date} (categories: ${req.festival.categories.join(", ")})` : "",
      req.newItems?.length ? `Actually new on the menu (you may name ONE of these in the message): ${req.newItems.map((i) => `${i.name} (${i.category}, \u20B9${i.price})`).join("; ")}` : "",
      "",
      "Representative customers in this audience:",
      ...req.sampleCustomers.map((c) => `- ${c.firstName ?? "(no name)"}: favorite "${c.favoriteItem ?? "?"}", buys ${c.categoryAffinity ?? "?"}, last visit ${c.daysSinceLastVisit} days ago`)
    ].filter(Boolean).join("\n");
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content: userMessage }]
    });
    const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("").trim();
    if (!text)
      throw new Error("copy provider returned empty template");
    return { template: text, provider: this.name, model: response.model };
  }
  async authorSegment(req) {
    const text = await this.ask([
      `You translate a shop owner's plain-language audience description into a segment definition for "${req.context.shopName}".`,
      RULE_SCHEMA_DOC,
      segmentContextBlock(req.context),
      `Reply with JSON ONLY, shaped exactly:`,
      `{"name": "...", "description": "...", "campaignType": "...", "rule": {...}}`,
      `- name: short (<= 40 chars), in the owner's language`,
      `- description: one plain-English sentence stating who matches`,
      `- pick the campaignType that best fits the intent`
    ].join("\n"), `Owner's description: "${req.prompt}"`);
    return parseJson(text);
  }
  async discoverSegments(req) {
    const text = await this.ask([
      `You are a retention analyst for "${req.context.shopName}", a small Indian shop. From the aggregate stats below, propose the most commercially interesting customer segments the owner doesn't already have.`,
      RULE_SCHEMA_DOC,
      segmentContextBlock(req.context),
      `Aggregate stats: ${JSON.stringify(req.stats)}`,
      `Existing segments (do NOT duplicate): ${req.existingSegmentNames.join(", ") || "none"}`,
      `Reply with JSON ONLY: an array of 2-4 objects shaped {"name", "description", "campaignType", "rule"}.`,
      `Favor segments that are actionable (big enough to matter, specific enough to message well).`
    ].join("\n"), "Propose the segments.");
    const proposals = parseJson(text);
    if (!Array.isArray(proposals))
      throw new Error("expected an array of segment proposals");
    return proposals.slice(0, 4);
  }
  async writeCounterPitch(req) {
    const c = req.customer;
    const text = await this.ask([
      `You write ONE short line (max 140 chars) a cashier at "${req.shopName}" says out loud to a customer at the counter.`,
      `Brand voice: ${req.brandVoice.tone}.`,
      `Warm and specific, never pushy, no emoji, no quotes around the line. Reply with the line ONLY.`
    ].join("\n"), [
      `Customer: ${c.firstName ?? "(name unknown)"}, favorite: ${c.favoriteItem ?? "unknown"}, last visit ${c.daysSinceLastVisit ?? "?"} days ago, loyalty balance ${c.loyaltyBalance} points.`,
      `Suggest: ${req.recommendations.map((r) => `${r.item} (${r.reason})`).join("; ") || "nothing specific"}.`,
      req.activeFestival ? `Festival coming up: ${req.activeFestival}.` : ""
    ].filter(Boolean).join("\n"));
    return text.trim();
  }
  /** One system+user round trip, text back. */
  async ask(system, user) {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content: user }]
    });
    return response.content.filter((b) => b.type === "text").map((b) => b.text).join("").trim();
  }
};
function segmentContextBlock(ctx) {
  return [
    `Shop context:`,
    `- categories sold: ${ctx.categories.join(", ") || "unknown"}`,
    `- customer count: ${ctx.totalProfiles}`,
    `- lifetime-spend quartiles (\u20B9): p25=${ctx.ltvQuartiles[0] ?? "?"}, p50=${ctx.ltvQuartiles[1] ?? "?"}, p75=${ctx.ltvQuartiles[2] ?? "?"}, p90=${ctx.ltvQuartiles[3] ?? "?"}`,
    `Use these real numbers when the owner says vague things like "big spenders".`
  ].join("\n");
}
function parseJson(text) {
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const start = cleaned.search(/[[{]/);
  if (start === -1)
    throw new Error("model reply contained no JSON");
  return JSON.parse(cleaned.slice(start));
}

// ../../packages/ai/dist/mock-provider.js
var TEMPLATES = {
  winback: "Namaste {{name}} ji! It's been {{days_since_visit}} days since we saw you at {{shop_name}}. Your favorite {{favorite_item}} is fresh from our kitchen \u2014 show code {{redemption_code}} and treat yourself soon! \u{1FA94}",
  festival_preorder: "Namaste {{name}} ji! {{festival_name}} is coming \u2014 pre-order your {{favorite_item}} and festive {{category}} at {{shop_name}} today, skip the rush. Mention code {{redemption_code}} when you order!",
  new_item_alert: "Namaste {{name}} ji! Fresh new {{category}} just landed at {{shop_name}} \u2014 we think you'll love them as much as your usual {{favorite_item}}. Show code {{redemption_code}} on your next visit!",
  reorder_reminder: "Namaste {{name}} ji! About time to restock your {{favorite_item}}, isn't it? Fresh batch waiting at {{shop_name}} \u2014 show code {{redemption_code}} when you drop by!"
};
var MockCopyProvider = class {
  name = "mock";
  async generateTemplate(req) {
    const template = TEMPLATES[req.campaignType] ?? "Namaste {{name}} ji! We'd love to see you at {{shop_name}} soon.";
    return { template, provider: this.name, model: "mock-template-v1" };
  }
  /**
   * Keyword heuristics over the owner's prompt — deliberately simple, but
   * produces valid rules so the offline demo exercises the same
   * preview/save path as the real provider.
   */
  async authorSegment(req) {
    const p = req.prompt.toLowerCase();
    const rule = {};
    let campaignType = "new_item_alert";
    const parts = [];
    const range = p.match(/(\d+)\s*(?:-|to)\s*(\d+)\s*day/);
    const single = p.match(/(\d+)\s*day/);
    if (range) {
      rule.recency_days = { ">": Number(range[1]), "<=": Number(range[2]) };
      parts.push(`last visit ${range[1]}-${range[2]} days ago`);
      campaignType = "winback";
    } else if (/lapsed|haven'?t (?:visited|been|bought)|miss|inactive|stopped/.test(p)) {
      const days = single ? Number(single[1]) : 60;
      rule.recency_days = { ">": days };
      parts.push(`no visit in ${days}+ days`);
      campaignType = "winback";
    } else if (/regular|frequent|often|loyal|repeat/.test(p)) {
      rule.frequency_90d = { ">=": 3 };
      parts.push("3+ purchases in 90 days");
      campaignType = "reorder_reminder";
    }
    if (/festival|diwali|holi|rakhi|raksha/.test(p)) {
      rule.festival_buyer = true;
      parts.push("bought during festivals before");
      campaignType = "festival_preorder";
    }
    const spend = p.match(/(?:spent|spend|worth|over|above)\D*(\d{3,})/);
    if (spend || /big spender|high value|top customer|vip/.test(p)) {
      const threshold = spend ? Number(spend[1]) : req.context.ltvQuartiles[2] ?? 5e3;
      rule.monetary_ltv = { ">=": threshold };
      parts.push(`lifetime spend \u20B9${threshold}+`);
    }
    const category = req.context.categories.find((c) => p.includes(c.toLowerCase()));
    if (category) {
      rule.category_affinity = category;
      parts.push(`mostly buys ${category}`);
    }
    if (Object.keys(rule).length === 0) {
      rule.recency_days = { "<=": 60 };
      parts.push("active in the last 60 days");
    }
    const name = req.prompt.length <= 40 ? capitalize(req.prompt) : capitalize(req.prompt.slice(0, 37)) + "\u2026";
    return { name, description: `Customers with ${parts.join(", ")}.`, campaignType, rule };
  }
  /** A fixed playbook of retention segments, thresholded by the shop's own quartiles. */
  async discoverSegments(req) {
    const q = req.context.ltvQuartiles;
    const p75 = q[2] ?? 5e3;
    const existing = new Set(req.existingSegmentNames.map((n) => n.toLowerCase()));
    const proposals = [
      {
        name: "High-value, drifting away",
        description: `Customers worth \u20B9${p75}+ lifetime who haven't visited in over a month \u2014 the most expensive customers to lose.`,
        campaignType: "winback",
        rule: { monetary_ltv: { ">=": p75 }, recency_days: { ">": 30, "<=": 120 } }
      },
      {
        name: "Champions",
        description: "Your most frequent recent buyers \u2014 reward them before a competitor does.",
        campaignType: "reorder_reminder",
        rule: { frequency_90d: { ">=": 4 }, recency_days: { "<=": 30 } }
      },
      {
        name: "Festival gifters",
        description: "Festival-window buyers with above-median spend \u2014 prime for a pre-order nudge with gift boxes.",
        campaignType: "festival_preorder",
        rule: { festival_buyer: true, monetary_ltv: { ">=": q[1] ?? 1e3 } }
      },
      {
        name: "One-and-done",
        description: "Tried you once in the last few months and never came back \u2014 a small welcome-back gesture converts these cheaply.",
        campaignType: "winback",
        rule: { frequency_90d: { "<=": 1 }, recency_days: { ">": 21, "<=": 90 } }
      }
    ];
    return proposals.filter((s) => !existing.has(s.name.toLowerCase())).slice(0, 4);
  }
  async writeCounterPitch(req) {
    const c = req.customer;
    const who = c.firstName ? `${c.firstName} ji` : "ji";
    const top = req.recommendations[0];
    const bits = [
      c.favoriteItem ? `Welcome back ${who} \u2014 fresh ${c.favoriteItem} just came out.` : `Welcome back ${who}!`,
      top ? `Do try the ${top.item} today \u2014 ${lc(top.reason)}.` : "",
      req.activeFestival ? `And ${req.activeFestival} is around the corner \u2014 gift boxes are ready.` : "",
      c.loyaltyBalance >= 100 ? `You have ${c.loyaltyBalance} points saved up, by the way.` : ""
    ].filter(Boolean);
    return bits.slice(0, 3).join(" ");
  }
};
function capitalize(s) {
  const t = s.trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}
function lc(s) {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

// ../../packages/ai/dist/index.js
function defaultProvider() {
  return process.env.ANTHROPIC_API_KEY ? new AnthropicCopyProvider() : new MockCopyProvider();
}
async function generateCampaignCopy(req, provider = defaultProvider()) {
  const result = await provider.generateTemplate(req);
  const used = [...result.template.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1]);
  const unknown = used.filter((v) => !req.availableVariables.includes(v));
  if (unknown.length > 0) {
    throw new Error(`template uses variables outside the allowed list: ${unknown.join(", ")}`);
  }
  return { ...result, variables: [...new Set(used)] };
}
function validateProposal(p) {
  if (!p || typeof p.name !== "string" || !p.name.trim()) {
    throw new Error("segment proposal is missing a name");
  }
  if (!ALL_CAMPAIGN_TYPES.includes(p.campaignType)) {
    throw new Error(`segment proposal has unknown campaign type "${p.campaignType}"`);
  }
  if (!p.rule || typeof p.rule !== "object" || Object.keys(p.rule).length === 0) {
    throw new Error("segment proposal has an empty rule");
  }
  return {
    name: p.name.trim().slice(0, 60),
    description: String(p.description ?? "").trim(),
    campaignType: p.campaignType,
    rule: p.rule
  };
}
async function authorSegmentFromPrompt(req, provider = defaultProvider()) {
  return validateProposal(await provider.authorSegment(req));
}
async function discoverSegments(req, provider = defaultProvider()) {
  const raw = await provider.discoverSegments(req);
  const valid = [];
  for (const p of raw) {
    try {
      valid.push(validateProposal(p));
    } catch {
    }
  }
  return valid;
}
async function generateCounterPitch(req, provider = defaultProvider()) {
  const line = (await provider.writeCounterPitch(req)).trim().replace(/^"|"$/g, "");
  return line.slice(0, 220);
}

// ../../packages/jobs/dist/copy-generator.js
var import_dayjs4 = __toESM(require_dayjs_min(), 1);
function makeCopyGenerator() {
  return async (ctx) => {
    const { tenant, segment, sample } = ctx;
    const festival = segment.campaignType === "festival_preorder" ? upcomingFestival(ctx) : void 0;
    const newItems = segment.campaignType === "new_item_alert" ? (await recentMenuItems(tenant.id, 30)).map((m) => ({
      name: m.name,
      category: m.category,
      price: m.price
    })) : void 0;
    const request = {
      shopName: tenant.config.branding.shopName,
      brandVoice: tenant.config.brandVoice,
      campaignType: segment.campaignType,
      segmentName: segment.name,
      segmentRule: segment.rule,
      availableVariables: TEMPLATE_VARIABLES,
      sampleCustomers: sample.map(({ profile, features }) => ({
        firstName: typeof profile.traits.name === "string" ? profile.traits.name.split(" ")[0] : null,
        favoriteItem: features.favoriteItem,
        categoryAffinity: features.categoryAffinity,
        daysSinceLastVisit: features.recencyDays
      })),
      festival,
      newItems
    };
    const copy = await generateCampaignCopy(request);
    const samples = sample.slice(0, 3).map(({ profile, features }) => ({
      profileId: profile.id,
      rendered: renderTemplate(copy.template, variablesForProfile(profile, features, {
        shop_name: tenant.config.branding.shopName,
        redemption_code: `${tenant.config.slug.slice(0, 4).toUpperCase()}-SAMPLE`,
        festival_name: festival?.name ?? ""
      }))
    }));
    return {
      template: copy.template,
      variables: copy.variables,
      samples,
      provider: copy.provider,
      model: copy.model,
      generatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  };
}
function upcomingFestival(ctx) {
  const { tenant } = ctx;
  const active = activeFestivalWindow(tenant, /* @__PURE__ */ new Date());
  const entry = active ? tenant.config.festivals.find((f) => f.name === active.name && f.date === active.date) : (
    // demo path (window bypassed): nearest future festival, else latest past one
    [...tenant.config.festivals].sort((a, b) => a.date.localeCompare(b.date)).find((f) => (0, import_dayjs4.default)(f.date).isAfter((0, import_dayjs4.default)())) ?? tenant.config.festivals[tenant.config.festivals.length - 1]
  );
  return entry ? { name: entry.name, date: entry.date, categories: entry.categories } : void 0;
}

// ../../packages/jobs/dist/counter-card.js
var CACHE_HOURS = 24;
async function buildCounterCard(tenant, profileId, opts = {}) {
  const profile = await getProfile(tenant.id, profileId);
  if (!profile)
    return null;
  const loyalty = loyaltyConfig(tenant.config);
  const balance = await loyaltyBalance(tenant.id, profileId);
  const loyaltyView = {
    balance,
    valueRupees: Math.round(balance * loyalty.pointValueRupees)
  };
  if (!opts.forceRefresh) {
    const cached = await getCachedCounterCard(tenant.id, profileId, CACHE_HOURS);
    if (cached)
      return { ...cached, loyalty: loyaltyView };
  }
  const [{ recommendations, inputs }, featuresArr] = await Promise.all([
    counterRecommendationsFor(tenant, profileId),
    getFeaturesForProfiles(tenant.id, [profileId])
  ]);
  const features = featuresArr[0] ?? null;
  const firstName = typeof profile.traits.name === "string" && profile.traits.name ? profile.traits.name.split(" ")[0] : null;
  const pitch = await generateCounterPitch({
    shopName: tenant.config.branding.shopName,
    brandVoice: tenant.config.brandVoice,
    customer: {
      firstName,
      favoriteItem: features?.favoriteItem ?? null,
      daysSinceLastVisit: features?.recencyDays ?? null,
      loyaltyBalance: balance
    },
    recommendations,
    activeFestival: inputs.festival?.name ?? null
  });
  const card = {
    profileId,
    name: typeof profile.traits.name === "string" ? profile.traits.name : null,
    phone: profile.phone,
    lastVisitDays: features?.recencyDays ?? null,
    favoriteItem: features?.favoriteItem ?? null,
    loyalty: loyaltyView,
    recommendations,
    pitch,
    activeFestival: inputs.festival?.name ?? null,
    computedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  await cacheCounterCard(tenant.id, profileId, card);
  return card;
}

// src/routes/segments.ts
var segmentsRouter = Router5();
async function contextFor(tenant) {
  const stats = await segmentDiscoveryStats(tenant.id);
  return {
    context: {
      shopName: tenant.config.branding.shopName,
      categories: stats.categorySpend.map((c) => c.category),
      ltvQuartiles: stats.ltvQuartiles,
      totalProfiles: stats.totalProfiles
    },
    stats
  };
}
async function previewRule(tenant, rule) {
  const { whereSql, params } = compileRule(rule);
  const audience = await selectAudience(tenant.id, whereSql, params);
  return audience.length;
}
segmentsRouter.get("/segments", async (req, res) => {
  const tenant = req.tenant;
  const segments = await listSegments(tenant.id);
  const items = await Promise.all(
    segments.map(async (s) => ({
      ...s,
      audienceSize: (await audienceForSegment(tenant, s)).length
    }))
  );
  res.json({ segments: items });
});
segmentsRouter.post("/segments/preview", async (req, res) => {
  const tenant = req.tenant;
  const prompt = String(req.body?.prompt ?? "").trim();
  if (!prompt) {
    res.status(400).json({ error: "prompt is required" });
    return;
  }
  try {
    const { context } = await contextFor(tenant);
    const proposal = await authorSegmentFromPrompt({ prompt, context });
    const audienceSize = await previewRule(tenant, proposal.rule);
    res.json({ proposal: { ...proposal, audienceSize } });
  } catch (err) {
    res.status(422).json({
      error: `couldn't turn that into a segment: ${err instanceof Error ? err.message : err}`
    });
  }
});
segmentsRouter.post("/segments/discover", async (req, res) => {
  const tenant = req.tenant;
  const { context, stats } = await contextFor(tenant);
  const existing = await listSegments(tenant.id);
  const proposals = await discoverSegments({
    context,
    stats: {
      recencyBuckets: stats.recencyBuckets,
      categorySpend: stats.categorySpend,
      festivalBuyers: stats.festivalBuyers,
      withCadence: stats.withCadence
    },
    existingSegmentNames: existing.map((s) => s.name)
  });
  const sized = [];
  for (const p of proposals) {
    try {
      sized.push({ ...p, audienceSize: await previewRule(tenant, p.rule) });
    } catch {
    }
  }
  res.json({ proposals: sized });
});
segmentsRouter.post("/segments", async (req, res) => {
  const tenant = req.tenant;
  const { name, description, campaignType, rule, source } = req.body ?? {};
  if (!name || typeof name !== "string") {
    res.status(400).json({ error: "name is required" });
    return;
  }
  if (!ALL_CAMPAIGN_TYPES.includes(campaignType)) {
    res.status(400).json({ error: `campaignType must be one of ${ALL_CAMPAIGN_TYPES.join(", ")}` });
    return;
  }
  try {
    const audienceSize = await previewRule(tenant, rule);
    const segment = await upsertSegment(tenant.id, name.trim().slice(0, 60), rule, campaignType, {
      description: typeof description === "string" ? description : null,
      source: source === "ai_suggested" ? "ai_suggested" : "custom"
    });
    res.json({ segment: { ...segment, audienceSize } });
  } catch (err) {
    res.status(422).json({ error: `invalid rule: ${err instanceof Error ? err.message : err}` });
  }
});
segmentsRouter.post("/segments/:id/run", async (req, res) => {
  const tenant = req.tenant;
  const results = await evaluateTriggersForTenant(tenant, {
    segmentId: req.params.id,
    // The owner explicitly asked — honor intent even outside a festival window.
    ignoreFestivalWindow: true,
    generateCopy: makeCopyGenerator()
  });
  const result = results[0];
  if (!result) {
    res.status(404).json({ error: "segment not found" });
    return;
  }
  res.json({ result });
});
segmentsRouter.delete("/segments/:id", async (req, res) => {
  const tenant = req.tenant;
  const deleted = await deleteSegment(tenant.id, req.params.id);
  if (!deleted) {
    res.status(409).json({
      error: "this segment has campaign history and can't be deleted"
    });
    return;
  }
  res.json({ ok: true });
});

// src/routes/counter.ts
import { Router as Router6 } from "express";
var counterRouter = Router6();
counterRouter.get("/counter", async (req, res) => {
  const tenant = req.tenant;
  const phone = normalizePhone(String(req.query.phone ?? ""));
  if (!phone) {
    res.status(400).json({ error: "valid phone is required (?phone=)" });
    return;
  }
  const profile = await getProfileByPhone(tenant.id, phone);
  if (!profile) {
    res.status(404).json({ error: "no customer with that number yet" });
    return;
  }
  const [card, ledger, recentMessages] = await Promise.all([
    buildCounterCard(tenant, profile.id, { forceRefresh: req.query.refresh === "1" }),
    loyaltyLedger(tenant.id, profile.id, 10),
    directMessagesForProfile(tenant.id, profile.id, 5)
  ]);
  res.json({ card, ledger, recentMessages });
});
counterRouter.post("/counter/new-customer", async (req, res) => {
  const tenant = req.tenant;
  const phone = normalizePhone(String(req.body?.phone ?? ""));
  const name = String(req.body?.name ?? "").trim();
  if (!phone) {
    res.status(400).json({ error: "valid phone is required" });
    return;
  }
  if (!name) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  if (await getProfileByPhone(tenant.id, phone)) {
    res.status(409).json({ error: "a customer with that number already exists \u2014 look them up instead" });
    return;
  }
  const items = Array.isArray(req.body?.items) ? req.body.items.map((it) => ({
    name: String(it.name ?? ""),
    category: String(it.category ?? "uncategorized"),
    qty: Number(it.qty) || 1,
    unitPrice: Number(it.unitPrice) || 0
  })) : [];
  const amount = items.reduce((sum, it) => sum + it.qty * it.unitPrice, 0);
  await ingestNormalizedEvents(tenant, [
    {
      tenantId: tenant.id,
      phone,
      traits: { name },
      locationId: void 0,
      eventType: amount > 0 ? "purchase" : "opt_in",
      items,
      amount,
      ts: /* @__PURE__ */ new Date()
    }
  ]);
  res.json({ phone });
});
counterRouter.post("/loyalty/adjust", async (req, res) => {
  const tenant = req.tenant;
  const profileId = String(req.body?.profileId ?? "");
  const points = Math.round(Number(req.body?.points));
  const reason = String(req.body?.reason ?? "").trim();
  if (!profileId || !Number.isFinite(points) || points === 0 || !reason) {
    res.status(400).json({ error: "profileId, non-zero points, and reason are required" });
    return;
  }
  const profile = await getProfile(tenant.id, profileId);
  if (!profile) {
    res.status(404).json({ error: "customer not found" });
    return;
  }
  const balance = await loyaltyBalance(tenant.id, profileId);
  if (points < 0 && balance + points < 0) {
    res.status(409).json({ error: `only ${balance} points available` });
    return;
  }
  await addLoyaltyPoints(tenant.id, profileId, points, reason);
  res.json({ balance: balance + points });
});
counterRouter.post("/direct-message", async (req, res) => {
  const tenant = req.tenant;
  const profileId = String(req.body?.profileId ?? "");
  const body = String(req.body?.body ?? "").trim();
  if (!profileId || !body) {
    res.status(400).json({ error: "profileId and body are required" });
    return;
  }
  if (body.length > 1e3) {
    res.status(400).json({ error: "message too long (max 1000 chars)" });
    return;
  }
  const profile = await getProfile(tenant.id, profileId);
  if (!profile) {
    res.status(404).json({ error: "customer not found" });
    return;
  }
  const message = await sendDirectMessage(tenant, profile, body, tenant.config.slug);
  if (message.status === "failed") {
    res.status(409).json({ error: "this customer has opted out of messages", message });
    return;
  }
  res.json({ message });
});

// src/routes/menu.ts
import { Router as Router7 } from "express";
var menuRouter = Router7();
menuRouter.get("/menu", async (req, res) => {
  res.json({ items: await listMenuItems(req.tenant.id) });
});
menuRouter.post("/menu", async (req, res) => {
  const tenant = req.tenant;
  const { name, category, price, description, tags, available } = req.body ?? {};
  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  const item = await upsertMenuItem(tenant.id, {
    name: name.trim(),
    category: String(category ?? "uncategorized").trim() || "uncategorized",
    price: Math.max(0, Number(price) || 0),
    description: typeof description === "string" ? description : null,
    tags: Array.isArray(tags) ? tags.map(String) : [],
    available: available !== false
  });
  res.json({ item });
});
menuRouter.patch("/menu/:id/availability", async (req, res) => {
  const tenant = req.tenant;
  await setMenuItemAvailability(tenant.id, req.params.id, Boolean(req.body?.available));
  res.json({ ok: true });
});
menuRouter.delete("/menu/:id", async (req, res) => {
  await deleteMenuItem(req.tenant.id, req.params.id);
  res.json({ ok: true });
});
menuRouter.post("/menu/import-from-history", async (req, res) => {
  res.json(await importMenuFromHistory(req.tenant.id));
});

// src/routes/qr-orders.ts
import { Router as Router8 } from "express";
import QRCode from "qrcode";
var qrOrdersRouter = Router8();
function publicBaseUrl(req) {
  return process.env.PUBLIC_API_URL ?? `${req.protocol}://${req.get("host")}`;
}
function prefilledMessage(tenant, token, name) {
  const template = qrCaptureConfig(tenant.config).messageTemplate ?? "Hi {{shop_name}}! This is {{name}}, adding my order {{token}} to my rewards \u2728";
  return template.replaceAll("{{shop_name}}", tenant.config.branding.shopName).replaceAll("{{name}}", name).replaceAll("{{token}}", token);
}
function waLink(tenant, token, name) {
  const number = tenant.whatsappNumber.replace(/\D/g, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(prefilledMessage(tenant, token, name))}`;
}
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
function namePromptPage(tenant, token) {
  const shop = escapeHtml(tenant.config.branding.shopName);
  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${shop} \u2014 join on WhatsApp</title>
<style>
body{font-family:system-ui,sans-serif;max-width:420px;margin:60px auto;padding:0 20px;color:#2a2420}
h1{font-size:1.3rem}
input{width:100%;padding:12px;font-size:1rem;border:1px solid #ccc;border-radius:8px;margin:12px 0;box-sizing:border-box}
button{width:100%;padding:12px;font-size:1rem;border:none;border-radius:8px;background:#25D366;color:#fff;font-weight:600}
</style></head><body>
<h1>${shop}</h1>
<p>What's your name? We'll use it to greet you on WhatsApp.</p>
<form method="get" action="/q/${encodeURIComponent(token)}">
  <input name="name" placeholder="Your name" required maxlength="80" autofocus>
  <button type="submit">Continue to WhatsApp</button>
</form>
</body></html>`;
}
function qrOrderView(req, tenant, qr) {
  const base = publicBaseUrl(req);
  return {
    ...qr,
    claimUrl: `${base}/q/${qr.token}`,
    qrSvgUrl: `${base}/q/${qr.token}/qr.svg`,
    // Real customers go through claimUrl (the name prompt), not this one —
    // this is just an informational preview for the dashboard.
    waLink: waLink(tenant, qr.token, "there")
  };
}
qrOrdersRouter.post("/qr-orders", async (req, res) => {
  const tenant = req.tenant;
  if (!qrCaptureConfig(tenant.config).enabled) {
    res.status(409).json({ error: "QR capture is disabled for this shop" });
    return;
  }
  const orderRef = String(req.body?.order_ref ?? "").trim();
  const amount = Number(req.body?.amount);
  if (!orderRef || !Number.isFinite(amount) || amount < 0) {
    res.status(400).json({ error: "order_ref and a non-negative amount are required" });
    return;
  }
  const items = Array.isArray(req.body?.items) ? req.body.items.map((it) => ({
    name: String(it.name ?? ""),
    category: String(it.category ?? "uncategorized"),
    qty: Number(it.qty) || 1,
    unitPrice: Number(it.unitPrice) || 0
  })) : [];
  const qr = await createQrOrder({
    tenantId: tenant.id,
    token: generateQrToken(),
    orderRef,
    source: String(req.body?.source ?? "other").toLowerCase(),
    amount,
    items
  });
  res.json({ qrOrder: qrOrderView(req, tenant, qr) });
});
qrOrdersRouter.get("/qr-orders", async (req, res) => {
  const tenant = req.tenant;
  const orders = await listQrOrders(tenant.id, 50);
  res.json({ qrOrders: orders.map((qr) => qrOrderView(req, tenant, qr)) });
});
var qrPublicRouter = Router8();
qrPublicRouter.get("/:token", async (req, res) => {
  const qr = await getQrOrderByToken(String(req.params.token).toUpperCase());
  const tenant = qr && await getTenantById(qr.tenantId);
  if (!qr || !tenant) {
    res.status(404).send("This QR code is not valid.");
    return;
  }
  const name = String(req.query.name ?? "").trim();
  if (!name) {
    res.type("html").send(namePromptPage(tenant, qr.token));
    return;
  }
  res.redirect(302, waLink(tenant, qr.token, name));
});
qrPublicRouter.get("/:token/qr.svg", async (req, res) => {
  const qr = await getQrOrderByToken(String(req.params.token).toUpperCase());
  if (!qr) {
    res.status(404).send("This QR code is not valid.");
    return;
  }
  const svg = await QRCode.toString(`${publicBaseUrl(req)}/q/${qr.token}`, {
    type: "svg",
    margin: 1,
    width: 512
  });
  res.type("image/svg+xml").send(svg);
});

// src/app.ts
var app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.get(
  "/",
  (_req, res) => res.json({
    service: "HPAS API",
    status: "ok",
    docs: "machine API under /v1 (X-API-Key), dashboard API under /v1/app (Bearer)",
    health: "/health"
  })
);
app.get("/health", (_req, res) => res.json({ ok: true }));
app.post("/v1/auth/login", loginHandler);
app.use("/v1/webhooks", webhooksRouter);
app.use("/q", qrPublicRouter);
app.use("/v1/app", sessionAuth, appRouter);
app.use("/v1/app", sessionAuth, ingestRouter);
app.use("/v1/app", sessionAuth, segmentsRouter);
app.use("/v1/app", sessionAuth, counterRouter);
app.use("/v1/app", sessionAuth, menuRouter);
app.use("/v1/app", sessionAuth, qrOrdersRouter);
app.use("/v1", apiKeyAuth, ingestRouter);
app.use("/v1", apiKeyAuth, redemptionsRouter);
app.use("/v1", apiKeyAuth, counterRouter);
app.use("/v1", apiKeyAuth, qrOrdersRouter);
export {
  app as default
};
