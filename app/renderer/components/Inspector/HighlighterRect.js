import React, { Component } from 'react';
import InspectorCSS from './Inspector.css';

/**
 * Absolute positioned divs that overlay the app screenshot and highlight the bounding
 * boxes of the elements in the app
 */
export default class HighlighterRect extends Component {

  render () {
    const {selectedElement = {}, selectHoveredElement, unselectHoveredElement, hoveredElement = {}, selectElement, unselectElement, element,
           scaleRatio, xOffset, elLocation, elSize, dimensions} = this.props;
    const {path: hoveredPath} = hoveredElement;
    const {path: selectedPath} = selectedElement;

    let width, height, left, top, highlighterClasses, key;
    highlighterClasses = [InspectorCSS['highlighter-box']];

    if (element) {
      ({width, height, left, top} = dimensions);

      // Add class + special classes to hovered and selected elements
      if (hoveredPath === element.path) {
        highlighterClasses.push(InspectorCSS['hovered-element-box']);
      }
      if (selectedPath === element.path) {
        highlighterClasses.push(InspectorCSS['inspected-element-box']);
      }
      key = element.path;
    } else if (elLocation && elSize) {
      width = elSize.width / scaleRatio;
      height = elSize.height / scaleRatio;
      top = elLocation.y / scaleRatio;
      left = elLocation.x / scaleRatio + xOffset;
      // Unique keys are assigned to elements by their x & y coordinates
      key = `searchedForElement{x: ${elLocation.x}, y: ${elLocation.y}}`;
      highlighterClasses.push(InspectorCSS['inspected-element-box']);
    }
    return <div className={highlighterClasses.join(' ').trim()}
      onMouseOver={() => selectHoveredElement(key)}
      onMouseOut={unselectHoveredElement}
      onClick={() => key === selectedPath ? unselectElement() : selectElement(key)}
      key={key}
      style={{left: (left || 0), top: (top || 0), width: (width || 0), height: (height || 0)}}>
      <div></div>
    </div>;
  }
}