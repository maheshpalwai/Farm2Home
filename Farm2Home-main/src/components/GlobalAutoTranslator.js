import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import enTranslations from '../locales/en.json';
import teTranslations from '../locales/te.json';
import hiTranslations from '../locales/hi.json';
import taTranslations from '../locales/ta.json';
import mlTranslations from '../locales/ml.json';
import knTranslations from '../locales/kn.json';

const EMAIL_REGEX = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;

const normalize = (value) => String(value || '').replace(/\s+/g, ' ').trim();
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const tokenize = (value) =>
  normalize(value)
    .split(/[^\p{L}\p{N}_]+/u)
    .map((part) => part.trim())
    .filter(Boolean);

const originalTextByNode = new WeakMap();
const originalAttrsByElement = new WeakMap();

const toMaps = (langCode) => {
  const en = enTranslations?.translation || {};
  const targetResource = {
    en: enTranslations,
    te: teTranslations,
    hi: hiTranslations,
    ta: taTranslations,
    ml: mlTranslations,
    kn: knTranslations,
  }[langCode] || enTranslations;

  const target = targetResource?.translation || {};
  const exactMap = new Map();
  const phraseMap = new Map();
  const wordMap = new Map();

  Object.keys(en).forEach((key) => {
    const from = normalize(en[key]);
    const to = normalize(target[key]);
    if (!from || !to || from === to) return;

    exactMap.set(from, to);
    exactMap.set(from.toLowerCase(), to);
    phraseMap.set(from.toLowerCase(), to);

    const fromTokens = tokenize(from);
    const toTokens = tokenize(to);
    if (fromTokens.length && fromTokens.length === toTokens.length) {
      fromTokens.forEach((token, idx) => {
        const tFrom = token.toLowerCase();
        const tTo = toTokens[idx];
        if (!tFrom || !tTo || tFrom === tTo.toLowerCase()) return;
        if (!wordMap.has(tFrom)) wordMap.set(tFrom, tTo);
      });
    }
  });

  const sortedPhrases = [...phraseMap.entries()].sort((a, b) => b[0].length - a[0].length);
  return { exactMap, sortedPhrases, wordMap };
};

const shouldSkipElement = (el) => {
  if (!el) return true;
  const tag = (el.tagName || '').toLowerCase();
  if (['script', 'style', 'noscript', 'code', 'pre'].includes(tag)) return true;
  if (el.closest('[data-no-auto-translate="true"]')) return true;
  return false;
};

const translateString = (value, dictionary) => {
  const normalized = normalize(value);
  if (!normalized || EMAIL_REGEX.test(normalized)) return value;

  const exact = dictionary.exactMap.get(normalized) || dictionary.exactMap.get(normalized.toLowerCase());
  if (exact) return value.replace(normalized, exact);

  let output = value;
  const lowerOutput = output.toLowerCase();

  let phraseApplied = false;
  dictionary.sortedPhrases.forEach(([fromLower, to]) => {
    if (!fromLower || !to) return;
    const pattern = new RegExp(escapeRegex(fromLower), 'gi');
    if (pattern.test(lowerOutput)) {
      output = output.replace(pattern, to);
      phraseApplied = true;
    }
  });

  if (phraseApplied) return output;

  output = output.replace(/\b[\p{L}\p{N}_]+\b/gu, (token) => {
    const translated = dictionary.wordMap.get(token.toLowerCase());
    return translated || token;
  });

  return output;
};

const translateAttributes = (root, dictionary) => {
  const attrs = ['placeholder', 'title', 'aria-label'];
  const elements = root.querySelectorAll('*');

  elements.forEach((el) => {
    if (shouldSkipElement(el)) return;

    if (!originalAttrsByElement.has(el)) {
      originalAttrsByElement.set(el, new Map());
    }
    const attrStore = originalAttrsByElement.get(el);

    attrs.forEach((attr) => {
      const current = el.getAttribute(attr);
      if (!current) return;

      if (!attrStore.has(attr)) {
        attrStore.set(attr, current);
      }

      const source = attrStore.get(attr);
      if (!source || EMAIL_REGEX.test(source)) return;

      const translated = translateString(source, dictionary);
      if (translated && translated !== current) {
        el.setAttribute(attr, translated);
      }
    });
  });
};

const translateTextNodes = (root, dictionary) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];

  while (walker.nextNode()) nodes.push(walker.currentNode);

  nodes.forEach((textNode) => {
    const parent = textNode.parentElement;
    const value = textNode.nodeValue;
    if (!parent || !value) return;
    if (shouldSkipElement(parent)) return;

    if (!originalTextByNode.has(textNode)) {
      originalTextByNode.set(textNode, value);
    }

    const source = originalTextByNode.get(textNode);
    const trimmed = normalize(source);
    if (!trimmed || EMAIL_REGEX.test(trimmed)) return;

    const translated = translateString(source, dictionary);
    if (translated && translated !== value) {
      textNode.nodeValue = translated;
    }
  });
};

const GlobalAutoTranslator = () => {
  const { i18n } = useTranslation();

  const dictionary = useMemo(() => {
    const lang = (i18n.language || 'en').split('-')[0];
    return toMaps(lang);
  }, [i18n.language]);

  useEffect(() => {
    const lang = (i18n.language || 'en').split('-')[0];
    const run = () => {
      translateAttributes(document.body, dictionary);
      translateTextNodes(document.body, dictionary);
    };

    run();

    const observer = new MutationObserver(() => run());
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['placeholder', 'title', 'aria-label'],
    });

    return () => observer.disconnect();
  }, [dictionary, i18n.language]);

  return null;
};

export default GlobalAutoTranslator;
