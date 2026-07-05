(function(DATA){
function getOSLType(val) { if (val === null || val === undefined) return null; else if (Array.isArray(val)) return "array"; return typeof val }
const clone=function(e){try{if(null===e)return null;if("object"==typeof e){if(Array.isArray(e))return e.map((e=>clone(e)));if(e instanceof RegExp)return new RegExp(e);{let n={};for(let r in e)e.hasOwnProperty(r)&&(n[r]=clone(e[r]));return n}}return e}catch{return JSON.parse(JSON.stringify(e))}};
const merge=function(t,r){if(o === null||r===null)return null;function o(t){return t&&"object"==typeof t&&!Array.isArray(t)}const e={};for(const r in t)Object.prototype.hasOwnProperty.call(t,r)&&(e[r]=t[r]);const c=[{target:e,source:r}];for(;c.length;){const{target:t,source:r}=c.pop();for(const e in r)if(Object.prototype.hasOwnProperty.call(r,e)){const n=r[e];o(n)?(o(t[e])||(t[e]={}),c.push({target:t[e],source:n})):t[e]=n}}return e};
const isPrime = function(n) { if (n <= 1) return false; if (n <= 3) return true; if (n % 2 === 0 || n % 3 === 0) return false; for (let i = 5; i * i <= n; i += 6) { if (n % i === 0 || n % (i + 2) === 0) return false; } return true; };
function osl_maths(left, operator, right) {
  const tleft = typeof left
  const tright = typeof right
  if (tleft === "number" && tright === "number") { switch(operator) { case "+": return left + right; case "-": return left - right; case "*": return left * right; case "/": return left / right; case "%": return left % right; case "^": return left ** right; case "++": return `${left}${right}`; } }
  else if (tleft === "string" || tright === "string") { switch(operator) { case "+": return `${left} ${right}`; case "-": return String(left).replaceAll(String(right), ""); case "++": return `${left}${right}`; } }
  switch(operator) {
    case '+': return (+left || 0) + (+right || 0);
    case '-': return (+left || 0) - (+right || 0);
    case '*': return (+left || 0) * (+right || 0);
    case '/': return (+left || 0) / (+right || 0);
    case '%': return (+left || 0) % (+right || 0);
    case '++': if (tleft === "object" && tright === "object") { if (Array.isArray(left) && Array.isArray(right)) return left.concat(right); else return merge(left,right); } return `${left}${right}`;
    case '??': return left ?? right;
    case 'to': return Array.from({ length: Math.abs(right - left) + 1 }, (_, i) => (left < right ? left + i : left - i))
    default: throw new Error('Unknown math operator: ' + operator);
  }
}
function setVar(name, value) { name = `${name}`; if (inner[name] !== undefined) inner[name] = value; else scope[name.toLowerCase()] = value; }
function getVar(name) { name = `${name}`; if (inner[name] !== undefined) return inner[name]; return scope[name.toLowerCase()]; }
const scope = {};
let inner = scope;
let _si = scope;
const reverse = (r) => Array.isArray(r)?r.slice().reverse():String(r).split("").reverse().join("")
const getCtx = (name) => Object.hasOwn(inner, name) ? inner : scope;
const OSLlen = (v) => (Array.isArray(v) || typeof v === "string") ? v.length : (v && typeof v === "object" ? Object.keys(v).length : 0);
scope.window = OSL.window;
OSL.installStd(scope);
OSL.setScope(scope);
{let n="save_access";getCtx(n)[n]=clone(!(getVar("system_url").contains("embed=")))};
if (getVar("save_access")) {
(function(){const _f=getVar("save");if(typeof _f==="function")return _f("fortniteskibidi@rattusdong","set_directory");const _x=OSL.ctx();const _m=_x["save"];if(typeof _m==="function")_m.call(_x,"fortniteskibidi@rattusdong","set_directory")})();
if ("highscore.txt".saveExists()) {
{let n="highscore";getCtx(n)[n]=clone("highscore.txt".saveGet())};
} else {
(function(){const _f=getVar("save");if(typeof _f==="function")return _f("highscore.txt","set",0);const _x=OSL.ctx();const _m=_x["save"];if(typeof _m==="function")_m.call(_x,"highscore.txt","set",0)})();
{let n="highscore";getCtx(n)[n]=clone(0)};
}
} else {
{let n="highscore";getCtx(n)[n]=clone(0)};
}
{let n="assets";getCtx(n)[n]=clone("https://raw.githubusercontent.com/RattusDong/apps/main/all/fortnite%20skibidi%202024/assets/")};
{let n="shootgun";getCtx(n)[n]=clone((function() {
const _si=inner;inner={};

(function(){const _f=getVar("turnleft");if(typeof _f==="function")return _f(45);const _x=OSL.ctx();const _m=_x["turnleft"];if(typeof _m==="function")_m.call(_x,45)})();
{let n="shotx";getCtx(n)[n]=clone(osl_maths(getVar("window")["left"], "+", osl_maths(osl_maths(180, "+", osl_maths(90, "*", getVar("direction").sin())), "*", getVar("scale"))))};
{let n="shoty";getCtx(n)[n]=clone(osl_maths(osl_maths(90, "*", getVar("direction").cos()), "*", getVar("scale")))};
{let n="shotd";getCtx(n)[n]=clone(osl_maths(getVar("direction"), "+", 180))};
(function(){const _f=getVar("sound");if(typeof _f==="function")return _f("shoot","start",0);const _x=OSL.ctx();const _m=_x["sound"];if(typeof _m==="function")_m.call(_x,"shoot","start",0)})();
if (getVar("contr")) {
void (((_o,_k)=>Array.isArray(_o)?_o[(+_k||0)-1]:(_o==null?undefined:_o[_k]))(getVar("gamepads"),1).haptic({"duration": 300, "weakMagnitude": 0, "strongMagnitude": 0.5}));
}
{let n="ready";getCtx(n)[n]=clone(false)};
{let n="cooldown";getCtx(n)[n]=clone(20)};

inner=_si}))};
setVar("bold_text", function(texts,size,amount){const _si=inner;inner={"texts":texts,"size":size,"amount":amount};
OSL.ctx().change(osl_maths(getVar("amount"), "*", -1),0);
OSL.ctx().change(0,osl_maths(getVar("amount"), "*", -1));
for (let _ = 0; _ < (3); _++) {
for (let _ = 0; _ < (3); _++) {
{let n="x";getCtx(n)[n]=clone(getVar("x_position"))};
OSL.ctx().text(getVar("texts"),getVar("size"));
OSL.ctx().change(0,getVar("amount"));
(function(){const _f=getVar("set_x");if(typeof _f==="function")return _f(getVar("x"));const _x=OSL.ctx();const _m=_x["set_x"];if(typeof _m==="function")_m.call(_x,getVar("x"))})();
};
OSL.ctx().change(0,osl_maths(getVar("amount"), "*", -3));
OSL.ctx().change(getVar("amount"),0);
};
OSL.ctx().change(0,getVar("amount"));
OSL.ctx().change(osl_maths(getVar("amount"), "*", -2),0);

inner=_si});
{let n="scrawling";getCtx(n)[n]=clone(["󻔏", "󻔀", "󻔁", "󻔎", "󻔂", "󻔌", "󻔍", "󻔅", "󻔇", "󻔆", "󻔑", "󻔊", "󻔐", "󻔃", "󻔋", "󻔄"])};
(function(){const _f=getVar("sound");if(typeof _f==="function")return _f(osl_maths(getVar("assets"), "++", "shotgun.mp3"),"load","shoot");const _x=OSL.ctx();const _m=_x["sound"];if(typeof _m==="function")_m.call(_x,osl_maths(getVar("assets"), "++", "shotgun.mp3"),"load","shoot")})();
(function(){const _f=getVar("sound");if(typeof _f==="function")return _f("shoot","volume",0.8);const _x=OSL.ctx();const _m=_x["sound"];if(typeof _m==="function")_m.call(_x,"shoot","volume",0.8)})();
(function(){const _f=getVar("sound");if(typeof _f==="function")return _f(osl_maths(getVar("assets"), "++", "hit.mp3"),"load","kill");const _x=OSL.ctx();const _m=_x["sound"];if(typeof _m==="function")_m.call(_x,osl_maths(getVar("assets"), "++", "hit.mp3"),"load","kill")})();
(function(){const _f=getVar("sound");if(typeof _f==="function")return _f("kill","volume",1);const _x=OSL.ctx();const _m=_x["sound"];if(typeof _m==="function")_m.call(_x,"kill","volume",1)})();
{let n="window";{const val=getVar("window").show();if ((val??"")!==""){getCtx(n)[n]=((typeof val)==="object"&&val!==null)?clone(val):val;}}};
{let n="window";{const val=getVar("window").resize(1600,900);if ((val??"")!==""){getCtx(n)[n]=((typeof val)==="object"&&val!==null)?clone(val):val;}}};
{let n="shottimer";getCtx(n)[n]=clone(0)};
{let n="skibx";getCtx(n)[n]=clone(osl_maths(1000, "+", getVar("random")(200,450)))};
{let n="skiby";getCtx(n)[n]=clone(getVar("random")(-1000,1000))};
{let n="speed";getCtx(n)[n]=clone(2)};
{let n="score";getCtx(n)[n]=clone(0)};
{let n="dead";getCtx(n)[n]=clone(false)};
{let n="dieoff";getCtx(n)[n]=clone(0)};
{let n="click";getCtx(n)[n]=clone(false)};
{let n="sgwidth";getCtx(n)[n]=clone(0)};
{let n="cooldown";getCtx(n)[n]=clone(0)};
{let n="ready";getCtx(n)[n]=clone(false)};
{let n="shotx";getCtx(n)[n]=clone(3000)};
{let n="shoty";getCtx(n)[n]=clone(3000)};
{let n="shotd";getCtx(n)[n]=clone(90)};
{let n="updown";getCtx(n)[n]=clone(0)};
{let n="contr";getCtx(n)[n]=clone(false)};
{let n="clock";getCtx(n)[n]=clone(0)};
{let n="w_speed";getCtx(n)[n]=clone(osl_maths(getVar("window")["width"], "/", 800))};
{let n="h_speed";getCtx(n)[n]=clone(osl_maths(getVar("window")["height"], "/", 450))};
getVar("window").Run(function(){const _si=inner;inner={};{let n="gamepads";getCtx(n)[n]=clone(getVar("getGamepads")())};
if (OSLlen(getVar("gamepads")) > 0) {
{let n="gamepad";getCtx(n)[n]=((_o,_k)=>Array.isArray(_o)?_o[(+_k||0)-1]:(_o==null?undefined:_o[_k]))(getVar("gamepads"),1)};
{let n="contr";getCtx(n)[n]=clone(true)};
}
{const _c = inner; let n="bg_dim";if (Array.isArray(_c[n])) { n=(n|0)-1; } _c[n]=clone([1600, 900])};
{const _c = inner; let n="w";if (Array.isArray(_c[n])) { n=(n|0)-1; } _c[n]=clone(getVar("window")["width"])};
{const _c = inner; let n="h";if (Array.isArray(_c[n])) { n=(n|0)-1; } _c[n]=clone(getVar("window")["height"])};
if (osl_maths(getVar("w"), "/", 1600) < osl_maths(getVar("h"), "/", 900)) {
{let n="scale";getCtx(n)[n]=clone(osl_maths(osl_maths(getVar("h"), "/", 900), "*", 2))};
{let n="w";getCtx(n)[n]=clone(null)};
} else {
{let n="scale";getCtx(n)[n]=clone(osl_maths(osl_maths(getVar("w"), "/", 1600), "*", 2))};
{let n="h";getCtx(n)[n]=clone(null)};
}
if (getVar("window")["height"] > osl_maths(getVar("window")["width"], "/", 1.5)) {
{let n="scale";{const _t=getCtx(n);_t[n]=osl_maths(_t[n], "/", 2)}};
}
OSL.ctx().goto(0,0);
(function(){const _f=getVar("image");if(typeof _f==="function")return _f(osl_maths(getVar("assets"), "++", "background.png"),getVar("w"),getVar("h"));const _x=OSL.ctx();const _m=_x["image"];if(typeof _m==="function")_m.call(_x,osl_maths(getVar("assets"), "++", "background.png"),getVar("w"),getVar("h"))})();
OSL.ctx().goto(osl_maths(getVar("window")["left"], "+", osl_maths(100, "*", getVar("scale"))),osl_maths(osl_maths(-100, "*", getVar("scale")), "+", getVar("dieOff")));
(function(){const _f=getVar("image");if(typeof _f==="function")return _f(osl_maths(getVar("assets"), "++", "jonsey.png"),osl_maths(500, "*", getVar("scale")));const _x=OSL.ctx();const _m=_x["image"];if(typeof _m==="function")_m.call(_x,osl_maths(getVar("assets"), "++", "jonsey.png"),osl_maths(500, "*", getVar("scale")))})();
OSL.ctx().goto(osl_maths(osl_maths(getVar("skibX"), "/", 1000), "*", getVar("window")["right"]),osl_maths(osl_maths(getVar("skibY"), "/", 1200), "*", getVar("window")["top"]));
(function(){const _f=getVar("image");if(typeof _f==="function")return _f(osl_maths(getVar("assets"), "++", "skibidi.png"),osl_maths(80, "*", getVar("scale")),osl_maths(120, "*", getVar("scale")));const _x=OSL.ctx();const _m=_x["image"];if(typeof _m==="function")_m.call(_x,osl_maths(getVar("assets"), "++", "skibidi.png"),osl_maths(80, "*", getVar("scale")),osl_maths(120, "*", getVar("scale")))})();
if ((getVar("dist")(getVar("shotx"),getVar("shoty"),getVar("x_position"),getVar("y_position")) < osl_maths(80, "*", getVar("scale")) && getVar("x_position") < getVar("window")["right"])) {
(function(){const _f=getVar("sound");if(typeof _f==="function")return _f("kill","start",0);const _x=OSL.ctx();const _m=_x["sound"];if(typeof _m==="function")_m.call(_x,"kill","start",0)})();
{let n="skibx";getCtx(n)[n]=clone(osl_maths(1000, "+", getVar("random")(200,450)))};
{let n="speed";{const _t=getCtx(n);_t[n]=osl_maths(_t[n], "+", 0.4)}};
{let n="score";{const _t=getCtx(n);_t[n]=(+_t[n] || 0) + 1}};
if (getVar("contr")) {"/@line"}
if (getVar("score") > getVar("highscore")) {
if (getVar("save_access")) {
(function(){const _f=getVar("save");if(typeof _f==="function")return _f("highscore.txt","set",getVar("score"));const _x=OSL.ctx();const _m=_x["save"];if(typeof _m==="function")_m.call(_x,"highscore.txt","set",getVar("score"))})();
}
{let n="highscore";getCtx(n)[n]=clone(getVar("score"))};
}
{let n="skiby";getCtx(n)[n]=clone(getVar("random")(-1000,1000))};
}
if (getVar("skibX") < -200) {
{let n="dead";getCtx(n)[n]=clone(true)};
}
(function(){const _f=getVar("direction");if(typeof _f==="function")return _f(getVar("shotd"));const _x=OSL.ctx();const _m=_x["direction"];if(typeof _m==="function")_m.call(_x,getVar("shotd"))})();
OSL.ctx().goto(getVar("shotx"),getVar("shoty"));
(function(){const _f=getVar("effect");if(typeof _f==="function")return _f("transparency",osl_maths(osl_maths(0, "+", osl_maths(getVar("cooldown"), "-", 16)), "*", 25));const _x=OSL.ctx();const _m=_x["effect"];if(typeof _m==="function")_m.call(_x,"transparency",osl_maths(osl_maths(0, "+", osl_maths(getVar("cooldown"), "-", 16)), "*", 25))})();
(function(){const _f=getVar("image");if(typeof _f==="function")return _f(osl_maths(getVar("assets"), "++", "shotgunproj.png"),osl_maths(osl_maths(10, "+", osl_maths(getVar("dist")(getVar("shotx"),getVar("shoty"),-250,0), "*", 0.35)), "*", getVar("scale")));const _x=OSL.ctx();const _m=_x["image"];if(typeof _m==="function")_m.call(_x,osl_maths(getVar("assets"), "++", "shotgunproj.png"),osl_maths(osl_maths(10, "+", osl_maths(getVar("dist")(getVar("shotx"),getVar("shoty"),-250,0), "*", 0.35)), "*", getVar("scale")))})();
{let n="shotx";{const _t=getCtx(n);_t[n]=osl_maths(_t[n], "+", osl_maths(osl_maths(-55, "*", osl_maths(osl_maths(getVar("w_speed"), "*", getVar("window")["width"]), "/", 800)), "*", getVar("direction").sin()))}};
{let n="shoty";{const _t=getCtx(n);_t[n]=osl_maths(_t[n], "+", osl_maths(osl_maths(-55, "*", osl_maths(osl_maths(getVar("h_speed"), "*", getVar("window")["height"]), "/", 450)), "*", getVar("direction").cos()))}};
(function(){const _f=getVar("effect");if(typeof _f==="function")return _f("transparency",0);const _x=OSL.ctx();const _m=_x["effect"];if(typeof _m==="function")_m.call(_x,"transparency",0)})();
OSL.ctx().goto(osl_maths(getVar("window")["left"], "+", osl_maths(180, "*", getVar("scale"))),osl_maths(0, "+", getVar("dieOff")));
if (getVar("contr")) {
{let n="stickx";getCtx(n)[n]=clone(((_o,_k)=>Array.isArray(_o)?_o[(+_k||0)-1]:(_o==null?undefined:_o[_k]))(((_o,_k)=>Array.isArray(_o)?_o[(+_k||0)-1]:(_o==null?undefined:_o[_k]))(getVar("gamepads"),1)["axes"],1)["x"])};
{let n="sticky";getCtx(n)[n]=clone(((_o,_k)=>Array.isArray(_o)?_o[(+_k||0)-1]:(_o==null?undefined:_o[_k]))(((_o,_k)=>Array.isArray(_o)?_o[(+_k||0)-1]:(_o==null?undefined:_o[_k]))(getVar("gamepads"),1)["axes"],1)["y"])};
if ((Math.abs((+getVar("stickX") || 0)) < 0.15 && Math.abs((+getVar("stickY") || 0)) < 0.15)) {
{let n="stickx";getCtx(n)[n]=clone(getVar("slx"))};
{let n="sticky";getCtx(n)[n]=clone(getVar("sly"))};
}
OSL.ctx().goto(0,0);
(function(){const _f=getVar("pointat");if(typeof _f==="function")return _f(getVar("stickX"),getVar("stickY"));const _x=OSL.ctx();const _m=_x["pointat"];if(typeof _m==="function")_m.call(_x,getVar("stickX"),getVar("stickY"))})();
OSL.ctx().goto(-230,osl_maths(0, "+", getVar("dieOff")));
{let n="slx";getCtx(n)[n]=clone(getVar("stickX"))};
{let n="sly";getCtx(n)[n]=clone(getVar("stickY"))};
} else {
(function(){const _f=getVar("pointat");if(typeof _f==="function")return _f(getVar("mouse_x"),getVar("mouse_y"));const _x=OSL.ctx();const _m=_x["pointat"];if(typeof _m==="function")_m.call(_x,getVar("mouse_x"),getVar("mouse_y"))})();
}
(function(){const _f=getVar("turnleft");if(typeof _f==="function")return _f(90);const _x=OSL.ctx();const _m=_x["turnleft"];if(typeof _m==="function")_m.call(_x,90)})();
(function(){const _f=getVar("direction");if(typeof _f==="function")return _f(osl_maths(getVar("direction").clamp(-60,60), "+", osl_maths(-10, "+", osl_maths(osl_maths(getVar("cooldown"), "-", 16), "*", -1)).clamp(-14,0)));const _x=OSL.ctx();const _m=_x["direction"];if(typeof _m==="function")_m.call(_x,osl_maths(getVar("direction").clamp(-60,60), "+", osl_maths(-10, "+", osl_maths(osl_maths(getVar("cooldown"), "-", 16), "*", -1)).clamp(-14,0)))})();
(function(){const _f=getVar("turnright");if(typeof _f==="function")return _f(135);const _x=OSL.ctx();const _m=_x["turnright"];if(typeof _m==="function")_m.call(_x,135)})();
(function(){const _f=getVar("image");if(typeof _f==="function")return _f(osl_maths(getVar("assets"), "++", "shotgun.png"),osl_maths(osl_maths(180, "-", getVar("sgwidth")), "*", getVar("scale")));const _x=OSL.ctx();const _m=_x["image"];if(typeof _m==="function")_m.call(_x,osl_maths(getVar("assets"), "++", "shotgun.png"),osl_maths(osl_maths(180, "-", getVar("sgwidth")), "*", getVar("scale")))})();
if (getVar("cooldown") > 8) {
(function(){const _f=getVar("effect");if(typeof _f==="function")return _f("transparency",osl_maths(osl_maths(0, "+", osl_maths(getVar("cooldown"), "-", 14)), "*", -16));const _x=OSL.ctx();const _m=_x["effect"];if(typeof _m==="function")_m.call(_x,"transparency",osl_maths(osl_maths(0, "+", osl_maths(getVar("cooldown"), "-", 14)), "*", -16))})();
(function(){const _f=getVar("image");if(typeof _f==="function")return _f(osl_maths(getVar("assets"), "++", "shotgunshoot.png"),osl_maths(310, "*", getVar("scale")),osl_maths(320, "*", getVar("scale")));const _x=OSL.ctx();const _m=_x["image"];if(typeof _m==="function")_m.call(_x,osl_maths(getVar("assets"), "++", "shotgunshoot.png"),osl_maths(310, "*", getVar("scale")),osl_maths(320, "*", getVar("scale")))})();
}
(function(){const _f=getVar("effect");if(typeof _f==="function")return _f("transparency",0);const _x=OSL.ctx();const _m=_x["effect"];if(typeof _m==="function")_m.call(_x,"transparency",0)})();
if (((getVar("mouse_down") || ((_o,_k)=>Array.isArray(_o)?_o[(+_k||0)-1]:(_o==null?undefined:_o[_k]))(getVar("gamepad")["buttons"],8).pressed) && getVar("cooldown") <= 0)) {
{let n="sgwidth";getCtx(n)[n]=clone(osl_maths(getVar("sgwidth"), "+", 1).clamp(0,10))};
if (String(getVar("sgwidth") ?? "").toLowerCase() == String(8 ?? "").toLowerCase()) {
if (getVar("contr")) {
void (((_o,_k)=>Array.isArray(_o)?_o[(+_k||0)-1]:(_o==null?undefined:_o[_k]))(getVar("gamepads"),1).haptic({"duration": 600, "weakMagnitude": 0.05, "strongMagnitude": 0}));
}
{let n="ready";getCtx(n)[n]=clone(true)};
}
} else {
{let n="sgwidth";getCtx(n)[n]=clone(0)};
}
if (getVar("contr")) {
if (((!(((_o,_k)=>Array.isArray(_o)?_o[(+_k||0)-1]:(_o==null?undefined:_o[_k]))(getVar("gamepad")["buttons"],8).pressed) && getVar("ready")) && !(getVar("dead")))) {
getVar("shootgun")();
}
} else if (((!(getVar("mouse_down")) && getVar("ready")) && !(getVar("dead")))) {
getVar("shootgun")();
}
(function(){const _f=getVar("direction");if(typeof _f==="function")return _f(90);const _x=OSL.ctx();const _m=_x["direction"];if(typeof _m==="function")_m.call(_x,90)})();
OSL.ctx().goto(0,getVar("window")["top"]);
{const _pc=OSL.ctx().penColor;OSL.ctx().color("#333");OSL.ctx().rect(375,160,20);OSL.ctx().penColor=_pc;}
OSL.ctx().goto(0,osl_maths(getVar("window")["top"], "-", 30));
{const _pc=OSL.ctx().penColor;OSL.ctx().color("#fff");OSL.ctx().centext(osl_maths("Skibidi Kills: ", "++", getVar("score")),20);OSL.ctx().penColor=_pc;}
OSL.ctx().change(0,-30);
OSL.ctx().centext(osl_maths("Highest: ", "++", getVar("highscore")),14);
{let n="cooldown";{const _t=getCtx(n);_t[n]=osl_maths(_t[n], "-", 1)}};
if (getVar("dead")) {
OSL.ctx().goto(0,-150);
(function(){const _f=getVar("effect");if(typeof _f==="function")return _f("transparency",osl_maths(30, "+", osl_maths(Math.abs((+osl_maths(getVar("clock"), "*", 2.5).sin() || 0)), "*", 50)));const _x=OSL.ctx();const _m=_x["effect"];if(typeof _m==="function")_m.call(_x,"transparency",osl_maths(30, "+", osl_maths(Math.abs((+osl_maths(getVar("clock"), "*", 2.5).sin() || 0)), "*", 50)))})();
(function(){const _f=getVar("image");if(typeof _f==="function")return _f(osl_maths(getVar("assets"), "++", "fire.png"),osl_maths(900, "*", getVar("scale")),osl_maths(500, "*", getVar("scale")));const _x=OSL.ctx();const _m=_x["image"];if(typeof _m==="function")_m.call(_x,osl_maths(getVar("assets"), "++", "fire.png"),osl_maths(900, "*", getVar("scale")),osl_maths(500, "*", getVar("scale")))})();
(function(){const _f=getVar("effect");if(typeof _f==="function")return _f("transparency",0);const _x=OSL.ctx();const _m=_x["effect"];if(typeof _m==="function")_m.call(_x,"transparency",0)})();
OSL.ctx().goto(-425,0);
{let n="rtxt";getCtx(n)[n]=clone(osl_maths(osl_maths(osl_maths(osl_maths(osl_maths(osl_maths(getVar("scrawling")[Math.floor(Math.random() * getVar("scrawling").length)], "++", getVar("scrawling")[Math.floor(Math.random() * getVar("scrawling").length)]), "++", getVar("scrawling")[Math.floor(Math.random() * getVar("scrawling").length)]), "++", " GAME OVER "), "++", getVar("scrawling")[Math.floor(Math.random() * getVar("scrawling").length)]), "++", getVar("scrawling")[Math.floor(Math.random() * getVar("scrawling").length)]), "++", getVar("scrawling")[Math.floor(Math.random() * getVar("scrawling").length)]))};
OSL.ctx().color("#611");
(function(){const _f=getVar("bold_text");if(typeof _f==="function")return _f(getVar("rtxt"),50,5);const _x=OSL.ctx();const _m=_x["bold_text"];if(typeof _m==="function")_m.call(_x,getVar("rtxt"),50,5)})();
{const _pc=OSL.ctx().penColor;OSL.ctx().color("#e00");OSL.ctx().text(getVar("rtxt"),50);OSL.ctx().penColor=_pc;}
OSL.ctx().goto(0,osl_maths(getVar("window")["bottom"], "+", 200));
{const _pc=OSL.ctx().penColor;OSL.ctx().color("#311");OSL.ctx().rect(350,80,20);OSL.ctx().penColor=_pc;}
if (getVar("contr")) {
{const _pc=OSL.ctx().penColor;OSL.ctx().color("#fcc");OSL.ctx().centext("Press A to restart",15);OSL.ctx().penColor=_pc;}
void (((_o,_k)=>Array.isArray(_o)?_o[(+_k||0)-1]:(_o==null?undefined:_o[_k]))(getVar("gamepads"),1).haptic({"duration": 200, "weakMagnitude": 1, "strongMagnitude": 1}));
} else {
{const _pc=OSL.ctx().penColor;OSL.ctx().color("#fcc");OSL.ctx().centext("Press Space to restart",15);OSL.ctx().penColor=_pc;}
}
{let n="dieoff";getCtx(n)[n]=clone(2000)};
if (((OSL.keyDown("space") || ((_o,_k)=>Array.isArray(_o)?_o[(+_k||0)-1]:(_o==null?undefined:_o[_k]))(getVar("gamepad")["buttons"],1).pressed) || ((_o,_k)=>Array.isArray(_o)?_o[(+_k||0)-1]:(_o==null?undefined:_o[_k]))(getVar("gamepad")["buttons"],2).pressed)) {
{let n="dead";getCtx(n)[n]=clone(false)};
{let n="dieoff";getCtx(n)[n]=clone(0)};
{let n="score";getCtx(n)[n]=clone(0)};
{let n="skibx";getCtx(n)[n]=clone(osl_maths(1000, "+", getVar("random")(200,450)))};
{let n="skiby";getCtx(n)[n]=clone(getVar("random")(-200,200))};
{let n="speed";getCtx(n)[n]=clone(1)};
{let n="ready";getCtx(n)[n]=clone(false)};
{let n="cooldown";getCtx(n)[n]=clone(0)};
}
}
{let n="skibx";{const _t=getCtx(n);_t[n]=osl_maths(_t[n], "-", getVar("speed"))}};
{let n="clock";{const _t=getCtx(n);_t[n]=osl_maths(_t[n], "+", 1)}};

inner=_si});
})(globalThis.OSL_DATA||{});