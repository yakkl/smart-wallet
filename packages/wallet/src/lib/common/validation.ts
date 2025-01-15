/* eslint-disable @typescript-eslint/no-explicit-any */
import type { BigNumberish } from '$lib/common/bignumber';
import { safeConvertToBigInt } from './math';
import type { SwapPriceData, SwapToken } from '$lib/common/interfaces';

// Validation Types
export type ValidationRuleType =
  | 'number'
  | 'bigint'
  | 'string'
  | 'boolean'
  | 'array'
  | 'object'
  | 'bignumberish';

// Validation Constraint Types
export type ValidationConstraint<T> = {
  type?: ValidationRuleType;
  required?: boolean;
  min?: T;
  max?: T;
  equals?: T;
  notEquals?: T;
  oneOf?: T[];
  notOneOf?: T[];
  customValidation?: ( value: T ) => boolean;
};

// Generic Validation Rules Type
export type ValidationRules<T> = {
  [ K in keyof T ]?: ValidationConstraint<T[ K ]>;
};

// Validation Result
export interface ValidationResult {
  isValid: boolean;
  error: string;
}

/**
 * Generic object validation function
 * @param data Object to validate
 * @param rules Validation rules for the object
 * @returns Validation result
 */
export function validateObject<T extends Record<string, any>>(
  data: T,
  rules: ValidationRules<T>
): ValidationResult {
  // Validation function for a single rule
  const validateValue = <V>( value: V, rule: ValidationConstraint<V> ): boolean => {
    // Handle undefined or null
    if ( value === undefined || value === null ) {
      return !rule.required;
    }

    let bigIntValue: bigint | undefined;

    // Type checking with more robust handling
    if ( rule.type ) {
      switch ( rule.type ) {
        case 'number':
          if ( typeof value !== 'number' || isNaN( value as number ) ) return false;
          break;
        case 'bigint':
        case 'bignumberish':
          bigIntValue = safeConvertToBigInt( value as BigNumberish );
          if ( bigIntValue === undefined ) return false;
          // Reassign value for further checks
          value = bigIntValue as V;
          break;
        case 'string':
          if ( typeof value !== 'string' ) return false;
          break;
        case 'boolean':
          if ( typeof value !== 'boolean' ) return false;
          break;
        case 'array':
          if ( !Array.isArray( value ) ) return false;
          break;
        case 'object':
          if ( typeof value !== 'object' || value === null ) return false;
          break;
      }
    }

    // Min/Max validation with safe bigint conversion
    if ( rule.min !== undefined ) {
      if ( typeof rule.min === 'number' && ( value as number ) < ( rule.min as number ) ) return false;

      // For bigint and bignumberish
      if ( rule.type === 'bigint' || rule.type === 'bignumberish' ) {
        const minBigInt = safeConvertToBigInt( rule.min as BigNumberish );
        const valueBigInt = safeConvertToBigInt( value as BigNumberish );

        if ( minBigInt === undefined || valueBigInt === undefined ) return false;
        if ( valueBigInt < minBigInt ) return false;
      }
    }

    if ( rule.max !== undefined ) {
      if ( typeof rule.max === 'number' && ( value as number ) > ( rule.max as number ) ) return false;

      // For bigint and bignumberish
      if ( rule.type === 'bigint' || rule.type === 'bignumberish' ) {
        const maxBigInt = safeConvertToBigInt( rule.max as BigNumberish );
        const valueBigInt = safeConvertToBigInt( value as BigNumberish );

        if ( maxBigInt === undefined || valueBigInt === undefined ) return false;
        if ( valueBigInt > maxBigInt ) return false;
      }
    }

    // Equality checks
    if ( rule.equals !== undefined && value !== rule.equals ) return false;
    if ( rule.notEquals !== undefined && value === rule.notEquals ) return false;

    // One of / Not One of checks
    if ( rule.oneOf !== undefined && !rule.oneOf.includes( value ) ) return false;
    if ( rule.notOneOf !== undefined && rule.notOneOf.includes( value ) ) return false;

    // Custom validation
    if ( rule.customValidation && !rule.customValidation( value ) ) return false;

    return true;
  };

  // Validate all rules
  for ( const [ key, rule ] of Object.entries( rules ) ) {
    const value = data[ key ];

    if ( !validateValue( value, rule as ValidationConstraint<any> ) ) {
      // Generate user-friendly error message
      let errorMessage = `Invalid ${ key }: `;

      if ( value === undefined || value === null ) {
        errorMessage += ( rule as ValidationConstraint<any> ).required
          ? 'is required'
          : 'is missing but not required';
      } else {
        const currentRule = rule as ValidationConstraint<any>;
        if ( currentRule.min !== undefined ) errorMessage += `must be at least ${ currentRule.min }`;
        if ( currentRule.max !== undefined ) errorMessage += `must be at most ${ currentRule.max }`;
        if ( currentRule.equals !== undefined ) errorMessage += `must equal ${ currentRule.equals }`;
        if ( currentRule.notEquals !== undefined ) errorMessage += `cannot equal ${ currentRule.notEquals }`;
        if ( currentRule.oneOf !== undefined ) errorMessage += `must be one of ${ currentRule.oneOf.join( ', ' ) }`;
        if ( currentRule.notOneOf !== undefined ) errorMessage += `cannot be one of ${ currentRule.notOneOf.join( ', ' ) }`;
      }

      return {
        isValid: false,
        error: errorMessage
      };
    }
  }

  return {
    isValid: true,
    error: ''
  };
}

