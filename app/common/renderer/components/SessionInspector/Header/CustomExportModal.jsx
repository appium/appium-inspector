import {Modal, Checkbox, Space, Divider, Radio, Input, Button, Select} from 'antd';
import {useEffect, useMemo, useState} from 'react';
import _ from 'lodash';

import {downloadFile} from '../../../utils/file-handling.js';
import {getSuggestedLocators} from '../../../utils/locator-generation/common.js';
import {getOptimalXPath} from '../../../utils/locator-generation/xpath.js';
import {xmlToDOM, findDOMNodeByPath} from '../../../utils/source-parsing.js';

const DEFAULT_ATTRIBUTES = [
  'className',
  'text',
  'resourceId',
  'accessibilityId',
  'contentDesc',
  'clickable',
  'enabled',
  'displayed',
  'bounds',
  'package',
  'xpath',
];

const DEFAULT_FILTERS = ['visible', 'enabled'];
const DEFAULT_PRIORITY = ['accessibility id', 'id', 'text', 'xpath'];
const STORAGE_KEY = 'appium_custom_export_profiles_v1';

function safeNameFrom(attrs, path, className) {
  const candidates = [attrs['content-desc'], attrs['resource-id'], attrs.name, attrs.id, attrs.text, attrs.value];
  for (const c of candidates) {
    if (c && typeof c === 'string' && c.trim()) {
      return c.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '') || `${className}_${path.replace(/\./g, '_')}`;
    }
  }
  return `${className.replace(/\./g, '_')}_${path.replace(/\./g, '_')}`;
}

function traverse(node, cb) {
  if (!node) return;
  cb(node);
  for (const child of node.children || []) {
    traverse(child, cb);
  }
}

