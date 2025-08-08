# Drug Data JSON Import Guide

This guide explains how to import drug data into your Drug Deck application using JSON format.

## Accessing the Import Tool

1. Navigate to the **Admin** tab in the bottom navigation (⚙️ icon)
2. Scroll down to the **Data Management** section
3. Use the **Drug Data Importer** component

## JSON Format Requirements

### Required Fields
Every drug object must include these fields:

```json
{
  "id": 1,                           // Unique number identifier
  "name": "Drug Name",               // String - drug name
  "class": "Drug Class",             // String - pharmacological class
  "system": "Body System",           // String - body system affected
  "moa": "Mechanism of action",      // String - how the drug works
  "uses": ["Use 1", "Use 2"],        // Array of strings - indications
  "side_effects": ["SE 1", "SE 2"]   // Array of strings - adverse effects
}
```

### Optional Fields
These fields can be included but are not required:

```json
{
  "mnemonic": "Memory aid",                    // String - learning aid
  "contraindications": ["Contra 1", "Contra 2"], // Array of strings
  "dosage": "Dosage information"               // String - dosing info
}
```

## Complete Example

```json
[
  {
    "id": 1,
    "name": "Atropine",
    "class": "Anticholinergic",
    "system": "ANS",
    "moa": "Competitive antagonist of muscarinic acetylcholine receptors",
    "uses": ["Bradycardia", "Organophosphate poisoning", "Mydriasis"],
    "side_effects": ["Dry mouth", "Blurred vision", "Tachycardia", "Confusion"],
    "mnemonic": "ATROPINE: Anticholinergic Toxicity Reduces Oral Production, Increases Nervous Excitement",
    "contraindications": ["Narrow-angle glaucoma", "Prostatic hypertrophy"],
    "dosage": "0.5-1mg IV/IM"
  },
  {
    "id": 2,
    "name": "Propranolol",
    "class": "Beta-blocker",
    "system": "ANS",
    "moa": "Non-selective beta-adrenergic receptor antagonist",
    "uses": ["Hypertension", "Anxiety", "Migraine prophylaxis"],
    "side_effects": ["Bradycardia", "Fatigue", "Cold extremities"],
    "mnemonic": "PROPRANOLOL: Prevents Rapid Onset, Protects Receptors, Antagonizes Norepinephrine",
    "contraindications": ["Asthma", "Heart block", "Severe heart failure"],
    "dosage": "40-320mg daily"
  }
]
```

## Import Process

1. **Prepare your JSON**: Ensure it follows the format above
2. **Validate**: The importer will check for required fields and proper array formats
3. **Import**: Click "Import Data" to add drugs to your Supabase database
4. **Verify**: Check the database statistics to confirm successful import

## Tips for Success

### ID Management
- Use unique IDs for each drug
- If importing updates to existing drugs, use the same ID to update rather than create duplicates
- Consider using a numbering system (e.g., 1000+ for custom drugs)

### Data Quality
- Keep drug names consistent with standard nomenclature
- Use standardized system names (e.g., "CVS", "CNS", "Respiratory")
- Ensure arrays contain strings, not other data types

### Large Imports
- The system processes data in batches of 50 drugs
- Large imports may take time - be patient
- If import fails, check the error message for specific issues

## Common Errors and Solutions

### "Missing required field"
- Ensure all required fields are present in every drug object
- Check for typos in field names (case-sensitive)

### "Must be an array"
- `uses`, `side_effects`, and `contraindications` must be arrays
- Use `["item1", "item2"]` format, not `"item1, item2"`

### "Invalid JSON format"
- Use a JSON validator to check syntax
- Common issues: missing commas, unmatched brackets, unescaped quotes

### "Duplicate ID"
- Each drug must have a unique ID
- Check for repeated IDs in your data

## Sample Data Templates

### Minimal Drug Entry
```json
[
  {
    "id": 999,
    "name": "Sample Drug",
    "class": "Sample Class",
    "system": "Sample System",
    "moa": "Sample mechanism",
    "uses": ["Sample use"],
    "side_effects": ["Sample side effect"]
  }
]
```

### Complete Drug Entry
```json
[
  {
    "id": 1000,
    "name": "Complete Drug Example",
    "class": "Example Class",
    "system": "Example System",
    "moa": "Detailed mechanism of action explanation",
    "uses": [
      "Primary indication",
      "Secondary indication",
      "Off-label use"
    ],
    "side_effects": [
      "Common side effect",
      "Serious side effect",
      "Rare side effect"
    ],
    "mnemonic": "Helpful memory device",
    "contraindications": [
      "Absolute contraindication",
      "Relative contraindication"
    ],
    "dosage": "Detailed dosing information with routes and frequencies"
  }
]
```

## Quick Actions

### Copy Sample JSON
Use the "Copy Sample JSON" button in the admin panel to get a template you can modify.

### Load Sample Data
Click "Load Sample Data" to see the format in the text area.

### Refresh Database Stats
After importing, click "Refresh" to update the drug count display.

## Troubleshooting

If you encounter issues:

1. **Check JSON syntax** using an online JSON validator
2. **Verify required fields** are present in all drug objects
3. **Ensure arrays are properly formatted** with square brackets
4. **Check for unique IDs** across all drugs
5. **Review error messages** for specific guidance

For additional help, check the browser console for detailed error messages during import.