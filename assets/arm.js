var occa = occa || {};

occa.languageLabels = {
  cpp: 'C++',
  okl: 'OKL',
};

occa.getLanguageLabel = (language) => (
  occa.languageLabels[language] || language.toUpperCase()
);

//---[ Header & Footer ]----------------
occa.addFooter = (content) => (
  content
    + '\n\n'
    + '<div id="footer">\n'
    + '  <hr/>\n'
    + '  <div id="copyright">\n'
    + `    © Copyright 2014 - ${(new Date()).getFullYear()}, David Medina and Tim Warburton.\n`
    + '  </div>\n'
    + '  <div>\n'
    + '    <a href="https://docsify.js.org" target="_blank">Powered by <span class="docsify-text">Docsify</span> <span class="heart">&hearts;</span></a>\n'
    + '  </div>\n'
    + '</div>\n'
);
//======================================

//---[ Indent ]-------------------------
occa.parseIndent = (content) => {
  const parts = marked.lexer(content);
  const mdContent = occa.tokensToHTML(parts);
  return (
    '<div class="indent">\n'
      + mdContent
      + '</div>\n'
  );
}

occa.addIndents = (content) => {
  const re = /\n::: indent\n([\s\S]*?)\n:::(\n|$)/g;
  const parts = [];
  var lastIndex = 0;
  while ((match = re.exec(content)) != null) {
    const [fullMatch, indentContent] = match;

    parts.push(content.substring(lastIndex, match.index));
    parts.push(occa.parseIndent(indentContent));

    lastIndex = match.index + fullMatch.length;
  }
  parts.push(content.substring(lastIndex));

  return parts.join('\n');
};
//======================================

//---[ Tabs ]---------------------------
occa.markdown = {
  space: () => (
    ''
  ),
  text: ({ text }) => (
    `<p>${text}</p>`
  ),
  paragraph: ({ text }) => (
    `<p>${text}</p>`
  ),
  list_start: () => (
    '<ul>'
  ),
  list_end: () => (
    '</ul>'
  ),
  list_item_start: () => (
    '<li>'
  ),
  list_item_end: () => (
    '</li>'
  ),
  html: ({ text }) => (
    text
  ),
};

occa.markdown.code = ({ lang, text }) => {
  // Remove indentation
  const initIndent = text.match(/^\s*/)[0];
  if (initIndent.length) {
    const lines = text .split(/\r?\n/);
    const isIndented = lines.every((line) => (
      !line.length
      || line.startsWith(initIndent)
    ));

    if (isIndented) {
      text = lines.map((line) => (
        line.substring(initIndent.length)
      )).join('\n');
    }
  }

  // Generate highlighted HTML
  const styledCode = Prism.highlight(text,
                                     Prism.languages[lang],
                                     lang);

  // Wrap around pre + code
  return (
    (
      `<pre data-lang="${occa.getLanguageLabel(lang)}">`
        + `<code class="lang-${lang}">`
        + `${styledCode}\n`
        + '</code>'
        + '</pre>'
    )
      .replace(/[*]/g, '&#42;')
      .replace(/[_]/g, '&#95;')
  );
}

occa.tokenToMarkdown = (token) => {
  const { type } = token;
  if (type in occa.markdown) {
    return occa.markdown[token.type](token);
  }
  console.error(`Missing token format for: ${token.type}`, token);
  return '';
};

occa.mergeTextTokens = (tokens) => {
  const newTokens = [];
  let texts = [];
  for (var i = 0; i < tokens.length; ++i) {
    const token = tokens[i];
    if (token.type === 'text') {
      texts.push(token.text);
      continue;
    }
    if (texts.length) {
      newTokens.push({
        type: 'text',
        text: texts.join(' '),
      });
      texts = [];
    }
    newTokens.push(token);
  }
  // Join the tail texts
  if (texts.length) {
    newTokens.push({
      type: 'text',
      text: texts.join(' '),
    });
  }
  return newTokens;
};

occa.tokensToHTML = (tokens) => {
  tokens = occa.mergeTextTokens(tokens);
  return (
    tokens
      .map(occa.tokenToMarkdown)
      .join('\n')
  );
};

