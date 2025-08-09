# AI Drug Generator Setup Guide

This guide explains how to set up and use the new AI-powered drug generation feature integrated into the Drug Deck Web application.

## Overview

The AI Drug Generator uses Google's Gemini AI with built-in Google Search grounding to automatically generate comprehensive drug information from just a drug name. This feature is integrated into the admin panel's Data Importer.

## Features

- **AI-Powered Generation**: Uses Gemini 2.5 Flash model for accurate drug information
- **Google Search Grounding**: Leverages real-time web search for up-to-date medical information
- **Comprehensive Data**: Generates MOA, uses, side effects, contraindications, dosage, and mnemonics
- **Automatic Validation**: Validates generated data against the required schema
- **Seamless Integration**: Works directly with the existing data import system

## Setup Instructions

### 1. Get a Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Create a new API key
4. Copy the API key for use in your application

### 2. Configure Environment Variables

Add your Gemini API key to the `.env` file in your project root:

```env
# Gemini AI Configuration
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here
```

**Important**: Replace `your_gemini_api_key_here` with your actual Gemini API key.

### 3. Restart the Application

After adding the API key, restart your development server:

```bash
npm start
```

## How to Use

### Accessing the AI Drug Generator

1. Navigate to the Admin panel in your application
2. Go to the Data Importer section
3. You'll see the "🤖 AI Drug Generator (Powered by Gemini)" section at the top

### Generating Drug Data

1. **Enter Drug Name**: Type any drug name (generic or brand name) in the input field
   - Examples: "Aspirin", "Metformin", "Lisinopril", "Tylenol"

2. **Click Generate**: Press the "Generate" button or hit Enter

3. **Review Generated Data**: The AI will generate comprehensive drug information including:
   - Unique ID (automatically incremented)
   - Drug name and class
   - Body system classification
   - Mechanism of action (MOA)
   - Uses/indications
   - Side effects
   - Contraindications (if applicable)
   - Dosage information (if applicable)
   - Mnemonics (if applicable)

4. **Use or Discard**: 
   - Click "Use This Data" to add it to the JSON importer
   - Click "Discard" to generate new data

5. **Import**: Once satisfied with the data, use the regular import process

## Generated Data Format

The AI generates data in the exact format required by your application:

```json
[
  {
    "id": 1,
    "name": "Drug Name",
    "class": "Drug Class",
    "system": "Body System",
    "moa": "Detailed mechanism of action",
    "uses": ["Use 1", "Use 2", "Use 3"],
    "side_effects": ["Side effect 1", "Side effect 2"],
    "mnemonic": "Helpful mnemonic",
    "contraindications": ["Contraindication 1"],
    "dosage": "Dosage information"
  }
]
```

## Body Systems

The AI automatically classifies drugs into appropriate body systems:

- ANS (Autonomic Nervous System)
- CNS (Central Nervous System)
- CVS (Cardiovascular System)
- Renal
- Respiratory
- GIT (Gastrointestinal Tract)
- Endocrine
- Reproductive
- Hematological
- Immune
- Musculoskeletal
- Antimicrobial
- Antiparasitic
- Antiviral
- Antifungal
- Anticancer
- Dermatological
- Vitamins
- Toxicology
- Miscellaneous
- Vaccines

## Benefits

### 1. **Time Saving**
- Generate comprehensive drug data in seconds
- No need to manually research and format drug information

### 2. **Accuracy**
- Powered by Google's advanced AI with real-time search grounding
- Access to current medical information beyond the model's training cutoff

### 3. **Consistency**
- Automatically formatted data that matches your application's schema
- Consistent structure across all generated entries

### 4. **Comprehensive**
- Includes all required and optional fields
- Detailed mechanism of action and clinical information

## Troubleshooting

### "AI Generator not configured" Error
- **Cause**: Missing or invalid Gemini API key
- **Solution**: Check that `REACT_APP_GEMINI_API_KEY` is set correctly in your `.env` file

### "Failed to generate drug data" Error
- **Cause**: API request failed or invalid response
- **Solutions**:
  - Check your internet connection
  - Verify your API key is valid and has quota remaining
  - Try a different drug name
  - Check the browser console for detailed error messages

### Generated Data Validation Errors
- **Cause**: AI generated data that doesn't match the required schema
- **Solution**: The system will show specific validation errors. Try generating again or manually correct the JSON

## API Usage and Costs

- The feature uses Google's Gemini API with Google Search grounding
- Costs are based on API usage (tokens processed)
- Each drug generation typically uses a moderate amount of tokens
- Monitor your usage in the Google AI Studio dashboard

## Security Notes

- API keys should never be committed to version control
- The `.env` file is already included in `.gitignore`
- API keys are only used client-side for this implementation
- Consider server-side implementation for production environments with sensitive data

## Technical Details

### Files Modified/Added

1. **Services**:
   - `src/services/geminiService.ts` - Main Gemini AI integration
   - `src/services/googleSearchService.ts` - Google Search service (legacy, now using built-in grounding)

2. **Components**:
   - `src/components/admin/AIDrugGenerator.tsx` - AI drug generation UI component
   - `src/components/admin/DataImporter.tsx` - Updated to include AI generator

3. **Configuration**:
   - `.env` - Environment variables for API keys

### Dependencies Added

- `@google/generative-ai` - Official Google Gemini AI SDK

## Future Enhancements

Potential improvements for future versions:

1. **Batch Generation**: Generate multiple drugs at once
2. **Custom Prompts**: Allow users to customize the generation prompt
3. **Drug Interactions**: Include drug interaction information
4. **Image Support**: Generate or include drug images
5. **Multilingual Support**: Generate drug information in multiple languages
6. **Export Options**: Export generated data in various formats

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify your API key configuration
3. Ensure you have sufficient API quota
4. Try with different drug names
5. Check the network tab for failed API requests

For technical support, refer to:
- [Google Gemini API Documentation](https://ai.google.dev/gemini-api/docs)
- [Google AI Studio](https://aistudio.google.com/)