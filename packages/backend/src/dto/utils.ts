import { z } from 'zod';

export const isoDate = z.codec(
  z.any(),  // input schema: ISO date string
  z.any(),          // output schema: Date object
  {
    decode: (isoString) => new Date(isoString), // ISO string → Date
    encode: (date) => date.toISOString(),       // Date → ISO string
  }
)
