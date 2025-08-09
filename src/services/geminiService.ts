import { GoogleGenerativeAI } from '@google/generative-ai';
import { Drug } from '../types/drug.types';

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor() {
    this.initializeGemini();
  }

  private initializeGemini() {
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('Gemini API key not found. Please set REACT_APP_GEMINI_API_KEY in your .env file');
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    } catch (error) {
      console.error('Failed to initialize Gemini AI:', error);
    }
  }

  public isConfigured(): boolean {
    return this.genAI !== null && this.model !== null;
  }

  public async generateDrugData(drugName: string, drugCount?: number): Promise<Drug[]> {
    if (!this.isConfigured()) {
      throw new Error('Gemini AI is not properly configured. Please check your API key.');
    }

    const prompt = this.buildPrompt(drugName, drugCount);

    try {
      // First try without Google Search grounding to test basic functionality
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Log response for debugging
      console.log('Gemini response received:', text.substring(0, 200) + '...');

      // Extract JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in Gemini response');
      }

      const drugData = JSON.parse(jsonMatch[0]);
      
      // Validate the response format
      if (!Array.isArray(drugData)) {
        throw new Error('Response is not an array of drugs');
      }

      // Validate each drug object
      drugData.forEach((drug: any, index: number) => {
        this.validateDrugObject(drug, index);
      });

      return drugData as Drug[];
    } catch (error: any) {
      console.error('Error generating drug data:', error);
      throw new Error(`Failed to generate drug data: ${error.message}`);
    }
  }

  private buildPrompt(drugName: string, drugCount?: number): string {
    const startId = drugCount != null ? drugCount + 1 : 1;
    
    return `You are a medical expert AI. Generate comprehensive drug information in the exact JSON format specified below.

IMPORTANT: Respond ONLY with valid JSON array. Do not include any explanatory text, markdown formatting, or code blocks.

Generate detailed drug information for: "${drugName}"

Required JSON Format:
[
  {
    "id": ${startId},                    // Required: Unique number
    "name": "Drug Name",        // Required: String
    "class": "Drug Class",      // Required: String
    "system": "Body System",    // Required: String
    "moa": "Mechanism",         // Required: String
    "uses": ["Use 1", "Use 2"], // Required: Array of strings
    "side_effects": ["SE 1"],   // Required: Array of strings
    "mnemonic": "Optional",     // Optional: String
    "contraindications": [],    // Optional: Array of strings
    "dosage": "Optional"        // Optional: String
  }
]

Body Systems (choose the most appropriate):
ANS (Autonomic Nervous System), CNS (Central Nervous System), CVS (Cardiovascular System), Renal, Respiratory, GIT (Gastrointestinal Tract), Endocrine, Reproductive, Hematological, Immune, Musculoskeletal, Antimicrobial, Antiparasitic, Antiviral, Antifungal, Anticancer, Dermatological, Vitamins, Toxicology, Miscellaneous, Vaccines
Here is classes of drug 
Drugs Acting on Autonomic Nervous System

Cholinergic Drugs, Anticholinergic Drugs, Ganglionic Stimulants, Ganglionic Blocking Agents, Adrenergic Drugs, a-Adrenergic Blocking Drugs, B-Adrenergic Blocking Drugs, Topical Drugs for Glaucoma

Autacoids and Related Drugs

Histaminergic Agonists, H 
1
​
 -Antagonists, 5-Hydroxytryptamine (5-HT) Antagonists, Drugs for Migraine, Prostaglandins (PGs), Nonsteroidal Antiinflammatory Drugs (NSAIDs)/Antipyretic Analgesics, Antirheumatoid Drugs, Drugs for Gout

Drugs for Respiratory Disorders

Drugs for Cough, Drugs for Bronchial Asthma

Hormones and Related Drugs

Anterior Pituitary Hormones, Drugs Altering Anterior Pituitary Hormone Secretion, Thyroid Hormone, Thyroid Inhibitors, Insulins, Oral Antidiabetic Drugs, Corticosteroids, Topical Steroids, Androgens and Related Drugs, Drugs for Erectile Dysfunction, Estrogens and Related Drugs, Progestins, Hormonal Contraceptives, Uterine Stimulants, Uterine Relaxants

Drugs Acting on Peripheral (somatic) Nervous System

Skeletal Muscle Relaxants, Local Anaesthetics

Drugs Acting on Central Nervous System

General Anaesthetics, Preanaesthetic Medication Drugs, Sedative-Hypnotic Drugs, Antiepileptic Drugs, Antiparkinsonian Drugs, Antipsychotic Drugs, Drugs for Mania and Bipolar Disorder, Hallucinogens, Antidepressants, Antianxiety Drugs, Opioid Analgesics and Antagonists, Central Nervous System (CNS) Stimulants, Cognition Enhancers

Cardiovascular Drugs

Antihypertensive Drugs, Antianginal Drugs, Drugs for Peripheral Vascular Diseases, Drugs for Congestive Heart Failure, Antiarrhythmic Drugs

Page 3: Contents (continued)
Pharmacological Classification of Drugs with Doses and Preparations

Drugs Acting on Kidney

Diuretics, Antidiuretics

Drugs Affecting Blood

Haematinics, Coagulants, Anticoagulants, Fibrinolytics, Antifibrinolytics, Antiplatelet Drugs, Hypolipidaemic Drugs, Plasma Expanders

Gastrointestinal Drugs

Drugs for Peptic Ulcer, Antiemetics, Laxatives, Drugs for Diarrhoea

Antibacterial Drugs

Antibacterial Drugs, Sulfonamides, Quinolone Antimicrobials, Penicillins, Cephalosporins, Monobactams, Carbapenems, Aminoglycoside Antibiotics, Tetracyclines, Chloramphenicol, Macrolide Antibiotics, Lincosamide Antibiotics, Aminocyclitol Antibiotic, Glycopeptide Antibiotics, Oxazolidinone, Polypeptide Antibiotics, Urinary Antiseptics, Antitubercular Drugs, Antileprotic Drugs

Antifungal, Antiviral, Antiprotozoal and Anthelmintic Drugs

Antifungal Drugs, Antiviral Drugs (Non-retroviral), Antiretrovirus Drugs, Antimalarial Drugs, Antiamoebic Drugs, Drugs for Giardiasis, Drugs for Trichomoniasis, Drugs for Leishmaniasis, Anthelmintic Drugs

Anticancer Drugs (Antineoplastic Drugs)

Miscellaneous Drugs

Immunosuppressant Drugs, Chelating Agents, Locally Acting Drugs on Skin and Mucous Membranes, Drugs for Aспе vulgaris, Antiseptics and Disinfectants, Ectoparasiticides, Vaccines, Antisera and Immune Globulins

Only based on the above classes and systems, generate the drug information in the specified JSON format.

**Important

Requirements:
- Make sure all the informations are from Authentic book katzung
- For the systems, use only the specified body systems that too relevant with mechanism of action of that drug
- Start drug id numbering from ${startId}
- Give detailed mechanism of action (moa) in stepwise manner
- For MOA, Uses, Side Effects, Contraindications and dosage use line breaks for clarity in long paragraphs, also you can use markdown formatting for better readability
- Provide comprehensive uses array
- Include detailed side effects array
- Add contraindications if applicable
- Include dosage information if relevant
- Add helpful mnemonics when possible
- If the drug name refers to multiple drugs or a drug class, provide information for the most common/representative drug
- Ensure all required fields are present and properly formatted
- Use only the specified body systems**
- Do not include any additional text or explanations
- Make sure to give special attention to their classes and systems
- Donot include any drug classes in the response, only the drugs themselves
- If the drug is a combination drug, provide information for each component separately
- If the drug is not found, return an empty array
Generate the drug information for the given drugs only not their classes (their classes may also be included here)"${drugName}":`;
  }

  private validateDrugObject(drug: any, index: number): void {
    const requiredFields = ['id', 'name', 'class', 'system', 'moa', 'uses', 'side_effects'];
    
    for (const field of requiredFields) {
      if (!drug[field]) {
        throw new Error(`Drug ${index + 1}: Missing required field '${field}'`);
      }
    }

    if (!Array.isArray(drug.uses)) {
      throw new Error(`Drug ${index + 1}: 'uses' must be an array`);
    }

    if (!Array.isArray(drug.side_effects)) {
      throw new Error(`Drug ${index + 1}: 'side_effects' must be an array`);
    }

    if (drug.contraindications && !Array.isArray(drug.contraindications)) {
      throw new Error(`Drug ${index + 1}: 'contraindications' must be an array`);
    }

    if (typeof drug.id !== 'number') {
      throw new Error(`Drug ${index + 1}: 'id' must be a number`);
    }
  }

  public async searchDrugInfo(drugName: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Gemini AI is not properly configured. Please check your API key.');
    }

    const searchPrompt = `Provide a brief overview of the drug "${drugName}" including its primary uses, mechanism of action, and key characteristics. Keep the response concise and factual.`;

    try {
      const result = await this.model.generateContent(searchPrompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.error('Error searching drug info:', error);
      throw new Error(`Failed to search drug information: ${error.message}`);
    }
  }
}

// Export a singleton instance
export const geminiService = new GeminiService();
export default geminiService;