// Copyright (C) 2022 Clavicode Team
// 
// This file is part of clavicode-frontend.
// 
// clavicode-frontend is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// clavicode-frontend is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with clavicode-frontend.  If not, see <http://www.gnu.org/licenses/>.

import type * as monaco from 'monaco-editor-core';

export const pyLangConf: monaco.languages.LanguageConfiguration = {
  comments: {
    lineComment: '#',
    blockComment: ["'''", "'''"]
  },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')']
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"', notIn: ['string'] },
    { open: "'", close: "'", notIn: ['string', 'comment'] }
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" }
  ],
  onEnterRules: [
    {
      beforeText: new RegExp(
        '^\\s*(?:def|class|for|if|elif|else|while|try|with|finally|except|async).*?:\\s*$'
      ),
      action: { indentAction: /* monaco.languages.IndentAction.Indent */ 1 }
    }
  ],
  folding: {
    offSide: true,
    markers: {
      start: new RegExp('^\\s*#region\\b'),
      end: new RegExp('^\\s*#endregion\\b')
    }
  }
};

export const pyLang = <monaco.languages.IMonarchLanguage>{
  defaultToken: '',
  tokenPostfix: '.python',

  keywords: [
    // This section is the result of running
    // `for k in keyword.kwlist: print('  "' + k + '",')` in a Python REPL,
    // though note that the output from Python 3 is not a strict superset of the
    // output from Python 2.
    'False', // promoted to keyword.kwlist in Python 3
    'None', // promoted to keyword.kwlist in Python 3
    'True', // promoted to keyword.kwlist in Python 3
    'and',
    'as',
    'assert',
    'async', // new in Python 3
    'await', // new in Python 3
    'break',
    'class',
    'continue',
    'def',
    'del',
    'elif',
    'else',
    'except',
    // 'exec', // Python 2, but not 3.
    'finally',
    'for',
    'from',
    'global',
    'if',
    'import',
    'in',
    'is',
    'lambda',
    'nonlocal', // new in Python 3
    'not',
    'or',
    'pass',
    // 'print', // Python 2, but not 3.
    'raise',
    'return',
    'try',
    'while',
    'with',
    'yield',

    // 'int',
    // 'float',
    // 'long',
    // 'complex',
    // 'hex',

    // 'abs',
    // 'all',
    // 'any',
    // 'apply',
    // 'basestring',
    // 'bin',
    // 'bool',
    // 'buffer',
    // 'bytearray',
    // 'callable',
    // 'chr',
    // 'classmethod',
    // 'cmp',
    // 'coerce',
    // 'compile',
    // 'complex',
    // 'delattr',
    // 'dict',
    // 'dir',
    // 'divmod',
    // 'enumerate',
    // 'eval',
    // 'execfile',
    // 'file',
    // 'filter',
    // 'format',
    // 'frozenset',
    // 'getattr',
    // 'globals',
    // 'hasattr',
    // 'hash',
    // 'help',
    // 'id',
    // 'input',
    // 'intern',
    // 'isinstance',
    // 'issubclass',
    // 'iter',
    // 'len',
    // 'locals',
    // 'list',
    // 'map',
    // 'max',
    // 'memoryview',
    // 'min',
    // 'next',
    // 'object',
    // 'oct',
    // 'open',
    // 'ord',
    // 'pow',
    // 'print',
    // 'property',
    // 'reversed',
    // 'range',
    // 'raw_input',
    // 'reduce',
    // 'reload',
    // 'repr',
    // 'reversed',
    // 'round',
    // 'self',
    // 'set',
    // 'setattr',
    // 'slice',
    // 'sorted',
    // 'staticmethod',
    // 'str',
    // 'sum',
    // 'super',
    // 'tuple',
    // 'type',
    // 'unichr',
    // 'unicode',
    // 'vars',
    // 'xrange',
    // 'zip',

    // '__dict__',
    // '__methods__',
    // '__members__',
    // '__class__',
    // '__bases__',
    // '__name__',
    // '__mro__',
    // '__subclasses__',
    // '__init__',
    // '__import__'
  ],

  brackets: [
    { open: '{', close: '}', token: 'punctuation.curly' },
    { open: '[', close: ']', token: 'punctuation.bracket' },
    { open: '(', close: ')', token: 'punctuation.parenthesis' }
  ],

  tokenizer: {
    root: [
      { include: '@whitespace' },
      { include: '@numbers' },
      { include: '@strings' },

      [/[,:;]/, 'punctuation'],
      [/[{}\[\]()]/, '@brackets'],

      [/@[a-zA-Z_]\w*/, 'tag'],
      [
        /[a-zA-Z_]\w*/,
        {
          cases: {
            '@keywords': 'keyword',
            '@default': 'identifier'
          }
        }
      ]
    ],

    // Deal with white space, including single and multi-line comments
    whitespace: [
      [/\s+/, 'white'],
      [/(^#.*$)/, 'comment'],
      [/'''/, 'string', '@endDocString'],
      [/"""/, 'string', '@endDblDocString']
    ],
    endDocString: [
      [/[^']+/, 'string'],
      [/\\'/, 'string'],
      [/'''/, 'string', '@popall'],
      [/'/, 'string']
    ],
    endDblDocString: [
      [/[^"]+/, 'string'],
      [/\\"/, 'string'],
      [/"""/, 'string', '@popall'],
      [/"/, 'string']
    ],

    // Recognize hex, negatives, decimals, imaginaries, longs, and scientific notation
    numbers: [
      [/-?0x([abcdef]|[ABCDEF]|\d)+[lL]?/, 'number.hex'],
      [/-?(\d*\.)?\d+([eE][+\-]?\d+)?[jJ]?[lL]?/, 'number']
    ],

    // Recognize strings, including those broken across lines with \ (but not without)
    strings: [
      [/'$/, 'string.escape', '@popall'],
      [/'/, 'string.escape', '@stringBody'],
      [/"$/, 'string.escape', '@popall'],
      [/"/, 'string.escape', '@dblStringBody']
    ],
    stringBody: [
      [/[^\\']+$/, 'string', '@popall'],
      [/[^\\']+/, 'string'],
      [/\\./, 'string'],
      [/'/, 'string.escape', '@popall'],
      [/\\$/, 'string']
    ],
    dblStringBody: [
      [/[^\\"]+$/, 'string', '@popall'],
      [/[^\\"]+/, 'string'],
      [/\\./, 'string'],
      [/"/, 'string.escape', '@popall'],
      [/\\$/, 'string']
    ]
  }
};
