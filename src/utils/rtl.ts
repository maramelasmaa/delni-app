/**
 * RTL (Right-to-Left) Utilities for Arabic UI
 * Provides helpers for directional styling in Arabic language contexts
 *
 * The app uses manual per-component RTL mirroring rather than I18nManager.forceRTL()
 * to avoid double-flipping by the OS. Every horizontal layout uses flexDirection: 'row-reverse'.
 */

import { ViewStyle, TextStyle } from 'react-native';

/**
 * Converts position object to use start/end instead of left/right
 * Useful for badges and overlays that need to be positioned from one edge
 *
 * @param position The absolute position (right/left values)
 * @returns Updated position with start value (which flows right-to-left in RTL)
 */
export function rtlPosition(position: { right?: number; left?: number }): { start?: number } {
  // Since we're using manual RTL (not I18nManager.forceRTL), right=X becomes start=X
  if (position.right !== undefined) {
    return { start: position.right };
  }
  if (position.left !== undefined) {
    return { start: position.left };
  }
  return {};
}

/**
 * Returns style object for a badge positioned in the top-right corner (RTL-aware)
 * Used for featured badges, notification badges, etc.
 */
export function rtlTopRightBadge(value?: number): ViewStyle {
  return {
    position: 'absolute',
    top: value ?? 12,
    start: value ?? 12, // 'start' automatically maps to 'right' in RTL context
    zIndex: 10,
  };
}

/**
 * Returns style object for a badge positioned in the top-left corner (RTL-aware)
 * Used for checkmarks, selection indicators on the opposite side
 */
export function rtlTopLeftBadge(value?: number): ViewStyle {
  return {
    position: 'absolute',
    top: value ?? 6,
    end: value ?? 6, // 'end' automatically maps to 'left' in RTL context
    zIndex: 10,
  };
}

/**
 * Creates a horizontal row layout that works in RTL context
 * Automatically applies flexDirection: 'row-reverse' for right-to-left flow
 */
export function rtlRow(): ViewStyle {
  return {
    flexDirection: 'row-reverse',
  };
}

/**
 * Creates a horizontal scroll layout for pills, tags, filters that start from the right
 * Includes reverse direction and gap handling
 */
export function rtlHorizontalScroll(gap: number = 8): ViewStyle {
  return {
    flexDirection: 'row-reverse',
    gap,
  };
}

/**
 * Fixes text alignment for Arabic content
 * Always right-aligned in RTL (which is the manual RTL context)
 */
export function rtlText(): TextStyle {
  return {
    textAlign: 'right',
    writingDirection: 'rtl',
  };
}
