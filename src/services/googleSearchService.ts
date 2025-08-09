interface GoogleSearchResult {
  title: string;
  link: string;
  snippet: string;
}

interface GoogleSearchResponse {
  items?: GoogleSearchResult[];
  searchInformation?: {
    totalResults: string;
    searchTime: number;
  };
}

class GoogleSearchService {
  private apiKey: string | null = null;
  private searchEngineId: string | null = null;

  constructor() {
    this.apiKey = process.env.REACT_APP_GOOGLE_SEARCH_API_KEY || null;
    this.searchEngineId = process.env.REACT_APP_GOOGLE_SEARCH_ENGINE_ID || null;
  }

  public isConfigured(): boolean {
    return this.apiKey !== null && this.searchEngineId !== null;
  }

  public async searchDrug(drugName: string, additionalTerms: string = ''): Promise<GoogleSearchResult[]> {
    if (!this.isConfigured()) {
      console.warn('Google Search API is not configured. Skipping search enhancement.');
      return [];
    }

    const query = `${drugName} drug medication ${additionalTerms} mechanism action uses side effects`.trim();
    const url = `https://www.googleapis.com/customsearch/v1?key=${this.apiKey}&cx=${this.searchEngineId}&q=${encodeURIComponent(query)}&num=5`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Google Search API error: ${response.status} ${response.statusText}`);
      }

      const data: GoogleSearchResponse = await response.json();
      return data.items || [];
    } catch (error: any) {
      console.error('Error searching with Google API:', error);
      // Don't throw error, just return empty results to allow Gemini to work without search
      return [];
    }
  }

  public async enhanceDrugPrompt(drugName: string): Promise<string> {
    if (!this.isConfigured()) {
      return '';
    }

    try {
      const searchResults = await this.searchDrug(drugName, 'pharmacology medical');
      
      if (searchResults.length === 0) {
        return '';
      }

      // Extract relevant information from search results
      const searchContext = searchResults
        .slice(0, 3) // Use top 3 results
        .map(result => `${result.title}: ${result.snippet}`)
        .join('\n\n');

      return `\n\nAdditional context from medical sources:\n${searchContext}\n\nUse this context to enhance the accuracy and completeness of the drug information.`;
    } catch (error) {
      console.error('Error enhancing prompt with search:', error);
      return '';
    }
  }

  public formatSearchResults(results: GoogleSearchResult[]): string {
    if (results.length === 0) {
      return 'No additional search results available.';
    }

    return results
      .map((result, index) => `${index + 1}. ${result.title}\n   ${result.snippet}\n   Source: ${result.link}`)
      .join('\n\n');
  }
}

// Export a singleton instance
export const googleSearchService = new GoogleSearchService();
export default googleSearchService;