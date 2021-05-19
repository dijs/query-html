const { tokenize, constructTree } = require('hyntax');
const CSSwhat = require('css-what');

function findNode(node, predicate) {
  const result = predicate(node);
  if (result) return result;
  if (node.content.children) {
    for (let child of node.content.children) {
      const found = findNode(child, predicate);
      if (found) return found;
    }
  }
  return null;
}

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

function matchesSelectors(node, tokens) {
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.type === 'tag') {
      if (matchesTag(node, token)) {
        continue;
      } else {
        return false;
      }
    }
    if (token.type === 'attribute' && token.name === 'class') {
      if (matchesClass(node, token.value)) {
        continue;
      } else {
        return false;
      }
    }

    if (token.type === 'descendant') {
      const tokensLeft = tokens.slice(i + 1);
      if (node.content.children) {
        return node.content.children.find((n) =>
          matchesSelectors(n, tokensLeft)
        );
      } else {
        return false;
      }
    }

    throw new Error(
      `We do not support this token: ${JSON.stringify(token, null, 3)}`
    );
  }

  return node;
}

function createPredicate(selector) {
  const tokens = CSSwhat.parse(selector)[0];
  return (node) => matchesSelectors(node, tokens);
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
  if (!node.content.attributes) {
    throw new Error(
      'No attributes found. Are you selecting the correct element?'
    );
  }
  const attr = node.content.attributes.find(
    (attr) => attr.key.content === name
  );
  if (!attr) return null;
  return attr.value.content;
}

function wrapper(node) {
  const children = node
    ? node.content.children.filter((e) => e.nodeType === 'tag')
    : [];
  const eq = (i) => wrapper(children[i]);
  return {
    attr: (name) => getAttribute(node, name),
    hasClass: (name) => matchesClass(node, name),
    eq,
    get text() {
      return buildText(node);
    },
    get first() {
      return eq(0);
    },
    get children() {
      return children;
    },
    get name() {
      return node.content.name;
    },
    get last() {
      return eq(children.length - 1);
    },
    get href() {
      return getAttribute(node, 'href');
    },
  };
}

module.exports = function queryHTML(html) {
  const { tokens } = tokenize(html);
  const { ast } = constructTree(tokens);
  return {
    find: (selector) => {
      const node = findNode(ast, createPredicate(selector));
      return wrapper(node);
    },
  };
};
