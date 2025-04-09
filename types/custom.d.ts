// Declaration file to extend HTML input element types
import React from 'react';

declare module 'react' {
  interface InputHTMLAttributes<T> {
    webkitdirectory?: string | boolean;
    directory?: string | boolean;
  }
}
