/**
 * highlight.js Robot Framework syntax highlighting definition
 * Source: https://github.com/highlightjs/highlightjs-robot
 *
 * @see https://github.com/isagalaev/highlight.js
 *
 * @package: highlightjs-robot
 * @author:  Harri Paavola <harri.paavola@gmail.com>
 * @since:   2019-08-05
 *
 * BSD 3-Clause License
 *
 * Copyright (c) 2020, Harri Paavola
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its
 *    contributors may be used to endorse or promote products derived from
 *    this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

export default function hljsDefineRobot() {
  const VAR = {
    className: 'variable',
    begin: /\$\{/,
    end: /\}/
  };
  const DICT = {
    className: 'variable',
    begin: /&\{/,
    end: /\}/
  };
  const LIST = {
    className: 'variable',
    begin: /@\{/,
    end: /\}/
  };
  const NUMBER = {
    className: 'number',
    begin: /\$\{([0-9])/,
    end: /\}/
  };
  const SECTION = {
    className: 'section',
    begin: /^(\*{1,3})/,
    end: /$/
  };
  const DOC = {
    className: 'comment',
    begin: /^\s*\[?Documentation\]?\s+/,
    end: /$/
  };
  const DOC_CONT = {
    className: 'comment',
    begin: /^\.\.\./,
    end: /$/
  };
  const COMMENT = {
    className: 'comment',
    begin: /(^| {2,}|\t|\| {1,})#/,
    end: /$/
  };
  const TEST = {
    className: 'name',
    begin: /(^([^*| |\t|\n)]))\w/,
    end: /($|\s{2,})/,
    contains: [VAR]
  };
  const SETTING = {
    className: 'built_in',
    begin: /^\s+\[(Tags|Setup|Teardown|Template|Timeout|Arguments|Return)\]/,
    end: /$| {2,}|\t/,
    contains: [VAR],
    relevance: 10
  };
  const CONST = {
    className: 'attribute',
    begin: /^(Library|Resource|Test Timeout|Test Template|Test Teardown|Test Setup|Default Tags|Force Tags|Variables|Suite Setup|Suite Teardown)(?:( )|( \| ))/,
    end: /$| {2,}|\t/,
    contains: [VAR],
    relevance: 10
  };
  const GHERKIN = {
    className: 'comment',
    variants: [
      {begin: /^\s{2,}given/, end: /\s/},
      {begin: /^\s{2,}when/, end: /\s/},
      {begin: /^\s{2,}then/, end: /\s/},
      {begin: /^\s{2,}and/, end: /\s/}
    ]
  };
  return {
    case_insensitive: true,
    aliases: ['robot', 'rf'],
    keywords: 'Settings Keywords [Return] [Teardown] [Timeout] [Setup] [Tags] [Arguments] [Documentation]',
    contains: [
      NUMBER,
      VAR,
      DICT,
      LIST,
      SECTION,
      CONST,
      DOC,
      DOC_CONT,
      TEST,
      COMMENT,
      SETTING,
      GHERKIN
    ]
  };
}
