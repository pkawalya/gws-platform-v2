<?php

namespace App\Traits;

trait PrefillsContextFromUrl
{
    /**
     * Prefill a property from a URL query parameter with whitelist validation.
     *
     * Reads the given query parameter from the current request and returns
     * its value only if it appears in the allowed values list; otherwise
     * returns the default. Used for deep-linking into specific UI sections.
     *
     * @param  string  $param  The query parameter name (e.g. 'block')
     * @param  array  $allowedValues  Whitelist of acceptable values
     * @param  string  $default  Fallback value when the param is missing or invalid
     * @return string The validated value or default
     */
    public function prefillFromUrl(string $param, array $allowedValues, string $default): string
    {
        $value = request()->query($param, $default);

        return in_array($value, $allowedValues, true) ? $value : $default;
    }
}
