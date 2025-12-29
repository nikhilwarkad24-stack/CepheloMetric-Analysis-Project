
'use server';

/**
 * @fileOverview A client for an external AI service to detect cephalometric landmarks.
 *
 * - detectLandmarks - A function that calls the external landmark detection API.
 * - DetectLandmarksInput - The input type for the detectLandmarks function.
 * - DetectLandmarksOutput - The return type for the detectLandmarks function.
 */

import {
  DetectLandmarksInput,
  DetectLandmarksOutput,
  DetectLandmarksOutputSchema,
} from '@/ai/types';

// This is a placeholder URL for your Python backend.
// Replace it with the actual URL of your API endpoint.
const LANDMARK_DETECTION_API_URL = 'http://127.0.0.1:5000/detect';

export async function detectLandmarks(
  input: DetectLandmarksInput
): Promise<DetectLandmarksOutput> {

  const response = await fetch(LANDMARK_DETECTION_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      // The body structure depends on your Python API.
      // We'll send the data URI as a string.
      image_data_uri: input.photoDataUri,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `API request failed with status ${response.status}: ${errorBody}`
    );
  }

  const result = await response.json();

  // Validate the response from the server against our Zod schema
  const parsedResult = DetectLandmarksOutputSchema.safeParse(result);

  if (!parsedResult.success) {
    console.error('Invalid data received from backend:', parsedResult.error);
    throw new Error('Invalid data format received from the detection service.');
  }

  return parsedResult.data;
}
