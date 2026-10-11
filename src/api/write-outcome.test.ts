import { describe, expect, it } from 'vitest';
import { ApiError } from './client';
import { writeWasRejected } from './write-outcome';

describe('corregir rechazos sin duplicar una escritura incierta', () => {
  it.each([400,403,409,413])('permite corregir un rechazo confirmado %i', status => {
    expect(writeWasRejected(new ApiError(status,'Rechazado'))).toBe(true);
  });
  it.each([new TypeError('Sin conexión'),new ApiError(503,'Sin acuse')])('conserva la operación cuando no se sabe si se guardó',error=>{
    expect(writeWasRejected(error)).toBe(false);
  });
});