occa.getTab = ({ tab, content }) => {
  if(tab === 'Try it out') {
    laboratoryUrl = content[0].text;
  }
  return tab !== 'Try it out' ? `<md-tab id="${tab}" md-label="${tab}">\n`
      + occa.tokensToHTML(content)
      + '      </md-tab>' : `<md-tab id="${tab}" md-label="${tab}">\n`
          + '      </md-tab>';
};

occa.getTabs = (namespace, tabs) => {
  const content = tabs.map(occa.getTab).join('\n');

  const tab     = `vm.$data.tabNamespaces['${namespace}']`;
  const onClick = `(tab) => vm.onTabChange('${namespace}', tab)`;
  return (
    '<template>\n'
      + '  <div>\n'
      + '    <md-tabs\n'
      + '      md-dynamic-height="true"\n'
      + `      v-bind:md-active-tab="${tab}"\n`
      + `      @md-changed="${onClick}"\n`
      + '    >\n'
      + `${content}\n`
      + '    </md-tabs>\n'
      + '  </div>\n'
      + '</template>\n'
  );
};

occa.parseTabs = (namespace, content) => {
  const parts = marked.lexer(content);
  const newParts = [];

  // Skip begin/end of list
  for (var i = 1; i < (parts.length - 1); ++i) {
    var stackSize = 1;

    // Skip loose_item_start;
    ++i;
    const tab = parts[i++].text;
    const start = i++;

    while ((i < (parts.length - 1)) && (stackSize > 0)) {
      switch (parts[i].type) {
      case 'list_item_start':
        ++stackSize;
        break;
      case 'list_item_end':
        --stackSize;
        break;
      }
      ++i;
    }

    // Don't take the token after list_item_end
    --i;

    newParts.push({
      tab,
      content: parts.slice(start, i),
    });
  }

  if (!newParts.length) {
    return [];
  }

  if (!(namespace in vm.$data.tabNamespaces)) {
    Vue.set(vm.tabNamespaces, namespace, newParts[0].tab);
  }

  return occa.getTabs(namespace, newParts);
};

occa.addTabs = (content) => {
  const re = /\n::: tabs (.*)\n([\s\S]*?)\n:::(\n|$)/g;
  const parts = [];
  var lastIndex = 0;
  while ((match = re.exec(content)) != null) {
    const [fullMatch, namespace, tabContent] = match;

    parts.push(content.substring(lastIndex, match.index));
    parts.push(occa.parseTabs(namespace, tabContent));

    lastIndex = match.index + fullMatch.length;
  }
  parts.push(content.substring(lastIndex));

  return parts.join('\n');
};
//======================================

// Root-level markdowns don't have a sidebar
occa.hasSidebar = (file) => (
  !file.match(/^[^/]*\.md$/)
)

