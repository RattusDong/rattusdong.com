"use strict";
(() => {
  // src/runtime/vdom.ts
  var SVG_NS = "http://www.w3.org/2000/svg";
  function h(tag, props = {}, children = []) {
    return { tag, props, children };
  }
  function createEl(vnode) {
    const el = document.createElementNS(SVG_NS, vnode.tag);
    for (const k in vnode.props) el.setAttribute(k, String(vnode.props[k]));
    for (const child of vnode.children) el.appendChild(createEl(child));
    vnode.el = el;
    return el;
  }
  function patchProps(el, oldProps, newProps) {
    for (const k in newProps) {
      if (oldProps[k] !== newProps[k]) el.setAttribute(k, String(newProps[k]));
    }
    for (const k in oldProps) {
      if (!(k in newProps)) el.removeAttribute(k);
    }
  }
  function patchChildren(parent, oldCh, newCh) {
    const common = Math.min(oldCh.length, newCh.length);
    for (let i = 0; i < common; i++) patchNode(parent, oldCh[i], newCh[i], i);
    for (let i = oldCh.length; i < newCh.length; i++) {
      parent.appendChild(createEl(newCh[i]));
    }
    for (let i = oldCh.length - 1; i >= newCh.length; i--) {
      if (oldCh[i].el) parent.removeChild(oldCh[i].el);
    }
  }
  function patchNode(parent, oldVNode, newVNode, index) {
    const el = oldVNode.el;
    if (!el) {
      parent.appendChild(createEl(newVNode));
      return;
    }
    if (oldVNode.tag !== newVNode.tag) {
      const fresh = createEl(newVNode);
      parent.replaceChild(fresh, el);
      return;
    }
    newVNode.el = el;
    patchProps(el, oldVNode.props, newVNode.props);
    patchChildren(el, oldVNode.children, newVNode.children);
  }
  function patch(root, oldTree, newTree) {
    patchChildren(root, oldTree, newTree);
  }

  // src/runtime/icon.ts
  function dp(n) {
    return Math.round(n * 1e4) / 1e4;
  }
  var num = (v) => +v || 0;
  var DEG = Math.PI / 180;
  function rotateVec(x, y, angleDeg) {
    const rad = angleDeg * Math.PI / 180;
    return [x * Math.cos(rad) - y * Math.sin(rad), x * Math.sin(rad) + y * Math.cos(rad)];
  }
  function tokenise(src) {
    if (Array.isArray(src)) return src.map(String);
    return String(src).trim().split(/[ \n\t]+/g).filter(Boolean);
  }
  function renderTokens(tokens, ox, oy, boldness, state2, resolver2, out) {
    let i = 0;
    const next = () => tokens[++i] ?? "0";
    const rot = (90 - state2.dir) * DEG;
    const cosR = Math.cos(rot), sinR = Math.sin(rot);
    const toSVG = (lx, ly) => {
      const wx = state2.offx + lx;
      const wy = state2.offy + ly;
      const rx = wx * cosR - wy * sinR;
      const ry = wx * sinR + wy * cosR;
      return [ox + rx * state2.size, oy - ry * state2.size];
    };
    while (i < tokens.length) {
      const op = tokens[i];
      switch (op) {
        case "c":
          state2.color = next();
          break;
        case "w": {
          const wArg = num(next());
          state2.strokeWidth = Math.abs(wArg * state2.size) * (boldness + 1);
          break;
        }
        case "line": {
          const [ax, ay] = toSVG(num(next()), num(next()));
          const [bx, by] = toSVG(num(next()), num(next()));
          out.push(h("line", {
            x1: dp(ax),
            y1: dp(ay),
            x2: dp(bx),
            y2: dp(by),
            stroke: state2.color,
            "stroke-width": dp(state2.strokeWidth),
            "stroke-linecap": "round"
          }));
          state2.penX = bx;
          state2.penY = by;
          break;
        }
        case "cont": {
          const [bx, by] = toSVG(num(next()), num(next()));
          out.push(h("line", {
            x1: dp(state2.penX),
            y1: dp(state2.penY),
            x2: dp(bx),
            y2: dp(by),
            stroke: state2.color,
            "stroke-width": dp(state2.strokeWidth),
            "stroke-linecap": "round"
          }));
          state2.penX = bx;
          state2.penY = by;
          break;
        }
        case "dot": {
          const [cx, cy] = toSVG(num(next()), num(next()));
          out.push(h("circle", { cx: dp(cx), cy: dp(cy), r: dp(state2.strokeWidth / 2), fill: state2.color }));
          break;
        }
        case "move":
          state2.offx += num(next());
          state2.offy += num(next());
          break;
        case "back":
          state2.offx = 0;
          state2.offy = 0;
          break;
        case "scale":
          state2.size *= num(next());
          break;
        case "rect": {
          const cx = num(next()), cy = num(next());
          const hw = num(next()), hh = num(next());
          const [lx, ty] = toSVG(cx - hw, cy + hh);
          const [rx, by] = toSVG(cx + hw, cy - hh);
          const w = Math.abs(rx - lx), hgt = Math.abs(by - ty);
          const x = Math.min(lx, rx), y = Math.min(ty, by);
          out.push(h("rect", { x: dp(x), y: dp(y), width: dp(w), height: dp(hgt), fill: state2.color }));
          break;
        }
        case "square": {
          const cx = num(next()), cy = num(next());
          const hw = num(next()), hh = num(next());
          const corners = [
            toSVG(cx + hw, cy + hh),
            toSVG(cx - hw, cy + hh),
            toSVG(cx - hw, cy - hh),
            toSVG(cx + hw, cy - hh)
          ];
          const pts = [...corners, corners[0]].map((v) => `${dp(v[0])},${dp(v[1])}`).join(" ");
          out.push(h("polyline", {
            points: pts,
            stroke: state2.color,
            "stroke-width": dp(state2.strokeWidth),
            "stroke-linejoin": "round",
            "stroke-linecap": "round",
            fill: "none"
          }));
          break;
        }
        case "tri": {
          const [x1, y1] = toSVG(num(next()), num(next()));
          const [x2, y2] = toSVG(num(next()), num(next()));
          const [x3, y3] = toSVG(num(next()), num(next()));
          out.push(h("polygon", { points: `${dp(x1)},${dp(y1)} ${dp(x2)},${dp(y2)} ${dp(x3)},${dp(y3)}`, fill: state2.color }));
          break;
        }
        case "cutcircle": {
          const cx = num(next()), cy = num(next());
          const radius = num(next());
          const dir = num(next());
          const arcDeg = num(next());
          let angleDeg = dir * 10 - arcDeg;
          const steps = Math.floor(arcDeg / 3);
          const pts = [];
          {
            const px = cx + Math.round(Math.sin(Math.PI * angleDeg / 180) * 1e10) / 1e10 * radius;
            const py = cy + Math.round(Math.cos(Math.PI * angleDeg / 180) * 1e10) / 1e10 * radius;
            const [sx2, sy2] = toSVG(px, py);
            pts.push(`M${dp(sx2)},${dp(sy2)}`);
          }
          for (let a = steps; a >= 0.5; a--) {
            angleDeg += 6;
            const px = cx + Math.round(Math.sin(Math.PI * angleDeg / 180) * 1e10) / 1e10 * radius;
            const py = cy + Math.round(Math.cos(Math.PI * angleDeg / 180) * 1e10) / 1e10 * radius;
            const [sx2, sy2] = toSVG(px, py);
            pts.push(`L${dp(sx2)},${dp(sy2)}`);
          }
          out.push(h("path", {
            d: pts.join(""),
            stroke: state2.color,
            "stroke-width": dp(state2.strokeWidth),
            fill: "none",
            "stroke-linecap": "round",
            "stroke-linejoin": "round"
          }));
          break;
        }
        case "ellipse": {
          const elCx = num(next()), elCy = num(next());
          const rx = num(next());
          const mult = num(next());
          const rot2 = num(next());
          const [ccx, ccy] = toSVG(elCx, elCy);
          const ellipseRotDeg = 90 - rot2;
          const pts = [];
          let eli = 0;
          {
            const lx = Math.round(Math.sin(Math.PI * eli / 180) * 1e10) / 1e10 * rx;
            const ly = Math.round(Math.cos(Math.PI * eli / 180) * 1e10) / 1e10 * rx * mult;
            const [rx2, ry2] = rotateVec(lx * state2.size, ly * state2.size, ellipseRotDeg);
            pts.push(`M${dp(ccx + rx2)},${dp(ccy - ry2)}`);
          }
          for (let a = 180; a >= 0.5; a--) {
            eli += 4;
            const lx = Math.round(Math.sin(Math.PI * eli / 180) * 1e10) / 1e10 * rx;
            const ly = Math.round(Math.cos(Math.PI * eli / 180) * 1e10) / 1e10 * rx * mult;
            const [drx, dry] = rotateVec(lx * state2.size, ly * state2.size, ellipseRotDeg);
            pts.push(`L${dp(ccx + drx)},${dp(ccy - dry)}`);
          }
          pts.push("Z");
          out.push(h("path", { d: pts.join(""), stroke: state2.color, "stroke-width": dp(state2.strokeWidth), fill: "none" }));
          break;
        }
        case "curve": {
          const rawX1 = next();
          if (rawX1 === "res") break;
          let x1 = num(rawX1), y1 = num(next());
          let x2 = num(next()), y2 = num(next());
          const cpx = num(next()), cpy = num(next());
          const cx1 = cpx - x1, cy1 = cpy - y1;
          const cx2 = cpx - x2, cy2 = cpy - y2;
          x2 = cpx;
          y2 = cpy;
          const res = Math.min(1e4, Math.round(state2.size * 50));
          const [startX, startY] = toSVG(x1, y1);
          const pts = [`M${dp(startX)},${dp(startY)}`];
          for (let step = 1; step <= res; step++) {
            x1 += cx1 / res;
            y1 += cy1 / res;
            x2 -= cx2 / res;
            y2 -= cy2 / res;
            const per = step / res;
            const midX = (x2 - x1) * per + x1;
            const midY = (y2 - y1) * per + y1;
            const [sx2, sy2] = toSVG(midX, midY);
            pts.push(`L${dp(sx2)},${dp(sy2)}`);
          }
          out.push(h("path", {
            d: pts.join(""),
            stroke: state2.color,
            "stroke-width": dp(state2.strokeWidth),
            fill: "none",
            "stroke-linecap": "round",
            "stroke-linejoin": "round"
          }));
          break;
        }
        case "icn": {
          if (!resolver2) {
            next();
            next();
            next();
            next();
            break;
          }
          const name = next();
          const subScale = num(next()) * state2.size;
          const subOx = num(next()), subOy = num(next());
          const resolved = resolver2(name);
          if (resolved !== void 0) {
            const [sox, soy] = toSVG(subOx, subOy);
            renderTokens(
              tokenise(resolved),
              sox,
              soy,
              boldness,
              { ...state2, size: subScale, offx: 0, offy: 0 },
              resolver2,
              out
            );
          }
          break;
        }
        case "ricn": {
          const inlineStr = next();
          const subScale = num(next()) * state2.size;
          const subOx = num(next()), subOy = num(next());
          const [sox, soy] = toSVG(subOx, subOy);
          renderTokens(
            tokenise(inlineStr),
            sox,
            soy,
            boldness,
            { ...state2, size: subScale, offx: 0, offy: 0 },
            resolver2,
            out
          );
          break;
        }
      }
      i++;
    }
  }
  function iconToVNodes(iconString, options = {}) {
    const {
      ox = 0,
      oy = 0,
      size = 1,
      color = "#ffffff",
      strokeWidth = 1,
      boldness = 0,
      direction = 90,
      resolver: resolver2
    } = options;
    const state2 = {
      penX: ox,
      penY: oy,
      color,
      strokeWidth,
      offx: 0,
      offy: 0,
      size,
      dir: direction
    };
    const out = [];
    renderTokens(tokenise(iconString), ox, oy, boldness, state2, resolver2, out);
    return out;
  }

  // src/runtime/font.ts
  var FONT = { "0": "w 5.53 line 10 5 20 5 cont 25 10.25 cont 25 31.25 cont 20 36.5 cont 10 36.5 cont 5 31.25 cont 5 10.25 cont 10 5 line 10 10.25 20 31.25", "1": "w 5.53 line 15 5 15 36.5 line 25 5 5 5 line 15 36.5 5 26", "2": "w 5.53 line 10 36.5 20 36.5 line 10 36.5 5 31.25 line 20 36.5 25 31.25 cont 25 26 line 5 5 25 5 line 25 26 5 5", "3": "w 5.53 line 5 10.25 10 5 cont 20 5 line 25 31.25 20 36.5 cont 10 36.5 cont 5 31.25 line 20 20.75 25 26 line 20 20.75 15 20.75 line 25 10.25 20 5 line 25 10.25 25 15.5 cont 20 20.75 line 25 26 25 31.25", "4": "w 5.53 line 10 36.5 5 15.5 cont 25 15.5 line 15 20.75 15 5", "5": "w 5.53 line 25 36.5 5 36.5 cont 5 26 cont 20 26 cont 25 20.75 cont 25 10.25 cont 20 5 cont 10 5 cont 5 10.25", "6": "w 5.53 line 25 31.25 20 36.5 cont 10 36.5 cont 5 31.25 cont 5 10.25 cont 10 5 cont 20 5 cont 25 10.25 cont 25 15.5 cont 20 20.75 cont 5 20.75", "7": "w 5.53 line 5 36.5 25 36.5 line 15 20.75 25 36.5 line 15 20.75 15 5", "8": "w 5.53 line 20 36.5 10 36.5 line 10 5 20 5 line 20 20.75 10 20.75 cont 5 15.5 cont 5 10.25 cont 10 5 line 20 5 25 10.25 cont 25 15.5 cont 20 20.75 cont 25 26 cont 25 31.25 cont 20 36.5 line 10 36.5 5 31.25 cont 5 26 cont 10 20.75", "9": "w 5.53 line 10 5 20 5 cont 25 10.25 cont 25 31.25 cont 20 36.5 cont 10 36.5 cont 5 31.25 cont 5 26 cont 10 20.75 line 25 20.75 10 20.75 line 10 5 5 10.25", "\n": "", "\r": "", " ": "w 5.53", "!": "w 5.53 line 15 36.5 15 15.5 dot 15 5", '"': "w 5.53 line 10 36.5 10 31.25 line 20 36.5 20 31.25", "#": "w 5.53 line 5 15.5 25 15.5 line 5 26 25 26 line 20 36.5 20 5 line 10 5 10 36.5", "$": "w 5.53 line 25 31.25 10 31.25 cont 5 26 cont 10 20.75 cont 20 20.75 cont 25 15.5 cont 20 10.25 cont 5 10.25 line 15 5 15 36.5", "%": "w 5.53 line 25 10.25 20 10.25 cont 20 5 cont 25 5 cont 25 10.25 line 25 36.5 5 5 line 5 36.5 5 31.25 line 10 36.5 10 31.25 cont 5 31.25 line 10 36.5 5 36.5", "&": "w 5.53 line 10 36.5 15 36.5 line 10 36.5 5 31.25 cont 5 26 cont 10 20.75 cont 15 20.75 cont 20 26 cont 20 31.25 cont 15 36.5 line 10 20.75 25 5 line 10 5 15 5 cont 25 15.5 line 10 20.75 5 15.5 cont 5 10.25 cont 10 5", "'": "w 5.53 line 15 36.5 15 31.25", "(": "cutcircle 34 21 24 -9 42", ")": "cutcircle -4 21 24 9 42", "*": "w 5.53 line 10 26 20 31.25 line 20 26 10 31.25 line 15 36.5 15 20.75", "+": "w 5.53 line 5 20.75 25 20.75 line 15 10.25 15 31.25", ",": "w 5.53 line 15 5 10 -0.25", "-": "w 5.53 line 5 20.75 25 20.75", ".": "w 5.53 dot 15 5", "/": "w 5.53 line 5 5 25 36.5", ":": "w 5.53 dot 15 31.25 dot 15 10.25", ";": "w 5.53 line 15 10.25 10 5 dot 15 31.25", "<": "w 5.53 line 20 10.25 10 20.75 cont 20 31.25", "=": "w 5.53 line 5 26 25 26 line 5 15.5 25 15.5", ">": "w 5.53 line 10 10.25 20 20.75 cont 10 31.25", "?": "w 5.53 line 5 31.25 10 36.5 cont 20 36.5 cont 25 31.25 cont 25 26 dot 15 5 line 15 15.5 25 26", "@": "w 5.53 line 25 10.25 20 5 cont 10 5 cont 5 10.25 cont 5 31.25 cont 10 36.5 cont 20 36.5 cont 25 31.25 cont 25 26 cont 20 20.75 cont 15 15.5 cont 10 20.75 cont 15 26 cont 20 20.75", "A": "w 5.53 line 25 20.75 5 20.75 cont 5 5 line 25 5 25 20.75 cont 15 36.5 cont 5 20.75", "B": "w 5.53 line 5 5 5 36.5 cont 20 36.5 cont 25 31.25 cont 25 26 cont 20 20.75 cont 25 15.5 cont 25 10.25 cont 20 5 cont 5 5 line 5 20.75 20 20.75", "C": "w 5.53 line 10 5 5 10.25 cont 5 31.25 cont 10 36.5 line 20 36.5 10 36.5 line 20 5 10 5 line 20 5 25 10.25 line 20 36.5 25 31.25", "D": "w 5.53 line 5 5 5 36.5 cont 20 36.5 cont 25 31.25 cont 25 10.25 cont 20 5 cont 5 5", "E": "w 5.53 line 5 5 5 36.5 cont 25 36.5 line 5 5 25 5 line 15 20.75 5 20.75", "F": "w 5.53 line 5 5 5 36.5 cont 25 36.5 line 15 20.75 5 20.75", "G": "w 5.53 line 25 31.25 20 36.5 cont 10 36.5 cont 5 31.25 cont 5 10.25 cont 10 5 cont 20 5 cont 25 10.25 cont 25 20.75 cont 15 20.75", "H": "w 5.53 line 25 36.5 25 5 line 5 36.5 5 5 line 5 20.75 25 20.75", "I": "w 5.53 line 25 36.5 5 36.5 line 15 36.5 15 5 line 25 5 5 5", "J": "w 5.53 line 10 5 5 10.25 line 25 10.25 25 36.5 line 25 10.25 20 5 cont 10 5", "K": "w 5.53 line 5 36.5 5 5 line 5 20.75 15 20.75 cont 25 5 line 25 36.5 10 20.75", "L": "w 5.53 line 5 36.5 5 5 cont 25 5", "M": "w 5.53 line 5 5 5 36.5 line 25 36.5 25 5 line 5 36.5 15 20.75 cont 25 36.5", "N": "w 5.53 line 5 5 5 36.5 cont 25 5 cont 25 36.5", "O": "w 5.53 line 10 5 20 5 line 20 36.5 10 36.5 cont 5 31.25 line 5 10.25 5 31.25 line 5 10.25 10 5 line 20 5 25 10.25 cont 25 31.25 cont 20 36.5", "P": "w 5.53 line 5 5 5 36.5 cont 20 36.5 cont 25 31.25 cont 25 26 cont 20 20.75 cont 5 20.75", "Q": "w 5.53 line 20 36.5 10 36.5 cont 5 31.25 cont 5 10.25 cont 10 5 cont 15 5 cont 25 15.5 cont 25 31.25 cont 20 36.5 line 25 5 15 15.5", "R": "w 5.53 line 5 5 5 36.5 line 20 36.5 5 36.5 line 20 36.5 25 31.25 cont 25 26 cont 20 20.75 cont 5 20.75 cont 25 5", "S": "w 5.53 line 10 36.5 25 36.5 line 10 36.5 5 31.25 cont 5 26 cont 10 20.75 cont 20 20.75 cont 25 15.5 cont 25 10.25 cont 20 5 cont 5 5", "T": "w 5.53 line 5 36.5 25 36.5 line 15 36.5 15 5", "U": "w 5.53 line 5 36.5 5 10.25 cont 10 5 line 20 5 10 5 line 20 5 25 10.25 cont 25 36.5", "V": "w 5.53 line 5 36.5 15 5 cont 25 36.5", "W": "w 5.53 line 5 36.5 5 5 cont 15 15.5 cont 25 5 cont 25 36.5", "X": "w 5.53 line 5 36.5 25 5 line 25 36.5 5 5", "Y": "w 5.53 line 5 36.5 15 20.75 line 25 36.5 15 20.75 cont 15 5", "Z": "w 5.53 line 5 36.5 25 36.5 line 5 5 25 36.5 line 25 5 5 5", "[": "w 5.53 line 20 5 10 5 cont 10 37 cont 20 37", "\\": "w 5.53 line 5 36.5 25 5", "]": "w 5.53 line 10 5 20 5 cont 20 37 cont 10 37", "^": "w 5.53 line 10 26 15 36.5 line 20 26 15 36.5", "_": "w 5.53 line 5 0 25 0", "`": "w 5.53 line 15 36.5 20 31.25", "a": "w 5.53 line 5 10.25 10 5 cont 25 5 cont 25 20.75 cont 20 26 line 10 26 20 26 line 5 10.25 10 15.5 line 20 15.5 25 10.25 line 20 15.5 10 15.5", "b": "w 5.53 line 5 5 5 36.5 line 5 5 20 5 cont 25 10.25 cont 25 15.5 cont 20 20.75 cont 10 20.75 cont 5 15.5", "c": "w 5.53 line 25 10.25 20 5 cont 10 5 cont 5 10.25 cont 5 20.75 cont 10 26 cont 20 26 cont 25 20.75", "d": "w 5.53 line 10 5 25 5 cont 25 36.5 line 10 5 5 10.25 cont 5 15.5 cont 10 20.75 line 20 20.75 25 15.5 line 20 20.75 10 20.75", "e": "w 5.53 line 10 5 20 5 line 10 5 5 10.25 line 5 15.5 20 15.5 cont 25 20.75 cont 20 26 cont 10 26 line 5 20.75 5 10.25 line 5 20.75 10 26", "f": "w 5.53 line 15 31.25 15 5 line 10 20.75 20 20.75 line 20 31.25 15 31.25", "g": "w 5.53 line 5 -0.25 10 -5.5 cont 20 -5.5 cont 25 -0.25 cont 25 26 line 10 26 25 26 line 10 26 5 20.75 cont 5 15.5 cont 10 10.25 cont 25 10.25", "h": "w 5.53 line 5 5 5 36.5 line 25 15.5 25 5 line 20 20.75 10 20.75 cont 5 15.5 line 20 20.75 25 15.5", "i": "w 5.53 line 15 20.75 15 5 line 15 20.75 10 20.75 dot 15 31.25 line 20 5 10 5", "j": "w 5.53 line 15 -5 10 -5 cont 6 -1 line 15 -5 15 20.75 dot 15 31.25", "k": "w 5.53 line 5 5 5 36.5 line 5 15.5 10 15.5 cont 20 5 line 20 26 5 15.5", "l": "w 5.53 line 10 5 20 5 line 15 5 15 31.25 cont 10 31.25", "m": "w 5.53 line 5 20.75 10 26 line 5 20.75 5 5 line 10 26 15 20.75 cont 15 15.5 line 15 20.75 20 26 cont 25 20.75 cont 25 5", "n": "w 5.53 line 5 5 5 26 cont 20 26 cont 25 20.75 cont 25 5", "o": "w 5.53 line 10 5 20 5 line 20 26 10 26 line 5 20.75 5 10.25 line 25 20.75 25 10.25 line 20 26 25 20.75 line 10 26 5 20.75 line 5 10.25 10 5 line 20 5 25 10.25", "p": "w 5.53 line 20 26 5 26 line 20 26 25 20.75 cont 25 15.5 cont 20 10.25 line 5 10.25 20 10.25 line 5 -5.5 5 26", "q": "w 5.53 line 25 -5.5 25 26 line 25 10.25 10 10.25 line 25 26 10 26 cont 5 20.75 cont 5 15.5 cont 10 10.25", "r": "w 5.53 line 5 26 5 5 line 5 20.75 10 26 line 20 26 10 26", "s": "w 5.53 line 10 26 25 26 line 10 26 5 20.75 cont 10 15.5 cont 20 15.5 cont 25 10.25 cont 20 5 cont 5 5", "t": "w 5.53 line 20 26 10 26 line 15 10.25 15 31.25 line 15 10.25 20 5", "u": "w 5.53 line 5 10.25 10 5 cont 20 5 cont 25 10.25 line 25 26 25 10.25 line 5 26 5 10.25", "v": "w 5.53 line 5 26 15 5 line 25 26 15 5", "w": "w 5.53 line 10 5 15 10.25 cont 20 5 line 25 26 20 5 line 5 26 10 5", "x": "w 5.53 line 5 5 25 26 line 25 5 5 26", "y": "w 5.53 line 5 -5.5 25 26 line 15 10.25 5 26", "z": "w 5.53 line 5 5 25 5 line 25 26 5 26 line 5 5 25 26", "{": "line 14 3 10 6 cont 10 37 cont 14 40 line 10 20 0 20", "|": "line 5 0 5 45", "}": "line 14 3 18 6 cont 18 37 cont 14 40 line 28 20 18 20", "~": "w 5.53 line 5 20.75 10 26 cont 20 15.5 cont 25 20.75", "\xA1": "line 15 30 15 5 square 15 40 1 1", "\xA2": "line 20 10 5 10 cont 5 30 cont 20 30 line 14 5 14 35", "\xA3": "line 5 5 25 5 line 10 5 10 35 cont 15 40 cont 20 40 line 5 20 20 20", "\xA4": "w 3 cutcircle 15 22 8 0 180 line 21 16 25 12 line 5 32 9 28 line 9 16 5 12 line 25 32 21 28", "\xA5": "line 15 5 15 20 cont 5 40 line 15 20 25 40 line 10 15 20 15 line 10 10 20 10", "\xA6": "line 15 40 15 26 line 15 5 15 19", "\xA7": "line 5 10 10 5 cont 20 5 cont 25 10 cont 7 20 cont 7 25 cont 13 28 line 25 35 20 40 cont 10 40 cont 5 35 cont 23 25 cont 23 20 cont 16 16", "\xA8": "square 7 30 1 1 square 23 30 1 1", "\xA9": "w 2 cutcircle 15 20 15 0 180 cutcircle 15 20 7 -9 120", "\xAA": "line 30 20 5 20 cont 5 35 cont 10 40 cont 25 40 cont 25 20", "\xAB": "line 15 33 5 25 cont 15 17 line 25 33 15 25 cont 25 17", "\xAC": "line 5 25 25 25 cont 25 10", "\xAE": "cutcircle 15 20 15 0 180 line 5 5 5 40 cont 25 40 cont 25 20 cont 15 20 cont 25 5", "\xB0": "cutcircle 15 30 8 0 180", "\xB1": "line 15 20 15 30 line 5 25 25 25 line 5 5 5 25", "\xB4": "line 10 35 20 40", "\xB5": "line 5 5 5 40 line 5 20 25 20 cont 25 40", "\xB6": "line 18 5 18 40 line 25 5 25 40 w 7 square 10 30 7 7 square 10 30 2 2", "\xBB": "line 5 33 15 25 cont 5 17 line 15 33 25 25 cont 15 17", "\xBC": "line 10 40 10 30 line 5 20 25 30 line 22 5 22 18 cont 22 10 cont 15 10 cont 15 18", "\xBD": "line 10 40 10 30 line 5 20 25 30 line 22 5 15 5 cont 15 10 cont 22 13 cont 22 18 cont 15 18", "\xBE": "line 7 40 13 40 cont 13 34 cont 7 34 cont 13 34 cont 13 28 cont 7 28 line 5 19 25 26 line 22 5 22 16 cont 22 10 cont 15 10 cont 15 16", "\xBF": "line 5 5 20 5 cont 20 23 cont 5 23 cont 5 30 dot 5 40", "\xD1": "line 5 50 10 53 cont 20 47 cont 25 50 line 25 40 25 5 cont 5 40 cont 5 5", "\xE4": "w 5.53 line 10 5 25 5 line 10 5 5 10.25 line 10 15.5 5 10.25 line 10 15.5 20 15.5 cont 25 10.25 line 25 20.75 25 5 line 25 20.75 20 26 cont 10 26 dot 10 31.25 dot 20 31.25", "\xE8": "line 25 5 5 5 cont 5 25 cont 25 25 cont 25 15 cont 15 15 line 18 32 13 36", "\xE9": "line 25 5 5 5 cont 5 25 cont 25 25 cont 25 15 cont 15 15 line 13 32 18 36", "\xEA": "line 25 5 5 5 cont 5 25 cont 25 25 cont 25 15 cont 15 15 line 5 33 15 40 cont 25 33", "\xEB": "line 25 5 5 5 cont 5 25 cont 25 25 cont 25 15 cont 15 15 dot 10 32 dot 20 32", "\xF1": "line 5 34 10 37 cont 20 31 cont 25 34 line 5 5 5 25 cont 25 25 cont 25 5", "\xF6": "w 5.53 line 10 5 20 5 line 20 26 10 26 line 5 20.75 5 10.25 line 25 10.25 25 20.75 line 20 26 25 20.75 line 25 10.25 20 5 line 10 5 5 10.25 line 5 20.75 10 26 dot 10 31.25 dot 20 31.25", "\xF7": "line 5 15 25 15 square 15 25 1 1 square 15 5 1 1", "\xFC": "w 5.53 line 20 5 10 5 cont 5 10.25 line 5 26 5 10.25 line 20 5 25 10.25 cont 25 26 dot 20 31.25 dot 10 31.25", "\u0250": "line 0 25 25 25 cont 25 10 cont 20 5 cont 5 5 cont 5 25", "\u03C0": "line 5 20 25 20 line 10 5 10 20 line 20 20 20 8 cont 25 5", "\u0410": "line 5 5 17.5 40 cont 30 5 line 10 15 25 15", "\u0412": "line 22 25 25 30 cont 25 40 cont 5 40 cont 5 5 cont 25 5 cont 25 20 cont 22 25 cont 5 25", "\u0413": "line 5 5 5 35 cont 25 35", "\u0415": "line 25 40 5 40 cont 5 5 cont 25 5 line 5 22 25 22", "\u0418": "line 5 40 5 5 cont 25 40 cont 25 5", "\u041C": "line 5 5 5 40 cont 15 20 cont 25 40 cont 25 5", "\u041D": "line 5 40 5 5 line 5 20 25 20 line 25 5 25 40", "\u041E": "line 5 5 25 5 cont 25 40 cont 5 40 cont 5 5", "\u041F": "line 5 5 5 40 cont 25 40 cont 25 5", "\u0420": "line 5 5 5 40 cont 25 40 cont 25 20 cont 5 20", "\u0422": "line 15 5 15 40 line 5 40 25 40", "\u0425": "line 5 5 25 40 line 25 5 5 40", "\u042F": "line 25 5 25 40 cont 5 40 cont 5 20 cont 15 20 cont 5 5", "\u0430": "line 25 15 10 15 cont 6 12 cont 6 5 cont 25 5 cont 25 22 cont 22 25 cont 6 25", "\u0432": "line 22 15 25 18 cont 25 25 cont 5 25 cont 5 5 cont 25 5 cont 25 12 cont 22 15 cont 5 15", "\u0433": "line 5 5 5 25 cont 25 25", "\u0435": "line 25 5 5 5 cont 5 25 cont 25 26 cont 25 15 cont 15 15", "\u0438": "line 5 25 5 5 cont 25 25 cont 25 5", "\u043C": "line 5 5 5 25 cont 15 20 cont 25 25 cont 25 5", "\u043E": "line 5 25 25 25 cont 25 5 cont 5 5 cont 5 25", "\u043F": "line 5 5 5 40 cont 25 25 cont 25 5", "\u0440": "line 5 -10 5 25 cont 25 25 cont 25 5 cont 5 5", "\u0442": "line 15 5 15 25 line 5 25 25 25", "\u0445": "line 5 5 25 25 line 25 5 5 25", "\u0585": "line 5 25 25 25 cont 25 5 cont 5 5 cont 5 25", "\u14DA": "w 6 line 10 5 25 5 w 3 cutcircle 10 10 5 -9 90", "\u15E2": "w 6 line 5 35 15 30 cont 25 35 w 4 cutcircle -4 30 30 11 30 cutcircle 34 30 30 -11 30", "\u160F": "w 4 cutcircle 10.7 10 5 15 90 cutcircle 30 18 26 -9 21 cutcircle 14.5 25 9 0 70 cutcircle -20.3 16 45 9 14", "\u2013": "line 1 20 29 20", "\u2019": "line 5 30 15 40", "\u201C": "w 5.53 line 15 36.5 10 31.25 line 25 36.5 20 31.25", "\u201D": "w 5.53 line 10 31.25 5 36.5 line 20 31.25 15 36.5", "\u2020": "line 15 15 15 40 line 10 30 20 30", "\u2021": "line 15 15 15 30 line 10 20 20 20 line 10 25 20 25", "\u2022": "w 10 dot 15 20", "\u203C": "line 5 40 5 15 dot 5 5 line 25 40 25 15 dot 25 5", "\u2049": "line 5 40 5 15 dot 5 5 line 15 40 25 40 cont 25 22 cont 15 22 cont 15 15 dot 15 5", "\u20AC": "line 25 10 20 5 cont 15 5 cont 10 10 cont 10 35 cont 15 40 cont 20 40 cont 25 35 line 5 17 17 17 line 5 27 17 27", "\u2122": "w 3 line 5 40 10 40 line 7.5 40 7.5 30 line 15 30 15 40 cont 20 30 cont 25 40 cont 25 30", "\u2139": "line 15 5 15 25 cont 10 25 line 10 5 20 5 w 7 dot 15 33", "\u214C": "line 5 40 8 35 cont 8 10 cont 12 5 cont 16 10 cont 16 35 cont 20 40 cont 25 35 cont 25 25 cont 20 20 cont 5 20", "\u2192": "line 5 22.5 25 22.5 line 15 15 25 22.5 cont 15 30", "\u2194": "line 5 15 25 15 cont 20 20 cont 20 10 cont 25 15 line 5 15 10 20 cont 10 10 cont 5 15", "\u2195": "line 15 30 15 10 cont 10 15 cont 20 15 cont 15 10 line 15 30 10 25 cont 20 25 cont 15 30", "\u2196": "line 25 5 5 25 cont 5 20 cont 10 25 cont 5 25", "\u2197": "line 5 5 25 25 cont 25 20 cont 20 25 cont 25 25", "\u2198": "line 5 25 25 5 cont 20 5 cont 25 10 cont 25 5", "\u2199": "line 25 25 5 5 cont 10 5 cont 5 10 cont 5 5", "\u2206": "line 5 5 15 30 cont 25 5 cont 5 5", "\u220F": "line 5 40 25 40 line 8 40 8 5 line 22 40 22 5", "\u2211": "line 25 40 5 40 cont 15 20 cont 5 5 cont 25 5", "\u221A": "line 5 15 12 5 cont 17 40 cont 25 40", "\u2248": "line 5 20 10 23 cont 20 17 cont 25 20 line 5 25 10 28 cont 20 22 cont 25 25", "\u2260": "line 5 13 25 13 line 5 27 25 27 line 20 30 10 10", "\u23CF": "square 15 8 10 2 line 7 10 23 10 line 5 20 25 20 cont 15 27 cont 5 20 line 15 22 15 25", "\u23F8": "line 8 25 8 5 line 22 25 22 5", "\u23F9": "square 15 15 14 14 square 15 15 11 11 square 15 15 8 8 square 15 15 5 5 w 10 dot 15 15", "\u23FA": "w 25 dot 15 25", "\u2500": "w 5.53 line 0 20 30 20", "\u2514": "w 5.53 line 15 40 15 20 cont 30 20", "\u251C": "w 5.53 line 15 40 15 5 line 15 20 30 20", "\u25AB": "square 15 15 7 7", "\u25B6": "line 5 5 25 15 cont 5 25 cont 5 5", "\u25C0": "line 25 5 5 15 cont 25 25 cont 25 5", "\u25CF": "w 17 dot 15 25", "\u25FB": "square 15 15 13 13", "\u25FD": "square 15 15 10 10", "\u262E": "cutcircle 15 15 15 0 180 line 15 5 15 25 line 21 9 15 15 cont 9 9", "\u2800": "", "\u2801": "square 10 40 0 0", "\u2802": "square 10 30 0 0", "\u2803": "square 10 40 0 0 square 10 30 0 0", "\u2804": "square 10 20 0 0", "\u2805": "square 10 40 0 0 square 10 20 0 0", "\u2806": "square 10 30 0 0 square 10 20 0 0", "\u2807": "square 10 40 0 0 square 10 30 0 0 square 10 20 0 0", "\u2808": "square 20 40 0 0", "\u2809": "square 10 40 0 0 square 20 40 0 0", "\u280A": "square 10 30 0 0 square 20 40 0 0", "\u280B": "square 10 40 0 0 square 10 30 0 0 square 20 40 0 0", "\u280C": "square 10 20 0 0 square 20 40 0 0", "\u280D": "square 10 40 0 0 square 10 20 0 0 square 20 40 0 0", "\u280E": "square 10 30 0 0 square 10 20 0 0 square 20 40 0 0", "\u280F": "square 10 40 0 0 square 10 30 0 0 square 10 20 0 0 square 20 40 0 0", "\u2810": "square 20 30 0 0", "\u2811": "square 10 40 0 0 square 20 30 0 0", "\u2812": "square 10 30 0 0 square 20 30 0 0", "\u2813": "square 10 40 0 0 square 10 30 0 0 square 20 30 0 0", "\u2814": "square 10 20 0 0 square 20 30 0 0", "\u2815": "square 10 40 0 0 square 10 20 0 0 square 20 30 0 0", "\u2816": "square 10 30 0 0 square 10 20 0 0 square 20 30 0 0", "\u2817": "square 10 40 0 0 square 10 30 0 0 square 10 20 0 0 square 20 30 0 0", "\u2818": "square 20 40 0 0 square 20 30 0 0", "\u2819": "square 10 40 0 0 square 20 40 0 0 square 20 30 0 0", "\u281A": "square 10 30 0 0 square 20 40 0 0 square 20 30 0 0", "\u281B": "square 10 40 0 0 square 10 30 0 0 square 20 40 0 0 square 20 30 0 0", "\u281C": "square 10 20 0 0 square 20 40 0 0 square 20 30 0 0", "\u281D": "square 10 40 0 0 square 10 20 0 0 square 20 40 0 0 square 20 40 0 0", "\u281E": "square 10 30 0 0 square 10 20 0 0 square 20 40 0 0 square 20 30 0 0", "\u281F": "square 10 40 0 0 square 10 30 0 0 square 10 20 0 0 square 20 40 0 0 square 20 30 0 0", "\u2820": "square 20 20 0 0", "\u2821": "square 10 40 0 0 square 20 20 0 0", "\u2822": "square 10 30 0 0 square 20 20 0 0", "\u2823": "square 10 40 0 0 square 10 30 0 0 square 20 20 0 0", "\u2824": "square 10 20 0 0 square 20 20 0 0", "\u2825": "square 10 40 0 0 square 10 20 0 0 square 20 20 0 0", "\u2826": "square 10 30 0 0 square 10 20 0 0 square 20 20 0 0", "\u2827": "square 10 40 0 0 square 10 30 0 0 square 10 20 0 0 square 20 20 0 0", "\u2828": "square 20 40 0 0 square 20 20 0 0", "\u2829": "square 10 40 0 0 square 20 40 0 0 square 20 20 0 0", "\u282A": "square 10 30 0 0 square 20 40 0 0 square 20 20 0 0", "\u282B": "square 10 40 0 0 square 10 30 0 0 square 20 40 0 0 square 20 20 0 0", "\u282C": "square 10 20 0 0 square 20 40 0 0 square 20 20 0 0", "\u282D": "square 10 40 0 0 square 10 20 0 0 square 20 40 0 0 square 20 20 0 0", "\u282E": "square 10 30 0 0 square 10 20 0 0 square 20 40 0 0 square 20 20 0 0", "\u282F": "square 10 40 0 0 square 10 30 0 0 square 10 20 0 0 square 10 10 0 0 square 20 30 0 0", "\u2830": "square 20 30 0 0 square 20 20 0 0", "\u2831": "square 10 40 0 0 square 20 30 0 0 square 20 20 0 0", "\u2832": "square 10 30 0 0 square 20 30 0 0 square 20 20 0 0", "\u2833": "square 10 40 0 0 square 10 30 0 0 square 20 30 0 0 square 20 20 0 0", "\u2834": "square 10 20 0 0 square 20 30 0 0 square 20 20 0 0", "\u2835": "square 10 40 0 0 square 10 20 0 0 square 20 30 0 0 square 20 20 0 0", "\u2836": "square 10 30 0 0 square 10 20 0 0 square 20 30 0 0 square 20 20 0 0", "\u2837": "square 10 40 0 0 square 10 30 0 0 square 10 20 0 0 square 20 30 0 0 square 20 20 0 0", "\u2838": "square 20 40 0 0 square 20 30 0 0 square 20 20 0 0", "\u2839": "square 10 40 0 0 square 20 40 0 0 square 20 30 0 0 square 20 20 0 0", "\u283A": "square 10 30 0 0 square 20 40 0 0 square 20 30 0 0 square 20 20 0 0", "\u283B": "square 10 40 0 0 square 10 30 0 0 square 20 40 0 0 square 20 30 0 0 square 20 20 0 0", "\u283C": "square 10 20 0 0 square 10 10 0 0 square 20 40 0 0 square 20 30 0 0", "\u283D": "square 10 40 0 0 square 10 20 0 0 square 20 40 0 0 square 20 30 0 0 square 20 20 0 0", "\u283E": "square 10 30 0 0 square 10 20 0 0 square 20 40 0 0 square 20 30 0 0 square 20 20 0 0", "\u283F": "square 10 40 0 0 square 10 30 0 0 square 10 20 0 0 square 20 40 0 0 square 20 30 0 0 square 20 20 0 0", "\u2840": "square 10 10 0 0", "\u2841": "square 10 40 0 0 square 10 10 0 0", "\u2842": "square 10 30 0 0 square 10 10 0 0", "\u2843": "square 10 40 0 0 square 10 30 0 0 square 10 10 0 0", "\u2844": "square 10 20 0 0 square 10 10 0 0", "\u2845": "square 10 40 0 0 square 10 20 0 0 square 10 10 0 0", "\u2846": "square 10 30 0 0 square 10 20 0 0 square 10 10 0 0", "\u2847": "square 10 40 0 0 square 10 30 0 0 square 10 20 0 0 square 10 10 0 0", "\u2848": "square 10 10 0 0 square 10 10 0 0", "\u2849": "square 10 40 0 0 square 20 40 0 0 square 10 10 0 0", "\u284A": "square 10 30 0 0 square 20 40 0 0 square 10 10 0 0", "\u284B": "square 10 40 0 0 square 10 30 0 0 square 20 40 0 0 square 10 10 0 0", "\u284C": "square 10 20 0 0 square 20 40 0 0 square 10 10 0 0", "\u284D": "square 10 40 0 0 square 10 20 0 0 square 10 10 0 0 square 20 40 0 0", "\u284E": "square 10 30 0 0 square 10 20 0 0 square 10 10 0 0 square 20 40 0 0", "\u284F": "square 10 40 0 0 square 10 30 0 0 square 10 20 0 0 square 10 10 0 0 square 20 40 0 0", "\u2850": "square 20 30 0 0 square 10 10 0 0", "\u2851": "square 10 40 0 0 square 10 10 0 0 square 20 30 0 0", "\u2852": "square 10 30 0 0 square 20 30 0 0 square 10 10 0 0", "\u2853": "square 10 40 0 0 square 10 30 0 0 square 20 30 0 0 square 10 10 0 0", "\u2854": "square 10 20 0 0 square 10 10 0 0 square 20 30 0 0", "\u2855": "square 10 40 0 0 square 10 20 0 0 square 10 10 0 0 square 20 30 0 0", "\u2856": "square 10 30 0 0 square 10 20 0 0 square 10 10 0 0 square 20 30 0 0", "\u2857": "square 10 40 0 0 square 10 30 0 0 square 10 20 0 0 square 10 10 0 0 square 20 30 0 0", "\u2858": "square 10 10 0 0 square 20 40 0 0 square 20 30 0 0", "\u2859": "square 10 40 0 0 square 10 10 0 0 square 20 40 0 0 square 20 30 0 0", "\u285A": "square 10 30 0 0 square 10 10 0 0 square 20 40 0 0 square 20 30 0 0", "\u285B": "square 10 40 0 0 square 10 30 0 0 square 10 10 0 0 square 20 40 0 0 square 20 30 0 0", "\u285C": "square 10 20 0 0 square 10 10 0 0 square 20 40 0 0 square 20 30 0 0", "\u285D": "square 10 40 0 0 square 10 20 0 0 square 10 10 0 0 square 20 40 0 0 square 20 30 0 0", "\u285E": "square 10 30 0 0 square 10 20 0 0 square 10 10 0 0 square 20 40 0 0 square 20 30 0 0", "\u285F": "square 10 40 0 0 square 10 30 0 0 square 10 20 0 0 square 10 10 0 0 square 20 40 0 0 square 20 30 0 0", "\u2860": "square 10 10 0 0 square 20 20 0 0", "\u2861": "square 10 40 0 0 square 10 10 0 0 square 20 20 0 0", "\u2862": "square 10 30 0 0 square 10 10 0 0 square 20 20 0 0", "\u2863": "square 10 40 0 0 square 10 30 0 0 square 10 10 0 0 square 20 20 0 0", "\u2864": "square 10 20 0 0 square 10 10 0 0 square 20 20 0 0", "\u2865": "square 10 40 0 0 square 10 20 0 0 square 10 10 0 0 square 20 20 0 0", "\u2866": "square 10 30 0 0 square 10 20 0 0 square 10 10 0 0 square 20 20 0 0", "\u2867": "square 10 40 0 0 square 10 30 0 0 square 10 20 0 0 square 10 10 0 0 square 20 20 0 0", "\u2868": "square 10 10 0 0 square 20 40 0 0 square 20 20 0 0", "\u2869": "square 10 40 0 0 square 10 10 0 0 square 20 30 0 0 square 20 20 0 0", "\u286A": "square 10 30 0 0 square 10 10 0 0 square 20 40 0 0 square 20 20 0 0", "\u286B": "square 10 40 0 0 square 10 30 0 0 square 10 10 0 0 square 20 40 0 0 square 20 20 0 0", "\u286C": "square 10 20 0 0 square 10 10 0 0 square 20 40 0 0 square 20 20 0 0", "\u286D": "square 10 40 0 0 square 10 20 0 0 square 10 10 0 0 square 20 40 0 0 square 20 20 0 0", "\u286E": "square 10 30 0 0 square 10 20 0 0 square 10 10 0 0 square 20 40 0 0 square 20 20 0 0", "\u286F": "square 10 40 0 0 square 10 30 0 0 square 10 20 0 0 square 10 10 0 0 square 20 40 0 0 square 20 20 0 0", "\u2870": "square 10 10 0 0 square 20 30 0 0 square 20 20 0 0", "\u2871": "square 10 40 0 0 square 10 10 0 0 square 20 30 0 0 square 20 20 0 0", "\u2872": "square 10 30 0 0 square 10 10 0 0 square 20 30 0 0 square 20 20 0 0", "\u2873": "square 10 40 0 0 square 10 30 0 0 square 10 10 0 0 square 20 30 0 0 square 20 20 0 0", "\u2874": "square 10 20 0 0 square 10 10 0 0 square 20 30 0 0 square 20 20 0 0", "\u2875": "square 10 40 0 0 square 10 20 0 0 square 10 10 0 0 square 20 30 0 0 square 20 20 0 0", "\u2876": "square 10 30 0 0 square 10 20 0 0 square 10 10 0 0 square 20 30 0 0 square 20 20 0 0", "\u2877": "square 10 40 0 0 square 10 30 0 0 square 10 20 0 0 square 10 10 0 0 square 20 30 0 0 square 20 20 0 0", "\u2878": "square 10 10 0 0 square 20 40 0 0 square 20 30 0 0 square 20 20 0 0", "\u2879": "square 10 40 0 0 square 10 10 0 0 square 20 40 0 0 square 20 30 0 0 square 20 20 0 0", "\u287A": "square 10 30 0 0 square 10 10 0 0 square 20 40 0 0 square 20 30 0 0 square 20 20 0 0", "\u287B": "square 10 40 0 0 square 10 30 0 0 square 10 10 0 0 square 20 40 0 0 square 20 30 0 0 square 20 20 0 0", "\u287C": "square 10 20 0 0 square 10 10 0 0 square 20 40 0 0 square 20 30 0 0 square 20 20 0 0", "\u287D": "square 10 40 0 0 square 10 20 0 0 square 10 10 0 0 square 20 40 0 0 square 20 30 0 0 square 20 20 0 0", "\u287E": "square 10 30 0 0 square 10 20 0 0 square 10 10 0 0 square 20 40 0 0 square 20 30 0 0 square 20 20 0 0", "\u287F": "square 10 40 0 0 square 10 30 0 0 square 10 20 0 0 square 10 10 0 0 square 20 40 0 0 square 20 30 0 0 square 20 20 0 0", "\u2880": "square 20 10 0 0", "\u2881": "square 10 40 0 0 square 20 10 0 0", "\u2882": "square 10 30 0 0 square 20 10 0 0", "\u2883": "square 10 40 0 0 square 10 30 0 0 square 20 10 0 0", "\u2884": "square 10 20 0 0 square 20 10 0 0", "\u2885": "square 10 40 0 0 square 10 20 0 0 square 20 10 0 0", "\u2886": "square 10 30 0 0 square 10 20 0 0 square 20 10 0 0", "\u2887": "square 10 40 0 0 square 10 30 0 0 square 10 20 0 0 square 20 10 0 0", "\u2888": "square 20 40 0 0 square 20 10 0 0", "\u2889": "square 10 40 0 0 square 20 40 0 0 square 20 10 0 0", "\u288A": "square 10 30 0 0 square 20 40 0 0 square 20 10 0 0", "\u288B": "square 10 40 0 0 square 10 30 0 0 square 20 40 0 0 square 20 10 0 0", "\u288C": "square 10 20 0 0 square 20 40 0 0 square 20 10 0 0", "\u288D": "square 10 40 0 0 square 10 20 0 0 square 20 40 0 0 square 20 10 0 0", "\u288E": "square 10 30 0 0 square 10 20 0 0 square 20 40 0 0 square 20 10 0 0", "\u288F": "square 10 40 0 0 square 10 30 0 0 square 10 20 0 0 square 20 40 0 0 square 20 10 0 0", "\u2890": "square 20 30 0 0 square 20 10 0 0", "\u2891": "square 10 40 0 0 square 20 30 0 0 square 20 10 0 0", "\u2892": "square 10 30 0 0 square 20 30 0 0 square 20 10 0 0", "\u2893": "square 10 40 0 0 square 10 30 0 0 square 20 30 0 0 square 20 10 0 0", "\u2894": "square 10 20 0 0 square 20 30 0 0 square 20 10 0 0", "\u2895": "square 10 40 0 0 square 10 20 0 0 square 20 30 0 0 square 20 10 0 0", "\u2896": "square 10 30 0 0 square 10 20 0 0 square 20 40 0 0 square 20 10 0 0", "\u2897": "square 10 40 0 0 square 10 30 0 0 square 10 20 0 0 square 20 30 0 0 square 20 10 0 0", "\u2898": "square 20 40 0 0 square 20 30 0 0 square 20 10 0 0", "\u2899": "square 10 40 0 0 square 20 40 0 0 square 20 30 0 0 square 20 10 0 0", "\u289A": "square 10 30 0 0 square 20 40 0 0 square 20 30 0 0 square 20 10 0 0", "\u289B": "square 10 40 0 0 square 10 30 0 0 square 20 40 0 0 square 20 30 0 0 square 20 10 0 0", "\u289C": "square 10 20 0 0 square 20 40 0 0 square 20 30 0 0 square 20 10 0 0", "\u289D": "square 10 40 0 0 square 10 20 0 0 square 10 10 0 0 square 20 40 0 0 square 20 10 0 0", "\u289E": "square 10 30 0 0 square 10 20 0 0 square 20 40 0 0 square 20 30 0 0 square 20 10 0 0", "\u289F": "square 10 40 0 0 square 10 30 0 0 square 10 20 0 0 square 20 40 0 0 square 20 30 0 0 square 20 10 0 0", "\u28A0": "square 20 20 0 0 square 20 10 0 0", "\u28A1": "square 10 40 0 0 square 20 20 0 0 square 20 10 0 0", "\u28A2": "square 10 30 0 0 square 20 20 0 0 square 20 10 0 0", "\u28A3": "square 10 40 0 0 square 10 30 0 0 square 20 20 0 0 square 20 10 0 0", "\u28A4": "square 10 20 0 0 square 20 20 0 0 square 20 10 0 0", "\u28A5": "square 10 40 0 0 square 10 20 0 0 square 20 20 0 0 square 20 10 0 0", "\u28A6": "square 10 30 0 0 square 10 20 0 0 square 20 20 0 0 square 20 10 0 0", "\u28A7": "square 10 40 0 0 square 10 30 0 0 square 10 20 0 0 square 20 20 0 0 square 20 10 0 0", "\u28A8": "square 10 10 0 0 square 20 20 0 0 square 20 10 0 0", "\u28A9": "square 10 40 0 0 square 20 40 0 0 square 20 20 0 0 square 20 10 0 0", "\u28AA": "square 10 30 0 0 square 10 10 0 0 square 20 30 0 0 square 20 10 0 0", "\u28AB": "square 10 40 0 0 square 10 30 0 0 square 20 40 0 0 square 20 20 0 0 square 20 10 0 0", "\u28AC": "square 10 20 0 0 square 20 40 0 0 square 20 20 0 0 square 20 10 0 0", "\u28AD": "square 10 40 0 0 square 10 20 0 0 square 20 40 0 0 square 20 20 0 0 square 20 10 0 0", "\u28AE": "square 10 30 0 0 square 10 20 0 0 square 20 40 0 0 square 20 20 0 0 square 20 10 0 0", "\u28AF": "square 10 40 0 0 square 10 30 0 0 square 10 20 0 0 square 20 40 0 0 square 20 20 0 0 square 20 10 0 0", "\u28B0": "square 20 30 0 0 square 20 20 0 0 square 20 10 0 0", "\u28B1": "square 10 40 0 0 square 20 30 0 0 square 20 20 0 0 square 20 10 0 0", "\u28B2": "square 10 30 0 0 square 20 30 0 0 square 20 20 0 0 square 20 10 0 0", "\u28B3": "square 10 40 0 0 square 10 30 0 0 square 20 30 0 0 square 20 20 0 0 square 20 10 0 0", "\u28B4": "square 10 20 0 0 square 20 30 0 0 square 20 20 0 0 square 20 10 0 0", "\u28B5": "square 10 40 0 0 square 10 20 0 0 square 20 30 0 0 square 20 20 0 0 square 20 10 0 0", "\u28B6": "square 10 30 0 0 square 10 20 0 0 square 20 30 0 0 square 20 20 0 0 square 20 10 0 0", "\u28B7": "square 10 40 0 0 square 10 30 0 0 square 10 20 0 0 square 20 30 0 0 square 20 20 0 0 square 20 10 0 0", "\u28B8": "square 20 40 0 0 square 20 30 0 0 square 20 20 0 0 square 20 10 0 0", "\u28B9": "square 10 40 0 0 square 20 40 0 0 square 20 30 0 0 square 20 20 0 0 square 20 10 0 0", "\u28BA": "square 10 30 0 0 square 20 40 0 0 square 20 30 0 0 square 20 20 0 0 square 20 10 0 0", "\u28BB": "square 10 40 0 0 square 10 30 0 0 square 20 40 0 0 square 20 30 0 0 square 20 20 0 0 square 20 10 0 0", "\u28BC": "square 10 20 0 0 square 20 40 0 0 square 20 30 0 0 square 20 20 0 0 square 20 10 0 0", "\u28BD": "square 10 40 0 0 square 10 20 0 0 square 20 40 0 0 square 20 30 0 0 square 20 20 0 0 square 20 10 0 0", "\u28BE": "square 10 30 0 0 square 10 20 0 0 square 20 40 0 0 square 20 30 0 0 square 20 20 0 0 square 20 10 0 0", "\u28BF": "square 10 40 0 0 square 10 30 0 0 square 10 20 0 0 square 20 40 0 0 square 20 30 0 0 square 20 20 0 0 square 20 10 0 0", "\u28C0": "square 10 10 0 0 square 20 10 0 0", "\u28C1": "square 10 40 0 0 square 20 20 0 0 square 20 10 0 0", "\u28C2": "square 10 30 0 0 square 10 10 0 0 square 20 10 0 0", "\u28C3": "square 10 40 0 0 square 10 30 0 0 square 10 10 0 0 square 20 10 0 0", "\u28C4": "square 10 20 0 0 square 10 10 0 0 square 20 10 0 0", "\u28C5": "square 10 40 0 0 square 10 20 0 0 square 30 40 0 0", "\u28C6": "square 10 30 0 0 square 10 20 0 0 square 10 10 0 0 square 20 10 0 0", "\u28C7": "square 10 40 0 0 square 10 30 0 0 square 10 20 0 0 square 10 10 0 0 square 20 10 0 0", "\u28C8": "square 10 10 0 0 square 20 10 0 0 square 20 40 0 0", "\u28C9": "square 10 40 0 0 square 10 10 0 0 square 20 40 0 0 square 20 10 0 0", "\u28CC": "square 10 20 0 0 square 10 10 0 0 square 20 40 0 0 square 20 10 0 0", "\u28CE": "square 10 30 0 0 square 10 20 0 0 square 10 10 0 0 square 20 40 0 0 square 20 10 0 0", "\u28CF": "square 10 40 0 0 square 10 30 0 0 square 10 20 0 0 square 10 10 0 0 square 20 40 0 0 square 20 10 0 0", "\u28D1": "square 10 40 0 0 square 10 10 0 0 square 20 30 0 0 square 20 10 0 0", "\u28D4": "square 10 20 0 0 square 10 10 0 0 square 20 30 0 0 square 20 10 0 0", "\u28D5": "square 10 40 0 0 square 10 20 0 0 square 10 10 0 0 square 20 30 0 0 square 20 10 0 0", "\u28DB": "square 10 40 0 0 square 10 30 0 0 square 10 10 0 0 square 20 40 0 0 square 20 30 0 0 square 20 10 0 0", "\u28DD": "square 10 40 0 0 square 10 20 0 0 square 10 10 0 0 square 20 40 0 0 square 20 30 0 0 square 20 10 0 0", "\u28DF": "square 10 40 0 0 square 10 30 0 0 square 10 20 0 0 square 10 10 0 0 square 20 40 0 0 square 20 30 0 0 square 20 10 0 0", "\u28E0": "square 10 10 0 0 square 20 10 0 0 square 20 20 0 0", "\u28E1": "square 10 40 0 0 square 10 10 0 0 square 20 20 0 0 square 20 10 0 0", "\u28E4": "square 10 10 0 0 square 10 20 0 0 square 20 10 0 0 square 20 20 0 0", "\u28E5": "square 10 40 0 0 square 10 20 0 0 square 10 10 0 0 square 20 20 0 0 square 20 10 0 0", "\u28E6": "square 10 30 0 0 square 10 20 0 0 square 10 10 0 0 square 20 20 0 0 square 20 10 0 0", "\u28E7": "square 10 40 0 0 square 10 30 0 0 square 10 20 0 0 square 10 10 0 0 square 20 20 0 0 square 20 10 0 0", "\u28EC": "square 20 40 0 0 square 10 20 0 0 square 10 10 0 0 square 20 20 0 0 square 20 10 0 0", "\u28ED": "square 10 40 0 0 square 10 20 0 0 square 10 10 0 0 square 20 40 0 0 square 20 20 0 0 square 20 10 0 0", "\u28EE": "square 10 30 0 0 square 10 20 0 0 square 10 10 0 0 square 20 40 0 0 square 20 20 0 0 square 20 10 0 0", "\u28EF": "square 10 40 0 0 square 10 30 0 0 square 10 20 0 0 square 10 10 0 0 square 20 40 0 0 square 20 20 0 0 square 20 10 0 0", "\u28F0": "square 10 10 0 0 square 20 30 0 0 square 20 20 0 0 square 20 10 0 0", "\u28F1": "square 10 40 0 0 square 10 10 0 0 square 20 30 0 0 square 20 20 0 0 square 20 10 0 0", "\u28F2": "square 10 30 0 0 square 10 10 0 0 square 20 30 0 0 square 20 20 0 0 square 20 10 0 0", "\u28F3": "square 10 40 0 0 square 10 30 0 0 square 10 10 0 0 square 20 30 0 0 square 20 20 0 0 square 20 10 0 0", "\u28F4": "square 10 20 0 0 square 10 10 0 0 square 20 30 0 0 square 20 20 0 0 square 20 10 0 0", "\u28F5": "square 10 40 0 0 square 10 20 0 0 square 10 10 0 0 square 20 30 0 0 square 20 20 0 0 square 20 10 0 0", "\u28F6": "square 10 30 0 0 square 10 20 0 0 square 10 10 0 0 square 20 30 0 0 square 20 20 0 0 square 20 10 0 0", "\u28F7": "square 10 40 0 0 square 10 30 0 0 square 10 20 0 0 square 10 10 0 0 square 20 30 0 0 square 20 20 0 0 square 20 10 0 0", "\u28F8": "square 10 10 0 0 square 20 40 0 0 square 20 30 0 0 square 20 20 0 0 square 20 10 0 0", "\u28F9": "square 10 40 0 0 square 10 10 0 0 square 20 40 0 0 square 20 30 0 0 square 20 20 0 0 square 20 10 0 0", "\u28FA": "square 10 30 0 0 square 10 10 0 0 square 20 40 0 0 square 20 30 0 0 square 20 20 0 0 square 20 10 0 0", "\u28FB": "square 10 40 0 0 square 10 30 0 0 square 10 10 0 0 square 20 40 0 0 square 20 30 0 0 square 20 20 0 0 square 20 10 0 0", "\u28FC": "square 10 20 0 0 square 10 10 0 0 square 20 40 0 0 square 20 30 0 0 square 20 20 0 0 square 20 10 0 0", "\u28FD": "square 10 40 0 0 square 10 20 0 0 square 10 10 0 0 square 20 40 0 0 square 20 30 0 0 square 20 20 0 0 square 20 10 0 0", "\u28FE": "square 10 30 0 0 square 10 20 0 0 square 10 10 0 0 square 20 40 0 0 square 20 30 0 0 square 20 20 0 0 square 20 10 0 0", "\u28FF": "square 10 40 0 0 square 10 30 0 0 square 10 20 0 0 square 10 10 0 0 square 20 40 0 0 square 20 30 0 0 square 20 20 0 0 square 20 10 0 0", "\u{FB500}": "w 5.53 line 5 40 5 5 cont 25 5 cont 5 22.5", "\u{FB501}": "w 5.53 line 5 40 5 5 cont 25 22.5 cont 5 40", "\u{FB502}": "w 5.53 line 5 5 5 40 cont 25 40 cont 5 19", "\u{FB503}": "w 5.53 line 5 40 5 5 cont 25 5 line 5 5 25 22.5 cont 5 22.5", "\u{FB504}": "w 5.53 line 5 5 5 40 line 25 40 25 5 cont 5 22.5 cont 25 40", "\u{FB505}": "w 5.53 line 5 5 5 40 cont 25 40 line 5 40 25 22.5 cont 5 22.5", "\u{FB506}": "w 5.53 line 25 40 5 5 cont 25 5", "\u{FB507}": "w 5.53 line 5 5 25 40 line 5 22.5 25 22.5", "\u{FB508}": "w 5.53 line 5 5 25 40 cont 5 40", "\u{FB509}": "w 5.53 line 25 5 5 40 cont 5 5", "\u{FB50A}": "w 5.53 line 5 40 25 5 cont 25 40", "\u{FB50B}": "w 5.53 line 25 5 5 5 cont 25 40 cont 5 40", "\u{FB50C}": "w 5.53 line 5 40 5 5 cont 25 40 cont 25 5", "\u{FB50D}": "w 5.53 line 5 5 5 40 cont 25 40 w 7.5 dot 15.5 22.5", "\u{FB50E}": "w 5.53 line 5 5 5 40 w 7.5 dot 15.5 22.5", "\u{FB50F}": "w 5.53 line 5 40 5 5 cont 25 5 w 7.5 dot 15.5 22.5", "\u{FB510}": "w 5.53 line 5 5 5 40 cont 25 40 cont 25 5 w 7.5 dot 15 22.5", "\u{FB511}": "w 5.53 line 5 40 25 40 cont 25 5 cont 5 5 w 7.5 dot 15 22.5", "\u{FB512}": "w 5.53 line 10 22.5 10 40", "\u{FB513}": "w 5.53 line 8 10 20 35", "\u{FB514}": "w 5.53 line 8 3 17.5 15 line 17.5 3 8 15", "\u{FB515}": "w 5.53 line 8 3 17.5 15", "\u{FB516}": "w 5.53 line 10 22.5 10 40 cont 20 22.5 cont 20 40" };

  // src/runtime/window.ts
  var state = {
    width: 800,
    height: 600,
    mouseX: 0,
    mouseY: 0,
    mouseDown: false,
    root: null,
    loop: null,
    framerate: 60,
    bgColor: "#000"
  };
  var userIcons = {};
  var resolver = (name) => userIcons[name] ?? FONT[name];
  var imageCache = {};
  function ensureImage(url) {
    let rec = imageCache[url];
    if (rec) return rec;
    rec = { loaded: false, w: 0, h: 0, aspect: null };
    imageCache[url] = rec;
    if (typeof Image !== "undefined") {
      const im = new Image();
      im.onload = () => {
        rec.loaded = true;
        rec.w = im.naturalWidth;
        rec.h = im.naturalHeight;
        if (im.naturalHeight > 0) rec.aspect = im.naturalWidth / im.naturalHeight;
      };
      im.src = url;
    }
    return rec;
  }
  function imageInfo(url, prop) {
    const rec = ensureImage(String(url));
    switch (String(prop)) {
      case "loaded":
        return rec.loaded;
      case "width":
        return rec.w;
      case "height":
        return rec.h;
      default:
        return rec.loaded;
    }
  }
  var cam = { cx: 0, cy: 0, scale: 1 };
  function sx(x) {
    return state.width / 2 + (x - cam.cx) * cam.scale;
  }
  function sy(y) {
    return state.height / 2 - (y - cam.cy) * cam.scale;
  }
  var DEG2 = Math.PI / 180;
  var ctx = {
    buffer: [],
    penColor: "#ffffff",
    curX: 0,
    curY: 0,
    thickness: 1,
    dir: 90,
    opacity: 1,
    brightness: 0,
    reset() {
      this.buffer = [];
      this.penColor = "#ffffff";
      this.curX = 0;
      this.curY = 0;
      this.thickness = 1;
      this.dir = 90;
      this.opacity = 1;
      this.brightness = 0;
      cam.cx = 0;
      cam.cy = 0;
      cam.scale = 1;
    },
    // push a vnode (and its subtree) applying the current graphic effects
    push(v) {
      if (this.opacity < 1 || this.brightness !== 0) applyFx(v, this.opacity, this.brightness);
      this.buffer.push(v);
    },
    color(col) {
      this.penColor = String(col);
    },
    goto(x, y) {
      this.curX = +x || 0;
      this.curY = +y || 0;
    },
    set_x(x) {
      this.curX = +x || 0;
    },
    set_y(y) {
      this.curY = +y || 0;
    },
    // heading system — Scratch convention (0 = up/+y, 90 = right/+x), matching the
    // OSL programs that move via `dir.sin()` for x and `dir.cos()` for y.
    // Icons are rotated by (dir - 90) so the default drawing points right at dir=90.
    direction(d) {
      this.dir = +d || 0;
    },
    turnright(a) {
      this.dir += +a || 0;
    },
    turnleft(a) {
      this.dir -= +a || 0;
    },
    pointat(x, y) {
      const dx = (+x || 0) - this.curX, dy = (+y || 0) - this.curY;
      this.dir = Math.atan2(dx, dy) / DEG2;
    },
    move(dist) {
      const d = +dist || 0;
      this.curX += Math.sin(this.dir * DEG2) * d;
      this.curY += Math.cos(this.dir * DEG2) * d;
    },
    scale(_s) {
    },
    // pen "opacity" <0-100> fades subsequent draws (maps to Go Effect transparency)
    pen(name, val) {
      if (String(name) === "opacity") this.opacity = Math.max(0, Math.min(1, (+val || 0) / 100));
    },
    effect(name, val) {
      const n = String(name);
      if (n === "clear") {
        this.opacity = 1;
        this.brightness = 0;
        return;
      }
      if (n === "transparency" || n === "ghost") {
        this.opacity = Math.max(0, Math.min(1, 1 - (+val || 0) / 100));
        return;
      }
      if (n === "brightness") {
        this.brightness = +val || 0;
        return;
      }
    },
    // camera: maps the world rect [l,r]x[t,b] onto the screen. Everything drawn
    // until `frame "clear"` is offset by the frame centre and scaled to fit.
    frame(a, b, c, d) {
      if (String(a) === "clear" || arguments.length < 4) {
        cam.cx = 0;
        cam.cy = 0;
        cam.scale = 1;
        return;
      }
      const l = +a || 0, t = +b || 0, r = +c || 0, bo = +d || 0;
      const spanX = Math.abs(r - l) || state.width;
      cam.cx = -(l + r) / 2;
      cam.cy = -(t + bo) / 2;
      cam.scale = state.width / spanX;
    },
    // bar <width> <_> <height> <fraction> <colour> — a left-aligned progress bar
    bar(w, _a, hgt, frac, col) {
      const ww = +w || 0, hh = +hgt || 0;
      const f = Math.max(0, Math.min(1, +frac || 0));
      const x0 = sx(this.curX) - ww / 2, y0 = sy(this.curY) - hh / 2;
      this.push(h("rect", { x: x0, y: y0, width: ww, height: hh, fill: this.penColor, rx: hh / 2, ry: hh / 2 }));
      if (f > 0) this.push(h("rect", { x: x0, y: y0, width: ww * f, height: hh, fill: String(col), rx: hh / 2, ry: hh / 2 }));
    },
    rect(w, hgt, rounding) {
      const ww = (+w || 0) + (+rounding || 0) * cam.scale, hh = (+hgt || 0) + (+rounding || 0) * cam.scale;
      const x = sx(this.curX) - ww / 2;
      const y = sy(this.curY) - hh / 2;
      const props = { x, y, width: ww, height: hh, fill: this.penColor };
      const r = +rounding || 0;
      if (r > 0) {
        props.rx = r / 2;
        props.ry = r / 2;
      }
      this.push(h("rect", props));
    },
    icon(iconStr, size) {
      const vnodes = iconToVNodes(iconStr, {
        ox: sx(this.curX),
        oy: sy(this.curY),
        size: (+size || 1) * cam.scale,
        color: this.penColor,
        strokeWidth: 1,
        direction: this.dir,
        // icons rotate with heading; text stays upright
        resolver
      });
      for (const v of vnodes) this.push(v);
    },
    // Text lays glyphs out along the heading and rotates them with it, so text
    // is upright at dir=90 but follows a rotated baseline otherwise.
    text(txt, size) {
      const s = String(txt);
      const sz = +size || 10;
      const dr = this.dir * DEG2;
      const lh = sz * 1.4;
      const ax = Math.sin(dr) * sz, ay = Math.cos(dr) * sz;
      const px = Math.cos(dr) * lh, py = -Math.sin(dr) * lh;
      let lineX = this.curX, lineY = this.curY;
      for (const ch of s) {
        if (ch === "\n") {
          lineX += px;
          lineY += py;
          this.curX = lineX;
          this.curY = lineY;
          continue;
        }
        if (ch === "	") {
          this.curX += ax * 4;
          this.curY += ay * 4;
          continue;
        }
        const glyph = FONT[ch];
        if (glyph) {
          const vnodes = iconToVNodes(glyph, {
            ox: sx(this.curX),
            oy: sy(this.curY - sz * 1.2 / 2),
            size: sz / 30 * cam.scale,
            color: this.penColor,
            strokeWidth: 1,
            direction: this.dir,
            resolver
          });
          for (const v of vnodes) this.push(v);
        }
        this.curX += ax;
        this.curY += ay;
      }
    },
    centext(txt, size) {
      const s = String(txt);
      const sz = +size || 10;
      const dr = this.dir * DEG2;
      const half = s.length * sz / 2;
      const oldX = this.curX;
      const oldY = this.curY;
      this.curX -= Math.sin(dr) * half;
      this.text(s, sz);
      this.curX = oldX;
      this.curY = oldY;
    },
    change(dx, dy) {
      this.curX += +dx || 0;
      this.curY += +dy || 0;
    },
    // anchor to a screen fraction: x = -width/a + c, y = height/b + d  (Go Loc)
    loc(a, b, c, d) {
      const na = +a || 1, nb = +b || 1;
      this.curX = state.width / -na + (+c || 0);
      this.curY = state.height / nb + (+d || 0);
    },
    // draw an image (loaded async via <image href>) centred at the pen, rotated
    // to the heading. A null width/height is auto-computed from the image aspect.
    image(url, w, hgt) {
      const U = String(url);
      const ar = ensureImage(U).aspect || 16 / 9;
      let ww = w == null ? null : +w;
      let hh = hgt == null ? null : +hgt;
      if (ww == null && hh == null) return;
      if (ww == null) ww = hh * ar;
      if (hh == null) hh = ww / ar;
      ww *= cam.scale;
      hh *= cam.scale;
      if (!(ww > 0) || !(hh > 0)) return;
      const cx = sx(this.curX), cy = sy(this.curY);
      const props = {
        href: U,
        x: cx - ww / 2,
        y: cy - hh / 2,
        width: ww,
        height: hh,
        preserveAspectRatio: "none",
        "image-rendering": "pixelated"
      };
      if (this.dir !== 90) {
        const r = Math.round((this.dir - 90) * 100) / 100;
        props.transform = `rotate(${r} ${Math.round(cx * 100) / 100} ${Math.round(cy * 100) / 100})`;
      }
      this.push(h("image", props));
    }
  };
  function applyFx(v, op, brightness) {
    if (op < 1) v.props.opacity = op;
    if (brightness !== 0) {
      const b = Math.max(0, 1 + brightness / 100);
      v.props.style = `${v.props.style || ""}filter:brightness(${Math.round(b * 1e3) / 1e3});`;
    }
    for (const c of v.children) applyFx(c, op, brightness);
  }
  var keys = /* @__PURE__ */ new Set();
  var justKeys = /* @__PURE__ */ new Set();
  function keyDown(name) {
    const k = String(name).toLowerCase();
    if (k === "space") return keys.has(" ") || keys.has("space");
    return keys.has(k);
  }
  function keyPressed(name) {
    const k = String(name).toLowerCase();
    if (k === "space") return justKeys.has(" ") || justKeys.has("space");
    return justKeys.has(k);
  }
  function setTitle(title) {
    if (typeof document !== "undefined") document.title = String(title);
  }
  function resize(w, hgt) {
    if (typeof window === "undefined" || !window.innerWidth) {
      state.width = +w || state.width;
      state.height = +hgt || state.height;
    }
    applySize();
  }
  function syncViewport() {
    if (typeof window !== "undefined" && window.innerWidth) {
      state.width = window.innerWidth;
      state.height = window.innerHeight;
    }
    applySize();
  }
  var windowPkg = {
    Create(setup) {
      if (typeof setup === "function") setup(windowPkg);
    },
    Run(loop) {
      state.loop = loop;
    },
    // PascalCase (osl.go dialect)
    SetTitle: setTitle,
    Resize: resize,
    Goto(_x, _y) {
    },
    Close() {
      state.loop = null;
    },
    Closed() {
      return false;
    },
    MousePressed(_btn) {
      return state.mouseDown;
    },
    MouseJustPressed(_btn) {
      return state.mouseDown;
    },
    // lowercase (packages/window.go dialect used by the app examples)
    setTitle,
    // window.setColor sets the window BACKGROUND (Go OSLwinBgColor), not the pen
    setColor(col) {
      state.bgColor = String(col);
    },
    color() {
      return state.bgColor;
    },
    resize,
    show() {
    },
    hide() {
      if (state.root) state.root.style.display = "none";
    },
    close() {
      state.loop = null;
    },
    minimise() {
    },
    fullscreen() {
    },
    setResizable(_v) {
    },
    keyPressed(key) {
      return keyDown(key);
    },
    on() {
    },
    emit() {
    },
    // target frame rate; the loop is capped to this (default 60)
    get framerate() {
      return state.framerate;
    },
    set framerate(v) {
      const n = +v || 60;
      if (n > 0) state.framerate = n;
    },
    // Dual-form: usable as a value (`window.left`) or a call (`window.left()`).
    get width() {
      return numFn(() => state.width);
    },
    get height() {
      return numFn(() => state.height);
    },
    get left() {
      return numFn(() => state.width / -2);
    },
    get right() {
      return numFn(() => state.width / 2);
    },
    get top() {
      return numFn(() => state.height / 2);
    },
    get bottom() {
      return numFn(() => state.height / -2);
    }
  };
  function numFn(getter) {
    const f = () => getter();
    f.valueOf = () => getter();
    f.toString = () => String(getter());
    return f;
  }
  function trackKey(k, down) {
    const key = k.toLowerCase();
    if (down) {
      if (!keys.has(key)) justKeys.add(key);
      keys.add(key);
    } else keys.delete(key);
  }
  function applySize() {
    const root = state.root;
    if (!root) return;
    root.setAttribute("width", String(state.width));
    root.setAttribute("height", String(state.height));
    root.setAttribute("viewBox", `0 0 ${state.width} ${state.height}`);
  }
  function registerIcon(name, iconStr) {
    userIcons[name] = iconStr;
  }
  function getCtx() {
    return ctx;
  }
  var programScope = null;
  function setScope(scope) {
    programScope = scope;
  }
  var frameCallbacks = [];
  function addFrameCallback(fn) {
    frameCallbacks.push(fn);
  }
  function inputState() {
    return { mouseDown: state.mouseDown, mouseX: state.mouseX, mouseY: state.mouseY, keys: [...keys] };
  }
  function getScope() {
    return programScope;
  }
  function boot() {
    if (typeof document === "undefined") return;
    let root = document.getElementById("osl-root");
    if (!root) {
      root = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      root.setAttribute("id", "osl-root");
      document.body.appendChild(root);
    }
    state.root = root;
    root.style.background = root.style.background || "#000";
    root.style.position = "fixed";
    root.style.top = "0";
    root.style.left = "0";
    syncViewport();
    window.addEventListener("resize", syncViewport);
    const rect = () => root.getBoundingClientRect();
    window.addEventListener("mousemove", (e) => {
      const r = rect();
      const px = (e.clientX - r.left) / r.width * state.width;
      const py = (e.clientY - r.top) / r.height * state.height;
      state.mouseX = px - state.width / 2;
      state.mouseY = state.height / 2 - py;
    });
    window.addEventListener("mousedown", () => {
      state.mouseDown = true;
    });
    window.addEventListener("mouseup", () => {
      state.mouseDown = false;
    });
    window.addEventListener("keydown", (e) => {
      trackKey(e.key, true);
      if (e.code) trackKey(e.code, true);
    });
    window.addEventListener("keyup", (e) => {
      trackKey(e.key, false);
      if (e.code) trackKey(e.code, false);
    });
    let last = 0;
    const frame = (now) => {
      requestAnimationFrame(frame);
      const interval = 1e3 / (state.framerate || 60);
      if (now - last < interval - 1.5) return;
      last = now;
      tick();
    };
    requestAnimationFrame(frame);
  }
  var bootTime = Date.now();
  var prevTree = [];
  var simTimer = null;
  function tick() {
    if (programScope) {
      programScope.mouse_x = state.mouseX;
      programScope.mouse_y = state.mouseY;
      programScope.mouse_down = state.mouseDown;
      programScope.timer = simTimer !== null ? simTimer : (Date.now() - bootTime) / 1e3;
      const wc = programScope.window_colour;
      if (wc != null && wc !== "") state.bgColor = String(wc);
    }
    if (state.root && state.root.style.background !== state.bgColor) state.root.style.background = state.bgColor;
    ctx.reset();
    if (state.loop) {
      try {
        state.loop();
      } catch (err) {
        console.error("OSL mainloop error:", err);
        state.loop = null;
      }
    }
    for (const cb of frameCallbacks) {
      try {
        cb();
      } catch (err) {
        console.error("OSL worker error:", err);
      }
    }
    if (state.root) patch(state.root, prevTree, ctx.buffer);
    prevTree = ctx.buffer;
    justKeys.clear();
  }
  function setInput(inp) {
    if (inp.mouseDown !== void 0) state.mouseDown = inp.mouseDown;
    if (inp.mouseX !== void 0) state.mouseX = inp.mouseX;
    if (inp.mouseY !== void 0) state.mouseY = inp.mouseY;
    if (inp.keysDown) {
      keys.clear();
      for (const k of inp.keysDown) keys.add(k.toLowerCase());
    }
    if (inp.timer !== void 0) simTimer = inp.timer;
  }

  // src/tokenise.ts
  var Tokenise = class {
    tokeniseEscaped(CODE, DELIMITER) {
      try {
        let letter = 0;
        let depth = "";
        let brackets = 0;
        let b_depth = 0;
        let out = [];
        const split = [];
        let escaped = false;
        const len = CODE.length;
        while (letter < len) {
          depth = CODE[letter];
          if (brackets === 0 && !escaped) {
            if (depth === "[" || depth === "{" || depth === "(") b_depth++;
            if (depth === "]" || depth === "}" || depth === ")") b_depth--;
            b_depth = b_depth < 0 ? 0 : b_depth;
          }
          if (depth === '"' && !escaped) {
            brackets = 1 - brackets;
            out.push('"');
          } else if (depth === "\\" && !escaped) {
            escaped = !escaped;
            out.push("\\");
          } else {
            out.push(depth);
            escaped = false;
          }
          letter++;
          if (brackets === 0 && CODE[letter] === DELIMITER && b_depth === 0) {
            split.push(out.join(""));
            out = [];
            letter++;
          }
        }
        split.push(out.join(""));
        return split;
      } catch {
        return [];
      }
    }
    tokeniseLineOSL(code) {
      code = code.replace(
        /("(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`|'(?:[^'\\]|\\.)*')|(?<=[\]"}\w\)])(?:\+\+|\?\?|->|==|!=|<=|>=|[><?+*^%/\-|&])(?=\S)/g,
        (v) => {
          if (v.startsWith('"') || v.startsWith("'") || v.startsWith("`")) return v;
          return ` ${v} `;
        }
      );
      try {
        let letter = 0;
        let depth = "";
        let quotes = 0;
        let squotes = 0;
        let m_comm = 0;
        let b_depth = 0;
        let out = [];
        const split = [];
        let escaped = false;
        const len = code.length;
        while (letter < len) {
          depth = code[letter];
          if (quotes === 0 && squotes === 0 && !escaped) {
            if (depth === "[" || depth === "{" || depth === "(") b_depth++;
            if (depth === "]" || depth === "}" || depth === ")") b_depth--;
            b_depth = b_depth < 0 ? 0 : b_depth;
          }
          if (depth === '"' && !escaped && squotes === 0) quotes = 1 - quotes;
          else if (depth === "'" && !escaped && quotes === 0) squotes = 1 - squotes;
          else if (depth === "/" && code[letter + 1] === "*" && quotes === 0 && squotes === 0) m_comm = 1;
          else if (depth === "*" && code[letter + 1] === "/" && quotes === 0 && squotes === 0 && m_comm === 1) m_comm = 0;
          else if (depth === "\\" && !escaped) escaped = !escaped;
          else escaped = false;
          out.push(depth);
          letter++;
          if (quotes === 0 && squotes === 0 && b_depth === 0 && m_comm === 0 && (code[letter] === " " || code[letter] === ")")) {
            if ([" ", ")"].includes(code[letter]) === false) {
              split.push(depth);
            } else {
              split.push(out.join(""));
            }
            out = [];
            letter++;
          }
        }
        split.push(out.join(""));
        return split;
      } catch (e) {
        console.error("Error in tokeniseLineOSL:", e);
        return [];
      }
    }
    tokeniseLines(CODE) {
      try {
        let letter = 0;
        let depth = "";
        let brackets = 0;
        let b_depth = 0;
        let out = [];
        const split = [];
        let escaped = false;
        const len = CODE.length;
        while (letter < len) {
          depth = CODE[letter];
          if (brackets === 0 && !escaped) {
            if (depth === "[" || depth === "{" || depth === "(") b_depth++;
            if (depth === "]" || depth === "}" || depth === ")") b_depth--;
            b_depth = b_depth < 0 ? 0 : b_depth;
          }
          if (depth === '"' && !escaped) {
            brackets = 1 - brackets;
            out.push('"');
          } else if (depth === "\\" && !escaped) {
            escaped = !escaped;
            out.push("\\");
          } else {
            out.push(depth);
            escaped = false;
          }
          letter++;
          if (brackets === 0 && ["\n", ";"].includes(CODE[letter]) && b_depth === 0) {
            split.push(out.join(""));
            out = [];
            letter++;
          }
        }
        split.push(out.join(""));
        return split;
      } catch {
        return [];
      }
    }
    parseEscaped(str) {
      let result = "";
      for (let i = 0; i < str.length; i++) {
        if (str[i] === "\\") {
          i++;
          const esc = str[i];
          switch (esc) {
            case "n":
              result += "\n";
              break;
            case "t":
              result += "	";
              break;
            case "r":
              result += "\r";
              break;
            case '"':
              result += '"';
              break;
            case "'":
              result += "'";
              break;
            case "\\":
              result += "\\";
              break;
            default:
              result += esc;
          }
        } else {
          result += str[i];
        }
      }
      return result;
    }
    destr(t, e = '"') {
      if ("object" == typeof t || "symbol" == typeof t) return t;
      const n = t + "";
      const r = e + "";
      if (n.startsWith(r) && n.endsWith(r)) {
        const inner = n.substring(1, n.length - 1);
        return this.parseEscaped(inner);
      }
      return t;
    }
    autoTokenise(CODE, DELIMITER) {
      if (CODE.indexOf("\\") !== -1) {
        return this.tokeniseEscaped(CODE, DELIMITER ?? " ");
      } else if (CODE.indexOf('"') !== -1 || CODE.indexOf("[") !== -1 || CODE.indexOf("{") !== -1 || CODE.indexOf("(") !== -1) {
        try {
          let letter = 0;
          let depth = "";
          let brackets = 0;
          let b_depth = 0;
          let out = [];
          const split = [];
          const len = CODE.length;
          while (letter < len) {
            depth = CODE[letter];
            if (depth === '"') {
              brackets = 1 - brackets;
              out.push('"');
            } else {
              out.push(depth);
            }
            if (brackets === 0) {
              if (depth === "[" || depth === "{" || depth === "(") b_depth++;
              if (depth === "]" || depth === "}" || depth === ")") b_depth--;
              b_depth = b_depth < 0 ? 0 : b_depth;
            }
            letter++;
            if (brackets === 0 && CODE[letter] === DELIMITER && b_depth === 0) {
              split.push(out.join(""));
              out = [];
              letter++;
            }
          }
          split.push(out.join(""));
          return split;
        } catch {
          return [];
        }
      } else {
        return CODE.split(DELIMITER ?? " ");
      }
    }
  };

  // src/runtime/index.ts
  var _tok = new Tokenise();
  var hostGlobals = {};
  var DEG3 = Math.PI / 180;
  var protosInstalled = false;
  var saveDir = "";
  var saveKey = (k) => `osl:${saveDir}:${String(k)}`;
  function saveGet(k) {
    try {
      const v = localStorage.getItem(saveKey(k));
      return v == null ? "" : JSON.parse(v);
    } catch {
      return "";
    }
  }
  function saveExists(k) {
    try {
      return localStorage.getItem(saveKey(k)) !== null;
    } catch {
      return false;
    }
  }
  function saveCmd(a, b, c) {
    const op = String(b);
    if (op === "set_directory") {
      saveDir = String(a);
      return;
    }
    if (op === "set") {
      try {
        localStorage.setItem(saveKey(a), JSON.stringify(c));
      } catch {
      }
      return;
    }
    if (op === "get") return saveGet(a);
  }
  var sounds = {};
  function soundCmd(a, b, c) {
    const op = String(b);
    if (op === "load") {
      if (typeof Audio === "undefined") return;
      const au = new Audio(String(a));
      au.preload = "auto";
      sounds[String(c)] = au;
      return;
    }
    const snd = sounds[String(a)];
    if (!snd) return;
    if (op === "start") {
      try {
        snd.currentTime = 0;
        void snd.play().catch(() => {
        });
      } catch {
      }
      return;
    }
    if (op === "stop") {
      try {
        snd.pause();
        snd.currentTime = 0;
      } catch {
      }
      return;
    }
    if (op === "volume") {
      snd.volume = Math.max(0, Math.min(1, +c || 0));
      return;
    }
  }
  function installProtos() {
    if (protosInstalled) return;
    protosInstalled = true;
    const NP = Number.prototype;
    NP.sin = function() {
      return Math.sin(this * DEG3);
    };
    NP.cos = function() {
      return Math.cos(this * DEG3);
    };
    NP.tan = function() {
      return Math.tan(this * DEG3);
    };
    NP.asin = function() {
      return Math.asin(this) / DEG3;
    };
    NP.acos = function() {
      return Math.acos(this) / DEG3;
    };
    NP.atan = function() {
      return Math.atan(this) / DEG3;
    };
    NP.clamp = function(lo, hi) {
      return Math.max(+lo || 0, Math.min(+hi || 0, +this));
    };
    NP.wrap = function(lo, hi) {
      const l = +lo || 0, h2 = +hi || 0;
      return ((+this - l) % (h2 - l + 1) + (h2 - l + 1)) % (h2 - l + 1) + l;
    };
    const AP = Array.prototype;
    AP.getKeys = function() {
      return this.map((_, i) => i + 1);
    };
    AP.insert = function(idx, val) {
      this.splice((+idx || 1) - 1, 0, val);
      return this;
    };
    AP.delete = function(idx) {
      this.splice((+idx || 1) - 1, 1);
      return this;
    };
    const SP = String.prototype;
    SP.isKeyDown = function() {
      return keyDown(this.toString());
    };
    SP.onKeyDown = function() {
      return keyPressed(this.toString());
    };
    SP.oslTokenise = function() {
      return _tok.tokeniseLineOSL(this.toString());
    };
    SP.contains = function(sub) {
      return this.indexOf(String(sub)) !== -1;
    };
    SP.saveExists = function() {
      return saveExists(this.toString());
    };
    SP.saveGet = function() {
      return saveGet(this.toString());
    };
    SP.imageinfo = function(prop) {
      return imageInfo(this.toString(), prop);
    };
    NP.not = function() {
      return !this.valueOf();
    };
    SP.not = function() {
      return !(this.length > 0);
    };
    const BP = Boolean.prototype;
    BP.not = function() {
      return !this.valueOf();
    };
    const OP = Object.prototype;
    if (!OP.getKeys) Object.defineProperty(OP, "getKeys", { value() {
      return Object.keys(this);
    }, enumerable: false });
    if (!OP.getValues) Object.defineProperty(OP, "getValues", { value() {
      return Object.values(this);
    }, enumerable: false });
  }
  function installStd(scope) {
    installProtos();
    const n = (x) => +x || 0;
    const std = {
      abs: (x) => Math.abs(n(x)),
      round: (x) => Math.round(n(x)),
      floor: (x) => Math.floor(n(x)),
      ceil: (x) => Math.ceil(n(x)),
      sqrt: (x) => Math.sqrt(n(x)),
      sin: (x) => Math.sin(n(x) * DEG3),
      cos: (x) => Math.cos(n(x) * DEG3),
      tan: (x) => Math.tan(n(x) * DEG3),
      min: (...a) => Math.min(...a.map(n)),
      max: (...a) => Math.max(...a.map(n)),
      // OSL random is an inclusive integer range (matches Go rand.Intn(hi-lo+1)+lo)
      random: (a, b) => {
        if (b === void 0) return Math.floor(Math.random() * Math.trunc(n(a)));
        const lo = Math.trunc(n(a)), hi = Math.trunc(n(b));
        return lo + Math.floor(Math.random() * (hi - lo + 1));
      },
      dist: (x1, y1, x2, y2) => Math.hypot(n(x2) - n(x1), n(y2) - n(y1)),
      getGamepads: () => typeof navigator !== "undefined" && navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [],
      say: (...a) => console.log(...a),
      save: saveCmd,
      sound: soundCmd,
      // worker({...}): run onframe each frame, oncreate once; self via `this`
      worker: (obj) => {
        if (!obj || typeof obj !== "object") return obj;
        obj.alive = true;
        obj.kill = () => {
          obj.alive = false;
        };
        if (typeof obj.oncreate === "function") {
          try {
            obj.oncreate.call(obj);
          } catch (e) {
            console.error(e);
          }
        }
        if (typeof obj.onframe === "function") {
          addFrameCallback(() => {
            if (obj.alive) obj.onframe.call(obj);
          });
        }
        return obj;
      },
      system_url: typeof location !== "undefined" ? location.href : "",
      error: (m) => {
        throw new Error(String(m));
      },
      typeof: (v) => v === null || v === void 0 ? "null" : Array.isArray(v) ? "array" : typeof v,
      timer: 0
    };
    for (const k in std) scope[k.toLowerCase()] = std[k];
    for (const k in hostGlobals) scope[k.toLowerCase()] = hostGlobals[k];
    for (const t of ["number", "string", "array", "object", "boolean", "any", "auto"]) {
      if (scope[t] === void 0) scope[t] = {};
    }
    const zeroBtn = new Proxy({}, { get: () => ({ pressed: false, value: 0 }) });
    const zeroAxis = new Proxy({}, { get: () => ({ x: 0, y: 0 }) });
    if (scope.gamepad === void 0) scope.gamepad = { buttons: zeroBtn, axes: zeroAxis, haptic() {
    } };
    const ctx2 = getCtx();
    const def = (name, get) => Object.defineProperty(scope, name, { get, configurable: true });
    def("x_position", () => ctx2.curX);
    def("y_position", () => ctx2.curY);
    def("direction", () => ctx2.dir);
  }
  var OSL = {
    window: windowPkg,
    ctx: getCtx,
    registerIcon,
    setScope,
    installStd,
    keyDown,
    iconToVNodes,
    FONT,
    inputState,
    getScope,
    step: tick,
    setInput,
    imageInfo,
    keyPressed,
    installStd,
    // host integration: register extra globals injected into every program's scope
    registerGlobals(obj) {
      Object.assign(hostGlobals, obj);
    },
    tokenise: (s) => _tok.tokeniseLineOSL(String(s))
  };
  globalThis.OSL = OSL;
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => boot());
    } else {
      boot();
    }
  }
  var index_default = OSL;
})();
