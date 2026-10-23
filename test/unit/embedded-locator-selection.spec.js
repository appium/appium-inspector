import {describe, expect, it, vi} from 'vitest';

import {
  applyRecorderSelection,
  applyRecorderSelectorEdit,
  selectionForCandidate,
  selectionForStrategy,
} from '../../app/common/renderer/components/SessionInspector/SourceTab/SelectedElement/EmbeddedRecorderSelection.jsx';
import {getLocatorCandidateRowProps} from '../../app/common/renderer/components/SessionInspector/SourceTab/SelectedElement/SelectedElementLocatorsTable.jsx';
import {
  getClipboardFeedback,
  handleCopyCellClick,
} from '../../app/common/renderer/components/SessionInspector/SourceTab/SelectedElement/SelectedElementTableCell.jsx';
import {CLIPBOARD_COPY_STATUS} from '../../app/common/renderer/utils/other.js';

const candidates = [
  {id: 'id-primary', strategy: 'id', selector: 'login', priority: 10},
  {id: 'xpath-primary', strategy: 'xpath', selector: '//*[@text="Login"]', priority: 70},
  {id: 'xpath-secondary', strategy: 'xpath', selector: '//android.widget.Button[1]', priority: 1000},
];

describe('embedded locator selection synchronization', function () {
  it('selects the exact row even when multiple candidates share a strategy', function () {
    expect(selectionForCandidate(candidates[2])).toEqual({
      strategy: 'xpath',
      selector: '//android.widget.Button[1]',
    });
  });

  it('selects the highest-priority candidate when the strategy changes', function () {
    expect(selectionForStrategy(candidates, 'xpath')).toEqual({
      strategy: 'xpath',
      selector: '//*[@text="Login"]',
    });
  });

  it('updates both visible fields and invalidates old feedback on row or strategy changes', function () {
    const setters = {
      setStrategy: vi.fn(),
      setSelector: vi.fn(),
      setFeedback: vi.fn(),
    };
    applyRecorderSelection(selectionForCandidate(candidates[2]), setters);

    expect(setters.setStrategy).toHaveBeenCalledWith('xpath');
    expect(setters.setSelector).toHaveBeenCalledWith('//android.widget.Button[1]');
    expect(setters.setFeedback).toHaveBeenCalledWith(null);
  });

  it('allows manual selector edits and invalidates feedback for the old value', function () {
    const setters = {setSelector: vi.fn(), setFeedback: vi.fn()};
    applyRecorderSelectorEdit('manually edited selector', setters);

    expect(setters.setSelector).toHaveBeenCalledWith('manually edited selector');
    expect(setters.setFeedback).toHaveBeenCalledWith(null);
  });

  it.each(['Enter', ' '])('activates a candidate row with the %j key', function (key) {
    const selectCandidate = vi.fn();
    const preventDefault = vi.fn();
    const rowProps = getLocatorCandidateRowProps(candidates[1], {
      activeCandidateId: 'xpath-primary',
      selectCandidate,
    });

    expect(rowProps['aria-selected']).toBe(true);
    expect(rowProps.tabIndex).toBe(0);
    rowProps.onKeyDown({key, preventDefault});
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(selectCandidate).toHaveBeenCalledWith(candidates[1]);
  });

  it('activates a candidate on click without invoking recorder transfer', function () {
    const selectCandidate = vi.fn();
    const transfer = vi.fn();
    const rowProps = getLocatorCandidateRowProps(candidates[2], {
      activeCandidateId: 'id-primary',
      selectCandidate,
      transfer,
    });

    rowProps.onClick();
    expect(selectCandidate).toHaveBeenCalledOnce();
    expect(selectCandidate).toHaveBeenCalledWith(candidates[2]);
    expect(transfer).not.toHaveBeenCalled();
  });

  it('shows success feedback only for a successful clipboard result', function () {
    const t = (text) => text;

    expect(getClipboardFeedback({status: CLIPBOARD_COPY_STATUS.SUCCESS}, t)).toEqual({
      title: 'Copied!',
      color: 'green',
    });
    expect(getClipboardFeedback({status: CLIPBOARD_COPY_STATUS.FAILURE, error: new Error('denied')}, t)).toEqual({
      title: 'Copy failed',
      color: 'red',
    });
    expect(
      getClipboardFeedback({status: CLIPBOARD_COPY_STATUS.UNAVAILABLE, error: new Error('unavailable')}, t),
    ).toEqual({title: 'Copy failed', color: 'red'});
  });

  it('keeps the copy control action separate from row selection', function () {
    const stopPropagation = vi.fn();
    const copyText = vi.fn();

    handleCopyCellClick({stopPropagation}, copyText);

    expect(stopPropagation).toHaveBeenCalledOnce();
    expect(copyText).toHaveBeenCalledOnce();
  });
});
