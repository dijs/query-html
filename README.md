[![NPM Version](https://img.shields.io/npm/v/query-html.svg)](https://www.npmjs.com/package/query-html)

<a href="https://www.buymeacoffee.com/2tmRKi9" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-yellow.png" alt="Buy Me A Coffee" height="41" width="174"></a>

QueryHTML is a fast and lightweight HTML query library.

## Examples

```js
const query = queryHtml(htmlString);

query.find('.foo').text; // -> inner text of this element
query.find('.foo ul li').eq(3).attr('for'); // -> read attributes
query.find('.foo ul li').first.href; // -> built in support for common attributes
query.find('div a').hasClass('foo'); // -> check for class names
query.find('.foo ul').children; // -> access to child elements in raw form
query.find('.foo ul').name; // -> access element properties
```

## Install

```bash
npm install query-html
```