// Specific validation for SwapQuote
export function validateSwapQuote( quote: SwapPriceData ): ValidationResult {
  return validateObject( quote, {
    amountIn: {
      required: true,
      type: 'bignumberish',
      min: 0n,
      customValidation: ( amount: BigNumberish ) => {
        const bigIntAmount = safeConvertToBigInt( amount );
        return bigIntAmount !== undefined && bigIntAmount > 0n;
      }
    },
    amountOut: {
      required: true,
      type: 'bignumberish',
      min: 0n,
      customValidation: ( amount: BigNumberish ) => {
        const bigIntAmount = safeConvertToBigInt( amount );
        return bigIntAmount !== undefined && bigIntAmount > 0n;
      }
    },
    tokenIn: {
      required: true,
      type: 'object',
      customValidation: ( token: SwapToken ) => {
        return !!( token && token.address && token.symbol );
      }
    },
    tokenOut: {
      required: true,
      type: 'object',
      customValidation: ( token: SwapToken ) => {
        return !!( token && token.address && token.symbol );
      }
    },
    fee: {
      oneOf: [ 500, 3000, 10000 ]
    },
  } );
}


// Comprehensive example usages below...
// function exampleUsage() {
//   const swapQuote: SwapPriceData = { /* your swap quote data */ };
//   const validationResult = validateSwapQuote( swapQuote );

//   if ( !validationResult.isValid ) {
//     console.log( 'Validation failed:', validationResult.error );
//   }
// }

// function exampleUsage() {
//   // Basic object validation
//   interface User {
//     name: string;
//     age: number;
//     email?: string;
//   }

//   const user: User = {
//     name: 'John Doe',
//     age: 30
//   };

//   const userValidation = validateObject( user, {
//     name: {
//       required: true,
//       type: 'string',
//       min: 2,
//       max: 50
//     },
//     age: {
//       required: true,
//       type: 'number',
//       min: 18,
//       max: 120
//     },
//     email: {
//       type: 'string',
//       customValidation: ( email ) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test( email )
//     }
//   } );

//   // Swap quote validation
//   const swapQuote: SwapPriceData = { /* your swap quote data */ };
//   const swapValidation = validateSwapQuote( swapQuote );

//   // Advanced validation with multiple constraints
//   interface Product {
//     name: string;
//     price: number;
//     categories: string[];
//   }

//   const product: Product = {
//     name: 'Awesome Product',
//     price: 19.99,
//     categories: [ 'Electronics', 'Gadgets' ]
//   };

//   const productValidation = validateObject( product, {
//     name: {
//       required: true,
//       type: 'string',
//       min: 3,
//       max: 100
//     },
//     price: {
//       required: true,
//       type: 'number',
//       min: 0,
//       max: 1000
//     },
//     categories: {
//       type: 'array',
//       customValidation: ( cats ) => cats.length > 0,
//       oneOf: [ 'Electronics', 'Clothing', 'Books', 'Gadgets' ]
//     }
//   } );

//   // Logging results
//   console.log( 'User Validation:', userValidation );
//   console.log( 'Swap Quote Validation:', swapValidation );
//   console.log( 'Product Validation:', productValidation );
// }
