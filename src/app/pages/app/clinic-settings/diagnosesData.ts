// Diagnosis code library — consumed by the clinician notes diagnosis picker.
// Extracted from the old Diagnoses settings sub-page (now removed) since this
// data is used outside Clinic Settings.

export type Diagnosis = {
  id: string;
  name: string;
  code: string;
  category: string;
  frequency: number;
  status: "Active" | "Inactive";
  pinned?: boolean;
};

export const DIAGNOSIS_LIBRARY: Diagnosis[] = [
  { id: "1", name: "Essential Hypertension", code: "I10", category: "Cardiovascular", frequency: 23, status: "Active", pinned: true },
  { id: "2", name: "Type 2 Diabetes Mellitus", code: "E11", category: "Metabolic", frequency: 18, status: "Active", pinned: true },
  { id: "3", name: "Hyperlipidemia", code: "E78.5", category: "Metabolic", frequency: 15, status: "Active" },
  { id: "4", name: "BRCA1 Gene Mutation", code: "Z15.01", category: "Genetic", frequency: 8, status: "Active" },
  { id: "5", name: "Vitamin D Deficiency", code: "E55.9", category: "Metabolic", frequency: 12, status: "Active" },
  { id: "6", name: "Osteoporosis, unspecified", code: "M81.0", category: "Musculoskeletal", frequency: 6, status: "Active" },
  { id: "7", name: "Anxiety Disorder", code: "F41.9", category: "Neurological", frequency: 4, status: "Active" },
  { id: "8", name: "Iron Deficiency Anemia", code: "D50.9", category: "Metabolic", frequency: 2, status: "Inactive" },
];
