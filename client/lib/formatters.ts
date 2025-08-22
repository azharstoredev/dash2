/**
 * Currency formatting utilities for the application
 * Handles BHD (Bahraini Dinar) with 3 decimal places as required
 */

interface CurrencyFormatOptions {
  showSymbol?: boolean;
  spaceBetween?: boolean;
  locale?: string;
}

/**
 * Formats currency amounts for BHD with proper 3 decimal places
 * @param amount The numeric amount to format
 * @param options Formatting options
 * @returns Formatted currency string (e.g., "3.350BD" or "BD 3.350")
 */
export function formatBHD(
  amount: number,
  options: CurrencyFormatOptions = {},
): string {
  const { showSymbol = true, spaceBetween = false, locale = "en-BH" } = options;

  // Format to 3 decimal places for BHD
  const formattedAmount = Number(amount).toFixed(3);

  if (!showSymbol) {
    return formattedAmount;
  }

  const separator = spaceBetween ? " " : "";

  // For Arabic locale, show symbol after amount
  if (locale === "ar-BH" || locale === "ar") {
    return `${formattedAmount}${separator}د.ب`;
  }

  // For English locale, show BD after amount (standard BHD format)
  return `${formattedAmount}${separator}BD`;
}

/**
 * Gets currency formatting settings from localStorage
 */
export function getCurrencySettings(): {
  currencySymbol: string;
  currency: string;
  locale: string;
} {
  try {
    const savedSettings = localStorage.getItem("storeSettings");
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      return {
        currencySymbol: settings.currencySymbol || "BD",
        currency: settings.currency || "BHD",
        locale: settings.language || "en-BH",
      };
    }
  } catch (error) {
    console.warn("Error reading currency settings:", error);
  }

  return {
    currencySymbol: "BD",
    currency: "BHD",
    locale: "en-BH",
  };
}

/**
 * Formats price using current app settings
 * @param amount The amount to format
 * @param language Current language ("ar" or "en")
 * @returns Formatted price string
 */
export function formatPrice(amount: number, language?: string): string {
  const settings = getCurrencySettings();

  // Always use 3 decimal places for BHD
  const formattedAmount = Number(amount).toFixed(3);

  if (language === "ar") {
    return `${formattedAmount} د.ب`;
  }

  return `${formattedAmount}BD`;
}

/**
 * Formats price with custom currency symbol (for backward compatibility)
 * @param amount The amount to format
 * @param currencySymbol The currency symbol to use
 * @param language Current language
 * @returns Formatted price string
 */
export function formatPriceWithSymbol(
  amount: number,
  currencySymbol: string,
  language?: string,
): string {
  const formattedAmount = Number(amount).toFixed(3);

  if (language === "ar") {
    // Use Arabic currency symbol if available, otherwise use provided symbol
    const arabicSymbol = currencySymbol === "BD" ? "د.ب" : currencySymbol;
    return `${formattedAmount} ${arabicSymbol}`;
  }

  return `${formattedAmount}${currencySymbol}`;
}
