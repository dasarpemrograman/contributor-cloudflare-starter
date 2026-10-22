import { describe, expect, it } from 'vitest';
import { greetingResponse } from './greeting';

describe('greeting', () => {
  it.each([null, '', '   '])('uses a useful default for %s', async (input) => {
    expect(await greetingResponse(input).json()).toEqual({
      message: 'Hello, contributor!',
    });
  });
  it('trims a supplied name', async () => {
    expect(await greetingResponse('  Ada  ').json()).toEqual({
      message: 'Hello, Ada!',
    });
  });
  it('accepts the documented limit and rejects longer names', () => {
    expect(greetingResponse('a'.repeat(80)).status).toBe(200);
    expect(greetingResponse('a'.repeat(81)).status).toBe(400);
  });
});
