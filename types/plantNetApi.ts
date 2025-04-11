export interface PlantNetApiResponse {
  query: {
    project: string;
    images: string[];
    organs: string[];
    includeRelatedImages: boolean;
    noReject: boolean;
    type: string | null;
  };
  predictedOrgans: Array<{
    image: string;
    filename: string;
    organ: string;
    score: number;
  }>;
  language: string;
  preferedReferential: string;
  bestMatch: string;
  results: Array<{
    score: number;
    species: {
      scientificNameWithoutAuthor: string;
      scientificNameAuthorship: string;
      genus: {
        scientificNameWithoutAuthor: string;
        scientificNameAuthorship: string;
        scientificName: string;
      };
      family: {
        scientificNameWithoutAuthor: string;
        scientificNameAuthorship: string;
        scientificName: string;
      };
      commonNames: string[];
      scientificName: string;
    };
    gbif: {
      id: string;
    };
    powo: {
      id: string;
    };
  }>;
  version: string;
  remainingIdentificationRequests: number;
}

// 单个识别结果的类型定义
export interface PlantIdentificationResult {
  score: number;
  species: {
    scientificNameWithoutAuthor: string;
    scientificNameAuthorship: string;
    genus: {
      scientificNameWithoutAuthor: string;
      scientificNameAuthorship: string;
      scientificName: string;
    };
    family: {
      scientificNameWithoutAuthor: string;
      scientificNameAuthorship: string;
      scientificName: string;
    };
    commonNames: string[];
    scientificName: string;
  };
  gbif: {
    id: string;
  };
  powo: {
    id: string;
  };
}

// 器官预测的类型定义
export interface PredictedOrgan {
  image: string;
  filename: string;
  organ: string;
  score: number;
}

// 查询参数的类型定义
export interface PlantNetQuery {
  project: string;
  images: string[];
  organs: string[];
  includeRelatedImages: boolean;
  noReject: boolean;
  type: string | null;
} 