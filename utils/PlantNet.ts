import { PlantNetApiResponse } from '../types/plantNetApi';

// 使用 PlantNet API 识别植物
export const identifyPlantWithPlantNet = async (imageUri: string, apiKey: string): Promise<{
  success: boolean;
  scientificName: string;
  commonName: string;
  genus: string;
  family: string;
}> =>
{
  const formData = new FormData();

  // In React Native, we need to use the file URI directly
  // Create a file object with the URI
  const filenameParts = imageUri.split('/');
  const filename = filenameParts[filenameParts.length - 1];

  // Append the image as a file to the form data
  // The format required by PlantNet API
  formData.append('organs', 'auto');
  formData.append('images', {
    uri: imageUri,
    type: 'image/jpeg', // You might want to detect this dynamically based on the file
    name: filename || 'plant_image.jpg',
  } as any);
  const failData = {
    success: false,
    scientificName: '',
    commonName: '',
    genus: '',
    family: '',
  };
  try {
    const response = await fetch(
      "https://my-api.plantnet.org/v2/identify/all?include-related-images=false&no-reject=false&nb-results=1&lang=zh&api-key=" + apiKey,
      {
        method: "POST",
        headers: {
          "accept": "application/json",
          // Don't set Content-Type header, it will be set automatically with the correct boundary
        },
        body: formData,
      }
    );
    const data = await response.json();
    if (data.results?.length > 0) {
      const species = data.results[0].species;
      return {
        success: true,
        scientificName: species.scientificName,
        commonName: species.commonNames[0],
        genus: species.genus.scientificName,
        family: species.family.scientificName,
      };
    }
    return failData;
  } catch (error) {
    console.error('Error identifying plant:', error);
    return failData;
  }
};