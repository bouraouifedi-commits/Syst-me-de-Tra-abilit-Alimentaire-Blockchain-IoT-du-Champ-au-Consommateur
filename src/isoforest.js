
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}
function randFloat(min, max) {
  return Math.random() * (max - min) + min;
}
function harmonic(n) {
  let s = 0;
  for (let i = 1; i <= n; i++) s += 1 / i;
  return s;
}
function cFactor(n) {
  if (n <= 1) return 0;
  return 2 * harmonic(n - 1) - (2 * (n - 1)) / n;
}

class ITreeNode {
  constructor({ splitAtt = -1, splitVal = 0, left = null, right = null, size = 0, isLeaf = false }) {
    this.splitAtt = splitAtt;
    this.splitVal = splitVal;
    this.left = left;
    this.right = right;
    this.size = size;
    this.isLeaf = isLeaf;
  }
}

function buildTree(X, height, heightLimit) {
  const size = X.length;
  if (height >= heightLimit || size <= 1) return new ITreeNode({ size, isLeaf: true });

  const m = X[0].length;
  const q = randInt(0, m);

  let minv = Infinity, maxv = -Infinity;
  for (let i = 0; i < size; i++) {
    const v = X[i][q];
    if (v < minv) minv = v;
    if (v > maxv) maxv = v;
  }
  if (!isFinite(minv) || !isFinite(maxv) || minv === maxv) return new ITreeNode({ size, isLeaf: true });

  const p = randFloat(minv, maxv);
  const XL = [];
  const XR = [];
  for (let i = 0; i < size; i++) (X[i][q] < p ? XL : XR).push(X[i]);

  if (XL.length === 0 || XR.length === 0) return new ITreeNode({ size, isLeaf: true });

  return new ITreeNode({
    splitAtt: q,
    splitVal: p,
    size,
    isLeaf: false,
    left: buildTree(XL, height + 1, heightLimit),
    right: buildTree(XR, height + 1, heightLimit),
  });
}

function pathLength(x, node, height) {
  if (node.isLeaf) return height + cFactor(node.size);
  return x[node.splitAtt] < node.splitVal
    ? pathLength(x, node.left, height + 1)
    : pathLength(x, node.right, height + 1);
}

export class IsolationForest {
  constructor({ nTrees = 120, sampleSize = 64 } = {}) {
    this.nTrees = nTrees;
    this.sampleSize = sampleSize;
    this.trees = [];
    this._c = 1;
  }

  fit(X) {
    if (!Array.isArray(X) || X.length < 2) throw new Error("Need at least 2 samples");
    const n = X.length;
    const ss = Math.min(this.sampleSize, n);
    const heightLimit = Math.ceil(Math.log2(ss));
    this._c = cFactor(ss);

    this.trees = [];
    for (let t = 0; t < this.nTrees; t++) {
      const sample = [];
      for (let i = 0; i < ss; i++) sample.push(X[randInt(0, n)]);
      this.trees.push(buildTree(sample, 0, heightLimit));
    }
  }

  score(x) {
    if (!this.trees.length) throw new Error("Model not fitted");
    let sum = 0;
    for (const tree of this.trees) sum += pathLength(x, tree, 0);
    const Eh = sum / this.trees.length;
    return Math.pow(2, -Eh / this._c); // [0,1] higher = more anomalous
  }
}
