import { PlantNetApiResponse } from '../types/plantNetApi';

// 使用 PlantNet API 识别植物
export const identifyPlantWithPlantNet = async (imageUri: string, apiKey: string): Promise<PlantNetApiResponse> => {
    const formData = new FormData();
    
    // In React Native, we need to use the file URI directly
    // Create a file object with the URI
    const filenameParts = imageUri.split('/');
    const filename = filenameParts[filenameParts.length - 1];
    
    // Append the image as a file to the form data
    // The format required by PlantNet API
    formData.append('images', {
      uri: imageUri,
      type: 'image/jpeg', // You might want to detect this dynamically based on the file
      name: filename || 'plant_image.jpg',
    } as any);
  
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
      
      if (!response.ok) {
        throw new Error(`PlantNet API error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error identifying plant:', error);
      throw error;
    }
  };