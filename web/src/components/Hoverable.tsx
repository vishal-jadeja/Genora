"use client";

import { CSSProperties, ElementType, useState } from "react";

// React warns if a rerender removes a shorthand (`border`) while a
// longhand (`borderColor`) from a hover/focus overlay stays set, or vice
// versa. Expand `border` to its longhand parts up front so merges never mix
// shorthand and non-shorthand for the same property.
function expandBorderShorthand(style: CSSProperties): CSSProperties {
  if (!style.border) return style;
  const [width, borderStyle, ...colorParts] = style.border
    .toString()
    .split(" ");
  const rest = { ...style };
  delete rest.border;
  return {
    borderWidth: width,
    borderStyle: borderStyle,
    borderColor: colorParts.join(" "),
    ...rest,
  };
}

interface HoverableProps {
  as?: ElementType;
  style?: CSSProperties;
  hoverStyle?: CSSProperties;
  focusStyle?: CSSProperties;
  [key: string]: unknown;
}

/**
 * Generic element that merges base/hover/focus inline styles, mirroring the
 * design source's `style-hover` / `style-focus` attributes (which the
 * claude.ai design-tool runtime applies via JS, not real CSS).
 */
export function Hoverable({
  as = "button",
  style,
  hoverStyle,
  focusStyle,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...rest
}: HoverableProps) {
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const Tag = as as React.ElementType;

  const merged: CSSProperties = expandBorderShorthand({
    ...style,
    ...(hover ? hoverStyle : null),
    ...(focus ? focusStyle : null),
  });

  return (
    <Tag
      style={merged}
      onMouseEnter={(e: React.MouseEvent) => {
        setHover(true);
        (onMouseEnter as React.MouseEventHandler | undefined)?.(e);
      }}
      onMouseLeave={(e: React.MouseEvent) => {
        setHover(false);
        (onMouseLeave as React.MouseEventHandler | undefined)?.(e);
      }}
      onFocus={(e: React.FocusEvent) => {
        setFocus(true);
        (onFocus as React.FocusEventHandler | undefined)?.(e);
      }}
      onBlur={(e: React.FocusEvent) => {
        setFocus(false);
        (onBlur as React.FocusEventHandler | undefined)?.(e);
      }}
      {...rest}
    />
  );
}
