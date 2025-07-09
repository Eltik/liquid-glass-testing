#version 300 es

precision highp float;

in vec4 v_color;

out vec4 fragColor;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

#define MAX_BLUR_RADIUS (100)
uniform int u_blurRadius;
uniform float u_blurWeights[MAX_BLUR_RADIUS + 1];

float sdCircle(vec2 p, float r) {
  return length(p) - r;
}

float sdQuadraticCircle(vec2 p) {
  p = abs(p);
  if (p.y > p.x) p = p.yx; // symmetries

  float a = p.x - p.y;
  float b = p.x + p.y;
  float c = (2.0 * b - 1.0) / 3.0;
  float h = a * a + c * c * c;
  float t;
  if (h >= 0.0) {
    h = sqrt(h);
    t = sign(h - a) * pow(abs(h - a), 1.0 / 3.0) - pow(h + a, 1.0 / 3.0);
  } else {
    float z = sqrt(-c);
    float v = acos(a / (c * z)) / 3.0;
    t = -z * (cos(v) + sin(v) * 1.732050808);
  }
  t *= 0.5;
  vec2 w = vec2(-t, t) + 0.75 - t * t - p;
  return length(w) * sign(a * a * 0.5 + b - 1.5);
}

vec3 sdSuperellipse(vec2 p, float r, float n) {
  p = p / r;
  vec2 gs = sign(p);
  vec2 ps = abs(p);
  float gm = pow(ps.x, n) + pow(ps.y, n);
  float gd = pow(gm, 1.0 / n) - 1.0;
  vec2 g = gs * pow(ps, vec2(n - 1.0)) * pow(gm, 1.0 / n - 1.0);
  p = abs(p);
  if (p.y > p.x) p = p.yx;
  n = 2.0 / n;
  float s = 1.0;
  float d = 1e20;
  const int num = 24;
  vec2 oq = vec2(1.0, 0.0);
  for (int i = 1; i < num; i++) {
    float h = float(i) / float(num - 1);
    vec2 q = vec2(pow(cos(h * 3.1415927 / 4.0), n), pow(sin(h * 3.1415927 / 4.0), n));
    vec2 pa = p - oq;
    vec2 ba = q - oq;
    vec2 z = pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    float d2 = dot(z, z);
    if (d2 < d) {
      d = d2;
      s = pa.x * ba.y - pa.y * ba.x;
    }
    oq = q;
  }
  return vec3(sqrt(d) * sign(s) * r, g);
}

float sdRoundBox(vec2 p, vec2 b, vec4 r) {
  r.xy = p.x > 0.0 ? r.xy : r.zw;
  r.x = p.y > 0.0 ? r.x : r.y;
  vec2 q = abs(p) - b + r.x;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r.x;
}

float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

vec3 sdgMin(vec3 a, vec3 b) {
  return a.x < b.x
    ? a
    : b;
}

float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

float chessboard(vec2 uv, float size) {
  float yBars = step(size * 2.0, mod(uv.y, size * 4.0));
  float xBars = step(size * 2.0, mod(uv.x, size * 4.0));
  return abs(yBars - xBars);
}

void main() {
  vec2 p1 = (gl_FragCoord.xy - u_resolution.xy * 0.5) / u_resolution.y;
  vec2 p2 = (gl_FragCoord.xy - u_mouse) / u_resolution.y;
  float d1 = sdCircle(p1, 200.0 / u_resolution.y);
  float d2 = sdSuperellipse(p2, 200.0 / u_resolution.y, 4.0).x;

  float merged = smin(d1, d2, 0.05);

  vec4 BgColor;
  float chessboardBg = 1.0 - chessboard(gl_FragCoord.xy, 50.0) / 4.0;
  if (merged < 0.0) {
    // blur
    float c = chessboard(gl_FragCoord.xy, 50.0) * u_blurWeights[0];
    float weightSum = u_blurWeights[0];

    for (int i = 1; i <= u_blurRadius; i++) {
      if (i > u_blurRadius) break;

      float w = u_blurWeights[i];

      c += chessboard(gl_FragCoord.xy + vec2(float(i), 0.0), 50.0) * w;
      c += chessboard(gl_FragCoord.xy + vec2(-float(i), 0.0), 50.0) * w;
      c += chessboard(gl_FragCoord.xy + vec2(0.0, float(i)), 50.0) * w;
      c += chessboard(gl_FragCoord.xy + vec2(0.0, -float(i)), 50.0) * w;

      weightSum += w * 4.0;
    }
    c /= weightSum;
    BgColor = vec4(vec3(c), 1.0);
  } else {
    BgColor = vec4(vec3(chessboardBg), 1.0);
  }

  fragColor = BgColor;
}
