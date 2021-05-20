const { tokenize, constructTree } = require('hyntax');
const CSSwhat = require('css-what');

function matchesTag(node, token) {
  return node.nodeType === 'tag' && node.content.name === token.name;
}

function matchesClass(node, name) {
  return (
    node.content.attributes &&
    node.content.attributes.some(
      (attr) =>
        attr.key.content === 'class' && attr.value.content.indexOf(name) !== -1
    )
  );
}

function findNodes(node, tokens, onMatch) {
  const di = tokens.findIndex((t) => t.type === 'descendant');

  const currentTokens = di === -1 ? tokens : tokens.slice(0, di);

  const match = currentTokens.every((token) => {
    if (token.type === 'tag') {
      return matchesTag(node, token);
    }
    if (token.type === 'attribute' && token.name === 'class') {
      return matchesClass(node, token.value);
    }
    throw new Error(
      `We do not support this token: ${JSON.stringify(token, null, 3)}`
    );
  });

  if (match) {
    if (di === -1) {
      onMatch(node);
    } else {
      // more tokens after decendant
      const tokensLeft = tokens.slice(di + 1);
      if (node.content.children) {
        return node.content.children.forEach((n) =>
          findNodes(n, tokensLeft, onMatch)
        );
      }
    }
  } else {
    if (node.content.children) {
      return node.content.children.forEach((n) =>
        findNodes(n, tokens, onMatch)
      );
    }
  }
}

function buildText(node) {
  if (!node) throw new Error('No element found');
  let text = '';
  if (node.content.children) {
    for (let child of node.content.children) {
      if (child.nodeType === 'text') {
        text += child.content.value.content.trim();
      } else {
        text += buildText(child);
      }
    }
  }
  return text;
}

function getAttribute(node, name) {
  if (!node) throw new Error('No element found');
  if (!node.content.attributes) return null;
  const attr = node.content.attributes.find(
    (attr) => attr.key.content === name
  );
  if (!attr) return null;
  return attr.value.content;
}

function helper(node) {
  const children = node
    ? node.content.children.filter((e) => e.nodeType === 'tag')
    : [];
  return {
    attr: (name) => getAttribute(node, name),
    hasClass: (name) => matchesClass(node, name),
    get text() {
      return buildText(node);
    },
    get children() {
      return children;
    },
    get name() {
      return node.content.name;
    },
    get href() {
      return getAttribute(node, 'href');
    },
  };
}

function wrapper(elements) {
  const eq = (i) => helper(elements[i]);

  const fns = {
    eq,
    map: (fn) => {
      return elements.map((n) => fn(helper(n)));
    },
    get first() {
      return eq(0);
    },
    get last() {
      return eq(elements.length - 1);
    },
  };

  Object.assign(fns, eq(0));

  return fns;
}

module.exports = function queryHTML(html) {
  const { tokens } = tokenize(html);
  const { ast } = constructTree(tokens);
  return {
    find: (selector) => {
      const tokens = CSSwhat.parse(selector)[0];
      const nodes = [];
      findNodes(ast, tokens, (n) => nodes.push(n));
      return wrapper(nodes);
    },
  };
};