export default function CustomExportModal({open, onClose, sourceJSON, sourceXML, currentContext, automationName}) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [attributes, setAttributes] = useState(DEFAULT_ATTRIBUTES.slice(0, 6));
  const [priority, setPriority] = useState(DEFAULT_PRIORITY);
  const [mode, setMode] = useState('array');
  const [outputFieldMap, setOutputFieldMap] = useState({customFields: []});
  const [newCustomField, setNewCustomField] = useState({fieldName: '', sourceType: 'source', sourceValue: 'locatorValue'});
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setProfiles(JSON.parse(raw));
      } catch {}
    }
  }, []);

  const matchedElements = useMemo(() => {
    if (!sourceJSON) return [];
    const collected = [];
    traverse(sourceJSON, (node) => {
      const attrs = node.attributes || {};
      const passes = filters.every((f) => {
        switch (f) {
          case 'visible':
            return (attrs.displayed === 'true' || attrs.visible === 'true' || typeof attrs.displayed === 'undefined');
          case 'enabled':
            return attrs.enabled !== 'false';
          case 'clickable':
            return attrs.clickable === 'true';
          case 'focusable':
            return attrs.focusable === 'true';
          case 'selected':
            return attrs.selected === 'true';
          case 'checkable':
            return attrs.checkable === 'true';
          default:
            return true;
        }
      });
      if (passes) collected.push(node);
    });
    return collected;
  }, [sourceJSON, filters]);

  const exportedElements = useMemo(() => {
    if (!matchedElements.length) return [];
    const srcDom = sourceXML ? xmlToDOM(sourceXML) : null;
    return matchedElements.map((node) => {
      const attrs = node.attributes || {};
      const className = node.tagName || attrs.class || '';
      const name = safeNameFrom(attrs, node.path || '', className);

      let strategy = null;
      let selector = null;
      try {
        const strategyPairs = getSuggestedLocators(node, sourceXML, currentContext === 'NATIVE_APP', automationName);
        const stratMap = Object.fromEntries(strategyPairs);
        for (const p of priority) {
          if (stratMap[p]) {
            strategy = p;
            selector = stratMap[p];
            break;
          }
        }
      } catch (err) {}

      if (!strategy) {
        try {
          const domNode = srcDom ? findDOMNodeByPath(node.path, srcDom) : null;
          strategy = 'xpath';
          selector = domNode ? getOptimalXPath(srcDom, domNode) : '';
        } catch (e) {
          selector = '';
        }
      }

      const attrObj = {};
      for (const a of attributes) {
        switch (a) {
          case 'className':
            attrObj.className = className;
            break;
          case 'text':
            attrObj.text = attrs.text || attrs.value || attrs.label || '';
            break;
          case 'resourceId':
            attrObj.resourceId = attrs['resource-id'] || attrs.id || '';
            break;
          case 'accessibilityId':
            attrObj.accessibilityId = attrs['content-desc'] || attrs.name || '';
            break;
          case 'contentDesc':
            attrObj.contentDesc = attrs['content-desc'] || '';
            break;
          case 'clickable':
            attrObj.clickable = attrs.clickable === 'true';
            break;
          case 'enabled':
            attrObj.enabled = attrs.enabled === 'true';
            break;
          case 'displayed':
            attrObj.displayed = (attrs.displayed === 'true' || attrs.visible === 'true');
            break;
          case 'bounds':
            attrObj.bounds = attrs.bounds || '';
            break;
          case 'package':
            attrObj.package = attrs.package || '';
            break;
          case 'xpath':
            attrObj.xpath = selector || '';
            break;
          default:
            break;
        }
      }

      return {
        name,
        className,
        locatorStrategy: strategy,
        locatorValue: selector,
        attributes: attrObj,
      };
    });
  }, [matchedElements, attributes, priority, sourceXML, currentContext, automationName]);

  const preview = useMemo(() => {
    if (!exportedElements.length) return mode === 'object' ? {} : [];
    function resolveSourceValue(el, source) {
      if (!source) return '';
      switch (source) {
        case 'name':
          return el.name;
        case 'locatorValue':
          return el.locatorValue || '';
        case 'locatorStrategy':
          return el.locatorStrategy || '';
        case 'className':
          return el.className || '';
        case 'text':
          return el.attributes?.text || '';
        case 'resourceId':
          return el.attributes?.resourceId || '';
        case 'accessibilityId':
          return el.attributes?.accessibilityId || '';
        case 'xpath':
          return el.attributes?.xpath || el.locatorValue || '';
        default:
          return el.attributes?.[source] ?? '';
      }
    }

    const customFields = outputFieldMap.customFields || [];
    const hasCustomFields = customFields.length > 0;

    if (mode === 'array') {
      return exportedElements.map((el) => {
        const base = {};
        if (hasCustomFields) {
          for (const cf of customFields) {
            const val = cf.sourceType === 'literal' ? cf.sourceValue : resolveSourceValue(el, cf.sourceValue);
            base[cf.fieldName] = val;
          }
        } else {
          for (const k of Object.keys(el.attributes)) {
            base[k] = el.attributes[k];
          }
        }
        return base;
      });
    }

    const out = {};
    for (const el of exportedElements) {
      const entry = {};
      if (hasCustomFields) {
        for (const cf of customFields) {
          const val = cf.sourceType === 'literal' ? cf.sourceValue : resolveSourceValue(el, cf.sourceValue);
          entry[cf.fieldName] = val;
        }
      } else {
        for (const k of Object.keys(el.attributes)) {
          entry[k] = el.attributes[k];
        }
      }
      out[el.name] = entry;
    }
    return out;
  }, [exportedElements, mode, outputFieldMap]);

  function handleSaveProfile(name) {
    const profile = {name, filters, attributes, priority, mode, outputFieldMap};
    const updated = [...profiles.filter((p) => p.name !== name), profile];
    setProfiles(updated);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSelectedProfile(name);
  }

  function handleLoadProfile(name) {
    const p = profiles.find((pp) => pp.name === name);
    if (!p) return;
    setFilters(p.filters);
    setAttributes(p.attributes);
    setPriority(p.priority);
    setMode(p.mode);
    setOutputFieldMap(p.outputFieldMap || {customFields: []});
    setSelectedProfile(name);
  }

  function handleDeleteProfile(name) {
    const updated = profiles.filter((p) => p.name !== name);
    setProfiles(updated);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSelectedProfile(null);
  }

  function handleClearSelection() {
    // Clear selected profile and reset to defaults so preview shows default attributes
    setSelectedProfile(null);
    setOutputFieldMap({customFields: []});
    setFilters(DEFAULT_FILTERS.slice());
    setAttributes(DEFAULT_ATTRIBUTES.slice(0, 6));
    setPriority(DEFAULT_PRIORITY.slice());
    setMode('array');
  }

  function confirmSaveProfile(name) {
    Modal.confirm({
      title: 'Save profile',
      content: `Save profile "${name}"?`,
      okText: 'Save',
      cancelText: 'Cancel',
      onOk() {
        handleSaveProfile(name);
      },
    });
  }

  function confirmDeleteProfile(name) {
    Modal.confirm({
      title: 'Delete profile',
      content: `Delete profile "${name}"?`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk() {
        handleDeleteProfile(name);
      },
    });
  }

  function handleExportProfiles() {
    // Export only the currently selected profile (do not export all profiles)
    if (!selectedProfile) return;
    const profile = profiles.find((p) => p.name === selectedProfile);
    if (!profile) return;
    const content = JSON.stringify(profile, null, 2);
    const href = `data:text/json;charset=utf-8,${encodeURIComponent(content)}`;
    const filename = `export-profile-${profile.name}-${new Date().toISOString()}.json`;
    downloadFile(href, filename);
  }

   function isValidProfile(profile) {
     if (!profile || typeof profile !== 'object') return false;
     if (typeof profile.name !== 'string' || !profile.name.trim()) return false;
     if (!Array.isArray(profile.filters)) return false;
     if (!Array.isArray(profile.attributes)) return false;
     if (!Array.isArray(profile.priority)) return false;
     if (typeof profile.mode !== 'string' || !['array', 'object'].includes(profile.mode)) return false;
     if (!profile.outputFieldMap || typeof profile.outputFieldMap !== 'object') return false;
     if (!Array.isArray(profile.outputFieldMap.customFields)) return false;
     return true;
   }

   function handleImportProfiles(fileList) {
     if (!fileList || !fileList[0]) return;
     const file = fileList[0];
     const reader = new FileReader();
     reader.onload = (e) => {
       try {
         const imported = JSON.parse(e.target.result);
         // Support importing either an array of profiles or a single profile object
         let importedArray = [];
         if (Array.isArray(imported)) {
           importedArray = imported;
         } else if (imported && typeof imported === 'object') {
           importedArray = [imported];
         }

         // Validate all profiles before importing
         const validProfiles = importedArray.filter((p) => {
           if (!isValidProfile(p)) {
             console.warn(`Invalid profile format: ${p?.name || 'unknown'}`, p);
             return false;
           }
           return true;
         });

         if (!validProfiles.length) {
           alert('No valid profiles found in the imported file. Please check the file format.');
           return;
         }

         if (validProfiles.length < importedArray.length) {
           alert(`Warning: ${importedArray.length - validProfiles.length} invalid profile(s) were skipped.`);
         }

         const merged = [...profiles, ...validProfiles.filter((p) => !profiles.find((pp) => pp.name === p.name))];
         setProfiles(merged);
         window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
         // reset file input
         const fileInput = document.getElementById('profileImportInput');
         if (fileInput) fileInput.value = '';
       } catch (err) {
         alert('Failed to import profiles: ' + err.message);
       }
     };
     reader.readAsText(file);
   }

  function handleExport() {
    const content = JSON.stringify(preview, null, 2);
    const href = `data:text/json;charset=utf-8,${encodeURIComponent(content)}`;
    const filename = `custom-export-${new Date().toISOString()}.json`;
    downloadFile(href, filename);
  }

  return (
    <Modal open={open} onCancel={onClose} title="Custom Export" footer={null} width={1000}>
      <Space direction="vertical" style={{width: '100%'}} size="large">
        <div>
          <strong>Element Filters</strong>
          <Divider style={{margin: '8px 0'}} />
          <Checkbox.Group value={filters} onChange={(v) => setFilters(v)}>
            <Space>
              <Checkbox value="visible">Visible</Checkbox>
              <Checkbox value="enabled">Enabled</Checkbox>
              <Checkbox value="clickable">Clickable</Checkbox>
              <Checkbox value="focusable">Focusable</Checkbox>
              <Checkbox value="selected">Selected</Checkbox>
              <Checkbox value="checkable">Checkable</Checkbox>
            </Space>
          </Checkbox.Group>
        </div>

        <div>
          <strong>Attribute Selection</strong>
          <Divider style={{margin: '8px 0'}} />
          <Checkbox.Group value={attributes} onChange={(v) => setAttributes(v)}>
            <Space wrap>
              {DEFAULT_ATTRIBUTES.map((a) => (
                <Checkbox key={a} value={a}>{a}</Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        </div>

        <div>
          <strong>Locator Configuration (priority)</strong>
          <Divider style={{margin: '8px 0'}} />
          <Space>
            {DEFAULT_PRIORITY.map((_, idx) => (
              <Select
                key={idx}
                value={priority[idx]}
                onChange={(val) => {
                  const copy = [...priority];
                  copy[idx] = val;
                  setPriority(copy);
                }}
                options={DEFAULT_PRIORITY.map((p) => ({value: p, label: p}))}
                style={{width: 180}}
              />
            ))}
          </Space>
        </div>

        <div>
          <strong>Output Mode</strong>
          <Divider style={{margin: '8px 0'}} />
          <Radio.Group value={mode} onChange={(e) => setMode(e.target.value)}>
            <Radio value="object">Object</Radio>
            <Radio value="array">Array</Radio>
          </Radio.Group>
        </div>

        <div>
          <strong>Custom Output Fields</strong>
          <Divider style={{margin: '8px 0'}} />
          <div style={{fontSize: 12, color: '#999', marginBottom: 8}}>Define your custom fields. If empty, selected attributes will be exported.</div>
          <div style={{marginTop: 8}}>
            <Space>
              <Input placeholder="Field name (e.g. key)" value={newCustomField.fieldName} onChange={(e) => setNewCustomField({...newCustomField, fieldName: e.target.value})} style={{width: 200}} />
              <Select value={newCustomField.sourceType} onChange={(v) => setNewCustomField({...newCustomField, sourceType: v})} style={{width: 100}} options={[{value: 'source', label: 'source'},{value: 'literal', label: 'literal'}]} />
              {newCustomField.sourceType === 'source' ? (
                <Select value={newCustomField.sourceValue} onChange={(v) => setNewCustomField({...newCustomField, sourceValue: v})} style={{width: 280}} options={[
                  {value: 'name', label: 'name'}, {value: 'locatorValue', label: 'locatorValue'}, {value: 'locatorStrategy', label: 'locatorStrategy'}, {value: 'className', label: 'className'}, {value: 'text', label: 'text'}, {value: 'resourceId', label: 'resourceId'}, {value: 'accessibilityId', label: 'accessibilityId'}, {value: 'xpath', label: 'xpath'}
                ]} />
              ) : (
                <Input placeholder="Literal value" value={newCustomField.sourceValue} onChange={(e) => setNewCustomField({...newCustomField, sourceValue: e.target.value})} style={{width: 280}} />
              )}
              <Button onClick={() => {
                if (!newCustomField.fieldName) return;
                setOutputFieldMap({...outputFieldMap, customFields: [...(outputFieldMap.customFields||[]), newCustomField]});
                setNewCustomField({fieldName: '', sourceType: 'source', sourceValue: 'locatorValue'});
              }}>Add</Button>
            </Space>
          </div>
          <div style={{marginTop: 12}}>
            {(outputFieldMap.customFields||[]).map((cf, idx) => (
              <Space key={idx} style={{display: 'flex', alignItems: 'center', marginBottom: 6}}>
                <div style={{width: 150, fontWeight: 600}}>{cf.fieldName}</div>
                <div style={{width: 360}}>{cf.sourceType === 'literal' ? (`"${cf.sourceValue}"`) : cf.sourceValue}</div>
                <Button danger size="small" onClick={() => {
                  const copy = (outputFieldMap.customFields||[]).slice(); copy.splice(idx,1);
                  setOutputFieldMap({...outputFieldMap, customFields: copy});
                }}>Remove</Button>
              </Space>
            ))}
          </div>
        </div>

        <div>
          <strong>Export Profile</strong>
          <Divider style={{margin: '8px 0'}} />
          <Space direction="vertical" style={{width: '100%'}}>
            <Space>
                <Select
                  value={selectedProfile}
                  onChange={(val) => (val ? handleLoadProfile(val) : handleClearSelection())}
                  allowClear
                  placeholder="Load a profile"
                  style={{width: 350}}
                  options={profiles.map((p) => ({value: p.name, label: p.name}))}
                />
              <Input placeholder="Profile name" id="profileName" style={{width: 200}} />
              <Button onClick={() => {
                const el = document.getElementById('profileName');
                if (!el) return;
                const name = el.value.trim();
                if (!name) return;
                Modal.confirm({
                  title: 'Save profile',
                  content: `Save profile "${name}"?`,
                  okText: 'Save',
                  cancelText: 'Cancel',
                  onOk() {
                    handleSaveProfile(name);
                    el.value='';
                  },
                });
              }}>Save Profile</Button>
              <Button danger onClick={() => {
                if (!selectedProfile) return;
                Modal.confirm({
                  title: 'Delete profile',
                  content: `Delete profile "${selectedProfile}"? This cannot be undone.`,
                  okText: 'Delete',
                  okType: 'danger',
                  cancelText: 'Cancel',
                  onOk() {
                    handleDeleteProfile(selectedProfile);
                  },
                });
              }} disabled={!selectedProfile}>Delete</Button>
              <Button onClick={handleClearSelection} disabled={!selectedProfile}>Clear Selection</Button>
            </Space>
            <Space>
               <Button onClick={handleExportProfiles} disabled={!selectedProfile}>Export Profile</Button>
              <input type="file" id="profileImportInput" accept=".json" style={{display: 'none'}} onChange={(e) => handleImportProfiles(e.target.files)} />
              <Button onClick={() => document.getElementById('profileImportInput').click()}>Import Profiles</Button>
            </Space>
          </Space>
        </div>

        <div>
          <strong>Preview</strong>
          <Divider style={{margin: '8px 0'}} />
          <pre style={{maxHeight: 350, overflow: 'auto', background: '#f6f6f6', padding: 12, borderRadius: 4}}>
            {JSON.stringify(preview, null, 2)}
          </pre>
        </div>

        <Space style={{display: 'flex', justifyContent: 'flex-end'}}>
          <Button onClick={onClose}>Close</Button>
          <Button type="primary" onClick={handleExport}>Export</Button>
        </Space>
      </Space>
    </Modal>
  );
}

