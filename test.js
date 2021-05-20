const test = require('ava');
const queryHtml = require('.');
const fs = require('fs');

const mock1 = `
<div>
  <div class="zed ted">
    <a name="skywalker">Luke</a>
  </div>
  <div class="foo">
    <ul>
      <li key="hello">Hello</li>
      <li>World!</li>
    </ul>
  </div>
  <div class="bar">
    <a href="/luke">Luke</a>
  </div>
</div>
`;
const mock2 = fs.readFileSync('./test.html');

// TODO: split all tests into named tests

test('that we can get the inner text', (t) => {
  const query = queryHtml(mock1);
  t.is(query.find('.foo').text, 'HelloWorld!');
  t.is(query.find('.bar').text, 'Luke');
});

test('that we can get attributes values', (t) => {
  const query = queryHtml(mock1);
  t.is(query.find('.bar a').attr('href'), '/luke');
  t.is(query.find('.bar a').href, '/luke');
  t.throws(() => query.find('.foo a').href, {
    message: 'No element found',
  });
  t.is(query.find('.zed a').href, null);
  t.is(query.find('.foo ul li').eq(0).attr('key'), 'hello');
  t.is(query.find('.foo ul li').first.attr('key'), 'hello');
  t.is(query.find('.foo ul li').last.text, 'World!');
  t.throws(() => query.find('.foo ul li').eq(5).text, {
    message: 'No element found',
  });
});

test('that we can check for class names', (t) => {
  const query = queryHtml(mock1);
  t.truthy(query.find('.zed').hasClass('ted'));
  t.falsy(query.find('.zed').hasClass('tom'));
});

test('get node properties', (t) => {
  t.is(queryHtml(mock1).find('.foo ul').children.length, 2);
  t.is(queryHtml(mock1).find('.foo ul').name, 'ul');
  t.is(queryHtml(mock1).find('div').children.length, 3);
});

test('iterate over elements', (t) => {
  t.is(
    queryHtml(mock2)
      .find('h3.title span')
      .map((el) => el.text)
      .join(', '),
    'Star Wars: The Rise of Skywalker, Solo: A Star Wars Story, Star Wars: The Last Jedi, Rogue One: A Star Wars Story, Star Wars: The Force Awakens, Star Wars: Return of the Jedi, Star Wars: The Empire Strikes Back, Star Wars: A New Hope, Star Wars: Revenge of the Sith, Star Wars: Attack of the Clones, Star Wars: The Phantom Menace'
  );
});
