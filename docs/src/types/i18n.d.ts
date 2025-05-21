/**
 * Type definitions for i18n component interpolation
 */

import React from "react";

/**
 * Type for interpolation functions in Translate component values prop
 */
export type InterpolationFunction = (chunks: React.ReactNode) => JSX.Element;

/**
 * Type for values prop in Translate component
 */
export type TranslateValues = Record<
  string,
  InterpolationFunction | string | number
>;

/**
 * Example usage:
 *
 * ```tsx
 * import { InterpolationFunction, TranslateValues } from '../types/i18n';
 *
 * // Define your interpolation function with proper typing
 * const gradientText: InterpolationFunction = (chunks) => (
 *   <span className="gradient-text">{chunks}</span>
 * );
 *
 * // Use in your component
 * <Translate
 *   id="component.title"
 *   values={{ gradientText } as TranslateValues}
 * >
 *   {"Welcome to {gradientText}Our Platform{/gradientText}"}
 * </Translate>
 * ```
 */