occa.docsifyPlugin = (hook, vm) => {
  hook.init(() => {
    Prism.languages.okl = Prism.languages.extend('cpp', {
      annotation: {
        pattern: /@[a-zA-Z][a-zA-Z0-9_]*/,
        greedy: true,
      },
    });
    // Prism curl
    Prism.languages.curl = {
      'curl': /\bcurl\b/,
      'url': /https?:[a-zA-Z0-9:.?=\/\-_{}]*/,
      'parameter': {
        pattern: /[A-Za-z0-9\[\]-_]+ *(?=[=])/,
      },
      'value': [{
        pattern: /([=])([A-Za-z0-9-_.]*)/,
        lookbehind: true,
      }, {
        pattern: /(["'])(\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
      }, {
        pattern: /(\-u )([A-Za-z0-9-_.{}]*)/,
        lookbehind: true,
      }],
      'option': / *-[a-zA-Z]*\b/,
    };
    Prism.languages.bibtex = Prism.languages.extend('latex');
  });

  hook.beforeEach((content) => {
    // No \n means the last line turns into a header
    if (!content.endsWith('\n')) {
      content += '\n';
    }
    content = occa.addIndents(content);
    content = occa.addTabs(content);
    //content = occa.addFooter(content);
    return content;
  });

  hook.doneEach(() => {
    const dom = document.querySelector('body');
    const file = vm.route.file;
    // Add API styling
    if (!file.startsWith('api/')) {
      dom.classList.remove('api-container');
    } else {
      dom.classList.add('api-container');
    }
    // Close sidebar
    if (occa.hasSidebar(file)) {
      dom.classList.remove('no-sidebar');
    } else {
      dom.classList.add('no-sidebar');
    }

    setTimeout(function() {
      $('div.md-button-content:contains("Try it out")').append(' &nbsp;<i class="fa fa-external-link" aria-hidden="true"></i>');
    }, 1000);

    if(location.href.substring(location.href.indexOf('#'), location.href.length) === `#/`) {
      $('#disqus_thread').hide();
      $('.docsify-pagination-container').hide();
    }
    else {
      $('#disqus_thread').show();
      $('.docsify-pagination-container').show();
    }


    const rootLi = $('.sidebar-nav li').has('ul');
    $.each(rootLi, function(index, el){
      if($(el).children().first()[0].nodeName === 'UL') {
        const ul = $(el).children().first();
        ul.remove();
        const p = `<p>${el.innerText}</p>`;
        el.innerText = '';
        $(el).append(p).append(ul);
      }
      $(el)[0].className = 'li-menu';
      $(el).children()[1].className = 'ul-menu' + index;
    });

    $('.li-menu').on('click', function(e) {
      $(this).children().filter('ul').slideToggle();
      e.stopPropagation();
    });

  });
};


Vue.component('team-member', {
  props: [
    'name',
    'image',
    'job',
    'location',
    'links',
    'github',
    'twitter',
    'googleScholar',
  ],
  template: (
    '    <div class="member">'
      + '  <div class="avatar">'
      + '    <md-avatar>'
      + '      <img v-bind:src="\'./assets/images/team/\' + image" v-bind:alt="name">'
      + '    </md-avatar>'
      + '  </div>'
      + '  <div class="profile">'
      + '    <h3>{{name}}</h3>'
      + '    <dl>'
      + '      <template v-if="job">'
      + '        <dt><i class="fa fa-briefcase"></i></dt>'
      + '        <dd>{{job}}</dd>'
      + '      </template>'
      + '      <template v-if="location">'
      + '        <dt><i class="fa fa-map-marker"></i></dt>'
      + '        <dd>{{location}}</dd>'
      + '      </template>'
      + '      <template v-for="link in links">'
      + '        <dt><i class="fa fa-link"></i></dt>'
      + '        <dd>'
      + '          <a v-bind:href="link[1]" target="_blank">{{link[0]}}</a>'
      + '        </dd>'
      + '      </template>'
      + '      <footer>'
      + '        <a v-if="github" v-bind:href="\'https://github.com/\' + github" target="_blank">'
      + '          <md-icon class="fa fa-github"></md-icon>'
      + '        </a>'
      + '        <a v-if="twitter" v-bind:href="\'https://twitter.com/\' + twitter" target="_blank">'
      + '          <md-icon class="fa fa-twitter"></md-icon>'
      + '        </a>'
      + '        <a v-if="googleScholar" v-bind:href="googleScholar" target="_blank">'
      + '          <md-icon class="fa fa-google"></md-icon>'
      + '        </a>'
      + '      </footer>'
      + '    </dl>'
      + '  </div>'
      + '</div>'
  ),
});

Vue.component('gallery-item', {
  props: ['name', 'link', 'from', 'image'],
  template: (
    '    <div class="gallery-entry">'
      + '  <div class="image">'
      + '    <a v-bind:href="link" target="_blank">'
      + '      <img v-bind:src="\'./assets/images/gallery/\' + image" alt="{{name}}">'
      + '    </a>'
      + '  </div>'
      + '  <div class="description">'
      + '    <h3><a v-bind:href="link" target="_blank">{{name}}</a> <span class="at">@{{from}}</span></h3>'
      + '    <slot></slot>'
      + '  </div>'
      + '</div>'
  ),
});
