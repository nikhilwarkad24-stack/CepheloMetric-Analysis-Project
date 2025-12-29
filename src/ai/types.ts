
import { z } from 'zod';

const LandmarkSchema = z.object({
  id: z.string().describe('The unique identifier for the landmark (e.g., "S", "N", "A").'),
  name: z.string().describe('The full name of the landmark (e.g., "Sella", "Nasion").'),
  x: z.number().describe('The x-coordinate of the landmark on the image.'),
  y: z.number().describe('The y-coordinate of the landmark on the image.'),
});

export const DetectLandmarksInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a cephalogram, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
});
export type DetectLandmarksInput = z.infer<typeof DetectLandmarksInputSchema>;

export const DetectLandmarksOutputSchema = z.object({
  landmarks: z.array(LandmarkSchema).describe('An array of all 27 detected cephalometric landmarks.'),
});
export type DetectLandmarksOutput = z.infer<typeof DetectLandmarksOutputSchema>;
