export type AssignmentDefault = {
  id: number;
  title: string;
  course?: string | null;
  due_date?: string | null;
  description?: string | null;
  rubric_summary?: string | null;
};

export const DEFAULT_ASSIGNMENTS: AssignmentDefault[] = [
  {
    id: 1,
    title: "Essay 1: Argumentative Essay",
    course: "ENG 101",
    due_date: "2025-11-21",
    description: "Write a 1000-word argumentative essay on a chosen topic.",
    rubric_summary:
      "Thesis (30%), Evidence (30%), Organization (20%), Mechanics (20%)",
  },
  {
    id: 2,
    title: "Lab Report: Heat Transfer",
    course: "PHY 210",
    due_date: "2025-11-25",
    description: "Submit your lab report including methods, results, and analysis.",
    rubric_summary:
      "Methods (25%), Data (25%), Analysis (30%), Presentation (20%)",
  },
  {
    id: 3,
    title: "Project: Data Visualization",
    course: "CS 150",
    due_date: "2025-12-01",
    description: "Create visualizations for the provided dataset and include a short write-up.",
    rubric_summary:
      "Correctness (30%), Clarity (30%), Creativity (20%), Documentation (20%)",
  },
];
